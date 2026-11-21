import { useMemo, useState } from 'react';
import { createDesignBrief, recommendPlants } from './designEngine';
import { Leaf, Sun, CloudSun, Droplets, Ruler, ImagePlus, Sparkles, Download, Sprout, LayoutGrid, PencilRuler, ChevronRight, Check, CircleHelp, TreePine } from 'lucide-react';

type Tab = 'render'|'plan'|'sketch'|'plants';
export default function App(){
  const [photos,setPhotos]=useState<File[]>([]);
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
  const previews=useMemo(()=>photos.map(f=>URL.createObjectURL(f)),[photos]);
  const area=Number(width)>0&&Number(length)>0?Number(width)*Number(length):0;
  function generate(){const conditions={sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note};setDesign(createDesignBrief(conditions));setGenerated(true);setTab('plan');}
  const planMarkup=useMemo(()=>{
    const w=Math.max(1,Number(width)||8),l=Math.max(1,Number(length)||12);
    const plants=design?.plants||recommendPlants({sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:w,length:l,notes:note});
    const names=plants.slice(0,6);
    const plantCircles=names.map((p,i)=>{
      const positions=[[0.20,0.18],[0.50,0.15],[0.80,0.20],[0.18,0.47],[0.82,0.48],[0.22,0.78]];
      const [px,py]=positions[i%positions.length],cx=40+px*360,cy=35+py*285;
      const r=p.role.toLowerCase().includes('arbusto')||p.role.toLowerCase().includes('foco')?19:14;
      return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="#63865c" stroke="#35583b" stroke-width="2"/><circle r="${r*.55}" fill="#8eaa7e" opacity=".65"/><text y="${r+12}" font-size="9" text-anchor="middle" fill="#314a32">${p.name.replace(/&/g,'&amp;')}</text></g>`;
    }).join('');
    const pathWidth=Math.max(22,Math.min(38,360/(Math.max(w,l))));
    const view=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 360" width="880" height="720"><defs><pattern id="grass" width="12" height="12" patternUnits="userSpace"><circle cx="3" cy="3" r="1" fill="#c1d3b2"/><circle cx="9" cy="8" r=".7" fill="#c1d3b2"/></pattern></defs><rect width="440" height="360" fill="#f7f4e9"/><text x="220" y="16" font-size="12" text-anchor="middle" font-weight="700" fill="#263c2b">PLANO CONCEPTUAL · ${w} × ${l} m (${(w*l).toFixed(1)} m²)</text><rect x="20" y="25" width="400" height="305" fill="#d7e4cd" stroke="#4c6348" stroke-width="3"/><rect x="24" y="29" width="392" height="297" fill="url(#grass)"/><rect x="30" y="35" width="112" height="72" rx="3" fill="#c8bcae" stroke="#8e8376"/><text x="86" y="76" font-size="11" text-anchor="middle" fill="#554c43">Casa / terraza</text><path d="M150 35 H410 V325 H160 V272 H215 V142 H150 Z" fill="#b9d3a7" stroke="#8fa77f"/><path d="M155 315 H400 V275 H220 V150 H155 Z" fill="#e1d6c3" stroke="#b9ad99" stroke-width="2"/>${plantCircles}<text x="220" y="348" text-anchor="middle" font-size="10" fill="#52654b">Distribución orientativa · ajustar en sitio, no es plano de obra</text></svg>`;
    return view;
  },[width,length,design,sun,soil,drain,style,care,goal,budget,note]);
  function downloadSVG(){
    const blob=new Blob([planMarkup],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='garden-ai-plano-conceptual.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Leaf size={23}/></div><div><b>garden<span>ai</span></b><small>LANDSCAPE STUDIO</small></div></div>
      <div className="nav-label">PROYECTO</div><div className="nav-item active"><Sparkles size={17}/> Nuevo diseño</div><div className="nav-item muted"><LayoutGrid size={17}/> Mis proyectos</div>
      <div className="side-note"><div className="side-leaf"><Sprout size={20}/></div><b>Tu espacio,<br/>tu naturaleza.</b><p>Convertí ideas en un jardín pensado para vos.</p></div><div className="side-footer">DISEÑO PAISAJÍSTICO CON IA</div>
    </aside>
    <section className="workspace"><header className="topbar"><div className="crumb">Garden AI <ChevronRight size={14}/> <strong>Nuevo proyecto</strong></div><span className="version">PREVIEW · 0.1</span></header>
    <div className="content"><div className="hero"><div className="eyebrow"><span className="dot"/> ESTUDIO DE PAISAJISMO INTELIGENTE</div><h1>Diseñá un jardín<br/><em>que se sienta tuyo.</em></h1><p>Contanos sobre tu espacio. Creamos una propuesta visual y una distribución para empezar a transformarlo.</p></div>
    <div className="layout">
      <section className="form-panel"><div className="panel-title"><div className="title-icon"><PencilRuler size={18}/></div><div><h2>Datos del terreno</h2><p>Personalizá el diseño con las condiciones reales.</p></div></div>
      <label className="field-label">Fotos o videos del espacio <span>OPCIONAL</span></label><label className="upload-zone"><input type="file" accept="image/*,video/*" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]))}/><ImagePlus size={24}/><strong>Subí imágenes de tu patio</strong><small>Fotos desde distintos ángulos o un video corto</small><span className="upload-button">Seleccionar archivos</span></label>
      {previews.length>0&&<div className="preview-grid">{previews.map((p,i)=><img key={i} src={p} alt="Foto subida"/>)}{photos.some(p=>p.type.startsWith('video/'))&&<small>Video cargado. El análisis de video se habilitará en una futura integración.</small>}</div>}
      <div className="field-row"><div className="field"><label className="field-label"><Sun size={15}/> Exposición solar</label><select value={sun} onChange={e=>setSun(e.target.value)}><option>Sol pleno</option><option>Media sombra</option><option>Sombra</option><option>No estoy seguro</option></select></div><div className="field"><label className="field-label"><CloudSun size={15}/> Tipo de suelo</label><select value={soil} onChange={e=>setSoil(e.target.value)}><option>No estoy seguro</option><option>Arcilloso</option><option>Arenoso</option><option>Tierra negra / fértil</option><option>Relleno / compactado</option></select></div></div>
      <div className="field-row"><div className="field"><label className="field-label"><Droplets size={15}/> Drenaje</label><select value={drain} onChange={e=>setDrain(e.target.value)}><option>Normal</option><option>Se encharca</option><option>Muy rápido / seco</option><option>No estoy seguro</option></select></div><div className="field"><label className="field-label"><TreePine size={15}/> Estilo de jardín</label><select value={style} onChange={e=>setStyle(e.target.value)}><option>Tropical contemporáneo</option><option>Minimalista</option><option>Natural / silvestre</option><option>Japonés zen</option><option>Mediterráneo</option><option>Moderno elegante</option></select></div></div>
      <div className="field-row"><div className="field"><label className="field-label">Mantenimiento</label><select value={care} onChange={e=>setCare(e.target.value)}><option>Bajo</option><option>Medio</option><option>Alto</option></select></div><div className="field"><label className="field-label">Presupuesto estimado</label><select value={budget} onChange={e=>setBudget(e.target.value)}><option>Económico</option><option>Intermedio</option><option>Premium</option></select></div></div>
      <div className="field"><label className="field-label">Objetivo del espacio</label><select value={goal} onChange={e=>setGoal(e.target.value)}><option>Embellecer el patio</option><option>Crear privacidad</option><option>Reducir calor</option><option>Espacio de descanso</option><option>Renovar completamente</option><option>Jardín para niños / mascotas</option></select></div>
      <div className="dimensions"><label className="field-label"><Ruler size={15}/> Dimensiones aproximadas (metros)</label><div className="field-row"><div className="field"><label className="small-label">Ancho</label><input type="number" min="1" value={width} onChange={e=>setWidth(e.target.value}/></div><div className="field"><label className="small-label">Largo</label><input type="number" min="1" value={length} onChange={e=>setLength(e.target.value}/></div></div><small className="area">Área estimada: <b>{area.toLocaleString('es-PY')} m²</b></small></div>
      <div className="field"><label className="field-label">Notas adicionales</label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ej. conservar el árbol existente, evitar plantas con espinas, hay un perro..."/></div>
      <button className="generate" onClick={generate}><Sparkles size={17}/> Crear propuesta conceptual <ChevronRight size={18}/></button><p className="disclaimer"><CircleHelp size={14}/> Esta primera versión crea un esquema ilustrativo. La IA de renders y los planos técnicos se conectarán en próximas etapas.</p></section>
      <section className="results"><div className="result-header"><div><span className="result-kicker">TU PROYECTO</span><h2>{generated?'Propuesta conceptual':'Tu jardín, por diseñar'}</h2></div><div className="status-pill"><span/> {generated?'Concepto creado':'En espera'}</div></div>
      {generated?<><div className="tabs">{([['plan','Plano cenital'],['sketch','Croquis'],['plants','Vegetación'],['render','Visualización']] as [Tab,string][]).map(([t,label])=><button key={t} className={tab===t?'tab active':'tab'} onClick={()=>setTab(t)}>{label}</button>)}</div>
      {tab==='plan'&&<div className="plan-card"><div className="plan-top"><b>Distribución esquemática</b><span>{width} × {length} m</span></div><div className="plan-svg dynamic-plan" dangerouslySetInnerHTML={{__html:planMarkup}} /><div className="plan-legend"><span><i className="legend-tree"/> Plantación</span><span><i className="legend-flower"/> Flor / acento</span><span><i className="legend-path"/> Camino</span></div><button className="export" onClick={downloadSVG}><Download size={15}/> Descargar plano SVG</button></div>}
      {tab==='sketch'&&<div className="sketch-box"><div className="sketch-sheet"><div className="sketch-title">IDEA DE COMPOSICIÓN</div><div className="sketch-lines"><div className="scribble">≈≈≈≈≈≈≈</div><div className="sketch-plant">♧<br/>♧♧</div><div className="sketch-plant right">♧<br/>♧♧</div><div className="sketch-path"/></div><p>Volúmenes en capas: plantas altas en los bordes, cobertura media y recorrido despejado.</p></div><span className="note-tag">Croquis conceptual · Referencial</span></div>}
      {tab==='plants'&&<div className="plant-list">{(design?.plants||recommendPlants({sun,soil,drainage:drain,style,maintenance:care,goal,budget,width:Number(width)||0,length:Number(length)||0,notes:note})).map((p,i)=><div className="plant-item" key={i}><div className="plant-icon"><Sprout size={20}/></div><div><b>{p.name}</b><small>{p.role} · {p.description}</small></div><span className="plant-tag">{p.upkeep}</span></div>)}<div className="plant-warning">Lista filtrada según sol y mantenimiento. Confirmar adaptación local, toxicidad para mascotas y disponibilidad antes de comprar.</div></div>}
      {tab==='render'&&<div className="render-placeholder"><div className="render-scene"><div className="sun-ball"/><div className="scene-house"/><div className="scene-lawn"/><div className="scene-shrub shrub1"/><div className="scene-shrub shrub2"/><div className="scene-shrub shrub3"/></div><h3>Vista realista del jardín</h3><p>La generación de renders con IA se conectará en la próxima etapa.</p></div>}
      <div className="brief">{design?.warnings.map((w,i)=><p className="brief-note" key={i}>⚠ {w}</p>)}<h3><Check size={16}/> Resumen de condiciones</h3><div className="brief-grid"><span>Sol<strong>{sun}</strong></span><span>Suelo<strong>{soil}</strong></span><span>Drenaje<strong>{drain}</strong></span><span>Estilo<strong>{style}</strong></span><span>Cuidados<strong>{care}</strong></span><span>Presupuesto<strong>{budget}</strong></span><span>Objetivo<strong>{goal}</strong></span><span>Superficie<strong>{area} m²</strong></span></div>{note&&<p className="brief-note">Notas: {note}</p>}</div>
      </>:<div className="empty-result"><div className="empty-art"><div className="sun-disc"/><div className="empty-hill hill-a"/><div className="empty-hill hill-b"/><div className="empty-tree tree-a"/><div className="empty-tree tree-b"/><div className="empty-flower f-a"/><div className="empty-flower f-b"/></div><h3>Tu idea comienza acá</h3><p>Completá las condiciones del terreno y creá una primera propuesta para visualizar la distribución.</p><div className="steps"><span><b>01</b> Condiciones</span><span><b>02</b> Distribución</span><span><b>03</b> Ajustes</span></div></div>}
    </section></div></div></section>
  </main>;
}