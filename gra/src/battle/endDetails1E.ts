/**
 * endDetails1E.ts — C-23 „Szczegóły bitwy" (Design TW v5, klatka 4).
 * Dwie kolumny ATK/OBR: nagłówek dowódcy + sekcje Zniszczone/Rozbite (rout)/
 * Ocalałe, każda jednostka jako wiersz ikona+nazwa+HP przed→po.
 */
import {
  BATTLE_ENEMY,
  BATTLE_ENEMY_TEXT,
  BATTLE_FONT,
  BATTLE_FONT_TITLE,
  BATTLE_GOLD,
  BATTLE_PANEL_BORDER,
  BATTLE_PLAYER,
  BATTLE_PLAYER_TEXT,
  BATTLE_TEXT,
  BATTLE_TEXT_DIM,
  PB_SVG,
  ROSTER_TYPE_SVG,
  rosterRowAccent,
} from './battleHudTheme';

export type EndDetailsUnitFate = 'destroyed' | 'routed' | 'survived';
export type EndDetailsUnitKind = 'mounted' | 'melee' | 'ranged';

/** Pojedynczy oddział na liście Zniszczone/Rozbite/Ocalałe (klatka 4). */
export interface EndDetailsUnitRow {
  name: string;
  kind: EndDetailsUnitKind;
  hpBefore: number;
  hpAfter: number;
  fate: EndDetailsUnitFate;
}

export interface EndDetailsSideData {
  /** Nazwa u góry kolumny (civLabel — spójne z panelem dowódców C-06/TW v5). */
  civLabel: string;
  /** „Atakujący" / „Obrońca". */
  roleLabel: string;
  totalBefore: number;
  totalAfter: number;
  units: EndDetailsUnitRow[];
}

export interface EndDetails1EParams {
  /** Podtytuł nagłówka, np. „Tura 3 · 04:12". */
  battleSubtitle: string;
  /** np. „zwycięstwo Greków" — kolor dobierany wg playerWon. */
  resultLabel: string;
  playerWon: boolean;
  atk: EndDetailsSideData;
  def: EndDetailsSideData;
}

export interface EndDetails1ECallbacks {
  onClose: () => void;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function resizeSvg(svg: string, px: number): string {
  return svg.replace(/width="\d+"/, `width="${px}"`).replace(/height="\d+"/, `height="${px}"`);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const FATE_ORDER: readonly EndDetailsUnitFate[] = ['destroyed', 'routed', 'survived'];
const FATE_META: Record<EndDetailsUnitFate, { label: string; color: string }> = {
  destroyed: { label: 'Zniszczone', color: '#ff7b7b' },
  routed: { label: 'Rozbite (rout)', color: '#ffd54a' },
  survived: { label: 'Ocalałe', color: '#7ad0a0' },
};

function unitRowHtml(u: EndDetailsUnitRow, color: string): string {
  const iconColor = rosterRowAccent(u.kind);
  const icon = resizeSvg(ROSTER_TYPE_SVG[u.kind], 15);
  const right = u.fate === 'destroyed'
    ? u.hpBefore + ' → 0'
    : u.fate === 'routed'
      ? u.hpBefore + ' → ' + u.hpAfter + ' · uciekli'
      : u.hpBefore + ' → ' + u.hpAfter;
  const bg = hexToRgba(color, u.fate === 'destroyed' ? 0.06 : 0.05);
  const border = hexToRgba(color, u.fate === 'survived' ? 0.16 : u.fate === 'routed' ? 0.18 : 0.2);
  return (
    '<div class="tnum" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;' +
    'background:' + bg + ';border:1px solid ' + border + ';">' +
    '<span style="color:' + iconColor + ';display:inline-flex;line-height:0;flex-shrink:0;">' + icon + '</span>' +
    '<span style="flex:1;min-width:0;font-size:13px;color:' + BATTLE_TEXT + ';overflow:hidden;' +
    'text-overflow:ellipsis;white-space:nowrap;">' + esc(u.name) + '</span>' +
    '<span style="font-size:12px;color:' + color + ';white-space:nowrap;flex-shrink:0;">' + right + '</span>' +
    '</div>'
  );
}

function sectionHtml(fate: EndDetailsUnitFate, units: readonly EndDetailsUnitRow[]): string {
  const meta = FATE_META[fate];
  const rows = units.filter(u => u.fate === fate);
  const header =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
    '<span style="width:10px;height:10px;border-radius:3px;background:' + meta.color + ';flex-shrink:0;"></span>' +
    '<span style="font:700 11px ' + BATTLE_FONT + ';letter-spacing:0.14em;text-transform:uppercase;' +
    'white-space:nowrap;color:' + meta.color + ';">' + meta.label + ' · ' + rows.length + '</span>' +
    '<span style="flex:1;height:1px;background:' + hexToRgba(meta.color, 0.2) + ';"></span>' +
    '</div>';
  const body = rows.length
    ? '<div style="display:flex;flex-direction:column;gap:6px;">' + rows.map(u => unitRowHtml(u, meta.color)).join('') + '</div>'
    : '<div style="font-size:11px;color:' + BATTLE_TEXT_DIM + ';font-style:italic;padding:2px 12px;">Brak</div>';
  return '<div>' + header + body + '</div>';
}

/** Kolumna ATK/OBR: nagłówek dowódcy (medalion + civ + rola + suma ludzi) + sekcje. */
function buildSideColumn(side: 'atk' | 'def', data: EndDetailsSideData, isWinner: boolean): HTMLDivElement {
  const isAtk = side === 'atk';
  const sideColor = isAtk ? BATTLE_PLAYER : BATTLE_ENEMY;
  const sideTextColor = isAtk ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT;

  const col = document.createElement('div');
  Object.assign(col.style, {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: '0',
    borderRight: isAtk ? '1px solid rgba(232,216,138,0.18)' : 'none',
  });

  const hdr = document.createElement('div');
  Object.assign(hdr.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    borderBottom: '1px solid rgba(232,216,138,0.16)',
    flexShrink: '0',
    background: isAtk
      ? 'linear-gradient(90deg,rgba(58,106,208,0.12),transparent)'
      : 'linear-gradient(-90deg,rgba(200,64,64,0.12),transparent)',
  });
  const afterColor = isWinner ? '#7ad0a0' : '#ff7b7b';
  hdr.innerHTML =
    '<span style="width:40px;height:40px;border-radius:50%;flex-shrink:0;' +
    'background:' + (isAtk ? 'radial-gradient(circle at 38% 30%,#22314c,#0c1626)' : 'radial-gradient(circle at 38% 30%,#3a1c1c,#160a0a)') + ';' +
    'border:2px solid ' + sideColor + ';display:flex;align-items:center;justify-content:center;' +
    'color:' + sideTextColor + ';line-height:0;">' + resizeSvg(PB_SVG.commander, 20) + '</span>' +
    '<div style="flex:1;min-width:0;">' +
    '<div style="font-family:' + BATTLE_FONT_TITLE + ';font-size:16px;color:' + (isAtk ? '#cfe0f4' : '#f0c8c8') + ';' +
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(data.civLabel) + '</div>' +
    '<div style="font-size:10px;color:' + BATTLE_TEXT_DIM + ';letter-spacing:0.06em;text-transform:uppercase;">' +
    esc(data.roleLabel) + '</div></div>' +
    '<div class="tnum" style="text-align:right;flex-shrink:0;">' +
    '<div style="font:700 15px ' + BATTLE_FONT + ';color:' + BATTLE_TEXT + ';">' +
    data.totalBefore + ' → <b style="color:' + afterColor + ';">' + data.totalAfter + '</b></div>' +
    '<div style="font-size:10px;color:' + BATTLE_TEXT_DIM + ';">ludzi po bitwie</div></div>';
  col.appendChild(hdr);

  const scroll = document.createElement('div');
  Object.assign(scroll.style, {
    flex: '1',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '0',
  });
  scroll.innerHTML = FATE_ORDER.map(f => sectionHtml(f, data.units)).join('');
  col.appendChild(scroll);

  return col;
}

/** Ponad ekranem końca walki (endScreen1E = 100500). */
const END_DETAILS_Z = '100530';

/** C-23 — pełny breakdown bitwy, otwierany z „Szczegóły bitwy" na ekranie końca (C-12). */
export function showEndDetails1E(
  _overlay: HTMLElement,
  p: EndDetails1EParams,
  cb: EndDetails1ECallbacks,
): HTMLDivElement {
  const back = document.createElement('div');
  back.id = 'battle-end-details';
  back.dataset.battleEndDetails = 'backdrop';
  Object.assign(back.style, {
    position: 'fixed',
    inset: '0',
    zIndex: END_DETAILS_Z,
    background: 'rgba(5,7,10,0.62)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: BATTLE_FONT,
    color: BATTLE_TEXT,
  });

  const vignette = document.createElement('div');
  Object.assign(vignette.style, {
    position: 'absolute', inset: '0',
    boxShadow: 'inset 0 0 260px 110px rgba(0,0,0,0.7)',
    pointerEvents: 'none',
  });
  back.appendChild(vignette);

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'relative',
    width: 'min(1220px, 96vw)',
    maxHeight: 'min(950px, 92vh)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '18px',
    border: `2px solid ${BATTLE_PANEL_BORDER}`,
    background: 'linear-gradient(180deg,rgba(20,26,36,0.94),rgba(8,10,16,0.96))',
    boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
    overflow: 'hidden',
  });

  const resultColor = p.playerWon ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT;
  const head = document.createElement('div');
  Object.assign(head.style, {
    padding: '20px 28px 16px',
    borderBottom: '1px solid rgba(232,216,138,0.22)',
    background: 'linear-gradient(90deg,rgba(232,216,138,0.08),transparent 40%,transparent 60%,rgba(232,216,138,0.08))',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: '0',
  });
  head.innerHTML =
    '<span style="width:44px;height:44px;border-radius:50%;flex-shrink:0;' +
    'background:radial-gradient(circle at 38% 30%,#2a2416,#12100a);border:2px solid ' + BATTLE_GOLD + ';' +
    'display:flex;align-items:center;justify-content:center;color:#f4e6a8;line-height:0;">' +
    resizeSvg(PB_SVG.commander, 22) + '</span>' +
    '<div style="flex:1;min-width:0;">' +
    '<div style="font-family:' + BATTLE_FONT_TITLE + ';font-size:24px;color:' + BATTLE_GOLD + ';line-height:1.1;">' +
    'Szczegóły bitwy</div>' +
    '<div class="tnum" style="font-size:12px;color:' + BATTLE_TEXT_DIM + ';margin-top:3px;">' +
    esc(p.battleSubtitle) + ' · <b style="color:' + resultColor + ';">' + esc(p.resultLabel) + '</b></div></div>';
  panel.appendChild(head);

  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.textContent = 'Wróć do podsumowania';
  Object.assign(btnClose.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '38px',
    padding: '0 18px',
    borderRadius: '8px',
    border: '2px solid rgba(232,216,138,0.4)',
    background: 'linear-gradient(180deg,#161c28,#0a0d14)',
    color: BATTLE_GOLD,
    fontFamily: BATTLE_FONT,
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    flexShrink: '0',
    whiteSpace: 'nowrap',
  });
  btnClose.onclick = () => cb.onClose();
  head.appendChild(btnClose);

  const body = document.createElement('div');
  Object.assign(body.style, {
    flex: '1',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    overflow: 'hidden',
    minHeight: '0',
  });
  body.appendChild(buildSideColumn('atk', p.atk, p.playerWon));
  body.appendChild(buildSideColumn('def', p.def, !p.playerWon));
  panel.appendChild(body);

  back.appendChild(panel);
  document.body.appendChild(back);
  return back;
}
