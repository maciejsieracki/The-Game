// REPIN-DELTA-4 runda 2 (hunk 16): wektory z URUCHOMIONEGO weba (pin 23dd158e9) dla
// `computePlayerVisibility` z `extraSightSources` (visibility.ts:268-310) - zrodla wzroku fortow/posterunkow.
// Osobny generator (inny strumien PRNG), zeby pozostale wektory `p6_repin4_vectors/*.json` zostaly bajt-w-bajt.
// Uruchomienie (Node 22, katalog `tools`; WEB_ROOT = rozpakowane `git archive 23dd158e9 gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin4-visibility.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '23dd158e9';

const V = await import(src('game/visibility.ts'));
const FT = await import(src('game/fort-territory.ts'));
const CR = await import(src('game/culture-religion.ts'));
const HX = await import(src('types/hex.ts'));
const TB = HX.TerenBazowy;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x56495332);
const chance = (p) => rnd() < p;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const kulturaVals = [0, 5, 20, 60, 150, 400, 1000];
const border = kulturaVals.map((k) => ({ kultura: k, ring: CR.cityBorderRadius(k) }));
const cases = [];
for (let i = 0; i < 160; i++) {
  const W = ri(10, 22), H = ri(10, 18);
  const hexes = {};
  const keys = [];
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
    if (chance(0.04)) continue;
    const k = `${q},${r}`;
    hexes[k] = { coords: { q, r }, terenBazowy: pick([TB.Laka, TB.Rownina, TB.Wzgorza, TB.Morze]) };
    keys.push(k);
  }
  const forts = [];
  for (let j = 0, n = ri(0, 5); j < n; j++) {
    const f = { q: ri(-2, W + 1), r: ri(-2, H + 1), ownerId: ri(0, 2), type: chance(0.5) ? 'fort' : 'posterunek' };
    if (chance(0.25)) f.contestedUseless = chance(0.7);
    forts.push(f);
  }
  const ownerId = ri(0, 2);
  const units = [];
  for (let j = 0, n = chance(0.4) ? 0 : ri(1, 3); j < n; j++) {
    units.push({ id: `u${j}`, ownerId: 0, typeId: 'x', q: ri(0, W - 1), r: ri(0, H - 1), sight: ri(1, 4) });
  }
  const cities = [];
  for (let j = 0, n = chance(0.5) ? 0 : ri(1, 2); j < n; j++) {
    cities.push({ q: ri(0, W - 1), r: ri(0, H - 1), population: ri(0, 25), kultura: pick(kulturaVals) });
  }
  const startHex = chance(0.5) ? { q: ri(0, W - 1), r: ri(0, H - 1) } : null;
  // dodatkowe zrodla: z fortSightSources + reczne (promien <= 0, ulamkowy)
  const extra = FT.fortSightSources(forts, ownerId).map((s) => ({ q: s.q, r: s.r, radius: s.radius }));
  if (chance(0.3)) extra.push({ q: ri(0, W - 1), r: ri(0, H - 1), radius: pick([0, -1, 2, 2.5]) });
  const gameMap = { hexes };
  const run = (ex) => [...V.computePlayerVisibility({
    map: gameMap,
    playerUnits: units.map((u) => ({ ...u })),
    playerCities: cities,
    unitSight: (u) => u.sight,
    startHex,
    ...(ex === undefined ? {} : { extraSightSources: ex }),
  })];
  const sortKeys = (a) => a.slice().sort((x, y) => {
    const [xq, xr] = x.split(',').map(Number); const [yq, yr] = y.split(',').map(Number);
    return xq - yq || xr - yr;
  });
  cases.push({
    keys, units, cities, startHex, extra,
    withExtra: sortKeys(run(extra)),
    withoutExtra: sortKeys(run(undefined)),
  });
}
const nDiff = cases.filter((c) => c.withExtra.length !== c.withoutExtra.length).length;
writeFileSync(join(outDir, 'visibility.json'), JSON.stringify({ pin: PIN, border, cases }) + '\n');
console.log(`visibility cases=${cases.length} extra_changes_result=${nDiff}`);
