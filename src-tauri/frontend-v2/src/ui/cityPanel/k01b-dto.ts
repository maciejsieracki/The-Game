/**
 * K01B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 1): typy DTO i stale zastepujace
 * importy z gra/src/{data,game,map,render} dla 57 odroczonych jednostek K01 (pin edb8fb56,
 * gra/src/ui/cityPanel.ts). Modul NIE importuje logiki gry (regula P5.13).
 *
 * ZALOZENIA K01B (rozstrzygniete w dyspozycje/rust-port/p5/P5-8-K01B.md, nie pytania):
 * - K01B-Z1: typy obiektowe z `game/` / `data/` (ProductionItem, CityProduction, BuildingDef,
 *   GameData, City, GrowthPercentBreakdown, EmpireFoodTick) -> lokalne, wezsze DTO tej warstwy
 *   (`*K`). Pola = dokladnie te, ktore czytaja jednostki pinu; reszta pominieta. Mapowanie z
 *   `viewmodel/types.ts` robi kontroler (nie ten modul).
 * - K01B-Z2: stale etykiet (PODZIAL_PRACY_*, CITY_PANEL_RANGE_DEPOSIT_LABELS, 'Podatek') sa
 *   kopia wartosci z pinu (gra/src/game/cities.ts:535-539, gra/src/game/resource-access.ts:243-247,
 *   gra/src/game/danina-nazwa.ts:15). Gate zgodnosci wartosci: NIE_ZMIERZONO w tej rundzie.
 * - K01B-Z3: REGULY (R) nie sa liczone w UI. Wywolania reguł (etaTurns, buildingEffectAtLevel,
 *   stockResourceLabel, rationy, bonusy mnoznikow, growthGainPerTurnSlots, ...) ida przez port
 *   `CityPanelRulesPort` w `k01b-reguly.ts`, wstrzykiwany przez kontroler.
 */
import type { CitizenUpkeepCoverageDto, SocietyLineDto, UnitDefDto } from '../../viewmodel/types';

/* ----------------------------------------------------------------- produkcja */

export type ProductionKindK = 'budynek' | 'jednostka';

/** Podzbior `ProductionItem` (gra/src/game/production.ts) czytany przez jednostki K01B. */
export type ProductionItemK = {
  kind: ProductionKindK;
  id: string;
  nazwa?: string;
  koszt: number;
  postep?: number;
};

/** Podzbior `CityProduction` (gra/src/game/production.ts) — kolejka budowy i rekrutacji. */
export type CityProductionK = {
  kolejka: ProductionItemK[];
  postep: number;
  wstrzymana?: boolean;
  rekrutacja?: ProductionItemK[];
};

/* ------------------------------------------------------------- budynki/dane */

export type YieldKeyK = 'praca' | 'pieniadz' | 'zywnosc' | 'nauka' | 'kultura' | 'zadowolenie' | 'obrona';

/** Podzbior `BuildingDef` (gra/src/data/loader.ts) czytany przez jednostki K01B. */
export type BuildingDefK = {
  id: string;
  nazwa?: string;
  upgradeFrom?: string;
  maksPoziom: number;
  baza: Partial<Record<YieldKeyK, number>>;
  przyrost: Partial<Record<YieldKeyK, number>>;
};

/** Podzbior `GameData` (gra/src/data/loader.ts): katalogi budynkow i jednostek. */
export type GameDataK = {
  readonly buildings: readonly BuildingDefK[];
  readonly units: readonly UnitDefDto[];
};

/** Jednostka do ikon/medalionow — kontrakt z `viewmodel/types.ts` (UnitDefDto). */
export type UnitDefK = UnitDefDto;

/* ---------------------------------------------------------------- miasto */

/** Minimalna referencja do miasta (pin: `City`, gra/src/game/cities.ts:834). */
export type CityRefK = { readonly id?: string };

/** Pin: `City & { podzialHandlu?, podzialPracy? … }` (ui/cityPanel.ts:994-1000). */
export type CityWithSlidersK = CityRefK & {
  podzialHandlu?: { procentPieniadz: number; procentNauka: number; procentLuksus: number };
  podziałHandlu?: { procentPieniadz: number; procentNauka: number; procentLuksus: number };
  podzialPracy?: { procentBudynki: number };
  podziałPracy?: { procentBudynki: number };
};

/** Pin: `PoziomRacji = number` (gra/src/game/population-growth-v85.ts:25). */
export type PoziomRacjiK = number;

/** Pin: `GrowthPercentBreakdown` (gra/src/game/population-growth-v85.ts:216-226). */
export type GrowthPercentBreakdownK = {
  total: number;
  racje: number;
  maleMiasto: number;
  spichlerz: number;
  zdrowie: number;
  szczescie: number;
  cywilizacja: number;
  zaopatrzenie: number;
};

/** Pin: `EmpireFoodTick` — tylko pole czytane przez `resolveCityFedForUi`. */
export type EmpireFoodTickK = {
  readonly perCityRows?: readonly { readonly cityId: string; readonly nakarmione?: boolean }[];
};

/** Parametry wyzywienia — nieprzezroczyste dla UI (zwracane przez port reguł). */
export type RationParamsK = unknown;

/** Pin: `porPctBand` (gra/src/game/society-breakdown.ts) — pasmo porzadku jako wartosc DTO. */
export type OrderBandK = 'lad' | 'spokoj' | 'napiecie' | 'niepokoj' | 'bunt' | 'bunt_skrajny';

export type SocietyLineK = SocietyLineDto;
export type CitizenUpkeepK = CitizenUpkeepCoverageDto;

/* ------------------------------------------------------------ stale etykiet */

/** Pin: `PODZIAL_PRACY_PULA_LBL` (gra/src/game/cities.ts:535). */
export const PODZIAL_PRACY_PULA_LBL = 'Ulepszenia (pula)';
/** Pin: `PODZIAL_PRACY_PULA_LBL_PELNA` (gra/src/game/cities.ts:537). */
export const PODZIAL_PRACY_PULA_LBL_PELNA = 'Ulepszenia (pula imperium)';
/** Pin: `PODZIAL_PRACY_PULA_TIP` (gra/src/game/cities.ts:539-541). */
export const PODZIAL_PRACY_PULA_TIP =
  'Pula Pracy imperium — budżet ulepszeń terenu; z tej samej puli '
  + 'finansowane są też cuda na mapie, zakładanie miast, wycinka lasu i utrzymanie '
  + 'ulepszeń surowcowych.';

/** Pin: `CITY_PANEL_RANGE_DEPOSIT_LABELS` (gra/src/game/resource-access.ts:243-247). */
export const CITY_PANEL_RANGE_DEPOSIT_LABELS: ReadonlySet<string> = new Set(['Koń', 'Sól', 'Złoto']);

/** Pin: `daninaLabel()` (gra/src/game/danina-nazwa.ts:15) — zawsze 'Podatek'. */
export type DaninaLabelK = 'Podatek';
