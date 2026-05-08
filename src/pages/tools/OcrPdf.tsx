import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import Tesseract from "tesseract.js";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildDocx } from "@/lib/docx";

const tool = getTool("ocr-pdf");

export default function OcrPdf() {
  const [text, setText] = useState("");

  const process = async (files: File[], { setProgress, setStatus }: any) => {
    const file = files[0];
    setText("");
    let pages: HTMLCanvasElement[] = [];

    if (file.type === "application/pdf") {
      await validatePdf(file);
      setStatus("Rasterizing PDF…");
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const c = document.createElement("canvas");
        c.width = viewport.width; c.height = viewport.height;
        const ctx = c.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas: c } as any).promise;
        pages.push(c);
        setProgress((i / pdf.numPages) * 30);
      }
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((r, e) => { img.onload = r; img.onerror = e; img.src = url; });
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      pages = [c];
      URL.revokeObjectURL(url);
    }

    setStatus("Recognizing text (OCR)…");
    const sections: { heading: string; body: string }[] = [];
    for (let i = 0; i < pages.length; i++) {
      const { data } = await Tesseract.recognize(pages[i], "eng", {
        tessedit_pageseg_mode: "1",
        preserve_interword_spaces: "1",
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(30 + ((i + m.progress) / pages.length) * 65);
          }
        },
      } as any);
      sections.push({ heading: `Page ${i + 1}`, body: data.text.trim() || " " });
    }
    const collected = sections.map((s) => `--- ${s.heading} ---\n${s.body}`).join("\n\n");
    setText(collected);
    const docx = await buildDocx(sections, `${file.name} OCR`);
    downloadBlob(docx, file.name.replace(/\.[^.]+$/, "") + "-ocr.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Extracted text</p>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(collected); toast.success("Copied to clipboard"); }}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
          </Button>
        </div>
        <Textarea value={collected} readOnly className="h-64 font-mono text-xs" />
      </div>
    );
  };

  return <ToolPageLayout tool={tool} process={process} ctaLabel="Run OCR" />;
}
