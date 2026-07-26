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

// tools/.dip-layers-entry.ts
var dip_layers_entry_exports = {};
__export(dip_layers_entry_exports, {
  computeDiplomaticContacts: () => computeDiplomaticContacts,
  diplomacyLayerForOwner: () => diplomacyLayerForOwner,
  filterDiplomacyCommandsForEstablishedContact: () => filterDiplomacyCommandsForEstablishedContact
});
module.exports = __toCommonJS(dip_layers_entry_exports);

// src/game/diplomacy.ts
var ARCHETYPE_AGGRESSION = {
  ["grecy" /* Grecy */]: 0.4,
  ["rzymianie" /* Rzymianie */]: 0.75,
  ["chinczycy" /* Chinczycy */]: 0.2,
  ["inkowie" /* Inkowie */]: 0.45,
  ["zulusi" /* Zulusi */]: 0.9,
  ["egipt" /* Egipt */]: 0.35,
  ["babilon" /* Babilon */]: 0.3,
  ["sumer" /* Sumer */]: 0.3,
  ["celtowie" /* Celtowie */]: 0.6,
  ["germanie" /* Germanie */]: 0.65,
  ["harappa" /* Harappa */]: 0.2,
  ["hetyci" /* Hetyci */]: 0.5,
  ["slowianie" /* Slowianie */]: 0.6,
  ["babilonia" /* Babilonia */]: 0.4,
  ["asyria" /* Asyria */]: 0.8,
  ["fenicjanie" /* Fenicjanie */]: 0.3,
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.15
};
var ARCHETYPE_TRADE = {
  ["grecy" /* Grecy */]: 0.75,
  ["rzymianie" /* Rzymianie */]: 0.5,
  ["chinczycy" /* Chinczycy */]: 0.85,
  ["inkowie" /* Inkowie */]: 0.25,
  ["zulusi" /* Zulusi */]: 0.2,
  ["egipt" /* Egipt */]: 0.6,
  ["babilon" /* Babilon */]: 0.65,
  ["sumer" /* Sumer */]: 0.65,
  ["celtowie" /* Celtowie */]: 0.35,
  ["germanie" /* Germanie */]: 0.3,
  ["harappa" /* Harappa */]: 0.8,
  ["hetyci" /* Hetyci */]: 0.5,
  ["slowianie" /* Slowianie */]: 0.4,
  ["babilonia" /* Babilonia */]: 0.6,
  ["asyria" /* Asyria */]: 0.3,
  ["fenicjanie" /* Fenicjanie */]: 0.9,
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.6
};

// src/game/diplomacy-layers.ts
function hexKey(q, r) {
  return `${q},${r}`;
}
function computeDiplomaticContacts(visible, cities, units, playerOwnerId = 0) {
  const contacted = /* @__PURE__ */ new Set();
  for (const c of cities) {
    if (c.ownerId === playerOwnerId) continue;
    if (visible.has(hexKey(c.q, c.r))) contacted.add(c.ownerId);
  }
  for (const u of units) {
    if (u.ownerId === playerOwnerId) continue;
    if (visible.has(hexKey(u.q, u.r))) contacted.add(u.ownerId);
  }
  return contacted;
}
function diplomacyLayerForOwner(ownerId, simplifiedOwners, foreignTypeOwners, contactedOwners) {
  if (foreignTypeOwners === void 0 || contactedOwners === void 0) {
    return simplifiedOwners.has(ownerId) ? "simplified" : "full";
  }
  if (!contactedOwners.has(ownerId)) {
    return "pre_contact";
  }
  if (simplifiedOwners.has(ownerId)) return "simplified";
  return "full";
}
var ESTABLISHED_CONTACT_CMDS = /* @__PURE__ */ new Set([
  "zaproponuj_pokoj",
  "zaproponuj_sojusz",
  "zaproponuj_handel",
  "zaproponuj_umowe_handlowa",
  "zaproponuj_handel_surowiec",
  "zadaj_trybut",
  "oferuj_trybut_za_pokoj"
]);
function filterDiplomacyCommandsForEstablishedContact(cmds, contactEstablished) {
  if (contactEstablished) return cmds;
  return cmds.filter((c) => !ESTABLISHED_CONTACT_CMDS.has(c.type));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  computeDiplomaticContacts,
  diplomacyLayerForOwner,
  filterDiplomacyCommandsForEstablishedContact
});
