/**
 * diplomacyTradeBasket.ts — koszyk handlu / daru (PN) v1.0 (lane UI, P4).
 * Import katalogu PN z lane D; callback przez NegotiationPayload → audiencja.
 */
import type { AudienceAction } from './diplomacyAudience';
import type { NegotiationModalContext, NegotiationPayload } from './diplomacyNegotiationModal';
import { isCurrencyProposalForbiddenDuringWar } from '../game/diplomacy-war-gates';
import { computeQuickDealBasket, proposalPnTurnsMultiplier, type BasketItem } from '../game/diplomacy-pn-engine';
import { validateTradeBasketSides } from '../game/diplomacy-trade-validation';
import { balanceGiveItemsToFairMin } from '../game/diplomacy-ai-offer-balance';
import {
  proposalHasResourceAccess,
  stripWithdrawnResourceAccessItems,
} from '../game/diplomacy-proposals';
import type { TempoGry } from '../game/tech-tempo';
import type { GameDifficulty } from '../game/difficulty-cost';
import {
  diplomacySumPn,
  diplomacyFairGivePn,
  diplomacyTradeTrustFromDeal,
  diplomacyGiftTrustFromPn,
  diplomacyDobraWolaFromSurplus,
  diplomacyProgDarRelacja,
  diplomacyPnRelacjaParams,
  diplomacyZywnoscNaPn,
  diplomacyResourceAccessCatalog,
  diplomacyHandelZaufaniePerTura,
  diplomacyHandelSurowceCatalog,
  diplomacyHandelSurowiecKrok,
  diplomacyNormalizeSurowiecIlosc,
  type WartoscPozycjaTyp,
} from '../game/diplomacy-value-catalog';
import { HANDEL_ZLOZE_CENA_BAZA } from '../game/diplomacy-deposit-trade';
import unitsJson from '../../data/units.json';
import techJson from '../../data/tech.json';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { DIPLO_1E_SHARED_CSS, ensureDiploBrandScope } from './diploUiSkin';
import { brandIconSvg, mapResourceIconSvg } from './icons/brandAssets';
import {
  renderBasketItemValueHtml,
} from './diplomacyDealDisplay';
import type { BasketItemFormatCtx } from '../game/diplomacy-display';
import { formatBasketListBrief, resourceDisplayLabel } from '../game/diplomacy-display';
import { renderPnBalancePanelFromBasket, renderPnBalancePanelForTreaty } from './diplomacyAcceptanceBalance';
import {
  bilateralTreatyDisplayPw,
  computePlayerAcceptanceSides,
  sideDisplayOfferPw,
} from '../game/diplomacy-acceptance-points';
import { proposalActionIdFromPayload } from './diplomacyNegotiationModal';
import type { ProposalPayload, ProposalActionId } from '../game/diplomacy-proposals';

export type TradeBasketMode = 'trade' | 'gift' | 'treaty';

const STYLE_ID = 'civ-diplo-basket-css-1e';
let overlay: HTMLDivElement | null = null;
let activeOnCancel: (() => void) | undefined;

const TYP_LABELS: Record<WartoscPozycjaTyp, string> = {
  zloto: 'Pieniądze (¤)',
  praca: 'Praca',
  zywnosc: 'Żywność (spichlerz)',
  zloze: 'Dostęp do złoża (1 pole)',
  tech: 'Technologia',
  jednostka: 'Jednostka',
  surowiec_boolean: 'Dostęp do surowca',
  surowiec_ilosc: 'Surowiec (sztuki)',
};

/** Krótkie etykiety chipów (te same ikony co HUD / magazyn). */
const TYP_CHIP_LABELS: Partial<Record<WartoscPozycjaTyp, string>> = {
  zloto: 'Pieniądze',
  praca: 'Praca',
  zywnosc: 'Żywność',
  tech: 'Technologia',
  surowiec_ilosc: 'Surowiec',
};

function cdbIconWrap(svg: string): string {
  if (!svg) return '';
  return '<span class="cdb-chip-ic">' + svg + '</span>';
}

function goldChipIconHtml(size = 24): string {
  const svg = mapResourceIconSvg('Złoto', size)
    || mapResourceIconSvg('zloto', size)
    || brandIconSvg('res-treasury', size);
  return cdbIconWrap(svg);
}

function typChipIconHtml(typ: WartoscPozycjaTyp, resourceId?: string): string {
  if (typ === 'zloto') return goldChipIconHtml();
  if (typ === 'surowiec_ilosc' && resourceId) {
    const label = resourceDisplayLabel(resourceId);
    const svg = mapResourceIconSvg(label, 24) || brandIconSvg('chip-crate', 24);
    return cdbIconWrap(svg);
  }
  const brandId: Record<string, string> = {
    praca: 'res-work',
    zywnosc: 'res-food',
    tech: 'bld-science',
    surowiec_ilosc: 'chip-crate',
  };
  return cdbIconWrap(brandIconSvg(brandId[typ] ?? 'chip-crate', 24));
}

function buildChipBtn(
  cls: string,
  value: string,
  side: string,
  selected: boolean,
  iconHtml: string,
  label: string,
  extraAttrs = '',
  badgeHtml = '',
): string {
  return (
    '<button type="button" class="cdb-chip ' + cls + (selected ? ' selected' : '') + '"'
    + ' data-side="' + side + '" data-value="' + esc(value) + '"' + extraAttrs + '>'
    + iconHtml
    + '<span class="cdb-chip-lbl">' + esc(label) + '</span>'
    + badgeHtml
    + '</button>'
  );
}

/**
 * R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP (2026-08-08, runda 2): format kompaktowy odznaki
 * zapasu na chipie surowca — budżet szerokości chipa to ~62-72px (patrz .cdb-chip /
 * .cdb-chip-lbl w ensureStyles), zapasy 4-cyfrowe i większe (dziś realne przy dużych
 * miastach) muszą zmieścić się czytelnie. Dokładna, nieskrócona wartość idzie do `title`
 * chipa (już budowany przez wywołującego, patrz `qtyResChips`), nie do tej odznaki.
 */
function formatCompactQty(n: number): string {
  const v = Math.trunc(n);
  const abs = Math.abs(v);
  if (abs < 1000) return String(v);
  const units: Array<[number, string]> = [[1_000_000_000, 'B'], [1_000_000, 'M'], [1_000, 'k']];
  for (const [div, suf] of units) {
    if (abs >= div) {
      const scaled = Math.round((v / div) * 10) / 10;
      const str = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
      return str + suf;
    }
  }
  return String(v);
}

/**
 * `step` (R-DYPLO-CENNIK-SKALA-5X-Q1, 2026-08-13): krok wymiany handlowej — domyślnie 1
 * (turnusy/gotówka/Praca/żywność, bez zmian), 5 dla surowców ilościowych dotkniętych ×5
 * (patrz diplomacyHandelSurowiecKrok). Przyciski +N/+10N/+100N skalują się razem z krokiem
 * (step=5 -> +5/+50/+500) — te same relatywne skoki co dawniej (×10, ×100), tylko w nowej
 * jednostce. `min` domyślnie = step, żeby natywny spinner/klawiatura nie schodziły poniżej
 * jednego bloku (twarda walidacja i tak jest w readItemFromForm/applyRowQtyChange).
 */
function qtyStepperHtml(
  inputClass: string,
  side: string,
  value: number,
  min = 1,
  max?: number,
  step = 1,
): string {
  const maxAttr = max != null ? ' max="' + max + '"' : '';
  const stepAttr = step > 1 ? ' step="' + step + '"' : '';
  const d1 = step;
  const d2 = step * 10;
  const d3 = step * 100;
  return (
    '<div class="cdb-qty-stepper">'
    + '<button type="button" class="cdb-qty-step dip-muted-btn" data-side="' + side
    + '" data-target="' + inputClass + '" data-delta="' + d1 + '">+' + d1 + '</button>'
    + '<button type="button" class="cdb-qty-step dip-muted-btn" data-side="' + side
    + '" data-target="' + inputClass + '" data-delta="' + d2 + '">+' + d2 + '</button>'
    + '<button type="button" class="cdb-qty-step dip-muted-btn" data-side="' + side
    + '" data-target="' + inputClass + '" data-delta="' + d3 + '">+' + d3 + '</button>'
    + '<input type="number" class="' + inputClass + '" data-side="' + side
    + '" value="' + value + '" min="' + min + '"' + maxAttr + stepAttr + ' />'
    + '</div>'
  );
}

/** SUROW-TERYT: typy wycofane z koszyka negocjacji (tylko ilości + złoto/praca/żywność). */
const WITHDRAWN_BASKET_ACCESS_TYPES = new Set<WartoscPozycjaTyp>(['zloze', 'surowiec_boolean']);

const PROG_HANDEL_REL = 100;

function resolveTempo(ctx: NegotiationModalContext): TempoGry | number {
  return ctx.tempoGry ?? 'standardowa';
}

function basketPnOpts(
  ctx: NegotiationModalContext,
  side: 'give' | 'receive',
  resourceTradeMode: 'once' | 'per_turn' = 'once',
  dealTurns = 1,
) {
  const perTurn = resourceTradeMode === 'per_turn';
  return {
    difficulty: ctx.difficulty ?? 'normal',
    proposerOwnerId: 0,
    playerOwnerId: 0,
    side,
    tempo: resolveTempo(ctx),
    perTurn,
    turnsMultiplier: perTurn ? Math.max(1, dealTurns) : 1,
  };
}

function sumBasketPn(
  items: BasketItem[],
  ctx: NegotiationModalContext,
  side: 'give' | 'receive',
  resourceTradeMode: 'once' | 'per_turn' = 'once',
  dealTurns = 1,
): number | null {
  return diplomacySumPn(toPnItems(items, ctx), basketPnOpts(ctx, side, resourceTradeMode, dealTurns));
}

type PnItem = Parameters<typeof diplomacySumPn>[0][number];

function toPnItems(items: BasketItem[], ctx: NegotiationModalContext): PnItem[] {
  const tempo = resolveTempo(ctx);
  return items.map(i => ({ typ: i.typ, id: i.id, ilosc: i.ilosc, tempo }));
}

function ensureStyles(): void {
  ensureDiploBrandScope();
  document.getElementById('civ-diplo-basket-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-diplo-basket-overlay{position:fixed;inset:0;z-index:515;background:rgba(0,0,0,0.65);
  display:flex;align-items:center;justify-content:center;padding:12px;pointer-events:auto;}
.civ-diplo-basket{background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:16px 18px;
  max-width:min(1180px,96vw);width:100%;max-height:min(92vh,880px);
  display:flex;flex-direction:column;overflow:hidden;
  color:#e8e0c8;font:14px 'Segoe UI',Tahoma,sans-serif;pointer-events:auto;position:relative;z-index:1;}
.civ-diplo-basket .cdb-body-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:2px;}
.civ-diplo-basket .cdb-footer{flex-shrink:0;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);margin-top:8px;}
.civ-diplo-basket .cdb-landscape{display:grid;grid-template-columns:minmax(280px,0.42fr) minmax(340px,0.58fr);gap:14px;align-items:start;}
.civ-diplo-basket .cdb-land-main{display:flex;flex-direction:column;gap:10px;min-width:0;}
.civ-diplo-basket .cdb-land-side{display:flex;flex-direction:column;gap:10px;min-width:0;max-height:min(68vh,620px);overflow-y:auto;overflow-x:hidden;padding-right:2px;}
.civ-diplo-basket .cdb-land-side .cdb-basket-opt{border-top:none;padding-top:0;margin-top:0;}
@media (max-width:640px){.civ-diplo-basket .cdb-landscape{grid-template-columns:1fr;}
  .civ-diplo-basket .cdb-land-side{max-height:none;overflow:visible;}}
.civ-diplo-basket h3{margin:0 0 6px;font-family:Georgia,serif;font-size:1.05em;color:#e8d88a;}
.civ-diplo-basket .cdb-sub{font-size:0.75em;color:#8a8070;margin-bottom:10px;line-height:1.45;}
.civ-diplo-basket .cdb-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.civ-diplo-basket.cdb-gift .cdb-cols{grid-template-columns:1fr;}
.civ-diplo-basket .cdb-deal-preview{margin-bottom:12px;}
.civ-diplo-basket .da-deal-table{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.civ-diplo-basket .da-deal-col{border:1px solid rgba(232,216,138,.16);border-radius:8px;padding:8px 9px;
  background:linear-gradient(180deg,rgba(18,22,32,.85),rgba(8,10,16,.75));min-width:0;}
.civ-diplo-basket .da-deal-col-we{border-color:rgba(110,150,220,.28);}
.civ-diplo-basket .da-deal-col-they{border-color:rgba(90,208,122,.32);}
.civ-diplo-basket .da-deal-col-head{font-size:0.72em;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  text-align:center;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06);}
.civ-diplo-basket .da-deal-col-we .da-deal-col-head{color:#8ab4e8;}
.civ-diplo-basket .da-deal-col-they .da-deal-col-head{color:#7ad0a0;}
.civ-diplo-basket .da-deal-col-body{display:flex;flex-direction:column;gap:5px;min-height:32px;}
.civ-diplo-basket .da-deal-item{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;line-height:1.35;font-size:0.92em;}
.civ-diplo-basket .da-deal-res-ic{display:inline-flex;align-items:center;flex-shrink:0;opacity:.95;}
.civ-diplo-basket .da-deal-res-ic svg{display:block;}
.civ-diplo-basket .da-deal-amt{font-weight:600;color:#f0e8d8;}
.civ-diplo-basket .da-deal-per{font-size:0.92em;color:#9ad4b0;}
.civ-diplo-basket .da-deal-once{font-size:0.88em;color:#8a8070;}
.civ-diplo-basket .da-deal-total{flex-basis:100%;font-size:0.82em;color:#c8b890;margin-top:2px;}
.civ-diplo-basket .da-deal-sched-foot{margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.06);
  font-size:0.82em;color:#b8a888;text-align:center;}
.civ-diplo-basket .da-deal-empty{color:#6a6058;font-style:italic;font-size:0.88em;}
.civ-diplo-basket .cdb-deal-row{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;flex-wrap:wrap;}
.civ-diplo-basket .cdb-deal-row .da-deal-item{flex:1;min-width:0;}
.civ-diplo-basket .cdb-row-qty{display:inline-flex;align-items:center;gap:2px;flex-shrink:0;}
.civ-diplo-basket .cdb-row-qty-inp{width:52px;padding:2px 4px;text-align:center;font-size:0.85em;}
.civ-diplo-basket .cdb-row-qty-step{min-width:26px;padding:2px 6px;font-size:0.9em;line-height:1.2;}
.civ-diplo-basket .cdb-col{border:1px solid rgba(232,216,138,.2);border-radius:8px;padding:10px;}
.civ-diplo-basket .cdb-col-title{font-size:0.72em;color:#a8a090;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket .cdb-deal-settings{margin:10px 0 4px;display:flex;flex-direction:column;gap:8px;}
.civ-diplo-basket .cdb-item{display:flex;justify-content:space-between;align-items:center;gap:8px;
  padding:5px 7px;margin:3px 0;border-radius:6px;background:rgba(40,48,60,0.45);font-size:0.78em;}
.civ-diplo-basket .cdb-item-pn{color:#e8d88a;white-space:nowrap;}
.civ-diplo-basket .cdb-rm{background:none;border:none;color:#e08a8a;cursor:pointer;font-size:1em;padding:0 4px;}
.civ-diplo-basket .cdb-edit-item{padding:1px 7px;font-size:0.78em;line-height:1.3;flex-shrink:0;}
.civ-diplo-basket .cdb-deal-row-editing{border-radius:6px;background:rgba(232,216,138,.08);outline:1px dashed rgba(232,216,138,.35);}
.civ-diplo-basket .cdb-add-editing{border-top-color:rgba(232,216,138,.4);}
.civ-diplo-basket .cdb-add-btn-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.civ-diplo-basket .cdb-edit-cancel{margin-top:6px;}
.civ-diplo-basket .cdb-add{margin-top:8px;padding-top:8px;border-top:1px dashed rgba(232,216,138,.15);}
.civ-diplo-basket label{display:block;margin:4px 0 2px;font-size:0.72em;color:#a8a090;}
.civ-diplo-basket select,.civ-diplo-basket input[type=number],.civ-diplo-basket input[type=text]{
  width:100%;padding:5px 7px;border-radius:6px;border:1px solid rgba(232,216,138,.28);
  background:rgba(10,12,18,0.9);color:#e8e0c8;font:inherit;box-sizing:border-box;}
.civ-diplo-basket .cdb-summary{margin-top:12px;padding:10px;border-radius:8px;
  background:rgba(30,36,48,0.8);border:1px solid rgba(232,216,138,.18);font-size:0.78em;line-height:1.55;}
.civ-diplo-basket .cdb-summary b{color:#e8d88a;}
.civ-diplo-basket .cdb-warn{color:#e0a868;margin-top:4px;}
.civ-diplo-basket .cdb-split{margin-top:8px;padding-top:8px;border-top:1px dashed rgba(232,216,138,.15);
  display:flex;flex-direction:column;gap:3px;font-size:0.95em;}
.civ-diplo-basket .cdb-verdict{margin-top:7px;padding:6px 9px;border-radius:7px;font-weight:700;font-size:0.92em;}
.civ-diplo-basket .cdb-verdict-good{color:#7ad0a0;background:rgba(80,176,112,.1);border:1px solid rgba(80,176,112,.4);}
.civ-diplo-basket .cdb-verdict-neutral{color:#d4cba0;background:rgba(212,203,160,.08);border:1px solid rgba(212,203,160,.3);}
.civ-diplo-basket .cdb-verdict-bad{color:#e08a8a;background:rgba(200,64,64,.1);border:1px solid rgba(200,64,64,.4);}
.civ-diplo-basket .cdb-blocked{color:#e08a8a;padding:12px;text-align:center;}
.civ-diplo-basket .cdb-add-btn{margin-top:6px;}
.civ-diplo-basket .cdb-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:0;}
.civ-diplo-basket .cdb-submit:disabled{opacity:0.4;cursor:not-allowed;}
.civ-diplo-basket .cdb-invalid{color:#e08a8a;font-size:0.72em;margin-top:8px;line-height:1.4;}
.civ-diplo-basket .cdb-duration{margin-top:10px;padding:10px;border-radius:8px;
  border:1px solid rgba(232,216,138,.22);background:rgba(24,30,40,0.55);}
.civ-diplo-basket .cdb-duration label{margin-top:0;}
.civ-diplo-basket .cdb-fields-extra{display:none;}
.civ-diplo-basket .cdb-fields-extra.visible{display:block;}
.civ-diplo-basket .cdb-treaty{margin-bottom:12px;padding:10px;border-radius:8px;
  border:1px solid rgba(232,216,138,.22);background:rgba(24,30,40,0.55);}
.civ-diplo-basket .cdb-treaty-title{font-size:0.78em;color:#e8d88a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket .cdb-basket-opt{margin-top:10px;padding-top:10px;border-top:1px dashed rgba(232,216,138,.15);}
.civ-diplo-basket .cdb-basket-opt-title{font-size:0.72em;color:#a8a090;margin:0 0 8px;}
/* Chipy wyboru pozycji — ikony brand/HUD (bez nowych SVG). */
.civ-diplo-basket .cdb-chip-grid{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px;}
.civ-diplo-basket .cdb-chip{display:inline-flex;flex-direction:column;align-items:center;gap:3px;
  min-width:62px;padding:7px 8px;border-radius:8px;border:1px solid rgba(232,216,138,.22);
  background:rgba(18,22,30,.85);color:#c8b898;cursor:pointer;font:inherit;font-size:0.68em;
  transition:border-color .15s,background .15s,box-shadow .15s;}
.civ-diplo-basket .cdb-chip:hover{border-color:rgba(232,216,138,.45);background:rgba(28,34,46,.92);}
.civ-diplo-basket .cdb-chip.selected{border-color:rgba(232,216,138,.65);
  background:rgba(40,48,64,.95);color:#f0e8d8;box-shadow:0 0 0 1px rgba(232,216,138,.25);}
.civ-diplo-basket .cdb-chip-ic{display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;opacity:.95;}
.civ-diplo-basket .cdb-chip-ic svg{display:block;}
.civ-diplo-basket .cdb-chip-lbl{text-align:center;line-height:1.2;max-width:72px;}
.civ-diplo-basket .cdb-chip-meta{font-size:0.85em;color:#8a8070;}
.civ-diplo-basket .cdb-chip-stock{display:inline-block;max-width:64px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;font-size:0.86em;font-weight:600;line-height:1.15;
  padding:1px 6px;border-radius:8px;background:rgba(232,216,138,.14);color:#d8c888;}
.civ-diplo-basket .cdb-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0;}
.civ-diplo-basket .cdb-chip.cdb-chip-mode{flex-direction:row;min-width:0;padding:8px 12px;gap:6px;font-size:0.78em;}
.civ-diplo-basket .cdb-chip.cdb-chip-turn{min-width:36px;padding:6px 10px;font-size:0.78em;font-weight:600;}
.civ-diplo-basket .cdb-qty-stepper{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:4px 0;}
.civ-diplo-basket .cdb-qty-step{padding:5px 9px;font-size:0.72em;min-width:42px;}
.civ-diplo-basket .cdb-qty-stepper input[type=number]{flex:1;min-width:72px;max-width:110px;}
.civ-diplo-basket .cdb-add-section{margin:6px 0 4px;}
.civ-diplo-basket .cdb-add-section-title{font-size:0.7em;color:#a8a090;margin:0 0 4px;text-transform:uppercase;letter-spacing:.05em;}
.civ-diplo-basket .cdb-deal-settings-title{font-size:0.72em;color:#e8d88a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket .cdb-typ-hidden{display:none;}
/* Panel PN — wspólny układ ze stołem negocjacji (diplomacyAcceptanceBalance.ts). */
.civ-diplo-basket .da-pn-balance-bar{margin-top:10px;margin-bottom:10px;}
.civ-diplo-basket .da-pn-balance-bar{border-radius:10px;padding:10px 12px;border:2px solid rgba(232,216,138,.28);
  background:linear-gradient(180deg,rgba(22,28,40,.95),rgba(10,14,22,.92));}
.civ-diplo-basket .da-pn-balance-bar.ok{border-color:rgba(90,208,122,.45);}
.civ-diplo-basket .da-pn-balance-bar.no{border-color:rgba(224,136,104,.45);}
.civ-diplo-basket .da-pn-bal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
.civ-diplo-basket .da-pn-bal-head-titles{display:inline-flex;align-items:baseline;gap:6px;}
.civ-diplo-basket .da-pn-bal-title{font-size:0.68em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e8d88a;cursor:help;}
.civ-diplo-basket .da-pn-bal-abbr{font-size:0.62em;font-weight:700;letter-spacing:.06em;color:#c8b898;text-decoration:none;cursor:help;border-bottom:1px dotted rgba(200,184,152,.45);}
.civ-diplo-basket .da-pn-bal-deal{font-size:0.72em;color:#c8b898;}
.civ-diplo-basket .da-pn-bal-cols{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:8px;}
.civ-diplo-basket .da-pn-bal-cell{border-radius:8px;padding:8px 10px;border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.22);text-align:center;display:flex;flex-direction:column;gap:3px;}
.civ-diplo-basket .da-pn-bal-cell.my{border-color:rgba(110,150,220,.35);}
.civ-diplo-basket .da-pn-bal-cell.they{border-color:rgba(90,208,122,.35);}
.civ-diplo-basket .da-pn-bal-cell.center.ok{border-color:rgba(90,208,122,.5);background:rgba(40,80,50,.25);}
.civ-diplo-basket .da-pn-bal-cell.center.no{border-color:rgba(224,136,104,.45);background:rgba(80,40,30,.2);}
.civ-diplo-basket .da-pn-bal-lbl{font-size:0.58em;text-transform:uppercase;letter-spacing:.06em;color:#8a8070;}
.civ-diplo-basket .da-pn-bal-num{font-size:1.1em;font-weight:700;color:#f0e8d8;display:flex;flex-direction:column;align-items:center;gap:2px;}
.civ-diplo-basket .da-pn-bal-pw{font-size:1em;font-weight:700;color:inherit;line-height:1.2;}
.civ-diplo-basket .da-pn-bal-base{display:block;font-size:0.62em;font-weight:500;color:#8a8070;margin-top:2px;line-height:1.3;white-space:normal;}
.civ-diplo-basket .da-pn-bal-num.pos{color:#7ad0a0;}
.civ-diplo-basket .da-pn-bal-num.neg{color:#e0a868;}
.civ-diplo-basket .da-pn-bal-hint{font-size:0.62em;color:#a8a090;}
.civ-diplo-basket .da-pn-bal-meta{font-size:0.62em;color:#8a8070;margin-top:6px;}
.civ-diplo-basket .da-pn-rel-mod{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px;margin-top:8px;padding:6px 10px;
  border-radius:7px;border:1px solid rgba(140,150,165,.25);background:rgba(0,0,0,.18);cursor:help;}
.civ-diplo-basket .da-pn-rel-mod-pct{font-size:0.72em;font-weight:800;padding:2px 7px;border-radius:5px;
  background:rgba(0,0,0,.25);color:#e8d88a;}
.civ-diplo-basket .da-pn-rel-mod.worse .da-pn-rel-mod-pct{color:#e0a868;}
.civ-diplo-basket .da-pn-rel-mod.better .da-pn-rel-mod-pct{color:#7ad0a0;}
.civ-diplo-basket .da-pn-rel-mod-label{font-size:0.58em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8a8070;}
.civ-diplo-basket .da-pn-rel-mod-text{font-size:0.7em;line-height:1.35;color:#d8d0c0;}
.civ-diplo-basket .da-pn-rel-mod-text strong{color:#f0e8d8;font-weight:700;}
.civ-diplo-basket .da-pn-rel-mod-deal{font-weight:600;}
.civ-diplo-basket .da-pn-rel-mod-balance{font-size:0.92em;color:#8a8070;}
.civ-diplo-basket .da-pn-rel-mod.better{border-color:rgba(90,208,122,.4);background:rgba(40,80,50,.2);}
.civ-diplo-basket .da-pn-rel-mod.better .da-pn-rel-mod-deal{color:#7ad0a0;}
.civ-diplo-basket .da-pn-rel-mod.worse{border-color:rgba(224,136,104,.4);background:rgba(80,40,30,.18);}
.civ-diplo-basket .da-pn-rel-mod.worse .da-pn-rel-mod-deal{color:#e0a868;}
.civ-diplo-basket .da-pn-rel-mod.neutral{border-color:rgba(140,150,165,.3);}
.civ-diplo-basket .da-pn-rel-mod.neutral .da-pn-rel-mod-deal{color:#c8b898;}
.civ-diplo-basket .da-pn-bal-verdict{margin-top:8px;padding:7px 10px;border-radius:7px;font-size:0.72em;font-weight:600;}
.civ-diplo-basket .da-pn-bal-verdict.ok{color:#7ad0a0;background:rgba(80,176,112,.12);border:1px solid rgba(80,176,112,.35);}
.civ-diplo-basket .da-pn-bal-verdict.no{color:#e0a868;background:rgba(224,168,104,.1);border:1px solid rgba(224,168,104,.35);}
.civ-diplo-basket.cdb-treaty-only-mode{max-width:min(900px,96vw);}
.civ-diplo-basket.cdb-treaty-only-mode .cdb-treaty-only-body{display:contents;}
.civ-diplo-basket.cdb-treaty-only-mode .cdb-treaty{margin-bottom:0;}
.civ-diplo-basket.cdb-treaty-only-mode .cdb-penalty-box{margin-top:10px;padding:8px 10px;border-radius:8px;
  border:1px solid rgba(224,136,104,.28);background:rgba(80,40,30,.15);}
.civ-diplo-basket.cdb-treaty-only-mode .cdb-penalty-title{font-size:0.72em;color:#e8d88a;margin:0 0 4px;
  text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket.cdb-treaty-only-mode .cdb-btns.cdb-btns-center{justify-content:center;}
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
  if (overlay !== null) {
    popOverlay('diplo-trade-basket');
    overlay.remove();
    overlay = null;
  }
  activeOnCancel = undefined;
}

function dismissTradeBasketViaEscape(): void {
  const cb = activeOnCancel;
  closeModal();
  cb?.();
}

function defaultUnitOptions(): Array<{ id: string; label: string }> {
  return (unitsJson as Array<{ Jednostka?: string }>)
    .filter(u => typeof u.Jednostka === 'string')
    .map(u => ({ id: u.Jednostka!, label: u.Jednostka! }));
}

function defaultTechOptions(): Array<{ id: string; label: string }> {
  return ((techJson as { technologie?: Array<{ Technologia?: string }> }).technologie ?? [])
    .filter(t => typeof t.Technologia === 'string')
    .map(t => ({ id: t.Technologia!, label: t.Technologia! }));
}

function defaultZlozeOptions(): Array<{ id: string; label: string }> {
  return Object.keys(HANDEL_ZLOZE_CENA_BAZA).map(id => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }));
}

function defaultResourceOptions(): Array<{ id: string; label: string }> {
  const cat = diplomacyResourceAccessCatalog();
  return Object.entries(cat).map(([id, pn]) => ({
    id,
    label: id + ' (' + pn + ' PW)',
  }));
}

/**
 * Fallback (legacy/testy bez wpięcia diplomacy-goods.ts) — katalog cen, BEZ realnego
 * stanu magazynu, więc `maxQty` jest umowną górną granicą (nie odzwierciedla
 * faktycznych zapasów). main.ts zawsze podaje realne `giveQuantityResourceOptions` /
 * `receiveQuantityResourceOptions` — ten fallback praktycznie nie jest używany w grze.
 * R-DYP-PAKIET-USUN (2026-08-08): sztuki wprost, bez pojęcia pakietu.
 */
const FALLBACK_QUANTITY_MAX_QTY = 99;

function defaultQuantityResourceOptions(): Array<{ id: string; label: string; maxQty: number }> {
  const cat = diplomacyHandelSurowceCatalog();
  return Object.keys(cat).map(id => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    maxQty: FALLBACK_QUANTITY_MAX_QTY,
  }));
}

function basketHasResourceAccess(...lists: ReadonlyArray<readonly BasketItem[]>): boolean {
  for (const items of lists) {
    if (items.some(i => i.typ === 'zloze' || i.typ === 'surowiec_boolean')) return true;
  }
  return false;
}

/** HANDEL-SUROWCE-CYKL (2026-07-24): czy koszyk zawiera surowiec ILOŚCIOWY (sztuki ze spichlerza miast). */
function basketHasQuantityResource(...lists: ReadonlyArray<readonly BasketItem[]>): boolean {
  for (const items of lists) {
    if (items.some(i => i.typ === 'surowiec_ilosc')) return true;
  }
  return false;
}

interface BasketValidation {
  valid: boolean;
  reason?: string;
}

/** Pola traktatu (R-DYP-STOL-A=C) — współdzielone między refresh() w showTradeBasketModal. */
interface TreatyFormState {
  turns: number;
  allianceKind: 'defensywny' | 'pelny';
  borderMilitary: boolean;
  barbarianCooperation: boolean;
  tributeMode: 'demand' | 'offer';
  goldPerTurn: number;
  tributeTurns: number;
  goldOnce: number;
  techId: string;
  /** R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A: kierunek handlu tech (akcja '6'). */
  techDirection: 'sell' | 'buy';
  /** Sposób zapłaty za `techId` — 'gold' (domyślne) lub 'tech' (tech-za-tech). */
  techPaymentMode: 'gold' | 'tech';
  /** Technologia oferowana w zamian, gdy techPaymentMode === 'tech'. */
  techOfferId: string;
  bribeGold: number;
  targetOwnerId: number;
}

/**
 * Traktaty bez opcjonalnego koszyka PW (tylko warunki umowy w formularzu).
 * R-DYP-STOL-A-KOREKTA (2026-08-09): przywraca zestaw 7 pozycji sprzed
 * niedokumentowanego skurczenia w commicie 9cc7c76c (2026-08-05, "NAP bezterminowy na
 * stole audiencji") — ten commit zredukował ten Set z 7 elementów do 1 ('15') przy
 * okazji niezwiązanej zmiany, nie na mocy żadnej decyzji (patrz
 * R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY w PYTANIA-OTWARTE.md). Pakt (2), sojusz (3),
 * przemarsz (4), trybut (8), pokój (10), wasalizacja (12), wchłonięcie (15) to "traktaty"
 * sensu stricto — ich warunki są parametrami umowy (czas trwania, tryb, kwota
 * trybutu/opłaty), NIE wymianą surowców. Cytat decyzji Macieja: "Wszystkie umowy muszą
 * być poza umową na wymianę surowców bez propozycji wymiany surowców [...] to musi być
 * rozłożone, rozłączone z tego względu że zaburza przejrzystość".
 * Akcje '6' (wymiana technologii), '7' (namowa do wojny), '9' (ultimatum) ŚWIADOMIE
 * zostają z koszykiem — ich zakres jest osobnym, otwartym pytaniem
 * (R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY), nie domyślany tutaj.
 */
const TREATY_ONLY_FORM_IDS = new Set<string>(['2', '3', '4', '8', '10', '12', '15']);

export function isTreatyOnlyFormAction(actionId: string): boolean {
  return TREATY_ONLY_FORM_IDS.has(actionId);
}

/**
 * R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A: lista technologii GŁÓWNYCH (te, które faktycznie
 * zmieniają właściciela jako `techId`) dla danego kierunku — 'sell' = to, co gracz może
 * ZAOFEROWAĆ (`giveTechOptions`/legacy `techOptions`), 'buy' = to, co gracz może DOSTAĆ
 * (`receiveTechOptions`). Reużywana w defaultTreatyState / treatySectionHtml /
 * readTreatyStateFromDom, żeby nie rozjeżdżały się trzy niezależne kopie tej samej gałęzi.
 */
function techTradeMainOptions(
  direction: 'sell' | 'buy',
  ctx?: NegotiationModalContext,
): ReadonlyArray<{ id: string; label: string; suggestedPrice: number }> {
  return direction === 'buy'
    ? (ctx?.receiveTechOptions ?? [])
    : (ctx?.giveTechOptions ?? ctx?.techOptions ?? defaultTechOptions().map(t => ({ ...t, suggestedPrice: 0 })));
}

/**
 * Lista technologii OFEROWANYCH W ZAMIAN (tryb zapłaty 'tech', `techOfferId`) — zawsze
 * PRZECIWNA do `techTradeMainOptions` dla tego samego kierunku (patrz
 * diplomacy-tech-trade.ts::resolveTechTradeParties — zapłata płynie payer→payee, czyli w
 * stronę PRZECIWNĄ do głównej technologii).
 */
function techTradeOfferOptions(
  direction: 'sell' | 'buy',
  ctx?: NegotiationModalContext,
): ReadonlyArray<{ id: string; label: string; suggestedPrice: number }> {
  return direction === 'buy'
    ? (ctx?.giveTechOptions ?? ctx?.techOptions ?? defaultTechOptions().map(t => ({ ...t, suggestedPrice: 0 })))
    : (ctx?.receiveTechOptions ?? []);
}

function defaultTreatyState(actionId: string, initial?: TradeBasketInitial, ctx?: NegotiationModalContext): TreatyFormState {
  const wchlonGold = ctx?.wchloniecieGoldRequired ?? 200;
  // N4/B: brak pola w starym zapisie -> 'sell' (zachowanie sprzed R-HANDEL-TECH-AKCJA6-
  // DWUKIERUNKOWY-Q1=A, gracz zawsze sprzedawał).
  const techDirection: 'sell' | 'buy' = initial?.techDirection === 'buy' ? 'buy' : 'sell';
  const techPaymentMode: 'gold' | 'tech' = initial?.techPaymentMode === 'tech' ? 'tech' : 'gold';
  const techs = techTradeMainOptions(techDirection, ctx);
  const offerTechs = techTradeOfferOptions(techDirection, ctx);
  const rivals = ctx?.rivalOptions ?? [];
  const defaultTurns = actionId === '5' ? 20 : (actionId === '2' ? 15 : 10);
  const initialTurns = initial?.turns;
  const turns = initialTurns != null
    ? (initialTurns <= 0 ? 0 : Math.max(10, Math.min(20, initialTurns)))
    : defaultTurns;
  return {
    turns,
    allianceKind: initial?.allianceKind === 'defensywny' ? 'defensywny' : 'pelny',
    borderMilitary: initial?.borderMilitary ?? false,
    barbarianCooperation: initial?.barbarianCooperation ?? false,
    tributeMode: initial?.tributeMode === 'offer' ? 'offer' : 'demand',
    goldPerTurn: initial?.goldPerTurn ?? (actionId === '12' ? 10 : 15),
    tributeTurns: initial?.tributeTurns ?? 0,
    goldOnce: initial?.goldOnce ?? (actionId === '15' ? wchlonGold : (actionId === '9' ? 50 : 0)),
    techId: initial?.techId ?? techs[0]?.id ?? '',
    techDirection,
    techPaymentMode,
    techOfferId: initial?.techOfferId ?? offerTechs[0]?.id ?? '',
    bribeGold: initial?.bribeGold ?? 30,
    targetOwnerId: initial?.targetOwnerId ?? rivals[0]?.ownerId ?? -1,
  };
}

function treatySectionHtml(actionId: string, ctx: NegotiationModalContext, state: TreatyFormState): string {
  const sub = ctx.aiCounterOffer
    ? '<p class="cdb-sub">' + esc(ctx.aiCounterOffer) + '</p>'
    : '';
  let body = '';
  switch (actionId) {
    case '2': {
      const turnChips = [10, 15, 20].map(t =>
        '<button type="button" class="cdb-chip cdb-chip-turn' + (state.turns === t ? ' selected' : '')
        + '" data-turns="' + t + '">' + t + '</button>',
      ).join('');
      const indefiniteSelected = state.turns <= 0 ? ' selected' : '';
      body = '<label for="cdb-treaty-turns">Czas paktu</label>'
        + '<div class="cdb-chip-row cdb-turn-presets">' + turnChips
        + '<button type="button" class="cdb-chip cdb-chip-turn' + indefiniteSelected
        + '" data-turns="0">Bezterminowy</button></div>'
        + qtyStepperHtml('cdb-treaty-turns', 'treaty', state.turns <= 0 ? 0 : state.turns, 0, 20)
        + '<p class="cdb-sub">Ręcznie: 10–20 tur lub 0 = bezterminowy</p>'
        + '<div class="cdb-penalty-box">'
        + '<div class="cdb-penalty-title">Koszty / kary</div>'
        + '<p class="cdb-sub" style="margin:0">Złamanie paktu: −30 Relacja, −20 Zaufanie</p>'
        + '</div>';
      break;
    }
    case '3':
      body = '<label>Typ sojuszu</label>'
        + '<select id="cdb-treaty-alliance" class="cdb-treaty-alliance">'
        + '<option value="pelny"' + (state.allianceKind === 'pelny' ? ' selected' : '') + '>Sojusz wojskowy (wojna sojusznika = twoja)</option>'
        + '<option value="defensywny"' + (state.allianceKind === 'defensywny' ? ' selected' : '') + '>Sojusz obronny (atak na sojusznika)</option>'
        + '</select>'
        + '<div class="cdb-penalty-box">'
        + '<div class="cdb-penalty-title">Koszty / kary</div>'
        + '<p class="cdb-sub" style="margin:0">Zerwanie sojuszu / wojna z sojusznikiem: kary Relacji i Wiarygodności</p>'
        + '</div>';
      break;
    case '4': {
      const feeC = ctx.borderFeeCivil ?? 20;
      const feeM = ctx.borderFeeMilitary ?? 40;
      body = '<label>Traktat przemarszu</label>'
        + '<div class="cdb-row" style="display:flex;gap:8px;align-items:center;margin:6px 0">'
        + '<input type="checkbox" id="cdb-treaty-mil" class="cdb-treaty-mil"' + (state.borderMilitary ? ' checked' : '') + ' />'
        + '<label for="cdb-treaty-mil" style="margin:0">Wariant wojskowy (+ opłata)</label></div>'
        + '<div class="cdb-row" style="display:flex;gap:8px;align-items:center;margin:6px 0">'
        + '<input type="checkbox" id="cdb-treaty-barb" class="cdb-treaty-barb"' + (state.barbarianCooperation ? ' checked' : '') + ' />'
        + '<label for="cdb-treaty-barb" style="margin:0">Wspólna walka z barbarzyńcami (3 tury)</label></div>'
        + '<p class="cdb-sub">Opłata cywilne: ' + feeC + ' ¤ · wojskowe: ' + feeM + ' ¤ (jednorazowo)</p>';
      break;
    }
    case '8':
      body = '<label>Tryb</label>'
        + '<select id="cdb-treaty-trib-mode" class="cdb-treaty-trib-mode">'
        + '<option value="demand"' + (state.tributeMode === 'demand' ? ' selected' : '') + '>Żądaj trybutu</option>'
        + '<option value="offer"' + (state.tributeMode === 'offer' ? ' selected' : '') + '>Zaproponuj trybut (uniknij wojny)</option>'
        + '</select>'
        + '<label for="cdb-treaty-gpt">Kwota ¤/turę</label>'
        + '<input type="number" id="cdb-treaty-gpt" class="cdb-treaty-gpt" value="' + state.goldPerTurn + '" min="10" />'
        + '<label for="cdb-treaty-trib-turns">Czas (tur, 0 = bezterminowy)</label>'
        + '<input type="number" id="cdb-treaty-trib-turns" class="cdb-treaty-trib-turns" value="' + state.tributeTurns + '" min="0" />';
      break;
    case '12':
      body = '<label for="cdb-treaty-wasal-gpt">Trybut wasala ¤/turę</label>'
        + '<input type="number" id="cdb-treaty-wasal-gpt" class="cdb-treaty-wasal-gpt" value="' + state.goldPerTurn + '" min="10" />'
        + '<p class="cdb-sub">Wasal zachowuje terytorium · płaci trybut co turę</p>';
      break;
    case '15': {
      const minGold = ctx.wchloniecieGoldRequired ?? 200;
      body = '<label for="cdb-treaty-wchlon-gold">Opłata za wchłonięcie (¤)</label>'
        + '<input type="number" id="cdb-treaty-wchlon-gold" class="cdb-treaty-wchlon-gold" value="' + state.goldOnce + '" min="' + minGold + '" />'
        + '<p class="cdb-sub">Wymagane minimum ' + minGold + ' ¤ · wasal musi wyrazić zgodę (Relacja ≥ 60)</p>';
      break;
    }
    case '5': {
      const turnChips = [10, 15, 20].map(t =>
        '<button type="button" class="cdb-chip cdb-chip-turn' + (state.turns === t ? ' selected' : '')
        + '" data-turns="' + t + '">' + t + '</button>',
      ).join('');
      body = '<label for="cdb-treaty-turns">Czas traktatu handlowego (tur)</label>'
        + '<div class="cdb-chip-row cdb-turn-presets">' + turnChips + '</div>'
        + qtyStepperHtml('cdb-treaty-turns', 'treaty', state.turns, 1, 20)
        + '<p class="cdb-sub">Fundament szlaków handlowych — opcjonalnie dołóż wymianę PW poniżej.</p>';
      break;
    }
    case '6': {
      // R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A (runda 2, pełny zakres decyzji): Sprzedaż
      // (gracz oddaje) / Kupno (gracz dostaje) × Gotówka / Technologia (tech-za-tech,
      // diplomacy.json „Wymiana bezpłatna" — bez przepływu gotówki). Listy tych samych
      // katalogów co ogólny koszyk (akcja '14'): giveTechOptions/techOptions dla sprzedaży,
      // receiveTechOptions dla kupna (R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE) — lista "oferowana
      // w zamian" jest zawsze PRZECIWNA (patrz techTradeOfferOptions).
      const dirChips = (['sell', 'buy'] as const).map(d =>
        '<button type="button" class="cdb-chip cdb-treaty-tech-dir'
        + (state.techDirection === d ? ' selected' : '') + '" data-value="' + d + '">'
        + (d === 'sell' ? 'Sprzedaż' : 'Kupno') + '</button>',
      ).join('');
      const techs = techTradeMainOptions(state.techDirection, ctx);
      body = '<label>Kierunek</label>'
        + '<div class="cdb-chip-row">' + dirChips + '</div>';
      if (techs.length === 0) {
        body += '<p class="cdb-sub">' + (state.techDirection === 'buy'
          ? 'Brak technologii do kupienia (partner nie ma nic, czego jeszcze nie masz).'
          : 'Brak technologii do sprzedaży.') + '</p>';
      } else {
        const sel = techs.map(t =>
          '<option value="' + esc(t.id) + '"' + (t.id === state.techId ? ' selected' : '') + '>'
          + esc(t.label) + (t.suggestedPrice ? ' (~' + t.suggestedPrice + ' ¤)' : '') + '</option>',
        ).join('');
        body += '<label>Technologia</label>'
          + '<select id="cdb-treaty-tech" class="cdb-treaty-tech">' + sel + '</select>';

        const payChips = (['gold', 'tech'] as const).map(pm =>
          '<button type="button" class="cdb-chip cdb-treaty-tech-pay'
          + (state.techPaymentMode === pm ? ' selected' : '') + '" data-value="' + pm + '">'
          + (pm === 'gold' ? 'Gotówka' : 'Technologia') + '</button>',
        ).join('');
        body += '<label>Sposób zapłaty</label>'
          + '<div class="cdb-chip-row">' + payChips + '</div>';

        if (state.techPaymentMode === 'tech') {
          const offerTechs = techTradeOfferOptions(state.techDirection, ctx);
          if (offerTechs.length === 0) {
            body += '<p class="cdb-sub">' + (state.techDirection === 'buy'
              ? 'Brak własnej technologii do zaoferowania w zamian.'
              : 'Partner nie ma czym zapłacić technologią.') + '</p>';
          } else {
            const offerSel = offerTechs.map(t =>
              '<option value="' + esc(t.id) + '"' + (t.id === state.techOfferId ? ' selected' : '') + '>'
              + esc(t.label) + '</option>',
            ).join('');
            body += '<label>Oferowana technologia w zamian</label>'
              + '<select id="cdb-treaty-tech-offer" class="cdb-treaty-tech-offer">' + offerSel + '</select>';
          }
        } else {
          const price = state.goldOnce > 0 ? state.goldOnce : (techs.find(t => t.id === state.techId)?.suggestedPrice ?? 50);
          body += '<label for="cdb-treaty-tech-price">Cena (¤)</label>'
            + '<input type="number" id="cdb-treaty-tech-price" class="cdb-treaty-tech-price" value="' + price + '" min="1" />';
        }
      }
      break;
    }
    case '7': {
      const rivals = ctx.rivalOptions ?? [];
      if (rivals.length === 0) {
        body = '<p class="cdb-sub">Brak znanych wrogów tej cywilizacji.</p>';
      } else {
        const sel = rivals.map(r =>
          '<option value="' + r.ownerId + '"' + (r.ownerId === state.targetOwnerId ? ' selected' : '') + '>'
          + esc(r.label) + '</option>',
        ).join('');
        body = '<label>Cel wojny</label>'
          + '<select id="cdb-treaty-rival" class="cdb-treaty-rival">' + sel + '</select>'
          + '<label for="cdb-treaty-bribe">Łapówka (¤)</label>'
          + '<input type="number" id="cdb-treaty-bribe" class="cdb-treaty-bribe" value="' + state.bribeGold + '" min="0" />';
      }
      break;
    }
    case '9':
      body = '<label for="cdb-treaty-ult-gold">Reparacje (¤)</label>'
        + '<input type="number" id="cdb-treaty-ult-gold" class="cdb-treaty-ult-gold" value="' + state.goldOnce + '" min="0" />'
        + '<p class="cdb-sub">Odmowa partnera = casus belli (zaznacz ultimatum poniżej).</p>';
      break;
    case '10':
      // R-DYP-STOL-A-KOREKTA (2026-08-09, nota Evaluatora): akcja '10' (pokój) jest teraz
      // w TREATY_ONLY_FORM_IDS (patrz wyżej) — formularz "tylko warunki" nie renderuje
      // ŻADNEGO koszyka PW "poniżej" (patrz renderBasket, gałąź isTreatyOnly), więc zdanie
      // odsyłające do koszyka byłoby martwym, mylącym tekstem. Zdanie identyczne w case '5'
      // ZOSTAJE bez zmian — ta ścieżka jest martwa (akcja 5 nie otwiera tego modala, patrz
      // diplomacyAudience.ts), poza zakresem tej naprawy.
      body = '<p class="cdb-sub">Zakończenie wojny. Wymagane PW traktatu zależą od Relacji (baza ~500 PW, modyfikator ±90%).</p>';
      break;
    default:
      body = '<p class="cdb-sub">Brak dodatkowych warunków traktatu.</p>';
  }
  return '<div class="cdb-treaty">' + sub
    + '<div class="cdb-treaty-title">Warunki traktatu</div>'
    + body + '</div>';
}

function readTreatyStateFromDom(actionId: string, prev: TreatyFormState, ctx?: NegotiationModalContext): TreatyFormState {
  const state = { ...prev };
  if (actionId === '2') {
    const turns = parseInt((document.querySelector('.cdb-treaty-turns') as HTMLInputElement)?.value ?? '15', 10);
    state.turns = turns <= 0 ? 0 : Math.max(10, Math.min(20, turns));
  } else if (actionId === '3') {
    const v = (document.querySelector('.cdb-treaty-alliance') as HTMLSelectElement)?.value;
    state.allianceKind = v === 'defensywny' ? 'defensywny' : 'pelny';
  } else if (actionId === '4') {
    state.borderMilitary = (document.querySelector('.cdb-treaty-mil') as HTMLInputElement)?.checked ?? false;
    state.barbarianCooperation = (document.querySelector('.cdb-treaty-barb') as HTMLInputElement)?.checked ?? false;
  } else if (actionId === '8') {
    const mode = (document.querySelector('.cdb-treaty-trib-mode') as HTMLSelectElement)?.value;
    state.tributeMode = mode === 'offer' ? 'offer' : 'demand';
    state.goldPerTurn = parseInt((document.querySelector('.cdb-treaty-gpt') as HTMLInputElement)?.value ?? '10', 10);
    state.tributeTurns = parseInt((document.querySelector('.cdb-treaty-trib-turns') as HTMLInputElement)?.value ?? '0', 10);
  } else if (actionId === '12') {
    state.goldPerTurn = parseInt((document.querySelector('.cdb-treaty-wasal-gpt') as HTMLInputElement)?.value ?? '10', 10);
  } else if (actionId === '15') {
    state.goldOnce = parseInt((document.querySelector('.cdb-treaty-wchlon-gold') as HTMLInputElement)?.value ?? '0', 10);
  } else if (actionId === '5') {
    const turns = parseInt((document.querySelector('.cdb-treaty-turns') as HTMLInputElement)?.value ?? '20', 10);
    state.turns = Math.max(1, Math.min(20, turns));
  } else if (actionId === '6') {
    // N1 (Evaluator runda 1): przełączenie kierunku Sprzedaż/Kupno zmienia listę
    // technologii, ale w chwili tego odczytu DOM jeszcze pokazuje POPRZEDNI render (ten
    // odczyt biegnie PRZED renderBasket w refresh()) — sam `<select>` może więc realnie
    // istnieć, ale należeć do INNEJ (starej) listy niż `state.techDirection` świeżo
    // odczytany tu wyżej. Dlatego lista aktywnego kierunku jest liczona wprost z `ctx`
    // (dane, nie DOM) — to jedyne źródło odporne na to opóźnienie o jeden cykl renderu.
    // Brak przycisku w DOM = jeszcze nie wyrenderowano (pierwsze wywołanie refresh() na
    // pustym `box`, patrz showTradeBasketModal) -> zachowaj poprzedni kierunek (initial/
    // domyślny z defaultTreatyState), nie nadpisuj go na sztywno 'sell'.
    const dirBtn = document.querySelector('.cdb-treaty-tech-dir.selected') as HTMLElement | null;
    const direction: 'sell' | 'buy' = dirBtn
      ? (dirBtn.getAttribute('data-value') === 'buy' ? 'buy' : 'sell')
      : prev.techDirection;
    state.techDirection = direction;
    const activeTechs = techTradeMainOptions(direction, ctx);
    if (activeTechs.length === 0) {
      // Lista aktualnego kierunku jest pusta -> nie ma czego wybrać, niezależnie od tego,
      // co select jeszcze POKAZUJE sprzed przerysowania. Bez tego walidacja (i disabled
      // przycisku, patrz validateTreatyForm) przechodziłaby na nieaktualnym techId.
      state.techId = '';
    } else {
      const domSelect = document.querySelector('.cdb-treaty-tech') as HTMLSelectElement | null;
      if (domSelect && activeTechs.some(t => t.id === domSelect.value)) {
        state.techId = domSelect.value;
      } else if (!activeTechs.some(t => t.id === state.techId)) {
        state.techId = activeTechs[0]!.id;
      }
    }

    // Sposób zapłaty — ten sam wzorzec „brak przycisku w DOM = jeszcze nie wyrenderowano"
    // co dla kierunku wyżej (zachowaj poprzedni tryb zamiast twardego 'gold').
    const payBtn = document.querySelector('.cdb-treaty-tech-pay.selected') as HTMLElement | null;
    const paymentMode: 'gold' | 'tech' = payBtn
      ? (payBtn.getAttribute('data-value') === 'tech' ? 'tech' : 'gold')
      : prev.techPaymentMode;
    state.techPaymentMode = paymentMode;

    if (paymentMode === 'tech') {
      // Ta sama logika odporna-na-opóźniony-render co dla techId — lista „oferowana w
      // zamian" liczona z ctx (dane), nie z DOM.
      const offerTechs = techTradeOfferOptions(direction, ctx);
      if (offerTechs.length === 0) {
        state.techOfferId = '';
      } else {
        const domOfferSelect = document.querySelector('.cdb-treaty-tech-offer') as HTMLSelectElement | null;
        if (domOfferSelect && offerTechs.some(t => t.id === domOfferSelect.value)) {
          state.techOfferId = domOfferSelect.value;
        } else if (!offerTechs.some(t => t.id === state.techOfferId)) {
          state.techOfferId = offerTechs[0]!.id;
        }
      }
    } else {
      const priceInp = document.querySelector('.cdb-treaty-tech-price') as HTMLInputElement | null;
      if (priceInp) state.goldOnce = parseInt(priceInp.value, 10) || 0;
    }
  } else if (actionId === '7') {
    state.targetOwnerId = parseInt((document.querySelector('.cdb-treaty-rival') as HTMLSelectElement)?.value ?? '-1', 10);
    state.bribeGold = parseInt((document.querySelector('.cdb-treaty-bribe') as HTMLInputElement)?.value ?? '0', 10);
  } else if (actionId === '9') {
    state.goldOnce = parseInt((document.querySelector('.cdb-treaty-ult-gold') as HTMLInputElement)?.value ?? '0', 10);
  }
  return state;
}

function validateTreatyForm(actionId: string, state: TreatyFormState, ctx?: NegotiationModalContext): BasketValidation {
  switch (actionId) {
    case '2':
      if (state.turns === 0) break;
      if (state.turns < 10 || state.turns > 20) {
        return { valid: false, reason: 'Czas paktu: bezterminowy (0) lub 10–20 tur' };
      }
      break;
    case '8':
      if (state.goldPerTurn < 10) {
        return { valid: false, reason: 'Trybut: minimum 10 ¤/turę' };
      }
      break;
    case '12':
      if (state.goldPerTurn < 10) {
        return { valid: false, reason: 'Trybut wasala: minimum 10 ¤/turę' };
      }
      break;
    case '15': {
      const minGold = ctx?.wchloniecieGoldRequired ?? 200;
      if (state.goldOnce < minGold) {
        return { valid: false, reason: 'Wchłonięcie: minimum ' + minGold + ' ¤' };
      }
      break;
    }
    case '5':
      if (state.turns < 1 || state.turns > 20) {
        return { valid: false, reason: 'Czas traktatu handlowego: od 1 do 20 tur' };
      }
      break;
    case '6':
      if (!state.techId) {
        return {
          valid: false,
          reason: state.techDirection === 'buy'
            ? 'Brak technologii do kupienia'
            : 'Wybierz technologię do sprzedaży',
        };
      }
      if (state.techPaymentMode === 'tech') {
        if (!state.techOfferId) {
          return {
            valid: false,
            reason: state.techDirection === 'buy'
              ? 'Wybierz własną technologię do zaoferowania w zamian'
              : 'Brak technologii partnera do zaoferowania w zamian',
          };
        }
      } else if (state.goldOnce < 1) {
        return { valid: false, reason: 'Cena technologii: minimum 1 ¤' };
      }
      break;
    case '7':
      if (state.targetOwnerId < 0) {
        return { valid: false, reason: 'Wybierz cel wojny' };
      }
      break;
  }
  return { valid: true };
}

/**
 * P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE (2026-08-09): kiedy kontrofertę AI do traktatu
 * "tylko formularz" (isTreatyOnlyFormAction) silnik dołożył słodzikiem — złotem, patrz
 * withExtraSweetenerGold w diplomacy-proposals.ts — gracz musi te pozycje ZOBACZYĆ,
 * ZMIENIĆ (ilość) i USUNĄĆ. Reużywa DOKŁADNIE tych samych klas co zwykły koszyk wymiany
 * (.cdb-row-qty / .cdb-rm), więc generyczne event listenery w bindEvents() (querySelectorAll
 * po klasie, patrz showTradeBasketModal) obsługują te wiersze BEZ dodatkowego wiązania —
 * usunięcie/zmiana ilości mutuje te same tablice giveItems/receiveItems, które
 * buildTreatyPayload() wysyła dalej w payload.giveItems/receiveItems. Świadomie BEZ
 * przycisku „dodaj" — decyzja Macieja (ECHO A): symetria informacyjna, nie funkcjonalna,
 * gracz nie dostaje własnego narzędzia dokładania koszyka do traktatu.
 */
function treatySweetenerEditableRowsHtml(
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
): string {
  const fmtCtx: BasketItemFormatCtx = { perTurn: resourceTradeMode === 'per_turn', turns: dealTurns };
  const rowsHtml = (items: BasketItem[], side: 'give' | 'receive'): string =>
    items.map((item, idx) => {
      const qtyHtml = basketItemQtyEditable(item) ? basketRowQtyStepperHtml(item, side, idx, ctx) : '';
      return (
        '<div class="cdb-deal-row" data-side="' + side + '" data-idx="' + idx + '">'
        + '<div class="da-deal-item">' + renderBasketItemValueHtml(item, fmtCtx) + '</div>'
        + qtyHtml
        + '<button type="button" class="cdb-rm" data-side="' + side + '" data-idx="' + idx + '" title="Usuń pozycję">×</button>'
        + '</div>'
      );
    }).join('');
  let html = '';
  if (giveItems.length > 0) {
    html += '<div class="da-deal-col-head" style="margin-top:8px">My oddajemy</div>'
      + '<div class="da-deal-col-body" data-list="give">' + rowsHtml(giveItems, 'give') + '</div>';
  }
  if (receiveItems.length > 0) {
    html += '<div class="da-deal-col-head" style="margin-top:8px">Oni oddają</div>'
      + '<div class="da-deal-col-body" data-list="receive">' + rowsHtml(receiveItems, 'receive') + '</div>';
  }
  return html;
}

function treatySummaryHtml(
  action: AudienceAction,
  treatyState: TreatyFormState,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
  dealTurns: number,
  resourceTradeMode: 'once' | 'per_turn',
  /**
   * true w kontekście isTreatyOnlyFormAction (renderBasket) — tam koszyk NIE ma osobnych
   * kolumn "My oddajemy/Oni oddają" (patrz gałąź isTreatyOnly), więc jedyne miejsce na
   * podgląd pozycji to ten summary block; musi być edytowalny, nie tylko tekst.
   */
  editable = false,
): string {
  const payload = buildTreatyPayload(
    action.id, treatyState, ctx, giveItems, receiveItems, dealTurns, resourceTradeMode,
  );
  const cywId = proposalActionIdFromPayload(payload) as ProposalActionId;
  const rel = ctx.relacjaTotal ?? 100;
  const { actionId: _aid, ...proposalFields } = payload;
  const sides = computePlayerAcceptanceSides(cywId, proposalFields as ProposalPayload, rel, false);
  const treatyBasePw = sides.my.treatyBasePn ?? sides.their.treatyBasePn;
  const bil = bilateralTreatyDisplayPw(sides.my, sides.their);
  const myPw = sideDisplayOfferPw(sides.my, bil);
  const theirPw = sideDisplayOfferPw(sides.their, bil);
  const basketGivePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns) ?? 0;
  const basketReceivePn = sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns) ?? 0;

  let html = '';
  if (bil != null && bil > 0) {
    const playerPw = sides.my.treatyEffectivePn ?? bil;
    const partnerPw = sides.their.treatyEffectivePn ?? treatyBasePw ?? bil;
    const relRequired = sides.my.relRequired ?? sides.their.relRequired;
    const treatyMetaLabel = cywId === 'pokoj' ? 'Traktat pokoju' : 'Traktat';
    html += renderPnBalancePanelForTreaty(
      playerPw, basketGivePn, basketReceivePn, rel, action.label, relRequired, treatyMetaLabel, treatyBasePw, partnerPw,
    );
  } else if (myPw > 0 || theirPw > 0) {
    html += renderPnBalancePanelFromBasket(myPw, theirPw, rel, action.label);
  }

  if (giveItems.length === 0 && receiveItems.length === 0) {
    return html;
  }

  const givePn = basketGivePn;
  const receivePn = basketReceivePn;
  const net = Math.max(0, givePn - receivePn);
  html += '<div class="cdb-summary"><div class="cdb-basket-opt-title">Dołóż do umowy (koszyk PW)</div>';
  html += '<div>Oddajesz: <b>' + givePn + ' PW</b>';
  if (receiveItems.length > 0) html += ' · Dostajesz: <b>' + receivePn + ' PW</b>';
  html += '</div>';
  if (net > 0) {
    html += '<div>Słodzik netto: <b>' + net + ' PW</b> — zwiększa szansę akceptacji</div>';
  }
  if (editable) {
    html += treatySweetenerEditableRowsHtml(giveItems, receiveItems, ctx, resourceTradeMode, dealTurns);
  }
  html += '</div>';
  return html;
}

function buildTreatyPayload(
  actionId: string,
  state: TreatyFormState,
  ctx: NegotiationModalContext,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  dealTurns: number,
  resourceTradeMode: 'once' | 'per_turn',
): NegotiationPayload {
  const payload: NegotiationPayload = { actionId };
  switch (actionId) {
    case '2':
      payload.turns = state.turns;
      break;
    case '3':
      payload.allianceKind = state.allianceKind;
      break;
    case '4':
      payload.borderMilitary = state.borderMilitary;
      payload.barbarianCooperation = state.barbarianCooperation;
      payload.goldOnce = state.borderMilitary
        ? (ctx.borderFeeMilitary ?? 40)
        : (ctx.borderFeeCivil ?? 20);
      break;
    case '8':
      payload.tributeMode = state.tributeMode;
      payload.goldPerTurn = state.goldPerTurn;
      if (state.tributeTurns > 0) payload.turns = state.tributeTurns;
      break;
    case '12':
      payload.goldPerTurn = state.goldPerTurn;
      break;
    case '15':
      payload.goldOnce = state.goldOnce;
      break;
    case '5':
      payload.turns = state.turns;
      break;
    case '6':
      payload.techId = state.techId;
      payload.techDirection = state.techDirection;
      payload.techPaymentMode = state.techPaymentMode;
      if (state.techPaymentMode === 'tech') {
        payload.techOfferId = state.techOfferId;
        payload.goldOnce = 0;
      } else {
        payload.goldOnce = state.goldOnce;
      }
      break;
    case '7':
      payload.targetOwnerId = state.targetOwnerId;
      payload.bribeGold = state.bribeGold;
      break;
    case '9':
      payload.goldOnce = state.goldOnce;
      payload.warThreat = true;
      break;
  }
  if (giveItems.length > 0) {
    payload.giveItems = giveItems;
    payload.givePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns) ?? undefined;
  }
  if (receiveItems.length > 0) {
    payload.receiveItems = receiveItems;
    payload.receivePn = sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns) ?? undefined;
  }
  const hasResourceAccess = basketHasResourceAccess(giveItems, receiveItems);
  const hasQtyRes = !hasResourceAccess && basketHasQuantityResource(giveItems, receiveItems);
  if (hasResourceAccess) {
    payload.turns = dealTurns;
  } else if (resourceTradeMode === 'per_turn' && hasQtyRes) {
    payload.resourceTradeMode = 'per_turn';
    payload.turns = dealTurns;
  }
  return payload;
}

function validateBasketForm(
  mode: TradeBasketMode,
  actionId: string,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
  dealTurns: number,
  resourceTradeMode: 'once' | 'per_turn',
  blocked: boolean,
  treatyState?: TreatyFormState,
): BasketValidation {
  if (blocked) {
    return { valid: false, reason: 'Nie spełniasz progu Relacji dla tej akcji' };
  }
  const propActionId = proposalActionIdFromUi(actionId, mode, treatyState?.tributeMode);
  const currencyPayload = {
    goldOnce: treatyState?.tributeMode === 'offer' ? treatyState.goldPerTurn : undefined,
    goldPerTurn: treatyState?.goldPerTurn,
    giveItems,
    receiveItems,
  };
  if (isCurrencyProposalForbiddenDuringWar(propActionId, currencyPayload, ctx.atWar ?? false)) {
    return { valid: false, reason: 'W wojnie pieniądze tylko w ugodzie pokojowej' };
  }
  if (mode === 'treaty') {
    const treatyVal = validateTreatyForm(actionId, treatyState ?? defaultTreatyState(actionId, undefined, ctx), ctx);
    if (!treatyVal.valid) return treatyVal;
    if (giveItems.length === 0 && receiveItems.length === 0) return { valid: true };
    if (giveItems.length > 0 && receiveItems.length > 0) {
      const givePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns);
      const receivePn = sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns);
      if (givePn == null || receivePn == null) {
        return { valid: false, reason: 'Nie można wycenić pozycji koszyka — sprawdź typy i ilości' };
      }
    } else {
      const items = giveItems.length > 0 ? giveItems : receiveItems;
      if (sumBasketPn(items, ctx, 'give', resourceTradeMode, dealTurns) == null) {
        return { valid: false, reason: 'Nie można wycenić pozycji koszyka — sprawdź typy i ilości' };
      }
    }
    const hasResourceAccess = basketHasResourceAccess(giveItems, receiveItems);
    const hasQtyRes = !hasResourceAccess && basketHasQuantityResource(giveItems, receiveItems);
    const needsTurns = hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn');
    if (needsTurns && (dealTurns < 1 || dealTurns > 20)) {
      return { valid: false, reason: 'Wybierz czas umowy od 1 do 20 tur' };
    }
    return { valid: true };
  }
  if (mode === 'gift') {
    const sides = validateTradeBasketSides(mode, giveItems, receiveItems);
    if (!sides.valid) return sides;
  } else if (mode === 'trade') {
    const sides = validateTradeBasketSides(mode, giveItems, receiveItems);
    if (!sides.valid) return sides;
  }
  const givePn = giveItems.length > 0
    ? sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns)
    : 0;
  const receivePn = mode === 'trade' && receiveItems.length > 0
    ? sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns)
    : 0;
  if (giveItems.length > 0 && givePn == null) {
    return { valid: false, reason: 'Nie można wycenić pozycji — sprawdź typy i ilości' };
  }
  if (mode === 'trade' && receiveItems.length > 0 && receivePn == null) {
    return { valid: false, reason: 'Nie można wycenić pozycji — sprawdź typy i ilości' };
  }
  const hasResourceAccess = basketHasResourceAccess(giveItems, receiveItems);
  const hasQtyRes = mode === 'trade' && !hasResourceAccess && basketHasQuantityResource(giveItems, receiveItems);
  const needsTurns = mode === 'trade' && (hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn'));
  if (needsTurns && (dealTurns < 1 || dealTurns > 20)) {
    return { valid: false, reason: 'Wybierz czas umowy od 1 do 20 tur' };
  }
  return { valid: true };
}

function dealDurationHtml(turns: number, visible: boolean, label = 'Czas umowy (tur, max 20)', sub = 'Dostęp do surowców trwa przez wybrany czas. Po wygaśnięciu umowa wymaga odnowienia (re-negocjacji).'): string {
  if (!visible) return '';
  const turnChips = [5, 10, 15].map(t =>
    '<button type="button" class="cdb-chip cdb-chip-turn' + (turns === t ? ' selected' : '')
    + '" data-turns="' + t + '">' + t + '</button>',
  ).join('');
  return (
    '<div class="cdb-duration">'
      + '<label for="cdb-deal-turns">' + esc(label) + '</label>'
      + '<div class="cdb-chip-row cdb-turn-presets">' + turnChips + '</div>'
      + qtyStepperHtml('cdb-deal-turns', 'deal', turns, 1, 20)
      + '<p class="cdb-sub">' + esc(sub) + '</p>'
    + '</div>'
  );
}

/**
 * HANDEL-SUROWCE-CYKL (2026-07-24): tryb wymiany surowca ilościowego — Jednorazowo
 * (transfer natychmiast, istniejące zachowanie) vs Co turę przez X tur (deal cykliczny).
 * Widoczny tylko gdy koszyk ma pozycję `surowiec_ilosc` i NIE ma trwałego dostępu
 * (zloze/surowiec_boolean — ten ma własną semantykę czasu trwania, patrz dealDurationHtml).
 */
function resourceTradeModeHtml(mode: 'once' | 'per_turn', visible: boolean): string {
  if (!visible) return '';
  const onceIc = cdbIconWrap(brandIconSvg('chip-crate', 22));
  const perTurnIc = cdbIconWrap(brandIconSvg('ui-end-turn', 22));
  return (
    '<div class="cdb-duration">'
      + '<label>Tryb wymiany</label>'
      + '<div class="cdb-chip-row">'
      + buildChipBtn('cdb-chip-mode', 'once', 'deal', mode === 'once', onceIc, 'Jednorazowo')
      + buildChipBtn('cdb-chip-mode', 'per_turn', 'deal', mode === 'per_turn', perTurnIc, 'Co turę')
      + '</div>'
      + '<input type="hidden" class="cdb-res-mode" value="' + mode + '" />'
    + '</div>'
  );
}

/** Pełny blok ustawień czasu umowy — widoczny w handlu zanim dodasz pozycje. */
function dealSettingsBlockHtml(
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
  showMode: boolean,
  showDuration: boolean,
  dealDurationLabel: string,
  dealDurationSub: string,
  hintWhenIdle?: string,
): string {
  let html = '<div class="cdb-deal-settings">';
  html += '<div class="cdb-deal-settings-title">Czas umowy</div>';
  if (hintWhenIdle) {
    html += '<p class="cdb-sub">' + esc(hintWhenIdle) + '</p>';
  }
  html += resourceTradeModeHtml(resourceTradeMode, showMode);
  html += dealDurationHtml(dealTurns, showDuration, dealDurationLabel, dealDurationSub);
  html += '</div>';
  return html;
}

function uiActionAllowsWarCurrency(
  actionId: string,
  mode: TradeBasketMode,
  tributeMode?: 'demand' | 'offer',
): boolean {
  if (actionId === '10') return true;
  if (actionId === '9') return true;
  if (actionId === '8' && tributeMode === 'offer') return true;
  if (mode === 'treaty' && actionId === '8' && tributeMode === 'offer') return true;
  return false;
}

function proposalActionIdFromUi(
  actionId: string,
  mode: TradeBasketMode,
  tributeMode?: 'demand' | 'offer',
): string {
  if (actionId === '10') return 'pokoj';
  if (actionId === '9') return 'ultimatum';
  if (actionId === '8' && tributeMode === 'offer') return 'trybut_oferta';
  if (actionId === '8') return 'trybut_zadanie';
  if (actionId === '13' || mode === 'gift') return 'handel';
  if (actionId === '5') return 'umowa_szlakow';
  if (actionId === '6') return 'tech';
  if (actionId === '7') return 'namow_wojne';
  if (actionId === '2') return 'nap';
  if (actionId === '3') return 'sojusz_pelny';
  if (actionId === '12') return 'wasal';
  if (actionId === '15') return 'wchloniecie';
  if (actionId === '4') return 'granice';
  if (actionId === '14') return 'handel';
  return 'handel';
}

/** R-PROPOZYCJA-BRAK-EDYCJI: pozycja z koszyka aktualnie edytowana przez `buildAddForm`. */
interface BasketEditItem {
  item: BasketItem;
  idx: number;
}

/** Wskaźnik „która pozycja koszyka jest teraz edytowana" — trzymany w closure `showTradeBasketModal`. */
interface EditingItemRef {
  side: 'give' | 'receive';
  idx: number;
}

/** Typy koszyka posiadające sensowny formularz edycji (reużywa buildAddForm zamiast usuń+dodaj). */
const ITEM_EDIT_TYPES = new Set<WartoscPozycjaTyp>(['zloto', 'praca', 'zywnosc', 'tech', 'surowiec_ilosc']);

/**
 * Lista typów pozycji dostępnych w formularzu „Dodaj" dla danej strony/trybu/akcji —
 * wydzielona z `buildAddForm`, żeby wiersze koszyka (przycisk „✎ Edytuj") mogły sprawdzić,
 * czy typ ISTNIEJĄCEJ pozycji wciąż jest wybieralny (np. złoto/praca w wojnie, tech poniżej
 * progu Relacji) — inaczej „Zapisz zmiany" po cichu podmienia typ na pierwszy dostępny.
 */
export function computeAvailableTypes(
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
  mode: TradeBasketMode,
  actionId: string,
  tributeMode?: 'demand' | 'offer',
): WartoscPozycjaTyp[] {
  const allowWarCurrency = !ctx.atWar
    || uiActionAllowsWarCurrency(actionId, mode, tributeMode);
  return (Object.keys(TYP_LABELS) as WartoscPozycjaTyp[])
    .filter(t => {
      if (WITHDRAWN_BASKET_ACCESS_TYPES.has(t)) return false;
      if (t === 'jednostka') return false;
      if (!allowWarCurrency && (t === 'zloto' || t === 'praca')) return false;
      if (mode === 'gift') return true;
      if (t === 'tech' && side === 'receive') {
        const rel = ctx.relacjaTotal ?? 0;
        return rel >= (ctx.progHandelRelacja ?? PROG_HANDEL_REL);
      }
      return true;
    });
}

/**
 * Czy pozycja koszyka ma dziś dostępny formularz edycji (typ + wciąż wybieralny w tym kontekście).
 * Eksport do testów (R-PROPOZYCJA-BRAK-EDYCJI pkt 4 — gating przycisku „✎ Edytuj").
 */
export function basketItemEditAvailable(
  item: BasketItem,
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
  mode: TradeBasketMode,
  actionId: string,
  tributeMode?: 'demand' | 'offer',
): boolean {
  if (!ITEM_EDIT_TYPES.has(item.typ)) return false;
  return computeAvailableTypes(side, ctx, mode, actionId, tributeMode).includes(item.typ);
}

/**
 * Eksport do testów (P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU) — pozwala zweryfikować
 * placeholder pustej listy (miasto/technologia) bez renderowania całego modala.
 */
export function buildAddForm(
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
  mode: TradeBasketMode,
  actionId = '14',
  tributeMode?: 'demand' | 'offer',
  editItem?: BasketEditItem,
  existingItems: BasketItem[] = [],
): string {
  if (mode === 'gift' && side === 'receive') return '';

  const prefix = side === 'give' ? 'give' : 'recv';
  const availableTypes = computeAvailableTypes(side, ctx, mode, actionId, tributeMode);
  const editTyp = editItem && availableTypes.includes(editItem.item.typ) ? editItem.item.typ : undefined;
  const defaultTyp = editTyp ?? availableTypes[0] ?? 'zloto';

  const typChips = availableTypes.map(t =>
    buildChipBtn(
      'cdb-chip-typ',
      t,
      prefix,
      t === defaultTyp,
      typChipIconHtml(t),
      TYP_CHIP_LABELS[t] ?? TYP_LABELS[t],
      ' title="' + esc(TYP_LABELS[t]) + '"',
    ),
  ).join('');

  // R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08): strona „daję" i „dostaję" filtrują
  // niezależnie (patrz NegotiationModalContext) — technologia znana przez obie strony nie
  // ma prawa pojawić się w żadnej z list. `techOptions` to legacy pojedynczy kierunek
  // (akcja '6'), NIE fallback dla strony receive — inaczej obie strony znów pokazałyby tę
  // samą listę (pierwotny bug ze zgłoszenia).
  const techsAll = side === 'give'
    ? (ctx.giveTechOptions ?? ctx.techOptions ?? defaultTechOptions().map(t => ({ ...t, suggestedPrice: 0 })))
    : (ctx.receiveTechOptions ?? defaultTechOptions().map(t => ({ ...t, suggestedPrice: 0 })));
  const editTechId = editTyp === 'tech' ? editItem!.item.id : undefined;
  // P-HANDEL-TECH-CHIP-BEZ-FILTRU-JUZ-DODANE (2026-08-13): technologia już dodana do koszyka
  // (po tej samej stronie) ma zniknąć z listy do wyboru — poza edytowaną pozycją, która musi
  // zostać widoczna i zaznaczona, żeby edycja własnego wpisu jej nie chowała.
  // EN: a tech already added to the basket (this side) must drop out of the picker — except
  // the item currently being edited, which must stay visible and selected.
  const techIdsInBasket = new Set(
    existingItems.filter(it => it.typ === 'tech' && it.id !== editTechId).map(it => it.id),
  );
  const techs = techsAll.filter(t => !techIdsInBasket.has(t.id));
  const defaultTech = (editTechId != null && techs.some(t => t.id === editTechId))
    ? editTechId
    : (techs[0]?.id ?? '');
  // P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU (2026-08-09): po filtrze
  // R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE lista bywa realnie pusta — placeholder
  // analogiczny do „— brak miast (SILNIK) —" wyżej, żeby pusta siatka nie wyglądała
  // jak błąd renderu. `defaultTech` zostaje wtedy '' → readItemFromForm (case 'tech')
  // zwraca null, więc „Dodaj"/„Zapisz zmiany" bezpiecznie no-opuje (ten sam wzorzec co
  // dla miasta: id puste = brak pozycji, nie pusty/nieprawidłowy koszyk).
  const techChips = techs.length > 0
    ? techs.map(t =>
      buildChipBtn(
        'cdb-chip-tech',
        t.id,
        prefix,
        t.id === defaultTech,
        typChipIconHtml('tech'),
        t.label,
      ),
    ).join('')
    : '<span class="cdb-sub">— brak technologii (SILNIK) —</span>';

  const qtyResources = side === 'give'
    ? (ctx.giveQuantityResourceOptions ?? defaultQuantityResourceOptions())
    : (ctx.receiveQuantityResourceOptions ?? defaultQuantityResourceOptions());
  const editResId = editTyp === 'surowiec_ilosc' ? editItem!.item.id : undefined;
  const defaultResId = (editResId != null && qtyResources.some(r => r.id === editResId))
    ? editResId
    : (qtyResources[0]?.id ?? '');
  const qtyResChips = qtyResources.map(r => {
    const label = resourceDisplayLabel(r.id);
    const short = label.length > 10 ? label.slice(0, 9) + '…' : label;
    // R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP: widoczna odznaka zapasu WYŁĄCZNIE po stronie
    // „daję" (side==='give') — zgłoszenie mówiło o surowcach „które MAMY", nie o stronie
    // „dostaję". Zapas AI jest już dziś ujawniony bezwarunkowo w title/data-max (linia niżej,
    // od dawna) niezależnie od tej odznaki — to nie jest powód wyłączenia, tylko zawężenie
    // zakresu tego zgłoszenia.
    const stockBadge = side === 'give'
      ? '<span class="cdb-chip-stock">' + esc(formatCompactQty(r.maxQty)) + '</span>'
      : '';
    return buildChipBtn(
      'cdb-chip-resqty',
      r.id,
      prefix,
      r.id === defaultResId,
      typChipIconHtml('surowiec_ilosc', r.id),
      short,
      ' data-max="' + r.maxQty + '" title="' + esc(label) + ' (dost. ' + r.maxQty + ' szt.)"',
      stockBadge,
    );
  }).join('');
  const qtyResFirstMax = qtyResources.find(r => r.id === defaultResId)?.maxQty ?? qtyResources[0]?.maxQty ?? 1;
  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): krok/domyślna ilość zależą od surowca aktualnie
  // wybranego chipem (defaultResId) — 5 szt. dla surowców dotkniętych ×5, 1 dla Złota/Węgla.
  const defaultResKrok = diplomacyHandelSurowiecKrok(defaultResId || 'x');

  const zywnHint = diplomacyZywnoscNaPn();

  const initialQty = (editTyp === 'zloto' || editTyp === 'praca') ? Math.max(1, editItem!.item.ilosc ?? 10) : 10;
  const initialFoodQty = editTyp === 'zywnosc' ? Math.max(1, editItem!.item.ilosc ?? 10) : 10;
  const initialResQty = editTyp === 'surowiec_ilosc'
    ? (diplomacyNormalizeSurowiecIlosc(defaultResId, editItem!.item.ilosc ?? defaultResKrok, qtyResFirstMax) || defaultResKrok)
    : defaultResKrok;

  const editAttrs = editItem ? ' data-edit-idx="' + editItem.idx + '"' : '';
  const submitLabel = editItem ? 'Zapisz zmiany' : '+ Dodaj propozycję';
  const cancelBtn = editItem
    ? '<button type="button" class="dip-muted-btn cdb-edit-cancel" data-side="' + prefix + '">Anuluj edycję</button>'
    : '';

  return (
    '<div class="cdb-add' + (editItem ? ' cdb-add-editing' : '') + '" data-side="' + prefix + '">'
    + '<input type="hidden" class="cdb-typ cdb-typ-hidden" data-side="' + prefix + '" value="' + defaultTyp + '" />'
    + '<div class="cdb-add-section">'
    + '<div class="cdb-add-section-title">' + (editItem ? 'Edytujesz pozycję' : 'Co dodajesz') + '</div>'
    + '<div class="cdb-chip-grid cdb-typ-chips">' + typChips + '</div>'
    + '</div>'
    + '<div class="cdb-fields-extra visible" data-extra="' + prefix + '-qty">'
    + '<label>Ilość</label>'
    + qtyStepperHtml('cdb-qty', prefix, initialQty)
    + '</div>'
    // P-DYPLO-HANDEL-ZYWNOSC-WYBOR-MIASTA-ZBEDNY (Maciej 2026-08-14): usunięty selektor
    // "Miasto (spichlerz)" — handel żywnością operuje na cywilizacyjnym Spichlerzu
    // Centralnym (`empireFoodStates`, main.ts case 'zywnosc' przy wykonaniu traktatu),
    // nie na konkretnym mieście; potwierdzone grepem silnika — `item.cityId`/`item.id`
    // NIGDY nie były tam czytane, wybór miasta był interfejsem-widmem (UI-only, tylko do
    // deduplikacji koszyka — patrz basketItemIdentity niżej, dziś uproszczona).
    // `data-extra="prefix-city"` (nazwa atrybutu zostaje, patrz updateTypFields) dalej
    // pokazuje/chowa tę sekcję przy wyborze typu "zywnosc", zostaje tylko pole ilości.
    + '<div class="cdb-fields-extra" data-extra="' + prefix + '-city">'
    + '<label>Ilość żywności <span style="color:#7a8494">(1 PW = ' + zywnHint + ')</span></label>'
    + qtyStepperHtml('cdb-food-qty', prefix, initialFoodQty)
    + '</div>'
    + '<div class="cdb-fields-extra" data-extra="' + prefix + '-tech">'
    + '<label>Technologia</label>'
    + '<div class="cdb-chip-grid cdb-tech-chips">' + techChips + '</div>'
    + '<input type="hidden" class="cdb-tech" data-side="' + prefix + '" value="' + esc(defaultTech) + '" />'
    + '</div>'
    + '<div class="cdb-fields-extra" data-extra="' + prefix + '-resqty">'
    + '<label>Surowiec</label>'
    + '<div class="cdb-chip-grid cdb-resqty-chips">' + qtyResChips + '</div>'
    + '<input type="hidden" class="cdb-res-qty-sel" data-side="' + prefix + '" value="' + esc(defaultResId) + '" data-max="' + qtyResFirstMax + '" />'
    + '<label>Ilość (sztuki) <span class="cdb-res-qty-krok-hint" data-side="' + prefix + '" style="color:#7a8494">'
    + (defaultResKrok > 1 ? '(krok ' + defaultResKrok + ' szt.)' : '') + '</span></label>'
    + qtyStepperHtml('cdb-res-qty-num', prefix, initialResQty, defaultResKrok, qtyResFirstMax, defaultResKrok)
    + '</div>'
    + '<div class="cdb-add-btn-row">'
    + '<button type="button" class="dip-gold-btn cdb-add-btn" data-side="' + prefix + '"' + editAttrs + '>' + esc(submitLabel) + '</button>'
    + cancelBtn
    + '</div>'
    + '</div>'
  );
}

function basketItemQtyEditable(item: BasketItem): boolean {
  return item.typ === 'zloto' || item.typ === 'praca' || item.typ === 'zywnosc' || item.typ === 'surowiec_ilosc';
}

function basketItemMaxQty(
  item: BasketItem,
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
): number | undefined {
  const qty = item.ilosc ?? 1;
  if (item.typ === 'zloto' && side === 'give') {
    const sk = Math.floor(ctx.playerSkarbiec ?? 0);
    return sk > 0 ? sk : undefined;
  }
  if (item.typ === 'surowiec_ilosc') {
    const opts = side === 'give'
      ? (ctx.giveQuantityResourceOptions ?? defaultQuantityResourceOptions())
      : (ctx.receiveQuantityResourceOptions ?? defaultQuantityResourceOptions());
    const found = opts.find(o => o.id === item.id);
    return found?.maxQty ?? qty;
  }
  return undefined;
}

/**
 * Przycina `rawQty` do zapasu (`basketItemMaxQty`) — dla `surowiec_ilosc` DODATKOWO floruje
 * do wielokrotności kroku handlu (R-DYPLO-CENNIK-SKALA-5X-Q1, 2026-08-13). Wspólny punkt
 * dla `addOrMergeBasketItem`/`applyBasketItemEdit`/`applyRowQtyChange` — bez tego przycięcie
 * do `max` (zapas rzadko jest wielokrotnością 5) mogłoby zostawić ilość niebędącą
 * wielokrotnością kroku w koszyku.
 */
function clampQtyForItem(
  item: BasketItem,
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
  rawQty: number,
): number {
  const max = basketItemMaxQty(item, side, ctx);
  if (item.typ === 'surowiec_ilosc') {
    return diplomacyNormalizeSurowiecIlosc(item.id, rawQty, max);
  }
  return max != null ? Math.min(max, rawQty) : rawQty;
}

/**
 * Tożsamość pozycji koszyka — dwie pozycje o tej samej tożsamości są "tą samą propozycją"
 * (P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-W-OFERCIE). `zywnosc` od P-DYPLO-HANDEL-ZYWNOSC-WYBOR-
 * MIASTA-ZBEDNY (Maciej 2026-08-14) ma stały `id: 'zywnosc'` (jak zloto/praca) — jeden
 * cywilizacyjny zasób, więc żaden specjalny przypadek tu już nie jest potrzebny (dawniej
 * `id` = cityId, dopisywano go osobno do klucza).
 * / EN: identity key for a basket item; two items sharing it are "the same proposal".
 */
function basketItemIdentity(item: BasketItem): string {
  return item.typ + '::' + item.id;
}

/**
 * R-DYPLO-DUPLIKAT-KOSZYK (P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-W-OFERCIE, 2026-08-12): dodanie
 * pozycji o TEJ SAMEJ tożsamości (typ+id), która już jest w koszyku po tej samej stronie:
 *  - typy z sensowną, sumowalną ilością (zloto/praca/zywnosc/surowiec_ilosc — te same typy co
 *    `basketItemQtyEditable`, bo to one dostają suwak ilości w wierszu koszyka) -> ZSUMUJ
 *    ilość z istniejącą pozycją, przycięte do tego samego limitu co ręczna zmiana ilości
 *    (`basketItemMaxQty`) zamiast dokładać drugi osobny wiersz;
 *  - typy bez pola ilości (tech/jednostka/zloze/surowiec_boolean — jedna technologia/jednostka/
 *    dostęp to jedna, niepodzielna oferta) -> BLOKADA, koszyk zostaje BEZ ZMIAN. Druga kopia tej
 *    samej technologii (np. 4× "Obróbka drewna" ze zrzutu właściciela) nie ma sensu nawet po
 *    zsumowaniu ilości, bo ilości tu w ogóle nie ma.
 * Eksport do testu regresyjnego (tools/diplomacy-basket-duplicate-test.cjs).
 * / EN: adding an item with the same identity as one already in the basket either sums the
 * quantity (for quantity-bearing types) or is blocked outright (for one-of-a-kind types like a
 * single technology/unit/access grant, where a second copy is meaningless even summed).
 */
export function addOrMergeBasketItem(
  items: BasketItem[],
  newItem: BasketItem,
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
): BasketItem[] {
  const identity = basketItemIdentity(newItem);
  const idx = items.findIndex(it => basketItemIdentity(it) === identity);
  if (idx < 0) return [...items, newItem];
  if (!basketItemQtyEditable(newItem)) return items; // blokada duplikatu — bez zmian
  const existing = items[idx]!;
  const summedQty = (existing.ilosc ?? 0) + (newItem.ilosc ?? 0);
  const clamped = clampQtyForItem(existing, side, ctx, summedQty);
  if (clamped <= 0) return items; // po przycięciu/floorowaniu za mało nawet na 1 blok — bez zmian
  return items.map((it, i) => (i === idx ? { ...existing, ilosc: clamped } : it));
}

/**
 * R-DYPLO-DUPLIKAT-KOSZYK-EDYCJA (P-DYPLOMACJA-DUPLIKAT-PROPOZYCJI-EDYCJA, 2026-08-12):
 * handler „Zapisz zmiany" po edycji ISTNIEJĄCEGO wiersza koszyka. Zwykłe podmienienie na
 * miejscu (stary kod) nie sprawdzało, czy nowa wersja wiersza koliduje (ta sama tożsamość
 * `basketItemIdentity`) z INNYM, już istniejącym wierszem — dawało to dwa identyczne wiersze
 * (zgłoszenie właściciela: edycja "Garncarstwo" -> "Obróbka drewna", gdy "Obróbka drewna" już
 * jest w koszyku). Kolizja z SAMYM SOBĄ (i === editIdx) to nie duplikat, tylko brak zmiany
 * typu/id — trzeba ją wykluczyć z porównania.
 *  - Brak kolizji z innym wierszem -> zwykła podmiana na miejscu (dotychczasowe zachowanie).
 *  - Kolizja z innym wierszem, typ z sumowalną ilością (patrz `basketItemQtyEditable`) -> SCAL:
 *    tak samo jak przy dodawaniu (`addOrMergeBasketItem`) sumuj ilość do wiersza, z którym jest
 *    kolizja, przytnij do tego samego limitu (`basketItemMaxQty`) i USUŃ edytowany wiersz jako
 *    osobną pozycję — wynik: jeden wiersz z sumą, identycznie jak przy dwukrotnym dodaniu.
 *  - Kolizja z innym wierszem, typ BEZ ilości (tech/jednostka/zloze/surowiec_boolean — jedna
 *    niepodzielna oferta) -> BLOKADA: edycja się nie stosuje, lista wraca do stanu SPRZED
 *    edycji (nic nie usunięte, nic nie zduplikowane). Wybrane (zamiast „usuń edytowany
 *    wiersz, zostaw istniejący") żeby zachowanie było SPÓJNE z blokadą w
 *    `addOrMergeBasketItem` — tam duplikat też jest odrzucany bez usuwania czegokolwiek z
 *    listy, więc "cofnięcie do no-op" jest tym samym mechanizmem zastosowanym do edycji
 *    zamiast do dodawania.
 * Eksport do testu regresyjnego (tools/diplomacy-basket-duplicate-ui-test.cjs).
 * / EN: "Save changes" handler for editing an EXISTING basket row. A plain in-place replace
 * (old code) never checked whether the edited row's new identity collides with a DIFFERENT
 * existing row — producing two identical rows (owner's report: editing "Garncarstwo" into
 * "Obróbka drewna" while that tech is already in the basket). Colliding with itself
 * (i === editIdx) is not a duplicate, just an unchanged type/id, and must be excluded from the
 * comparison. No collision: normal in-place replace. Collision + quantity-bearing type: merge
 * into the colliding row (sum, clamp — same as addOrMergeBasketItem) and drop the edited row.
 * Collision + one-of-a-kind type: block — list reverts to its pre-edit state, mirroring
 * addOrMergeBasketItem's block semantics (nothing removed, nothing duplicated).
 */
export function applyBasketItemEdit(
  items: BasketItem[],
  editIdx: number,
  newItem: BasketItem,
  side: 'give' | 'receive',
  ctx: NegotiationModalContext,
): BasketItem[] {
  const identity = basketItemIdentity(newItem);
  const collideIdx = items.findIndex((it, i) => i !== editIdx && basketItemIdentity(it) === identity);
  if (collideIdx < 0) return items.map((it, i) => (i === editIdx ? newItem : it));
  if (!basketItemQtyEditable(newItem)) return items; // blokada duplikatu — edycja się nie stosuje
  const existing = items[collideIdx]!;
  const summedQty = (existing.ilosc ?? 0) + (newItem.ilosc ?? 0);
  const clamped = clampQtyForItem(existing, side, ctx, summedQty);
  if (clamped <= 0) return items; // po przycięciu/floorowaniu za mało nawet na 1 blok — edycja no-op
  return items
    .map((it, i) => (i === collideIdx ? { ...existing, ilosc: clamped } : it))
    .filter((_, i) => i !== editIdx);
}

function basketRowQtyStepperHtml(
  item: BasketItem,
  side: 'give' | 'receive',
  idx: number,
  ctx: NegotiationModalContext,
): string {
  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): krok wiersza już-w-koszyku = krok surowca
  // (5 szt. dla dotkniętych ×5), 1 dla wszystkich innych typów (zloto/praca/zywnosc, jak
  // dotychczas).
  const krok = item.typ === 'surowiec_ilosc' ? diplomacyHandelSurowiecKrok(item.id) : 1;
  const qty = Math.max(krok, item.ilosc ?? krok);
  const max = basketItemMaxQty(item, side, ctx);
  const maxAttr = max != null ? ' max="' + max + '"' : '';
  const stepAttr = krok > 1 ? ' step="' + krok + '"' : '';
  return (
    '<div class="cdb-row-qty" data-side="' + side + '" data-idx="' + idx + '">'
    + '<button type="button" class="cdb-row-qty-step dip-muted-btn" data-delta="-' + krok + '" title="Zmniejsz">−</button>'
    + '<input type="number" class="cdb-row-qty-inp" value="' + qty + '" min="' + krok + '"' + maxAttr + stepAttr + ' />'
    + '<button type="button" class="cdb-row-qty-step dip-muted-btn" data-delta="' + krok + '" title="Zwiększ">+</button>'
    + '</div>'
  );
}

function editableDealItemsHtml(
  items: BasketItem[],
  side: 'give' | 'receive',
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
  ctx: NegotiationModalContext,
  mode: TradeBasketMode,
  actionId: string,
  tributeMode: 'demand' | 'offer' | undefined,
  editingIdx: number | null,
): string {
  if (items.length === 0) return '<span class="da-deal-empty">—</span>';
  const fmtCtx: BasketItemFormatCtx = {
    perTurn: resourceTradeMode === 'per_turn',
    turns: dealTurns,
  };
  return items.map((item, idx) => {
    const qtyHtml = basketItemQtyEditable(item)
      ? basketRowQtyStepperHtml(item, side, idx, ctx)
      : '';
    const canEdit = basketItemEditAvailable(item, side, ctx, mode, actionId, tributeMode);
    const editBtn = canEdit
      ? '<button type="button" class="dip-muted-btn cdb-edit-item" data-side="' + side + '" data-idx="' + idx + '" title="Edytuj pozycję">✎ Edytuj</button>'
      : '';
    const rowCls = 'cdb-deal-row' + (editingIdx === idx ? ' cdb-deal-row-editing' : '');
    return (
      '<div class="' + rowCls + '" data-side="' + side + '" data-idx="' + idx + '">' +
        '<div class="da-deal-item">' + renderBasketItemValueHtml(item, fmtCtx) + '</div>' +
        qtyHtml +
        editBtn +
        '<button type="button" class="cdb-rm" data-side="' + side + '" data-idx="' + idx + '" title="Usuń">×</button>' +
      '</div>'
    );
  }).join('');
}

function dealSideColumnHtml(
  head: string,
  colClass: string,
  items: BasketItem[],
  side: 'give' | 'receive',
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
  ctx: NegotiationModalContext,
  mode: TradeBasketMode,
  actionId: string,
  tributeMode: 'demand' | 'offer' | undefined,
  editingIdx: number | null,
): string {
  return (
    '<div class="da-deal-col ' + colClass + '">' +
      '<div class="da-deal-col-head">' + esc(head) + '</div>' +
      '<div class="da-deal-col-body" data-list="' + side + '">' +
        editableDealItemsHtml(items, side, resourceTradeMode, dealTurns, ctx, mode, actionId, tributeMode, editingIdx) +
      '</div>' +
    '</div>'
  );
}

function tradeDealPreviewHtml(
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
  ctx: NegotiationModalContext,
  mode: TradeBasketMode,
  actionId: string,
  tributeMode: 'demand' | 'offer' | undefined,
  editingItem: EditingItemRef | null,
): string {
  let html = '<div class="cdb-deal-preview"><div class="da-deal-table">';
  html += dealSideColumnHtml(
    'Oferujemy', 'da-deal-col-we', giveItems, 'give', resourceTradeMode, dealTurns, ctx,
    mode, actionId, tributeMode, editingItem?.side === 'give' ? editingItem.idx : null,
  );
  html += dealSideColumnHtml(
    'Oferują', 'da-deal-col-they', receiveItems, 'receive', resourceTradeMode, dealTurns, ctx,
    mode, actionId, tributeMode, editingItem?.side === 'receive' ? editingItem.idx : null,
  );
  html += '</div>';
  if (resourceTradeMode === 'per_turn' && dealTurns > 0) {
    html += '<div class="da-deal-sched-foot">Wymiana co turę przez ' + dealTurns + ' tur</div>';
  }
  html += '</div>';
  return html;
}

function summaryHtml(
  mode: TradeBasketMode,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
): string {
  const rel = ctx.relacjaTotal ?? 100;
  const trustGained = ctx.trustPnGainedThisTurn ?? 0;
  const pnParams = diplomacyPnRelacjaParams();
  const maxTrust = pnParams.max_zaufanie_na_ture;

  const givePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns);
  const receivePn = mode === 'trade'
    ? sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns)
    : 0;

  let html = '<div class="cdb-summary">';
  if (mode === 'trade') {
    html += renderPnBalancePanelFromBasket(
      givePn,
      receivePn,
      rel,
      'Wymiana',
      ctx.tradeFairnessPreview?.(givePn ?? 0, receivePn ?? 0),
    );
  }

  if (mode === 'trade') {
    html += '<div>SUMA oddaję: <b>' + (givePn ?? '—') + ' PW</b> · SUMA dostaję: <b>' + (receivePn ?? '—') + ' PW</b></div>';
    if (givePn != null && receivePn != null) {
      const fairMin = diplomacyFairGivePn(receivePn, rel);
      html += '<div>Fair min (Rel ' + rel + '): <b>' + fairMin + ' PW</b></div>';
      const preview = diplomacyTradeTrustFromDeal(givePn, receivePn, rel, trustGained);
      html += '<div>Nadmiar: <b>' + preview.surplusPn + ' PW</b>';
      if (preview.deltaZaufanie > 0) {
        html += ' → <b>+' + preview.deltaZaufanie + ' Zauf.</b>';
        if (preview.deltaZaufanieRaw > preview.deltaZaufanie) {
          html += ' <span style="color:#9aa6b6">(limit ' + maxTrust + '/turę, już +' + trustGained + ')</span>';
        }
      }
      html += '</div>';
      const dobraWola = diplomacyDobraWolaFromSurplus(preview.surplusPn);
      if (dobraWola.active) {
        html += '<div>Dobra wola: <b>+' + dobraWola.zaufaniePerTura + ' Zauf./turę × ' + dobraWola.tur + '</div>';
      }
      if (givePn < fairMin) {
        html += '<div class="cdb-warn">' + brandIconSvg('chip-warning', 14) + ' Oddajesz mniej niż fair min — partner może odrzucić (W4-A).</div>';
      }

      // FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 7): bilans — pozycje JEDNORAZOWE
      // (nadmiar PN → Zaufanie od razu) vs CO TURĘ (dobra wola + — jeśli oferta ma dostęp
      // do surowców/złóż — Zaufanie z aktywnej Umowy handlowej przez czas jej trwania).
      // Same liczby co wyżej, tylko pogrupowane + jeden werdykt z uzasadnieniem.
      const fmtCtx: BasketItemFormatCtx = {
        perTurn: resourceTradeMode === 'per_turn',
        turns: dealTurns,
      };
      const oneShot: string[] = [];
      const perTurn: string[] = [];
      if (resourceTradeMode === 'per_turn') {
        if (giveItems.length > 0) perTurn.push('Oddajemy: ' + formatBasketListBrief(giveItems, fmtCtx));
        if (receiveItems.length > 0) perTurn.push('Dostajemy: ' + formatBasketListBrief(receiveItems, fmtCtx));
      } else {
        if (giveItems.length > 0) oneShot.push('Oddajemy: ' + formatBasketListBrief(giveItems, fmtCtx));
        if (receiveItems.length > 0) oneShot.push('Dostajemy: ' + formatBasketListBrief(receiveItems, fmtCtx));
      }
      if (preview.deltaZaufanie > 0) oneShot.push('+' + preview.deltaZaufanie + ' Zaufania');
      if (dobraWola.active) perTurn.push('+' + dobraWola.zaufaniePerTura + ' Zaufania/turę × ' + dobraWola.tur + ' tur');
      if (basketHasResourceAccess(giveItems, receiveItems)) {
        perTurn.push('+' + diplomacyHandelZaufaniePerTura() + ' Zaufania/turę (trwa umowa handlowa)');
      }
      html += '<div class="cdb-split">' +
        '<div>Jednorazowo: <b>' + (oneShot.length > 0 ? oneShot.join(' · ') : '—') + '</b></div>' +
        '<div>Co turę: <b>' + (perTurn.length > 0 ? perTurn.join(' · ') : '—') + '</b></div>' +
      '</div>';

      let verdict: string;
      let verdictCls: string;
      if (givePn < fairMin) {
        verdict = 'poniżej progu — ryzyko odrzucenia przez partnera';
        verdictCls = 'bad';
      } else if (preview.surplusPn > 0) {
        verdict = 'korzystna — nadwyżka ' + preview.surplusPn + ' PW przekłada się na Zaufanie';
        verdictCls = 'good';
      } else {
        verdict = 'zrównoważona — dokładnie fair min przy tej Relacji';
        verdictCls = 'neutral';
      }
      html += '<div class="cdb-verdict cdb-verdict-' + verdictCls + '">Szczegóły: ' + esc(verdict) + '</div>';
    } else {
      html += '<div class="cdb-warn">' + brandIconSvg('chip-warning', 14) + ' Nieznana wartość PW — sprawdź pozycje.</div>';
    }
  } else {
    html += '<div>SUMA daru: <b>' + (givePn ?? '—') + ' PW</b></div>';
    if (givePn != null) {
      const gift = diplomacyGiftTrustFromPn(givePn, trustGained);
      html += '<div>Przewidywane: <b>+' + gift.deltaZaufanie + ' Zauf.</b>';
      if (gift.deltaZaufanieRaw > gift.deltaZaufanie) {
        html += ' <span style="color:#9aa6b6">(limit ' + maxTrust + '/turę, już +' + trustGained + ')</span>';
      }
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

/**
 * Eksport do testów (P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU) — dowód, że formularz
 * z pustą listą (id='') faktycznie no-opuje zamiast dodać pozycję-widmo do koszyka.
 */
export function readItemFromForm(side: 'give' | 'receive', box: Element, ctx: NegotiationModalContext): BasketItem | null {
  const prefix = side === 'give' ? 'give' : 'recv';
  const typ = (box.querySelector('.cdb-typ[data-side="' + prefix + '"]') as HTMLInputElement)?.value as WartoscPozycjaTyp;
  if (!typ) return null;

  switch (typ) {
    case 'zloto':
    case 'praca': {
      const qty = parseInt((box.querySelector('.cdb-qty[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? '0', 10);
      if (qty <= 0) return null;
      return { typ, id: typ, ilosc: qty };
    }
    case 'zywnosc': {
      // P-DYPLO-HANDEL-ZYWNOSC-WYBOR-MIASTA-ZBEDNY (Maciej 2026-08-14): bez wyboru miasta —
      // jeden cywilizacyjny zasób (Spichlerz Centralny), jak zloto/praca wyżej (id=typ).
      const qty = parseInt((box.querySelector('.cdb-food-qty[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? '0', 10);
      if (qty <= 0) return null;
      return { typ, id: typ, ilosc: qty };
    }
    case 'zloze': {
      const id = (box.querySelector('.cdb-zloze[data-side="' + prefix + '"]') as HTMLInputElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'tech': {
      const id = (box.querySelector('.cdb-tech[data-side="' + prefix + '"]') as HTMLInputElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'jednostka': {
      const id = (box.querySelector('.cdb-unit[data-side="' + prefix + '"]') as HTMLInputElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'surowiec_boolean': {
      const id = (box.querySelector('.cdb-res-bool[data-side="' + prefix + '"]') as HTMLInputElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'surowiec_ilosc': {
      const hidden = box.querySelector('.cdb-res-qty-sel[data-side="' + prefix + '"]') as HTMLInputElement | null;
      const id = hidden?.value;
      if (!id) return null;
      const maxAttr = parseInt(hidden?.getAttribute('data-max') ?? '0', 10);
      const rawQty = parseInt(
        (box.querySelector('.cdb-res-qty-num[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? '0',
        10,
      );
      if (!(rawQty > 0)) return null;
      // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): floor do wielokrotności kroku handlu (5 szt.
      // dla surowców dotkniętych ×5) — odrzuca (null) ilość poniżej jednego bloku zamiast
      // po cichu przyjąć niepoprawną wartość (spójne z odrzuceniem qty<=0 wyżej).
      const qty = diplomacyNormalizeSurowiecIlosc(id, rawQty, maxAttr > 0 ? maxAttr : undefined);
      if (qty <= 0) return null;
      return { typ, id, ilosc: qty };
    }
    default:
      return null;
  }
}

function updateTypFields(box: Element, side: 'give' | 'receive'): void {
  const prefix = side === 'give' ? 'give' : 'recv';
  const typ = (box.querySelector('.cdb-typ[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? 'zloto';
  const extras = ['qty', 'city', 'tech', 'resqty'];
  for (const ex of extras) {
    const el = box.querySelector('[data-extra="' + prefix + '-' + ex + '"]');
    if (el) el.classList.remove('visible');
  }
  const map: Record<string, string> = {
    zloto: 'qty', praca: 'qty', zywnosc: 'city', tech: 'tech', surowiec_ilosc: 'resqty',
  };
  const show = map[typ];
  if (show) {
    const el = box.querySelector('[data-extra="' + prefix + '-' + show + '"]');
    if (el) el.classList.add('visible');
  }
}

function selectChipInGroup(
  btn: Element,
  chipClass: string,
  hiddenSelector: string,
  onSelect?: (value: string, max?: number) => void,
): void {
  const side = btn.getAttribute('data-side');
  if (!side) return;
  const value = btn.getAttribute('data-value') ?? '';
  const addBox = btn.closest('.cdb-add');
  if (!addBox) return;
  addBox.querySelectorAll('.' + chipClass + '[data-side="' + side + '"]').forEach(c => {
    c.classList.toggle('selected', c === btn);
  });
  const hidden = addBox.querySelector(hiddenSelector + '[data-side="' + side + '"]') as HTMLInputElement | null;
  if (hidden) {
    hidden.value = value;
    const max = btn.getAttribute('data-max');
    if (max != null) hidden.setAttribute('data-max', max);
  }
  onSelect?.(value, btn.getAttribute('data-max') ? parseInt(btn.getAttribute('data-max')!, 10) : undefined);
}

function warThreatBlockHtml(checked: boolean, visible: boolean): string {
  if (!visible) return '';
  return (
    '<div class="cdb-war-threat" style="margin-top:10px;padding:8px;border-radius:8px;border:1px solid rgba(200,64,64,.25);background:rgba(40,20,20,.35)">'
    + '<label style="display:flex;gap:8px;align-items:center;font-size:0.85em;margin:0;cursor:pointer">'
    + '<input type="checkbox" class="cdb-war-threat-cb"' + (checked ? ' checked' : '') + ' />'
    + 'Ultimatum wojenne — odmowa partnera = wypowiedzenie wojny</label></div>'
  );
}

function balanceButtonHtml(visible: boolean): string {
  if (!visible) return '';
  return '<button type="button" class="dip-muted-btn cdb-balance-btn" style="margin-top:8px">Wyrównaj (fair @ Rel)</button>';
}

function renderBasket(
  box: HTMLDivElement,
  mode: TradeBasketMode,
  action: AudienceAction,
  ctx: NegotiationModalContext,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  dealTurns: number,
  resourceTradeMode: 'once' | 'per_turn',
  treatyState: TreatyFormState,
  warThreat: boolean,
  editingItem: EditingItemRef | null,
  modalOpts?: TradeBasketModalOptions,
): void {
  const rel = ctx.relacjaTotal ?? 0;
  const progHandel = ctx.progHandelRelacja ?? PROG_HANDEL_REL;
  const progDar = ctx.progDarRelacja ?? diplomacyProgDarRelacja();
  const isTreatyOnly = mode === 'treaty' && isTreatyOnlyFormAction(action.id);
  /** Pozycja aktualnie edytowana (jeśli wciąż istnieje pod tym indeksem po tej stronie). */
  const editItemFor = (side: 'give' | 'receive'): BasketEditItem | undefined => {
    if (!editingItem || editingItem.side !== side) return undefined;
    const list = side === 'give' ? giveItems : receiveItems;
    const item = list[editingItem.idx];
    return item ? { item, idx: editingItem.idx } : undefined;
  };

  let blocked = '';
  if (ctx.atWar && mode !== 'treaty' && !uiActionAllowsWarCurrency(action.id, mode, treatyState.tributeMode)) {
    blocked = '<div class="cdb-blocked">W wojnie zwykły handel i dar są niedostępne — użyj propozycji pokoju</div>';
  } else if (mode === 'trade' && rel < progHandel) {
    blocked = '<div class="cdb-blocked">Handel wymaga Relacji ≥ ' + progHandel + ' (obecnie: ' + rel + ')</div>';
  } else if (mode === 'gift' && rel < progDar) {
    blocked = '<div class="cdb-blocked">Dar wymaga Relacji ≥ ' + progDar + ' (obecnie: ' + rel + ')</div>';
  }

  const title = modalOpts?.dialogTitle
    ?? (mode === 'gift' ? 'Prezent / dar' : action.label);
  const sub = isTreatyOnly
    ? 'Tylko warunki tej umowy · partner: <strong>' + esc(ctx.civName) + '</strong>'
    : mode === 'treaty'
      ? 'Ustal warunki traktatu — wymiana PW jest opcjonalna · partner: <strong>' + esc(ctx.civName) + '</strong>'
      : mode === 'gift'
        ? 'Oddajesz bez towaru w zamian · Rel ≥ ' + progDar
        : 'Wymiana dwustronna · Rel ≥ ' + progHandel + ' · partner: <strong>' + esc(ctx.civName) + '</strong>';

  const validation = validateBasketForm(
    mode, action.id, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode, !!blocked, treatyState,
  );
  const invalidHtml = !validation.valid && validation.reason
    ? '<div class="cdb-invalid">' + esc(validation.reason) + '</div>'
    : '';

  const treatyHtml = mode === 'treaty' ? treatySectionHtml(action.id, ctx, treatyState) : '';

  if (isTreatyOnly) {
    const summaryBlock = blocked
      ? ''
      // editable=true: dołożony słodzik AI (giveItems/receiveItems) musi mieć UI
      // podglądu/edycji/usunięcia — patrz treatySweetenerEditableRowsHtml wyżej.
      : treatySummaryHtml(action, treatyState, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode, true);
    const treatyOnlyFooter = (blocked ? '' : warThreatBlockHtml(warThreat, true))
      + invalidHtml
      + '<div class="cdb-btns cdb-btns-center">'
      + '<button type="button" class="dip-muted-btn cdb-cancel">Anuluj</button>'
      + '<button type="button" class="dip-gold-btn cdb-submit"' + (blocked || !validation.valid ? ' disabled' : '') + '>'
      + esc(modalOpts?.submitLabel ?? 'Zaproponuj') + '</button>'
      + '</div>';
    const scrollBody = blocked
      ? blocked
      : '<div class="cdb-landscape">'
        + '<div class="cdb-land-main">' + treatyHtml + '</div>'
        + '<div class="cdb-land-side">' + summaryBlock + '</div>'
        + '</div>';
    box.className = 'civ-diplo-basket cdb-treaty-mode cdb-treaty-only-mode cdb-landscape-mode';
    box.innerHTML =
      '<h3>' + esc(title) + '</h3>' +
      '<div class="cdb-sub">' + sub + '</div>' +
      '<div class="cdb-body-scroll">' + scrollBody + '</div>' +
      '<div class="cdb-footer">' + treatyOnlyFooter + '</div>';
    return;
  }

  const basketModeForForm: TradeBasketMode = mode === 'treaty' ? 'trade' : mode;
  const showReceiveCol = mode === 'trade' || mode === 'treaty';
  const wchloniecieOnly = action.id === '15';
  /** Traktat (NAP/sojusz/…) bez koszyka PN — nie pokazuj pustego stołu OFERUJEMY|OFERUJĄ. */
  const treatyBasketsEmpty = mode === 'treaty' && giveItems.length === 0 && receiveItems.length === 0;
  const showDealPreview = showReceiveCol && !blocked && !treatyBasketsEmpty && !wchloniecieOnly;

  const giveCol =
    '<div class="cdb-col">' +
      '<div class="cdb-col-title">' + (mode === 'treaty' ? 'My oddajemy (opcjonalnie)' : 'Dodaj do oferty') + '</div>' +
      (blocked ? '' : buildAddForm('give', ctx, basketModeForForm, action.id, treatyState.tributeMode, editItemFor('give'), giveItems)) +
    '</div>';

  const recvCol = showReceiveCol
    ? '<div class="cdb-col">' +
        '<div class="cdb-col-title">' + (mode === 'treaty' ? 'Oni oddają (opcjonalnie)' : 'Dodaj do kontrpropozycji') + '</div>' +
        (blocked ? '' : buildAddForm('receive', ctx, basketModeForForm, action.id, treatyState.tributeMode, editItemFor('receive'), receiveItems)) +
      '</div>'
    : '';

  const dealPreview = showDealPreview
    ? tradeDealPreviewHtml(
      giveItems, receiveItems, resourceTradeMode, dealTurns, ctx,
      mode, action.id, treatyState.tributeMode, editingItem,
    )
    : (mode === 'gift' && !blocked
      ? '<div class="cdb-deal-preview"><div class="da-deal-table">' +
        dealSideColumnHtml(
          'Co oddajesz', 'da-deal-col-we', giveItems, 'give', 'once', dealTurns, ctx,
          mode, action.id, treatyState.tributeMode, editingItem?.side === 'give' ? editingItem.idx : null,
        ) +
        '</div></div>'
      : '');

  const hasResourceAccess = basketHasResourceAccess(giveItems, receiveItems);
  const hasQtyRes = showReceiveCol && !hasResourceAccess && basketHasQuantityResource(giveItems, receiveItems);
  const showResModeSelector = showReceiveCol && (mode === 'trade' || mode === 'treaty');
  const showDealDuration = showReceiveCol
    && (hasResourceAccess || (hasQtyRes && resourceTradeMode === 'per_turn')
      || (showResModeSelector && resourceTradeMode === 'per_turn'));
  const dealDurationLabel = hasResourceAccess
    ? 'Czas umowy (tur, max 20)'
    : 'Co ile tur trwa wymiana (tur, max 20)';
  const dealDurationSub = hasResourceAccess
    ? 'Dostęp do surowców trwa przez wybrany czas. Po wygaśnięciu umowa wymaga odnowienia (re-negocjacji).'
    : 'Surowiec i zapłata płyną CO TURĘ przez wybrany czas. Deal znika po wygaśnięciu, zerwaniu traktatu lub wojnie.';
  const dealSettingsHint = !hasQtyRes && !hasResourceAccess
    ? 'Tryb „Co turę" i czas obowiązują po dodaniu surowca (sztuki) do koszyka.'
    : undefined;

  const dealSettings = (blocked || !showReceiveCol)
    ? ''
    : dealSettingsBlockHtml(
      resourceTradeMode,
      dealTurns,
      showResModeSelector,
      showDealDuration,
      dealDurationLabel,
      dealDurationSub,
      dealSettingsHint,
    );

  const treatyHtmlRest = mode === 'treaty' ? treatySectionHtml(action.id, ctx, treatyState) : '';
  const basketOptIntro = mode === 'treaty' && !blocked && !wchloniecieOnly
    ? '<div class="cdb-basket-opt"><div class="cdb-basket-opt-title">'
      + (treatyBasketsEmpty
        ? 'Opcjonalnie — dołóż wymianę PW (nie jest wymagana do zaproponowania traktatu)'
        : 'Dołóżona wymiana PW')
      + '</div>'
    : '';
  const basketOptClose = mode === 'treaty' && !blocked && !wchloniecieOnly ? '</div>' : '';
  const summaryBlock = mode === 'treaty'
    ? treatySummaryHtml(action, treatyState, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode)
    : summaryHtml(mode, giveItems, receiveItems, ctx, resourceTradeMode, dealTurns);

  const sideBlock = basketOptIntro
    + dealSettings
    + (blocked ? '' : '<div class="cdb-cols">' + (wchloniecieOnly ? '' : giveCol + recvCol) + '</div>')
    + basketOptClose;

  const showWarThreat = !blocked && (mode === 'trade' || mode === 'treaty');
  const showBalanceBtn = !blocked && mode === 'trade' && receiveItems.length > 0;

  const footerBlock = (blocked ? '' : balanceButtonHtml(showBalanceBtn))
    + (blocked ? '' : warThreatBlockHtml(warThreat, showWarThreat))
    + invalidHtml
    + '<div class="cdb-btns">'
    + '<button type="button" class="dip-muted-btn cdb-cancel">Anuluj</button>'
    + '<button type="button" class="dip-gold-btn cdb-submit"' + (blocked || !validation.valid ? ' disabled' : '') + '>'
    + esc(modalOpts?.submitLabel ?? 'Zaproponuj') + '</button>'
    + '</div>';

  const landMain = mode === 'treaty'
    ? treatyHtmlRest + (showDealPreview ? dealPreview : '') + (blocked ? '' : summaryBlock)
    : (dealPreview + (blocked ? '' : summaryBlock));

  const scrollBody = blocked
    ? blocked
    : '<div class="cdb-landscape">'
      + '<div class="cdb-land-main">' + landMain + '</div>'
      + '<div class="cdb-land-side">' + sideBlock + '</div>'
      + '</div>';

  const modeCls = mode === 'treaty' ? ' cdb-treaty-mode' : (mode === 'trade' ? ' cdb-trade-mode' : '');
  box.className = 'civ-diplo-basket cdb-landscape-mode' + (mode === 'gift' ? ' cdb-gift' : '') + modeCls;
  box.innerHTML =
    '<h3>' + esc(title) + '</h3>' +
    '<div class="cdb-sub">' + sub + '</div>' +
    '<div class="cdb-body-scroll">' + scrollBody + '</div>' +
    '<div class="cdb-footer">' + footerBlock + '</div>';
}

export interface TradeBasketModalOptions {
  /** Nagłówek okna (domyślnie: etykieta akcji). */
  dialogTitle?: string;
  /** Etykieta przycisku wysłania (domyślnie: Zaproponuj). */
  submitLabel?: string;
}

export interface TradeBasketInitial {
  giveItems?: readonly BasketItem[];
  receiveItems?: readonly BasketItem[];
  turns?: number;
  resourceTradeMode?: 'once' | 'per_turn';
  allianceKind?: 'defensywny' | 'pelny';
  borderMilitary?: boolean;
  barbarianCooperation?: boolean;
  goldPerTurn?: number;
  goldOnce?: number;
  tributeMode?: 'demand' | 'offer';
  tributeTurns?: number;
  techId?: string;
  techDirection?: 'sell' | 'buy';
  techPaymentMode?: 'gold' | 'tech';
  techOfferId?: string;
  bribeGold?: number;
  targetOwnerId?: number;
}

export function showTradeBasketModal(
  mode: TradeBasketMode,
  action: AudienceAction,
  ctx: NegotiationModalContext,
  onSubmit: (payload: NegotiationPayload) => void,
  onCancel: () => void,
  initial?: TradeBasketInitial,
  modalOpts?: TradeBasketModalOptions,
): void {
  closeModal();
  ensureStyles();
  activeOnCancel = onCancel;

  // Zaległość #1 (SZYBKA UMOWA) — koszyk może otwierać się WYPEŁNIONY propozycją
  // (computeQuickDealBasket), użytkownik dalej może edytować/usuwać pozycje normalnie.
  let giveItems: BasketItem[] = stripWithdrawnResourceAccessItems(initial?.giveItems ?? []);
  let receiveItems: BasketItem[] = stripWithdrawnResourceAccessItems(initial?.receiveItems ?? []);
  let dealTurns = initial?.turns != null ? Math.max(1, Math.min(20, initial.turns)) : 15;
  let resourceTradeMode: 'once' | 'per_turn' = initial?.resourceTradeMode ?? 'once';
  let warThreat = action.id === '9';
  let treatyState = defaultTreatyState(action.id, initial, ctx);
  /** R-PROPOZYCJA-BRAK-EDYCJI: pozycja koszyka aktualnie otwarta do edycji (✎ Edytuj). */
  let editingItem: EditingItemRef | null = null;

  overlay = document.createElement('div');
  overlay.className = 'civ-diplo-basket-overlay';
  const box = document.createElement('div');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  pushOverlay('diplo-trade-basket', dismissTradeBasketViaEscape);

  const readDealTurnsFromDom = (): void => {
    const inp = box.querySelector('.cdb-deal-turns') as HTMLInputElement | null;
    if (inp) dealTurns = Math.max(1, Math.min(20, parseInt(inp.value, 10) || 15));
  };

  const readResourceTradeModeFromDom = (): void => {
    const hidden = box.querySelector('.cdb-res-mode') as HTMLInputElement | null;
    if (hidden) resourceTradeMode = hidden.value === 'per_turn' ? 'per_turn' : 'once';
  };

  const refresh = (): void => {
    readDealTurnsFromDom();
    readResourceTradeModeFromDom();
    if (mode === 'treaty') treatyState = readTreatyStateFromDom(action.id, treatyState, ctx);
    renderBasket(box, mode, action, ctx, giveItems, receiveItems, dealTurns, resourceTradeMode, treatyState, warThreat, editingItem, modalOpts);
    bindEvents();
  };

  const bindEvents = (): void => {
    const dismiss = (): void => {
      const cb = activeOnCancel;
      closeModal();
      cb?.();
    };
    box.querySelector('.cdb-cancel')?.addEventListener('click', dismiss);

    box.querySelectorAll('.cdb-chip-typ').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side') === 'recv' ? 'receive' : 'give';
        selectChipInGroup(btn, 'cdb-chip-typ', '.cdb-typ', (value) => {
          const prefix = side === 'give' ? 'give' : 'recv';
          const hidden = box.querySelector('.cdb-typ[data-side="' + prefix + '"]') as HTMLInputElement | null;
          if (hidden) hidden.value = value;
          updateTypFields(box, side);
        });
      });
    });

    // P-DYPLO-HANDEL-ZYWNOSC-WYBOR-MIASTA-ZBEDNY (Maciej 2026-08-14): wiązanie kliknięć dla
    // `.cdb-chip-city`/`.cdb-city` usunięte razem z selektorem — te elementy już nigdy nie
    // renderują się (patrz buildAddForm), więc `querySelectorAll` tu byłoby zawsze puste.

    box.querySelectorAll('.cdb-chip-tech').forEach(btn => {
      btn.addEventListener('click', () => {
        selectChipInGroup(btn, 'cdb-chip-tech', '.cdb-tech');
      });
    });

    // R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A: przełącznik Sprzedaż/Kupno (akcja '6').
    // Klasa dot. przycisku ustawiana TU (przed refresh()) — readTreatyStateFromDom
    // odczytuje `.selected` z DOM, refresh() dopiero potem przerysowuje resztę formularza
    // (nową listę technologii dla wybranego kierunku).
    box.querySelectorAll('.cdb-treaty-tech-dir').forEach(btn => {
      btn.addEventListener('click', () => {
        box.querySelectorAll('.cdb-treaty-tech-dir').forEach(c => c.classList.toggle('selected', c === btn));
        refresh();
      });
    });

    // Sposób zapłaty (Gotówka/Technologia) — sam wzorzec co przełącznik kierunku wyżej.
    box.querySelectorAll('.cdb-treaty-tech-pay').forEach(btn => {
      btn.addEventListener('click', () => {
        box.querySelectorAll('.cdb-treaty-tech-pay').forEach(c => c.classList.toggle('selected', c === btn));
        refresh();
      });
    });

    box.querySelectorAll('.cdb-chip-resqty').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side');
        selectChipInGroup(btn, 'cdb-chip-resqty', '.cdb-res-qty-sel', (value, max) => {
          if (!side) return;
          // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): krok handlu zależy od WYBRANEGO
          // surowca (5 szt. dla dotkniętych ×5, 1 dla Złota/Węgla) — przełączenie chipa
          // musi przestawić min/step inputu I przeliczyć jego bieżącą wartość na
          // najbliższą poprawną wielokrotność nowego kroku (UWAGA: wcześniejszy stan
          // pola mógł być poprawną wielokrotnością POPRZEDNIEGO kroku, nie nowego).
          const krok = diplomacyHandelSurowiecKrok(value);
          const inp = box.querySelector('.cdb-res-qty-num[data-side="' + side + '"]') as HTMLInputElement | null;
          if (inp) {
            if (max != null) inp.max = String(max);
            inp.min = String(krok);
            inp.step = String(krok);
            const cur = parseInt(inp.value, 10) || krok;
            const normalized = diplomacyNormalizeSurowiecIlosc(value, cur, max) || krok;
            inp.value = String(normalized);
            const stepper = inp.closest('.cdb-qty-stepper');
            if (stepper) {
              const mults = [1, 10, 100];
              stepper.querySelectorAll('.cdb-qty-step').forEach((b, i) => {
                const d = krok * (mults[i] ?? 1);
                b.setAttribute('data-delta', String(d));
                b.textContent = '+' + d;
              });
            }
          }
          const hint = box.querySelector('.cdb-res-qty-krok-hint[data-side="' + side + '"]');
          if (hint) hint.textContent = krok > 1 ? '(krok ' + krok + ' szt.)' : '';
        });
      });
    });

    box.querySelectorAll('.cdb-chip-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        box.querySelectorAll('.cdb-chip-mode').forEach(c => c.classList.toggle('selected', c === btn));
        const hidden = box.querySelector('.cdb-res-mode') as HTMLInputElement | null;
        const mode = btn.getAttribute('data-value') === 'per_turn' ? 'per_turn' : 'once';
        if (hidden) hidden.value = mode;
        resourceTradeMode = mode;
        refresh();
      });
    });

    box.querySelectorAll('.cdb-chip-turn').forEach(btn => {
      btn.addEventListener('click', () => {
        const turns = parseInt(btn.getAttribute('data-turns') ?? '15', 10);
        const treatyInp = box.querySelector('.cdb-treaty-turns') as HTMLInputElement | null;
        if (treatyInp) {
          const val = turns <= 0 ? 0 : Math.max(10, Math.min(20, turns));
          treatyInp.value = String(val);
          const treatyRoot = treatyInp.closest('.cdb-treaty');
          treatyRoot?.querySelectorAll('.cdb-chip-turn').forEach(c => c.classList.toggle('selected', c === btn));
          refresh();
          return;
        }
        dealTurns = Math.max(1, Math.min(20, turns));
        const inp = box.querySelector('.cdb-deal-turns') as HTMLInputElement | null;
        if (inp) inp.value = String(dealTurns);
        box.querySelectorAll('.cdb-chip-turn').forEach(c => {
          c.classList.toggle('selected', c === btn);
        });
        refresh();
      });
    });

    box.querySelector('.cdb-war-threat-cb')?.addEventListener('change', (ev) => {
      warThreat = (ev.target as HTMLInputElement).checked;
    });

    box.querySelector('.cdb-balance-btn')?.addEventListener('click', () => {
      readDealTurnsFromDom();
      readResourceTradeModeFromDom();
      const receivePn = sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns);
      if (receivePn == null || receivePn <= 0) return;
      const turnsOpts = proposalPnTurnsMultiplier({ resourceTradeMode, turns: dealTurns });
      giveItems = balanceGiveItemsToFairMin(
        giveItems,
        receivePn,
        ctx.relacjaTotal ?? 0,
        Math.floor(ctx.playerSkarbiec ?? 0),
        {
          difficulty: ctx.difficulty ?? 'normal',
          proposerOwnerId: 0,
          playerOwnerId: 0,
          tempoGry: resolveTempo(ctx),
          ...turnsOpts,
        },
      );
      refresh();
    });

    box.querySelectorAll('.cdb-qty-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side');
        const target = btn.getAttribute('data-target');
        const delta = parseInt(btn.getAttribute('data-delta') ?? '0', 10);
        if (!side || !target || delta <= 0) return;
        const inp = box.querySelector('.' + target + '[data-side="' + side + '"]') as HTMLInputElement | null;
        if (!inp) return;
        const min = parseInt(inp.min || '1', 10);
        const max = inp.max ? parseInt(inp.max, 10) : Infinity;
        const next = Math.min(max, Math.max(min, (parseInt(inp.value, 10) || 0) + delta));
        inp.value = String(next);
      });
    });

    for (const side of ['give', 'recv'] as const) {
      const uiSide = side === 'recv' ? 'receive' : 'give';
      updateTypFields(box, uiSide);
    }

    box.querySelector('.cdb-deal-turns')?.addEventListener('input', () => refresh());

    box.querySelectorAll(
      '.cdb-treaty-turns, .cdb-treaty-alliance, .cdb-treaty-mil, .cdb-treaty-trib-mode, .cdb-treaty-gpt, .cdb-treaty-trib-turns, .cdb-treaty-wasal-gpt, .cdb-treaty-wchlon-gold',
    ).forEach(el => {
      el.addEventListener('change', () => refresh());
      el.addEventListener('input', () => refresh());
    });

    box.querySelectorAll('.cdb-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side') === 'recv' ? 'receive' : 'give';
        const item = readItemFromForm(side, box, ctx);
        if (!item) return;
        const editIdxAttr = btn.getAttribute('data-edit-idx');
        const editIdx = editIdxAttr != null ? parseInt(editIdxAttr, 10) : -1;
        if (editIdx >= 0) {
          // R-PROPOZYCJA-BRAK-EDYCJI: „Zapisz zmiany" — podmień pozycję na miejscu; przy kolizji
          // z INNYM wierszem scal/zablokuj tak samo jak przy dodawaniu (R-DYPLO-DUPLIKAT-KOSZYK-
          // EDYCJA, patrz applyBasketItemEdit) zamiast po cichu tworzyć duplikat.
          if (side === 'give') giveItems = applyBasketItemEdit(giveItems, editIdx, item, side, ctx);
          else receiveItems = applyBasketItemEdit(receiveItems, editIdx, item, side, ctx);
          editingItem = null;
        } else {
          // R-DYPLO-DUPLIKAT-KOSZYK: dodanie tej samej propozycji drugi raz sumuje ilość
          // (dla typów, gdzie to ma sens) albo jest blokowane (patrz addOrMergeBasketItem) —
          // zamiast dokładać osobny, zduplikowany wiersz.
          if (side === 'give') giveItems = addOrMergeBasketItem(giveItems, item, 'give', ctx);
          else receiveItems = addOrMergeBasketItem(receiveItems, item, 'receive', ctx);
        }
        refresh();
      });
    });

    box.querySelectorAll('.cdb-edit-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side') === 'receive' ? 'receive' : 'give';
        const idx = parseInt(btn.getAttribute('data-idx') ?? '-1', 10);
        if (idx < 0) return;
        editingItem = { side, idx };
        refresh();
      });
    });

    box.querySelectorAll('.cdb-edit-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        editingItem = null;
        refresh();
      });
    });

    box.querySelectorAll('.cdb-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side');
        const idx = parseInt(btn.getAttribute('data-idx') ?? '-1', 10);
        if (idx < 0) return;
        if (side === 'give') giveItems = giveItems.filter((_, i) => i !== idx);
        else receiveItems = receiveItems.filter((_, i) => i !== idx);
        // Indeksy po tej stronie przesunęły się — edycja w toku dla tej strony traci sens.
        if (editingItem && editingItem.side === side) editingItem = null;
        refresh();
      });
    });

    const applyRowQtyChange = (sideAttr: string | null, idx: number, newQty: number): void => {
      if (idx < 0 || newQty < 1) return;
      const list = sideAttr === 'give' ? giveItems : receiveItems;
      const item = list[idx];
      if (!item || !basketItemQtyEditable(item)) return;
      // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): clampQtyForItem floruje surowiec_ilosc do
      // wielokrotności kroku PO przycięciu do zapasu — jeśli wynik < 1 (za mało nawet na
      // 1 blok po zaokrągleniu w dół), odrzuć edycję (koszyk bez zmian), tak samo jak przy
      // starym `newQty < 1` dla zloto/praca/zywnosc.
      const clamped = clampQtyForItem(item, sideAttr === 'give' ? 'give' : 'receive', ctx, newQty);
      if (clamped < 1) return;
      const updated = { ...item, ilosc: clamped };
      if (sideAttr === 'give') {
        giveItems = giveItems.map((it, i) => (i === idx ? updated : it));
      } else {
        receiveItems = receiveItems.map((it, i) => (i === idx ? updated : it));
      }
      refresh();
    };

    box.querySelectorAll('.cdb-row-qty-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.cdb-row-qty');
        if (!row) return;
        const sideAttr = row.getAttribute('data-side');
        const idx = parseInt(row.getAttribute('data-idx') ?? '-1', 10);
        const delta = parseInt(btn.getAttribute('data-delta') ?? '0', 10);
        const inp = row.querySelector('.cdb-row-qty-inp') as HTMLInputElement | null;
        if (!inp || delta === 0) return;
        const cur = parseInt(inp.value, 10) || 1;
        applyRowQtyChange(sideAttr, idx, cur + delta);
      });
    });

    box.querySelectorAll('.cdb-row-qty-inp').forEach(inp => {
      inp.addEventListener('change', () => {
        const row = inp.closest('.cdb-row-qty');
        if (!row) return;
        const sideAttr = row.getAttribute('data-side');
        const idx = parseInt(row.getAttribute('data-idx') ?? '-1', 10);
        const newQty = parseInt((inp as HTMLInputElement).value, 10) || 1;
        applyRowQtyChange(sideAttr, idx, newQty);
      });
    });

    box.querySelector('.cdb-submit')?.addEventListener('click', () => {
      const blocked = (mode === 'trade' && (ctx.relacjaTotal ?? 0) < (ctx.progHandelRelacja ?? PROG_HANDEL_REL))
        || (mode === 'gift' && (ctx.relacjaTotal ?? 0) < (ctx.progDarRelacja ?? diplomacyProgDarRelacja()));
      readDealTurnsFromDom();
      readResourceTradeModeFromDom();
      const warCb = box.querySelector('.cdb-war-threat-cb') as HTMLInputElement | null;
      if (warCb) warThreat = warCb.checked;
      if (mode === 'treaty') treatyState = readTreatyStateFromDom(action.id, treatyState, ctx);
      const validation = validateBasketForm(
        mode, action.id, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode, blocked, treatyState,
      );
      if (!validation.valid) return;

      giveItems = stripWithdrawnResourceAccessItems(giveItems);
      receiveItems = stripWithdrawnResourceAccessItems(receiveItems);
      if (proposalHasResourceAccess({ giveItems, receiveItems })) return;

      let payload: NegotiationPayload;
      if (mode === 'treaty') {
        payload = buildTreatyPayload(
          action.id, treatyState, ctx, giveItems, receiveItems, dealTurns, resourceTradeMode,
        );
        if (warThreat) payload.warThreat = true;
      } else {
        const givePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns);
        const receivePn = mode === 'trade'
          ? sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns)
          : 0;
        if (givePn == null || (mode === 'trade' && receivePn == null)) return;
        payload = {
          actionId: action.id,
          giveItems,
          receiveItems: mode === 'trade' ? receiveItems : undefined,
          givePn: givePn ?? undefined,
          receivePn: mode === 'trade' ? (receivePn ?? undefined) : 0,
          isGift: mode === 'gift',
          warThreat: warThreat || undefined,
        };
        if (mode === 'trade' && basketHasResourceAccess(giveItems, receiveItems)) {
          payload.turns = dealTurns;
        } else if (
          mode === 'trade'
          && resourceTradeMode === 'per_turn'
          && basketHasQuantityResource(giveItems, receiveItems)
        ) {
          payload.resourceTradeMode = 'per_turn';
          payload.turns = dealTurns;
        }
      }
      closeModal();
      onSubmit(payload);
    });
  };

  refresh();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      const cb = activeOnCancel;
      closeModal();
      cb?.();
    }
  });
}

export function hideTradeBasketModal(): void {
  closeModal();
}

/**
 * Zaległość #1 — „SZYBKA UMOWA" realna, nie zaślepka: dobiera greedy zestaw z realnie
 * posiadanych pozycji obu stron (ctx.giveResourceOptions/receiveResourceOptions —
 * game/diplomacy-goods.ts przez main.ts) tak, by bilans osiągnął próg fair @ Relacji —
 * TA SAMA wycena, którą AI ocenia ofertę (diplomacyFairGivePn/pnDealAcceptedByAi). Otwiera
 * koszyk WYPEŁNIONY propozycją; użytkownik może dalej edytować/usuwać pozycje.
 */
export function openQuickDealBasket(
  action: AudienceAction,
  ctx: NegotiationModalContext,
  onSubmit: (payload: NegotiationPayload) => void,
  onCancel: () => void,
): void {
  const quick = computeQuickDealBasket({
    relacjaTotal: ctx.relacjaTotal ?? 0,
    ourGoldAvailable: ctx.playerSkarbiec ?? 0,
    ourResourceOptions: [],
    theirResourceOptions: [],
    ourQuantityResourceOptions: ctx.giveQuantityResourceOptions ?? defaultQuantityResourceOptions(),
    theirQuantityResourceOptions: ctx.receiveQuantityResourceOptions ?? defaultQuantityResourceOptions(),
  });
  showTradeBasketModal('trade', action, ctx, onSubmit, onCancel, quick);
}

/**
 * Akcje obsługiwane przez koszyk PN (handel + dar + traktaty). R-DYP-STOL-A=C
 * Akcja 5 (traktat szlaków, `umowa_szlakow`) CELOWO wyłączona — HANDEL-SPLIT-Q1=B:
 * traktat szlaków jest całkowicie bez koszyka wymiany (idzie od razu na stół, patrz
 * diplomacyAudience.ts case aid==='5'). BUG-TRAKTAT-KOSZYK-REGRESJA=A (2026-08-08):
 * commit 9cc7c76c przypadkiem dopisał '5' tutaj, cofając to rozdzielenie — przywrócone.
 */
export const TRADE_BASKET_ACTION_IDS = new Set([
  '2', '3', '4', '6', '7', '8', '9', '10', '12', '13', '14', '15',
]);

export function getTradeBasketMode(actionId: string): TradeBasketMode {
  if (actionId === '13') return 'gift';
  if (actionId === '14') return 'trade';
  if (TRADE_BASKET_ACTION_IDS.has(actionId)) return 'treaty';
  return 'trade';
}

export function actionUsesTradeBasket(actionId: string): boolean {
  return TRADE_BASKET_ACTION_IDS.has(actionId);
}

export { validateTradeBasketSides } from '../game/diplomacy-trade-validation';

/** Walidacja koszyka — eksport do testów (R-DYPLO-WYMIANA-ONEWAY). */
export function validateTradeBasketForm(
  mode: TradeBasketMode,
  actionId: string,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
  dealTurns = 15,
  resourceTradeMode: 'once' | 'per_turn' = 'once',
): BasketValidation {
  return validateBasketForm(mode, actionId, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode, false);
}

/** Domyślny payload traktatu handlowego (szlaki) — D-DYPLO-KOSZYK-OD-RAZU. */
export function defaultSzlakiTreatyPayload(): NegotiationPayload {
  return { actionId: '5', turns: 20 };
}
