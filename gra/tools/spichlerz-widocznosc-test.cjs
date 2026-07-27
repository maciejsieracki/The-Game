'use strict';
/**
 * spichlerz-widocznosc-test.cjs — katalog budynków + magazyn państwa (kanon 2026-07-28).
 *
 * Kanon: bramka budowy = wyłącznie zapas w magazynie państwa (`koszt_surowce`).
 * Dostęp do etykiety surowca (deposit/zasięg) NIE blokuje budowy.
 *
 * `eraBuildingCatalog` pokazuje status='locked' gdy brakuje surowców w magazynie,
 * `buildableProduction` nie filtruje po dostępie — blokada kosztu w UI (cityPanel).
 *
 * Run from gra/:  node tools/spichlerz-widocznosc-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.spichlerz-widocznosc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.spichlerz-widocznosc-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const rawBuildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const DATA = { buildings: rawBuildings, units: [] };

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; }
  else { fail++; console.error('  FAIL:', m); }
}

const CITY = { id: 'c1', q: 0, r: 0, ownerId: 0, population: 5 };

function baseCtx(overrides) {
  return Object.assign({
    epoch: 1,
    builtBuildingIds: [],
    productionQueue: [],
    isCapital: true,
    ownerId: 0,
    difficulty: 'normal',
  }, overrides);
}

function buildIds(techs, ctxOverrides) {
  return M.buildableProduction(CITY, DATA, techs, baseCtx(ctxOverrides)).map(it => it.id);
}

function catalogEntry(id, techs, ctxOverrides) {
  const catalog = M.eraBuildingCatalog(DATA, techs, baseCtx(ctxOverrides));
  return catalog.find(e => e.id === id);
}

// ===========================================================================
// 1. SPICHLERZ — tech Garncarstwo wystarczy do listy; katalog locked bez drewna w magazynie.
// ===========================================================================
{
  const techs = ['Garncarstwo'];
  ok(buildIds(techs, {}).includes('spichlerz'),
    'Spichlerz w buildableProduction z samą tech (bez dostępu Ceramika)');

  const locked = catalogEntry('spichlerz', techs, {});
  ok(!!locked, 'Spichlerz jest OBECNY w eraBuildingCatalog');
  ok(locked && locked.status === 'locked',
    `Spichlerz eraBuildingCatalog status='locked' bez drewna w magazynie (ma: ${locked && locked.status})`);

  const withStock = { empireResourceStock: { drewno: 10 } };
  ok(buildIds(techs, withStock).includes('spichlerz'),
    'Spichlerz w buildableProduction z drewnem w magazynie');
  ok(catalogEntry('spichlerz', techs, withStock).status === 'ready',
    'Spichlerz eraBuildingCatalog status=\'ready\' z drewnem w magazynie państwa');

  const noTech = catalogEntry('spichlerz', [], withStock);
  ok(noTech && noTech.status === 'locked' && noTech.missingTech === 'Garncarstwo',
    'Spichlerz bez tech Garncarstwo: status=\'locked\', missingTech=\'Garncarstwo\'');
}

// ===========================================================================
// 2. Budynki epoki Kamienia — lista bez dostępu; katalog locked/ready wg magazynu.
// ===========================================================================
{
  const cases = [
    ['garncarnia', 'Garncarstwo', { drewno: 6 }],
    ['stolarnia', 'Obróbka drewna', { drewno: 5 }],
    ['kamieniarski', 'Murarstwo', { drewno: 6 }],
  ];
  for (const [id, tech, stock] of cases) {
    const techs = [tech];
    ok(buildIds(techs, {}).includes(id),
      `${id} w buildableProduction bez dostępu do surowca (kanon magazyn)`);
    ok(catalogEntry(id, techs, {}).status === 'locked',
      `${id}: eraBuildingCatalog locked bez magazynu`);
    ok(catalogEntry(id, techs, { empireResourceStock: stock }).status === 'ready',
      `${id}: eraBuildingCatalog ready z magazynem państwa`);
  }
}

// ===========================================================================
// 3. Budynki epoki Brązu: cegielnia, kuznia, mennica (Targowisko), odlewnia_brazu (Kopalnia).
// ===========================================================================
{
  const epoch2 = { epoch: 2 };

  {
    const techs = ['Garncarstwo'];
    ok(buildIds(techs, epoch2).includes('cegielnia'), 'cegielnia w liście bez dostępu Gliny');
    ok(catalogEntry('cegielnia', techs, epoch2).status === 'locked',
      'cegielnia: catalog locked bez magazynu');
    ok(catalogEntry('cegielnia', techs, Object.assign({ empireResourceStock: { drewno: 6, kamien: 6 } }, epoch2)).status === 'ready',
      'cegielnia: catalog ready z drewnem+kamieniem w magazynie');
  }

  {
    const techs = ['Brązownictwo'];
    ok(buildIds(techs, epoch2).includes('kuznia'), 'kuznia w liście bez dostępu Rudy');
    ok(catalogEntry('kuznia', techs, Object.assign({ empireResourceStock: { drewno: 6, kamien: 6 } }, epoch2)).status === 'ready',
      'kuznia: catalog ready z magazynem');
  }

  {
    const techs = ['Waluta'];
    ok(!buildIds(techs, epoch2).includes('mennica'), 'mennica NIEDOSTĘPNA bez Targowiska w mieście');
    const withTarg = Object.assign({ builtBuildingIds: ['targowisko'] }, epoch2);
    ok(buildIds(techs, withTarg).includes('mennica'),
      'mennica w liście z Targowiskiem (bez dostępu Złota — kanon magazyn)');
    ok(catalogEntry('mennica', techs, withTarg).status === 'locked',
      'mennica: catalog locked bez drewna/kamienia w magazynie');
    const full = Object.assign({
      builtBuildingIds: ['targowisko'],
      empireResourceStock: { drewno: 6, kamien: 8 },
    }, epoch2);
    ok(catalogEntry('mennica', techs, full).status === 'ready',
      'mennica: catalog ready z Targowiskiem + magazynem państwa (bez Złota)');
  }

  {
    const techs = ['Brązownictwo'];
    ok(!buildIds(techs, epoch2).includes('odlewnia_brazu'),
      'odlewnia_brazu NIEDOSTĘPNA bez Kopalni miedzi w imperium');
    const withMine = Object.assign(
      { placedImprovements: new Map([['1,0', 'kopalnia_miedzi']]), empireResourceStock: { drewno: 10, kamien: 10, ruda: 5 } },
      epoch2,
    );
    ok(buildIds(techs, withMine).includes('odlewnia_brazu'),
      'odlewnia_brazu DOSTĘPNA z Kopalnią miedzi + magazynem');
    ok(catalogEntry('odlewnia_brazu', techs, withMine).status === 'ready',
      'odlewnia_brazu: catalog ready z Kopalnią miedzi + magazynem');
  }
}

console.log(`\nspichlerz-widocznosc-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
