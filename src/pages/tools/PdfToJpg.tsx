import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import { useState } from "react";
import JSZip from "jszip";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const tool = getTool("pdf-to-jpg");

export default function PdfToJpg() {
  const [scale, setScale] = useState(2);

  const process = async (files: File[], { setProgress, setStatus }: any) => {
    const file = files[0];
    await validatePdf(file);
    setStatus("Reading PDF…");
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const zip = new JSZip();
    const base = file.name.replace(/\.pdf$/i, "");
    for (let i = 1; i <= pdf.numPages; i++) {
      setStatus(`Rendering page ${i} of ${pdf.numPages}…`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92)!);
      zip.file(`${base}-page-${String(i).padStart(3, "0")}.jpg`, blob);
      setProgress((i / pdf.numPages) * 90);
    }
    setStatus("Packaging ZIP…");
    const out = await zip.generateAsync({ type: "blob" });
    downloadBlob(out, `${base}-images.zip`, "application/zip");
  };

  const options = () => (
    <div className="space-y-2 max-w-md">
      <Label>Image quality (scale): {scale.toFixed(1)}×</Label>
      <Slider value={[scale]} min={1} max={3} step={0.5} onValueChange={(v) => setScale(v[0])} />
      <p className="text-xs text-muted-foreground">Higher values = sharper images, larger file size.</p>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} options={options} ctaLabel="Convert & Download ZIP" />;
}
