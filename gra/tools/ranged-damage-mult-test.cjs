/**
 * ranged-damage-mult-test.cjs -- R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1
 *
 * Usage (from gra/):  node tools/ranged-damage-mult-test.cjs
 *
 * Sprawdza: mnoznik obrazen pocisku (procarz x3, piesi lucznik x2, reszta bez zmian),
 * celnosc pocisku = max(wrecz, dystansowy), spojnosc z units.json i mocą (unit-power).
 * Bundluje src/game/combat.ts i src/game/unit-power.ts esbuildem (jak combat-test.cjs).
 * Kod stoi w gra/src/game/unit-power.ts (rangedDamageMultFor) -- jedna implementacja.
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
const OUT_DIR = path.join(os.tmpdir(), `ranged-mult-${RUN_ID}-${TMPDIR_RUN_ID}`);
fs.mkdirSync(OUT_DIR, { recursive: true });
process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function bundle(entry, name) {
  const out = path.join(OUT_DIR, `${name}.cjs`);
  execSync(`"${ESBUILD_BIN}" "${path.join(GRA_DIR, entry)}" --bundle --platform=node --format=cjs --outfile="${out}"`, { stdio: 'inherit' });
  return require(out);
}

const combat = bundle('src/game/combat.ts', 'combat');
const power = bundle('src/game/unit-power.ts', 'unit-power');
const units = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/units.json'), 'utf8'));
const mult = require(path.join(GRA_DIR, 'data/combat-params.json')).ranged_damage_mult;

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

// 1. Parametry
check('ranged_damage_mult.slinger', mult.slinger, 3);
check('ranged_damage_mult.lucznik_piesi', mult.lucznik_piesi, 2);

// 2. Klasyfikacja
const { rangedDamageMultFor } = power;
check('Procarz (Slinger)', rangedDamageMultFor({ Typ: 'Slinger', Jednostka: 'Procarz' }), 3);
check('Procarz (Huaracoc)', rangedDamageMultFor({ Typ: 'Slinger', Jednostka: 'Procarz (Huaracoc)' }), 3);
check('Łucznik (Distance)', rangedDamageMultFor({ Typ: 'Distance', Jednostka: 'Łucznik' }), 2);
check('Łucznik egipski', rangedDamageMultFor({ Typ: 'Distance', Jednostka: 'Łucznik egipski' }), 2);
check('Łucznik nubijski', rangedDamageMultFor({ Typ: 'Distance', Jednostka: 'Łucznik nubijski' }), 2);
check('Łucznik asyryjski', rangedDamageMultFor({ Typ: 'Distance', Jednostka: 'Łucznik asyryjski' }), 2);
check('Oszczepnik (bez zmian)', rangedDamageMultFor({ Typ: 'Distance', Jednostka: 'Oszczepnik' }), 1);
check('Oszczepnik Zulu (bez zmian)', rangedDamageMultFor({ Typ: 'Distance', Jednostka: 'Oszczepnik Zulu (Izijula)' }), 1);
check('Konnica łucznicza asyryjska (Mount, bez zmian)', rangedDamageMultFor({ Typ: 'Mount', Jednostka: 'Konnica łucznicza asyryjska' }), 1);
check('Rydwan egipski (Mount, bez zmian)', rangedDamageMultFor({ Typ: 'Mount', Jednostka: 'Rydwan egipski' }), 1);
check('Katapulta (bez zmian)', rangedDamageMultFor({ Typ: 'Siege', Jednostka: 'Katapulta' }), 1);

// 3. Obrazenia pocisku (auto-walka, combat.ts) wzgledem Falangi
const falanga = cu('Falanga');
const procarz = cu('Procarz');
const lucznik = cu('Łucznik');
const oszczepnik = cu('Oszczepnik');
const konnica = cu('Konnica łucznicza asyryjska');
const dmgProcarz = combat.rangedShotDamage(procarz, procarz.missileAttack, falanga.armor, 1);
const dmgLucznik = combat.rangedShotDamage(lucznik, lucznik.missileAttack, falanga.armor, 1);
const dmgOszcz = combat.rangedShotDamage(oszczepnik, oszczepnik.missileAttack, falanga.armor, 1);
const baseProcarz = combat.rangeDamageTw(procarz.missileAttack, falanga.armor);
const baseLucznik = combat.rangeDamageTw(lucznik.missileAttack, falanga.armor);
console.log(`info: Falanga armor=${falanga.armor}; Procarz missile=${procarz.missileAttack} base=${baseProcarz}; Łucznik missile=${lucznik.missileAttack} base=${baseLucznik}`);
// PROCARZ-PIERCING: strzal procarza = max(0, atak - pancerz) + przebicie 2, x3 (wzor wreczny).
check('Procarz vs Falanga dmg (wzor wreczny x3)', dmgProcarz, Math.max(1, Math.round((Math.max(0, procarz.missileAttack - falanga.armor) + procarz.piercing) * 3)));
check('Łucznik vs Falanga dmg (base x2)', dmgLucznik, Math.max(1, Math.round(baseLucznik * 2)));
check('Oszczepnik vs Falanga dmg (bez zmian)', dmgOszcz, Math.max(1, Math.round(combat.rangeDamageTw(oszczepnik.missileAttack, falanga.armor))));
// Kontra mnozona przed zaokragleniem, podloga 1
check('dmg floor 1 (oszczepnik, shot 1 vs armor 9)', combat.rangedShotDamage(oszczepnik, 1, 9, 1), 1);
check('dmg (procarz x3 wzor wreczny, shot 1 vs armor 9 -> (0+2)*3 = 6)', combat.rangedShotDamage(procarz, 1, 9, 1), 6);
check('kontra x1.5 + procarz x3 (missile 4, armor 0 -> (4+2)*3*1.5 = 27)', combat.rangedShotDamage(procarz, 4, 0, 1.5), 27);

// 4. Celnosc = max(wrecz, dystansowy)
check('rangedShotAccuracy(wrecz 1, dyst 4)', combat.rangedShotAccuracy(1, 4), 4);
check('rangedShotAccuracy(wrecz 6, dyst 2)', combat.rangedShotAccuracy(6, 2), 6);
const hitMissileBased = combat.hitChanceTw(combat.rangedShotAccuracy(procarz.meleeAttack, procarz.missileAttack), falanga.meleeDefence);
const hitMeleeOnly = combat.hitChanceTw(procarz.meleeAttack, falanga.meleeDefence);
console.log(`info: celnosc Procarz vs Falanga: z max=${hitMissileBased}% vs samo wrecz=${hitMeleeOnly}%`);
check('celnosc Procarz wyzsza niz samo wrecz', hitMissileBased > hitMeleeOnly ? 'tak' : 'nie', 'tak');

// 5. Moc AI (unit-power): missile term x mnoznik
const pRow = row('Procarz');
const basePow = power.fieldPower({ ...pRow });
const expectedAttackDelta = (pRow.missileAttack * (mult.slinger - 1)) / 2; // missileDivisor = 2
const noMult = power.fieldPower({ ...pRow, Typ: 'Standard', Jednostka: 'X' });
check('moc Procarza rosnie o missile*(3-1)/2', Math.round((basePow.attack - noMult.attack) * 10) / 10, Math.round(expectedAttackDelta * 10) / 10);
const kRow = row('Konnica łucznicza asyryjska');
check('moc konnicy łuczniczej bez zmian', power.fieldPower({ ...kRow }).total, power.fieldPower({ ...kRow, Typ: 'Standard', Jednostka: 'X' }).total);

// 6. Moc AI/auto-walki = armyFieldPower() na SUROWYM wierszu units.json (z cache fieldPower).
// Cache eksportu liczony bez mnoznika -> armyFieldPower musi go ignorowac dla Procarza/Lucznika.
const armyRaw = (name) => power.armyFieldPower({ ...row(name) });
// PROCARZ-PIERCING: fieldPower zawiera piercing (num(u.piercing)) -> 12 + 2 = 14 na zywo.
check('armyFieldPower Procarz (health 8, cache 12 + piercing 2) = 14', armyRaw('Procarz'), 14);
check('armyFieldPower Procarz (Huaracoc) (health 8, cache 12 + piercing 2) = 14', armyRaw('Procarz (Huaracoc)'), 14);
// R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1: zdrowie lucznikow = 20 (pole health) => nowa moc pola.
// R-WEB-DATA-ARCHERS-RANGED-ATTACK-4-5-6-ALIGN-Q1: missileAttack Łucznik 4 / egipski 5 => moc pola 22 / 19 (runtime).
check('armyFieldPower Łucznik (health 10, missileAttack 4) = 17', armyRaw('Łucznik'), 17);
check('armyFieldPower Łucznik egipski (health 10, missileAttack 5) = 14', armyRaw('Łucznik egipski'), 14);
// Oszczepnik (health 8) i oszczepnicy Zulu/Estólica: cache musi odpowiadać fieldPower() z nowych statów.
check('armyFieldPower Oszczepnik (health 8, cache 8) = 8', armyRaw('Oszczepnik'), 8);
check('armyFieldPower Oszczepnik Zulu (health 10, missile 5, cache 11.5) = 11.5', armyRaw('Oszczepnik Zulu (Izijula)'), 11.5);
check('armyFieldPower Oszczepnik (Estólica) (health 10, missile 5, cache 9.5) = 9.5', armyRaw('Oszczepnik (Estólica)'), 9.5);
check('cache Oszczepnik == fieldPower().total', row('Oszczepnik').fieldPower, power.fieldPower({ ...row('Oszczepnik') }).total);
check('cache Oszczepnik Zulu == fieldPower().total', row('Oszczepnik Zulu (Izijula)').fieldPower, power.fieldPower({ ...row('Oszczepnik Zulu (Izijula)') }).total);
check('cache Oszczepnik (Estólica) == fieldPower().total', row('Oszczepnik (Estólica)').fieldPower, power.fieldPower({ ...row('Oszczepnik (Estólica)') }).total);
check('armyFieldPower Konnica łucznicza (cache) bez zmian', armyRaw('Konnica łucznicza asyryjska'), row('Konnica łucznicza asyryjska').fieldPower);
check('armyFieldPower Procarz == fieldPower().total', armyRaw('Procarz'), power.fieldPower({ ...row('Procarz') }).total);

console.log(failed === 0 ? '\nRANGED-DAMAGE-MULT: WSZYSTKIE PASS' : `\nRANGED-DAMAGE-MULT: ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
