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

/** Sentinel values meaning "no prerequisite" in tech.json's "Wymaga (prereq)" field. */
const BRAK_PREREQ = new Set(['', '-', '\u2014', '\u2013', 'brak', 'none']);

/** Money multiplier granted by the Pieniadz (Waluta) tech — Praca->x10 economy. */
export const PIENIADZ_MNOZNIK = 10;

/**
 * TEMAT 10 — pojemność kolejki badań LICZONA RAZEM z aktualnym celem
 * (np. 1 aktywny + 3 w state.researchQueue = 4). Dziś (przed TEMAT 10) gracz
 * mógł mieć tylko 1 aktywny cel — to odpowiada RESEARCH_QUEUE_MAX == 1.
 */
export const RESEARCH_QUEUE_MAX = 4;

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
  /**
   * TEMAT 10 — kolejka badań: id-ki techów oczekujących ZA aktualnym celem
   * (playerResearchTargetId), w kolejności FIFO. NIE zawiera aktualnego celu —
   * ten zawsze żyje w playerResearchTargetId/badana. Razem z celem daje maks.
   * RESEARCH_QUEUE_MAX techów "zaplanowanych" (patrz enqueueResearchTarget()).
   * Puste gdy gracz nie zaplanował nic poza aktualnym celem (kompat. wsteczna:
   * stary zapis bez tego pola -> [] po deserializacji).
   */
  researchQueue: string[];
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
    researchQueue: [],
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
  if (raw === '' || BRAK_PREREQ.has(raw.toLowerCase())) return [];
  return raw
    .split('+')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !BRAK_PREREQ.has(s.toLowerCase()));
}

/** True when every prerequisite of `t` is already in `researched`. */
export function prereqsMet(t: TechDef, researched: Set<string>): boolean {
  return parsePrereqs(t).every(p => researched.has(p));
}

// ---------------------------------------------------------------------------
// Progresja epok/tierów — 3 zasady twardego gatingu (DODATKOWE do prereków).
// DUPLIKAT logiki z research.ts (epochGateMet/epochTierGateMet) — runtime gracza
// ma własną kopię (jak prereqsMet/availableTechs), by UI i runtime się nie rozjechały.
// Ta sama logika MUSI pozostać zgodna z research.ts.
//   Zasada 1: epoka N+1 zablokowana, dopóki cała epoka N nieodkryta.
//   Zasada 2: wyższy tier epoki zablokowany, dopóki niższe tiery tej epoki nieodkryte.
//   Zasada 3: awans na T3 (awansDoEpoki na kapstone T3) wynika strukturalnie z 1+2.
// ---------------------------------------------------------------------------

/** Diakrytyki PL → ASCII (normalizacja etykiety epoki). */
const PL_DIAKRYTYKI_EPOKA: Readonly<Record<string, string>> = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
  'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
};

/** Mapowanie znormalizowanej etykiety epoki na numer: Kamień=1, Brąz=2, Żelazo=3. */
const NUMER_EPOKI: Readonly<Record<string, number>> = {
  kamien: 1,
  braz: 2,
  zelazo: 3,
};

/** Numer epoki techu (1/2/3) lub null gdy pole Epoka puste / nierozpoznane. */
export function epochNumber(t: TechDef): number | null {
  const raw = t.Epoka;
  if (raw == null) return null;
  const norm = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL_DIAKRYTYKI_EPOKA[c] ?? c);
  const n = NUMER_EPOKI[norm];
  return typeof n === 'number' ? n : null;
}

/**
 * ZASADA 1 — TWARDA BRAMKA EPOKI: tech epoki E dostępny tylko gdy WSZYSTKIE techy
 * o Epoce < E są w `done`. Tech bez rozpoznanej epoki → spełniona (kompat. wsteczna).
 */
export function epochGateMet(
  t: TechDef,
  techs: readonly TechDef[],
  done: ReadonlySet<string>,
): boolean {
  const e = epochNumber(t);
  if (e == null) return true;
  for (const other of techs) {
    const oe = epochNumber(other);
    if (oe == null) continue;
    if (oe < e && !done.has(techId(other))) return false;
  }
  return true;
}

/**
 * ZASADA 2 — TIER-GATING WEWNĄTRZ EPOKI: tech o Poziom=P w Epoce E dostępny tylko
 * gdy WSZYSTKIE techy TEJ SAMEJ epoki E o Poziom < P są w `done`. Filtr po Epoce
 * PRZED porównaniem Poziom. Brak epoki/Poziom → spełniona (kompat. wsteczna).
 */
export function epochTierGateMet(
  t: TechDef,
  techs: readonly TechDef[],
  done: ReadonlySet<string>,
): boolean {
  const e = epochNumber(t);
  const p = t.Poziom;
  if (e == null || typeof p !== 'number' || !Number.isFinite(p)) return true;
  for (const other of techs) {
    if (epochNumber(other) !== e) continue;
    const op = other.Poziom;
    if (typeof op !== 'number' || !Number.isFinite(op)) continue;
    if (op < p && !done.has(techId(other))) return false;
  }
  return true;
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
    if (!epochGateMet(t, techs, researched)) return false;      // Zasada 1
    if (!epochTierGateMet(t, techs, researched)) return false;  // Zasada 2
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
 * Brązownictwo→2, Hutnictwo żelaza→3.
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
    if (!epochGateMet(def, techs, state.zbadane)) return false;      // Zasada 1
    if (!epochTierGateMet(def, techs, state.zbadane)) return false;  // Zasada 2
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

    // TEMAT 10 — kolejka badań: promuj kolejny wpis z state.researchQueue (FIFO)
    // zanim spadniemy na domyślne "pierwszy dostępny". Wpisy, które w
    // międzyczasie przestały być poprawne (już zbadane skądinąd, albo prereq/
    // bramka wciąż niespełniona — np. gracz dodał je w złej kolejności) są po
    // cichu odrzucane; szukamy dalej w kolejce zamiast zatrzymać badania.
    while (state.researchQueue.length > 0) {
      const queuedId = state.researchQueue.shift()!;
      if (state.zbadane.has(queuedId)) continue;
      if (!targetAllowed(queuedId)) continue;
      state.playerResearchTargetId = queuedId;
      break;
    }

    // --- pick the next target (default: first available, to prevent stalling) ---
    // If the player sets a new target before next turn it will take priority.
    if (state.playerResearchTargetId !== null) {
      state.badana = state.playerResearchTargetId;
    } else {
      const nextAvail = availableTechs(techs, state.zbadane, gate);
      state.badana = nextAvail.length > 0 ? techId(nextAvail[0]!) : null;
    }
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
  // Progresja epok/tierów (Zasady 1+2) — twardsze niż prereki.
  if (!epochGateMet(def, techs, state.zbadane)) return false;
  if (!epochTierGateMet(def, techs, state.zbadane)) return false;
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

// ---------------------------------------------------------------------------
// TEMAT 10 — kolejka badań (do RESEARCH_QUEUE_MAX techów, silnik only; UI TBD)
// ---------------------------------------------------------------------------
//
// Warstwa silnika: stan (PlayerState.researchQueue) + auto-przejście po
// ukończeniu (patrz researchStep() powyżej). Celowo BEZ warstwy UI — wybór
// gdzie/jak gracz zaznacza kolejkę (hub vs drzewko vs oba, FIFO vs reorder,
// ETA per pozycja) czeka na decyzję właściciela (patrz raport TEMAT 10).
//
// Niezmiennik: gdy researchQueue.length > 0, to playerResearchTargetId MUSI
// być != null (kolejka to zawsze "to, co czeka ZA aktywnym celem"). Dlatego
// enqueueResearchTarget natychmiast promuje pierwszy wpis na aktywny cel, gdy
// nie ma jeszcze żadnego aktywnego celu.

/**
 * Liczba "zaplanowanych" techów (aktywny cel + kolejka), 0..RESEARCH_QUEUE_MAX.
 */
export function researchPlanLength(state: PlayerState): number {
  return (state.playerResearchTargetId !== null ? 1 : 0) + state.researchQueue.length;
}

/**
 * Dodaje tech na koniec kolejki badań (FIFO). Jeśli gracz nie ma jeszcze
 * aktywnego celu, pierwszy dodany tech od razu staje się celem aktywnym
 * (playerResearchTargetId) — kolejka trzyma tylko to, co idzie PO nim.
 *
 * Walidacja przy DODANIU jest celowo luźniejsza niż setPlayerResearchTarget:
 * sprawdzamy istnienie w danych, brak duplikatu w planie i że tech nie jest
 * już zbadany — ale NIE wymagamy spełnionych prereqów/bramek dla pozycji 2. i
 * 3., bo typowy przypadek to zaplanowanie łańcucha zależnego (tech B wymaga
 * tech A, oba w kolejce). Pełna walidacja (prereqy/bramki/epoka) następuje
 * dopiero w researchStep() w momencie promocji na aktywny cel — pozycja,
 * która wtedy okaże się niespełniona, jest po cichu pomijana (patrz tam).
 *
 * Zwraca false gdy: tech nie istnieje, już zbadany, już jest w planie
 * (aktywny cel lub w kolejce), albo plan jest już pełny (RESEARCH_QUEUE_MAX).
 */
export function enqueueResearchTarget(
  state: PlayerState,
  techId: string,
  techs: TechDef[],
): boolean {
  const def = techs.find(t => (t.Technologia ?? '').trim() === techId);
  if (!def) return false;
  if (state.zbadane.has(techId)) return false;
  if (state.playerResearchTargetId === techId) return false;
  if (state.researchQueue.includes(techId)) return false;
  if (researchPlanLength(state) >= RESEARCH_QUEUE_MAX) return false;

  if (state.playerResearchTargetId === null) {
    // Brak aktywnego celu: promuj natychmiast (zachowanie zgodne z
    // setPlayerResearchTarget — ale przez wspólną walidację luźniejszą dla
    // kolejki nie ma to znaczenia, bo pierwszy wpis i tak musi być
    // natychmiast grywalny, inaczej badania by stanęły).
    state.playerResearchTargetId = techId;
  } else {
    state.researchQueue.push(techId);
  }
  return true;
}

/**
 * Usuwa tech z planu badań (aktywny cel LUB pozycja w kolejce).
 * - Jeśli usuwany jest aktywny cel: promuje pierwszy poprawny wpis z kolejki
 *   na jego miejsce (jak przy naturalnym ukończeniu), inaczej zostaje null —
 *   researchStep() i tak dobierze domyślny (pierwszy dostępny) w kolejnym kroku.
 * - Jeśli usuwana jest pozycja w kolejce: zwykłe usunięcie ze środka, reszta
 *   FIFO zachowuje kolejność.
 * Zwraca false gdy id nie występuje w planie (no-op).
 */
export function dequeueResearchTarget(state: PlayerState, techId: string): boolean {
  const qIdx = state.researchQueue.indexOf(techId);
  if (qIdx >= 0) {
    state.researchQueue.splice(qIdx, 1);
    return true;
  }
  if (state.playerResearchTargetId === techId) {
    state.playerResearchTargetId = state.researchQueue.length > 0
      ? state.researchQueue.shift()!
      : null;
    return true;
  }
  return false;
}

/** Czyści całą kolejkę OCZEKUJĄCĄ (nie rusza aktywnego celu). */
export function clearResearchQueue(state: PlayerState): void {
  state.researchQueue.length = 0;
}

/**
 * Pełny plan badań do wyświetlenia w UI: aktywny cel (jeśli jest) jako
 * pierwszy element, potem kolejka FIFO. Długość 0..RESEARCH_QUEUE_MAX.
 */
export function getResearchPlanSnapshot(state: PlayerState): string[] {
  const plan: string[] = [];
  if (state.playerResearchTargetId !== null) plan.push(state.playerResearchTargetId);
  plan.push(...state.researchQueue);
  return plan;
}
