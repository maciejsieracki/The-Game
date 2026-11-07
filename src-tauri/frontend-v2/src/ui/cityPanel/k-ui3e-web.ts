/**
 * k-ui3e-web.ts — ADAPTER REPIN UI-3-E (R-RUSTPORT-REPIN-WEB-UI-3-E-Q1): czyste deklaracje `gra/src/game/*` weba
 * `9b019a7d8`, wołane przez przepięte bloki K `cityPanel` (FALA 509–532). Port nie importuje `game/*`
 * (`check-no-logic-imports`), więc — jak adapter `armyStackLabel` (U3-Z2) — bloki są kopiami bajtowymi źródła
 * (z `export`), każdy pod markerem `// pin-adapter 9b019a7d8 <źródło>:A-B`. Bramka: `verify-repin-ui3-copies.mjs`
 * (sekcja `kblocksE.adapter`). ZAŁOŻENIE U3E-Z1: to prezentacja, stałe i predykat na polu DTO (`oblegane`); gdy kontroler
 * v2 poda gotowe wartości w DTO, bloki można zastąpić polami (P6).
 * `formatManpowerCompact` (game/manpower.ts) woła `formatCompactNumber` z UI — port ma jego bajtową kopię (UI-2-A).
 */
import { formatCompactNumber } from '../formatCompactNumber';

// pin-adapter 9b019a7d8 gra/src/game/citizen-consumption-era.ts:19-40
export const CITIZEN_CONSUMPTION_ERA_STEP = 0.5;

/** m(e) = 1 + 0,5 × (e − 1); era < 1 / NaN / nie-liczba → 1. Epoki ułamkowe są zaokrąglane w dół. */
export function citizenConsumptionEraMultiplier(era: number | null | undefined): number {
  if (typeof era !== 'number' || !Number.isFinite(era) || era < 1) return 1;
  return 1 + CITIZEN_CONSUMPTION_ERA_STEP * (Math.floor(era) - 1);
}

/**
 * Etykieta mnożnika do UI, np. „×1,5” (przecinek dziesiętny, bez zbędnych zer: „×2”).
 * Jedyne miejsce formatowania — tooltipy nie zaszywają stawek.
 */
export function formatCitizenConsumptionMult(era: number | null | undefined): string {
  const m = citizenConsumptionEraMultiplier(era);
  return `×${String(m).replace('.', ',')}`;
}

/** Liczba do UI z przecinkiem dziesiętnym i bez zbędnych zer (4,5 / 12 / 0,75). */
export function formatCitizenConsumptionNumber(v: number): string {
  if (!Number.isFinite(v)) return '0';
  return String(Math.round(v * 100) / 100).replace('.', ',');
}

// pin-adapter 9b019a7d8 gra/src/game/auto-build-gate.ts:48-48
export const AUTO_BUILD_DISABLED_HINT = 'Włącz automatyzację budowy w Ustawieniach';

// pin-adapter 9b019a7d8 gra/src/game/city-siege-state.ts:12-19
export interface SiegeStateCity {
  id: string;
  q: number;
  r: number;
  ownerId: number;
  oblegane?: boolean;
  oblegajacyOwnerId?: number;
}

// pin-adapter 9b019a7d8 gra/src/game/city-siege-state.ts:23-23
export const CITY_SIEGE_RECRUIT_BLOCK_PL = 'Miasto jest oblężone — rekrutacja zablokowana';

// pin-adapter 9b019a7d8 gra/src/game/city-siege-state.ts:30-43
export function isCityUnderSiege(
  cities: ReadonlyArray<SiegeStateCity>,
  target: string | { q: number; r: number } | SiegeStateCity,
): boolean {
  if (typeof target === 'string') {
    return cities.find(c => c.id === target)?.oblegane === true;
  }
  if ('id' in target && 'ownerId' in target) {
    // Obiekt miasta: bierzemy żywy stan z listy (gdy jest), inaczej z samego obiektu.
    const live = cities.find(c => c.id === target.id);
    return (live ?? target).oblegane === true;
  }
  return cities.some(c => c.q === target.q && c.r === target.r && c.oblegane === true);
}

// pin-adapter 9b019a7d8 gra/src/game/production.ts:172-172
export const RIVER_ONLY_BUILDING_IDS: ReadonlySet<string> = new Set(['mlyn']);

// pin-adapter 9b019a7d8 gra/src/game/manpower.ts:912-914
export function formatManpowerCompact(n: number): string {
  return formatCompactNumber(n);
}
