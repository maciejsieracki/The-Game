/**
 * K01B partia T (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1, runda 1): 26 jednostek pinu
 * gra/src/ui/cityPanel.ts (edb8fb56) zaleznych wylacznie od typow obiektowych (DTO w k01b-dto.ts)
 * albo od stalych. Tresc = pin po normalizacji (tools/dom-harness/verify-k01b-copies.mjs): typy `*K`, importy ui/ zamiast game/data, pozycje ALLOWED z powodem.
 * Numer linii pinu przy kazdej jednostce.
 */
import { buildingIconSvg, unitIconSvg } from '../icons/brandAssets';
import { unitInfographicMedallionHtml, unitInfographicSvg } from '../unitInfographic';
import { szPktDisplay } from './k01a-fundament';
import type {
  BuildingDefK,
  CityProductionK,
  CityRefK,
  CityWithSlidersK,
  DaninaLabelK,
  GameDataK,
  GrowthPercentBreakdownK,
  EmpireFoodTickK,
  PoziomRacjiK,
  ProductionItemK,
  SocietyLineK,
  YieldKeyK,
  CitizenUpkeepK,
  UnitDefK,
} from './k01b-dto';
import {
  CITY_PANEL_RANGE_DEPOSIT_LABELS,
  PODZIAL_PRACY_PULA_LBL,
  PODZIAL_PRACY_PULA_LBL_PELNA,
  PODZIAL_PRACY_PULA_TIP,
} from './k01b-dto';

// pin edb8fb56 gra/src/ui/cityPanel.ts:625-625 (stan modulu; K01B-Z4: pozostaje `let` modulu)
export let cachedData: GameDataK | null = null;

// pin edb8fb56 gra/src/ui/cityPanel.ts:633-633
export const localProd = new Map<string, CityProductionK>();

// pin edb8fb56 gra/src/ui/cityPanel.ts:645-666
export function moveQueueItem(prod: CityProductionK, index: number, dir: -1 | 1): CityProductionK {
  const j = index + dir;
  if (index < 1 || j < 1 || j >= prod.kolejka.length) {
    return {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  const k = [...prod.kolejka];
  const a = k[index] as ProductionItemK;
  k[index] = k[j] as ProductionItemK;
  k[j] = a;
  return {
    kolejka: k,
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:667-674
export function copyCityProduction(prod: CityProductionK): CityProductionK {
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:676-693
/** Przesuń pozycję kolejki rekrutacji w górę/dół. */
export function moveRecruitQueueItem(prod: CityProductionK, index: number, dir: -1 | 1): CityProductionK {
  const rq = prod.rekrutacja ?? [];
  const j = index + dir;
  if (index < 0 || j < 0 || index >= rq.length || j >= rq.length) {
    return copyCityProduction(prod);
  }
  const next = [...rq];
  const a = next[index] as ProductionItemK;
  next[index] = next[j] as ProductionItemK;
  next[j] = a;
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: next.length ? next : undefined,
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:695-712
/** Przenieś pozycję kolejki rekrutacji na inny indeks. */
export function reorderRecruitQueueItem(prod: CityProductionK, fromIndex: number, toIndex: number): CityProductionK {
  const rq = prod.rekrutacja ?? [];
  const len = rq.length;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= len || toIndex >= len || fromIndex === toIndex) {
    return copyCityProduction(prod);
  }
  const next = [...rq];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return copyCityProduction(prod);
  next.splice(toIndex, 0, moved);
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: next.length ? next : undefined,
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:714-731
/** Przenieś pozycję kolejki (indeks ≥ 1) na inny indeks w tej samej kolejce. */
export function reorderQueueItem(prod: CityProductionK, fromIndex: number, toIndex: number): CityProductionK {
  const len = prod.kolejka.length;
  if (fromIndex < 1 || toIndex < 1 || fromIndex >= len || toIndex >= len || fromIndex === toIndex) {
    return copyCityProduction(prod);
  }
  const k = [...prod.kolejka];
  const [moved] = k.splice(fromIndex, 1);
  if (!moved) return copyCityProduction(prod);
  k.splice(toIndex, 0, moved);
  return {
    kolejka: k,
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:994-1000
export type CityWithSliders = CityWithSlidersK;

// pin edb8fb56 gra/src/ui/cityPanel.ts:1039-1072 (pola z DTO; PoziomRacji/GrowthPercentBreakdown/
// CitizenUpkeepCoverage jako typy DTO — K01B-Z1)
export interface CityView {
  praca: number; pieniadz: number; nauka: number; kultura: number;
  /** PYTANIE-85: bilans lokalny = produkcja − racje (wyświetlany jako żywność netto). */
  zywnoscNetto: number;
  /** Produkcja brutto żywności (pola + budynki, przed racjami). */
  zywnoscBrutto: number;
  kosztRacji: number;
  bilansLokalny: number;
  poziomRacji: PoziomRacjiK;
  wzrostProcent: number;
  growthBreakdown: GrowthPercentBreakdownK;
  wzrostUlamkowy: number;
  /** Spichlerz w DOWOLNYM tierze (I lub II) — R-SPICHLERZ-CAP-LUDNOSCI-ETAP 2026-08-09. */
  maSpichlerz: boolean; maAkwedukt: boolean;
  /**
   * Max ludność BEZ Akweduktu, uwzględniając Spichlerz tego miasta (drabinka
   * R-SPICHLERZ-CAP-LUDNOSCI-ETAP, Maciej 2026-08-09): 5 bez żadnego budynku, 8 ze
   * Spichlerzem — NIE sztywny parametr `akweduktProgLudnosci` (5).
   */
  popCapBezAkweduktu: number;
  /** Twardy cap ludności ze Spichlerzem, ale bez Akweduktu (parametr gry, normal=8). */
  popCapSpichlerz: number;
  /** Max ludność z Akweduktem (parametr gry, normal=12). */
  popCapZAkweduktem: number;
  /** Aktualny cap dla tego miasta. */
  popCapAktualny: number;
  /** Wzrost zablokowany — ludność ≥ aktualny cap. */
  atPopCap: boolean;
  /**
   * R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10): pokrycie zużycia surowców budowlanych
   * obywateli tego miasta w bieżącej epoce — magazyn centralny imperium.
   */
  citizenUpkeep: CitizenUpkeepK;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1107-1125 (pola; wealthMnoznik jest polem DTO, nie importem)
/** Bilans pieniędzy jednego miasta — tylko przychody/koszty tego grodu. */
export interface CityMoneySnap {
  /** Wpływ do skarbca imperium z tego miasta / turę. */
  doSkarbca: number;
  /** Pieniądz brutto (pola + budynki) przed mnożnikiem zamożności. */
  pieniadzBrutto: number;
  /** Mnożnik zamożności W tej tury. */
  wealthMnoznik: number;
  /** Dochód ze szlaków handlowych (doliczany do skarbca). */
  handelZeSzlakow: number;
  /** Utrzymanie budynków w tym mieście / turę. */
  utrzymanieBudynkow: number;
  /** Utrzymanie surowców budynków w tym mieście / turę (magazyn państwa). */
  utrzymanieSurowcowBudynkow?: Record<string, number>;
  /** Utrzymanie jednostek na heksie miasta (garnizon) / turę. */
  utrzymanieGarnizonu: number;
  /** Nauka / turę z tego miasta (informacyjnie). */
  nauka: number;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1335-1337 (DANINA = stała 'Podatek', danina-nazwa.ts:15)
export function daninaLabelForCity(_city: CityRefK): DaninaLabelK {
  return 'Podatek';
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:1348-1348
export const PULA_LBL = PODZIAL_PRACY_PULA_LBL;
// pin edb8fb56 gra/src/ui/cityPanel.ts:1349-1349
export const PULA_LBL_PELNA = PODZIAL_PRACY_PULA_LBL_PELNA;
// pin edb8fb56 gra/src/ui/cityPanel.ts:1350-1360
export const PULA_TIP = PODZIAL_PRACY_PULA_TIP;
/**
 * R-PRACA-JEDEN-PODZIAL-Q1 — ROOT CAUSE osmiu nawrotow tego tematu byl TUTAJ:
 * pole nazywalo sie `doUlepszen`, a nioslo `doPuli` (cala pula imperium, ktora
 * finansuje TAKZE cuda na mapie, zakladanie miast i wycinke). Ta sama liczba
 * miala w tym pliku cztery rozne nazwy. Pole `doUlepszen` zostalo USUNIETE;
 * jedyna nazwa tej liczby to `doPuli` — identyczna jak w silniku
 * (`production.ts::splitPraca`). Nie wolno przywracac nazwy `doUlepszen` dla
 * czegokolwiek, co nie jest wprost budzetem ulepszen terenu.
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1470-1479
export function resolveCityFedForUi(
  cityId: string,
  foodSplitTotal: number,
  tick?: EmpireFoodTickK | null,
): boolean {
  const row = tick?.perCityRows?.find(r => r.cityId === cityId);
  if (row !== undefined) return row.nakarmione === true;
  if (tick) return false;
  return foodSplitTotal >= 0;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:3039-3041
export function szLinesDoWyswietlenia(lines: SocietyLineK[] | undefined): SocietyLineK[] | undefined {
  return lines?.map(l => ({ ...l, value: szPktDisplay(l.value) }));
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:3618-3643 (zbior etykiet = stala DTO; raw.tradeSources
// nie jest czytany — DYSPOZYCJA 85, zgodnie z pinem)
export function normalizeResourceAccess(
  raw: string[] | { potential: string[]; active: string[]; tradeSources?: Record<string, string> } | undefined,
): {
  potential: string[];
  active: string[];
  legacy: boolean;
} {
  if (!raw) return { potential: [], active: [], legacy: false };
  if (Array.isArray(raw)) {
    return {
      potential: [],
      active: raw.filter(l => CITY_PANEL_RANGE_DEPOSIT_LABELS.has(l)),
      legacy: true,
    };
  }
  return {
    potential: raw.potential ?? [],
    active: (raw.active ?? []).filter(l => CITY_PANEL_RANGE_DEPOSIT_LABELS.has(l)),
    legacy: false,
  };
  // DYSPOZYCJA 85 (Maciej 2026-07-26): `raw.tradeSources` (którego szlak handlowy
  // przyznał dostęp do tego surowca) już NIE jest odczytywany tutaj -- to jest
  // informacja o handlu międzynarodowym, a ta należy WYŁĄCZNIE do panelu Handel
  // (empireDetailPanel.ts), nie do panelu miasta. main.ts nadal może zwracać to
  // pole (getResourceAccess) -- po prostu nie jest tu już konsumowane.
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6368-6371
export function findBuildingDef(data: GameDataK, id: string): BuildingDefK | undefined {
  return data.buildings.find(b => b.id === id);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6372-6375
export function findUnitDef(data: GameDataK, id: string): UnitDefK | undefined {
  return data.units.find(u => u.Jednostka === id);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6376-6379
export function customBuildingIconClass(_def: BuildingDefK | undefined): string | null {
  return null;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6380-6383
export function buildingIconHtml(def: BuildingDefK | undefined, buildingId?: string): string {
  return buildingIconSvg(def, buildingId ?? def?.id);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6384-6390
export function unitIconHtml(u: UnitDefK | undefined, id?: string): string {
  const key = id ?? u?.Jednostka;
  const svg = unitInfographicSvg(u, key, 22);
  if (svg) return svg;
  return unitIconSvg(u, key);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6391-6397
export function unitMedallionHtml(u: UnitDefK | undefined, id?: string, size = 22): string {
  const key = id ?? u?.Jednostka;
  const medallion = unitInfographicMedallionHtml(u, key, size);
  if (medallion) return medallion;
  const svg = unitIconSvg(u, key);
  return svg ? `<span class="unit-infographic-medallion" aria-hidden="true">${svg}</span>` : '';
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6399-6408
export function productionItemIconHtml(data: GameDataK | null, item: ProductionItemK): string {
  if (!data) {
    return item.kind === 'budynek'
      ? buildingIconSvg(undefined, item.id)
      : unitIconSvg(undefined, item.id);
  }
  return item.kind === 'budynek'
    ? buildingIconHtml(findBuildingDef(data, item.id), item.id)
    : unitIconHtml(findUnitDef(data, item.id), item.id);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6461-6469
export const YIELD_BRAND: { key: YieldKeyK; brandId: string; label: string }[] = [
  { key: 'praca', brandId: 'res-work', label: 'Praca' },
  { key: 'pieniadz', brandId: 'res-treasury', label: 'Pieniądz' },
  { key: 'zywnosc', brandId: 'loaf', label: 'Żywność' },
  { key: 'nauka', brandId: 'science-owl', label: 'Nauka' },
  { key: 'kultura', brandId: 'res-culture', label: 'Kultura' },
  { key: 'zadowolenie', brandId: 'chip-happiness', label: 'Zadowolenie' },
  { key: 'obrona', brandId: 'chip-garrison', label: 'Obrona' },
];

// pin edb8fb56 gra/src/ui/cityPanel.ts:7006-7010
export function parentBuildingName(data: GameDataK, upgradeFromId: string | undefined): string | null {
  const id = upgradeFromId?.trim();
  if (!id) return null;
  return findBuildingDef(data, id)?.nazwa ?? id;
}

// pin edb8fb56 gra/src/game/production.ts:1118-1120 (`frontItem`: odczyt pozycji 0 — struktura, nie reguła)
export function frontItemK(prod: CityProductionK): ProductionItemK | null {
  return prod.kolejka.length > 0 ? (prod.kolejka[0] as ProductionItemK) : null;
}
