/* ==========================================================================
   people.js — ONLY loaded by people.html
   Needs: data.js, shared.js
   ========================================================================== */

// Role -> badge style + icon
const roleMeta={Admin:{cls:"role-admin",icon:"ti-shield-check"},Staff:{cls:"role-staff",icon:"ti-tool"},Viewer:{cls:"role-viewer",icon:"ti-eye"}};
// Status -> dot color
const statMeta={Active:"var(--st-active)",Invited:"var(--st-invited)",Inactive:"var(--st-inactive)"};

function propsText(p){ if(p==="All") return "<span class='muted'>All properties</span>"; if(p===null) return "<span class='muted'>—</span>"; return p+(p===1?" property":" properties"); }
function openText(o){ return o>0?o:"<span class='muted'>—</span>"; }

// One table row. Inactive people get the dimmed "off" style.
function personRow(p){
  const rm=roleMeta[p.role];
  return "<tr"+(p.status==="Inactive"?" class='off'":"")+">"+
    "<td><div class='person'><span class='av'>"+initials(p.name)+"</span><div><div class='pname'>"+p.name+"</div><div class='pmail'>"+p.email+"</div></div></div></td>"+
    "<td><span class='role "+rm.cls+"'><i class='ti "+rm.icon+"'></i>"+p.role+"</span></td>"+
    "<td><span class='pstat'><span class='d' style='background:"+statMeta[p.status]+"'></span>"+p.status+"</span></td>"+
    "<td>"+propsText(p.properties)+"</td><td>"+openText(p.open)+"</td><td class='muted'>"+p.last+"</td></tr>";
}

// Render the table, the four counters and the subtitle
function renderPeople(){
  $("ptbody").innerHTML=people.map(personRow).join("");
  const admins=people.filter(p=>p.role==="Admin").length;
  const active=people.filter(p=>p.status==="Active").length;
  const pending=people.filter(p=>p.status==="Invited").length;
  $("m-total").textContent=people.length; $("m-admin").textContent=admins; $("m-active").textContent=active; $("m-pending").textContent=pending;
  $("p-subline").textContent=people.length+" people with access"+(pending?" · "+pending+" pending invite"+(pending>1?"s":""):"");
}

renderPeople();
initChrome();
