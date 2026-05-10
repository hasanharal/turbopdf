import { Zap } from "lucide-react";

export const PageLoader = ({ label = "Loading…" }: { label?: string }) => (
  <div className="min-h-[60vh] flex items-center justify-center px-6">
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 bg-hero-gradient blur-2xl opacity-40 animate-pulse-glow" />
        <div className="relative h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow-primary animate-pulse">
          <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

export const InlineSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-4 w-2/3 bg-muted rounded" />
    <div className="h-4 w-1/2 bg-muted rounded" />
    <div className="h-32 w-full bg-muted rounded-xl" />
  </div>
);
