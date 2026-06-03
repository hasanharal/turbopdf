import { useEffect, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument, degrees } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Dropzone } from "@/components/Dropzone";
import { Label } from "@/components/ui/label";
import { RotateCw } from "lucide-react";

const tool = getTool("rotate-pdf");

export default function RotatePdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [rotations, setRotations] = useState<number[]>([]); // per page additional rotation
  const [bulk, setBulk] = useState<90 | 180 | 270>(90);
  const docRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    if (!files[0]) { setThumbs([]); setRotations([]); docRef.current = null; return; }
    (async () => {
      const data = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      docRef.current = pdf;
      const out: string[] = [];
      const N = Math.min(pdf.numPages, 100);
      for (let i = 1; i <= N; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.5 });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
        out.push(c.toDataURL("image/jpeg", 0.8));
        c.width = 0; c.height = 0;
        if (cancelled) return;
      }
      if (!cancelled) { setThumbs(out); setRotations(Array.from({ length: pdf.numPages }, () => 0)); }
    })();
    return () => { cancelled = true; };
  }, [files]);

  const rotatePage = (i: number) => setRotations((arr) => arr.map((r, idx) => idx === i ? (r + 90) % 360 : r));
  const applyBulk = (angle: 0 | 90 | 180 | 270) => setRotations((arr) => arr.map(() => angle));

  const process = async () => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF first.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    doc.getPages().forEach((p, i) => {
      const extra = rotations[i] || 0;
      if (!extra) return;
      const cur = p.getRotation().angle;
      p.setRotation(degrees((cur + extra) % 360));
    });
    downloadBlob(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-rotated.pdf");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {thumbs.length > 0 && (
        <>
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <Label className="text-xs uppercase tracking-wide block mb-2">Apply to all pages</Label>
            <div className="flex flex-wrap gap-2">
              {([0, 90, 180, 270] as const).map((a) => (
                <button key={a} type="button" onClick={() => applyBulk(a)}
                  className="px-3 py-1.5 rounded-md border border-border hover:border-primary/60 text-xs font-semibold transition-colors">
                  {a === 0 ? "Reset" : `${a}°`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {thumbs.map((t, i) => (
              <button key={i} type="button" onClick={() => rotatePage(i)}
                className="group relative rounded-lg border border-border bg-card p-2 hover:border-primary transition-colors">
                <div className="flex items-center justify-center" style={{ height: 140 }}>
                  <img src={t} alt={`p${i + 1}`}
                    style={{ transform: `rotate(${rotations[i] || 0}deg)`, transition: "transform 0.2s" }}
                    className="max-h-full max-w-full rounded" />
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[11px] font-medium text-muted-foreground">P {i + 1}</span>
                  <span className="text-[11px] font-mono tabular-nums">{rotations[i] || 0}°</span>
                </div>
                <RotateCw className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Click any page to rotate +90°. Use "Apply to all pages" for bulk changes.</p>
        </>
      )}
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Rotate & Download" />;
}
