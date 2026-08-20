/**
 * postBattleSummary.ts — wynik po bitwie mapowej (layout TW jak preBattle C-01 v3).
 */

import type { PostBattleSummaryData, BattleSummaryUnitCard, BattleSummarySide } from '../game/battle-summary';
import {
  PB_SVG,
  BATTLE_GOLD,
  BATTLE_PLAYER,
  BATTLE_PLAYER_TEXT,
  BATTLE_ENEMY,
  BATTLE_ENEMY_TEXT,
  BATTLE_TEXT,
  BATTLE_TEXT_DIM,
  BATTLE_FONT,
  BATTLE_FONT_TITLE,
  applyBtnStartBattle,
} from '../battle/battleHudTheme';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

let overlayEl: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let activeOnContinue: (() => void) | null = null;
let styleInjected = false;

/** Opcje wyświetlenia (pole bitwy: inny przycisk / z-index nad endScreen). */
export interface PostBattleSummaryShowOptions {
  continueLabel?: string;
  zIndex?: string;
  /** Nadpisuje „Werdykt” / „Wynik auto-walki” nad głównym tekstem. */
  statusHeading?: string;
}

type StyleMap = { [K in keyof CSSStyleDeclaration]?: string };

function css(el: HTMLElement, props: StyleMap): void {
  for (const key of Object.keys(props) as Array<keyof CSSStyleDeclaration>) {
    const v = props[key];
    if (v !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el.style as any)[key as string] = v;
    }
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
}

type UnitKind = 'mounted' | 'melee' | 'ranged' | 'siege';

function unitKind(kategoria: string): UnitKind {
  const k = kategoria.toLowerCase();
  if (k.includes('kawaler') || k.includes('konnica') || k.includes('jezd')) return 'mounted';
  if (k.includes('lucznik') || k.includes('łucz') || k.includes('dystans')) return 'ranged';
  if (k.includes('mur') || k.includes('machin') || k.includes('katapult') || k.includes('obl')) return 'siege';
  return 'melee';
}

function unitSvgHtml(kind: UnitKind): string {
  if (kind === 'mounted') return PB_SVG.unitMounted;
  if (kind === 'ranged') return PB_SVG.unitRanged;
  if (kind === 'siege') return PB_SVG.unitSiege;
  return PB_SVG.unitMelee;
}

/** Bezwzględne HP przed→po (max w liczniku po prawej). */
function formatHpLine(u: BattleSummaryUnitCard): string {
  const max = Math.max(0, Math.round(u.maxHp));
  const before = Math.max(0, Math.round(u.hpBefore));
  const after = u.dead ? 0 : Math.max(0, Math.round(u.hpAfter));
  return 'HP ' + before + ' \u2192 ' + after + '/' + max;
}

function ensureStyles(): void {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = [
    ':root{--pbs-roster-w:clamp(160px,14vw,220px);}',
    '.pbs-roster-col{scrollbar-width:thin;scrollbar-color:rgba(232,216,138,.25) transparent}',
    '.pbs-roster-col::-webkit-scrollbar{width:5px}',
    '.pbs-roster-col::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);border-radius:4px}',
    '@keyframes pbs-fadeIn{from{opacity:0}to{opacity:1}}',
  ].join('\n');
  document.head.appendChild(s);
}

function buildCommanderCorner(
  side: BattleSummarySide,
  role: 'atk' | 'def',
  playerSide: 'atk' | 'def',
): HTMLElement {
  const isAtk = role === 'atk';
  const isPlayer = role === playerSide;
  const wrap = el('div');
  css(wrap, {
    position: 'absolute',
    top: '30px',
    zIndex: '4',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexDirection: isPlayer ? 'row' : 'row-reverse',
    textAlign: isPlayer ? 'left' : 'right',
    ...(isPlayer ? { left: '30px' } : { right: '30px' }),
  });

  const medal = el('div');
  css(medal, {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isPlayer ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
    background: isPlayer ? 'radial-gradient(circle at 40% 34%,#12202e,#0a0d14)' : 'radial-gradient(circle at 40% 34%,#2a1414,#0a0d14)',
    border: '3px solid ' + (isPlayer ? BATTLE_PLAYER : BATTLE_ENEMY),
    boxShadow: isPlayer ? '0 0 26px rgba(58,106,208,.4)' : '0 0 26px rgba(200,64,64,.4)',
    flexShrink: '0',
  });
  medal.innerHTML = PB_SVG.commander;
  wrap.appendChild(medal);

  const txt = el('div');
  const name = el('div');
  css(name, {
    fontFamily: BATTLE_FONT_TITLE,
    fontSize: '22px',
    color: isPlayer ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
  });
  name.textContent = side.label;
  txt.appendChild(name);

  const sub = el('div');
  css(sub, {
    fontSize: '11px',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: '#8a8070',
    marginTop: '2px',
  });
  const civ = side.civLabel ?? (isPlayer ? 'Gracz' : 'Wr\u00F3g');
  sub.textContent = civ + ' \u00B7 ' + (isAtk ? 'Atakuj\u0105cy' : 'Obro\u0144ca');
  txt.appendChild(sub);
  wrap.appendChild(txt);
  return wrap;
}

function buildUnitRow(
  u: BattleSummaryUnitCard,
  role: 'atk' | 'def',
  playerSide: 'atk' | 'def',
): HTMLElement {
  const isPlayer = role === playerSide;
  const kind = unitKind(u.kategoria);
  const row = el('div');
  css(row, {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '9px 11px',
    border: '1px solid ' + (u.dead ? 'rgba(200,64,64,.55)' : isPlayer ? 'rgba(90,155,212,.4)' : 'rgba(200,64,64,.4)'),
    borderRadius: '8px',
    background: u.dead ? 'rgba(40,12,12,.55)' : isPlayer ? 'rgba(18,30,44,.5)' : 'rgba(30,14,14,.5)',
  });

  const top = el('div');
  css(top, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexDirection: isPlayer ? 'row' : 'row-reverse',
  });

  const iconWrap = el('span');
  css(iconWrap, {
    width: '32px',
    height: '32px',
    flex: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isPlayer ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
    background: isPlayer ? 'radial-gradient(circle at 38% 30%,#12202e,#0a0d14)' : 'radial-gradient(circle at 38% 30%,#2a1414,#0a0d14)',
    border: '1.5px solid ' + (isPlayer ? BATTLE_PLAYER : BATTLE_ENEMY),
    opacity: u.dead ? '0.45' : '1',
  });
  iconWrap.innerHTML = unitSvgHtml(kind);
  top.appendChild(iconWrap);

  const meta = el('div');
  css(meta, { flex: '1', minWidth: '0', textAlign: isPlayer ? 'left' : 'right' });
  const nm = el('div');
  css(nm, {
    fontSize: '12px',
    color: isPlayer ? '#bcd6f0' : '#e8c8c8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
  nm.textContent = u.typeId + (u.dead ? ' \u00B7 zniszczona' : '');
  meta.appendChild(nm);
  const cat = el('div');
  css(cat, { fontSize: '10px', color: '#8a8070' });
  cat.textContent = u.kategoria;
  meta.appendChild(cat);
  top.appendChild(meta);
  row.appendChild(top);

  const track = el('div');
  css(track, {
    height: '6px',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    background: 'rgba(255,255,255,.08)',
  });
  const before = el('div');
  css(before, {
    position: 'absolute',
    inset: '0',
    width: u.hpBeforePct + '%',
    background: 'rgba(255,255,255,.14)',
    borderRadius: '4px',
  });
  track.appendChild(before);
  const after = el('div');
  css(after, {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    width: (u.dead ? 0 : u.hpAfterPct) + '%',
    borderRadius: '4px',
    background: isPlayer
      ? 'linear-gradient(90deg,#3a6ad0,#5a9bd4)'
      : 'linear-gradient(90deg,#c05050,#8a3a3a)',
  });
  track.appendChild(after);
  row.appendChild(track);

  const stats = el('div');
  css(stats, {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: BATTLE_TEXT_DIM,
  });
  stats.appendChild(el('span', formatHpLine(u)));
  const loss = el('span');
  css(loss, {
    fontWeight: '700',
    color: u.dead || u.lossPct >= 50 ? '#ff7070' : u.lossPct === 0 ? '#7ad0a0' : BATTLE_TEXT_DIM,
  });
  loss.textContent = u.dead ? '\u2212100%' : '\u2212' + u.lossPct + '%';
  stats.appendChild(loss);
  row.appendChild(stats);

  return row;
}

function buildRosterColumn(
  side: BattleSummarySide,
  role: 'atk' | 'def',
  playerSide: 'atk' | 'def',
): HTMLElement {
  const isPlayer = role === playerSide;
  const col = el('div');
  col.className = 'pbs-roster-col';
  css(col, {
    position: 'absolute',
    top: '130px',
    bottom: '150px',
    width: 'var(--pbs-roster-w)',
    zIndex: '3',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    overflowY: 'auto',
    overflowX: 'hidden',
    ...(isPlayer ? { left: '20px' } : { right: '20px' }),
  });

  const head = el('div');
  css(head, {
    fontSize: '10px',
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: isPlayer ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
    marginBottom: '2px',
    flexShrink: '0',
    textAlign: isPlayer ? 'left' : 'right',
  });
  head.textContent = (isPlayer ? 'Twoje wojska' : 'Wojska AI') + ' \u00B7 ' + side.totalBefore;
  col.appendChild(head);

  const tot = el('div');
  css(tot, {
    fontSize: '10px',
    color: BATTLE_TEXT_DIM,
    marginBottom: '6px',
    textAlign: isPlayer ? 'left' : 'right',
  });
  tot.textContent = 'Po walce: ' + side.totalAfter
    + (side.totalDead > 0 ? ' \u00B7 poleg\u0142o: ' + side.totalDead : '');
  col.appendChild(tot);

  if (side.units.length === 0) {
    col.appendChild(el('div', 'Brak jednostek'));
  } else {
    for (const u of side.units) col.appendChild(buildUnitRow(u, role, playerSide));
  }
  return col;
}

function winnerColor(data: PostBattleSummaryData): string {
  if (data.winner === 'remis') return '#a08030';
  if (data.winner === 'atakujacy') return '#7ad0a0';
  return BATTLE_ENEMY_TEXT;
}

function buildCenterPanel(data: PostBattleSummaryData, statusHeading?: string): HTMLElement {
  const panel = el('div');
  css(panel, {
    position: 'absolute',
    top: '150px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '4',
    width: 'min(640px, calc(100vw - 2 * var(--pbs-roster-w) - 80px))',
    border: '2px solid rgba(232,216,138,.5)',
    borderRadius: '14px',
    overflow: 'hidden',
    background: 'linear-gradient(180deg,rgba(24,20,12,.97),rgba(12,10,6,.97))',
    boxShadow: '0 18px 50px rgba(0,0,0,.7)',
    color: BATTLE_TEXT,
    fontFamily: BATTLE_FONT,
  });

  const head = el('div');
  css(head, {
    padding: '12px 20px',
    borderBottom: '1px solid rgba(232,216,138,.22)',
    background: 'linear-gradient(90deg,rgba(232,216,138,.12),transparent)',
    textAlign: 'center',
    fontFamily: BATTLE_FONT_TITLE,
    fontSize: '22px',
    color: BATTLE_GOLD,
    letterSpacing: '.06em',
  });
  head.textContent = data.title;
  panel.appendChild(head);

  const body = el('div');
  css(body, { padding: '24px', textAlign: 'center' });

  const subParts = [data.subtitle, data.teren ? 'Teren: ' + data.teren : ''].filter(Boolean);
  if (subParts.length) {
    const sub = el('div');
    css(sub, { fontSize: '11px', color: BATTLE_TEXT_DIM, marginBottom: '12px' });
    sub.textContent = subParts.join(' \u00B7 ');
    body.appendChild(sub);
  }

  const lbl = el('div');
  css(lbl, {
    fontSize: '11px',
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: '#a08030',
    marginBottom: '6px',
  });
  lbl.textContent = statusHeading
    ?? (data.mode === 'auto' ? 'Wynik auto-walki' : 'Werdykt');
  body.appendChild(lbl);

  const big = el('div');
  css(big, {
    fontFamily: BATTLE_FONT_TITLE,
    fontSize: 'clamp(28px,4vw,40px)',
    color: winnerColor(data),
    lineHeight: '1.15',
  });
  big.textContent = data.winnerLabel;
  body.appendChild(big);

  const losses = data.atakujacy.totalDead + data.obronca.totalDead;
  const summary = el('div');
  css(summary, {
    marginTop: '18px',
    fontSize: '12px',
    color: BATTLE_TEXT_DIM,
    lineHeight: '1.55',
  });
  summary.textContent = losses > 0
    ? 'Straty \u0142\u0105cznie: ' + losses + ' jednostek zniszczonych.'
    : 'Brak zniszczonych jednostek \u2014 tylko obra\u017Cenia.';
  body.appendChild(summary);

  if (data.lootNote) {
    const lootLine = el('div');
    css(lootLine, {
      marginTop: '10px',
      fontSize: '12px',
      color: BATTLE_GOLD,
      lineHeight: '1.5',
    });
    lootLine.textContent = '\u0141upy: ' + data.lootNote;
    body.appendChild(lootLine);
  }

  panel.appendChild(body);
  return panel;
}

function buildContinueButton(onContinue: () => void, continueLabel = 'Kontynuuj'): HTMLElement {
  const wrap = el('footer');
  css(wrap, {
    position: 'absolute',
    bottom: '40px',
    left: '0',
    right: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '5',
  });

  const btn = document.createElement('button');
  btn.type = 'button';
  applyBtnStartBattle(btn);
  btn.style.padding = '16px 48px';
  btn.style.fontSize = '15px';
  btn.textContent = continueLabel;
  btn.addEventListener('click', () => {
    hidePostBattleSummary();
    onContinue();
  });
  wrap.appendChild(btn);
  return wrap;
}

function buildOverlay(
  data: PostBattleSummaryData,
  onContinue: () => void,
  opts?: PostBattleSummaryShowOptions,
): HTMLDivElement {
  ensureStyles();
  const playerSide = data.playerSide ?? 'atk';
  const overlay = el('div');
  css(overlay, {
    position: 'fixed',
    inset: '0',
    zIndex: opts?.zIndex ?? '10100',
    background: 'radial-gradient(1200px 800px at 50% 36%, rgba(200,64,64,.12), transparent 60%), #0a0708',
    fontFamily: BATTLE_FONT,
    color: BATTLE_TEXT,
    userSelect: 'none',
    overflow: 'hidden',
    animation: 'pbs-fadeIn 0.22s ease-out',
  });

  const vignette = el('div');
  css(vignette, {
    position: 'absolute',
    inset: '0',
    boxShadow: 'inset 0 0 300px 90px rgba(0,0,0,.82)',
    pointerEvents: 'none',
  });
  overlay.appendChild(vignette);

  overlay.appendChild(buildCommanderCorner(data.atakujacy, 'atk', playerSide));
  overlay.appendChild(buildCommanderCorner(data.obronca, 'def', playerSide));
  overlay.appendChild(buildRosterColumn(data.atakujacy, 'atk', playerSide));
  overlay.appendChild(buildRosterColumn(data.obronca, 'def', playerSide));
  overlay.appendChild(buildCenterPanel(data, opts?.statusHeading));
  overlay.appendChild(buildContinueButton(onContinue, opts?.continueLabel));

  return overlay;
}

function handlePostBattleEscape(): void {
  const cb = activeOnContinue;
  hidePostBattleSummary();
  cb?.();
}

function attachKeyboard(onContinue: () => void): void {
  detachKeyboard();
  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      hidePostBattleSummary();
      onContinue();
    }
  };
  document.addEventListener('keydown', keyHandler);
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function showPostBattleSummary(
  data: PostBattleSummaryData,
  onContinue: () => void,
  opts?: PostBattleSummaryShowOptions,
): void {
  hidePostBattleSummary();
  activeOnContinue = onContinue;
  overlayEl = buildOverlay(data, onContinue, opts);
  document.body.appendChild(overlayEl);
  attachKeyboard(onContinue);
  pushOverlay('post-battle-summary', handlePostBattleEscape);
}

export function hidePostBattleSummary(): void {
  popOverlay('post-battle-summary');
  detachKeyboard();
  overlayEl?.remove();
  overlayEl = null;
  activeOnContinue = null;
}

export function isPostBattleSummaryOpen(): boolean {
  return overlayEl !== null;
}
