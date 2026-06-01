# TurboPDF

**A modern, privacy-first, client-side PDF toolkit** built with React + TypeScript + Vite + shadcn/ui.

## ✨ Features
- Merge, Split, Compress, Rotate, Protect, Unlock PDFs
- Image ↔ PDF conversions
- Word/Excel → PDF and vice versa
- OCR (text extraction from scanned PDFs)
- Sign, Reorder, Crop, Add Watermark

## 🚀 Quick Start
```bash
git clone https://github.com/hasanharal/turbopdf.git
cd turbopdf
bun install # or npm install
bun run dev
```

## Recent Improvements (June 2026)
- Enhanced file validation and error messages
- Better memory management in processing tools
- Improved compression quality and stability
- Fixed silent failures in several tools

## Known Limitations
- Fully client-side → Large/complex PDFs (>50 pages or 50MB+) may be slow or fail in browser.
- Compression often rasterizes text (searchability lost) — this is a common client-side limitation.

Report bugs with console errors if tools still fail!