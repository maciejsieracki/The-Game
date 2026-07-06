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
} from '../src/map/improvement-build';
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

const map = { hexes, riverPaths: [[{ q: 0, r: 2 }], [{ q: 6, r: 2 }]], startPositions: [{ q: 0, r: 0 }] };

function qual(opts = {}) {
  return M.buildImprovementQualifier({
    map,
    cityNodes,
    playerCivArchetype: opts.civ ?? 'inkowie',
    playerEra: opts.era ?? 1,
    placedImprovements: opts.placed,
  });
}

const qInka = qual({ civ: 'inkowie' });
const qRzym = qual({ civ: 'rzym' });
const qChiny = qual({ civ: 'chinczycy' });

ok(qInka('farma', 1, 0), 'farma on laka');
ok(!qInka('farma', 7, 0), 'AC-M1: farma NOT on mineral zloze hex');
ok(!qInka('farma', 5, 0), 'farma NOT on wybrzeze');
ok(!qInka('irygacja', 7, 0), 'AC-M1: irygacja NOT on mineral zloze');
ok(!qRzym('farma', 2, 0), 'REMIND-A: farma NOT on zloze bydla nakladka');
ok(!qInka('fort', 2, 0), 'REMIND-A: fort NOT on zloze hex');
ok(qInka('glinianka', 5, 1), 'REMIND-A: glinianka ON zloze gliny');
ok(!qInka('tartak', 5, 1), 'REMIND-A: tartak NOT on zloze gliny');
ok(qRzym('bydlo', 2, 0), 'ABC-18: bydlo buildable on zloze bydla (pierwsze pastwisko)');
ok(!qRzym('bydlo', 1, 0), 'bydlo without unlock/deposit');
ok(qRzym('owce', 1, 1), 'ABC-18: owce buildable on zloze owiec (pierwsze pastwisko)');
ok(!qRzym('owce', 1, 0), 'owce NOT on flat');
ok(qInka('tarasy', 0, 1), 'AC-M2: tarasy inkowie wzgorza');
ok(qChiny('tarasy', 0, 1), 'AC-M2: tarasy chinczycy wzgorza');
ok(qRzym('tarasy', 0, 1), 'T-TECH-4: tarasy rzym wzgorza po Rolnictwie');
ok(qInka('irygacja', 0, 2), 'irygacja river hex');
ok(qInka('irygacja', 6, 2), 'irygacja pustynia przy rzece');
ok(!qInka('bydlo', 6, 0), 'AC-M6: bydlo NOT pustynia');
ok(!qInka('owce', 6, 0), 'AC-M6: owce NOT pustynia');
ok(!qInka('lama', 6, 0), 'AC-M6: lama NOT pustynia');
ok(qInka('warzelnia_soli', 4, 0), 'warzelnia sol');
ok(qInka('kopalnia', 2, 1), 'kopalnia gory miedz');
ok(qInka('lodzie_rybackie', 0, -1), 'A-R7: lodzie wybrzeze IN territory');
const qA7small = M.buildImprovementQualifier({
  map,
  cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }],
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

ok(M.hasBlockingDepositForFarm(hexes['7,0']), 'hasBlockingDeposit zloze string');
ok(M.hexHasDepositReserve(hexes['2,0']), 'hexHasDepositReserve nakladka bydlo');
ok(!M.hexHasDepositReserve(hexes['1,0']), 'hexHasDepositReserve plain laka');
ok(!M.depositAllowsPlayerImprovement('farma', hexes['4,0']), 'depositAllows NOT farma sol');
ok(M.depositAllowsPlayerImprovement('warzelnia_soli', hexes['4,0']), 'depositAllows warzelnia sol');
ok(!M.hasBlockingDepositForFarm(hexes['1,0']), 'no block plain laka');
ok(M.isTarasyCiv('chiny'), 'isTarasyCiv chiny');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`map-improvement-qualify-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
