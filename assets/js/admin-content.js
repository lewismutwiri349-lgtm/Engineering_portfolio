/* Master content manager for News, Events and Achievements. */
(function () {
  "use strict";

  const SOURCES = {
    news: { path: "data/news.json", type: "array", listId: "newsAdminList", statusId: "newsAdminStatus", countId: "newsAdminCount", statId: "statNews", navId: "navNewsCount", title: "News" },
    events: { path: "data/events.json", type: "array", listId: "eventsAdminList", statusId: "eventsAdminStatus", countId: "eventsAdminCount", statId: "statEvents", navId: "navEventsCount", title: "Events" },
    achievements: { path: "data/achievements.json", type: "object", listId: "achievementsAdminList", statusId: "achievementsAdminStatus", countId: "achievementsAdminCount", statId: "statAchievements", navId: "navAchievementsCount", title: "Achievements" }
  };
  const state = { news: [], events: [], achievements: [], dirty: { news:false, events:false, achievements:false } };
  const loaded = { news:false, events:false, achievements:false };
  const esc = (v) => { const d=document.createElement("div"); d.textContent=v ?? ""; return d.innerHTML; };
  const slug = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const arr = (v) => Array.isArray(v) ? v : String(v || "").split(/\r?\n|,/).map(s=>s.trim()).filter(Boolean);
  const pairs = (v) => String(v||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("|"); return i<0?null:{label:x.slice(0,i).trim(),url:x.slice(i+1).trim()};}).filter(Boolean);
  const pairText = (a) => (a||[]).map(x=>`${x.label||""} | ${x.url||""}`).join("\n");

  function source(kind){ return SOURCES[kind]; }
  function setStatus(kind,msg,type=""){ const s=document.getElementById(source(kind).statusId); if(s){s.dataset.state=type;s.textContent=msg;} document.getElementById("adminLastAction")?.replaceChildren(document.createTextNode(msg)); }
  function normalize(kind,data){
    if(kind === "achievements") return data && Array.isArray(data.achievements) ? data.achievements : (Array.isArray(data) ? data : []);
    return Array.isArray(data) ? data : [];
  }
  async function load(kind){
    try{
      const res=await fetch(source(kind).path,{cache:"no-store"}); if(!res.ok) throw new Error(`HTTP ${res.status}`);
      state[kind]=normalize(kind,await res.json()); state.dirty[kind]=false; loaded[kind]=true; render(kind); setStatus(kind,`Loaded ${state[kind].length} ${source(kind).title.toLowerCase()}.`); updateStats();
    }catch(e){
      setStatus(kind,`Couldn't load ${source(kind).path}: ${e.message}. Use GitHub Sync or add the file to the site.`,"error");
      render(kind);
    }
  }
  function blank(kind){
    const id=`${kind.slice(0,-1)}-${Date.now()}`;
    if(kind==="news") return {id,title:"",date:new Date().toISOString().slice(0,10),category:"Engineering Update",summary:"",featured:false,content:"",image:""};
    if(kind==="events") return {id,title:"",date:new Date().toISOString().slice(0,10),time:"",location:"",description:"",type:"Workshop",status:"Upcoming",registrationUrl:"",image:""};
    return {id,title:"",category:"Certificate",organization:"",date:"",description:"",skills:[],thumbnail:"",documentUrl:"",featured:false,displayOrder:state.achievements.length+1};
  }
  function fields(kind,item){
    if(kind==="news") return `
      <label>ID / slug<input class="achievement-input" data-f="id" value="${esc(item.id)}"></label>
      <label>Title<input class="achievement-input" data-f="title" value="${esc(item.title)}"></label>
      <label>Date<input class="achievement-input" data-f="date" type="date" value="${esc(item.date)}"></label>
      <label>Category<input class="achievement-input" data-f="category" value="${esc(item.category)}" placeholder="Engineering Simulation"></label>
      <label class="admin-check"><input type="checkbox" data-f="featured" ${item.featured?"checked":""}> Featured on homepage</label>
      <label class="full">Summary<textarea class="achievement-textarea" data-f="summary" rows="3">${esc(item.summary)}</textarea></label>
      <label class="full">Article / full content<textarea class="achievement-textarea" data-f="content" rows="7">${esc(item.content)}</textarea></label>
      <label class="full">Image path<input class="achievement-input" data-f="image" value="${esc(item.image)}" placeholder="assets/images/...jpg"></label>`;
    if(kind==="events") return `
      <label>ID / slug<input class="achievement-input" data-f="id" value="${esc(item.id)}"></label>
      <label>Event title<input class="achievement-input" data-f="title" value="${esc(item.title)}"></label>
      <label>Date<input class="achievement-input" data-f="date" type="date" value="${esc(item.date)}"></label>
      <label>Time<input class="achievement-input" data-f="time" value="${esc(item.time)}" placeholder="14:00–16:00"></label>
      <label>Event type<input class="achievement-input" data-f="type" value="${esc(item.type)}" placeholder="Conference / Workshop"></label>
      <label>Status<select class="achievement-select" data-f="status"><option ${item.status==="Upcoming"?"selected":""}>Upcoming</option><option ${item.status==="Past"?"selected":""}>Past</option><option ${item.status==="Cancelled"?"selected":""}>Cancelled</option></select></label>
      <label>Location<input class="achievement-input" data-f="location" value="${esc(item.location)}"></label>
      <label>Registration / external URL<input class="achievement-input" data-f="registrationUrl" value="${esc(item.registrationUrl)}" placeholder="https://..."></label>
      <label class="full">Description<textarea class="achievement-textarea" data-f="description" rows="6">${esc(item.description)}</textarea></label>
      <label class="full">Image path<input class="achievement-input" data-f="image" value="${esc(item.image)}"></label>`;
    return `
      <label>ID / slug<input class="achievement-input" data-f="id" value="${esc(item.id)}"></label>
      <label>Title<input class="achievement-input" data-f="title" value="${esc(item.title)}"></label>
      <label>Category<input class="achievement-input" data-f="category" value="${esc(item.category)}"></label>
      <label>Organization / issuer<input class="achievement-input" data-f="organization" value="${esc(item.organization || item.issuer)}"></label>
      <label>Date<input class="achievement-input" data-f="date" value="${esc(item.date)}" placeholder="2026-08"></label>
      <label>Display order<input class="achievement-input" data-f="displayOrder" type="number" value="${esc(item.displayOrder||1)}"></label>
      <label class="admin-check"><input type="checkbox" data-f="featured" ${item.featured?"checked":""}> Featured</label>
      <label class="full">Description<textarea class="achievement-textarea" data-f="description" rows="5">${esc(item.description)}</textarea></label>
      <label class="full">Skills<input class="achievement-input" data-f="skills" value="${esc((item.skills||[]).join(", "))}" placeholder="SolidWorks, GD&T, CFD"></label>
      <label>Thumbnail path<input class="achievement-input" data-f="thumbnail" value="${esc(item.thumbnail)}"></label>
      <label>Certificate / document URL<input class="achievement-input" data-f="documentUrl" value="${esc(item.documentUrl || item.certificateUrl)}"></label>`;
  }
  function render(kind){
    const list=document.getElementById(source(kind).listId); if(!list) return;
    const items=state[kind];
    document.getElementById(source(kind).countId).textContent=`${items.length} item${items.length===1?"":"s"}`;
    if(!items.length){ list.innerHTML=`<div class="admin-empty"><strong>No ${source(kind).title.toLowerCase()} yet.</strong><p>Use “New ${kind==='news'?'News Item':kind==='events'?'Event':'Achievement'}” to create the first one.</p></div>`; return; }
    list.innerHTML=items.map((item,i)=>`<article class="admin-editor-card ${item.featured?'is-featured':''}" data-kind="${kind}" data-index="${i}">
      <div class="admin-editor-card__header"><div><span class="admin-panel-badge">${esc(item.category || item.type || 'Entry')}</span><h3>${esc(item.title || `Untitled ${source(kind).title}`)}</h3></div><div class="admin-editor-card__actions"><button type="button" class="btn-secondary" data-act="up" ${i===0?'disabled':''}>↑</button><button type="button" class="btn-secondary" data-act="down" ${i===items.length-1?'disabled':''}>↓</button><button type="button" class="btn-secondary" data-act="duplicate">Duplicate</button><button type="button" class="btn-secondary" data-act="delete">Remove</button></div></div>
      <div class="admin-form-grid">${fields(kind,item)}</div>
      <div class="admin-editor-footer"><span class="achievement-admin-status" data-card-status></span></div>
    </article>`).join("");
  }
  function updateStats(){
    const map={projects:["statProjects","navProjectsCount"],news:["statNews","navNewsCount"],events:["statEvents","navEventsCount"],achievements:["statAchievements","navAchievementsCount"]};
    Object.entries(map).forEach(([k,ids])=>{const n=k==="projects"?document.querySelectorAll("#projectAdminList .achievement-admin-item").length:state[k].length; ids.forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=n;});});
  }
  function markDirty(kind){state.dirty[kind]=true;setStatus(kind,"Unsaved local changes — publish when ready.");}
  function wireList(kind){
    const list=document.getElementById(source(kind).listId); if(!list)return;
    list.addEventListener("input",e=>{
      const card=e.target.closest("[data-kind]"); if(!card)return; const item=state[kind][Number(card.dataset.index)]; const f=e.target.dataset.f;if(!item||!f)return;
      if(e.target.type==="checkbox") item[f]=e.target.checked; else if(f==="skills") item[f]=arr(e.target.value); else if(f==="displayOrder") item[f]=Number(e.target.value)||0; else item[f]=e.target.value; markDirty(kind);
    });
    list.addEventListener("change",e=>{const card=e.target.closest("[data-kind]");if(!card)return;const item=state[kind][Number(card.dataset.index)];const f=e.target.dataset.f;if(!item||!f)return;if(e.target.type==="checkbox")item[f]=e.target.checked;else item[f]=e.target.value;markDirty(kind);render(kind);});
    list.addEventListener("click",e=>{
      const btn=e.target.closest("button[data-act]");if(!btn)return;const card=btn.closest("[data-kind]");const i=Number(card.dataset.index);const act=btn.dataset.act;
      if(act==="delete"){if(!confirm(`Remove this ${kind.slice(0,-1)} from the working list?`))return;state[kind].splice(i,1);markDirty(kind);render(kind);return;}
      if(act==="duplicate"){const copy=JSON.parse(JSON.stringify(state[kind][i]));copy.id=slug(copy.title||copy.id)+"-copy";state[kind].splice(i+1,0,copy);markDirty(kind);render(kind);return;}
      if(act==="up"&&i>0){[state[kind][i-1],state[kind][i]]=[state[kind][i],state[kind][i-1]];markDirty(kind);render(kind);return;}
      if(act==="down"&&i<state[kind].length-1){[state[kind][i+1],state[kind][i]]=[state[kind][i],state[kind][i+1]];markDirty(kind);render(kind);return;}
    });
  }
  function add(kind){state[kind].push(blank(kind));markDirty(kind);render(kind);document.querySelector(`#${source(kind).listId} .admin-editor-card:last-child`)?.scrollIntoView({behavior:"smooth",block:"center"});}
  function payload(kind){return kind==="achievements"?{achievements:state[kind]}:state[kind];}
  function download(kind){const blob=new Blob([JSON.stringify(payload(kind),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=source(kind).path.split("/").pop();a.click();URL.revokeObjectURL(a.href);setStatus(kind,"JSON exported successfully.","success");}
  async function publish(kind){
    if(!window.GitHubSync){setStatus(kind,"GitHub Sync is not loaded.","error");return;}
    try{setStatus(kind,`Publishing ${state[kind].length} ${source(kind).title.toLowerCase()}…`);await window.GitHubSync.commitFile(source(kind).path,JSON.stringify(payload(kind),null,2),`Update ${source(kind).title}`);state.dirty[kind]=false;setStatus(kind,`${source(kind).title} published successfully. The site will redeploy after the GitHub commit.`,"success");}catch(e){setStatus(kind,`Publish failed — your local edits are still here. ${e.message}`,"error");}
  }
  function initTabs(){
    const activate=tab=>{document.querySelectorAll("[data-admin-panel]").forEach(p=>p.classList.toggle("is-active",p.dataset.adminPanel===tab));document.querySelectorAll("[data-admin-tab]").forEach(b=>b.classList.toggle("is-active",b.dataset.adminTab===tab));};
    document.addEventListener("click",e=>{const b=e.target.closest("[data-admin-tab]");if(!b)return;activate(b.dataset.adminTab);if(b.dataset.adminTab!=="sync"&&b.dataset.adminTab!=="help"&&!loaded[b.dataset.adminTab])load(b.dataset.adminTab);});
  }
  function init(){
    initTabs();
    Object.keys(SOURCES).forEach(kind=>{wireList(kind);load(kind);});
    document.querySelectorAll("[data-content-add]").forEach(b=>b.addEventListener("click",()=>add(b.dataset.contentAdd)));
    document.querySelectorAll("[data-content-load]").forEach(b=>b.addEventListener("click",()=>load(b.dataset.contentLoad)));
    document.querySelectorAll("[data-content-export]").forEach(b=>b.addEventListener("click",()=>download(b.dataset.contentExport)));
    document.querySelectorAll("[data-content-push]").forEach(b=>b.addEventListener("click",()=>publish(b.dataset.contentPush)));
    const dot=document.getElementById("adminConnectionDot");const status=document.getElementById("adminConnectionStatus");
    try{const cfg=JSON.parse(localStorage.getItem("gh-sync-config")||"{}");if(cfg.token&&cfg.owner&&cfg.repo){dot?.classList.add("is-connected");if(status)status.textContent=`GitHub: ${cfg.owner}/${cfg.repo}`;}else{dot?.classList.add("is-offline");if(status)status.textContent="GitHub not configured — local editing available";}}catch(e){dot?.classList.add("is-offline");}
    setTimeout(updateStats,300);
  }
  document.addEventListener("DOMContentLoaded",init);
  window.AdminContent={reload:load,publish,exportData:download};
})();
