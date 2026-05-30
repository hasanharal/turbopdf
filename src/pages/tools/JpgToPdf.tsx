import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";

const tool = getTool("jpg-to-pdf")!;

const fileToBytes = (file: File) =>
  file.arrayBuffer().then((b) => new Uint8Array(b));

const decodeImageDims = (file: File): Promise<{ w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });

const isValidImage = async (file: File) => {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true;
  // WebP: "RIFF....WEBP"
  if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return true;
  return false;
};

export default function JpgToPdf() {
  const process = async (files: File[]) => {
    const pdf = await PDFDocument.create();
    for (const file of files) {
      if (!(await isValidImage(file))) {
        throw new Error(`"${file.name}" is not a valid JPG, PNG or WebP image.`);
      }
      const bytes = await fileToBytes(file);
      let embedded;
      if (file.type === "image/png") {
        embedded = await pdf.embedPng(bytes);
      } else if (file.type === "image/jpeg") {
        embedded = await pdf.embedJpg(bytes);
      } else {
        // Convert webp / others to png via canvas
        const dims = await decodeImageDims(file);
        const canvas = document.createElement("canvas");
        canvas.width = dims.w;
        canvas.height = dims.h;
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL("image/png");
        const b64 = dataUrl.split(",")[1];
        const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        embedded = await pdf.embedPng(buf);
      }
      const page = pdf.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    }
    const out = await pdf.save();
    downloadBlob(out, "images.pdf");
  };

  return <ToolPageLayout tool={tool} process={process} />;
}
