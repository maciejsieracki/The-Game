'use strict';
/** MAPA P2 — kwalifikacja ulepszeń FOOD-HODOWLA (improvement-build.ts). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-improvement-qualify-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-improvement-qualify-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildImprovementQualifier,
  canAddFoodLayer,
  hasBlockingDepositForFarm,
  hexHasDepositReserve,
  depositAllowsPlayerImprovement,
  isTarasyCiv,
  isImprovementVisibleInBuildPanel,
  isFarmBaseTerrain,
  stripImprovementsWhenForestRemoved,
  getForestBuildBlockReason,
  isOwceBaseTerrain,
  isAnimalFarmBlockedOnForest,
  isLivestockImprovementBlockedOnForest,
  computeImprovementBuildImpact,
  improvementsReplacedByBuild,
  formatImprovementBuildImpactList,
} from '../src/map/improvement-build';
export {
  hexSuppressesDepositOverlay,
  improvementHidesDepositOnHex,
} from '../src/game/terrain-improvements';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const TB = M.TerenBazowy;
const NK = M.Nakladka;

function mkHex(q, r, teren, nakladka = NK.Brak, zloze, ulepszenia) {
  const h = {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    zloze,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
  if (ulepszenia) h.ulepszenia = ulepszenia;
  return h;
}

const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
const playerTerritoryNodes = [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }];
const hexes = {
  '0,0': mkHex(0, 0, TB.Rownina),
  '1,0': mkHex(1, 0, TB.Laka),
  '2,0': mkHex(2, 0, TB.Laka, NK.ZlozeBydla),
  '3,0': mkHex(3, 0, TB.Laka),
  '4,0': mkHex(4, 0, TB.Rownina, NK.Brak, 'sol'),
  '5,0': mkHex(5, 0, TB.Wybrzeze),
  '0,1': mkHex(0, 1, TB.Wzgorza),
  '1,1': mkHex(1, 1, TB.Wzgorza, NK.ZlozeOwiec),
  '2,1': mkHex(2, 1, TB.Gory, NK.Brak, 'miedz'),
  '1,2': mkHex(1, 2, TB.Gory, NK.Brak, 'zelazo'),
  '3,1': mkHex(3, 1, TB.Laka, NK.Las),
  '4,1': mkHex(4, 1, TB.Morze),
  '5,1': mkHex(5, 1, TB.Rownina, NK.ZlozeGliny),
  '6,0': mkHex(6, 0, TB.Pustynia),
  '7,0': mkHex(7, 0, TB.Rownina, NK.Brak, 'bydlo'),
};
hexes['0,2'] = mkHex(0, 2, TB.Rownina);
hexes['0,-1'] = mkHex(0, -1, TB.Wybrzeze);
hexes['0,2'].rzeka = { obecna: true, krawedzie: [0] };
hexes['6,2'] = mkHex(6, 2, TB.Pustynia);
hexes['6,2'].rzeka = { obecna: true, krawedzie: [0] };
hexes['0,0'].ulepszenia = ['farma', 'bydlo'];
hexes['8,0'] = mkHex(8, 0, TB.Laka);
hexes['8,0'].ulepszenia = ['farma'];
hexes['9,0'] = mkHex(9, 0, TB.Morze);
hexes['12,0'] = mkHex(12, 0, TB.Morze);
hexes['10,0'] = mkHex(10, 0, TB.Wzgorza, NK.Las);

const map = { hexes, riverPaths: [[{ q: 0, r: 2 }], [{ q: 6, r: 2 }]], startPositions: [{ q: 0, r: 0 }] };

function qual(opts = {}) {
  return M.buildImprovementQualifier({
    map,
    cityNodes,
    territoryNodes: opts.territoryNodes ?? playerTerritoryNodes,
    playerOwnerIdNum: 0,
    playerCivArchetype: opts.civ ?? 'inkowie',
    playerEra: opts.era ?? 1,
    placedImprovements: opts.placed,
  });
}

const qInka = qual({ civ: 'inkowie' });
const qRzym = qual({ civ: 'rzym' });
const qChiny = qual({ civ: 'chinczycy' });

ok(qInka('farma', 1, 0), 'farma on laka');
ok(qInka('farma', 3, 1), 'BUG-2026-07-21: farma on laka+las');
ok(qInka('farma', 10, 0), 'BUG-2026-07-21: farma on wzgorza+las');
ok(!qInka('farma', 0, 1), 'farma NOT on wzgorza without las');
ok(qInka('farma', 7, 0), 'WOLNE-WSPOL: farma on mineral zloze hex');
ok(!qInka('farma', 5, 0), 'farma NOT on wybrzeze');
ok(qRzym('farma', 2, 0), 'WOLNE-WSPOL: farma on zloze bydla nakladka');
ok(qInka('fort', 2, 0), 'WOLNE-WSPOL: fort on zloze hex');
ok(qInka('glinianka', 5, 1), 'REMIND-A: glinianka ON zloze gliny');
ok(!qInka('tartak', 5, 1), 'tartak NOT on rownina bez lasu (tylko Nakladka.Las)');
ok(qInka('tartak', 3, 1), 'tartak ON laka+las');
ok(!qInka('tartak', 1, 0), 'tartak NOT on plain laka bez lasu');
ok(qRzym('bydlo', 2, 0), 'ABC-18: bydlo buildable on zloze bydla (pierwsze pastwisko)');
ok(qRzym('bydlo', 1, 0), 'bydlo after empire unlock on plain');
ok(qRzym('owce', 1, 1), 'ABC-18: owce buildable on zloze owiec (pierwsze pastwisko)');
ok(!qRzym('owce', 1, 0), 'owce NOT on flat');
ok(qInka('tarasy', 0, 1), 'AC-M2: tarasy inkowie wzgorza');
ok(qChiny('tarasy', 0, 1), 'AC-M2: tarasy chinczycy wzgorza');
// C-TARASY-Q1 (Maciej 2026-07-26): qualifies() surowy (ten plik, gra/src/map/**) NIE sprawdza
// cywilizacji -- to zamierzone, gra/src/map/** zablokowana rownoleglym zleceniem gorzystosci.
// Bramka per-cywilizacja (tylko Chinczycy+Inkowie) jest OGOLNA (isImprovementAllowedForCiv,
// game/terrain-improvements.ts) i wpieta OSOBNO przez wolajacych spoza map/**: main.ts
// (refreshBuildApi) dla gracza, ai.ts (planCityImprovements) dla AI -- patrz
// tarasy-cywilizacje-test.cjs dla weryfikacji tej faktycznej bramki gracz+AI.
ok(qRzym('tarasy', 0, 1), 'surowy qualifies() ignoruje cywilizacje (teren OK) -- bramka jest wyzej');
ok(qInka('irygacja', 0, 2), 'irygacja river hex');
ok(qInka('irygacja', 6, 2), 'irygacja pustynia przy rzece');
ok(!qInka('bydlo', 6, 0), 'AC-M6: bydlo NOT pustynia');
ok(!qInka('owce', 6, 0), 'AC-M6: owce NOT pustynia');
ok(!qInka('lama', 6, 0), 'AC-M6: lama NOT pustynia');
ok(qInka('warzelnia_soli', 4, 0), 'warzelnia sol');
ok(qInka('kopalnia_miedzi', 2, 1), 'kopalnia_miedzi gory miedz');
ok(qInka('kopalnia_zelaza', 1, 2), 'kopalnia_zelaza gory zelazo');
ok(!qInka('kopalnia_zelaza', 2, 1), 'kopalnia_zelaza NOT on miedz');
ok(qInka('lodzie_rybackie', 0, -1), 'A-R7: lodzie wybrzeze IN territory');
const qA7small = M.buildImprovementQualifier({
  map,
  cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }],
  territoryNodes: [{ q: 0, r: 0, pop: 1, level: 1, ownerId: 0 }],
  playerOwnerIdNum: 0,
  playerCivArchetype: 'inkowie',
  playerEra: 1,
});
ok(qA7small('lodzie_rybackie', 0, -1), 'A-R7: lodzie IN territory (pop=1)');
ok(!qA7small('lodzie_rybackie', 9, 0), 'A-R7: lodzie morze OUTSIDE territory (pop=1)');

ok(M.canAddFoodLayer([], 'farma'), 'layer: empty + farma');
ok(M.canAddFoodLayer(['farma'], 'irygacja'), 'AC-M3: farma+irygacja');
ok(M.canAddFoodLayer(['farma'], 'bydlo'), 'AC-M4: farma+bydlo');
ok(!M.canAddFoodLayer(['farma', 'irygacja'], 'bydlo'), 'AC-M4: no farma+irygacja+bydlo');
ok(!M.canAddFoodLayer(['farma', 'bydlo'], 'irygacja'), 'AC-M4: no farma+bydlo+irygacja');
ok(!M.canAddFoodLayer(['owce'], 'farma'), 'AC-M5: owce solo blocks farma');
const placed = new Map([['2,0', ['bydlo']]]);
const qRzymUnlock = qual({ civ: 'rzym', placed });
ok(qRzymUnlock('bydlo', 8, 0), 'AC-M4: bydlo layer on hex with farma (with unlock)');
ok(!qRzym('irygacja', 0, 0), 'AC-M4: irygacja blocked when farma+bydlo');
ok(qRzymUnlock('bydlo', 1, 0), 'bydlo after empire unlock from pastwisko on zloze');

const qInkaE3 = qual({ civ: 'inkowie', era: 3, placed: new Map([['2,0', ['bydlo']]]) });
ok(qInkaE3('bydlo', 1, 0), 'inkowie ep3: bydlo on plain after unlock+era');

ok(M.isFarmBaseTerrain(TB.Laka, NK.Las), 'isFarmBaseTerrain laka+las');
ok(M.isFarmBaseTerrain(TB.Wzgorza, NK.Las), 'isFarmBaseTerrain wzgorza+las');
ok(!M.isFarmBaseTerrain(TB.Wzgorza, NK.Brak), 'isFarmBaseTerrain wzgorza bez lasu');

ok(!M.hasBlockingDepositForFarm(hexes['7,0']), 'hasBlockingDeposit zloze string — no block');
ok(M.hexHasDepositReserve(hexes['2,0']), 'hexHasDepositReserve nakladka bydlo');
ok(!M.hexHasDepositReserve(hexes['1,0']), 'hexHasDepositReserve plain laka');
ok(!M.depositAllowsPlayerImprovement('farma', hexes['4,0']), 'depositAllows NOT farma sol');
ok(M.depositAllowsPlayerImprovement('warzelnia_soli', hexes['4,0']), 'depositAllows warzelnia sol');
ok(!M.hasBlockingDepositForFarm(hexes['1,0']), 'no block plain laka');
ok(M.isTarasyCiv('chiny'), 'isTarasyCiv chiny');

ok(!M.isImprovementVisibleInBuildPanel('lama', 'grecy', 1), 'lama hidden in panel for grecy');
ok(!M.isImprovementVisibleInBuildPanel('lama', 'rzymianie', 1), 'lama hidden in panel for rzym');
ok(M.isImprovementVisibleInBuildPanel('lama', 'inkowie', 1), 'lama visible in panel for inkowie');
ok(!qRzym('lama', 0, 1), 'lama NOT buildable for non-inka on wzgorza');
ok(qInka('lama', 0, 1), 'lama buildable for inkowie on wzgorza');

hexes['4,0'] = mkHex(4, 0, TB.Laka, NK.Las);
hexes['2,1'] = mkHex(2, 1, TB.Laka, NK.Las);
const qOverlap = M.buildImprovementQualifier({
  map,
  cityNodes: [{ q: 0, r: 0, pop: 10, level: 1 }],
  territoryNodes: [
    { q: 0, r: 0, pop: 10, level: 1, ownerId: 0 },
    { q: 5, r: 0, pop: 10, level: 1, ownerId: 99 },
  ],
  playerOwnerIdNum: 0,
  playerCivArchetype: 'inkowie',
  playerEra: 1,
});
ok(!qOverlap('wyrab', 4, 0), 'wyrab NOT on Sparta-owned forest (territory overlap)');
ok(!qOverlap('tartak', 4, 0), 'tartak NOT on Sparta-owned forest (territory overlap)');
ok(qOverlap('wyrab', 2, 1), 'wyrab OK on player-owned forest');
ok(qOverlap('tartak', 2, 1), 'tartak OK on player-owned forest');

ok(M.stripImprovementsWhenForestRemoved(['farma', 'tartak', 'droga']).join(',') === 'farma,tartak,droga', 'tartak stays when forest removed (kanon)');

function forestHint(opts = {}) {
  return M.getForestBuildBlockReason({
    map: opts.map ?? map,
    cityNodes: opts.cityNodes ?? cityNodes,
    territoryNodes: opts.territoryNodes ?? playerTerritoryNodes,
    playerOwnerIdNum: opts.playerOwnerIdNum ?? 0,
    clearingHexKeys: opts.clearingHexKeys,
  }, opts.key ?? 'tartak');
}

const miniCity = [{ q: 0, r: 0, pop: 10, level: 1 }];
const miniTerritory = [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }];
function miniMap(hexes) {
  return { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
}

ok(forestHint({ cityNodes: [] })?.includes('załóż miasto'), 'forest hint: no city');

ok(forestHint({
  map: miniMap({ '0,0': mkHex(0, 0, TB.Rownina), '1,0': mkHex(1, 0, TB.Laka) }),
  cityNodes: miniCity,
  territoryNodes: miniTerritory,
  key: 'tartak',
})?.includes('terytorium nie ma lasu'),
  'forest hint: no las in player territory');

ok(forestHint({
  map: miniMap({ '0,0': mkHex(0, 0, TB.Rownina), '20,0': mkHex(20, 0, TB.Laka, NK.Las) }),
  cityNodes: miniCity,
  territoryNodes: miniTerritory,
  key: 'tartak',
})?.includes('poza twoim terytorium'),
  'forest hint: las visible but outside territory');

ok(forestHint({
  map: miniMap({ '0,0': mkHex(0, 0, TB.Rownina), '3,1': mkHex(3, 1, TB.Laka, NK.Las) }),
  cityNodes: miniCity,
  territoryNodes: miniTerritory,
  key: 'wyrab',
  clearingHexKeys: new Set(['3,1']),
})?.includes('w trakcie wycinki'),
  'forest hint: wyrab all forests clearing');

ok(forestHint({
  map: miniMap({ '0,0': mkHex(0, 0, TB.Rownina), '0,3': mkHex(0, 3, TB.Gory, NK.Las) }),
  cityNodes: miniCity,
  territoryNodes: miniTerritory,
  key: 'tartak',
})?.includes('górach'),
  'forest hint: tartak las on gory');

ok(forestHint({
  map: miniMap({ '0,0': mkHex(0, 0, TB.Rownina), '4,0': mkHex(4, 0, TB.Laka, NK.Las) }),
  cityNodes: miniCity,
  territoryNodes: [
    { q: 0, r: 0, pop: 10, level: 1, ownerId: 0 },
    { q: 4, r: 0, pop: 10, level: 1, ownerId: 99 },
  ],
  key: 'wyrab',
})?.includes('innej cywilizacji'),
  'forest hint: enemy territory overlap');

ok(M.isOwceBaseTerrain(TB.Wzgorza, NK.Brak), 'owce terrain: open hill');
ok(!M.isOwceBaseTerrain(TB.Wzgorza, NK.Las), 'owce terrain: hill+las blocked');
ok(M.isOwceBaseTerrain(TB.Wzgorza, NK.ZlozeOwiec), 'owce terrain: zloze owiec');
ok(!qRzym('owce', 10, 0), 'owce NOT on wzgorza+las (BUG owce/tartak)');
ok(!qRzym('bydlo', 2, 1), 'bydlo NOT on laka+las (hodowla zablokowana na lesie)');
ok(M.isLivestockImprovementBlockedOnForest('bydlo', NK.Las), 'livestock blocked on las: bydlo');
ok(!M.computeImprovementBuildImpact('bydlo', hexes['2,1'], []), 'impact null: bydlo on las');
ok(qInka('tartak', 2, 1), 'tartak OK on laka+las (ulepszenie leśne)');
ok(qInka('oboz_lowiecki', 2, 1), 'oboz lowiecki OK on laka+las');
const qOwceOpen = qual({ civ: 'rzym', placed: new Map([['1,1', ['owce']]]) });
ok(qOwceOpen('owce', 0, 1), 'owce on open wzgorza after unlock');
const placedTartak = new Map([['10,0', ['tartak']]]);
const qTartakReplace = qual({ civ: 'rzym', placed: placedTartak });
ok(qTartakReplace('oboz_lowiecki', 10, 0), 'oboz qualifies with tartak on same las hex');
const repObozTartak = M.improvementsReplacedByBuild('oboz_lowiecki', ['tartak']);
ok(repObozTartak.length === 0, 'oboz does NOT replace tartak (coexist)');
const impactObozTartak = M.computeImprovementBuildImpact('oboz_lowiecki', hexes['10,0'], ['tartak']);
ok(impactObozTartak && impactObozTartak.removedImprovements.length === 0, 'impact: oboz+tartak coexist');
const placedOboz = new Map([['10,0', ['oboz_lowiecki']]]);
const qObozThenTartak = qual({ civ: 'rzym', placed: placedOboz });
ok(qObozThenTartak('tartak', 10, 0), 'tartak qualifies when oboz already on hex');
const rep = M.improvementsReplacedByBuild('oboz_lowiecki', ['tartak']);
ok(rep.length === 0, 'impact: oboz replaces tartak — regresja usunieta');
ok(!M.computeImprovementBuildImpact('owce', hexes['10,0'], ['tartak']), 'impact null: owce on las+tartak');
const farmaIrr = M.computeImprovementBuildImpact('bydlo', hexes['0,0'], ['farma', 'irygacja']);
ok(farmaIrr === null, 'kanon: bydlo blocked on farma+irygacja (no replace)');

const clayHex = { terenBazowy: TB.Rownina, nakladka: NK.ZlozeGliny };
ok(!M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['farma'] }), 'BUG-FARMA-GLINA: farma NIE chowa gliny');
ok(!M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['irygacja'] }), 'BUG-FARMA-GLINA: irygacja NIE chowa gliny');
ok(!M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['droga'] }), 'BUG-FARMA-GLINA: droga NIE chowa gliny');
ok(!M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['fort'] }), 'BUG-FARMA-GLINA: fort NIE chowa gliny');
ok(!M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['tartak'] }), 'BUG-FARMA-GLINA: tartak NIE chowa gliny');
ok(M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['glinianka'] }), 'BUG-FARMA-GLINA: glinianka chowa gline');
ok(M.hexSuppressesDepositOverlay({ ...clayHex, ulepszenia: ['farma', 'glinianka'] }), 'glinianka match hides clay even with farma');
ok(M.improvementHidesDepositOnHex('glinianka', clayHex), 'improvementHidesDepositOnHex glinianka+glina');
ok(!M.improvementHidesDepositOnHex('farma', clayHex), 'improvementHidesDepositOnHex farma+glina false');
const oreHex = { terenBazowy: TB.Gory, nakladka: NK.Brak, zloze: 'miedz' };
ok(M.hexSuppressesDepositOverlay({ ...oreHex, ulepszenia: ['kopalnia_miedzi'] }), 'kopalnia_miedzi chowa miedz');
ok(!M.hexSuppressesDepositOverlay({ ...oreHex, ulepszenia: ['farma'] }), 'farma NIE chowa miedzi');
ok(!M.hexSuppressesDepositOverlay({ ...oreHex, ulepszenia: ['kamieniolom'] }), 'kamieniolom NIE chowa miedzi');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`map-improvement-qualify-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
