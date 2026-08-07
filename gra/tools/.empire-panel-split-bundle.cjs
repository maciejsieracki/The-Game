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

// tools/.empire-panel-split-entry.ts
var empire_panel_split_entry_exports = {};
__export(empire_panel_split_entry_exports, {
  empirePanelBlockForSection: () => empirePanelBlockForSection,
  empireSectionFromHudAct: () => empireSectionFromHudAct
});
module.exports = __toCommonJS(empire_panel_split_entry_exports);

// src/ui/empirePanelSectionMap.ts
function empirePanelBlockForSection(section) {
  if (!section) return "all";
  if (section === "ekonomia") return "ekonomia";
  if (section === "armia") return "armia";
  if (section === "spichlerz" || section === "spichlerz-centralny") return "spichlerz";
  if (section === "surowce" || section.startsWith("econ-surowiec-")) return "surowce";
  if (section === "handel") return "handel";
  if (section === "kultura") return "kultura";
  if (section === "moc") return "moc";
  if (section === "parametry") return "parametry";
  if (section.startsWith("econ-")) return "ekonomia";
  return "ekonomia";
}
function empireSectionFromHudAct(act) {
  switch (act) {
    case "skarbiec":
      return "econ-skarbiec";
    case "praca":
      return "econ-praca";
    case "kultura":
      return "kultura";
    case "miasta":
    case "ludnosc":
      return "econ-miasta";
    case "rekruci":
      return "econ-rekruci";
    case "power":
    case "moc":
      return "moc";
    case "nauka":
      return "econ-nauka";
    case "zywnosc":
    case "spichlerz":
      return "spichlerz";
    case "armia":
      return "armia";
    case "religia":
      return "econ-religia";
    case "empire":
      return "ekonomia";
    case "surowce":
      return "surowce";
    case "handel":
      return "handel";
    default:
      return void 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  empirePanelBlockForSection,
  empireSectionFromHudAct
});
