export const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export type DownloadEntry = { blob: Blob; name: string; type: string; size: number; at: number };
export const DOWNLOAD_EVENT = "turbopdf:download";

const counter: Record<string, number> = {};
/** Returns a unique filename within the current session — appends a short suffix if used before. */
export const uniqueFilename = (name: string) => {
  const base = name.replace(/\.([^./\\]+)$/i, "");
  const ext = (name.match(/\.([^./\\]+)$/i)?.[1]) || "";
  const key = name.toLowerCase();
  const n = (counter[key] = (counter[key] || 0) + 1);
  if (n === 1) return name;
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return ext ? `${base}-${stamp}-${n}.${ext}` : `${base}-${stamp}-${n}`;
};

export const downloadBlob = (data: Uint8Array | Blob, filename: string, type = "application/pdf") => {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type });
  const finalName = uniqueFilename(filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
  // Notify the layout so it can offer a permanent "Download again" button.
  try {
    const entry: DownloadEntry = { blob, name: finalName, type: blob.type || type, size: blob.size, at: Date.now() };
    window.dispatchEvent(new CustomEvent<DownloadEntry>(DOWNLOAD_EVENT, { detail: entry }));
  } catch {}
  return finalName;
};

export const validatePdf = async (file: File) => {
  if (!file) throw new Error("No file selected.");
  if (file.size === 0) throw new Error("The selected file is empty.");
  if (file.size > 200 * 1024 * 1024) throw new Error("File is larger than 200 MB. For larger files, consider using a desktop tool.");
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const sig = String.fromCharCode(...head);
  if (!sig.startsWith("%PDF-")) throw new Error("This file does not look like a valid PDF. Please upload a valid PDF file.");
  return true;
};

export const parsePageRanges = (input: string, total: number): number[] => {
  const set = new Set<number>();
  const clean = input.replace(/\s+/g, "");
  if (!clean) return [];
  for (const part of clean.split(",")) {
    if (part.includes("-")) {
      const parts = part.split("-");
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      const from = isFinite(a) ? Math.max(1, Math.min(a, total)) : 1;
      const to = isFinite(b) ? Math.max(from, Math.min(b, total)) : total;
      for (let i = from; i <= to; i++) set.add(i);
    } else {
      const n = Number(part);
      if (n >= 1 && n <= total) set.add(n);
    }
  }
  return [...set].sort((a, b) => a - b);
};

export const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
