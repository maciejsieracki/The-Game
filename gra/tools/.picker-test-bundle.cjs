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

// tools/.picker-test-entry.ts
var picker_test_entry_exports = {};
__export(picker_test_entry_exports, {
  HEX_R: () => HEX_R,
  axialToWorld: () => axialToWorld,
  clientRectToNdc: () => clientRectToNdc,
  worldToAxial: () => worldToAxial
});
module.exports = __toCommonJS(picker_test_entry_exports);

// src/input/picker.ts
var SQRT3 = Math.sqrt(3);
function worldToAxial(x, z, R) {
  const rf = z / (R * 1.5);
  const qf = x / (R * SQRT3) - rf * 0.5;
  const xc = qf;
  const zc = rf;
  const yc = -xc - zc;
  let rx = Math.round(xc);
  let ry = Math.round(yc);
  let rz = Math.round(zc);
  const dx = Math.abs(rx - xc);
  const dy = Math.abs(ry - yc);
  const dz = Math.abs(rz - zc);
  if (dx > dy && dx > dz) {
    rx = -ry - rz;
  } else if (dy > dz) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return { q: rx, r: rz };
}
function clientRectToNdc(clientX, clientY, rect) {
  const { left, top, width, height } = rect;
  if (width <= 0 || height <= 0) return null;
  return {
    x: (clientX - left) / width * 2 - 1,
    y: -((clientY - top) / height) * 2 + 1
  };
}

// src/render/hexutil.ts
var HEX_R = 1;
var SQRT32 = Math.sqrt(3);
function axialToWorld(q, r, R = HEX_R) {
  const x = R * SQRT32 * (q + r * 0.5);
  const z = R * 1.5 * r;
  return { x, z };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HEX_R,
  axialToWorld,
  clientRectToNdc,
  worldToAxial
});
