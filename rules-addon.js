// rules-addon.js — adds a simple Rules & Features Search panel and logic
(function(){
  function ensureEl(tag, attrs, parent){
    const el = document.createElement(tag);
    Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));
    (parent||document.body).appendChild(el);
    return el;
  }

  function panelHTML(){
    return `
    <section class="panel" id="search">
      <h2>Rules & Features Search</h2>
      <div class="controls">
        <label>Ruleset
          <select id="ruleset">
            <option value="2024">5e 2024 (SRD 5.2.1)</option>
            <option value="2014">5e 2014 (SRD 5.1)</option>
          </select>
        </label>
        <label>Keyword <input id="search-query" type="text" placeholder="bless, grapple, darkvision..."/></label>
        <label>Type
          <select id="search-type">
            <option value="any">Any</option>
            <option value="spell">Spell</option>
            <option value="condition">Condition</option>
            <option value="equipment">Equipment</option>
            <option value="rule">General Rule</option>
          </select>
        </label>
        <button id="btn-search">Search</button>
        <button class="secondary" id="btn-clear-search">Clear</button>
      </div>
      <div id="search-results" class="cards" aria-live="polite"></div>
      <p class="small">Uses local files in <code>/data</code>. You can replace them with full SRDs anytime.</p>
    </section>`;
  }

  function safe(s){ return String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function card(e){
    return `<div class="card">
      <div class="badge">${safe(e.type)}</div>
      <h4>${safe(e.title)}</h4>
      <p>${safe(e.body)}</p>
    </div>`;
  }

  async function readJSON(path){
    try{
      const r = await fetch(path);
      if(!r.ok) throw new Error("HTTP "+r.status);
      return await r.json();
    }catch(e){ return null; }
  }

  async function loadPack(ruleset){
    if(ruleset === "2014"){
      const d = await readJSON("data/srd_min_2014.json");
      if(d){
        const pack = [];
        (d.spells||[]).forEach(s=>pack.push({type:"spell", title:s.name||s.title, body:s.text||s.body||""}));
        (d.conditions||[]).forEach(c=>pack.push({type:"condition", title:c.name||c.title, body:c.text||c.body||""}));
        (d.rules||[]).forEach(r=>pack.push({type:"rule", title:r.name||r.title, body:r.text||r.body||""}));
        (d.equipment||[]).forEach(e=>pack.push({type:"equipment", title:e.name||e.title, body:e.text||e.body||""}));
        return pack;
      }
    }
    // default to 2024
    const d24 = await readJSON("data/srd_2024.json");
    if(d24){
      const pack = [];
      (d24.spells||[]).forEach(s=>pack.push({type:"spell", title:s.title||s.name, body:s.body||s.text||""}));
      (d24.conditions||[]).forEach(c=>pack.push({type:"condition", title:c.title||c.name, body:c.body||c.text||""}));
      (d24.rules||[]).forEach(r=>pack.push({type:"rule", title:r.title||r.name, body:r.body||r.text||""}));
      (d24.equipment||[]).forEach(e=>pack.push({type:"equipment", title:e.title||e.name, body:e.body||e.text||""}));
      return pack;
    }
    // final tiny fallback (built-in)
    return [
      {type:"spell", title:"Bless", body:"Add a d4 to attacks/saves (sample)."},
      {type:"condition", title:"Grappled", body:"Speed 0; ends if grappler is incapacitated (sample)."},
      {type:"rule", title:"Darkvision", body:"See in dim light as if bright (sample)."}
    ];
  }

  function doSearch(pack, q, type){
    q = (q||"").toLowerCase().trim();
    return pack.filter(e => (type==="any"||e.type===type) &&
      (e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)));
  }

  function ensurePanel(){
    if(!document.getElementById("search")){
      // prefer to place inside main.layout if present
      const main = document.querySelector("main.layout") || document.body;
      const div = document.createElement("div");
      div.innerHTML = panelHTML();
      main.appendChild(div.firstElementChild);
    }else if(!document.getElementById("search-results")){
      const panel = document.getElementById("search");
      const c = document.createElement("div");
      c.id = "search-results";
      c.className = "cards";
      c.setAttribute("aria-live","polite");
      panel.appendChild(c);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensurePanel();
    const $ = id => document.getElementById(id);
    const resultsHost = $("search-results");

    async function run(){
      const ruleset = $("ruleset")?.value || "2024";
      const type = $("search-type")?.value || "any";
      const q = $("search-query")?.value || "";
      const pack = await loadPack(ruleset);
      const items = doSearch(pack, q, type).slice(0, 100);
      resultsHost.innerHTML = items.map(card).join("");
    }

    $("btn-search")?.addEventListener("click", run);
    $("btn-clear-search")?.addEventListener("click", ()=>{
      if($("search-query")) $("search-query").value = "";
      resultsHost.innerHTML = "";
    });
  });
})(); 
