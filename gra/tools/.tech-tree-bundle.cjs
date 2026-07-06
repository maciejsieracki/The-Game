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

// tools/.tech-tree-entry.ts
var tech_tree_entry_exports = {};
__export(tech_tree_entry_exports, {
  TECH_TREE_MODEL_LINEAR: () => TECH_TREE_MODEL_LINEAR,
  linearDepthInEpoch: () => linearDepthInEpoch,
  orderedTechsInEpoch: () => orderedTechsInEpoch,
  readTechTreeModel: () => readTechTreeModel,
  techPrereqChain: () => techPrereqChain,
  validateTechGraph: () => validateTechGraph
});
module.exports = __toCommonJS(tech_tree_entry_exports);

// src/game/research.ts
var BRAK_PREREQ = /* @__PURE__ */ new Set(["", "-", "\u2014", "\u2013", "brak", "none"]);
function parsePrerequisites(wyrazenie) {
  if (wyrazenie == null) return [];
  const trimmed = wyrazenie.trim();
  if (BRAK_PREREQ.has(trimmed.toLowerCase())) return [];
  return trimmed.split("+").map((part) => part.trim()).filter((part) => part.length > 0 && !BRAK_PREREQ.has(part.toLowerCase()));
}

// src/game/tech-tree.ts
var TECH_TREE_MODEL_LINEAR = "liniowe";
function readTechTreeModel(root) {
  const raw = (root.drzewko_model ?? TECH_TREE_MODEL_LINEAR).trim().toLowerCase();
  return raw === "rozga\u0142\u0119zione" || raw === "rozgalozione" ? "rozga\u0142\u0119zione" : TECH_TREE_MODEL_LINEAR;
}
function techByName(techs) {
  const map = /* @__PURE__ */ new Map();
  for (const t of techs) {
    if (t.Technologia) map.set(t.Technologia, t);
  }
  return map;
}
function orderedTechsInEpoch(techs, epoch) {
  const inEpoch = [];
  techs.forEach((t, idx) => {
    if ((t.Epoka ?? "").trim() === epoch) inEpoch.push({ t, idx });
  });
  inEpoch.sort((a, b) => {
    const pa = typeof a.t.Poziom === "number" ? a.t.Poziom : 0;
    const pb = typeof b.t.Poziom === "number" ? b.t.Poziom : 0;
    if (pa !== pb) return pa - pb;
    return a.idx - b.idx;
  });
  return inEpoch.map((x) => x.t);
}
function linearDepthInEpoch(techName, techs) {
  const byName = techByName(techs);
  const node = byName.get(techName);
  if (!node) return 0;
  const epoch = (node.Epoka ?? "").trim();
  const depthMap = /* @__PURE__ */ new Map();
  function depth(name) {
    if (depthMap.has(name)) return depthMap.get(name);
    const t = byName.get(name);
    if (!t) {
      depthMap.set(name, 0);
      return 0;
    }
    const sameEpochPrereqs = parsePrerequisites(t["Wymaga (prereq)"]).filter((p) => {
      const pr = byName.get(p);
      return pr !== void 0 && (pr.Epoka ?? "").trim() === epoch;
    });
    if (sameEpochPrereqs.length === 0) {
      depthMap.set(name, 0);
      return 0;
    }
    const d = Math.max(...sameEpochPrereqs.map((p) => depth(p))) + 1;
    depthMap.set(name, d);
    return d;
  }
  return depth(techName);
}
function techPrereqChain(techName, techs) {
  const byName = techByName(techs);
  const chain = [];
  let cur = techName.trim();
  const seen = /* @__PURE__ */ new Set();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.unshift(cur);
    const t = byName.get(cur);
    if (!t) break;
    const prereqs = parsePrerequisites(t["Wymaga (prereq)"]);
    if (prereqs.length === 0) break;
    cur = prereqs[0];
  }
  return chain;
}
function validateTechGraph(techs) {
  const byName = techByName(techs);
  const errors = [];
  const names = new Set(byName.keys());
  for (const t of techs) {
    const id = t.Technologia;
    if (!id) {
      errors.push("Wiersz bez pola Technologia");
      continue;
    }
    for (const p of parsePrerequisites(t["Wymaga (prereq)"])) {
      if (!names.has(p)) {
        errors.push(`${id}: brak prereq \u201E${p}"`);
      }
    }
  }
  const visiting = /* @__PURE__ */ new Set();
  const done = /* @__PURE__ */ new Set();
  function dfs(name) {
    if (done.has(name)) return true;
    if (visiting.has(name)) {
      errors.push(`Cykl prereq przy \u201E${name}"`);
      return false;
    }
    visiting.add(name);
    const t = byName.get(name);
    if (t) {
      for (const p of parsePrerequisites(t["Wymaga (prereq)"])) {
        if (names.has(p) && !dfs(p)) return false;
      }
    }
    visiting.delete(name);
    done.add(name);
    return true;
  }
  for (const name of names) dfs(name);
  return { ok: errors.length === 0, errors };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TECH_TREE_MODEL_LINEAR,
  linearDepthInEpoch,
  orderedTechsInEpoch,
  readTechTreeModel,
  techPrereqChain,
  validateTechGraph
});
