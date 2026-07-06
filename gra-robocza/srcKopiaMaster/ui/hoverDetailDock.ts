/**
 * Panel szczegółów przy hover — wysuwa się obok kolumny UX (lewo / prawo).
 * Fallback: pływający tooltip gdy brak mountu docka (fullscreen panel).
 */

export const HOVER_DETAIL_DOCK_W = 280;

export type HoverDetailDockSide = 'left' | 'right';

export interface HoverDetailDockMounts {
  left?: HTMLElement | null;
  right?: HTMLElement | null;
}

let dockMountLeft: HTMLElement | null = null;
let dockMountRight: HTMLElement | null = null;
let contentElLeft: HTMLElement | null = null;
let contentElRight: HTMLElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let activeAnchor: HTMLElement | null = null;
let activeSide: HoverDetailDockSide | null = null;

let floatEl: HTMLDivElement | null = null;

const HIDE_DELAY = 160;
const DOCK_INIT = 'data-civ-hover-dock-init';

function cancelTimers(): void {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function setDockWidth(side: HoverDetailDockSide, open: boolean): void {
  const varName = side === 'left' ? '--civ-detail-dock-left-w' : '--civ-detail-dock-w';
  document.documentElement.style.setProperty(
    varName,
    open ? `${HOVER_DETAIL_DOCK_W}px` : '0px',
  );
}

export function getActiveDetailDockWidths(): { left: number; right: number } {
  return {
    left: dockMountLeft?.classList.contains('is-open') ? HOVER_DETAIL_DOCK_W : 0,
    right: dockMountRight?.classList.contains('is-open') ? HOVER_DETAIL_DOCK_W : 0,
  };
}

/** @deprecated Użyj getActiveDetailDockWidths — zwraca tylko szerokość prawego docka. */
export function getActiveDetailDockWidth(): number {
  return getActiveDetailDockWidths().right;
}

function dockPair(side: HoverDetailDockSide): { mount: HTMLElement | null; content: HTMLElement | null } {
  return side === 'left'
    ? { mount: dockMountLeft, content: contentElLeft }
    : { mount: dockMountRight, content: contentElRight };
}

function showInDock(side: HoverDetailDockSide, card: HTMLElement): void {
  const other: HoverDetailDockSide = side === 'left' ? 'right' : 'left';
  clearDock(other);
  const { mount, content } = dockPair(side);
  if (!content || !mount) return;
  content.innerHTML = '';
  content.appendChild(card);
  mount.classList.add('is-open');
  setDockWidth(side, true);
}

function clearDock(side: HoverDetailDockSide): void {
  const { mount, content } = dockPair(side);
  if (content) content.innerHTML = '';
  if (mount) mount.classList.remove('is-open');
  setDockWidth(side, false);
}

function clearAllDocks(): void {
  clearDock('left');
  clearDock('right');
}

function ensureFloat(): HTMLDivElement {
  if (!floatEl) {
    floatEl = document.createElement('div');
    floatEl.id = 'civ-hover-detail-float';
    floatEl.className = 'civ-hover-detail-float';
    document.body.appendChild(floatEl);
  }
  return floatEl;
}

function positionFloat(anchor: HTMLElement): void {
  if (!floatEl) return;
  const r = anchor.getBoundingClientRect();
  const pad = 8;
  let left = r.right + pad;
  let top = r.top;
  floatEl.style.left = `${left}px`;
  floatEl.style.top = `${top}px`;
  const tr = floatEl.getBoundingClientRect();
  if (tr.right > window.innerWidth - pad) {
    left = r.left - tr.width - pad;
    floatEl.style.left = `${Math.max(pad, left)}px`;
  }
  if (tr.bottom > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - tr.height - pad);
    floatEl.style.top = `${top}px`;
  }
}

function hideFloat(): void {
  if (floatEl) floatEl.style.display = 'none';
}

function wrapDetailCard(card: HTMLElement): HTMLElement {
  const scope = document.createElement('div');
  scope.className = 'civ-detail-scope';
  scope.appendChild(card);
  return scope;
}

function resolveDockSide(anchor: HTMLElement, hint?: HoverDetailDockSide | 'auto'): HoverDetailDockSide {
  if (hint === 'left' || hint === 'right') return hint;
  if (anchor.closest('.civ-ux-left')) return 'left';
  if (anchor.closest('.civ-ux-right')) return 'right';
  return 'right';
}

function hasDockForSide(side: HoverDetailDockSide): boolean {
  const { mount, content } = dockPair(side);
  return !!(mount && content);
}

function showContent(card: HTMLElement, anchor: HTMLElement, sideHint?: HoverDetailDockSide | 'auto'): void {
  const side = resolveDockSide(anchor, sideHint);
  if (hasDockForSide(side)) {
    showInDock(side, card);
    activeSide = side;
  } else if (hasDockForSide('right')) {
    showInDock('right', card);
    activeSide = 'right';
  } else if (hasDockForSide('left')) {
    showInDock('left', card);
    activeSide = 'left';
  } else {
    const tip = ensureFloat();
    tip.innerHTML = '';
    tip.appendChild(wrapDetailCard(card));
    tip.style.display = 'block';
    positionFloat(anchor);
    activeSide = null;
  }
}

function clearContent(): void {
  clearAllDocks();
  hideFloat();
  activeAnchor = null;
  activeSide = null;
}

function scheduleClear(): void {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    hideTimer = null;
    if (activeAnchor) return;
    cancelTimers();
    clearContent();
  }, HIDE_DELAY);
}

function buildDockShell(mount: HTMLElement, side: HoverDetailDockSide): void {
  mount.classList.add('civ-hover-detail-dock');
  mount.dataset.civDockSide = side;
  mount.innerHTML = '';

  const scopeEl = document.createElement('div');
  scopeEl.className = 'civ-detail-scope civ-hover-detail-scope';

  const contentEl = document.createElement('div');
  contentEl.className = 'civ-hover-detail-content';
  scopeEl.appendChild(contentEl);
  mount.appendChild(scopeEl);

  if (side === 'left') contentElLeft = contentEl;
  else contentElRight = contentEl;

  mount.addEventListener('mouseenter', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  });
  mount.addEventListener('mouseleave', scheduleClear);
  mount.setAttribute(DOCK_INIT, '1');
  setDockWidth(side, false);
}

function initDockMount(mount: HTMLElement, side: HoverDetailDockSide): void {
  const sameMount = mount === (side === 'left' ? dockMountLeft : dockMountRight) && mount.hasAttribute(DOCK_INIT);
  if (side === 'left') dockMountLeft = mount;
  else dockMountRight = mount;

  if (!sameMount) {
    buildDockShell(mount, side);
  } else {
    clearDock(side);
  }
}

/** Montuj stałe panele obok kolumn UX; null = tryb fullscreen (floating). */
export function setHoverDetailDocks(mounts: HoverDetailDockMounts | null): void {
  cancelTimers();
  activeAnchor = null;
  activeSide = null;
  hideFloat();

  if (!mounts) {
    dockMountLeft = null;
    dockMountRight = null;
    contentElLeft = null;
    contentElRight = null;
    setDockWidth('left', false);
    setDockWidth('right', false);
    return;
  }

  if (mounts.left) initDockMount(mounts.left, 'left');
  else {
    dockMountLeft = null;
    contentElLeft = null;
    setDockWidth('left', false);
  }

  if (mounts.right) initDockMount(mounts.right, 'right');
  else {
    dockMountRight = null;
    contentElRight = null;
    setDockWidth('right', false);
  }
}

/** Montuj stały panel na lewo od prawej kolumny; null = tryb fullscreen (floating). */
export function setHoverDetailDock(mount: HTMLElement | null): void {
  setHoverDetailDocks(mount ? { right: mount } : null);
}

/** Podłącz hover → karta szczegółów w docku (lub tooltip poza UX). */
export function showHoverDetailNow(
  target: HTMLElement,
  buildContent: () => HTMLElement,
  sideHint: HoverDetailDockSide | 'auto' = 'auto',
): void {
  cancelTimers();
  activeAnchor = target;
  showContent(buildContent(), target, sideHint);
}

/** Hover + klik / Enter — karta szczegółów (np. statystyki górnego paska). */
export function attachInteractiveDetail(
  target: HTMLElement,
  buildContent: () => HTMLElement,
  opts?: { delayMs?: number; sideHint?: HoverDetailDockSide | 'auto' },
): void {
  const delayMs = opts?.delayMs ?? 350;
  const sideHint = opts?.sideHint ?? 'auto';
  target.classList.add('hover-detail-anchor');
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '0');
  target.title = '';

  target.addEventListener('mouseenter', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    activeAnchor = target;
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      showTimer = null;
      if (activeAnchor !== target) return;
      showContent(buildContent(), target, sideHint);
    }, delayMs);
  });

  target.addEventListener('mouseleave', () => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (activeAnchor === target) activeAnchor = null;
    scheduleClear();
  });

  target.addEventListener('click', (e) => {
    e.stopPropagation();
    showHoverDetailNow(target, buildContent, sideHint);
  });

  target.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showHoverDetailNow(target, buildContent, sideHint);
    }
  });
}

/** Podłącz hover → karta szczegółów w docku (lub tooltip poza UX). */
export function attachHoverDetail(
  target: HTMLElement,
  buildContent: () => HTMLElement,
  delayMs = 350,
  sideHint: HoverDetailDockSide | 'auto' = 'auto',
): void {
  target.classList.add('hover-detail-anchor');
  target.title = '';

  target.addEventListener('mouseenter', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    activeAnchor = target;
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      showTimer = null;
      if (activeAnchor !== target) return;
      showContent(buildContent(), target, sideHint);
    }, delayMs);
  });

  target.addEventListener('mouseleave', () => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (activeAnchor === target) activeAnchor = null;
    scheduleClear();
  });
}

export function disposeHoverDetailDock(): void {
  cancelTimers();
  activeAnchor = null;
  activeSide = null;
  clearContent();
  dockMountLeft?.removeAttribute(DOCK_INIT);
  dockMountRight?.removeAttribute(DOCK_INIT);
  floatEl?.remove();
  floatEl = null;
  dockMountLeft = null;
  dockMountRight = null;
  contentElLeft = null;
  contentElRight = null;
  setDockWidth('left', false);
  setDockWidth('right', false);
}
