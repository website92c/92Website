/* ==========================================================================
   dashboard.js — ONLY loaded by index.html (Ticket dashboard)
   Needs: data.js, shared.js, combobox.js
   Sections:
     1. Ticket table + metrics
     2. Updates (work-order dialogue)
     3. Attachments + preview
     4. Pickers (comboboxes)
     5. New ticket modal
     6. Ticket detail modal + status actions
     7. Events + initial render
   ========================================================================== */

let nextAttId=1;            // id counter for attachments added this session
let currentTicketId=null;   // which ticket the detail modal is showing
// Generic document icon (used for non-image attachments)
const DOC_SVG="<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M14 3v5h5'/><path d='M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z'/></svg>";

// Show/hide this page's controls to match the current role (called by shared.js)
function applyPageRole(){
  $("d-controls").style.display=can("ticketAdmin")?"":"none";
  $("newBtn").style.display=can("newTicket")?"":"none";
  document.querySelector(".updates-composer").style.display=can("postUpdate")?"":"none";
}

/* ===== 1. Ticket table + metrics ===== */
// Avatar + name, or a dashed empty avatar when unassigned
function whoHtml(who){ return who==="Unassigned"?"<span class='who muted'><span class='av none'></span>Unassigned</span>":"<span class='who'><span class='av'>"+initials(who)+"</span>"+who+"</span>"; }
// Category cell: parent category in small text above the subcategory
function catHtml(t){ return t.sub?"<div class='cat-p'>"+t.cat+"</div>"+t.sub:t.cat; }
// One table row. New tickets get "unack" (highlighted); closed get "done" (dimmed)
function rowHtml(t){
  const cls=t.status==="New"?"unack":t.status==="Closed"?"done":"";
  return "<tr class='"+cls+"' data-id='"+t.id+"'>"+
    "<td class='tnum'>"+t.id+"</td><td>"+catHtml(t)+"</td>"+
    "<td>"+t.property+"<div class='loc-s'>"+t.space+"</div></td>"+
    "<td><span class='pri'><span class='d' style='background:"+priColor(t.priority)+"'></span>"+t.priority+"</span></td>"+
    "<td><span class='pill "+pillClass[t.status]+"'>"+t.status+"</span></td>"+
    "<td>"+whoHtml(t.assignee)+"</td><td class='muted'>"+t.created+"</td><td class='muted'>"+t.updated+"</td></tr>";
}
function renderTable(){ $("tbody").innerHTML=tickets.map(rowHtml).join(""); }
// Recalculate the status counters and the subtitle
function refresh(){
  const c={New:0,Acknowledged:0,"In progress":0,Resolved:0,Closed:0}; const props=new Set();
  tickets.forEach(t=>{ c[t.status]++; props.add(t.property); });
  $("m-new").textContent=c.New; $("m-ack").textContent=c.Acknowledged; $("m-prog").textContent=c["In progress"]; $("m-res").textContent=c.Resolved;
  $("subline").textContent=(tickets.length-c.Closed)+" open tickets across "+props.size+" properties";
}

/* ===== 2. Updates / work-order dialogue ===== */
function ticketLabel(t){ return "#"+t.id+" · "+(t.sub?t.cat+" › "+t.sub:t.cat); }
function ticketPickerItems(){ return tickets.map(t=>({label:ticketLabel(t),html:ticketLabel(t),id:t.id})); }

// Dashboard feed: every update, each tagged with its ticket (click the tag to open the ticket)
function renderUpdates(){
  const feed=$("updates-feed");
  if(!updates.length){ feed.innerHTML="<div class='updates-empty'>No updates yet. Post the first one below.</div>"; return; }
  feed.innerHTML=updates.map(u=>{
    const t=tickets.find(x=>x.id===u.ticketId);
    const tag=t?("#"+t.id+" · "+(t.sub?t.sub:t.cat)):("#"+u.ticketId);
    return "<div class='msg'><div class='msg-head'><span class='msg-tix' onclick='openDetail("+u.ticketId+")'>"+tag+"</span><span class='msg-time'>"+u.time+"</span></div><div class='msg-body'>"+escapeHtml(u.text)+"</div><div class='msg-author'>"+u.author+"</div></div>";
  }).join("");
  feed.scrollTop=feed.scrollHeight;   // keep the newest message in view
}
// Post from the dashboard composer (needs a ticket + text)
function postUpdate(){
  const it=uTicketCombo.getItem(); const text=$("u-text").value.trim();
  if(!it){ $("u-ticket").querySelector("input").focus(); return; }
  if(!text){ $("u-text").focus(); return; }
  updates.push({id:nextUpdateId++,ticketId:it.id,author:"J. Morales",text:text,time:"now"});
  const t=tickets.find(x=>x.id===it.id); if(t){ t.updated="just now"; renderTable(); refresh(); }
  $("u-text").value="";
  saveState();
  renderUpdates();
}
// Right column of the ticket detail modal: updates for that ticket only
function renderDetailUpdates(id){
  const ups=updates.filter(u=>u.ticketId===id);
  const el=$("d-updates");
  el.innerHTML=ups.length?ups.map(u=>"<div class='msg'><div class='msg-head'><span style='font-weight:600;font-size:13px'>"+u.author+"</span><span class='msg-time'>"+u.time+"</span></div><div class='msg-body'>"+escapeHtml(u.text)+"</div></div>").join(""):"<div class='mini-empty'>No updates yet.</div>";
  el.scrollTop=el.scrollHeight;
}
// Post from inside the ticket detail modal
function postUpdateFromDetail(){
  if(currentTicketId==null) return;
  const text=$("du-text").value.trim(); if(!text){ $("du-text").focus(); return; }
  updates.push({id:nextUpdateId++,ticketId:currentTicketId,author:"J. Morales",text:text,time:"now"});
  const t=tickets.find(x=>x.id===currentTicketId); if(t) t.updated="just now";
  $("du-text").value="";
  saveState();
  renderDetailUpdates(currentTicketId); renderUpdates(); renderTable(); refresh();
}

/* ===== 3. Attachments + preview ===== */
// Thumbnails for images, file chips for everything else; hover shows an "x" to remove
function renderAttachments(id){
  const t=tickets.find(x=>x.id===id); const list=(t&&t.attachments)||[];
  const el=$("d-attach");
  if(!list.length){ el.innerHTML="<div class='att-empty'>No photos or documents yet.</div>"; return; }
  el.innerHTML=list.map(a=>{
    const x=can("attach")?"<button class='att-x' title='Remove' onclick='event.stopPropagation();removeAttachment("+id+","+a.id+")'>&times;</button>":"";
    if(a.isImage) return "<div class='att'>"+x+"<div class='att-img' onclick='openPreview("+id+","+a.id+")' title='"+escapeHtml(a.name)+"' data-name='"+escapeHtml(a.name)+"'><img src='"+a.url+"' alt='"+escapeHtml(a.name)+"' onerror='imgFail(this)'></div></div>";
    return "<div class='att'>"+x+"<div class='att-doc' onclick='openPreview("+id+","+a.id+")'>"+DOC_SVG+"<span class='att-name'>"+escapeHtml(a.name)+"</span></div></div>";
  }).join("");
}
function removeAttachment(ticketId,attId){
  const t=tickets.find(x=>x.id===ticketId); if(!t||!t.attachments) return;
  const a=t.attachments.find(x=>x.id===attId); if(a&&a.url) URL.revokeObjectURL(a.url);   // free the temporary file URL
  t.attachments=t.attachments.filter(x=>x.id!==attId);
  renderAttachments(ticketId);
}
function isImageFile(f){ if(f.type&&f.type.indexOf("image/")===0) return true; return /\.(jpe?g|png|gif|webp|bmp|svg|avif|heic|heif)$/i.test(f.name); }
// If an image can't be displayed (e.g. HEIC in some browsers), fall back to a file chip
function imgFail(img){ const a=img.parentElement; a.classList.remove("att-img"); a.classList.add("att-doc"); a.innerHTML=DOC_SVG+"<span class='att-name'>"+escapeHtml(a.getAttribute("data-name")||"")+"</span>"; }
// Preview: image -> <img>, PDF/text -> <iframe>, anything else -> download message
function openPreview(ticketId,attId){
  const t=tickets.find(x=>x.id===ticketId); if(!t) return;
  const a=(t.attachments||[]).find(x=>x.id===attId); if(!a) return;
  $("pv-name").textContent=a.name;
  const dl=$("pv-download"); dl.href=a.url; dl.setAttribute("download",a.name);
  const imageLike=a.isImage||/\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i.test(a.name)||(a.type&&a.type.indexOf("image/")===0);
  const isPdf=/\.pdf$/i.test(a.name)||(a.type&&a.type.indexOf("pdf")>-1);
  const isText=/\.(txt|csv)$/i.test(a.name)||(a.type&&a.type.indexOf("text/")===0);
  const body=$("pv-body");
  if(imageLike) body.innerHTML="<img src='"+a.url+"' alt='"+escapeHtml(a.name)+"' onerror='pvImgFail(this)'>";
  else if(isPdf||isText) body.innerHTML="<iframe src='"+a.url+"' title='"+escapeHtml(a.name)+"'></iframe>";
  else body.innerHTML="<div class='preview-msg'>No inline preview for this file type. Use Download to open it.</div>";
  $("previewBackdrop").classList.add("open");
}
function pvImgFail(img){ img.parentElement.innerHTML="<div class='preview-msg'>Couldn't display this image here. Use Download to view it.</div>"; }
function closePreview(){ $("previewBackdrop").classList.remove("open"); $("pv-body").innerHTML=""; }

/* ===== 4. Pickers (comboboxes, see combobox.js) ===== */
// New-ticket form. The space picker stays disabled until a property is chosen.
const spaceCombo=makeCombo($("c-space"),{items:[],placeholder:"Select a floor / space",disabledPlaceholder:"Select a property first",disabled:true});
const propCombo=makeCombo($("c-property"),{items:toItems(properties),placeholder:"Search properties",onSelect:it=>{ spaceCombo.setItems(toItems(spaces[it.label])); spaceCombo.setDisabled(false); }});
const catCombo=makeCombo($("c-category"),{items:catItems,placeholder:"Search categories"});
const assigneeCombo=makeCombo($("c-assignee"),{items:toItems(assigneeNames),placeholder:"Search people"});

// Ticket detail: changing assignee/priority applies immediately
const dAssigneeCombo=makeCombo($("d-assignee"),{items:toItems(assigneeNames),placeholder:"Search people",onSelect:it=>{ if(currentTicketId!=null) reassignTicket(currentTicketId,it.label); }});
$("d-priority").innerHTML=optHtml(["Low","Medium","High"],null);
$("d-priority").addEventListener("change",()=>{ if(currentTicketId!=null) setPriorityTicket(currentTicketId,$("d-priority").value); });

// Ticket picker for the updates composer
const uTicketCombo=makeCombo($("u-ticket"),{items:ticketPickerItems(),placeholder:"Search a work order #"});

/* ===== 5. New ticket modal ===== */
let priority="Medium";   // priority chosen in the new-ticket form
$("seg").addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; document.querySelectorAll("#seg button").forEach(x=>x.classList.remove("on")); b.classList.add("on"); priority=b.dataset.v; });

function openNew(){ resetForm(); $("nextChip").textContent="#"+nextNum; $("backdrop").classList.add("open"); }
function closeNew(){ $("backdrop").classList.remove("open"); }
// Clear every field back to defaults
function resetForm(){
  propCombo.setItems(toItems(properties)); spaceCombo.setItems([]); spaceCombo.setDisabled(true);
  catCombo.setItems(catItems); assigneeCombo.setItems(toItems(assigneeNames));
  $("details").value=""; priority="Medium";
  document.querySelectorAll("#seg button").forEach(b=>b.classList.toggle("on",b.dataset.v==="Medium"));
  $("banner").classList.remove("show");
}
function createTicket(){
  // Check required fields and list what's missing in the banner
  const missing=[];
  if(!propCombo.getValue()) missing.push("property");
  if(!spaceCombo.getValue()) missing.push("floor / space");
  if(!catCombo.getValue()) missing.push("category");
  if(!$("details").value.trim()) missing.push("details");
  if(missing.length){ $("bannerText").textContent="Please fill in: "+missing.join(", "); $("banner").classList.add("show"); $("banner").scrollIntoView({behavior:"smooth",block:"nearest"}); return; }
  // Build the ticket and add it to the top of the list
  const item=catCombo.getItem();
  tickets.unshift({id:nextNum,cat:item.cat,sub:item.sub,property:propCombo.getValue(),space:spaceCombo.getValue(),priority:priority,status:"New",assignee:assigneeCombo.getValue()||"Unassigned",created:todayShort(),updated:"now",ackAt:null,details:$("details").value.trim(),attachments:[]});
  nextNum++; saveState();
  renderTable(); refresh(); uTicketCombo.setItems(ticketPickerItems()); closeNew();
  const row=document.querySelector("#tbody tr"); if(row) row.scrollIntoView({behavior:"smooth",block:"center"});
}

/* ===== 6. Ticket detail modal + status actions ===== */
function openDetail(id){
  const t=tickets.find(x=>x.id===id); if(!t) return; currentTicketId=id;
  $("d-title").textContent="Ticket #"+t.id;
  $("d-sub").innerHTML=t.sub?"<span style='color:var(--text-muted)'>"+t.cat+" › </span>"+t.sub:t.cat;
  $("d-badges").innerHTML="<span class='pill "+pillClass[t.status]+"'>"+t.status+"</span>"+
    "<span class='pri-badge'><span class='d' style='background:"+priColor(t.priority)+"'></span>"+t.priority+" priority</span>";
  dAssigneeCombo.setValue(t.assignee);
  $("d-priority").value=t.priority;
  // Highlight tickets nobody has acknowledged yet
  const ackLine=t.ackAt?"<dd>"+t.ackAt+"</dd>":"<dd class='warn'>Not yet acknowledged</dd>";
  const agoUpd=(/[0-9]/.test(t.updated)&&t.updated!=="now")?" ago":"";   // "2h" -> "2h ago", but not "just now"
  $("d-fields").innerHTML=
    "<dt>Location</dt><dd>"+t.property+" · "+t.space+"</dd>"+
    "<dt>Created</dt><dd>"+t.created+"</dd>"+
    "<dt>Last updated</dt><dd>"+t.updated+agoUpd+"</dd>"+
    "<dt>Acknowledged</dt>"+ackLine;
  $("d-details").textContent=t.details;
  renderAttachments(t.id);
  $("d-attach-btn").style.display=can("attach")?"":"none";
  // Activity timeline, built from the ticket's current state
  const act=["<li><b>Opened</b> · "+t.created+"</li>"];
  if(t.ackAt) act.push("<li><b>Acknowledged</b> · "+t.ackAt+"</li>");
  if(["In progress","Resolved","Closed"].includes(t.status)) act.push("<li class='now'><b>"+t.status+"</b> · "+t.updated+agoUpd+"</li>");
  $("d-activity").innerHTML=act.join("");
  renderDetailUpdates(t.id);
  $("du-text").value="";
  $("du-row").style.display=can("postUpdate")?"":"none";
  // Status workflow: New -> Acknowledged -> In progress -> Resolved -> Closed (and Reopen)
  const next={New:{label:"Acknowledge",to:"Acknowledged"},Acknowledged:{label:"Start progress",to:"In progress"},"In progress":{label:"Mark resolved",to:"Resolved"},Resolved:{label:"Close ticket",to:"Closed"},Closed:{label:"Reopen",to:"Acknowledged"}}[t.status];
  let actions="<div class='d-actions'>";
  if(can("advance")){
    actions+="<button class='btn btn-primary' onclick='advance("+t.id+",\""+next.to+"\")'>"+next.label+"</button>";
    if(t.status==="Resolved") actions+="<button class='btn btn-ghost' onclick='advance("+t.id+",\"In progress\")'>Reopen</button>";
  }
  actions+="</div><button class='btn btn-ghost' id='d-done'>Close</button>";
  $("d-foot").innerHTML=actions;
  $("d-done").addEventListener("click",closeDetail);
  $("detailBackdrop").classList.add("open");
}
function closeDetail(){ $("detailBackdrop").classList.remove("open"); }
// Move a ticket to a new status (stamps the acknowledged time the first time)
function advance(id,to){
  const t=tickets.find(x=>x.id===id); if(!t) return;
  t.status=to; t.updated="just now";
  if(to==="Acknowledged"&&!t.ackAt){ const now=new Date(); t.ackAt=now.toLocaleDateString("en-US",{month:"short",day:"numeric"})+", "+now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}); }
  saveState(); renderTable(); refresh(); openDetail(id);
}
function reassignTicket(id,val){ const t=tickets.find(x=>x.id===id); if(!t) return; t.assignee=val; t.updated="just now"; saveState(); renderTable(); refresh(); openDetail(id); }
function setPriorityTicket(id,val){ const t=tickets.find(x=>x.id===id); if(!t) return; t.priority=val; t.updated="just now"; saveState(); renderTable(); refresh(); openDetail(id); }

/* ===== 7. Events + initial render ===== */
// New ticket modal
$("newBtn").addEventListener("click",openNew);
$("closeX").addEventListener("click",closeNew);
$("cancel").addEventListener("click",closeNew);
$("backdrop").addEventListener("mousedown",e=>{ if(e.target===$("backdrop")) closeNew(); });   // click the dim area to close
$("create").addEventListener("click",createTicket);
// Ticket detail modal
$("d-closeX").addEventListener("click",closeDetail);
$("detailBackdrop").addEventListener("mousedown",e=>{ if(e.target===$("detailBackdrop")) closeDetail(); });
// Click any ticket row (event delegation) to open its detail
$("tbody").addEventListener("click",e=>{ const tr=e.target.closest("tr"); if(!tr) return; openDetail(+tr.dataset.id); });
// Updates composers (dashboard feed + detail modal)
$("u-send").addEventListener("click",postUpdate);
$("u-text").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); postUpdate(); } });
$("du-send").addEventListener("click",postUpdateFromDetail);
$("du-text").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); postUpdateFromDetail(); } });
// Attachments: the visible "+ Add" button triggers the hidden file input
$("d-attach-btn").addEventListener("click",()=>$("d-attach-input").click());
$("d-attach-input").addEventListener("change",e=>{
  if(currentTicketId==null) return;
  const t=tickets.find(x=>x.id===currentTicketId); if(!t) return;
  if(!t.attachments) t.attachments=[];
  // createObjectURL gives a temporary in-browser URL for preview/download
  [...e.target.files].forEach(f=>{ t.attachments.push({id:nextAttId++,name:f.name,type:f.type,isImage:isImageFile(f),url:URL.createObjectURL(f)}); });
  e.target.value=""; t.updated="just now"; saveState();
  renderAttachments(currentTicketId); renderTable(); refresh();
});
// Preview modal
$("pv-closeX").addEventListener("click",closePreview);
$("previewBackdrop").addEventListener("mousedown",e=>{ if(e.target===$("previewBackdrop")) closePreview(); });
// Escape closes the top-most modal (preview first, then the rest)
document.addEventListener("keydown",e=>{ if(e.key!=="Escape") return; if($("previewBackdrop").classList.contains("open")){ closePreview(); return; } closeNew(); closeDetail(); });

renderTable(); refresh(); renderUpdates();
initChrome();

// Deep link: index.html?ticket=1042 opens that ticket (used by the Properties page)
const deepTicket=new URLSearchParams(location.search).get("ticket");
if(deepTicket) openDetail(+deepTicket);
