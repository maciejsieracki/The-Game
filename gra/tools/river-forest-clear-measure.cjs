'use strict';
/**
 * R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-Q1 — POMIAR na prawdziwych funkcjach (generateMap, workedHexCoordsForCity,
 * pickAutoImprovements / decideAITurn). Mierzy: pola obywateli z lasem (przy rzece / poza), ile wycieto, farmy, irygacje,
 * POWOD niewyciecia (zdarzenia `onDecision` scope 'las', tylko automat gracza).
 *
 * Run z gra/:  RFC_ACTOR=zywnosc|zrownowazone|surowce|infrastruktura|ai  [RFC_SEEDS=1,2,3] [RFC_TURNS=100] [RFC_OUT=plik] node tools/river-forest-clear-measure.cjs
 * Zrodlo:      RFC_SRC_DIR=<kopia gra/src> (PRZED / mutacje).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.RFC_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rfc-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export * from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, workedHexCoordsForCity, generateMap, skipWyrabForFocus } = require(bundle);
// Regula wolajacego main.ts: PRZED = !wolno (kazdy profil); PO = skipWyrabForFocus.
const skipFor = focus => (typeof skipWyrabForFocus === 'function' ? skipWyrabForFocus(focus, WOLNO) : !WOLNO);

const K = (q, r) => `${q},${r}`;
const PID = 3, ERA = 3;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);
const SEA = new Set(['morze', 'plytkie_morze', 'wybrzeze', 'Morze', 'PlytkieMorze', 'Wybrzeze']);
const seeds = (process.env.RFC_SEEDS || '1,2,3').split(',').map(Number);
const TURNS = Number(process.env.RFC_TURNS || 100);
const ACTOR = process.env.RFC_ACTOR || 'zywnosc';
const WORLD = process.env.RFC_WORLD || 'kontynenty';
const PRACA = Number(process.env.RFC_PRACA || 400);
const NCITIES = Number(process.env.RFC_CITIES || 3);
const WOLNO = (process.env.RFC_WOLNO ?? '1') === '1'; // przelacznik gracza „Wolno wycinac las” (domyslnie w grze: WYLACZONY)
const INCOME = process.env.RFC_INCOME ? Number(process.env.RFC_INCOME) : null; // model puli Pracy: przyrost/ture/miasto (brak = stala pula PRACA)
const PCT = Number(process.env.RFC_PCT || 33);
const EXTRA = process.env.RFC_DEFICITS ? process.env.RFC_DEFICITS.split(',') : [];

/** Miasta w gestym lesie przy rzece (jak na zrzucie wlasciciela). */
function landSpots(map, n) {
  const sc = [];
  for (const k of Object.keys(map.hexes).sort()) {
    const h = map.hexes[k];
    if (!h || SEA.has(h.terenBazowy)) continue;
    const [q, r] = k.split(',').map(Number);
    let forest = 0, river = 0;
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[K(q + dq, r + dr)];
      if (nb && !SEA.has(nb.terenBazowy) && nb.nakladka === 'las') forest++;
    }
    for (const p of (map.riverPaths || [])) for (const c of p) if (Math.abs(c.q - q) + Math.abs(c.r - r) <= 3) river++;
    sc.push({ q, r, score: forest * 3 + river, forest, river });
  }
  sc.sort((a, b) => (b.score - a.score) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of sc) {
    if (s.forest < 4 || s.river < 1) continue;
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 7)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

const agg = { seeds: {}, total: { forestWorkedFinal: 0, forestWorkedRiverFinal: 0, wyrab: 0, wyrabRiver: 0, farma: 0, irygacja: 0, tartak: 0, everWorkedForestRiver: 0, everStillForest: 0 }, reasons: {} };
for (const seed of seeds) {
  const map = generateMap(36, 28, seed, WORLD);
  const riverHex = new Set();
  for (const p of (map.riverPaths || [])) for (const c of p) riverHex.add(K(c.q, c.r));
  const onRiver = hk => riverHex.has(hk) || map.hexes[hk]?.rzeka?.obecna === true;
  const spots = landSpots(map, NCITIES);
  // Gesty las wokol miast (mapy ze zrzutu wlasciciela): RFC_DENSE=p -> p% heksow laka/rownina/wzgorza w promieniu 4 dostaje las (deterministycznie).
  const DENSE = Number(process.env.RFC_DENSE || 0);
  if (DENSE > 0) {
    for (const s of spots) for (let dq = -4; dq <= 4; dq++) for (let dr = -4; dr <= 4; dr++) {
      if (Math.abs(dq + dr) > 4 || (dq === 0 && dr === 0)) continue;
      const h = map.hexes[K(s.q + dq, s.r + dr)];
      if (!h || !['laka', 'rownina', 'wzgorza'].includes(h.terenBazowy) || h.nakladka !== 'brak' || h.zloze) continue;
      const hash = Math.abs(((s.q + dq) * 73856093) ^ ((s.r + dr) * 19349663) ^ (seed * 83492791)) % 100;
      if (hash < DENSE * 100) h.nakladka = 'las';
    }
  }
  const placed = new Map();
  let pool = Number(process.env.RFC_POOL0 || 150);
  const cnt = { wyrab: 0, wyrabRiver: 0, farma: 0, irygacja: 0, tartak: 0 };
  const everWorkedForestRiver = new Set();
  let lastReasons = new Map();
  let finalWorked = new Set();
  for (let t = 0; t < TURNS; t++) {
    const pop = Math.min(8, 2 + Math.floor(t / 7));
    const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
    const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop, level: 1 }));
    const wbc = new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))])]));
    const allW = new Set([...wbc.values()].flatMap(s => [...s]));
    for (const hk of allW) if (map.hexes[hk]?.nakladka === 'las' && onRiver(hk)) everWorkedForestRiver.add(hk);
    finalWorked = allW;
    let cmds;
    const ev = new Map();
    if (ACTOR === 'ai') {
      const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
      cmds = decideAITurn(PID, [], cities, map, data, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
        placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: INCOME !== null ? pool : PRACA, civEra: ERA, resourceDeficitKeys: EXTRA,
      }).filter(c => c.type === 'buildImprovement');
    } else {
      cmds = pickAutoImprovements({
        cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: INCOME !== null ? pool : PRACA,
        unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: true, getSkipWyrab: () => skipFor(ACTOR), demandDriven: ACTOR === 'zrownowazone', resourceDeficitKeys: EXTRA,
        getFocus: () => ACTOR, getOnlyWorked: () => true,
        getWorkedHexKeys: c => wbc.get(c.id) ?? new Set(),
        pracaBudgetPercent: PCT, getPracaBudgetPercent: () => PCT, civArchetype: 'grecy', playerEra: ERA,
        foodImprovementStages: () => ACTOR === 'zywnosc' || ACTOR === 'zrownowazone', clearingHexKeys: new Set(),
        onDecision: e => { if (e.scope === 'las' && e.hex && !(e.detail && e.detail.sonda)) ev.set(e.hex, `${e.verdict}: ${e.reason}`); },
      }).map(p => ({ q: p.q, r: p.r, key: p.key, cost: p.kosztPraca }));
    }
    lastReasons = ev;
    if (INCOME !== null) pool += INCOME * cities.length;
    for (const c of cmds) {
      if (INCOME !== null) pool -= (c.cost ?? 0);
      const hk = K(c.q, c.r);
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; cnt.wyrab++; if (onRiver(hk)) cnt.wyrabRiver++; }
      else { placed.set(hk, [...(placed.get(hk) ?? []), c.key]); if (cnt[c.key] !== undefined) cnt[c.key]++; }
    }
  }
  const fw = [...finalWorked].filter(hk => map.hexes[hk]?.nakladka === 'las');
  const fwr = fw.filter(onRiver);
  const stillEver = [...everWorkedForestRiver].filter(hk => map.hexes[hk]?.nakladka === 'las');
  const reasons = {};
  for (const hk of fw) {
    const key = (onRiver(hk) ? 'RZEKA ' : 'poza  ') + (lastReasons.get(hk) || 'brak zdarzenia (AI / picker nie oceniał)');
    reasons[key] = (reasons[key] || 0) + 1; agg.reasons[key] = (agg.reasons[key] || 0) + 1;
  }
  agg.seeds[seed] = { cities: spots.length, forestWorkedFinal: fw.length, forestWorkedRiverFinal: fwr.length, everWorkedForestRiver: everWorkedForestRiver.size, everStillForest: stillEver.length, ...cnt, reasons };
  const T = agg.total;
  T.forestWorkedFinal += fw.length; T.forestWorkedRiverFinal += fwr.length; T.wyrab += cnt.wyrab; T.wyrabRiver += cnt.wyrabRiver;
  T.farma += cnt.farma; T.irygacja += cnt.irygacja; T.tartak += cnt.tartak;
  T.everWorkedForestRiver += everWorkedForestRiver.size; T.everStillForest += stillEver.length;
}
const OUT = JSON.stringify({ actor: ACTOR, world: WORLD, seeds, TURNS, ...agg }, null, 1);
if (process.env.RFC_OUT) fs.writeFileSync(process.env.RFC_OUT, OUT + '\nEXIT=0\n'); else console.log(OUT);
fs.rmSync(temp, { recursive: true, force: true });
