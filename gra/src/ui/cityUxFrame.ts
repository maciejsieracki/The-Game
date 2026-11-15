/**
 * cityUxFrame.ts — ramka panelu miasta (Civ V): lewo=produkcja, prawo=okolica, mapa centralna.
 */
import type { City } from '../game/cities';
import type { GameMap } from '../types/map';
import {
  paintCityPanelSections,
  clearCityPanelUxMode,
  navigateCityPanel,
  type CityPanelUxMounts,
} from './cityPanel';
import { getActiveDetailDockWidths, HOVER_DETAIL_DOCK_W } from './hoverDetailDock';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import {
  CITY_EDGE_PX,
  CITY_ICON_RAIL_W_PX,
  CITY_LEFT_ICON_RAIL_W_PX,
  CITY_LEFT_PANEL_W_PX,
  CITY_RAIL_GAP_PX,
  CITY_RAIL_TOP_PX,
  CITY_RIGHT_PANEL_W_PX,
} from './hudLayout';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

let frameRoot: HTMLDivElement | null = null;
let mounts: CityPanelUxMounts | null = null;

const TOP_H = 96;
/** Szerokość całego górnego paska miasta (lewy baner + nazwa + prawy baner). Wcześniej 1480 px — ucinało wolne miejsce na żetony. */
const TOP_STACK_MAX_PX = 1880;
/** Skala żetonów górnego paska (`--civ-top-chip-scale` na `.civ-ux-top`): kolejne kroki, aż wszystkie żetony mieszczą się w jednej linii swojego banera. */
const TOP_CHIP_SCALE_VAR = '--civ-top-chip-scale';
const TOP_CHIP_SCALE_STEPS = [1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.65, 0.6, 0.55, 0.5, 0.46, 0.44];
/** R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1: żeton nigdy poniżej 12 px (czytelność); ponad tę granicę nie wolno się kurczyć. */
const TOP_CHIP_MIN_PX = 12;
/** Gdy żetony nie mieszczą się w jednej linii w czytelnej skali, zawijają się — najwyżej do dwóch linii w jednym banerze. */
const TOP_CHIP_MAX_ROWS = 2;
/** Klasa na `.civ-ux-top`: włącza zawijanie żetonów (flank) — ustawiana tylko na etapie 2, bez niej układ jak dotąd (jedna linia). */
const TOP_CHIP_WRAP_CLASS = 'civ-ux-top-wrap';
/** Skala plakietki miasta (`--civ-top-city-scale`, zoom): używana dopiero, gdy żetony nie mieszczą się przy najmniejszej skali żetonów. */
const TOP_CITY_SCALE_VAR = '--civ-top-city-scale';
const TOP_CITY_SCALE_STEPS = [1, 0.9, 0.8, 0.7];
const ICON_BAR_H = 0;
const LEFT_W = CITY_LEFT_PANEL_W_PX;
/** Lewy panel danych (produkcja) + rail produkcji po jego prawej krawędzi. */
const LEFT_MARGIN = CITY_EDGE_PX;
const LEFT_RAIL_GAP = CITY_RAIL_GAP_PX;
/** Panele boczne startują blisko górnej krawędzi — pasek miasta jest wyśrodkowany, rogi są wolne. */
const LEFT_RAIL_TOP = CITY_RAIL_TOP_PX;
/**
 * R-WEB-UI-CITY-SIDE-PANELS-OVERLAP-TOPBANNERS-Q1: jedno źródło prawdy dla górnej krawędzi paneli bocznych,
 * rail'i i docków = dolna krawędź banerów górnych (+ odstęp). `--civ-city-side-top` ustawia
 * `fitCitySideTop()` (pomiar getBoundingClientRect); bez pomiaru (np. brak banerów) wartość = CITY_RAIL_TOP_PX.
 */
const SIDE_TOP_VAR = '--civ-city-side-top';
const SIDE_TOP_GAP_PX = 8;
const SIDE_TOP_EXPR = `var(${SIDE_TOP_VAR},${LEFT_RAIL_TOP}px)`;
const LEFT_ICON_RAIL_W = CITY_LEFT_ICON_RAIL_W_PX;
const RIGHT_MARGIN = CITY_EDGE_PX;
const RIGHT_RAIL_GAP = CITY_RAIL_GAP_PX;
const RIGHT_ICON_RAIL_W = CITY_ICON_RAIL_W_PX;
const DETAIL_DOCK_W = HOVER_DETAIL_DOCK_W;
const RIGHT_W = CITY_RIGHT_PANEL_W_PX;
/** Dolny margines docków — nie zasłaniają środkowego stosu okolicy (profile / akcje). */
const DOCK_BOTTOM_CLEAR = 96;
const LEFT_PANEL_W_EXPR = `min(24vw,${LEFT_W}px)`;
const RIGHT_PANEL_W_EXPR = `min(26vw,${RIGHT_W}px)`;

function ensureFrameStyles(): void {
  ensureBrandRootTokens();
  const id = 'civ-okolica-ux-frame-css-w3';
  document.getElementById('civ-okolica-ux-frame-css')?.remove();
  const existing = document.getElementById(id);
  const style = existing ?? document.createElement('style');
  style.id = id;
  style.textContent = `
.civ-ux-frame{${CIV_BRAND_SCOPE_VARS}}
.civ-ux-frame{position:fixed;inset:0;z-index:400;pointer-events:none;font-family:var(--civ-font-ui);}
.civ-ux-frame *{box-sizing:border-box;}
/* W3: winieta — środek mapy czytelny, boki przyciemnione pod panele (nie pełny 93% dim). */
.civ-ux-dim-full{position:fixed;inset:0;z-index:298;pointer-events:none;
  background:radial-gradient(ellipse 62% 58% at 48% 54%,rgba(6,8,12,0.06) 0%,rgba(6,8,12,0.18) 48%,rgba(6,8,12,0.62) 82%,rgba(6,8,12,0.78) 100%);
  box-shadow:inset 0 0 90px 28px rgba(0,0,0,0.38);}
.civ-ux-top{position:fixed;top:0;left:0;right:0;height:auto;min-height:${TOP_H}px;z-index:403;pointer-events:none;overflow:visible;
  display:flex;align-items:flex-start;justify-content:center;padding:5px 12px 4px 12px;}
.civ-ux-top .civ-ux-panel-scope{height:auto;width:100%;display:flex;flex-direction:column;align-items:center;pointer-events:none;}
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack{width:fit-content;max-width:min(98vw,${TOP_STACK_MAX_PX}px);box-sizing:border-box;pointer-events:none;}
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack .civ-v-w3-chips-flank{pointer-events:none;}
.civ-ux-top.${TOP_CHIP_WRAP_CLASS} .civ-v-w3-chips-flank{flex-wrap:wrap;}
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack button,
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack .hover-detail-anchor,
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack [data-res-stat]{pointer-events:auto;}
.civ-ux-left{position:fixed;top:${SIDE_TOP_EXPR};left:${LEFT_MARGIN}px;bottom:0;width:${LEFT_PANEL_W_EXPR};min-width:280px;z-index:410;
  pointer-events:auto;overflow-y:auto;overflow-x:hidden;padding:0.18rem 0.4rem 0.48rem;
  display:flex;flex-direction:column;background:transparent;border:none;box-shadow:none;}
.civ-ux-left-icon-rail{position:fixed;top:${SIDE_TOP_EXPR};
  left:calc(${LEFT_MARGIN}px + ${LEFT_PANEL_W_EXPR} + var(--civ-detail-dock-left-w,0px) + ${LEFT_RAIL_GAP}px);
  width:${LEFT_ICON_RAIL_W}px;height:auto;max-height:calc(100vh - ${SIDE_TOP_EXPR} - ${DOCK_BOTTOM_CLEAR}px);z-index:408;pointer-events:auto;overflow:visible;
  display:flex;flex-direction:column;align-items:center;padding:0;
  background:transparent;border:none;box-shadow:none;transition:left .22s ease;}
.civ-ux-left-icon-rail .civ-ux-panel-scope{width:100%;height:auto;display:flex;flex-direction:column;align-items:center;}
.civ-ux-right-icon-rail{position:fixed;top:${SIDE_TOP_EXPR};
  right:calc(${RIGHT_MARGIN}px + ${RIGHT_PANEL_W_EXPR} + var(--civ-detail-dock-w,0px) + ${RIGHT_RAIL_GAP}px);
  width:${RIGHT_ICON_RAIL_W}px;height:auto;max-height:calc(100vh - ${SIDE_TOP_EXPR} - ${DOCK_BOTTOM_CLEAR}px);z-index:408;pointer-events:auto;overflow:visible;
  display:flex;flex-direction:column;align-items:center;padding:0;
  background:transparent;border:none;box-shadow:none;transition:right .22s ease;}
.civ-ux-right-icon-rail .civ-ux-panel-scope{width:100%;height:auto;display:flex;flex-direction:column;align-items:center;}
.civ-ux-detail-dock-left{position:fixed;top:${SIDE_TOP_EXPR};left:calc(${LEFT_MARGIN}px + ${LEFT_PANEL_W_EXPR});bottom:${DOCK_BOTTOM_CLEAR}px;z-index:407;
  width:0;min-width:0;max-height:calc(100vh - ${SIDE_TOP_EXPR} - ${DOCK_BOTTOM_CLEAR}px);padding:0;opacity:0;pointer-events:none;overflow:hidden;
  background:linear-gradient(90deg,rgba(10,16,28,0.97) 0%,rgba(8,14,28,0.88) 100%);
  border-right:1px solid transparent;box-shadow:none;
  transition:width .22s ease,opacity .18s ease,padding .22s ease,box-shadow .22s ease,border-color .18s ease;}
.civ-ux-detail-dock-left.is-open{width:${DETAIL_DOCK_W}px;padding:0.45rem 0.5rem 0.55rem;opacity:1;pointer-events:auto;
  overflow-y:auto;overflow-x:hidden;border-right-color:rgba(212,175,90,0.28);box-shadow:4px 0 18px rgba(0,0,0,0.35);}
.civ-ux-detail-dock-left.is-open::-webkit-scrollbar{width:5px;}
.civ-ux-detail-dock-left.is-open::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-ux-detail-dock{position:fixed;top:${SIDE_TOP_EXPR};right:calc(${RIGHT_MARGIN}px + ${RIGHT_PANEL_W_EXPR});bottom:${DOCK_BOTTOM_CLEAR}px;z-index:407;
  width:0;min-width:0;max-height:calc(100vh - ${SIDE_TOP_EXPR} - ${DOCK_BOTTOM_CLEAR}px);padding:0;opacity:0;pointer-events:none;overflow:hidden;
  background:linear-gradient(270deg,rgba(10,16,28,0.97) 0%,rgba(8,14,28,0.88) 100%);
  border-left:1px solid transparent;box-shadow:none;
  transition:width .22s ease,opacity .18s ease,padding .22s ease,box-shadow .22s ease,border-color .18s ease;}
.civ-ux-detail-dock.is-open{width:${DETAIL_DOCK_W}px;padding:0.45rem 0.5rem 0.55rem;opacity:1;pointer-events:auto;
  overflow-y:auto;overflow-x:hidden;border-left-color:rgba(212,175,90,0.28);box-shadow:-4px 0 18px rgba(0,0,0,0.35);}
.civ-ux-detail-dock.is-open::-webkit-scrollbar{width:5px;}
.civ-ux-detail-dock.is-open::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-hover-detail-dock .civ-hover-detail-scope{display:flex;flex-direction:column;min-height:0;max-height:100%;}
.civ-hover-detail-dock .civ-hover-detail-content{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;}
.civ-ux-right{position:fixed;top:${SIDE_TOP_EXPR};right:${RIGHT_MARGIN}px;bottom:${CITY_EDGE_PX}px;width:${RIGHT_PANEL_W_EXPR};min-width:260px;z-index:410;
  pointer-events:auto;overflow:hidden;padding:0;
  background:linear-gradient(180deg,rgba(18,24,32,0.97),rgba(8,10,16,0.97));
  border:2px solid rgba(232,216,138,0.42);border-radius:14px;box-shadow:0 14px 36px rgba(0,0,0,0.6);
  display:flex;flex-direction:column;}
.civ-ux-right > .civ-ux-panel-scope{flex:1;min-height:0;width:100%;height:100%;display:flex;flex-direction:column;padding:0.18rem 0.36rem 0.42rem;}
.civ-ux-map-chrome{position:fixed;inset:0;z-index:406;pointer-events:none;}
.civ-ux-map-mask{display:none;}
.civ-ux-left::-webkit-scrollbar,.civ-ux-right::-webkit-scrollbar{width:6px;}
.civ-ux-left::-webkit-scrollbar-thumb,.civ-ux-right::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.25);border-radius:3px;}
`;
  if (!existing) document.body.appendChild(style);
}

let frameOnClose: (() => void) | null = null;
let cityUxNavKeyHandler: ((e: KeyboardEvent) => void) | null = null;

function cityUxKeyboardBlockedTarget(e: KeyboardEvent): boolean {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  return !!t.closest('input, textarea, select, [contenteditable="true"]');
}

/** Nawigacja miast (←/→, , / .) — Escape tylko przez escapeOverlayStack (R-ESC). */
function bindCityUxNavKeys(): void {
  unbindCityUxNavKeys();
  cityUxNavKeyHandler = (e: KeyboardEvent) => {
    if (frameRoot === null) return;
    if (cityUxKeyboardBlockedTarget(e)) return;
    if (e.key === 'ArrowLeft' || e.key === ',' || e.code === 'Comma') {
      e.preventDefault();
      e.stopImmediatePropagation();
      navigateCityPanel(-1);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === '.' || e.code === 'Period') {
      e.preventDefault();
      e.stopImmediatePropagation();
      navigateCityPanel(1);
    }
  };
  document.addEventListener('keydown', cityUxNavKeyHandler, true);
}

function unbindCityUxNavKeys(): void {
  if (cityUxNavKeyHandler === null) return;
  document.removeEventListener('keydown', cityUxNavKeyHandler, true);
  cityUxNavKeyHandler = null;
}

let sideTopObserver: ResizeObserver | null = null;
const sideTopObserved = new Set<Element>();
let sideTopFitQueued = false;
let sideTopResizeBound = false;

/** Przeliczenie po zmianie banera planowane na następną klatkę — callback ResizeObserver nie wywołuje pomiaru synchronicznie (brak pętli RO). */
function queueSideTopFit(): void {
  if (sideTopFitQueued) return;
  sideTopFitQueued = true;
  requestAnimationFrame(() => {
    sideTopFitQueued = false;
    fitCitySideTop();
  });
}

/** Mierzy dolną krawędź banerów górnych (lewy/prawy żeton + plakietka miasta) i ustawia `--civ-city-side-top`. */
/**
 * Żetony lewego i prawego banera: najpierw JEDNA linia pozioma (zmniejszanie skali tylko do czytelnej granicy
 * TOP_CHIP_MIN_PX), a gdy i to nie wystarcza — zawijanie do najwyżej TOP_CHIP_MAX_ROWS linii w największej
 * czytelnej skali. Dopiero gdy nie mieszczą się nawet tak, zmniejszana jest plakietka miasta (zoom).
 * Żetony nigdy nie schodzą poniżej TOP_CHIP_MIN_PX (wąskie okno: drugi wiersz zamiast ~11 px).
 */
function fitCityTopChipScale(): void {
  if (frameRoot === null) return;
  const top = frameRoot.querySelector<HTMLElement>('.civ-ux-top');
  if (!top) return;
  // Etap 1 zawsze bez zawijania (jak dotąd: jedna linia); zawijanie włącza dopiero etap 2.
  top.classList.remove(TOP_CHIP_WRAP_CLASS);
  // Rozmiar bazowy żetonu (skala 1) → zestaw kroków skali, przy których żeton ma co najmniej TOP_CHIP_MIN_PX.
  top.style.setProperty(TOP_CHIP_SCALE_VAR, '1');
  const firstChip = top.querySelector<HTMLElement>('.civ-v-w3-chip');
  const basePx = firstChip ? parseFloat(getComputedStyle(firstChip).fontSize) : 0;
  const legible = basePx > 0
    ? TOP_CHIP_SCALE_STEPS.filter((s) => s * basePx >= TOP_CHIP_MIN_PX - 0.01)
    : TOP_CHIP_SCALE_STEPS;
  const steps = legible.length > 0 ? legible : [1];
  const fitsRows = (maxRows: number): boolean => Array.from(top.querySelectorAll<HTMLElement>('.civ-v-w3-chips-flank')).every((flank) => {
    const fr = flank.getBoundingClientRect();
    const chips = Array.from(flank.querySelectorAll<HTMLElement>('.civ-v-w3-chip'));
    if (chips.length === 0 || fr.width === 0) return true;
    const rows = new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size;
    return rows <= maxRows && chips.every((c) => {
      const cr = c.getBoundingClientRect();
      return cr.left >= fr.left - 0.5 && cr.right <= fr.right + 0.5;
    });
  });
  const set = (city: number, chip: number): void => {
    top.style.setProperty(TOP_CITY_SCALE_VAR, String(city));
    top.style.setProperty(TOP_CHIP_SCALE_VAR, String(chip));
  };
  // Etap 1: jedna linia w czytelnej skali (plakietka bez zoomu).
  for (const s of steps) {
    set(1, s);
    if (fitsRows(1)) return;
  }
  // Etap 2: najwyżej dwie linie, w największej czytelnej skali.
  top.classList.add(TOP_CHIP_WRAP_CLASS);
  for (const c of TOP_CITY_SCALE_STEPS) {
    for (const s of steps) {
      set(c, s);
      if (fitsRows(TOP_CHIP_MAX_ROWS)) return;
    }
  }
  // Brak dopasowania: najmniejsza czytelna skala żetonów i najmniejsza plakietka.
  set(TOP_CITY_SCALE_STEPS[TOP_CITY_SCALE_STEPS.length - 1] ?? 1, steps[steps.length - 1] ?? 1);
}

export function fitCitySideTop(): void {
  if (frameRoot === null) return;
  fitCityTopChipScale();
  const els = Array.from(frameRoot.querySelectorAll<HTMLElement>(
    '.civ-ux-top .civ-v-w3-chips-flank, .civ-ux-top .civ-v-w3-city-badge',
  ));
  let bottom = 0;
  for (const el of els) {
    if (el.getClientRects().length === 0) continue;
    bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
  }
  const need = bottom > 0 ? Math.ceil(bottom + SIDE_TOP_GAP_PX) : 0;
  if (need > LEFT_RAIL_TOP) frameRoot.style.setProperty(SIDE_TOP_VAR, need + 'px');
  else frameRoot.style.removeProperty(SIDE_TOP_VAR);
  // Zmiana rozmiaru banera (treść/zawijanie) po malowaniu — obserwuj elementy i przelicz.
  // Obserwator tworzony RAZ; obserwowany jest tylko zbiór elementów (zmiana zbioru, nie każde przeliczenie).
  if (typeof ResizeObserver !== 'undefined') {
    if (sideTopObserver === null) sideTopObserver = new ResizeObserver(() => queueSideTopFit());
    for (const old of Array.from(sideTopObserved)) {
      if (els.includes(old as HTMLElement)) continue;
      sideTopObserver.unobserve(old);
      sideTopObserved.delete(old);
    }
    for (const el of els) {
      if (sideTopObserved.has(el)) continue;
      sideTopObserver.observe(el);
      sideTopObserved.add(el);
    }
  }
  if (!sideTopResizeBound && typeof window !== 'undefined') {
    sideTopResizeBound = true;
    window.addEventListener('resize', () => fitCitySideTop());
  }
}

export function getCityUxLayoutMetrics(): {
  topH: number;
  iconBarH: number;
  leftW: number;
  leftIconRailW: number;
  rightIconRailW: number;
  rightW: number;
  leftMargin: number;
  leftRailGap: number;
  railTop: number;
} {
  const leftW = Math.min(window.innerWidth * 0.24, LEFT_W);
  return {
    topH: TOP_H,
    iconBarH: ICON_BAR_H,
    leftW,
    leftIconRailW: LEFT_ICON_RAIL_W,
    rightIconRailW: RIGHT_ICON_RAIL_W,
    rightW: Math.min(window.innerWidth * 0.26, RIGHT_W),
    leftMargin: LEFT_MARGIN,
    leftRailGap: LEFT_RAIL_GAP,
    railTop: LEFT_RAIL_TOP,
  };
}

export function isCityUxFrameOpen(): boolean {
  return frameRoot !== null;
}

/** Czy współrzędne ekranu trafiają w UI panelu (nie w widoczną mapę). */
export function isPointOverCityPanelUi(x: number, y: number): boolean {
  if (!isCityUxFrameOpen()) return false;
  const { topH, leftW, rightW, leftMargin, leftRailGap, railTop, leftIconRailW, rightIconRailW } =
    getCityUxLayoutMetrics();
  const detailDock = getActiveDetailDockWidths();
  const topEl = document.querySelector('.civ-ux-top');
  if (topEl) {
    const tr = topEl.getBoundingClientRect();
    if (y < tr.bottom) return true;
  } else if (y < topH) {
    return true;
  }
  const bottomStack = document.querySelector('.civ-v-map-bottom-stack');
  if (bottomStack) {
    const br = bottomStack.getBoundingClientRect();
    if (x >= br.left && x <= br.right && y >= br.top && y <= br.bottom) return true;
  }
  const okCenter = document.getElementById('cs-okolica-center');
  if (okCenter) {
    const cr = okCenter.getBoundingClientRect();
    if (x >= cr.left && x <= cr.right && y >= cr.top && y <= cr.bottom) return true;
  }
  const leftPanelEnd = leftMargin + leftW + detailDock.left;
  const leftRailLeft = leftPanelEnd + leftRailGap;
  const leftRailRight = leftRailLeft + leftIconRailW;
  if (x >= leftMargin && x < leftPanelEnd) return true;
  if (x >= leftRailLeft && x <= leftRailRight && y >= railTop) return true;
  const rightPanelLeft = window.innerWidth - RIGHT_MARGIN - rightW - detailDock.right;
  const rightRailLeft = rightPanelLeft - RIGHT_RAIL_GAP - rightIconRailW;
  if (x >= rightRailLeft && x < rightPanelLeft + rightW + detailDock.right && y >= railTop) return true;
  if (x >= rightPanelLeft) return true;
  return false;
}

export function showCityUxFrame(
  city: City,
  map: GameMap,
  paint: () => void,
  onClose: () => void,
): void {
  ensureFrameStyles();
  hideCityUxFrame();

  if (!document.getElementById('civ-ux-dim-full')) {
    const dim = document.createElement('div');
    dim.id = 'civ-ux-dim-full';
    dim.className = 'civ-ux-dim-full';
    document.body.appendChild(dim);
  }
  document.getElementById('civ-ux-top-mask')?.remove();
  document.getElementById('civ-ux-map-mask')?.remove();

  frameRoot = document.createElement('div');
  frameRoot.className = 'civ-ux-frame';
  const top = document.createElement('div');
  top.className = 'civ-ux-top';
  const left = document.createElement('div');
  left.className = 'civ-ux-left';
  const leftIconRail = document.createElement('div');
  leftIconRail.className = 'civ-ux-left-icon-rail';
  const rightIconRail = document.createElement('div');
  rightIconRail.className = 'civ-ux-right-icon-rail';
  const leftDetailDock = document.createElement('div');
  leftDetailDock.className = 'civ-ux-detail-dock-left';
  const detailDock = document.createElement('div');
  detailDock.className = 'civ-ux-detail-dock';
  const right = document.createElement('div');
  right.className = 'civ-ux-right';
  const mapChrome = document.createElement('div');
  mapChrome.className = 'civ-ux-map-chrome';
  frameRoot.appendChild(top);
  frameRoot.appendChild(left);
  frameRoot.appendChild(leftIconRail);
  frameRoot.appendChild(rightIconRail);
  frameRoot.appendChild(leftDetailDock);
  frameRoot.appendChild(right);
  frameRoot.appendChild(detailDock);
  frameRoot.appendChild(mapChrome);
  document.body.appendChild(frameRoot);

  mounts = { top, left, leftIconRail, rightIconRail, leftDetailDock, detailDock, right, mapChrome };
  frameOnClose = () => {
    hideCityUxFrame();
    onClose();
  };
  paintCityPanelSections(mounts, city, map, paint, frameOnClose);
  fitCitySideTop();
  pushOverlay('city-panel', () => { frameOnClose?.(); });
  bindCityUxNavKeys();
}

export function refreshCityUxFrame(
  city: City,
  map: GameMap,
  paint: () => void,
): void {
  if (!mounts) return;
  paintCityPanelSections(mounts, city, map, paint, frameOnClose ?? undefined);
  fitCitySideTop();
}

export function hideCityUxFrame(): void {
  unbindCityUxNavKeys();
  popOverlay('city-panel');
  clearCityPanelUxMode();
  frameOnClose = null;
  sideTopObserver?.disconnect();
  sideTopObserver = null;
  sideTopObserved.clear();
  frameRoot?.remove();
  frameRoot = null;
  mounts = null;
  document.querySelectorAll('.civ-ux-frame').forEach(el => el.remove());
  document.getElementById('civ-ux-dim-full')?.remove();
  document.getElementById('civ-ux-map-mask')?.remove();
  document.getElementById('civ-ux-top-mask')?.remove();
}
