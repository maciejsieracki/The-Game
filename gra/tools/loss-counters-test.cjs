'use strict';
/**
 * loss-counters-test.cjs — test czystej logiki liczników strat (src/game/loss-counters.ts).
 * Sprawdza: utrata miasta gracza liczy się (zdobycie / poddanie / bunt / cesja / aneksja),
 * zdobycie miasta PRZEZ gracza i zmiana między AI nie liczą się; liczniki są niezmienne
 * (zwracają nową wartość); odczyt zapisu: brak / zła wartość -> 0 (stary zapis wczytuje się);
 * isDefeatedState (reguła autozapisu po porażce) zgodna z checkDefeat.
 * Mutacja na kopii: env LC_SRC=<ścieżka do kopii loss-counters.ts> podmienia źródło testowane.
 * Run from gra/: node tools/loss-counters-test.cjs   (wymaga: npm ci w gra/)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[loss-counters-test] esbuild not found. Run: npm ci (from gra/)');
    process.exit(1);
  }
})();

const SRC = process.env.LC_SRC
  ? path.resolve(process.env.LC_SRC)
  : path.resolve(__dirname, '..', 'src', 'game', 'loss-counters.ts');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loss-counters-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(ENTRY, [
  'export * from ' + JSON.stringify(SRC.replace(/\.ts$/, '')) + ';',
  '',
].join('\n'));
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: BUNDLE,
  logLevel: 'silent',
});
const L = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// 1. Co liczy się jako utrata miasta gracza (owner 0)
eq(L.isPlayerCityLoss(0, 1), true, 'przejęcie przez AI = utrata');
eq(L.isPlayerCityLoss(0, -1), true, 'zdobycie przez barbarzyńców = utrata');
eq(L.isPlayerCityLoss(0, 1000), true, 'bunt (frakcja rebeliantów) = utrata');
eq(L.isPlayerCityLoss(1, 0), false, 'zdobycie miasta przez gracza nie jest stratą');
eq(L.isPlayerCityLoss(2, 3), false, 'zmiana między AI nie jest stratą gracza');
eq(L.isPlayerCityLoss(0, 0), false, 'brak zmiany właściciela nie jest stratą');

// 2. Liczniki: niezmienność i sumowanie
const c0 = L.emptyLossCounters();
eq(c0.lostCities, 0, 'start: miasta 0');
eq(c0.lostUnits, 0, 'start: jednostki 0');
const c1 = L.recordCityLoss(c0, 0, 2);
eq(c1.lostCities, 1, 'po utracie miasta licznik = 1');
eq(c0.lostCities, 0, 'wejście nie jest mutowane (miasta)');
const c2 = L.recordCityLoss(c1, 2, 0);
eq(c2.lostCities, 1, 'zdobycie miasta przez gracza nie zwiększa licznika');
const c3 = L.recordUnitLosses(c2, 3);
eq(c3.lostUnits, 3, 'trzy poległe jednostki = 3');
eq(c2.lostUnits, 0, 'wejście nie jest mutowane (jednostki)');
eq(L.recordUnitLosses(c3, 0), c3, 'zero poległych nie zmienia licznika');
eq(L.recordUnitLosses(c3, -4).lostUnits, 3, 'ujemna liczba poległych ignorowana');
eq(L.recordUnitLosses(c3, NaN).lostUnits, 3, 'NaN ignorowany');
eq(L.recordUnitLosses(c3, 2.9).lostUnits, 5, 'ułamek obcinany (2.9 -> 2)');

// 3. Odczyt zapisu (niezaufany JSON)
eq(L.normalizeLossCounters(undefined).lostCities, 0, 'stary zapis bez pola -> 0');
eq(JSON.stringify(L.normalizeLossCounters(undefined)), JSON.stringify({ lostCities: 0, lostUnits: 0 }), 'stary zapis -> {0,0}');
eq(JSON.stringify(L.normalizeLossCounters('zle')), JSON.stringify({ lostCities: 0, lostUnits: 0 }), 'zły typ -> {0,0}');
eq(JSON.stringify(L.normalizeLossCounters({ lostCities: 4, lostUnits: '9' })), JSON.stringify({ lostCities: 4, lostUnits: 0 }), 'string nie jest liczbą -> 0');
eq(JSON.stringify(L.normalizeLossCounters({ lostCities: -2, lostUnits: 1e400 })), JSON.stringify({ lostCities: 0, lostUnits: 0 }), 'ujemne i nieskończone -> 0');
eq(JSON.stringify(L.normalizeLossCounters({ lostCities: 2, lostUnits: 5 })), JSON.stringify({ lostCities: 2, lostUnits: 5 }), 'poprawny zapis wczytany 1:1');

// 4. Round-trip zapisu z licznikami
const saved = JSON.parse(JSON.stringify({ ...c3 }));
eq(JSON.stringify(L.normalizeLossCounters(saved)), JSON.stringify(c3), 'round-trip JSON zachowuje liczniki');

// 5. Autozapis po porażce: reguła = checkDefeat (0 miast gracza + wcześniej miał miasto)
const cityOf = (owner) => ({ ownerId: owner });
eq(L.isDefeatedState({ cities: [cityOf(1), cityOf(2)], graczKiedysMialMiasto: true }), true, 'gracz bez miast (tylko AI) i kiedyś miał -> porażka');
eq(L.isDefeatedState({ cities: [cityOf(0), cityOf(2)], graczKiedysMialMiasto: true }), false, 'gracz ma miasto -> nie porażka');
eq(L.isDefeatedState({ cities: [cityOf(1)], graczKiedysMialMiasto: false }), false, 'nigdy nie miał miasta -> brak porażki (start, nie klęska)');
eq(L.isDefeatedState({ cities: [], graczKiedysMialMiasto: true }), true, 'brak jakichkolwiek miast i kiedyś miał -> porażka');

// 6. Mutacja na kopii (LC_SRC): test nie może przejść z zepsutą regułą -- sprawdzane ręcznie w raporcie.

console.log(`loss-counters-test: ${passed} OK, ${failed} FAIL`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed === 0 ? 0 : 1);
