import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Seo } from "@/components/Seo";

type Props = {
  title: string;
  description: string;
  canonical?: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  children: ReactNode;
};

export const StaticPage = ({ title, description, canonical, eyebrow, heading, intro, children }: Props) => (
  <div className="min-h-screen flex flex-col">
    <Seo title={title} description={description} canonical={canonical} />
    <Navbar />
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="container-tight relative pt-16 pb-10 max-w-3xl">
          {eyebrow && <p className="text-sm font-semibold text-primary mb-3">{eyebrow}</p>}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{heading}</h1>
          {intro && <p className="mt-4 text-lg text-muted-foreground">{intro}</p>}
        </div>
      </section>
      <section className="pb-20">
        <div className="container-tight max-w-3xl">
          <article className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary">
            {children}
          </article>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);
