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

// tools/.mask-diag-entry.ts
var mask_diag_entry_exports = {};
__export(mask_diag_entry_exports, {
  buildContinentCenters: () => buildContinentCenters,
  buildPermTable: () => buildPermTable,
  continentCenterCount: () => continentCenterCount,
  defaultShapeParams: () => defaultShapeParams,
  landMaskKontynenty: () => landMaskKontynenty,
  mulberry32: () => mulberry32
});
module.exports = __toCommonJS(mask_diag_entry_exports);

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
function isLandTerrain(tb) {
  return tb === "laka" /* Laka */ || tb === "rownina" /* Rownina */ || tb === "wzgorza" /* Wzgorza */ || tb === "pustynia" /* Pustynia */;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildContinentCenters,
  buildPermTable,
  continentCenterCount,
  defaultShapeParams,
  landMaskKontynenty,
  mulberry32
});
