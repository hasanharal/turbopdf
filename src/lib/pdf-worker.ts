import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite ?url import for worker bundling
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
