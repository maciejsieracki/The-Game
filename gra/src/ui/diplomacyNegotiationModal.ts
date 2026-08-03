/**
 * diplomacyNegotiationModal.ts — modale negocjacji audiencji v1.1 (lane UI).
 * Handel/dar (PN) → diplomacyTradeBasket.ts · reszta formularzy tutaj.
 */
import type { AudienceAction } from './diplomacyAudience';
import type { BasketItem } from '../game/diplomacy-pn-engine';
import type { TempoGry } from '../game/tech-tempo';
import type { GameDifficulty } from '../game/difficulty-cost';
import { DIPLO_1E_SHARED_CSS, ensureDiploBrandScope } from './diploUiSkin';
import { TRAKTAT_HANDLOWY_LABEL } from '../game/diplomacy-display';

export interface NegotiationPayload {
  actionId: string;
  turns?: number;
  goldPerTurn?: number;
  goldOnce?: number;
  resource?: string;
  amount?: number;
  targetOwnerId?: number;
  borderMilitary?: boolean;
  techId?: string;
  bribeGold?: number;
  allianceKind?: 'defensywny' | 'pelny';
  tributeMode?: 'demand' | 'offer';
  /** Koszyk PN — oddaję */
  giveItems?: readonly BasketItem[];
  /** Koszyk PN — dostaję (handel) */
  receiveItems?: readonly BasketItem[];
  /** Suma PN (podgląd / silnik) */
  givePn?: number;
  receivePn?: number;
  /** Czysty dar bez towaru w zamian */
  isGift?: boolean;
  /**
   * HANDEL-SUROWCE-CYKL (2026-07-24): tryb wymiany `surowiec_ilosc` w koszyku —
   * 'once' (domyślnie) = jednorazowy transfer natychmiast; 'per_turn' = surowiec↔zapłata
   * co turę przez `turns` tur (deal cykliczny).
   */
  resourceTradeMode?: 'once' | 'per_turn';
  /** Ultimatum wojenne — odmowa respondenta = casus belli. */
  warThreat?: boolean;
}

export interface NegotiationModalContext {
  civName: string;
  aiCounterOffer?: string;
  rivalOptions?: ReadonlyArray<{ ownerId: number; label: string }>;
  techOptions?: ReadonlyArray<{ id: string; label: string; suggestedPrice: number }>;
  borderFeeCivil?: number;
  borderFeeMilitary?: number;
  resourceOptions?: ReadonlyArray<{ id: string; label: string }>;
  /** Relacja = Zaufanie + Respekt (0–200) — koszyk PN */
  relacjaTotal?: number;
  /** Ile już dodano Zauf. z PN w tej turze (fallback 0) */
  trustPnGainedThisTurn?: number;
  /** Tempo gry — wycena tech */
  tempoGry?: TempoGry | number;
  /** Poziom trudności partii gracza — modyfikator PN tech */
  difficulty?: GameDifficulty;
  /** Miasta gracza (żywność ze spichlerza) */
  cityOptions?: ReadonlyArray<{ id: string; label: string; spichlerz?: number }>;
  /** Miasta partnera (żywność ze spichlerza — strona „Co dostaję") */
  receiveCityOptions?: ReadonlyArray<{ id: string; label: string; spichlerz?: number }>;
  /** Dostępne złoża do handlu */
  zlozeOptions?: ReadonlyArray<{ id: string; label: string }>;
  /** Jednostki gracza do oddania */
  unitOptions?: ReadonlyArray<{ id: string; label: string }>;
  /** Próg Relacji na handel (domyślnie 100) */
  progHandelRelacja?: number;
  /** Próg Relacji na dar (domyślnie 30) */
  progDarRelacja?: number;
  /**
   * Zaległość #3 (Makieta DYPLOMACJA v1.1, 2026-07-23) — surowce boolean per STRONA
   * (realnie posiadane, patrz game/diplomacy-goods.ts), zamiast jednego globalnego
   * `resourceOptions` po obu stronach. `resourceOptions` zostaje jako fallback/legacy.
   */
  giveResourceOptions?: ReadonlyArray<{ id: string; label: string }>;
  receiveResourceOptions?: ReadonlyArray<{ id: string; label: string }>;
  /** Skarbiec gracza (¤) — SZYBKA UMOWA: górny limit złota-dopełniacza. */
  playerSkarbiec?: number;
  /** Trwa wojna z partnerem — blokuje zwykły handel/dar złotem (tylko ugoda pokojowa). */
  atWar?: boolean;
  /** Id akcji dyplomatycznej (np. '10' pokój, '8' trybut) — kontekst koszyka. */
  negotiationActionId?: string;
  /** R-GRACZ-WCHLONIECIE: wymagana opłata ¤ za wchłonięcie MP */
  wchloniecieGoldRequired?: number;
  /**
   * C-DYP-SUROWCE-Q1=B (2026-07-23): surowce ILOŚCIOWE (drewno/kamień/glina/cegła/
   * ceramika/ruda — City.surowce, patrz diplomacy-goods.ts) per STRONA, z prostą ceną
   * jednostkową (econ-params.json „handel_surowce"). Odrębne od giveResourceOptions
   * (surowiec_boolean = dostęp civ-wide) — to realne sztuki z magazynu miast, max
   * pakietów ograniczony do tego, co strona faktycznie posiada (`maxPakiety`).
   */
  giveQuantityResourceOptions?: ReadonlyArray<{ id: string; label: string; maxPakiety: number }>;
  receiveQuantityResourceOptions?: ReadonlyArray<{ id: string; label: string; maxPakiety: number }>;
}

const STYLE_ID = 'civ-diplo-neg-css-1e';
let overlay: HTMLDivElement | null = null;

const NEGOTIATION_IDS = new Set(['6', '7', '9', '10']);

export function actionNeedsNegotiation(actionId: string): boolean {
  return NEGOTIATION_IDS.has(actionId);
}

function ensureStyles(): void {
  ensureDiploBrandScope();
  document.getElementById('civ-diplo-neg-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-diplo-neg-overlay{position:fixed;inset:0;z-index:510;background:rgba(0,0,0,0.6);
  display:flex;align-items:center;justify-content:center;padding:12px;pointer-events:auto;}
.civ-diplo-neg{background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;max-width:400px;width:100%;
  color:#e8e0c8;font:14px 'Segoe UI',Tahoma,sans-serif;pointer-events:auto;position:relative;z-index:1;}
.civ-diplo-neg h3{margin:0 0 8px;font-family:Georgia,serif;font-size:1.05em;color:#e8d88a;}
.civ-diplo-neg .cdn-sub{font-size:0.78em;color:#8a8070;margin-bottom:12px;line-height:1.45;}
.civ-diplo-neg label{display:block;margin:8px 0 4px;font-size:0.78em;color:#a8a090;}
.civ-diplo-neg input[type=number],.civ-diplo-neg select{width:100%;padding:6px 8px;border-radius:6px;
  border:1px solid rgba(232,216,138,.28);background:rgba(10,12,18,0.9);color:#e8e0c8;font:inherit;}
.civ-diplo-neg .cdn-row{display:flex;gap:8px;align-items:center;margin:6px 0;}
.civ-diplo-neg .cdn-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}
.civ-diplo-neg .cdn-result-text p{margin:4px 0 0;line-height:1.5;}
.civ-diplo-neg .cdn-result-text .cdn-accepted{color:#9fd88a;}
.civ-diplo-neg .cdn-result-text .cdn-rejected{color:#d88a8a;}
.civ-diplo-neg .cdn-invalid{color:#e08a8a;font-size:0.72em;margin-top:8px;line-height:1.4;}
.civ-diplo-neg .cdn-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px;}
.civ-diplo-neg .cdn-chip-turn{padding:5px 10px;border-radius:6px;border:1px solid rgba(232,216,138,.28);
  background:rgba(24,30,40,.7);color:#e8e0c8;cursor:pointer;font:inherit;}
.civ-diplo-neg .cdn-chip-turn.selected{border-color:rgba(232,216,138,.65);background:rgba(232,216,138,.15);color:#e8d88a;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * C-DYP-STOL-Q1=B (2026-07-25): KOSZYK-TRAKTAT — akcje traktatowe, do których dołączamy
 * sekcję „Dołóż do umowy" (złoto + jeden surowiec jako słodzik oceniany RAZEM z traktatem
 * przez evaluateProposal — diplomacy-proposals.ts sweetenerEasePoints). Świadomie POZA tym
 * zbiorem: '6' (tech ma własną cenę), '7' (namów-wojnę ma bribeGold), '9' (ultimatum ma
 * reparacje) — tam "dołóż" nakładałby się na istniejące pole gold/cena.
 * Minimalna sekcja (nie pełny koszyk diplomacyTradeBasket.ts — patrz raport zadania):
 * jedno pole złota + jeden wybór surowca (dostęp LUB ilość) + ilość pakietów.
 */
const SWEETENER_ACTION_IDS = new Set<string>();

function sweetenerSectionHtml(ctx: NegotiationModalContext): string {
  const goldMax = Math.max(0, Math.floor(ctx.playerSkarbiec ?? 0));
  const qtyOpts = (ctx.giveQuantityResourceOptions ?? []).filter(o => o.maxPakiety > 0);
  const resOptions =
    '<option value="">— brak —</option>'
    + qtyOpts.map(o =>
      '<option value="qty:' + esc(o.id) + '" data-max="' + o.maxPakiety + '">'
      + esc(o.label) + ' (ilość, max ' + o.maxPakiety + ' pak.)</option>',
    ).join('');
  return (
    '<div class="cdn-sweetener" style="margin-top:12px;border-top:1px dashed rgba(232,216,138,.18);padding-top:8px">'
    + '<label style="margin-top:0">Dołóż do umowy (opcjonalnie — słodzik)</label>'
    + '<p class="cdn-sub">Zwiększa szansę akceptacji — wliczane RAZEM z traktatem.</p>'
    + numInput('cdn-sw-gold', 'Pieniądze (¤)', 0, 0, goldMax)
    + '<label>Surowiec</label>'
    + '<select id="cdn-sw-res">' + resOptions + '</select>'
    + '<div id="cdn-sw-qty-wrap" style="display:none">'
    + numInput('cdn-sw-qty', 'Liczba pakietów', 1, 1)
    + '</div>'
    + '</div>'
  );
}

/** Odczyt sekcji słodzika → BasketItem[] (pomijane, gdy pole puste/zero). */
function readSweetenerGiveItems(): BasketItem[] {
  const items: BasketItem[] = [];
  const gold = parseInt((document.getElementById('cdn-sw-gold') as HTMLInputElement)?.value ?? '0', 10);
  if (gold > 0) items.push({ typ: 'zloto', id: 'zloto', ilosc: gold });
  const resSel = document.getElementById('cdn-sw-res') as HTMLSelectElement | null;
  const resVal = resSel?.value ?? '';
  if (resVal.startsWith('qty:')) {
    const id = resVal.slice('qty:'.length);
    const maxAttr = parseInt(resSel!.selectedOptions[0]?.getAttribute('data-max') ?? '0', 10);
    const rawQty = parseInt((document.getElementById('cdn-sw-qty') as HTMLInputElement)?.value ?? '0', 10);
    const qty = maxAttr > 0 ? Math.min(Math.max(0, rawQty), maxAttr) : Math.max(0, rawQty);
    if (qty > 0) items.push({ typ: 'surowiec_ilosc', id, ilosc: qty });
  }
  return items;
}

/** Dołącza koszyk słodzika (jeśli niepusty) do payloadu akcji traktatowej. */
function withSweetener(payload: NegotiationPayload): NegotiationPayload {
  const giveItems = readSweetenerGiveItems();
  return giveItems.length > 0 ? { ...payload, giveItems } : payload;
}

function closeModal(): void {
  if (overlay !== null) { overlay.remove(); overlay = null; }
}

function numInput(id: string, label: string, value: number, min: number, max?: number): string {
  const maxAttr = max != null ? ' max="' + max + '"' : '';
  return '<label for="' + id + '">' + esc(label) + '</label>'
    + '<input type="number" id="' + id + '" value="' + value + '" min="' + min + '"' + maxAttr + ' />';
}

function buildForm(action: AudienceAction, ctx: NegotiationModalContext): string {
  const body = buildFormBody(action, ctx);
  return SWEETENER_ACTION_IDS.has(action.id) ? body + sweetenerSectionHtml(ctx) : body;
}

function buildFormBody(action: AudienceAction, ctx: NegotiationModalContext): string {
  const sub = ctx.aiCounterOffer
    ? '<div class="cdn-sub">' + esc(ctx.aiCounterOffer) + '</div>'
    : '<div class="cdn-sub">Partner: <strong>' + esc(ctx.civName) + '</strong></div>';

  switch (action.id) {
    case '2': {
      const turnChips = [5, 10, 15].map(t =>
        '<button type="button" class="cdn-chip-turn' + (t === 15 ? ' selected' : '')
        + '" data-turns="' + t + '">' + t + '</button>',
      ).join('');
      return sub
        + '<label>Czas paktu (tur)</label>'
        + '<div class="cdn-chip-row">' + turnChips + '</div>'
        + numInput('cdn-turns', 'Ręcznie (1–20)', 15, 1, 20)
        + '<p class="cdn-sub">Złamanie: −30 Relacja, −20 Zaufanie</p>';
    }

    case '3':
      return sub
        + '<label>Typ sojuszu</label>'
        + '<select id="cdn-alliance"><option value="pelny">Sojusz wojskowy (wojna sojusznika = twoja)</option>'
        + '<option value="defensywny">Sojusz obronny (atak na sojusznika)</option></select>';

    case '4': {
      const feeC = ctx.borderFeeCivil ?? 20;
      const feeM = ctx.borderFeeMilitary ?? 40;
      return sub
        + '<div class="cdn-row"><input type="checkbox" id="cdn-mil" />'
        + '<label for="cdn-mil" style="margin:0">Prawo wojskowe (+ opłata)</label></div>'
        + '<p class="cdn-sub">Opłata cywilne: ' + feeC + ' ¤ · wojskowe: ' + feeM + ' ¤ (jednorazowo)</p>';
    }

    case '5':
      return sub + '<p class="cdn-sub">' + TRAKTAT_HANDLOWY_LABEL + ' — zamknij to okno i użyj przycisku „' + TRAKTAT_HANDLOWY_LABEL + '" na stole (bez koszyka).</p>';
    case '14':
      return sub + '<p class="cdn-sub">Umowa wymiany PW — zamknij to okno i wybierz „Umowa wymiany" (koszyk).</p>';
    case '13':
      return sub + '<p class="cdn-sub">Dar PW otwiera się w koszyku — zamknij to okno i wybierz „Przekaż dar" ponownie.</p>';

    case '6': {
      const techs = ctx.techOptions ?? [];
      if (techs.length === 0) {
        return sub + '<p class="cdn-sub">Brak technologii do sprzedaży (SILNIK dostarcza listę).</p>';
      }
      const sel = techs.map(t =>
        '<option value="' + esc(t.id) + '" data-price="' + t.suggestedPrice + '">'
        + esc(t.label) + ' (~' + t.suggestedPrice + ' ¤)</option>',
      ).join('');
      return sub
        + '<label>Technologia</label><select id="cdn-tech">' + sel + '</select>'
        + numInput('cdn-tech-price', 'Cena ¤', techs[0]?.suggestedPrice ?? 50, 1);
    }

    case '7': {
      const rivals = ctx.rivalOptions ?? [];
      if (rivals.length === 0) {
        return sub + '<p class="cdn-sub">Brak znanych wrogów tej cywilizacji.</p>';
      }
      const sel = rivals.map(r =>
        '<option value="' + r.ownerId + '">' + esc(r.label) + '</option>',
      ).join('');
      return sub
        + '<label>Cel wojny</label><select id="cdn-rival">' + sel + '</select>'
        + numInput('cdn-bribe', 'Łapówka ¤', 30, 0);
    }

    case '8':
      return sub
        + '<label>Tryb</label><select id="cdn-trib-mode">'
        + '<option value="demand">Żądaj trybutu</option>'
        + '<option value="offer">Zaproponuj trybut (uniknij wojny)</option></select>'
        + numInput('cdn-gpt', 'Kwota ¤/turę', 15, 10)
        + numInput('cdn-turns-trib', 'Czas (tur, 0 = bezterminowy)', 0, 0);

    case '9':
      return sub
        + numInput('cdn-ult-gold', 'Reparacje ¤ (preset v1.1)', 50, 0)
        + '<p class="cdn-sub">Odmowa = casus belli</p>';

    case '12':
      return sub
        + numInput('cdn-wasal-gpt', 'Trybut wasala ¤/turę', 10, 10)
        + '<p class="cdn-sub">Wasal zachowuje terytorium · płaci trybut co turę</p>';

    default:
      return sub + '<p class="cdn-sub">Brak formularza dla tej akcji.</p>';
  }
}

function readPayload(actionId: string, ctx: NegotiationModalContext): NegotiationPayload | null {
  const base: NegotiationPayload = { actionId };

  switch (actionId) {
    case '2': {
      const turns = parseInt((document.getElementById('cdn-turns') as HTMLInputElement)?.value ?? '15', 10);
      return withSweetener({ ...base, turns: Math.max(1, Math.min(20, turns)) });
    }
    case '3': {
      const v = (document.getElementById('cdn-alliance') as HTMLSelectElement)?.value;
      return withSweetener({ ...base, allianceKind: v === 'defensywny' ? 'defensywny' : 'pelny' });
    }
    case '4': {
      const mil = (document.getElementById('cdn-mil') as HTMLInputElement)?.checked ?? false;
      const fee = mil ? (ctx.borderFeeMilitary ?? 40) : (ctx.borderFeeCivil ?? 20);
      return withSweetener({ ...base, borderMilitary: mil, goldOnce: fee });
    }
    case '5':
    case '14':
    case '13':
      return null;
    case '6': {
      const sel = document.getElementById('cdn-tech') as HTMLSelectElement;
      const techId = sel?.value;
      const price = parseInt((document.getElementById('cdn-tech-price') as HTMLInputElement)?.value ?? '0', 10);
      return { ...base, techId, goldOnce: price };
    }
    case '7': {
      const target = parseInt((document.getElementById('cdn-rival') as HTMLSelectElement)?.value ?? '-1', 10);
      const bribe = parseInt((document.getElementById('cdn-bribe') as HTMLInputElement)?.value ?? '0', 10);
      if (target < 0) return null;
      return { ...base, targetOwnerId: target, bribeGold: bribe };
    }
    case '8': {
      const mode = (document.getElementById('cdn-trib-mode') as HTMLSelectElement)?.value;
      const gpt = parseInt((document.getElementById('cdn-gpt') as HTMLInputElement)?.value ?? '10', 10);
      const turns = parseInt((document.getElementById('cdn-turns-trib') as HTMLInputElement)?.value ?? '0', 10);
      return withSweetener({
        ...base,
        tributeMode: mode === 'offer' ? 'offer' : 'demand',
        goldPerTurn: gpt,
        turns: turns > 0 ? turns : undefined,
      });
    }
    case '9': {
      const gold = parseInt((document.getElementById('cdn-ult-gold') as HTMLInputElement)?.value ?? '0', 10);
      return { ...base, goldOnce: gold, warThreat: true };
    }
    case '12': {
      const gpt = parseInt((document.getElementById('cdn-wasal-gpt') as HTMLInputElement)?.value ?? '10', 10);
      return withSweetener({ ...base, goldPerTurn: gpt });
    }
    default:
      return base;
  }
}

/** Wynik podglądu „wstępnej zgody" (TEMAT 9, stół negocjacyjny) — evaluateProposal bez finalizacji. */
export interface NegotiationPreviewResult {
  accepted: boolean;
  reason?: string;
}

/**
 * Formularz negocjacji (tech / namów wojnę / ultimatum itd.).
 * D-DYPLO-KOSZYK-OD-RAZU (Maciej 2026-07-29): „Zaproponuj" od razu kładzie wpis na stół
 * („My oferujemy") — bez drugiego kroku „Wyślij propozycję". `onPreview` zostaje w API
 * (kontroferta / kompatybilność), ale nie blokuje dodania do stołu.
 * Koszyk handlu/daru (aid 5/13/14) → diplomacyTradeBasket.ts.
 */
export function showNegotiationModal(
  action: AudienceAction,
  ctx: NegotiationModalContext,
  _onPreview: (payload: NegotiationPayload) => NegotiationPreviewResult,
  onAccept: (payload: NegotiationPayload) => void,
  onCancel: () => void,
): void {
  closeModal();
  ensureStyles();
  overlay = document.createElement('div');
  overlay.className = 'civ-diplo-neg-overlay';
  overlay.innerHTML =
    '<div class="civ-diplo-neg" role="dialog" aria-modal="true">'
    + '<h3>' + esc(action.label) + '</h3>'
    + '<div class="cdn-form-step">'
    + buildForm(action, ctx)
    + '<div class="cdn-btns">'
    + '<button type="button" class="dip-muted-btn cdn-cancel">Anuluj</button>'
    + '<button type="button" class="dip-gold-btn cdn-submit">Zaproponuj</button>'
    + '</div></div>'
    + '</div>';
  document.body.appendChild(overlay);

  const box = overlay.querySelector('.civ-diplo-neg')!;
  const formStep = box.querySelector('.cdn-form-step') as HTMLElement;
  const submitBtn = box.querySelector('.cdn-submit') as HTMLButtonElement | null;
  let invalidMsg: HTMLDivElement | null = null;

  const showInvalid = (msg: string): void => {
    if (!invalidMsg) {
      invalidMsg = document.createElement('div');
      invalidMsg.className = 'cdn-invalid';
      formStep.insertBefore(invalidMsg, formStep.querySelector('.cdn-btns'));
    }
    invalidMsg.textContent = msg;
  };

  const clearInvalid = (): void => {
    if (invalidMsg) { invalidMsg.remove(); invalidMsg = null; }
  };

  box.querySelector('.cdn-cancel')?.addEventListener('click', () => { closeModal(); onCancel(); });
  box.querySelector('.cdn-submit')?.addEventListener('click', () => {
    clearInvalid();
    const payload = readPayload(action.id, ctx);
    if (payload == null) {
      if (action.id === '5' || action.id === '14' || action.id === '13') {
        showInvalid(action.id === '5'
          ? TRAKTAT_HANDLOWY_LABEL + ' — zamknij okno i użyj przycisku na stole negocjacji.'
          : 'Ta akcja wymaga koszyka wymiany — zamknij okno i wybierz ją ponownie z listy umów.');
      } else {
        showInvalid('Uzupełnij wymagane pola formularza.');
      }
      return;
    }
    closeModal();
    onAccept(payload);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeModal(); onCancel(); }
  });

  if (action.id === '5' || action.id === '14' || action.id === '13') {
    submitBtn?.setAttribute('disabled', 'disabled');
    submitBtn?.setAttribute('title', 'Użyj koszyka wymiany zamiast tego formularza');
  }

  const techSel = box.querySelector('#cdn-tech') as HTMLSelectElement | null;
  if (techSel) {
    techSel.addEventListener('change', () => {
      const opt = techSel.selectedOptions[0];
      const price = parseInt(opt?.getAttribute('data-price') ?? '50', 10);
      const inp = box.querySelector('#cdn-tech-price') as HTMLInputElement | null;
      if (inp) inp.value = String(price);
    });
  }

  // C-DYP-STOL-Q1=B: sekcja „Dołóż do umowy" — pokaż pole ilości tylko dla surowca ILOŚCIOWEGO
  // (qty:...), i ogranicz je do maxPakiety tej pozycji (analogicznie do koszyka handlu).
  const swResSel = box.querySelector('#cdn-sw-res') as HTMLSelectElement | null;
  if (swResSel) {
    const swQtyWrap = box.querySelector('#cdn-sw-qty-wrap') as HTMLElement | null;
    const swQtyInput = box.querySelector('#cdn-sw-qty') as HTMLInputElement | null;
    swResSel.addEventListener('change', () => {
      const val = swResSel.value;
      const isQty = val.startsWith('qty:');
      if (swQtyWrap) swQtyWrap.style.display = isQty ? '' : 'none';
      if (isQty && swQtyInput) {
        const max = parseInt(swResSel.selectedOptions[0]?.getAttribute('data-max') ?? '1', 10);
        swQtyInput.max = String(max);
        if (parseInt(swQtyInput.value, 10) > max) swQtyInput.value = String(max);
      }
    });
  }

  box.querySelectorAll('.cdn-chip-turn').forEach(btn => {
    btn.addEventListener('click', () => {
      const turns = parseInt(btn.getAttribute('data-turns') ?? '15', 10);
      const inp = box.querySelector('#cdn-turns') as HTMLInputElement | null;
      if (inp) inp.value = String(turns);
      box.querySelectorAll('.cdn-chip-turn').forEach(c => c.classList.toggle('selected', c === btn));
    });
  });
}

export function hideNegotiationModal(): void {
  closeModal();
}

/** Mapowanie payload UI → actionId CYW evaluateProposal */
export function proposalActionIdFromPayload(payload: NegotiationPayload): string {
  if (payload.isGift === true || payload.actionId === '13') return 'handel';
  if (payload.actionId === '3') {
    return payload.allianceKind === 'defensywny' ? 'sojusz_defensywny' : 'sojusz_pelny';
  }
  if (payload.actionId === '8') {
    return payload.tributeMode === 'offer' ? 'trybut_oferta' : 'trybut_zadanie';
  }
  const map: Record<string, string> = {
    '2': 'nap', '4': 'granice', '5': 'umowa_szlakow', '14': 'handel', '6': 'tech',
    '7': 'namow_wojne', '9': 'ultimatum', '12': 'wasal', '15': 'wchloniecie', '10': 'pokoj',
  };
  return map[payload.actionId] ?? payload.actionId;
}
