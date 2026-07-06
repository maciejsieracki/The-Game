/**
 * preBattle.ts
 * Pre-battle overlay — Total War layout C-01 v3 (Design 2026-07-03).
 * ASCII-only source; Polish UI via \\uXXXX. Pure DOM.
 */

import type { CivBonusLite } from '../game/production';
import { isCombatModifierBonus } from '../game/civ-bonuses';
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

export interface PreBattleUnit {
  nazwa: string;
  kategoria: string;
  hp: number;
  maxHp: number;
  atak: number;
  /** M jednostki (pole) — Łączna siła sumuje moc, nie meleeAttack. */
  moc?: number;
  ilosc?: number;
}

export interface PreBattleModifier {
  tekst: string;
  wartosc?: string;
  typ?: 'pos' | 'neg' | 'neu';
}

export interface PreBattleSide {
  nazwa: string;
  cywilizacja?: string;
  wodz?: string;
  portretEmoji?: string;
  /** D4-Q3 / P0-D4: lookup bonusów przez configurePreBattle.getCivBonusy */
  ownerId?: number;
  units: PreBattleUnit[];
}

export interface PreBattleInfo {
  atakujacy: PreBattleSide;
  obronca: PreBattleSide;
  teren: string;
  szanseAtkPct: number;
  miejsce?: string;
  lokacja?: string;
  tura?: number;
  modyfikatory?: PreBattleModifier[];
  warunki?: PreBattleModifier[];
  prognoza?: string;
  werdykt?: string;
  canRetreat?: boolean;
  /** Opcjonalne nadpisanie — inaczej z getCivBonusy(ownerId) */
  bonusyAtakujacy?: readonly CivBonusLite[];
  bonusyObronca?: readonly CivBonusLite[];
}

export interface PreBattleConfig {
  /** Bonusy cywilizacji per owner (civs.json bonusy[]) — wzorzec jak cityPanel. */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
}

export interface PreBattleCallbacks {
  onAuto: () => void;
  onBattlefield: () => void;
  onCancel: () => void;
  onSave?: () => void;
}

export interface PreBattleOptions {
  defaultAction?: 'auto' | 'manual';
  /** Nadpisanie hooka z configurePreBattle (np. jednorazowy test). */
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[];
}

let overlayEl: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let pbCfg: PreBattleConfig = {};

/** Wpięcie silnika — jak configureCityPanel (P0-D4). */
export function configurePreBattle(config: PreBattleConfig): void {
  pbCfg = { ...pbCfg, ...config };
}

export function showPreBattle(
  info: PreBattleInfo,
  cb: PreBattleCallbacks,
  opts?: PreBattleOptions,
): void {
  hidePreBattle();
  overlayEl = buildOverlay(info, cb, opts);
  document.body.appendChild(overlayEl);
  attachKeyboard(cb, info, opts);
}

export function hidePreBattle(): void {
  detachKeyboard();
  if (overlayEl !== null) {
    overlayEl.remove();
    overlayEl = null;
  }
}

export function isPreBattleOpen(): boolean {
  return overlayEl !== null;
}

let styleInjected = false;

function ensureStyles(): void {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = [
    ':root{',
    '  --pb-gold:#e8d88a;--pb-gold-dim:#c9a84c;',
    '  --pb-panel:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));',
    '  --pb-panel2:rgba(255,255,255,0.04);',
    '  --pb-unit:rgba(255,255,255,0.05);',
    '  --pb-border:rgba(232,216,138,0.32);--pb-border-hi:rgba(232,216,138,0.55);',
    '  --pb-text:#e8ebf0;--pb-text-dim:#9aa3b0;--pb-text-hi:#f0e8b8;--pb-text-muted:#7a8498;',
    '  --pb-red:#ff7070;--pb-green:#7ad0a0;--pb-atk:#8fb6e0;--pb-def:#e08a8a;',
    '  --pb-r:8px;--pb-roster-w:clamp(160px,14vw,220px);',
    '  --pb-font-main:Georgia,"Times New Roman",serif;',
    '  --pb-font-ui:"Segoe UI",Tahoma,sans-serif;',
    '}',
    '.pb-roster-col{scrollbar-width:thin;scrollbar-color:rgba(232,216,138,.25) transparent}',
    '.pb-roster-col::-webkit-scrollbar{width:5px}',
    '.pb-roster-col::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);border-radius:4px}',
    '@keyframes pb-fadeIn{from{opacity:0}to{opacity:1}}',
  ].join('\n');
  document.head.appendChild(s);
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

function unitCount(units: PreBattleUnit[]): number {
  return units.reduce((acc, u) => acc + (u.ilosc ?? 1), 0);
}

type UnitKind = 'mounted' | 'melee' | 'ranged' | 'siege';

function unitKind(kategoria: string): UnitKind {
  const k = kategoria.toLowerCase();
  if (k.includes('kawaleria') || k.includes('konnica') || k.includes('jezd') || k.includes('mounted')) return 'mounted';
  if (k.includes('lucznik') || k.includes('\u0142uk') || k.includes('arc') || k.includes('dystans')) return 'ranged';
  if (k.includes('mur') || k.includes('machin') || k.includes('katapult') || k.includes('garnizon')) return 'siege';
  return 'melee';
}

function unitSvgHtml(kind: UnitKind): string {
  if (kind === 'mounted') return PB_SVG.unitMounted;
  if (kind === 'ranged') return PB_SVG.unitRanged;
  if (kind === 'siege') return PB_SVG.unitSiege;
  return PB_SVG.unitMelee;
}

function unitSubtitle(unit: PreBattleUnit): string {
  const qty = unit.ilosc ?? 1;
  const kind = unitKind(unit.kategoria);
  if (kind === 'mounted') return 'Szar\u017Ca +' + String(unit.moc ?? unit.atak);
  if (kind === 'ranged') return 'Zasi\u0119g 2 \u00B7 Atk ' + String(unit.atak);
  if (kind === 'siege') return 'Obrona ' + String(unit.atak);
  return 'Atak ' + String(unit.atak) + (qty > 1 ? '' : '');
}


function attachKeyboard(
  cb: PreBattleCallbacks,
  info: PreBattleInfo,
  opts?: PreBattleOptions,
): void {
  const canRetreat = info.canRetreat !== false;
  const defaultManual = (opts?.defaultAction ?? 'manual') === 'manual';
  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && canRetreat) {
      e.preventDefault();
      cb.onCancel();
      hidePreBattle();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (defaultManual) cb.onBattlefield();
      else cb.onAuto();
      hidePreBattle();
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

function buildRosterRow(unit: PreBattleUnit, side: 'atk' | 'def'): HTMLDivElement {
  const isAtk = side === 'atk';
  const kind = unitKind(unit.kategoria);
  const qty = unit.ilosc ?? 1;
  const row = el('div');
  css(row, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexDirection: isAtk ? 'row' : 'row-reverse',
    padding: '9px 11px',
    border: '1px solid ' + (isAtk ? 'rgba(90,155,212,.4)' : 'rgba(200,64,64,.4)'),
    borderRadius: 'var(--pb-r)',
    background: isAtk ? 'rgba(18,30,44,.5)' : 'rgba(30,14,14,.5)',
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
    color: isAtk ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
    background: isAtk ? 'radial-gradient(circle at 38% 30%,#12202e,#0a0d14)' : 'radial-gradient(circle at 38% 30%,#2a1414,#0a0d14)',
    border: '1.5px solid ' + (isAtk ? BATTLE_PLAYER : BATTLE_ENEMY),
  });
  iconWrap.innerHTML = unitSvgHtml(kind);
  row.appendChild(iconWrap);

  const meta = el('div');
  css(meta, { flex: '1', minWidth: '0', textAlign: isAtk ? 'left' : 'right' });
  const name = el('div');
  css(name, {
    fontSize: '12px',
    color: isAtk ? '#bcd6f0' : '#e8c8c8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
  name.textContent = unit.nazwa + (qty > 1 ? ' \u00D7' + String(qty) : '');
  meta.appendChild(name);
  const sub = el('div');
  css(sub, { fontSize: '10px', color: '#8a8070' });
  sub.textContent = unitSubtitle(unit);
  meta.appendChild(sub);
  row.appendChild(meta);
  return row;
}

function buildRosterColumn(side: PreBattleSide, role: 'atk' | 'def'): HTMLElement {
  const isAtk = role === 'atk';
  const col = el('div');
  col.className = 'pb-roster-col';
  css(col, {
    position: 'absolute',
    top: '130px',
    bottom: '150px',
    width: 'var(--pb-roster-w)',
    zIndex: '3',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    overflowY: 'auto',
    overflowX: 'hidden',
    textAlign: isAtk ? 'left' : 'right',
    ...(isAtk ? { left: '20px' } : { right: '20px' }),
  });

  const head = el('div');
  css(head, {
    fontSize: '10px',
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: isAtk ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
    marginBottom: '2px',
    flexShrink: '0',
  });
  const label = isAtk ? 'Twoje wojska' : (side.nazwa || 'Obro\u0144ca');
  head.textContent = label + ' \u00B7 ' + String(unitCount(side.units));
  col.appendChild(head);

  for (const u of side.units) col.appendChild(buildRosterRow(u, role));
  return col;
}

function buildCommanderCorner(side: PreBattleSide, role: 'atk' | 'def'): HTMLElement {
  const isAtk = role === 'atk';
  const wrap = el('div');
  css(wrap, {
    position: 'absolute',
    top: '30px',
    zIndex: '4',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexDirection: isAtk ? 'row' : 'row-reverse',
    textAlign: isAtk ? 'left' : 'right',
    ...(isAtk ? { left: '30px' } : { right: '30px' }),
  });

  const medal = el('div');
  css(medal, {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isAtk ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
    background: isAtk ? 'radial-gradient(circle at 40% 34%,#12202e,#0a0d14)' : 'radial-gradient(circle at 40% 34%,#2a1414,#0a0d14)',
    border: '3px solid ' + (isAtk ? BATTLE_PLAYER : BATTLE_ENEMY),
    boxShadow: isAtk ? '0 0 26px rgba(58,106,208,.4)' : '0 0 26px rgba(200,64,64,.4)',
    flexShrink: '0',
  });
  medal.innerHTML = PB_SVG.commander;
  wrap.appendChild(medal);

  const txt = el('div');
  const name = el('div');
  css(name, {
    fontFamily: BATTLE_FONT_TITLE,
    fontSize: '22px',
    color: isAtk ? BATTLE_PLAYER_TEXT : BATTLE_ENEMY_TEXT,
  });
  name.textContent = side.wodz ?? side.nazwa;
  txt.appendChild(name);
  const sub = el('div');
  css(sub, {
    fontSize: '11px',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: '#8a8070',
    marginTop: '2px',
  });
  const civ = side.cywilizacja ?? side.nazwa;
  sub.textContent = civ + ' \u00B7 ' + (isAtk ? 'Atakuj\u0105cy' : 'Obro\u0144ca');
  txt.appendChild(sub);
  wrap.appendChild(txt);
  return wrap;
}

function buildVsBadge(): HTMLElement {
  const vs = el('div');
  css(vs, {
    position: 'absolute',
    top: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '4',
    fontFamily: BATTLE_FONT_TITLE,
    fontSize: 'clamp(32px,4vw,46px)',
    color: BATTLE_ENEMY,
    textShadow: '0 0 30px rgba(200,64,64,.4)',
    pointerEvents: 'none',
  });
  vs.textContent = 'VS';
  return vs;
}

function buildModPills(items: PreBattleModifier[] | undefined): HTMLElement {
  const wrap = el('div');
  css(wrap, { display: 'flex', flexWrap: 'wrap', gap: '9px', justifyContent: 'center' });
  if (!items?.length) return wrap;
  for (const m of items) {
    const t = m.typ ?? 'neu';
    const pos = t === 'pos';
    const neg = t === 'neg';
    const pill = el('span');
    css(pill, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      padding: '8px 14px',
      borderRadius: '20px',
      fontSize: '12px',
      border: '1px solid ' + (pos ? 'rgba(80,176,112,.35)' : neg ? 'rgba(200,64,64,.35)' : 'rgba(232,216,138,.25)'),
      background: pos ? 'rgba(80,176,112,.06)' : neg ? 'rgba(200,64,64,.05)' : 'rgba(255,255,255,.03)',
      color: pos ? '#7ad0a0' : neg ? BATTLE_ENEMY_TEXT : BATTLE_TEXT_DIM,
    });
    const prefix = pos ? '\u25B2 ' : neg ? '\u25BC ' : '';
    pill.textContent = prefix + m.tekst + (m.wartosc ? ' ' + m.wartosc : '');
    wrap.appendChild(pill);
  }
  return wrap;
}

function bonusToPills(
  bonusy: readonly CivBonusLite[],
  accent: 'pos' | 'neg' | 'neu',
): PreBattleModifier[] {
  const out: PreBattleModifier[] = [];
  for (const b of bonusy) {
    if (!isCombatModifierBonus(b)) continue;
    const text = (b.opis ?? '').trim();
    if (!text) continue;
    out.push({ tekst: text, typ: accent });
  }
  return out;
}

function resolveSideBonusy(
  side: PreBattleSide,
  explicit: readonly CivBonusLite[] | undefined,
  getCivBonusy?: (ownerId: number) => readonly CivBonusLite[],
): readonly CivBonusLite[] {
  if (explicit?.length) return explicit;
  if (side.ownerId !== undefined && getCivBonusy) return getCivBonusy(side.ownerId);
  return [];
}

function defaultVerdict(atkPct: number): string {
  if (atkPct >= 65) return 'Przewaga atakuj\u0105cego';
  if (atkPct <= 35) return 'Przewaga obro\u0144cy';
  return 'Szanse umiarkowane';
}

function battleTitle(info: PreBattleInfo): string {
  const place = info.miejsce ?? info.lokacja ?? info.teren;
  if (/^bitwa/i.test(place)) return place;
  return 'Bitwa o ' + place;
}

function buildCenterPanel(info: PreBattleInfo, opts?: PreBattleOptions): HTMLElement {
  const atkPct = Math.max(0, Math.min(100, Math.round(info.szanseAtkPct)));
  const defPct = 100 - atkPct;
  const getBonusy = opts?.getCivBonusy ?? pbCfg.getCivBonusy;
  const atkBon = resolveSideBonusy(info.atakujacy, info.bonusyAtakujacy, getBonusy);
  const defBon = resolveSideBonusy(info.obronca, info.bonusyObronca, getBonusy);
  const allMods: PreBattleModifier[] = [
    ...(info.modyfikatory ?? []),
    ...(info.warunki ?? []),
    ...bonusToPills(atkBon, 'pos'),
    ...bonusToPills(defBon, 'neg'),
  ];

  const panel = el('div');
  css(panel, {
    position: 'absolute',
    top: '150px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '4',
    width: 'min(640px, calc(100vw - 2 * var(--pb-roster-w) - 80px))',
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
  head.textContent = battleTitle(info);
  panel.appendChild(head);

  const body = el('div');
  css(body, { padding: '24px', textAlign: 'center' });

  const lbl = el('div');
  css(lbl, {
    fontSize: '11px',
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    color: '#a08030',
    marginBottom: '6px',
  });
  lbl.textContent = 'Szansa zwyci\u0119stwa';
  body.appendChild(lbl);

  const big = el('div');
  css(big, {
    fontFamily: BATTLE_FONT_TITLE,
    fontSize: 'clamp(40px,6vw,56px)',
    color: atkPct >= 50 ? '#7ad0a0' : BATTLE_ENEMY_TEXT,
    lineHeight: '1',
  });
  big.textContent = String(atkPct) + '%';
  body.appendChild(big);

  const bar = el('div');
  css(bar, {
    height: '12px',
    borderRadius: '6px',
    overflow: 'hidden',
    display: 'flex',
    margin: '16px 0 20px',
  });
  const ab = el('div');
  css(ab, { width: atkPct + '%', background: 'linear-gradient(90deg,#3a6ad0,#5a9bd4)' });
  bar.appendChild(ab);
  const db = el('div');
  css(db, { width: defPct + '%', background: 'linear-gradient(90deg,#c05050,#8a3a3a)' });
  bar.appendChild(db);
  body.appendChild(bar);

  body.appendChild(buildModPills(allMods));

  const verdict = el('div');
  css(verdict, {
    marginTop: '16px',
    fontSize: '11px',
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: atkPct >= 65 ? '#7ad0a0' : atkPct <= 35 ? BATTLE_ENEMY_TEXT : '#a08030',
  });
  verdict.textContent = info.werdykt ?? defaultVerdict(atkPct);
  body.appendChild(verdict);

  if (info.prognoza) {
    const pred = el('div');
    css(pred, { fontSize: '12px', color: BATTLE_TEXT_DIM, lineHeight: '1.55', marginTop: '10px' });
    pred.textContent = info.prognoza;
    body.appendChild(pred);
  }

  if (info.teren) {
    const ter = el('div');
    css(ter, { fontSize: '11px', color: BATTLE_TEXT_DIM, marginTop: '8px' });
    ter.textContent = info.teren + (info.tura !== undefined ? ' \u00B7 Tura ' + String(info.tura) : '');
    body.appendChild(ter);
  }

  panel.appendChild(body);
  return panel;
}

function buildTwButton(
  label: string,
  onClick: () => void,
  variant: 'outline' | 'panel' | 'auto',
  svgHtml?: string,
  disabled = false,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.disabled = disabled;
  css(btn, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontSize: variant === 'auto' ? '17px' : '15px',
    fontWeight: variant === 'auto' ? '700' : '600',
    letterSpacing: variant === 'auto' ? '.16em' : '.14em',
    textTransform: 'uppercase',
    padding: variant === 'auto' ? '18px 54px' : '16px 34px',
    borderRadius: '9px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: BATTLE_FONT,
    outline: 'none',
    opacity: disabled ? '0.35' : '1',
    transition: 'filter 0.15s, box-shadow 0.15s',
  });

  if (variant === 'outline') {
    Object.assign(btn.style, {
      background: 'transparent',
      border: '2px solid rgba(232,216,138,.4)',
      color: BATTLE_GOLD,
    });
  } else if (variant === 'panel') {
    Object.assign(btn.style, {
      background: 'linear-gradient(180deg,#161c28,#0a0d14)',
      border: '2px solid rgba(232,216,138,.5)',
      color: BATTLE_GOLD,
    });
  } else {
    applyBtnStartBattle(btn);
    btn.style.padding = '18px 54px';
    btn.style.fontSize = '17px';
    btn.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.25),0 6px 22px rgba(200,64,64,.4)';
  }

  if (svgHtml) {
    const ic = el('span');
    ic.innerHTML = svgHtml;
    btn.appendChild(ic);
  }
  btn.appendChild(document.createTextNode(label));
  if (!disabled) {
    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(1.08)'; });
    btn.addEventListener('mouseleave', () => { btn.style.filter = ''; });
  }
  return btn;
}

function buildBottomBar(
  cb: PreBattleCallbacks,
  info: PreBattleInfo,
  dismiss: () => void,
  opts?: PreBattleOptions,
): HTMLElement {
  const canRetreat = info.canRetreat !== false;
  const defaultManual = (opts?.defaultAction ?? 'manual') === 'manual';
  const wrap = el('footer');
  css(wrap, {
    position: 'absolute',
    bottom: '40px',
    left: '0',
    right: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    zIndex: '5',
    flexWrap: 'wrap',
    padding: '0 20px',
  });

  wrap.appendChild(buildTwButton('Wycofaj', () => { cb.onCancel(); dismiss(); }, 'outline', undefined, !canRetreat));
  wrap.appendChild(buildTwButton('Rozegraj r\u0119cznie', () => { cb.onBattlefield(); dismiss(); }, 'panel', undefined));
  wrap.appendChild(buildTwButton('Atakuj \u2014 auto', () => { cb.onAuto(); dismiss(); }, 'auto', PB_SVG.auto));

  if (cb.onSave) {
    wrap.appendChild(buildTwButton('Zapisz', () => { cb.onSave!(); }, 'outline'));
  }

  return wrap;
}

function buildOverlay(info: PreBattleInfo, cb: PreBattleCallbacks, opts?: PreBattleOptions): HTMLDivElement {
  ensureStyles();
  const overlay = el('div');
  css(overlay, {
    position: 'fixed',
    inset: '0',
    zIndex: '9900',
    background: 'radial-gradient(1200px 800px at 50% 36%, rgba(200,64,64,.12), transparent 60%), #0a0708',
    fontFamily: BATTLE_FONT,
    color: BATTLE_TEXT,
    userSelect: 'none',
    pointerEvents: 'auto',
    overflow: 'hidden',
    animation: 'pb-fadeIn 0.22s ease-out',
  });

  const vignette = el('div');
  css(vignette, {
    position: 'absolute',
    inset: '0',
    boxShadow: 'inset 0 0 300px 90px rgba(0,0,0,.82)',
    pointerEvents: 'none',
  });
  overlay.appendChild(vignette);

  overlay.appendChild(buildCommanderCorner(info.atakujacy, 'atk'));
  overlay.appendChild(buildCommanderCorner(info.obronca, 'def'));
  overlay.appendChild(buildVsBadge());
  overlay.appendChild(buildRosterColumn(info.atakujacy, 'atk'));
  overlay.appendChild(buildRosterColumn(info.obronca, 'def'));
  overlay.appendChild(buildCenterPanel(info, opts));
  overlay.appendChild(buildBottomBar(cb, info, () => hidePreBattle(), opts));

  const defaultManual = (opts?.defaultAction ?? 'manual') === 'manual';
  const hint = el('div');
  css(hint, {
    position: 'absolute',
    bottom: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    color: '#5a4a4a',
    letterSpacing: '.06em',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  });
  hint.textContent =
    'Enter = ' + (defaultManual ? 'Rozegraj r\u0119cznie' : 'Atakuj \u2014 auto') +
    ' \u00B7 Escape = Wycofaj';
  overlay.appendChild(hint);

  const mark = el('div');
  css(mark, {
    position: 'absolute',
    bottom: '14px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    letterSpacing: '.3em',
    textTransform: 'uppercase',
    color: '#5a4a4a',
    pointerEvents: 'none',
  });
  mark.textContent = 'The Game \u00B7 C-01 Pre-bitwa v3 \u00B7 1E';
  overlay.appendChild(mark);

  return overlay;
}
