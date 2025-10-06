// DM Station — all client-side, no build step.
// Data + deterministic RNG + generators + minimal keyword search + pinboard.

// ---------- Utilities ----------
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function seededRandom(seed) {
  if (!seed && seed !== 0) return Math.random;
  let s = 0;
  if (typeof seed === "number" && Number.isFinite(seed)) s = seed;
  else {
    const str = String(seed);
    for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  }
  return mulberry32(s);
}

function choice(arr, rng=Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedChoice(items, weights, rng=Math.random) {
  const total = weights.reduce((a,b)=>a+b,0);
  let r = rng() * total;
  for (let i=0;i<items.length;i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ---------- Name templates ----------
const NAME_TEMPLATES = {
  elf: {
    female: {
      prefix: ["Ae","Ari","Ela","Eli","Ila","Lae","Lia","Syl","Tha","Va"],
      root:   ["lë","rian","thir","van","reth","thea","lith","nys","fina","myr"],
      suffix: ["iel","ia","wen","eth","iel","a","iel","wyn","riel","is"],
      style: {
        noble: { suffix: ["iel","wen","riel","thae"] },
        rough: { prefix: ["Ka","Sha","Za"], root: ["dran","vrin","kar"], suffix: ["a","eth","is"] },
        mystic:{ prefix: ["Aë","Eä","Ië","Ló"], root: ["thir","lan","riel","vë"], suffix: ["ë","iel","wen"] }
      }
    },
    male: {
      prefix: ["Ae","Ela","Ila","Lae","Tha","Var","Cal","Fin","Gal","Lor"],
      root:   ["dhor","rian","thir","van","ril","las","thel","vyr","nor","thur"],
      suffix: ["ion","or","ir","ion","as","el","en","ion","or","ion"],
      style: {
        noble: { suffix: ["ion","ar","elor"] },
        rough: { prefix: ["Ka","Tor","Vor"], root: ["dran","vrin","kar"], suffix: ["or","ar","en"] },
        mystic:{ prefix: ["Aë","Eä","Ië"], root: ["thir","lan","riel"], suffix: ["ion","or","en"] }
      }
    },
    any: { prefix: ["Ae","Ela","Ila","Lae","Syl","Va"], root: ["lë","rian","thir","van","reth"], suffix: ["iel","ion","wen","eth","or"] }
  },
  dwarf: {
    female: {
      prefix: ["Bal","Bru","Dor","Hel","Kar","Mor","Tor","Vis"],
      root:   ["ga","gra","kan","kil","mor","dri","run","bryn"],
      suffix: ["da","dis","dra","grin","hild","lin","lynn","ryn"],
      style: { noble: { suffix: ["hild","grun","lynn"] }, rough: { prefix: ["Gr","Kr","Th"], root: ["grom","kark","drum"] } }
    },
    male: {
      prefix: ["Bal","Bru","Dor","Gim","Har","Kar","Mor","Tor"],
      root:   ["grim","gran","garn","dri","drum","kil","rak","rum"],
      suffix: ["din","don","dr","gar","gorn","in","ar","son"],
      style: { noble: { suffix: ["din","gorn","ar"] }, rough: { prefix: ["Gr","Kr","Th"], root: ["grom","kark","drum"] } }
    },
    any: { prefix: ["Bal","Dor","Kar","Mor","Tor"], root: ["gra","drum","kil","rak"], suffix: ["din","da","gorn","hild"] }
  },
  human: {
    female: {
      prefix: ["An","Bel","Ca","Da","El","Fi","Jo","Ka","Li","Mo","Na","Ro","Sa","Ta"],
      root:   ["na","bel","ra","ri","la","mi","ve","sa","ri","na"],
      suffix: ["ra","na","lia","sa","ra","lyn","beth","ette","ia","elle"],
      style: { noble: { suffix: ["lia","elle","beth"] }, rough: { suffix: ["ra","na"] } }
    },
    male: {
      prefix: ["Al","Ben","Cor","Dan","Ed","Fa","Jon","Kal","Leo","Mar","Nik","Rob","Sam","Tor"],
      root:   ["an","cor","dan","ed","mar","nik","rob","sam","tor","leo"],
      suffix: ["an","en","el","ar","son","us","o","io","as","or"],
      style: { noble: { suffix: ["an","ar","el"] }, rough: { suffix: ["son","or"] } }
    },
    any: { prefix: ["Al","Bel","Ca","Dan","El","Fi","Jo","Ka","Li","Mo"], root: ["na","bel","ra","ri","la","mi"], suffix: ["an","en","ra","na","lia","lyn"] }
  },
  halfling: {
    female: {
      prefix: ["Ari","Bel","Cora","Dora","Eri","Fay","Gwen","Lina","Meri","Nora"],
      root:   ["da","lia","mira","nora","pina","ri","syl","tea","wyn","yra"],
      suffix: ["bun","dale","foot","hill","pipe","top","vale","wick","will","wyn"],
      style: { noble: { suffix: ["vale","wick","will"] } }
    },
    male: {
      prefix: ["Alto","Beri","Cade","Dillo","Eldo","Fosco","Garri","Hugo","Milo","Pere"],
      root:   ["bun","dale","foot","hill","pipe","top","vale","wick","will","wood"],
      suffix: ["foot","hill","top","pipe","vale","wick","will","wood","brook","mere"]
    },
    any: { prefix: ["Ari","Beri","Cade","Dillo","Meri","Milo"], root: ["bun","hill","vale","wick"], suffix: ["foot","top","vale","wick","will"] }
  },
  dragonborn: {
    female: {
      prefix: ["Akra","Biri","Dreya","Eriza","Kava","Lia","Mish","Nala","Rai","Sora"],
      root:   ["ash","dri","kyr","mir","nys","rhas","saj","thys","vara","zys"],
      suffix: ["aa","ara","i","ira","ys","yssa","ash","ith","ara","ys"],
      style: { mystic: { root: ["kyr","rhas","thys","zys"] } }
    },
    male: {
      prefix: ["Arj","Bal","Don","Ghesh","Hes","Kriv","Med","Nad","Rai","Tar"],
      root:   ["ash","dri","kyr","mir","rhas","saj","thys","vara","zys","kor"],
      suffix: ["aan","ak","ar","ash","ir","or","yr","ys","ith","an"]
    },
    any: { prefix: ["Akra","Arj","Biri","Don","Ghesh","Kriv"], root: ["ash","kyr","rhas","thys","zys"], suffix: ["ar","ir","ys","ith","an"] }
  },
  tiefling: {
    female: {
      prefix: ["Aby","Bel","Cri","Di","Eri","Fur","Gri","Hex","Iri","Jez"],
      root:   ["ssa","rix","zara","nys","thea","vara","zra","xys","vash","myr"],
      suffix: ["a","is","ith","ys","ara","e","ia","ine","ith","ys"]
    },
    male: {
      prefix: ["Aby","Bel","Cor","Da","Ere","Fen","Kaz","Luc","Mor","Zeb"],
      root:   ["zor","vash","xar","zra","zar","myr","nys","rax","rix","ven"],
      suffix: ["on","or","is","us","ar","an","el","as","or","ion"]
    },
    any: { prefix: ["Aby","Bel","Cri","Da","Eri","Luc","Mor"], root: ["zor","vash","xar","zra","zar","nys"], suffix: ["a","is","on","or","ys","el"] }
  }
};

function generateName(ancestry, sex="any", style="default", count=5, seed=null) {
  const rng = seededRandom(seed);
  const set = NAME_TEMPLATES[ancestry] || NAME_TEMPLATES.human;
  const pool = set[sex] || set.any;
  const resolve = (key) => (pool.style && pool.style[style] && pool.style[style][key]) || pool[key];

  const names = [];
  for (let i=0;i<count;i++) {
    const pre = choice(resolve("prefix"), rng);
    const root = choice(resolve("root"), rng);
    const suf = choice(resolve("suffix"), rng);
    let n = pre + root + suf;
    // light cleanup for diacritics sequences if present:
    n = n.replace(/lë/g, "lë").replace(/ëi/g, "ëi");
    names.push(n);
  }
  return names;
}

// ---------- Shop generator ----------
const SHOP_TEMPLATES = {
  tavern: {
    patterns: ["The {adj} {beast}", "The {color} {object}", "The {number} {thing}", "{surname}'s {place}"],
    lex: {
      adj: ["Sly","Crimson","Copper","Silver","Sleeping","Laughing","Wandering","Whispering","Salty","Stormy"],
      beast: ["Chimera","Stag","Wyvern","Badger","Kraken","Fox","Hound","Bear","Mare","Raven"],
      color: ["Black","Green","Golden","Azure","Ivory","Umber"],
      object:["Lantern","Tankard","Anchor","Anvil","Crown","Gate","Key","Lute","Moon","Wheel"],
      number:["Two","Three","Seven","Nine"],
      thing: ["Lanterns","Maidens","Knaves","Oaks","Bells","Crowns"],
      surname:["Cole","Rook","Thorne","Merriweather","Kettle","Bracken","Farrow","Highmoor","Underbough","Grimsby"],
      place:["Rest","Table","Hearth","Taproom","Cellar","House","Inn","Alehouse"]
    },
    ownerHooks: [
      "Mirna “Cinder” Cole (scarred veteran, hates goblin whiskey).",
      "Old Rook Merriweather (knows every caravan rumor).",
      "Tess Bracken (secretly funds the Thieves’ Guild).",
      "Borin Highmoor (collects dragon stories; pays for true ones)."
    ],
    specials: [
      "Spiced root stew", "Juniper ale", "Pickled eels", "Goat cheese hand pies", "Blackberry mead"
    ]
  },
  general: {
    patterns: ["{surname} & Sons", "{color} {object} Goods", "{surname}'s Provisions", "The {adj} {object}"],
    lex: {
      surname:["Cole","Rook","Thorne","Bracken","Farrow","Highmoor","Underbough","Grimsby","Palmer","Greer"],
      color:["Copper","Green","Silver","Brass","Umber","Golden"],
      object:["Lantern","Wagon","Tack","Needle","Barrel","Bellows","Canvas","Loom","Scale"],
      adj:["Honest","Busy","Hearth","Stout","Friendly","Peachy"]
    },
    ownerHooks: [
      "Selda Greer (buys curios at fair prices).",
      "Niles Palmer (obsessed with exact weights).",
      "Cora Thorne (secret map collection)."
    ],
    specials: ["Waxed cloaks","Trail rations","Rope (50 ft)","Iron spikes","Whetstones"]
  },
  blacksmith: {
    patterns: ["{metal} & {tool}", "{surname}'s Forge", "The {color} Anvil"],
    lex: {
      metal:["Iron","Steel","Bronze","Mithral","Cold","Star"],
      tool:["Tongs","Hammer","Bellows","Chisel","Pincer"],
      surname:["Coalbrow","Flint","Ironhart","Redmaw","Stonearm","Forgehand"],
      color:["Red","Black","Copper","Ashen"]
    },
    ownerHooks: [
      "Garrik Coalbrow (won’t sell to known duelists).",
      "Hildy Forgehand (enchants on the side for friends)."
    ],
    specials:["Horseshoes","Nails","Axes","Spears","Shield repairs"]
  },
  alchemist: {
    patterns: ["The {color} Phial", "{surname}'s Tinctures", "Essence & {object}", "The {adj} Mortar"],
    lex: {
      color:["Violet","Crimson","Amber","Cobalt","Emerald"],
      surname:["Mikkelo","Varyn","Celise","Kett","Drover"],
      object:["Elixir","Tear","Lotus","Spiral","Vapor"],
      adj:["Patient","Silent","Quick","Distant","Merry"]
    },
    ownerHooks:[
      "Celise (willing to buy monster bits).",
      "Varyn (rumored to fake potions)."
    ],
    specials:["Antitoxin","Alchemist’s fire","Healer’s salve","Smoke vials"]
  },
  magic: {
    patterns: ["{surname}'s Oddities", "The {adj} {object}", "Runes & {object}"],
    lex: {
      surname:["Ashwillow","Nightjar","Bright","Holloway","Skye","Underbranch"],
      adj:["Whispering","Gilded","Phantom","Shifting","Silent"],
      object:["Sigils","Wands","Glamours","Relics","Riddles"]
    },
    ownerHooks:[
      "Master Nightjar (only sells to mages).",
      "Acolyte Bright (collects flawed enchantments)."
    ],
    specials:["Spell scrolls","Wand polishing","Identify service"]
  }
};

function generateShop(type="tavern", seed=null) {
  const rng = seededRandom(seed);
  const t = SHOP_TEMPLATES[type] || SHOP_TEMPLATES.tavern;
  const pat = choice(t.patterns, rng);
  const pick = (k)=> choice(t.lex[k], rng);
  const name = pat
    .replace("{adj}", pick("adj") || "")
    .replace("{beast}", pick("beast") || "")
    .replace("{color}", pick("color") || "")
    .replace("{object}", pick("object") || "")
    .replace("{number}", pick("number") || "")
    .replace("{thing}", pick("thing") || "")
    .replace("{surname}", pick("surname") || "")
    .replace("{place}", pick("place") || "")
    .replace(/\s+/g," ").trim().replace(/ \& /g," & ");

  const sign = `Sign: ${choice(
    ["Faded","Freshly painted","Carved wooden","Metal-inlaid","Hanging cloth"],
    rng
  )} ${choice(["symbol","emblem","crest","sigil"], rng)} of a ${choice(
    ["stag","chimera","key","anvil","tankard","moon","kraken","raven"],
    rng
  )}.`;
  const owner = `Owner: ${choice(t.ownerHooks, rng)}`;
  const priceTier = `Price Tier: ${choice(["$","$$","$$$"], rng)}`;
  const special = `Special: ${choice(t.specials, rng)}.`;
  const rumor = `Rumor: ${choice(
    ["a sunken bell in the marsh","a ghost on the old road","smugglers under the docks","a dragon seen at dusk","a sealed well in the square"],
    rng
  )}.`;

  return `Name: ${name}\n${sign}\n${owner}\n${priceTier}\n${special}\n${rumor}`;
}

// ---------- Loot generator ----------
const LOOT_TABLES = [
  { tier: 1, min:1, max:4, coins: {gp:[20,60], sp:[50,150]}, magicWeights: {low:2, medium:5, high:9},
    gems:["bloodstone","carnelian","jasper","moonstone","onyx","quartz"], 
    mundane:["silk scarf","engraved buckle","carved bone die","silver brooch","sturdy boots"],
    consumables:["potion of healing","scroll of protection","antitoxin","smoke vial"],
    magic:["+1 dagger","wand of secrets","cloak of many fashions","driftglobe","alchemy jug"] },
  { tier: 2, min:5, max:10, coins: {gp:[80,220], sp:[200,600]}, magicWeights: {low:3, medium:7, high:12},
    gems:["amber","amethyst","chrysoprase","citrine","garnet","jade"],
    mundane:["carved cameo","silvered mirror","stitched banner","jeweled hairpin","fine gloves"],
    consumables:["potion of greater healing","scroll of lesser restoration","oil of slipperiness"],
    magic:["+1 longsword","bag of holding","boots of elvenkind","circlet of blasting","periapt of wound closure"] },
  { tier: 3, min:11, max:16, coins: {gp:[300,800], sp:[400,1200]}, magicWeights: {low:4, medium:9, high:16},
    gems:["alexandrite","black pearl","fire opal","peridot","spinel","tourmaline"],
    mundane:["jeweled chalice","golden lyre","embroidered cloak","engraved astrolabe"],
    consumables:["potion of superior healing","elixir of health","spell scroll (3rd-4th)"],
    magic:["+2 weapon (type)","ring of protection","cloak of displacement","amulet of health","winged boots"] },
  { tier: 4, min:17, max:20, coins: {gp:[1200,3000], sp:[0,0]}, magicWeights: {low:5, medium:11, high:20},
    gems:["black opal","blue sapphire","emerald","jacinth","ruby","diamond"],
    mundane:["royal signet","platinum diadem","crystal decanter"],
    consumables:["potion of supreme healing","oil of etherealness","spell scroll (5th-6th)"],
    magic:["+3 weapon (type)","rod of the pact keeper +2","belt of giant strength (stone)","helm of brilliance","holy avenger (if applicable)"] }
];

function tierForLevel(level) {
  if (level <= 4) return 1;
  if (level <= 10) return 2;
  if (level <= 16) return 3;
  return 4;
}

function rollInRange([min,max], rng) {
  return Math.floor(rng()*(max-min+1))+min;
}

function generateLoot(avgLevel=3, magicFreq="medium", seed=null) {
  const rng = seededRandom(seed);
  const t = LOOT_TABLES.find(x => x.tier === tierForLevel(avgLevel));
  const coinsGp = rollInRange(t.coins.gp, rng);
  const coinsSp = rollInRange(t.coins.sp, rng);
  const gems = Array.from({length: Math.floor(rng()*3)}, ()=> choice(t.gems, rng));
  const mundane = Array.from({length: Math.floor(rng()*3)}, ()=> choice(t.mundane, rng));
  const consumables = Array.from({length: Math.floor(rng()*2)+1}, ()=> choice(t.consumables, rng));

  const magicW = t.magicWeights[magicFreq] || t.magicWeights.medium;
  const magicRoll = Math.floor(rng()*20)+1;
  const magicCount = magicRoll <= magicW ? 1 : 0;
  const magic = Array.from({length: magicCount}, ()=> choice(t.magic, rng));

  const parts = [];
  parts.push(`Coins: ${coinsGp} gp${coinsSp?`, ${coinsSp} sp`:``}`);
  if (gems.length) parts.push(`Gems: ${gems.join(", ")}`);
  if (mundane.length) parts.push(`Mundane: ${mundane.join(", ")}`);
  if (consumables.length) parts.push(`Consumables: ${consumables.join(", ")}`);
  if (magic.length) parts.push(`Magic: ${magic.join(", ")}`);
  parts.push(`Flavor: ${choice(
    ["ruby with a spiderweb inclusion","shield with boar-crest","map scrap with a burnt edge","signet stamped with a willow","coin minted in a lost duchy"],
    rng
  )}`);

  return parts.join("\n");
}

// ---------- SRD keyword search (sample data) ----------
let SRD_DATA = null;
async function loadSRD() {
  if (SRD_DATA) return SRD_DATA;
  const res = await fetch("data/srd_min.json");
  SRD_DATA = await res.json();
  return SRD_DATA;
}

function cardForEntry(entry) {
  const type = entry.type || "entry";
  let meta = "";
  if (type === "spell") meta = `Lv ${entry.level} • ${entry.school} • ${entry.casting_time} • Range ${entry.range} • ${entry.duration}`;
  const safe = (s)=> String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return `<div class="card">
    <div class="badge">${safe(type)}</div>
    <h4>${safe(entry.name)}</h4>
    ${meta ? `<div class="hint">${safe(meta)}</div>` : ""}
    <p>${safe(entry.text)}</p>
  </div>`;
}

async function searchSRD(query, type="any") {
  const data = await loadSRD();
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const all = [
    ...(data.spells||[]),
    ...(data.conditions||[]),
    ...(data.equipment||[]),
    ...(data.rules||[]),
  ].filter(e => type==="any" || e.type===type);
  // Simple substring match on name or text:
  return all.filter(e => (e.name && e.name.toLowerCase().includes(q)) || (e.text && e.text.toLowerCase().includes(q)))
            .slice(0, 50);
}

// ---------- Pinboard ----------
const PIN_KEY = "dmstation_pins_v1";
function loadPins() {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "[]"); } catch { return []; }
}
function savePins(pins) { localStorage.setItem(PIN_KEY, JSON.stringify(pins)); }
function renderPins() {
  const host = document.getElementById("pinboard-content");
  const pins = loadPins();
  host.innerHTML = "";
  for (const p of pins) {
    const div = document.createElement("div");
    div.className = "pin";
    div.innerHTML = `<div class="meta"><span class="badge">${p.kind}</span><span class="hint">${new Date(p.at).toLocaleString()}</span></div>
    <pre>${p.text}</pre>
    <div class="actions">
      <button data-id="${p.id}" class="btn-copy">Copy</button>
      <button data-id="${p.id}" class="btn-del">Remove</button>
    </div>`;
    host.appendChild(div);
  }
  host.querySelectorAll(".btn-copy").forEach(b => b.addEventListener("click", (e)=>{
    const id = e.target.getAttribute("data-id");
    const pins = loadPins();
    const pin = pins.find(x=>x.id===id);
    if (pin) navigator.clipboard.writeText(pin.text);
  }));
  host.querySelectorAll(".btn-del").forEach(b => b.addEventListener("click", (e)=>{
    const id = e.target.getAttribute("data-id");
    const pins = loadPins().filter(x=>x.id!==id);
    savePins(pins); renderPins();
  }));
}

function makePin(kind, text) {
  const pins = loadPins();
  pins.unshift({ id: String(Date.now())+"_"+Math.random().toString(36).slice(2,6), at: Date.now(), kind, text });
  savePins(pins); renderPins();
}

function exportPins() {
  const pins = loadPins();
  const md = pins.map(p => `### ${p.kind} — ${new Date(p.at).toLocaleString()}\n\n\`\`\`\n${p.text}\n\`\`\``).join("\n\n");
  const blob = new Blob([md], {type: "text/markdown"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "dm-station-pinboard.md"; a.click();
  URL.revokeObjectURL(url);
}

// ---------- Wire up UI ----------
function $(id){ return document.getElementById(id); }

window.addEventListener("DOMContentLoaded", ()=> {
  // Names
  $("btn-generate-names").addEventListener("click", ()=> {
    const anc = $("name-ancestry").value;
    const sex = $("name-sex").value;
    const style = $("name-style").value;
    const count = clamp(parseInt($("name-count").value||"5",10), 1, 50);
    const seed = $("name-seed").value || null;
    const out = generateName(anc, sex, style, count, seed).join("\n");
    $("names-output").textContent = out;
  });
  $("btn-copy-names").addEventListener("click", ()=> {
    const t = $("names-output").textContent || "";
    if (t) navigator.clipboard.writeText(t);
  });
  $("btn-pin-names").addEventListener("click", ()=> {
    const t = $("names-output").textContent || "";
    if (t) makePin("Names", t);
  });

  // Shops
  $("btn-generate-shop").addEventListener("click", ()=>{
    const type = $("shop-type").value;
    const out = generateShop(type);
    $("shop-output").textContent = out;
  });
  $("btn-copy-shop").addEventListener("click", ()=> {
    const t = $("shop-output").textContent || "";
    if (t) navigator.clipboard.writeText(t);
  });
  $("btn-pin-shop").addEventListener("click", ()=> {
    const t = $("shop-output").textContent || "";
    if (t) makePin("Shop", t);
  });

  // Loot
  $("btn-generate-loot").addEventListener("click", ()=>{
    const lvl = clamp(parseInt($("loot-level").value||"3",10), 1, 20);
    const freq = $("loot-magic").value;
    const out = generateLoot(lvl, freq);
    $("loot-output").textContent = out;
  });
  $("btn-copy-loot").addEventListener("click", ()=> {
    const t = $("loot-output").textContent || "";
    if (t) navigator.clipboard.writeText(t);
  });
  $("btn-pin-loot").addEventListener("click", ()=> {
    const t = $("loot-output").textContent || "";
    if (t) makePin("Loot", t);
  });

  // Search
  $("btn-search").addEventListener("click", async ()=>{
    const q = $("search-query").value;
    const type = $("search-type").value;
    const results = await searchSRD(q, type);
    const host = $("search-results");
    host.innerHTML = results.map(cardForEntry).join("");
  });
  $("btn-clear-search").addEventListener("click", ()=>{
    $("search-query").value = "";
    $("search-results").innerHTML = "";
    $("search-query").focus();
  });

  // Pinboard
  $("btn-export-pinboard").addEventListener("click", exportPins);
  $("btn-clear-pinboard").addEventListener("click", ()=> { savePins([]); renderPins(); });

  renderPins();
});
