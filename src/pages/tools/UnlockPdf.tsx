import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

const tool = getTool("unlock-pdf");

export default function UnlockPdf() {
  const [password, setPassword] = useState("");

  const process = async (files: File[], { setStatus }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Detect encryption via pdfjs
    setStatus("Checking PDF…");
    let isEncrypted = false;
    try {
      await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    } catch (e: any) {
      if (e?.name === "PasswordException") isEncrypted = true;
    }

    // Not actually encrypted: tell the user instead of producing a redundant file.
    if (!isEncrypted) {
      throw new Error("This PDF is not password-protected — no need to unlock it.");
    }

    if (!password) throw new Error("This PDF is encrypted. Please enter the password.");

    // Use @cantoo/pdf-lib which supports password decryption while preserving text
    setStatus("Decrypting…");
    let srcDoc: any;
    try {
      srcDoc = await (CantooPDFDocument as any).load(bytes, { password });
    } catch (e: any) {
      throw new Error("Incorrect password or unsupported encryption method.");
    }

    setStatus("Rebuilding PDF without password…");
    const out: any = await (CantooPDFDocument as any).create();
    const pages = await out.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach((p: any) => out.addPage(p));
    const data: Uint8Array = await out.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
  };

  const options = () => (
    <div className="space-y-2">
      <Label>Password (required for encrypted PDFs)</Label>
      <Input type="password" placeholder="Enter PDF password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p className="text-xs text-muted-foreground">Text remains selectable and searchable after unlocking.</p>
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
