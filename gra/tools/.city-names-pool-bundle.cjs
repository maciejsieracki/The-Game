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

// tools/.city-names-pool-entry.ts
var city_names_pool_entry_exports = {};
__export(city_names_pool_entry_exports, {
  MIASTA_CYWILIZACJI_LEN: () => MIASTA_CYWILIZACJI_LEN,
  NAZWY_KLASTRA_LEN: () => NAZWY_KLASTRA_LEN,
  clusterRivalCityName: () => clusterRivalCityName,
  pickAiFoundedCityName: () => pickAiFoundedCityName,
  pickNextRegularCityName: () => pickNextRegularCityName,
  playerStartCityName: () => playerStartCityName,
  suggestPlayerFoundCityName: () => suggestPlayerFoundCityName,
  validateCityNamesPools: () => validateCityNamesPools2,
  validateNazwyKlastra: () => validateNazwyKlastra
});
module.exports = __toCommonJS(city_names_pool_entry_exports);

// src/game/city-names-pool.ts
var CITY_NAMES_POOL_REGULAR_LEN = 100;
var CITY_NAMES_POOL_STATE_LEN = 10;
function poolEntry(pools, ikonaId) {
  return pools[ikonaId];
}
function stateCityNameAt(pools, ikonaId, index, fallback) {
  const pan = poolEntry(pools, ikonaId)?.miasta_panstwa;
  if (pan && index >= 0 && index < pan.length && pan[index]) {
    return pan[index];
  }
  return fallback;
}
function playerCapitalFromPool(pools, ikonaId) {
  return stateCityNameAt(pools, ikonaId, 0, "Stolica");
}
function clusterRivalFromPool(pools, ikonaId, rivalIndex1Based) {
  return stateCityNameAt(pools, ikonaId, rivalIndex1Based, `Rywal ${rivalIndex1Based}`);
}
function collectUsedCityNamesFromCities(cities, civTypeForOwner, targetCivId) {
  const used = /* @__PURE__ */ new Set();
  for (const c of cities) {
    if (civTypeForOwner(c.ownerId) === targetCivId) {
      used.add(c.name);
    }
  }
  return used;
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
function suggestPlayerFoundCityName(pools, ikonaId, cities, civTypeForOwner, playerOwnerId = 0) {
  const playerCityCount = cities.filter((c) => c.ownerId === playerOwnerId).length;
  if (playerCityCount === 0) {
    return playerCapitalFromPool(pools, ikonaId);
  }
  const used = collectUsedCityNamesFromCities(cities, civTypeForOwner, ikonaId);
  return pickNextRegularCityName(pools, ikonaId, used);
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
var NAZWY_KLASTRA_LEN = 10;
var MIASTA_CYWILIZACJI_LEN = 100;
function findCivByIkonaId(civs, ikonaId) {
  return civs.cywilizacje.find((c) => c.ikonaId === ikonaId);
}
function getNazwyKlastra(civs, ikonaId) {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.nazwyKlastra ?? [];
}
function nazwaKlastraAt(names, index, fallback) {
  if (index >= 0 && index < names.length && names[index]) {
    return names[index];
  }
  return fallback;
}
function playerStartCityName(civs, playerCivId, pools) {
  if (pools?.[playerCivId]) {
    return playerCapitalFromPool(pools, playerCivId);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, 0, "Stolica");
}
function clusterRivalCityName(civs, playerCivId, rivalIndex1Based, pools) {
  if (pools?.[playerCivId]) {
    return clusterRivalFromPool(pools, playerCivId, rivalIndex1Based);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, rivalIndex1Based, `Rywal ${rivalIndex1Based}`);
}
function validateNazwyKlastra(civs) {
  const errs = [];
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId ?? c.Cywilizacja;
    const n = c.nazwyKlastra?.length ?? 0;
    if (n !== NAZWY_KLASTRA_LEN) {
      errs.push(`${id}: oczekiwano ${NAZWY_KLASTRA_LEN} nazw, jest ${n}`);
    }
  }
  return errs;
}
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
  clusterRivalCityName,
  pickAiFoundedCityName,
  pickNextRegularCityName,
  playerStartCityName,
  suggestPlayerFoundCityName,
  validateCityNamesPools,
  validateNazwyKlastra
});
