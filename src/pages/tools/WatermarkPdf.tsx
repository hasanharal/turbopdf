import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const tool = getTool("watermark-pdf");

export default function WatermarkPdf() {
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [position, setPosition] = useState("center");
  const [size, setSize] = useState(60);

  const process = async (files: File[]) => {
    const file = files[0];
    await validatePdf(file);
    if (!text.trim()) throw new Error("Watermark text cannot be empty.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      const tw = font.widthOfTextAtSize(text, size);
      let x = (width - tw) / 2;
      let y = height / 2;
      let rot = 0;
      if (position === "diagonal") { rot = 45; x = width / 4; y = height / 4; }
      else if (position === "top") { y = height - size - 24; }
      else if (position === "bottom") { y = 24; }
      page.drawText(text, {
        x, y, size, font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: opacity / 100,
        rotate: degrees(rot),
      });
    }
    const data = await doc.save();
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf");
  };

  const options = () => (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-2 sm:col-span-2">
        <Label>Watermark text</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={60} />
      </div>
      <div className="space-y-2">
        <Label>Position</Label>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="diagonal">Diagonal</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Font size: {size}pt</Label>
        <Slider value={[size]} min={20} max={140} step={2} onValueChange={(v) => setSize(v[0])} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Opacity: {opacity}%</Label>
        <Slider value={[opacity]} min={10} max={100} step={5} onValueChange={(v) => setOpacity(v[0])} />
      </div>
    </div>
  );

  return <ToolPageLayout tool={tool} process={process} options={options} />;
}
