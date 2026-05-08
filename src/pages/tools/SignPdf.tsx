import { useEffect, useRef, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { dataUrlToBytes, downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eraser } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const tool = getTool("sign-pdf");

export default function SignPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [x, setX] = useState(70);
  const [y, setY] = useState(82);
  const [width, setWidth] = useState(32);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "hsl(222.2 84% 4.9%)";
  }, []);

  const start = (x: number, y: number) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (x: number, y: number) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => { drawing.current = false; };

  const getPos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvasRef.current!.width, y: ((e.clientY - r.top) / r.height) * canvasRef.current!.height };
  };

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setSignature(null);
  };

  const captureSignature = () => {
    setSignature(canvasRef.current!.toDataURL("image/png"));
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setSignature(r.result as string);
    r.readAsDataURL(f);
  };

  const process = async () => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    if (!signature) throw new Error("Please draw or upload your signature.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const pageCount = doc.getPageCount();
    const target = Math.min(Math.max(1, page), pageCount) - 1;
    const sigBytes = dataUrlToBytes(signature);
    const png = await doc.embedPng(sigBytes);
    const p = doc.getPage(target);
    const size = p.getSize();
    const w = Math.max(80, size.width * (width / 100));
    const h = (png.height / png.width) * w;
    p.drawImage(png, { x: (size.width - w) * (x / 100), y: Math.max(16, (size.height - h) * (y / 100)), width: w, height: h });
    const data = await doc.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-signed.pdf");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      <div className="space-y-2">
        <Label>Draw your signature</Label>
        <div className="rounded-xl border border-border bg-secondary/30 p-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="w-full bg-background rounded-lg touch-none"
            onPointerDown={(e) => { const p = getPos(e); start(p.x, p.y); }}
            onPointerMove={(e) => { const p = getPos(e); move(p.x, p.y); }}
            onPointerUp={() => { end(); captureSignature(); }}
            onPointerLeave={end}
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
      <div className="space-y-2 max-w-[180px]">
        <Label>Place on page #</Label>
        <Input type="number" min={1} value={page} onChange={(e) => setPage(+e.target.value || 1)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Horizontal: {x}%</Label><Slider value={[x]} min={0} max={100} step={1} onValueChange={(v) => setX(v[0])} /></div>
        <div className="space-y-2"><Label>Vertical: {y}%</Label><Slider value={[y]} min={0} max={100} step={1} onValueChange={(v) => setY(v[0])} /></div>
        <div className="space-y-2"><Label>Size: {width}%</Label><Slider value={[width]} min={12} max={70} step={1} onValueChange={(v) => setWidth(v[0])} /></div>
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Sign & Download" />;
}
