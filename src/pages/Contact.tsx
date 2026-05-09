import { StaticPage } from "@/components/StaticPage";
import { Phone, MapPin, GraduationCap } from "lucide-react";

export default function Contact() {
  return (
    <StaticPage
      title="Contact TurboPDF — Get in Touch"
      description="Get in touch with the TurboPDF team. We'd love to hear your feedback, questions and feature requests."
      canonical="https://turbopdf.app/contact"
      eyebrow="Contact"
      heading="Let's talk"
      intro="Have a question, feedback or feature request? Reach out — we read every message."
    >
      <div className="not-prose grid gap-4 sm:grid-cols-2 mt-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <Phone className="h-5 w-5 text-white" />
            </span>
            <h3 className="font-semibold">Phone</h3>
          </div>
          <p className="text-sm text-muted-foreground">+92 333 6227405</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <h3 className="font-semibold">Founder</h3>
          </div>
          <p className="text-sm text-muted-foreground">M Hasan Ramzan — Chemistry student, ICS, BZU.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </span>
            <h3 className="font-semibold">Location</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Institute of Chemical Sciences, Bahauddin Zakaria University, Multan, Pakistan.
          </p>
        </div>
      </div>
      <p className="mt-8">
        For partnership opportunities, bug reports or feature requests, please reach out via
        phone. We typically respond within 1–2 business days.
      </p>
    </StaticPage>
  );
}
