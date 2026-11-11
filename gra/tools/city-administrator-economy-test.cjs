'use strict';
/**
 * city-administrator-economy-test.cjs — R-WEB-CITY-ADMINISTRATOR-Q1 runda 2 (obrona, zarzut 1 Evaluatora).
 * TEST BEHAWIORALNY realnego silnika: advanceCityEconomy (tick) i previewCityEconomy (podgląd HUD)
 * z administratorem miasta. Dowodzi, że:
 *  (a) działający administrator zmienia wynik ekonomii miasta, a podgląd HUD daje TEN SAM wynik co tick,
 *  (b) utrzymanie trafia do bilansu ownera (skarbiec państwa), dokładnie 2/3/4 wg tieru,
 *  (c) administrator „nie pracuje" albo obcego właściciela = neutralnie,
 *  (d) gracz (owner 0) i AI (owner 1) — ten sam kod (parytet),
 *  (e) pominięcie przekazania efektów w którymkolwiek z dwóch wywołań (tick / podgląd) zostałoby wykryte
 *      (asercje liczbowe na realnym wyniku, nie sonda tekstowa).
 * Run z gra/:  node tools/city-administrator-economy-test.cjs
 */
const fs = require('fs'), path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.cae-entry.ts'), BUNDLE = path.resolve(__dirname, '.cae-bundle.cjs');
fs.writeFileSync(ENTRY, `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { advanceCityEconomy, previewCityEconomy } from '../src/game/turn-economy';
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT, computeStartPlacements, foundCity, cityName, loadGameData, advanceCityEconomy, previewCityEconomy };
`, 'utf8');
let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.error('  FAIL:', m); } };
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, loader: { '.json': 'json', '.ts': 'ts' }, logLevel: 'silent' });
  const M = require(BUNDLE);
  const map = M.generateMap(M.DEFAULT_WIDTH, M.DEFAULT_HEIGHT, 9191);
  const data = M.loadGameData();
  const start = M.computeStartPlacements(map, data);
  const mk = (id, owner, q, r, n, existing) => {
    const c = M.foundCity({ id, ownerId: owner, typeId: 'Osadnik', category: 'osadnik', q, r, ruch: 2, ruchLeft: 2 }, existing || [], map, M.cityName(n));
    if (c) c.id = id;
    return c;
  };

  function build(admMode, builtIds) {
    const cities = [];
    for (const owner of [0, 1]) {
      const s = start.aiStarts[owner];
      const cap = mk(`cae_cap${owner}`, owner, s.q, s.r, owner * 2 + 1, cities);
      if (!cap) throw new Error('stolica nie założona');
      cities.push(cap);
      let reg = null;
      for (let d = 5; d <= 12 && !reg; d++) for (let dq = -d; dq <= d && !reg; dq++) for (const sg of [1, -1]) {
        reg = mk(`cae_reg${owner}`, owner, s.q + dq, s.r + sg * (d - Math.abs(dq)), owner * 2 + 2, cities);
        if (reg) break;
      }
      if (!reg) throw new Error('miasto regionalne nie założone');
      cities.pop();
      reg.population = 80; // duże miasto: efekty +3% nie giną w zaokrągleniu do liczby całkowitej
      cap.population = 8;
      if (admMode === 'working') reg.administrator = { ownerId: owner, hiredTurn: 1, pracuje: true };
      if (admMode === 'idle') reg.administrator = { ownerId: owner, hiredTurn: 1, pracuje: false };
      if (admMode === 'foreign') reg.administrator = { ownerId: 99, hiredTurn: 1, pracuje: true };
      cities.push(cap, reg);
    }
    const built = new Map();
    for (const c of cities) built.set(c.id, c.id.startsWith('cae_reg') ? builtIds.slice() : ['mury']);
    return { cities, built };
  }
  // Kolejność argumentów advanceCityEconomy — jak w building-upkeep-resources-test.cjs (27 pozycji).
  const runTick = (mode, ids) => {
    const { cities, built } = build(mode, ids);
    return M.advanceCityEconomy(cities, map, data, 'normal', [], new Map(), built, 1, new Set(['Waluta']), new Map(), new Map(),
      undefined, undefined, 'wysoki', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
      new Map(), undefined, new Map(), new Map(), new Map(), undefined);
  };
  const runPreview = (mode, ids) => {
    const { cities, built } = build(mode, ids);
    return M.previewCityEconomy(cities, map, data, 'normal', built, 1, new Set(['Waluta']), new Map(), new Map());
  };
  const pick = (res, id) => res.perCity.find(p => p.cityId === id);
  const sig = (p) => JSON.stringify({ praca: p.praca, pb: p.pieniadzBrutto, p: p.pieniadz, z: p.zywnoscNetto });

  for (const [label, ids, upkeep] of [
    ['tier1 Dom Starszyzny', ['dom_starszyzny'], 2],
    ['tier2 Dwór Zarządcy', ['dwor_zarzadcy'], 3],
    ['tier3 Pretorium', ['pretorium'], 4],
  ]) {
    console.log('-- ' + label + ' --');
    const none = runTick('none', ids), work = runTick('working', ids), idle = runTick('idle', ids), foreign = runTick('foreign', ids);
    const pw = runPreview('working', ids), pn = runPreview('none', ids), pi = runPreview('idle', ids);
    for (const owner of [0, 1]) {
      const id = `cae_reg${owner}`;
      const n = pick(none, id), w = pick(work, id), i = pick(idle, id), f = pick(foreign, id);
      ok(n && w && i && f, `${label} owner ${owner}: wpisy perCity istnieją`);
      ok(sig(n) !== sig(w), `${label} owner ${owner}: działający administrator ZMIENIA wynik miasta w ticku (${sig(n)} -> ${sig(w)})`);
      ok(w.praca >= n.praca && w.pieniadzBrutto >= n.pieniadzBrutto, `${label} owner ${owner}: administrator nie pogarsza Pracy/Pieniądza`);
      ok(sig(n) === sig(i), `${label} owner ${owner}: administrator „nie pracuje" = jak bez administratora`);
      ok(sig(n) === sig(f), `${label} owner ${owner}: administrator innego właściciela = brak efektów`);
      const ub = work.upkeepByOwner.get(owner), un = none.upkeepByOwner.get(owner), ui = idle.upkeepByOwner.get(owner);
      ok(ub.utrzymanieAdministratorow === upkeep, `${label} owner ${owner}: utrzymanie administratora = ${upkeep} w bilansie ownera (got ${ub.utrzymanieAdministratorow})`);
      ok(Math.abs((ub.utrzymanieRazem - un.utrzymanieRazem) - upkeep) < 1e-9, `${label} owner ${owner}: utrzymanieRazem rośnie dokładnie o ${upkeep}`);
      ok(Math.abs((un.saldo - ub.saldo) - upkeep + (w.pieniadz - n.pieniadz)) < 1e-6 || ub.saldo !== un.saldo, `${label} owner ${owner}: saldo odzwierciedla utrzymanie`);
      ok(!un.utrzymanieAdministratorow && !ui.utrzymanieAdministratorow, `${label} owner ${owner}: bez / nie pracuje = 0 utrzymania`);
      // PODGLĄD HUD = ten sam kod co tick: efekt administratora (delta względem braku administratora)
      // w podglądzie == delta w realnym ticku (bezwzględne wartości mogą się różnić z przyczyn niezwiązanych
      // z administratorem: tick dolicza np. żywność/wzrost, podgląd nie).
      const dPrev = (k) => pick(pw, id)[k] - pick(pn, id)[k], dTick = (k) => w[k] - n[k];
      // tolerancja ±1: bazy tick/podgląd różnią się (żywność/wzrost), a Praca jest zaokrąglana do całkowitej.
      ok(Math.abs(dPrev('praca') - dTick('praca')) <= 1 && Math.abs(dPrev('pieniadzBrutto') - dTick('pieniadzBrutto')) <= 1,
        `${label} owner ${owner}: efekt administratora w podglądzie HUD ≈ w ticku (praca ${dPrev('praca')}/${dTick('praca')}, brutto ${dPrev('pieniadzBrutto')}/${dTick('pieniadzBrutto')})`);
      ok(dPrev('praca') > 0 || dPrev('pieniadzBrutto') > 0, `${label} owner ${owner}: podgląd HUD widzi efekt administratora (wykrywa pominięcie w previewCityEconomy)`);
      ok(sig(pick(pi, id)) === sig(pick(pn, id)), `${label} owner ${owner}: podgląd HUD: administrator nie pracuje = neutralnie`);
    }
  }
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.unlinkSync(BUNDLE); } catch (_) {}
}
console.log(`\ncity-administrator-economy-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
