import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addFeedback } from "@/lib/feedback-store";
import { CheckCircle2, Send, Sparkles } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  contact: z.string().trim().min(3, "Email or phone is required").max(120),
  message: z.string().trim().min(5, "Please describe your feedback").max(2000),
});

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tool?: string;
  defaultMessage?: string;
};

export const FeedbackDialog = ({ open, onOpenChange, tool, defaultMessage }: Props) => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState(defaultMessage || "");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    const r = schema.safeParse({ name, contact, message });
    if (!r.success) { setErr(r.error.issues[0].message); return; }
    const isEmail = /\S+@\S+\.\S+/.test(contact);
    addFeedback({ name: r.data.name, contact: r.data.contact, contactKind: isEmail ? "email" : "phone", message: r.data.message, tool });
    setSent(true);
    setTimeout(() => {
      setSent(false); setName(""); setContact(""); setMessage(""); setErr("");
      onOpenChange(false);
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
                className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="h-8 w-8 text-success" />
              </motion.div>
              <h3 className="text-lg font-semibold">Thank you!</h3>
              <p className="text-sm text-muted-foreground mt-1">Your feedback has been received.</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  <DialogTitle>Send us feedback</DialogTitle>
                </div>
                <DialogDescription>
                  Report bugs, suggest features or share your experience.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email or phone</Label>
                  <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or +92…" maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label>Your message</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="What's on your mind?" maxLength={2000} />
                </div>
                {err && <p className="text-xs text-destructive">{err}</p>}
                <Button onClick={submit} className="w-full bg-hero-gradient hover:opacity-90 h-11">
                  <Send className="h-4 w-4 mr-2" /> Send feedback
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
