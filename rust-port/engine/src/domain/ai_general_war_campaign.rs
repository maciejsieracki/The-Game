//! REPIN-WOJNA-NOWE-B: port `gra/src/game/ai-general-war-campaign.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/ai-general-war-campaign.ts:5 (typ stage), :7 (`AiGeneralWarCampaign`),
//! :17 (`AI_GENERAL_WAR_GATHER_TURNS`), :19 (`AiWarLandReachability`), :26
//! (`findAiWarLandReachability`), :54 (`aiWarTargetHasReachableLandNeighbor`), :62
//! (`chooseAiGeneralWarTarget`), :74 (`reconcileAiGeneralWarCampaign`), :112
//! (`recordAiGeneralGatherTurn`), :128 (`aiGeneralCampaignToSave`), :139
//! (`restoreAiGeneralCampaigns`).
//! Zaleznosci: `hexNeighborCoords`, `keyOf`, `terrainMoveCost` z `gra/src/units/setup.ts`.
//!
//! ZALOZENIA (adaptacja typow, zachowanie logiki bez zmian):
//! - heks = para `(q, r)` (web: klucz `"q,r"` z `keyOf`).
//! - `GameMap.hexes` + `terrainMoveCost` zastapione mapa `hex_costs`: obecnosc klucza = `key in
//!   map.hexes`, wartosc = wynik `terrainMoveCost` (`f64::INFINITY` = nieprzejezdny). Sama funkcja
//!   `terrainMoveCost` nie jest tu portowana (wejscie wolajacego).
//! - `RuntimeUnit` ograniczony do `GeneralRef { id, is_general }` (pola uzywane przez logike).
//! - `restoreAiGeneralCampaigns` przyjmuje `serde_json::Value` (web: `unknown`), zwraca
//!   `Vec<(owner, campaign)>` z semantyka `Map.set` (nadpisanie wpisu zachowuje jego pozycje).
//! - pola opcjonalne: `generalUnitId` i `blockedGeneralIds` to `Option` (web: `undefined`);
//!   pusty napis w `generalUnitId` traktowany jak falsy (`truthy_id`), jak w JS.

use serde_json::Value;
use std::collections::{HashMap, HashSet};

/// Web: `AI_GENERAL_WAR_GATHER_TURNS`.
pub const AI_GENERAL_WAR_GATHER_TURNS: i64 = 5;

/// Najwieksza liczba calkowita bezpieczna w JS (`Number.isSafeInteger`).
const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;

/// Web: `AiGeneralWarCampaignStage`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiGeneralCampaignStage {
    Recruiting,
    Gathering,
    Attacking,
}

/// Web: `AiGeneralWarCampaign`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AiGeneralWarCampaign {
    pub target_owner_id: i64,
    pub stage: AiGeneralCampaignStage,
    pub general_unit_id: Option<String>,
    /// Web: `blockedGeneralIds` (`None` = `undefined`).
    pub blocked_general_ids: Option<Vec<String>>,
    pub gather_turns_completed: i64,
    pub last_gather_turn: Option<i64>,
}

/// Generał (web: pola `id` i `isGeneral` z `RuntimeUnit`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GeneralRef {
    pub id: String,
    pub is_general: bool,
}

/// Kandydat na cel wojny (web: `{ ownerId, distance, reachable? }`).
#[derive(Debug, Clone, PartialEq)]
pub struct WarTargetCandidate {
    pub owner_id: i64,
    pub distance: f64,
    /// `None` = `undefined` (traktowane jak osiagalny; web: `reachable !== false`).
    pub reachable: Option<bool>,
}

/// Wynik `findAiWarLandReachability` (web: `AiWarLandReachability`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AiWarLandReachability {
    pub hex_keys: HashSet<(i64, i64)>,
    pub visited_hex_count: usize,
    /// Web: literal `1` - jedno przejscie BFS buduje cala skladowa.
    pub search_count: u32,
}

/// Web: `hexNeighborCoords` (`HEX_NEIGHBORS` w tej kolejnosci).
const HEX_NEIGHBORS: [(i64, i64); 6] = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)];

fn hex_neighbor_coords(q: i64, r: i64) -> impl Iterator<Item = (i64, i64)> {
    HEX_NEIGHBORS
        .into_iter()
        .map(move |(dq, dr)| (q + dq, r + dr))
}

/// Web: `truthy` dla `generalUnitId` (napis niepusty).
fn truthy_id(id: &Option<String>) -> bool {
    id.as_deref().is_some_and(|s| !s.is_empty())
}

/// Web: `findAiWarLandReachability`. BFS po przejezdnych heksach (obecne w mapie, koszt inny niz
/// `Infinity`, nie zablokowane) od `probe`. Start nieprzejezdny daje pusty wynik.
pub fn find_ai_war_land_reachability(
    probe: (i64, i64),
    hex_costs: &HashMap<(i64, i64), f64>,
    blocked: &HashSet<(i64, i64)>,
) -> AiWarLandReachability {
    let walkable = |k: (i64, i64)| {
        !blocked.contains(&k) && hex_costs.get(&k).is_some_and(|cost| *cost != f64::INFINITY)
    };
    let mut hex_keys = HashSet::new();
    if !walkable(probe) {
        return AiWarLandReachability {
            hex_keys,
            visited_hex_count: 0,
            search_count: 1,
        };
    }
    let mut queue = vec![probe];
    hex_keys.insert(probe);
    let mut offset = 0;
    while offset < queue.len() {
        let (q, r) = queue[offset];
        offset += 1;
        for neighbor in hex_neighbor_coords(q, r) {
            if hex_keys.contains(&neighbor) || !walkable(neighbor) {
                continue;
            }
            hex_keys.insert(neighbor);
            queue.push(neighbor);
        }
    }
    let visited_hex_count = hex_keys.len();
    AiWarLandReachability {
        hex_keys,
        visited_hex_count,
        search_count: 1,
    }
}

/// Web: `aiWarTargetHasReachableLandNeighbor` - cel ma sasiada w zbiorze osiagalnych heksow.
pub fn ai_war_target_has_reachable_land_neighbor(
    reachability: &AiWarLandReachability,
    target: (i64, i64),
) -> bool {
    hex_neighbor_coords(target.0, target.1).any(|n| reachability.hex_keys.contains(&n))
}

/// Web: `chooseAiGeneralWarTarget`. Odrzuca kandydatow `reachable === false`; zachowuje obecny
/// cel, jesli nadal osiagalny; inaczej najblizszy (remis: nizszy `ownerId`).
pub fn choose_ai_general_war_target(
    current: Option<&AiGeneralWarCampaign>,
    candidates: &[WarTargetCandidate],
) -> Option<i64> {
    let reachable: Vec<&WarTargetCandidate> = candidates
        .iter()
        .filter(|c| c.reachable != Some(false))
        .collect();
    if reachable.is_empty() {
        return None;
    }
    if let Some(cur) = current {
        if reachable.iter().any(|c| c.owner_id == cur.target_owner_id) {
            return Some(cur.target_owner_id);
        }
    }
    let mut sorted = reachable;
    sorted.sort_by(|a, b| {
        a.distance
            .partial_cmp(&b.distance)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.owner_id.cmp(&b.owner_id))
    });
    Some(sorted[0].owner_id)
}

fn recruiting(target: i64) -> AiGeneralWarCampaign {
    AiGeneralWarCampaign {
        target_owner_id: target,
        stage: AiGeneralCampaignStage::Recruiting,
        general_unit_id: None,
        blocked_general_ids: None,
        gather_turns_completed: 0,
        last_gather_turn: None,
    }
}

fn gathering(target: i64, general_id: &str) -> AiGeneralWarCampaign {
    AiGeneralWarCampaign {
        target_owner_id: target,
        stage: AiGeneralCampaignStage::Gathering,
        general_unit_id: Some(general_id.to_owned()),
        blocked_general_ids: None,
        gather_turns_completed: 0,
        last_gather_turn: None,
    }
}

/// Web: `reconcileAiGeneralWarCampaign`. `alive_general_ids` = `None` oznacza domyslne
/// `general ? [general.id] : []` z webu.
pub fn reconcile_ai_general_war_campaign(
    current: Option<&AiGeneralWarCampaign>,
    target_owner_id: Option<i64>,
    general: Option<&GeneralRef>,
    queued_general_exists: bool,
    alive_general_ids: Option<&[String]>,
) -> Option<AiGeneralWarCampaign> {
    let target = target_owner_id?;
    let same_target = current.is_some_and(|c| c.target_owner_id == target);
    let Some(current) = current.filter(|_| same_target) else {
        return Some(match general.filter(|g| g.is_general) {
            Some(g) => gathering(target, &g.id),
            None => recruiting(target),
        });
    };
    let campaign = current.clone();
    if campaign.stage == AiGeneralCampaignStage::Recruiting {
        let must_be_fresh = campaign.blocked_general_ids.is_some();
        if let Some(g) = general.filter(|g| g.is_general) {
            let fresh = match &campaign.blocked_general_ids {
                Some(blocked) if must_be_fresh => !blocked.contains(&g.id),
                _ => {
                    !truthy_id(&campaign.general_unit_id)
                        || campaign.general_unit_id.as_deref() != Some(g.id.as_str())
                }
            };
            if fresh {
                return Some(gathering(target, &g.id));
            }
        }
    } else if truthy_id(&campaign.general_unit_id)
        && !general.is_some_and(|g| {
            campaign.general_unit_id.as_deref() == Some(g.id.as_str()) && g.is_general
        })
    {
        // Smierc przypisanego generala restartuje cykl i wymaga swiezego rekruta.
        let alive: Vec<String> = match alive_general_ids {
            Some(ids) => ids.to_vec(),
            None => general.map(|g| vec![g.id.clone()]).unwrap_or_default(),
        };
        return Some(AiGeneralWarCampaign {
            target_owner_id: target,
            stage: AiGeneralCampaignStage::Recruiting,
            general_unit_id: campaign.general_unit_id.clone(),
            blocked_general_ids: Some(alive),
            gather_turns_completed: 0,
            last_gather_turn: None,
        });
    } else if !truthy_id(&campaign.general_unit_id) && general.is_some_and(|g| g.is_general) {
        let g = general.expect("general obecny (sprawdzone wyzej)");
        return Some(gathering(target, &g.id));
    }
    if !queued_general_exists
        && general.is_none()
        && campaign.stage != AiGeneralCampaignStage::Recruiting
    {
        return Some(recruiting(target));
    }
    Some(campaign)
}

/// Web: `recordAiGeneralGatherTurn`. Liczy tury zbiorki (raz na numer tury); po
/// `AI_GENERAL_WAR_GATHER_TURNS` przechodzi do `attacking`.
pub fn record_ai_general_gather_turn(
    campaign: &AiGeneralWarCampaign,
    turn: i64,
) -> AiGeneralWarCampaign {
    if campaign.stage != AiGeneralCampaignStage::Gathering
        || campaign.last_gather_turn == Some(turn)
    {
        return campaign.clone();
    }
    let gather_turns_completed = campaign.gather_turns_completed + 1;
    let stage = if gather_turns_completed >= AI_GENERAL_WAR_GATHER_TURNS {
        AiGeneralCampaignStage::Attacking
    } else {
        campaign.stage
    };
    AiGeneralWarCampaign {
        gather_turns_completed,
        last_gather_turn: Some(turn),
        stage,
        ..campaign.clone()
    }
}

/// Web: `aiGeneralCampaignToSave`. Pusty `generalUnitId` nie jest zapisywany (jak falsy w JS).
pub fn ai_general_campaign_to_save(
    campaigns: &[(i64, AiGeneralWarCampaign)],
) -> Vec<(i64, AiGeneralWarCampaign)> {
    campaigns
        .iter()
        .map(|(owner, c)| {
            let mut saved = c.clone();
            if !truthy_id(&saved.general_unit_id) {
                saved.general_unit_id = None;
            }
            (*owner, saved)
        })
        .collect()
}

/// Liczba calkowita bezpieczna w JS (`Number.isSafeInteger`) z wartosci JSON.
fn safe_integer(v: &Value) -> Option<i64> {
    if let Some(n) = v.as_i64() {
        return (n.unsigned_abs() <= MAX_SAFE_INTEGER as u64).then_some(n);
    }
    let f = v.as_f64()?;
    (f.fract() == 0.0 && f.abs() <= MAX_SAFE_INTEGER as f64).then_some(f as i64)
}

fn restore_one(raw: &Value) -> Option<AiGeneralWarCampaign> {
    if !raw.is_object() {
        return None;
    }
    let target_owner_id = safe_integer(raw.get("targetOwnerId")?).filter(|t| *t >= 0)?;
    let stage = match raw.get("stage")?.as_str()? {
        "recruiting" => AiGeneralCampaignStage::Recruiting,
        "gathering" => AiGeneralCampaignStage::Gathering,
        "attacking" => AiGeneralCampaignStage::Attacking,
        _ => return None,
    };
    let gather_turns_completed =
        safe_integer(raw.get("gatherTurnsCompleted")?).filter(|g| *g >= 0)?;
    let general_unit_id = match raw.get("generalUnitId") {
        None => None,
        Some(Value::String(s)) if !s.is_empty() => Some(s.clone()),
        Some(Value::String(_)) => None,
        Some(_) => return None,
    };
    let blocked_general_ids = match raw.get("blockedGeneralIds") {
        None => None,
        Some(Value::Array(items)) => {
            let mut ids = Vec::with_capacity(items.len());
            for item in items {
                ids.push(item.as_str()?.to_owned());
            }
            Some(ids)
        }
        Some(_) => return None,
    };
    let last_gather_turn = raw.get("lastGatherTurn").and_then(safe_integer);
    Some(AiGeneralWarCampaign {
        target_owner_id,
        stage,
        general_unit_id,
        blocked_general_ids,
        gather_turns_completed,
        last_gather_turn,
    })
}

/// Web: `restoreAiGeneralCampaigns`. Odrzuca niepoprawne wpisy; powtorzony owner nadpisuje
/// wartosc, zachowujac pozycje pierwszego wystapienia (semantyka `Map.set`).
pub fn restore_ai_general_campaigns(value: &Value) -> Vec<(i64, AiGeneralWarCampaign)> {
    let mut restored: Vec<(i64, AiGeneralWarCampaign)> = Vec::new();
    let Some(entries) = value.as_array() else {
        return restored;
    };
    for entry in entries {
        let Some(pair) = entry.as_array().filter(|p| p.len() == 2) else {
            continue;
        };
        let Some(owner_id) = safe_integer(&pair[0]).filter(|o| *o > 0) else {
            continue;
        };
        let Some(campaign) = restore_one(&pair[1]) else {
            continue;
        };
        match restored.iter_mut().find(|(o, _)| *o == owner_id) {
            Some(slot) => slot.1 = campaign,
            None => restored.push((owner_id, campaign)),
        }
    }
    restored
}
