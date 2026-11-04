// REPIN-3D-B1 reference vectors (R-RUSTPORT-REPIN-3D-B-Q1, dokument
// dyspozycje/rust-port/p4/P4-REPIN-3D.md §9). RUNS the web code of `origin/main`
// (`git archive origin/main gra/src gra/data` -> ../websrc, outside the repo);
// web files are imported UNCHANGED. Usage (scratch refscript dir, three + esbuild
// linked as node_modules):
//   esbuild gen_b1.ts --bundle --platform=node --format=esm --outfile=gen_b1.mjs
//   node gen_b1.mjs <out-dir>          -> <out-dir>/b1.json
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BH from '../websrc/gra/src/render/buildHighlight';
import {
  MINE_ELIGIBLE_TINT_OPACITY,
  MINE_ELIGIBLE_STYLE,
} from '../websrc/gra/src/render/rangeOverlay';
import { RESOURCE_MODEL_SCALE } from '../websrc/gra/src/render/resources';
import { FORT_OUTPOST_MODEL_SCALE, SECTOR_R_ELEVATED } from '../websrc/gra/src/render/improvements';
import { buildStyledResourceOverlay } from '../websrc/gra/src/render/styleResources';
import { Nakladka } from '../websrc/gra/src/types/hex';

/** IEEE-754 binary64 bits, 16 hex digits (keeps -0 and NaN). */
function hx(x: number): string {
  const b = new DataView(new ArrayBuffer(8));
  b.setFloat64(0, x);
  return b.getBigUint64(0).toString(16).padStart(16, '0');
}

const out: Record<string, unknown> = {};

out.constants = {
  MAP_HEX_HIGHLIGHT_BASE_OPACITY: hx(BH.MAP_HEX_HIGHLIGHT_BASE_OPACITY),
  MINE_ELIGIBLE_BASE_OPACITY: hx(BH.MINE_ELIGIBLE_BASE_OPACITY),
  IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS: hx(BH.IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS),
  IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY: hx(BH.IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY),
  MINE_BUILD_HIGHLIGHT_OPACITY: hx(BH.MINE_BUILD_HIGHLIGHT_OPACITY),
  MINE_ELIGIBLE_TINT_OPACITY: hx(MINE_ELIGIBLE_TINT_OPACITY),
  MINE_ELIGIBLE_STYLE_tintOpacity: hx(MINE_ELIGIBLE_STYLE.tintOpacity),
  RESOURCE_MODEL_SCALE: hx(RESOURCE_MODEL_SCALE),
  FORT_OUTPOST_MODEL_SCALE: hx(FORT_OUTPOST_MODEL_SCALE),
  SECTOR_R_ELEVATED: hx(SECTOR_R_ELEVATED),
};

// filterBuildHighlightHexes: q/r as bits, keys as strings, result = kept indices.
const H = (q: number, r: number) => ({ q, r });
const filterCases: { name: string; key: string; hexes: { q: number; r: number }[]; pending: string[] }[] = [
  { name: 'empty-hexes', key: 'farma', hexes: [], pending: ['0,0:farma'] },
  { name: 'empty-pending', key: 'farma', hexes: [H(0, 0), H(1, -1)], pending: [] },
  { name: 'one-hit', key: 'farma', hexes: [H(0, 0), H(1, -1), H(2, 3)], pending: ['1,-1:farma'] },
  { name: 'other-key', key: 'kopalnia', hexes: [H(0, 0), H(1, -1)], pending: ['1,-1:farma', '0,0:farma'] },
  { name: 'all-hit', key: 'tartak', hexes: [H(4, 5), H(-3, 7)], pending: ['4,5:tartak', '-3,7:tartak', 'x'] },
  { name: 'duplicates', key: 'farma', hexes: [H(2, 2), H(2, 2), H(3, 2)], pending: ['2,2:farma'] },
  { name: 'neg-zero', key: 'farma', hexes: [H(-0, 0), H(0, -0)], pending: ['0,0:farma'] },
  { name: 'nan', key: 'farma', hexes: [H(NaN, 1), H(1, NaN)], pending: ['NaN,1:farma'] },
  { name: 'inf', key: 'farma', hexes: [H(Infinity, -Infinity)], pending: ['Infinity,-Infinity:farma'] },
  { name: 'fraction', key: 'farma', hexes: [H(0.5, 1.25), H(1e-7, 2), H(1e21, 3), H(123456789012, -1)], pending: ['0.5,1.25:farma', '1e-7,2:farma', '1e+21,3:farma', '123456789012,-1:farma'] },
  { name: 'small-dec', key: 'farma', hexes: [H(0.000001, 1), H(0.1 + 0.2, 0)], pending: ['0.000001,1:farma', '0.30000000000000004,0:farma'] },
  { name: 'empty-key', key: '', hexes: [H(1, 1), H(1, 2)], pending: ['1,1:'] },
  { name: 'key-colon', key: 'a:b', hexes: [H(1, 1)], pending: ['1,1:a:b'] },
  { name: 'big-col', key: 'farma', hexes: Array.from({ length: 9 }, (_, i) => H(i - 4, 4 - i)), pending: ['-4,4:farma', '0,0:farma', '4,-4:farma', '5,-5:farma'] },
];
out.filter = filterCases.map((c) => {
  const kept = BH.filterBuildHighlightHexes(c.key, c.hexes, new Set(c.pending));
  return {
    name: c.name,
    key: c.key,
    hexes: c.hexes.map((h) => [hx(h.q), hx(h.r)]),
    pending: c.pending,
    keys: c.hexes.map(({ q, r }) => `${q},${r}:${c.key}`),
    kept: kept.map((k) => c.hexes.indexOf(k)),
    keptBits: kept.map((h) => [hx(h.q), hx(h.r)]),
  };
});

// `${n}` notation boundaries used by the filter key (Number.prototype.toString).
const JSNUM = [0, -0, 1e-6, 9.99e-7, -1e-7, 1e21, 999999999999999900000, -1.5e300, NaN, -Infinity, Infinity,
  5e-324, -3, 0.1, 123.456, 2 ** 53, 1 / 3, 1e-6 - 1e-22];
out.jsnum = JSNUM.map((x) => [hx(x), `${x}`]);

// depositDisplayScale of buildStyledResourceOverlay(nakladka, 'roblox', zloze) for every pair.
const NAKL = [Nakladka.Brak, Nakladka.Las, Nakladka.ZlozeGliny, Nakladka.ZlozeRudy, Nakladka.ZlozeKonia,
  Nakladka.ZlozeOwiec, Nakladka.ZlozeBydla, Nakladka.ZlozeLamy];
const ZLOZA = [undefined, 'miedz', 'zelazo', 'wegiel', 'sol', 'zloto', 'cyna', 'glina', 'konie', 'owce', 'bydlo', 'xyz', ''];
out.deposit = [];
for (const n of NAKL) for (const z of ZLOZA) {
  const g = buildStyledResourceOverlay(n, 'roblox', z);
  (out.deposit as unknown[]).push({
    nakladka: n,
    zloze: z ?? null,
    isNull: g === null,
    keys: g ? Object.keys(g.userData) : [],
    dds: g ? hx(g.userData.depositDisplayScale as number) : null,
  });
}

const dir = process.argv[2];
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'b1.json'), JSON.stringify(out));
console.log(`b1 constants=${Object.keys(out.constants as object).length} filter=${filterCases.length} deposit=${(out.deposit as unknown[]).length}`);
