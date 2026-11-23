type Env={OPENAI_API_KEY?:string};
export async function onRequestPost({request,env}: {request:Request;env:Env}){
  if(!env.OPENAI_API_KEY)return Response.json({error:'Falta configurar OPENAI_API_KEY como secret de Cloudflare Pages.'},{status:503});
  try{
    const form=await request.formData();
    const file=form.get('image');
    const rawPrompt=form.get('prompt');
    if(!(file instanceof File))return Response.json({error:'Subí una foto del terreno.'},{status:400});
    if(file.size>10*1024*1024)return Response.json({error:'La foto supera 10 MB. Elegí una imagen más liviana.'},{status:413});
    if(!file.type.startsWith('image/'))return Response.json({error:'El archivo debe ser una imagen.'},{status:400});
    let conditions:any={};
    try{conditions=JSON.parse(String(rawPrompt||'{}'));}catch{return Response.json({error:'No se pudieron leer los parámetros del diseño.'},{status:400});}
    const prompt=`You are an experienced landscape architect editing a real site photograph, not generating a generic garden inspiration image.

TASK: Make a photorealistic BEFORE-to-AFTER landscape redesign directly on the uploaded photograph. First carefully read the visible scene: identify the actual ground/soil/lawn boundaries, building walls, doors, windows, existing trees and plants, fences, pool, furniture, steps, utility objects, and camera perspective. Then design only within the visible outdoor space.

PHOTO-LOCK RULES (highest priority):
- Keep the exact camera viewpoint, lens perspective, image framing, architecture, walls, fence lines, doors, windows, roof, pool, existing fixed structures, and recognizable existing objects in their original positions.
- Do not create a new property, new house, larger yard, extra camera angle, collage, aerial plan, or unrelated garden scene.
- Do not erase existing structures or move permanent objects. Keep existing trees unless the user explicitly asks to remove them.
- Do not landscape over concrete, stairs, driveway, pool, or occupied space. Do not invent extra empty land.
- Only modify outdoor planting/landscape surfaces that are actually visible and plausibly available. If there is little planting space, make a restrained design rather than forcing a garden.
- The result must remain immediately recognizable as the same photo and same place.

DESIGN BRIEF:
Garden style: ${conditions.style||'contemporary tropical'}.
Goal: ${conditions.goal||'beautify the yard'}.
Sun exposure: ${conditions.sun||'unknown'}.
Soil: ${conditions.soil||'unknown'}.
Drainage: ${conditions.drainage||'unknown'}.
Maintenance: ${conditions.maintenance||'moderate'}.
Budget: ${conditions.budget||'unspecified'}.
Approximate site size entered by user (not a license to change visible proportions): ${conditions.width||'unknown'} m wide x ${conditions.length||'unknown'} m long.
User's specific instructions: ${conditions.notes||'none'}.

DESIGN EXECUTION:
- Place plants and garden features based on the visible boundaries and actual empty spaces in the photograph.
- Use a coherent layout with purposeful plant groupings, proper scale, realistic spacing, and visible circulation.
- Add only a few appropriate features (such as a planting bed, stepping-stone path, small seating area, mulch/gravel, low edging, layered tropical plants, shrubs, or subtle lighting) when they fit the site and brief.
- Avoid random scattered plants, clutter, excessive flowers, oversized trees, unrealistic density, floating objects, and blocked pathways.
- Choose regionally plausible plants for a warm subtropical climate when the image and user brief support it; avoid claiming exact species if uncertain.
- Photorealistic natural daylight, believable shadows, high-quality landscape design, clean material transitions, realistic plant sizes.

OUTPUT: Return one seamless photorealistic edited version of the uploaded photo. No text, labels, arrows, diagrams, watermark, before/after split, or decorative frame.`;
    const upstream=new FormData();
    upstream.append('model','gpt-image-1');
    upstream.append('prompt',prompt);
    upstream.append('image',file,file.name||'yard-photo.png');
    upstream.append('size','1024x1024');
    const response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:upstream});
    if(!response.ok){const detail=await response.text();return Response.json({error:`Proveedor de imágenes respondió ${response.status}: ${detail.slice(0,450)}`},{status:502});}
    const result:any=await response.json();
    const b64=result?.data?.[0]?.b64_json;
    if(!b64)return Response.json({error:'El proveedor no devolvió una imagen base64.'},{status:502});
    return Response.json({image:`data:image/png;base64,${b64}`});
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Error interno generando imagen.'},{status:500});}
}
