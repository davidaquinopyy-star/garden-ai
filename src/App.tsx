import { useMemo, useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { createDesignBrief, recommendPlants, createPlantingSpecs, createBudgetEstimate, createGardenLayout } from './designEngine';
import { Leaf, Sun, CloudSun, Droplets, Ruler, ImagePlus, Sparkles, Download, Sprout, LayoutGrid, PencilRuler, ChevronRight, Check, CircleHelp, TreePine, FileText } from 'lucide-react';

type Tab = 'render'|'plan'|'sketch'|'plants'|'budget';
type SavedProject = { id:string; name:string; status:string; width_m:number|null; length_m:number|null; conditions:any; created_at:string };
export default function App(){
  const [photos,setPhotos]=useState<File[]>([]);
  const [session,setSession]=useState<any>(null);
  const [authEmail,setAuthEmail]=useState('');
  const [authPassword,setAuthPassword]=useState('');
  const [authMessage,setAuthMessage]=useState('');
  const [authOpen,setAuthOpen]=useState(false);
  const [savedProjects,setSavedProjects]=useState<SavedProject[]>([]);
  const [saveMessage,setSaveMessage]=useState('');
  const [saveBusy,setSaveBusy]=useState(false);
  const [sun,setSun]=useState('Sol pleno');
  const [soil,setSoil]=useState('No estoy seguro');
  const [drain,setDrain]=useState('Normal');
  const [style,setStyle]=useState('Tropical contemporáneo');
  const [care,setCare]=useState('Bajo');
  const [budget,setBudget]=useState('Intermedio');
  const [goal,setGoal]=useState('Embellecer el patio');
  const [width,setWidth]=useState('8');
  const [length,setLength]=useState('12');
  const [generated,setGenerated]=useState(false);
  const [tab,setTab]=useState<Tab>('plan');
  const [note,setNote]=useState('');
  const [design,setDesign]=useState<ReturnType<typeof createDesignBrief>|null>(null);
  const [priceOverrides,setPriceOverrides]=useState<Record<string,number>>({});
  const [aiImage,setAiImage]=useState<string|null>(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiError,setAiError]=useState('');
  const [aiAnalysis,setAiAnalysis]=useState<string|null>(null);
  const previews=useMemo(()=>photos.map(f=>URL.createObjectURL(f)),[photos]);
  useEffect(()=>{ if(!supabase)return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next); if(next?.user) loadSavedProjects(next.user.id); else setSavedProjects([]);}); return ()=>listener.subscription.unsubscribe(); },[]);
  async function loadSavedProjects(userId:string){if(!supabase)return; const {data,error}=await supabase.from('projects').select('id,name,status,width_m,length_m,conditions,created_at').eq('user_id',userId).order('created_at',{ascending:false}); if(!error&&data)setSavedProjects(data as SavedProject[]);}
  async function authAction(mode:'login'|'signup'){if(!supabase){setAuthMessage('Supabase todavía no está configurado en el despliegue.');return;} if(!authEmail||!authPassword){setAuthMessage('Ingresá tu correo y contraseña.');return;}setAuthMessage('');const result=mode==='login'?await supabase.auth.signInWithPassword({email:authEmail,password:authPassword}):await supabase.auth.signUp({email:authEmail,password:authPassword}); if(result.error){setAuthMessage(result.error.message);}else{setAuthMessage(mode==='signup'&&!result.data.session?'Revisá tu correo para confirmar la cuenta.':'Sesión iniciada.'); if(result.data.session){setAuthOpen(false);loadSavedProjects(result.data.session.user.id);}}}
  async function signOut(){if(!supabase)return;await supabase.auth.signOut();setSession(null);setSavedProjects([]);setAuthMessage('Sesión cerrada.');}
  function restoreProject(p:SavedProject){const c=p.conditions||{};setSun(c.sun||'Sol pleno');setSoil(c.soil||'No estoy seguro');setDrain(c.drainage||'Normal');setStyle(c.style||'Tropical contemporáneo');setCare(c.maintenance||'Bajo');setBudget(c.budget||'Intermedio');setGoal(c.goal||'Embellecer el patio');setWidth(String(p.width_m||c.width||8));setLength(String(p.length_m||c.length||12));setNote(c.notes||'');setDesign(createDesignBrief(c));setGenerated(true);setTab('plan');setSaveMessage('Proyecto cargado.');}
  const area=Number(width)>0&&Number(length)>0?Number(width)*Number(length):0;
  async function generate(){
    setAiError('');setAiAnalysis(null);setAiImage(null);
    const conditions={sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note};
    if(!photos.some(file=>file.type.startsWith('image/'))){setAiError('Para probar Gemini, subí una fotografía del terreno.');return;}
    setSaveBusy(true);setAiLoading(true);setSaveMessage('Gemini está analizando tu fotografía…');
    let analysis='';
    try{analysis=await requestGardenAnalysis();setAiAnalysis(analysis);}
    catch(e){let message=e instanceof Error?e.message:'No se pudo analizar la fotografía.';try{const response=(e as any)?.context;const payload=response?.clone?await response.clone().json():null;if(payload?.error)message=String(payload.error);}catch{}setAiError(message);setSaveMessage('');setSaveBusy(false);setAiLoading(false);return;}
    finally{setAiLoading(false);}
    const brief=createDesignBrief(conditions);setDesign(brief);setGenerated(true);setTab('render');
    if(!session?.user){
      setSaveMessage('Gemini analizó tu fotografía correctamente. Estás en modo demo: el proyecto no se guardó.');
      setSaveBusy(false);
      return;
    }
    setSaveMessage('Análisis real de Gemini completado. Preparando los elementos conceptuales…');
    try{
      let photoPath:string|null=null;const photo=photos.find(f=>f.type.startsWith('image/'));
      const {data:project,error:projectError}=await supabase!.from('projects').insert({user_id:session!.user.id,name:'Jardín '+new Date().toLocaleDateString('es-PY'),status:'designed',width_m:Number(width)||0,length_m:Number(length)||0,conditions,original_photo_path:null}).select('id').single();
      if(projectError)throw projectError;
      if(photo&&project){const path=`${session!.user.id}/${project.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const upload=await supabase!.storage.from('garden-photos').upload(path,photo,{contentType:photo.type,upsert:false});if(upload.error)throw upload.error;photoPath=path;await supabase!.from('projects').update({original_photo_path:photoPath}).eq('id',project.id);}
      const layout=createGardenLayout(conditions);const specs=createPlantingSpecs(conditions);const estimate=createBudgetEstimate(conditions);
      const {error:designError}=await supabase!.from('designs').insert({project_id:project.id,user_id:session!.user.id,version:1,status:'completed',plan_data:{conditions,layout,planMarkup,gemini_analysis:analysis},plant_recommendations:specs,budget_estimate:estimate});
      if(designError)throw designError;
      await loadSavedProjects(session!.user.id);setSaveMessage('Análisis de Gemini completado y proyecto guardado. El plano, las plantas y el presupuesto siguen siendo estimaciones conceptuales calculadas por Garden AI.');
    }catch(e){setSaveMessage('Gemini analizó la fotografía, pero no se pudo guardar el proyecto: '+(e instanceof Error?e.message:'error'));}
    finally{setSaveBusy(false);}
  }
  const planMarkup=useMemo(()=>{
    const w=Math.max(1,Number(width)||8),l=Math.max(1,Number(length)||12);
    const conditions={sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:w,length:l,notes:note};
    const layout=createGardenLayout(conditions);
    const svgW=440,svgH=360,margin=38,plotW=svgW-2*margin,plotH=svgH-76;
    const scale=Math.min(plotW/w,plotH/l),drawW=w*scale,drawH=l*scale;
    const x0=margin+(plotW-drawW)/2,y0=48+(plotH-drawH)/2;
    const sx=(x:number)=>x0+x*scale,sy=(y:number)=>y0+y*scale;
    const colors:Record<string,string>={bed:'#a8c39b',border:'#a8c39b',focal:'#c4b28b',path:'#e3d8c5',lawn:'#cbdcbe',patio:'#c6b8a5',gravel:'#d7d1c2',water:'#8ebec4',tree:'#8eb08a',vegetable:'#94bd82'};
    const zones=layout.zones.map(z=>{const color=colors[z.type]||'#c6d5bc',tx=sx(z.x),ty=sy(z.y),tw=z.width*scale,th=z.length*scale;if(z.type==='tree')return '<g><circle cx="'+sx(z.x+z.width/2)+'" cy="'+sy(z.y+z.length/2)+'" r="'+Math.max(7,Math.min(z.width,z.length)*scale*.48)+'" fill="#72966a" stroke="#3e6040" opacity=".82"/><circle cx="'+sx(z.x+z.width/2-3)+'" cy="'+sy(z.y+z.length/2-3)+'" r="'+Math.max(4,Math.min(z.width,z.length)*scale*.25)+'" fill="#8caf7e" opacity=".75"/></g>';if(z.type==='water')return '<rect x="'+tx+'" y="'+ty+'" width="'+tw+'" height="'+th+'" rx="5" fill="'+color+'" stroke="#538c9a"/>';if(z.shape&&z.type==='path')return '<path d="'+z.shape+'" transform="translate('+tx+' '+ty+') scale('+tw/100+' '+th/100+')" fill="none" stroke="#b8aa95" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="'+z.shape+'" transform="translate('+tx+' '+ty+') scale('+tw/100+' '+th/100+')" fill="none" stroke="#e7ddcc" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/> ';if(z.shape)return '<path d="'+z.shape+'" transform="translate('+tx+' '+ty+') scale('+tw/100+' '+th/100+')" fill="'+color+'" opacity=".78" stroke="#68825f" stroke-width="1.2"/>';if(z.type==='lawn')return '';return '<rect x="'+tx+'" y="'+ty+'" width="'+tw+'" height="'+th+'" rx="4" fill="'+color+'" opacity=".75" stroke="#68825f"/><text x="'+sx(z.x+z.width/2)+'" y="'+sy(z.y+z.length/2)+'" font-size="8" text-anchor="middle" fill="#394b37">'+z.name+'</text>';}).join('');
    const plants=layout.plantings.map((p,i)=>{const px=sx(p.x),py=sy(p.y),r=Math.max(4,Math.min(12,scale*(p.spacingCm/100)*.22)),col=i%2?'#6e9466':'#557d51';return '<g><circle cx="'+px+'" cy="'+py+'" r="'+r+'" fill="'+col+'" stroke="#3f6540"/><text x="'+px+'" y="'+(py+r+9)+'" font-size="7" text-anchor="middle" fill="#29432c">'+p.name+' · '+p.quantity+'</text></g>';}).join('');
    const heading=style==='Minimalista'?'MINIMALISTA':style==='Japonés zen'?'JARDÍN ZEN':goal==='Crear privacidad'?'PRIVACIDAD':goal==='Jardín para niños / mascotas'?'JARDÍN FAMILIAR':goal==='Huerta'?'HUERTA':goal==='Reducir calor'?'JARDÍN FRESCO':'TROPICAL CONTEMPORÁNEO';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 360" width="880" height="720"><rect width="440" height="360" fill="#f7f4e9"/><text x="220" y="17" font-size="11" text-anchor="middle" font-weight="700" fill="#263c2b">'+heading+' · '+w+' × '+l+' m</text><rect x="'+x0+'" y="'+y0+'" width="'+drawW+'" height="'+drawH+'" rx="3" fill="#d4e2cc" stroke="#4c6348" stroke-width="2.2"/> '+zones+plants+'<text x="220" y="350" text-anchor="middle" font-size="8" fill="#52654b">Zonas y elementos conceptuales · verificar medidas en sitio</text></svg>';
  },[width,length,design,sun,soil,drain,style,care,goal,budget,note]);
  function escapeHTML(value:string){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function generateProposal(){
    const conditions={sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note};
    const specs=createPlantingSpecs(conditions);
    const estimate=createBudgetEstimate(conditions);
    const lines=estimate.lines.map(line=>{const unit=priceOverrides[line.name]??line.unitPrice;return {...line,unitPrice:unit,total:line.quantity*unit};});
    const total=lines.reduce((sum,line)=>sum+line.total,0);
    const rows=lines.map(line=>'<tr><td>'+escapeHTML(line.name)+'</td><td>'+line.quantity.toLocaleString('es-PY')+' '+escapeHTML(line.unit)+'</td><td>₲ '+Math.round(line.unitPrice).toLocaleString('es-PY')+'</td><td>₲ '+Math.round(line.total).toLocaleString('es-PY')+'</td></tr>').join('');
    const plantRows=specs.map(p=>'<tr><td>'+escapeHTML(p.name)+'</td><td>'+escapeHTML(p.role)+'</td><td>'+p.quantity+'</td><td>'+p.spacingCm+' cm</td><td>'+escapeHTML(p.zone)+'</td></tr>').join('');
    const summary=[['Exposición solar',sun],['Tipo de suelo',soil],['Drenaje',drain],['Estilo',style],['Mantenimiento',care],['Objetivo',goal],['Nivel de presupuesto',budget],['Dimensiones',width+' × '+length+' m'],['Área',area.toLocaleString('es-PY')+' m²']];
    const brief=summary.map(([k,v])=>'<div class="info"><small>'+escapeHTML(k)+'</small><b>'+escapeHTML(v)+'</b></div>').join('');
    const warnings=(design?.warnings||[]).map(w=>'<li>'+escapeHTML(w)+'</li>').join('');
    const documentHTML=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Propuesta paisajística</title><style>
      @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#28372c;font-size:11px;line-height:1.5;margin:0}header{background:#20392a;color:#fff;padding:25px;border-radius:10px;margin-bottom:20px}header h1{font-size:26px;margin:5px 0;font-weight:500}header small{letter-spacing:2px;color:#d1dfc8}h2{font-size:16px;color:#3f5a3d;margin:22px 0 9px;border-bottom:1px solid #e4e9df;padding-bottom:6px}p{color:#626d62}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.info{background:#f3f6f0;padding:10px;border-radius:6px}.info small{display:block;color:#758174;font-size:9px}.info b{display:block;margin-top:4px;font-size:11px}svg.plan{width:100%;height:auto;border:1px solid #e2e8dd;border-radius:8px;background:#f7f4e9}table{border-collapse:collapse;width:100%;font-size:10px}th{background:#edf3e9;color:#3f573d;text-align:left}td,th{padding:7px;border-bottom:1px solid #e8ece5}tfoot td{font-weight:bold;background:#f3f6f0}ul{padding-left:18px}footer{margin-top:28px;border-top:1px solid #e2e7df;padding-top:10px;color:#798479;font-size:9px}.actions{position:fixed;top:10px;right:10px;background:#20392a;color:#fff;border:0;padding:11px 16px;border-radius:6px;cursor:pointer}@media print{.actions{display:none}header{print-color-adjust:exact;-webkit-print-color-adjust:exact}.info,th,tfoot td{print-color-adjust:exact;-webkit-print-color-adjust:exact}h2{break-after:avoid}table{break-inside:auto}tr{break-ins:avoid}}
      </style></head><body><button class="actions" onclick="window.print()">Guardar / imprimir PDF</button><header><small>GARDEN AI · PROPUESTA CONCEPTUAL</small><h1>Diseño paisajístico</h1><p style="color:#d7e1d2;margin:0">Documento de propuesta · ${new Date().toLocaleDateString('es-PY')}</p></header>
      <h2>Condiciones y objetivos del espacio</h2><div class="grid">${brief}</div><h2>Plano conceptual (vista superior)</h2>${planMarkup}<p>Plano ilustrativo de distribución. Confirmar medidas y ubicaciones en sitio antes de ejecutar.</p><h2>Selección vegetal estimada</h2><table><thead><tr><th>Especie</th><th>Función</th><th>Cantidad</th><th>Separación</th><th>Zona</th></tr></thead><tbody>${plantRows}</tbody></table><h2>Presupuesto preliminar</h2><table><thead><tr><th>Ítem</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3">INVERSIÓN TOTAL ESTIMADA</td><td>₲ ${Math.round(total).toLocaleString('es-PY')}</td></tr></tfoot></table><h2>Observaciones</h2><ul>${warnings}</ul><p>${note?'<b>Notas del cliente:</b> '+escapeHTML(note):''}</p><p>Los valores, cantidades y trazado son preliminares. Ajustar tras visita, verificación de medidas, condiciones del suelo, elección de proveedores y validación técnica. Los precios no representan cotizaciones vigentes.</p><footer>Propuesta conceptual generada con Garden AI · Sujeta a revisión y ajuste en terreno.</footer></body></html>`;
    const win=window.open('','_blank');
    if(!win){alert('El navegador bloqueó la ventana. Permití ventanas emergentes para generar el documento.');return;}
    win.document.open();win.document.write(documentHTML);win.document.close();
  }
  async function requestGardenAnalysis(){
    const source=photos.find(file=>file.type.startsWith('image/'));
    if(!source)throw new Error('Primero subí una fotografía del terreno.');
    if(!supabase)throw new Error('Supabase no está configurado en esta versión.');
    const imageBase64=await new Promise<string>((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{const value=String(reader.result||'');const comma=value.indexOf(',');resolve(comma>=0?value.slice(comma+1):value);};
      reader.onerror=()=>reject(new Error('No se pudo leer la fotografía.'));
      reader.readAsDataURL(source);
    });
    const {data,error}=await supabase.functions.invoke('analyze-garden',{body:{
      imageBase64,mimeType:source.type,
      conditions:{sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note}
    }});
    if(error)throw new Error(data?.error||error.message||'No se pudo conectar con Gemini.');
    if(!data?.analysis)throw new Error(data?.error||'Gemini no devolvió un análisis.');
    return String(data.analysis);
  }
  async function generateAIImage(){
    setAiLoading(true);setAiError('');
    const source=photos.find(file=>file.type.startsWith('image/'));
    if(!source){setAiError('Primero subí una fotografía del terreno.');setAiLoading(false);return;}
    if(!supabase){setAiError('Supabase no está configurado en esta versión.');setAiLoading(false);return;}
    try{
      const imageBase64=await new Promise<string>((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>{const value=String(reader.result||'');const comma=value.indexOf(',');resolve(comma>=0?value.slice(comma+1):value);};
        reader.onerror=()=>reject(new Error('No se pudo leer la fotografía.'));
        reader.readAsDataURL(source);
      });
      const {data,error}=await supabase.functions.invoke('analyze-garden',{body:{
        action:'generate-image',imageBase64,mimeType:source.type,
        conditions:{sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note}
      }});
      if(error)throw new Error(data?.error||error.message||'No se pudo conectar con Gemini.');
      if(typeof data?.image!=='string'||!data.image.startsWith('data:image/'))throw new Error(data?.error||'Gemini no devolvió una imagen válida.');
      setAiImage(data.image);
    }catch(error){setAiError(error instanceof Error?error.message:'Error al generar la imagen.');}
    finally{setAiLoading(false);}
  }
  function downloadSVG(){
    const blob=new Blob([planMarkup],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='garden-ai-plano-conceptual.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Leaf size={23}/></div><div><b>garden<span>ai</span></b><small>LANDSCAPE STUDIO</small></div></div>
      <div className="nav-label">PROYECTO</div><div className="nav-item active"><Sparkles size={17}/> Nuevo diseño</div><div className="nav-item muted"><LayoutGrid size={17}/> Mis proyectos</div>
      <div className="side-note"><div className="side-leaf"><Sprout size={20}/></div><b>Tu espacio,<br/>tu naturaleza.</b><p>Convertí ideas en un jardín pensado para vos.</p></div><div className="side-footer">DISEÑO PAISAJÍSTICO CON IA</div>
    </aside>
    <section className="workspace"><header className="topbar"><div className="crumb">Garden AI <ChevronRight size={14}/> <strong>Nuevo proyecto</strong></div><div className="top-actions">{session?.user?<><span className="signed-user">{session.user.email}</span><button className="auth-button" onClick={signOut}>Salir</button></>:<button className="auth-button" onClick={()=>setAuthOpen(v=>!v)}>Ingresar / Registrarse</button>}<span className="version">PREVIEW · 0.1</span></div></header>
    <div className="content">{authOpen&&!session&&<section className="auth-card"><h3>Tu cuenta Garden AI</h3><p>La cuenta es opcional. Podés probar el generador sin registrarte; creá una cuenta solo para guardar y recuperar tus proyectos y usar las funciones de Gemini.</p><input type="email" placeholder="Correo electrónico" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/><input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/><div className="auth-buttons"><button onClick={()=>authAction('login')}>Ingresar</button><button onClick={()=>authAction('signup')}>Crear cuenta</button></div>{authMessage&&<small>{authMessage}</small>}</section>}{session&&<section className="saved-card"><b>Mis proyectos guardados</b>{savedProjects.length===0?<small>Sin proyectos guardados todavía.</small>:savedProjects.map(p=><button className="saved-project" key={p.id} onClick={()=>restoreProject(p)}>{p.name} · {p.width_m||'?'}×{p.length_m||'?'} m</button>)}{saveMessage&&<small>{saveMessage}</small>}</section>}<div className="hero"><div className="eyebrow"><span className="dot"/> ESTUDIO DE PAISAJISMO INTELIGENTE</div><h1>Diseñá un jardín<br/><em>que se sienta tuyo.</em></h1><p>Contanos sobre tu espacio. Creamos una propuesta visual y una distribución para empezar a transformarlo.</p></div>
    <div className="layout">
      <section className="form-panel"><div className="panel-title"><div className="title-icon"><PencilRuler size={18}/></div><div><h2>Datos del terreno</h2><p>Personalizá el diseño con las condiciones reales.</p></div></div>
      <label className="field-label">Fotografías del espacio <span>OPCIONAL</span></label><label className="upload-zone"><input type="file" accept="image/*" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]))}/><ImagePlus size={24}/><strong>Subí imágenes de tu patio</strong><small>Subí una o varias fotos desde distintos ángulos</small><span className="upload-button">Seleccionar archivos</span></label>
      {previews.length>0&&<div className="preview-grid">{previews.map((p,i)=><img key={i} src={p} alt="Foto subida"/>)}{photos.some(p=>p.type.startsWith('video/'))&&<small>Video cargado. El análisis de video se habilitará en una futura integración.</small>}</div>}
      <div className="field-row"><div className="field"><label className="field-label"><Sun size={15}/> Exposición solar</label><select value={sun} onChange={e=>setSun(e.target.value)}><option>Sol pleno</option><option>Media sombra</option><option>Sombra</option><option>No estoy seguro</option></select></div><div className="field"><label className="field-label"><CloudSun size={15}/> Tipo de suelo</label><select value={soil} onChange={e=>setSoil(e.target.value)}><option>No estoy seguro</option><option>Arcilloso</option><option>Arenoso</option><option>Tierra negra / fértil</option><option>Relleno / compactado</option></select></div></div>
      <div className="field-row"><div className="field"><label className="field-label"><Droplets size={15}/> Drenaje</label><select value={drain} onChange={e=>setDrain(e.target.value)}><option>Normal</option><option>Se encharca</option><option>Muy rápido / seco</option><option>No estoy seguro</option></select></div><div className="field"><label className="field-label"><TreePine size={15}/> Estilo de jardín</label><select value={style} onChange={e=>setStyle(e.target.value)}><option>Tropical contemporáneo</option><option>Minimalista</option><option>Natural / silvestre</option><option>Japonés zen</option><option>Mediterráneo</option><option>Moderno elegante</option></select></div></div>
      <div className="field-row"><div className="field"><label className="field-label">Mantenimiento</label><select value={care} onChange={e=>setCare(e.target.value)}><option>Bajo</option><option>Medio</option><option>Alto</option></select></div><div className="field"><label className="field-label">Presupuesto estimado</label><select value={budget} onChange={e=>setBudget(e.target.value)}><option>Económico</option><option>Intermedio</option><option>Premium</option></select></div></div>
      <div className="field"><label className="field-label">Objetivo del espacio</label><select value={goal} onChange={e=>setGoal(e.target.value)}><option>Embellecer el patio</option><option>Crear privacidad</option><option>Reducir calor</option><option>Espacio de descanso</option><option>Renovar completamente</option><option>Jardín para niños / mascotas</option></select></div>
      <div className="dimensions"><label className="field-label"><Ruler size={15}/> Dimensiones aproximadas (metros)</label><div className="field-row"><div className="field"><label className="small-label">Ancho</label><input type="number" min="1" value={width} onChange={e=>setWidth(e.target.value)}/></div><div className="field"><label className="small-label">Largo</label><input type="number" min="1" value={length} onChange={e=>setLength(e.target.value)}/></div></div><small className="area">Área estimada: <b>{area.toLocaleString('es-PY')} m²</b></small></div>
      <div className="field"><label className="field-label">Notas adicionales</label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ej. conservar el árbol existente, evitar plantas con espinas, hay un perro..."/></div>
      <button className="generate" onClick={generate} disabled={saveBusy}><Sparkles size={17}/> {saveBusy?(aiLoading?'Analizando con Gemini…':'Guardando propuesta…'):session?.user?'Analizar foto y crear propuesta':'Probar Gemini y crear propuesta'} <ChevronRight size={18}/></button>{saveMessage&&<p className="save-message">{saveMessage}</p>}{aiError&&<p className="ai-error" role="alert">No se pudo procesar la fotografía: {aiError}</p>}<p className="disclaimer"><CircleHelp size={14}/> Podés probar el análisis de fotografías y la visualización con Gemini sin registrarte. La cuenta solo es necesaria para guardar y recuperar proyectos.</p></section>
      <section className="results"><div className="result-header"><div><span className="result-kicker">TU PROYECTO</span><h2>{generated?'Propuesta conceptual':'Tu jardín, por diseñar'}</h2></div><div className="status-pill"><span/> {generated?'Concepto creado':'En espera'}</div></div>
      {generated?<><div className="tabs">{([['plan','Plano cenital'],['sketch','Croquis'],['plants','Vegetación'],['budget','Presupuesto'],['render','Visualización']] as [Tab,string][]).map(([t,label])=><button key={t} className={tab===t?'tab active':'tab'} onClick={()=>setTab(t)}>{label}</button>)}</div>
      {tab==='plan'&&<div className="plan-card"><div className="plan-top"><b>Distribución esquemática</b><span>{width} × {length} m</span></div><div className="plan-svg dynamic-plan" dangerouslySetInnerHTML={{__html:planMarkup}} /><div className="plan-legend"><span><i className="legend-tree"/> Plantación</span><span><i className="legend-flower"/> Flor / acento</span><span><i className="legend-path"/> Camino</span></div><div className="budget-actions" style={{justifyContent:"center",gap:8,flexWrap:"wrap"}}><button className="export" onClick={downloadSVG}><Download size={15}/> Descargar plano SVG</button><button className="export" onClick={generateProposal}><FileText size={15}/> Generar propuesta PDF</button></div></div>}
      {tab==='sketch'&&<div className="sketch-box"><div className="sketch-sheet"><div className="sketch-title">IDEA DE COMPOSICIÓN</div><div className="sketch-lines"><div className="scribble">≈≈≈≈≈≈≈</div><div className="sketch-plant">♧<br/>♧♧</div><div className="sketch-plant right">♧<br/>♧♧</div><div className="sketch-path"/></div><p>Volúmenes en capas: plantas altas en los bordes, cobertura media y recorrido despejado.</p></div><span className="note-tag">Croquis conceptual · Referencial</span></div>}
      {tab==='plants'&&<div className="plant-list"><div className="planting-summary"><strong>Estimación para {area} m²</strong><span>Plantación considerada: 28% de superficie (editable en terreno)</span></div>{createPlantingSpecs({sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note}).map((p,i)=><div className="plant-item plant-spec" key={i}><div className="plant-icon"><Sprout size={20}/></div><div className="plant-spec-main"><b>{p.name}</b><small>{p.role} · {p.spacingCm} cm entre centros · {p.position}</small><small>{p.zone}</small></div><div className="plant-count"><strong>{p.quantity}</strong><span>unidades</span></div></div>)}<div className="plant-warning">Cantidades estimadas a partir de una densidad orientativa y un área de canteros calculada al 28%. Ajustar según tamaño adulto, suelo, especie, presupuesto y diseño final. No es lista de compra definitiva.</div></div>}{tab==='budget'&&<div className="budget-panel"><div className="budget-intro"><button className="export" onClick={generateProposal}><FileText size={15}/> Exportar propuesta PDF</button><strong>Presupuesto preliminar del proyecto</strong><span>Estimación automática en guaraníes, basada en la superficie y las cantidades orientativas.</span></div>{(()=>{const estimate=createBudgetEstimate({sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note});const total=estimate.lines.reduce((sum,line)=>sum+line.quantity*(priceOverrides[line.name]??line.unitPrice),0);return <><div className="budget-total"><span>Inversión estimada</span><strong>₲ {Math.round(total).toLocaleString('es-PY')}</strong><small>Para {estimate.area.toLocaleString('es-PY')} m² de terreno · Podés editar los precios</small></div><div className="budget-lines">{estimate.lines.map((line,i)=>{const unitPrice=priceOverrides[line.name]??line.unitPrice;const subtotal=line.quantity*unitPrice;return <div className="budget-line" key={i}><div className="budget-line-main"><b>{line.name}</b><small>{line.quantity.toLocaleString('es-PY')} {line.unit} · {line.note}</small><label className="budget-price-editor"><span>Precio unitario (₲)</span><input type="number" min="0" step="1000" value={unitPrice} onChange={e=>setPriceOverrides(prev=>({...prev,[line.name]:Math.max(0,Number(e.target.value)||0)}))}/></label></div><strong>₲ {Math.round(subtotal).toLocaleString('es-PY')}</strong></div>})}</div><div className="budget-actions"><button type="button" onClick={()=>setPriceOverrides({})}>Restablecer precios sugeridos</button></div><div className="budget-disclaimer">Valores referenciales de ejemplo para Paraguay, no son cotizaciones vigentes ni precios de proveedores. No incluyen transporte, retiro de escombros, riego automático, iluminación, maquinaria ni obras civiles. Solicitar precios locales y ajustar cantidades después de medir el terreno.</div></>})()}</div>}{tab==='render'&&<div className="render-placeholder"><h3>Visualización fotorrealista del jardín</h3><p>La IA edita tu fotografía para mostrar una posible renovación, respetando la estructura visible del espacio.</p>{aiImage?<img className="ai-render-image" src={aiImage} alt="Render de jardín generado por IA"/>:<div className="render-scene"><div className="sun-ball"/><div className="scene-house"/><div className="scene-lawn"/><div className="scene-shrub shrub1"/><div className="scene-shrub shrub2"/><div className="scene-shrub shrub3"/></div>}<button className="generate" type="button" onClick={generateAIImage} disabled={aiLoading}>{aiLoading?'Generando visualización…':'Generar imagen de mi jardín'} <Sparkles size={16}/></button>{aiError&&<p className="ai-error">{aiError}</p>}<p className="ai-note">La imagen es una propuesta visual generada por IA, no un plano técnico. Verificá medidas, especies y condiciones del terreno antes de ejecutar.</p></div>}
      <div className="brief">{design?.warnings.map((w,i)=><p className="brief-note" key={i}>⚠ {w}</p>)}<h3><Check size={16}/> Resumen de condiciones</h3><div className="brief-grid"><span>Sol<strong>{sun}</strong></span><span>Suelo<strong>{soil}</strong></span><span>Drenaje<strong>{drain}</strong></span><span>Estilo<strong>{style}</strong></span><span>Cuidados<strong>{care}</strong></span><span>Presupuesto<strong>{budget}</strong></span><span>Objetivo<strong>{goal}</strong></span><span>Superficie<strong>{area} m²</strong></span></div>{note&&<p className="brief-note">Notas: {note}</p>}</div>
      </>:<div className="empty-result"><div className="empty-art"><div className="sun-disc"/><div className="empty-hill hill-a"/><div className="empty-hill hill-b"/><div className="empty-tree tree-a"/><div className="empty-tree tree-b"/><div className="empty-flower f-a"/><div className="empty-flower f-b"/></div><h3>Tu idea comienza acá</h3><p>Completá las condiciones del terreno y creá una primera propuesta para visualizar la distribución.</p><div className="steps"><span><b>01</b> Condiciones</span><span><b>02</b> Distribución</span><span><b>03</b> Ajustes</span></div></div>}
    </section></div></div></section>
  </main>;
}