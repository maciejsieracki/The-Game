/**
 * ai-ai-treaty-evaluate.ts -- R-WEB-AI-AI-TREATIES-E1-EVALUATE-PURE-Q1 (etap E1 projektu AI-AI-TREATIES-DESIGN).
 *
 * CZYSTA funkcja oceny propozycji traktatu między dwiema AI: `evaluateTreatyOffer(ctx)`.
 * Niewpięta w grę (main.ts, ai.ts, diplomacy.ts nie wołają tego modułu w E1). Bez Math.random, bez Date,
 * bez DOM, bez importu main.ts. Wejście nie jest modyfikowane.
 *
 * Akcje objęte oceną: 'nap' (15 tur), 'sojusz_defensywny', 'sojusz_pelny', 'granice' (przemarsz).
 * Każda inna akcja oraz każdy wasal (proposer/target) -> `unsupported: true`, accept = false.
 *
 * Bramki (kolejność stała, pierwsza odmowa wygrywa):
 *   1. nieobsługiwane (akcja spoza zakresu, wasal);
 *   2. wojna między stronami (traktat nie może być zawarty w stanie wojny);
 *   3. duplikat (istniejący NAP / sojusz tej pary);
 *   4. granica (przemarsz wymaga wspólnej granicy — dane podaje wołający);
 *   5. gotowość: stance.willingnessAlly >= progSojuszWillingnessMin (diplomacy.json, 0,54);
 *   6. Relacja/Zaufanie: NAP -> progNapRelacja + progNapZaufanie (jak ścieżka AI, ai.ts P3b);
 *      sojusz -> allianceCoreMet (progSojuszRelacja / progSojuszZaufanie, nie poniżej progUmowaMinRelacja);
 *      przemarsz -> diplomacyTreatyMinRelacja(prog_relacja z diplomacy-acceptance-points.json);
 *   7. sojusz z wrogiem: sojusz odrzucony, gdy sojusznik jednej strony jest wrogiem drugiej
 *      (założenie E1: wspólni wrogowie sami w sobie NIE blokują — dane podaje wołający);
 *   8. skarbiec płatnika: dopłata D (parytet siły, płaci słabsza strona WYŁĄCZNIE złotem) nie może
 *      przekroczyć skarbca płatnika (skarbiec nigdy poniżej zera; brak -> odmowa „brakuje X PN”).
 *
 * Parytet: X = treatyParityBaseX (ta sama funkcja co ścieżka gracza), S/W/D/r = peacePwPointsByPowerRatio
 * (ta sama funkcja co pokój AI↔AI). Brak różnicy mocy (r = 1) -> D = 0, płatnik null.
 *
 * Pola `breachRelationDelta` / `breachTrustDelta` NIE są naliczane przy zawarciu: to KARA za zerwanie tej umowy
 * (P-4 A: −30 Relacji, −20 Zaufania; parametry w gra/data/ai-ai-treaty-params.json). `durationTurns`
 * dla NAP = 15 (P-5 A). `callToWar` przy zaakceptowanym sojuszu = true (P-7 A: wezwanie wykonuje
 * istniejąca kaskada, tu tylko pole wyniku, bez wykonania).
 */
import aiAiTreatyParamsJson from '../../data/ai-ai-treaty-params.json';
import acceptancePointsJson from '../../data/diplomacy-acceptance-points.json';
import {
  allianceCoreMet,
  diplomacyTreatyMinRelacja,
  getEffectiveDiplomacyParams,
  type DiplomacyParams,
} from './diplomacy';
import { treatyParityBaseX, type ProposalPayload } from './diplomacy-proposals';
import { peacePwPointsByPowerRatio, type PeacePwPowerSplit } from './war-weariness';

/** Akcje, które E1 ocenia. Wszystko inne = unsupported. */
export type AiAiTreatyAction = 'nap' | 'sojusz_defensywny' | 'sojusz_pelny' | 'granice';

export const AI_AI_TREATY_ACTIONS: readonly AiAiTreatyAction[] = ['nap', 'sojusz_defensywny', 'sojusz_pelny', 'granice'];

/** Stan wojny między stronami (z diplomacy.ts: Relation.status + stan rozejmu/pokoju). */
export type AiAiWarStatus = 'wojna' | 'rozejm' | 'pokoj' | 'sojusz' | 'neutralni';

export interface AiAiTreatySide {
  /** Moc obiektywna strony (power-objective). */
  power: number;
  /** Skarbiec w złocie (¤). Używany tylko gdy strona jest płatnikiem D. */
  treasuryGold: number;
  /** Wasal: E1 nie obsługuje wasali (P-6 A). */
  isVassal?: boolean;
  /** Identyfikatory sojuszników strony (ownerId). */
  allies: readonly number[];
  /** Identyfikatory wrogów strony (ownerId, stan wojny). */
  enemies: readonly number[];
}

export interface AiAiTreatyEvalContext {
  actionId: string;
  proposer: AiAiTreatySide;
  target: AiAiTreatySide;
  /** Relacja pary (suma, jak relationScore). */
  relacja: number;
  /** Zaufanie pary. */
  zaufanie: number;
  /** Gotowość celu wg aiDiplomacyStance(...).willingnessAlly (liczy wołający). */
  willingness: number;
  warStatus: AiAiWarStatus;
  /** Istniejący NAP tej pary. */
  hasNap: boolean;
  /** Istniejący sojusz tej pary (dowolny rodzaj). */
  hasAlliance: boolean;
  /** Wspólna granica (wymagana przez akcję 'granice'); dane dostarcza wołający (E1 nie liczy mapy). */
  sharesBorder: boolean;
  /** Zmęczenie wojną pary L (0..1) — tylko do wyceny X (rozejm go używa; w E1 nieużywany dla 4 akcji). */
  wearinessLevel?: number;
  /** Opcjonalne nadpisanie parametrów diplomacji (testy). Domyślnie getEffectiveDiplomacyParams(). */
  params?: DiplomacyParams;
  /** Opcjonalne nadpisanie parametrów AI↔AI (testy). Domyślnie gra/data/ai-ai-treaty-params.json. */
  treatyParams?: AiAiTreatyParams;
}

export interface AiAiTreatyParams {
  napCzasTur: number;
  zerwanieRelacja: number;
  zerwanieZaufanie: number;
}

export interface AiAiTreatyParity {
  S: number;
  W: number;
  D: number;
  r: number;
}

export interface AiAiTreatyEvalResult {
  accept: boolean;
  reason: string;
  /** Dopłata D złotem od płatnika (0, gdy brak płatnika). */
  paymentGold: number;
  payer: 'proposer' | 'target' | null;
  parity: AiAiTreatyParity;
  /** Kara za zerwanie tej umowy (P-4): −30 Relacji. Nie nalicza się przy zawarciu. */
  breachRelationDelta?: number;
  /** Kara za zerwanie tej umowy (P-4): −20 Zaufania. Nie nalicza się przy zawarciu. */
  breachTrustDelta?: number;
  /** Czas trwania w turach (NAP = 15; sojusze/przemarsz bezterminowe = brak pola). */
  durationTurns?: number;
  /** Sojusz zaakceptowany: wezwanie do wojny obsługuje istniejąca kaskada (P-7 A). */
  callToWar?: boolean;
  /** true = akcja/strona spoza zakresu E1 (wasal, nieznana akcja). */
  unsupported?: boolean;
}

const ACCEPTANCE_TRAKTATY = (acceptancePointsJson as { traktaty: Record<string, { prog_relacja?: number } | undefined> }).traktaty;
const TREATY_PARAMS_DEFAULT: AiAiTreatyParams = {
  napCzasTur: (aiAiTreatyParamsJson as { nap_czas_trwania_tur: number }).nap_czas_trwania_tur,
  zerwanieRelacja: (aiAiTreatyParamsJson as { zerwanie_relacja: number }).zerwanie_relacja,
  zerwanieZaufanie: (aiAiTreatyParamsJson as { zerwanie_zaufanie: number }).zerwanie_zaufanie,
};

const ZERO_PARITY: AiAiTreatyParity = { S: 0, W: 0, D: 0, r: 1 };

let dopłataMnoznikNadpisanieTest: number | null = null;

/** Tylko testy/pomiar (hak civTest). null = wróć do wartości z danych. */
export function setAiAiDopłataMnoznikForTest(value: number | null): void {
  dopłataMnoznikNadpisanieTest = value;
}

/**
 * R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1: mnożnik dopłaty D WYŁĄCZNIE dla ścieżki AI↔AI (dane:
 * dopłataDMnoznikAiAi, domyślnie 1,0 = bez zmiany). Nieskończony / ujemny -> 1,0 (bezpieczny fallback).
 */
export function aiAiDopłataMnoznik(): number {
  const v = dopłataMnoznikNadpisanieTest ?? (aiAiTreatyParamsJson as { dopłataDMnoznikAiAi?: unknown }).dopłataDMnoznikAiAi;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 1;
}

function isAiAiTreatyAction(actionId: string): actionId is AiAiTreatyAction {
  return (AI_AI_TREATY_ACTIONS as readonly string[]).includes(actionId);
}

function isAllianceAction(actionId: AiAiTreatyAction): boolean {
  return actionId === 'sojusz_defensywny' || actionId === 'sojusz_pelny';
}

/** Czy któryś sojusznik jednej strony jest wrogiem drugiej (sojusz z wrogiem). */
function allianceWithEnemy(a: AiAiTreatySide, b: AiAiTreatySide): boolean {
  return a.allies.some(x => b.enemies.includes(x)) || b.allies.some(x => a.enemies.includes(x));
}

/** Parytet siły i dopłata D — ta sama wycena co treatyParity* (diplomacy-proposals) i peacePwPointsByPowerRatio. */
function parityOf(
  actionId: AiAiTreatyAction,
  ctx: AiAiTreatyEvalContext,
  treatyTurns: number,
): PeacePwPowerSplit {
  const payload: ProposalPayload = actionId === 'nap' ? { treatyTurns } : {};
  const X = treatyParityBaseX(actionId, payload, ctx.wearinessLevel ?? 0);
  return peacePwPointsByPowerRatio(X, ctx.proposer.power, ctx.target.power);
}

function refuse(reason: string, parity: AiAiTreatyParity = ZERO_PARITY): AiAiTreatyEvalResult {
  return { accept: false, reason, paymentGold: 0, payer: null, parity };
}

/**
 * Czysta ocena propozycji traktatu AI↔AI. Deterministyczna: to samo wejście -> to samo wyjście.
 */
export function evaluateTreatyOffer(ctx: AiAiTreatyEvalContext): AiAiTreatyEvalResult {
  const params = ctx.params ?? getEffectiveDiplomacyParams();
  const treatyParams = ctx.treatyParams ?? TREATY_PARAMS_DEFAULT;

  // 1. Zakres: akcja obsługiwana, żadna ze stron nie jest wasalem.
  if (!isAiAiTreatyAction(ctx.actionId) || ctx.proposer.isVassal === true || ctx.target.isVassal === true) {
    return { ...refuse('nieobsługiwane w tym kroku (wasal lub akcja spoza zakresu E1)'), unsupported: true };
  }
  const actionId = ctx.actionId;
  const napTurns = treatyParams.napCzasTur;
  const split = parityOf(actionId, ctx, napTurns);
  const parity: AiAiTreatyParity = { S: split.S, W: split.W, D: split.D, r: split.r };

  // 2. Wojna między stronami.
  if (ctx.warStatus === 'wojna') {
    return refuse('strony są w stanie wojny', parity);
  }

  // 3. Duplikaty.
  if (actionId === 'nap' && ctx.hasNap) {
    return refuse('pakt o nieagresji już istnieje', parity);
  }
  if (isAllianceAction(actionId) && ctx.hasAlliance) {
    return refuse('sojusz już istnieje', parity);
  }

  // 4. Granica (przemarsz).
  if (actionId === 'granice' && !ctx.sharesBorder) {
    return refuse('brak wspólnej granicy dla przemarszu', parity);
  }

  // 5. Gotowość celu (jeden próg z danych diplomacji, 0,54).
  if (!(ctx.willingness >= params.progSojuszWillingnessMin)) {
    return refuse(
      `gotowość ${ctx.willingness.toFixed(2)} poniżej progu ${params.progSojuszWillingnessMin.toFixed(2)}`,
      parity,
    );
  }

  // 6. Relacja i Zaufanie.
  if (actionId === 'nap') {
    if (ctx.relacja < params.progNapRelacja || ctx.zaufanie < params.progNapZaufanie) {
      return refuse(
        `Relacja ${ctx.relacja} / Zaufanie ${ctx.zaufanie} poniżej progu paktu (${params.progNapRelacja} / ${params.progNapZaufanie})`,
        parity,
      );
    }
  } else if (isAllianceAction(actionId)) {
    if (!allianceCoreMet(ctx.zaufanie, ctx.relacja, params.progSojuszRelacja, params)) {
      return refuse(
        `Relacja ${ctx.relacja} / Zaufanie ${ctx.zaufanie} poniżej rdzenia sojuszu (${params.progSojuszRelacja} / ${params.progSojuszZaufanie})`,
        parity,
      );
    }
  } else {
    const progRelacja = ACCEPTANCE_TRAKTATY[actionId]?.prog_relacja ?? 0;
    if (ctx.relacja < diplomacyTreatyMinRelacja(progRelacja, params)) {
      return refuse(`Relacja ${ctx.relacja} poniżej progu przemarszu`, parity);
    }
  }

  // 7. Sojusz z wrogiem.
  if (isAllianceAction(actionId) && allianceWithEnemy(ctx.proposer, ctx.target)) {
    return refuse('sojusz z wrogiem drugiej strony', parity);
  }

  // 8. Dopłata D złotem od słabszej strony; skarbiec nigdy poniżej zera.
  // Mnożnik dopłaty D (tylko AI↔AI, domyślnie 1,0 = bit-w-bit jak dotąd; parity.D pozostaje nieskalowane).
  const mnoznik = aiAiDopłataMnoznik();
  const D = mnoznik === 1 ? split.D : Math.round(split.D * mnoznik);
  if (D > 0) {
    const payer: 'proposer' | 'target' = split.strongerSide === 'a' ? 'target' : 'proposer';
    const treasury = payer === 'proposer' ? ctx.proposer.treasuryGold : ctx.target.treasuryGold;
    const have = Math.max(0, Math.floor(treasury));
    if (D > have) {
      return refuse(`brakuje ${D - have} PN w skarbcu płatnika (dopłata D = ${D})`, parity);
    }
    return {
      accept: true,
      reason: 'OK',
      paymentGold: D,
      payer,
      parity,
      ...acceptedExtras(actionId, treatyParams),
    };
  }

  return {
    accept: true,
    reason: 'OK',
    paymentGold: 0,
    payer: null,
    parity,
    ...acceptedExtras(actionId, treatyParams),
  };
}

function acceptedExtras(actionId: AiAiTreatyAction, treatyParams: AiAiTreatyParams): Partial<AiAiTreatyEvalResult> {
  const extras: Partial<AiAiTreatyEvalResult> = {};
  // Kara P-4 dotyczy zerwania NAP i sojuszu (nie przemarszu).
  if (actionId === 'nap' || isAllianceAction(actionId)) {
    extras.breachRelationDelta = treatyParams.zerwanieRelacja;
    extras.breachTrustDelta = treatyParams.zerwanieZaufanie;
  }
  if (actionId === 'nap') extras.durationTurns = treatyParams.napCzasTur;
  if (isAllianceAction(actionId)) extras.callToWar = true;
  return extras;
}
