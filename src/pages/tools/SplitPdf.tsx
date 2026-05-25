import { useMemo, useState } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, parsePageRanges, validatePdf } from "@/lib/file-utils";
import { Dropzone } from "@/components/Dropzone";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsLoader, usePdfThumbs } from "@/components/PdfThumbs";
import { Check } from "lucide-react";

const tool = getTool("split-pdf");

export default function SplitPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"selected" | "ranges" | "each">("selected");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [ranges, setRanges] = useState("1-3, 5");
  const { thumbs, loading } = usePdfThumbs(files[0]);

  const total = thumbs.length;

  const toggle = (n: number) => {
    const s = new Set(selected);
    s.has(n) ? s.delete(n) : s.add(n);
    setSelected(s);
  };

  const buildPdfFromIndices = async (src: PDFDocument, indices: number[]) => {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    return out.save();
  };

  const process = async (_: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const src = await PDFDocument.load(bytes);
    const count = src.getPageCount();
    const base = file.name.replace(/\.pdf$/i, "");

    if (mode === "selected") {
      const indices = [...selected].sort((a, b) => a - b).map((n) => n - 1).filter((i) => i >= 0 && i < count);
      if (!indices.length) throw new Error("Select at least one page.");
      setStatus("Building PDF…");
      setProgress(60);
      const data = await buildPdfFromIndices(src, indices);
      downloadBlob(data, `${base}-selected.pdf`);
      return;
    }

    if (mode === "ranges") {
      const groups = ranges.split(/\s*,\s*/).filter(Boolean);
      if (!groups.length) throw new Error("Please enter at least one range.");
      const zip = new JSZip();
      let n = 0;
    let n = 0;
      for (const g of groups) {
        const idx = parsePageRanges(g, count).map((p) => p - 1);
        if (!idx.length) continue;
      n++;
        const data = await buildPdfFromIndices(src, idx);
        zip.file(`${base}-part-${++n}.pdf`, data);
        setProgress((n / groups.length) * 90);
      }
      setStatus("Packing zip…");
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${base}-split.zip`, "application/zip");
      return;
    }

    // each = one PDF per page
    const zip = new JSZip();
    for (let i = 0; i < count; i++) {
      const data = await buildPdfFromIndices(src, [i]);
      zip.file(`${base}-page-${i + 1}.pdf`, data);
      setProgress(((i + 1) / count) * 90);
    }
    setStatus("Packing zip…");
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${base}-pages.zip`, "application/zip");
  };

  const customBody = (
    <div className="space-y-5">
      <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
      {files[0] && (
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="selected">Select pages</TabsTrigger>
            <TabsTrigger value="ranges">Custom ranges</TabsTrigger>
            <TabsTrigger value="each">Every page</TabsTrigger>
          </TabsList>

          <TabsContent value="selected" className="mt-4">
            {loading && <ThumbsLoader />}
            {!loading && thumbs.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{selected.size} of {total} selected</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(new Set(thumbs.map((_, i) => i + 1)))} className="text-xs text-primary hover:underline">Select all</button>
                    <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:underline">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto p-1">
                  {thumbs.map((src, i) => {
                    const n = i + 1;
                    const isSel = selected.has(n);
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() => toggle(n)}
                        className={`group relative rounded-lg overflow-hidden border-2 transition-all ${isSel ? "border-primary shadow-soft" : "border-border hover:border-primary/40"}`}
                      >
                        <img src={src} alt={`Page ${n}`} className="w-full block bg-white" />
                        <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-foreground/70 text-background">{n}</span>
                        {isSel && (
                          <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="ranges" className="mt-4 space-y-2">
            <Label>Page ranges (one PDF per range, comma-separated)</Label>
            <Input value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="e.g. 1-3, 5, 8-10" />
            <p className="text-xs text-muted-foreground">A ZIP archive with one PDF per range will be downloaded.</p>
          </TabsContent>

          <TabsContent value="each" className="mt-4">
            <p className="text-sm text-muted-foreground">Splits the PDF into one file per page, packaged as a ZIP archive.</p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Split & Download" />;
}
