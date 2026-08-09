'use strict';
/**
 * heks-plony-zloze-forward-test.cjs — P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE (2026-08-09)
 *
 * Regresja parytetu: `yieldOfMapHex` (render, src/game/okolica.ts) musi przekazywać
 * `tile.zloze` do `tileYield()` dokładnie tak jak silnik `hexToWorkedTile`
 * (src/game/turn-economy.ts). Dziś `yieldOfMapHex` zwraca tylko {zywnosc, praca, handel} —
 * `zloze` wpływa WYŁĄCZNIE na pola `ruda`/`ruda_zelaza` (economy.ts, oreYieldFromImprovements),
 * więc brak przekazania `zloze` był dotąd NIESZKODLIWY dla wyniku. Test nie może więc polegać
 * na porównaniu zwracanej wartości (jak heks-plony-warstwy-test.cjs) — musiałby przejść nawet
 * bez fixu. Zamiast tego podmieniamy moduł './economy' (require przechwycony na poziomie
 * modułu Node, PRZED zbudowaniem bundla przez esbuild z `external: ['./economy']`) na szpiega,
 * który nagrywa dokładny argument przekazany do `tileYield(...)` przy każdym wywołaniu
 * `yieldOfMapHex`. To realnie sprawdza przekazywany parametr, nie tylko wynik końcowy — i złapie
 * regresję nawet gdyby ktoś w przyszłości rozszerzył `yieldOfMapHex` o pole `ruda` w zwracanym
 * obiekcie (wtedy rozjazd byłby już widoczny w wyniku, ale ten test łapie defekt WCZEŚNIEJ,
 * u źródła, zanim ktokolwiek doda to pole).
 *
 * Run from gra/: node tools/heks-plony-zloze-forward-test.cjs
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[heks-plony-zloze-forward-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.heks-plony-zloze-entry.ts');
const BUNDLE = path.join(__dirname, '.heks-plony-zloze-bundle.cjs');
const MOCK_ECONOMY = path.join(__dirname, '.heks-plony-zloze-mock-economy.js');

fs.writeFileSync(ENTRY, `
export { yieldOfMapHex } from '../src/game/okolica';
export { hexToWorkedTile } from '../src/game/turn-economy';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  // Nie bundlujemy './economy' -- chcemy przechwycić realne wywołanie tileYield(),
  // które okolica.ts robi przez `import_economy.tileYield(...)` (property access przy
  // KAŻDYM wywołaniu, nie destrukturyzacja przy require) -- podmiana modułu na szpiega
  // realnie widzi argument przekazany przez yieldOfMapHex.
  external: ['./economy'],
  logLevel: 'silent',
});

// ---------------------------------------------------------------------------
// Szpieg podmieniający require('./economy') WYŁĄCZNIE dla bundla testowego
// (dopasowanie po parent.filename) -- nie ruszamy realnego src/game/economy.ts
// ani innych testów, które mogą działać w tym samym procesie.
// ---------------------------------------------------------------------------
const tileYieldCalls = [];
const mockEconomyExports = {
  tileYield(tile) {
    tileYieldCalls.push(tile);
    // Kształt wystarczający, żeby yieldOfMapHex (czyta tylko zywnosc/praca/handel) nie wysypał się.
    return { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
  },
};
fs.writeFileSync(MOCK_ECONOMY, '// runtime mock, patrz heks-plony-zloze-forward-test.cjs\n', 'utf8');
require.cache[MOCK_ECONOMY] = {
  id: MOCK_ECONOMY,
  filename: MOCK_ECONOMY,
  loaded: true,
  exports: mockEconomyExports,
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === './economy' && parent && parent.filename === BUNDLE) {
    return MOCK_ECONOMY;
  }
  return originalResolveFilename.call(this, request, parent, ...rest);
};

let yieldOfMapHex, hexToWorkedTile;
try {
  ({ yieldOfMapHex, hexToWorkedTile } = require(BUNDLE));
} finally {
  Module._resolveFilename = originalResolveFilename;
}

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

console.log('\n-- P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE: yieldOfMapHex przekazuje zloze do tileYield --\n');

// ---------------------------------------------------------------------------
// Test 1: heks ZE złożem (ruda) -- tileYield() musi dostać zloze === 'zloze_rudy'.
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'wzgorza',
    nakladka: 'brak',
    rzeka: null,
    zloze: 'zloze_rudy',
    ulepszenia: ['kopalnia'],
  };
  const map = { hexes: { '0,0': hex } };
  tileYieldCalls.length = 0;

  yieldOfMapHex(map, 0, 0);

  eq(tileYieldCalls.length, 1, 'yieldOfMapHex wywołuje tileYield dokładnie raz');
  eq(tileYieldCalls[0] && tileYieldCalls[0].zloze, 'zloze_rudy', 'tileYield() dostaje zloze heksa (zloze_rudy)');
}

// ---------------------------------------------------------------------------
// Test 2: heks BEZ złoża -- tileYield() musi dostać zloze === undefined (nie zgubione,
// ale też nie zmyślone -- forwarding musi być wierny, nie "zawsze coś wstawiaj").
{
  const hex = {
    coords: { q: 1, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    ulepszenia: ['farma'],
  };
  const map = { hexes: { '1,0': hex } };
  tileYieldCalls.length = 0;

  yieldOfMapHex(map, 1, 0);

  eq(tileYieldCalls.length, 1, 'yieldOfMapHex wywołuje tileYield dokładnie raz (brak zloze)');
  eq(tileYieldCalls[0] && tileYieldCalls[0].zloze, undefined, 'tileYield() dostaje zloze=undefined gdy heks go nie ma (brak zmyślania wartości)');
}

// ---------------------------------------------------------------------------
// Test 3: parytet ze silnikiem -- dla TEGO SAMEGO heksa, zloze przekazane przez render
// (via mock tileYield) musi być identyczne z polem `zloze` w WorkedTile budowanym przez
// silnik (hexToWorkedTile), które i tak trafia bezpośrednio do tileYield() w turn-economy.ts.
{
  const hex = {
    coords: { q: 2, r: 0 },
    terenBazowy: 'gory',
    nakladka: 'brak',
    rzeka: null,
    zloze: 'zloze_zelaza',
    ulepszenia: ['kopalnia'],
  };
  const map = { hexes: { '2,0': hex } };
  tileYieldCalls.length = 0;

  yieldOfMapHex(map, 2, 0);
  const silnikTile = hexToWorkedTile(hex);

  eq(tileYieldCalls[0] && tileYieldCalls[0].zloze, silnikTile.zloze, 'render (tileYield arg) zloze == silnik (hexToWorkedTile) zloze');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
try { fs.unlinkSync(MOCK_ECONOMY); } catch (e) { /* ignore */ }
delete require.cache[MOCK_ECONOMY];
process.exit(failed ? 1 : 0);
