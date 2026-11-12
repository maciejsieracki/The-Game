//! P6 SIEGE-TAKTYKA K5I-2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2-Q1): czyste wejscia ciosu `_singleBlow` wyliczane z pinu.
//!
//! Zakres TEGO pliku (runda 1, czesciowy): wyłącznie male helpery z pinu `07d2fbd72`, ktorych cialo jest
//! jednoznaczne i nie wymaga stanu sceny:
//! * [`flank_rear_defense_penalty`] = `flankRearDefensePenalty` (`gra/src/game/combat.ts:589-605`).
//! * [`terrain_river_attack_multiplier`] = `terrainRiverAttackMultiplier` (`combat.ts:677-684`),
//!   z wejsciem logicznym "kafel jest rzeka" i "wiersz rzeki istnieje w terrain-combat.json" zamiast nazwy terenu.
//! * [`field_fortify_defense_bonus`] = `fieldFortifyDefenseBonus` (`gra/src/game/city-defense.ts:237-245`).
//!
//! NIE PORTOWANE w tej rundzie (patrz raport 01-operator-r1.md): `toCombatUnit` (`battleScene.ts:1355`),
//! `relativeHit` (`battleScene.ts:385`, wymaga `facingToward`/`oppositeDir`), `terrainDefenseMultiplier` z
//! nazwami terenu (fuzzy match `normTerrain`), `cityGatedTerrainMultiplier`, `_wallBonusProcFor`,
//! `isFordTile`/`isShoreAdjacentToFord`, `battleUnitDifficultyCombatMult` i zlozenie `defFinalObrona`,
//! `atkMelee`, `roundAtkCharge`, `ctrAtkVsDef` w jedno `BlowInput`. Juz istniejace porty, z ktorych
//! zlozenie ma korzystac: `civ_bonuses::civ_combat_stat_multipliers`, `civ_bonuses::apply_multiplier`,
//! `civ_bonuses::civ_wall_defense_multiplier`, `combat::counter_multiplier`, `unit_power::ranged_damage_mult_for`,
//! `unit_power::ranged_shot_accuracy`.

use crate::domain::siege_tactics_blow::HitArc;

/// `flankRearDefensePenalty` (combat.ts:589-605): kara obrony z flanki/tylu jako ulamek.
///
/// `kara_flanka_proc` / `kara_tyl_proc` to pola jednostki "Kara obrony z flanki (%)" / "z tylu (%)" w procentach
/// calkowitych (np. 50 = 50%). `None` daje 0. NaN daje 0 (pin: `isNaN(val)`).
///
/// UWAGA (zarzut 4 Evaluatora K5I2): pin (`combat.ts:589-605`) przyjmuje tez tekst (`parseFloat`, np. "50"),
/// pusty string `''` i `'---'` jako brak wartosci. Ta normalizacja surowego pola nalezy do `toCombatUnit`
/// (`battleScene.ts:1355`), ktore NIE jest jeszcze zportowane (kryterium 1 niespelnione). Helper zaklada
/// wejscie juz znormalizowane do `Option<f64>`; nie modeluje tekstu i nie jest tu dowodzona zgodnosc z `parseFloat`.
pub fn flank_rear_defense_penalty(
    kara_flanka_proc: Option<f64>,
    kara_tyl_proc: Option<f64>,
    arc: HitArc,
) -> f64 {
    let raw = match arc {
        HitArc::Front => return 0.0,
        HitArc::Flank => kara_flanka_proc,
        HitArc::Rear => kara_tyl_proc,
    };
    match raw {
        Some(v) if !v.is_nan() => v / 100.0,
        _ => 0.0,
    }
}

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

/// `fieldFortifyDefenseBonus` (city-defense.ts:237-245): +`fortify_obrona_proc`% Obrony gdy jednostka
/// jest ufortyfikowana w polu; inaczej bez zmian. Dziala wylacznie na Obronie (wywolujacy nie stosuje na Ataku).
pub fn field_fortify_defense_bonus(
    base_obrona: f64,
    is_fortified_in_field: bool,
    fortify_obrona_proc: f64,
) -> f64 {
    if is_fortified_in_field {
        base_obrona * (1.0 + fortify_obrona_proc / 100.0)
    } else {
        base_obrona
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kara_flank_rear_jak_w_pinie() {
        assert_eq!(
            flank_rear_defense_penalty(Some(50.0), Some(30.0), HitArc::Front),
            0.0
        );
        assert_eq!(
            flank_rear_defense_penalty(Some(50.0), Some(30.0), HitArc::Flank),
            0.5
        );
        assert_eq!(
            flank_rear_defense_penalty(Some(50.0), Some(30.0), HitArc::Rear),
            0.3
        );
        assert_eq!(
            flank_rear_defense_penalty(None, Some(30.0), HitArc::Flank),
            0.0
        );
        assert_eq!(
            flank_rear_defense_penalty(Some(f64::NAN), None, HitArc::Flank),
            0.0
        );
        assert_eq!(flank_rear_defense_penalty(None, None, HitArc::Rear), 0.0);
    }

    #[test]
    fn mnoznik_rzeki_tylko_dla_rzeki_z_wierszem() {
        assert_eq!(terrain_river_attack_multiplier(true, true, 0.75), 0.75);
        assert_eq!(terrain_river_attack_multiplier(true, false, 0.75), 1.0);
        assert_eq!(terrain_river_attack_multiplier(false, true, 0.75), 1.0);
    }

    #[test]
    fn fortyfikacja_w_polu_tylko_gdy_ufortyfikowana() {
        assert_eq!(field_fortify_defense_bonus(40.0, true, 50.0), 60.0);
        assert_eq!(field_fortify_defense_bonus(40.0, false, 50.0), 40.0);
        assert!(field_fortify_defense_bonus(f64::NAN, true, 50.0).is_nan());
    }
}
