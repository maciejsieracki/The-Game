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

// tools/.danina-podatek-nazwa-entry.ts
var danina_podatek_nazwa_entry_exports = {};
__export(danina_podatek_nazwa_entry_exports, {
  daninaLabel: () => daninaLabel,
  daninaLabelForOwnerByCityList: () => daninaLabelForOwnerByCityList,
  isPodatekActive: () => isPodatekActive,
  mennicaWStolicy: () => mennicaWStolicy
});
module.exports = __toCommonJS(danina_podatek_nazwa_entry_exports);

// src/game/danina-nazwa.ts
function isPodatekActive(walutaOdkryta, mennicaWStolicy2) {
  return walutaOdkryta === true && mennicaWStolicy2 === true;
}
function daninaLabel(walutaOdkryta, mennicaWStolicy2) {
  return isPodatekActive(walutaOdkryta, mennicaWStolicy2) ? "Podatek" : "Danina";
}
function mennicaWStolicy(capitalCityId, builtBuildingIdsForCapital) {
  if (!capitalCityId) return false;
  return (builtBuildingIdsForCapital ?? []).includes("mennica");
}
function daninaLabelForOwnerByCityList(ownerId, walutaOdkryta, cities, builtByCity, capitalCityId) {
  const capId = capitalCityId ?? cities.find((c) => c.ownerId === ownerId)?.id ?? null;
  const hasMennicaWStolicy = mennicaWStolicy(capId, capId ? builtByCity.get(capId) : void 0);
  return daninaLabel(walutaOdkryta, hasMennicaWStolicy);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  daninaLabel,
  daninaLabelForOwnerByCityList,
  isPodatekActive,
  mennicaWStolicy
});
