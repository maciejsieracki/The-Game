'use strict';
/**
 * trade-route-flow-no-concentration-test.cjs -- R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1.
 * Run from gra/:  node tools/trade-route-flow-no-concentration-test.cjs
 *
 * Regresja przecieku: przepływ ilościowy surowca przez trasy handlowe (computeTradeRouteResourceFlow,
 * trade-routes.ts) przerzucał CAŁĄ nadwyżkę dawcy (`amount = floor(stock - rezerwa)`). Przy wielu
 * trasach (kontakt wystarcza, także AI↔AI) cały Brąz sieci handlowej spływał łańcuchem tras do jednej
 * cywilizacji, a pozostałe zostawały na rezerwie 2 szt. Test używa REALNYCH funkcji silnika
 * (computeTradeRouteResourceFlow + deductBuildingStockCostAcrossCities + creditOwnerResourceStock --
 * ta sama sekwencja co main.ts w ticku tury) i sprawdza:
 *   A. łańcuch A(1000)-B(0)-C(0): odbiorca nigdy nie przegania dawcy, C nie dostaje całości;
 *   B. 8 cywilizacji, każda z każdą, różna produkcja Brązu, 60 tur: suma zachowana, żadna
 *      cywilizacja z dodatnią produkcją nie stoi na rezerwie, max/średnia < 1,5;
 *   C. niezmiennik: pojedynczy krok przepływu nie podnosi maksimum zapasu w sieci;
 *   D. rezerwa dawcy (ABC-15) i parytet AI (ownerId bez znaczenia).
 * Mutacja: przywrócenie `amount = Math.floor(surplus)` -> A, B i C są czerwone.
 */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.trade-route-flow-no-concentration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.trade-route-flow-no-concentration-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { computeTradeRouteResourceFlow, DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS } from '../src/game/trade-routes';
export { ownerResourceStockAll, deductBuildingStockCostAcrossCities, creditOwnerResourceStock } from '../src/game/building-stock-cost';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
} finally { try { fs.unlinkSync(ENTRY); } catch (_) { /* */ } }
const T = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* */ }

let passed = 0, failed = 0;
function ok(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

const RESERVE = { minStockReserve: 2 };
const stockOf = (cities) => (o, k) => T.ownerResourceStockAll(cities, o)[k] ?? 0;
function applyFlows(cities, flows, cap = 1e9) {
  for (const f of flows) {
    T.deductBuildingStockCostAcrossCities(cities, f.fromOwnerId, { [f.resourceKey]: f.amount });
    T.creditOwnerResourceStock(cities, f.toOwnerId, f.resourceKey, f.amount, cap);
  }
}
const braz = (cities, o) => T.ownerResourceStockAll(cities, o).braz ?? 0;
const route = (a, b) => ({ id: `r${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`, ownerId: a, toOwnerId: b, status: 'polaczony' });

console.log('-- A. łańcuch A(1000)-B(0)-C(0): brak przerzutu całości do ostatniego odbiorcy --');
{
  const cities = [0, 1, 2].map(o => ({ id: 'c' + o, ownerId: o, surowce: { braz: o === 0 ? 1000 : 0 } }));
  const flows = T.computeTradeRouteResourceFlow([route(0, 1), route(1, 2)], stockOf(cities), RESERVE, ['braz']);
  applyFlows(cities, flows);
  const [a, b, c] = [0, 1, 2].map(o => braz(cities, o));
  ok(a + b + c === 1000, `A: suma zachowana (${a}+${b}+${c})`);
  ok(c < 1000 && c <= b && b <= a, `A: odbiorca nie przegania dawcy (A=${a} B=${b} C=${c}); stara reguła: C≈całość, A=B=rezerwa`);
  ok(a >= 500, `A: dawca zachowuje co najmniej połowę (A=${a})`);
}

console.log('-- B. 8 cywilizacji, pełna sieć tras, 60 tur produkcji Brązu --');
{
  const N = 8;
  const cities = [];
  for (let o = 0; o < N; o++) cities.push({ id: 'c' + o, ownerId: o, surowce: { braz: 0 } });
  const routes = [];
  for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) routes.push(route(a, b));
  let produced = 0;
  let maxRiseByFlow = 0;
  for (let t = 1; t <= 60; t++) {
    for (let o = 0; o < N; o++) { const p = 10 * (o + 1); T.creditOwnerResourceStock(cities, o, 'braz', p); produced += p; }
    const before = Math.max(...[...Array(N).keys()].map(o => braz(cities, o)));
    applyFlows(cities, T.computeTradeRouteResourceFlow(routes, stockOf(cities), RESERVE, ['braz']));
    const after = Math.max(...[...Array(N).keys()].map(o => braz(cities, o)));
    maxRiseByFlow = Math.max(maxRiseByFlow, after - before);
  }
  const s = [...Array(N).keys()].map(o => braz(cities, o));
  const total = s.reduce((x, y) => x + y, 0);
  const mean = total / N;
  ok(total === produced, `B: suma zachowana (${total} = wyprodukowane ${produced})`);
  ok(Math.min(...s) > RESERVE.minStockReserve, `B: żadna cywilizacja nie stoi na rezerwie (min=${Math.min(...s)}; zapasy ${s.join('/')})`);
  ok(Math.max(...s) / mean < 1.5, `B: brak koncentracji max/średnia=${(Math.max(...s) / mean).toFixed(2)} < 1,5`);
  console.log('-- C. niezmiennik: krok przepływu nie podnosi maksimum zapasu w sieci --');
  ok(maxRiseByFlow <= 0, `C: wzrost maksimum przez handel = ${maxRiseByFlow} (oczekiwane <= 0)`);
}

console.log('-- D. rezerwa dawcy i parytet AI --');
{
  const mk = (o1, o2, s1, s2) => [{ id: 'x', ownerId: o1, surowce: { braz: s1 } }, { id: 'y', ownerId: o2, surowce: { braz: s2 } }];
  const c1 = mk(0, 1, 3, 0);
  const f1 = T.computeTradeRouteResourceFlow([route(0, 1)], stockOf(c1), RESERVE, ['braz']);
  ok(f1.length === 1 && f1[0].amount === 1, `D: nadwyżka 1 ponad rezerwę -> transfer 1 (${JSON.stringify(f1)})`);
  const c2 = mk(0, 1, 2, 0);
  ok(T.computeTradeRouteResourceFlow([route(0, 1)], stockOf(c2), RESERVE, ['braz']).length === 0, 'D: dawca na rezerwie -> brak transferu');
  const fa = T.computeTradeRouteResourceFlow([route(0, 1)], stockOf(mk(0, 1, 900, 100)), RESERVE, ['braz']);
  const fb = T.computeTradeRouteResourceFlow([route(5, 6)], stockOf(mk(5, 6, 900, 100)), RESERVE, ['braz']);
  ok(fa.length === 1 && fb.length === 1 && fa[0].amount === fb[0].amount && fa[0].amount === 400,
    `D: parytet AI (0,1) vs (5,6): ${fa[0] && fa[0].amount} vs ${fb[0] && fb[0].amount} (oczekiwane 400 = połowa różnicy)`);
}

console.log(`\ntrade-route-flow-no-concentration-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
