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
import { hexDistance, computePath, keyOf } from '../units/setup';
import type { City }       from './cities';
import { canFoundCity }    from './cities';
import type { ImprovementKey } from '../render/improvements';
import type { TerritoryNode } from '../map/territory';
import { cityTerritoryRadius } from '../map/territory';
import {
  epochGateMet,
  epochTierGateMet,
  researchGatesMet,
  type ResearchBuildingGate,
} from './research';
import { buildImprovementQualifier, type ImprovementBuildState } from '../map/improvement-build';
import { hexKeysWithinRadius } from './okolica';
import { getImprovementMeta, isImprovementTechUnlocked } from './improvement-tech';

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

/** Found a city at the unit's current position. */
export interface AICmdFoundCity {
  type: 'foundCity';
  unitId: string;
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
  | AICmdFoundCity
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
   * Budget gate (pkt5): called by the engine with (cityId, buildingId).
   * When provided, only candidates for which canAfford returns true are considered.
   * If ALL candidates fail the gate, AI skips production (saves/waits) — never builds over budget.
   * When omitted -> no filtering (present behaviour preserved).
   */
  canAfford?: (cityId: string, buildingId: string) => boolean;
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
   * Silnik: czy AI (playerId) może prowadzić walkę z ownerId celu.
   * main.ts ustawia: gracz (0) tylko przy status 'wojna' — bez tego miasta-państwa
   * atakowały zwiadowcę przy PRZYJAZNY/neutralni (bug 2026-07-21).
   * Gdy brak — brak filtra (testy lane / stare save).
   */
  canEngageOwner?: (targetOwnerId: number) => boolean;
}

/** Bramka walki AI — domyślnie przepuszcza (testy bez silnika). */
function aiCanEngageOwner(opts: AITurnOpts, targetOwnerId: number): boolean {
  return opts.canEngageOwner ? opts.canEngageOwner(targetOwnerId) : true;
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
    bonusNauka:        getAiParam(data, `trudnosc_poziom${n}_bonus_nauka`,         n === 1 ? 0 : n === 2 ? 1   : 0),
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
  if (unlocksGranary && !allBuilt.has('Spichlerz')) score += 120;
  if (unlocksCegielnia && !allBuilt.has('Cegielnia')) score += 80;

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

  // Mury (walls): high under threat
  if (unlocks.includes('mury')) {
    score += underThreat ? 110 : 30;
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
// Terrain yield heuristic (city founding -- Spec-AI §3.3)
// ---------------------------------------------------------------------------

/** Score a candidate hex for city founding per ai-params.json §3.3 heuristic. */
function hexCityScore(
  hex: Hex,
  q: number,
  r: number,
  data: GameData,
  enemyCities: AICity[],
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
    trade = (rawRow['Handel']    as number | null) ?? 0;
  }

  let score = 0;
  if (food  >= 3) score += foodPts;
  if (work  >= 2) score += workPts;
  if (trade >= 1) score += tradePts;
  if (hex.rzeka.obecna) score += riverPts;

  // Resource overlay bonus (ore, clay = settlement value)
  if (hex.nakladka === Nakladka.ZlozeGliny || hex.nakladka === Nakladka.ZlozeRudy) {
    score += resPts;
  }

  // Enemy proximity penalty: < 5 hexes from any enemy city
  const enemyThresh = getAiParam(data, 'ekspansja_zagroz_zasieg', 5);
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

/**
 * Returns the id of the building or unit this city should build next.
 * Priority based on Spec-AI §4 and archetype modifiers.
 * Returns null if nothing can be queued.
 */
function chooseCityProduction(
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

  // Threat check: any enemy within threat range of this city
  const threatRange  = getAiParam(data, 'ekspansja_zagroz_zasieg', 5);
  const enemyUnits   = allUnits.filter(u => u.ownerId !== playerId);
  const underThreat  = enemyUnits.some(
    eu => hexDistance(city.q, city.r, eu.q, eu.r) <= threatRange,
  );

  // Base scores for each category (higher = higher priority)
  // Archetype delta: +/- 20 per unit of mod
  // Difficulty bonus: bonusProdukcja scales economy score (higher difficulty = more efficient AI)
  const diffProdBonus = Math.round(difficultyParams.bonusProdukcja * 200); // e.g. +10% -> +20 pts, +25% -> +50 pts
  const economyScore  = 100 + mods.ekonomia * 20 + diffProdBonus;
  const militaryScore = 100 + mods.wojsko   * 20;
  const defenseScore  = 100 + mods.obrona   * 20;

  const candidates: { id: string; score: number }[] = [];

  // Państwa-kopie (kopia_typu_obronna) NIGDY nie zakładają miast (brak Osadnika/foundCity —
  // patrz opts.defensiveCopy niżej), więc myCities.length pozostaje = 1 na zawsze. Bez tego
  // wyjątku "earlyPhase" (myCities.length<3) byłoby wieczne — miasto-kopia utknęłoby na
  // Wojowniku+Murach+Spichlerzu i NIGDY nie odblokowałoby Koszar ani budynków gospodarczych
  // (Tartak/Cegielnia/Huta/Magazyn/Targowisko) z gałęzi "else" niżej. Traktujemy je więc tak,
  // jakby "wyrosły" z fazy startowej mimo posiadania jednego miasta — bez tego są trwale
  // biernym łupem zamiast rozwijać się jak normalne miasto AI. Zero bonusu liczbowego:
  // dostają dokładnie tę samą listę kandydatów budowy co każde inne miasto AI w fazie mid-game.
  const earlyPhase = myCities.length < 3 && !opts.defensiveCopy;

  // §4.3 Under threat: walls first, then guard
  if (underThreat) {
    if (!built.includes('Mury')) {
      candidates.push({ id: 'Mury', score: 300 + defenseScore });
    }
    candidates.push({ id: 'Wojownik', score: 280 + militaryScore });
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
    if (!built.includes('Mury')) {
      candidates.push({ id: 'Mury', score: 320 + defenseScore });
    }
    // Spichlerz dopisany tu (a nie w gałęzi early-phase §4.1, bo defensiveCopy nigdy tam nie
    // trafia — patrz earlyPhase wyżej) — TA SAMA pozycja/score co dla normalnego miasta AI
    // w fazie startowej (250), żeby nie zaburzyć kolejności względem Mury/Wojownik powyżej ani
    // względem budynków gospodarczych z gałęzi "else" niżej. Bez tego defensiveCopy nigdy nie
    // zobaczyłoby Spichlerza (brak wpływu na zwykłe AI — ta gałąź działa tylko gdy defensiveCopy).
    if (!built.includes('Spichlerz')) {
      candidates.push({ id: 'Spichlerz', score: 250 });
    }
  }

  if (earlyPhase) {
    // §4.1 Early phase
    if (!built.includes('Spichlerz')) {
      candidates.push({ id: 'Spichlerz', score: 250 });
    }
    // Settler if < 3 cities (państwa-kopie nigdy nie ekspandują)
    if (myCities.length < 3 && !opts.defensiveCopy) {
      candidates.push({ id: 'Osadnik', score: 200 });
    }
    // Defensive unit if city is unguarded
    const cityGuard = allUnits.filter(
      u => u.ownerId === playerId && hexDistance(u.q, u.r, city.q, city.r) <= 1,
    );
    if (cityGuard.length === 0) {
      candidates.push({ id: 'Wojownik', score: 190 + militaryScore });
    }
    candidates.push({ id: 'Lucznik',   score: 180 + militaryScore });
  } else {
    // §4.2 Mid phase
    if (!built.includes('Koszary')) {
      candidates.push({ id: 'Koszary', score: 200 + militaryScore });
    }
    candidates.push({ id: 'Wojownik',  score: 170 + militaryScore });
    candidates.push({ id: 'Lucznik',   score: 165 + militaryScore });

    for (const b of ['Tartak', 'Cegielnia', 'Huta', 'Magazyn', 'Targowisko']) {
      if (!built.includes(b)) {
        candidates.push({ id: b, score: 140 + economyScore });
      }
    }
    if (!opts.defensiveCopy) candidates.push({ id: 'Osadnik', score: 100 });
  }

  // §4.4 Filter out buildings already built (units can be built multiple times)
  const buildingNames = new Set(data.buildings.map(b => b.nazwa));
  const available = candidates.filter(c => {
    if (buildingNames.has(c.id) && built.includes(c.id)) return false;
    return true;
  });

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
// Terrain improvements (D-IMPROVEMENTS): AI buduje ulepszenia terenu
// ---------------------------------------------------------------------------

/**
 * Kolejność priorytetów AI (Maciej ABC -- PRÓG DO AKCEPTACJI): plony pierwsze
 * (farma/pastwiska/tarasy/łowiectwo/rybołówstwo), potem surowce/rzemiosło,
 * na końcu infrastruktura (droga/fort). `wyrab` CELOWO pominięty -- złożony
 * stan wieloturowy (hexClearingStates w main.ts), poza zakresem AI na tym
 * etapie (Maciej decyzja 5). Stała lista -- zero Math.random(), determinizm A=B.
 */
const AI_IMPROVEMENT_PRIORITY: readonly ImprovementKey[] = [
  'farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie',
  'irygacja', 'kopalnia', 'kopalnia_miedzi', 'kamieniolom', 'glinianka', 'stadnina',
  'warzelnia_soli', 'tartak', 'posterunek', 'droga', 'droga_brukowana', 'fort',
];

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
  if (myCities.length === 0) return [];
  const territoryNodes = opts.territoryNodes;
  if (!territoryNodes) return []; // silnik nie dostarczył danych -- bezpieczny no-op

  let pracaLeft = opts.pracaAvailable ?? 0;
  if (pracaLeft <= AI_IMPROVEMENT_PRACA_SURPLUS) return [];

  const researchedTechs = opts.improvementTechs ?? new Set<string>();
  const civArchetype = opts.civType;
  const civEra = opts.civEra ?? 1;

  // Kopia robocza placedImprovements -- MUTOWANA w trakcie planowania tej funkcji,
  // żeby dwa miasta TEGO SAMEGO AI (zasięgi terytorium mogą się nakładać) nie
  // "wybrały" niezależnie tego samego heksa+typu w jednej turze (qualifies() czyta
  // ten stan na bieżąco przy każdym wywołaniu -- patrz getHexLayers w
  // improvement-build.ts). Referencja przekazana do buildImprovementQualifier jest
  // ta sama -- mutacje w trakcie pętli miast są od razu widoczne kolejnym wywołaniom.
  const workingPlaced = new Map<string, string[]>();
  if (opts.placedImprovements) {
    for (const [hk, v] of opts.placedImprovements) {
      workingPlaced.set(hk, Array.isArray(v) ? [...v] : [v]);
    }
  }

  const state: ImprovementBuildState = {
    map,
    cityNodes: myCities.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })),
    territoryNodes,
    playerOwnerIdNum: ownerId,
    placedImprovements: workingPlaced,
    researchedTechs,
    playerCivArchetype: civArchetype,
    playerEra: civEra,
  };
  const qualifies = buildImprovementQualifier(state);

  const orderedCities = [...myCities].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const commands: AICmdBuildImprovement[] = [];

  for (const city of orderedCities) {
    if (pracaLeft <= AI_IMPROVEMENT_PRACA_SURPLUS) break; // budżet wyczerpany -- reszta miast czeka

    const radius = cityTerritoryRadius({ q: city.q, r: city.r, pop: city.population, level: 1 }) + 1;
    const candidateHexes = hexKeysWithinRadius(city.q, city.r, radius, map)
      .map(k => {
        const [qs, rs] = k.split(',');
        return { q: Number(qs), r: Number(rs) };
      })
      .sort((a, b) => (a.q - b.q) || (a.r - b.r));

    for (const key of AI_IMPROVEMENT_PRIORITY) {
      const meta = getImprovementMeta(key);
      if (!meta) continue;
      if (meta.kosztPraca > pracaLeft) continue;
      if (!isImprovementTechUnlocked(key, researchedTechs)) continue;

      let placed = false;
      for (const { q, r } of candidateHexes) {
        if (!qualifies(key, q, r)) continue;
        commands.push({ type: 'buildImprovement', ownerId, q, r, key });
        pracaLeft -= meta.kosztPraca;
        const hexKey = `${q},${r}`;
        const cur = workingPlaced.get(hexKey) ?? [];
        workingPlaced.set(hexKey, [...cur, key]);
        placed = true;
        break;
      }
      if (placed) break; // maks. 1 ulepszenie / miasto / turę
    }
  }

  return commands;
}

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

/** True if unit is a settler (category osadnik). */
function isSettler(unit: RuntimeUnit): boolean {
  return unit.category === 'osadnik';
}

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

  // (archetyp + trudność policzone na górze funkcji — wspólne dla obu ścieżek)
  const minCityDist = getAiParam(data, 'ekspansja_min_dystans_miast', 5);

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
  // Sort: super first, then military, then settlers
  // -------------------------------------------------------------------------
  const sortedUnits = [...myUnits].sort((a, b) => {
    const superA = a.category === 'super' ? 0 : 1;
    const superB = b.category === 'super' ? 0 : 1;
    if (superA !== superB) return superA - superB;
    const milA = isSettler(a) ? 1 : 0;
    const milB = isSettler(b) ? 1 : 0;
    return milA - milB;
  });

  // Track which units received at least one action command this turn (for fallback).
  const unitActed = new Set<string>();

  for (const unit of sortedUnits) {
    const cmdsBefore = commands.length;

    // Settlers — faza 2 dopiero po konsolidacji klastra
    if (isSettler(unit)) {
      if (clusterConsolidationPhase) {
        applyIdleFallback(unit, map, myCities, units, commands);
        if (commands.length > cmdsBefore) unitActed.add(unit.id);
        continue;
      }

      const { ok: canFound } = canFoundCity(unit.q, unit.r, cities, map);
      if (canFound) {
        commands.push({ type: 'foundCity', unitId: unit.id });
        unitActed.add(unit.id);
        continue;
      }

      const bestTarget = findSettlerTarget(unit, map, cities, enemyCities, data, minCityDist, opts);
      if (bestTarget !== null) {
        const step = firstStep(unit, map, bestTarget.q, bestTarget.r, units);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
          unitActed.add(unit.id);
        }
      }
      // Settler fallback (4f) below — fall through to shared fallback block
      if (commands.length > cmdsBefore) continue;

      // Settler idle fallback: move toward nearest own city or map center
      applyIdleFallback(unit, map, myCities, units, commands);
      if (commands.length > cmdsBefore) unitActed.add(unit.id);
      continue;
    }

    // Military
    if (unit.ruchLeft <= 0) continue;

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

    // 4c: march toward enemy city — faza 1: najpierw państwa w klastrze, potem reszta
    const citiesForMarch = clusterConsolidationPhase && clusterEnemyCities.length > 0
      ? clusterEnemyCities
      : engageableEnemyCities;
    const targetCity = (() => {
      if (citiesForMarch.length === 0) return undefined;
      if (difficultyParams.celObranie <= 0) {
        return nearest(unit.q, unit.r, citiesForMarch, c => c.q, c => c.r);
      }
      let bestScore = -Infinity;
      let bestCity: typeof citiesForMarch[0] | undefined;
      for (const ec of citiesForMarch) {
        const dist = hexDistance(unit.q, unit.r, ec.q, ec.r);
        const popPenalty = difficultyParams.celObranie * (10 / Math.max((ec as { population?: number }).population ?? 2, 1));
        const score = -dist + popPenalty;
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
    const villageTarget = findNearestVillage(unit, map, playerId);
    if (villageTarget !== null) {
      const step = firstStep(unit, map, villageTarget.q, villageTarget.r, units);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        unitActed.add(unit.id);
        continue;
      }
    }

    // 4e: patrol near own city (§2.1 priority 4)
    if (myCities.length > 0) {
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
  // Jednostki sióstr (ten sam klaster/typ) nigdy nie liczą się jako "wróg" zagrażający innej
  // siostrze — bez tego wędrujący własny garnizon sąsiedniej siostry fałszywie wyzwalałby
  // posiłki co turę. Dyplomacja poza tym nierozszerzana (zgodnie z poleceniem).
  const sisterOwnerIds = new Set(sisterCityStates.map(s => s.ownerId));
  const nonSisterEnemyUnits = engageableEnemyUnits.filter(eu => !sisterOwnerIds.has(eu.ownerId));

  // Garnizon startowy per miasto (jednostki własne w promieniu 1) — migawka sprzed ruchów
  // w tej turze; wystarcza jako brama "nadwyżki", bo RESUP_MAX_PER_TURN=1 i tak ogranicza
  // wysyłkę do najwyżej jednej jednostki z danego miasta-źródła w tej turze.
  const homeGuardCount = new Map<string, number>();
  for (const city of myCities) {
    homeGuardCount.set(
      city.id,
      myUnits.filter(u => !isSettler(u) && hexDistance(u.q, u.r, city.q, city.r) <= 1).length,
    );
  }

  let reinforcementsSentThisTurn = 0;

  for (const unit of myUnits) {
    if (isSettler(unit)) continue;
    if (unit.ruchLeft <= 0) continue;

    const adjacentEnemy = engageableEnemyUnits.find(
      eu => isAdjacent(unit.q, unit.r, eu.q, eu.r),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    let moved = false;
    for (const city of myCities) {
      const threat = engageableEnemyUnits.find(
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
 */
function findSettlerTarget(
  settler: RuntimeUnit,
  map: GameMap,
  allCities: AICity[],
  enemyCities: AICity[],
  data: GameData,
  minCityDist: number,
  opts: AITurnOpts = {},
): { q: number; r: number } | null {
  let bestScore = -Infinity;
  let bestHex: { q: number; r: number } | null = null;

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;

    const t = hex.terenBazowy as string;
    if (t === 'morze' || t === 'wybrzeze' || t === 'gory') continue;

    const { q, r } = hex.coords;

    const tooClose = allCities.some(c => hexDistance(q, r, c.q, c.r) < minCityDist);
    if (tooClose) continue;

    let score = hexCityScore(hex, q, r, data, enemyCities);

    // pkt3: cluster bias — prefer hexes inside clusterCenter+clusterRadius
    // Faza 2: po konsolidacji klastra — nadal preferuj wnętrze regionu.
    if (opts.clusterCenter !== undefined && opts.clusterRadius !== undefined) {
      const distToCenter = hexDistance(q, r, opts.clusterCenter.q, opts.clusterCenter.r);
      if (distToCenter <= opts.clusterRadius) {
        score += 50; // strong bonus for hexes inside the cluster
      } else {
        score -= 20; // mild penalty for hexes outside the cluster
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestHex = { q, r };
    }
  }

  // Suppress unused-variable lint: settler is kept in signature for symmetry with opts
  void settler;

  return bestHex;
}

// ---------------------------------------------------------------------------
// Helper: nearest neutral village
// ---------------------------------------------------------------------------

/**
 * Returns the nearest hex with an unclaimed village (wioska.istnieje &&
 * wlasciciel === null), or null if none found.
 */
function findNearestVillage(
  unit: RuntimeUnit,
  map: GameMap,
  playerId: number,
): { q: number; r: number } | null {
  let bestDist = Infinity;
  let bestHex: { q: number; r: number } | null = null;

  const playerStr = String(playerId);

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (!hex.wioska.istnieje) continue;
    // Skip if owned by anyone (including this player)
    if (hex.wlasciciel !== null) continue;

    const { q, r } = hex.coords;
    const d = hexDistance(unit.q, unit.r, q, r);
    if (d < bestDist) {
      bestDist = d;
      bestHex = { q, r };
    }
  }

  // Suppress unused-variable warning: playerStr used in condition above implicitly
  void playerStr;

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
  | { type: 'oferuj_trybut_za_pokoj'; targetId: string; powod: string }
  | { type: 'zaproponuj_sojusz';     targetId: string; powod: string }
  | { type: 'zaproponuj_handel';     targetId: string; powod: string };

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
export function loadDefaultAIDiplomacyProgs(): DiplomacjaParams {
  const dip = getEffectiveDiplomacyParams();
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
 * Priorytety 5 (zaproponuj_sojusz) i 6 (zaproponuj_handel) zaimplementowane ponizej
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
): AIDiplomacyCommand[] {
  if (!inp?.relacje?.length) return [];

  const p: DiplomacjaParams = {
    ...loadDefaultAIDiplomacyProgs(),
    ...params,
  };

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

    // Stub gracza AI – aiDiplomacyStance wymaga Player, ale korzysta tylko z typCywilizacji.
    // Używamy objektu z typCywilizacji = 'grecy' jako bezpiecznego domyślnego (archetype neutral).
    // Silnik v0.2 może podać pełny obiekt Player przez param.
    const stubAIPlayer  = { typCywilizacji: 'grecy' as unknown } as Parameters<typeof aiDiplomacyStance>[0];
    const stubOtherPlayer = { typCywilizacji: 'rzym' as unknown } as Parameters<typeof aiDiplomacyStance>[1];

    const stance = aiDiplomacyStance(stubAIPlayer, stubOtherPlayer, rel.relation, ctx);
    const score  = relationScore(rel.relation);
    const { progMinimalnyRelacja } = getEffectiveDiplomacyParams();
    // Efektywna agresja z uwzglednieniem mnoznika trudnosci (T4=B: spryt AI)
    const effAgresja = Math.min(1, inp.agresja * agresjaMnoznik);

    // ---- Priorytet 1: oferuj_trybut_za_pokoj (b. słaby w trakcie wojny) ----
    if (rel.stanWojny && rw <= p.progTrybutKrytyczny) {
      komendy.push({
        type:     'oferuj_trybut_za_pokoj',
        targetId: rel.partnerId,
        powod:    `krytyczna slabosz w wojnie (respektWzgledny=${rw.toFixed(2)}): oferujemy trybut za pokoj`,
      });
      continue;
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

    // ---- Priorytet 3: zadaj_trybut (b. silny, !stanWojny, agresja srednia; preferable over war) ----
    const dipTrybut = getEffectiveDiplomacyParams();
    const proposerRespektPct = Math.round(100 * rw);
    if (
      !rel.stanWojny
      && proposerRespektPct > dipTrybut.progTrybutZadanieMinRespekt
      && effAgresja >= p.progWojnaAgresja * 0.5
      && effAgresja < p.progTrybutAgresjaMax
    ) {
      komendy.push({
        type:     'zadaj_trybut',
        targetId: rel.partnerId,
        powod:    `Respekt ${proposerRespektPct} > ${dipTrybut.progTrybutZadanieMinRespekt}, srednia agresja (effAgresja=${effAgresja.toFixed(2)} < 0.75): zadamy trybut zamiast wojny`,
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
      stance.willingnessWar > 0 &&
      rw >= p.progWojnaSila &&
      effAgresja >= p.progWojnaAgresja &&
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
    const dipP = getEffectiveDiplomacyParams();
    const aiMilRatio = rw >= 1 ? 99 : rw <= 0 ? 0.01 : rw / (1 - rw);
    const aiRespekt = Math.round(rw * 100);
    const partnerRespekt = Math.round((1 - rw) * 100);
    const sojuszAdj = diplomacyAllianceStrengthAdjust(
      aiMilRatio,
      aiRespekt,
      partnerRespekt,
      dipP,
    );
    const minSojuszAlly = p.progSojusz - sojuszAdj.ease.allyThresholdDelta + sojuszAdj.penaltyAlly;
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
      komendy.push({
        type:     'zaproponuj_sojusz',
        targetId: rel.partnerId,
        powod:    `willingnessAlly=${stance.willingnessAlly.toFixed(2)} (eff=${effWillingnessAlly.toFixed(2)} x aktywnosc=${dyplomacjaAktywnosc.toFixed(2)}) >= prog=${minSojuszAlly.toFixed(2)} (rw=${rw.toFixed(2)}): proponujemy sojusz`,
      });
      continue;
    }

    // ---- Priorytet 6: zaproponuj_handel ----
    // Warunki: !stanWojny, willingnessTrade >= PROG_HANDEL(0.5), handlowosc >= 0.4.
    // Cel: AI proponuje handel gdy relacja co najmniej neutralna i archetyp jest handlowy.
    // dyplomacjaAktywnosc skaluje willingnessTrade analogicznie do sojuszu powyzej.
    const handlowosc = inp.handlowosc ?? p.progHandelArchetypeMin;
    const effWillingnessTrade = Math.min(1, stance.willingnessTrade * dyplomacjaAktywnosc);
    if (
      !rel.stanWojny &&
      effWillingnessTrade >= p.progHandel &&
      handlowosc >= p.progHandelArchetypeMin &&
      score > p.progHandelRelacjaMin
    ) {
      komendy.push({
        type:     'zaproponuj_handel',
        targetId: rel.partnerId,
        powod:    `willingnessTrade=${stance.willingnessTrade.toFixed(2)} (eff=${effWillingnessTrade.toFixed(2)} x aktywnosc=${dyplomacjaAktywnosc.toFixed(2)}) >= prog=${p.progHandel}, handlowosc=${handlowosc.toFixed(2)} >= 0.4: proponujemy handel`,
      });
      continue;
    }

    // ---- Priorytet 7: brak komendy ----
    // Neutralne/przyjazne relacje, niespełnione progi → AI nie interweniuje dyplomatycznie.
  }

  return komendy;
}
