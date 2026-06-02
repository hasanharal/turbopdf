import { useEffect, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import { PDFDocument } from "pdf-lib";
import { Dropzone } from "@/components/Dropzone";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MousePointerClick } from "lucide-react";

const tool = getTool("crop-pdf");

type Crop = { left: number; right: number; top: number; bottom: number };

export default function CropPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ left: 5, right: 5, top: 5, bottom: 5 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!files[0]) { setPreview(null); return; }
    (async () => {
      const data = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1.2 });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
      if (!cancelled) setPreview(c.toDataURL("image/jpeg", 0.8));
    })();
    return () => { cancelled = true; };
  }, [files]);

  const startMarquee = (e: React.PointerEvent) => {
    const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    dragStart.current = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const moveMarquee = (e: React.PointerEvent) => {
    const el = wrapRef.current; if (!el || !dragStart.current) return;
    const r = el.getBoundingClientRect();
    const x2 = ((e.clientX - r.left) / r.width) * 100;
    const y2 = ((e.clientY - r.top) / r.height) * 100;
    const x1 = dragStart.current.x;
    const y1 = dragStart.current.y;
    const left = Math.max(0, Math.min(x1, x2));
    const right = Math.max(0, 100 - Math.max(x1, x2));
    const top = Math.max(0, Math.min(y1, y2));
    const bottom = Math.max(0, 100 - Math.max(y1, y2));
    setCrop({ left, right, top, bottom });
  };
  const endMarquee = () => { dragStart.current = null; };

  const process = async (_: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF first.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    for (const p of doc.getPages()) {
      const { width, height } = p.getSize();
      const lx = (crop.left / 100) * width;
      const rx = (crop.right / 100) * width;
      const ty = (crop.top / 100) * height;
      const by = (crop.bottom / 100) * height;
      const w = width - lx - rx;
      const h = height - ty - by;
      if (w > 10 && h > 10) p.setCropBox(lx, by, w, h);
    }
    downloadBlob(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-cropped.pdf");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {preview && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Live crop preview</p>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" /> Drag on the page to set crop area
            </p>
          </div>
          <div className="flex justify-center">
            <div
              ref={wrapRef}
              className="relative inline-block max-w-full select-none touch-none"
              onPointerDown={startMarquee}
              onPointerMove={moveMarquee}
              onPointerUp={endMarquee}
              onPointerCancel={endMarquee}
            >
              <img src={preview} alt="Page preview" draggable={false} className="max-w-full max-h-[500px] block rounded-md border border-border bg-white pointer-events-none" />
              {/* Dimmed area outside the crop */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bg-foreground/40" style={{ left: 0, right: 0, top: 0, height: `${crop.top}%` }} />
                <div className="absolute bg-foreground/40" style={{ left: 0, right: 0, bottom: 0, height: `${crop.bottom}%` }} />
                <div className="absolute bg-foreground/40" style={{ left: 0, top: `${crop.top}%`, bottom: `${crop.bottom}%`, width: `${crop.left}%` }} />
                <div className="absolute bg-foreground/40" style={{ right: 0, top: `${crop.top}%`, bottom: `${crop.bottom}%`, width: `${crop.right}%` }} />
                <div className="absolute border-2 border-primary rounded-sm" style={{ left: `${crop.left}%`, right: `${crop.right}%`, top: `${crop.top}%`, bottom: `${crop.bottom}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {(["left","right","top","bottom"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label className="capitalize">{k}: {crop[k].toFixed(0)}%</Label>
            <Slider value={[crop[k]]} min={0} max={45} onValueChange={(v) => setCrop({ ...crop, [k]: v[0] })} />
          </div>
        ))}
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Crop & Download" />;
}
