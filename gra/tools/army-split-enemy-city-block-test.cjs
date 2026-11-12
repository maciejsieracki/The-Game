'use strict';

// R-WEB-ARMY-SPLIT-ENEMY-CITY-BLOCK-Q1: cel rozdzielenia armii (findSplitDestHexes)
// nie może być obcym miastem (także pustym, bez obrońców) ani heksem zajętym przez
// obcą jednostkę. Test bundluje realny kod src/game/armyMerge.ts (esbuild), więc
// mutacja helpera splitTargetPassable (usunięcie blokady miasta) czerwieni asercje.

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.army-split-enemy-city-block-entry.ts');
const BUNDLE = path.join(__dirname, '.army-split-enemy-city-block-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { findSplitDestHexes, splitTargetPassable } from '../src/game/armyMerge';
export { canUnitOccupyCityHex } from '../src/game/city-hex-movement';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const { findSplitDestHexes, splitTargetPassable, canUnitOccupyCityHex } = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(condition, message) {
  if (condition) {
    pass++;
    console.log('  PASS:', message);
  } else {
    fail++;
    console.error('  FAIL:', message);
  }
}

const ME = 0;
const ENEMY = 1;
const allPassable = () => true;

function unit(id, ownerId, q, r, inGarnizon = false) {
  return { id, ownerId, q, r, inGarnizon, typeId: 'Wojownik', ruch: 2, ruchLeft: 2 };
}
function city(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: id };
}

const has = (list, q, r) => list.some(d => d.q === q && d.r === r);

// Scenariusz: własna armia (2 jednostki) na (5,5) — pod miastem przeciwnika na (6,5).
const armyQ = 5;
const armyR = 5;
const enemyCityQ = 6;
const enemyCityR = 5;
const cities = [city('wrogie', ENEMY, enemyCityQ, enemyCityR)];
const baseUnits = [unit('a1', ME, armyQ, armyR), unit('a2', ME, armyQ, armyR)];

console.log('Scenariusz A: pusty wrogi heks miasta (bez obrońców) przy armii');
{
  const raw = findSplitDestHexes(baseUnits, armyQ, armyR, allPassable, false);
  assert(has(raw, enemyCityQ, enemyCityR), 'precondition: surowa przejezdność dopuszcza wrogie miasto (błąd z raportu)');
  const guarded = findSplitDestHexes(
    baseUnits, armyQ, armyR,
    splitTargetPassable(allPassable, ME, cities), false,
  );
  assert(!has(guarded, enemyCityQ, enemyCityR), 'wrogie miasto NIE jest celem rozdzielenia');
  assert(guarded.length > 0 && guarded.length === raw.length - 1,
    'pozostałe sąsiednie wolne heksy nadal są celami (blokada dotyczy tylko wrogiego miasta)');
}

console.log('Scenariusz B: wrogie miasto z garnizonem (jednostka inGarnizon)');
{
  const units = [...baseUnits, unit('obrona', ENEMY, enemyCityQ, enemyCityR, true)];
  const guarded = findSplitDestHexes(
    units, armyQ, armyR,
    splitTargetPassable(allPassable, ME, cities), false,
  );
  assert(!has(guarded, enemyCityQ, enemyCityR), 'wrogie miasto z garnizonem NIE jest celem');
}

console.log('Scenariusz C: heks zajęty przez obcą jednostkę (pole) NIE jest celem');
{
  const foreignQ = armyQ - 1;
  const foreignR = armyR;
  const units = [...baseUnits, unit('wrog', ENEMY, foreignQ, foreignR)];
  const guarded = findSplitDestHexes(
    units, armyQ, armyR,
    splitTargetPassable(allPassable, ME, cities), false,
  );
  assert(!has(guarded, foreignQ, foreignR), 'heks z obcą jednostką polową NIE jest celem');
}

console.log('Scenariusz D: własne miasto zachowuje dotychczasowe zachowanie');
{
  const ownCities = [city('moje', ME, enemyCityQ, enemyCityR)];
  const dests = findSplitDestHexes(
    baseUnits, armyQ, armyR,
    splitTargetPassable(allPassable, ME, ownCities), false,
  );
  assert(has(dests, enemyCityQ, enemyCityR), 'własne miasto (ten sam właściciel) pozostaje celem');
  assert(canUnitOccupyCityHex(ME, enemyCityQ, enemyCityR, ownCities), 'canUnitOccupyCityHex: własne miasto dozwolone');
}

console.log('Scenariusz E: opcja „W mieście (ten heks)" przy własnym mieście');
{
  const ownCities = [city('moje', ME, armyQ, armyR)];
  const dests = findSplitDestHexes(
    baseUnits, armyQ, armyR,
    splitTargetPassable(allPassable, ME, ownCities), true,
  );
  assert(has(dests, armyQ, armyR), 'zostaje w mieście (własny heks) nadal dostępne');
}

console.log('Scenariusz F: wrogie miasto na heksie origin nie zmienia blokady celu');
{
  const dests = findSplitDestHexes(
    baseUnits, armyQ, armyR,
    splitTargetPassable(allPassable, ME, [city('wrogie-origin', ENEMY, armyQ, armyR)]), false,
  );
  // Origin nie jest celem bez allowSameHex; sąsiedzi są wolni — żaden nie jest wrogim miastem.
  assert(!has(dests, armyQ, armyR), 'origin bez allowSameHex nie jest dodany jako cel');
}

console.log('Scenariusz G: wpięcie w main.ts (3 wywołania findSplitDestHexes + guard onSplit + etykieta)');
{
  // Test źródłowy: mutacja wpięcia (cofnięcie splitTargetPassable na isHexPassableForUnit
  // w którymkolwiek z 3 wywołań, usunięcie guardu onSplit lub etykiety) musi czerwienić test.
  const mainSrc = fs.readFileSync(path.join(ROOT, 'src', 'main.ts'), 'utf8');
  const callRe = /findSplitDestHexes\(\s*units,\s*[\w.]+,\s*[\w.]+,\s*(\w+)\(/g;
  const predicates = [];
  let m;
  while ((m = callRe.exec(mainSrc)) !== null) predicates.push(m[1]);
  assert(predicates.length === 3, `main.ts ma 3 wywołania findSplitDestHexes (znaleziono ${predicates.length})`);
  assert(predicates.every(p => p === 'splitTargetPassable'),
    'każde wywołanie findSplitDestHexes w main.ts używa splitTargetPassable (nie surowego isHexPassableForUnit)');
  const wiredRe = /splitTargetPassable\(isHexPassableForUnit,\s*(active|u)\.ownerId,\s*cities\)/g;
  const wired = (mainSrc.match(wiredRe) || []).length;
  assert(wired === 3, `splitTargetPassable(isHexPassableForUnit, <owner>, cities) wystąpi 3 razy (znaleziono ${wired})`);
  assert(/canUnitOccupyCityHex\(active\.ownerId,\s*destQ,\s*destR,\s*cities\)[\s\S]{0,200}Nie można rozdzielić armii na obce miasto/.test(mainSrc),
    'guard onSplit: canUnitOccupyCityHex na celu + komunikat „Nie można rozdzielić armii na obce miasto."');
  assert(/canUnitOccupyCityHex\(active\.ownerId,\s*q,\s*r,\s*cities\)\)\s*reason\s*=\s*'Miasto przeciwnika'/.test(mainSrc),
    'etykieta sąsiada „Miasto przeciwnika" w splitNeighbors');
}

console.log('');
console.log(`Wynik: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) {
  process.exitCode = 1;
}
