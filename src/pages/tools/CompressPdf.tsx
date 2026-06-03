import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, formatBytes, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const tool = getTool("compress-pdf");

type Mode = "lossless" | "low" | "medium" | "high";

const MODES: Record<Mode, { label: string; sub: string; dpi?: number; quality?: number }> = {
  lossless: { label: "Lossless (recommended)", sub: "Keeps text searchable · safe for documents" },
  low: { label: "Low (image)", sub: "Best quality · slight reduction", dpi: 150, quality: 0.85 },
  medium: { label: "Medium (image)", sub: "Balanced quality and size", dpi: 110, quality: 0.7 },
  high: { label: "High (image)", sub: "Smallest file · lower quality", dpi: 80, quality: 0.55 },
};

export default function CompressPdf() {
  const [mode, setMode] = useState<Mode>("lossless");

  const process = async (files: File[], { setProgress, setStatus }: any) => {
    const file = files[0];
    await validatePdf(file);
    const original = file.size;

    setStatus("Reading PDF…");
    const data = new Uint8Array(await file.arrayBuffer());

    let compressed: Uint8Array;

    if (mode === "lossless") {
      setStatus("Optimising structure…");
      const doc = await PDFDocument.load(data, { updateMetadata: false });
      // Strip non-essential metadata to shrink size without touching content streams.
      try {
        doc.setTitle("");
        doc.setSubject("");
        doc.setKeywords([]);
        doc.setProducer("TurboPDF");
        doc.setCreator("TurboPDF");
      } catch {}
      setProgress(60);
      compressed = await doc.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 200 });
    } else {
      const settings = MODES[mode] as { dpi: number; quality: number };
      const pdf = await pdfjsLib.getDocument({ data: data.slice() }).promise;
      const total = pdf.numPages;
      const out = await PDFDocument.create();
      for (let i = 1; i <= total; i++) {
        setStatus(`Compressing page ${i} of ${total}…`);
        const page = await pdf.getPage(i);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: settings.dpi / 72 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d", { alpha: false })!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const blob: Blob = await new Promise((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error(`Failed to export page ${i}.`))), "image/jpeg", settings.quality),
        );
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const jpg = await out.embedJpg(bytes);
        const newPage = out.addPage([baseViewport.width, baseViewport.height]);
        newPage.drawImage(jpg, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
        canvas.width = canvas.height = 0;
        setProgress((i / total) * 95);
      }
      setStatus("Saving…");
      compressed = await out.save({ useObjectStreams: true });
    }

    const finalSize = compressed.byteLength;
    const reduction = Math.max(0, ((original - finalSize) / original) * 100);
    const name = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";

    if (finalSize < original) {
      downloadBlob(compressed, name);
    } else {
      // Always offer the file even if larger, so the user still gets the output.
      downloadBlob(compressed, name);
      return (
        <div className="text-sm text-muted-foreground">
          This PDF is already optimised — the output is the same size or slightly larger. Try a higher (image) compression level if you need a smaller file.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Original" value={formatBytes(original)} />
        <Stat label="Compressed" value={formatBytes(finalSize)} />
        <Stat label="Reduction" value={`${reduction.toFixed(1)}%`} accent />
      </div>
    );
  };

  const options = () => (
    <div>
      <Label className="text-sm font-semibold mb-3 block">Compression mode</Label>
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid sm:grid-cols-2 gap-3">
        {(Object.keys(MODES) as Mode[]).map((k) => (
          <label
            key={k}
            htmlFor={`mode-${k}`}
            className={`relative flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all ${
              mode === k ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"
            }`}
          >
            <RadioGroupItem id={`mode-${k}`} value={k} className="sr-only" />
            <span className="text-sm font-semibold">{MODES[k].label}</span>
            <span className="text-xs text-muted-foreground">{MODES[k].sub}</span>
          </label>
        ))}
      </RadioGroup>
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Lossless mode preserves all text, fonts and vector graphics. Image modes rasterise pages for maximum reduction — text becomes non-selectable.
      </p>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} options={options} />;
}

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="rounded-xl border border-border bg-secondary/40 p-4">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`mt-1 text-lg font-bold ${accent ? "text-gradient" : ""}`}>{value}</div>
  </div>
);
