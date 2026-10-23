/**
 * controller/newGameQueries.ts — zapytania kreatora nowej gry (P5.7 r2, `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`).
 *
 * Zastępuje w `newGameFlow.ts` importy logiki z `map/newGameMapDefaults.ts`, `game/start-preview.ts`,
 * `game/civ-matrix-semantic.ts` (pin `newGameFlow.ts:27-48,49,63-70`) oraz regułę dostępności cywilizacji w epoce
 * (pin `:509-521,580-582`, bez importu). Kreator nie liczy reguł (P5.13): pyta silnik o menu skalowane do mapy
 * i epoki (P5-0 §6.10 `menus_by_map_label`), o podgląd startu (zapytanie `new_game_preview`, §6.10) i o profil
 * macierzy cywilizacji (§6.10 `civs[].matrix`). Parametry startu wychodzą jak na pinie — callback `onStart`
 * (komenda `create_session`, P5-0 §7).
 *
 * ZAŁOŻENIE P5.7-Z4 (forma): zapytania SYNCHRONICZNE, jak `empireQueries` (P5.7-Z2) i `diplomacyQueries` (P5.6-Z5) —
 * kreator przelicza menu w tym samym takcie co klik strzałki (pin). Sygnatury = funkcje pinu (wiersze rostera
 * cywilizacji jako dane z katalogu, jak na pinie), żeby wyniki były porównywalne harnessem 1:1. Transport do Rust
 * (asynchroniczny `invoke` + pamięć podręczna) = `NIE_ZMIERZONO`. Dostawca wstrzykiwany (`installNewGameQueries`);
 * odczyt bez instalacji rzuca jawny błąd.
 */
import type {
  CivDefDto,
  CivMatrixProfileDto,
  NewGameMenuBundleDto,
  StartPreviewDto,
  StartPreviewInputDto,
  TypSwiataDto,
  WorldGenerationPresetDto,
} from '../viewmodel/types';

export interface NewGameQueriesProvider {
  /** Web `miastaPanstwaMenuForMapLabel(mapLabel)` (`map/newGameMapDefaults.ts:695-703`). */
  miastaPanstwaMenuForMapLabel(mapLabel: string): NewGameMenuBundleDto;
  /** Web `civTypesMenuForMapLabel(mapLabel, epochId, roster)` (`:724-740`). */
  civTypesMenuForMapLabel(mapLabel: string, epochId: string, roster: readonly CivDefDto[]): NewGameMenuBundleDto;
  /** Web `defaultMiastaPanstwaFromMapLabel(mapLabel)` (`:689-693`). */
  defaultMiastaPanstwaFromMapLabel(mapLabel: string): number;
  /** Web `defaultCivTypesFromMapLabel(mapLabel, epochId, roster)` (`:712-722`). */
  defaultCivTypesFromMapLabel(mapLabel: string, epochId: string, roster: readonly CivDefDto[]): number;
  /** Web `maxCivTypesForStartEpoch(epochId, roster)` (`:543-548`, kaskada D-CYW-EPOKA-WEJSCIA). */
  maxCivTypesForStartEpoch(epochId: string, roster: readonly CivDefDto[]): number;
  /** Web `clampMiastaPanstwaCount(raw)` (`:532-537`, sufit `MAX_MIAST_PANSTWA`). */
  clampMiastaPanstwaCount(raw: number): number;
  /** Web `typSwiataFromMenuLabel(label)` (`:125-128`). */
  typSwiataFromMenuLabel(label: string): TypSwiataDto;
  /** Web `defaultLandFractionPercentForTyp(typ)` (`:464-470`). */
  defaultLandFractionPercentForTyp(typ: TypSwiataDto): number;
  /** Web `worldGenerationPresetFromLabels(labels)` (`:227-242`). */
  worldGenerationPresetFromLabels(labels: { resources: string; rivers: string; desert: string; forest: string; relief?: string }): WorldGenerationPresetDto;
  /** Zapytanie `new_game_preview` = web `buildStartPreview(input)` + `startPreviewSummaryRows` (`game/start-preview.ts:58-128`). */
  buildStartPreview(input: StartPreviewInputDto): StartPreviewDto;
  /** §6.10 `civs[].matrix` = web `buildCivMatrixSemanticProfile(civKey)` (`game/civ-matrix-semantic.ts:531-572`) z gotowymi tekstami. */
  civMatrixProfile(civKey: string): CivMatrixProfileDto;
  /**
   * §6.10 `civs[].available_at_epoch`: czy cywilizacja (jej `epokiStartowe` z katalogu) jest dostępna przy starcie
   * w epoce `epochId` — reguła pinu `newGameFlow.ts:509-521,580-582` (najwcześniejsza epoka startu ≤ wybrana).
   */
  civAvailableAtEpoch(epokiStartowe: readonly string[], epochId: string): boolean;
}

let current: NewGameQueriesProvider | null = null;

export function installNewGameQueries(provider: NewGameQueriesProvider | null): void {
  current = provider;
}

export function hasNewGameQueries(): boolean {
  return current !== null;
}

export function newGameQueries(): NewGameQueriesProvider {
  if (current === null) {
    throw new Error('frontend-v2: NewGameQueriesProvider nie zainstalowany (installNewGameQueries przed otwarciem kreatora, ZAŁOŻENIE P5.7-Z4)');
  }
  return current;
}

/**
 * Atrapa MOCK: niczego nie liczy (P5.13) — jedna opcja menu „MOCK”, stałe liczby, pusty profil macierzy, każda
 * cywilizacja dostępna; podgląd startu oznaczony „MOCK”.
 */
export function createMockNewGameQueries(): NewGameQueriesProvider {
  const bundle = (): NewGameMenuBundleDto => ({ opts: ['1'], descs: ['MOCK'], domyslny: 0 });
  return {
    miastaPanstwaMenuForMapLabel: bundle,
    civTypesMenuForMapLabel: bundle,
    defaultMiastaPanstwaFromMapLabel: () => 1,
    defaultCivTypesFromMapLabel: () => 1,
    maxCivTypesForStartEpoch: () => 1,
    clampMiastaPanstwaCount: (raw) => raw,
    typSwiataFromMenuLabel: () => 'kontynenty',
    defaultLandFractionPercentForTyp: () => 50,
    worldGenerationPresetFromLabels: () => ({ resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' }),
    buildStartPreview: (input) => ({
      summaryRows: [['MOCK', 'MOCK']],
      playerCivId: input.playerCivId,
      playerCapitalName: 'MOCK-Stolica',
      sameTypeRivalNames: [],
      sameTypeRivalCount: 0,
      activeTypesOnMap: 1,
      foreignTypesCount: 0,
      modelLine: 'MOCK',
      modelDetail: 'MOCK',
    }),
    civMatrixProfile: (civKey) => ({
      civilizationId: civKey, civilizationName: 'MOCK', parameterCount: 0, activeCount: 0, inactiveCount: 0, cells: [],
    }),
    civAvailableAtEpoch: () => true,
  };
}
