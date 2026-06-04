import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ToolsGrid } from "@/components/sections/ToolsGrid";
import { Features } from "@/components/sections/Features";
import { SeoContent } from "@/components/sections/SeoContent";
import { FAQ } from "@/components/sections/FAQ";
import { Seo } from "@/components/Seo";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="TurboPDF — Fast, Free & Secure PDF Tools Online"
        description="Compress, merge, split and convert PDFs instantly in your browser. 100% free, secure browser-side processing — no upload required."
        canonical="https://turbopdf-lab.vercel.app/"
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ToolsGrid />
        <Features />
        <SeoContent />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
