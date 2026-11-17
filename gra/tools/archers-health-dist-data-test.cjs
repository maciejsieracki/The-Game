/**
 * archers-health-dist-data-test.cjs
 * R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1
 *
 * Decyzje wlasciciela:
 *   - 2026-11-16: zdrowie wszystkich PIESZYCH jednostek lucznizych = 20 (wszystkie warianty),
 *   - 2026-11-17 (nadpisuje wartosci dystansu z 2026-11-16): atak dystansowy
 *     ORAZ missileAttack (silnik): Lucznik 4, Lucznik egipski 5, Lucznik nubijski 6
 *     (ta sama liczba w silniku i na karcie),
 *   - pozostale liczby bez zmian (konnica lucznicza, oszczepnicy, procarze).
 *
 * Usage (z gra/):  node tools/archers-health-dist-data-test.cjs
 *
 * Sprawdza:
 *   (a) dane: pola `Health` ORAZ `health` (combat.ts czyta `health`) = 20,
 *   (b) atak dystansowy (`Atak dystansowy`, `missileAttack`) wg decyzji,
 *   (c) jednostki spoza zakresu nie zmienione wzgledem wartosci zastanych,
 *   (d) realna funkcja combatUnitFromDef(...).maxHp = 20 (bundle esbuild),
 *   (e) mutacja na KOPII danych (egipski Health 40 / dystans 5) => check czerwony.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const COMBAT_TS = path.join(GRA_DIR, 'src/game/combat.ts');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');

// Pieszy lucznik = wpis, ktorego pole `Jednostka` zaczyna sie od "Łucznik"
// (ta sama klasa co ranged_damage_mult.lucznik_piesi). Konnica lucznicza
// ("Konnica łucznicza asyryjska") NIE jest pieszym lucznikiem.
const ARCHER_HEALTH = 20;
// Decyzja wlasciciela 2026-11-17: 4 / 5 / 6, karta (`Atak dystansowy`) i silnik (`missileAttack`) identyczne.
const EXPECTED_MISSILE = {
  'Łucznik': 4,
  'Łucznik egipski': 5,
  'Łucznik nubijski': 6,
};
// Pozostale pieszy-lucznicze warianty: dystans bez zmian (wartosci zastane).
const UNCHANGED_DIST = {
  'Łucznik sumeryjski': 4,
  'Łucznik akadyjski': 6,
  'Łucznik asyryjski': 6,
};
// Jednostki spoza zakresu: zdrowie zastane (nie moga sie zmienic).
const UNCHANGED_HEALTH = {
  'Konnica łucznicza asyryjska': 60,
  'Oszczepnik': 16,
  'Procarz': 16,
};

let failures = 0;
let passes = 0;
function assert(cond, msg) {
  if (cond) { passes++; } else { failures++; console.log('  FAIL: ' + msg); }
}

function isPedestrianArcher(u) {
  const j = u['Jednostka'];
  return typeof j === 'string' && j.startsWith('Łucznik');
}

function findByName(units, name) {
  return units.filter((u) => u['Jednostka'] === name);
}

// Zwraca liste bledow (pusta = zielono). Uzywane takze w mutacji.
function checkUnits(units) {
  const errs = [];
  const archers = units.filter(isPedestrianArcher);
  if (archers.length !== 6) errs.push(`oczekiwano 6 pieszych lucznikow, jest ${archers.length}`);
  for (const u of archers) {
    const name = u['Jednostka'];
    if ('Health' in u) errs.push(`${name}: pole Health nie moze istniec (jedno pole: health)`);
    if (u['health'] !== ARCHER_HEALTH) errs.push(`${name}: health=${u['health']} (oczekiwano ${ARCHER_HEALTH})`);
    if (name in EXPECTED_MISSILE) {
      const want = EXPECTED_MISSILE[name];
      if (u['Atak dystansowy'] !== want) errs.push(`${name}: Atak dystansowy=${u['Atak dystansowy']} (oczekiwano ${want})`);
      if (u['missileAttack'] !== want) errs.push(`${name}: missileAttack=${u['missileAttack']} (oczekiwano ${want})`);
    } else if (name in UNCHANGED_DIST) {
      const want = UNCHANGED_DIST[name];
      if (u['Atak dystansowy'] !== want) errs.push(`${name}: Atak dystansowy=${u['Atak dystansowy']} (oczekiwano ${want}, bez zmian)`);
    } else {
      errs.push(`nieoczekiwany pieszy lucznik: ${name}`);
    }
  }
  for (const [name, want] of Object.entries(UNCHANGED_HEALTH)) {
    const rows = findByName(units, name);
    if (rows.length === 0) { errs.push(`brak wpisu ${name}`); continue; }
    for (const r of rows) {
      if (r['health'] !== want) errs.push(`${name}: health=${r['health']} (oczekiwano ${want}, bez zmian)`);
    }
  }
  return errs;
}

function loadCombatMaxHp(defs) {
  const tmp = path.join(os.tmpdir(), `archers-combat-bundle-${process.pid}-${Math.random().toString(36).slice(2, 8)}.cjs`);
  try {
    execFileSync(ESBUILD_BIN, [COMBAT_TS, '--bundle', '--format=cjs', '--platform=node', `--outfile=${tmp}`, '--log-level=error'], { stdio: 'pipe' });
    const mod = require(tmp);
    // CombatUnit.health = maxHp dla swiezo utworzonej jednostki (combat.ts:220: opts.hp ?? maxHp).
    return defs.map((d) => mod.combatUnitFromDef(d).health);
  } finally {
    try { fs.rmSync(tmp, { force: true }); } catch { /* best-effort */ }
  }
}

function main() {
  const units = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));

  console.log('[a/b/c] dane units.json');
  const errs = checkUnits(units);
  for (const e of errs) console.log('  FAIL: ' + e);
  assert(errs.length === 0, 'dane units.json zgodne z decyzja');

  console.log('[d] combatUnitFromDef(...).maxHp');
  const archers = units.filter(isPedestrianArcher);
  const hps = loadCombatMaxHp(archers);
  archers.forEach((u, i) => {
    assert(hps[i] === ARCHER_HEALTH, `combatUnitFromDef(${u['Jednostka']}).health=${hps[i]} (oczekiwano ${ARCHER_HEALTH})`);
  });

  console.log('[e] mutacja na kopii (musi dac czerwony)');
  const copy = JSON.parse(JSON.stringify(units));
  const egypt = findByName(copy, 'Łucznik egipski')[0];
  egypt['health'] = 40;
  assert(checkUnits(copy).length > 0, 'mutacja health egipskiego=40 wykryta');
  const copy2 = JSON.parse(JSON.stringify(units));
  findByName(copy2, 'Łucznik egipski')[0]['Atak dystansowy'] = 6;
  assert(checkUnits(copy2).length > 0, 'mutacja dystansu egipskiego=6 (stara wartosc) wykryta');
  const copy3 = JSON.parse(JSON.stringify(units));
  findByName(copy3, 'Łucznik egipski')[0]['missileAttack'] = 6;
  assert(checkUnits(copy3).length > 0, 'mutacja missileAttack egipskiego=6 (stara wartosc) wykryta');

  console.log(`WYNIK: ${passes} pass, ${failures} fail`);
  if (failures > 0) {
    console.log('=== archers-health-dist-data-test: FAIL ===');
    process.exit(1);
  }
  console.log('=== archers-health-dist-data-test: ALL GREEN ===');
}

main();
