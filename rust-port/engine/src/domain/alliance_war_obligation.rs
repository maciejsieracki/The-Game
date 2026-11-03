//! R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1: port `gra/src/game/alliance-war-obligation.ts` (57 LOC)
//! oraz zobowiazan sojuszniczych z `gra/src/game/diplomacy-treaties.ts` (pin `4bbef081d`).
//!
//! web alliance-war-obligation.ts: :7 (`AllianceWarObligationInput`), :30-33 (stale domyslne),
//! :39 (`shouldHonorAllianceWarObligation`).
//! web diplomacy-treaties.ts: :168 (`AllianceObligation`), :177 (`pairKey`), :181 (`sideOf`),
//! :185 (`allyOf`), :191 (`isAllianceKind`), :242 (`allianceObligationsForWarDeclaration`),
//! :266 (`isDefensiveAllianceWarObligation`), :305 (`allianceObligations`),
//! :346 (`treatiesBrokenByRefusal`), :362 (`dealsForPair`), :380 (`BREAK_ON_WAR`),
//! :405 (`treatiesBrokenByWar`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - `AllianceWarObligationInput` niesie `number` jako `f64` (NaN / Infinity zachowane: `NaN < x` = false,
//!   wiec NaN `militaryRatio` NIE odmawia). Pola opcjonalne `?? domyslna` = `Option<f64>`
//!   (`undefined` i `null` = `None`); `trustToRequestingAlly !== undefined` = `Some`.
//! - Traktaty uzywaja istniejacych typow Rust `ActiveDeal` / `TreatyKind` / `CivilizationPair`
//!   (`diplomacy.rs`, bez edycji). `PlayerId` = `u64`: wlasciciel traktatu to zawsze gracz (>= 0);
//!   barbarzynca (-1) nie wystepuje w `ActiveDeal.strony`. Para jest kanoniczna (web: po `hydrateActiveDeals`).
//! - Legacy `sojusz_wojskowy` -> `sojusz_pelny` i `umowa_handlowa` -> `umowa_szlakow` normalizuje juz serde
//!   (`alias` w `TreatyKind`); `umowa_handlowa` i `umowa_szlakow` sa w `BREAK_ON_WAR` oba, wiec wynik
//!   `treatiesBrokenByWar` jest taki sam. Rodzaje `rozejm`/`wasalizacja` nie zrywaja sie wojna (web: poza zbiorem).
//! - `AllianceEvent` = enum; `AllianceObligation` serializuje sie jak web (camelCase).

use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

use crate::domain::diplomacy::{ActiveDeal, CivilizationPair, TreatyKind};
use crate::domain::ids::PlayerId;

const DEFAULT_MIN_RATIO_HONOR: f64 = 0.55;
const DEFAULT_MIN_RATIO_HONOR_PEACEFUL: f64 = 0.75;
const DEFAULT_MAX_WARS_BEFORE_REFUSE: f64 = 1.0;
const DEFAULT_MIN_TRUST_HONOR: f64 = 20.0;

/// Web: `AllianceWarObligationInput` (alliance-war-obligation.ts:7).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllianceWarObligationInput {
    pub ally_id: f64,
    pub must_declare_war_on: f64,
    pub attacker_id: f64,
    pub victim_id: f64,
    pub military_ratio: f64,
    pub active_war_count: f64,
    pub peaceful_archetype: bool,
    #[serde(default)]
    pub min_ratio_honor: Option<f64>,
    #[serde(default)]
    pub min_ratio_honor_peaceful: Option<f64>,
    #[serde(default)]
    pub max_wars_before_refuse: Option<f64>,
    #[serde(default)]
    pub trust_to_requesting_ally: Option<f64>,
    #[serde(default)]
    pub min_trust_honor: Option<f64>,
}

/// Web: `shouldHonorAllianceWarObligation` (:39). Gracz (`allyId === 0`) zawsze honoruje.
pub fn should_honor_alliance_war_obligation(inp: &AllianceWarObligationInput) -> bool {
    if inp.ally_id == 0.0 {
        return true;
    }
    let max_wars = inp
        .max_wars_before_refuse
        .unwrap_or(DEFAULT_MAX_WARS_BEFORE_REFUSE);
    if inp.active_war_count >= max_wars {
        return false;
    }
    let min_peaceful = inp
        .min_ratio_honor_peaceful
        .unwrap_or(DEFAULT_MIN_RATIO_HONOR_PEACEFUL);
    if inp.peaceful_archetype && inp.military_ratio < min_peaceful {
        return false;
    }
    let min_ratio = inp.min_ratio_honor.unwrap_or(DEFAULT_MIN_RATIO_HONOR);
    if inp.military_ratio < min_ratio {
        return false;
    }
    if let Some(trust) = inp.trust_to_requesting_ally {
        let min_trust = inp.min_trust_honor.unwrap_or(DEFAULT_MIN_TRUST_HONOR);
        if trust < min_trust {
            return false;
        }
    }
    true
}

/// Web: `AllianceObligation` (diplomacy-treaties.ts:168).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllianceObligation {
    /// Sojusznicy, ktorzy musza wypowiedziec wojne temu ownerId.
    pub must_declare_war_on: PlayerId,
    /// ownerIds zobowiazani do wojny (bez declarera / atakujacego).
    pub obligated_allies: Vec<PlayerId>,
    /// Jesli ktorys sojusznik nie dolaczy, zrywamy te traktaty.
    pub treaty_ids_to_break_on_refusal: Vec<String>,
}

/// Web: `AllianceEvent` (diplomacy-treaties.ts:164).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AllianceEvent {
    Attacked {
        victim_owner_id: PlayerId,
        aggressor_owner_id: PlayerId,
    },
    DeclaredWar {
        declarer_owner_id: PlayerId,
        target_owner_id: PlayerId,
    },
}

/// Web: `sideOf` (:181).
fn side_of(deal: &ActiveDeal, owner_id: PlayerId) -> bool {
    deal.parties.contains(owner_id)
}

/// Web: `allyOf` (:185).
fn ally_of(deal: &ActiveDeal, owner_id: PlayerId) -> Option<PlayerId> {
    deal.parties.other(owner_id)
}

/// Web: `allianceObligations` (:305).
pub fn alliance_obligations(state: &[ActiveDeal], event: AllianceEvent) -> Vec<AllianceObligation> {
    let mut out = Vec::new();
    for deal in state {
        if !deal.kind.is_alliance() {
            continue;
        }
        match event {
            AllianceEvent::Attacked {
                victim_owner_id,
                aggressor_owner_id,
            } => {
                if !side_of(deal, victim_owner_id) {
                    continue;
                }
                if deal.kind != TreatyKind::DefensiveAlliance
                    && deal.kind != TreatyKind::FullAlliance
                {
                    continue;
                }
                let Some(ally) = ally_of(deal, victim_owner_id) else {
                    continue;
                };
                out.push(AllianceObligation {
                    must_declare_war_on: aggressor_owner_id,
                    obligated_allies: vec![ally],
                    treaty_ids_to_break_on_refusal: vec![deal.id.clone()],
                });
            }
            AllianceEvent::DeclaredWar {
                declarer_owner_id,
                target_owner_id,
            } => {
                if !side_of(deal, declarer_owner_id) {
                    continue;
                }
                if deal.kind != TreatyKind::FullAlliance {
                    continue;
                }
                let Some(ally) = ally_of(deal, declarer_owner_id) else {
                    continue;
                };
                out.push(AllianceObligation {
                    must_declare_war_on: target_owner_id,
                    obligated_allies: vec![ally],
                    treaty_ids_to_break_on_refusal: vec![deal.id.clone()],
                });
            }
        }
    }
    out
}

/// Web: `allianceObligationsForWarDeclaration` (:242). Najpierw `declared_war`, potem `attacked`.
pub fn alliance_obligations_for_war_declaration(
    state: &[ActiveDeal],
    declarer_owner_id: PlayerId,
    target_owner_id: PlayerId,
) -> Vec<AllianceObligation> {
    let mut out = alliance_obligations(
        state,
        AllianceEvent::DeclaredWar {
            declarer_owner_id,
            target_owner_id,
        },
    );
    out.extend(alliance_obligations(
        state,
        AllianceEvent::Attacked {
            victim_owner_id: target_owner_id,
            aggressor_owner_id: declarer_owner_id,
        },
    ));
    out
}

/// Web: `isDefensiveAllianceWarObligation` (:266).
pub fn is_defensive_alliance_war_obligation(
    must_declare_war_on: PlayerId,
    attacker_id: PlayerId,
) -> bool {
    must_declare_war_on == attacker_id
}

/// Web: `treatiesBrokenByRefusal` (:346). Kolejnosc = kolejnosc wstawienia do `Set` (bez duplikatow).
pub fn treaties_broken_by_refusal(
    obligations: &[AllianceObligation],
    joined_war_owner_ids: &[PlayerId],
) -> Vec<String> {
    let joined: BTreeSet<PlayerId> = joined_war_owner_ids.iter().copied().collect();
    let mut seen: BTreeSet<&str> = BTreeSet::new();
    let mut broken: Vec<String> = Vec::new();
    for ob in obligations {
        for ally in &ob.obligated_allies {
            if !joined.contains(ally) {
                for tid in &ob.treaty_ids_to_break_on_refusal {
                    if seen.insert(tid.as_str()) {
                        broken.push(tid.clone());
                    }
                }
            }
        }
    }
    broken
}

/// Web: `dealsForPair` (:362).
fn deals_for_pair(state: &[ActiveDeal], a: PlayerId, b: PlayerId) -> Vec<&ActiveDeal> {
    let pair = CivilizationPair::new(a, b);
    state.iter().filter(|d| d.parties == pair).collect()
}

/// Web: `BREAK_ON_WAR` (:380). Wszystko poza `wasalizacja` (i `rozejm`, ktorego Rust nie modeluje).
fn breaks_on_war(kind: TreatyKind) -> bool {
    matches!(
        kind,
        TreatyKind::Nap
            | TreatyKind::FullAlliance
            | TreatyKind::DefensiveAlliance
            | TreatyKind::OpenBorders
            | TreatyKind::MilitaryMarch
            | TreatyKind::BarbarianCooperation
            | TreatyKind::TradeRoute
            | TreatyKind::Exchange
    )
}

/// Web: `treatiesBrokenByWar` (:405). Id traktatow pary zrywanych wojna, w kolejnosci `state`.
pub fn treaties_broken_by_war(state: &[ActiveDeal], a: PlayerId, b: PlayerId) -> Vec<String> {
    deals_for_pair(state, a, b)
        .into_iter()
        .filter(|d| breaks_on_war(d.kind))
        .map(|d| d.id.clone())
        .collect()
}
