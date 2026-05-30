import { useEffect, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Dropzone } from "@/components/Dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MousePointerClick } from "lucide-react";

const tool = getTool("watermark-pdf");

export default function WatermarkPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [size, setSize] = useState(60);
  const [diagonal, setDiagonal] = useState(false);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [preview, setPreview] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!files[0]) { setPreview(null); return; }
    (async () => {
      const data = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1.1 });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
      if (!cancelled) setPreview(c.toDataURL("image/jpeg", 0.75));
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

  const process = async (files: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    if (!text.trim()) throw new Error("Watermark text cannot be empty.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(text, size);
      const cx = (posX / 100) * width;
      const cy = height - (posY / 100) * height;
      const x = cx - tw / 2;
      const y = cy - size / 2;
      page.drawText(text, {
        x, y, size, font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: opacity / 100,
        rotate: degrees(diagonal ? 45 : 0),
      });
    }
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
            <div
              ref={wrapRef}
              className="relative inline-block max-w-full select-none touch-none"
              style={{ maxHeight: 500 }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <img src={preview} alt="Preview" draggable={false} className="block max-w-full max-h-[500px] rounded-md border border-border bg-white pointer-events-none" />
              <span
                className="absolute pointer-events-none whitespace-nowrap font-extrabold"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: `translate(-50%, -50%) rotate(${diagonal ? -45 : 0}deg)`,
                  fontSize: `${size * 0.95}px`,
                  color: "rgba(80,80,80,1)",
                  opacity: opacity / 100,
                  fontFamily: "Arial Black, Helvetica, sans-serif",
                }}
              >
                {text || " "}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Watermark text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={60} />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={diagonal} onCheckedChange={setDiagonal} id="diag" />
          <Label htmlFor="diag" className="cursor-pointer">Diagonal (45°)</Label>
        </div>
        <div className="space-y-2">
          <Label>Font size: {size}pt</Label>
          <Slider value={[size]} min={20} max={140} step={2} onValueChange={(v) => setSize(v[0])} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Opacity: {opacity}%</Label>
          <Slider value={[opacity]} min={10} max={100} step={5} onValueChange={(v) => setOpacity(v[0])} />
        </div>
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Add Watermark & Download" />;
}
