// App with ruleset switch (2014 via Open5e, 2024 via local JSON)

function seededRandom(seed){ if(seed===undefined||seed===null||seed==="") return Math.random;
  let s = 0; const str = String(seed); for(let i=0;i<str.length;i++) s = (s*31 + str.charCodeAt(i)) >>> 0;
  return function(){ var t = (s += 0x6D2B79F5); t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function choice(arr,rng=Math.random){ return arr[Math.floor(rng()*arr.length)]; }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

const NAME_TEMPLATES = {
  human:{ any:{ prefix:["Al","Bel","Ca","Dan","El","Fi","Jo","Ka","Li","Mo"], root:["na","bel","ra","ri","la","mi"], suffix:["an","en","ra","na","lia","lyn"] } },
  elf:{ any:{ prefix:["Ae","Ela","Ila","Lae","Syl","Va"], root:["lë","rian","thir","van","reth"], suffix:["iel","ion","wen","eth","or"] } },
  dwarf:{ any:{ prefix:["Bal","Dor","Kar","Mor","Tor"], root:["gra","drum","kil","rak"], suffix:["din","da","gorn","hild"] } },
  halfling:{ any:{ prefix:["Ari","Beri","Cade","Dillo","Meri","Milo"], root:["bun","hill","vale","wick"], suffix:["foot","top","vale","wick","will"] } },
  dragonborn:{ any:{ prefix:["Akra","Arj","Biri","Don","Ghesh","Kriv"], root:["ash","kyr","rhas","thys","zys"], suffix:["ar","ir","ys","ith","an"] } },
  tiefling:{ any:{ prefix:["Aby","Bel","Cri","Da","Eri","Luc","Mor"], root:["zor","vash","xar","zra","zar","nys"], suffix:["a","is","on","or","ys","el"] } }
};
function generateName(ancestry,sex="any",style="default",count=5,seed=null){
  const rng = seededRandom(seed); const set = (NAME_TEMPLATES[ancestry]||NAME_TEMPLATES.human).any;
  const names=[]; for(let i=0;i<count;i++){ names.push(choice(set.prefix,rng)+choice(set.root,rng)+choice(set.suffix,rng)); } return names;
}

function generateShop(type="tavern", seed=null){
  const rng = seededRandom(seed);
  const patterns = ["The {adj} {beast}","The {color} {object}","{surname}'s {place}"];
  const lex = { adj:["Sly","Crimson","Copper","Whispering"], beast:["Chimera","Stag","Kraken","Raven"],
    color:["Black","Green","Golden"], object:["Lantern","Tankard","Anvil","Moon"],
    surname:["Cole","Rook","Thorne","Highmoor"], place:["Inn","Rest","Hearth","Table"] };
  const pat = choice(patterns,rng);
  const name = pat.replace("{adj}",choice(lex.adj,rng)).replace("{beast}",choice(lex.beast,rng))
                  .replace("{color}",choice(lex.color,rng)).replace("{object}",choice(lex.object,rng))
                  .replace("{surname}",choice(lex.surname,rng)).replace("{place}",choice(lex.place,rng));
  const sign = `Sign: ${choice(["Faded","Carved","Painted"],rng)} ${choice(["symbol","crest"],rng)} of a ${choice(["stag","chimera","key","moon"],rng)}.`;
  const owner = `Owner: ${choice(["Mirna \"Cinder\" Cole","Old Rook Merriweather","Tess Bracken"],rng)}.`;
  const price = `Price Tier: ${choice(["$","$$","$$$"],rng)}`;
  const rumor = `Rumor: ${choice(["a sunken bell","smugglers under the docks","a ghost on the road"],rng)}.`;
  return `Name: ${name}\n${sign}\n${owner}\n${price}\n${rumor}`;
}

function generateLoot(avgLevel=3, magicFreq="medium", seed=null){
  const rng = seededRandom(seed);
  const coinsGp = Math.floor(rng()*100)+50; const coinsSp = Math.floor(rng()*200);
  const consumables = ["potion of healing","antitoxin","smoke vial"];
  const magicRoll = Math.floor(rng()*20)+1; const magic = magicRoll < (magicFreq==="high"?12:magicFreq==="low"?5:8) ? ["bag of holding"] : [];
  const parts = [`Coins: ${coinsGp} gp, ${coinsSp} sp`,`Consumables: ${choice(consumables,rng)}`];
  if (magic.length) parts.push(`Magic: ${magic.join(", ")}`);
  return parts.join("\n");
}

// -------- SRD loader with ruleset switch --------
let SRD_CACHE = { "2014": null, "2024": null };

async function fetchAllPages(url){
  const out=[]; while(url){ const r=await fetch(url); if(!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    const d=await r.json(); if (Array.isArray(d)) { out.push(...d); break; } if (d.results) out.push(...d.results); url=d.next||null; }
  return out;
}

async function loadSRD2014(){
  const base = "https://api.open5e.com";
  try {
    const [spells, conditions, sections] = await Promise.all([
      fetchAllPages(`${base}/v2/spells/?document__key=5esrd&limit=200`),
      fetchAllPages(`${base}/v2/conditions/?document__key=5esrd&limit=200`),
      fetchAllPages(`${base}/v1/sections/?document__slug=5esrd&limit=200`)
    ]);
    const pack = [];
    spells.forEach(s=>{
      const level = (s.level ?? s.level_int ?? '').toString();
      const school = (s.school && (s.school.name || s.school)) || '';
      const text = [s.desc, s.higher_level, s.range_text, s.duration, s.components, s.casting_time].filter(Boolean).join('\n\n');
      pack.push({ type:'spell', title:s.name, body:`Level ${level} ${school}\n\n${text}`, url:s.url||'' });
    });
    conditions.forEach(c=>{ const text = [c.desc, c.notes].filter(Boolean).join('\n\n'); pack.push({ type:'condition', title:c.name||c.title, body:text, url:c.url||'' }); });
    sections.forEach(sec=>{ const title = sec.name||sec.title||'Rules'; const text = [sec.desc, sec.text].filter(Boolean).join('\n\n'); pack.push({ type:'rule', title, body:text, url:sec.url||'' }); });
    return pack;
  } catch (e) {
    console.warn("Open5e 2014 fetch failed; using local sample", e);
    const res = await fetch('data/srd_min_2014.json'); const d = await res.json();
    const pack=[];
    (d.spells||[]).forEach(s=>pack.push({type:'spell', title:s.name||s.title||'Spell', body:s.text||s.body||'', url:''}));
    (d.conditions||[]).forEach(c=>pack.push({type:'condition', title:c.name||c.title||'Condition', body:c.text||c.body||'', url:''}));
    (d.rules||[]).forEach(r=>pack.push({type:'rule', title:r.name||r.title||'Rule', body:r.text||r.body||'', url:''}));
    (d.equipment||[]).forEach(e=>pack.push({type:'equipment', title:e.name||e.title||'Equipment', body:e.text||e.body||'', url:''}));
    return pack;
  }
}

async function loadSRD2024(){
  const res = await fetch('data/srd_2024.json');
  const d = await res.json();
  const pack=[];
  (d.spells||[]).forEach(s=>pack.push({type:'spell', title:s.title||s.name, body:s.body||s.text||'', url:s.url||''}));
  (d.conditions||[]).forEach(c=>pack.push({type:'condition', title:c.title||c.name, body:c.body||c.text||'', url:c.url||''}));
  (d.rules||[]).forEach(r=>pack.push({type:'rule', title:r.title||r.name, body:r.body||r.text||'', url:r.url||''}));
  (d.equipment||[]).forEach(e=>pack.push({type:'equipment', title:e.title||e.name, body:e.body||e.text||'', url:e.url||''}));
  return pack;
}

async function loadSRD(ruleset){
  if (SRD_CACHE[ruleset]) return SRD_CACHE[ruleset];
  SRD_CACHE[ruleset] = ruleset === "2024" ? await loadSRD2024() : await loadSRD2014();
  return SRD_CACHE[ruleset];
}

function renderCard(e){
  const safe = (s)=> String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return `<div class="card"><div class="badge">${safe(e.type)}</div><h4>${safe(e.title)}</h4><p>${safe(e.body)}</p></div>`;
}

async function doSearch(){
  const ruleset = document.getElementById("ruleset").value;
  const type = document.getElementById("search-type").value;
  const q = (document.getElementById("search-query").value||"").trim().toLowerCase();
  const data = await loadSRD(ruleset);
  const filtered = data.filter(e => (type==="any" || e.type===type) && (e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)));
  document.getElementById("search-results").innerHTML = filtered.slice(0, 100).map(renderCard).join("");
}

// Pinboard & wiring
const PIN_KEY = "dmstation_pins_v2";
function loadPins(){ try{return JSON.parse(localStorage.getItem(PIN_KEY)||"[]")}catch{return[]} }
function savePins(p){ localStorage.setItem(PIN_KEY, JSON.stringify(p)); }
function renderPins(){ const host=document.getElementById("pinboard-content"); const pins=loadPins(); host.innerHTML=""; for(const p of pins){ const d=document.createElement("div"); d.className="pin"; d.innerHTML=`<div class="badge">${p.kind}</div><pre>${p.text}</pre>`; host.appendChild(d);} }
function makePin(kind,text){ const pins=loadPins(); pins.unshift({kind,text,at:Date.now()}); savePins(pins); renderPins(); }

window.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("btn-generate-names").addEventListener("click", ()=>{
    const anc=document.getElementById("name-ancestry").value, sex=document.getElementById("name-sex").value, style=document.getElementById("name-style").value;
    const count = clamp(parseInt(document.getElementById("name-count").value||"5",10),1,50); const seed=document.getElementById("name-seed").value;
    document.getElementById("names-output").textContent = generateName(anc,sex,style,count,seed).join("\n");
  });
  document.getElementById("btn-copy-names").addEventListener("click", ()=>{ const t=document.getElementById("names-output").textContent||""; if(t) navigator.clipboard.writeText(t); });
  document.getElementById("btn-pin-names").addEventListener("click", ()=>{ const t=document.getElementById("names-output").textContent||""; if(t) makePin("Names",t); });

  document.getElementById("btn-generate-shop").addEventListener("click", ()=>{ document.getElementById("shop-output").textContent = generateShop(document.getElementById("shop-type").value); });
  document.getElementById("btn-copy-shop").addEventListener("click", ()=>{ const t=document.getElementById("shop-output").textContent||""; if(t) navigator.clipboard.writeText(t); });
  document.getElementById("btn-pin-shop").addEventListener("click", ()=>{ const t=document.getElementById("shop-output").textContent||""; if(t) makePin("Shop",t); });

  document.getElementById("btn-generate-loot").addEventListener("click", ()=>{
    const lvl=clamp(parseInt(document.getElementById("loot-level").value||"3",10),1,20);
    const freq=document.getElementById("loot-magic").value;
    document.getElementById("loot-output").textContent = generateLoot(lvl,freq);
  });
  document.getElementById("btn-copy-loot").addEventListener("click", ()=>{ const t=document.getElementById("loot-output").textContent||""; if(t) navigator.clipboard.writeText(t); });
  document.getElementById("btn-pin-loot").addEventListener("click", ()=>{ const t=document.getElementById("loot-output").textContent||""; if(t) makePin("Loot",t); });

  document.getElementById("btn-search").addEventListener("click", doSearch);
  document.getElementById("btn-clear-search").addEventListener("click", ()=>{ document.getElementById("search-query").value=""; document.getElementById("search-results").innerHTML=""; });

  renderPins();
});
