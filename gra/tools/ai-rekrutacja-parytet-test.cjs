'use strict';
/** Niezależny test regresyjny: AI kupuje poza wojną, a miasto budujące budynek
 * nie miesza jednostki do kolejki Pracy. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.ai-rekrutacja-parytet-entry.ts');
const bundle = path.resolve(__dirname, '.ai-rekrutacja-parytet-bundle.cjs');
fs.writeFileSync(entry, `
export { shouldAIPurchaseUnit } from '../src/game/ai';
export { enqueueRecruitment, advanceProduction, advanceRecruitment } from '../src/game/production';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
  const { shouldAIPurchaseUnit, enqueueRecruitment, advanceProduction, advanceRecruitment } = require(bundle);
  let passed = 0, failed = 0;
  const ok = (v, msg) => v ? passed++ : (failed++, console.error('FAIL:', msg));
  ok(shouldAIPurchaseUnit({ treasury: 50, goldCost: 50, hasManpower: true }) === true, 'AI poza wojną przechodzi bramkę zakupu');
  ok(shouldAIPurchaseUnit({ treasury: 49, goldCost: 50, hasManpower: true }) === false, 'AI bez złota nie kupuje');
  ok(shouldAIPurchaseUnit({ treasury: 50, goldCost: 50, hasManpower: false }) === false, 'AI bez Manpower nie kupuje');

  const building = { kind: 'budynek', id: 'spichlerz', koszt: 10 };
  const unit = { kind: 'jednostka', id: 'Wojownik', koszt: 50 };
  const withBuilding = enqueueRecruitment({ kolejka: [building], postep: 3 }, unit);
  ok(withBuilding.kolejka.length === 1 && withBuilding.kolejka[0].kind === 'budynek', 'miasto budujące budynek zachowuje jednostkę poza kolejką Pracy');
  ok(withBuilding.rekrutacja.length === 1 && withBuilding.rekrutacja[0].id === 'Wojownik', 'zakup trafia do osobnej kolejki rekrutacji');
  const work = advanceProduction(withBuilding, 7);
  ok(work.completed?.id === 'spichlerz' && work.prod.rekrutacja.length === 1, 'Praca kończy budynek bez zużywania rekrutacji');
  const recruit = advanceRecruitment(work.prod, 1);
  ok(recruit.completed.length === 1 && recruit.completed[0].id === 'Wojownik' && recruit.prod.kolejka.length === 0, 'rekrutacja kończy jednostkę bez postępu Pracy');
  console.log(`ai-rekrutacja-parytet-test: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
} finally {
  try { fs.unlinkSync(entry); } catch (_) {}
  try { fs.unlinkSync(bundle); } catch (_) {}
}
