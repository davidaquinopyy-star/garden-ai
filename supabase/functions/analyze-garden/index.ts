import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método no permitido." }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("Falta configurar GEMINI_API_KEY en Supabase Edge Function Secrets.");

    const body = await req.json();
    const { imageBase64, mimeType, conditions } = body;
    if (!imageBase64 || !mimeType || !String(mimeType).startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Enviá una fotografía válida del terreno." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `Actuá como arquitecto paisajista. Analizá esta fotografía real para planificar un jardín. No inventes medidas que no se vean. Diferenciá claramente lo observable de lo que no se puede confirmar. Conservá como restricciones las construcciones, paredes, puertas, ventanas, árboles existentes, desniveles y elementos fijos. Condiciones aportadas por el usuario: ${JSON.stringify(conditions ?? {})}.

Respondé en español con un análisis práctico y estructurado que incluya:
1. elementos visibles y límites del espacio;
2. obstáculos y elementos que deben conservarse;
3. zonas disponibles para intervenir;
4. exposición solar y drenaje solo si pueden inferirse, indicando incertidumbre;
5. propuesta de distribución paisajística;
6. plantas apropiadas para el clima cálido/subtropical de Paraguay, aclarando que deben verificarse condiciones locales;
7. preguntas o medidas que faltan para un diseño preciso.
No afirmes que generaste una imagen. Sé específico con esta fotografía.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1800 }
      })
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result?.error?.message || "Gemini no pudo analizar la fotografía.";
      return new Response(JSON.stringify({ error: message }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const analysis = result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("\n").trim();
    if (!analysis) throw new Error("Gemini devolvió una respuesta vacía. Probá con otra fotografía.");

    return new Response(JSON.stringify({ analysis, model: "gemini-2.5-flash" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al analizar la fotografía.";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});