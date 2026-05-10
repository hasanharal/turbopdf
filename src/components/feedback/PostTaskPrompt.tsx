import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

const COUNT_KEY = "turbopdf_task_count";

type Props = { tool?: string; trigger: number };

export const PostTaskPrompt = ({ tool, trigger }: Props) => {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    const n = (parseInt(sessionStorage.getItem(COUNT_KEY) || "0", 10) || 0) + 1;
    sessionStorage.setItem(COUNT_KEY, String(n));
    // Show occasionally: every 3rd successful task
    if (n % 3 === 0) {
      const t = setTimeout(() => setShow(true), 900);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 right-5 z-40 max-w-xs rounded-2xl border border-border bg-card shadow-elegant p-4"
          >
            <button
              onClick={() => setShow(false)}
              aria-label="Dismiss"
              className="absolute top-2 right-2 h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-3">
              <span className="h-9 w-9 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0">
                <Heart className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">How was it?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Did the tool work for you? A quick note helps us improve.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setOpen(true); setShow(false); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-hero-gradient text-white font-medium"
                  >
                    Send feedback
                  </button>
                  <button
                    onClick={() => setShow(false)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <FeedbackDialog open={open} onOpenChange={setOpen} tool={tool} />
    </>
  );
};
