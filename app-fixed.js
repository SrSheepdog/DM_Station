// DM Station v3 — ruleset toggle, bigger monsters, dice roller, session log, VTT exports

// ---------- utils ----------
function rng(seed){ if(seed===undefined||seed===null||seed==='') return Math.random;
  let s=0; for(const c of String(seed)) s=(s*31 + c.charCodeAt(0))>>>0;
  return function(){ var t=(s+=0x6D2B79F5); t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}
function choice(arr,r=Math.random){ return arr[Math.floor(r()*arr.length)]; }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }
function $(id){ return document.getElementById(id); }
function download(filename, text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'})); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }

// ---------- pinboard / notes ----------
const PIN_KEY='dmstation_pins_v4';
function getPins(){ try{return JSON.parse(localStorage.getItem(PIN_KEY)||'[]')}catch{return[]} }
function savePins(p){ localStorage.setItem(PIN_KEY, JSON.stringify(p)); }
function pin(kind,text){ const p=getPins(); p.unshift({kind,text,at:new Date().toISOString()}); savePins(p); renderPins(); }
function renderPins(){ const host=$('pinboard-content'); const p=getPins(); host.innerHTML=''; for(const it of p){ const d=document.createElement('div'); d.className='card'; d.innerHTML=`<div class="badge">${it.kind}</div><pre>${it.text}</pre><div class="small">${new Date(it.at).toLocaleString()}</div>`; host.appendChild(d);} }

// ---------- names ----------
const NAMES={human:{any:{p:["Al","Bel","Ca","Dan","El","Fi","Jo","Ka","Li","Mo"],r:["na","bel","ra","ri","la","mi"],s:["an","en","ra","na","lia","lyn"]}},
elf:{any:{p:["Ae","Ela","Ila","Lae","Syl","Va"],r:["lë","rian","thir","van","reth"],s:["iel","ion","wen","eth","or"]}},
dwarf:{any:{p:["Bal","Dor","Kar","Mor","Tor"],r:["gra","drum","kil","rak"],s:["din","da","gorn","hild"]}},
halfling:{any:{p:["Ari","Beri","Cade","Dillo","Meri","Milo"],r:["bun","hill","vale","wick"],s:["foot","top","vale","wick","will"]}},
dragonborn:{any:{p:["Akra","Arj","Biri","Don","Ghesh","Kriv"],r:["ash","kyr","rhas","thys","zys"],s:["ar","ir","ys","ith","an"]}},
tiefling:{any:{p:["Aby","Bel","Cri","Da","Eri","Luc","Mor"],r:["zor","vash","xar","zra","zar","nys"],s:["a","is","on","or","ys","el"]}}};
function genNames(anc,sex,style,count,seed){ const r=rng(seed); const set=(NAMES[anc]||NAMES.human).any; const out=[]; for(let i=0;i<count;i++){ out.push(choice(set.p,r)+choice(set.r,r)+choice(set.s,r)); } return out; }

// ---------- shops ----------
function genShop(type='tavern',seed=null){ const r=rng(seed);
  const pat=choice(["The {adj} {beast}","The {color} {object}","{surname}'s {place}"],r);
  const lex={adj:["Sly","Crimson","Copper","Whispering"],beast:["Chimera","Stag","Kraken","Raven"],color:["Black","Green","Golden"],object:["Lantern","Tankard","Anvil","Moon"],surname:["Cole","Rook","Thorne","Highmoor"],place:["Inn","Rest","Hearth","Table"]};
  const name=pat.replace("{adj}",choice(lex.adj,r)).replace("{beast}",choice(lex.beast,r)).replace("{color}",choice(lex.color,r)).replace("{object}",choice(lex.object,r)).replace("{surname}",choice(lex.surname,r)).replace("{place}",choice(lex.place,r));
  const sign=`Sign: ${choice(["Faded","Carved","Painted"],r)} ${choice(["symbol","crest"],r)} of a ${choice(["stag","chimera","key","moon"],r)}.`; const owner=`Owner: ${choice(['Mirna "Cinder" Cole','Old Rook Merriweather','Tess Bracken'],r)}.`; const price=`Price Tier: ${choice(['$','$$','$$$'],r)}`; const rumor=`Rumor: ${choice(["a sunken bell","smugglers under the docks","a ghost on the road"],r)}.`; return `Name: ${name}\n${sign}\n${owner}\n${price}\n${rumor}`; }

// ---------- loot ----------
function genLoot(l=3,f="medium",seed=null){ const r=rng(seed); const gp=Math.floor(r()*100)+50; const sp=Math.floor(r()*200); const cons=["potion of healing","antitoxin","smoke vial","oil of slipperiness (vial)","scroll fragment"]; const roll=Math.floor(r()*20)+1; const magic=roll<(f==="high"?12:f==="low"?5:8)?[choice(["bag of holding","+1 weapon (any)","cloak of protection","wand of secrets"],r)]:[]; const parts=[`Coins: ${gp} gp, ${sp} sp`, `Consumables: ${choice(cons,r)}`]; if(magic.length) parts.push(`Magic: ${magic.join(", ")}`); return parts.join("\n"); }
function lootToRoll20(text){ return "Loot:\\n" + text.replace(/\n/g,"\\n"); }
function lootToFoundry(text){ return JSON.stringify({type:"loot", text}, null, 2); }

// ---------- NPCs ----------
const NPC={anc:["Human","Elf","Dwarf","Halfling","Dragonborn","Tiefling","Gnome","Half-Orc"],job:["Innkeeper","Guard","Merchant","Blacksmith","Healer","Scholar","Hunter","Smuggler","Sailor","Alchemist","Priest","Carpenter"],per:["cheerful","stoic","snarky","nervous","stern","curious","world-weary","pious","sarcastic","blunt"],quirk:["collects buttons","hums sea shanties","avoids eye contact","writes everything down","feeds stray cats","mispronounces names","always offers tea","superstitious about the moon"],goal:["pay off a secret debt","win a local contest","reopen the old mill","find a missing sibling","protect a relic","start a caravan","cure a strange illness","expose a corrupt official"],look:["ink-stained fingers","braided beard","scar across one cheek","elaborate tattoos","singed sleeves","fine boots","patched cloak","silver amulet"],line:['"You\\'re not from around here, are you?"','"Between you and me, the well runs deeper than folks think."','"Coin first, questions later."','"I saw lights in the ruin last night."']};
function genNPCs(anc="any",job="any",count=3,seed=null){ const r=rng(seed); const pick=a=>choice(a,r); const out=[]; for(let i=0;i<count;i++){ const A=anc==="any"?pick(NPC.anc):anc[0].toUpperCase()+anc.slice(1); const J=job==="any"?pick(NPC.job):job; const name=genNames(A.toLowerCase(),"any","default",1,Math.floor(r()*1e6))[0]; out.push(`Name: ${name} (${A} ${J})\nPersonality: ${pick(NPC.per)}; Quirk: ${pick(NPC.quirk)}\nGoal: ${pick(NPC.goal)}\nAppearance: ${pick(NPC.look)}\nLine: ${pick(NPC.line)}`); } return out.join("\n\n"); }

// ---------- Encounter Builder ----------
let MON=null;
async function loadMon(){ if(MON) return MON; const r=await fetch('data/monsters.json'); MON=await r.json(); return MON; }
function budget(size,level,diff){ const per={easy:50,medium:75,hard:100,deadly:125}[diff]||75; return size*level*per; }
function filterMon(list,f){ if(!f||f==='any') return list.slice(); return list.filter(m=>m.type===f); }
function buildEncounter(list,b){ const pool=list.slice().sort((a,b)=>a.xp-b.xp); const out=[]; let xp=0; const maxN=b<300?3:6; // simple greedy
  while(out.length<maxN && xp < b){ let pickIdx=-1; for(let i=pool.length-1;i>=0;i--){ if(xp+pool[i].xp<=b){ pickIdx=i; break; } } if(pickIdx===-1) pickIdx=0; out.push(pool[pickIdx]); xp+=pool[pickIdx].xp; }
  return {monsters:out,totalXP:xp};
}
function encToRoll20(enc){ const lines=enc.monsters.map(m=>`- ${m.name} (CR ${m.cr}, ${m.xp} XP)`); return `Encounter (Total XP ${enc.totalXP})\n`+lines.join("\n"); }
function encToFoundry(enc){ return JSON.stringify({type:"encounter", totalXP:enc.totalXP, monsters:enc.monsters}, null, 2); }

// ---------- Rules Search (2014 vs 2024) ----------
let SRD_CACHE={"2014":null,"2024":null};
async function fetchAllPages(url){ const out=[]; while(url){ const r=await fetch(url); if(!r.ok) throw new Error('fetch '+r.status); const d=await r.json(); if(Array.isArray(d)){ out.push(...d); break; } if(d.results) out.push(...d.results); url=d.next||null; } return out; }
async function loadSRD2014(){ const base='https://api.open5e.com';
  try{
    const [spells, conditions, sections] = await Promise.all([
      fetchAllPages(`${base}/v2/spells/?document__key=5esrd&limit=200`),
      fetchAllPages(`${base}/v2/conditions/?document__key=5esrd&limit=200`),
      fetchAllPages(`${base}/v1/sections/?document__slug=5esrd&limit=200`)
    ]);
    const pack=[];
    spells.forEach(s=>{ const level=(s.level??s.level_int??'').toString(); const school=(s.school&&(s.school.name||s.school))||''; const text=[s.desc,s.higher_level,s.range_text,s.duration,s.components,s.casting_time].filter(Boolean).join('\n\n'); pack.push({type:'spell', title:s.name, body:`Level ${level} ${school}\n\n${text}`, url:s.url||''}); });
    conditions.forEach(c=>{ const text=[c.desc,c.notes].filter(Boolean).join('\n\n'); pack.push({type:'condition', title:c.name||c.title, body:text, url:c.url||''}); });
    sections.forEach(sec=>{ const title=sec.name||sec.title||'Rules'; const text=[sec.desc,sec.text].filter(Boolean).join('\n\n'); pack.push({type:'rule', title, body:text, url:sec.url||''}); });
    return pack;
  }catch(e){
    console.warn('Open5e fetch failed; using local 2014 sample', e);
    const res=await fetch('data/srd_min_2014.json'); const d=await res.json(); const pack=[];
    (d.spells||[]).forEach(s=>pack.push({type:'spell', title:s.name||s.title, body:s.text||s.body||''}));
    (d.conditions||[]).forEach(c=>pack.push({type:'condition', title:c.name||c.title, body:c.text||c.body||''}));
    (d.rules||[]).forEach(r=>pack.push({type:'rule', title:r.name||r.title, body:r.text||r.body||''}));
    (d.equipment||[]).forEach(e=>pack.push({type:'equipment', title:e.name||e.title, body:e.text||e.body||''}));
    return pack;
  }
}
async function loadSRD2024(){ const res=await fetch('data/srd_2024.json'); const d=await res.json(); const pack=[];
  (d.spells||[]).forEach(s=>pack.push({type:'spell', title:s.title||s.name, body:s.body||s.text||'', url:s.url||''}));
  (d.conditions||[]).forEach(c=>pack.push({type:'condition', title:c.title||c.name, body:c.body||c.text||'', url:c.url||''}));
  (d.rules||[]).forEach(r=>pack.push({type:'rule', title:r.title||r.name, body:r.body||r.text||'', url:r.url||''}));
  (d.equipment||[]).forEach(e=>pack.push({type:'equipment', title:e.title||e.name, body:e.body||e.text||'', url:e.url||''}));
  return pack;
}
async function loadSRD(ruleset){ if(SRD_CACHE[ruleset]) return SRD_CACHE[ruleset]; SRD_CACHE[ruleset] = ruleset==='2024' ? await loadSRD2024() : await loadSRD2014(); return SRD_CACHE[ruleset]; }

// ---------- Dice Roller ----------
const ROLL_KEY='dmstation_rolls_v1';
function parseDice(expr){ const tokens = (expr||'').replace(/\s+/g,'').match(/([+-]?[^+-]+)/g); if(!tokens) return null; return tokens.map(t=>t.trim()); }
function rollTerm(term){ const m = term.match(/^([+-])?(\d*)d(\d+)|([+-]?\d+)$/i); if(!m) return {text:term,total:0}; if(m[4]!==undefined){ return {text:m[4], total: parseInt(m[4],10)}; } const sign = (m[1]==='-')?-1:1; const count = m[2]?parseInt(m[2],10):1; const sides=parseInt(m[3],10); const rolls=[]; let sum=0; for(let i=0;i<count;i++){ const r=Math.floor(Math.random()*sides)+1; rolls.push(r); sum+=r; } return {text:`${sign<0?'-':''}${count}d${sides}(${rolls.join(',')})`, total: sign*sum}; }
function doRoll(expr){ const parts = parseDice(expr||''); if(!parts) return {text:'Invalid roll', total:0}; let total=0; const pieces=[]; for(const p of parts){ const t=rollTerm(p); pieces.push(t.text); total+=t.total; } const out = `${expr} = ${pieces.join(' + ')} = **${total}**`; const hist = JSON.parse(localStorage.getItem(ROLL_KEY)||'[]'); hist.unshift({expr, out, at:new Date().toISOString()}); localStorage.setItem(ROLL_KEY, JSON.stringify(hist.slice(0,100))); return out; }
function renderRolls(){ const host=$('dice-output'); const hist=JSON.parse(localStorage.getItem(ROLL_KEY)||'[]'); host.textContent = hist.map(h=>`[${new Date(h.at).toLocaleTimeString()}] ${h.out}`).join('\n'); }
function clearRolls(){ localStorage.removeItem(ROLL_KEY); renderRolls(); }

// ---------- Rules search render ----------
function renderCard(e){ const safe = s => String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); const url = e.url?`<div class="small">${safe(e.url)}</div>`:''; return `<div class="card"><div class="badge">${safe(e.type)}</div><h4>${safe(e.title)}</h4>${url}<p>${safe(e.body)}</p></div>`; }

// ---------- wiring ----------
window.addEventListener('DOMContentLoaded', ()=>{
  // names
  $('btn-generate-names').addEventListener('click',()=>{ const anc=$('name-ancestry').value; const sex=$('name-sex').value; const style=$('name-style').value; const count=clamp(parseInt($('name-count').value||'5',10),1,50); const seed=$('name-seed').value; $('names-output').textContent=genNames(anc,sex,style,count,seed).join('\n'); });
  $('btn-copy-names').addEventListener('click',()=>{ const t=$('names-output').textContent||''; if(t) navigator.clipboard.writeText(t); });
  $('btn-pin-names').addEventListener('click',()=>{ const t=$('names-output').textContent||''; if(t) pin('Names', t); });

  // shops
  $('btn-generate-shop').addEventListener('click',()=>{ $('shop-output').textContent = genShop($('shop-type').value); });
  $('btn-copy-shop').addEventListener('click',()=>{ const t=$('shop-output').textContent||''; if(t) navigator.clipboard.writeText(t); });
  $('btn-pin-shop').addEventListener('click',()=>{ const t=$('shop-output').textContent||''; if(t) pin('Shop', t); });

  // loot
  $('btn-generate-loot').addEventListener('click',()=>{ const lvl=clamp(parseInt($('loot-level').value||'3',10),1,20); const freq=$('loot-magic').value; $('loot-output').textContent = genLoot(lvl,freq); });
  $('btn-copy-loot').addEventListener('click',()=>{ const t=$('loot-output').textContent||''; if(t) navigator.clipboard.writeText(t); });
  $('btn-pin-loot').addEventListener('click',()=>{ const t=$('loot-output').textContent||''; if(t) pin('Loot', t); });
  $('btn-export-loot-roll20').addEventListener('click',()=>{ const t=$('loot-output').textContent||''; if(t) download('loot-roll20.txt', lootToRoll20(t)); });
  $('btn-export-loot-foundry').addEventListener('click',()=>{ const t=$('loot-output').textContent||''; if(t) download('loot-foundry.json', lootToFoundry(t)); });

  // npc
  $('btn-generate-npc').addEventListener('click',()=>{ const anc=$('npc-ancestry').value; const job=$('npc-occupation').value; const n=clamp(parseInt($('npc-count').value||'3',10),1,20); $('npc-output').textContent = genNPCs(anc,job,n); });
  $('btn-copy-npc').addEventListener('click',()=>{ const t=$('npc-output').textContent||''; if(t) navigator.clipboard.writeText(t); });
  $('btn-pin-npc').addEventListener('click',()=>{ const t=$('npc-output').textContent||''; if(t) pin('NPC', t); });

  // encounter
  $('btn-build-encounter').addEventListener('click', async()=>{ const size=clamp(parseInt($('enc-party-size').value||'4',10),1,8); const lvl=clamp(parseInt($('enc-party-level').value||'3',10),1,20); const diff=$('enc-difficulty').value; const filt=$('enc-filter').value; const mons=filterMon(await loadMon(),filt); const b=budget(size,lvl,diff); const enc=buildEncounter(mons,b); const lines=enc.monsters.map(m=>`- ${m.name} (CR ${m.cr}, ${m.xp} XP)`); $('encounter-output').textContent = `Target XP ≈ ${b}\n${lines.join('\n')}\nTotal XP: ${enc.totalXP}`; });
  $('btn-copy-encounter').addEventListener('click',()=>{ const t=$('encounter-output').textContent||''; if(t) navigator.clipboard.writeText(t); });
  $('btn-pin-encounter').addEventListener('click',()=>{ const t=$('encounter-output').textContent||''; if(t) pin('Encounter', t); });
  $('btn-export-enc-roll20').addEventListener('click', async()=>{ const size=clamp(parseInt($('enc-party-size').value||'4',10),1,8); const lvl=clamp(parseInt($('enc-party-level').value||'3',10),1,20); const diff=$('enc-difficulty').value; const filt=$('enc-filter').value; const mons=filterMon(await loadMon(),filt); const b=budget(size,lvl,diff); const enc=buildEncounter(mons,b); download('encounter-roll20.txt', encToRoll20(enc)); });
  $('btn-export-enc-foundry').addEventListener('click', async()=>{ const size=clamp(parseInt($('enc-party-size').value||'4',10),1,8); const lvl=clamp(parseInt($('enc-party-level').value||'3',10),1,20); const diff=$('enc-difficulty').value; const filt=$('enc-filter').value; const mons=filterMon(await loadMon(),filt); const b=budget(size,lvl,diff); const enc=buildEncounter(mons,b); download('encounter-foundry.json', encToFoundry(enc)); });

  // quest
  $('btn-generate-quest').addEventListener('click',()=>{ const tone=$('quest-tone').value; const theme=$('quest-theme').value; const hooks=genQuests(tone,theme,3); $('quest-output').textContent = hooks.join('\n\n'); });
  $('btn-copy-quest').addEventListener('click',()=>{ const t=$('quest-output').textContent||''; if(t) navigator.clipboard.writeText(t); });
  $('btn-pin-quest').addEventListener('click',()=>{ const t=$('quest-output').textContent||''; if(t) pin('Quest', t); });

  // dice
  $('btn-roll').addEventListener('click',()=>{ const expr=$('dice-input').value||'1d20'; const out=doRoll(expr); renderRolls(); });
  $('btn-clear-rolls').addEventListener('click',()=>{ clearRolls(); });

  // rules
  $('btn-search').addEventListener('click', async()=>{ const ruleset=$('ruleset').value; const type=$('search-type').value; const q=($('search-query').value||'').trim().toLowerCase(); const data=await loadSRD(ruleset); const filtered=data.filter(e=>(type==='any'||e.type===type) && (e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q))); $('search-results').innerHTML = filtered.slice(0,120).map(renderCard).join(''); });
  $('btn-clear-search').addEventListener('click',()=>{ $('search-query').value=''; $('search-results').innerHTML=''; });

  // notes + session log export
  $('btn-add-note').addEventListener('click',()=>{ const v=$('note-input').value.trim(); if(!v) return; pin('Note', v); $('note-input').value=''; });
  $('btn-export-markdown').addEventListener('click',()=>{ const p=getPins(); const lines = ['# Session Log', '', `Date: ${new Date().toLocaleString()}`, '']; for(const it of p){ lines.push(`## ${it.kind}`, '', it.text, '', `*Added:* ${new Date(it.at).toLocaleString()}`, ''); } download(`session-log-${new Date().toISOString().slice(0,10)}.md`, lines.join('\n')); });

  renderPins(); renderRolls();
});

// ---------- Quests ----------
function genQuests(tone='any',theme='any',n=3){ const tones = tone==='any'?['Heroic','Grim','Whimsical','Mysterious']:[tone]; const themes = theme==='any'?['Undead','Political','Heist','Wilderness','Arcane']:[theme]; const who=['a desperate priest','a wounded messenger','a retired adventurer','a suspicious noble','a frightened child','a cursed druid']; const task=['recover','deliver','destroy','protect','investigate','steal']; const thing=['a moonstone idol','encoded letters','a haunted blade','a map fragment','a sealed coffer','a lichbone ring']; const where=['beneath the old abbey','in the flooded caverns','at the city archives','within a dragon’s hoard','in the fogbound marsh','under the ruined keep']; const twist=['time is running out','someone on your side is a traitor','it awakens something worse','another faction is racing you','the item is a fake','the client is the true villain']; const out=[]; for(let i=0;i<n;i++){ out.push(`[${choice(tones)} • ${choice(themes)}] ${choice(who)} asks you to ${choice(task)} ${choice(thing)} ${choice(where)}, but ${choice(twist)}.`); } return out; }
