'use strict';
/**
 * R-WEB-AUTOIMPROVE-IRRIGATION-NOT-BUILT-Q1 (Operator R1): irygacja i trzoda po farmach na polach obywateli.
 * Prawdziwe funkcje (pickAutoImprovements / decideAITurn / generateMap / workedHexCoordsForCity), zadnych atrap pickera.
 *
 * (A) mapy Z rzekami (generator): w 100 turach, profile Zywnosc / Zrownowazone / AI — KAZDE pole obywatela z farma, plaskie
 *     i przy rzece, dostaje irygacje i trzode (0 „zalegajacych” przy wystarczajacym budzecie); 0 ulepszen zywnosciowych poza obywatelami.
 * (B) mapy BEZ rzek (regula KANON-ULEPSZENIA-ZYWNOSC-HODOWLA §3: irygacja i hodowla tylko przy rzece): farmy tak, irygacja/trzoda 0,
 *     kazda niezirygowana farma ma powod „brak rzeki”, picker nie wychodzi poza pola obywateli, a wskaznik „Budzet niewydany” swieci.
 * (C) prog budzetu: irygacja (koszt 60 = 3 x farma) przy 33% budzetu i rezerwie 30 powstaje dopiero od puli >= koszt/0.33.
 *
 * Run z gra/:   node tools/autoimprove-irrigation-after-farms-test.cjs
 * Mutacja:      AIR_SRC_DIR=<kopia gra/src z mutacja> node tools/autoimprove-irrigation-after-farms-test.cjs   (MUSI byc czerwony)
 * Pomiar:       AIR_MEASURE=1 node tools/...   (drukuje histogram przyczyn zamiast asercji)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AIR_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const MEASURE = process.env.AIR_MEASURE === '1';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'air-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements, freshSurplusReport, unspentBudgetWarning } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, freshSurplusReport, unspentBudgetWarning, decideAITurn, workedHexCoordsForCity, generateMap, getImprovementMeta, buildImprovementQualifier } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const ERA = 3, PID = 3;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);
const FOOD = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'oboz_lowiecki', 'lodzie_rybackie', 'warzelnia_soli', 'wyrab']);
const FOOD_KEYS_FOR_TEST = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'lodzie_rybackie', 'warzelnia_soli', 'wyrab']);
const LIVESTOCK = new Set(['bydlo', 'owce', 'lama']);
const FLAT_IRR = new Set(['laka', 'rownina', 'pustynia']);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

function landSpots(map, n) {
  const sc = [];
  for (const k of Object.keys(map.hexes).sort()) {
    const h = map.hexes[k];
    if (!h || ['morze', 'plytkie_morze', 'wybrzeze'].includes(h.terenBazowy)) continue;
    const [q, r] = k.split(',').map(Number);
    let land = 0;
    for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
      if (Math.abs(dq + dr) > 3) continue;
      const nb = map.hexes[K(q + dq, r + dr)];
      if (nb && !['morze', 'plytkie_morze'].includes(nb.terenBazowy)) land++;
    }
    sc.push({ q, r, land });
  }
  sc.sort((a, b) => (b.land - a.land) || (a.q - b.q) || (a.r - b.r));
  const out = [];
  for (const s of sc) { if (out.every(o => Math.abs(o.q - s.q) + Math.abs(o.r - s.r) > 7)) out.push(s); if (out.length >= n) break; }
  return out;
}

/** 100 tur, 3 miasta, budzet 40/ture kumulowany (jak pula Pracy), pelny filtr „Tylko pola z obywatelami”. */
function sim({ actor, world, seed, noRivers, turns = 100, budget = 40 }) {
  const map = generateMap(36, 28, seed, world);
  if (noRivers) { map.riverPaths = []; for (const h of Object.values(map.hexes)) h.rzeka = { obecna: false, krawedzie: [] }; }
  const riverSet = new Set();
  for (const p of map.riverPaths || []) for (const h of p) riverSet.add(K(h.q, h.r));
  for (const [k, h] of Object.entries(map.hexes)) if (h.rzeka && h.rzeka.obecna) riverSet.add(k);
  const riverAdj = (q, r) => riverSet.has(K(q, r)) || NB.some(([a, b]) => riverSet.has(K(q + a, r + b)));
  const spots = landSpots(map, 3);
  const placed = new Map();
  let pool = 0;
  const cnt = { farma: 0, irygacja: 0, stock: 0, offWorked: 0 };
  const mkCities = pop => spots.map((s, i) => ({ id: `c${i}`, ownerId: PID, q: s.q, r: s.r, name: `C${i}`, population: pop }));
  const mkTn = cs => cs.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop: c.population, level: 1 }));
  const workedMap = (cs, tn) => new Map(cs.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, undefined, ERA).map(h => K(h.q, h.r))])]));
  for (let t = 0; t < turns; t++) {
    pool += budget;
    const pop = Math.min(8, 2 + Math.floor(t / 7));
    const cities = mkCities(pop), tn = mkTn(cities), wbc = workedMap(cities, tn);
    const allW = new Set([...wbc.values()].flatMap(s => [...s]));
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
        getFocus: () => actor, getWorkedHexKeys: c => wbc.get(c.id) ?? new Set(),
        pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
        foodImprovementStages: () => true, clearingHexKeys: new Set(),
      });
    }
    let spent = 0;
    for (const c of cmds) {
      const hk = K(c.q, c.r);
      spent += getImprovementMeta(c.key)?.kosztPraca ?? 0;
      if (FOOD.has(c.key) && !allW.has(hk)) cnt.offWorked++;
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      const layers = [...(placed.get(hk) ?? []), c.key];
      placed.set(hk, layers);
      map.hexes[hk].ulepszenia = [...layers]; // jak syncHexUlepszenieFields w main.ts: ranking pol obywateli widzi ulepszenia
      if (c.key === 'farma') cnt.farma++;
      if (c.key === 'irygacja') cnt.irygacja++;
      if (LIVESTOCK.has(c.key)) cnt.stock++;
    }
    pool -= spent;
  }
  // stan koncowy: przyczyna braku irygacji na polu obywatela
  const popEnd = Math.min(8, 2 + Math.floor((turns - 1) / 7));
  const cities = mkCities(popEnd), tn = mkTn(cities), wbc = workedMap(cities, tn);
  const allW = new Set([...wbc.values()].flatMap(s => [...s]));
  const causes = {};
  for (const hk of allW) {
    const L = placed.get(hk) ?? [], h = map.hexes[hk];
    if (!h || !L.includes('farma')) continue;
    const [q, r] = hk.split(',').map(Number);
    let why;
    if (L.includes('irygacja')) why = 'zirygowane';
    else if (!FLAT_IRR.has(h.terenBazowy)) why = 'teren-nie-plaski';
    else if (!riverAdj(q, r)) why = 'brak-rzeki';
    else why = 'ZALEGA(plaski+rzeka, brak irygacji)';
    causes[why] = (causes[why] ?? 0) + 1;
  }
  let report = null;
  if (actor !== 'ai') {
    const wbcEnd = wbc;
    report = freshSurplusReport();
    const fin = pickAutoImprovements({
      surplusReport: report, cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: pool + 5000,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => actor, getWorkedHexKeys: c => wbcEnd.get(c.id) ?? new Set(),
      pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'grecy', playerEra: ERA,
      foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    // R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1 (wlasciciel 2026-11-04): regula obywateli dotyczy WYLACZNIE ulepszen zywnosciowych;
    // ulepszenia surowcowe/infrastrukturalne (np. drogi — ostatni priorytet K2) stawia sie gdziekolwiek, wiec liczy sie tylko ZYWNOSC.
    report.finalPicks = fin.filter(p => FOOD_KEYS_FOR_TEST.has(p.key)).length;
  }
  return { cnt, causes, pool, report };
}

const ACTORS = ['zywnosc', 'zrownowazone', 'ai'];
const SEEDS = [1, 2, 3];
const WORLDS = ['kontynenty', 'pangea'];

function runAll(noRivers) {
  const out = {};
  for (const actor of ACTORS) {
    const agg = { farma: 0, irygacja: 0, stock: 0, offWorked: 0, causes: {}, pool: 0, waiting: 0, anyCandidate: false, finalPicks: 0, warn: 0 };
    for (const world of WORLDS) for (const seed of SEEDS) {
      const r = sim({ actor, world, seed, noRivers });
      agg.farma += r.cnt.farma; agg.irygacja += r.cnt.irygacja; agg.stock += r.cnt.stock; agg.offWorked += r.cnt.offWorked; agg.pool += Math.round(r.pool);
      for (const [k, v] of Object.entries(r.causes)) agg.causes[k] = (agg.causes[k] ?? 0) + v;
      if (r.report) {
        agg.waiting += r.report.filterWaitingKeys.size; agg.anyCandidate = agg.anyCandidate || r.report.anyCandidate; agg.finalPicks += r.report.finalPicks;
        if (unspentBudgetWarning(r.report, { onlyWorkedOn: true, poolAboveReserve: true })) agg.warn++;
      }
    }
    out[actor] = agg;
  }
  return out;
}

if (MEASURE) {
  console.log(JSON.stringify({ zRzekami: runAll(false), bezRzek: runAll(true) }, null, 1));
  process.exit(0);
}

console.log('(A) mapy Z rzekami: irygacja i trzoda budowane na polach obywateli po farmach (Zywnosc, Zrownowazone, AI)');
const withRivers = runAll(false);
for (const actor of ACTORS) {
  const a = withRivers[actor];
  ok(a.farma >= 20, `${actor}: farmy postawione (${a.farma})`);
  ok(a.irygacja >= 20, `${actor}: irygacja zbudowana (${a.irygacja})`);
  ok(a.stock >= 20, `${actor}: trzoda zbudowana (${a.stock})`);
  ok((a.causes['ZALEGA(plaski+rzeka, brak irygacji)'] ?? 0) === 0, `${actor}: 0 pol obywatela z farma, plaskich i przy rzece, bez irygacji (jest ${a.causes['ZALEGA(plaski+rzeka, brak irygacji)'] ?? 0})`);
  ok(a.offWorked === 0, `${actor}: 0 ulepszen zywnosciowych poza polami obywateli (jest ${a.offWorked})`);
}

console.log('(B) mapy BEZ rzek: irygacja/trzoda niemozliwe z reguly gry (tylko przy rzece) — nie bug; budzet niewydany jest jawnie sygnalizowany');
const noRivers = runAll(true);
for (const actor of ACTORS) {
  const a = noRivers[actor];
  ok(a.farma >= 20, `${actor}: farmy nadal powstaja (${a.farma})`);
  ok(a.irygacja === 0 && a.stock === 0, `${actor}: irygacja ${a.irygacja} / trzoda ${a.stock} = 0 (regula: tylko przy rzece)`);
  const bug = a.causes['ZALEGA(plaski+rzeka, brak irygacji)'] ?? 0;
  ok(bug === 0 && (a.causes['brak-rzeki'] ?? 0) > 0, `${actor}: kazda niezirygowana farma ma powod „brak-rzeki” (${a.causes['brak-rzeki'] ?? 0}), zalegajacych ${bug}`);
  ok(a.offWorked === 0, `${actor}: 0 ulepszen zywnosciowych poza polami obywateli (jest ${a.offWorked})`);
  ok(a.pool > 0, `${actor}: pula Pracy niewydana (${a.pool}) — brak legalnego ulepszenia zywnosci przy obywatelach`);
  if (actor !== 'ai') {
    ok(a.finalPicks === 0, `${actor}: picker przy ogromnej puli nie ma ZADNEGO ulepszenia zywnosciowego na polach obywateli (zywnosciowych pickow ${a.finalPicks}); reszta (drogi) wg nowej reguly bez filtra obywateli`);
    ok(a.warn === WORLDS.length * SEEDS.length && a.waiting > 0, `${actor}: wskaznik „Budzet niewydany” swieci (${a.warn}/${WORLDS.length * SEEDS.length}, pol czeka ${a.waiting})`);
  }
}

console.log('(C) prog budzetu: irygacja 3 x droższa od farmy — przy 33% i rezerwie 30 rusza dopiero od puli >= koszt/0.33');
{
  const map = generateMap(36, 28, 1, 'pangea');
  const [spot] = landSpots(map, 1);
  const city = { id: 'c0', ownerId: PID, q: spot.q, r: spot.r, name: 'C0', population: 6 };
  const tn = [{ q: spot.q, r: spot.r, ownerId: PID, cityId: 'c0', pop: 6, level: 1 }];
  const worked = new Set(workedHexCoordsForCity(city, map, tn, undefined, ERA).map(h => K(h.q, h.r)));
  worked.add(K(spot.q, spot.r));
  const riverSet = new Set();
  for (const p of map.riverPaths || []) for (const h of p) riverSet.add(K(h.q, h.r));
  for (const [k, h] of Object.entries(map.hexes)) if (h.rzeka && h.rzeka.obecna) riverSet.add(k);
  const isRiverAdj = (q, r) => riverSet.has(K(q, r)) || NB.some(([a, b]) => riverSet.has(K(q + a, r + b)));
  const target = [...worked].filter(hk => hk !== K(spot.q, spot.r)).find(hk => {
    const h = map.hexes[hk], [q, r] = hk.split(',').map(Number);
    return h && FLAT_IRR.has(h.terenBazowy) && h.nakladka === 'brak' && !h.zloze && isRiverAdj(q, r);
  });
  ok(!!target, `scenariusz C: jest pole obywatela plaskie, puste, przy rzece (${target})`);
  const placed = new Map();
  for (const hk of worked) if (hk !== target) placed.set(hk, ['farma', 'bydlo', 'irygacja']);
  placed.set(target, ['farma', 'bydlo']);
  const cost = getImprovementMeta('irygacja').kosztPraca;
  const pct = 33, reserve = 30;
  const need = Math.ceil(cost / (pct / 100));
  const tryPool = pool => pickAutoImprovements({
    cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: pool,
    unlockedTechs: TECHS, pracaSurplusThreshold: reserve, skipWyrab: true, demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => 'zywnosc', getWorkedHexKeys: () => worked,
    pracaBudgetPercent: pct, getPracaBudgetPercent: () => pct, civArchetype: 'grecy', playerEra: ERA,
    foodImprovementStages: () => true, clearingHexKeys: new Set(),
  }).filter(p => p.key === 'irygacja');
  ok(cost === 60, `koszt irygacji = 60 (3 x farma 20) [jest ${cost}]`);
  ok(tryPool(need - 2).length === 0, `pula ${need - 2} (< ${need}): irygacja NIE powstaje (limit ${pct}% < koszt) — „budzet odkladany”`);
  ok(tryPool(need + 1).length === 1, `pula ${need + 1} (>= ${need}): irygacja powstaje`);
}

console.log('(D) PRZYCZYNA: sasiad z samym `rzeka.obecna` (bez wpisu w riverPaths) = „przy rzece” dla farmy/trzody (onRiverHex) — irygacja tez');
{
  const W = 30, H = 30, CQ = 15, CR = 15;
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  // jedyna rzeka: heks (18,15), widoczny (`rzeka.obecna`), ale BEZ wpisu w riverPaths — taki sam przypadek jak 1961 vs 1173 na mapie 778899
  hexes[K(18, 15)].rzeka = { obecna: true, krawedzie: [] };
  const map = { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
  const city = { id: 'c0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: 2 };
  const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'c0', pop: 2, level: 1 }];
  const worked = new Set([...workedHexCoordsForCity(city, map, tn, undefined, ERA).map(h => K(h.q, h.r)), K(CQ, CR)]);
  // heks docelowy: pole obywatela ze SASIADEM-rzeka (17,15) — wymuszamy go w zbiorze pracowanych
  const target = K(17, 15);
  worked.add(target);
  const placed = new Map();
  for (const hk of worked) placed.set(hk, hk === target ? ['farma', 'bydlo'] : ['farma', 'bydlo', 'irygacja']);
  const common = {
    cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: 900,
    unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: true, demandDriven: true, resourceDeficitKeys: [],
    getWorkedHexKeys: () => worked, pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100,
    civArchetype: 'grecy', playerEra: ERA, foodImprovementStages: () => true, clearingHexKeys: new Set(),
  };
  for (const focus of ['zywnosc', 'zrownowazone']) {
    const picks = pickAutoImprovements({ ...common, getFocus: () => focus });
    ok(picks.some(p => p.key === 'irygacja' && K(p.q, p.r) === target), `${focus}: irygacja na polu obywatela z farma+trzoda przy widocznej rzece (sasiad bez wpisu w riverPaths) — picki: ${picks.map(p => `${p.key}@${p.q},${p.r}`).join(' ') || 'brak'}`);
  }
  // R-WEB-IRRIGATION-RIVER-DEFINITION-UNIFY-Q1 (D2=A): flaga `visibleRiverNeighborCountsForIrrigation` USUNIETA — jedna definicja „przy rzece”;
  // reczna budowa (kwalifikator bez zadnej flagi) = automat: sasiad z samym `rzeka.obecna` KWALIFIKUJE irygacje.
  const stBase = {
    map, cityNodes: [{ q: CQ, r: CR, pop: 2, level: 1 }], territoryNodes: tn, playerOwnerIdNum: PID,
    placedImprovements: new Map([[target, ['farma', 'bydlo']]]), researchedTechs: TECHS, playerCivArchetype: 'grecy', playerEra: ERA,
  };
  const [tq, tr] = target.split(',').map(Number);
  ok(buildImprovementQualifier(stBase)('irygacja', tq, tr) === true, 'reczna budowa (bez flagi): irygacja przy sasiedzie `rzeka.obecna` KWALIFIKUJE (jedna definicja z automatem)');
  // brak jakiejkolwiek rzeki w poblizu — nic nie poszerza
  const farTarget = [K(13, 15), 13, 15];
  ok(buildImprovementQualifier({ ...stBase, placedImprovements: new Map([[farTarget[0], ['farma']]]) })('irygacja', farTarget[1], farTarget[2]) === false, 'heks bez rzeki w sasiedztwie nadal NIE kwalifikuje');
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
