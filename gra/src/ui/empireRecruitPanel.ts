/**
 * R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1 (część B) — panel „Rekrutacja — cała cywilizacja”.
 *
 * Jedno zamówienie dla całego państwa: przy każdym typie jednostki niezależny licznik (−/+/pole,
 * domyślnie 0) i własny przycisk „Rekrutuj”. Licznik NIE zeruje się po pojedynczym „Rekrutuj”
 * i nie dotyka innych typów.
 * R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-Q1: górny przycisk „Rekrutuj wszystkie”
 * zamawia każdy typ z licznikiem > 0 przez TĘ SAMĄ ścieżkę `onOrder`. Typy przyjęte (w całości)
 * wracają do 0; typy odrzucone lub przyjęte częściowo zachowują pozostałą liczbę do ponowienia.
 * Rozkład po miastach robi `game/empire-recruit-plan.ts` (wiring w main.ts); ten moduł to tylko UI.
 * Liczniki to stan UI sesji (poza zapisem gry) — zamówienia są zwykłymi wpisami kolejek miast.
 * R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1: panel NIE jest już oknem modalnym — to sekcja osadzana
 * w panelu armii (empireDetailPanel.ts, „Rekrutacja”, nad wodzem). Host: `[data-erp-root]`, montowany przez
 * `mountEmpireRecruitSection`. Przycisk w górnym pasku usunięty.
 */

import { summarizeEmpireRecruitBasket, type RecruitBasketBudget, type RecruitBasketSummary } from '../game/empire-recruit-plan';
import { stockResourceLabel } from '../game/building-stock-cost';

export interface EmpireRecruitUnitRow {
  id: string;
  label: string;
  /** Koszt złota jednej sztuki (jak w panelu miasta). */
  koszt: number;
  manpowerCost?: number;
  stockCost?: Readonly<Record<string, number>>;
  /** Ile miast gracza może teraz produkować ten typ / ile miast ma gracz. */
  capableCities: number;
  totalCities: number;
  /** „Stan zamówienia”: ile sztuk tego typu stoi w kolejkach rekrutacji całej cywilizacji. */
  queued: number;
  /** Gdy żadne miasto nie może — powód (PL). */
  blockedReason?: string;
}

export interface EmpireRecruitPanelCfg {
  getRows: () => EmpireRecruitUnitRow[];
  getBudget?: () => RecruitBasketBudget;
  /** Wykonuje zamówienie; zwraca komunikat PL do pokazania w panelu. */
  /** `accepted` = ile sztuk faktycznie przyjęto (do częściowego sukcesu w „Rekrutuj wszystkie”). */
  onOrder: (unitId: string, quantity: number) => { message: string; changed: boolean; accepted?: number };
  /**
   * R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1: własni żywi generałowie do wyboru jako „rekrutujący”.
   * Bez wybranego generała panel nie rekrutuje (przyciski nieaktywne); nowe jednostki idą do wybranego.
   */
  getGenerals?: () => { id: string; label: string }[];
  getSelectedGeneralId?: () => string | null;
  onSelectGeneral?: (id: string | null) => void;
}

const HOST_SELECTOR = '[data-erp-root]';
const STYLE_ID = 'civ-empire-recruit-panel-css';
const MAX_QTY = 999;
const DEFAULT_QTY = 0;

/** Liczniki per typ jednostki (niezależne; przeżywają odświeżenia, zerowane przy zamknięciu panelu). */
const drafts = new Map<string, number>();
let panelCfg: EmpireRecruitPanelCfg | null = null;
let lastMessage = '';

export function getEmpireRecruitDraft(unitId: string): number {
  return drafts.get(unitId) ?? DEFAULT_QTY;
}

function clampQty(n: number): number {
  return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(0, Math.round(n))) : 0;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
${HOST_SELECTOR}{display:flex;flex-direction:column;background:linear-gradient(180deg,#161c28,#0a0d14);color:#e8e0c8;
  border:1px solid rgba(232,216,138,.45);border-radius:8px;padding:0 0 4px;margin:10px 0;
  font:13px var(--civ-font-ui,system-ui,sans-serif);min-width:0;max-width:100%;box-sizing:border-box;}
${HOST_SELECTOR} .erp-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;
  border-bottom:1px solid rgba(232,216,138,.25);}
${HOST_SELECTOR} .erp-title{font-weight:700;color:#e8d88a;font-size:13px;}
${HOST_SELECTOR} .erp-sub{padding:6px 12px 2px;font-size:11px;color:#9aa4b2;line-height:1.4;}
${HOST_SELECTOR} .erp-list{flex:none;padding:4px 8px 8px;}
${HOST_SELECTOR} .erp-row{display:flex;align-items:center;gap:8px;padding:6px 4px;border-top:1px solid #242c3a;}
${HOST_SELECTOR} .erp-row:first-child{border-top:none;}
${HOST_SELECTOR} .erp-info{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
${HOST_SELECTOR} .erp-name{font-weight:600;white-space:normal;overflow-wrap:anywhere;}
${HOST_SELECTOR} .erp-meta{font-size:11px;color:#9aa4b2;white-space:normal;overflow-wrap:anywhere;line-height:1.3;}
${HOST_SELECTOR} .erp-queued{font-size:11px;color:#9aa4b2;white-space:normal;line-height:1.3;}
${HOST_SELECTOR} .erp-selected{font-size:11px;color:#b5bfca;white-space:normal;line-height:1.3;}
${HOST_SELECTOR} .erp-meta b,${HOST_SELECTOR} .erp-queued b{color:#e8d88a;font-weight:700;}
${HOST_SELECTOR} .erp-selected b{color:#d7e2f0;font-weight:700;}
${HOST_SELECTOR} .erp-row.is-blocked .erp-name{opacity:.55;}
${HOST_SELECTOR} .erp-summary{padding:7px 12px;border-top:1px solid rgba(232,216,138,.2);font-size:11px;line-height:1.4;color:#b5bfca;}
${HOST_SELECTOR} .erp-summary b{color:#e8d88a;}
${HOST_SELECTOR} .erp-shortfall{display:block;color:#ff8d84;font-size:11px;line-height:1.3;margin-top:2px;}
${HOST_SELECTOR} .erp-shortfall:empty{display:none;}
${HOST_SELECTOR} .erp-go.is-shortfall,${HOST_SELECTOR} .erp-all button.is-shortfall{border-color:#ed6258;color:#ff8d84;box-shadow:0 0 0 1px rgba(237,98,88,.18) inset;}
${HOST_SELECTOR} .erp-all.has-shortfall{background:rgba(237,98,88,.06);}
${HOST_SELECTOR} .erp-qty{display:inline-flex;align-items:center;gap:2px;flex:none;}
${HOST_SELECTOR} button{font:inherit;cursor:pointer;color:#e8e0c8;background:#1a2230;border:1px solid #49566a;border-radius:5px;padding:3px 8px;}
${HOST_SELECTOR} button:hover:not(:disabled){background:#263246;}
${HOST_SELECTOR} button:disabled{opacity:.4;cursor:not-allowed;}
${HOST_SELECTOR} .erp-qty button{width:24px;padding:3px 0;}
${HOST_SELECTOR} .erp-qty input{width:42px;text-align:center;font:inherit;color:#e8e0c8;background:#0e131c;border:1px solid #49566a;border-radius:5px;padding:3px 2px;}
${HOST_SELECTOR} .erp-go{border-color:rgba(232,216,138,.6);color:#e8d88a;font-weight:600;}
${HOST_SELECTOR} .erp-all{padding:6px 12px;border-top:1px solid rgba(232,216,138,.2);}
${HOST_SELECTOR} .erp-all button{width:100%;border-color:rgba(232,216,138,.6);color:#e8d88a;font-weight:700;padding:6px 8px;}
${HOST_SELECTOR} .erp-gen{padding:6px 12px;border-top:1px solid rgba(232,216,138,.2);display:flex;flex-direction:column;gap:4px;}
${HOST_SELECTOR} .erp-gen-title{font-weight:700;color:#e8d88a;}
${HOST_SELECTOR} .erp-gen button{display:flex;align-items:center;gap:6px;text-align:left;width:100%;box-sizing:border-box;}
${HOST_SELECTOR} .erp-gen button.is-selected{border-color:rgba(232,216,138,.9);background:rgba(232,216,138,.14);}
${HOST_SELECTOR} .erp-gen-badge{margin-left:auto;font-size:11px;color:#e8d88a;white-space:nowrap;}
${HOST_SELECTOR} .erp-gen-warn{font-size:12px;color:#e8a08a;}
${HOST_SELECTOR} .erp-msg{padding:6px 12px 9px;font-size:12px;color:#e8d88a;min-height:1.2em;border-top:1px solid rgba(232,216,138,.2);}
`;
  document.head.appendChild(st);
}

/** Ostatni HTML zbudowany dla danego hosta (pomija zbędną przebudowę DOM przy odświeżaniu). */
const lastHtmlByHost = new WeakMap<HTMLElement, string>();

function fmtAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.ceil(n));
}

function basketShortfallText(summary: RecruitBasketSummary): string {
  const parts: string[] = [];
  if (summary.goldShortfall > 0) parts.push(`brakuje ${fmtAmount(summary.goldShortfall)} ¤`);
  if (summary.manpowerShortfall > 0) parts.push(`brakuje ${fmtAmount(summary.manpowerShortfall)} rekrutów`);
  for (const [key, amount] of Object.entries(summary.stockShortfall)) {
    parts.push(`brakuje ${fmtAmount(amount)} ${stockResourceLabel(key)}`);
  }
  return parts.join(' · ');
}

function syncAffordability(root: HTMLElement): void {
  if (!panelCfg) return;
  const rows = panelCfg.getRows();
  for (const row of rows) if (row.capableCities <= 0) drafts.set(row.id, 0);
  const budget = panelCfg.getBudget?.();
  const byId = new Map(rows.map(r => [r.id, r]));
  const basket = budget ? summarizeEmpireRecruitBasket(rows.filter(r => r.capableCities > 0).map(r => ({
    quantity: getEmpireRecruitDraft(r.id), unitGold: r.koszt,
    unitManpower: r.manpowerCost ?? 0, unitStock: r.stockCost,
  })), budget) : null;
  const queuedTotal = rows.reduce((sum, r) => sum + Math.max(0, Math.floor(r.queued || 0)), 0);
  const summaryEl = root.querySelector<HTMLElement>('[data-erp-summary]');
  if (summaryEl) {
    const selected = basket?.quantity ?? rows.reduce((sum, r) => sum + (r.capableCities > 0 ? getEmpireRecruitDraft(r.id) : 0), 0);
    const stockLine = budget && basket
      ? Object.keys(basket.stockNeeded).sort().map(k =>
        `${stockResourceLabel(k)} ${basket.stockNeeded[k]} / ${Math.floor(budget.stockPool?.[k] ?? 0)}`,
      ).join(' · ')
      : '';
    const budgetLine = budget && basket
      ? `Koszyk: ${basket.goldNeeded} ¤ / ${Math.floor(budget.gold)} ¤ · ${basket.manpowerNeeded} rekrutów / ${Math.floor(budget.manpower)} dostępnych${stockLine ? ` · ${stockLine}` : ''}`
      : '';
    const shortfall = basket && !basket.affordable ? basketShortfallText(basket) : '';
    summaryEl.innerHTML = `<span>Już w kolejkach: <b>${queuedTotal}</b> · Wybrane w koszyku: <b>${selected}</b></span>`
      + (budgetLine ? `<br>${esc(budgetLine)}` : '')
      + `<span class="erp-shortfall" data-erp-basket-shortfall>${esc(shortfall)}</span>`;
  }
  const allWrap = root.querySelector<HTMLElement>('.erp-all');
  const allButton = root.querySelector<HTMLButtonElement>('[data-erp="go-all"]');
  const basketShort = basket !== null && basket.quantity > 0 && !basket.affordable;
  allWrap?.classList.toggle('has-shortfall', basketShort);
  if (allButton) {
    allButton.classList.toggle('is-shortfall', basketShort);
    allButton.setAttribute('aria-label', basketShort
      ? `Rekrutuj wszystkie; ${basket ? basketShortfallText(basket) : ''}`
      : 'Rekrutuj wszystkie');
  }
  root.querySelectorAll<HTMLElement>('[data-unit]').forEach(rowEl => {
    const id = rowEl.getAttribute('data-unit') ?? '';
    const row = byId.get(id);
    const qty = row && row.capableCities > 0 ? getEmpireRecruitDraft(id) : 0;
    const shortEl = rowEl.querySelector<HTMLElement>('[data-erp-row-shortfall]');
    const selectedEl = rowEl.querySelector<HTMLElement>('[data-erp-selected]');
    const go = rowEl.querySelector<HTMLButtonElement>('[data-erp="go"]');
    if (selectedEl) selectedEl.textContent = String(qty);
    if (!row || row.capableCities <= 0 || !budget || qty <= 0) {
      if (shortEl) shortEl.textContent = '';
      go?.classList.remove('is-shortfall');
      if (go) go.setAttribute('aria-label', `Rekrutuj ${row?.label ?? id}`);
      return;
    }
    const rowSummary = summarizeEmpireRecruitBasket([{
      quantity: qty, unitGold: row.koszt, unitManpower: row.manpowerCost ?? 0, unitStock: row.stockCost,
    }], budget);
    const warning = rowSummary.affordable ? '' : basketShortfallText(rowSummary);
    if (shortEl) shortEl.textContent = warning;
    go?.classList.toggle('is-shortfall', warning.length > 0);
    if (go) go.setAttribute('aria-label', warning ? `Rekrutuj ${row.label}; ${warning}` : `Rekrutuj ${row.label}`);
  });
}

/** Czy panel ma wymóg wyboru generała i żaden nie jest wybrany (rekrutacja wyłączona). */
function recruitingBlockedByGeneral(): boolean {
  return !!panelCfg?.getGenerals && !panelCfg.getSelectedGeneralId?.();
}

function generalsHtml(): string {
  if (!panelCfg?.getGenerals) return '';
  const gens = panelCfg.getGenerals();
  const sel = panelCfg.getSelectedGeneralId?.() ?? null;
  const items = gens.map(g => {
    const on = g.id === sel;
    return `<button type="button" data-erp="gen" data-gen="${esc(g.id)}" class="${on ? 'is-selected' : ''}" aria-pressed="${on}">`
      + `<span aria-hidden="true">★</span><span>${esc(g.label)}</span>${on ? '<span class="erp-gen-badge">rekrutuje</span>' : ''}</button>`;
  }).join('');
  const warn = gens.length === 0
    ? 'Brak generała — zrekrutuj generała (w stolicy), aby włączyć rekrutację z tego panelu.'
    : (sel ? '' : 'Wybierz generała rekrutującego — bez niego rekrutacja z tego panelu jest wyłączona.');
  return `<div class="erp-gen" data-erp-gens><span class="erp-gen-title">Generał rekrutujący</span>${items}`
    + `${warn ? `<span class="erp-gen-warn" data-erp-gen-warn>${esc(warn)}</span>` : ''}`
    + `<span class="erp-meta">Nowe jednostki z tego panelu idą do wybranego generała.</span></div>`;
}

function render(root: HTMLElement, force = true): void {
  if (!panelCfg) return;
  const blockedGen = recruitingBlockedByGeneral();
  const rows = panelCfg.getRows();
  for (const row of rows) if (row.capableCities <= 0) drafts.set(row.id, 0);
  const total = rows.reduce((sum, r) => sum + (r.capableCities > 0 ? getEmpireRecruitDraft(r.id) : 0), 0);
  const allBtn = `<button type="button" class="erp-go-all" data-erp="go-all"${total <= 0 || blockedGen ? ' disabled' : ''}>Rekrutuj wszystkie</button>`;
  const list = rows.map(r => {
    const orderable = r.capableCities > 0;
    const q = orderable ? getEmpireRecruitDraft(r.id) : 0;
    const blocked = !orderable;
    const meta = blocked
      ? esc(r.blockedReason ?? 'Brak miasta zdolnego do rekrutacji')
      : `${r.koszt} ¤ · miasta: <b>${r.capableCities}</b>/${r.totalCities}`;
    // „Stan zamówienia” w osobnej linii (zawsze widoczny, także przy blokadzie i długich nazwach/kosztach).
    const queuedLine = `<span class="erp-queued">w kolejkach: <b data-erp-queued>${r.queued}</b></span>`;
    return `<div class="erp-row${blocked ? ' is-blocked' : ''}" data-unit="${esc(r.id)}">`
      + `<div class="erp-info"><span class="erp-name" title="${esc(r.label)}">${esc(r.label)}</span>`
      + `<span class="erp-meta">${meta}</span>${queuedLine}<span class="erp-selected">wybrane w koszyku: <b data-erp-selected>${q}</b></span>`
      + `<span class="erp-shortfall" data-erp-row-shortfall></span></div>`
      + `<div class="erp-qty"><button type="button" data-erp="dec" aria-label="Zmniejsz liczbę ${esc(r.label)}"${!orderable || q <= 0 ? ' disabled' : ''}>−</button>`
      + `<input type="number" min="0" max="${MAX_QTY}" step="1" value="${q}" data-erp="qty" aria-label="Liczba ${esc(r.label)}"${!orderable ? ' disabled' : ''}>`
      + `<button type="button" data-erp="inc" aria-label="Zwiększ liczbę ${esc(r.label)}"${!orderable || q >= MAX_QTY ? ' disabled' : ''}>+</button></div>`
      + `<button type="button" class="erp-go" data-erp="go"${blocked || q <= 0 || blockedGen ? ' disabled' : ''}>Rekrutuj</button>`
      + `</div>`;
  }).join('');
  const html = `<div class="erp-hd"><span class="erp-title">Rekrutacja — cała cywilizacja</span></div>`
    + `<div class="erp-all">${allBtn}</div>`
    + `<div class="erp-sub">Zamówienie rozkłada się równomiernie na miasta, które mogą produkować dany typ. `
    + `Pojedyncze „Rekrutuj” nie zeruje licznika. „Rekrutuj wszystkie” zamawia każdy typ z licznikiem &gt; 0 `
    + `i zeruje przyjęte pozycje.</div>`
    + generalsHtml()
    + `<div class="erp-summary" data-erp-summary></div>`
    + `<div class="erp-list">${list || '<div class="erp-meta" style="padding:10px 4px">Brak dostępnych jednostek wojskowych.</div>'}</div>`
    + `<div class="erp-msg" data-erp-msg role="status">${esc(lastMessage)}</div>`;
  if (!force && html === lastHtmlByHost.get(root)) return; // updateHud woła często — bez zbędnej przebudowy DOM
  lastHtmlByHost.set(root, html);
  root.innerHTML = html; // przewijanie zostaje w panelu armii (jedno zewnętrzne przewijanie)
  syncAffordability(root);
}

/**
 * Host, który jest aktualnie w DOM. `onOrder`/`onSelectGeneral` wywołują `markCityStateDirty`, co
 * SYNCHRONICZNIE przebudowuje panel armii — węzeł `root` z chwili kliknięcia jest wtedy odłączony
 * i render na nim nie byłby widoczny (gubił komunikat i licznik „Rekrutuj wszystkie”).
 */
function liveHost(root: HTMLElement): HTMLElement | null {
  if (root.isConnected) return root;
  return document.querySelector<HTMLElement>(HOST_SELECTOR);
}

function onClick(ev: Event): void {
  const root = ev.currentTarget as HTMLElement | null;
  const t = (ev.target as HTMLElement | null)?.closest('[data-erp]') as HTMLElement | null;
  if (!t || !root || !panelCfg) return;
  const act = t.getAttribute('data-erp');
  if (act === 'go-all') { orderAll(root); return; }
  if (act === 'gen') {
    const gid = t.getAttribute('data-gen');
    const cur = panelCfg.getSelectedGeneralId?.() ?? null;
    panelCfg.onSelectGeneral?.(gid && gid !== cur ? gid : null); // ponowny klik w wybranego = odznacz
    lastMessage = '';
    const host = liveHost(root);
    if (host) render(host);
    return;
  }
  const rowEl = t.closest('[data-unit]') as HTMLElement | null;
  const id = rowEl?.getAttribute('data-unit');
  if (!id) return;
  const currentRow = panelCfg.getRows().find(row => row.id === id);
  if (!currentRow || currentRow.capableCities <= 0) {
    drafts.set(id, 0);
    syncControls(root, false);
    syncAffordability(root);
    return;
  }
  if (act === 'inc' || act === 'dec') {
    drafts.set(id, clampQty(getEmpireRecruitDraft(id) + (act === 'inc' ? 1 : -1)));
    syncControls(root, false);
    syncAffordability(root);
  } else if (act === 'go') {
    const res = panelCfg.onOrder(id, getEmpireRecruitDraft(id));
    lastMessage = res.message;
    const host = liveHost(root);
    if (host) render(host); // licznik zostaje (draft nie jest ruszany)
  }
}

/**
 * „Rekrutuj wszystkie”: zamawia każdy typ z licznikiem > 0 kolejno przez `onOrder` (ta sama ścieżka co
 * pojedyncze „Rekrutuj”, więc koszt/limity/kolejność miast bez zmian; saldo odświeża się między typami).
 * Udane typy → licznik 0; odrzucone → licznik bez zmian; częściowe → licznik = pozostałe sztuki.
 */
function orderAll(root: HTMLElement): void {
  if (!panelCfg) return;
  const todo = panelCfg.getRows()
    .filter(r => r.capableCities > 0)
    .map(r => ({ id: r.id, label: r.label, q: getEmpireRecruitDraft(r.id) }))
    .filter(x => x.q > 0);
  if (todo.length === 0) return;
  let okTypes = 0;
  const failed: string[] = [];
  for (const t of todo) {
    const res = panelCfg.onOrder(t.id, t.q);
    const accepted = res.accepted ?? (res.changed ? t.q : 0);
    if (accepted >= t.q) { drafts.set(t.id, 0); okTypes++; }
    else {
      drafts.set(t.id, clampQty(t.q - accepted));
      if (accepted > 0) okTypes++;
      failed.push(`${t.label}: ${res.message}`);
    }
  }
  const head = `Rekrutacja wszystkich: przyjęto ${okTypes} z ${todo.length} pozycji.`;
  lastMessage = failed.length > 0 ? `${head} Nie przeszło — ${failed.join(' ')}` : head;
  const host = liveHost(root);
  if (host) render(host);
}

/**
 * Odświeża tylko stan przycisków (disabled) i wartość pola — BEZ przebudowy DOM. Przebudowa między
 * mousedown a mouseup (np. blur pola po wpisaniu liczby odpala change) gubiła kliknięcie przycisku.
 * `keepInput` = true podczas pisania: pole zostaje takie, jak wpisał gracz.
 */
function syncControls(root: HTMLElement, keepInput: boolean): void {
  if (!panelCfg) return;
  const rows = panelCfg.getRows();
  for (const row of rows) if (row.capableCities <= 0) drafts.set(row.id, 0);
  const total = rows.reduce((sum, r) => sum + (r.capableCities > 0 ? getEmpireRecruitDraft(r.id) : 0), 0);
  const blockedGen = recruitingBlockedByGeneral();
  root.querySelectorAll<HTMLButtonElement>('[data-erp="go-all"]').forEach(b => { b.disabled = total <= 0 || blockedGen; });
  root.querySelectorAll<HTMLElement>('[data-unit]').forEach(rowEl => {
    const id = rowEl.getAttribute('data-unit') ?? '';
    const q = getEmpireRecruitDraft(id);
    const blocked = rowEl.classList.contains('is-blocked');
    const dec = rowEl.querySelector<HTMLButtonElement>('[data-erp="dec"]');
    const inc = rowEl.querySelector<HTMLButtonElement>('[data-erp="inc"]');
    const go = rowEl.querySelector<HTMLButtonElement>('[data-erp="go"]');
    const input = rowEl.querySelector<HTMLInputElement>('[data-erp="qty"]');
    if (dec) dec.disabled = blocked || q <= 0;
    if (inc) inc.disabled = blocked || q >= MAX_QTY;
    if (go) go.disabled = blocked || q <= 0 || blockedGen;
    if (input) input.disabled = blocked;
    if (input && !keepInput) input.value = String(q);
  });
}

function onInput(ev: Event): void {
  const t = ev.target as HTMLInputElement | null;
  if (!t || t.getAttribute('data-erp') !== 'qty') return;
  const id = (t.closest('[data-unit]') as HTMLElement | null)?.getAttribute('data-unit');
  const root = ev.currentTarget as HTMLElement | null;
  if (!id || !root) return;
  const currentRow = panelCfg?.getRows().find(row => row.id === id);
  if (!currentRow || currentRow.capableCities <= 0) {
    drafts.set(id, 0);
    syncControls(root, false);
    syncAffordability(root);
    return;
  }
  drafts.set(id, clampQty(t.valueAsNumber));
  syncControls(root, true); // przyciski reagują od razu, zanim gracz kliknie gdziekolwiek indziej
  syncAffordability(root);
}

function onChange(ev: Event): void {
  const t = ev.target as HTMLInputElement | null;
  if (!t || t.getAttribute('data-erp') !== 'qty') return;
  const id = (t.closest('[data-unit]') as HTMLElement | null)?.getAttribute('data-unit');
  const root = ev.currentTarget as HTMLElement | null;
  if (!id || !root) return;
  const currentRow = panelCfg?.getRows().find(row => row.id === id);
  if (!currentRow || currentRow.capableCities <= 0) {
    drafts.set(id, 0);
    syncControls(root, false);
    syncAffordability(root);
    return;
  }
  drafts.set(id, clampQty(t.valueAsNumber)); // np. 999+ lub wartość ujemna → przycięta
  syncControls(root, false);
  syncAffordability(root);
}

/** Konfiguracja wiringu z main.ts (getRows/onOrder/generałowie). Wołane raz w boot(); przeżywa wczytanie/nową grę. */
export function configureEmpireRecruitPanel(cfg: EmpireRecruitPanelCfg): void {
  panelCfg = cfg;
}

/** Zeruje liczniki i komunikat (zamknięcie panelu armii, nowa gra / wczytanie). */
export function resetEmpireRecruitDrafts(): void {
  drafts.clear();
  lastMessage = '';
}

/** Nowa gra / wczytanie: czyści stan UI (liczniki, komunikat, domknięcie getRows/onOrder). */
export function resetEmpireRecruitPanelSession(): void {
  drafts.clear();
  // panelCfg NIE jest czyszczony: to domknięcia nad żywym stanem gry (getRows/onOrder czytają bieżące
  // globalne), wiązane raz w boot(). Wyzerowanie gubiło sekcję po wczytaniu zapisu / nowej grze.
  lastMessage = '';
  document.querySelectorAll<HTMLElement>(HOST_SELECTOR).forEach(host => { host.innerHTML = ''; });
}

/**
 * Podpina i rysuje sekcję rekrutacji całej cywilizacji w hoście `[data-erp-root]` (panel armii).
 * Host jest tworzony od nowa przy każdej przebudowie panelu armii, więc zdarzenia wiążą się do świeżego węzła.
 */
export function mountEmpireRecruitSection(host: HTMLElement | null): void {
  if (!host || !panelCfg) return;
  ensureStyles();
  host.addEventListener('click', onClick);
  host.addEventListener('input', onInput);
  host.addEventListener('change', onChange);
  render(host, true);
}

/** Odświeża sekcję w panelu armii (np. po zmianie kolejek/zasobów) — nie rusza liczników; pole w edycji zostaje. */
export function refreshEmpireRecruitPanel(): void {
  if (!panelCfg) return;
  const root = document.querySelector<HTMLElement>(HOST_SELECTOR);
  if (!root) return;
  if (root.contains(document.activeElement) && (document.activeElement as HTMLElement).tagName === 'INPUT') return;
  render(root, false);
}
