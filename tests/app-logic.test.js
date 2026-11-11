const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));
const plain = value => JSON.parse(JSON.stringify(value));

const filterContext = {isAvail: r => r.available !== false};
vm.runInNewContext(section('function worthOnly(', '/* Every view'), filterContext);
const sold = {id:'sold', net:100, idx:100, available:false};
const buyable = {id:'buyable', net:200, idx:80, available:true};
assert.deepEqual(filterContext.worthOnly([sold,buyable]).map(r=>r.id), ['sold','buyable'], 'unavailable bargains must not eliminate a buyable alternative');
assert.deepEqual(filterContext.worthOnly([{...sold,available:true},buyable]).map(r=>r.id), ['sold']);
assert.equal(filterContext.worthOnly([{...sold,net:200,available:true},buyable]).length, 2, 'same-price alternatives stay visible');

const source = {
  items:[{id:'stable-listing',name:'Test listing'}],
  localParts:{cpu:[['My custom CPU',12345]],gpu:[['My custom GPU',23456]]},
  P:{setup:75,aes:12,cur:'USD',workload:'competitive',goal:'flip',gpuResolution:'4k',graphicsMode:'rayTracing'},
  window:{AssayWorkflow:{getDrafts:()=>[{id:'draft-1'}]}},
  refNow:()=>({cpuName:'My custom CPU',cpu:12345,gpuName:'My custom GPU',gpu:23456}),
};
const backupCode = section('function backupData(', 'function setupHint(');
vm.runInNewContext(backupCode, source);
const backup = plain(source.backupData());
assert.equal(backup.version, 5);
assert.equal(backup.items[0].id, 'stable-listing');
assert.equal(backup.draftListings[0].id, 'draft-1');
const destination = {localParts:{cpu:[['Existing CPU',1000]],gpu:[]},WORKLOADS:{balanced:{},gaming:{},competitive:{}}};
vm.runInNewContext(backupCode, destination);
const extras = plain(destination.backupExtras(backup));
assert.deepEqual(extras.parts.cpu, [['Existing CPU',1000],['My custom CPU',12345]]);
assert.deepEqual(extras.parts.gpu, [['My custom GPU',23456]]);
assert.deepEqual(extras.prefs, {setup:75,aes:12,cur:'USD',workload:'competitive',goal:'flip',gpuResolution:'4k',graphicsMode:'rayTracing',ref:backup.settings.reference});
assert.deepEqual(plain(destination.localParts), {cpu:[['Existing CPU',1000]],gpu:[]}, 'prepare backup without mutating existing data');
assert.deepEqual(plain(destination.backupExtras({settings:{setupDefault:100,refCpuScore:99999,refGpuScore:99999}})).prefs, {setup:100}, 'old scores-only reference data must not invent model names');
assert.deepEqual(plain(destination.backupExtras({customCPUs:[['existing cpu',9999]]})).parts.cpu, [['Existing CPU',1000]], 'adding a backup preserves an existing custom part definition');
for (const invalid of [
  {customCPUs:[['Bad CPU',Infinity]]}, {customGPUs:'invalid'},
  {settings:{setupDefault:-1}}, {settings:{aestheticWeight:1000}},
  {settings:{reference:{cpuName:'CPU',cpu:0,gpuName:'GPU',gpu:100}}},
  {settings:{workload:'nonexistent'}}, {settings:{currency:'GBP'}},
]) assert.throws(()=>destination.backupExtras(invalid));

// Drive the actual import handler, including persistence of the restored extras.
const importElement = {};
const persisted = new Map();
const importContext = {
  items:[],tombs:[],P:{setup:150,aes:0,cur:'EUR'},localParts:{cpu:[],gpu:[]},WORKLOADS:destination.WORKLOADS,
  $:()=>importElement,window:{AssayWorkflow:{restoreDrafts() {assert.equal(importContext.catalogReady,true,'restored custom catalog must be built before drafts are parsed');}}},
  FileReader:class {readAsText(file){this.result=file.text;this.onload();}},
  norm:x=>({...x}),sane:x=>!!x.id,fp:x=>x.id,
  mergeAll:(local,tombs,remote)=>({live:[...local,...remote],tombs}),
  jset:(k,v)=>persisted.set(k,plain(v)),saveI() {},saveP() {},build() {this.catalogReady=true;},renderAll() {},toast() {},confirm:()=>true,
};
vm.runInNewContext(backupCode,importContext);
vm.runInNewContext(section('$("impFile").onchange=', 'if(P.theme)'),importContext);
importElement.onchange({target:{files:[{text:JSON.stringify(backup)}],value:'backup.json'}});
assert.equal(importContext.items[0].id,'stable-listing');
assert.equal(importContext.P.workload,'competitive');
assert.equal(importContext.P.ref.cpuName,'My custom CPU');
assert.deepEqual(persisted.get('pcvaluelab_custom_cpus'),[['My custom CPU',12345]]);
assert.deepEqual(persisted.get('pcvaluelab_custom_gpus'),[['My custom GPU',23456]]);
const beforeInvalid=JSON.stringify({items:importContext.items,P:importContext.P,parts:importContext.localParts});
importElement.onchange({target:{files:[{text:JSON.stringify({...backup,customCPUs:[['Bad CPU',-1]]})}],value:'bad.json'}});
assert.equal(JSON.stringify({items:importContext.items,P:importContext.P,parts:importContext.localParts}),beforeInvalid,'invalid optional data cannot partially restore the backup');

const migration = html.split('\n').find(line=>line.startsWith('const legacyCurrency='));
function migrate(saved,legacy){
  const store = new Map([['pvl_prefs',JSON.stringify(saved)],['pcvaluelab_currency',legacy]]);
  const context={P:{cur:'EUR',...saved},LS:{getItem:k=>store.get(k)??null,removeItem:k=>store.delete(k)},jget:(k,d)=>store.has(k)?JSON.parse(store.get(k)):d,jset:(k,v)=>store.set(k,JSON.stringify(v))};
  vm.runInNewContext(migration,context);return{context,store};
}
assert.equal(migrate({cur:'USD'},'EUR').context.P.cur,'USD','saved modern currency beats stale legacy preference');
assert.equal(migrate({},'USD').context.P.cur,'USD','migrate a legacy preference once');
assert.equal(migrate({},'USD').store.has('pcvaluelab_currency'),false);

const elements={versusA:{},versusB:{},versusBody:{}};
const rows=[
  {id:'a',name:'A',raw:0,drv:0,flp:0,perfPerEuro:2,val:3,net:100,price:100,idx:80,valueIdx:80,cpuName:'CPU',gpuName:'GPU'},
  {id:'b',name:'B',raw:0,drv:0,flp:0,perfPerEuro:1,val:1,net:200,price:200,idx:100,valueIdx:100,cpuName:'CPU',gpuName:'GPU'},
];
const versus = {refNow:()=>({}),$:id=>elements[id],ranked:()=>rows,P:{goal:'drive'},esc:String,money:String,title:r=>r.name,WORKLOADS:{balanced:{}},window:{PVL_SCORING:{scoreMany:pair=>pair}},score:(r,ref,p)=>p};
vm.runInNewContext(section('function versusDelta(', 'function renderSettings('),versus);
versus.renderVersus();
assert.match(elements.versusBody.innerHTML,/PC A is the better deal/,'archived-only comparisons use actual per-price ratios');
assert.doesNotMatch(elements.versusBody.innerHTML,/NaN|Infinity/);
assert.equal(versus.versusDelta(rows[0],rows[1],'flip'),200);
rows[1].perfPerEuro=0;versus.renderVersus();
assert.match(elements.versusBody.innerHTML,/Comparison unavailable/);
assert.doesNotMatch(elements.versusBody.innerHTML,/NaN|Infinity/);
console.log('App logic tests passed: available alternatives, backup round trip, legacy currency and archived comparisons.');

// Use the real wrapper and collection scoring together, rather than testing only
// an isolated engine that the UI could accidentally bypass.
const ranking = {window:{},P:{goal:'drive',workload:'competitive',aes:0,setup:150},LOOK:{pretty:1,neutral:0,ugly:-1},num:Number.isFinite,isAvail:r=>r.available!==false};
vm.createContext(ranking);
for (const file of ['builtin-parts.js','benchmark-data.js','scoring-engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ranking);
vm.runInContext(section('const MARKET=', '/* Every listing') + section('const WORKLOADS=', '/* ---------- render ---------- */') + section('function ranked(', 'const GOALTXT='),ranking);
const partScore=(kind,name)=>ranking.window.BUILTIN[kind].find(([model])=>model===name)[1];
const reference={cpuName:'AMD Ryzen 9 9950X3D',cpu:partScore('cpus','AMD Ryzen 9 9950X3D'),gpuName:'GeForce RTX 5090',gpu:partScore('gpus','GeForce RTX 5090')};
ranking.items=['Intel Core i7-12700KF','Intel Core i7-12700F'].map((cpuName,i)=>({id:String(i),cpuName,cpuScore:partScore('cpus',cpuName),gpuName:'GeForce RTX 3060',gpuScore:partScore('gpus','GeForce RTX 3060'),ram:16,ramType:'DDR4',ssd:500,hdd:0,price:550}));
const scored=ranking.ranked(reference);
assert.ok(scored[0].idx>scored[1].idx&&scored[0].drv>scored[1].drv,'real UI ranking must use common evidence for faster/slower sibling CPUs');
assert.deepEqual(plain(scored.map(r=>r.cpuBenchmarkType)),['passmark','passmark']);
ranking.items=ranking.items.slice().reverse();
assert.equal(ranking.ranked(reference).find(r=>r.id==='0').idx,scored[0].idx,'listing order must not change the scoring basis');
ranking.items=[{...ranking.items[0],...reference,cpuName:reference.cpuName,cpuScore:reference.cpu,gpuName:reference.gpuName,gpuScore:reference.gpu}];
assert.equal(ranking.ranked(reference)[0].idx,100,'the reference PC must score exactly 100% against itself');
console.log('UI scoring integration passed: common evidence, order invariance and reference identity.');

ranking.items=['AMD Ryzen 7 9800X3D','AMD Ryzen 9 9950X3D'].map((cpuName,i)=>({id:'active-'+i,cpuName,cpuScore:partScore('cpus',cpuName),gpuName:'GeForce RTX 5090',gpuScore:partScore('gpus','GeForce RTX 5090'),ram:16,ramType:'DDR4',ssd:500,hdd:0,price:550}));
const activeBefore=plain(ranking.ranked(reference));
assert.ok(activeBefore[0].drv>activeBefore[1].drv,'9800X3D should win the measured gaming comparison');
ranking.items.push({...ranking.items[0],id:'archived',cpuName:'Unknown archived CPU',cpuScore:1000,available:false});
const activeAfter=plain(ranking.ranked(reference));
for(let i=0;i<2;i++){
  assert.equal(activeAfter[i].idx,activeBefore[i].idx,'archived hardware cannot change available scoring evidence');
  assert.equal(activeAfter[i].drv,activeBefore[i].drv,'archiving or deleting a noncompetitor cannot reverse buyable rankings');
}
assert.equal(activeAfter[2].drv,0);
assert.equal(activeAfter[2].flp,0);
assert.equal(activeAfter[2].gs,0);
vm.runInContext(html.split('\n').find(line=>line.startsWith('function scorePair(')),ranking);
const pair=ranking.scorePair(activeAfter[0],activeAfter[2],reference);
assert.equal(pair[0].cpuBenchmarkType,'passmark');
assert.equal(pair[1].cpuBenchmarkType,'passmark','Versus must rescore both selected PCs on the same basis');
assert.notEqual(pair[0].idx,activeAfter[0].idx,'pair fallback may differ from active collection diagnostics');
console.log('Archived scoring isolation and common-basis Versus tests passed.');
