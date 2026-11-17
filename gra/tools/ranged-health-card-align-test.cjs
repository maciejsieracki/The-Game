/**
 * ranged-health-card-align-test.cjs
 * R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1 (RANGEDHEALTH, baza cc3c80b17)
 *
 * Decyzje wlasciciela 2026-11-17:
 *   - zdrowie jednostek dystansowych (nie konnych, nie rydwanow) x0,5; wyjatki bez zmian:
 *     Hastati, Wojownik germanski, Medzaj; Katapulta bez zmian;
 *   - Oszczepnik Zulu i Oszczepnik (Estolica): atak dystansowy (missileAttack) = 5,
 *     Estolica zdrowie 10, „Zastap specjalnie” Estolicy = tylko Lucznik;
 *   - karty (`Atak dystansowy`, `Zasieg ataku (hex)`) = to, co liczy silnik.
 *
 * Usage (z gra/):  node tools/ranged-health-card-align-test.cjs
 *
 * Sprawdza:
 *   (a) zdrowie (`health`) kazdej jednostki wg tabeli decyzji,
 *   (b) silnik: missileAttack Zulu/Estolica = 5, reszta zgodna z tabela,
 *   (c) karta == silnik dla CALEJ listy: `Atak dystansowy` == missileAttack,
 *       zasieg karty == zasieg silnika (reach >= 2 albo 2 gdy strzelec),
 *   (d) Estolica „Zastap specjalnie” = Lucznik,
 *   (e) mutacja na KOPII danych (zmiana jednego pola) => check czerwony.
 */

'use strict';

const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const DEFAULT_RANGED_REACH = 2; // battleScene.ts: zasieg domyslny strzelca

// Zdrowie wg decyzji 2026-11-17 (zamiana x0,5 dla dystansowych; wyjatki zachowane).
const EXPECTED_HEALTH = {
  'Oszczepnik': 8,
  'Oszczepnik Zulu (Izijula)': 10,
  'Oszczepnik (Estólica)': 10,
  'Łucznik': 10,
  'Łucznik egipski': 10,
  'Łucznik nubijski': 10,
  'Łucznik sumeryjski': 10,
  'Łucznik akadyjski': 10,
  'Łucznik asyryjski': 10,
  'Procarz': 8,
  'Procarz (Huaracoc)': 8,
  // bez zmian (wyjatki i jednostki konne/rydwany/obleznicze/wrecz)
  'Hastati': 38,
  'Wojownik germański': 30,
  'Medżaj (Gwardia Faraona)': 42,
  'Konnica łucznicza asyryjska': 60,
  'Jeździec z oszczepami': 56,
  'Rydwan egipski': 112,
  'Katapulta': 250,
  'Drużynnik': 31,
  'Thorakites': 42,
  'Evocati': 55,
  'Gwardzista z champi': 48,
};

// Atak dystansowy silnika (missileAttack) — jedyne zmienione: Zulu i Estolica = 5.
const EXPECTED_MISSILE = {
  'Oszczepnik Zulu (Izijula)': 5,
  'Oszczepnik (Estólica)': 5,
  'Oszczepnik': 4,
  'Procarz': 4,
  'Procarz (Huaracoc)': 4,
  'Łucznik': 4,
  'Łucznik egipski': 5,
  'Łucznik nubijski': 6,
  'Łucznik sumeryjski': 4,
  'Łucznik akadyjski': 5,
  'Łucznik asyryjski': 4,
  'Hastati': 4,
  'Drużynnik': 7,
  'Thorakites': 6,
  'Evocati': 6,
  'Gwardzista z champi': 5,
  'Rydwan egipski': 10,
  'Katapulta': 4,
  'Jeździec z oszczepami': 14,
  'Konnica łucznicza asyryjska': 12,
  'Medżaj (Gwardia Faraona)': 3,
  'Wojownik germański': 4,
};

let failures = 0;
let passes = 0;
function check(cond, msg) {
  if (cond) passes++;
  else { failures++; console.log('  FAIL: ' + msg); }
}

// Zasieg silnika wg battleScene.ts attackRange(): reach>=2 -> reach; strzelec -> 2; inaczej 0.
function engineRange(u) {
  const dyst = Number(u.missileAttack) || 0;
  const reach = Number(u['Zasięg ataku (hex)']);
  const r = Number.isFinite(reach) ? reach : 0;
  if (r >= 2) return Math.round(r);
  if (dyst > 0) return Math.max(DEFAULT_RANGED_REACH, Math.round(r));
  return 0;
}

// Zasieg karty: liczba z pola „Zasięg ataku (hex)” albo 0 (karta pokazuje „—”).
function cardRange(u) {
  const r = Number(u['Zasięg ataku (hex)']);
  return Number.isFinite(r) && r > 0 ? r : 0;
}

// Zwraca liste bledow (pusta = zielono). Uzywane takze w mutacji.
function checkUnits(units) {
  const errs = [];
  const byName = new Map(units.map((u) => [u['Jednostka'], u]));

  for (const [name, hp] of Object.entries(EXPECTED_HEALTH)) {
    const u = byName.get(name);
    if (!u) { errs.push(`brak wpisu ${name}`); continue; }
    if (u.health !== hp) errs.push(`${name}: health=${u.health} (oczekiwano ${hp})`);
  }
  for (const [name, m] of Object.entries(EXPECTED_MISSILE)) {
    const u = byName.get(name);
    if (!u) { errs.push(`brak wpisu ${name}`); continue; }
    if (u.missileAttack !== m) errs.push(`${name}: missileAttack=${u.missileAttack} (oczekiwano ${m})`);
  }

  const est = byName.get('Oszczepnik (Estólica)');
  if (est && est['Zastąp specjalnie'] !== 'Łucznik') {
    errs.push(`Oszczepnik (Estólica): Zastąp specjalnie=${est['Zastąp specjalnie']} (oczekiwano Łucznik)`);
  }

  for (const u of units) {
    const name = u['Jednostka'];
    if (u['Atak dystansowy'] !== u.missileAttack) {
      errs.push(`${name}: karta Atak dystansowy=${u['Atak dystansowy']} != silnik missileAttack=${u.missileAttack}`);
    }
    if (u.missileAttack > 0) {
      const er = engineRange(u);
      const cr = cardRange(u);
      if (cr !== er) errs.push(`${name}: karta zasieg=${u['Zasięg ataku (hex)']} != silnik ${er}`);
    } else if (u['Atak dystansowy'] !== 0) {
      errs.push(`${name}: strzelec-bez-ataku: karta Atak dystansowy=${u['Atak dystansowy']}`);
    }
  }
  return errs;
}

function main() {
  const units = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  console.log(`[a-d] dane units.json (${units.length} jednostek)`);
  const errs = checkUnits(units);
  for (const e of errs) console.log('  FAIL: ' + e);
  check(errs.length === 0, 'units.json zgodne z decyzja RANGEDHEALTH i karty = silnik');
  check(units.length === 75, `oczekiwano 75 jednostek, jest ${units.length}`);

  console.log('[e] mutacja na kopii (musi dac czerwony)');
  const copy = JSON.parse(JSON.stringify(units));
  copy.find((u) => u['Jednostka'] === 'Łucznik egipski')['Atak dystansowy'] = 6;
  check(checkUnits(copy).length > 0, 'mutacja: karta Atak dystansowy egipskiego != silnik wykryta');
  const copy2 = JSON.parse(JSON.stringify(units));
  copy2.find((u) => u['Jednostka'] === 'Procarz').health = 16;
  check(checkUnits(copy2).length > 0, 'mutacja: health Procarza=16 wykryte');
  const copy3 = JSON.parse(JSON.stringify(units));
  copy3.find((u) => u['Jednostka'] === 'Drużynnik')['Zasięg ataku (hex)'] = '—';
  check(checkUnits(copy3).length > 0, 'mutacja: zasieg karty Drużynnika „—” (silnik 2) wykryty');

  console.log(`WYNIK: ${passes} pass, ${failures} fail`);
  if (failures) {
    console.log('=== ranged-health-card-align-test: FAIL ===');
    process.exit(1);
  }
  console.log('=== ranged-health-card-align-test: ALL GREEN ===');
}

main();
