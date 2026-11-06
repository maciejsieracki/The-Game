'use strict';
/**
 * H-BUDYNKI-KOSZT-PRACY-50-Q1 — pełna regresja kosztu Pracy budynków.
 * Run from gra/: node tools/budynki-koszt-pracy-50-test.cjs
 * Optional BUILDING_COST_SRC_DIR points at a source-copy used by the mutation proof.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.BUILDING_COST_SRC_DIR || path.join(GRA, 'src');
const ENTRY = path.resolve(__dirname, '.budynki-koszt-pracy-50-entry.ts');
const BUNDLE = path.resolve(__dirname, '.budynki-koszt-pracy-50-bundle.cjs');
fs.writeFileSync(ENTRY, `export { itemCost, buildingWorkCost } from ${JSON.stringify(path.join(SRC, 'game/production'))};\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const data = { buildings, units: [] };

let pass = 0, fail = 0;
function ok(condition, message) {
  if (condition) pass++;
  else { fail++; console.error('FAIL:', message); }
}
function expectedRawCost(b, level) {
  return Math.round(b.kosztBudowy + b.przyrostKosztu * (level - 1));
}

// Pełne pokrycie: każdy rekord i każdy poziom, bez ręcznej listy budynków.
let checkedLevels = 0;
for (const b of buildings) {
  ok(Number.isInteger(b.maksPoziom) && b.maksPoziom >= 1, `${b.id}: poprawny maksPoziom`);
  for (let level = 1; level <= b.maksPoziom; level++) {
    checkedLevels++;
    const raw = M.itemCost('budynek', b.id, data, level);
    const actual = M.buildingWorkCost(raw);
    ok(raw === expectedRawCost(b, level), `${b.id} poziom ${level}: itemCost z kosztBudowy/przyrostKosztu`);
    // Aktualny origin/main daje efektywnie 2× JSON (0.5×2×2). Cel to połowa tego,
    // czyli dokładnie wartość bazowa JSON, bez modyfikatorów kontekstu.
    ok(actual === raw, `${b.id} poziom ${level}: koszt Pracy po zmianie = 50% stanu origin (${actual} === ${raw})`);
  }
}
ok(checkedLevels > buildings.length, `pokryto wszystkie poziomy (${checkedLevels} poziomów, ${buildings.length} budynków)`);
// R-WEB-BUILDING-EMPORION-Q1 (2026-11-06): 42 -> 43 (+ Emporion, decyzja właściciela 2026-11-05).
ok(buildings.length === 43, `pełny katalog budynków ma 43 rekordy (ma ${buildings.length})`);

// Niezależny, zamrożony fingerprint kosztów surowcowych — nie wolno go wyliczać
// z oczekiwanego wyniku tej samej mutacji ani go przepisywać po zmianie mnożnika.
// R-WEB-BUILDING-EMPORION-Q1: fingerprint przepisany WYŁĄCZNIE z powodu dodania
// nowego rekordu Emporion (koszt_surowce {drewno 80, kamien 60}); pozostałe 42
// rekordy bez zmian. Poprzednia wartość: 586ef458...08554.
const RESOURCE_BASELINE_SHA256 = '033cb1b7e662b6204cd23f15321e8b9e426951033c854d57453c0f456178e5a4';
const resourceCanonical = buildings.map(b => `${b.id}\t${JSON.stringify(b.koszt_surowce ?? null)}`).join('\n');
const resourceSha = crypto.createHash('sha256').update(resourceCanonical).digest('hex');
ok(resourceSha === RESOURCE_BASELINE_SHA256, `koszt_surowce wszystkich budynków bez zmian (sha256 ${resourceSha})`);

console.log(`budynki-koszt-pracy-50-test: ${pass} pass, ${fail} fail; ${buildings.length} budynków / ${checkedLevels} poziomów`);
process.exit(fail ? 1 : 0);
