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
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const blobFromCanvas = (canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.9) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export image.")), type, quality);
  });

export const dataUrlToBytes = (dataUrl: string) => {
  const [, base64 = ""] = dataUrl.split(",");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

export const validatePdf = async (file: File) => {
  if (!file) throw new Error("No file selected.");
  if (file.size > 200 * 1024 * 1024) throw new Error("File is larger than 200 MB.");
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const sig = String.fromCharCode(...head);
  if (sig !== "%PDF-") throw new Error("This file does not look like a valid PDF.");
};

export const parsePageRanges = (input: string, total: number): number[] => {
  const set = new Set<number>();
  const clean = input.replace(/\s+/g, "");
  if (!clean) return [];
  for (const part of clean.split(",")) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      const from = Math.max(1, Math.min(a || 1, total));
      const to = Math.max(from, Math.min(b || total, total));
      for (let i = from; i <= to; i++) set.add(i);
    } else {
      const n = Number(part);
      if (n >= 1 && n <= total) set.add(n);
    }
  }
  return [...set].sort((a, b) => a - b);
};
