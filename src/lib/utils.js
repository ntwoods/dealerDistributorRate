import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function safeJsonArray(value) {
  if (!value || typeof value !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mergeFileArrays(existingIds, existingNames, newFiles) {
  const map = new Map();

  existingIds.forEach((id, index) => {
    if (id) {
      map.set(id, existingNames[index] || `Document ${index + 1}`);
    }
  });

  newFiles.forEach((file) => {
    if (file?.id) {
      map.set(file.id, file.name || map.get(file.id) || "Unnamed file");
    }
  });

  return {
    fileIds: Array.from(map.keys()),
    fileNames: Array.from(map.values()),
  };
}

