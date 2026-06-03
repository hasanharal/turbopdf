import { useEffect, useMemo, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf, parsePageRanges } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import { PDFDocument } from "pdf-lib";
import { Dropzone } from "@/components/Dropzone";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { MousePointerClick } from "lucide-react";

const tool = getTool("crop-pdf");

type Crop = { left: number; right: number; top: number; bottom: number };
const EMPTY: Crop = { left: 0, right: 0, top: 0, bottom: 0 };

export default function CropPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [pageIdx, setPageIdx] = useState(0); // 0-based
  const [mode, setMode] = useState<"all" | "current" | "range">("all");
  const [range, setRange] = useState("");
  const [crops, setCrops] = useState<Crop[]>([]); // per page
  const [shared, setShared] = useState<Crop>({ left: 5, right: 5, top: 5, bottom: 5 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const docRef = useRef<any>(null);

  // Load thumbs and prepare per-page crop state when file changes
  useEffect(() => {
    let cancelled = false;
    if (!files[0]) { setThumbs([]); setPreview(null); setCrops([]); docRef.current = null; return; }
    (async () => {
      const data = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      docRef.current = pdf;
      setCrops(Array.from({ length: pdf.numPages }, () => ({ ...shared })));
      const out: string[] = [];
      const N = Math.min(pdf.numPages, 60);
      for (let i = 1; i <= N; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.35 });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
        out.push(c.toDataURL("image/jpeg", 0.7));
        c.width = 0; c.height = 0;
        if (cancelled) return;
      }
      if (!cancelled) { setThumbs(out); setPageIdx(0); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Render high-quality preview for selected page (devicePixelRatio aware)
  useEffect(() => {
    let cancelled = false;
    if (!docRef.current) { setPreview(null); return; }
    (async () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const page = await docRef.current.getPage(pageIdx + 1);
      const vp = page.getViewport({ scale: 1.5 * dpr });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
      if (!cancelled) setPreview(c.toDataURL("image/jpeg", 0.85));
      c.width = 0; c.height = 0;
    })();
    return () => { cancelled = true; };
  }, [pageIdx, files]);

  const currentCrop = mode === "current" ? (crops[pageIdx] || EMPTY) : shared;
  const setCurrentCrop = (c: Crop) => {
    if (mode === "current") {
      setCrops((arr) => arr.map((x, i) => i === pageIdx ? c : x));
    } else {
      setShared(c);
    }
  };

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
    const x1 = dragStart.current.x, y1 = dragStart.current.y;
    setCurrentCrop({
      left: Math.max(0, Math.min(x1, x2)),
      right: Math.max(0, 100 - Math.max(x1, x2)),
      top: Math.max(0, Math.min(y1, y2)),
      bottom: Math.max(0, 100 - Math.max(y1, y2)),
    });
  };
  const endMarquee = () => { dragStart.current = null; };

  const process = async () => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF first.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const total = doc.getPageCount();
    let targets: Set<number>;
    if (mode === "all") targets = new Set(Array.from({ length: total }, (_, i) => i + 1));
    else if (mode === "current") targets = new Set([pageIdx + 1]);
    else targets = new Set(parsePageRanges(range, total));
    if (!targets.size) throw new Error("No pages selected to crop.");
    doc.getPages().forEach((p, i) => {
      if (!targets.has(i + 1)) return;
      const c = mode === "current" ? (crops[i] || EMPTY) : shared;
      const { width, height } = p.getSize();
      const lx = (c.left / 100) * width;
      const rx = (c.right / 100) * width;
      const ty = (c.top / 100) * height;
      const by = (c.bottom / 100) * height;
      const w = width - lx - rx;
      const h = height - ty - by;
      if (w > 10 && h > 10) p.setCropBox(lx, by, w, h);
    });
    downloadBlob(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-cropped.pdf");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {preview && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 text-sm">
            {(["all", "current", "range"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${mode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                {m === "all" ? "Apply to all pages" : m === "current" ? "Per-page crop" : "Custom range"}
              </button>
            ))}
          </div>
          {mode === "range" && (
            <div className="space-y-1.5">
              <Label>Pages (e.g. 1,3-5)</Label>
              <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="1,3-5" />
            </div>
          )}

          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Page {pageIdx + 1} of {thumbs.length}</p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" /> Drag to set crop area
              </p>
            </div>
            <div className="flex justify-center">
              <div ref={wrapRef} className="relative inline-block max-w-full select-none touch-none"
                onPointerDown={startMarquee} onPointerMove={moveMarquee} onPointerUp={endMarquee} onPointerCancel={endMarquee}>
                <img src={preview} alt="Page preview" draggable={false} className="max-w-full max-h-[520px] block rounded-md border border-border bg-white pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute bg-foreground/40" style={{ left: 0, right: 0, top: 0, height: `${currentCrop.top}%` }} />
                  <div className="absolute bg-foreground/40" style={{ left: 0, right: 0, bottom: 0, height: `${currentCrop.bottom}%` }} />
                  <div className="absolute bg-foreground/40" style={{ left: 0, top: `${currentCrop.top}%`, bottom: `${currentCrop.bottom}%`, width: `${currentCrop.left}%` }} />
                  <div className="absolute bg-foreground/40" style={{ right: 0, top: `${currentCrop.top}%`, bottom: `${currentCrop.bottom}%`, width: `${currentCrop.right}%` }} />
                  <div className="absolute border-2 border-primary rounded-sm" style={{ left: `${currentCrop.left}%`, right: `${currentCrop.right}%`, top: `${currentCrop.top}%`, bottom: `${currentCrop.bottom}%` }} />
                </div>
              </div>
            </div>
          </div>

          {thumbs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {thumbs.map((t, i) => (
                <button key={i} type="button" onClick={() => setPageIdx(i)}
                  className={`shrink-0 rounded-md border-2 transition-all ${i === pageIdx ? "border-primary" : "border-transparent hover:border-primary/40"}`}>
                  <img src={t} alt={`p${i + 1}`} className="h-24 rounded" />
                  <p className="text-[10px] text-center text-muted-foreground py-0.5">{i + 1}</p>
                </button>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {(["left", "right", "top", "bottom"] as const).map((k) => (
              <div key={k} className="space-y-2">
                <Label className="capitalize">{k}: {currentCrop[k].toFixed(0)}%</Label>
                <Slider value={[currentCrop[k]]} min={0} max={45} onValueChange={(v) => setCurrentCrop({ ...currentCrop, [k]: v[0] })} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Crop & Download" />;
}
