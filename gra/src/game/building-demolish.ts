/**
 * building-demolish.ts -- R-WEB-BUILDING-DEMOLISH-Q1 (odp. 22C właściciela, 2026-11-26).
 *
 * Akcja „Wyburz budynek”: gracz wyburza budynek swojego miasta i dostaje z powrotem POŁOWĘ
 * SUROWCÓW z kosztu budynku (zaokrąglenie w dół, per surowiec). Pieniądz i Praca NIE są zwracane
 * (22C mówi o surowcach).
 *
 * Reguła zwrotu (założenie, opisane w raporcie):
 *  - Miasto trzyma na liście `budynki` ID BIEŻĄCEGO poziomu (awans podmienia ID, np. palisada →
 *    mury_kamienne). Koszt poniesiony = suma kosztów surowcowych poziomów łańcucha 1..N,
 *    o ile łańcuch awansów był płacony po kolei.
 *  - Przerwanie łańcucha: poziom z `upgradeSkip` (przeskok) był budowany od zera, więc jego
 *    poprzednicy nie zostali poniesieni i nie wchodzą do sumy.
 *  - Zwrot = floor(suma / 2) dla każdego surowca; zwracane wpisy o wartości 0 są pomijane.
 *
 * Skutek: budynek znika z `builtByCity` (wszystkie poziomy tego ID), efekty znikają od następnej
 * tury (silnik czyta stan miasta). Kolejka produkcji zostaje bez zmian. Mennica: wyburzenie
 * dozwolone w każdym mieście; bonus Mennicy znika, bo resolver stolicy czyta już `builtByCity`.
 *
 * Moduł czysty: operuje na przekazanym stanie (miasta + mapa zbudowanych budynków), bez DOM.
 */

import buildingsJson from '../../data/buildings.json';
import { buildingStockCost, refundBuildingStockCostAcrossCities } from './building-stock-cost';
import { demolishBuildingIds } from './mennica-orphan';
import { isCityUnderSiege, type SiegeStateCity } from './city-siege-state';

/** Komunikat UI (PL) przy zablokowanym wyburzaniu: miasto oblężone. */
export const DEMOLISH_SIEGE_BLOCK_PL = 'Nie można wyburzać podczas oblężenia';

export interface DemolishBuildingDef {
  id: string;
  nazwa?: string;
  epokaWejscia?: number | null;
  koszt_surowce?: Record<string, number> | null;
  upgradeFrom?: string;
  upgradeSkip?: boolean;
}

export interface DemolishCityRef {
  id: string;
  ownerId: number;
  surowce?: Record<string, number>;
  /** Flaga oblężenia (jedyne źródło prawdy: city-siege-state.ts). Gdy true -- brak wyburzeń. */
  oblegane?: boolean;
}

export interface DemolishState {
  cities: DemolishCityRef[];
  builtByCity: Map<string, string[]>;
  /** Opcjonalnie: definicje budynków (domyślnie gra/data/buildings.json). */
  buildings?: ReadonlyArray<DemolishBuildingDef>;
}

export interface DemolishResult {
  /** true = budynek był w mieście i został usunięty. */
  removed: boolean;
  /** Zwrot surowców (już dopisany do puli ownera); pusty, gdy nic nie wrócono. */
  refund: Record<string, number>;
  /** Powód odmowy: 'siege' = miasto oblężone (wyburzanie zablokowane, bez zmian stanu). */
  blocked?: 'siege';
}

const DEFAULT_BUILDINGS = buildingsJson as unknown as ReadonlyArray<DemolishBuildingDef>;

function findDef(
  buildings: ReadonlyArray<DemolishBuildingDef>,
  id: string,
): DemolishBuildingDef | undefined {
  return buildings.find(b => b.id === id);
}

/**
 * Suma kosztów surowcowych poniesionych na budynek o danym ID (łańcuch awansów 1..N, patrz
 * nagłówek). Dla budynku bez łańcucha = koszt jego jedynego poziomu.
 */
export function paidStockCostForBuilding(
  buildingId: string,
  buildings: ReadonlyArray<DemolishBuildingDef> = DEFAULT_BUILDINGS,
): Record<string, number> {
  const total: Record<string, number> = {};
  const seen = new Set<string>();
  let cur = findDef(buildings, buildingId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    const cost = buildingStockCost(cur);
    for (const [k, v] of Object.entries(cost)) total[k] = (total[k] ?? 0) + v;
    if (cur.upgradeSkip === true) break;
    const from = (cur.upgradeFrom ?? '').trim();
    cur = from ? findDef(buildings, from) : undefined;
  }
  return total;
}

/**
 * Reguła zwrotu na poziomie surowca: połowa w dół. Wpisy, w których połowa wynosi 0, są pomijane.
 * Wydzielona, bo dla aktualnych danych (koszty zawsze parzyste: FALA2 ×2 i mnożnik ery 1/2/4)
 * zaokrąglenie nie jest widoczne w grze -- test sprawdza ją bezpośrednio na nieparzystych wartościach.
 */
export function refundFromPaidCost(paid: Record<string, number>): Record<string, number> {
  const refund: Record<string, number> = {};
  for (const [k, v] of Object.entries(paid)) {
    const half = Math.floor(v / 2);
    if (half > 0) refund[k] = half;
  }
  return refund;
}

/** Zwrot = połowa (w dół) surowców poniesionych na budynek. Wpisy 0 są pomijane. */
export function demolishRefundFor(
  buildingId: string,
  buildings: ReadonlyArray<DemolishBuildingDef> = DEFAULT_BUILDINGS,
): Record<string, number> {
  return refundFromPaidCost(paidStockCostForBuilding(buildingId, buildings));
}

/**
 * Czy wyburzanie w mieście jest zablokowane przez oblężenie (dowolny budynek, w tym Mennica,
 * Pałac i mury: bez wyjątków poza oblężeniem, odp. 28a właściciela).
 */
export function isDemolishBlockedBySiege(
  cities: ReadonlyArray<DemolishCityRef>,
  cityId: string,
): boolean {
  return isCityUnderSiege(cities as ReadonlyArray<SiegeStateCity>, cityId);
}

/**
 * Wyburza budynek `buildingId` w mieście `cityId`. Usuwa wszystkie wpisy tego ID z listy
 * zbudowanych budynków miasta i dopisuje zwrot do puli surowców ownera miasta.
 * Gdy budynku nie ma (lub miasta nie ma), nic nie zmienia i zwraca `removed: false`.
 * Gdy miasto jest oblężone, nic nie zmienia i zwraca `removed: false, blocked: 'siege'`.
 * Mutuje `state.builtByCity` i surowce miast; nie rusza kolejki produkcji.
 */
export function demolishBuilding(
  state: DemolishState,
  cityId: string,
  buildingId: string,
): DemolishResult {
  const city = state.cities.find(c => c.id === cityId);
  if (!city) return { removed: false, refund: {} };
  if (isDemolishBlockedBySiege(state.cities, cityId)) return { removed: false, refund: {}, blocked: 'siege' };
  const built = state.builtByCity.get(cityId) ?? [];
  const next = demolishBuildingIds(built, buildingId);
  if (next === null) return { removed: false, refund: {} };

  state.builtByCity.set(cityId, next);
  const refund = demolishRefundFor(buildingId, state.buildings ?? DEFAULT_BUILDINGS);
  refundBuildingStockCostAcrossCities(state.cities, city.ownerId, refund);
  return { removed: true, refund };
}
