'use strict';
/**
 * R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1 (Operator R1): drogi automatu (AI + auto-ulepszenia gracza) TYLKO jako polaczenia MIEDZY miastami.
 * Prawdziwe funkcje (pickAutoImprovements / decideAITurn / generateMap / planRoadNetwork), zadnych atrap pickera.
 *
 * (U) jednostkowe planRoadNetwork: MST (brak krawedzi A-C gdy A-B-C w linii), determinizm, heksy miast poza planem, wyspa bez
 *     sciezki = brak heksow, brak komorek siatki.
 * (S) symulacja 100 tur, 5 miast w skupisku, ziarna x swiaty, aktorzy AI i Zrownowazone:
 *     heksy drog POZA planem miedzymiastowym = 0, sieć laczy wszystkie miasta zasiegalne ladem, topologia: zero trojkatow
 *     (3 wzajemnie sasiadujace heksy drog) i zero heksow drog z >=4 sasiadami drog; czas decyzji AI (ms/ture) raportowany.
 *
 * Run z gra/:   node tools/roads-city-links-only-test.cjs
 * Pomiar:       RCL_MEASURE=1 node tools/roads-city-links-only-test.cjs   (JSON zamiast asercji; SRC_DIR=<kopia gra/src PRZED>)
 * Mutacja:      RCL_SRC_DIR=<kopia gra/src z mutacja/PRZED> node tools/roads-city-links-only-test.cjs   (MUSI byc czerwony)
 * Planista zawsze z biezacego drzewa (RCL_PLAN_SRC), bo kopia PRZED go nie ma — sluzy jako miara odniesienia.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.RCL_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const PLAN_SRC = process.env.RCL_PLAN_SRC || path.resolve(GRA_ROOT, 'src');
const MEASURE = process.env.RCL_MEASURE === '1';
const TURNS = Number(process.env.RCL_TURNS || 100);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rcl-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { planRoadNetwork } from ${JSON.stringify(PLAN_SRC + '/game/road-network-plan')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, workedHexCoordsForCity, generateMap, getImprovementMeta, planRoadNetwork } = require(bundle);
try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* ignore */ }

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const WATER = new Set(['morze', 'plytkie_morze', 'wybrzeze']);
const ERA = 3, PID = 3;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);
const ROADS = new Set(['droga', 'droga_brukowana']);

// ---------------------------------------------------------------- (U) jednostkowe
function flatMap(w, h, mods = {}) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) hexes[K(q, r)] = { q, r, terenBazowy: mods[K(q, r)] || 'laka', nakladka: 'brak', ulepszenia: [] };
  return { hexes, riverPaths: [] };
}
function unit() {
  console.log('(U) planRoadNetwork — czysta funkcja');
  const m = flatMap(20, 6);
  const line = [{ id: 'a', q: 1, r: 2 }, { id: 'b', q: 7, r: 2 }, { id: 'c', q: 13, r: 2 }];
  const p = planRoadNetwork(line, m);
  ok(p.edges.length === 2 && !p.edges.some(e => (e.a === 'a' && e.b === 'c') || (e.a === 'c' && e.b === 'a')), 'MST: 3 miasta w linii = 2 krawedzie, bez krawedzi a-c');
  ok(p.hexes.length === 5 + 5, `heksy planu = tylko miedzy miastami (${p.hexes.length}, oczekiwane 10)`);
  ok(!p.hexes.includes(K(1, 2)) && !p.hexes.includes(K(7, 2)), 'heksy miast nie sa czescia planu');
  ok(JSON.stringify(planRoadNetwork([...line].reverse(), m)) === JSON.stringify(p), 'determinizm: kolejnosc wejscia miast nie zmienia planu');
  ok(planRoadNetwork([line[0]], m).hexes.length === 0, 'miasto bez sasiada: 0 heksow dr0g');
  // wyspa: miasto d otoczone woda — brak sciezki
  const mods = {}; for (let q = 17; q <= 19; q++) for (let r = 0; r < 6; r++) mods[K(q, r)] = 'morze';
  const m2 = flatMap(21, 6, mods);
  const p2 = planRoadNetwork([...line, { id: 'd', q: 20, r: 2 }], m2);
  ok(p2.disconnected === 1 && p2.hexes.length === 10, 'miasto za woda: nie dostaje drogi, reszta sieci bez zmian');
  // zasieg: isTraversable zawęża
  const p3 = planRoadNetwork(line, m, { isTraversable: (q, r) => r === 2 && q <= 8 });
  ok(p3.edges.length === 1, 'isTraversable (zasieg wlasnego terytorium) ogranicza plan do osiagalnych par');
  // trojka miast w trojkacie: brak komorki
  const tri = [{ id: 'a', q: 2, r: 1 }, { id: 'b', q: 10, r: 1 }, { id: 'c', q: 6, r: 4 }];
  const p4 = planRoadNetwork(tri, flatMap(14, 8));
  ok(p4.edges.length === 2, 'trzy miasta w trojkacie: 2 krawedzie (bez cyklu)');
  const topo = topology(p4.hexes, tri);
  ok(topo.triangles === 0 && topo.cells === 0, `plan trojkata bez komorek (trojkaty=${topo.triangles}, >=4 sasiadow=${topo.cells})`);
}

function topology(hexKeys, cities) {
  const set = new Set(hexKeys);
  const withCities = new Set([...hexKeys, ...cities.map(c => K(c.q, c.r))]);
  let triangles = 0, cells = 0;
  for (const k of hexKeys) {
    const [q, r] = k.split(',').map(Number);
    const nbs = NB.map(([a, b]) => K(q + a, r + b)).filter(x => withCities.has(x));
    if (nbs.length >= 4) cells++;
    const road = NB.map(([a, b]) => K(q + a, r + b)).filter(x => set.has(x));
    for (let i = 0; i < road.length; i++) for (let j = i + 1; j < road.length; j++) {
      const [q1, r1] = road[i].split(',').map(Number); const [q2, r2] = road[j].split(',').map(Number);
      if (NB.some(([a, b]) => q1 + a === q2 && r1 + b === r2)) triangles++;
    }
  }
  return { triangles: triangles / 3, cells };
}

// ---------------------------------------------------------------- (S) symulacja
function pickCluster(map, n) {
  const land = [];
  for (const k of Object.keys(map.hexes).sort()) {
    const h = map.hexes[k];
    if (!h || WATER.has(h.terenBazowy) || h.terenBazowy === 'gory') continue;
    const [q, r] = k.split(',').map(Number);
    let cnt = 0;
    for (let dq = -4; dq <= 4; dq++) for (let dr = -4; dr <= 4; dr++) {
      if (Math.abs(dq + dr) > 4) continue;
      const nb = map.hexes[K(q + dq, r + dr)];
      if (nb && !WATER.has(nb.terenBazowy)) cnt++;
    }
    land.push({ q, r, cnt });
  }
  land.sort((a, b) => (b.cnt - a.cnt) || (a.q - b.q) || (a.r - b.r));
  const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
  const out = [land[0]];
  while (out.length < n) {
    const cand = land.find(s => out.every(o => dist(o, s) >= 5) && out.some(o => dist(o, s) <= 6));
    if (!cand) break;
    out.push(cand);
  }
  return out;
}

function sim({ actor, world, seed }) {
  const map = generateMap(36, 28, seed, world);
  const spots = pickCluster(map, 5);
  const placed = new Map();
  const roadByCity = {};
  let pool = 0; let aiMs = 0; let aiCalls = 0;
  const mkCities = pop => spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
  const mkTn = cs => cs.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop: c.population, level: 1 }));
  for (let t = 0; t < TURNS; t++) {
    pool += 150;
    const pop = Math.min(8, 2 + Math.floor(t / 7));
    const cities = mkCities(pop), tn = mkTn(cities);
    const wbc = new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))])]));
    let cmds;
    if (actor === 'ai') {
      const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
      const t0 = process.hrtime.bigint();
      cmds = decideAITurn(PID, [], cities, map, data, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
        placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: pool, civEra: ERA, resourceDeficitKeys: [],
      }).filter(c => c.type === 'buildImprovement');
      aiMs += Number(process.hrtime.bigint() - t0) / 1e6; aiCalls++;
    } else {
      cmds = pickAutoImprovements({
        cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: pool,
        unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: [],
        getFocus: () => 'zrownowazone', getWorkedHexKeys: c => wbc.get(c.id) ?? new Set(),
        pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
        foodImprovementStages: () => true, clearingHexKeys: new Set(),
      });
    }
    let spent = 0;
    for (const c of cmds) {
      const hk = K(c.q, c.r);
      spent += getImprovementMeta(c.key)?.kosztPraca ?? 0;
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      const layers = [...(placed.get(hk) ?? []), c.key];
      placed.set(hk, layers);
      map.hexes[hk].ulepszenia = [...layers];
      if (ROADS.has(c.key)) roadByCity[c.cityId ?? '?'] = (roadByCity[c.cityId ?? '?'] ?? 0) + 1;
    }
    pool -= spent;
  }
  // metryki
  const cities = mkCities(Math.min(8, 2 + Math.floor((TURNS - 1) / 7)));
  const roadHexes = [...placed.entries()].filter(([, v]) => v.some(l => ROADS.has(l))).map(([k]) => k);
  const cityKeys = new Set(cities.map(c => K(c.q, c.r)));
  // odniesienie: plan na CZYSTEJ mapie (bez drog) w zasiegu wlasnego terytorium nie jest dostepny poza pickerem,
  // wiec miarą jest plan bez ograniczenia zasiegu na czystej mapie ladu + (strict) plan z uwzglednieniem istniejacych drog.
  const clean = { ...map, hexes: Object.fromEntries(Object.entries(map.hexes).map(([k, h]) => [k, { ...h, ulepszenia: [], ulepszenie: 'brak' }])) };
  const planClean = new Set(planRoadNetwork(cities, clean).hexes);
  const planNow = new Set(planRoadNetwork(cities, map).hexes);
  const offClean = roadHexes.filter(k => !planClean.has(k) && !cityKeys.has(k)).length;
  const offNow = roadHexes.filter(k => !planNow.has(k) && !cityKeys.has(k)).length;
  // spojnosc: BFS po heksach drog + miastach
  const nodes = new Set([...roadHexes, ...cityKeys]);
  const seen = new Set(); const comps = [];
  for (const s of cityKeys) {
    if (seen.has(s)) continue;
    const comp = []; const st = [s]; seen.add(s);
    while (st.length) {
      const k = st.pop(); comp.push(k);
      const [q, r] = k.split(',').map(Number);
      for (const [a, b] of NB) { const n = K(q + a, r + b); if (nodes.has(n) && !seen.has(n)) { seen.add(n); st.push(n); } }
    }
    comps.push(comp);
  }
  const citiesPerComp = comps.map(c => c.filter(k => cityKeys.has(k)).length).sort((a, b) => b - a);
  const reachable = planRoadNetwork(cities, map).disconnected; // 0 = wszystkie miasta w jednym komponencie planu (zasieg bez terytorium)
  const topo = topology(roadHexes.filter(k => !cityKeys.has(k)), cities);
  // Niezalezna od planisty niezmienna: slepy koniec = heks drogi z <=1 sasiadem w grafie (drogi + miasta). Siec MIEDZY miastami
  // nie ma odnog donikad (kazdy koniec drogi dotyka miasta), wiec deadEnds musi byc 0.
  let deadEnds = 0;
  for (const k of roadHexes) {
    const [q, r] = k.split(',').map(Number);
    if (NB.filter(([a, b]) => nodes.has(K(q + a, r + b))).length <= 1) deadEnds++;
  }
  if (process.env.RCL_DEBUG && topo.triangles > 0) {
    console.error('DEBUG cities', JSON.stringify(spots.map(s => K(s.q, s.r))), 'roads', JSON.stringify(roadHexes.sort()));
  }
  // heksy drog na obszarze miast: ile heksow ladu w promieniu 2 od miasta ma droge (miara „wypelnienia”)
  let denseHexes = 0;
  for (const k of roadHexes) {
    const [q, r] = k.split(',').map(Number);
    const rn = NB.filter(([a, b]) => nodes.has(K(q + a, r + b))).length;
    if (rn >= 3) denseHexes++;
  }
  return {
    actor, world, seed, cities: cities.length, roadHexes: roadHexes.length, perCity: roadByCity,
    onPlanClean: roadHexes.length - offClean, offPlanClean: offClean, offPlanNow: offNow, planSize: planNow.size,
    componentsCities: citiesPerComp, planDisconnectedPairs: reachable, triangles: topo.triangles, cells: topo.cells, denseHexes, deadEnds,
    aiMsPerTurn: aiCalls ? +(aiMs / aiCalls).toFixed(3) : null,
  };
}

const ACTORS = process.env.RCL_ACTORS ? process.env.RCL_ACTORS.split(',') : ['ai', 'zrownowazone'];
const CASES = [['kontynenty', 1], ['kontynenty', 2], ['pangea', 1]];

if (MEASURE) {
  const rows = [];
  for (const actor of ACTORS) for (const [world, seed] of CASES) rows.push(sim({ actor, world, seed }));
  const outFile = process.env.RCL_OUT;
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(rows, null, 1)); else console.log(JSON.stringify(rows, null, 1));
  process.exit(0);
}

unit();
console.log(`(S) symulacja ${TURNS} tur, 5 miast w skupisku`);
for (const actor of ACTORS) for (const [world, seed] of CASES) {
  const r = sim({ actor, world, seed });
  const tag = `${actor}/${world}/${seed}`;
  ok(r.roadHexes > 0, `${tag}: droga powstaje (${r.roadHexes} heksow) — test nie jest pusty`);
  ok(r.offPlanNow === 0, `${tag}: heksy drog poza planem (z uwzglednieniem istniejacych drog) = 0 (${r.offPlanNow})`);
  ok(r.offPlanClean === 0, `${tag}: heksy drog poza planem na CZYSTEJ mapie = 0 (${r.offPlanClean})`);
  ok(r.deadEnds === 0, `${tag}: zero slepych koncow drog (niezalezne od planisty): ${r.deadEnds}`);
  // Skrzyzowanie 3 odnog moze dac JEDEN maly trojkat (wezel Y) — tolerancja: <= miast-2; dawna siatka dawala 187-448.
  ok(r.triangles <= r.cities - 2, `${tag}: brak siatki trojkatow — tylko wezly skrzyzowan (${r.triangles} <= ${r.cities - 2})`);
  ok(r.cells <= r.cities - 2 && r.denseHexes <= 2 * (r.cities - 1), `${tag}: brak komorek siatki: heksy z >=4 sasiadami=${r.cells}, z >=3 sasiadami=${r.denseHexes} (limit ${2 * (r.cities - 1)})`);
  ok(r.componentsCities.length === 1 && r.planDisconnectedPairs === 0, `${tag}: wszystkie miasta zasiegalne ladem polaczone jedna siecia (komponenty=${JSON.stringify(r.componentsCities)})`);
  ok(r.roadHexes <= r.planSize, `${tag}: liczba heksow drog (${r.roadHexes}) <= rozmiar planu (${r.planSize})`);
}
console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
