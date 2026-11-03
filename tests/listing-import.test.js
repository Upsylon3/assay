const assert=require('node:assert/strict');const imp=require('../listing-import.js');
const catalog={cpu:[['AMD Ryzen 5 5600',21000],['AMD Ryzen 5 5600X',22000],['Intel Core i7-12700K',33000]],gpu:[['GeForce RTX 3060',17000],['GeForce RTX 3060 Ti',20000],['Radeon RX 6700 XT',19000]]};
let p=imp.parse({title:'PC gamer Ryzen 5 5600 RTX3060Ti',text:'RAM 32 Go DDR4, SSD 500 Go + HDD 2 To. Écran inclus.',price:[750]},catalog);
assert.equal(p.cpu[0],'AMD Ryzen 5 5600');assert.equal(p.gpu[0],'GeForce RTX 3060 Ti');assert.equal(p.ram,32);assert.equal(p.ssd,500);assert.equal(p.hdd,2000);assert.equal(p.setup,'yes');assert.equal(p.price,750);
p=imp.parse({title:'Tour Intel i7-12700K RX6700XT',text:'Carte graphique 12 Go VRAM. RAM 16 Go. SSD 1 To, écran vendu séparément.',price:600},catalog);
assert.equal(p.cpu[0],'Intel Core i7-12700K');assert.equal(p.gpu[0],'Radeon RX 6700 XT');assert.equal(p.ram,16);assert.equal(p.setup,'no');
p=imp.parse({title:'PC Ryzen 5 5600 / Ryzen 5 5600X RTX 3060',text:'850 € ou 900 €'},catalog);assert.equal(p.cpu,null);assert.equal(p.price,null);
assert.equal(imp.parse({title:'Carte graphique RTX 3060',price:200},catalog).kind,'skip');
assert.equal(imp.parse({title:'PC portable RTX 3060',price:500},catalog).kind,'skip');
assert.equal(imp.parse({title:'PC RTX3060 12 Go VRAM',price:500},catalog).ram,null);
assert.equal(imp.parse({title:'PC SSD 500 Go',text:'SSD 500 Go'},catalog).ssd,500);
assert.equal(imp.url('javascript:alert(1)'), '');assert.equal(imp.key({url:'https://www.leboncoin.fr/ad/ordinateurs/1234567890?tracking=1'}),imp.key({url:'https://www.leboncoin.fr/informatique/1234567890.htm'}));
const ads=Array.from({length:65},(_,i)=>({subject:'PC Ryzen 5 5600 RTX 3060',body:'16 Go RAM DDR4 SSD 1 To',price:[500+i],url:'https://www.leboncoin.fr/ad/ordinateurs/'+(1234567890+i)}));
assert.equal(imp.batch({props:{pageProps:{ads}}},catalog).length,65);
assert.equal(imp.batch([ads[0],ads[0]],catalog).filter(x=>x.duplicate).length,1);
assert.equal(imp.batch([ads[0]],catalog,[{sourceUrl:ads[0].url}])[0].duplicate,true);
const html='<html><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({ads})+'</script><script>throw Error("must not run")</script></html>';
assert.equal(imp.batch(html,catalog).length,65);
assert.equal(imp.records('PC 1\n500 €\n---\nPC 2\n600 €').length,2);
assert.equal(imp.availability({listings:[{title:'PC',url:ads[0].url,availability:'unavailable'}]},[{sourceUrl:ads[0].url}]).length,1);
assert.equal(imp.availability({listings:[]},[{sourceUrl:ads[0].url}]).length,0,'Absence never archives');
assert.equal(imp.availability({listings:[{title:'PC',url:ads[0].url,availability:'blocked'}]},[{sourceUrl:ads[0].url}]).length,0);
console.log('Listing import tests passed: 65-ad batch, French specs, ambiguity, duplicate URLs, inert HTML and explicit availability.');
const vm=require('node:vm'),fs=require('node:fs');
let payload;
const anchor={href:'https://www.leboncoin.fr/ad/ordinateurs/1234567890',innerText:'PC Ryzen 5 5600 RTX 3060\n600 €',closest(){return this},querySelector(){return null}};
const context={location:{hostname:'www.leboncoin.fr',href:'https://www.leboncoin.fr/favoris'},document:{querySelectorAll:()=>[anchor,anchor],createElement:()=>({click(){}})},URL:class extends URL{static createObjectURL(blob){payload=blob.text;return 'blob:test'}static revokeObjectURL(){}},Blob:class{constructor(parts){this.text=parts.join('')}},alert(){},setTimeout(){}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../browser-collector.js'),'utf8')+';collectLoadedListings();',context);
const result=JSON.parse(payload);assert.equal(result.listings.length,1);assert.equal(result.scope,'loaded-page');assert.equal(result.listings[0].availability,undefined,'Loaded favourite alone is not availability evidence');
console.log('Collector test passed: visible cards, duplicate anchors, no automatic status inference.');

assert.equal(imp.parse({title:'PC gamer',text:'2x16 Go DDR4'},catalog).ram,32);
assert.equal(imp.parse({title:'PC gamer',text:'RAM 2 × 8 Go'},catalog).ram,16);
// Sanitized product data from the user's saved advert; no page/account state retained.
const sample=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'fixtures/leboncoin-product.json'),'utf8'));
const sourceHtml='<link rel="canonical" href="'+sample.offers.url+'"><script type="application/ld+json">'+JSON.stringify(sample)+'</script><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({messages:{dialog:{title:'Account message',body:'Unrelated application text'}}})+'</script>';
const actualCatalog={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../builtin-parts.js'),'utf8'),actualCatalog);
const actual=imp.batch(sourceHtml,{cpu:actualCatalog.window.BUILTIN.cpus,gpu:actualCatalog.window.BUILTIN.gpus});
assert.equal(actual.length,1,'Ignore application translations and unrelated page state');
assert.equal(actual[0].sourceUrl,sample.offers.url);assert.equal(actual[0].price,1650);
assert.equal(actual[0].cpu[0],'AMD Ryzen 7 7800X3D');assert.equal(actual[0].gpu[0],'GeForce RTX 4070 SUPER');
assert.equal(actual[0].ram,32);assert.equal(actual[0].ramType,'DDR5');assert.equal(actual[0].ssd,2000);
assert.match(actual[0].description,/Pure Power 12 M 850W/);assert.match(actual[0].description,/négociable raisonnablement/);
assert.doesNotMatch(actual[0].description,/<p>/);assert.equal(actual[0].descriptionSource,'structured-product');
let singlePayload;const singleContext={...context,location:{hostname:'www.leboncoin.fr',href:sample.offers.url},document:{title:sample.name,querySelectorAll:selector=>selector.startsWith('script')?[{textContent:JSON.stringify(sample)}]:[],querySelector:selector=>selector==='h1'?{innerText:sample.name}:null,createElement:()=>({click(){}})},URL:class extends URL{static createObjectURL(blob){singlePayload=blob.text;return 'blob:sample'}static revokeObjectURL(){}}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../browser-collector.js'),'utf8')+';collectLoadedListings();',singleContext);
const single=JSON.parse(singlePayload).listings[0];assert.equal(single.url,sample.offers.url);assert.equal(single.price,1650);assert.match(single.description,/Pure Power 12 M 850W/);assert.equal(single.descriptionSource,'structured-product');
console.log('Saved advert regression passed: URL, full hidden description, correct hardware, price, storage, and focused collector.');

// Availability uses captured page labels, never description keywords or missing data.
for(const label of ['Achat en cours','Buy en cours','Dernière activité : il y a 31 jours','Dernière activité il y a plus de 30 jours','Dernière connexion il y a 2 mois',"Dernière activité il y a plus d’un mois"]){
 const record={...ads[0],availability:'available',availabilityText:label};
 assert.equal(imp.status(record).availability,'unavailable',label);
 assert.equal(imp.batch({listings:[record]},catalog)[0].availability,'unavailable');
 assert.equal(imp.availability({listings:[record]},[{sourceUrl:record.url}])[0].state,'unavailable');
}
for(const label of ['', 'Dernière activité il y a 30 jours','Dernière activité il y a 1 mois','Dernière activité il y a 4 semaines','Dernière activité il y a 2 heures','Aucun achat en cours']){
 assert.equal(imp.status({availabilityText:label}).availability,'unknown',label);
}
assert.equal(imp.status({description:'Achat en cours'}).availability,'unknown');
// Bookmark serializes both functions: exercise that exact standalone form.
singleContext.document.querySelector=selector=>selector==='main'?{innerText:'PC gamer\nAchat en cours\nDernière activité il y a 2 heures'}:selector==='h1'?{innerText:sample.name}:null;
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../browser-collector.js'),'utf8')+';collectLoadedListings('+imp.status.toString()+');',singleContext);
const unavailable=JSON.parse(singlePayload).listings[0];
assert.equal(unavailable.availability,'unavailable');
assert.equal(unavailable.availabilityReason,'Purchase in progress');
assert.equal(unavailable.description,single.description);
assert.equal(imp.batch(sourceHtml+'<p>Dernière activité il y a 45 jours</p>',catalog)[0].availability,'unavailable');
console.log('Availability rules passed: purchase status, strict 30-day boundary, missing evidence and serialized bookmark.');

const workflow=fs.readFileSync(require('node:path').join(__dirname,'../listing-workflow.js'),'utf8');
const analyzeCode=workflow.slice(workflow.indexOf(' function analyze(text){'),workflow.indexOf(' function fillDraft(id)'));
const saved={sourceUrl:ads[0].url,available:true,notes:'Keep my notes',cpuName:'Manual CPU'};
const workflowContext={imp,parts:catalog,items:[saved],drafts:[],uid:()=> 'test-draft',store(){},render(){},saveI(){},renderAll(){},document:{getElementById:()=>({textContent:''})}};
vm.runInNewContext(analyzeCode+';analyze('+JSON.stringify(JSON.stringify({listings:[{...ads[0],availabilityText:'Achat en cours'}]}))+');',workflowContext);
assert.equal(saved.available,false);assert.equal(saved.notes,'Keep my notes');assert.equal(saved.cpuName,'Manual CPU');
vm.runInNewContext('analyze('+JSON.stringify(JSON.stringify({listings:[ads[0]]}))+');',workflowContext);
assert.equal(saved.available,false,'Missing evidence must not reactivate a saved listing');
console.log('Import integration passed: automatic archival preserves specs and notes.');
