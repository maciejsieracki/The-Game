/**
 * interHumanDiplomacyHud.ts — R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1 (Etap 8 część ii).
 *
 * Ekran „skrzynka propozycji" + „złóż nową propozycję" MIĘDZY dwoma fotelami
 * LUDZKIMI hot-seatu. Wzorzec stylistyczny 1:1 z `diplomacyPendingHud.ts`
 * (modal AI→gracz): DOM `position:fixed;inset:0` overlay + `.civ-dip-box`,
 * style ze wspólnego `diploUiSkin.ts` (`DIPLO_1E_SHARED_CSS`, `dipBrandIconHtml`,
 * `dipCloseBtnHtml`). NOWY, dedykowany plik (ABC-Q4) — zero zmian w
 * `diplomacyPanel.ts`/`diplomacyPendingHud.ts`.
 *
 * Warstwa danych (main.ts, część i, R-HOTSEAT-ETAP8-DYPLOMACJA-DANE-Q1) jest
 * gotowa — ten moduł jest CZYSTYM DOM/renderem, zero logiki traktatu. Silnik
 * (main.ts) dostarcza dane przez `InterHumanDiplomacyHudConfig` i odbiera
 * zamiary gracza przez callbacki `onAccept`/`onReject`/`onCounter`/`onPropose`;
 * main.ts woła PRODUKCYJNE `proposeToHuman`/`respondToHumanProposal` i
 * odświeża ten HUD wywołując `showInterHumanDiplomacyHud()` ponownie ze
 * świeżymi danymi (dokładnie jak `showDiplomacyPendingModal` nadpisuje samo
 * siebie — `hideInterHumanDiplomacyHud()` na starcie `show*`).
 */

import { DIPLO_1E_SHARED_CSS, dipBrandIconHtml, dipCloseBtnHtml, ensureDiploBrandScope } from './diploUiSkin';

/** ABC-Q3: istniejące traktaty 1:1, zero nowych wariantów — te 4 kwalifikują się
 *  do propozycji ADRESOWANEJ do konkretnej osoby (nie jednostronne akcje wrogie). */
export type InterHumanProposalKind =
  | 'zaproponuj_pokoj'
  | 'zaproponuj_sojusz'
  | 'zaproponuj_pakt'
  | 'zaproponuj_audiencje';

const KIND_ORDER: readonly InterHumanProposalKind[] = [
  'zaproponuj_pokoj', 'zaproponuj_sojusz', 'zaproponuj_pakt', 'zaproponuj_audiencje',
];

/** Pola formularza — nadzbiór pól wszystkich 4 wariantów; silnik (main.ts) wybiera
 *  z nich te właściwe dla `kind`, budując `AIDiplomacyCommand`. */
export interface InterHumanProposalFields {
  powod: string;
  allianceKind?: 'defensywny' | 'pelny';
  turns?: number;
  motive?: string;
}

/** Jedna pozycja skrzynki odbiorczej — silnik dostarcza już sformatowany tekst
 *  (`detail`) i surowe `fields` (do prefillu formularza kontrpropozycji). */
export interface InterHumanDiplomacyProposalView {
  id: string;
  fromLabel: string;
  kind: InterHumanProposalKind;
  detail: string;
  fields: InterHumanProposalFields;
}

export interface InterHumanDiplomacyHudConfig {
  /** Etykieta drugiego fotela (adresata nowej propozycji). */
  otherLabel: string;
  /** Propozycje zaadresowane do AKTYWNEGO fotela (`getInterHumanProposalsFor`). */
  proposals: readonly InterHumanDiplomacyProposalView[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCounter: (id: string, kind: InterHumanProposalKind, fields: InterHumanProposalFields) => void;
  onPropose: (kind: InterHumanProposalKind, fields: InterHumanProposalFields) => void;
  onClose?: () => void;
}

const STYLE_ID = 'civ-inter-human-diplo-css-1a';

function ensureStyles(): void {
  ensureDiploBrandScope();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-ihd-overlay{position:fixed;inset:0;z-index:825;display:flex;align-items:center;justify-content:center;
  background:rgba(5,6,10,.82);font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
.civ-ihd-box{width:min(560px,92vw);max-height:86vh;overflow-y:auto;
  background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;box-shadow:0 16px 44px rgba(0,0,0,.7);}
.civ-ihd-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;}
.civ-ihd-head h2{margin:0;font-family:Georgia,serif;font-size:1.1em;color:#e8d88a;display:flex;align-items:center;gap:8px;}
.civ-ihd-head h2 .dip-ic{width:20px;height:20px;}
.civ-ihd-box h3{margin:16px 0 8px;font-size:0.82em;letter-spacing:.06em;text-transform:uppercase;color:#c8b898;}
.civ-ihd-empty{font-size:0.86em;color:#8a8070;margin:0 0 8px;}
.civ-ihd-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;}
.civ-ihd-item{border:1px solid rgba(232,216,138,.22);border-radius:8px;padding:10px 12px;background:rgba(255,255,255,.02);}
.civ-ihd-item-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;color:#e8d88a;}
.civ-ihd-kind{font-size:0.7em;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#b8d4e8;}
.civ-ihd-detail{margin:6px 0 8px;font-size:0.86em;color:#c8b898;line-height:1.4;}
.civ-ihd-item-actions{display:flex;gap:6px;flex-wrap:wrap;}
.civ-ihd-item-actions button{flex:1;min-width:88px;padding:7px;font-size:0.72em;}
.civ-ihd-counter-form{margin-top:10px;padding-top:10px;border-top:1px dashed rgba(232,216,138,.25);}
.civ-ihd-field{display:block;margin:0 0 8px;font-size:0.76em;color:#c8b898;}
.civ-ihd-field span{display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em;font-size:0.9em;}
.civ-ihd-field input,.civ-ihd-field select,.civ-ihd-field textarea{width:100%;box-sizing:border-box;
  background:rgba(255,255,255,.05);border:1px solid rgba(232,216,138,.3);border-radius:6px;
  color:#e8e0c8;padding:6px 8px;font:inherit;font-size:0.95em;}
.civ-ihd-new-fields{margin-top:8px;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let root: HTMLDivElement | null = null;

export function isInterHumanDiplomacyHudOpen(): boolean {
  return root !== null;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function kindLabel(kind: InterHumanProposalKind): string {
  if (kind === 'zaproponuj_pokoj') return 'Pokój';
  if (kind === 'zaproponuj_sojusz') return 'Sojusz';
  if (kind === 'zaproponuj_pakt') return 'Pakt nieagresji';
  return 'Audiencja';
}

function kindIconId(kind: InterHumanProposalKind): string {
  if (kind === 'zaproponuj_pokoj') return 'dip-peace';
  if (kind === 'zaproponuj_sojusz') return 'dip-alliance';
  if (kind === 'zaproponuj_pakt') return 'dip-pact';
  return 'tb-diplomacy';
}

/** Renderuje pola formularza właściwe dla `kind`, z prefillem `fields`. */
function fieldsHtml(kind: InterHumanProposalKind, fields: InterHumanProposalFields): string {
  let html = `<label class="civ-ihd-field"><span>Powód</span>`
    + `<input type="text" class="ihd-f-powod" value="${esc(fields.powod ?? '')}" placeholder="np. koniec konfliktu"></label>`;
  if (kind === 'zaproponuj_sojusz') {
    const ak = fields.allianceKind ?? 'defensywny';
    html += `<label class="civ-ihd-field"><span>Rodzaj sojuszu</span>`
      + `<select class="ihd-f-allianceKind">`
      + `<option value="defensywny"${ak === 'defensywny' ? ' selected' : ''}>Defensywny</option>`
      + `<option value="pelny"${ak === 'pelny' ? ' selected' : ''}>Pełny</option>`
      + `</select></label>`;
  }
  if (kind === 'zaproponuj_pakt') {
    const turns = fields.turns ?? 15;
    html += `<label class="civ-ihd-field"><span>Liczba tur</span>`
      + `<input type="number" min="1" step="1" class="ihd-f-turns" value="${turns}"></label>`;
  }
  if (kind === 'zaproponuj_audiencje') {
    html += `<label class="civ-ihd-field"><span>Motyw (opcjonalnie)</span>`
      + `<input type="text" class="ihd-f-motive" value="${esc(fields.motive ?? '')}" placeholder="np. chcę handlować"></label>`;
  }
  return html;
}

/** Odczytuje wartości z DOM-u (kontener zawierający pola wyrenderowane przez `fieldsHtml`). */
function readFields(kind: InterHumanProposalKind, container: ParentNode): InterHumanProposalFields {
  const powodEl = container.querySelector('.ihd-f-powod') as HTMLInputElement | null;
  const powod = powodEl?.value.trim() || '(bez powodu)';
  const out: InterHumanProposalFields = { powod };
  if (kind === 'zaproponuj_sojusz') {
    const sel = container.querySelector('.ihd-f-allianceKind') as HTMLSelectElement | null;
    if (sel?.value === 'defensywny' || sel?.value === 'pelny') out.allianceKind = sel.value;
  }
  if (kind === 'zaproponuj_pakt') {
    const inp = container.querySelector('.ihd-f-turns') as HTMLInputElement | null;
    const n = inp ? parseInt(inp.value, 10) : NaN;
    if (Number.isFinite(n) && n > 0) out.turns = n;
  }
  if (kind === 'zaproponuj_audiencje') {
    const inp = container.querySelector('.ihd-f-motive') as HTMLInputElement | null;
    if (inp?.value.trim()) out.motive = inp.value.trim();
  }
  return out;
}

function renderItemHtml(item: InterHumanDiplomacyProposalView): string {
  const icon = dipBrandIconHtml(kindIconId(item.kind), 18, 'dip-ic') ?? '';
  return `<li class="civ-ihd-item" data-id="${esc(item.id)}" data-kind="${item.kind}">`
    + `<div class="civ-ihd-item-head"><span>${icon}${esc(item.fromLabel)}</span>`
    + `<span class="civ-ihd-kind">${kindLabel(item.kind)}</span></div>`
    + `<p class="civ-ihd-detail">${esc(item.detail)}</p>`
    + `<div class="civ-ihd-item-actions">`
    + `<button type="button" class="dip-gold-btn ihd-accept">Akceptuj</button>`
    + `<button type="button" class="dip-muted-btn ihd-counter-toggle">Kontrpropozycja</button>`
    + `<button type="button" class="dip-muted-btn civ-dip-rej ihd-reject">Odrzuć</button>`
    + `</div>`
    + `<div class="civ-ihd-counter-form" hidden>`
    + fieldsHtml(item.kind, item.fields)
    + `<button type="button" class="dip-gold-btn ihd-counter-submit">Wyślij kontrpropozycję</button>`
    + `</div>`
    + `</li>`;
}

function render(cfg: InterHumanDiplomacyHudConfig): void {
  if (root === null) return;
  const dipIc = dipBrandIconHtml('tb-diplomacy', 24, 'dip-ic') ?? '';
  const inboxHtml = cfg.proposals.length === 0
    ? '<p class="civ-ihd-empty">Brak propozycji oczekujących na odpowiedź.</p>'
    : `<ul class="civ-ihd-list">${cfg.proposals.map(renderItemHtml).join('')}</ul>`;
  const defaultKind = KIND_ORDER[0]!;
  const box = document.createElement('div');
  box.className = 'civ-ihd-box';
  box.innerHTML = '<div class="civ-ihd-head"><h2>' + dipIc + 'Dyplomacja między fotelami</h2>'
    + dipCloseBtnHtml('Zamknij') + '</div>'
    + '<h3>Skrzynka propozycji</h3>'
    + `<div class="civ-ihd-inbox">${inboxHtml}</div>`
    + `<h3>Złóż nową propozycję do ${esc(cfg.otherLabel)}</h3>`
    + '<label class="civ-ihd-field"><span>Rodzaj propozycji</span>'
    + `<select class="ihd-new-type">${KIND_ORDER.map(k => `<option value="${k}">${kindLabel(k)}</option>`).join('')}</select>`
    + '</label>'
    + `<div class="ihd-new-fields">${fieldsHtml(defaultKind, { powod: '' })}</div>`
    + '<button type="button" class="dip-gold-btn ihd-new-submit">Wyślij propozycję</button>';
  root.innerHTML = '';
  root.appendChild(box);

  box.querySelector('.dip-close-btn')?.addEventListener('click', () => {
    hideInterHumanDiplomacyHud();
    cfg.onClose?.();
  });

  box.querySelectorAll<HTMLLIElement>('.civ-ihd-item').forEach(li => {
    const id = li.getAttribute('data-id') ?? '';
    const kind = li.getAttribute('data-kind') as InterHumanProposalKind;
    li.querySelector('.ihd-accept')?.addEventListener('click', () => cfg.onAccept(id));
    li.querySelector('.ihd-reject')?.addEventListener('click', () => cfg.onReject(id));
    li.querySelector('.ihd-counter-toggle')?.addEventListener('click', () => {
      const form = li.querySelector('.civ-ihd-counter-form') as HTMLElement | null;
      if (form) form.hidden = !form.hidden;
    });
    li.querySelector('.ihd-counter-submit')?.addEventListener('click', () => {
      const form = li.querySelector('.civ-ihd-counter-form') as HTMLElement | null;
      if (!form) return;
      const fields = readFields(kind, form);
      cfg.onCounter(id, kind, fields);
    });
  });

  const typeSel = box.querySelector('.ihd-new-type') as HTMLSelectElement | null;
  const fieldsBox = box.querySelector('.ihd-new-fields') as HTMLElement | null;
  typeSel?.addEventListener('change', () => {
    const k = (typeSel.value as InterHumanProposalKind) || defaultKind;
    if (fieldsBox) fieldsBox.innerHTML = fieldsHtml(k, { powod: '' });
  });
  box.querySelector('.ihd-new-submit')?.addEventListener('click', () => {
    if (!fieldsBox || !typeSel) return;
    const k = (typeSel.value as InterHumanProposalKind) || defaultKind;
    const fields = readFields(k, fieldsBox);
    cfg.onPropose(k, fields);
  });
}

/** Otwiera (albo odświeża, gdy już otwarty) ekran. Wołający (main.ts) przekazuje
 *  ŚWIEŻE dane po każdej akcji — ten moduł nie trzyma własnego stanu propozycji. */
export function showInterHumanDiplomacyHud(cfg: InterHumanDiplomacyHudConfig): void {
  ensureStyles();
  if (root === null) {
    root = document.createElement('div');
    root.className = 'civ-ihd-overlay';
    document.body.appendChild(root);
  }
  render(cfg);
}

export function hideInterHumanDiplomacyHud(): void {
  if (root !== null) { root.remove(); root = null; }
}
