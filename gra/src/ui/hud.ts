/**
 * hud.ts
 * HUD w grze (UI plan pkt 3) — gorny pasek zasobow + przyciski + minimapa.
 * Uklad wg Makieta-HUD-mapa-swiata.html (grupy zasobow: Zloto/Praca, Wplyw/Nauka,
 * Kultura/Zadowolenie, Osiedla/Nacja + pasek Epoki).
 *
 * DOM-only, DECOUPLED: dane podaje silnik przez getState(); akcje przez callbacki.
 *
 * MINIMAPA — dwa warianty kontraktu (addytywne, opcjonalne):
 *   Wariant A (onMountMinimap): MAPA renderuje swoj skalowany render 3D/2D do slotu.
 *   Wariant B (getMinimapData): UI rysuje lekka przegladowa minimape z danych heksow.
 * Jesli nie podano zadnego — zostaje placeholder "Minimapa — render: MAPA".
 *
 * LANE: src/ui/*.  Pokazanie + onEndTurn (klawisz N) wpina master/silnik.
 * Source: literalny UTF-8 dla polskich napisow; symbole przez encje/escapy.
 */

export type { HudState, HudConfig, MinimapHexData, MinimapData };

export interface HudState {
  zloto: number;
  zlotoRate: number;
  praca: number;
  pracaRate: number;
  wplyw: number;
  nauka: number;
  kultura: number;
  zadowolenie: number;
  osiedla: number;
  osiedlaMax: number;
  nacja: string;
  tura: number;
  epoka: string;
  /** Postep do nastepnej epoki 0..1 (opcjonalnie). */
  epokaPostep?: number;
  /** Aktualnie badana technologia (opcjonalnie). */
  badana?: string | null;
}

/** Dane pojedynczego heksa do rysowania minimapy (wariant B). */
export interface MinimapHexData {
  q: number;
  r: number;
  /** Klucz terenu odpowiadajacy TerenBazowy, np. 'Laka', 'Morze', 'Gory'. */
  teren: string;
  /** Kolor wlasciciela (hex CSS, np. '#e05050') lub undefined gdy niczyje. */
  ownerColor?: string | undefined;
}

/** Dane mapy przekazywane przez wariant B kontraktu. */
export interface MinimapData {
  cols: number;
  rows: number;
  hexes: MinimapHexData[];
  /** Prostokat widoku kamery w przestrzeni heksow (do rysowania ramki). */
  viewport?: { x: number; y: number; w: number; h: number } | undefined;
}

export interface HudConfig {
  getState: () => HudState;
  onEndTurn?: () => void;
  onOpenCities?: () => void;
  onOpenScience?: () => void;
  onOpenDiplomacy?: () => void;
  onOpenMenu?: () => void;

  /**
   * WARIANT A — MAPA renderuje swoj render do podanego elementu.
   * Wywolywane raz przy montowaniu minimapy. MAPA powinna startowac swoj
   * renderer (np. WebGL canvas) wewnatrz `el` o podanych wymiarach.
   * Priorytet: jesli obecny, uzyje sie tego wariantu (ignoruje getMinimapData).
   */
  onMountMinimap?: (el: HTMLElement, api: { width: number; height: number }) => void;

  /**
   * WARIANT B — UI pobiera dane i rysuje przegladowa minimape na <canvas>.
   * Wywolywane przy kazdym updateHud(). Zwroc null jesli dane niedostepne.
   */
  getMinimapData?: () => MinimapData | null;

  /**
   * Opcjonalny hak klikniecia na minimapie — przesuniecie kamery.
   * Argumenty q, r to przyblizony aksjalny hex pod kursorem.
   * Dostepny w obu wariantach.
   */
  onMinimapClick?: (q: number, r: number) => void;
}

// ---------------------------------------------------------------------------
// Kolory terenu dla wariantu B (przeglad 2D)
// ---------------------------------------------------------------------------

const TEREN_KOLOR: Record<string, string> = {
  Laka: '#5a9e48',
  Rownina: '#9ab85c',
  Wzgorza: '#7b6e50',
  Gory: '#8a8a8a',
  Wybrzeze: '#78b8c8',
  Morze: '#2a6080',
  Pustynia: '#c8b46a',
};
const TEREN_KOLOR_DEFAULT = '#3a4450';

// ---------------------------------------------------------------------------
// Stan modulu
// ---------------------------------------------------------------------------

let cfg: HudConfig | null = null;
let barEl: HTMLDivElement | null = null;
let miniEl: HTMLDivElement | null = null;
let miniCanvas: HTMLCanvasElement | null = null;
let miniMounted = false;

const MINI_W = 200;
const MINI_H = 140;

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-hud-css';
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-hud{position:fixed;top:0;left:0;right:0;z-index:310;
  --gold:#e0b24a;--orange:#d98a3a;--green:#6bbf59;--blue:#5a9bd4;--muted:#9aa6b6;--bd:rgba(224,178,74,0.25);
  background:linear-gradient(180deg,#1b1f26,#141820);border-bottom:2px solid rgba(224,178,74,0.35);
  color:#e8ebf0;font:13px 'Segoe UI',Tahoma,sans-serif;display:flex;align-items:center;gap:0.6em;padding:6px 12px;flex-wrap:wrap;}
.civ-hud *{box-sizing:border-box;}
.civ-hud .grp{display:flex;gap:0.9em;padding:0 0.8em;border-right:1px solid var(--bd);}
.civ-hud .res{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15;}
.civ-hud .res .top{display:flex;align-items:baseline;gap:0.25em;}
.civ-hud .res .ic{font-size:1.05em;} .civ-hud .res .val{font-weight:700;}
.civ-hud .res .rate{font-size:0.75em;color:var(--green);}
.civ-hud .res .rate.o{color:var(--orange);}
.civ-hud .res .lbl{font-size:0.66em;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;}
.civ-hud .res .lim{font-size:0.7em;color:var(--muted);}
.civ-hud .epoch{display:flex;flex-direction:column;gap:3px;min-width:140px;padding:0 0.6em;}
.civ-hud .epoch .e-l{font-size:0.7em;color:var(--muted);}
.civ-hud .epoch .e-b{height:5px;background:rgba(224,178,74,0.15);border-radius:3px;overflow:hidden;}
.civ-hud .epoch .e-f{height:100%;background:var(--gold);}
.civ-hud .right{margin-left:auto;display:flex;align-items:center;gap:0.4em;}
.civ-hud .turn{font-size:0.82em;color:var(--muted);}
.civ-hud .turn b{color:var(--gold);}
.civ-hud button{font-family:inherit;cursor:pointer;border-radius:4px;}
.civ-hud .b{background:rgba(224,178,74,0.1);border:1px solid var(--bd);color:#e8ebf0;font-size:0.8em;padding:5px 10px;}
.civ-hud .b:hover{background:rgba(224,178,74,0.2);}
.civ-hud .end{background:linear-gradient(180deg,#c09030,#8a6418);border:1px solid #c0a040;color:#fff8e0;font-weight:700;font-size:0.85em;padding:6px 16px;}
.civ-hud .end:hover{background:linear-gradient(180deg,#d0a040,#9a7428);}
.civ-mini{position:fixed;right:12px;bottom:12px;width:${MINI_W}px;height:${MINI_H}px;z-index:310;
  background:rgba(20,24,32,0.92);border:1px solid rgba(224,178,74,0.3);border-radius:6px;
  overflow:hidden;
  box-shadow:0 4px 16px rgba(0,0,0,0.6);cursor:crosshair;}
.civ-mini-placeholder{display:flex;align-items:center;justify-content:center;
  width:100%;height:100%;color:#9aa6b6;font:11px monospace;text-align:center;}
.civ-mini canvas{display:block;width:100%;height:100%;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Pasek zasobow
// ---------------------------------------------------------------------------

function res(icon: string, val: string, lbl: string, rate?: string, rateO?: boolean): string {
  let r = '<div class="res"><div class="top"><span class="ic">' + icon + '</span><span class="val">' + val + '</span>';
  if (rate !== undefined) r += '<span class="rate' + (rateO === true ? ' o' : '') + '">' + rate + '</span>';
  r += '</div><span class="lbl">' + lbl + '</span></div>';
  return r;
}

function signed(n: number): string { return (n > 0 ? '+' : '') + String(n); }

function renderBar(): void {
  if (barEl === null || cfg === null) return;
  const s = cfg.getState();
  let html = '';
  html += '<div class="grp">' + res('\u{1FA99}', String(s.zloto), 'Złoto', signed(s.zlotoRate) + '/t')
    + res('\u{1F528}', String(s.praca), 'Praca', signed(s.pracaRate) + '/t', true) + '</div>';
  html += '<div class="grp">' + res('\u{1F3DB}️', signed(s.wplyw), 'Wpływ')
    + res('⚛️', signed(s.nauka), 'Nauka') + '</div>';
  html += '<div class="grp">' + res('\u{1F3BC}', signed(s.kultura), 'Kultura')
    + res('\u{1F600}', signed(s.zadowolenie), 'Zadowolenie') + '</div>';
  html += '<div class="grp">' + res('\u{1F3D8}️', s.osiedla + '<span class="lim">/' + s.osiedlaMax + '</span>', 'Osiedla')
    + res('\u{1F451}', s.nacja, 'Nacja') + '</div>';
  const pct = Math.round(Math.max(0, Math.min(1, s.epokaPostep ?? 0)) * 100);
  html += '<div class="epoch"><span class="e-l">Epoka: <b style="color:var(--gold)">' + s.epoka + '</b>'
    + (s.badana != null ? ' · ' + s.badana : '') + '</span><div class="e-b"><div class="e-f" style="width:' + pct + '%"></div></div></div>';
  html += '<div class="right"><span class="turn">Tura <b>' + s.tura + '</b></span>'
    + '<button class="b" data-act="cities">\u{1F3D9} Miasta</button>'
    + '<button class="b" data-act="science">⚛️ Nauka</button>'
    + '<button class="b" data-act="diplo">\u{1F91D} Dyplomacja</button>'
    + '<button class="b" data-act="menu">☰</button>'
    + '<button class="end" data-act="end">Zakończ turę ▶</button></div>';
  barEl.innerHTML = html;
  barEl.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = (btn as HTMLElement).getAttribute('data-act');
      if (cfg === null) return;
      if (a === 'end') cfg.onEndTurn?.();
      else if (a === 'cities') cfg.onOpenCities?.();
      else if (a === 'science') cfg.onOpenScience?.();
      else if (a === 'diplo') cfg.onOpenDiplomacy?.();
      else if (a === 'menu') cfg.onOpenMenu?.();
    });
  });
}

// ---------------------------------------------------------------------------
// Minimapa — wariant B: rysowanie na canvas
// ---------------------------------------------------------------------------

function renderMinimapCanvas(data: MinimapData): void {
  if (miniCanvas === null) return;
  const ctx = miniCanvas.getContext('2d');
  if (ctx === null) return;

  const W = MINI_W;
  const H = MINI_H;
  miniCanvas.width = W;
  miniCanvas.height = H;

  const cellW = W / data.cols;
  const cellH = H / data.rows;

  // Rysuj komorki heksow (uproszczone prostokaty — przegladowa minimapa)
  for (const hex of data.hexes) {
    const px = hex.q * cellW;
    const py = hex.r * cellH;
    const kolor = TEREN_KOLOR[hex.teren] ?? TEREN_KOLOR_DEFAULT;
    ctx.fillStyle = kolor;
    ctx.fillRect(Math.floor(px), Math.floor(py), Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);

    // Obrys wlasciciela (cienka ramka w kolorze gracza)
    if (hex.ownerColor !== undefined && hex.ownerColor !== '') {
      ctx.strokeStyle = hex.ownerColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.floor(px) + 0.5, Math.floor(py) + 0.5, Math.ceil(cellW), Math.ceil(cellH));
    }
  }

  // Prostokat widoku (viewport)
  if (data.viewport !== undefined) {
    const vp = data.viewport;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.floor(vp.x * cellW) + 0.5,
      Math.floor(vp.y * cellH) + 0.5,
      Math.ceil(vp.w * cellW),
      Math.ceil(vp.h * cellH)
    );
  }
}

// ---------------------------------------------------------------------------
// Minimapa — montowanie slotu
// ---------------------------------------------------------------------------

function mountMinimap(): void {
  if (miniEl === null || cfg === null || miniMounted) return;

  if (cfg.onMountMinimap !== undefined) {
    // Wariant A: MAPA renderuje do naszego elementu
    miniEl.innerHTML = '';
    cfg.onMountMinimap(miniEl, { width: MINI_W, height: MINI_H });
    miniMounted = true;
  } else if (cfg.getMinimapData !== undefined) {
    // Wariant B: canvas rysowany przez UI
    miniEl.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = MINI_W;
    canvas.height = MINI_H;
    miniEl.appendChild(canvas);
    miniCanvas = canvas;
    miniMounted = true;

    // Klik na minimapie — mapowanie pikseli na hex
    canvas.addEventListener('click', (e: MouseEvent) => {
      if (cfg?.onMinimapClick === undefined || cfg.getMinimapData === undefined) return;
      const data = cfg.getMinimapData();
      if (data === null) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const q = Math.floor((px / rect.width) * data.cols);
      const r = Math.floor((py / rect.height) * data.rows);
      cfg.onMinimapClick(q, r);
    });
  } else {
    // Placeholder
    miniEl.innerHTML = '<div class="civ-mini-placeholder">Minimapa\n— render: dział MAPA</div>';
    miniMounted = true;
  }

  // Klik na minimapie w wariancie A (przekazujemy do onMinimapClick przez element)
  if (cfg.onMountMinimap !== undefined && cfg.onMinimapClick !== undefined) {
    miniEl.addEventListener('click', (e: MouseEvent) => {
      if (cfg?.onMinimapClick === undefined || cfg.getMinimapData === undefined) return;
      // W wariancie A dane heksow nie sa dostepne — przekazujemy pozycje -1,-1
      // (MAPA moze dostarczyc onMinimapClick bezposrednio przez swoj renderer)
      const rect = miniEl!.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      // Przyblizenie: znormalizowane wspolrzedne jako q,r (MAPA przelicza sama)
      cfg.onMinimapClick(Math.round(nx * 100), Math.round(ny * 100));
    });
  }
}

function refreshMinimap(): void {
  if (cfg === null || miniEl === null) return;
  if (!miniMounted) { mountMinimap(); }
  if (cfg.getMinimapData !== undefined && miniCanvas !== null) {
    const data = cfg.getMinimapData();
    if (data !== null) renderMinimapCanvas(data);
  }
}

// ---------------------------------------------------------------------------
// API publiczne
// ---------------------------------------------------------------------------

/** Pokaz HUD (gorny pasek + slot minimapy). */
export function showHud(config: HudConfig): void {
  cfg = config;
  miniMounted = false;
  miniCanvas = null;
  ensureStyles();
  if (barEl === null) {
    barEl = document.createElement('div');
    barEl.className = 'civ-hud';
    document.body.appendChild(barEl);
  }
  if (miniEl === null) {
    miniEl = document.createElement('div');
    miniEl.className = 'civ-mini';
    document.body.appendChild(miniEl);
  } else {
    // Reset przy ponownym showHud (np. zmiana konfiguracji)
    miniEl.innerHTML = '';
    miniMounted = false;
    miniCanvas = null;
  }
  renderBar();
  mountMinimap();
  barEl.style.display = 'flex';
  miniEl.style.display = 'block';
}

/** Odswiez wartosci HUD (po turze / zmianie stanu) — odswieza tez minimape B. */
export function updateHud(): void {
  renderBar();
  refreshMinimap();
}

/** Ukryj HUD. */
export function hideHud(): void {
  if (barEl !== null) barEl.style.display = 'none';
  if (miniEl !== null) miniEl.style.display = 'none';
}

/** Czy HUD widoczny. */
export function isHudOpen(): boolean { return barEl !== null && barEl.style.display !== 'none'; }
