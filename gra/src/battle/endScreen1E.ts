/**
 * endScreen1E.ts — C-12 „Koniec bitwy" (Design TW v5, klatka 5).
 * Karta Zwycięstwo (złota, laur) / Porażka (czerwona, złamane miecze); 3 kafle
 * statystyk; CTA: Powrót na mapę (primary) + Rozegraj ponownie + Szczegóły
 * bitwy (outline); stopka-hint.
 */
import {
  BATTLE_ENEMY_TEXT,
  BATTLE_FONT,
  BATTLE_FONT_TITLE,
  BATTLE_GOLD,
  BATTLE_PLAYER_TEXT,
  BATTLE_TEXT_DIM,
  CMD_SVG,
  FMT_SVG,
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
  /** Strona gracza — do poprawnego „Twoje straty" vs „Straty wroga". Domyślnie atk. */
  playerSide?: 'atk' | 'def';
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

function resizeSvg(svg: string, px: number): string {
  return svg.replace(/width="\d+"/, `width="${px}"`).replace(/height="\d+"/, `height="${px}"`);
}

/** Laur/puchar — Zwycięstwo (1:1 wg makiety klatka 5). */
const VICTORY_ICON_SVG =
  '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">' +
  '<path d="M5 4c-1.5 6 1.5 10 7 12 5.5-2 8.5-6 7-12"/>' +
  '<path d="M5 4h14M9 19h6M12 16v3M8 21h8"/></svg>';

/** Złamane miecze — Porażka (1:1 wg makiety klatka 5). */
const DEFEAT_ICON_SVG =
  '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">' +
  '<path d="M5 4 13 12M14.5 13.5 18 17M13 15l2-2M19 4l-4.5 4.5M6 20l3.5-3.5M4 17l3 3"/></svg>';

/** Zwój mapy — CTA „Powrót na mapę". */
const MAP_ICON_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
  '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2Z"/></svg>';

/** Ikona info (kółko) — stopka-hint. */
const INFO_ICON_SVG =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
  '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/></svg>';

/** Ponad deploy-toolbar (100200) i rail (100080) — mount na document.body. */
const END_SCREEN_Z_BACK = '100500';
const END_SCREEN_Z_WRAP = '100501';

function statTileHtml(
  value: string, label: string, color: string, border: string, bg: string,
): string {
  return (
    '<div class="tnum" style="border:1px solid ' + border + ';border-radius:10px;padding:10px;' +
    'text-align:center;background:' + bg + ';">' +
    '<div style="font:700 17px ' + BATTLE_FONT + ';color:' + color + ';">' + value + '</div>' +
    '<div style="font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:' + BATTLE_TEXT_DIM + ';margin-top:2px;">' +
    label + '</div></div>'
  );
}

export function showEndScreen1E(
  _overlay: HTMLElement,
  p: EndScreen1EParams,
  cb: EndScreen1ECallbacks,
): { backdrop: HTMLDivElement; wrap: HTMLDivElement } {
  const backdrop = document.createElement('div');
  backdrop.dataset.battleEndScreen = 'backdrop';
  Object.assign(backdrop.style, {
    position: 'fixed', inset: '0', zIndex: END_SCREEN_Z_BACK,
    background: 'rgba(4,8,18,0.62)',
    backdropFilter: 'blur(3px)',
    boxShadow: 'inset 0 0 260px 110px rgba(0,0,0,0.55)',
  });
  document.body.appendChild(backdrop);

  const wrap = document.createElement('div');
  wrap.dataset.battleEndScreen = 'wrap';
  Object.assign(wrap.style, {
    position: 'fixed', inset: '0', zIndex: END_SCREEN_Z_WRAP,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: BATTLE_FONT, color: '#e8e0c8',
  });

  const won = p.playerWon;
  const winWord = won ? 'Zwycięstwo' : 'Porażka';
  const accent = won ? BATTLE_GOLD : BATTLE_ENEMY_TEXT;
  const border = won ? 'rgba(232,216,138,0.5)' : 'rgba(200,64,64,0.5)';
  const glow = won ? 'rgba(232,216,138,0.12)' : 'rgba(200,64,64,0.12)';
  const bg = won
    ? 'linear-gradient(180deg,rgba(22,28,38,0.96),rgba(8,10,16,0.97))'
    : 'linear-gradient(180deg,rgba(30,18,18,0.96),rgba(12,7,7,0.97))';
  const iconBg = won
    ? 'radial-gradient(circle at 38% 30%,#2a2416,#12100a)'
    : 'radial-gradient(circle at 38% 30%,#3a1c1c,#160a0a)';
  const iconGlow = won ? '0 0 30px rgba(232,216,138,0.4)' : '0 0 30px rgba(200,64,64,0.35)';
  const headTint = won
    ? 'radial-gradient(400px 160px at 50% 0%,rgba(232,216,138,0.14),transparent)'
    : 'radial-gradient(400px 160px at 50% 0%,rgba(200,64,64,0.16),transparent)';

  const loot = p.lootGold ?? 0;
  const playerSide = p.playerSide ?? 'atk';
  const playerStats = playerSide === 'atk' ? p.atk : p.def;
  const enemyStats = playerSide === 'atk' ? p.def : p.atk;
  const playerLost = Math.max(0, playerStats.hpMax - playerStats.hp);
  const enemyLost = Math.max(0, enemyStats.hpMax - enemyStats.hp);

  const card = document.createElement('div');
  Object.assign(card.style, {
    width: 'min(560px, 92vw)',
    borderRadius: '18px',
    border: `2px solid ${border}`,
    background: bg,
    boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 60px ${glow}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
  });

  card.innerHTML =
    `<div style="padding:30px 30px 22px;text-align:center;background:${headTint};">` +
      `<span style="display:inline-flex;width:74px;height:74px;border-radius:50%;background:${iconBg};` +
      `border:2px solid ${accent};align-items:center;justify-content:center;color:${accent};box-shadow:${iconGlow};">` +
      (won ? VICTORY_ICON_SVG : DEFEAT_ICON_SVG) + `</span>` +
      `<div style="font-family:${BATTLE_FONT_TITLE};font-size:34px;color:${accent};letter-spacing:0.06em;` +
      `margin-top:14px;text-shadow:0 0 24px ${glow.replace('0.12', '0.4')};">${winWord}</div>` +
      `<div class="tnum" style="font-size:12px;color:${BATTLE_TEXT_DIM};margin-top:5px;">${p.battleTitle}</div>` +
    `</div>` +
    `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:0 30px 20px;">` +
      statTileHtml('−' + playerLost, 'Twoje straty', BATTLE_PLAYER_TEXT, 'rgba(58,106,208,0.35)', 'rgba(58,106,208,0.07)') +
      statTileHtml('−' + enemyLost, 'Straty wroga', BATTLE_ENEMY_TEXT, 'rgba(200,64,64,0.35)', 'rgba(200,64,64,0.07)') +
      statTileHtml(
        loot > 0 ? '+' + loot : '0',
        loot > 0 ? (p.lootNote ?? 'Łupy · złoto') : 'Łupy',
        loot > 0 ? BATTLE_GOLD : BATTLE_TEXT_DIM,
        loot > 0 ? 'rgba(232,216,138,0.35)' : 'rgba(232,216,138,0.25)',
        loot > 0 ? 'rgba(232,216,138,0.06)' : 'rgba(232,216,138,0.04)',
      ) +
    `</div>` +
    `<div style="display:flex;flex-direction:column;gap:9px;padding:0 30px 22px;"></div>` +
    `<div style="padding:11px 30px;border-top:1px solid rgba(232,216,138,0.16);background:rgba(232,216,138,0.04);` +
    `display:flex;align-items:center;gap:9px;">` +
      `<span style="color:${BATTLE_GOLD};display:inline-flex;flex-shrink:0;">${INFO_ICON_SVG}</span>` +
      `<span style="font-size:11px;color:#c8b898;line-height:1.4;">` +
      `„Rozegraj ponownie": ta sama armia · pełne HP · wynik zapisze się na mapę dopiero po „Powrocie".</span>` +
    `</div>`;

  wrap.appendChild(card);
  document.body.appendChild(wrap);

  const ctaCol = card.children[2] as HTMLDivElement;

  const btnMap = document.createElement('button');
  btnMap.type = 'button';
  btnMap.innerHTML = `<span style="display:inline-flex;line-height:0;">${MAP_ICON_SVG}</span>Powrót na mapę`;
  Object.assign(btnMap.style, {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
    height: '48px', borderRadius: '9px',
    background: 'linear-gradient(180deg,#f0dc88,#b99a28)',
    border: '1px solid #6a5212', borderTopColor: '#f8eea8',
    color: '#2e2708', font: `700 13px ${BATTLE_FONT}`,
    letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 18px rgba(232,216,138,0.22)',
  });
  btnMap.onclick = () => cb.onFinish();
  ctaCol.appendChild(btnMap);

  const btnRow = document.createElement('div');
  Object.assign(btnRow.style, { display: 'flex', gap: '9px' });
  ctaCol.appendChild(btnRow);

  const mkOutlineBtn = (svg: string, label: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span style="display:inline-flex;line-height:0;">${svg}</span>${label}`;
    Object.assign(b.style, {
      flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      height: '42px', borderRadius: '9px', border: '2px solid rgba(232,216,138,0.4)',
      background: 'linear-gradient(180deg,#161c28,#0a0d14)', color: BATTLE_GOLD,
      font: `600 11px ${BATTLE_FONT}`, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
    });
    return b;
  };

  const btnReplay = mkOutlineBtn(resizeSvg(FMT_SVG.reset, 15), 'Rozegraj ponownie');
  btnReplay.onclick = () => (cb.onReplay ? cb.onReplay() : undefined);
  btnRow.appendChild(btnReplay);

  const btnDetails = mkOutlineBtn(resizeSvg(CMD_SVG.bars, 15), 'Szczegóły bitwy');
  btnDetails.onclick = () => cb.onDetails();
  btnRow.appendChild(btnDetails);

  return { backdrop, wrap };
}
