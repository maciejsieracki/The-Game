'use strict';
/**
 * food-hodowla-test.cjs — kanon żywność+hodowla (EKONOMIA P2)
 * Uruchom z gra/:  node tools/food-hodowla-test.cjs
 */
const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); } catch (e) { console.error('esbuild not found'); process.exit(1); }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.food-hodowla-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.food-hodowla-bundle.cjs');

const ENTRY_TS = `
import { TerenBazowy, Nakladka } from '../src/types/hex';
import { tileYield } from '../src/game/economy';
import { improvementBonusForKey } from '../src/game/terrain-improvements';
import {
  isLivestockAllowed,
  computeEmpireLivestockUnlocks,
  isLivestockUnlockedForPlacement,
} from '../src/game/livestock-unlock';
import { getResourceAccessForCity } from '../src/game/resource-access';
import { improvementKeysForHex } from '../src/game/terrain-improvements';
export {
  TerenBazowy, Nakladka,
  tileYield, improvementBonusForKey, improvementKeysForHex,
  isLivestockAllowed, computeEmpireLivestockUnlocks, isLivestockUnlockedForPlacement,
  getResourceAccessForCity,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[food-hodowla-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + ' (' + a + ' === ' + b + ')'); }

console.log('\nAC-E1: bonusy JSON (przez improvementBonusForKey)');
{
  const f = M.improvementBonusForKey('farma');
  eq(f.zywnosc, 3, 'farma +3 zywnosc');
  eq(M.improvementBonusForKey('irygacja').zywnosc, 5, 'irygacja +5');
  eq(M.improvementBonusForKey('tarasy').zywnosc, 3, 'tarasy +3');
  eq(M.improvementBonusForKey('lodzie_rybackie').praca, 3, 'lodzie +3 praca');
  eq(M.improvementBonusForKey('bydlo').zywnosc, 2, 'bydlo +2 zywnosc');
  eq(M.improvementBonusForKey('bydlo').praca, 3, 'bydlo +3 praca');
  eq(M.improvementBonusForKey('owce').zywnosc, 1, 'owce +1');
  eq(M.improvementBonusForKey('lama').praca, 3, 'lama +3 praca');
  ok(!M.improvementBonusForKey('pastwisko').zywnosc, 'pastwisko usuniety z JSON');
}

console.log('\nAC-E2: tileYield suma warstw (delta ulepszen)');
{
  const baseTile = {
    terenBazowy: M.TerenBazowy.Rownina,
    nakladka: M.Nakladka.Brak,
    maRzeke: false,
  };
  const base = M.tileYield(baseTile);
  const layered = M.tileYield({ ...baseTile, ulepszeniaKeys: ['farma', 'irygacja'] });
  eq(layered.zywnosc - base.zywnosc, 8, 'farma+irygacja delta = +8 zywnosci');
}
{
  const baseTile = {
    terenBazowy: M.TerenBazowy.Laka,
    nakladka: M.Nakladka.Brak,
    maRzeke: false,
  };
  const base = M.tileYield(baseTile);
  const layered = M.tileYield({ ...baseTile, ulepszeniaKeys: ['farma', 'bydlo'] });
  eq(layered.zywnosc - base.zywnosc, 5, 'farma+bydlo delta = +5 zywnosci');
  eq(layered.praca - base.praca, 3, 'farma+bydlo delta = +3 praca');
}

console.log('\nAC-E3: unlock hodowli po zlozu');
{
  const map = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: M.TerenBazowy.Rownina,
        nakladka: M.Nakladka.ZlozeBydla,
        ulepszenie: 'bydlo',
        wlasciciel: 'p1',
        wioska: { istnieje: false, ludnosc: 0 },
        rzeka: { obecna: false, krawedzie: [] },
        widocznosc: {},
      },
      '1,0': {
        coords: { q: 1, r: 0 },
        terenBazowy: M.TerenBazowy.Laka,
        nakladka: M.Nakladka.Brak,
        ulepszenie: 'brak',
        wlasciciel: 'p1',
        wioska: { istnieje: false, ludnosc: 0 },
        rzeka: { obecna: false, krawedzie: [] },
        widocznosc: {},
      },
    },
  };
  const placed = new Map([['0,0', 'bydlo']]);
  const unlocks = M.computeEmpireLivestockUnlocks(placed, map, 'p1');
  ok(unlocks.has('bydlo'), 'bydlo odblokowane po pastwisku na zlozu');
  ok(
    M.isLivestockUnlockedForPlacement('bydlo', map.hexes['1,0'], unlocks),
    'bydlo na polu bez zloza po unlock',
  );
  const access = M.getResourceAccessForCity(
    { id: 'c1', q: 1, r: 0, population: 5 },
    map,
    placed,
    99,
    { ownerId: 'p1', empireLivestockUnlocks: unlocks },
  );
  ok(access.includes('Bydło (krowa/wół)'), 'panel surowce: Bydlo po unlock imperium');
}

console.log('\nAC-E4: Inkowie era<3');
{
  ok(!M.isLivestockAllowed('inkowie', 'bydlo', 2), 'Inkowie ep2: bydlo false');
  ok(!M.isLivestockAllowed('inkowie', 'owce', 1), 'Inkowie ep1: owce false');
  ok(!M.isLivestockAllowed('inkowie', 'kon', 2), 'Inkowie ep2: kon false');
  ok(M.isLivestockAllowed('inkowie', 'lama', 1), 'Inkowie ep1: lama true');
  ok(M.isLivestockAllowed('inkowie', 'bydlo', 3), 'Inkowie ep3: bydlo true');
  ok(M.isLivestockAllowed('rzymianie', 'bydlo', 1), 'Rzym ep1: bydlo true');
}

console.log('\nAC-E5: zloze bez pastwiska — brak implicit plonow (ABC-18)');
{
  const hexDeposit = {
    ulepszenie: 'brak',
    nakladka: M.Nakladka.ZlozeBydla,
  };
  const keys = M.improvementKeysForHex(hexDeposit);
  ok(!keys.includes('bydlo'), 'ZlozeBydla bez budowy -> brak warstwy bydlo');
  const plain = M.tileYield({
    terenBazowy: M.TerenBazowy.Laka,
    nakladka: M.Nakladka.ZlozeBydla,
    maRzeke: false,
    ulepszeniaKeys: keys,
  });
  const basePlain = M.tileYield({
    terenBazowy: M.TerenBazowy.Laka,
    nakladka: M.Nakladka.Brak,
    maRzeke: false,
  });
  eq(plain.zywnosc, basePlain.zywnosc, 'zloze bez pastwiska = brak bonusu zywnosci');

  const mapOwned = {
    hexes: {
      '0,0': {
        coords: { q: 0, r: 0 },
        terenBazowy: M.TerenBazowy.Laka,
        nakladka: M.Nakladka.ZlozeBydla,
        ulepszenie: 'brak',
        wlasciciel: 'p1',
        wioska: { istnieje: false, ludnosc: 0 },
        rzeka: { obecna: false, krawedzie: [] },
        widocznosc: {},
      },
    },
  };
  const unlocksOwned = M.computeEmpireLivestockUnlocks(new Map(), mapOwned, 'p1');
  ok(!unlocksOwned.has('bydlo'), 'terytorium ze zlozem BEZ pastwiska = brak unlock');
  ok(
    unlocksOwned.has('bydlo') === false,
    'ABC-18: wymaga postawienia bydlo na zlozu',
  );
  const placedPasture = new Map([['0,0', 'bydlo']]);
  const unlocksBuilt = M.computeEmpireLivestockUnlocks(placedPasture, mapOwned, 'p1');
  ok(unlocksBuilt.has('bydlo'), 'pastwisko na zlozu = unlock bydlo');
}

console.log('\n--- food-hodowla-test: ' + passed + ' OK, ' + failed + ' FAIL ---');
process.exit(failed > 0 ? 1 : 0);
