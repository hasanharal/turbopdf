import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Shield, Calendar, User, Hash, FileType2, Eye, EyeOff } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Dropzone } from "@/components/Dropzone";
import { Seo } from "@/components/Seo";
import { getTool } from "@/lib/tools";
import { pdfjsLib } from "@/lib/pdf-worker";
import { validatePdf, formatBytes } from "@/lib/file-utils";

const tool = getTool("pdf-reader");

type Meta = {
  fileName: string;
  fileSize: number;
  pages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  pdfVersion?: string;
  encrypted: boolean;
  permissions?: string[];
  pageSizes: { width: number; height: number; label: string }[];
};

const fmtDate = (d: any) => {
  if (!d) return undefined;
  try {
    if (d instanceof Date) return d.toLocaleString();
    const s = String(d);
    // Try parse "D:YYYYMMDDHHmmSS..."
    const m = s.match(/^D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
    if (m) {
      const dt = new Date(+m[1], +(m[2] || 1) - 1, +(m[3] || 1), +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
      return dt.toLocaleString();
    }
    return s;
  } catch { return undefined; }
};

const sizeLabel = (w: number, h: number) => {
  // Approximate to common sizes (points: 1in = 72pt)
  const close = (a: number, b: number) => Math.abs(a - b) < 8;
  if ((close(w, 612) && close(h, 792)) || (close(w, 792) && close(h, 612))) return "Letter";
  if ((close(w, 612) && close(h, 1008)) || (close(w, 1008) && close(h, 612))) return "Legal";
  if ((close(w, 595) && close(h, 842)) || (close(w, 842) && close(h, 595))) return "A4";
  if ((close(w, 420) && close(h, 595)) || (close(w, 595) && close(h, 420))) return "A5";
  return "Custom";
};

export default function PdfReader() {
  const [files, setFiles] = useState<File[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const file = files[0];
    if (!file) { setMeta(null); setError(""); return; }
    let cancelled = false;
    (async () => {
      try {
        await validatePdf(file);
        const data = new Uint8Array(await file.arrayBuffer());
        const doc = await pdfjsLib.getDocument({ data }).promise;
        const info: any = await doc.getMetadata().catch(() => ({}));
        const i = info?.info || {};
        const perms = await doc.getPermissions().catch(() => null);
        const permLabels = perms
          ? Object.entries({
              1: "Print",
              2: "Modify",
              4: "Copy",
              8: "Annotate",
              16: "Fill forms",
              32: "Extract content",
              256: "Assemble",
              512: "High-quality print",
            }).filter(([k]) => (perms as any[]).includes(+k)).map(([, v]) => v as string)
          : ["All permissions granted"];

        const pageSizes: Meta["pageSizes"] = [];
        const N = Math.min(doc.numPages, 200);
        for (let p = 1; p <= N; p++) {
          const page = await doc.getPage(p);
          const vp = page.getViewport({ scale: 1 });
          pageSizes.push({ width: vp.width, height: vp.height, label: sizeLabel(vp.width, vp.height) });
        }

        if (cancelled) return;
        setMeta({
          fileName: file.name,
          fileSize: file.size,
          pages: doc.numPages,
          title: i.Title || undefined,
          author: i.Author || undefined,
          subject: i.Subject || undefined,
          keywords: i.Keywords || undefined,
          creator: i.Creator || undefined,
          producer: i.Producer || undefined,
          creationDate: fmtDate(i.CreationDate),
          modDate: fmtDate(i.ModDate),
          pdfVersion: i.PDFFormatVersion || undefined,
          encrypted: !!i.IsAcroFormPresent === false && !!(info?.info?.EncryptFilterName) || false,
          permissions: permLabels,
          pageSizes,
        });
        setError("");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not read PDF.");
      }
    })();
    return () => { cancelled = true; };
  }, [files]);

  const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | number }) =>
    value ? (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-0">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-sm font-medium break-words">{String(value)}</p>
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="PDF Metadata Viewer — Inspect PDF Properties | TurboPDF" description="View detailed metadata, properties, page statistics, encryption status and permissions of any PDF." canonical="https://turbopdf-lab.vercel.app/pdf-reader" />
      <Navbar />
      <main className="flex-1">
        <section className="container-tight pt-10 pb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" /> Back to all tools
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">PDF Metadata Viewer</h1>
          <p className="mt-2 text-muted-foreground">Inspect document properties, page sizes, encryption, permissions and embedded metadata.</p>
        </section>

        <section className="container-tight pb-16">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-soft space-y-5">
            <Dropzone accept="application/pdf" files={files} onFiles={setFiles} />
            {error && <p className="text-sm text-destructive">{error}</p>}

            {meta && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pages</p>
                    <p className="text-2xl font-bold mt-1">{meta.pages}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">File size</p>
                    <p className="text-2xl font-bold mt-1">{formatBytes(meta.fileSize)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">PDF version</p>
                    <p className="text-2xl font-bold mt-1">{meta.pdfVersion || "—"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Document properties</h3>
                  <Row icon={FileType2} label="File name" value={meta.fileName} />
                  <Row icon={FileText} label="Title" value={meta.title} />
                  <Row icon={User} label="Author" value={meta.author} />
                  <Row icon={FileText} label="Subject" value={meta.subject} />
                  <Row icon={Hash} label="Keywords" value={meta.keywords} />
                  <Row icon={FileText} label="Creator app" value={meta.creator} />
                  <Row icon={FileText} label="Producer" value={meta.producer} />
                  <Row icon={Calendar} label="Created" value={meta.creationDate} />
                  <Row icon={Calendar} label="Modified" value={meta.modDate} />
                </div>

                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4" /> Security & permissions</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {meta.encrypted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive"><EyeOff className="h-3 w-3" /> Encrypted</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success"><Eye className="h-3 w-3" /> Not encrypted</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {meta.permissions?.map((p) => (
                      <span key={p} className="text-xs px-2 py-1 rounded-md bg-secondary border border-border">{p}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <h3 className="font-semibold mb-3">Page statistics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Array.from(new Set(meta.pageSizes.map((p) => p.label))).map((lbl) => {
                      const count = meta.pageSizes.filter((p) => p.label === lbl).length;
                      const ex = meta.pageSizes.find((p) => p.label === lbl)!;
                      return (
                        <div key={lbl} className="rounded-lg border border-border bg-secondary/40 p-2.5">
                          <p className="font-semibold">{lbl}</p>
                          <p className="text-muted-foreground">{count} page{count > 1 ? "s" : ""}</p>
                          <p className="text-muted-foreground tabular-nums">{Math.round(ex.width)}×{Math.round(ex.height)}pt</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
