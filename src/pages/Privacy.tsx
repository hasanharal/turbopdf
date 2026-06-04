import { StaticPage } from "@/components/StaticPage";

export default function Privacy() {
  return (
    <StaticPage
      title="Privacy Policy — TurboPDF"
      description="TurboPDF processes all files locally in your browser. Read our privacy policy to learn how we handle your data."
      canonical="https://turbopdf-lab.vercel.app/privacy"
      eyebrow="Legal"
      heading="Privacy Policy"
      intro="Your files stay on your device. We don't collect, store or share your documents."
    >
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>Browser-side processing</h2>
      <p>
        Every TurboPDF tool runs entirely in your browser using JavaScript and WebAssembly.
        Your PDFs, images and documents are never uploaded to a server, never stored and never
        transmitted to any third party.
      </p>
      <h2>Information we collect</h2>
      <p>
        We do not require accounts or sign-ups. We may collect anonymous, aggregated analytics
        (such as page views and tool usage counts) to improve performance and prioritize new
        features. This data cannot be used to identify you.
      </p>
      <h2>Cookies</h2>
      <p>
        TurboPDF uses only essential cookies needed to provide the service. We do not use
        advertising cookies or sell user data.
      </p>
      <h2>Third-party services</h2>
      <p>
        We rely on standard hosting and CDN providers to deliver the website assets. These
        providers may log basic request metadata such as IP address, as required for
        operational and security purposes.
      </p>
      <h2>Your rights</h2>
      <p>
        Because we don't store personal data or documents, there is nothing to delete or export.
        If you have any questions about your privacy, contact us at <strong>+92 333 6227405</strong>.
      </p>
    </StaticPage>
  );
}
