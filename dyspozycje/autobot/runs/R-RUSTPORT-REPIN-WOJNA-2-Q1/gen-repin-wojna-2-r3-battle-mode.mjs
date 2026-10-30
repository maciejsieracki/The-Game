// Generator wektorow REPIN-WOJNA-2 R3 (integracja battle-mode z zapisem, logika).
// Zrodla (pin dc8a3adc):
//  - gra/src/game/battle-mode.ts (importowany BEZ ZMIAN, brak importow),
//  - gra/src/main.ts:29052-29060 `playerBattleAutomaticOnly` (cialo wyciete dosłownie, `isMe` jako parametr),
//  - gra/src/main.ts:40818-40821 normalizacja wersji przy wczytaniu zapisu (wyrazenie dosłownie).
// Wejscia: pelny iloczyn kartezjanski wartosci JS (lista ponizej). Wynik: 0/1 dla kazdej kombinacji.
// Uruchomienie: node --experimental-strip-types ./gen-repin-wojna-2-r3-battle-mode.mjs <WEB_ROOT> <OUT_FILE>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outFile] = process.argv.slice(2);
if (!webRoot || !outFile) throw new Error('uzycie: <WEB_ROOT> <OUT_FILE>');
const BM = await import(pathToFileURL(join(webRoot, 'gra/src/game/battle-mode.ts')).href);

const mainSrc = readFileSync(join(webRoot, 'gra/src/main.ts'), 'utf8').split('\n');
const seg = (a, b) => mainSrc.slice(a - 1, b).join('\n');
if (!seg(29052, 29052).includes('function playerBattleAutomaticOnly')) throw new Error('zla linia 29052');
if (!seg(40819, 40819).includes('_battleModeSettingVersion = savedBattleModeVersion')) throw new Error('zla linia 40819');

// wyrazenia skopiowane z main.ts (z wiernym zachowaniem `===`)
const restoreVersion = (savedBattleModeVersion) =>
  savedBattleModeVersion === BM.BATTLE_MODE_SETTING_VERSION ? BM.BATTLE_MODE_SETTING_VERSION : undefined;
const playerAutomaticOnly = (isMe, _battleModeSettingVersion, battleAlwaysManual) => {
  if (!isMe) return false;
  return BM.isAutomaticOnlyBattleMode(_battleModeSettingVersion, battleAlwaysManual);
};

// Kolejnosc wartosci MUSI byc zgodna z tablicami w rust-port/engine/tests/p6_repin_wojna_2_r3_battle_mode.rs
const VERSIONS = [undefined, 1, 0, 2, '1', null, NaN, true, false];
const MANUALS = [undefined, false, true, null, 0, '', 'false'];
const ME = [true, false];
const enc = (x) => (x === undefined ? 'undef' : Number.isNaN(x) ? 'NaN' : x);

const restoreOut = VERSIONS.map((v) => {
  const r = restoreVersion(v);
  return r === undefined ? 'undef' : r;
});
const rows = [];
for (const v of VERSIONS) for (const m of MANUALS) for (const me of ME) {
  rows.push({
    version: enc(v),
    manual: enc(m),
    isMe: me,
    // wynik po normalizacji wczytania (main.ts:40819) i potem playerBattleAutomaticOnly
    restoredThenAuto: playerAutomaticOnly(me, restoreVersion(v), m) ? 1 : 0,
    rawAuto: BM.isAutomaticOnlyBattleMode(v, m) ? 1 : 0,
  });
}
const doc = {
  source: 'gra/src/game/battle-mode.ts + gra/src/main.ts:29052-29060, :40818-40821 @ dc8a3adc',
  generator: 'dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-r3-battle-mode.mjs',
  constVersion: BM.BATTLE_MODE_SETTING_VERSION,
  versions: VERSIONS.map(enc),
  manuals: MANUALS.map(enc),
  restoreOut,
  rows,
};
writeFileSync(outFile, JSON.stringify(doc));
console.log(`rows=${rows.length} trueRestored=${rows.filter((r) => r.restoredThenAuto === 1).length} trueRaw=${rows.filter((r) => r.rawAuto === 1).length}`);
