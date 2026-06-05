// Lightweight static prerender — no headless browser required.
// Reads dist/index.html and writes a per-route copy with proper
// <title>, meta description, canonical, and og:* replaced so that
// crawlers (Googlebot, Bing, social previews) see correct head meta
// for every route before React hydrates client-side.
//
// Change SITE_URL below to your primary production domain.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

// >>> Change this single constant when switching to a custom domain. <<<
export const SITE_URL = "https://turbopdf-lab.vercel.app";

// Parse tool slug / name / description out of src/lib/tools.ts without
// importing it (avoids pulling lucide-react / React into Node).
function loadTools() {
  const src = readFileSync(resolve(ROOT, "src/lib/tools.ts"), "utf8");
  const re = /slug:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) out.push({ slug: m[1], name: m[2], description: m[3] });
  return out;
}

const staticPages = [
  { slug: "about",   name: "About TurboPDF",      description: "Learn about TurboPDF — our mission to provide fast, free and private PDF tools that run entirely in your browser." },
  { slug: "privacy", name: "Privacy Policy",      description: "Read the TurboPDF privacy policy. Your files are processed in your browser and never uploaded to any server." },
  { slug: "terms",   name: "Terms of Service",    description: "Terms of service for using TurboPDF — free, browser-based PDF tools." },
  { slug: "contact", name: "Contact TurboPDF",    description: "Get in touch with the TurboPDF team for support, feedback or partnership requests." },
];

function buildRoutes() {
  const tools = loadTools().map((t) => ({
    slug: t.slug,
    title: `${t.name} | Professional Online PDF Tools | TurboPDF`,
    description: t.description,
  }));
  const pages = staticPages.map((p) => ({
    slug: p.slug,
    title: `${p.name} | TurboPDF`,
    description: p.description,
  }));
  return [...tools, ...pages];
}

function injectMeta(html, { title, description, canonical }) {
  // Replace <title>
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  // Description
  out = replaceMeta(out, "name", "description", description);
  // OG
  out = replaceMeta(out, "property", "og:title", title);
  out = replaceMeta(out, "property", "og:description", description);
  out = replaceMeta(out, "property", "og:url", canonical);
  // Twitter
  out = replaceMeta(out, "name", "twitter:title", title);
  out = replaceMeta(out, "name", "twitter:description", description);
  // Canonical
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(out)) {
    out = out.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  } else {
    out = out.replace(/<\/head>/i, `    <link rel="canonical" href="${canonical}" />\n  </head>`);
  }
  return out;
}

function replaceMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}=["']${key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}["'][^>]*>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function main() {
  if (!existsSync(DIST)) {
    console.warn("[prerender] dist/ not found — skipping.");
    return;
  }
  const indexPath = resolve(DIST, "index.html");
  const baseHtml = readFileSync(indexPath, "utf8");

  // Rewrite root index.html canonical/og:url to absolute SITE_URL.
  writeFileSync(
    indexPath,
    injectMeta(baseHtml, {
      title: "TurboPDF — Fast, Free & Secure PDF Tools Online",
      description: "Compress, merge, split and convert PDFs instantly in your browser. 100% free, secure browser-side processing — no upload required.",
      canonical: `${SITE_URL}/`,
    }),
  );

  const routes = buildRoutes();
  let count = 0;
  for (const r of routes) {
    const canonical = `${SITE_URL}/${r.slug}`;
    const html = injectMeta(baseHtml, { title: r.title, description: r.description, canonical });
    const dir = resolve(DIST, r.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), html);
    count++;
  }
  console.log(`[prerender] wrote ${count} per-route HTML files + updated root index.html`);
}

main();
