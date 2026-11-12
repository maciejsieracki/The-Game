//! P6 SIEGE-TAKTYKA K5I-2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2-Q1): czyste wejscia ciosu `_singleBlow` wyliczane z pinu.
//!
//! Zakres TEGO pliku (runda 1, czesciowy): wyłącznie male helpery z pinu `07d2fbd72`, ktorych cialo jest
//! jednoznaczne i nie wymaga stanu sceny:
//! * `flankRearDefensePenalty` (`combat.ts:589-606`) PRZENIESIONA do `siege_tactics_inputs_pos.rs` (K5I2a2, z wektorami z pinu i modelem tekstu).
//! * [`terrain_river_attack_multiplier`] = `terrainRiverAttackMultiplier` (`combat.ts:677-684`),
//!   z wejsciem logicznym "kafel jest rzeka" i "wiersz rzeki istnieje w terrain-combat.json" zamiast nazwy terenu.
//! * `fieldFortifyDefenseBonus` przeniesiona do `siege_tactics_inputs_wall` (K5i-2a3, z wektorami z pinu).
//!
//! NIE PORTOWANE w tej rundzie (patrz raport 01-operator-r1.md): `toCombatUnit` (`battleScene.ts:1355`),
//! `relativeHit`/`facingToward`/`oppositeDir`/`isFordTile`/`isShoreAdjacentToFord`/`battleUnitDifficultyCombatMult` (od K5I2a2 w `siege_tactics_inputs_pos.rs`), `terrainDefenseMultiplier` z
//! nazwami terenu (fuzzy match `normTerrain`), `cityGatedTerrainMultiplier`, `_wallBonusProcFor`,
//! i zlozenie `defFinalObrona`,
//! `atkMelee`, `roundAtkCharge`, `ctrAtkVsDef` w jedno `BlowInput`. Juz istniejace porty, z ktorych
//! zlozenie ma korzystac: `civ_bonuses::civ_combat_stat_multipliers`, `civ_bonuses::apply_multiplier`,
//! `civ_bonuses::civ_wall_defense_multiplier`, `combat::counter_multiplier`, `unit_power::ranged_damage_mult_for`,
//! `unit_power::ranged_shot_accuracy`.

/// `terrainRiverAttackMultiplier` (combat.ts:677-684): `river_attack_mult` gdy kafel atakujacego jest rzeka
/// i wiersz "rzeka" istnieje w danych terenu; w przeciwnym razie 1.0. Wejscia logiczne zamiast nazw terenu.
pub fn terrain_river_attack_multiplier(
    tile_is_river: bool,
    river_row_in_terrain_data: bool,
    river_attack_mult: f64,
) -> f64 {
    if tile_is_river && river_row_in_terrain_data {
        river_attack_mult
    } else {
        1.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mnoznik_rzeki_tylko_dla_rzeki_z_wierszem() {
        assert_eq!(terrain_river_attack_multiplier(true, true, 0.75), 0.75);
        assert_eq!(terrain_river_attack_multiplier(true, false, 0.75), 1.0);
        assert_eq!(terrain_river_attack_multiplier(false, true, 0.75), 1.0);
    }
}
