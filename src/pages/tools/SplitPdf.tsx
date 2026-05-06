import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";

const tool = getTool("split-pdf")!;

export default function SplitPdf() {
  const process = async (files: File[]) => {
    const file = files[0];
    const bytes = new Uint8Array(await file.arrayBuffer());
    const src = await PDFDocument.load(bytes);
    const total = src.getPageCount();

    // Split into individual pages and bundle into a sequence of downloads
    // To keep it simple in-browser, we generate one PDF per page and download them sequentially.
    for (let i = 0; i < total; i++) {
      const out = await PDFDocument.create();
      const [page] = await out.copyPages(src, [i]);
      out.addPage(page);
      const data = await out.save();
      downloadBlob(data, `${file.name.replace(/\.pdf$/i, "")}-page-${i + 1}.pdf`);
      // Tiny delay so browsers don't block multi-download
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  const helper = (
    <p className="text-xs text-muted-foreground">
      Splits the PDF into one file per page. Your browser may ask permission to download multiple files.
    </p>
  );

  return <ToolPageLayout tool={tool} process={process} helper={helper} />;
}
