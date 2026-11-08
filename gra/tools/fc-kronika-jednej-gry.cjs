'use strict';
/**
 * fc-kronika-jednej-gry.cjs — POMIAR FINAL CONTROL (nie bramka) dla
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 1.
 *
 * Ani Operator, ani Evaluator nie pokazali WLASCICIELOWI tego, o co pytal wprost:
 * surowej kroniki JEDNEJ gry — tura po turze, z wspolrzednymi heksow — z ktorej
 * czlowiek sam widzi, czy AI konczy jeden heks przed przejsciem do nastepnego.
 * Obaj podali agregaty (357/357, E1 max 50). Agregat mozna poprawic nie zmieniajac
 * zachowania; kronika nie klamie.
 *
 * Harness 1:1 z tools/oboz-lowiecki-ai-40tur-measure.cjs (mapa 36x28 „kontynenty”,
 * 3 miasta, promien 4, pop 6, maxItemsPerCity=1, 40 tur) — liczby porownywalne z baza 99/56.
 *
 * WYJSCIE:
 *   A) KRONIKA — kazda tura: co, gdzie (q,r), ktore miasto, [RZEKA]/[LAS].
 *   B) ZYCIORYS HEKSA — dla heksow z >=2 ulepszeniami: tury i przerwy.
 *   C) PRIORYTET RZEK — ile heksow z rzeka pozostalo pustych, gdy AI ruszalo poza rzeke.
 *
 * Run: node tools/fc-kronika-jednej-gry.cjs   (FC_SEED=1337 FC_TURNS=40)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.FC_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.fc-kronika-entry.ts');
const BUNDLE = path.resolve(__dirname, '.fc-kronika-bundle.cjs');

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

const SEED = Number(process.env.FC_SEED || 1337);
const TURNS = Number(process.env.FC_TURNS || 40);

const map = M.generateMap(36, 28, SEED, 'kontynenty');
const riverSet = new Set();
for (const p of (map.riverPaths || [])) for (const c of p) riverSet.add(`${c.q},${c.r}`);

const spots = pickCitySpots(map, 3);
const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: 1, q: s.q, r: s.r, population: 6 }));
const territoryNodes = [];
const hexCity = new Map();
cities.forEach(c => {
  const nodes = territoryFor(map, c.q, c.r, 4, 1, c.id);
  for (const n of nodes) if (!hexCity.has(`${n.q},${n.r}`)) hexCity.set(`${n.q},${n.r}`, c.id);
  territoryNodes.push(...nodes);
});

const placed = new Map();
const events = [];      // {turn, q, r, key, city, river, forestAtBuild}
const counts = {};
for (let t = 0; t < TURNS; t++) {
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
    const h = map.hexes[hk];
    events.push({
      turn: t, q: p.q, r: p.r, key: p.key, city: hexCity.get(hk) ?? '?',
      river: riverSet.has(hk),
      forest: h ? h.nakladka === Nakladka.Las : false,
      teren: h ? h.terenBazowy : '?',
    });
  }
}

const out = [];
out.push(`=== KRONIKA JEDNEJ GRY — ziarno ${SEED}, ${TURNS} tur, 3 miasta, maxItemsPerCity=1 ===`);
out.push(`Miasta: ${cities.map(c => `${c.id}@(${c.q},${c.r})`).join('  ')}`);
const terrRiver = [...hexCity.keys()].filter(k => riverSet.has(k));
out.push(`Heksow w terytorium: ${hexCity.size}, z tego z rzeka: ${terrRiver.length}`);
out.push('');
out.push('--- A) TURA PO TURZE ---');
let lastT = -1;
for (const e of events) {
  if (e.turn !== lastT) { out.push(`t${String(e.turn).padStart(2)}:`); lastT = e.turn; }
  out.push(`   ${e.city} (${e.q},${e.r}) ${e.key}${e.river ? '  [RZEKA]' : ''}${e.forest ? '  [LAS]' : ''}`);
}

out.push('');
out.push('--- B) ZYCIORYS HEKSA (>=2 ulepszenia) ---');
const byHex = new Map();
for (const e of events) {
  const k = `${e.q},${e.r}`;
  if (!byHex.has(k)) byHex.set(k, []);
  byHex.get(k).push(e);
}
let multi = 0, sumSpan = 0, sumForeign = 0;
const lines = [];
for (const [k, evs] of byHex) {
  if (evs.length < 2) continue;
  multi++;
  const span = evs[evs.length - 1].turn - evs[0].turn;
  sumSpan += span;
  const foreign = new Set();
  for (const e of events) {
    if (e.turn > evs[0].turn && e.turn < evs[evs.length - 1].turn && `${e.q},${e.r}` !== k) foreign.add(`${e.q},${e.r}`);
  }
  sumForeign += foreign.size;
  lines.push({ k, span, foreign: foreign.size, river: evs[0].river,
    txt: `(${k})${evs[0].river ? ' RZEKA' : '      '} ${evs.map(e => `${e.key}@t${e.turn}`).join(' -> ')} | rozpietosc ${span} tur, obcych heksow w przerwie: ${foreign.size}` });
}
lines.sort((a, b) => b.span - a.span);
for (const l of lines.slice(0, 30)) out.push('  ' + l.txt);
out.push(`  ... heksow z >=2 ulepszeniami: ${multi}, srednia rozpietosc ${(sumSpan / Math.max(1, multi)).toFixed(1)} tur, srednio obcych heksow w przerwie ${(sumForeign / Math.max(1, multi)).toFixed(1)}`);

out.push('');
out.push('--- C) PRIORYTET RZEK ---');
const firstTouch = new Map();
for (const e of events) { const k = `${e.q},${e.r}`; if (!firstTouch.has(k)) firstTouch.set(k, e.turn); }
const riverTouched = terrRiver.filter(k => firstTouch.has(k));
const nonRiverTouched = [...firstTouch.keys()].filter(k => !riverSet.has(k));
out.push(`  Heksow z rzeka w terytorium: ${terrRiver.length}; tknietych przez AI: ${riverTouched.length}`);
out.push(`  Heksow BEZ rzeki tknietych: ${nonRiverTouched.length}`);
// kiedy AI ruszylo pierwszy heks bez rzeki, ile heksow z rzeka bylo jeszcze nietknietych
let firstNonRiverTurn = Infinity;
for (const e of events) if (!e.river) { firstNonRiverTurn = e.turn; break; }
const untouchedRiverAtThatTime = terrRiver.filter(k => !firstTouch.has(k) || firstTouch.get(k) > firstNonRiverTurn).length;
out.push(`  Pierwsze ulepszenie POZA rzeka: tura ${firstNonRiverTurn}; heksow z rzeka jeszcze nietknietych w tym momencie: ${untouchedRiverAtThatTime}`);
const lastRiverTurn = Math.max(...riverTouched.map(k => firstTouch.get(k)));
out.push(`  Ostatni heks z rzeka tkniety po raz pierwszy: tura ${lastRiverTurn}`);
out.push(`  wyrab: ${counts['wyrab'] ?? 0} · tartak: ${counts['tartak'] ?? 0} · farma: ${counts['farma'] ?? 0} · oboz_lowiecki: ${counts['oboz_lowiecki'] ?? 0} · pastwiska: ${(counts['owce'] ?? 0) + (counts['bydlo'] ?? 0) + (counts['lama'] ?? 0)}`);
out.push(`  RAZEM ulepszen: ${events.length}, tknietych heksow: ${byHex.size}`);

console.log(out.join('\n'));
