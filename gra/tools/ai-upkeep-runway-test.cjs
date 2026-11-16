'use strict';
/**
 * ai-upkeep-runway-test.cjs — R-WEB-AI-ARMY-UPKEEP-Q2: testy jednostkowe bramki zapasu
 * (src/game/ai-upkeep-runway.ts). Czysta funkcja, bez silnika gry.
 *
 * Scenariusze z dispatchu (DOPRECYZOWANIE 2026-10-25):
 *   (a) duży zapas + ujemny bilans  -> rekrutacja dozwolona (runway wystarcza)
 *   (b) mały zapas + dodatni bilans -> dozwolona (zapas nie maleje)
 *   (c) mały zapas + ujemny bilans  -> zablokowana
 *   (d) zapas się kończy            -> zablokowana (brak głodu dopóki zapas > 0)
 *
 * Run from gra/:  node tools/ai-upkeep-runway-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.ai-upkeep-runway-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-upkeep-runway-bundle.cjs');

fs.writeFileSync(ENTRY, `export * from '../src/game/ai-upkeep-runway';\n`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts' }, outfile: BUNDLE,
    absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-upkeep-runway-test] bundling failed:', e.message || e);
  process.exit(1);
}
const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const P = { runwayTurns: 15, margin: 0.1 };
const base = {
  goldStock: 1000, goldCost: 50, goldNetPerTurn: 0, unitGoldUpkeep: 2,
  foodStock: 1000, foodNetPerTurn: 0, unitFoodUpkeep: 1,
};
const mk = (o) => Object.assign({}, base, o);

console.log('[runway] upkeepRunwayTurns');
check('net >= 0 -> nieskonczenie', M.upkeepRunwayTurns(100, 0) === Infinity && M.upkeepRunwayTurns(100, 5) === Infinity);
check('stock 0 przy deficycie -> 0', M.upkeepRunwayTurns(0, -3) === 0);
check('100 / -10 = 10 tur', M.upkeepRunwayTurns(100, -10) === 10);
check('NaN traktowane jako 0', M.upkeepRunwayTurns(NaN, -1) === 0);

console.log('[runway] scenariusze (a)-(d)');
check('(a) duzy zapas + ujemny bilans -> dozwolona',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 5000, goldNetPerTurn: -20, foodStock: 5000, foodNetPerTurn: -20 }), P) === true);
check('(b) maly zapas + dodatni bilans -> dozwolona',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 60, goldNetPerTurn: 30, foodStock: 60, foodNetPerTurn: 10 }), P) === true);
check('(c) maly zapas + ujemny bilans -> zablokowana',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 200, goldNetPerTurn: -30, foodStock: 200, foodNetPerTurn: -30 }), P) === false);
check('(d) zapas sie konczy (zloto po zakupie < 0) -> zablokowana',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 40, goldCost: 50, goldNetPerTurn: 100 }), P) === false);
check('(d2) zapas zera przy deficycie -> zablokowana',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 0, goldCost: 0, goldNetPerTurn: -1 }), P) === false);

console.log('[runway] granice i zywnosc');
// zloto: 300 * 0.9 = 270; net po zakupie = -10 - 2 = -12 -> runway 22.5 >= 15 OK
check('zloto runway 22,5 >= 15 -> dozwolona',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 300, goldCost: 0, goldNetPerTurn: -10, unitGoldUpkeep: 2, foodStock: 1e6, foodNetPerTurn: 0 }), P) === true);
// zloto: 200 * 0.9 = 180; net -12 -> runway 15 >= 15 (granica, dozwolona)
check('zloto runway dokladnie 15 -> dozwolona (granica)',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 200, goldCost: 0, goldNetPerTurn: -10, unitGoldUpkeep: 2, foodStock: 1e6, foodNetPerTurn: 0 }), P) === true);
// zloto: 190 * 0.9 = 171; net -12 -> runway 14.25 < 15 -> blokada
check('zloto runway 14,25 < 15 -> zablokowana',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 190, goldCost: 0, goldNetPerTurn: -10, unitGoldUpkeep: 2, foodStock: 1e6, foodNetPerTurn: 0 }), P) === false);
// zywnosc: duzy zloto, zywnosc za mala przy deficycie
check('zywnosc runway za maly -> zablokowana mimo zlota',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 1e6, foodStock: 100, foodNetPerTurn: -10, unitFoodUpkeep: 1 }), P) === false);
check('zywnosc dodatnia netto przy malym spichlerzu -> dozwolona',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 1e6, foodStock: 1, foodNetPerTurn: 5, unitFoodUpkeep: 1 }), P) === true);
// koszt nowej jednostki w utrzymaniu zmienia bilans (ten sam stan, inna jednostka)
check('utrzymanie nowej jednostki liczy sie do runway',
  M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 200, goldCost: 0, goldNetPerTurn: -10, unitGoldUpkeep: 0, foodStock: 1e6 }), P) === true
  && M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 200, goldCost: 0, goldNetPerTurn: -10, unitGoldUpkeep: 10, foodStock: 1e6 }), P) === false);
// margines 0,5: zapas 200 -> 100 efektywnie; net -2 -> runway 50
check('margines 0,5 zmniejsza zapas', M.aiUpkeepRunwayAllowsRecruit(
  mk({ goldStock: 200, goldCost: 0, goldNetPerTurn: 0, unitGoldUpkeep: 2, foodStock: 1e6 }), { runwayTurns: 15, margin: 0.5 }) === true
  && M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 200, goldCost: 0, goldNetPerTurn: -10, unitGoldUpkeep: 2, foodStock: 1e6 }), { runwayTurns: 15, margin: 0.5 }) === false);
// determinizm: ta sama wejsciowa -> ten sam wynik
const det1 = M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 500, goldNetPerTurn: -7 }), P);
const det2 = M.aiUpkeepRunwayAllowsRecruit(mk({ goldStock: 500, goldNetPerTurn: -7 }), P);
check('determinizm (ten sam input -> ten sam wynik)', det1 === det2);

console.log('');
console.log(`RESULT ai-upkeep-runway-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) { /* sprzatanie best-effort */ }
process.exit(fail === 0 ? 0 : 1);
