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

// tools/.science-hub-test-entry.ts
var science_hub_test_entry_exports = {};
__export(science_hub_test_entry_exports, {
  availableTechs: () => availableTechs,
  buildHubTechEntries: () => buildHubTechEntries,
  createPlayerState: () => createPlayerState,
  normalizeSlugSet: () => normalizeSlugSet
});
module.exports = __toCommonJS(science_hub_test_entry_exports);

// src/ui/scienceHubSnapshotLogic.ts
function normalizeTechSlug(raw, slugify, techById) {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return "";
  if (techById.has(trimmed)) return trimmed;
  const slug = slugify(trimmed);
  if (techById.has(slug)) return slug;
  for (const [id, node] of techById) {
    if (node.nazwa === trimmed) return id;
  }
  return slug;
}
function normalizeSlugSet(ids, slugify, techById) {
  const out = /* @__PURE__ */ new Set();
  for (const raw of ids) {
    const slug = normalizeTechSlug(raw, slugify, techById);
    if (slug !== "") out.add(slug);
  }
  return out;
}
var EPOCH_ORDER = ["Kamie\u0144", "Br\u0105z", "\u017Belazo"];
function hubEpochLabel(playerEra, targetSlug, techById, slugify) {
  if (targetSlug) {
    const norm = normalizeTechSlug(targetSlug, slugify, techById);
    const targetNode = techById.get(norm);
    if (targetNode) return targetNode.epoka;
  }
  if (playerEra === void 0) return null;
  const idx = Math.max(0, Math.min(EPOCH_ORDER.length - 1, Math.round(playerEra) - 1));
  return EPOCH_ORDER[idx] ?? "Kamie\u0144";
}
function buildHubTechEntries(input) {
  const {
    techById,
    slugify,
    researchedRaw,
    availableRaw,
    targetSlug,
    playerEra,
    costFor
  } = input;
  const researched = normalizeSlugSet(researchedRaw, slugify, techById);
  const available = normalizeSlugSet(availableRaw, slugify, techById);
  const targetNorm = targetSlug ? normalizeTechSlug(targetSlug, slugify, techById) : null;
  if (targetNorm && !researched.has(targetNorm)) available.add(targetNorm);
  const eraLabel = hubEpochLabel(playerEra, targetNorm, techById, slugify);
  const eraNodes = eraLabel === null ? [...techById.values()] : [...techById.values()].filter((n) => n.epoka === eraLabel);
  const entries = [];
  const added = /* @__PURE__ */ new Set();
  let lockedCount = 0;
  for (const slug of available) {
    const node = techById.get(slug);
    if (!node || researched.has(slug)) continue;
    if (eraLabel !== null && node.epoka !== eraLabel) continue;
    if (added.has(slug)) continue;
    added.add(slug);
    entries.push({
      id: node.id,
      name: node.nazwa,
      epoka: node.epoka,
      koszt: costFor(node.koszt, node.epoka),
      locked: false,
      isTarget: slug === targetNorm
    });
  }
  for (const node of eraNodes) {
    if (researched.has(node.id) || added.has(node.id)) continue;
    if (lockedCount >= 4) break;
    added.add(node.id);
    entries.push({
      id: node.id,
      name: node.nazwa,
      epoka: node.epoka,
      koszt: costFor(node.koszt, node.epoka),
      locked: true,
      isTarget: false
    });
    lockedCount++;
  }
  entries.sort((a, b) => {
    if (a.locked !== b.locked) return a.locked ? 1 : -1;
    return a.name.localeCompare(b.name, "pl");
  });
  return entries;
}

// src/game/r-stawki-strojenie.ts
var R_STAWKI_KOSZT_MULT = 2;
var R_STAWKI_FALA2_MULT = 2;
var R_STAWKI_FALA1_FALA2_MULT = R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT;

// src/game/research.ts
var BRAK_PREREQ = /* @__PURE__ */ new Set(["", "-", "\u2014", "\u2013", "brak", "none"]);
function empireBuiltSet(gate) {
  return gate.empireBuiltIds instanceof Set ? gate.empireBuiltIds : new Set(gate.empireBuiltIds);
}
function resolveRequiredBuildingId(requiredLabel, buildings) {
  const raw = requiredLabel.trim();
  if (!raw || BRAK_PREREQ.has(raw.toLowerCase())) return null;
  for (const b of buildings) {
    if (b.id === raw) return b.id;
    const nazwa = (b.nazwa ?? "").trim();
    if (nazwa === raw) return b.id;
  }
  const lower = raw.toLowerCase();
  for (const b of buildings) {
    if (b.id.toLowerCase() === lower) return b.id;
    const nazwa = (b.nazwa ?? "").trim().toLowerCase();
    if (nazwa === lower) return b.id;
  }
  return raw;
}
function buildingGateMet(tech, gate) {
  const label = tech["wymagany budynek"];
  if (label == null) return true;
  const trimmed = String(label).trim();
  if (!trimmed || BRAK_PREREQ.has(trimmed.toLowerCase())) return true;
  const reqId = resolveRequiredBuildingId(trimmed, gate.buildings);
  if (!reqId) return true;
  return empireBuiltSet(gate).has(reqId);
}
var PL_DIACRITICS = {
  "\u0105": "a",
  "\u0107": "c",
  "\u0119": "e",
  "\u0142": "l",
  "\u0144": "n",
  "\xF3": "o",
  "\u015B": "s",
  "\u017A": "z",
  "\u017C": "z"
};
function slugifyImprovementLabel(label) {
  return label.trim().toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL_DIACRITICS[c] ?? c).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function empireImprovementSet(gate) {
  const src = gate.empireImprovementKeys;
  if (!src) return /* @__PURE__ */ new Set();
  return src instanceof Set ? src : new Set(src);
}
function improvementGateMet(tech, gate) {
  const label = tech["wymagane ulepszenie"];
  if (label == null) return true;
  const trimmed = String(label).trim();
  if (!trimmed || BRAK_PREREQ.has(trimmed.toLowerCase())) return true;
  const wanted = slugifyImprovementLabel(trimmed);
  if (!wanted) return true;
  return empireImprovementSet(gate).has(wanted);
}
function researchGatesMet(tech, gate) {
  return buildingGateMet(tech, gate) && improvementGateMet(tech, gate);
}

// src/game/playerState.ts
function asResearchGate(g) {
  return {
    empireBuiltIds: g.empireBuiltIds,
    buildings: g.buildings,
    empireImprovementKeys: g.empireImprovementKeys
  };
}
var BRAK_PREREQ2 = /* @__PURE__ */ new Set(["", "-", "\u2014", "\u2013", "brak", "none"]);
function createPlayerState() {
  return {
    skarbiec: 0,
    nauka: 0,
    zbadane: /* @__PURE__ */ new Set(),
    badana: null,
    playerResearchTargetId: null,
    researchQueue: [],
    era: 1,
    pieniadzMnoznik: 1,
    tempoGry: "standardowa",
    buildingCostPace: "niski",
    kosztJednostekPace: "niski",
    wzrostLudnosciPace: "wysoki",
    civType: "grecy",
    // default: Grecy; nadpisywany przez applyMenuParams
    civBonusy: [],
    // puste do czasu startu gry
    rakietaWystrzelona: false
  };
}
function techId(t) {
  return (t.Technologia ?? "").trim();
}
function parsePrereqs(t) {
  const raw = (t["Wymaga (prereq)"] ?? "").trim();
  if (raw === "" || BRAK_PREREQ2.has(raw.toLowerCase())) return [];
  return raw.split("+").map((s) => s.trim()).filter((s) => s.length > 0 && !BRAK_PREREQ2.has(s.toLowerCase()));
}
function prereqsMet(t, researched) {
  return parsePrereqs(t).every((p) => researched.has(p));
}
var PL_DIAKRYTYKI_EPOKA = {
  "\u0105": "a",
  "\u0107": "c",
  "\u0119": "e",
  "\u0142": "l",
  "\u0144": "n",
  "\xF3": "o",
  "\u015B": "s",
  "\u017A": "z",
  "\u017C": "z"
};
var NUMER_EPOKI = {
  kamien: 1,
  braz: 2,
  zelazo: 3
};
function epochNumber(t) {
  const raw = t.Epoka;
  if (raw == null) return null;
  const norm = String(raw).trim().toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL_DIAKRYTYKI_EPOKA[c] ?? c);
  const n = NUMER_EPOKI[norm];
  return typeof n === "number" ? n : null;
}
function epochGateMet(t, techs, done) {
  const e = epochNumber(t);
  if (e == null) return true;
  for (const other of techs) {
    const oe = epochNumber(other);
    if (oe == null) continue;
    if (oe < e && !done.has(techId(other))) return false;
  }
  return true;
}
function epochTierGateMet(t, techs, done) {
  const e = epochNumber(t);
  const p = t.Poziom;
  if (e == null || typeof p !== "number" || !Number.isFinite(p)) return true;
  for (const other of techs) {
    if (epochNumber(other) !== e) continue;
    const op = other.Poziom;
    if (typeof op !== "number" || !Number.isFinite(op)) continue;
    if (op < p && !done.has(techId(other))) return false;
  }
  return true;
}
function availableTechs(techs, researched, gate) {
  return techs.filter((t) => {
    const id = techId(t);
    if (id === "" || researched.has(id)) return false;
    if (!prereqsMet(t, researched)) return false;
    if (!epochGateMet(t, techs, researched)) return false;
    if (!epochTierGateMet(t, techs, researched)) return false;
    if (gate && !researchGatesMet(t, asResearchGate(gate))) return false;
    return true;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  availableTechs,
  buildHubTechEntries,
  createPlayerState,
  normalizeSlugSet
});
