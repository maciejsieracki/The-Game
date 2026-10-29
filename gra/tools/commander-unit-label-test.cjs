'use strict';

// Execute the exact production adapter function so a display-only commander label
// cannot regress while its combat body/stats are still preserved.
const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'commander-unit-label-'));
const entry = path.join(TMP, 'entry.ts');
const out = path.join(TMP, 'entry.cjs');

async function main() {
  const mainSource = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
  const battleSource = fs.readFileSync(path.join(ROOT, 'src/battle/battleScene.ts'), 'utf8');
  const body = mainSource.match(/function runtimeToBattleUnit\([\s\S]*?\n    }/);
  if (!body) throw new Error('runtimeToBattleUnit production adapter not found');
  const labelMethod = battleSource.match(/private _unitDisplayLabel\(ru: RuntimeBattleUnit\): string \{[\s\S]*?\n  \}/);
  if (!labelMethod || !/return String\(ru\.bu\.nazwa \?\? ru\.bu\.kategoria \?\? 'Jednostka'\);/.test(labelMethod[0])) {
    throw new Error('battle unit cards no longer display the BattleUnit name');
  }

  // Compile and invoke the production function body with controlled runtime
  // dependencies. This executes the adapter logic, rather than only matching its
  // source text; no browser/renderer mock is involved in the behavior assertion.
  fs.writeFileSync(entry, `
import { armyLeaderTitle } from ${JSON.stringify(path.join(ROOT, 'src/game/army-leadership.ts'))};
type RuntimeUnit = any;
type BattleUnit = any;
type RuntimeBattleUnit = any;
const unitDefFor = (_u: any) => ({ Jednostka: 'Wojownik', Atak: 4 });
const syncRuntimeUnitHpState = (_u: any) => 22;
const empireBuiltIdsForOwner = (ownerId: number) => ownerId === 7 ? ['akademia_wojskowa'] : [];
const unitPancerzBonusFrac = (_u: any) => 0;
const unitParametryBonusFrac = (_u: any) => 0;
const veteranCombatBonusFrac = (_u: any) => 0;
const unitGetsFortifyBonus = (_u: any) => false;
const isArmyHungry = (_ownerId: number) => false;
const isCivilianUnit = (_u: any) => false;
const isGoldDeficit = (_ownerId: number) => false;
${body[0]}
class ProductionBattleUnitLabelHarness {
${labelMethod[0]}
}
export { runtimeToBattleUnit };
export const renderUnitCardLabel = (bu: any): string =>
  new ProductionBattleUnitLabelHarness()['_unitDisplayLabel']({ bu });
`);
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent' });
  const { runtimeToBattleUnit, renderUnitCardLabel } = require(out);
  const runtimeUnit = (id, ownerId, isGeneral) => ({ id, ownerId, isGeneral, typeId: 'Wojownik', category: 'Piechota', hp: 18 });
  const chief = runtimeToBattleUnit(runtimeUnit('leader-no-academy', 3, true), null, 0x123456);
  const general = runtimeToBattleUnit(runtimeUnit('leader-academy', 7, true), null, 0x123456);
  const warrior = runtimeToBattleUnit(runtimeUnit('regular-warrior', 3, false), null, 0x123456);
  if (chief.nazwa !== 'Wódz' || chief.isArmyCommander !== true) throw new Error(`expected Wódz, got ${chief.nazwa}`);
  if (general.nazwa !== 'Generał' || general.isArmyCommander !== true) throw new Error(`expected Generał, got ${general.nazwa}`);
  if (warrior.nazwa !== 'Wojownik' || warrior.isArmyCommander !== false) throw new Error('ordinary unit label changed');
  if (renderUnitCardLabel(chief) !== 'Wódz' || renderUnitCardLabel(general) !== 'Generał'
    || renderUnitCardLabel(warrior) !== 'Wojownik') {
    throw new Error('production battle card label accessor did not render adapted commander/warrior labels');
  }
  for (const adapted of [chief, general]) {
    if (adapted.kategoria !== 'Piechota' || adapted.stats.Jednostka !== 'Wojownik') {
      throw new Error('commander display label overwrote its combat body/category');
    }
    if (adapted.hp !== 18 || adapted.maxHp !== 22 || adapted.ownerColor !== 0x123456) {
      throw new Error('adapter did not preserve runtime combat/UI fields');
    }
  }

  console.log('PASS: executed production adapter returns Wódz without military academy');
  console.log('PASS: executed production adapter returns Generał with military academy');
  console.log('PASS: regular unit remains Wojownik; commander combat body/category remain intact');
  console.log('PASS: adapter preserves current/max HP and owner color');
  console.log('PASS: executed production battle-card label accessor renders Wódz/Generał/Wojownik');
  console.log('5/5 PASS');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});
