import { FileArchive, FileStack, Scissors, FileText, FileType, Image as ImageIcon } from "lucide-react";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: typeof FileArchive;
  gradient: string;
  accept: string;
  multiple: boolean;
};

export const tools: Tool[] = [
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    tagline: "Reduce PDF size without losing quality",
    description: "Shrink PDF files quickly while keeping documents readable. Perfect for email attachments and uploads.",
    icon: FileArchive,
    gradient: "from-indigo-500 to-violet-500",
    accept: "application/pdf",
    multiple: false,
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    tagline: "Combine multiple PDFs into one",
    description: "Drag and drop several PDFs and merge them into a single, well-ordered document in seconds.",
    icon: FileStack,
    gradient: "from-violet-500 to-fuchsia-500",
    accept: "application/pdf",
    multiple: true,
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    tagline: "Extract pages from a PDF",
    description: "Split a PDF by page ranges and download separate documents in a single click.",
    icon: Scissors,
    gradient: "from-fuchsia-500 to-pink-500",
    accept: "application/pdf",
    multiple: false,
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    tagline: "Convert PDF text to Word",
    description: "Extract text from your PDF and download it as an editable Word (.docx) document.",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-500",
    accept: "application/pdf",
    multiple: false,
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    tagline: "Convert Word documents to PDF",
    description: "Turn your .docx files into clean, share-ready PDFs — directly in the browser.",
    icon: FileType,
    gradient: "from-emerald-500 to-teal-500",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: false,
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    tagline: "Combine images into a PDF",
    description: "Convert JPG, PNG and WebP images into a single PDF document, ready to share or print.",
    icon: ImageIcon,
    gradient: "from-amber-500 to-orange-500",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
  },
];

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
