/**
 * siegeHud1E.ts — HUD oblężenia C-04 (Design 1E, 2026-07-03).
 * Boczne panele info (mur, siły). Dolny pasek C-05 (Ostrzał/Szturm) — nie renderowany
 * do czasu podpięcia pod prawdziwą logikę auto-oblężenia.
 */
import {
  BATTLE_ENEMY_TEXT, BATTLE_FONT, BATTLE_FONT_TITLE, BATTLE_GOLD, BATTLE_PANEL_BG,
  BATTLE_PANEL_BORDER, BATTLE_TEXT_DIM,
} from './battleHudTheme';

export type SiegeHudPhase = 'siege' | 'storm';

export interface SiegeHudState {
  cityName: string;
  turn: number;
  wallIntegrityPct: number;
  wallDeltaPerTurn: number;
  breachLabel: string;
  catapults: number;
  rams: number;
  infantry: number;
  garrison: number;
  gateOpen: boolean;
}

export interface SiegeHudCallbacks {
  onSkip?: () => void;
  onExit?: () => void;
}

export interface SiegeHudLayout {
  /** Lewa krawędź mapy — szerokość rosteru + margines (px). */
  rosterLeftPx?: number;
  /** Prawy margines — szerokość raila + odstęp (px). */
  railRightPx?: number;
  /** Y górnej krawędzi paneli bocznych (px). */
  topPanelPx?: number;
  /** Zarezerwowane (dawny dolny pasek C-05). */
  bottomReservePx?: number;
}

const DEFAULT_LAYOUT: Required<SiegeHudLayout> = {
  rosterLeftPx: 16,
  railRightPx: 88,
  topPanelPx: 132,
  bottomReservePx: 0,
};

let root: HTMLDivElement | null = null;
let phase: SiegeHudPhase = 'siege';
let chromeVisible = false;
let lastLayout: Required<SiegeHudLayout> = { ...DEFAULT_LAYOUT };

/** Ukryj/pokaż boczne panele oblężenia (integralność murów, siły). */
export function setSiegeHudVisible(visible: boolean): void {
  chromeVisible = visible;
  if (root) root.style.display = visible ? 'block' : 'none';
}

/** @deprecated C-05 mockup wyłączony — no-op. */
export function setSiegeHudBottomVisible(_visible: boolean): void { /* noop */ }

/** Ustaw pozycje paneli — nie nachodzą na roster, pasek mocy ani prawy rail. */
export function layoutSiegeHud1E(layout: SiegeHudLayout = {}): void {
  if (!root) return;
  lastLayout = {
    rosterLeftPx: layout.rosterLeftPx ?? lastLayout.rosterLeftPx,
    railRightPx: layout.railRightPx ?? lastLayout.railRightPx,
    topPanelPx: layout.topPanelPx ?? lastLayout.topPanelPx,
    bottomReservePx: layout.bottomReservePx ?? lastLayout.bottomReservePx,
  };
  const left = root.querySelector('[data-siege-panel="left"]') as HTMLDivElement | null;
  const right = root.querySelector('[data-siege-panel="right"]') as HTMLDivElement | null;
  const panelW = 236;
  if (left) {
    left.style.top = lastLayout.topPanelPx + 'px';
    left.style.left = Math.max(12, lastLayout.rosterLeftPx) + 'px';
    left.style.width = panelW + 'px';
    left.style.maxWidth = `calc(100% - ${lastLayout.railRightPx + lastLayout.rosterLeftPx + 24}px)`;
  }
  if (right) {
    right.style.top = lastLayout.topPanelPx + 'px';
    right.style.right = lastLayout.railRightPx + 'px';
    right.style.width = panelW + 'px';
    right.style.maxWidth = `calc(100% - ${lastLayout.railRightPx + lastLayout.rosterLeftPx + 32}px)`;
    right.style.maxHeight = `calc(100vh - ${lastLayout.topPanelPx + 48}px)`;
    right.style.overflowY = 'auto';
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function mountSiegeHud1E(overlay: HTMLElement, _callbacks: SiegeHudCallbacks): HTMLDivElement {
  disposeSiegeHud1E();
  phase = 'siege';
  lastLayout = { ...DEFAULT_LAYOUT };
  root = document.createElement('div');
  Object.assign(root.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '10008',
  });
  overlay.appendChild(root);
  root.style.display = chromeVisible ? 'block' : 'none';
  renderSiegeHud1E(emptyState());
  layoutSiegeHud1E(DEFAULT_LAYOUT);
  return root;
}

function emptyState(): SiegeHudState {
  return {
    cityName: 'Miasto', turn: 1, wallIntegrityPct: 100, wallDeltaPerTurn: 0,
    breachLabel: 'Mur intact', catapults: 0, rams: 0, infantry: 0, garrison: 0, gateOpen: false,
  };
}

export function updateSiegeHud1E(state: SiegeHudState): void {
  if (state.gateOpen || state.wallIntegrityPct <= 45) phase = 'storm';
  else phase = 'siege';
  renderSiegeHud1E(state);
  layoutSiegeHud1E(lastLayout);
}

function renderSiegeHud1E(st: SiegeHudState): void {
  if (!root) return;
  const isStorm = phase === 'storm';

  const leftTitle = isStorm ? 'Punkty szturmu' : 'Integralno\u015B\u0107 mur\u00F3w';
  const leftBody = isStorm
    ? `<div style="padding:14px 16px;font-size:13px;color:#e8e0c8;line-height:1.6;">
        <div style="padding:10px 12px;border:2px solid ${BATTLE_GOLD};border-radius:9px;background:rgba(232,216,138,0.06);margin-bottom:8px;">
          Wy\u0142om bramy <span style="color:#7ad0a0;float:right;">${st.gateOpen ? 'otwarty' : 'gotowy'}</span>
        </div>
        Drabiny (wsch.) \u00B7 Wie\u017Ca obl\u0119\u017Cnicza
      </div>`
    : `<div style="padding:16px;">
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:36px;color:${BATTLE_ENEMY_TEXT};margin-bottom:14px;">${st.wallIntegrityPct}%</div>
        <div style="height:12px;border-radius:6px;background:rgba(255,255,255,0.08);overflow:hidden;">
          <div style="width:${Math.max(0, Math.min(100, st.wallIntegrityPct))}%;height:100%;background:linear-gradient(90deg,#8a3a3a,#c05050);"></div>
        </div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};margin-top:10px;line-height:1.6;">${esc(st.breachLabel)}${st.catapults <= 0 && !isStorm ? '<br>Mur nie niszczy si\u0119 sam — potrzebne katapulty.' : (st.wallDeltaPerTurn ? `<br>\u2212${st.wallDeltaPerTurn}% / tur\u0119` : '')}</div>
      </div>`;

  const rightTitle = isStorm ? 'Obrona muru' : 'Si\u0142y obl\u0119\u017Cnicze';
  const rightBorder = isStorm ? 'rgba(200,64,64,0.35)' : BATTLE_PANEL_BORDER;
  const rightBody = isStorm
    ? `<div style="padding:16px;font-size:12px;color:${BATTLE_TEXT_DIM};line-height:1.8;">
        <div style="display:flex;justify-content:space-between;"><span>Obro\u0144cy na murach</span><span style="color:${BATTLE_ENEMY_TEXT};">${st.garrison} oddzia\u0142y</span></div>
        <div style="margin-top:10px;font-size:11px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">Szturm przez wy\u0142om omija bonus muru.</div>
      </div>`
    : `<div style="padding:14px 16px;font-size:13px;line-height:1.7;">
        <div>Katapulty \u00B7 <b style="color:${BATTLE_GOLD};">\u00D7${st.catapults}</b></div>
        <div>Tarany \u00B7 <b style="color:${BATTLE_GOLD};">\u00D7${st.rams}</b></div>
        <div>Piechota \u00B7 <b style="color:${BATTLE_GOLD};">\u00D7${st.infantry}</b></div>
        <div style="margin-top:8px;font-size:12px;color:${BATTLE_ENEMY_TEXT};">Garnizon: ${st.garrison}</div>
      </div>`;

  const panelBase =
    `pointer-events:none;background:${BATTLE_PANEL_BG};border-radius:12px;`
    + `box-shadow:0 10px 26px rgba(0,0,0,0.55);font-family:${BATTLE_FONT};box-sizing:border-box;`;

  root.innerHTML =
    `<div data-siege-panel="left" style="position:absolute;width:236px;${panelBase}border:2px solid ${BATTLE_PANEL_BORDER};">
      <div style="padding:12px 16px;border-bottom:1px solid rgba(232,216,138,0.2);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BATTLE_GOLD};">${leftTitle}</div>
      ${leftBody}
    </div>
    <div data-siege-panel="right" style="position:absolute;width:236px;${panelBase}border:2px solid ${rightBorder};">
      <div style="padding:12px 16px;border-bottom:1px solid rgba(200,64,64,0.15);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${isStorm ? BATTLE_ENEMY_TEXT : BATTLE_GOLD};">${rightTitle}</div>
      ${rightBody}
    </div>`;
  root.style.display = chromeVisible ? 'block' : 'none';
}

export function disposeSiegeHud1E(): void {
  if (root) { root.remove(); root = null; }
  chromeVisible = false;
  lastLayout = { ...DEFAULT_LAYOUT };
}
