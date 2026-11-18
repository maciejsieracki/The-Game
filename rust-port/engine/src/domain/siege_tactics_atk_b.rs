//! P6 K5LOOP-SIEGE-ATK-B (T2b, dispatch `R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1`): czyste części gałęzi ATAKUJĄCEGO przy
//! murze, które niszczą mur i bramę (`gra/src/battle/battleScene.ts`, pin `07d2fbd72`):
//!
//! * [`SiegeStructStats`] + [`siege_structure_damage`] = `_siegeStructureDamage` (`:7505-7513`): obrażenia bramy
//!   `_attackGate` (`:7313`);
//! * [`wall_tile_damage`] = formuła obrażeń kafla muru `_attackWallTile` (`:7542-7545`);
//! * [`wall_retreat_cell`] = wybór pola odwrotu obrońcy z wyburzonego kafla muru (`_breachWallTile`, `:7704-7738`);
//! * stałe [`MORALE_GATE_BREACH`], [`MORALE_WALL_BREACH`] (`:1147-1148`), [`WALL_HIT_FLY_MS`] (`_schedule(700)`,
//!   `:7555`), [`RAM_ANIM_MS`] (`_animateRam` `duration = 320`, `:7342`), [`GATE_MAX_HP`] (`:4047`),
//!   [`WALL_TILE_HP`] (`:2507`);
//! * [`tower_destroyed_log`] = tekst `this.log.push` w `_destroyTowerAtRow` (`:4199`).
//!
//! WYKONANIE (stan muru i bramy, wyłom, odwrót obrońców, morale, wieże, akcje) jest w `ProdBody`
//! (`siege_tactics_loop.rs`). Ten moduł nie ma stanu ani skutków ubocznych.
//!
//! Statystyki jednostki (`unitRowStat(ru.bu.stats, ...)`, `combat.ts:158-176`) są WEJŚCIEM adaptera (T6): pin czyta je
//! z wiersza `units.json` z wartościami domyślnymi (`fallback`) i `combatNormField` (`'---'`, `null`, `NaN` = domyślna).
//! Adapter podaje wartości już rozwinięte (patrz pola [`SiegeStructStats`]).

use super::siege_tactics_approach::{BF_COLS, BF_ROWS};
use super::siege_tactics_blow::js_round;
use crate::domain::js_math::js_max;

/// Web `MORALE_GATE_BREACH = 5` (`battleScene.ts:1147`): wyłom bramy, `-5` morale każdemu żywemu obrońcy (`:7807`).
pub const MORALE_GATE_BREACH: f64 = 5.0;
/// Web `MORALE_WALL_BREACH = 0` (`battleScene.ts:1148`): wyłom kafla muru (`:7748`; `_checkRout` i tak wołane).
pub const MORALE_WALL_BREACH: f64 = 0.0;
/// Web `_schedule(700, ...)` w `_attackWallTile` (`:7555`): czas lotu kamienia katapulty do trafienia w mur.
pub const WALL_HIT_FLY_MS: f64 = 700.0;
/// Web `_animateRam`: `const duration = 320; // ms wirtualnych` (`:7342`).
pub const RAM_ANIM_MS: f64 = 320.0;
/// Web `this.gateHp = 400; // GATE_MAX_HP` (`_carveWallTiles`, `:4047`). Wartość inicjalna pola sceny to `0` (`:2454`).
pub const GATE_MAX_HP: f64 = 400.0;
/// Web `BattleScene.WALL_TILE_HP = 640` (`:2507`), HP kafla muru po `_carveWallTiles` (`:4053`).
pub const WALL_TILE_HP: f64 = 640.0;

/// Statystyki `ru.bu.stats` czytane przez `_siegeStructureDamage` i `_attackWallTile` (wejście adaptera, wartości już
/// rozwinięte przez `unitRowStat` z domyślnymi pinu).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SiegeStructStats {
    /// `unitRowStat(s, 'wallAttack', undefined, 0)` (`:7507`, `:7543`).
    pub wall_attack: f64,
    /// `unitRowStat(s, 'missileAttack', 'Atak dystansowy', 0)` (`:7509`, `:7542`).
    pub missile_attack: f64,
    /// `unitRowStat(s, 'chargeBonus', 'Uderzenie', unitRowStat(s, 'weaponDamage', 'Atak', 8))` (`:7511`).
    pub impact: f64,
    /// `unitRowStat(s, 'weaponDamage', 'Atak', 8)` (`:7544`).
    pub weapon_damage: f64,
}

/// Web `Math.max(a, Math.round(x))` (porównania JS: `NaN` propaguje).
fn max_round(floor: f64, x: f64) -> f64 {
    js_max(floor, js_round(x))
}

/// Web `_siegeStructureDamage(ru)` (`battleScene.ts:7505-7513`): obrażenia bramy od taranu.
///
/// `wall > 0` -> `max(1, round(wall))`; `rng > 0` -> `max(1, round(rng * 2))`; inaczej `max(12, round(imp * 2))`.
/// Porównania `> 0` są fałszywe dla `NaN` (jak w JS).
pub fn siege_structure_damage(s: &SiegeStructStats) -> f64 {
    if s.wall_attack > 0.0 {
        return max_round(1.0, s.wall_attack);
    }
    if s.missile_attack > 0.0 {
        return max_round(1.0, s.missile_attack * 2.0);
    }
    max_round(12.0, s.impact * 2.0)
}

/// Web `_attackWallTile` (`battleScene.ts:7542-7545`): `base = wall > 0 ? wall : (rng > 0 ? rng * 2 : weaponDamage)`,
/// `dmg = Math.max(1, Math.round(base))`.
pub fn wall_tile_damage(s: &SiegeStructStats) -> f64 {
    let base = if s.wall_attack > 0.0 {
        s.wall_attack
    } else if s.missile_attack > 0.0 {
        s.missile_attack * 2.0
    } else {
        s.weapon_damage
    };
    max_round(1.0, base)
}

/// Web `_breachWallTile` (`battleScene.ts:7704-7738`), wybór pola odwrotu obrońcy (nie katapulty) stojącego na
/// wyburzonym kaflu `(wall_col, wall_row)`. `occupied(c, r)` = `this.occByKey.has(cellKey(c, r))` NA STARCIE (z samą
/// jednostką na `(wall_col, wall_row)`), `passable(c, r)` = `this.terrainMap.passable(c, r)`.
///
/// Najpierw `retreatCol = min(BF_COLS - 1, wallCol + 1)` w tym samym wierszu (`:7706-7707`). Inaczej pętle
/// `dc = 1..=3`, `dr = 0..=2` (obie przerywane flagą `placed`), `rr` w `[wallRow + dr, wallRow - dr]`,
/// `cc = min(BF_COLS - 1, wallCol + dc)`, `rc = clamp(rr, 0, BF_ROWS - 1)` (`:7718-7735`). Wewnętrzna pętla po `rr`
/// NIE sprawdza `placed` (`:7721`): po przeniesieniu na `wallRow + dr` druga para (`wallRow - dr`) jest sprawdzana na
/// stanie po przeniesieniu (pole startowe zwolnione, nowe zajęte) i, jeśli wolna, jednostka przenosi się ponownie. Wynik
/// = pole po ostatnim przeniesieniu; `None` = jednostka zostaje (`// lub po prostu pozostań (nie ginie)`, `:7717`).
pub fn wall_retreat_cell(
    wall_col: i64,
    wall_row: i64,
    occupied: &dyn Fn(i64, i64) -> bool,
    passable: &dyn Fn(i64, i64) -> bool,
) -> Option<(i64, i64)> {
    let orig = (wall_col, wall_row);
    let retreat_col = (BF_COLS - 1).min(wall_col + 1);
    if !occupied(retreat_col, wall_row) && passable(retreat_col, wall_row) {
        return Some((retreat_col, wall_row));
    }
    let mut cur = orig;
    let occ_now =
        |cur: (i64, i64), c: i64, r: i64| (c, r) == cur || ((c, r) != orig && occupied(c, r));
    for dc in 1..=3_i64 {
        if cur != orig {
            break;
        }
        let cc = (BF_COLS - 1).min(wall_col + dc);
        for dr in 0..=2_i64 {
            if cur != orig {
                break;
            }
            for rr in [wall_row + dr, wall_row - dr] {
                let rc = rr.clamp(0, BF_ROWS - 1);
                if !occ_now(cur, cc, rc) && passable(cc, rc) {
                    cur = (cc, rc);
                }
            }
        }
    }
    (cur != orig).then_some(cur)
}

/// Web `_breachWallTile` (`:7642-7645`): `idx = wallRow * BF_COLS + wallCol; if (idx >= 0 && idx < tiles.length)`
/// (`tiles.length = BF_COLS * BF_ROWS`). Ten sam test dla bramy `_breachGate` (`:7768-7769`).
pub fn tile_index_in_bounds(col: i64, row: i64) -> bool {
    let idx = row * BF_COLS + col;
    (0..BF_COLS * BF_ROWS).contains(&idx)
}

/// Web `_destroyTowerAtRow` (`battleScene.ts:4199`): `'Wieza strzelnicza w wyłomie (rzad ' + wallRow + ') zburzona.'`.
pub fn tower_destroyed_log(row: i64) -> String {
    format!("Wieza strzelnicza w wyłomie (rzad {row}) zburzona.")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn st(w: f64, m: f64, i: f64, wd: f64) -> SiegeStructStats {
        SiegeStructStats {
            wall_attack: w,
            missile_attack: m,
            impact: i,
            weapon_damage: wd,
        }
    }

    #[test]
    fn obrazenia_bramy_jak_pin() {
        // Taran TW `wallAttack = 14` (komentarz pinu `:7312`).
        assert_eq!(siege_structure_damage(&st(14.0, 0.0, 9.0, 8.0)), 14.0);
        assert_eq!(siege_structure_damage(&st(0.4, 0.0, 9.0, 8.0)), 1.0);
        assert_eq!(siege_structure_damage(&st(0.0, 2.5, 9.0, 8.0)), 5.0);
        assert_eq!(siege_structure_damage(&st(0.0, 0.0, 3.0, 8.0)), 12.0);
        assert_eq!(siege_structure_damage(&st(0.0, 0.0, 7.5, 8.0)), 15.0);
        assert!(siege_structure_damage(&st(f64::NAN, f64::NAN, f64::NAN, 8.0)).is_nan());
        assert_eq!(
            siege_structure_damage(&st(f64::INFINITY, 0.0, 0.0, 0.0)),
            f64::INFINITY
        );
    }

    #[test]
    fn obrazenia_kafla_jak_pin() {
        assert_eq!(wall_tile_damage(&st(16.0, 0.0, 0.0, 8.0)), 16.0);
        assert_eq!(wall_tile_damage(&st(0.0, 3.0, 0.0, 8.0)), 6.0);
        assert_eq!(wall_tile_damage(&st(0.0, 0.0, 0.0, 8.0)), 8.0);
        assert_eq!(wall_tile_damage(&st(0.0, 0.0, 0.0, 0.2)), 1.0);
        assert!(wall_tile_damage(&st(0.0, 0.0, 0.0, f64::NAN)).is_nan());
    }

    /// `idx >= 0 && idx < tiles.length` (`:7642-7645`, `:7768-7769`), `tiles.length = BF_COLS * BF_ROWS`.
    #[test]
    fn indeks_kafla_w_zakresie_jak_pin() {
        assert!(tile_index_in_bounds(0, 0));
        assert!(tile_index_in_bounds(BF_COLS - 1, BF_ROWS - 1));
        assert!(!tile_index_in_bounds(0, -1));
        assert!(!tile_index_in_bounds(-1, 0));
        assert!(!tile_index_in_bounds(0, BF_ROWS));
        // JS liczy indeks liniowy: kolumna poza planszą w wierszu < ostatni trafia w kafel następnego wiersza.
        assert!(tile_index_in_bounds(BF_COLS, 0));
        assert!(!tile_index_in_bounds(BF_COLS, BF_ROWS - 1));
    }

    #[test]
    fn odwrot_z_muru_kolejnosc_pol() {
        let pass = |_: i64, _: i64| true;
        let only_self = |c: i64, r: i64| (c, r) == (40, 10);
        // Wolne pierwsze pole (wallCol + 1, wallRow).
        assert_eq!(wall_retreat_cell(40, 10, &only_self, &pass), Some((41, 10)));
        // Zajęte (41, 10): dr = 1 -> (41, 11), potem (41, 9) też wolne: pin przenosi ponownie (pętla `rr` bez `placed`).
        let blocked = |c: i64, r: i64| (c, r) == (40, 10) || (c, r) == (41, 10);
        assert_eq!(wall_retreat_cell(40, 10, &blocked, &pass), Some((41, 9)));
        // (41, 9) zajęte: zostaje (41, 11).
        let blocked2 = |c: i64, r: i64| blocked(c, r) || (c, r) == (41, 9);
        assert_eq!(wall_retreat_cell(40, 10, &blocked2, &pass), Some((41, 11)));
        // Krawędź: `min(BF_COLS - 1, …)` (kolumna muru 67) i `clamp` wiersza. `dr = 1`: przeniesienie na (67, 1), potem
        // `rr = -1` -> `clamp` = (67, 0): pole startowe jest już zwolnione, więc jednostka wraca na nie (zostaje).
        let edge = |c: i64, r: i64| (c, r) == (67, 0);
        assert_eq!(wall_retreat_cell(67, 0, &edge, &pass), None);
        let edge_pass = |c: i64, r: i64| (c, r) != (67, 0);
        assert_eq!(wall_retreat_cell(67, 0, &edge, &edge_pass), Some((67, 1)));
        assert_eq!(wall_retreat_cell(40, 10, &|_, _| true, &pass), None);
        assert_eq!(wall_retreat_cell(40, 10, &only_self, &|_, _| false), None);
    }
}
