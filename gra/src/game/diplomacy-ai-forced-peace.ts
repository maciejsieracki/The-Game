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

const FALLBACK_TURNS = 2;

/** Liczba tur od prośby o pokój, po której pokój AI↔AI wchodzi w życie automatycznie. */
export function aiPeaceTurnsAfterRequest(raw: unknown = aiParamsRaw): number {
  const entry = (raw as Record<string, { wartosc?: unknown } | undefined>)['tury_do_pokoju_po_prosbie'];
  const v = entry?.wartosc;
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.floor(v) : FALLBACK_TURNS;
}

export const AI_PEACE_TURNS_AFTER_REQUEST: number = aiPeaceTurnsAfterRequest();

/** Prośba o pokój: `requesterId` = przegrywający (prosi), `otherId` = zwycięzca (musi przyjąć). */
export interface AiPeaceRequest {
  requesterId: number;
  otherId: number;
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
): boolean {
  if (store.has(pairKey)) return false;
  store.set(pairKey, { requesterId, otherId, sinceTurn: turn });
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

/** Bilans pokoju dla ZWYCIĘZCY: zapłata − cena (przed zapłatą: −cena < 0). */
export function winnerPeaceBalance(coveredPn: number, requiredPn: number): number {
  return Math.round(coveredPn - Math.max(0, requiredPn));
}

export type AiPeaceDecision =
  | { action: 'wait'; reason: string; balanceBefore: number; balanceAfter: number; turnsSince: number }
  | { action: 'accept_paid' | 'force'; reason: string; balanceBefore: number; balanceAfter: number; turnsSince: number };

export interface AiPeaceDecisionInput {
  req: AiPeaceRequest;
  turn: number;
  requiredPn: number;
  plan: PeacePaymentPlan;
  /** Werdykt bramki zwycięzcy (evaluatePeaceAiGate): 'ok' | 'too_early' | 'stronger'. */
  winnerGateVerdict: 'ok' | 'too_early' | 'stronger';
  limit?: number;
}

/**
 * Decyzja zwycięzcy:
 *  - po limicie tur od prośby → 'force' (zawsze, z płatnością maksymalną możliwą),
 *  - przed limitem → 'accept_paid' tylko gdy bramka zwycięzcy 'ok' ORAZ bilans po zapłacie ≥ 0,
 *  - inaczej 'wait' (zwycięzca odrzuca: bilans < 0 bez zapłaty).
 */
export function decideAiPeaceRequest(inp: AiPeaceDecisionInput): AiPeaceDecision {
  const limit = inp.limit ?? AI_PEACE_TURNS_AFTER_REQUEST;
  const turnsSince = turnsSincePeaceRequest(inp.req, inp.turn);
  const balanceBefore = winnerPeaceBalance(0, inp.requiredPn);
  const balanceAfter = winnerPeaceBalance(inp.plan.coveredPn, inp.requiredPn);
  if (turnsSince >= limit) {
    return { action: 'force', reason: `limit ${limit} tur od prośby`, balanceBefore, balanceAfter, turnsSince };
  }
  if (inp.winnerGateVerdict !== 'ok') {
    return { action: 'wait', reason: `bramka zwycięzcy: ${inp.winnerGateVerdict}`, balanceBefore, balanceAfter, turnsSince };
  }
  if (balanceAfter >= 0) {
    return { action: 'accept_paid', reason: 'bilans zwycięzcy ≥ 0 po zapłacie', balanceBefore, balanceAfter, turnsSince };
  }
  return { action: 'wait', reason: 'bilans zwycięzcy < 0 (zapłata za mała)', balanceBefore, balanceAfter, turnsSince };
}
