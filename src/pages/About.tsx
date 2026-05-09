import { StaticPage } from "@/components/StaticPage";

export default function About() {
  return (
    <StaticPage
      title="About TurboPDF — Fast, Free PDF Tools"
      description="TurboPDF is a fast, reliable, browser-based PDF platform. Learn about our mission and the founder, M Hasan Ramzan."
      canonical="https://turbopdf.app/about"
      eyebrow="About us"
      heading="About TurboPDF"
      intro="A fast, reliable and easy-to-use platform built to simplify your PDF tasks."
    >
      <p>
        Welcome to TurboPDF — a fast, reliable, and easy-to-use platform built to simplify your PDF tasks.
        TurboPDF offers powerful tools including PDF merge, compress, convert, watermark, sign, rotate,
        and many other smart utilities designed for students, professionals, and everyday users.
      </p>
      <h2>Our story</h2>
      <p>
        TurboPDF was created by <strong>M Hasan Ramzan</strong>, a Chemistry student at the
        Institute of Chemical Sciences, Bahauddin Zakaria University, Multan, Pakistan.
        The mission of TurboPDF is to provide modern, secure, and efficient PDF solutions
        with a clean and user-friendly experience.
      </p>
      <h2>Our mission</h2>
      <p>
        We are continuously improving the platform by adding new features, enhancing performance,
        and making document management faster and more convenient for everyone. Every tool runs
        directly inside your browser — your documents never leave your device.
      </p>
      <h2>Get in touch</h2>
      <p>
        Have questions, feedback or partnership ideas? We'd love to hear from you.
        <br />
        Contact number: <strong>+92 333 6227405</strong>
      </p>
      <p>Thank you for choosing TurboPDF.</p>
    </StaticPage>
  );
}
