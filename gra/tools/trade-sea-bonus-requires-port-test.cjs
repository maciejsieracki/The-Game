'use strict';
/**
 * trade-sea-bonus-requires-port-test.cjs -- R-WEB-TRADE-SEA-BONUS-REQUIRES-PORT-Q1 (2026-11-04).
 * Decyzja wlasciciela (ABC B): bonus +1 za trase morska ponad pierwsza wymaga PORTU w miescie.
 * Uruchomienie z gra/:  node tools/trade-sea-bonus-requires-port-test.cjs
 * RED na starym kodzie: TR_MODULE=old (tymczasowa kopia src/game/trade-routes.old.ts z origin/main).
 * Testuje PRAWDZIWY src/game/trade-routes.ts (esbuild). Sekcja MUTACJE: mutanty zrodla musza byc wykryte.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC_FILE = path.resolve(__dirname, '..', 'src', 'game', 'trade-routes.ts');

function bundleFrom(srcPath, tag) {
  const entry = path.resolve(__dirname, `.tr-seaport-${tag}-entry.ts`);
  const out = path.resolve(__dirname, `.tr-seaport-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, `export * from '${srcPath.replace(/\.ts$/, '').replace(/\\/g, '/')}';`, 'utf8');
  try {
    esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out, logLevel: 'silent' });
    delete require.cache[out];
    return require(out);
  } finally { for (const f of [entry, out]) { try { fs.unlinkSync(f); } catch (e) { /* ok */ } } }
}
const OLD = process.env.TR_MODULE === 'old';
const MODULE = OLD ? path.resolve(__dirname, '..', 'src', 'game', 'trade-routes.old.ts') : SRC_FILE;
const TR = bundleFrom(MODULE, 'main');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const seaR = (id, a, b) => ({ id, fromCityId: a, toCityId: b, ownerId: 0, toOwnerId: 1, medium: 'morze', dystans: 5, status: 'polaczony' });
const ladR = (id, a, b) => ({ id, fromCityId: a, toCityId: b, ownerId: 0, toOwnerId: 1, medium: 'lad', dystans: 5, status: 'polaczony' });
const bonus = (routes, built) => TR.computeSeaTradeBonusIncomeByCity(TR.computeSeaTradeRouteCountByCity(routes), built);
const PORT = ['port'], WIELKI = ['targowisko', 'port_wielki'], NOPORT = ['targowisko', 'farma'];

console.log('-- A: jednostkowe (fixture) --');
const two = [seaR('h->a', 'hub', 'a'), seaR('h->b', 'hub', 'b')];
eq(bonus(two, new Map([['hub', PORT]])).get('hub'), 1, 'A1: miasto z Portem i 2 trasami morskimi -> +1');
assert(!bonus(two, new Map([['hub', NOPORT]])).has('hub'), 'A2: miasto BEZ Portu, 2 trasy morskie -> brak bonusu');
assert(!bonus(two, new Map()).has('hub'), 'A3: miasto bez wpisu w builtByCity -> brak bonusu');
eq(bonus(two, new Map([['hub', WIELKI]])).get('hub'), 1, 'A4: Port wielki tez odblokowuje bonus');
const three = [...two, seaR('h->c', 'hub', 'c')];
eq(bonus(three, new Map([['hub', PORT]])).get('hub'), 2, 'A5: 3 trasy morskie z Portem -> +2 (ponad pierwsza)');
assert(!bonus([seaR('h->a', 'hub', 'a')], new Map([['hub', PORT]])).has('hub'), 'A6: jedna trasa morska z Portem -> 0 (pierwsza oplacona dystansowo)');
const mixed = [seaR('h->a', 'hub', 'a'), seaR('h->b', 'hub', 'b'), seaR('x->a', 'x', 'a')];
const bm = bonus(mixed, new Map([['hub', PORT], ['a', NOPORT]]));
eq(bm.get('hub'), 1, 'A7: hub z Portem dostaje');
assert(!bm.has('a'), 'A7: partner "a" (2 trasy, BEZ Portu) nie dostaje');
const bm2 = bonus(mixed, new Map([['hub', NOPORT], ['a', PORT]]));
assert(!bm2.has('hub'), 'A8: hub bez Portu nie dostaje');
eq(bm2.get('a'), 1, 'A8: "a" z Portem (2 trasy) dostaje');
const withLad = [...two, ladR('h->l', 'hub', 'l'), ladR('h->m', 'hub', 'm')];
eq(bonus(withLad, new Map([['hub', PORT]])).get('hub'), 1, 'A9: trasy ladowe nie zmieniaja bonusu morskiego');
assert(!bonus([ladR('h->l', 'hub', 'l'), ladR('h->m', 'hub', 'm'), ladR('h->n', 'hub', 'n')], new Map([['hub', PORT]])).has('hub'), 'A10: same trasy ladowe -> brak bonusu morskiego');
eq(TR.computeSeaTradeBonusIncomeByCity(new Map([['hub', 3]]), new Map([['hub', PORT]]), 5).get('hub'), 10, 'A11: 3. argument bonusPerRoute nadal dziala');
const rt = JSON.parse(JSON.stringify(three));
const builtRt = new Map(JSON.parse(JSON.stringify([...new Map([['hub', PORT]])])));
eq(bonus(rt, builtRt).get('hub'), 2, 'A12: po round-trip JSON (zapis/odczyt) bonus identyczny');
assert(!bonus(three, new Map([['hub', []]])).has('hub'), 'A13: zburzony Port -> bonus znika');
eq(TR.computeSeaTradeRouteCountByCity(three).get('hub'), 3, 'A13: licznik tras morskich (trasy) bez zmian');

console.log('-- B: integracyjne (refreshTradeRoutes, wyspy rozdzielone morzem) --');
const hexes = {};
for (let q = 0; q <= 24; q++) hexes[`${q},0`] = { terenBazowy: ((q >= 5 && q <= 9) || (q >= 15 && q <= 19)) ? 'morze' : 'rownina' };
const map = { szerokoscQ: 25, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
const city = (id, ownerId, q) => ({ id, ownerId, q, r: 0 });
const cities = [city('W', 0, 2), city('M', 1, 12), city('E', 2, 22)];
const NO_WAR = () => false, TREATY = () => true, TECH = () => true, CONTACT = () => true;
function routesFor(built) {
  return TR.refreshTradeRoutes(cities, [], map, built, NO_WAR, TREATY, undefined, undefined, undefined, TECH, CONTACT);
}
const withPorts = new Map([['W', PORT], ['M', PORT], ['E', PORT]]);
const noPorts = new Map([['W', NOPORT], ['M', NOPORT], ['E', NOPORT]]);
const rP = routesFor(withPorts), rN = routesFor(noPorts);
const seaP = rP.filter(r => r.medium === 'morze' && r.status === 'polaczony');
const seaN = rN.filter(r => r.medium === 'morze' && r.status === 'polaczony');
assert(seaN.length > 0, 'B1: trasy morskie powstaja BEZ Portow (kontakt wystarczy) -> warunki powstania nietkniete');
eq(seaN.length, seaP.length, 'B1: liczba tras morskich taka sama z Portami i bez');
const cnt = TR.computeSeaTradeRouteCountByCity(seaN);
const multi = [...cnt].filter(([, n]) => n >= 2).map(([id]) => id);
assert(multi.length > 0, 'B2: istnieje miasto z >=2 trasami morskimi: ' + JSON.stringify([...cnt]));
for (const id of multi) {
  assert(!bonus(seaN, noPorts).has(id), `B3: ${id} bez Portu, >=2 trasy morskie -> brak bonusu`);
  eq(bonus(seaP, withPorts).get(id), cnt.get(id) - 1, `B4: ${id} z Portem -> bonus = trasy-1`);
}
const incP = TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
if (incP && TR.computeTradeRouteIncomeByCity) {
  const iP = TR.computeTradeRouteIncomeByCity(seaP, incP, () => 0), iN = TR.computeTradeRouteIncomeByCity(seaN, incP, () => 0);
  eq(JSON.stringify([...iP].sort()), JSON.stringify([...iN].sort()), 'B5: dochod dystansowy z/bez Portu identyczny (krzywa nietknieta)');
}

console.log('-- M: mutacje zrodla --');
const src = fs.readFileSync(SRC_FILE, 'utf8');
function mutant(label, from, to) {
  if (OLD) return;
  if (!src.includes(from)) { failed++; console.error('  FAIL: mutant nie znalazl kotwicy:', label); return; }
  const tmp = path.resolve(__dirname, '..', 'src', 'game', 'trade-routes.mut.ts');
  fs.writeFileSync(tmp, src.replace(from, to), 'utf8');
  let M;
  try { M = bundleFrom(tmp, 'mut'); } finally { try { fs.unlinkSync(tmp); } catch (e) { /* ok */ } }
  let caught = false;
  try {
    const cnt2 = M.computeSeaTradeRouteCountByCity(two), cnt3 = M.computeSeaTradeRouteCountByCity(three);
    const a = M.computeSeaTradeBonusIncomeByCity(cnt2, new Map([['hub', NOPORT]]));
    const b = M.computeSeaTradeBonusIncomeByCity(cnt2, new Map([['hub', PORT]]));
    const c = M.computeSeaTradeBonusIncomeByCity(cnt3, new Map([['hub', PORT]]));
    const d = M.computeSeaTradeBonusIncomeByCity(cnt2, new Map([['hub', WIELKI]]));
    caught = a.has('hub') || b.get('hub') !== 1 || c.get('hub') !== 2 || d.get('hub') !== 1;
  } catch (e) { caught = true; }
  assert(caught, `M: mutant "${label}" wykryty`);
}
mutant('M1 usuniety warunek Portu', 'if (!cityHasPort(cityId, builtByCity)) continue;', '');
mutant('M2 odwrocony warunek Portu', 'if (!cityHasPort(cityId, builtByCity)) continue;', 'if (cityHasPort(cityId, builtByCity)) continue;');
mutant('M3 bonus od pierwszej trasy', 'Math.max(0, count - 1)', 'Math.max(0, count)');
mutant('M4 Port tylko poziom 1', "new Set(['port', 'port_wielki'])", "new Set(['port'])");

console.log(`trade-sea-bonus-requires-port-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
