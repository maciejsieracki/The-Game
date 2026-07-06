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

// tools/.map-continents-entry.ts
var map_continents_entry_exports = {};
__export(map_continents_entry_exports, {
  DEFAULT_WORLD_DENSITY: () => DEFAULT_WORLD_DENSITY,
  TerenBazowy: () => TerenBazowy,
  continentCenterCount: () => continentCenterCount,
  generateMap: () => generateMap,
  generujSwiat: () => generujSwiat,
  resolveWorldGenNumbers: () => resolveWorldGenNumbers
});
module.exports = __toCommonJS(map_continents_entry_exports);

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
      high: 8
    },
    river_scale: {
      mala: 1,
      srednia: 1.35,
      duza: 1.7,
      ogromna: 2.1
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
    }
  },
  mapa_skala: {
    aktywne_typy: {
      mala: 3,
      srednia: 5,
      duza: 7,
      ogromna: 9
    },
    domyslni_rywale: {
      mala: 2,
      srednia: 4,
      duza: 6,
      ogromna: 8
    }
  },
  generator: {
    default_width: 36,
    default_height: 28,
    rozmiar_dims: {
      malenki: [38, 26],
      maly: [54, 37],
      standardowy: [84, 60],
      duzy: [120, 84],
      ogromny: [168, 119]
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
  malenki: [38, 26],
  maly: [54, 37],
  standardowy: [84, 60],
  duzy: [120, 84],
  ogromny: [168, 119]
};
var FALLBACK_RESOURCE_MULT = { low: 0.6, medium: 1, high: 1.4 };
var FALLBACK_BASELINE_RARITY = 1.35;
var FALLBACK_RIVERS = { low: 2, medium: 5, high: 8 };
var FALLBACK_RIVER_SCALE = {
  mala: 1,
  srednia: 1.35,
  duza: 1.7,
  ogromna: 2.1
};
var FALLBACK_DESERT = { low: 0.68, medium: 0.63, high: 0.58 };
var FALLBACK_FOREST = { low: 0.65, medium: 0.58, high: 0.5 };
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
  const lut = { mala: "mala", srednia: "srednia", duza: "duza", ogromna: "ogromna" };
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
function continentCenterCount(width, height, typ) {
  const area = width * height;
  if (typ !== "kontynenty") {
    return area < 2e3 ? 2 : area < 6e3 ? 3 : 4;
  }
  if (area < 1500) return 2;
  if (area < 4e3) return 3;
  if (area < 9e3) return 4;
  if (area < 15e3) return 5;
  return 6;
}
function buildContinentCenters(rand, n, opts) {
  const radiusMin = opts?.radiusMin ?? 0.28;
  const radiusMax = opts?.radiusMax ?? 0.4;
  const minDist = opts?.minCenterDist ?? 0;
  const centers = [];
  const margin = 0.15;
  for (let i = 0; i < n; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 48 && !placed; attempt++) {
      const nq = margin + rand() * (1 - 2 * margin);
      const nr = margin + rand() * (1 - 2 * margin);
      let farEnough = true;
      if (minDist > 0) {
        for (const c of centers) {
          const d = Math.hypot(nq - c.nq, nr - c.nr);
          if (d < minDist) {
            farEnough = false;
            break;
          }
        }
      }
      if (!farEnough) continue;
      centers.push({
        nq,
        nr,
        radius: radiusMin + rand() * (radiusMax - radiusMin)
      });
      placed = true;
    }
    if (!placed) {
      centers.push({
        nq: margin + rand() * (1 - 2 * margin),
        nr: margin + rand() * (1 - 2 * margin),
        radius: radiusMin + rand() * (radiusMax - radiusMin)
      });
    }
  }
  return centers;
}
function landMaskKontynenty(q, r, width, height, centers, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const edgeMask = Math.max(0, 1 - Math.pow(dist / 0.88, 2));
  let best = 0;
  let second = 0;
  for (const c of centers) {
    const dq = nq - c.nq;
    const dr = nr - c.nr;
    const distC = Math.sqrt(dq * dq + dr * dr);
    const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 2.1));
    if (radial > best) {
      second = best;
      best = radial;
    } else if (radial > second) {
      second = radial;
    }
  }
  if (best < 0.22) return 0;
  if (best - second < 0.14 && best < 0.62) return 0;
  const warp = fbm(perm, q * noiseScale * 0.7 + 100, r * noiseScale * 0.7 + 100, 3) * 0.22;
  return Math.min(1, Math.max(0, (best + warp - 0.18) * edgeMask));
}
function landMaskPangea(q, r, width, height, perm, noiseScale) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radial = Math.max(0, 1 - Math.pow(dist / 1.05, 1.4));
  const warp = fbm(perm, q * noiseScale * 0.6 + 200, r * noiseScale * 0.6 + 200, 3) * 0.3;
  return Math.min(1, Math.max(0, radial + warp - 0.05));
}
function landMaskWyspy(q, r, width, height, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const edgeQ = Math.min(nq, 1 - nq) / 0.08;
  const edgeR = Math.min(nr, 1 - nr) / 0.08;
  const edgeMask = Math.min(1, edgeQ) * Math.min(1, edgeR);
  const coarse = fbm(perm, q * noiseScale * 1.1 + 300, r * noiseScale * 1.1 + 300, 4);
  const fine = fbm(perm, q * noiseScale * 2.2 + 400, r * noiseScale * 2.2 + 400, 3) * 0.3;
  return Math.min(1, Math.max(0, (coarse + fine - 0.5) * 1.6 * edgeMask));
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
function classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise, thresholds) {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = thresholds?.forest ?? 0.58;
  let terenBazowy;
  let nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = landMask < 0.22 ? "morze" /* Morze */ : "laka" /* Laka */;
  } else {
    const isHighlands = mtnNoise > 0.6 && landMask > 0.25;
    const isMountain = mtnNoise > 0.75 && landMask > 0.3;
    if (isMountain && elevContinental > 0.2) {
      terenBazowy = "gory" /* Gory */;
    } else if (isHighlands && elevContinental > 0.16) {
      terenBazowy = "wzgorza" /* Wzgorza */;
    } else if (desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
      terenBazowy = "pustynia" /* Pustynia */;
    } else if (elevContinental > 0.35) {
      terenBazowy = "rownina" /* Rownina */;
    } else {
      terenBazowy = "laka" /* Laka */;
    }
    if (terenBazowy !== "gory" /* Gory */ && terenBazowy !== "pustynia" /* Pustynia */ && forNoise > forTh && elevContinental > 0.2) {
      nakladka = "las" /* Las */;
    }
  }
  return { terenBazowy, nakladka };
}
function isLandTerrain(tb) {
  return tb === "laka" /* Laka */ || tb === "rownina" /* Rownina */ || tb === "wzgorza" /* Wzgorza */ || tb === "pustynia" /* Pustynia */;
}
function isLandOrCoast(tb) {
  return tb !== "morze" /* Morze */;
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
  return Math.max(5, Math.min(12, Math.floor(Math.min(width, height) / 10)));
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
function traceRiver(hexes, sq, sr, maxLen = 40) {
  const path = [{ q: sq, r: sr }];
  const visited = /* @__PURE__ */ new Set([hexKey(sq, sr)]);
  let cq = sq, cr = sr;
  for (let step = 0; step < maxLen; step++) {
    const curHex = hexes[hexKey(cq, cr)];
    if (!curHex) break;
    if (curHex.terenBazowy === "morze" /* Morze */) break;
    let bestRank = ELEVATION_RANK[curHex.terenBazowy];
    let bestNeighbors = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const key = hexKey(nq, nr);
      if (visited.has(key)) continue;
      const nhex = hexes[key];
      if (!nhex) continue;
      const rank = ELEVATION_RANK[nhex.terenBazowy];
      if (rank < bestRank) {
        bestRank = rank;
        bestNeighbors = [[nq, nr]];
      } else if (rank === bestRank) {
        bestNeighbors.push([nq, nr]);
      }
    }
    if (bestNeighbors.length === 0) {
      let fallback = null;
      let fallbackScore = Infinity;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cq + dq;
        const nr = cr + dr;
        const key = hexKey(nq, nr);
        if (visited.has(key)) continue;
        const nhex = hexes[key];
        if (!nhex) continue;
        let score = ELEVATION_RANK[nhex.terenBazowy];
        if (nhex.terenBazowy === "wybrzeze" /* Wybrzeze */) score = -2;
        if (score <= ELEVATION_RANK[curHex.terenBazowy] && score < fallbackScore) {
          fallbackScore = score;
          fallback = [nq, nr];
        }
      }
      if (!fallback) break;
      path.push({ q: fallback[0], r: fallback[1] });
      visited.add(hexKey(fallback[0], fallback[1]));
      cq = fallback[0];
      cr = fallback[1];
      const fbHex = hexes[hexKey(cq, cr)];
      if (fbHex?.terenBazowy === "wybrzeze" /* Wybrzeze */ || fbHex?.terenBazowy === "morze" /* Morze */) break;
      continue;
    }
    const next = bestNeighbors[0];
    path.push({ q: next[0], r: next[1] });
    visited.add(hexKey(next[0], next[1]));
    cq = next[0];
    cr = next[1];
    const nHex = hexes[hexKey(cq, cr)];
    if (nHex && nHex.terenBazowy === "morze" /* Morze */) break;
  }
  cq = path[path.length - 1].q;
  cr = path[path.length - 1].r;
  for (let extra = 0; extra < 14; extra++) {
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
      if (!nh) continue;
      let score = ELEVATION_RANK[nh.terenBazowy];
      if (nh.terenBazowy === "wybrzeze" /* Wybrzeze */) score = -3;
      if (nh.terenBazowy === "morze" /* Morze */) score = -4;
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
function isRiverLandTerrain(t) {
  return t === "laka" /* Laka */ || t === "rownina" /* Rownina */ || t === "wzgorza" /* Wzgorza */ || t === "gory" /* Gory */ || t === "pustynia" /* Pustynia */;
}
function collectRiverSources(hexes, width, height, margin) {
  const primary = [];
  const secondary = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex) continue;
      const t = hex.terenBazowy;
      if (t === "gory" /* Gory */ || t === "wzgorza" /* Wzgorza */) {
        primary.push([q, r]);
      } else if (t === "rownina" /* Rownina */ || t === "laka" /* Laka */) {
        secondary.push([q, r]);
      }
    }
  }
  return { primary, secondary };
}
function fallbackRiverPath(hexes, width, height, rand, minLen, maxLen) {
  const candidates = [];
  const margin = Math.max(3, Math.floor(Math.min(width, height) * 0.12));
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex || !isRiverLandTerrain(hex.terenBazowy)) continue;
      candidates.push([q, r]);
    }
  }
  if (candidates.length === 0) return [];
  let best = [];
  const attempts = Math.min(24, candidates.length);
  for (let a = 0; a < attempts; a++) {
    const idx = Math.floor(rand() * candidates.length);
    const src = candidates[idx];
    if (!src) continue;
    const path = traceRiver(hexes, src[0], src[1], maxLen);
    if (path.length > best.length) best = path;
  }
  return best.length >= minLen ? best : [];
}
function generateRivers(hexes, width, height, rand, opts = {}) {
  const maxRivers = opts.maxRivers ?? 2;
  const minLen = opts.minLen ?? 4;
  const maxLen = opts.maxLen ?? 40;
  const margin = opts.margin ?? 2;
  const { primary, secondary } = collectRiverSources(hexes, width, height, margin);
  const riverSources = primary.length > 0 ? primary : secondary;
  const riverPaths = [];
  const usedHexKeys = /* @__PURE__ */ new Set();
  const trySources = (sources, count) => {
    const total = sources.length;
    if (total === 0) return;
    const step = Math.max(1, Math.floor(total / Math.max(8, maxRivers * 2)));
    for (let river = 0; river < count; river++) {
      let best = [];
      for (let attempt = 0; attempt < 10; attempt++) {
        const seedOffset = Math.floor(rand() * total);
        const idx = (seedOffset + attempt * step) % total;
        const src = sources[idx];
        if (!src) continue;
        const srcKey = hexKey(src[0], src[1]);
        if (usedHexKeys.has(srcKey)) continue;
        const candidate = traceRiver(hexes, src[0], src[1], maxLen);
        if (candidate.length > best.length) best = candidate;
      }
      if (best.length >= minLen) {
        riverPaths.push(best);
        for (const { q, r } of best) {
          const hex = hexes[hexKey(q, r)];
          if (hex && isRiverLandTerrain(hex.terenBazowy)) {
            hex.rzeka = { obecna: true, krawedzie: [] };
          }
          usedHexKeys.add(hexKey(q, r));
        }
      }
    }
  };
  trySources(riverSources, maxRivers);
  if (riverPaths.length === 0 && primary.length > 0 && secondary.length > 0) {
    trySources(secondary, maxRivers);
  }
  if (riverPaths.length === 0) {
    const fallback = fallbackRiverPath(hexes, width, height, rand, minLen, maxLen);
    if (fallback.length >= minLen) {
      riverPaths.push(fallback);
      for (const { q, r } of fallback) {
        const hex = hexes[hexKey(q, r)];
        if (hex && isRiverLandTerrain(hex.terenBazowy)) {
          hex.rzeka = { obecna: true, krawedzie: [] };
        }
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
    Malenki: { rywale_ai: 2, miasta_panstwa: 4, typy_cywilizacji: 4, hex_w: 38, hex_h: 26 },
    Ma\u0142y: { rywale_ai: 3, miasta_panstwa: 5, typy_cywilizacji: 5, hex_w: 54, hex_h: 37 },
    Standardowy: { rywale_ai: 6, miasta_panstwa: 6, typy_cywilizacji: 6, hex_w: 84, hex_h: 60 },
    Du\u017Cy: { rywale_ai: 7, miasta_panstwa: 7, typy_cywilizacji: 7, hex_w: 120, hex_h: 84 },
    Ogromny: { rywale_ai: 8, miasta_panstwa: 8, typy_cywilizacji: 8, hex_w: 168, hex_h: 119 }
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
  if (area < 1200) return "mala";
  if (area < 3e3) return "srednia";
  if (area < 6300) return "duza";
  return "ogromna";
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
  forest: "medium"
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
  ogromna: mapGenRiverScale("ogromna")
};
function maxRiversForMapAndDensity(mapMenuLabel, tier) {
  const base = maxRiversFromDensity(tier);
  const scale = RIVER_SCALE_BY_SIZE[mapSizeLabelFromMenuLabel(mapMenuLabel)] ?? 1;
  return Math.max(1, Math.round(base * scale));
}
var RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();
function desertNoiseThresholdFromTier(tier) {
  return mapGenDesertThreshold(tier);
}
function forestNoiseThresholdFromTier(tier) {
  return mapGenForestThreshold(tier);
}
function resolveWorldGenNumbers(opts) {
  const wd = opts?.worldDensity ?? DEFAULT_WORLD_DENSITY;
  const mapLabel = opts?.mapSizeMenuLabel ?? "Standardowy";
  const resourceBaseline = opts?.worldDensity ? RESOURCE_BASELINE_RARITY_MULT : 1;
  return {
    resourceMult: densityMultiplier(wd.resources),
    resourceBaseline,
    maxRivers: maxRiversForMapAndDensity(mapLabel, wd.rivers),
    desertThreshold: desertNoiseThresholdFromTier(wd.desert),
    forestThreshold: forestNoiseThresholdFromTier(wd.forest)
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
  const terrainTh = { desert: wgn.desertThreshold, forest: wgn.forestThreshold };
  const rand = mulberry32(effectiveSeed);
  const perm = buildPermTable(rand);
  const shape = defaultShapeParams(rand);
  const sizeNorm = Math.max(width, height) / DEFAULT_WIDTH;
  shape.noiseScale /= sizeNorm;
  shape.mountainScale /= sizeNorm;
  shape.forestScale /= sizeNorm;
  shape.desertScale /= sizeNorm;
  const nCenters = continentCenterCount(width, height, typ);
  const continentCenters = buildContinentCenters(
    rand,
    nCenters,
    typ === "kontynenty" ? { radiusMin: 0.14, radiusMax: 0.22, minCenterDist: 0.3 } : void 0
  );
  const hexes = {};
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords = { q, r };
      const key = `${q},${r}`;
      let landMask;
      if (typ === "pangea") {
        landMask = landMaskPangea(q, r, width, height, perm, shape.noiseScale);
      } else if (typ === "wyspy") {
        landMask = landMaskWyspy(q, r, width, height, perm, shape.noiseScale);
      } else if (typ === "ziemia") {
        landMask = landMaskZiemia(q, r, width, height, perm, shape.noiseScale);
      } else {
        landMask = landMaskKontynenty(q, r, width, height, continentCenters, perm, shape.noiseScale);
      }
      const elevation = fbm(perm, q * shape.noiseScale, r * shape.noiseScale, 4);
      const elevContinental = elevation * landMask;
      const mtnNoise = fbm(perm, q * shape.mountainScale + shape.offMtnX, r * shape.mountainScale + shape.offMtnY, 3);
      const forNoise = fbm(perm, q * shape.forestScale + shape.offForX, r * shape.forestScale + shape.offForY, 3);
      const desNoise = fbm(perm, q * shape.desertScale + shape.offDesX, r * shape.desertScale + shape.offDesY, 3);
      const { terenBazowy, nakladka } = classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise, terrainTh);
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
  const coastOpts = typ === "kontynenty" ? { maxInlandPoolSize: 12 } : void 0;
  if (typ === "kontynenty") {
    removeSmallInlandWaterPools(hexes, width, height, 12);
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
  const riverPaths = generateRivers(hexes, width, height, rand, {
    maxRivers: wgn.maxRivers,
    minLen: 4,
    maxLen: 40,
    margin: 2
  });
  placeDeposits(hexes, effectiveSeed, void 0, wgn.resourceMult, wgn.resourceBaseline);
  stripDepositsFromWater(hexes);
  if (typ === "pangea") {
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
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
  DEFAULT_WORLD_DENSITY,
  TerenBazowy,
  continentCenterCount,
  generateMap,
  generujSwiat,
  resolveWorldGenNumbers
});
