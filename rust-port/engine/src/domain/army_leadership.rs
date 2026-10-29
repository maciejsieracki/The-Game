//! REPIN-WOJNA-NOWE-A: port `gra/src/game/army-leadership.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/army-leadership.ts:13-16 (`hasMilitaryAcademy`), :18-20
//! (`armyLeaderTitle`), :23-29 (`armyLeaderMoraleBonusFrac`), :32-36
//! (`moraleWithArmyLeaderBonus`), :39-54 (`armyMoraleRatioWithoutCommander`),
//! :57-63 (`commandersToWithdrawAfterArmyBreak`). Stale: `data/derived/war-leadership-params.json`.
//!
//! ZALOZENIE: `commandersToWithdrawAfterArmyBreak` zwraca indeksy jednostek w wejsciowym
//! slice (web zwraca obiekty; tu tożsamosc jednostki = jej pozycja w tablicy).

use serde_json::Value;
use std::sync::OnceLock;

const PARAMS_JSON: &str = include_str!("../../data/derived/war-leadership-params.json");

/// Tytul dowodcy wlasciciela (web: `ArmyLeaderTitle`). Teksty z `war-leadership-params.json`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArmyLeaderTitle {
    Base,
    Academy,
}

/// Jednostka do liczenia morale armii (web: `ArmyLeaderCombatant`).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct ArmyLeaderCombatant {
    pub is_army_commander: bool,
    pub morale: f64,
    pub morale_max: f64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
}

struct Params {
    academy_id: String,
    title_base: String,
    title_academy: String,
    bonus_base: f64,
    bonus_academy: f64,
}

fn params() -> &'static Params {
    static TABLE: OnceLock<Params> = OnceLock::new();
    TABLE.get_or_init(|| {
        let root: Value = serde_json::from_str(PARAMS_JSON).expect("war-leadership-params.json");
        let frac = |key: &str| -> f64 {
            root["premia_morale_frac"][key]
                .as_str()
                .unwrap_or_else(|| panic!("premia_morale_frac.{key} musi byc tekstem"))
                .parse::<f64>()
                .expect("premia_morale_frac: liczba")
        };
        let text = |v: &Value, key: &str| -> String {
            v.as_str()
                .unwrap_or_else(|| panic!("{key} musi byc tekstem"))
                .to_owned()
        };
        Params {
            academy_id: text(&root["akademia_wojskowa_id"], "akademia_wojskowa_id"),
            title_base: text(&root["tytul"]["bez_akademii"], "tytul.bez_akademii"),
            title_academy: text(&root["tytul"]["z_akademia"], "tytul.z_akademia"),
            bonus_base: frac("bez_akademii"),
            bonus_academy: frac("z_akademia"),
        }
    })
}

/// Tekst tytulu w grze (web zwraca `'Wódz' | 'Generał'`).
pub fn army_leader_title_text(title: ArmyLeaderTitle) -> &'static str {
    let p = params();
    match title {
        ArmyLeaderTitle::Base => p.title_base.as_str(),
        ArmyLeaderTitle::Academy => p.title_academy.as_str(),
    }
}

/// Web: `hasMilitaryAcademy` - czy w zbiorze id budynkow jest akademia wojskowa.
pub fn has_military_academy<'a>(built_building_ids: impl IntoIterator<Item = &'a str>) -> bool {
    let academy = params().academy_id.as_str();
    built_building_ids.into_iter().any(|id| id == academy)
}

/// Web: `armyLeaderTitle`.
pub fn army_leader_title<'a>(
    built_building_ids: impl IntoIterator<Item = &'a str>,
) -> ArmyLeaderTitle {
    if has_military_academy(built_building_ids) {
        ArmyLeaderTitle::Academy
    } else {
        ArmyLeaderTitle::Base
    }
}

/// Web: `armyLeaderMoraleBonusFrac`.
pub fn army_leader_morale_bonus_frac<'a>(
    commander_present: bool,
    built_building_ids: impl IntoIterator<Item = &'a str>,
) -> f64 {
    if !commander_present {
        return 0.0;
    }
    if has_military_academy(built_building_ids) {
        params().bonus_academy
    } else {
        params().bonus_base
    }
}

/// Web: `moraleWithArmyLeaderBonus` - `Math.ceil(base * (1 + bonus))` z ochronami.
pub fn morale_with_army_leader_bonus(base: f64, bonus_frac: f64) -> f64 {
    if !base.is_finite() || base <= 0.0 {
        return 0.0;
    }
    let bonus = if bonus_frac.is_finite() {
        bonus_frac.max(0.0)
    } else {
        0.0
    };
    (base * (1.0 + bonus)).ceil()
}

/// Web: `armyMoraleRatioWithoutCommander` - morale bez dowodcy; brak jednostek poza dowodca = 0.
pub fn army_morale_ratio_without_commander(units: &[ArmyLeaderCombatant]) -> f64 {
    let mut current = 0.0_f64;
    let mut starting = 0.0_f64;
    let mut has_commander = false;
    for unit in units {
        if unit.is_army_commander {
            has_commander = true;
            continue;
        }
        starting += unit.morale_max.max(0.0);
        if unit.dead || unit.fading_out || unit.routed {
            continue;
        }
        current += unit.morale.max(0.0);
    }
    if starting <= 0.0 {
        return if has_commander { 0.0 } else { 1.0 };
    }
    current / starting
}

/// Web: `commandersToWithdrawAfterArmyBreak` - indeksy dowodcow do wycofania (pusta lista,
/// gdy stosunek morale >= progu).
pub fn commanders_to_withdraw_after_army_break(
    units: &[ArmyLeaderCombatant],
    threshold: f64,
) -> Vec<usize> {
    if army_morale_ratio_without_commander(units) >= threshold {
        return Vec::new();
    }
    units
        .iter()
        .enumerate()
        .filter(|(_, u)| u.is_army_commander && !u.dead && !u.fading_out && !u.routed)
        .map(|(i, _)| i)
        .collect()
}
