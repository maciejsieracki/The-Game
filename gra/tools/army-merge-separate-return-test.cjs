'use strict';
/**
 * army-merge-separate-return-test.cjs — P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO,
 * ECHO A (Maciej 2026-08-09): testy funkcjonalne czystych funkcji
 * `computeSeparateReturn` / `resolveSeparateReturnHex` (game/armyMerge.ts).
 *
 * Uzupełnia `army-merge-separate-return-mainguard-test.cjs` (który chroni
 * WPIĘCIE w main.ts jako tekst) — tutaj testujemy SAME funkcje z realną
 * logiką, w tym przypadki brzegowe spoza dosłownego scenariusza ze
 * zgłoszenia (Evaluator, wzmocnienie lean-loop: „Operator wykracza poza
 * literalny scenariusz zgłoszenia własnym dowodem").
 *
 * Usage (z gra/): node tools/army-merge-separate-return-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.army-merge-separate-return-entry.ts');
const BUNDLE = path.join(__dirname, '.army-merge-separate-return-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { computeSeparateReturn, resolveSeparateReturnHex } from '../src/game/armyMerge';
export { computeSeparateReturn, resolveSeparateReturnHex };`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { computeSeparateReturn, resolveSeparateReturnHex } = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

// ===========================================================================
// computeSeparateReturn
// ===========================================================================

// 1) Scenariusz dosłowny ze zgłoszenia: jednostka miała ruchLeft=1, odjęto
//    (deductedRuch) dokładnie 1 -> wraca do 2 (ruch = 2, PRZED ruchem miała 2).
{
  const units = [{ id: 'u1', ruch: 2, ruchLeft: 1 }];
  const r = computeSeparateReturn(units, 1);
  assert(r.get('u1') === 2, 'scenariusz dosłowny: zwrot 1 pkt -> ruchLeft wraca do pełnego (2)');
}

// 2) Świeżo wyprodukowana jednostka (deductedRuch=0, cost=0) — ruchLeft bez zmian.
{
  const units = [{ id: 'u1', ruch: 3, ruchLeft: 3 }];
  const r = computeSeparateReturn(units, 0);
  assert(r.get('u1') === 3, 'deductedRuch=0 (jednostka bez ruchu w tej turze) -> ruchLeft niezmienione');
}

// 3) EXPLOIT B1 (Evaluator RUNDA 1): reguła MIN-MOVE pozwala wejść na heks
//    droższy niż budżet (np. koszt 3 przy ruchLeft=1 -> deductStackRuchLeft
//    klampuje do 0, deductedRuch faktyczny = 1, NIE 3). Zwrot na deductedRuch=1
//    (nie moveCost=3) NIE MOŻE dać jednostce więcej niż miała przed ruchem (2).
{
  const units = [{ id: 'u1', ruch: 2, ruchLeft: 0 }]; // po deductStackRuchLeft: 1 - 1 = 0
  const deductedRuchFaktyczny = 1; // pulaPrzed(1) - pulaPo(0), NIE moveCost=3
  const r = computeSeparateReturn(units, deductedRuchFaktyczny);
  assert(r.get('u1') === 1, 'B1: zwrot na deductedRuch (1) daje z powrotem dokładnie 1, nie moveCost (3)');
  assert(r.get('u1') <= 2, 'B1: zwrot NIGDY nie przekracza ruch max jednostki (bariera 1)');
}

// 4) EXPLOIT B1, druga bariera: nawet gdyby deductedRuch był (błędnie) większy
//    niż to, co jednostka mogła kiedykolwiek mieć, klamp do u.ruch chroni.
{
  const units = [{ id: 'u1', ruch: 2, ruchLeft: 0 }];
  const r = computeSeparateReturn(units, 999);
  assert(r.get('u1') === 2, 'B1 druga bariera: deductedRuch nienaturalnie duży -> klamp do u.ruch (2), nie 999');
}

// 5) Wiele jednostek z RÓŻNYM ruch max — każda klampowana NIEZALEŻNIE (armia
//    złożona z wolnej i szybkiej jednostki, wspólny deductedRuch ze stosu).
{
  const units = [
    { id: 'slow', ruch: 1, ruchLeft: 0 },
    { id: 'fast', ruch: 3, ruchLeft: 2 },
  ];
  const r = computeSeparateReturn(units, 1);
  assert(r.get('slow') === 1, 'wiele jednostek: slow (max 1) klampowana do własnego maksimum');
  assert(r.get('fast') === 3, 'wiele jednostek: fast (max 3) dostaje pełny zwrot do własnego maksimum');
}

// 6) Ujemny deductedRuch (obronnie — nie powinno się zdarzyć, ale
//    Math.max(0,...) chroni przed ODJĘCIEM ruchu zamiast zwrotem).
{
  const units = [{ id: 'u1', ruch: 2, ruchLeft: 1 }];
  const r = computeSeparateReturn(units, -5);
  assert(r.get('u1') === 1, 'deductedRuch ujemny (obronnie) traktowany jak 0 -> ruchLeft bez zmian, NIE odjęty dalej');
}

// 7) Pusta lista jednostek -> pusta mapa (brak wyjątku).
{
  const r = computeSeparateReturn([], 5);
  assert(r.size === 0, 'pusta lista movedUnits -> pusta mapa wyniku, bez wyjątku');
}

// ===========================================================================
// resolveSeparateReturnHex
// ===========================================================================

const isPassableAll = () => true;
const isPassableNone = () => false;

// 8) Scenariusz dosłowny: origin pusty i przejezdny -> zwraca origin.
{
  const units = [];
  const dest = resolveSeparateReturnHex(units, 3, 4, 0, isPassableAll);
  assert(dest && dest.q === 3 && dest.r === 4, 'origin pusty+przejezdny -> zwraca (3,4)');
}

// 9) Origin zajęty przez WŁASNĄ jednostkę (par. 6b: współdzielenie heksu OK,
//    to NIE jest powód do blokady — tylko wróg blokuje).
{
  const units = [{ id: 'friend', ownerId: 0, q: 3, r: 4 }];
  const dest = resolveSeparateReturnHex(units, 3, 4, 0, isPassableAll);
  assert(dest && dest.q === 3 && dest.r === 4, 'origin zajęty przez WŁASNĄ jednostkę -> nadal zwraca origin (par. 6b)');
}

// 10) B3 (Evaluator RUNDA 1): origin zajęty przez WROGA -> null (bez teleportu
//     na wroga bez walki).
{
  const units = [{ id: 'enemy', ownerId: 1, q: 3, r: 4 }];
  const dest = resolveSeparateReturnHex(units, 3, 4, 0, isPassableAll);
  assert(dest === null, 'B3: origin zajęty przez WROGA -> null, bez bezwarunkowego teleportu');
}

// 11) Origin zajęty przez wroga W GARNIZONIE (ukryty) — nie powinien blokować,
//     bo garrisonowana jednostka nie stoi realnie na polu (przypadek brzegowy
//     spoza dosłownego zgłoszenia — Evaluator, wzmocnienie lean-loop).
{
  const units = [{ id: 'enemy-garnizon', ownerId: 1, q: 3, r: 4, inGarnizon: true }];
  const dest = resolveSeparateReturnHex(units, 3, 4, 0, isPassableAll);
  assert(dest && dest.q === 3 && dest.r === 4, 'wróg W GARNIZONIE na origin -> NIE blokuje (ukryty, nie stoi na polu)');
}

// 12) Origin nieprzejezdny (np. teren zablokowany po zmianie mapy w
//     międzyczasie) -> null, niezależnie od zajętości.
{
  const units = [];
  const dest = resolveSeparateReturnHex(units, 3, 4, 0, isPassableNone);
  assert(dest === null, 'origin nieprzejezdny -> null');
}

// 13) Brak isPassable (undefined) -> domyślnie zawsze przejezdny (kontrakt
//     jak inne funkcje armyMerge.ts, np. findBounceHexFromOrigin).
{
  const units = [];
  const dest = resolveSeparateReturnHex(units, 7, 8, 0, undefined);
  assert(dest && dest.q === 7 && dest.r === 8, 'isPassable=undefined -> domyślnie przejezdny, zwraca origin');
}

// 14) Wielu wrogów I przyjaciół naraz na origin — wystarczy JEDEN prawdziwy
//     wróg (nie w garnizonie), żeby zablokować, mimo obecności przyjaciół.
{
  const units = [
    { id: 'friend', ownerId: 0, q: 5, r: 5 },
    { id: 'enemy', ownerId: 2, q: 5, r: 5 },
  ];
  const dest = resolveSeparateReturnHex(units, 5, 5, 0, isPassableAll);
  assert(dest === null, 'mieszanka przyjaciel+wróg na origin -> wciąż null (jeden realny wróg wystarczy)');
}

console.log(`\narmy-merge-separate-return-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
