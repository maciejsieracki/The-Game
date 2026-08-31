'use strict';

/**
 * forced-war-bronze-new-game-reset-test.cjs — R-WOJNA-BRAZ-CZYSZCZENIE-NOWA-GRA-Q1
 *
 * Realna egzekucja (nie regex-nad-tekstem, wzorem `muzyka-braz-era-playlist-test.cjs`)
 * fragmentu bloku „nowa gra" w `gra/src/main.ts`, który czyści rejestry wymuszonej
 * wojny Kamienia/Żelaza/Brązu. Wyodrębnia dokładny tekst tego fragmentu ze źródła
 * (regex/indexOf po niepowtarzalnych kotwicach), wykonuje go przez `new Function`
 * z atrapami Set/Map w miejscu rejestrów, i sprawdza że WSZYSTKIE 12 struktur
 * (4x Kamień, 4x Żelazo, 4x Brąz) są puste po egzekucji. Kotwica startowa
 * (`lootedVillageHexKeys.clear();`) służy wyłącznie do precyzyjnego pozycjonowania
 * wycięcia — sama linia zostaje POZA wyodrębnionym tekstem.
 *
 * Kryterium 3 (mutacja): druga runda usuwa JEDNO z 4 wywołań `bronzeForceWar*.clear()`
 * z wyodrębnionego tekstu przed wykonaniem — test MUSI wtedy wykryć niepustą strukturę.
 *
 * Uruchamianie z gra/: node tools/forced-war-bronze-new-game-reset-test.cjs
 */

const fs = require('fs');
const path = require('path');
const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

// ---------------------------------------------------------------------------
// Wyodrębnienie bloku ze źródła po niepowtarzalnych kotwicach.
// ---------------------------------------------------------------------------
const START_ANCHOR = 'lootedVillageHexKeys.clear();\n';
const END_ANCHOR = '\n      barbCamps = [];';

function extractResetSlice(source) {
  const startIdx = source.indexOf(START_ANCHOR);
  if (startIdx === -1) throw new Error('kotwica startowa nie znaleziona w main.ts');
  const contentStart = startIdx + START_ANCHOR.length;
  const endIdx = source.indexOf(END_ANCHOR, contentStart);
  if (endIdx === -1) throw new Error('kotwica końcowa nie znaleziona w main.ts');
  return source.slice(contentStart, endIdx);
}

const originalSlice = extractResetSlice(main);

console.log('R-WOJNA-BRAZ-CZYSZCZENIE-NOWA-GRA-Q1 — realna egzekucja bloku "nowa gra"\n');

// Kontrola sanity: wycięty fragment faktycznie zawiera Kamień/Żelazo/Brąz.
assert(
  'wyodrębniony fragment zawiera dokładnie 4 wywołania stoneForceWar*.clear()',
  (originalSlice.match(/stoneForceWar\w+\.clear\(\);/g) || []).length === 4,
);
assert(
  'wyodrębniony fragment zawiera dokładnie 4 wywołania ironForceWar*.clear()',
  (originalSlice.match(/ironForceWar\w+\.clear\(\);/g) || []).length === 4,
);
assert(
  'wyodrębniony fragment zawiera dokładnie 4 wywołania bronzeForceWar*.clear()',
  (originalSlice.match(/bronzeForceWar\w+\.clear\(\);/g) || []).length === 4,
);

const PARAM_NAMES = [
  'stoneForceWarPendingOwners',
  'stoneForceWarCycleOwners',
  'stoneForceWarRestUntilByOwner',
  'stoneForceWarActiveByPairKey',
  'ironForceWarPendingOwners',
  'ironForceWarCycleOwners',
  'ironForceWarRestUntilByOwner',
  'ironForceWarActiveByPairKey',
  'bronzeForceWarPendingOwners',
  'bronzeForceWarCycleOwners',
  'bronzeForceWarRestUntilByOwner',
  'bronzeForceWarActiveByPairKey',
];

function seededRegistries() {
  const reg = {};
  for (const name of PARAM_NAMES) {
    // Set-podobne rejestry (Pending/Cycle owners, lootedVillageHexKeys) i
    // Map-podobne (RestUntilByOwner, ActiveByPairKey) — obie mają .clear()/.size,
    // więc realny Set/Map jako atrapa jest wierny zachowaniu produkcyjnemu.
    if (/RestUntilByOwner$/.test(name) || /ActiveByPairKey$/.test(name)) {
      const m = new Map();
      m.set(name === 'ironForceWarActiveByPairKey' || name === 'stoneForceWarActiveByPairKey'
        || name === 'bronzeForceWarActiveByPairKey' ? 'p1|p2' : 1, { seeded: true, attackerId: 1 });
      reg[name] = m;
    } else {
      const s = new Set();
      s.add(1);
      reg[name] = s;
    }
  }
  return reg;
}

function runSlice(sliceText, reg) {
  const fn = new Function(...PARAM_NAMES, sliceText);
  fn(...PARAM_NAMES.map(n => reg[n]));
}

// ---------------------------------------------------------------------------
// Kryterium 2: rejestr Brązu (i sąsiednich epok) niepusty -> po egzekucji bloku
// "nowa gra" WSZYSTKIE struktury są puste.
// ---------------------------------------------------------------------------
const regReal = seededRegistries();
for (const name of PARAM_NAMES) {
  assert(`seed: ${name}.size > 0 przed egzekucją`, regReal[name].size > 0);
}

runSlice(originalSlice, regReal);

for (const name of PARAM_NAMES) {
  assert(`po egzekucji bloku "nowa gra": ${name}.size === 0`, regReal[name].size === 0, regReal[name].size);
}

// ---------------------------------------------------------------------------
// Kryterium 3: mutacja — usunięcie JEDNEGO z 4 wywołań bronzeForceWar*.clear()
// z wyodrębnionego tekstu MUSI zaczerwienić test (struktura zostaje niepusta).
// ---------------------------------------------------------------------------
const MUTATION_TARGET = 'bronzeForceWarActiveByPairKey.clear();';
if (!originalSlice.includes(MUTATION_TARGET)) {
  throw new Error('cel mutacji nieobecny w wyodrębnionym fragmencie — bramka nie ma czego pilnować');
}
const mutatedSlice = originalSlice.replace(MUTATION_TARGET, '/* USUNIĘTO: ' + MUTATION_TARGET + ' */');

const regMutated = seededRegistries();
runSlice(mutatedSlice, regMutated);

const mutationCaught = regMutated.bronzeForceWarActiveByPairKey.size > 0;
assert(
  'MUTACJA: usunięcie bronzeForceWarActiveByPairKey.clear() zostawia niepustą strukturę (test wykrywa regres)',
  mutationCaught,
  regMutated.bronzeForceWarActiveByPairKey.size,
);
// Reszta struktur (w tym pozostałe 3 rejestry Brązu) nadal poprawnie czyszczona —
// dowód, że mutacja jest punktowa, nie psuje całego bloku.
let restStillClean = true;
for (const name of PARAM_NAMES) {
  if (name === 'bronzeForceWarActiveByPairKey') continue;
  if (regMutated[name].size !== 0) restStillClean = false;
}
assert(
  'MUTACJA jest punktowa: pozostałe 11 struktur (w tym 3/4 rejestrów Brązu) nadal czyszczone',
  restStillClean,
);

console.log(`\nWYNIK: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
