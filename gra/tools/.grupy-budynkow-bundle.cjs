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

// tools/.grupy-budynkow-entry.ts
var grupy_budynkow_entry_exports = {};
__export(grupy_budynkow_entry_exports, {
  BUILDING_GROUP_FALLBACK: () => BUILDING_GROUP_FALLBACK,
  BUILDING_GROUP_ORDER: () => BUILDING_GROUP_ORDER,
  buildingStatSummaryLines: () => buildingStatSummaryLines,
  citySoftStatBonusPercent: () => citySoftStatBonusPercent,
  cumulativeMnoznikForBuildingId: () => cumulativeMnoznikForBuildingId,
  groupBuiltBuildingIds: () => groupBuiltBuildingIds,
  upgradeChainSteps: () => upgradeChainSteps,
  upgradeCompositionLines: () => upgradeCompositionLines
});
module.exports = __toCommonJS(grupy_budynkow_entry_exports);

// src/game/unit-building-bonuses.ts
var ARMOR_BUILDING_IDS = ["kuznia", "kuznia_zelaza", "wielka_kuznia"];
var SOFT_STAT_BUILDING_IDS = ["koszary", "akademia_wojskowa", "warsztat_oblezniczy"];
function mnoznikRoleForBuildingId(id) {
  if (ARMOR_BUILDING_IDS.includes(id)) return "pancerz";
  if (SOFT_STAT_BUILDING_IDS.includes(id)) return "parametry";
  return null;
}
function mnoznikOf(b) {
  const v = b?.baza?.mnoznik;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}
var MAX_UPGRADE_CHAIN_DEPTH = 32;
function chainMnoznikContribution(startId, byId, allowed, countedGlobal) {
  let total = 0;
  let cur = startId;
  let depth = 0;
  const visitedThisChain = /* @__PURE__ */ new Set();
  while (cur && depth < MAX_UPGRADE_CHAIN_DEPTH && !visitedThisChain.has(cur)) {
    visitedThisChain.add(cur);
    const b = byId.get(cur);
    if (!b) break;
    if (allowed.has(cur) && !countedGlobal.has(cur)) {
      countedGlobal.add(cur);
      total += mnoznikOf(b);
    }
    const from = typeof b.upgradeFrom === "string" ? b.upgradeFrom.trim() : "";
    cur = from || void 0;
    depth++;
  }
  return total;
}
function sumMnoznikForPresentBuildings(builtBuildingIds, buildings, ids) {
  if (!builtBuildingIds?.length || !buildings?.length) return 0;
  const built = new Set(builtBuildingIds);
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const allowed = new Set(ids);
  const counted = /* @__PURE__ */ new Set();
  let total = 0;
  for (const id of ids) {
    if (!built.has(id)) continue;
    total += chainMnoznikContribution(id, byId, allowed, counted);
  }
  return total;
}
function citySoftStatBonusPercent(builtBuildingIds, buildings) {
  return sumMnoznikForPresentBuildings(builtBuildingIds, buildings, SOFT_STAT_BUILDING_IDS);
}
function cumulativeMnoznikForBuildingId(buildingId, buildings) {
  if (!buildings?.length) return 0;
  const role = mnoznikRoleForBuildingId(buildingId);
  if (!role) return 0;
  const ids = role === "pancerz" ? ARMOR_BUILDING_IDS : SOFT_STAT_BUILDING_IDS;
  const byId = new Map(buildings.map((b) => [b.id, b]));
  return chainMnoznikContribution(buildingId, byId, new Set(ids), /* @__PURE__ */ new Set());
}

// src/game/building-upgrades.ts
function upgradeChainSteps(buildingId, buildings) {
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const chain = [];
  let cur = byId.get(buildingId);
  while (cur) {
    chain.unshift(cur);
    const from = (cur.upgradeFrom ?? "").trim();
    cur = from ? byId.get(from) : void 0;
  }
  return chain;
}
var STAT_KEYS = [
  "praca",
  "pieniadz",
  "zywnosc",
  "nauka",
  "kultura",
  "zadowolenie",
  "obrona"
];
function statLine(label, baza, przyrost) {
  if (baza === 0 && przyrost === 0) return null;
  const parts = [];
  if (baza !== 0) parts.push(String(baza));
  if (przyrost !== 0) parts.push(`+${przyrost}/poz`);
  return `${label} ${parts.join(" ")}`;
}
function upgradeCompositionLines(buildingId, buildings) {
  const chain = upgradeChainSteps(buildingId, buildings);
  if (chain.length <= 1) return [];
  const names = chain.map((c) => c.nazwa).join(" \u2192 ");
  return [
    `\u0141a\u0144cuch: ${names}`,
    "Bonusy w silniku = suma poprzednich poziom\xF3w (zapisane w JSON tego budynku)."
  ];
}
function buildingStatSummaryLines(def, buildings) {
  const lines = [];
  for (const k of STAT_KEYS) {
    const b = def.baza?.[k] ?? 0;
    const p = def.przyrost?.[k] ?? 0;
    const line = statLine(k, b, p);
    if (line) lines.push(line);
  }
  const role = mnoznikRoleForBuildingId(def.id);
  if (role) {
    const cumulative = buildings ? cumulativeMnoznikForBuildingId(def.id, buildings) : def.baza?.["mnoznik"] ?? 0;
    if (cumulative !== 0) {
      const label = role === "pancerz" ? "Pancerz (jednostki)" : "Parametry poza Pancerzem (jednostki)";
      lines.push(`${label} +${cumulative}%`);
    }
  }
  return lines;
}
var BUILDING_GROUP_ORDER = [
  "Prawo i administracja",
  "Wojsko i obrona",
  "Handel i pieni\u0105dz",
  "Nauka i kultura",
  "Wiara",
  "Zdrowie",
  "Produkcja surowc\xF3w",
  "\u017Bywno\u015B\u0107"
];
var BUILDING_GROUP_FALLBACK = "Inne";
function groupBuiltBuildingIds(builtIds, buildings) {
  const byId = new Map(buildings.map((b) => [b.id, b]));
  const buckets = /* @__PURE__ */ new Map();
  for (const g of BUILDING_GROUP_ORDER) buckets.set(g, []);
  for (const id of builtIds) {
    const raw = byId.get(id)?.grupa;
    const g = typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : BUILDING_GROUP_FALLBACK;
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g).push(id);
  }
  return Array.from(buckets.entries()).map(([grupa, ids]) => ({ grupa, ids }));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BUILDING_GROUP_FALLBACK,
  BUILDING_GROUP_ORDER,
  buildingStatSummaryLines,
  citySoftStatBonusPercent,
  cumulativeMnoznikForBuildingId,
  groupBuiltBuildingIds,
  upgradeChainSteps,
  upgradeCompositionLines
});
