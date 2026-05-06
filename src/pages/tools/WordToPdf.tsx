import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import mammoth from "mammoth";
import jsPDF from "jspdf";

const tool = getTool("word-to-pdf")!;

export default function WordToPdf() {
  const process = async (files: File[]) => {
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const { value: text } = await mammoth.extractRawText({ arrayBuffer });

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(text || " ", maxWidth);
    const lineHeight = 16;
    let y = margin;
    for (const line of lines) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }

    const blob = pdf.output("blob");
    downloadBlob(blob, file.name.replace(/\.docx?$/i, "") + ".pdf");
  };

  const helper = (
    <p className="text-xs text-muted-foreground">
      Converts the text content of your .docx file into a clean PDF. Complex formatting may not be preserved.
    </p>
  );

  return <ToolPageLayout tool={tool} process={process} helper={helper} />;
}
