import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Dropzone } from "@/components/Dropzone";
import pixelmatch from "pixelmatch";

const tool = getTool("compare-pdf");

type DiffPage = { idx: number; left: string; right: string; diff: string; changed: number };

export default function ComparePdf() {
  const [a, setA] = useState<File[]>([]);
  const [b, setB] = useState<File[]>([]);

  const renderPage = async (doc: any, n: number, scale = 1) => {
    const page = await doc.getPage(n);
    const vp = page.getViewport({ scale });
    const c = document.createElement("canvas");
    c.width = vp.width; c.height = vp.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
    return { canvas: c, ctx };
  };

  const process = async (_: File[], { setStatus, setProgress }: any) => {
    if (!a[0] || !b[0]) throw new Error("Please upload two PDFs to compare.");
    await validatePdf(a[0]); await validatePdf(b[0]);

    setStatus("Loading PDFs…");
    const data1 = new Uint8Array(await a[0].arrayBuffer());
    const data2 = new Uint8Array(await b[0].arrayBuffer());
    const p1 = await pdfjsLib.getDocument({ data: data1 }).promise;
    const p2 = await pdfjsLib.getDocument({ data: data2 }).promise;
    const maxPages = Math.max(p1.numPages, p2.numPages);
    const pages = Math.min(maxPages, 25);
    const out: DiffPage[] = [];

    for (let i = 1; i <= pages; i++) {
      setStatus(`Comparing page ${i} of ${pages}…`);
      setProgress((i / pages) * 90);
      const left = i <= p1.numPages ? await renderPage(p1, i) : null;
      const right = i <= p2.numPages ? await renderPage(p2, i) : null;
      const w = Math.max(left?.canvas.width || 0, right?.canvas.width || 0);
      const h = Math.max(left?.canvas.height || 0, right?.canvas.height || 0);
      if (!w || !h) continue;
      const norm = (src?: HTMLCanvasElement) => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
        if (src) ctx.drawImage(src, 0, 0);
        return { c, ctx };
      };
      const L = norm(left?.canvas);
      const R = norm(right?.canvas);
      const diffC = document.createElement("canvas");
      diffC.width = w; diffC.height = h;
      const diffCtx = diffC.getContext("2d")!;
      const diffData = diffCtx.createImageData(w, h);
      const ld = L.ctx.getImageData(0, 0, w, h).data;
      const rd = R.ctx.getImageData(0, 0, w, h).data;
      const changed = pixelmatch(ld, rd, diffData.data, w, h, { threshold: 0.1, alpha: 0.4, includeAA: true });
      diffCtx.putImageData(diffData, 0, 0);
      out.push({
        idx: i,
        left: L.c.toDataURL("image/jpeg", 0.7),
        right: R.c.toDataURL("image/jpeg", 0.7),
        diff: diffC.toDataURL("image/png"),
        changed: Math.round((changed / (w * h)) * 1000) / 10,
      });
    }

    if (!out.length) throw new Error("Could not render any pages from these PDFs.");

    return (
      <div className="space-y-6">
        {out.map((r) => (
          <div key={r.idx} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Page {r.idx}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${r.changed > 0.1 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                {r.changed}% changed
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Original</p>
                <img src={r.left} className="w-full border border-border rounded-md" alt="A" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modified</p>
                <img src={r.right} className="w-full border border-border rounded-md" alt="B" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Differences</p>
                <img src={r.diff} className="w-full border border-border rounded-md bg-white" alt="Diff" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const customBody = (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">Original PDF</p>
          <Dropzone accept="application/pdf" files={a} onFiles={setA} cta="Upload original" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Modified PDF</p>
          <Dropzone accept="application/pdf" files={b} onFiles={setB} cta="Upload modified" />
        </div>
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Compare PDFs" />;
}
