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

// tools/.city-map-badge-entry.ts
var city_map_badge_entry_exports = {};
__export(city_map_badge_entry_exports, {
  cityMapBadgeKey: () => cityMapBadgeKey,
  civInitialForIconId: () => civInitialForIconId,
  defenseTierFromCity: () => defenseTierFromCity
});
module.exports = __toCommonJS(city_map_badge_entry_exports);

// src/render/cityMapStatChip.ts
var CIV_INITIALS = {
  grecy: "G",
  grecja: "G",
  rzym: "R",
  rzymianie: "R",
  egipt: "E",
  egipcjanie: "E",
  chiny: "C",
  chinczycy: "C",
  persja: "P",
  persowie: "P",
  zulusi: "Z",
  celtowie: "K",
  germanie: "D",
  hunowie: "H",
  japonia: "J",
  japonczycy: "J",
  inkowie: "I",
  majowie: "M",
  mongolowie: "O",
  arabowie: "A",
  bizancjum: "B"
};
function defenseTierFromCity(builtBuildingIds, maMur) {
  const built = builtBuildingIds ?? [];
  if (built.includes("fort")) return 2;
  if (built.includes("mury") || built.includes("palisada")) return 1;
  if (maMur === true) return 1;
  return 0;
}
function civInitialForIconId(ikonaId) {
  const key = (ikonaId || "").trim().toLowerCase();
  if (!key) return "?";
  if (CIV_INITIALS[key]) return CIV_INITIALS[key];
  const letter = key.charAt(0).toUpperCase();
  return /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(letter) ? letter : "?";
}
function cityMapBadgeKey(a, population) {
  if (typeof a === "string") {
    const pop2 = Math.max(1, Math.floor(population ?? 1) || 1);
    return `${(a || "").trim()}|${pop2}`;
  }
  const pop = Math.max(1, Math.floor(a.population) || 1);
  const prod = a.prodActive ? `${a.prodKind ?? "b"}` : "-";
  return [
    (a.cityName || "").trim(),
    pop,
    `d${a.defenseTier}`,
    `c${(a.civIconId || "").trim().toLowerCase()}`,
    `p${prod}`,
    `w${a.resourceWarning ? 1 : 0}`
  ].join("|");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cityMapBadgeKey,
  civInitialForIconId,
  defenseTierFromCity
});
