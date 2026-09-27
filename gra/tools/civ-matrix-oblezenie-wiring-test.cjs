'use strict';
/**
 * civ-matrix-oblezenie-wiring-test.cjs — dowod realnego wplywu civ-matrix.json
 * (dzial Oblezenie: obl_obrona_miasta_proc, obl_mur_proc, obl_machines_proc)
 * na gameplay w game/city-defense.ts i game/siegeMachines.ts.
 *
 * Run: node tools/civ-matrix-oblezenie-wiring-test.cjs  (from gra/)
 *
 * Temat: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const graRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(graRoot, 'src');
const tempRoot = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'civ-matrix-oblezenie-'));
const entry = path.join(tempRoot, 'entry.ts');
const bundle = path.join(tempRoot, 'bundle.cjs');

fs.writeFileSync(entry, `
  export {
    cityWallDefenseBonusPercent,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/city-defense'))};
  export {
    civSiegeMachinesMult,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/siegeMachines'))};
  export {
    civMatrixParam,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/civ-matrix'))};
  export {
    decideAISiegeStance,
    estimateDefenderStrength,
    estimateUnitCombatStrength,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/siegeAi'))};
  export {
    applyCityBonus,
    cityDefenseBonus,
  } from ${JSON.stringify(path.join(sourceRoot, 'game/siege'))};
`);

let M;
try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: graRoot,
    logLevel: 'silent',
  });
  M = require(bundle);
} catch (error) {
  console.error('esbuild failed:', error.message || error);
  fs.rmSync(tempRoot, { recursive: true, force: true });
  process.exit(1);
}

const matrix = JSON.parse(fs.readFileSync(path.join(graRoot, 'data/civ-matrix.json'), 'utf8'));

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass += 1; return; }
  fail += 1;
  console.error('FAIL:', msg);
}
function near(actual, expected, msg) {
  ok(Math.abs(actual - expected) < 1e-9, `${msg} (got ${actual}, want ${expected})`);
}

// --- sanity: matrix values match INPUT-converted-values.json (source of truth) ---
const inputPath = path.join(
  graRoot, '..', 'dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922/INPUT-converted-values.json',
);
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log('--- 45 cells match INPUT-converted-values.json ---');
let cellsChecked = 0;
for (const civ of matrix.cywilizacje) {
  for (const p of ['obl_obrona_miasta_proc', 'obl_mur_proc', 'obl_machines_proc']) {
    const expected = input.values[p][civ.Cywilizacja];
    cellsChecked += 1;
    near(civ.params[p], expected, `civ-matrix.json ${civ.Cywilizacja}.${p}`);
  }
}
ok(cellsChecked === 45, `checked exactly 45 cells (got ${cellsChecked})`);

// Standard mur/cytadela/baszta/palisada params (miasto-params.json defaults).
const CD_PARAMS = { mur: 200, cytadela: 100, baszta: 100, palisada: 100 };

console.log('\n--- obl_mur_proc: Grecy(+0.2) vs Zulusi(-0.2) — mur bonus, real difference ---');
{
  const grecyMurProc = M.civMatrixParam('grecy', 'obl_mur_proc');
  const zulusiMurProc = M.civMatrixParam('zulusi', 'obl_mur_proc');
  near(grecyMurProc, 0.2, 'Grecy obl_mur_proc = +0.2');
  near(zulusiMurProc, -0.2, 'Zulusi obl_mur_proc = -0.2');

  const grecyWall = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, grecyMurProc, 0);
  const zulusiWall = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, zulusiMurProc, 0);
  const neutralWall = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, 0, 0);
  near(neutralWall, 200, 'Bazowy mur bez civ-matrix (mnoznik neutralny) = 200%');
  near(grecyWall, 240, 'Grecy mur (structural 200% * 1.2) = 240%');
  near(zulusiWall, 160, 'Zulusi mur (structural 200% * 0.8) = 160%');
  ok(grecyWall !== zulusiWall, 'Grecy i Zulusi daja REALNIE rozny wynik bonusu muru');
  ok(grecyWall > neutralWall && zulusiWall < neutralWall,
    'Grecy > neutralny > Zulusi (kierunek zgodny ze znakiem parametru)');
}

console.log('\n--- obl_mur_proc: Mury+Cytadela+Baszta (pelny stack) skladaja sie multiplikatywnie ---');
{
  const grecyMurProc = M.civMatrixParam('grecy', 'obl_mur_proc');
  const full = M.cityWallDefenseBonusPercent(['mury', 'fort', 'baszta'], CD_PARAMS, grecyMurProc, 0);
  // structural = 200 (mur) + 100 (cytadela) + 100 (baszta) = 400; * 1.2 = 480
  near(full, 480, 'Grecy Mury+Cytadela+Baszta = 400% * 1.2 = 480%');
}

console.log('\n--- obl_obrona_miasta_proc: Grecy(+0.2) vs Rzymianie(0.0) — osobny mnoznik ogolnej obrony ---');
{
  const grecyObronaProc = M.civMatrixParam('grecy', 'obl_obrona_miasta_proc');
  const rzymObronaProc = M.civMatrixParam('rzymianie', 'obl_obrona_miasta_proc');
  near(grecyObronaProc, 0.2, 'Grecy obl_obrona_miasta_proc = +0.2');
  near(rzymObronaProc, 0.0, 'Rzymianie obl_obrona_miasta_proc = 0.0 (neutralny)');

  const grecyWall = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, 0, grecyObronaProc);
  const rzymWall = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, 0, rzymObronaProc);
  near(grecyWall, 240, 'Grecy obrona_miasta (structural 200% * 1.2) = 240%');
  near(rzymWall, 200, 'Rzymianie obrona_miasta (structural 200% * 1.0, neutralny) = 200%');
  ok(grecyWall !== rzymWall, 'Grecy i Rzymianie daja REALNIE rozny wynik z obl_obrona_miasta_proc');
}

console.log('\n--- obl_obrona_miasta_proc i obl_mur_proc SKLADAJA SIE (mnoza), nie zastepuja siebie ---');
{
  // Fenicjanie: obl_mur_proc=+0.2, obl_obrona_miasta_proc=+0.2 (oba niezerowe)
  const murProc = M.civMatrixParam('fenicjanie', 'obl_mur_proc');
  const obronaProc = M.civMatrixParam('fenicjanie', 'obl_obrona_miasta_proc');
  near(murProc, 0.2, 'Fenicjanie obl_mur_proc = +0.2');
  near(obronaProc, 0.2, 'Fenicjanie obl_obrona_miasta_proc = +0.2');
  const combined = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, murProc, obronaProc);
  // 200 * 1.2 * 1.2 = 288
  near(combined, 288, 'Fenicjanie combined mnoznik (1.2 * 1.2) na structural 200% = 288%');
}

console.log('\n--- Kontrola negatywna: nieznana cywilizacja -> civMatrixParam=0 -> mnoznik neutralny 1.0 ---');
{
  const unknownMur = M.civMatrixParam('atlantydzi-nieistniejacy', 'obl_mur_proc');
  const unknownObrona = M.civMatrixParam('atlantydzi-nieistniejacy', 'obl_obrona_miasta_proc');
  near(unknownMur, 0, 'Nieznana cywilizacja: obl_mur_proc = 0 (default)');
  near(unknownObrona, 0, 'Nieznana cywilizacja: obl_obrona_miasta_proc = 0 (default)');
  const unknownWall = M.cityWallDefenseBonusPercent(['mury'], CD_PARAMS, unknownMur, unknownObrona);
  near(unknownWall, 200, 'Nieznana cywilizacja: bonus muru = structural 200% bez zmian (mnoznik 1.0x)');
}

console.log('\n--- Miasto BEZ zadnego budynku obronnego: civ-matrix nie tworzy bonusu z niczego ---');
{
  const grecyMurProc = M.civMatrixParam('grecy', 'obl_mur_proc');
  const grecyObronaProc = M.civMatrixParam('grecy', 'obl_obrona_miasta_proc');
  const noWallsBonus = M.cityWallDefenseBonusPercent([], CD_PARAMS, grecyMurProc, grecyObronaProc);
  near(noWallsBonus, 0, 'Miasto bez Mury/Cytadela/Baszta/Palisada: 0% niezaleznie od civ-matrix (0 * mnoznik = 0)');
}

console.log('\n--- Wsteczna zgodnosc: wywolanie 2-argumentowe (bez civKey) = stare zachowanie ---');
{
  const legacy = M.cityWallDefenseBonusPercent(['mury', 'fort'], CD_PARAMS);
  near(legacy, 300, 'cityWallDefenseBonusPercent(builtIds, params) bez civ-args = stare zachowanie (300%)');
}

console.log('\n--- obl_machines_proc: Grecy(+0.2) vs Zulusi(-0.2) — realna roznica w efektywnym wallAttack ---');
{
  const grecyMachinesMult = M.civSiegeMachinesMult('grecy');
  const zulusiMachinesMult = M.civSiegeMachinesMult('zulusi');
  near(grecyMachinesMult, 1.2, 'Grecy civSiegeMachinesMult = 1.2 (obl_machines_proc +0.2)');
  near(zulusiMachinesMult, 0.8, 'Zulusi civSiegeMachinesMult = 0.8 (obl_machines_proc -0.2)');

  // Taran units.json wallAttack=14 (patrz data/units.json) — symulacja
  // dokladnie tej samej arytmetyki co battleScene.ts _siegeStructureDamage/_attackWallTile.
  const baseWallAttack = 14;
  const grecyDmg = Math.max(1, Math.round(baseWallAttack * grecyMachinesMult));
  const zulusiDmg = Math.max(1, Math.round(baseWallAttack * zulusiMachinesMult));
  ok(grecyDmg !== zulusiDmg, 'Grecy i Zulusi Taran daja REALNIE rozne obrazenia na mur/brame');
  ok(grecyDmg > zulusiDmg, 'Grecy (+20%) zadaje wiecej obrazen niz Zulusi (-20%) machinami oblezniczymi');
  near(grecyDmg, Math.round(14 * 1.2), 'Grecy Taran dmg = round(14 * 1.2) = 17');
  near(zulusiDmg, Math.round(14 * 0.8), 'Zulusi Taran dmg = round(14 * 0.8) = 11');
}

console.log('\n--- Kontrola negatywna: nieznana/brak cywilizacja -> obl_machines_proc mnoznik neutralny 1.0 ---');
{
  const unknownMult = M.civSiegeMachinesMult('atlantydzi-nieistniejacy');
  const undefinedMult = M.civSiegeMachinesMult(undefined);
  near(unknownMult, 1.0, 'Nieznana cywilizacja: civSiegeMachinesMult = 1.0 (neutralny)');
  near(undefinedMult, 1.0, 'Brak civKey (undefined): civSiegeMachinesMult = 1.0 (neutralny, wsteczna zgodnosc)');
}

console.log('\n--- AI siege consumer: defender civ-matrix changes strength and stance inputs ---');
{
  const unit = {
    typNazwa: 'Wojownik', rola: 'Wrecz', Atak: 4, Obrona: 4, Uderzenie: 2,
    Pancerz: 2, Przebicie: 1, weaponDamage: 4, Health: 30,
  };
  const army = [{
    ...unit, Atak: 10, Obrona: 10, Pancerz: 4, weaponDamage: 10,
  }];
  const makeCity = (civKey) => ({
    id: 'ai-city', ownerId: 7, q: 1, r: 1, wallLevel: 1,
    hasWalls: true, builtBuildingIds: ['mury'], civKey, garrison: [{ ...unit }],
  });
  const neutral = makeCity('egipt');
  const grecy = makeCity('grecy');
  const zulusi = makeCity('zulusi');
  const unknown = makeCity(null);
  const neutralStrength = M.estimateDefenderStrength(neutral);
  const grecyStrength = M.estimateDefenderStrength(grecy);
  const zulusiStrength = M.estimateDefenderStrength(zulusi);
  const unknownStrength = M.estimateDefenderStrength(unknown);
  ok(grecyStrength > neutralStrength && neutralStrength > zulusiStrength,
    'AI defender strength direction: Grecy > neutral > Zulusi');
  ok(new Set([grecyStrength, neutralStrength, zulusiStrength]).size === 3,
    'AI defender strength is distinct for positive, neutral, and negative civ profiles');
  near(unknownStrength, neutralStrength,
    'missing/unknown defender civ is exactly matrix-neutral, not a Greece fallback');

  const neutralBonus = M.cityDefenseBonus(neutral);
  const grecyBonus = M.cityDefenseBonus(grecy);
  const zulusiBonus = M.cityDefenseBonus(zulusi);
  near(neutralBonus.breakdown.structurePct, 200,
    'AI neutral walled city uses the shared +200% structure baseline');
  near(grecyBonus.breakdown.structurePct, 288,
    'AI Grecy structure = 200% * 1.2 * 1.2 = 288%');
  near(zulusiBonus.breakdown.structurePct, 160,
    'AI Zulusi structure = 200% * 0.8 * 1.0 = 160%');
  const once = M.estimateUnitCombatStrength(M.applyCityBonus(unit, grecyBonus, true));
  near(grecyStrength, once, 'AI defender formula applies city civ multiplier exactly once');

  const stanceParams = { t1AssaultRatio: 1.5, t2BuildMinRatio: 0.1, t3StarveMinRatio: 0.01 };
  const neutralDecision = M.decideAISiegeStance(
    army, neutral, { siegeTurn: 0, machinesReady: 0 }, stanceParams,
  );
  const grecyDecision = M.decideAISiegeStance(
    army, grecy, { siegeTurn: 0, machinesReady: 0 }, stanceParams,
  );
  ok(neutralDecision.ratio !== grecyDecision.ratio,
    'AI stance input ratio changes with defending civ-matrix values');
}

console.log(`\n=== civ-matrix-oblezenie-wiring-test: ${pass} pass, ${fail} fail ===`);
fs.rmSync(tempRoot, { recursive: true, force: true });
process.exit(fail > 0 ? 1 : 0);
