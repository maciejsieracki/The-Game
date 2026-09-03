/**
 * diplomacy-border-march.ts — kara za nieautoryzowany przemarsz (D3-BORD, P5).
 * Pure: traktaty / wojna / typ jednostki → delta Zaufania u pary intruz→właściciel.
 * Wykrywanie heksów: UNITS+MAPA (`border-march-scan.ts`); hook endTurn: Integrator F.
 */
import diplomacyData from '../../data/diplomacy.json';
import { RodzajTraktatu } from '../types/diplomacy';
import type { Relation } from './diplomacy';
import {
  type ActiveDeal,
  type BarbarianCooperationGraceState,
  hasTreaty,
  normalizeTreatyKind,
  isBarbarianCooperationGraceActive,
} from './diplomacy-treaties';
import { diploPairKey } from './diplomacy-pn-engine';

/** Para intruz → właściciel terytorium (dedupe w jednej turze). */
export interface BorderMarchPair {
  intruderOwnerId: number;
  territoryOwnerId: number;
  /** true gdy choć jedna jednostka wojskowa na parze (domyślnie false). */
  isMilitary?: boolean;
  /**
   * Heks reprezentatywny pary (border-march-scan.ts `collectUnauthorizedBorderPairs`) —
   * do atrybucji komunikatu graczowi + skoku kamery (R-PRZEMARSZ-ATRYBUCJA-Q1=B). Opcjonalne —
   * wywołania/testy budujące pary ręcznie (np. diplomacy-border-march-test.cjs) go pomijają.
   */
  q?: number;
  r?: number;
}

/** Kontekst autoryzacji przemarszu dla jednej pary. */
export interface BorderMarchCheckContext {
  treaties: readonly ActiveDeal[];
  isMilitary: boolean;
  /** Opcjonalnie — status wojny = brak kary. */
  relation?: Relation;
  /**
   * R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1 (GOAL 2) — okres karencji po wygaśnięciu/
   * jednostronnym usunięciu WspolnaWalkaBarbarzyncy (patrz `diplomacy-treaties.ts`).
   * Oba pola opcjonalne i BACKWARD-COMPATIBLE: brak = zachowanie identyczne jak przed
   * tą rundą (żadna dodatkowa autoryzacja). Wymaga `turn` do sprawdzenia, czy okno
   * karencji dla tej pary jeszcze trwa — bez tury nie da się tego rozstrzygnąć czysto.
   */
  barbarianCooperationGrace?: BarbarianCooperationGraceState;
  turn?: number;
}

export interface BorderMarchParams {
  karaPrzemarszNieautoryzowany_zaufanie_perTura: number;
}

export interface BorderMarchPenaltyResult {
  relations: Map<string, Relation>;
  /** Liczba par, którym nałożono karę w tej turze. */
  penalizedPairs: number;
}

const DEFAULT_KARA = 5;

function clampZaufanie(z: number): number {
  return Math.max(0, Math.min(100, z));
}

function pairDedupeKey(pair: BorderMarchPair): string {
  return `${pair.intruderOwnerId}->${pair.territoryOwnerId}`;
}

function isAllianceTreaty(state: readonly ActiveDeal[], a: number, b: number): boolean {
  const deals = [...state];
  return (
    hasTreaty(deals, a, b, RodzajTraktatu.SojuszWojskowy)
    || hasTreaty(deals, a, b, 'sojusz_defensywny')
    || hasTreaty(deals, a, b, 'sojusz_pelny')
  );
}

/** Wasal (payer) u suzerena (receiver) — prawo przemarszu (akcja 12). */
function hasWasalMarchRights(
  treaties: readonly ActiveDeal[],
  intruderOwnerId: number,
  territoryOwnerId: number,
): boolean {
  for (const deal of treaties) {
    if (normalizeTreatyKind(deal.rodzaj) !== RodzajTraktatu.Wasalizacja) continue;
    const sides =
      deal.strony[0] === intruderOwnerId || deal.strony[1] === intruderOwnerId;
    const sidesOwner =
      deal.strony[0] === territoryOwnerId || deal.strony[1] === territoryOwnerId;
    if (!sides || !sidesOwner) continue;
    const eco = deal.ekonomia;
    if (
      eco?.payerOwnerId === intruderOwnerId
      && eco?.receiverOwnerId === territoryOwnerId
    ) {
      return true;
    }
  }
  return false;
}

/** Parametr kary z diplomacy.json (Panel-D export). */
export function loadBorderMarchParams(json: unknown = diplomacyData): BorderMarchParams {
  const def = DEFAULT_KARA;
  if (!json || typeof json !== 'object') {
    return { karaPrzemarszNieautoryzowany_zaufanie_perTura: def };
  }
  const params = (json as { params?: Record<string, unknown> }).params;
  const raw = params?.karaPrzemarszNieautoryzowany_zaufanie_perTura;
  const kara =
    typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : def;
  return { karaPrzemarszNieautoryzowany_zaufanie_perTura: kara };
}

/**
 * Czy intruz ma ważne uprawnienie do obecności na terytorium właściciela.
 * Wojna → true (brak kary reputacyjnej). Sojusz / traktaty graniczne / wasal.
 */
export function hasAuthorizedBorderCrossing(
  intruderOwnerId: number,
  territoryOwnerId: number,
  ctx: BorderMarchCheckContext,
): boolean {
  if (intruderOwnerId === territoryOwnerId) return true;
  if (ctx.relation?.status === 'wojna') return true;

  const { treaties, isMilitary } = ctx;

  if (isAllianceTreaty(treaties, intruderOwnerId, territoryOwnerId)) {
    return true;
  }
  if (hasWasalMarchRights(treaties, intruderOwnerId, territoryOwnerId)) {
    return true;
  }

  if (isMilitary) {
    const hasActiveTreaty = hasTreaty(
      [...treaties],
      intruderOwnerId,
      territoryOwnerId,
      RodzajTraktatu.PrawoWojskowePrzemarszu,
    ) || treaties.some(d =>
      d.strony.includes(intruderOwnerId)
      && d.strony.includes(territoryOwnerId)
      && (normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.WspolnaWalkaBarbarzyncy
        || d.wspolnaWalkaBarbarzyncy === true),
    );
    if (hasActiveTreaty) return true;
    // GOAL 2 — okres karencji: traktat WspolnaWalkaBarbarzyncy już nie istnieje w
    // `treaties`, ale para jest nadal autoryzowana przez `BARBARIAN_COOPERATION_TURNS`
    // tur od wygaśnięcia/usunięcia (patrz JSDoc `BorderMarchCheckContext.
    // barbarianCooperationGrace` wyżej).
    if (ctx.barbarianCooperationGrace && ctx.turn !== undefined) {
      return isBarbarianCooperationGraceActive(
        ctx.barbarianCooperationGrace,
        intruderOwnerId,
        territoryOwnerId,
        ctx.turn,
      );
    }
    return false;
  }

  return hasTreaty(
    [...treaties],
    intruderOwnerId,
    territoryOwnerId,
    RodzajTraktatu.OtwartGranice,
  );
}

/**
 * Nakłada −kara Zaufania na pary bez autoryzacji.
 * Dedupe: wiele jednostek tej samej pary → jedna kara.
 * Relacja kluczowana `diploPairKey(intruder, owner)`.
 */
export function applyUnauthorizedBorderPenalties(
  pairs: readonly BorderMarchPair[],
  relations: ReadonlyMap<string, Relation>,
  params: BorderMarchParams,
  resolveCtx: (pair: BorderMarchPair) => BorderMarchCheckContext,
): BorderMarchPenaltyResult {
  const kara = params.karaPrzemarszNieautoryzowany_zaufanie_perTura;
  const next = new Map(relations);
  const seen = new Set<string>();
  let penalizedPairs = 0;

  for (const pair of pairs) {
    const dedupe = pairDedupeKey(pair);
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const ctx = resolveCtx(pair);
    if (hasAuthorizedBorderCrossing(pair.intruderOwnerId, pair.territoryOwnerId, ctx)) {
      continue;
    }

    const key = diploPairKey(pair.intruderOwnerId, pair.territoryOwnerId);
    const rel = next.get(key) ?? { zaufanie: 20, respekt: 30, status: 'neutralni' as const };
    next.set(key, {
      ...rel,
      zaufanie: clampZaufanie(rel.zaufanie - kara),
    });
    penalizedPairs += 1;
  }

  return { relations: next, penalizedPairs };
}

/**
 * Jedna ukarana para z punktu widzenia atrybucji komunikatu (R-PRZEMARSZ-ATRYBUCJA-Q1=B):
 * KTO jest drugą stroną (nie gracz) i GDZIE (heks reprezentatywny pary, gdy znany — patrz
 * `BorderMarchPair.q/r`). `main.ts` tłumaczy `ownerId` na nazwę cywilizacji (civDisplayNameForOwner)
 * i `q`/`r` na skok kamery (axialToWorld + camCtrl.focusAt) — ta warstwa zostaje czystymi danymi.
 */
export interface BorderMarchViolationDetail {
  /** ownerId drugiej strony pary (NIE gracza) — patrz pola tablic niżej dla kontekstu roli. */
  ownerId: number;
  /** Heks reprezentatywny pary, gdy `BorderMarchPair` go niósł (opcjonalne, patrz tam). */
  q?: number;
  r?: number;
}

/** Wynik klasyfikacji par pod kątem komunikatu widocznego GRACZOWI (BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C). */
export interface PlayerBorderMarchNotice {
  /** true → ktoś wszedł na teren gracza (gracz = territoryOwnerId ukaranej pary). */
  playerBorderViolated: boolean;
  /** true → jednostka gracza stoi na cudzym terenie (gracz = intruderOwnerId ukaranej pary). */
  playerTrespassing: boolean;
  /**
   * Cywilizacje naruszające teren gracza (jedna pozycja na ukaraną parę, `ownerId` = intruz).
   * Puste gdy `playerBorderViolated` = false. R-PRZEMARSZ-ATRYBUCJA-Q1=B.
   */
  violatingIntruders: readonly BorderMarchViolationDetail[];
  /**
   * Cywilizacje, na których terenie stoi jednostka gracza (jedna pozycja na ukaraną parę,
   * `ownerId` = właściciel terenu). Puste gdy `playerTrespassing` = false. R-PRZEMARSZ-ATRYBUCJA-Q1=B.
   */
  trespassedOwners: readonly BorderMarchViolationDetail[];
}

/**
 * Klasyfikuje ukarane pary pod kątem tego, czy GRACZ (`playerOwnerId`, domyślnie 0 —
 * konwencja `ownerId === 0` z main.ts) był jedną ze stron. Para obcy↔obcy (ani intruz, ani
 * właściciel = gracz) jest zawsze pomijana — stąd `main.ts` NIE POWINIEN pokazywać żadnego
 * komunikatu graczowi dla takiej pary.
 *
 * Czysta funkcja — używa TEGO SAMEGO testu autoryzacji (`hasAuthorizedBorderCrossing`) co
 * `applyUnauthorizedBorderPenalties`, żeby klasyfikacja widziała dokładnie te same ukarane
 * pary (autoryzowane przemarsze — sojusz/wasal/traktat/wojna — nigdy nie trafiają do wyniku).
 * NIE liczy kary ponownie i NIE modyfikuje `relations` — czyste odczytanie `pairs`.
 */
export function classifyPlayerBorderMarchNotice(
  pairs: readonly BorderMarchPair[],
  resolveCtx: (pair: BorderMarchPair) => BorderMarchCheckContext,
  playerOwnerId = 0,
): PlayerBorderMarchNotice {
  let playerBorderViolated = false;
  let playerTrespassing = false;
  const violatingIntruders: BorderMarchViolationDetail[] = [];
  const trespassedOwners: BorderMarchViolationDetail[] = [];
  for (const pair of pairs) {
    if (pair.intruderOwnerId !== playerOwnerId && pair.territoryOwnerId !== playerOwnerId) continue;
    if (hasAuthorizedBorderCrossing(pair.intruderOwnerId, pair.territoryOwnerId, resolveCtx(pair))) {
      continue;
    }
    if (pair.territoryOwnerId === playerOwnerId) {
      playerBorderViolated = true;
      violatingIntruders.push({ ownerId: pair.intruderOwnerId, q: pair.q, r: pair.r });
    }
    if (pair.intruderOwnerId === playerOwnerId) {
      playerTrespassing = true;
      trespassedOwners.push({ ownerId: pair.territoryOwnerId, q: pair.q, r: pair.r });
    }
  }
  return { playerBorderViolated, playerTrespassing, violatingIntruders, trespassedOwners };
}

/** Dedupe par intruz→owner (UNITS może wołać przed apply). */
export function dedupeBorderMarchPairs(pairs: readonly BorderMarchPair[]): BorderMarchPair[] {
  const map = new Map<string, BorderMarchPair>();
  for (const pair of pairs) {
    const key = pairDedupeKey(pair);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...pair });
      continue;
    }
    map.set(key, {
      ...prev,
      isMilitary: prev.isMilitary || pair.isMilitary === true,
    });
  }
  return [...map.values()];
}
