/**
 * diplomacyNegotiationModal.ts — modale negocjacji audiencji v1.1 (lane UI).
 * Handel/dar (PN) → diplomacyTradeBasket.ts · reszta formularzy tutaj.
 */
import type { AudienceAction } from './diplomacyAudience';
import type { BasketItem } from '../game/diplomacy-pn-engine';
import type { TempoGry } from '../game/tech-tempo';
import { DIPLO_1E_SHARED_CSS, ensureDiploBrandScope } from './diploUiSkin';

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
  /** Miasta gracza (żywność ze spichlerza) */
  cityOptions?: ReadonlyArray<{ id: string; label: string; spichlerz?: number }>;
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

const NEGOTIATION_IDS = new Set(['2', '3', '4', '5', '6', '7', '8', '9', '12', '13']);

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
  display:flex;align-items:center;justify-content:center;padding:12px;}
.civ-diplo-neg{background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;max-width:400px;width:100%;
  color:#e8e0c8;font:14px 'Segoe UI',Tahoma,sans-serif;}
.civ-diplo-neg h3{margin:0 0 8px;font-family:Georgia,serif;font-size:1.05em;color:#e8d88a;}
.civ-diplo-neg .cdn-sub{font-size:0.78em;color:#8a8070;margin-bottom:12px;line-height:1.45;}
.civ-diplo-neg label{display:block;margin:8px 0 4px;font-size:0.78em;color:#a8a090;}
.civ-diplo-neg input[type=number],.civ-diplo-neg select{width:100%;padding:6px 8px;border-radius:6px;
  border:1px solid rgba(232,216,138,.28);background:rgba(10,12,18,0.9);color:#e8e0c8;font:inherit;}
.civ-diplo-neg .cdn-row{display:flex;gap:8px;align-items:center;margin:6px 0;}
.civ-diplo-neg .cdn-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const sub = ctx.aiCounterOffer
    ? '<div class="cdn-sub">' + esc(ctx.aiCounterOffer) + '</div>'
    : '<div class="cdn-sub">Partner: <strong>' + esc(ctx.civName) + '</strong></div>';

  switch (action.id) {
    case '2':
      return sub + numInput('cdn-turns', 'Czas paktu (tur)', 15, 10, 20)
        + '<p class="cdn-sub">Złamanie: −30 Relacja, −20 Zaufanie</p>';

    case '3':
      return sub
        + '<label>Typ sojuszu</label>'
        + '<select id="cdn-alliance"><option value="pelny">Sojusz pełny (wojna sojusznika = twoja)</option>'
        + '<option value="defensywny">Sojusz defensywny (atak na sojusznika)</option></select>';

    case '4': {
      const feeC = ctx.borderFeeCivil ?? 20;
      const feeM = ctx.borderFeeMilitary ?? 40;
      return sub
        + '<div class="cdn-row"><input type="checkbox" id="cdn-mil" />'
        + '<label for="cdn-mil" style="margin:0">Prawo wojskowe (+ opłata)</label></div>'
        + '<p class="cdn-sub">Opłata cywilne: ' + feeC + ' ¤ · wojskowe: ' + feeM + ' ¤ (jednorazowo)</p>';
    }

    case '5':
      return sub + '<p class="cdn-sub">Handel PN — koszyk. Przy dostępie do surowców/złóż wybierz czas umowy (1–20 tur).</p>';
    case '13':
      return sub + '<p class="cdn-sub">Dar PN — użyj koszyka (diplomacyTradeBasket).</p>';

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
      return { ...base, turns: Math.max(10, Math.min(20, turns)) };
    }
    case '3': {
      const v = (document.getElementById('cdn-alliance') as HTMLSelectElement)?.value;
      return { ...base, allianceKind: v === 'defensywny' ? 'defensywny' : 'pelny' };
    }
    case '4': {
      const mil = (document.getElementById('cdn-mil') as HTMLInputElement)?.checked ?? false;
      const fee = mil ? (ctx.borderFeeMilitary ?? 40) : (ctx.borderFeeCivil ?? 20);
      return { ...base, borderMilitary: mil, goldOnce: fee };
    }
    case '5':
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
      return {
        ...base,
        tributeMode: mode === 'offer' ? 'offer' : 'demand',
        goldPerTurn: gpt,
        turns: turns > 0 ? turns : undefined,
      };
    }
    case '9': {
      const gold = parseInt((document.getElementById('cdn-ult-gold') as HTMLInputElement)?.value ?? '0', 10);
      return { ...base, goldOnce: gold };
    }
    case '12': {
      const gpt = parseInt((document.getElementById('cdn-wasal-gpt') as HTMLInputElement)?.value ?? '10', 10);
      return { ...base, goldPerTurn: gpt };
    }
    default:
      return base;
  }
}

export function showNegotiationModal(
  action: AudienceAction,
  ctx: NegotiationModalContext,
  onSubmit: (payload: NegotiationPayload) => void,
  onCancel: () => void,
): void {
  closeModal();
  ensureStyles();
  overlay = document.createElement('div');
  overlay.className = 'civ-diplo-neg-overlay';
  overlay.innerHTML =
    '<div class="civ-diplo-neg" role="dialog" aria-modal="true">'
    + '<h3>' + esc(action.label) + '</h3>'
    + buildForm(action, ctx)
    + '<div class="cdn-btns">'
    + '<button type="button" class="dip-muted-btn cdn-cancel">Anuluj</button>'
    + '<button type="button" class="dip-gold-btn cdn-submit">Zaproponuj</button>'
    + '</div></div>';
  document.body.appendChild(overlay);

  const box = overlay.querySelector('.civ-diplo-neg')!;
  box.querySelector('.cdn-cancel')?.addEventListener('click', () => { closeModal(); onCancel(); });
  box.querySelector('.cdn-submit')?.addEventListener('click', () => {
    const payload = readPayload(action.id, ctx);
    if (payload == null) return;
    closeModal();
    onSubmit(payload);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeModal(); onCancel(); }
  });

  const techSel = box.querySelector('#cdn-tech') as HTMLSelectElement | null;
  if (techSel) {
    techSel.addEventListener('change', () => {
      const opt = techSel.selectedOptions[0];
      const price = parseInt(opt?.getAttribute('data-price') ?? '50', 10);
      const inp = box.querySelector('#cdn-tech-price') as HTMLInputElement | null;
      if (inp) inp.value = String(price);
    });
  }
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
    '2': 'nap', '4': 'granice', '5': 'handel', '6': 'tech',
    '7': 'namow_wojne', '9': 'ultimatum', '12': 'wasal',
  };
  return map[payload.actionId] ?? payload.actionId;
}
