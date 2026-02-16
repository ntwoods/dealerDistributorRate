import { mergeFileArrays, normalizeKey, safeJsonArray } from "./utils";

const SHEET_NAME = "DealerDocs";
const HEADERS = [
  "DealerName",
  "Station",
  "MarketingPerson",
  "FileIds",
  "FileNames",
  "UpdatedAt",
  "UpdatedBy",
];

async function parseError(response) {
  let message = `Request failed (${response.status})`;
  try {
    const data = await response.json();
    message = data?.error?.message || message;
  } catch {
    // Ignore parsing errors and keep default message.
  }
  return message;
}

async function googleApiFetch(url, { accessToken, method = "GET", body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function ensureDealerDocsSheet({ accessToken, sheetId }) {
  const metadata = await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties(title,sheetId)`,
    { accessToken }
  );

  const sheets = metadata?.sheets || [];
  const exists = sheets.some((sheet) => sheet?.properties?.title === SHEET_NAME);

  if (!exists) {
    await googleApiFetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      accessToken,
      method: "POST",
      body: {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAME,
              },
            },
          },
        ],
      },
    });
  }

  const headerRange = encodeURIComponent(`${SHEET_NAME}!A1:G1`);
  await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${headerRange}?valueInputOption=RAW`,
    {
      accessToken,
      method: "PUT",
      body: {
        range: `${SHEET_NAME}!A1:G1`,
        majorDimension: "ROWS",
        values: [HEADERS],
      },
    }
  );
}

function transformRows(values = []) {
  if (!values.length) {
    return [];
  }

  return values
    .slice(1)
    .map((row, index) => {
      const dealerName = row[0] || "";
      const station = row[1] || "";
      const marketingPerson = row[2] || "";
      const fileIds = safeJsonArray(row[3] || "[]");
      const fileNames = safeJsonArray(row[4] || "[]");
      const updatedAt = row[5] || "";
      const updatedBy = row[6] || "";

      if (!dealerName && !station && !marketingPerson && !fileIds.length && !fileNames.length) {
        return null;
      }

      return {
        rowNumber: index + 2,
        dealerName,
        station,
        marketingPerson,
        fileIds,
        fileNames,
        updatedAt,
        updatedBy,
      };
    })
    .filter(Boolean);
}

export async function fetchDealerDocs({ accessToken, sheetId }) {
  if (!accessToken) {
    throw new Error("Unauthorized: access token missing.");
  }

  await ensureDealerDocsSheet({ accessToken, sheetId });

  const range = encodeURIComponent(`${SHEET_NAME}!A:G`);
  const data = await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
    { accessToken }
  );

  return transformRows(data?.values || []);
}

export async function upsertDealerDocs({
  accessToken,
  sheetId,
  dealerName,
  station,
  marketingPerson,
  newFiles,
  email,
}) {
  if (!dealerName || !station) {
    throw new Error("Dealer name and station are required.");
  }

  await ensureDealerDocsSheet({ accessToken, sheetId });

  const range = encodeURIComponent(`${SHEET_NAME}!A:G`);
  const existing = await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
    { accessToken }
  );

  const records = transformRows(existing?.values || []);
  const target = records.find(
    (record) =>
      normalizeKey(record.dealerName) === normalizeKey(dealerName) &&
      normalizeKey(record.station) === normalizeKey(station)
  );

  const timestamp = new Date().toISOString();

  const merged = mergeFileArrays(target?.fileIds || [], target?.fileNames || [], newFiles || []);

  const rowPayload = [
    dealerName.trim(),
    station.trim(),
    marketingPerson.trim(),
    JSON.stringify(merged.fileIds),
    JSON.stringify(merged.fileNames),
    timestamp,
    String(email || "").trim().toLowerCase(),
  ];

  if (target?.rowNumber) {
    const rowRange = encodeURIComponent(`${SHEET_NAME}!A${target.rowNumber}:G${target.rowNumber}`);
    await googleApiFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rowRange}?valueInputOption=RAW`,
      {
        accessToken,
        method: "PUT",
        body: {
          range: `${SHEET_NAME}!A${target.rowNumber}:G${target.rowNumber}`,
          majorDimension: "ROWS",
          values: [rowPayload],
        },
      }
    );
    return { updated: true, rowNumber: target.rowNumber };
  }

  const appendRange = encodeURIComponent(`${SHEET_NAME}!A:G`);
  await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${appendRange}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      accessToken,
      method: "POST",
      body: {
        values: [rowPayload],
      },
    }
  );

  return { updated: false };
}

