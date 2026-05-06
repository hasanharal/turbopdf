import { Link } from "react-router-dom";
import { Zap, Github, Twitter } from "lucide-react";
import { tools } from "@/lib/tools";

export const Footer = () => (
  <footer className="border-t border-border bg-subtle-gradient">
    <div className="container-tight py-14 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <Link to="/" className="flex items-center gap-2 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold">
            Turbo<span className="text-gradient">PDF</span>
          </span>
        </Link>
        <p className="text-sm text-muted-foreground max-w-sm">
          Fast, free and secure PDF tools that run directly in your browser. Your files never leave your device.
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Tools</h4>
        <ul className="space-y-2">
          {tools.slice(0, 6).map((t) => (
            <li key={t.slug}>
              <Link to={`/${t.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-3 text-sm">Company</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
          <li><a href="/#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
          <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
          <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container-tight py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TurboPDF. All rights reserved.
        </p>
        <div className="flex items-center gap-3 text-muted-foreground">
          <a href="#" aria-label="Twitter" className="hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>
          <a href="#" aria-label="GitHub" className="hover:text-foreground transition-colors"><Github className="h-4 w-4" /></a>
        </div>
      </div>
    </div>
  </footer>
);
