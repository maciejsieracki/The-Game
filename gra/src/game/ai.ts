/**
 * ai.ts
 * AI decision module for The Game -- pure functions, no DOM, no THREE.
 * Implements Spec-AI.md (single difficulty level, Level 1 = Simple).
 * Deterministic; optional rng seed passed via opts.
 *
 * Entry point: decideAITurn()
 *
 * References:
 *   Spec-AI.md §1-9, ai-params.json, PROJEKT-GRY-master.md §8b/8c/8d
 *   cities.ts (City, canFoundCity), units/setup.ts (RuntimeUnit, computePath, hexDistance, categoryOf)
 */

import type { GameMap } from '../types/map';
import type { Hex }     from '../types/hex';
import { Nakladka }     from '../types/hex';
import type { GameData } from '../data/loader';
import aiParamsRaw from '../../data/ai-params.json';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, computePath, computeReachable, keyOf, isCivilianUnit } from '../units/setup';
import {
  cityStateMilitaryProductionCap,
  type DifficultyLevel,
} from './city-state-difficulty';
import type { City }       from './cities';
import { canFoundCity }    from './cities';
import { evaluateFoundCityAffordance } from './city-founding';
import {
  aiBypassClusterConsolidation,
  aiClusterOutsidePenalty,
  aiPowerGoalFoundingInterval,
  aiTreasuryPracaForFounding,
} from './ai-expansion';
import { aiProductionScoreBoosts } from './ai-production-priorities';
import {
  AI_THREAT_RANGE_DEFAULT,
  aiThreatMajorDevScore,
  aiThreatMajorUnitScores,
  aiThreatWallProductionScore,
} from './ai-threat-mode';
import type { CivAiProfile } from './civ-ai-data';
import type { ImprovementKey } from '../render/improvements';
import type { TerritoryNode } from '../map/territory';
import { cityTerritoryRadius } from '../map/territory';
import {
  epochGateMet,
  epochTierGateMet,
  researchGatesMet,
  type ResearchBuildingGate,
} from './research';
import { hexKeysWithinRadius } from './okolica';
import {
  AI_IMPROVEMENT_PRIORITY,
  pickAutoImprovements,
} from './auto-improvements';
import { buildingStockCost } from './building-stock-cost';

// ---------------------------------------------------------------------------
// AICommand discriminated union
// ---------------------------------------------------------------------------

/** Move a unit to (toQ, toR). */
export interface AICmdMove {
  type: 'move';
  unitId: string;
  toQ: number;
  toR: number;
}

/** Found a city at (q, r) via panel budowy (foundCityAt — bez osadnika). */
export interface AICmdFoundCityAt {
  type: 'foundCityAt';
  q: number;
  r: number;
}

/** Attack an enemy unit. */
export interface AICmdAttack {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
}

/** Enqueue a building or unit in a city's production queue. */
export interface AICmdBuild {
  type: 'build';
  cityId: string;
  /** id key matching Budynek or Jednostka in data JSON */
  buildingId: string;
}

/**
 * D-IMPROVEMENTS: AI buduje ulepszenie terenu na (q,r) w swoim terytorium.
 * Egzekucja main.ts -- jak `applyBuildRequest` (tech gate + koszt Pracy z puli AI),
 * ale AI commituje od razu (bez `pendingImprovementsTurn`/cofnięcia w tej samej turze).
 * Wyjątek: `key: 'wyrab'` (typ 'wycinka') -- AI NIE ma per-owner wieloturowego
 * `hexClearingStates` (silnik tyka je tylko dla ownerId 0 / gracza), więc main.ts
 * commituje efekt końcowy (usuwa nakładkę lasu, netto-zero Pracy wg
 * terrain-improvements.json) od razu, zamiast kolejkować wycinkę na kolejne tury --
 * patrz egzekucja `cmd.type === 'buildImprovement'` w main.ts (TEMAT #8, 2026-07-23).
 * @see planCityImprovements
 */
export interface AICmdBuildImprovement {
  type: 'buildImprovement';
  ownerId: number;
  q: number;
  r: number;
  key: ImprovementKey;
}

/** Signal end of this AI player's turn. */
export interface AICmdEndTurn {
  type: 'endTurn';
}

/** Union of all AI command types. */
export type AICommand =
  | AICmdMove
  | AICmdFoundCityAt
  | AICmdAttack
  | AICmdBuild
  | AICmdBuildImprovement
  | AICmdEndTurn;

// ---------------------------------------------------------------------------
// Archetype modifier keys (from ai-params.json)
// ---------------------------------------------------------------------------

type ArchKey =
  | 'grecy' | 'rzym' | 'chiny' | 'zulusi' | 'inkowie' | 'egipt' | 'sumer' | 'celtowie' | 'germanie'
  | 'harappa' | 'hetyci' | 'slowianie' | 'babilonia' | 'asyria' | 'fenicjanie';

/** Maps TypCywilizacji string to archetype key used in ai-params.json. */
const CIV_TO_ARCH: Record<string, ArchKey> = {
  grecy:             'grecy',
  rzymianie:         'rzym',
  chinczycy:         'chiny',
  zulusi:            'zulusi',
  inkowie:           'inkowie',
  egipt:             'egipt',
  babilon:           'sumer',
  sumer:             'sumer',
  sumerowie:         'sumer',
  celtowie:          'celtowie',
  germanie:          'germanie',
  harappa:           'harappa',
  hetyci:            'hetyci',
  slowianie:         'slowianie',
  babilonia:         'babilonia',
  asyria:            'asyria',
  fenicjanie:        'fenicjanie',
};

/** Per-archetype production priority deltas loaded from ai-params.json. */
interface ArchetypeMods {
  wojsko:   number;
  nauka:    number;
  ekonomia: number;
  obrona:   number;
}

function readArchMods(data: GameData, archKey: ArchKey): ArchetypeMods {
  const p = data.aiParams;

  function val(key: string): number {
    const entry = p[key];
    return (entry !== undefined && (entry['wartość'] ?? entry['wartosc']) !== null && (entry['wartość'] ?? entry['wartosc']) !== undefined) ? ((entry['wartość'] ?? entry['wartosc']) as number) : 0;
  }

  return {
    wojsko:   val(`archetype_${archKey}_wojsko_priorytet`),
    nauka:    val(`archetype_${archKey}_nauka_priorytet`),
    ekonomia: val(`archetype_${archKey}_ekonomia_priorytet`),
    obrona:   val(`archetype_${archKey}_obrona_priorytet`),
  };
}

function getAiParam(data: GameData, key: string, fallback: number): number {
  const entry = data.aiParams[key];
  const _v = entry !== undefined ? (entry['wartość'] ?? entry['wartosc']) : undefined; if (_v !== null && _v !== undefined) return _v as number;
  return fallback;
}

// ---------------------------------------------------------------------------
// Opts and helpers
// ---------------------------------------------------------------------------

/** Optional configuration for decideAITurn. */
export interface AITurnOpts {
  /** Civilization type string (TypCywilizacji value) for archetype modifiers. */
  civType?: string;
  /**
   * Already-built building ids in each city (key = cityId).
   * Used to avoid queueing a building that is already present.
   */
  cityBuildings?: Record<string, string[]>;
  /**
   * Difficulty level (poziom trudności): 1 = Prosty, 2 = Normalny (default), 3 = Trudny.
   * Controls production score bonus and exposes combat bonus for the engine.
   * Values loaded from ai-params.json (trudnosc_poziom<N>_*).
   */
  poziomTrudnosci?: 1 | 2 | 3;
  /**
   * Startowe miasta z trudnosc_poziom<N>_startowe_miasta (ai-params).
   * Używane w computeMajorAiEarlyGame (R-AI-TRUDNOSC P2-Q2: L3 early max 25 gdy ≥1).
   */
  startoweMiasta?: number;
  /**
   * Trudność gry gracza (_menuDifficulty) — cap wojska MP i absorpcja CS.
   * NIE suwak trudności MP (_menuCityStateDifficulty).
   */
  menuDifficulty?: DifficultyLevel;
  /**
   * Budget gate (pkt5): called by the engine with (cityId, buildingId).
   * When provided, only candidates for which canAfford returns true are considered.
   * If ALL candidates fail the gate, AI skips production (saves/waits) — never builds over budget.
   * When omitted -> no filtering (present behaviour preserved).
   */
  canAfford?: (cityId: string, buildingId: string) => boolean;
  /**
   * Bramka dostępności produkcji (tech/epoka/prereq/zasoby imperium/stolica…) —
   * ta sama semantyka co availableProduction w main.ts.
   * Gdy podane: kandydaci z chooseCityProduction są filtrowani PRZED canAfford.
   * Gdy brak — zero regresji (stare testy bez callbacka).
   */
  isProductionAllowed?: (cityId: string, itemId: string) => boolean;
  /**
   * Item cost accessor (pkt5): returns the numeric cost of a given item (buildingId or unitId).
   * When provided together with canAfford, AI uses score/cost ratio to prefer cheaper affordable
   * options when the highest-scored item is not affordable.
   * The cost unit matches the current epoch: Kamien = Praca/Produkcja, Braz+ = Pieniadz.
   * EKONOMIA decides which resource type is used; AI only calls canAfford and reads the number.
   * When omitted -> affordable items sorted by score only (no ratio optimisation).
   */
  itemCost?: (itemId: string) => number;
  /**
   * Cluster centre hex for this civilisation type (pkt3).
   * When provided together with clusterRadius, settler target scoring
   * adds a large bonus (+50) for hexes inside the cluster and a penalty (-20) outside.
   * Source: map layout / starting placement — consumed here, never set here.
   * When omitted -> present behaviour preserved (zero regression).
   *
   * Mapping from ClusterPlacement (map/clusters.ts):
   *   Given: TypeCluster tc = placement.klastry.find(k => k.typ === myTyp)!
   *   clusterCenter = tc.centrum            // { q, r } — Voronoi centre of this civ's region
   *   clusterRadius = placement.minDystans  // min city spacing, used as cluster radius heuristic
   *   (Alternatively use a fixed radius, e.g. 8–12, if minDystans is too tight.)
   *
   * Example engine call:
   *   const tc = placement.klastry.find(k => k.typ === civTyp);
   *   const clusterCenter = tc?.centrum;
   *   const clusterRadius = tc ? placement.minDystans * 2 : undefined;
   *   decideAITurn(playerId, units, cities, map, data, { ..., clusterCenter, clusterRadius });
   */
  clusterCenter?: { q: number; r: number };
  /**
   * Radius (in hex steps) of the cluster around clusterCenter (pkt3).
   * Must be provided together with clusterCenter to take effect.
   * Suggested value: placement.minDystans * 2 (covers ~10 city slots per cluster).
   */
  clusterRadius?: number;
  /**
   * D-START miasta-kopie typu (profil kopia_typu_obronna).
   * Silnik ustawia z `ClusterStartPlan.typCityCopyOwners.has(ownerId)`.
   * Gdy true: brak osadników/ekspansji/foundCity — ale POZA TYM pełna, normalna
   * produkcja (budynki gospodarcze, Koszary, jednostki) jak każde inne miasto AI
   * (Maciej 2026-07-20 — miasta-siostry aktywnym graczem, nie biernym łupem).
   * @see cluster-start.ts `typCityCopyOwners`
   */
  defensiveCopy?: boolean;
  /**
   * Faza 1 konsolidacji klastra (Maciej 2026-07-07): wrogie miasta-państwa
   * tego samego typu w obrębie klastra — przejąć / wasalizować przed ekspansją.
   * Silnik podaje cele startCityState z tego samego typu cywilizacji.
   */
  clusterStateTargets?: Array<{ ownerId: number; q: number; r: number }>;
  /**
   * AI-CS-CLUSTER-DIFF (Maciej 2026-07-30): tura <= 100 i pozostały CS w kręgu —
   * twardy priorytet konsolidacji (bez bypass ekspansywności).
   */
  clusterConquestDeadlineActive?: boolean;
  /**
   * D-START posiłki w klastrze (Maciej 2026-07-20): pozostałe miasta-siostry
   * (profil kopia_typu_obronna, TEN SAM typ cywilizacji/klaster) — źródła i cele
   * wewnątrz-klastrowych posiłków. Silnik podaje wyłącznie dla ownerId z
   * `typCityCopyOwners`, filtrowane do tego samego `tc.typ` w promieniu klastra.
   * Gdy obecne: decideDefensiveCopyTurn może wysłać JEDNĄ nadwyżkową jednostkę
   * obrony ku zagrożonej siostrze (zero bonusu — normalny ruch, normalna jednostka).
   * @see cluster-start.ts `typCityCopyOwners`
   */
  sisterCityStates?: Array<{ ownerId: number; q: number; r: number }>;
  /**
   * D-IMPROVEMENTS (AI buduje ulepszenia terenu): węzły terytorium WSZYSTKICH
   * właścicieli -- silnik podaje `buildAllTerritoryNodes()` (main.ts), świeżo
   * per owner/turę (odzwierciedla miasta założone wcześniej W TEJ SAMEJ turze
   * przez inne AI). Rozstrzyga nakładanie się zasięgów -- ta sama funkcja co dla
   * gracza (`buildImprovementQualifier`, map/improvement-build.ts). Gdy brak --
   * `planCityImprovements` nic nie planuje (bezpieczny no-op, zero regresji).
   */
  territoryNodes?: readonly TerritoryNode[];
  /**
   * D-IMPROVEMENTS: heks → warstwy ulepszeń już postawionych NA MAPIE (ta sama
   * mapa co dla gracza -- ulepszenia stoją na terenie, nie per-owner). Silnik
   * podaje main.ts `placedImprovements`.
   */
  placedImprovements?: ReadonlyMap<string, string | readonly string[]>;
  /**
   * D-IMPROVEMENTS: zbadane technologie TEGO AI (main.ts `aiResearchDone.get(ownerId)`).
   * Bramkuje typy ulepszeń dostępne do budowy (jak `player.zbadane` dla gracza).
   */
  improvementTechs?: ReadonlySet<string>;
  /**
   * D-IMPROVEMENTS: dostępna Praca w puli TEGO AI (main.ts
   * `aiPracaPoolByOwner.get(ownerId)`). Poniżej progu nadwyżki
   * (`AI_IMPROVEMENT_PRACA_SURPLUS`) AI nie próbuje budować -- throttling
   * wydajności (większość tur wraca [] natychmiast, bez skanu heksów).
   */
  pracaAvailable?: number;
  /**
   * P-AI-011 (Maciej 2026-07-26): surowce ilościowe z zapasem < 1 pakietu handlowego.
   * Silnik (main.ts) — priorytet: (1) handel, (2) budowa/ulepszenie pod brak.
   */
  resourceDeficitKeys?: readonly string[];
  /**
   * D-IMPROVEMENTS: epoka TEGO AI (main.ts `empireEpochForOwner(ownerId)`) --
   * wymagane przez qualifier dla hodowli Inków (bydło/owce poza lamą dopiero
   * od epoki 3, patrz livestock-unlock.ts). Domyślnie 1 gdy brak.
   */
  civEra?: number;
  /**
   * D-START posiłki v2 (Maciej 2026-07-21 przeróbka ZMIANA 1): "Wsparcie miast-państw"
   * — NIE osobna opcja setupu (usunięta), pochodna TRUDNOŚCI gry (niskie/normalne/mocne
   * = easy/normal/hard). Steruje RESUP_TIERS (próg zagrożenia, min. garnizon do wysyłki,
   * maks. posiłków/turę) w decideDefensiveCopyTurn.
   * Silnik podaje main.ts `_menuCitySupport` (z `_menuDifficulty` przez
   * applyMenuParams — patrz main.ts). Gdy brak (stary save / brak pola) -- fallback
   * 'normal' (= dzisiejsze stałe 1/2/1, zero regresji domyślnej).
   */
  citySupportLevel?: 'low' | 'normal' | 'strong';
  /**
   * Trudność miast-państw = Hard: aktywne wsparcie ofensywne (marsz na wroga wojny,
   * łączenie z armią sojusznika/siostry). Normal/Easy = false (legacy defend-only).
   * Silnik: main.ts `_menuCityStateDifficulty === 'hard'`.
   */
  cityStateOffensiveSupport?: boolean;
  /**
   * Sojusznicy (pełne AI) do łączenia armii na Trudnym — ownerId spoza klastra MP.
   * Siostry w klastrze są w sisterCityStates; tu tylko zewnętrzni sojusznicy z activeDeals.
   */
  warAllyOwnerIds?: readonly number[];
  /**
   * Silnik: czy AI (playerId) może prowadzić walkę z ownerId celu.
   * main.ts ustawia: gracz (0) tylko przy status 'wojna' — bez tego miasta-państwa
   * atakowały zwiadowcę przy PRZYJAZNY/neutralni (bug 2026-07-21).
   * Gdy brak — brak filtra (testy lane / stare save).
   */
  canEngageOwner?: (targetOwnerId: number) => boolean;
  /**
   * C-AI-PAKIET (2026-07-26): profil z civ-ai.json per typ cywilizacji —
   * ekspansywnosc i sklonnoscDoPodboju sterują ekspansją i agresją wojskową.
   */
  civAiProfile?: Pick<
    CivAiProfile,
    | 'ekspansywnosc'
    | 'sklonnoscDoPodboju'
    | 'priorytetMilitarny'
    | 'priorytetEkonomia'
    | 'priorytetNauka'
  >;
  /** Bieżąca tura (silnik) — cel #1 Mocy co 3 tury. */
  currentTurn?: number;
  /** R-AI-KOLONIZACJA-Q2: ownerIds miast-państw w wasalizacji (nie wolne MP). */
  vassalizedCityStateOwnerIds?: readonly number[];
  /** Pozycja w rankingu Mocy (1 = najsilniejszy; silnik: computeAbsolutePowerRank). */
  powerRank?: number;
  /** Moc państwa ownerId — do wyboru słabszego celu wojskowego (C-AI-MOC-Q2=A). */
  powerOfOwner?: (ownerId: number) => number;
}

/** Bramka walki AI — domyślnie przepuszcza (testy bez silnika). */
function aiCanEngageOwner(opts: AITurnOpts, targetOwnerId: number): boolean {
  return opts.canEngageOwner ? opts.canEngageOwner(targetOwnerId) : true;
}

/** Omijanie konsolidacji klastra — wyłączone przy deadline do t.100 (AI-CS-CLUSTER-DIFF). */
function aiMayBypassClusterConsolidation(ekspansywnosc: number, opts: AITurnOpts): boolean {
  if (opts.clusterConquestDeadlineActive) return false;
  return aiBypassClusterConsolidation(ekspansywnosc);
}

/**
 * Difficulty parameters loaded from ai-params.json for a given level.
 * Returned by loadDifficultyParams(); used in decideAITurn().
 */
export interface DifficultyParams {
  /** Production/Work yield multiplier bonus (e.g. 0.1 = +10%). Applied to production score. */
  bonusProdukcja: number;
  /** Science bonus per turn — passed to engine, not used in ai.ts decisions. */
  bonusNauka: number;
  /** Additional starting units — engine spawn, not used in ai.ts decisions. */
  startoweJednostki: number;
  /** Additional starting cities — engine spawn, not used in ai.ts decisions. */
  startoweMiasta: number;
  /** Combat stats bonus fraction (e.g. 0.05 = +5%). Passed to engine / combat resolver. */
  bonusWalka: number;
  // ---- Spryt AI (T4=B): kontrola zachowania, nie tylko bonusy liczbowe ----
  /**
   * Mnoznik efektywnej agresji (0..2).
   * Skaluje agresję w decideAIReaction i decideAIDiplomacy.
   * poziom1=0.85 (lagodniejsza), 2=1.0 (neutralny), 3=1.2 (bardziej agresywny).
   */
  agresjaMnoznik: number;
  /**
   * Aktywnosc dyplomacji (0..2). Skaluje szanse zaproponowania sojuszu/handlu.
   * poziom1=0.8 (pasywna), 2=1.0 (normalna), 3=1.25 (aktywna).
   */
  dyplomacjaAktywnosc: number;
  /**
   * Preferowanie slabszego celu (0..1).
   * 0 = zachowanie neutralne (najblizszy wrog), 1 = AI zdecydowanie wybiera slabszego/blizszego zwyciestwu.
   * poziom1=0.0, 2=0.5, 3=1.0.
   */
  celObranie: number;
}

/**
 * Loads difficulty parameters for the given level (1/2/3) from ai-params.json.
 * Exported so engine can consume startowe_* and bonus_walka at spawn time.
 */
export function loadDifficultyParams(data: GameData, poziom: 1 | 2 | 3 = 2): DifficultyParams {
  const n = poziom;
  return {
    bonusProdukcja:    getAiParam(data, `trudnosc_poziom${n}_bonus_produkcja`,    n === 1 ? 0 : n === 2 ? 0.1 : 0.25),
    bonusNauka:        getAiParam(data, `trudnosc_poziom${n}_bonus_nauka`,         n === 1 ? 0 : n === 2 ? 1   : 2),
    startoweJednostki: getAiParam(data, `trudnosc_poziom${n}_startowe_jednostki`, n === 1 ? 0 : n === 2 ? 1   : 0),
    startoweMiasta:    getAiParam(data, `trudnosc_poziom${n}_startowe_miasta`,    n === 1 ? 0 : n === 2 ? 0   : 1),
    bonusWalka:        getAiParam(data, `trudnosc_poziom${n}_bonus_walka`,         n === 1 ? 0 : n === 2 ? 0   : 0.05),
    // Spryt AI (T4=B): zachowanie zmienia sie z poziomem, nie tylko liczby
    agresjaMnoznik:      getAiParam(data, `trudnosc_poziom${n}_agresja_mnoznik`,      n === 1 ? 0.85 : n === 2 ? 1.0 : 1.2),
    dyplomacjaAktywnosc: getAiParam(data, `trudnosc_poziom${n}_dyplomacja_aktywnosc`, n === 1 ? 0.8  : n === 2 ? 1.0 : 1.25),
    celObranie:          getAiParam(data, `trudnosc_poziom${n}_cel_obranie`,           n === 1 ? 0.0  : n === 2 ? 0.5 : 1.0),
  };
}

/** Minimal city info used by the AI (derived from cities.ts City). */
export type AICity = City;

// ---------------------------------------------------------------------------
// Research decision (Spec-AI §5 + §9 step 3)
// ---------------------------------------------------------------------------

/**
 * Minimal tech definition shape expected by chooseAIResearch.
 * Compatible with both TechDef (loader.ts) and ResearchTechDef (research.ts).
 */
export interface AITechDef {
  Technologia: string;
  Epoka?: string | null;
  Poziom?: number | null;
  'Wymaga (prereq)'?: string | null;
  'Koszt nauki'?: number | null;
  'Odblokowuje budynek'?: string | null;
}

/**
 * Options for chooseAIResearch.
 * All fields are optional to keep the call site clean.
 */
export interface AIResearchOpts {
  /**
   * Archetype mods (nauka delta). When omitted, nauka delta = 0.
   * Pass readArchMods result if available.
   */
  mods?: ArchetypeMods;
  /**
   * Number of cities the AI currently owns (for phase detection).
   * earlyPhase = myCitiesCount < 3 (default 1 = early).
   */
  myCitiesCount?: number;
  /**
   * True when an enemy is within threat range of an AI city.
   * Boosts military techs. Default false.
   */
  underThreat?: boolean;
  /**
   * Already-built building ids across ALL cities (union).
   * Used to deprioritize techs whose buildings are already present.
   */
  allBuiltBuildings?: string[];
  /** Full tech table — required for epoch/tier gating (Zasady 1+2). */
  techData?: readonly AITechDef[];
  /** Building/improvement gates — same contract as gracz (researchGatesMet). */
  researchGate?: ResearchBuildingGate;
}

/**
 * Splits a prereq expression ("Kolo + Brazownictwo", "—", "-", null) into names.
 * Kept local (duplicates research.ts parsePrerequisites) to avoid cross-imports.
 */
function parsePrereqs(wyrazenie: string | null | undefined): string[] {
  if (!wyrazenie) return [];
  const t = wyrazenie.trim();
  if (!t || t === '-' || t === '—' || t === '–' || t.toLowerCase() === 'brak') return [];
  return t.split('+').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Scores a tech for AI research priority.
 *
 * Heuristic (Spec-AI §5):
 *   - Base score by strategic need (buildings the tech unlocks + phase/threat)
 *   - nauka archetype delta shifts the total score by +/-20 per point
 *   - Lower cost = slight tie-breaker bonus (prefer cheaper / faster techs)
 *
 * Returns a numeric score; higher = higher priority.
 * Returns -Infinity when the tech should never be chosen (already done, prereqs unmet, etc.).
 */
function scoreTech(
  tech: AITechDef,
  ukonczone: Set<string>,
  opts: AIResearchOpts,
): number {
  // Already researched -- ineligible
  if (ukonczone.has(tech.Technologia)) return -Infinity;

  // Prereqs must all be done
  const prereqs = parsePrereqs(tech['Wymaga (prereq)']);
  if (!prereqs.every(p => ukonczone.has(p))) return -Infinity;

  const techData = opts.techData;
  if (techData) {
    if (!epochGateMet(tech, techData, ukonczone)) return -Infinity;
    if (!epochTierGateMet(tech, techData, ukonczone)) return -Infinity;
  }
  if (opts.researchGate && !researchGatesMet(tech, opts.researchGate)) return -Infinity;

  const mods          = opts.mods ?? { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
  const earlyPhase    = (opts.myCitiesCount ?? 1) < 3;
  const underThreat   = opts.underThreat ?? false;
  const allBuilt      = new Set(opts.allBuiltBuildings ?? []);
  const unlocks       = (tech['Odblokowuje budynek'] ?? '').toLowerCase();
  const koszt: number = typeof tech['Koszt nauki'] === 'number' && (tech['Koszt nauki'] as number) > 0
    ? (tech['Koszt nauki'] as number)
    : 10 + Math.max(0, (tech.Poziom ?? 1) - 1) * 4;

  let score = 0;

  // --- §5.1 strategic need -------------------------------------------------

  // Spichlerz/Cegielnia unlock: top priority when missing (§5.1 first branch)
  const unlocksGranary = unlocks.includes('spichlerz');
  const unlocksCegielnia = unlocks.includes('cegielnia');
  if (unlocksGranary && !allBuilt.has('spichlerz') && !allBuilt.has('Spichlerz')) score += 120;
  if (unlocksCegielnia && !allBuilt.has('cegielnia') && !allBuilt.has('Cegielnia')) score += 80;

  // Koszary / military buildings: high priority in mid/late or under threat
  const unlocksMilitary =
    unlocks.includes('koszary') ||
    unlocks.includes('jednostki bron') ||
    unlocks.includes('konnica') ||
    unlocks.includes('lucznik') ||
    unlocks.includes('huta');
  if (unlocksMilitary) {
    score += underThreat ? 100 : (earlyPhase ? 40 : 80);
  }

  // Mury (walls): P-AI-008 — major AI pod zagrożeniem nie ciągnie murów (produkcja ani badania).
  if (unlocks.includes('mury')) {
    score += 30;
  }

  // Economy buildings (Tartak, Targowisko, Akwedukt, Biblioteka, Swiatynia...)
  const unlocksEconomy =
    unlocks.includes('tartak') ||
    unlocks.includes('targowisko') ||
    unlocks.includes('akwedukt') ||
    unlocks.includes('biblioteka') ||
    unlocks.includes('studnia') ||
    unlocks.includes('pasterstwo');
  if (unlocksEconomy) score += earlyPhase ? 50 : 70;

  // Expansion (Drogi, Rydwan, Statki/Port) helps settler movement
  const unlocksExpansion =
    unlocks.includes('drogi') ||
    unlocks.includes('rydwan') ||
    unlocks.includes('statki') ||
    unlocks.includes('port');
  if (unlocksExpansion) score += earlyPhase ? 60 : 40;

  // Farmy/Pastwisko: food is early game
  const unlocksFood =
    unlocks.includes('farm') ||
    unlocks.includes('pastwisko') ||
    unlocks.includes('pasterstw');
  if (unlocksFood) score += earlyPhase ? 55 : 25;

  // Pismo -- prereq for Biblioteka, Handel: medium value mid-game
  if (tech.Technologia === 'Pismo') score += earlyPhase ? 20 : 50;

  // Brazownictwo: key enabler (unlocks Huta + advances era)
  if (tech.Technologia === 'Brazownictwo' || tech.Technologia === 'Brązownictwo') {
    score += underThreat ? 90 : (earlyPhase ? 70 : 50);
  }

  // Wojskowość: unlocks Koszary (important mid-game)
  if (tech.Technologia === 'Wojskowosc' || tech.Technologia === 'Wojskowość') score += underThreat ? 95 : (earlyPhase ? 35 : 75);

  // Base: any researchable tech gets a small floor so nothing is ignored
  score += 10;

  // --- §5.2 / §8 archetype nauka delta ------------------------------------
  // nauka delta +/-1..+2 shifts total by +/-20 per point
  score += mods.nauka * 20;

  // --- Tie-breaker: prefer cheaper (faster) techs -------------------------
  score += Math.max(0, 30 - koszt);

  return score;
}

/**
 * Chooses the best technology for an AI player to research next.
 *
 * Pure function -- no side effects, no global state.
 * Compatible with Spec-AI §5 and §9 step 3.
 *
 * @param techData    All tech definitions (data.tech from GameData / tech.json)
 * @param ukonczone   Set of tech names already fully researched by this AI player
 * @param opts        Optional tuning (archetype mods, city count, threat flag, built buildings)
 * @returns           Tech name (Technologia) to start researching, or null when nothing available
 *
 * Engine usage (§9 step 3):
 *   if (aiResearchState.biezace === null) {
 *     const techId = chooseAIResearch(data.tech, new Set(aiResearchState.ukonczone), { mods, myCitiesCount, underThreat, allBuiltBuildings });
 *     if (techId !== null) aiResearchState = startResearch(aiResearchState, techId);
 *   }
 */
export function chooseAIResearch(
  techData: readonly AITechDef[],
  ukonczone: ReadonlySet<string> | string[],
  opts: AIResearchOpts = {},
): string | null {
  const done: Set<string> = ukonczone instanceof Set
    ? (ukonczone as Set<string>)
    : new Set(ukonczone as string[]);

  let bestScore = -Infinity;
  let bestTech: string | null = null;

  for (const tech of techData) {
    const s = scoreTech(tech, done, opts);
    if (s > bestScore) {
      bestScore = s;
      bestTech = tech.Technologia;
    }
  }

  return bestTech;
}

/** Returns true if (aq,ar) and (bq,br) are adjacent (distance === 1). */
function isAdjacent(aq: number, ar: number, bq: number, br: number): boolean {
  return hexDistance(aq, ar, bq, br) === 1;
}

/** Nearest element from list by hex distance to (fromQ, fromR). */
function nearest<T>(
  fromQ: number,
  fromR: number,
  items: T[],
  getQ: (t: T) => number,
  getR: (t: T) => number,
): T | undefined {
  let best: T | undefined;
  let bestDist = Infinity;
  for (const item of items) {
    const d = hexDistance(fromQ, fromR, getQ(item), getR(item));
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return best;
}

/**
 * Build the occupied set (all units' keys) excluding this unit itself.
 * Used for pathfinding -- we do not block on the unit's own hex.
 */
function occupiedExcluding(units: RuntimeUnit[], excludeId: string): Set<string> {
  const occ = new Set<string>();
  for (const u of units) {
    if (u.id !== excludeId) {
      occ.add(keyOf(u.q, u.r));
    }
  }
  return occ;
}

/**
 * Returns the first step along the path toward (destQ, destR).
 * If the path is empty returns null (already there or unreachable).
 */
function firstStep(
  unit: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  units: RuntimeUnit[],
): { q: number; r: number } | null {
  const occ = occupiedExcluding(units, unit.id);
  const path = computePath(unit, map, destQ, destR, occ);
  if (path.length === 0) return null;
  return path[0] ?? null;
}

// ---------------------------------------------------------------------------
// Early-game scout race (wioski / domki z prezentami)
// ---------------------------------------------------------------------------

/** Pełne cywilizacje: min. tyle zwiadowców w fazie startowej (nie dotyczy państw-miast). */
export const AI_EARLY_SCOUT_TARGET = 2;
/** Kara score drugiego+ zwiadowcy w early phase (R-AI-TRUDNOSC P1-2). */
export const AI_EARLY_SCOUT_REPEAT_PENALTY = 80;
const SCOUT_TYPE_ID = 'Zwiadowca';

/** Jednostki bojowe ownera (nie cywilne: zwiadowca/osadnik/robotnik). */
export function countOwnerMilitaryUnits(allUnits: RuntimeUnit[], ownerId: number): number {
  return allUnits.filter(u => u.ownerId === ownerId && !isCivilianUnit(u)).length;
}

/** Kandydat produkcji to jednostka bojowa (nie budynek, nie cywil). */
function isMilitaryProductionCandidate(id: string, buildingNames: ReadonlySet<string>): boolean {
  if (buildingNames.has(id)) return false;
  return !isCivilianUnit({ typeId: id, category: '' });
}
/** AI-LOCAL-Q1=A: faza lokalna kończy się ~tura 20. */
const AI_LOCAL_PHASE_MAX_TURN = 20;

/** R-AI-KOLONIZACJA-Q1: min pop miasta-źródła major AI przed founding (L1/L2). */
export const AI_COLONIZATION_SOURCE_MIN_POP = 5;
/** AI-BALANS-STEP1: L3 / Trudny — próg kolonizacji major AI (było globalnie 5). */
export const AI_COLONIZATION_SOURCE_MIN_POP_L3 = 4;

/** Próg ludności miasta-źródła kolonii major AI per poziom trudności (nie MP). */
export function colonizationSourceMinPop(poziomTrudnosci?: 1 | 2 | 3): number {
  return poziomTrudnosci === 3 ? AI_COLONIZATION_SOURCE_MIN_POP_L3 : AI_COLONIZATION_SOURCE_MIN_POP;
}

/** Major AI ma miasto gotowe do kolonizacji (planCityFounding / faza lokalna). */
export function hasColonizationSource(
  myCities: ReadonlyArray<{ population: number }>,
  poziomTrudnosci?: 1 | 2 | 3,
): boolean {
  const minPop = colonizationSourceMinPop(poziomTrudnosci);
  return myCities.some(c => c.population >= minPop);
}
/** Epoki pełnej agresji kolonizacyjnej (Kamień → Żelazo). */
const AI_COLONIZATION_AGGRESSIVE_ERA_MAX = 3;
const AI_COLONIZATION_OUTSIDE_TERRITORY_BONUS = 15;
const AI_COLONIZATION_SURGE_MAX_PER_TURN = 2;

/** Liczba wolnych niezależnych miast-państw (bez wasala). */
export function countFreeIndependentCityStates(
  cities: ReadonlyArray<{ ownerId: number; startCityState?: boolean }>,
  vassalizedOwnerIds: readonly number[] = [],
): number {
  const vassalSet = new Set(vassalizedOwnerIds);
  const csOwners = new Set<number>();
  for (const c of cities) {
    if (c.startCityState && c.ownerId > 0) csOwners.add(c.ownerId);
  }
  let free = 0;
  for (const oid of csOwners) {
    if (!vassalSet.has(oid)) free++;
  }
  return free;
}

function aiHasColonizationReadyCity(
  myCities: ReadonlyArray<{ population: number }>,
  poziomTrudnosci?: 1 | 2 | 3,
): boolean {
  return hasColonizationSource(myCities, poziomTrudnosci);
}

function isHexWithinAnyCityReach(
  q: number,
  r: number,
  allCities: ReadonlyArray<{ q: number; r: number; population: number }>,
): boolean {
  for (const c of allCities) {
    const node = { q: c.q, r: c.r, pop: c.population, level: 1 };
    if (hexDistance(q, r, c.q, c.r) <= cityTerritoryRadius(node)) return true;
  }
  return false;
}

function aiColonizationAggressiveMode(opts: AITurnOpts, myCities: AICity[]): boolean {
  const era = opts.civEra ?? 1;
  return era <= AI_COLONIZATION_AGGRESSIVE_ERA_MAX
    && aiHasColonizationReadyCity(myCities, opts.poziomTrudnosci);
}

function aiMaxFoundingPerTurn(
  cities: ReadonlyArray<{ ownerId: number; startCityState?: boolean }>,
  opts: AITurnOpts,
  playerId: number,
): number {
  const myCityCount = cities.filter(c => c.ownerId === playerId).length;
  if (myCityCount === 0) return 1;
  const freeCs = countFreeIndependentCityStates(cities, opts.vassalizedCityStateOwnerIds);
  return freeCs === 0 ? AI_COLONIZATION_SURGE_MAX_PER_TURN : 1;
}

export function isScoutUnit(unit: RuntimeUnit): boolean {
  return unit.typeId === SCOUT_TYPE_ID || unit.category === 'zwiadowca';
}

export function countPlayerScouts(allUnits: readonly RuntimeUnit[], playerId: number): number {
  return allUnits.filter(u => u.ownerId === playerId && isScoutUnit(u)).length;
}

/** Score kandydata Zwiadowca w early phase (przed biasem archetypu). R-AI-TRUDNOSC P1-2. */
export function computeEarlyScoutProductionScore(
  scoutCount: number,
  economyScore: number,
): number {
  let score = 320 + economyScore;
  if (scoutCount >= 1) score -= AI_EARLY_SCOUT_REPEAT_PENALTY;
  return score;
}

/** Faza wyścigu o neutralne wioski — pełna cywilizacja, przed ekspansją poza region startowy. */
function isVillageExploreRacePhase(opts: AITurnOpts, myCities: AICity[]): boolean {
  return !opts.defensiveCopy && myCities.length < 3;
}

/**
 * AI-LOCAL-Q1=A: faza lokalna kończy się ~tura 20 LUB gdy AI ma 1 zwiadowca.
 * Wioski NIE blokują founding (tylko skauci/tura + cele klastra).
 */
export function isLocalExpansionPhase(
  opts: AITurnOpts,
  myCities: AICity[],
  _map: GameMap,
  units: readonly RuntimeUnit[],
  playerId: number,
  allCities: ReadonlyArray<{ ownerId: number; startCityState?: boolean }> = myCities,
): boolean {
  if (opts.defensiveCopy) return false;
  if (myCities.length === 0) return false;

  const ekspansywnosc = opts.civAiProfile?.ekspansywnosc ?? 0;
  const clusterTargets = opts.clusterStateTargets ?? [];
  const colonizationReady = aiHasColonizationReadyCity(myCities, opts.poziomTrudnosci);
  const freeCs = countFreeIndependentCityStates(allCities, opts.vassalizedCityStateOwnerIds);
  const aggressiveColonization = aiColonizationAggressiveMode(opts, myCities);

  // R-AI-KOLONIZACJA: epoki 1–3 lub brak wolnych MP — nie blokuj skautami/wioskami.
  if ((aggressiveColonization || (freeCs === 0 && colonizationReady)) && !opts.clusterConquestDeadlineActive) {
    if (clusterTargets.length > 0 && !aiMayBypassClusterConsolidation(ekspansywnosc, opts)) return true;
    return false;
  }

  const turn = opts.currentTurn ?? 0;
  if (turn >= AI_LOCAL_PHASE_MAX_TURN) return false;

  if (clusterTargets.length > 0 && !aiMayBypassClusterConsolidation(ekspansywnosc, opts)) return true;

  if (countPlayerScouts(units, playerId) < 1) return true;

  return false;
}

/**
 * Krok ruchu zwiadowcy: najpierw najbliższa wolna wioska, potem heks coraz dalej od stolicy.
 */
function planScoutExploreStep(
  unit: RuntimeUnit,
  map: GameMap,
  myCities: AICity[],
  units: RuntimeUnit[],
  villages: { q: number; r: number }[],
): { q: number; r: number } | null {
  const villageTarget = findNearestVillage(unit, villages);
  if (villageTarget !== null) {
    const towardVillage = firstStep(unit, map, villageTarget.q, villageTarget.r, units);
    if (towardVillage !== null) return towardVillage;
  }
  if (myCities.length === 0) return null;
  const home = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
  if (home === undefined) return null;
  const homeDist = hexDistance(unit.q, unit.r, home.q, home.r);
  const occ = occupiedExcluding(units, unit.id);
  const reachable = computeReachable(unit, map, occ);
  reachable.delete(keyOf(unit.q, unit.r));
  let bestKey: string | null = null;
  let bestDist = homeDist;
  for (const key of reachable) {
    const parts = key.split(',');
    if (parts.length !== 2) continue;
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    const d = hexDistance(q, r, home.q, home.r);
    if (d > bestDist) {
      bestDist = d;
      bestKey = key;
    }
  }
  if (bestKey === null) return null;
  const parts = bestKey.split(',');
  const destQ = Number(parts[0]);
  const destR = Number(parts[1]);
  return firstStep(unit, map, destQ, destR, units);
}

// ---------------------------------------------------------------------------
// Terrain yield heuristic (city founding -- Spec-AI §3.3)
// ---------------------------------------------------------------------------

/** Score a candidate hex for city founding per ai-params.json §3.3 heuristic. */
function hexCityScore(
  hex: Hex,
  q: number,
  r: number,
  data: GameData,
  enemyCities: AICity[],
  opts?: Pick<AITurnOpts, 'resourceDeficitKeys'>,
): number {
  const foodPts    = getAiParam(data, 'ekspansja_heurystyka_zywnosc_pkt', 3);
  const workPts    = getAiParam(data, 'ekspansja_heurystyka_praca_pkt', 2);
  const tradePts   = getAiParam(data, 'ekspansja_heurystyka_handel_pkt', 1);
  const riverPts   = getAiParam(data, 'ekspansja_heurystyka_rzeka_pkt', 2);
  const resPts     = getAiParam(data, 'ekspansja_heurystyka_surowiec_pkt', 2);
  const enemyPenalty = getAiParam(data, 'ekspansja_heurystyka_granica_kara', -3);

  // Get terrain yields from data
  let food = 0; let work = 0; let trade = 0;
  const terrainName = hex.terenBazowy as string;
  const tyRow = data.terrainYields.terrain_types.find(t => t.Teren === terrainName);
  if (tyRow !== undefined) {
    // TerrainTypeDef fields use Polish names with diacritics in the JSON;
    // we access via bracket notation to handle both encodings
    const rawRow = tyRow as unknown as Record<string, number | null | string>;
    food  = (rawRow['Zywnosc']   as number | null) ?? (rawRow['Żywność'] as number | null) ?? 0;
    work  = (rawRow['Praca']     as number | null) ?? 0;
    trade = (rawRow['Podatek'] as number | null) ?? (rawRow['Handel'] as number | null) ?? 0;
  }

  let score = 0;
  if (food  >= 3) score += foodPts;
  if (work  >= 2) score += workPts;
  if (trade >= 1) score += tradePts;
  if (hex.rzeka.obecna) score += riverPts;

  const deficits = opts?.resourceDeficitKeys ?? [];
  if (deficits.includes('glina') && hex.nakladka === Nakladka.ZlozeGliny) score += resPts * 2;
  if (deficits.includes('ruda') && hex.nakladka === Nakladka.ZlozeRudy) score += resPts * 2;
  if (deficits.includes('drewno') && hex.nakladka === Nakladka.Las) score += resPts * 2;

  // Resource overlay bonus (ore, clay = settlement value)
  if (hex.nakladka === Nakladka.ZlozeGliny || hex.nakladka === Nakladka.ZlozeRudy) {
    score += resPts;
  }

  // Enemy proximity penalty: < 5 hexes from any enemy city
  const enemyThresh = getAiParam(data, 'ekspansja_zagroz_zasieg', AI_THREAT_RANGE_DEFAULT);
  for (const ec of enemyCities) {
    if (hexDistance(q, r, ec.q, ec.r) < enemyThresh) {
      score += enemyPenalty;
      break;
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Production decision (Spec-AI §4 + §9 step 2)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Major AI ekonomia (Maciej 2026-08-04) — pełne cywilizacje AI, NIE MP/kopie.
// ---------------------------------------------------------------------------

/** Max tura „early game” major AI (wzrost ludności > budynki wojskowe). */
export const AI_MAJOR_EARLY_MAX_TURN = 40;
/** Max tura early major AI na poziomie 1 (Prosty) — krótsza faza early (R-AI-TRUDNOSC P1-1). */
export const AI_MAJOR_EARLY_MAX_TURN_L1 = 25;
/** Mnożnik score budynków gospodarczych w fazie majorEarly (R-AI-TRUDNOSC P1-1: było 0,55). */
export const AI_MAJOR_EARLY_ECON_BUILDING_MULT = 0.70;
/** Średnia ludność miasta poniżej progu → nadal early. */
export const AI_MAJOR_EARLY_MAX_AVG_POP = 5;
/** Średnia liczba budynków/miasto poniżej progu → nadal early. */
export const AI_MAJOR_EARLY_MAX_BUILDINGS_AVG = 4;
/** AI-BALANS-STEP2 / R-AI-TRUDNOSC C.3 Ś2: L3 pokój — kara score Wojownika w produkcji major AI. */
export const AI_L3_PEACE_WARRIOR_SCORE_PENALTY = 40;
/** Bias 60/40: ±5% udziału wojska na punkt różnicy priorytetów archetypu (ai-params). */
export const AI_ARCHETYPE_BIAS_PER_POINT = 0.05;
/** Early major: ~60% Pracy do puli państwa (ulepszenia), ~40% kolejka budowy. */
export const AI_MAJOR_EARLY_PROCENT_BUDYNKI = 40;
/** Mid major: ~50/50 budynki ↔ ulepszenia. */
export const AI_MAJOR_MID_PROCENT_BUDYNKI = 50;
/** Early major: niższy próg Pracy zanim AI buduje ulepszenie terenu. */
export const AI_MAJOR_EARLY_IMPROVEMENT_PRACA_SURPLUS = 10;

/** Pełna cywilizacja AI (nie miasto-państwo / kopia_typu_obronna). */
export function isMajorAiOwner(opts: AITurnOpts): boolean {
  return !opts.defensiveCopy;
}

/** Early game major AI — mała ludność, mało budynków lub wczesna tura. */
export function computeMajorAiEarlyGame(
  opts: AITurnOpts,
  myCities: AICity[],
  avgBuildingsPerCity: number,
): boolean {
  if (!isMajorAiOwner(opts)) return false;
  const turn = opts.currentTurn ?? 0;
  let maxTurn = AI_MAJOR_EARLY_MAX_TURN;
  if (opts.poziomTrudnosci === 1) {
    maxTurn = AI_MAJOR_EARLY_MAX_TURN_L1;
  } else if (
    opts.poziomTrudnosci === 3
    && (opts.startoweMiasta ?? 0) >= 1
  ) {
    // R-AI-TRUDNOSC P2-Q2=A: L3 + bonus startowe miasto → cap jak L1 (25)
    maxTurn = AI_MAJOR_EARLY_MAX_TURN_L1;
  }
  if (turn <= maxTurn) return true;
  if (myCities.length === 0) return false;
  const avgPop = myCities.reduce((s, c) => s + c.population, 0) / myCities.length;
  if (avgPop < AI_MAJOR_EARLY_MAX_AVG_POP) return true;
  if (avgBuildingsPerCity < AI_MAJOR_EARLY_MAX_BUILDINGS_AVG) return true;
  return false;
}

/**
 * Udział wojska w alokacji major AI (0.4–0.6) z ai-params archetypów.
 * Wojowniczy (zulusi: wojsko +2, ekonomia -1) ≈60% wojsko;
 * gospodarczy (chiny: wojsko -1, ekonomia +1) ≈40% wojsko (reszta rozwój).
 */
/** C.3 Ś2: obniż score Wojownika major AI na L3 gdy brak zagrożenia (nie MP). */
export function applyL3PeaceWarriorPenalty(
  candidates: { id: string; score: number }[],
  opts: AITurnOpts,
  underThreat: boolean,
): void {
  if (!isMajorAiOwner(opts) || opts.poziomTrudnosci !== 3 || underThreat) return;
  for (const c of candidates) {
    if (c.id === 'Wojownik') {
      c.score -= AI_L3_PEACE_WARRIOR_SCORE_PENALTY;
    }
  }
}

export function computeMajorArchetypeMilitaryFraction(
  mods: ArchetypeMods,
): number {
  const delta = (mods.wojsko - mods.ekonomia) * AI_ARCHETYPE_BIAS_PER_POINT;
  return Math.min(0.6, Math.max(0.4, 0.5 + delta));
}

function applyMajorArchetypeProductionBias(
  candidates: { id: string; score: number }[],
  data: GameData,
  militaryFraction: number,
): void {
  const unitNames = new Set(data.units.map(u => u.Jednostka));
  const buildingIds = new Set(data.buildings.map(b => b.id));
  const milBoost = Math.round((militaryFraction - 0.5) * 160);
  const infraIds = new Set(['spichlerz', 'mury', 'koszary', 'studnia', 'garncarnia']);
  for (const c of candidates) {
    if (unitNames.has(c.id)) {
      c.score += milBoost;
    } else if (buildingIds.has(c.id) && !infraIds.has(c.id)) {
      c.score -= milBoost;
    }
  }
}

/**
 * Returns the id of the building or unit this city should build next.
 * Priority based on Spec-AI §4 and archetype modifiers.
 * Returns null if nothing can be queued.
 */
export function chooseCityProduction(
  cityId: string,
  myCities: AICity[],
  allUnits: RuntimeUnit[],
  playerId: number,
  data: GameData,
  mods: ArchetypeMods,
  opts: AITurnOpts,
  map: GameMap,
  difficultyParams: DifficultyParams,
): string | null {
  const built: string[] = opts.cityBuildings?.[cityId] ?? [];

  const city = myCities.find(c => c.id === cityId);
  if (city === undefined) return null;

  const avgBuiltPerCity = myCities.reduce((s, c) => {
    const n = opts.cityBuildings?.[c.id]?.length ?? 0;
    return s + n;
  }, 0) / Math.max(1, myCities.length);
  const majorEarly = computeMajorAiEarlyGame(opts, myCities, avgBuiltPerCity);
  const majorMilFrac = isMajorAiOwner(opts)
    ? computeMajorArchetypeMilitaryFraction(mods)
    : 0.5;

  // Threat check: any enemy within threat range of this city
  const threatRange  = getAiParam(data, 'ekspansja_zagroz_zasieg', AI_THREAT_RANGE_DEFAULT);
  const enemyUnits   = allUnits.filter(u => u.ownerId !== playerId);
  const underThreat  = enemyUnits.some(
    eu => hexDistance(city.q, city.r, eu.q, eu.r) <= threatRange,
  );

  // Base scores for each category (higher = higher priority)
  // Archetype delta: +/- 20 per unit of mod
  // Difficulty bonus: bonusProdukcja scales economy score (higher difficulty = more efficient AI)
  const diffProdBonus = Math.round(difficultyParams.bonusProdukcja * 200); // e.g. +10% -> +20 pts, +25% -> +50 pts
  const panelBoost = aiProductionScoreBoosts(opts.civAiProfile);
  const powerGoalBoost = opts.currentTurn !== undefined
    && opts.currentTurn % 3 === 0
    && (opts.powerRank ?? 1) > 1
    && !majorEarly;
  const economyScore  = 100 + mods.ekonomia * 20 + diffProdBonus + panelBoost.economy + (powerGoalBoost ? 40 : 0);
  const militaryScore = 100 + mods.wojsko   * 20 + panelBoost.military;
  const defenseScore  = 100 + mods.obrona   * 20;
  const scienceScore  = 100 + mods.nauka    * 20 + panelBoost.science;

  let candidates: { id: string; score: number }[] = [];

  // Państwa-kopie (kopia_typu_obronna) NIGDY nie zakładają miast (brak Osadnika/foundCity —
  // patrz opts.defensiveCopy niżej), więc myCities.length pozostaje = 1 na zawsze. Bez tego
  // wyjątku "earlyPhase" (myCities.length<3) byłoby wieczne — miasto-kopia utknęłoby na
  // Wojowniku+Murach+Spichlerzu i NIGDY nie odblokowałoby Koszar ani budynków gospodarczych
  // (Tartak/Cegielnia/Huta/Magazyn/Targowisko) z gałęzi "else" niżej. Traktujemy je więc tak,
  // jakby "wyrosły" z fazy startowej mimo posiadania jednego miasta — bez tego są trwale
  // biernym łupem zamiast rozwijać się jak normalne miasto AI. Zero bonusu liczbowego:
  // dostają dokładnie tę samą listę kandydatów budowy co każde inne miasto AI w fazie mid-game.
  const earlyPhase = myCities.length < 3 && !opts.defensiveCopy;

  // §4.3 Under threat — P-AI-008: major AI → jednostki + rozwój; defensiveCopy → mury+garnizon
  if (underThreat) {
    if (opts.defensiveCopy) {
      const wallScore = aiThreatWallProductionScore(defenseScore, opts.powerRank, true);
      if (!built.includes('mury') && wallScore !== null) {
        candidates.push({ id: 'mury', score: wallScore });
      }
      candidates.push({ id: 'Wojownik', score: 280 + militaryScore });
    } else if (isMajorAiOwner(opts)) {
      const threatUnits = aiThreatMajorUnitScores(militaryScore);
      candidates.push({ id: 'Wojownik', score: threatUnits.wojownik });
      candidates.push({ id: 'Łucznik', score: threatUnits.lucznik });
      if (!built.includes('spichlerz')) {
        candidates.push({ id: 'spichlerz', score: aiThreatMajorDevScore(250) });
      }
      if (!built.includes('koszary')) {
        candidates.push({ id: 'koszary', score: aiThreatMajorDevScore(200 + militaryScore) });
      }
      for (const b of ['stolarnia', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'targowisko']) {
        if (!built.includes(b)) {
          candidates.push({ id: b, score: aiThreatMajorDevScore(140 + economyScore) });
        }
      }
      if (!built.includes('biblioteka')) {
        candidates.push({ id: 'biblioteka', score: aiThreatMajorDevScore(135 + scienceScore) });
      }
    } else {
      candidates.push({ id: 'Wojownik', score: 280 + militaryScore });
    }
  }

  // Państwa-kopie (kopia_typu_obronna): najpierw fortyfikacja + garnizon, nigdy ekspansja.
  if (opts.defensiveCopy) {
    const guardDC = allUnits.filter(
      u => u.ownerId === playerId && hexDistance(u.q, u.r, city.q, city.r) <= 1,
    );
    if (guardDC.length === 0) {
      // Maciej: NAJPIERW jedna jednostka obronna (garnizon) — jednostka bazowa, zawsze buduwalna;
      // dzięki temu państwo-kopia przestaje być łatwym łupem od 1. tury.
      candidates.push({ id: 'Wojownik', score: 340 + militaryScore });
    }
    if (!built.includes('mury')) {
      candidates.push({ id: 'mury', score: 320 + defenseScore });
    }
    // Spichlerz dopisany tu (a nie w gałęzi early-phase §4.1, bo defensiveCopy nigdy tam nie
    // trafia — patrz earlyPhase wyżej) — TA SAMA pozycja/score co dla normalnego miasta AI
    // w fazie startowej (250), żeby nie zaburzyć kolejności względem Mury/Wojownik powyżej ani
    // względem budynków gospodarczych z gałęzi "else" niżej. Bez tego defensiveCopy nigdy nie
    // zobaczyłoby Spichlerza (brak wpływu na zwykłe AI — ta gałąź działa tylko gdy defensiveCopy).
    if (!built.includes('spichlerz')) {
      candidates.push({ id: 'spichlerz', score: 250 });
    }
  }

  if (earlyPhase) {
    // §4.1 Early phase
    if (!built.includes('spichlerz')) {
      candidates.push({ id: 'spichlerz', score: 250 });
    }
    // Wyścig o wioski (Maciej 2026-07-26): pełne cywilizacje budują min. 2 zwiadowców.
    // Państwa-miasta (defensiveCopy) — wyłączone.
    if (!opts.defensiveCopy && countPlayerScouts(allUnits, playerId) < AI_EARLY_SCOUT_TARGET) {
      const scoutCount = countPlayerScouts(allUnits, playerId);
      candidates.push({
        id: SCOUT_TYPE_ID,
        score: computeEarlyScoutProductionScore(scoutCount, economyScore),
      });
    }
    // Defensive unit if city is unguarded
    const cityGuard = allUnits.filter(
      u => u.ownerId === playerId && hexDistance(u.q, u.r, city.q, city.r) <= 1,
    );
    if (cityGuard.length === 0) {
      const guardScore = majorEarly ? 110 + militaryScore * majorMilFrac : 190 + militaryScore;
      candidates.push({ id: 'Wojownik', score: guardScore });
    }
    if (!majorEarly) {
      candidates.push({ id: 'Łucznik',   score: 180 + militaryScore });
    } else {
      // Major early: minimal wojsko poza garnizonem — archetyp 60/40, nie blokada produkcji.
      candidates.push({ id: 'Łucznik', score: 90 + militaryScore * majorMilFrac });
    }
  } else {
    // §4.2 Mid phase
    if (!built.includes('koszary')) {
      candidates.push({ id: 'koszary', score: 200 + militaryScore });
    }
    candidates.push({ id: 'Wojownik',  score: 170 + militaryScore });
    candidates.push({ id: 'Łucznik',   score: 165 + militaryScore });

    // id-y katalogu budynków (buildings.json) -- NIE nazwy wyświetlane; Tartak/Huta
    // to legacy nazwy bez odpowiednika po id, realne budynki to stolarnia/odlewnia_brazu.
    for (const b of ['stolarnia', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'targowisko']) {
      if (!built.includes(b)) {
        candidates.push({ id: b, score: 140 + economyScore });
      }
    }
    // P-AI-007=A: budynki nauki w puli produkcji (priorytetNauka + mods.nauka archetypu).
    if (!built.includes('biblioteka')) {
      candidates.push({ id: 'biblioteka', score: 135 + scienceScore });
    }
    if (built.includes('biblioteka') && !built.includes('akademia')) {
      candidates.push({ id: 'akademia', score: 130 + scienceScore });
    }
  }

  // Miasta-państwa (defensiveCopy): bootstrap infrastruktury po pierwszym garnizonie.
  // Mid-phase dodaje Wojownika (~170+mil ≈ 270 pkt), co stale wygrywało ze Spichlerzem
  // (250) i resztą gospodarki (~140+eko ≈ 240) — efekt: 0 budynków mimo zasobów.
  // Studnia/Garncarnia nie były w puli kandydatów w ogóle. Po garnizonie priorytet
  // podstawowej bazy; wojsko tylko przy zagrożeniu lub gdy baza już stoi.
  // R-MP-HARD-WAVE Q1: na Trudnym osłabiona supresja wojska + wyższy priorytet Koszar.
  const hardOffensive = opts.cityStateOffensiveSupport === true;
  if (opts.defensiveCopy) {
    const cityGuardCount = allUnits.filter(
      u => u.ownerId === playerId && hexDistance(u.q, u.r, city.q, city.r) <= 1,
    ).length;
    const infraBootstrap = built.length < 6;
    if (infraBootstrap && cityGuardCount >= 1) {
      const adminBuilding = myCities.length === 1 ? 'palac' : 'dom_starszyzny';
      const infraOrder = [
        'studnia',
        'garncarnia',
        'stolarnia',
        'spichlerz',
        'targowisko',
        adminBuilding,
      ];
      const prodAllowed = opts.isProductionAllowed;
      for (let i = 0; i < infraOrder.length; i++) {
        const bid = infraOrder[i]!;
        if (!built.includes(bid)) {
          // R-AI-MIASTA-BUDOWY-FIX-Q1=A: nie nadawaj score zablokowanym tech (PROD-GATE).
          if (prodAllowed?.(cityId, bid) === false) continue;
          // Powyżej Mury (defensiveCopy ≈ 420) i Koszar mid-phase (~300).
          candidates.push({ id: bid, score: 450 - i * 12 });
        }
      }
      for (const c of candidates) {
        if (c.id === 'mury' || c.id === 'koszary') {
          c.score -= hardOffensive ? 25 : 90;
        }
      }
      if (hardOffensive && !built.includes('koszary')) {
        candidates.push({ id: 'koszary', score: 400 + militaryScore });
      }
    }
    if (cityGuardCount >= 1 && !underThreat && infraBootstrap) {
      for (const c of candidates) {
        if (c.id === 'Wojownik' || c.id === 'Łucznik') {
          c.score -= hardOffensive ? 60 : 250;
        }
      }
    }
    if (hardOffensive && cityGuardCount >= 1) {
      for (const c of candidates) {
        if (c.id === 'Wojownik') c.score += 70;
        if (c.id === 'Łucznik') c.score += 55;
      }
    }
  }

  if (isMajorAiOwner(opts)) {
    applyMajorArchetypeProductionBias(candidates, data, majorMilFrac);
    if (majorEarly) {
      for (const c of candidates) {
        if (c.id === 'Wojownik' || c.id === 'Łucznik') {
          c.score = Math.round(c.score * 0.65);
        }
        const earlyEconBuildings = ['stolarnia', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'targowisko', 'biblioteka', 'akademia'];
        if (earlyEconBuildings.includes(c.id)) {
          c.score = Math.round(c.score * AI_MAJOR_EARLY_ECON_BUILDING_MULT);
        }
      }
    }
    applyL3PeaceWarriorPenalty(candidates, opts, underThreat);
  }

  // ZADANIE 2 (Maciej 2026-07-23, correctness): priorytet konwertery-przed-konsumentami.
  // Cegła/Brąz/Żelazo powstają WYŁĄCZNIE w swoim konwerterze (Cegielnia/Odlewnia brązu/
  // Odlewnia żelaza -- glina+drewno→cegła, ruda+drewno→brąz, ruda_zelaza+drewno→żelazo).
  // Jeśli AI rozważa w tej samej turze budynek kosztujący jeden z tych surowców
  // (koszt_surowce.cegla/braz/zelazo > 0 -- np. Mury/Akwedukt/Odlewnia brązu/Odlewnia
  // żelaza/Koszary/Mennica), a NIE MA konwertera zbudowanego ANI zapasu tego surowca
  // (opts.canAfford odmawia -- ten sam sygnał co bramka main.ts, patrz building-stock-cost.ts),
  // podbijamy priorytet konwertera PONAD tego konsumenta (dopisując go do kandydatów,
  // jeśli jeszcze nie był rozważany w tej gałęzi) i lekko odkładamy konsumenta -- inaczej AI
  // wybierałoby wciąż ten sam nieopłacalny budynek turę po turze i nigdy nie postawiłoby
  // konwertera, którego samo nie rozważa w danej fazie/gałęzi. TYLKO priorytet -- gracza i tak
  // chroni osobna bramka kosztu (canAffordBuildingStock w main.ts), tu nic nie jest blokowane
  // na twardo, więc istniejące testy AI (affordability/fallback) nie powinny się zmienić.
  //
  // Bez opts.canAfford (nie podane) nie mamy żadnego sygnału o zapasie -- fix wyłączony
  // całkowicie (zero regresji), dokładnie jak reszta bramki budżetowej niżej w tej funkcji
  // ("canAfford absent -> no filtering, zero regression").
  if (opts.canAfford) {
    const canAfford = opts.canAfford;
    const CONVERTER_FOR_RESOURCE: ReadonlyArray<readonly [string, string]> = [
      ['cegla', 'cegielnia'],
      ['braz', 'odlewnia_brazu'],
      ['zelazo', 'odlewnia_zelaza'],
      ['stal', 'wielka_odlewnia'],
    ];
    const CONVERTER_ALTERNATIVES: Readonly<Record<string, readonly string[]>> = {
      braz: ['odlewnia_brazu', 'odlewnia_zelaza', 'wielka_odlewnia'],
      zelazo: ['odlewnia_zelaza', 'wielka_odlewnia'],
      stal: ['wielka_odlewnia'],
    };
    for (const [resource, converterId] of CONVERTER_FOR_RESOURCE) {
      const alts = CONVERTER_ALTERNATIVES[resource];
      if (alts?.some(id => built.includes(id))) continue; // konwerter (lub upgrade) już stoi
      const consumerIdx = candidates.findIndex(
        c => c.id !== converterId && (buildingStockCost(data.buildings.find(b => b.id === c.id))[resource] ?? 0) > 0,
      );
      if (consumerIdx === -1) continue; // żaden kandydat tej tury nie konsumuje `resource`
      const consumer = candidates[consumerIdx]!;
      // "ani zapasu X" -- konsument już affordable (zapas/magazyn wystarcza) => brak ryzyka
      // deadlocku, priorytet zostaje bez zmian.
      if (canAfford(cityId, consumer.id)) continue;

      const converterIdx = candidates.findIndex(c => c.id === converterId);
      if (converterIdx >= 0) {
        candidates[converterIdx]!.score = Math.max(candidates[converterIdx]!.score, consumer.score + 1);
      } else {
        candidates.push({ id: converterId, score: consumer.score + 1 });
      }
      candidates[consumerIdx]!.score = consumer.score - 1;
    }
  }

  // P-AI-011: deficyt surowca → priorytet budynku wytwarzającego / przetwarzającego.
  const deficitKeys = opts.resourceDeficitKeys;
  if (deficitKeys?.length) {
    for (const resKey of deficitKeys) {
      for (const buildingId of AI_BUILDING_FOR_DEFICIT[resKey] ?? []) {
        if (built.includes(buildingId)) continue;
        const idx = candidates.findIndex(c => c.id === buildingId);
        if (idx >= 0) {
          candidates[idx]!.score += 85;
        } else {
          candidates.push({ id: buildingId, score: 200 + economyScore });
        }
      }
    }
  }

  // §4.4 Filter out buildings already built (units can be built multiple times)
  // built (opts.cityBuildings) i candidates -- oba po id budynku (patrz cityBuilt w main.ts).
  const buildingNames = new Set(data.buildings.map(b => b.id));

  // MP (defensiveCopy): cap wojska wg trudności GRY gracza — easy bez limitu, normal max 1, hard 0.
  if (opts.defensiveCopy && opts.menuDifficulty !== undefined) {
    const milCap = cityStateMilitaryProductionCap(opts.menuDifficulty);
    if (milCap !== null) {
      const militaryOwned = countOwnerMilitaryUnits(allUnits, playerId);
      if (militaryOwned >= milCap) {
        candidates = candidates.filter(
          c => !isMilitaryProductionCandidate(c.id, buildingNames),
        );
      }
    }
  }

  let available = candidates.filter(c => {
    if (buildingNames.has(c.id) && built.includes(c.id)) return false;
    return true;
  });

  if (opts.isProductionAllowed) {
    available = available.filter(c => opts.isProductionAllowed!(cityId, c.id));
  }

  if (available.length === 0) return null;

  available.sort((a, b) => b.score - a.score);

  // pkt5: budget gate — filter by canAfford when provided.
  // Rules:
  //   • canAfford provided + some affordable → choose best affordable by score (or score/cost ratio).
  //   • canAfford provided + NONE affordable → return null (AI saves/waits, never builds over budget).
  //   • canAfford absent → no filtering, choose best by score (zero regression).
  const canAfford = opts.canAfford;
  if (canAfford !== undefined) {
    const affordable = available.filter(c => canAfford(cityId, c.id));
    if (affordable.length === 0) {
      // Nothing affordable — AI skips production this turn (saves budget).
      return null;
    }
    // Something affordable: choose best by score/cost ratio when itemCost provided,
    // otherwise by score alone (preserves existing behaviour when itemCost absent).
    const getItemCost = opts.itemCost;
    if (getItemCost !== undefined) {
      // Prefer the top-scored affordable item; if the top by score has a much worse
      // ratio than a cheaper alternative, pick the better ratio one.
      // Heuristic: sort by score DESC first, then use score/cost as tie-breaker for
      // items within 30% of the top score (prefer cheaper within same priority band).
      const topScore = affordable[0]!.score; // already sorted desc (length>0 guaranteed above)
      const topBand  = affordable.filter(c => c.score >= topScore * 0.70);
      // Among top band, sort by score/cost DESC (higher = better value)
      topBand.sort((a, b) => {
        const costA = Math.max(getItemCost(a.id), 1);
        const costB = Math.max(getItemCost(b.id), 1);
        return (b.score / costB) - (a.score / costA);
      });
      return topBand[0]?.id ?? affordable[0]?.id ?? null;
    }
    // No itemCost — pick highest-scored affordable item (already sorted)
    return affordable[0]?.id ?? null;
  }

  return available[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Cuda świata (CUDA-AI, Maciej C-CUDA-AI=A 2026-07-23): AI (pełne cywilizacje,
// NIE miasta-państwa/kopie -- silnik nigdy nie woła to dla opts.defensiveCopy)
// też buduje cuda. Ta funkcja jest CZYSTA -- nie zna wonders.json/wonder-availability
// (żyją w main.ts, tam gdzie evaluateWonderBuildGate/completedWorldWonders/cityProd);
// silnik dostarcza już przefiltrowaną (bramka tech/epoka/ekskluzywność/wyścig) listę
// `buildableWonders` i stan kolejek miast (`cityCandidates`). Zero Math.random --
// deterministyczne przy tym samym stanie wejściowym (A=B).
// ---------------------------------------------------------------------------

/** Miasto-kandydat do rozważenia cudu (silnik dostarcza stan kolejki + tempo Pracy). */
export interface AiWonderCityCandidate {
  cityId: string;
  /** Kolejka produkcji miasta jest pusta (frontItem === null) -- zadanie: "wolna kolejka". */
  queueEmpty: boolean;
  /** Produkcja Pracy miasta/turę (econTick.doBudynkow w main.ts) -- miara "stać AI na cud". */
  pracaPerTurn: number;
}

/** Cud, który przeszedł evaluateWonderBuildGate dla tego AI (main.ts filtruje). */
export interface AiWonderOption {
  id: string;
  kosztBudowy: number;
  dostep: 'E' | 'R';
}

export interface AiWonderDecision {
  cityId: string;
  wonderId: string;
}

/**
 * Próg (koszt cudu <= progKosztX * Praca/turę miasta) i throttle (co ile tur AI
 * w ogóle rozważa cud -- "nie każda tura") per trudność. PRÓG DO AKCEPTACJI
 * WŁAŚCICIELA -- placeholdery w ai-params.json (cuda_poziom{1,2,3}_*), wzorzec
 * jak loadDifficultyParams. easy = rzadko/późno (wysoki próg X, rzadki throttle),
 * hard = agresywnie (niski próg X, częsty throttle).
 */
export interface AiWonderDifficultyParams {
  /** Cud kwalifikuje się gdy kosztBudowy <= progKosztX * pracaPerTurn miasta. */
  progKosztX: number;
  /** AI rozważa cud tylko co tyle tur (throttle). */
  throttleTur: number;
}

/** Wczytuje progi cudów AI z ai-params.json dla danego poziomu trudności. */
export function loadAiWonderParams(data: GameData, poziom: 1 | 2 | 3 = 2): AiWonderDifficultyParams {
  const n = poziom;
  return {
    progKosztX: getAiParam(data, `cuda_poziom${n}_prog_koszt_x`, n === 1 ? 25 : n === 2 ? 45 : 80),
    throttleTur: getAiParam(data, `cuda_poziom${n}_throttle_tur`, n === 1 ? 8 : n === 2 ? 5 : 2),
  };
}

/**
 * Decyduje czy i w którym mieście AI (ownerId) powinno zakolejkować cud tej
 * tury. Priorytety (zadanie): (1) cuda E (wyłączne) własnej cywilizacji przed
 * R (wyścig); (2) max 1 cud w budowie na cywilizację naraz (hasWonderInProgress);
 * (3) throttle -- nie każda tura; (4) miasto musi mieć wolną kolejkę I stać je
 * na cud wg progu trudności. Pierwsze pasujące miasto/cud (w kolejności wejścia)
 * wygrywa -- deterministyczne.
 */
export function decideAiWonderBuild(
  turn: number,
  ownerId: number,
  hasWonderInProgress: boolean,
  cityCandidates: readonly AiWonderCityCandidate[],
  buildableWonders: readonly AiWonderOption[],
  difficulty: AiWonderDifficultyParams,
): AiWonderDecision | null {
  if (hasWonderInProgress) return null;
  if (buildableWonders.length === 0) return null;
  if (difficulty.throttleTur <= 0) return null;
  // Throttle -- nie każda tura; +ownerId rozprasza AI na różne tury (deterministyczne).
  if ((turn + ownerId) % difficulty.throttleTur !== 0) return null;

  // E (wyłączne) przed R (wyścig) -- sort stabilny zachowuje kolejność wejściową
  // (main.ts podaje wg `kolejnosc` z indeksu państwa, patrz getWondersForCiv).
  const ordered = [...buildableWonders].sort((a, b) => {
    const ea = a.dostep === 'E' ? 0 : 1;
    const eb = b.dostep === 'E' ? 0 : 1;
    return ea - eb;
  });

  for (const city of cityCandidates) {
    if (!city.queueEmpty) continue;
    const budget = difficulty.progKosztX * Math.max(city.pracaPerTurn, 0);
    for (const w of ordered) {
      if (w.kosztBudowy <= budget) {
        return { cityId: city.cityId, wonderId: w.id };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Terrain improvements (D-IMPROVEMENTS): AI buduje ulepszenia terenu
// ---------------------------------------------------------------------------

/**
 * Kolejność priorytetów AI (Maciej ABC -- PRÓG DO AKCEPTACJI): plony pierwsze
 * (farma/pastwiska/tarasy/łowiectwo/rybołówstwo), potem surowce/rzemiosło,
 * na końcu infrastruktura (droga/fort). `wyrab` (wyrąb lasu) na SAMYM końcu --
 * TEMAT #8 (2026-07-23, Maciej „dopnij"): AI wybiera wyrąb tylko gdy żaden
 * inny typ (food/surowiec/infrastruktura) nie ma już qualifikującego heksa dla
 * tego miasta w tej turze -- pozycja w liście = "nic pilniejszego" bez osobnej
 * flagi (struktura pętli w `planCityImprovements`: pierwszy typ z qualifikującym
 * heksem wygrywa i przerywa pętlę typów). Dodatkowa heurystyka zachowania
 * zasobu lasu (patrz `WYRAB_MIN_FOREST_IN_RADIUS` w auto-improvements.ts + kod
 * w pickAutoImprovements) -- las to trwale znikający zasób, AI nie może wygolić
 * całego promienia miasta.
 * Stała lista -- zero Math.random(), determinizm A=B.
 * @see AI_IMPROVEMENT_PRIORITY w auto-improvements.ts
 */

/** P-AI-011: ulepszenie terenu pod brakujący surowiec (priorytet po handlu). */
const AI_IMPROVEMENT_FOR_DEFICIT: Readonly<Record<string, readonly ImprovementKey[]>> = {
  drewno: ['tartak', 'wyrab'],
  kamien: ['kamieniolom'],
  glina: ['glinianka'],
  ruda: ['kopalnia_miedzi'],
  ruda_zelaza: ['kopalnia_zelaza'],
};

/** P-AI-011: budynki miejskie pod brakujący surowiec. */
const AI_BUILDING_FOR_DEFICIT: Readonly<Record<string, readonly string[]>> = {
  drewno: ['stolarnia'],
  glina: ['garncarnia', 'cegielnia'],
  kamien: ['kamieniarski'],
  ruda: ['kuznia'],
  cegla: ['cegielnia'],
  braz: ['odlewnia_brazu'],
  zelazo: ['odlewnia_zelaza'],
  stal: ['wielka_odlewnia'],
  ceramika: ['garncarnia'],
};

function improvementPriorityForDeficits(
  base: readonly ImprovementKey[],
  deficitKeys: readonly string[] | undefined,
): ImprovementKey[] {
  if (!deficitKeys?.length) return [...base];
  const boost = new Set<ImprovementKey>();
  for (const key of deficitKeys) {
    for (const imp of AI_IMPROVEMENT_FOR_DEFICIT[key] ?? []) boost.add(imp);
  }
  if (boost.size === 0) return [...base];
  return [...base.filter(k => boost.has(k)), ...base.filter(k => !boost.has(k))];
}

/**
 * Próg nadwyżki Pracy (PRÓG DO AKCEPTACJI WŁAŚCICIELA): AI zaczyna wybierać
 * ulepszenia terenu dopiero gdy jego pula Pracy PRZEKRACZA tę wartość --
 * rezerwa na inne wydatki (Osadnik/wycinka, poza tym systemem) i throttling
 * wydajności (większość tur AI ma za mało Pracy, więc `planCityImprovements`
 * wraca [] natychmiast, bez skanowania jakichkolwiek heksów).
 */
const AI_IMPROVEMENT_PRACA_SURPLUS = 30;

/**
 * D-IMPROVEMENTS: planuje maks. JEDNO ulepszenie terenu NA MIASTO na turę dla
 * AI `ownerId` (throttling wydajności -- patrz raport pkt d). Reużywa
 * `buildImprovementQualifier` (map/improvement-build.ts) -- IDENTYCZNA
 * kwalifikacja terenu/terytorium/sektora jak dla gracza (zero nowej logiki
 * kwalifikacji). Wołane z OBU ścieżek (decideAITurn i decideDefensiveCopyTurn
 * -- ta sama intensywność dla miast-państw, Maciej decyzja 4).
 *
 * Wydajność (Maciej decyzja 2): skan heksów OGRANICZONY do promienia
 * terytorium KAŻDEGO miasta (+1, jak `candidateHexKeys` w
 * `createImprovementBuildApi`) -- NIGDY całej mapy. Typy tech-zablokowane
 * pomijane PRZED skanem heksów (w praniu AI ma zwykle 2-4 odblokowane typy,
 * nie 19). `roadKeys` CELOWO pominięte przy budowie stanu -- `isRoadQualified`
 * ma fallback na `hexHasRoad(map.hexes[...])` wprost z danych heksa; bez tego
 * trzeba by `collectRoadKeys(map)` = pełny skan mapy PER OWNER PER TURĘ
 * (dokładnie to, czego unikamy).
 *
 * Determinizm: miasta posortowane po id (string), heksy po (q,r) rosnąco,
 * typy w stałej kolejności `AI_IMPROVEMENT_PRIORITY`. Zero `Math.random()`.
 *
 * Zwraca [] gdy: brak miast, `opts.territoryNodes` nie dostarczone (silnik
 * jeszcze nie wpiął), lub Praca dostępna <= `AI_IMPROVEMENT_PRACA_SURPLUS`.
 */
function planCityImprovements(
  myCities: AICity[],
  ownerId: number,
  map: GameMap,
  opts: AITurnOpts,
): AICmdBuildImprovement[] {
  const territoryNodes = opts.territoryNodes;
  if (!territoryNodes || myCities.length === 0) return [];

  const pracaAvailable = opts.pracaAvailable ?? 0;
  const avgBuilt = myCities.reduce((s, c) => {
    const n = opts.cityBuildings?.[c.id]?.length ?? 0;
    return s + n;
  }, 0) / Math.max(1, myCities.length);
  const majorEarly = computeMajorAiEarlyGame(opts, myCities, avgBuilt);
  const pracaSurplusGate = majorEarly
    ? AI_MAJOR_EARLY_IMPROVEMENT_PRACA_SURPLUS
    : AI_IMPROVEMENT_PRACA_SURPLUS;
  // P-AI-009: bramka wejścia — pula musi PRZEKRACZAĆ próg (nie buduj przy „na styk").
  // Rezerwa NIE jest wymagana PO kosztu ulepszenia (gracz: AUTO_ULEPSZENIA_PRACA_RESERVE
  // w pickAutoImprovements — inna polityka). Przed FALA 204 / pickAutoImprovements AI
  // schodził z puli poniżej 30 po budowie farmy (koszt 20 przy puli 35) — regres MP.
  if (pracaAvailable <= pracaSurplusGate) return [];

  const picks = pickAutoImprovements({
    cities: myCities,
    ownerId,
    map,
    territoryNodes,
    placedImprovements: opts.placedImprovements,
    pracaAvailable,
    unlockedTechs: opts.improvementTechs ?? new Set<string>(),
    pracaSurplusThreshold: 0,
    skipWyrab: false,
    civArchetype: opts.civType,
    playerEra: opts.civEra ?? 1,
    priorityOverride: improvementPriorityForDeficits(
      AI_IMPROVEMENT_PRIORITY,
      opts.resourceDeficitKeys,
    ),
  });

  return picks.map(p => ({
    type: 'buildImprovement' as const,
    ownerId: p.ownerId,
    q: p.q,
    r: p.r,
    key: p.key,
  }));
}

// ---------------------------------------------------------------------------
// City founding (C-AI-EKSP-Q1/Q2 — panel budowy, bez osadnika)
// ---------------------------------------------------------------------------

/** Deterministyczny RNG do remisu miast-źródeł (playerId + turn). */
function aiFoundingRand(playerId: number, turn: number): () => number {
  let seed = playerId * 10007 + turn * 7919;
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * C-AI-EKSP-Q1=A: max 1 miasto/turę/cywilizację przez foundCityAt (koszt Pracy+ludność).
 * C-AI-EKSP-Q2=A: blokada gdy clusterConsolidationPhase (cele w clusterStateTargets).
 * defensiveCopy: brak founding (Maciej 2026-07-20).
 */
export function planCityFounding(
  playerId: number,
  cities: AICity[],
  map: GameMap,
  data: GameData,
  opts: AITurnOpts,
  minCityDist: number,
  units: readonly RuntimeUnit[] = [],
  excludeHexes: readonly { q: number; r: number }[] = [],
): AICmdFoundCityAt | null {
  if (opts.defensiveCopy) return null;
  const myCities = cities.filter(c => c.ownerId === playerId);
  if (isLocalExpansionPhase(opts, myCities, map, units, playerId, cities)) return null;

  const ekspansywnosc = opts.civAiProfile?.ekspansywnosc ?? 0;
  const clusterConsolidationPhase = (opts.clusterStateTargets ?? []).length > 0;
  const aggressiveColonization = aiColonizationAggressiveMode(opts, myCities);
  if (
    clusterConsolidationPhase
    && !aiMayBypassClusterConsolidation(ekspansywnosc, opts)
    && !(aggressiveColonization && !opts.clusterConquestDeadlineActive)
  ) return null;
  const treasuryPraca = aiTreasuryPracaForFounding(opts.pracaAvailable ?? 0, ekspansywnosc);
  const turn = opts.currentTurn ?? 0;
  const aff = evaluateFoundCityAffordance(
    treasuryPraca,
    myCities,
    playerId,
    { rand: aiFoundingRand(playerId, turn) },
  );
  if (!aff.ok) return null;

  const enemyCities = cities.filter(c => c.ownerId !== playerId);
  const era = opts.civEra ?? 1;
  const requireOutsideTerritory = era > AI_COLONIZATION_AGGRESSIVE_ERA_MAX;
  const targetHex = findCityFoundingHex(
    map,
    cities,
    enemyCities,
    data,
    minCityDist,
    opts,
    { excludeHexes, requireOutsideTerritory, applyMinScore: myCities.length > 0 },
  );
  if (targetHex === null) return null;

  const { ok } = canFoundCity(targetHex.q, targetHex.r, cities, map);
  if (!ok) return null;

  return { type: 'foundCityAt', q: targetHex.q, r: targetHex.r };
}

/** Czy wróg jest sąsiadem w promieniu 8 hex od terytorium własnego (C-AI-MOC-Q2=A). */
function isEnemyNearOwnTerritory(
  enemyQ: number,
  enemyR: number,
  myCities: AICity[],
  map: GameMap,
  maxDist = 8,
): boolean {
  for (const city of myCities) {
    const node = { q: city.q, r: city.r, pop: city.population, level: 1 };
    const radius = cityTerritoryRadius(node);
    for (const key of hexKeysWithinRadius(city.q, city.r, radius + maxDist, map)) {
      const parts = key.split(',');
      const hq = Number(parts[0]);
      const hr = Number(parts[1]);
      if (hexDistance(enemyQ, enemyR, hq, hr) <= maxDist) return true;
    }
  }
  return myCities.some(c => hexDistance(enemyQ, enemyR, c.q, c.r) <= maxDist);
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

/** True if unit is ranged (lucznik, procarz, oszczepnik). */
function isRanged(unit: RuntimeUnit): boolean {
  const c = unit.category;
  return c === 'lucznik' || c === 'procarz' || c === 'oszczepnik';
}

/** Max health from data.units (TW health, fallback Health), default 30. */
function _unitMaxHealth(unit: RuntimeUnit, data: GameData): number {
  const def = data.units.find(u => u.Jednostka === unit.typeId);
  const h = def?.Health ?? null;
  return (h !== null && h !== undefined && Number(h) > 0) ? Number(h) : 30;
}

// ---------------------------------------------------------------------------
// Idle fallback helper (4f)
// ---------------------------------------------------------------------------

/**
 * Applies the idle-fallback movement for a unit that received no command this turn.
 * Priority:
 *   (a) Move toward the nearest own city if the unit is farther than 1 hex away.
 *   (b) If no own cities exist, move toward the map center (q=width/2, r=height/2).
 * If firstStep returns null (path unreachable) for both options, no command is pushed —
 * the unit truly has nowhere to go and stays put rather than being forced.
 */
function applyIdleFallback(
  unit: RuntimeUnit,
  map: GameMap,
  myCities: AICity[],
  allUnits: RuntimeUnit[],
  commands: AICommand[],
): void {
  // (a) Nearest own city — move toward it if more than 1 hex away
  if (myCities.length > 0) {
    const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
    if (homeCity !== undefined && hexDistance(unit.q, unit.r, homeCity.q, homeCity.r) > 1) {
      const step = firstStep(unit, map, homeCity.q, homeCity.r, allUnits);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        return;
      }
    }
    // Own city is adjacent (distance <= 1) or path blocked — no fallback move needed.
    return;
  }

  // (b) No own cities: move toward map center
  const centerQ = Math.floor(map.szerokoscQ / 2);
  const centerR = Math.floor(map.wysokoscR / 2);
  if (hexDistance(unit.q, unit.r, centerQ, centerR) > 1) {
    const step = firstStep(unit, map, centerQ, centerR, allUnits);
    if (step !== null) {
      commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
    }
  }
}

// ---------------------------------------------------------------------------
// Main decision function
// ---------------------------------------------------------------------------

/**
 * Decides all commands for AI player `playerId` for a single turn.
 *
 * @param playerId      ownerId of the AI player (1..N)
 * @param units         All units on the map (all players)
 * @param cities        All cities on the map (all players)
 * @param map           The game map
 * @param data          Static game data (units, buildings, ai-params, terrain)
 * @param opts          Optional: civType for archetype mods, cityBuildings already built
 * @returns             Ordered list of AI commands for this turn (engine executes them)
 */
export function decideAITurn(
  playerId: number,
  units: RuntimeUnit[],
  cities: AICity[],
  map: GameMap,
  data: GameData,
  opts: AITurnOpts = {},
): AICommand[] {
  // Archetyp + trudność — wspólne dla ścieżki normalnej i defensywnej (kopie).
  const archKeyRaw: string = opts.civType !== undefined
    ? (CIV_TO_ARCH[opts.civType] ?? 'grecy')
    : 'grecy';
  const archKey = archKeyRaw as ArchKey;
  const mods = readArchMods(data, archKey);
  const difficultyLevel: 1 | 2 | 3 = opts.poziomTrudnosci ?? 2;
  const difficultyParams = loadDifficultyParams(data, difficultyLevel);
  if (opts.startoweMiasta === undefined) {
    opts.startoweMiasta = difficultyParams.startoweMiasta;
  }

  if (opts.defensiveCopy) {
    return decideDefensiveCopyTurn(playerId, units, cities, map, data, mods, opts, difficultyParams);
  }

  const commands: AICommand[] = [];

  const myUnits      = units.filter(u => u.ownerId === playerId);
  const myCities     = cities.filter(c => c.ownerId === playerId);
  const enemyUnits   = units.filter(u => u.ownerId !== playerId);
  const enemyCities  = cities.filter(c => c.ownerId !== playerId);
  const engageableEnemyUnits = enemyUnits.filter(u => aiCanEngageOwner(opts, u.ownerId));
  const engageableEnemyCities = enemyCities.filter(c => aiCanEngageOwner(opts, c.ownerId));

  // Faza 1: konsolidacja własnego klastra (Maciej 2026-07-07) — przed ekspansją poza region.
  const clusterTargetOwnerIds = new Set(
    (opts.clusterStateTargets ?? []).map(t => t.ownerId),
  );
  const clusterConsolidationPhase = clusterTargetOwnerIds.size > 0;
  const clusterEnemyCities = engageableEnemyCities.filter(c => clusterTargetOwnerIds.has(c.ownerId));
  const sklonnoscPodboju = opts.civAiProfile?.sklonnoscDoPodboju ?? 2;
  const skipPatrol = sklonnoscPodboju >= 4;
  const localExpansionPhase = isLocalExpansionPhase(opts, myCities, map, myUnits, playerId, cities);
  const villageExploreRace = !opts.clusterConquestDeadlineActive
    && (localExpansionPhase || isVillageExploreRacePhase(opts, myCities));

  // (archetyp + trudność policzone na górze funkcji — wspólne dla obu ścieżek)
  const minCityDist = getAiParam(data, 'ekspansja_min_dystans_miast', 5);

  // -------------------------------------------------------------------------
  // Step 1b: CITY FOUNDING — max 1/turę; surge 2 gdy brak wolnych MP (R-AI-KOLONIZACJA-Q2)
  // -------------------------------------------------------------------------
  const maxFoundingPerTurn = aiMaxFoundingPerTurn(cities, opts, playerId);
  const foundingExcludeHexes: { q: number; r: number }[] = [];
  for (let fi = 0; fi < maxFoundingPerTurn; fi++) {
    const foundingCmd = planCityFounding(
      playerId, cities, map, data, opts, minCityDist, myUnits, foundingExcludeHexes,
    );
    if (foundingCmd === null) break;
    commands.push(foundingCmd);
    foundingExcludeHexes.push({ q: foundingCmd.q, r: foundingCmd.r });
  }

  // -------------------------------------------------------------------------
  // Step 2: PRODUCTION -- one build command per city
  // -------------------------------------------------------------------------
  for (const city of myCities) {
    const buildId = chooseCityProduction(
      city.id, myCities, units, playerId, data, mods, opts, map, difficultyParams,
    );
    if (buildId !== null) {
      commands.push({ type: 'build', cityId: city.id, buildingId: buildId });
    }
  }

  // -------------------------------------------------------------------------
  // Step 2b: TERRAIN IMPROVEMENTS -- max 1/miasto/turę (patrz planCityImprovements)
  // -------------------------------------------------------------------------
  for (const cmd of planCityImprovements(myCities, playerId, map, opts)) {
    commands.push(cmd);
  }

  // -------------------------------------------------------------------------
  // Step 4: UNIT MOVEMENT AND ATTACK
  // Sort: super first, then military
  // -------------------------------------------------------------------------
  const sortedUnits = [...myUnits].sort((a, b) => {
    if (villageExploreRace) {
      const scoutA = isScoutUnit(a) ? 0 : 1;
      const scoutB = isScoutUnit(b) ? 0 : 1;
      if (scoutA !== scoutB) return scoutA - scoutB;
    }
    const superA = a.category === 'super' ? 0 : 1;
    const superB = b.category === 'super' ? 0 : 1;
    return superA - superB;
  });

  // Track which units received at least one action command this turn (for fallback).
  const unitActed = new Set<string>();

  // Audyt #56: lista wolnych (neutralnych) wiosek liczona LENIWIE i RAZ na to wywołanie
  // decideAITurn (per gracz AI, per turę) zamiast pełnego Object.keys(map.hexes) + skanu
  // mapy dla KAŻDEJ jednostki wojskowej osobno (patrz findNearestVillage niżej).
  let neutralVillagesCache: { q: number; r: number }[] | null = null;
  const getNeutralVillages = (): { q: number; r: number }[] => {
    if (neutralVillagesCache === null) {
      neutralVillagesCache = [];
      for (const key of Object.keys(map.hexes)) {
        const hex = map.hexes[key];
        if (hex === undefined) continue;
        if (!hex.wioska.istnieje) continue;
        if (hex.wlasciciel !== null) continue;
        neutralVillagesCache.push(hex.coords);
      }
    }
    return neutralVillagesCache;
  };

  // C-AI-MOC-Q2=A: cele wojskowe w promieniu 8 hex od własnego terytorium
  const expansionEnemyCities = engageableEnemyCities.filter(
    ec => isEnemyNearOwnTerritory(ec.q, ec.r, myCities, map, 8),
  );

  for (const unit of sortedUnits) {
    const cmdsBefore = commands.length;

    if (unit.ruchLeft <= 0) continue;

    // Zwiadowcy: wyścig o wioski — poza logiką bojową (nie atakują, nie patrolują „do domu").
    if (isScoutUnit(unit)) {
      const step = planScoutExploreStep(unit, map, myCities, units, getNeutralVillages());
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        unitActed.add(unit.id);
      }
      continue;
    }

    // Military

    // 4b: adjacent enemy unit -> attack (tylko engageable — np. gracz tylko w wojnie)
    const adjacentEnemy = engageableEnemyUnits.find(
      eu => isAdjacent(unit.q, unit.r, eu.q, eu.r),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      unitActed.add(unit.id);
      continue;
    }

    // 4b: adjacent enemy city -> move onto it (engine handles capture)
    const adjacentEnemyCity = (clusterConsolidationPhase ? clusterEnemyCities : engageableEnemyCities).find(
      ec => isAdjacent(unit.q, unit.r, ec.q, ec.r),
    ) ?? engageableEnemyCities.find(
      ec => isAdjacent(unit.q, unit.r, ec.q, ec.r),
    );
    if (adjacentEnemyCity !== undefined) {
      commands.push({ type: 'move', unitId: unit.id, toQ: adjacentEnemyCity.q, toR: adjacentEnemyCity.r });
      unitActed.add(unit.id);
      continue;
    }

    // Faza startowa: wioski przed marszem na obce miasta (wyścig o prezenty).
    if (villageExploreRace) {
      const villageTarget = findNearestVillage(unit, getNeutralVillages());
      if (villageTarget !== null) {
        const step = firstStep(unit, map, villageTarget.q, villageTarget.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
          unitActed.add(unit.id);
          continue;
        }
      }
    }

    // 4c: march toward enemy city — faza 1: najpierw państwa w klastrze, potem sąsiedzi (8 hex)
    const citiesForMarch = (() => {
      if (clusterConsolidationPhase && clusterEnemyCities.length > 0) return clusterEnemyCities;
      if (expansionEnemyCities.length > 0) return expansionEnemyCities;
      return engageableEnemyCities;
    })();
    const powerOf = opts.powerOfOwner;
    const targetCity = (() => {
      if (citiesForMarch.length === 0) return undefined;
      let bestScore = -Infinity;
      let bestCity: typeof citiesForMarch[0] | undefined;
      for (const ec of citiesForMarch) {
        const dist = hexDistance(unit.q, unit.r, ec.q, ec.r);
        const enemyPower = powerOf ? powerOf(ec.ownerId) : ((ec as { population?: number }).population ?? 2);
        const weaknessBonus = (difficultyParams.celObranie + (sklonnoscPodboju >= 4 ? 0.3 : 0))
          * (100 / Math.max(enemyPower, 1));
        const score = -dist + weaknessBonus;
        if (score > bestScore) { bestScore = score; bestCity = ec; }
      }
      return bestCity;
    })();
    if (targetCity !== undefined) {
      const nearestEnemyUnit = nearest(unit.q, unit.r, engageableEnemyUnits, u => u.q, u => u.r);
      const distToCity = hexDistance(unit.q, unit.r, targetCity.q, targetCity.r);
      const distToUnit = nearestEnemyUnit !== undefined
        ? hexDistance(unit.q, unit.r, nearestEnemyUnit.q, nearestEnemyUnit.r)
        : Infinity;

      // Ranged: hold back near home city if enemy is very close (§2.4 stay behind melee)
      if (isRanged(unit) && distToCity <= 3 && myCities.length > 0) {
        const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
        if (homeCity !== undefined && hexDistance(unit.q, unit.r, homeCity.q, homeCity.r) > 2) {
          const step = firstStep(unit, map, homeCity.q, homeCity.r, units);
          if (step !== null) {
            commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
            unitActed.add(unit.id);
          }
        }
        // Ranged unit idle fallback when already near home (no move issued above)
        if (commands.length === cmdsBefore) {
          applyIdleFallback(unit, map, myCities, units, commands);
          if (commands.length > cmdsBefore) unitActed.add(unit.id);
        }
        continue;
      }

      // Intercept nearby enemy unit en route to city
      if (nearestEnemyUnit !== undefined && distToUnit < distToCity && distToUnit <= 3) {
        const step = firstStep(unit, map, nearestEnemyUnit.q, nearestEnemyUnit.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
          unitActed.add(unit.id);
          continue;
        }
      }

      const step = firstStep(unit, map, targetCity.q, targetCity.r, units);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        unitActed.add(unit.id);
        continue;
      }
    }

    // 4d: neutral village exploration (Spec-AI §3.1 / §2.1 priority 3)
    const villageTarget = findNearestVillage(unit, getNeutralVillages());
    if (villageTarget !== null) {
      const step = firstStep(unit, map, villageTarget.q, villageTarget.r, units);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        unitActed.add(unit.id);
        continue;
      }
    }

    // 4e: patrol near own city (§2.1 priority 4) — pomijany przy wysokiej sklonnoscDoPodboju
    // oraz w fazie wyścigu o wioski (wojsko ma iść po prezenty, nie stać przy murach).
    if (!skipPatrol && !villageExploreRace && myCities.length > 0) {
      const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
      if (homeCity !== undefined && hexDistance(unit.q, unit.r, homeCity.q, homeCity.r) > 2) {
        const step = firstStep(unit, map, homeCity.q, homeCity.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
          unitActed.add(unit.id);
          continue;
        }
      }
    }

    // 4f: IDLE FALLBACK — unit has no enemy, no village, is already near/at home city
    // or all paths were unreachable. Move toward own city or map center so units
    // do not permanently idle at map edges.
    if (commands.length === cmdsBefore) {
      applyIdleFallback(unit, map, myCities, units, commands);
      if (commands.length > cmdsBefore) unitActed.add(unit.id);
    }
  }

  // Suppress unused-variable lint: unitActed populated for potential future use.
  void unitActed;

  commands.push({ type: 'endTurn' });
  return commands;
}

/** Progi posiłków w klastrze per poziom „Wsparcie miast-państw" (setup nowej gry). */
interface ResupTier {
  /** Promień (heksy) w którym wróg czyni siostrę "zagrożoną". */
  threatRadius: number;
  /** Min. własny garnizon (promień 1 od miasta-źródła) wymagany, by wysłać posiłek. */
  minGuard: number;
  /** Maks. liczba jednostek wysłanych na turę z jednego miasta-źródła. */
  maxPerTurn: number;
}

/**
 * D-START posiłki v2 (Maciej 2026-07-21 przeróbka ZMIANA 3 -- wartości NIETKNIĘTE,
 * tylko sterowanie zmienione z osobnej opcji setupu na trudność gry):
 *   normal = DZISIEJSZE stałe (1/2/1) — zero regresji domyślnej.
 *   low    = trudniej wyzwolić posiłek (radius 0, wyższy próg garnizonu).
 *   strong = łatwiej i więcej (radius 2, niższy próg garnizonu, 2/turę).
 */
export const RESUP_TIERS: Record<'low' | 'normal' | 'strong', ResupTier> = {
  low:    { threatRadius: 0, minGuard: 3, maxPerTurn: 1 },
  normal: { threatRadius: 1, minGuard: 2, maxPerTurn: 1 },
  strong: { threatRadius: 2, minGuard: 1, maxPerTurn: 2 },
};

/** Maks. dystans od domu, by jednostka MP (Hard) kontynuowała marsz ofensywny zamiast powrotu. */
const CS_OFFENSIVE_CAMPAIGN_RADIUS = 12;

/** R-MP-HARD-WAVE Q2: minimalny stos przy ataku na gracza (solo zakazany bez zagrożenia domu). */
export const CS_WAVE_ATTACK_MIN_STACK = 3;

function countFriendlyMilitaryOnHex(
  q: number,
  r: number,
  ownerIds: ReadonlySet<number>,
  allUnits: RuntimeUnit[],
): number {
  return allUnits.filter(
    u => u.q === q && u.r === r && ownerIds.has(u.ownerId) && !isScoutUnit(u),
  ).length;
}

function countOwnerFieldArmy(
  ownerId: number,
  ownerUnits: RuntimeUnit[],
  myCities: AICity[],
): number {
  return ownerUnits.filter(u => {
    if (isScoutUnit(u)) return false;
    const home = nearest(u.q, u.r, myCities, c => c.q, c => c.r);
    if (home === undefined) return true;
    return hexDistance(u.q, u.r, home.q, home.r) > 1;
  }).length;
}

/**
 * Trudny (cityStateOffensiveSupport): marsz na wroga wojny lub dołączenie do armii
 * sojusznika/siostry. Normal/Easy — nie wołane (legacy defend-only).
 */
function planCityStateOffensiveMove(
  unit: RuntimeUnit,
  map: GameMap,
  allUnits: RuntimeUnit[],
  myCities: AICity[],
  enemyUnits: RuntimeUnit[],
  enemyCities: AICity[],
  friendlyOwnerIds: ReadonlySet<number>,
  homeGuardCount: ReadonlyMap<string, number>,
  minGuardToSend: number,
  /** R-MP-HARD-WAVE Q1: wymagaj min. armii polowej przed wysłaniem z domu. */
  minFieldArmyBeforeSend = 0,
): { q: number; r: number } | null {
  if (isScoutUnit(unit)) return null;

  const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
  if (homeCity === undefined) return null;

  const distHome = hexDistance(unit.q, unit.r, homeCity.q, homeCity.r);
  const atHome = distHome <= 1;
  if (atHome) {
    const guardCount = homeGuardCount.get(homeCity.id) ?? 0;
    if (guardCount < minGuardToSend) return null;
    if (minFieldArmyBeforeSend > 0) {
      const ownerUnits = allUnits.filter(u => u.ownerId === unit.ownerId);
      const fieldArmy = countOwnerFieldArmy(unit.ownerId, ownerUnits, myCities);
      const totalMilitary = ownerUnits.filter(u => !isScoutUnit(u)).length;
      // Po wysłaniu tej jednostki zostaje minGuard; potrzeba minFieldArmyBeforeSend w polu.
      if (totalMilitary - minGuardToSend < minFieldArmyBeforeSend && fieldArmy < minFieldArmyBeforeSend) {
        return null;
      }
    }
  } else if (distHome > CS_OFFENSIVE_CAMPAIGN_RADIUS) {
    return null;
  }

  // 1) Dołącz do najbliższej armii sojusznika/siostry w zasięgu walki z wrogiem.
  const allies = allUnits.filter(
    u => friendlyOwnerIds.has(u.ownerId) && u.id !== unit.id && !isScoutUnit(u),
  );
  let bestAlly: RuntimeUnit | undefined;
  let bestAllyScore = -Infinity;
  for (const ally of allies) {
    const nearestEnemyToAlly = nearest(ally.q, ally.r, enemyUnits, u => u.q, u => u.r);
    if (nearestEnemyToAlly === undefined) continue;
    const enemyDist = hexDistance(ally.q, ally.r, nearestEnemyToAlly.q, nearestEnemyToAlly.r);
    if (enemyDist > 4) continue;
    const d = hexDistance(unit.q, unit.r, ally.q, ally.r);
    if (d > 6) continue;
    const score = -d - enemyDist;
    if (score > bestAllyScore) {
      bestAllyScore = score;
      bestAlly = ally;
    }
  }
  if (bestAlly !== undefined) {
    const step = firstStep(unit, map, bestAlly.q, bestAlly.r, allUnits);
    if (step !== null) return step;
  }

  // 2) Marsz na najbliższą jednostkę wroga wojny.
  const nearestEnemy = nearest(unit.q, unit.r, enemyUnits, u => u.q, u => u.r);
  if (nearestEnemy !== undefined) {
    const step = firstStep(unit, map, nearestEnemy.q, nearestEnemy.r, allUnits);
    if (step !== null) return step;
  }

  // 3) Marsz na najbliższe wrogie miasto (formalna wojna z właścicielem).
  const nearestEnemyCity = nearest(unit.q, unit.r, enemyCities, c => c.q, c => c.r);
  if (nearestEnemyCity !== undefined) {
    const step = firstStep(unit, map, nearestEnemyCity.q, nearestEnemyCity.r, allUnits);
    if (step !== null) return step;
  }

  return null;
}

/**
 * D-START kopia_typu_obronna — bez produkcji ekspansyjnej, bez osadników/foundCity;
 * poza tym pełna produkcja (jak zwykłe miasto AI, via chooseCityProduction), riposta
 * przy zagrożeniu własnego miasta i posiłki wewnątrz klastra ku zagrożonej siostrze
 * (Maciej 2026-07-20 — miasta-siostry aktywnym graczem, nie biernym łupem).
 */
function decideDefensiveCopyTurn(
  playerId: number,
  units: RuntimeUnit[],
  cities: AICity[],
  map: GameMap,
  data: GameData,
  mods: ArchetypeMods,
  opts: AITurnOpts,
  difficultyParams: DifficultyParams,
): AICommand[] {
  const commands: AICommand[] = [];
  const myUnits = units.filter(u => u.ownerId === playerId);
  const myCities = cities.filter(c => c.ownerId === playerId);
  const enemyUnits = units.filter(u => u.ownerId !== playerId);
  const engageableEnemyUnits = enemyUnits.filter(u => aiCanEngageOwner(opts, u.ownerId));

  // PRODUKCJA — garnizon+mury najpierw (patrz opts.defensiveCopy w chooseCityProduction),
  // potem PEŁNA kolejka jak zwykłe miasto AI (budynki gospodarcze, Koszary, jednostki);
  // bez ekspansji (Osadnik/foundCity zablokowane w chooseCityProduction i tutaj nigdzie
  // nie emitujemy foundCity). Zero bonusu: identyczna funkcja co dla zwykłego AI.
  for (const city of myCities) {
    const buildId = chooseCityProduction(
      city.id, myCities, units, playerId, data, mods, opts, map, difficultyParams,
    );
    if (buildId !== null) {
      commands.push({ type: 'build', cityId: city.id, buildingId: buildId });
    }
  }

  // Ulepszenia terenu -- ta sama intensywność co zwykłe miasto AI (Maciej decyzja 4:
  // miasta-państwa NIE dostają osobnego throttlingu, wspólny helper).
  for (const cmd of planCityImprovements(myCities, playerId, map, opts)) {
    commands.push(cmd);
  }

  // ---------------------------------------------------------------------------
  // POSIŁKI W KLASTRZE (D-START pkt c/e; Maciej 2026-07-21 przeróbka ZMIANA 1 —
  // sterowane TRUDNOŚCIĄ gry, nie osobną opcją setupu) — opts.citySupportLevel:
  //   - threatRadius  → siostra uznana za "zagrożoną" gdy wróg jest w tym promieniu od jej
  //     miasta (normal=1 = ta sama definicja co "riposta przy własnym mieście" niżej).
  //   - minGuard → źródło wysyła posiłek TYLKO gdy ma w promieniu 1 od WŁASNEGO miasta
  //     >= minGuard jednostek (zostawia sobie obrońców — nigdy nie rozbraja się całkowicie).
  //   - maxPerTurn → maks. tyle jednostek na turę z jednego miasta-źródła.
  //   Zero bonusu: normalny rozkaz 'move' tą samą jednostką, którą i tak miasto wyprodukowało
  //   normalną produkcją — różni się tylko WYBÓR CELU marszu (siostra zamiast bezczynności).
  //   normal = DZISIEJSZE stałe (1/2/1) -- zero regresji domyślnej; fallback 'normal' gdy
  //   opts.citySupportLevel nieustawiony (stare save sprzed tej opcji).
  const resupTier = RESUP_TIERS[opts.citySupportLevel ?? 'normal'];
  const RESUP_THREAT_RADIUS     = resupTier.threatRadius;
  const RESUP_MIN_GUARD_TO_SEND = resupTier.minGuard;
  const RESUP_MAX_PER_TURN      = resupTier.maxPerTurn;

  const sisterCityStates = opts.sisterCityStates ?? [];
  // Jednostki sióstr (ten sam klaster/typ) nigdy nie liczą się jako "wróg": ani jako
  // zagrożenie wyzwalające posiłki, ani jako cel riposty/marszu obronnego poniżej —
  // bez tego posiłek maszerujący do siostry albo jej wędrujący garnizon prowokowałby
  // bratobójczy atak (Maciej 2026-07-22 fix #24: filtr sojuszu też przy WYBORZE CELU).
  const sisterOwnerIds = new Set(sisterCityStates.map(s => s.ownerId));
  const nonSisterEnemyUnits = engageableEnemyUnits.filter(eu => !sisterOwnerIds.has(eu.ownerId));

  // Garnizon startowy per miasto (jednostki własne w promieniu 1) — migawka sprzed ruchów
  // w tej turze; wystarcza jako brama "nadwyżki", bo RESUP_MAX_PER_TURN=1 i tak ogranicza
  // wysyłkę do najwyżej jednej jednostki z danego miasta-źródła w tej turze.
  const homeGuardCount = new Map<string, number>();
  for (const city of myCities) {
    homeGuardCount.set(
      city.id,
      myUnits.filter(u => hexDistance(u.q, u.r, city.q, city.r) <= 1).length,
    );
  }

  let reinforcementsSentThisTurn = 0;
  let offensiveMovesThisTurn = 0;

  const enemyCitiesAtWar = cities.filter(
    c => c.ownerId !== playerId
      && aiCanEngageOwner(opts, c.ownerId)
      && !sisterOwnerIds.has(c.ownerId),
  );
  const offensiveSupport = opts.cityStateOffensiveSupport === true;
  const waveStackOwnerIds = new Set<number>([
    playerId,
    ...sisterOwnerIds,
    ...(opts.warAllyOwnerIds ?? []),
  ]);
  const friendlyArmyOwnerIds = new Set<number>([
    ...sisterOwnerIds,
    ...(opts.warAllyOwnerIds ?? []),
  ]);
  const maxOffensiveMovesPerTurn = offensiveSupport ? 3 : RESUP_MAX_PER_TURN;

  const isOwnCityThreatened = (): boolean => myCities.some(city =>
    nonSisterEnemyUnits.some(
      eu => hexDistance(eu.q, eu.r, city.q, city.r) <= RESUP_THREAT_RADIUS,
    ),
  );

  for (const unit of myUnits) {
    if (unit.ruchLeft <= 0) continue;

    const adjacentEnemy = nonSisterEnemyUnits.find(
      eu => isAdjacent(unit.q, unit.r, eu.q, eu.r),
    );
    if (adjacentEnemy !== undefined) {
      let doAttack = true;
      // R-MP-HARD-WAVE Q2: solo atak na gracza zakazany — tylko fala (stos ≥3) lub obrona domu.
      if (offensiveSupport && aiCanEngageOwner(opts, adjacentEnemy.ownerId)) {
        if (!isOwnCityThreatened()) {
          const stackSize = countFriendlyMilitaryOnHex(
            unit.q, unit.r, waveStackOwnerIds, units,
          );
          if (stackSize < CS_WAVE_ATTACK_MIN_STACK) {
            doAttack = false;
          }
        }
      }
      if (doAttack) {
        commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
        continue;
      }
    }

    let moved = false;
    for (const city of myCities) {
      const threat = nonSisterEnemyUnits.find(
        eu => isAdjacent(eu.q, eu.r, city.q, city.r),
      );
      if (threat === undefined) continue;
      const step = firstStep(unit, map, threat.q, threat.r, units);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        moved = true;
        break;
      }
    }
    if (moved) continue;

    // POSIŁKI: własne miasto NIE jest zagrożone (inaczej unit już by ripostował/marszował
    // wyżej) — sprawdź, czy jakaś siostra w klastrze jest zagrożona i czy ta jednostka jest
    // "nadwyżkowym" garnizonem swojego miasta (stoi w promieniu 1 od domu, dom ma >= 2 obrońców).
    if (
      reinforcementsSentThisTurn < RESUP_MAX_PER_TURN
      && sisterCityStates.length > 0
    ) {
      const homeCityForResup = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
      const atHome = homeCityForResup !== undefined
        && hexDistance(unit.q, unit.r, homeCityForResup.q, homeCityForResup.r) <= 1;
      const guardCount = homeCityForResup !== undefined
        ? (homeGuardCount.get(homeCityForResup.id) ?? 0)
        : 0;

      if (atHome && guardCount >= RESUP_MIN_GUARD_TO_SEND) {
        // Najbliższa zagrożona siostra (wróg sąsiaduje z jej miastem) — deterministyczny
        // tie-break: dystans rosnąco, przy remisie kolejność z opts.sisterCityStates.
        let bestSister: { ownerId: number; q: number; r: number } | undefined;
        let bestDist = Infinity;
        for (const sister of sisterCityStates) {
          const underAttack = nonSisterEnemyUnits.some(
            eu => hexDistance(eu.q, eu.r, sister.q, sister.r) <= RESUP_THREAT_RADIUS,
          );
          if (!underAttack) continue;
          const d = hexDistance(unit.q, unit.r, sister.q, sister.r);
          if (d < bestDist) {
            bestDist = d;
            bestSister = sister;
          }
        }
        if (bestSister !== undefined) {
          const step = firstStep(unit, map, bestSister.q, bestSister.r, units);
          if (step !== null) {
            commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
            reinforcementsSentThisTurn++;
            continue;
          }
        }
      }
    }

    // Trudny: aktywne wsparcie ofensywne — marsz na wroga wojny / łączenie z sojusznikiem.
    // Normal/Easy (offensiveSupport=false): legacy defend-only — ten blok pomijany.
    if (
      offensiveSupport
      && offensiveMovesThisTurn < maxOffensiveMovesPerTurn
      && (nonSisterEnemyUnits.length > 0 || enemyCitiesAtWar.length > 0)
    ) {
      const ownThreatened = isOwnCityThreatened();
      if (!ownThreatened) {
        const offStep = planCityStateOffensiveMove(
          unit,
          map,
          units,
          myCities,
          nonSisterEnemyUnits,
          enemyCitiesAtWar,
          friendlyArmyOwnerIds,
          homeGuardCount,
          RESUP_MIN_GUARD_TO_SEND,
          CS_WAVE_ATTACK_MIN_STACK,
        );
        if (offStep !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: offStep.q, toR: offStep.r });
          offensiveMovesThisTurn++;
          continue;
        }
      }
    }

    if (myCities.length > 0) {
      const homeCity = nearest(unit.q, unit.r, myCities, c => c.q, c => c.r);
      if (
        homeCity !== undefined
        && hexDistance(unit.q, unit.r, homeCity.q, homeCity.r) > 1
      ) {
        const step = firstStep(unit, map, homeCity.q, homeCity.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
    }
  }

  commands.push({ type: 'endTurn' });
  return commands;
}

// ---------------------------------------------------------------------------
// Helper: best settler founding target
// ---------------------------------------------------------------------------

/**
 * Scans map hexes and returns the highest-scoring land hex for city founding.
 * Must be >= minCityDist from all existing cities.
 * (Dawniej findSettlerTarget — reuse heurystyki bez jednostki osadnika.)
 */
function findCityFoundingHex(
  map: GameMap,
  allCities: AICity[],
  enemyCities: AICity[],
  data: GameData,
  minCityDist: number,
  opts: AITurnOpts = {},
  hexOpts: {
    excludeHexes?: readonly { q: number; r: number }[];
    requireOutsideTerritory?: boolean;
    applyMinScore?: boolean;
  } = {},
): { q: number; r: number } | null {
  let bestScore = -Infinity;
  let bestHex: { q: number; r: number } | null = null;
  const ekspansywnosc = opts.civAiProfile?.ekspansywnosc ?? 0;
  const ekspansjaScale = 1 + ekspansywnosc * 0.1;
  const powerInterval = aiPowerGoalFoundingInterval(ekspansywnosc);
  const powerGoalBoost = opts.currentTurn !== undefined
    && opts.currentTurn % powerInterval === 0
    && (opts.powerRank ?? 1) > 1;
  const clusterOutsidePenalty = aiClusterOutsidePenalty(ekspansywnosc);
  const minScore = hexOpts.applyMinScore
    ? getAiParam(data, 'ekspansja_min_score_hex', 3)
    : -Infinity;
  const excludeSet = new Set(
    (hexOpts.excludeHexes ?? []).map(h => `${h.q},${h.r}`),
  );

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;

    const t = hex.terenBazowy as string;
    if (t === 'morze' || t === 'wybrzeze' || t === 'gory') continue;

    const { q, r } = hex.coords;
    if (excludeSet.has(`${q},${r}`)) continue;

    const tooClose = allCities.some(c => hexDistance(q, r, c.q, c.r) < minCityDist);
    if (tooClose) continue;

    const withinReach = isHexWithinAnyCityReach(q, r, allCities);
    if (hexOpts.requireOutsideTerritory && withinReach) continue;

    let score = hexCityScore(hex, q, r, data, enemyCities, opts) * ekspansjaScale;
    if (powerGoalBoost) score += 25;
    if (!withinReach) score += AI_COLONIZATION_OUTSIDE_TERRITORY_BONUS;

    // pkt3: cluster bias — prefer hexes inside clusterCenter+clusterRadius
    // Faza 2: po konsolidacji klastra — nadal preferuj wnętrze regionu.
    if (opts.clusterCenter !== undefined && opts.clusterRadius !== undefined) {
      const distToCenter = hexDistance(q, r, opts.clusterCenter.q, opts.clusterCenter.r);
      if (distToCenter <= opts.clusterRadius) {
        score += 50 * ekspansjaScale; // strong bonus for hexes inside the cluster
      } else if (clusterOutsidePenalty > 0) {
        score -= clusterOutsidePenalty;
      }
    }

    if (score < minScore) continue;

    if (score > bestScore) {
      bestScore = score;
      bestHex = { q, r };
    }
  }

  if (bestHex !== null && bestScore < minScore) return null;
  return bestHex;
}

// ---------------------------------------------------------------------------
// Helper: nearest neutral village
// ---------------------------------------------------------------------------

/**
 * Returns the nearest hex with an unclaimed village (wioska.istnieje &&
 * wlasciciel === null), or null if none found.
 *
 * Audyt #56: przyjmuje gotową listę wolnych wiosek (zob. getNeutralVillages
 * w decideAITurn) zamiast samodzielnie skanować map.hexes — eliminuje
 * alokację Object.keys(320k) + pełny skan mapy przy KAŻDYM wywołaniu
 * (poprzednio: raz na jednostkę wojskową).
 */
function findNearestVillage(
  unit: RuntimeUnit,
  villages: { q: number; r: number }[],
): { q: number; r: number } | null {
  let bestDist = Infinity;
  let bestHex: { q: number; r: number } | null = null;

  for (const v of villages) {
    const d = hexDistance(unit.q, unit.r, v.q, v.r);
    if (d < bestDist) {
      bestDist = d;
      bestHex = v;
    }
  }

  return bestHex;
}

// ---------------------------------------------------------------------------
// ReakcjaAI — fight/flee heuristic
// ---------------------------------------------------------------------------

/**
 * Tunable thresholds for decideAIReaction.
 * Export them so callers can override in tests or difficulty settings.
 *
 * PROG_BITWA       – minimum effective ratio (silaAI/silaGracza) to pick 'bitwa'.
 * TERYTORIUM_MNOZNIK – multiplier applied to silaAI when AI is in own territory.
 * AGRESJA_WPLYW    – how much agresjaArchetypu lowers the battle threshold.
 *                    Effective threshold = PROG_BITWA - agresjaArchetypu * AGRESJA_WPLYW.
 * WARTOSC_PROG_OBS – when wartoscJednostkiAI exceeds this fraction of silaGracza,
 *                    the unit is considered "precious" and the threshold rises by
 *                    WARTOSC_KOREKTA.
 * WARTOSC_KOREKTA  – how much to raise the threshold for precious units.
 * PRZYJAZN_ZAUFANIE_PROG – above this trust level the AI is considered friendly
 *                    (unless at war or archetyp very aggressive).
 * AGRESJA_AGRESYWNY_PROG – agresjaArchetypu above this value overrides peace stance.
 */
export const PROG_BITWA            = 0.9;
export const TERYTORIUM_MNOZNIK    = 1.25;
export const AGRESJA_WPLYW         = 0.4;
export const WARTOSC_PROG_OBS      = 0.5;  // wartosc/silaGracza > this -> precious
export const WARTOSC_KOREKTA       = 0.15; // raise threshold for precious unit
export const PRZYJAZN_ZAUFANIE_PROG = 60;  // zaufanie >= this -> friendly (0-100 scale)
export const AGRESJA_AGRESYWNY_PROG = 0.7; // agresjaArchetypu >= this -> ignores peace

/** All inputs consumed by decideAIReaction. Immutable value object. */
export interface ReakcjaInputs {
  /** Combat strength of the AI unit (or stack). */
  silaAI: number;
  /** Combat strength of the player unit (or stack) nearby. */
  silaGracza: number;
  /**
   * Economic / strategic value of the AI unit.
   * High-value units (e.g. siege engine, unique) are more cautious.
   * Compare against silaGracza to judge "preciousness".
   */
  wartoscJednostkiAI: number;
  /** True when the AI unit is standing on its own civilisation's territory. */
  weWlasnymTerytorium: boolean;
  /** True when the two civs are formally at war (StanWojny.Wojna or equivalent). */
  stanWojny: boolean;
  /** AI trust toward the player (0-100). Optional; defaults to 50 (neutral). */
  zaufanie?: number;
  /** AI respect toward the player (0-100). Optional; not used directly but kept for future use. */
  respekt?: number;
  /**
   * Archetype aggression factor (0..1).
   * 0 = pacifist, 1 = maximum aggression.
   * Loaded from ai-params.json (e.g. archetype_zulusi_agresja).
   * Defaults to 0.5 (neutral).
   */
  agresjaArchetypu?: number;
}

/** Decision returned by decideAIReaction. Immutable value object. */
export type ReakcjaAI = {
  /** 'bitwa' = issue attack command; 'odwrot' = retreat / let pass. */
  akcja: 'bitwa' | 'odwrot';
  /** Effective ratio used in the decision (silaAI_adjusted / silaGracza). */
  ratio: number;
  /** Short human-readable reason for logging / debugging. */
  powod: string;
};

/**
 * Decides whether an AI unit should fight or flee when a player unit enters
 * an adjacent hex (neighbour, no Zone of Control — the player can pass).
 *
 * Rules (in priority order):
 *  1. Peace + friendly (stanWojny=false, zaufanie >= PRZYJAZN_ZAUFANIE_PROG)
 *     -> 'odwrot' ("pokoj - przepuszczam"), UNLESS archetyp is very aggressive
 *        (agresjaArchetypu >= AGRESJA_AGRESYWNY_PROG) AND ratioEff >= PROG_BITWA.
 *  2. Compute ratioEff:
 *       ratioEff = silaAI / max(silaGracza, 0.001)
 *       * TERYTORIUM_MNOZNIK if weWlasnymTerytorium
 *     Effective battle threshold:
 *       progEff = PROG_BITWA - agresjaArchetypu * AGRESJA_WPLYW
 *       progEff += WARTOSC_KOREKTA if precious unit (wartoscJednostkiAI/silaGracza > WARTOSC_PROG_OBS)
 *  3. ratioEff >= progEff -> 'bitwa'; else -> 'odwrot'.
 *
 * Execution of the decision is the engine's responsibility:
 *   'bitwa'  -> UNITS module issues attack command
 *   'odwrot' -> MAPA module moves unit away (or no-op)
 *
 * @param inp    Input value object (immutable, copied internally).
 * @returns      ReakcjaAI decision (immutable).
 */
export function decideAIReaction(
  inp: ReakcjaInputs,
  agresjaMnoznik: number = 1,
): ReakcjaAI {
  const eps = 0.001;
  // agresjaMnoznik skaluje efektywna agresje (trudnosc wplywa na SPRYT, nie tylko bonusy)
  const agresja   = Math.min(1, (inp.agresjaArchetypu ?? 0.5) * agresjaMnoznik);
  const zaufanie  = inp.zaufanie ?? 50;

  const ratioRaw  = inp.silaAI / Math.max(inp.silaGracza, eps);
  const ratioEff  = inp.weWlasnymTerytorium ? ratioRaw * TERYTORIUM_MNOZNIK : ratioRaw;

  // Precious unit check: if wartoscJednostkiAI is large relative to enemy strength
  const precious  = (inp.wartoscJednostkiAI / Math.max(inp.silaGracza, eps)) > WARTOSC_PROG_OBS;

  // Effective battle threshold
  let progEff = PROG_BITWA - agresja * AGRESJA_WPLYW;
  if (precious) progEff += WARTOSC_KOREKTA;

  // ---- Rule 1: peace + friendly override -----
  if (!inp.stanWojny && zaufanie >= PRZYJAZN_ZAUFANIE_PROG) {
    // Very aggressive archetype can still attack if it clearly outclasses the player
    const agresywny = agresja >= AGRESJA_AGRESYWNY_PROG;
    if (!agresywny || ratioEff < progEff) {
      return { akcja: 'odwrot', ratio: ratioEff, powod: 'pokoj - przepuszczam' };
    }
  }

  // ---- Rule 2: ratio decides -----
  if (ratioEff >= progEff) {
    const src = inp.weWlasnymTerytorium ? 'przewaga w terytorium' : 'przewaga sily';
    return { akcja: 'bitwa', ratio: ratioEff, powod: src };
  }

  // ---- Rule 3: too weak -----
  return { akcja: 'odwrot', ratio: ratioEff, powod: 'zbyt slaby - odwrot' };
}

// ---------------------------------------------------------------------------
// Posilki (reinforcements) heuristic
// ---------------------------------------------------------------------------

/** A candidate unit available to join the fight as reinforcement. */
export interface PosilekKandydat {
  /** Unique unit id (same as RuntimeUnit.id). */
  id: string;
  /** Combat strength of this unit. */
  sila: number;
  /**
   * Strategic / economic value (analogous to wartoscJednostkiAI).
   * Higher value = unit is more precious; AI avoids committing it unnecessarily.
   */
  wartosc: number;
  /**
   * Hex distance from the ongoing battle.
   * Only candidates with dystans <= 1 are eligible (adjacent to the fight).
   */
  dystans: number;
}

/**
 * Decides which nearby AI units should join a battle as reinforcements.
 *
 * Strategy:
 *  - Target combined strength: 1.2 * silaGracza (comfortable superiority).
 *  - If silaAIstarcie already >= TARGET: don't add anyone (preserve units).
 *  - Sort eligible candidates (dystans <= 1) by ascending wartosc
 *    (cheap units commit first, expensive ones stay back).
 *  - Add candidates until combined strength >= TARGET or no more candidates.
 *  - Never add a candidate if: dystans > 1 (too far) or
 *    its wartosc > silaGracza * WARTOSC_PROG_OBS (too precious, would expose it).
 *
 * Execution is the engine's responsibility (move + attack commands).
 *
 * @param silaAIstarcie  Current AI strength already engaged in the battle.
 * @param silaGracza     Player strength at the battle site.
 * @param kandydaci      All nearby AI units that could reinforce.
 * @returns              { dorzuc: string[] (unit ids), powod: string }
 */
export function decideAIReinforcements(
  silaAIstarcie: number,
  silaGracza: number,
  kandydaci: readonly PosilekKandydat[],
): { dorzuc: string[]; powod: string } {
  const eps    = 0.001;
  const TARGET = silaGracza * 1.2;

  // Already winning with large margin — preserve units
  if (silaAIstarcie >= TARGET) {
    return { dorzuc: [], powod: 'wystarczajaca przewaga - oszczedzamy' };
  }

  // Filter out distant or too-precious candidates
  const WARTOSC_MAX = silaGracza * WARTOSC_PROG_OBS;
  const eligible = kandydaci
    .filter(k => k.dystans <= 1 && k.wartosc <= Math.max(WARTOSC_MAX, eps))
    .slice() // copy before sort
    .sort((a, b) => a.wartosc - b.wartosc); // cheapest first

  const dorzuc: string[] = [];
  let silaLaczna = silaAIstarcie;

  for (const k of eligible) {
    if (silaLaczna >= TARGET) break;
    dorzuc.push(k.id);
    silaLaczna += k.sila;
  }

  if (dorzuc.length === 0) {
    return { dorzuc: [], powod: 'brak odpowiednich kandydatow' };
  }

  return {
    dorzuc,
    powod: `dorzucono ${dorzuc.length} jednostek (lacznie sila=${silaLaczna.toFixed(1)})`,
  };
}

// ---------------------------------------------------------------------------
// Dyplomacja AI – decideAIDiplomacy (v0.1: wojna / pokoj / trybut)
// ---------------------------------------------------------------------------
//
// Importujemy aiDiplomacyStance z diplomacy.ts (read-only per spec).
// Nie duplikujemy logiki relacjaScore/relacjaTier – reużywamy.
//
// Zakres v0.1 = wypowiedź_wojny / zaproponuj_pokój / żądaj_trybutu /
//              oferuj_trybut_za_pokój.
// v0.2 TODO: wieloturowe sojusze, handel, wasalizacja.

import {
  aiDiplomacyStance,
  diplomacyProposerStrengthEase,
  diplomacyAllianceStrengthAdjust,
  diplomacyAllianceMinZaufanie,
  diplomacyTreatyMinRelacja,
  getEffectiveDiplomacyParams,
  relationScore,
} from './diplomacy';
import type { Relation, AIDiplomacyContext } from './diplomacy';
import {
  shouldHonorAllianceWarObligation,
  type AllianceWarObligationInput,
} from './alliance-war-obligation';
import type { GameDifficulty } from './difficulty-cost';
import { TypCywilizacji } from '../types/player';
import {
  AI_TRADE_GOLD_MAX,
  AI_TRIBUTE_PEACE_MAX,
  AI_TRADE_AGREEMENT_SWEETENER_MARGIN,
  AI_TRADE_AGREEMENT_SWEETENER_MAX,
  scaleAiGenerousGoldOffer,
  canAiProposeOneShotGoldGift,
  canAiProposeTradeAgreement,
  canAiProposeResourceTrade,
  canAiRequestAudience,
  AI_RESOURCE_TRADE_DEFICIT_COOLDOWN_TURNS,
  AI_RESOURCE_TRADE_CITYSTATE_URGENT_COOLDOWN_TURNS,
  capAiGoldOffer,
} from './diplomacy-economy';
import {
  aiAllowsOneSidedGoldGift,
  aiAllowsTradeAgreementSweetener,
} from './diplomacy-ai-offer-balance';

// ---------------------------------------------------------------------------
// Strojalne progi (eksportowane, by testy mogły je sprawdzić)
// ---------------------------------------------------------------------------

/**
 * Minimalne respektWzgledny (0..1) wymagane do wypowiedzenia wojny.
 * 0.6 = AI jest co najmniej 1.5x silniejsza od partnera
 * (bo respektWzgledny = mojaSila/(mojaSila+silaPartnera) ~ 0.6 → stosunek sił 1.5:1).
 */
export const PROG_WOJNA_SILA   = 0.6;

/**
 * Minimalne agresja (0..1) archetype wymagana do wypowiedzenia wojny.
 * Przy agresja < 0.5 AI woli trybut lub pokój niż wojnę nawet przy przewadze.
 */
export const PROG_WOJNA_AGRESJA = 0.5;

/**
 * Minimalne respektWzgledny (0..1) wymagane do żądania trybutu (zamiast wojny).
 * 0.7 = duża przewaga militarna – AI może dyktować warunki bez walki.
 */
export const PROG_TRYBUT       = 0.7;

/**
 * Maksymalne respektWzgledny (0..1) przy którym AI proponuje pokój w trakcie wojny.
 * 0.4 = AI jest słabsza (stosunek sił < ~0.67:1) → szuka wyjścia z konfliktu.
 */
export const PROG_POKOJ_SLABOSC = 0.4;

/**
 * Minimalne willingnessAlly (0..1) wymagane do zaproponowania sojuszu.
 * 0.6 = wysokie zaufanie + dobra relacja; partner musi być „równy" (rw w [0.4,0.7]).
 */
export const PROG_SOJUSZ = 0.6;

/**
 * Minimalne willingnessTrade (0..1) wymagane do zaproponowania handlu.
 * 0.5 = neutralna lub lepsza relacja; handlowosc AI >= 0.4.
 */
export const PROG_HANDEL = 0.5;

// ---------------------------------------------------------------------------
// Typy wejścia / wyjścia
// ---------------------------------------------------------------------------

/**
 * Wejście per-partner dla decideAIDiplomacy.
 * Wszystkie pola są immutable value objects – brak referencji do DOM/THREE.
 */
export interface RelacjaWejscie {
  /** Id cywilizacji partnera (klucz silnikowy, np. 'rzym-1'). */
  partnerId: string;
  /** Bieżąca relacja (zaufanie + respekt + status). */
  relation: Relation;
  /**
   * Znormalizowana siła AI względem partnera (0..1).
   *   > 0.5 = AI jest silniejsza
   *   = 0.5 = równowaga
   *   < 0.5 = AI jest słabsza
   * Przykład: mySila=60, partnerSila=40 → respektWzgledny = 60/(60+40) = 0.6
   */
  respektWzgledny: number;
  /** Czy aktualnie trwa stan wojny z tym partnerem? */
  stanWojny: boolean;
  /** Tura ostatniej propozycji/rozliczenia jednorazowego daru ¤ (cooldown per para). */
  lastOneShotGiftTurn?: number;
  /**
   * E6 (2026-07-23): czy z partnerem już obowiązuje aktywna Umowa Handlowa
   * (RodzajTraktatu.UmowaHandlowa) — silnik (main.ts) sprawdza activeDeals.
   * Brak/undefined = traktowane jak brak umowy (nie blokuje propozycji).
   */
  hasHandelTreaty?: boolean;
  /**
   * E6: czy istnieje geometrycznie możliwe połączenie tras handlowych między
   * miastami obu stron (silnik: game/trade-routes.ts findCityConnection /
   * citiesHaveTradeConnection). Wymagane === true, by AI zaproponowało Umowę
   * Handlową — bez tego pola (undefined) propozycja się NIE pojawia (bezpieczny
   * domyślny brak zachowania dla wywołujących, które go nie dostarczają).
   */
  hasTradeConnection?: boolean;
  /** Tura ostatniej PROAKTYWNEJ propozycji Umowy Handlowej (E6, cooldown per para). */
  lastTradeAgreementProposalTurn?: number;
  /**
   * HANDEL-SUROWCE-CYKL (2026-07-24): oferta nadwyżki surowca do zaproponowania
   * TEMU partnerowi — main.ts oblicza z realnych magazynów (pickResourceSurplusForOwnerPair,
   * ownerId-agnostyczne: działa identycznie gracz↔AI i AI↔AI). Brak/undefined =
   * brak nadwyżki wartej zaoferowania → AI nie proponuje (bezpieczny domyślny brak).
   */
  resourceTradeOffer?: {
    surowiecKey: string;
    label: string;
    pakietyPerTura: number;
    zaplataTyp: 'zloto' | 'praca';
    zaplataPerTura: number;
    turns: number;
    /** Z perspektywy AI-proponenta: sprzedaje lub kupuje surowiec. */
    kierunek?: 'sprzedaz' | 'zakup';
    powod?: 'deficyt' | 'nadwyzka';
  };
  /** Czy z partnerem już trwa cykliczna umowa surowcowa (main.ts: activeDeals). */
  hasActiveResourceTradeDeal?: boolean;
  /** Tura ostatniej PROAKTYWNEJ propozycji handlu surowcem (cooldown per para). */
  lastResourceTradeProposalTurn?: number;
  /** Typ cywilizacji partnera (ikonaId / TypCywilizacji) — aiDiplomacyStance per nacja. */
  partnerTypCywilizacji?: string;
  /** Czy aktywny pakt nieagresji z partnerem (main.ts: activeDeals). */
  hasNapTreaty?: boolean;
  /**
   * P-AI-011 / proaktywny handel: czy gracz formalnie nawiązał kontakt w audiencji.
   * Dotyczy partnerId === '0' (gracz). Bez kontaktu AI może wysłać zaproponuj_audiencje.
   */
  contactEstablished?: boolean;
  /** Czy partner (gracz) jest odkryty na mapie z perspektywy tego AI. */
  mapContact?: boolean;
  /** Partner to miasto-państwo (uproszczona dyplomacja). */
  isMinorCivPartner?: boolean;
  /** Tura ostatniej prośby o audiencję u gracza (cooldown). */
  lastAudienceRequestTurn?: number;
  /**
   * Aktywna karencja pokoju z partnerem — AI nie wypowiada wojny (Maciej 2026-08-01).
   * Ustawiane przez silnik z DiploPairMeta.peaceUntilTurn.
   */
  peaceLocked?: boolean;
}

/**
 * Kompletny zestaw wejść dla decideAIDiplomacy.
 */
export interface DiplomacjaInputs {
  /** Id gracza AI (właściciel tej tury decyzji). */
  myPlayerId: string;
  /** Lista relacji ze wszystkimi innymi graczami/AI. */
  relacje: RelacjaWejscie[];
  /**
   * Agresja archetype tej cywilizacji (0..1).
   * Pochodzi z ai-params.json (archetype_*_agresja) lub ARCHETYPE_AGGRESSION z diplomacy.ts.
   * 0 = całkowity pacyfizm, 1 = maksymalna agresja.
   */
  agresja: number;
  /**
   * Skłonność do handlu archetype (0..1). Pochodzi z ai-params.json / ARCHETYPE_TRADE.
   * Domyślnie 0.4. Wpływa na próg zaproponuj_handel.
   */
  handlowosc?: number;
  /**
   * Numer bieżącej epoki (opcjonalny; na przyszłość – modyfikatory per-epoka v0.2).
   * 0 = Kamień, 1 = Brąz, itp.
   */
  epoka?: number;
  /** Saldo skarbca AI (¤) — cap ofert złota; brak/0 = bez propozycji gold-only. */
  skarbiecGold?: number;
  /** Bieżąca tura — wymagana do cooldownu jednorazowych darów. */
  currentTurn?: number;
  /**
   * C-AI-MOC-Q1: sklonnoscDoPodboju z civ-ai.json (1–10).
   * >= 4 → agresywniejsze cele wojenne (obniżone progi wypowiedzenia).
   */
  sklonnoscDoPodboju?: number;
  /** Typ cywilizacji AI (TypCywilizacji / ikonaId) — zamiast stubów grecy/rzym. */
  myTypCywilizacji?: string;
  /** Surowa agresywność 1–10 z civ-ai.json (profil dyplomatyczny). */
  agresywnoscRaw?: number;
  /** Tolerancja ryzyka 1–10 z civ-ai.json (niższa = ostrożniejsza dyplomacja). */
  tolerancjaRyzyka?: number;
  /** Pełna warstwa dyplomacji (nie miasto-państwo) — paki/sojusze wielostronne. */
  fullDiplomacyLayer?: boolean;
  /** To AI jest miastem-państwem (częstszy handel przy deficycie). */
  isMinorCivSelf?: boolean;
  /**
   * AI-CS-CLUSTER-DIFF (2026-07-30): wymuszona wojna z państwem-miastem kręgu
   * (tura >= 20 lub deadline konsolidacji) — priorytet przed normalną dyplomacją.
   */
  clusterForceWarTargetId?: number;
}

/**
 * Komenda dyplomatyczna wynikająca z jednej decyzji AI.
 * Discriminated union – zawsze jedna komenda per partner, lub brak komendy (nie ma go w wyniku).
 *
 * v0.1 zakres: wojna / pokój / trybut.
 * v0.2 TODO: 'zaproponuj_sojusz', 'zaproponuj_handel' (wieloturowe).
 */
export type AIDiplomacyCommand =
  | { type: 'wypowiedz_wojne';       targetId: string; powod: string }
  | { type: 'zaproponuj_pokoj';      targetId: string; powod: string }
  | { type: 'zadaj_trybut';          targetId: string; powod: string }
  | { type: 'oferuj_trybut_za_pokoj'; targetId: string; powod: string; goldOnce?: number }
  | { type: 'zaproponuj_sojusz'; targetId: string; powod: string; allianceKind?: 'defensywny' | 'pelny' }
  | { type: 'zaproponuj_handel';     targetId: string; powod: string; goldOnce?: number }
  | { type: 'zaproponuj_umowe_handlowa'; targetId: string; powod: string; sweetenerGold?: number }
  | {
      type: 'zaproponuj_handel_surowiec'; targetId: string; powod: string;
      surowiecKey: string; label: string; pakietyPerTura: number;
      zaplataTyp: 'zloto' | 'praca'; zaplataPerTura: number; turns: number;
      kierunek?: 'sprzedaz' | 'zakup';
      powodHandlu?: 'deficyt' | 'nadwyzka';
    }
  | { type: 'zaproponuj_pakt'; targetId: string; powod: string; turns?: number }
  | {
      type: 'zaproponuj_audiencje'; targetId: string; powod: string;
      /** Krótki powód dla HUD (np. „chcą handlować”). */
      motive?: string;
    };

/**
 * N4 (WIARYGODNOSC-SPECYFIKACJA.md §2/§8) — czy `allyId` HONORUJE dziś wezwanie
 * obowiązku sojuszniczego (dołącza do wojny z `mustDeclareWarOn`) czy ODMAWIA.
 * Wołane z `main.ts:applyAllianceObligationsOnWar` dla KAŻDEGO obligatedAlly,
 * PRZED dotychczasowym wymuszonym dołączeniem — do 2026-07-26 silnik ZAWSZE
 * wymuszał join, więc ścieżka "odmawiam" (a razem z nią kara N4, gotowa
 * i poprawnie liczona) nigdy nie mogła się odpalić.
 *
 * C-WIAR-N4-AI=B — heurystyka odmowy w `shouldHonorAllianceWarObligation`
 * (alliance-war-obligation.ts). Bez 5. argumentu `ctx` zwraca `true` (kompatybilność
 * wsteczna: main.ts dopóki nie przekazuje kontekstu).
 *
 * Parytet (§6 pkt 2): gracz (allyId===0) nigdy nie odmawia automatycznie — decyzja UI osobno.
 */
export type AllianceWarObligationCtx = Omit<
  AllianceWarObligationInput,
  'allyId' | 'mustDeclareWarOn' | 'attackerId' | 'victimId'
>;

export function aiHonorsAllianceWarObligation(
  allyId: number,
  mustDeclareWarOn: number,
  attackerId: number,
  victimId: number,
  ctx?: AllianceWarObligationCtx,
): boolean {
  if (!ctx) return true;
  return shouldHonorAllianceWarObligation({
    allyId,
    mustDeclareWarOn,
    attackerId,
    victimId,
    ...ctx,
  });
}

// ---------------------------------------------------------------------------
// Opcjonalne overridy progów (dla testów lub trudności)
// ---------------------------------------------------------------------------

export interface DiplomacjaParams {
  progWojnaSila:           number;
  progWojnaAgresja:        number;
  progTrybut:              number;
  progPokojSlabosc:        number;
  progSojusz:              number;
  progHandel:              number;
  progTrybutKrytyczny:     number;
  progTrybutAgresjaMax:    number;
  progHandelArchetypeMin:  number;
  progHandelRelacjaMin:    number;
}

type AiParamEntry = { wartosc?: number };

/** Odczyt ai-params.json (Panel-D) bez GameData — działa od razu po eksporcie panelu. */
function staticAiParam(key: string, fallback: number): number {
  const entry = (aiParamsRaw as Record<string, AiParamEntry>)[key];
  const v = entry?.wartosc;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Domyślne progi decideAIDiplomacy z Panel-D (ai-params.json). */
export function loadDefaultAIDiplomacyProgs(difficulty: GameDifficulty = 'normal'): DiplomacjaParams {
  const dip = getEffectiveDiplomacyParams(difficulty);
  return {
    progWojnaSila:          staticAiParam('ai_diplomacja_prog_wojna_sila',    PROG_WOJNA_SILA),
    progWojnaAgresja:       staticAiParam('ai_diplomacja_prog_wojna_agresja', PROG_WOJNA_AGRESJA),
    progTrybut:             staticAiParam('ai_diplomacja_prog_trybut',        PROG_TRYBUT),
    progPokojSlabosc:       staticAiParam('ai_diplomacja_prog_pokoj_slabosc', PROG_POKOJ_SLABOSC),
    progSojusz:             staticAiParam('ai_diplomacja_prog_sojusz',        PROG_SOJUSZ),
    progHandel:             staticAiParam('ai_diplomacja_prog_handel',        PROG_HANDEL),
    progTrybutKrytyczny:    staticAiParam('ai_diplomacja_prog_trybut_krytyczny', 0.25),
    progTrybutAgresjaMax:   staticAiParam('ai_diplomacja_prog_trybut_agresja_max', 0.75),
    progHandelArchetypeMin: staticAiParam('ai_diplomacja_prog_handel_archetyp_min', 0.4),
    progHandelRelacjaMin:   dip.progHandelRelacja,
  };
}

// ---------------------------------------------------------------------------
// Profil dyplomatyczny per typ cywilizacji (civ-ai.json)
// ---------------------------------------------------------------------------

/** Modyfikatory progów decideAIDiplomacy wg profilu pokojowego / agresywnego. */
export interface DiplomacyCivBias {
  peaceful: boolean;
  aggressive: boolean;
  /** Dodatnie = wyższy próg siły do wojny (trudniej wypowiedzieć). */
  warSilaBonus: number;
  /** Dodatnie = wyższy próg agresji do wojny. */
  warAgresjaBonus: number;
  /** Obniża wymaganą Relację na handel / umowę / pakt (pkt). */
  tradeScoreEase: number;
  /** Obniża próg willingnessAlly na sojusz (0..1). */
  allyThresholdEase: number;
  /** Obniża próg Relacji na pakt nieagresji (pkt). */
  napScoreEase: number;
  /** Pokojowe cywilizacje nie żądają haraczu proaktywnie. */
  skipTributeDemand: boolean;
  /** Czy AI proponuje pakt nieagresji zamiast eskalacji. */
  proposeNap: boolean;
  /** Obniża minimalny respekt (%) do żądania trybutu. */
  tributeRespektEase: number;
  /** Mnożnik progWojnaAgresja dla minimalnej agresji przy trybucie. */
  tributeAgresjaFactor: number;
}

/**
 * Klasyfikuje profil dyplomatyczny AI na podstawie civ-ai.json
 * (agresywnosc, sklonnoscDoPodboju, tolerancjaRyzyka).
 */
export function resolveDiplomacyCivBias(
  agresja: number,
  sklonnoscDoPodboju: number = 2,
  agresywnoscRaw?: number,
  tolerancjaRyzyka?: number,
): DiplomacyCivBias {
  const pod = sklonnoscDoPodboju;
  const risk = tolerancjaRyzyka ?? 5;
  // Pokojowy/agresywny profil wymaga danych z civ-ai.json (agresywnoscRaw);
  // bez nich archetyp agresja 0..1 nie zmienia biasu (testy / miasta-państwa).
  const peaceful = agresywnoscRaw != null
    ? agresywnoscRaw <= 3 && pod <= 2
    : false;
  const aggressive = agresywnoscRaw != null
    ? agresywnoscRaw >= 7 || pod >= 4
    : pod >= 4;

  const neutral: DiplomacyCivBias = {
    peaceful: false,
    aggressive: false,
    warSilaBonus: 0,
    warAgresjaBonus: 0,
    tradeScoreEase: 0,
    allyThresholdEase: 0,
    napScoreEase: 0,
    skipTributeDemand: false,
    proposeNap: false,
    tributeRespektEase: 0,
    tributeAgresjaFactor: 0.5,
  };

  if (peaceful) {
    return {
      peaceful: true,
      aggressive: false,
      warSilaBonus: 0.08,
      warAgresjaBonus: 0.10,
      tradeScoreEase: 15,
      allyThresholdEase: 0.10,
      napScoreEase: 12,
      skipTributeDemand: true,
      proposeNap: true,
      tributeRespektEase: 0,
      tributeAgresjaFactor: 0.5,
    };
  }
  if (aggressive) {
    const riskWar = risk >= 7 ? 0.04 : 0;
    return {
      peaceful: false,
      aggressive: true,
      warSilaBonus: -(0.06 + riskWar),
      warAgresjaBonus: -(0.08 + riskWar * 0.5),
      tradeScoreEase: -10,
      allyThresholdEase: -0.08,
      napScoreEase: 0,
      skipTributeDemand: false,
      proposeNap: false,
      tributeRespektEase: 10,
      tributeAgresjaFactor: 0.35,
    };
  }
  return neutral;
}

// ---------------------------------------------------------------------------
// decideAIDiplomacy
// ---------------------------------------------------------------------------

/**
 * Podejmuje decyzje dyplomatyczne AI na koniec tury.
 *
 * Dla każdej relacji (`relacje`) zwraca co najwyżej jedną komendę.
 * Priorytet komend (od najwyższego):
 *   1. oferuj_trybut_za_pokoj  (b. słaby w wojnie: respektWzgledny <= 0.25)
 *   2. zaproponuj_pokoj        (słaby w wojnie:    respektWzgledny <= PROG_POKOJ_SLABOSC)
 *   3. zadaj_trybut            (duża przewaga, !stanWojny: respektWzgledny >= PROG_TRYBUT,
 *                               agresja średnia; preferowane przed wojną gdy b. silny)
 *   4. wypowiedz_wojne         (!stanWojny, wrogie, respektWzgledny >= PROG_WOJNA_SILA,
 *                               agresja >= PROG_WOJNA_AGRESJA, relationScore < progMinimalny)
 *   5. brak komendy            (neutralne/przyjazne lub progi nie spełnione)
 *
 * Korzysta z `aiDiplomacyStance` (diplomacy.ts) do oceny nastawienia AI –
 * nie duplikuje wewnętrznej logiki relacjaScore/tier.
 *
 * Pure function – brak DOM, brak mutacji wejść, deterministyczna.
 *
 * @param inp                 Kompletne wejście dla tej tury AI.
 * @param params              Opcjonalne overridy progów (domyślnie PROG_* stałe z tego modułu).
 * @param agresjaMnoznik      Mnoznik trudnosci dla effAgresja (P3/P4 - trybut/wojna).
 * @param dyplomacjaAktywnosc Mnoznik trudnosci dla willingnessAlly/willingnessTrade
 *                            (P5 sojusz / P6 handel) — D-MP-DYPL Q1 (Maciej 2026-07-21).
 * @returns       Tablica komend (0..N); jeden gracz może dostać max jedną komendę.
 *
 * Priorytety 5 (zaproponuj_sojusz), 5b (zaproponuj_umowe_handlowa, E6) i 6
 * (zaproponuj_handel) zaimplementowane ponizej
 * (v0.2), skalowane dyplomacjaAktywnosc.
 */
export function decideAIDiplomacy(
  inp:                 DiplomacjaInputs,
  params?:             Partial<DiplomacjaParams>,
  agresjaMnoznik:      number = 1,
  /**
   * D-MP-DYPL Q1 (Maciej 2026-07-21, część 2): mnoznik aktywnosci dyplomacji
   * (0..2, z ai-params.json trudnosc_poziomN_dyplomacja_aktywnosc: easy=0.8,
   * normal=1.0, hard=1.25). Skaluje willingnessAlly/willingnessTrade (P5/P6)
   * analogicznie do agresjaMnoznik na effAgresja -- wyzsza aktywnosc = chetniej
   * proponuje sojusz/handel. Dotyczy WSZYSTKICH AI (parametr ogolny), nie tylko
   * miast-panstw -- viz. RAPORT do wlasciciela.
   */
  dyplomacjaAktywnosc: number = 1,
  difficulty: GameDifficulty = 'normal',
): AIDiplomacyCommand[] {
  if (!inp?.relacje?.length) return [];

  // AI-CS-CLUSTER-DIFF: wymuszona wojna z CS kręgu (t.20+ / deadline do t.100).
  if (inp.clusterForceWarTargetId != null) {
    const forcedId = String(inp.clusterForceWarTargetId);
    const forcedRel = inp.relacje.find(r => r.partnerId === forcedId);
    if (
      forcedRel
      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    `AI-CS-CLUSTER-DIFF: wymuszona wojna z państwem-miastem kręgu (tura ${inp.currentTurn ?? 0})`,
      }];
    }
  }

  const p: DiplomacjaParams = {
    ...loadDefaultAIDiplomacyProgs(difficulty),
    ...params,
  };

  const bias = resolveDiplomacyCivBias(
    inp.agresja,
    inp.sklonnoscDoPodboju ?? 2,
    inp.agresywnoscRaw,
    inp.tolerancjaRyzyka,
  );

  const komendy: AIDiplomacyCommand[] = [];

  for (const rel of inp.relacje) {
    // Budujemy context dla aiDiplomacyStance.
    // militaryRatio: respektWzgledny to frakcja 0..1 (mojaSila/(mojaSila+partnerSila)).
    // aiDiplomacyStance oczekuje stosunku silaAI/silaPartnera (> 1 = AI silniejsza).
    // Przeliczamy: jeśli respektWzgledny = x, to stosunek = x / (1 - x).
    // Chronimy przed dzieleniem przez zero przy x == 1 (absolutna dominacja).
    const rw = rel.respektWzgledny;
    const militaryRatio = rw >= 1 ? 99 : rw <= 0 ? 0.01 : rw / (1 - rw);

    const ctx: AIDiplomacyContext = {
      isMinorCiv:   false,   // decyzja o minor civ leży po stronie silnika; tu zakładamy główną cyw.
      militaryRatio,
      currentTurn:  0,       // nie wpływa na logikę v0.1
      turnsAtWar:   rel.stanWojny ? 5 : 0,  // heurystyka – wystarczy do oceny peaceW
    };

    // Stub gracza AI — aiDiplomacyStance wymaga Player z prawdziwym typem cywilizacji.
    const aiTyp = (inp.myTypCywilizacji ?? 'grecy') as TypCywilizacji;
    const partnerTyp = (rel.partnerTypCywilizacji ?? 'rzymianie') as TypCywilizacji;
    const stubAIPlayer  = { typCywilizacji: aiTyp } as Parameters<typeof aiDiplomacyStance>[0];
    const stubOtherPlayer = { typCywilizacji: partnerTyp } as Parameters<typeof aiDiplomacyStance>[1];

    const stance = aiDiplomacyStance(stubAIPlayer, stubOtherPlayer, rel.relation, ctx);
    const score  = relationScore(rel.relation);
    const { progMinimalnyRelacja } = getEffectiveDiplomacyParams(difficulty);
    // Efektywna agresja z uwzglednieniem mnoznika trudnosci (T4=B: spryt AI)
    const effAgresja = Math.min(1, inp.agresja * agresjaMnoznik);
    // C-AI-MOC-Q1: wysoka sklonnoscDoPodboju → łatwiej wypowiada wojnę
    const podbojBoost = (inp.sklonnoscDoPodboju ?? 2) >= 4 ? 0.12 : 0;
    const effProgWojnaSila = Math.max(
      0.3,
      p.progWojnaSila - podbojBoost + bias.warSilaBonus,
    );
    const effProgWojnaAgresja = Math.max(
      0.15,
      p.progWojnaAgresja - podbojBoost * 0.5 + bias.warAgresjaBonus,
    );

    // ---- Priorytet 1: oferuj_trybut_za_pokoj (b. słaby w trakcie wojny) ----
    const csBlocksTribute = inp.isMinorCivSelf === true || rel.isMinorCivPartner === true;
    if (rel.stanWojny && rw <= p.progTrybutKrytyczny && !csBlocksTribute) {
      const peaceGold = capAiGoldOffer(inp.skarbiecGold ?? 0, AI_TRIBUTE_PEACE_MAX);
      if (peaceGold > 0) {
        komendy.push({
          type:     'oferuj_trybut_za_pokoj',
          targetId: rel.partnerId,
          powod:    `krytyczna slabosz w wojnie (respektWzgledny=${rw.toFixed(2)}): oferujemy ${peaceGold} ¤ za pokoj`,
          goldOnce: peaceGold,
        });
        continue;
      }
    }

    // ---- Priorytet 2: zaproponuj_pokoj (słaby w trakcie wojny) ----
    if (rel.stanWojny && rw <= p.progPokojSlabosc) {
      komendy.push({
        type:     'zaproponuj_pokoj',
        targetId: rel.partnerId,
        powod:    `slabszy w wojnie (respektWzgledny=${rw.toFixed(2)} <= prog=${p.progPokojSlabosc}): proponujemy pokoj`,
      });
      continue;
    }

    const currentTurnForTrade = inp.currentTurn ?? 0;
    const tradeRelMin = Math.max(0, p.progHandelRelacjaMin - bias.tradeScoreEase);

    const resOffer = rel.resourceTradeOffer;
    const isDeficitTrade = resOffer?.kierunek === 'zakup' || resOffer?.powod === 'deficyt';
    const tradeCooldownTurns = (() => {
      if (isDeficitTrade && (inp.isMinorCivSelf || rel.isMinorCivPartner)) {
        return AI_RESOURCE_TRADE_CITYSTATE_URGENT_COOLDOWN_TURNS;
      }
      if (isDeficitTrade) return AI_RESOURCE_TRADE_DEFICIT_COOLDOWN_TURNS;
      return undefined;
    })();

    // ---- Priorytet 2a: prośba o audiencję (inicjatywa AI — przed handlem) ----
    const wantsTradeAudience = resOffer != null && !rel.hasActiveResourceTradeDeal;
    if (
      !rel.stanWojny
      && rel.partnerId === '0'
      && rel.contactEstablished === false
      && rel.mapContact !== false
      && wantsTradeAudience
      && score >= tradeRelMin
      && canAiRequestAudience(currentTurnForTrade, rel.lastAudienceRequestTurn)
    ) {
      const motive = resOffer?.kierunek === 'zakup'
        ? `chcą handlować (${resOffer?.label ?? 'surowiec'})`
        : 'chcą handlować';
      komendy.push({
        type:     'zaproponuj_audiencje',
        targetId: rel.partnerId,
        powod:    `Prośba o audiencję — ${motive}`,
        motive,
      });
      continue;
    }

    // ---- Priorytet 2b: handel surowcem (P-AI-011 — deficyt przed eskalacją) ----
    /** Handel (w tym zakup surowca) od Relacji >= 0 — progHandelRelacja w diplomacy.json. */
    const tradeScoreForRes = tradeRelMin;
    const canAffordBuy = !isDeficitTrade
      || resOffer?.zaplataTyp !== 'zloto'
      || (inp.skarbiecGold ?? 0) >= (resOffer?.zaplataPerTura ?? 0);
    if (
      !rel.stanWojny
      && resOffer != null
      && !rel.hasActiveResourceTradeDeal
      && canAffordBuy
      && score >= tradeScoreForRes
      && (rel.contactEstablished !== false || rel.partnerId !== '0')
      && canAiProposeResourceTrade(
        currentTurnForTrade,
        rel.lastResourceTradeProposalTurn,
        tradeCooldownTurns,
      )
    ) {
      const zaplataLabel = resOffer.zaplataTyp === 'praca' ? 'Praca' : '¤';
      const verb = resOffer.kierunek === 'zakup'
        ? `Kupię od ciebie ${resOffer.label}`
        : `Nadwyżka ${resOffer.label} — oferujemy sprzedaż`;
      komendy.push({
        type:     'zaproponuj_handel_surowiec',
        targetId: rel.partnerId,
        powod:    `${verb}: ${resOffer.pakietyPerTura} pakiet(y)/turę` +
          ` za ${resOffer.zaplataPerTura} ${zaplataLabel}/turę przez ${resOffer.turns} tur` +
          (isDeficitTrade ? ' (deficyt surowca)' : ''),
        surowiecKey: resOffer.surowiecKey,
        label: resOffer.label,
        pakietyPerTura: resOffer.pakietyPerTura,
        zaplataTyp: resOffer.zaplataTyp,
        zaplataPerTura: resOffer.zaplataPerTura,
        turns: resOffer.turns,
        kierunek: resOffer.kierunek,
        powodHandlu: resOffer.powod,
      });
      continue;
    }

    // ---- Priorytet 3: zadaj_trybut (b. silny, !stanWojny; agresywne cywilizacje częściej) ----
    const dipTrybut = getEffectiveDiplomacyParams(difficulty);
    const proposerRespektPct = Math.round(100 * rw);
    const tributeRespektMin = dipTrybut.progTrybutZadanieMinRespekt - bias.tributeRespektEase;
    const tributeAgresjaMin = p.progWojnaAgresja * bias.tributeAgresjaFactor;
    const tributeAgresjaMax = bias.aggressive ? 0.95 : p.progTrybutAgresjaMax;
    if (
      !csBlocksTribute
      && !rel.stanWojny
      && !bias.skipTributeDemand
      && proposerRespektPct > tributeRespektMin
      && (!bias.aggressive || rw >= p.progTrybut)
      && effAgresja >= tributeAgresjaMin
      && effAgresja < tributeAgresjaMax
    ) {
      komendy.push({
        type:     'zadaj_trybut',
        targetId: rel.partnerId,
        powod:    `Respekt ${proposerRespektPct} > ${tributeRespektMin}, agresja profilu (effAgresja=${effAgresja.toFixed(2)}): zadamy trybut zamiast wojny`,
      });
      continue;
    }

    // ---- Priorytet 3b: zaproponuj_pakt (pokojowe cywilizacje — przed eskalacją) ----
    const dipP = getEffectiveDiplomacyParams(difficulty);
    if (
      !rel.stanWojny
      && (inp.fullDiplomacyLayer !== false)
      && bias.proposeNap
      && !rel.hasNapTreaty
      && score >= dipP.progNapRelacja - bias.napScoreEase
    ) {
      komendy.push({
        type:     'zaproponuj_pakt',
        targetId: rel.partnerId,
        powod:    `Profil pokojowy (Relacja=${score} >= progNap=${dipP.progNapRelacja - bias.napScoreEase}): proponujemy pakt nieagresji`,
        turns:    15,
      });
      continue;
    }

    // ---- Priorytet 4: wypowiedz_wojne (wrogie, wystarczajaca przewaga i agresja) ----
    // Agresywna AI (agresja >= PROG_WOJNA_AGRESJA=0.5) przy wrogiej, slabej relacji
    // i przewadze militarnej (rw >= PROG_WOJNA_SILA=0.6) wypowiada wojne.
    // Uwaga: przy rw >= PROG_TRYBUT=0.7 i agresja < 0.75 — trybut juz przejety w P3.
    // Przy rw >= PROG_TRYBUT=0.7 i agresja >= 0.75 — P3 nie przejal, wiec trafiamy tu.
    if (
      !rel.stanWojny &&
      !rel.peaceLocked &&
      !rel.hasNapTreaty &&
      stance.willingnessWar > 0 &&
      rw >= effProgWojnaSila &&
      effAgresja >= effProgWojnaAgresja &&
      score < progMinimalnyRelacja
    ) {
      komendy.push({
        type:     'wypowiedz_wojne',
        targetId: rel.partnerId,
        powod:    `wrogie nastawienie (score=${score}, willingnessWar=${stance.willingnessWar.toFixed(2)}), wystarczajaca przewaga (rw=${rw.toFixed(2)}) i effAgresja (${effAgresja.toFixed(2)}): wypowiadamy wojne`,
      });
      continue;
    }

    // ---- Priorytet 5: zaproponuj_sojusz ----
    const aiMilRatio = rw >= 1 ? 99 : rw <= 0 ? 0.01 : rw / (1 - rw);
    const aiRespekt = Math.round(rw * 100);
    const partnerRespekt = Math.round((1 - rw) * 100);
    const sojuszAdj = diplomacyAllianceStrengthAdjust(
      aiMilRatio,
      aiRespekt,
      partnerRespekt,
      dipP,
    );
    const minSojuszAlly = p.progSojusz - sojuszAdj.ease.allyThresholdDelta + sojuszAdj.penaltyAlly - bias.allyThresholdEase;
    const minSojuszScore = diplomacyTreatyMinRelacja(
      dipP.progSojuszRelacja - sojuszAdj.ease.scoreThresholdDelta + sojuszAdj.penaltyScore,
      dipP,
    );
    // D-MP-DYPL Q1 (część 2): dyplomacjaAktywnosc skaluje willingnessAlly (T4=B analogicznie
    // do agresjaMnoznik na effAgresja) -- wyzsza aktywnosc trudnosci = chetniej proponuje sojusz.
    const effWillingnessAlly = Math.min(1, stance.willingnessAlly * dyplomacjaAktywnosc);
    if (
      !rel.stanWojny &&
      !sojuszAdj.hegemonProposerNoAlliance &&
      effWillingnessAlly >= minSojuszAlly &&
      score >= minSojuszScore &&
      rel.relation.zaufanie >= diplomacyAllianceMinZaufanie(sojuszAdj, aiMilRatio, dipP)
    ) {
      const allianceKind: 'defensywny' | 'pelny' =
        rw < 0.45 || stance.willingnessWar < 0.35 ? 'defensywny' : 'pelny';
      komendy.push({
        type:     'zaproponuj_sojusz',
        targetId: rel.partnerId,
        allianceKind,
        powod:    `willingnessAlly=${stance.willingnessAlly.toFixed(2)} (eff=${effWillingnessAlly.toFixed(2)} x aktywnosc=${dyplomacjaAktywnosc.toFixed(2)}) >= prog=${minSojuszAlly.toFixed(2)} (rw=${rw.toFixed(2)}): proponujemy sojusz ${allianceKind}`,
      });
      continue;
    }

    // ---- Priorytet 5b: zaproponuj_umowe_handlowa (E6, Maciej 2026-07-23) ----
    // AI proaktywnie proponuje STALA Umowe Handlowa (RodzajTraktatu.UmowaHandlowa,
    // silnik: diplomacy-proposals.ts) gdy: !stanWojny, brak juz aktywnej umowy z
    // partnerem (rel.hasHandelTreaty), Relacja >= progHandelRelacja (ten sam prog
    // co realny handel), istnieje geometrycznie mozliwe polaczenie tras miedzy
    // miastami obu stron (rel.hasTradeConnection -- dostarczane przez wywolujacego,
    // main.ts; bez tego pola propozycja NIE powstaje) i throttling deterministyczny
    // co N tur per para (PLACEHOLDER N=5, AI_TRADE_AGREEMENT_PROPOSAL_COOLDOWN_TURNS
    // w diplomacy-economy.ts -- do strojenia przez wlasciciela). Gdy Relacja jest
    // blisko progu (w marginesie AI_TRADE_AGREEMENT_SWEETENER_MARGIN, placeholder),
    // AI dokleja drobny jednorazowy oslodzik w zlocie -- uproszczenie
    // computeQuickDealBasket (ktory wymaga introspekcji realnych zasobow per-owner,
    // dostepnej tylko w main.ts, nie w tej czystej funkcji).
    if (
      !rel.stanWojny &&
      !rel.hasHandelTreaty &&
      rel.hasTradeConnection === true &&
      score >= tradeRelMin &&
      canAiProposeTradeAgreement(currentTurnForTrade, rel.lastTradeAgreementProposalTurn)
    ) {
      const closeToThreshold = score < tradeRelMin + AI_TRADE_AGREEMENT_SWEETENER_MARGIN;
      const sweetenerRaw = (aiAllowsTradeAgreementSweetener(difficulty) && closeToThreshold)
        ? capAiGoldOffer(inp.skarbiecGold ?? 0, AI_TRADE_AGREEMENT_SWEETENER_MAX)
        : 0;
      const sweetenerScaled = sweetenerRaw > 0
        ? scaleAiGenerousGoldOffer(sweetenerRaw, difficulty)
        : 0;
      const sweetenerGold = sweetenerScaled > 0 ? sweetenerScaled : undefined;
      komendy.push({
        type:     'zaproponuj_umowe_handlowa',
        targetId: rel.partnerId,
        powod:    `Relacja=${score} >= prog=${tradeRelMin}, polaczenie tras mozliwe, brak aktywnej umowy` +
          (sweetenerGold ? `: dokladamy oslodzik ${sweetenerGold} ¤ (Relacja blisko progu)` : ': proponujemy stala Umowe Handlowa'),
        sweetenerGold,
      });
      continue;
    }

    // ---- Priorytet 6: zaproponuj_handel ----
    // Warunki: !stanWojny, willingnessTrade >= PROG_HANDEL(0.5), handlowosc >= 0.4.
    // Cel: AI proponuje handel gdy relacja co najmniej neutralna i archetyp jest handlowy.
    // dyplomacjaAktywnosc skaluje willingnessTrade analogicznie do sojuszu powyzej.
    const handlowoscBase = inp.handlowosc ?? p.progHandelArchetypeMin;
    const handlowosc = bias.peaceful
      ? Math.min(1, handlowoscBase + 0.15)
      : handlowoscBase;
    const effWillingnessTrade = Math.min(1, stance.willingnessTrade * dyplomacjaAktywnosc);
    const effProgHandel = bias.peaceful ? Math.max(0.3, p.progHandel - 0.08) : p.progHandel;
    const giftTurn = inp.currentTurn ?? 0;
    const giftCooldownOk = canAiProposeOneShotGoldGift(
      giftTurn,
      rel.lastOneShotGiftTurn,
      difficulty,
    );
    const rawTradeGold = capAiGoldOffer(inp.skarbiecGold ?? 0, AI_TRADE_GOLD_MAX);
    const tradeGold = scaleAiGenerousGoldOffer(rawTradeGold, difficulty);
    if (
      !rel.stanWojny &&
      aiAllowsOneSidedGoldGift(difficulty) &&
      giftCooldownOk &&
      tradeGold > 0 &&
      effWillingnessTrade >= effProgHandel &&
      handlowosc >= p.progHandelArchetypeMin &&
      score > tradeRelMin
    ) {
      komendy.push({
        type:     'zaproponuj_handel',
        targetId: rel.partnerId,
        powod:    `willingnessTrade=${stance.willingnessTrade.toFixed(2)} (eff=${effWillingnessTrade.toFixed(2)} x aktywnosc=${dyplomacjaAktywnosc.toFixed(2)}) >= prog=${p.progHandel}, handlowosc=${handlowosc.toFixed(2)} >= 0.4: proponujemy ${tradeGold} ¤`,
        goldOnce: tradeGold,
      });
      continue;
    }

    // ---- Priorytet 7: brak komendy ----
    // Neutralne/przyjazne relacje, niespełnione progi → AI nie interweniuje dyplomatycznie.
  }

  return komendy;
}

/**
 * R-AI-KUP-JEDN (Maciej 2026-07-24, parytet AI): decyzja CZY AI powinno kupić
 * właśnie kolejkowaną jednostkę za złoto (rush), zamiast czekać na dokończenie
 * Pracą. CELOWO zachowawcza -- AI nie roztrwania skarbca:
 *   - tylko gdy jest w stanie wojny z kimkolwiek (presja bojowa uzasadnia rush),
 *   - tylko gdy zostaje bufor >= reserve PO zapłaceniu koszt,
 *   - tylko gdy miasto ma pokrycie Manpower (inaczej zakup i tak by się nie udał),
 *   - tylko raz (maxPerTurn) na turę na ownera -- twardy cap, nie farma złota.
 * Funkcja jest CZYSTA (bez dostępu do main.ts/stanu gry) -- testowalna w izolacji,
 * patrz tools/ai-unit-rush-test.cjs. main.ts wywołuje ją zamiast duplikować logikę.
 */
export function shouldAIRushBuyUnit(inp: {
  atWar: boolean;
  treasury: number;
  reserve: number;
  goldCost: number;
  hasManpower: boolean;
  boughtThisTurn: number;
  maxPerTurn: number;
}): boolean {
  return (
    inp.atWar
    && inp.hasManpower
    && inp.treasury >= inp.reserve + inp.goldCost
    && inp.boughtThisTurn < inp.maxPerTurn
  );
}

/** Difficulty key shared with economy.ts / economy-upkeep.ts (easy/normal/hard). */
type EconDifficulty = 'easy' | 'normal' | 'hard';

/** A raw econ-params.json row: difficulty values plus jednostka/opis metadata. */
type RawAiRushRow = Record<string, number | string | undefined>;

/**
 * Resolved rush-buy thresholds for shouldAIRushBuyUnit (reserve + per-turn cap).
 */
export interface AiRushParams {
  reserve: number;
  maxPerTurn: number;
}

/**
 * R-STAWKI-STROJENIE (2026-07-24): loads the AI-rush thresholds from
 * econ-params.json (globalne.ai_rush_jednostka_rezerwa_zlota /
 * globalne.ai_rush_jednostka_max_na_ture) instead of main.ts constants, so
 * they become data-tunable like every other econ-params value. Robust by
 * design (same pattern as loadEconParams/loadUpkeepParams): any missing/
 * non-numeric row falls back to the previous hardcoded values (100 / 1) so a
 * malformed row can never break a turn.
 */
export function loadAiRushParams(
  raw: { globalne?: Record<string, RawAiRushRow> },
  difficulty: EconDifficulty,
): AiRushParams {
  const g = raw.globalne ?? {};
  const read = (key: string, fallback: number): number => {
    const row = g[key];
    const v   = row ? row[difficulty] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  return {
    reserve:    read('ai_rush_jednostka_rezerwa_zlota', 100),
    maxPerTurn: read('ai_rush_jednostka_max_na_ture',   1),
  };
}

// ---------------------------------------------------------------------------
// R-AI-SUWAKI (decyzja Maciej 2026-07-26, C-AI-SUWAKI=A): dotąd AI siedziało na
// wartościach startowych suwaków (podział świeżej żywności / Pracy / Handlu)
// przez całą partię -- zero odwołań do procentRozwoj/podzialHandlu/podzialPracy
// w tym module. Poniższa funkcja jest CZYSTYM predykatem (wejście: stan
// gospodarki + stan wojny tego ownera, wyjście: docelowe ustawienia trzech
// suwaków), wzorowana na shouldAIRushBuyUnit powyżej -- testowalna bez silnika
// (tools/ai-slider-test.cjs). main.ts (pętla AI per-owner, raz na turę) woła ją
// z getEmpireFoodReserve(ownerId)/isOwnerAtWar(ownerId) i, gdy changed===true,
// zapisuje wynik na WSZYSTKICH miastach tego ownera -- polityka na poziomie
// imperium (AI nie mikrozarządza suwakami per miasto, tak samo jak gracz
// zwykle ustawia je raz dla całego państwa).
// ---------------------------------------------------------------------------

/** Bieżące/docelowe ustawienia trzech suwaków ekonomii AI (wszystkie 0-100 pkt %). */
export interface AiSliderSettings {
  /** Suwak świeżej żywności: % na wzrost miast (reszta -> zapasy armii państwa, city.procentRozwoj). */
  procentRozwoj: number;
  /** Suwak Pracy: % Pracy na kolejkę budynków/jednostek (reszta -> pula państwa, podzialPracy.procentBudynki). */
  procentBudynki: number;
  /** Suwak Handlu: % udziału Nauki (Pieniądz dopełnia do 100, Luksus bez zmian, podzialHandlu.procentNauka). */
  procentNauka: number;
}

/** Wejście heurystyki AI-suwaki: stan gospodarki + stan wojny tego ownera (bez dostępu do silnika). */
export interface AiSliderInputs {
  /** Zapasy żywności PAŃSTWA tego ownera (Żywność, pkt) -- getEmpireFoodReserve(ownerId); może być ujemne (deficyt). */
  zapasyPanstwa: number;
  /** Czy ten owner jest w stanie wojny z kimkolwiek (parytet: isOwnerAtWar(ownerId) w main.ts, barbarzyńcy pominięci). */
  atWar: boolean;
  /** Bieżąca tura gry. */
  turn: number;
  /** Ostatnia tura, w której AI zmieniło którykolwiek z trzech suwaków (null = jeszcze nigdy w tej partii). */
  lastSliderChangeTurn: number | null;
  /** Bieżące ustawienia suwaków tego ownera (wynik poprzedniej korekty lub wartości startowe miasta). */
  current: AiSliderSettings;
  /** Maciej 2026-08-04: pełna cywilizacja AI (nie MP/kopia_typu_obronna). */
  isMajorAi?: boolean;
  /** Early game major — bias wzrost + ulepszenia. */
  isEarlyGame?: boolean;
  /** Skarbiec Pieniądza ownera (pkt) — priorytet utrzymania. */
  treasuryGold?: number;
  /** Szacunkowe utrzymanie budynków+armii (pkt Pieniądz/tura). */
  upkeepGoldCost?: number;
}

/** Nazwane progi/kroki heurystyki AI-suwaki (ładowane z econ-params.json globalne.ai_suwaki_*). */
export interface AiSliderParams {
  /** Próg deficytu zapasów Żywności państwa (Żywność, pkt) -- poniżej AI przesuwa suwak żywności ku armii. */
  deficytZapasowProg: number;
  /** Próg WYRAŹNEJ nadwyżki zapasów Żywności państwa (Żywność, pkt) -- powyżej AI wraca suwakiem ku rozwojowi miast. */
  nadwyzkaZapasowProg: number;
  /** Krok jednej korekty suwaka świeżej żywności (procentRozwoj), pkt % na korektę. */
  krokProcentRozwoj: number;
  /** Krok jednej korekty suwaków Pracy/Handlu (procentBudynki / procentNauka), pkt % na korektę. */
  krokProcentPracaNauka: number;
  /** Minimalny odstęp między kolejnymi korektami suwaków tego ownera, tury (zabezpieczenie przed oscylacją). */
  minOdstepTur: number;
}

/** Wynik heurystyki: docelowe ustawienia + czy cokolwiek się zmieniło w tej turze (cooldown/brak wyzwalacza -> false). */
export interface AiSliderDecision extends AiSliderSettings {
  changed: boolean;
}

/**
 * R-AI-SUWAKI: czysta funkcja decyzyjna AI dla trzech suwaków ekonomii
 * (świeża żywność / Praca / Handel). Reguła zatwierdzona przez właściciela
 * (Maciej 2026-07-26, C-AI-SUWAKI=A):
 *   - zapasy żywności państwa < `deficytZapasowProg` -> suwak żywności w stronę
 *     wyżywienia armii (`procentRozwoj -= krokProcentRozwoj`);
 *   - zapasy żywności państwa > `nadwyzkaZapasowProg` (WYRAŹNA nadwyżka) ->
 *     suwak żywności z powrotem w stronę rozwoju miast (`procentRozwoj += krokProcentRozwoj`);
 *   - wojna (`atWar`) -> więcej Pracy w budynkach/jednostkach
 *     (`procentBudynki += krokProcentPracaNauka`) i mniej Nauki
 *     (`procentNauka -= krokProcentPracaNauka`); pokój -- odwrotnie;
 *   - żadna korekta nie zachodzi częściej niż raz na `minOdstepTur` tur
 *     (zabezpieczenie przed oscylacją suwaka tam-i-z-powrotem co turę) --
 *     liczone WSPÓLNIE dla wszystkich trzech suwaków tego ownera (jeden
 *     `lastSliderChangeTurn`), nie osobno per suwak.
 * Wszystkie wartości suwaków są przycinane do [0, 100]. Testy bez silnika:
 * tools/ai-slider-test.cjs.
 */
export function decideAIEconomySliders(
  inp: AiSliderInputs,
  params: AiSliderParams,
): AiSliderDecision {
  const turnsSinceChange = inp.lastSliderChangeTurn === null
    ? Number.POSITIVE_INFINITY
    : inp.turn - inp.lastSliderChangeTurn;

  let { procentRozwoj, procentBudynki, procentNauka } = inp.current;
  let changed = false;

  // Major early: zawsze max wzrost (procentRozwoj=100) jeśli Spichlerz państwa nie jest
  // ujemny. Nie czekamy na minOdstepTur — między korektami nie można tracić tur na niskie
  // racje. Deficyt żywności (< deficytZapasowProg) nadal obniża suwak w bloku poniżej.
  if (
    inp.isMajorAi
    && inp.isEarlyGame
    && inp.zapasyPanstwa >= params.deficytZapasowProg
    && procentRozwoj < 100
  ) {
    procentRozwoj = 100;
    changed = true;
  }

  if (turnsSinceChange >= params.minOdstepTur) {
    if (inp.zapasyPanstwa < params.deficytZapasowProg) {
      const next = Math.max(0, procentRozwoj - params.krokProcentRozwoj);
      if (next !== procentRozwoj) { procentRozwoj = next; changed = true; }
    } else if (inp.isMajorAi && inp.isEarlyGame) {
      // Major early: max wzrost — nie magazynuj w Spichlerzu państwa kosztem ludności.
      const target = 100;
      if (procentRozwoj < target) { procentRozwoj = target; changed = true; }
    } else if (inp.zapasyPanstwa > params.nadwyzkaZapasowProg) {
      const next = Math.min(100, procentRozwoj + params.krokProcentRozwoj);
      if (next !== procentRozwoj) { procentRozwoj = next; changed = true; }
    }

    // Utrzymanie Pieniądza: gdy skarbiec nie pokrywa kosztów — więcej Handlu→Pieniądz.
    if (
      inp.isMajorAi
      && inp.treasuryGold !== undefined
      && inp.upkeepGoldCost !== undefined
      && inp.treasuryGold < inp.upkeepGoldCost
    ) {
      const nextNauka = Math.max(0, procentNauka - params.krokProcentPracaNauka);
      if (nextNauka !== procentNauka) { procentNauka = nextNauka; changed = true; }
    }

    if (inp.isMajorAi && inp.isEarlyGame) {
      const targetB = AI_MAJOR_EARLY_PROCENT_BUDYNKI;
      if (procentBudynki !== targetB) { procentBudynki = targetB; changed = true; }
    } else if (inp.isMajorAi && !inp.isEarlyGame) {
      const targetB = AI_MAJOR_MID_PROCENT_BUDYNKI;
      if (Math.abs(procentBudynki - targetB) > params.krokProcentPracaNauka) {
        const nextB = procentBudynki > targetB
          ? procentBudynki - params.krokProcentPracaNauka
          : procentBudynki + params.krokProcentPracaNauka;
        if (nextB !== procentBudynki) { procentBudynki = nextB; changed = true; }
      }
    }

    if (inp.atWar) {
      const nextBudynki = Math.min(100, procentBudynki + params.krokProcentPracaNauka);
      if (nextBudynki !== procentBudynki) { procentBudynki = nextBudynki; changed = true; }
      const nextNauka = Math.max(0, procentNauka - params.krokProcentPracaNauka);
      if (nextNauka !== procentNauka) { procentNauka = nextNauka; changed = true; }
    } else if (!inp.isMajorAi || !inp.isEarlyGame) {
      // Pokój: major early NIE obniża procentBudynki (szkodzi ulepszeniom/wzrostowi).
      // Pieniądze: najpierw upkeep budynki+armia — w kryzysie nie zwiększamy Nauki kosztem Pieniądza.
      const moneyCrisis = inp.isMajorAi
        && inp.treasuryGold !== undefined
        && inp.upkeepGoldCost !== undefined
        && inp.treasuryGold < inp.upkeepGoldCost;
      if (!moneyCrisis) {
        const nextBudynki = Math.max(0, procentBudynki - params.krokProcentPracaNauka);
        if (nextBudynki !== procentBudynki) { procentBudynki = nextBudynki; changed = true; }
        const nextNauka = Math.min(100, procentNauka + params.krokProcentPracaNauka);
        if (nextNauka !== procentNauka) { procentNauka = nextNauka; changed = true; }
      }
    }
  }

  return { procentRozwoj, procentBudynki, procentNauka, changed };
}

/**
 * R-AI-SUWAKI: wczytuje progi/kroki z econ-params.json (globalne.ai_suwaki_*),
 * ten sam wzorzec co loadAiRushParams powyżej -- brakujący/niepoprawny wiersz
 * nigdy nie psuje tury (fallback na wartości domyślne poniżej).
 */
export function loadAiSliderParams(
  raw: { globalne?: Record<string, RawAiRushRow> },
  difficulty: EconDifficulty,
): AiSliderParams {
  const g = raw.globalne ?? {};
  const read = (key: string, fallback: number): number => {
    const row = g[key];
    const v   = row ? row[difficulty] : undefined;
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  return {
    deficytZapasowProg:    read('ai_suwaki_deficyt_zywnosc_prog',  0),
    nadwyzkaZapasowProg:   read('ai_suwaki_nadwyzka_zywnosc_prog', 50),
    krokProcentRozwoj:     read('ai_suwaki_krok_zywnosc_rozwoj',   10),
    krokProcentPracaNauka: read('ai_suwaki_krok_praca_nauka',      10),
    minOdstepTur:          read('ai_suwaki_min_odstep_tur',        3),
  };
}
