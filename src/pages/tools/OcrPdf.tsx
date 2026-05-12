import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import Tesseract from "tesseract.js";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const tool = getTool("ocr-pdf");

const LANGS: { value: string; label: string }[] = [
  { value: "auto", label: "Auto-detect (multilingual)" },
  { value: "English", label: "English" },
  { value: "Urdu", label: "Urdu" },
  { value: "Arabic", label: "Arabic" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Chinese (Simplified)", label: "Chinese" },
  { value: "Hindi", label: "Hindi" },
  { value: "Russian", label: "Russian" },
];

// Preprocess canvas: grayscale, contrast boost, light sharpening — improves OCR on scans/photos
function preprocess(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  // Grayscale + adaptive contrast
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Contrast curve
    const c = Math.min(255, Math.max(0, (g - 128) * 1.3 + 140));
    d[i] = d[i + 1] = d[i + 2] = c;
  }
  ctx.putImageData(img, 0, 0);
}

async function canvasToBase64(c: HTMLCanvasElement, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    c.toBlob(async (blob) => {
      const buf = await blob!.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      resolve(`data:image/jpeg;base64,${btoa(bin)}`);
    }, "image/jpeg", quality);
  });
}

export default function OcrPdf() {
  const [text, setText] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [language, setLanguage] = useState("auto");

  const process = async (files: File[], { setProgress, setStatus }: any) => {
    const file = files[0];
    setText("");
    let pages: HTMLCanvasElement[] = [];

    if (file.type === "application/pdf") {
      await validatePdf(file);
      setStatus("Rasterizing PDF pages…");
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const scale = useAi ? 2 : 2.5; // higher for tesseract
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const c = document.createElement("canvas");
        c.width = viewport.width; c.height = viewport.height;
        const ctx = c.getContext("2d", { alpha: false })!;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport, canvas: c } as any).promise;
        if (!useAi) preprocess(c);
        pages.push(c);
        setProgress((i / pdf.numPages) * 25);
      }
    } else {
      setStatus("Loading image…");
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((r, e) => { img.onload = r; img.onerror = e; img.src = url; });
      const c = document.createElement("canvas");
      const maxDim = 2000;
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      c.width = Math.floor(img.width * ratio);
      c.height = Math.floor(img.height * ratio);
      const ctx = c.getContext("2d", { alpha: false })!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (!useAi) preprocess(c);
      pages = [c];
      URL.revokeObjectURL(url);
    }

    let collected = "";

    if (useAi) {
      setStatus("Running AI OCR (handwriting & multilingual)…");
      // Process in batches of 3 images per request to stay under payload limits
      const batchSize = 3;
      for (let i = 0; i < pages.length; i += batchSize) {
        const slice = pages.slice(i, i + batchSize);
        const images = await Promise.all(slice.map((c) => canvasToBase64(c)));
        const { data, error } = await supabase.functions.invoke("ai-ocr", {
          body: { images, language, mode: "structured" },
        });
        if (error) {
          // Fall back to tesseract for this batch
          console.warn("AI OCR failed, falling back to local OCR:", error);
          for (let j = 0; j < slice.length; j++) {
            const r = await Tesseract.recognize(slice[j], "eng");
            collected += `\n\n--- Page ${i + j + 1} ---\n${r.data.text}`;
          }
        } else {
          collected += `\n\n${data?.text || ""}`;
        }
        setProgress(25 + ((i + slice.length) / pages.length) * 70);
      }
    } else {
      setStatus("Recognizing text locally…");
      for (let i = 0; i < pages.length; i++) {
        const { data } = await Tesseract.recognize(pages[i], "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(25 + ((i + m.progress) / pages.length) * 70);
            }
          },
        });
        collected += `\n\n--- Page ${i + 1} ---\n${data.text}`;
      }
    }

    collected = collected.trim();
    if (!collected) throw new Error("No text could be extracted from this file.");
    setText(collected);
    downloadBlob(
      new Blob([collected], { type: "text/plain" }),
      file.name.replace(/\.[^.]+$/, "") + "-ocr.txt",
      "text/plain",
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            {useAi && <Sparkles className="h-4 w-4 text-primary" />} Extracted text
          </p>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(collected); toast.success("Copied to clipboard"); }}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
          </Button>
        </div>
        <Textarea value={collected} readOnly className="h-64 font-mono text-xs" />
      </div>
    );
  };

  const options = () => (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <div>
          <Label htmlFor="ai-ocr" className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI-powered OCR
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Recognizes handwriting, scans, blurry photos & 100+ languages. Recommended.
          </p>
        </div>
        <Switch id="ai-ocr" checked={useAi} onCheckedChange={setUseAi} />
      </div>
      {useAi && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">Document language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  // Override accept to also allow images for OCR
  const ocrTool = { ...tool, accept: "application/pdf,image/jpeg,image/png,image/webp" };

  return <ToolPageLayout tool={ocrTool} process={process} options={options} ctaLabel="Run OCR" />;
}
