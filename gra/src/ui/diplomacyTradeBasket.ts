/**
 * diplomacyTradeBasket.ts — koszyk handlu / daru (PN) v1.0 (lane UI, P4).
 * Import katalogu PN z lane D; callback przez NegotiationPayload → audiencja.
 */
import type { AudienceAction } from './diplomacyAudience';
import type { NegotiationModalContext, NegotiationPayload } from './diplomacyNegotiationModal';
import { isCurrencyProposalForbiddenDuringWar } from '../game/diplomacy-war-gates';
import { computeQuickDealBasket, proposalPnTurnsMultiplier, type BasketItem } from '../game/diplomacy-pn-engine';
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
  diplomacyHandelSurowcePakietWielkosc,
  diplomacyHandelSurowceCatalog,
  type WartoscPozycjaTyp,
} from '../game/diplomacy-value-catalog';
import { HANDEL_ZLOZE_CENA_BAZA } from '../game/diplomacy-deposit-trade';
import unitsJson from '../../data/units.json';
import techJson from '../../data/tech.json';
import { DIPLO_1E_SHARED_CSS, ensureDiploBrandScope } from './diploUiSkin';
import { brandIconSvg, mapResourceIconSvg } from './icons/brandAssets';
import {
  renderBasketItemValueHtml,
} from './diplomacyDealDisplay';
import type { BasketItemFormatCtx } from '../game/diplomacy-display';
import { formatBasketListBrief, resourceDisplayLabel } from '../game/diplomacy-display';
import { renderPnBalancePanelFromBasket, renderPnBalancePanelForPeace } from './diplomacyAcceptanceBalance';
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

const TYP_LABELS: Record<WartoscPozycjaTyp, string> = {
  zloto: 'Pieniądze (¤)',
  praca: 'Praca',
  zywnosc: 'Żywność (spichlerz)',
  zloze: 'Dostęp do złoża (1 pole)',
  tech: 'Technologia',
  jednostka: 'Jednostka',
  surowiec_boolean: 'Dostęp do surowca',
  surowiec_ilosc: 'Surowiec (sztuki, pakiety)',
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
): string {
  return (
    '<button type="button" class="cdb-chip ' + cls + (selected ? ' selected' : '') + '"'
    + ' data-side="' + side + '" data-value="' + esc(value) + '"' + extraAttrs + '>'
    + iconHtml
    + '<span class="cdb-chip-lbl">' + esc(label) + '</span>'
    + '</button>'
  );
}

function qtyStepperHtml(
  inputClass: string,
  side: string,
  value: number,
  min = 1,
  max?: number,
): string {
  const maxAttr = max != null ? ' max="' + max + '"' : '';
  return (
    '<div class="cdb-qty-stepper">'
    + '<button type="button" class="cdb-qty-step dip-muted-btn" data-side="' + side
    + '" data-target="' + inputClass + '" data-delta="1">+1</button>'
    + '<button type="button" class="cdb-qty-step dip-muted-btn" data-side="' + side
    + '" data-target="' + inputClass + '" data-delta="10">+10</button>'
    + '<button type="button" class="cdb-qty-step dip-muted-btn" data-side="' + side
    + '" data-target="' + inputClass + '" data-delta="100">+100</button>'
    + '<input type="number" class="' + inputClass + '" data-side="' + side
    + '" value="' + value + '" min="' + min + '"' + maxAttr + ' />'
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
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;max-width:760px;width:100%;max-height:92vh;overflow:auto;
  color:#e8e0c8;font:14px 'Segoe UI',Tahoma,sans-serif;pointer-events:auto;position:relative;z-index:1;}
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
.civ-diplo-basket .cdb-deal-row{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;}
.civ-diplo-basket .cdb-deal-row .da-deal-item{flex:1;min-width:0;}
.civ-diplo-basket .cdb-col{border:1px solid rgba(232,216,138,.2);border-radius:8px;padding:10px;}
.civ-diplo-basket .cdb-col-title{font-size:0.72em;color:#a8a090;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
.civ-diplo-basket .cdb-deal-settings{margin:10px 0 4px;display:flex;flex-direction:column;gap:8px;}
.civ-diplo-basket .cdb-item{display:flex;justify-content:space-between;align-items:center;gap:8px;
  padding:5px 7px;margin:3px 0;border-radius:6px;background:rgba(40,48,60,0.45);font-size:0.78em;}
.civ-diplo-basket .cdb-item-pn{color:#e8d88a;white-space:nowrap;}
.civ-diplo-basket .cdb-rm{background:none;border:none;color:#e08a8a;cursor:pointer;font-size:1em;padding:0 4px;}
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
.civ-diplo-basket .cdb-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}
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
.civ-diplo-basket .da-pn-bal-num{font-size:1.1em;font-weight:700;color:#f0e8d8;}
.civ-diplo-basket .da-pn-bal-num.pos{color:#7ad0a0;}
.civ-diplo-basket .da-pn-bal-num.neg{color:#e0a868;}
.civ-diplo-basket .da-pn-bal-hint{font-size:0.62em;color:#a8a090;}
.civ-diplo-basket .da-pn-bal-meta{font-size:0.62em;color:#8a8070;margin-top:6px;}
.civ-diplo-basket .da-pn-bal-verdict{margin-top:8px;padding:7px 10px;border-radius:7px;font-size:0.72em;font-weight:600;}
.civ-diplo-basket .da-pn-bal-verdict.ok{color:#7ad0a0;background:rgba(80,176,112,.12);border:1px solid rgba(80,176,112,.35);}
.civ-diplo-basket .da-pn-bal-verdict.no{color:#e0a868;background:rgba(224,168,104,.1);border:1px solid rgba(224,168,104,.35);}
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
 * stanu magazynu, więc `maxPakiety` jest umowną górną granicą (nie odzwierciedla
 * faktycznych zapasów). main.ts zawsze podaje realne `giveQuantityResourceOptions` /
 * `receiveQuantityResourceOptions` — ten fallback praktycznie nie jest używany w grze.
 */
const FALLBACK_QUANTITY_MAX_PAKIETY = 99;

function defaultQuantityResourceOptions(): Array<{ id: string; label: string; maxPakiety: number }> {
  const cat = diplomacyHandelSurowceCatalog();
  const pakiet = diplomacyHandelSurowcePakietWielkosc();
  return Object.keys(cat).map(id => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1) + ' ×' + pakiet + ' (pakiet)',
    maxPakiety: FALLBACK_QUANTITY_MAX_PAKIETY,
  }));
}

function basketHasResourceAccess(...lists: ReadonlyArray<readonly BasketItem[]>): boolean {
  for (const items of lists) {
    if (items.some(i => i.typ === 'zloze' || i.typ === 'surowiec_boolean')) return true;
  }
  return false;
}

/** HANDEL-SUROWCE-CYKL (2026-07-24): czy koszyk zawiera surowiec ILOŚCIOWY (pakiety ze spichlerza miast). */
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
  tributeMode: 'demand' | 'offer';
  goldPerTurn: number;
  tributeTurns: number;
}

function defaultTreatyState(actionId: string, initial?: TradeBasketInitial): TreatyFormState {
  return {
    turns: initial?.turns != null ? Math.max(1, Math.min(20, initial.turns)) : 10,
    allianceKind: initial?.allianceKind === 'defensywny' ? 'defensywny' : 'pelny',
    borderMilitary: initial?.borderMilitary ?? false,
    tributeMode: initial?.tributeMode === 'offer' ? 'offer' : 'demand',
    goldPerTurn: initial?.goldPerTurn ?? (actionId === '12' ? 10 : 15),
    tributeTurns: initial?.tributeTurns ?? 0,
  };
}

function treatySectionHtml(actionId: string, ctx: NegotiationModalContext, state: TreatyFormState): string {
  const sub = ctx.aiCounterOffer
    ? '<p class="cdb-sub">' + esc(ctx.aiCounterOffer) + '</p>'
    : '';
  let body = '';
  switch (actionId) {
    case '2': {
      const turnChips = [5, 10, 15].map(t =>
        '<button type="button" class="cdb-chip cdb-chip-turn' + (state.turns === t ? ' selected' : '')
        + '" data-turns="' + t + '">' + t + '</button>',
      ).join('');
      body = '<label for="cdb-treaty-turns">Czas paktu (tur)</label>'
        + '<div class="cdb-chip-row cdb-turn-presets">' + turnChips + '</div>'
        + qtyStepperHtml('cdb-treaty-turns', 'treaty', state.turns, 1, 20)
        + '<p class="cdb-sub">Złamanie: −30 Relacja, −20 Zaufanie</p>';
      break;
    }
    case '3':
      body = '<label>Typ sojuszu</label>'
        + '<select id="cdb-treaty-alliance" class="cdb-treaty-alliance">'
        + '<option value="pelny"' + (state.allianceKind === 'pelny' ? ' selected' : '') + '>Sojusz wojskowy (wojna sojusznika = twoja)</option>'
        + '<option value="defensywny"' + (state.allianceKind === 'defensywny' ? ' selected' : '') + '>Sojusz obronny (atak na sojusznika)</option>'
        + '</select>';
      break;
    case '4': {
      const feeC = ctx.borderFeeCivil ?? 20;
      const feeM = ctx.borderFeeMilitary ?? 40;
      body = '<label>Traktat przemarszu</label>'
        + '<div class="cdb-row" style="display:flex;gap:8px;align-items:center;margin:6px 0">'
        + '<input type="checkbox" id="cdb-treaty-mil" class="cdb-treaty-mil"' + (state.borderMilitary ? ' checked' : '') + ' />'
        + '<label for="cdb-treaty-mil" style="margin:0">Wariant wojskowy (+ opłata)</label></div>'
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
    case '10':
      body = '<p class="cdb-sub">Zakończenie wojny — wymagana oferta PW (baza 500, modyfikator Relacji ±90%). '
        + 'Dołóż złoto lub surowce w koszyku poniżej.</p>';
      break;
    default:
      body = '<p class="cdb-sub">Brak dodatkowych warunków traktatu.</p>';
  }
  return '<div class="cdb-treaty">' + sub
    + '<div class="cdb-treaty-title">Warunki traktatu</div>'
    + body + '</div>';
}

function readTreatyStateFromDom(actionId: string, prev: TreatyFormState): TreatyFormState {
  const state = { ...prev };
  if (actionId === '2') {
    const turns = parseInt((document.querySelector('.cdb-treaty-turns') as HTMLInputElement)?.value ?? '10', 10);
    state.turns = Math.max(1, Math.min(20, turns));
  } else if (actionId === '3') {
    const v = (document.querySelector('.cdb-treaty-alliance') as HTMLSelectElement)?.value;
    state.allianceKind = v === 'defensywny' ? 'defensywny' : 'pelny';
  } else if (actionId === '4') {
    state.borderMilitary = (document.querySelector('.cdb-treaty-mil') as HTMLInputElement)?.checked ?? false;
  } else if (actionId === '8') {
    const mode = (document.querySelector('.cdb-treaty-trib-mode') as HTMLSelectElement)?.value;
    state.tributeMode = mode === 'offer' ? 'offer' : 'demand';
    state.goldPerTurn = parseInt((document.querySelector('.cdb-treaty-gpt') as HTMLInputElement)?.value ?? '10', 10);
    state.tributeTurns = parseInt((document.querySelector('.cdb-treaty-trib-turns') as HTMLInputElement)?.value ?? '0', 10);
  } else if (actionId === '12') {
    state.goldPerTurn = parseInt((document.querySelector('.cdb-treaty-wasal-gpt') as HTMLInputElement)?.value ?? '10', 10);
  }
  return state;
}

function validateTreatyForm(actionId: string, state: TreatyFormState): BasketValidation {
  switch (actionId) {
    case '2':
      if (state.turns < 1 || state.turns > 20) {
        return { valid: false, reason: 'Czas paktu: od 1 do 20 tur' };
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
  }
  return { valid: true };
}

function treatySummaryHtml(
  action: AudienceAction,
  treatyState: TreatyFormState,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
  dealTurns: number,
  resourceTradeMode: 'once' | 'per_turn',
): string {
  const payload = buildTreatyPayload(
    action.id, treatyState, ctx, giveItems, receiveItems, dealTurns, resourceTradeMode,
  );
  const cywId = proposalActionIdFromPayload(payload) as ProposalActionId;
  const rel = ctx.relacjaTotal ?? 100;
  const { actionId: _aid, ...proposalFields } = payload;
  const sides = computePlayerAcceptanceSides(cywId, proposalFields as ProposalPayload, rel, false);
  const bil = bilateralTreatyDisplayPw(sides.my, sides.their);
  const myPw = sideDisplayOfferPw(sides.my, bil);
  const theirPw = sideDisplayOfferPw(sides.their, bil);
  const basketGivePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns) ?? 0;
  const basketReceivePn = sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns) ?? 0;

  let html = '';
  if (cywId === 'pokoj' && (sides.my.treatyEffectivePn ?? sides.their.treatyEffectivePn ?? 0) > 0) {
    const treatyPw = sides.my.treatyEffectivePn ?? sides.their.treatyEffectivePn ?? 0;
    html += renderPnBalancePanelForPeace(treatyPw, basketGivePn, basketReceivePn, rel, action.label);
  } else if ((bil != null && bil > 0) || myPw > 0 || theirPw > 0) {
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
  if (isCurrencyProposalForbiddenDuringWar(propActionId, currencyPayload, true)) {
    return { valid: false, reason: 'W wojnie pieniądze tylko w ugodzie pokojowej' };
  }
  if (mode === 'treaty') {
    const treatyVal = validateTreatyForm(actionId, treatyState ?? defaultTreatyState(actionId));
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
    if (giveItems.length === 0) {
      return { valid: false, reason: 'Dodaj co najmniej jedną pozycję do daru' };
    }
  } else {
    if (giveItems.length === 0) {
      return { valid: false, reason: 'Dodaj co najmniej jedną pozycję w „Co oddaję"' };
    }
    if (receiveItems.length === 0) {
      return { valid: false, reason: 'Dodaj co najmniej jedną pozycję w „Co dostaję"' };
    }
  }
  const givePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns);
  const receivePn = mode === 'trade' ? sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns) : 0;
  if (givePn == null || (mode === 'trade' && receivePn == null)) {
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
  if (actionId === '8' && tributeMode === 'offer') return 'trybut_oferta';
  if (actionId === '13' || mode === 'gift') return 'handel';
  if (actionId === '5') return 'umowa_handlowa';
  return 'handel';
}

function buildAddForm(side: 'give' | 'receive', ctx: NegotiationModalContext, mode: TradeBasketMode, actionId = '14', tributeMode?: 'demand' | 'offer'): string {
  if (mode === 'gift' && side === 'receive') return '';

  const prefix = side === 'give' ? 'give' : 'recv';
  const allowWarCurrency = !ctx.atWar
    || uiActionAllowsWarCurrency(actionId, mode, tributeMode);
  const availableTypes = (Object.keys(TYP_LABELS) as WartoscPozycjaTyp[])
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
  const defaultTyp = availableTypes[0] ?? 'zloto';

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

  const cities = side === 'give'
    ? (ctx.cityOptions ?? [])
    : (ctx.receiveCityOptions ?? ctx.cityOptions ?? []);
  const defaultCity = cities[0]?.id ?? '';
  const cityChips = cities.length > 0
    ? cities.map((c, i) =>
      buildChipBtn(
        'cdb-chip-city',
        c.id,
        prefix,
        i === 0,
        typChipIconHtml('zywnosc'),
        c.label,
      ),
    ).join('')
    : '<span class="cdb-sub">— brak miast (SILNIK) —</span>';

  const techs = ctx.techOptions ?? defaultTechOptions().map(t => ({ ...t, suggestedPrice: 0 }));
  const defaultTech = techs[0]?.id ?? '';
  const techChips = techs.map((t, i) =>
    buildChipBtn(
      'cdb-chip-tech',
      t.id,
      prefix,
      i === 0,
      typChipIconHtml('tech'),
      t.label,
    ),
  ).join('');

  const qtyResources = side === 'give'
    ? (ctx.giveQuantityResourceOptions ?? defaultQuantityResourceOptions())
    : (ctx.receiveQuantityResourceOptions ?? defaultQuantityResourceOptions());
  const pakiet = diplomacyHandelSurowcePakietWielkosc();
  const defaultResId = qtyResources[0]?.id ?? '';
  const qtyResChips = qtyResources.map((r, i) => {
    const label = resourceDisplayLabel(r.id);
    const short = label.length > 10 ? label.slice(0, 9) + '…' : label;
    return buildChipBtn(
      'cdb-chip-resqty',
      r.id,
      prefix,
      i === 0,
      typChipIconHtml('surowiec_ilosc', r.id),
      short,
      ' data-max="' + r.maxPakiety + '" title="' + esc(label) + ' ×' + pakiet + '"',
    );
  }).join('');
  const qtyResFirstMax = qtyResources[0]?.maxPakiety ?? 1;

  const zywnHint = diplomacyZywnoscNaPn();

  return (
    '<div class="cdb-add" data-side="' + prefix + '">'
    + '<input type="hidden" class="cdb-typ cdb-typ-hidden" data-side="' + prefix + '" value="' + defaultTyp + '" />'
    + '<div class="cdb-add-section">'
    + '<div class="cdb-add-section-title">Co dodajesz</div>'
    + '<div class="cdb-chip-grid cdb-typ-chips">' + typChips + '</div>'
    + '</div>'
    + '<div class="cdb-fields-extra visible" data-extra="' + prefix + '-qty">'
    + '<label>Ilość</label>'
    + qtyStepperHtml('cdb-qty', prefix, 10)
    + '</div>'
    + '<div class="cdb-fields-extra" data-extra="' + prefix + '-city">'
    + '<label>Miasto (spichlerz)</label>'
    + '<div class="cdb-chip-grid cdb-city-chips">' + cityChips + '</div>'
    + '<input type="hidden" class="cdb-city" data-side="' + prefix + '" value="' + esc(defaultCity) + '" />'
    + '<label>Ilość żywności <span style="color:#7a8494">(1 PW = ' + zywnHint + ')</span></label>'
    + qtyStepperHtml('cdb-food-qty', prefix, 10)
    + '</div>'
    + '<div class="cdb-fields-extra" data-extra="' + prefix + '-tech">'
    + '<label>Technologia</label>'
    + '<div class="cdb-chip-grid cdb-tech-chips">' + techChips + '</div>'
    + '<input type="hidden" class="cdb-tech" data-side="' + prefix + '" value="' + esc(defaultTech) + '" />'
    + '</div>'
    + '<div class="cdb-fields-extra" data-extra="' + prefix + '-resqty">'
    + '<label>Surowiec (pakiety ×' + pakiet + ')</label>'
    + '<div class="cdb-chip-grid cdb-resqty-chips">' + qtyResChips + '</div>'
    + '<input type="hidden" class="cdb-res-qty-sel" data-side="' + prefix + '" value="' + esc(defaultResId) + '" data-max="' + qtyResFirstMax + '" />'
    + '<label>Liczba pakietów</label>'
    + qtyStepperHtml('cdb-res-qty-num', prefix, 1, 1, qtyResFirstMax)
    + '</div>'
    + '<button type="button" class="dip-gold-btn cdb-add-btn" data-side="' + prefix + '">+ Dodaj propozycję</button>'
    + '</div>'
  );
}

function editableDealItemsHtml(
  items: BasketItem[],
  side: 'give' | 'receive',
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
): string {
  if (items.length === 0) return '<span class="da-deal-empty">—</span>';
  const fmtCtx: BasketItemFormatCtx = {
    perTurn: resourceTradeMode === 'per_turn',
    turns: dealTurns,
  };
  return items.map((item, idx) => (
    '<div class="cdb-deal-row" data-side="' + side + '" data-idx="' + idx + '">' +
      '<div class="da-deal-item">' + renderBasketItemValueHtml(item, fmtCtx) + '</div>' +
      '<button type="button" class="cdb-rm" data-side="' + side + '" data-idx="' + idx + '" title="Usuń">×</button>' +
    '</div>'
  )).join('');
}

function dealSideColumnHtml(
  head: string,
  colClass: string,
  items: BasketItem[],
  side: 'give' | 'receive',
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
): string {
  return (
    '<div class="da-deal-col ' + colClass + '">' +
      '<div class="da-deal-col-head">' + esc(head) + '</div>' +
      '<div class="da-deal-col-body" data-list="' + side + '">' +
        editableDealItemsHtml(items, side, resourceTradeMode, dealTurns) +
      '</div>' +
    '</div>'
  );
}

function tradeDealPreviewHtml(
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  resourceTradeMode: 'once' | 'per_turn',
  dealTurns: number,
): string {
  let html = '<div class="cdb-deal-preview"><div class="da-deal-table">';
  html += dealSideColumnHtml('Oferujemy', 'da-deal-col-we', giveItems, 'give', resourceTradeMode, dealTurns);
  html += dealSideColumnHtml('Oferują', 'da-deal-col-they', receiveItems, 'receive', resourceTradeMode, dealTurns);
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
  const rel = ctx.relacjaTotal ?? 0;
  const trustGained = ctx.trustPnGainedThisTurn ?? 0;
  const pnParams = diplomacyPnRelacjaParams();
  const maxTrust = pnParams.max_zaufanie_na_ture;

  const givePn = sumBasketPn(giveItems, ctx, 'give', resourceTradeMode, dealTurns);
  const receivePn = mode === 'trade'
    ? sumBasketPn(receiveItems, ctx, 'receive', resourceTradeMode, dealTurns)
    : 0;

  let html = '<div class="cdb-summary">';
  if (mode === 'trade') {
    html += renderPnBalancePanelFromBasket(givePn, receivePn, rel, 'Wymiana');
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

function readItemFromForm(side: 'give' | 'receive', box: Element, ctx: NegotiationModalContext): BasketItem | null {
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
      const cityId = (box.querySelector('.cdb-city[data-side="' + prefix + '"]') as HTMLInputElement)?.value;
      const qty = parseInt((box.querySelector('.cdb-food-qty[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? '0', 10);
      if (!cityId || qty <= 0) return null;
      return { typ, id: cityId, cityId, ilosc: qty };
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
      const qty = maxAttr > 0 ? Math.min(rawQty, maxAttr) : rawQty;
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
): void {
  const rel = ctx.relacjaTotal ?? 0;
  const progHandel = ctx.progHandelRelacja ?? PROG_HANDEL_REL;
  const progDar = ctx.progDarRelacja ?? diplomacyProgDarRelacja();

  let blocked = '';
  if (ctx.atWar && mode !== 'treaty' && !uiActionAllowsWarCurrency(action.id, mode, treatyState.tributeMode)) {
    blocked = '<div class="cdb-blocked">W wojnie zwykły handel i dar są niedostępne — użyj propozycji pokoju</div>';
  } else if (mode === 'trade' && rel < progHandel) {
    blocked = '<div class="cdb-blocked">Handel wymaga Relacji ≥ ' + progHandel + ' (obecnie: ' + rel + ')</div>';
  } else if (mode === 'gift' && rel < progDar) {
    blocked = '<div class="cdb-blocked">Dar wymaga Relacji ≥ ' + progDar + ' (obecnie: ' + rel + ')</div>';
  }

  const title = mode === 'gift' ? 'Prezent / dar' : action.label;
  const sub = mode === 'treaty'
    ? 'Ustal warunki traktatu — wymiana PW jest opcjonalna · partner: <strong>' + esc(ctx.civName) + '</strong>'
    : mode === 'gift'
      ? 'Oddajesz bez towaru w zamian · Rel ≥ ' + progDar
      : 'Wymiana dwustronna · Rel ≥ ' + progHandel + ' · partner: <strong>' + esc(ctx.civName) + '</strong>';

  const basketModeForForm: TradeBasketMode = mode === 'treaty' ? 'trade' : mode;
  const showReceiveCol = mode === 'trade' || mode === 'treaty';
  /** Traktat (NAP/sojusz/…) bez koszyka PN — nie pokazuj pustego stołu OFERUJEMY|OFERUJĄ. */
  const treatyBasketsEmpty = mode === 'treaty' && giveItems.length === 0 && receiveItems.length === 0;
  const showDealPreview = showReceiveCol && !blocked && !treatyBasketsEmpty;

  const giveCol =
    '<div class="cdb-col">' +
      '<div class="cdb-col-title">' + (mode === 'treaty' ? 'My oddajemy (opcjonalnie)' : 'Dodaj do oferty') + '</div>' +
      (blocked ? '' : buildAddForm('give', ctx, basketModeForForm, action.id, treatyState.tributeMode)) +
    '</div>';

  const recvCol = showReceiveCol
    ? '<div class="cdb-col">' +
        '<div class="cdb-col-title">' + (mode === 'treaty' ? 'Oni oddają (opcjonalnie)' : 'Dodaj do kontrpropozycji') + '</div>' +
        (blocked ? '' : buildAddForm('receive', ctx, basketModeForForm, action.id, treatyState.tributeMode)) +
      '</div>'
    : '';

  const dealPreview = showDealPreview
    ? tradeDealPreviewHtml(giveItems, receiveItems, resourceTradeMode, dealTurns)
    : (mode === 'gift' && !blocked
      ? '<div class="cdb-deal-preview"><div class="da-deal-table">' +
        dealSideColumnHtml('Co oddajesz', 'da-deal-col-we', giveItems, 'give', 'once', dealTurns) +
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
    ? 'Tryb „Co turę" i czas obowiązują po dodaniu surowca (pakiety) do koszyka.'
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

  const validation = validateBasketForm(
    mode, action.id, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode, !!blocked, treatyState,
  );
  const invalidHtml = !validation.valid && validation.reason
    ? '<div class="cdb-invalid">' + esc(validation.reason) + '</div>'
    : '';

  const treatyHtml = mode === 'treaty' ? treatySectionHtml(action.id, ctx, treatyState) : '';
  const basketOptIntro = mode === 'treaty' && !blocked
    ? '<div class="cdb-basket-opt"><div class="cdb-basket-opt-title">'
      + (treatyBasketsEmpty
        ? 'Opcjonalnie — dołóż wymianę PW (nie jest wymagana do zaproponowania traktatu)'
        : 'Dołóżona wymiana PW')
      + '</div>'
    : '';
  const basketOptClose = mode === 'treaty' && !blocked ? '</div>' : '';
  const summaryBlock = mode === 'treaty'
    ? treatySummaryHtml(action, treatyState, giveItems, receiveItems, ctx, dealTurns, resourceTradeMode)
    : summaryHtml(mode, giveItems, receiveItems, ctx, resourceTradeMode, dealTurns);

  const showWarThreat = !blocked && (mode === 'trade' || mode === 'treaty');
  const showBalanceBtn = !blocked && mode === 'trade' && receiveItems.length > 0;

  box.className = 'civ-diplo-basket' + (mode === 'gift' ? ' cdb-gift' : '');
  box.innerHTML =
    '<h3>' + esc(title) + '</h3>' +
    '<div class="cdb-sub">' + sub + '</div>' +
    blocked +
    treatyHtml +
    basketOptIntro +
    dealPreview +
    dealSettings +
    (blocked ? '' : '<div class="cdb-cols">' + giveCol + recvCol + '</div>') +
    basketOptClose +
    (blocked ? '' : summaryBlock) +
    (blocked ? '' : balanceButtonHtml(showBalanceBtn)) +
    (blocked ? '' : warThreatBlockHtml(warThreat, showWarThreat)) +
    invalidHtml +
    '<div class="cdb-btns">' +
      '<button type="button" class="dip-muted-btn cdb-cancel">Anuluj</button>' +
      '<button type="button" class="dip-gold-btn cdb-submit"' + (blocked || !validation.valid ? ' disabled' : '') + '>Zaproponuj</button>' +
    '</div>';
}

export interface TradeBasketInitial {
  giveItems?: readonly BasketItem[];
  receiveItems?: readonly BasketItem[];
  turns?: number;
  resourceTradeMode?: 'once' | 'per_turn';
  allianceKind?: 'defensywny' | 'pelny';
  borderMilitary?: boolean;
  goldPerTurn?: number;
  goldOnce?: number;
  tributeMode?: 'demand' | 'offer';
  tributeTurns?: number;
}

export function showTradeBasketModal(
  mode: TradeBasketMode,
  action: AudienceAction,
  ctx: NegotiationModalContext,
  onSubmit: (payload: NegotiationPayload) => void,
  onCancel: () => void,
  initial?: TradeBasketInitial,
): void {
  closeModal();
  ensureStyles();

  // Zaległość #1 (SZYBKA UMOWA) — koszyk może otwierać się WYPEŁNIONY propozycją
  // (computeQuickDealBasket), użytkownik dalej może edytować/usuwać pozycje normalnie.
  let giveItems: BasketItem[] = stripWithdrawnResourceAccessItems(initial?.giveItems ?? []);
  let receiveItems: BasketItem[] = stripWithdrawnResourceAccessItems(initial?.receiveItems ?? []);
  let dealTurns = initial?.turns != null ? Math.max(1, Math.min(20, initial.turns)) : 15;
  let resourceTradeMode: 'once' | 'per_turn' = initial?.resourceTradeMode ?? 'once';
  let warThreat = false;
  let treatyState = defaultTreatyState(action.id, initial);

  overlay = document.createElement('div');
  overlay.className = 'civ-diplo-basket-overlay';
  const box = document.createElement('div');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const onBasketEsc = (ev: KeyboardEvent): void => {
    if (ev.key !== 'Escape') return;
    ev.preventDefault();
    document.removeEventListener('keydown', onBasketEsc);
    closeModal();
    onCancel();
  };
  document.addEventListener('keydown', onBasketEsc);

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
    if (mode === 'treaty') treatyState = readTreatyStateFromDom(action.id, treatyState);
    renderBasket(box, mode, action, ctx, giveItems, receiveItems, dealTurns, resourceTradeMode, treatyState, warThreat);
    bindEvents();
  };

  const bindEvents = (): void => {
    const dismiss = (): void => {
      document.removeEventListener('keydown', onBasketEsc);
      closeModal();
      onCancel();
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

    box.querySelectorAll('.cdb-chip-city').forEach(btn => {
      btn.addEventListener('click', () => {
        selectChipInGroup(btn, 'cdb-chip-city', '.cdb-city');
      });
    });

    box.querySelectorAll('.cdb-chip-tech').forEach(btn => {
      btn.addEventListener('click', () => {
        selectChipInGroup(btn, 'cdb-chip-tech', '.cdb-tech');
      });
    });

    box.querySelectorAll('.cdb-chip-resqty').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side');
        selectChipInGroup(btn, 'cdb-chip-resqty', '.cdb-res-qty-sel', (_value, max) => {
          if (side && max != null) {
            const inp = box.querySelector('.cdb-res-qty-num[data-side="' + side + '"]') as HTMLInputElement | null;
            if (inp) {
              inp.max = String(max);
              if (parseInt(inp.value, 10) > max) inp.value = String(max);
            }
          }
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
          treatyInp.value = String(Math.max(1, Math.min(20, turns)));
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
      '.cdb-treaty-turns, .cdb-treaty-alliance, .cdb-treaty-mil, .cdb-treaty-trib-mode, .cdb-treaty-gpt, .cdb-treaty-trib-turns, .cdb-treaty-wasal-gpt',
    ).forEach(el => {
      el.addEventListener('change', () => refresh());
      el.addEventListener('input', () => refresh());
    });

    box.querySelectorAll('.cdb-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const side = btn.getAttribute('data-side') === 'recv' ? 'receive' : 'give';
        const item = readItemFromForm(side, box, ctx);
        if (!item) return;
        if (side === 'give') giveItems = [...giveItems, item];
        else receiveItems = [...receiveItems, item];
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
        refresh();
      });
    });

    box.querySelector('.cdb-submit')?.addEventListener('click', () => {
      const blocked = (mode === 'trade' && (ctx.relacjaTotal ?? 0) < (ctx.progHandelRelacja ?? PROG_HANDEL_REL))
        || (mode === 'gift' && (ctx.relacjaTotal ?? 0) < (ctx.progDarRelacja ?? diplomacyProgDarRelacja()));
      readDealTurnsFromDom();
      readResourceTradeModeFromDom();
      const warCb = box.querySelector('.cdb-war-threat-cb') as HTMLInputElement | null;
      if (warCb) warThreat = warCb.checked;
      if (mode === 'treaty') treatyState = readTreatyStateFromDom(action.id, treatyState);
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
      document.removeEventListener('keydown', onBasketEsc);
      onSubmit(payload);
    });
  };

  refresh();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.removeEventListener('keydown', onBasketEsc);
      closeModal();
      onCancel();
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

/** Akcje obsługiwane przez koszyk PN (handel + dar + traktaty z wymianą). R-DYP-STOL-A=C */
export const TRADE_BASKET_ACTION_IDS = new Set(['2', '3', '4', '8', '10', '12', '13', '14']);

export function getTradeBasketMode(actionId: string): TradeBasketMode {
  if (actionId === '13') return 'gift';
  if (actionId === '14') return 'trade';
  if (TRADE_BASKET_ACTION_IDS.has(actionId)) return 'treaty';
  return 'trade';
}

export function actionUsesTradeBasket(actionId: string): boolean {
  return TRADE_BASKET_ACTION_IDS.has(actionId);
}

/** Domyślny payload traktatu handlowego (szlaki) — D-DYPLO-KOSZYK-OD-RAZU. */
export function defaultSzlakiTreatyPayload(): NegotiationPayload {
  return { actionId: '5', turns: 20 };
}
