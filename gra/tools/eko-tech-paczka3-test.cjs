'use strict';
/**
 * eko-tech-paczka3-test.cjs — regresja EKO-TECH Paczka 3 (2026-07-04)
 * node tools/eko-tech-paczka3-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.eko-tech-p3-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eko-tech-p3-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  empireHasKopalniaMiedzi, cityHasPiecHutniczy, hasBrazAccess,
  PIEC_HUTNICZY_BUILDING_ID,
} from '../src/game/braz-access';
export { availableProduction } from '../src/game/production';
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
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

// Popalnia brazu -> przemianowana na Kopalnia miedzi (przebudowa modelu brazu,
// empireHasPopalniaBrazu -> empireHasKopalniaMiedzi, klucz ulepszenia 'kopalnia_miedzi').
const placedWithPopalnia = new Map([['1,0', 'kopalnia_miedzi']]);
const placedEmpty = new Map();

// braz-access helpers
ok(!M.empireHasKopalniaMiedzi(placedEmpty), 'brak kopalni miedzi w imperium');
ok(M.empireHasKopalniaMiedzi(placedWithPopalnia), 'kopalnia miedzi w imperium');
ok(M.cityHasPiecHutniczy(['odlewnia_brazu']), 'miasto ma piec');
ok(!M.hasBrazAccess(placedWithPopalnia, []), 'AND: kopalnia miedzi bez pieca = brak brązu');
ok(M.hasBrazAccess(placedWithPopalnia, ['odlewnia_brazu']), 'AND: kopalnia miedzi + piec = brąz');

// B-ODLEWNIA-2026-07-27: Odlewnia brązu (Piec hutniczy = rezerwa na przyszłe epoki)
{
  const odlewnia = buildings.find(b => b.id === 'odlewnia_brazu');
  ok(odlewnia && odlewnia.nazwa === 'Odlewnia brązu', 'odlewnia_brazu nazwa Odlewnia brązu');
}

// production gates
const city = { id: 'c1', ownerId: 0, population: 5, q: 0, r: 0 };
const data = { buildings, units };
const techs = ['Brązownictwo', 'Wojskowosc'];
const ctxBase = { epoch: 2, builtBuildingIds: ['koszary'], unlockedTechs: techs };

const noPopalnia = M.availableProduction(city, data, techs, {
  ...ctxBase,
  placedImprovements: placedEmpty,
});
ok(
  !noPopalnia.some(it => it.kind === 'budynek' && it.id === M.PIEC_HUTNICZY_BUILDING_ID),
  'Odlewnia brązu ukryta bez Kopalni miedzi',
);

const withPopalniaNoPiec = M.availableProduction(city, data, techs, {
  ...ctxBase,
  placedImprovements: placedWithPopalnia,
});
ok(
  withPopalniaNoPiec.some(it => it.kind === 'budynek' && it.id === M.PIEC_HUTNICZY_BUILDING_ID),
  'Odlewnia brązu dostępna po Kopalni miedzi',
);

const bronzeUnit = units.find(u => (u.Surowiec ?? '').toLowerCase() === 'braz');
if (bronzeUnit) {
  const noBraz = M.availableProduction(city, data, techs, {
    ...ctxBase,
    placedImprovements: placedWithPopalnia,
    builtBuildingIds: ['koszary'],
  });
  ok(
    !noBraz.some(it => it.kind === 'jednostka' && it.id === bronzeUnit.Jednostka),
    'Jednostka brązowa ukryta bez pieca',
  );
  const fullChain = M.availableProduction(city, data, techs, {
    ...ctxBase,
    placedImprovements: placedWithPopalnia,
    builtBuildingIds: ['koszary', 'odlewnia_brazu'],
  });
  ok(
    fullChain.some(it => it.kind === 'jednostka' && it.id === bronzeUnit.Jednostka),
    'Jednostka brązowa po Popalni + Piec',
  );
}

console.log(`\neko-tech-paczka3: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
