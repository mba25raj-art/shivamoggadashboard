export const number = x => x == null ? 'Unavailable' : new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(x);
export const pct = x => x == null ? 'Unavailable' : `${Number(x).toFixed(2)}%`;
export const project = ([lon,lat]) => [lon*Math.PI/180,-Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
export function parsed(row){return {...row,geometry:JSON.parse(row.geometryJson)};}
export function bounds(rows){const out=[Infinity,Infinity,-Infinity,-Infinity];for(const row of rows)for(const p of row.geometry.coordinates)for(const r of p)for(const c of r){const [x,y]=project(c);out[0]=Math.min(out[0],x);out[1]=Math.min(out[1],y);out[2]=Math.max(out[2],x);out[3]=Math.max(out[3],y);}return out;}
export function makeProjection(rows,width=800,height=510){const b=bounds(rows),scale=Math.min((width-100)/(b[2]-b[0]),(height-80)/(b[3]-b[1]));const ox=(width-(b[2]-b[0])*scale)/2,oy=(height-(b[3]-b[1])*scale)/2;return c=>{const p=project(c);return [(p[0]-b[0])*scale+ox,(p[1]-b[1])*scale+oy]};}
export function path(row,p){return row.geometry.coordinates.map(poly=>poly.map(ring=>ring.map((c,i)=>`${i?'L':'M'}${p(c).map(n=>n.toFixed(2)).join(',')}`).join('')+'Z').join('')).join('');}
export function waterColor(v){return v==null?'#dce4e2':v<70?'#edbc7b':v<85?'#afd4c6':v<95?'#5ca38e':'#1e6958';}
export function laborColor(v){return v==null?'#dce4e2':v<30000?'#d6dcf1':v<45000?'#aaaed8':v<60000?'#787eb7':'#484e8b';}
export const layerTitles={jjm:'Jal Jeevan Mission',eshram:'e-Shram',pmkisan:'PM-KISAN',pmay:'PM Awas Yojana'};
