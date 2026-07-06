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

// tools/.civ-names-entry.ts
var civ_names_entry_exports = {};
__export(civ_names_entry_exports, {
  NAZWY_KLASTRA_LEN: () => NAZWY_KLASTRA_LEN,
  clusterRivalCityName: () => clusterRivalCityName,
  playerStartCityName: () => playerStartCityName,
  validateNazwyKlastra: () => validateNazwyKlastra
});
module.exports = __toCommonJS(civ_names_entry_exports);

// src/game/civ-names.ts
var NAZWY_KLASTRA_LEN = 10;
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
function playerStartCityName(civs, playerCivId) {
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, 0, "Stolica");
}
function clusterRivalCityName(civs, playerCivId, rivalIndex1Based) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NAZWY_KLASTRA_LEN,
  clusterRivalCityName,
  playerStartCityName,
  validateNazwyKlastra
});
