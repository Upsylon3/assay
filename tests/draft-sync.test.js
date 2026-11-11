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
 accountEpoch:0,items:[listing],tombs:[],num:Number.isFinite,sane:e=>e.id==='listing',norm:e=>e,
 mergeAll:()=>({live:[listing],tombs:[],entries:[listing],remoteStale:false}),
 renderAccount(){},jset(){},build(){},renderAll(){},scheduleSync(){},editId:null,
 userApi:async(path,options)=>{if(!options)return {ok:true,json:async()=>[{items:[listing],rev:7}]};posted=JSON.parse(options.body);assert.match(path,/rev=eq.7/);return {ok:true,json:async()=>[{}]}},
};
(async()=>{
 await vm.runInNewContext(code+';cloudSync()',ctx);
 assert.equal(ctx.sy.err,'');assert.equal(posted.rev,8);
 assert.equal(posted.items.length,2);assert.equal(posted.items[1].type,'import-draft');
 assert.equal(ctx.items.length,1,'Drafts never enter the ranked listing array');

 // An old account response arriving after signout/account switching must be discarded.
 for(const switched of [false,true]){
  let resolveRead,merges=0,writes=0;
  const response=new Promise(resolve=>{resolveRead=resolve});
  const race={...ctx,accountEpoch:0,sess:{uid:'account-a'},sy:{busy:false,err:'',at:0},items:[listing],tombs:[],
   window:{AssayDraftSync:sync,AssayWorkflow:{mergeCloud(){merges++;return sync.merge(a,[])}}},
   userApi:async(path,options)=>{if(options){writes++;return {ok:true,json:async()=>[{}]}}return response},
  };
  const pending=vm.runInNewContext(code+';cloudSync()',race);
  race.accountEpoch++;
  race.sess=switched?{uid:'account-b'}:null;
  race.items=switched?[{id:'account-b-listing'}]:[];
  resolveRead({ok:true,json:async()=>[{items:[listing,...a],rev:7}]});
  await pending;
  assert.equal(race.items.length,switched?1:0,'Late response must not restore forgotten account listings');
  if(switched)assert.equal(race.items[0].id,'account-b-listing');
  assert.equal(merges,0,'Late response must not merge old account drafts');
  assert.equal(writes,0,'Late response must not write old account data using a new session');
  assert.equal(race.sy.at,0,'Late response must not report current account synced');
 }
 const mergeCode=html.slice(html.indexOf('function mergeAll('),html.indexOf('const authFetch='));
 const fpCode=html.split('\n').find(line=>line.startsWith('const fp='));
 const mergeContext={window:{AssayImport:globalThis.AssayImport}};
 vm.runInNewContext(fpCode+'\n'+mergeCode,mergeContext);
 const live={id:'tie',updatedAt:100};
 const tombstone={id:'tie',deleted:true,updatedAt:100};
 assert.equal(mergeContext.mergeAll([], [tombstone], [live]).live.length,0,'Deletion wins a live/tombstone timestamp tie');
 assert.equal(mergeContext.mergeAll([live], [], [tombstone]).live.length,0,'Deletion ties converge regardless of device order');
 const spec={name:'PC Gamer',cpuName:'Ryzen 5 5600',gpuName:'RTX 3060',ram:16,ramType:'DDR4',ssd:500,hdd:0,price:500,updatedAt:100};
 const first={...spec,id:'a',sourceUrl:'https://www.leboncoin.fr/ad/ordinateurs/1234567890'};
 const second={...spec,id:'b',sourceUrl:'https://www.leboncoin.fr/ad/ordinateurs/9876543210'};
 assert.equal(mergeContext.mergeAll([first],[],[second]).live.length,2,'Identical specifications never merge distinct advert URLs');
 assert.equal(mergeContext.mergeAll([{...first,sourceUrl:''}],[],[{...second,sourceUrl:''}]).live.length,2,'Stable modern IDs without URLs must not be collapsed by matching specifications');
 assert.equal(mergeContext.mergeAll([first],[],[{...second,sourceUrl:first.sourceUrl+'?utm_source=test'}]).live.length,1,'The same canonical advert deduplicates across devices');
 const refreshCode=html.slice(html.indexOf('async function freshToken('),html.indexOf('async function why('));
 let resolveRefresh,sessionWrites=0;
 const refreshed=new Promise(resolve=>{resolveRefresh=resolve});
 const refreshContext={sess:{uid:'old-account',exp:0,refresh:'old-refresh'},accountEpoch:0,authFetch:()=>refreshed,setSession(){sessionWrites++},dropSession(){throw new Error('must not sign out the new account')},api(){throw new Error('must not send an old refresh token to the new account')}};
 const pendingRefresh=vm.runInNewContext(refreshCode+';freshToken()',refreshContext);
 refreshContext.accountEpoch++;refreshContext.sess={uid:'new-account'};
 resolveRefresh({ok:true,json:async()=>({access_token:'old-access',user:{id:'old-account'}})});
 await assert.rejects(pendingRefresh,/signed-out/);
 assert.equal(sessionWrites,0,'Late token refresh must never restore a previous account session');
 console.log('Draft/listing sync tests passed: migration, deduplication, restoration, conflicts, deletion ties, account payload and late account responses.');
})().catch(e=>{console.error(e);process.exitCode=1});
