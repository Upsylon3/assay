/* User-triggered collector: reads the loaded document only. No fetches, cookies or private APIs. */
function collectLoadedListings(){
 if(!/(^|\.)leboncoin\.fr$/.test(location.hostname)){alert('Open your Leboncoin favourites or a listing first.');return}
 const listings=new Map();
 const canonical=value=>{try{const u=new URL(value,location.href);if(!/(^|\.)leboncoin\.fr$/.test(u.hostname))return '';return /\/(?:ad\/[^/]+\/)?\d{6,}(?:\.htm)?(?:$|[?#])/.test(u.pathname)?u.origin+u.pathname:''}catch{return ''}};
 const add=(url,title,text)=>{if(!url||!text)return;const old=listings.get(url);if(!old||text.length>old.text.length)listings.set(url,{url,title,text:text.slice(0,20000)})};
 const current=canonical(location.href);
 if(current){
  const products=[];
  const walk=o=>{if(!o||typeof o!=='object')return;if(Array.isArray(o))return o.forEach(walk);if([o['@type']].flat().includes('Product'))products.push(o);else if(o['@graph'])walk(o['@graph'])};
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el=>{try{walk(JSON.parse(el.textContent))}catch{}});
  const product=products.find(p=>canonical(p.url||p.offers?.url)===current)||(products.length===1?products[0]:null);
  const plain=s=>String(s||'').replace(/<\/(?:p|div|li)>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim();
  if(product&&product.description){const description=plain(product.description);add(current,product.name||document.title,description);Object.assign(listings.get(current),{description,descriptionSource:'structured-product',price:product.offers?.price})}
  else {const main=document.querySelector('main');add(current,document.querySelector('h1')?.innerText||document.title,main?.innerText||'')}
 }
 else document.querySelectorAll('a[href]').forEach(a=>{const url=canonical(a.href);if(!url)return;const card=a.closest('article')||a.closest('li')||a;const text=card.innerText||a.innerText;add(url,(card.querySelector('h2,h3,[data-test-id="adcard-title"]')?.innerText||a.innerText||'').split('\n').find(Boolean)||'Listing',text)});
 if(!listings.size){alert('No loaded listing cards found. Scroll to load favourites, or use a saved HTML/JSON file in Assay.');return}
 if(current&&listings.has(current)){const r=listings.get(current),t=r.text.toLowerCase();r.availability=/cette annonce (?:n.est plus disponible|a ete supprimee|a été supprimée)|annonce supprimée/.test(t)?'unavailable':document.querySelector('h1')&&/\d\s*€/.test(t)?'available':'unknown'}
 const payload={format:'assay-visible-listings-v1',scope:current?'listing':'loaded-page',capturedAt:new Date().toISOString(),listings:[...listings.values()]};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='assay-leboncoin-loaded.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 alert('Exported '+listings.size+' loaded listings. Import this JSON in Assay. Full descriptions are captured from structured data on individual adverts when present. Favourites cards do not load those descriptions.');
}
