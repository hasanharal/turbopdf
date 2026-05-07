import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
import { usePdfThumbs, ThumbsLoader } from "@/components/PdfThumbs";
import { Dropzone } from "@/components/Dropzone";
import { Trash2 } from "lucide-react";

const tool = getTool("delete-pages");

export default function DeletePages() {
  const [files, setFiles] = useState<File[]>([]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const file = files[0];
  const { thumbs, loading } = usePdfThumbs(file);

  const toggle = (i: number) => {
    const next = new Set(removed);
    next.has(i) ? next.delete(i) : next.add(i);
    setRemoved(next);
  };

  const process = async () => {
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    if (removed.size === 0) throw new Error("Select at least one page to delete.");
    if (removed.size >= thumbs.length) throw new Error("You can't delete every page.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const src = await PDFDocument.load(bytes);
    const out = await PDFDocument.create();
    const keep = src.getPageIndices().filter((i) => !removed.has(i));
    const pages = await out.copyPages(src, keep);
    pages.forEach((p) => out.addPage(p));
    const data = await out.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-edited.pdf");
  };

  const customBody = (
    <div className="space-y-4">
      <Dropzone accept="application/pdf" files={files} onFiles={(f) => { setFiles(f); setRemoved(new Set()); }} />
      {file && loading && <ThumbsLoader />}
      {file && !loading && thumbs.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Click pages to mark for deletion ({removed.size} selected)</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {thumbs.map((src, i) => {
              const active = removed.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                    active ? "border-destructive ring-2 ring-destructive/30" : "border-border hover:border-primary/60"
                  }`}
                >
                  <img src={src} alt={`Page ${i + 1}`} className={`w-full ${active ? "opacity-40" : ""}`} />
                  {active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                      <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 text-[10px] py-1 text-center bg-background/80 font-medium">
                    {i + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Delete Pages & Download" />;
}
