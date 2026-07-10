/**
 * playerState.ts
 * Minimal global player runtime state + auto-research logic for The Game.
 *
 * Scope (tasks 13B-finish + 7B):
 *   13B-finish — bank the per-turn aggregate economy streams into a global
 *     treasury (skarbiec) and a global science pool (nauka).  Until this module
 *     existed the turn loop computed per-city yields (turn-economy.ts) but threw
 *     the totals away; nothing was ever accumulated.
 *   7B — in-game research: with no player input yet, auto-pick the cheapest
 *     available technology and complete techs whenever enough science is banked.
 *
 * Pure logic — no DOM, no THREE.  `researchStep()` is deterministic and directly
 * unit-testable (see tools/logic-test.cjs).  main.ts owns the live PlayerState
 * object and calls researchStep() once per end-turn after the economy tick.
 *
 * Treasury-vs-science choice (documented):
 *   economy.ts (cityYieldPerTurn) already splits each city's trade (Handel) by a
 *   fixed slider into BOTH a science stream (procentNauka, default 60%) and a
 *   money stream (procentPieniadz, default 30%) EVERY turn, regardless of which
 *   techs are researched.  turn-economy.ts aggregates those into
 *   EconomyTickResult.totalNauka and .totalPieniadz.  We therefore bank them
 *   directly and consistently:
 *       nauka    += totalNauka
 *       skarbiec += totalPieniadz
 *   We do NOT retroactively rescale per-city economy when "Waluta" (Pieniadz x10)
 *   is researched — keeping per-city economy behaviour unchanged is in scope;
 *   changing economy.ts is not.  Instead we record a flag (pieniadzMnoznik) and
 *   an era bump so later tasks (and the HUD) can react.
 *
 * Tech data shape (data/tech.json via loader.TechDef):
 *   id/name    : "Technologia"           (the tech name doubles as its id)
 *   era label  : "Epoka"                 ("Kamien" / "Braz" / ...)
 *   prereqs    : "Wymaga (prereq)"       ("—" = none; "A + B" = needs A and B)
 *   cost       : "Koszt nauki"           (science cost; null -> treated as 0)
 *   era advance: "Uwagi" / "Odblokowuje budynek" containing "Epok"
 *                (e.g. "konczy Epoke 1", "-> Epoka 2") -> bump era
 *   money/x10  : "Waluta", or "Uwagi"/"Odblokowuje budynek" containing "Pieniadz"
 *                -> sets pieniadzMnoznik to PIENIADZ_MNOZNIK (x10)
 */

import type { TechDef, CivBonus, BuildingDef } from '../data/loader';
import { applyTempoKoszt, type TempoGry } from './tech-tempo';
import type { BuildingCostPace } from './building-cost-tempo';
import type { KosztJednostekPace } from './unit-cost-tempo';
import type { WzrostLudnosciPace } from './population-growth-tempo';
import { scaledResearchCost, type GameDifficulty } from './difficulty-cost';
import { researchGatesMet, type ResearchBuildingGate } from './research';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Empire-wide building + improvement ids for research gate (T-TECH-7). */
export interface EmpireResearchGate {
  empireBuiltIds: ReadonlySet<string>;
  buildings: readonly BuildingDef[];
  /** Slugi ulepszeń terenu postawionych w imperium (bramka „wymagane ulepszenie"). */
  empireImprovementKeys?: ReadonlySet<string>;
}

function asResearchGate(g: EmpireResearchGate): ResearchBuildingGate {
  return {
    empireBuiltIds: g.empireBuiltIds,
    buildings: g.buildings,
    empireImprovementKeys: g.empireImprovementKeys,
  };
}

/** Sentinel meaning "no prerequisite" in tech.json's "Wymaga (prereq)" field. */
const NO_PREREQ = '—'; // em dash

/** Money multiplier granted by the Pieniadz (Waluta) tech — Praca->x10 economy. */
export const PIENIADZ_MNOZNIK = 10;

// ---------------------------------------------------------------------------
// Player state
// ---------------------------------------------------------------------------

/** Minimal global runtime state for the human player (ownerId 0). */
export interface PlayerState {
  /** Accumulated treasury (banked from per-turn totalPieniadz). */
  skarbiec: number;
  /** Accumulated, unspent science (banked from per-turn totalNauka). */
  nauka: number;
  /** Ids (== tech names) of fully researched technologies. */
  zbadane: Set<string>;
  /** Id of the tech currently being researched, or null if none picked. */
  badana: string | null;
  /** Explicit player-chosen research target (Technologia name), or null. */
  playerResearchTargetId: string | null;
  /** Current era number (1 = Kamien / Stone, 2 = Braz / Bronze, ...). */
  era: number;
  /** Money multiplier in effect (1 until "Waluta"/Pieniadz is researched). */
  pieniadzMnoznik: number;
  /** Tempo gry (globalny mnoznik kosztu badan) — szybka/standardowa/dluga. */
  tempoGry: TempoGry;
  /** Mnoznik kosztow budynkow z kreatora — niski/normalny/wysoki. */
  buildingCostPace: BuildingCostPace;
  /** Mnoznik kosztow rekrutacji jednostek z kreatora — niski/normalny/wysoki. */
  kosztJednostekPace: KosztJednostekPace;
  /** Tempo wzrostu ludnosci z kreatora — wysoki/normalny/wolny (prog zywnosci). */
  wzrostLudnosciPace: WzrostLudnosciPace;
  /**
   * Typ cywilizacji gracza (ikonaId z civs.json, np. 'grecy', 'rzymianie').
   * Ustawiany w applyMenuParams przy starcie gry.
   */
  civType: string;
  /**
   * Bonusy cywilizacji gracza (tablica z civs.json[].bonusy).
   * Attachowane przy starcie — realizacja po stronie właściwych systemów (walka, ekonomia, miasto).
   */
  civBonusy: CivBonus[];
  /** Projekt kosmiczny ukończony (warunek zwycięstwa nauki 10=A*). */
  rakietaWystrzelona: boolean;
}

/** Fresh player state for a new game: era 1, nothing researched, empty bank. */
export function createPlayerState(): PlayerState {
  return {
    skarbiec: 0,
    nauka: 0,
    zbadane: new Set<string>(),
    badana: null,
    playerResearchTargetId: null,
    era: 1,
    pieniadzMnoznik: 1,
    tempoGry: 'standardowa',
    buildingCostPace: 'niski',
    kosztJednostekPace: 'niski',
    wzrostLudnosciPace: 'wysoki',
    civType: 'grecy',    // default: Grecy; nadpisywany przez applyMenuParams
    civBonusy: [],       // puste do czasu startu gry
    rakietaWystrzelona: false,
  };
}

// ---------------------------------------------------------------------------
// Tech helpers (pure)
// ---------------------------------------------------------------------------

/** Tech name/id, trimmed.  Empty string if missing (defensive). */
function techId(t: TechDef): string {
  return (t.Technologia ?? '').trim();
}

/** Science cost of a tech; null/NaN -> 0 so a data quirk can't stall research. */
export function techCost(t: TechDef): number {
  const c = t['Koszt nauki'];
  return typeof c === 'number' && Number.isFinite(c) ? c : 0;
}

/**
 * Parse the "Wymaga (prereq)" field into a list of prerequisite tech ids.
 * "—" (or empty) -> [].  "A + B" -> ["A", "B"].  Handles spacing/"+".
 */
export function parsePrereqs(t: TechDef): string[] {
  const raw = (t['Wymaga (prereq)'] ?? '').trim();
  if (raw === '' || raw === NO_PREREQ) return [];
  return raw
    .split('+')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== NO_PREREQ);
}

/** True when every prerequisite of `t` is already in `researched`. */
export function prereqsMet(t: TechDef, researched: Set<string>): boolean {
  return parsePrereqs(t).every(p => researched.has(p));
}

/**
 * Techs that may be started now: not already researched and all prereqs met.
 * Returns the matching TechDef rows (order preserved from the data array).
 */
export function availableTechs(
  techs: TechDef[],
  researched: Set<string>,
  gate?: EmpireResearchGate,
): TechDef[] {
  return techs.filter(t => {
    const id = techId(t);
    if (id === '' || researched.has(id)) return false;
    if (!prereqsMet(t, researched)) return false;
    if (gate && !researchGatesMet(t, asResearchGate(gate))) return false;
    return true;
  });
}

/**
 * Cheapest available tech id, or null if none available.
 * Ties broken deterministically by tech name (lexicographic) so the choice is
 * stable across runs/tests.
 */
export function cheapestAvailable(
  techs: TechDef[],
  researched: Set<string>,
  gate?: EmpireResearchGate,
): string | null {
  const avail = availableTechs(techs, researched, gate);
  if (avail.length === 0) return null;
  let best: TechDef | null = null;
  for (const t of avail) {
    if (best === null) { best = t; continue; }
    const dc = techCost(t) - techCost(best);
    if (dc < 0 || (dc === 0 && techId(t) < techId(best))) best = t;
  }
  return best ? techId(best) : null;
}

/**
 * Docelowy numer epoki nadawany po ukończeniu techu (jawne pole `awansDoEpoki`),
 * lub null gdy tech nie awansuje epoki.
 *
 * DRZEWKO-TECH-FIX faza 1: porzucamy heurystykę regex /epok/i na Uwagach
 * (fałszywie łapała Walutę i Sztukę wojenną, które kończą epokę OPISOWO, ale nie
 * powinny jej awansować w v0.1). Jawne pole ustawiono tylko na kamieniach milowych:
 * Brązownictwo→2, Obróbka żelaza→3.
 */
export function eraAdvanceTarget(t: TechDef): number | null {
  const raw = t.awansDoEpoki;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}

/** True when finishing this tech should advance the era (has explicit awansDoEpoki). */
export function isEraAdvanceTech(t: TechDef): boolean {
  return eraAdvanceTarget(t) !== null;
}

/** True when this tech grants money / the Pieniadz (x10) economy. */
export function isMoneyTech(t: TechDef): boolean {
  if (techId(t).toLowerCase() === 'waluta') return true;
  const notes = `${t.Uwagi ?? ''} ${t['Odblokowuje budynek'] ?? ''}`;
  return /pieniądz/i.test(notes); // "Pieniadz"
}

// ---------------------------------------------------------------------------
// Research step (pure, mutates state) — one end-turn pass
// ---------------------------------------------------------------------------

/** One completed-tech event, returned for logging by the caller. */
export interface ResearchCompletion {
  /** Tech id/name that was completed this step. */
  id: string;
  /** Science cost that was deducted. */
  koszt: number;
  /** True if completing it advanced the era. */
  awansEpoki: boolean;
  /** True if it granted money / Pieniadz (x10). */
  pieniadz: boolean;
  /** Era after this completion. */
  era: number;
}

/** Result of researchStep(): completed techs (in order) + the new current tech. */
export interface ResearchStepResult {
  completed: ResearchCompletion[];
  badana: string | null;
}

/**
 * Advance research by one end-turn pass against the already-banked `state.nauka`.
 *
 * Algorithm (task 7B):
 *   1. If nothing is being researched, pick the cheapest available tech.
 *   2. While the current tech is fully affordable from banked science:
 *        - deduct its cost, mark it researched,
 *        - apply unlock flags (era bump / money x10),
 *        - record the completion for logging,
 *        - pick the next cheapest available tech.
 *   3. Stop when science runs short, nothing is available, or (guard) we have
 *      iterated more times than there are techs (prevents any infinite loop).
 *
 * Mutates `state` (nauka, zbadane, badana, era, pieniadzMnoznik) in place and
 * returns the list of completions so the caller can log them.
 */
export function researchStep(
  state: PlayerState,
  techs: TechDef[],
  gate?: EmpireResearchGate,
  difficulty: GameDifficulty = 'normal',
): ResearchStepResult {
  const completed: ResearchCompletion[] = [];
  const byId = new Map<string, TechDef>();
  for (const t of techs) {
    const id = techId(t);
    if (id !== '') byId.set(id, t);
  }

  // Pick an active target for this turn.
  // Priority:
  //   1. Explicit player-chosen target (playerResearchTargetId) if valid and available.
  //   2. Existing state.badana if still valid (backward compatibility for tests + AI path).
  //   3. First available tech (prereqs met, not done) as default to prevent stalling.
  //      (NOT cheapest — player picks explicitly; default just keeps science flowing.)
  const targetAllowed = (id: string): boolean => {
    const def = byId.get(id);
    if (!def || state.zbadane.has(id)) return false;
    if (!prereqsMet(def, state.zbadane)) return false;
    if (gate && !researchGatesMet(def, asResearchGate(gate))) return false;
    return true;
  };

  if (state.playerResearchTargetId !== null && targetAllowed(state.playerResearchTargetId)) {
    state.badana = state.playerResearchTargetId;
  } else if (
    state.badana === null ||
    !byId.has(state.badana) ||
    !targetAllowed(state.badana)
  ) {
    const avail = availableTechs(techs, state.zbadane, gate);
    state.badana = avail.length > 0 ? techId(avail[0]!) : null;
  }

  // Guard against infinite loops: never iterate more than the tech count + 1.
  const maxIters = techs.length + 1;
  let iters = 0;

  while (state.badana !== null && iters < maxIters) {
    iters++;
    const def = byId.get(state.badana);
    if (!def) { state.badana = cheapestAvailable(techs, state.zbadane, gate); continue; }

    const cost = scaledResearchCost(
      techCost(def),
      state.tempoGry ?? 'standardowa',
      0,
      difficulty,
    );
    if (state.nauka < cost) break; // can't finish the current tech yet

    // T-TECH-7: nie badaj tech wymagajacej budynku/ulepszenia bez bramki (jesli gate podany).
    if (gate && !researchGatesMet(def, asResearchGate(gate))) break;

    // --- complete the tech ---
    state.nauka -= cost;
    state.zbadane.add(state.badana);

    const awansTarget = eraAdvanceTarget(def);
    const awans = awansTarget !== null;
    const money = isMoneyTech(def);
    // Jawny awans epoki: ustaw epokę na max(bieżąca, docelowa) — bez podwójnego +1.
    if (awansTarget !== null) state.era = Math.max(state.era, awansTarget);
    if (money) state.pieniadzMnoznik = PIENIADZ_MNOZNIK;

    completed.push({
      id: state.badana,
      koszt: cost,
      awansEpoki: awans,
      pieniadz: money,
      era: state.era,
    });

    // --- clear explicit player target (completed; player must pick next) ---
    state.playerResearchTargetId = null;

    // --- pick the next target (default: first available, to prevent stalling) ---
    // If the player sets a new target before next turn it will take priority.
    const nextAvail = availableTechs(techs, state.zbadane, gate);
    state.badana = nextAvail.length > 0 ? techId(nextAvail[0]!) : null;
  }

  return { completed, badana: state.badana };
}


// ---------------------------------------------------------------------------
// Player research API (UI-facing hooks)
// ---------------------------------------------------------------------------

/** Result of getResearchState — what the UI needs to display the research panel. */
export interface ResearchStateInfo {
  /** Current science pool (unspent). */
  pula: number;
  /** Id of the player's explicitly chosen research target, or null. */
  targetId: string | null;
  /** Science cost of the chosen target, or 0 if none/unknown. */
  kosztCelu: number;
  /** Progress as fraction [0..1] toward the chosen target. */
  postepFraction: number;
  /** Estimated turns to complete at current science rate (null if none active or no science). */
  turnsLeft: number | null;
}

/**
 * Set the player's explicit research target.
 * Validates: tech must exist, not already completed, and all prereqs must be met.
 * Returns true on success, false when validation fails (state unchanged).
 * Pure-ish: mutates state.playerResearchTargetId only on success.
 */
export function setPlayerResearchTarget(
  state: PlayerState,
  techId: string,
  techs: TechDef[],
  gate?: EmpireResearchGate,
): boolean {
  // Must exist in tech data.
  const def = techs.find(t => (t.Technologia ?? '').trim() === techId);
  if (!def) return false;
  // Must not be already completed.
  if (state.zbadane.has(techId)) return false;
  // All prereqs must be met.
  if (!prereqsMet(def, state.zbadane)) return false;
  // Building + improvement gate (T-TECH-7).
  if (gate && !researchGatesMet(def, asResearchGate(gate))) return false;
  state.playerResearchTargetId = techId;
  return true;
}

/**
 * Read-only snapshot of the player's current research state for UI display.
 * Returns pula (science pool), targetId (explicit choice or current badana),
 * kosztCelu (target cost), postepFraction [0..1], and turnsLeft estimate.
 */
export function getResearchState(
  state: PlayerState,
  techs: TechDef[],
  naukaPerTurn: number,
  difficulty: GameDifficulty = 'normal',
): ResearchStateInfo {
  // Effective target: explicit player choice, or current badana, or null.
  const targetId = state.playerResearchTargetId ?? state.badana;
  const def = targetId ? techs.find(t => (t.Technologia ?? '').trim() === targetId) : undefined;
  const kosztCelu = def
    ? scaledResearchCost(
      techCost(def),
      state.tempoGry ?? 'standardowa',
      0,
      difficulty,
    )
    : 0;
  const pula = state.nauka;

  let postepFraction = 0;
  if (kosztCelu > 0) {
    postepFraction = Math.min(1, pula / kosztCelu);
  }

  let turnsLeft: number | null = null;
  if (def && naukaPerTurn > 0) {
    const remaining = kosztCelu - pula;
    turnsLeft = remaining <= 0 ? 0 : Math.ceil(remaining / naukaPerTurn);
  }

  return { pula, targetId, kosztCelu, postepFraction, turnsLeft };
}
