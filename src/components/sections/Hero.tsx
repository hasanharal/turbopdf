import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 bg-glow pointer-events-none" />
    <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
    <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent/20 blur-[120px] animate-pulse-glow" />

    <div className="container-tight relative pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-medium text-muted-foreground mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          100% browser-based · No upload, no tracking
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]"
        >
          Fast, Free & Secure{" "}
          <span className="text-gradient">PDF Tools</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
        >
          Compress, merge, split and convert PDFs instantly — directly in your browser.
          No sign-up. No watermark. Your files never leave your device.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button asChild size="lg" className="bg-hero-gradient hover:opacity-90 shadow-elegant h-12 px-6 text-base font-semibold">
            <a href="#tools">
              Explore Tools <ArrowRight className="ml-1.5 h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base font-semibold">
            <a href="#features">Why TurboPDF</a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex items-center gap-6 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>Files stay on your device</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <span>No account required</span>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <span>Free forever</span>
        </motion.div>
      </div>

      {/* Animated illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative h-[400px] lg:h-[480px] hidden md:block"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {/* main card */}
          <div className="relative w-64 h-80 rounded-2xl bg-card shadow-elegant border border-border p-5 animate-float">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <div className="h-2 w-20 rounded-full bg-secondary" />
            </div>
            <div className="space-y-2">
              {[100, 90, 95, 80, 88, 70, 92, 60].map((w, i) => (
                <div key={i} className="h-2 rounded-full bg-secondary" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* floating mini cards */}
          <div className="absolute top-6 right-12 w-32 h-20 rounded-xl bg-card border border-border shadow-soft p-3 animate-float-slow">
            <div className="h-2 w-12 rounded bg-primary/40 mb-1.5" />
            <div className="h-2 w-20 rounded bg-secondary mb-1" />
            <div className="h-2 w-16 rounded bg-secondary" />
          </div>
          <div className="absolute bottom-10 left-6 w-36 h-24 rounded-xl bg-card border border-border shadow-soft p-3 animate-float">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-md bg-hero-gradient" />
              <div className="h-2 w-16 rounded bg-secondary" />
            </div>
            <div className="h-2 w-full rounded bg-secondary mb-1" />
            <div className="h-2 w-3/4 rounded bg-secondary" />
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);
