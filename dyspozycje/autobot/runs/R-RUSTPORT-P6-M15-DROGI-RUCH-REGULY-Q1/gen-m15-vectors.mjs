// P6.M15 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla gra/src/map/road-movement.ts
// oraz collectRoadKeys (improvement-build.ts:1559-1569, funkcja wycieta WERBATIM z zrodla -
// improvement-build.ts nie laduje sie w Node: import `three`).
// Kod road-movement.ts jest ladowany w calosci (z prawdziwym grafem importow terrain-improvements);
// zadne funkcje nie sa przepisywane. NaN / +-Infinity / -0 jako stringi.
//
//   node --experimental-transform-types --no-warnings --import ./m15-loader-register.mjs \
//     ./gen-m15-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg] = process.argv;
if (!webRootArg || !outDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

const RM = await import(src('map/road-movement.ts'));

// collectRoadKeys WERBATIM z improvement-build.ts (linie 1559-1569); jedyna zmiana to zdjecie
// adnotacji typow i slowa `export` (skladnia TS nie wchodzi do new Function).
const ibLines = readFileSync(join(webRoot, 'gra/src/map/improvement-build.ts'), 'utf8').split('\n');
const fnLines = ibLines.slice(1558, 1569);
const fnSrc = fnLines.join('\n');
if (!fnSrc.includes('export function collectRoadKeys(map: GameMap): Set<string> {')) {
  throw new Error('zly zakres improvement-build.ts');
}
const jsSrc = fnSrc
  .replace('export function collectRoadKeys(map: GameMap): Set<string> {', 'function collectRoadKeys(map) {')
  .replace('const keys = new Set<string>();', 'const keys = new Set();')
  .replace(/\/\*\*[^]*?\*\/\n/, '')
  .replace('/** Klucze ulepszeń drogowych (sieć dróg). */', '')
  .replace('export { isRoadImprovementKey };', '');
const collectRoadKeys = new Function('hexHasRoad', `${jsSrc}\nreturn collectRoadKeys;`)(RM.hexHasRoad);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x15c0ffee);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const replacer = (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
  }
  return v;
};
// Liczby f64 jako napisy (JS String(v) = najkrotsza reprezentacja round-trip): serde_json bez
// `float_roundtrip` czyta liczby JSON z bledem 1 ulp, a test Rust parsuje napis przez str::parse.
const fnum = (v) => {
  if (Number.isNaN(v)) return 'NaN';
  if (v === Infinity) return 'Infinity';
  if (v === -Infinity) return '-Infinity';
  if (Object.is(v, -0)) return '-0';
  return String(v);
};
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, replacer, 0) + '\n');

// ---------- stale ----------
write('constants.json', {
  ROAD_MOVE_SPEED_MULT: fnum(RM.ROAD_MOVE_SPEED_MULT),
  ROAD_BRUK_MOVE_SPEED_MULT: fnum(RM.ROAD_BRUK_MOVE_SPEED_MULT),
  ROAD_MIN_MOVE_COST: fnum(RM.ROAD_MIN_MOVE_COST),
  ROAD_BRUK_MIN_MOVE_COST: fnum(RM.ROAD_BRUK_MIN_MOVE_COST),
});

// ---------- klucze ----------
const KEYS = ['droga', 'droga_brukowana', 'Droga', 'DROGA', ' droga', 'droga ', 'brak', '', 'farma', 'bydlo', 'pastwisko',
  'kopalnia', 'tartak', 'constructor', '__proto__', 'toString', 'droga_brukowana ', 'drogi', 'bruk', 'irygacja', 'unknown_x'];
write('is_road_key.json', KEYS.map((k) => ({ key: k, out: RM.isRoadImprovementKey(k) })));

// ---------- heksy ----------
const SINGLE = ['droga', 'droga_brukowana', 'brak', 'farma', 'pastwisko', 'kopalnia', 'tartak', 'irygacja', 'constructor', 'zzz', 'Droga', ''];
const LAYER = ['droga', 'droga_brukowana', 'brak', 'farma', 'pastwisko', 'bydlo', 'owce', 'tartak', 'kopalnia', 'constructor', 'zzz', '', 'droga', 'droga_brukowana'];
function genHex() {
  const h = {};
  if (rnd() >= 0.08) h.ulepszenie = pick(SINGLE);
  const l = rnd();
  if (l < 0.25) h.ulepszenia = [];
  else if (l < 0.35) h.ulepszenia = null;
  else if (l < 0.75) {
    const n = ri(1, 4);
    h.ulepszenia = Array.from({ length: n }, () => pick(LAYER));
  }
  return h;
}
const hexes = [];
for (const s of SINGLE) hexes.push({ ulepszenie: s });
hexes.push({});
hexes.push({ ulepszenia: ['droga'] }, { ulepszenia: ['droga_brukowana'] }, { ulepszenia: ['farma', 'droga'] },
  { ulepszenia: ['droga', 'droga_brukowana'] }, { ulepszenia: ['droga_brukowana', 'droga'] },
  { ulepszenia: [], ulepszenie: 'droga' }, { ulepszenia: null, ulepszenie: 'droga_brukowana' },
  { ulepszenia: ['brak'], ulepszenie: 'droga' }, { ulepszenia: ['farma'], ulepszenie: 'droga' },
  { ulepszenia: ['farma'], ulepszenie: 'droga_brukowana' }, { ulepszenia: ['zzz'], ulepszenie: 'droga' },
  { ulepszenia: ['pastwisko'] }, { ulepszenia: ['constructor', 'droga'] });
for (let i = 0; i < 300; i++) hexes.push(genHex());

write('has_road.json', hexes.map((hex) => ({ hex, out: RM.hexHasRoad(hex) })));

// ---------- applyRoadMovementModifier ----------
const COSTS = [0, -0, 0.1, 0.2, 0.25, 0.3333333333333333, 0.5, 1, 1.5, 2, 3, 4, 4.5, 5, 6, 7, 10, 15, 89, 90, 100, 1e-9, 1e9, 1e300,
  1.7976931348623157e308, 5e-324, -1, -5, 3.0000000000000004, 0.7, 2.2, 9.9, NaN, Infinity, -Infinity];
const modRows = [];
for (const hex of hexes) {
  for (const cost of COSTS) {
    modRows.push({ cost: fnum(cost), hex, out: fnum(RM.applyRoadMovementModifier(cost, hex)) });
  }
}
write('apply_modifier.json', modRows);

// ---------- collectRoadKeys ----------
function genKey(i) {
  const k = rnd();
  if (k < 0.7) return `${ri(-6, 6)},${ri(-6, 6)}`;
  if (k < 0.8) return String(ri(0, 20)); // klucz calkowity - JS porzadkuje go przed napisami
  if (k < 0.85) return String(4294967294 - ri(0, 2)); // granica indeksu tablicy
  if (k < 0.9) return String(4294967295 + ri(0, 2)); // juz nie indeks
  if (k < 0.93) return `0${ri(1, 9)}`; // wiodace zero - nie indeks
  if (k < 0.96) return `-${ri(1, 9)}`;
  return `k${i}`;
}
// `entries` = pary w kolejnosci WSTAWIANIA; ponowne wstawienie klucza nadpisuje wartosc zachowujac
// pierwotna pozycje (semantyka wlasciwosci obiektu JS). `out` = kolejnosc Set z uruchomionego weba.
const collectRows = [{ entries: [], out: [] }];
for (let m = 0; m < 120; m++) {
  const n = ri(0, 14);
  const entries = [];
  const hs = {};
  for (let i = 0; i < n; i++) {
    const key = genKey(i);
    const hex = genHex();
    entries.push([key, hex]);
    hs[key] = hex;
  }
  collectRows.push({ entries, out: [...collectRoadKeys({ hexes: hs })] });
}
write('collect_road_keys.json', collectRows);
console.log('OK hexes=%d modifier=%d collect=%d', hexes.length, modRows.length, collectRows.length);
