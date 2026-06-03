import { useEffect, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf, parsePageRanges } from "@/lib/file-utils";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Dropzone } from "@/components/Dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MousePointerClick } from "lucide-react";

const tool = getTool("watermark-pdf");
type Align = "tl" | "t" | "tr" | "l" | "c" | "r" | "bl" | "b" | "br";
const ALIGN_MAP: Record<Align, [number, number]> = {
  tl: [10, 10], t: [50, 10], tr: [90, 10],
  l: [10, 50], c: [50, 50], r: [90, 50],
  bl: [10, 90], b: [50, 90], br: [90, 90],
};

export default function WatermarkPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [size, setSize] = useState(60);
  const [rotation, setRotation] = useState(0);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [pageMode, setPageMode] = useState<"all" | "odd" | "even" | "range">("all");
  const [pageRange, setPageRange] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!files[0]) { setPreview(null); return; }
    (async () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const data = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1.2 * dpr });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
      if (!cancelled) setPreview(c.toDataURL("image/jpeg", 0.85));
      c.width = 0; c.height = 0;
    })();
    return () => { cancelled = true; };
  }, [files]);

  const setFromEvent = (e: React.PointerEvent) => {
    const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPosX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
    setPosY(Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)));
  };
  const startDrag = (e: React.PointerEvent) => { dragging.current = true; setFromEvent(e); (e.target as Element).setPointerCapture?.(e.pointerId); };
  const moveDrag = (e: React.PointerEvent) => { if (dragging.current) setFromEvent(e); };
  const endDrag = () => { dragging.current = false; };

  const applyAlign = (a: Align) => { const [x, y] = ALIGN_MAP[a]; setPosX(x); setPosY(y); };

  const process = async () => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF first.");
    await validatePdf(file);
    if (!text.trim()) throw new Error("Watermark text cannot be empty.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const total = doc.getPageCount();
    let targets: Set<number>;
    if (pageMode === "all") targets = new Set(Array.from({ length: total }, (_, i) => i + 1));
    else if (pageMode === "odd") targets = new Set(Array.from({ length: total }, (_, i) => i + 1).filter((n) => n % 2 === 1));
    else if (pageMode === "even") targets = new Set(Array.from({ length: total }, (_, i) => i + 1).filter((n) => n % 2 === 0));
    else targets = new Set(parsePageRanges(pageRange, total));
    if (!targets.size) throw new Error("No pages selected for watermarking.");

    const rad = (rotation * Math.PI) / 180;
    doc.getPages().forEach((page, idx) => {
      if (!targets.has(idx + 1)) return;
      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(text, size);
      const cx = (posX / 100) * width;
      const cy = height - (posY / 100) * height;
      // Rotate around center: compute starting baseline so text is centered
      const x = cx - (tw / 2) * Math.cos(rad) + (size / 2) * Math.sin(rad);
      const y = cy - (tw / 2) * Math.sin(rad) - (size / 2) * Math.cos(rad);
      page.drawText(text, {
        x, y, size, font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: opacity / 100,
        rotate: degrees(rotation),
      });
    });
    downloadBlob(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {preview && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Live preview (page 1)</p>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> Drag to reposition</p>
          </div>
          <div className="flex justify-center">
            <div ref={wrapRef} className="relative inline-block max-w-full select-none touch-none"
              onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
              <img src={preview} alt="Preview" draggable={false} className="block max-w-full max-h-[520px] rounded-md border border-border bg-white pointer-events-none" />
              <span className="absolute pointer-events-none whitespace-nowrap font-extrabold"
                style={{
                  left: `${posX}%`, top: `${posY}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  fontSize: `${size * 1.2}px`,
                  color: "rgba(80,80,80,1)", opacity: opacity / 100,
                  fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700,
                }}>
                {text || " "}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Watermark text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wide">Alignment</Label>
          <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
            {(["tl","t","tr","l","c","r","bl","b","br"] as Align[]).map((a) => (
              <button key={a} type="button" onClick={() => applyAlign(a)}
                className="aspect-square rounded-md border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors"
                aria-label={`Align ${a}`}>
                <span className="block h-1.5 w-1.5 rounded-full bg-foreground/60 mx-auto" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>X position: {posX.toFixed(0)}%</Label>
          <Slider value={[posX]} min={0} max={100} step={1} onValueChange={(v) => setPosX(v[0])} />
        </div>
        <div className="space-y-2">
          <Label>Y position: {posY.toFixed(0)}%</Label>
          <Slider value={[posY]} min={0} max={100} step={1} onValueChange={(v) => setPosY(v[0])} />
        </div>
        <div className="space-y-2">
          <Label>Rotation: {rotation}°</Label>
          <Slider value={[rotation]} min={-180} max={180} step={5} onValueChange={(v) => setRotation(v[0])} />
        </div>
        <div className="space-y-2">
          <Label>Font size: {size}pt</Label>
          <Slider value={[size]} min={20} max={180} step={2} onValueChange={(v) => setSize(v[0])} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Opacity: {opacity}%</Label>
          <Slider value={[opacity]} min={10} max={100} step={5} onValueChange={(v) => setOpacity(v[0])} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wide">Apply to pages</Label>
          <div className="grid grid-cols-4 gap-2">
            {(["all","odd","even","range"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPageMode(m)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all ${pageMode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          {pageMode === "range" && (
            <Input value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g. 1,3-5" className="mt-2" />
          )}
        </div>
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Add Watermark & Download" />;
}
