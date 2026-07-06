/**
 * endScreen1E.ts — ekran końca bitwy C-12 v2 (Design 1E, 2026-07-03).
 */
import {
  applyBtnOutline, applyBtnPrimary, BATTLE_ENEMY_TEXT, BATTLE_FONT, BATTLE_FONT_TITLE,
  BATTLE_GOLD, BATTLE_PLAYER_TEXT, BATTLE_TEXT_DIM,
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
  /** Ponowna rozgrywka tymi samymi armiami (bez powrotu na mape). */
  onReplay?: () => void;
  onFinish: () => void;
}

const WREATH_SVG =
  '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M8 4H6a2 2 0 0 0 2 2M16 4h2a2 2 0 0 1-2 2"/><path d="M10 12.5h4M9.5 18h5M12 12.5V18"/></svg>';

/** Ponad deploy-toolbar (100200) i rail (100080) — mount na document.body. */
const END_SCREEN_Z_BACK = '100500';
const END_SCREEN_Z_WRAP = '100501';

export function showEndScreen1E(
  _overlay: HTMLElement,
  p: EndScreen1EParams,
  cb: EndScreen1ECallbacks,
): { backdrop: HTMLDivElement; wrap: HTMLDivElement } {
  const backdrop = document.createElement('div');
  backdrop.dataset.battleEndScreen = 'backdrop';
  Object.assign(backdrop.style, {
    position: 'fixed', inset: '0', background: 'rgba(4,8,18,0.55)', zIndex: END_SCREEN_Z_BACK,
  });
  document.body.appendChild(backdrop);

  const wrap = document.createElement('div');
  wrap.dataset.battleEndScreen = 'wrap';
  Object.assign(wrap.style, {
    position: 'fixed', inset: '0', zIndex: END_SCREEN_Z_WRAP, pointerEvents: 'none',
    fontFamily: BATTLE_FONT, color: '#e8e0c8', textAlign: 'center',
  });

  const winWord = p.playerWon ? 'ZWYCI\u0118STWO' : 'PORA\u017BKA';
  const loot = p.lootGold ?? 0;
  const hero = p.heroLabel ?? '—';
  const promo = p.heroPromo ?? '';

  wrap.innerHTML =
    `<div style="position:absolute;top:80px;left:0;right:0;">
      <div style="display:flex;justify-content:center;margin-bottom:18px;">
        <span style="width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 40% 34%,#2a2416,#12100a);border:2px solid ${BATTLE_GOLD};box-shadow:0 0 40px rgba(232,216,138,0.3);display:inline-flex;align-items:center;justify-content:center;color:#f4e6a8;">${WREATH_SVG}</span>
      </div>
      <div style="font-size:14px;letter-spacing:0.5em;text-transform:uppercase;color:#a08030;">${p.battleTitle}</div>
      <h1 style="font-family:${BATTLE_FONT_TITLE};font-weight:400;font-size:72px;letter-spacing:0.12em;margin:10px 0 0;color:${BATTLE_GOLD};text-shadow:0 2px 20px rgba(0,0,0,0.7);">${winWord}</h1>
      <div style="font-size:14px;color:${BATTLE_TEXT_DIM};margin-top:8px;">${p.winnerLabel}</div>
    </div>
    <div style="position:absolute;top:430px;left:50%;transform:translateX(-50%);display:flex;gap:18px;pointer-events:none;">
      <div style="width:200px;border:2px solid rgba(90,155,212,0.4);border-radius:12px;background:linear-gradient(180deg,rgba(18,26,40,0.96),rgba(8,12,20,0.96));padding:22px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BATTLE_PLAYER_TEXT};margin-bottom:8px;">Twoje straty</div>
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:38px;color:${BATTLE_PLAYER_TEXT};">${p.atk.lost}</div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};">z ${p.atk.total} jednostek</div>
      </div>
      <div style="width:200px;border:2px solid rgba(200,64,64,0.4);border-radius:12px;background:linear-gradient(180deg,rgba(26,14,14,0.96),rgba(14,8,8,0.96));padding:22px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${BATTLE_ENEMY_TEXT};margin-bottom:8px;">Straty wroga</div>
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:38px;color:${BATTLE_ENEMY_TEXT};">${p.def.lost}</div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};">z ${p.def.total} jednostek</div>
      </div>
      <div style="width:200px;border:2px solid rgba(232,216,138,0.4);border-radius:12px;background:linear-gradient(180deg,rgba(28,24,16,0.96),rgba(12,10,6,0.96));padding:22px;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a08030;margin-bottom:8px;">\u0141upy</div>
        <div style="font-family:${BATTLE_FONT_TITLE};font-size:38px;color:${BATTLE_GOLD};">+${loot}</div>
        <div style="font-size:12px;color:${BATTLE_TEXT_DIM};">${p.lootNote ?? 'z\u0142ota'}</div>
      </div>
    </div>
    <div style="position:absolute;top:640px;left:50%;transform:translateX(-50%);width:min(712px,92vw);border:1px solid rgba(232,216,138,0.25);border-radius:12px;background:rgba(255,255,255,0.02);padding:18px 22px;display:flex;align-items:center;gap:16px;text-align:left;">
      <span style="width:52px;height:52px;flex:none;border-radius:50%;background:radial-gradient(circle at 38% 30%,#2a2416,#12100a);border:2px solid ${BATTLE_GOLD};display:inline-flex;align-items:center;justify-content:center;color:#f4e6a8;">${WREATH_SVG.replace('52', '28').replace('52', '28')}</span>
      <div style="flex:1;"><div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#a08030;">Bohater bitwy</div><div style="font-family:${BATTLE_FONT_TITLE};font-size:20px;color:${BATTLE_GOLD};">${hero}</div></div>
      ${promo ? `<div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7ad0a0;">${promo}</div>` : ''}
    </div>
    <div style="position:absolute;bottom:72px;left:50%;transform:translateX(-50%);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${BATTLE_TEXT_DIM};pointer-events:none;">Ta sama armia · pełne HP · wynik na mapę dopiero po Powrocie</div>
    <div style="position:absolute;bottom:48px;left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;justify-content:center;gap:14px;pointer-events:auto;max-width:min(920px,96vw);"></div>`;

  document.body.appendChild(wrap);
  const btnRow = wrap.lastElementChild as HTMLDivElement;

  const btnReplay = document.createElement('button');
  btnReplay.textContent = 'Rozegraj ponownie';
  applyBtnPrimary(btnReplay);
  Object.assign(btnReplay.style, { flex: '1 1 220px', minWidth: '200px', maxWidth: '280px' });
  btnReplay.onclick = () => (cb.onReplay ? cb.onReplay() : undefined);
  btnRow.appendChild(btnReplay);

  const btnDetails = document.createElement('button');
  btnDetails.textContent = 'Szczeg\u00F3\u0142y bitwy';
  applyBtnOutline(btnDetails);
  Object.assign(btnDetails.style, { flex: '1 1 180px', minWidth: '160px', maxWidth: '240px' });
  btnDetails.onclick = () => cb.onDetails();
  btnRow.appendChild(btnDetails);

  const btnMap = document.createElement('button');
  btnMap.textContent = 'Powr\u00F3t do mapy \u2192';
  applyBtnOutline(btnMap);
  Object.assign(btnMap.style, { flex: '1 1 180px', minWidth: '160px', maxWidth: '240px' });
  btnMap.onclick = () => cb.onFinish();
  btnRow.appendChild(btnMap);

  return { backdrop, wrap };
}
