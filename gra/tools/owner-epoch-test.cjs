'use strict';
/** node tools/owner-epoch-test.cjs — epoka AI z badań (fair play, Kamień na starcie) */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.owner-epoch-entry.ts');
const bundle = path.join(__dirname, '.owner-epoch-bundle.cjs');

fs.writeFileSync(entry, `
export { computeOwnerEraFromResearch } from '../src/game/owner-epoch';
export { isEraAdvanceTech } from '../src/game/playerState';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const { computeOwnerEraFromResearch, isEraAdvanceTech } = require(bundle);
const tech = require('../data/tech.json').technologie;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('owner-epoch-test\n');

assert(computeOwnerEraFromResearch(1, new Set(), tech) === 1, 'Kamień start bez badań → era 1');
assert(computeOwnerEraFromResearch(1, new Set(['Garncarstwo']), tech) === 1,
  'tech Kamienia (Garncarstwo) nie podbija epoki');

const zegluga = tech.find(t => t.Technologia === 'Żegluga');
if (zegluga) {
  assert(computeOwnerEraFromResearch(1, new Set(['Żegluga']), tech) === 1,
    'tech z etykietą Brąz (Żegluga) bez isEraAdvanceTech → nadal era 1');
}

const brazownictwo = tech.find(t => t.Technologia === 'Brązownictwo');
if (brazownictwo) {
  assert(computeOwnerEraFromResearch(1, new Set(['Brązownictwo']), tech) === 2,
    'Brązownictwo (awans epoki) z Kamienia → era 2');
  assert(computeOwnerEraFromResearch(2, new Set(['Brązownictwo']), tech) === 2,
    'Brązownictwo już wchłonięte przy starcie Brązu → bez podwójnego awansu');
}

const allStoneNoAdvance = new Set(
  tech
    .filter(t => (t.Epoka ?? 'Kamień') === 'Kamień' && !isEraAdvanceTech(t))
    .map(t => t.Technologia)
    .filter(Boolean),
);
assert(computeOwnerEraFromResearch(1, allStoneNoAdvance, tech) === 1,
  'tech Kamienia bez awansu epoki → era 1 (państwa-miasta)');

// B12: epoka startu gry (kamien) — etykieta dyplomacji nie z etykiety Epoka w tech.json
assert(computeOwnerEraFromResearch(1, new Set(['Żegluga', 'Garncarstwo']), tech) === 1,
  'Kamień start + tech z etykietą Brąz bez awansu → nadal era 1 (Lagasz/audiencja)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
