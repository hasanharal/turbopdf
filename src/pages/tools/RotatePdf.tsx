import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf, parsePageRanges } from "@/lib/file-utils";
import { PDFDocument, degrees } from "pdf-lib";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const tool = getTool("rotate-pdf");

export default function RotatePdf() {
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pages, setPages] = useState("");

  const process = async (files: File[]) => {
    const file = files[0];
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const total = doc.getPageCount();
    const targets = pages.trim() ? parsePageRanges(pages, total) : Array.from({ length: total }, (_, i) => i + 1);
    targets.forEach((n) => {
      const p = doc.getPage(n - 1);
      const cur = p.getRotation().angle;
      p.setRotation(degrees((cur + angle) % 360));
    });
    const data = await doc.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-rotated.pdf");
  };

  const options = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold mb-3 block">Rotation</Label>
        <div className="grid grid-cols-3 gap-2">
          {([90, 180, 270] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAngle(a)}
              className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                angle === a ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >{a}°</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Pages (e.g. 1,3-5) — leave empty for all</Label>
        <Input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="All pages" />
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} options={options} />;
}
