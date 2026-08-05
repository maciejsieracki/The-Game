/**
 * diplomacy-proposals.ts — ocena propozycji dyplomatycznych v1.1 (lane CYW).
 * SILNIK/UI wołają evaluateProposal; EKO tick osobno po akceptacji trybutu.
 */
import {
  aiDiplomacyStance,
  clampRelationForWar,
  diplomacyProposerStrengthEase,
  diplomacyAllianceStrengthAdjust,
  diplomacyAllianceMinZaufanie,
  diplomacyTreatyMinRelacja,
  getEffectiveDiplomacyParams,
  relationScore,
  type AIDiplomacyContext,
  type Relation,
} from './diplomacy';
import type { GameDifficulty } from './difficulty-cost';
import type { AIDiplomacyCommand } from './ai';
import {
  addTreaty,
  type ActiveDeal,
  type HandelDealPayload,
  type HandelSurowiecCyklicznyItem,
  type TreatyKind,
  normalizeTreatyKind,
} from './diplomacy-treaties';
import { RodzajTraktatu } from '../types/diplomacy';
import type { Player } from '../types/player';
import { TypCywilizacji } from '../types/player';
import {
  effectiveTreatyPnRequired,
  partnerTreatyPnRequired,
  pnDealAcceptedByAi,
  pnFromLegacyGold,
  pnGiftAllowed,
  proposalPnTurnsMultiplier,
  relationTotal,
  resolveProposalPn,
  type BasketItem,
  type ResolveProposalPnOptions,
} from './diplomacy-pn-engine';
import { diplomacyProgDarRelacja } from './diplomacy-value-catalog';
import {
  isCurrencyProposalForbiddenDuringWar,
} from './diplomacy-war-gates';
import acceptancePointsJson from '../../data/diplomacy-acceptance-points.json';
import {
  AI_TRADE_GOLD_MAX,
  AI_TRIBUTE_PEACE_MAX,
  capAiGoldOffer,
} from './diplomacy-economy';
import {
  aiOfferPwSurplusTolerance,
  aiOfferTargetsZeroBalance,
  aiProposalPlayerBenefitSurplus,
  trimProposalForZeroBalance,
} from './diplomacy-ai-offer-balance';

export { AI_TRADE_GOLD_MAX, AI_TRIBUTE_PEACE_MAX, capAiGoldOffer } from './diplomacy-economy';

// ---------------------------------------------------------------------------
// Typy propozycji (UI → SILNIK → CYW)
// ---------------------------------------------------------------------------

export type ProposalActionId =
  | 'nap'
  | 'sojusz_defensywny'
  | 'sojusz_pelny'
  | 'handel'
  /**
   * E6 (2026-07-23): alias traktatu szlaków — AI (`zaproponuj_umowe_handlowa`) i legacy save.
   * Oceniana w evaluateProposal jak `umowa_szlakow` (ten sam deal UmowaSzlakow).
   */
  | 'umowa_handlowa'
  /** HANDEL-SPLIT-Q1=B: traktat szlaków — gracz lub AI (bez koszyka PN). */
  | 'umowa_szlakow'
  | 'trybut_zadanie'
  | 'trybut_oferta'
  | 'granice'
  | 'tech'
  | 'namow_wojne'
  | 'ultimatum'
  | 'wasal'
  /** R-GRACZ-WCHLONIECIE: wchłonięcie miasta-państwa po wasalu (gracz→MP, v1). */
  | 'wchloniecie'
  /** Zakończenie wojny — stoł negocjacyjny, PN bazowe 500 (Maciej 2026-07-29). */
  | 'pokoj';

export interface ProposalPayload {
  /** NAP: 10–20 tur (terminowy); 0 lub brak po UI „bezterminowy” → wygasaTura null */
  turns?: number;
  goldPerTurn?: number;
  goldOnce?: number;
  resource?: string;
  amount?: number;
  /** Namów do wojny — cel */
  targetOwnerId?: number;
  borderMilitary?: boolean;
  /** Sojusz: defensywny vs pełny (Maciej 2026-07-29). */
  allianceKind?: 'defensywny' | 'pelny';
  techId?: string;
  /** Łapówka przy namówieniu (¤) */
  bribeGold?: number;
  /** Cena tech sprzedaży */
  techPrice?: number;
  /** Suma PN oddawana (koszyk / silnik) */
  givePn?: number;
  /** Suma PN oczekiwana od respondenta */
  receivePn?: number;
  /** Pozycje koszyka — oddaję */
  giveItems?: readonly BasketItem[];
  /** Pozycje koszyka — dostaję */
  receiveItems?: readonly BasketItem[];
  /** Czysty dar (prezent) bez towaru w zamian */
  isGift?: boolean;
  /**
   * HANDEL-SUROWCE-CYKL (2026-07-24): tryb wymiany surowca ilościowego
   * (`surowiec_ilosc` w giveItems/receiveItems). 'once' (domyślnie, brak pola)
   * = jednorazowy transfer natychmiast (istniejące zachowanie, oneShotTrade).
   * 'per_turn' = surowiec↔zapłata płynie CO TURĘ przez `turns` tur (deal
   * cykliczny, ActiveDeal.handelSurowiecCykliczny) — ownerId-agnostyczne,
   * działa identycznie gdy proponentem jest gracz LUB AI.
   */
  resourceTradeMode?: 'once' | 'per_turn';
  /** Ultimatum wojenne — odmowa respondenta = casus belli (wypowiedzenie wojny przez proponenta). */
  warThreat?: boolean;
}

export interface DiplomaticProposal {
  actionId: ProposalActionId;
  proposerOwnerId: number;
  responderOwnerId: number;
  payload: ProposalPayload;
}

/** Kontekst oceny — SILNIK dostarcza relację i siłę. */
export interface ProposalEvalContext {
  relation: Relation;
  stanWojny: boolean;
  turn: number;
  epoka?: number;
  /** Respekt proponującego (0–100) w oczach respondenta */
  proposerRespekt: number;
  /** Respekt respondenta (0–100) w oczach proponującego */
  responderRespekt: number;
  /** stosunek siły respondenta / proponenta (>1 = respondent silniejszy) */
  militaryRatio?: number;
  /** Frakcja siły respondenta 0..1 (jak decideAIDiplomacy respektWzgledny) */
  respektWzgledny?: number;
  ekspansjaPrzyGranicy?: boolean;
  /** Benchmark wartości handlu (fair value) */
  fairTradeValue?: number;
  techMinPrice?: number;
  /** Opcjonalnie pełne obiekty graczy dla aiDiplomacyStance */
  responderPlayer?: Player;
  proposerPlayer?: Player;
  isMinorCiv?: boolean;
  /** Miasto-państwo klastra — blokuje trybut (Maciej 2026-08-02). */
  proposerIsCityState?: boolean;
  responderIsCityState?: boolean;
  /** Ludność miast respondenta (suma) — koszt wchłonięcia */
  responderPopulation?: number;
  /** Ile tur trwa aktywny wasal (proposer=suzeren, responder=wasal); undefined = brak */
  wasalAgeTurns?: number;
  /** Istniejące traktaty — blokada duplikatów */
  activeDeals?: readonly ActiveDeal[];
  /** Poziom trudności gry — skaluje progi relacji/zaufania (Maciej 2026-07-21). */
  difficulty?: GameDifficulty;
  /** Globalna Wiarygodność proponenta (−100…+100) — Dźwignia 3 (WIARYGODNOSC §5). */
  proposerWiarygodnosc?: number;
  /** Globalna Wiarygodność respondenta (−100…+100) — Dźwignia 3 (opcjonalnie). */
  responderWiarygodnosc?: number;
}

export interface ProposalEvalResult {
  accepted: boolean;
  reason: string;
  /** Traktat do dodania (NAP, sojusz, trybut, wasal, granice) */
  deal?: ActiveDeal;
  /** Jednorazowy handel T3A — bez trwałego dealu */
  oneShotTrade?: boolean;
}

export interface PendingProposal {
  id: string;
  fromOwnerId: number;
  toOwnerId: number;
  actionId: ProposalActionId;
  payload: ProposalPayload;
  createdTurn: number;
  expiresTurn: number | null;
  source: 'ai' | 'player';
  aiPowod?: string;
}

const STUB_RESPONDER: Player = { typCywilizacji: TypCywilizacji.Grecy } as Player;
const STUB_PROPOSER: Player = { typCywilizacji: TypCywilizacji.Rzymianie } as Player;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function pairHasKind(
  deals: readonly ActiveDeal[] | undefined,
  a: number,
  b: number,
  rodzaj: TreatyKind,
): boolean {
  if (!deals?.length) return false;
  const p0 = Math.min(a, b);
  const p1 = Math.max(a, b);
  const k = normalizeTreatyKind(rodzaj);
  return deals.some(
    d => d.strony[0] === p0 && d.strony[1] === p1 && normalizeTreatyKind(d.rodzaj) === k,
  );
}

/** R-GRACZ-WCHLONIECIE: koszt jednorazowego wchłonięcia MP (¤). */
export function graczWchloniecieKosztZloto(
  population: number,
  p: ReturnType<typeof getEffectiveDiplomacyParams> = getEffectiveDiplomacyParams('normal'),
): number {
  return Math.max(
    p.graczWchloniecieKosztMin,
    p.graczWchloniecieKosztBaza + p.graczWchloniecieKosztPerLudnosc * Math.max(0, population),
  );
}

/** Aktywny wasalizacja: suzeren=`suzerenId`, wasal=`wasalId`. */
export function findWasalDeal(
  deals: readonly ActiveDeal[] | undefined,
  suzerenId: number,
  wasalId: number,
): ActiveDeal | undefined {
  if (!deals?.length) return undefined;
  const p0 = Math.min(suzerenId, wasalId);
  const p1 = Math.max(suzerenId, wasalId);
  return deals.find(d => {
    if (d.strony[0] !== p0 || d.strony[1] !== p1) return false;
    if (normalizeTreatyKind(d.rodzaj) !== RodzajTraktatu.Wasalizacja) return false;
    const econ = d.ekonomia;
    if (!econ) return true;
    return econ.receiverOwnerId === suzerenId && econ.payerOwnerId === wasalId;
  });
}

export function wasalAgeTurns(deal: ActiveDeal | undefined, turn: number): number | undefined {
  if (!deal || deal.zawartaTura == null) return undefined;
  return Math.max(0, turn - deal.zawartaTura);
}

export function makeDealId(
  prefix: string,
  turn: number,
  a: number,
  b: number,
): string {
  const [p0, p1] = a < b ? [a, b] : [b, a];
  return `${prefix}-${p0}-${p1}-t${turn}`;
}

function stanceForEval(ctx: ProposalEvalContext): ReturnType<typeof aiDiplomacyStance> {
  const responder = ctx.responderPlayer ?? STUB_RESPONDER;
  const proposer = ctx.proposerPlayer ?? STUB_PROPOSER;
  const proposerMil = ctx.militaryRatio ?? 1;
  // aiDiplomacyStance oczekuje stosunku M_AI / M_rozmówcy (nie proponent/respondent).
  const responderMilRatio = proposerMil > 0 ? 1 / proposerMil : 99;
  const dipCtx: AIDiplomacyContext = {
    isMinorCiv: ctx.isMinorCiv ?? false,
    militaryRatio: responderMilRatio,
    currentTurn: ctx.turn,
    turnsAtWar: ctx.stanWojny ? 5 : 0,
  };
  return aiDiplomacyStance(responder, proposer, ctx.relation, dipCtx);
}

function buildDeal(
  rodzaj: TreatyKind,
  a: number,
  b: number,
  turn: number,
  wygasaTura: number | null,
  ekonomia?: ActiveDeal['ekonomia'],
  handelJednorazowy?: boolean,
  handelPayload?: HandelDealPayload,
  handelSurowiecCykliczny?: HandelSurowiecCyklicznyItem[],
): ActiveDeal {
  return {
    id: makeDealId(rodzaj, turn, a, b),
    rodzaj,
    strony: a < b ? [a, b] : [b, a],
    wygasaTura,
    zawartaTura: turn,
    ekonomia,
    handelJednorazowy,
    handelPayload,
    handelSurowiecCykliczny,
  };
}

/** SUROW-TERYT: trwały dostęp (złoże / surowiec_boolean) wycofany z handlu dyplomatycznego. */
const RESOURCE_ACCESS_TYPES = new Set<BasketItem['typ']>(['zloze', 'surowiec_boolean']);

export const RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON =
  'Handel dostępem do surowców nieaktualny — wycofany po polityce terytorialnej (SUROW-TERYT)';

/** Czy propozycja obejmuje trwały dostęp do surowców/złóż (nie jednorazowy PN). */
export function proposalHasResourceAccess(payload: {
  giveItems?: readonly BasketItem[];
  receiveItems?: readonly BasketItem[];
}): boolean {
  const items = [...(payload.giveItems ?? []), ...(payload.receiveItems ?? [])];
  return items.some(i => RESOURCE_ACCESS_TYPES.has(i.typ));
}

/** Usuwa wycofane pozycje dostępu z koszyka (bezpieczny filtr UI / quick-deal). */
export function stripWithdrawnResourceAccessItems(items: readonly BasketItem[]): BasketItem[] {
  return items.filter(i => !RESOURCE_ACCESS_TYPES.has(i.typ));
}

/** Czas trwałej umowy handlowej: 1–20 tur (Maciej 2026-07-21). */
export function clampDealTurns(turns: number | undefined, defaultTurns = 15): number {
  return clamp(turns ?? defaultTurns, 1, 20);
}

/** §9.1 WIAR-NAP-IMP: NAP terminowy (10–20 tur) lub bezterminowy (wygasaTura null). */
export function resolveNapDealExpiry(
  turn: number,
  payload: Pick<ProposalPayload, 'turns'>,
): { wygasaTura: number | null; label: string } {
  const raw = payload.turns;
  if (raw != null && raw <= 0) {
    return { wygasaTura: null, label: 'Pakt nieagresji (bezterminowy)' };
  }
  const turns = clamp(raw ?? 15, 10, 20);
  return { wygasaTura: turn + turns, label: `Pakt nieagresji na ${turns} tur` };
}

// ---------------------------------------------------------------------------
// C-DYP-STOL-Q1=B (2026-07-25): KOSZYK-TRAKTAT — „słodzik" dołożony do propozycji
// traktatowej (pakt/sojusz/granice/wasal/trybut) OBOK samego traktatu. Wycena =
// TA SAMA suma PN co koszyk handlu/daru (diplomacy-value-catalog przez
// resolveProposalPn z diplomacy-pn-engine) — brak nowej ekonomii. Netto =
// max(0, givePn − receivePn): jeśli respondent w payload.receiveItems też coś
// oddaje, słodzik netto się o tyle kurczy (symetria — respondent nie powinien
// tracić dodatkowo NA korzyść niższego progu akceptacji).
// ownerId-agnostyczne: proposerOwnerId/responderOwnerId w evaluateProposal to
// zwykłe liczby — ta sama ścieżka niezależnie od tego, kto proponuje (gracz/AI).
// ---------------------------------------------------------------------------

/** PLACEHOLDER (strojenie w playteście): 25 PN słodzika = 1 punkt „ease" progu. */
const SWEETENER_PN_PER_EASE_POINT = 25;
/** PLACEHOLDER (strojenie w playteście): sufit ease — złoto/dobra nie zastępują relacji całkowicie. */
const SWEETENER_EASE_MAX_POINTS = 20;

/** Wartość netto słodzika w PN (koszyk giveItems minus receiveItems, floor 0). */
export function sweetenerNetPn(payload: ProposalPayload, pnOpts?: ResolveProposalPnOptions): number {
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  return Math.max(0, givePn - receivePn);
}

/**
 * Punkty „ease" ze słodzika — obniżają progi akceptacji traktatu (Relacja/
 * Zaufanie/Respekt, w zależności od akcji), analogicznie do
 * diplomacyProposerStrengthEase (przewaga militarna/Respekt) w diplomacy.ts.
 * PLACEHOLDER: liniowe, sufit 20 punktów — strojenie właściciela w playteście.
 */
export function sweetenerEasePoints(payload: ProposalPayload, pnOpts?: ResolveProposalPnOptions): number {
  const netPn = sweetenerNetPn(payload, pnOpts);
  if (netPn <= 0) return 0;
  return Math.min(SWEETENER_EASE_MAX_POINTS, Math.floor(netPn / SWEETENER_PN_PER_EASE_POINT));
}

/**
 * HANDEL-SUROWCE-CYKL (2026-07-24): koszyk `surowiec_ilosc` (+ opcjonalna zapłata
 * zloto/praca po stronie przeciwnej) → przepływy CO TURĘ. `ilosc` na pozycji
 * `surowiec_ilosc` to PAKIETY/turę (ta sama jednostka co w trybie jednorazowym —
 * main.ts transferBasketItems mnoży przez diplomacyHandelSurowcePakietWielkosc()).
 * Obsługuje oba kierunki naraz (barter surowiec-za-surowiec) — zwykle jeden wpis.
 * ownerId-agnostyczne: proposerId/responderId mogą być gracz LUB dowolne AI.
 */
export function buildHandelSurowiecCykliczny(
  proposerId: number,
  responderId: number,
  giveItems: readonly BasketItem[] = [],
  receiveItems: readonly BasketItem[] = [],
): HandelSurowiecCyklicznyItem[] {
  const out: HandelSurowiecCyklicznyItem[] = [];
  const giveRes = giveItems.find(i => i.typ === 'surowiec_ilosc' && (i.ilosc ?? 0) > 0);
  const givePayment = giveItems.find(i => i.typ === 'zloto' || i.typ === 'praca');
  const recvRes = receiveItems.find(i => i.typ === 'surowiec_ilosc' && (i.ilosc ?? 0) > 0);
  const recvPayment = receiveItems.find(i => i.typ === 'zloto' || i.typ === 'praca');

  if (giveRes) {
    out.push({
      surowiecKey: giveRes.id,
      pakietyPerTura: Math.floor(giveRes.ilosc ?? 0),
      sellerOwnerId: proposerId,
      buyerOwnerId: responderId,
      zaplataTyp: recvPayment?.typ as 'zloto' | 'praca' | undefined,
      zaplataPerTura: recvPayment?.ilosc,
    });
  }
  if (recvRes) {
    out.push({
      surowiecKey: recvRes.id,
      pakietyPerTura: Math.floor(recvRes.ilosc ?? 0),
      sellerOwnerId: responderId,
      buyerOwnerId: proposerId,
      zaplataTyp: givePayment?.typ as 'zloto' | 'praca' | undefined,
      zaplataPerTura: givePayment?.ilosc,
    });
  }
  return out;
}

/** Etykieta UI traktatu przemarszu (Maciej 2026-07-29 — zamiast „granice"). */
export function marchTreatyLabel(borderMilitary?: boolean): string {
  return borderMilitary ? 'Traktat przemarszu (wojskowy)' : 'Traktat przemarszu (cywilny)';
}

function treatyBasePnFromConfig(actionId: string): number {
  const t = (acceptancePointsJson.traktaty as Record<string, { punkty?: number } | undefined>);
  return t[actionId]?.punkty ?? 0;
}

/** Relacja do progu PN traktatu — w wojnie z podłogą score (spójne z clampRelationForWar / UI). */
export function treatyEvalRelationTotal(rel: Relation): number {
  const clamped = rel.status === 'wojna' ? clampRelationForWar(rel) : rel;
  return relationTotal(clamped);
}

/**
 * Skuteczna oferta PN na pokój: propozycja pokoju = wymagane PN traktatu po stronie
 * proponenta (gracz @ Relacji, partner = baza) + słodzik netto z koszyka.
 */
export function peaceProposalOfferPn(
  givePn: number,
  receivePn: number,
  basePn: number,
  rel: Relation,
  proposerIsPlayer = false,
): { offerPn: number; required: number } {
  const relTotal = treatyEvalRelationTotal(rel);
  const required = proposerIsPlayer
    ? effectiveTreatyPnRequired(basePn, relTotal)
    : partnerTreatyPnRequired(basePn);
  const basketNet = Math.max(0, givePn - receivePn);
  return { offerPn: required + basketNet, required };
}

/**
 * Bramka PN traktatu @ Relacji (mod ±90%). Zwraca wynik odrzucenia lub null = OK.
 *
 * Pokój: propozycja pokoju liczy się jako PN traktatu @ Relacji (+ słodzik z koszyka).
 * Inne traktaty (NAP, sojusz…): próg Relacji jest główną bramką; koszyk to
 * słodzik / wymiana. Dawniej: jakikolwiek giveItems wymagał givePn ≥ pełne PN
 * traktatu (~200 przy NAP) — UI doliczało bazę NAP do obu stron (210=210,
 * bilans 0), a silnik odrzucał 10¤ vs 10¤. Maciej 2026-07-30.
 */
function treatyPnGate(
  actionId: string,
  payload: ProposalPayload,
  relation: Relation,
  pnOpts?: ResolveProposalPnOptions,
): ProposalEvalResult | null {
  const basePn = treatyBasePnFromConfig(actionId);
  if (basePn <= 0) return null;
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const proposerIsPlayer = (pnOpts?.proposerOwnerId ?? 0) === (pnOpts?.playerOwnerId ?? 0);
  const relTotal = treatyEvalRelationTotal(relation);

  if (actionId === 'pokoj') {
    const { offerPn, required } = peaceProposalOfferPn(givePn, receivePn, basePn, relation, proposerIsPlayer);
    if (offerPn < required) {
      return {
        accepted: false,
        reason: `Oferta za niska na pokój (wymagane ≥ ${required} PW @ Relacji, baza ${basePn})`,
      };
    }
    return null;
  }

  const hasBasket = givePn > 0 || (payload.giveItems?.length ?? 0) > 0;
  if (!hasBasket) return null;
  // Dwustronna wymiana przy traktacie — tylko fair trade koszyka (bez dublowania bazy NAP).
  if (receivePn > 0) {
    if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
      return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
    }
    return null;
  }
  // Jednostronny słodzik: nie wymagaj pełnego PN traktatu z koszyka — próg Relacji
  // (+ sweetenerEasePoints) wystarczy. Mały słodzik nie może psuć akceptacji.
  return null;
}

/**
 * Bramka chęci do handlu przy akceptacji oferty gracza.
 * willingnessTrade dotyczy inicjatywy AI (decideAIDiplomacy); przy ocenie propozycji
 * na stole — uczciwa oferta PW @ Relacji nie może paść na „Brak chęci do handlu",
 * a sam traktat handlowy bez koszyka wymaga tylko progów Relacji (Maciej 2026-08-02).
 */
/** Akcje z bilansem PW — gracz-proponent nie może dać partnerowi ujemnego netto. */
const PROPOSER_PW_FAIRNESS_ACTIONS: ReadonlySet<string> = new Set([
  'nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'pokoj', 'wasal',
  'handel', 'umowa_szlakow', 'umowa_handlowa',
]);

/**
 * Bramka bilateralnego netto PW (proponent vs respondent) — spójna z
 * computePlayerAcceptanceSides / incomingTradeNetBalancePw (R-PW-ACCEPT-OVERPAY-Q1=A).
 * Ujemne netto = respondent oddaje więcej niż proponent → AI jako respondent odrzuca.
 * pnDealAcceptedByAi @ wysokiej Relacji może przejść przy give < receive — ta bramka domyka lukę.
 */
function proposerUnfairToPartnerGate(
  actionId: string,
  payload: ProposalPayload,
  relation: Relation,
  pnOpts: ResolveProposalPnOptions,
): ProposalEvalResult | null {
  if (!PROPOSER_PW_FAIRNESS_ACTIONS.has(actionId)) return null;
  const proposerIsPlayer = (pnOpts.proposerOwnerId ?? 0) === (pnOpts.playerOwnerId ?? 0);
  if (!proposerIsPlayer) return null;
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const hasBasket = givePn > 0 || receivePn > 0
    || (payload.giveItems?.length ?? 0) > 0
    || (payload.receiveItems?.length ?? 0) > 0;
  const basePn = treatyBasePnFromConfig(actionId);
  if (basePn <= 0 && !hasBasket) return null;
  const relTotal = treatyEvalRelationTotal(relation);
  const playerTreaty = basePn > 0 ? effectiveTreatyPnRequired(basePn, relTotal) : 0;
  const partnerTreaty = basePn > 0 ? partnerTreatyPnRequired(basePn) : 0;
  const proposerDisplay = playerTreaty + givePn;
  const responderDisplay = partnerTreaty + receivePn;
  if (proposerDisplay < responderDisplay) {
    return {
      accepted: false,
      reason: `Przewaga u Ciebie — oferta nieuczciwa dla partnera (${responderDisplay - proposerDisplay} PW)`,
    };
  }
  if (receivePn > 0 && !pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
    return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
  }
  return null;
}

function tradeWillingnessBlocksAcceptance(
  stance: ReturnType<typeof aiDiplomacyStance>,
  params: ReturnType<typeof getEffectiveDiplomacyParams>,
  givePn: number,
  receivePn: number,
  relTotal: number,
  payload: ProposalPayload,
): boolean {
  if (stance.willingnessTrade >= params.progHandelWillingnessMin) return false;
  const hasBasket = givePn > 0 || receivePn > 0
    || (payload.giveItems?.length ?? 0) > 0
    || (payload.receiveItems?.length ?? 0) > 0;
  if (!hasBasket) return false;
  if (pnDealAcceptedByAi(givePn, receivePn, relTotal)) return false;
  return true;
}

/**
 * Ocena propozycji gracza (lub odwrotnej strony) przez AI/respondenta.
 * Pure function — bez mutacji stanu gry.
 */
export function evaluateProposal(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
): ProposalEvalResult {
  const { actionId, proposerOwnerId, responderOwnerId, payload } = proposal;
  const { relation, stanWojny } = ctx;
  const p = getEffectiveDiplomacyParams(ctx.difficulty ?? 'normal');
  const pnOpts: ResolveProposalPnOptions = {
    difficulty: ctx.difficulty ?? 'normal',
    proposerOwnerId,
    playerOwnerId: 0,
    ...proposalPnTurnsMultiplier(payload),
  };
  const score = relationScore(relation);
  const stance = stanceForEval(ctx);

  if (actionId === 'pokoj' && !stanWojny) {
    return { accepted: false, reason: 'Pokój — brak trwającej wojny' };
  }
  if (stanWojny && actionId !== 'trybut_oferta' && actionId !== 'ultimatum' && actionId !== 'pokoj') {
    return { accepted: false, reason: 'Trwa wojna — ta akcja jest niedostępna' };
  }
  if (stanWojny && isCurrencyProposalForbiddenDuringWar(actionId, payload, true)) {
    return { accepted: false, reason: 'W wojnie pieniądze tylko w ugodzie pokojowej' };
  }
  if (TRIBUTE_PROPOSAL_ACTIONS.has(actionId) && tributeBlockedForCityState(ctx)) {
    return { accepted: false, reason: CITY_STATE_TRIBUTE_BLOCK_REASON };
  }

  const unfairToPartner = proposerUnfairToPartnerGate(actionId, payload, relation, pnOpts);
  if (unfairToPartner) return unfairToPartner;

  const pnReject = treatyPnGate(actionId, payload, relation, pnOpts);
  if (pnReject) return pnReject;

  switch (actionId) {
    case 'nap': {
      if ((ctx.proposerWiarygodnosc ?? 0) < p.wiarygodnoscProgNapMin) {
        return {
          accepted: false,
          reason: `Wiarygodność zbyt niska na pakt (wymagana ≥ ${p.wiarygodnoscProgNapMin})`,
        };
      }
      // C-DYP-STOL-Q1=B: słodzik (giveItems/receiveItems w payload) obniża próg Relacji.
      const napEase = sweetenerEasePoints(payload, pnOpts);
      const napThreshold = Math.max(0, p.progNapRelacja - napEase);
      if (score < napThreshold) {
        return { accepted: false, reason: `Relacja zbyt niska na pakt (wymagana ≥ ${napThreshold})` };
      }
      if (ctx.ekspansjaPrzyGranicy) {
        return { accepted: false, reason: 'Ekspansja przy granicy — brak zaufania do paktu' };
      }
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, RodzajTraktatu.PaktNieagresji)) {
        return { accepted: false, reason: 'Pakt nieagresji już obowiązuje' };
      }
      const napExpiry = resolveNapDealExpiry(ctx.turn, payload);
      const deal = buildDeal(
        RodzajTraktatu.PaktNieagresji,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        napExpiry.wygasaTura,
      );
      return { accepted: true, reason: napExpiry.label, deal };
    }

    case 'sojusz_defensywny':
    case 'sojusz_pelny': {
      if ((ctx.proposerWiarygodnosc ?? 0) < p.wiarygodnoscProgSojuszMin) {
        return {
          accepted: false,
          reason: `Wiarygodność zbyt niska na sojusz (wymagana ≥ ${p.wiarygodnoscProgSojuszMin})`,
        };
      }
      const kind = actionId === 'sojusz_defensywny' ? 'sojusz_defensywny' : 'sojusz_pelny';
      const milRatio = ctx.militaryRatio ?? 1;
      const adj = diplomacyAllianceStrengthAdjust(
        milRatio,
        ctx.proposerRespekt,
        ctx.responderRespekt,
        p,
      );
      // C-DYP-STOL-Q1=B: słodzik obniża progi tak samo jak przewaga militarna/Respekt
      // (diplomacyProposerStrengthEase) — komponuje się z istniejącą ulgą, nie ją zastępuje.
      // diplomacyTreatyMinRelacja i tak nie zejdzie poniżej progUmowaMinRelacja (twarda podłoga).
      const sojuszEase = sweetenerEasePoints(payload, pnOpts);
      const minZ = Math.max(0, diplomacyAllianceMinZaufanie(adj, milRatio, p) - sojuszEase);
      const minScore = diplomacyTreatyMinRelacja(
        p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore - sojuszEase,
        p,
      );
      const minAlly = Math.max(0, p.progSojuszWillingnessMin - adj.ease.allyThresholdDelta + adj.penaltyAlly);

      if (adj.hegemonBlocksAlliance) {
        return {
          accepted: false,
          reason: 'Hegemon nie potrzebuje sojuszu — wola wobec słabszego to trybut lub wasalizacja',
        };
      }
      if (relation.zaufanie < minZ) {
        return { accepted: false, reason: `Zaufanie zbyt niskie (wymagane ≥ ${minZ})` };
      }
      if (score < minScore) {
        return { accepted: false, reason: `Relacja ogólna zbyt niska na sojusz (≥ ${minScore})` };
      }
      if (
        milRatio < p.progSojuszSlabyProponentMilRatio &&
        ctx.proposerRespekt <= ctx.responderRespekt &&
        score < p.progUmowaMinRelacja
      ) {
        return { accepted: false, reason: 'Za słaby proponent bez pełnej relacji — sojusz nierealny' };
      }
      if (stance.willingnessAlly < minAlly) {
        return { accepted: false, reason: 'Brak gotowości do sojuszu' };
      }
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, kind)) {
        return { accepted: false, reason: 'Sojusz tego typu już istnieje' };
      }
      const deal = buildDeal(kind, proposerOwnerId, responderOwnerId, ctx.turn, null);
      const label = kind === 'sojusz_defensywny' ? 'Sojusz obronny' : 'Sojusz wojskowy';
      return { accepted: true, reason: `${label} zawarty`, deal };
    }

    case 'trybut_zadanie': {
      const perTurn = payload.goldPerTurn ?? 0;
      if (perTurn < p.progTrybutMinGoldPerTurn) {
        return { accepted: false, reason: `Minimalny trybut to ${p.progTrybutMinGoldPerTurn} ¤/turę` };
      }
      // C-DYP-STOL-Q1=B: słodzik obniża próg Respektu wymaganego do żądania trybutu.
      const trybutEase = sweetenerEasePoints(payload, pnOpts);
      const trybutRespektThreshold = Math.max(0, p.progTrybutZadanieMinRespekt - trybutEase);
      if (ctx.proposerRespekt <= trybutRespektThreshold) {
        return {
          accepted: false,
          reason: `Żądanie trybutu wymaga Respekt > ${trybutRespektThreshold} (masz ${ctx.proposerRespekt})`,
        };
      }
      // Górny limit kwoty — skaluje się z Respektem proponenta (audyt #21, decyzja A5=A).
      const maxPerTurn = p.progTrybutZadanieMaxGoldBase
        + Math.max(0, ctx.proposerRespekt - p.progTrybutZadanieMinRespekt) * p.progTrybutZadanieMaxGoldPerRespekt;
      if (perTurn > maxPerTurn) {
        return {
          accepted: false,
          reason: `Żądanie trybutu przekracza limit przy tym Respekcie (max ${Math.round(maxPerTurn)} ¤/turę)`,
        };
      }
      // Guard duplikatu — bez tego trybut/wasalizacja stackuje się co turę (audyt #21).
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, RodzajTraktatu.Wasalizacja)) {
        return { accepted: false, reason: 'Trybut/wasalizacja z tym państwem już obowiązuje' };
      }
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        payload.turns != null ? ctx.turn + payload.turns : null,
        {
          payerOwnerId: responderOwnerId,
          receiverOwnerId: proposerOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: `Trybut ${perTurn} ¤/turę`, deal };
    }

    case 'pokoj': {
      const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
      const basePn = treatyBasePnFromConfig('pokoj');
      const proposerIsPlayer = proposerOwnerId === 0;
      const { offerPn, required } = peaceProposalOfferPn(givePn, receivePn, basePn, relation, proposerIsPlayer);
      if (offerPn < required) {
        return {
          accepted: false,
          reason: `Oferta za niska na pokój (wymagane ≥ ${required} PW @ Relacji)`,
        };
      }
      return { accepted: true, reason: 'Warunki pokoju spełnione', oneShotTrade: true };
    }

    case 'trybut_oferta': {
      const perTurn = payload.goldPerTurn ?? payload.goldOnce ?? 0;
      const threshold = p.progTrybutOfertaBaseGold + (ctx.epoka ?? 0) * p.progTrybutOfertaEpokaGold;
      const nearWar = (ctx.militaryRatio ?? 1) > p.progTrybutOfertaNearWarRatio
        || relation.zaufanie < p.progTrybutOfertaNearWarZaufanie;
      if (!nearWar && perTurn < threshold) {
        return { accepted: false, reason: 'Oferta trybutu zbyt niska' };
      }
      if (perTurn < p.progTrybutOfertaMinGold) {
        return { accepted: false, reason: `Minimalna oferta to ${p.progTrybutOfertaMinGold} ¤` };
      }
      if (payload.goldOnce != null && payload.goldOnce > 0) {
        return { accepted: true, reason: 'Jednorazowy trybut za pokój', oneShotTrade: true };
      }
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        payload.turns != null ? ctx.turn + payload.turns : null,
        {
          payerOwnerId: proposerOwnerId,
          receiverOwnerId: responderOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: `Oferta trybutu ${perTurn} ¤/turę przyjęta`, deal };
    }

    case 'handel': {
      const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
      const relTotal = relationTotal(relation);
      const isGift = payload.isGift === true
        || ((payload.giveItems?.length ?? 0) > 0 && !(payload.receiveItems?.length) && (payload.receivePn ?? 0) <= 0);

      if (isGift) {
        if (!pnGiftAllowed(relTotal, ctx.difficulty ?? 'normal')) {
          return {
            accepted: false,
            reason: `Relacja zbyt niska na dar (wymagane ≥ ${diplomacyProgDarRelacja(undefined, ctx.difficulty ?? 'normal')})`,
          };
        }
        if (givePn <= 0) {
          return { accepted: false, reason: 'Brak wartości w darze' };
        }
        return { accepted: true, reason: 'Dar przyjęty', oneShotTrade: true };
      }

      if (tradeWillingnessBlocksAcceptance(stance, p, givePn, receivePn, relTotal, payload)) {
        return { accepted: false, reason: 'Brak chęci do handlu' };
      }
      if (score < p.progHandelRelacja) {
        return { accepted: false, reason: `Relacja zbyt niska na handel (wymagane ≥ ${p.progHandelRelacja})` };
      }

      const hasPnPath = givePn > 0 || receivePn > 0 || payload.giveItems?.length || payload.receiveItems?.length;
      if (proposalHasResourceAccess(payload)) {
        return { accepted: false, reason: RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON };
      }

      // HANDEL-SUROWCE-CYKL (2026-07-24): tryb „Wymiana przez X tur" — surowiec_ilosc
      // (+ ewentualna zapłata zloto/praca) płynie CO TURĘ zamiast raz. ownerId-agnostyczne:
      // ta sama ścieżka niezależnie od tego, czy proponentem jest gracz czy AI (obie strony
      // oceniane tym samym pnDealAcceptedByAi — AI realnie może odrzucić ofertę gracza).
      const hasQuantityResourceItems =
        (payload.giveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false)
        || (payload.receiveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false);
      if (payload.resourceTradeMode === 'per_turn' && hasQuantityResourceItems) {
        if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
        }
        const turns = clampDealTurns(payload.turns);
        const cyklicznyItems = buildHandelSurowiecCykliczny(
          proposerOwnerId, responderOwnerId, payload.giveItems, payload.receiveItems,
        );
        if (!cyklicznyItems.length) {
          return { accepted: false, reason: 'Brak surowca do cyklicznej wymiany' };
        }
        const deal = buildDeal(
          RodzajTraktatu.UmowaWymiany,
          proposerOwnerId,
          responderOwnerId,
          ctx.turn,
          ctx.turn + turns,
          undefined,
          false,
          undefined,
          cyklicznyItems,
        );
        return {
          accepted: true,
          reason: `Umowa handlowa (surowiec co turę) na ${turns} tur`,
          deal,
        };
      }

      if (hasPnPath) {
        if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
        }
        return { accepted: true, reason: 'Wymiana PW zaakceptowana', oneShotTrade: true };
      }

      // Legacy: goldOnce → PN 1:1, strict fair (W4-A)
      const legacyGive = pnFromLegacyGold(payload.goldOnce ?? (payload.amount ?? 0) * 10);
      const legacyReceive = pnFromLegacyGold(ctx.fairTradeValue ?? legacyGive);
      if (legacyGive <= 0) {
        return { accepted: false, reason: 'Brak wartości w ofercie' };
      }
      if (!pnDealAcceptedByAi(legacyGive, legacyReceive, relTotal)) {
        return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
      }
      return { accepted: true, reason: 'Wymiana jednorazowa (T3A)', oneShotTrade: true };
    }

    case 'umowa_handlowa':
    case 'umowa_szlakow': {
      const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
      const relTotal = relationTotal(relation);
      if (tradeWillingnessBlocksAcceptance(stance, p, givePn, receivePn, relTotal, payload)) {
        return { accepted: false, reason: 'Brak chęci do handlu' };
      }
      if (score < p.progHandelRelacja) {
        return { accepted: false, reason: `Relacja zbyt niska na traktat handlowy (wymagane ≥ ${p.progHandelRelacja})` };
      }
      const hasItems = (payload.giveItems?.length ?? 0) > 0 || (payload.receiveItems?.length ?? 0) > 0;
      if (hasItems) {
        if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
        }
      }
      const wygasa = payload.turns != null ? ctx.turn + clampDealTurns(payload.turns) : null;
      const deal = buildDeal(
        RodzajTraktatu.UmowaSzlakow,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        wygasa,
      );
      return {
        accepted: true,
        reason: hasItems ? 'Traktat handlowy (ze słodzikiem) zawarty' : 'Traktat handlowy zawarty',
        deal,
      };
    }

    case 'namow_wojne': {
      if (relation.zaufanie < p.progNamowWojneZaufanie) {
        return { accepted: false, reason: `Zaufanie zbyt niskie (wymagane ≥ ${p.progNamowWojneZaufanie})` };
      }
      const epoka = ctx.epoka ?? 0;
      const minBribe = p.progNamowWojneBribeBase * (epoka + 1);
      const bribe = payload.bribeGold ?? 0;
      if (bribe < minBribe) {
        return { accepted: false, reason: `Łapówka zbyt mała (min. ${minBribe} ¤)` };
      }
      if (payload.targetOwnerId == null) {
        return { accepted: false, reason: 'Brak wskazanego wroga' };
      }
      return { accepted: true, reason: 'Zgoda na wypowiedzenie wojny wskazanemu wrogowi' };
    }

    case 'tech': {
      const techRelOk = score >= p.progHandelRelacja;
      const techZaufOk = relation.zaufanie >= p.progWymianaTechZaufanie;
      if (!techRelOk && !techZaufOk) {
        return {
          accepted: false,
          reason: `Relacja zbyt niska na wymianę tech (wymagana Relacja ≥ ${p.progHandelRelacja} i Zaufanie ≥ ${p.progWymianaTechZaufanie})`,
        };
      }
      if (!techRelOk) {
        return { accepted: false, reason: `Relacja zbyt niska na wymianę tech (wymagane ≥ ${p.progHandelRelacja})` };
      }
      if (!techZaufOk) {
        return { accepted: false, reason: `Zaufanie zbyt niskie na wymianę tech (wymagane ≥ ${p.progWymianaTechZaufanie})` };
      }
      const minPrice = ctx.techMinPrice ?? 50;
      const price = payload.techPrice ?? 0;
      if (price < minPrice) {
        return { accepted: false, reason: `Cena poniżej minimum (${minPrice} ¤)` };
      }
      if (!payload.techId) {
        return { accepted: false, reason: 'Brak technologii w ofercie' };
      }
      return { accepted: true, reason: 'Sprzedaż technologii zaakceptowana', oneShotTrade: true };
    }

    case 'granice': {
      // C-DYP-STOL-Q1=B: słodzik obniża oba progi (Relacja/Zaufanie) o tyle samo.
      const graniceEase = sweetenerEasePoints(payload, pnOpts);
      const graniceRelThreshold = Math.max(0, p.progGraniceRelacja - graniceEase);
      const graniceZaufThreshold = Math.max(0, p.progGraniceZaufanie - graniceEase);
      const granRelOk = score >= graniceRelThreshold;
      const granZaufOk = relation.zaufanie >= graniceZaufThreshold;
      if (!granRelOk && !granZaufOk) {
        return {
          accepted: false,
          reason: `Relacja zbyt niska na traktat przemarszu (wymagana Relacja ≥ ${graniceRelThreshold} i Zaufanie ≥ ${graniceZaufThreshold})`,
        };
      }
      if (!granRelOk) {
        return { accepted: false, reason: `Relacja zbyt niska na traktat przemarszu (wymagana ≥ ${graniceRelThreshold})` };
      }
      if (!granZaufOk) {
        return { accepted: false, reason: `Zaufanie zbyt niskie (wymagane ≥ ${graniceZaufThreshold})` };
      }
      if (payload.borderMilitary && ctx.proposerRespekt < p.progGraniceWojskoweRespekt) {
        return { accepted: false, reason: `Prawo wojskowe wymaga Respekt ≥ ${p.progGraniceWojskoweRespekt}` };
      }
      const rodzaj = payload.borderMilitary
        ? RodzajTraktatu.PrawoWojskowePrzemarszu
        : RodzajTraktatu.OtwartGranice;
      const deal = buildDeal(
        rodzaj,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        null,
      );
      return {
        accepted: true,
        reason: marchTreatyLabel(payload.borderMilitary),
        deal,
      };
    }

    case 'ultimatum': {
      const rw = ctx.militaryRatio ?? 1;
      if (rw < p.progUltimatumMilitaryRatio) {
        return { accepted: false, reason: 'Ultimatum wymaga wyraźnej przewagi militarnej' };
      }
      if (payload.goldOnce != null && payload.goldOnce >= p.progUltimatumMinGold) {
        return { accepted: true, reason: 'Warunki ultimatum spełnione', oneShotTrade: true };
      }
      return { accepted: false, reason: 'Ultimatum odrzucone — warunki zbyt surowe' };
    }

    case 'wasal': {
      // C-DYP-STOL-Q1=B: słodzik obniża próg Respektu wymaganego do wasalizacji.
      const wasalEase = sweetenerEasePoints(payload, pnOpts);
      const wasalRespektThreshold = Math.max(0, p.progWasalizacjaRespekt - wasalEase);
      if (ctx.proposerRespekt < wasalRespektThreshold) {
        return { accepted: false, reason: `Wasalizacja wymaga Respekt ≥ ${wasalRespektThreshold}` };
      }
      const perTurn = payload.goldPerTurn ?? p.progWasalDefaultGoldPerTurn;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        null,
        {
          payerOwnerId: responderOwnerId,
          receiverOwnerId: proposerOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: 'Wasalizacja zaakceptowana', deal };
    }

    case 'wchloniecie': {
      if (!ctx.responderIsCityState) {
        return { accepted: false, reason: 'Wchłonięcie v1 tylko miasta-państwa' };
      }
      const wasalDeal = findWasalDeal(ctx.activeDeals, proposerOwnerId, responderOwnerId);
      if (!wasalDeal) {
        return { accepted: false, reason: 'Brak aktywnej wasalizacji z tym miastem-państwem' };
      }
      const age = ctx.wasalAgeTurns ?? wasalAgeTurns(wasalDeal, ctx.turn);
      if (age == null || age < p.graczWchlonieciePoWasaluTur) {
        const remain = p.graczWchlonieciePoWasaluTur - (age ?? 0);
        return {
          accepted: false,
          reason: `Wasal musi trwać ≥ ${p.graczWchlonieciePoWasaluTur} tur (pozostało ${remain})`,
        };
      }
      if (ctx.proposerRespekt < p.progWchloniecieRespekt) {
        return {
          accepted: false,
          reason: `Wchłonięcie wymaga Respekt ≥ ${p.progWchloniecieRespekt}`,
        };
      }
      // Q3A: zgoda wasala — Relacja ≥ 60 (środek pasma Przyjazny, consent gate).
      const WCHLONIECIE_CONSENT_REL = 60;
      if (score < WCHLONIECIE_CONSENT_REL) {
        return { accepted: false, reason: 'Wasal odmawia wchłonięcia — zbyt niska Relacja' };
      }
      const pop = ctx.responderPopulation ?? 0;
      const koszt = graczWchloniecieKosztZloto(pop, p);
      const goldOnce = payload.goldOnce ?? 0;
      if (goldOnce < koszt) {
        return {
          accepted: false,
          reason: `Wchłonięcie wymaga jednorazowej opłaty ≥ ${koszt} ¤`,
        };
      }
      return { accepted: true, reason: `Wchłonięcie zaakceptowane (${koszt} ¤)` };
    }

    default:
      return { accepted: false, reason: 'Nieznana akcja dyplomatyczna' };
  }
}

/** Po akceptacji — dodaj deal do tablicy (helper dla SILNIK). */
export function applyAcceptedProposal(
  deals: ActiveDeal[],
  result: ProposalEvalResult,
): ActiveDeal[] {
  if (!result.accepted || !result.deal) return deals;
  return addTreaty(deals, result.deal);
}

/** @deprecated alias — użyj AI_TRADE_GOLD_MAX */
export const AI_TRADE_GOLD_ONCE = AI_TRADE_GOLD_MAX;
const AI_TRIBUTE_PER_TURN = 15;

/** Wzbogaca komendę AI o kwoty ze skarbca; null gdy brak środków na gold-only. */
export function enrichAiCommandWithTreasury(
  cmd: AIDiplomacyCommand,
  treasuryBalance: number,
): AIDiplomacyCommand | null {
  switch (cmd.type) {
    case 'zaproponuj_handel': {
      const goldOnce = cmd.goldOnce ?? capAiGoldOffer(treasuryBalance, AI_TRADE_GOLD_MAX);
      return goldOnce > 0 ? { ...cmd, goldOnce } : null;
    }
    case 'oferuj_trybut_za_pokoj': {
      const goldOnce = cmd.goldOnce ?? capAiGoldOffer(treasuryBalance, AI_TRIBUTE_PEACE_MAX);
      return goldOnce > 0 ? { ...cmd, goldOnce } : null;
    }
    default:
      return cmd;
  }
}

/**
 * Tekst propozycji dyplomatycznej AI dla gracza (UI / inbox).
 * cmd.powod pozostaje diagnostyką silnika — nie pokazuj w UI.
 */
export function formatAiDiplomacyPlayerMessage(cmd: AIDiplomacyCommand): string {
  switch (cmd.type) {
    case 'zaproponuj_handel':
      return `Proponujemy jednorazową wymianę: ${cmd.goldOnce ?? 0} ¤ na rzecz twojego państwa.`;
    case 'zaproponuj_umowe_handlowa':
      return cmd.sweetenerGold
        ? `Proponujemy stałą umowę handlową (szlaki handlowe) — w geście dobrej woli dokładamy ${cmd.sweetenerGold} ¤.`
        : 'Proponujemy stałą umowę handlową — otwiera i utrzymuje szlaki handlowe między naszymi miastami.';
    case 'zaproponuj_sojusz':
      return cmd.allianceKind === 'defensywny'
        ? 'Proponujemy sojusz obronny — wchodzimy do wojny tylko gdy któryś z nas jest atakowany.'
        : 'Proponujemy sojusz wojskowy — wspólna obrona i wsparcie militarnie.';
    case 'zaproponuj_pakt':
      return cmd.turns != null && cmd.turns <= 0
        ? 'Proponujemy bezterminowy pakt nieagresji — żadna strona nie zaatakuje drugiej.'
        : `Proponujemy pakt nieagresji na ${cmd.turns ?? 15} tur — żadna strona nie zaatakuje drugiej.`;
    case 'zaproponuj_pokoj':
      return 'Proponujemy zawarcie pokoju i zakończenie wojny.';
    case 'zadaj_trybut':
      return `Żądamy trybut: ${AI_TRIBUTE_PER_TURN} ¤ co turę na rzecz naszego państwa.`;
    case 'oferuj_trybut_za_pokoj':
      return `Oferujemy jednorazową zapłatę ${cmd.goldOnce ?? 0} ¤ w zamian za pokój.`;
    case 'wypowiedz_wojne':
      return 'Wypowiadamy wojnę — nasze wojska są gotowe do walki.';
    case 'zaproponuj_handel_surowiec': {
      const zaplataLabel = cmd.zaplataTyp === 'praca' ? 'Praca' : '¤';
      if (cmd.kierunek === 'zakup') {
        return `Kupię od ciebie ${cmd.label} — ${cmd.pakietyPerTura} pakiet(y)/turę`
          + ` za ${cmd.zaplataPerTura} ${zaplataLabel}/turę przez ${cmd.turns} tur.`;
      }
      return `Mamy nadwyżkę surowca ${cmd.label} — oferujemy ${cmd.pakietyPerTura} pakiet(y)/turę`
        + ` za ${cmd.zaplataPerTura} ${zaplataLabel}/turę przez ${cmd.turns} tur.`;
    }
    default:
      return 'Propozycja dyplomatyczna od tego państwa.';
  }
}

/** Konwersja komendy AI → propozycja oczekująca (banner audiencji). */
export function aiCommandToPendingProposal(
  cmd: AIDiplomacyCommand,
  fromOwnerId: number,
  toOwnerId: number,
  turn: number,
): PendingProposal | null {
  const base = {
    fromOwnerId,
    toOwnerId,
    createdTurn: turn,
    expiresTurn: turn + 5,
    source: 'ai' as const,
    aiPowod: formatAiDiplomacyPlayerMessage(cmd),
  };

  switch (cmd.type) {
    case 'zaproponuj_sojusz': {
      const allianceKind = cmd.allianceKind === 'defensywny' ? 'defensywny' : 'pelny';
      return {
        ...base,
        id: makeDealId('pending-sojusz', turn, fromOwnerId, toOwnerId),
        actionId: allianceKind === 'defensywny' ? 'sojusz_defensywny' : 'sojusz_pelny',
        payload: { allianceKind },
      };
    }
    case 'zaproponuj_pakt':
      return {
        ...base,
        id: makeDealId('pending-nap', turn, fromOwnerId, toOwnerId),
        actionId: 'nap',
        payload: { turns: cmd.turns ?? 15 },
      };
    case 'zaproponuj_pokoj':
      return {
        ...base,
        id: makeDealId('pending-pokoj', turn, fromOwnerId, toOwnerId),
        actionId: 'pokoj',
        payload: {},
      };
    case 'zaproponuj_handel': {
      const goldOnce = cmd.goldOnce ?? 0;
      if (goldOnce <= 0) return null;
      const goldBasket: BasketItem = { typ: 'zloto', id: 'zloto', ilosc: goldOnce };
      return {
        ...base,
        id: makeDealId('pending-handel', turn, fromOwnerId, toOwnerId),
        payload: {
          goldOnce,
          giveItems: [goldBasket],
          isGift: true,
        },
        actionId: 'handel',
      };
    }
    case 'zaproponuj_umowe_handlowa': {
      return {
        ...base,
        id: makeDealId('pending-umowahandlowa', turn, fromOwnerId, toOwnerId),
        actionId: 'umowa_handlowa',
        payload: cmd.sweetenerGold ? { goldOnce: cmd.sweetenerGold } : {},
      };
    }
    case 'zadaj_trybut':
      return {
        ...base,
        id: makeDealId('pending-trybut', turn, fromOwnerId, toOwnerId),
        actionId: 'trybut_zadanie',
        payload: { goldPerTurn: AI_TRIBUTE_PER_TURN },
      };
    case 'oferuj_trybut_za_pokoj': {
      const goldOnce = cmd.goldOnce ?? 0;
      if (goldOnce <= 0) return null;
      return {
        ...base,
        id: makeDealId('pending-trybut-oferta', turn, fromOwnerId, toOwnerId),
        actionId: 'trybut_oferta',
        payload: { goldOnce },
      };
    }
    case 'zaproponuj_handel_surowiec': {
      if (cmd.pakietyPerTura <= 0) return null;
      const isBuy = cmd.kierunek === 'zakup';
      return {
        ...base,
        id: makeDealId('pending-handelsurowiec', turn, fromOwnerId, toOwnerId),
        actionId: 'handel',
        payload: isBuy
          ? {
              giveItems: cmd.zaplataPerTura > 0
                ? [{ typ: cmd.zaplataTyp, id: cmd.zaplataTyp, ilosc: cmd.zaplataPerTura }]
                : undefined,
              receiveItems: [{ typ: 'surowiec_ilosc', id: cmd.surowiecKey, ilosc: cmd.pakietyPerTura }],
              resourceTradeMode: 'per_turn',
              turns: cmd.turns,
            }
          : {
              giveItems: [{ typ: 'surowiec_ilosc', id: cmd.surowiecKey, ilosc: cmd.pakietyPerTura }],
              receiveItems: cmd.zaplataPerTura > 0
                ? [{ typ: cmd.zaplataTyp, id: cmd.zaplataTyp, ilosc: cmd.zaplataPerTura }]
                : undefined,
              resourceTradeMode: 'per_turn',
              turns: cmd.turns,
            },
      };
    }
    default:
      return null;
  }
}

/** Gracz akceptuje propozycję AI — ocena odwrotna (gracz = responder). */
export function evaluatePendingFromAI(
  pending: PendingProposal,
  ctx: ProposalEvalContext,
): ProposalEvalResult {
  const proposal: DiplomaticProposal = {
    actionId: pending.actionId,
    proposerOwnerId: pending.fromOwnerId,
    responderOwnerId: pending.toOwnerId,
    payload: pending.payload,
  };
  return evaluateProposal(proposal, ctx);
}

/**
 * Akcje, dla których wybuch wojny między stronami unieważnia propozycję. Świadomie
 * POZA tym zbiorem: 'trybut_oferta' i 'ultimatum' — dotyczą WŁAŚNIE stanu
 * wojny/napięcia, więc jej wybuch ich nie gasi (odwrotnie — to ich kontekst).
 * 'namow_wojne' też poza zbiorem — nie wymaga pokoju między proponentem/respondentem.
 */
const NEGOTIATION_PEACE_REQUIRED: ReadonlySet<ProposalActionId> = new Set([
  'nap', 'sojusz_defensywny', 'sojusz_pelny', 'handel',
  'umowa_handlowa' as ProposalActionId, 'umowa_szlakow', 'granice', 'tech', 'wasal', 'wchloniecie', 'trybut_zadanie',
]);

/**
 * Gracz klika AKCEPTUJ na propozycji AI — bez ponownej oceny progów AI/respondenta.
 * Zwraca wynik gotowy do applyProposalOutcome (deal / oneShotTrade).
 *
 * C-DYP-Q1=A (2026-07-26): STÓŁ NEGOCJACYJNY woła tę funkcję dla KAŻDEGO wpisu, który
 * gracz ręcznie akceptuje — niezależnie od tego, czy rundę 1 zainicjował gracz, czy AI
 * (patrz negotiationToLegacyPending). Dlatego rozszerzona o WSZYSTKIE warianty
 * ProposalActionId (wcześniej tylko podzbiór realnie wysyłany przez decideAIDiplomacy) —
 * nowe gałęzie (nap/sojusz_defensywny/granice/tech/namow_wojne/ultimatum/wasal) kopiują
 * 1:1 budowę traktatu z odpowiadającej gałęzi `accepted` w evaluateProposal powyżej,
 * bez progów (gracz już się zgodził ręcznie — jak reszta tej funkcji).
 */
const PEACE_ACTIONS_DURING_WAR: ReadonlySet<ProposalActionId> = new Set([
  'pokoj', 'trybut_oferta', 'ultimatum',
]);

export function resolvePlayerAcceptsAiPending(
  pending: PendingProposal,
  turn: number,
  difficulty: GameDifficulty = 'normal',
  opts?: { atWar?: boolean },
): ProposalEvalResult {
  const { actionId, fromOwnerId, toOwnerId, payload } = pending;
  if (opts?.atWar === true) {
    if (isCurrencyProposalForbiddenDuringWar(actionId, payload, true)) {
      return { accepted: false, reason: 'W wojnie pieniądze tylko w ugodzie pokojowej' };
    }
    if (NEGOTIATION_PEACE_REQUIRED.has(actionId) && !PEACE_ACTIONS_DURING_WAR.has(actionId)) {
      return { accepted: false, reason: 'Wybuchła wojna — warunki straciły aktualność' };
    }
  }
  switch (actionId) {
    case 'nap': {
      const napExpiry = resolveNapDealExpiry(turn, payload);
      const deal = buildDeal(
        RodzajTraktatu.PaktNieagresji,
        fromOwnerId,
        toOwnerId,
        turn,
        napExpiry.wygasaTura,
      );
      return { accepted: true, reason: napExpiry.label, deal };
    }
    case 'sojusz_defensywny':
    case 'sojusz_pelny': {
      const deal = buildDeal(
        actionId,
        fromOwnerId,
        toOwnerId,
        turn,
        null,
      );
      const label = actionId === 'sojusz_defensywny' ? 'Sojusz obronny' : 'Sojusz wojskowy';
      return { accepted: true, reason: `${label} zawarty`, deal };
    }
    case 'pokoj':
      return { accepted: true, reason: 'Pokój zawarty', oneShotTrade: true };
    case 'granice': {
      const rodzaj = payload.borderMilitary
        ? RodzajTraktatu.PrawoWojskowePrzemarszu
        : RodzajTraktatu.OtwartGranice;
      const deal = buildDeal(rodzaj, fromOwnerId, toOwnerId, turn, null);
      return {
        accepted: true,
        reason: marchTreatyLabel(payload.borderMilitary),
        deal,
      };
    }
    case 'tech': {
      return { accepted: true, reason: 'Sprzedaż technologii zaakceptowana', oneShotTrade: true };
    }
    case 'namow_wojne': {
      return { accepted: true, reason: 'Zgoda na wypowiedzenie wojny wskazanemu wrogowi' };
    }
    case 'ultimatum': {
      return { accepted: true, reason: 'Warunki ultimatum spełnione', oneShotTrade: true };
    }
    case 'wasal': {
      const p = getEffectiveDiplomacyParams(difficulty);
      const perTurn = payload.goldPerTurn ?? p.progWasalDefaultGoldPerTurn;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        fromOwnerId,
        toOwnerId,
        turn,
        null,
        {
          payerOwnerId: toOwnerId,
          receiverOwnerId: fromOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: 'Wasalizacja zaakceptowana', deal };
    }
    case 'handel': {
      if (proposalHasResourceAccess(payload)) {
        return { accepted: false, reason: RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON };
      }
      // HANDEL-SUROWCE-CYKL (2026-07-24): AI zaproponowała cykliczny handel
      // surowcem (zaproponuj_handel_surowiec) — gracz akceptuje DOKŁADNIE tę ofertę
      // (AI już wyceniła ją fair @ katalog PN przy budowaniu propozycji, main.ts
      // pickResourceSurplusForOwnerPair), bez ponownej oceny pnDealAcceptedByAi.
      const hasQuantityResourceItems =
        (payload.giveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false)
        || (payload.receiveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false);
      if (payload.resourceTradeMode === 'per_turn' && hasQuantityResourceItems) {
        const turns = clampDealTurns(payload.turns);
        const cyklicznyItems = buildHandelSurowiecCykliczny(
          fromOwnerId, toOwnerId, payload.giveItems, payload.receiveItems,
        );
        if (!cyklicznyItems.length) {
          return { accepted: false, reason: 'Brak surowca do cyklicznej wymiany' };
        }
        const deal = buildDeal(
          RodzajTraktatu.UmowaWymiany,
          fromOwnerId,
          toOwnerId,
          turn,
          turn + turns,
          undefined,
          false,
          undefined,
          cyklicznyItems,
        );
        return { accepted: true, reason: `Umowa handlowa (surowiec co turę) na ${turns} tur`, deal };
      }
      if (payload.goldOnce != null && payload.goldOnce > 0) {
        return { accepted: true, reason: 'Wymiana jednorazowa (T3A)', oneShotTrade: true };
      }
      return { accepted: true, reason: 'Wymiana PW zaakceptowana', oneShotTrade: true };
    }
    case 'umowa_handlowa':
    case 'umowa_szlakow': {
      // E6 / HANDEL-SPLIT-Q1=B: gracz akceptuje propozycję traktatu szlaków od AI.
      const deal = buildDeal(
        RodzajTraktatu.UmowaSzlakow,
        fromOwnerId,
        toOwnerId,
        turn,
        payload.turns != null ? turn + clampDealTurns(payload.turns) : null,
      );
      return { accepted: true, reason: 'Traktat handlowy zawarty', deal };
    }
    case 'trybut_zadanie': {
      const perTurn = payload.goldPerTurn ?? AI_TRIBUTE_PER_TURN;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        fromOwnerId,
        toOwnerId,
        turn,
        payload.turns != null ? turn + payload.turns : null,
        {
          payerOwnerId: toOwnerId,
          receiverOwnerId: fromOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: `Trybut ${perTurn} ¤/turę`, deal };
    }
    case 'trybut_oferta': {
      if (payload.goldOnce != null && payload.goldOnce > 0) {
        return { accepted: true, reason: 'Jednorazowy trybut za pokój', oneShotTrade: true };
      }
      const perTurn = payload.goldPerTurn ?? 0;
      const deal = buildDeal(
        RodzajTraktatu.Wasalizacja,
        fromOwnerId,
        toOwnerId,
        turn,
        payload.turns != null ? turn + payload.turns : null,
        {
          payerOwnerId: fromOwnerId,
          receiverOwnerId: toOwnerId,
          pieniadzePerTura: perTurn,
        },
      );
      return { accepted: true, reason: `Oferta trybutu ${perTurn} ¤/turę przyjęta`, deal };
    }
    default:
      return { accepted: false, reason: 'Nieznana akcja dyplomatyczna' };
  }
}

// ---------------------------------------------------------------------------
// C-DYP-Q1=A (2026-07-26, Maciej): STÓŁ NEGOCJACYJNY — pełny stan „propozycja
// oczekuje" per para właścicieli, z kontrofertą. SILNIK (main.ts) trzyma tablicę
// PendingNegotiation[] (zapis/odczyt gry — meta.negotiationTable); ten moduł
// dostarcza WYŁĄCZNIE czyste funkcje:
//   - createNegotiation / applyCounterOffer — budowa i mutacja (czysta, zwraca kopię)
//     wpisu przez kolejne rundy;
//   - generateCounterOffer — 2. i 3. reakcja AI („składa kontrofertę"), NIE liczy
//     nowej wyceny — evaluateProposal (już wyżej w tym pliku) jest WYROCZNIĄ, szukamy
//     minimalnej zmiany jednego pola, która przełącza jej wynik na accepted;
//   - resolveNegotiationAsResponder — pełny dispatcher rundy z perspektywy AI
//     (jedyna zautomatyzowana decyzja; decyzje GRACZA są zawsze ręczne — UI);
//   - negotiationStillValid — RYZYKO ze zlecenia: świat mógł się zmienić między
//     propozycją a odpowiedzią (wojna/eliminacja) — wpis wygasa z czytelnym powodem
//     zamiast wykonać się na nieaktualnych warunkach;
//   - negotiationToLegacyPending — adapter do resolvePlayerAcceptsAiPending (wyżej),
//     żeby ręczna akceptacja gracza (KTÓRAKOLWIEK strona zainicjowała rundę 1) używała
//     JEDNEGO buildera traktatu zamiast duplikować konstrukcję deal.
//
// Role proposerOwnerId/responderOwnerId w PendingNegotiation są STAŁE od rundy 1
// (określają kierunek koszyka giveItems/receiveItems — "proposerOwnerId daje
// giveItems, dostaje receiveItems" — patrz ProposalPayload) i NIE zmieniają się przy
// kontrofertach — zmienia się tylko payload (liczby) oraz awaitingOwnerId/authorOwnerId
// (kto teraz odpowiada / kto ustawił bieżące warunki). evaluateProposal jest zawsze
// wołane z tymi STAŁYMI rolami — jego `accepted` to bramka „czy ta treść+kwota mieści
// się w progu inżynierskim tej pary", niezależna od tego, kto ostatnio ją zmienił
// (patrz przykład trybut_zadanie w raporcie zadania — próg jest o STAŁEJ stronie
// żądającej, nie o „aktualnym autorze").
// ---------------------------------------------------------------------------

/** Limit rund kontrofert w JEDNEJ negocjacji (Maciej 2026-07-26, C-DYP-Q1=A pkt 3). Runda 1 = pierwsza propozycja; każda kontroferta +1. Po osiągnięciu limitu — silnik dopuszcza już tylko Przyjmij/Odrzuć. */
export const NEGOTIATION_MAX_ROUNDS = 3;

/** Ile tur od ostatniej aktywności (propozycja / kontroferta) zanim wpis wygasa bez odpowiedzi drugiej strony. */
export const NEGOTIATION_EXPIRY_TURNS = 5;

/**
 * Akcje bez auto-kontroferty silnika (evaluateProposal nie ma sensownego pola do
 * skalującej poprawki jednym krokiem). Gracz wciąż może Przyjąć/Odrzucić/Kontruj ręcznie.
 */
const NEGOTIATION_NO_ENGINE_COUNTER: ReadonlySet<ProposalActionId> = new Set([
  // (pusto — umowa_handlowa / umowa_szlakow obsługiwane w evaluateProposal)
]);

export interface PendingNegotiation {
  id: string;
  /** STAŁE przez całą negocjację — patrz komentarz bloku wyżej. */
  proposerOwnerId: number;
  responderOwnerId: number;
  actionId: ProposalActionId;
  /** Warunki AKTUALNIE na stole — każda runda NADPISUJE poprzednie (nie kumuluje). */
  payload: ProposalPayload;
  /** 1 = pierwsza propozycja; +1 za każdą kontrofertę (limit NEGOTIATION_MAX_ROUNDS). */
  round: number;
  /** Kto MUSI teraz odpowiedzieć (Przyjmij / Odrzuć / Kontruj). */
  awaitingOwnerId: number;
  /** Kto ustawił BIEŻĄCE warunki (drugi z pary awaitingOwnerId). */
  authorOwnerId: number;
  createdTurn: number;
  lastActionTurn: number;
  expiresTurn: number;
  /** Kto zainicjował rundę 1 — UI (własne/przychodzące) + parytet AI/gracz (ta sama droga). */
  source: 'player' | 'ai';
}

function otherPartyOf(
  entry: Pick<PendingNegotiation, 'proposerOwnerId' | 'responderOwnerId'>,
  ownerId: number,
): number {
  return ownerId === entry.proposerOwnerId ? entry.responderOwnerId : entry.proposerOwnerId;
}

export function makeNegotiationId(
  actionId: ProposalActionId,
  turn: number,
  a: number,
  b: number,
  seq: number,
): string {
  const [p0, p1] = a < b ? [a, b] : [b, a];
  return `negot-${actionId}-${p0}-${p1}-t${turn}-${seq}`;
}

/** Czy para ma już aktywną propozycję danego typu na stole (oba kierunki). */
export function hasPendingNegotiationForPair(
  table: readonly PendingNegotiation[],
  ownerA: number,
  ownerB: number,
  actionId: ProposalActionId,
): boolean {
  return table.some(n =>
    n.actionId === actionId
    && ((n.proposerOwnerId === ownerA && n.responderOwnerId === ownerB)
      || (n.proposerOwnerId === ownerB && n.responderOwnerId === ownerA)),
  );
}

/** Własna propozycja gracza (proposer=0) oczekująca u partnera — bez duplikatu tego typu. */
export function findOwnOutgoingNegotiation(
  table: readonly PendingNegotiation[],
  partnerOwnerId: number,
  actionId: ProposalActionId,
): PendingNegotiation | undefined {
  return table.find(n =>
    n.proposerOwnerId === 0
    && n.responderOwnerId === partnerOwnerId
    && n.actionId === actionId,
  );
}

/** Tworzy nowy wpis (runda 1) z propozycji — respondent = ten, kto musi teraz odpowiedzieć. */
export function createNegotiation(
  proposal: DiplomaticProposal,
  turn: number,
  source: 'player' | 'ai',
  seq: number,
): PendingNegotiation {
  return {
    id: makeNegotiationId(proposal.actionId, turn, proposal.proposerOwnerId, proposal.responderOwnerId, seq),
    proposerOwnerId: proposal.proposerOwnerId,
    responderOwnerId: proposal.responderOwnerId,
    actionId: proposal.actionId,
    payload: proposal.payload,
    round: 1,
    awaitingOwnerId: proposal.responderOwnerId,
    authorOwnerId: proposal.proposerOwnerId,
    createdTurn: turn,
    lastActionTurn: turn,
    expiresTurn: turn + NEGOTIATION_EXPIRY_TURNS,
    source,
  };
}

export function negotiationAsProposal(entry: PendingNegotiation): DiplomaticProposal {
  return {
    actionId: entry.actionId,
    proposerOwnerId: entry.proposerOwnerId,
    responderOwnerId: entry.responderOwnerId,
    payload: entry.payload,
  };
}

/** Czy gracz może wysłać kontrofertę (limit rund negocjacji). */
export function canPlayerCounterNegotiation(entry: PendingNegotiation): boolean {
  return entry.round < NEGOTIATION_MAX_ROUNDS;
}

/** Czy silnik AI może wygenerować auto-kontrofertę (limit rund + ocena evaluateProposal). */
export function canCounterNegotiation(entry: PendingNegotiation): boolean {
  return canPlayerCounterNegotiation(entry) && !NEGOTIATION_NO_ENGINE_COUNTER.has(entry.actionId);
}

/** Nakłada kontrofertę (nowe warunki) — woła SILNIK zarówno dla ręcznej kontry gracza, jak i automatycznej AI (resolveNegotiationAsResponder). */
export function applyCounterOffer(
  entry: PendingNegotiation,
  newPayload: ProposalPayload,
  authorOwnerId: number,
  turn: number,
): PendingNegotiation {
  return {
    ...entry,
    payload: newPayload,
    round: entry.round + 1,
    authorOwnerId,
    awaitingOwnerId: otherPartyOf(entry, authorOwnerId),
    lastActionTurn: turn,
    expiresTurn: turn + NEGOTIATION_EXPIRY_TURNS,
  };
}

export interface NegotiationWorldCtx {
  turn: number;
  isAtWar: boolean;
  proposerEliminated: boolean;
  responderEliminated: boolean;
  /** Gdy któraś strona to miasto-państwo — trybut niedostępny. */
  proposerIsCityState?: boolean;
  responderIsCityState?: boolean;
}

/** Akcje trybutu — blokada u miast-państw + gaszenie przy wojnie (poza ofertą pokojową majorów). */
export const TRIBUTE_PROPOSAL_ACTIONS: ReadonlySet<ProposalActionId> = new Set([
  'trybut_zadanie',
  'trybut_oferta',
]);

const CITY_STATE_TRIBUTE_BLOCK_REASON = 'Trybut niedostępny u miasta-państwa';

function tributeBlockedForCityState(ctx: ProposalEvalContext): boolean {
  return ctx.proposerIsCityState === true || ctx.responderIsCityState === true;
}

export interface NegotiationValidity {
  valid: boolean;
  reason?: string;
}

/**
 * RYZYKO ze zlecenia (2026-07-26): świat mógł się zmienić między złożeniem a
 * odpowiedzią (wybuchła wojna, zginęła strona/miasto stolica → eliminacja, zerwano
 * traktat) — wpis WYGASA z czytelnym komunikatem zamiast wykonać się na nieaktualnych
 * warunkach. SILNIK (main.ts) dostarcza world ctx PER WPIS (per parę) — nie ma tu
 * dostępu do stanu gry (moduł pozostaje pure/bez importu main.ts).
 */
export function negotiationStillValid(
  entry: PendingNegotiation,
  world: NegotiationWorldCtx,
): NegotiationValidity {
  if (world.proposerEliminated || world.responderEliminated) {
    return { valid: false, reason: 'Jedna ze stron została wyeliminowana z gry — propozycja wygasła' };
  }
  if (world.turn > entry.expiresTurn) {
    return { valid: false, reason: 'Propozycja wygasła — brak odpowiedzi w terminie' };
  }
  if (
    TRIBUTE_PROPOSAL_ACTIONS.has(entry.actionId)
    && (world.proposerIsCityState || world.responderIsCityState)
  ) {
    return { valid: false, reason: CITY_STATE_TRIBUTE_BLOCK_REASON };
  }
  if (world.isAtWar && NEGOTIATION_PEACE_REQUIRED.has(entry.actionId)) {
    return { valid: false, reason: 'Wybuchła wojna — warunki straciły aktualność' };
  }
  if (world.isAtWar && entry.actionId === 'trybut_oferta'
    && (world.proposerIsCityState || world.responderIsCityState)) {
    return { valid: false, reason: 'Wybuchła wojna — warunki straciły aktualność' };
  }
  return { valid: true };
}

// --- Generator kontroferty (2. i 3. reakcja AI) -----------------------------

/** Jeden „krok" słodzika = SWEETENER_PN_PER_EASE_POINT (ta sama stawka co sweetenerEasePoints wyżej — brak nowego cennika). */
const NEGOTIATION_SWEETENER_STEP_GOLD = SWEETENER_PN_PER_EASE_POINT;
/** Sufit prób — tyle samo punktów ease ile sweetenerEasePoints dopuszcza maksymalnie. */
const NEGOTIATION_SWEETENER_MAX_STEPS = SWEETENER_EASE_MAX_POINTS;
/** Krok dopłaty/obniżki pieniężnej (trybut/tech/łapówka/ultimatum/handel) — ±20% na próbę. */
const NEGOTIATION_MONEY_STEP_PCT = 0.2;
/** Maks. prób na kierunek (± do 80% od bieżącej kwoty) zanim uznajemy impas. */
const NEGOTIATION_MONEY_MAX_STEPS = 4;

const SWEETENER_COUNTER_ELIGIBLE: ReadonlySet<ProposalActionId> = new Set([
  'nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice', 'wasal', 'pokoj',
]);

function withExtraSweetenerGold(payload: ProposalPayload, extraGold: number): ProposalPayload {
  const items: BasketItem[] = [...(payload.giveItems ?? [])];
  const idx = items.findIndex(i => i.typ === 'zloto');
  if (idx >= 0) {
    items[idx] = { ...items[idx]!, ilosc: (items[idx]!.ilosc ?? 0) + extraGold };
  } else {
    items.push({ typ: 'zloto', id: 'zloto', ilosc: extraGold });
  }
  return { ...payload, giveItems: items };
}

type NegotiationMoneyField = 'goldPerTurn' | 'goldOnce' | 'techPrice' | 'bribeGold';

function getMoneyField(payload: ProposalPayload, field: NegotiationMoneyField): number {
  switch (field) {
    case 'goldPerTurn': return payload.goldPerTurn ?? 0;
    case 'goldOnce': return payload.goldOnce ?? 0;
    case 'techPrice': return payload.techPrice ?? 0;
    case 'bribeGold': return payload.bribeGold ?? 0;
  }
}

function withMoneyField(payload: ProposalPayload, field: NegotiationMoneyField, value: number): ProposalPayload {
  const v = Math.max(0, Math.round(value));
  switch (field) {
    case 'goldPerTurn': return { ...payload, goldPerTurn: v };
    case 'goldOnce': return { ...payload, goldOnce: v };
    case 'techPrice': return { ...payload, techPrice: v };
    case 'bribeGold': return { ...payload, bribeGold: v };
  }
}

export interface CounterOfferResult {
  payload: ProposalPayload;
  note: string;
}

/**
 * Generator kontroferty — Maciej 2026-07-26 (C-DYP-Q1=A pkt 2): „AI... składa
 * kontrofertę (ta sama treść z innymi warunkami — np. żąda dopłaty albo oferuje
 * mniej)". CELOWO nie liczy nowej wyceny: evaluateProposal (ISTNIEJĄCA ocena — patrz
 * sweetenerEasePoints/pnDealAcceptedByAi wyżej w tym pliku) jest tu WYROCZNIĄ —
 * funkcja szuka MINIMALNEJ zmiany JEDNEGO pola (słodzik / kwota), która przełącza jej
 * wynik na accepted=true. Zwraca null, gdy żadna próba w limicie kroków (stałe
 * NEGOTIATION_*_STEP/_MAX_STEPS wyżej) nie domyka propozycji — impas, silnik kończy
 * negocjację zwykłym odrzuceniem.
 *
 * Świadomie POZA zasięgiem (brak kontroferty, `null` od razu): koszyk wielo-pozycyjny PN w 'handel'/
 * 'zaproponuj_handel_surowiec' (giveItems/receiveItems niescalarne — patrz raport
 * zadania), 'namow_wojne' bez wskazanego celu.
 */
export function generateCounterOffer(
  proposal: DiplomaticProposal,
  ctx: ProposalEvalContext,
): CounterOfferResult | null {
  const { actionId, payload } = proposal;
  if (NEGOTIATION_NO_ENGINE_COUNTER.has(actionId)) return null;

  const difficulty = ctx.difficulty ?? 'normal';
  const relTotal = treatyEvalRelationTotal(ctx.relation);
  const pnOpts: ResolveProposalPnOptions = { difficulty };

  const tryPayload = (p: ProposalPayload): boolean =>
    evaluateProposal({ ...proposal, payload: p }, ctx).accepted;

  const finalizePayload = (p: ProposalPayload): ProposalPayload =>
    aiOfferTargetsZeroBalance(difficulty)
      ? trimProposalForZeroBalance(p, relTotal, difficulty, pnOpts)
      : p;

  // trybut_zadanie: dźwignia naturalna to SAMA kwota żądania (respondent „oferuje
  // mniej" / proponent „żąda dopłaty") — dwukierunkowe przeszukanie PRZED słodzikiem.
  if (actionId === 'trybut_zadanie') {
    const base = payload.goldPerTurn ?? 0;
    if (base > 0) {
      let bestDown: CounterOfferResult | null = null;
      let bestUp: CounterOfferResult | null = null;
      for (let step = 1; step <= NEGOTIATION_MONEY_MAX_STEPS; step++) {
        const down = withMoneyField(payload, 'goldPerTurn', base * (1 - NEGOTIATION_MONEY_STEP_PCT * step));
        if ((down.goldPerTurn ?? 0) > 0 && tryPayload(down)) {
          const note = `obniżone żądanie trybutu (${down.goldPerTurn} ¤/turę)`;
          if (!bestDown || (down.goldPerTurn ?? 0) > (bestDown.payload.goldPerTurn ?? 0)) {
            bestDown = { payload: down, note };
          }
        }
        const up = withMoneyField(payload, 'goldPerTurn', base * (1 + NEGOTIATION_MONEY_STEP_PCT * step));
        if (tryPayload(up)) {
          const note = `podniesione żądanie trybutu (${up.goldPerTurn} ¤/turę)`;
          if (!bestUp || (up.goldPerTurn ?? 0) < (bestUp.payload.goldPerTurn ?? 0)) {
            bestUp = { payload: up, note };
          }
        }
      }
      return bestDown ?? bestUp;
    }
    return null;
  }

  if (SWEETENER_COUNTER_ELIGIBLE.has(actionId)) {
    if (tryPayload(payload)) return null;
    for (let step = 1; step <= NEGOTIATION_SWEETENER_MAX_STEPS; step++) {
      const extra = step * NEGOTIATION_SWEETENER_STEP_GOLD;
      const candidate = withExtraSweetenerGold(payload, extra);
      if (tryPayload(candidate)) {
        return { payload: candidate, note: `+${extra} ¤ słodzika do umowy` };
      }
    }
    if (actionId === 'granice' && payload.borderMilitary) {
      const candidate: ProposalPayload = { ...payload, borderMilitary: false };
      if (tryPayload(candidate)) {
        return { payload: candidate, note: 'rezygnacja z prawa wojskowego (tylko cywilne)' };
      }
    }
    return null;
  }

  const moneyField: NegotiationMoneyField | null =
    actionId === 'trybut_oferta' ? (payload.goldPerTurn != null ? 'goldPerTurn' : 'goldOnce')
    : actionId === 'tech' ? 'techPrice'
    : actionId === 'namow_wojne' ? 'bribeGold'
    : actionId === 'ultimatum' ? 'goldOnce'
    : (actionId === 'handel' && !payload.giveItems?.length && !payload.receiveItems?.length) ? 'goldOnce'
    : null;

  if (moneyField) {
    const base = getMoneyField(payload, moneyField);
    if (base > 0) {
      const tolerance = aiOfferPwSurplusTolerance(difficulty);
      let bestUp: CounterOfferResult | null = null;
      let bestDown: CounterOfferResult | null = null;
      for (let step = 1; step <= NEGOTIATION_MONEY_MAX_STEPS; step++) {
        const up = withMoneyField(payload, moneyField, base * (1 + NEGOTIATION_MONEY_STEP_PCT * step));
        if (tryPayload(up)) {
          const surplus = aiProposalPlayerBenefitSurplus(up, relTotal, pnOpts);
          if (surplus <= tolerance) {
            if (!bestUp || surplus < aiProposalPlayerBenefitSurplus(bestUp.payload, relTotal, pnOpts)) {
              bestUp = { payload: finalizePayload(up), note: `podbita oferta (${getMoneyField(up, moneyField)})` };
            }
          } else if (!aiOfferTargetsZeroBalance(difficulty)) {
            bestUp = { payload: up, note: `podbita oferta (${getMoneyField(up, moneyField)})` };
          }
        }
        if (actionId === 'trybut_oferta') {
          const down = withMoneyField(payload, moneyField, base * (1 - NEGOTIATION_MONEY_STEP_PCT * step));
          if (getMoneyField(down, moneyField) > 0 && tryPayload(down)) {
            const surplus = aiProposalPlayerBenefitSurplus(down, relTotal, pnOpts);
            if (surplus <= tolerance) {
              if (!bestDown || surplus < aiProposalPlayerBenefitSurplus(bestDown.payload, relTotal, pnOpts)) {
                bestDown = {
                  payload: finalizePayload(down),
                  note: `obniżona oferta (${getMoneyField(down, moneyField)})`,
                };
              }
            }
          }
        }
      }
      return bestUp ?? bestDown;
    }
  }

  return null;
}

export type NegotiationRoundOutcome =
  | { kind: 'accepted'; result: ProposalEvalResult }
  | { kind: 'rejected'; reason: string }
  | { kind: 'countered'; entry: PendingNegotiation; note: string };

/**
 * Rozstrzyga rundę z perspektywy AI — JEDYNA zautomatyzowana decyzja silnika (decyzje
 * GRACZA są zawsze ręczne, main.ts nie woła tej funkcji dla wpisów
 * awaitingOwnerId=gracz). Role proposerOwnerId/responderOwnerId brane ZAWSZE z entry
 * (stałe od rundy 1 — patrz komentarz bloku wyżej), niezależnie od tego, czy bieżącym
 * autorem warunków (authorOwnerId) jest ta sama, czy odwrotna strona.
 */
export function resolveNegotiationAsResponder(
  entry: PendingNegotiation,
  ctx: ProposalEvalContext,
  turn: number,
): NegotiationRoundOutcome {
  const proposal = negotiationAsProposal(entry);
  const result = evaluateProposal(proposal, ctx);
  if (result.accepted) return { kind: 'accepted', result };
  if (canCounterNegotiation(entry)) {
    const counter = generateCounterOffer(proposal, ctx);
    if (counter) {
      const nextEntry = applyCounterOffer(entry, counter.payload, entry.awaitingOwnerId, turn);
      return { kind: 'countered', entry: nextEntry, note: counter.note };
    }
  }
  return { kind: 'rejected', reason: result.reason };
}

/**
 * Adapter PendingNegotiation → (istniejący) PendingProposal — żeby ręczna akceptacja
 * gracza (KTÓRAKOLWIEK strona zainicjowała rundę 1) mogła użyć JEDNEGO buildera
 * traktatu (resolvePlayerAcceptsAiPending, wyżej w tym pliku) zamiast duplikować
 * konstrukcję deal po raz trzeci.
 */
export function negotiationToLegacyPending(entry: PendingNegotiation): PendingProposal {
  return {
    id: entry.id,
    fromOwnerId: entry.proposerOwnerId,
    toOwnerId: entry.responderOwnerId,
    actionId: entry.actionId,
    payload: entry.payload,
    createdTurn: entry.createdTurn,
    expiresTurn: entry.expiresTurn,
    source: entry.source,
  };
}
