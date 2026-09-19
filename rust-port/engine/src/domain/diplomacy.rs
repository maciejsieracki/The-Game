use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

pub const MAX_TRUST: f64 = 100.0;
pub const MAX_RESPECT: f64 = 100.0;
pub const MAX_RELATION_SCORE: f64 = 200.0;
pub const WAR_RELATION_SCORE_CAP: f64 = 29.0;

fn clamp(value: f64, min: f64, max: f64) -> f64 {
    if !value.is_finite() {
        return min;
    }
    value.clamp(min, max)
}

fn non_negative(value: f64) -> f64 {
    if value.is_finite() {
        value.max(0.0)
    } else {
        0.0
    }
}

fn normalized_key(value: &str) -> String {
    value.trim().to_lowercase()
}

fn normalized_match_key(value: &str) -> String {
    value
        .trim()
        .chars()
        .flat_map(|character| character.to_lowercase())
        .map(|character| match character {
            'ą' => 'a',
            'ć' => 'c',
            'ę' => 'e',
            'ł' => 'l',
            'ń' => 'n',
            'ó' => 'o',
            'ś' => 's',
            'ź' | 'ż' => 'z',
            other => other,
        })
        .collect()
}

fn deserialize_boolish<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Boolish {
        Bool(bool),
        Number(f64),
        Text(String),
    }

    Ok(match Boolish::deserialize(deserializer)? {
        Boolish::Bool(value) => value,
        Boolish::Number(value) => value != 0.0,
        Boolish::Text(value) => matches!(
            normalized_match_key(&value).as_str(),
            "tak" | "true" | "yes" | "1"
        ),
    })
}

/// The four wire values used by the TypeScript diplomacy model.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum RelationStatus {
    #[default]
    #[serde(rename = "neutralni", alias = "neutral", alias = "neutrality")]
    Neutral,
    #[serde(rename = "pokoj", alias = "peace")]
    Peace,
    #[serde(rename = "sojusz", alias = "alliance")]
    Alliance,
    #[serde(rename = "wojna", alias = "war")]
    War,
}

impl RelationStatus {
    #[allow(non_upper_case_globals)]
    pub const Neutralni: Self = Self::Neutral;
    #[allow(non_upper_case_globals)]
    pub const Pokoj: Self = Self::Peace;
    #[allow(non_upper_case_globals)]
    pub const Sojusz: Self = Self::Alliance;
    #[allow(non_upper_case_globals)]
    pub const Wojna: Self = Self::War;

    pub fn is_war(self) -> bool {
        self == Self::War
    }
}

/// Immutable value object for one civilization pair.
///
/// Trust and respect are deliberately kept separate.  The displayed relation is
/// always derived as `trust + respect`; callers must not persist a second,
/// independently mutable score.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Relation {
    #[serde(rename = "zaufanie", alias = "trust")]
    pub trust: f64,
    #[serde(rename = "respekt", alias = "respect")]
    pub respect: f64,
    #[serde(rename = "status")]
    pub status: RelationStatus,
}

impl Default for Relation {
    fn default() -> Self {
        Self::starting()
    }
}

impl Relation {
    pub fn new(trust: f64, respect: f64, status: RelationStatus) -> Self {
        Self {
            trust: clamp(trust, 0.0, MAX_TRUST),
            respect: clamp(respect, 0.0, MAX_RESPECT),
            status,
        }
    }

    pub fn starting() -> Self {
        Self::starting_with_params(&DiplomacyParams::default())
    }

    pub fn starting_with_params(params: &DiplomacyParams) -> Self {
        Self::new(
            params.start_trust,
            params.start_respect,
            RelationStatus::Neutral,
        )
    }

    pub fn relation_score(&self) -> f64 {
        relation_score(self)
    }

    pub fn zaufanie(&self) -> f64 {
        self.trust
    }

    pub fn respekt(&self) -> f64 {
        self.respect
    }

    pub fn clamped_for_war(&self) -> Self {
        clamp_relation_for_war(self)
    }
}

/// Canonical, order-independent key for a pair of civilizations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct CivilizationPair {
    pub first: u64,
    pub second: u64,
}

pub type PairKey = CivilizationPair;

impl CivilizationPair {
    pub fn new(a: u64, b: u64) -> Self {
        if a <= b {
            Self {
                first: a,
                second: b,
            }
        } else {
            Self {
                first: b,
                second: a,
            }
        }
    }

    pub fn as_tuple(self) -> (u64, u64) {
        (self.first, self.second)
    }

    pub fn contains(self, owner_id: u64) -> bool {
        self.first == owner_id || self.second == owner_id
    }

    pub fn other(self, owner_id: u64) -> Option<u64> {
        if self.first == owner_id {
            Some(self.second)
        } else if self.second == owner_id {
            Some(self.first)
        } else {
            None
        }
    }
}

impl From<(u64, u64)> for CivilizationPair {
    fn from((a, b): (u64, u64)) -> Self {
        Self::new(a, b)
    }
}

/// Parameters copied from the diplomacy and acceptance-points data contracts.
///
/// Keeping the values in a plain value object lets the engine and tests use the
/// same rules without reading JSON or depending on the UI bundle.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct DiplomacyParams {
    pub start_trust: f64,
    pub start_respect: f64,
    pub trust_multiplier: f64,
    pub respect_multiplier: f64,
    pub gift_multiplier: f64,
    pub trade_trust_once: f64,
    pub ally_help_trust: f64,
    pub common_enemy_trust: f64,
    pub gift_trust_once: f64,
    pub broken_pact_player_trust: f64,
    pub broken_pact_ai_trust: f64,
    pub betrayal_trust: f64,
    pub espionage_detected_trust: f64,
    pub same_type_trust: f64,
    pub same_minor_civ_trust: f64,
    pub cultural_difference_trust: f64,
    pub military_advantage_respect: f64,
    pub weaker_military_respect: f64,
    pub battle_won_respect: f64,
    pub tribute_respect: f64,
    pub common_enemy_respect: f64,
    pub trade_trust_per_turn: f64,
    pub alliance_trust_per_turn: f64,
    pub nap_trust_per_turn: f64,
    pub peace_trust_per_turn: f64,
    pub goodwill_trust_per_turn: f64,
    pub common_enemy_trust_per_turn: f64,
    pub same_religion_trust_per_turn: f64,
    pub different_religion_trust_per_turn: f64,
    pub common_border_trust_per_turn: f64,
    pub historical_grievance_decay_per_turn: f64,
    pub alliance_trust_threshold: f64,
    pub technology_trust_threshold: f64,
    pub vassal_respect_threshold: f64,
    pub annexation_respect_threshold: f64,
    pub minimum_relation: f64,
    pub alliance_relation: f64,
    pub treaty_min_relation: f64,
    pub nap_relation: f64,
    pub trade_relation: f64,
    pub trade_willingness_min: f64,
    pub tribute_min_per_turn: f64,
    pub tribute_demand_min_respect: f64,
    pub tribute_demand_max_base: f64,
    pub tribute_demand_max_per_respect: f64,
    pub tribute_offer_near_war_ratio: f64,
    pub tribute_offer_near_war_trust: f64,
    pub tribute_offer_min_gold: f64,
    pub tribute_offer_base_gold: f64,
    pub tribute_offer_era_gold: f64,
    pub encourage_war_min_trust: f64,
    pub encourage_war_bribe_base: f64,
    pub borders_relation: f64,
    pub borders_trust: f64,
    pub military_march_min_respect: f64,
    pub ultimatum_military_ratio: f64,
    pub ultimatum_min_gold: f64,
    pub default_vassal_gold_per_turn: f64,
    pub annexation_min_turns: f64,
    pub annexation_gold_base: f64,
    pub annexation_gold_per_population: f64,
    pub annexation_gold_min: f64,
    pub nap_base_pn: f64,
    pub defensive_alliance_base_pn: f64,
    pub full_alliance_base_pn: f64,
    pub peace_base_pn: f64,
    pub march_base_pn: f64,
    pub trade_route_base_pn: f64,
    pub vassal_base_pn: f64,
    pub tribute_demand_base_pn: f64,
    pub sweetener_pn_per_ease: f64,
    pub sweetener_ease_max: f64,
    pub pn_per_trust: f64,
    pub max_trust_from_pn_per_turn: f64,
    pub min_surplus_pn: f64,
    pub goodwill_min_surplus_pn: f64,
    pub goodwill_turns: f64,
    pub gift_min_relation: f64,
    pub credibility_min_nap: f64,
    pub credibility_min_alliance: f64,
    pub minor_acceptance_respect: f64,
    pub minor_trade_relation: f64,
    pub minor_war_relation: f64,
    pub alliance_strength_ease_max: f64,
    pub alliance_strength_military_step: f64,
    pub alliance_strength_respect_step: f64,
    pub alliance_weak_proposer_military_ratio: f64,
    pub alliance_stronger_other_bonus: f64,
    pub alliance_willingness_min: f64,
    pub alliance_stronger_penalty_max: f64,
    pub alliance_stronger_military_step: f64,
    pub alliance_willingness_penalty_step: f64,
    pub alliance_hegemon_military_ratio: f64,
    pub alliance_hegemon_proposer_max_military_ratio: f64,
    pub alliance_player_two_x_ratio: f64,
    pub alliance_player_two_x_min_trust: f64,
    pub alliance_player_two_x_bonus: f64,
    pub alliance_player_three_x_ratio: f64,
    pub alliance_player_three_x_min_trust: f64,
    pub alliance_player_three_x_bonus: f64,
}

impl Default for DiplomacyParams {
    fn default() -> Self {
        Self {
            start_trust: 20.0,
            start_respect: 30.0,
            trust_multiplier: 1.0,
            respect_multiplier: 1.0,
            gift_multiplier: 1.0,
            trade_trust_once: 2.0,
            ally_help_trust: 10.0,
            common_enemy_trust: 5.0,
            gift_trust_once: 6.0,
            broken_pact_player_trust: -40.0,
            broken_pact_ai_trust: -20.0,
            betrayal_trust: -50.0,
            espionage_detected_trust: -15.0,
            same_type_trust: -20.0,
            same_minor_civ_trust: 20.0,
            cultural_difference_trust: -5.0,
            military_advantage_respect: 15.0,
            weaker_military_respect: -10.0,
            battle_won_respect: 5.0,
            tribute_respect: 10.0,
            common_enemy_respect: 10.0,
            trade_trust_per_turn: 1.0,
            alliance_trust_per_turn: 3.0,
            nap_trust_per_turn: 2.0,
            peace_trust_per_turn: 1.0,
            goodwill_trust_per_turn: 1.0,
            common_enemy_trust_per_turn: 1.0,
            same_religion_trust_per_turn: 0.5,
            different_religion_trust_per_turn: -0.5,
            common_border_trust_per_turn: -2.0,
            historical_grievance_decay_per_turn: -2.0,
            alliance_trust_threshold: 91.0,
            technology_trust_threshold: 70.0,
            vassal_respect_threshold: 70.0,
            annexation_respect_threshold: 90.0,
            minimum_relation: 30.0,
            alliance_relation: 151.0,
            treaty_min_relation: 151.0,
            nap_relation: 110.0,
            trade_relation: 0.0,
            trade_willingness_min: 0.5,
            tribute_min_per_turn: 10.0,
            tribute_demand_min_respect: 70.0,
            tribute_demand_max_base: 50.0,
            tribute_demand_max_per_respect: 5.0,
            tribute_offer_near_war_ratio: 1.2,
            tribute_offer_near_war_trust: 30.0,
            tribute_offer_min_gold: 5.0,
            tribute_offer_base_gold: 10.0,
            tribute_offer_era_gold: 5.0,
            encourage_war_min_trust: 50.0,
            encourage_war_bribe_base: 30.0,
            borders_relation: 100.0,
            borders_trust: 45.0,
            military_march_min_respect: 55.0,
            ultimatum_military_ratio: 1.3,
            ultimatum_min_gold: 20.0,
            default_vassal_gold_per_turn: 10.0,
            annexation_min_turns: 10.0,
            annexation_gold_base: 150.0,
            annexation_gold_per_population: 25.0,
            annexation_gold_min: 200.0,
            nap_base_pn: 200.0,
            defensive_alliance_base_pn: 420.0,
            full_alliance_base_pn: 500.0,
            peace_base_pn: 500.0,
            march_base_pn: 60.0,
            trade_route_base_pn: 80.0,
            vassal_base_pn: 350.0,
            tribute_demand_base_pn: 120.0,
            sweetener_pn_per_ease: 25.0,
            sweetener_ease_max: 20.0,
            pn_per_trust: 100.0,
            max_trust_from_pn_per_turn: 5.0,
            min_surplus_pn: 1.0,
            goodwill_min_surplus_pn: 100.0,
            goodwill_turns: 3.0,
            gift_min_relation: 30.0,
            credibility_min_nap: 0.0,
            credibility_min_alliance: 0.0,
            minor_acceptance_respect: 60.0,
            minor_trade_relation: 30.0,
            minor_war_relation: 15.0,
            alliance_strength_ease_max: 0.25,
            alliance_strength_military_step: 0.08,
            alliance_strength_respect_step: 0.15,
            alliance_weak_proposer_military_ratio: 0.5,
            alliance_stronger_other_bonus: 0.20,
            alliance_willingness_min: 0.68,
            alliance_stronger_penalty_max: 0.40,
            alliance_stronger_military_step: 0.15,
            alliance_willingness_penalty_step: 0.18,
            alliance_hegemon_military_ratio: 0.42,
            alliance_hegemon_proposer_max_military_ratio: 2.38,
            alliance_player_two_x_ratio: 2.0,
            alliance_player_two_x_min_trust: 85.0,
            alliance_player_two_x_bonus: 0.06,
            alliance_player_three_x_ratio: 2.8,
            alliance_player_three_x_min_trust: 83.0,
            alliance_player_three_x_bonus: 0.10,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum Difficulty {
    #[serde(rename = "easy")]
    Easy,
    #[default]
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "hard")]
    Hard,
}

impl Difficulty {
    fn threshold_delta(self) -> f64 {
        match self {
            Self::Easy => -10.0,
            Self::Normal => 0.0,
            Self::Hard => 10.0,
        }
    }
}

/// Difficulty changes only action thresholds, never trust/respect deltas.
pub fn scale_params_for_difficulty(
    base: DiplomacyParams,
    difficulty: Difficulty,
) -> DiplomacyParams {
    let delta = difficulty.threshold_delta();
    if delta == 0.0 {
        return base;
    }
    let mut p = base;
    for value in [
        &mut p.minimum_relation,
        &mut p.alliance_relation,
        &mut p.treaty_min_relation,
        &mut p.nap_relation,
        &mut p.borders_relation,
        &mut p.minor_trade_relation,
        &mut p.minor_war_relation,
    ] {
        *value = clamp(*value + delta, 0.0, MAX_RELATION_SCORE);
    }
    for value in [
        &mut p.alliance_trust_threshold,
        &mut p.technology_trust_threshold,
        &mut p.encourage_war_min_trust,
        &mut p.borders_trust,
        &mut p.tribute_offer_near_war_trust,
        &mut p.alliance_player_two_x_min_trust,
        &mut p.alliance_player_three_x_min_trust,
    ] {
        *value = clamp(*value + delta, 0.0, MAX_TRUST);
    }
    for value in [
        &mut p.vassal_respect_threshold,
        &mut p.annexation_respect_threshold,
        &mut p.tribute_demand_min_respect,
        &mut p.military_march_min_respect,
        &mut p.minor_acceptance_respect,
    ] {
        *value = clamp(*value + delta, 0.0, MAX_RESPECT);
    }
    p
}

pub fn scale_relation_threshold(base: f64, difficulty: Difficulty) -> f64 {
    clamp(base + difficulty.threshold_delta(), 0.0, MAX_RELATION_SCORE)
}

/// Returns trust + respect on the same 0..200 scale used by the UI.
pub fn relation_score(relation: &Relation) -> f64 {
    let params = DiplomacyParams::default();
    clamp(
        relation.trust * params.trust_multiplier + relation.respect * params.respect_multiplier,
        0.0,
        MAX_RELATION_SCORE,
    )
}

pub fn relation_total(relation: &Relation) -> f64 {
    relation_score(relation)
}

pub fn relation_score_with_params(relation: &Relation, params: &DiplomacyParams) -> f64 {
    clamp(
        relation.trust * params.trust_multiplier + relation.respect * params.respect_multiplier,
        0.0,
        MAX_RELATION_SCORE,
    )
}

/// A war relation cannot display a friendly score. Trust is reduced before respect,
/// matching the TypeScript clamp and preserving as much hard-power information as
/// possible.
pub fn clamp_relation_for_war(relation: &Relation) -> Relation {
    if relation.status != RelationStatus::War {
        return relation.clone();
    }
    let score = relation_score(relation);
    if score <= WAR_RELATION_SCORE_CAP {
        return Relation::new(relation.trust, relation.respect, relation.status);
    }
    let mut excess = score - WAR_RELATION_SCORE_CAP;
    let trust_removed = excess.min(relation.trust.max(0.0));
    let trust = (relation.trust - trust_removed).max(0.0);
    excess -= trust_removed;
    let respect = (relation.respect - excess).max(0.0);
    Relation::new(trust, respect, relation.status)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DiplomaticEvent {
    #[serde(rename = "wojna_wypowiedziana", alias = "declare_war")]
    DeclareWar,
    #[serde(rename = "pokoj", alias = "peace")]
    Peace,
    #[serde(rename = "handel", alias = "trade")]
    Trade,
    #[serde(rename = "wspolny_wrog", alias = "common_enemy")]
    CommonEnemy,
    #[serde(rename = "zlamana_obietnica", alias = "broken_promise")]
    BrokenPromiseByPlayer,
    #[serde(rename = "zlamana_obietnica_ai", alias = "broken_promise_ai")]
    BrokenPromiseByAi,
    #[serde(rename = "zdrada", alias = "betrayal")]
    Betrayal,
    #[serde(rename = "tarcia_graniczne", alias = "border_friction")]
    BorderFriction,
    #[serde(rename = "dar", alias = "gift")]
    Gift,
    #[serde(rename = "wspolna_religia", alias = "common_religion")]
    CommonReligion,
    #[serde(rename = "pomoc_sojusznikowi", alias = "ally_help")]
    AllyHelp,
    #[serde(rename = "wygrana_bitwa", alias = "battle_won")]
    BattleWon,
    #[serde(rename = "przewaga_militarna", alias = "military_advantage")]
    MilitaryAdvantage,
    #[serde(rename = "slabszy_militarnie", alias = "military_weakness")]
    MilitaryWeakness,
    #[serde(rename = "trybut_zaakceptowany", alias = "tribute_accepted")]
    TributeAccepted,
    #[serde(rename = "wojna_casus_belli", alias = "casus_belli_war")]
    CasusBelliWar,
    #[serde(rename = "ultimatum_spelnione", alias = "ultimatum_met")]
    UltimatumMet,
    #[serde(rename = "ultimatum_bezpodstawne", alias = "baseless_ultimatum")]
    BaselessUltimatum,
    #[serde(rename = "trybut_odmowa", alias = "tribute_refused")]
    TributeRefused,
    #[serde(rename = "trybut_oferta_przyjeta", alias = "tribute_offer_accepted")]
    TributeOfferAccepted,
    #[serde(rename = "wymiana_tech_gratis", alias = "free_technology_exchange")]
    FreeTechnologyExchange,
    #[serde(rename = "zerwanie_handlu", alias = "trade_broken")]
    TradeBroken,
    #[serde(rename = "zerwanie_traktatu", alias = "treaty_broken")]
    VoluntaryTreatyBreak,
}

impl DiplomaticEvent {
    #[allow(non_upper_case_globals)]
    pub const WojnaWypowiedziana: Self = Self::DeclareWar;
    #[allow(non_upper_case_globals)]
    pub const Pokoj: Self = Self::Peace;
    #[allow(non_upper_case_globals)]
    pub const Handel: Self = Self::Trade;
    #[allow(non_upper_case_globals)]
    pub const WspolnyWrog: Self = Self::CommonEnemy;
    #[allow(non_upper_case_globals)]
    pub const ZlamanaObietnica: Self = Self::BrokenPromiseByPlayer;
    #[allow(non_upper_case_globals)]
    pub const ZlamanaObietnicaAi: Self = Self::BrokenPromiseByAi;
    #[allow(non_upper_case_globals)]
    pub const Zdrada: Self = Self::Betrayal;
    #[allow(non_upper_case_globals)]
    pub const Dar: Self = Self::Gift;
    #[allow(non_upper_case_globals)]
    pub const WygranaBitwa: Self = Self::BattleWon;
    #[allow(non_upper_case_globals)]
    pub const PrzewagaMilitarna: Self = Self::MilitaryAdvantage;
    #[allow(non_upper_case_globals)]
    pub const SlabszyMilitarnie: Self = Self::MilitaryWeakness;
}

pub fn apply_diplomatic_event(relation: &Relation, event: DiplomaticEvent) -> Relation {
    apply_diplomatic_event_with_params(relation, event, DiplomacyParams::default(), None)
}

pub fn apply_diplomatic_event_with_params(
    relation: &Relation,
    event: DiplomaticEvent,
    params: DiplomacyParams,
    credibility: Option<f64>,
) -> Relation {
    let p = params;
    let mut trust_delta = 0.0;
    let mut respect_delta = 0.0;
    let mut status = relation.status;

    match event {
        DiplomaticEvent::DeclareWar => status = RelationStatus::War,
        DiplomaticEvent::Peace => {
            trust_delta = 5.0;
            status = RelationStatus::Peace;
        }
        // A concluded one-shot trade has no flat trust bonus.  Trade trust is
        // earned from the PN surplus in the PN engine (the TypeScript
        // `handel` event intentionally sets dZ to zero).
        DiplomaticEvent::Trade => trust_delta = 0.0,
        DiplomaticEvent::CommonEnemy => {
            trust_delta = p.common_enemy_trust;
            respect_delta = p.common_enemy_respect;
        }
        DiplomaticEvent::BrokenPromiseByPlayer => trust_delta = p.broken_pact_player_trust,
        DiplomaticEvent::BrokenPromiseByAi => trust_delta = p.broken_pact_ai_trust,
        DiplomaticEvent::Betrayal => {
            trust_delta = p.betrayal_trust;
            status = RelationStatus::War;
        }
        DiplomaticEvent::BorderFriction => trust_delta = p.common_border_trust_per_turn,
        DiplomaticEvent::Gift => trust_delta = 0.0,
        DiplomaticEvent::CommonReligion => trust_delta = 1.0,
        DiplomaticEvent::AllyHelp => trust_delta = p.ally_help_trust,
        DiplomaticEvent::BattleWon => respect_delta = p.battle_won_respect,
        DiplomaticEvent::MilitaryAdvantage => respect_delta = p.military_advantage_respect,
        DiplomaticEvent::MilitaryWeakness => respect_delta = p.weaker_military_respect,
        DiplomaticEvent::TributeAccepted => respect_delta = p.tribute_respect,
        DiplomaticEvent::CasusBelliWar => {
            trust_delta = -10.0;
            status = RelationStatus::War;
        }
        DiplomaticEvent::UltimatumMet => trust_delta = -5.0,
        DiplomaticEvent::BaselessUltimatum => {
            trust_delta = -10.0;
            respect_delta = -10.0;
        }
        DiplomaticEvent::TributeRefused => trust_delta = -10.0,
        DiplomaticEvent::TributeOfferAccepted => trust_delta = 5.0,
        DiplomaticEvent::FreeTechnologyExchange => trust_delta = 5.0,
        DiplomaticEvent::TradeBroken => trust_delta = -10.0,
        DiplomaticEvent::VoluntaryTreatyBreak => trust_delta = -15.0,
    }

    if let Some(value) = credibility {
        let w = clamp(value, -100.0, 100.0);
        trust_delta *= if trust_delta >= 0.0 {
            1.0 + w / 100.0 * 0.5
        } else {
            1.0 - w / 100.0 * 0.5
        };
    }

    clamp_relation_for_war(&Relation::new(
        relation.trust + trust_delta,
        relation.respect + respect_delta,
        status,
    ))
}

pub fn is_relation_at_war(relation: &Relation) -> bool {
    relation.status == RelationStatus::War
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum PeaceTrustTier {
    #[serde(rename = "sojusz")]
    Alliance,
    #[serde(rename = "nap")]
    Nap,
    #[default]
    #[serde(rename = "pokoj")]
    Peace,
}

#[derive(Debug, Clone, Copy, PartialEq, Default, Serialize, Deserialize)]
pub struct TickContext {
    pub active_trade: bool,
    pub peace_tier: Option<PeaceTrustTier>,
    pub goodwill: bool,
    pub common_enemy: bool,
    pub same_religion: bool,
    pub different_religion: bool,
    pub common_border: bool,
    pub credibility: Option<f64>,
}

pub fn apply_credibility_tempo(delta: f64, credibility: Option<f64>) -> f64 {
    let Some(value) = credibility else {
        return delta;
    };
    let w = clamp(value, -100.0, 100.0);
    if delta > 0.0 {
        delta * (1.0 + w / 100.0 * 0.5)
    } else if delta < 0.0 {
        delta * (1.0 - w / 100.0 * 0.5)
    } else {
        0.0
    }
}

pub fn credibility_trust_drift(credibility: f64) -> f64 {
    clamp(credibility, -100.0, 100.0) * 0.03
}

pub fn compute_trust_delta(ctx: &TickContext, at_war: bool, params: &DiplomacyParams) -> f64 {
    let mut delta = if !at_war {
        ctx.credibility.map(credibility_trust_drift).unwrap_or(0.0)
    } else {
        0.0
    };
    if ctx.active_trade {
        delta += params.trade_trust_per_turn;
    }
    match ctx.peace_tier {
        Some(PeaceTrustTier::Alliance) => delta += params.alliance_trust_per_turn,
        Some(PeaceTrustTier::Nap) => delta += params.nap_trust_per_turn,
        Some(PeaceTrustTier::Peace) | None => {
            // A plain peace tier has no recurring bonus; passive credibility drift
            // is the canonical replacement for the old +1 peace seed.
        }
    }
    if ctx.goodwill {
        delta += params.goodwill_trust_per_turn;
    }
    if ctx.common_enemy {
        delta += params.common_enemy_trust_per_turn;
    }
    if ctx.same_religion {
        delta += params.same_religion_trust_per_turn;
    }
    if ctx.different_religion {
        delta += params.different_religion_trust_per_turn;
    }
    if ctx.common_border {
        delta += params.common_border_trust_per_turn;
    }
    let delta = apply_credibility_tempo(delta, ctx.credibility);
    if at_war && delta > 0.0 {
        0.0
    } else {
        delta
    }
}

pub fn tick_relation(relation: &Relation, ctx: &TickContext, params: &DiplomacyParams) -> Relation {
    let at_war = relation.status == RelationStatus::War;
    let delta = compute_trust_delta(ctx, at_war, params);
    clamp_relation_for_war(&Relation::new(
        relation.trust + delta,
        relation.respect,
        relation.status,
    ))
}

pub fn relation_tier(relation: &Relation, params: &DiplomacyParams) -> u8 {
    if relation.status == RelationStatus::War {
        return 0;
    }
    if relation.status == RelationStatus::Alliance {
        return 4;
    }
    let score = relation_score_with_params(relation, params);
    if score < params.minimum_relation {
        1
    } else if score < 60.0 {
        2
    } else if score < params.alliance_relation {
        3
    } else {
        4
    }
}

/// A small civilization type used by the pure initial-relation helper.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CivilizationKind {
    #[serde(rename = "generic")]
    Generic,
    #[serde(rename = "drobna_cywilizacja", alias = "minor")]
    Minor,
    #[serde(rename = "grecy")]
    Greeks,
    #[serde(rename = "rzymianie")]
    Romans,
    #[serde(rename = "chinczycy")]
    Chinese,
    #[serde(rename = "inkowie")]
    Incas,
    #[serde(rename = "zulusi")]
    Zulus,
    #[serde(rename = "egipt")]
    Egyptians,
    #[serde(rename = "babilon")]
    Babylon,
    #[serde(rename = "sumer")]
    Sumer,
    #[serde(rename = "celtowie")]
    Celts,
    #[serde(rename = "germanie")]
    Germans,
    #[serde(rename = "harappa")]
    Harappa,
    #[serde(rename = "hetyci")]
    Hittites,
    #[serde(rename = "slowianie")]
    Slavs,
    #[serde(rename = "babilonia")]
    Babylonia,
    #[serde(rename = "asyria")]
    Assyria,
    #[serde(rename = "fenicjanie")]
    Phoenicians,
}

impl CivilizationKind {
    #[allow(non_upper_case_globals)]
    pub const Grecy: Self = Self::Greeks;
    #[allow(non_upper_case_globals)]
    pub const Rzymianie: Self = Self::Romans;
    #[allow(non_upper_case_globals)]
    pub const Chinczycy: Self = Self::Chinese;
    #[allow(non_upper_case_globals)]
    pub const Inkowie: Self = Self::Incas;
    #[allow(non_upper_case_globals)]
    pub const Zulusi: Self = Self::Zulus;
    #[allow(non_upper_case_globals)]
    pub const Egipt: Self = Self::Egyptians;
    #[allow(non_upper_case_globals)]
    pub const Babilon: Self = Self::Babylon;
    #[allow(non_upper_case_globals)]
    pub const Sumerowie: Self = Self::Sumer;
    #[allow(non_upper_case_globals)]
    pub const Celtowie: Self = Self::Celts;
    #[allow(non_upper_case_globals)]
    pub const Germanie: Self = Self::Germans;
    #[allow(non_upper_case_globals)]
    pub const Hetyci: Self = Self::Hittites;
    #[allow(non_upper_case_globals)]
    pub const Slowianie: Self = Self::Slavs;
    #[allow(non_upper_case_globals)]
    pub const Fenicjanie: Self = Self::Phoenicians;
    #[allow(non_upper_case_globals)]
    pub const DrobnaCywilizacja: Self = Self::Minor;
}

pub fn initial_relation(
    a: CivilizationKind,
    b: CivilizationKind,
    params: &DiplomacyParams,
) -> Relation {
    let base_total = params.start_trust + params.start_respect;
    let mut trust = params.start_trust
        + initial_archetype_trust_delta(a, base_total)
        + initial_archetype_trust_delta(b, base_total);
    if a == b {
        trust += params.same_type_trust;
    } else if a != CivilizationKind::Minor && b != CivilizationKind::Minor {
        trust += params.cultural_difference_trust;
    }
    Relation::new(trust, params.start_respect, RelationStatus::Neutral)
}

fn initial_archetype_trust_delta(kind: CivilizationKind, base_total: f64) -> f64 {
    let base = match kind {
        CivilizationKind::Greeks => 59.0,
        CivilizationKind::Romans => 44.0,
        CivilizationKind::Chinese => 66.0,
        CivilizationKind::Incas => 45.0,
        CivilizationKind::Zulus => 32.0,
        CivilizationKind::Egyptians => 56.0,
        CivilizationKind::Sumer => 59.0,
        CivilizationKind::Celts => 44.0,
        CivilizationKind::Germans => 41.0,
        CivilizationKind::Harappa => 58.0,
        CivilizationKind::Hittites => 52.0,
        CivilizationKind::Slavs => 48.0,
        CivilizationKind::Babylonia => 55.0,
        CivilizationKind::Assyria => 38.0,
        CivilizationKind::Phoenicians => 62.0,
        CivilizationKind::Generic | CivilizationKind::Minor | CivilizationKind::Babylon => {
            base_total
        }
    };
    (base - base_total) / 2.0
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct DiplomacyStrengthEase {
    pub ally_threshold_delta: f64,
    pub trust_threshold_delta: f64,
    pub score_threshold_delta: f64,
}

pub fn diplomacy_proposer_strength_ease(
    proposer_military_ratio: f64,
    proposer_respect: f64,
    responder_respect: f64,
    params: &DiplomacyParams,
) -> DiplomacyStrengthEase {
    let military_advantage = (proposer_military_ratio - 1.0).max(0.0);
    let respect_advantage = (proposer_respect - responder_respect).max(0.0) / 100.0;
    let mut raw = military_advantage * params.alliance_strength_military_step
        + respect_advantage * params.alliance_strength_respect_step;
    if proposer_military_ratio >= params.alliance_player_three_x_ratio {
        raw += params.alliance_player_three_x_bonus;
    } else if proposer_military_ratio >= params.alliance_player_two_x_ratio {
        raw += params.alliance_player_two_x_bonus;
    }
    let capped = raw.min(params.alliance_strength_ease_max).max(0.0);
    DiplomacyStrengthEase {
        ally_threshold_delta: capped,
        trust_threshold_delta: (capped * 80.0).round(),
        score_threshold_delta: (capped * 100.0).round(),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct DiplomacyAllianceStrengthAdjust {
    pub ease: DiplomacyStrengthEase,
    pub penalty_trust: f64,
    pub penalty_score: f64,
    pub penalty_ally: f64,
    pub ally_willingness_penalty: f64,
    pub hegemon_blocks_alliance: bool,
    pub hegemon_proposer_no_alliance: bool,
}

pub fn diplomacy_alliance_strength_adjust(
    proposer_military_ratio: f64,
    proposer_respect: f64,
    responder_respect: f64,
    params: &DiplomacyParams,
) -> DiplomacyAllianceStrengthAdjust {
    let ease = diplomacy_proposer_strength_ease(
        proposer_military_ratio,
        proposer_respect,
        responder_respect,
        params,
    );
    let safe_ratio = proposer_military_ratio.max(0.01);
    let responder_advantage = if safe_ratio < 1.0 {
        1.0 / safe_ratio - 1.0
    } else {
        0.0
    };
    let capped_penalty = (responder_advantage * params.alliance_stronger_military_step)
        .min(params.alliance_stronger_penalty_max)
        .max(0.0);
    DiplomacyAllianceStrengthAdjust {
        ease,
        penalty_trust: (capped_penalty * 95.0).round(),
        penalty_score: (capped_penalty * 110.0).round(),
        penalty_ally: capped_penalty * 0.55,
        ally_willingness_penalty: responder_advantage * params.alliance_willingness_penalty_step,
        hegemon_blocks_alliance: safe_ratio <= params.alliance_hegemon_military_ratio,
        hegemon_proposer_no_alliance: safe_ratio
            >= params.alliance_hegemon_proposer_max_military_ratio,
    }
}

pub fn diplomacy_alliance_min_trust(
    adjustment: &DiplomacyAllianceStrengthAdjust,
    proposer_military_ratio: f64,
    params: &DiplomacyParams,
) -> f64 {
    let mut minimum = (params.alliance_trust_threshold - adjustment.ease.trust_threshold_delta
        + adjustment.penalty_trust)
        .max(0.0);
    if proposer_military_ratio >= params.alliance_player_three_x_ratio {
        minimum = minimum.max(params.alliance_player_three_x_min_trust);
    } else if proposer_military_ratio >= params.alliance_player_two_x_ratio {
        minimum = minimum.max(params.alliance_player_two_x_min_trust);
    }
    minimum
}

pub fn diplomacy_treaty_min_relation(adjusted_threshold: f64, params: &DiplomacyParams) -> f64 {
    params.treaty_min_relation.max(adjusted_threshold)
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AiDiplomacyContext {
    pub is_minor_civ: bool,
    pub military_ratio: f64,
    pub current_turn: u32,
    pub turns_at_war: u32,
}

pub type AIDiplomacyContext = AiDiplomacyContext;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AiDiplomacyStance {
    pub willingness_war: f64,
    pub willingness_peace: f64,
    pub willingness_trade: f64,
    pub willingness_ally: f64,
}

pub type AIDiplomacyStance = AiDiplomacyStance;

fn archetype_aggression(kind: CivilizationKind) -> f64 {
    match kind {
        CivilizationKind::Greeks => 0.40,
        CivilizationKind::Romans => 0.75,
        CivilizationKind::Chinese | CivilizationKind::Harappa => 0.20,
        CivilizationKind::Incas => 0.45,
        CivilizationKind::Zulus => 0.90,
        CivilizationKind::Egyptians => 0.35,
        CivilizationKind::Sumer => 0.30,
        CivilizationKind::Celts | CivilizationKind::Slavs => 0.60,
        CivilizationKind::Germans => 0.65,
        CivilizationKind::Hittites => 0.50,
        CivilizationKind::Babylonia => 0.40,
        CivilizationKind::Assyria => 0.80,
        CivilizationKind::Phoenicians => 0.30,
        CivilizationKind::Babylon => 0.30,
        CivilizationKind::Minor => 0.15,
        CivilizationKind::Generic => 0.40,
    }
}

fn archetype_trade(kind: CivilizationKind) -> f64 {
    match kind {
        CivilizationKind::Greeks => 0.75,
        CivilizationKind::Romans => 0.50,
        CivilizationKind::Chinese => 0.85,
        CivilizationKind::Incas => 0.25,
        CivilizationKind::Zulus => 0.20,
        CivilizationKind::Egyptians => 0.60,
        CivilizationKind::Sumer => 0.65,
        CivilizationKind::Celts => 0.35,
        CivilizationKind::Germans => 0.30,
        CivilizationKind::Harappa => 0.80,
        CivilizationKind::Hittites => 0.50,
        CivilizationKind::Slavs => 0.40,
        CivilizationKind::Babylonia => 0.60,
        CivilizationKind::Assyria => 0.30,
        CivilizationKind::Phoenicians => 0.90,
        CivilizationKind::Babylon => 0.65,
        CivilizationKind::Minor => 0.60,
        CivilizationKind::Generic => 0.50,
    }
}

fn round4(value: f64) -> f64 {
    (value * 10_000.0).round() / 10_000.0
}

/// Deterministic AI stance equivalent to `aiDiplomacyStance` in the TS model.
pub fn ai_diplomacy_stance(
    ai_kind: CivilizationKind,
    _other_kind: CivilizationKind,
    relation: &Relation,
    context: &AiDiplomacyContext,
    params: &DiplomacyParams,
) -> AiDiplomacyStance {
    let score = relation_score_with_params(relation, params);
    if context.is_minor_civ || ai_kind == CivilizationKind::Minor {
        let fear_factor = if relation.respect > params.minor_acceptance_respect {
            0.9
        } else {
            relation.respect / params.minor_acceptance_respect
        };
        return AiDiplomacyStance {
            willingness_war: if score < params.minor_war_relation {
                0.2
            } else {
                0.05
            },
            willingness_peace: fear_factor,
            willingness_trade: if score > params.minor_trade_relation {
                0.6
            } else {
                0.2
            },
            willingness_ally: 0.0,
        };
    }

    let aggression = archetype_aggression(ai_kind);
    let trade = archetype_trade(ai_kind);
    let military_ratio = context.military_ratio;
    let war = if relation.status == RelationStatus::War {
        0.0
    } else {
        (aggression * 0.50
            + (relation.respect / 100.0) * 0.30
            + (1.0 - (score / 200.0).clamp(0.0, 1.0)) * 0.20)
            .clamp(0.0, 1.0)
    };
    let peace = if relation.status == RelationStatus::War {
        ((context.turns_at_war as f64 / 20.0).clamp(0.0, 0.50)
            + if military_ratio < 1.0 {
                (1.0 - military_ratio) * 0.40
            } else {
                0.0
            }
            + relation.trust / 100.0 * 0.20)
            .clamp(0.0, 1.0)
    } else {
        0.80
    };
    let trade_w = if score >= params.minimum_relation {
        (trade * 0.60 + (score / 200.0).clamp(0.0, 1.0) * 0.40).clamp(0.0, 1.0)
    } else {
        0.0
    };

    // `military_ratio` is M_AI/M_other; the strength helper expects the
    // proposed party's M/other ratio, i.e. its reciprocal here.
    let proposer_ratio = if military_ratio > 0.0 {
        1.0 / military_ratio
    } else {
        99.0
    };
    let adjustment = diplomacy_alliance_strength_adjust(
        proposer_ratio,
        (100.0 - relation.respect).max(0.0),
        relation.respect,
        params,
    );
    let minimum_trust = diplomacy_alliance_min_trust(&adjustment, proposer_ratio, params);
    let minimum_score = diplomacy_treaty_min_relation(
        params.alliance_relation - adjustment.ease.score_threshold_delta + adjustment.penalty_score,
        params,
    );
    let mut ally = 0.0;
    if !adjustment.hegemon_blocks_alliance
        && relation.trust >= minimum_trust
        && score >= minimum_score
    {
        let loyalty = match ai_kind {
            CivilizationKind::Chinese => 0.20,
            CivilizationKind::Incas => 0.15,
            CivilizationKind::Greeks => 0.10,
            CivilizationKind::Zulus => -0.20,
            _ => 0.0,
        };
        let trust_factor = relation.trust / 100.0 * 0.60;
        let score_factor = ((score - params.alliance_relation) / 80.0).clamp(0.0, 0.30);
        ally = (trust_factor + loyalty + score_factor).clamp(0.0, 1.0);
        if military_ratio < 1.0 {
            ally = (ally + (1.0 - military_ratio) * params.alliance_stronger_other_bonus)
                .clamp(0.0, 1.0);
        } else if military_ratio > 1.0 {
            ally = (ally - adjustment.ally_willingness_penalty).clamp(0.0, 1.0);
        }
    }
    AiDiplomacyStance {
        willingness_war: round4(war),
        willingness_peace: round4(peace),
        willingness_trade: round4(trade_w),
        willingness_ally: round4(ally),
    }
}

pub fn ai_stance(
    ai_kind: CivilizationKind,
    other_kind: CivilizationKind,
    relation: &Relation,
    context: &AiDiplomacyContext,
    params: &DiplomacyParams,
) -> AiDiplomacyStance {
    ai_diplomacy_stance(ai_kind, other_kind, relation, context, params)
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct DiploPairMeta {
    pub trust_pn_gained_this_turn: f64,
    pub goodwill_remaining_turns: f64,
}

impl Default for DiploPairMeta {
    fn default() -> Self {
        Self {
            trust_pn_gained_this_turn: 0.0,
            goodwill_remaining_turns: 0.0,
        }
    }
}

pub fn reset_pair_meta_for_turn(meta: &DiploPairMeta) -> DiploPairMeta {
    DiploPairMeta {
        trust_pn_gained_this_turn: 0.0,
        goodwill_remaining_turns: meta.goodwill_remaining_turns,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct TrustFromPn {
    pub surplus_pn: f64,
    pub raw_delta: f64,
    pub delta: f64,
}

pub fn fair_give_pn(receive_pn: f64, relation: f64) -> f64 {
    (non_negative(receive_pn) * (100.0 / relation.max(1.0))).ceil()
}

pub fn surplus_pn(give_pn: f64, receive_pn: f64, relation: f64) -> f64 {
    (non_negative(give_pn) - fair_give_pn(receive_pn, relation)).max(0.0)
}

pub fn pn_to_trust_delta(surplus: f64, params: &DiplomacyParams) -> f64 {
    if surplus < params.min_surplus_pn || params.pn_per_trust <= 0.0 {
        return 0.0;
    }
    (surplus / params.pn_per_trust).floor().max(0.0)
}

pub fn clamp_trust_gain(proposed_delta: f64, already_gained: f64, params: &DiplomacyParams) -> f64 {
    let room = (params.max_trust_from_pn_per_turn - already_gained.max(0.0)).max(0.0);
    non_negative(proposed_delta).min(room)
}

pub fn trust_from_surplus(
    surplus: f64,
    already_gained: f64,
    params: &DiplomacyParams,
) -> TrustFromPn {
    let raw = pn_to_trust_delta(surplus, params);
    TrustFromPn {
        surplus_pn: surplus,
        raw_delta: raw,
        delta: clamp_trust_gain(raw, already_gained, params),
    }
}

pub fn trade_trust_from_deal(
    give_pn: f64,
    receive_pn: f64,
    relation: f64,
    already_gained: f64,
    params: &DiplomacyParams,
) -> TrustFromPn {
    trust_from_surplus(
        surplus_pn(give_pn, receive_pn, relation),
        already_gained,
        params,
    )
}

pub fn gift_trust_from_pn(
    give_pn: f64,
    already_gained: f64,
    params: &DiplomacyParams,
) -> TrustFromPn {
    trade_trust_from_deal(give_pn, 0.0, 100.0, already_gained, params)
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Goodwill {
    pub active: bool,
    pub turns: f64,
    pub trust_per_turn: f64,
}

pub fn goodwill_from_surplus(surplus: f64, params: &DiplomacyParams) -> Goodwill {
    if surplus < params.goodwill_min_surplus_pn {
        Goodwill {
            active: false,
            turns: 0.0,
            trust_per_turn: 0.0,
        }
    } else {
        Goodwill {
            active: true,
            turns: params.goodwill_turns,
            trust_per_turn: params.goodwill_trust_per_turn,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TrustApplyResult {
    pub relation: Relation,
    pub meta: DiploPairMeta,
    pub delta_trust: f64,
    pub goodwill_started: bool,
}

pub fn apply_pn_trust(
    relation: &Relation,
    meta: &DiploPairMeta,
    give_pn: f64,
    receive_pn: f64,
    is_gift: bool,
    params: &DiplomacyParams,
) -> TrustApplyResult {
    let trust = if is_gift {
        gift_trust_from_pn(give_pn, meta.trust_pn_gained_this_turn, params)
    } else {
        trade_trust_from_deal(
            give_pn,
            receive_pn,
            relation_score_with_params(relation, params),
            meta.trust_pn_gained_this_turn,
            params,
        )
    };
    let goodwill = goodwill_from_surplus(trust.surplus_pn, params);
    let mut next_meta = *meta;
    next_meta.trust_pn_gained_this_turn += trust.delta;
    let mut started = false;
    if goodwill.active && goodwill.turns > 0.0 {
        next_meta.goodwill_remaining_turns = next_meta.goodwill_remaining_turns.max(goodwill.turns);
        started = true;
    }
    TrustApplyResult {
        relation: clamp_relation_for_war(&Relation::new(
            relation.trust + trust.delta,
            relation.respect,
            relation.status,
        )),
        meta: next_meta,
        delta_trust: trust.delta,
        goodwill_started: started,
    }
}

pub fn tick_goodwill(relation: &Relation, meta: &DiploPairMeta) -> (Relation, DiploPairMeta, f64) {
    if !meta.goodwill_remaining_turns.is_finite() || meta.goodwill_remaining_turns <= 0.0 {
        return (relation.clone(), *meta, 0.0);
    }
    let mut next_meta = *meta;
    next_meta.goodwill_remaining_turns = (next_meta.goodwill_remaining_turns - 1.0).max(0.0);
    (
        clamp_relation_for_war(&Relation::new(
            relation.trust + 1.0,
            relation.respect,
            relation.status,
        )),
        next_meta,
        1.0,
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TreatyKind {
    #[serde(rename = "pakt_nieagresji", alias = "nap")]
    Nap,
    #[serde(rename = "sojusz_defensywny")]
    DefensiveAlliance,
    #[serde(rename = "sojusz_pelny", alias = "sojusz_wojskowy")]
    FullAlliance,
    #[serde(rename = "umowa_wymiany")]
    Exchange,
    #[serde(rename = "umowa_szlakow", alias = "umowa_handlowa")]
    TradeRoute,
    #[serde(rename = "wasalizacja", alias = "wasal")]
    Vassalization,
    #[serde(rename = "prawo_wojskowe_przemarszu")]
    MilitaryMarch,
    #[serde(rename = "otwarte_granice")]
    OpenBorders,
    #[serde(rename = "wspolna_walka_barbarzyncy")]
    BarbarianCooperation,
}

impl TreatyKind {
    #[allow(non_upper_case_globals)]
    pub const SojuszDefensywny: Self = Self::DefensiveAlliance;
    #[allow(non_upper_case_globals)]
    pub const SojuszPelny: Self = Self::FullAlliance;
    #[allow(non_upper_case_globals)]
    pub const UmowaWymiany: Self = Self::Exchange;
    #[allow(non_upper_case_globals)]
    pub const UmowaSzlakow: Self = Self::TradeRoute;
    #[allow(non_upper_case_globals)]
    pub const Wasalizacja: Self = Self::Vassalization;

    pub fn is_alliance(self) -> bool {
        matches!(self, Self::DefensiveAlliance | Self::FullAlliance)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct TreatyEconomy {
    #[serde(rename = "payerOwnerId", alias = "payer_owner_id")]
    pub payer_owner_id: u64,
    #[serde(rename = "receiverOwnerId", alias = "receiver_owner_id")]
    pub receiver_owner_id: u64,
    #[serde(rename = "pieniadzePerTura", alias = "money_per_turn")]
    pub money_per_turn: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentKind {
    #[serde(rename = "zloto", alias = "gold")]
    Gold,
    #[serde(rename = "praca", alias = "work")]
    Work,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CyclicResourceTransfer {
    #[serde(rename = "surowiecKey", alias = "resource_key")]
    pub resource_key: String,
    #[serde(rename = "pakietyPerTura", alias = "units_per_turn")]
    pub units_per_turn: f64,
    #[serde(rename = "sellerOwnerId", alias = "seller_owner_id")]
    pub seller_owner_id: u64,
    #[serde(rename = "buyerOwnerId", alias = "buyer_owner_id")]
    pub buyer_owner_id: u64,
    #[serde(rename = "zaplataTyp", alias = "payment")]
    pub payment: Option<PaymentKind>,
    #[serde(rename = "zaplataPerTura", alias = "payment_per_turn")]
    pub payment_per_turn: f64,
    #[serde(
        rename = "sellerNiedostarczylTuryZRzedu",
        alias = "seller_failed_turns"
    )]
    pub seller_failed_turns: u32,
    #[serde(rename = "buyerNieZaplacilTuryZRzedu", alias = "buyer_failed_turns")]
    pub buyer_failed_turns: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ActiveDeal {
    pub id: String,
    #[serde(rename = "rodzaj", alias = "kind")]
    pub kind: TreatyKind,
    #[serde(rename = "strony", alias = "parties")]
    #[serde(with = "pair_array")]
    pub parties: CivilizationPair,
    #[serde(rename = "wygasaTura", alias = "expires_turn")]
    pub expires_turn: Option<u32>,
    #[serde(rename = "zawartaTura", alias = "formed_turn")]
    pub formed_turn: u32,
    #[serde(rename = "ekonomia", alias = "economy")]
    pub economy: Option<TreatyEconomy>,
    #[serde(
        rename = "handelSurowiecCykliczny",
        alias = "cyclic_resource_transfers"
    )]
    #[serde(default)]
    pub cyclic_resource_transfers: Vec<CyclicResourceTransfer>,
    #[serde(rename = "handelJednorazowy", alias = "one_shot_trade")]
    #[serde(default)]
    pub one_shot_trade: bool,
    #[serde(rename = "wspolnaWalkaBarbarzyncy", alias = "barbarian_cooperation")]
    #[serde(default)]
    pub barbarian_cooperation: bool,
}

impl ActiveDeal {
    pub fn new(
        kind: TreatyKind,
        owner_a: u64,
        owner_b: u64,
        formed_turn: u32,
        expires_turn: Option<u32>,
    ) -> Self {
        let parties = CivilizationPair::new(owner_a, owner_b);
        Self {
            id: format!(
                "{}-{}-{}-t{}",
                treaty_wire_name(kind),
                parties.first,
                parties.second,
                formed_turn
            ),
            kind,
            parties,
            expires_turn,
            formed_turn,
            economy: None,
            cyclic_resource_transfers: Vec::new(),
            one_shot_trade: false,
            barbarian_cooperation: false,
        }
    }

    pub fn is_active_at(&self, turn: u32) -> bool {
        self.expires_turn
            .map(|expiry| expiry > turn)
            .unwrap_or(true)
    }
}

fn treaty_wire_name(kind: TreatyKind) -> &'static str {
    match kind {
        TreatyKind::Nap => "pakt_nieagresji",
        TreatyKind::DefensiveAlliance => "sojusz_defensywny",
        TreatyKind::FullAlliance => "sojusz_pelny",
        TreatyKind::Exchange => "umowa_wymiany",
        TreatyKind::TradeRoute => "umowa_szlakow",
        TreatyKind::Vassalization => "wasalizacja",
        TreatyKind::MilitaryMarch => "prawo_wojskowe_przemarszu",
        TreatyKind::OpenBorders => "otwarte_granice",
        TreatyKind::BarbarianCooperation => "wspolna_walka_barbarzyncy",
    }
}

mod pair_array {
    use super::CivilizationPair;
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S>(pair: &CivilizationPair, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        [pair.first, pair.second].serialize(serializer)
    }

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum WirePair {
        Array([u64; 2]),
        Object { first: u64, second: u64 },
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<CivilizationPair, D::Error>
    where
        D: Deserializer<'de>,
    {
        let pair = match WirePair::deserialize(deserializer)? {
            WirePair::Array([first, second]) => (first, second),
            WirePair::Object { first, second } => (first, second),
        };
        Ok(CivilizationPair::new(pair.0, pair.1))
    }
}

mod pair_relation_map {
    use super::{CivilizationPair, Relation};
    use serde::de::Error as DeError;
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use std::collections::BTreeMap;

    pub fn serialize<S>(
        relations: &BTreeMap<CivilizationPair, Relation>,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let encoded = relations
            .iter()
            .map(|(pair, relation)| (format!("{}_{}", pair.first, pair.second), relation))
            .collect::<BTreeMap<_, _>>();
        encoded.serialize(serializer)
    }

    pub fn deserialize<'de, D>(
        deserializer: D,
    ) -> Result<BTreeMap<CivilizationPair, Relation>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let encoded = BTreeMap::<String, Relation>::deserialize(deserializer)?;
        let mut relations = BTreeMap::new();
        for (key, relation) in encoded {
            let mut parts = key.split('_');
            let first = parts
                .next()
                .ok_or_else(|| D::Error::custom(format!("invalid diplomacy pair key {key:?}")))?;
            let second = parts
                .next()
                .ok_or_else(|| D::Error::custom(format!("invalid diplomacy pair key {key:?}")))?;
            if parts.next().is_some() {
                return Err(D::Error::custom(format!(
                    "invalid diplomacy pair key {key:?}"
                )));
            }
            let first = first.parse::<u64>().map_err(|_| {
                D::Error::custom(format!("invalid first owner in diplomacy pair key {key:?}"))
            })?;
            let second = second.parse::<u64>().map_err(|_| {
                D::Error::custom(format!(
                    "invalid second owner in diplomacy pair key {key:?}"
                ))
            })?;
            let pair = CivilizationPair::new(first, second);
            if relations.insert(pair, relation).is_some() {
                return Err(D::Error::custom(format!(
                    "duplicate diplomacy pair key {key:?}"
                )));
            }
        }
        Ok(relations)
    }
}

/// Per-pair diplomacy state.  The map key is canonical, so A→B and B→A share
/// exactly one trust record and one treaty collection.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct DiplomacyState {
    #[serde(with = "pair_relation_map")]
    pub relations: BTreeMap<CivilizationPair, Relation>,
    pub deals: Vec<ActiveDeal>,
}

impl DiplomacyState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn relation(&self, owner_a: u64, owner_b: u64) -> Option<&Relation> {
        self.relations.get(&CivilizationPair::new(owner_a, owner_b))
    }

    pub fn set_relation(&mut self, pair: CivilizationPair, relation: Relation) {
        self.relations
            .insert(CivilizationPair::new(pair.first, pair.second), relation);
    }

    pub fn ensure_relation(&mut self, owner_a: u64, owner_b: u64) -> &mut Relation {
        self.relations
            .entry(CivilizationPair::new(owner_a, owner_b))
            .or_insert_with(Relation::starting)
    }

    pub fn apply_event(&mut self, owner_a: u64, owner_b: u64, event: DiplomaticEvent) -> Relation {
        let pair = CivilizationPair::new(owner_a, owner_b);
        let current = self
            .relations
            .get(&pair)
            .cloned()
            .unwrap_or_else(Relation::starting);
        let changed = apply_diplomatic_event(&current, event);
        self.relations.insert(pair, changed.clone());
        changed
    }

    pub fn tick_pair(
        &mut self,
        owner_a: u64,
        owner_b: u64,
        context: &TickContext,
        params: &DiplomacyParams,
    ) -> Relation {
        let pair = CivilizationPair::new(owner_a, owner_b);
        let current = self
            .relations
            .get(&pair)
            .cloned()
            .unwrap_or_else(Relation::starting);
        let changed = tick_relation(&current, context, params);
        self.relations.insert(pair, changed.clone());
        changed
    }

    pub fn add_deal(&mut self, mut deal: ActiveDeal) {
        deal.parties = CivilizationPair::new(deal.parties.first, deal.parties.second);
        self.deals.retain(|existing| existing.id != deal.id);
        self.deals.push(deal);
    }

    pub fn expire_deals(&mut self, turn: u32) {
        self.deals.retain(|deal| deal.is_active_at(turn));
    }

    pub fn has_deal(&self, owner_a: u64, owner_b: u64, kind: Option<TreatyKind>) -> bool {
        let pair = CivilizationPair::new(owner_a, owner_b);
        self.deals.iter().any(|deal| {
            deal.parties == pair && kind.map(|wanted| wanted == deal.kind).unwrap_or(true)
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BasketItemKind {
    #[serde(rename = "zloto", alias = "gold")]
    Gold,
    #[serde(rename = "praca", alias = "work")]
    Work,
    #[serde(rename = "zywnosc", alias = "food")]
    Food,
    #[serde(rename = "zloze", alias = "deposit")]
    Deposit,
    #[serde(rename = "tech", alias = "technology")]
    Technology,
    #[serde(rename = "jednostka", alias = "unit")]
    Unit,
    #[serde(rename = "surowiec_boolean", alias = "resource_access")]
    BooleanResource,
    #[serde(rename = "surowiec_ilosc", alias = "quantity_resource")]
    QuantityResource,
    #[serde(rename = "dostep_do_surowca")]
    ResourceAccess,
}

impl BasketItemKind {
    pub fn is_withdrawn_access(self) -> bool {
        matches!(
            self,
            Self::Deposit | Self::BooleanResource | Self::ResourceAccess
        )
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BasketItem {
    #[serde(rename = "typ", alias = "kind")]
    pub kind: BasketItemKind,
    pub id: String,
    #[serde(
        rename = "ilosc",
        alias = "quantity",
        default = "default_basket_quantity"
    )]
    pub quantity: f64,
    #[serde(rename = "poziom", alias = "level")]
    pub level: Option<u32>,
}

fn default_basket_quantity() -> f64 {
    1.0
}

impl BasketItem {
    pub fn new(kind: BasketItemKind, id: impl Into<String>, quantity: f64) -> Self {
        Self {
            kind,
            id: id.into(),
            quantity,
            level: None,
        }
    }

    pub fn quantity_resource(id: impl Into<String>, quantity: f64) -> Self {
        Self::new(BasketItemKind::QuantityResource, id, quantity)
    }

    pub fn gold(quantity: f64) -> Self {
        Self::new(BasketItemKind::Gold, "", quantity)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ValueCatalog {
    pub resource_prices_per_block: BTreeMap<String, f64>,
    pub technology_prices: BTreeMap<String, f64>,
    pub resource_access_prices: BTreeMap<String, f64>,
    pub deposit_prices: BTreeMap<String, f64>,
    pub unit_prices: BTreeMap<String, f64>,
}

impl Default for ValueCatalog {
    fn default() -> Self {
        let resource_prices_per_block = BTreeMap::from([
            ("drewno".to_owned(), 1.0),
            ("glina".to_owned(), 2.0),
            ("kamien".to_owned(), 3.0),
            ("ruda".to_owned(), 5.0),
            ("ruda_zelaza".to_owned(), 10.0),
            ("ruda_cyny".to_owned(), 10.0),
            ("cegla".to_owned(), 5.0),
            ("sol".to_owned(), 2.0),
            ("kon".to_owned(), 5.0),
            ("ceramika".to_owned(), 5.0),
            ("braz".to_owned(), 15.0),
            ("zelazo".to_owned(), 20.0),
            ("stal".to_owned(), 25.0),
            ("zloto".to_owned(), 50.0),
            ("wegiel".to_owned(), 20.0),
        ]);
        // These values mirror the canonical source catalogs.  Keeping the
        // defaults in the pure engine makes basket valuation deterministic and
        // avoids coupling the Rust crate to the TypeScript asset loader.
        let technology_prices = BTreeMap::from([
            ("Obróbka drewna".to_owned(), 5.0),
            ("Garncarstwo".to_owned(), 40.0),
            ("Murarstwo".to_owned(), 56.0),
            ("Rolnictwo".to_owned(), 5.0),
            ("Łowiectwo".to_owned(), 5.0),
            ("Łucznictwo".to_owned(), 56.0),
            ("Oswojenie zwierząt".to_owned(), 5.0),
            ("Mistycyzm".to_owned(), 40.0),
            ("Wymiana".to_owned(), 64.0),
            ("Gospodarka wodna".to_owned(), 72.0),
            ("Koło".to_owned(), 88.0),
            ("Brązownictwo".to_owned(), 180.0),
            ("Żegluga".to_owned(), 160.0),
            ("Pismo".to_owned(), 180.0),
            ("Religia".to_owned(), 192.0),
            ("Jeździectwo".to_owned(), 224.0),
            ("Wojskowość".to_owned(), 208.0),
            ("Matematyka".to_owned(), 272.0),
            ("Handel".to_owned(), 296.0),
            ("Kodeks".to_owned(), 248.0),
            ("Budownictwo".to_owned(), 340.0),
            ("Waluta".to_owned(), 400.0),
            ("Astronomia".to_owned(), 440.0),
            ("Hutnictwo żelaza".to_owned(), 480.0),
            ("Inżynieria".to_owned(), 520.0),
            ("Oblężnictwo".to_owned(), 560.0),
            ("Filozofia".to_owned(), 600.0),
            ("Prawo".to_owned(), 620.0),
            ("Drogi brukowane".to_owned(), 680.0),
            ("Medycyna".to_owned(), 648.0),
            ("Obróbka żelaza".to_owned(), 740.0),
            ("Sztuka wojenna".to_owned(), 800.0),
        ]);
        let resource_access_prices = BTreeMap::from([
            ("bydlo".to_owned(), 20.0),
            ("owce".to_owned(), 20.0),
            ("lama".to_owned(), 20.0),
            ("kon".to_owned(), 28.0),
            ("glina".to_owned(), 20.0),
            ("kamien".to_owned(), 22.0),
            ("drewno".to_owned(), 25.0),
            ("sol".to_owned(), 20.0),
            ("ruda".to_owned(), 22.0),
            ("ruda_zelaza".to_owned(), 22.0),
            ("ruda_cyny".to_owned(), 22.0),
            ("zloto".to_owned(), 22.0),
        ]);
        let deposit_prices = BTreeMap::from([
            ("glina".to_owned(), 50.0),
            ("sol".to_owned(), 50.0),
            ("konie".to_owned(), 100.0),
            ("wegiel".to_owned(), 100.0),
            ("miedz".to_owned(), 120.0),
            ("zelazo".to_owned(), 150.0),
        ]);
        let unit_prices = BTreeMap::from([
            ("Wojownik".to_owned(), 10.0),
            ("Procarz".to_owned(), 8.0),
            ("Oszczepnik".to_owned(), 6.0),
            ("Łucznik".to_owned(), 6.0),
            ("Zwiadowca".to_owned(), 8.0),
            ("Włócznik".to_owned(), 16.0),
            ("Wojownik z mieczem i tarczą".to_owned(), 16.0),
            ("Rydwan (woły)".to_owned(), 30.0),
            ("Konnica".to_owned(), 22.0),
            ("Galera".to_owned(), 18.0),
            ("Falanga".to_owned(), 18.0),
            ("Hastati".to_owned(), 18.0),
            ("Jeździec chiński".to_owned(), 28.0),
            ("Impi".to_owned(), 16.0),
            ("Oszczepnik Zulu (Izijula)".to_owned(), 20.0),
            ("Wojownik z maczugą (Chaska)".to_owned(), 26.0),
            ("Wojownik z toporem".to_owned(), 18.0),
            ("Procarz (Huaracoc)".to_owned(), 8.0),
            ("Oszczepnik (Estólica)".to_owned(), 9.0),
            ("Rydwan konny".to_owned(), 28.0),
            ("Łucznik egipski".to_owned(), 14.0),
            ("Rydwan egipski".to_owned(), 32.0),
            ("Wojownik z khopesh".to_owned(), 18.0),
            ("Łucznik nubijski".to_owned(), 20.0),
            ("Łucznik sumeryjski".to_owned(), 9.0),
            ("Rydwan sumeryjski".to_owned(), 38.0),
            ("Włócznik sumeryjski".to_owned(), 18.0),
            ("Wojownik mykeński".to_owned(), 18.0),
            ("Rydwan mykeński".to_owned(), 30.0),
            ("Wojownik Sherden".to_owned(), 18.0),
            ("Halabardnik Shang".to_owned(), 18.0),
            ("Rydwan Shang".to_owned(), 32.0),
            ("Łucznik akadyjski".to_owned(), 16.0),
            ("Gaesatae".to_owned(), 14.0),
            ("Soldurii".to_owned(), 18.0),
            ("Rydwan celtycki".to_owned(), 28.0),
            ("Berserker germański".to_owned(), 16.0),
            ("Taran".to_owned(), 14.0),
            ("Taran okuty".to_owned(), 18.0),
            ("Katapulta".to_owned(), 18.0),
            ("Wieża oblężnicza".to_owned(), 20.0),
            ("Wojownik tyrreński".to_owned(), 15.0),
            ("Wojownik szekelesz".to_owned(), 14.0),
            ("Konnica lancowa asyryjska".to_owned(), 32.0),
            ("Konnica łucznicza asyryjska".to_owned(), 30.0),
            ("Łucznik asyryjski".to_owned(), 14.0),
            ("Drużynnik".to_owned(), 18.0),
            ("Jeździec z oszczepami".to_owned(), 26.0),
            ("Strażnik bram Harappy".to_owned(), 18.0),
            ("Piechota induska".to_owned(), 18.0),
            ("Garnizon Harappy".to_owned(), 18.0),
            ("Rydwan Kapadokijski".to_owned(), 34.0),
            ("Piechota hetycka".to_owned(), 18.0),
            ("Gwardia hetycka".to_owned(), 18.0),
            ("Gwardia Ishtar".to_owned(), 18.0),
            ("Wojownik babiloński".to_owned(), 18.0),
            ("Piechota neobabilońska".to_owned(), 18.0),
            ("Tyrski miecznik".to_owned(), 18.0),
            ("Wojownik fenicki".to_owned(), 18.0),
            ("Gwardia Tyreńska".to_owned(), 18.0),
            ("Thorakites".to_owned(), 16.0),
            ("iButho z iklwa".to_owned(), 16.0),
            ("Gwardzista z champi".to_owned(), 18.0),
            ("Wojownik z żelaznym khopesh".to_owned(), 18.0),
            ("Mur tarcz (Sargonid)".to_owned(), 18.0),
            ("Miecznik galijski".to_owned(), 14.0),
        ]);
        Self {
            resource_prices_per_block,
            technology_prices,
            resource_access_prices,
            deposit_prices,
            unit_prices,
        }
    }
}

const STEP_TEN_RESOURCES: &[&str] = &[
    "drewno",
    "glina",
    "kamien",
    "ruda",
    "ruda_zelaza",
    "ruda_cyny",
    "cegla",
    "sol",
    "kon",
    "ceramika",
    "braz",
    "zelazo",
    "stal",
];

pub fn trade_step(resource: &str) -> f64 {
    if STEP_TEN_RESOURCES.contains(&normalized_key(resource).as_str()) {
        10.0
    } else {
        1.0
    }
}

pub fn normalize_resource_quantity(
    resource: &str,
    requested: f64,
    max_available: Option<f64>,
) -> f64 {
    if !requested.is_finite() {
        return 0.0;
    }
    let capped = max_available
        .filter(|max| max.is_finite())
        .map(|max| requested.min(max))
        .unwrap_or(requested);
    if capped <= 0.0 {
        return 0.0;
    }
    let step = trade_step(resource);
    (capped / step).floor() * step
}

pub fn resource_price_per_block(resource: &str, catalog: &ValueCatalog) -> Option<f64> {
    catalog
        .resource_prices_per_block
        .get(&normalized_key(resource))
        .copied()
}

pub fn quantity_resource_pn_with_catalog(
    resource: &str,
    quantity: f64,
    catalog: &ValueCatalog,
) -> Option<f64> {
    let price = resource_price_per_block(resource, catalog)?;
    let normalized = normalize_resource_quantity(resource, quantity, None);
    Some((normalized / trade_step(resource) * price).round().max(0.0))
}

pub fn quantity_resource_pn(resource: &str, quantity: f64) -> Option<f64> {
    quantity_resource_pn_with_catalog(resource, quantity, &ValueCatalog::default())
}

pub fn basket_item_pn(item: &BasketItem, catalog: &ValueCatalog) -> Option<f64> {
    let quantity = non_negative(item.quantity);
    match item.kind {
        BasketItemKind::Gold | BasketItemKind::Work => Some(quantity.round()),
        BasketItemKind::Food => Some(quantity.floor()),
        BasketItemKind::QuantityResource => {
            quantity_resource_pn_with_catalog(&item.id, quantity, catalog)
        }
        BasketItemKind::Technology => catalog
            .technology_prices
            .get(item.id.trim())
            .map(|price| (price * quantity).round()),
        BasketItemKind::BooleanResource => catalog
            .resource_access_prices
            .get(&normalized_key(&item.id))
            .map(|price| (price * quantity).round()),
        BasketItemKind::Deposit => catalog
            .deposit_prices
            .get(&normalized_key(&item.id))
            .map(|price| (price * quantity).round()),
        BasketItemKind::Unit => catalog
            .unit_prices
            .get(item.id.trim())
            .map(|price| (price * quantity).round()),
        BasketItemKind::ResourceAccess => catalog
            .resource_access_prices
            .get(&normalized_key(&item.id))
            .map(|price| (price * quantity).round()),
    }
}

pub fn sum_basket_pn(items: &[BasketItem], catalog: &ValueCatalog) -> Option<f64> {
    let mut total = 0.0;
    for item in items {
        if !item.quantity.is_finite() || item.quantity <= 0.0 {
            continue;
        }
        total += basket_item_pn(item, catalog)?;
    }
    Some(total)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BasketSide {
    Give,
    Receive,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ProposalPnOptions {
    pub difficulty: Difficulty,
    pub proposer_owner_id: Option<u64>,
    pub player_owner_id: u64,
    pub turns_multiplier: f64,
    pub per_turn: bool,
}

impl Default for ProposalPnOptions {
    fn default() -> Self {
        Self {
            difficulty: Difficulty::Normal,
            proposer_owner_id: None,
            player_owner_id: 0,
            turns_multiplier: 1.0,
            per_turn: false,
        }
    }
}

fn basket_side_difficulty_multiplier(side: BasketSide, options: &ProposalPnOptions) -> f64 {
    let Some(proposer_owner_id) = options.proposer_owner_id else {
        return 1.0;
    };
    let player_is_proposer = proposer_owner_id == options.player_owner_id;
    let player_sells = match side {
        BasketSide::Give => player_is_proposer,
        BasketSide::Receive => !player_is_proposer,
    };
    match (player_sells, options.difficulty) {
        (true, Difficulty::Easy) => 1.5,
        (true, Difficulty::Normal) => 1.0,
        (true, Difficulty::Hard) => 0.5,
        (false, Difficulty::Easy) => 0.5,
        (false, Difficulty::Normal) => 1.0,
        (false, Difficulty::Hard) => 1.5,
    }
}

fn basket_item_is_per_turn(kind: BasketItemKind) -> bool {
    matches!(
        kind,
        BasketItemKind::Gold
            | BasketItemKind::Work
            | BasketItemKind::Food
            | BasketItemKind::QuantityResource
    )
}

pub fn sum_basket_pn_with_options(
    items: &[BasketItem],
    catalog: &ValueCatalog,
    side: BasketSide,
    options: &ProposalPnOptions,
) -> Option<f64> {
    let side_multiplier = basket_side_difficulty_multiplier(side, options);
    let turns_multiplier = if options.per_turn && options.turns_multiplier.is_finite() {
        options.turns_multiplier.max(1.0)
    } else {
        1.0
    };
    let mut total = 0.0;
    for item in items {
        if !item.quantity.is_finite() || item.quantity <= 0.0 {
            continue;
        }
        let base = basket_item_pn(item, catalog)?;
        let mut line = (base * side_multiplier).round().max(0.0);
        if options.per_turn && turns_multiplier > 1.0 && basket_item_is_per_turn(item.kind) {
            line *= turns_multiplier;
        }
        total += line;
    }
    Some(total)
}

pub fn resolve_proposal_pn_with_options(
    payload: &ProposalPayload,
    catalog: &ValueCatalog,
    options: &ProposalPnOptions,
) -> (f64, f64) {
    let mut give = payload.give_pn.unwrap_or(0.0);
    let mut receive = payload.receive_pn.unwrap_or(0.0);
    if !payload.give_items.is_empty() {
        if let Some(value) =
            sum_basket_pn_with_options(&payload.give_items, catalog, BasketSide::Give, options)
        {
            give = value;
        }
    }
    if !payload.receive_items.is_empty() {
        if let Some(value) = sum_basket_pn_with_options(
            &payload.receive_items,
            catalog,
            BasketSide::Receive,
            options,
        ) {
            receive = value;
        }
    }
    if give <= 0.0 {
        if let Some(gold) = payload.gold_once {
            if gold.is_finite() && gold > 0.0 {
                give = gold.round();
            }
        }
    }
    if give <= 0.0 {
        if let Some(amount) = payload.amount {
            if amount.is_finite() && amount > 0.0 {
                give = (amount * 10.0).round();
            }
        }
    }
    (non_negative(give), non_negative(receive))
}

pub fn resolve_proposal_pn(payload: &ProposalPayload, catalog: &ValueCatalog) -> (f64, f64) {
    resolve_proposal_pn_with_options(payload, catalog, &ProposalPnOptions::default())
}

fn proposal_has_unpriced_item(payload: &ProposalPayload, catalog: &ValueCatalog) -> bool {
    payload
        .give_items
        .iter()
        .chain(payload.receive_items.iter())
        .any(|item| {
            item.quantity.is_finite()
                && item.quantity > 0.0
                && basket_item_pn(item, catalog).is_none()
        })
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TechDefinition {
    pub id: String,
    pub prerequisites: Vec<String>,
    pub era: Option<u32>,
    pub tier: Option<u32>,
}

impl TechDefinition {
    pub fn new<I, S>(id: impl Into<String>, prerequisites: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        Self {
            id: id.into(),
            prerequisites: prerequisites.into_iter().map(Into::into).collect(),
            era: None,
            tier: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ResourceAccessGrant {
    pub id: String,
    #[serde(rename = "granterOwnerId", alias = "granter_owner_id")]
    pub granter_owner_id: u64,
    #[serde(rename = "granteeOwnerId", alias = "grantee_owner_id")]
    pub grantee_owner_id: u64,
    #[serde(rename = "rawKey", alias = "resource_key")]
    pub resource_key: String,
    pub active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct BasketTransferContext {
    #[serde(rename = "researchedByOwner", alias = "researched_by_owner")]
    pub researched_by_owner: BTreeMap<u64, BTreeSet<String>>,
    #[serde(rename = "surowiecBooleanGrants", alias = "resource_grants")]
    pub resource_grants: Vec<ResourceAccessGrant>,
    #[serde(rename = "techCatalog", alias = "tech_catalog")]
    pub tech_catalog: Option<Vec<TechDefinition>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GrantTechResult {
    pub context: BasketTransferContext,
    pub granted: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GrantResourceResult {
    pub context: BasketTransferContext,
    pub granted: bool,
    pub grant_id: Option<String>,
    pub reason: Option<String>,
}

fn tech_epoch_gate_met(
    definition: &TechDefinition,
    catalog: &[TechDefinition],
    current: &BTreeSet<String>,
) -> bool {
    let Some(era) = definition.era else {
        return true;
    };
    catalog
        .iter()
        .filter(|other| other.era.is_some_and(|other_era| other_era < era))
        .all(|other| current.contains(&other.id))
}

fn tech_tier_gate_met(
    definition: &TechDefinition,
    catalog: &[TechDefinition],
    current: &BTreeSet<String>,
) -> bool {
    let (Some(era), Some(tier)) = (definition.era, definition.tier) else {
        return true;
    };
    catalog
        .iter()
        .filter(|other| {
            other.era == Some(era) && other.tier.is_some_and(|other_tier| other_tier < tier)
        })
        .all(|other| current.contains(&other.id))
}

fn next_resource_grant_id(grants: &[ResourceAccessGrant]) -> String {
    let mut sequence = grants
        .iter()
        .filter_map(|grant| grant.id.strip_prefix("sraw_")?.parse::<u64>().ok())
        .max()
        .unwrap_or(0)
        .saturating_add(1);
    loop {
        let candidate = format!("sraw_{sequence}");
        if !grants.iter().any(|grant| grant.id == candidate) {
            return candidate;
        }
        sequence = sequence.saturating_add(1);
    }
}

pub fn grant_technology(
    context: &BasketTransferContext,
    tech_id: &str,
    to_owner_id: u64,
) -> GrantTechResult {
    let id = tech_id.trim();
    if id.is_empty() {
        return GrantTechResult {
            context: context.clone(),
            granted: false,
            reason: Some("Brak identyfikatora technologii".to_owned()),
        };
    }
    let definition = context
        .tech_catalog
        .as_ref()
        .and_then(|catalog| catalog.iter().find(|tech| tech.id == id));
    if context
        .tech_catalog
        .as_ref()
        .is_some_and(|catalog| !catalog.is_empty())
        && definition.is_none()
    {
        return GrantTechResult {
            context: context.clone(),
            granted: false,
            reason: Some(format!("Nieznana technologia: {id}")),
        };
    }

    let current = context
        .researched_by_owner
        .get(&to_owner_id)
        .cloned()
        .unwrap_or_default();
    if current.contains(id) {
        return GrantTechResult {
            context: context.clone(),
            granted: false,
            reason: Some("Technologia już zbadana".to_owned()),
        };
    }
    if let Some(definition) = definition {
        let is_trade_technology = normalized_key(id) == "wymiana"
            || normalized_key(id) == "exchange"
            || normalized_key(id) == "trade";
        let prereqs_met = is_trade_technology
            || definition
                .prerequisites
                .iter()
                .all(|prerequisite| current.contains(prerequisite));
        let (epoch_met, tier_met) = context
            .tech_catalog
            .as_ref()
            .map(|catalog| {
                (
                    tech_epoch_gate_met(definition, catalog, &current),
                    tech_tier_gate_met(definition, catalog, &current),
                )
            })
            .unwrap_or((true, true));
        if !prereqs_met || !epoch_met || !tier_met {
            return GrantTechResult {
                context: context.clone(),
                granted: false,
                reason: Some(format!("Brak wymaganych prerekwizytów/epoki: {id}")),
            };
        }
    }

    let mut next = context.clone();
    next.researched_by_owner
        .entry(to_owner_id)
        .or_default()
        .insert(id.to_owned());
    GrantTechResult {
        context: next,
        granted: true,
        reason: None,
    }
}

pub fn grant_tech_to_owner(
    tech_id: &str,
    to_owner_id: u64,
    context: &BasketTransferContext,
) -> GrantTechResult {
    grant_technology(context, tech_id, to_owner_id)
}

pub fn grant_resource_access(
    context: &BasketTransferContext,
    resource_key: &str,
    from_owner_id: u64,
    to_owner_id: u64,
) -> GrantResourceResult {
    let key = normalized_key(resource_key);
    if key.is_empty() {
        return GrantResourceResult {
            context: context.clone(),
            granted: false,
            grant_id: None,
            reason: Some("Brak klucza surowca".to_owned()),
        };
    }
    if from_owner_id == to_owner_id {
        return GrantResourceResult {
            context: context.clone(),
            granted: false,
            grant_id: None,
            reason: Some("Grantor = odbiorca".to_owned()),
        };
    }
    let active = context.resource_grants.iter().any(|grant| {
        grant.active
            && grant.granter_owner_id == from_owner_id
            && grant.grantee_owner_id == to_owner_id
            && normalized_key(&grant.resource_key) == key
    });
    if active {
        return GrantResourceResult {
            context: context.clone(),
            granted: false,
            grant_id: None,
            reason: Some("Aktywny grant już istnieje".to_owned()),
        };
    }
    let mut next = context.clone();
    let grant_id = next_resource_grant_id(&next.resource_grants);
    next.resource_grants.push(ResourceAccessGrant {
        id: grant_id.clone(),
        granter_owner_id: from_owner_id,
        grantee_owner_id: to_owner_id,
        resource_key: key,
        active: true,
    });
    GrantResourceResult {
        context: next,
        granted: true,
        grant_id: Some(grant_id),
        reason: None,
    }
}

pub fn grant_surowiec_boolean_access(
    resource_key: &str,
    from_owner_id: u64,
    to_owner_id: u64,
    context: &BasketTransferContext,
) -> GrantResourceResult {
    grant_resource_access(context, resource_key, from_owner_id, to_owner_id)
}

pub fn has_resource_access(
    context: &BasketTransferContext,
    resource_key: &str,
    from_owner_id: u64,
    to_owner_id: u64,
) -> bool {
    let key = normalized_key(resource_key);
    context.resource_grants.iter().any(|grant| {
        grant.active
            && grant.granter_owner_id == from_owner_id
            && grant.grantee_owner_id == to_owner_id
            && normalized_key(&grant.resource_key) == key
    })
}

pub fn has_surowiec_boolean_access(
    resource_key: &str,
    from_owner_id: u64,
    to_owner_id: u64,
    context: &BasketTransferContext,
) -> bool {
    has_resource_access(context, resource_key, from_owner_id, to_owner_id)
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CityResourceState {
    pub id: String,
    #[serde(rename = "ownerId", alias = "owner_id")]
    pub owner_id: u64,
    #[serde(rename = "surowce", alias = "resources")]
    pub resources: BTreeMap<String, f64>,
}

impl CityResourceState {
    pub fn new(id: impl Into<String>, owner_id: u64) -> Self {
        Self {
            id: id.into(),
            owner_id,
            resources: BTreeMap::new(),
        }
    }

    pub fn with_resources<I, K>(id: impl Into<String>, owner_id: u64, resources: I) -> Self
    where
        I: IntoIterator<Item = (K, f64)>,
        K: Into<String>,
    {
        Self {
            id: id.into(),
            owner_id,
            resources: resources
                .into_iter()
                .map(|(key, amount)| (normalized_key(&key.into()), non_negative(amount)))
                .collect(),
        }
    }
}

pub type ResourceIloscCityRef = CityResourceState;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ResourceTransferReason {
    #[serde(rename = "brak_ilosci")]
    InvalidQuantity,
    #[serde(rename = "brak_zapasow_dawcy")]
    NoDonorStock,
    #[serde(rename = "brak_miasta_odbiorcy")]
    NoRecipientCity,
    #[serde(rename = "dawca_rowny_biorcy")]
    SameOwner,
}

pub type ResourceIloscTransferReason = ResourceTransferReason;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ResourceTransferResult {
    pub cities: Vec<CityResourceState>,
    pub moved: f64,
    pub reason: Option<ResourceTransferReason>,
}

pub type ResourceIloscTransferResult = ResourceTransferResult;

/// Move quantity resources atomically. Donor cities are consumed by descending
/// stock, with city id as deterministic tie-breaker; the recipient is its
/// capital when present, otherwise its first city.
pub fn transfer_quantity_resource(
    resource_key: &str,
    total_units: f64,
    from_owner_id: u64,
    to_owner_id: u64,
    capital_city_id: Option<&str>,
    cities: &[CityResourceState],
) -> ResourceTransferResult {
    let key = normalized_key(resource_key);
    if key.is_empty() || !total_units.is_finite() || total_units <= 0.0 {
        return ResourceTransferResult {
            cities: cities.to_vec(),
            moved: 0.0,
            reason: Some(ResourceTransferReason::InvalidQuantity),
        };
    }
    if from_owner_id == to_owner_id {
        return ResourceTransferResult {
            cities: cities.to_vec(),
            moved: 0.0,
            reason: Some(ResourceTransferReason::SameOwner),
        };
    }

    let mut donor_indexes: Vec<usize> = cities
        .iter()
        .enumerate()
        .filter(|(_, city)| city.owner_id == from_owner_id)
        .map(|(index, _)| index)
        .collect();
    donor_indexes.sort_by(|left, right| {
        let left_stock = cities[*left].resources.get(&key).copied().unwrap_or(0.0);
        let right_stock = cities[*right].resources.get(&key).copied().unwrap_or(0.0);
        right_stock
            .total_cmp(&left_stock)
            .then_with(|| cities[*left].id.cmp(&cities[*right].id))
    });

    let mut remaining = total_units;
    let mut moved = 0.0;
    let mut donor_updates: BTreeMap<usize, f64> = BTreeMap::new();
    for index in donor_indexes {
        if remaining <= 0.0 {
            break;
        }
        let stock = cities[index]
            .resources
            .get(&key)
            .copied()
            .unwrap_or(0.0)
            .max(0.0);
        if stock <= 0.0 {
            continue;
        }
        let take = stock.min(remaining);
        donor_updates.insert(index, stock - take);
        remaining -= take;
        moved += take;
    }

    if moved <= 0.0 {
        return ResourceTransferResult {
            cities: cities.to_vec(),
            moved: 0.0,
            reason: Some(ResourceTransferReason::NoDonorStock),
        };
    }

    let recipient_index = capital_city_id
        .and_then(|capital| {
            cities
                .iter()
                .position(|city| city.owner_id == to_owner_id && city.id == capital)
        })
        .or_else(|| cities.iter().position(|city| city.owner_id == to_owner_id));
    let Some(recipient_index) = recipient_index else {
        return ResourceTransferResult {
            cities: cities.to_vec(),
            moved: 0.0,
            reason: Some(ResourceTransferReason::NoRecipientCity),
        };
    };

    let mut next = cities.to_vec();
    for (index, amount) in donor_updates {
        next[index].resources.insert(key.clone(), amount.max(0.0));
    }
    let recipient_stock = next[recipient_index]
        .resources
        .get(&key)
        .copied()
        .unwrap_or(0.0)
        .max(0.0);
    next[recipient_index]
        .resources
        .insert(key, recipient_stock + moved);

    ResourceTransferResult {
        cities: next,
        moved,
        reason: None,
    }
}

pub fn transfer_surowiec_ilosc(
    resource_key: &str,
    total_units: f64,
    from_owner_id: u64,
    to_owner_id: u64,
    capital_city_id: Option<&str>,
    cities: &[CityResourceState],
) -> ResourceIloscTransferResult {
    transfer_quantity_resource(
        resource_key,
        total_units,
        from_owner_id,
        to_owner_id,
        capital_city_id,
        cities,
    )
}

pub fn build_cyclic_resource_transfers(
    proposer_id: u64,
    responder_id: u64,
    give_items: &[BasketItem],
    receive_items: &[BasketItem],
) -> Vec<CyclicResourceTransfer> {
    let give_resource = give_items
        .iter()
        .find(|item| item.kind == BasketItemKind::QuantityResource && item.quantity > 0.0);
    let receive_resource = receive_items
        .iter()
        .find(|item| item.kind == BasketItemKind::QuantityResource && item.quantity > 0.0);
    let give_payment = give_items
        .iter()
        .find(|item| matches!(item.kind, BasketItemKind::Gold | BasketItemKind::Work));
    let receive_payment = receive_items
        .iter()
        .find(|item| matches!(item.kind, BasketItemKind::Gold | BasketItemKind::Work));
    let mut transfers = Vec::new();

    if let Some(resource) = give_resource {
        let units = normalize_resource_quantity(&resource.id, resource.quantity, None);
        if units > 0.0 {
            transfers.push(CyclicResourceTransfer {
                resource_key: normalized_key(&resource.id),
                units_per_turn: units,
                seller_owner_id: proposer_id,
                buyer_owner_id: responder_id,
                payment: receive_payment.map(|item| match item.kind {
                    BasketItemKind::Gold => PaymentKind::Gold,
                    BasketItemKind::Work => PaymentKind::Work,
                    _ => unreachable!(),
                }),
                payment_per_turn: receive_payment
                    .map(|item| non_negative(item.quantity))
                    .unwrap_or(0.0),
                seller_failed_turns: 0,
                buyer_failed_turns: 0,
            });
        }
    }
    if let Some(resource) = receive_resource {
        let units = normalize_resource_quantity(&resource.id, resource.quantity, None);
        if units > 0.0 {
            transfers.push(CyclicResourceTransfer {
                resource_key: normalized_key(&resource.id),
                units_per_turn: units,
                seller_owner_id: responder_id,
                buyer_owner_id: proposer_id,
                payment: give_payment.map(|item| match item.kind {
                    BasketItemKind::Gold => PaymentKind::Gold,
                    BasketItemKind::Work => PaymentKind::Work,
                    _ => unreachable!(),
                }),
                payment_per_turn: give_payment
                    .map(|item| non_negative(item.quantity))
                    .unwrap_or(0.0),
                seller_failed_turns: 0,
                buyer_failed_turns: 0,
            });
        }
    }
    transfers
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProposalAction {
    #[serde(rename = "nap", alias = "non_aggression")]
    Nap,
    #[serde(rename = "sojusz_defensywny", alias = "defensive_alliance")]
    DefensiveAlliance,
    #[serde(rename = "sojusz_pelny", alias = "full_alliance")]
    FullAlliance,
    #[serde(rename = "handel", alias = "trade")]
    Trade,
    #[serde(rename = "umowa_handlowa", alias = "trade_agreement")]
    TradeAgreement,
    #[serde(rename = "umowa_szlakow", alias = "trade_route")]
    TradeRoute,
    #[serde(rename = "trybut_zadanie", alias = "tribute_demand")]
    TributeDemand,
    #[serde(rename = "trybut_oferta", alias = "tribute_offer")]
    TributeOffer,
    #[serde(rename = "granice", alias = "borders")]
    Borders,
    #[serde(rename = "tech", alias = "technology")]
    Technology,
    #[serde(rename = "namow_wojne", alias = "encourage_war")]
    EncourageWar,
    #[serde(rename = "ultimatum")]
    Ultimatum,
    #[serde(rename = "wasal", alias = "vassal")]
    Vassal,
    #[serde(rename = "wchloniecie", alias = "annexation")]
    Annexation,
    #[serde(rename = "pokoj", alias = "peace")]
    Peace,
}

impl ProposalAction {
    pub fn wire_name(self) -> &'static str {
        match self {
            Self::Nap => "nap",
            Self::DefensiveAlliance => "sojusz_defensywny",
            Self::FullAlliance => "sojusz_pelny",
            Self::Trade => "handel",
            Self::TradeAgreement => "umowa_handlowa",
            Self::TradeRoute => "umowa_szlakow",
            Self::TributeDemand => "trybut_zadanie",
            Self::TributeOffer => "trybut_oferta",
            Self::Borders => "granice",
            Self::Technology => "tech",
            Self::EncourageWar => "namow_wojne",
            Self::Ultimatum => "ultimatum",
            Self::Vassal => "wasal",
            Self::Annexation => "wchloniecie",
            Self::Peace => "pokoj",
        }
    }
}

pub fn payload_has_currency_payment(payload: &ProposalPayload) -> bool {
    payload
        .gold_once
        .is_some_and(|amount| amount.is_finite() && amount > 0.0)
        || payload
            .gold_per_turn
            .is_some_and(|amount| amount.is_finite() && amount > 0.0)
        || payload
            .give_items
            .iter()
            .chain(payload.receive_items.iter())
            .any(|item| {
                matches!(item.kind, BasketItemKind::Gold | BasketItemKind::Work)
                    && item.quantity.is_finite()
                    && item.quantity > 0.0
            })
}

pub fn is_currency_proposal_forbidden_during_war(
    action: ProposalAction,
    payload: &ProposalPayload,
    at_war: bool,
) -> bool {
    at_war
        && payload_has_currency_payment(payload)
        && !matches!(action, ProposalAction::Peace | ProposalAction::TributeOffer)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AllianceKind {
    #[serde(rename = "defensywny")]
    Defensive,
    #[serde(rename = "pelny")]
    Full,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TechDirection {
    #[serde(rename = "sell")]
    Sell,
    #[serde(rename = "buy")]
    Buy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TechPaymentMode {
    #[serde(rename = "gold")]
    Gold,
    #[serde(rename = "tech")]
    Technology,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ResourceTradeMode {
    #[serde(rename = "once")]
    Once,
    #[serde(rename = "per_turn")]
    PerTurn,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct ProposalPayload {
    pub turns: Option<f64>,
    #[serde(rename = "treatyTurns", alias = "treaty_turns")]
    pub treaty_turns: Option<f64>,
    #[serde(rename = "goldPerTurn", alias = "gold_per_turn")]
    pub gold_per_turn: Option<f64>,
    #[serde(rename = "goldOnce", alias = "gold_once")]
    pub gold_once: Option<f64>,
    pub resource: Option<String>,
    pub amount: Option<f64>,
    #[serde(rename = "targetOwnerId", alias = "target_owner_id")]
    pub target_owner_id: Option<u64>,
    #[serde(rename = "borderMilitary", alias = "border_military")]
    pub border_military: bool,
    #[serde(rename = "barbarianCooperation", alias = "barbarian_cooperation")]
    pub barbarian_cooperation: bool,
    #[serde(rename = "allianceKind", alias = "alliance_kind")]
    pub alliance_kind: Option<AllianceKind>,
    #[serde(rename = "techId", alias = "tech_id")]
    pub tech_id: Option<String>,
    #[serde(rename = "techDirection", alias = "tech_direction")]
    pub tech_direction: Option<TechDirection>,
    #[serde(rename = "techPaymentMode", alias = "tech_payment_mode")]
    pub tech_payment_mode: Option<TechPaymentMode>,
    #[serde(rename = "techOfferId", alias = "tech_offer_id")]
    pub tech_offer_id: Option<String>,
    #[serde(rename = "bribeGold", alias = "bribe_gold")]
    pub bribe_gold: Option<f64>,
    #[serde(rename = "techPrice", alias = "tech_price")]
    pub tech_price: Option<f64>,
    #[serde(rename = "givePn", alias = "give_pn")]
    pub give_pn: Option<f64>,
    #[serde(rename = "receivePn", alias = "receive_pn")]
    pub receive_pn: Option<f64>,
    #[serde(rename = "giveItems", alias = "give_items")]
    pub give_items: Vec<BasketItem>,
    #[serde(rename = "receiveItems", alias = "receive_items")]
    pub receive_items: Vec<BasketItem>,
    #[serde(rename = "isGift", alias = "is_gift")]
    pub is_gift: bool,
    #[serde(rename = "resourceTradeMode", alias = "resource_trade_mode")]
    pub resource_trade_mode: Option<ResourceTradeMode>,
    #[serde(rename = "warThreat", alias = "war_threat")]
    pub war_threat: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DiplomaticProposal {
    #[serde(rename = "actionId", alias = "action")]
    pub action: ProposalAction,
    #[serde(rename = "proposerOwnerId", alias = "proposer_owner_id")]
    pub proposer_owner_id: u64,
    #[serde(rename = "responderOwnerId", alias = "responder_owner_id")]
    pub responder_owner_id: u64,
    pub payload: ProposalPayload,
}

impl DiplomaticProposal {
    pub fn new(
        action: ProposalAction,
        proposer_owner_id: u64,
        responder_owner_id: u64,
        payload: ProposalPayload,
    ) -> Self {
        Self {
            action,
            proposer_owner_id,
            responder_owner_id,
            payload,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProposalEvalContext {
    pub relation: Relation,
    pub at_war: bool,
    pub turn: u32,
    pub era: u32,
    pub proposer_respect: f64,
    pub responder_respect: f64,
    pub military_ratio: f64,
    pub proposer_credibility: f64,
    pub responder_credibility: f64,
    pub responder_willingness_trade: f64,
    pub responder_willingness_ally: f64,
    pub common_border: bool,
    pub is_minor_civ: bool,
    pub proposer_is_city_state: bool,
    pub responder_is_city_state: bool,
    pub responder_population: f64,
    pub wasal_age_turns: Option<f64>,
    pub active_deals: Vec<ActiveDeal>,
    pub difficulty: Difficulty,
    pub tech_min_price: f64,
    pub package_sibling_give_pn: f64,
    pub package_sibling_receive_pn: f64,
    pub author_owner_id: Option<u64>,
    pub has_trade_tech_proposer: Option<bool>,
    pub has_trade_tech_responder: Option<bool>,
}

impl ProposalEvalContext {
    pub fn new(relation: Relation, turn: u32) -> Self {
        Self {
            at_war: relation.status == RelationStatus::War,
            relation,
            turn,
            era: 0,
            proposer_respect: 50.0,
            responder_respect: 50.0,
            military_ratio: 1.0,
            proposer_credibility: 0.0,
            responder_credibility: 0.0,
            responder_willingness_trade: 1.0,
            responder_willingness_ally: 1.0,
            common_border: false,
            is_minor_civ: false,
            proposer_is_city_state: false,
            responder_is_city_state: false,
            responder_population: 0.0,
            wasal_age_turns: None,
            active_deals: Vec::new(),
            difficulty: Difficulty::Normal,
            tech_min_price: 50.0,
            package_sibling_give_pn: 0.0,
            package_sibling_receive_pn: 0.0,
            author_owner_id: None,
            has_trade_tech_proposer: None,
            has_trade_tech_responder: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProposalEvaluation {
    pub accepted: bool,
    pub reason: String,
    pub deal: Option<ActiveDeal>,
    pub one_shot_trade: bool,
    pub pw_balance: Option<f64>,
}

impl ProposalEvaluation {
    fn reject(reason: impl Into<String>) -> Self {
        Self {
            accepted: false,
            reason: reason.into(),
            deal: None,
            one_shot_trade: false,
            pw_balance: None,
        }
    }

    fn accept(reason: impl Into<String>) -> Self {
        Self {
            accepted: true,
            reason: reason.into(),
            deal: None,
            one_shot_trade: false,
            pw_balance: None,
        }
    }
}

pub const RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON: &str =
    "Handel dostępem do surowców nieaktualny — wycofany po polityce terytorialnej (SUROW-TERYT)";

pub fn proposal_has_resource_access(payload: &ProposalPayload) -> bool {
    payload
        .give_items
        .iter()
        .chain(payload.receive_items.iter())
        .any(|item| item.kind.is_withdrawn_access())
}

pub fn strip_withdrawn_resource_access_items(items: &[BasketItem]) -> Vec<BasketItem> {
    items
        .iter()
        .filter(|item| !item.kind.is_withdrawn_access())
        .cloned()
        .collect()
}

pub fn clamp_deal_turns(turns: Option<f64>, default_turns: f64) -> u32 {
    turns.unwrap_or(default_turns).clamp(1.0, 20.0).floor() as u32
}

fn resolve_treaty_duration(payload: &ProposalPayload) -> Option<Option<f64>> {
    if let Some(turns) = payload.treaty_turns {
        return Some(if turns > 0.0 { Some(turns) } else { None });
    }
    payload.turns.map(Some)
}

fn nap_expiry(turn: u32, payload: &ProposalPayload) -> (Option<u32>, String) {
    let raw = payload.treaty_turns.or(payload.turns);
    if raw.map(|value| value <= 0.0).unwrap_or(false) {
        return (None, "Pakt nieagresji (bezterminowy)".to_owned());
    }
    let turns = clamp_deal_turns(raw, 15.0).clamp(10, 20);
    (
        Some(turn + turns),
        format!("Pakt nieagresji na {turns} tur"),
    )
}

pub fn sweetener_net_pn_with_options(
    payload: &ProposalPayload,
    catalog: &ValueCatalog,
    options: &ProposalPnOptions,
) -> f64 {
    let (give, receive) = resolve_proposal_pn_with_options(payload, catalog, options);
    (give - receive).max(0.0)
}

pub fn sweetener_net_pn(payload: &ProposalPayload, catalog: &ValueCatalog) -> f64 {
    sweetener_net_pn_with_options(payload, catalog, &ProposalPnOptions::default())
}

pub fn sweetener_ease_points_with_options(
    payload: &ProposalPayload,
    catalog: &ValueCatalog,
    params: &DiplomacyParams,
    options: &ProposalPnOptions,
) -> f64 {
    if params.sweetener_pn_per_ease <= 0.0 {
        return 0.0;
    }
    (sweetener_net_pn_with_options(payload, catalog, options) / params.sweetener_pn_per_ease)
        .floor()
        .min(params.sweetener_ease_max)
        .max(0.0)
}

pub fn sweetener_ease_points(
    payload: &ProposalPayload,
    catalog: &ValueCatalog,
    params: &DiplomacyParams,
) -> f64 {
    sweetener_ease_points_with_options(payload, catalog, params, &ProposalPnOptions::default())
}

pub fn effective_treaty_pn_required(base_pn: f64, relation: f64) -> f64 {
    if base_pn <= 0.0 {
        return 0.0;
    }
    let signed = (relation - 100.0).clamp(-90.0, 90.0);
    (base_pn * (1.0 + signed / 100.0)).round().max(0.0)
}

pub fn partner_treaty_pn_required(base_pn: f64) -> f64 {
    base_pn.max(0.0)
}

pub fn treaty_base_fairness_gap(base_pn: f64, give_pn: f64, receive_pn: f64, relation: f64) -> f64 {
    partner_treaty_pn_required(base_pn) + receive_pn
        - (effective_treaty_pn_required(base_pn, relation) + give_pn)
}

pub fn handel_required_pn(receive_pn: f64, relation: f64, willingness_multiplier: f64) -> f64 {
    let fair = fair_give_pn(receive_pn, relation.min(100.0));
    receive_pn.max((fair * willingness_multiplier).ceil())
}

pub fn handel_willingness_multiplier(
    willingness: f64,
    responder_is_player: bool,
    params: &DiplomacyParams,
) -> f64 {
    if responder_is_player {
        return 1.0;
    }
    let willingness = clamp(willingness, 0.0, 1.0);
    let midpoint = params.trade_willingness_min.clamp(0.0, 1.0);
    if willingness >= midpoint {
        let span = (1.0 - midpoint).max(1e-6);
        1.0 - 0.15 * ((willingness - midpoint) / span).min(1.0)
    } else {
        let span = midpoint.max(1e-6);
        1.0 + 0.20 * ((midpoint - willingness) / span).min(1.0)
    }
}

fn pair_has_kind(deals: &[ActiveDeal], a: u64, b: u64, kind: TreatyKind) -> bool {
    let pair = CivilizationPair::new(a, b);
    deals
        .iter()
        .any(|deal| deal.parties == pair && deal.kind == kind)
}

fn treaty_base_pn(action: ProposalAction, params: &DiplomacyParams) -> f64 {
    match action {
        ProposalAction::Nap => params.nap_base_pn,
        ProposalAction::DefensiveAlliance => params.defensive_alliance_base_pn,
        ProposalAction::FullAlliance => params.full_alliance_base_pn,
        ProposalAction::Peace => params.peace_base_pn,
        ProposalAction::Borders => params.march_base_pn,
        ProposalAction::TradeAgreement | ProposalAction::TradeRoute => params.trade_route_base_pn,
        ProposalAction::Vassal => params.vassal_base_pn,
        ProposalAction::TributeDemand => params.tribute_demand_base_pn,
        _ => 0.0,
    }
}

pub fn treaty_duration_pn_multiplier(action: ProposalAction, payload: &ProposalPayload) -> f64 {
    if !matches!(
        action,
        ProposalAction::Nap
            | ProposalAction::TributeDemand
            | ProposalAction::TributeOffer
            | ProposalAction::Peace
    ) {
        return 1.0;
    }
    let Some(raw) = payload.treaty_turns.or(payload.turns) else {
        return 1.0;
    };
    if !raw.is_finite() {
        return 1.0;
    }
    if raw <= 0.0 {
        return 8.0;
    }
    let turns = raw.clamp(10.0, 20.0);
    2.0_f64.powf((turns - 10.0) / 5.0)
}

fn treaty_base_pn_for_payload(
    action: ProposalAction,
    payload: &ProposalPayload,
    params: &DiplomacyParams,
) -> f64 {
    treaty_base_pn(action, params) * treaty_duration_pn_multiplier(action, payload)
}

fn make_deal(
    kind: TreatyKind,
    proposal: &DiplomaticProposal,
    ctx: &ProposalEvalContext,
    expires_turn: Option<u32>,
) -> ActiveDeal {
    ActiveDeal::new(
        kind,
        proposal.proposer_owner_id,
        proposal.responder_owner_id,
        ctx.turn,
        expires_turn,
    )
}

pub fn evaluate_proposal(
    proposal: &DiplomaticProposal,
    context: &ProposalEvalContext,
) -> ProposalEvaluation {
    evaluate_proposal_with_params(
        proposal,
        context,
        DiplomacyParams::default(),
        ValueCatalog::default(),
    )
}

pub fn evaluate_proposal_with_params(
    proposal: &DiplomaticProposal,
    context: &ProposalEvalContext,
    base_params: DiplomacyParams,
    catalog: ValueCatalog,
) -> ProposalEvaluation {
    let params = scale_params_for_difficulty(base_params, context.difficulty);
    let payload = &proposal.payload;
    let at_war = context.at_war || context.relation.status == RelationStatus::War;
    let relation = if at_war {
        clamp_relation_for_war(&context.relation)
    } else {
        context.relation.clone()
    };
    let relation_total = relation_score_with_params(&relation, &params);
    let per_turn = payload.resource_trade_mode == Some(ResourceTradeMode::PerTurn);
    let turns_multiplier = payload
        .turns
        .filter(|turns| turns.is_finite())
        .unwrap_or(1.0)
        .max(1.0);
    let pn_options = ProposalPnOptions {
        difficulty: context.difficulty,
        proposer_owner_id: Some(proposal.proposer_owner_id),
        player_owner_id: 0,
        turns_multiplier,
        per_turn,
    };
    let (give_pn, receive_pn) = resolve_proposal_pn_with_options(payload, &catalog, &pn_options);

    if proposal.action == ProposalAction::Peace && !at_war {
        return ProposalEvaluation::reject("Pokój — brak trwającej wojny");
    }
    if at_war
        && !matches!(
            proposal.action,
            ProposalAction::TributeOffer | ProposalAction::Ultimatum | ProposalAction::Peace
        )
    {
        return ProposalEvaluation::reject("Trwa wojna — ta akcja jest niedostępna");
    }
    if is_currency_proposal_forbidden_during_war(proposal.action, payload, at_war) {
        return ProposalEvaluation::reject("W wojnie pieniądze tylko w ugodzie pokojowej");
    }
    if proposal.action == ProposalAction::Peace {
        let base = treaty_base_pn_for_payload(ProposalAction::Peace, payload, &params);
        let author = context
            .author_owner_id
            .unwrap_or(proposal.proposer_owner_id);
        let player_is_author = author == 0;
        let gap = if payload.treaty_turns.is_some() || payload.turns.is_some() {
            let required = effective_treaty_pn_required(
                base,
                if player_is_author {
                    relation_total
                } else {
                    relation_score_with_params(&context.relation, &params)
                },
            );
            required + receive_pn - give_pn
        } else if player_is_author {
            treaty_base_fairness_gap(base, give_pn, receive_pn, relation_total)
        } else {
            treaty_base_fairness_gap(
                base,
                give_pn,
                receive_pn,
                relation_score_with_params(&context.relation, &params),
            )
        };
        let balance = -gap;
        return ProposalEvaluation {
            accepted: !player_is_author || balance >= 0.0,
            reason: if player_is_author && balance < 0.0 {
                format!(
                    "Brakuje {} PW do uczciwej oferty pokoju @ Relacji",
                    (-balance).round()
                )
            } else {
                "Warunki pokoju spełnione".to_owned()
            },
            deal: None,
            one_shot_trade: true,
            pw_balance: Some(if balance == -0.0 { 0.0 } else { balance }),
        };
    }
    if context.responder_is_city_state
        && matches!(
            proposal.action,
            ProposalAction::TributeDemand | ProposalAction::TributeOffer
        )
    {
        return ProposalEvaluation::reject("Trybut niedostępny dla państwa-miasta");
    }
    if proposal.action == ProposalAction::Trade && proposal_has_resource_access(payload) {
        return ProposalEvaluation::reject(RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON);
    }
    if proposal_has_unpriced_item(payload, &catalog) {
        return ProposalEvaluation::reject("Nieznana pozycja w koszyku");
    }
    // A player cannot use the receive side of a treaty basket to bypass the
    // ordinary fair-trade gate.  This is the Rust equivalent of the shared
    // `treatyPnGate` in the reference diplomacy implementation; it applies to
    // every treaty with a configured base value, not only trade agreements.
    if proposal.proposer_owner_id == 0
        && treaty_base_pn_for_payload(proposal.action, payload, &params) > 0.0
        && receive_pn > 0.0
        && !pn_deal_accepted_by_ai(give_pn, receive_pn, relation_total)
    {
        return ProposalEvaluation {
            accepted: false,
            reason: "Oferta nieuczciwa dla partnera — poniżej wartości PW @ Relacji".to_owned(),
            deal: None,
            one_shot_trade: false,
            pw_balance: Some(give_pn - fair_give_pn(receive_pn, relation_total.min(100.0))),
        };
    }

    match proposal.action {
        ProposalAction::Nap => {
            if context.proposer_credibility < params.credibility_min_nap {
                return ProposalEvaluation::reject(format!(
                    "Wiarygodność zbyt niska na pakt (wymagana ≥ {})",
                    params.credibility_min_nap
                ));
            }
            let ease = sweetener_ease_points_with_options(payload, &catalog, &params, &pn_options);
            let expansion_surcharge = if context.common_border {
                params.sweetener_ease_max
            } else {
                0.0
            };
            let threshold = (params.nap_relation + expansion_surcharge - ease).max(0.0);
            if relation_total < threshold {
                return ProposalEvaluation::reject(format!(
                    "Relacja zbyt niska na pakt (wymagana ≥ {})",
                    threshold.round()
                ));
            }
            if pair_has_kind(
                &context.active_deals,
                proposal.proposer_owner_id,
                proposal.responder_owner_id,
                TreatyKind::Nap,
            ) {
                return ProposalEvaluation::reject("Pakt nieagresji już obowiązuje");
            }
            let (expires, label) = nap_expiry(context.turn, payload);
            let deal = make_deal(TreatyKind::Nap, proposal, context, expires);
            ProposalEvaluation {
                accepted: true,
                reason: label,
                deal: Some(deal),
                one_shot_trade: false,
                pw_balance: Some(0.0),
            }
        }
        ProposalAction::DefensiveAlliance | ProposalAction::FullAlliance => {
            if context.proposer_credibility < params.credibility_min_alliance {
                return ProposalEvaluation::reject("Wiarygodność zbyt niska na sojusz");
            }
            let ease = sweetener_ease_points_with_options(payload, &catalog, &params, &pn_options);
            let military_ratio = context.military_ratio.max(0.01);
            let adjustment = diplomacy_alliance_strength_adjust(
                military_ratio,
                context.proposer_respect,
                context.responder_respect,
                &params,
            );
            if adjustment.hegemon_blocks_alliance {
                return ProposalEvaluation::reject(
                    "Hegemon nie potrzebuje sojuszu — wola wobec słabszego to trybut lub wasalizacja",
                );
            }
            let min_trust = (diplomacy_alliance_min_trust(&adjustment, military_ratio, &params)
                - ease)
                .max(0.0);
            let score_threshold = diplomacy_treaty_min_relation(
                params.alliance_relation - adjustment.ease.score_threshold_delta
                    + adjustment.penalty_score
                    - ease,
                &params,
            );
            if relation.trust < min_trust {
                return ProposalEvaluation::reject(format!(
                    "Zaufanie zbyt niskie (wymagane ≥ {})",
                    min_trust.round()
                ));
            }
            if relation_total < score_threshold {
                return ProposalEvaluation::reject(format!(
                    "Relacja ogólna zbyt niska na sojusz (≥ {})",
                    score_threshold.round()
                ));
            }
            if military_ratio < params.alliance_weak_proposer_military_ratio
                && context.proposer_respect <= context.responder_respect
                && relation_total < params.treaty_min_relation
            {
                return ProposalEvaluation::reject(
                    "Za słaby proponent bez pełnej relacji — sojusz nierealny",
                );
            }
            let min_willingness = (params.alliance_willingness_min
                - adjustment.ease.ally_threshold_delta
                + adjustment.penalty_ally
                - ease)
                .max(0.0);
            if context.responder_willingness_ally < min_willingness {
                return ProposalEvaluation::reject("Brak gotowości do sojuszu");
            }
            let kind = if proposal.action == ProposalAction::DefensiveAlliance {
                TreatyKind::DefensiveAlliance
            } else {
                TreatyKind::FullAlliance
            };
            if pair_has_kind(
                &context.active_deals,
                proposal.proposer_owner_id,
                proposal.responder_owner_id,
                kind,
            ) {
                return ProposalEvaluation::reject("Sojusz tego typu już istnieje");
            }
            let mut result = ProposalEvaluation::accept(if kind == TreatyKind::DefensiveAlliance {
                "Sojusz obronny zawarty"
            } else {
                "Sojusz wojskowy zawarty"
            });
            result.deal = Some(make_deal(kind, proposal, context, None));
            result.pw_balance = Some(0.0);
            result
        }
        ProposalAction::TributeDemand => {
            let per_turn = payload.gold_per_turn.unwrap_or(0.0);
            if per_turn < params.tribute_min_per_turn {
                return ProposalEvaluation::reject(format!(
                    "Minimalny trybut to {} ¤/turę",
                    params.tribute_min_per_turn
                ));
            }
            let ease = sweetener_ease_points_with_options(payload, &catalog, &params, &pn_options);
            let min_respect = (params.tribute_demand_min_respect - ease).max(0.0);
            if context.proposer_respect <= min_respect {
                return ProposalEvaluation::reject(format!(
                    "Żądanie trybutu wymaga Respekt > {}",
                    min_respect.round()
                ));
            }
            let max_per_turn = params.tribute_demand_max_base
                + (context.proposer_respect - params.tribute_demand_min_respect).max(0.0)
                    * params.tribute_demand_max_per_respect;
            if per_turn > max_per_turn {
                return ProposalEvaluation::reject(format!(
                    "Żądanie trybutu przekracza limit (max {} ¤/turę)",
                    max_per_turn.round()
                ));
            }
            if pair_has_kind(
                &context.active_deals,
                proposal.proposer_owner_id,
                proposal.responder_owner_id,
                TreatyKind::Vassalization,
            ) {
                return ProposalEvaluation::reject(
                    "Trybut/wasalizacja z tym państwem już obowiązuje",
                );
            }
            let expires = resolve_treaty_duration(payload)
                .flatten()
                .map(|duration| context.turn + duration.max(0.0).floor() as u32);
            let mut deal = make_deal(TreatyKind::Vassalization, proposal, context, expires);
            deal.economy = Some(TreatyEconomy {
                payer_owner_id: proposal.responder_owner_id,
                receiver_owner_id: proposal.proposer_owner_id,
                money_per_turn: per_turn,
            });
            let mut result = ProposalEvaluation::accept(format!("Trybut {} ¤/turę", per_turn));
            result.deal = Some(deal);
            result.pw_balance = Some(0.0);
            result
        }
        ProposalAction::TributeOffer => {
            let amount = payload.gold_per_turn.or(payload.gold_once).unwrap_or(0.0);
            let near_war = context.military_ratio > params.tribute_offer_near_war_ratio
                || relation.trust < params.tribute_offer_near_war_trust;
            let threshold =
                params.tribute_offer_base_gold + context.era as f64 * params.tribute_offer_era_gold;
            if !near_war && amount < threshold {
                return ProposalEvaluation::reject("Oferta trybutu zbyt niska");
            }
            if amount < params.tribute_offer_min_gold {
                return ProposalEvaluation::reject(format!(
                    "Minimalna oferta to {} ¤",
                    params.tribute_offer_min_gold
                ));
            }
            if payload
                .gold_once
                .is_some_and(|gold| gold.is_finite() && gold > 0.0)
            {
                let mut result = ProposalEvaluation::accept("Jednorazowy trybut za pokój");
                result.one_shot_trade = true;
                result.pw_balance = Some(0.0);
                return result;
            }
            let expires = resolve_treaty_duration(payload)
                .flatten()
                .map(|duration| context.turn + duration.max(0.0).floor() as u32);
            let mut deal = make_deal(TreatyKind::Vassalization, proposal, context, expires);
            deal.economy = Some(TreatyEconomy {
                payer_owner_id: proposal.proposer_owner_id,
                receiver_owner_id: proposal.responder_owner_id,
                money_per_turn: amount,
            });
            let mut result =
                ProposalEvaluation::accept(format!("Oferta trybutu {} ¤/turę przyjęta", amount));
            result.deal = Some(deal);
            result.pw_balance = Some(0.0);
            result
        }
        ProposalAction::Trade => {
            let is_gift = payload.is_gift
                || (!payload.give_items.is_empty()
                    && payload.receive_items.is_empty()
                    && receive_pn <= 0.0);
            if is_gift {
                if relation_total
                    < scale_relation_threshold(params.gift_min_relation, context.difficulty)
                {
                    return ProposalEvaluation::reject(format!(
                        "Relacja zbyt niska na dar (wymagane ≥ {})",
                        scale_relation_threshold(params.gift_min_relation, context.difficulty)
                            .round()
                    ));
                }
                if give_pn <= 0.0 {
                    return ProposalEvaluation::reject("Brak wartości w darze");
                }
                let mut result = ProposalEvaluation::accept("Dar przyjęty");
                result.one_shot_trade = true;
                return result;
            }
            if relation_total < params.trade_relation {
                return ProposalEvaluation::reject("Relacja zbyt niska na handel");
            }
            let has_payload = give_pn > 0.0
                || receive_pn > 0.0
                || !payload.give_items.is_empty()
                || !payload.receive_items.is_empty();
            if !has_payload {
                return ProposalEvaluation::reject("Brak wartości w ofercie");
            }
            let responder_is_player = proposal.responder_owner_id == 0;
            let multiplier = handel_willingness_multiplier(
                context.responder_willingness_trade,
                responder_is_player,
                &params,
            );
            let required = handel_required_pn(receive_pn, relation_total, multiplier);
            let balance = give_pn - required;
            if give_pn < required {
                return ProposalEvaluation {
                    accepted: false,
                    reason: format!(
                        "Oferta nieuczciwa dla partnera (wymagane ≥ {} PW, oferujesz {} PW)",
                        required.round(),
                        give_pn.round()
                    ),
                    deal: None,
                    one_shot_trade: false,
                    pw_balance: Some(balance),
                };
            }
            let has_quantity_resource = payload
                .give_items
                .iter()
                .chain(payload.receive_items.iter())
                .any(|item| item.kind == BasketItemKind::QuantityResource);
            if payload.resource_trade_mode == Some(ResourceTradeMode::PerTurn)
                && has_quantity_resource
            {
                let transfers = build_cyclic_resource_transfers(
                    proposal.proposer_owner_id,
                    proposal.responder_owner_id,
                    &payload.give_items,
                    &payload.receive_items,
                );
                if transfers.is_empty() {
                    return ProposalEvaluation::reject("Brak surowca do cyklicznej wymiany");
                }
                let turns = clamp_deal_turns(payload.turns, 15.0);
                let mut deal = make_deal(
                    TreatyKind::Exchange,
                    proposal,
                    context,
                    Some(context.turn + turns),
                );
                deal.cyclic_resource_transfers = transfers;
                let mut result = ProposalEvaluation::accept(format!(
                    "Umowa handlowa (surowiec co turę) na {turns} tur"
                ));
                result.deal = Some(deal);
                result.pw_balance = Some(balance);
                return result;
            }
            let mut result = ProposalEvaluation::accept("Wymiana PW zaakceptowana");
            result.one_shot_trade = true;
            result.pw_balance = Some(balance);
            result
        }
        ProposalAction::TradeAgreement | ProposalAction::TradeRoute => {
            if context.has_trade_tech_proposer == Some(false)
                || context.has_trade_tech_responder == Some(false)
            {
                return ProposalEvaluation::reject(
                    "Brak zbadanej technologii Wymiana po jednej ze stron",
                );
            }
            if relation_total < params.trade_relation {
                return ProposalEvaluation::reject("Relacja zbyt niska na traktat handlowy");
            }
            let base = treaty_base_pn_for_payload(proposal.action, payload, &params);
            let mut balance = None;
            if proposal.proposer_owner_id == 0 && base > 0.0 {
                let gap = treaty_base_fairness_gap(
                    base,
                    give_pn + context.package_sibling_give_pn,
                    receive_pn + context.package_sibling_receive_pn,
                    relation_total,
                );
                balance = Some(-gap);
                if gap > 0.0 {
                    return ProposalEvaluation {
                        accepted: false,
                        reason: format!(
                            "Brakuje {} PW do uczciwej oferty traktatu handlowego — oferta nieuczciwa dla partnera",
                            gap.round()
                        ),
                        deal: None,
                        one_shot_trade: false,
                        pw_balance: balance,
                    };
                }
            }
            let has_items = !payload.give_items.is_empty() || !payload.receive_items.is_empty();
            if context.responder_willingness_trade < params.trade_willingness_min
                && has_items
                && !pn_deal_accepted_by_ai(give_pn, receive_pn, relation_total)
            {
                return ProposalEvaluation::reject("Brak chęci do handlu");
            }
            if has_items && !pn_deal_accepted_by_ai(give_pn, receive_pn, relation_total) {
                return ProposalEvaluation {
                    accepted: false,
                    reason: "Oferta poniżej uczciwej wartości PW @ Relacji".to_owned(),
                    deal: None,
                    one_shot_trade: false,
                    pw_balance: balance,
                };
            }
            let raw_duration = resolve_treaty_duration(payload).flatten();
            let expires =
                raw_duration.map(|duration| context.turn + clamp_deal_turns(Some(duration), 15.0));
            let mut deal = make_deal(TreatyKind::TradeRoute, proposal, context, expires);
            if proposal.action == ProposalAction::TradeAgreement
                && payload.resource_trade_mode == Some(ResourceTradeMode::PerTurn)
            {
                let transfers = build_cyclic_resource_transfers(
                    proposal.proposer_owner_id,
                    proposal.responder_owner_id,
                    &payload.give_items,
                    &payload.receive_items,
                );
                if transfers.is_empty() {
                    return ProposalEvaluation::reject("Brak surowca do cyklicznej wymiany");
                }
                deal.kind = TreatyKind::Exchange;
                deal.cyclic_resource_transfers = transfers;
            }
            let mut result = ProposalEvaluation::accept(if has_items {
                "Traktat handlowy (ze słodzikiem) zawarty"
            } else {
                "Traktat handlowy zawarty"
            });
            result.deal = Some(deal);
            result.pw_balance = balance;
            result
        }
        ProposalAction::Technology => {
            let rel_ok = relation_total >= params.trade_relation;
            let trust_ok = relation.trust >= params.technology_trust_threshold;
            if !rel_ok || !trust_ok {
                return ProposalEvaluation::reject(
                    "Relacja lub Zaufanie zbyt niskie na wymianę tech",
                );
            }
            let Some(tech_id) = payload
                .tech_id
                .as_deref()
                .filter(|id| !id.trim().is_empty())
            else {
                return ProposalEvaluation::reject("Brak technologii w ofercie");
            };
            if payload.tech_payment_mode == Some(TechPaymentMode::Technology) {
                let Some(offered) = payload.tech_offer_id.as_deref() else {
                    return ProposalEvaluation::reject("Brak oferowanej technologii w zamian");
                };
                if offered == tech_id {
                    return ProposalEvaluation::reject(
                        "Nie można wymienić technologii na samą siebie",
                    );
                }
            } else if payload.tech_price.unwrap_or(0.0) < context.tech_min_price {
                return ProposalEvaluation::reject(format!(
                    "Cena poniżej minimum ({} ¤)",
                    context.tech_min_price
                ));
            }
            let mut result = ProposalEvaluation::accept("Wymiana technologii zaakceptowana");
            result.one_shot_trade = true;
            result
        }
        ProposalAction::Borders => {
            let ease = sweetener_ease_points_with_options(payload, &catalog, &params, &pn_options);
            let relation_threshold = (params.borders_relation - ease).max(0.0);
            let trust_threshold = (params.borders_trust - ease).max(0.0);
            if relation_total < relation_threshold || relation.trust < trust_threshold {
                return ProposalEvaluation::reject(format!(
                    "Relacja/Zaufanie zbyt niskie na traktat przemarszu (wymagane ≥ {}/{})",
                    relation_threshold.round(),
                    trust_threshold.round()
                ));
            }
            if payload.border_military
                && context.proposer_respect < params.military_march_min_respect
            {
                return ProposalEvaluation::reject(format!(
                    "Prawo wojskowe wymaga Respekt ≥ {}",
                    params.military_march_min_respect
                ));
            }
            if payload.barbarian_cooperation && !payload.border_military {
                return ProposalEvaluation::reject(
                    "Wspólna walka z barbarzyńcami wymaga wariantu wojskowego",
                );
            }
            let kind = if payload.barbarian_cooperation {
                TreatyKind::BarbarianCooperation
            } else if payload.border_military {
                TreatyKind::MilitaryMarch
            } else {
                TreatyKind::OpenBorders
            };
            let expires = if payload.barbarian_cooperation {
                Some(context.turn + 3)
            } else {
                None
            };
            let mut result = ProposalEvaluation::accept(if payload.barbarian_cooperation {
                "Wspólna walka z barbarzyńcami i przemarsz — 3 tury"
            } else if payload.border_military {
                "Traktat przemarszu (wojskowy)"
            } else {
                "Traktat przemarszu (cywilny)"
            });
            result.deal = Some(make_deal(kind, proposal, context, expires));
            result.pw_balance = Some(0.0);
            result
        }
        ProposalAction::EncourageWar => {
            if relation.trust < params.encourage_war_min_trust {
                return ProposalEvaluation::reject("Zaufanie zbyt niskie");
            }
            let min_bribe = params.encourage_war_bribe_base * (context.era as f64 + 1.0);
            if payload.bribe_gold.unwrap_or(0.0) < min_bribe {
                return ProposalEvaluation::reject(format!(
                    "Łapówka zbyt mała (min. {} ¤)",
                    min_bribe
                ));
            }
            if payload.target_owner_id.is_none() {
                return ProposalEvaluation::reject("Brak wskazanego wroga");
            }
            ProposalEvaluation::accept("Zgoda na wypowiedzenie wojny wskazanemu wrogowi")
        }
        ProposalAction::Ultimatum => {
            if context.military_ratio < params.ultimatum_military_ratio {
                return ProposalEvaluation::reject("Ultimatum wymaga wyraźnej przewagi militarnej");
            }
            if payload.gold_once.unwrap_or(0.0) >= params.ultimatum_min_gold {
                let mut result = ProposalEvaluation::accept("Warunki ultimatum spełnione");
                result.one_shot_trade = true;
                result
            } else {
                ProposalEvaluation::reject("Ultimatum odrzucone — warunki zbyt surowe")
            }
        }
        ProposalAction::Vassal => {
            let ease = sweetener_ease_points_with_options(payload, &catalog, &params, &pn_options);
            let required = (params.vassal_respect_threshold - ease).max(0.0);
            if context.proposer_respect < required {
                return ProposalEvaluation::reject(format!(
                    "Wasalizacja wymaga Respekt ≥ {}",
                    required.round()
                ));
            }
            let per_turn = payload
                .gold_per_turn
                .unwrap_or(params.default_vassal_gold_per_turn);
            let mut deal = make_deal(TreatyKind::Vassalization, proposal, context, None);
            deal.economy = Some(TreatyEconomy {
                payer_owner_id: proposal.responder_owner_id,
                receiver_owner_id: proposal.proposer_owner_id,
                money_per_turn: per_turn,
            });
            let mut result = ProposalEvaluation::accept("Wasalizacja zaakceptowana");
            result.deal = Some(deal);
            result.pw_balance = Some(0.0);
            result
        }
        ProposalAction::Annexation => {
            if !context.responder_is_city_state {
                return ProposalEvaluation::reject("Wchłonięcie v1 tylko miasta-państwa");
            }
            let wasal = context.active_deals.iter().find(|deal| {
                deal.parties
                    == CivilizationPair::new(
                        proposal.proposer_owner_id,
                        proposal.responder_owner_id,
                    )
                    && deal.kind == TreatyKind::Vassalization
                    && deal.economy.as_ref().is_none_or(|economy| {
                        economy.payer_owner_id == proposal.responder_owner_id
                            && economy.receiver_owner_id == proposal.proposer_owner_id
                    })
            });
            if wasal.is_none() {
                return ProposalEvaluation::reject(
                    "Brak aktywnej wasalizacji z tym miastem-państwem",
                );
            }
            let age = context.wasal_age_turns.unwrap_or_else(|| {
                wasal
                    .and_then(|deal| context.turn.checked_sub(deal.formed_turn))
                    .unwrap_or(0) as f64
            });
            if age < params.annexation_min_turns {
                return ProposalEvaluation::reject(format!(
                    "Wasal musi trwać ≥ {} tur",
                    params.annexation_min_turns
                ));
            }
            if context.proposer_respect < params.annexation_respect_threshold {
                return ProposalEvaluation::reject(format!(
                    "Wchłonięcie wymaga Respekt ≥ {}",
                    params.annexation_respect_threshold
                ));
            }
            if relation_total < 60.0 {
                return ProposalEvaluation::reject(
                    "Wasal odmawia wchłonięcia — zbyt niska Relacja",
                );
            }
            let cost = params.annexation_gold_min.max(
                params.annexation_gold_base
                    + params.annexation_gold_per_population * context.responder_population.max(0.0),
            );
            if payload.gold_once.unwrap_or(0.0) < cost {
                return ProposalEvaluation::reject(format!(
                    "Wchłonięcie wymaga opłaty ≥ {} ¤",
                    cost
                ));
            }
            ProposalEvaluation::accept(format!("Wchłonięcie zaakceptowane ({} ¤)", cost))
        }
        ProposalAction::Peace => unreachable!(),
    }
}

pub fn pn_deal_accepted_by_ai(give_pn: f64, receive_pn: f64, relation: f64) -> bool {
    if give_pn <= 0.0 && receive_pn <= 0.0 {
        return false;
    }
    give_pn >= fair_give_pn(receive_pn, relation.min(100.0))
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct UnitHex {
    pub q: i32,
    pub r: i32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
pub struct UnitDefinition {
    #[serde(rename = "ruch", alias = "movement", alias = "Ruch")]
    pub movement: Option<f64>,
    #[serde(rename = "rola", alias = "role", alias = "Rola (linia)")]
    pub role: Option<String>,
    #[serde(
        rename = "superJednostka",
        alias = "super_unit",
        alias = "Super-jednostka",
        default,
        deserialize_with = "deserialize_boolish"
    )]
    pub super_unit: bool,
    #[serde(
        rename = "pieniadzKoszt",
        alias = "pn_cost",
        alias = "Pieniądz (koszt)"
    )]
    pub pn_cost: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RuntimeUnit {
    pub id: String,
    #[serde(rename = "ownerId", alias = "owner_id")]
    pub owner_id: u64,
    #[serde(rename = "typeId", alias = "type_id")]
    pub type_id: String,
    pub category: String,
    pub q: i32,
    pub r: i32,
    #[serde(rename = "ruch", alias = "movement")]
    pub movement: f64,
    #[serde(rename = "ruchLeft", alias = "movement_left")]
    pub movement_left: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct UnitTransferContext {
    pub units: Vec<RuntimeUnit>,
    #[serde(rename = "capitalHexByOwner", alias = "capital_hex_by_owner")]
    pub capital_hex_by_owner: BTreeMap<u64, UnitHex>,
    #[serde(rename = "unitDefinitions", alias = "unit_definitions")]
    pub unit_definitions: BTreeMap<String, UnitDefinition>,
    #[serde(rename = "nextUnitSequence", alias = "next_unit_sequence")]
    pub next_unit_sequence: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpawnTransferredUnitReason {
    #[serde(rename = "unknown_type")]
    UnknownType,
    #[serde(rename = "no_capital")]
    NoCapital,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SpawnTransferredUnitResult {
    pub ok: bool,
    pub unit: Option<RuntimeUnit>,
    pub units: Vec<RuntimeUnit>,
    #[serde(rename = "pnCost", alias = "pn_cost")]
    pub pn_cost: Option<f64>,
    pub reason: Option<SpawnTransferredUnitReason>,
}

fn unit_category(type_id: &str, role: Option<&str>, super_unit: bool) -> String {
    if super_unit {
        return "super".to_owned();
    }
    let name = normalized_match_key(type_id);
    let role = normalized_match_key(role.unwrap_or_default());
    let category = if name.contains("osadnik") || role.contains("osadnik") {
        "osadnik"
    } else if name.contains("robotnik")
        || name.contains("worker")
        || name.contains("budown")
        || role.contains("robotnik")
    {
        "robotnik"
    } else if name.contains("zwiadowca")
        || name.contains("scout")
        || name.contains("zwiad")
        || role.contains("zwiadowca")
    {
        "zwiadowca"
    } else if name.contains("galera")
        || name.contains("galley")
        || name.contains("okret")
        || name.contains("statek")
        || role.contains("morsk")
        || role.contains("naval")
    {
        "galera"
    } else if name.contains("rydwan")
        || name.contains("chariot")
        || role.contains("rydwan")
        || role.contains("chariot")
    {
        "rydwan"
    } else if [
        "konnic", "jezdz", "jazd", "kawaler", "rycerz", "cavalry", "horse",
    ]
    .iter()
    .any(|part| name.contains(part) || role.contains(part))
    {
        "konnica"
    } else if name.contains("falang") || name.contains("hoplit") || name.contains("phalanx") {
        "falanga"
    } else if name.contains("legionist") || name.contains("legion") || name.contains("hastati") {
        "legionista"
    } else if ["wloczn", "pikinier", "spear", "impi"]
        .iter()
        .any(|part| name.contains(part) || role.contains(part))
    {
        "wlocznik"
    } else if ["miecz", "sword", "gladi", "khopesh"]
        .iter()
        .any(|part| name.contains(part) || role.contains(part))
    {
        "miecznik"
    } else if ["luczn", "archer", "kusznik", "crossbow"]
        .iter()
        .any(|part| name.contains(part) || role.contains(part))
    {
        "lucznik"
    } else if ["procarz", "sling"]
        .iter()
        .any(|part| name.contains(part) || role.contains(part))
    {
        "procarz"
    } else if ["oszczep", "javelin", "atlatl", "estolic"]
        .iter()
        .any(|part| name.contains(part) || role.contains(part))
    {
        "oszczepnik"
    } else if ["maczug", "chaska", "champi", "club", "mace"]
        .iter()
        .any(|part| name.contains(part) || role.contains(part))
    {
        "maczuga"
    } else if name.contains("topor") || name.contains("axe") {
        "topor"
    } else if [
        "taran",
        "katapult",
        "oblezn",
        "siege",
        "battering",
        "trebuchet",
    ]
    .iter()
    .any(|part| name.contains(part) || role.contains(part))
    {
        "obleznicza"
    } else if name.contains("tyrren") {
        "topor"
    } else {
        "domyslny"
    };
    category.to_owned()
}

/// Spawn one unit item at the recipient's nearby hex or capital, matching the
/// TypeScript P6 transfer hook. The context is updated only after all checks pass.
pub fn spawn_transferred_unit(
    unit_type_id: &str,
    to_owner_id: u64,
    near_hex: Option<UnitHex>,
    context: &mut UnitTransferContext,
) -> SpawnTransferredUnitResult {
    let type_id = unit_type_id.trim();
    let Some(definition) = context.unit_definitions.get(type_id).cloned() else {
        return SpawnTransferredUnitResult {
            ok: false,
            unit: None,
            units: context.units.clone(),
            pn_cost: None,
            reason: Some(SpawnTransferredUnitReason::UnknownType),
        };
    };
    let Some(pn_cost) = definition
        .pn_cost
        .filter(|value| value.is_finite() && *value > 0.0)
    else {
        return SpawnTransferredUnitResult {
            ok: false,
            unit: None,
            units: context.units.clone(),
            pn_cost: None,
            reason: Some(SpawnTransferredUnitReason::UnknownType),
        };
    };
    let placement = near_hex.or_else(|| context.capital_hex_by_owner.get(&to_owner_id).copied());
    let Some(placement) = placement else {
        return SpawnTransferredUnitResult {
            ok: false,
            unit: None,
            units: context.units.clone(),
            pn_cost: Some(pn_cost),
            reason: Some(SpawnTransferredUnitReason::NoCapital),
        };
    };
    let movement = definition
        .movement
        .filter(|value| value.is_finite() && *value > 0.0)
        .unwrap_or(2.0);
    context.next_unit_sequence = context.next_unit_sequence.saturating_add(1);
    let unit = RuntimeUnit {
        id: format!("xfer-{}", context.next_unit_sequence),
        owner_id: to_owner_id,
        type_id: type_id.to_owned(),
        category: unit_category(type_id, definition.role.as_deref(), definition.super_unit),
        q: placement.q,
        r: placement.r,
        movement,
        movement_left: movement,
    };
    context.units.push(unit.clone());
    SpawnTransferredUnitResult {
        ok: true,
        unit: Some(unit),
        units: context.units.clone(),
        pn_cost: Some(pn_cost),
        reason: None,
    }
}

pub fn apply_accepted_proposal(
    deals: &[ActiveDeal],
    evaluation: &ProposalEvaluation,
) -> Vec<ActiveDeal> {
    let Some(deal) = evaluation.deal.as_ref() else {
        return deals.to_vec();
    };
    if !evaluation.accepted {
        return deals.to_vec();
    }
    let mut next = deals.to_vec();
    next.retain(|existing| existing.id != deal.id);
    next.push(deal.clone());
    next
}
