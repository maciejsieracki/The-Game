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

// tools/.territory-border-entry.ts
var territory_border_entry_exports = {};
__export(territory_border_entry_exports, {
  collectTerritoryBoundaryEdges: () => collectTerritoryBoundaryEdges,
  computeTerritoryBorderLoops: () => computeTerritoryBorderLoops,
  makeAxialHexCenterFn: () => makeAxialHexCenterFn,
  traceTerritoryBoundaryLoops: () => traceTerritoryBoundaryLoops
});
module.exports = __toCommonJS(territory_border_entry_exports);

// src/render/hexutil.ts
var HEX_R = 1;
var SQRT3 = Math.sqrt(3);
function axialToWorld(q, r, R = HEX_R) {
  const x = R * SQRT3 * (q + r * 0.5);
  const z = R * 1.5 * r;
  return { x, z };
}

// src/map/territory-border.ts
var HEX_DIRS = [
  { dq: 1, dr: 0 },
  { dq: 1, dr: -1 },
  { dq: 0, dr: -1 },
  { dq: -1, dr: 0 },
  { dq: -1, dr: 1 },
  { dq: 0, dr: 1 }
];
function borderVertexKey(x, z) {
  return `${x.toFixed(5)},${z.toFixed(5)}`;
}
function hexCornerWorld(cx, cz, cornerIndex) {
  const a = Math.PI / 3 * cornerIndex;
  return {
    x: cx + HEX_R * Math.sin(a),
    z: cz + HEX_R * Math.cos(a)
  };
}
function collectTerritoryBoundaryEdges(hexKeys, hexCenter) {
  const edges = [];
  let id = 0;
  for (const key of hexKeys) {
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    const center = hexCenter(q, r);
    if (!center) continue;
    for (let i = 0; i < 6; i++) {
      const dir = HEX_DIRS[i];
      if (hexKeys.has(`${q + dir.dq},${r + dir.dr}`)) continue;
      const va = hexCornerWorld(center.x, center.z, (i + 1) % 6);
      const vb = hexCornerWorld(center.x, center.z, (i + 2) % 6);
      edges.push({
        id: id++,
        v0Key: borderVertexKey(va.x, va.z),
        v1Key: borderVertexKey(vb.x, vb.z),
        v0x: va.x,
        v0z: va.z,
        v1x: vb.x,
        v1z: vb.z
      });
    }
  }
  return edges;
}
function buildAdjacency(edges) {
  const adj = /* @__PURE__ */ new Map();
  const push = (fromKey, entry) => {
    let list = adj.get(fromKey);
    if (!list) {
      list = [];
      adj.set(fromKey, list);
    }
    list.push(entry);
  };
  for (const e of edges) {
    push(e.v0Key, { edgeId: e.id, toKey: e.v1Key, tox: e.v1x, toz: e.v1z });
    push(e.v1Key, { edgeId: e.id, toKey: e.v0Key, tox: e.v0x, toz: e.v0z });
  }
  return adj;
}
function pickNextEdge(adj, atKey, fromKey, vx, vz, prevx, prevz, used) {
  const options = (adj.get(atKey) ?? []).filter((o) => !used.has(o.edgeId) && o.toKey !== fromKey);
  if (options.length === 0) return null;
  if (options.length === 1) return options[0];
  const inx = vx - prevx;
  const inz = vz - prevz;
  let best = null;
  let bestCross = -Infinity;
  for (const o of options) {
    const outx = o.tox - vx;
    const outz = o.toz - vz;
    const cross = inx * outz - inz * outx;
    if (cross > 1e-8 && (best === null || cross < bestCross || bestCross <= 1e-8)) {
      best = o;
      bestCross = cross;
    }
  }
  if (best) return best;
  for (const o of options) {
    const outx = o.tox - vx;
    const outz = o.toz - vz;
    const cross = inx * outz - inz * outx;
    if (best === null || cross > bestCross) {
      best = o;
      bestCross = cross;
    }
  }
  return best;
}
function traceTerritoryBoundaryLoops(edges) {
  if (edges.length === 0) return [];
  const adj = buildAdjacency(edges);
  const used = /* @__PURE__ */ new Set();
  const loops = [];
  for (const start of edges) {
    if (used.has(start.id)) continue;
    const loop = [{ x: start.v0x, z: start.v0z }];
    let fromKey = start.v0Key;
    let prevx = start.v0x;
    let prevz = start.v0z;
    let atKey = start.v1Key;
    let atx = start.v1x;
    let atz = start.v1z;
    used.add(start.id);
    const maxSteps = edges.length + 2;
    for (let step = 0; step < maxSteps; step++) {
      loop.push({ x: atx, z: atz });
      if (atKey === start.v0Key && loop.length > 2) break;
      const next = pickNextEdge(adj, atKey, fromKey, atx, atz, prevx, prevz, used);
      if (!next) break;
      used.add(next.edgeId);
      fromKey = atKey;
      prevx = atx;
      prevz = atz;
      atKey = next.toKey;
      atx = next.tox;
      atz = next.toz;
    }
    if (loop.length >= 4) {
      const last = loop[loop.length - 1];
      const first = loop[0];
      if (Math.hypot(last.x - first.x, last.z - first.z) < 1e-4) loop.pop();
      if (loop.length >= 3) loops.push(loop);
    }
  }
  return loops;
}
function computeTerritoryBorderLoops(hexKeys, hexCenter) {
  const edges = collectTerritoryBoundaryEdges(hexKeys, hexCenter);
  return traceTerritoryBoundaryLoops(edges);
}
function makeAxialHexCenterFn() {
  return (q, r) => axialToWorld(q, r, HEX_R);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  collectTerritoryBoundaryEdges,
  computeTerritoryBorderLoops,
  makeAxialHexCenterFn,
  traceTerritoryBoundaryLoops
});
