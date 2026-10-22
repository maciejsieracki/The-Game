// P6.1 r3 — wektory z URUCHOMIONEGO weba dla first-player-city.ts (pin edb8fb56).
// Plik weba nie ma importow, wiec laduje sie bez loadera. hexDistance: werbatim z
// gra/src/units/setup.ts:354-359 (stubs/hex-distance.ts, kotwice linii).
// Uzycie: node --experimental-strip-types ./gen-p61-first-city-vectors.mjs <WEB_ROOT> <OUT_JSON>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const fpc = await import(pathToFileURL(join(webRoot, 'gra/src/game/first-player-city.ts')).href);

// r4 (zarzut 3): hexDistance WERBATIM z gra/src/units/setup.ts:354-359 (linie wyciete z weba,
// kotwice sprawdzone). Plik setup.ts ma ciezkie importy (map/startScoring, data/loader), wiec
// nie jest importowany; wycinamy tylko funkcje, jak stuby r2.
const setupLines = readFileSync(join(webRoot, 'gra/src/units/setup.ts'), 'utf8').split('\n');
const hexAnchors = {
  l354: setupLines[353] === 'export function hexDistance(aq: number, ar: number, bq: number, br: number): number {',
  l355: setupLines[354] === '  const dq = Math.abs(aq - bq);',
  l356: setupLines[355] === '  const dr = Math.abs(ar - br);',
  l357: setupLines[356] === '  const ds = Math.abs((-aq - ar) - (-bq - br));',
  l358: setupLines[357] === '  return Math.max(dq, dr, ds);',
  l359: setupLines[358] === '}',
};
for (const [k, v] of Object.entries(hexAnchors)) {
  if (!v) throw new Error(`hexDistance anchor drift: ${k}`);
}
const hexStubDir = fileURLToPath(new URL('./stubs/', import.meta.url));
const hexStubPath = join(hexStubDir, 'hex-distance.ts');
writeFileSync(hexStubPath, setupLines.slice(353, 359).join('\n') + '\n');
const { hexDistance } = await import(pathToFileURL(hexStubPath).href);

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
  hexDistanceSource: 'gra/src/units/setup.ts:354-359 (werbatim, stubs/hex-distance.ts)',
  generator: 'gen-p61-first-city-vectors.mjs (r4)',
  sourceFile: 'gra/src/game/first-player-city.ts',
  constants: { FIRST_CITY_START_REVEAL_DENIED: fpc.FIRST_CITY_START_REVEAL_DENIED },
  awaiting,
  awaitingWithOwnerOne,
  reveal,
  validate,
};
writeFileSync(presolve(outArg), JSON.stringify(out, null, 1) + '\n');
console.log(`OK awaiting=${awaiting.length} awaitingOwner1=${awaitingWithOwnerOne.length} reveal=${reveal.length} validate=${validate.length}`);
