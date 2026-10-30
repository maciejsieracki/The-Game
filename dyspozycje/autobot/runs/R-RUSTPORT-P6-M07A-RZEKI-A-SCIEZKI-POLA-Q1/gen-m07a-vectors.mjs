// Generator wektorow P6.M07A (rzeki, czesc A: sciezki i pola; gen-helpers.ts:5121-6068, pin edb8fb56).
// URUCHAMIA prawdziwy kod TS weba. Zadnej logiki nie przepisujemy.
// Uzycie (WEB_ROOT = katalog z `git archive edb8fb56 gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import <REJESTR>/m07a-register.mjs \
//        gen-m07a-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// Mapy w tablicy `maps` (indeks w przypadku); wiersz stanu:
// [klucz, terenBazowy, nakladka, zloze(0/1), rzekaObecna(0/1), rzekaKrawedzie[]].
// Kazda funkcja dostaje SWIEZA kopie mapy (z wierszy), wiec przypadki sa niezalezne.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m07a-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const rng = G.mulberry32(20261030);
const rnd = () => rng();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const SORT_BY_KEY = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

// ---------- stan mapy: zapis / odczyt ----------
function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    h.terenBazowy,
    h.nakladka,
    h.zloze ? 1 : 0,
    h.rzeka.obecna ? 1 : 0,
    [...h.rzeka.krawedzie],
  ]);
}
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = {
      coords: { q, r },
      terenBazowy: terr,
      nakladka: nak,
      rzeka: { obecna: ro === 1, krawedzie: [...ed] },
      ...(z ? { zloze: 'rudy' } : {}),
    };
  }
  return o;
}

const maps = [];
const addMap = (W, H, hexesObj) => {
  maps.push({ w: W, h: H, rows: dumpObj(hexesObj) });
  return maps.length - 1;
};

// ---------- generator losowych map ----------
const TERRAINS = [TB.Laka, TB.Rownina, TB.Wzgorza, TB.Gory, TB.PlytkieMorze, TB.Morze, TB.Pustynia, TB.Polarny];
const WEIGHTS = [18, 14, 6, 4, 10, 16, 6, 2];
const WSUM = WEIGHTS.reduce((a, b) => a + b, 0);
function pickTerrain() {
  let x = rnd() * WSUM;
  for (let i = 0; i < TERRAINS.length; i++) {
    x -= WEIGHTS[i];
    if (x < 0) return TERRAINS[i];
  }
  return TERRAINS[0];
}
const isWater = (t) => t === TB.Morze || t === TB.PlytkieMorze;

// Losowa mapa W x H: spojne skupiska (kopia lewego/gornego sasiada), nakladki lasu takze na wodzie,
// zloza, rzeki z krawedziami. Kolejnosc wstawiania = row-major (r zewnetrzne, q wewnetrzne).
function randomMap(W, H) {
  const hexes = {};
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const left = q > 0 ? hexes[keyOf(q - 1, r)] : null;
      const up = r > 0 ? hexes[keyOf(q, r - 1)] : null;
      let t;
      const x = rnd();
      if (left && x < 0.5) t = left.terenBazowy;
      else if (up && x < 0.75) t = up.terenBazowy;
      else t = pickTerrain();
      const water = isWater(t);
      const nak = rnd() < (water ? 0.05 : 0.14) ? NK.Las : NK.Brak;
      const zloze = rnd() < 0.06;
      let rzeka = { obecna: false, krawedzie: [] };
      if (rnd() < 0.12) {
        const n = ri(1, 3);
        const ed = new Set();
        while (ed.size < n) ed.add(ri(0, 5));
        rzeka = { obecna: true, krawedzie: [...ed].sort((a, b) => a - b) };
      }
      hexes[keyOf(q, r)] = {
        coords: { q, r },
        terenBazowy: t,
        nakladka: nak,
        rzeka,
        ...(zloze ? { zloze: 'rudy' } : {}),
      };
    }
  }
  return hexes;
}

// Losowa trasa: kroki sasiednie (glowny przypadek), skoki (luki), powroty (petle), wyjscia poza mape.
function randomPath(W, H, maxLen = 24) {
  const len = ri(1, maxLen);
  let q = ri(-2, W + 1);
  let r = ri(-2, H + 1);
  const p = [[q, r]];
  for (let i = 1; i < len; i++) {
    const x = rnd();
    if (x < 0.07) {
      q = ri(-2, W + 1);
      r = ri(-2, H + 1);
    } else if (x < 0.12) {
      const j = Math.floor(rnd() * p.length);
      q = p[j][0];
      r = p[j][1];
    } else if (x < 0.16) {
      const [dq, dr] = DIRS[ri(0, 5)];
      q += 2 * dq;
      r += 2 * dr;
    } else {
      const [dq, dr] = DIRS[ri(0, 5)];
      q += dq;
      r += dr;
    }
    p.push([q, r]);
  }
  return p;
}

// Czysta trasa (bez mapy) o malych wspolrzednych - dla sanitize / revisited / adjacent / split.
function purePath() {
  const len = ri(0, 12);
  const p = [];
  let q = ri(-2, 4);
  let r = ri(-2, 4);
  for (let i = 0; i < len; i++) {
    const x = rnd();
    if (x < 0.15) {
      q = ri(-2, 4);
      r = ri(-2, 4);
    } else if (x < 0.25 && p.length > 0) {
      q = p[Math.floor(rnd() * p.length)][0];
      r = p[Math.floor(rnd() * p.length)][1];
    } else {
      const [dq, dr] = DIRS[ri(0, 5)];
      q += dq;
      r += dr;
    }
    p.push([q, r]);
  }
  return p;
}

const mapCases = { purgeOcean: [], purgeStray: [], landRender: [], mediumRender: [], coastalRender: [], countMediumInland: [], repair: [], seaBuffer: [] };
const pureCases = { sanitize: [], revisited: [], adjacent: [], split: [] };
const quotaCases = [];
const fieldCases = [];
const constCases = [];

// ---------- stale i rangi ----------
constCases.push({
  ELEVATION_RANK: Object.fromEntries(Object.entries(G.ELEVATION_RANK).map(([k, v]) => [k, v])),
  RIVER_MIN_INLAND_FROM_SEA: G.RIVER_MIN_INLAND_FROM_SEA,
  RIVER_MIN_MAIN_LEN: G.RIVER_MIN_MAIN_LEN,
  RIVER_HARD_MEANDER_LEN: G.RIVER_HARD_MEANDER_LEN,
  RIVER_MOUTH_TAIL_LEN: G.RIVER_MOUTH_TAIL_LEN,
  MAIN_RIVER_MIN_PATH_SEP: G.MAIN_RIVER_MIN_PATH_SEP,
  MEDIUM_TRIBUTARY_SPACING_HEX: G.MEDIUM_TRIBUTARY_SPACING_HEX,
  MEDIUM_TRIBUTARY_MIN_NET_LEN: G.MEDIUM_TRIBUTARY_MIN_NET_LEN,
  MAIN_RIVER_COAST_MOUTH_MAX_GAP: G.MAIN_RIVER_COAST_MOUTH_MAX_GAP,
});

// ---------- riversQuotaForLandMass ----------
for (const tier of ['low', 'medium', 'high']) {
  for (let n = 0; n <= 40; n++) quotaCases.push({ n, tier, ret: G.riversQuotaForLandMass(n, tier) });
  for (const n of [41, 55, 64, 99, 100, 127, 200, 333, 512, 999, 2000]) {
    quotaCases.push({ n, tier, ret: G.riversQuotaForLandMass(n, tier) });
  }
}
// Domyslny tier ('medium') - wywolanie bez argumentu.
for (const n of [0, 7, 8, 13, 14, 15, 23, 24, 25, 100]) quotaCases.push({ n, tier: null, ret: G.riversQuotaForLandMass(n) });

// ---------- mapy: purge (ziemia / poza maska) ----------
const SIZES = [[10, 10], [12, 9], [14, 12], [16, 16], [18, 14], [20, 24], [24, 20], [11, 17], [30, 22], [36, 28]];
for (let i = 0; i < 40; i++) {
  const [W, H] = SIZES[i % SIZES.length];
  const m = addMap(W, H, randomMap(W, H));
  const hx1 = buildObj(maps[m].rows);
  const n1 = G.purgeOceanInsideEarthLandMask(hx1, W, H);
  mapCases.purgeOcean.push({ map: m, ret: n1, rows: dumpObj(hx1) });
  const hx2 = buildObj(maps[m].rows);
  const n2 = G.purgeStrayLandOutsideEarthMask(hx2, W, H);
  mapCases.purgeStray.push({ map: m, ret: n2, rows: dumpObj(hx2) });
}
// Kolejne przypadki na tych samych mapach (inne wymiary = inne maski Ziemi).
for (let i = 0; i < 24; i++) {
  const m = i % 40;
  const { w: W, h: H } = maps[m];
  const hx1 = buildObj(maps[m].rows);
  const n1 = G.purgeOceanInsideEarthLandMask(hx1, W + 1, H);
  mapCases.purgeOcean.push({ map: m, dimsW: W + 1, dimsH: H, ret: n1, rows: dumpObj(hx1) });
  const hx2 = buildObj(maps[m].rows);
  const n2 = G.purgeStrayLandOutsideEarthMask(hx2, W, H + 2);
  mapCases.purgeStray.push({ map: m, dimsW: W, dimsH: H + 2, ret: n2, rows: dumpObj(hx2) });
}

// ---------- mapy do sciezek i pol ----------
const PATH_MAPS = [];
for (let i = 0; i < 30; i++) {
  const [W, H] = SIZES[i % SIZES.length];
  PATH_MAPS.push(addMap(W, H, randomMap(W, H)));
}

function mapOf(m) {
  return buildObj(maps[m].rows);
}

for (let i = 0; i < 360; i++) {
  const m = PATH_MAPS[i % PATH_MAPS.length];
  const { w: W, h: H } = maps[m];
  const path = randomPath(W, H);
  const hx = mapOf(m);
  mapCases.landRender.push({ map: m, path, ret: G.landRiverRenderPath(hx, path.map(([q, r]) => ({ q, r }))).map((c) => [c.q, c.r]) });
  const hx2 = mapOf(m);
  mapCases.mediumRender.push({ map: m, path, ret: G.mediumRiverRenderPath(hx2, path.map(([q, r]) => ({ q, r }))).map((c) => [c.q, c.r]) });
  const hx3 = mapOf(m);
  mapCases.coastalRender.push({ map: m, path, ret: G.coastalRiverRenderPath(hx3, path.map(([q, r]) => ({ q, r }))).map((c) => [c.q, c.r]) });
  const hx4 = mapOf(m);
  mapCases.countMediumInland.push({ map: m, path, ret: G.countMediumInlandLandHexes(hx4, path.map(([q, r]) => ({ q, r }))) });
}

// repairRiverPathAdjacency: trasa + klucz zrodla (z trasy lub losowy).
for (let i = 0; i < 240; i++) {
  const m = PATH_MAPS[i % PATH_MAPS.length];
  const { w: W, h: H } = maps[m];
  const path = randomPath(W, H, 16);
  const srcFromPath = rnd() < 0.7;
  const sourceKey = srcFromPath && path.length > 0 ? keyOf(path[0][0], path[0][1]) : keyOf(ri(-1, W), ri(-1, H));
  const hx = mapOf(m);
  const ret = G.repairRiverPathAdjacency(path.map(([q, r]) => ({ q, r })), hx, sourceKey).map((c) => [c.q, c.r]);
  mapCases.repair.push({ map: m, path, sourceKey, ret });
}

// riverPathRespectsSeaBuffer (seaDist z buildSeaDistanceField na tej samej mapie).
for (let i = 0; i < 240; i++) {
  const m = PATH_MAPS[i % PATH_MAPS.length];
  const { w: W, h: H } = maps[m];
  const path = randomPath(W, H, 14);
  const minInland = [1, 2, 3][i % 3];
  const mouthTail = [3, 5, 7][Math.floor(i / 3) % 3];
  const hx = mapOf(m);
  const seaDist = G.buildSeaDistanceField(hx);
  const ret = G.riverPathRespectsSeaBuffer(
    hx,
    path.map(([q, r]) => ({ q, r })),
    seaDist,
    minInland,
    mouthTail,
  );
  mapCases.seaBuffer.push({ map: m, path, minInland, mouthTail, ret });
}

// ---------- czyste sciezki ----------
for (let i = 0; i < 400; i++) {
  const p = purePath();
  const cells = p.map(([q, r]) => ({ q, r }));
  pureCases.sanitize.push({ path: p, ret: G.sanitizeRiverPath(cells).map((c) => [c.q, c.r]) });
  pureCases.revisited.push({ path: p, ret: G.riverPathHasRevisitedHex(cells) });
  pureCases.adjacent.push({ path: p, ret: G.assertRiverPathAdjacent(cells) });
  pureCases.split.push({ path: p, ret: G.splitAdjacentRiverChains(cells).map((ch) => ch.map((c) => [c.q, c.r])) });
}

// ---------- pola odleglosci (sea / openOcean / ocean) ----------
for (let i = 0; i < 40; i++) {
  const m = PATH_MAPS[i % PATH_MAPS.length];
  const { w: W, h: H } = maps[m];
  const hx = mapOf(m);
  const fc = G.buildRiverFieldCache(hx, W, H);
  fieldCases.push({
    map: m,
    seaDist: [...fc.seaDist.entries()].sort(SORT_BY_KEY),
    oceanConnected: [...fc.oceanConnected].sort(),
    openOceanDist: [...fc.openOceanDist.entries()].sort(SORT_BY_KEY),
  });
}

const doc = {
  meta: {
    pin: 'edb8fb56',
    zrodlo: 'gra/src/map/gen-helpers.ts:5121-6068 (uruchomiony kod TS)',
    seed: 20261030,
  },
  maps,
  cases: {
    constants: constCases,
    quota: quotaCases,
    purgeOcean: mapCases.purgeOcean,
    purgeStray: mapCases.purgeStray,
    landRender: mapCases.landRender,
    mediumRender: mapCases.mediumRender,
    coastalRender: mapCases.coastalRender,
    countMediumInland: mapCases.countMediumInland,
    repair: mapCases.repair,
    seaBuffer: mapCases.seaBuffer,
    sanitize: pureCases.sanitize,
    revisited: pureCases.revisited,
    adjacent: pureCases.adjacent,
    split: pureCases.split,
    fields: fieldCases,
  },
};
writeFileSync(out, JSON.stringify(doc));
const counts = Object.fromEntries(Object.entries(doc.cases).map(([k, v]) => [k, v.length]));
console.log(JSON.stringify(counts));
