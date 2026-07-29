/**
 * diplomacy-treaties.ts — aktywne traktaty v1.1 (lane CYW).
 * SILNIK trzyma tablicę ActiveDeal[] + save/load; EKO tick płatności osobno.
 */
import { RodzajTraktatu } from '../types/diplomacy';
import type { BasketItem } from './diplomacy-pn-engine';

export type TreatyKind = RodzajTraktatu | 'sojusz_defensywny' | 'sojusz_pelny';

/** Payload trwałej umowy handlowej (dostęp do surowców/złóż). */
export interface HandelDealPayload {
  giveItems?: BasketItem[];
  receiveItems?: BasketItem[];
}

/**
 * HANDEL-SUROWCE-CYKL (2026-07-24) — pojedynczy przepływ surowiec→zapłata CO TURĘ
 * w ramach traktatu UmowaHandlowa (tryb „Wymiana przez X tur", odrębny od
 * jednorazowego transferu w HandelDealPayload/oneShotTrade). ownerId-agnostyczny:
 * sellerOwnerId/buyerOwnerId mogą być gracz (0) LUB dowolne AI w dowolnej
 * kombinacji (gracz→AI, AI→gracz, AI→AI) — silnik (main.ts tickCyclicResourceTradeDeals)
 * nie rozróżnia stron.
 */
export interface HandelSurowiecCyklicznyItem {
  /** Klucz ASCII surowca (cities.ts City.surowce / diplomacy-value-catalog cennik). */
  surowiecKey: string;
  /** Ile PAKIETÓW surowca (diplomacyHandelSurowcePakietWielkosc) płynie sprzedawca→kupujący co turę. */
  pakietyPerTura: number;
  /** Dawca surowca (traci zapas z magazynu miast). */
  sellerOwnerId: number;
  /** Biorca surowca (zyskuje zapas), płaci zaplataPerTura sprzedawcy. */
  buyerOwnerId: number;
  /** Forma zapłaty biorcy → dawcy (brak = wymiana bez zapłaty, np. barter surowiec-za-surowiec). */
  zaplataTyp?: 'zloto' | 'praca';
  zaplataPerTura?: number;
  /**
   * N6/atomowość (WIARYGODNOSC-SPECYFIKACJA.md §2, C-HANDEL-1/2/3) — kolejne tury
   * Z RZĘDU, w których SPRZEDAWCA (sellerOwnerId) nie miał zapasu na pełną dostawę
   * tej pozycji. Reset do 0 po każdej udanej dostawie; przy osiągnięciu progu
   * (DIPLOMACY_PARAMS.wiarygodnoscN6ProgTurZRzedu) nalicza się kara N6 dawcy i licznik
   * wraca do 0 (może się powtórzyć).
   */
  sellerNiedostarczylTuryZRzedu?: number;
  /**
   * N6/atomowość — kolejne tury Z RZĘDU, w których KUPUJĄCY (buyerOwnerId) nie miał
   * środków na zapłatę MIMO że sprzedawca był gotów dostarczyć (dostawa i tak NIE
   * następuje — atomowość, C-HANDEL-3). Nie dotyczy barteru (tam liczy się wyłącznie
   * `sellerNiedostarczylTuryZRzedu` obu sprzężonych pozycji).
   */
  buyerNieZaplacilTuryZRzedu?: number;
}

/** Aktywny traktat między dwoma ownerId (gra używa number). */
export interface ActiveDeal {
  id: string;
  rodzaj: TreatyKind;
  /** [mniejszy ownerId, większy ownerId] — para kanoniczna */
  strony: [number, number];
  wygasaTura: number | null;
  /**
   * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 2+3) — tura zawarcia, do wyliczenia
   * „od ilu tur" w banerze statusu formalnego i w kolumnie Aktywne traktaty.
   * Opcjonalne — legacy save'y i sojusze zawierane poza `buildDeal` mogą go nie mieć.
   */
  zawartaTura?: number;
  /** T1A: trybut / wasal — kwota co turę ze skarbca płatnika */
  ekonomia?: {
    payerOwnerId: number;
    receiverOwnerId: number;
    pieniadzePerTura?: number;
  };
  /** T3A: handel jednorazowy — już rozliczony po akceptacji */
  handelJednorazowy?: boolean;
  /** Trwała wymiana dostępu do surowców/złóż (UmowaHandlowa). */
  handelPayload?: HandelDealPayload;
  /**
   * HANDEL-SUROWCE-CYKL: przepływy surowiec→zapłata CO TURĘ, aktywne dopóki deal
   * nie wygaśnie (wygasaTura) / nie zostanie zerwany wojną (BREAK_ON_WAR już
   * obejmuje UmowaHandlowa). SILNIK (main.ts tickCyclicResourceTradeDeals) tika
   * po expireTreaties w runDiplomacyTurnTick — po wygaśnięciu deal znika z
   * activeDeals razem z tym polem (brak osobnego cleanupu).
   */
  handelSurowiecCykliczny?: HandelSurowiecCyklicznyItem[];
  /**
   * WIARYGODNOSC-SPECYFIKACJA.md §3 tabela B (P3 finisz) — true od PIERWSZEGO
   * niedostarczenia (czyjejkolwiek winy, sprzedawca LUB kupujący) w tym dealu;
   * P3 ("100% dostaw AŻ DO KOŃCA") wymaga, żeby to pole pozostało falsy przez
   * całe życie umowy. Dotyczy WYŁĄCZNIE dealów z handelSurowiecCykliczny.
   */
  handelCyklicznyKiedykolwiekNiedostarczono?: boolean;
}

export type AllianceEvent =
  | { type: 'attacked'; victimOwnerId: number; aggressorOwnerId: number }
  | { type: 'declared_war'; declarerOwnerId: number; targetOwnerId: number };

export interface AllianceObligation {
  /** Sojusznicy, którzy muszą wypowiedzieć wojnę temu ownerId. */
  mustDeclareWarOn: number;
  /** ownerIds zobowiązani do wojny (bez declarera/atkującego). */
  obligatedAllies: number[];
  /** Jeśli któryś sojusznik nie dołączy — zrywamy te traktaty. */
  treatyIdsToBreakOnRefusal: string[];
}

function pairKey(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

function sideOf(deal: ActiveDeal, ownerId: number): boolean {
  return deal.strony[0] === ownerId || deal.strony[1] === ownerId;
}

function allyOf(deal: ActiveDeal, ownerId: number): number | null {
  if (deal.strony[0] === ownerId) return deal.strony[1];
  if (deal.strony[1] === ownerId) return deal.strony[0];
  return null;
}

function isAllianceKind(rodzaj: TreatyKind): boolean {
  return (
    rodzaj === RodzajTraktatu.SojuszWojskowy
    || rodzaj === 'sojusz_defensywny'
    || rodzaj === 'sojusz_pelny'
  );
}

/** Normalizuje legacy sojusz_wojskowy → pełny. */
export function normalizeTreatyKind(rodzaj: TreatyKind): TreatyKind {
  if (rodzaj === RodzajTraktatu.SojuszWojskowy) return 'sojusz_pelny';
  return rodzaj;
}

/** Czy deal niesie trwałą wymianę surowców (koszyk / cykliczna) — nie szlaki. */
export function dealHasExchangePayload(deal: ActiveDeal): boolean {
  const hp = deal.handelPayload;
  if ((hp?.giveItems?.length ?? 0) > 0 || (hp?.receiveItems?.length ?? 0) > 0) return true;
  return (deal.handelSurowiecCykliczny?.length ?? 0) > 0;
}

/** HANDEL-SPLIT-Q1=B: migracja legacy `umowa_handlowa` → szlaki lub wymiana. */
export function migrateLegacyHandelRodzaj(deal: ActiveDeal): TreatyKind {
  const k = normalizeTreatyKind(deal.rodzaj);
  if (k !== RodzajTraktatu.UmowaHandlowa) return k;
  return dealHasExchangePayload(deal) ? RodzajTraktatu.UmowaWymiany : RodzajTraktatu.UmowaSzlakow;
}

/** Po save/load — normalizuje legacy rodzaje traktatów (v1.1 migracja). */
export function hydrateActiveDeals(deals: readonly ActiveDeal[]): ActiveDeal[] {
  return deals.map(d => ({
    ...d,
    rodzaj: migrateLegacyHandelRodzaj(d),
    strony: pairKey(d.strony[0], d.strony[1]),
  }));
}

/** Aktywny traktat szlaków (szlaki handlowe, +1 Zaufanie/turę). */
export function hasSzlakowTreaty(state: ActiveDeal[], a: number, b: number): boolean {
  return dealsForPair(state, a, b).some(d => normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.UmowaSzlakow);
}

/** Aktywna umowa wymiany surowców (koszyk / cykliczna). */
export function hasWymianaTreaty(state: ActiveDeal[], a: number, b: number): boolean {
  return dealsForPair(state, a, b).some(d => normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.UmowaWymiany);
}

/**
 * T2: przy wypowiedzeniu wojny A→B łączy zobowiązania pełnego sojuszu (sojusznicy A)
 * i defensywnego (sojusznicy B). SILNIK woła zamiast samego `declared_war`.
 */
export function allianceObligationsForWarDeclaration(
  state: ActiveDeal[],
  declarerOwnerId: number,
  targetOwnerId: number,
): AllianceObligation[] {
  return [
    ...allianceObligations(state, {
      type: 'declared_war',
      declarerOwnerId,
      targetOwnerId,
    }),
    ...allianceObligations(state, {
      type: 'attacked',
      victimOwnerId: targetOwnerId,
      aggressorOwnerId: declarerOwnerId,
    }),
  ];
}

export function addTreaty(state: ActiveDeal[], deal: ActiveDeal): ActiveDeal[] {
  const k = normalizeTreatyKind(deal.rodzaj);
  const next: ActiveDeal = { ...deal, rodzaj: k, strony: pairKey(deal.strony[0], deal.strony[1]) };
  const withoutSame = state.filter(d => d.id !== next.id);
  return [...withoutSame, next];
}

export function removeTreaty(state: ActiveDeal[], id: string): ActiveDeal[] {
  return state.filter(d => d.id !== id);
}

export function expireTreaties(state: ActiveDeal[], turn: number): ActiveDeal[] {
  return state.filter(d => d.wygasaTura === null || d.wygasaTura > turn);
}

export function hasTreaty(
  state: ActiveDeal[],
  a: number,
  b: number,
  rodzaj?: TreatyKind,
): boolean {
  const [p0, p1] = pairKey(a, b);
  return state.some(d => {
    if (d.strony[0] !== p0 || d.strony[1] !== p1) return false;
    if (rodzaj === undefined) return true;
    return normalizeTreatyKind(d.rodzaj) === normalizeTreatyKind(rodzaj);
  });
}

/**
 * T2 Maciej 2026-06-30: defensywny vs pełny + zryw gdy sojusznik nie wchodzi do wojny.
 */
export function allianceObligations(
  state: ActiveDeal[],
  event: AllianceEvent,
): AllianceObligation[] {
  const out: AllianceObligation[] = [];

  for (const deal of state) {
    if (!isAllianceKind(deal.rodzaj)) continue;
    const kind = normalizeTreatyKind(deal.rodzaj);

    if (event.type === 'attacked') {
      const { victimOwnerId, aggressorOwnerId } = event;
      if (!sideOf(deal, victimOwnerId)) continue;
      if (kind !== 'sojusz_defensywny' && kind !== 'sojusz_pelny') continue;
      const ally = allyOf(deal, victimOwnerId);
      if (ally === null) continue;
      out.push({
        mustDeclareWarOn: aggressorOwnerId,
        obligatedAllies: [ally],
        treatyIdsToBreakOnRefusal: [deal.id],
      });
    }

    if (event.type === 'declared_war') {
      const { declarerOwnerId, targetOwnerId } = event;
      if (!sideOf(deal, declarerOwnerId)) continue;
      if (kind !== 'sojusz_pelny') continue;
      const ally = allyOf(deal, declarerOwnerId);
      if (ally === null) continue;
      out.push({
        mustDeclareWarOn: targetOwnerId,
        obligatedAllies: [ally],
        treatyIdsToBreakOnRefusal: [deal.id],
      });
    }
  }

  return out;
}

/** Sojusznicy, którzy faktycznie wypowiedzieli wojnę — reszta łamie traktat. */
export function treatiesBrokenByRefusal(
  obligations: AllianceObligation[],
  joinedWarOwnerIds: readonly number[],
): string[] {
  const joined = new Set(joinedWarOwnerIds);
  const broken = new Set<string>();
  for (const ob of obligations) {
    for (const ally of ob.obligatedAllies) {
      if (!joined.has(ally)) {
        for (const tid of ob.treatyIdsToBreakOnRefusal) broken.add(tid);
      }
    }
  }
  return [...broken];
}

export function dealsForPair(state: ActiveDeal[], a: number, b: number): ActiveDeal[] {
  const [p0, p1] = pairKey(a, b);
  return state.filter(d => d.strony[0] === p0 && d.strony[1] === p1);
}

/** Traktaty zerwane przez wypowiedzenie wojny / atak (NAP, sojusze, granice). */
const BREAK_ON_WAR: ReadonlySet<TreatyKind> = new Set([
  RodzajTraktatu.PaktNieagresji,
  RodzajTraktatu.SojuszWojskowy,
  'sojusz_defensywny',
  'sojusz_pelny',
  RodzajTraktatu.OtwartGranice,
  RodzajTraktatu.PrawoWojskowePrzemarszu,
  RodzajTraktatu.UmowaHandlowa,
  RodzajTraktatu.UmowaSzlakow,
  RodzajTraktatu.UmowaWymiany,
]);

export function treatiesBrokenByWar(
  state: ActiveDeal[],
  a: number,
  b: number,
): string[] {
  const pair = dealsForPair(state, a, b);
  return pair.filter(d => BREAK_ON_WAR.has(normalizeTreatyKind(d.rodzaj))).map(d => d.id);
}

export function removeTreatiesById(state: ActiveDeal[], ids: readonly string[]): ActiveDeal[] {
  if (!ids.length) return state;
  const drop = new Set(ids);
  return state.filter(d => !drop.has(d.id));
}

/** Aktywne trybuty/wasale z ekonomią per-tura (T1A — tick w EKO). */
export function tributeDeals(state: ActiveDeal[]): ActiveDeal[] {
  return state.filter(
    d => d.ekonomia?.pieniadzePerTura != null && d.ekonomia.pieniadzePerTura > 0,
  );
}

/** Wzajemnie wykluczające tiery per-turowego Zaufania (Maciej 2026-07-21). */
export type PokojTrustTier = 'sojusz' | 'nap' | 'pokoj';

/** Sojusz > NAP > pokojowy kontakt (wymaga braku wojny + kontaktu dla tieru pokoj). */
export function resolvePokojTrustTier(
  state: readonly ActiveDeal[],
  ownerA: number,
  ownerB: number,
  opts: { contactEstablished: boolean; atWar: boolean },
): PokojTrustTier | undefined {
  if (opts.atWar) return undefined;
  const [p0, p1] = pairKey(ownerA, ownerB);
  const pairDeals = state.filter(d => d.strony[0] === p0 && d.strony[1] === p1);
  if (pairDeals.some(d => isAllianceKind(normalizeTreatyKind(d.rodzaj)))) {
    return 'sojusz';
  }
  if (pairDeals.some(d => normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.PaktNieagresji)) {
    return 'nap';
  }
  if (opts.contactEstablished) return 'pokoj';
  return undefined;
}
