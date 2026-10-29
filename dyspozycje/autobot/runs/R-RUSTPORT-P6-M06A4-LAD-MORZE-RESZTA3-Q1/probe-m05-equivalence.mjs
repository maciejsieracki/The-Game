// Dowod rownowaznosci M05: climateBandAt(_, r, H, false) == climateBandAt(_, r, H, true)
// dla kazdego H z zakresu i kazdego r z zakresu mapy [0,H) (PRAWDZIWY kod TS weba, pin edb8fb56).
// Uzycie: node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs ./probe-m05-equivalence.mjs <WEB_ROOT> <HMIN> <HMAX>
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const hmin = Number(process.argv[3]);
const hmax = Number(process.argv[4]);
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
let pairs = 0;
let diffs = 0;
const firstDiffs = [];
for (let H = hmin; H <= hmax; H++) {
  for (let r = 0; r < H; r++) {
    pairs++;
    const a = G.climateBandAt(0, r, H, false);
    const b = G.climateBandAt(0, r, H, true);
    if ((a === "desert") !== (b === "desert")) {
      diffs++;
      if (firstDiffs.length < 10) firstDiffs.push([H, r, a, b]);
    }
  }
}
console.log(JSON.stringify({ hmin, hmax, pairs, diffs, first_diffs: firstDiffs }));
