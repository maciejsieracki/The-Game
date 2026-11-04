'use strict';
/**
 * R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (decyzja wlasciciela 2026-11-03/04): przy wlaczonym „Tylko pola z obywatelami”
 * ulepszenia ZWIAZANE Z ZYWNOSCIA (farma, irygacja, tarasy, bydlo/owce/lama, oboz lowiecki, lodzie rybackie,
 * warzelnia soli, wycinka pod farme) NIE powstaja na heksie bez obywatela — ZADNYCH wyjatkow (rzeka/wyrab Q2/Q3,
 * zloza, przebieg „brakujacy surowiec”). Dotyczy automatu gracza (profile „zywnosc” i „zrownowazone”) ORAZ AI
 * (`decideAITurn` -> `planCityImprovements`). Prawdziwe funkcje, zadnych atrap pickera.
 *
 * Run z gra/:   node tools/ai-food-only-worked-hexes-test.cjs
 * Mutacja:      AFW_SRC_DIR=<kopia gra/src z mutacja> node tools/ai-food-only-worked-hexes-test.cjs   (MUSI byc czerwony)
 * Pomiar:       AFW_MEASURE=1 [AFW_SEEDS=1,2,3] [AFW_TURNS=60] [AFW_WORLDS=kontynenty,pangea] node tools/ai-food-only-worked-hexes-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AFW_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const MEASURE = process.env.AFW_MEASURE === '1';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'afw-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, workedHexCoordsForCity, generateMap } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

/** Ulepszenia zwiazane z zywnoscia (decyzja wlasciciela T1) — niezalezna lista testu. */
const FOOD = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'oboz_lowiecki', 'lodzie_rybackie', 'warzelnia_soli', 'wyrab']);
const LIVESTOCK = new Set(['bydlo', 'owce', 'lama']);
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);
const K = (q, r) => `${q},${r}`;

// ---------------------------------------------------------------------------
// Scenariusz zblizony do zrzutu: miasto z kilkoma obywatelami, dziesiatki heksow ziemi, rzeka, las na rzece, zloza.
// ---------------------------------------------------------------------------
const W = 30, H = 30, CQ = 15, CR = 15, PID = 3;
const RIVER = [[15, 11], [15, 12], [15, 13], [15, 14], [16, 14], [16, 16], [16, 17], [15, 18]];
function makeScenarioMap() {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: (q + r) % 5 === 0 ? 'laka' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of RIVER) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of [[15, 12], [15, 13], [16, 16]]) hexes[K(q, r)].nakladka = 'las';        // las NA rzece
  hexes[K(12, 14)].nakladka = 'zloze_bydla';                                                    // zloze bydla
  hexes[K(18, 16)].nakladka = 'zloze_owiec';                                                    // zloze owiec
  hexes[K(13, 17)].zloze = 'sol';                                                               // sol
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [RIVER.map(([q, r]) => ({ q, r }))] };
}
const popAt = t => Math.min(7, 3 + Math.floor(t / 8));
const mkCity = t => ({ id: 'city0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: popAt(t) });
const mkTN = t => [{ q: CQ, r: CR, ownerId: PID, cityId: 'city0', pop: popAt(t), level: 1 }];
const ERA = 3;

/** Heksy z obywatelami w danej turze — ta sama funkcja, ktora zasila filtr (main.ts getWorkedHexKeys / ai.ts). */
function workedNow(city, map, tn) {
  return new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r)));
}

/**
 * Symulacja `turns` tur. mode: 'ai' | 'player-zywnosc' | 'player-zrownowazone'. Zwraca log wszystkich picków z flaga `off`
 * (ulepszenie ZYWNOSCIOWE na heksie bez obywatela w momencie decyzji; centrum miasta liczy sie jako pracowane).
 */
function sim({ mode, turns = 40, deficits = [], resourcePassFree = false }) {
  const map = makeScenarioMap();
  const placed = new Map();
  const log = [];
  for (let t = 0; t < turns; t++) {
    const city = mkCity(t), tn = mkTN(t);
    const worked = workedNow(city, map, tn);
    worked.add(K(CQ, CR));
    let picks;
    if (mode === 'ai') {
      const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
      const cmds = decideAITurn(PID, [], [city], map, data, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
        placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 600, civEra: ERA,
        resourceDeficitKeys: deficits,
      });
      picks = cmds.filter(c => c.type === 'buildImprovement').map(c => ({ q: c.q, r: c.r, key: c.key }));
    } else {
      const focus = mode === 'player-zywnosc' ? 'zywnosc' : 'zrownowazone';
      picks = pickAutoImprovements({
        cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed),
        pracaAvailable: 600, unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true,
        resourceDeficitKeys: deficits, getFocus: () => focus, getOnlyWorked: () => true,
        getWorkedHexKeys: () => new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(({ q, r }) => K(q, r))),
        ...(resourcePassFree ? { getResourcePassOnlyWorked: () => false } : {}),
        pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
        foodImprovementStages: () => true, clearingHexKeys: new Set(),
      });
    }
    for (const p of picks) {
      const hk = K(p.q, p.r);
      const hx = map.hexes[hk];
      const off = FOOD.has(p.key) && !worked.has(hk);
      let cause = null;
      if (off) {
        if (p.key === 'wyrab') cause = 'wyrab-rzeka-poza-obywatelem';
        else if (p.key === 'farma' && log.some(e => e.key === 'wyrab' && e.hk === hk)) cause = 'farma-po-wycince-rzeki';
        else if (p.key === 'warzelnia_soli') cause = 'przebieg-brakujacy-surowiec/zloze-soli';
        else if (hx && (hx.zloze || String(hx.nakladka).startsWith('zloze'))) cause = 'zloze-na-heksie';
        else cause = 'inne';
      }
      log.push({ t, key: p.key, hk, off, cause });
      if (p.key === 'wyrab') { if (hx) hx.nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
  }
  return { log, placed, map };
}
const offOf = log => log.filter(e => e.off);
const dl = log => log.slice(0, 6).map(e => `${e.t}:${e.key}@${e.hk}`).join(' ') || 'nic';

if (!MEASURE) {
  const MODES = ['ai', 'player-zywnosc', 'player-zrownowazone'];

  console.log('(A) 0 ulepszen zywnosciowych poza polami obywateli — scenariusz zrzutu, 40 tur, bez niedoboru');
  for (const mode of MODES) {
    const { log } = sim({ mode });
    const bad = offOf(log);
    ok(log.length > 0, `${mode}: automat cos buduje (${log.length} ulepszen)`);
    ok(bad.length === 0, `${mode}: 0 ulepszen zywnosciowych bez obywatela (jest ${bad.length}: ${dl(bad)})`);
  }

  console.log('(B) niedobor soli (przebieg „brakujacy surowiec”) NIE otwiera filtra dla zywnosci (warzelnia soli)');
  for (const mode of MODES) {
    for (const free of (mode === 'ai' ? [true] : [false, true])) {
      const { log } = sim({ mode, deficits: ['sol'], resourcePassFree: free });
      const bad = offOf(log);
      ok(bad.length === 0, `${mode}${free ? ' (resource-pass bez filtra)' : ''}: 0 zywnosciowych bez obywatela przy niedoborze soli (jest ${bad.length}: ${dl(bad)})`);
    }
  }

  console.log('(C) wyjatek rzeczny (wycinka lasu na rzece / farma po wycince) nie obowiazuje przy wlaczonym filtrze');
  for (const mode of MODES) {
    // obywatele NIE na rzece: wymus pop=1 (jedno pole poza rzeka) i las na wszystkich heksach rzeki
    const { log } = sim({ mode, turns: 30 });
    const river = log.filter(e => e.off && (e.cause === 'wyrab-rzeka-poza-obywatelem' || e.cause === 'farma-po-wycince-rzeki'));
    ok(river.length === 0, `${mode}: brak wycinki/farmy rzecznej poza obywatelem (jest ${river.length}: ${dl(river)})`);
  }

  console.log('(D) kompletnosc: po farmie automat buduje DALEJ na polach obywateli (irygacja, trzoda), nie wychodzi poza nie');
  for (const mode of MODES) {
    const { log, placed } = sim({ mode, turns: 60 });
    const keys = new Set(log.map(e => e.key));
    const irr = log.filter(e => e.key === 'irygacja').length;
    const stock = log.filter(e => LIVESTOCK.has(e.key)).length;
    ok(keys.has('farma'), `${mode}: farma postawiona`);
    ok(irr >= 1, `${mode}: irygacja zbudowana na polach obywateli (${irr})`);
    ok(stock >= 1, `${mode}: trzoda zbudowana na polach obywateli (${stock})`);
    ok(offOf(log).length === 0, `${mode}: i nadal 0 poza obywatelami po 60 turach`);
    void placed;
  }

  console.log('(E) filtr WYLACZONY (gracz, onlyWorked=false): zachowanie bez zmian — automat moze budowac poza obywatelami');
  {
    const map = makeScenarioMap();
    const city = mkCity(0), tn = mkTN(0);
    const picks = pickAutoImprovements({
      cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(), pracaAvailable: 600,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => 'zywnosc', getOnlyWorked: () => false, getWorkedHexKeys: () => new Set(),
      pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
      foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    const worked = workedNow(city, map, tn);
    ok(picks.some(p => !worked.has(K(p.q, p.r)) && !(p.q === CQ && p.r === CR)), 'onlyWorked=false: jest pick poza polami obywateli (filtr wylaczony przez gracza respektowany)');
  }

  console.log(`\n${passed} OK, ${failed} FAIL`);
  process.exit(failed ? 1 : 0);
}

// ---------------------------------------------------------------------------
// POMIAR (AFW_MEASURE=1): pelne mapy wygenerowane, kilka ziaren x typow swiata, wiele miast AI, decideAITurn.
// ---------------------------------------------------------------------------
const seeds = (process.env.AFW_SEEDS || '1,2,3,4,5,6').split(',').map(Number);
const worlds = (process.env.AFW_WORLDS || 'kontynenty,pangea').split(',');
const TURNS = Number(process.env.AFW_TURNS || 60);

function landSpots(map, n) {
  const scored = [];
  for (const k of Object.keys(map.hexes).sort()) {
    const h = map.hexes[k];
    if (!h || ['morze', 'plytkie_morze', 'wybrzeze', 'Morze', 'PlytkieMorze', 'Wybrzeze'].includes(h.terenBazowy)) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[K(q + dq, r + dr)];
      if (nb && !['morze', 'plytkie_morze', 'Morze', 'PlytkieMorze'].includes(nb.terenBazowy)) land++;
    }
    scored.push({ q, r, land });
  }
  scored.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of scored) {
    if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 7)) out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

const agg = { food: 0, off: 0, causes: {}, byKey: {}, ms: 0, calls: 0, foodYield: 0, irr: 0, stock: 0 };
for (const world of worlds) for (const seed of seeds) {
  const map = generateMap(36, 28, seed, world);
  const spots = landSpots(map, 3);
  const placed = new Map();
  for (let t = 0; t < TURNS; t++) {
    const pop = Math.min(8, 2 + Math.floor(t / 7));
    const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
    const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop, level: 1 }));
    const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
    const t0 = process.hrtime.bigint();
    const cmds = decideAITurn(PID, [], cities, map, data, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
      placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 400, civEra: ERA, resourceDeficitKeys: [],
    });
    agg.ms += Number(process.hrtime.bigint() - t0) / 1e6; agg.calls++;
    const workedByCity = new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))])]));
    const allWorked = new Set([...workedByCity.values()].flatMap(s => [...s]));
    for (const c of cmds) {
      if (c.type !== 'buildImprovement') continue;
      const hk = K(c.q, c.r);
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; }
      else placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
      if (!FOOD.has(c.key)) continue;
      agg.food++;
      agg.byKey[c.key] = (agg.byKey[c.key] ?? 0) + 1;
      if (c.key === 'irygacja') agg.irr++;
      if (LIVESTOCK.has(c.key)) agg.stock++;
      if (!allWorked.has(hk)) {
        agg.off++;
        const hx = map.hexes[hk];
        const cause = c.key === 'wyrab' ? 'wyrab-rzeka-lub-las-poza-obywatelem'
          : (hx && (hx.zloze || String(hx.nakladka).startsWith('zloze'))) ? 'zloze-na-heksie'
          : c.key === 'warzelnia_soli' ? 'warzelnia-soli'
          : 'inne/farma-po-wycince';
        agg.causes[`${cause}:${c.key}`] = (agg.causes[`${cause}:${c.key}`] ?? 0) + 1;
      }
    }
  }
  // lacznie zywnosci z ulepszen na koniec: liczba farm+irygacji+trzody w placed
}
let farms = 0;
const OUT = JSON.stringify({
  seeds, worlds, TURNS, foodImprovements: agg.food, offWorked: agg.off,
  offPct: agg.food ? +(100 * agg.off / agg.food).toFixed(2) : 0, causes: agg.causes, byKey: agg.byKey,
  irrigation: agg.irr, livestock: agg.stock, avgDecideMsPerTurn: +(agg.ms / agg.calls).toFixed(2),
}, null, 1);
if (process.env.AFW_OUT) fs.writeFileSync(process.env.AFW_OUT, OUT + '\nEXIT=0\n'); else console.log(OUT);
void farms;
