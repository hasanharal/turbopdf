import { StaticPage } from "@/components/StaticPage";

export default function Terms() {
  return (
    <StaticPage
      title="Terms & Conditions — TurboPDF"
      description="Read the Terms & Conditions for using TurboPDF, the free browser-based PDF toolkit."
      canonical="https://turbopdf.app/terms"
      eyebrow="Legal"
      heading="Terms & Conditions"
      intro="By using TurboPDF, you agree to the terms outlined below."
    >
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>Use of the service</h2>
      <p>
        TurboPDF provides free, browser-based tools to view and modify PDF documents.
        You agree to use the service only for lawful purposes and only with documents you have
        the right to process.
      </p>
      <h2>No warranty</h2>
      <p>
        TurboPDF is provided "as is" without warranties of any kind. While we work hard to keep
        the tools accurate and reliable, we cannot guarantee the result of any conversion,
        compression, repair or other processing. Always keep a backup of your original files.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, TurboPDF and its creator shall not be liable for
        any direct, indirect, incidental or consequential damages arising from the use of the
        service.
      </p>
      <h2>Intellectual property</h2>
      <p>
        The TurboPDF brand, logo and website design are owned by their creator. You retain full
        ownership of any documents you process — TurboPDF never receives copies of them.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these terms occasionally. Continued use of TurboPDF after changes are
        posted constitutes acceptance of the updated terms.
      </p>
      <h2>Contact</h2>
      <p>
        Questions? Reach out at <strong>+92 333 6227405</strong>.
      </p>
    </StaticPage>
  );
}
