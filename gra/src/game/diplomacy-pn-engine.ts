/**
 * diplomacy-pn-engine.ts — stan per para + logika PN→Zaufanie (D4-WYMIANA-PN).
 * Pure helpers; mutacja stanu gry w main.ts.
 */
import type { Relation } from './diplomacy';
import type { GameDifficulty } from './difficulty-cost';
import { trimQuickDealGiveToTolerance } from './diplomacy-ai-offer-balance';
import type { TempoGry } from './tech-tempo';
import type { CredibilityEvent } from './diplomacy-credibility';
import {
  diplomacyTradeTrustFromDeal,
  diplomacyGiftTrustFromPn,
  diplomacyDobraWolaFromSurplus,
  diplomacyFairGivePn,
  diplomacyProgDarRelacja,
  diplomacySumPn,
  diplomacyPnZloto,
  diplomacyPnSurowiecIlosc,
  diplomacyNormalizeSurowiecIlosc,
  diplomacyHandelSurowiecKrok,
  diplomacyHandelSurowiecCenaJednostkowa,
  type DiplomacySumPnOptions,
  type WartoscPozycjaTyp,
  type PnRelacjaParams,
} from './diplomacy-value-catalog';

export interface ResolveProposalPnOptions {
  difficulty?: GameDifficulty;
  proposerOwnerId?: number;
  playerOwnerId?: number;
  tempoGry?: TempoGry | number;
  /** Pełny cykl płatności (handel per_turn × turns tur). */
  turnsMultiplier?: number;
  perTurn?: boolean;
}

export function buildProposalPnSumOpts(opts?: ResolveProposalPnOptions): DiplomacySumPnOptions {
  return {
    difficulty: opts?.difficulty ?? 'normal',
    proposerOwnerId: opts?.proposerOwnerId,
    playerOwnerId: opts?.playerOwnerId ?? 0,
    tempo: opts?.tempoGry,
    turnsMultiplier: opts?.turnsMultiplier,
    perTurn: opts?.perTurn,
  };
}

/** turns × per_turn z payloadu negocjacji — spójne z basketItemsAffordable. */
export function proposalPnTurnsMultiplier(payload: {
  resourceTradeMode?: 'once' | 'per_turn';
  turns?: number;
}): { turnsMultiplier: number; perTurn: boolean } {
  const perTurn = payload.resourceTradeMode === 'per_turn';
  return {
    perTurn,
    turnsMultiplier: perTurn ? Math.max(1, payload.turns ?? 1) : 1,
  };
}

/**
 * WIARYGODNOSC-SPECYFIKACJA.md §7 "Nowe pola w DiploPairMeta" — timing per para,
 * potrzebny do haków kar N1/N3 (karencja po wypowiedzeniu wojny / po zakończeniu
 * porozumienia) i do odwetu (C-WIAR-ODWET=A). Wszystkie pola OPCJONALNE — stary
 * zapis bez nich wczytuje się jako "brak zdarzenia", nie błąd (patrz freshDiploPairMeta).
 */
export interface DiploPairMeta {
  trustPnGainedThisTurn: number;
  dobraWolaRemainingTur: number;
  /** N1 — tura, w której OSTATNIO wypowiedziano wojnę w tej parze (karencja 1 tury: atak w TEJ SAMEJ turze = kara). */
  wojnaOdTury?: number;
  /** N1 — czy kara za "atak bez ostrzeżenia" była już naliczona dla BIEŻĄCEJ wojny w tej parze (nalicza się raz na wojnę, nie raz na bitwę). */
  n1Zastosowany?: boolean;
  /**
   * N3-rozszerzone — okno karencji otwarte przez zakończenie porozumienia BEZTERMINOWEGO
   * (sojusz/otwarte granice/przemarsz/wasal-`wasal`, anulowane jednostronnie) LUB przez
   * zawarcie pokoju. `typ==='bezterminowe'` wymaga `byOwnerId` (TYLKO ten, kto anulował,
   * płaci karę za atak w oknie — C-WIAR-N5KONF=B); `typ==='pokoj'` dotyczy obu stron
   * (kto zaatakuje pierwszy w oknie). `charged` = kara N3 już naliczona dla TEGO okna
   * (nie nalicza się drugi raz przy kolejnej bitwie tej samej wojny).
   */
  n3Window?: { turn: number; typ: 'bezterminowe' | 'pokoj'; byOwnerId?: number; charged?: boolean };
  /**
   * Pokój / rozejm zaakceptowany — do tej tury (wyłącznie) para nie może wypowiedzieć sobie wojny
   * (Maciej 2026-08-01). Sojusze nie omijają tej blokady.
   */
  peaceUntilTurn?: number;
  /**
   * Odwet (C-WIAR-ODWET=A) — ostatnie przewinienie w TEJ parze otwierające prawo
   * do bezkarnej (bez N1/N2) wojny odwetowej w oknie `wiarygodnoscOdwetOknoTur`
   * tur. `byOwnerId` = kto zawinił, `againstOwnerId` = wobec kogo (tylko TA strona
   * może się odwołać na ten wpis).
   */
  ostatniePrzewinienieWobecNas?: { turn: number; typ: CredibilityEvent; byOwnerId: number; againstOwnerId: number };
}

export interface ZlozeGrant {
  granterOwnerId: number;
  granteeOwnerId: number;
  partnerId: number;
  zlozeId: string;
  hexKey: string;
  active: boolean;
  /** Powiązanie z ActiveDeal UmowaHandlowa — wygasa z traktatem. */
  dealId?: string;
}

export interface BasketItem {
  typ: WartoscPozycjaTyp;
  id: string;
  ilosc?: number;
  hexKey?: string;
  cityId?: string;
}

export function diploPairKey(a: number, b: number): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export function freshDiploPairMeta(): DiploPairMeta {
  return { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0 };
}

export function relationTotal(rel: Relation): number {
  return Math.max(0, Math.min(200, (rel.zaufanie ?? 0) + (rel.respekt ?? 0)));
}

/** Relacja podpisana −100…+100 (relTotal 0–200 → neutral @ 100). Maciej 2026-07-29. */
export function relationSignedFromTotal(relTotal: number): number {
  return Math.max(-100, Math.min(100, relTotal - 100));
}

/** Modyfikator % wymagań PN traktatu; clamp ±90 (nigdy ±100). */
export function relationPnModPct(relSigned: number): number {
  const clamped = Math.max(-90, Math.min(90, relSigned));
  return Number(clamped.toFixed(1));
}

/** Jedno miejsce po przecinku, polski separator — tylko etykiety (nie stan gry). */
function formatPctPl1(n: number): string {
  const rounded = Number(n.toFixed(1));
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return String(normalized).replace(/\.0$/, '').replace('.', ',');
}

/**
 * Efektywne PN traktatu po stronie GRACZA @ Relacji (siła PW, nie inflacja kosztu):
 * gracz = baza × (1 + modPct/100); +50 Rel → ×1,50; −50 → ×0,50.
 * Partner (AI) zawsze na bazie — patrz partnerTreatyPnRequired.
 */
export function effectiveTreatyPnRequired(basePn: number, relTotal: number): number {
  if (basePn <= 0) return 0;
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  return Math.max(0, Math.round(basePn * (1 + modPct / 100)));
}

/** Alias semantyczny — PW traktatu po stronie gracza (Relacja modyfikuje). */
export const playerTreatyPnRequired = effectiveTreatyPnRequired;

/** PW traktatu po stronie partnera (AI) — stała baza, bez moda Relacji. */
export function partnerTreatyPnRequired(basePn: number): number {
  return Math.max(0, basePn);
}

/** PW traktatu per rola w parze gracz–partner. */
export function treatyPwForRole(
  basePn: number,
  relTotal: number,
  role: 'player' | 'partner',
): number {
  if (basePn <= 0) return 0;
  return role === 'player'
    ? effectiveTreatyPnRequired(basePn, relTotal)
    : partnerTreatyPnRequired(basePn);
}

/** Krótka etykieta UI modyfikatora siły PW gracza @ Relacji. */
export function formatRelationModLabel(relTotal: number): string {
  const modPct = relationPnModPct(relationSignedFromTotal(relTotal));
  if (modPct === 0) return 'Relacje: 0% siła PW';
  const pctStr = formatPctPl1(Math.abs(modPct));
  if (modPct > 0) return `Relacje: +${pctStr}% siła PW`;
  return `Relacje: −${pctStr}% siła PW`;
}

/**
 * W4-A: AI akceptuje gdy givePn ≥ fair min @ Relacji.
 * Kurs Rel/100 klampowany do 100 (fix #20): Relacja > 100 nie może obniżyć
 * progu poniżej parytetu 1:1 — inaczej proponent zawsze zarabia netto na
 * dobrej Relacji (symetria względem obu stron: dobra Relacja najwyżej
 * wyrównuje ofertę do parytetu, nigdy nie robi z niej zysku).
 */
export function pnDealAcceptedByAi(
  givePn: number,
  receivePn: number,
  relacja: number,
): boolean {
  if (givePn <= 0 && receivePn <= 0) return false;
  const fairMin = diplomacyFairGivePn(receivePn, Math.min(100, relacja));
  return givePn >= fairMin;
}

/** W3-B: czysty dar wymaga Relacji ≥ progDarRelacja. */
export function pnGiftAllowed(relacja: number, difficulty: GameDifficulty = 'normal'): boolean {
  return relacja >= diplomacyProgDarRelacja(undefined, difficulty);
}

export function pnFromLegacyGold(goldOnce: number | undefined): number {
  if (goldOnce == null || !Number.isFinite(goldOnce) || goldOnce <= 0) return 0;
  return diplomacyPnZloto(goldOnce);
}

export function resolveProposalPn(
  payload: {
    givePn?: number;
    receivePn?: number;
    goldOnce?: number;
    giveItems?: readonly BasketItem[];
    receiveItems?: readonly BasketItem[];
  },
  opts?: ResolveProposalPnOptions,
): { givePn: number; receivePn: number } {
  let givePn = payload.givePn ?? 0;
  let receivePn = payload.receivePn ?? 0;
  const sumBase = buildProposalPnSumOpts(opts);
  if (payload.giveItems?.length) {
    const sum = diplomacySumPn([...payload.giveItems], { ...sumBase, side: 'give' });
    if (sum != null) givePn = sum;
  }
  if (payload.receiveItems?.length) {
    const sum = diplomacySumPn([...payload.receiveItems], { ...sumBase, side: 'receive' });
    if (sum != null) receivePn = sum;
  }
  if (givePn <= 0 && payload.goldOnce != null && payload.goldOnce > 0) {
    givePn = pnFromLegacyGold(payload.goldOnce);
  }
  return { givePn, receivePn };
}

export interface TrustApplyResult {
  rel: Relation;
  meta: DiploPairMeta;
  deltaZaufanie: number;
  dobraWolaStarted: boolean;
}

/**
 * Zastosuj ΔZaufanie z PN (handel lub dar) + ewentualna dobra wola.
 *
 * `pnRelacjaParams` (opcjonalny) — nadpisanie parametrów PN→Zaufanie (np.
 * `max_zaufanie_na_ture` z `diplomacy.json`). Domyślnie flat `max_zaufanie_na_ture`
 * (dziś 5 pkt/turę) — bez modyfikacji zależnej od Wiarygodności (R-WIARYGODNOSC-DZWIGNIA2-Q1=A).
 */
export function applyPnTrustToRelation(
  rel: Relation,
  meta: DiploPairMeta,
  givePn: number,
  receivePn: number,
  isGift: boolean,
  pnRelacjaParams?: PnRelacjaParams,
): TrustApplyResult {
  const trustResult = isGift
    ? diplomacyGiftTrustFromPn(givePn, meta.trustPnGainedThisTurn, pnRelacjaParams)
    : diplomacyTradeTrustFromDeal(givePn, receivePn, relationTotal(rel), meta.trustPnGainedThisTurn, pnRelacjaParams);

  const deltaZaufanie = trustResult.deltaZaufanie;
  const newMeta: DiploPairMeta = {
    trustPnGainedThisTurn: meta.trustPnGainedThisTurn + deltaZaufanie,
    dobraWolaRemainingTur: meta.dobraWolaRemainingTur,
  };

  const dobra = diplomacyDobraWolaFromSurplus(trustResult.surplusPn);
  let dobraWolaStarted = false;
  if (dobra.active && dobra.tur > 0) {
    newMeta.dobraWolaRemainingTur = Math.max(newMeta.dobraWolaRemainingTur, dobra.tur);
    dobraWolaStarted = true;
  }

  const newZaufanie = Math.max(0, Math.min(100, (rel.zaufanie ?? 0) + deltaZaufanie));
  return {
    rel: { ...rel, zaufanie: newZaufanie },
    meta: newMeta,
    deltaZaufanie,
    dobraWolaStarted,
  };
}

/** Tick dobrej woli (+1 Zauf./turę, nie liczy się do limitu 5/turę z PN). */
export function tickDobraWolaOnRelation(
  rel: Relation,
  meta: DiploPairMeta,
): { rel: Relation; meta: DiploPairMeta; gained: number } {
  if (meta.dobraWolaRemainingTur <= 0) {
    return { rel, meta, gained: 0 };
  }
  const newZaufanie = Math.max(0, Math.min(100, (rel.zaufanie ?? 0) + 1));
  return {
    rel: { ...rel, zaufanie: newZaufanie },
    meta: {
      ...meta,
      dobraWolaRemainingTur: meta.dobraWolaRemainingTur - 1,
    },
    gained: 1,
  };
}

export function suspendZlozeGrantsForWar(
  grants: ZlozeGrant[],
  ownerA: number,
  ownerB: number,
): ZlozeGrant[] {
  return grants.map(g => {
    const involves =
      (g.granterOwnerId === ownerA && g.granteeOwnerId === ownerB) ||
      (g.granterOwnerId === ownerB && g.granteeOwnerId === ownerA);
    if (!involves || !g.active) return g;
    return { ...g, active: false };
  });
}

/** Wygaszenie grantów powiązanych z wygasłym/zerwanym traktatem handlowym. */
export function deactivateZlozeGrantsForDeal(
  grants: ZlozeGrant[],
  dealId: string,
): ZlozeGrant[] {
  return grants.map(g => (g.dealId === dealId && g.active ? { ...g, active: false } : g));
}

// ---------------------------------------------------------------------------
// SZYBKA UMOWA — auto-uczciwa oferta (zaległość #1, DYSPOZYCJA-WDROZENIE 2026-07-23)
// ---------------------------------------------------------------------------

export interface QuickDealGoodOption {
  id: string;
  label: string;
}

/** Surowiec ILOŚCIOWY (sztuki) — C-DYP-SUROWCE-Q1=B (2026-07-23), patrz diplomacy-goods.ts. */
export interface QuickDealQuantityGoodOption {
  id: string;
  label: string;
  /** Max sztuk, ile ta strona może realnie zaoferować (R-DYP-PAKIET-USUN 2026-08-08). */
  maxQty: number;
}

export interface QuickDealInput {
  /** Relacja (Zaufanie+Respekt) pary — ten sam kurs co reszta koszyka PN. */
  relacjaTotal: number;
  /** Złoto dostępne u NAS (skarbiec) — górny limit dopełniacza. */
  ourGoldAvailable: number;
  /** Surowce boolean, które MY faktycznie mamy i możemy oddać (już wycenione w katalogu PN). */
  ourResourceOptions: readonly QuickDealGoodOption[];
  /** Surowce boolean, które partner faktycznie ma (to co możemy dostać). */
  theirResourceOptions: readonly QuickDealGoodOption[];
  /**
   * Surowce ILOŚCIOWE, które MY faktycznie mamy (sztuki) — tanie, dobrze dopełniają
   * bilans zamiast/obok złota. Opcjonalne (callery bez wpięcia diplomacy-goods.ts
   * po prostu nie dostaną tego dopełniacza).
   */
  ourQuantityResourceOptions?: readonly QuickDealQuantityGoodOption[];
  /** Surowce ILOŚCIOWE partnera (sztuki) — do quick-deal zamiast wycofanego dostępu boolean. */
  theirQuantityResourceOptions?: readonly QuickDealQuantityGoodOption[];
  /** Poziom trudności — Normal/Trudny: trim nadwyżki PW (D-DYPLO-AI-OFERTA-ZERO). */
  difficulty?: GameDifficulty;
}

export interface QuickDealResult {
  giveItems: BasketItem[];
  receiveItems: BasketItem[];
}

const QUICK_DEAL_FALLBACK_GOLD = 20;
const QUICK_DEAL_GOLD_STEP = 5;
const QUICK_DEAL_MAX_GOLD = 200;

/**
 * FAZA 3 (zaległość #1 — SZYBKA UMOWA to dziś zaślepka: otwiera zwykły koszyk pusty).
 * Auto-uczciwa oferta: greedy — surowce ILOŚCIOWE partnera jako „co dostaję" (SUROW-TERYT:
 * bez trwałego dostępu boolean), potem NASZE pakiety (+złoto jako dopełniacz) aż suma
 * osiągnie próg fair @ Relacji — DOKŁADNIE ten sam próg, którym AI ocenia ofertę
 * (diplomacyFairGivePn / pnDealAcceptedByAi w diplomacy-proposals.ts).
 */
export function computeQuickDealBasket(input: QuickDealInput): QuickDealResult {
  const receiveItems: BasketItem[] = [];
  let receivePn = 0;

  // SUROW-TERYT: partner oddaje sztuki surowca (nie trwały dostęp civ-wide).
  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): cena JEDNOSTKOWA (PN/szt., bez krok-floor) do
  // sortowania/filtrowania „najtańszy pierwszy" — `diplomacyPnSurowiecIlosc(id, 1)` floruje
  // TERAZ 1 szt. do 0 dla surowców z krokiem 5, co fałszywie wykluczyłoby WSZYSTKIE takie
  // surowce z „Szybkiej umowy" (pnPerUnit>0 filter). `diplomacyHandelSurowiecCenaJednostkowa`
  // to surowa stawka z cennika, niezależna od kroku — dokładnie to, czego tu trzeba.
  const theirQtyPriced = (input.theirQuantityResourceOptions ?? [])
    .map(o => ({ ...o, pnPerUnit: diplomacyHandelSurowiecCenaJednostkowa(o.id) ?? 0 }))
    .filter(o => o.pnPerUnit > 0 && o.maxQty > 0)
    .sort((a, b) => a.pnPerUnit - b.pnPerUnit);
  if (theirQtyPriced.length > 0) {
    const pick = theirQtyPriced[0]!;
    // R-DYP-PAKIET-USUN (2026-08-08, Evaluator minor-1): dawniej `ilosc: 1` znaczyło
    // „1 pakiet" = 10 sztuk — samo usunięcie pojęcia pakietu bez korekty tej stałej
    // cichutko skurczyłoby domyślną propozycję „Szybkiej umowy" 10×. Kotwica = 10 sztuk
    // (ten sam realny wolumen co dawniej), przycięta do realnego zapasu partnera.
    // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): dodatkowo floor do wielokrotności kroku
    // handlu (5 szt. dla surowców dotkniętych ×5) — ilość WIDOCZNA w koszyku „Szybkiej
    // umowy" i ilość FAKTYCZNIE wyceniona muszą się zgadzać.
    const seedQty = diplomacyNormalizeSurowiecIlosc(pick.id, Math.min(10, pick.maxQty));
    if (seedQty > 0) {
      receiveItems.push({ typ: 'surowiec_ilosc', id: pick.id, ilosc: seedQty });
      receivePn = diplomacyPnSurowiecIlosc(pick.id, seedQty) ?? 0;
    }
  }

  const giveItems: BasketItem[] = [];

  if (receivePn <= 0) {
    // Brak wycenialnych dóbr po stronie partnera — otwórz negocjacje drobnym gestem złota
    // (użytkownik dogrywa resztę ręcznie w koszyku; brak zgadywania czego partner NIE ma).
    if (input.ourGoldAvailable > 0) {
      giveItems.push({
        typ: 'zloto',
        id: 'zloto',
        ilosc: Math.min(QUICK_DEAL_FALLBACK_GOLD, Math.floor(input.ourGoldAvailable)),
      });
    }
    return { giveItems, receiveItems };
  }

  const fairMin = diplomacyFairGivePn(receivePn, input.relacjaTotal);
  let giveSum = 0;

  // C-DYP-SUROWCE-Q1=B: dopełniacz z surowców ILOŚCIOWYCH (sztuki) — tanie, dobrze
  // domykają bilans granularnie, zanim sięgniemy po złoto. Najtańszy PN/szt. pierwszy.
  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): pnPerUnit z cennika surowego (bez krok-floor,
  // patrz komentarz przy theirQtyPriced wyżej) — pętla przyrasta o KROK, nie o 1 szt., żeby
  // `qty` zawsze wychodził już jako poprawna wielokrotność (5 dla surowców dotkniętych ×5).
  if (giveSum < fairMin && input.ourQuantityResourceOptions?.length) {
    const ourQtyPriced = input.ourQuantityResourceOptions
      .map(o => ({ ...o, pnPerUnit: diplomacyHandelSurowiecCenaJednostkowa(o.id) ?? 0, krok: diplomacyHandelSurowiecKrok(o.id) }))
      .filter(o => o.pnPerUnit > 0 && o.maxQty >= o.krok)
      .sort((a, b) => a.pnPerUnit - b.pnPerUnit);

    for (const item of ourQtyPriced) {
      if (giveSum >= fairMin) break;
      let qty = 0;
      const pnPerKrok = item.pnPerUnit * item.krok;
      while (qty + item.krok <= item.maxQty && giveSum < fairMin) {
        qty += item.krok;
        giveSum += pnPerKrok;
      }
      if (qty > 0) giveItems.push({ typ: 'surowiec_ilosc', id: item.id, ilosc: qty });
    }
  }

  if (giveSum < fairMin && input.ourGoldAvailable > 0) {
    const cap = Math.min(Math.floor(input.ourGoldAvailable), QUICK_DEAL_MAX_GOLD);
    let goldQty = 0;
    while (goldQty < cap) {
      goldQty = Math.min(cap, goldQty + QUICK_DEAL_GOLD_STEP);
      if (giveSum + diplomacyPnZloto(goldQty) >= fairMin) break;
    }
    if (goldQty > 0) giveItems.push({ typ: 'zloto', id: 'zloto', ilosc: goldQty });
  }

  const trimmedGive = trimQuickDealGiveToTolerance(
    giveItems,
    receivePn,
    input.relacjaTotal,
    input.difficulty ?? 'normal',
  );

  return { giveItems: trimmedGive, receiveItems };
}
