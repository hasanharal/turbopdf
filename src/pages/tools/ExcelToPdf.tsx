import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const tool = getTool("excel-to-pdf");

export default function ExcelToPdf() {
  const process = async (files: File[], { setStatus }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload an Excel file.");
    setStatus("Reading workbook…");
    const data = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(data, { type: "array" });

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const margin = 32;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    let firstSheet = true;
    for (const name of wb.SheetNames) {
      setStatus(`Rendering sheet: ${name}`);
      const sheet = wb.Sheets[name];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
      if (!rows.length) continue;
      if (!firstSheet) pdf.addPage();
      firstSheet = false;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(name, margin, margin + 4);

      const cols = Math.max(...rows.map((r) => r.length));
      const colW = (pageW - margin * 2) / Math.max(cols, 1);
      const rowH = 18;
      let y = margin + 22;

      pdf.setFontSize(9);
      for (let r = 0; r < rows.length; r++) {
        if (y + rowH > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
        const row = rows[r];
        pdf.setFont("helvetica", r === 0 ? "bold" : "normal");
        if (r === 0) {
          pdf.setFillColor(242, 244, 250);
          pdf.rect(margin, y - rowH + 4, pageW - margin * 2, rowH, "F");
        }
        for (let c = 0; c < cols; c++) {
          const x = margin + c * colW;
          pdf.setDrawColor(220);
          const txt = String(row[c] ?? "");
          const lines = pdf.splitTextToSize(txt, colW - 6);
          pdf.rect(x, y - rowH + 4, colW, rowH);
          pdf.text(lines[0] || "", x + 4, y - 2);
        }
        y += rowH;
      }
    }

    const blob = pdf.output("blob");
    downloadBlob(blob, file.name.replace(/\.(xlsx?|xls)$/i, "") + ".pdf");
  };

  return <ToolPageLayout tool={tool} process={process} ctaLabel="Convert to PDF" />;
}
