import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";

const tool = getTool("merge-pdf")!;

export default function MergePdf() {
  const process = async (files: File[]) => {
    if (files.length < 2) throw new Error("Please upload at least 2 PDF files to merge.");
    const merged = await PDFDocument.create();
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const src = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    const out = await merged.save();
    downloadBlob(out, "merged.pdf");
  };

  return <ToolPageLayout tool={tool} process={process} />;
}
