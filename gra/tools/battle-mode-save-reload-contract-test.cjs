'use strict';

/** Regression for battle-mode metadata roundtrip and legacy-save semantics. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const SAVE_BUNDLE = path.join(__dirname, '.battle-mode-save-bundle.cjs');
const MODE_BUNDLE = path.join(__dirname, '.battle-mode-mode-bundle.cjs');

async function bundle(entry, outfile) {
  await esbuild.build({
    entryPoints: [path.join(ROOT, entry)], bundle: true, platform: 'node', format: 'cjs',
    outfile, absWorkingDir: ROOT, logLevel: 'silent',
  });
}

async function main() {
  try {
    await Promise.all([
      bundle('src/game/save.ts', SAVE_BUNDLE),
      bundle('src/game/battle-mode.ts', MODE_BUNDLE),
    ]);
    const { serializeGame, deserializeGame } = require(SAVE_BUNDLE);
    const { BATTLE_MODE_SETTING_VERSION, isAutomaticOnlyBattleMode } = require(MODE_BUNDLE);
    const legacyParams = { newGameParams: { advanced: { battleAlwaysManual: false } } };
    const makeSave = meta => ({
      wersja: 3, tura: 1, seed: 123, units: [], cities: [], exploredByHuman: [],
      gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0, meta,
    });

    const oldSave = deserializeGame(serializeGame(makeSave(legacyParams)));
    assert.equal(oldSave.meta.battleModeSettingVersion, undefined,
      'old save has no new-semantics marker');
    assert.equal(isAutomaticOnlyBattleMode(
      oldSave.meta.battleModeSettingVersion,
      oldSave.meta.newGameParams.advanced.battleAlwaysManual,
    ), false, 'legacy inert false does not unexpectedly suppress the battle choice');

    for (const battleAlwaysManual of [false, true]) {
      const saved = deserializeGame(serializeGame(makeSave({
        battleModeSettingVersion: BATTLE_MODE_SETTING_VERSION,
        newGameParams: { advanced: { battleAlwaysManual } },
      })));
      assert.equal(saved.meta.battleModeSettingVersion, BATTLE_MODE_SETTING_VERSION,
        'current semantics marker survives save serialization and deserialization');
      assert.equal(saved.meta.newGameParams.advanced.battleAlwaysManual, battleAlwaysManual,
        'selected mode survives save serialization and deserialization');
      assert.equal(isAutomaticOnlyBattleMode(
        saved.meta.battleModeSettingVersion,
        saved.meta.newGameParams.advanced.battleAlwaysManual,
      ), !battleAlwaysManual, 'reloaded mode selects the corresponding battle policy');
    }

    const main = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    assert.match(main, /battleModeSettingVersion: _battleModeSettingVersion/,
      'live save snapshot writes the battle-mode semantics marker');
    assert.match(main, /const savedBattleModeVersion = saved\.meta\?\.battleModeSettingVersion;[\s\S]*?_battleModeSettingVersion = savedBattleModeVersion === BATTLE_MODE_SETTING_VERSION/,
      'live save restore reinstates the marker and treats missing markers as legacy');
    assert.match(main, /return isAutomaticOnlyBattleMode\([\s\S]*?_lastNewGameParams\?\.advanced\?\.battleAlwaysManual/,
      'battle entry policy reads the persisted setting through the version gate');
    console.log('battle-mode-save-reload-contract-test: PASS — both settings roundtrip; legacy saves retain choice');
  } finally {
    for (const file of [SAVE_BUNDLE, MODE_BUNDLE]) fs.rmSync(file, { force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
