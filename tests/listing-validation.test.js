const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const ctx = {crypto:{randomUUID:()=> 'new-id'}};
vm.runInNewContext(html.slice(html.indexOf('const uid='), html.indexOf('const savedArray=')) + ';this.validate=sane;this.normalize=norm;', ctx);
const listing = {id:'pc',price:500,cpuName:'Test CPU',cpuScore:20000,gpuName:'Test GPU',gpuScore:15000,ram:16,ssd:500,hdd:0,ramType:'DDR4'};
assert.ok(ctx.validate(ctx.normalize(listing)));
assert.ok(ctx.validate(ctx.normalize({...listing,ssd:undefined,hdd:undefined,ramType:undefined})), 'legacy omissions remain loadable');
for (const changed of [null, {...listing,price:Infinity}, {...listing,cpuScore:0}, {...listing,gpuScore:-1}, {...listing,ram:-1}, {...listing,ssd:-1}, {...listing,hdd:Infinity}, {...listing,ramType:'unknown'}, {...listing,setupAmt:-10}, {...listing,cpuName:''}]) {
  assert.ok(!ctx.validate(ctx.normalize(changed)), 'invalid saved/backup listing must not enter scoring');
}
const refs = {P:{ref:{cpuName:'Bad',cpu:0,gpuName:'Bad',gpu:Infinity}},remote:{ref:null},DEF:{cpuName:'Good CPU',cpu:20000,gpuName:'Good GPU',gpu:15000},parts:{cpu:[['Good CPU',21000]],gpu:[['GeForce RTX 3060',16870]]},num:Number.isFinite};
vm.runInNewContext(html.slice(html.indexOf('const validReference='), html.indexOf('const WORKLOADS=')) + ';this.reference=refNow;this.lookup=live;', refs);
assert.equal(refs.reference().cpu,21000,'invalid stored reference falls back to a live valid reference');
assert.equal(refs.lookup('gpu','NVIDIA GeForce RTX 3060'),16870,'legacy vendor-prefixed names refresh from exact compatible catalog model');
refs.parts.gpu.push(['AMD GeForce RTX 3060',9999]);
assert.equal(refs.lookup('gpu','NVIDIA GeForce RTX 3060'),null,'ambiguous normalized identity must not borrow a score');
console.log('Listing validation tests passed: legacy values, malformed numbers, reference fallback and catalog refresh.');
