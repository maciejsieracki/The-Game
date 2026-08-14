'use strict';
/**
 * MAPA T-TECH-9 — droga brukowana: upgrade + ruch.
 * R-DROGI-RUCH-HANDEL-Q1 (Maciej 2026-08-14): ruch droga ÷3 (bez zmian), droga
 * brukowana ÷5 (było: koszt-2); Handel (plon heksa) droga +2/t (było +1),
 * droga brukowana +3/t (było +2).
 * R-DROGI-RUCH-HANDEL-PODLOGA-Q1=A (Maciej 2026-08-14): osobna, niższa podłoga
 * ROAD_BRUK_MIN_MOVE_COST=1/5 WYŁĄCZNIE dla bruku (naprawa noty N1 werdyktu FAIL
 * dla 92cd220b) — zwykła droga zostaje przy ROAD_MIN_MOVE_COST=1/3 bez zmian.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-road-movement-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-road-movement-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildImprovementQualifier,
  collectRoadKeys,
} from '../src/map/improvement-build';
export {
  applyRoadMovementModifier,
  ROAD_MOVE_SPEED_MULT,
  ROAD_BRUK_MOVE_SPEED_MULT,
  ROAD_MIN_MOVE_COST,
  ROAD_BRUK_MIN_MOVE_COST,
  hexHasRoad,
} from '../src/map/road-movement';
export { terrainMoveCost } from '../src/units/setup';
export { TerenBazowy, Ulepszenie } from '../src/types/hex';
export { applyImprovementBonus, applyImprovementBonuses } from '../src/game/terrain-improvements';
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
const UL = M.Ulepszenie;

function mkHex(q, r, teren, ulepszenie = UL.Brak) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka: 'brak',
    ulepszenie,
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
    rzeka: { obecna: false, krawedzie: [] },
  };
}

// R-DROGI-RUCH-HANDEL-Q1 (Maciej 2026-08-14): stale mnozniki, nie z JSON.
ok(M.ROAD_MOVE_SPEED_MULT === 3, 'ROAD_MOVE_SPEED_MULT = 3 (droga, bez zmian)');
ok(M.ROAD_BRUK_MOVE_SPEED_MULT === 5, 'ROAD_BRUK_MOVE_SPEED_MULT = 5 (droga brukowana, nowa mechanika)');
// R-DROGI-RUCH-HANDEL-PODLOGA-Q1=A (Maciej 2026-08-14): podlogi osobne per typ drogi.
ok(M.ROAD_MIN_MOVE_COST === 1 / 3, 'ROAD_MIN_MOVE_COST = 1/3 (zwykla droga, bez zmian)');
ok(M.ROAD_BRUK_MIN_MOVE_COST === 1 / 5, 'ROAD_BRUK_MIN_MOVE_COST = 1/5 (bruk, nowa osobna podloga)');

const plain = mkHex(0, 0, TB.Laka);
const road = mkHex(1, 0, TB.Laka, UL.Droga);
const cobble = mkHex(2, 0, TB.Laka, UL.DrogaBrukowana);
const hill = mkHex(3, 0, TB.Wzgorza, UL.DrogaBrukowana);

ok(M.applyRoadMovementModifier(1, plain) === 1, 'plain laka cost 1');
// (a) brak regresji na zwyklej drodze: koszt/3.
ok(M.applyRoadMovementModifier(1, road) === 1 / 3, 'droga cost /3 (bez regresji)');
// (b) NAPRAWA N1: bruk na koszcie bazowym 1 (Laka/Rownina/Pustynia/rzeka) daje teraz
// pelne 0.2 (1/5), nie 0.3333 -- przed R-DROGI-RUCH-HANDEL-PODLOGA-Q1 wspolna podloga
// 1/3 zjadala caly mnoznik x5 i dawala identyczny wynik co zwykla droga (zero zysku).
ok(M.applyRoadMovementModifier(1, cobble) === 0.2, 'bruk laka: max(1/5, 1/5) = 0.2 (bylo 1/3 przed podloga-fix)');
ok(Math.abs(M.applyRoadMovementModifier(1, cobble) - (1 / 3)) > 1e-9, 'bruk laka: NIE rowna sie juz zwyklej drodze (1/3)');
// (c) koszt bazowy 2 (Wzgorza lub plaski+Las): floor sie NIE aktywuje (0.4 > 0.2),
// wiec obnizenie podlogi niczego tu nie zmienia -- to swiadomie zaakceptowana
// konsekwencja decyzji A (patrz komentarz przy ROAD_BRUK_MIN_MOVE_COST), NIE regresja
// tej poprawki. Wciaz gorsze niz stara mechanika sprzed 92cd220b (max(1/3, koszt-2)=1/3).
ok(M.applyRoadMovementModifier(2, hill) === 0.4, 'bruk wzgorza: koszt/5 = 0.4 (floor 1/5 sie nie aktywuje, bez zmiany po podloga-fix)');
ok(Math.abs(M.applyRoadMovementModifier(2, hill) - (1 / 3)) > 1e-9, 'bruk wzgorza: nowy wynik != stary wynik sprzed 92cd220b (koszt-2)');
// (d) koszt bazowy 3 (Wzgorza + Las): floor sie nie aktywuje, wynik = 0.6, lepszy
// niz stara mechanika (max(1/3, 3-2)=1).
ok(M.applyRoadMovementModifier(3, hill) === 0.6, 'bruk (koszt bazowy 3, np. wzgorza+las): koszt/5 = 0.6 (stara mechanika dawala 1.0)');
// Case bez clampu, zeby jednoznacznie pokazac dzielenie a nie tylko efekt max():
ok(M.applyRoadMovementModifier(10, cobble) === 2, 'bruk: koszt=10 -> 10/5=2 (stara mechanika: 10-2=8, calkiem inna liczba)');
// (e) regresja kontrolna floora: gdyby ktos przywrocil wspolna podloge 1/3 dla bruku,
// ten test na koszcie 1 (0.2 oczekiwane) by natychmiast padl -- assercja wyzej to pokrywa.
ok(M.terrainMoveCost(cobble) === 0.2, 'terrainMoveCost bruk on laka (koszt bazowy 1, po podloga-fix)');
ok(M.terrainMoveCost(road) === 1 / 3, 'terrainMoveCost droga on laka');
ok(M.terrainMoveCost(plain) === 1, 'terrainMoveCost plain');

ok(M.hexHasRoad(road), 'hexHasRoad droga');
ok(M.hexHasRoad(cobble), 'hexHasRoad bruk');
ok(!M.hexHasRoad(plain), 'hexHasRoad plain false');

// (c) Handel (plon heksa): bonus.handel z JSON trafia do yld.handel przez applyImprovementBonus.
// R-DROGI-RUCH-HANDEL-Q1: droga 1->2/ture, droga brukowana 2->3/ture.
function mkYield() {
  return { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
}
const yldDroga = mkYield();
M.applyImprovementBonus(yldDroga, 'droga');
ok(yldDroga.handel === 2, 'Handel (plon heksa) droga = +2/ture (bylo +1)');

const yldBruk = mkYield();
M.applyImprovementBonus(yldBruk, 'droga_brukowana');
ok(yldBruk.handel === 3, 'Handel (plon heksa) droga_brukowana = +3/ture (bylo +2)');

const yldMulti = mkYield();
M.applyImprovementBonuses(yldMulti, ['droga_brukowana']);
ok(yldMulti.handel === 3, 'applyImprovementBonuses (wiele warstw) tez daje +3/ture dla bruku');

const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
const hexes = {
  '0,0': mkHex(0, 0, TB.Rownina, UL.Droga),
  '1,0': mkHex(1, 0, TB.Rownina),
  '2,0': mkHex(2, 0, TB.Rownina, UL.Droga),
};
const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };

const roadKeys = M.collectRoadKeys(map);
ok(roadKeys.has('0,0') && roadKeys.has('2,0'), 'collectRoadKeys includes droga hexes');

const qual = M.buildImprovementQualifier({
  map,
  cityNodes,
  territoryNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }],
  roadKeys,
  researchedTechs: new Set(['Drogi brukowane']),
});

ok(qual('droga_brukowana', 0, 0), 'upgrade bruk on hex with droga');
ok(!qual('droga_brukowana', 1, 0), 'no bruk without existing droga');
ok(qual('droga_brukowana', 2, 0), 'bruk upgrade on hex with droga ulepszenie');

hexes['0,0'].ulepszenie = UL.DrogaBrukowana;
ok(!M.buildImprovementQualifier({
  map, cityNodes,
  territoryNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }],
  roadKeys,
})('droga_brukowana', 0, 0),
  'no double bruk upgrade');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`map-road-movement-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
