'use strict';
/**
 * R-WEB-AI-CITIZEN-HEX-SIBLING-EXCLUSION-Q1 — zbior pol obywateli liczony dla pickera ulepszen AI MUSI wykluczac heksy
 * „przegrane na rzecz blizszego miasta tego samego wlasciciela” (computeLostToNearerSiblingByCity) — ten sam zbior co
 * sciezka gracza i silnik tury (workedHexCoordsForCity). Prawdziwe funkcje, zadnych atrap.
 *
 * Run z gra/:   node tools/ai-citizen-hex-sibling-exclusion-test.cjs
 * Mutacja:      ACH_SRC_DIR=<kopia gra/src z mutacja> node tools/ai-citizen-hex-sibling-exclusion-test.cjs   (MUSI byc czerwony)
 * Szczegoly:    ACH_DUMP=1
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.ACH_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ach-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { aiWorkedHexKeysForCity, decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { computeLostToNearerSiblingByCity } from ${JSON.stringify(SRC + '/game/okolica')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { aiWorkedHexKeysForCity, decideAITurn, workedHexCoordsForCity, computeLostToNearerSiblingByCity } = require(bundle);
fs.rmSync(temp, { recursive: true, force: true });

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const PID = 3, ERA = 3;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);

// Dwa miasta tego samego wlasciciela na jednym rzedzie; pas rzeki + lasu w strefie spornej (blizej miasta B).
const W = 34, H = 30;
const A = { id: 'cityA', ownerId: PID, q: 8, r: 15, name: 'Alfa', population: 6 };
const B = { id: 'cityB', ownerId: PID, q: 15, r: 15, name: 'Beta', population: 6 };
const CITIES = [A, B];
const TN = CITIES.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop: c.population, level: 1 }));
function makeMap() {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: (q + r) % 5 === 0 ? 'laka' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  const river = [];
  for (let q = 10; q <= 13; q++) river.push([q, 15], [q, 14]);
  for (const [q, r] of river) {
    hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
    hexes[K(q, r)].nakladka = 'las';
    hexes[K(q, r)].terenBazowy = 'laka';
  }
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [river.map(([q, r]) => ({ q, r }))] };
}
const map = makeMap();
const lostByCity = computeLostToNearerSiblingByCity(CITIES, map);
const lostA = lostByCity.get(A.id) ?? new Set();
const lostB = lostByCity.get(B.id) ?? new Set();

console.log('== T1: geometria — sporne heksy istnieja i sa przypisane blizszemu miastu');
ok(lostA.size > 0, `miasto A przegrywa sporne heksy na rzecz B (${lostA.size})`);
ok(lostA.has(K(13, 15)) && !lostB.has(K(13, 15)), 'heks 13,15 (dystans A=5, B=2) przegrany przez A, nie przez B');

console.log('== T2: aiWorkedHexKeysForCity == zbior silnika (workedHexCoordsForCity z excludeHexKeys)');
const engineA = new Set(workedHexCoordsForCity(A, map, TN, lostByCity.get(A.id), ERA).map(h => K(h.q, h.r)));
const engineB = new Set(workedHexCoordsForCity(B, map, TN, lostByCity.get(B.id), ERA).map(h => K(h.q, h.r)));
const aiA = aiWorkedHexKeysForCity(A, map, TN, lostByCity, ERA);
const aiB = aiWorkedHexKeysForCity(B, map, TN, lostByCity, ERA);
const same = (x, y) => x.size === y.size && [...x].every(k => y.has(k));
ok(same(aiA, engineA), `A: zbior AI == zbior silnika (${aiA.size})`);
ok(same(aiB, engineB), `B: zbior AI == zbior silnika (${aiB.size})`);
ok([...aiA].every(k => !lostA.has(k)), 'A: zadne pole obywatela AI nie lezy w zbiorze przegranych');
const noExcl = aiWorkedHexKeysForCity(A, map, TN, undefined, ERA);
ok([...noExcl].some(k => lostA.has(k)), 'kontrola: BEZ wykluczenia zbior A zawiera sporne heksy przegrane (to byl blad)');
ok(!same(noExcl, aiA), 'wykluczenie zmienia zbior pol obywateli A');

console.log('== T3: decideAITurn z opts.improvementExcludeHexKeysByCity — wycinka tylko na polach obywateli wg silnika');
function planWyrab(excl) {
  const m = makeMap();
  const placed = new Map();
  const cuts = [];
  for (let t = 0; t < 6; t++) {
    const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
    const cmds = decideAITurn(PID, [], CITIES.map(c => ({ ...c })), m, data, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: TN,
      placedImprovements: new Map(placed), improvementTechs: TECHS, pracaAvailable: 600, civEra: ERA, currentTurn: 30,
      improvementExcludeHexKeysByCity: excl,
    });
    for (const c of cmds.filter(x => x.type === 'buildImprovement')) {
      const hk = K(c.q, c.r);
      if (c.key === 'wyrab') { cuts.push({ t, hk }); m.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
    }
  }
  return cuts;
}
const cutsExcl = planWyrab(lostByCity);
const cutsNone = planWyrab(undefined);
const engineUnion = new Set([...engineA, ...engineB]);
if (process.env.ACH_DUMP) {
  console.log('  cuts(excl)=', cutsExcl.map(c => c.hk).join(' '), '| cuts(none)=', cutsNone.map(c => c.hk).join(' '));
  console.log('  engineA-forest=', [...engineA].filter(k => map.hexes[k].nakladka === 'las').join(' '), '| engineB-forest=', [...engineB].filter(k => map.hexes[k].nakladka === 'las').join(' '));
  console.log('  lostA-forest=', [...lostA].filter(k => map.hexes[k].nakladka === 'las').join(' '));
}
ok(cutsExcl.length > 0, `AI wycina las przy rzece pod obywatelami (z wykluczeniem: ${cutsExcl.length} pol)`);
ok(cutsExcl.every(c => engineUnion.has(c.hk)), 'kazda wycinka AI (z wykluczeniem) lezy na polu obywatela wg silnika (suma A+B)');
const forestRiver = [...engineUnion].filter(k => map.hexes[k].nakladka === 'las' && map.hexes[k].rzeka.obecna);
ok(forestRiver.length > 0, `scenariusz ma las+rzeka pod obywatelem wg silnika (${forestRiver.length})`);
ok(forestRiver.every(k => cutsExcl.some(c => c.hk === k)), 'KAZDY las przy rzece pod obywatelem wg silnika zostal wyciety (z wykluczeniem)');
ok(JSON.stringify(planWyrab(lostByCity)) === JSON.stringify(cutsExcl), 'determinizm: ponowny przebieg z wykluczeniem identyczny');
ok(Array.isArray(cutsNone), 'bez opcji decideAITurn dziala jak dawniej (brak wyjatku)');

console.log(`\nWYNIK: ${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
