# DM Station (Starter)
A no-setup, static website with quick tools for Dungeon Masters: **name generator**, **shop/tavern generator**, **loot generator**, and a **keyword SRD search**. Everything runs in the browser (no backend).

## Quick start (the absolute easiest)
1. **Unzip** this folder.
2. Double‑click **`index.html`** to open in your browser. You can use it offline.
3. Optional: to put it on the internet for free, drag this entire folder onto **Netlify Drop** (search for it) or follow the GitHub Pages steps below.

## GitHub Pages (free hosting)
1. Create a free GitHub account if you don’t have one.
2. Create a new public repository named `dm-station`.
3. Upload all files in this folder to that repository (or drag‑and‑drop using the web interface).
4. In the repo, go to **Settings → Pages**. Under “Build and deployment,” choose **Deploy from a branch**. Select the **main** branch and **/ (root)** folder. Click **Save**.
5. After a minute, your site will be live at `https://YOURNAME.github.io/dm-station/`.

## What’s included
- **Generators**: Race/sex‑based names, shop/tavern names, and loot bundles with flavor.
- **Pinboard**: Save generated results during a session; export to Markdown.
- **Rules Search**: Tiny sample dataset to prove it works. You can replace `data/srd_min.json` with a bigger SRD JSON later.
- **Offline**: Pure static files. (A service worker is *not* included in this starter to keep it simple.)

## Add more SRD data (optional)
- The file `data/srd_min.json` shows the structure. You can add more entries to the arrays or replace it with a full dataset. Keep the same top‑level keys (`spells`, `conditions`, `equipment`, `rules`).
- Be sure to retain **CC BY 4.0** attribution on `/legal.html` if you include SRD text.

## Customize name/loot/shop data
Open `app.js` and look for the sections:
- `NAME_TEMPLATES` – tweak syllables/styles or add new ancestries.
- `SHOP_TEMPLATES` – adjust patterns and lexicons for shop names + owner hooks.
- `LOOT_TABLES` – tune coins, rarity curves, and item lists.

## Developer notes (optional, later)
If you decide to grow this into a bigger app (Next.js, accounts, cloud sync), this static starter gives you clean, portable data and functions to migrate into any framework.
