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
import type { CityGrowthDto, CityPanelDto, CityPanelInputsDto, CitizenUpkeepCoverageDto, CityRevoltDto, SocietyLineDto } from '../../viewmodel/types';
import type { HandelDetailInputK, WealthCompactOptsK } from './k03-cards';
import type { CityProductionK, GrowthPercentBreakdownK } from './k01b-dto';
import { localProd } from './k01b-t';
import type { CityView } from './k01b-t';
import { DEFAULT_PODZIAL_HANDLU, DEFAULT_PODZIAL_PRACY, isDevOnlyPlayerText, isEmptyDataVal, stripInlineDevAnnotations, type PodzialHandluSplit, type PodzialPracySplit } from './k01a-fundament';

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

/** Pin :7230-7236 `playerFacingNote` (czysta funkcja tekstu, bez stanu gry). Runda 2: 1:1. */
export function playerFacingNote(text: string | null | undefined): string | null {
  if (!text || isEmptyDataVal(text)) return null;
  const raw = String(text).trim();
  if (isDevOnlyPlayerText(raw)) return null;
  const cleaned = stripInlineDevAnnotations(raw);
  return cleaned || null;
}

/** Pin :7295-7299 `unitExtraField` (odczyt pola jednostki; pusta wartosc -> null). Runda 2: 1:1. */
export function unitExtraField(u: Readonly<Record<string, unknown>>, key: string): string | number | null {
  const v = u[key];
  if (isEmptyDataVal(v)) return null;
  return v as string | number;
}

/** Pin :1402-1414 `cityFoodSplit` (podzial zywnosci na produkcje/racje, przyciety do maxSafe). Runda 2: 1:1. */
export function cityFoodSplit(view: CityView, maxSafe?: number): { total: number; produkcja: number; racje: number; clamped: boolean } {
  const produkcja = Math.round(view.zywnoscBrutto);
  const effectiveLevel = maxSafe !== undefined ? Math.min(view.poziomRacji, maxSafe) : view.poziomRacji;
  const clamped = effectiveLevel < view.poziomRacji && view.poziomRacji > 0;
  if (!clamped) {
    const racje = Math.round(view.kosztRacji);
    const total = Math.round(view.bilansLokalny);
    return { total, produkcja, racje, clamped };
  }
  const racje = Math.round(view.kosztRacji * effectiveLevel / view.poziomRacji);
  const total = produkcja - racje;
  return { total, produkcja, racje, clamped };
}

/** K03-Z10 (pin :1008): domyslny podzial handlu wlasciciela z DTO (`sliders.handelDefault`); brak -> K01A. */
export function readOwnerDefaultPodzialHandluFromDto(dto: CityPanelDto): PodzialHandluSplit {
  const h = dto.sliders.handelDefault;
  return {
    procentPieniadz: h.procentPieniadz ?? DEFAULT_PODZIAL_HANDLU.procentPieniadz,
    procentNauka: h.procentNauka ?? DEFAULT_PODZIAL_HANDLU.procentNauka,
    procentLuksus: h.procentLuksus ?? DEFAULT_PODZIAL_HANDLU.procentLuksus,
  };
}

/** K03-Z10 (pin :1132): wezly terytorium z DTO (`panelInputs.territoryNodes`); brak -> undefined jak w pinie. */
export function territoryNodesFromDto(dto: CityPanelDto): readonly unknown[] | undefined {
  return dto.panelInputs?.territoryNodes;
}

/** K03-Z10 (pin :1322): czy wlasciciel ma Mennice — flaga silnika (`panelInputs.ownerHasMennica`). */
export function ownerHasMennicaFromDto(dto: CityPanelDto): boolean {
  return dto.panelInputs?.ownerHasMennica ?? false;
}

/** K03-Z10 (pin :3061): suma szczescia z budynkow — wartosc silnika (`panelInputs.happinessBuildingsSum`). */
export function buildingHappinessSumFromDto(dto: CityPanelDto): number {
  return dto.panelInputs?.happinessBuildingsSum ?? 0;
}

/** K03-Z10: prerekwizyty technologii (pin `getTechDef`/`parsePrerequisites`) z `panelInputs.techPrereqs`. */
export function techPrereqsFromDto(dto: CityPanelDto): Readonly<Record<string, readonly string[]>> {
  return dto.panelInputs?.techPrereqs ?? {};
}

/** K03-Z10: karta handlu (pin :10845) — wejscia z `panelInputs.mennica`/`handel`, etykiety z `labels.danina`. */
export function handelDetailInputFromDto(dto: CityPanelDto, split: PodzialHandluSplit): HandelDetailInputK {
  const p = dto.panelInputs;
  const m = p?.mennica;
  const h = p?.handel;
  const forms = dto.labels.danina;
  return {
    daninaLbl: forms.mianownik,
    daninaLblGen: forms.dopelniacz,
    daninaLblAcc: forms.biernik,
    split,
    korupcja: h?.korupcja ?? null,
    maTargowisko: h?.maTargowisko ?? false,
    maBiblioteka: h?.maBiblioteka ?? false,
    maMennicaBudynek: m?.budynek ?? false,
    mennicaAktywna: m?.aktywna ?? false,
    mennicaSpiZBrakuZlota: m?.spiZBrakuZlota ?? false,
    mennicaMnoznikTxt: m?.mnoznikTxt ?? '×?',
    aktywneTrasyCount: h?.aktywneTrasy ?? dto.trade.activeRoutes,
    premiaTrasHandlowych: h?.premiaTrasHandlowych ?? dto.trade.buildingBonus,
  };
}

/** K03-Z10: opcje zamoznosci (pin :4247/:4307) z `wealth` DTO + `panelInputs.wealth`. */
export function wealthOptsFromDto(dto: CityPanelDto, daninaLblGen: string): WealthCompactOptsK & { pct: number } {
  const w = dto.wealth;
  const p = dto.panelInputs?.wealth;
  return {
    poziom: w.poziom,
    atCap: p?.atCap ?? false,
    cap: w.cap,
    epoch: p?.epoch ?? 0,
    mnoz: w.mnoznik,
    szBonus: p?.szBonus ?? 0,
    pula: p?.pula ?? 0,
    prog: w.prog,
    etaW: p?.etaW ?? null,
    zamIn: p?.zamIn ?? 0,
    daninaLblGen,
    pct: w.prog > 0 ? Math.min(100, (100 * (p?.pula ?? 0)) / w.prog) : 0,
  };
}

/** K03-Z10: pula rekrutow (pin :5652) z `panelInputs.recruitPool`. */
export function recruitPoolFromDto(dto: CityPanelDto): CityPanelInputsDto['recruitPool'] {
  return dto.panelInputs?.recruitPool ?? {
    manpowerBiezacy: 0, manpowerMax: 0, regenPerTurn: 0, kosztJednostki: 0,
    werbMaxPrzyPelnejPuli: 0, ludnoscAbsolutna: 0, ludki: 0, epoka: 0,
  };
}

/** K03-Z10: zdrowie (pin :3582) — suma z `health.total`, plus/minus z `panelInputs.zdrowie`. */
export function zdrowieSumsFromDto(dto: CityPanelDto): { total: number; posSum: number; negSum: number } {
  return { total: dto.health.total, posSum: dto.panelInputs?.zdrowie.posSum ?? 0, negSum: dto.panelInputs?.zdrowie.negSum ?? 0 };
}
