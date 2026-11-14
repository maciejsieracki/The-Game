/**
 * unitEngineStats.ts — statystyki bojowe jednostki dla WYŚWIETLANIA (karty, tooltipy, miasto).
 *
 * DECYZJA WŁAŚCICIELA (2026-11-14, ABC nr 8 = A): statystyki SILNIKA są kanoniczne.
 * Karta/tooltip pokazują dokładnie to, czym liczy walka. Źródłem jest ten sam odczyt co
 * silnik: `combatUnitFromDef` (game/combat.ts) — NIE duplikujemy mapowania ani domyślnych.
 * Kolumny PL w units.json (`Atak`, `Obrona`, `Health`, `Pancerz`, ...) są tylko etykietami
 * legacy i NIE są źródłem wartości na karcie.
 */
import { combatUnitFromDef } from '../game/combat';

export interface UnitEngineStats {
  /** Atak w zwarciu — silnik: meleeAttack. */
  atak: number;
  /** Obrona w zwarciu — silnik: meleeDefence. */
  obrona: number;
  /** Punkty życia (maks.) — silnik: health. */
  hp: number;
  /** Pancerz — silnik: armor (fallback Pancerz). */
  pancerz: number;
  /** Przebicie — silnik: piercing (fallback Przebicie). */
  przebicie: number;
  /** Obrażenia broni — silnik: weaponDamage. */
  obrazeniaBroni: number;
  /** Atak dystansowy — silnik: missileAttack. */
  atakDystansowy: number;
}

/** Wartości bojowe jednostki dokładnie tak, jak czyta je silnik walki. */
export function unitEngineStats(def: Record<string, unknown>): UnitEngineStats {
  const c = combatUnitFromDef(def);
  return {
    atak: c.meleeAttack,
    obrona: c.meleeDefence,
    hp: c.health,
    pancerz: c.armor,
    przebicie: c.piercing,
    obrazeniaBroni: c.weaponDamage,
    atakDystansowy: c.missileAttack,
  };
}
