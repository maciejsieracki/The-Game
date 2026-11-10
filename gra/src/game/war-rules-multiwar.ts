/**
 * war-rules-multiwar.ts -- R-WEB-WAR-RULES-MULTIWAR-Q1 (regula TYMCZASOWA).
 *
 * Czysty moduł (zero DOM, zero RNG, zero dostępu do stanu gry). Zawiera:
 *  - bramki wypowiadania wojen (R1 opóźnienie do tury 40, R2 limit równoczesnych wojen
 *    w Kamieniu na cywilizację; R3 aktywne: max 1 wojna epoki na epokę globalnie -- patrz `canDeclareEraForcedWar`),
 *  - wybór celu zaangażowania (W1: armia najpierw walczy z najbliższą armią wroga),
 *  - przydział grup armii do wrogów (W2: podział armii przy k>1 wojnach, proporcjonalnie
 *    do siły przeciwników, całe zgrupowania, bez dzielenia).
 *
 * Wartości progów są w `gra/data/war-rules-params.json` (nie w kodzie).
 * FLAGA: `WAR_RULES_MULTIWAR_ENABLED` -- OFF = dotychczasowe zachowanie (wołający
 * nie czyta tych funkcji / nie przekazuje kontekstu do planera).
 */

import warRulesParamsRaw from '../../data/war-rules-params.json';

export interface WarRulesParams {
  delayInterCivWarsUntilTurn: number;
  /** R-WEB-ERA-WAR-40-TURNS-NONOVERLAP-Q1: próg od wejścia TEGO ownera w Stone/Bronze/Iron. */
  eraForcedWarStartTurnsFromEra: { stone: number; bronze: number; iron: number };
  /** R-WEB-ERA-DELAY-Q1: epoki wojen wymuszonych, dla których bramka R1 (tura 40) NIE obowiązuje. */
  eraForcedWarIgnoreR1: ForcedEraTag[];
  maxConcurrentWarsStone: number | null;
  maxConcurrentWarsFromBronze: number | null;
  /** R3 (r3, właściciel 2026-10-25): najwyżej N wojen epoki na epokę w skali świata (`null` = bez limitu). R-WEB-ERA-WAR-COUNTER-Q1: `null` (limit globalny zniesiony). */
  maxEraForcedWarsPerEra: number | null;
  /** R-WEB-ERA-WAR-COUNTER-Q1: najwyżej N wojen epoki na JEDNĄ cywilizację (także gracza, napastnik LUB cel) w jednej epoce (`null` = bez limitu). */
  maxEraForcedWarsPerCivPerEra: number | null;
  /** R-WEB-ERA-WAR-COUNTER-Q1: epoki, dla których wolno wypowiadać wojny wymuszone (`["stone"]` = tylko Kamień). */
  enabledForcedWarEras: ForcedEraTag[];
  engageRadiusHexes: number;
  splitArmyByWarCount: boolean;
}

export const WAR_RULES_PARAMS: WarRulesParams = {
  delayInterCivWarsUntilTurn: warRulesParamsRaw.delayInterCivWarsUntilTurn,
  eraForcedWarStartTurnsFromEra: warRulesParamsRaw.eraForcedWarStartTurnsFromEra,
  eraForcedWarIgnoreR1: warRulesParamsRaw.eraForcedWarIgnoreR1 as ForcedEraTag[],
  maxConcurrentWarsStone: warRulesParamsRaw.maxConcurrentWarsStone,
  maxConcurrentWarsFromBronze: warRulesParamsRaw.maxConcurrentWarsFromBronze,
  maxEraForcedWarsPerEra: warRulesParamsRaw.maxEraForcedWarsPerEra,
  maxEraForcedWarsPerCivPerEra: warRulesParamsRaw.maxEraForcedWarsPerCivPerEra,
  enabledForcedWarEras: warRulesParamsRaw.enabledForcedWarEras as ForcedEraTag[],
  engageRadiusHexes: warRulesParamsRaw.engageRadiusHexes,
  splitArmyByWarCount: warRulesParamsRaw.splitArmyByWarCount,
};

/** GŁÓWNA FLAGA reguł wojen (OFF = baza, hash stanu identyczny). */
export const WAR_RULES_MULTIWAR_ENABLED = true;

let overrideValue: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF; null = wróć do stałej. */
export function setWarRulesMultiwarOverride(value: boolean | null): void {
  overrideValue = value;
}

export function isWarRulesMultiwarEnabled(): boolean {
  return overrideValue !== null ? overrideValue : WAR_RULES_MULTIWAR_ENABLED;
}

/**
 * R-WEB-WAR-EPOCH-PLAYER-FIRST-Q1 — GŁÓWNA FLAGA (OFF = baza, hash identyczny): gracz
 * pierwszy w parowaniu wojny epoki (Z1/Z3/Z4), wojna z najbliższą cywilizacją mimo mgły
 * (K1), jedna FALA na epokę zamiast jednej wojny na świat (Z5), bramka wojny gracza
 * sterowana opcją nowej gry `playerEpochWarEnabled` (K2, tylko przy fladze ON).
 */
export const WAR_EPOCH_PLAYER_FIRST_ENABLED = true;

let epochPlayerFirstOverride: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF; null = wróć do stałej. */
export function setWarEpochPlayerFirstOverride(value: boolean | null): void {
  epochPlayerFirstOverride = value;
}

export function isWarEpochPlayerFirstEnabled(): boolean {
  return epochPlayerFirstOverride !== null ? epochPlayerFirstOverride : WAR_EPOCH_PLAYER_FIRST_ENABLED;
}

/** Epoka Kamienia (zgodnie z `empireEpochForOwner(...) === 1` w main.ts). */
export const WAR_ERA_STONE = 1;
/** Epoka Brązu i późniejsze: brak limitu równoczesnych wojen (parametr `null`). */
export const WAR_ERA_BRONZE = 2;

/** R1: czy wojny między cywilizacjami są już dozwolone w tej turze. */
export function isInterCivWarOpenAtTurn(
  turn: number,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  return turn >= params.delayInterCivWarsUntilTurn;
}

/**
 * R-WEB-ERA-DELAY-Q1: czy wojna epoki tego tagu omija bramkę R1 (tura 40). Kamień -> false
 * (R1 zostaje); Brąz/Żelazo -> true (wg `eraForcedWarIgnoreR1`). `null` (zwykłe wypowiedzenie) -> false.
 */
export function isEraForcedWarIgnoringR1(
  tag: ForcedEraTag | null | undefined,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  return tag != null && params.eraForcedWarIgnoreR1.includes(tag);
}

/**
 * R-WEB-WAR-MARCH-BEFORE-40-Q1: czy kontekst wojenny / marsz AI pary jest otwarty w tej turze.
 * Otwarte po R1 (tura >= delayInterCivWarsUntilTurn) albo gdy para jest w AKTYWNEJ wojnie epoki
 * tagu omijającego R1 (Brąz/Żelazo). `activePairEraTag` = tag aktywnej wojny epoki tej pary
 * (z mapy aktywnych par), `null` = brak takiej wojny (np. Kamień, zwykłe wypowiedzenie).
 */
export function isWarMarchOpenForPair(
  turn: number,
  activePairEraTag: ForcedEraTag | null | undefined,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  return isInterCivWarOpenAtTurn(turn, params) || isEraForcedWarIgnoringR1(activePairEraTag, params);
}

/** R2: limit równoczesnych wojen cywilizacji w danej epoce (`null` = bez limitu). */
export function concurrentWarLimitForEra(
  era: number,
  params: WarRulesParams = WAR_RULES_PARAMS,
): number | null {
  if (era === WAR_ERA_STONE) return params.maxConcurrentWarsStone;
  return params.maxConcurrentWarsFromBronze;
}

export interface InterCivWarGateInput {
  turn: number;
  /** Epoka napastnika (1 = Kamień). */
  attackerEra: number;
  /** Liczba aktywnych wojen napastnika z INNYMI CYWILIZACJAMI (bez barbarzyńców, włącznie z graczem). */
  attackerWarCount: number;
  /** Cel jest graczem -- gracz nie ma limitu (jego wybór), ale napastnik AI nadal ma. */
  targetIsPlayer: boolean;
  /** Epoka celu (ignorowana gdy `targetIsPlayer`). */
  targetEra: number;
  /** Liczba aktywnych wojen celu (ignorowana gdy `targetIsPlayer`). */
  targetWarCount: number;
  /** R-WEB-ERA-DELAY-Q1: tag wojny epoki (`null`/brak = zwykłe wypowiedzenie, R1 obowiązuje). */
  eraTag?: ForcedEraTag | null;
}

export type WarGateReason = 'ok' | 'delay_r1' | 'stone_limit_attacker_r2' | 'stone_limit_target_r2';

/**
 * Bramka wypowiedzenia wojny między cywilizacjami (R1 + R2). Zwraca powód blokady
 * albo 'ok'. Napastnik AI w Kamieniu z już trwającą wojną nie wypowiada kolejnej, w tym
 * graczowi; cel AI w Kamieniu z już trwającą wojną nie może zostać zmuszony do kolejnej.
 */
export function evaluateInterCivWarGate(
  inp: InterCivWarGateInput,
  params: WarRulesParams = WAR_RULES_PARAMS,
): WarGateReason {
  if (!isInterCivWarOpenAtTurn(inp.turn, params) && !isEraForcedWarIgnoringR1(inp.eraTag, params)) return 'delay_r1';
  const attackerLimit = concurrentWarLimitForEra(inp.attackerEra, params);
  if (attackerLimit !== null && inp.attackerWarCount >= attackerLimit) return 'stone_limit_attacker_r2';
  if (!inp.targetIsPlayer) {
    const targetLimit = concurrentWarLimitForEra(inp.targetEra, params);
    if (targetLimit !== null && inp.targetWarCount >= targetLimit) return 'stone_limit_target_r2';
  }
  return 'ok';
}

/** Etykieta epoki wojny wymuszonej z powodu wypowiedzenia (prefiks `R-EPOKA-*-WYMUSZONA-WOJNA:`). */
export type ForcedEraTag = 'bronze' | 'stone' | 'iron';

const FORCED_EPOCH_WAR_POWOD_RE = /^R-EPOKA-(BRAZU|KAMIEN|ZELAZO)-WYMUSZONA-WOJNA:/;

/** Zwraca etykietę epoki, jeśli `powod` jest powodem wojny wymuszonej epoki; w przeciwnym razie null. */
export function forcedEraTagFromPowod(powod: string | undefined): ForcedEraTag | null {
  if (typeof powod !== 'string') return null;
  const m = FORCED_EPOCH_WAR_POWOD_RE.exec(powod);
  if (!m) return null;
  if (m[1] === 'BRAZU') return 'bronze';
  if (m[1] === 'KAMIEN') return 'stone';
  return 'iron';
}

/**
 * R3 (r3, PRZYWRÓCONE wg decyzji orkiestratora 2026-10-25): w CAŁEJ grze (skala świata,
 * nie na cywilizację) w każdej epoce wybucha najwyżej N wojen epoki (`maxEraForcedWarsPerEra`
 * = 1 w `war-rules-params.json`). `declaredByTag` = liczba już wypowiedzianych wojen epoki
 * danej etykiety. `null` = brak limitu.
 */
export function canDeclareEraForcedWar(
  tag: ForcedEraTag,
  declaredByTag: ReadonlyMap<ForcedEraTag, number>,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  if (params.maxEraForcedWarsPerEra === null) return true;
  return (declaredByTag.get(tag) ?? 0) < params.maxEraForcedWarsPerEra;
}

/**
 * R-WEB-ERA-WAR-COUNTER-Q1: czy wojny wymuszone danej epoki są włączone (flaga w JSON
 * `enabledForcedWarEras`). Wyłączona epoka = brak pending, przydziału i wypowiedzenia;
 * kod epoki zostaje nietknięty.
 */
export function isForcedEraWarEnabled(
  tag: ForcedEraTag,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  return params.enabledForcedWarEras.includes(tag);
}

/**
 * R-WEB-ERA-WAR-COUNTER-Q1: licznik wojen epoki per (cywilizacja, epoka). Klucz zawiera
 * numer epoki właściciela, więc awans epoki = nowy klucz = licznik odnawia się.
 * Wartość = ile wojen wymuszonych tego podmiotu (jako napastnik LUB cel) w tej epoce.
 */
export function eraWarCivKey(ownerId: number, epoch: number): string {
  return `${ownerId}:${epoch}`;
}

/** Ile wojen epoki podmiot już zużył w tej epoce (0 = brak wpisu). */
export function eraWarCountFor(
  counts: ReadonlyMap<string, number>,
  ownerId: number,
  epoch: number,
): number {
  return counts.get(eraWarCivKey(ownerId, epoch)) ?? 0;
}

/**
 * R-WEB-ERA-WAR-COUNTER-Q1: czy podmiot może jeszcze uczestniczyć (napastnik LUB cel) w
 * wojnie epoki w tej epoce. `maxEraForcedWarsPerCivPerEra` = null → bez limitu.
 */
export function canCivJoinEraForcedWar(
  counts: ReadonlyMap<string, number>,
  ownerId: number,
  epoch: number,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  if (params.maxEraForcedWarsPerCivPerEra === null) return true;
  return eraWarCountFor(counts, ownerId, epoch) < params.maxEraForcedWarsPerCivPerEra;
}

/** Zużycie licznika przy wypowiedzeniu: napastnik i cel dostają po jednym wpisie w bieżącej epoce. */
export function recordEraForcedWarParticipation(
  counts: Map<string, number>,
  attackerId: number,
  targetId: number,
  attackerEpoch: number,
  targetEpoch: number,
): void {
  const ka = eraWarCivKey(attackerId, attackerEpoch);
  const kt = eraWarCivKey(targetId, targetEpoch);
  counts.set(ka, (counts.get(ka) ?? 0) + 1);
  counts.set(kt, (counts.get(kt) ?? 0) + 1);
}

/** Numer epoki (1 Kamień, 2 Brąz, 3 Żelazo) odpowiadający etykiecie wojny epoki; `null` = brak (zwykła wojna). */
export function forcedEraTagEpoch(tag: ForcedEraTag | null | undefined): number | undefined {
  if (tag === 'stone') return 1;
  if (tag === 'bronze') return 2;
  if (tag === 'iron') return 3;
  return undefined;
}

/** Etykieta wojny epoki własnej epoki cywilizacji (1/2/3); epoki > 3 nie mają wojny wymuszonej → `null`. */
export function forcedEraTagForEpoch(epoch: number): ForcedEraTag | null {
  return epoch === 1 ? 'stone' : epoch === 2 ? 'bronze' : epoch === 3 ? 'iron' : null;
}

/**
 * R-WEB-ERA-WAR-PLAYER-POOL-DESPITE-STONE-WAR-Q1: epoka, pod którą liczy się wojna epoki GRACZA w
 * liczniku (cywilizacja, epoka): epoka wojny, gdy gracz jest już w nowszej epoce (wojna Kamienia
 * gracza w Brązie = klucz 0:1, nie 0:2). Bez etykiety (`tagEpoch` undefined) = bieżąca epoka.
 */
export function eraWarCounterEpoch(tagEpoch: number | undefined, ownerEpoch: number): number {
  return tagEpoch === undefined ? ownerEpoch : Math.min(ownerEpoch, tagEpoch);
}

/**
 * Legacy saves may lack per-owner era-entry timestamps. Since their historical
 * entry turn cannot be recovered, start the required wait at load time. Existing
 * timestamps are preserved, and only owners already in Bronze/Iron are backfilled.
 */
export function backfillMissingEraEntryTurns(
  entryTurns: Map<number, number>,
  ownerEpochs: ReadonlyMap<number, number>,
  currentTurn: number,
): void {
  for (const [ownerId, epoch] of ownerEpochs) {
    if (epoch >= 2 && epoch <= 3 && !entryTurns.has(ownerId)) entryTurns.set(ownerId, currentTurn);
  }
}

export interface PlayerEraWarPoolInput {
  currentTurn: number;
  /** Bieżąca epoka gracza. */
  playerEpoch: number;
  /** Aktywne wojny wymuszone gracza — wszystkie epoki. */
  activeForcedWarsTotal: number;
  /** Aktywne wojny wymuszone gracza TEJ SAMEJ epoki co jego bieżąca (Kamień/Brąz/Żelazo). */
  activeForcedWarsInPlayerEra: number;
  /** Tura wejścia gracza w bieżącą epokę (Brąz/Żelazo); brak (stary zapis/start w epoce) = próg pominięty. */
  eraEnterTurn: number | undefined;
  /** Najwcześniejsza tura puli gracza (WOJNA_KAMIEN_WYMUSZONA_START_TURY). */
  poolStartTurn: number;
}

/**
 * Czy gracz wchodzi do puli celów wojny epoki. Kamień/epoki > 3: bez zmian (brak jakiejkolwiek
 * wojny wymuszonej). Brąz/Żelazo: liczy się tylko wojna TEJ SAMEJ epoki (wojna Kamienia nie zajmuje
 * „miejsca” Brązu) oraz próg `eraForcedWarStartTurnsFromEra` od wejścia gracza w epokę.
 */
export function isPlayerEligibleForEraWarPool(
  inp: PlayerEraWarPoolInput,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  if (inp.currentTurn < inp.poolStartTurn) return false;
  const tag = forcedEraTagForEpoch(inp.playerEpoch);
  if (tag === null || tag === 'stone') return inp.activeForcedWarsTotal === 0;
  if (inp.activeForcedWarsInPlayerEra !== 0) return false;
  if (inp.eraEnterTurn === undefined) return true;
  return inp.currentTurn - inp.eraEnterTurn >= params.eraForcedWarStartTurnsFromEra[tag];
}

/**
 * R-WEB-ERA-WAR-PLAYER-POOL-DESPITE-STONE-WAR-Q1 (zarzut FC r1 nr 1): czy kandydat-AI o epoce `aiEpoch`
 * może wejść w parę z GRACZEM — slot licznika gracza dla epoki wojny tagu AI wolny
 * (`eraWarCounterEpoch(epoka tagu, epoka gracza)`, ta sama reguła co bramka wypowiedzenia w main.ts).
 * Bez tego filtra AI Kamienia wybrana jako partner gracza w Brązie byłaby odrzucana bramką
 * (`civ-cap-target`) w każdej turze, a wojna Brązu gracza nie byłaby deklarowana.
 */
export function isPlayerEraWarSlotFree(
  counts: ReadonlyMap<string, number>,
  aiEpoch: number,
  playerEpoch: number,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  const tag = forcedEraTagForEpoch(aiEpoch);
  if (tag === null) return false;
  return canCivJoinEraForcedWar(counts, 0, eraWarCounterEpoch(forcedEraTagEpoch(tag), playerEpoch), params);
}

/**
 * R-WEB-ERA-WAR-COUNTER-Q1, zapis stary bez pola: odtwarza licznik z AKTYWNYCH par wojen
 * wymuszonych (obie strony = 1 w bieżącej epoce); reszta = 0. Świadomie konserwatywne.
 */
export function rebuildEraWarCountsFromActivePairs(
  activePairs: ReadonlyArray<{ attackerId: number; targetId: number; tagEpoch?: number }>,
  epochOf: (ownerId: number) => number,
  isHumanOwner?: (ownerId: number) => boolean,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of activePairs) {
    for (const oid of [p.attackerId, p.targetId]) {
      // R-WEB-ERA-WAR-PLAYER-POOL-DESPITE-STONE-WAR-Q1 (H2): wojna Kamienia gracza, który jest już
      // w Brązie, zajmuje slot EPOKI WOJNY (0:1), nie bieżącej (0:2) — inaczej odtworzony stary zapis
      // blokowałby graczowi wojnę Brązu. Tylko gracz (isHumanOwner); AI bez zmian.
      const human = isHumanOwner?.(oid) === true;
      out.set(eraWarCivKey(oid, human ? eraWarCounterEpoch(p.tagEpoch, epochOf(oid)) : epochOf(oid)), 1);
    }
  }
  return out;
}

/**
 * R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 2): odczyt licznika przy wczytaniu zapisu — jedna
 * funkcja zamiast bloku w main.ts, żeby test używał tego samego kodu co gra. `saved` = wartość
 * `meta.warRulesEraWarCountByCiv` (tablica par [klucz, n]) albo `undefined` (stary zapis).
 */
export function restoreEraWarCounts(
  saved: unknown,
  activePairs: ReadonlyArray<{ attackerId: number; targetId: number; tagEpoch?: number }>,
  epochOf: (ownerId: number) => number,
  isHumanOwner?: (ownerId: number) => boolean,
): Map<string, number> {
  if (!Array.isArray(saved)) return rebuildEraWarCountsFromActivePairs(activePairs, epochOf, isHumanOwner);
  const out = new Map<string, number>();
  for (const e of saved) {
    if (Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1])) out.set(e[0], e[1] as number);
  }
  return out;
}

/** Werdykt bramki wypowiedzenia wojny epoki (main.ts, blok `wypowiedz_wojne`). `ok` = wolno wypowiedzieć. */
export type EraWarGateVerdict = 'ok' | 'era-disabled' | 'era-cap' | 'civ-cap-attacker' | 'civ-cap-target';

/**
 * R-WEB-ERA-WAR-COUNTER-Q1 (zarzut FC r1 nr 2): czysta bramka wypowiedzenia — ta sama logika,
 * którą main.ts wywołuje przy `wypowiedz_wojne` z powodem wojny epoki. Kolejność:
 * (1) epoka wyłączona flagą (także bez multiwar, jak w bazie); (2) limit globalny (tylko gdy
 * multiwar włączony; przy `maxEraForcedWarsPerEra = null` przepuszcza); (3) licznik napastnika;
 * (4) licznik celu.
 */
export function evaluateEraForcedWarGate(
  input: {
    multiwarEnabled: boolean;
    tag: ForcedEraTag | null;
    declaredByTag: ReadonlyMap<ForcedEraTag, number>;
    counts: ReadonlyMap<string, number>;
    attackerId: number;
    attackerEpoch: number;
    targetId: number;
    targetEpoch: number;
  },
  params: WarRulesParams = WAR_RULES_PARAMS,
): EraWarGateVerdict {
  if (input.tag === null) return 'ok';
  if (!isForcedEraWarEnabled(input.tag, params)) return 'era-disabled';
  if (!input.multiwarEnabled) return 'ok';
  if (!canDeclareEraForcedWar(input.tag, input.declaredByTag, params)) return 'era-cap';
  if (!canCivJoinEraForcedWar(input.counts, input.attackerId, input.attackerEpoch, params)) return 'civ-cap-attacker';
  if (!canCivJoinEraForcedWar(input.counts, input.targetId, input.targetEpoch, params)) return 'civ-cap-target';
  return 'ok';
}

/**
 * R-WEB-ERA-WAR-IGNORE-TREATIES-Q1 (decyzja właściciela 2026-11-08): wojna epoki omija WSZYSTKIE
 * umowy i blokady pokoju pary (NAP, blokada pokoju/cooldown, umowy handlowe, Relacja), a blokuje
 * ją WYŁĄCZNIE aktywny sojusz formalny. Zwykłe (nie-epokowe) wypowiedzenie wojny nadal respektuje
 * NAP i blokadę pokoju; sojusz w zwykłym wypowiedzeniu nie jest tą funkcją rozstrzygany (zostaje
 * dotychczasowy guard celu Kamienia/Żelaza w main.ts). Czysta funkcja — testowana wprost.
 */
export function isWarTreatyBlocked(input: {
  eraWar: boolean;
  hasNap: boolean;
  peaceLocked: boolean;
  hasAlliance: boolean;
}): boolean {
  if (input.eraWar) return input.hasAlliance;
  return input.hasNap || input.peaceLocked;
}

/**
 * R-WEB-ERA-WAR-COUNTER-Q1 (5): miasto referencyjne gracza do odległości partnera — stolica,
 * a gdy jej brak (lub nie należy do gracza) — pierwsze miasto gracza. Ta sama kolejność co main.ts.
 */
export function pickPlayerReferenceCity<T extends { id: string; ownerId: number }>(
  cities: readonly T[],
  capitalCityId: string | null | undefined,
  playerOwnerId = 0,
): T | undefined {
  return cities.find(c => c.id === capitalCityId && c.ownerId === playerOwnerId)
    ?? cities.find(c => c.ownerId === playerOwnerId);
}

export interface EngageArmyHex {
  q: number;
  r: number;
  ownerId: number;
}

/**
 * W1: najbliższa wrogą armia w promieniu zaangażowania od kotwicy grupy (`anchor`).
 * Remis dystansu: mniejsze q, potem mniejsze r, potem mniejszy ownerId (deterministycznie).
 * Zwraca null, gdy brak wrogiej armii w promieniu => grupa maszeruje na stolicę.
 */
export function pickEngagementArmy(
  anchor: { q: number; r: number },
  enemyArmies: ReadonlyArray<EngageArmyHex>,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  radius: number = WAR_RULES_PARAMS.engageRadiusHexes,
): EngageArmyHex | null {
  let best: EngageArmyHex | null = null;
  let bestD = Infinity;
  for (const e of enemyArmies) {
    const d = hexDistanceFn(anchor.q, anchor.r, e.q, e.r);
    if (d > radius) continue;
    if (
      d < bestD
      || (d === bestD && best !== null && (e.q < best.q || (e.q === best.q && (e.r < best.r || (e.r === best.r && e.ownerId < best.ownerId)))))
    ) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

export interface ArmyGroupRef {
  id: string;
  size: number;
}

export interface EnemyStrengthRef {
  ownerId: number;
  strength: number;
}

/**
 * W2: przydział CAŁYCH grup armii do wrogów proporcjonalnie do siły przeciwników.
 * Najpierw (jeśli grup wystarcza) każdy wróg dostaje min. 1 grupę (największe grupy
 * najpierw), potem każda pozostała grupa idzie do wroga z największym deficytem
 * (idealny udział - przydzielona liczba jednostek). Remis: mniejszy ownerId.
 * Grupy NIE są dzielone. Zwraca mapę groupId -> ownerId.
 */
export function allocateGroupsToEnemies(
  groups: ReadonlyArray<ArmyGroupRef>,
  enemies: ReadonlyArray<EnemyStrengthRef>,
): Map<string, number> {
  const out = new Map<string, number>();
  if (groups.length === 0 || enemies.length === 0) return out;
  const enemiesSorted = enemies.slice().sort((a, b) => a.ownerId - b.ownerId);
  const totalStrength = enemiesSorted.reduce((s, e) => s + Math.max(0, e.strength), 0);
  const totalSize = groups.reduce((s, g) => s + g.size, 0);
  const ideal = new Map<number, number>();
  for (const e of enemiesSorted) {
    const share = totalStrength > 0 ? Math.max(0, e.strength) / totalStrength : 1 / enemiesSorted.length;
    ideal.set(e.ownerId, share * totalSize);
  }
  const assigned = new Map<number, number>();
  for (const e of enemiesSorted) assigned.set(e.ownerId, 0);
  const order = groups.slice().sort((a, b) => b.size - a.size || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // Min. 1 grupa na wroga, jeśli grup wystarcza (najsilniejszy wróg dostaje największą grupę).
  let gi = 0;
  if (order.length >= enemiesSorted.length) {
    const byStrength = enemiesSorted.slice().sort((a, b) => b.strength - a.strength || a.ownerId - b.ownerId);
    for (const e of byStrength) {
      const g = order[gi++]!;
      out.set(g.id, e.ownerId);
      assigned.set(e.ownerId, (assigned.get(e.ownerId) ?? 0) + g.size);
    }
  }
  for (; gi < order.length; gi++) {
    const g = order[gi]!;
    let bestOwner = enemiesSorted[0]!.ownerId;
    let bestDeficit = -Infinity;
    for (const e of enemiesSorted) {
      const deficit = (ideal.get(e.ownerId) ?? 0) - (assigned.get(e.ownerId) ?? 0);
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestOwner = e.ownerId;
      }
    }
    out.set(g.id, bestOwner);
    assigned.set(bestOwner, (assigned.get(bestOwner) ?? 0) + g.size);
  }
  return out;
}
