'use strict';

/**
 * R-WEB-AUTOCLEAR-RIVER-FOREST-PRIORITY-Q2 (zgloszenie wlasciciela 2026-11-03): miasto w lesie z rzeka, tryb Zywnosc,
 * „Tylko pola z obywatelami” ON, „Wolno wycinac las” ON, pula 100% — automat NIE wycina lasu przy rzece (pod farmy).
 *
 * KONTRAKT:
 *   (a) las NA rzece BEZ obywatela (onlyWorked ON): wycinka (rzeka+las) i tak jest wybierana (priorytet E2);
 *   (b) onlyWorked OFF: ta sama wycinka (bez zmian);
 *   (c) „Wolno wycinac las” OFF (skipWyrab) blokuje CALA wycinke, takze rzeczna (decyzja U-6 = A);
 *   (d) las bez rzeki + onlyWorked ON poza polami obywateli NIE jest wycinany (filtr zachowany dla pozostalych ulepszen);
 *   (d2) farma na heksie rzeki BEZ lasu nadal przed wycinka (E1 < E2);
 *   (e) po wycince farma na tym heksie (wycinka -> farma).
 *
 * Run z gra/:  node tools/autoclear-river-forest-priority-test.cjs
 * Mutacja:     AUTOCLEAR_SRC_DIR=<kopia gra/src z mutacja> node tools/autoclear-river-forest-priority-test.cjs   (MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTOCLEAR_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'autoclear-q2-'));
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
function makeMap({ river = [], forest = [] } = {}) {
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
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'Mykeny', population: 3, ulepszeniaFocus: 'zywnosc' };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 3, level: 1 }];

/** Jedno wolanie pickera w warunkach zgloszenia: Zywnosc, pula 100%, bogata Praca. */
function pick({ map, worked, onlyWorked = true, skipWyrab = false, focus = 'zywnosc', placed = new Map(), clearing = new Set() }) {
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  const decisions = [];
  const picks = pickAutoImprovements({
    cities: [CITY], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed, pracaAvailable: 400,
    unlockedTechs: new Set(FULL), pracaSurplusThreshold: 0, skipWyrab, demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => focus, getOnlyWorked: () => onlyWorked, getWorkedHexKeys: () => workedSet,
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 1,
    foodImprovementStages: () => true, clearingHexKeys: clearing, onDecision: d => decisions.push(d),
  });
  return { picks, decisions };
}
const desc = picks => picks.map(p => p.key + '@' + K(p.q, p.r)).join(' ') || 'nic';

// Miasto (12,12) w lesie; rzeka na (12,10),(12,11),(13,10); obywatele pracuja na polach lesnych NIE na rzece.
const RIVER = [[12, 10], [12, 11], [13, 10]];
const isRiver = (q, r) => RIVER.some(([a, b]) => a === q && b === r);
const FOREST_AROUND = [];
for (let q = 9; q <= 15; q++) for (let r = 9; r <= 15; r++) if (!(q === CQ && r === CR)) FOREST_AROUND.push([q, r]);
const WORKED_NO_RIVER = [[11, 12], [13, 12], [12, 13]];

/** Symulacja tura po turze (jak gracz): wycinka trwa `clearTurns` tur, potem las znika; reszta wchodzi do `placed`. */
function sim({ map, worked, onlyWorked, skipWyrab = false, focus = 'zywnosc', turns = 10, clearTurns = 1 }) {
  const placed = new Map();
  const clearing = new Map();
  const log = [];
  for (let t = 0; t < turns; t++) {
    const { picks } = pick({ map, worked, onlyWorked, skipWyrab, focus, placed, clearing: new Set(clearing.keys()) });
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, q: p.q, r: p.r, hk });
      if (p.key === 'wyrab') { clearing.set(hk, t + clearTurns); continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    for (const [hk, doneT] of [...clearing]) if (t + 1 >= doneT) { map.hexes[hk].nakladka = 'brak'; clearing.delete(hk); }
  }
  return { log, placed };
}
const MAXT = 4; // „w <= N turach”: wycinka rzeczna musi pojawic sie najpozniej w turze 3 (tura 0 = farma na centrum)
const firstRiverClear = log => log.find(e => e.key === 'wyrab' && isRiver(e.q, e.r));
const firstAnyClear = log => log.find(e => e.key === 'wyrab');
const dl = log => log.map(e => `${e.t}:${e.key}@${e.hk}`).join(' ') || 'nic';

for (const onlyWorked of [true, false]) {
  console.log(`(a/b) onlyWorked=${onlyWorked}: las NA rzece bez obywatela — wycinka rzeka+las w <= ${MAXT} turach, PRZED wycinka poza rzeka`);
  const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
  const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked });
  const rc = firstRiverClear(log);
  ok(!!rc && rc.t < MAXT, `wycinka na heksie rzeki w turze ${rc && rc.t} (log: ${dl(log.slice(0, 8))})`);
  const offRiver = log.find(e => e.key === 'wyrab' && !isRiver(e.q, e.r) && !WORKED_NO_RIVER.some(([q, r]) => q === e.q && r === e.r));
  ok(!offRiver || (rc && rc.t <= offRiver.t), `wycinka rzeczna nie pozniej niz wycinka poza rzeka i poza polami obywateli (rzeczna ${rc && rc.t}, inna ${offRiver && offRiver.t})`);
}

console.log('(c) „Wolno wycinac las” OFF blokuje cala wycinke, takze rzeczna (U-6 = A)');
for (const onlyWorked of [true, false]) {
  const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
  const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked, skipWyrab: true });
  ok(!log.some(e => e.key === 'wyrab'), `onlyWorked=${onlyWorked}: brak wycinki przy skipWyrab (log: ${dl(log.slice(0, 6))})`);
}

console.log('(d) las bez rzeki + onlyWorked ON: wycinka tylko na polach obywateli (filtr zachowany)');
{
  const map = makeMap({ river: [], forest: FOREST_AROUND });
  const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, turns: 12 });
  const bad = log.filter(e => e.key === 'wyrab' && !WORKED_NO_RIVER.some(([q, r]) => q === e.q && r === e.r));
  ok(bad.length === 0, `brak wycinki poza polami obywateli (${bad.length}; log: ${dl(log.slice(0, 8))})`);
}

console.log('(d2) farma na rzece BEZ lasu przed wycinka (E1 < E2)');
{
  const map = makeMap({ river: RIVER, forest: FOREST_AROUND.filter(([q, r]) => !(q === 12 && r === 11)) });
  const { picks } = pick({ map, worked: [...WORKED_NO_RIVER, [12, 11]], onlyWorked: true });
  ok(picks[0] && picks[0].key === 'farma', `pierwsza budowa to farma (jest: ${desc(picks)})`);
}

console.log('(d3) las NIE-farmowy (wzgorza) przy rzece nie jest wycinany pod farme (wyrabMaSens zachowane)');
{
  const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
  for (const [q, r] of FOREST_AROUND) map.hexes[K(q, r)].terenBazowy = 'wzgorza';
  const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true });
  ok(!log.some(e => e.key === 'wyrab' && isRiver(e.q, e.r)), `brak wycinki wzgorz przy rzece (log: ${dl(log.slice(0, 6))})`);
}

console.log('(d4) zakres: profil „Zrownowazone” (K2) bez zmian — las przy rzece bez obywatela nie jest wycinany (wyjatek tylko dla „Zywnosc”)');
{
  const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
  const { log } = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, focus: 'zrownowazone' });
  ok(!log.some(e => e.key === 'wyrab' && isRiver(e.q, e.r)), `K2: brak wycinki na heksie rzeki bez obywatela (log: ${dl(log.slice(0, 6))})`);
}

console.log('(e) wycinka -> farma: po wycieciu heksu rzeki farma na nim (przy obywatelu na wycietym polu)');
{
  const map = makeMap({ river: RIVER, forest: FOREST_AROUND });
  const first = sim({ map, worked: WORKED_NO_RIVER, onlyWorked: true, turns: MAXT });
  const rc = firstRiverClear(first.log);
  ok(!!rc, 'wycinka rzeczna wykonana');
  if (rc) {
    ok(map.hexes[rc.hk].nakladka === 'brak', `heks ${rc.hk} po wycince bez lasu`);
    const second = pick({ map, worked: [...WORKED_NO_RIVER, [rc.q, rc.r]], onlyWorked: true, placed: first.placed });
    ok(second.picks.some(p => p.key === 'farma' && p.q === rc.q && p.r === rc.r),
      `farma na wycietym ${rc.hk} (wybrano: ${desc(second.picks)})`);
  }
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
