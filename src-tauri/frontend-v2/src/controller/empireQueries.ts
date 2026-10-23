/**
 * controller/empireQueries.ts — zapytania reguł suwaków panelu imperium (P5.7, `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`).
 *
 * Zastępuje w `empireDetailPanel.ts` importy `game/cities.ts` (pin `empireDetailPanel.ts:33,36-38`): normalizację
 * i redystrybucję podziału handlu (`normalizePodzialHandlu`, `adjustHandelSplit`) oraz przeliczenie jedynego podziału
 * Pracy (`procentPuliImperiumZBudynkow`, `podzialPracyZProcentuPuli`). Panel nie liczy reguł (P5.13): pyta silnik
 * i formatuje wynik. Zapis wartości = istniejące hooki `onOwnerDefault*Change` (komendy `set_trade_split` /
 * `set_labor_split`, P5-0 §6.5/§7).
 *
 * ZAŁOŻENIE P5.7-Z2 (forma): zapytania SYNCHRONICZNE, jak `diplomacyQueries` (P5.6-Z5) i `buildingCardRules` (P5.4) —
 * panel przelicza suwak w tym samym takcie co zdarzenie `input` (pin). P5-0 §6.5 Z7 przewidywał wariant „UI pokazuje
 * surową wartość, Rust normalizuje po zapisie” z ryzykiem widocznego skoku (`NIE_ZMIERZONO` → P5.14); wariant zapytania
 * zachowuje zachowanie pinu 1:1 (mierzalne harnessem). Transport do Rust (asynchroniczny `invoke` + pamięć podręczna)
 * = `NIE_ZMIERZONO`. Dostawca wstrzykiwany (`installEmpireQueries`); odczyt bez instalacji rzuca jawny błąd.
 */
import type { CityPodzialHandluDto, CityPodzialPracyDto } from '../viewmodel/types';

export interface EmpireQueriesProvider {
  /** Web `adjustHandelSplit(current, changed, newVal)` (`game/cities.ts:640-…`): redystrybucja do sumy 100. */
  adjustHandelSplit(current: CityPodzialHandluDto, changed: keyof CityPodzialHandluDto, newVal: number): CityPodzialHandluDto;
  /** Web `normalizePodzialHandlu(split)` (`game/cities.ts:608-637`): kroki i suma = 100, limit Nauki. */
  normalizePodzialHandlu(split: CityPodzialHandluDto): CityPodzialHandluDto;
  /** Web `procentPuliImperiumZBudynkow(procentBudynki)` (`game/cities.ts:557-559`). */
  procentPuliImperiumZBudynkow(procentBudynki: number | undefined | null): number;
  /** Web `podzialPracyZProcentuPuli(procentPuli)` (`game/cities.ts:562-567`). */
  podzialPracyZProcentuPuli(procentPuli: number | undefined | null): CityPodzialPracyDto;
}

let current: EmpireQueriesProvider | null = null;

export function installEmpireQueries(provider: EmpireQueriesProvider | null): void {
  current = provider;
}

export function hasEmpireQueries(): boolean {
  return current !== null;
}

export function empireQueries(): EmpireQueriesProvider {
  if (current === null) {
    throw new Error('frontend-v2: EmpireQueriesProvider nie zainstalowany (installEmpireQueries przed otwarciem panelu imperium, ZAŁOŻENIE P5.7-Z2)');
  }
  return current;
}

/**
 * Atrapa MOCK: niczego nie liczy (P5.13) — zwraca wejście bez normalizacji (kopia obiektu z jedną zmienioną wartością),
 * pula Pracy = 0, podział Pracy = 100% budynków.
 */
export function createMockEmpireQueries(): EmpireQueriesProvider {
  return {
    adjustHandelSplit: (cur, changed, newVal) => ({ ...cur, [changed]: newVal }),
    normalizePodzialHandlu: (split) => ({ ...split }),
    procentPuliImperiumZBudynkow: () => 0,
    podzialPracyZProcentuPuli: () => ({ procentBudynki: 100 }),
  };
}
