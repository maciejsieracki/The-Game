/**
 * hudTitleTooltip.ts — większe podpisy hover (atrybut title) dla HUD / toolbar / ikon.
 * Zastępuje natywne tooltips (niepodatne na stylowanie CSS).
 * NIE dotyka kart szczegółów (.hover-detail-anchor, .civ-detail-scope, dock).
 *
 * Maciej 2026-07-28/29: małe podpisy przy ikonach ×2 (font + padding), nie karty wyjaśnień.
 */

const STYLE_ID = 'civ-hud-title-tip-css';
const TIP_ID = 'civ-hud-title-tip-el';
const DATA_STORED = 'data-civ-ori-title';

/** Kontenery HUD — tylko małe podpisy ikon/chipów, nie karty wyjaśnień. */
const SCOPE_SELECTOR = [
  '.civ-hud',
  '.civ-map-toolbar',
  '.civ-bottom-bar',
  '.civ-minimap-wrap',
  '.civ-minimap-tools',
  '.civ-v-icon-rail',
  '.civ-army-stack',
  '.uc-act-bar',
  '.civ-build-panel',
  '.civ-side-panel',
  '.civ-cs',
].join(',');

const SHOW_DELAY_MS = 380;
const HIDE_DELAY_MS = 80;

let tipEl: HTMLDivElement | null = null;
let activeEl: HTMLElement | null = null;
/** Element ze schowanym title, zanim custom tooltip się pokaże. */
let pendingEl: HTMLElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function ensureStyles(): void {
  const css = `
#${TIP_ID}{
  position:fixed;z-index:100050;display:none;pointer-events:none;
  max-width:min(840px,92vw);padding:14px 22px;
  background:rgba(244,240,228,0.97);color:#1a1408;
  border:1px solid rgba(160,128,48,0.45);border-radius:12px;
  font:600 30px/1.35 var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);
  letter-spacing:0.01em;box-shadow:0 8px 32px rgba(0,0,0,0.45);
  white-space:pre-wrap;word-break:break-word;
}
`;
  let s = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!s) {
    s = document.createElement('style');
    s.id = STYLE_ID;
    document.head.appendChild(s);
  }
  s.textContent = css;
}

function ensureTipEl(): HTMLDivElement {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.id = TIP_ID;
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

function isExcluded(el: HTMLElement): boolean {
  if (el.id === TIP_ID) return true;
  if (el.closest('.hover-detail-anchor')) return true;
  if (el.closest('.civ-detail-scope')) return true;
  if (el.closest('.civ-hover-detail-float')) return true;
  if (el.closest('.civ-hover-detail-dock')) return true;
  if (el.closest('.civ-sci-tooltip')) return true;
  if (el.closest('.civ-ttv-tt')) return true;
  if (el.closest('.civ-build-lock-tip')) return true;
  return false;
}

function titleText(el: HTMLElement): string | null {
  const text = el.getAttribute('title')?.trim() || el.getAttribute(DATA_STORED)?.trim();
  return text || null;
}

function resolveTarget(from: EventTarget | null): HTMLElement | null {
  if (!(from instanceof Element)) return null;
  const hit = from.closest(`[title], [${DATA_STORED}]`);
  if (!(hit instanceof HTMLElement)) return null;
  if (isExcluded(hit)) return null;
  if (!hit.closest(SCOPE_SELECTOR)) return null;
  return titleText(hit) ? hit : null;
}

function clearTimers(): void {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function storeTitle(el: HTMLElement): string | null {
  const text = el.getAttribute('title')?.trim();
  if (!text) return el.getAttribute(DATA_STORED)?.trim() || null;
  el.setAttribute(DATA_STORED, text);
  el.removeAttribute('title');
  return text;
}

function restoreTitle(el: HTMLElement): void {
  const stored = el.getAttribute(DATA_STORED);
  if (stored !== null) {
    el.setAttribute('title', stored);
    el.removeAttribute(DATA_STORED);
  }
}

function clearPending(): void {
  if (pendingEl && pendingEl !== activeEl) {
    restoreTitle(pendingEl);
  }
  pendingEl = null;
}

function positionTip(anchor: HTMLElement): void {
  if (!tipEl) return;
  const r = anchor.getBoundingClientRect();
  const pad = 16;
  let left = r.left + r.width / 2 - tipEl.offsetWidth / 2;
  let top = r.bottom + pad;
  tipEl.style.left = `${Math.max(pad, Math.min(left, window.innerWidth - tipEl.offsetWidth - pad))}px`;
  tipEl.style.top = `${top}px`;
  const tr = tipEl.getBoundingClientRect();
  if (tr.bottom > window.innerHeight - pad) {
    top = r.top - tr.height - pad;
    tipEl.style.top = `${Math.max(pad, top)}px`;
  }
  if (tr.right > window.innerWidth - pad) {
    left = window.innerWidth - tr.width - pad;
    tipEl.style.left = `${Math.max(pad, left)}px`;
  }
}

function hideNow(): void {
  clearTimers();
  if (tipEl) tipEl.style.display = 'none';
  if (activeEl) {
    restoreTitle(activeEl);
    activeEl = null;
  }
  clearPending();
}

function showFor(el: HTMLElement): void {
  const text = storeTitle(el);
  if (!text) return;
  pendingEl = null;
  activeEl = el;
  const tip = ensureTipEl();
  tip.textContent = text;
  tip.style.display = 'block';
  tip.style.visibility = 'hidden';
  positionTip(el);
  tip.style.visibility = 'visible';
}

function onPointerOver(ev: MouseEvent): void {
  const target = resolveTarget(ev.target);
  if (!target) return;
  if (activeEl === target) return;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (activeEl && activeEl !== target) hideNow();
  if (pendingEl && pendingEl !== target) clearPending();
  // Natywny title przeglądarki — schowaj od razu (nie czekaj na delay show).
  if (target.hasAttribute('title')) {
    storeTitle(target);
    pendingEl = target;
  }
  if (showTimer) clearTimeout(showTimer);
  showTimer = setTimeout(() => {
    showTimer = null;
    if (!titleText(target)) return;
    if (!target.isConnected) return;
    showFor(target);
  }, SHOW_DELAY_MS);
}

function onPointerOut(ev: MouseEvent): void {
  const related = ev.relatedTarget;
  if (activeEl && related instanceof Node && activeEl.contains(related)) return;
  if (pendingEl && related instanceof Node && pendingEl.contains(related)) return;
  const leaving = resolveTarget(ev.target);
  if (!leaving && !activeEl && !pendingEl) return;
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
    clearPending();
  }
  if (!activeEl) return;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    hideTimer = null;
    hideNow();
  }, HIDE_DELAY_MS);
}

function onFocusIn(ev: FocusEvent): void {
  onPointerOver(ev as unknown as MouseEvent);
}

function onFocusOut(ev: FocusEvent): void {
  onPointerOut(ev as unknown as MouseEvent);
}

/** Włącza wspólne, większe tooltips title w zasięgu HUD (idempotentne). */
export function installHudTitleTooltips(): void {
  if (installed) return;
  installed = true;
  ensureStyles();
  ensureTipEl();
  document.addEventListener('mouseover', onPointerOver, true);
  document.addEventListener('mouseout', onPointerOut, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('scroll', hideNow, true);
  window.addEventListener('blur', hideNow);
}
