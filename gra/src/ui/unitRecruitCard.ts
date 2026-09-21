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
.civ-cs .unit-recruit-quantity{display:inline-flex;align-items:center;gap:0.16em;flex:none;order:-1;}
.civ-cs .unit-recruit-quantity-label{font-size:0.64em;color:var(--muted);}
.civ-cs .unit-recruit-quantity-control{display:inline-flex;align-items:center;gap:0.1em;}
.civ-cs .unit-recruit-quantity-button{width:1.55em;min-width:1.55em;padding:0.08em 0;line-height:1.15;font-size:0.78em;}
.civ-cs .unit-recruit-quantity-input{width:2.55em;min-width:2.55em;padding:0.1em 0.16em;text-align:center;font-size:0.72em;line-height:1.15;}
.civ-cs .unit-recruit-quantity-input:disabled,.civ-cs .unit-recruit-quantity-button:disabled{cursor:not-allowed;}
.civ-cs .unit-recruit-submit{min-width:3.2em;}
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
  /**
   * Największa liczba jednostek możliwa według aktualnego snapshotu zasobów.
   * To wyłącznie sufit kontrolek UI — nie rezerwuje kosztu.
   */
  maxQuantity?: number;
  /** Zatwierdza draft liczby; `false` oznacza odrzucenie przez backend. */
  onRecruit: (quantity: number) => boolean | void;
}

function normalizeMaxQuantity(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
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
  const maxQuantity = normalizeMaxQuantity(opts.maxQuantity);

  const row = el('div', 'bld-compact-row unit-recruit-compact-row');
  row.dataset.recruitQuantity = '1';
  row.dataset.recruitQuantityMax = String(maxQuantity);
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
  const quantityWrap = el('div', 'unit-recruit-quantity');
  quantityWrap.title = 'Wybór liczby nie rezerwuje zasobów przed potwierdzeniem';
  const quantityLabel = el('span', 'unit-recruit-quantity-label');
  quantityLabel.textContent = 'Ilość';
  quantityWrap.appendChild(quantityLabel);
  const quantityControl = el('div', 'unit-recruit-quantity-control');
  const minus = el('button', 'btn btn-sm unit-recruit-quantity-button') as HTMLButtonElement;
  minus.type = 'button';
  minus.dataset.recruitQuantityAction = 'decrease';
  minus.textContent = '−';
  minus.setAttribute('aria-label', 'Zmniejsz liczbę rekrutowanych jednostek');
  minus.title = 'Zmniejsz liczbę jednostek';
  quantityControl.appendChild(minus);
  const quantityInput = el('input', 'unit-recruit-quantity-input') as HTMLInputElement;
  quantityInput.type = 'number';
  quantityInput.min = '1';
  quantityInput.max = String(maxQuantity);
  quantityInput.step = '1';
  quantityInput.value = '1';
  quantityInput.inputMode = 'numeric';
  quantityInput.setAttribute('aria-label', 'Liczba rekrutowanych jednostek');
  quantityControl.appendChild(quantityInput);
  const plus = el('button', 'btn btn-sm unit-recruit-quantity-button') as HTMLButtonElement;
  plus.type = 'button';
  plus.dataset.recruitQuantityAction = 'increase';
  plus.textContent = '+';
  plus.setAttribute('aria-label', 'Zwiększ liczbę rekrutowanych jednostek');
  plus.title = 'Zwiększ liczbę jednostek';
  quantityControl.appendChild(plus);
  quantityWrap.appendChild(quantityControl);

  const btn = el('button', 'btn btn-sm btn-g unit-recruit-submit') as HTMLButtonElement;
  btn.type = 'button';
  btn.textContent = 'Rekrutuj';
  actions.appendChild(btn);
  // Submit pozostaje pierwszym przyciskiem w akcji; licznik jest jego sąsiednią kontrolką.
  actions.appendChild(quantityWrap);

  let quantity = 1;
  const syncQuantityControls = (): void => {
    row.dataset.recruitQuantity = String(quantity);
    minus.disabled = !canBuy || quantity <= 1;
    quantityInput.disabled = !canBuy;
    plus.disabled = !canBuy || quantity >= maxQuantity;
    btn.disabled = !canBuy;
    const blockedReasons = [manpowerMissingLabel, stockMissingLabel].filter(
      (reason): reason is string => !!reason,
    );
    if (!canPurchase && blockedReasons.length > 0) btn.title = blockedReasons.join('; ');
    else if (!canPurchase) btn.title = 'Wymaga podpięcia onPurchaseUnit przez silnik';
    else if (!canBuy && skarb !== undefined) btn.title = `Za mało złota (${skarb}/${item.koszt})`;
    else if (quantity > 1) btn.title = `Rekrutuj ${quantity} jednostki za ${quantity * item.koszt} ze skarbca`;
    else btn.title = `Rekrutuj za ${item.koszt} ze skarbca`;
  };
  const setQuantity = (next: number): void => {
    quantity = Number.isFinite(next)
      ? Math.min(maxQuantity, Math.max(1, Math.round(next)))
      : 1;
    quantityInput.value = String(quantity);
    syncQuantityControls();
  };
  minus.addEventListener('click', (ev) => {
    ev.stopPropagation();
    setQuantity(quantity - 1);
  });
  plus.addEventListener('click', (ev) => {
    ev.stopPropagation();
    setQuantity(quantity + 1);
  });
  const syncInputQuantity = (): void => {
    setQuantity(quantityInput.valueAsNumber);
  };
  quantityInput.addEventListener('input', syncInputQuantity);
  quantityInput.addEventListener('change', syncInputQuantity);
  quantityInput.addEventListener('click', (ev) => ev.stopPropagation());
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (canBuy) {
      const accepted = onRecruit(quantity);
      if (accepted !== false) setQuantity(1);
    }
  });
  syncQuantityControls();
  row.appendChild(actions);

  return row;
}
