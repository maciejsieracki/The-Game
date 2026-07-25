/**
 * battleHudTheme.ts — tokeny HUD bitwy 1E (Design Grupa C).
 * v4 port 2026-07-04 · Ty = niebieski · wróg = czerwony · złoto = akcent UI.
 */

export const BATTLE_GOLD = '#e8d88a';
export const BATTLE_GOLD_DIM = 'rgba(232,216,138,0.30)';
export const BATTLE_PANEL_BG = 'linear-gradient(180deg,rgba(18,24,32,0.97),rgba(8,10,16,0.97))';
export const BATTLE_PANEL_BORDER = 'rgba(232,216,138,0.45)';
export const BATTLE_HUD_BG = 'rgba(12,18,35,0.92)';
export const BATTLE_TEXT = '#e8e0c8';
export const BATTLE_TEXT_DIM = '#8a8070';
export const BATTLE_FONT = "'Segoe UI', Tahoma, sans-serif";
export const BATTLE_FONT_TITLE = "Georgia, 'Times New Roman', serif";

/** Gracz (Ty) — decyzja Macieja 2026-07-03 */
export const BATTLE_PLAYER = '#3a6ad0';
export const BATTLE_PLAYER_TEXT = '#8fb6e0';
export const BATTLE_PLAYER_BG = 'rgba(58,106,208,0.12)';

/** Wróg */
export const BATTLE_ENEMY = '#c84040';
export const BATTLE_ENEMY_TEXT = '#e08a8a';
export const BATTLE_ENEMY_BG = 'rgba(200,64,64,0.08)';

/** Roster — kolory rodzajów (C-09) */
export const ROSTER_MOUNTED = BATTLE_PLAYER_TEXT;
export const ROSTER_MELEE = BATTLE_GOLD;
export const ROSTER_RANGED = '#c8a878';

export function rosterRowAccent(kind: 'mounted' | 'melee' | 'ranged'): string {
  if (kind === 'mounted') return ROSTER_MOUNTED;
  if (kind === 'melee') return ROSTER_MELEE;
  return ROSTER_RANGED;
}

export function applyPanel1E(el: HTMLElement, opts?: { radius?: string; padding?: string }): void {
  Object.assign(el.style, {
    background: BATTLE_PANEL_BG,
    border: `2px solid ${BATTLE_PANEL_BORDER}`,
    borderRadius: opts?.radius ?? '14px',
    padding: opts?.padding ?? '18px 22px',
    color: BATTLE_TEXT,
    fontFamily: BATTLE_FONT,
    boxShadow: '0 -6px 30px rgba(0,0,0,0.5)',
  });
}

export function applyBtnOutline(el: HTMLButtonElement): void {
  applyToolbarBtn1E(el);
}

/** Dolny toolbar deploy / walka R — klasa .tbtn z C06 v4. */
export function applyToolbarBtn1E(el: HTMLButtonElement, active = false): void {
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '46px',
    padding: '0 18px',
    borderRadius: '9px',
    border: active ? '2px solid #e8d88a' : '2px solid rgba(232,216,138,0.4)',
    background: 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: active ? '#f4e6a8' : BATTLE_GOLD,
    fontFamily: BATTLE_FONT,
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: active ? '0 0 12px rgba(232,216,138,0.35)' : 'none',
  });
}

/**
 * Dolny toolbar — przycisk WYŁĄCZNIE ikonowy 46×46 (makieta TW v5 §8: Formacja/
 * Konnica/Linie/Taktyka/Strategia/Reset). Podpis żyje w pigułce hover
 * (wrapWithHoverTooltip1E), nie w treści przycisku.
 */
export function applyToolbarIconBtn1E(el: HTMLButtonElement, active = false): void {
  Object.assign(el.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '46px',
    height: '46px',
    padding: '0',
    flexShrink: '0',
    borderRadius: '9px',
    border: active ? '2px solid #e8d88a' : '2px solid rgba(232,216,138,0.4)',
    background: 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: active ? '#f4e6a8' : BATTLE_GOLD,
    cursor: 'pointer',
    lineHeight: '0',
    boxShadow: active ? '0 0 10px rgba(232,216,138,0.3)' : 'none',
    transition: 'border-color 0.12s, box-shadow 0.12s, color 0.12s',
  });
}

const HUD_TOOLTIP_STYLE_ID = 'civ-battle-hud-tooltip-styles';

/** Wstrzykuje CSS pigułki podpisu na hover (1E) — czysty hover, bez JS. */
export function injectHudTooltipStyles(): void {
  if (document.getElementById(HUD_TOOLTIP_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = HUD_TOOLTIP_STYLE_ID;
  style.textContent = `
    .civ-hud-tip { position: relative; display: inline-flex; }
    .civ-hud-tip > .civ-hud-tip-lbl { position: absolute; opacity: 0; pointer-events: none; transition: opacity .12s; z-index: 20; }
    .civ-hud-tip:hover > .civ-hud-tip-lbl { opacity: 1; }
  `;
  document.head.appendChild(style);
}

/**
 * Owija element (zwykle ikonowy przycisk) w kontener z pigułką podpisu, widoczną
 * TYLKO na hover — mockup 1E (roster filtry / dyplomacja): tło rgba(8,10,16,.96),
 * border złoty .45, tekst złoty 9px uppercase, ~8px odstępu od wrappera.
 */
export function wrapWithHoverTooltip1E(
  el: HTMLElement,
  label: string,
  placement: 'above' | 'below' = 'above',
): HTMLSpanElement {
  injectHudTooltipStyles();
  const wrap = document.createElement('span');
  wrap.className = 'civ-hud-tip';
  const pill = document.createElement('span');
  pill.className = 'civ-hud-tip-lbl';
  pill.textContent = label;
  Object.assign(pill.style, {
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(8,10,16,0.96)',
    border: '1px solid rgba(232,216,138,0.45)',
    color: '#e8d88a',
    padding: '3px 8px',
    borderRadius: '6px',
    font: '700 9px ' + BATTLE_FONT,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 12px rgba(0,0,0,0.55)',
    whiteSpace: 'nowrap',
  });
  if (placement === 'above') pill.style.bottom = 'calc(100% + 8px)';
  else pill.style.top = 'calc(100% + 8px)';
  wrap.appendChild(el);
  wrap.appendChild(pill);
  return wrap;
}

/** Ikony przycisków głównych dolnego toolbara — 1:1 wg makiety TW v5 (klatka 3). */
export const DEPLOY_TOOLBAR_MAIN_SVG = {
  formation:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  cavalry:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M7 20c-2-2.6-3-5.6-3-8.2a8 8 0 0 1 16 0c0 2.6-1 5.6-3 8.2"/>' +
    '<path d="M8.7 8.4v.01M15.3 8.4v.01M6.7 12.2v.01M17.3 12.2v.01"/></svg>',
  lines:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M4 8h16M4 12h16M4 16h16"/></svg>',
  tactics:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  /** Kierunek natarcia (C-FLANK) -- roza wiatrow, spojna z pozostalymi ikonami paska. */
  direction:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/></svg>',
} as const;

/** Prawy rail 56px — klasa .rail-b z C06 v4. */
export function applyRailBtn1E(
  el: HTMLButtonElement,
  opts?: { danger?: boolean; active?: boolean },
): void {
  const danger = opts?.danger ?? false;
  const active = opts?.active ?? false;
  Object.assign(el.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    border: active
      ? '1px solid #e8d88a'
      : danger
        ? '1px solid rgba(200,64,64,0.5)'
        : '1px solid rgba(232,216,138,0.3)',
    background: 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: danger ? BATTLE_ENEMY_TEXT : BATTLE_GOLD,
    cursor: 'pointer',
    padding: '3px 2px 2px',
    transition: 'filter 0.15s, border-color 0.15s, box-shadow 0.15s',
    boxShadow: active ? '0 0 12px rgba(232,216,138,0.4)' : '0 1px 6px rgba(0,0,0,0.45)',
    flexShrink: '0',
    fontFamily: BATTLE_FONT,
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.04em',
  });
}

/**
 * Kontener dolnego toolbara deploy/walka — ~70% + blur wg makiety TW v5 (§1/§8:
 * `rgba(20,26,38,.72)/rgba(8,10,16,.74)` + `blur(7px)`, teren widoczny pod HUD-em).
 */
export function applyDeployToolbarBar(el: HTMLElement): void {
  Object.assign(el.style, {
    background: 'linear-gradient(180deg,rgba(20,26,38,0.72),rgba(8,10,16,0.74))',
    backdropFilter: 'blur(7px)',
    border: '2px solid rgba(232,216,138,0.4)',
    borderRadius: '14px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.55)',
    fontFamily: BATTLE_FONT,
    padding: '12px 16px',
  });
}

/**
 * Popup dropdown dolnego toolbara (Formacja/Konnica/Linie/Taktyka/Strategia) —
 * ~80% + blur (mniej przezroczysty niż panele-ramy, bo to overlay NAD toolbarem
 * wymagający czytelności treści; wciąż zgodny z duchem §1: teren delikatnie
 * prześwituje). Zastępuje dawne pełne krycie `.98/.98` bez blur.
 */
export function applyDeployDropdownPanel1E(el: HTMLElement): void {
  Object.assign(el.style, {
    background: 'linear-gradient(180deg,rgba(32,26,14,0.85),rgba(18,14,8,0.88))',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${BATTLE_GOLD_DIM}`,
    borderRadius: '8px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
  });
}

/**
 * Lewy panel rosteru (C09 v4 / TW v5 §1): `.8/.86` + `blur(9px)` — bardziej
 * kryjący niż inne panele (roster czytany często), ale teren wciąż lekko
 * prześwituje pod HUD-em, zgodnie z makietą.
 */
export function applyRosterPanel1E(el: HTMLElement): void {
  Object.assign(el.style, {
    background: 'linear-gradient(180deg,rgba(18,24,32,0.8),rgba(8,10,16,0.86))',
    backdropFilter: 'blur(9px)',
    border: '2px solid rgba(232,216,138,0.4)',
    borderRadius: '12px',
    boxShadow: '0 12px 34px rgba(0,0,0,0.65)',
    fontFamily: BATTLE_FONT,
    color: BATTLE_TEXT,
  });
}

/** Minimapa lewy dół (C06 v4). */
export function applyMinimap1E(el: HTMLElement): void {
  Object.assign(el.style, {
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#0a0f16',
    border: '3px solid #6a5212',
    boxShadow: 'inset 0 0 0 2px rgba(232,216,138,0.3),0 6px 16px rgba(0,0,0,0.6)',
  });
}

/** Górny pasek fazy — ~70% + blur wg makiety TW v5 (§1/§2: `.72/.76` + `blur(7px)`). */
export function applyTopBar1E(el: HTMLElement): void {
  Object.assign(el.style, {
    background: 'linear-gradient(180deg,rgba(22,28,40,0.72),rgba(8,10,16,0.76))',
    backdropFilter: 'blur(7px)',
    border: '1px solid rgba(232,216,138,0.3)',
    borderRadius: '12px',
    boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
    fontFamily: BATTLE_FONT,
  });
}

/**
 * Panel dowódców górnego paska v5 (DESIGN-do-UI_POLE-BITWY-TW-v5 §2): portrety
 * Ty/Wróg + zegar bitwy + pasek przewagi. Tło ~70% + blur (panele nowych
 * elementów wg makiety, §1/§3 zlecenia).
 */
export function applyCommanderPanel1E(el: HTMLElement): void {
  Object.assign(el.style, {
    borderRadius: '16px',
    background: 'linear-gradient(180deg,rgba(24,30,42,0.76),rgba(8,10,16,0.82))',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(232,216,138,0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.6),inset 0 1px 0 rgba(232,216,138,0.14)',
    fontFamily: BATTLE_FONT,
  });
}

/** Pierścień HP wokół medalionu dowódcy (SVG stroke, dashoffset = ubytek). */
export function commanderPortraitRingSvg(ringPct: number): string {
  const r = 24;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, ringPct));
  const dashOffset = (c * (1 - pct)).toFixed(1);
  const color = pct < 0.35 ? BATTLE_ENEMY : '#4caf50';
  return (
    '<svg width="52" height="52" viewBox="0 0 52 52" style="position:absolute;inset:0">' +
    '<circle cx="26" cy="26" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>' +
    '<circle cx="26" cy="26" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="3" ' +
    'stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + dashOffset + '" ' +
    'transform="rotate(-90 26 26)"/></svg>'
  );
}

/**
 * Outer panel „Tempo + minimapa" (prawy dół, jeden panel — §3 zlecenia).
 * Zawiera rząd Tempo (pauza/prędkość/AUTO) NAD samą minimapą.
 */
export function applyTempoMinimapOuterPanel1E(el: HTMLElement): void {
  Object.assign(el.style, {
    borderRadius: '14px',
    overflow: 'hidden',
    border: '2px solid rgba(232,216,138,0.4)',
    background: 'linear-gradient(180deg,rgba(20,26,38,0.72),rgba(8,10,16,0.75))',
    backdropFilter: 'blur(7px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
    fontFamily: BATTLE_FONT,
  });
}

/** Rząd „Tempo" nad minimapą — separator dolny. */
export function applyTempoRow1E(el: HTMLElement): void {
  Object.assign(el.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    borderBottom: '1px solid rgba(232,216,138,0.2)',
  });
}

/** Mały przycisk tempa (pauza / ×1 / ×2 / ×3 / AUTO) — 26×26 (§3). */
export function applyTempoBtn1E(el: HTMLButtonElement, opts?: { active?: boolean; auto?: boolean }): void {
  const active = opts?.active ?? false;
  const auto = opts?.auto ?? false;
  Object.assign(el.style, {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    border: active ? '1px solid #e8d88a' : '1px solid rgba(232,216,138,0.3)',
    background: active
      ? (auto ? 'linear-gradient(180deg,#f0dc88,#b99a28)' : 'linear-gradient(180deg,#2a2410,#161206)')
      : 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: active ? (auto ? '#2e2708' : '#f4e6a8') : BATTLE_GOLD,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    boxShadow: active ? (auto ? '0 0 10px rgba(232,216,138,0.5)' : '0 0 8px rgba(232,216,138,0.35)') : 'none',
  });
}

/** Ikony 13px dla rzędu Tempo (pauza / odtwórz ×1/×2/×3 / auto-rozegranie). */
export const TEMPO_SVG = {
  pause: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 5v14M16 5v14"/></svg>',
  play1: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg>',
  play2: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5v14l7-7ZM13 5v14l7-7Z"/></svg>',
  play3: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 5v14l6-7ZM9 5v14l6-7ZM16 5v14l6-7Z"/></svg>',
  auto: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4.5 5 14 14.5M19.5 5 10 14.5M9.5 15 6.5 18M14.5 15 17.5 18"/></svg>',
} as const;

/** Okrągła ikona typu na karcie rosteru (C09 v4). */
export function applyUnitCardIconCircle(
  el: HTMLElement,
  kind: 'mounted' | 'melee' | 'ranged',
): void {
  const borderClr = kind === 'mounted'
    ? BATTLE_PLAYER
    : kind === 'ranged'
      ? '#c8b478'
      : '#a08030';
  const iconClr = kind === 'mounted'
    ? BATTLE_PLAYER_TEXT
    : kind === 'ranged'
      ? '#d8c8a0'
      : BATTLE_GOLD;
  Object.assign(el.style, {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 38% 30%,#2a2416,#12100a)',
    border: `1px solid ${borderClr}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: iconClr,
    flexShrink: '0',
    lineHeight: '0',
  });
}

export function applyBtnPrimary(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'linear-gradient(180deg,#f0dc88,#b99a28)',
    border: '1px solid #6a5212',
    borderTopColor: '#f8eea8',
    color: '#2e2708',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '16px 32px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: BATTLE_FONT,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4),0 6px 18px rgba(232,216,138,0.22)',
  });
}

/** Tło centralnego panelu deploy (C06 v3 — ciepły brąz 1E). */
export const DEPLOY_CENTRAL_BG = 'linear-gradient(180deg,rgba(24,20,12,.97),rgba(12,10,6,.97))';

export function applyDeployCentralPanel(el: HTMLElement): void {
  Object.assign(el.style, {
    background: DEPLOY_CENTRAL_BG,
    border: `2px solid ${BATTLE_PANEL_BORDER}`,
    borderRadius: '14px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
    color: BATTLE_TEXT,
    fontFamily: BATTLE_FONT,
  });
}

export function applyBtnStartBattle(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    flex: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    padding: '11px 18px',
    border: '1px solid #6a1818',
    borderTopColor: '#e07070',
    borderRadius: '8px',
    background: 'linear-gradient(180deg,#d05050,#8a2424)',
    color: '#fff0e8',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: BATTLE_FONT,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
  });
}

export function applyBtnGroupGold(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '11px 18px',
    border: '1px solid #6a5212',
    borderRadius: '8px',
    background: 'linear-gradient(180deg,#2a2410,#1a1608)',
    color: BATTLE_GOLD,
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: BATTLE_FONT,
  });
}

/** Styl karty rosteru — C09 v4 (gradient + obwódka niebieska gdy zaznaczona). */
export function rosterCardBaseStyle(_kind: 'mounted' | 'melee' | 'ranged', selected: boolean): Record<string, string> {
  const base = {
    background: 'linear-gradient(180deg,rgba(24,30,40,.96),rgba(10,13,20,.96))',
    border: '1px solid rgba(232,216,138,0.22)',
    boxShadow: 'none',
  };
  if (selected) {
    return {
      background: base.background,
      border: `2px solid ${BATTLE_PLAYER}`,
      boxShadow: '0 0 10px rgba(58,106,208,0.5)',
    };
  }
  return base;
}

export function applySelectedUnitCard(
  card: HTMLElement,
  selected: boolean,
  kind: 'mounted' | 'melee' | 'ranged' = 'mounted',
): void {
  Object.assign(card.style, rosterCardBaseStyle(kind, selected));
}

/** Mały diament SVG — przycisk Grupuj (C09 v4, zero unicode ◆). */
export const DIAMOND_SVG =
  '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 3 21 12 12 21 3 12Z"/></svg>';

/** Etykieta przycisku Grupuj z diamentem SVG. */
export function groupBtnLabelHtml(text = 'Grupuj'): string {
  return DIAMOND_SVG + '<span>' + text + '</span>';
}

/** Kolory nieaktywnych chipów filtrów per typ (C09 v4). */
export const FILTER_CHIP_KIND: Record<'mounted' | 'melee' | 'ranged' | 'all' | 'group', { color: string; border: string }> = {
  mounted: { color: BATTLE_PLAYER_TEXT, border: 'rgba(58,106,208,0.5)' },
  melee: { color: '#e8d0a8', border: 'rgba(232,216,138,0.4)' },
  ranged: { color: '#d8c8a0', border: 'rgba(200,180,120,0.4)' },
  all: { color: '#c8b898', border: 'rgba(232,216,138,0.3)' },
  group: { color: '#c8b898', border: 'rgba(232,216,138,0.3)' },
};

/** Chip filtra rosteru — aktywny = złoto 1E (C09 v4). */
export function applyFilterChip1E(
  el: HTMLButtonElement,
  active: boolean,
  kind: 'mounted' | 'melee' | 'ranged' | 'all' | 'group' = 'all',
): void {
  const k = FILTER_CHIP_KIND[kind];
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: BATTLE_FONT,
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    borderRadius: '12px',
    padding: '4px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: active ? 'none' : `1px solid ${k.border}`,
    background: active ? BATTLE_GOLD : 'transparent',
    color: active ? '#2e2708' : k.color,
  });
}

/**
 * Chip-ikona filtra klasy (Konnica/Piechota/Dystansowe) — kwadrat ~32px, BEZ
 * tekstu (nazwa tylko w pigułce hover, patrz wrapWithHoverTooltip1E). Aktywny =
 * złota obwódka + delikatne złote wypełnienie, jak dotychczasowy pełny chip
 * (C09 v5 · uwaga właściciela: filtry klas mają być ikonami, nie napisami).
 */
/** „Wszystkie" — cztery kropki w kwadracie, 1:1 z makiety C06 Pole bitwy odswiezenie (1E). */
export const FILTER_ALL_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<circle cx="7" cy="7" r="2.1"/><circle cx="17" cy="7" r="2.1"/>' +
  '<circle cx="7" cy="17" r="2.1"/><circle cx="17" cy="17" r="2.1"/></svg>';

/** „Generał" — równa gwiazdka z eksportu Design (eksport/icons/tier4/chip-star-24.svg). */
export const FILTER_GENERAL_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3 14.6 9.3 21 9.8 16.1 14 17.6 21 12 17.3 6.4 21 7.9 14 3 9.8 9.4 9.3Z"/></svg>';

/** Ikony filtrów klas — 1:1 z rzędu filtrów makiety C06 Pole bitwy odswiezenie (1E). */
export const FILTER_KIND_SVG: Record<'mounted' | 'melee' | 'ranged', string> = {
  mounted:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M7 20c-2-2.6-3-5.6-3-8.2a8 8 0 0 1 16 0c0 2.6-1 5.6-3 8.2"/>' +
    '<path d="M8.7 8.4v.01M15.3 8.4v.01M6.7 12.2v.01M17.3 12.2v.01"/></svg>',
  melee:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  // Dystansowe: tarcza strzelnicza z eksportu Design (eksport/icons/units/class-ranged.svg) — decyzja Macieja.
  ranged:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="16" cy="15" r="6"/><circle cx="16" cy="15" r="2.3"/>' +
    '<path d="M-1 2 Q13 5 16 15" stroke-dasharray="0.1 3"/>' +
    '<circle cx="16" cy="15" r="0.9" fill="currentColor" stroke="none"/></svg>',
};

/** Palety obwódek/kolorów filtrów — 1:1 z makiety C06. */
const FILTER_ICON_PALETTE: Record<'mounted' | 'melee' | 'ranged' | 'all' | 'group', { border: string; color: string }> = {
  mounted: { border: 'rgba(58,106,208,.5)', color: '#8fb6e0' },
  melee: { border: 'rgba(232,216,138,.4)', color: '#e8d0a8' },
  ranged: { border: 'rgba(200,180,120,.4)', color: '#d8c8a0' },
  all: { border: 'rgba(232,216,138,.35)', color: '#e8d88a' },
  group: { border: 'rgba(232,216,138,.35)', color: '#e8d88a' },
};

export function applyFilterIconChip1E(
  el: HTMLButtonElement,
  active: boolean,
  kind: 'mounted' | 'melee' | 'ranged' | 'all' | 'group',
): void {
  const k = FILTER_ICON_PALETTE[kind];
  // 1:1 z makietą C06: aktywny = pełne złoto + ciemna ikona; nieaktywny = gradient granatowy.
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    padding: '0',
    flexShrink: '0',
    borderRadius: '9px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    lineHeight: '0',
    border: active ? 'none' : `1px solid ${k.border}`,
    background: active ? '#e8d88a' : 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: active ? '#2e2708' : k.color,
    boxShadow: active ? '0 0 8px rgba(232,216,138,0.35)' : 'none',
    transition: 'border-color 0.12s, box-shadow 0.12s, color 0.12s, background 0.12s',
  });
}

/** Przycisk akcji zaznaczenia — Odznacz / Rozgrupuj (outline) lub Grupuj (złoty). */
export function applySelectionActionBtn1E(
  el: HTMLButtonElement,
  gold = false,
  disabled = false,
): void {
  Object.assign(el.style, {
    flex: '1',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '6px 0',
    borderRadius: '7px',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: BATTLE_FONT,
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    border: gold ? 'none' : `1px solid rgba(232,216,138,0.3)`,
    background: gold ? BATTLE_GOLD : 'transparent',
    color: gold ? '#2e2708' : '#c8b898',
    opacity: disabled ? '0.42' : '1',
    pointerEvents: 'auto',
  });
  el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
}

/** Pasek Odznacz / Grupuj / Rozgrupuj (C09 v4). */
export function applyRosterActionBar1E(el: HTMLElement): void {
  applyRosterChromeRow1E(el);
}

/** Wiersz filtrów / grup / akcji — nad scrollem rosteru (klik musi trafiać w chipy). */
export function applyRosterChromeRow1E(el: HTMLElement): void {
  Object.assign(el.style, {
    display: 'flex',
    gap: '6px',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(232,216,138,0.14)',
    flexShrink: '0',
    position: 'relative',
    zIndex: '5',
    background: 'linear-gradient(180deg,rgba(18,24,32,.99),rgba(12,16,22,.99))',
    pointerEvents: 'auto',
  });
}

/** Dolna belka „zarządzaj grupą” — nad toolbarem Formacja/Taktyka (deploy). */
export function applyDeployGroupManagerRail1E(el: HTMLElement): void {
  Object.assign(el.style, {
    position: 'fixed',
    right: '88px',
    bottom: '0',
    minHeight: '44px',
    display: 'none',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 14px',
    boxSizing: 'border-box',
    zIndex: '100195',
    pointerEvents: 'auto',
    borderTop: '2px solid rgba(232,216,138,0.45)',
    borderBottom: '1px solid rgba(232,216,138,0.12)',
    background: 'linear-gradient(180deg,rgba(28,32,42,.98),rgba(12,16,24,.99))',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.55)',
    fontFamily: BATTLE_FONT,
  });
}

/** Pasek wyboru grupy do zarządzania (formacja / taktyka) — C09 deploy. */
export function applyDeployGroupManagerBar1E(el: HTMLElement): void {
  Object.assign(el.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '6px',
    padding: '10px 12px',
    borderBottom: '2px solid rgba(232,216,138,0.32)',
    borderTop: '1px solid rgba(232,216,138,0.12)',
    background: 'linear-gradient(180deg,rgba(232,216,138,0.12),rgba(14,18,26,.99))',
    flexShrink: '0',
    position: 'relative',
    zIndex: '6',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  });
}

/** Zakładka grupy na pasku zarządzania (szersza niż chip filtra). */
export function applyDeployGroupTab1E(el: HTMLButtonElement, active: boolean): void {
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '78px',
    padding: '7px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    flexShrink: '0',
    whiteSpace: 'nowrap',
    fontFamily: BATTLE_FONT,
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    border: active ? `2px solid ${BATTLE_GOLD}` : '1px solid rgba(232,216,138,0.35)',
    background: active
      ? 'linear-gradient(180deg,#f0dc88,#c9a830)'
      : 'linear-gradient(180deg,rgba(28,34,44,.95),rgba(12,16,22,.98))',
    color: active ? '#2e2708' : '#e8d88a',
    boxShadow: active
      ? '0 0 14px rgba(232,216,138,0.45), inset 0 1px 0 rgba(255,255,255,0.35)'
      : 'inset 0 1px 0 rgba(255,255,255,0.06)',
  });
}

/** Stopka rosteru — status zaznaczenia (C09 v4). */
export function applyRosterFooter1E(el: HTMLElement): void {
  Object.assign(el.style, {
    padding: '9px 12px',
    borderTop: '1px solid rgba(232,216,138,0.16)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '10px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: BATTLE_TEXT_DIM,
    flexShrink: '0',
    fontFamily: BATTLE_FONT,
  });
}

/** Dyskretny hint trybu (SPACJA / AUTO) — C06 v4. */
export function applyModeHint1E(el: HTMLElement): void {
  Object.assign(el.style, {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: '96px',
    zIndex: '100040',
    fontSize: '11px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: BATTLE_TEXT_DIM,
    border: '1px solid rgba(232,216,138,0.2)',
    borderRadius: '20px',
    padding: '7px 18px',
    background: 'rgba(20,26,38,0.85)',
    pointerEvents: 'none',
    fontFamily: BATTLE_FONT,
    whiteSpace: 'nowrap',
  });
}

/** Nagłówek sekcji rosteru (C09 v4). */
export function applyRosterHeaderSection1E(el: HTMLElement): void {
  Object.assign(el.style, {
    padding: '10px 12px',
    borderBottom: '1px solid rgba(232,216,138,0.2)',
    background: 'linear-gradient(90deg,rgba(232,216,138,0.08),transparent)',
    fontFamily: BATTLE_FONT,
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: BATTLE_GOLD,
    flexShrink: '0',
  });
}

/** Pasek filtrów / akcji w rosterze (C09 v4). */
export function applyRosterFilterBar1E(el: HTMLElement): void {
  applyRosterChromeRow1E(el);
  el.style.flexWrap = 'wrap';
  el.style.gap = '5px';
  el.style.padding = '10px 12px';
}

/** Styl badge grupy na karcie (okrągły, C09 v4). */
export function applyGroupBadge1E(el: HTMLElement): void {
  Object.assign(el.style, {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: BATTLE_GOLD,
    color: '#2e2708',
    fontSize: '9px',
    fontWeight: '700',
    lineHeight: '16px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '2',
    fontFamily: BATTLE_FONT,
  });
}

/** Pasek HP/morale na karcie rosteru (4px, C09 v4). */
export function mkRosterBarTrack(fillPct: number, gradient: string): HTMLDivElement {
  const track = document.createElement('div');
  Object.assign(track.style, {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    flexShrink: '0',
  });
  const fill = document.createElement('div');
  Object.assign(fill.style, {
    width: Math.max(0, Math.min(100, fillPct)).toFixed(0) + '%',
    height: '100%',
    background: gradient,
    transition: 'width 0.2s',
  });
  track.appendChild(fill);
  (track as HTMLDivElement & { _fill?: HTMLDivElement })._fill = fill;
  return track;
}

/** SVG formacji deploy (handoff v5 · GAP-03 kanon). */
export const FMT_SVG = {
  f1:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="16" cy="15" r="6"/><circle cx="16" cy="15" r="2.3"/>' +
    '<path d="M-1 2 Q13 5 16 15" stroke-dasharray="0.1 3"/>' +
    '<circle cx="16" cy="15" r="0.9" fill="currentColor" stroke="none"/></svg>',
  f2:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  f3:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M3 18h14l-3-9H6ZM6 9 5 5h4"/>' +
    '<circle cx="7" cy="20" r="2"/><circle cx="14" cy="20" r="2"/></svg>',
  /** Hełm konnicy — przycisk toolbara Deploy (handoff v5 · GAP-04). */
  cavHelm:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<g transform="rotate(180 12 12)">' +
    '<path d="M7 20c-2-2.6-3-5.6-3-8.2a8 8 0 0 1 16 0c0 2.6-1 5.6-3 8.2M6.6 20.2 6 21.4M17.4 20.2 18 21.4M8.7 8.4v.01M15.3 8.4v.01M6.7 12.2v.01M17.3 12.2v.01"/>' +
    '</g></svg>',
  /** Konnica Z boku — oskrzydlenie (handoff Deploy v5 · GAP-04). */
  cavFlanks:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M7 4v7a5 5 0 0 0 5 5h5"/><path d="M13 11.5 17.5 16 13 20.5"/></svg>',
  /** Konnica Z tyłu — okrążenie (handoff Deploy v5 · GAP-04). */
  cavRear:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="13" r="2.2" fill="currentColor" stroke="none"/>' +
    '<path d="M12 4a9 9 0 1 0 8.5 6.2"/><path d="M12 4 8.6 5.4M12 4l1.3 3.4"/></svg>',
  /** Kierunek natarcia FRONT — uderzenie czolowe (C-FLANK, styl spojny z cavFlanks/cavRear). */
  dirFront:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 12h13M12 6l5 6-5 6"/></svg>',
  reset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12a8 8 0 1 1 2.3 5.6"/><path d="M4 12V8M4 12h4"/></svg>',
  group: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="8" r="2.4"/><circle cx="15" cy="8" r="2.4"/><path d="M3 17c0-2.5 1.8-4 4-4M9 17c0-2.5 1.8-4 4-4s4 1.5 4 4"/></svg>',
  start: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
} as const;

/** SVG dolnego paska komend (C-09, 24px). */
export const CMD_SVG = {
  pause: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 5v14M16 5v14"/></svg>',
  speed: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m5 12 7-7v4h7v6h-7v4Z"/></svg>',
  manual: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 12h4l2 5 4-14 2 5h4"/></svg>',
  hold: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 6v12M16 6v12"/></svg>',
  retreat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  bars: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V10M10 20V4M16 20v-6M22 20V8"/></svg>',
  sound: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 9H5v6h3l5 4V5Z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>',
  music: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  skip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m5 5 7 7-7 7M13 5l7 7-7 7"/></svg>',
  exit: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6 6 18M6 6l12 12"/></svg>',
} as const;

/** Ikony typu jednostki — mockup POLE-BITWY v4.1 komplet (podkowa / skrzyż. miecze / łuk). */
export const ROSTER_TYPE_SVG = {
  mounted:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M7 20c-2-2.6-3-5.6-3-8.2a8 8 0 0 1 16 0c0 2.6-1 5.6-3 8.2"/>' +
    '<path d="M6.6 20.2 6 21.4M17.4 20.2 18 21.4"/>' +
    '<path d="M8.7 8.4v.01M15.3 8.4v.01M6.7 12.2v.01M17.3 12.2v.01"/></svg>',
  melee:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4.5 5 14 14.5M14.5 15 17.5 18M19.5 5 10 14.5M9.5 15 6.5 18"/></svg>',
  ranged:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M5 5c8 1 13 6 14 14M5 5v4M5 5h4M6 18 18 6"/></svg>',
} as const;

/** Skład armii: ikony typów + liczby (bez liter K/P/Ł — i18n-safe). */
export function rosterTypeCountsHtml(
  counts: { mounted: number; melee: number; ranged: number },
  opts?: { large?: boolean },
): string {
  const iconPx = opts?.large ? 18 : 14;
  const fontSize = opts?.large ? '12px' : '10px';
  const svgFor = (kind: 'mounted' | 'melee' | 'ranged'): string =>
    ROSTER_TYPE_SVG[kind]
      .replace(/width="14"/g, `width="${iconPx}"`)
      .replace(/height="14"/g, `height="${iconPx}"`);
  const mk = (kind: 'mounted' | 'melee' | 'ranged', n: number): string => {
    const color = rosterRowAccent(kind);
    return (
      '<span style="display:inline-flex;align-items:center;gap:4px;color:' + color + ';" title="' + n + '">' +
      '<span style="display:inline-flex;line-height:0;color:' + color + ';">' + svgFor(kind) + '</span>' +
      '<span style="font-weight:bold;min-width:1ch;font-size:' + fontSize + ';">' + n + '</span></span>'
    );
  };
  const sepGap = opts?.large ? '6px' : '4px';
  const sep = '<span style="opacity:0.35;margin:0 ' + sepGap + ';">·</span>';
  const chipGap = opts?.large ? '5px' : '3px';
  return (
    '<span style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:' + chipGap + ';font-size:' + fontSize + ';line-height:1.4;">' +
    mk('mounted', counts.mounted) + sep +
    mk('melee', counts.melee) + sep +
    mk('ranged', counts.ranged) +
    '</span>'
  );
}

/** Górny pasek — skład scalony z Ty/Wróg (mockup C06 Deployment v4.1 komplet). */
export function topBarRosterCountsHtml(
  counts: { mounted: number; melee: number; ranged: number },
  opts?: { mirror?: boolean },
): string {
  const total = counts.mounted + counts.melee + counts.ranged;
  const iconPx = 14;
  const chipColor = '#c8b898';
  const svgFor = (kind: 'mounted' | 'melee' | 'ranged'): string =>
    ROSTER_TYPE_SVG[kind]
      .replace(/width="14"/g, `width="${iconPx}"`)
      .replace(/height="14"/g, `height="${iconPx}"`)
      .replace(/stroke-width="1.5"/g, 'stroke-width="1.4"');
  const mk = (kind: 'mounted' | 'melee' | 'ranged', n: number): string =>
    '<span style="display:inline-flex;align-items:center;gap:4px;color:' + chipColor + ';">' +
    '<span style="display:inline-flex;line-height:0;">' + svgFor(kind) + '</span>' +
    '<span style="font-weight:400;">' + n + '</span></span>';
  const sep = '<span style="opacity:0.35;">·</span>';
  const sum =
    '<b style="color:#e8d88a;font-size:15px;font-weight:700;">' + total + '</b>';
  const chips =
    mk('mounted', counts.mounted) + sep +
    mk('melee', counts.melee) + sep +
    mk('ranged', counts.ranged);
  const body = opts?.mirror
    ? sum + sep + mk('ranged', counts.ranged) + sep + mk('melee', counts.melee) + sep + mk('mounted', counts.mounted)
    : chips + sep + sum;
  return (
    '<span style="display:inline-flex;align-items:center;gap:6px;color:' + chipColor + ';font-weight:400;white-space:nowrap;">' +
    body +
    '</span>'
  );
}

/** Etykiety typów w deploy / strategii (sync z jednostki-infografiki 1E). */
export const DEPLOY_KIND_LABEL = {
  mounted: 'Konnica',
  melee: 'Piechota',
  ranged: 'Dystansowe',
} as const;

export const DEPLOY_POPUP_INACTIVE_BORDER = 'rgba(232,216,138,0.2)';
export const DEPLOY_POPUP_INACTIVE_BG = 'rgba(255,255,255,0.02)';
export const DEPLOY_POPUP_ACTIVE_BG = 'rgba(232,216,138,0.08)';

/** Zaznaczona / nieaktywna opcja popupu deploy (handoff v5 · zasady wspólne). */
export function paintDeployPopupOption(btn: HTMLButtonElement, active: boolean): void {
  Object.assign(btn.style, {
    border: active ? `2px solid ${BATTLE_GOLD}` : `1px solid ${DEPLOY_POPUP_INACTIVE_BORDER}`,
    background: active ? DEPLOY_POPUP_ACTIVE_BG : DEPLOY_POPUP_INACTIVE_BG,
    color: active ? '#e8e0c8' : BATTLE_GOLD,
    fontWeight: active ? 'bold' : 'normal',
  });
}

/** Chip 34×34 wokół ikony — wiersze Formacja/Konnica (mockup v5 · decyzja Maciej B). */
export function wrapDeployPopupIconChip(iconSvg: string): string {
  return (
    '<span style="width:34px;height:34px;border-radius:8px;flex-shrink:0;' +
    'background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);' +
    'border:1px solid #a08030;display:flex;align-items:center;justify-content:center;' +
    `color:${BATTLE_GOLD};line-height:0;">${iconSvg}</span>`
  );
}

/** Wiersz popupu: chip ikony + tytuł + opcjonalny podpis (#8a8070) — mockup 1E v5. */
export function buildDeployPopupRowHtml(iconSvg: string, title: string, subtitle?: string): string {
  const sub = subtitle
    ? `<span style="font-size:11px;color:#8a8070;line-height:1.2;">${subtitle}</span>`
    : '';
  return (
    '<span style="display:flex;align-items:center;gap:12px;width:100%;">' +
    wrapDeployPopupIconChip(iconSvg) +
    '<span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;">' +
    `<span style="font-size:14px;color:#e8e0c8;">${title}</span>${sub}` +
    '</span></span>'
  );
}

/** Komórka siatki Taktyka 2×2 — ikona wyśrodkowana + etykieta (mockup GAP-06). */
export function buildDeployTacticCellHtml(iconSvg: string, title: string): string {
  return (
    '<span style="display:flex;flex-direction:column;align-items:center;width:100%;text-align:center;">' +
    `<span style="display:inline-flex;color:${BATTLE_GOLD};line-height:0;margin-bottom:6px;">${iconSvg}</span>` +
    `<span style="font-size:13px;color:#e8e0c8;">${title}</span>` +
    '</span>'
  );
}

/** Ikona celownika — sekcja Dystansowe w popupie Linie (handoff v5 · GAP-05). */
export const DEPLOY_SCOPE_SVG =
  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
  '<circle cx="13" cy="12" r="7"/><circle cx="13" cy="12" r="2.6"/>' +
  '<path d="M-2 -1 Q9 3 13 12" stroke-dasharray="0.1 3"/>' +
  '<circle cx="13" cy="12" r="1" fill="currentColor" stroke="none"/></svg>';

/** Ikony doktryn — popup Taktyka v2 (handoff v5 · GAP-06 kanon, 22×22). */
export const DEPLOY_TACTIC_SVG = {
  defensive:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M12 3 5 5.5v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9v-5Z"/></svg>',
  steady:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  aggressive:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M12 3v14M6 11l6 6 6-6M5 20h14"/></svg>',
  skirmish:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="16" cy="15" r="6"/><circle cx="16" cy="15" r="2.3"/>' +
    '<path d="M-1 2 Q13 5 16 15" stroke-dasharray="0.1 3"/>' +
    '<circle cx="16" cy="15" r="0.9" fill="currentColor" stroke="none"/></svg>',
} as const;

/** Wspólny styl pozycji popupów Formacja / Linie / Taktyka (~34 px). */
export function applyDeployPopupItem1E(btn: HTMLButtonElement): void {
  Object.assign(btn.style, {
    minHeight: '34px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  });
}

/** Ikony stron w fazie deploy: atakujacy = miecz, obroca = tarcza. */
export const DEPLOY_SIDE_SVG = {
  sword:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/>' +
    '<path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>' +
    '</svg>',
  shield:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3 5 5.5v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9v-5Z"/>' +
    '</svg>',
  crossedSwords:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/>' +
    '</svg>',
} as const;

/** Miecz = atakujacy, tarcza = obroca (Ty vs Wróg w top-barze i pasku mocy). */
export function battleSideRoleSvg(side: 'atk' | 'def'): string {
  return side === 'atk' ? DEPLOY_SIDE_SVG.sword : DEPLOY_SIDE_SVG.shield;
}

/** Pre-bitwa C-01 v3 — ikony przycisków i dowódcy. */
export const PB_SVG = {
  auto: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  manual: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/></svg>',
  retreat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  commander:
    '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  unitMounted:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 20c0-6 2-9 6-10l1-3 3 1-1 3c3 1 4 4 4 9"/></svg>',
  unitMelee:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4.5 5 14 14.5M19.5 5 10 14.5"/></svg>',
  unitRanged:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5c8 1 13 6 14 14"/><path d="M5 5v4M5 5h4"/></svg>',
  unitSiege:
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 20V9l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2v11Z"/><path d="M4 13h16"/></svg>',
} as const;

export function hpBarGradient(): string {
  return 'linear-gradient(90deg,#3a8a5a,#7ad0a0)';
}

export function moraleBarGradient(): string {
  return 'linear-gradient(90deg,#a08030,#e8d88a)';
}

/** Szerokość karty rosteru (px) — stała, bez ściskania. */
export const ROSTER_CARD_W = 56;
/** Odstęp między kartami rosteru (deploy + walka). */
export const ROSTER_CARD_GAP = 4;
/** Maks. liczba rzędów kart w pasku (Total War — wyśrodkowany, rośnie na boki). */
export const ROSTER_MAX_ROWS = 2;

/** Maks. kolumn kart w pionowym panelu bocznym (worek żetonów). */
export const ROSTER_MAX_COLS = 6;

/** @deprecated Skala wg rzędów wyłączona — scroll zamiast kurczenia. */
export const ROSTER_MAX_VISIBLE_ROWS = 5;

/** Prawa rezerwa panelu rosteru (% szerokości docka). */
export const ROSTER_PANEL_EDGE_RESERVE = 0;

/** Miejsce na pasek przewijania pionowego (px) — margines siatki od scrollbara. */
export const ROSTER_SCROLLBAR_RESERVE = 14;

export interface RosterGridMetrics {
  cols: number;
  rows: number;
  scale: number;
  cardW: number;
  cardH: number;
  gap: number;
  gridW: number;
  visibleH: number;
  contentH: number;
  needsScroll: boolean;
}

/** Skala karty wg liczby rzędów — tylko gdy przekroczono max widocznych rzędów. */
export function rosterScaleForRows(rows: number, maxVisibleRows = ROSTER_MAX_VISIBLE_ROWS): number {
  if (rows <= maxVisibleRows) return 1;
  return maxVisibleRows / rows;
}

/** Zawsze maxCols (6) — stała siatka, puste sloty w ostatnim rzędzie OK. */
export function rosterColsForCount(
  unitCount: number,
  maxCols = ROSTER_MAX_COLS,
): number {
  return unitCount > 0 ? maxCols : 1;
}

/** Szerokość siatki N kolumn przy skali 1 (px). */
export function rosterBaseGridWidth(
  maxCols = ROSTER_MAX_COLS,
  cardW = ROSTER_CARD_W,
  gap = ROSTER_CARD_GAP,
): number {
  return maxCols * cardW + Math.max(0, maxCols - 1) * gap;
}

/** Stała szerokość panelu rosteru — nie zmienia się w trakcie gry (6 chipów w rzędzie). */
export function rosterFixedPanelWidth(hPad = 12): number {
  return rosterPanelWidth(rosterBaseGridWidth(), hPad);
}

/** Eksport stałej szerokości docka (deploy + walka ręczna). */
export const ROSTER_PANEL_FIXED_W = rosterFixedPanelWidth(12);

/**
 * Metryki siatki rosteru: zawsze 6 kolumn, wypełnienie szerokości panelu.
 * W pionie: tyle rzędów ile wynika z liczby jednostek; overflow = scroll rodzica.
 */
export function computeRosterGridMetrics(
  unitCount: number,
  baseCardW: number,
  baseCardH: number,
  maxCols = ROSTER_MAX_COLS,
  availH = 0,
  availW = 0,
): RosterGridMetrics {
  const cols = rosterColsForCount(unitCount, maxCols);
  const rows = unitCount > 0 ? Math.max(1, Math.ceil(unitCount / cols)) : 1;
  const aspect = baseCardH / baseCardW;
  const gap = ROSTER_CARD_GAP;

  let cardW = baseCardW;
  if (availW > 48) {
    cardW = Math.floor((availW - (cols - 1) * gap) / cols);
    cardW = Math.max(24, cardW);
  }
  const cardH = Math.max(24, Math.round(cardW * aspect));
  const scale = cardW / baseCardW;
  const gridW = cols * cardW + Math.max(0, cols - 1) * gap;
  const contentH = rows * cardH + Math.max(0, rows - 1) * gap;

  return {
    cols,
    rows,
    scale,
    cardW,
    cardH,
    gap,
    gridW,
    visibleH: contentH,
    contentH,
    needsScroll: availH > 48 && contentH > availH,
  };
}

/** Szerokość docka: siatka + 20% rezerwy prawej (bez dublowania scrollbara). */
export function rosterPanelWidth(gridW: number, hPad = 16): number {
  const inner = gridW / (1 - ROSTER_PANEL_EDGE_RESERVE);
  return Math.ceil(inner + hPad);
}

/**
 * Siatka kart rosteru — CSS grid; przewijanie tylko na rodzicu (#deploy-roster-scroll).
 */
export function applyRosterGridStyle(
  el: HTMLElement,
  metrics: RosterGridMetrics,
): void {
  Object.assign(el.style, {
    display: 'grid',
    gridTemplateColumns: `repeat(${metrics.cols}, minmax(0, 1fr))`,
    gap: `${metrics.gap}px`,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'visible',
    maxHeight: 'none',
    height: 'auto',
    minHeight: `${metrics.contentH}px`,
    padding: '0',
    alignContent: 'start',
  });
}

/**
 * Pionowy panel kart (legacy flex-wrap) — preferuj applyRosterGridStyle.
 * @deprecated
 */
export function applyVerticalRosterTrayStyle(
  el: HTMLElement,
  cardH: number,
  cardW: number,
  opts?: { gap?: number; maxCols?: number; maxWidth?: string },
): void {
  const gap = opts?.gap ?? ROSTER_CARD_GAP;
  const maxCols = opts?.maxCols ?? ROSTER_MAX_COLS;
  const colW = cardW + gap;
  Object.assign(el.style, {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    gap: `${gap}px`,
    width: '100%',
    maxWidth: opts?.maxWidth ?? `${maxCols * colW}px`,
    boxSizing: 'border-box',
    padding: '2px 0',
    overflowX: 'hidden',
  });
}

/**
 * Pasek kart jednostek — Total War (poziomy, legacy walka): wyśrodkowany, max 2 rzędy.
 * @deprecated Deploy używa applyVerticalRosterTrayStyle.
 */
export function applyTwRosterTrayStyle(
  el: HTMLElement,
  cardH: number,
  opts?: { gap?: number; maxRows?: number; flex?: string; maxWidth?: string; maxHeight?: string; rowExtra?: number },
): void {
  const gap = opts?.gap ?? ROSTER_CARD_GAP;
  const maxRows = opts?.maxRows ?? ROSTER_MAX_ROWS;
  const rowExtra = opts?.rowExtra ?? 0;
  const rowBlock = maxRows * (cardH + rowExtra) + Math.max(0, maxRows - 1) * gap;
  const maxH = opts?.maxHeight ?? `${rowBlock + 10}px`;
  Object.assign(el.style, {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap-reverse',
    justifyContent: 'center',
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    gap: `${gap}px`,
    flex: opts?.flex ?? '1 1 auto',
    width: '100%',
    maxWidth: opts?.maxWidth ?? 'min(98vw, 1480px)',
    minWidth: '0',
    overflowX: 'hidden',
    overflowY: 'hidden',
    maxHeight: maxH,
    padding: '4px 8px',
    boxSizing: 'border-box',
  });
}

/** Zakładka numeru grupy (Total War — wąski słupek przed kartami grupy). */
export function applyTwGroupTabStyle(el: HTMLElement, cardH: number): void {
  Object.assign(el.style, {
    width: '22px',
    height: `${cardH}px`,
    flex: 'none',
    flexShrink: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    background: 'linear-gradient(180deg,rgba(232,216,138,0.55),rgba(140,110,40,0.40))',
    border: `1px solid ${BATTLE_GOLD_DIM}`,
    borderRadius: '5px 0 0 5px',
    color: '#fff8dc',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: BATTLE_FONT,
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
  });
}

/** @deprecated Używaj jednego paska applyTwRosterTrayStyle — karty płasko, bez zagnieżdżonych ramek. */
export function applyTwGroupCardsRowStyle(el: HTMLElement, cardH: number): void {
  applyTwRosterTrayStyle(el, cardH, { flex: '0 1 auto', maxWidth: 'min(98vw, 1480px)' });
}

const ROSTER_SCROLLBAR_STYLE_ID = 'civ-battle-roster-scrollbar-styles';

/** Wstrzykuje globalny CSS złotego scrollbara rosteru (raz na dokument). */
export function injectBattleRosterScrollbarStyles(): void {
  if (document.getElementById(ROSTER_SCROLLBAR_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ROSTER_SCROLLBAR_STYLE_ID;
  style.textContent = `
    .civ-battle-roster-scroll {
      scrollbar-width: thin;
      scrollbar-color: rgba(232,216,138,0.55) rgba(232,216,138,0.10);
    }
    .civ-battle-roster-scroll::-webkit-scrollbar { width: 8px; }
    .civ-battle-roster-scroll::-webkit-scrollbar-track {
      background: rgba(232,216,138,0.10);
      border-radius: 4px;
    }
    .civ-battle-roster-scroll::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(232,216,138,0.70), rgba(180,140,50,0.55));
      border-radius: 4px;
      border: 1px solid rgba(232,216,138,0.35);
    }
    .civ-battle-roster-scroll::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, rgba(255,240,180,0.85), rgba(200,160,60,0.70));
    }
  `;
  document.head.appendChild(style);
}

/** Złoty pasek przewijania — lewy panel rosteru (deploy + walka). */
export function applyBattleRosterScrollbar(el: HTMLElement): void {
  injectBattleRosterScrollbarStyles();
  el.classList.add('civ-battle-roster-scroll');
}

/** Typ jednostki w priorytetach celów (popup Strategia). */
export type BattleClassKind = 'mounted' | 'ranged' | 'melee';

export function battleClassLabelPl(cls: BattleClassKind): string {
  if (cls === 'mounted') return 'Konnica';
  if (cls === 'ranged') return '\u0141ucznicy';
  return 'Piechota';
}

/** Ikona nagłówka popup Strategia (C06 v4.1). */
export const STRATEGY_HEADER_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">' +
  '<path d="M4 9 12 4.5 20 9Z"/><path d="M6.5 11h11M7.5 11v6M16.5 11v6M5.5 17h13"/></svg>';

const BATTLE_SEL_CHEVRON_DATA =
  'url("data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ' +
    'fill="none" stroke="%23e8d88a" stroke-width="1.8"><path d="M6 9l6 6 6-6"/></svg>',
  ) +
  '")';

function battleClassMedallionInnerSvg(cls: BattleClassKind, px: number): string {
  return ROSTER_TYPE_SVG[cls]
    .replace(/width="14"/g, `width="${px}"`)
    .replace(/height="14"/g, `height="${px}"`);
}

/** Mini-medalion typu (podkowa / miecze / łuk) — popup Strategia + roster. */
export function battleClassMedallionHtml(cls: BattleClassKind, px = 16): string {
  const color = rosterRowAccent(cls);
  const innerPx = Math.max(10, px - 6);
  return (
    '<span style="display:inline-flex;align-items:center;justify-content:center;' +
    `width:${px}px;height:${px}px;border-radius:50%;flex-shrink:0;` +
    `border:1.5px solid ${BATTLE_GOLD_DIM};` +
    'background:linear-gradient(180deg,rgba(32,26,14,.95),rgba(12,10,6,.98));' +
    `color:${color};line-height:0;">` +
    battleClassMedallionInnerSvg(cls, innerPx) +
    '</span>'
  );
}

/** Dropdown priorytetów `.sel1e` — mockup C06 Popup Strategia v4.1. */
export function applyBattlePrioritySelect1E(sel: HTMLSelectElement): void {
  Object.assign(sel.style, {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '100%',
    height: '34px',
    padding: '0 30px 0 12px',
    borderRadius: '8px',
    border: '1px solid rgba(232,216,138,0.4)',
    background: `linear-gradient(180deg,#161c28,#0a0d14) ${BATTLE_SEL_CHEVRON_DATA} no-repeat right 9px center`,
    color: '#e8e0c8',
    fontFamily: BATTLE_FONT,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxSizing: 'border-box',
  });
}

export function createBattlePrioritySelect1E(
  value: BattleClassKind,
  options: readonly BattleClassKind[],
  onChange: (val: BattleClassKind) => void,
): HTMLSelectElement {
  const sel = document.createElement('select');
  for (const c of options) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = battleClassLabelPl(c);
    if (c === value) opt.selected = true;
    sel.appendChild(opt);
  }
  applyBattlePrioritySelect1E(sel);
  sel.addEventListener('change', () => onChange(sel.value as BattleClassKind));
  sel.addEventListener('click', (e) => e.stopPropagation());
  sel.addEventListener('mousedown', (e) => e.stopPropagation());
  return sel;
}

/** Wiersz typu (medalion + etykieta) — mockup `.typ`. */
export function createBattleClassTypeRow(cls: BattleClassKind): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 7px',
  });
  const med = document.createElement('span');
  Object.assign(med.style, {
    width: '26px', height: '26px', borderRadius: '50%', flex: 'none',
    background: 'radial-gradient(circle at 38% 30%,#2a2416,#12100a)',
    border: '1.5px solid #a08030',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#e8d88a', lineHeight: '0',
  });
  med.innerHTML = battleClassMedallionInnerSvg(cls, 15);
  const lbl = document.createElement('span');
  lbl.textContent = battleClassLabelPl(cls);
  Object.assign(lbl.style, {
    fontFamily: BATTLE_FONT, fontWeight: '700', fontSize: '11px',
    letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8b898',
  });
  row.appendChild(med);
  row.appendChild(lbl);
  return row;
}

/** Przycisk outline — „Przywróć domyślne (armia)". */
export function applyBattleStrategyOutlineBtn(btn: HTMLButtonElement): void {
  btn.type = 'button';
  Object.assign(btn.style, {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '40px', marginTop: '12px',
    border: '2px solid rgba(232,216,138,0.4)', borderRadius: '8px',
    background: 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: BATTLE_GOLD, fontFamily: BATTLE_FONT, fontSize: '12px',
    fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', boxSizing: 'border-box',
  });
}

/** Złoty CTA — sticky „Skopiuj z priorytetów armii". */
export function applyBattleStrategyGoldCta(btn: HTMLButtonElement): void {
  btn.type = 'button';
  Object.assign(btn.style, {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: '44px',
    background: 'linear-gradient(180deg,#f0dc88,#b99a28)',
    border: '1px solid #6a5212', borderTopColor: '#f8eea8',
    color: '#2e2708', fontFamily: BATTLE_FONT, fontSize: '12px',
    fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
    borderRadius: '8px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
    cursor: 'pointer', boxSizing: 'border-box',
  });
}

/** Checkbox 1E — złoty gradient gdy zaznaczony (mockup v4.1). */
export function applyBattleCheckbox1E(input: HTMLInputElement): void {
  Object.assign(input.style, {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '18px',
    height: '18px',
    borderRadius: '5px',
    border: '1.5px solid #a08030',
    background: 'linear-gradient(180deg,#161c28,#0a0d14)',
    cursor: 'pointer',
    flexShrink: '0',
    margin: '0',
    position: 'relative',
  });

  const checkSvg =
    'url("data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" ' +
      'fill="none" stroke="%232e2708" stroke-width="2.4"><path d="M5 12.5 10 17.5 19 6.5"/></svg>',
    ) +
    '")';

  const paint = (): void => {
    if (input.checked) {
      input.style.borderColor = '#a08030';
      input.style.background =
        `linear-gradient(180deg,#f0dc88,#b99a28) ${checkSvg} center/12px no-repeat`;
      input.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)';
    } else {
      input.style.borderColor = '#a08030';
      input.style.background = 'linear-gradient(180deg,#161c28,#0a0d14)';
      input.style.boxShadow = 'none';
    }
  };
  paint();
  input.addEventListener('change', paint);
}

/** Ikona „+" wyśrodkowana w pustym slocie rosteru (C-09 v5, klatka 6). */
export const ROSTER_EMPTY_SLOT_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
  '<path d="M12 5v14M5 12h14"/></svg>';

/** Wizualny placeholder pustego slotu w siatce rosteru (6 kol) — C-09 v5 klatka 6. */
export function createRosterEmptySlotElement(cardH: number): HTMLDivElement {
  const ph = document.createElement('div');
  ph.dataset.rosterEmpty = '1';
  Object.assign(ph.style, {
    width: '100%',
    height: cardH + 'px',
    boxSizing: 'border-box',
    borderRadius: '6px',
    border: '1px dashed rgba(232,216,138,0.4)',
    background: 'rgba(255,255,255,0.03)',
    opacity: '0.4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  });
  const icon = document.createElement('span');
  icon.style.color = BATTLE_GOLD;
  icon.style.display = 'inline-flex';
  icon.style.lineHeight = '0';
  icon.innerHTML = ROSTER_EMPTY_SLOT_SVG;
  ph.appendChild(icon);
  return ph;
}

/** Ikony stanów karty rosteru (C-09 v5, klatka 6) — martwa (X) / rozbita-rout (strzałka). */
export const ROSTER_STATE_SVG = {
  dead:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
    '<path d="M18 6 6 18M6 6l12 12"/></svg>',
  routed:
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M12 3v18M5 10l7-7 7 7"/></svg>',
} as const;

/** Kolor tekstu/ikony karty MARTWEJ (C-09 v5). */
export const ROSTER_DEAD_COLOR = '#8a5a5a';

/** Bordowo-czerwony gradient paska HP przy niskim zdrowiu / rout (C-09 v5, legenda „HP nisko"). */
export const HP_BAR_LOW_GRADIENT = 'linear-gradient(90deg,#c84040,#e06060)';

// ---------------------------------------------------------------------------
// ZĘBATKA USTAWIEŃ (top-right, TW v5 §2) — zastępuje prawy rail 56px
// (Muzyka / Efekty dźwiękowe / Paski HP-Morale / Statystyki / Pomoc).
// ---------------------------------------------------------------------------

export const SETTINGS_GEAR_SVG =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">' +
  '<circle cx="12" cy="12" r="3.2"/>' +
  '<path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/></svg>';

/** Przycisk zębatki 40×40 (C06 v5 §2 — top-right). */
export function applySettingsGearBtn1E(el: HTMLButtonElement): void {
  Object.assign(el.style, {
    width: '40px',
    height: '40px',
    borderRadius: '9px',
    border: '2px solid rgba(232,216,138,0.4)',
    background: 'linear-gradient(180deg,rgba(22,28,40,0.72),rgba(8,10,16,0.74))',
    backdropFilter: 'blur(6px)',
    color: BATTLE_GOLD,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: BATTLE_FONT,
    flexShrink: '0',
  });
}

/** Panel popup ustawień, 224px, ancorowany pod zębatką (C06 v5 §2). */
export function applySettingsPopupPanel1E(el: HTMLElement): void {
  Object.assign(el.style, {
    position: 'absolute',
    top: '48px',
    right: '0',
    width: '224px',
    borderRadius: '12px',
    border: '2px solid rgba(232,216,138,0.45)',
    background: 'linear-gradient(180deg,rgba(22,28,38,0.94),rgba(8,10,16,0.96))',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    fontFamily: BATTLE_FONT,
    zIndex: '2',
  });
}

export function applySettingsPopupHeader1E(el: HTMLElement): void {
  Object.assign(el.style, {
    padding: '9px 13px',
    borderBottom: '1px solid rgba(232,216,138,0.2)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: BATTLE_GOLD,
    fontFamily: BATTLE_FONT,
  });
}

/** Redukuje width/height wpisane w string SVG do zadanego rozmiaru px. */
function resizeSvg(svg: string, px: number): string {
  return svg.replace(/width="\d+"/, `width="${px}"`).replace(/height="\d+"/, `height="${px}"`);
}

/** Wiersz-przełącznik w popupie ustawień (Muzyka / Efekty / Paski) — C06 v5 §2. */
export function createSettingsToggleRow1E(
  iconSvg: string,
  label: string,
  active: boolean,
  onToggle: () => void,
): { row: HTMLDivElement; setActive: (v: boolean) => void } {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: BATTLE_FONT,
  });
  const icon = document.createElement('span');
  icon.innerHTML = resizeSvg(iconSvg, 16);
  Object.assign(icon.style, { display: 'inline-flex', lineHeight: '0', flexShrink: '0' });
  const lbl = document.createElement('span');
  lbl.textContent = label;
  Object.assign(lbl.style, { flex: '1', fontSize: '13px' });
  const sw = document.createElement('span');
  Object.assign(sw.style, {
    width: '34px', height: '18px', borderRadius: '10px', position: 'relative', flexShrink: '0',
  });
  const knob = document.createElement('span');
  Object.assign(knob.style, {
    position: 'absolute', top: '2px', width: '14px', height: '14px', borderRadius: '50%',
  });
  sw.appendChild(knob);
  row.appendChild(icon);
  row.appendChild(lbl);
  row.appendChild(sw);
  const setActive = (v: boolean): void => {
    icon.style.color = v ? BATTLE_GOLD : '#c8b898';
    lbl.style.color = v ? '#e8e0c8' : '#c8b898';
    row.style.background = v ? 'rgba(232,216,138,0.06)' : 'transparent';
    sw.style.background = v ? BATTLE_GOLD : 'rgba(255,255,255,0.12)';
    knob.style.background = v ? '#2e2708' : '#8a8070';
    knob.style.left = v ? '' : '2px';
    knob.style.right = v ? '2px' : '';
  };
  setActive(active);
  row.addEventListener('click', onToggle);
  return { row, setActive };
}

/** Wiersz-akcja w popupie ustawień (Statystyki / Pomoc, bez przełącznika) — C06 v5 §2. */
export function createSettingsActionRow1E(
  iconSvg: string,
  label: string,
  onClick: () => void,
): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#c8b898',
    fontFamily: BATTLE_FONT,
  });
  const icon = document.createElement('span');
  icon.innerHTML = resizeSvg(iconSvg, 16);
  Object.assign(icon.style, { display: 'inline-flex', lineHeight: '0', flexShrink: '0' });
  const lbl = document.createElement('span');
  lbl.textContent = label;
  Object.assign(lbl.style, { flex: '1', fontSize: '13px' });
  row.appendChild(icon);
  row.appendChild(lbl);
  row.addEventListener('click', onClick);
  row.addEventListener('mouseenter', () => { row.style.background = 'rgba(232,216,138,0.06)'; });
  row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
  return row;
}
