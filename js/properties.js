/* ==========================================================================
   properties.js — ONLY loaded by properties.html
   Needs: data.js, shared.js
   Sections:
     1. Table + metrics
     2. Property modal (view / edit)
     3. New property modal
     4. Events + initial render
   ========================================================================== */

// Show/hide this page's controls to match the current role (called by shared.js)
function applyPageRole(){
  $("addPropBtn").style.display=can("addProp")?"":"none";
}

/* ===== 1. Table + metrics ===== */
// One row in the properties table (open ticket count is computed live from tickets)
function propRow(name){
  const m=propMeta[name]||{type:"—"};
  const ptix=tickets.filter(t=>t.property===name);
  const open=ptix.filter(t=>t.status!=="Closed").length;
  const addr=m.address?"<div class='paddr'>"+m.address+"</div>":"<div class='paddr muted'>Add address</div>";
  const dash="<span class='muted'>—</span>";
  return "<tr data-name='"+name+"'>"+
    "<td><div class='prop'><span class='ptile'><i class='ti ti-building'></i></span><div><div class='pname'>"+name+"</div>"+addr+"</div></div></td>"+
    "<td>"+(m.city||dash)+"</td>"+
    "<td><span class='type-badge'>"+(m.type||"—")+"</span></td>"+
    "<td>"+(m.floors!=null?m.floors:dash)+"</td>"+
    "<td>"+(m.size!=null?m.size.toLocaleString()+" sqft":dash)+"</td>"+
    "<td>"+(open>0?open:dash)+"</td></tr>";
}
// Render table + the four summary cards + subtitle
function renderProperties(){
  $("rtbody").innerHTML=properties.map(propRow).join("");
  let totSize=0; const cities=new Set();
  properties.forEach(n=>{ const m=propMeta[n]||{}; if(typeof m.size==="number") totSize+=m.size; if(m.city) cities.add(m.city); });
  const open=tickets.filter(t=>t.status!=="Closed").length;
  const high=tickets.filter(t=>t.status!=="Closed"&&t.priority==="High").length;
  $("r-total").textContent=properties.length; $("r-size").textContent=totSize.toLocaleString()+" sqft"; $("r-open").textContent=open; $("r-high").textContent=high;
  $("r-subline").textContent=properties.length+" properties · "+cities.size+" cit"+(cities.size===1?"y":"ies");
}

/* ===== 2. Property modal ===== */
// Read-only view: details, spaces, and open tickets
function openProperty(name){
  const m=propMeta[name]||{}; const dash="<span class='muted'>—</span>";
  $("pr-title").textContent=name;
  $("pr-sub").innerHTML="<span class='type-badge'>"+(m.type||"—")+"</span>";
  const sp=spaces[name]||[];
  const spacesHtml=sp.length?sp.join(" &nbsp;·&nbsp; "):"<span class='muted'>No spaces recorded</span>";
  const open=tickets.filter(t=>t.property===name&&t.status!=="Closed");
  const tixHtml=open.length?open.map(t=>"<li onclick='goToTicket("+t.id+")'><span class='mt-id'>#"+t.id+"</span><span class='mt-cat'>"+(t.sub?t.cat+" › "+t.sub:t.cat)+"</span><span class='pill "+pillClass[t.status]+"'>"+t.status+"</span></li>").join(""):"<div class='mini-empty'>No open tickets.</div>";
  $("pr-body").innerHTML=
    "<dl class='dl'>"+
    "<dt>Address</dt><dd>"+(m.address||dash)+"</dd>"+
    "<dt>City</dt><dd>"+(m.city||dash)+"</dd>"+
    "<dt>Time zone</dt><dd>"+(m.tz||dash)+"</dd>"+
    "<dt>Floors</dt><dd>"+(m.floors!=null?m.floors:dash)+"</dd>"+
    "<dt>Size</dt><dd>"+(m.size!=null?m.size.toLocaleString()+" sqft":dash)+"</dd>"+
    "<dt>Added</dt><dd>"+(m.added||dash)+"</dd>"+
    "<dt>Last modified</dt><dd>"+(m.modified||dash)+"</dd>"+
    "</dl>"+
    "<div class='d-section'><div class='d-label'>Spaces</div><div class='d-text'>"+spacesHtml+"</div></div>"+
    "<div class='d-section'><div class='d-label'>Open tickets</div><ul class='mini-tix'>"+tixHtml+"</ul></div>";
  // "Edit property" button only appears for roles allowed to edit
  $("pr-foot").innerHTML="<button class='btn btn-ghost' onclick='closeProperty()'>Close</button>"+(can("editProps")?"<button class='btn btn-primary' onclick='editProperty(\""+name+"\")'><i class=\"ti ti-pencil\"></i>Edit property</button>":"");
  $("propBackdrop").classList.add("open");
}
// Same modal, swapped into edit mode
function editProperty(name){
  const m=propMeta[name]||{};
  $("pr-title").textContent="Edit "+name;
  $("pr-sub").innerHTML="<span class='muted'>Name and spaces are managed separately</span>";
  $("pr-body").innerHTML=
    "<div class='grid2'>"+
    "<div class='field'><label>Address</label><input class='finput' id='e-address' type='text' value=\""+(m.address||"")+"\"></div>"+
    "<div class='field'><label>City</label><input class='finput' id='e-city' type='text' value=\""+(m.city||"")+"\"></div>"+
    "</div>"+
    "<div class='grid2'>"+
    "<div class='field'><label>Time zone</label><select class='finput' id='e-tz'>"+optHtml(TZONES,m.tz)+"</select></div>"+
    "<div class='field'><label>Type</label><select class='finput' id='e-type'>"+optHtml(PTYPES,m.type)+"</select></div>"+
    "</div>"+
    "<div class='grid2'>"+
    "<div class='field nomb'><label>Floors</label><input class='finput' id='e-floors' type='number' min='0' value=\""+(m.floors!=null?m.floors:"")+"\"></div>"+
    "<div class='field nomb'><label>Size (sqft)</label><input class='finput' id='e-size' type='number' min='0' value=\""+(m.size!=null?m.size:"")+"\"></div>"+
    "</div>";
  $("pr-foot").innerHTML="<button class='btn btn-ghost' onclick='openProperty(\""+name+"\")'>Cancel</button><button class='btn btn-primary' onclick='savePropertyEdit(\""+name+"\")'>Save changes</button>";
}
function savePropertyEdit(name){
  const m=propMeta[name]||(propMeta[name]={});
  m.address=$("e-address").value.trim();
  m.city=$("e-city").value.trim();
  m.tz=$("e-tz").value; m.type=$("e-type").value;
  const fl=parseInt($("e-floors").value,10); m.floors=isNaN(fl)?null:fl;
  const sz=parseInt($("e-size").value,10); m.size=isNaN(sz)?null:sz;
  m.modified=todayLong();   // stamp "last modified"
  saveState();
  renderProperties(); openProperty(name);
}
function closeProperty(){ $("propBackdrop").classList.remove("open"); }
// Tickets live on the dashboard page, so jump there and open the ticket
function goToTicket(id){ location.href="index.html?ticket="+id; }

/* ===== 3. New property modal ===== */
function openNewProperty(){
  $("np-name").value=""; $("np-address").value=""; $("np-city").value="";
  $("np-tz").selectedIndex=0; $("np-type").selectedIndex=0;
  $("np-floors").value=""; $("np-size").value=""; $("np-spaces").value="";
  $("np-banner").classList.remove("show");
  $("propNewBackdrop").classList.add("open");
}
function closeNewProperty(){ $("propNewBackdrop").classList.remove("open"); }
function createProperty(){
  const name=$("np-name").value.trim();
  // Validate: name required and must be unique (case-insensitive)
  if(!name){ $("np-bannerText").textContent="Enter a property name."; $("np-banner").classList.add("show"); return; }
  if(properties.some(p=>p.toLowerCase()===name.toLowerCase())){ $("np-bannerText").textContent="A property named \""+name+"\" already exists."; $("np-banner").classList.add("show"); return; }
  const sp=$("np-spaces").value.split("\n").map(s=>s.trim()).filter(Boolean);   // one space per line
  const fl=parseInt($("np-floors").value,10); const sz=parseInt($("np-size").value,10);
  const today=todayLong();
  spaces[name]=sp;
  properties.push(name);
  propMeta[name]={address:$("np-address").value.trim(),city:$("np-city").value.trim(),tz:$("np-tz").value,type:$("np-type").value,floors:isNaN(fl)?null:fl,size:isNaN(sz)?null:sz,added:today,modified:today};
  saveState();
  renderProperties(); closeNewProperty(); openProperty(name);
}

/* ===== 4. Events + initial render ===== */
// Click any property row to open its detail
$("rtbody").addEventListener("click",e=>{ const tr=e.target.closest("tr"); if(!tr||!tr.dataset.name) return; openProperty(tr.dataset.name); });
$("pr-closeX").addEventListener("click",closeProperty);
$("propBackdrop").addEventListener("mousedown",e=>{ if(e.target===$("propBackdrop")) closeProperty(); });
// New property form: fill the dropdowns, then wire the buttons
$("np-tz").innerHTML=optHtml(TZONES,null);
$("np-type").innerHTML=optHtml(PTYPES,null);
$("addPropBtn").addEventListener("click",openNewProperty);
$("np-closeX").addEventListener("click",closeNewProperty);
$("np-cancel").addEventListener("click",closeNewProperty);
$("np-create").addEventListener("click",createProperty);
$("propNewBackdrop").addEventListener("mousedown",e=>{ if(e.target===$("propNewBackdrop")) closeNewProperty(); });
// Escape closes any open modal
document.addEventListener("keydown",e=>{ if(e.key!=="Escape") return; closeProperty(); closeNewProperty(); });

renderProperties();
initChrome();
