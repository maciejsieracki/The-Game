// Generator wektorow REPIN-WOJNA-2 (U2, battle-mode.ts) z URUCHOMIONEGO kodu weba (pin dc8a3adc).
// Zrodlo: gra/src/game/battle-mode.ts (importowane BEZ ZMIAN, node --experimental-strip-types).
// Wartosci wejsciowe zapisane jako tekst z typem: 'undef' | 'null' | 'bool:true' | 'bool:false' |
// 'num:<n>' | 'str:<s>' (zeby nie zgubic typu: web sprawdza `=== false`, wiec tylko bool:false daje true).
//
// Uruchomienie: node --experimental-strip-types ./gen-repin-wojna-2-battle-mode-vectors.mjs <WEB_ROOT> <OUT_FILE>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, outFile] = process.argv.slice(2);
if (!webRoot || !outFile) throw new Error('uzycie: <WEB_ROOT> <OUT_FILE>');

const SRC = 'gra/src/game/battle-mode.ts';
const mod = await import(pathToFileURL(join(webRoot, SRC)).href);
const { BATTLE_MODE_SETTING_VERSION, isAutomaticOnlyBattleMode } = mod;

const VERSIONS = [
  { enc: 'undef', v: undefined }, { enc: 'num:0', v: 0 }, { enc: 'num:1', v: 1 }, { enc: 'num:2', v: 2 },
  { enc: 'num:-1', v: -1 }, { enc: 'num:1.5', v: 1.5 }, { enc: 'num:NaN', v: NaN }, { enc: 'null', v: null },
];
const VALUES = [
  { enc: 'undef', v: undefined }, { enc: 'null', v: null }, { enc: 'bool:true', v: true },
  { enc: 'bool:false', v: false }, { enc: 'num:0', v: 0 }, { enc: 'num:1', v: 1 },
  { enc: 'str:false', v: 'false' }, { enc: 'str:', v: '' },
];

const cases = [];
for (const ver of VERSIONS) for (const val of VALUES) {
  cases.push({
    settingVersion: ver.enc,
    battleAlwaysManual: val.enc,
    out: isAutomaticOnlyBattleMode(ver.v, val.v),
  });
}

writeFileSync(outFile, JSON.stringify({
  pin: 'dc8a3adc989bc82aab2cde6bb747c883f949fc1a',
  generator: 'gen-repin-wojna-2-battle-mode-vectors.mjs (U2 r1)',
  node: process.version,
  sourceSha256: createHash('sha256').update(readFileSync(join(webRoot, SRC))).digest('hex'),
  BATTLE_MODE_SETTING_VERSION: String(BATTLE_MODE_SETTING_VERSION),
  cases,
}, null, 1) + '\n');
console.log(JSON.stringify({ cases: cases.length, trueCases: cases.filter((c) => c.out).length }));
