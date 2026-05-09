import { Link, NavLink } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/#tools", label: "Tools" },
  { to: "/#features", label: "Features" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-soft" : "bg-background/0"
      }`}
    >
      <nav className="container-tight flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" aria-label="TurboPDF home">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient shadow-glow-primary transition-transform group-hover:scale-105">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Turbo<span className="text-gradient">PDF</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Button asChild variant="default" className="bg-hero-gradient hover:opacity-90 transition-opacity shadow-soft">
            <a href="/#tools">Get Started</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden glass border-t border-border animate-fade-in">
          <ul className="container-tight py-4 flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <a
                  href={l.to}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Button asChild className="w-full mt-2 bg-hero-gradient">
                <a href="/#tools" onClick={() => setOpen(false)}>Get Started</a>
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
