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
  (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

// Resolve relative URLs and inline a <base> so images/CSS load
function prepareHtml(html: string, baseUrl?: string): string {
  let out = html;
  // Strip scripts which cause network/CSP issues
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove problematic noscript that may inject content unexpectedly
  out = out.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  if (baseUrl) {
    if (/<head[^>]*>/i.test(out)) {
      out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
    } else {
      out = `<head><base href="${baseUrl}"></head>` + out;
    }
  }
  return out;
}

export default function HtmlToPdf() {
  const [tab, setTab] = useState<"html" | "url">("html");
  const [html, setHtml] = useState("<h1>Hello TurboPDF</h1>\n<p>Paste any HTML here and it will be converted into a clean PDF.</p>");
  const [url, setUrl] = useState("");

  const renderHtmlToPdf = async (sourceHtml: string, baseHref?: string) => {
    const prepared = prepareHtml(sourceHtml, baseHref);
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "-10000px";
    wrapper.style.left = "0";
    wrapper.style.width = "1024px";
    wrapper.style.padding = "32px";
    wrapper.style.background = "#fff";
    wrapper.style.color = "#0f172a";
    wrapper.style.fontFamily = "Inter, system-ui, sans-serif";
    wrapper.style.lineHeight = "1.5";
    wrapper.innerHTML = prepared;
    document.body.appendChild(wrapper);
    try {
      // Wait for images: cap at 8s total
      const imgs = Array.from(wrapper.querySelectorAll("img"));
      await Promise.race([
        Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = () => res(null); }))),
        new Promise((res) => setTimeout(res, 8000)),
      ]);
      // Allow webfonts/layout to settle
      await new Promise((r) => setTimeout(r, 250));

      const canvas = await html2canvas(wrapper, {
        scale: Math.min(2, window.devicePixelRatio || 2),
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1024,
        imageTimeout: 8000,
      });
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const totalPages = Math.max(1, Math.ceil(imgH / pageH));
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
    const attempts = [u, ...PROXIES.map((p) => p(u))];
    let lastErr = "";
    for (let i = 0; i < attempts.length; i++) {
      try {
        setStatus(`Fetching webpage${i ? ` (proxy ${i})` : ""}…`);
        const res = await fetch(attempts[i], { redirect: "follow" });
        if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
        const text = await res.text();
        if (text && text.length > 200 && /<\s*(html|body|head|main|article|div)/i.test(text)) return text;
        lastErr = "Empty or non-HTML response";
      } catch (e: any) { lastErr = e?.message || "Network error"; }
    }
    throw new Error(`This site blocks cross-origin access (${lastErr}). Open the page in a new tab, copy the HTML (Ctrl+U → Ctrl+A → Ctrl+C) and paste it in the "Paste HTML" tab.`);
  };

  const process = async (_files: File[], { setStatus }: any) => {
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
        <p className="text-xs text-muted-foreground">Multiple proxies are tried automatically. Sites with Cloudflare, login walls or strict CSP may still refuse — use "Paste HTML" as a fallback.</p>
      </TabsContent>
    </Tabs>
  );

  return <ToolPageLayout tool={tool} process={process} customBody={customBody} hideDefaultDropzone ctaLabel="Convert to PDF" />;
}
