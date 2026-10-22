// R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 — generator of texture-cache key / scale reference vectors.
//
// Run ONLY outside the repository (scratch dir) through gen.sh, see README.md. The esbuild
// bundle links three@0.169.0 and the web modules from `git archive edb8fb56 gra/src gra/data`:
//  - render/cityMapStatChip.ts  (cityMapBadgeKey, formatCityGrowthPercentLabel,
//                                disposeCityMapBadgeTexturesForOtherLod — exported, unchanged);
//  - render/unitOwnerEmblem.ts  (ownerEmblemKey — exported, unchanged);
//  - render/zoomLod.ts          (cityBadgeLodLevelForDist, cityBadgeLodTextureScale);
//  - module-private helpers made importable by gen.sh, which APPENDS one line
//    `export { … };` to a scratch copy of the file (no function body is touched):
//      cityMapStatChip.ts: civSigilCacheKey, leaderPortraitCacheKey, prodIconCacheKey,
//                          badgePixelRatio, badgeCanvasScale, cityBadgeLodSegment;
//      workerFieldOverlay.ts: workerSpriteCacheKey.
//  - two LITERAL fragments (not functions in the web): the T11 key template
//    `${path}:${level}` (unitUpgradeBadges.ts:312) and the canvas size
//    `Math.round(W * dpr)` / `Math.round(H * dpr)` (cityMapStatChip.ts:848-849).
//
// Numbers are written as 16-hex-digit binary64 bit patterns (NaN/±Infinity/-0 survive JSON).
// `undefined` and `null` inputs are written as JSON null (every key function treats them alike:
// `!= null`, `??`, `||`, `=== 1`). Output: atlas_keys.json in argv[2].

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  cityMapBadgeKey,
  formatCityGrowthPercentLabel,
  disposeCityMapBadgeTexturesForOtherLod,
  civSigilCacheKey,
  leaderPortraitCacheKey,
  prodIconCacheKey,
  badgePixelRatio,
  badgeCanvasScale,
  cityBadgeLodSegment,
} from '../websrc/gra/src/render/cityMapStatChip';
import { ownerEmblemKey } from '../websrc/gra/src/render/unitOwnerEmblem';
import { cityBadgeLodLevelForDist, cityBadgeLodTextureScale } from '../websrc/gra/src/render/zoomLod';
import { workerSpriteCacheKey } from '../websrc/gra/src/render/workerFieldOverlay';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

const buf = new DataView(new ArrayBuffer(8));
function bits(x: number): string {
  buf.setFloat64(0, x);
  return buf.getBigUint64(0).toString(16).padStart(16, '0');
}
const numOrNull = (x: number | null | undefined) => (x == null ? null : bits(x));

// Deterministic xorshift32.
let seed = 0x31a7c0de;
function rnd(): number {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >>> 17;
  seed ^= seed << 5; seed >>>= 0;
  return seed / 4294967296;
}
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];

// ---------------------------------------------------------------------------------------------
// Value pools (edge cases of trim/toLowerCase/Math.round/Math.floor/toFixed/Number→String).
const NAMES = [
  'Ateny', '  Ateny  ', 'Kraków', 'ŁÓDŹ', 'uMgungundlovu', 'Kartagena Hiszpańska', '', '   ',
  '\tTeby\n', ' Sparta ', '﻿Korynt﻿', '\u0085Delfy\u0085', ' Argos ',
  '　Edo　', '​Mykeny​', 'Αθήνα', 'ΣΟΦΟΣ', 'İzmir', 'Straße', 'a|b|c', 'Miasto 7',
  '᠎X᠎', '\u000bVT\u000c', 'emoji🔥', 'x́', 'Ǆemal',
];
const CIVS = [
  'grecy', 'GRECY', '  Rzymianie ', '', '   ', 'Zulusi', 'İ', 'ΣΑΣ', 'Ǆ', ' egipt ',
  '﻿persowie', 'mongołowie', 'KARTAGINA', 'straße', 'ẞ', 'ﬀ', 'Ω', 'K',
];
const POPS = [
  1, 2, 7, 12, 0, -0, -3, 0.5, 1.9, 2.5, 1e21, 1e300, 123456789, NaN, Infinity, -Infinity, 4.000000000000001,
  0.9999999999999999, 31.7, 2 ** 53 + 2,
];
const GROWTH = [
  null, undefined, 0, -0, 0.04, 0.05, -0.04, -0.05, -0.05000000000000001, 0.15, 0.25, 0.35, 1.25, 2.35,
  -10.55, -10.5, 99.95, -99.94, -99.95, 100.5, 3, -3, 12.345, 1e21, -1e21, 1e20, 1e-7, -1e-7, NaN,
  Infinity, -Infinity, 0.45, 1.45, 2.45, 8.05, 1.005, 33.333333333333336, -0.000001, 5e-324,
];
const ERAS = [null, undefined, 0, -0, 1, 2, 3, 2.5, 3.49, 3.5, -1, -0.4, 0.4, NaN, Infinity, -Infinity, 1e21, 7.5];
const LODS = [null, undefined, 0, 1, 2, 3, 1.5, -1, NaN, Infinity, -0, 2.0000000000000004];
const PROD_KINDS = [null, undefined, 'budynek', 'jednostka', ''];
const PROD_IDS = [null, undefined, '', 'koszary', '  Spichlerz ', ' wojownik ', 'Łucznik', 'a:b'];

type Input = {
  cityName: string; population: number; defenseTier: 0 | 1 | 2; civIconId: string;
  prodActive?: boolean; prodKind?: any; prodId?: any; growthPercent?: number | null;
  growthStarving?: boolean; resourceWarning?: boolean; hoverExpanded?: boolean;
  isCityState?: boolean; era?: number | null; isCapital?: boolean; lodLevel?: number | null;
};

function encodeInput(a: Input) {
  return {
    cityName: a.cityName,
    population: bits(a.population),
    defenseTier: a.defenseTier,
    civIconId: a.civIconId,
    prodActive: a.prodActive === true,
    prodKind: a.prodKind ?? null,
    prodId: a.prodId ?? null,
    growthPercent: numOrNull(a.growthPercent),
    growthStarving: a.growthStarving === true,
    resourceWarning: a.resourceWarning === true,
    hoverExpanded: a.hoverExpanded === true,
    isCityState: a.isCityState === true,
    era: numOrNull(a.era),
    isCapital: a.isCapital === true,
    lodLevel: numOrNull(a.lodLevel),
  };
}

// ---------------------------------------------------------------------------------------------
// 1. cityMapBadgeKey(input) — systematic one-axis sweeps around a base + random combinations.
const base: Input = { cityName: 'Ateny', population: 3, defenseTier: 0, civIconId: 'grecy' };
const badgeInputs: Input[] = [base];
for (const n of NAMES) badgeInputs.push({ ...base, cityName: n });
for (const p of POPS) badgeInputs.push({ ...base, population: p });
for (const d of [0, 1, 2] as const) badgeInputs.push({ ...base, defenseTier: d });
for (const c of CIVS) badgeInputs.push({ ...base, civIconId: c });
for (const k of PROD_KINDS) for (const id of PROD_IDS) {
  badgeInputs.push({ ...base, prodActive: true, prodKind: k, prodId: id });
  badgeInputs.push({ ...base, prodActive: false, prodKind: k, prodId: id });
}
for (const g of GROWTH) {
  badgeInputs.push({ ...base, growthPercent: g });
  badgeInputs.push({ ...base, growthPercent: g, growthStarving: true });
}
for (const e of ERAS) badgeInputs.push({ ...base, era: e });
for (const l of LODS) badgeInputs.push({ ...base, lodLevel: l });
for (const f of ['resourceWarning', 'hoverExpanded', 'isCityState', 'isCapital', 'growthStarving'] as const) {
  badgeInputs.push({ ...base, [f]: true });
}
for (let i = 0; i < 1500; i++) {
  badgeInputs.push({
    cityName: pick(NAMES),
    population: pick(POPS),
    defenseTier: pick([0, 1, 2] as const),
    civIconId: pick(CIVS),
    prodActive: rnd() < 0.5,
    prodKind: pick(PROD_KINDS),
    prodId: pick(PROD_IDS),
    growthPercent: rnd() < 0.3 ? (rnd() - 0.5) * 250 : pick(GROWTH),
    growthStarving: rnd() < 0.2,
    resourceWarning: rnd() < 0.5,
    hoverExpanded: rnd() < 0.5,
    isCityState: rnd() < 0.3,
    era: pick(ERAS),
    isCapital: rnd() < 0.3,
    lodLevel: pick(LODS),
  });
}
const badgeKeys = badgeInputs.map((a) => ({ input: encodeInput(a), key: cityMapBadgeKey(a as any) }));

// 1b. Legacy overload cityMapBadgeKey(name, population).
const legacyKeys: Array<{ name: string; population: string | null; key: string }> = [];
for (const n of NAMES) for (const p of [...POPS, undefined]) {
  legacyKeys.push({ name: n, population: numOrNull(p), key: (cityMapBadgeKey as any)(n, p) });
}

// 2. formatCityGrowthPercentLabel.
const growthLabels: Array<{ pct: string; starving: boolean; label: string }> = [];
const growthPool: number[] = GROWTH.filter((g): g is number => g != null);
for (let i = 0; i < 4000; i++) {
  const r = rnd();
  if (r < 0.4) growthPool.push(Math.round((rnd() - 0.5) * 4000) / 20); // exact x.x5-ish ties in decimal
  else if (r < 0.7) growthPool.push((rnd() - 0.5) * 300);
  else if (r < 0.85) growthPool.push(Math.round((rnd() - 0.5) * 2000) / 10 + 0.05);
  else growthPool.push((rnd() - 0.5) * 10 ** Math.floor(rnd() * 30 - 8));
}
for (const g of growthPool) {
  growthLabels.push({ pct: bits(g), starving: false, label: formatCityGrowthPercentLabel(g) });
}
for (const g of GROWTH.filter((g): g is number => g != null)) {
  growthLabels.push({ pct: bits(g), starving: true, label: formatCityGrowthPercentLabel(g, true) });
}

// 3. Related keys.
const sigilKeys = CIVS.map((c) => ({ civ: c, key: civSigilCacheKey(c) }));
const portraitKeys: Array<{ civ: string; era: string; key: string }> = [];
for (const c of CIVS) for (const e of ERAS) {
  if (e == null) continue; // the web always passes a number (`input.era ?? 1`, cityMapStatChip.ts:1098)
  portraitKeys.push({ civ: c, era: bits(e), key: leaderPortraitCacheKey(c, e) });
}
const prodKeys: Array<{ kind: string; id: string | null; key: string }> = [];
for (const k of ['budynek', 'jednostka', '']) for (const id of PROD_IDS) {
  prodKeys.push({ kind: k, id: id ?? null, key: prodIconCacheKey(k as any, id as any) });
}
const emblemKeys: Array<{ civId: string | null; era: string; isCityState: boolean; isBarbarian: boolean; key: string }> = [];
for (const c of [...CIVS, null]) for (const e of ERAS) for (const cs of [false, true]) for (const b of [false, true]) {
  if (e == null) continue; // UnitOwnerEmblemContext.era is a number
  emblemKeys.push({
    civId: c, era: bits(e), isCityState: cs, isBarbarian: b,
    key: ownerEmblemKey({ civId: c, era: e, isCityState: cs, isBarbarian: b }),
  });
}
const workerKeys: Array<{ owner: string; player: string; key: string }> = [];
for (const o of [0, 1, 2, 7, 12, -1, 0.5, -0, NaN, 99]) for (const p of [0, 1, 7, -1, NaN, -0]) {
  workerKeys.push({ owner: bits(o), player: bits(p), key: workerSpriteCacheKey(o, p) });
}
const upgradeKeys: Array<{ path: string; level: number; key: string }> = [];
for (const p of ['armor', 'soft']) for (const level of [1, 2, 3]) {
  upgradeKeys.push({ path: p, level, key: `${p}:${level}` }); // LITERAL unitUpgradeBadges.ts:312
}

// 4. LOD level / texture scale / DPI ratio / canvas scale / canvas size.
const lodForDist: Array<{ dist: string; level: number }> = [];
const DISTS = [
  NaN, Infinity, -Infinity, 0, -0, -1, 2.67, 5.4999999999999991, 5.5, 5.500000000000001, 8, 10.999999999999998,
  11, 11.000000000000002, 20, 1e9, 8 / 3,
];
for (let i = 0; i < 300; i++) DISTS.push(rnd() * 25);
for (const d of DISTS) lodForDist.push({ dist: bits(d), level: cityBadgeLodLevelForDist(d) });
const lodScale: Array<{ level: string; scale: number }> = [];
const LVL = [0, 1, 2, 3, -1, 1.5, NaN, Infinity, -0, 2.0000000000000004, 0.9999999999999999];
for (const l of LVL) lodScale.push({ level: bits(l), scale: cityBadgeLodTextureScale(l) });
const lodSegment: Array<{ level: string | null; seg: number }> = [];
for (const l of [...LVL, null, undefined]) lodSegment.push({ level: numOrNull(l as any), seg: cityBadgeLodSegment(l as any) });

const DPRS = [
  1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 0.5, 0.75, 0, -0, -1, NaN, Infinity, -Infinity, 2.9999999999999996,
  1.1, 1.3333333333333333, 2.6666666666666665, 1e-300,
];
const g: any = globalThis as any;
const ratios: Array<{ dpr: string; ratio: string }> = [];
const scales: Array<{ dpr: string; lod: string | null; scale: string }> = [];
const canvasSizes: Array<{ dpr: string; lod: string | null; w: number; h: number; cw: number; ch: number }> = [];
for (const dpr of DPRS) {
  g.window = { devicePixelRatio: dpr };
  ratios.push({ dpr: bits(dpr), ratio: bits(badgePixelRatio()) });
  for (const lod of [null, undefined, 0, 1, 2, 3, 1.5, NaN]) {
    const s = badgeCanvasScale(lod as any);
    scales.push({ dpr: bits(dpr), lod: numOrNull(lod as any), scale: bits(s) });
    if (lod === 0 || lod === 1 || lod === 2) {
      for (const W of [1, 47, 99, 101, 123, 200, 305, 358, 418, 426, 463, 512, 1000]) {
        for (const H of [48, 70]) {
          canvasSizes.push({
            dpr: bits(dpr), lod: bits(lod), w: W, h: H,
            cw: Math.round(W * s), ch: Math.round(H * s), // LITERAL cityMapStatChip.ts:848-849
          });
        }
      }
    }
  }
}
delete g.window;
// no window at all (`typeof window === 'undefined'` branch, cityMapStatChip.ts:150)
const noWindowRatio = bits(badgePixelRatio());

// 5. disposeCityMapBadgeTexturesForOtherLod — real function on a Map of fake textures.
const purge: Array<{ keys: string[]; lod: string; freed: number; kept: string[]; disposed: string[] }> = [];
const purgeKeySets: string[][] = [];
for (let i = 0; i < 60; i++) {
  const n = Math.floor(rnd() * 12);
  const ks: string[] = [];
  for (let j = 0; j < n; j++) {
    ks.push(cityMapBadgeKey({ ...base, cityName: pick(NAMES), population: 1 + Math.floor(rnd() * 9), lodLevel: pick(LODS) } as any));
  }
  ks.push('Ateny|3|l1x'); // suffix-match edge: does not end with `|l1`
  ks.push('noLodSuffix');
  purgeKeySets.push(ks);
}
for (const ks of purgeKeySets) {
  for (const lod of [0, 1, 2, 3, NaN]) {
    const disposed: string[] = [];
    const cache = new Map<string, any>();
    for (const k of ks) cache.set(k, { dispose() { disposed.push(k); } });
    const freed = disposeCityMapBadgeTexturesForOtherLod(cache, lod);
    purge.push({ keys: [...new Set(ks)], lod: bits(lod), freed, kept: [...cache.keys()], disposed });
  }
}

const out = {
  pin: 'edb8fb56',
  three: '0.169.0',
  node: process.version,
  noWindowRatio,
  badgeKeys,
  legacyKeys,
  growthLabels,
  sigilKeys,
  portraitKeys,
  prodKeys,
  emblemKeys,
  workerKeys,
  upgradeKeys,
  lodForDist,
  lodScale,
  lodSegment,
  ratios,
  scales,
  canvasSizes,
  purge,
};
fs.writeFileSync(path.join(OUT, 'atlas_keys.json'), JSON.stringify(out) + '\n');
console.log(
  'badgeKeys', badgeKeys.length, 'legacy', legacyKeys.length, 'growth', growthLabels.length,
  'portrait', portraitKeys.length, 'emblem', emblemKeys.length, 'canvasSizes', canvasSizes.length,
  'purge', purge.length,
);
