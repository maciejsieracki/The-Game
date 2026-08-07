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

// src/game/triumph-city-state.ts
var triumph_city_state_exports = {};
__export(triumph_city_state_exports, {
  TRIUMPH_CS_HINT_MS: () => TRIUMPH_CS_HINT_MS,
  buildTriumphCityStateUnificationMessage: () => buildTriumphCityStateUnificationMessage,
  countCitiesForOwner: () => countCitiesForOwner,
  shouldShowPlayerTriumphCityStateUnification: () => shouldShowPlayerTriumphCityStateUnification
});
module.exports = __toCommonJS(triumph_city_state_exports);
var TRIUMPH_CS_HINT_MS = 9500;
function countCitiesForOwner(ownerId, cities) {
  let n = 0;
  for (const c of cities) {
    if (c.ownerId === ownerId) n++;
  }
  return n;
}
function shouldShowPlayerTriumphCityStateUnification(input) {
  const {
    newOwner,
    oldOwner,
    playerCivKey,
    typCityCopyOwners,
    aiOwnerCivMap,
    cities
  } = input;
  if (newOwner !== 0) return false;
  if (!typCityCopyOwners.has(oldOwner)) return false;
  const oldCiv = aiOwnerCivMap.get(oldOwner);
  if (!oldCiv || oldCiv !== playerCivKey) return false;
  for (const oid of typCityCopyOwners) {
    if (oid === oldOwner) continue;
    if (aiOwnerCivMap.get(oid) !== playerCivKey) continue;
    if (countCitiesForOwner(oid, cities) >= 1) return false;
  }
  return true;
}
function buildTriumphCityStateUnificationMessage(civLabel, cityName) {
  const civ = (civLabel ?? "").trim() || "Twoja cywilizacja";
  const city = (cityName ?? "").trim() || "miasto";
  return `TRIUMF \u2014 ${civ} zjednoczeni! Ostatnie miasto-pa\u0144stwo Twojej cywilizacji (${city}) pad\u0142o. Jeste\u015B jedynym w\u0142adc\u0105.`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TRIUMPH_CS_HINT_MS,
  buildTriumphCityStateUnificationMessage,
  countCitiesForOwner,
  shouldShowPlayerTriumphCityStateUnification
});
