'use strict';

/**
 * R-WEB-AUTOIMPROVE-RIVER-FOREST-FIRST-PRIORITY-Q1 (zgłoszenie właściciela 2026-11-05): wycinka lasu PRZY RZECE na polu
 * obywatela (farma możliwa: Łąka/Równina) ma być PIERWSZYM krokiem tury automatu — przed farmą na rzece bez lasu (E1),
 * przed niedoborem (KROK 1 K2/K3) i przed resztą etapów żywności.
 *
 * KONTRAKT:
 *   (1) tura 0, profil Żywność: las przy rzece na polu obywatela + farma na rzece BEZ lasu na innym polu obywatela
 *       → PIERWSZY pick to wycinka na heksie rzeki (przed farmą; E1 nie wyprzedza wycinki);
 *   (2) to samo dla „Zrównoważone” (K2) z niedoborem kamienia → wycinka rzeczna nadal pierwsza;
 *   (3) budżet ciasny (Praca 22 — wycinka 2.5 mieści się, farma 20 już nie): wycinka rzeczna wybrana, farma nie
 *       w tej samej turze (wycinka nie jest blokowana przez budżet farmy);
 *   (4) wzgórze z lasem przy rzece (farma niemożliwa) NIE jest wycinane — bramka `wyrabMaSens` zachowana;
 *   (5) las przy rzece NIE na polu obywatela (onlyWorked ON) NIE jest wycinany — filtr obywateli zachowany;
 *   (6) realistycznie w sim: wycinka rzeczna pojawia się w turze 0 (przed jakąkolwiek farmą na rzece).
 *
 * Run z gra/:  node tools/autoimprove-river-forest-first-q1-test.cjs
 * Mutacja:     AUTOIMPROVE_FIRST_SRC_DIR=<kopia gra/src z mutacja> node tools/autoimprove-river-forest-first-q1-test.cjs (MUSI być czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTOIMPROVE_FIRST_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'river-first-q1-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements } = require(bundle);

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

function pick({ map, worked, focus = 'zywnosc', pracaAvailable = 400, deficit = [], placed = new Map(), clearing = new Set(), onlyWorked = true }) {
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  return pickAutoImprovements({
    cities: [{ ...CITY, ulepszeniaFocus: focus }], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed,
    pracaAvailable, unlockedTechs: new Set(FULL), pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true,
    resourceDeficitKeys: deficit, getFocus: () => focus, getOnlyWorked: () => onlyWorked, getWorkedHexKeys: () => workedSet,
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 1,
    foodImprovementStages: () => true, clearingHexKeys: clearing,
  });
}
const desc = picks => picks.map(p => p.key + '@' + K(p.q, p.r)).join(' ') || 'nic';

// Rzeka (12,10),(12,11),(13,10). Las na (12,10) — heks RZEKI z lasem (wycinka rzeczna). (13,10) — rzeka BEZ lasu (farma E1).
const RIVER = [[12, 10], [12, 11], [13, 10]];
const RIVER_FOREST = [12, 10];
const RIVER_PLAIN = [13, 10];
const AROUND_FOREST = [];
for (let q = 9; q <= 15; q++) for (let r = 9; r <= 15; r++) if (!(q === CQ && r === CR)) AROUND_FOREST.push([q, r]);
const FOREST = [...AROUND_FOREST.filter(([q, r]) => !(q === RIVER_PLAIN[0] && r === RIVER_PLAIN[1]))];
const isRiverForestPick = (p) => p.key === 'wyrab' && p.q === RIVER_FOREST[0] && p.r === RIVER_FOREST[1];

console.log('(1) tura 0, Żywność: wycinka rzeczna pierwsza, przed farmą na rzece bez lasu');
{
  const map = makeMap({ river: RIVER, forest: FOREST });
  const picks = pick({ map, worked: [RIVER_FOREST, RIVER_PLAIN, [11, 12]] });
  console.log('      picks: ' + desc(picks));
  ok(picks.length > 0 && isRiverForestPick(picks[0]), `pierwszy pick = wyrab@${K(...RIVER_FOREST)} (jest: ${desc(picks.slice(0, 2))})`);
  ok(picks.some(p => p.key === 'farma' && p.q === RIVER_PLAIN[0] && p.r === RIVER_PLAIN[1]) === false
    || picks.findIndex(isRiverForestPick) < picks.findIndex(p => p.key === 'farma'),
  'wycinka rzeczna stoi przed farmą E1 na rzece bez lasu');
}

console.log('(2) „Zrównoważone” (K2) z niedoborem kamienia: wycinka rzeczna nadal pierwsza');
{
  const map = makeMap({ river: RIVER, forest: FOREST });
  const picks = pick({ map, worked: [RIVER_FOREST, RIVER_PLAIN], focus: 'zrownowazone', deficit: ['kamien'] });
  console.log('      picks: ' + desc(picks));
  ok(picks.length > 0 && isRiverForestPick(picks[0]), `pierwszy pick (K2 + niedobór) = wyrab@${K(...RIVER_FOREST)} (jest: ${desc(picks.slice(0, 2))})`);
}

console.log('(3) budżet ciasny (Praca 22): wycinka rzeczna (2.5) wybrana, farma (20) nie wchodzi w tę samą turę');
{
  const map = makeMap({ river: RIVER, forest: FOREST });
  const picks = pick({ map, worked: [RIVER_FOREST, RIVER_PLAIN], pracaAvailable: 22 });
  console.log('      picks: ' + desc(picks));
  ok(picks.length > 0 && isRiverForestPick(picks[0]), `pierwszy pick = wyrab rzeczny przy Pracy 22 (jest: ${desc(picks)})`);
  ok(!picks.some(p => p.key === 'farma'), 'farma nie zmieściła się po wycince (budżet) — brak farmy w tej turze');
}

console.log('(4) wzgórze z lasem przy rzece (farma niemożliwa) NIE jest wycinane pierwsze');
{
  const HILL_RIVER = [[12, 10]];
  const map = makeMap({ river: [[12, 10], [12, 11]], forest: [[12, 10]], hills: [[12, 10]] });
  const picks = pick({ map, worked: [[12, 10]] });
  console.log('      picks: ' + desc(picks));
  ok(!picks.some(p => p.key === 'wyrab' && p.q === 12 && p.r === 10), 'brak wycinki na wzgórzu (wyrabMaSens)');
  ok(HILL_RIVER.length === 1, 'scenariusz: wzgórze przy rzece');
}

console.log('(5) NO-CITIZEN-Q1 (wlasciciel ABC odp. B, 2026-11-05): las przy rzece BEZ obywatela jest wycinany, ale DOPIERO NA KONCU (po pickach obywatela, z reszty budzetu)');
{
  const map = makeMap({ river: RIVER, forest: FOREST });
  const picks = pick({ map, worked: [[11, 12]] });
  console.log('      picks: ' + desc(picks));
  const idxNoCit = picks.findIndex(p => p.key === 'wyrab' && p.q === RIVER_FOREST[0] && p.r === RIVER_FOREST[1]);
  ok(idxNoCit >= 0, 'heks rzeki z lasem bez obywatela dostaje wycinke (NO-CITIZEN-Q1)');
  ok(idxNoCit === picks.length - 1 || picks.slice(idxNoCit).every(p => p.key === 'wyrab'), 'wycinka bez obywatela idzie na koncu (nie wyprzedza pickow obywatela)');
  ok(picks[0] && !(picks[0].q === RIVER_FOREST[0] && picks[0].r === RIVER_FOREST[1]), 'wycinka bez obywatela NIE jest pierwszym pickiem');
}

console.log('(6) sim: wycinka rzeczna w turze 0 (przed jakąkolwiek farmą na rzece)');
{
  const map = makeMap({ river: RIVER, forest: FOREST });
  const picks0 = pick({ map, worked: [RIVER_FOREST, RIVER_PLAIN] });
  const firstRiverClear = picks0.findIndex(isRiverForestPick);
  const firstFarmRiver = picks0.findIndex(p => p.key === 'farma' && p.q === RIVER_PLAIN[0] && p.r === RIVER_PLAIN[1]);
  ok(firstRiverClear === 0, `tura 0: wycinka rzeczna jest pierwszym krokiem (indeks ${firstRiverClear})`);
  ok(firstFarmRiver === -1 || firstRiverClear < firstFarmRiver, `farma rzeczna (indeks ${firstFarmRiver}) nie wyprzedza wycinki`);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
