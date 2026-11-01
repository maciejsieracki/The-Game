'use strict';
/**
 * R-WEB-PANGEA-LAND-FRACTION-Q1: hash `hexes` dla Kontynenty/Wyspy/Ziemia (musza byc IDENTYCZNE
 * przed/po poprawce Pangei) + Pangea (zmienia sie celowo) + udzial ladu Pangei.
 * Uzycie: node tools/pangea-land-determinism-test.cjs [plik-wyjsciowy]
 * ASERCJE (obrona r1, zarzut 4): hash Kontynentow/Wysp/Ziemi == EXPECTED (zmierzone na bazie 57cc8aded, rzeki off)
 * oraz udzial ladu Pangei 59-61%. Naruszenie => exit 1.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY = path.resolve(__dirname, '.pangea-land-det-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-land-det-bundle.cjs');
fs.writeFileSync(ENTRY, `
import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
const opts = { worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' } };
const SEEDS = [1, 42, 99, 7777];
const EXPECTED = {
  'kontynenty:1': 'e74242c34ecb7f0b', 'kontynenty:42': '0e77e0b16879956b', 'kontynenty:99': '57284d6ef0161ba8', 'kontynenty:7777': '9cf2edabb5b7c0a2',
  'wyspy:1': '9cc4bc9535c46b18', 'wyspy:42': '2c1d8c5b5b889fe4', 'wyspy:99': 'aacd8ddc9bb95bcf', 'wyspy:7777': '38f56785b1a59cbc',
  'ziemia:1': '458ee817695e84f2', 'ziemia:42': '4a5f002feaaccc86', 'ziemia:99': '9487a92ea5b2cbb0', 'ziemia:7777': '70d790e81f76a606',
};
const fails = [];
const lines = [];
for (const typ of ['kontynenty', 'wyspy', 'ziemia', 'pangea']) {
  for (const seed of SEEDS) {
    const m = M.generujSwiat(seed, 'standardowy', typ, opts);
    const h = crypto.createHash('sha256').update(JSON.stringify(m.hexes)).digest('hex').slice(0, 16);
    const c = M.countLandSeaHexes(m.hexes);
    const pct = 100 * c.land / c.total;
    const key = `${typ}:${seed}`;
    if (EXPECTED[key] && EXPECTED[key] !== h) fails.push(`${key}: hash ${h} != ${EXPECTED[key]}`);
    if (typ === 'pangea' && (pct < 59 || pct > 61)) fails.push(`${key}: land ${pct.toFixed(2)}% poza 59-61`);
    lines.push(`${typ} seed=${seed} hash=${h} land=${(100 * c.land / c.total).toFixed(2)}%`);
  }
}
const out = lines.join('\n');
console.log(out);
if (process.argv[2]) fs.writeFileSync(process.argv[2], out + '\n');
if (fails.length) { console.error('FAIL:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('PASS: hashe 3 typow identyczne z baza, Pangea 59-61%');
