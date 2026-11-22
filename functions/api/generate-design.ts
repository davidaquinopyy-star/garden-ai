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
    const prompt=`Create a realistic landscape architecture visualization edit based on the provided photo. Preserve the original architecture, camera angle, perspective, boundaries, existing structures, and overall site layout. Do not invent or enlarge the yard. Transform only landscaping and outdoor planting areas into a ${conditions.style||'contemporary tropical'} garden. Use plants suitable for ${conditions.sun||'unknown sunlight'}, ${conditions.soil||'unknown soil'}, drainage ${conditions.drainage||'unknown'}, and ${conditions.maintenance||'moderate'} maintenance. Goal: ${conditions.goal||'beautify the yard'}. Approximate yard dimensions: ${conditions.width||'unknown'} by ${conditions.length||'unknown'} meters. Budget tier: ${conditions.budget||'unspecified'}. Additional instructions: ${conditions.notes||'none'}. Render a tasteful, natural, photorealistic landscape design, realistic plant scale, no labels, no text, no watermark. This is a conceptual visualization, not a measured plan.`;
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
