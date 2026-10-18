/* ==========================================================================
   admin.js — ONLY loaded by admin.html
   Needs: data.js, shared.js
   The Admin page is still a placeholder; the one working control is a
   "reset demo data" button that clears everything saved in the browser.
   ========================================================================== */

$("resetBtn").addEventListener("click",()=>{
  if(!confirm("Reset all demo data (tickets, updates, properties) back to the defaults?")) return;
  try{
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(ROLE_KEY);
  }catch(e){}
  location.href="index.html";   // reload from the defaults
});

initChrome();   // admin-only page: shared.js sends non-admins back to the dashboard
