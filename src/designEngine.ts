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

export type PlantingSpec = Plant & {spacingCm:number; quantity:number; areaM2:number; zone:string; position:string};
export function createPlantingSpecs(c:Conditions):PlantingSpec[]{
 const selected=recommendPlants(c);
 const area=Math.max(0,c.width*c.length);
 const bedArea=area*.28; // planting zones estimated at 28% of site
 return selected.map((p,i)=>{
  const spacing=p.role.toLowerCase().includes('arbusto')||p.role.toLowerCase().includes('privacidad')||p.role.toLowerCase().includes('foco')?90:
   p.role.toLowerCase().includes('borde')||p.role.toLowerCase().includes('cobertura')?35:55;
  const share=bedArea/Math.max(1,selected.length);
  const qty=Math.max(1,Math.round(share/((spacing/100)*(spacing/100)*.85)));
  const zone=i<2?'Fondo / estructura':i<4?'Capa intermedia':'Bordes y transición';
  const position=i%2===0?'Lateral izquierdo':'Lateral derecho';
  return {...p,spacingCm:spacing,quantity:Math.min(80,qty),areaM2:Number(share.toFixed(2)),zone,position};
 });
}
