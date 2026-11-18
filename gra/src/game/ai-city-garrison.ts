/**
 * R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 -- wspolna regula "stały garnizon" miast AI.
 *
 * Zasada wlasciciela: kazde miasto AI trzyma minimum jedna jednostke bojowa takze w pokoju,
 * a ta jednostka NIE dolacza do armii (zbiorka, marsze, scalanie, wysylanie do generala).
 *
 * Garnizonem miasta jest deterministycznie wyliczana najslabsza kwalifikujaca sie jednostka
 * stojaca na heksie miasta (remis: leksykograficznie najmniejsze id). Dzieki temu nie ma
 * stanu do utrzymywania: kazda sciezka AI pyta te sama funkcje i dostaje ten sam wynik.
 *
 * Kwalifikuja sie wylacznie jednostki bojowe ladowe: bez cywilow, zwiadowcow, wodza
 * (isGeneral), jednostek zaokretowanych (embarked), morskich (seaRaider, galera).
 * Jednostki spoza tej listy nie sa garnizonem i nie blokuja rekrutacji garnizonu.
 */
import { isCivilianUnit } from '../units/setup';
import type { RuntimeUnit } from '../units/setup';

/** Typ jednostki zwiadowcy (zgodnie z ai.ts SCOUT_TYPE_ID). */
const GARRISON_SCOUT_TYPE_ID = 'Zwiadowca';

/** Czy jednostka moze pelnic garnizon miasta (bojowa, ladowa, nie-wódz). */
export function isGarrisonEligibleUnit(u: RuntimeUnit): boolean {
  if (isCivilianUnit(u)) return false;
  if (u.typeId === GARRISON_SCOUT_TYPE_ID || u.category === 'zwiadowca') return false;
  if (u.isGeneral === true) return false;
  if (u.embarked === true || u.seaRaider === true) return false;
  if (u.category === 'galera') return false;
  return true;
}

/** Minimalny zakres pola miasta potrzebny do wyznaczenia garnizonu (heks wlasciciela). */
export interface GarrisonCityRef {
  readonly id: string;
  readonly q: number;
  readonly r: number;
}

/**
 * Mapa cityId -> id jednostki garnizonu (najslabsza kwalifikujaca sie jednostka wlasciciela
 * na heksie miasta). Miasto bez kwalifikujacej sie jednostki nie ma wpisu.
 * `strengthOf` to sila bojowa z ai.ts (aiUnitCombatStrength); remis: id leksykograficznie.
 * Czysta funkcja: kolejnosc `cities` nie wplywa na wynik.
 */
export function getCityGarrisonUnitIds(
  cities: readonly GarrisonCityRef[],
  units: readonly RuntimeUnit[],
  ownerId: number,
  strengthOf: (u: RuntimeUnit) => number,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const city of cities) {
    let best: RuntimeUnit | null = null;
    let bestStrength = 0;
    for (const u of units) {
      if (u.ownerId !== ownerId || u.q !== city.q || u.r !== city.r) continue;
      if (!isGarrisonEligibleUnit(u)) continue;
      const s = strengthOf(u);
      if (best === null || s < bestStrength || (s === bestStrength && u.id < best.id)) {
        best = u;
        bestStrength = s;
      }
    }
    if (best !== null) out.set(city.id, best.id);
  }
  return out;
}

/** Zbior id jednostek garnizonow (do wykluczenia z puli armii, zbiorki i scalania). */
export function garrisonUnitIdSet(garrisonByCity: ReadonlyMap<string, string>): Set<string> {
  return new Set(garrisonByCity.values());
}

/**
 * Czy miasto potrzebuje rekrutacji garnizonu: nie ma na swoim heksie zadnej jednostki
 * kwalifikujacej sie na garnizon (cywile, zwiadowcy, wodz, zaokretowani sie nie licza).
 */
export function cityNeedsGarrison(
  city: GarrisonCityRef,
  units: readonly RuntimeUnit[],
  ownerId: number,
): boolean {
  return !units.some(u => u.ownerId === ownerId && u.q === city.q && u.r === city.r
    && isGarrisonEligibleUnit(u));
}

/**
 * R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 (r3, wariant C): czy zakup `candId` jest zakupem
 * PRIORYTETOWYM garnizonu pustego miasta. Tylko najtanszy garnizon (`garrisonUnitId`, dla AI
 * Wojownik) w miescie bez kwalifikujacej sie jednostki bojowej; drozsze jednostki nie dostaja
 * priorytetu ani omijania runway/rezerwy.
 */
export function isGarrisonPriorityPurchase(
  city: GarrisonCityRef,
  units: readonly RuntimeUnit[],
  ownerId: number,
  candId: string,
  garrisonUnitId: string,
): boolean {
  return candId === garrisonUnitId && cityNeedsGarrison(city, units, ownerId);
}

/**
 * Maksymalna liczba pustych miast, na ktore jednorazowo rezerwujemy zloto (wariant C). Sufit
 * chroni ekonomie przed zamrozeniem skarbca, gdy pustych miast jest dziesiatki (FC r2, zarzut 6):
 * garnizony i tak powstaja kolejno -- rezerwa wystarcza na najblizsze zakupy, nie na wszystkie naraz.
 * ZALOZENIE robocze (do zatwierdzenia przez wlasciciela).
 */
export const GARRISON_RESERVE_MAX_CITIES = 3;

/**
 * Czysta funkcja rezerwy zlota na garnizony: `pendingCities` pustych miast wlasciciela, `unitCost`
 * cena garnizonu (Wojownik). Rezerwa = min(pending, sufit) * cena; brak ceny/pustych miast -> 0.
 */
export function garrisonGoldReserve(
  pendingCities: number,
  unitCost: number,
  maxCities: number = GARRISON_RESERVE_MAX_CITIES,
): number {
  if (!(pendingCities > 0) || !(unitCost > 0)) return 0;
  return Math.min(Math.floor(pendingCities), Math.max(0, Math.floor(maxCities))) * unitCost;
}

/** Minimalny opis jednostki z units.json potrzebny do wyboru typu garnizonu. */
export interface GarrisonUnitDef {
  readonly Jednostka: string;
  readonly Typ?: string | null;
  readonly Klasa?: string | null;
  readonly 'Pieniądz (koszt)'?: number | null;
  readonly 'Utrzymanie (Pieniądz/turę)'?: number | null;
}

/** Typy jednostek, ktore NIE moga byc garnizonem (cywil/zwiad, machina, statek). */
const GARRISON_EXCLUDED_TYPES: ReadonlySet<string> = new Set(['Civilian', 'Siege', 'Naval']);
/** Typy "wrecz" (preferowane na garnizon przed dystansem, gdy dostepne). */
const GARRISON_MELEE_TYPES: ReadonlySet<string> = new Set(['Swordsman', 'Spearman', 'Falangite', 'Offensive']);

/**
 * Czy definicja jednostki nadaje sie na garnizon: bojowa (piesza/konna), platna (koszt > 0 --
 * jednostki Super/zerokosztowe nie sa rekrutowane za zloto), nie cywil/zwiadowca/machina/statek.
 */
export function isGarrisonClassUnitDef(def: GarrisonUnitDef): boolean {
  const typ = (def.Typ ?? '').toString().trim();
  if (GARRISON_EXCLUDED_TYPES.has(typ)) return false;
  if (def.Jednostka === GARRISON_SCOUT_TYPE_ID) return false;
  if ((def.Klasa ?? '').toString().trim() === 'Super') return false;
  const cost = Number(def['Pieniądz (koszt)']);
  return Number.isFinite(cost) && cost > 0;
}

/**
 * R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 (r4): wybor typu garnizonu dla wlasciciela. DIAGNOZA r4
 * (seed 4242, hak per miasto): staly "Wojownik" jest w units.json dostepny tylko w epoce Kamien,
 * wiec po awansie epoki wlasciciele 13/22/28/1/19/25 nie mieli go w katalogu produkcji i miasta
 * zostawaly puste mimo pelnego skarbca (pickNull / pickOther). Garnizonem jest teraz NAJTANSZA
 * dostepna i oplacalna (surowce) jednostka bojowa; remis: wrecz przed dystansem, nizsze
 * utrzymanie, nazwa. `isAllowed` = bramka tech/epoka/zasoby produkcji, `canAfford` = pula surowcow.
 * Brak kandydata -> null (brak polecenia garnizonu w tej turze).
 */
export function pickGarrisonUnitId(
  defs: readonly GarrisonUnitDef[],
  isAllowed: (unitId: string) => boolean,
  canAfford: (unitId: string) => boolean,
): string | null {
  let best: GarrisonUnitDef | null = null;
  const rank = (d: GarrisonUnitDef): [number, number, number] => [
    Number(d['Pieniądz (koszt)']),
    GARRISON_MELEE_TYPES.has((d.Typ ?? '').toString().trim()) ? 0 : 1,
    Number(d['Utrzymanie (Pieniądz/turę)']) || 0,
  ];
  for (const d of defs) {
    if (!isGarrisonClassUnitDef(d)) continue;
    if (!isAllowed(d.Jednostka) || !canAfford(d.Jednostka)) continue;
    if (best === null) { best = d; continue; }
    const a = rank(d), b = rank(best);
    let cmp = 0;
    for (let i = 0; i < 3 && cmp === 0; i++) cmp = a[i]! - b[i]!;
    if (cmp < 0 || (cmp === 0 && d.Jednostka < best.Jednostka)) best = d;
  }
  return best === null ? null : best.Jednostka;
}
