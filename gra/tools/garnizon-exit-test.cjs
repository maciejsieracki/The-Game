'use strict';
/**
 * node gra/tools/garnizon-exit-test.cjs
 *
 * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): jednostka ufortyfikowana
 * (RuntimeUnit.inGarnizon=true) nie może być permanentnie niesterowalna —
 * musi dać się wyprowadzić z garnizonu (panel miasta „Opuść garnizon”) oraz
 * zaznaczyć na liście armii w lewym menu i skierować w inne miejsce, co
 * automatycznie odfortyfikowuje ją i budzi (sentry).
 *
 * Testuje pure helpery z gra/src/game/armyMerge.ts:
 *   - activeUnitStack   -> stos "do działania" dla zaznaczonej jednostki
 *                          (solo, gdy ukryta w garnizonie; inaczej bez zmian).
 *   - exitGarnizon      -> wyjście z garnizonu (+ budzenie sentry).
 *   - visibleStackOnHex -> globalny filtr merge/blokad ruchu — MUSI zostać
 *                          BEZ ZMIAN (nadal wyklucza inGarnizon), żeby nie
 *                          rozluźnić łączenia armii ani blokad ruchu.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.garnizon-exit-entry.ts');
const BUNDLE = path.join(__dirname, '.garnizon-exit-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import {
  activeUnitStack,
  exitGarnizon,
  visibleStackOnHex,
  unitAtRepresentative,
} from '../src/game/armyMerge';
export { activeUnitStack, exitGarnizon, visibleStackOnHex, unitAtRepresentative };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  activeUnitStack,
  exitGarnizon,
  visibleStackOnHex,
  unitAtRepresentative,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

function makeUnit(overrides) {
  return {
    id: 'u1',
    ownerId: 0,
    q: 3,
    r: 4,
    ruch: 2,
    ruchLeft: 2,
    typeId: 'Wojownik',
    ...overrides,
  };
}

// --- 1) Ufortyfikowana jednostka znika z visibleStackOnHex/unitAtRepresentative
//        (globalny filtr merge/blokad ruchu) -- REGRESJA, jeśli to się zmieni. ---
{
  const garrisoned = makeUnit({ id: 'g1', inGarnizon: true });
  const free = makeUnit({ id: 'f1', q: 9, r: 9 });
  const units = [garrisoned, free];

  const onCityHex = visibleStackOnHex(units, garrisoned.q, garrisoned.r, 0);
  assert(onCityHex.length === 0, 'visibleStackOnHex nadal wyklucza inGarnizon (bez zmian)');

  const repOnCityHex = unitAtRepresentative(garrisoned.q, garrisoned.r, units, () => 1);
  assert(repOnCityHex === null, 'unitAtRepresentative nadal nie widzi ufortyfikowanej jednostki (klik w heks miasta)');

  const repOnFreeHex = unitAtRepresentative(free.q, free.r, units, () => 1);
  assert(repOnFreeHex && repOnFreeHex.id === 'f1', 'zwykła jednostka nadal widoczna/klikalna jak dawniej');
}

// --- 2) activeUnitStack: jednostka w garnizonie zaznaczona z listy armii
//        dostaje CAŁY garnizon na heksie (ruch/wyjście = cała armia). ---
{
  const garrisoned = makeUnit({ id: 'g2', inGarnizon: true });
  const garrisoned2 = makeUnit({ id: 'g2b', inGarnizon: true, q: garrisoned.q, r: garrisoned.r });
  const otherOnSameHex = makeUnit({ id: 'other', q: garrisoned.q, r: garrisoned.r });
  const units = [garrisoned, garrisoned2, otherOnSameHex];

  const stack = activeUnitStack(units, garrisoned);
  assert(
    stack.length === 2 && stack.some(x => x.id === 'g2') && stack.some(x => x.id === 'g2b'),
    'activeUnitStack(garnizon) = cały garnizon na heksie, nie solo ani widoczny stos',
  );

  const normalStack = activeUnitStack(units, otherOnSameHex);
  assert(
    normalStack.length === 1 && normalStack[0].id === 'other',
    'activeUnitStack(zwykła jednostka) = zwykły widoczny stos (bez zmian zachowania)',
  );
}

// --- 3) exitGarnizon: odfortyfikowanie + budzenie (sentry) w jednym kroku,
//        dokładnie to, co ma się dziać przy rozkazie ruchu / "Opuść garnizon". ---
{
  const u = makeUnit({ id: 'g3', inGarnizon: true, sentry: true });
  const changed = exitGarnizon(u);
  assert(changed === true, 'exitGarnizon zwraca true, gdy jednostka była w garnizonie');
  assert(u.inGarnizon === false, 'exitGarnizon: inGarnizon -> false');
  assert(u.sentry === false, 'exitGarnizon: sentry -> false (odśpienie razem z odfortyfikowaniem)');

  const again = exitGarnizon(u);
  assert(again === false, 'exitGarnizon jest no-opem (zwraca false) dla jednostki już poza garnizonem');
}

// --- 4) Po exitGarnizon jednostka wraca do zwykłego widocznego stosu na
//        heksie -- łączy się z jednostkami tam stojącymi (merge bez zmian). ---
{
  const garrisoned = makeUnit({ id: 'g4', inGarnizon: true, q: 5, r: 5 });
  const stationed = makeUnit({ id: 'stat', q: 5, r: 5 });
  const units = [garrisoned, stationed];

  assert(
    visibleStackOnHex(units, 5, 5, 0).length === 1,
    'przed wyjściem: tylko jednostka stacjonująca widoczna na heksie (garnizon ukryty)',
  );

  exitGarnizon(garrisoned);

  const afterExit = visibleStackOnHex(units, 5, 5, 0);
  assert(
    afterExit.length === 2 && afterExit.some(x => x.id === 'g4') && afterExit.some(x => x.id === 'stat'),
    'po wyjściu z garnizonu jednostka wraca do zwykłego widocznego stosu (merge z jednostkami na heksie)',
  );
}

console.log('garnizon-exit-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
