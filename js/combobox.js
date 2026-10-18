/* ==========================================================================
   combobox.js — reusable searchable dropdown (loaded by pages that use one)

   makeCombo(wrap, opts) builds the dropdown inside the element `wrap`.
     opts: { items, placeholder, disabled, disabledPlaceholder, onSelect }
     items look like { label, html }  (label = text value, html = how it's shown)
   Returns a small API: getValue, getItem, setItems, setValue, setDisabled.
   ========================================================================== */
function makeCombo(wrap,opts){
  // Build the DOM: text input + chevron icon + dropdown list
  const input=document.createElement("input");
  input.type="text"; input.placeholder=opts.placeholder; input.autocomplete="off";
  input.setAttribute("role","combobox"); input.setAttribute("aria-expanded","false");
  const chev=document.createElement("i"); chev.className="ti ti-chevron-down chev";
  const list=document.createElement("div"); list.className="combo-list"; list.setAttribute("role","listbox");
  wrap.append(input,chev,list);

  let items=opts.items||[], selected=null, active=-1, disabled=!!opts.disabled;
  if(disabled) wrap.classList.add("disabled");

  // Show items matching the typed text (case-insensitive substring)
  function render(f){ const q=(f||"").toLowerCase(); const m=items.filter(it=>it.label.toLowerCase().includes(q)); active=-1;
    if(!m.length){ list.innerHTML="<div class='combo-empty'>No matches</div>"; list._m=[]; return; }
    list.innerHTML=m.map((it,i)=>"<div class='combo-opt' role='option' data-i='"+i+"'>"+it.html+"</div>").join(""); list._m=m; }
  function open(){ if(disabled) return; render(""); list.classList.add("open"); input.setAttribute("aria-expanded","true"); }
  // On close, snap the input back to the selected label (discard half-typed text)
  function close(){ list.classList.remove("open"); input.setAttribute("aria-expanded","false"); if(input.value!==(selected?selected.label:"")) input.value=selected?selected.label:""; }
  function choose(it){ selected=it; input.value=it.label; close(); if(opts.onSelect) opts.onSelect(it); }
  // Keyboard highlight, wrapping at both ends
  function setActive(n){ const o=list.querySelectorAll(".combo-opt"); if(!o.length) return; active=(n+o.length)%o.length; o.forEach(x=>x.classList.remove("active")); o[active].classList.add("active"); o[active].scrollIntoView({block:"nearest"}); }

  input.addEventListener("focus",open);
  input.addEventListener("click",()=>{ if(!list.classList.contains("open")) open(); });
  input.addEventListener("input",()=>{ list.classList.add("open"); render(input.value); });
  input.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown"){ e.preventDefault(); if(!list.classList.contains("open")) open(); setActive(active+1); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); setActive(active-1); }
    else if(e.key==="Enter"){ if(active>=0&&list._m){ e.preventDefault(); choose(list._m[active]); } }
    else if(e.key==="Escape"){ close(); }
  });
  // mousedown (not click) so the choice lands before the input loses focus
  list.addEventListener("mousedown",e=>{ const o=e.target.closest(".combo-opt"); if(!o) return; e.preventDefault(); choose(list._m[+o.dataset.i]); });
  document.addEventListener("click",e=>{ if(!wrap.contains(e.target)) close(); });   // click outside closes

  // Public API
  return { getValue:()=>selected?selected.label:"", getItem:()=>selected,
    setItems:a=>{ items=a; selected=null; input.value=""; },
    setValue:label=>{ const it=items.find(x=>x.label===label); selected=it||null; input.value=it?it.label:(label||""); },
    setDisabled:d=>{ disabled=d; wrap.classList.toggle("disabled",d); input.placeholder=d?(opts.disabledPlaceholder||opts.placeholder):opts.placeholder; if(d){ selected=null; input.value=""; } } };
}
