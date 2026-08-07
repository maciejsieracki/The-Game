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
  validateCityNamesPools: () => validateCityNamesPools2
});
module.exports = __toCommonJS(city_names_pools_entry_exports);

// src/game/city-names-pool.ts
var CITY_NAMES_POOL_REGULAR_LEN = 100;
var CITY_NAMES_POOL_STATE_LEN = 10;
var NAZWY_KLASTRA_LEN = CITY_NAMES_POOL_STATE_LEN;
function poolEntry(pools, ikonaId) {
  return pools[ikonaId];
}
function cityNameWithSuffix(base, ordinal) {
  if (ordinal <= 1) return base;
  const roman = ["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const suffix = ordinal <= 10 ? roman[ordinal] : String(ordinal);
  return `${base} ${suffix}`;
}
function pickNextRegularCityName(pools, ikonaId, usedNames) {
  const regular = poolEntry(pools, ikonaId)?.miasta_cywilizacji ?? [];
  for (const name of regular) {
    if (!usedNames.has(name)) return name;
  }
  const base = regular[0] ?? "Miasto";
  let ord = 2;
  while (usedNames.has(cityNameWithSuffix(base, ord))) ord++;
  return cityNameWithSuffix(base, ord);
}
function validateCityNamesPools(pools, civs) {
  const errs = [];
  const civIds = civs.cywilizacje.map((c) => c.ikonaId).filter((id) => Boolean(id));
  for (const cid of civIds) {
    const entry = pools[cid];
    if (!entry) {
      errs.push(`${cid}: brak wpisu w city-names-pools.json`);
      continue;
    }
    const cyw = entry.miasta_cywilizacji ?? [];
    const pan = entry.miasta_panstwa ?? [];
    if (cyw.length < CITY_NAMES_POOL_REGULAR_LEN) {
      errs.push(`${cid}: miasta_cywilizacji ${cyw.length} < ${CITY_NAMES_POOL_REGULAR_LEN}`);
    }
    if (pan.length !== CITY_NAMES_POOL_STATE_LEN) {
      errs.push(`${cid}: miasta_panstwa ${pan.length} !== ${CITY_NAMES_POOL_STATE_LEN}`);
    }
    if (new Set(cyw).size !== cyw.length) {
      errs.push(`${cid}: duplikaty w miasta_cywilizacji`);
    }
    if (new Set(pan).size !== pan.length) {
      errs.push(`${cid}: duplikaty w miasta_panstwa`);
    }
  }
  return errs;
}

// src/game/civ-names.ts
var MIASTA_CYWILIZACJI_LEN = 100;
function pickAiFoundedCityName(pools, ikonaId, usedNames, _ownerCityCount) {
  return pickNextRegularCityName(pools, ikonaId, usedNames);
}
function validateCityNamesPools2(pools, civs) {
  const errs = validateCityNamesPools(pools, civs);
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId;
    if (!id || !pools[id]) continue;
    const pan = pools[id].miasta_panstwa ?? [];
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
