import { ShieldCheck, Zap, Lock, Smartphone, Globe, Heart } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Privacy first", desc: "Files are processed locally in your browser. Nothing is uploaded or stored on our servers." },
  { icon: Zap, title: "Lightning fast", desc: "No queue, no waiting. Tools run instantly using modern WebAssembly and JavaScript." },
  { icon: Lock, title: "Bank-level security", desc: "End-to-end on-device processing means your sensitive documents never leave your device." },
  { icon: Smartphone, title: "Works everywhere", desc: "Optimized for desktop and mobile. Use TurboPDF on any device with a modern browser." },
  { icon: Globe, title: "No installation", desc: "100% web-based. Skip the downloads, plugins and account sign-ups." },
  { icon: Heart, title: "Always free", desc: "Every tool, unlimited use, no watermark, no hidden fees. Forever." },
];

export const Features = () => (
  <section id="features" className="py-20 sm:py-28">
    <div className="container-tight">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary mb-3">Why TurboPDF</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Built for speed, privacy and simplicity
        </h2>
        <p className="mt-4 text-muted-foreground">
          A modern PDF toolkit that respects your time and your data.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-6 rounded-2xl border border-border bg-card hover:bg-subtle-gradient transition-colors">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1.5">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
