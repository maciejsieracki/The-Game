/**
 * diplomacy-proposals.ts — ocena propozycji dyplomatycznych v1.1 (lane CYW).
 * SILNIK/UI wołają evaluateProposal; EKO tick osobno po akceptacji trybutu.
 */
import {
  aiDiplomacyStance,
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
  pnDealAcceptedByAi,
  pnFromLegacyGold,
  pnGiftAllowed,
  relationTotal,
  resolveProposalPn,
  type BasketItem,
} from './diplomacy-pn-engine';
import { diplomacyProgDarRelacja } from './diplomacy-value-catalog';
import {
  AI_TRADE_GOLD_MAX,
  AI_TRIBUTE_PEACE_MAX,
  capAiGoldOffer,
} from './diplomacy-economy';

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
   * E6 (2026-07-23): STAŁA Umowa Handlowa (RodzajTraktatu.UmowaHandlowa)
   * proponowana PROAKTYWNIE przez AI (decideAIDiplomacy zaproponuj_umowe_handlowa),
   * bez pełnego koszyka PN gracza — prostsza siostra 'handel' (hasResourceAccess).
   * Wyłącznie ścieżka AI→gracz (aiCommandToPendingProposal / resolvePlayerAcceptsAiPending);
   * evaluateProposal jej nie ocenia (gracz nie inicjuje tej akcji z UI negocjacji).
   */
  | 'umowa_handlowa'
  | 'trybut_zadanie'
  | 'trybut_oferta'
  | 'granice'
  | 'tech'
  | 'namow_wojne'
  | 'ultimatum'
  | 'wasal';

export interface ProposalPayload {
  /** NAP / rozejm — 10–20 tur */
  turns?: number;
  goldPerTurn?: number;
  goldOnce?: number;
  resource?: string;
  amount?: number;
  /** Namów do wojny — cel */
  targetOwnerId?: number;
  borderMilitary?: boolean;
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
  /** Istniejące traktaty — blokada duplikatów */
  activeDeals?: readonly ActiveDeal[];
  /** Poziom trudności gry — skaluje progi relacji/zaufania (Maciej 2026-07-21). */
  difficulty?: GameDifficulty;
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

const RESOURCE_ACCESS_TYPES = new Set<BasketItem['typ']>(['zloze', 'surowiec_boolean']);

/** Czy propozycja obejmuje trwały dostęp do surowców/złóż (nie jednorazowy PN). */
export function proposalHasResourceAccess(payload: {
  giveItems?: readonly BasketItem[];
  receiveItems?: readonly BasketItem[];
}): boolean {
  const items = [...(payload.giveItems ?? []), ...(payload.receiveItems ?? [])];
  return items.some(i => RESOURCE_ACCESS_TYPES.has(i.typ));
}

/** Czas trwałej umowy handlowej: 1–20 tur (Maciej 2026-07-21). */
export function clampDealTurns(turns: number | undefined, defaultTurns = 15): number {
  return clamp(turns ?? defaultTurns, 1, 20);
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
  const score = relationScore(relation);
  const stance = stanceForEval(ctx);

  if (stanWojny && actionId !== 'trybut_oferta' && actionId !== 'ultimatum') {
    return { accepted: false, reason: 'Trwa wojna — ta akcja jest niedostępna' };
  }

  switch (actionId) {
    case 'nap': {
      if (score < p.progNapRelacja) {
        return { accepted: false, reason: `Relacja zbyt niska na pakt (wymagana ≥ ${p.progNapRelacja})` };
      }
      if (ctx.ekspansjaPrzyGranicy) {
        return { accepted: false, reason: 'Ekspansja przy granicy — brak zaufania do paktu' };
      }
      if (pairHasKind(ctx.activeDeals, proposerOwnerId, responderOwnerId, RodzajTraktatu.PaktNieagresji)) {
        return { accepted: false, reason: 'Pakt nieagresji już obowiązuje' };
      }
      const turns = clamp(payload.turns ?? 15, 10, 20);
      const deal = buildDeal(
        RodzajTraktatu.PaktNieagresji,
        proposerOwnerId,
        responderOwnerId,
        ctx.turn,
        ctx.turn + turns,
      );
      return { accepted: true, reason: `Pakt nieagresji na ${turns} tur`, deal };
    }

    case 'sojusz_defensywny':
    case 'sojusz_pelny': {
      const kind = actionId === 'sojusz_defensywny' ? 'sojusz_defensywny' : 'sojusz_pelny';
      const milRatio = ctx.militaryRatio ?? 1;
      const adj = diplomacyAllianceStrengthAdjust(
        milRatio,
        ctx.proposerRespekt,
        ctx.responderRespekt,
        p,
      );
      const minZ = diplomacyAllianceMinZaufanie(adj, milRatio, p);
      const minScore = diplomacyTreatyMinRelacja(
        p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore,
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
      const label = kind === 'sojusz_defensywny' ? 'Sojusz defensywny' : 'Sojusz pełny';
      return { accepted: true, reason: `${label} zawarty`, deal };
    }

    case 'trybut_zadanie': {
      const perTurn = payload.goldPerTurn ?? 0;
      if (perTurn < p.progTrybutMinGoldPerTurn) {
        return { accepted: false, reason: `Minimalny trybut to ${p.progTrybutMinGoldPerTurn} ¤/turę` };
      }
      if (ctx.proposerRespekt <= p.progTrybutZadanieMinRespekt) {
        return {
          accepted: false,
          reason: `Żądanie trybutu wymaga Respekt > ${p.progTrybutZadanieMinRespekt} (masz ${ctx.proposerRespekt})`,
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
      const { givePn, receivePn } = resolveProposalPn(payload);
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

      if (stance.willingnessTrade < p.progHandelWillingnessMin) {
        return { accepted: false, reason: 'Brak chęci do handlu' };
      }
      if (score < p.progHandelRelacja) {
        return { accepted: false, reason: `Relacja zbyt niska na handel (wymagane ≥ ${p.progHandelRelacja})` };
      }

      const hasPnPath = givePn > 0 || receivePn > 0 || payload.giveItems?.length || payload.receiveItems?.length;
      const hasResourceAccess = proposalHasResourceAccess(payload);

      if (hasResourceAccess) {
        if (!pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PN @ Relacji' };
        }
        const turns = clampDealTurns(payload.turns);
        const handelPayload: HandelDealPayload = {
          giveItems: payload.giveItems?.length ? [...payload.giveItems] : undefined,
          receiveItems: payload.receiveItems?.length ? [...payload.receiveItems] : undefined,
        };
        const deal = buildDeal(
          RodzajTraktatu.UmowaHandlowa,
          proposerOwnerId,
          responderOwnerId,
          ctx.turn,
          ctx.turn + turns,
          undefined,
          false,
          handelPayload,
        );
        return {
          accepted: true,
          reason: `Umowa handlowa (dostęp do surowców) na ${turns} tur`,
          deal,
        };
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
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PN @ Relacji' };
        }
        const turns = clampDealTurns(payload.turns);
        const cyklicznyItems = buildHandelSurowiecCykliczny(
          proposerOwnerId, responderOwnerId, payload.giveItems, payload.receiveItems,
        );
        if (!cyklicznyItems.length) {
          return { accepted: false, reason: 'Brak surowca do cyklicznej wymiany' };
        }
        const deal = buildDeal(
          RodzajTraktatu.UmowaHandlowa,
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
          return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PN @ Relacji' };
        }
        return { accepted: true, reason: 'Wymiana PN zaakceptowana', oneShotTrade: true };
      }

      // Legacy: goldOnce → PN 1:1, strict fair (W4-A)
      const legacyGive = pnFromLegacyGold(payload.goldOnce ?? (payload.amount ?? 0) * 10);
      const legacyReceive = pnFromLegacyGold(ctx.fairTradeValue ?? legacyGive);
      if (legacyGive <= 0) {
        return { accepted: false, reason: 'Brak wartości w ofercie' };
      }
      if (!pnDealAcceptedByAi(legacyGive, legacyReceive, relTotal)) {
        return { accepted: false, reason: 'Oferta poniżej uczciwej wartości PN @ Relacji' };
      }
      return { accepted: true, reason: 'Wymiana jednorazowa (T3A)', oneShotTrade: true };
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
      const granRelOk = score >= p.progGraniceRelacja;
      const granZaufOk = relation.zaufanie >= p.progGraniceZaufanie;
      if (!granRelOk && !granZaufOk) {
        return {
          accepted: false,
          reason: `Relacja zbyt niska na granice (wymagana Relacja ≥ ${p.progGraniceRelacja} i Zaufanie ≥ ${p.progGraniceZaufanie})`,
        };
      }
      if (!granRelOk) {
        return { accepted: false, reason: `Relacja zbyt niska na granice (wymagana ≥ ${p.progGraniceRelacja})` };
      }
      if (!granZaufOk) {
        return { accepted: false, reason: `Zaufanie zbyt niskie (wymagane ≥ ${p.progGraniceZaufanie})` };
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
        reason: payload.borderMilitary ? 'Prawo wojskowego przemarszu' : 'Otwarte granice cywilne',
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
      if (ctx.proposerRespekt < p.progWasalizacjaRespekt) {
        return { accepted: false, reason: `Wasalizacja wymaga Respekt ≥ ${p.progWasalizacjaRespekt}` };
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
      return 'Proponujemy pełny sojusz — wspólna obrona i wsparcie militarnie.';
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
    case 'zaproponuj_sojusz':
      return {
        ...base,
        id: makeDealId('pending-sojusz', turn, fromOwnerId, toOwnerId),
        actionId: 'sojusz_pelny',
        payload: {},
      };
    case 'zaproponuj_handel': {
      const goldOnce = cmd.goldOnce ?? 0;
      if (goldOnce <= 0) return null;
      return {
        ...base,
        id: makeDealId('pending-handel', turn, fromOwnerId, toOwnerId),
        payload: { goldOnce },
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
      return {
        ...base,
        id: makeDealId('pending-handelsurowiec', turn, fromOwnerId, toOwnerId),
        actionId: 'handel',
        payload: {
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
 * Gracz klika AKCEPTUJ na propozycji AI — bez ponownej oceny progów AI/respondenta.
 * Zwraca wynik gotowy do applyProposalOutcome (deal / oneShotTrade).
 */
export function resolvePlayerAcceptsAiPending(
  pending: PendingProposal,
  turn: number,
): ProposalEvalResult {
  const { actionId, fromOwnerId, toOwnerId, payload } = pending;
  switch (actionId) {
    case 'sojusz_pelny': {
      const deal = buildDeal(
        'sojusz_pelny',
        fromOwnerId,
        toOwnerId,
        turn,
        null,
      );
      return { accepted: true, reason: 'Sojusz pełny zawarty', deal };
    }
    case 'handel': {
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
          RodzajTraktatu.UmowaHandlowa,
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
      return { accepted: true, reason: 'Wymiana PN zaakceptowana', oneShotTrade: true };
    }
    case 'umowa_handlowa': {
      // E6 (2026-07-23): gracz akceptuje propozycję STAŁEJ Umowy Handlowej od AI —
      // AI już oceniła próg (progHandelRelacja) w decideAIDiplomacy, bez ponownej
      // oceny (jak reszta tej funkcji). payload.goldOnce = opcjonalny jednorazowy
      // "osłodzik" towarzyszący traktatowi (przelew osobno w applyProposalOutcome,
      // main.ts — result.deal tu nie niesie transferu jednorazowego).
      const deal = buildDeal(
        RodzajTraktatu.UmowaHandlowa,
        fromOwnerId,
        toOwnerId,
        turn,
        turn + clampDealTurns(payload.turns),
      );
      return { accepted: true, reason: 'Umowa handlowa zawarta', deal };
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
