// P6.1 r3 — wektory z URUCHOMIONEGO weba dla first-player-city.ts (pin edb8fb56).
// Plik weba nie ma importow, wiec laduje sie bez loadera. Callback hexDistance: werbatim
// formula z gra/src/units/setup.ts:354-359 (przekazywana przez wywolujacego, jak w webie).
// Uzycie: node --experimental-strip-types ./gen-p61-first-city-vectors.mjs <WEB_ROOT> <OUT_JSON>
import { writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const fpc = await import(pathToFileURL(join(webRoot, 'gra/src/game/first-player-city.ts')).href);

const hexDistance = (aq, ar, bq, br) => {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
};

const OWNER_SETS = [
  [],
  [0],
  [1],
  [2, 3],
  [-1, -99],
  [1, 0],
  [0, 0],
];
const awaiting = OWNER_SETS.flatMap((owners) =>
  [false, true].map((ever) => ({
    everOwned: ever,
    owners,
    awaiting: fpc.isAwaitingFirstPlayerCity(ever, owners.map((ownerId) => ({ ownerId }))),
  })),
);
const awaitingWithOwnerOne = OWNER_SETS.flatMap((owners) =>
  [false, true].map((ever) => ({
    everOwned: ever,
    owners,
    playerOwnerId: 1,
    awaiting: fpc.isAwaitingFirstPlayerCity(ever, owners.map((ownerId) => ({ ownerId })), 1),
  })),
);

const START = [null, { q: 0, r: 0 }, { q: 3, r: -2 }];
const RADII = [0, 1, 3];
const PROBES = [
  { q: 0, r: 0 },
  { q: 1, r: 0 },
  { q: 3, r: -2 },
  { q: -3, r: 0 },
  { q: 2, r: -5 },
  { q: 4, r: -1 },
];
const reveal = [];
for (const aw of [false, true]) {
  for (const start of START) {
    for (const radius of RADII) {
      for (const p of PROBES) {
        reveal.push({
          q: p.q,
          r: p.r,
          awaiting: aw,
          start,
          radius,
          inReveal: fpc.isHexInStartReveal(p.q, p.r, aw, start, radius, hexDistance),
        });
      }
    }
  }
}

const validate = [];
for (const baseOk of [true, false]) {
  for (const aw of [false, true]) {
    for (const inRev of [false, true]) {
      for (const baseReason of ['', 'zajęte']) {
        validate.push({
          baseOk,
          awaiting: aw,
          inStartReveal: inRev,
          baseReason,
          result: fpc.validateFirstPlayerCityPlacement(0, 0, aw, inRev, baseOk, baseReason),
        });
      }
    }
  }
}

const out = {
  pin: 'edb8fb56',
  generator: 'gen-p61-first-city-vectors.mjs (r3)',
  sourceFile: 'gra/src/game/first-player-city.ts',
  constants: { FIRST_CITY_START_REVEAL_DENIED: fpc.FIRST_CITY_START_REVEAL_DENIED },
  awaiting,
  awaitingWithOwnerOne,
  reveal,
  validate,
};
writeFileSync(presolve(outArg), JSON.stringify(out, null, 1) + '\n');
console.log(`OK awaiting=${awaiting.length} awaitingOwner1=${awaitingWithOwnerOne.length} reveal=${reveal.length} validate=${validate.length}`);
