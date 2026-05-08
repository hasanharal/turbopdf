import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

const tool = getTool("unlock-pdf");

export default function UnlockPdf() {
  const [password, setPassword] = useState("");

  const process = async (files: File[]) => {
    const file = files[0];
    await validatePdf(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    let doc: CantooPDFDocument;
    try {
      doc = await CantooPDFDocument.load(bytes, { ignoreEncryption: true, password: password || undefined });
    } catch (e: any) {
      throw new Error("Could not open this PDF. If it is encrypted, enter the correct password and try again.");
    }
    if ((doc as any).isEncrypted) {
      try {
        const out = await CantooPDFDocument.create();
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        const data = await out.save({ useObjectStreams: true });
        downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
        return;
      } catch {
        throw new Error("This PDF uses encryption that cannot be safely removed in the browser. Confirm the password is correct.");
      }
    }
    const data = await doc.save({ useObjectStreams: true });
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
  };

  const options = () => (
    <div className="space-y-2">
      <Label>Password (if known)</Label>
      <Input type="password" placeholder="Optional" value={password} onChange={(e) => setPassword(e.target.value)} />
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
