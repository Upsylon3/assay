/* Drafts share the account's revision-checked JSON payload, but never enter rankings. */
(function(root){
 const type='import-draft',valid=e=>e&&e.type===type&&typeof e.id==='string'&&e.id.startsWith('draft:')&&Number.isFinite(e.updatedAt)&&(e.deleted===true||e.data&&typeof e.data.name==='string'&&typeof e.data.sourceText==='string');
 const identity=d=>'draft:'+(root.AssayImport.key(d)||d.draftId);
 function track(previous,drafts,now=Date.now()){
  const before=new Map(previous.filter(valid).map(e=>[e.id,e])),live=new Map();
  for(const draft of drafts){const id=identity(draft),old=before.get(id),data={...draft};delete data.duplicate;
   if(live.has(id))continue;
   const same=old&&!old.deleted&&JSON.stringify(old.data)===JSON.stringify(data);
   live.set(id,same?old:{type,id,updatedAt:Math.max(now,(old?.updatedAt||0)+1),data});
  }
  for(const [id,old] of before)if(!live.has(id))live.set(id,old.deleted?old:{type,id,deleted:true,updatedAt:Math.max(now,old.updatedAt+1)});
  return [...live.values()];
 }
 function merge(local,remote){
  const best=new Map();
  for(const e of [...remote,...local].filter(valid)){const old=best.get(e.id);if(!old||e.updatedAt>old.updatedAt||e.updatedAt===old.updatedAt&&e.deleted&&!old.deleted)best.set(e.id,e)}
  const entries=[...best.values()],drafts=entries.filter(e=>!e.deleted).map(e=>({...e.data}));
  const remoteMap=new Map(remote.filter(valid).map(e=>[e.id,e]));
  return {entries,drafts,remoteStale:entries.some(e=>JSON.stringify(remoteMap.get(e.id))!==JSON.stringify(e))};
 }
 root.AssayDraftSync={valid,track,merge};
 if(typeof module!=='undefined')module.exports=root.AssayDraftSync;
})(typeof window==='undefined'?globalThis:window);
