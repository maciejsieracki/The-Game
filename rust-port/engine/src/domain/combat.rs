use serde::{Deserialize, Serialize};

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
    pub id: u64,
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
            id,
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
/// Explicit data wins. The built-in table mirrors every confirmed attack
/// counter in `gra/data/counters.json`, keeping a minimally populated DTO
/// faithful to the canonical data.
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
    match (attacker.as_str(), defender.as_str()) {
        ("spearman", "mount")
        | ("mount", "distance")
        | ("mount", "slinger")
        | ("slinger", "spearman")
        | ("swordsman", "mount")
        | ("falangite", "mount") => 1.50,
        ("mount", "offensive") | ("offensive", "swordsman") => 1.25,
        ("swordsman", "spearman")
        | ("spearman", "spearman")
        | ("mount", "spearman")
        | ("distance", "spearman")
        | ("naval", "spearman")
        | ("offensive", "distance")
        | ("offensive", "slinger") => 1.15,
        _ => 1.0,
    }
}

pub fn terrain_defense_multiplier(terrain: Terrain) -> f64 {
    match terrain {
        Terrain::Plain => 1.0,
        Terrain::Forest => 1.25,
        Terrain::Hills => 1.5,
        Terrain::Mountain => 1.75,
        Terrain::River => 1.0,
    }
}

pub fn structure_defense_multiplier(structures: DefenseStructures, is_siege: bool) -> f64 {
    if !is_siege {
        return 1.0;
    }

    // Structure bonuses are additive percentage points: wall +200%, fort
    // +100%, outpost +50%, matching structureDefenseBonusFor in the game.
    1.0 + if structures.wall { 2.0 } else { 0.0 }
        + if structures.fort { 1.0 } else { 0.0 }
        + if structures.outpost { 0.5 } else { 0.0 }
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
    let terrain_multiplier = if is_defender {
        terrain_defense_multiplier(terrain)
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
                id: unit.id,
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
                id: unit.id,
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
