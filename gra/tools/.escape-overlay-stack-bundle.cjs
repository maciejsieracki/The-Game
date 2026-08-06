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

// tools/.escape-overlay-stack-test-entry.ts
var escape_overlay_stack_test_entry_exports = {};
__export(escape_overlay_stack_test_entry_exports, {
  _dispatchEscapeForTest: () => _dispatchEscapeForTest,
  _getEscapeOverlayStackDepthForTest: () => _getEscapeOverlayStackDepthForTest,
  _resetEscapeOverlayStackForTest: () => _resetEscapeOverlayStackForTest,
  popOverlay: () => popOverlay,
  pushOverlay: () => pushOverlay,
  top: () => top
});
module.exports = __toCommonJS(escape_overlay_stack_test_entry_exports);

// src/ui/escapeOverlayStack.ts
var stack = [];
var escapeLocked = false;
var globalListenerAttached = false;
function keyboardLockApi() {
  const nav = navigator;
  const kb = nav.keyboard;
  if (kb === void 0 || typeof kb.lock !== "function" || typeof kb.unlock !== "function") return null;
  return kb;
}
function lockEscapeKey() {
  if (escapeLocked) return;
  const kb = keyboardLockApi();
  if (kb === null) return;
  escapeLocked = true;
  void kb.lock(["Escape"]).catch(() => {
    escapeLocked = false;
  });
}
function unlockEscapeKey() {
  if (!escapeLocked) return;
  escapeLocked = false;
  const kb = keyboardLockApi();
  if (kb === null) return;
  try {
    kb.unlock();
  } catch {
  }
}
function lockEscapeWhileStacked() {
  if (stack.length > 0) lockEscapeKey();
  else unlockEscapeKey();
}
function syncKeyboardLock() {
  lockEscapeWhileStacked();
}
function onGlobalKeyDown(e) {
  if (e.key !== "Escape") return;
  const entry = stack[stack.length - 1];
  if (entry === void 0) return;
  e.preventDefault();
  e.stopPropagation();
  entry.onClose();
}
function hasDocument() {
  return typeof globalThis !== "undefined" && "document" in globalThis;
}
function ensureGlobalListener() {
  if (globalListenerAttached || !hasDocument()) return;
  document.addEventListener("keydown", onGlobalKeyDown, true);
  globalListenerAttached = true;
}
function removeGlobalListenerIfEmpty() {
  if (stack.length > 0 || !globalListenerAttached || !hasDocument()) return;
  document.removeEventListener("keydown", onGlobalKeyDown, true);
  globalListenerAttached = false;
}
function pushOverlay(id, onClose) {
  const existing = stack.findIndex((e) => e.id === id);
  if (existing >= 0) stack.splice(existing, 1);
  stack.push({ id, onClose });
  ensureGlobalListener();
  syncKeyboardLock();
}
function popOverlay(id) {
  if (id === void 0) {
    stack.pop();
  } else {
    const idx = stack.findIndex((e) => e.id === id);
    if (idx >= 0) stack.splice(idx, 1);
  }
  removeGlobalListenerIfEmpty();
  syncKeyboardLock();
}
function top() {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}
function _resetEscapeOverlayStackForTest() {
  stack.length = 0;
  if (globalListenerAttached && hasDocument()) {
    document.removeEventListener("keydown", onGlobalKeyDown, true);
    globalListenerAttached = false;
  }
  unlockEscapeKey();
}
function _getEscapeOverlayStackDepthForTest() {
  return stack.length;
}
function _dispatchEscapeForTest() {
  const entry = stack[stack.length - 1];
  if (entry === void 0) return;
  entry.onClose();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  _dispatchEscapeForTest,
  _getEscapeOverlayStackDepthForTest,
  _resetEscapeOverlayStackForTest,
  popOverlay,
  pushOverlay,
  top
});
