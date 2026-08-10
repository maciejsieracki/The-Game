/**
 * citizen-resource-upkeep.ts — R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10).
 *
 * Obywatele miast zużywają surowce budowlane per epoka (tabela: `data/citizen-resource-upkeep.json`),
 * ściągane z magazynu CENTRALNEGO imperium (suma City.surowce po wszystkich miastach ownera —
 * `ownerResourceStockAll`, `building-stock-cost.ts`), NIE z lokalnej produkcji/dostępności TEGO
 * miasta (ECHO Q1, `dyspozycje/PYTANIA-OTWARTE.md` 2026-08-10: „Wszystkie potrzebne surowce dla
 * mieszkańców są ściągane z magazynu. Wszystkie potrzebne surowce dla mieszkańców są ściągane z
 * magazynu — miasto nie musi mieć własnej Glinianki ani rzeki”). Kara aktywuje się od 1. tury
 * epoki (ECHO Q1), ale ponieważ dostępność jest civ-wide, a nie lokalna, nie generuje kary
 * niemożliwej-do-uniknięcia z powodu położenia jednego miasta.
 *
 * Kara binarna PER MIASTO (ECHO Q3=A): magazyn centralny > 0 danego surowca = pełne pokrycie
 * (dla KAŻDEGO miasta ownera równocześnie), magazyn = 0 = brak (dla KAŻDEGO miasta ownera
 * równocześnie) — NIE skaluje się z wielkością niedoboru ani z liczbą obywateli tego miasta.
 *
 * AI (duża + Państwa-Miasta) objęte identycznie jak gracz (ECHO Q2=A) — funkcje tu są
 * ownerId-agnostyczne, ten sam wzorzec co `building-stock-cost.ts` (SUROW-CIV-01).
 *
 * / EN: citizens consume construction resources per era (table in
 * `data/citizen-resource-upkeep.json`), drawn from the empire-wide central stockpile (sum of
 * City.surowce across all of the owner's cities), never from this particular city's local
 * production or access. The penalty is binary PER CITY: full coverage if the central stockpile
 * has any (>0) of the resource — applied identically to every city of that owner — none
 * otherwise. It does not scale with the size of the shortfall or with city population. AI
 * (both the large AI and City-States) are covered by the exact same rule as the player — every
 * function here is ownerId-agnostic, mirroring `building-stock-cost.ts` (SUROW-CIV-01).
 *
 * Wzorzec bramki binarnej: `zloto-access.ts` (`ownerCanFeedMennica`/`resolveOwnerZlotoFromStock`).
 * Kanały kary: Szczęście → `HappinessBreakdownInput.citizenResourceHappinessDelta`
 * (`society-breakdown.ts`); Rozwój → `GrowthPercentInput.citizenResourceGrowthPct`
 * (`population-growth-v85.ts`).
 */
import citizenUpkeepTable from '../../data/citizen-resource-upkeep.json';

export interface CitizenUpkeepEraRow {
  epoka: number;
  nazwa: string;
  surowce: string[];
}

interface CitizenUpkeepKaraShape {
  szczescieZaDostepny?: number;
  szczescieZaBrakujacy?: number;
  rozwojPctZaBrakujacy?: number;
}

interface CitizenUpkeepTableShape {
  epoki: CitizenUpkeepEraRow[];
  _kara?: CitizenUpkeepKaraShape;
}

const TABLE = citizenUpkeepTable as unknown as CitizenUpkeepTableShape;
const ROWS: readonly CitizenUpkeepEraRow[] = TABLE.epoki ?? [];

/** Kary — data-driven z JSON (`_kara`), z bezpiecznym fallbackiem na wartości kanonu (2026-08-10). */
export const CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE = TABLE._kara?.szczescieZaDostepny ?? 1;
export const CITIZEN_UPKEEP_HAPPINESS_PER_MISSING = TABLE._kara?.szczescieZaBrakujacy ?? -1;
export const CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING = TABLE._kara?.rozwojPctZaBrakujacy ?? -1;

/**
 * Lista surowców wymaganych przez obywateli w danej epoce (kumulatywna — tabela JSON już
 * niesie pełną listę per epoka, nie trzeba scalać wierszy). `era` < 1 lub bez wpisu →
 * najbliższa zdefiniowana epoka ≤ `era` (a jeśli nie ma żadnej ≤ `era`, pierwsza dostępna).
 */
export function citizenRequiredResourcesForEra(era: number): readonly string[] {
  const first = ROWS[0];
  if (!first) return [];
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  const exact = ROWS.find(r => r.epoka === e);
  if (exact) return exact.surowce;
  const below = [...ROWS].filter(r => r.epoka <= e).sort((a, b) => b.epoka - a.epoka)[0];
  return (below ?? first).surowce;
}

export interface CitizenUpkeepCoverage {
  /** Surowce wymagane w tej epoce (z tabeli, kumulatywne). */
  required: readonly string[];
  /** Surowce spośród `required`, których magazyn centralny imperium ma > 0. */
  available: readonly string[];
  /** Surowce spośród `required`, których magazyn centralny imperium NIE ma (0 lub brak wpisu). */
  missing: readonly string[];
  /** Suma modyfikatora Szczęścia (+1/dostępny, -1/brakujący — data-driven, per miasto). */
  happinessDelta: number;
  /** Suma modyfikatora Rozwoju w punktach % (-1%/brakujący — data-driven, per miasto). */
  growthPctDelta: number;
}

/**
 * Rozstrzyga pokrycie zużycia surowców przez obywateli danego miasta w danej epoce, wg
 * magazynu CENTRALNEGO imperium (nie lokalnego City.surowce tego miasta — ECHO Q1).
 *
 * `empireStock` = `ownerResourceStockAll(cities, ownerId)` (`building-stock-cost.ts`) — TEN SAM
 * magazyn dla każdego miasta danego ownera; wołający powinien liczyć go RAZ per owner per turę
 * (np. `makeOwnerEmpireStockResolver()` w `main.ts`), nie per miasto.
 *
 * Pure — bez mutacji wejść, bez DOM.
 */
export function resolveCitizenResourceCoverage(
  era: number,
  empireStock: Readonly<Record<string, number>> | null | undefined,
): CitizenUpkeepCoverage {
  const required = citizenRequiredResourcesForEra(era);
  const stock = empireStock ?? {};
  const available: string[] = [];
  const missing: string[] = [];
  for (const key of required) {
    const have = stock[key];
    if (typeof have === 'number' && Number.isFinite(have) && have > 0) {
      available.push(key);
    } else {
      missing.push(key);
    }
  }
  const happinessDelta =
    available.length * CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE
    + missing.length * CITIZEN_UPKEEP_HAPPINESS_PER_MISSING;
  const growthPctDelta = missing.length * CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING;
  return { required, available, missing, happinessDelta, growthPctDelta };
}
