'use strict';
/**
 * oboz-lowiecki-ai-40tur-measure.cjs — POMIAR (nie bramka) dla drugiej części zgłoszenia
 * R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1: „cywilizacja zamiast owcy często buduje obóz łowiecki".
 *
 * Symuluje ~40 tur automatu ulepszeń AI na TEJ SAMEJ mapie i ziarnie, licząc ile obozów
 * łowieckich i ile pastwisk (owce/bydło/lama) powstaje. `pickAutoImprovements` to DOKŁADNIE ta
 * sama funkcja, przez którą chodzi AI (ai.ts `planCityImprovements` -> `pickAutoImprovements`)
 * i automat gracza; main.ts commituje jej wyniki bez ponownej walidacji terenu.
 *
 * PRZED/PO: `OBOZ_SRC_DIR` wskazuje katalog źródeł (domyślnie ../src). Uruchom raz na
 * bieżącym `src`, raz na kopii sprzed zmiany — porównanie robi wołający.
 *
 * Run:  node tools/oboz-lowiecki-ai-40tur-measure.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TAG = process.env.OBOZ_TAG || 'now';
const ENTRY = path.resolve(__dirname, `.oboz-40tur-entry-${TAG}.ts`);
const BUNDLE = path.resolve(__dirname, `.oboz-40tur-bundle-${TAG}.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'warning',
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka } = M;

const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo',
  'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta',
  'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka',
]);

const PASTWISKA = new Set(['owce', 'bydlo', 'lama']);

/** Terytorium = pierścień promienia `rad` wokół miasta (heksy lądu). */
function territoryFor(map, cx, cy, rad, ownerId, cityId) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) {
    for (let dr = -rad; dr <= rad; dr++) {
      if (Math.abs(dq + dr) > rad) continue;
      const h = map.hexes[`${cx + dq},${cy + dr}`];
      if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
      out.push({ q: cx + dq, r: cy + dr, ownerId, cityId });
    }
  }
  return out;
}

/** Wybiera deterministycznie N spotów miast: najgęstszy ląd, posortowany po (q,r). */
function pickCitySpots(map, n) {
  const keys = Object.keys(map.hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number); const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const scored = [];
  for (const k of keys) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) {
      for (let dr = -3; dr <= 3; dr++) {
        if (Math.abs(dq + dr) > 3) continue;
        const nb = map.hexes[`${q + dq},${r + dr}`];
        if (nb && nb.terenBazowy !== TerenBazowy.Morze) land++;
      }
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 8)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

function simulate(seed, turns) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const spots = pickCitySpots(map, 3);
  const cities = spots.map((s, i) => ({
    id: `c${i}`, ownerId: 1, q: s.q, r: s.r, population: 6,
  }));
  const territoryNodes = [];
  cities.forEach(c => territoryNodes.push(...territoryFor(map, c.q, c.r, 4, 1, c.id)));

  const placed = new Map();
  const counts = {};
  for (let t = 0; t < turns; t++) {
    const picks = M.pickAutoImprovements({
      cities, ownerId: 1, map, territoryNodes,
      placedImprovements: placed,
      pracaAvailable: 100000,
      unlockedTechs: TECHS,
      pracaSurplusThreshold: 0,
      pracaBudgetPercent: 100,
      maxItemsPerCity: 1,
      skipWyrab: false,
      playerEra: 3,
      priorityOverride: M.AI_IMPROVEMENT_PRIORITY,
    });
    if (!picks.length) break;
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      const prev = placed.get(hk) ?? [];
      if (prev.includes(p.key)) continue;
      placed.set(hk, [...prev, p.key]);
      counts[p.key] = (counts[p.key] ?? 0) + 1;
    }
  }
  const oboz = counts['oboz_lowiecki'] ?? 0;
  let pastw = 0;
  for (const k of PASTWISKA) pastw += counts[k] ?? 0;
  return { seed, oboz, pastw, counts };
}

const seeds = (process.env.OBOZ_SEEDS || '42,1337,2026').split(',').map(Number);
const TURNS = Number(process.env.OBOZ_TURNS || 40);
console.log(`\n=== ${TAG} · ${TURNS} tur · src=${SRC} ===`);
let tOboz = 0, tPastw = 0;
for (const s of seeds) {
  const r = simulate(s, TURNS);
  tOboz += r.oboz; tPastw += r.pastw;
  const top = Object.entries(r.counts).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`seed ${r.seed}: oboz_lowiecki=${r.oboz} pastwiska=${r.pastw} | ${top}`);
}
console.log(`RAZEM(${TAG}): oboz_lowiecki=${tOboz} pastwiska=${tPastw}`);
