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
export type GardenZone={id:string;name:string;type:'border'|'focal'|'path'|'lawn'|'bed';x:number;y:number;width:number;length:number;areaM2:number};
export type GardenLayout={width:number;length:number;areaM2:number;zones:GardenZone[];plantings:PlantingSpec[]};

export function createGardenLayout(c:Conditions):GardenLayout{
 const w=Math.max(0,c.width),l=Math.max(0,c.length),area=w*l;
 const border=Math.min(.9,Math.max(.35,Math.min(w,l)*.09));
 const zones:GardenZone[]=[];
 const add=(id:string,name:string,type:GardenZone['type'],x:number,y:number,width:number,length:number)=>{
  const ww=Math.max(0,Math.min(w-x,width)),ll=Math.max(0,Math.min(l-y,length));
  zones.push({id,name,type,x,y,width:ww,length:ll,areaM2:ww*ll});
 };
 // perimeter planting bands, adapted to plot proportions
 if(w>border*2&&l>border*2){
  add('b1','Cantero posterior','border',0,0,w,border);
  add('b2','Cantero lateral izquierdo','border',0,border,border,l-border*2);
  add('b3','Cantero lateral derecho','border',w-border,border,border,l-border*2);
  add('b4','Cantero frontal','border',0,l-border,w,border);
 }
 const pathWidth=Math.min(1.15,Math.max(.7,Math.min(w,l)*.09));
 const pathLen=Math.max(0,l-border*2);
 add('path','Recorrido principal','path',Math.max(0,w*.42-pathWidth/2),border,pathWidth,pathLen);
 const lawnX=border,lawnY=border,lawnW=Math.max(0,w-border*2),lawnL=Math.max(0,l-border*2);
 add('lawn','Área libre / césped','lawn',lawnX,lawnY,lawnW,lawnL);
 // style-based accents (small feature bed / gathering space)
 if(c.style==='Japonés zen'||c.style==='Minimalista'){
  const feature=Math.min(1.6,Math.max(.8,Math.min(w,l)*.16));
  add('feature','Punto focal / jardín de acento','focal',Math.max(0,w-feature-border),Math.max(0,l*.55-feature/2),feature,feature);
 }else{
  const feature=Math.min(2.1,Math.max(1,Math.min(w,l)*.2));
  add('feature','Zona de estar / acento','focal',Math.max(0,w-feature-border),Math.max(0,l*.55-feature/2),feature,feature);
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
