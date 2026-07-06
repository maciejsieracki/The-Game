'use strict';
/** eko-tech-paczka4-test.cjs — ABC-16/17/18 (2026-07-05) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.eko-tech-p4-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eko-tech-p4-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeEmpireLivestockUnlocks, improvementMatchesLivestockDeposit,
  hexHasHorseDeposit,
} from '../src/game/livestock-unlock';
export { buildImprovementQualifier, depositAllowsPlayerImprovement } from '../src/map/improvement-build';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const NK = M.Nakladka;
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const terrain = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-improvements.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

// ABC-16/17 — dane
{
  const kregi = buildings.find(b => b.id === 'kamienne_kregi');
  const sw = buildings.find(b => b.id === 'swiatynia');
  ok(kregi && kregi.techUnlock === 'Mistycyzm', 'ABC-16 kręgi = budynek Mistycyzm');
  ok(sw && sw.upgradeFrom === 'kamienne_kregi', 'ABC-17 świątynia upgradeFrom kręgi');
}

// ABC-18 stadnina JSON
ok(terrain.stadnina && terrain.stadnina.tech === 'Jeździectwo', 'ABC-18 stadnina + Jeździectwo');

// unlock tylko po pastwisku
{
  const map = {
    hexes: {
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.ZlozeBydla, wlasciciel: '0' },
      '1,0': { coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.ZlozeKonia, wlasciciel: '0' },
    },
  };
  ok(!M.computeEmpireLivestockUnlocks(new Map(), map, '0').has('bydlo'), 'brak unlock bez pastwiska');
  ok(M.computeEmpireLivestockUnlocks(new Map([['0,0', 'bydlo']]), map, '0').has('bydlo'), 'unlock po bydlo na zlozu');
  ok(!M.computeEmpireLivestockUnlocks(new Map(), map, '0').has('kon'), 'brak konia bez stadniny');
  ok(M.computeEmpireLivestockUnlocks(new Map([['1,0', 'stadnina']]), map, '0').has('kon'), 'kon po stadninie');
}

// kwalifikacja stadniny
{
  const hexKon = {
    coords: { q: 1, r: 0 }, terenBazowy: TB.Rownina, nakladka: NK.ZlozeKonia,
    rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
  };
  ok(M.depositAllowsPlayerImprovement('stadnina', hexKon), 'stadnina depositAllows kon');
  const qual = M.buildImprovementQualifier({
    map: {
      hexes: {
        '0,0': { coords: { q: 0, r: 0 }, terenBazowy: TB.Rownina, nakladka: NK.Brak, rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null },
        '1,0': hexKon,
      },
      riverPaths: [],
      startPositions: [{ q: 0, r: 0 }],
    },
    cityNodes: [{ q: 0, r: 0, pop: 10, level: 1 }],
  });
  ok(qual('stadnina', 1, 0), 'stadnina qualifies on horse deposit');
  ok(!qual('stadnina', 0, 0), 'stadnina NIE na równinie bez konia');
}

console.log(`\neko-tech-paczka4: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
