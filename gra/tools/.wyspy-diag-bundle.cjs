"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tools/.wyspy-diag-entry.ts
var wyspy_diag_entry_exports = {};
__export(wyspy_diag_entry_exports, {
  TerenBazowy: () => TerenBazowy,
  generujSwiat: () => generujSwiat
});
module.exports = __toCommonJS(wyspy_diag_entry_exports);

// src/types/hex.ts
var TerenBazowy = /* @__PURE__ */ ((TerenBazowy3) => {
  TerenBazowy3["Laka"] = "laka";
  TerenBazowy3["Rownina"] = "rownina";
  TerenBazowy3["Wzgorza"] = "wzgorza";
  TerenBazowy3["Gory"] = "gory";
  TerenBazowy3["Wybrzeze"] = "wybrzeze";
  TerenBazowy3["Morze"] = "morze";
  TerenBazowy3["Pustynia"] = "pustynia";
  return TerenBazowy3;
})(TerenBazowy || {});

// data/map-gen-params.json
var map_gen_params_default = {
  _meta: {
    opis: "Panel-A export \u2014 generator E2 + mg\u0142a. Kod czyta po P3 / handoff Integratora.",
    panel: "panele-sterowania/Panel-A.xlsx",
    export: "panele-sterowania/export-a.py"
  },
  mgla: {
    default_sight_jednostki: {
      wartosc: 3,
      opis: "Domy\u015Blny promie\u0144 wzroku jednostki"
    }
  },
  gestosc: {
    surowce_mult: {
      low: 0.6,
      medium: 1,
      high: 1.4
    },
    baseline_rarity_mult: 1.35,
    rzeki_max_mala_mapa: {
      low: 2,
      medium: 5,
      high: 12
    },
    river_scale: {
      mala: 1,
      srednia: 1.35,
      duza: 1.7,
      ogromna: 2.1,
      super: 2.6
    },
    desert_noise_threshold: {
      low: 0.68,
      medium: 0.63,
      high: 0.58
    },
    forest_noise_threshold: {
      low: 0.65,
      medium: 0.58,
      high: 0.5
    },
    mountain_noise_threshold: {
      low: 0.8,
      medium: 0.68,
      high: 0.52
    },
    highland_noise_threshold: {
      low: 0.66,
      medium: 0.5,
      high: 0.38
    },
    relief_land_fraction: {
      low: { mountain: 0.03, highland: 0.07 },
      medium: { mountain: 0.06, highland: 0.11 },
      high: { mountain: 0.12, highland: 0.18 }
    }
  },
  mapa_skala: {
    aktywne_typy: {
      mala: 3,
      srednia: 5,
      duza: 7,
      ogromna: 9,
      super: 11
    },
    domyslni_rywale: {
      mala: 2,
      srednia: 4,
      duza: 6,
      ogromna: 8,
      super: 10
    }
  },
  generator: {
    default_width: 36,
    default_height: 28,
    rozmiar_dims: {
      malenki: [76, 52],
      maly: [108, 74],
      standardowy: [168, 120],
      duzy: [240, 168],
      ogromny: [336, 238],
      superogromny: [672, 476]
    }
  },
  deposit_rules: {
    miedz: { rarity: 0.1 },
    zelazo: { rarity: 0.08 },
    glina: { rarity: 0.1 },
    konie: { rarity: 0.1 },
    wegiel: { rarity: 0.1 },
    owce: { rarity: 0.08 },
    bydlo: { rarity: 0.07 },
    lama: { rarity: 0.06 },
    luksus: { rarity: 0.06 },
    sol: { rarity: 0.12 }
  },
  metal_deposit_min_era: {
    miedz: 2,
    zelazo: 3
  }
};

// src/data/map-gen-params-loader.ts
var FALLBACK_ROZMIAR = {
  malenki: [76, 52],
  maly: [108, 74],
  standardowy: [168, 120],
  duzy: [240, 168],
  ogromny: [336, 238],
  superogromny: [672, 476]
};
var FALLBACK_RESOURCE_MULT = { low: 0.6, medium: 1, high: 1.4 };
var FALLBACK_BASELINE_RARITY = 1.35;
var FALLBACK_RIVERS = { low: 2, medium: 5, high: 12 };
var FALLBACK_RIVER_SCALE = {
  mala: 1,
  srednia: 1.35,
  duza: 1.7,
  ogromna: 2.1,
  super: 2.6
};
var FALLBACK_DESERT = { low: 0.68, medium: 0.63, high: 0.58 };
var FALLBACK_FOREST = { low: 0.65, medium: 0.58, high: 0.5 };
var FALLBACK_MOUNTAIN = { low: 0.8, medium: 0.68, high: 0.52 };
var FALLBACK_HIGHLAND = { low: 0.66, medium: 0.5, high: 0.38 };
var FALLBACK_DEPOSIT_RARITY = {
  miedz: 0.1,
  zelazo: 0.08,
  glina: 0.1,
  konie: 0.1,
  wegiel: 0.1,
  owce: 0.08,
  bydlo: 0.07,
  sol: 0.12
};
function tierKey(t) {
  return t;
}
function mapGenResourceMult(tier) {
  const m = map_gen_params_default.gestosc?.surowce_mult;
  return m?.[tierKey(tier)] ?? FALLBACK_RESOURCE_MULT[tier];
}
function mapGenResourceBaselineRarity() {
  const v = map_gen_params_default.gestosc?.baseline_rarity_mult;
  return typeof v === "number" && v > 0 ? v : FALLBACK_BASELINE_RARITY;
}
function mapGenMaxRiversBase(tier) {
  const g = map_gen_params_default.gestosc?.rzeki_max_mala_mapa;
  const k = tierKey(tier);
  if (g && typeof g[k] === "number") return g[k];
  return FALLBACK_RIVERS[tier];
}
function mapGenRiverScale(size) {
  const rs = map_gen_params_default.gestosc?.river_scale;
  const lut = {
    mala: "mala",
    srednia: "srednia",
    duza: "duza",
    ogromna: "ogromna",
    super: "super"
  };
  const v = rs?.[lut[size]];
  return typeof v === "number" && v > 0 ? v : FALLBACK_RIVER_SCALE[size];
}
function mapGenDesertThreshold(tier) {
  const d = map_gen_params_default.gestosc?.desert_noise_threshold;
  const k = tierKey(tier);
  if (d && typeof d[k] === "number") return d[k];
  return FALLBACK_DESERT[tier];
}
function mapGenForestThreshold(tier) {
  const f = map_gen_params_default.gestosc?.forest_noise_threshold;
  const k = tierKey(tier);
  if (f && typeof f[k] === "number") return f[k];
  return FALLBACK_FOREST[tier];
}
function mapGenMountainThreshold(tier) {
  const m = map_gen_params_default.gestosc?.mountain_noise_threshold;
  const k = tierKey(tier);
  if (m && typeof m[k] === "number") return m[k];
  return FALLBACK_MOUNTAIN[tier];
}
function mapGenHighlandThreshold(tier) {
  const h = map_gen_params_default.gestosc?.highland_noise_threshold;
  const k = tierKey(tier);
  if (h && typeof h[k] === "number") return h[k];
  return FALLBACK_HIGHLAND[tier];
}
function mapGenRozmiarDims() {
  const src = map_gen_params_default.generator?.rozmiar_dims;
  const out = { ...FALLBACK_ROZMIAR };
  if (!src) return out;
  for (const key of Object.keys(out)) {
    const pair = src[key];
    if (Array.isArray(pair) && pair.length >= 2 && pair.every((n) => typeof n === "number" && n > 0)) {
      out[key] = [pair[0], pair[1]];
    }
  }
  return out;
}
function mapGenAllDepositRarities() {
  const out = { ...FALLBACK_DEPOSIT_RARITY };
  const rules = map_gen_params_default.deposit_rules;
  if (rules) {
    for (const [id, row] of Object.entries(rules)) {
      if (typeof row?.rarity === "number" && row.rarity >= 0) out[id] = row.rarity;
    }
  }
  return out;
}

// src/map/gen-helpers.ts
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 1831565813;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function buildPermTable(rand) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  return p;
}
function cosLerp(a, b, t) {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}
function valueNoise2D(p, x, y) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const hash = (ix, iy) => p[p[ix & 255] + iy & 255] / 255;
  const v00 = hash(xi, yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi, yi + 1);
  const v11 = hash(xi + 1, yi + 1);
  const top = cosLerp(v00, v10, xf);
  const bottom = cosLerp(v01, v11, xf);
  return cosLerp(top, bottom, yf);
}
function fbm(p, x, y, octaves = 4) {
  let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise2D(p, x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxValue;
}
var HEX_DIRECTIONS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];
function hexDistanceAxial(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs(-aq - ar - (-bq - br));
  return Math.max(dq, dr, ds);
}
function hexKey(q, r) {
  return `${q},${r}`;
}
function defaultShapeParams(rand) {
  return {
    noiseScale: 0.13,
    mountainScale: 0.22,
    forestScale: 0.19,
    desertScale: 0.17,
    offMtnX: rand() * 500,
    offMtnY: rand() * 500,
    offForX: rand() * 500,
    offForY: rand() * 500,
    offDesX: rand() * 500,
    offDesY: rand() * 500
  };
}
var KONTYNENTY_ZONE_COUNT = 5;
function continentCenterCount(width, height, typ) {
  if (typ === "kontynenty") return KONTYNENTY_ZONE_COUNT;
  const area = width * height;
  return area < 2e3 ? 2 : area < 6e3 ? 3 : 4;
}
function buildContinentCenters(rand, n, opts) {
  const radiusMin = opts?.radiusMin ?? 0.28;
  const radiusMax = opts?.radiusMax ?? 0.4;
  const minDist = opts?.minCenterDist ?? 0;
  const w = opts?.width ?? 120;
  const h = opts?.height ?? 80;
  const borderMargin = Math.max(
    mapBorderWidth(w, h) / Math.max(1, w - 1),
    mapBorderWidth(w, h) / Math.max(1, h - 1),
    0.12
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const centers = [];
  const pushCenter = (nq, nr, radius) => {
    const cnq = clamp01(nq);
    const cnr = clamp01(nr);
    if (minDist > 0) {
      for (const c of centers) {
        if (Math.hypot(cnq - c.nq, cnr - c.nr) < minDist) return false;
      }
    }
    centers.push({
      nq: cnq,
      nr: cnr,
      radius: radius ?? radiusMin + rand() * (radiusMax - radiusMin)
    });
    return true;
  };
  if (opts?.anchorCenter !== false && n >= 1) {
    pushCenter(0.5, 0.5, radiusMin + (radiusMax - radiusMin) * 0.5);
  }
  const ringRMin = opts?.ringRadiusMin ?? 0.16;
  const ringRMax = opts?.ringRadiusMax ?? 0.32;
  const ringSlots = n - centers.length;
  for (let i = 0; i < ringSlots; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt++) {
      const angle = 2 * Math.PI * i / Math.max(1, ringSlots) + (rand() - 0.5) * 0.45;
      const ringR = ringRMin + rand() * (ringRMax - ringRMin);
      if (pushCenter(0.5 + Math.cos(angle) * ringR, 0.5 + Math.sin(angle) * ringR)) {
        placed = true;
      }
    }
    if (!placed) {
      pushCenter(
        borderMargin + rand() * (1 - 2 * borderMargin),
        borderMargin + rand() * (1 - 2 * borderMargin)
      );
    }
  }
  return centers;
}
function buildFiveZoneContinentCenters(rand, width, height, radiusMin, radiusMax) {
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.14
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const jitter = () => (rand() - 0.5) * 0.035;
  const pickR = () => radiusMin + rand() * (radiusMax - radiusMin);
  const inset = borderMargin + 0.06;
  return [
    { nq: clamp01(0.5 + jitter()), nr: clamp01(0.5 + jitter()), radius: pickR() },
    { nq: clamp01(inset + jitter()), nr: clamp01(inset + jitter()), radius: pickR() },
    { nq: clamp01(1 - inset + jitter()), nr: clamp01(inset + jitter()), radius: pickR() },
    { nq: clamp01(1 - inset + jitter()), nr: clamp01(1 - inset + jitter()), radius: pickR() },
    { nq: clamp01(inset + jitter()), nr: clamp01(1 - inset + jitter()), radius: pickR() }
  ];
}
function nearestContinentZoneIndex(nq, nr, centers) {
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    const d = Math.hypot(nq - c.nq, nr - c.nr);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return bestI;
}
function secondNearestContinentDist(nq, nr, centers) {
  const dists = centers.map((c) => Math.hypot(nq - c.nq, nr - c.nr)).sort((a, b) => a - b);
  return dists[1] ?? Infinity;
}
function landMaskKontynenty(q, r, width, height, centers, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const borderFade = landMaskBorderFade(q, r, width, height);
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  if (borderFade <= 0 || edgeRect <= 0) return 0;
  const zoneIdx = nearestContinentZoneIndex(nq, nr, centers);
  const c = centers[zoneIdx];
  const distC = Math.hypot(nq - c.nq, nr - c.nr);
  const dist2 = secondNearestContinentDist(nq, nr, centers);
  if (dist2 - distC < 0.018) return 0;
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.55));
  const warpCoarse = fbm(perm, q * noiseScale * 0.55 + 100, r * noiseScale * 0.55 + 100, 4) * 0.24;
  const warpFine = fbm(perm, q * noiseScale * 1.45 + 510, r * noiseScale * 1.45 + 510, 3) * 0.16;
  const angle = Math.atan2(nr - c.nr, nq - c.nq);
  const angleNoise = fbm(perm, Math.cos(angle) * 4 + zoneIdx * 11, Math.sin(angle) * 4 + 220, 2) * 0.1;
  return Math.min(1, Math.max(0, (radial + warpCoarse + warpFine + angleNoise - 0.09) * borderFade * edgeRect));
}
function landMaskPangea(q, r, width, height, perm, noiseScale, sparseLand = false) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radialDiv = sparseLand ? 0.42 : 0.82;
  const radialPow = sparseLand ? 2.35 : 1.6;
  const radial = Math.max(0, 1 - Math.pow(dist / radialDiv, radialPow));
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  const centerBias = sparseLand ? 1 : mapCenterRadialBias(q, r, width, height);
  const warp = fbm(perm, q * noiseScale * 0.6 + 200, r * noiseScale * 0.6 + 200, 3) * (sparseLand ? 0.18 : 0.3);
  const borderFade = landMaskBorderFade(q, r, width, height);
  return Math.min(1, Math.max(0, (radial + warp - (sparseLand ? 0.12 : 0.05)) * edgeRect * borderFade * centerBias));
}
var ISLAND_GRID_DIVISIONS = 4;
function buildSixteenGridIslandCenters(rand, width, height) {
  const GRID = ISLAND_GRID_DIVISIONS;
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.08
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const cellFrac = 1 / GRID;
  const mapScale = Math.sqrt(width * height / 8e3);
  const sizeMul = Math.min(1.14, Math.max(0.86, 0.92 + mapScale * 0.07));
  const baseR = cellFrac * 0.4 * sizeMul;
  const jitter = () => (rand() - 0.5) * cellFrac * 0.32;
  const centers = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      centers.push({
        nq: clamp01((col + 0.5) * cellFrac + jitter()),
        nr: clamp01((row + 0.5) * cellFrac + jitter()),
        radius: baseR * (0.76 + rand() * 0.34)
      });
    }
  }
  return centers;
}
function landMaskWyspy(q, r, width, height, centers, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const borderFade = landMaskBorderFade(q, r, width, height);
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  if (borderFade <= 0 || edgeRect <= 0) return 0;
  const zoneIdx = nearestContinentZoneIndex(nq, nr, centers);
  const c = centers[zoneIdx];
  const distC = Math.hypot(nq - c.nq, nr - c.nr);
  const dist2 = secondNearestContinentDist(nq, nr, centers);
  if (dist2 - distC < 0.028) return 0;
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.78));
  const warpCoarse = fbm(perm, q * noiseScale * 0.62 + 350, r * noiseScale * 0.62 + 350, 4) * 0.2;
  const warpFine = fbm(perm, q * noiseScale * 1.55 + 620, r * noiseScale * 1.55 + 620, 3) * 0.12;
  const angle = Math.atan2(nr - c.nr, nq - c.nq);
  const angleNoise = fbm(perm, Math.cos(angle) * 5 + zoneIdx * 7, Math.sin(angle) * 5 + 330, 2) * 0.08;
  return Math.min(1, Math.max(0, (radial + warpCoarse + warpFine + angleNoise - 0.11) * borderFade * edgeRect));
}
var ZIEMIA_LAND_CENTERS = [
  { nq: 0.17, nr: 0.32, radius: 0.15 },
  { nq: 0.22, nr: 0.58, radius: 0.11 },
  { nq: 0.48, nr: 0.26, radius: 0.13 },
  { nq: 0.6, nr: 0.34, radius: 0.19 },
  { nq: 0.5, nr: 0.52, radius: 0.12 },
  { nq: 0.8, nr: 0.66, radius: 0.08 }
];
function landMaskZiemia(q, r, width, height, perm, noiseScale) {
  const raw = landMaskKontynenty(q, r, width, height, ZIEMIA_LAND_CENTERS, perm, noiseScale * 0.85);
  return Math.min(1, Math.max(0, raw * 1.05 - 0.02));
}
function reliefElevGates(mtnTh) {
  if (mtnTh <= 0.55) {
    return { mountain: 0.1, highland: 0.08, landMaskHi: 0.12, landMaskMtn: 0.15 };
  }
  if (mtnTh >= 0.75) {
    return { mountain: 0.22, highland: 0.18, landMaskHi: 0.3, landMaskMtn: 0.35 };
  }
  return { mountain: 0.14, highland: 0.11, landMaskHi: 0.2, landMaskMtn: 0.22 };
}
function classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise, thresholds) {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = thresholds?.forest ?? 0.58;
  const mtnTh = thresholds?.mountain ?? 0.75;
  const hiTh = thresholds?.highland ?? 0.6;
  const elevG = reliefElevGates(mtnTh);
  let terenBazowy;
  let nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = landMask < 0.22 ? "morze" /* Morze */ : "laka" /* Laka */;
  } else {
    const isHighlands = mtnNoise > hiTh && landMask > elevG.landMaskHi;
    const isMountain = mtnNoise > mtnTh && landMask > elevG.landMaskMtn;
    if (isMountain && elevContinental > elevG.mountain) {
      terenBazowy = "gory" /* Gory */;
    } else if (isHighlands && elevContinental > elevG.highland) {
      terenBazowy = "wzgorza" /* Wzgorza */;
    } else if (desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
      terenBazowy = "pustynia" /* Pustynia */;
    } else if (elevContinental > 0.35) {
      terenBazowy = "rownina" /* Rownina */;
    } else {
      terenBazowy = "laka" /* Laka */;
    }
    if (terenBazowy !== "gory" /* Gory */ && terenBazowy !== "pustynia" /* Pustynia */ && forNoise > forTh && (landMask > 0.04 || elevContinental > 0.14)) {
      nakladka = "las" /* Las */;
    }
  }
  return { terenBazowy, nakladka };
}
function classifyTerrainFlat(elevContinental, landMask, _mtnNoise, forNoise, desNoise, thresholds) {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = thresholds?.forest ?? 0.58;
  let terenBazowy;
  let nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = "laka" /* Laka */;
  } else if (desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
    terenBazowy = "pustynia" /* Pustynia */;
  } else if (elevContinental > 0.35) {
    terenBazowy = "rownina" /* Rownina */;
  } else {
    terenBazowy = "laka" /* Laka */;
  }
  if (terenBazowy !== "pustynia" /* Pustynia */ && forNoise > forTh && (landMask > 0.04 || elevContinental > 0.14)) {
    nakladka = "las" /* Las */;
  }
  return { terenBazowy, nakladka };
}
function reapplyForestOverlay(hexes, scratch, thresholds, typ, forestTier, continentOf, nContinents) {
  const share = FOREST_SHARE_OF_DRY_LAND[forestTier];
  for (const hex of Object.values(hexes)) {
    if (hex.nakladka === "las" /* Las */) hex.nakladka = "brak" /* Brak */;
  }
  let assigned = 0;
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  for (const part of partitions) {
    const eligible = part.filter((k) => {
      const h = hexes[k];
      return h && isForestEligibleTerrain(h.terenBazowy) && h.nakladka === "brak" /* Brak */;
    }).map((k) => ({ k, n: scratch.get(k)?.forNoise ?? 0 })).sort((a, b) => b.n - a.n);
    if (eligible.length === 0) continue;
    const minForest = typ === "pangea" ? 0 : Math.min(3, eligible.length);
    const target = Math.max(minForest, Math.round(eligible.length * share));
    for (let i = 0; i < Math.min(target, eligible.length); i++) {
      hexes[eligible[i].k].nakladka = "las" /* Las */;
      assigned++;
    }
  }
  return assigned;
}
function reapplyLandTerrain(hexes, scratch, thresholds) {
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      continue;
    }
    const s = scratch.get(key);
    if (!s) continue;
    const { terenBazowy, nakladka } = classifyTerrainFlat(
      s.elevContinental,
      s.landMask,
      s.mtnNoise,
      s.forNoise,
      s.desNoise,
      thresholds
    );
    hex.terenBazowy = terenBazowy;
    hex.nakladka = nakladka;
  }
}
var FALLBACK_RELIEF_FRAC = {
  low: { mountain: 0.03, highland: 0.07 },
  medium: { mountain: 0.06, highland: 0.11 },
  high: { mountain: 0.12, highland: 0.18 }
};
function reliefLandFractions(tier) {
  return { ...FALLBACK_RELIEF_FRAC[tier] };
}
var MAP_BORDER_OCEAN_HEXES = 10;
function mapBorderWidth(_width, _height) {
  return MAP_BORDER_OCEAN_HEXES;
}
function landMaskBorderFade(q, r, width, height) {
  const b = mapBorderWidth(width, height);
  const d = hexBorderDistance(q, r, width, height);
  if (d < b) return 0;
  const fadeW = 4;
  if (d < b + fadeW) return (d - b) / fadeW;
  return 1;
}
function mapCenterRadialBias(q, r, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0.12, 1 - Math.pow(dist / 0.94, 2));
}
function mapEdgeRectFade(q, r, width, height) {
  const b = mapBorderWidth(width, height);
  const nq = q / Math.max(1, width - 1);
  const nr = r / Math.max(1, height - 1);
  const marginQ = b / Math.max(1, width - 1);
  const marginR = b / Math.max(1, height - 1);
  return Math.min(
    Math.min(nq, 1 - nq) / Math.max(marginQ, 1e-3),
    Math.min(nr, 1 - nr) / Math.max(marginR, 1e-3),
    1
  );
}
function mapCenterDistanceNorm(q, r, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  return Math.sqrt(dx * dx + dy * dy);
}
function hexBorderDistance(q, r, width, height) {
  return Math.min(q, r, width - 1 - q, height - 1 - r);
}
function isInMapBorder(q, r, width, height, buffer) {
  const b = buffer ?? mapBorderWidth(width, height);
  return hexBorderDistance(q, r, width, height) < b;
}
function isReliefCandidateHex(hex, q, r, width, height) {
  if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
    return false;
  }
  return !isInMapBorder(q, r, width, height);
}
function enforceMapBorderOcean(hexes, width, height, buffer) {
  const b = buffer ?? mapBorderWidth(width, height);
  let converted = 0;
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (!isInMapBorder(q, r, width, height, b)) continue;
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
      setHexToMorze(hex);
      converted++;
    }
  }
  return converted;
}
function groupLandMassKeys(hexes) {
  const visited = /* @__PURE__ */ new Set();
  const groups = [];
  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
    if (visited.has(key)) continue;
    const mass = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop();
      mass.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || nh.terenBazowy === "morze" /* Morze */) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups;
}
function isForestEligibleTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */ && tb !== "gory" /* Gory */ && tb !== "pustynia" /* Pustynia */;
}
function landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents) {
  if ((typ === "kontynenty" || typ === "wyspy") && continentOf && nContinents > 0) {
    const zones = Array.from({ length: nContinents }, () => []);
    for (const key of Object.keys(hexes)) {
      const hex = hexes[key];
      if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
      const ci = Math.min(nContinents - 1, Math.max(0, continentOf.get(key) ?? 0));
      zones[ci].push(key);
    }
    return zones.filter((z) => z.length > 0);
  }
  return groupLandMassKeys(hexes);
}
var FOREST_SHARE_OF_DRY_LAND = {
  low: 0.22,
  medium: 0.36,
  high: 0.5
};
function applyReliefToLandKeys(hexes, scratch, tier, keys) {
  if (keys.length === 0) return;
  const fr = reliefLandFractions(tier);
  const sorted = [...keys].sort(
    (a, b) => (scratch.get(b)?.mtnNoise ?? 0) - (scratch.get(a)?.mtnNoise ?? 0)
  );
  const minMtn = keys.length >= 120 ? 2 : keys.length >= 40 ? 1 : 0;
  const nMtn = Math.max(minMtn, Math.round(sorted.length * fr.mountain));
  const nHi = Math.max(0, Math.round(sorted.length * fr.highland));
  const cap = Math.min(sorted.length, nMtn + nHi);
  for (let i = 0; i < cap; i++) {
    const key = sorted[i];
    const hex = hexes[key];
    if (i < nMtn) {
      hex.terenBazowy = "gory" /* Gory */;
      hex.nakladka = "brak" /* Brak */;
    } else {
      hex.terenBazowy = "wzgorza" /* Wzgorza */;
      hex.nakladka = "brak" /* Brak */;
    }
  }
}
function applyReliefByNoiseRank(hexes, scratch, tier, width, height, typ = "pangea", continentOf = null, nContinents = 0) {
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  for (const part of partitions) {
    const keys = part.filter((key) => {
      const hex = hexes[key];
      if (!hex) return false;
      const { q, r } = parseHexKey(key);
      return isReliefCandidateHex(hex, q, r, width, height);
    });
    applyReliefToLandKeys(hexes, scratch, tier, keys);
  }
}
function assignContinentIndices(width, height, centers) {
  const map = /* @__PURE__ */ new Map();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const nq = q / Math.max(1, width - 1);
      const nr = r / Math.max(1, height - 1);
      map.set(hexKey(q, r), nearestContinentZoneIndex(nq, nr, centers));
    }
  }
  return map;
}
function parseHexKey(key) {
  const parts = key.split(",");
  return { q: Number(parts[0]), r: Number(parts[1]) };
}
function sortLandKeysForErosion(keys, hexes, landScores, width, height) {
  return [...keys].sort((a, b) => {
    const pa = parseHexKey(a);
    const pb = parseHexKey(b);
    const ba = hexBorderDistance(pa.q, pa.r, width, height);
    const bb = hexBorderDistance(pb.q, pb.r, width, height);
    if (ba !== bb) return ba - bb;
    const ca = mapCenterDistanceNorm(pa.q, pa.r, width, height);
    const cb = mapCenterDistanceNorm(pb.q, pb.r, width, height);
    if (Math.abs(ca - cb) > 0.015) return cb - ca;
    const na = countMorseNeighbors(hexes, pa.q, pa.r);
    const nb = countMorseNeighbors(hexes, pb.q, pb.r);
    if (na !== nb) return nb - na;
    const ra = erodeTerrainRank(hexes[a].terenBazowy);
    const rb = erodeTerrainRank(hexes[b].terenBazowy);
    if (ra !== rb) return ra - rb;
    return (landScores.get(a) ?? 0) - (landScores.get(b) ?? 0);
  });
}
function isLandTerrain(tb) {
  return tb === "laka" /* Laka */ || tb === "rownina" /* Rownina */ || tb === "wzgorza" /* Wzgorza */ || tb === "pustynia" /* Pustynia */;
}
function isLandOrCoast(tb) {
  return tb !== "morze" /* Morze */;
}
function defaultLandFractionForTyp(_typ) {
  return 0.2;
}
function countLandSeaHexes(hexes) {
  let land = 0;
  let sea = 0;
  for (const h of Object.values(hexes)) {
    if (h.terenBazowy === "morze" /* Morze */) sea++;
    else land++;
  }
  return { land, sea, total: land + sea };
}
var ERODE_TERRAIN_ORDER = [
  "wybrzeze" /* Wybrzeze */,
  "laka" /* Laka */,
  "pustynia" /* Pustynia */,
  "rownina" /* Rownina */,
  "wzgorza" /* Wzgorza */,
  "gory" /* Gory */
];
function erodeTerrainRank(tb) {
  const i = ERODE_TERRAIN_ORDER.indexOf(tb);
  return i >= 0 ? i : ERODE_TERRAIN_ORDER.length;
}
function countMorseNeighbors(hexes, q, r) {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh?.terenBazowy === "morze" /* Morze */) n++;
  }
  return n;
}
function countLandNeighbors(hexes, q, r) {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && nh.terenBazowy !== "morze" /* Morze */) n++;
  }
  return n;
}
function isCoastalLandHex(hexes, q, r) {
  const h = hexes[hexKey(q, r)];
  if (!h || h.terenBazowy === "morze" /* Morze */) return false;
  return countMorseNeighbors(hexes, q, r) > 0;
}
function isCoastalMorseHex(hexes, q, r) {
  const h = hexes[hexKey(q, r)];
  if (h?.terenBazowy !== TerenBazowy.Morse) return false;
  return countLandNeighbors(hexes, q, r) > 0;
}
function setHexToMorze(hex) {
  hex.terenBazowy = "morze" /* Morze */;
  hex.nakladka = "brak" /* Brak */;
  hex.rzeka = { obecna: false, krawedzie: [] };
  delete hex.zloze;
}
function setHexToLaka(hex) {
  hex.terenBazowy = "laka" /* Laka */;
  hex.nakladka = "brak" /* Brak */;
  delete hex.zloze;
}
function applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const keys = Object.keys(hexes);
  const total = keys.length;
  const targetLand = Math.round(total * clamped);
  let { land } = countLandSeaHexes(hexes);
  let adjusted = 0;
  const hasBorder = width != null && height != null && width > 0 && height > 0;
  const borderOk = (k) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return !isInMapBorder(q, r, width, height);
  };
  if (land < targetLand) {
    const morseCandidates = keys.filter((k) => hexes[k].terenBazowy === "morze" /* Morze */ && borderOk(k)).sort((a, b) => {
      const sa = landScores.get(a) ?? 0;
      const sb = landScores.get(b) ?? 0;
      if (Math.abs(sb - sa) > 0.04) return sb - sa;
      const pa = parseHexKey(a);
      const pb = parseHexKey(b);
      const da = hasBorder ? mapCenterDistanceNorm(pa.q, pa.r, width, height) : 0;
      const db = hasBorder ? mapCenterDistanceNorm(pb.q, pb.r, width, height) : 0;
      return da - db;
    });
    for (const k of morseCandidates) {
      if (land >= targetLand) break;
      setHexToLaka(hexes[k]);
      land++;
      adjusted++;
    }
  } else if (land > targetLand) {
    const landCandidates = sortLandKeysForErosion(
      keys.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */),
      hexes,
      landScores,
      width ?? 1,
      height ?? 1
    );
    for (const k of landCandidates) {
      if (land <= targetLand) break;
      setHexToMorze(hexes[k]);
      land--;
      adjusted++;
    }
  }
  return adjusted;
}
function applyLandFractionByContinent(hexes, landScores, continentOf, nContinents, targetLandFraction, width, height) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total = Object.keys(hexes).length;
  const targetLand = Math.round(total * clamped);
  const zoneKeys = Array.from({ length: nContinents }, () => []);
  for (const k of Object.keys(hexes)) {
    const raw = continentOf.get(k) ?? 0;
    const ci = Math.min(nContinents - 1, Math.max(0, raw));
    zoneKeys[ci].push(k);
  }
  const scoreSums = zoneKeys.map(
    (keys) => keys.reduce((s, k) => s + (landScores.get(k) ?? 0), 0)
  );
  const totalScore = scoreSums.reduce((a, b) => a + b, 0) || 1;
  let assigned = 0;
  let adjusted = 0;
  const hasBorder = width != null && height != null && width > 0 && height > 0;
  const borderOk = (k) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return !isInMapBorder(q, r, width, height);
  };
  for (let ci = 0; ci < nContinents; ci++) {
    const keys = zoneKeys[ci];
    const quota = ci === nContinents - 1 ? targetLand - assigned : Math.round(targetLand * (scoreSums[ci] / totalScore));
    assigned += quota;
    let land = keys.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */).length;
    if (land < quota) {
      const morseCandidates = keys.filter((k) => hexes[k].terenBazowy === "morze" /* Morze */ && borderOk(k)).sort((a, b) => {
        const sa = landScores.get(a) ?? 0;
        const sb = landScores.get(b) ?? 0;
        if (Math.abs(sb - sa) > 0.04) return sb - sa;
        const pa = parseHexKey(a);
        const pb = parseHexKey(b);
        const da = hasBorder ? mapCenterDistanceNorm(pa.q, pa.r, width, height) : 0;
        const db = hasBorder ? mapCenterDistanceNorm(pb.q, pb.r, width, height) : 0;
        return da - db;
      });
      for (const k of morseCandidates) {
        if (land >= quota) break;
        setHexToLaka(hexes[k]);
        land++;
        adjusted++;
      }
    } else if (land > quota) {
      const landCandidates = sortLandKeysForErosion(
        keys.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */),
        hexes,
        landScores,
        width ?? 1,
        height ?? 1
      );
      for (const k of landCandidates) {
        if (land <= quota) break;
        setHexToMorze(hexes[k]);
        land--;
        adjusted++;
      }
    }
  }
  const { land: finalLand } = countLandSeaHexes(hexes);
  if (finalLand !== targetLand) {
    adjusted += applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
  }
  return adjusted;
}
function isDryLandTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */;
}
function applyCoastRing(hexes) {
  const toCoast = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === "morze" /* Morze */) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) hexes[key].terenBazowy = "wybrzeze" /* Wybrzeze */;
  return toCoast.length;
}
function applyDoubleCoastRing(hexes) {
  let n = applyCoastRing(hexes);
  const toCoast = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === "wybrzeze" /* Wybrzeze */) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) hexes[key].terenBazowy = "wybrzeze" /* Wybrzeze */;
  return n + toCoast.length;
}
function findDryLandTouchingSea(hexes) {
  const bad = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === "morze" /* Morze */) {
        bad.push(key);
        break;
      }
    }
  }
  return bad;
}
function sanitizeCoastHexes(hexes) {
  const valid = /* @__PURE__ */ new Set();
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb && isDryLandTerrain(nb.terenBazowy)) {
        valid.add(key);
        break;
      }
    }
  }
  let propagated = true;
  while (propagated) {
    propagated = false;
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */ || valid.has(key)) continue;
      const parts = key.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (hexes[nk]?.terenBazowy === "wybrzeze" /* Wybrzeze */ && valid.has(nk)) {
          valid.add(key);
          propagated = true;
          break;
        }
      }
    }
  }
  let fixed = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    const touchesSea = HEX_DIRECTIONS.some(
      ([dq, dr]) => hexes[hexKey(q + dq, r + dr)]?.terenBazowy === "morze" /* Morze */
    );
    if (!valid.has(key)) {
      hex.terenBazowy = "morze" /* Morze */;
      hex.nakladka = "brak" /* Brak */;
      delete hex.zloze;
      fixed++;
      continue;
    }
    if (!touchesSea) {
      hex.terenBazowy = "laka" /* Laka */;
      fixed++;
    }
  }
  return fixed;
}
function oceanConnectedWaterKeys(hexes, width, height) {
  const connected = /* @__PURE__ */ new Set();
  const queue = [];
  const isOceanWater = (tb) => tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */;
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (q !== 0 && r !== 0 && q !== width - 1 && r !== height - 1) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (!hex || !isOceanWater(hex.terenBazowy)) continue;
      connected.add(key);
      queue.push(key);
    }
  }
  while (queue.length > 0) {
    const key = queue.pop();
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      const nh = hexes[nk];
      if (!nh || !isOceanWater(nh.terenBazowy) || connected.has(nk)) continue;
      connected.add(nk);
      queue.push(nk);
    }
  }
  return connected;
}
function findInlandWaterHexes(hexes, width, height) {
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  return Object.entries(hexes).filter(([k, h]) => {
    const tb = h.terenBazowy;
    return (tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */) && !ocean.has(k);
  }).map(([k]) => k);
}
function removeInlandWaterPools(hexes, width, height) {
  const inland = findInlandWaterHexes(hexes, width, height);
  for (const key of inland) {
    const hex = hexes[key];
    hex.terenBazowy = "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
  }
  return inland.length;
}
function fillEnclosedWaterByLandNeighbors(hexes, minLandNeighbors = 5) {
  let total = 0;
  for (let pass = 0; pass < 8; pass++) {
    let n = 0;
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) {
        continue;
      }
      const { q, r } = parseHexKey(key);
      if (countLandNeighbors(hexes, q, r) < minLandNeighbors) continue;
      hex.terenBazowy = "laka" /* Laka */;
      hex.nakladka = "brak" /* Brak */;
      hex.rzeka = { obecna: false, krawedzie: [] };
      delete hex.zloze;
      n++;
    }
    total += n;
    if (n === 0) break;
  }
  return total;
}
function purgeInlandWaterForMultiLandTyp(hexes, width, height) {
  let n = fillEnclosedWaterByLandNeighbors(hexes, 5);
  n += removeInlandWaterPools(hexes, width, height);
  n += trimEnclosedOceanOnly(hexes, width, height);
  n += fillEnclosedWaterByLandNeighbors(hexes, 4);
  n += removeInlandWaterPools(hexes, width, height);
  return n;
}
function applyJaggedCoastNoise(hexes, perm, width, height, passes = 2) {
  const noiseScale = 0.28;
  let changed = 0;
  for (let pass = 0; pass < passes; pass++) {
    const toErode = [];
    const toFill = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        if (isInMapBorder(q, r, width, height)) continue;
        const key = hexKey(q, r);
        const hex = hexes[key];
        if (!hex) continue;
        const coarse = fbm(perm, q * noiseScale + pass * 17, r * noiseScale + pass * 31, 4);
        const fine = fbm(perm, q * noiseScale * 2.1 + 200, r * noiseScale * 2.1 + 200, 3) * 0.35;
        const coast = coarse + fine;
        if (hex.terenBazowy !== "morze" /* Morze */ && isCoastalLandHex(hexes, q, r)) {
          if (coast > 0.68) toErode.push(key);
        } else if (hex.terenBazowy === "morze" /* Morze */ && isCoastalMorseHex(hexes, q, r)) {
          if (coast < 0.32) toFill.push(key);
        }
      }
    }
    for (const key of toErode) {
      setHexToMorze(hexes[key]);
      changed++;
    }
    for (const key of toFill) {
      setHexToLaka(hexes[key]);
      changed++;
    }
  }
  return changed;
}
function removeSmallInlandWaterPools(hexes, width, height, maxPoolSize) {
  const inlandSet = new Set(findInlandWaterHexes(hexes, width, height));
  const visited = /* @__PURE__ */ new Set();
  let converted = 0;
  for (const start of inlandSet) {
    if (visited.has(start)) continue;
    const comp = [];
    const stack = [start];
    visited.add(start);
    while (stack.length > 0) {
      const key = stack.pop();
      comp.push(key);
      const parts = key.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!inlandSet.has(nk) || visited.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    if (comp.length > maxPoolSize) continue;
    for (const key of comp) {
      const hex = hexes[key];
      hex.terenBazowy = "laka" /* Laka */;
      hex.nakladka = "brak" /* Brak */;
      delete hex.zloze;
      converted++;
    }
  }
  return converted;
}
function removeInlandSeaPools(hexes, width, height) {
  return removeInlandWaterPools(hexes, width, height);
}
function maxOceanBayDepth(width, height) {
  const border = mapBorderWidth(width, height);
  const scaled = Math.floor(Math.min(width, height) / 6);
  return Math.max(border + 2, Math.min(border + 14, scaled));
}
function morseDepthFromMapBorder(hexes, width, height) {
  const dist = /* @__PURE__ */ new Map();
  const queue = [];
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const onBorder = q === 0 || r === 0 || q === width - 1 || r === height - 1;
      if (!onBorder) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (hex?.terenBazowy !== "morze" /* Morze */) continue;
      dist.set(key, 0);
      queue.push(key);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const key = queue[head++];
    const d = dist.get(key);
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      const nh = hexes[nk];
      if (nh?.terenBazowy !== "morze" /* Morze */) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}
function trimEnclosedOceanOnly(hexes, width, height) {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */) continue;
    if (depth.has(key)) continue;
    hex.terenBazowy = "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
    converted++;
  }
  return converted;
}
function trimDeepOceanBays(hexes, width, height, maxDepth) {
  const limit = maxDepth ?? maxOceanBayDepth(width, height);
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */) continue;
    const d = depth.get(key);
    if (d !== void 0 && d <= limit) continue;
    hex.terenBazowy = "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
    converted++;
  }
  return converted;
}
function finalizeCoastAndInlandWater(hexes, width, height, maxPasses = 3, opts) {
  for (let pass = 0; pass < maxPasses; pass++) {
    if (opts?.maxInlandPoolSize != null) {
      removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      removeInlandWaterPools(hexes, width, height);
    }
    applyDoubleCoastRing(hexes);
    sanitizeCoastHexes(hexes);
    if (opts?.maxInlandPoolSize != null) {
      removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      removeInlandWaterPools(hexes, width, height);
    }
    if (findInlandWaterHexes(hexes, width, height).length === 0 && findDryLandTouchingSea(hexes).length === 0) {
      break;
    }
  }
}
function removeTinyLandIslands(hexes, minHexes) {
  const visited = /* @__PURE__ */ new Set();
  let removed = 0;
  for (const key of Object.keys(hexes)) {
    if (visited.has(key)) continue;
    const h = hexes[key];
    if (!h || !isLandOrCoast(h.terenBazowy)) continue;
    const stack = [key];
    const comp = [];
    visited.add(key);
    while (stack.length > 0) {
      const cur = stack.pop();
      comp.push(cur);
      const parts = cur.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isLandOrCoast(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    if (comp.length >= minHexes) continue;
    for (const k of comp) {
      const hx = hexes[k];
      if (!hx) continue;
      hx.terenBazowy = "morze" /* Morze */;
      hx.nakladka = "brak" /* Brak */;
      hx.rzeka = { obecna: false, krawedzie: [] };
      delete hx.zloze;
      removed++;
    }
  }
  return removed;
}
var ELEVATION_RANK = {
  ["morze" /* Morze */]: 0,
  ["wybrzeze" /* Wybrzeze */]: 1,
  ["laka" /* Laka */]: 2,
  ["pustynia" /* Pustynia */]: 3,
  ["rownina" /* Rownina */]: 4,
  ["wzgorza" /* Wzgorza */]: 5,
  ["gory" /* Gory */]: 6
};
function riversQuotaForLandMass(landHexCount, tier = "medium") {
  if (landHexCount < 8) return 0;
  if (landHexCount < 14) return 1;
  const hexPerRiver = tier === "high" ? 22 : tier === "low" ? 72 : 36;
  const cap = tier === "high" ? 16 : tier === "low" ? 5 : 10;
  return Math.min(cap, Math.max(1, Math.round(landHexCount / hexPerRiver)));
}
function hexAxialDistance(q1, r1, q2, r2) {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}
function buildSeaDistanceField(hexes) {
  const dist = /* @__PURE__ */ new Map();
  const queue = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      dist.set(key, 0);
      queue.push(key);
    }
  }
  let qi = 0;
  while (qi < queue.length) {
    const key = queue[qi++];
    const d = dist.get(key);
    const { q, r } = parseHexKey(key);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      if (!hexes[nk]) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}
function isReliefRiverSource(t) {
  return t === "gory" /* Gory */ || t === "wzgorza" /* Wzgorza */;
}
function pathEndsAtSea(hexes, path) {
  if (path.length === 0) return false;
  const last = path[path.length - 1];
  const h = hexes[hexKey(last.q, last.r)];
  if (!h) return false;
  if (h.terenBazowy === "wybrzeze" /* Wybrzeze */ || h.terenBazowy === "morze" /* Morze */) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(last.q + dq, last.r + dr)];
    if (nh?.terenBazowy === "wybrzeze" /* Wybrzeze */ || nh?.terenBazowy === "morze" /* Morze */) return true;
  }
  return false;
}
function isReliefTerrain(t) {
  return t === "gory" /* Gory */ || t === "wzgorza" /* Wzgorza */;
}
function canRiverFlowThrough(hex, cellKey, sourceKey) {
  if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
  if (isReliefTerrain(hex.terenBazowy)) return cellKey === sourceKey;
  return true;
}
function riverStepDir(from, to) {
  return [to.q - from.q, to.r - from.r];
}
function sameRiverDir(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
function reconstructRiverPath(cameFrom, endK) {
  const path = [];
  let cur = endK;
  while (cur) {
    const { q, r } = parseHexKey(cur);
    path.push({ q, r });
    cur = cameFrom.get(cur);
  }
  path.reverse();
  return path;
}
function aStarRiverToSea(hexes, sq, sr, seaDist, maxLen) {
  const startK = hexKey(sq, sr);
  const h0 = seaDist.get(startK);
  if (h0 == null) return [];
  if (h0 === 0) return [{ q: sq, r: sr }];
  const gScore = /* @__PURE__ */ new Map([[startK, 0]]);
  const cameFrom = /* @__PURE__ */ new Map();
  const open = /* @__PURE__ */ new Set([startK]);
  const fScore = /* @__PURE__ */ new Map([[startK, h0]]);
  let bestK = startK;
  let bestH = h0;
  while (open.size > 0) {
    let current = "";
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = k;
      }
    }
    if (!current) break;
    const curG = gScore.get(current);
    const curH = seaDist.get(current) ?? Infinity;
    if (curH < bestH) {
      bestH = curH;
      bestK = current;
    }
    if (curH === 0) return reconstructRiverPath(cameFrom, current);
    open.delete(current);
    if (curG >= maxLen) continue;
    const { q, r } = parseHexKey(current);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (!canRiverFlowThrough(hexes[nk], nk, startK)) continue;
      const tg = curG + 1;
      if (tg > maxLen) continue;
      if (tg >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, current);
      gScore.set(nk, tg);
      fScore.set(nk, tg + (seaDist.get(nk) ?? Infinity));
      open.add(nk);
    }
  }
  if (bestK !== startK) return reconstructRiverPath(cameFrom, bestK);
  return [{ q: sq, r: sr }];
}
function findRiverMeanderStep(hexes, cur, target, seaDist, used, rand) {
  const curK = hexKey(cur.q, cur.r);
  const curD = seaDist.get(curK) ?? 999;
  const tgtK = hexKey(target.q, target.r);
  const toTarget = riverStepDir(cur, target);
  const opts = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = cur.q + dq;
    const nr = cur.r + dr;
    const nk = hexKey(nq, nr);
    if (nk === tgtK || used.has(nk)) continue;
    if (sameRiverDir([dq, dr], toTarget)) continue;
    const nh = hexes[nk];
    if (!canRiverFlowThrough(nh, nk, "")) continue;
    const nd = seaDist.get(nk);
    if (nd == null || nd > curD + 1) continue;
    const touchesTarget = HEX_DIRECTIONS.some(
      ([eq, er]) => nq + eq === target.q && nr + er === target.r
    );
    if (!touchesTarget && nd > curD) continue;
    opts.push({ q: nq, r: nr });
  }
  if (opts.length === 0) return null;
  return opts[Math.floor(rand() * opts.length)];
}
function injectRiverMeanders(path, hexes, seaDist, rand, maxExtraSteps) {
  if (path.length < 3) return path;
  const out = [{ ...path[0] }];
  const used = new Set(out.map((p) => hexKey(p.q, p.r)));
  let extra = 0;
  let pi = 0;
  while (pi < path.length - 1 && extra < maxExtraSteps) {
    const cur = out[out.length - 1];
    const target = path[pi + 1];
    let straightLen = 1;
    if (pi + 2 < path.length) {
      const d0 = riverStepDir(path[pi], path[pi + 1]);
      let j = pi + 1;
      while (j + 1 < path.length) {
        const d1 = riverStepDir(path[j], path[j + 1]);
        if (!sameRiverDir(d0, d1)) break;
        straightLen++;
        j++;
      }
    }
    if (straightLen >= 2 && rand() < 0.58) {
      const bend = findRiverMeanderStep(hexes, cur, target, seaDist, used, rand);
      if (bend) {
        out.push(bend);
        used.add(hexKey(bend.q, bend.r));
        extra++;
        continue;
      }
    }
    out.push({ ...target });
    used.add(hexKey(target.q, target.r));
    pi++;
  }
  while (pi < path.length - 1) {
    pi++;
    const target = path[pi];
    const k = hexKey(target.q, target.r);
    if (!used.has(k)) {
      out.push({ ...target });
      used.add(k);
    }
  }
  return out;
}
function extendRiverToWybrzeze(hexes, path, seaDist) {
  if (path.length === 0) return path;
  const visited = new Set(path.map((p) => hexKey(p.q, p.r)));
  let cq = path[path.length - 1].q;
  let cr = path[path.length - 1].r;
  for (let extra = 0; extra < 10; extra++) {
    const endHex = hexes[hexKey(cq, cr)];
    if (!endHex) break;
    if (endHex.terenBazowy === "wybrzeze" /* Wybrzeze */ || endHex.terenBazowy === "morze" /* Morze */) break;
    let best = null;
    let bestScore = Infinity;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === "morze" /* Morze */ || isReliefTerrain(nh.terenBazowy)) continue;
      let score = seaDist.get(nk) ?? 999;
      if (nh.terenBazowy === "wybrzeze" /* Wybrzeze */) score = -2;
      if (nh.terenBazowy === "morze" /* Morze */) score = -3;
      if (score < bestScore) {
        bestScore = score;
        best = [nq, nr];
      }
    }
    if (!best) break;
    path.push({ q: best[0], r: best[1] });
    visited.add(hexKey(best[0], best[1]));
    cq = best[0];
    cr = best[1];
  }
  return path;
}
function traceRiver(hexes, sq, sr, maxLen = 40, traceOpts = {}) {
  const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
  const rand = traceOpts.rand ?? (() => 0);
  const srcKey = hexKey(sq, sr);
  const startDist = seaDist.get(srcKey);
  if (startDist == null || !Number.isFinite(startDist)) return [];
  const stepCap = Math.min(maxLen, Math.ceil(startDist * 1.85) + 8);
  const maxMeander = Math.max(3, Math.floor(startDist * 0.45));
  let path = aStarRiverToSea(hexes, sq, sr, seaDist, stepCap);
  path = injectRiverMeanders(path, hexes, seaDist, rand, maxMeander);
  if (path.length > stepCap) path = path.slice(0, stepCap);
  path = extendRiverToWybrzeze(hexes, path, seaDist);
  return path;
}
function isRiverLandTerrain(t) {
  return t === "laka" /* Laka */ || t === "rownina" /* Rownina */ || t === "wzgorza" /* Wzgorza */ || t === "gory" /* Gory */ || t === "pustynia" /* Pustynia */;
}
function collectRiverSources(hexes, width, height, margin) {
  const sources = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex) continue;
      if (isReliefRiverSource(hex.terenBazowy)) sources.push([q, r]);
    }
  }
  return sources;
}
function capRiverQuotas(quotas, maxTotal) {
  const q = quotas.map((n) => Math.max(0, n));
  let sum = q.reduce((a, b) => a + b, 0);
  if (sum <= maxTotal) return q;
  while (sum > maxTotal) {
    let idx = 0;
    for (let i = 1; i < q.length; i++) {
      if ((q[i] ?? 0) > (q[idx] ?? 0)) idx = i;
    }
    if ((q[idx] ?? 0) <= 1) break;
    q[idx]--;
    sum--;
  }
  return q;
}
function pickSpreadRiverSources(sources, count, minSep, seaDist, usedSources, rand) {
  const ranked = sources.filter(([q, r]) => !usedSources.has(hexKey(q, r))).map(([q, r]) => ({
    q,
    r,
    dist: seaDist.get(hexKey(q, r)) ?? 0,
    tie: rand()
  })).sort((a, b) => b.dist - a.dist || a.tie - b.tie);
  const picked = [];
  for (const s of ranked) {
    if (picked.length >= count) break;
    const tooClose = picked.some(([pq, pr]) => hexAxialDistance(pq, pr, s.q, s.r) < minSep);
    if (tooClose) continue;
    picked.push([s.q, s.r]);
  }
  return picked;
}
function markRiverPath(hexes, path) {
  for (const { q, r } of path) {
    const hex = hexes[hexKey(q, r)];
    if (hex && isRiverLandTerrain(hex.terenBazowy)) {
      hex.rzeka = { obecna: true, krawedzie: [] };
    }
  }
}
function generateRivers(hexes, width, height, rand, opts = {}) {
  const maxRivers = opts.maxRivers ?? 2;
  const minLen = opts.minLen ?? 4;
  const maxLen = opts.maxLen ?? 40;
  const margin = opts.margin ?? 2;
  const riversTier = opts.riversTier ?? "medium";
  const seaDist = buildSeaDistanceField(hexes);
  const allSources = collectRiverSources(hexes, width, height, margin);
  const riverPaths = [];
  const usedSources = /* @__PURE__ */ new Set();
  const usedPathHexes = /* @__PURE__ */ new Set();
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  let quotas = masses.map((m) => riversQuotaForLandMass(m.length, riversTier));
  quotas = capRiverQuotas(quotas, maxRivers);
  for (let mi = 0; mi < masses.length && riverPaths.length < maxRivers; mi++) {
    const massSet = new Set(masses[mi]);
    let quota = quotas[mi] ?? 0;
    if (quota <= 0) continue;
    const massSources = allSources.filter(([q, r]) => massSet.has(hexKey(q, r)));
    if (massSources.length === 0) continue;
    const minSep = Math.max(5, Math.floor(Math.sqrt(masses[mi].length) * 0.4));
    const picked = pickSpreadRiverSources(
      massSources,
      quota,
      minSep,
      seaDist,
      usedSources,
      rand
    );
    for (const src of picked) {
      if (riverPaths.length >= maxRivers) break;
      const srcKey = hexKey(src[0], src[1]);
      if (usedSources.has(srcKey)) continue;
      const startDist = seaDist.get(srcKey) ?? 999;
      const path = traceRiver(hexes, src[0], src[1], maxLen, { seaDist, rand });
      if (path.length < minLen) continue;
      if (!pathEndsAtSea(hexes, path)) continue;
      if (path.length > startDist * 1.95 + 10) continue;
      if (path.some(({ q, r }) => usedPathHexes.has(hexKey(q, r)))) continue;
      riverPaths.push(path);
      usedSources.add(srcKey);
      markRiverPath(hexes, path);
      for (const { q, r } of path) usedPathHexes.add(hexKey(q, r));
    }
    const addedOnMass = riverPaths.filter((p) => p[0] && massSet.has(hexKey(p[0].q, p[0].r))).length;
    if (addedOnMass < quota && riverPaths.length < maxRivers) {
      const extra = pickSpreadRiverSources(
        massSources,
        quota - addedOnMass,
        Math.max(3, Math.floor(minSep * 0.55)),
        seaDist,
        usedSources,
        rand
      );
      for (const src of extra) {
        if (riverPaths.length >= maxRivers) break;
        const srcKey = hexKey(src[0], src[1]);
        const startDist = seaDist.get(srcKey) ?? 999;
        const path = traceRiver(hexes, src[0], src[1], maxLen, { seaDist, rand });
        if (path.length < minLen || !pathEndsAtSea(hexes, path)) continue;
        if (path.length > startDist * 1.95 + 10) continue;
        if (path.some(({ q, r }) => usedPathHexes.has(hexKey(q, r)))) continue;
        riverPaths.push(path);
        usedSources.add(srcKey);
        markRiverPath(hexes, path);
        for (const { q, r } of path) usedPathHexes.add(hexKey(q, r));
      }
    }
  }
  return riverPaths;
}
var BASE_DEPOSIT_RULES = [
  {
    id: "miedz",
    nakladka: null,
    allowedOn: (h) => h.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.1
  },
  {
    id: "zelazo",
    nakladka: null,
    allowedOn: (h) => h.terenBazowy === "gory" /* Gory */,
    rarity: 0.08
  },
  {
    id: "glina",
    nakladka: "zloze_gliny" /* ZlozeGliny */,
    allowedOn: (h) => h.terenBazowy === "laka" /* Laka */ || isLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true,
    rarity: 0.1
  },
  {
    id: "konie",
    nakladka: "zloze_konia" /* ZlozeKonia */,
    allowedOn: (h) => h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.1
  },
  {
    id: "wegiel",
    nakladka: null,
    // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h) => h.terenBazowy === "gory" /* Gory */,
    rarity: 0.1
  },
  {
    id: "owce",
    nakladka: "zloze_owiec" /* ZlozeOwiec */,
    allowedOn: (h) => h.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.08
  },
  {
    id: "bydlo",
    nakladka: "zloze_bydla" /* ZlozeBydla */,
    allowedOn: (h) => h.terenBazowy === "laka" /* Laka */ || h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.07
  },
  {
    id: "sol",
    nakladka: null,
    allowedOn: (h) => h.terenBazowy === "pustynia" /* Pustynia */ || h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.12
  }
];
var _depositRarities = mapGenAllDepositRarities();
var DEPOSIT_RULES = BASE_DEPOSIT_RULES.map((rule) => {
  const rarity = _depositRarities[rule.id];
  return typeof rarity === "number" ? { ...rule, rarity } : rule;
});
function placeDeposits(hexes, seed, rules = DEPOSIT_RULES, resourceMult = 1, baselineMult = 1) {
  const rand = mulberry32((seed ^ 2654435769) >>> 0);
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(",").map(Number);
    const [bq, br] = b.split(",").map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const counts = {
    miedz: 0,
    zelazo: 0,
    glina: 0,
    konie: 0,
    wegiel: 0,
    owce: 0,
    bydlo: 0,
    sol: 0
  };
  for (const key of keys) {
    const hex = hexes[key];
    if (!hex) continue;
    if (hex.nakladka !== "brak" /* Brak */) continue;
    if (hex.zloze) continue;
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
    for (const rule of rules) {
      if (!rule.allowedOn(hex)) continue;
      if (rand() < Math.min(1, rule.rarity * baselineMult * resourceMult)) {
        if (rule.nakladka !== null) {
          hex.nakladka = rule.nakladka;
        } else {
          hex.zloze = rule.id;
        }
        counts[rule.id] = (counts[rule.id] ?? 0) + 1;
        break;
      }
    }
  }
  for (const hex of Object.values(hexes)) {
    if (!hex.zloze) continue;
    const z = hex.zloze.trim().toLowerCase();
    if (z === "miedz" && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
    if (z === "zelazo" && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
  }
  return counts;
}
function stripDepositsFromWater(hexes) {
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
  }
}
function computeStartPositions(hexes, seed, opts = {}) {
  const minCount = opts.minCount ?? 5;
  const minDist = opts.minDist ?? 5;
  const absMinDist = opts.absMinDist ?? 2;
  const land = [];
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(",").map(Number);
    const [bq, br] = b.split(",").map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  for (const key of keys) {
    const hex = hexes[key];
    if (hex && isLandTerrain(hex.terenBazowy)) {
      land.push({ q: hex.coords.q, r: hex.coords.r });
    }
  }
  if (land.length === 0) return [];
  const rand = mulberry32((seed ^ 2246822507) >>> 0);
  const shuffled = land.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  function greedyPick(dist) {
    const picked = [];
    for (const c of shuffled) {
      const tooClose = picked.some((p) => hexDistanceAxial(c.q, c.r, p.q, p.r) < dist);
      if (!tooClose) picked.push(c);
    }
    return picked;
  }
  let result = [];
  for (let d = minDist; d >= absMinDist; d--) {
    result = greedyPick(d);
    if (result.length >= minCount) {
      break;
    }
  }
  if (result.length < minCount) {
    const have = new Set(result.map((p) => hexKey(p.q, p.r)));
    for (const c of shuffled) {
      if (result.length >= minCount) break;
      const k = hexKey(c.q, c.r);
      if (!have.has(k)) {
        result.push(c);
        have.add(k);
      }
    }
  }
  result.sort((a, b) => a.q !== b.q ? a.q - b.q : a.r - b.r);
  return result;
}

// data/e-start-params.json
var e_start_params_default = {
  _opis: "Panel-E (Grupa E): start, meta, generator E2, zwyci\u0119stwo, tempo. \u0179r\xF3d\u0142o: panele-sterowania/Panel-E.xlsx \u2192 export-e.py. ui-params.json = etykiety kreatora; ten plik = liczby i regu\u0142y silnika (docelowo odczyt w TS \u2014 dzi\u015B sync z kodem).",
  defaulty: {
    player_civ_id: "rzymianie",
    start_epoch_id: "kamien",
    map_quality_default: "\u015Arednia",
    render_quality_bundled: "medium"
  },
  skala_mapy: {
    Malenki: { rywale_ai: 2, miasta_panstwa: 4, typy_cywilizacji: 4, hex_w: 76, hex_h: 52 },
    Ma\u0142y: { rywale_ai: 3, miasta_panstwa: 5, typy_cywilizacji: 5, hex_w: 108, hex_h: 74 },
    Standardowy: { rywale_ai: 6, miasta_panstwa: 6, typy_cywilizacji: 6, hex_w: 168, hex_h: 120 },
    Du\u017Cy: { rywale_ai: 7, miasta_panstwa: 7, typy_cywilizacji: 7, hex_w: 240, hex_h: 168 },
    Ogromny: { rywale_ai: 8, miasta_panstwa: 8, typy_cywilizacji: 8, hex_w: 336, hex_h: 238 },
    "Super Huge": { rywale_ai: 10, miasta_panstwa: 9, typy_cywilizacji: 9, hex_w: 672, hex_h: 476 }
  },
  generator_e2: {
    resource_mult_low: 0.6,
    resource_mult_normal: 1,
    resource_mult_high: 1.4,
    resource_baseline_rarity: 1.35,
    river_base_low: 2,
    river_base_normal: 5,
    river_base_high: 8,
    river_scale_mala: 1,
    river_scale_srednia: 1.35,
    river_scale_duza: 1.7,
    river_scale_ogromna: 2.1,
    desert_threshold_low: 0.68,
    desert_threshold_normal: 0.63,
    desert_threshold_high: 0.58,
    forest_threshold_low: 0.65,
    forest_threshold_normal: 0.58,
    forest_threshold_high: 0.5
  },
  tempo_gry: {
    szybka: 0.2,
    standardowa: 1,
    dluga: 5
  },
  zwyciestwo: {
    ostatnia_epoka_v1: 3,
    prog_dominacji_power: 0.5,
    dominacja_wymaga_ostatniej_epoki: true,
    nauka_wymaga_rakiety: true
  },
  kreator_zaawansowane: {
    seed_mode_default: "random",
    manual_seed_default: 424242,
    barbarians_enabled_default: true,
    battle_always_manual_default: false,
    fog_debug_reveal_all_default: false,
    victory_power_and_dominance_default: true
  },
  decyzje_kanon: {
    e1_reset_nowa_gra: true,
    e1_tech_kaskada_epok: true,
    e1_ziemia_preset_staly: true,
    e1_zloza_tylko_gory: true,
    e1_zloza_ukryte_do_epoki: true,
    e2_barbarzyncy_do_przed_sredniowiecza: true,
    e2_buntownicy_od_sredniowiecza: true
  }
};

// src/data/e-start-params-loader.ts
var R = e_start_params_default;
function eStartPlayerCivId() {
  return R.defaulty?.player_civ_id ?? "rzymianie";
}
function eStartEpochId() {
  return R.defaulty?.start_epoch_id ?? "kamien";
}
function eStartRenderQualityBundled() {
  const q = R.defaulty?.render_quality_bundled ?? "medium";
  if (q === "low" || q === "high") return q;
  return "medium";
}

// src/map/newGameMapDefaults.ts
function mapSizeLabelFromDims(w, h) {
  const area = w * h;
  if (area < 4800) return "mala";
  if (area < 12e3) return "srednia";
  if (area < 25200) return "duza";
  if (area < 1e5) return "ogromna";
  return "super";
}
function mapSizeLabelFromMenuLabel(menuLabel) {
  const { w, h } = menuLabelToDims(menuLabel);
  return mapSizeLabelFromDims(w, h);
}
var DEFAULT_PLAYER_CIV_ID = eStartPlayerCivId();
var DEFAULT_START_EPOCH_ID = eStartEpochId();
var DEFAULT_RENDER_QUALITY = eStartRenderQualityBundled();
var DEFAULT_WORLD_DENSITY = {
  resources: "medium",
  rivers: "medium",
  desert: "medium",
  forest: "medium",
  relief: "medium"
};
function densityMultiplier(tier) {
  return mapGenResourceMult(tier);
}
function maxRiversFromDensity(tier) {
  return mapGenMaxRiversBase(tier);
}
var RIVER_SCALE_BY_SIZE = {
  mala: mapGenRiverScale("mala"),
  srednia: mapGenRiverScale("srednia"),
  duza: mapGenRiverScale("duza"),
  ogromna: mapGenRiverScale("ogromna"),
  super: mapGenRiverScale("super")
};
function maxRiversForMapAndDensity(mapMenuLabel, tier) {
  const base = maxRiversFromDensity(tier);
  const sizeLabel = mapSizeLabelFromMenuLabel(mapMenuLabel);
  const scale = RIVER_SCALE_BY_SIZE[sizeLabel] ?? 1;
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const areaBoost = Math.max(1, Math.sqrt(w * h / 5e3));
  return Math.max(2, Math.round(base * scale * areaBoost));
}
function riverTraceLimitsForMap(mapMenuLabel) {
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const minDim = Math.min(w, h);
  const area = w * h;
  return {
    minLen: area > 2e4 ? 5 : 4,
    maxLen: Math.max(40, Math.floor(minDim * 0.22)),
    margin: Math.max(2, Math.floor(minDim * 0.025))
  };
}
var RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();
function desertNoiseThresholdFromTier(tier) {
  return mapGenDesertThreshold(tier);
}
function forestNoiseThresholdFromTier(tier) {
  return Math.max(0.32, mapGenForestThreshold(tier) - 0.12);
}
function mountainNoiseThresholdFromTier(tier) {
  return mapGenMountainThreshold(tier);
}
function highlandNoiseThresholdFromTier(tier) {
  return mapGenHighlandThreshold(tier);
}
function resolveLandFraction(opts, typ) {
  if (opts?.landFraction != null && Number.isFinite(opts.landFraction)) {
    return Math.max(0.15, Math.min(0.85, opts.landFraction));
  }
  return defaultLandFractionForTyp(typ);
}
function scaleMaxRiversForLand(configuredMax, landHexes, riversTier) {
  if (landHexes <= 0) return configuredMax;
  const perRiver = riversTier === "high" ? 175 : riversTier === "low" ? 480 : 290;
  const fromLand = Math.floor(landHexes / perRiver);
  const capMul = riversTier === "high" ? 4 : riversTier === "low" ? 1.5 : 2.5;
  return Math.max(configuredMax, Math.min(fromLand, Math.round(configuredMax * capMul)));
}
function resolveWorldGenNumbers(opts) {
  const wd = opts?.worldDensity ?? DEFAULT_WORLD_DENSITY;
  const reliefTier = wd.relief ?? wd.rivers ?? "medium";
  const mapLabel = opts?.mapSizeMenuLabel ?? "Standardowy";
  const resourceBaseline = opts?.worldDensity ? RESOURCE_BASELINE_RARITY_MULT : 1;
  return {
    resourceMult: densityMultiplier(wd.resources),
    resourceBaseline,
    maxRivers: maxRiversForMapAndDensity(mapLabel, wd.rivers),
    desertThreshold: desertNoiseThresholdFromTier(wd.desert),
    forestThreshold: forestNoiseThresholdFromTier(wd.forest),
    mountainThreshold: mountainNoiseThresholdFromTier(reliefTier),
    highlandThreshold: highlandNoiseThresholdFromTier(reliefTier),
    riverTrace: riverTraceLimitsForMap(mapLabel)
  };
}

// src/units/setup.ts
var DEFAULT_TERRAIN_COSTS = {
  ["laka" /* Laka */]: 1,
  ["rownina" /* Rownina */]: 1,
  ["pustynia" /* Pustynia */]: 1,
  ["wybrzeze" /* Wybrzeze */]: Infinity,
  ["wzgorza" /* Wzgorza */]: 2,
  ["gory" /* Gory */]: Infinity,
  ["morze" /* Morze */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };

// src/map/generator.ts
var DEFAULT_WIDTH = 36;
var DEFAULT_HEIGHT = 28;
function generateMap(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, seed = 42, typ = "kontynenty", genOpts) {
  const effectiveSeed = seed || 42;
  const wgn = resolveWorldGenNumbers(genOpts);
  const landFraction = resolveLandFraction(genOpts, typ);
  const terrainTh = {
    desert: wgn.desertThreshold,
    forest: wgn.forestThreshold,
    mountain: wgn.mountainThreshold,
    highland: wgn.highlandThreshold
  };
  const rand = mulberry32(effectiveSeed);
  const perm = buildPermTable(rand);
  const shape = defaultShapeParams(rand);
  const sizeNorm = Math.max(width, height) / DEFAULT_WIDTH;
  shape.noiseScale /= sizeNorm;
  shape.mountainScale /= Math.sqrt(sizeNorm);
  shape.forestScale /= sizeNorm;
  shape.desertScale /= sizeNorm;
  const nCenters = continentCenterCount(width, height, typ);
  const radiusBoost = Math.max(0, (landFraction - 0.5) * 0.28);
  const sparseLand = landFraction <= 0.35;
  const kontynentyRadiusMin = (sparseLand ? 0.1 : 0.12) + radiusBoost;
  const kontynentyRadiusMax = (sparseLand ? 0.17 : 0.21) + radiusBoost;
  let zoneCenters;
  if (typ === "kontynenty") {
    zoneCenters = buildFiveZoneContinentCenters(rand, width, height, kontynentyRadiusMin, kontynentyRadiusMax);
  } else if (typ === "wyspy") {
    zoneCenters = buildSixteenGridIslandCenters(rand, width, height);
  } else {
    zoneCenters = buildContinentCenters(
      rand,
      nCenters,
      { width, height, anchorCenter: typ === "pangea" }
    );
  }
  const nZones = typ === "kontynenty" || typ === "wyspy" ? zoneCenters.length : 0;
  const zoneOf = typ === "kontynenty" || typ === "wyspy" ? assignContinentIndices(width, height, zoneCenters) : null;
  const hexes = {};
  const landScores = /* @__PURE__ */ new Map();
  const terrainScratch = /* @__PURE__ */ new Map();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords = { q, r };
      const key = `${q},${r}`;
      let landMask;
      if (typ === "pangea") {
        landMask = landMaskPangea(q, r, width, height, perm, shape.noiseScale, sparseLand);
      } else if (typ === "wyspy") {
        landMask = landMaskWyspy(q, r, width, height, zoneCenters, perm, shape.noiseScale);
      } else if (typ === "ziemia") {
        landMask = landMaskZiemia(q, r, width, height, perm, shape.noiseScale);
      } else {
        landMask = landMaskKontynenty(q, r, width, height, zoneCenters, perm, shape.noiseScale);
      }
      if (isInMapBorder(q, r, width, height)) {
        landMask = 0;
      }
      landScores.set(key, landMask);
      const elevation = fbm(perm, q * shape.noiseScale, r * shape.noiseScale, 4);
      const elevContinental = elevation * landMask;
      const mtnNoise = fbm(perm, q * shape.mountainScale + shape.offMtnX, r * shape.mountainScale + shape.offMtnY, 3);
      const forNoise = fbm(perm, q * shape.forestScale + shape.offForX, r * shape.forestScale + shape.offForY, 3);
      const desNoise = fbm(perm, q * shape.desertScale + shape.offDesX, r * shape.desertScale + shape.offDesY, 3);
      const { terenBazowy, nakladka } = classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise, terrainTh);
      terrainScratch.set(key, { elevContinental, landMask, mtnNoise, forNoise, desNoise });
      hexes[key] = {
        coords,
        terenBazowy,
        nakladka,
        ulepszenie: "brak" /* Brak */,
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] }
      };
    }
  }
  const coastOpts = typ === "pangea" ? { maxInlandPoolSize: 24 } : typ === "kontynenty" ? { maxInlandPoolSize: 8 } : void 0;
  if (typ === "kontynenty") {
    removeSmallInlandWaterPools(hexes, width, height, 8);
    trimEnclosedOceanOnly(hexes, width, height);
  } else if (typ !== "pangea") {
    removeInlandWaterPools(hexes, width, height);
  } else {
    removeInlandSeaPools(hexes, width, height);
  }
  if (typ === "pangea") {
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  if (typ === "kontynenty" || typ === "pangea") {
    removeTinyLandIslands(hexes, typ === "kontynenty" ? 8 : 10);
    if (typ === "pangea") {
      trimDeepOceanBays(hexes, width, height);
    }
    finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  }
  enforceMapBorderOcean(hexes, width, height);
  if ((typ === "kontynenty" || typ === "wyspy") && zoneOf) {
    applyLandFractionByContinent(hexes, landScores, zoneOf, nZones, landFraction, width, height);
    applyJaggedCoastNoise(hexes, perm, width, height, 2);
    removeTinyLandIslands(hexes, typ === "wyspy" ? 4 : 5);
    trimEnclosedOceanOnly(hexes, width, height);
  } else {
    applyLandFractionByScore(hexes, landScores, landFraction, width, height);
  }
  enforceMapBorderOcean(hexes, width, height);
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  } else {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  const reliefTier = genOpts?.worldDensity?.relief ?? genOpts?.worldDensity?.rivers ?? "medium";
  const forestTier = genOpts?.worldDensity?.forest ?? "medium";
  reapplyLandTerrain(hexes, terrainScratch, terrainTh);
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  applyReliefByNoiseRank(hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones);
  reapplyForestOverlay(hexes, terrainScratch, terrainTh, typ, forestTier, zoneOf, nZones);
  enforceMapBorderOcean(hexes, width, height);
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  const riversTier = genOpts?.worldDensity?.rivers ?? "medium";
  const { land: landHexCount } = countLandSeaHexes(hexes);
  const maxRivers = scaleMaxRiversForLand(wgn.maxRivers, landHexCount, riversTier);
  const riverPaths = generateRivers(hexes, width, height, rand, {
    maxRivers,
    minLen: wgn.riverTrace.minLen,
    maxLen: wgn.riverTrace.maxLen,
    margin: wgn.riverTrace.margin,
    riversTier
  });
  placeDeposits(hexes, effectiveSeed, void 0, wgn.resourceMult, wgn.resourceBaseline);
  stripDepositsFromWater(hexes);
  if (typ === "pangea") {
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  if (typ === "kontynenty" || typ === "wyspy") {
    trimEnclosedOceanOnly(hexes, width, height);
  }
  enforceMapBorderOcean(hexes, width, height);
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  applyLandFractionByScore(hexes, landScores, landFraction, width, height);
  enforceMapBorderOcean(hexes, width, height);
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2
  });
  return { szerokoscQ: width, wysokoscR: height, hexes, seed: effectiveSeed, riverPaths, startPositions };
}
var ROZMIAR_DIMS = mapGenRozmiarDims();
function normMenuLabel(label) {
  return label.toLowerCase().replace(/ł/g, "l").replace(/[ó]/g, "o").replace(/[ąà]/g, "a").replace(/[ę]/g, "e").replace(/[^a-z0-9]/g, "");
}
function rozmiarFromMenuLabel(label) {
  const n = normMenuLabel(label);
  if (n.startsWith("malen") || n === "malenki") return "malenki";
  if (n.startsWith("mal") || n === "maly" || n === "small") return "maly";
  if (n.startsWith("stand") || n.startsWith("sre") || n === "standardowy" || n === "medium") return "standardowy";
  if (n.startsWith("duz") || n === "large") return "duzy";
  if (n.startsWith("super") || n === "superhuge" || n === "kolosalny") return "superogromny";
  if (n.startsWith("ogr") || n === "ogromny" || n === "xlarge") return "ogromny";
  return "standardowy";
}
function rozmiarToDims(rozmiar) {
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  return { w, h };
}
function menuLabelToDims(label) {
  return rozmiarToDims(rozmiarFromMenuLabel(label));
}
function generujSwiat(seed, rozmiar, typ = "kontynenty", genOpts) {
  const effectiveSeed = seed && seed !== 0 ? seed : (Date.now() ^ 3735928559) >>> 0 || 42;
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  return generateMap(w, h, effectiveSeed, typ, genOpts);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TerenBazowy,
  generujSwiat
});
