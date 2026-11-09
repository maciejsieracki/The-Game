/**
 * falanga-bonus-vs-spearman-test.cjs
 * R-WEB-DATA-FALANGA-BONUS-VS-SPEARMAN-30-Q1 (DODATEK 1 + DODATEK 2)
 *
 * Usage (from gra/):  node tools/falanga-bonus-vs-spearman-test.cjs
 *
 * Checks:
 *   1. units.json Falanga: Atak 7, Obrona 12, Przebicie 4, Bonus vs Spearman % 30,
 *      meleeAttack 7, meleeDefence 12, piercing 4, fieldPower 58.5 (recalculated).
 *   2. fieldPower formula (unit-power.ts fieldPower): attack = meleeAttack + weaponDamage
 *      + piercing + chargeBonus/2; defense = meleeDefence + armor + health/2; total = sum.
 *   3. counters.json holds the engine's counter row Falangite -> Spearman "+30%" (Atak),
 *      confirmed. combat.ts counterMultiplier reads ONLY counters.json (units.json
 *      "Bonus vs ... %" columns are no longer read by the engine), so this row IS the
 *      Falanga-vs-Spearman damage bonus. Matching mirrors counterMultiplier (substring,
 *      case-insensitive).
 *   4. Other types are unaffected: Falangite vs Swordsman/Falangite/Mount-only rules
 *      unchanged; Spearman as attacker vs Falangite not boosted by the new row.
 */

'use strict';

const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
const units = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/units.json'), 'utf8'));
const counters = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/counters.json'), 'utf8'));

let failed = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log('PASS  ' + name);
  } else {
    failed++;
    console.log('FAIL  ' + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : ''));
  }
}

const falanga = units.find((u) => u['Jednostka'] === 'Falanga');
check('Falanga present in units.json', !!falanga);

check('Atak = 7', falanga['Atak'] === 7, falanga['Atak']);
check('Obrona = 12', falanga['Obrona'] === 12, falanga['Obrona']);
check('Przebicie = 4', falanga['Przebicie'] === 4, falanga['Przebicie']);
check('Bonus vs Spearman % = 30', falanga['Bonus vs Spearman %'] === 30, falanga['Bonus vs Spearman %']);
check('meleeAttack = 7', falanga['meleeAttack'] === 7, falanga['meleeAttack']);
check('meleeDefence = 12', falanga['meleeDefence'] === 12, falanga['meleeDefence']);
check('piercing = 4', falanga['piercing'] === 4, falanga['piercing']);
check('Pozostale Bonus vs (Swordsman/Falangite/Offensive/Distance/Mount/Slinger) bez zmian',
  falanga['Bonus vs Swordsman %'] === 0 && falanga['Bonus vs Falangite %'] === 0 &&
  falanga['Bonus vs Offensive %'] === 0 && falanga['Bonus vs Distance %'] === 0 &&
  falanga['Bonus vs Mount %'] === 50 && falanga['Bonus vs Slinger %'] === 0);

// fieldPower = attack + defense, same coefficients as unit-power.ts defaults (charge /2, hp /2)
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const attack = num(falanga.meleeAttack) + num(falanga.weaponDamage) + num(falanga.piercing) + num(falanga.chargeBonus) / 2;
const defense = num(falanga.meleeDefence) + num(falanga.armor) + num(falanga.health) / 2;
const fp = Math.round((attack + defense) * 10) / 10;
check('fieldPower zgodny z formula (attack=' + attack + ', defense=' + defense + ')', fp === falanga.fieldPower, { expected: fp, stored: falanga.fieldPower });
check('fieldPower = 58.5', falanga.fieldPower === 58.5, falanga.fieldPower);

// counterMultiplier mirror (combat.ts): first confirmed Atak row whose attacker and target match
function parseBonus(s) {
  const m = /([+\-−])\s*(\d+(?:\.\d+)?)\s*%/.exec(String(s));
  if (!m) return null;
  const sign = m[1] === '+' ? 1 : -1;
  return (sign * parseFloat(m[2])) / 100;
}
function counterMult(attackerType, defenderType) {
  const aLow = attackerType.toLowerCase();
  const dLow = defenderType.toLowerCase();
  for (const c of counters) {
    if (c['Status'] !== 'potwierdzone') continue;
    if (c['Rodzaj (Atak/Obrona)'] !== 'Atak') continue;
    const cAtk = c['Typ atakujący'].toLowerCase();
    const cCel = c['Cel (typ)'].toLowerCase();
    const atkMatch = aLow.includes(cAtk) || cAtk.includes(aLow);
    const defMatch = cCel.split('/').map((s) => s.trim()).some((alt) => dLow.includes(alt) || alt.includes(dLow));
    if (atkMatch && defMatch) {
      const frac = parseBonus(c['Bonus']);
      return frac !== null ? 1 + frac : 1.5;
    }
  }
  return 1.0;
}

check('Falangite vs Spearman = x1.30', counterMult('Falangite', 'Spearman') === 1.3, counterMult('Falangite', 'Spearman'));
check('Falangite vs Mount = x1.50 (bez zmian)', counterMult('Falangite', 'Mount') === 1.5, counterMult('Falangite', 'Mount'));
check('Falangite vs Swordsman = x1.00 (bez zmian)', counterMult('Falangite', 'Swordsman') === 1.0, counterMult('Falangite', 'Swordsman'));
check('Spearman vs Falangite nie wzmocniony nowym wierszem', counterMult('Spearman', 'Falangite') === 1.0, counterMult('Spearman', 'Falangite'));
check('Inny typ atakujacy vs Spearman bez zmian (Swordsman +15%)', counterMult('Swordsman', 'Spearman') === 1.15, counterMult('Swordsman', 'Spearman'));

console.log('');
if (failed === 0) {
  console.log('FALANGA-BONUS-VS-SPEARMAN: ALL PASS');
  process.exit(0);
} else {
  console.log('FALANGA-BONUS-VS-SPEARMAN: ' + failed + ' FAIL');
  process.exit(1);
}
