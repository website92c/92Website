/* ==========================================================================
   data.js — loaded on EVERY page (first script)
   The demo "database": properties, people, categories, tickets, updates.

   There is no server, so changes are saved to the browser's localStorage
   (saveState) and restored on the next page load (loadState). That is what
   lets a ticket created on the dashboard show up on the Properties page.
   Attachments are NOT saved (they are temporary in-browser file URLs).
   ========================================================================== */

const STORE_KEY="92c-demo-v1";        // localStorage key for all saved data
const ROLE_KEY="92c-demo-role";       // localStorage key for the "Preview as" role

/* ----- Properties and the spaces/floors inside each (feeds the "Floor / space" picker) ----- */
let spaces={
  "The Beacon":["Roof","Main entrance","Lobby","Floor 2","Floor 3"],
  "Market Street Tower":["Lobby","Floor 3 · Suite 310","Elevator B","Parking P1","Parking P2"],
  "Riverside Commons":["Lobby","Parking P2","Floor 4 · Break room","Rooftop"],
  "Oakland Plaza":["Lobby","Floor 1","Floor 2"],
  "Cedar Point Offices":["Floor 1","Floor 2","Suite 210"]
};
let properties=Object.keys(spaces);   // list of property names (new ones get pushed on)

/* ----- Extra details for each property (address, size, dates, etc.) ----- */
let propMeta={
  "The Beacon":{address:"400 Marigold Ave",city:"Portland, OR",tz:"Pacific (PT)",floors:12,size:84000,type:"Office",added:"Jan 4, 2023",modified:"Jul 18, 2026"},
  "Market Street Tower":{address:"1200 Market St",city:"San Francisco, CA",tz:"Pacific (PT)",floors:18,size:120000,type:"Office",added:"Mar 22, 2022",modified:"Jul 18, 2026"},
  "Riverside Commons":{address:"55 Riverside Dr",city:"Austin, TX",tz:"Central (CT)",floors:6,size:54000,type:"Mixed-use",added:"Aug 9, 2023",modified:"Jul 17, 2026"},
  "Oakland Plaza":{address:"88 Oakland Plaza",city:"Oakland, CA",tz:"Pacific (PT)",floors:4,size:32000,type:"Retail",added:"Feb 1, 2024",modified:"Jul 17, 2026"},
  "Cedar Point Offices":{address:"3 Cedar Point Rd",city:"Denver, CO",tz:"Mountain (MT)",floors:3,size:21000,type:"Office",added:"Nov 15, 2023",modified:"Jul 16, 2026"}
};
const TZONES=["Pacific (PT)","Mountain (MT)","Central (CT)","Eastern (ET)","Alaska (AKT)","Hawaii (HT)"];
const PTYPES=["Office","Retail","Mixed-use","Industrial","Other"];

/* ----- Team members ----- */
const people=[
  {name:"Jordan Morales",email:"jordan.morales@92c.co",role:"Admin",status:"Active",properties:"All",open:3,last:"5m"},
  {name:"Elena Ruiz",email:"elena.ruiz@92c.co",role:"Admin",status:"Active",properties:"All",open:1,last:"1h"},
  {name:"Dana Reyes",email:"dana.reyes@92c.co",role:"Staff",status:"Active",properties:4,open:5,last:"12m"},
  {name:"Marcus Hale",email:"marcus.hale@92c.co",role:"Staff",status:"Active",properties:3,open:2,last:"40m"},
  {name:"Priya Shah",email:"priya.shah@92c.co",role:"Staff",status:"Active",properties:5,open:4,last:"2h"},
  {name:"Tom Becker",email:"tom.becker@92c.co",role:"Staff",status:"Active",properties:2,open:1,last:"3h"},
  {name:"Sam Park",email:"sam.park@92c.co",role:"Viewer",status:"Active",properties:3,open:0,last:"1d"},
  {name:"Chris Doyle",email:"chris.doyle@92c.co",role:"Staff",status:"Invited",properties:null,open:0,last:"Never"},
  {name:"Nina Alvarez",email:"nina.alvarez@92c.co",role:"Viewer",status:"Inactive",properties:1,open:0,last:"21d"}
];
// Only active, non-viewer people can be assigned tickets
const assigneeNames=["Unassigned"].concat(people.filter(p=>p.status==="Active"&&p.role!=="Viewer").map(p=>p.name));

/* ----- Ticket categories -> subcategories ----- */
const cats={
  "After Hours":["Cleaning - after hours","HVAC - overtime"],"Electrical":["General","Lighting"],
  "Cleaning":["Trash removal","Janitorial"],"Elevator/Escalator":[],
  "Exterior":["Landscaping","Parking","Roof","Ice/snow removal"],"Fire protection":[],
  "HVAC":["Too hot","Too cold"],"Entrances":["Doors","Keys and locks"],
  "Repairs":["Ceiling","Maintenance","Water station"],"Furniture":["Request new item","Repair item"],
  "Plumbing":["Plumbing leak","Roof leak"],"Security":["Access card","Security office","Vendor escort"],
  "Other":["Odors","Pest control","Signage","Stairwell","Surplus pickup","Miscellaneous"]
};
// Flatten into one searchable list: "Category › Subcategory" (or just "Category" when it has no children)
const catItems=[];
for(const c in cats){
  if(cats[c].length===0) catItems.push({label:c,cat:c,sub:"",html:c});
  else cats[c].forEach(s=>catItems.push({label:c+" › "+s,cat:c,sub:s,html:"<span class='p'>"+c+" › </span>"+s}));
}

/* ----- Tickets (newest first) ----- */
let tickets=[
  {id:1042,cat:"Plumbing",sub:"Roof leak",property:"The Beacon",space:"Roof",priority:"High",status:"In progress",assignee:"Dana Reyes",created:"Jul 18",updated:"2h",ackAt:"Jul 18, 9:05 AM",details:"Water staining is spreading across the roof membrane near the northwest drain; tenants reported pooling after last night's rain."},
  {id:1041,cat:"HVAC",sub:"Too cold",property:"Market Street Tower",space:"Fl 3 · Ste 310",priority:"Medium",status:"Acknowledged",assignee:"Marcus Hale",created:"Jul 18",updated:"5h",ackAt:"Jul 18, 11:20 AM",details:"Suite 310 won't get above 65°F and the thermostat is unresponsive. Tenant asked for a same-day look."},
  {id:1040,cat:"Electrical",sub:"Lighting",property:"Riverside Commons",space:"Parking P2",priority:"Low",status:"New",assignee:"Unassigned",created:"Jul 18",updated:"6h",ackAt:null,details:"Two overhead fixtures are out in the P2 parking area, leaving the north stairwell entry dim in the evenings."},
  {id:1039,cat:"Cleaning",sub:"Trash removal",property:"Oakland Plaza",space:"Lobby",priority:"Low",status:"Resolved",assignee:"Priya Shah",created:"Jul 17",updated:"1d",ackAt:"Jul 17, 8:40 AM",details:"Overflowing bins in the main lobby needed pickup ahead of morning tenant traffic."},
  {id:1038,cat:"Security",sub:"Access card",property:"Cedar Point Offices",space:"Fl 1",priority:"Medium",status:"New",assignee:"Unassigned",created:"Jul 17",updated:"1d",ackAt:null,details:"A new hire needs an access card provisioned for the first-floor suite before their start date."},
  {id:1037,cat:"Exterior",sub:"Ice/snow removal",property:"The Beacon",space:"Main entrance",priority:"High",status:"In progress",assignee:"Tom Becker",created:"Jul 17",updated:"1d",ackAt:"Jul 17, 7:15 AM",details:"Ice is building up on the front entrance ramp; salt and a scrape requested before opening."},
  {id:1036,cat:"Elevator/Escalator",sub:"",property:"Market Street Tower",space:"Elevator B",priority:"High",status:"Acknowledged",assignee:"Dana Reyes",created:"Jul 16",updated:"2d",ackAt:"Jul 16, 2:10 PM",details:"Elevator B is making a grinding noise between floors 2 and 3. Taken out of service as a precaution pending inspection."},
  {id:1035,cat:"Furniture",sub:"Repair item",property:"Riverside Commons",space:"Fl 4 · Break room",priority:"Low",status:"Closed",assignee:"Priya Shah",created:"Jul 15",updated:"3d",ackAt:"Jul 15, 10:00 AM",details:"Broken chair in the fourth-floor break room was repaired and returned to service."}
];
let nextNum=1043;   // id given to the next ticket created

/* ----- Updates posted to work orders (shown in the dashboard feed and inside each ticket) ----- */
let updates=[
  {id:1,ticketId:1036,author:"Dana Reyes",text:"Inspector booked for tomorrow morning; keeping Elevator B out of service until then.",time:"2d"},
  {id:2,ticketId:1037,author:"Tom Becker",text:"Salted and scraped the front ramp. Will recheck at noon.",time:"1d"},
  {id:3,ticketId:1041,author:"Marcus Hale",text:"Thermostat confirmed dead — ordered a replacement, ETA Thursday.",time:"6h"},
  {id:4,ticketId:1042,author:"Dana Reyes",text:"Temporary tarp down over the northwest drain. Roofer scheduled for the permanent patch.",time:"2h"}
];
let nextUpdateId=5;

// Every ticket carries an attachments list (kept in memory only)
tickets.forEach(t=>{ t.attachments=[]; });

/* ----- Save / load ----- */
function saveState(){
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify({
      spaces:spaces, properties:properties, propMeta:propMeta,
      nextNum:nextNum, updates:updates, nextUpdateId:nextUpdateId,
      // attachments are temporary blob URLs, so leave them out
      tickets:tickets.map(t=>{ const c=Object.assign({},t); delete c.attachments; return c; })
    }));
  }catch(e){ /* storage blocked or full: the app still works, it just won't remember */ }
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORE_KEY); if(!raw) return;
    const s=JSON.parse(raw);
    if(s.spaces) spaces=s.spaces;
    if(s.properties) properties=s.properties;
    if(s.propMeta) propMeta=s.propMeta;
    if(s.nextNum) nextNum=s.nextNum;
    if(s.updates) updates=s.updates;
    if(s.nextUpdateId) nextUpdateId=s.nextUpdateId;
    if(s.tickets) tickets=s.tickets.map(t=>Object.assign({},t,{attachments:[]}));
  }catch(e){ /* corrupted data: fall back to the defaults above */ }
}
loadState();   // runs once as the script loads
