export type Conditions = {sun:string; soil:string; drainage:string; style:string; maintenance:string; goal:string; budget:string; width:number; length:number; notes:string};
export type Plant = {name:string; light:string[]; upkeep:'Bajo'|'Medio'|'Alto'; role:string; description:string};
const catalog:Plant[]=[
{name:'Agapanto',light:['Sol pleno','Media sombra'],upkeep:'Bajo',role:'Flor de acento',description:'Mata de floración estacional para borduras soleadas.'},
{name:'Liriope',light:['Media sombra','Sombra','Sol pleno'],upkeep:'Bajo',role:'Borde / cobertura',description:'Follaje compacto para definir bordes y cubrir suelo.'},
{name:'Dietes (moréia)',light:['Sol pleno','Media sombra'],upkeep:'Bajo',role:'Bordura estructural',description:'Hojas en forma de espada y flores ligeras; buen ritmo de plantación.'},
{name:'Philodendron',light:['Media sombra','Sombra'],upkeep:'Medio',role:'Follaje tropical',description:'Aporta volumen en sectores protegidos del sol fuerte.'},
{name:'Alocasia',light:['Media sombra','Sombra'],upkeep:'Medio',role:'Foco de hojas grandes',description:'Usar como acento protegido, en suelo húmedo pero drenado.'},
{name:'Tradescantia spathacea',light:['Media sombra','Sombra','Sol pleno'],upkeep:'Bajo',role:'Cobertura colorida',description:'Cobertura de hojas contrastantes; controlar expansión.'},
{name:'Pennisetum',light:['Sol pleno'],upkeep:'Medio',role:'Textura / movimiento',description:'Gramínea ornamental para bordes soleados y movimiento visual.'},
{name:'Duranta',light:['Sol pleno','Media sombra'],upkeep:'Medio',role:'Arbusto / privacidad',description:'Arbusto para volumen; requiere poda y espacio de crecimiento.'},
{name:'Murraya (jazmín naranja)',light:['Sol pleno','Media sombra'],upkeep:'Medio',role:'Arbusto aromático',description:'Arbusto de follaje denso, posible seto con poda.'},
{name:'Aspidistra',light:['Sombra','Media sombra'],upkeep:'Bajo',role:'Follaje para sombra',description:'Resistente para rincones con poca luz directa.'},
{name:'Zoysia',light:['Sol pleno','Media sombra'],upkeep:'Medio',role:'Césped',description:'Césped de crecimiento relativamente lento; evaluar pisoteo y sombra.'},
{name:'Ophiopogon',light:['Media sombra','Sombra'],upkeep:'Bajo',role:'Borde bajo',description:'Planta compacta para bordes y transiciones de sombra.'}
];
export function recommendPlants(c:Conditions):Plant[]{
 let pool=catalog.filter(p=>p.light.includes(c.sun)||c.sun==='No estoy seguro');
 if(c.maintenance==='Bajo')pool=pool.filter(p=>p.upkeep==='Bajo');
 if(c.goal==='Crear privacidad')pool=pool.filter(p=>['Arbusto / privacidad','Follaje tropical','Foco de hojas grandes'].includes(p.role));
 if(c.goal==='Reducir calor')pool=pool.filter(p=>['Follaje tropical','Cobertura colorida','Césped','Foco de hojas grandes','Bordura estructural'].includes(p.role));
 if(c.goal==='Jardín para niños / mascotas')pool=pool.filter(p=>!['Foco de hojas grandes'].includes(p.role));
 if(c.style==='Minimalista')pool=pool.filter(p=>['Bordura estructural','Borde / cobertura','Arbusto / privacidad','Césped'].includes(p.role));
 if(c.style==='Japonés zen')pool=pool.filter(p=>['Textura / movimiento','Borde / cobertura','Follaje para sombra','Bordura estructural'].includes(p.role));
 if(c.drainage==='Se encharca')pool=pool.filter(p=>p.name!=='Zoysia');
 return pool.slice(0,6);
}
export function createDesignBrief(c:Conditions){
 const plants=recommendPlants(c);
 const zones=[{zone:'1',name:'Estructura y puntos focales',description:'Colocá ejemplares altos cerca de límites o esquinas, sin bloquear recorridos.'},{zone:'2',name:'Capa intermedia',description:'Agrupá arbustos y plantas de volumen en grupos repetidos para dar continuidad.'},{zone:'3',name:'Borduras y cobertura',description:'Usá plantas bajas para suavizar bordes y reducir suelo expuesto.'},{zone:'4',name:'Circulación',description:'Dejá recorridos de paso claros; no llenes toda la superficie con plantación.'}];
 const warnings:string[]=[];
 if(c.sun==='No estoy seguro')warnings.push('Confirmá la exposición observando el espacio durante mañana, mediodía y tarde.');
 if(c.drainage==='Se encharca')warnings.push('Resolver drenaje antes de plantar: identificar punto bajo y salida de agua.');
 if(c.soil==='Relleno / compactado')warnings.push('Evaluar compactación y mejorar suelo antes de abrir hoyos de plantación.');
 if(c.width<=0||c.length<=0)warnings.push('Las dimensiones deben ser positivas para estimar superficies.');
 if(!plants.length)warnings.push('Con los filtros actuales no se encontró una lista; ajustá exposición o mantenimiento.');
 return {area:c.width*c.length,plants,zones,warnings,notes:'Idea preliminar: ajustar ubicación y cantidades mediante relevamiento en sitio. Esta propuesta no sustituye un plano de obra.'};
}

export type PlantingSpec = Plant & {spacingCm:number; quantity:number; areaM2:number; zone:string; position:string; x:number; y:number};
export type GardenZone={id:string;name:string;type:'border'|'focal'|'path'|'lawn'|'bed'|'patio'|'gravel'|'water'|'tree'|'vegetable';x:number;y:number;width:number;length:number;areaM2:number;shape?:string};
export type GardenLayout={width:number;length:number;areaM2:number;zones:GardenZone[];plantings:PlantingSpec[]};

export function createGardenLayout(c:Conditions):GardenLayout{
 const w=Math.max(0,c.width),l=Math.max(0,c.length),area=w*l;
 const zones:GardenZone[]=[];
 const clamp=(v:number,max:number)=>Math.max(0,Math.min(max,v));
 const add=(id:string,name:string,type:GardenZone['type'],x:number,y:number,width:number,length:number)=>{
  const xx=clamp(x,w),yy=clamp(y,l),ww=clamp(width,w-xx),ll=clamp(length,l-yy);
  if(ww<.12||ll<.12)return;
  const shape=type==='path'?'M 0 0 Q 25 18 40 48 T 70 68 Q 85 86 100 100':
   type==='lawn'?'M 5 0 L 94 3 Q 100 14 98 25 L 96 78 Q 90 100 76 96 L 20 100 Q 2 92 2 72 L 0 18 Q 2 4 5 0 Z':
   type==='bed'||type==='gravel'||type==='vegetable'?'M 0 12 Q 22 0 40 6 T 72 2 Q 94 0 100 14 L 96 82 Q 82 100 65 94 T 26 98 Q 8 100 2 84 Z':undefined;
  zones.push({id,name,type,x:xx,y:yy,width:ww,length:ll,areaM2:ww*ll,shape});
 };
 if(w<1||l<1)return {width:w,length:l,areaM2:area,zones,plantings:createPlantingSpecs(c)};
 const min=Math.min(w,l),band=Math.min(.9,Math.max(.35,min*.08)),pathW=Math.min(1.1,Math.max(.7,min*.08));
 const innerW=Math.max(0,w-2*band),innerL=Math.max(0,l-2*band);
 const style=c.style,goal=c.goal;
 // Compositions are built from non-overlapping rectangular blocks. Any optional
 // accents occupy reserved areas rather than being drawn on top of other zones.
 if(goal==='Huerta'){
  const bedsW=Math.max(0,w-pathW-band),rowW=Math.min(1.1,Math.max(.55,bedsW/3));
  add('vegetable-1','Cantero de cultivo A','vegetable',band,band,rowW,innerL*.78);
  add('path-main','Pasillo de huerta','path',band+rowW+.08,band,pathW,innerL*.78);
  add('vegetable-2','Cantero de cultivo B','vegetable',band+rowW+pathW+.16,band,Math.max(0,bedsW-rowW-pathW),innerL*.78);
  add('work-zone','Área de trabajo','patio',band,l-band*.75,innerW*.42,band*.65);
  add('herb-border','Bordura aromática','bed',band+innerW*.48,l-band*.75,innerW*.52,band*.65);
 }else if(goal==='Crear privacidad'){
  const rearH=band*1.25,sideW=band*.8;
  add('privacy-back','Pantalla vegetal posterior','bed',0,0,w,rearH);
  add('privacy-side','Pantalla vegetal lateral','bed',0,rearH,sideW,Math.max(0,l-rearH-band));
  add('lawn','Área libre central','lawn',sideW+pathW,rearH,Math.max(0,w-sideW-pathW-band),Math.max(0,l-rearH-band));
  add('path','Circulación lateral','path',sideW,rearH,pathW,Math.max(0,l-rearH-band));
  add('patio','Espacio de estar','patio',w-innerW*.38,l-band,innerW*.38,band);
 }else if(goal==='Jardín para niños / mascotas'){
  const rear=band,front=band*.75;
  add('bed-back','Bordura perimetral posterior','bed',0,0,w,rear);
  add('lawn','Área de juego libre','lawn',band,rear,innerW,Math.max(0,l-rear-front));
  add('path','Camino de acceso','path',w*.5-pathW*.5,rear,pathW,Math.max(0,l-rear-front));
  add('patio','Zona de descanso','patio',0,l-front,w*.32,front);
 }else if(style==='Minimalista'){
  const split=innerW*.62;
  add('bed-back','Banda vegetal posterior','bed',0,0,w,band);
  add('lawn','Lawn geométrico','lawn',band,band,split,innerL);
  add('gravel','Plano de grava','gravel',band+split,band,Math.max(0,innerW-split),innerL*.58);
  add('patio','Terraza compacta','patio',band+split,band+innerL*.58,Math.max(0,innerW-split),innerL*.42);
  add('path','Paso recto','path',band+split-pathW/2,band,pathW,innerL);
 }else if(style==='Japonés zen'){
  const gravelW=innerW*.62;
  add('bed-back','Vegetación posterior','bed',0,0,w,band);
  add('gravel','Grava de contemplación','gravel',band,band,gravelW,innerL);
  add('path','Sendero sinuoso','path',band+gravelW,band,pathW,innerL);
  add('bed-side','Plantación lateral','bed',band+gravelW+pathW,band,Math.max(0,innerW-gravelW-pathW),innerL);
  add('water','Cuenco / agua','water',band+gravelW*.38,band+innerL*.28,Math.min(gravelW*.24,1.2),Math.min(innerL*.18,1.2));
  add('focal','Piedra focal','focal',band+gravelW*.7,band+innerL*.68,Math.min(gravelW*.22,1.3),Math.min(innerL*.2,1.3));
 }else if(goal==='Reducir calor'){
  const canopyW=Math.min(innerW*.38,Math.max(1.5,innerW*.38));
  add('bed-back','Banda vegetal de sombra','bed',0,0,w,band);
  add('lawn','Superficie verde permeable','lawn',band,band,Math.max(0,innerW-canopyW-pathW),innerL);
  add('tree','Zona de árbol de sombra','tree',band+innerW-canopyW,band,canopyW,innerL*.48);
  add('path','Camino permeable','path',band+innerW-canopyW-pathW,band,pathW,innerL);
  add('gravel','Área permeable complementaria','gravel',band+innerW-canopyW,band+innerL*.52,canopyW,innerL*.48);
 }else{
  const sideW=innerW*.28,centerW=innerW-sideW-pathW;
  add('bed-back','Cantero de fondo','bed',0,0,w,band);
  add('lawn','Área verde central','lawn',band+sideW+pathW,band,Math.max(0,centerW),innerL);
  add('bed-side','Cantero lateral','bed',band,band,sideW,innerL);
  add('path','Camino de jardín','path',band+sideW,band,pathW,innerL);
  add('patio','Terraza / estar','patio',band+sideW+pathW,band+innerL*.66,Math.max(0,centerW),innerL*.34);
  add('focal','Acento focal','focal',band+sideW*.22,band+innerL*.62,Math.min(sideW*.56,1.4),Math.min(innerL*.22,1.4));
 }
 return {width:w,length:l,areaM2:area,zones,plantings:createPlantingSpecs(c)};
}
export function createPlantingSpecs(c:Conditions):PlantingSpec[]{
 const selected=recommendPlants(c),w=Math.max(0,c.width),l=Math.max(0,c.length),area=w*l;
 const bedArea=Math.min(area*.32,Math.max(0,area*.28));
 const usable=Math.max(0,Math.min(w,l)-.6),border=Math.min(.9,Math.max(.35,usable*.09));
 const isKitchen=c.goal==='Huerta',isPrivacy=c.goal==='Crear privacidad',isFamily=c.goal==='Jardín para niños / mascotas',isZen=c.style==='Japonés zen';
 const clamp=(v:number,max:number)=>Math.max(0,Math.min(max,v));
 // Plant locations follow the perimeter planting bands, not arbitrary points over the lawn.
 const placements=selected.map((p,i)=>{
  const t=(i+.5)/Math.max(1,selected.length);
  if(isKitchen)return {x:clamp(border+t*(w-2*border),w),y:clamp(border+l*.34,w?l:0),position:'Huerta · fila de cultivo',zone:'Huerta'};
  if(isPrivacy)return i%3===0?{x:clamp(t*w,w),y:clamp(border*.65,l),position:'Fondo · pantalla vegetal',zone:'Pantalla posterior'}:i%3===1?{x:clamp(border*.65,w),y:clamp(border+l*t,l),position:'Lateral izquierdo',zone:'Pantalla lateral'}:{x:clamp(w-border*.65,w),y:clamp(border+l*t,l),position:'Lateral derecho',zone:'Pantalla lateral'};
  if(isFamily)return {x:clamp(border+t*(w-2*border),w),y:clamp(l-border*.6,l),position:'Perímetro · fuera del área de juego',zone:'Bordura segura'};
  if(isZen)return i%2===0?{x:clamp(border+t*(w-2*border),w),y:clamp(border*.65,l),position:'Borde posterior',zone:'Vegetación en capas'}:{x:clamp(border*.65,w),y:clamp(border+l*t,l),position:'Borde lateral',zone:'Plantación de sombra'};
  return i%3===0?{x:clamp(border+t*(w-2*border),w),y:clamp(border*.65,l),position:'Banda posterior',zone:'Cantero posterior'}:i%3===1?{x:clamp(border*.65,w),y:clamp(border+l*t,l),position:'Lateral izquierdo',zone:'Cantero lateral'}:{x:clamp(w-border*.65,w),y:clamp(border+l*t,l),position:'Lateral derecho',zone:'Cantero lateral'};
 });
 return selected.map((p,i)=>{
  const role=p.role.toLowerCase();
  const spacing=role.includes('arbusto')||role.includes('privacidad')||role.includes('foco')||role.includes('tropical')?90:
   role.includes('borde')||role.includes('cobertura')?35:55;
  const share=bedArea/Math.max(1,selected.length);
  const qty=Math.max(1,Math.round(share/((spacing/100)*(spacing/100)*.85)));
  const point=placements[i];
  return {...p,spacingCm:spacing,quantity:Math.min(80,qty),areaM2:Number(share.toFixed(2)),zone:point.zone,position:point.position,x:Number(point.x.toFixed(2)),y:Number(point.y.toFixed(2))};
 });
}
export type BudgetLine = {name:string; quantity:number; unit:string; unitPrice:number; total:number; note:string};
export function createBudgetEstimate(c:Conditions):{lines:BudgetLine[];total:number;area:number;bedArea:number}{
 const area=Math.max(0,c.width*c.length);
 const bedArea=area*.28;
 const specs=createPlantingSpecs(c);
 const tier=c.budget==='Económico'?.85:c.budget==='Premium'?1.35:1;
 const round=(n:number)=>Math.round(n/1000)*1000;
 const add=(name:string,quantity:number,unit:string,basePrice:number,note:string):BudgetLine=>({
  name,quantity:Number(quantity.toFixed(1)),unit,unitPrice:round(basePrice*tier),
  total:round(quantity*basePrice*tier),note
 });
 const lines:BudgetLine[]=[
  add('Plantas ornamentales',specs.reduce((s,p)=>s+p.quantity,0),'unidades',12000,'Promedio orientativo por ejemplar; varía mucho según especie y tamaño'),
  add('Tierra mejorada y compost',bedArea*.12,'m³',180000,'Capa de mejora estimada de 12 cm en canteros'),
  add('Mulch / cobertura',bedArea,'m²',28000,'Cobertura superficial para canteros'),
  add('Césped',area*.35,'m²',22000,'Se considera césped en el 35% del terreno'),
  add('Piedra o material de camino',area*.12,'m²',65000,'Camino y sector de estar estimados en 12% del área'),
  add('Bordura / separador',Math.sqrt(area)*3,'metros',18000,'Longitud preliminar; confirmar con el plano definitivo'),
  add('Mano de obra',area,'m²',35000,'Preparación, plantación y terminaciones; no incluye obras especiales')
 ];
 return {lines,total:lines.reduce((s,l)=>s+l.total,0),area,bedArea};
}
