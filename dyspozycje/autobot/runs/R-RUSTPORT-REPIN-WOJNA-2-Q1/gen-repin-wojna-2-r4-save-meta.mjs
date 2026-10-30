// REPIN-WOJNA-2 R4 - generator wektorow `meta` zapisu (battleModeSettingVersion / newGameParams).
// Uruchomienie (poza repo, z wyciagnietym pinem dc8a3adc):
//   node --experimental-strip-types gen-repin-wojna-2-r4-save-meta.mjs <ROOT> > save-meta.json
// ROOT zawiera gra/src/game/battle-mode.ts i gra/src/main.ts (git archive dc8a3adc gra/src/...),
// gra/package.json {"type":"module"}. Skrypt sprawdza, ze cytowane wyrazenia sa obecne w main.ts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
if (!root) throw new Error('usage: <ROOT>');
const { isAutomaticOnlyBattleMode, BATTLE_MODE_SETTING_VERSION } = await import(
  pathToFileURL(join(root, 'gra/src/game/battle-mode.ts')).href
);
const mainSrc = readFileSync(join(root, 'gra/src/main.ts'), 'utf8');
// Cytowane wyrazenia z dc8a3adc (main.ts:29056-29058, :40818-40820).
const mustContain = [
  'savedBattleModeVersion = saved.meta?.battleModeSettingVersion;',
  'savedBattleModeVersion === BATTLE_MODE_SETTING_VERSION',
  '_lastNewGameParams?.advanced?.battleAlwaysManual',
  'if (!isMe(ownerId)) return false;',
];
for (const snip of mustContain) {
  if (!mainSrc.includes(snip)) throw new Error('brak wyrazenia w main.ts: ' + snip);
}

// Ekstrakt 1:1 z main.ts:40819-40821 (restoreGameFromSave); `saved` = obiekt meta po JSON.parse.
function restoreVersion(saved) {
  const savedBattleModeVersion = saved.battleModeSettingVersion;
  return savedBattleModeVersion === BATTLE_MODE_SETTING_VERSION
    ? BATTLE_MODE_SETTING_VERSION
    : undefined;
}
// Ekstrakt 1:1 z main.ts:29052-29060 (playerBattleAutomaticOnly); `newGameParams` = _lastNewGameParams.
function playerBattleAutomaticOnly(isMe, restored, newGameParams) {
  if (!isMe) return false;
  return isAutomaticOnlyBattleMode(restored, newGameParams?.advanced?.battleAlwaysManual);
}

const versions = [1, 1.0, 0, 2, '1', null, true, false, 'x', undefined, NaN, 1.5];
const manuals = [false, true, null, 'false', 0, undefined];
// Ksztalt newGameParams: brak / brak advanced / advanced null / advanced z battleAlwaysManual.
const paramsShapes = ['absent', 'noAdvanced', 'advancedNull', 'advanced'];
const cases = [];
for (const v of versions) {
  for (const m of manuals) {
    for (const shape of paramsShapes) {
      for (const isMe of [true, false]) {
        const meta = {};
        if (v !== undefined) meta.battleModeSettingVersion = v;
        if (shape === 'noAdvanced') meta.newGameParams = { seed: 7 };
        if (shape === 'advancedNull') meta.newGameParams = { advanced: null };
        if (shape === 'advanced') meta.newGameParams = { advanced: { battleAlwaysManual: m } };
        // Stan po JSON (zapis na dysk): NaN -> null, undefined-pola znikaja.
        const metaJson = JSON.stringify(meta);
        const saved = JSON.parse(metaJson);
        const restored = restoreVersion(saved);
        const automaticOnly = playerBattleAutomaticOnly(isMe, restored, saved.newGameParams);
        cases.push({
          metaJson,
          isMe,
          restoredVersion: restored === undefined ? null : restored,
          automaticOnly,
        });
      }
    }
  }
}
process.stdout.write(
  JSON.stringify({ constVersion: BATTLE_MODE_SETTING_VERSION, count: cases.length, cases }, null, 1) + '\n',
);
