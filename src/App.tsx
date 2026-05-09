import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const CompressPdf = lazy(() => import("./pages/tools/CompressPdf.tsx"));
const MergePdf = lazy(() => import("./pages/tools/MergePdf.tsx"));
const SplitPdf = lazy(() => import("./pages/tools/SplitPdf.tsx"));
const PdfToWord = lazy(() => import("./pages/tools/PdfToWord.tsx"));
const WordToPdf = lazy(() => import("./pages/tools/WordToPdf.tsx"));
const JpgToPdf = lazy(() => import("./pages/tools/JpgToPdf.tsx"));
const OcrPdf = lazy(() => import("./pages/tools/OcrPdf.tsx"));
const UnlockPdf = lazy(() => import("./pages/tools/UnlockPdf.tsx"));
const ProtectPdf = lazy(() => import("./pages/tools/ProtectPdf.tsx"));
const WatermarkPdf = lazy(() => import("./pages/tools/WatermarkPdf.tsx"));
const RotatePdf = lazy(() => import("./pages/tools/RotatePdf.tsx"));
const PageNumbers = lazy(() => import("./pages/tools/PageNumbers.tsx"));
const DeletePages = lazy(() => import("./pages/tools/DeletePages.tsx"));
const ReorderPages = lazy(() => import("./pages/tools/ReorderPages.tsx"));
const SignPdf = lazy(() => import("./pages/tools/SignPdf.tsx"));
const PdfReader = lazy(() => import("./pages/tools/PdfReader.tsx"));
const PdfToJpg = lazy(() => import("./pages/tools/PdfToJpg.tsx"));
const ExcelToPdf = lazy(() => import("./pages/tools/ExcelToPdf.tsx"));
const PowerpointToPdf = lazy(() => import("./pages/tools/PowerpointToPdf.tsx"));
const ScanToPdf = lazy(() => import("./pages/tools/ScanToPdf.tsx"));
const CropPdf = lazy(() => import("./pages/tools/CropPdf.tsx"));
const ExtractImages = lazy(() => import("./pages/tools/ExtractImages.tsx"));
const EditMetadata = lazy(() => import("./pages/tools/EditMetadata.tsx"));
const ComparePdf = lazy(() => import("./pages/tools/ComparePdf.tsx"));
const RepairPdf = lazy(() => import("./pages/tools/RepairPdf.tsx"));
const HtmlToPdf = lazy(() => import("./pages/tools/HtmlToPdf.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/compress-pdf" element={<CompressPdf />} />
            <Route path="/merge-pdf" element={<MergePdf />} />
            <Route path="/split-pdf" element={<SplitPdf />} />
            <Route path="/pdf-to-word" element={<PdfToWord />} />
            <Route path="/word-to-pdf" element={<WordToPdf />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
            <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
            <Route path="/powerpoint-to-pdf" element={<PowerpointToPdf />} />
            <Route path="/scan-to-pdf" element={<ScanToPdf />} />
            <Route path="/crop-pdf" element={<CropPdf />} />
            <Route path="/extract-images" element={<ExtractImages />} />
            <Route path="/edit-metadata" element={<EditMetadata />} />
            <Route path="/compare-pdf" element={<ComparePdf />} />
            <Route path="/repair-pdf" element={<RepairPdf />} />
            <Route path="/html-to-pdf" element={<HtmlToPdf />} />
            <Route path="/ocr-pdf" element={<OcrPdf />} />
            <Route path="/unlock-pdf" element={<UnlockPdf />} />
            <Route path="/protect-pdf" element={<ProtectPdf />} />
            <Route path="/watermark-pdf" element={<WatermarkPdf />} />
            <Route path="/rotate-pdf" element={<RotatePdf />} />
            <Route path="/page-numbers" element={<PageNumbers />} />
            <Route path="/delete-pages" element={<DeletePages />} />
            <Route path="/reorder-pages" element={<ReorderPages />} />
            <Route path="/sign-pdf" element={<SignPdf />} />
            <Route path="/pdf-reader" element={<PdfReader />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
