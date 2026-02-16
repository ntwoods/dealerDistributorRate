async function parseError(response) {
  let message = `Request failed (${response.status})`;
  try {
    const data = await response.json();
    message = data?.error?.message || data?.message || message;
  } catch {
    // Ignore parsing error and keep default message.
  }
  return message;
}

export async function uploadFileToDrive({ file, accessToken, folderId }) {
  const boundary = `batch_${crypto.randomUUID()}`;
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const body = new Blob([
    `--${boundary}\r\n` +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name || file.name,
  };
}

export async function uploadFilesWithConcurrency({
  files,
  accessToken,
  folderId,
  concurrency = 3,
  onProgress,
}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const results = new Array(files.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= files.length) {
        return;
      }

      onProgress?.(current, { status: "uploading", progress: 15 });
      try {
        const uploaded = await uploadFileToDrive({
          file: files[current],
          accessToken,
          folderId,
        });
        results[current] = uploaded;
        onProgress?.(current, { status: "done", progress: 100, result: uploaded });
      } catch (error) {
        onProgress?.(current, {
          status: "error",
          progress: 100,
          error: error?.message || "Upload failed",
        });
        throw error;
      }
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, files.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

