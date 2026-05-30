import { useEffect, useState } from "react";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Loader2 } from "lucide-react";

export const usePdfThumbs = (file: File | undefined) => {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!file) { setThumbs([]); return; }
    setLoading(true);
    (async () => {
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const out: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const c = document.createElement("canvas");
          c.width = viewport.width; c.height = viewport.height;
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
          await page.render({ canvasContext: ctx, viewport, canvas: c } as any).promise;
          out.push(c.toDataURL("image/jpeg", 0.7));
        c.width = 0; c.height = 0;
          if (cancelled) return;
        }
        if (!cancelled) setThumbs(out);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  return { thumbs, loading };
};

export const ThumbsLoader = () => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
    <Loader2 className="h-4 w-4 animate-spin" /> Loading page previews…
  </div>
);
