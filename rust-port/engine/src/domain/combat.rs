use serde::{Deserialize, Serialize};

use super::UnitId;
use crate::data::derived::{combat_ai_multiplier_value, counter_multiplier_value};

/// A counter bonus supplied by the unit data for one opposing unit type.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CounterBonus {
    pub target_type: String,
    /// A multiplier, e.g. 1.5 means +50% effective attack.
    pub multiplier: f64,
}

impl CounterBonus {
    pub fn new(target_type: impl Into<String>, multiplier: f64) -> Self {
        Self {
            target_type: target_type.into(),
            multiplier,
        }
    }
}

/// Snapshot of one unit at the start of an auto-resolved battle.
///
/// The resolver never mutates this value. Current HP is deliberately kept
/// separate from max HP so the same function can resolve damaged units.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CombatUnit {
    pub id: UnitId,
    pub name: String,
    pub unit_type: String,
    pub attack: u32,
    pub defense: u32,
    pub impact: u32,
    pub armor: u32,
    pub piercing: u32,
    pub hp: u32,
    pub max_hp: u32,
    /// Morale is normally expressed as 0..=100. Values in 0..=1 are also
    /// accepted as a fraction for callers that already normalized morale.
    pub morale: u32,
    pub bonuses_vs_type: Vec<CounterBonus>,
}

impl CombatUnit {
    pub fn new(
        id: u64,
        name: impl Into<String>,
        unit_type: impl Into<String>,
        attack: u32,
        max_hp: u32,
        morale: u32,
    ) -> Self {
        Self {
            id: UnitId::new(id),
            name: name.into(),
            unit_type: unit_type.into(),
            attack,
            defense: 0,
            impact: 0,
            armor: 0,
            piercing: 0,
            hp: max_hp,
            max_hp,
            morale,
            bonuses_vs_type: Vec::new(),
        }
    }

    pub fn with_counter(mut self, target_type: impl Into<String>, multiplier: f64) -> Self {
        self.bonuses_vs_type
            .push(CounterBonus::new(target_type, multiplier));
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum Terrain {
    #[default]
    Plain,
    Forest,
    Hills,
    Mountain,
    River,
}

/// Compatibility aliases for callers using the plural English names.
impl Terrain {
    #[allow(non_upper_case_globals)]
    pub const Plains: Self = Self::Plain;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct DefenseStructures {
    pub wall: bool,
    pub fort: bool,
    pub outpost: bool,
}

pub type CombatStructures = DefenseStructures;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CombatInput {
    pub attacker: Vec<CombatUnit>,
    pub defender: Vec<CombatUnit>,
    pub terrain: Terrain,
    pub structures: DefenseStructures,
    pub is_siege: bool,
    /// Reserved for a future bounded variance model. The current model is
    /// deterministic even when this is supplied.
    pub seed: Option<u64>,
}

impl CombatInput {
    pub fn new(
        attacker: Vec<CombatUnit>,
        defender: Vec<CombatUnit>,
        terrain: Terrain,
        structures: DefenseStructures,
        is_siege: bool,
    ) -> Self {
        Self {
            attacker,
            defender,
            terrain,
            structures,
            is_siege,
            seed: None,
        }
    }

    pub fn with_seed(mut self, seed: u64) -> Self {
        self.seed = Some(seed);
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Winner {
    #[serde(rename = "atk")]
    Attacker,
    #[serde(rename = "def")]
    Defender,
    #[serde(rename = "draw")]
    Draw,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UnitCombatResult {
    pub id: u64,
    #[serde(rename = "hpPo")]
    pub hp_after: u32,
    #[serde(rename = "padl")]
    pub destroyed: bool,
    #[serde(rename = "rozbity")]
    pub broken: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CombatResult {
    pub winner: Winner,
    #[serde(rename = "attackerResult")]
    pub attacker_results: Vec<UnitCombatResult>,
    #[serde(rename = "defenderResult")]
    pub defender_results: Vec<UnitCombatResult>,
    #[serde(rename = "ocaleliAtk")]
    pub survivors_attacker: Vec<u64>,
    #[serde(rename = "ocaleliDef")]
    pub survivors_defender: Vec<u64>,
}

impl CombatResult {
    pub fn survivors_attacker(&self) -> usize {
        self.survivors_attacker.len()
    }

    pub fn survivors_defender(&self) -> usize {
        self.survivors_defender.len()
    }
}

/// Return a unit's counter multiplier against one target type.
///
/// Explicit data wins. The fallback is the editable table
/// `data/derived/counter-multipliers.json` (P3-23 etap 3), which mirrors every
/// confirmed attack counter in `gra/data/counters.json`; pairs outside the table
/// give 1.0 (no bonus).
pub fn counter_multiplier(
    attacker_type: &str,
    defender_type: &str,
    bonuses: &[CounterBonus],
) -> f64 {
    let defender = canonical_type(defender_type);
    if let Some(bonus) = bonuses
        .iter()
        .find(|bonus| canonical_type(&bonus.target_type) == defender)
    {
        return sanitize_multiplier(bonus.multiplier);
    }

    let attacker = canonical_type(attacker_type);
    // Macierz z data/derived/counter-multipliers.json (P3-23 etap 3, wiersz 35g).
    counter_multiplier_value(&attacker, &defender).unwrap_or(1.0)
}

/// Rola atakująca „dystans” / „flanka” z webu (ZAŁOŻENIE P3-22 sekcja 12):
/// dystans = `distance` / `slinger`, flanka (kawaleria) = `mount`.
fn is_ranged_or_cavalry(unit_type: &str) -> bool {
    matches!(
        canonical_type(unit_type).as_str(),
        "distance" | "slinger" | "mount"
    )
}

pub fn terrain_defense_multiplier(terrain: Terrain, attacker_ranged_or_cavalry: bool) -> f64 {
    match terrain {
        Terrain::Plain => 1.0,
        // Las: web gra/src/game/combat.ts:638 — 1.5 TYLKO wobec dystansu/flanki, inaczej 1.0.
        Terrain::Forest if attacker_ranged_or_cavalry => {
            combat_ai_multiplier_value("LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA")
        }
        Terrain::Forest => 1.0,
        // Wzgorze i gory: combat-ai-multipliers.json (P3-22 runda 4, web 1.5 / 1.75).
        Terrain::Hills => combat_ai_multiplier_value("HILL_DEFENSE_MULT"),
        Terrain::Mountain => combat_ai_multiplier_value("MOUNTAIN_DEFENSE_MULT"),
        Terrain::River => 1.0,
    }
}

pub fn structure_defense_multiplier(structures: DefenseStructures, is_siege: bool) -> f64 {
    if !is_siege {
        return 1.0;
    }

    // Percentage values are read from combat-ai-multipliers.json (P3-22 runda 4):
    // MUR 200%, fort terenowy 100%, posterunek 50%.
    // Regula P3-23 etap 3 (WALKA — struktury): web structureDefenseBonusFor
    // (gra/src/main.ts:26953-26979) zwraca JEDEN najwyzszy bonus, nie sume
    // (struktury nie kumuluja sie). Stad max, nie suma.
    let pct = |id: &str| combat_ai_multiplier_value(id) / 100.0;
    let mut best = 0.0_f64;
    if structures.wall {
        best = best.max(pct("MUR_BONUS_PROC"));
    }
    if structures.fort {
        best = best.max(pct("FORT_TERENOWY_BONUS_PROC"));
    }
    if structures.outpost {
        best = best.max(pct("POSTERUNEK_BONUS_PROC"));
    }
    1.0 + best
}

pub fn morale_factor(morale: u32) -> f64 {
    if morale <= 1 {
        morale as f64
    } else {
        (morale as f64 / 100.0).clamp(0.0, 1.0)
    }
}

/// Calculate the effective side strength used by auto-resolve.
///
/// `is_defender` controls whether terrain and siege structures apply. The
/// formula is the contract's `sum(attack_eff * current_hp * morale_factor)`;
/// counter, terrain and structure modifiers are kept explicit and pure.
pub fn effective_strength(
    units: &[CombatUnit],
    opposing_units: &[CombatUnit],
    terrain: Terrain,
    structures: DefenseStructures,
    is_defender: bool,
    is_siege: bool,
) -> f64 {
    let target_types: Vec<&str> = opposing_units
        .iter()
        .map(|unit| unit.unit_type.as_str())
        .collect();
    let attacker_ranged_or_cavalry = opposing_units
        .iter()
        .any(|unit| is_ranged_or_cavalry(&unit.unit_type));
    let terrain_multiplier = if is_defender {
        terrain_defense_multiplier(terrain, attacker_ranged_or_cavalry)
    } else {
        1.0
    };
    let structure_multiplier = if is_defender {
        structure_defense_multiplier(structures, is_siege)
    } else {
        1.0
    };

    units
        .iter()
        .map(|unit| {
            let counter = target_types
                .iter()
                .map(|target| counter_multiplier(&unit.unit_type, target, &unit.bonuses_vs_type))
                .fold(1.0, f64::max);
            let current_hp = unit.hp.min(unit.max_hp) as f64;
            unit.attack as f64
                * current_hp
                * morale_factor(unit.morale)
                * counter
                * terrain_multiplier
                * structure_multiplier
        })
        .sum()
}

/// Resolve an auto battle without renderer, scene state, or global state.
///
/// The stronger side wins. Losses are bounded and sensitive to the strength
/// ratio: at a close matchup the winner loses nearly 25% and the loser nearly
/// 75%; at a decisive matchup those bounds move toward 10% and 90%. A tie is
/// a draw with 50% losses on both sides.
/// Losses are distributed by `attack * current_hp` exposure, deterministically
/// and independently of input order.
pub fn resolve_combat(input: CombatInput) -> CombatResult {
    let mut attackers = input.attacker;
    let mut defenders = input.defender;
    attackers.sort_by_key(|unit| unit.id);
    defenders.sort_by_key(|unit| unit.id);

    let attacker_strength = effective_strength(
        &attackers,
        &defenders,
        input.terrain,
        input.structures,
        false,
        input.is_siege,
    );
    let defender_strength = effective_strength(
        &defenders,
        &attackers,
        input.terrain,
        input.structures,
        true,
        input.is_siege,
    );

    let winner = match (attackers.is_empty(), defenders.is_empty()) {
        (true, true) => Winner::Draw,
        (true, false) => Winner::Defender,
        (false, true) => Winner::Attacker,
        (false, false) if attacker_strength > defender_strength => Winner::Attacker,
        (false, false) if defender_strength > attacker_strength => Winner::Defender,
        (false, false) => Winner::Draw,
    };

    let (attacker_loss, defender_loss) = if attackers.is_empty() || defenders.is_empty() {
        (0.0, 0.0)
    } else {
        loss_fractions(attacker_strength, defender_strength, winner)
    };

    let attacker_results = apply_loss(&attackers, attacker_loss);
    let defender_results = apply_loss(&defenders, defender_loss);
    let survivors_attacker = attacker_results
        .iter()
        .filter(|result| !result.destroyed)
        .map(|result| result.id)
        .collect();
    let survivors_defender = defender_results
        .iter()
        .filter(|result| !result.destroyed)
        .map(|result| result.id)
        .collect();

    CombatResult {
        winner,
        attacker_results,
        defender_results,
        survivors_attacker,
        survivors_defender,
    }
}

pub fn resolve(input: CombatInput) -> CombatResult {
    resolve_combat(input)
}

fn apply_loss(units: &[CombatUnit], loss_fraction: f64) -> Vec<UnitCombatResult> {
    let total_hp: u32 = units.iter().map(|unit| unit.hp.min(unit.max_hp)).sum();
    if total_hp == 0 {
        return units
            .iter()
            .map(|unit| UnitCombatResult {
                id: unit.id.get(),
                hp_after: 0,
                destroyed: true,
                broken: false,
            })
            .collect();
    }

    let target_damage = ((total_hp as f64) * loss_fraction).round() as u32;
    let weights: Vec<u64> = units
        .iter()
        .map(|unit| {
            let hp = unit.hp.min(unit.max_hp) as u64;
            hp * u64::from(unit.attack.max(1))
        })
        .collect();
    let total_weight: u64 = weights.iter().sum();
    let mut damages = vec![0_u32; units.len()];
    let mut remainders: Vec<(usize, f64)> = Vec::with_capacity(units.len());

    if total_weight > 0 {
        for (index, weight) in weights.iter().enumerate() {
            let exact = target_damage as f64 * (*weight as f64) / total_weight as f64;
            damages[index] = exact.floor() as u32;
            remainders.push((index, exact.fract()));
        }
    }

    let assigned: u32 = damages.iter().sum();
    let mut remaining = target_damage.saturating_sub(assigned);
    remainders.sort_by(
        |(left_index, left_fraction), (right_index, right_fraction)| {
            right_fraction
                .total_cmp(left_fraction)
                .then_with(|| units[*left_index].id.cmp(&units[*right_index].id))
        },
    );
    for (index, _) in remainders {
        if remaining == 0 {
            break;
        }
        damages[index] = damages[index].saturating_add(1);
        remaining -= 1;
    }

    units
        .iter()
        .zip(damages)
        .map(|(unit, damage)| {
            let hp_after = unit.hp.min(unit.max_hp).saturating_sub(damage);
            let destroyed = hp_after == 0;
            let broken = !destroyed && hp_after.saturating_mul(4) <= unit.max_hp;
            UnitCombatResult {
                id: unit.id.get(),
                hp_after,
                destroyed,
                broken,
            }
        })
        .collect()
}

fn loss_fractions(attacker_strength: f64, defender_strength: f64, winner: Winner) -> (f64, f64) {
    match winner {
        Winner::Draw => (0.50, 0.50),
        Winner::Attacker => {
            let advantage = bounded_advantage(attacker_strength, defender_strength);
            let attacker_loss = (0.25 - 0.15 * advantage).clamp(0.10, 0.25);
            (attacker_loss, 1.0 - attacker_loss)
        }
        Winner::Defender => {
            let advantage = bounded_advantage(defender_strength, attacker_strength);
            let defender_loss = (0.25 - 0.15 * advantage).clamp(0.10, 0.25);
            (1.0 - defender_loss, defender_loss)
        }
    }
}

fn bounded_advantage(stronger_strength: f64, weaker_strength: f64) -> f64 {
    if stronger_strength <= 0.0 {
        return 0.0;
    }

    ((stronger_strength - weaker_strength).max(0.0)
        / (stronger_strength + weaker_strength).max(f64::EPSILON))
    .clamp(0.0, 1.0)
}

fn normalize_type(unit_type: &str) -> String {
    unit_type
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .flat_map(|character| character.to_lowercase())
        .collect()
}

fn canonical_type(unit_type: &str) -> String {
    match normalize_type(unit_type).as_str() {
        "spear" => "spearman".to_owned(),
        normalized => normalized.to_owned(),
    }
}

fn sanitize_multiplier(multiplier: f64) -> f64 {
    if multiplier.is_finite() && multiplier >= 0.0 {
        multiplier
    } else {
        1.0
    }
}

// ---------------------------------------------------------------------------
// P6.5B (R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1): port `gra/src/game/unit-building-bonuses.ts`
// (pin edb8fb56) - WYLACZNIE bonusy budynkow jednostek (dwie niezalezne sciezki: Pancerz i
// parametry miekkie). Listy id sciezek, maksima w pp, limit glebokosci lancucha i teksty:
// `data/derived/unit-building-bonuses.json`; procenty budynkow (`baza.mnoznik`) i lancuch
// `upgradeFrom` przychodza jako dane (`MnoznikBuildingLookup`, zrodlo: `data/buildings.json`).
// Liczby sa `f64` (semantyka JS: `NaN`, `-0`).
// ---------------------------------------------------------------------------

pub mod unit_building_bonuses {
    use std::collections::{HashMap, HashSet};

    use crate::data::derived::unit_building_bonuses_params;
    use crate::domain::recruitment::army_merge::js_max;
    use crate::domain::recruitment::manpower::js_number_to_string;

    /// Web `MnoznikBuildingLookup` (`unit-building-bonuses.ts:59`): `baza.mnoznik` jako liczba
    /// (`None` = brak `baza`, `baza: null`, brak `mnoznik` albo wartosc nie-liczbowa).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct MnoznikBuildingLookup {
        pub id: String,
        pub baza_mnoznik: Option<f64>,
        pub upgrade_from: Option<String>,
    }

    /// Web `ARMOR_BUILDING_IDS` (`unit-building-bonuses.ts:67`).
    pub fn armor_building_ids() -> &'static [String] {
        &unit_building_bonuses_params().sciezka_pancerz.budynki
    }

    /// Web `SOFT_STAT_BUILDING_IDS` (`unit-building-bonuses.ts:70`).
    pub fn soft_stat_building_ids() -> &'static [String] {
        &unit_building_bonuses_params().sciezka_parametry.budynki
    }

    /// Rola `baza.mnoznik` budynku (web: `'pancerz' | 'parametry' | null`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum MnoznikRole {
        Pancerz,
        Parametry,
    }

    /// Web `mnoznikRoleForBuildingId` (`unit-building-bonuses.ts:83`).
    pub fn mnoznik_role_for_building_id(id: &str) -> Option<MnoznikRole> {
        if armor_building_ids().iter().any(|b| b == id) {
            return Some(MnoznikRole::Pancerz);
        }
        if soft_stat_building_ids().iter().any(|b| b == id) {
            return Some(MnoznikRole::Parametry);
        }
        None
    }

    /// Web `mnoznikOf` (`unit-building-bonuses.ts:89`).
    fn mnoznik_of(building: Option<&MnoznikBuildingLookup>) -> f64 {
        match building.and_then(|b| b.baza_mnoznik) {
            Some(v) if v.is_finite() && v > 0.0 => v,
            _ => 0.0,
        }
    }

    /// Znaki obcinane przez web `String#trim` (WhiteSpace + LineTerminator wg ECMAScript; rozni sie
    /// od `char::is_whitespace`: U+FEFF tak, U+0085 nie).
    fn is_js_whitespace(c: char) -> bool {
        matches!(
            c,
            '\u{9}'..='\u{D}'
                | '\u{20}'
                | '\u{A0}'
                | '\u{1680}'
                | '\u{2000}'..='\u{200A}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202F}'
                | '\u{205F}'
                | '\u{3000}'
                | '\u{FEFF}'
        )
    }

    fn js_trim(text: &str) -> &str {
        text.trim_matches(is_js_whitespace)
    }

    /// Web `chainMnoznikContribution` (`unit-building-bonuses.ts:113`).
    fn chain_mnoznik_contribution(
        start_id: &str,
        by_id: &HashMap<&str, &MnoznikBuildingLookup>,
        allowed: &HashSet<&str>,
        counted_global: &mut HashSet<String>,
    ) -> f64 {
        let max_depth = unit_building_bonuses_params().max_glebokosc_lancucha;
        let mut total = 0.0;
        let mut cur: Option<String> = Some(start_id.to_owned());
        let mut depth = 0;
        let mut visited_this_chain: HashSet<String> = HashSet::new();
        while let Some(id) = cur.take() {
            if id.is_empty() || depth >= max_depth || visited_this_chain.contains(&id) {
                break;
            }
            visited_this_chain.insert(id.clone());
            let Some(building) = by_id.get(id.as_str()).copied() else {
                break;
            };
            if allowed.contains(id.as_str()) && !counted_global.contains(&id) {
                counted_global.insert(id.clone());
                total += mnoznik_of(Some(building));
            }
            let from = building.upgrade_from.as_deref().map_or("", js_trim);
            cur = if from.is_empty() {
                None
            } else {
                Some(from.to_owned())
            };
            depth += 1;
        }
        total
    }

    fn index_by_id(buildings: &[MnoznikBuildingLookup]) -> HashMap<&str, &MnoznikBuildingLookup> {
        // Web `new Map(buildings.map(b => [b.id, b]))`: pozniejszy wpis nadpisuje wczesniejszy.
        let mut by_id = HashMap::new();
        for building in buildings {
            by_id.insert(building.id.as_str(), building);
        }
        by_id
    }

    /// Web `sumMnoznikForPresentBuildings` (`unit-building-bonuses.ts:152`).
    fn sum_mnoznik_for_present_buildings(
        built_building_ids: Option<&[String]>,
        buildings: Option<&[MnoznikBuildingLookup]>,
        ids: &[String],
    ) -> f64 {
        let (Some(built_ids), Some(buildings)) = (
            built_building_ids.filter(|b| !b.is_empty()),
            buildings.filter(|b| !b.is_empty()),
        ) else {
            return 0.0;
        };
        let built: HashSet<&str> = built_ids.iter().map(String::as_str).collect();
        let by_id = index_by_id(buildings);
        let allowed: HashSet<&str> = ids.iter().map(String::as_str).collect();
        let mut counted: HashSet<String> = HashSet::new();
        let mut total = 0.0;
        for id in ids {
            if !built.contains(id.as_str()) {
                continue;
            }
            total += chain_mnoznik_contribution(id, &by_id, &allowed, &mut counted);
        }
        total
    }

    /// Web `cityArmorBonusPercent` (`unit-building-bonuses.ts:171`).
    pub fn city_armor_bonus_percent(
        built_building_ids: Option<&[String]>,
        buildings: Option<&[MnoznikBuildingLookup]>,
    ) -> f64 {
        sum_mnoznik_for_present_buildings(built_building_ids, buildings, armor_building_ids())
    }

    /// Web `citySoftStatBonusPercent` (`unit-building-bonuses.ts:179`).
    pub fn city_soft_stat_bonus_percent(
        built_building_ids: Option<&[String]>,
        buildings: Option<&[MnoznikBuildingLookup]>,
    ) -> f64 {
        sum_mnoznik_for_present_buildings(built_building_ids, buildings, soft_stat_building_ids())
    }

    /// Web `cumulativeMnoznikForBuildingId` (`unit-building-bonuses.ts:195`).
    pub fn cumulative_mnoznik_for_building_id(
        building_id: &str,
        buildings: Option<&[MnoznikBuildingLookup]>,
    ) -> f64 {
        let Some(buildings) = buildings.filter(|b| !b.is_empty()) else {
            return 0.0;
        };
        let Some(role) = mnoznik_role_for_building_id(building_id) else {
            return 0.0;
        };
        let ids = match role {
            MnoznikRole::Pancerz => armor_building_ids(),
            MnoznikRole::Parametry => soft_stat_building_ids(),
        };
        let by_id = index_by_id(buildings);
        let allowed: HashSet<&str> = ids.iter().map(String::as_str).collect();
        chain_mnoznik_contribution(building_id, &by_id, &allowed, &mut HashSet::new())
    }

    /// Web `UnitBuildingProgress` (`unit-building-bonuses.ts:212`); `None` = brak pola albo wartosc
    /// nie-liczbowa (web: `typeof !== 'number'`).
    #[derive(Debug, Clone, Copy, PartialEq, Default)]
    pub struct UnitBuildingProgress {
        pub pancerz_bonus_proc: Option<f64>,
        pub parametry_bonus_proc: Option<f64>,
    }

    fn positive_finite(value: Option<f64>) -> f64 {
        match value {
            Some(v) if v.is_finite() && v > 0.0 => v,
            _ => 0.0,
        }
    }

    /// Web `unitPancerzBonusProc` (`unit-building-bonuses.ts:218`).
    pub fn unit_pancerz_bonus_proc(unit: Option<&UnitBuildingProgress>) -> f64 {
        positive_finite(unit.and_then(|u| u.pancerz_bonus_proc))
    }

    /// Web `unitParametryBonusProc` (`unit-building-bonuses.ts:223`).
    pub fn unit_parametry_bonus_proc(unit: Option<&UnitBuildingProgress>) -> f64 {
        positive_finite(unit.and_then(|u| u.parametry_bonus_proc))
    }

    /// Web `UnitPathBadgeLevel` / `PathBadgeLevel` (`unit-building-bonuses.ts:292`, `:454`): 0-3.
    pub type UnitPathBadgeLevel = u8;
    /// Alias zgodnosci weba (`PathBadgeLevel`).
    pub type PathBadgeLevel = UnitPathBadgeLevel;

    /// Web `ARMOR_PATH_MAX_PP` (`unit-building-bonuses.ts:295`).
    pub fn armor_path_max_pp() -> f64 {
        unit_building_bonuses_params().sciezka_pancerz.max_pp
    }

    /// Web `SOFT_PATH_MAX_PP` (`unit-building-bonuses.ts:297`).
    pub fn soft_path_max_pp() -> f64 {
        unit_building_bonuses_params().sciezka_parametry.max_pp
    }

    /// Web `PATH_A_MAX_PP` (alias `ARMOR_PATH_MAX_PP`, `unit-building-bonuses.ts:456`).
    pub fn path_a_max_pp() -> f64 {
        armor_path_max_pp()
    }

    /// Web `PATH_B_MAX_PP` (alias `SOFT_PATH_MAX_PP`, `unit-building-bonuses.ts:458`).
    pub fn path_b_max_pp() -> f64 {
        soft_path_max_pp()
    }

    /// Granice tercji sciezki: `[floor(max/3), floor(2*max/3)]` (liczba tercji z tabeli).
    fn level_bounds(max_pp: f64) -> [f64; 2] {
        let tercje = unit_building_bonuses_params().liczba_tercji;
        let first = 1.0;
        let second = first + 1.0;
        [
            (max_pp * first / tercje).floor(),
            ((max_pp * second) / tercje).floor(),
        ]
    }

    /// Web `ARMOR_PATH_LEVEL_MAX_PP` (`unit-building-bonuses.ts:300`).
    pub fn armor_path_level_max_pp() -> [f64; 2] {
        level_bounds(armor_path_max_pp())
    }

    /// Web `SOFT_PATH_LEVEL_MAX_PP` (`unit-building-bonuses.ts:306`).
    pub fn soft_path_level_max_pp() -> [f64; 2] {
        level_bounds(soft_path_max_pp())
    }

    /// Web `pathBadgeLevelFromPp` (`unit-building-bonuses.ts:312`).
    pub fn path_badge_level_from_pp(pp: f64, bounds: &[f64; 2]) -> UnitPathBadgeLevel {
        if !pp.is_finite() || pp <= 0.0 {
            return 0;
        }
        if pp <= bounds[0] {
            return 1;
        }
        if pp <= bounds[1] {
            return 2;
        }
        3
    }

    /// Web `armorPathBadgeLevel` (`unit-building-bonuses.ts:325`).
    pub fn armor_path_badge_level(unit: Option<&UnitBuildingProgress>) -> UnitPathBadgeLevel {
        path_badge_level_from_pp(unit_pancerz_bonus_proc(unit), &armor_path_level_max_pp())
    }

    /// Web `softPathBadgeLevel` (`unit-building-bonuses.ts:334`).
    pub fn soft_path_badge_level(unit: Option<&UnitBuildingProgress>) -> UnitPathBadgeLevel {
        path_badge_level_from_pp(unit_parametry_bonus_proc(unit), &soft_path_level_max_pp())
    }

    /// Web `unitPancerzBonusFrac` (`unit-building-bonuses.ts:339`).
    pub fn unit_pancerz_bonus_frac(unit: Option<&UnitBuildingProgress>) -> f64 {
        unit_pancerz_bonus_proc(unit) / percent_base()
    }

    /// Web `unitParametryBonusFrac` (`unit-building-bonuses.ts:344`).
    pub fn unit_parametry_bonus_frac(unit: Option<&UnitBuildingProgress>) -> f64 {
        unit_parametry_bonus_proc(unit) / percent_base()
    }

    /// Podstawa procentu (`/ 100` weba): `podstawa_procentu` w `unit-building-bonuses.json`.
    fn percent_base() -> f64 {
        unit_building_bonuses_params().podstawa_procentu
    }

    /// Wynik `bestBuildingProgressAfterCityVisit`.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct BestBuildingProgress {
        pub pancerz_bonus_proc: f64,
        pub parametry_bonus_proc: f64,
    }

    /// Web `bestBuildingProgressAfterCityVisit` (`unit-building-bonuses.ts:359`).
    pub fn best_building_progress_after_city_visit(
        unit: Option<&UnitBuildingProgress>,
        built_building_ids: Option<&[String]>,
        buildings: Option<&[MnoznikBuildingLookup]>,
    ) -> BestBuildingProgress {
        let city_armor = city_armor_bonus_percent(built_building_ids, buildings);
        let city_soft = city_soft_stat_bonus_percent(built_building_ids, buildings);
        BestBuildingProgress {
            pancerz_bonus_proc: js_max(unit_pancerz_bonus_proc(unit), city_armor),
            parametry_bonus_proc: js_max(unit_parametry_bonus_proc(unit), city_soft),
        }
    }

    /// Web `buildingProgressWouldChange` (`unit-building-bonuses.ts:373`).
    pub fn building_progress_would_change(
        unit: Option<&UnitBuildingProgress>,
        built_building_ids: Option<&[String]>,
        buildings: Option<&[MnoznikBuildingLookup]>,
    ) -> bool {
        let next = best_building_progress_after_city_visit(unit, built_building_ids, buildings);
        next.pancerz_bonus_proc != unit_pancerz_bonus_proc(unit)
            || next.parametry_bonus_proc != unit_parametry_bonus_proc(unit)
    }

    /// Web `BuildingBonusGain` (`unit-building-bonuses.ts:384`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct BuildingBonusGain {
        pub changed: bool,
        pub armor_gained: f64,
        pub soft_gained: f64,
        pub armor_total: f64,
        pub soft_total: f64,
    }

    /// Web `applyCityVisitBonusGain` (`unit-building-bonuses.ts:396`). Mutuje pola procentowe.
    pub fn apply_city_visit_bonus_gain(
        unit: &mut UnitBuildingProgress,
        built_building_ids: Option<&[String]>,
        buildings: Option<&[MnoznikBuildingLookup]>,
    ) -> BuildingBonusGain {
        let prev_armor = unit_pancerz_bonus_proc(Some(unit));
        let prev_soft = unit_parametry_bonus_proc(Some(unit));
        let next =
            best_building_progress_after_city_visit(Some(unit), built_building_ids, buildings);
        let armor_gained = js_max(0.0, next.pancerz_bonus_proc - prev_armor);
        let soft_gained = js_max(0.0, next.parametry_bonus_proc - prev_soft);
        let changed = armor_gained > 0.0 || soft_gained > 0.0;
        if changed {
            unit.pancerz_bonus_proc = Some(next.pancerz_bonus_proc);
            unit.parametry_bonus_proc = Some(next.parametry_bonus_proc);
        }
        BuildingBonusGain {
            changed,
            armor_gained,
            soft_gained,
            armor_total: next.pancerz_bonus_proc,
            soft_total: next.parametry_bonus_proc,
        }
    }

    /// Szablon `{klucz}` -> wartosc, jednoprzebiegowo (wartosci nie sa ponownie podstawiane).
    fn render(template: &str, values: &[(&str, &str)]) -> String {
        let mut out = String::new();
        let mut rest = template;
        while let Some(open) = rest.find('{') {
            out.push_str(&rest[..open]);
            let tail = &rest[open..];
            let replaced = values.iter().find_map(|(key, value)| {
                let token = format!("{{{key}}}");
                tail.strip_prefix(token.as_str())
                    .map(|after| (*value, after))
            });
            match replaced {
                Some((value, after)) => {
                    out.push_str(value);
                    rest = after;
                }
                None => {
                    out.push('{');
                    rest = &tail[1..];
                }
            }
        }
        out.push_str(rest);
        out
    }

    /// Web `formatBuildingBonusGainHint` (`unit-building-bonuses.ts:421`).
    pub fn format_building_bonus_gain_hint(
        unit_label: &str,
        city_name: &str,
        gain: &BuildingBonusGain,
    ) -> String {
        let labels = &unit_building_bonuses_params().etykiety;
        let mut parts: Vec<String> = Vec::new();
        if gain.armor_gained > 0.0 {
            parts.push(render(
                &labels.wzmianka_pancerz,
                &[
                    ("przyrost", &js_number_to_string(gain.armor_gained)),
                    ("razem", &js_number_to_string(gain.armor_total)),
                ],
            ));
        }
        if gain.soft_gained > 0.0 {
            parts.push(render(
                &labels.wzmianka_parametry,
                &[
                    ("przyrost", &js_number_to_string(gain.soft_gained)),
                    ("razem", &js_number_to_string(gain.soft_total)),
                ],
            ));
        }
        if parts.is_empty() {
            return String::new();
        }
        render(
            &labels.wzmianka,
            &[
                ("jednostka", unit_label),
                ("miasto", city_name),
                ("czesci", &parts.join(&labels.separator)),
            ],
        )
    }

    /// Web `unitBuildingBonusLabel` (`unit-building-bonuses.ts:438`).
    pub fn unit_building_bonus_label(unit: Option<&UnitBuildingProgress>) -> String {
        let labels = &unit_building_bonuses_params().etykiety;
        let armor = unit_pancerz_bonus_proc(unit);
        let soft = unit_parametry_bonus_proc(unit);
        let mut parts: Vec<String> = Vec::new();
        if armor > 0.0 {
            parts.push(render(
                &labels.pancerz,
                &[("wartosc", &js_number_to_string(armor))],
            ));
        }
        if soft > 0.0 {
            parts.push(render(
                &labels.parametry,
                &[("wartosc", &js_number_to_string(soft))],
            ));
        }
        parts.join(&labels.separator)
    }

    /// Web `BuildingCombatBonus` (`unit-building-bonuses.ts:477`): sciezka A -> `pancerz`,
    /// sciezka B -> `other` (wszystkie pozostale pola mnoznikow).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct BuildingCombatBonus {
        pub pancerz: f64,
        pub other: f64,
    }

    /// Web `ZERO_BUILDING_COMBAT_BONUS` (`unit-building-bonuses.ts:484`).
    pub const ZERO_BUILDING_COMBAT_BONUS: BuildingCombatBonus = BuildingCombatBonus {
        pancerz: 0.0,
        other: 0.0,
    };

    /// Web `buildingCombatBonusForUnit` (`unit-building-bonuses.ts:487`).
    pub fn building_combat_bonus_for_unit(
        unit: Option<&UnitBuildingProgress>,
    ) -> BuildingCombatBonus {
        BuildingCombatBonus {
            pancerz: unit_pancerz_bonus_frac(unit),
            other: unit_parametry_bonus_frac(unit),
        }
    }

    /// Web `StatMultipliersLike` (`unit-building-bonuses.ts:497`) jako cecha: typ strukturalny TS
    /// (`T extends StatMultipliersLike`) odpowiada tu dowolnemu typowi z szescioma polami
    /// mnoznikow, wystawionymi przez dostepy `*_mut`.
    pub trait StatMultipliers {
        fn atk_mut(&mut self) -> &mut f64;
        fn obrona_mut(&mut self) -> &mut f64;
        fn pancerz_mut(&mut self) -> &mut f64;
        fn uderzenie_mut(&mut self) -> &mut f64;
        fn ranged_atk_mut(&mut self) -> &mut f64;
        fn health_mut(&mut self) -> &mut f64;
    }

    /// Konkretna struktura z dokladnie szescioma polami interfejsu `StatMultipliersLike`
    /// (`unit-building-bonuses.ts:497`); implementuje [`StatMultipliers`].
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct StatMultipliersLike {
        pub atk: f64,
        pub obrona: f64,
        pub pancerz: f64,
        pub uderzenie: f64,
        pub ranged_atk: f64,
        pub health: f64,
    }

    impl StatMultipliers for StatMultipliersLike {
        fn atk_mut(&mut self) -> &mut f64 {
            &mut self.atk
        }
        fn obrona_mut(&mut self) -> &mut f64 {
            &mut self.obrona
        }
        fn pancerz_mut(&mut self) -> &mut f64 {
            &mut self.pancerz
        }
        fn uderzenie_mut(&mut self) -> &mut f64 {
            &mut self.uderzenie
        }
        fn ranged_atk_mut(&mut self) -> &mut f64 {
            &mut self.ranged_atk
        }
        fn health_mut(&mut self) -> &mut f64 {
            &mut self.health
        }
    }

    /// Web `if (x)` dla liczby: `false` dla `0`, `-0` i `NaN`.
    fn truthy(x: f64) -> bool {
        x != 0.0 && !x.is_nan()
    }

    /// Web `mergeBuildingBonusIntoStatMultipliers` (`unit-building-bonuses.ts:512`). Mutuje `mods`.
    pub fn merge_building_bonus_into_stat_multipliers<'a, T: StatMultipliers>(
        mods: &'a mut T,
        bonus: Option<&BuildingCombatBonus>,
    ) -> &'a mut T {
        let Some(bonus) = bonus else {
            return mods;
        };
        if truthy(bonus.pancerz) {
            *mods.pancerz_mut() += bonus.pancerz;
        }
        if truthy(bonus.other) {
            *mods.atk_mut() += bonus.other;
            *mods.obrona_mut() += bonus.other;
            *mods.uderzenie_mut() += bonus.other;
            *mods.ranged_atk_mut() += bonus.other;
            *mods.health_mut() += bonus.other;
        }
        mods
    }
}
