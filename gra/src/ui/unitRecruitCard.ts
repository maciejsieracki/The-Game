/**
 * C09 Karty jednostek v2 — katalog rekrutacji w panelu miasta.
 * Mockup: docs/ux/claude-design/The Game - C09 Karty jednostek v2 (1E).dc.html
 */

import type { GameData, UnitDef } from '../data/loader';
import type { ProductionItem } from '../game/production';
import { categoryOf } from '../units/setup';
import { unitIconSvg } from './icons/brandAssets';
import {
  unitCombatClassTag,
  unitInfographicLabel,
  unitInfographicSvg,
} from './unitInfographic';

/** CSS wstrzykiwany w cityPanel (scope .civ-cs). */
export const UNIT_RECRUIT_CARD_CSS = `
.civ-cs .unit-recruit-wrap{margin-bottom:0.55em;}
.civ-cs .unit-recruit-card{
  border:2px solid var(--ur-border,rgba(232,216,138,.4));
  border-radius:14px;overflow:hidden;cursor:pointer;
  background:var(--ur-bg,linear-gradient(180deg,rgba(20,26,34,.98),rgba(8,10,16,.98)));
  box-shadow:0 6px 20px rgba(0,0,0,.32);
  transition:border-color .15s ease,box-shadow .15s ease,transform .12s ease;}
.civ-cs .unit-recruit-card:hover{
  border-color:var(--ur-border-hi,rgba(232,216,138,.65));
  box-shadow:0 0 14px var(--ur-glow,rgba(232,216,138,.18)),0 8px 24px rgba(0,0,0,.4);
  transform:translateY(-1px);}
.civ-cs .unit-recruit-card.is-disabled{opacity:.72;filter:grayscale(.25);}
.civ-cs .unit-recruit-card.is-disabled:hover{transform:none;box-shadow:0 6px 20px rgba(0,0,0,.32);}
.civ-cs .unit-recruit-hd{
  display:flex;align-items:center;gap:0.65em;padding:0.72em 0.85em;
  border-bottom:1px solid rgba(232,216,138,.16);
  background:linear-gradient(90deg,var(--ur-hd-tint,rgba(232,216,138,.08)),transparent);}
.civ-cs .unit-recruit-ic{
  width:2.65em;height:2.65em;flex:none;border-radius:50%;
  border:2px solid var(--ur-accent,#a08030);
  background:radial-gradient(circle at 38% 30%,var(--ur-ic-bg1,#1a2230),var(--ur-ic-bg2,#0a0d14));
  display:flex;align-items:center;justify-content:center;color:var(--ur-accent,#e8d88a);}
.civ-cs .unit-recruit-ic svg{width:1.45em;height:1.45em;display:block;}
.civ-cs .unit-recruit-titles{flex:1;min-width:0;}
.civ-cs .unit-recruit-name{
  font-family:Georgia,serif;font-size:1.05em;color:#e8e0c8;line-height:1.15;font-weight:600;}
.civ-cs .unit-recruit-role{
  margin-top:0.22em;font-size:0.58em;letter-spacing:.12em;text-transform:uppercase;color:#8a8070;}
.civ-cs .unit-recruit-bd{padding:0.62em 0.85em 0.72em;display:flex;flex-direction:column;gap:0.42em;}
.civ-cs .unit-recruit-hp-row{margin-bottom:0.15em;}
.civ-cs .unit-recruit-hp-hd{
  display:flex;justify-content:space-between;font-size:0.68em;color:#8a8070;margin-bottom:0.22em;}
.civ-cs .unit-recruit-hp-val{color:#7ad0a0;font-weight:600;}
.civ-cs .unit-recruit-hp-bar{
  height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;}
.civ-cs .unit-recruit-hp-fill{
  width:100%;height:100%;background:linear-gradient(90deg,#3a8a5a,#7ad0a0);}
.civ-cs .unit-recruit-stats{display:flex;flex-direction:column;gap:0.28em;font-size:0.72em;}
.civ-cs .unit-recruit-stat{display:flex;justify-content:space-between;gap:0.5em;}
.civ-cs .unit-recruit-stat-l{color:#8a8070;}
.civ-cs .unit-recruit-stat-v{color:#e8e0c8;font-weight:600;}
.civ-cs .unit-recruit-ft{
  display:flex;align-items:center;justify-content:space-between;gap:0.35em;
  padding-top:0.42em;border-top:1px solid rgba(232,216,138,.12);flex-wrap:wrap;}
.civ-cs .unit-recruit-cost{font-size:0.68em;color:var(--muted);display:inline-flex;align-items:center;gap:0.28em;}
.civ-cs .unit-recruit-scroll{
  max-height:calc(var(--unit-recruit-visible,8) * 8.6em);overflow-y:auto;scrollbar-width:thin;padding-right:0.1em;}
.civ-cs .unit-recruit-scroll::-webkit-scrollbar{width:5px;}
.civ-cs .unit-recruit-scroll::-webkit-scrollbar-thumb{background:var(--bord2);border-radius:3px;}
.civ-cs .unit-recruit-grid{display:flex;flex-direction:column;gap:0.55em;}
.civ-cs .theme-ur-cav{--ur-border:rgba(58,106,208,.45);--ur-border-hi:#3a6ad0;--ur-accent:#8fb6e0;
  --ur-bg:linear-gradient(180deg,rgba(18,30,44,.95),rgba(10,16,26,.98));--ur-hd-tint:rgba(58,106,208,.14);
  --ur-glow:rgba(58,106,208,.35);--ur-ic-bg1:#12202e;--ur-ic-bg2:#0a0d14;}
.civ-cs .theme-ur-rng{--ur-border:rgba(200,168,120,.42);--ur-border-hi:#c8a878;--ur-accent:#c8a878;
  --ur-bg:linear-gradient(180deg,rgba(30,24,14,.95),rgba(16,12,8,.98));--ur-hd-tint:rgba(200,168,120,.12);
  --ur-glow:rgba(200,168,120,.28);--ur-ic-bg1:#2a2214;--ur-ic-bg2:#12100a;}
.civ-cs .theme-ur-inf{--ur-border:rgba(232,216,138,.38);--ur-border-hi:#e8d88a;--ur-accent:#e8d88a;
  --ur-bg:linear-gradient(180deg,rgba(30,26,16,.95),rgba(14,12,8,.98));--ur-hd-tint:rgba(232,216,138,.1);
  --ur-glow:rgba(232,216,138,.22);}
.civ-cs .theme-ur-civ{--ur-border:rgba(140,150,165,.35);--ur-border-hi:#a8b4c8;--ur-accent:#a8b4c8;
  --ur-bg:linear-gradient(180deg,rgba(22,26,32,.95),rgba(10,12,16,.98));--ur-hd-tint:rgba(140,150,165,.1);
  --ur-glow:rgba(140,150,165,.2);}
`;

type UrTheme = 'cav' | 'rng' | 'inf' | 'civ';

const CATEGORY_THEME: Record<string, UrTheme> = {
  konnica: 'cav',
  rydwan: 'cav',
  lucznik: 'rng',
  procarz: 'rng',
  oszczepnik: 'rng',
  osadnik: 'civ',
  robotnik: 'civ',
  zwiadowca: 'civ',
  galera: 'civ',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function unitCategory(u: UnitDef): string {
  const isSuper = u['Super-jednostka'] === 'TAK';
  return categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', isSuper, u['Typ']);
}

function themeForCategory(cat: string): UrTheme {
  return CATEGORY_THEME[cat] ?? 'inf';
}

function roleLine(u: UnitDef, cat: string): string {
  const combat = unitCombatClassTag(u);
  const label = unitInfographicLabel(cat);
  const hp = u.Health;
  const parts = [`${combat.label} · ${label}`];
  if (hp != null && hp > 0) parts.push(`HP ${hp}`);
  return parts.join(' · ');
}

function statRow(parent: HTMLElement, label: string, val: string | number | null | undefined): void {
  if (val == null || val === '' || val === '—') return;
  const row = el('div', 'unit-recruit-stat');
  row.innerHTML =
    `<span class="unit-recruit-stat-l">${label}</span>` +
    `<span class="unit-recruit-stat-v">${val}</span>`;
  parent.appendChild(row);
}

function extraField(u: UnitDef, key: string): string | number | null {
  const v = (u as unknown as Record<string, unknown>)[key];
  if (v == null || v === '' || v === '—') return null;
  return v as string | number;
}

export interface UnitRecruitCardOpts {
  udef: UnitDef;
  item: ProductionItem;
  data: GameData;
  skarb: number | undefined;
  canPurchase: boolean;
  treasuryIconHtml: string;
  /** Koszt Manpower (0 = Zwiadowca). */
  mpCost?: number;
  mpCostLabel?: string;
  /**
   * JEDNOSTKI-SUROWIEC-01 (Maciej 2026-07-24): chip(y) kosztu surowcowego jednostki
   * (units.json Surowiec/Surowiec (ilość)), już wyrenderowany HTML (patrz
   * cityPanel.ts unitStockCostChipsHtml) — pusty/undefined gdy jednostka bez kosztu.
   */
  stockChipsHtml?: string;
  /**
   * Gdy podane (pula PAŃSTWA ownera nie starcza na koszt surowcowy), przycisk
   * "Rekrutuj" jest zablokowany niezależnie od canPurchase/skarb/Manpower, a tooltip
   * pokazuje ten komunikat (wzorzec: missingStockFor + "Brakuje w magazynie" — budynki).
   */
  stockMissingLabel?: string;
  onRecruit: () => void;
}

/** Karta jednostki C09 v2 do katalogu rekrutacji. */
export function buildUnitRecruitCard(opts: UnitRecruitCardOpts): HTMLDivElement {
  const {
    udef, item, skarb, canPurchase, treasuryIconHtml, mpCost, mpCostLabel,
    stockChipsHtml, stockMissingLabel, onRecruit,
  } = opts;
  const cat = unitCategory(udef);
  const theme = themeForCategory(cat);
  const canBuy = canPurchase && (skarb === undefined || skarb >= item.koszt);

  const wrap = el('div', 'unit-recruit-wrap');
  const card = el('div', `unit-recruit-card theme-ur-${theme}`);
  if (!canBuy) card.classList.add('is-disabled');
  wrap.appendChild(card);

  const hd = el('div', 'unit-recruit-hd');
  const ic = el('div', 'unit-recruit-ic');
  ic.innerHTML = unitInfographicSvg(udef, item.id, 26) || unitIconSvg(udef, item.id);
  hd.appendChild(ic);
  const titles = el('div', 'unit-recruit-titles');
  const name = el('div', 'unit-recruit-name');
  name.textContent = item.nazwa;
  titles.appendChild(name);
  const role = el('div', 'unit-recruit-role');
  role.textContent = roleLine(udef, cat);
  titles.appendChild(role);
  hd.appendChild(titles);
  card.appendChild(hd);

  const bd = el('div', 'unit-recruit-bd');
  const hp = udef.Health;
  if (hp != null && hp > 0) {
    const hpRow = el('div', 'unit-recruit-hp-row');
    const hpHd = el('div', 'unit-recruit-hp-hd');
    hpHd.innerHTML = `<span>Zdrowie</span><span class="unit-recruit-hp-val">${hp} / ${hp}</span>`;
    hpRow.appendChild(hpHd);
    const bar = el('div', 'unit-recruit-hp-bar');
    bar.appendChild(el('div', 'unit-recruit-hp-fill'));
    hpRow.appendChild(bar);
    bd.appendChild(hpRow);
  }

  const stats = el('div', 'unit-recruit-stats');
  statRow(stats, 'Atak w zwarciu', udef.Atak);
  statRow(stats, 'Obrona', udef.Obrona);
  statRow(stats, 'Bonus szarży', extraField(udef, 'Bonus szarży'));
  statRow(stats, 'Pancerz', udef.Pancerz);
  statRow(stats, 'Atak dystansowy', udef['Atak dystansowy']);
  if (stats.childElementCount > 0) bd.appendChild(stats);

  // JEDNOSTKI-SUROWIEC-01: chip kosztu surowcowego (Brąz/Żelazo) obok statystyk,
  // czerwony gdy pula PAŃSTWA (cityPanel.ts unitStockCostChipsHtml) nie starcza.
  if (stockChipsHtml) {
    const stockChips = el('div', 'bld-infocard-chips');
    stockChips.innerHTML = stockChipsHtml;
    bd.appendChild(stockChips);
  }

  const ft = el('div', 'unit-recruit-ft');
  const cost = el('div', 'unit-recruit-cost');
  const mpPart = mpCostLabel != null
    ? ` · ${mpCostLabel} 👤`
    : '';
  cost.innerHTML = `${item.koszt} ${treasuryIconHtml}${mpPart}`;
  ft.appendChild(cost);
  const btn = el('button', 'btn btn-sm btn-g') as HTMLButtonElement;
  btn.textContent = 'Rekrutuj';
  btn.disabled = !canBuy;
  if (!canPurchase && stockMissingLabel) btn.title = stockMissingLabel;
  else if (!canPurchase) btn.title = 'Wymaga wpiecia onPurchaseUnit przez silnik';
  else if (!canBuy && skarb !== undefined) btn.title = `Za mało złota (${skarb}/${item.koszt})`;
  else btn.title = `Rekrutuj za ${item.koszt} ze skarbca`;
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (canBuy) onRecruit();
  });
  ft.appendChild(btn);
  bd.appendChild(ft);
  card.appendChild(bd);

  return wrap;
}
