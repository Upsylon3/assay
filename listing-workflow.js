/* Integration stays local until the user explicitly adds selected reviewed drafts. */
(function(){
 const imp=window.AssayImport,dlg=document.createElement('dialog');dlg.id='bulkImport';
 dlg.innerHTML=`<div class="table-title-row"><div><p class="eyebrow">Intake station</p><h2>Import listings</h2></div><button class="btn gh" data-import="close">Close</button></div><p class="lead">Paste one advert or a batch, or load saved JSON/HTML. Nothing is added to your comparison until you review it.</p>
 <details class="form-disclosure"><summary>Collect many favourites in one go</summary><ol class="hint"><li>Drag <a id="collectorBookmark">Collect loaded listings</a> to your bookmarks bar.</li><li>Open Leboncoin favourites normally. Scroll to load the cards you want.</li><li>Click the bookmark to download one JSON file, then load it below.</li></ol><p class="hint">The bookmark reads only the currently loaded page. It makes no requests and does not open adverts. Cards may lack CPU/GPU details; incomplete imports remain drafts. Check the exported count against your favourites. Missing cards never mean unavailable.</p><p class="hint">If your browser blocks bookmarklets, save the page as HTML or copy the collector below into DevTools only after reviewing it. No cookies, tokens, HAR exports or network logs needed. This is a local convenience, not permission from Leboncoin for extraction.</p><label for="collectorCode">Collector code (read before running)</label><textarea id="collectorCode" rows="5" readonly></textarea></details>
 <label for="bulkText">Advert text, JSON or saved HTML</label><textarea id="bulkText" rows="5" placeholder="Paste multiple adverts separated by a line containing ---"></textarea><div class="row"><label class="btn">Load files<input id="bulkFiles" type="file" accept=".json,.html,.htm,.txt" multiple hidden></label><button class="btn pri" data-import="parse">Analyze locally</button></div><p id="bulkStatus" role="status" class="hint"></p><div class="row"><button class="btn" data-import="select">Select complete PCs</button><button class="btn pri" data-import="commit">Add reviewed selection</button></div><p class="hint">Selecting confirms this is a desktop PC and the detected fields are correct. Unknown RAM/storage stay marked assumptions. Unknown setup stays unknown with no price deduction; confirm its value in Edit if included.</p><div id="bulkRows"></div>`;
 document.body.appendChild(dlg);
 const code='('+collectLoadedListings.toString()+')();';
 dlg.querySelector('#collectorBookmark').href='javascript:'+encodeURIComponent(code);
 dlg.querySelector('#collectorCode').value=code;
 let drafts=jget('assay_import_drafts',[]);if(!Array.isArray(drafts))drafts=[];
 drafts=drafts.filter(d=>d&&typeof d.name==='string'&&typeof d.sourceText==='string').slice(0,1000);
 let selected=new Set(),activeDraft=null;
 const store=()=>{jset('assay_import_drafts',drafts);document.querySelectorAll('[data-act=bulkImport]').forEach(b=>b.textContent='↓ Import listings'+(drafts.length?' ('+drafts.length+(drafts.length===1?' draft)':' drafts)'):''))};store();
 const ready=d=>d.kind!=='skip'&&d.cpu?.length===2&&d.gpu?.length===2&&d.price>0;
 const duplicate=d=>!!imp.key(d)&&items.some(it=>imp.key(it)===imp.key(d));
 function render(){
  document.getElementById('bulkRows').innerHTML=drafts.map(d=>`<article class="import-draft"><div class="row"><label class="chk"><input type="checkbox" data-draft-select="${esc(d.draftId)}" ${selected.has(d.draftId)?'checked':''} ${!ready(d)||duplicate(d)?'disabled':''}> ${esc(d.name)}</label><span class="bd">${duplicate(d)?'Already saved':d.kind==='skip'?'Not a desktop PC':ready(d)?'Ready to review':'Needs details'}</span></div><p class="sp">CPU: ${esc(d.cpu?.[0]||'Unknown / ambiguous')} · GPU: ${esc(d.gpu?.[0]||'Unknown / ambiguous')} · Price: ${d.price?money(d.price):'Unknown'}</p><p class="sp">RAM: ${d.ram?esc(d.ram+' GB '+(d.ramType||'(type unknown)')):'Unknown'} · SSD: ${d.ssd??'Unknown'} GB · HDD: ${d.hdd||0} GB · Setup: ${esc(d.setup)}</p><p class="hint">${esc((d.warnings||[]).join(' · '))}</p><details><summary>Source &amp; detected phrases</summary><pre>${esc(d.sourceText)}</pre><p class="hint">RAM: ${esc(d.evidence?.ram||'No explicit RAM phrase')}<br>Storage: ${esc(d.evidence?.storage||'No explicit storage phrase')}</p></details><div class="row secondary-actions"><button class="btn" data-draft-edit="${esc(d.draftId)}">Review in PC form</button><button class="btn gh" data-draft-drop="${esc(d.draftId)}">Dismiss draft</button>${d.sourceUrl?`<a href="${esc(d.sourceUrl)}" target="_blank" rel="noopener">Open advert ↗</a>`:''}</div></article>`).join('');
  document.getElementById('bulkStatus').textContent=drafts.length+(drafts.length===1?' draft · ':' drafts · ')+drafts.filter(d=>ready(d)&&!duplicate(d)).length+' complete · '+selected.size+' selected. Drafts stay on this device; use Settings → Export backup to preserve them.';
 }
 function analyze(text){
  if(text.length>10*1024*1024)throw new Error('Input is too large (10 MB maximum).');
  const parsed=imp.batch(text,parts,[...items,...drafts]),seen=new Set([...items,...drafts].map(imp.key).filter(Boolean));let added=0,duplicates=0;
  for(const d of parsed){const k=imp.key(d);if(d.duplicate||k&&seen.has(k)){duplicates++;continue}if(drafts.length>=1000)break;if(k)seen.add(k);drafts.push({...d,draftId:uid()});added++}
  store();render();document.getElementById('bulkStatus').textContent+=' Added '+added+' drafts; skipped '+duplicates+' duplicate URLs.';
 }
 function fillDraft(id){const d=drafts.find(x=>x.draftId===id);if(!d)return;activeDraft=id;dlg.close();go('add');resetForm();
  $('f_name').value=d.name;$('f_url').value=d.sourceUrl||'';if(d.cpu)pk.cpu.set(d.cpu);if(d.gpu)pk.gpu.set(d.gpu);$('f_price').value=d.price||'';
  $('memoryDetails').open=true;$('f_ram').value=d.ram||'';$('f_ramType').value=d.ramType||'DDR4';$('f_ssd').value=d.ssd??'';$('f_hdd').value=d.hdd||'';
  $('f_setup').checked=d.setup==='yes';$('setupBox').hidden=d.setup!=='yes';$('f_setupAmt').value=0;
  $('formErr').textContent='Imported draft: check detected fields. '+(d.warnings||[]).join('. ');
 }
 dlg.addEventListener('change',e=>{if(e.target.dataset.draftSelect){const id=e.target.dataset.draftSelect;e.target.checked?selected.add(id):selected.delete(id);render()}});
 dlg.addEventListener('click',e=>{
  const editButton=e.target.closest('[data-draft-edit]');if(editButton)return fillDraft(editButton.dataset.draftEdit);
  const drop=e.target.closest('[data-draft-drop]');if(drop){drafts=drafts.filter(d=>d.draftId!==drop.dataset.draftDrop);selected.delete(drop.dataset.draftDrop);store();return render()}
  const action=e.target.closest('[data-import]')?.dataset.import;
  if(action==='close')dlg.close();
  if(action==='parse'){try{analyze($('bulkText').value)}catch(err){$('bulkStatus').textContent=err.message}}
  if(action==='select'){selected=new Set(drafts.filter(d=>d.kind==='pc'&&ready(d)&&!duplicate(d)).map(d=>d.draftId));render()}
  if(action==='commit'){
   const chosen=drafts.filter(d=>selected.has(d.draftId)&&ready(d)&&!duplicate(d));if(!chosen.length){$('bulkStatus').textContent='Select reviewed, complete PCs first.';return}
   const seen=new Set(items.map(imp.key).filter(Boolean)),added=new Set();
   for(const d of chosen){const k=imp.key(d);if(k&&seen.has(k))continue;if(k)seen.add(k);
    items.push(norm({id:uid(),updatedAt:Date.now(),name:d.name,sourceUrl:d.sourceUrl,cpuName:d.cpu[0],cpuScore:d.cpu[1],gpuName:d.gpu[0],gpuScore:d.gpu[1],price:d.price,ram:d.ram||16,ramType:d.ramType||'DDR4',ramUnknown:!d.ram,ramTypeUnknown:!d.ramType,ssd:d.ssd??1000,ssdUnknown:d.ssd==null,hdd:d.hdd||0,setup:d.setup==='yes',setupKnown:d.setup!=='unknown',setupAmt:0,available:true,checkedAt:0,favorite:false,aesthetic:'neutral',notes:''}));added.add(d.draftId)
   }
   drafts=drafts.filter(d=>!added.has(d.draftId));selected.clear();store();saveI();renderAll();render();toast(added.size+' listings added. Unreviewed drafts kept.');
  }
 });
 $('bulkFiles').onchange=async e=>{try{for(const file of e.target.files){if(file.size>10*1024*1024)throw new Error('File is too large (10 MB maximum).');analyze(await file.text())}}catch(err){$('bulkStatus').textContent=err.message}e.target.value=''};
 window.AssayWorkflow={open:()=>{activeDraft=null;render();dlg.showModal()},getDrafts:()=>drafts,restoreDrafts:values=>{if(!Array.isArray(values))return;for(const d of values){if(d&&typeof d.name==='string'&&typeof d.sourceText==='string'&&!drafts.some(x=>imp.key(d)&&imp.key(x)===imp.key(d))&&drafts.length<1000){const p=imp.parse({title:d.name,text:d.sourceText,url:d.sourceUrl,price:d.price},parts);drafts.push({...p,draftId:uid()})}}store()},cancelDraft:()=>{activeDraft=null},finishDraft:()=>{if(activeDraft){drafts=drafts.filter(d=>d.draftId!==activeDraft);selected.delete(activeDraft);activeDraft=null;store()}}};
})();
// Batch status updates require explicit per-advert evidence and user confirmation.
(function(){
 let proposals=[];
 $('rvFiles').onchange=async e=>{try{const entries=[];for(const f of e.target.files){if(f.size>10*1024*1024)throw new Error('File is too large (10 MB maximum).');entries.push(...window.AssayImport.records(await f.text()))}$('rvEvidence').value=JSON.stringify(entries);A.reviewEvidence()}catch(err){$('rvUpdates').textContent=err.message}e.target.value=''};
 A.reviewEvidence=()=>{try{proposals=window.AssayImport.availability($('rvEvidence').value,items);const map=new Map();for(const p of proposals){if(map.has(p.key)&&map.get(p.key)!==p.state)map.set(p.key,'unknown');else if(!map.has(p.key))map.set(p.key,p.state)}proposals=[...map].filter(([,state])=>state!=='unknown').map(([key,state])=>({key,state}));$('rvUpdates').innerHTML=proposals.length?'<p class="hint">'+proposals.map(p=>esc(p.key)+' · '+esc(p.state)).join('<br>')+'</p><button class="btn" data-act="applyEvidence">Confirm these '+proposals.length+' status updates</button>':'<p class="hint">No explicit matching status evidence. Nothing changed. Missing listings and blocked pages stay unresolved.</p>'}catch{$('rvUpdates').textContent='Could not read status evidence. Nothing changed.'}};
 A.applyEvidence=()=>{for(const p of proposals)for(const it of items)if(window.AssayImport.key(it)===p.key){it.available=p.state==='available';it.checkedAt=it.updatedAt=Date.now()}saveI();const updated=new Set(proposals.map(p=>p.key));proposals=[];$('rvUpdates').textContent='Confirmed statuses saved. Unavailable listings are archived, not deleted.';rvQ=rvQ.filter(id=>{const it=items.find(x=>x.id===id);return it&&it.available!==false&&!updated.has(window.AssayImport.key(it))});renderAll();rvShow()};
})();
