/**
 * Trudność państw-miast vs trudność gry + reguły konsolidacji klastra (AI-CS-CLUSTER-DIFF 2026-07-30).
 */

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

/**
 * Max łączna liczba jednostek bojowych MP (owner na całej mapie).
 * Skala = oś PM-vs-GRACZ (_menuCityStateDifficultyVsPlayer, C-025/C-026 2026-08-10),
 * NIE stara trudność gry (_menuDifficulty) i NIE suwak MP (_menuCityStateDifficulty,
 * odwrócony AI-facing). / EN: scale is the player-facing CS axis, not game/AI-facing.
 * null = brak limitu (easy — jak major AI).
 *
 * R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04=B (naprawa regresji Evaluatora
 * na commit a6076db7, 2026-08-10): 'hard' było 0 -- PM na Trudnym nigdy nie mogło
 * zrekrutować NAWET pierwszego garnizonu, mimo że ten sam commit włączył
 * cityStateOffensiveSupport=true na Trudnym (PM planuje agresję, buduje Koszary,
 * w których nic nigdy nie rekrutuje). 'hard' podniesione do 3 (= CS_WAVE_ATTACK_MIN_STACK
 * w ai.ts), ale Evaluator rundy 2 (commit 7e753db2) wykazał, że to WCIĄŻ za mało:
 * bramka wyjścia z domu (chooseCityProduction/decideAITurn w ai.ts, ok. linii 2820)
 * blokuje ofensywę PM dopóki `totalMilitary < minFieldArmyBeforeSend + minGuardToSend`
 * -- na Trudnym `minFieldArmyBeforeSend = CS_WAVE_ATTACK_MIN_STACK = 3` i
 * `minGuardToSend = RESUP_TIERS['strong'].minGuard = 1`, więc realny próg wyjścia
 * z domu to `< 4`, NIE `< 3`. Cap=3 więc nigdy nie osiągał progu -- PM rekrutowało
 * do 3 i tam utykało, fala ofensywna nie wyruszała ANI RAZU.
 * 'hard' = CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong'].minGuard (ai.ts) = 3 + 1 = 4,
 * NIE losowa liczba ani sam CS_WAVE_ATTACK_MIN_STACK: to SUMA dwóch stałych, którymi
 * bramka wyjścia z domu faktycznie testuje próg -- cap musi pozwolić PM zgromadzić
 * PRZYNAJMNIEJ tę sumę, inaczej mechanizm ofensywy nigdy nie miałby z czego wyruszyć
 * (zbierze stos do wave-attacku, ale bramka wyjścia i tak go zatrzyma w mieście).
 * Zsynchronizowane bramką cs-military-cap-wiring-test.cjs (assert cap('hard') >=
 * CS_WAVE_ATTACK_MIN_STACK + RESUP_TIERS['strong'].minGuard -- RELACJA "co najmniej",
 * nie sztywna równość od R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 niżej).
 * / EN: 'hard' raised from 3 to 4 -- the home-exit gate in ai.ts blocks the offensive
 * whenever totalMilitary < minFieldArmyBeforeSend + minGuardToSend (CS_WAVE_ATTACK_MIN_STACK
 * + RESUP_TIERS['strong'].minGuard = 3 + 1 = 4 on hard), so a cap of exactly the wave-stack
 * size (3) could never clear that threshold -- the wave never left home.
 *
 * R-MIASTA-PANSTWA-PRODUKCJA-OBRONNA-Q1 (Maciej 2026-09-03): WYZWALACZ -- "Państwa-miasta
 * [...] w tej chwili nie są w ogóle wyzwaniem [...] powinny się skupić na budowie jednostek
 * wojskowych, żeby się obronić." Recon (ten temat) potwierdził: to JEDYNY sufit CAŁKOWITEJ
 * armii MP (nie osobny cap atak/obrona -- jedyny odczyt w ai.ts:1554, filtr produkcji), z
 * którego czerpie zarówno garnizon obronny jak i ewentualna fala ofensywna (hard). 'hard'
 * podniesione 4→7 = docelowy garnizon wczesnej fazy na hard (3, patrz CS_EARLY_GARRISON_TARGET
 * w ai.ts) + CS_WAVE_ATTACK_MIN_STACK (3) + RESUP_TIERS['strong'].minGuard (1) -- MP na
 * Trudnym może utrzymać PEŁNY docelowy garnizon (3) I RÓWNOCZEŚNIE zgromadzić minimalną falę
 * ofensywną, zamiast wybierać jedno kosztem drugiego jak przy starym, ciasnym cap=4 (garnizon
 * docelowy 3 + próg wyjścia z domu 4 nie mieściły się razem w jednym punkcie). 'normal'
 * podniesione 1→3 = docelowy garnizon wczesnej fazy na normal (2) + 1 bufor (normal nie ma
 * cityStateOffensiveSupport, więc bez potrzeby miejsca na falę ofensywną) -- stary cap=1
 * fizycznie BLOKOWAŁ osiągnięcie nawet 2-jednostkowego garnizonu (GOAL 2 dispatcha). 'easy'
 * CELOWO nietknięte (null/bez limitu) -- poza jawnym zakresem GOAL 1 (wymaga tylko
 * hard >= normal, spełnione już bez zmiany 'easy'; zmiana 'easy' byłaby osobną decyzją
 * balansu spoza tego dispatchu).
 */
export function cityStateMilitaryProductionCap(csDifficultyVsPlayer: DifficultyLevel): number | null {
  switch (csDifficultyVsPlayer) {
    case 'hard':
      return 7;
    case 'normal':
      return 3;
    default:
      return null;
  }
}

/** Odwrócona skala Maciej 2026-07-30: łatwa gra → trudne PM, trudna gra → łatwe PM. */
export function cityStateDifficultyFromGameDifficulty(diff: DifficultyLevel): DifficultyLevel {
  if (diff === 'easy') return 'hard';
  if (diff === 'hard') return 'easy';
  return 'normal';
}

export const CLUSTER_CS_WAR_MIN_TURN = 20;
export const CLUSTER_CS_CONQUEST_DEADLINE_TURN = 100;

/**
 * Gdy trudność państw-miast = hard: od tury 20 każde PM co turę ma szansę
 * wypowiedzieć wojnę graczowi (Maciej 2026-07-30; podniesione do 60% po playteście t.24).
 * Blokada: aktywny traktat handlowy / surowcowy z graczem.
 */
export const CITY_STATE_PLAYER_WAR_MIN_TURN = 20;
export const CITY_STATE_PLAYER_WAR_CHANCE = 0.60;

/** R-MP-HARD-WAVE Q3: jeden członek klastra siostrzanych PM do zbiorczego rzutu wojny. */
export interface ClusterWarRollMember {
  ownerId: number;
  atWarWithPlayer: boolean;
  hasTradeOrResourceTreatyWithPlayer: boolean;
  peaceLockedWithPlayer: boolean;
  hasNapWithPlayer: boolean;
}

/** Czy pojedyncze PM może wypowiedzieć wojnę graczowi (bez rzutu — tylko bramki). */
export function isCityStateEligibleForPlayerWar(
  cityStateDifficulty: DifficultyLevel,
  turn: number,
  atWarWithPlayer: boolean,
  hasTradeOrResourceTreatyWithPlayer: boolean,
  peaceLockedWithPlayer = false,
  hasNapWithPlayer = false,
): boolean {
  if (cityStateDifficulty !== 'hard') return false;
  if (turn < CITY_STATE_PLAYER_WAR_MIN_TURN) return false;
  if (atWarWithPlayer) return false;
  if (hasTradeOrResourceTreatyWithPlayer) return false;
  if (peaceLockedWithPlayer) return false;
  if (hasNapWithPlayer) return false;
  return true;
}

/**
 * R-MP-HARD-WAVE Q3: jeden rzut na klaster siostrzanych PM / turę.
 * Przy sukcesie zwraca ownerId wszystkich kwalifikujących się sióstr (blokady NAP/handlu respektowane).
 */
export function resolveClusterCityStateWarOnPlayer(
  cityStateDifficulty: DifficultyLevel,
  turn: number,
  members: ReadonlyArray<ClusterWarRollMember>,
  rng: () => number = Math.random,
): number[] {
  const eligible = members.filter(m =>
    isCityStateEligibleForPlayerWar(
      cityStateDifficulty,
      turn,
      m.atWarWithPlayer,
      m.hasTradeOrResourceTreatyWithPlayer,
      m.peaceLockedWithPlayer,
      m.hasNapWithPlayer,
    ),
  );
  if (eligible.length === 0) return [];
  if (rng() >= CITY_STATE_PLAYER_WAR_CHANCE) return [];
  return eligible.map(m => m.ownerId);
}

/**
 * Czy to państwo-miasto ma w tej turze wypowiedzieć wojnę graczowi (rzut raz na turę).
 * @deprecated Preferuj resolveClusterCityStateWarOnPlayer (jeden rzut na klaster).
 */
export function shouldCityStateRollWarOnPlayer(
  cityStateDifficulty: DifficultyLevel,
  turn: number,
  atWarWithPlayer: boolean,
  hasTradeOrResourceTreatyWithPlayer: boolean,
  rng: () => number = Math.random,
  /** Aktywna karencja pokoju z graczem — nie wypowiadaj wojny mimo roll. */
  peaceLockedWithPlayer = false,
  /** Aktywny pakt nieagresji z graczem — twardy zakaz DOW do wygaśnięcia. */
  hasNapWithPlayer = false,
): boolean {
  if (!isCityStateEligibleForPlayerWar(
    cityStateDifficulty,
    turn,
    atWarWithPlayer,
    hasTradeOrResourceTreatyWithPlayer,
    peaceLockedWithPlayer,
    hasNapWithPlayer,
  )) return false;
  return rng() < CITY_STATE_PLAYER_WAR_CHANCE;
}

export interface ClusterStateTarget {
  ownerId: number;
  q: number;
  r: number;
}

function axialDistance(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

export interface ClusterWarTimingOpts {
  warMinTurn?: number;
  deadlineTurn?: number;
}

/** Twardy priorytet przejęcia CS z kręgu do tury deadline (bez kar przy niepowodzeniu). */
export function isClusterConquestDeadlineActive(
  turn: number,
  clusterStateTargets: ReadonlyArray<ClusterStateTarget>,
  opts?: ClusterWarTimingOpts,
): boolean {
  const deadline = opts?.deadlineTurn ?? CLUSTER_CS_CONQUEST_DEADLINE_TURN;
  return turn <= deadline && clusterStateTargets.length > 0;
}

/**
 * Wybiera ownerId państwa-miasta z kręgu do wymuszonej wojny:
 * - tura >= 20 i brak wojny z żadnym CS kręgu, lub
 * - aktywny deadline konsolidacji i pozostały CS bez wojny.
 * Zwraca null gdy wymuszenie nie jest potrzebne.
 */
export function pickClusterCityStateWarTargetId(
  turn: number,
  clusterStateTargets: ReadonlyArray<ClusterStateTarget>,
  atWarOwnerIds: ReadonlySet<number>,
  referenceHex?: { q: number; r: number },
  /** OwnerIds chronione paktem nieagresji — nie wybieraj do wymuszonej wojny. */
  napBlockedOwnerIds?: ReadonlySet<number>,
  opts?: ClusterWarTimingOpts,
): number | null {
  if (clusterStateTargets.length === 0) return null;

  const warMinTurn = opts?.warMinTurn ?? CLUSTER_CS_WAR_MIN_TURN;
  const napBlocked = napBlockedOwnerIds ?? new Set<number>();
  const notAtWar = clusterStateTargets.filter(
    t => !atWarOwnerIds.has(t.ownerId) && !napBlocked.has(t.ownerId),
  );
  if (notAtWar.length === 0) return null;

  const anyAtWar = clusterStateTargets.some(t => atWarOwnerIds.has(t.ownerId));
  const turn20Force = turn >= warMinTurn && !anyAtWar;
  const deadlineForce = turn >= warMinTurn
    && isClusterConquestDeadlineActive(turn, clusterStateTargets, opts);

  if (!turn20Force && !deadlineForce) return null;

  const pickNearest = (): number => {
    if (!referenceHex) return notAtWar[0]!.ownerId;
    let best = notAtWar[0]!;
    let bestDist = axialDistance(best.q, best.r, referenceHex.q, referenceHex.r);
    for (let i = 1; i < notAtWar.length; i++) {
      const t = notAtWar[i]!;
      const d = axialDistance(t.q, t.r, referenceHex.q, referenceHex.r);
      if (d < bestDist) {
        best = t;
        bestDist = d;
      }
    }
    return best.ownerId;
  };

  return pickNearest();
}
