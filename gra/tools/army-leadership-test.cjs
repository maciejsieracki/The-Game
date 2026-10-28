'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function load(modulePath, entry) {
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: path.join(__dirname, '..'), sourcefile: 'army-leadership-test.ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, require }, { filename: modulePath });
  return module.exports;
}

async function main() {
  const leadership = await load('army-leadership.ts', "export * from './src/game/army-leadership.ts';");
  assert.strictEqual(leadership.armyLeaderTitle(['akademia']), 'Wódz', 'regular Academy does not promote the commander');
  assert.strictEqual(leadership.armyLeaderTitle(['akademia_wojskowa']), 'Generał', 'Military Academy promotes the commander');
  assert.strictEqual(leadership.armyLeaderMoraleBonusFrac(false, ['akademia_wojskowa']), 0, 'no assigned commander means no morale bonus');
  assert.strictEqual(leadership.armyLeaderMoraleBonusFrac(true, ['akademia']), 0.10);
  assert.strictEqual(leadership.armyLeaderMoraleBonusFrac(true, ['akademia_wojskowa']), 0.20);
  assert.strictEqual(leadership.moraleWithArmyLeaderBonus(101, 0.10), 112);

  const regularA = { morale: 40, moraleMax: 100 };
  const regularB = { morale: 30, moraleMax: 100, routed: true };
  const leader = { isArmyCommander: true, morale: 5, moraleMax: 10 };
  assert.strictEqual(leadership.armyMoraleRatioWithoutCommander([regularA, regularB, leader]), 0.20,
    'commander morale is excluded while routed ordinary units remain in the denominator');
  assert.deepStrictEqual(Array.from(leadership.commandersToWithdrawAfterArmyBreak([regularA, regularB, leader], 0.25)), [leader],
    'living commander withdraws when ordinary army reaches aggregate rout');
  assert.deepStrictEqual(Array.from(leadership.commandersToWithdrawAfterArmyBreak([
    { isArmyCommander: true, morale: 4, moraleMax: 10, routed: true }, regularA,
  ], 0.25)), [], 'a commander who already routed does not receive a second rout');
  assert.strictEqual(leadership.armyMoraleRatioWithoutCommander([{ isArmyCommander: true, morale: 10, moraleMax: 10 }]), 0,
    'commander alone has no ordinary army left and therefore loses');

  const scene = fs.readFileSync(path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts'), 'utf8');
  assert.match(scene, /if \(ru\.isArmyCommander\) \{[\s\S]*?_removeCommanderMoraleBonus\(ru\.side\)/,
    'individual commander rout removes the assigned army bonus immediately');
  assert.match(scene, /private _startFade\(ru: RuntimeBattleUnit\): void \{[\s\S]*?_removeCommanderMoraleBonus\(ru\.side\)/,
    'commander death removes the assigned army bonus');
  const wallCollapseStart = scene.indexOf('// ZMIANA 5: obrońca na wyburzonym kaflu');
  const wallCollapseEnd = scene.indexOf('\n    this._updateSiegeWallVisuals', wallCollapseStart);
  const wallCollapsePath = scene.slice(wallCollapseStart, wallCollapseEnd < 0 ? wallCollapseStart + 1800 : wallCollapseEnd);
  assert.match(wallCollapsePath, /if \(u\.isArmyCommander\) \{[\s\S]*?_removeCommanderMoraleBonus\(u\.side\);[\s\S]*?_disableManualIfCommanderLost\(u\.side\);/,
    'wall-collapse commander death removes the bonus and falls back from manual control');
  assert.match(scene, /commandersToWithdrawAfterArmyBreak\(this\.atk/,
    'aggregate defeat sends a surviving attacker commander into normal rout');
  assert.match(scene, /commandersToWithdrawAfterArmyBreak\(this\.def/,
    'aggregate defeat sends a surviving defender commander into normal rout');
  assert.match(scene, /initialBattleLineOrder\(units,[\s\S]*?isArmyCommander/,
    'commander enters the regular deployment line order');
  assert.match(scene, /manualControlAllowed\?: boolean/);
  assert.match(scene, /_toggleManualMode\(\): void \{[\s\S]*?_manualCommanderGate/,
    'manual mode is guarded by participating player commander availability');

  const preBattle = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'preBattle.ts'), 'utf8');
  assert.match(preBattle, /manualControlAllowed/);
  assert.match(preBattle, /data-act="auto"/);
  assert.match(preBattle, /PB_SVG\.auto \+ 'Auto<\/button>'/,
    'Auto action remains present when manual battlefield control is gated');
  console.log('PASS: commander title, morale, aggregate rout/death contracts, placement, and Auto/manual gate');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
