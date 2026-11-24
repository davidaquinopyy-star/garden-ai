import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "Falta configurar GEMINI_API_KEY en Supabase Edge Function Secrets." }, 503);

    const body = await req.json();
    const { action = "analyze", imageBase64, mimeType, conditions } = body;
    if (!imageBase64 || !mimeType || !String(mimeType).startsWith("image/")) {
      return json({ error: "Enviá una fotografía válida del terreno." }, 400);
    }
    if (typeof imageBase64 !== "string" || imageBase64.length > 15_000_000) {
      return json({ error: "La fotografía es demasiado grande. Elegí una imagen de menor tamaño." }, 413);
    }

    const imagePart = { inline_data: { mime_type: mimeType, data: imageBase64 } };
    const conditionsText = JSON.stringify(conditions ?? {});

    if (action === "generate-image") {
      const prompt = `Sos un arquitecto paisajista profesional. Editá la fotografía adjunta para mostrar una renovación paisajística fotorrealista del mismo espacio.

REGLAS OBLIGATORIAS:
- La salida debe ser una imagen editada, no una descripción, un plano ni una imagen genérica.
- Conservá exactamente el punto de vista, encuadre, perspectiva, arquitectura, paredes, puertas, ventanas, cercas, piscina, árboles existentes y elementos fijos.
- No agrandes el terreno ni inventes espacios que no aparecen en la fotografía.
- Modificá únicamente las áreas exteriores que realmente puedan ajardinarse.
- Respetá las circulaciones, accesos, desniveles y superficies construidas.
- Diseñá con escala realista, distribución ordenada, plantas de tamaño creíble y materiales naturales.
- Evitá saturar el espacio con plantas o agregar elementos imposibles.
- Buscá un resultado elegante, coherente y realizable en un clima cálido/subtropical como el de Paraguay.
- Sin textos, etiquetas, flechas, marcas de agua, marcos ni collage.

CONDICIONES DEL CLIENTE (JSON):
${conditionsText}

Devolvé una única imagen final fotorrealista que mantenga reconocible el mismo lugar de la fotografía.`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(apiKey),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, imagePart] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        console.error("Gemini image API error", response.status, JSON.stringify(result?.error ?? result));
        const message = result?.error?.message || "Gemini no pudo generar la imagen.";
        return json({ error: message }, response.status);
      }
      const parts = result?.candidates?.[0]?.content?.parts ?? [];
      const image = parts.find((part: any) => part.inline_data?.data || part.inlineData?.data);
      const data = image?.inline_data?.data ?? image?.inlineData?.data;
      const outputMime = image?.inline_data?.mime_type ?? image?.inlineData?.mimeType ?? "image/png";
      if (!data) {
        const detail = parts.map((part: any) => part.text || "").filter(Boolean).join(" ");
        return json({ error: detail || "Gemini no devolvió una imagen. Probá nuevamente con otra fotografía." }, 502);
      }
      return json({ image: `data:${outputMime};base64,${data}`, model: "gemini-2.5-flash-image" });
    }

    if (action !== "analyze") return json({ error: "Acción no válida." }, 400);

    const prompt = `Actuá como arquitecto paisajista. Analizá esta fotografía real para planificar un jardín. No inventes medidas que no se vean. Diferenciá claramente lo observable de lo que no se puede confirmar. Conservá como restricciones las construcciones, paredes, puertas, ventanas, árboles existentes, desniveles y elementos fijos. Condiciones aportadas por el usuario: ${conditionsText}.

Respondé en español con un análisis práctico y estructurado que incluya:
1. elementos visibles y límites del espacio;
2. obstáculos y elementos que deben conservarse;
3. zonas disponibles para intervenir;
4. exposición solar y drenaje solo si pueden inferirse, indicando incertidumbre;
5. propuesta de distribución paisajística;
6. plantas apropiadas para el clima cálido/subtropical de Paraguay, aclarando que deben verificarse condiciones locales;
7. preguntas o medidas que faltan para un diseño preciso.
No afirmes que generaste una imagen. Sé específico con esta fotografía.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, imagePart] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1800 },
        }),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      console.error("Gemini analysis API error", response.status, JSON.stringify(result?.error ?? result));
      const message = result?.error?.message || "Gemini no pudo analizar la fotografía.";
      return json({ error: message }, response.status);
    }

    const analysis = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("\n").trim();
    if (!analysis) return json({ error: "Gemini devolvió un análisis vacío. Probá con otra fotografía." }, 502);
    return json({ analysis, model: "gemini-2.5-flash" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al procesar la fotografía.";
    return json({ error: message }, 500);
  }
});
