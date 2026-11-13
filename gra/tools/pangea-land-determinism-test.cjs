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
  // R-WEB-HORSE-RESOURCE-TERRAIN-Q1 (2026-11-03): hashe `hexes` zmienione CELOWO - relocateForestHorses przenosi
  // zloze konia z lasu na najblizsza wolna Rownine. Dowod: gate-hexes-diff-fast.txt (12/12 map: liczba koni rowna,
  // 0 koni na lesie, roznice wylacznie w polach zloze/nakladka/nakladki). Poprzednie (baza 57a7ada40) w komentarzu run-u.
  'kontynenty:1': 'd4129ac5a700b221', 'kontynenty:42': '4db90d6e807ceb5f', 'kontynenty:99': 'be3f9c573ab42d05', 'kontynenty:7777': 'eac663ea51e76718',
  'wyspy:1': '5af15091eec73d5d', 'wyspy:42': '58191dcbaf2f237f', 'wyspy:99': '90a0b2438aa2c44d', 'wyspy:7777': 'aea744461a035d68',
  'ziemia:1': '37a4b9d4c5f56da8', 'ziemia:42': 'c9f78b075f353f11', 'ziemia:99': 'a70a97fd31536d74', 'ziemia:7777': 'fdfb833fbe69dff9',
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
