import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import jsPDF from "jspdf";
import JSZip from "jszip";

const tool = getTool("powerpoint-to-pdf");

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
   .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
   .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
   .replace(/&amp;/g, "&");

// Parse text runs as ordered paragraphs while keeping role hints (title vs body)
function parseShapes(xml: string): { kind: "title" | "body"; text: string }[] {
  const out: { kind: "title" | "body"; text: string }[] = [];
  const spRe = /<p:sp>[\s\S]*?<\/p:sp>/g;
  let m;
  while ((m = spRe.exec(xml)) !== null) {
    const sp = m[0];
    const isTitle = /<p:ph[^>]*type="(title|ctrTitle)"/.test(sp);
    const paraRe = /<a:p[\s\S]*?<\/a:p>/g;
    let p;
    while ((p = paraRe.exec(sp)) !== null) {
      const txt = Array.from(p[0].matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)).map((x) => decodeXml(x[1])).join("");
      const t = txt.trim();
      if (t) out.push({ kind: isTitle ? "title" : "body", text: t });
    }
  }
  // Fallback: any text not inside <p:sp>
  if (out.length === 0) {
    const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    let t;
    while ((t = re.exec(xml)) !== null) {
      const s = decodeXml(t[1]).trim();
      if (s) out.push({ kind: "body", text: s });
    }
  }
  return out;
}

// Try to extract slide background color hex
function parseBg(xml: string): string | null {
  const m = xml.match(/<p:bg[\s\S]*?<a:srgbClr val="([0-9A-Fa-f]{6})"/);
  return m ? m[1] : null;
}

// Find embedded images via slide rels
async function getSlideImages(zip: JSZip, slideName: string): Promise<{ data: string; type: string }[]> {
  const rels = zip.file(`ppt/slides/_rels/${slideName}.rels`);
  if (!rels) return [];
  const xml = await rels.async("string");
  const matches = Array.from(xml.matchAll(/Target="(\.\.\/media\/[^"]+)"/g));
  const out: { data: string; type: string }[] = [];
  for (const m of matches) {
    const path = "ppt/" + m[1].replace(/^\.\.\//, "");
    const f = zip.file(path);
    if (!f) continue;
    const ext = (path.split(".").pop() || "").toLowerCase();
    if (!["png", "jpg", "jpeg"].includes(ext)) continue;
    const buf = await f.async("base64");
    out.push({ data: `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buf}`, type: ext === "png" ? "PNG" : "JPEG" });
  }
  return out;
}

export default function PowerpointToPdf() {
  const process = async (files: File[], { setProgress, setStatus }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PowerPoint file.");
    if (!/\.pptx$/i.test(file.name)) throw new Error("Only .pptx files are supported in the browser. Please save as .pptx and retry.");
    setStatus("Reading slides…");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => +a.match(/slide(\d+)\.xml/)![1] - +b.match(/slide(\d+)\.xml/)![1]);
    if (!slideFiles.length) throw new Error("No slides found inside the file.");

    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });
    const W = 960, H = 540, margin = 48;

    for (let i = 0; i < slideFiles.length; i++) {
      setStatus(`Rendering slide ${i + 1} of ${slideFiles.length}…`);
      const slidePath = slideFiles[i];
      const slideName = slidePath.split("/").pop()!.replace(".xml", "");
      const xml = await zip.file(slidePath)!.async("string");
      const blocks = parseShapes(xml);
      const bg = parseBg(xml);
      const images = await getSlideImages(zip, slideName);

      if (i > 0) pdf.addPage();
      // Background
      if (bg) {
        const r = parseInt(bg.substring(0, 2), 16);
        const g = parseInt(bg.substring(2, 4), 16);
        const b = parseInt(bg.substring(4, 6), 16);
        pdf.setFillColor(r, g, b);
      } else { pdf.setFillColor(255, 255, 255); }
      pdf.rect(0, 0, W, H, "F");

      // Place first image as right-side hero if present
      let textRight = W - margin;
      if (images[0]) {
        try {
          const imgW = 360, imgH = 240;
          pdf.addImage(images[0].data, images[0].type as any, W - imgW - margin, (H - imgH) / 2, imgW, imgH, undefined, "FAST");
          textRight = W - imgW - margin - 24;
        } catch { /* ignore bad images */ }
      }

      // Slide marker
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(140);
      pdf.text(`Slide ${i + 1}`, margin, margin - 14);

      // Title + body
      const title = blocks.find((b) => b.kind === "title")?.text;
      const body = blocks.filter((b) => b.kind === "body").map((b) => b.text);
      let y = margin + 30;
      const textWidth = textRight - margin;

      if (title) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(30);
        pdf.setTextColor(bg ? 240 : 17);
        const lines = pdf.splitTextToSize(title, textWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 36 + 16;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.setTextColor(bg ? 230 : 30);
      for (const t of body) {
        if (y > H - margin) break;
        const lines = pdf.splitTextToSize("• " + t, textWidth);
        pdf.text(lines, margin, y);
        y += lines.length * 18 + 6;
      }

      setProgress(((i + 1) / slideFiles.length) * 95);
    }

    downloadBlob(pdf.output("blob"), file.name.replace(/\.pptx$/i, "") + ".pdf");
  };

  return (
    <ToolPageLayout tool={tool} process={process} ctaLabel="Convert to PDF"
      helper={<p className="text-xs text-muted-foreground">Slide text, embedded images and background colors are converted. For pixel-perfect rendering of charts, animations, and SmartArt, export to PDF directly from PowerPoint.</p>} />
  );
}
