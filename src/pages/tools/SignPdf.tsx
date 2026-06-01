import { useEffect, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Eraser, MousePointerClick } from "lucide-react";

const tool = getTool("sign-pdf");

export default function SignPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [posX, setPosX] = useState(60);
  const [posY, setPosY] = useState(85);
  const [sigW, setSigW] = useState(25);
  const [preview, setPreview] = useState<string | null>(null);

  const padRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!files[0]) { setPreview(null); setPageCount(1); return; }
    (async () => {
      const data = new Uint8Array(await files[0].arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      setPageCount(pdf.numPages);
      const target = Math.min(Math.max(1, page), pdf.numPages);
      const pg = await pdf.getPage(target);
      const vp = pg.getViewport({ scale: 1.1 });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
      if (!cancelled) setPreview(c.toDataURL("image/jpeg", 0.75));
    })();
    return () => { cancelled = true; };
  }, [files, page]);

  // Signature pad handlers
  const start = (x: number, y: number) => { drawing.current = true; const ctx = padRef.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (x: number, y: number) => { if (!drawing.current) return; const ctx = padRef.current!.getContext("2d")!; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#0f172a"; ctx.lineTo(x, y); ctx.stroke(); };
  const end = () => { if (drawing.current) { drawing.current = false; setSignature(padRef.current!.toDataURL("image/png")); } };
  const padPos = (e: React.PointerEvent) => { const r = padRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const clear = () => { const c = padRef.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setSignature(null); };
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setSignature(r.result as string); r.readAsDataURL(f);
  };

  // Drag the signature on the preview
  const setFromEvent = (e: React.PointerEvent) => {
    const el = previewWrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPosX(Math.max(0, Math.min(100, x)));
    setPosY(Math.max(0, Math.min(100, y)));
  };
  const startDrag = (e: React.PointerEvent) => { if (!signature) return; dragging.current = true; setFromEvent(e); (e.target as Element).setPointerCapture?.(e.pointerId); };
  const moveDrag = (e: React.PointerEvent) => { if (dragging.current) setFromEvent(e); };
  const endDrag = () => { dragging.current = false; };

  const process = async (files: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    if (!signature) throw new Error("Please draw or upload your signature.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const total = doc.getPageCount();
    const target = Math.min(Math.max(1, page), total) - 1;
    const sigBytes = Uint8Array.from(atob(signature.split(",")[1]), (c) => c.charCodeAt(0));
    const png = await doc.embedPng(sigBytes);
    const p = doc.getPage(target);
    const { width, height } = p.getSize();
    const w = (sigW / 100) * width;
    const h = (png.height / png.width) * w;
    const cx = (posX / 100) * width;
    const cy = (posY / 100) * height;
    // Clamp inside page bounds so the signature is never partly off-page.
    const x = Math.max(0, Math.min(width - w, cx - w / 2));
    const y = Math.max(0, Math.min(height - h, height - cy - h / 2));
    p.drawImage(png, { x, y, width: w, height: h });
    downloadBlob(await doc.save(), file.name.replace(/\.pdf$/i, "") + "-signed.pdf");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />

      <div className="space-y-2">
        <Label>Draw your signature</Label>
        <div className="rounded-xl border border-border bg-secondary/30 p-2">
          <canvas
            ref={padRef}
            width={600}
            height={180}
            className="w-full bg-background rounded-lg touch-none"
            onPointerDown={(e) => { const p = padPos(e); start(p.x, p.y); }}
            onPointerMove={(e) => { const p = padPos(e); move(p.x, p.y); }}
            onPointerUp={end}
            onPointerCancel={end}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={clear}><Eraser className="h-3.5 w-3.5 mr-1.5" /> Clear</Button>
          <label className="text-sm cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md border border-border hover:bg-secondary">
            Upload signature image
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUpload} />
          </label>
        </div>
      </div>

      {preview && (
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Live preview — page {page} of {pageCount}</p>
            {signature && <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> Drag to position</p>}
          </div>
          <div className="flex justify-center">
            <div
              ref={previewWrapRef}
              className="relative inline-block max-w-full select-none touch-none"
              style={{ maxHeight: 500 }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <img src={preview} alt="Page preview" draggable={false} className="block max-w-full max-h-[500px] rounded-md border border-border bg-white pointer-events-none" />
              {signature && (
                <img
                  src={signature}
                  alt=""
                  className="absolute pointer-events-none drop-shadow ring-2 ring-primary/40 rounded-sm"
                  style={{ left: `${posX}%`, top: `${posY}%`, width: `${sigW}%`, transform: "translate(-50%, -50%)" }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Place on page #</Label>
          <Input type="number" min={1} max={pageCount} value={page} onChange={(e) => setPage(Math.max(1, Math.min(pageCount, +e.target.value || 1)))} />
        </div>
        <div className="space-y-2">
          <Label>Signature width: {sigW}%</Label>
          <Slider value={[sigW]} min={10} max={60} step={1} onValueChange={(v) => setSigW(v[0])} />
        </div>
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Sign & Download" />;
}
