import { useState } from "react";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/file-utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const tool = getTool("html-to-pdf");

const PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

export default function HtmlToPdf() {
  const [tab, setTab] = useState<"html" | "url">("html");
  const [html, setHtml] = useState("<h1>Hello TurboPDF</h1>\n<p>Paste any HTML here and it will be converted into a clean PDF.</p>");
  const [url, setUrl] = useState("");

  const renderHtmlToPdf = async (sourceHtml: string, _baseHref?: string) => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "-10000px";
    wrapper.style.left = "0";
    wrapper.style.width = "1024px";
    wrapper.style.padding = "32px";
    wrapper.style.background = "#fff";
    wrapper.style.color = "#0f172a";
    wrapper.style.fontFamily = "Inter, system-ui, sans-serif";
    wrapper.innerHTML = sourceHtml;
    document.body.appendChild(wrapper);
    try {
      // Wait for images to load (best-effort)
      const imgs = Array.from(wrapper.querySelectorAll("img"));
      await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = () => res(null); })));

      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff", windowWidth: 1024 });
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const totalPages = Math.ceil(imgH / pageH);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, -i * pageH, imgW, imgH);
      }
      return pdf.output("blob");
    } finally {
      wrapper.remove();
    }
  };

  const fetchUrl = async (u: string, setStatus: any) => {
    // Try direct first, then proxies
    const attempts = [u, ...PROXIES.map((p) => p(u))];
    for (let i = 0; i < attempts.length; i++) {
      try {
        setStatus(`Fetching webpage${i ? ` (proxy ${i})` : ""}…`);
        const res = await fetch(attempts[i]);
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        if (text && text.length > 100 && /<\s*html|<\s*body|<\s*head|<\s*div/i.test(text)) return text;
      } catch {}
    }
    throw new Error("This site blocks cross-origin access. Please use 'Paste HTML' instead — open the page, View Source, copy and paste the HTML here.");
  };

  const process = async (_: File[], { setStatus }: any) => {
    if (tab === "html") {
      if (!html.trim()) throw new Error("Please enter some HTML.");
      setStatus("Rendering HTML…");
      const blob = await renderHtmlToPdf(html);
      downloadBlob(blob, "page.pdf");
    } else {
      if (!url.trim()) throw new Error("Please enter a URL.");
      const u = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const fetched = await fetchUrl(u, setStatus);
      setStatus("Rendering page…");
      const blob = await renderHtmlToPdf(fetched, u);
      downloadBlob(blob, "webpage.pdf");
    }
  };

  const customBody = (
    <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="html">Paste HTML</TabsTrigger>
        <TabsTrigger value="url">From URL</TabsTrigger>
      </TabsList>
      <TabsContent value="html" className="space-y-2 mt-4">
        <Label>HTML content</Label>
        <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} className="font-mono text-xs" />
      </TabsContent>
      <TabsContent value="url" className="space-y-2 mt-4">
        <Label>Page URL</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" type="url" />
        <p className="text-xs text-muted-foreground">Best for simple/static pages. Sites with Cloudflare, login walls, or strict CSP often refuse cross-origin fetches — in that case use the "Paste HTML" tab instead.</p>
      </TabsContent>
    </Tabs>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Convert to PDF" />;
}
