/**
 * map-attack-city.ts — routing kliku wrogiego miasta z mapy (F-P1-01).
 * PURE: bez DOM, bez main.ts. Wpięcie → Grupa F.
 * Spec: dyspozycje/_handoff/A-do-C_map-attack-city-F-P1-01.md
 */

import type { City } from '../game/cities';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, isCivilianUnit } from '../units/setup';
import {
  canInitiateSiege,
  classifyCityAttack,
  type MapSiegeContext,
} from '../game/mapSiegeDetect';
import { hasCityDefenders } from '../game/siegeDefenders';

export type MapEnemyCityClickAction =
  | { kind: 'not_enemy' }
  | { kind: 'siege_panel'; attacker: RuntimeUnit; ctx: MapSiegeContext }
  | { kind: 'attack_choice'; attacker: RuntimeUnit; ctx: MapSiegeContext }
  | { kind: 'field_battle'; attacker: RuntimeUnit; ctx: MapSiegeContext }
  | { kind: 'capture_empty'; attacker: RuntimeUnit; ctx: MapSiegeContext }
  | { kind: 'hint_no_adjacent'; cityName: string }
  | { kind: 'hint_civilian'; cityName: string }
  | { kind: 'hint_pick_attacker'; cityName: string; adjacentCount: number };

export { isCivilianUnit } from '../units/setup';

export interface ResolveEnemyCityClickInput {
  city: City;
  selectedUnit: RuntimeUnit | null;
  units: readonly RuntimeUnit[];
  /** Domyślnie 0 = gracz ludzki. */
  playerOwnerId?: number;
  /**
   * P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE (Maciej 2026-08-14): zasięg ataku
   * jednostki w heksach mapy (0 = zwarcie, wymaga adiacencji; patrz
   * game/combat.ts unitMapAttackRangeHex). Opcjonalny i domyślnie ZAWSZE 0
   * (adiacencja) — wywołania bez tego callbacku (np. istniejące testy tej
   * funkcji, które nie znają statów jednostek) zachowują dawne zachowanie
   * bez zmian.
   */
  unitAttackRangeHex?: (u: RuntimeUnit) => number;
}

/**
 * Jednostki gracza uprawnione do zainicjowania ataku na `city`: sąsiednie
 * (adiacencja, jak dotychczas — jedyna opcja dla miast z murem, bo oblężenie
 * — mapSiegeDetect.canInitiateSiege — wymaga fizycznej adiacencji NIEZALEŻNIE
 * od zasięgu i ta mechanika zostaje tu nietknięta) LUB, dla miast BEZ muru
 * (pole_bitwy/capture_empty — mur nigdy nie wchodzi tu w grę), jednostki
 * dystansowe w swoim zasięgu ataku. / EN: player units eligible to initiate
 * an attack on `city`: adjacent (as before — the only option for walled
 * cities, since sieging — mapSiegeDetect.canInitiateSiege — requires physical
 * adjacency REGARDLESS of range, and that mechanic is left untouched here)
 * OR, for unwalled cities (field_battle/capture_empty — the wall is never in
 * play there), ranged units within their attack range.
 */
function eligibleCityAttackers(
  city: City,
  units: readonly RuntimeUnit[],
  playerOwnerId: number,
  attackRangeHex: (u: RuntimeUnit) => number,
): RuntimeUnit[] {
  return units.filter(u => {
    if (u.ownerId !== playerOwnerId) return false;
    if (u.ruchLeft <= 0) return false;
    if (isCivilianUnit(u)) return false;
    // TEMAT #15: BRAK ataku z wody — jednostka zaokrętowana nie atakuje miast.
    if (u.embarked === true) return false;
    const dist = hexDistance(u.q, u.r, city.q, city.r);
    if (dist === 1) return true;
    if (city.maMur) return false;
    return dist <= attackRangeHex(u);
  });
}

function resolveAttacker(
  adjacent: RuntimeUnit[],
  selectedUnit: RuntimeUnit | null,
  playerOwnerId: number,
): RuntimeUnit | 'pick' | 'none' {
  if (adjacent.length === 0) return 'none';
  if (selectedUnit && selectedUnit.ownerId === playerOwnerId) {
    if (adjacent.some(u => u.id === selectedUnit.id)) return selectedUnit;
    return 'none';
  }
  if (adjacent.length === 1) return adjacent[0]!;
  return 'pick';
}

/** Klasyfikuje klik wrogiego miasta — co ma zrobić silnik (F). */
export function resolveEnemyCityClick(
  input: ResolveEnemyCityClickInput,
): MapEnemyCityClickAction {
  const { city, selectedUnit, units, playerOwnerId = 0 } = input;

  if (city.ownerId === playerOwnerId) {
    return { kind: 'not_enemy' };
  }

  if (city.oblegane) {
    const besieger = units.find(
      u =>
        u.ownerId !== city.ownerId &&
        hexDistance(u.q, u.r, city.q, city.r) === 1,
    );
    if (besieger) {
      return {
        kind: 'siege_panel',
        attacker: besieger,
        ctx: classifyCityAttack(besieger, city, units as RuntimeUnit[]),
      };
    }
  }

  // Zaznaczony cywil (osadnik/robotnik/zwiadowca) obok miasta → jasny komunikat,
  // zamiast mylącego "brak sąsiednich jednostek". Cywile nie zdobywają miast.
  if (selectedUnit && selectedUnit.ownerId === playerOwnerId &&
      isCivilianUnit(selectedUnit) &&
      hexDistance(selectedUnit.q, selectedUnit.r, city.q, city.r) === 1) {
    return { kind: 'hint_civilian', cityName: city.name };
  }

  const adjacent = eligibleCityAttackers(
    city, units, playerOwnerId, input.unitAttackRangeHex ?? (() => 0),
  );
  const attackerPick = resolveAttacker(adjacent, selectedUnit, playerOwnerId);

  if (attackerPick === 'none') {
    return { kind: 'hint_no_adjacent', cityName: city.name };
  }
  if (attackerPick === 'pick') {
    return {
      kind: 'hint_pick_attacker',
      cityName: city.name,
      adjacentCount: adjacent.length,
    };
  }

  const attacker = attackerPick;
  const ctx = classifyCityAttack(attacker, city, units as RuntimeUnit[]);

  if (ctx.tryb === 'oblezenie' && canInitiateSiege(attacker, city)) {
    return { kind: 'attack_choice', attacker, ctx };
  }

  if (!hasCityDefenders(city, units)) {
    return { kind: 'capture_empty', attacker, ctx };
  }

  return { kind: 'field_battle', attacker, ctx };
}
