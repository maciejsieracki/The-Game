'use strict';
/**
 * defeat-last-city-test.cjs — R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 (kryterium 1).
 * Test jednostkowy reguły przegranej w src/game/victory.ts (checkDefeat / checkVictory).
 * Run from gra/: node tools/defeat-last-city-test.cjs
 *
 * Reguła: brak miast gracza + gracz kiedykolwiek miał miasto => 'przegrana'.
 * Osadnicy NIE ratują (zmiana względem wcześniejszej reguły "brak miast i osadników").
 * Przed pierwszym miastem (graczKiedysMialMiasto=false) gracz NIE przegrywa.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[defeat-last-city-test] esbuild not found. Run: npm ci (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.defeat-last-city-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.defeat-last-city-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { checkVictory, checkDefeat, isEliminated } from '../src/game/victory';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[defeat-last-city-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const V = require(BUNDLE_FILE);
const { checkVictory, checkDefeat } = V;

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; }
  else { failed++; console.error('  FAIL:', msg, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}

const city = (ownerId, name = 'X') => ({ ownerId, name, q: 0, r: 0, population: 1 });
const BARB = -1;
const rod = (r) => (r ? r.rodzaj : null);

// 1. Jedno miasto gracza: brak przegranej (granica N).
eq(rod(checkVictory({ players: [], cities: [city(0)], gracz: 0, graczKiedysMialMiasto: true })),
  null, '1 miasto gracza => brak przegranej');
eq(checkDefeat({ cities: [city(0)], gracz: 0, graczKiedysMialMiasto: true }), null,
  'checkDefeat: 1 miasto => null');

// 2. Brak miast + kiedysMial => przegrana (granica N-1), także bez osadników.
eq(rod(checkVictory({ players: [], cities: [city(BARB)], gracz: 0, graczKiedysMialMiasto: true, liczbaOsadnikow: 0 })),
  'przegrana', '0 miast (miasto zdobyte przez barbarzyńców), 0 osadników => przegrana');

// 3. Osadnicy NIE ratują po utracie ostatniego miasta.
eq(rod(checkVictory({ players: [], cities: [city(BARB)], gracz: 0, graczKiedysMialMiasto: true, liczbaOsadnikow: 2 })),
  'przegrana', '0 miast + 2 osadników => przegrana (osadnicy nie ratują)');
eq(rod(checkDefeat({ cities: [], gracz: 0, graczKiedysMialMiasto: true })),
  'przegrana', 'checkDefeat: pusta lista miast => przegrana');

// 4. Przed pierwszym miastem: brak przegranej (także z osadnikiem).
eq(checkVictory({ players: [], cities: [], gracz: 0, graczKiedysMialMiasto: false, liczbaOsadnikow: 1 }),
  null, 'przed pierwszym miastem (osadnik, brak miasta) => null');
eq(checkDefeat({ cities: [], gracz: 0, graczKiedysMialMiasto: false }), null,
  'checkDefeat: !kiedysMial => null');

// 5. Miasta innego właściciela nie liczą się jako miasta gracza.
eq(rod(checkDefeat({ cities: [city(1), city(2), city(BARB)], gracz: 0, graczKiedysMialMiasto: true })),
  'przegrana', 'miasta obcych właścicieli => gracz bez miast => przegrana');

// 6. Granica N+1: dwa miasta gracza, jedno utracone => gra trwa.
eq(checkDefeat({ cities: [city(0, 'A'), city(BARB, 'B')], gracz: 0, graczKiedysMialMiasto: true }), null,
  '2 miasta, 1 utracone => brak przegranej');

// 7. Pola opcjonalne: domyślnie kiedysMial=true; NaN/undefined liczby osadników nie wpływa na wynik.
eq(rod(checkDefeat({ cities: [], gracz: 0 })), 'przegrana',
  'checkDefeat bez graczKiedysMialMiasto => domyślnie true => przegrana przy 0 miast');
eq(rod(checkVictory({ players: [], cities: [], gracz: 0 })), 'przegrana',
  'checkVictory bez opcjonalnych pól => przegrana przy 0 miast');
eq(rod(checkDefeat({ cities: [{ name: 'bez ownerId', q: 0, r: 0 }], gracz: 0, graczKiedysMialMiasto: true })),
  'przegrana', 'miasto bez ownerId nie jest miastem gracza');
eq(rod(checkVictory({ players: [], cities: [city(0)], gracz: 0, graczKiedysMialMiasto: true, liczbaOsadnikow: NaN })),
  null, 'liczbaOsadnikow=NaN nie wpływa na brak przegranej przy 1 mieście');

// 8. Kolejność: przegrana przed nauką (bez zmian).
eq(rod(checkVictory({
  players: [], cities: [], gracz: 0, graczKiedysMialMiasto: true,
  wszystkieTechZbadane: true, rakietaWystrzelona: true,
})), 'przegrana', 'brak miast przed nauką => przegrana (kolejność: przegrana przed nauką)');

fs.rmSync(ENTRY_FILE, { force: true });
fs.rmSync(BUNDLE_FILE, { force: true });

console.log(`[defeat-last-city-test] ${passed} passed, ${failed} failed (total ${passed + failed}).`);
process.exit(failed === 0 ? 0 : 1);
