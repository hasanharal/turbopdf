import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

const KEY = "turbopdf_announce_v2_seen";

export const AnnouncementPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    sessionStorage.setItem(KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-elegant overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-hero-gradient opacity-30 blur-3xl" />
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative p-7 sm:p-8">
              <div className="h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow-primary mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Welcome to TurboPDF</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Some tools are still being polished and new features are landing every week.
                If you spot something off, please use the floating feedback button — it really helps!
              </p>
              <button
                onClick={close}
                className="mt-5 w-full h-11 rounded-xl bg-hero-gradient text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
