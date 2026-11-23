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
 const add=(id:string,name:string,type:GardenZone['type'],x:number,y:number,width:number,length:number)=>{
  const xx=Math.max(0,Math.min(w,x)),yy=Math.max(0,Math.min(l,y));
  const ww=Math.max(0,Math.min(w-xx,width)),ll=Math.max(0,Math.min(l-yy,length));
  if(ww>0&&ll>0){
   const shape=type==='path'?'M 0 0 C 22 12 35 55 50 48 S 75 22 100 100':
    type==='lawn'?'M 8 0 L 92 4 Q 100 12 98 22 L 96 78 Q 90 100 78 96 L 18 100 Q 0 90 2 72 L 0 18 Q 2 5 8 0 Z':
    type==='bed'||type==='gravel'||type==='vegetable'?'M 0 8 Q 18 0 32 5 T 65 2 Q 90 0 100 12 L 96 88 Q 80 100 62 94 T 28 98 Q 8 100 2 84 Z':undefined;
   zones.push({id,name,type,x:xx,y:yy,width:ww,length:ll,areaM2:ww*ll,shape});
  }
 };
 const minDim=Math.min(w,l),band=Math.min(.85,Math.max(.3,minDim*.075));
 const pathW=Math.min(1.05,Math.max(.65,minDim*.075));
 const style=c.style,goal=c.goal;
 const planting=()=>{add('bed-back','Plantación de fondo','bed',0,0,w,band);};
 // Choose a composition pattern, not a fixed border-only template.
 if(style==='Minimalista'){
  add('lawn','Plano verde principal','lawn',band,band,Math.max(0,w-band*2),Math.max(0,l-band*2));
  add('bed-back','Banda vegetal estructural','bed',0,0,w,band);
  add('bed-side','Plantación lateral','bed',0,band,band,Math.max(0,l-band*2));
  add('gravel','Grava decorativa','gravel',w*.62,l*.52,w*.32,l*.28);
  add('path','Sendero recto','path',w*.42,band,pathW,Math.max(0,l-band*2));
  add('patio','Estar compacto','patio',w*.62,l*.12,w*.32,l*.24);
 }else if(style==='Japonés zen'){
  add('gravel','Jardín de grava / contemplación','gravel',band,band,w-band*2,l-band*2);
  add('bed-back','Vegetación en capas','bed',0,0,w,band);
  add('bed-side','Plantación de sombra','bed',0,band,band,l-band*2);
  add('path','Sendero de pasos','path',w*.15,l*.15,Math.max(.5,pathW),Math.max(.5,l*.7));
  add('water','Elemento de agua (opcional)','water',w*.62,l*.2,Math.min(w*.22,1.4),Math.min(l*.18,1.4));
  add('focal','Piedra protagonista','focal',w*.65,l*.58,Math.min(w*.2,1.4),Math.min(l*.2,1.4));
 }else if(goal==='Crear privacidad'){
  add('lawn','Área central libre','lawn',band,band,w-band*2,l-band*2);
  add('privacy-back','Pantalla vegetal posterior','bed',0,0,w,band*1.6);
  add('privacy-side','Pantalla vegetal lateral','bed',0,band,band*1.5,l-band*2);
  add('path','Circulación lateral','path',w*.78,band,pathW,l-band*2);
  add('patio','Espacio de estar','patio',w*.12,l*.65,w*.28,l*.22);
 }else if(goal==='Jardín para niños / mascotas'){
  add('lawn','Área libre para jugar','lawn',band,band,w-band*2,l-band*2);
  add('bed-back','Plantación segura en perímetro','bed',0,0,w,band);
  add('path','Camino de acceso','path',w*.42,band,pathW,l-band*2);
  add('patio','Zona de descanso','patio',w*.12,l*.12,w*.28,l*.22);
 }else if(goal==='Huerta'){
  add('vegetable','Huerta / cultivo','vegetable',band,band,w-band*2,l*.42);
  add('path','Pasillo de acceso','path',w*.45,band,pathW,l-band*2);
  add('bed-back','Bordura aromática','bed',0,l-band,w,band);
  add('patio','Zona de trabajo','patio',w*.62,l*.62,w*.28,l*.22);
 }else if(goal==='Reducir calor'){
  add('lawn','Área permeable central','lawn',band,band,w-band*2,l-band*2);
  add('bed-back','Capa vegetal de sombra','bed',0,0,w,band*1.5);
  add('tree','Árbol de sombra (zona sugerida)','tree',w*.62,l*.12,Math.min(w*.25,2),Math.min(l*.25,2));
  add('path','Camino permeable','path',w*.38,band,pathW,l-band*2);
  add('gravel','Superficie permeable','gravel',w*.62,l*.62,w*.28,l*.22);
 }else{
  // Tropical/contemporary default composition with varied function areas.
  add('lawn','Área de césped / espacio abierto','lawn',band,band,w-band*2,l-band*2);
  add('bed-back','Plantación de fondo','bed',0,0,w,band);
  add('bed-side','Plantación de acento lateral','bed',0,band,band,l-band*2);
  add('path','Camino orgánico conceptual','path',w*.42,band,pathW,l-band*2);
  add('patio','Zona de estar','patio',w*.62,l*.62,w*.28,l*.22);
  add('focal','Punto focal vegetal','focal',w*.15,l*.58,Math.min(w*.2,1.5),Math.min(l*.2,1.5));
 }
 const plantings=createPlantingSpecs(c);
 return {width:w,length:l,areaM2:area,zones,plantings};
}
export function createPlantingSpecs(c:Conditions):PlantingSpec[]{
 const selected=recommendPlants(c),w=Math.max(0,c.width),l=Math.max(0,c.length),area=w*l;
 const bedArea=Math.min(area*.32,Math.max(0,area*.28));
 const usable=Math.max(0,Math.min(w,l)-.6),border=Math.min(.9,Math.max(.35,usable*.09));
 return selected.map((p,i)=>{
  const role=p.role.toLowerCase();
  const spacing=role.includes('arbusto')||role.includes('privacidad')||role.includes('foco')||role.includes('tropical')?90:
   role.includes('borde')||role.includes('cobertura')?35:55;
  const share=bedArea/Math.max(1,selected.length);
  const qty=Math.max(1,Math.round(share/((spacing/100)*(spacing/100)*.85)));
  const zone=i<2?'Canteros de perímetro':i<4?'Canteros intermedios':'Bordes y acentos';
  const side=i%4;
  const x=side===0?border:side===1?Math.max(border,w-border):w*(.25+i*.1);
  const y=side===2?Math.max(border,l-border):side===3?border:l*(.35+i*.08);
  const position=side===0?'Lateral izquierdo':side===1?'Lateral derecho':side===2?'Frente':'Fondo';
  return {...p,spacingCm:spacing,quantity:Math.min(80,qty),areaM2:Number(share.toFixed(2)),zone,position,x:Number(Math.max(0,Math.min(w,x)).toFixed(2)),y:Number(Math.max(0,Math.min(l,y)).toFixed(2))};
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
