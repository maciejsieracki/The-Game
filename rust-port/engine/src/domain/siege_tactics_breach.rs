//! P6 SIEGE-TAKTYKA K4 (#217): automat wylomu `wallEverBreached` jako czyste przejscia stanu.
//!
//! Port zdarzen z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`), ktore ustawiaja `this.wallEverBreached`:
//! * [`breach_wall_tile`] = `_breachWallTile` (`battleScene.ts:7638-7647`): usuniecie kafla z `wallTileHp`, `wallEverBreached = true`.
//!   Guard `if (!tiles) return;` (`:7640`) jest wejsciem jawnym `terrain_tiles_present`. Efekty terenu/siatki/logu: poza zakresem.
//! * [`attack_wall_tile`] = callback `_attackWallTile` (`battleScene.ts:7555-7565`, `_schedule(700)` `:7555`): `newHp = max(0, (wallTileHp.get(row) ?? 0) - dmg)`,
//!   zapis, a przy `newHp <= 0` wywolanie [`breach_wall_tile`] (`:7563`).
//! * [`breach_gate`] = `_breachGate` (`battleScene.ts:7757-7759`): `gateOpen = true`, `wallEverBreached = true`.
//! * [`attack_gate`] = `_attackGate` (`battleScene.ts:7311`, `:7327-7329`): guard `gateOpen || siegeGateCol < 0`,
//!   `gateHp = max(0, gateHp - dmg)`, przy `gateHp <= 0` wywolanie [`breach_gate`].
//! * [`tower_climb_enter_wall`] = wejscie na mur po wiezy w `_trySiegeTowerClimb` (`battleScene.ts:8072-8073`):
//!   `attackerWallEntryIsBreach(side, onWallWalkway=true) && !wallEverBreached` -> `wallEverBreached = true`.
//!   Warunek `attackerWallEntryIsBreach(side, w) = side === 'atk' && w === true` (`city-fortification.ts:96-98`) jest
//!   tu zwiniety w `side_atk && true`, bo wywolanie zawsze ma `onWallWalkway = true` (`:8070`).
//! * [`skip_instant_fallback`] = `_skipInstantFallback` (`battleScene.ts:3718-3721`): `siegeWallCol >= 0` i zywa
//!   jednostka oblezniczna w `atk` -> `wallEverBreached = true` (bez warunku `!wallEverBreached`, jak w webie).
//!
//! Stan muru ([`WallState`]) zawiera pola uzywane przez juz zportowane moduly: konwersja [`WallState::to_approach_state`]
//! daje [`ApproachWallState`] dla [`siege_approach_restricted`]; [`battle_winner`]/[`siege_no_breach_repels_attack`]
//! przyjmuja `wall_ever_breached` z tego stanu (test kompozycji w `tests/p6_siege_tactics_breach.rs`).
//!
//! Liczby JS: `Math.max(0, x)` zachowuje NaN (`js_max0`), porownania `<= 0` na NaN sa falszywe jak w JS.
//! Wejscia `dmg` sa juz policzone przez wywolujacego (`Math.max(1, Math.round(base))` w webie), NaN/Infinity przechodza.
//!
//! NIE portowano w tym module (BRAK, poza K4): `_resetSiegeForReplay` (`battleScene.ts:10520-10529`, zerowanie stanu
//! przy replayu), efekty sceny (animacje, `_spawnWallLabel`, `_schedule`, `_updateSiegeHud`, log), mutacje terenu
//! (`tiles[idx] = Plains`), zdejmowanie jednostek z muru (`:7660-7756`), `_destroyTowerAtRow` (zmienia `siegeTowers[].destroyed`,
//! NIE `towerAtWallRows`), ruch wejscia na mur (`ru.q = wallCol` itd.).
//! Patrz `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`, wiersze 15-18 i K4.

use std::collections::{BTreeMap, BTreeSet};

use super::siege_tactics_approach::ApproachWallState;

/// Stan muru/bramy/wiez potrzebny do automatu wylomu (pola sceny web).
#[derive(Debug, Clone, PartialEq)]
pub struct WallState {
    /// Web `this.siegeWallCol` (`< 0` = brak muru).
    pub wall_col: i32,
    /// Web `this.siegeGateCol` (`< 0` = brak bramy).
    pub gate_col: i32,
    /// Web `this.gateHp`.
    pub gate_hp: f64,
    /// Web `this.gateOpen`.
    pub gate_open: bool,
    /// Web `this.wallTileHp` (klucz = rzad, wartosc = HP kafla; obecnosc klucza = kafel zywy).
    pub wall_tile_hp: BTreeMap<i32, f64>,
    /// Web `this.siegeWallTilesInit`.
    pub wall_tiles_init: usize,
    /// Web `this.towerAtWallRows` (rzedy z wieza przy murze).
    pub tower_at_wall_rows: BTreeSet<i32>,
    /// Web `this.wallEverBreached`.
    pub wall_ever_breached: bool,
}

impl WallState {
    /// Web `tileBreached` z `_siegeApproachRestricted` (galaz d): `siegeWallTilesInit > 0 && wallTileHp.size < siegeWallTilesInit`.
    pub fn tile_breached(&self) -> bool {
        self.wall_tiles_init > 0 && self.wall_tile_hp.len() < self.wall_tiles_init
    }

    /// Rzut na [`ApproachWallState`] uzywany przez [`super::siege_tactics_approach::siege_approach_restricted`].
    pub fn to_approach_state(&self) -> ApproachWallState {
        ApproachWallState {
            wall_col_ge0: self.wall_col >= 0,
            gate_open: self.gate_open,
            wall_ever_breached: self.wall_ever_breached,
            wall_tiles_init: self.wall_tiles_init,
            wall_tiles_alive: self.wall_tile_hp.len(),
            tower_at_wall_rows_count: self.tower_at_wall_rows.len(),
        }
    }
}

// Wspolna implementacja (konsolidacja #110): `domain::js_math::js_max0`.
use crate::domain::js_math::js_max0;

/// Web `_breachWallTile(wallRow)` (`battleScene.ts:7638-7647`), skutki na stan wylomu.
///
/// `terrain_tiles_present` = web `this.terrainMap.tiles` nie jest `null` (inaczej `return` przed flaga).
pub fn breach_wall_tile(s: &WallState, wall_row: i32, terrain_tiles_present: bool) -> WallState {
    if !terrain_tiles_present {
        return s.clone();
    }
    let mut n = s.clone();
    n.wall_tile_hp.remove(&wall_row);
    n.wall_ever_breached = true;
    n
}

/// Web callback `_attackWallTile` po locie pocisku (`battleScene.ts:7555-7565`).
///
/// `curHp = wallTileHp.get(row) ?? 0`, `newHp = Math.max(0, curHp - dmg)`, `wallTileHp.set(row, newHp)`;
/// przy `newHp <= 0` -> [`breach_wall_tile`]. Brak klucza liczy sie jak HP 0 (jak w webie: ponowny trafiony wylom
/// ponownie wola `_breachWallTile`, co jest idempotentne dla flagi).
/// Guard `siegeWallCol < 0` jest po stronie wywolujacego (`:7541`, przed zaplanowaniem); patrz [`wall_attack_allowed`].
pub fn attack_wall_tile(
    s: &WallState,
    wall_row: i32,
    dmg: f64,
    terrain_tiles_present: bool,
) -> WallState {
    let cur = s.wall_tile_hp.get(&wall_row).copied().unwrap_or(0.0);
    let new_hp = js_max0(cur - dmg);
    let mut n = s.clone();
    n.wall_tile_hp.insert(wall_row, new_hp);
    if new_hp <= 0.0 {
        breach_wall_tile(&n, wall_row, terrain_tiles_present)
    } else {
        n
    }
}

/// Web guard `_attackWallTile` (`battleScene.ts:7541`): atak na mur tylko gdy `siegeWallCol >= 0`.
pub fn wall_attack_allowed(s: &WallState) -> bool {
    s.wall_col >= 0
}

/// Web `_breachGate()` (`battleScene.ts:7757-7759`), skutki na stan wylomu.
pub fn breach_gate(s: &WallState) -> WallState {
    let mut n = s.clone();
    n.gate_open = true;
    n.wall_ever_breached = true;
    n
}

/// Web `_attackGate` (`battleScene.ts:7310-7311`, `:7327-7329`): synchroniczny atak na bramę.
///
/// Guard `gateOpen || siegeGateCol < 0` -> brak zmiany. W przeciwnym razie `gateHp = max(0, gateHp - dmg)`,
/// a przy `gateHp <= 0` -> [`breach_gate`].
pub fn attack_gate(s: &WallState, dmg: f64) -> WallState {
    if s.gate_open || s.gate_col < 0 {
        return s.clone();
    }
    let mut n = s.clone();
    n.gate_hp = js_max0(s.gate_hp - dmg);
    if n.gate_hp <= 0.0 {
        breach_gate(&n)
    } else {
        n
    }
}

/// Web `_trySiegeTowerClimb` (`battleScene.ts:8070-8074`): skutek wejscia na mur po wiezy.
///
/// `side_atk` = `ru.side === 'atk'` (w webie inne strony wychodza wczesniej `return false`).
pub fn tower_climb_enter_wall(s: &WallState, side_atk: bool) -> WallState {
    let mut n = s.clone();
    // attackerWallEntryIsBreach(side, onWallWalkway = true) = side === 'atk' && true
    if side_atk && !n.wall_ever_breached {
        n.wall_ever_breached = true;
    }
    n
}

/// Web `_skipInstantFallback` (`battleScene.ts:3718-3721`, funkcja `:3715`): machina obleznicza w skladzie atakujacego = wylom.
///
/// `atk_has_alive_siege_unit` = `this.atk.some(u => !u.dead && isSiegeUnit(u.bu))`.
/// Guard `if (this.finished) return;` (`:3716`) jest po stronie wywolujacego.
pub fn skip_instant_fallback(s: &WallState, atk_has_alive_siege_unit: bool) -> WallState {
    let mut n = s.clone();
    if s.wall_col >= 0 && atk_has_alive_siege_unit {
        n.wall_ever_breached = true;
    }
    n
}

#[cfg(test)]
mod js_max0_zero_sign_tests {
    use super::js_max0;

    /// Zachowanie `Math.max(0, x)` na tym module: `-0` -> `+0`, NaN zachowany, skonczone bez zmian.
    #[test]
    fn js_max0_zero_sign_jak_math_max() {
        assert_eq!(js_max0(-0.0).to_bits(), 0.0_f64.to_bits());
        assert_eq!(js_max0(-3.0).to_bits(), 0.0_f64.to_bits());
        assert_eq!(js_max0(f64::NEG_INFINITY).to_bits(), 0.0_f64.to_bits());
        assert_eq!(js_max0(2.5), 2.5);
        assert!(js_max0(f64::NAN).is_nan());
    }
}
