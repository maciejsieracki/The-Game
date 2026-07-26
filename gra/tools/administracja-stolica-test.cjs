'use strict';
/**
 * administracja-stolica-test.cjs — ADMIN-STOLICA (decyzja Macieja 2026-07-25):
 * Pałac I/II/III wyłącznie w stolicy; Dom Starszyzny → Dwór Zarządcy → Pretorium
 * wyłącznie poza stolicą (miasta regionalne); Trybunał i Sąd wszędzie; nowe wartości
 * Prawa (prawo_dom_starszyzny/prawo_dwor_zarzadcy/prawo_trybunal); parytet AI.
 * Run: cd gra && node tools/administracja-stolica-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.administracja-stolica-entry.ts');
const BUNDLE = path.resolve(__dirname, '.administracja-stolica-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  availableProduction, eraBuildingCatalog, applyCompletedBuildingIds,
} from '../src/game/production';
export { computeLawBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[administracja-stolica-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');
const buildings = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'buildings.json'), 'utf8'));
const prodData = { buildings, units: [] };
const city = { id: 'c1', ownerId: 0, name: 'X', q: 0, r: 0, population: 3 };

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

console.log('\n[administracja-stolica-test]\n');

function idsOf(items) { return items.map(i => i.id); }

// ---------------------------------------------------------------------------
// 1. Pałac I/II/III — wyłącznie w stolicy
// ---------------------------------------------------------------------------
{
  const capital = M.availableProduction(city, prodData, [], { epoch: 1, builtBuildingIds: [], isCapital: true });
  ok(idsOf(capital).includes('palac'), 'Pałac I dostępny w stolicy (epoka 1)');
  const region = M.availableProduction(city, prodData, [], { epoch: 1, builtBuildingIds: [], isCapital: false });
  ok(!idsOf(region).includes('palac'), 'Pałac I NIEdostępny w mieście regionalnym');

  const capitalII = M.availableProduction(city, prodData, [], { epoch: 2, builtBuildingIds: ['palac'], isCapital: true });
  ok(idsOf(capitalII).includes('palac_ii'), 'Pałac II dostępny w stolicy (po Pałacu I)');
  const regionII = M.availableProduction(city, prodData, [], { epoch: 2, builtBuildingIds: ['palac'], isCapital: false });
  ok(!idsOf(regionII).includes('palac_ii'), 'Pałac II NIEdostępny w mieście regionalnym');

  const capitalIII = M.availableProduction(city, prodData, [], { epoch: 3, builtBuildingIds: ['palac', 'palac_ii'], isCapital: true });
  ok(idsOf(capitalIII).includes('palac_iii'), 'Pałac III dostępny w stolicy (po Pałacu II)');
  const regionIII = M.availableProduction(city, prodData, [], { epoch: 3, builtBuildingIds: ['palac', 'palac_ii'], isCapital: false });
  ok(!idsOf(regionIII).includes('palac_iii'), 'Pałac III NIEdostępny w mieście regionalnym');
}

// ---------------------------------------------------------------------------
// 2. Dom Starszyzny / Dwór Zarządcy / Pretorium — wyłącznie poza stolicą
// ---------------------------------------------------------------------------
{
  const region = M.availableProduction(city, prodData, [], { epoch: 1, builtBuildingIds: [], isCapital: false });
  ok(idsOf(region).includes('dom_starszyzny'), 'Dom Starszyzny dostępny w mieście regionalnym (epoka 1)');
  const capital = M.availableProduction(city, prodData, [], { epoch: 1, builtBuildingIds: [], isCapital: true });
  ok(!idsOf(capital).includes('dom_starszyzny'), 'Dom Starszyzny NIEdostępny w stolicy');

  const regionDZ = M.availableProduction(city, prodData, ['Kodeks'], { epoch: 2, builtBuildingIds: ['dom_starszyzny'], isCapital: false });
  ok(idsOf(regionDZ).includes('dwor_zarzadcy'), 'Dwór Zarządcy dostępny w mieście regionalnym (po Domu Starszyzny)');
  const capitalDZ = M.availableProduction(city, prodData, ['Kodeks'], { epoch: 2, builtBuildingIds: ['dom_starszyzny'], isCapital: true });
  ok(!idsOf(capitalDZ).includes('dwor_zarzadcy'), 'Dwór Zarządcy NIEdostępny w stolicy');

  const regionPr = M.availableProduction(city, prodData, ['Prawo'], { epoch: 3, builtBuildingIds: ['dwor_zarzadcy'], isCapital: false });
  ok(idsOf(regionPr).includes('pretorium'), 'Pretorium dostępne w mieście regionalnym (po Dworze Zarządcy)');
  const capitalPr = M.availableProduction(city, prodData, ['Prawo'], { epoch: 3, builtBuildingIds: ['dwor_zarzadcy'], isCapital: true });
  ok(!idsOf(capitalPr).includes('pretorium'), 'Pretorium NIEdostępne w stolicy');
}

// ---------------------------------------------------------------------------
// 3. Trybunał i Sąd — dostępne w obu (stolica i region)
// ---------------------------------------------------------------------------
{
  const capitalTr = M.availableProduction(city, prodData, ['Kodeks'], { epoch: 2, builtBuildingIds: [], isCapital: true });
  ok(idsOf(capitalTr).includes('trybunal'), 'Trybunał dostępny w stolicy');
  const regionTr = M.availableProduction(city, prodData, ['Kodeks'], { epoch: 2, builtBuildingIds: [], isCapital: false });
  ok(idsOf(regionTr).includes('trybunal'), 'Trybunał dostępny w regionie');

  const capitalSad = M.availableProduction(city, prodData, ['Prawo'], { epoch: 3, builtBuildingIds: [], isCapital: true });
  ok(idsOf(capitalSad).includes('sad'), 'Sąd dostępny w stolicy');
  const regionSad = M.availableProduction(city, prodData, ['Prawo'], { epoch: 3, builtBuildingIds: [], isCapital: false });
  ok(idsOf(regionSad).includes('sad'), 'Sąd dostępny w regionie');
}

// ---------------------------------------------------------------------------
// 4. Łańcuch awansu: Dom Starszyzny → Dwór Zarządcy (zastąpienie, nie dokładanie)
// ---------------------------------------------------------------------------
{
  const beforeUpgrade = M.availableProduction(city, prodData, ['Kodeks'], {
    epoch: 2, builtBuildingIds: ['dom_starszyzny'], isCapital: false,
  });
  ok(idsOf(beforeUpgrade).includes('dwor_zarzadcy'), 'Miasto z Domem Starszyzny w Brązie widzi awans na Dwór Zarządcy');
  ok(!idsOf(beforeUpgrade).includes('dom_starszyzny'), 'Dom Starszyzny znika z listy produkcji (już wybudowany)');

  const afterUpgrade = M.applyCompletedBuildingIds(['dom_starszyzny'], 'dwor_zarzadcy', buildings);
  ok(afterUpgrade.includes('dwor_zarzadcy'), 'Po awansie builtIds zawiera dwor_zarzadcy');
  ok(!afterUpgrade.includes('dom_starszyzny'), 'Po awansie builtIds NIE zawiera już dom_starszyzny (zastąpienie, nie dokładanie)');

  // Dalszy awans: Dwór Zarządcy -> Pretorium, ten sam mechanizm.
  const afterPretorium = M.applyCompletedBuildingIds(afterUpgrade, 'pretorium', buildings);
  ok(afterPretorium.includes('pretorium') && !afterPretorium.includes('dwor_zarzadcy'),
    'Awans Dwór Zarządcy -> Pretorium zastępuje poprzednika');
}

// ---------------------------------------------------------------------------
// 5. Prawo — wartości z tabeli (normalny), + easy/hard
// ---------------------------------------------------------------------------
{
  const normal = (flags) => M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: 'normal', ...flags }, society);

  eq(normal({ hasDomStarszyzny: true }).lines.find(l => l.id === 'dom_starszyzny')?.value, 28, 'Dom Starszyzny (normal) -> 28');
  eq(normal({ hasDworZarzadcy: true }).lines.find(l => l.id === 'dwor_zarzadcy')?.value, 33, 'Dwór Zarządcy (normal) -> 33');
  eq(normal({ hasTrybunal: true }).lines.find(l => l.id === 'trybunal')?.value, 17, 'Trybunał (normal) -> 17');
  eq(normal({ hasPretorium: true }).lines.find(l => l.id === 'pretorium')?.value, 38, 'Pretorium (normal) -> 38');
  eq(normal({ hasSad: true }).lines.find(l => l.id === 'sad')?.value, 19, 'Sąd (normal) -> 19');

  const table = {
    dom_starszyzny: { easy: 36, normal: 28, hard: 22, flag: 'hasDomStarszyzny' },
    dwor_zarzadcy:  { easy: 43, normal: 33, hard: 26, flag: 'hasDworZarzadcy' },
    trybunal:       { easy: 22, normal: 17, hard: 13, flag: 'hasTrybunal' },
  };
  for (const [id, row] of Object.entries(table)) {
    for (const diff of ['easy', 'normal', 'hard']) {
      const res = M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: diff, [row.flag]: true }, society);
      eq(res.lines.find(l => l.id === id)?.value, row[diff], `${id} (${diff}) -> ${row[diff]}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Sumy: miasto regionalne w Żelazie (Pretorium+Trybunał+Sąd) -> 74 pkt;
//    stolica w Żelazie (Pałac III+Sąd) -> 74 pkt.
// ---------------------------------------------------------------------------
{
  const region = M.computeLawBreakdown({
    garnizonCount: 0, era: 3, difficulty: 'normal',
    hasPretorium: true, hasTrybunal: true, hasSad: true,
  }, society);
  eq(region.netto, 74, 'Miasto regionalne (Żelazo): Pretorium+Trybunał+Sąd = 74 pkt Prawa');

  const capital = M.computeLawBreakdown({
    garnizonCount: 0, era: 3, difficulty: 'normal',
    palacTier: 3, hasSad: true,
  }, society);
  eq(capital.netto, 74, 'Stolica (Żelazo): Pałac III+Sąd = 74 pkt Prawa');
}

// ---------------------------------------------------------------------------
// 7. Parytet AI: identyczny wynik dla dwóch różnych ownerId
// ---------------------------------------------------------------------------
{
  // 7a. Prawo — computeLawBreakdown nie czyta ownerId z inputu w ogóle (nie ma pola).
  const inputBase = {
    garnizonCount: 2, era: 3, difficulty: 'normal',
    hasDomStarszyzny: false, hasDworZarzadcy: true, hasTrybunal: true, hasSad: true,
  };
  const lawPlayer = M.computeLawBreakdown(inputBase, society);
  const lawAi = M.computeLawBreakdown(inputBase, society);
  eq(JSON.stringify(lawPlayer), JSON.stringify(lawAi), 'Parytet AI (Prawo): wynik identyczny, brak gałęzi po ownerId');

  // 7b. Dostępność produkcji — ten sam ctx (isCapital jednoznacznie wyliczony z
  // capitalCityIdForOwner(ownerId), patrz main.ts/cityPanel.ts), inny ownerId w mieście.
  const cityPlayer = { ...city, ownerId: 0 };
  const cityAi = { ...city, ownerId: 3 };
  const itemsPlayer = M.availableProduction(cityPlayer, prodData, ['Prawo'], {
    epoch: 3, builtBuildingIds: ['dwor_zarzadcy'], isCapital: false, ownerId: 0,
  });
  const itemsAi = M.availableProduction(cityAi, prodData, ['Prawo'], {
    epoch: 3, builtBuildingIds: ['dwor_zarzadcy'], isCapital: false, ownerId: 3,
  });
  eq(idsOf(itemsPlayer).sort().join(','), idsOf(itemsAi).sort().join(','),
    'Parytet AI (produkcja): Pretorium dostępne w regionie identycznie dla gracza i AI');
  ok(idsOf(itemsAi).includes('pretorium'), 'AI też dostaje Pretorium w mieście regionalnym (nie tylko gracz)');

  // AI NIE może dostać Pałaca w mieście regionalnym ani Pretorium w stolicy.
  const aiRegionPalac = M.availableProduction(cityAi, prodData, [], {
    epoch: 1, builtBuildingIds: [], isCapital: false, ownerId: 3,
  });
  ok(!idsOf(aiRegionPalac).includes('palac'), 'AI NIE dostaje Pałacu w mieście regionalnym');
  const aiCapitalPretorium = M.availableProduction(cityAi, prodData, ['Prawo'], {
    epoch: 3, builtBuildingIds: ['dwor_zarzadcy'], isCapital: true, ownerId: 3,
  });
  ok(!idsOf(aiCapitalPretorium).includes('pretorium'), 'AI NIE dostaje Pretorium w stolicy');
}

// ---------------------------------------------------------------------------
// 8. Komunikat dla gracza — eraBuildingCatalog oznacza budynek jako 'locked' z
//    powodem lokalizacji (locationBlocked), niezależnie od bramki technologii.
// ---------------------------------------------------------------------------
{
  const catRegion = M.eraBuildingCatalog(prodData, [], { epoch: 1, builtBuildingIds: [], isCapital: false });
  const palacEntry = catRegion.find(e => e.id === 'palac');
  ok(palacEntry && palacEntry.status === 'locked' && palacEntry.locationBlocked === 'stolica',
    'Pałac w katalogu miasta regionalnego: locked, locationBlocked=stolica');

  const catCapital = M.eraBuildingCatalog(prodData, [], { epoch: 1, builtBuildingIds: [], isCapital: true });
  const domEntry = catCapital.find(e => e.id === 'dom_starszyzny');
  ok(domEntry && domEntry.status === 'locked' && domEntry.locationBlocked === 'region',
    'Dom Starszyzny w katalogu stolicy: locked, locationBlocked=region');

  const sadEntry = M.eraBuildingCatalog(prodData, ['Prawo'], { epoch: 3, builtBuildingIds: [], isCapital: true })
    .find(e => e.id === 'sad');
  ok(sadEntry && sadEntry.status === 'ready' && !sadEntry.locationBlocked, 'Sąd w stolicy: ready, brak blokady lokalizacji');
}

// ---------------------------------------------------------------------------
// 9. Unikalność w mieście: nowe budynki NIE są `wielokrotny`
// ---------------------------------------------------------------------------
{
  for (const id of ['dom_starszyzny', 'dwor_zarzadcy', 'pretorium']) {
    const def = buildings.find(b => b.id === id);
    ok(def && !def.wielokrotny, `${id}: unikalny w mieście (wielokrotny nieustawione/false)`);
  }
}

console.log('\n[administracja-stolica-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
