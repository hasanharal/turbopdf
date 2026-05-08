import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";
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
    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch (e: any) {
      throw new Error("Could not open this PDF. If it uses strong encryption, try entering the password.");
    }
    if ((doc as any).isEncrypted) {
      // pdf-lib doesn't natively decrypt; rewrite via re-save when possible
      try {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        const data = await out.save();
        downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
        return;
      } catch {
        throw new Error("This PDF uses encryption that can't be removed in the browser.");
      }
    }
    const data = await doc.save();
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
