#!/usr/bin/env node
// R-WEB-DATA-UNITS-HEALTH-SINGLE-FIELD-Q1 — test-strażnik jednego pola zdrowia jednostki.
// Kanoniczne pole definicji = `health` (decyzja właściciela A, 2026-11-17).
// Sprawdza:
//   (a) żaden wiersz units.json nie ma pola `Health`;
//   (b) każda jednostka ma `health` > 0;
//   (c) piesze łuczniczki mają health = 20;
//   (d) czytelnicy definicji w gra/src nie czytają `Health` (wyjątki: pola runtime HP
//       SiegeUnit / parametr estimateUnitCombatStrength — nie są polem definicji);
//   (e) mutacja na KOPII danych (przywrócenie `Health`) daje czerwony wynik.
// Uruchomienie: node gra/tools/units-health-single-field-test.cjs (bez zależności).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UNITS_PATH = path.join(ROOT, 'data', 'units.json');
const SRC_DIR = path.join(ROOT, 'src');
const ARCHER_HEALTH = 20;
const PEDESTRIAN_ARCHERS = [
  'Łucznik', 'Łucznik egipski', 'Łucznik nubijski', 'Łucznik sumeryjski',
  'Łucznik akadyjski', 'Łucznik asyryjski',
];

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log(`  OK  ${msg}`);
  } else {
    failures++;
    console.log(`  FAIL ${msg}`);
  }
}

// Zwraca listę błędów danych (pusta = zielono). Używane także w mutacji.
function checkUnits(units) {
  const errs = [];
  if (!Array.isArray(units) || units.length === 0) return ['brak listy jednostek'];
  for (const u of units) {
    const name = u['Jednostka'];
    if (Object.prototype.hasOwnProperty.call(u, 'Health')) {
      errs.push(`${name}: pole Health nie może istnieć (jedno pole: health)`);
    }
    if (!(typeof u.health === 'number' && u.health > 0)) {
      errs.push(`${name}: health=${u.health} (oczekiwano liczby > 0)`);
    }
  }
  for (const name of PEDESTRIAN_ARCHERS) {
    const row = units.find(u => u['Jednostka'] === name);
    if (!row) { errs.push(`brak wpisu ${name}`); continue; }
    if (row.health !== ARCHER_HEALTH) errs.push(`${name}: health=${row.health} (oczekiwano ${ARCHER_HEALTH})`);
  }
  return errs;
}

// Skan źródeł: definicje jednostek nie mogą być czytane przez `Health`.
// Pola runtime HP oblężenia (`unit.Health` na SiegeUnit) nie są polem definicji i nie są
// objęte wzorcem (wzorzec celuje w `def`/`row` i klucz `['Health']`).
function scanSource(dir) {
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx|js)$/.test(e.name)) {
        const rel = path.relative(SRC_DIR, p).split(path.sep).join('/');
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        lines.forEach((l, i) => {
          if (/\bdef\??\.Health\b|\bdef\??\.\[?['"]Health['"]\]?|\brow\??\.Health\b|\[['"]Health['"]\]/.test(l)) {
            hits.push({ rel, line: i + 1, text: l.trim() });
          }
        });
      }
    }
  };
  walk(dir);
  return hits;
}

console.log('[a-c] dane units.json');
const units = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
const dataErrs = checkUnits(units);
check(dataErrs.length === 0, `units.json: ${units.length} jednostek, ${dataErrs.length} błędów ${dataErrs.slice(0, 3).join(' | ')}`);

console.log('[d] czytelnicy Health w gra/src (definicje)');
const hits = scanSource(SRC_DIR);
const bad = hits;
check(bad.length === 0, `trafienia odczytu Health z definicji: ${bad.length} ${bad.slice(0, 5).map(h => `${h.rel}:${h.line}`).join(', ')}`);

console.log('[e] mutacja na kopii (przywrócenie Health musi dać błąd)');
const copy = JSON.parse(JSON.stringify(units));
const egypt = copy.find(u => u['Jednostka'] === 'Łucznik egipski');
egypt['Health'] = 40;
check(checkUnits(copy).length > 0, 'mutacja: Health dodany do Łucznika egipskiego wykryty');
const copy2 = JSON.parse(JSON.stringify(units));
copy2.find(u => u['Jednostka'] === 'Łucznik egipski').health = 40;
check(checkUnits(copy2).length > 0, 'mutacja: health egipskiego=40 wykryte (łuczniczki = 20)');

console.log(failures === 0 ? 'WYNIK: ZIELONO' : `WYNIK: CZERWONO (${failures})`);
process.exitCode = failures === 0 ? 0 : 1;
