/**
 * K03 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K03-Q1, runda 1): model miasta — adaptery DTO zastepujace
 * reguly z pinu `gra/src/ui/cityPanel.ts` (pin edb8fb56). Modul NIE liczy regul gry (P5.13):
 * kazda wartosc pochodzi z `CityPanelDto` (silnik / Rust), a adaptery tylko przekladaja ksztalt.
 *
 * ZALOZENIA K03 (rozstrzygniete w dyspozycje/rust-port/p5/P5-8-K03.md, nie pytania):
 * - K03-Z1: `computeView(city, map, data)` (pin :1137-1303) -> `cityViewFromDto(dto)`. Pola CityView
 *   mapowane 1:1 z DTO; `zywnoscNetto` = `food.bilansLokalny` (pin PYTANIE-85: bilans lokalny = netto).
 * - K03-Z2: `cityGrowthLive` (pin :1527) -> `cityGrowthLiveFromDto(dto)`. `procentNaTure` = `growth.pctPerTurn`
 *   (engine liczy juz clamp do maxSafe; cache `getCachedMaxSafePoziomRacji` pina znika).
 * - K03-Z3: `resolveOrderState` (pin :3084) -> `resolveOrderStateFromDto(dto)`; `computeOrderStateLocal`
 *   (pin :3114-3273) USUNIETE — porzadek/szczescie zawsze z `dto.order` (test: wartosci z silnika).
 * - K03-Z4: `CityPanelConfig` (pin :314-606) i `cfg` (pin :609) NIE sa portowane — zastapione argumentem `dto`.
 * - K03-Z5: `readPodzialHandlu` (pin :1001) -> `readPodzialHandluFromDto(dto)` (`sliders.handel`).
 * - K03-Z6: `isMeCity` / `isCapital` / `activeTradeRouteCountForCity` czytaja pola `city`/`trade` z DTO.
 * - K03-Z7: `localProd` (K01B) zostaje jako lokalny cache przestawiania kolejki; `getProd`/`setProd` bez hookow cfg.
 */
import type { CityGrowthDto, CityPanelDto, CitizenUpkeepCoverageDto, CityRevoltDto, SocietyLineDto } from '../../viewmodel/types';
import type { CityProductionK, GrowthPercentBreakdownK } from './k01b-dto';
import { localProd } from './k01b-t';
import type { CityView } from './k01b-t';
import { DEFAULT_PODZIAL_HANDLU, DEFAULT_PODZIAL_PRACY, type PodzialHandluSplit, type PodzialPracySplit } from './k01a-fundament';

/** Pin: `CityGrowthLive` (cityGrowthLive, pin :1527) — wynik dla plakietki wzrostu. */
export interface CityGrowthLiveK {
  procentNaTure: number;
  nakarmione: boolean;
}

/** Pin: `OrderState` (podzbior czytany przez panel) — zrodlo: `dto.order` (silnik), K03-Z3. */
export interface OrderStateK {
  szczescie: number;
  porzadekPct: number;
  band: number;
  bandLabel: string;
  lines: SocietyLineDto[];
  citizenUpkeep: CitizenUpkeepCoverageDto;
  postCaptureLaw: string | null;
  revolt: CityRevoltDto;
  /** Zawsze `true`: stan porzadku pochodzi z silnika (brak lokalnego przeliczenia, K03-Z3). */
  fromEngine: true;
}

/** K03-Z1: CityView z DTO. Pola zgodne z `k01b-t.ts` (CityView). */
export function cityViewFromDto(dto: CityPanelDto): CityView {
  return {
    praca: dto.yields.praca,
    pieniadz: dto.yields.pieniadz,
    nauka: dto.yields.nauka,
    kultura: dto.yields.kultura,
    zywnoscNetto: dto.food.bilansLokalny,
    zywnoscBrutto: dto.yields.zywnoscBrutto,
    kosztRacji: dto.food.kosztRacji,
    bilansLokalny: dto.food.bilansLokalny,
    poziomRacji: dto.food.poziomRacji,
    wzrostProcent: dto.growth.pctPerTurn,
    growthBreakdown: dto.growth.breakdown as unknown as GrowthPercentBreakdownK,
    wzrostUlamkowy: dto.growth.wzrostUlamkowy,
    maSpichlerz: dto.popCaps.maSpichlerz,
    maAkwedukt: dto.popCaps.maAkwedukt,
    popCapBezAkweduktu: dto.popCaps.bezAkweduktu,
    popCapSpichlerz: dto.popCaps.spichlerz,
    popCapZAkweduktem: dto.popCaps.zAkweduktem,
    popCapAktualny: dto.popCaps.aktualny,
    atPopCap: dto.popCaps.atCap,
    citizenUpkeep: dto.order.citizenUpkeep,
  };
}

/** K03-Z2: `cityGrowthLive` z DTO (zastepuje pin :1527; bez cache maxSafe i bez `computeView`). */
export function cityGrowthLiveFromDto(dto: CityPanelDto): CityGrowthLiveK {
  return { procentNaTure: dto.growth.pctPerTurn, nakarmione: dto.growth.fed };
}

/** Pelny wzrost z DTO (`CityGrowthDto`) — ta sama wartosc, co mapa miast Rust (`CityMapBadge.growth`). */
export function cityGrowthFromDto(dto: CityPanelDto): CityGrowthDto {
  return dto.growth;
}

/** K03-Z3: porzadek/szczescie WYLACZNIE z silnika. Brak `computeOrderStateLocal`. */
export function resolveOrderStateFromDto(dto: CityPanelDto): OrderStateK {
  const o = dto.order;
  return {
    szczescie: o.szczescie,
    porzadekPct: o.porzadekPct,
    band: o.band,
    bandLabel: o.bandLabel,
    lines: o.lines,
    citizenUpkeep: o.citizenUpkeep,
    postCaptureLaw: o.postCaptureLaw,
    revolt: o.revolt,
    fromEngine: true,
  };
}

/** K03-Z5: podzial handlu z DTO (`sliders.handel`); brak pola -> domyslny z K01A. */
export function readPodzialHandluFromDto(dto: CityPanelDto): PodzialHandluSplit {
  const h = dto.sliders.handel;
  return {
    procentPieniadz: h.procentPieniadz ?? DEFAULT_PODZIAL_HANDLU.procentPieniadz,
    procentNauka: h.procentNauka ?? DEFAULT_PODZIAL_HANDLU.procentNauka,
    procentLuksus: h.procentLuksus ?? DEFAULT_PODZIAL_HANDLU.procentLuksus,
  };
}

/** Podzial pracy z DTO (`sliders.pracaBudynkiPct`). */
export function readPodzialPracyFromDto(dto: CityPanelDto): PodzialPracySplit {
  const pct = dto.sliders.pracaBudynkiPct;
  return { procentBudynki: typeof pct === 'number' ? pct : DEFAULT_PODZIAL_PRACY.procentBudynki };
}

/** K03-Z6: pin `isCapital` (:1126) -> pole DTO. */
export function isCapitalFromDto(dto: CityPanelDto): boolean {
  return dto.city.isCapital;
}

/** K03-Z6: pin `isMeCity` (:617) -> pole DTO. */
export function isMeCityFromDto(dto: CityPanelDto): boolean {
  return dto.city.isMine;
}

/** K03-Z6: pin `activeTradeRouteCountForCity` (:11045) -> `trade.activeRoutes` z DTO. */
export function activeTradeRouteCountFromDto(dto: CityPanelDto): number {
  return dto.trade.activeRoutes;
}

/** K03-Z7: lokalny cache kolejki (pin `getProd`, :634, bez hookow cfg). */
export function getProd(cityId: string): CityProductionK {
  return localProd.get(cityId) ?? { kolejka: [], postep: 0 };
}

/** K03-Z7: pin `setProd` (:638) — zapis lokalnego cache. */
export function setProd(cityId: string, prod: CityProductionK): void {
  localProd.set(cityId, prod);
}
