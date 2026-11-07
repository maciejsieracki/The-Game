/**
 * k-ui3e-host.ts — cienkie adaptery typów REPIN UI-3-E (R-RUSTPORT-REPIN-WEB-UI-3-E-Q1), NIE kopie webu.
 *
 * ZAŁOŻENIE U3E-Z3: web woła `isCityUnderSiege([city], city)` (game/city-siege-state.ts, kopia w `k-ui3e-web.ts`)
 * z `City.id: string`; w porcie id miasta z DTO bywa `number` (K09B r2). Adapter mapuje miasto portu na kształt
 * `SiegeStateCity` (`String(id)`) i woła kopię webu bez zmiany reguły. Flaga `oblegane` przychodzi z DTO miasta
 * (producent: kontroler/silnik — P6; brak pola = nie oblegane, jak web dla `oblegane !== true`).
 */
import { isCityUnderSiege as isCityUnderSiegeWeb, type SiegeStateCity } from './k-ui3e-web';

/** Pola miasta portu czytane przez predykat oblężenia. */
export interface SiegeCityK {
  readonly id: number | string;
  readonly q: number;
  readonly r: number;
  readonly ownerId: number;
  readonly oblegane?: boolean;
}

const toSiege = (c: SiegeCityK): SiegeStateCity => ({ id: String(c.id), q: c.q, r: c.r, ownerId: c.ownerId, oblegane: c.oblegane });

/** Web `isCityUnderSiege(cities, city)` dla miast portu (ta sama reguła: `oblegane === true`). */
export function isCityUnderSiegeK(cities: ReadonlyArray<SiegeCityK>, target: SiegeCityK): boolean {
  return isCityUnderSiegeWeb(cities.map(toSiege), toSiege(target));
}
