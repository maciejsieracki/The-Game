/**
 * siegeHud1E.ts — HUD oblężenia C-04 / szturmu muru C-05 (Design 1E, 2026-07-03).
 */
import {
  BATTLE_ENEMY_TEXT, BATTLE_FONT, BATTLE_FONT_TITLE, BATTLE_GOLD, BATTLE_PANEL_BG,
  BATTLE_PANEL_BORDER, BATTLE_PLAYER_TEXT, BATTLE_TEXT_DIM,
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

let root: HTMLDivElement | null = null;
let phase: SiegeHudPhase = 'siege';
let chromeVisible = true;

/** Ukryj cały HUD oblężenia (C-04/C-05) gdy widoczny toolbar deploy / walka R. */
export function setSiegeHudVisible(visible: boolean): void {
  chromeVisible = visible;
  if (root) root.style.display = visible ? 'block' : 'none';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function mountSiegeHud1E(overlay: HTMLElement, callbacks: SiegeHudCallbacks): HTMLDivElement {
  disposeSiegeHud1E();
  phase = 'siege';
  root = document.createElement('div');
  Object.assign(root.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '10008',
  });
  overlay.appendChild(root);
  root.style.display = chromeVisible ? 'block' : 'none';
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest('[data-act]') as HTMLElement | null;
    if (!btn) return;
    e.stopPropagation();
    if (btn.dataset.act === 'skip') callbacks.onSkip?.();
    if (btn.dataset.act === 'exit') callbacks.onExit?.();
  });
  renderSiegeHud1E(emptyState());
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
}

function renderSiegeHud1E(st: SiegeHudState): void {
  if (!root) return;
  const isStorm = phase === 'storm';
  const title = isStorm ? `Szturm mur\u00F3w ${esc(st.cityName)}` : `Obl\u0119\u017Cenie ${esc(st.cityName)}`;
  const badge = isStorm
    ? '<span style="font-size:11px;font-weight:700;color:#fff0e8;background:#c84040;border-radius:6px;padding:2px 8px;">Faza szturmu</span>'
    : `<span style="font-size:11px;font-weight:700;color:#2e2708;background:${BATTLE_GOLD};border-radius:6px;padding:2px 8px;">Tura ${st.turn}</span>`;
  const atkLabel = isStorm ? 'Szturmuj\u0105cy' : 'Oblegaj\u0105cy (Ty)';
  const defLabel = isStorm ? 'Obro\u0144cy muru' : `Garnizon ${esc(st.cityName)}`;

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
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};margin-top:10px;line-height:1.6;">${esc(st.breachLabel)}${st.wallDeltaPerTurn ? `<br>\u2212${st.wallDeltaPerTurn}% / tur\u0119` : ''}</div>
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

  const stormBtn = isStorm ? 'Szturm przez wy\u0142om' : 'Szturm';
  const midBtn = isStorm ? 'Wie\u017Ca' : 'Czekaj / tur\u0119';
  const firstBtn = isStorm ? 'Drabiny' : 'Ostrza\u0142';
  const hint = isStorm
    ? 'Skieruj oddzia\u0142y na wy\u0142om, by unikn\u0105\u0107 bonusu mur\u00F3w.'
    : 'Kontynuuj ostrza\u0142, by os\u0142abi\u0107 mury, albo rozpocznij szturm gdy wy\u0142om jest gotowy.';

  root.innerHTML =
    `<div style="position:absolute;top:0;left:0;right:0;height:52px;pointer-events:auto;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:linear-gradient(180deg,rgba(18,24,32,0.96),rgba(8,10,16,0.9));border-bottom:1px solid rgba(232,216,138,0.25);font-family:${BATTLE_FONT};">
      <div style="display:flex;align-items:center;gap:12px;"><span style="font-family:${BATTLE_FONT_TITLE};font-size:16px;color:${BATTLE_GOLD};">${title}</span>${badge}</div>
      <div style="display:flex;align-items:center;gap:14px;">
        <span style="font-size:11px;color:${BATTLE_PLAYER_TEXT};letter-spacing:0.1em;text-transform:uppercase;">${atkLabel}</span>
        <span style="font-family:${BATTLE_FONT_TITLE};font-size:16px;color:${BATTLE_GOLD};">VS</span>
        <span style="font-size:11px;color:${BATTLE_ENEMY_TEXT};letter-spacing:0.1em;text-transform:uppercase;">${defLabel}</span>
      </div>
      <div style="display:flex;gap:10px;">
        <button type="button" data-act="skip" style="height:32px;padding:0 14px;border:1px solid rgba(232,216,138,0.3);border-radius:8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BATTLE_GOLD};background:transparent;cursor:pointer;">Pomi\u0144 \u2192 wynik</button>
        <button type="button" data-act="exit" style="height:32px;padding:0 14px;border:1px solid rgba(200,64,64,0.4);border-radius:8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BATTLE_ENEMY_TEXT};background:transparent;cursor:pointer;">Wyj\u015Bcie</button>
      </div>
    </div>
    <div style="position:absolute;top:72px;left:16px;width:250px;pointer-events:none;background:${BATTLE_PANEL_BG};border:2px solid ${BATTLE_PANEL_BORDER};border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,0.55);font-family:${BATTLE_FONT};">
      <div style="padding:12px 16px;border-bottom:1px solid rgba(232,216,138,0.2);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BATTLE_GOLD};">${leftTitle}</div>
      ${leftBody}
    </div>
    <div style="position:absolute;top:72px;right:16px;width:250px;pointer-events:none;background:${BATTLE_PANEL_BG};border:2px solid ${rightBorder};border-radius:12px;box-shadow:0 10px 26px rgba(0,0,0,0.55);font-family:${BATTLE_FONT};">
      <div style="padding:12px 16px;border-bottom:1px solid rgba(200,64,64,0.15);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${isStorm ? BATTLE_ENEMY_TEXT : BATTLE_GOLD};">${rightTitle}</div>
      ${rightBody}
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:170px;pointer-events:none;background:linear-gradient(0deg,rgba(18,24,32,0.97),rgba(8,10,16,0.9));border-top:2px solid rgba(232,216,138,0.4);border-radius:16px 16px 0 0;display:flex;align-items:center;justify-content:center;gap:16px;padding:0 40px;font-family:${BATTLE_FONT};">
      <div style="flex:1;max-width:360px;font-size:13px;color:${BATTLE_TEXT_DIM};line-height:1.6;">${hint}</div>
      <button type="button" style="pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;border:2px solid rgba(232,216,138,0.45);border-radius:11px;background:linear-gradient(180deg,#161c28,#0a0d14);color:#e8d88a;cursor:default;font-family:inherit;"><span style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${firstBtn}</span></button>
      <button type="button" style="pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;border:2px solid rgba(232,216,138,0.3);border-radius:11px;background:rgba(255,255,255,0.02);color:#e8d88a;cursor:default;font-family:inherit;"><span style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${midBtn}</span></button>
      <button type="button" style="pointer-events:auto;display:inline-flex;align-items:center;gap:12px;background:linear-gradient(180deg,#d05050,#8a2424);border:1px solid #6a1818;color:#fff0e8;font-size:15px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;padding:18px 40px;border-radius:11px;cursor:default;font-family:inherit;">${stormBtn}</button>
    </div>`;
}

export function disposeSiegeHud1E(): void {
  if (root) { root.remove(); root = null; }
  chromeVisible = true;
}
