/**
 * city-administrator.ts — R-WEB-CITY-ADMINISTRATOR-Q1 (decyzja właściciela 2026-11-11).
 *
 * ADMINISTRATOR MIASTA: osoba przypisana indywidualnie do miasta (MAX 1 na miasto), rekrutowana
 * w mieście z budynkiem administracyjnym (Pałac I/II/III albo Dom Starszyzny / Dwór Zarządcy /
 * Pretorium). PURE LOGIC — bez DOM/I/O. Wszystkie liczby (koszt, utrzymanie, efekty, skala tieru)
 * w `data/city-administrator-params.json`.
 *
 * Model stanu (na `City.administrator`, serializowany razem z miastem — stary zapis bez pola =
 * brak administratora):
 *   - `ownerId`   — właściciel w chwili zatrudnienia (zmiana właściciela = koniec służby),
 *   - `hiredTurn` — tura zatrudnienia,
 *   - `pracuje`   — czy skarbiec państwa pokrył utrzymanie w tej turze (liczone przez
 *                   `refreshAdministratorState`; brak środków => NIE pracuje: bez efektów i bez
 *                   autobudowy, ale pozostaje przypisany).
 * Tier (skala efektów) NIE jest przechowywany — zawsze liczony z budynków miasta, więc ulepszenie
 * łańcucha Dom→Dwór→Pretorium / Pałac I→II→III zachowuje administratora i zmienia skalę.
 */

import type { City } from './cities';
import paramsRaw from '../../data/city-administrator-params.json';

export interface CityAdministrator {
  ownerId: number;
  hiredTurn: number;
  pracuje: boolean;
}

export type AdminTier = 0 | 1 | 2 | 3;

interface AdminParamsJson {
  koszt_zatrudnienia_pieniadz: number;
  utrzymanie_pieniadz_na_ture_wg_tieru: Record<string, number>;
  skala_efektow_wg_tieru: Record<string, number>;
  efekty_bazowe: {
    korupcja_redukcja_pct: number;
    produkcja_miasta_pct: number;
    sciagalnosc_podatkow_miasta_pct: number;
  };
  budynki_administracyjne_tier: Record<string, number>;
  ai: { rezerwa_tur_utrzymania: number };
  administrator_ulepszen: {
    koszt_zatrudnienia_pieniadz: number;
    utrzymanie_pieniadz_na_ture: number;
    ai_wymaga_administratora: boolean;
    opis_gracza: string;
  };
  opis_gracza: string;
}

const P = paramsRaw as unknown as AdminParamsJson;

/** Koszt jednorazowy zatrudnienia (Pieniądz). */
export function administratorHireCost(): number {
  return P.koszt_zatrudnienia_pieniadz;
}

/** Opis do UI/Civpedii (z JSON). */
export function administratorDescription(): string {
  return P.opis_gracza;
}

/** Rezerwa AI: liczba tur utrzymania, jaką skarbiec ma pokryć PO zatrudnieniu. */
export function administratorAiReserveTurns(): number {
  return P.ai.rezerwa_tur_utrzymania;
}

/** Bazowe efekty (w %), do tooltipów/Civpedii. */
export function administratorBaseEffectsPct(): {
  korupcja: number; produkcja: number; podatki: number;
} {
  return {
    korupcja: P.efekty_bazowe.korupcja_redukcja_pct,
    produkcja: P.efekty_bazowe.produkcja_miasta_pct,
    podatki: P.efekty_bazowe.sciagalnosc_podatkow_miasta_pct,
  };
}

/** Najwyższy tier budynku administracyjnego w mieście (0 = brak). */
export function administrativeBuildingTier(builtIds: readonly string[]): AdminTier {
  let best = 0;
  for (const id of builtIds) {
    const t = P.budynki_administracyjne_tier[id];
    if (typeof t === 'number' && t > best) best = t;
  }
  return (best >= 3 ? 3 : best === 2 ? 2 : best === 1 ? 1 : 0) as AdminTier;
}

/** Id budynków administracyjnych (do UI/Civpedii/testów). */
export function administrativeBuildingIds(): string[] {
  return Object.keys(P.budynki_administracyjne_tier);
}

/** Skala efektów wg tieru (×1 / ×1,5 / ×2,25); tier 0 => 0. */
export function administratorTierScale(tier: AdminTier): number {
  if (tier === 0) return 0;
  return P.skala_efektow_wg_tieru[String(tier)] ?? 0;
}

/** Utrzymanie na turę wg tieru (Pieniądz); tier 0 => 0. */
export function administratorUpkeepForTier(tier: AdminTier): number {
  if (tier === 0) return 0;
  return P.utrzymanie_pieniadz_na_ture_wg_tieru[String(tier)] ?? 0;
}

export interface AdministratorEffects {
  /** Czy administrator realnie pracuje (zatrudniony + tier>0 + skarbiec pokrywa utrzymanie). */
  aktywny: boolean;
  tier: AdminTier;
  skala: number;
  /** Addytywna redukcja korupcji (ułamek bazowej straty, np. 0.10 × skala). */
  korupcjaRedukcja: number;
  /** Mnożnik Pracy miasta (1 + 0.03 × skala). */
  produkcjaMult: number;
  /** Mnożnik ściągalności podatków miasta (1 + 0.03 × skala). */
  podatkiMult: number;
}

const NO_EFFECTS: AdministratorEffects = {
  aktywny: false, tier: 0, skala: 0, korupcjaRedukcja: 0, produkcjaMult: 1, podatkiMult: 1,
};

/** Efekty administratora miasta (neutralne, gdy brak / nie pracuje). */
export function administratorEffectsFor(
  city: Pick<City, 'ownerId' | 'administrator'>,
  builtIds: readonly string[],
): AdministratorEffects {
  const adm = city.administrator;
  if (!adm || adm.ownerId !== city.ownerId || adm.pracuje !== true) return NO_EFFECTS;
  const tier = administrativeBuildingTier(builtIds);
  if (tier === 0) return NO_EFFECTS;
  const skala = administratorTierScale(tier);
  const e = P.efekty_bazowe;
  return {
    aktywny: true,
    tier,
    skala,
    korupcjaRedukcja: (e.korupcja_redukcja_pct / 100) * skala,
    produkcjaMult: 1 + (e.produkcja_miasta_pct / 100) * skala,
    podatkiMult: 1 + (e.sciagalnosc_podatkow_miasta_pct / 100) * skala,
  };
}

/** Czy miasto ma ZATRUDNIONEGO administratora (niezależnie od tego, czy pracuje). */
export function cityHasAdministrator(city: Pick<City, 'ownerId' | 'administrator'>): boolean {
  return !!city.administrator && city.administrator.ownerId === city.ownerId;
}

/** Czy miasto ma DZIAŁAJĄCEGO administratora (zatrudniony + pokryte utrzymanie). */
export function cityHasWorkingAdministrator(city: Pick<City, 'ownerId' | 'administrator'>): boolean {
  return cityHasAdministrator(city) && city.administrator!.pracuje === true;
}

// ---------------------------------------------------------------------------
// R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1 — ADMINISTRATOR ULEPSZEŃ (decyzja właściciela ABC 2026-11-11):
// ten sam koszt co administrator miasta, BEZ bonusów i dodatków; jedyny skutek: odblokowuje
// automatyczne ulepszenia terenu w tym mieście. Stan na `City.administratorUlepszen` (ten sam kształt
// co administrator miasta), finansowany z tego samego skarbca państwa (`refreshAdministratorState`).
// ---------------------------------------------------------------------------

/** Koszt jednorazowy zatrudnienia administratora ulepszeń (Pieniądz). */
export function improvementAdministratorHireCost(): number {
  return P.administrator_ulepszen.koszt_zatrudnienia_pieniadz;
}

/** Utrzymanie administratora ulepszeń na turę (stawka tieru I administratora miasta; JSON). */
export function improvementAdministratorUpkeep(): number {
  return P.administrator_ulepszen.utrzymanie_pieniadz_na_ture;
}

/** Opis do UI/Civpedii (z JSON). */
export function improvementAdministratorDescription(): string {
  return P.administrator_ulepszen.opis_gracza;
}

/** Czy AI też podlega bramce administratora ulepszeń (JSON; domyślnie nie — patrz raport). */
export function aiRequiresImprovementAdministrator(): boolean {
  return P.administrator_ulepszen.ai_wymaga_administratora === true;
}

/** Czy miasto ma ZATRUDNIONEGO administratora ulepszeń (niezależnie od tego, czy pracuje). */
export function cityHasImprovementAdministrator(city: Pick<City, 'ownerId' | 'administratorUlepszen'>): boolean {
  return !!city.administratorUlepszen && city.administratorUlepszen.ownerId === city.ownerId;
}

/** Czy miasto ma DZIAŁAJĄCEGO administratora ulepszeń (zatrudniony + pokryte utrzymanie). */
export function cityHasWorkingImprovementAdministrator(city: Pick<City, 'ownerId' | 'administratorUlepszen'>): boolean {
  return cityHasImprovementAdministrator(city) && city.administratorUlepszen!.pracuje === true;
}

/** Utrzymanie administratora ulepszeń tego miasta w tej turze (0, gdy brak/nie pracuje). */
export function improvementAdministratorUpkeepForCity(city: Pick<City, 'ownerId' | 'administratorUlepszen'>): number {
  return cityHasWorkingImprovementAdministrator(city) ? improvementAdministratorUpkeep() : 0;
}

export type ImprovementHireBlockReason = 'ma_administratora' | 'brak_srodkow';

/** Powód, dla którego NIE można zatrudnić administratora ulepszeń (null = można). */
export function improvementAdministratorHireBlockReason(
  city: Pick<City, 'ownerId' | 'administratorUlepszen'>,
  treasury: number,
): ImprovementHireBlockReason | null {
  if (cityHasImprovementAdministrator(city)) return 'ma_administratora';
  if (treasury < improvementAdministratorHireCost()) return 'brak_srodkow';
  return null;
}

export function improvementAdministratorHireBlockText(reason: ImprovementHireBlockReason): string {
  return reason === 'ma_administratora'
    ? 'Miasto ma już administratora ulepszeń'
    : `Brak środków w skarbcu: zatrudnienie kosztuje ${improvementAdministratorHireCost()} Pieniądza`;
}

/** Zatrudnij administratora ulepszeń (BEZ pobrania kosztu — pobiera wołający). false = zablokowane. */
export function hireImprovementAdministrator(city: City, treasury: number, turn: number): boolean {
  if (improvementAdministratorHireBlockReason(city, treasury) !== null) return false;
  city.administratorUlepszen = { ownerId: city.ownerId, hiredTurn: turn, pracuje: true };
  return true;
}

/** Zwolnij administratora ulepszeń (bez zwrotu kosztu). */
export function dismissImprovementAdministrator(city: City): boolean {
  if (!city.administratorUlepszen) return false;
  delete city.administratorUlepszen;
  return true;
}

/** Tekst stanu administratora ulepszeń do tooltipa/UI. */
export function improvementAdministratorStatusText(working: boolean): string {
  return working ? 'pracuje' : 'nie pracuje — brak środków w skarbcu państwa';
}

/** Utrzymanie administratora tego miasta w tej turze (0, gdy brak/nie pracuje). */
export function administratorUpkeepForCity(
  city: Pick<City, 'ownerId' | 'administrator'>,
  builtIds: readonly string[],
): number {
  if (!cityHasWorkingAdministrator(city)) return 0;
  return administratorUpkeepForTier(administrativeBuildingTier(builtIds));
}

/** Suma utrzymania DZIAŁAJĄCYCH administratorów ownera (płatna ze skarbca państwa). */
export function totalAdministratorUpkeepForOwner(
  cities: ReadonlyArray<Pick<City, 'id' | 'ownerId' | 'administrator' | 'administratorUlepszen'>>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  ownerId: number,
): number {
  let sum = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    sum += administratorUpkeepForCity(c, builtByCity.get(c.id) ?? []);
    sum += improvementAdministratorUpkeepForCity(c);
  }
  return sum;
}

/** Suma utrzymania WSZYSTKICH zatrudnionych administratorów ownera (także bezczynnych) — do prognozy. */
export function totalAdministratorUpkeepIfAllWorkForOwner(
  cities: ReadonlyArray<Pick<City, 'id' | 'ownerId' | 'administrator' | 'administratorUlepszen'>>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  ownerId: number,
): number {
  let sum = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    if (cityHasAdministrator(c)) sum += administratorUpkeepForTier(administrativeBuildingTier(builtByCity.get(c.id) ?? []));
    if (cityHasImprovementAdministrator(c)) sum += improvementAdministratorUpkeep();
  }
  return sum;
}

export type HireBlockReason = 'brak_budynku' | 'ma_administratora' | 'brak_srodkow';

/** Powód, dla którego NIE można zatrudnić administratora (null = można). */
export function administratorHireBlockReason(
  city: Pick<City, 'ownerId' | 'administrator'>,
  builtIds: readonly string[],
  treasury: number,
): HireBlockReason | null {
  if (administrativeBuildingTier(builtIds) === 0) return 'brak_budynku';
  if (cityHasAdministrator(city)) return 'ma_administratora';
  if (treasury < administratorHireCost()) return 'brak_srodkow';
  return null;
}

export function administratorHireBlockText(reason: HireBlockReason): string {
  switch (reason) {
    case 'brak_budynku':
      return 'Wymaga budynku administracyjnego w mieście (Pałac, Dom Starszyzny, Dwór Zarządcy lub Pretorium)';
    case 'ma_administratora':
      return 'Miasto ma już administratora';
    case 'brak_srodkow':
      return `Brak środków w skarbcu: zatrudnienie kosztuje ${administratorHireCost()} Pieniądza`;
  }
}

/**
 * Zatrudnij administratora (BEZ pobrania kosztu — koszt pobiera wołający ze skarbca państwa).
 * Zwraca false, gdy zablokowane. `pracuje` startuje jako true; stan skorygują `refreshAdministratorState`.
 */
export function hireAdministrator(
  city: City,
  builtIds: readonly string[],
  treasury: number,
  turn: number,
): boolean {
  if (administratorHireBlockReason(city, builtIds, treasury) !== null) return false;
  city.administrator = { ownerId: city.ownerId, hiredTurn: turn, pracuje: true };
  return true;
}

/** Zwolnij administratora (bez zwrotu kosztu). */
export function dismissAdministrator(city: City): boolean {
  if (!city.administrator) return false;
  delete city.administrator;
  return true;
}

export type AdministratorChangeKind = 'ended_no_building' | 'ended_owner_changed' | 'stopped_no_funds' | 'resumed';
/** `role`: 'miasto' = administrator miasta, 'ulepszenia' = administrator ulepszeń (R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1). */
export type AdministratorRole = 'miasto' | 'ulepszenia';
export interface AdministratorChange { city: City; kind: AdministratorChangeKind; role: AdministratorRole }

/**
 * Odśwież stan administratorów (wołać na starcie tury ekonomii, po zatrudnieniu/zwolnieniu,
 * po wczytaniu zapisu i przed podglądem HUD):
 *   1. koniec służby: zmiana właściciela miasta (zdobycie) albo brak budynku administracyjnego
 *      (zburzenie / utrata) — administrator znika;
 *   2. finansowanie: dla każdego ownera administratorzy (w kolejności tablicy `cities`) pracują,
 *      dopóki skarbiec państwa (`treasuryOf(owner)`) pokrywa narastająco ich utrzymanie;
 *      reszta NIE pracuje (zostaje przypisana, wraca do pracy, gdy skarbiec pokryje utrzymanie).
 * Zwraca listę zmian (do powiadomień).
 */
export function refreshAdministratorState(
  cities: ReadonlyArray<City>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  treasuryOf: (ownerId: number) => number,
): AdministratorChange[] {
  const changes: AdministratorChange[] = [];
  const remaining = new Map<number, number>();
  for (const city of cities) {
    const adm = city.administrator;
    if (!adm) continue;
    const builtIds = builtByCity.get(city.id) ?? [];
    if (adm.ownerId !== city.ownerId) {
      delete city.administrator;
      changes.push({ city, kind: 'ended_owner_changed', role: 'miasto' });
      continue;
    }
    const tier = administrativeBuildingTier(builtIds);
    if (tier === 0) {
      delete city.administrator;
      changes.push({ city, kind: 'ended_no_building', role: 'miasto' });
      continue;
    }
    if (!remaining.has(city.ownerId)) remaining.set(city.ownerId, treasuryOf(city.ownerId));
    const left = remaining.get(city.ownerId)!;
    const upkeep = administratorUpkeepForTier(tier);
    const was = adm.pracuje === true;
    if (left >= upkeep) {
      remaining.set(city.ownerId, left - upkeep);
      adm.pracuje = true;
      if (!was) changes.push({ city, kind: 'resumed', role: 'miasto' });
    } else {
      adm.pracuje = false;
      if (was) changes.push({ city, kind: 'stopped_no_funds', role: 'miasto' });
    }
  }
  // Przebieg 2: administratorzy ULEPSZEŃ — ten sam budżet skarbca państwa (po administratorach miast),
  // bez wymogu budynku (brak tieru => stawka z JSON); koniec służby tylko przy zmianie właściciela.
  for (const city of cities) {
    const adm = city.administratorUlepszen;
    if (!adm) continue;
    if (adm.ownerId !== city.ownerId) {
      delete city.administratorUlepszen;
      changes.push({ city, kind: 'ended_owner_changed', role: 'ulepszenia' });
      continue;
    }
    if (!remaining.has(city.ownerId)) remaining.set(city.ownerId, treasuryOf(city.ownerId));
    const left = remaining.get(city.ownerId)!;
    const upkeep = improvementAdministratorUpkeep();
    const was = adm.pracuje === true;
    if (left >= upkeep) {
      remaining.set(city.ownerId, left - upkeep);
      adm.pracuje = true;
      if (!was) changes.push({ city, kind: 'resumed', role: 'ulepszenia' });
    } else {
      adm.pracuje = false;
      if (was) changes.push({ city, kind: 'stopped_no_funds', role: 'ulepszenia' });
    }
  }
  return changes;
}

/**
 * AI: czy AI ma zatrudnić administratora w tym mieście (parytet z graczem: ten sam koszt,
 * ten sam budynek, płatność ze skarbca państwa). „Stać” = skarbiec ≥ koszt zatrudnienia +
 * rezerwa (N tur łącznego utrzymania administratorów PO zatrudnieniu).
 */
export function aiShouldHireAdministrator(
  city: Pick<City, 'ownerId' | 'administrator'>,
  builtIds: readonly string[],
  treasury: number,
  currentOwnerUpkeepAllWork: number,
): boolean {
  if (administratorHireBlockReason(city, builtIds, treasury) !== null) return false;
  const newUpkeep = administratorUpkeepForTier(administrativeBuildingTier(builtIds));
  const reserve = (currentOwnerUpkeepAllWork + newUpkeep) * administratorAiReserveTurns();
  return treasury >= administratorHireCost() + reserve;
}

/** Tekst stanu do tooltipa/UI. */
export function administratorStatusText(working: boolean): string {
  return working ? 'pracuje' : 'nie pracuje — brak środków w skarbcu państwa';
}
