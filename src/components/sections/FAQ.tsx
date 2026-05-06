import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is TurboPDF really free?", a: "Yes. Every tool on TurboPDF is 100% free with no hidden fees, no watermarks and no account required. We may show non-intrusive ads in the future to keep the platform free for everyone." },
  { q: "Are my files safe?", a: "Absolutely. All processing happens directly in your browser using JavaScript and WebAssembly. Your files are never uploaded to a server and never leave your device." },
  { q: "Do I need to install anything?", a: "No. TurboPDF runs entirely in your web browser. There are no plugins, downloads or extensions required." },
  { q: "What's the maximum file size?", a: "Because everything happens locally, the only limit is your device's available memory. Most modern devices handle PDFs up to several hundred MB without issue." },
  { q: "Does it work on mobile?", a: "Yes. TurboPDF is fully responsive and optimized for mobile browsers on iOS and Android." },
  { q: "Will my files be shared with anyone?", a: "Never. Since processing is browser-side, your documents are never transmitted. Privacy is a core principle of TurboPDF." },
];

export const FAQ = () => (
  <section id="faq" className="py-20 sm:py-28 bg-subtle-gradient">
    <div className="container-tight max-w-3xl">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold text-primary mb-3">FAQ</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl bg-card px-5 data-[state=open]:shadow-soft">
            <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
