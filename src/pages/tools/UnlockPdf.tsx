import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

const tool = getTool("unlock-pdf");

export default function UnlockPdf() {
  const [password, setPassword] = useState("");

  const process = async (files: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Strategy 1: try pdf-lib direct re-save (works for many "owner-locked" PDFs)
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => out.addPage(p));
      const data = await out.save();
      downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
      return;
    } catch {
      // fall through to pdfjs rasterization
    }

    setStatus("Decrypting with password…");
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: bytes, password: password || undefined }).promise;
    } catch (e: any) {
      if (e?.name === "PasswordException") throw new Error("Incorrect or missing password.");
      throw new Error("Could not open this PDF. It may use unsupported encryption.");
    }

    const out = await PDFDocument.create();
    for (let i = 1; i <= pdf.numPages; i++) {
      setStatus(`Rebuilding page ${i} of ${pdf.numPages}…`);
      setProgress((i / pdf.numPages) * 90);
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 2 });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
      const jpg = c.toDataURL("image/jpeg", 0.92);
      const img = await out.embedJpg(Uint8Array.from(atob(jpg.split(",")[1]), (ch) => ch.charCodeAt(0)));
      const newPage = out.addPage([vp.width, vp.height]);
      newPage.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
    }
    const data = await out.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
  };

  const options = () => (
    <div className="space-y-2">
      <Label>Password (required for encrypted PDFs)</Label>
      <Input type="password" placeholder="Enter PDF password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p className="text-xs text-muted-foreground">Owner-locked PDFs unlock instantly. Strongly encrypted PDFs are decrypted using your password.</p>
    </div>
  );

  const helper = (
    <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-secondary/60 border border-border">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <span>Only remove passwords from PDFs you legally own or are authorized to modify.</span>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} options={options} helper={helper} />;
}
