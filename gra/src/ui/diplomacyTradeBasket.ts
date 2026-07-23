/**
 * diplomacyTradeBasket.ts — koszyk handlu / daru (PN) v1.0 (lane UI, P4).
 * Import katalogu PN z lane D; callback przez NegotiationPayload → audiencja.
 */
import type { AudienceAction } from './diplomacyAudience';
import type { NegotiationModalContext, NegotiationPayload } from './diplomacyNegotiationModal';
import type { BasketItem } from '../game/diplomacy-pn-engine';
import type { TempoGry } from '../game/tech-tempo';
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
  type WartoscPozycjaTyp,
} from '../game/diplomacy-value-catalog';
import { HANDEL_ZLOZE_CENA_BAZA } from '../game/diplomacy-deposit-trade';
import unitsJson from '../../data/units.json';
import techJson from '../../data/tech.json';
import { DIPLO_1E_SHARED_CSS, ensureDiploBrandScope } from './diploUiSkin';
import { brandIconSvg } from './icons/brandAssets';

export type TradeBasketMode = 'trade' | 'gift';

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
};

const PROG_HANDEL_REL = 100;

function resolveTempo(ctx: NegotiationModalContext): TempoGry | number {
  return ctx.tempoGry ?? 'standardowa';
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
  display:flex;align-items:center;justify-content:center;padding:12px;}
.civ-diplo-basket{background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;max-width:760px;width:100%;max-height:92vh;overflow:auto;
  color:#e8e0c8;font:14px 'Segoe UI',Tahoma,sans-serif;}
.civ-diplo-basket h3{margin:0 0 6px;font-family:Georgia,serif;font-size:1.05em;color:#e8d88a;}
.civ-diplo-basket .cdb-sub{font-size:0.75em;color:#8a8070;margin-bottom:10px;line-height:1.45;}
.civ-diplo-basket .cdb-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.civ-diplo-basket.cdb-gift .cdb-cols{grid-template-columns:1fr;}
.civ-diplo-basket .cdb-col{border:1px solid rgba(232,216,138,.2);border-radius:8px;padding:10px;}
.civ-diplo-basket .cdb-col-title{font-size:0.78em;color:#e8d88a;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;}
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
.civ-diplo-basket .cdb-duration{margin-top:10px;padding:10px;border-radius:8px;
  border:1px solid rgba(232,216,138,.22);background:rgba(24,30,40,0.55);}
.civ-diplo-basket .cdb-duration label{margin-top:0;}
.civ-diplo-basket .cdb-fields-extra{display:none;}
.civ-diplo-basket .cdb-fields-extra.visible{display:block;}
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
    label: id + ' (' + pn + ' PN)',
  }));
}

function basketHasResourceAccess(...lists: ReadonlyArray<readonly BasketItem[]>): boolean {
  for (const items of lists) {
    if (items.some(i => i.typ === 'zloze' || i.typ === 'surowiec_boolean')) return true;
  }
  return false;
}

function dealDurationHtml(turns: number, visible: boolean): string {
  if (!visible) return '';
  return (
    '<div class="cdb-duration">' +
      '<label for="cdb-deal-turns">Czas umowy (tur, max 20)</label>' +
      '<input type="number" id="cdb-deal-turns" class="cdb-deal-turns" value="' + turns + '" min="1" max="20" />' +
      '<p class="cdb-sub">Dostęp do surowców trwa przez wybrany czas. Po wygaśnięciu umowa wymaga odnowienia (re-negocjacji).</p>' +
    '</div>'
  );
}

function itemLabel(item: BasketItem, ctx: NegotiationModalContext): string {
  const typLabel = TYP_LABELS[item.typ] ?? item.typ;
  switch (item.typ) {
    case 'zloto':
    case 'praca':
      return typLabel + ': ' + (item.ilosc ?? 0);
    case 'zywnosc': {
      const city = ctx.cityOptions?.find(c => c.id === item.cityId);
      return typLabel + ' — ' + (city?.label ?? item.cityId ?? '?') + ': ' + (item.ilosc ?? 0);
    }
    case 'zloze':
      return typLabel + ': ' + item.id;
    case 'tech':
      return typLabel + ': ' + item.id;
    case 'jednostka':
      return typLabel + ': ' + item.id;
    case 'surowiec_boolean':
      return typLabel + ': ' + item.id;
    default:
      return typLabel;
  }
}

function itemPn(item: BasketItem, ctx: NegotiationModalContext): number | null {
  return diplomacySumPn(toPnItems([item], ctx));
}

function buildAddForm(side: 'give' | 'receive', ctx: NegotiationModalContext, mode: TradeBasketMode): string {
  if (mode === 'gift' && side === 'receive') return '';

  const prefix = side === 'give' ? 'give' : 'recv';
  const typOpts = (Object.keys(TYP_LABELS) as WartoscPozycjaTyp[])
    .filter(t => {
      // TODO(A1 — audyt #1): pozycja "jednostka" ukryta do czasu, gdy transfer
      // faktycznie zdejmuje WSKAZANĄ jednostkę dawcy (wymaga unitOptions ograniczonych
      // do posiadanych jednostek w getNegotiationContext). Patrz też defensywne
      // odrzucenie w main.ts transferBasketItems (case 'jednostka').
      if (t === 'jednostka') return false;
      if (mode === 'gift') return true;
      if (t === 'tech' && side === 'receive') {
        const rel = ctx.relacjaTotal ?? 0;
        return rel >= (ctx.progHandelRelacja ?? PROG_HANDEL_REL);
      }
      return true;
    })
    .map(t => '<option value="' + t + '">' + esc(TYP_LABELS[t]) + '</option>')
    .join('');

  const cities = ctx.cityOptions ?? [];
  const citySel = cities.length > 0
    ? cities.map(c => '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>').join('')
    : '<option value="">— brak miast (SILNIK) —</option>';

  const zloze = ctx.zlozeOptions ?? defaultZlozeOptions();
  const zlozeSel = zloze.map(z => '<option value="' + esc(z.id) + '">' + esc(z.label) + '</option>').join('');

  const techs = ctx.techOptions ?? defaultTechOptions().map(t => ({ ...t, suggestedPrice: 0 }));
  const techSel = techs.map(t => '<option value="' + esc(t.id) + '">' + esc(t.label) + '</option>').join('');

  const units = ctx.unitOptions ?? defaultUnitOptions();
  const unitSel = units.map(u => '<option value="' + esc(u.id) + '">' + esc(u.label) + '</option>').join('');

  const resources = ctx.resourceOptions ?? defaultResourceOptions();
  const resSel = resources.map(r => '<option value="' + esc(r.id) + '">' + esc(r.label) + '</option>').join('');

  const zywnHint = diplomacyZywnoscNaPn();

  return (
    '<div class="cdb-add" data-side="' + prefix + '">' +
      '<label>Typ pozycji</label>' +
      '<select class="cdb-typ" data-side="' + prefix + '">' + typOpts + '</select>' +
      '<div class="cdb-fields-extra visible" data-extra="' + prefix + '-qty">' +
        '<label>Ilość</label><input type="number" class="cdb-qty" data-side="' + prefix + '" value="10" min="1" />' +
      '</div>' +
      '<div class="cdb-fields-extra" data-extra="' + prefix + '-city">' +
        '<label>Miasto (spichlerz)</label><select class="cdb-city" data-side="' + prefix + '">' + citySel + '</select>' +
        '<label>Ilość żywności <span style="color:#7a8494">(1 PN = ' + zywnHint + ')</span></label>' +
        '<input type="number" class="cdb-food-qty" data-side="' + prefix + '" value="10" min="1" />' +
      '</div>' +
      '<div class="cdb-fields-extra" data-extra="' + prefix + '-zloze">' +
        '<label>Złoże</label><select class="cdb-zloze" data-side="' + prefix + '">' + zlozeSel + '</select>' +
      '</div>' +
      '<div class="cdb-fields-extra" data-extra="' + prefix + '-tech">' +
        '<label>Technologia</label><select class="cdb-tech" data-side="' + prefix + '">' + techSel + '</select>' +
      '</div>' +
      '<div class="cdb-fields-extra" data-extra="' + prefix + '-unit">' +
        '<label>Jednostka</label><select class="cdb-unit" data-side="' + prefix + '">' + unitSel + '</select>' +
      '</div>' +
      '<div class="cdb-fields-extra" data-extra="' + prefix + '-res">' +
        '<label>Surowiec</label><select class="cdb-res-bool" data-side="' + prefix + '">' + resSel + '</select>' +
      '</div>' +
      '<button type="button" class="dip-gold-btn cdb-add-btn" data-side="' + prefix + '">+ Dodaj pozycję</button>' +
    '</div>'
  );
}

function itemsListHtml(items: BasketItem[], ctx: NegotiationModalContext, side: 'give' | 'receive'): string {
  if (items.length === 0) {
    return '<div style="color:#7a8494;font-size:0.72em;padding:4px 0">Brak pozycji</div>';
  }
  return items.map((item, idx) => {
    const pn = itemPn(item, ctx);
    const pnStr = pn != null ? pn + ' PN' : '? PN';
    return (
      '<div class="cdb-item" data-side="' + side + '" data-idx="' + idx + '">' +
        '<span>' + esc(itemLabel(item, ctx)) + '</span>' +
        '<span class="cdb-item-pn">' + pnStr + '</span>' +
        '<button type="button" class="cdb-rm" data-side="' + side + '" data-idx="' + idx + '" title="Usuń">×</button>' +
      '</div>'
    );
  }).join('');
}

function summaryHtml(
  mode: TradeBasketMode,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  ctx: NegotiationModalContext,
): string {
  const rel = ctx.relacjaTotal ?? 0;
  const trustGained = ctx.trustPnGainedThisTurn ?? 0;
  const pnParams = diplomacyPnRelacjaParams();
  const maxTrust = pnParams.max_zaufanie_na_ture;

  const givePn = diplomacySumPn(toPnItems(giveItems, ctx));
  const receivePn = mode === 'trade'
    ? diplomacySumPn(toPnItems(receiveItems, ctx))
    : 0;

  let html = '<div class="cdb-summary">';

  if (mode === 'trade') {
    html += '<div>SUMA oddaję: <b>' + (givePn ?? '—') + ' PN</b> · SUMA dostaję: <b>' + (receivePn ?? '—') + ' PN</b></div>';
    if (givePn != null && receivePn != null) {
      const fairMin = diplomacyFairGivePn(receivePn, rel);
      html += '<div>Fair min (Rel ' + rel + '): <b>' + fairMin + ' PN</b></div>';
      const preview = diplomacyTradeTrustFromDeal(givePn, receivePn, rel, trustGained);
      html += '<div>Nadmiar: <b>' + preview.surplusPn + ' PN</b>';
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
      const oneShot: string[] = [];
      if (preview.deltaZaufanie > 0) oneShot.push('+' + preview.deltaZaufanie + ' Zaufania');
      const perTurn: string[] = [];
      if (dobraWola.active) perTurn.push('+' + dobraWola.zaufaniePerTura + ' Zaufania/turę × ' + dobraWola.tur + ' tur');
      if (basketHasResourceAccess(giveItems, receiveItems)) {
        perTurn.push('+' + diplomacyHandelZaufaniePerTura() + ' Zaufania/turę (trwa umowa handlowa)');
      }
      html += '<div class="cdb-split">' +
        '<div>Jednorazowo: <b>' + (oneShot.length > 0 ? oneShot.join(', ') : '—') + '</b></div>' +
        '<div>Co turę: <b>' + (perTurn.length > 0 ? perTurn.join(', ') : '—') + '</b></div>' +
      '</div>';

      let verdict: string;
      let verdictCls: string;
      if (givePn < fairMin) {
        verdict = 'poniżej progu — ryzyko odrzucenia przez partnera';
        verdictCls = 'bad';
      } else if (preview.surplusPn > 0) {
        verdict = 'korzystna — nadwyżka ' + preview.surplusPn + ' PN przekłada się na Zaufanie';
        verdictCls = 'good';
      } else {
        verdict = 'zrównoważona — dokładnie fair min przy tej Relacji';
        verdictCls = 'neutral';
      }
      html += '<div class="cdb-verdict cdb-verdict-' + verdictCls + '">Werdykt: ' + esc(verdict) + '</div>';
    } else {
      html += '<div class="cdb-warn">' + brandIconSvg('chip-warning', 14) + ' Nieznana wartość PN — sprawdź pozycje.</div>';
    }
  } else {
    html += '<div>SUMA daru: <b>' + (givePn ?? '—') + ' PN</b></div>';
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
  const typ = (box.querySelector('.cdb-typ[data-side="' + prefix + '"]') as HTMLSelectElement)?.value as WartoscPozycjaTyp;
  if (!typ) return null;

  switch (typ) {
    case 'zloto':
    case 'praca': {
      const qty = parseInt((box.querySelector('.cdb-qty[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? '0', 10);
      if (qty <= 0) return null;
      return { typ, id: typ, ilosc: qty };
    }
    case 'zywnosc': {
      const cityId = (box.querySelector('.cdb-city[data-side="' + prefix + '"]') as HTMLSelectElement)?.value;
      const qty = parseInt((box.querySelector('.cdb-food-qty[data-side="' + prefix + '"]') as HTMLInputElement)?.value ?? '0', 10);
      if (!cityId || qty <= 0) return null;
      return { typ, id: cityId, cityId, ilosc: qty };
    }
    case 'zloze': {
      const id = (box.querySelector('.cdb-zloze[data-side="' + prefix + '"]') as HTMLSelectElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'tech': {
      const id = (box.querySelector('.cdb-tech[data-side="' + prefix + '"]') as HTMLSelectElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'jednostka': {
      const id = (box.querySelector('.cdb-unit[data-side="' + prefix + '"]') as HTMLSelectElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    case 'surowiec_boolean': {
      const id = (box.querySelector('.cdb-res-bool[data-side="' + prefix + '"]') as HTMLSelectElement)?.value;
      if (!id) return null;
      return { typ, id };
    }
    default:
      return null;
  }
}

function updateTypFields(box: Element, side: 'give' | 'receive'): void {
  const prefix = side === 'give' ? 'give' : 'recv';
  const typ = (box.querySelector('.cdb-typ[data-side="' + prefix + '"]') as HTMLSelectElement)?.value ?? 'zloto';
  const extras = ['qty', 'city', 'zloze', 'tech', 'unit', 'res'];
  for (const ex of extras) {
    const el = box.querySelector('[data-extra="' + prefix + '-' + ex + '"]');
    if (el) el.classList.remove('visible');
  }
  const map: Record<string, string> = {
    zloto: 'qty', praca: 'qty', zywnosc: 'city', zloze: 'zloze',
    tech: 'tech', jednostka: 'unit', surowiec_boolean: 'res',
  };
  const show = map[typ];
  if (show) {
    const el = box.querySelector('[data-extra="' + prefix + '-' + show + '"]');
    if (el) el.classList.add('visible');
  }
}

function renderBasket(
  box: HTMLDivElement,
  mode: TradeBasketMode,
  action: AudienceAction,
  ctx: NegotiationModalContext,
  giveItems: BasketItem[],
  receiveItems: BasketItem[],
  dealTurns: number,
): void {
  const rel = ctx.relacjaTotal ?? 0;
  const progHandel = ctx.progHandelRelacja ?? PROG_HANDEL_REL;
  const progDar = ctx.progDarRelacja ?? diplomacyProgDarRelacja();

  let blocked = '';
  if (mode === 'trade' && rel < progHandel) {
    blocked = '<div class="cdb-blocked">Handel wymaga Relacji ≥ ' + progHandel + ' (obecnie: ' + rel + ')</div>';
  } else if (mode === 'gift' && rel < progDar) {
    blocked = '<div class="cdb-blocked">Dar wymaga Relacji ≥ ' + progDar + ' (obecnie: ' + rel + ')</div>';
  }

  const title = mode === 'gift' ? 'Prezent / dar' : action.label;
  const sub = mode === 'gift'
    ? 'Oddajesz bez towaru w zamian · Rel ≥ ' + progDar
    : 'Wymiana dwustronna · Rel ≥ ' + progHandel + ' · partner: <strong>' + esc(ctx.civName) + '</strong>';

  const giveCol =
    '<div class="cdb-col">' +
      '<div class="cdb-col-title">Co oddaję</div>' +
      '<div class="cdb-items" data-list="give">' + itemsListHtml(giveItems, ctx, 'give') + '</div>' +
      (blocked ? '' : buildAddForm('give', ctx, mode)) +
    '</div>';

  const recvCol = mode === 'trade'
    ? '<div class="cdb-col">' +
        '<div class="cdb-col-title">Co dostaję</div>' +
        '<div class="cdb-items" data-list="receive">' + itemsListHtml(receiveItems, ctx, 'receive') + '</div>' +
        (blocked ? '' : buildAddForm('receive', ctx, mode)) +
      '</div>'
    : '';

  const showDealDuration = mode === 'trade' && basketHasResourceAccess(giveItems, receiveItems);

  box.className = 'civ-diplo-basket' + (mode === 'gift' ? ' cdb-gift' : '');
  box.innerHTML =
    '<h3>' + esc(title) + '</h3>' +
    '<div class="cdb-sub">' + sub + '</div>' +
    blocked +
    (blocked ? '' : '<div class="cdb-cols">' + giveCol + recvCol + '</div>') +
    (blocked ? '' : dealDurationHtml(dealTurns, showDealDuration)) +
    (blocked ? '' : summaryHtml(mode, giveItems, receiveItems, ctx)) +
    '<div class="cdb-btns">' +
      '<button type="button" class="dip-muted-btn cdb-cancel">Anuluj</button>' +
      '<button type="button" class="dip-gold-btn cdb-submit"' + (blocked ? ' disabled' : '') + '>Zaproponuj</button>' +
    '</div>';
}

export function showTradeBasketModal(
  mode: TradeBasketMode,
  action: AudienceAction,
  ctx: NegotiationModalContext,
  onSubmit: (payload: NegotiationPayload) => void,
  onCancel: () => void,
): void {
  closeModal();
  ensureStyles();

  let giveItems: BasketItem[] = [];
  let receiveItems: BasketItem[] = [];
  let dealTurns = 15;

  overlay = document.createElement('div');
  overlay.className = 'civ-diplo-basket-overlay';
  const box = document.createElement('div');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const readDealTurnsFromDom = (): void => {
    const inp = box.querySelector('.cdb-deal-turns') as HTMLInputElement | null;
    if (inp) dealTurns = Math.max(1, Math.min(20, parseInt(inp.value, 10) || 15));
  };

  const refresh = (): void => {
    readDealTurnsFromDom();
    renderBasket(box, mode, action, ctx, giveItems, receiveItems, dealTurns);
    bindEvents();
  };

  const bindEvents = (): void => {
    box.querySelector('.cdb-cancel')?.addEventListener('click', () => { closeModal(); onCancel(); });

    box.querySelectorAll('.cdb-typ').forEach(sel => {
      sel.addEventListener('change', () => {
        const side = sel.getAttribute('data-side') === 'recv' ? 'receive' : 'give';
        updateTypFields(box, side);
      });
    });

    for (const side of ['give', 'recv'] as const) {
      const uiSide = side === 'recv' ? 'receive' : 'give';
      updateTypFields(box, uiSide);
    }

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
      if (giveItems.length === 0 && (mode === 'gift' || receiveItems.length === 0)) return;
      const givePn = diplomacySumPn(toPnItems(giveItems, ctx));
      const receivePn = mode === 'trade'
        ? diplomacySumPn(toPnItems(receiveItems, ctx))
        : 0;
      if (givePn == null || (mode === 'trade' && receivePn == null)) return;

      readDealTurnsFromDom();
      const payload: NegotiationPayload = {
        actionId: '5',
        giveItems,
        receiveItems: mode === 'trade' ? receiveItems : undefined,
        givePn: givePn ?? undefined,
        receivePn: mode === 'trade' ? (receivePn ?? undefined) : 0,
        isGift: mode === 'gift',
      };
      if (mode === 'trade' && basketHasResourceAccess(giveItems, receiveItems)) {
        payload.turns = dealTurns;
      }
      closeModal();
      onSubmit(payload);
    });
  };

  refresh();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { closeModal(); onCancel(); }
  });
}

export function hideTradeBasketModal(): void {
  closeModal();
}

/** Akcje obsługiwane przez koszyk PN (handel + dar). */
export const TRADE_BASKET_ACTION_IDS = new Set(['5', '13']);

export function actionUsesTradeBasket(actionId: string): boolean {
  return TRADE_BASKET_ACTION_IDS.has(actionId);
}
