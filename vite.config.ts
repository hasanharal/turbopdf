import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Inline plugin: after `vite build`, generate per-route static HTML
// with correct <title>/meta/canonical so crawlers don't see the same
// shell on every URL. Implementation lives in scripts/prerender.mjs.
const prerenderPlugin = () => ({
  name: "turbopdf-prerender",
  apply: "build" as const,
  async closeBundle() {
    try {
      await import(`./scripts/prerender.mjs?ts=${Date.now()}`);
    } catch (e) {
      console.warn("[prerender] failed:", e);
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerenderPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
