/**
 * Kompaktowe wiersze jednostek w katalogu rekrutacji (panel miasta).
 * Wzorzec: bld-compact-row w cityPanel — pełne staty w hover / SZCZEGÓŁY.
 */

import type { GameData, UnitDef } from '../data/loader';
import type { ProductionItem } from '../game/production';
import { formatManpower } from '../game/manpower';
import { categoryOf } from '../units/setup';
import { unitIconSvg } from './icons/brandAssets';
import {
  unitInfographicLabel,
  unitInfographicSvg,
} from './unitInfographic';

/** CSS wstrzykiwany w cityPanel (scope .civ-cs). */
export const UNIT_RECRUIT_CARD_CSS = `
.civ-cs .unit-recruit-compact-row{display:grid;grid-template-columns:1.65em minmax(0,1fr) auto;
  grid-template-areas:"icon text actions" "icon cost actions";align-items:center;
  column-gap:0.35em;row-gap:0.08em;min-height:calc(2.5em - 0.35em);}
.civ-cs .unit-recruit-compact-row.is-disabled{opacity:.72;}
.civ-cs .unit-recruit-compact-row .bld-compact-ic{grid-area:icon;}
.civ-cs .unit-recruit-compact-row .unit-compact-text{grid-area:text;min-width:0;display:flex;flex-direction:column;gap:0.04em;line-height:1.15;}
.civ-cs .unit-recruit-compact-row .unit-compact-meta{font-size:0.64em;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost{grid-area:cost;min-width:0;font-size:0.64em;color:var(--muted);white-space:normal;
  display:inline-flex;align-items:center;gap:0.22em;flex-wrap:wrap;overflow:visible;line-height:1.2;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost .bld-infocard-chip{font-size:0.95em;padding:0.05em 0.28em;}
.civ-cs .unit-recruit-manpower{display:inline-flex;flex:1 1 100%;flex-wrap:wrap;gap:0.12em 0.35em;color:#d8cca8;line-height:1.25;}
.civ-cs .unit-recruit-manpower.is-missing{color:#f0c0a8;font-weight:600;}
.civ-cs .unit-recruit-manpower-missing{flex-basis:100%;color:#e88a7a;font-weight:700;}
.civ-cs .unit-recruit-compact-row .bld-compact-actions{grid-area:actions;align-self:center;margin-left:0;}
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

/**
 * Podtytuł wiersza rekrutacji — typ jednostki + epoka (bez statów bojowych).
 * P-NAZWY-JEDNOSTEK-MYLACO-PODOBNE (Maciej, zgłoszenie #11 dyspozycje/PYTANIA-OTWARTE.md):
 * jednostka bazowa (np. "Wojownik", Kamień) i jej kulturowy zamiennik z tym samym
 * rdzeniem nazwy (np. "Wojownik mykeński", Brąz) mogą wystąpić w TYM SAMYM wierszu
 * katalogu rekrutacji tej samej cywilizacji naraz — mechanizm "Zastąp specjalnie"
 * (production.ts availableProduction) chowa bazowego "Wojownik z mieczem i tarczą",
 * ale NIE chowa jeszcze wcześniejszej bazy "Wojownik" (Kamień), bo żaden zamiennik
 * jej wprost nie zastępuje dla większości kultur. Epoka dopisana tu ROZRÓŻNIA je na
 * pierwszy rzut oka bez najeżdżania myszą (szczegóły z Epoką są tylko w hover-karcie
 * buildUnitDetailCard). Czysto prezentacyjne — nie dotyka danych w units.json.
 * EN: base unit (e.g. "Wojownik"/Warrior, Stone era) and its culture-specific
 * replacement sharing the same name root (e.g. "Wojownik mykeński"/Mycenaean
 * Warrior, Bronze era) can appear in the SAME civilization's recruit list at once;
 * appending the era here disambiguates them at a glance without hovering.
 */
function unitCompactMeta(u: UnitDef, cat: string): string {
  const label = unitInfographicLabel(cat) || u.Jednostka || '';
  const epoka = typeof u.Epoka === 'string' ? u.Epoka.trim() : '';
  return epoka ? `${label} · ${epoka}` : label;
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
  /** Aktualna pula rekrutów imperium używana przez bramkę zakupu. */
  manpowerAvailable?: number;
  /** Wymagany koszt rekrutów tej jednostki; domyślnie `mpCost`. */
  manpowerRequired?: number;
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
  /** Tekst przyczyny blokady, gdy puli rekrutów brakuje. */
  manpowerMissingLabel?: string;
  onRecruit: () => void;
}

function normalizedManpower(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function buildManpowerStatus(opts: {
  available: number | undefined;
  required: number;
}): HTMLSpanElement | null {
  const { available: availableInput, required: requiredInput } = opts;
  if (availableInput == null || !Number.isFinite(availableInput)) return null;
  const available = normalizedManpower(availableInput);
  const required = normalizedManpower(requiredInput);
  const missing = Math.max(0, required - available);
  const status = el('span', `unit-recruit-manpower${missing > 0 ? ' is-missing' : ''}`);
  status.dataset.available = String(available);
  status.dataset.required = String(required);
  status.dataset.missing = String(missing);
  status.title = 'Pula rekrutów imperium — dostępne / potrzebne';
  const summary = el('span', 'unit-recruit-manpower-summary');
  summary.textContent = `Rekruci: dostępne ${formatManpower(available)} / potrzebne ${formatManpower(required)}`;
  status.appendChild(summary);
  if (missing > 0) {
    const shortfall = el('span', 'unit-recruit-manpower-missing');
    shortfall.textContent = `Brakuje: ${formatManpower(missing)}`;
    status.appendChild(shortfall);
  }
  return status;
}

/** Kompaktowy wiersz jednostki — ikona, nazwa, meta, koszt, Rekrutuj. */
export function buildUnitRecruitCard(opts: UnitRecruitCardOpts): HTMLDivElement {
  const {
    udef, item, skarb, canPurchase, treasuryIconHtml, mpCost, mpCostLabel,
    manpowerAvailable, manpowerRequired: manpowerRequiredInput,
    stockChipsHtml, resourceUpkeepChipsHtml, stockMissingLabel, manpowerMissingLabel,
    onRecruit,
  } = opts;
  const cat = unitCategory(udef);
  const canBuy = opts.canPurchase && (skarb === undefined || skarb >= item.koszt);
  const manpowerRequired = manpowerRequiredInput ?? mpCost ?? 0;

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
  const manpowerStatus = buildManpowerStatus({
    available: manpowerAvailable,
    required: manpowerRequired,
  });
  if (manpowerStatus) cost.appendChild(manpowerStatus);
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
  const blockedReasons = [manpowerMissingLabel, stockMissingLabel].filter(
    (reason): reason is string => !!reason,
  );
  if (!canPurchase && blockedReasons.length > 0) btn.title = blockedReasons.join('; ');
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
