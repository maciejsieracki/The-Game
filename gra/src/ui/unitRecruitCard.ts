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

/**
 * CSS wstrzykiwany w cityPanel (scope .civ-cs).
 *
 * R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1 (wariant A, wybór właściciela 2026-10-23):
 * wiersz jednostki w JEDNEJ linii (≈ 32 px): ikona · kolumna tekstu · stepper · Rekrutuj.
 * Kolumna tekstu ma dwie drobne linie: [nazwa (wielokropek) … rekruci: potrzebne / brak N]
 * oraz [koszt: złoto + chipy surowców poziomo (+ utrzymanie) · typ · epoka].
 * Pula rekrutów PAŃSTWA jest jedną linią nad listą (`.unit-recruit-pool`,
 * cityPanel.renderPurchasableUnits), a wiersz niesie tylko „potrzebne” + „brak N”.
 * Wąski panel (280–340 px, cityUxFrame.ts min(24vw,340px)/min-width 280px) obsługują
 * container queries na samym wierszu (`container: urc / inline-size`).
 */
export const UNIT_RECRUIT_CARD_CSS = `
.civ-cs .unit-recruit-compact-row{display:flex;flex-wrap:nowrap;align-items:center;gap:0.3em;
  min-height:0;padding:0.14em 0.3em;margin-bottom:0.14em;overflow:hidden;
  container:urc / inline-size;}
.civ-cs .unit-recruit-compact-row.is-disabled{opacity:.78;}
.civ-cs .unit-recruit-compact-row .bld-compact-ic{width:1.4em;height:1.4em;flex:none;}
.civ-cs .unit-recruit-compact-row .bld-compact-ic svg{max-width:100%;max-height:100%;}
.civ-cs .unit-recruit-compact-row .unit-compact-text{flex:1 1 0;min-width:1.6em;display:flex;flex-direction:column;
  gap:0;line-height:1.12;overflow:hidden;}
.civ-cs .unit-recruit-compact-row .unit-compact-head{display:flex;align-items:baseline;flex-wrap:nowrap;gap:0.35em;min-width:0;}
.civ-cs .unit-recruit-compact-row .bld-compact-name{flex:0 1 auto;min-width:0;display:block;font-size:0.8em;}
.civ-cs .unit-recruit-compact-row .unit-compact-head .unit-recruit-manpower,
.civ-cs .unit-recruit-compact-row .unit-compact-head .unit-recruit-mp-cost{flex:none;margin-left:auto;font-size:0.64em;}
.civ-cs .unit-recruit-mp-cost{color:#d8cca8;white-space:nowrap;}
.civ-cs .unit-recruit-compact-row .unit-compact-sub{display:flex;align-items:center;flex-wrap:nowrap;gap:0.4em;min-width:0;
  overflow:hidden;white-space:nowrap;font-size:0.64em;line-height:1.25;}
.civ-cs .unit-recruit-compact-row .unit-compact-meta{flex:1 1 auto;min-width:0;font-size:0.9em;color:var(--muted);opacity:.85;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost{flex:0 0 auto;min-width:0;color:var(--muted);
  display:inline-flex;align-items:center;flex-wrap:nowrap;white-space:nowrap;gap:0.3em;font-variant-numeric:tabular-nums;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost .bld-infocard-chips{display:inline-flex;flex-wrap:nowrap;gap:0.2em;}
.civ-cs .unit-recruit-compact-row .unit-compact-cost .bld-infocard-chip{font-size:1em;padding:0 0.26em;border-radius:4px;line-height:1.3;white-space:nowrap;}
.civ-cs .unit-recruit-mp-ic{flex:none;display:inline-block;vertical-align:-0.1em;}
.civ-cs .unit-recruit-manpower{display:inline-flex;align-items:center;flex-wrap:nowrap;gap:0.14em;color:#d8cca8;white-space:nowrap;cursor:help;}
.civ-cs .unit-recruit-manpower.is-missing{color:#f0c0a8;font-weight:600;}
.civ-cs .unit-recruit-manpower-missing{color:#e88a7a;font-weight:700;margin-left:0.1em;}
.civ-cs .unit-recruit-pool{display:block;margin:0 0 0.3em;font-size:0.72em;color:#d8cca8;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;}
.civ-cs .unit-recruit-pool b{color:var(--text,#e8e0c8);font-weight:700;}
.civ-cs .unit-recruit-compact-row .bld-compact-actions{flex:none;display:inline-flex;align-items:center;gap:0.2em;margin-left:0;}
.civ-cs .unit-recruit-quantity{display:inline-flex;align-items:center;gap:0.16em;flex:none;order:-1;}
.civ-cs .unit-recruit-quantity-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.civ-cs .unit-recruit-quantity-control{display:inline-flex;align-items:center;gap:1px;}
.civ-cs .unit-recruit-compact-row .unit-recruit-quantity-button{width:1.3em;min-width:1.3em;padding:0.06em 0;line-height:1.1;font-size:0.74em;justify-content:center;}
.civ-cs .unit-recruit-quantity-input{width:2.1em;min-width:2.1em;padding:0.06em 0.06em;text-align:center;font-size:0.7em;line-height:1.1;-moz-appearance:textfield;}
.civ-cs .unit-recruit-quantity-input::-webkit-inner-spin-button,.civ-cs .unit-recruit-quantity-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
.civ-cs .unit-recruit-quantity-input:disabled,.civ-cs .unit-recruit-quantity-button:disabled{cursor:not-allowed;}
.civ-cs .unit-recruit-compact-row .unit-recruit-submit{min-width:0;padding:0.14em 0.36em;font-size:0.68em;justify-content:center;}
.civ-cs .unit-recruit-submit-ic{display:none;}
@container urc (max-width: 300px){
  .civ-cs .unit-recruit-compact-row .unit-compact-cost .unit-recruit-upkeep{display:none;}
  .civ-cs .unit-recruit-compact-row.is-disabled .unit-recruit-quantity{display:none;}
  .civ-cs .unit-recruit-compact-row .unit-recruit-submit{padding:0.14em 0.3em;}
  .civ-cs .unit-recruit-compact-row .unit-recruit-submit-label{display:none;}
  .civ-cs .unit-recruit-compact-row .unit-recruit-submit-ic{display:inline-block;}
}
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
  /** Optional display name override for special units using a normal unit model. */
  unitLabel?: string;
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
  disabledReason?: string;
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

/** Ikona „rekruci” (SVG, bez emoji — tokens.css:4). */
const MANPOWER_ICON_SVG = '<svg class="unit-recruit-mp-ic" viewBox="0 0 24 24" width="11" height="11" fill="none" '
  + 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<circle cx="12" cy="7" r="3.6"/><path d="M5 21c1-6.5 13-6.5 14 0"/></svg>';

/** Ikona przycisku „Rekrutuj” dla bardzo wąskiego wiersza (etykieta zostaje w DOM, aria-label i title). */
const SUBMIT_ICON_SVG = '<svg class="unit-recruit-submit-ic" viewBox="0 0 24 24" width="12" height="12" fill="none" '
  + 'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<circle cx="9" cy="7" r="3.5"/><path d="M2.5 21c1-6.2 12-6.2 13 0"/><path d="M19 8v6M16 11h6"/></svg>';

/** Pełny opis puli rekrutów dla jednostki — tooltip wskaźnika na wierszu. */
export function manpowerStatusTitle(available: number, required: number): string {
  const a = normalizedManpower(available);
  const r = normalizedManpower(required);
  const missing = Math.max(0, r - a);
  const base = `Rekruci: dostępne ${formatManpower(a)} / potrzebne ${formatManpower(r)}`;
  return missing > 0 ? `${base} — brakuje ${formatManpower(missing)}` : base;
}

/**
 * Wskaźnik rekrutów na wierszu (R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1): ikona + liczba
 * POTRZEBNYCH, a przy braku wyraźne „brak N” (kolor). Pula DOSTĘPNYCH to jedna
 * linia nad listą; pełny tekst „dostępne X / potrzebne Y” jest w `title`.
 * Atrybuty data-available/required/missing zostają (kontrakt
 * R-REKRUTACJA-KARTY-BRAK-REKRUTOW-Q1 i harnessy pr141).
 */
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
  status.title = manpowerStatusTitle(available, required);
  status.setAttribute('aria-label', status.title);
  status.insertAdjacentHTML('afterbegin', MANPOWER_ICON_SVG);
  const summary = el('span', 'unit-recruit-manpower-summary');
  summary.textContent = formatManpower(required);
  status.appendChild(summary);
  if (missing > 0) {
    const shortfall = el('span', 'unit-recruit-manpower-missing');
    shortfall.textContent = `brak ${formatManpower(missing)}`;
    status.appendChild(shortfall);
  }
  return status;
}

/** Kompaktowy wiersz jednostki (jedna linia) — ikona, nazwa+meta, koszt, rekruci, stepper, Rekrutuj. */
export function buildUnitRecruitCard(opts: UnitRecruitCardOpts): HTMLDivElement {
  const {
    udef, item, skarb, canPurchase, treasuryIconHtml, mpCost, mpCostLabel, unitLabel, disabledReason,
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

  // Kolumna tekstu w jednym wierszu karty, dwie drobne linie:
  //   linia 1 (.unit-compact-head): nazwa (wielokropek) … wskaźnik rekrutów (potrzebne / brak N);
  //   linia 2 (.unit-compact-sub):  koszt (złoto + chipy surowców poziomo [+ utrzymanie]) · meta
  //   (typ · epoka, P-NAZWY-JEDNOSTEK-MYLACO-PODOBNE) — meta ustępuje pierwsza.
  const text = el('div', 'unit-compact-text');
  const head = el('div', 'unit-compact-head');
  const name = el('span', 'bld-compact-name');
  name.textContent = unitLabel || item.nazwa;
  name.title = unitLabel || item.nazwa;
  head.appendChild(name);
  text.appendChild(head);
  const sub = el('div', 'unit-compact-sub');
  const meta = el('span', 'unit-compact-meta');
  meta.textContent = unitCompactMeta(udef, cat);
  meta.title = meta.textContent;
  text.appendChild(sub);
  row.appendChild(text);

  // Pierwszy węzeł tekstowy = koszt w złocie (harness pr141 czyta go jako goldCostText).
  const cost = el('div', 'unit-compact-cost');
  cost.innerHTML = `${item.koszt} ${treasuryIconHtml}`;
  if (stockChipsHtml) {
    const stock = el('span', 'bld-infocard-chips unit-recruit-stock');
    stock.innerHTML = stockChipsHtml;
    cost.appendChild(stock);
  }
  const manpowerStatus = buildManpowerStatus({
    available: manpowerAvailable,
    required: manpowerRequired,
  });
  if (manpowerStatus) {
    head.appendChild(manpowerStatus);
  } else if (mpCostLabel != null && mpCostLabel !== '0') {
    // Pula państwa nieznana: sam koszt rekrutów (ikona SVG zamiast dawnego emoji).
    const mpOnly = el('span', 'unit-recruit-mp-cost');
    mpOnly.title = 'Koszt rekrutów';
    mpOnly.innerHTML = `${MANPOWER_ICON_SVG}${mpCostLabel}`;
    head.appendChild(mpOnly);
  }
  if (resourceUpkeepChipsHtml) {
    const upkeep = el('span', 'bld-infocard-chips unit-recruit-upkeep');
    upkeep.title = 'Utrzymanie surowcowe na turę';
    upkeep.innerHTML = resourceUpkeepChipsHtml;
    cost.appendChild(upkeep);
  }
  sub.appendChild(cost);
  sub.appendChild(meta);

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
  btn.setAttribute('aria-label', 'Rekrutuj');
  btn.innerHTML = `${SUBMIT_ICON_SVG}<span class="unit-recruit-submit-label">Rekrutuj</span>`;
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
    const blockedReasons = [disabledReason, manpowerMissingLabel, stockMissingLabel].filter(
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
