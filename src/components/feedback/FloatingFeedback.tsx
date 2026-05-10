import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

export const FloatingFeedback = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1200);
    const t2 = setTimeout(() => setDismissed(true), 22000); // auto-collapse after ~20s
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2"
          >
            <button
              onClick={() => setOpen(true)}
              className="group flex items-center gap-2 px-4 h-11 rounded-full bg-hero-gradient text-white shadow-glow-primary hover:scale-105 transition-transform text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Suggestions & feedback</span>
              <span className="sm:hidden">Feedback</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-available compact bubble after dismissal */}
      <AnimatePresence>
        {dismissed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => setOpen(true)}
            aria-label="Send feedback"
            className="fixed bottom-5 right-5 z-40 h-11 w-11 rounded-full bg-card border border-border shadow-soft flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
          </motion.button>
        )}
      </AnimatePresence>

      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
