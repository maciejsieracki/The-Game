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

// tools/.civ-visual-entry.ts
var civ_visual_entry_exports = {};
__export(civ_visual_entry_exports, {
  OWNER_COLORS_FALLBACK: () => OWNER_COLORS_FALLBACK,
  civColorCssForOwner: () => civColorCssForOwner,
  civColorForIkonaId: () => civColorForIkonaId,
  civColorForOwner: () => civColorForOwner,
  civColorHex: () => civColorHex,
  parseHexColor: () => parseHexColor
});
module.exports = __toCommonJS(civ_visual_entry_exports);

// src/game/civ-visual.ts
var OWNER_COLORS_FALLBACK = [
  16766282,
  // 0 = gracz (złoto)
  15022389,
  // 1 = czerwony
  4431943,
  // 2 = zielony
  2001125,
  // 3 = niebieski
  16485376,
  // 4 = pomarańcz
  9315498,
  // 5 = fiolet
  44225,
  // 6 = turkus
  15753874
  // 7 = róż
];
var DEFAULT_CIV_COLOR_HEX = "#ffd54a";
function parseHexColor(hex) {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return OWNER_COLORS_FALLBACK[0];
  }
  return parseInt(h, 16);
}
function civColorHex(civs, ikonaId) {
  const row = civs.cywilizacje.find((c) => c.ikonaId === ikonaId);
  const raw = row?.kolorHex?.trim();
  if (raw && /^#?[0-9a-fA-F]{3,8}$/.test(raw)) {
    const norm = raw.startsWith("#") ? raw : `#${raw}`;
    if (norm.length === 4) {
      const c = norm.slice(1);
      return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
    }
    return norm.length === 7 ? norm : DEFAULT_CIV_COLOR_HEX;
  }
  const idx = civs.cywilizacje.findIndex((c) => c.ikonaId === ikonaId);
  if (idx >= 0) {
    const n = OWNER_COLORS_FALLBACK[idx % OWNER_COLORS_FALLBACK.length];
    return `#${n.toString(16).padStart(6, "0")}`;
  }
  return DEFAULT_CIV_COLOR_HEX;
}
function civColorForIkonaId(civs, ikonaId) {
  return parseHexColor(civColorHex(civs, ikonaId));
}
function civColorForOwner(civs, ownerId, civTypeForOwner) {
  const ikonaId = civTypeForOwner(ownerId);
  const row = civs.cywilizacje.find((c) => c.ikonaId === ikonaId);
  if (row?.kolorHex?.trim()) {
    return parseHexColor(row.kolorHex);
  }
  return OWNER_COLORS_FALLBACK[ownerId % OWNER_COLORS_FALLBACK.length];
}
function civColorCssForOwner(civs, ownerId, civTypeForOwner) {
  return civColorHex(civs, civTypeForOwner(ownerId));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OWNER_COLORS_FALLBACK,
  civColorCssForOwner,
  civColorForIkonaId,
  civColorForOwner,
  civColorHex,
  parseHexColor
});
