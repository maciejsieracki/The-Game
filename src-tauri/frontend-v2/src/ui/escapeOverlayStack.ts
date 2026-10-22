/**
 * escapeOverlayStack.ts
 * Wspólny stos nakładek mapy — Escape zamyka wierzchni panel bez wychodzenia z pełnego ekranu.
 * Decyzja R-ESC-PELNY-EKRAN-Q1=A (Maciej 2026-08-06).
 *
 * Gdy stos niepusty: Keyboard Lock API (`navigator.keyboard.lock(['Escape'])`) jak drzewko tech.
 */

export interface EscapeOverlayEntry {
  id: string;
  onClose: () => void;
}

const stack: EscapeOverlayEntry[] = [];

let escapeLocked = false;
let globalListenerAttached = false;

interface KeyboardLockApi {
  lock(keyCodes?: readonly string[]): Promise<void>;
  unlock(): void;
}

function keyboardLockApi(): KeyboardLockApi | null {
  const nav = navigator as Navigator & { keyboard?: KeyboardLockApi };
  const kb = nav.keyboard;
  if (kb === undefined || typeof kb.lock !== 'function' || typeof kb.unlock !== 'function') return null;
  return kb;
}

function lockEscapeKey(): void {
  if (escapeLocked) return;
  const kb = keyboardLockApi();
  if (kb === null) return;
  escapeLocked = true;
  void kb.lock(['Escape']).catch(() => {
    escapeLocked = false;
  });
}

function unlockEscapeKey(): void {
  if (!escapeLocked) return;
  escapeLocked = false;
  const kb = keyboardLockApi();
  if (kb === null) return;
  try { kb.unlock(); } catch { /* brak wsparcia */ }
}

/** Utrzymuj blokadę Escape gdy stos niepusty (wołane wewnętrznie po push/pop). */
export function lockEscapeWhileStacked(): void {
  if (stack.length > 0) lockEscapeKey();
  else unlockEscapeKey();
}

function syncKeyboardLock(): void {
  lockEscapeWhileStacked();
}

function onGlobalKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return;
  const entry = stack[stack.length - 1];
  if (entry === undefined) return;
  e.preventDefault();
  e.stopPropagation();
  entry.onClose();
}

function hasDocument(): boolean {
  return typeof globalThis !== 'undefined' && 'document' in globalThis;
}

function ensureGlobalListener(): void {
  if (globalListenerAttached || !hasDocument()) return;
  document.addEventListener('keydown', onGlobalKeyDown, true);
  globalListenerAttached = true;
}

function removeGlobalListenerIfEmpty(): void {
  if (stack.length > 0 || !globalListenerAttached || !hasDocument()) return;
  document.removeEventListener('keydown', onGlobalKeyDown, true);
  globalListenerAttached = false;
}

/** Dodaj nakładkę na wierzch stosu (ten sam id → przeniesienie na wierzch). */
export function pushOverlay(id: string, onClose: () => void): void {
  const existing = stack.findIndex(e => e.id === id);
  if (existing >= 0) stack.splice(existing, 1);
  stack.push({ id, onClose });
  ensureGlobalListener();
  syncKeyboardLock();
}

/** Zdejmij nakładkę po id lub wierzchnią gdy id pominięte. */
export function popOverlay(id?: string): void {
  if (id === undefined) {
    stack.pop();
  } else {
    const idx = stack.findIndex(e => e.id === id);
    if (idx >= 0) stack.splice(idx, 1);
  }
  removeGlobalListenerIfEmpty();
  syncKeyboardLock();
}

/** Wierzchnia nakładka lub null. */
export function top(): EscapeOverlayEntry | null {
  return stack.length > 0 ? stack[stack.length - 1]! : null;
}

/** Czy stos ma aktywne nakładki (dla main.ts — pomiń lokalny Escape). */
export function isEscapeOverlayStackActive(): boolean {
  return stack.length > 0;
}

/** Wołane z głównego listenera gdy stos obsłużył Escape (capture już zadziałał). */
export function handleEscapeKeydown(e: KeyboardEvent): boolean {
  if (e.key !== 'Escape' || stack.length === 0) return false;
  return true;
}

// --- test hooks (bez DOM) ---

export function _resetEscapeOverlayStackForTest(): void {
  stack.length = 0;
  if (globalListenerAttached && hasDocument()) {
    document.removeEventListener('keydown', onGlobalKeyDown, true);
    globalListenerAttached = false;
  }
  unlockEscapeKey();
}

export function _getEscapeOverlayStackDepthForTest(): number {
  return stack.length;
}

export function _dispatchEscapeForTest(): void {
  const entry = stack[stack.length - 1];
  if (entry === undefined) return;
  entry.onClose();
}
