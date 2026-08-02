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

// tools/.display-names-entry.ts
var display_names_entry_exports = {};
__export(display_names_entry_exports, {
  CITY_STATE_LABEL: () => CITY_STATE_LABEL,
  formatCityMapLabel: () => formatCityMapLabel,
  formatEntityDisplayName: () => formatEntityDisplayName,
  formatOwnerDiploLabel: () => formatOwnerDiploLabel,
  isClusterCityStateSlot: () => isClusterCityStateSlot,
  isOwnerClusterCityState: () => isOwnerClusterCityState,
  isTechnicalOwnerLabel: () => isTechnicalOwnerLabel,
  resolveOwnerBaseName: () => resolveOwnerBaseName,
  sanitizeOwnerDisplayBase: () => sanitizeOwnerDisplayBase
});
module.exports = __toCommonJS(display_names_entry_exports);

// src/game/display-names.ts
var CITY_STATE_LABEL = "miasto-pa\u0144stwo";
var CITY_STATE_SEPARATOR = " \xB7 ";
function formatEntityDisplayName(ctx) {
  const base = (ctx.baseName ?? "").trim();
  if (!base) return "";
  if (ctx.isCityState) {
    return `${base}${CITY_STATE_SEPARATOR}${CITY_STATE_LABEL}`;
  }
  return base;
}
function stripCityStateSuffix(name) {
  const suffix = `${CITY_STATE_SEPARATOR}${CITY_STATE_LABEL}`;
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}
function isClusterCityStateSlot(slot) {
  if (slot.isPlayerCapital) return false;
  if (slot.isSameTypeRival) return true;
  return !slot.isClusterCapital;
}
function isOwnerClusterCityState(ownerId, opts) {
  if (ownerId <= 0) return false;
  if (opts?.simplifiedOwners?.has(ownerId)) return true;
  if (opts?.typCopyOwners?.has(ownerId)) return true;
  if (opts?.cities?.some((c) => c.ownerId === ownerId && c.startCityState)) return true;
  return false;
}
function formatCityMapLabel(city) {
  return formatEntityDisplayName({
    baseName: city.name,
    isCityState: city.ownerId !== 0 && !!city.startCityState
  });
}
function formatOwnerDiploLabel(baseName, ownerId, opts) {
  return formatEntityDisplayName({
    baseName: stripCityStateSuffix(baseName),
    isCityState: isOwnerClusterCityState(ownerId, opts)
  });
}
function isTechnicalOwnerLabel(name) {
  const t = (name ?? "").trim();
  if (!t) return true;
  if (/^Rywal \d+$/i.test(t)) return true;
  if (/^AI \d+$/i.test(t)) return true;
  if (/^oid-\d+$/i.test(t)) return true;
  return false;
}
function resolveOwnerBaseName(input) {
  const {
    ownerId,
    cached,
    cityName,
    civDisplayName,
    isCityState,
    isClusterCapital = false
  } = input;
  const cleanCity = cityName && !isTechnicalOwnerLabel(cityName) ? stripCityStateSuffix(cityName) : void 0;
  const cleanCiv = civDisplayName && !isTechnicalOwnerLabel(civDisplayName) ? stripCityStateSuffix(civDisplayName) : void 0;
  const cleanCached = cached && !isTechnicalOwnerLabel(cached) ? stripCityStateSuffix(cached) : void 0;
  if (isClusterCapital && cleanCiv) return cleanCiv;
  if (isCityState && cleanCity && cleanCiv && cleanCity !== cleanCiv) {
    return `${cleanCity}${CITY_STATE_SEPARATOR}${cleanCiv}`;
  }
  if (isCityState && cleanCiv) return cleanCiv;
  if (isCityState && cleanCity) return cleanCity;
  if (!isCityState && cleanCiv) return cleanCiv;
  if (cleanCached) return cleanCached;
  if (cleanCity) return cleanCity;
  if (cleanCiv) return cleanCiv;
  if (cached?.trim()) return stripCityStateSuffix(cached);
  if (cityName?.trim()) return stripCityStateSuffix(cityName);
  return "";
}
function sanitizeOwnerDisplayBase(base, civDisplayName) {
  const trimmed = (base ?? "").trim();
  if (trimmed && !isTechnicalOwnerLabel(trimmed)) return stripCityStateSuffix(trimmed);
  const civ = civDisplayName && !isTechnicalOwnerLabel(civDisplayName) ? stripCityStateSuffix(civDisplayName) : void 0;
  return civ ?? "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CITY_STATE_LABEL,
  formatCityMapLabel,
  formatEntityDisplayName,
  formatOwnerDiploLabel,
  isClusterCityStateSlot,
  isOwnerClusterCityState,
  isTechnicalOwnerLabel,
  resolveOwnerBaseName,
  sanitizeOwnerDisplayBase
});
