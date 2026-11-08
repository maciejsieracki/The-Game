/**
 * minimapHud.ts
 * Minimapa HUD (D1=C, D15=B) — UI rysuje siatkę heksów z danych MAPY (getMinimapData).
 * Canvas 2D, bez duplikacji sceny 3D. Kontrakt: dyspozycje/_handoff/UI-do-MAPA_minimap-contract.md
 *
 * LANE: src/ui/*.  Wpięcie getMinimapData = MASTER/MAPA.
 */

import { ensureBrandRootTokens } from './brandTokenVars';
import { FOG_EXPLORED_BRIGHTNESS } from '../game/visibility';
import {
  HUD_ZOOM_EDGE_PX,
  HUD_ZOOM_BOTTOM_PX,
  MINIMAP_TOOL_BTN_PX,
  MINIMAP_TOOL_GAP_PX,
} from './hudLayout';
import {
  MINIMAP_EDGE_PX,
  MINIMAP_H_PX,
  MINIMAP_W_PX,
  minimapWrapBottomCss,
} from './minimapLayout';

/** Dane pojedynczego heksa do rysowania minimapy. */
export interface MinimapHexData {
  q: number;
  r: number;
  /** Klucz terenu (TerenBazowy), np. 'Laka', 'Morze', 'Gory'. */
  teren: string;
  /** Kolor właściciela (hex CSS) lub undefined gdy niczyje. */
  ownerColor?: string | undefined;
  fog?: 'hidden' | 'explored' | 'visible';
}

/** Punkt na minimapie (miasto, posterunek, jednostka). */
export interface MinimapMarkerData {
  q: number;
  r: number;
  kind: 'city' | 'outpost' | 'unit';
  color: string;
}

/** Pełny zestaw danych mapy od MAPY. */
export interface MinimapData {
  cols: number;
  rows: number;
  hexes: MinimapHexData[];
  /** Prostokąt widoku kamery w przestrzeni heksów (0..1 względem cols/rows). */
  viewport?: { x: number; y: number; w: number; h: number } | undefined;
  /** Ikony miast/jednostek na minimapie. */
  markers?: MinimapMarkerData[];
}

/**
 * F2 / D15: przełączniki zasięgu kultury, religii i państwa obok minimapy.
 * R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: kultura/religia NIE mają już własnych
 * przycisków przy minimapie (sterowane z chipów górnego paska, patrz hud.ts
 * handleHudBarAction) — pola onToggleCulture/onToggleReligion/onOpenCulturePanel/
 * onOpenReligionPanel/isCultureActive/isReligionActive zostają w interfejsie (hud.ts
 * `buildMinimapLayers()` nadal je buduje z main.ts `minimapLayers` configu), ale
 * `createMinimapHud()` już ich nie odczytuje — zero elementu DOM je woła.
 */
export interface MinimapLayerHooks {
  onToggleCulture?: () => void;
  onToggleReligion?: () => void;
  onToggleTerritory?: () => void;
  /** A1-Q12 — dblclick ikony obok minimapy → panel imperium (osobno od toggle). */
  onOpenCulturePanel?: () => void;
  onOpenReligionPanel?: () => void;
  isCultureActive?: () => boolean;
  isReligionActive?: () => boolean;
  isTerritoryActive?: () => boolean;
  /** R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: nowy toggle widoczności tras handlowych
   *  (drugi przycisk po prawej stronie minimapy, obok granic). */
  onToggleTradeRoutes?: () => void;
  isTradeRoutesActive?: () => boolean;
}

/** Tymczasowe (playtest/dev): przyciski F/M obok minimapy — wyłączone w produkcji. */
export interface MinimapPlaytestFogHooks {
  /** FoW pełne wył. (klawisz F). */
  onToggleFogFull: () => void;
  /** Odkryj cały ląd, ocean ukryty (klawisz M). */
  onToggleLandReveal: () => void;
  isFogFullOff: () => boolean;
  isLandReveal: () => boolean;
}

/**
 * E-map-worker-overlay: toggle podglądu robotników na mapie świata.
 * R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: przycisk przeniesiony do rzędu zoom
 * (hud.ts `.civ-hud-util-dock`) — interfejs zostaje eksportowany, bo hud.ts typuje nim
 * `HudConfig.minimapWorkerOverlay`, ale `createMinimapHud()` już go nie przyjmuje.
 */
export interface MinimapWorkerOverlayHooks {
  onToggleWorkers?: () => void;
  isWorkersActive?: () => boolean;
}

/**
 * Toggle ikon złóż / nakładek surowcowych (resourceOverlays w main.ts).
 * R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: jw. — przycisk w rzędzie zoom, nie tutaj.
 */
export interface MinimapResourceDepositOverlayHooks {
  onToggleDeposits?: () => void;
  isDepositsActive?: () => boolean;
}

export interface MinimapHudConfig {
  /** Pobierz dane mapy; null = placeholder. */
  getMinimapData: () => MinimapData | null;
  /** Klik na minimapie → przesunięcie kamery (q, r = przybliżony hex). */
  onMinimapClick?: (q: number, r: number) => void;
  /** Przełączniki granic + tras handlowych — jedyne 2 przyciski po prawej stronie minimapy. */
  layers?: MinimapLayerHooks;
  /** Playtest/dev: FoW F / ląd M — tylko klawiatura (bez przycisków w HUD). */
  playtestFog?: MinimapPlaytestFogHooks;
  width?: number;
  height?: number;
}

export interface MinimapHudApi {
  el: HTMLDivElement;
  canvas: HTMLCanvasElement | null;
  update: () => void;
  destroy: () => void;
}

const TEREN_KOLOR: Record<string, string> = {
  Laka: '#5a9e48',
  Rownina: '#9ab85c',
  Wzgorza: '#7b6e50',
  Gory: '#8a8a8a',
  Wybrzeze: '#82c8e0',
  Morse: '#2a6080',
  Morze: '#2a6080',
  Pustynia: '#c8b46a',
};
const TEREN_KOLOR_DEFAULT = '#3a4450';
const FOG_HIDDEN = '#0a0e14';

const DEFAULT_W = MINIMAP_W_PX;
const DEFAULT_H = MINIMAP_H_PX;

const TERRITORY_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2 20 7v10L12 22 4 17V7z"/><path d="M12 2v20M4 7l8 5 8-5M4 17l8-5 8 5"/></svg>';
/** R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: nowa ikona — trasy handlowe (strzałki wymiany),
 *  spójna stylistycznie z TERRITORY_SVG (stroke, viewBox 24, linecap/linejoin round). */
const TRADE_ROUTES_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h13M13 3l4 4-4 4"/><path d="M20 17H7M11 21l-4-4 4-4"/></svg>';

const SQRT3 = Math.sqrt(3);

/** Pointy-top: środek heksa (q,r) w układzie minimapy (przed skalą). */
function axialMinimapXY(q: number, r: number): { x: number; y: number } {
  return { x: SQRT3 * (q + r * 0.5), y: 1.5 * r };
}

/** Rysuje jeden heks pointy-top (wypełnienie). */
function fillHexCell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 30);
    const px = cx + radius * Math.cos(ang);
    const py = cy + radius * Math.sin(ang);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Obrys heksa (właściciel). */
function strokeHexCell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 30);
    const px = cx + radius * Math.cos(ang);
    const py = cy + radius * Math.sin(ang);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

interface MinimapLayout { scale: number; offX: number; offY: number; drawR: number; }

/** Wspólny layout minimapy (skala + offset) z danych heksów — używa render ORAZ klik→kamera. */
function computeMinimapLayout(hexes: MinimapHexData[], w: number, h: number): MinimapLayout {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const hex of hexes) {
    const { x, y } = axialMinimapXY(hex.q, hex.r);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const hexR = 0.55;
  const pad = hexR * SQRT3;
  const spanX = maxX - minX + pad * 2;
  const spanY = maxY - minY + pad * 2;
  const scale = Math.min(w / spanX, h / spanY);
  const offX = (w - spanX * scale) / 2 - (minX - pad) * scale;
  const offY = (h - spanY * scale) / 2 - (minY - pad) * scale;
  return { scale, offX, offY, drawR: scale * hexR };
}

function renderCanvas(
  canvas: HTMLCanvasElement,
  data: MinimapData,
  w: number,
  h: number,
): void {
  const ctx = canvas.getContext('2d');
  if (ctx === null) return;

  canvas.width = w;
  canvas.height = h;
  // FPS: tło = kolor mgły (hidden). Dzięki temu heksy w mgle NIE muszą być rysowane
  // pojedynczo (na starcie to ~99% mapy) — pokrywa je tło.
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, w, h);

  if (data.hexes.length === 0) return;

  const { scale, offX, offY, drawR } = computeMinimapLayout(data.hexes, w, h);

  for (const hex of data.hexes) {
    // FPS: hidden = tło (już ciemne #0b0d12) — pomijamy przed liczeniem pozycji/trig.
    if (hex.fog === 'hidden') continue;
    const { x, y } = axialMinimapXY(hex.q, hex.r);
    const cx = x * scale + offX;
    const cy = y * scale + offY;
    const base = TEREN_KOLOR[hex.teren] ?? TEREN_KOLOR_DEFAULT;

    ctx.fillStyle = base;
    if (hex.fog === 'explored') ctx.globalAlpha = FOG_EXPLORED_BRIGHTNESS;
    fillHexCell(ctx, cx, cy, drawR);
    ctx.globalAlpha = 1;

    if ((hex.fog === 'visible' || hex.fog === 'explored') && hex.ownerColor !== undefined && hex.ownerColor !== '') {
      ctx.strokeStyle = hex.ownerColor;
      ctx.lineWidth = 1;
      strokeHexCell(ctx, cx, cy, drawR * 0.92);
    }
  }

  if (data.viewport !== undefined) {
    const vp = data.viewport;
    const cellW = w / data.cols;
    const cellH = h / data.rows;
    ctx.strokeStyle = 'rgba(255,255,255,0.80)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.floor(vp.x * cellW) + 0.5,
      Math.floor(vp.y * cellH) + 0.5,
      Math.ceil(vp.w * cellW),
      Math.ceil(vp.h * cellH),
    );
  }

  if (data.markers !== undefined && data.markers.length > 0) {
    const fogByKey = new Map<string, MinimapHexData['fog']>();
    for (const hex of data.hexes) {
      fogByKey.set(`${hex.q},${hex.r}`, hex.fog);
    }
    for (const m of data.markers) {
      const fog = fogByKey.get(`${m.q},${m.r}`);
      if (fog === 'hidden') continue;
      const { x, y } = axialMinimapXY(m.q, m.r);
      const cx = x * scale + offX;
      const cy = y * scale + offY;
      const rDot = m.kind === 'unit'
        ? Math.max(2.5, drawR * 0.22)
        : Math.max(4.5, drawR * 0.38);
      ctx.beginPath();
      ctx.arc(cx, cy, rDot, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

const STYLE_ID = 'civ-minimap-hud-css-w2ring9-passthrough';
/** Pozycja zgodna z mockupem HUD Mapy layout (1E) — dół-lewo. */
const MINIMAP_EDGE_GAP = `${MINIMAP_EDGE_PX}px`;

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-minimap-hud-css-v3')?.remove();
  document.getElementById('civ-minimap-hud-css-w2')?.remove();
  document.getElementById('civ-minimap-hud-css-w2b')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-minimap-wrap{position:fixed;left:${MINIMAP_EDGE_GAP};bottom:${minimapWrapBottomCss()};z-index:310;
  display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-end;gap:${MINIMAP_TOOL_GAP_PX}px;width:max-content;
  filter:drop-shadow(0 8px 22px rgba(0,0,0,.7));overflow:visible;pointer-events:none;}
.civ-minimap-wrap .civ-minimap-hud,.civ-minimap-wrap .civ-minimap-tools{pointer-events:auto;}
html.civ-ui-zoom-active .civ-minimap-wrap{left:${HUD_ZOOM_EDGE_PX}px;bottom:${HUD_ZOOM_BOTTOM_PX}px;}
.civ-minimap-hud{position:relative;flex:0 0 var(--mini-w,280px);width:var(--mini-w,280px);height:var(--mini-h,170px);
  background:#0a0f16;border:3px solid #6a5212;border-radius:12px;
  box-shadow:inset 0 0 0 2px rgba(232,216,138,.3);overflow:hidden;cursor:crosshair;}
.civ-minimap-hud canvas{display:block;width:100%;height:100%;}
.civ-minimap-hud .mini-placeholder{display:flex;align-items:center;justify-content:center;
  width:100%;height:100%;color:#9aa6b6;font:11px monospace;text-align:center;padding:8px;}
.civ-minimap-tools{display:flex;flex-direction:column;gap:${MINIMAP_TOOL_GAP_PX}px;padding:0;}
.civ-minimap-tools .mini-tool-btn{width:${MINIMAP_TOOL_BTN_PX}px;height:${MINIMAP_TOOL_BTN_PX}px;border-radius:9px;cursor:pointer;padding:0;
  border:1px solid rgba(232,216,138,.3);background:linear-gradient(180deg,#161c28,#0a0d14);
  color:#e8d88a;display:flex;align-items:center;justify-content:center;}
.civ-minimap-tools .mini-tool-btn:hover{border-color:rgba(232,216,138,.55);}
.civ-minimap-tools .mini-tool-btn.on{background:rgba(232,216,138,.12);border-color:var(--tg-gold-primary,#e8d88a);}
.civ-minimap-tools .mini-tool-btn svg{width:20px;height:20px;display:block;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

/** Montuje minimapę HUD (canvas z siatki danych MAPY). */
export function createMinimapHud(config: MinimapHudConfig): MinimapHudApi {
  ensureStyles();

  const w = config.width ?? DEFAULT_W;
  const h = config.height ?? DEFAULT_H;

  const wrap = document.createElement('div');
  wrap.className = 'civ-minimap-wrap';

  const el = document.createElement('div');
  el.className = 'civ-minimap-hud';
  el.style.setProperty('--mini-w', w + 'px');
  el.style.setProperty('--mini-h', h + 'px');
  el.style.height = h + 'px';
  wrap.appendChild(el);

  const tools = document.createElement('div');
  tools.className = 'civ-minimap-tools';
  wrap.appendChild(tools);

  // R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1: `.civ-minimap-tools` niesie WYŁĄCZNIE
  // te dwa przyciski (kryterium końca #1) — worker/deposit przeniesione do rzędu zoom
  // (hud.ts `.civ-hud-util-dock`), mapa/religia usunięte (sterowane z chipów górnego
  // paska, hud.ts handleHudBarAction).
  let territoryBtn: HTMLButtonElement | null = null;
  let tradeRoutesBtn: HTMLButtonElement | null = null;

  function ensureToolButtons(): void {
    const L = config.layers;
    if (L?.onToggleTerritory && !territoryBtn) {
      territoryBtn = document.createElement('button');
      territoryBtn.type = 'button';
      territoryBtn.className = 'mini-tool-btn';
      territoryBtn.title = 'Zasięg państwa (klik)';
      territoryBtn.innerHTML = TERRITORY_SVG;
      territoryBtn.onclick = () => L.onToggleTerritory?.();
      tools.appendChild(territoryBtn);
    }
    if (L?.onToggleTradeRoutes && !tradeRoutesBtn) {
      tradeRoutesBtn = document.createElement('button');
      tradeRoutesBtn.type = 'button';
      tradeRoutesBtn.className = 'mini-tool-btn';
      tradeRoutesBtn.title = 'Pokaż trasy handlowe (klik)';
      tradeRoutesBtn.innerHTML = TRADE_ROUTES_SVG;
      tradeRoutesBtn.onclick = () => L.onToggleTradeRoutes?.();
      tools.appendChild(tradeRoutesBtn);
    }
    if (territoryBtn) territoryBtn.classList.toggle('on', L?.isTerritoryActive?.() ?? false);
    if (tradeRoutesBtn) tradeRoutesBtn.classList.toggle('on', L?.isTradeRoutesActive?.() ?? false);
  }

  let canvas: HTMLCanvasElement | null = null;

  function mountCanvas(): void {
    if (canvas !== null) return;
    el.querySelectorAll('.mini-placeholder').forEach(n => n.remove());
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    el.appendChild(canvas);

    canvas.addEventListener('click', (e: MouseEvent) => {
      if (config.onMinimapClick === undefined) return;
      const data = config.getMinimapData();
      if (data === null || canvas === null) return;
      const rect = canvas.getBoundingClientRect();
      // CSS px → wewnętrzne (w×h) → przestrzeń axialMinimapXY (odwrócony layout renderu),
      // dzięki temu klik trafia w faktyczny heks (skośny pointy-top), nie liniowo.
      const cxi = ((e.clientX - rect.left) / rect.width) * w;
      const cyi = ((e.clientY - rect.top) / rect.height) * h;
      const { scale, offX, offY } = computeMinimapLayout(data.hexes, w, h);
      const mx = (cxi - offX) / scale;
      const my = (cyi - offY) / scale;
      // axialMinimapXY: y = 1.5·r, x = √3·(q + r/2) → odwrócenie:
      const r = Math.round(my / 1.5);
      const q = Math.round(mx / SQRT3 - r * 0.5);
      config.onMinimapClick(q, r);
    });
  }

  function showPlaceholder(msg: string): void {
    if (canvas !== null) {
      canvas.remove();
      canvas = null;
    }
    el.querySelectorAll('.mini-placeholder').forEach(n => n.remove());
    const ph = document.createElement('div');
    ph.className = 'mini-placeholder';
    ph.textContent = msg;
    el.appendChild(ph);
  }

  function update(): void {
    ensureToolButtons();
    const data = config.getMinimapData();
    if (data === null) {
      showPlaceholder('Minimapa — czeka na dane MAPY');
      return;
    }
    mountCanvas();
    if (canvas !== null) renderCanvas(canvas, data, w, h);
  }

  function destroy(): void {
    wrap.remove();
    canvas = null;
  }

  update();
  return { el: wrap, get canvas() { return canvas; }, update, destroy };
}

/** Ustaw etykietę tury na minimapie (opcjonalnie — w mockupie 1E tura jest przy Końcu tury). */
export function setMinimapTurnLabel(_api: MinimapHudApi, _turn: number): void {
  /* no-op — tura w bottomBarHud */
}
