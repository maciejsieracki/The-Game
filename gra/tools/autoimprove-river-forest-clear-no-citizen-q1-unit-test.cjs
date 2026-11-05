'use strict';

/**
 * R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-NO-CITIZEN-Q1 (decyzja wlasciciela ABC odp. B + dopisek, 2026-11-05: „Wycinamy, niezaleznie
 * czy jest obywatel, czy go nie ma, a pozniej system sam przydzieli tam obywatela”): picker wycina las PRZY RZECE takze na heksie
 * BEZ obywatela. Test jednostkowy pickera (prawdziwa funkcja, zero atrap).
 *
 * KONTRAKT:
 *   (1) Zywnosc: las przy rzece (Laka/Rownina) BEZ obywatela dostaje wycinke;
 *   (2) Zrownowazone (K2/K3, demandDriven): to samo;
 *   (3) po wycince heks zostaje CZYSTY: zadnej farmy/irygacji/trzody na heksie bez obywatela (tylko wycinka jest wyjatkiem);
 *   (4) Wzgorza/Gory z lasem przy rzece bez obywatela NIE sa wycinane (teren bazowy pod farme);
 *   (5) las POZA rzeka bez obywatela NIE jest wycinany (wyjatek tylko rzeczny);
 *   (6) limit: nie wiecej niz RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY wycinek bez obywatela na miasto w jednym przebiegu;
 *   (7) kolejnosc: wycinka bez obywatela jest OSTATNIA (po pickach z obywatelem — nie zaglodzi innych ulepszen);
 *   (8) profil „surowce” (poza Zywnosc/Zrownowazone) nie dostaje wyjatku.
 *
 * Run z gra/:  node tools/autoimprove-river-forest-clear-no-citizen-q1-unit-test.cjs
 * Mutacje:     NOCIT_SRC_DIR=<kopia gra/src z mutacja> node tools/autoimprove-river-forest-clear-no-citizen-q1-unit-test.cjs (MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.NOCIT_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'river-nocit-q1-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements, RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo'];
const W = 24, H = 24, CQ = 12, CR = 12;
const K = (q, r) => `${q},${r}`;

function makeMap({ river = [], forest = [], hills = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  for (const [q, r] of hills) hexes[K(q, r)].terenBazowy = 'wzgorza';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'Mykeny', population: 3, ulepszeniaFocus: 'zywnosc' };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 3, level: 1 }];

function pick({ map, worked, focus = 'zywnosc', pracaAvailable = 400, placed = new Map(), clearing = new Set(), demandDriven = true, extra = {} }) {
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  return pickAutoImprovements({
    cities: [{ ...CITY, ulepszeniaFocus: focus }], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed,
    pracaAvailable, unlockedTechs: new Set(FULL), pracaSurplusThreshold: 0, skipWyrab: false, demandDriven,
    resourceDeficitKeys: [], getFocus: () => focus, getWorkedHexKeys: () => workedSet,
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 1,
    foodImprovementStages: () => true, clearingHexKeys: clearing, ...extra,
  });
}
const desc = picks => picks.map(p => p.key + '@' + K(p.q, p.r)).join(' ') || 'nic';

// Rzeka (12,10),(12,11),(13,10); w terytorium miasta (12,12). Pole obywatela: (11,12) (poza rzeka).
const RIVER = [[12, 10], [12, 11], [13, 10]];
const RIVER_FOREST = [12, 10];
const CITIZEN_FIELD = [[11, 12]];
const AROUND = [];
for (let q = 9; q <= 15; q++) for (let r = 9; r <= 15; r++) if (!(q === CQ && r === CR)) AROUND.push([q, r]);
const isNoCitClear = (p) => p.key === 'wyrab' && p.q === RIVER_FOREST[0] && p.r === RIVER_FOREST[1];

console.log('(1) Zywnosc: las przy rzece BEZ obywatela jest wycinany (NO-CITIZEN-Q1)');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST] });
  const picks = pick({ map, worked: CITIZEN_FIELD });
  console.log('      picks: ' + desc(picks));
  ok(picks.some(isNoCitClear), `wyrab@${K(...RIVER_FOREST)} bez obywatela wybrany`);
}

console.log('(2) Zrownowazone (K2/K3): to samo');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST] });
  const picks = pick({ map, worked: CITIZEN_FIELD, focus: 'zrownowazone' });
  console.log('      picks: ' + desc(picks));
  ok(picks.some(isNoCitClear), `K2: wyrab@${K(...RIVER_FOREST)} bez obywatela wybrany`);
}

console.log('(3) po wycince heks zostaje czysty — zadnej farmy/irygacji/trzody bez obywatela (przez 6 tur)');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST] });
  const placed = new Map();
  const bad = [];
  let cut = false;
  for (let t = 0; t < 6; t++) {
    const picks = pick({ map, worked: CITIZEN_FIELD, placed });
    for (const p of picks) {
      if (p.key === 'wyrab') { map.hexes[K(p.q, p.r)].nakladka = 'brak'; if (isNoCitClear(p)) cut = true; continue; }
      placed.set(K(p.q, p.r), [...(placed.get(K(p.q, p.r)) ?? []), p.key]);
      if (p.q === RIVER_FOREST[0] && p.r === RIVER_FOREST[1]) bad.push(p.key);
    }
  }
  ok(cut, 'heks zostal wyciety (kontrola)');
  ok(bad.length === 0, `zero ulepszen na heksie bez obywatela po wycince (jest: ${bad.join(',') || 'nic'})`);
}

console.log('(4) Wzgorza z lasem przy rzece bez obywatela NIE sa wycinane (teren bazowy pod farme)');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST], hills: [RIVER_FOREST] });
  const picks = pick({ map, worked: CITIZEN_FIELD });
  console.log('      picks: ' + desc(picks));
  ok(!picks.some(isNoCitClear), 'brak wycinki na wzgorzu bez obywatela');
}

console.log('(5) las POZA rzeka bez obywatela NIE jest wycinany');
{
  const map = makeMap({ river: RIVER, forest: AROUND.filter(([q, r]) => !(q >= 11 && q <= 14 && r >= 9 && r <= 12)) });
  const picks = pick({ map, worked: CITIZEN_FIELD });
  const far = picks.filter(p => p.key === 'wyrab');
  console.log('      picks: ' + desc(picks));
  ok(far.length === 0, `zero wycinek lasu poza rzeka bez obywatela (jest ${far.length})`);
}

console.log(`(6) limit: <= ${RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY} wycinek bez obywatela na miasto w jednym przebiegu`);
{
  const river = [[12, 9], [12, 10], [12, 11], [13, 10], [14, 10], [10, 10], [10, 11], [10, 9]];
  const map = makeMap({ river, forest: river });
  const picks = pick({ map, worked: CITIZEN_FIELD, pracaAvailable: 2000 });
  const n = picks.filter(p => p.key === 'wyrab').length;
  console.log('      picks: ' + desc(picks));
  ok(n >= 1, `wycinki sa (${n})`);
  ok(n <= RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY, `nie wiecej niz limit (${n} <= ${RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY})`);
}

console.log('(7) kolejnosc: wycinka bez obywatela idzie NA KONCU — po pickach z obywatelem (nie zagladza innych ulepszen)');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST] });
  const picks = pick({ map, worked: [...CITIZEN_FIELD, [13, 10]] });
  console.log('      picks: ' + desc(picks));
  const iNo = picks.findIndex(isNoCitClear);
  ok(iNo >= 0 && picks.slice(0, iNo).length > 0 && iNo === picks.length - 1, `wyrab bez obywatela jest ostatni (indeks ${iNo} z ${picks.length})`);
  // budzet ciasny: tylko farma (20) miesci sie z 22 — reszta 2 < 2.5, wycinka bez obywatela nie zabiera budzetu farmy
  const tight = pick({ map: makeMap({ river: RIVER, forest: [RIVER_FOREST] }), worked: [[13, 10]], pracaAvailable: 22 });
  console.log('      picks (Praca 22): ' + desc(tight));
  ok(tight.some(p => p.key === 'farma') && !tight.some(isNoCitClear), 'przy ciasnym budzecie farma (z obywatelem) wchodzi, wycinka bez obywatela nie zabiera jej budzetu');
}

console.log('(8) profil „surowce” nie dostaje wyjatku');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST] });
  const picks = pick({ map, worked: CITIZEN_FIELD, focus: 'surowce', demandDriven: false });
  console.log('      picks: ' + desc(picks));
  ok(!picks.some(isNoCitClear), 'surowce: brak wycinki rzecznej bez obywatela');
}

console.log('(9) nadpisanie limitu (AI: riverClearNoCitizenMaxPerCity) — 1 ogranicza, 0 wylacza');
{
  const river = [[12, 9], [12, 10], [12, 11], [13, 10], [14, 10], [10, 10], [10, 11], [10, 9]];
  const map = makeMap({ river, forest: river });
  const n1 = pick({ map, worked: CITIZEN_FIELD, pracaAvailable: 2000, extra: { riverClearNoCitizenMaxPerCity: 1 } }).filter(p => p.key === 'wyrab').length;
  const n0 = pick({ map, worked: CITIZEN_FIELD, pracaAvailable: 2000, extra: { riverClearNoCitizenMaxPerCity: 0 } }).filter(p => p.key === 'wyrab').length;
  ok(n1 === 1, `limit 1 -> dokladnie 1 wycinka bez obywatela (jest ${n1})`);
  ok(n0 === 0, `limit 0 -> zero wycinek bez obywatela (jest ${n0})`);
}

console.log('(10) podloga puli (riverClearNoCitizenPoolFloor): wycinka bierze tylko nadwyzke ponad podloge');
{
  const map = makeMap({ river: RIVER, forest: [RIVER_FOREST] });
  const hi = pick({ map, worked: CITIZEN_FIELD, pracaAvailable: 400, extra: { riverClearNoCitizenPoolFloor: 100000 } });
  const lo = pick({ map, worked: CITIZEN_FIELD, pracaAvailable: 400, extra: { riverClearNoCitizenPoolFloor: 0 } });
  ok(!hi.some(isNoCitClear), 'bardzo wysoka podloga -> brak wycinki bez obywatela');
  ok(lo.some(isNoCitClear), 'podloga 0 -> wycinka bez obywatela jest');
}

console.log('(11) licznik limitu: wycinki NA polu obywatela (rzeka) nie zuzywaja limitu wycinek bez obywatela');
{
  // dwa lasy przy rzece NA polach obywateli + dwa BEZ obywatela; limit 2 => oba bez obywatela musza dostac wycinke
  const river = [[12, 10], [12, 11], [13, 10], [14, 10]];
  const map = makeMap({ river, forest: river });
  const picks = pick({ map, worked: [[12, 11], [13, 10]], pracaAvailable: 2000 });
  const withCit = picks.filter(p => p.key === 'wyrab' && ((p.q === 12 && p.r === 11) || (p.q === 13 && p.r === 10))).length;
  const noCit = picks.filter(p => p.key === 'wyrab' && ((p.q === 12 && p.r === 10) || (p.q === 14 && p.r === 10))).length;
  console.log('      picks: ' + desc(picks));
  ok(withCit >= 1, `wycinki na polach obywateli sa (${withCit})`);
  ok(noCit === RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY, `wycinki bez obywatela = limit mimo wycinek z obywatelem (${noCit})`);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
