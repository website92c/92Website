/* ==========================================================================
   shared.js — loaded on EVERY page (after data.js)
   Helpers and the "chrome" every page has: roles + the sidebar role switcher.

   How a page script uses this:
     - define  function applyPageRole(){ ... }  to show/hide its own buttons
     - call    initChrome()  once, at the end of the page script
   ========================================================================== */

/* ===== Helpers ===== */
const $=id=>document.getElementById(id);   // shorthand for getElementById
function initials(n){ return n.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(); }   // "Dana Reyes" -> "DR"
// Escape user text before inserting it into innerHTML
function escapeHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
// Build <option> tags, marking the current value as selected
function optHtml(list,cur){ return list.map(o=>"<option"+(o===cur?" selected":"")+">"+o+"</option>").join(""); }
// Turn a plain array of strings into combobox items
const toItems=arr=>arr.map(s=>({label:s,html:s}));
// Date strings used when stamping records
function todayShort(){ return new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function todayLong(){ return new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }

/* ===== Status / priority styling (used by tickets and property pages) ===== */
const pillClass={New:"p-new",Acknowledged:"p-ack","In progress":"p-prog",Resolved:"p-res",Closed:"p-closed"};
function priColor(p){ return p==="High"?"var(--pri-high)":p==="Low"?"var(--pri-low)":"var(--pri-med)"; }

/* ===== Role-based visibility (UI layer only — real enforcement belongs server-side) ===== */
// What each role is allowed to do
const caps={
  Admin:{adminTab:true,ticketAdmin:true,advance:true,editProps:true,newTicket:true,invite:true,addProp:true,postUpdate:true,attach:true},
  Staff:{adminTab:false,ticketAdmin:false,advance:true,editProps:false,newTicket:true,invite:false,addProp:false,postUpdate:true,attach:true},
  Viewer:{adminTab:false,ticketAdmin:false,advance:false,editProps:false,newTicket:false,invite:false,addProp:false,postUpdate:false,attach:false}
};
// The chosen role is remembered so it carries from page to page
let currentRole=(function(){
  try{ const r=localStorage.getItem(ROLE_KEY); if(r&&caps[r]) return r; }catch(e){}
  return "Admin";
})();
function can(k){ return caps[currentRole][k]; }

// Apply the current role to the parts of the page every page shares, then let the page do its own
function applyRole(){
  const adminLink=document.querySelector('.nav a[href="admin.html"]');
  if(adminLink) adminLink.style.display=can("adminTab")?"":"none";
  // Non-admins can't stay on the Admin page
  if(document.body.dataset.page==="admin" && !can("adminTab")){ location.replace("index.html"); return; }
  if(typeof applyPageRole==="function") applyPageRole();
}

// Hook up the sidebar "Preview as" dropdown and apply the role once
function initChrome(){
  const sel=$("roleSwitch");
  if(sel){
    sel.value=currentRole;
    sel.addEventListener("change",()=>{
      currentRole=sel.value;
      try{ localStorage.setItem(ROLE_KEY,currentRole); }catch(e){}
      applyRole();
    });
  }
  applyRole();
}
