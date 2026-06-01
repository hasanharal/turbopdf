export const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const downloadBlob = (data: Uint8Array | Blob, filename: string, type = "application/pdf") => {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
};

export const validatePdf = async (file: File) => {
  if (!file) throw new Error("No file selected.");
  if (file.size === 0) throw new Error("The selected file is empty.");
  if (file.size > 200 * 1024 * 1024) throw new Error("File is larger than 200 MB. For larger files, consider using a desktop tool.");
  
  // Better PDF signature check with more bytes
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const sig = String.fromCharCode(...head);
  if (!sig.startsWith('%PDF-')) {
    throw new Error("This file does not look like a valid PDF. Please upload a valid PDF file.");
  }
  
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

// New helpers for better quality and bug fixes
export const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
};

export const showProcessingWarning = (pages: number, sizeMB: number) => {
  if (pages > 50 || sizeMB > 30) {
    console.warn(`Processing large document (${pages} pages, ${sizeMB}MB). This may take time or use high memory.`);
  }
};