import { useEffect, useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const tool = getTool("extract-images");

type Img = { name: string; url: string; blob: Blob };

export default function ExtractImages() {
  const [imgs, setImgs] = useState<Img[]>([]);

  useEffect(() => () => { imgs.forEach((i) => URL.revokeObjectURL(i.url)); }, [imgs]);

  const process = async (files: File[], { setProgress, setStatus }: any) => {
    const file = files[0];
    await validatePdf(file);
    setStatus("Scanning for images…");
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const collected: Img[] = [];
    const seen = new Set<string>();

    for (let p = 1; p <= pdf.numPages; p++) {
      setStatus(`Scanning page ${p} of ${pdf.numPages}…`);
      const page = await pdf.getPage(p);
      const ops = await page.getOperatorList();
      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
          const name = ops.argsArray[i][0];
          if (seen.has(name)) continue;
          seen.add(name);
          try {
            const obj: any = await new Promise((res) => {
              page.objs.get(name, res);
            });
            if (!obj || !obj.width || !obj.height) continue;
            const c = document.createElement("canvas");
            c.width = obj.width; c.height = obj.height;
            const ctx = c.getContext("2d")!;
            const id = ctx.createImageData(obj.width, obj.height);
            const src = obj.data;
            // Source may be RGBA, RGB or grayscale
            if (src.length === obj.width * obj.height * 4) {
              id.data.set(src);
            } else if (src.length === obj.width * obj.height * 3) {
              for (let j = 0, k = 0; j < src.length; j += 3, k += 4) {
                id.data[k] = src[j]; id.data[k + 1] = src[j + 1]; id.data[k + 2] = src[j + 2]; id.data[k + 3] = 255;
              }
            } else if (src.length === obj.width * obj.height) {
              for (let j = 0, k = 0; j < src.length; j++, k += 4) {
                id.data[k] = id.data[k + 1] = id.data[k + 2] = src[j]; id.data[k + 3] = 255;
              }
            } else continue;
            ctx.putImageData(id, 0, 0);
            const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png")!);
            collected.push({
              name: `image-p${p}-${collected.length + 1}.png`,
              url: URL.createObjectURL(blob),
              blob,
            });
          } catch {}
        }
      }
      setProgress((p / pdf.numPages) * 100);
    }

    if (!collected.length) throw new Error("No embedded images were found in this PDF.");
    setImgs(collected);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{collected.length} image{collected.length > 1 ? "s" : ""} extracted</p>
          <Button
            size="sm"
            onClick={async (files: File[], { setStatus, setProgress }: any) => {
              const zip = new JSZip();
              collected.forEach((img) => zip.file(img.name, img.blob));
              downloadBlob(await zip.generateAsync({ type: "blob" }), "extracted-images.zip", "application/zip");
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Download all (ZIP)
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {collected.map((img) => (
            <a
              key={img.name}
              href={img.url}
              download={img.name}
              className="group relative block rounded-lg overflow-hidden border border-border bg-secondary/30 hover:shadow-soft transition"
            >
              <img src={img.url} alt={img.name} className="w-full h-32 object-contain bg-white" />
              <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                <span className="text-xs text-white font-medium truncate">{img.name}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return <ToolPageLayout tool={tool} process={process} ctaLabel="Extract Images" />;
}
