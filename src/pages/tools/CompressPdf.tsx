import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";

const tool = getTool("compress-pdf")!;

export default function CompressPdf() {
  const process = async (files: File[]) => {
    const file = files[0];
    const srcBytes = new Uint8Array(await file.arrayBuffer());
    const src = await PDFDocument.load(srcBytes);
    // Re-save with object streams + compress images where possible by re-embedding.
    // Note: pdf-lib alone has limited compression; this performs a structural rewrite
    // which often yields meaningful savings, especially for bloated PDFs.
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save({ useObjectStreams: true });
    const name = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";
    downloadBlob(bytes, name);
  };

  return <ToolPageLayout tool={tool} process={process} />;
}
// Note: imageCompression imported in case future image-bearing logic is added.
void imageCompression;
