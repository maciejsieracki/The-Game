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

let frameRoot: HTMLDivElement | null = null;
let mounts: CityPanelUxMounts | null = null;

const TOP_H = 96;
const ICON_BAR_H = 0;
const LEFT_W = 340;
/** Lewy panel danych (produkcja) + rail produkcji po jego prawej krawędzi. */
const LEFT_MARGIN = 32;
const LEFT_RAIL_GAP = 16;
/** Panele boczne startują blisko górnej krawędzi — pasek miasta jest wyśrodkowany, rogi są wolne. */
const LEFT_RAIL_TOP = 10;
const LEFT_ICON_RAIL_W = 56;
const RIGHT_MARGIN = 32;
const RIGHT_RAIL_GAP = 16;
const RIGHT_ICON_RAIL_W = 46;
const DETAIL_DOCK_W = HOVER_DETAIL_DOCK_W;
const RIGHT_W = 300;
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
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack{width:fit-content;max-width:min(98vw,1280px);box-sizing:border-box;pointer-events:none;}
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack .civ-v-w3-chips-flank{pointer-events:none;}
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack button,
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack .hover-detail-anchor,
.civ-ux-top .civ-ux-panel-scope .civ-v-top-stack [data-res-stat]{pointer-events:auto;}
.civ-ux-left{position:fixed;top:${LEFT_RAIL_TOP}px;left:${LEFT_MARGIN}px;bottom:0;width:${LEFT_PANEL_W_EXPR};min-width:280px;z-index:410;
  pointer-events:auto;overflow-y:auto;overflow-x:hidden;padding:0.18rem 0.4rem 0.48rem;
  display:flex;flex-direction:column;background:transparent;border:none;box-shadow:none;}
.civ-ux-left-icon-rail{position:fixed;top:${LEFT_RAIL_TOP}px;
  left:calc(${LEFT_MARGIN}px + ${LEFT_PANEL_W_EXPR} + var(--civ-detail-dock-left-w,0px) + ${LEFT_RAIL_GAP}px);
  width:${LEFT_ICON_RAIL_W}px;height:auto;max-height:calc(100vh - ${LEFT_RAIL_TOP}px - ${DOCK_BOTTOM_CLEAR}px);z-index:408;pointer-events:auto;overflow:visible;
  display:flex;flex-direction:column;align-items:center;padding:0;
  background:transparent;border:none;box-shadow:none;transition:left .22s ease;}
.civ-ux-left-icon-rail .civ-ux-panel-scope{width:100%;height:auto;display:flex;flex-direction:column;align-items:center;}
.civ-ux-right-icon-rail{position:fixed;top:${LEFT_RAIL_TOP}px;
  right:calc(${RIGHT_MARGIN}px + ${RIGHT_PANEL_W_EXPR} + var(--civ-detail-dock-w,0px) + ${RIGHT_RAIL_GAP}px);
  width:${RIGHT_ICON_RAIL_W}px;height:auto;max-height:calc(100vh - ${LEFT_RAIL_TOP}px - ${DOCK_BOTTOM_CLEAR}px);z-index:408;pointer-events:auto;overflow:visible;
  display:flex;flex-direction:column;align-items:center;padding:0;
  background:transparent;border:none;box-shadow:none;transition:right .22s ease;}
.civ-ux-right-icon-rail .civ-ux-panel-scope{width:100%;height:auto;display:flex;flex-direction:column;align-items:center;}
.civ-ux-detail-dock-left{position:fixed;top:${LEFT_RAIL_TOP}px;left:calc(${LEFT_MARGIN}px + ${LEFT_PANEL_W_EXPR});bottom:${DOCK_BOTTOM_CLEAR}px;z-index:407;
  width:0;min-width:0;max-height:calc(100vh - ${LEFT_RAIL_TOP}px - ${DOCK_BOTTOM_CLEAR}px);padding:0;opacity:0;pointer-events:none;overflow:hidden;
  background:linear-gradient(90deg,rgba(10,16,28,0.97) 0%,rgba(8,14,28,0.88) 100%);
  border-right:1px solid transparent;box-shadow:none;
  transition:width .22s ease,opacity .18s ease,padding .22s ease,box-shadow .22s ease,border-color .18s ease;}
.civ-ux-detail-dock-left.is-open{width:${DETAIL_DOCK_W}px;padding:0.45rem 0.5rem 0.55rem;opacity:1;pointer-events:auto;
  overflow-y:auto;overflow-x:hidden;border-right-color:rgba(212,175,90,0.28);box-shadow:4px 0 18px rgba(0,0,0,0.35);}
.civ-ux-detail-dock-left.is-open::-webkit-scrollbar{width:5px;}
.civ-ux-detail-dock-left.is-open::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-ux-detail-dock{position:fixed;top:${LEFT_RAIL_TOP}px;right:calc(${RIGHT_MARGIN}px + ${RIGHT_PANEL_W_EXPR});bottom:${DOCK_BOTTOM_CLEAR}px;z-index:407;
  width:0;min-width:0;max-height:calc(100vh - ${LEFT_RAIL_TOP}px - ${DOCK_BOTTOM_CLEAR}px);padding:0;opacity:0;pointer-events:none;overflow:hidden;
  background:linear-gradient(270deg,rgba(10,16,28,0.97) 0%,rgba(8,14,28,0.88) 100%);
  border-left:1px solid transparent;box-shadow:none;
  transition:width .22s ease,opacity .18s ease,padding .22s ease,box-shadow .22s ease,border-color .18s ease;}
.civ-ux-detail-dock.is-open{width:${DETAIL_DOCK_W}px;padding:0.45rem 0.5rem 0.55rem;opacity:1;pointer-events:auto;
  overflow-y:auto;overflow-x:hidden;border-left-color:rgba(212,175,90,0.28);box-shadow:-4px 0 18px rgba(0,0,0,0.35);}
.civ-ux-detail-dock.is-open::-webkit-scrollbar{width:5px;}
.civ-ux-detail-dock.is-open::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.22);border-radius:3px;}
.civ-hover-detail-dock .civ-hover-detail-scope{display:flex;flex-direction:column;min-height:0;max-height:100%;}
.civ-hover-detail-dock .civ-hover-detail-content{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;}
.civ-ux-right{position:fixed;top:${LEFT_RAIL_TOP}px;right:${RIGHT_MARGIN}px;bottom:32px;width:${RIGHT_PANEL_W_EXPR};min-width:260px;z-index:410;
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
let cityUxEscHandler: ((e: KeyboardEvent) => void) | null = null;

function cityUxKeyboardBlockedTarget(e: KeyboardEvent): boolean {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  return !!t.closest('input, textarea, select, [contenteditable="true"]');
}

function bindCityUxEscClose(): void {
  unbindCityUxEscClose();
  cityUxEscHandler = (e: KeyboardEvent) => {
    if (frameRoot === null) return;
    if (e.key === 'Escape' && frameOnClose !== null) {
      e.preventDefault();
      e.stopImmediatePropagation();
      frameOnClose();
      return;
    }
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
  document.addEventListener('keydown', cityUxEscHandler, true);
}

function unbindCityUxEscClose(): void {
  if (cityUxEscHandler === null) return;
  document.removeEventListener('keydown', cityUxEscHandler, true);
  cityUxEscHandler = null;
}

/** Zamknij panel miasta (Esc) — ten sam łańcuch co przycisk „Wróć na mapę”. */
export function tryCloseCityUxFrameFromKeyboard(): boolean {
  if (!isCityUxFrameOpen() || frameOnClose === null) return false;
  frameOnClose();
  return true;
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
  bindCityUxEscClose();
}

export function refreshCityUxFrame(
  city: City,
  map: GameMap,
  paint: () => void,
): void {
  if (!mounts) return;
  paintCityPanelSections(mounts, city, map, paint, frameOnClose ?? undefined);
}

export function hideCityUxFrame(): void {
  unbindCityUxEscClose();
  clearCityPanelUxMode();
  frameOnClose = null;
  frameRoot?.remove();
  frameRoot = null;
  mounts = null;
  document.querySelectorAll('.civ-ux-frame').forEach(el => el.remove());
  document.getElementById('civ-ux-dim-full')?.remove();
  document.getElementById('civ-ux-map-mask')?.remove();
  document.getElementById('civ-ux-top-mask')?.remove();
}
