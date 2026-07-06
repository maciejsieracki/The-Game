'use strict';
/**
 * eko-tech-paczka2-test.cjs — regresja EKO-TECH Paczka 2 (2026-07-04)
 * ABC-10 Cytadela/Fort · ABC-11 spichlerz 70% · ABC-14 popalnia na rudzie
 * node tools/eko-tech-paczka2-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.eko-tech-p2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eko-tech-p2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildImprovementQualifier, depositAllowsPlayerImprovement } from '../src/map/improvement-build';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const NK = M.Nakladka;

const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const terrain = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-improvements.json'), 'utf8'));
const econParams = JSON.parse(fs.readFileSync(path.join(GRA, 'data/econ-params.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

function mkHex(q, r, teren, nakladka = NK.Brak, zloze) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    zloze,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
}

// ABC-10: Cytadela (miasto) vs Fort (mapa)
{
  const cytadela = buildings.find(b => b.id === 'fort');
  ok(cytadela && cytadela.nazwa === 'Cytadela', 'ABC-10 budynek fort → nazwa Cytadela');
  ok(terrain.fort && terrain.fort.nazwa === 'Fort', 'ABC-10 ulepszenie mapy fort → nazwa Fort');
}

// ABC-11: bufor spichlerza 70% normal
{
  const row = econParams.ekonomia_miasta.spichlerz_zachowanie_po_wzroscie;
  ok(row && row.normal === 0.7, 'ABC-11 spichlerz_zachowanie normal=0.7');
}

// ABC-14: popalnia tylko na rudzie
{
  const hexRuda = mkHex(1, 0, TB.Wzgorza, NK.Brak, 'ruda');
  const hexPlain = mkHex(2, 0, TB.Rownina);
  const hexOreOverlay = mkHex(3, 0, TB.Wzgorza, NK.ZlozeRudy);

  ok(M.depositAllowsPlayerImprovement('popalnia_brazu', hexRuda), 'ABC-14 depositAllows: zloze ruda');
  ok(M.depositAllowsPlayerImprovement('popalnia_brazu', hexOreOverlay), 'ABC-14 depositAllows: ZlozeRudy');
  ok(!M.depositAllowsPlayerImprovement('popalnia_brazu', hexPlain), 'ABC-14 depositAllows: równina NIE');

  const map = {
    hexes: {
      '0,0': mkHex(0, 0, TB.Rownina),
      '1,0': hexRuda,
      '2,0': hexPlain,
      '3,0': hexOreOverlay,
    },
    riverPaths: [],
    startPositions: [{ q: 0, r: 0 }],
  };
  const qualifies = M.buildImprovementQualifier({
    map,
    cityNodes: [{ q: 0, r: 0, pop: 10, level: 1 }],
  });

  ok(qualifies('popalnia_brazu', 1, 0), 'ABC-14 qualifies: heks z rudą');
  ok(!qualifies('popalnia_brazu', 2, 0), 'ABC-14 qualifies: równina odrzucona');
  ok(qualifies('popalnia_brazu', 3, 0), 'ABC-14 qualifies: Wzgórza + ZlozeRudy');
}

console.log(`\neko-tech-paczka2: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
