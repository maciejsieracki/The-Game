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

// tools/.city-names-pools-entry.ts
var city_names_pools_entry_exports = {};
__export(city_names_pools_entry_exports, {
  MIASTA_CYWILIZACJI_LEN: () => MIASTA_CYWILIZACJI_LEN,
  NAZWY_KLASTRA_LEN: () => NAZWY_KLASTRA_LEN,
  pickAiFoundedCityName: () => pickAiFoundedCityName,
  validateCityNamesPools: () => validateCityNamesPools
});
module.exports = __toCommonJS(city_names_pools_entry_exports);

// src/game/civ-names.ts
var NAZWY_KLASTRA_LEN = 10;
var MIASTA_CYWILIZACJI_LEN = 100;
function getMiastaCywilizacji(pools, ikonaId) {
  return pools[ikonaId]?.miasta_cywilizacji ?? [];
}
function pickAiFoundedCityName(pools, ikonaId, usedNames, ownerCityCount) {
  const pool = getMiastaCywilizacji(pools, ikonaId);
  for (const name of pool) {
    if (!usedNames.has(name)) return name;
  }
  return `Miasto ${ownerCityCount + 1}`;
}
function validateCityNamesPools(pools, civs) {
  const errs = [];
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId;
    if (!id) continue;
    const entry = pools[id];
    if (!entry) {
      errs.push(`Brak puli: ${id}`);
      continue;
    }
    const cyw = entry.miasta_cywilizacji ?? [];
    const pan = entry.miasta_panstwa ?? [];
    if (cyw.length !== MIASTA_CYWILIZACJI_LEN) {
      errs.push(`${id}: miasta_cywilizacji ${cyw.length}/${MIASTA_CYWILIZACJI_LEN}`);
    }
    if (pan.length !== NAZWY_KLASTRA_LEN) {
      errs.push(`${id}: miasta_panstwa ${pan.length}/${NAZWY_KLASTRA_LEN}`);
    }
    if (new Set(cyw).size !== cyw.length) errs.push(`${id}: duplikaty miasta_cywilizacji`);
    if (new Set(pan).size !== pan.length) errs.push(`${id}: duplikaty miasta_panstwa`);
    const klastra = c.nazwyKlastra ?? [];
    if (JSON.stringify(klastra) !== JSON.stringify(pan)) {
      errs.push(`${id}: nazwyKlastra \u2260 miasta_panstwa`);
    }
  }
  return errs;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MIASTA_CYWILIZACJI_LEN,
  NAZWY_KLASTRA_LEN,
  pickAiFoundedCityName,
  validateCityNamesPools
});
