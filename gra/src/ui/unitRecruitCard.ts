/**
 * Kompaktowe wiersze jednostek w katalogu rekrutacji (panel miasta).
 * Wzorzec: bld-compact-row w cityPanel — pełne staty w hover / SZCZEGÓŁY.
 */

import type { GameData, UnitDef } from '../data/loader';
import type { ProductionItem } from '../game/production';
import { categoryOf } from '../units/setup';
import { unitIconSvg } from './icons/brandAssets';
import {
  unitInfographicLabel,
  unitInfographicSvg,
} from './unitInfographic';

/** CSS wstrzykiwany w cityPanel (scope .civ-cs). */
export const UNIT_RECRUIT_CARD_CSS = `
.civ-cs .unit-recruit-compact-row{align-items:center;flex-wrap:nowrap;gap:0.35em;min-height:calc(2.5em - 0.35em);}
.civ-cs .unit-recruit-compact-row.is-disabled{opacity:.72;}
.civ-cs .unit-recruit-compact-row .unit-compact-text{flex:1 1 auto;min-width:4.4em;display:flex;flex-direction:column;gap:0.04em;line-height:1.15;}
.civ-cs .unit-recruit-compact-row .unit-compact-meta{font-size:0.64em;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost{flex:0 1 auto;min-width:0;font-size:0.64em;color:var(--muted);white-space:nowrap;display:inline-flex;align-items:center;gap:0.22em;flex-wrap:wrap;overflow:hidden;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost .bld-infocard-chip{font-size:0.95em;padding:0.05em 0.28em;}
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function unitCategory(u: UnitDef): string {
  const isSuper = u['Super-jednostka'] === 'TAK';
  return categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', isSuper, u['Typ']);
}

/** Podtytuł wiersza rekrutacji — tylko typ jednostki (bez statów bojowych). */
function unitCompactMeta(u: UnitDef, cat: string): string {
  return unitInfographicLabel(cat) || u.Jednostka || '';
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
   * JEDNOSTKI-SUROWIEC-01: chip(y) kosztu surowcowego jednostki
   * (units.json Surowiec/Surowiec (ilość)), już wyrenderowany HTML.
   */
  stockChipsHtml?: string;
  /**
   * Utrzymanie surowcowe jednostki (units.json Utrzymanie surowiec), już
   * wyrenderowany HTML — wyświetlane gdy >0.
   */
  resourceUpkeepChipsHtml?: string;
  /**
   * Gdy podane (pula PAŃSTWA ownera nie starcza na koszt surowcowy), przycisk
   * "Rekrutuj" jest zablokowany niezależnie od canPurchase/skarb/Manpower.
   */
  stockMissingLabel?: string;
  onRecruit: () => void;
}

/** Kompaktowy wiersz jednostki — ikona, nazwa, meta, koszt, Rekrutuj. */
export function buildUnitRecruitCard(opts: UnitRecruitCardOpts): HTMLDivElement {
  const {
    udef, item, skarb, canPurchase, treasuryIconHtml, mpCostLabel,
    stockChipsHtml, resourceUpkeepChipsHtml, stockMissingLabel, onRecruit,
  } = opts;
  const cat = unitCategory(udef);
  const canBuy = opts.canPurchase && (skarb === undefined || skarb >= item.koszt);

  const row = el('div', 'bld-compact-row unit-recruit-compact-row');
  if (!canBuy) row.classList.add('is-disabled');

  const ic = el('div', 'bld-compact-ic');
  ic.innerHTML = unitInfographicSvg(udef, item.id, 22) || unitIconSvg(udef, item.id);
  row.appendChild(ic);

  const text = el('div', 'unit-compact-text');
  const name = el('span', 'bld-compact-name');
  name.textContent = item.nazwa;
  text.appendChild(name);
  const meta = el('span', 'unit-compact-meta');
  meta.textContent = unitCompactMeta(udef, cat);
  text.appendChild(meta);
  row.appendChild(text);

  const cost = el('div', 'unit-compact-cost');
  const mpPart = mpCostLabel != null && mpCostLabel !== '0' ? ` · ${mpCostLabel} 👤` : '';
  cost.innerHTML = `${item.koszt} ${treasuryIconHtml}${mpPart}`;
  if (stockChipsHtml) {
    const stock = el('span', 'bld-infocard-chips');
    stock.innerHTML = stockChipsHtml;
    cost.appendChild(stock);
  }
  if (resourceUpkeepChipsHtml) {
    const upkeep = el('span', 'bld-infocard-chips');
    upkeep.innerHTML = resourceUpkeepChipsHtml;
    cost.appendChild(upkeep);
  }
  row.appendChild(cost);

  const actions = el('div', 'bld-compact-actions');
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
  actions.appendChild(btn);
  row.appendChild(actions);

  return row;
}
