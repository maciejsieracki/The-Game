'use strict';
/**
 * heks-plony-warstwy-test.cjs — P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE (2026-08-09)
 *
 * Regresja: render plonów heksu (`yieldOfMapHex` w src/game/okolica.ts, wołany m.in. z
 * main.ts do liczb wyświetlanych na mapie) musi liczyć WSZYSTKIE warstwy ulepszenia
 * (`hex.ulepszenia`), dokładnie jak silnik (`hexToWorkedTile` w src/game/turn-economy.ts,
 * faktycznie doliczany do produkcji miasta) — a nie tylko ostatnią postawioną warstwę
 * (legacy pojedyncze pole `hex.ulepszenie`).
 *
 * P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA (2026-08-09): drugi człon tego samego
 * wzorca błędu — `foodPotentialOfMapHex` (ranking auto-okolicy fokus żywność) musiał
 * czytać tylko `h.ulepszenie` zamiast wszystkich warstw `h.ulepszenia`, więc heks
 * z ulepszeniem żywnościowym w liście warstw, ale innym legacy `ulepszenie`, dostawał
 * nienależny `FARMA_POTENTIAL_FOOD_BONUS` zamiast 0 (funkcja "nie widziała" że farma
 * już tam jest).
 *
 * Run from gra/: node tools/heks-plony-warstwy-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[heks-plony-warstwy-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.heks-plony-warstwy-entry.ts');
const BUNDLE = path.join(__dirname, '.heks-plony-warstwy-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { yieldOfMapHex, foodPotentialOfMapHex } from '../src/game/okolica';
export { hexToWorkedTile } from '../src/game/turn-economy';
export { tileYield } from '../src/game/economy';
export { FARMA_POTENTIAL_FOOD_BONUS } from '../src/game/terrain-improvements';
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
  logLevel: 'silent',
});

const { yieldOfMapHex, foodPotentialOfMapHex, hexToWorkedTile, tileYield, FARMA_POTENTIAL_FOOD_BONUS } = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

console.log('\n-- P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE: render == silnik dla wielu warstw --\n');

// ---------------------------------------------------------------------------
// Test 1: dwie warstwy (farma + irygacja) na Równinie -- render musi zsumować OBIE,
// nie tylko ostatnią postawioną (irygacja).
// Równina baza: zywnosc=2 praca=2 handel=1.
// farma bonus:    zywnosc+3 praca+3 handel+3
// irygacja bonus: zywnosc+5 praca+2 handel+2
// Suma oczekiwana: zywnosc=10 praca=7 handel=6
// Gdyby render czytał TYLKO ostatnią warstwę (irygacja): zywnosc=7 praca=4 handel=3.
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    // hex.ulepszenie -- legacy pojedyncze pole, silnik go IGNORUJE gdy jest `ulepszenia[]`
    ulepszenie: 'irygacja',
    // hex.ulepszenia -- pełna lista warstw (autorytatywne źródło, patrz main.ts syncHexUlepszenieFields)
    ulepszenia: ['farma', 'irygacja'],
  };
  const map = { hexes: { '0,0': hex } };

  const renderY = yieldOfMapHex(map, 0, 0);
  const silnikY = tileYield(hexToWorkedTile(hex));

  eq(silnikY.zywnosc, 10, 'silnik (hexToWorkedTile): zywnosc = 2 + 3(farma) + 5(irygacja) = 10');
  eq(silnikY.praca,   7,  'silnik: praca = 2 + 3 + 2 = 7');
  eq(silnikY.handel,  6,  'silnik: handel = 1 + 3 + 2 = 6');

  eq(renderY.zywnosc, silnikY.zywnosc, 'render (yieldOfMapHex) zywnosc == silnik (nie tylko ostatnia warstwa)');
  eq(renderY.praca,   silnikY.praca,   'render praca == silnik');
  eq(renderY.handel,  silnikY.handel,  'render handel == silnik');

  // Dowód wprost, że stara logika (tylko ostatnia warstwa) dałaby ZANIŻONY wynik --
  // jeśli render kiedyś zregresuje do samego hex.ulepszenie, ten test to złapie.
  ok(renderY.zywnosc !== 7, 'render NIE zwraca zaniżonej wartości samej "irygacja" (regresja do 1 warstwy)');
}

// ---------------------------------------------------------------------------
// Test 2: pojedyncza warstwa (bez tablicy `ulepszenia`, tylko legacy `ulepszenie`) --
// render i silnik dalej muszą się zgadzać (brak regresji dla prostego, jednowarstwowego przypadku).
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    ulepszenie: 'farma',
  };
  const map = { hexes: { '0,0': hex } };

  const renderY = yieldOfMapHex(map, 0, 0);
  const silnikY = tileYield(hexToWorkedTile(hex));

  eq(silnikY.zywnosc, 5, 'silnik (1 warstwa farma): zywnosc = 2 + 3 = 5');
  eq(renderY.zywnosc, silnikY.zywnosc, 'render == silnik (fallback na legacy ulepszenie, 1 warstwa)');
  eq(renderY.praca,   silnikY.praca,   'render == silnik praca (1 warstwa)');
  eq(renderY.handel,  silnikY.handel,  'render == silnik handel (1 warstwa)');
}

// ---------------------------------------------------------------------------
// Test 3: brak ulepszenia -- sam teren, obie ścieżki równe (regresja podstawowa).
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    ulepszenie: 'brak',
  };
  const map = { hexes: { '0,0': hex } };

  const renderY = yieldOfMapHex(map, 0, 0);
  const silnikY = tileYield(hexToWorkedTile(hex));

  eq(renderY.zywnosc, silnikY.zywnosc, 'render == silnik zywnosc (brak ulepszenia)');
  eq(renderY.praca,   silnikY.praca,   'render == silnik praca (brak ulepszenia)');
  eq(renderY.handel,  silnikY.handel,  'render == silnik handel (brak ulepszenia)');
  eq(renderY.zywnosc, 2, 'sam teren Równina: zywnosc = 2');
}

// ---------------------------------------------------------------------------
// Test 4: trzy warstwy (glinianka + farma + irygacja) -- suma wszystkich trzech.
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    ulepszenie: 'irygacja',
    ulepszenia: ['glinianka', 'farma', 'irygacja'],
  };
  const map = { hexes: { '0,0': hex } };

  const renderY = yieldOfMapHex(map, 0, 0);
  const silnikY = tileYield(hexToWorkedTile(hex));

  // glinianka: praca+1 handel+2 (glina+2, nie liczone tu -- yieldOfMapHex zwraca tylko z/p/h)
  eq(silnikY.praca, 2 + 1 + 3 + 2, 'silnik praca 3 warstwy: teren2 + glinianka1 + farma3 + irygacja2 = 8');
  eq(renderY.praca, silnikY.praca, 'render == silnik praca (3 warstwy)');
  eq(renderY.handel, silnikY.handel, 'render == silnik handel (3 warstwy)');
  eq(renderY.zywnosc, silnikY.zywnosc, 'render == silnik zywnosc (3 warstwy)');
}

// ---------------------------------------------------------------------------
console.log('\n-- P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA: foodPotentialOfMapHex czyta WSZYSTKIE warstwy --\n');

// ---------------------------------------------------------------------------
// Test 5: heks z ulepszeniem żywnościowym (farma) w LIŚCIE warstw, ale legacy
// `ulepszenie` wskazuje na inną (niefżywnościową) warstwę -- potencjał MUSI być 0,
// bo farma już tam stoi. Stara logika (tylko `h.ulepszenie`) nie widziała farmy
// w liście i zwracała nienależny FARMA_POTENTIAL_FOOD_BONUS.
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    // legacy pole NIE jest ostatnim elementem `ulepszenia` -- scenariusz z tickieta:
    // funkcja nie może polegać na tym polu, musi przeczytać całą listę.
    ulepszenie: 'glinianka',
    ulepszenia: ['glinianka', 'farma'],
  };
  const map = { hexes: { '0,0': hex } };

  const potential = foodPotentialOfMapHex(map, 0, 0);
  eq(potential, 0, 'farma w ulepszenia[] zeruje potencjał, mimo że legacy ulepszenie="glinianka"');

  // Dowód wprost, że stara logika (tylko legacy ulepszenie) dałaby NIENALEŻNY bonus.
  ok(potential !== FARMA_POTENTIAL_FOOD_BONUS,
    `potencjał NIE zwraca nienależnego FARMA_POTENTIAL_FOOD_BONUS=${FARMA_POTENTIAL_FOOD_BONUS} (regresja do legacy pola)`);
}

// ---------------------------------------------------------------------------
// Test 6: pojedyncza warstwa (legacy `ulepszenie` = 'farma', brak tablicy) --
// potencjał dalej musi być 0 (brak regresji dla prostego, jednowarstwowego przypadku).
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    ulepszenie: 'farma',
  };
  const map = { hexes: { '0,0': hex } };

  eq(foodPotentialOfMapHex(map, 0, 0), 0, 'farma (1 warstwa, legacy) zeruje potencjał (regresja podstawowa)');
}

// ---------------------------------------------------------------------------
// Test 7: brak jakiegokolwiek ulepszenia na otwartej Równinie -- potencjał = pełny
// FARMA_POTENTIAL_FOOD_BONUS (regresja podstawowa dla przypadku bez warstw).
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'rownina',
    nakladka: 'brak',
    rzeka: null,
    ulepszenie: 'brak',
  };
  const map = { hexes: { '0,0': hex } };

  eq(foodPotentialOfMapHex(map, 0, 0), FARMA_POTENTIAL_FOOD_BONUS,
    'brak ulepszenia na Równinie -> pełny potencjał farmy (regresja podstawowa)');
}

// ---------------------------------------------------------------------------
// Test 8: trzy warstwy, żywnościowa (irygacja) NIE jest ostatnia w tablicy ani
// legacy polu (legacy = 'tartak', spoza FOOD_IMPROVEMENT_KEYS) -- musi mimo to
// zerować potencjał, bo 'irygacja' jest gdziekolwiek w ulepszenia[].
{
  const hex = {
    coords: { q: 0, r: 0 },
    terenBazowy: 'laka',
    nakladka: 'brak',
    rzeka: null,
    ulepszenie: 'tartak',
    ulepszenia: ['irygacja', 'tartak'],
  };
  const map = { hexes: { '0,0': hex } };

  eq(foodPotentialOfMapHex(map, 0, 0), 0,
    'irygacja gdziekolwiek w ulepszenia[] zeruje potencjał, niezaleznie od legacy ulepszenie="tartak"');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
