import { Link } from "react-router-dom";
import { ChevronLeft, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { useState, ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Dropzone } from "@/components/Dropzone";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Tool } from "@/lib/tools";
import { ShieldCheck } from "lucide-react";

type State = "idle" | "processing" | "success" | "error";

type Props = {
  tool: Tool;
  process: (files: File[]) => Promise<void>;
  helper?: ReactNode;
};

export const ToolPageLayout = ({ tool, process, helper }: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const Icon = tool.icon;

  const run = async () => {
    if (!files.length) return;
    setState("processing");
    setError("");
    try {
      await process(files);
      setState("success");
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try a different file.");
      setState("error");
    }
  };

  const reset = () => {
    setFiles([]);
    setState("idle");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title={`${tool.name} — Free Online ${tool.name} Tool | TurboPDF`}
        description={tool.description}
      />
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-glow pointer-events-none" />
          <div className="container-tight relative pt-10 pb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" /> Back to all tools
            </Link>
            <div className="flex items-start gap-4 max-w-3xl">
              <div className={`shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-soft`}>
                <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{tool.name}</h1>
                <p className="mt-2 text-muted-foreground">{tool.description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="container-tight max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-soft">
              <Dropzone
                accept={tool.accept}
                multiple={tool.multiple}
                files={files}
                onFiles={setFiles}
              />

              {helper && <div className="mt-5">{helper}</div>}

              {state === "error" && (
                <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {state === "success" && (
                <div className="mt-5 flex items-center gap-3 p-4 rounded-xl bg-success/10 text-success-foreground border border-success/20 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <p className="text-sm font-medium text-foreground">Done! Your file has been downloaded.</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {state !== "success" ? (
                  <Button
                    size="lg"
                    onClick={run}
                    disabled={!files.length || state === "processing"}
                    className="bg-hero-gradient hover:opacity-90 shadow-soft h-12 px-6 font-semibold"
                  >
                    {state === "processing" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Process & Download</>
                    )}
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" onClick={reset} className="h-12 px-6 font-semibold">
                    Process another file
                  </Button>
                )}
                {files.length > 0 && state === "idle" && (
                  <Button variant="ghost" onClick={reset}>Clear</Button>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2.5 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="h-4 w-4 text-success" />
              Your files never leave your device — secure browser-side processing.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
