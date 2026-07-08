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

// tools/.pending-improvements-entry.ts
var pending_improvements_entry_exports = {};
__export(pending_improvements_entry_exports, {
  PendingImprovementsTurn: () => PendingImprovementsTurn,
  parsePendingImprovementId: () => parsePendingImprovementId,
  pendingImprovementId: () => pendingImprovementId
});
module.exports = __toCommonJS(pending_improvements_entry_exports);

// src/game/pending-improvements.ts
function pendingImprovementId(hexKey, improvementKey) {
  return `${hexKey}:${improvementKey}`;
}
function parsePendingImprovementId(id) {
  const idx = id.lastIndexOf(":");
  if (idx <= 0) return null;
  return { hexKey: id.slice(0, idx), key: id.slice(idx + 1) };
}
var PendingImprovementsTurn = class _PendingImprovementsTurn {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  get size() {
    return this.entries.size;
  }
  has(hexKey, key) {
    return this.entries.has(pendingImprovementId(hexKey, key));
  }
  get(hexKey, key) {
    return this.entries.get(pendingImprovementId(hexKey, key));
  }
  /** Zbiór id do kwalifikacji / podświetlenia cofania w build API. */
  getUndoKeySet() {
    return new Set(this.entries.keys());
  }
  add(entry) {
    this.entries.set(pendingImprovementId(entry.hexKey, entry.key), entry);
  }
  remove(hexKey, key) {
    const id = pendingImprovementId(hexKey, key);
    const e = this.entries.get(id);
    if (e) this.entries.delete(id);
    return e;
  }
  /** Koniec tury gracza — pending → committed (brak cofania). */
  commitTurn() {
    this.entries.clear();
  }
  toSave() {
    return [...this.entries.values()];
  }
  static fromSave(rows) {
    const p = new _PendingImprovementsTurn();
    if (rows?.length) {
      for (const e of rows) p.add(e);
    }
    return p;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PendingImprovementsTurn,
  parsePendingImprovementId,
  pendingImprovementId
});
