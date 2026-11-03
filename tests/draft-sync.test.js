const assert=require('node:assert/strict');
globalThis.AssayImport=require('../listing-import.js');
const sync=require('../draft-sync.js');
const draft={draftId:'local-a',name:'Incomplete PC',sourceText:'RTX 3060, price missing',sourceUrl:'https://www.leboncoin.fr/ad/ordinateurs/1234567890',cpu:null,gpu:['RTX 3060',17000],price:null,availability:'unavailable'};
const a=sync.track([], [draft],100);
assert.equal(a[0].updatedAt,100);
assert.deepEqual(sync.track(a,[draft],200),a,'Unchanged drafts keep their revision');
const b=sync.merge([],a);
assert.deepEqual(b.drafts,[draft]);
assert.equal(b.remoteStale,false);
const deleted=sync.track(b.entries,[],300);
assert.equal(sync.merge(a,deleted).drafts.length,0,'Dismissed/committed drafts stay removed on stale devices');
assert.equal(sync.merge(deleted,a).drafts.length,0);
const restored=sync.track(deleted,[draft],400);
assert.equal(sync.merge(restored,deleted).drafts.length,1,'Explicit reimport can restore a draft');
const independentlyImported=sync.track([],[{...draft,draftId:'device-b'}],150);
assert.equal(sync.merge(a,independentlyImported).drafts.length,1,'Same advert imported on two devices deduplicates');
assert.equal(sync.merge(a,[{id:'real-listing',price:500},...deleted]).entries.length,1);
assert.equal(sync.merge(a,[{...a[0],deleted:true,data:undefined}]).drafts.length,0,'Deletion wins timestamp ties');
assert.equal(sync.merge(a,sync.track([], [{...draft,sourceUrl:'',draftId:'other'}],200)).drafts.length,2);

// Exercise the actual account sync function with a fake Supabase transport.
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('async function cloudSync(){'),html.indexOf('function authMsg('));
let posted;
const listing={id:'listing',price:500};
const ctx={ON:true,sess:{},sy:{busy:false},window:{AssayDraftSync:sync,AssayWorkflow:{mergeCloud:remote=>sync.merge(a,remote)}},
 items:[listing],tombs:[],num:Number.isFinite,sane:e=>e.id==='listing',norm:e=>e,
 mergeAll:()=>({live:[listing],tombs:[],entries:[listing],remoteStale:false}),
 renderAccount(){},jset(){},build(){},renderAll(){},scheduleSync(){},editId:null,
 userApi:async(path,options)=>{if(!options)return {ok:true,json:async()=>[{items:[listing],rev:7}]};posted=JSON.parse(options.body);assert.match(path,/rev=eq.7/);return {ok:true,json:async()=>[{}]}},
};
(async()=>{
 await vm.runInNewContext(code+';cloudSync()',ctx);
 assert.equal(ctx.sy.err,'');assert.equal(posted.rev,8);
 assert.equal(posted.items.length,2);assert.equal(posted.items[1].type,'import-draft');
 assert.equal(ctx.items.length,1,'Drafts never enter the ranked listing array');
 console.log('Draft sync tests passed: migration, deduplication, removal, restoration, conflicts, and account payload.');
})().catch(e=>{console.error(e);process.exitCode=1});
