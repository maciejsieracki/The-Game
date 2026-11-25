/**
 * procarz-piercing-shot-test.cjs -- R-WEB-UNIT-PROCARZ-PIERCING-ARMOR-REDUCTION-Q1
 *
 * Usage (from gra/):  node tools/procarz-piercing-shot-test.cjs
 *
 * Sprawdza: strzal procarza (Typ Slinger, takze Procarz (Huaracoc)) liczy sie wzorem
 * ciosu wreczna: max(0, atak dyst. - pancerz) + przebicie 2, x3 (mnoznik klasy), min 1.
 * Pozostale jednostki dystansowe (Lucznik, Oszczepnik) -- bez zmian, bez przebicia w strzale.
 * Bundluje src/game/combat.ts esbuildem (jak ranged-damage-mult-test.cjs).
 */
'use strict';

const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `procarz-piercing-${RUN_ID}-${TMPDIR_RUN_ID}`);
fs.mkdirSync(OUT_DIR, { recursive: true });
process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

const out = path.join(OUT_DIR, 'combat.cjs');
execSync(`"${ESBUILD_BIN}" "${path.join(GRA_DIR, 'src/game/combat.ts')}" --bundle --platform=node --format=cjs --outfile="${out}" --log-level=warning`, { stdio: 'inherit' });
const combat = require(out);
const units = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/units.json'), 'utf8'));

let failed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: ${actual}${ok ? '' : ` (oczekiwano ${expected})`}`);
}
function row(name) {
  const r = units.find(u => u.Jednostka === name);
  if (!r) throw new Error(`brak jednostki ${name} w units.json`);
  return r;
}
function cu(name) {
  return combat.combatUnitFromDef(row(name), { typNazwa: name });
}

// 1. Dane: przebicie procarza i Huaracoc = 2 (karta i silnik zgodne)
check('units.json Procarz piercing', row('Procarz').piercing, 2);
check('units.json Procarz (Huaracoc) piercing', row('Procarz (Huaracoc)').piercing, 2);
check('units.json Procarz karta Przebicie', row('Procarz')['Przebicie'], 2);

// 2. Oczekiwane liczby z dispatchu: atak dyst. Procarza 4, x3, bez kontry
const procarz = cu('Procarz');
const shot = (armor, shooter = procarz) => combat.rangedShotDamage(shooter, shooter.missileAttack, armor, 1);
check('Procarz vs pancerz 0 -> 18', shot(0), 18);
check('Procarz vs pancerz 3 -> 9', shot(3), 9);
check('Procarz vs pancerz 6 -> 6', shot(6), 6);
check('Procarz vs pancerz 8 -> 6', shot(8), 6);

// 3. Procarz (Huaracoc) ma ten sam wzor
const huaracoc = cu('Procarz (Huaracoc)');
check('Huaracoc vs pancerz 6 -> 6', shot(6, huaracoc), 6);

// 4. Lucznik (atak 4, x2) bez zmian: pancerz 0 -> 8, pancerz 6 -> 2
const lucznik = cu('Łucznik');
check('Łucznik vs pancerz 0 -> 8 (bez zmian)', shot(0, lucznik), 8);
check('Łucznik vs pancerz 6 -> 2 (bez zmian)', shot(6, lucznik), 2);

// 5. Oszczepnik (atak 4, x1) bez zmian: pancerz 6 -> 1
const oszczepnik = cu('Oszczepnik');
check('Oszczepnik vs pancerz 6 -> 1 (bez zmian)', shot(6, oszczepnik), 1);

// 6. Mutacja: procarz z przebiciem 0 -> wynik spada (test musi wykrywac brak zmiany)
const procarzBezPrzebicia = { ...procarz, piercing: 0 };
check('MUTACJA procarz piercing 0 vs pancerz 6 -> 1 (min)', shot(6, procarzBezPrzebicia), 1);

// 7. Mutacja: Lucznik z przebiciem 1 w strzale nadal bez przebicia
const lucznikZPrzebiciem = { ...lucznik, piercing: 1 };
check('MUTACJA Łucznik piercing 1 vs pancerz 6 -> 2 (bez przebicia w strzale)', shot(6, lucznikZPrzebiciem), 2);

// 8. Wrecz bez zmian: przebicie wreczne = max(0, weaponDamage - armor) + piercing
check('damageTw wręcz bez zmian (5-2+2=5)', combat.damageTw(5, 2, 2, 0, false), 5);

// 9. Podloga 1 po kontrze
check('Procarz vs pancerz 8 kontra 0.1 -> min 1', combat.rangedShotDamage(procarz, 4, 8, 0.1), 1);

// 10. Scena bitwy (battleScene.ts, galaz ranged) uzywa tej samej funkcji co auto-walka.
// Guard zrodlowy: bez tego cofniecie poprawki w scenie nie czerwienieje zadnego testu.
const sceneSrc = fs.readFileSync(path.join(GRA_DIR, 'src/battle/battleScene.ts'), 'utf8');
check('battleScene ranged wola rangedShotBase(cuA, atkMissile, defArmor)', sceneSrc.includes('rangedShotBase(cuA, atkMissile, defArmor)'), true);
check('battleScene bez starego rangeDamage(atkMissile, defArmor)', sceneSrc.includes('rangeDamage(atkMissile'), false);

if (failed > 0) {
  console.log(`\nFAILED: ${failed}`);
  process.exit(1);
}
console.log('\nALL PASS');
