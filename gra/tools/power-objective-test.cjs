'use strict';
/** power-objective-test.cjs — obiektywny POWER kanon P-A (Maciej 2026-06-26). */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ENTRY = path.join(__dirname, '.power-objective-entry.ts');
const BUNDLE = path.join(__dirname, '.power-objective-bundle.cjs');

fs.writeFileSync(ENTRY, `
import { computeObjectivePower, loadPowerCoefficients, epokaPowerMultiplier, loadBattlePowerModel, battlePowerPointsFromDefeatedEnemy, loadMilitaryComponentKeys } from '../src/game/power-objective';
module.exports = { computeObjectivePower, loadPowerCoefficients, epokaPowerMultiplier, loadBattlePowerModel, battlePowerPointsFromDefeatedEnemy, loadMilitaryComponentKeys };
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const P = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

const c = P.loadPowerCoefficients();
// P-MOC-BALANS-WAGI (Maciej 2026-08-12): jednostka 25→2.5 (÷10), rekrut 5→10 (×2),
// heks 0.5→1.0 (×2), tech 20→80 (×4). ludek bez zmian.
ok(c.jednostkaWojskowa === 2.5, 'coeff jednostka 2.5 (P-MOC-BALANS-WAGI: 25÷10)');
ok(c.ludek === 5, 'coeff ludek 5 (bez zmian)');
ok(c.rekrutEkwJednostki === 10, 'coeff rekrut 10 (P-MOC-BALANS-WAGI: 5×2)');
ok(c.heksTerytorium === 1.0, 'coeff heks 1.0 (P-MOC-BALANS-WAGI: 0.5×2)');
ok(c.techZbadane === 80, 'coeff tech 80 (P-MOC-BALANS-WAGI: 20×4)');
ok(P.epokaPowerMultiplier(3) === 1, 'mnoznik epoki zawsze 1 (P-B odrzucone)');

ok(P.loadBattlePowerModel() === 'enemy_m_sum', 'P-C2-DEF A model enemy_m');
ok(P.battlePowerPointsFromDefeatedEnemy(37.4) === 37, 'pkt bitwy = floor(M wroga)');
ok(P.battlePowerPointsFromDefeatedEnemy(-5) === 0, 'pkt bitwy min 0');

// P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): flaga `military` — WYŁĄCZNIE Armia + Rekruci.
const militaryKeys = P.loadMilitaryComponentKeys();
ok(militaryKeys.has('armia') === true, 'military: armia = true (JSON wojskowy)');
ok(militaryKeys.has('rekruci') === true, 'military: rekruci = true (JSON wojskowy)');
ok(militaryKeys.has('miasta') === false, 'military: miasta = false (gospodarcze)');
ok(militaryKeys.has('bitwy') === false, 'military: bitwy = false (gospodarcze, mimo ×2 wagi)');
ok(militaryKeys.has('zdobycze') === false, 'military: zdobycze = false (brak wpisu JSON, gospodarcze)');

/**
 * Scenariusz kalibracyjny — ep.1, 10 miast, ~100 ludków → Power = 4655 (P-MOC-BALANS-WAGI,
 * Maciej 2026-08-12; było 3020 przed zmianą 6 wag — patrz power-params.json::kalibracja).
 */
const kalibracja = {
  ownerId: 0,
  epoka: 1,
  jednostki: 10,
  wygraneBitwy: 0,
  bitwyPktSum: 250,
  sumaLudkow: 100,
  rekrutEkw: 80,
  miasta: 10,
  heksyTerytorium: 500,
  budynki: 60,
  techZbadane: 16,
  ulepszeniaTerenu: 50,
};
const r = P.computeObjectivePower(kalibracja);
ok(r.powerBase === 4655, 'kalibracja P-MOC-BALANS-WAGI powerBase 4655 (było 3020)');
ok(r.power === 4655, 'kalibracja P-MOC-BALANS-WAGI power 4655 (było 3020)');
ok(r.mnoznikEpoki === 1, 'bez mnoznika epoki');

const armiaRow = r.components.find(x => x.key === 'armia');
ok(armiaRow.coefficient === 2.5 && armiaRow.points === 25, 'kalibracja: armia 10×2.5=25 (było 10×25=250)');
ok(armiaRow.military === true, 'kalibracja: armia military=true');
const bitwyRow = r.components.find(x => x.key === 'bitwy');
ok(bitwyRow.coefficient === 2 && bitwyRow.points === 500, 'kalibracja: bitwy 250×2=500 (było 250×1=250)');
ok(bitwyRow.military === false, 'kalibracja: bitwy military=false (gospodarcze)');
const rekruciRow = r.components.find(x => x.key === 'rekruci');
ok(rekruciRow.coefficient === 10 && rekruciRow.points === 800, 'kalibracja: rekruci 80×10=800 (było 80×5=400)');
ok(rekruciRow.military === true, 'kalibracja: rekruci military=true');
const terytoriumRow = r.components.find(x => x.key === 'terytorium');
ok(terytoriumRow.coefficient === 1.0 && terytoriumRow.points === 500, 'kalibracja: terytorium 500×1.0=500 (było 500×0.5=250)');
const techRow = r.components.find(x => x.key === 'tech');
ok(techRow.coefficient === 80 && techRow.points === 1280, 'kalibracja: tech 16×80=1280 (było 16×20=320)');

const solo = P.computeObjectivePower({
  ownerId: 1,
  epoka: 1,
  jednostki: 0,
  wygraneBitwy: 0,
  sumaLudkow: 0,
  rekrutEkw: 0,
  miasta: 0,
  heksyTerytorium: 0,
  budynki: 0,
  techZbadane: 0,
  ulepszeniaTerenu: 0,
});
ok(solo.power === 0, 'empty empire power 0');

const kult = P.computeObjectivePower({
  ...kalibracja,
  kulturaImperium: 200,
  miastaJednoscReligii: 4,
});
ok(kult.components.some(c => c.key === 'kultura' && c.points === 100),
  'KULT-04: kultura 200 × 0.5 = 100');
ok(kult.components.some(c => c.key === 'religia' && c.points === 100),
  'KULT-04: religia 4 miasta × 25 = 100');
ok(kult.power === r.power + 200, 'KULT-04: +200 power vs kalibracja');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`[power-objective-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
