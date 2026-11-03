/* Local-only listing ingestion. No network, account access, or executable HTML. */
(function(root){
 const clean=v=>String(v??'').replace(/\u00a0|\u202f/g,' ').trim();
 const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(nvidia|geforce|radeon|amd|intel|processor|processeur|core)\b/g,' ').replace(/\b(rtx|gtx|rx|ryzen|i[3579])\s*-?\s*(?=\d)/g,'$1 ').replace(/(\d)(ti|super|xtx|xt|x3d|kf|k|f|g|x)\b/g,'$1 $2').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
 function url(value){try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))return '';if(/(^|\.)leboncoin\.fr$/.test(u.hostname)){const id=u.pathname.match(/(?:\/ad\/[^/]+\/|\/)(\d{6,})(?:\.htm)?(?:\/|$)/);if(id){u.hostname='www.leboncoin.fr';u.hash='';u.search='';return u.href}}u.hash='';u.search='';return u.href}catch{return ''}}
 const key=r=>{const value=url(r.sourceUrl||r.url||(/^https?:/.test(r.name||'')?r.name:''));try{const u=new URL(value),id=u.pathname.match(/(?:\/ad\/[^/]+\/|\/)(\d{6,})(?:\.htm)?(?:\/|$)/);return /(^|\.)leboncoin\.fr$/.test(u.hostname)&&id?'lbc:'+id[1]:value}catch{return ''}};
 function matchHardware(text,catalog){const n=' '+norm(text)+' ';
  const found=catalog.map(([name,score])=>{const token=norm(name),needle=' '+token+' ',positions=[];let i=n.indexOf(needle);while(token&&i>=0){positions.push(i);i=n.indexOf(needle,i+1)}return {name,score,token,positions}}).filter(p=>p.positions.length&&(/\d/.test(p.token)||/\btitan [vx]\b/.test(p.token)));
  return found.filter(p=>p.positions.some(start=>!found.some(q=>q.token.length>p.token.length&&q.positions.some(at=>at<=start&&at+q.token.length>=start+p.token.length)))).filter((p,i,a)=>a.findIndex(q=>q.token===p.token)===i);
 }
 function parse(record,catalog){
  const name=clean(record.title||record.subject||record.name),text=clean([name,record.text||record.description||record.body].filter(Boolean).join('\n')).slice(0,30000);
  const cpu=matchHardware(text,catalog.cpu),gpu=matchHardware(text,catalog.gpu),warnings=[];
  const desktop=/\b(pc|ordinateur|tour|desktop|unite centrale|configuration|config)\b/.test(norm(name));
  const component=/^(carte graphique|processeur|barrette|memoire|ecran|moniteur|ssd|disque dur|boitier|alimentation|gpu|cpu)\b/.test(norm(name));
  const laptop=/\b(portable|laptop|macbook)\b/.test(norm(name));
  const kind=component||laptop?'skip':desktop||cpu.length&&gpu.length?'pc':'review';
  const euros=[...text.matchAll(/(\d[\d .]*?(?:,\d{1,2})?)\s*(?:€|euros?\b)/gi)].map(m=>Number(m[1].replace(/[ .]/g,'').replace(',','.'))).filter(n=>n>0);
  const rawPrice=Array.isArray(record.price)?record.price[0]:record.price;
  const price=rawPrice!=null&&clean(rawPrice)!==''?Number(clean(rawPrice).replace(/\s/g,'').replace(',','.')):new Set(euros).size===1?euros[0]:null;
  const ramMatches=[...text.matchAll(/(?:\b(?:ram|memoire(?: vive)?)\s*[:=]?\s*(\d+)\s*(?:go|gb)|\b(\d+)\s*(?:go|gb)\s*(?:de\s+)?(?:ram|ddr[345]|memoire vive))/gi)];
  const ramKits=[...text.matchAll(/(?:(\d+)\s*[x×]\s*(\d+)\s*(?:go|gb)\s*(?:de\s+)?(?:ram|ddr[345])|(?:ram|memoire vive)\s*[:=]?\s*(\d+)\s*[x×]\s*(\d+)\s*(?:go|gb))/gi)].map(m=>({module:+(m[2]||m[4]),total:+(m[1]||m[3])*+(m[2]||m[4])}));
  const ramValues=[...new Set([...ramMatches.map(m=>{const n=+(m[1]||m[2]);return ramKits.find(k=>k.module===n)?.total||n}),...ramKits.map(k=>k.total)])];
  const ramType=[...new Set((text.match(/\bddr[345]\b/gi)||[]).map(v=>v.toUpperCase()))];
  const drives=[];const driveRe=/\b(?:(ssd|nvme|hdd|disque dur)\s*[:=]?[^\n;]{0,60}?(\d+(?:[.,]\d+)?)\s*(to|tb|go|gb)|(\d+(?:[.,]\d+)?)\s*(to|tb|go|gb)\s*(ssd|nvme|hdd|disque dur))\b/gi;
  for(const m of text.matchAll(driveRe)){const type=(m[1]||m[6]).toLowerCase(),value=Number((m[2]||m[4]).replace(',','.'))*(/t/i.test(m[3]||m[5])?1000:1);if(!drives.some(d=>d.type===(/hdd|disque/.test(type)?'hdd':'ssd')&&d.value===value))drives.push({type:/hdd|disque/.test(type)?'hdd':'ssd',value,evidence:m[0]})}
  const storageAmbiguous=drives.length&&/(?:\b(?:ssd|nvme|hdd|stockage)\b.{0,40}\b(?:ou|au choix)\b.{0,20}\d|\d\s*(?:to|tb|go|gb)\s*(?:ou|\/)\s*\d|\b[2-9]\s*[x×]\s*\d+(?:[.,]\d+)?\s*(?:go|gb|to|tb)\s*(?:ssd|nvme|hdd))/i.test(text);if(storageAmbiguous)warnings.push('Storage alternatives or multiple-drive quantities need manual entry');
  const setupPositive=/\b(?:ecran|moniteur|clavier|souris)\s+(?:inclus|incluse|fourni|fournie|compris)|\b(?:avec|vendu avec)\s+(?:un\s+)?(?:ecran|moniteur|clavier|souris)|\bsetup complet\b/i.test(norm(text));
  const setupNegative=/\b(?:sans|hors)\s+(?:ecran|moniteur|clavier|souris)|\b(?:ecran|moniteur|clavier|souris).*?(?:separement|en supplement|non inclus|pas inclus)/i.test(norm(text));
  const setup=setupPositive&&!setupNegative?'yes':setupNegative&&!setupPositive?'no':'unknown';
  if(cpu.length!==1)warnings.push(cpu.length?'Several CPUs mentioned':'CPU not identified');if(gpu.length!==1)warnings.push(gpu.length?'Several GPUs mentioned':'GPU not identified');
  if(!(price>0))warnings.push('Price missing or ambiguous');if(ramValues.length>1)warnings.push('Several RAM capacities');if(ramType.length>1)warnings.push('Several RAM types');
  if(!ramType.length)warnings.push('RAM type unknown: DDR4 will be an assumption');if(drives.length>1)warnings.push('Check multiple drives: capacities may be repeated or describe alternatives');if(setup==='unknown')warnings.push('Setup inclusion needs confirmation');
  return {name:name||'Imported PC',sourceUrl:url(record.url||record.sourceUrl||record.link),sourceText:text,description:strip(record.description||record.body||record.text||''),descriptionSource:record.descriptionSource||'supplied-text',kind,cpu:cpu.length===1?[cpu[0].name,cpu[0].score]:null,gpu:gpu.length===1?[gpu[0].name,gpu[0].score]:null,cpuChoices:cpu.map(p=>p.name),gpuChoices:gpu.map(p=>p.name),price:price>0?price:null,ram:ramValues.length===1?ramValues[0]:null,ramType:ramType.length===1?ramType[0]:null,ssd:storageAmbiguous?null:drives.filter(d=>d.type==='ssd').reduce((n,d)=>n+d.value,0)||null,hdd:storageAmbiguous?0:drives.filter(d=>d.type==='hdd').reduce((n,d)=>n+d.value,0)||0,setup,warnings,evidence:{ram:ramMatches.map(m=>m[0]).join('; '),storage:drives.map(d=>d.evidence).join('; ')}};
 }
 const strip=s=>clean(String(s).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<\/(?:p|div|li|h[1-6])>|<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
 function records(source,productsOnly=false){
  if(typeof source==='string'){
   const s=source.trim();try{return records(JSON.parse(s))}catch{}
   if(/<html|<script|<a\s/i.test(s)){
    const scripts=[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    const canonical=s.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1]||s.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical/i)?.[1]||'';
    const products=scripts.filter(m=>/application\/ld\+json/i.test(m[1])).flatMap(m=>{try{return records(JSON.parse(m[2]),true)}catch{return []}});
    if(products.length)return products.map(r=>({...r,url:r.url||(products.length===1?canonical:'')}));
    const embedded=scripts.filter(m=>/application\/json|__NEXT_DATA__/i.test(m[1])).flatMap(m=>{try{return records(JSON.parse(m[2]))}catch{return []}});
    if(embedded.length)return embedded.map(r=>({...r,url:r.url||(embedded.length===1?canonical:'')}));
    if(canonical&&/leboncoin\.fr\//.test(canonical))return [{url:canonical,title:strip(s.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||''),text:strip(s)}];
    return [...s.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter(m=>/leboncoin\.fr\/(?:ad|[^/]+\/\d)/.test(m[1])||m[1].startsWith('/ad/')).map(m=>({url:m[1].startsWith('/')?'https://www.leboncoin.fr'+m[1]:m[1],title:strip(m[2]),text:strip(m[2])}));
   }
   return s.split(/\n\s*---+\s*\n/).filter(Boolean).map(text=>({title:text.split('\n').find(v=>v.trim())||'',text,url:text.match(/https?:\/\/\S+/)?.[0]||''}));
  }
  const out=[];let visited=0;
  function walk(o,depth){if(!o||typeof o!=='object'||depth>18||++visited>50000)return;
   if(Array.isArray(o)){o.forEach(v=>walk(v,depth+1));return}
   const title=o.title||o.subject||o.name;
   const product=[o['@type']].flat().includes('Product');
   const advert=product||o.price!=null||o.list_id!=null||o.format==='assay-visible-listings-v1'||!!key(o);
   if(typeof title==='string'&&(!productsOnly||product)&&advert&&(o.price!=null||o.description||o.body||o.text||o.offers||o.availability)){
    const attrs=Array.isArray(o.attributes)?o.attributes.map(a=>[a.key_label||a.key,a.value_label||a.value].filter(Boolean).join(': ')).join('\n'):'';
    out.push({title,text:[strip(o.description||o.body||o.text||''),attrs].join('\n'),description:strip(o.description||o.body||o.text||''),descriptionSource:product?'structured-product':o.descriptionSource||'supplied-text',price:o.price??o.offers?.price,url:o.url||o.sourceUrl||o.link||o.offers?.url||'',availability:o.availability||'unknown'});return;
   }
   Object.values(o).forEach(v=>walk(v,depth+1));
  }walk(source,0);return out;
 }
 function batch(source,catalog,existing=[]){const seen=new Set(existing.map(key).filter(Boolean)),out=[];
  for(const record of records(source).slice(0,1000)){const p=parse(record,catalog),k=key(p);if(k&&seen.has(k)){out.push({...p,duplicate:true});continue}if(k)seen.add(k);out.push(p)}return out;
 }
 function availability(source,existing){return records(source).map(r=>({key:key(r),state:r.availability,title:r.title})).filter(r=>r.key&&['available','unavailable'].includes(r.state)&&existing.some(it=>key(it)===r.key));}
 root.AssayImport={norm,url,key,parse,records,batch,availability};
 if(typeof module!=='undefined')module.exports=root.AssayImport;
})(typeof window==='undefined'?globalThis:window);
