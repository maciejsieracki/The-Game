#!/usr/bin/env node
/**
 * R-WEB-ROADS-REACH-CITY-HEX-REGRESSION-Q2 — droga miedzy miastami musi DOCHODZIC do heksu miasta.
 *
 * Zgloszenie wlasciciela (2026-11-16): „Znowu drogi nie wchodza do miasta.” — pasy drog kanczaja sie PRZED heksem miasta.
 * Przyczyna (odtworzona na realnych funkcjach): plan sieci (`planRoadNetwork`) swiadomie pomija heksy miast
 * (Q1: „miasto jest wezlem, nie droga”), wiec droga automatu konczy sie na heksie SASIADUJACYM z miastem. Heks miasta
 * nie ma `droga` => maska ramion renderera (`computeRoadMask`) nie rysuje ramienia do centrum i pas wyglada na
 * urwany przed miastem. Istniejacy test `roads-city-links-only-test.cjs` tego nie lapal: BFS traktuje miasta jako wezly
 * z gory polaczone, bez wymogu drogi na heksie miasta.
 *
 * Asercje (sim automatu: AI `decideAITurn` i auto-ulepszenia gracza `pickAutoImprovements`, wiele tur, realne funkcje):
 *   (A) kazde miasto, ktore ma krawedz w planie sieci (planRoadNetwork.edges), ma `droga` na SWOIM heksie;
 *   (B) renderer: maska ramion heksu miasta (`computeRoadMask`) jest niezerowa, gdy miasto ma sasiada z droga;
 *   (C) BFS po heksach drog (BEZ traktowania miast jako wezlow) laczy wszystkie miasta z krawedzia w planie
 *       przez heksy drog, czyli ciaglosc w danych od miasta do miasta.
 *
 * Run z gra/:   node tools/roads-reach-city-hex-test.cjs
 * Mutacja:      RRC_SRC_DIR=<kopia gra/src z cofnietą poprawką> node tools/roads-reach-city-hex-test.cjs   (MUSI byc czerwony)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.RRC_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TURNS = Number(process.env.RRC_TURNS || 100);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rrc-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { planRoadNetwork } from ${JSON.stringify(SRC + '/game/road-network-plan')};
export { computeRoadMask } from ${JSON.stringify(SRC + '/map/road-network')};
export { hexHasRoad } from ${JSON.stringify(SRC + '/map/road-movement')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, workedHexCoordsForCity, generateMap, getImprovementMeta, planRoadNetwork, computeRoadMask, hexHasRoad } = require(bundle);
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

/** Symulacja automatu przez TURNS tur; zwraca stan po ostatniej turze. */
function sim({ actor, world, seed }) {
  const map = generateMap(36, 28, seed, world);
  const spots = pickCluster(map, 5);
  const placed = new Map();
  let pool = 0;
  const pop = 8;
  const cities = spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
  const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop: c.population, level: 1 }));
  const wbc = new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))])]));
  for (let t = 0; t < TURNS; t++) {
    pool += 150;
    let cmds;
    if (actor === 'ai') {
      const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
      cmds = decideAITurn(PID, [], cities, map, data, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
        placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: pool, civEra: ERA, resourceDeficitKeys: [],
      }).filter(c => c.type === 'buildImprovement');
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
    }
    pool -= spent;
  }
  return { map, cities };
}

const hasRoadAt = map => (q, r) => {
  const hex = map.hexes[K(q, r)];
  return !!hex && hexHasRoad(hex);
};

function check(tag, { map, cities }) {
  const roadKeys = new Set(Object.keys(map.hexes).filter(k => hexHasRoad(map.hexes[k])));
  const plan = planRoadNetwork(cities, map);
  const linked = new Set(plan.edges.flatMap(e => [e.a, e.b]));
  const withEdge = cities.filter(c => linked.has(c.id));
  ok(roadKeys.size > 0 && withEdge.length >= 2, `${tag}: droga powstaje i plan ma krawedzie (drogi=${roadKeys.size}, miast z krawedzia=${withEdge.length})`);

  // (A) heks miasta z krawedzia w planie ma droge
  const noCityRoad = withEdge.filter(c => !roadKeys.has(K(c.q, c.r)));
  ok(noCityRoad.length === 0, `${tag}: (A) kazde miasto z krawedzia ma droge na swoim heksie (bez drogi: ${noCityRoad.map(c => c.id).join(',') || 'brak'})`);

  // (B) renderer: droga na heksie SASIADUJACYM z miastem ma ramie w strone centrum miasta (maska `computeRoadMask`
  // ramienia liczy sie tylko, gdy heks miasta ma droge). Ramie = bit kierunku do miasta w masce sasiada.
  const hr = hasRoadAt(map);
  const armBad = [];
  for (const c of withEdge) {
    for (const [a, b] of NB) {
      const nq = c.q + a, nr = c.r + b;
      if (!roadKeys.has(K(nq, nr))) continue;
      const real = computeRoadMask(nq, nr, hr);
      const onlyCity = computeRoadMask(nq, nr, (q, r) => q === c.q && r === c.r);
      if ((real & onlyCity) === 0) armBad.push(`${c.id}@${K(nq, nr)}`);
    }
  }
  ok(armBad.length === 0, `${tag}: (B) renderer: droga przy miescie ma ramie do centrum miasta (bez ramienia: ${armBad.slice(0, 6).join(' ') || 'brak'})`);

  // (C) ciaglosc w danych przez heksy drog (miasta NIE sa wezlami z gory — musza miec droge)
  const nodes = new Set([...roadKeys]);
  const seen = new Set(); const comps = [];
  for (const s of roadKeys) {
    if (seen.has(s)) continue;
    const comp = []; const st = [s]; seen.add(s);
    while (st.length) {
      const k = st.pop(); comp.push(k);
      const [q, r] = k.split(',').map(Number);
      for (const [a, b] of NB) { const n = K(q + a, r + b); if (nodes.has(n) && !seen.has(n)) { seen.add(n); st.push(n); } }
    }
    comps.push(comp);
  }
  const compOfCity = c => comps.findIndex(comp => comp.includes(K(c.q, c.r)));
  const cityComps = new Set(withEdge.map(c => compOfCity(c)));
  ok(withEdge.length > 0 && cityComps.size === 1 && !cityComps.has(-1),
    `${tag}: (C) miasta z krawedzia polaczone ciagiem drog przez heksy drog (skladowe miast=${JSON.stringify([...cityComps])})`);
}

const CASES = [['kontynenty', 1], ['kontynenty', 2], ['pangea', 1]];
const ACTORS = process.env.RRC_ACTORS ? process.env.RRC_ACTORS.split(',') : ['ai', 'zrownowazone'];

console.log(`(R) odtworzenie: drogi docieraja do heksu miasta (symulacja ${TURNS} tur)`);
for (const actor of ACTORS) for (const [world, seed] of CASES) {
  check(`${actor}/${world}/${seed}`, sim({ actor, world, seed }));
}
console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
