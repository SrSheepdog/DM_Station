// DM Station - Clean verified app.js (v1.0)
// Core Generators: Names, Shops, Loot, NPCs, Encounters, Quests, Dice

console.log("DM Station app.js loaded successfully.");

document.addEventListener("DOMContentLoaded", () => {
  const out = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  // Name generator
  const nameParts = {
    human: ["Aric", "Brena", "Darian", "Ela", "Fenn", "Garen", "Lira", "Mara", "Taren", "Vera"],
    elf: ["Aelar", "Caelynn", "Erevan", "Luthien", "Naivara", "Thamior", "Varis"],
    dwarf: ["Baern", "Dain", "Eberk", "Falkrunn", "Gimra", "Orsik", "Torbera"]
  };

  window.genNames = () => {
    const race = document.getElementById("race")?.value || "human";
    const list = nameParts[race] || nameParts.human;
    const result = Array.from({ length: 5 }, () => rand(list)).join(", ");
    out("names-output", result);
  };

  // Shop generator
  const shopAdjectives = ["Rusty", "Golden", "Sleeping", "Lucky", "Clever", "Laughing"];
  const shopNouns = ["Dragon", "Goblet", "Sword", "Hound", "Wizard", "Anvil"];
  const shopTypes = ["Tavern", "Inn", "Shop", "Emporium", "Bazaar", "Forge"];
  window.genShop = () => {
    const name = `${rand(shopAdjectives)} ${rand(shopNouns)}`;
    const type = rand(shopTypes);
    out("shop-output", `${name} ${type}`);
  };

  // Loot generator
  const lootItems = ["Gold coins", "Jeweled dagger", "Potion of Healing", "Silver ring", "Ancient scroll", "Gemstone"];
  window.genLoot = () => {
    const loot = Array.from({ length: 3 }, () => rand(lootItems)).join(", ");
    out("loot-output", loot);
  };

  // NPC generator
  const npcJobs = ["Baker", "Guard", "Innkeeper", "Merchant", "Scholar", "Thief"];
  const npcQuirks = ["hums constantly", "has a pet rat", "forgets names", "always chews mint leaves", "wears mismatched boots"];
  window.genNPC = () => {
    const name = rand(nameParts.human);
    const job = rand(npcJobs);
    const quirk = rand(npcQuirks);
    out("npc-output", `${name}, the ${job}, who ${quirk}.`);
  };

  // Encounter builder (uses monsters.json)
  window.genEncounter = async () => {
    try {
      const res = await fetch("data/monsters.json");
      const monsters = await res.json();
      const picks = monsters.sort(() => 0.5 - Math.random()).slice(0, 3);
      const lines = picks.map(m => `${m.name} (CR ${m.cr})`).join(", ");
      out("encounter-output", lines);
    } catch (e) {
      out("encounter-output", "Error loading monsters.json");
      console.error(e);
    }
  };

  // Quest hook generator
  const questGoals = ["recover a lost relic", "defeat a band of goblins", "escort a merchant", "investigate strange lights", "rescue a kidnapped noble"];
  const questTwists = ["but the relic is cursed", "only to discover betrayal", "and uncover an ancient secret", "before the full moon"];
  window.genQuest = () => {
    const goal = rand(questGoals);
    const twist = rand(questTwists);
    out("quest-output", `You must ${goal} ${twist}.`);
  };

  // Dice roller
  window.rollDice = () => {
    const input = document.getElementById("dice-input")?.value || "1d20";
    const match = input.match(/(\d*)d(\d+)([+-]\d+)?/i);
    if (!match) {
      out("dice-output", "Invalid dice format");
      return;
    }
    const num = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const mod = parseInt(match[3]) || 0;
    let total = 0;
    for (let i = 0; i < num; i++) total += Math.floor(Math.random() * sides) + 1;
    total += mod;
    out("dice-output", `${input} = ${total}`);
  };

  // Bind buttons
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
  };

  bind("btn-generate-names", genNames);
  bind("btn-generate-shop", genShop);
  bind("btn-generate-loot", genLoot);
  bind("btn-generate-npc", genNPC);
  bind("btn-build-encounter", genEncounter);
  bind("btn-generate-quest", genQuest);
  bind("btn-roll", rollDice);

  console.log("DM Station initialized.");
});
