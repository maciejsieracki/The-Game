'use strict';
/**
 * R-WEB-LONGRUN-100-TURNS-LEAK-Q1: test jednostkowy memoizacji `memoizeOwnerResourceAccess` (trade-routes.ts).
 * KONTRAKT: (1) computeTradeRouteResourceGrants z memo daje WYNIK IDENTYCZNY jak bez memo (losowe trasy/dostepy);
 *           (2) liczba wywolan bazowego predykatu <= liczba unikalnych (wlasciciel, surowiec) -- nie 4 x trasy x surowce;
 *           (3) cache nie przecieka miedzy instancjami (nowa memoizacja = nowe odpytanie);
 *           (4) main.ts uzywa memo w recomputeTradeRouteResourceGrants (kontrakt zrodlowy).
 * Run z gra/:  node tools/longrun-100-turns-leak-q1-memo-unit-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.LEAK_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'leak-q1-memo-'));
const entry = path.join(temp, 'entry.ts'); const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { computeTradeRouteResourceGrants, memoizeOwnerResourceAccess, TRADE_ROUTE_RESOURCE_KEYS } from ${JSON.stringify(SRC + '/game/trade-routes')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error', nodePaths: [path.resolve(GRA_ROOT, 'node_modules')] });
const { computeTradeRouteResourceGrants, memoizeOwnerResourceAccess, TRADE_ROUTE_RESOURCE_KEYS } = require(bundle);

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log('  PASS', m); } else { failed++; console.log('  FAIL', m); } };

let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const OWNERS = 12;
const access = new Set();
for (let o = 0; o < OWNERS; o++) for (const k of TRADE_ROUTE_RESOURCE_KEYS) if (rnd() < 0.35) access.add(o + '|' + k);
const routes = [];
for (let i = 0; i < 120; i++) {
  const a = Math.floor(rnd() * OWNERS); let b = Math.floor(rnd() * OWNERS); if (b === a) b = (a + 1) % OWNERS;
  routes.push({ id: 'r' + i, ownerId: a, toOwnerId: b, fromCityId: 'c' + a, toCityId: 'c' + b, status: rnd() < 0.9 ? 'polaczony' : 'zerwany' });
}
let calls = 0;
const base = (o, k) => { calls++; return access.has(o + '|' + k); };

const plain = computeTradeRouteResourceGrants(routes, base); const plainCalls = calls;
calls = 0;
const memo = computeTradeRouteResourceGrants(routes, memoizeOwnerResourceAccess(base)); const memoCalls = calls;
ok(JSON.stringify(plain) === JSON.stringify(memo), '(1) wynik z memo identyczny jak bez memo (' + plain.length + ' grantow)');
ok(memoCalls <= OWNERS * TRADE_ROUTE_RESOURCE_KEYS.length, `(2) wywolan bazowych z memo ${memoCalls} <= ${OWNERS * TRADE_ROUTE_RESOURCE_KEYS.length} (bez memo ${plainCalls})`);
ok(plainCalls > 10 * memoCalls, '(2b) redukcja > 10x');
calls = 0;
const m1 = memoizeOwnerResourceAccess(base); m1(1, 'braz'); m1(1, 'braz');
const m2 = memoizeOwnerResourceAccess(base); m2(1, 'braz');
ok(calls === 2, '(3) osobne instancje memo nie dziela cache (' + calls + ' wywolania)');
access.add('1|braz');
ok(memoizeOwnerResourceAccess(base)(1, 'braz') === true, '(3b) nowa instancja widzi zmieniony stan');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/computeTradeRouteResourceGrants\(tradeRoutes, memoizeOwnerResourceAccess\(ownerHasNativeResourceAccess\)\)/.test(mainSrc), '(4) main.ts: recomputeTradeRouteResourceGrants uzywa memoizeOwnerResourceAccess');
console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
