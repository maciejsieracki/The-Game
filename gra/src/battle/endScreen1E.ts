/**
 * endScreen1E.ts — ekran końca bitwy C-12 v2 (Design 1E, 2026-07-03).
 * Dopolerowany wg mockup `C12 Koniec bitwy v2 (1E).dc.html` (2026-07-05, lane UI A6).
 */
import {
  BATTLE_ENEMY_TEXT,
  BATTLE_FONT,
  BATTLE_FONT_TITLE,
  BATTLE_GOLD,
  BATTLE_PLAYER_TEXT,
  BATTLE_TEXT_DIM,
} from './battleHudTheme';

export interface EndScreenSideStats {
  lost: number;
  remaining: number;
  total: number;
  hp: number;
  hpMax: number;
}

export interface EndScreen1EParams {
  playerWon: boolean;
  winnerLabel: string;
  battleTitle: string;
  atk: EndScreenSideStats;
  def: EndScreenSideStats;
  lootGold?: number;
  lootNote?: string;
  heroLabel?: string;
  heroPromo?: string;
}

export interface EndScreen1ECallbacks {
  onDetails: () => void;
  /** Ponowna rozgrywka tymi samymi armiami (bez powrotu na mapę). */
  onReplay?: () => void;
  onFinish: () => void;
}

const WREATH_SVG =
  '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">' +
  '<path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M8 4H6a2 2 0 0 0 2 2M16 4h2a2 2 0 0 1-2 2"/>' +
  '<path d="M10 12.5h4M9.5 18h5M12 12.5V18"/></svg>';

const HERO_SVG =
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">' +
  '<path d="M5 20c0-6 2-9 6-10l1-3 3 1-1 3c3 1 4 4 4 9"/>' +
  '<path d="M9 11 6 9 4 11"/><path d="M9 20v-3M16 20v-3"/></svg>';

const END_DIVIDER =
  '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:16px;">' +
  '<span style="height:1px;width:min(150px,18vw);background:linear-gradient(90deg,transparent,#a08030);"></span>' +
  '<span style="color:#a08030;">◆</span>' +
  '<span style="height:1px;width:min(150px,18vw);background:linear-gradient(90deg,#a08030,transparent);"></span>' +
  '</div>';

/** Ponad deploy-toolbar (100200) i rail (100080) — mount na document.body. */
const END_SCREEN_Z_BACK = '100500';
const END_SCREEN_Z_WRAP = '100501';

function applyEndOutlineBtn(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    background: 'transparent',
    border: '2px solid rgba(232,216,138,0.4)',
    color: BATTLE_GOLD,
    fontFamily: BATTLE_FONT,
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '16px 34px',
    borderRadius: '9px',
    cursor: 'pointer',
  });
}

function applyEndPrimaryBtn(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(180deg,#f0dc88,#b99a28)',
    border: '1px solid #6a5212',
    borderTopColor: '#f8eea8',
    color: '#2e2708',
    fontFamily: BATTLE_FONT,
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    padding: '18px 54px',
    borderRadius: '9px',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4),0 6px 22px rgba(232,216,138,0.28)',
  });
}

function applyEndReplayLink(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    background: 'transparent',
    border: 'none',
    color: BATTLE_TEXT_DIM,
    fontFamily: BATTLE_FONT,
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '8px 12px',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  });
}

export function showEndScreen1E(
  _overlay: HTMLElement,
  p: EndScreen1EParams,
  cb: EndScreen1ECallbacks,
): { backdrop: HTMLDivElement; wrap: HTMLDivElement } {
  const backdrop = document.createElement('div');
  backdrop.dataset.battleEndScreen = 'backdrop';
  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    zIndex: END_SCREEN_Z_BACK,
    background:
      'radial-gradient(1100px 800px at 50% 30%, rgba(232,216,138,0.1), transparent 60%), #080a12',
    boxShadow: 'inset 0 0 300px 90px rgba(0,0,0,0.8)',
  });
  document.body.appendChild(backdrop);

  const wrap = document.createElement('div');
  wrap.dataset.battleEndScreen = 'wrap';
  Object.assign(wrap.style, {
    position: 'fixed',
    inset: '0',
    zIndex: END_SCREEN_Z_WRAP,
    pointerEvents: 'none',
    fontFamily: BATTLE_FONT,
    color: '#e8e0c8',
    textAlign: 'center',
  });

  const winWord = p.playerWon ? 'ZWYCI\u0118STWO' : 'PORA\u017BKA';
  const winColor = p.playerWon ? BATTLE_GOLD : BATTLE_ENEMY_TEXT;
  const winGlow = p.playerWon
    ? '0 2px 20px rgba(0,0,0,0.7),0 0 46px rgba(232,216,138,0.22)'
    : '0 2px 20px rgba(0,0,0,0.7),0 0 40px rgba(200,64,64,0.18)';
  const loot = p.lootGold ?? 0;
  const hero = p.heroLabel ?? '—';
  const promo = p.heroPromo ?? '';
  const subLine = p.winnerLabel
    ? `<div style="font-size:13px;color:${BATTLE_TEXT_DIM};margin-top:10px;letter-spacing:0.08em;">${p.winnerLabel}</div>`
    : '';

  wrap.innerHTML =
    `<div style="position:absolute;top:80px;left:0;right:0;z-index:3;">
      <div style="display:flex;justify-content:center;margin-bottom:18px;">
        <span style="width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 40% 34%,#2a2416,#12100a);border:2px solid ${BATTLE_GOLD};box-shadow:0 0 40px rgba(232,216,138,0.3);display:inline-flex;align-items:center;justify-content:center;color:#f4e6a8;">${WREATH_SVG}</span>
      </div>
      <div style="font-size:14px;letter-spacing:0.5em;text-transform:uppercase;color:#a08030;">${p.battleTitle}</div>
      <h1 style="font-family:${BATTLE_FONT_TITLE};font-weight:400;font-size:82px;letter-spacing:0.12em;margin:10px 0 0;color:${winColor};text-shadow:${winGlow};">${winWord}</h1>
      ${END_DIVIDER}
      ${subLine}
    </div>
    <div style="position:absolute;top:430px;left:50%;transform:translateX(-50%);z-index:3;display:flex;flex-wrap:wrap;justify-content:center;gap:18px;pointer-events:none;max-width:min(740px,96vw);">
      <div style="width:230px;border:2px solid rgba(90,155,212,0.4);border-radius:12px;background:linear-gradient(180deg,rgba(18,26,40,0.96),rgba(8,12,20,0.96));padding:22px;text-align:center;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BATTLE_PLAYER_TEXT};margin-bottom:8px;">Twoje straty</div>
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:38px;color:${BATTLE_PLAYER_TEXT};">${p.atk.lost}</div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};">z ${p.atk.total} jednostek</div>
      </div>
      <div style="width:230px;border:2px solid rgba(200,64,64,0.4);border-radius:12px;background:linear-gradient(180deg,rgba(26,14,14,0.96),rgba(14,8,8,0.96));padding:22px;text-align:center;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BATTLE_ENEMY_TEXT};margin-bottom:8px;">Straty wroga</div>
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:38px;color:${BATTLE_ENEMY_TEXT};">${p.def.lost}</div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};">z ${p.def.total} jednostek</div>
      </div>
      <div style="width:230px;border:2px solid rgba(232,216,138,0.4);border-radius:12px;background:linear-gradient(180deg,rgba(28,24,16,0.96),rgba(12,10,6,0.96));padding:22px;text-align:center;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a08030;margin-bottom:8px;">\u0141upy</div>
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:38px;color:${BATTLE_GOLD};">+${loot}</div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};">${p.lootNote ?? 'z\u0142ota'}</div>
      </div>
    </div>
    <div style="position:absolute;top:640px;left:50%;transform:translateX(-50%);z-index:3;width:min(712px,92vw);border:1px solid rgba(232,216,138,0.25);border-radius:12px;background:rgba(255,255,255,0.02);padding:18px 22px;display:flex;align-items:center;gap:16px;text-align:left;">
      <span style="width:52px;height:52px;flex:none;border-radius:50%;background:radial-gradient(circle at 38% 30%,#2a2416,#12100a);border:2px solid ${BATTLE_GOLD};display:inline-flex;align-items:center;justify-content:center;color:#f4e6a8;">${HERO_SVG}</span>
      <div style="flex:1;"><div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#a08030;">Bohater bitwy</div><div style="font-family:${BATTLE_FONT_TITLE};font-size:20px;color:${BATTLE_GOLD};">${hero}</div></div>
      ${promo ? `<div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7ad0a0;flex:none;">${promo}</div>` : ''}
    </div>
    <div data-end-replay-row style="position:absolute;bottom:132px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:auto;display:none;"></div>
    <div data-end-btn-row style="position:absolute;bottom:80px;left:0;right:0;z-index:3;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:16px;pointer-events:auto;padding:0 16px;"></div>
    <div style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:3;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#5a564c;pointer-events:none;">The Game \u00B7 C-12 Koniec bitwy \u00B7 1E</div>`;

  document.body.appendChild(wrap);

  const replayRow = wrap.querySelector('[data-end-replay-row]') as HTMLDivElement;
  if (cb.onReplay) {
    replayRow.style.display = 'block';
    const btnReplay = document.createElement('button');
    btnReplay.type = 'button';
    btnReplay.textContent = 'Rozegraj ponownie \u00B7 ta sama armia, pe\u0142ne HP';
    applyEndReplayLink(btnReplay);
    btnReplay.onclick = () => cb.onReplay!();
    replayRow.appendChild(btnReplay);
  }

  const btnRow = wrap.querySelector('[data-end-btn-row]') as HTMLDivElement;

  const btnDetails = document.createElement('button');
  btnDetails.type = 'button';
  btnDetails.textContent = 'Szczeg\u00F3\u0142y bitwy';
  applyEndOutlineBtn(btnDetails);
  btnDetails.onclick = () => cb.onDetails();
  btnRow.appendChild(btnDetails);

  const btnMap = document.createElement('button');
  btnMap.type = 'button';
  btnMap.textContent = 'Powr\u00F3t do mapy \u2192';
  applyEndPrimaryBtn(btnMap);
  btnMap.onclick = () => cb.onFinish();
  btnRow.appendChild(btnMap);

  return { backdrop, wrap };
}
