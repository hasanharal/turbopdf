import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const tool = getTool("protect-pdf");

export default function ProtectPdf() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const process = async (files: File[]) => {
    const file = files[0];
    await validatePdf(file);
    if (password.length < 4) throw new Error("Password must be at least 4 characters.");
    if (password !== confirm) throw new Error("Passwords do not match.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await CantooPDFDocument.load(bytes);
    const data = await (doc as any).save({
      userPassword: password,
      ownerPassword: password,
      permissions: { printing: "highResolution" as const },
    });

    // Verify encryption was actually applied — scan the entire output for /Encrypt
    const full = new TextDecoder("latin1").decode(data);
    if (!/\/Encrypt\b/.test(full)) {
      throw new Error("Encryption could not be applied to this PDF in the browser. Please try a different file or use a desktop tool.");
    }

    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-protected.pdf");
  };

  const options = () => (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 4 characters" />
      </div>
      <div className="space-y-2">
        <Label>Confirm password</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} options={options} ctaLabel="Encrypt & Download" />;
}
