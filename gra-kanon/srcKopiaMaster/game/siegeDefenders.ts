/**
 * siegeDefenders.ts — kto broni miasto przy szturmie / zdobyciu (C3-ST-1…3).
 * PURE: bez DOM. Kanon: docs/decyzje/C3-szturm-obrona.md
 */

import type { City } from './cities';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance } from '../units/setup';
import { makeMilitia, type SiegeUnit } from './siege';

/** Jednostki właściciela miasta w promieniu 1 heksa (przy murze / w mieście). */
export function defenderUnitsNearCity(
  city: City,
  units: readonly RuntimeUnit[],
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === city.ownerId &&
      hexDistance(u.q, u.r, city.q, city.r) <= 1,
  );
}

/**
 * C3-ST-1: Czy miasto ma kogo bronić przy szturmie?
 * Obrońcy = jednostka wroga dist≤1 LUB garnizon>0.
 * Ludność / populacja BEZ garnizonu ≠ obrońcy.
 */
export function hasCityDefenders(
  city: City,
  units: readonly RuntimeUnit[],
): boolean {
  if ((city.garnizon ?? 0) > 0) return true;
  return defenderUnitsNearCity(city, units).length > 0;
}

/** C3-ST-2: Szturm może pominąć preBattle / bitwę 3D. */
export function canCaptureCityWithoutBattle(
  city: City,
  units: readonly RuntimeUnit[],
): boolean {
  return !hasCityDefenders(city, units);
}

/** Puste [] ≠ lista ocalałych — wtedy gałąź winner (nie kasuj wszystkich). */
export function survivorsLiveSet(survivors?: ReadonlyArray<{ id: string }>): Set<string> | null {
  if (!survivors || survivors.length === 0) return null;
  return new Set(survivors.map(s => s.id));
}

/** Rekord statów syntetycznej Milicji (SS9c) — do unitDefFor w silniku. */
export function militiaDefRecord(m: SiegeUnit): Record<string, unknown> {
  return {
    'Jednostka': 'Milicja',
    meleeAttack: m.Atak,
    meleeDefence: m.Obrona,
    chargeBonus: m.Uderzenie,
    armor: m.Pancerz,
    piercing: m.Przebicie,
    health: m.Health,
    weaponDamage: Math.max(1, m.weaponDamage ?? m.Atak),
    missileAttack: 0,
    'Rola (linia)': m.rola,
    'Prog dezercji (% health)': null,
    'Zasieg ataku (hex)': null,
    'Ilosc pociskow': null,
    'Ruch w bitwie (heksy)': 0,
    'Kara obrony z flanki (%)': 50,
    'Kara obrony z tylu (%)': 80,
  };
}

export interface CityDefRosterResult {
  roster: RuntimeUnit[];
  /** id → def dla syntetycznej Milicji (gdy brak jednostek, jest garnizon). */
  militiaDefs: Map<string, Record<string, unknown>>;
}

/**
 * Obrońcy miasta (C1-Q4 / C3-ST-1): jednostki dist≤1 lub syntetyczna Milicja.
 * PURE — caller rejestruje militiaDefs w silniku przed unitDefFor.
 */
export function collectCityDefRoster(
  city: City,
  units: readonly RuntimeUnit[],
): CityDefRosterResult {
  const roster = defenderUnitsNearCity(city, units);
  const militiaDefs = new Map<string, Record<string, unknown>>();
  if (roster.length > 0) return { roster, militiaDefs };

  if ((city.garnizon ?? 0) <= 0) return { roster: [], militiaDefs };

  const pop = city.population ?? 0;
  const militia = makeMilitia(Math.max(pop, 5));
  if (!militia) return { roster: [], militiaDefs };

  const id = 'militia-' + city.id;
  militiaDefs.set(id, militiaDefRecord(militia));
  return {
    roster: [{
      id,
      ownerId: city.ownerId,
      typeId: 'Milicja',
      category: 'domyslny',
      q: city.q,
      r: city.r,
      ruch: 0,
      ruchLeft: 0,
    }],
    militiaDefs,
  };
}

/** Tytuł strony obrońcy w preBattle (miasto otwarte / szturm). */
export function defenderSideTitle(city: City, defRoster: readonly RuntimeUnit[]): string {
  if (defRoster.length === 0) return 'Brak';
  const lead = defRoster[0]!;
  if (lead.typeId === 'Milicja') {
    return 'Milicja (~' + Math.floor((city.population ?? 0) * 0.2) + ')';
  }
  return defRoster.length > 1 ? 'Garnizon (' + defRoster.length + ')' : lead.typeId;
}
