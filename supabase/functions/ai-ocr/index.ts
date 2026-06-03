// Lovable AI-powered OCR edge function
// Accepts a base64 image (optionally many) and returns extracted text using Gemini vision.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OcrRequest {
  images: string[]; // data URLs or raw base64 (image/png, image/jpeg)
  language?: string;
  mode?: "text" | "structured";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { images, language, mode }: OcrRequest = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langHint = language && language !== "auto" ? ` The document language is ${language}; preserve diacritics and original script exactly.` : " Auto-detect the language(s) and preserve original scripts (Latin, Arabic, Urdu, Devanagari, Chinese, Cyrillic, etc.) without transliteration.";
    const structureHint = mode === "structured"
      ? " Preserve document structure: render headings on their own lines, bullet/numbered lists with their markers, paragraph spacing, and tables as GitHub-flavored markdown tables. Maintain reading order (top-to-bottom, left-to-right; right-to-left for Arabic/Urdu)."
      : " Return clean readable text, preserving line breaks for paragraphs.";

    const systemPrompt = `You are a professional OCR engine specialized in difficult documents. Extract EVERY visible character from the provided image(s) with maximum accuracy, including: handwritten notes (cursive and print), faded/scanned pages, blurry phone photos, stamps, watermarks, footnotes, page numbers, captions, and small print. Do NOT skip, summarize, paraphrase, translate, or "clean up" content. Preserve original capitalization, punctuation, spelling, numbers, and symbols (math, currency, units). If a character is unclear, use your best guess and mark it with [?] only if truly illegible. ${langHint}${structureHint} Output ONLY the extracted text — no commentary, no explanations, no markdown code fences.`;

    const userContent: any[] = [
      { type: "text", text: `Extract the text from ${images.length === 1 ? "this image" : "these images, in order"}.` },
    ];
    for (const img of images) {
      const url = img.startsWith("data:") ? img : `data:image/png;base64,${img}`;
      userContent.push({ type: "image_url", image_url: { url } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "OCR service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ocr error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
