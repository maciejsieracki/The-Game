'use strict';
/**
 * resource-ledger-engine-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (runda 4).
 *
 * Test wpiecia ksiegi w REALNYM silniku `advanceCityEconomy` (nie w fixture pipeline):
 *  (1) „Warzelnia (<miasto>)": sol z ulepszenia warzelnia_soli ksiegowana jako osobne zrodlo
 *      `warzelnia|<hexKey>` per budynek (nie jako ogolny teren, nie zbiorczo per miasto), suma = zmiana magazynu;
 *  (2) Mennica: drain zlota zapisany jako `mennica|<owner>` (ubytek), suma = zmiana magazynu;
 *  (3) limit magazynu: sciecie nadwyzki zapisane jako `limit-magazynu|<owner>`, suma = zmiana magazynu;
 *  (4) rownosc ksiega == zmiana magazynu w calym ticku (dla wszystkich kluczy) w 3 scenariuszach;
 *  (5) MUTACJA: ten sam test na bundlu, w ktorym recordStockDeltaToTurn jest no-op (Mennica + limit
 *      wylaczone z ksiegi) -> asercje (2),(3),(4) MUSZA byc czerwone.
 *
 * Run from gra/:  node tools/resource-ledger-engine-test.cjs
 */
const fs = require('fs'), path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.resource-ledger-engine-entry.ts');
const BUNDLE_OK = path.resolve(__dirname, '.resource-ledger-engine-bundle.cjs');
const BUNDLE_MUT = path.resolve(__dirname, '.resource-ledger-engine-bundle-mut.cjs');

fs.writeFileSync(ENTRY, `
export { advanceCityEconomy } from '../src/game/turn-economy';
export { ownerResourceStockAll } from '../src/game/building-stock-cost';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { generateMap } from '../src/map/generator';
`);

const build = (outfile, mutate) => esbuild.build({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile, absWorkingDir: GRA, logLevel: 'silent',
  plugins: mutate ? [{
    name: 'mutate-ledger-delta',
    setup(b) {
      b.onLoad({ filter: /resource-ledger\.ts$/ }, args => {
        let src = fs.readFileSync(args.path, 'utf8');
        const marker = 'export function recordStockDeltaToTurn(';
        const i = src.indexOf(marker);
        if (i < 0) throw new Error('mutacja: nie znaleziono recordStockDeltaToTurn');
        const open = src.indexOf('{', src.indexOf(')', src.indexOf('flow:', i)));
        src = src.slice(0, open + 1) + '\n  return; // MUTACJA: no-op\n' + src.slice(open + 1);
        return { contents: src, loader: 'ts' };
      });
    },
  }] : [],
});

const D = f => require(path.join(GRA, 'data', f));
const data = { civs: D('civs.json'), econParams: D('econ-params.json'), societyParams: D('society-params.json'),
  buildings: D('buildings.json'), units: D('units.json'), tech: D('tech.json') };

let passed = 0, failed = 0;
const eq = (a, b, m) => { if (a === b) passed++; else { failed++; console.error(`  FAIL: ${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); } };
const ok = (v, m) => eq(!!v, true, m);

function scenario(M, kind) {
  const map = M.generateMap(40, 40, 7331, 'kontynenty');
  const spots = [];
  for (const h of Object.values(map.hexes)) {
    const c = h.coords;
    if (M.canFoundCity(c.q, c.r, [], map).ok) { spots.push(c); break; }
  }
  const cities = [];
  const c0 = M.foundCityAt(spots[0].q, spots[0].r, 0, cities, map, 'Lublin'); cities.push(c0);
  c0.surowce = {};
  let built = new Map();
  let tech = new Set();
  if (kind === 'warzelnia') {
    // ulepszenie warzelnia_soli na heksie w terytorium miasta (sasiad centrum)
    const nb = Object.values(map.hexes).find(h => {
      const d = (Math.abs(h.coords.q - c0.q) + Math.abs(h.coords.q + h.coords.r - c0.q - c0.r) + Math.abs(h.coords.r - c0.r)) / 2;
      return d === 1 && h.coords.q !== c0.q;
    });
    nb.ulepszenia = ['warzelnia_soli'];
    nb.ulepszenie = 'warzelnia_soli';
    c0.surowce = { sol: 3 };
  } else if (kind === 'warzelnia2') {
    // R-...-Q1 runda 5: DWIE Warzelnie w terytorium tego samego miasta -> osobne wpisy per heks.
    const nbs = Object.values(map.hexes).filter(h => {
      const d = (Math.abs(h.coords.q - c0.q) + Math.abs(h.coords.q + h.coords.r - c0.q - c0.r) + Math.abs(h.coords.r - c0.r)) / 2;
      return d === 1 && h.coords.q !== c0.q;
    });
    for (const nb of nbs.slice(0, 2)) { nb.ulepszenia = ['warzelnia_soli']; nb.ulepszenie = 'warzelnia_soli'; }
    c0.surowce = { sol: 3 };
  } else if (kind === 'mennica') {
    c0.surowce = { zloto: 50 };
    built = new Map([[c0.id, ['mennica']]]);
    tech = new Set(['Waluta']);
  } else if (kind === 'cap') {
    c0.surowce = { sol: 5000000, glina: 5000000 };
  }
  const before = { ...M.ownerResourceStockAll(cities, 0) };
  const econ = M.advanceCityEconomy(cities, map, data, 'normal', [], new Map(), built, 1, tech, new Map(), new Map(),
    () => 1, () => tech);
  const after = { ...M.ownerResourceStockAll(cities, 0) };
  const rec = (econ.resourceLedgerByOwner.get(0) || { byResource: {} }).byResource;
  const sums = {};
  for (const [rk, srcs] of Object.entries(rec)) sums[rk] = Object.values(srcs).reduce((a, f) => a + f.amount, 0);
  const keys = new Set([...Object.keys(before), ...Object.keys(after), ...Object.keys(sums)]);
  let maxDiff = 0; const diffs = {};
  for (const k of keys) {
    const d = ((after[k] || 0) - (before[k] || 0)) - (sums[k] || 0);
    if (d !== 0) diffs[k] = d;
    maxDiff = Math.max(maxDiff, Math.abs(d));
  }
  return { c0, rec, before, after, maxDiff, diffs };
}

function suite(M, mutated) {
  const pre = mutated ? '[MUTACJA] ' : '';
  const w = scenario(M, 'warzelnia');
  const solSrc = w.rec.sol || {};
  // runda 5: wpis per BUDYNEK (heks Warzelni), nie per miasto -- jeden heks w tym scenariuszu
  const wKeys = Object.keys(solSrc).filter(k => k.startsWith('warzelnia|'));
  const wKey = wKeys[0];
  ok(wKeys.length === 1 && solSrc[wKey], `${pre}warzelnia: jest zrodlo warzelnia|<heks> (keys ${JSON.stringify(wKeys)})`);
  eq(solSrc[wKey] && solSrc[wKey].label, `Warzelnia (${w.c0.name})`, `${pre}warzelnia: etykieta „Warzelnia (<miasto>)"`);
  ok(solSrc[wKey] && solSrc[wKey].amount > 0, `${pre}warzelnia: przyrost > 0 (got ${solSrc[wKey] && solSrc[wKey].amount})`);
  eq(Object.keys(solSrc).some(k => k.startsWith('teren|')), false, `${pre}warzelnia: sol NIE jest ksiegowana jako ogolny teren`);
  eq(w.maxDiff, 0, `${pre}warzelnia: ksiega == zmiana magazynu (diffs ${JSON.stringify(w.diffs)})`);

  const w2 = scenario(M, 'warzelnia2');
  const sol2 = w2.rec.sol || {};
  const perBuilding = Object.keys(sol2).filter(k => k.startsWith('warzelnia|'));
  eq(perBuilding.length, 2, `${pre}warzelnia2: dwie Warzelnie = dwa osobne wpisy (got ${JSON.stringify(perBuilding)})`);
  eq(perBuilding.some(k => k === `warzelnia|${w2.c0.id}`), false, `${pre}warzelnia2: brak zbiorczego wpisu per miasto`);
  eq(perBuilding.every(k => /^warzelnia\|-?\d+,-?\d+$/.test(k)), true, `${pre}warzelnia2: wpis per heks (q,r)`);
  eq(perBuilding.every(k => sol2[k].label === `Warzelnia (${w2.c0.name})`), true, `${pre}warzelnia2: etykieta „Warzelnia (<miasto>)"`);
  eq(w2.maxDiff, 0, `${pre}warzelnia2: ksiega == zmiana magazynu (diffs ${JSON.stringify(w2.diffs)})`);

  const m = scenario(M, 'mennica');
  const mk = 'mennica|0';
  ok(m.rec.zloto && m.rec.zloto[mk], `${pre}mennica: jest wpis ${mk}`);
  eq(m.rec.zloto && m.rec.zloto[mk] && m.rec.zloto[mk].amount, -1, `${pre}mennica: ubytek -1 zlota/ture`);
  eq(m.maxDiff, 0, `${pre}mennica: ksiega == zmiana magazynu (diffs ${JSON.stringify(m.diffs)})`);

  const c = scenario(M, 'cap');
  const ck = 'limit-magazynu|0';
  ok(c.rec.sol && c.rec.sol[ck], `${pre}cap: jest wpis ${ck} dla soli`);
  ok(c.rec.sol && c.rec.sol[ck] && c.rec.sol[ck].amount < 0, `${pre}cap: sciecie to ubytek`);
  eq(c.maxDiff, 0, `${pre}cap: ksiega == zmiana magazynu (diffs ${JSON.stringify(c.diffs)})`);
}

(async () => {
await build(BUNDLE_OK, false);
await build(BUNDLE_MUT, true);
console.log('-- A. realny silnik, wpiecie ksiegi --');
const before = { passed, failed };
suite(require(BUNDLE_OK), false);
const okFailed = failed - before.failed;
eq(okFailed, 0, 'bundle produkcyjny: brak czerwonych asercji');

console.log('-- B. MUTACJA (no-op recordStockDeltaToTurn) musi dawac CZERWONE --');
const savedPassed = passed, savedFailed = failed;
const origErr = console.error; const muted = [];
console.error = (...a) => muted.push(a.join(' '));
suite(require(BUNDLE_MUT), true);
console.error = origErr;
const mutRed = failed - savedFailed;
// przywroc liczniki: czerwone z mutacji sa OCZEKIWANE (to dowod nietautologii), nie bledem testu
passed = savedPassed; failed = savedFailed;
console.log(`  mutacja: ${mutRed} asercji czerwonych (oczekiwane >= 4: mennica x3 + cap x3)`);
muted.slice(0, 8).forEach(l => console.log('   ' + l.trim()));
eq(mutRed >= 4, true, 'mutacja daje >= 4 czerwone asercje (wpiecie Mennicy i limitu jest realnie testowane)');
eq(muted.some(l => /mennica/.test(l)), true, 'mutacja: czerwona asercja Mennicy');
eq(muted.some(l => /cap/.test(l)), true, 'mutacja: czerwona asercja limitu magazynu');

console.log(`\nresource-ledger-engine-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_OK); fs.unlinkSync(BUNDLE_MUT); } catch (e) {}
process.exit(failed ? 1 : 0);
})();
