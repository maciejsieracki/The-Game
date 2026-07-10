/**
 * research.ts
 * Technology research logic for The Game -- pure module, no DOM, no THREE.
 *
 * Task A4: pick a tech, accumulate Nauka each turn, complete -> unlock its
 * buildings and units.
 *
 * Spec sources:
 *   - PROJEKT-GRY-master.md  (tech tree: par. 2, 8b warunki zwyciestwa naukowego)
 *   - gra/data/tech.json       (one row per tech: name, era, level, prereq, cost)
 *   - gra/data/buildings.json  (techUnlock -> buildings a tech unlocks)
 *   - gra/data/units.json      (Tech field -> units a tech unlocks)
 *
 * Design decisions / assumptions:
 *   1. A technology's canonical id is its Polish name (the "Technologia" field
 *      in tech.json).  Buildings link to a tech via "techUnlock" and units via
 *      "Tech"; both fields hold that same name.  So this module treats tech ids
 *      as the raw display strings, matching the A4 interface (string[] / string).
 *   2. Prerequisites live in the "Wymaga (prereq)" column.  Observed formats:
 *        "-" or em-dash        -> no prerequisite
 *        "Garncarstwo"         -> single prereq
 *        "Kolo + Brazownictwo" -> conjunction; ALL parts required
 *      We split on "+" and trim.  An em-dash / hyphen / empty value means none.
 *   3. techCost: use the "Koszt nauki" field when present; otherwise fall back
 *      to a deterministic scaling by level (Poziom) and era (Epoka).
 *   4. availableTechs: a tech is available iff every prerequisite is already in
 *      `ukonczone`, the tech itself is NOT in `ukonczone`, and the tech exists
 *      in the supplied data.  (Prereq names that are not real techs -- none in
 *      v0.1 -- would make a tech permanently unavailable.)
 *   5. startResearch is pure: it returns a NEW state, resetting `postep` to 0
 *      whenever the chosen tech differs from the one currently in progress.
 *      Re-selecting the tech already in progress keeps the accumulated `postep`.
 *      Selecting an already-completed tech is a no-op (biezace stays null).
 *   6. advanceResearch adds `naukaPerTurn` to `postep`; on reaching the cost it
 *      moves the tech to `ukonczone`, clears `biezace`, and resets `postep`.
 *      Overflow Nauka is discarded (not carried to the next tech) -- the player
 *      must pick the next tech explicitly.  naukaPerTurn <= 0 is a no-op.
 *   7. unlocksFor scans buildings/units by exact name match against the techId.
 *      Buildings return their `id` (stable key); units return their `Jednostka`
 *      display name (units have no separate id field).
 *   8. All functions are PURE: inputs are never mutated; new objects/arrays are
 *      returned.  No global state, no I/O.
 */

// ---------------------------------------------------------------------------
// Minimal data-row shapes (subset of data/loader.ts -- kept local so this
// module is self-contained and can be unit-tested with plain JSON literals).
// ---------------------------------------------------------------------------

/** One row of tech.json -- only the fields this module reads. */
export interface ResearchTechDef {
  /** Display name; serves as the canonical tech id. */
  Technologia: string;
  /** Era label ("Kamien", "Braz", ...). Used only by the cost fallback. */
  Epoka?: string | null;
  /** Tree level (1..5 in v0.1). Used only by the cost fallback. */
  Poziom?: number | null;
  /** Prerequisite expression, e.g. "Kolo + Brazownictwo", em-dash, "-". */
  'Wymaga (prereq)'?: string | null;
  /** Science cost; when null/absent the level/era fallback is used. */
  'Koszt nauki'?: number | null;
  /** Building required empire-wide before research may start (T-TECH-7). */
  'wymagany budynek'?: string | null;
  /**
   * Terrain improvement required empire-wide before research may start
   * (DRZEWKO-TECH-FIX faza 1): np. Żegluga wymaga ulepszenia "Tartak".
   * Etykieta wyświetlana; porównywana do slugów kluczy ulepszeń imperium.
   */
  'wymagane ulepszenie'?: string | null;
  /**
   * Numer epoki nadawany po ukończeniu tego techu (jawny awans epoki).
   * Obecny tylko na techach-kamieniach milowych (Brązownictwo→2, Hutnictwo żelaza→3).
   * Brak pola = ukończenie NIE zmienia epoki. Czytane przez playerState.ts.
   */
  awansDoEpoki?: number | null;
}

/** One row of buildings.json -- only the fields this module reads. */
export interface ResearchBuildingDef {
  /** Stable building key returned by unlocksFor. */
  id: string;
  /** Display name (matches tech.json "wymagany budynek"). */
  nazwa?: string | null;
  /** Tech that unlocks this building (matches ResearchTechDef.Technologia). */
  techUnlock?: string | null;
  /** Upgrade prerequisite building id in the same city. */
  upgradeFrom?: string | null;
}

/** One row of units.json -- only the fields this module reads. */
export interface ResearchUnitDef {
  /** Unit display name returned by unlocksFor (units have no id field). */
  Jednostka: string;
  /** Tech that unlocks this unit (matches ResearchTechDef.Technologia). */
  Tech?: string | null;
}

// ---------------------------------------------------------------------------
// Public state + result types (A4 interfaces)
// ---------------------------------------------------------------------------

/** Player's research progress. */
export interface ResearchState {
  /** Tech ids (names) already fully researched. */
  ukonczone: string[];
  /** Tech id currently being researched, or null when none is selected. */
  biezace: string | null;
  /** Nauka accumulated toward `biezace` (0 when nothing is in progress). */
  postep: number;
}

/** Result of advancing research by one turn. */
export interface AdvanceResult {
  /** New research state after applying the turn's Nauka. */
  state: ResearchState;
  /** Tech id completed THIS turn, or null when nothing completed. */
  completed: string | null;
}

/** Buildings and units unlocked by a tech. */
export interface TechUnlocks {
  /** Building ids (the `id` field from buildings.json). */
  budynki: string[];
  /** Unit names (the `Jednostka` field from units.json). */
  jednostki: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tokens in the prereq column that mean "no prerequisite". */
const BRAK_PREREQ = new Set(['', '-', '\u2014', '\u2013', 'brak', 'none']);

/** Optional empire-wide building + improvement gate for research (T-TECH-7). */
export interface ResearchBuildingGate {
  /** Union of building ids built in any city of the empire. */
  empireBuiltIds: ReadonlySet<string> | readonly string[];
  buildings: readonly ResearchBuildingDef[];
  /**
   * Union of terrain-improvement keys (slugs) placed anywhere in the empire —
   * gate for tech's optional "wymagane ulepszenie" field. Optional: when absent
   * the improvement gate is treated as met (backward compatible).
   */
  empireImprovementKeys?: ReadonlySet<string> | readonly string[];
}

function empireBuiltSet(gate: ResearchBuildingGate): Set<string> {
  return gate.empireBuiltIds instanceof Set
    ? gate.empireBuiltIds
    : new Set(gate.empireBuiltIds);
}

/** Map tech.json "wymagany budynek" label → building id (id or nazwa match). */
export function resolveRequiredBuildingId(
  requiredLabel: string,
  buildings: readonly ResearchBuildingDef[],
): string | null {
  const raw = requiredLabel.trim();
  if (!raw || BRAK_PREREQ.has(raw.toLowerCase())) return null;
  for (const b of buildings) {
    if (b.id === raw) return b.id;
    const nazwa = (b.nazwa ?? '').trim();
    if (nazwa === raw) return b.id;
  }
  const lower = raw.toLowerCase();
  for (const b of buildings) {
    if (b.id.toLowerCase() === lower) return b.id;
    const nazwa = (b.nazwa ?? '').trim().toLowerCase();
    if (nazwa === lower) return b.id;
  }
  return raw;
}

/** True when empire has the building required by tech (any city). */
export function buildingGateMet(
  tech: ResearchTechDef,
  gate: ResearchBuildingGate,
): boolean {
  const label = tech['wymagany budynek'];
  if (label == null) return true;
  const trimmed = String(label).trim();
  if (!trimmed || BRAK_PREREQ.has(trimmed.toLowerCase())) return true;
  const reqId = resolveRequiredBuildingId(trimmed, gate.buildings);
  if (!reqId) return true;
  return empireBuiltSet(gate).has(reqId);
}

/**
 * Normalizuje etykietę ulepszenia (np. "Tartak", "Kopalnia miedzi") do slugu
 * zgodnego z kluczami ulepszeń imperium (lowercase, bez diakrytyków, spacje→'_').
 * "Tartak" → "tartak"; "Kopalnia miedzi" → "kopalnia_miedzi".
 */
const PL_DIACRITICS: Readonly<Record<string, string>> = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
  'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
};

export function slugifyImprovementLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL_DIACRITICS[c] ?? c)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function empireImprovementSet(gate: ResearchBuildingGate): Set<string> {
  const src = gate.empireImprovementKeys;
  if (!src) return new Set<string>();
  return src instanceof Set ? src : new Set(src as readonly string[]);
}

/**
 * True when empire owns the terrain improvement required by tech.
 * No "wymagane ulepszenie" field (or empty) → gate met (backward compatible).
 * Otherwise the tech's improvement label is slugified and compared to the set
 * of improvement keys placed in the empire (gate.empireImprovementKeys).
 */
export function improvementGateMet(
  tech: ResearchTechDef,
  gate: ResearchBuildingGate,
): boolean {
  const label = tech['wymagane ulepszenie'];
  if (label == null) return true;
  const trimmed = String(label).trim();
  if (!trimmed || BRAK_PREREQ.has(trimmed.toLowerCase())) return true;
  const wanted = slugifyImprovementLabel(trimmed);
  if (!wanted) return true;
  return empireImprovementSet(gate).has(wanted);
}

/** True when BOTH the building gate and the improvement gate are satisfied. */
export function researchGatesMet(
  tech: ResearchTechDef,
  gate: ResearchBuildingGate,
): boolean {
  return buildingGateMet(tech, gate) && improvementGateMet(tech, gate);
}

/** Cost-fallback base (used only when "Koszt nauki" is missing). */
const FALLBACK_KOSZT_BAZOWY = 10;
/** Cost-fallback increment per tree level above 1. */
const FALLBACK_KOSZT_NA_POZIOM = 4;
/** Cost-fallback bonus per era beyond the first (era order below). */
const FALLBACK_KOSZT_NA_EPOKE = 8;

/** Era ordering for the cost fallback (index 0 = earliest). */
const KOLEJNOSC_EPOK = ['Kamien', 'Braz', 'Zelazo'];

// ---------------------------------------------------------------------------
// Prerequisite parsing
// ---------------------------------------------------------------------------

/**
 * Splits a "Wymaga (prereq)" expression into the list of required tech ids.
 * "Kolo + Brazownictwo" -> ["Kolo", "Brazownictwo"]; em-dash/"-"/"" -> [].
 * Exported so callers can render a tech's requirements.
 */
export function parsePrerequisites(wyrazenie: string | null | undefined): string[] {
  if (wyrazenie == null) return [];
  const trimmed = wyrazenie.trim();
  if (BRAK_PREREQ.has(trimmed.toLowerCase())) return [];
  return trimmed
    .split('+')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !BRAK_PREREQ.has(part.toLowerCase()));
}

/** Returns the prerequisite tech ids for a single tech definition. */
export function prerequisitesOf(tech: ResearchTechDef): string[] {
  return parsePrerequisites(tech['Wymaga (prereq)']);
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** Finds a tech definition by id (name); undefined when absent. */
export function findTech(
  techData: readonly ResearchTechDef[],
  techId: string,
): ResearchTechDef | undefined {
  return techData.find((t) => t.Technologia === techId);
}

// ---------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------

/**
 * Nauka cost to complete a tech.
 * Uses the tech's "Koszt nauki" when it is a positive finite number; otherwise
 * falls back to a deterministic scaling by tree level and era:
 *   base + (Poziom - 1) * perLevel + eraIndex * perEra.
 */
export function techCost(tech: ResearchTechDef): number {
  const koszt = tech['Koszt nauki'];
  if (typeof koszt === 'number' && Number.isFinite(koszt) && koszt > 0) {
    return koszt;
  }
  const poziom =
    typeof tech.Poziom === 'number' && Number.isFinite(tech.Poziom)
      ? tech.Poziom
      : 1;
  const epokaIdx = tech.Epoka ? KOLEJNOSC_EPOK.indexOf(tech.Epoka) : 0;
  const epokaBonus = (epokaIdx < 0 ? 0 : epokaIdx) * FALLBACK_KOSZT_NA_EPOKE;
  return (
    FALLBACK_KOSZT_BAZOWY +
    Math.max(0, poziom - 1) * FALLBACK_KOSZT_NA_POZIOM +
    epokaBonus
  );
}

/** Convenience: cost looked up by tech id; null when the tech is unknown. */
export function techCostById(
  techData: readonly ResearchTechDef[],
  techId: string,
): number | null {
  const tech = findTech(techData, techId);
  return tech ? techCost(tech) : null;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/**
 * Returns the ids of every tech that can currently be started:
 *   - not already in `ukonczone`, and
 *   - all of its prerequisites are in `ukonczone`.
 * The currently-researched tech (`biezace`) is still listed -- selecting it
 * again is harmless and keeps progress (see startResearch).
 */
export function availableTechs(
  state: ResearchState,
  techData: readonly ResearchTechDef[],
  gate?: ResearchBuildingGate,
): string[] {
  const done = new Set(state.ukonczone);
  const result: string[] = [];
  for (const tech of techData) {
    if (done.has(tech.Technologia)) continue;
    const prereqs = prerequisitesOf(tech);
    if (!prereqs.every((p) => done.has(p))) continue;
    if (gate && !researchGatesMet(tech, gate)) continue;
    result.push(tech.Technologia);
  }
  return result;
}

/** True when `techId` exists, is unresearched, prereqs met, and building gate OK. */
export function canResearch(
  state: ResearchState,
  techData: readonly ResearchTechDef[],
  techId: string,
  gate?: ResearchBuildingGate,
): boolean {
  if (state.ukonczone.includes(techId)) return false;
  const tech = findTech(techData, techId);
  if (!tech) return false;
  const done = new Set(state.ukonczone);
  if (!prerequisitesOf(tech).every((p) => done.has(p))) return false;
  if (gate && !researchGatesMet(tech, gate)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// State transitions (all pure)
// ---------------------------------------------------------------------------

/** A fresh research state with nothing researched and nothing selected. */
export function createResearchState(): ResearchState {
  return { ukonczone: [], biezace: null, postep: 0 };
}

/**
 * Selects `techId` as the active research.
 * - If it is already completed, returns an unchanged copy (no-op).
 * - If it equals the tech already in progress, keeps the accumulated `postep`.
 * - Otherwise switches to it and resets `postep` to 0.
 * Pure: a new ResearchState is returned; the input is not mutated.
 */
export function startResearch(state: ResearchState, techId: string): ResearchState {
  if (state.ukonczone.includes(techId)) {
    return {
      ukonczone: [...state.ukonczone],
      biezace: state.biezace,
      postep: state.postep,
    };
  }
  const sameAsCurrent = state.biezace === techId;
  return {
    ukonczone: [...state.ukonczone],
    biezace: techId,
    postep: sameAsCurrent ? state.postep : 0,
  };
}

/**
 * Advances the active research by one turn.
 * Adds `naukaPerTurn` to `postep`; when `postep` reaches the tech's cost the
 * tech is appended to `ukonczone`, `biezace` is cleared and `postep` reset to 0.
 * Returns the new state plus the id completed this turn (or null).
 *
 * No-op (returns a copy + null) when nothing is selected, naukaPerTurn <= 0, or
 * the active tech id is missing from `techData`.
 * Pure: the input state is never mutated.
 */
export function advanceResearch(
  state: ResearchState,
  naukaPerTurn: number,
  techData: readonly ResearchTechDef[],
): AdvanceResult {
  const unchanged: ResearchState = {
    ukonczone: [...state.ukonczone],
    biezace: state.biezace,
    postep: state.postep,
  };

  if (state.biezace == null) {
    return { state: unchanged, completed: null };
  }
  if (!Number.isFinite(naukaPerTurn) || naukaPerTurn <= 0) {
    return { state: unchanged, completed: null };
  }

  const tech = findTech(techData, state.biezace);
  if (!tech) {
    // Unknown active tech -- accumulate nothing, leave state intact.
    return { state: unchanged, completed: null };
  }

  const koszt = techCost(tech);
  const nowyPostep = state.postep + naukaPerTurn;

  if (nowyPostep >= koszt) {
    const completed = state.biezace;
    const ukonczone = state.ukonczone.includes(completed)
      ? [...state.ukonczone]
      : [...state.ukonczone, completed];
    return {
      state: { ukonczone, biezace: null, postep: 0 },
      completed,
    };
  }

  return {
    state: { ukonczone: [...state.ukonczone], biezace: state.biezace, postep: nowyPostep },
    completed: null,
  };
}

/** Fraction in [0,1] of the active research completed; 0 when none active. */
export function researchProgressFraction(
  state: ResearchState,
  techData: readonly ResearchTechDef[],
): number {
  if (state.biezace == null) return 0;
  const tech = findTech(techData, state.biezace);
  if (!tech) return 0;
  const koszt = techCost(tech);
  if (koszt <= 0) return 1;
  const frac = state.postep / koszt;
  return frac < 0 ? 0 : frac > 1 ? 1 : frac;
}

/** Turns remaining for the active research at a steady Nauka/turn rate. */
export function turnsToComplete(
  state: ResearchState,
  naukaPerTurn: number,
  techData: readonly ResearchTechDef[],
): number | null {
  if (state.biezace == null) return null;
  if (!Number.isFinite(naukaPerTurn) || naukaPerTurn <= 0) return null;
  const tech = findTech(techData, state.biezace);
  if (!tech) return null;
  const pozostalo = techCost(tech) - state.postep;
  if (pozostalo <= 0) return 0;
  return Math.ceil(pozostalo / naukaPerTurn);
}

// ---------------------------------------------------------------------------
// Unlocks
// ---------------------------------------------------------------------------

/**
 * Buildings and units a tech unlocks.
 * Buildings: every row whose `techUnlock` equals `techId` -> its `id`.
 * Units:     every row whose `Tech` equals `techId` -> its `Jednostka` name.
 * Matching is exact; both result arrays are de-duplicated and order-preserving.
 */
export function unlocksFor(
  techId: string,
  buildingsData: readonly ResearchBuildingDef[],
  unitsData: readonly ResearchUnitDef[],
): TechUnlocks {
  const budynki: string[] = [];
  for (const b of buildingsData) {
    if (b.techUnlock != null && b.techUnlock === techId && !budynki.includes(b.id)) {
      budynki.push(b.id);
    }
  }
  const jednostki: string[] = [];
  for (const u of unitsData) {
    if (u.Tech != null && u.Tech === techId && !jednostki.includes(u.Jednostka)) {
      jednostki.push(u.Jednostka);
    }
  }
  return { budynki, jednostki };
}

/**
 * E1 ABC 2=B*: tech wcześniejszych epok na starcie (nie bieżącej).
 * Id tech = pole Technologia (kanon research.ts).
 */
export function grantTechEpokWczesniejszych(
  techs: readonly ResearchTechDef[],
  epochId: string,
): Set<string> {
  const granted = new Set<string>();
  const priorLabels: string[] = [];
  if (epochId === 'braz') priorLabels.push('Kamień');
  else if (epochId === 'zelazo') priorLabels.push('Kamień', 'Brąz');
  if (priorLabels.length === 0) return granted;

  for (const row of techs) {
    const ep = row.Epoka ?? '';
    const id = row.Technologia;
    if (id && priorLabels.includes(ep)) granted.add(id);
  }
  return granted;
}

/** Aggregate unlocks across all techs in `ukonczone`. */
export function allUnlocked(
  state: ResearchState,
  buildingsData: readonly ResearchBuildingDef[],
  unitsData: readonly ResearchUnitDef[],
): TechUnlocks {
  const budynki: string[] = [];
  const jednostki: string[] = [];
  for (const techId of state.ukonczone) {
    const u = unlocksFor(techId, buildingsData, unitsData);
    for (const b of u.budynki) if (!budynki.includes(b)) budynki.push(b);
    for (const j of u.jednostki) if (!jednostki.includes(j)) jednostki.push(j);
  }
  return { budynki, jednostki };
}
