'use strict';
/**
 * eko-tech-paczka1-test.cjs — regresja EKO-TECH Paczka 1 (2026-07-04)
 * node tools/eko-tech-paczka1-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.eko-tech-p1-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eko-tech-p1-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  canResearch, availableTechs, createResearchState, buildingGateMet,
  resolveRequiredBuildingId,
} from '../src/game/research';
export {
  availableProduction, applyCompletedBuildingIds, isBuildingSupersededByUpgrade,
} from '../src/game/production';
export { setPlayerResearchTarget, availableTechs as playerAvailableTechs, createPlayerState } from '../src/game/playerState';
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
});

const M = require(BUNDLE);
const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8')).technologie;
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

const gateEmpty = { empireBuiltIds: new Set(), buildings };
const gateWithCeg = { empireBuiltIds: new Set(['cegielnia']), buildings };

// T-TECH-7: Pismo wymaga Cegielni
{
  const st = M.createResearchState();
  st.ukonczone = ['Garncarstwo'];
  ok(!M.canResearch(st, techData, 'Pismo', gateEmpty), 'Pismo blocked bez Cegielni (gate)');
  ok(M.canResearch(st, techData, 'Pismo', gateWithCeg), 'Pismo OK z Cegielnia');
  const avail = M.availableTechs(st, techData, gateWithCeg).filter(t => t === 'Pismo');
  ok(avail.includes('Pismo'), 'Pismo on available list z gate');
}

// T-TECH-8: upgrade kręgi → świątynia
{
  const built = ['kamienne_kregi'];
  ok(!M.isBuildingSupersededByUpgrade('kamienne_kregi', built, buildings), 'kręgi not superseded yet');
  const after = M.applyCompletedBuildingIds(built, 'swiatynia', buildings);
  ok(after.includes('swiatynia') && !after.includes('kamienne_kregi'), 'upgrade replaces kręgi');
  ok(M.isBuildingSupersededByUpgrade('kamienne_kregi', after, buildings), 'kręgi superseded after upgrade');
}

// ABC-9: Mielerz po Obróbce drewna
{
  const items = M.availableProduction(
    { id: 'c1', name: 'X', ownerId: 0, population: 3, q: 0, r: 0 },
    { buildings, units: [] },
    ['Obróbka drewna'],
    { epoch: 1, builtBuildingIds: [] },
  );
  ok(items.some(i => i.id === 'mielerz'), 'Mielerz in production after Obróbka drewna');
}

// playerState gate
{
  const ps = M.createPlayerState();
  for (const t of ['Garncarstwo']) ps.zbadane.add(t);
  ok(!M.setPlayerResearchTarget(ps, 'Pismo', techData, gateEmpty), 'setPlayerResearchTarget rejects bez Cegielni');
  ok(M.setPlayerResearchTarget(ps, 'Pismo', techData, gateWithCeg), 'setPlayerResearchTarget OK z Cegielnia');
}

console.log(`\neko-tech-paczka1: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
