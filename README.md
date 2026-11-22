# Garden AI

AI-assisted garden and landscape design studio. Initial responsive prototype built with React + TypeScript + Vite.

## Current prototype
- Photo uploads and preview
- Sun exposure, soil, drainage, style, maintenance, budget and project goals
- Approximate yard dimensions and area calculation
- Conceptual top-down schematic
- Concept sketch tab
- Plant idea list
- SVG conceptual-plan export

## Development
```bash
npm install
npm run dev
```

## Important
The current screens are a frontend prototype. Image generation, video analysis, validated plant recommendations, scaled technical plans, PDF export, and backend persistence are not connected yet. The current plan export is conceptual and not a construction-ready drawing.


## Render de imagen con IA (Cloudflare Pages)

La función serverless `functions/api/generate-design.ts` procesa la imagen de referencia y llama al endpoint de edición de imágenes de OpenAI. La clave **no se expone al navegador**.


1. En Cloudflare Pages, abrir el proyecto → Settings → Variables and secrets.
2. Añadir `OPENAI_API_KEY` como **secret** (no como variable pública de Vite).
3. Redeploy del sitio después de añadir el secret.
4. En la app, cargar una foto, configurar el espacio, generar la propuesta y abrir la pestaña **Visualización** → **Generar visualización con IA**.


El endpoint limita fotos a 10 MB y solo acepta imágenes. La generación requiere saldo y acceso al API de OpenAI. Los renders son conceptuales: no garantizan medidas, especies exactas ni condiciones constructivas. Video no está conectado todavía.
