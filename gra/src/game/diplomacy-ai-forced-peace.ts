// R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (B) — pokój AI↔AI wymuszony po N turach od prośby + cena pokoju.
//
// Decyzja właściciela (2026-11-03): gdy cywilizacja AI przegrywa wojnę z inną cywilizacją AI i PROSI o pokój
// (istniejąca ocena „chce pokoju": decideAIDiplomacy → zaproponuj_pokoj / oferuj_trybut_za_pokoj),
// zwycięzca MUSI przyjąć pokój najpóźniej w N-tej turze od prośby (N = ai-params.json `tury_do_pokoju_po_prosbie`, 2).
// Pokój ma CENĘ: dla zwycięzcy bilans pokoju przed zapłatą jest ujemny (traci szansę na zdobycze), więc przegrany
// płaci w istniejących formach koszyka (złoto, surowce, cesja miasta) tak, by bilans zwycięzcy ≥ 0. Gdy przegrany
// nie ma czym zapłacić w pełni, po N turach pokój i tak następuje z płatnością maksymalną możliwą.
//
// PURE: bez DOM / stanu gry. Wejścia podaje main.ts. Dotyczy wyłącznie par AI↔AI (gracz nie jest zmuszany).

import aiParamsRaw from '../../data/ai-params.json';
import warPeaceParamsRaw from '../../data/diplomacy-war-peace-params.json';

const FALLBACK_TURNS = 2;

/** Liczba tur od prośby o pokój, po której pokój AI↔AI wchodzi w życie automatycznie. */
export function aiPeaceTurnsAfterRequest(raw: unknown = aiParamsRaw): number {
  const entry = (raw as Record<string, { wartosc?: unknown } | undefined>)['tury_do_pokoju_po_prosbie'];
  const v = entry?.wartosc;
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.floor(v) : FALLBACK_TURNS;
}

export const AI_PEACE_TURNS_AFTER_REQUEST: number = aiPeaceTurnsAfterRequest();

// ---------------------------------------------------------------------------
// R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1 (decyzja wlasciciela 2026-11-09, ABC D1):
// pokoj/rozejm AI↔AI NIE moze zostac zawarty, gdy bilans PW ktorejkolwiek z dwoch AI jest ujemny.
// (Pokoj proponowany GRACZOWI zostaje akceptowalny przy ujemnym bilansie gracza -- ta regula go nie dotyczy.)
// Prog w pliku danych: diplomacy-war-peace-params.json -> pokojAiAi.minBilansPW (0).
// ---------------------------------------------------------------------------

/** Minimalny bilans PW (po zaplacie) kazdej z dwoch AI przy pokoju AI↔AI; z JSON. */
export function aiAiPeaceMinBalance(raw: unknown = warPeaceParamsRaw): number {
  const v = (raw as { pokojAiAi?: { minBilansPW?: unknown } }).pokojAiAi?.minBilansPW;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export const AI_AI_PEACE_MIN_BALANCE: number = aiAiPeaceMinBalance();

/** Czy pokoj AI↔AI jest dozwolony: bilans zwyciezcy I przegranego >= minBilans. Brak bilansu przegranego = nie sprawdzany. */
export function isAiAiPeaceBalanceAllowed(
  winnerBalancePn: number,
  loserBalancePn: number | undefined,
  minBalancePn: number = AI_AI_PEACE_MIN_BALANCE,
): boolean {
  if (!(winnerBalancePn >= minBalancePn)) return false;
  if (loserBalancePn !== undefined && !(loserBalancePn >= minBalancePn)) return false;
  return true;
}

/** Wymagana zaplata PW od przegranego, by bilans zwyciezcy doszedl do minBilans (nie mniej niz dotychczasowa cena). */
export function aiAiPeaceRequiredPn(
  baseRequiredPn: number,
  winnerBalanceAtZeroPn: number,
  minBalancePn: number = AI_AI_PEACE_MIN_BALANCE,
): number {
  const toMin = Math.ceil(minBalancePn - winnerBalanceAtZeroPn);
  return Math.max(baseRequiredPn, toMin, 0);
}

/** Prośba o pokój: `requesterId` = przegrywający (prosi), `otherId` = zwycięzca (musi przyjąć). */
export type AiPeaceKind = 'pokoj' | 'rozejm';

export interface AiPeaceRequest {
  requesterId: number;
  otherId: number;
  /**
   * Rodzaj prośby wg `rodzaj` komendy `zaproponuj_pokoj` z ai.ts (`aiPeaceProposalKind`: 'rozejm' przez pierwsze
   * AI_ROZEJM_DO_TUR tur wojny, potem 'pokoj'; `oferuj_trybut_za_pokoj` = 'pokoj'). Brak pola (stary zapis) = 'pokoj'.
   * Rozejm ma własną bazę PW (rozejm, nie pokoj) i kończy się rozejmem (truceTurns), a nie pełnym pokojem z blokadą.
   */
  kind?: AiPeaceKind;
  /** Tura złożenia prośby (pierwszej — kolejne prośby tej samej pary jej nie odnawiają). */
  sinceTurn: number;
}

export type AiPeaceRequestStore = Map<string, AiPeaceRequest>;

/** Rejestruje prośbę; zwraca true tylko dla NOWEJ prośby (licznik tur biegnie od pierwszej). */
export function registerAiPeaceRequest(
  store: AiPeaceRequestStore,
  pairKey: string,
  requesterId: number,
  otherId: number,
  turn: number,
  kind: AiPeaceKind = 'pokoj',
): boolean {
  if (store.has(pairKey)) return false;
  store.set(pairKey, { requesterId, otherId, sinceTurn: turn, kind });
  return true;
}

/** Ile tur minęło od prośby (>= 0). */
export function turnsSincePeaceRequest(req: AiPeaceRequest, turn: number): number {
  return Math.max(0, turn - req.sinceTurn);
}

/** Czy minął limit i pokój MUSI wejść w życie (zwycięzca nie ma już prawa odmówić). */
export function isForcedPeaceDue(
  req: AiPeaceRequest,
  turn: number,
  limit: number = AI_PEACE_TURNS_AFTER_REQUEST,
): boolean {
  return turnsSincePeaceRequest(req, turn) >= limit;
}

export interface ForcedPeacePairInput {
  /** true gdy strona jest człowiekiem (gracz/fotel). */
  aIsHuman: boolean;
  bIsHuman: boolean;
  aIsMajorAi: boolean;
  bIsMajorAi: boolean;
  eliminated: boolean;
  /** Para objęta wojną wymuszoną epoki (Kamień/Brąz/Żelazo) — własne zasady kończenia (decyzja R9). */
  forcedEpochWar: boolean;
  atWar: boolean;
}

/** Para kwalifikuje się do pokoju wymuszonego tylko gdy to zwykła wojna dwóch głównych AI (nie gracz, nie wymuszona). */
export function isForcedPeaceEligiblePair(p: ForcedPeacePairInput): boolean {
  if (p.aIsHuman || p.bIsHuman) return false;
  if (!p.aIsMajorAi || !p.bIsMajorAi) return false;
  if (p.eliminated || p.forcedEpochWar) return false;
  return p.atWar;
}

// ---------------------------------------------------------------------------
// Cena pokoju
// ---------------------------------------------------------------------------

export type PeaceAssetKind = 'zloto' | 'surowiec_ilosc' | 'miasto';

/** Majątek przegranego, którym może zapłacić (wycena w PW, ta sama jednostka co bilans traktatu). */
export interface PeaceAsset {
  kind: PeaceAssetKind;
  /** zloto: 'zloto'; surowiec_ilosc: klucz surowca; miasto: id miasta. */
  id: string;
  /** Ilość oferowana (złoto: ¤, surowiec: sztuki; miasto: 1). */
  amount: number;
  /** Wartość całej pozycji w PW. */
  pn: number;
  /** Miasto zakazane do cesji (stolica / ostatnie miasto). */
  forbidden?: boolean;
}

export interface PeacePaymentPlan {
  items: PeaceAsset[];
  /** Suma PW zapłaty. */
  coveredPn: number;
  /** Brak do pełnej ceny (>= 0). */
  shortfallPn: number;
  /** Czy zapłata pokrywa cenę w całości. */
  full: boolean;
  histogram: { zloto: number; surowiec_ilosc: number; miasto: number };
}

/**
 * Plan zapłaty przegranego za pokój: najpierw złoto, potem surowce (jeśli pokrywają resztę),
 * w ostateczności cesja JEDNEGO miasta (limit istniejącej reguły pokoju: max 1 miasto na propozycję)
 * — najtańszego pokrywającego resztę, a gdy żadne nie pokrywa, najcenniejszego. Gdy majątek nie wystarcza,
 * płaci się wszystko, co możliwe (maksimum). Czysta, deterministyczna (remisy: mniejsze id).
 */
export function planPeacePayment(requiredPn: number, assets: readonly PeaceAsset[]): PeacePaymentPlan {
  const need0 = Math.max(0, Math.ceil(requiredPn));
  const items: PeaceAsset[] = [];
  let covered = 0;
  const byId = (a: PeaceAsset, b: PeaceAsset): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  const gold = assets.find(a => a.kind === 'zloto' && a.amount > 0 && a.pn > 0);
  if (gold && need0 > 0) {
    const takePn = Math.min(gold.pn, need0);
    // 1 PW = amount/pn jednostek (zloto 1:1 przy skali domyślnej) — zaokrąglamy w górę, nie przekraczając zasobu.
    const takeAmount = Math.min(gold.amount, Math.ceil((takePn / gold.pn) * gold.amount));
    items.push({ ...gold, amount: takeAmount, pn: takePn });
    covered += takePn;
  }
  let rem = need0 - covered;

  const res = assets.filter(a => a.kind === 'surowiec_ilosc' && a.amount > 0 && a.pn > 0)
    .sort((a, b) => b.pn - a.pn || byId(a, b));
  const resTotal = res.reduce((s, a) => s + a.pn, 0);
  const cities = assets.filter(a => a.kind === 'miasto' && !a.forbidden && a.pn > 0)
    .sort((a, b) => a.pn - b.pn || byId(a, b));

  if (rem > 0) {
    if (resTotal >= rem) {
      for (const r of res) {
        if (rem <= 0) break;
        items.push(r);
        covered += r.pn;
        rem -= r.pn;
      }
    } else {
      // Surowce nie wystarczają: bierzemy wszystkie + miasto pokrywające resztę (najtańsze), inaczej najcenniejsze.
      for (const r of res) { items.push(r); covered += r.pn; }
      rem -= resTotal;
      if (rem > 0 && cities.length > 0) {
        const cover = cities.find(c => c.pn >= rem) ?? cities[cities.length - 1]!;
        items.push(cover);
        covered += cover.pn;
        rem -= cover.pn;
      }
    }
  }
  const histogram = { zloto: 0, surowiec_ilosc: 0, miasto: 0 };
  for (const it of items) histogram[it.kind] += 1;
  return {
    items,
    coveredPn: covered,
    shortfallPn: Math.max(0, need0 - covered),
    full: covered >= need0,
    histogram,
  };
}

/**
 * Udział siły prośącego (przegrywającego) w sumie siły pary (objective power). Zwycięzca = druga strona.
 * ZAŁOŻENIE „wyraźnie przegrywa" (dispatch B): prośba jest rejestrowana tylko gdy udział prośącego <= LOSER_MAX_SHARE_AT_REQUEST,
 * a wygasa (bez pokoju wymuszonego), gdy prośący jest już STRONGER niż druga strona (udział > LOSER_MAX_SHARE_KEEP).
 * Prośby z sygnałów pat/zmęczenie wojną (aiPeaceSignals) przy równowadze sił NIE tworzą przymusu pokoju.
 */
export const LOSER_MAX_SHARE_AT_REQUEST = 0.45;
export const LOSER_MAX_SHARE_KEEP = 0.5;

export function requesterShare(requesterPower: number, otherPower: number): number {
  const sum = requesterPower + otherPower;
  return sum > 0 ? requesterPower / sum : 0.5;
}
export function isClearlyLosing(share: number): boolean { return share <= LOSER_MAX_SHARE_AT_REQUEST; }
export function isStillLosing(share: number): boolean { return share <= LOSER_MAX_SHARE_KEEP; }

export type AiPeaceDecision =
  | { action: 'wait'; reason: string; balanceBefore: number; balanceAfter: number; turnsSince: number }
  | { action: 'accept_paid' | 'force'; reason: string; balanceBefore: number; balanceAfter: number; turnsSince: number };

export interface AiPeaceDecisionInput {
  req: AiPeaceRequest;
  turn: number;
  plan: PeacePaymentPlan;
  /** Bilans zwycięzcy PRZED zapłatą i PO zapłacie -- z istniejącej wyceny (peaceOfferAiOwnBilans), nie z konstrukcji. */
  balanceBeforePn: number;
  balanceAfterPn: number;
  /** Tolerancja bilansu zwycięzcy (aiOfferPwSurplusTolerance). */
  tolerancePn: number;
  /** Werdykt bramki zwycięzcy (evaluatePeaceAiGate): 'ok' | 'too_early' | 'stronger'. */
  winnerGateVerdict: 'ok' | 'too_early' | 'stronger';
  limit?: number;
  /** Bilans przegranego po zaplacie (jego wlasna wycena); brak = nie sprawdzany. Regula nieujemnego bilansu AI↔AI. */
  loserBalanceAfterPn?: number;
  /** Minimalny bilans AI↔AI (domyslnie z JSON). */
  minBalancePn?: number;
}

/**
 * Decyzja zwycięzcy:
 *  - po limicie tur od prośby → 'force' (zawsze, z płatnością maksymalną możliwą),
 *  - przed limitem → 'accept_paid' tylko gdy bramka zwycięzcy 'ok' ORAZ bilans po zapłacie >= -tolerancja,
 *  - inaczej 'wait'.
 */
export function decideAiPeaceRequest(inp: AiPeaceDecisionInput): AiPeaceDecision {
  const limit = inp.limit ?? AI_PEACE_TURNS_AFTER_REQUEST;
  const turnsSince = turnsSincePeaceRequest(inp.req, inp.turn);
  const balanceBefore = Math.round(inp.balanceBeforePn);
  const balanceAfter = Math.round(inp.balanceAfterPn);
  // Regula wlasciciela 2026-11-09: ujemny bilans ktorejkolwiek AI blokuje pokoj -- takze po limicie tur (wymuszenie).
  if (!isAiAiPeaceBalanceAllowed(inp.balanceAfterPn, inp.loserBalanceAfterPn, inp.minBalancePn)) {
    return { action: 'wait', reason: 'ujemny bilans PW jednej z AI (pokoj AI↔AI zablokowany)', balanceBefore, balanceAfter, turnsSince };
  }
  if (turnsSince >= limit) {
    return { action: 'force', reason: `limit ${limit} tur od prośby`, balanceBefore, balanceAfter, turnsSince };
  }
  if (inp.winnerGateVerdict !== 'ok') {
    return { action: 'wait', reason: `bramka zwycięzcy: ${inp.winnerGateVerdict}`, balanceBefore, balanceAfter, turnsSince };
  }
  if (inp.plan.full || balanceAfter >= -inp.tolerancePn) {
    return { action: 'accept_paid', reason: 'bilans zwycięzcy w tolerancji po zapłacie', balanceBefore, balanceAfter, turnsSince };
  }
  return { action: 'wait', reason: 'bilans zwycięzcy poniżej tolerancji (zapłata za mała)', balanceBefore, balanceAfter, turnsSince };
}

// ---------------------------------------------------------------------------
// Tick rozstrzygający prośby (logika wołana z main.ts; zależności wstrzykiwane => test uruchamia PRAWDZIWĄ logikę)
// ---------------------------------------------------------------------------

export interface AiPeaceTickDeps {
  store: AiPeaceRequestStore;
  turn: number;
  limit?: number;
  /** Para nadal kwalifikuje się (zwykła wojna dwóch głównych AI). */
  pairEligible: (a: number, b: number) => boolean;
  /** Udział siły prośącego w parze (requesterShare). */
  requesterShareOf: (requester: number, other: number) => number;
  /** Bramka pokoju zwycięzcy (evaluatePeaceAiGate). */
  gateVerdict: (winner: number, loser: number) => 'ok' | 'too_early' | 'stronger';
  /** Cena z istniejącej wyceny: wymagane PW od przegranego + bilans zwycięzcy dla danej zapłaty + tolerancja. */
  price: (winner: number, loser: number, kind: AiPeaceKind) => {
    requiredPn: number;
    balanceFor: (coveredPn: number) => number;
    tolerancePn: number;
    /** Bilans przegranego po zaplacie `coveredPn` (jego wlasna wycena). Brak = nie sprawdzany. */
    loserBalanceFor?: (coveredPn: number) => number;
  };
  assets: (loser: number, winner: number, skipCityIds: ReadonlySet<string>) => PeaceAsset[];
  /** Pre-kontrola wykonalności cesji miasta (planCityCession). */
  cityCessionOk: (cityId: string, loser: number, winner: number) => boolean;
  /** Trwa bitwa oczekująca na rozstrzygnięcie: tick MUSI mimo to zadziałać (gwarancja T+2), ale bez cesji miast. */
  battlePending: boolean;
  pay: (loser: number, winner: number, plan: PeacePaymentPlan) => void;
  finalize: (loser: number, winner: number, kind: AiPeaceKind) => void;
  log?: (msg: string) => void;
}

export interface AiPeaceTickOutcome {
  pairKey: string;
  action: 'wait' | 'accept_paid' | 'force' | 'dropped_ineligible' | 'dropped_not_losing';
  kind: AiPeaceKind;
  plan?: PeacePaymentPlan;
  decision?: AiPeaceDecision;
}

export function runAiAiPeaceTick(d: AiPeaceTickDeps): AiPeaceTickOutcome[] {
  const out: AiPeaceTickOutcome[] = [];
  for (const [key, req] of Array.from(d.store.entries())) {
    const loser = req.requesterId;
    const winner = req.otherId;
    const kind: AiPeaceKind = req.kind ?? 'pokoj';
    if (!d.pairEligible(loser, winner)) {
      d.store.delete(key);
      out.push({ pairKey: key, action: 'dropped_ineligible', kind });
      continue;
    }
    if (!isStillLosing(d.requesterShareOf(loser, winner))) {
      d.store.delete(key);
      out.push({ pairKey: key, action: 'dropped_not_losing', kind });
      continue;
    }
    const price = d.price(winner, loser, kind);
    const skipCities = new Set<string>();
    const planFor = (): PeacePaymentPlan => {
      const assets = d.assets(loser, winner, skipCities)
        .map(a => (d.battlePending && a.kind === 'miasto' ? { ...a, forbidden: true } : a));
      return planPeacePayment(price.requiredPn, assets);
    };
    let plan = planFor();
    for (let guard = 0; guard < 8; guard++) {
      const cityItem = plan.items.find(i => i.kind === 'miasto');
      if (!cityItem || d.cityCessionOk(cityItem.id, loser, winner)) break;
      skipCities.add(cityItem.id);
      plan = planFor();
    }
    const decision = decideAiPeaceRequest({
      req,
      turn: d.turn,
      plan,
      balanceBeforePn: price.balanceFor(0),
      balanceAfterPn: price.balanceFor(plan.coveredPn),
      loserBalanceAfterPn: price.loserBalanceFor?.(plan.coveredPn),
      tolerancePn: price.tolerancePn,
      winnerGateVerdict: d.gateVerdict(winner, loser),
      limit: d.limit,
    });
    if (decision.action === 'wait') {
      out.push({ pairKey: key, action: 'wait', kind, plan, decision });
      continue;
    }
    d.pay(loser, winner, plan);
    d.log?.(
      `pokój AI${loser}↔AI${winner} [${kind}] (${decision.action}, tury od prośby ${decision.turnsSince}); `
      + `bilans zwycięzcy przed ${decision.balanceBefore} -> po ${decision.balanceAfter}; zapłata `
      + `zloto=${plan.histogram.zloto} surowce=${plan.histogram.surowiec_ilosc} miasto=${plan.histogram.miasto} `
      + `(${plan.coveredPn}/${price.requiredPn} PW)`,
    );
    d.finalize(loser, winner, kind);
    d.store.delete(key);
    out.push({ pairKey: key, action: decision.action, kind, plan, decision });
  }
  return out;
}
