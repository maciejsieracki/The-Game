'use strict';

/**
 * R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1 — „Załóż miasto” wyszarzone, gdy limit miast epoki jest osiągnięty.
 *
 * Sekcje:
 *   A  parytet: `cityFoundingLimitState().exhausted` == (realny `canFoundCity` odrzuca z powodem limitu)
 *      dla baza 10/15/20 x epoka 0..5 x granica limit-1/limit/limit+1; miasta zdobyte (foundedByOwner=false) poza limitem
 *   B  pierwsze miasto (0 miast) nigdy nie jest „exhausted” przy bazie > 0
 *   C  UI statycznie: buildModeHud renderuje stan limitu (klasa `limit`, aria-disabled, data-found-city-limit, tekst)
 *   D  UI statycznie: kliknięcie „Załóż miasto” przy limicie nie wchodzi w tryb (return przed onSelectFoundCity)
 *   E  main.ts: podpina `getFoundCityLimitState`; komunikat limitu ma pierwszeństwo nad brakiem zasobów
 *
 * Run z gra/:  node tools/city-founding-limit-greyed-test.cjs
 * Mutacje:     CITY_LIMIT_SRC_DIR=<kopia gra/src z mutacja> node tools/city-founding-limit-greyed-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.CITY_LIMIT_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'city-limit-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export { canFoundCity, cityFoundingLimitState } from ${JSON.stringify(SRC + '/game/cities')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(bundle);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const W = 44, H = 44;
function makeMap() {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
}
const map = makeMap();
const LIMIT_REASON = 'limit miast na tej epoce';
// Miasta rozstawione daleko od (40,40) — sprawdzany heks jest wolny i poza progiem odległości.
const mk = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({
  id: 'x' + i, ownerId: 0, q: 2 + (i % 8) * 4, r: 2 + Math.floor(i / 8) * 4, name: 'x', population: 3, ...extra,
}));

console.log('A: parytet cityFoundingLimitState <-> canFoundCity');
{
  let allOk = true;
  for (const base of [10, 15, 20]) for (const era of [0, 1, 2, 3, 5]) {
    const limit = base + (Math.max(1, era) - 1) * 5;
    for (const n of [limit - 1, limit, limit + 1]) {
      const cities = mk(n);
      const real = M.canFoundCity(40, 40, cities, map, { ownerId: 0, ownerEra: era, gameConfig: { cityLimitBase: base } });
      const st = M.cityFoundingLimitState(cities, 0, era, base);
      const realLimit = real.reason === LIMIT_REASON;
      // Oracle niezależny od kodu produkcyjnego: granica wyczerpania = n >= limit (wzór z zadania).
      const oracle = n >= limit;
      if (realLimit !== oracle || st.exhausted !== oracle || st.limit !== limit || st.count !== n) {
        allOk = false;
        console.error(`   rozjazd base=${base} era=${era} n=${n}: real=${real.reason} st=${JSON.stringify(st)}`);
      }
    }
  }
  ok(allOk, 'exhausted == (canFoundCity odrzuca z powodem limitu), limit = base+(era-1)*5, count OK, base 10/15/20 x era 0..5 x granica +-1');

  const conquered = [...mk(9), ...mk(3, { foundedByOwner: false }).map((c, i) => ({ ...c, id: 'z' + i, q: 41, r: 2 + i * 4 }))];
  const realC = M.canFoundCity(40, 40, conquered, map, { ownerId: 0, ownerEra: 1, gameConfig: { cityLimitBase: 10 } });
  const stC = M.cityFoundingLimitState(conquered, 0, 1, 10);
  ok((realC.reason === LIMIT_REASON) === stC.exhausted && stC.count === 9, 'miasta zdobyte (foundedByOwner=false) nie liczą się do limitu — parytet (count=9)');

  const others = mk(10, { ownerId: 1 });
  const stO = M.cityFoundingLimitState(others, 0, 1, 10);
  ok(stO.exhausted === false && stO.count === 0, 'miasta innego właściciela nie liczą się do limitu gracza');
}

console.log('B: pierwsze miasto nigdy nie jest blokowane limitem (baza > 0)');
{
  const st = M.cityFoundingLimitState([], 0, 1, 10);
  ok(st.exhausted === false && st.count === 0 && st.limit === 10, 'brak miast -> exhausted=false (limit 10)');
}

const readSrc = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const hud = readSrc('ui/buildModeHud.ts');
const main = readSrc('main.ts');

console.log('C: panel budowy renderuje stan limitu');
{
  ok(/getFoundCityLimitState\?:\s*\(\)\s*=>/.test(hud), 'interfejs HUD deklaruje getFoundCityLimitState');
  ok(hud.includes("(fcLimitHit ? ' limit' : '')"), 'pozycja „Załóż miasto” dostaje klasę limit');
  ok(hud.includes('aria-disabled="true" data-found-city-limit="1"'), 'pozycja limitu ma aria-disabled i data-found-city-limit');
  ok(hud.includes('data-found-city-limit-note="1"') && hud.includes('osiągnięto limit'), 'mały napis „osiągnięto limit” przy nagłówku Miasto');
  ok(/\.civ-build-item\.limit\{[^}]*opacity:\.36/.test(hud), 'CSS: .civ-build-item.limit wyszarza (opacity .36)');
}

console.log('D: kliknięcie przy limicie nie wchodzi w tryb zakładania');
{
  const i = hud.indexOf("querySelector('[data-found-city]')?.addEventListener");
  const block = i >= 0 ? hud.slice(i, i + 400) : '';
  const hintReturn = block.indexOf('return;');
  const selectCall = block.indexOf('onSelectFoundCity');
  ok(i >= 0 && hintReturn > 0 && selectCall > hintReturn, 'handler kliknięcia: przy niepustym getFoundCityLockHint → return PRZED onSelectFoundCity');
}

console.log('E: main.ts — limit ma pierwszeństwo, pierwsze miasto wyłączone');
{
  ok(main.includes('getFoundCityLimitState: () => {'), 'main.ts podpina getFoundCityLimitState');
  const hintIdx = main.indexOf('getFoundCityLockHint: () => {');
  const limIdx = main.indexOf('Osiągnięto limit miast (${lim.count}', hintIdx);
  const affIdx = main.indexOf('evaluateFoundCityAffordance(playerPracaPool, pc, 0)', hintIdx);
  ok(hintIdx > 0 && limIdx > hintIdx, 'w getFoundCityLockHint jest komunikat „Osiągnięto limit miast (X/Y w tej epoce)”');
  ok(limIdx > 0 && affIdx > limIdx, 'w getFoundCityLockHint limit sprawdzany PRZED brakiem zasobów');
  ok(/if \(!isAwaitingFirstPlayerCity\(\)\) \{\s*const lim = cityFoundingLimitState/.test(main), 'pierwsze miasto (isAwaitingFirstPlayerCity) pomija sprawdzenie limitu');
}

console.log(`\nWynik: ${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
