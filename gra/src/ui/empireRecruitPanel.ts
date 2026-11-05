/**
 * R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1 (część B) — panel „Rekrutacja — cała cywilizacja”.
 *
 * Jedno zamówienie dla całego państwa: przy każdym typie jednostki niezależny licznik (−/+/pole)
 * i własny przycisk „Rekrutuj”. Licznik NIE zeruje się po zamówieniu i nie dotyka innych typów.
 * Rozkład po miastach robi `game/empire-recruit-plan.ts` (wiring w main.ts); ten moduł to tylko UI.
 * Liczniki to stan UI sesji (poza zapisem gry) — zamówienia są zwykłymi wpisami kolejek miast.
 */

export interface EmpireRecruitUnitRow {
  id: string;
  label: string;
  /** Koszt złota jednej sztuki (jak w panelu miasta). */
  koszt: number;
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
  /** Wykonuje zamówienie; zwraca komunikat PL do pokazania w panelu. */
  onOrder: (unitId: string, quantity: number) => { message: string; changed: boolean };
}

const ROOT_ID = 'civ-empire-recruit-panel';
const STYLE_ID = 'civ-empire-recruit-panel-css';
const MAX_QTY = 999;

/** Liczniki per typ jednostki (niezależne; przeżywają odświeżenia i zamknięcie panelu). */
const drafts = new Map<string, number>();
let panelCfg: EmpireRecruitPanelCfg | null = null;
let lastMessage = '';

export function getEmpireRecruitDraft(unitId: string): number {
  return drafts.get(unitId) ?? 1;
}

function clampQty(n: number): number {
  return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, Math.round(n))) : 1;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
#${ROOT_ID}{position:fixed;top:84px;right:16px;z-index:330;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 140px);
  display:flex;flex-direction:column;background:linear-gradient(180deg,#161c28,#0a0d14);color:#e8e0c8;
  border:1px solid rgba(232,216,138,.45);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.6);
  font:13px var(--civ-font-ui,system-ui,sans-serif);pointer-events:auto;}
#${ROOT_ID} .erp-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;
  border-bottom:1px solid rgba(232,216,138,.25);}
#${ROOT_ID} .erp-title{font-weight:700;color:#e8d88a;font-size:14px;}
#${ROOT_ID} .erp-sub{padding:6px 12px 2px;font-size:11px;color:#9aa4b2;line-height:1.4;}
#${ROOT_ID} .erp-list{overflow-y:auto;padding:4px 8px 8px;}
#${ROOT_ID} .erp-row{display:flex;align-items:center;gap:8px;padding:6px 4px;border-top:1px solid #242c3a;}
#${ROOT_ID} .erp-row:first-child{border-top:none;}
#${ROOT_ID} .erp-info{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;}
#${ROOT_ID} .erp-name{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#${ROOT_ID} .erp-meta{font-size:11px;color:#9aa4b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#${ROOT_ID} .erp-meta b{color:#e8d88a;font-weight:700;}
#${ROOT_ID} .erp-row.is-blocked .erp-name{opacity:.55;}
#${ROOT_ID} .erp-qty{display:inline-flex;align-items:center;gap:2px;flex:none;}
#${ROOT_ID} button{font:inherit;cursor:pointer;color:#e8e0c8;background:#1a2230;border:1px solid #49566a;border-radius:5px;padding:3px 8px;}
#${ROOT_ID} button:hover:not(:disabled){background:#263246;}
#${ROOT_ID} button:disabled{opacity:.4;cursor:not-allowed;}
#${ROOT_ID} .erp-qty button{width:24px;padding:3px 0;}
#${ROOT_ID} .erp-qty input{width:42px;text-align:center;font:inherit;color:#e8e0c8;background:#0e131c;border:1px solid #49566a;border-radius:5px;padding:3px 2px;}
#${ROOT_ID} .erp-go{border-color:rgba(232,216,138,.6);color:#e8d88a;font-weight:600;}
#${ROOT_ID} .erp-msg{padding:6px 12px 9px;font-size:12px;color:#e8d88a;min-height:1.2em;border-top:1px solid rgba(232,216,138,.2);}
`;
  document.head.appendChild(st);
}

function render(root: HTMLElement): void {
  if (!panelCfg) return;
  const rows = panelCfg.getRows();
  const list = rows.map(r => {
    const q = getEmpireRecruitDraft(r.id);
    const blocked = r.capableCities <= 0;
    const meta = blocked
      ? esc(r.blockedReason ?? 'Brak miasta zdolnego do rekrutacji')
      : `${r.koszt} ¤ · miasta: <b>${r.capableCities}</b>/${r.totalCities} · w kolejkach: <b data-erp-queued>${r.queued}</b>`;
    return `<div class="erp-row${blocked ? ' is-blocked' : ''}" data-unit="${esc(r.id)}">`
      + `<div class="erp-info"><span class="erp-name" title="${esc(r.label)}">${esc(r.label)}</span>`
      + `<span class="erp-meta">${meta}</span></div>`
      + `<div class="erp-qty"><button type="button" data-erp="dec" aria-label="Zmniejsz liczbę ${esc(r.label)}"${q <= 1 ? ' disabled' : ''}>−</button>`
      + `<input type="number" min="1" max="${MAX_QTY}" step="1" value="${q}" data-erp="qty" aria-label="Liczba ${esc(r.label)}">`
      + `<button type="button" data-erp="inc" aria-label="Zwiększ liczbę ${esc(r.label)}"${q >= MAX_QTY ? ' disabled' : ''}>+</button></div>`
      + `<button type="button" class="erp-go" data-erp="go"${blocked ? ' disabled' : ''}>Rekrutuj</button>`
      + `</div>`;
  }).join('');
  root.innerHTML = `<div class="erp-hd"><span class="erp-title">Rekrutacja — cała cywilizacja</span>`
    + `<button type="button" data-erp="close" aria-label="Zamknij">Zamknij</button></div>`
    + `<div class="erp-sub">Zamówienie rozkłada się równomiernie na miasta, które mogą produkować dany typ. `
    + `Liczniki są niezależne i nie zerują się po „Rekrutuj”.</div>`
    + `<div class="erp-list">${list || '<div class="erp-meta" style="padding:10px 4px">Brak dostępnych jednostek wojskowych.</div>'}</div>`
    + `<div class="erp-msg" data-erp-msg role="status">${esc(lastMessage)}</div>`;
}

function onClick(ev: Event): void {
  const t = (ev.target as HTMLElement | null)?.closest('[data-erp]') as HTMLElement | null;
  const root = document.getElementById(ROOT_ID);
  if (!t || !root || !panelCfg) return;
  const act = t.getAttribute('data-erp');
  if (act === 'close') { closeEmpireRecruitPanel(); return; }
  const rowEl = t.closest('[data-unit]') as HTMLElement | null;
  const id = rowEl?.getAttribute('data-unit');
  if (!id) return;
  if (act === 'inc' || act === 'dec') {
    drafts.set(id, clampQty(getEmpireRecruitDraft(id) + (act === 'inc' ? 1 : -1)));
    render(root);
  } else if (act === 'go') {
    const res = panelCfg.onOrder(id, getEmpireRecruitDraft(id));
    lastMessage = res.message;
    render(root); // licznik zostaje (draft nie jest ruszany)
  }
}

function onInput(ev: Event): void {
  const t = ev.target as HTMLInputElement | null;
  if (!t || t.getAttribute('data-erp') !== 'qty') return;
  const id = (t.closest('[data-unit]') as HTMLElement | null)?.getAttribute('data-unit');
  if (!id) return;
  drafts.set(id, clampQty(t.valueAsNumber));
}

function onChange(ev: Event): void {
  const t = ev.target as HTMLInputElement | null;
  if (!t || t.getAttribute('data-erp') !== 'qty') return;
  const root = document.getElementById(ROOT_ID);
  if (root) render(root);
}

export function isEmpireRecruitPanelOpen(): boolean {
  return document.getElementById(ROOT_ID) !== null;
}

export function closeEmpireRecruitPanel(): void {
  document.getElementById(ROOT_ID)?.remove();
}

/** Odświeża listę (np. po zmianie kolejek/zasobów) — nie rusza liczników; pole w trakcie edycji zostaje. */
export function refreshEmpireRecruitPanel(): void {
  const root = document.getElementById(ROOT_ID);
  if (!root || !panelCfg) return;
  if (root.contains(document.activeElement) && (document.activeElement as HTMLElement).tagName === 'INPUT') return;
  render(root);
}

export function toggleEmpireRecruitPanel(cfg: EmpireRecruitPanelCfg): void {
  if (isEmpireRecruitPanelOpen()) { closeEmpireRecruitPanel(); return; }
  panelCfg = cfg;
  ensureStyles();
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Rekrutacja — cała cywilizacja');
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);
  document.body.appendChild(root);
  render(root);
}
