//! R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A): zdobycie miasta po wygranym szturmie gracza (hak T7b
//! [`CityCaptureRequested`]) zastosowane do [`PlayableState`].
//!
//! Pin `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/post-battle-map.ts`), kolejność wywołań:
//! `finishSiegeStormBattle` (`main.ts:36596-36690`) → `applyMapBattleOutcome` (`:34431-34745`):
//! 1. `applyPostBattleMap` gałąź wygranej bez `holdPositionAfterWin` (`post-battle-map.ts:445-448`):
//!    `wipeDefenderOnCityCenter` → `retreatDefendersAfterAtkWin` → `moveAtkRosterOntoBattleHex`
//!    ([`siege_battle_apply::enter_city_hex_after_atk_win`]);
//! 2. bramka zdobycia (`main.ts:34650-34677`): `isCityCaptureBlockedByDefenders` (barbarzyńca, `barbarians.ts:499-507`),
//!    `cityOnHex.ownerId !== atkRoster[0].ownerId`, `areEnemyOwners`, `!fortifiedCaptureBlocked` (= `stormCaptureBlocked`,
//!    fałsz dla haka z wyłomem);
//! 3. `applyCityCaptureToMap` (P1, `main.ts:36034-36264`) z `applyCityCaptureAfterBattle` (P9,
//!    `post-battle-map.ts:493-596`) w środku;
//! 4. `validateActiveSieges` (`main.ts:34744`) na stanie po zdobyciu (kontrakt U2 obrony T7b).
//!
//! Decyzje techniczne (raport `01-operator-r1.md`, wpis do `REJESTR-RUST.md` przez orkiestratora):
//! * **D-ZMA-1** wejście na heks miasta (krok 1) wykonuje konsument haka, nie część B: [`apply_outcome`] zostaje
//!   bajt w bajt z wektorami T7b (`p6_k5loop_wiring_b_pin`), a `spendAttackMpOnLive` (już wykonany) jest przemienny z
//!   ruchem (patrz [`siege_battle_apply::enter_city_hex_after_atk_win`]).
//! * **D-ZMA-2** komenda mostu: rozszerzenie `FinishSiegeBattle` (bez nowej komendy, `CONTRACT_VERSION` bez zmian) —
//!   w pinie zdobycie jest częścią `finishSiegeStormBattle`. Wynik: addytywne pole `result.capture`.
//! * **D-ZMA-3** `capturedFromOwnerId` (jedyne pole miasta pisane i czytane przez `applyCapturePopulationLoss`, od którego
//!   zależy ludność przy odbiciu) = nowe pole stanu `captured_from_owner_by_city`.
//! * **D-ZMA-4** kroki pinu bez pola w [`PlayableState`] są jawnie wymienione w `not_applied` wyniku (nie po cichu):
//!   lista [`NOT_APPLIED_ALWAYS`] i warunkowe wpisy. Mapowanie każdego wywołania pinu: [`PIN_STEPS`].
//! * **D-ZMA-5** id właścicieli: stan używa `HUMAN_OWNER_ID = 1` (web 0); `runCapitalCapturePlunder` (port Q6) rozróżnia
//!   gracza po id 0, więc wołanie idzie na id webu (`1 → 0`), a skutki wracają na id stanu. Właściciel 0 w stanie byłby
//!   niejednoznaczny → jawny błąd.
//! * **D-ZMA-6** stolica: web `capitalCityIdByOwner` ↔ `PlayableCity::is_capital` (miasto z flagą = wyznaczona stolica
//!   właściciela; brak flagi = fallback „najstarsze miasto”, id `city<N>` z `CityId`). Po zdobyciu zdobyte miasto traci
//!   flagę, sukcesja stolicy ofiary ustawia flagę nowej stolicy.
//! * **D-ZMA-7** wojna zwykła AI↔AI (`maybeResolveRegularWarOnCityCapture` z auto-pokojem) jest nieosiągalna z komendy
//!   (szturm wydaje tylko gracz, Q3 pinu: gracz = no-op); para AI↔AI zwraca jawny błąd (bitwa `Aborted`, stan bez zmian).
//! * **D-ZMA-8** eliminacja: `eliminacja::eliminate_owner` + adapter usuwający `diplomacyPairMeta` ofiary w formacie klucza
//!   stanu `min-max` (pin `eliminateOwner` `main.ts:35405-35409`); `clear_eliminated_owner_war_state` szuka klucza `a_b`
//!   (rozbieżność formatu poza allowlistą — dług ZMA-DL-3).

use std::collections::{BTreeMap, BTreeSet};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use crate::domain::brake_power::objective_power_for_owner;
use crate::domain::diplomacy::RelationStatus;
use crate::domain::diplomacy_war_peace_profile::{record_war_city_loss, WarCityRecord};
use crate::domain::eliminacja::eliminate_owner;
use crate::domain::fort_territory::{fort_territory_nodes, OrderedFortNode};
use crate::domain::order_effects_culture::{
    civ_religion_for_key, default_city_religion_state, religion_own_share, total_adherents,
};
use crate::domain::order_effects_lane::PostCaptureLawFields;
use crate::domain::playable::{MovementPoints, PlayableFortKind, PlayableState};
use crate::domain::production_queue::{filter_queue, sanitize_build_queue};
use crate::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use crate::domain::siege_battle_adapter::is_civilian_unit;
use crate::domain::siege_battle_apply::{
    end_map_siege, enter_city_hex_after_atk_win, validate_storm_siege, ApplyRosters,
    CityCaptureRequested, SiegeBattleError,
};
use crate::domain::siege_capital_plunder::{
    is_barbarian, js_max0, oldest_city_of_owner, run_capital_capture_plunder, OwnerResourceAccess,
    PlunderCity, PlunderInput, PlunderLabels, PlunderState,
};
use crate::domain::siege_capture_events::{
    CaptureEventStore, CaptureRow, CityCaptureArgs, CityCaptureDetails, CivElimDetails,
    SidePanelEvent,
};
use crate::domain::siege_transfer_effects::{
    apply_capture_population_loss, apply_post_capture_law_on_capture, CapturePopLossInput,
    CAPTURE_POP_LOSS_PIN,
};
use crate::domain::siege_transfer_q5::{
    note_city_capture, ChronicleMap, CivChronicle, CivChronicleVs,
};
use crate::domain::siege_wonder_watch::{
    apply_wonder_transfers, plan_wonder_transfers, snapshot_wonder_territory_owners,
    TransferableWonder, WonderTerritorySnapshot,
};
use crate::domain::terrain::{CityNode, FortImprovementType, FortNode};
use crate::domain::territory::{territory_owner_at, ReligionState, TerritoryNode};
use crate::domain::turn_war_epoch::{empire_epoch_for_owner, game_start_era, owner_era_facts};
use crate::domain::turn_war_inputs::{
    power_raw_for_owner, production_config, HUMAN_OWNER_ID, KEY_PAIR_META,
};
use crate::domain::types::porzadek::society_params;
use crate::domain::war_turn_declare::pair_key;
use crate::domain::{CityId, PlayerId, PositionDto};

/// Mapowanie wywołań pinu na port (tabela kryterium; test sprawdza kompletność wobec generatora).
pub const PIN_STEPS: &[(&str, &str)] = &[
    (
        "wipeDefenderOnCityCenter",
        "siege_battle_apply::enter_city_hex_after_atk_win",
    ),
    (
        "retreatDefendersAfterAtkWin",
        "siege_battle_apply::enter_city_hex_after_atk_win",
    ),
    (
        "moveAtkRosterOntoBattleHex",
        "siege_battle_apply::enter_city_hex_after_atk_win",
    ),
    (
        "isCityCaptureBlockedByDefenders",
        "is_city_capture_blocked_by_defenders",
    ),
    (
        "areEnemyOwners",
        "relacja War (D-ADP-L-BARB: brak barbarzyncow w stanie)",
    ),
    (
        "noteCityCapture",
        "apply_note_city_capture (PlayableState::civ_chronicle_by_owner)",
    ),
    (
        "beginWonderTransferWatch",
        "snapshot_wonder_territory_owners na wezlach stanu",
    ),
    (
        "wasIndependentCityStateBeforeCapture",
        "NOT_APPLIED: startCityState brak w stanie",
    ),
    (
        "applyCapturePopulationLoss",
        "siege_transfer_effects::apply_capture_population_loss",
    ),
    ("isCivilianUnit", "siege_battle_adapter::is_civilian_unit"),
    (
        "applyPostCaptureLawOnCapture",
        "apply_capture_law (PlayableState::post_capture_law_by_city)",
    ),
    (
        "seedCityOwnerDefaults",
        "NOT_APPLIED: ustawienia miasta brak w stanie",
    ),
    (
        "applyLiveSafeRationForCity",
        "NOT_APPLIED: racje miasta brak w stanie",
    ),
    (
        "clearCityStateFlagOnCapture",
        "NOT_APPLIED: startCityState brak w stanie",
    ),
    (
        "onCityCapturedCulture",
        "NOT_APPLIED: ownCultureShare brak w stanie",
    ),
    (
        "settleWonderTransfer",
        "plan_wonder_transfers + apply_wonder_transfers",
    ),
    (
        "triggerRebelProtectionWarConsequence",
        "no-op: rebelState brak w stanie (wasProtectedRebel = false)",
    ),
    (
        "maybeResolveRegularWarOnCityCapture",
        "gracz = no-op (Q3 pinu); AI-AI = blad (D-ZMA-7)",
    ),
    (
        "recordWarCityLossForPair",
        "record_war_city_loss_for_pair (diplomacyPairMeta.wojnaMiasta)",
    ),
    (
        "sanitizeBuildQueue",
        "production_queue::sanitize_build_queue (apply_capture_production)",
    ),
    (
        "sanitizeProductionQueue",
        "apply_capture_production (wonderGateOk bez portu: not_applied)",
    ),
    (
        "onCityCapturedReligion",
        "on_city_captured_religion (stores.religion_by_city)",
    ),
    (
        "playerEverOwnedCityByOwner.add",
        "PlayableState::record_ever_owned_city",
    ),
    ("syncCityGarnizon", "NOT_APPLIED: garnizon brak w stanie"),
    ("endMapSiege", "siege_battle_apply::end_map_siege"),
    (
        "runCapitalCapturePlunder",
        "siege_capital_plunder::run_capital_capture_plunder (D-ZMA-5/6)",
    ),
    ("eliminateOwner", "eliminacja::eliminate_owner"),
    (
        "buildCityCaptureReportRows",
        "build_city_capture_report_rows (kind zwykle; stolica/eliminacja z ui_calls planszy)",
    ),
    (
        "recordCityCaptureEvent",
        "apply_record_city_capture_event (PlayableState::capture_events, CaptureEventStore)",
    ),
    (
        "validateActiveSieges",
        "siege_battle_apply::validate_storm_siege",
    ),
    ("isBarbarian", "siege_capital_plunder::is_barbarian"),
    ("filterQueue", "production_queue::filter_queue"),
    (
        "isCapitalOnlyBuildingCapture",
        "is_capital_only_building (buildings.json lokalizacja)",
    ),
    (
        "capitalCityIdForOwner",
        "capital_city_id_for_owner (designated + oldestCityOfOwner)",
    ),
    ("ownerPracaPool", "economy.praca_pool_by_owner (add_praca)"),
    (
        "setOwnerPracaPool",
        "economy.praca_pool_by_owner (add_praca, Math.max(0, v))",
    ),
    (
        "ownerReligionForOwnerId",
        "owner_religion (civReligionForKey nad PlayablePlayer::civilization)",
    ),
    ("markCityStateDirty", "NOT_APPLIED: UI"),
    ("mocLabel", "moc_label (power-params.json hud_etykieta)"),
    (
        "civLabelForOwner",
        "NoLabels owner{idWebu} (D-ZMB-7: nazwa wyswietlana poza domena)",
    ),
    ("capturePopLossReportRow", "capture_pop_loss_report_row"),
];

/// Kroki pinu pomijane przy każdym zdobyciu (brak pola w stanie, D-ZMA-4).
pub const NOT_APPLIED_ALWAYS: &[&str] = &[
    "inGarnizon/oblegaCityId",
    "foundedByOwner",
    "rebelState",
    "seedCityOwnerDefaults",
    "applyLiveSafeRationForCity",
    "clearCityStateFlagOnCapture",
    "onCityCapturedCulture",
    "triggerRebelProtectionWarConsequence",
    "syncCityGarnizon",
];

/// Powód braku zdobycia mimo wygranej z wyłomem (`main.ts:34668-34677`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CaptureSkipReason {
    /// `cityOnHex.ownerId === atkRoster[0].ownerId`.
    SameOwner,
    /// `!areEnemyOwners(atk, city.owner)` (pokój / brak relacji wojny).
    NotEnemies,
    /// `isCityCaptureBlockedByDefenders` (atakujący barbarzyńca, obrońcy na heksie).
    BlockedByDefenders,
}

/// Zdarzenie stolicy (`CapitalCaptureEventKind`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CapitalCaptureKind {
    PrzejecieStolicy,
    Eliminacja,
}

/// Wynik konsumenta haka (pole `result.capture` odpowiedzi `FinishSiegeBattle`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CityCaptureResultDto {
    /// Miasto zmieniło właściciela.
    pub captured: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub skipped: Option<CaptureSkipReason>,
    pub old_owner_id: u64,
    pub new_owner_id: u64,
    /// `wipeDefenderOnCityCenter` + `units.splice` P9 (obrońcy starego właściciela na heksie), kolejność wykonania.
    pub removed_unit_ids: Vec<u64>,
    /// Jednostki, które weszły na heks miasta (`moveAtkRosterOntoBattleHex` i P9).
    pub entered_unit_ids: Vec<u64>,
    pub population_before: u32,
    pub population_after: u32,
    /// `settleWonderTransfer`: cuda przekazane zdobywcy (id).
    pub wonders_transferred: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub capital_event: Option<CapitalCaptureKind>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub eliminated_owner_id: Option<u64>,
    /// Skarbiec przejęty przy zdobyciu stolicy / eliminacji.
    pub treasury_taken: f64,
    pub techs_copied: Vec<String>,
    /// Oblężenie zakończone w tym kroku (`endMapSiege` zdobycia albo `validateActiveSieges` po wejściu na heks).
    pub siege_ended: bool,
    /// D-ZMA-4: kroki pinu niewykonane (brak pola w stanie / brak portu).
    pub not_applied: Vec<String>,
}

/// `isCityCaptureBlockedByDefenders` (`barbarians.ts:499-507`): tylko atakujący barbarzyńca, gdy na heksie stoi
/// jednostka nie-barbarzyńska. `units` = `(owner, q, r)`.
#[must_use]
pub fn is_city_capture_blocked_by_defenders(
    atk_owner: i64,
    units: &[(i64, i32, i32)],
    q: i32,
    r: i32,
) -> bool {
    if !is_barbarian(atk_owner) {
        return false;
    }
    units
        .iter()
        .any(|&(o, uq, ur)| uq == q && ur == r && !is_barbarian(o))
}

fn producer(msg: impl Into<String>) -> SiegeBattleError {
    SiegeBattleError::Producer(msg.into())
}

fn owner_i64(p: PlayerId) -> i64 {
    i64::try_from(p.get()).unwrap_or(i64::MAX)
}

/// D-ZMA-5: id stanu → id webu (gracz 1 → 0).
fn web_owner(o: i64) -> i64 {
    if o == HUMAN_OWNER_ID {
        0
    } else {
        o
    }
}

/// D-ZMA-5: id webu → id stanu.
fn state_owner(o: i64) -> i64 {
    if o == 0 {
        HUMAN_OWNER_ID
    } else {
        o
    }
}

fn at_war(state: &PlayableState, a: i64, b: i64) -> bool {
    let (Ok(a), Ok(b)) = (u64::try_from(a), u64::try_from(b)) else {
        return false;
    };
    state
        .war
        .diplomacy
        .relation(PlayerId::new(a), PlayerId::new(b))
        .is_some_and(|r| r.status == RelationStatus::War)
}

/// `buildAllTerritoryNodes()` (`main.ts:5667-5679`): miasta (pop, level 1) + `fortTerritoryNodes(fortNodes)`.
fn territory_nodes(state: &PlayableState) -> Vec<TerritoryNode> {
    let mut nodes: Vec<TerritoryNode> = state
        .cities
        .iter()
        .map(|c| {
            TerritoryNode::new(
                CityNode::city(
                    i32::from(c.position.x()),
                    i32::from(c.position.y()),
                    f64::from(c.population),
                ),
                owner_i64(c.owner_id),
            )
        })
        .collect();
    if !state.forts.is_empty() {
        let forts: Vec<OrderedFortNode> = state
            .forts
            .iter()
            .map(|f| {
                OrderedFortNode::new(
                    FortNode {
                        q: f.q,
                        r: f.r,
                        owner_id: owner_i64(f.owner_id),
                        kind: match f.kind {
                            PlayableFortKind::Fort => FortImprovementType::Fort,
                            PlayableFortKind::Posterunek => FortImprovementType::Posterunek,
                        },
                        contested_useless: f.contested_useless,
                    },
                    f.built_at_turn,
                    f.seq,
                )
            })
            .collect();
        nodes.extend(fort_territory_nodes(&forts));
    }
    nodes
}

fn wonders_of(state: &PlayableState) -> Vec<TransferableWonder> {
    state
        .placed_world_wonders
        .iter()
        .map(|w| TransferableWonder {
            wonder_id: w.wonder_id.clone(),
            q: w.q,
            r: w.r,
            owner_id: i32::try_from(w.owner_id.get()).unwrap_or(i32::MAX),
        })
        .collect()
}

/// `snapshotWonderTerritoryOwners(placedWorldWonders, territoryOwnerAt)` (`main.ts:4231-4237`); `None` = brak cudów.
fn wonder_snapshot(state: &PlayableState) -> Option<WonderTerritorySnapshot> {
    if state.placed_world_wonders.is_empty() {
        return None;
    }
    let nodes = territory_nodes(state);
    Some(snapshot_wonder_territory_owners(
        &wonders_of(state),
        |q, r| territory_owner_at(q, r, &nodes).and_then(|o| i32::try_from(o).ok()),
    ))
}

/// `settleWonderTransfer(before)` (`main.ts:4239-4268`) w zakresie stanu; zwraca przekazane cuda.
fn settle_wonders(
    state: &mut PlayableState,
    before: Option<&WonderTerritorySnapshot>,
) -> Vec<String> {
    let Some(before) = before else {
        return Vec::new();
    };
    let Some(after) = wonder_snapshot(state) else {
        return Vec::new();
    };
    let mut wonders = wonders_of(state);
    let plan = plan_wonder_transfers(&wonders, before, &after);
    if plan.is_empty() {
        return Vec::new();
    }
    apply_wonder_transfers(&mut wonders, &plan);
    for (dst, src) in state.placed_world_wonders.iter_mut().zip(wonders.iter()) {
        dst.owner_id = PlayerId::new(u64::try_from(src.owner_id).unwrap_or(0));
    }
    plan.into_iter().map(|t| t.wonder_id).collect()
}

/// `recordWarCityLossForPair(oldOwner, newOwner)` (`main.ts:11543-11550`) z `diploEnsureWarStart` (`:11488-11493`):
/// meta pary w `diplomacyPairMeta` (`opaque`, klucz `min-max` stanu). Pary bez wojny = no-op.
fn record_war_city_loss_for_pair(
    state: &mut PlayableState,
    old_owner: i64,
    new_owner: i64,
) -> Result<(), SiegeBattleError> {
    if old_owner == new_owner || !at_war(state, old_owner, new_owner) {
        return Ok(());
    }
    let turn = f64::from(state.turn);
    let key = pair_key(old_owner, new_owner);
    let mut rows: Vec<Value> = match state.war.opaque.get(KEY_PAIR_META) {
        None => Vec::new(),
        Some(Value::Array(a)) => a.clone(),
        Some(_) => return Err(producer("diplomacyPairMeta: oczekiwano tablicy par")),
    };
    let pos = rows
        .iter()
        .position(|r| r.get(0).and_then(Value::as_str) == Some(key.as_str()));
    // `getDiploPairMeta`: brak wpisu = `freshDiploPairMeta()` (`diplomacy-pn-engine.ts:143-145`).
    let mut meta: Map<String, Value> = match pos.and_then(|p| rows[p].get(1)) {
        Some(Value::Object(m)) => m.clone(),
        Some(_) => {
            return Err(producer(format!(
                "diplomacyPairMeta[{key}]: meta nie jest obiektem"
            )))
        }
        None => {
            let mut m = Map::new();
            m.insert("trustPnGainedThisTurn".into(), json!(0));
            m.insert("dobraWolaRemainingTur".into(), json!(0));
            m
        }
    };
    let od = match meta.get("wojnaStartTura").and_then(Value::as_f64) {
        Some(v) => v,
        None => {
            meta.insert("wojnaStartTura".into(), num(turn));
            turn
        }
    };
    let prev = meta.get("wojnaMiasta").and_then(|v| {
        let o = v.as_object()?;
        Some(WarCityRecord {
            od: o.get("od")?.as_f64()?,
            utraty: o
                .get("utraty")
                .and_then(Value::as_object)
                .map(|u| {
                    u.iter()
                        .filter_map(|(k, v)| Some((k.clone(), v.as_f64()?)))
                        .collect()
                })
                .unwrap_or_default(),
            ostatnia_tura: o.get("ostatniaTura").and_then(Value::as_f64),
        })
    });
    let rec = record_war_city_loss(prev.as_ref(), od, &old_owner.to_string(), turn);
    let utraty: Map<String, Value> = rec
        .utraty
        .iter()
        .map(|(k, v)| (k.clone(), num(*v)))
        .collect();
    let mut rec_obj = Map::new();
    rec_obj.insert("od".into(), num(rec.od));
    rec_obj.insert("utraty".into(), Value::Object(utraty));
    if let Some(t) = rec.ostatnia_tura {
        rec_obj.insert("ostatniaTura".into(), num(t));
    }
    meta.insert("wojnaMiasta".into(), Value::Object(rec_obj));
    let row = Value::Array(vec![Value::String(key), Value::Object(meta)]);
    match pos {
        Some(p) => rows[p] = row,
        None => rows.push(row),
    }
    state
        .war
        .opaque
        .insert(KEY_PAIR_META.to_owned(), Value::Array(rows));
    Ok(())
}

/// Liczba JSON jak `JSON.stringify` (całkowite bez części ułamkowej), spójnie z `war_turn_state`.
fn num(v: f64) -> Value {
    if v.is_finite() && v.fract() == 0.0 && v.abs() < 9.0e15 {
        #[allow(clippy::cast_possible_truncation)]
        Value::from(v as i64)
    } else {
        json!(v)
    }
}

/// D-ZMA-8: usuwa wpisy `diplomacyPairMeta` (klucz stanu `min-max`) zawierające `owner`.
fn remove_pair_meta_of_owner(state: &mut PlayableState, owner: i64) {
    let Some(Value::Array(rows)) = state.war.opaque.get_mut(KEY_PAIR_META) else {
        return;
    };
    rows.retain(|r| {
        let key = r.get(0).and_then(Value::as_str).unwrap_or("");
        !key.split('-').any(|p| p.parse::<i64>().ok() == Some(owner))
    });
}

/// `OwnerResourceAccess` nad stanem (id webu, D-ZMA-5); zapisy `Math.max(0, v)` jak `setOwnerTreasury` /
/// `setOwnerPracaPool` (`main.ts:34867-34871`, `:34879-34881`). Skarbiec gracza = `economy.treasury`, AI =
/// `ai_treasury_by_owner` (brak wpisu = 0, zapis tworzy wpis); pula Pracy = `praca_pool_by_owner`; technologie =
/// `stores.researched_techs_by_owner`. `naukaPool` i Spichlerz nie mają pola w stanie (odczyt 0, zapis pominięty,
/// wpis w `not_applied`).
struct StateAccess<'a> {
    state: &'a mut PlayableState,
}

impl StateAccess<'_> {
    fn key(owner: i64) -> u64 {
        u64::try_from(state_owner(owner)).unwrap_or(u64::MAX)
    }
}

impl OwnerResourceAccess for StateAccess<'_> {
    fn get_treasury(&self, owner: i64) -> f64 {
        if state_owner(owner) == HUMAN_OWNER_ID {
            self.state.economy.treasury
        } else {
            self.state
                .economy
                .ai_treasury_by_owner
                .get(&Self::key(owner))
                .copied()
                .unwrap_or(0.0)
        }
    }
    fn set_treasury(&mut self, owner: i64, value: f64) {
        if state_owner(owner) == HUMAN_OWNER_ID {
            self.state.economy.treasury = js_max0(value);
        } else {
            self.state
                .economy
                .ai_treasury_by_owner
                .insert(Self::key(owner), js_max0(value));
        }
    }
    fn get_praca_pool(&self, owner: i64) -> f64 {
        self.state
            .economy
            .praca_pool_by_owner
            .get(&Self::key(owner))
            .copied()
            .unwrap_or(0.0)
    }
    fn set_praca_pool(&mut self, owner: i64, value: f64) {
        self.state
            .economy
            .praca_pool_by_owner
            .insert(Self::key(owner), js_max0(value));
    }
    fn get_nauka_pool(&self, _owner: i64) -> f64 {
        0.0
    }
    fn set_nauka_pool(&mut self, _owner: i64, _value: f64) {}
    fn get_researched_techs(&self, owner: i64) -> BTreeSet<String> {
        self.state
            .stores
            .researched_techs_by_owner
            .get(&Self::key(owner))
            .cloned()
            .unwrap_or_default()
    }
    fn add_researched_techs(&mut self, owner: i64, ids: &[String]) {
        self.state
            .stores
            .researched_techs_by_owner
            .entry(Self::key(owner))
            .or_default()
            .extend(ids.iter().cloned());
    }
    fn food_supported(&self) -> bool {
        false
    }
    fn get_food_reserve(&self, _owner: i64) -> f64 {
        0.0
    }
    fn set_food_reserve(&mut self, _owner: i64, _value: f64) {}
    fn get_food_capacity(&self, _owner: i64) -> Option<f64> {
        None
    }
}

/// Etykiety UI. `civLabelForOwner`/`ownerDiploLabel` (`main.ts:36576`, `:10500`: nazwa z `resolveOwnerBaseName`,
/// `ownerDisplayName`, nazwy miast, pule nazw) to warstwa prezentacji poza domeną: konwencja `owner{idWebu}` (D-ZMB-7) —
/// trafia także do kart zdarzeń w `capture_events`. `mocLabel` = port pinu ([`moc_label`]).
struct NoLabels;

impl PlunderLabels for NoLabels {
    fn civ_label(&self, owner_id: i64) -> String {
        format!("owner{owner_id}")
    }
    fn moc_label(&self) -> String {
        // Obrona r1 (Z1): etykieta trafia do wiersza raportu „Moc” karty eliminacji — port `mocLabel()` pinu.
        moc_label()
    }
    fn civ_display_name(&self, _owner_id: i64) -> Option<String> {
        None
    }
    fn civ_key_for_owner_id(&self, owner_id: i64) -> String {
        format!("owner{owner_id}")
    }
    fn one_line(&self, kind: &str) -> String {
        kind.to_owned()
    }
    fn spectacle(&self, label: &str) -> String {
        label.to_owned()
    }
}

fn plunder_id(cid: CityId) -> String {
    format!("city{}", cid.get())
}

/// `buildObjectivePowerForOwner(oldOwner).power` (`main.ts:35672`) na stanie po zmianie właściciela miasta.
fn lost_power_of(state: &PlayableState, owner: i64) -> Result<f64, SiegeBattleError> {
    let (epoch, _) = empire_epoch_for_owner(
        owner,
        &owner_era_facts(state),
        game_start_era(&state.params.epoch_id),
    )
    .map_err(|e| producer(format!("epoka wlasciciela {owner}: {e:?}")))?;
    let raw = power_raw_for_owner(state, owner, epoch).map_err(|e| producer(e.to_string()))?;
    let config = production_config(state).map_err(|e| producer(e.to_string()))?;
    objective_power_for_owner(
        &raw,
        &config.power.coeffs,
        config.power.battle,
        &config.power.military,
    )
    .map_err(|e| producer(format!("moc wlasciciela {owner}: {e:?}")))
}

/// `runCapitalCapturePlunder(city, oldOwner, newOwner)` (`main.ts:36221`) na stanie (D-ZMA-5, D-ZMA-6).
fn capital_plunder(
    state: &mut PlayableState,
    cid: CityId,
    old_owner: i64,
    new_owner: i64,
    designated: &BTreeMap<i64, CityId>,
    out: &mut CityCaptureResultDto,
) -> Result<PlunderReport, SiegeBattleError> {
    let cities: Vec<PlunderCity> = state
        .cities
        .iter()
        .map(|c| PlunderCity {
            id: plunder_id(c.id),
            name: c.name.clone(),
            owner_id: web_owner(owner_i64(c.owner_id)),
            population: f64::from(c.population),
            surowce: BTreeMap::new(),
        })
        .collect();
    let Some(city) = cities.iter().find(|c| c.id == plunder_id(cid)).cloned() else {
        return Err(SiegeBattleError::CityNotFound(cid.get()));
    };
    let elimination = !state
        .cities
        .iter()
        .any(|c| owner_i64(c.owner_id) == old_owner);
    // Kontrakt kolejności `lost_power` (siege_capital_plunder.rs): po zmianie właściciela, przed `eliminateOwner`;
    // potrzebna tylko w gałęzi eliminacji (pin liczy ją wyłącznie tam).
    let lost_power = if elimination {
        lost_power_of(state, old_owner)?
    } else {
        0.0
    };
    let mut pstate = PlunderState {
        capital_city_id_by_owner: designated
            .iter()
            .map(|(o, c)| (web_owner(*o), plunder_id(*c)))
            .collect(),
        ..PlunderState::default()
    };
    let input = PlunderInput {
        city: &city,
        old_owner: web_owner(old_owner),
        new_owner: web_owner(new_owner),
        cities: &cities,
        building_count: state
            .stores
            .buildings_by_city
            .get(&cid.get())
            .map_or(0, Vec::len),
        lost_power,
        triumph_unification: false,
    };
    let treasury_before_new = StateAccess { state: &mut *state }.get_treasury(web_owner(new_owner));
    let techs_before: BTreeSet<String> =
        StateAccess { state: &mut *state }.get_researched_techs(web_owner(new_owner));
    let (ret, ui) = {
        let mut access = StateAccess { state: &mut *state };
        run_capital_capture_plunder(&input, &mut pstate, &mut access, &NoLabels)
    };
    // Obrona r1 (Z1): `recordCityCaptureEvent` / `recordCivElimEvent` wołane wewnątrz `runCapitalCapturePlunder`
    // (karta stolicy/eliminacji ma pierwszeństwo — deduplikacja po id karty) — zapis do `capture_events` w miejscu pinu.
    let report = PlunderReport {
        rows: apply_plunder_event_calls(state, &ui),
        eliminated_civ_label: ret.map(|r| r.eliminated_civ_label),
    };
    let called = |name: &str| ui.iter().any(|c| c["fn"] == name);
    if !called("captureReportOneLine") {
        // Zwykłe miasto (miasto nie było stolicą ofiary): brak łupu.
        return Ok(report);
    }
    out.treasury_taken =
        StateAccess { state: &mut *state }.get_treasury(web_owner(new_owner)) - treasury_before_new;
    out.techs_copied = StateAccess { state: &mut *state }
        .get_researched_techs(web_owner(new_owner))
        .difference(&techs_before)
        .cloned()
        .collect();
    out.not_applied.push("naukaPool".into());
    out.not_applied.push("spichlerz".into());
    let old_capital_now = pstate
        .capital_city_id_by_owner
        .get(&web_owner(old_owner))
        .cloned();
    for c in &mut state.cities {
        if c.id == cid {
            c.is_capital = false;
        } else if owner_i64(c.owner_id) == old_owner {
            c.is_capital = old_capital_now.as_deref() == Some(plunder_id(c.id).as_str());
        }
    }
    if called("eliminateOwner") {
        out.capital_event = Some(CapitalCaptureKind::Eliminacja);
        // Zdobycze Power (`main.ts:35669-35675`) przez akumulator stanu.
        state.power_record_city_capture(new_owner, lost_power, is_barbarian(new_owner));
        if new_owner == HUMAN_OWNER_ID {
            out.not_applied
                .push("shouldShowPlayerTriumphCityStateUnification".into());
        }
        if old_owner != HUMAN_OWNER_ID {
            // ZMA-DL-7 naprawione u źródła (#354 B): `eliminate_owner` kasuje także wpisy `economy.units` jednostek
            // ofiary (pin `disbandOwnerUnits` usuwa obiekt jednostki w całości) — adapter z obrony r1 (N1) zbędny.
            eliminate_owner(state, &mut Vec::new(), old_owner);
            // Adapter (D-ZMA-8): pin `eliminateOwner` kasuje `diplomacyPairMeta` par z właścicielem
            // (`main.ts:35405-35409`, `diploPairKeyHasOwner`); `WarTurnState::clear_eliminated_owner_war_state` dzieli
            // klucz po `_`, a stan zapisuje klucze `min-max` (`war_turn_declare::pair_key`) — wpisy usuwa tu adapter.
            remove_pair_meta_of_owner(state, old_owner);
            out.eliminated_owner_id = u64::try_from(old_owner).ok();
        }
    } else {
        out.capital_event = Some(CapitalCaptureKind::PrzejecieStolicy);
    }
    Ok(report)
}

/// Wynik `runCapitalCapturePlunder` potrzebny w P1: web `capitalCaptureReportSlot.rows` i
/// `captureOutcome?.eliminatedCivLabel`.
struct PlunderReport {
    rows: Option<Vec<CaptureReportRow>>,
    eliminated_civ_label: Option<String>,
}

// ---------------------------------------------------------------------------------------------------------------
// #354 część B (R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1): pola stanu i adaptery kroków P1/P9 pominiętych w części A.
// ---------------------------------------------------------------------------------------------------------------

/// Pola miasta pisane przez web `applyPostCaptureLawOnCapture` (`post-capture-law.ts:62-82`). `rebelPreviousOwnerId`,
/// `rebelProtectionTurnsRemaining` i `revoltGraceRemaining` są przez pin kasowane / zerowane (`null`) przy każdym
/// realnym przejęciu, a stan nie ma ich wcześniej (brak buntów w `PlayableState`), więc nie są tu trzymane.
#[derive(Debug, Clone, Copy, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayablePostCaptureLaw {
    /// Web `city.postCaptureLawTurnsRemaining` (`None` = pole nieobecne).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub post_capture_law_turns_remaining: Option<f64>,
    /// Web `city.wasRebellionReconquest`.
    pub was_rebellion_reconquest: bool,
}

// `PlayableState: Eq` (wzorzec `PlayableReplaceEconomy`): pola f64 stanu są zawsze skończone (zapisy z pinu).
impl Eq for PlayablePostCaptureLaw {}
impl Eq for PlayableCivChronicle {}
impl Eq for PlayableChronicleVs {}
impl Eq for PlayableCityProduction {}
impl Eq for PlayableProductionItem {}

/// Web `CivChronicleVs` (`eliminationSpectacle.ts:28`).
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct PlayableChronicleVs {
    pub k: f64,
    pub l: f64,
    pub b: f64,
}

/// Web `CivChronicle` (`eliminationSpectacle.ts:37`) jako pole stanu (serde); logika w
/// [`crate::domain::siege_transfer_q5`].
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCivChronicle {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub since_turn: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub legacy: Option<bool>,
    pub produced: f64,
    pub lost: f64,
    pub destroyed: f64,
    pub battles: f64,
    pub cities_taken: f64,
    pub cities_lost: f64,
    pub max_cities: f64,
    pub peak_pop: f64,
    pub wonders: f64,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub vs: BTreeMap<i64, PlayableChronicleVs>,
}

impl From<&PlayableCivChronicle> for CivChronicle {
    fn from(c: &PlayableCivChronicle) -> Self {
        CivChronicle {
            since_turn: c.since_turn,
            legacy: c.legacy,
            produced: c.produced,
            lost: c.lost,
            destroyed: c.destroyed,
            battles: c.battles,
            cities_taken: c.cities_taken,
            cities_lost: c.cities_lost,
            max_cities: c.max_cities,
            peak_pop: c.peak_pop,
            wonders: c.wonders,
            vs: c
                .vs
                .iter()
                .map(|(k, v)| {
                    (
                        *k,
                        CivChronicleVs {
                            k: v.k,
                            l: v.l,
                            b: v.b,
                        },
                    )
                })
                .collect(),
        }
    }
}

impl From<&CivChronicle> for PlayableCivChronicle {
    fn from(c: &CivChronicle) -> Self {
        PlayableCivChronicle {
            since_turn: c.since_turn,
            legacy: c.legacy,
            produced: c.produced,
            lost: c.lost,
            destroyed: c.destroyed,
            battles: c.battles,
            cities_taken: c.cities_taken,
            cities_lost: c.cities_lost,
            max_cities: c.max_cities,
            peak_pop: c.peak_pop,
            wonders: c.wonders,
            vs: c
                .vs
                .iter()
                .map(|(k, v)| {
                    (
                        *k,
                        PlayableChronicleVs {
                            k: v.k,
                            l: v.l,
                            b: v.b,
                        },
                    )
                })
                .collect(),
        }
    }
}

/// Web `ProductionItem['kind']`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PlayableProductionKind {
    Budynek,
    Jednostka,
}

/// Web `ProductionItem` jako pole stanu (serde).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableProductionItem {
    pub kind: PlayableProductionKind,
    pub id: String,
    pub nazwa: String,
    pub koszt: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub postep: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_general: Option<bool>,
}

/// Web `CityProduction` jako pole stanu (serde); logika w [`crate::domain::production_queue`].
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCityProduction {
    pub kolejka: Vec<PlayableProductionItem>,
    pub postep: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub wstrzymana: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rekrutacja: Option<Vec<PlayableProductionItem>>,
}

fn item_to_domain(i: &PlayableProductionItem) -> ProductionItem {
    ProductionItem {
        kind: match i.kind {
            PlayableProductionKind::Budynek => ProductionKind::Budynek,
            PlayableProductionKind::Jednostka => ProductionKind::Jednostka,
        },
        id: i.id.clone(),
        nazwa: i.nazwa.clone(),
        koszt: i.koszt,
        postep: i.postep,
        is_general: i.is_general,
    }
}

fn item_from_domain(i: &ProductionItem) -> PlayableProductionItem {
    PlayableProductionItem {
        kind: match i.kind {
            ProductionKind::Budynek => PlayableProductionKind::Budynek,
            ProductionKind::Jednostka => PlayableProductionKind::Jednostka,
        },
        id: i.id.clone(),
        nazwa: i.nazwa.clone(),
        koszt: i.koszt,
        postep: i.postep,
        is_general: i.is_general,
    }
}

impl From<&PlayableCityProduction> for CityProduction {
    fn from(p: &PlayableCityProduction) -> Self {
        CityProduction {
            kolejka: p.kolejka.iter().map(item_to_domain).collect(),
            postep: p.postep,
            wstrzymana: p.wstrzymana,
            rekrutacja: p
                .rekrutacja
                .as_ref()
                .map(|r| r.iter().map(item_to_domain).collect()),
        }
    }
}

impl From<&CityProduction> for PlayableCityProduction {
    fn from(p: &CityProduction) -> Self {
        PlayableCityProduction {
            kolejka: p.kolejka.iter().map(item_from_domain).collect(),
            postep: p.postep,
            wstrzymana: p.wstrzymana,
            rekrutacja: p
                .rekrutacja
                .as_ref()
                .map(|r| r.iter().map(item_from_domain).collect()),
        }
    }
}

/// Web `WONDER_PROD_PREFIX` (`main.ts:4022`).
pub const WONDER_PROD_PREFIX: &str = "__wonder__:";

fn civs_json() -> &'static Value {
    static CIVS: OnceLock<Value> = OnceLock::new();
    CIVS.get_or_init(|| {
        serde_json::from_str(crate::data::civilizations::CIVS_JSON).expect("civs.json must parse")
    })
}

fn buildings_json() -> &'static Value {
    static B: OnceLock<Value> = OnceLock::new();
    B.get_or_init(|| {
        serde_json::from_str(crate::data::buildings_tech::BUILDINGS_JSON)
            .expect("buildings.json must parse")
    })
}

fn civ_row(key: &str) -> Option<&'static Value> {
    let k = key.trim().to_lowercase();
    if k.is_empty() {
        return None;
    }
    civs_json()
        .get("cywilizacje")?
        .as_array()?
        .iter()
        .find(|row| {
            ["ikonaId", "typCywilizacji", "Cywilizacja"]
                .iter()
                .any(|f| {
                    row.get(*f)
                        .and_then(Value::as_str)
                        .is_some_and(|v| v.trim().to_lowercase() == k)
                })
        })
}

/// Web `civKeyForOwnerId` (`main.ts:9813-9834`) dla potrzeb `sameCultureCircle`: klucz cywilizacji gracza stanu
/// (`PlayablePlayer::civilization`) dopasowany do wiersza `civs.json` po `ikonaId`/`Cywilizacja`; wynik = `ikonaId`
/// wiersza, brak wiersza = `''` (pin: nieznany właściciel nie dziedziczy cudzej macierzy).
fn civ_key_for_owner(state: &PlayableState, owner: i64) -> String {
    let Some(p) = state.players.iter().find(|p| owner_i64(p.id) == owner) else {
        return String::new();
    };
    let cand = p.civilization.trim().to_lowercase();
    if cand.is_empty() {
        return String::new();
    }
    let row = civs_json()
        .get("cywilizacje")
        .and_then(Value::as_array)
        .and_then(|list| {
            list.iter().find(|row| {
                ["ikonaId", "Cywilizacja"].iter().any(|f| {
                    row.get(*f)
                        .and_then(Value::as_str)
                        .is_some_and(|v| v.trim().to_lowercase() == cand)
                })
            })
        });
    match row {
        None => String::new(),
        Some(r) => r
            .get("ikonaId")
            .and_then(Value::as_str)
            .map_or_else(|| p.civilization.trim().to_owned(), str::to_owned),
    }
}

/// Web `civTypCywilizacjiKey` (`diplomacy-display.ts:200-210`).
fn civ_typ_key(civ_key: &str) -> String {
    let key = civ_key.trim().to_lowercase();
    match civ_row(&key)
        .and_then(|r| r.get("typCywilizacji"))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|t| !t.is_empty())
    {
        Some(t) => t.to_lowercase(),
        None => key,
    }
}

/// Web `sameCultureCircle(a, b)` (`diplomacy-display.ts:214-220`).
#[must_use]
pub fn same_culture_circle(a: &str, b: &str) -> bool {
    if a.trim().is_empty() || b.trim().is_empty() {
        return false;
    }
    civ_typ_key(a) == civ_typ_key(b)
}

/// Web `ownerReligionForOwnerId` (`main.ts:5535-5537`): religia cywilizacji właściciela (`civReligionForKey` nad
/// kluczem cywilizacji gracza stanu).
fn owner_religion(state: &PlayableState, owner: i64) -> Option<String> {
    let civ = state
        .players
        .iter()
        .find(|p| owner_i64(p.id) == owner)
        .map(|p| p.civilization.clone())?;
    civ_religion_for_key(
        Some(civ.as_str()).filter(|s| !s.is_empty()),
        Some(society_params()),
        Some(civs_json()),
    )
}

/// JS `Math.round` dla wartości skończonych.
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Web `onCityCapturedReligion(state, population, newOwnerReligion, previousOwnerReligion, newOwnerId,
/// previousOwnerId, opts)` (`culture-religion.ts:788-870`). `same_circle` = wynik
/// `sameCultureCircle(civKey(newOwnerId), civKey(previousOwnerId))` (opts zawsze podane w wołaniu `main.ts:36205`).
/// Remis części ułamkowej w metodzie Hamiltona rozstrzyga pin `localeCompare`; tu porównanie bajtowe kluczy (zgodne dla
/// nazw religii z `society-params.json` bez znaków spoza ASCII w pozycji rozstrzygającej — dług ZMB-DL-3).
#[must_use]
#[allow(clippy::too_many_arguments)]
pub fn on_city_captured_religion(
    state: &ReligionState,
    population: f64,
    new_rel: Option<&str>,
    prev_rel: Option<&str>,
    new_owner: Option<i64>,
    prev_owner: Option<i64>,
    same_circle: bool,
) -> ReligionState {
    let (Some(n), Some(p)) = (new_owner, prev_owner) else {
        return state.clone();
    };
    if n == p {
        return state.clone();
    }
    if same_circle {
        return default_city_religion_state(population, new_rel);
    }
    let Some(new_rel) = new_rel.filter(|r| !r.is_empty()) else {
        return state.clone();
    };
    let prev_rel = prev_rel.filter(|r| !r.is_empty());
    let prev_share = religion_own_share(state, prev_rel);
    let new_share = (1.0 - prev_share).clamp(0.0, 1.0);
    let total_existing = total_adherents(state);
    let total = if total_existing > 0.0 {
        total_existing
    } else {
        population.floor().max(0.0)
    };
    if total <= 0.0 {
        return ReligionState::default();
    }
    let new_count = js_round(new_share * total);
    let remaining = total - new_count;
    let mut others: BTreeMap<String, f64> = BTreeMap::new();
    let mut others_total = 0.0;
    for (k, v) in &state.counts {
        if k == new_rel || prev_rel == Some(k.as_str()) {
            continue;
        }
        if v.is_finite() && *v > 0.0 {
            others.insert(k.clone(), *v);
            others_total += *v;
        }
    }
    let mut next: BTreeMap<String, f64> = BTreeMap::new();
    if others_total > 0.0 && remaining > 0.0 {
        let keys: Vec<&String> = others.keys().collect();
        let shares: Vec<f64> = keys
            .iter()
            .map(|k| others[*k] / others_total * remaining)
            .collect();
        let floors: Vec<f64> = shares.iter().map(|s| s.floor()).collect();
        let assigned: f64 = floors.iter().sum();
        let mut leftover = remaining - assigned;
        let mut order: Vec<(usize, f64)> = shares
            .iter()
            .zip(&floors)
            .enumerate()
            .map(|(i, (s, f))| (i, s - f))
            .collect();
        order.sort_by(|a, b| {
            b.1.partial_cmp(&a.1)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| keys[a.0].cmp(keys[b.0]))
        });
        let mut amounts = floors.clone();
        for (i, _) in &order {
            if leftover <= 0.0 {
                break;
            }
            amounts[*i] += 1.0;
            leftover -= 1.0;
        }
        for (i, k) in keys.iter().enumerate() {
            if amounts[i] > 0.0 {
                next.insert((*k).clone(), amounts[i]);
            }
        }
    } else if let Some(prev) = prev_rel.filter(|_| remaining > 0.0) {
        next.insert(prev.to_owned(), remaining);
    } else if prev_rel.is_none() && others_total <= 0.0 && remaining > 0.0 {
        *next.entry(new_rel.to_owned()).or_insert(0.0) += remaining;
    }
    if new_count > 0.0 {
        *next.entry(new_rel.to_owned()).or_insert(0.0) += new_count;
    }
    ReligionState { counts: next }
}

/// Krok `main.ts:36202-36215`: `cityRelig.set(city.id, onCityCapturedReligion(...))` (pominięte dla zdobywcy
/// barbarzyńcy). `population` = ludność PO stracie P9 (pin czyta `city.population` po `applyCityCaptureAfterBattle`).
pub fn apply_capture_religion(
    state: &mut PlayableState,
    cid: CityId,
    old_owner: i64,
    atk_owner: i64,
) {
    if is_barbarian(atk_owner) {
        return;
    }
    let population = state
        .cities
        .iter()
        .find(|c| c.id == cid)
        .map_or(0.0, |c| f64::from(c.population));
    let stored = state
        .stores
        .religion_by_city
        .get(&cid.get())
        .map(|m| ReligionState {
            counts: m.iter().map(|(k, v)| (k.clone(), f64::from(*v))).collect(),
        })
        .unwrap_or_default();
    let same = same_culture_circle(
        &civ_key_for_owner(state, atk_owner),
        &civ_key_for_owner(state, old_owner),
    );
    let next = on_city_captured_religion(
        &stored,
        population,
        owner_religion(state, atk_owner).as_deref(),
        owner_religion(state, old_owner).as_deref(),
        Some(atk_owner),
        Some(old_owner),
        same,
    );
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let counts: BTreeMap<String, u32> = next
        .counts
        .iter()
        .filter(|(_, v)| v.is_finite() && **v >= 0.0)
        .map(|(k, v)| (k.clone(), *v as u32))
        .collect();
    state.stores.religion_by_city.insert(cid.get(), counts);
}

/// `noteCityCapture(civChronicleByOwner, oldOwner, atkOwner, turn)` (`main.ts:36047`) na polu stanu.
pub fn apply_note_city_capture(state: &mut PlayableState, old_owner: i64, atk_owner: i64) {
    let mut map: ChronicleMap = state
        .civ_chronicle_by_owner
        .iter()
        .map(|(k, v)| (i64::try_from(*k).unwrap_or(i64::MAX), CivChronicle::from(v)))
        .collect();
    note_city_capture(&mut map, old_owner, atk_owner, Some(f64::from(state.turn)));
    state.civ_chronicle_by_owner = map
        .iter()
        .filter_map(|(k, v)| Some((u64::try_from(*k).ok()?, PlayableCivChronicle::from(v))))
        .collect();
}

/// P9 `if (!isBarbarian(atkOwner)) applyPostCaptureLawOnCapture(city, atkOwner, prevOwner)` (`post-battle-map.ts:573`).
pub fn apply_capture_law(state: &mut PlayableState, cid: CityId, old_owner: i64, atk_owner: i64) {
    if is_barbarian(atk_owner) {
        return;
    }
    let prev = state.post_capture_law_by_city.get(&cid).copied();
    let mut fields = PostCaptureLawFields {
        post_capture_law_turns_remaining: prev.and_then(|p| p.post_capture_law_turns_remaining),
        was_rebellion_reconquest: prev.is_some_and(|p| p.was_rebellion_reconquest),
        rebel_previous_owner_id: None,
        rebel_protection_turns_remaining: None,
    };
    let mut grace: Option<f64> = None;
    if apply_post_capture_law_on_capture(&mut fields, &mut grace, atk_owner, old_owner).is_some() {
        state.post_capture_law_by_city.insert(
            cid,
            PlayablePostCaptureLaw {
                post_capture_law_turns_remaining: fields.post_capture_law_turns_remaining,
                was_rebellion_reconquest: fields.was_rebellion_reconquest,
            },
        );
    }
}

/// Web `ownerPracaPool`/`setOwnerPracaPool` (`main.ts:34879-34881`, zapis `Math.max(0, v)`) na stanie.
fn add_praca(state: &mut PlayableState, owner: i64, amount: f64) {
    let key = u64::try_from(owner).unwrap_or(u64::MAX);
    let cur = state
        .economy
        .praca_pool_by_owner
        .get(&key)
        .copied()
        .unwrap_or(0.0);
    state
        .economy
        .praca_pool_by_owner
        .insert(key, js_max0(cur + amount));
}

fn is_capital_only_building(item: &ProductionItem) -> bool {
    item.kind == ProductionKind::Budynek
        && buildings_json().as_array().is_some_and(|list| {
            list.iter()
                .find(|b| b.get("id").and_then(Value::as_str) == Some(item.id.as_str()))
                .and_then(|b| b.get("lokalizacja"))
                .and_then(Value::as_str)
                == Some("stolica")
        })
}

/// Web `capitalCityIdForOwner(ownerId)` (`main.ts:34999-35003`) na stanie: jawna stolica (`designated`, sprzed
/// zdobycia — mapa pinu zmienia się dopiero w `runCapitalCapturePlunder`) o ile nadal należy do właściciela, inaczej
/// `oldestCityOfOwner`.
///
/// Celowo NIE używa `city_view::capital_city_id_for_owner` (flaga `is_capital` stanu): w chwili tego kroku zdobyte
/// miasto ma już właściciela `atk`, ale nadal flagę stolicy OFIARY (zdejmuje ją dopiero `runCapitalCapturePlunder`),
/// więc tamta funkcja uznałaby stolicę ofiary za stolicę zdobywcy. Pin czyta `capitalCityIdByOwner` (mapa sprzed
/// zdobycia) = `designated`.
fn capital_city_id_for_owner(
    state: &PlayableState,
    owner: i64,
    designated: &BTreeMap<i64, CityId>,
) -> Option<CityId> {
    if let Some(c) = designated.get(&owner) {
        if state
            .cities
            .iter()
            .any(|x| x.id == *c && owner_i64(x.owner_id) == owner)
        {
            return Some(*c);
        }
    }
    let cities: Vec<PlunderCity> = state
        .cities
        .iter()
        .map(|c| PlunderCity {
            id: plunder_id(c.id),
            name: c.name.clone(),
            owner_id: owner_i64(c.owner_id),
            population: f64::from(c.population),
            surowce: BTreeMap::new(),
        })
        .collect();
    let oldest = oldest_city_of_owner(owner, &cities)?.id.clone();
    state
        .cities
        .iter()
        .find(|c| plunder_id(c.id) == oldest)
        .map(|c| c.id)
}

/// Kolejka produkcji przy zdobyciu (`main.ts:36134-36184`), po zmianie właściciela miasta.
pub fn apply_capture_production(
    state: &mut PlayableState,
    cid: CityId,
    old_owner: i64,
    atk_owner: i64,
    designated: &BTreeMap<i64, CityId>,
    out: &mut CityCaptureResultDto,
) {
    if is_barbarian(atk_owner) {
        state
            .city_prod_by_city
            .insert(cid, PlayableCityProduction::default());
        return;
    }
    let Some(prod) = state.city_prod_by_city.get(&cid).map(CityProduction::from) else {
        return;
    };
    let migrated = sanitize_build_queue(&prod);
    if migrated.refunded_praca > 0.0 {
        add_praca(state, old_owner, migrated.refunded_praca);
    }
    // `sanitizeProductionQueue(atkOwner, migrated.prod)` (`main.ts:5123-5137`).
    let inner = sanitize_build_queue(&migrated.prod);
    if inner.refunded_praca > 0.0 {
        add_praca(state, atk_owner, inner.refunded_praca);
    }
    if inner
        .prod
        .kolejka
        .iter()
        .any(|i| i.id.starts_with(WONDER_PROD_PREFIX))
    {
        // `wonderGateOk` (`main.ts:4176`) nie ma portu: pozycja cudu przechodzi bramkę — jawnie w `not_applied`.
        out.not_applied.push("wonderGateOk".into());
    }
    let gated = filter_queue(&inner.prod, |_| true);
    if gated.forfeited_postep > 0.0 {
        add_praca(state, atk_owner, gated.forfeited_postep);
    }
    let sanitized = gated.prod;
    let is_new_capital = capital_city_id_for_owner(state, atk_owner, designated) == Some(cid);
    let banked: f64 = if is_new_capital {
        0.0
    } else {
        sanitized
            .kolejka
            .iter()
            .skip(1)
            .filter(|i| is_capital_only_building(i))
            .fold(0.0, |acc, i| match i.postep {
                Some(v) if v.is_finite() && v > 0.0 => acc + v,
                _ => acc,
            })
    };
    let (filtered, forfeited) = if is_new_capital {
        (sanitized, 0.0)
    } else {
        let f = filter_queue(&sanitized, |i| !is_capital_only_building(i));
        (f.prod, f.forfeited_postep)
    };
    let total = forfeited + banked;
    if total > 0.0 {
        add_praca(state, atk_owner, total);
    }
    state
        .city_prod_by_city
        .insert(cid, PlayableCityProduction::from(&filtered));
}

/// Konsument haka T8: kroki 1-4 z nagłówka modułu. Wywoływany przez `siege_battle_apply::finish` na kopii stanu
/// (błąd = bitwa `Aborted`, stan bez zmian, D-WIRB-8).
///
/// # Errors
/// [`SiegeBattleError::CityNotFound`], [`SiegeBattleError::Producer`] (AI↔AI D-ZMA-7, właściciel 0 D-ZMA-5, dane mocy,
/// zła meta pary).
#[allow(clippy::too_many_lines)]
pub fn apply_storm_capture(
    state: &mut PlayableState,
    battle: &ApplyRosters<'_>,
    req: &CityCaptureRequested,
) -> Result<CityCaptureResultDto, SiegeBattleError> {
    let cid = CityId::new(req.city_id);
    // Krok 1: wejście na heks miasta (`post-battle-map.ts:445-448`).
    let entry = enter_city_hex_after_atk_win(state, battle)?;
    let city = state
        .cities
        .iter()
        .find(|c| c.id == cid)
        .ok_or(SiegeBattleError::CityNotFound(req.city_id))?
        .clone();
    let hex = (i32::from(city.position.x()), i32::from(city.position.y()));
    let old_owner = owner_i64(city.owner_id);
    let atk_owner = i64::try_from(req.attacker_owner_id).unwrap_or(i64::MAX);
    let mut out = CityCaptureResultDto {
        captured: false,
        skipped: None,
        old_owner_id: city.owner_id.get(),
        new_owner_id: req.attacker_owner_id,
        removed_unit_ids: entry.removed.clone(),
        entered_unit_ids: entry.moved.clone(),
        population_before: city.population,
        population_after: city.population,
        wonders_transferred: Vec::new(),
        capital_event: None,
        eliminated_owner_id: None,
        treasury_taken: 0.0,
        techs_copied: Vec::new(),
        siege_ended: false,
        not_applied: Vec::new(),
    };
    // Krok 2: bramka zdobycia (`main.ts:34661-34677`).
    let units: Vec<(i64, i32, i32)> = state
        .units
        .iter()
        .map(|u| {
            (
                owner_i64(u.owner_id),
                i32::from(u.position.x()),
                i32::from(u.position.y()),
            )
        })
        .collect();
    let skip = if is_city_capture_blocked_by_defenders(atk_owner, &units, hex.0, hex.1) {
        Some(CaptureSkipReason::BlockedByDefenders)
    } else if old_owner == atk_owner {
        Some(CaptureSkipReason::SameOwner)
    } else if !at_war(state, atk_owner, old_owner) {
        Some(CaptureSkipReason::NotEnemies)
    } else {
        None
    };
    if let Some(reason) = skip {
        out.skipped = Some(reason);
        // Krok 4 (`validateActiveSieges`) na stanie po wejściu na heks.
        out.siege_ended = validate_storm_siege(state, cid, atk_owner);
        return Ok(out);
    }
    // D-ZMA-5 / D-ZMA-7: warunki wstępne przed jakąkolwiek zmianą miasta.
    if old_owner == 0 || atk_owner == 0 {
        return Err(producer(
            "zdobycie: wlasciciel 0 niejednoznaczny wobec id webu (D-ZMA-5)",
        ));
    }
    if old_owner != HUMAN_OWNER_ID && atk_owner != HUMAN_OWNER_ID {
        return Err(producer(
            "zdobycie AI-AI: maybeResolveRegularWarOnCityCapture z auto-pokojem nieportowane (D-ZMA-7)",
        ));
    }
    // D-ZMA-6: wyznaczone stolice PRZED zdobyciem (`capitalCityIdByOwner`).
    let designated: BTreeMap<i64, CityId> = state
        .cities
        .iter()
        .filter(|c| c.is_capital)
        .map(|c| (owner_i64(c.owner_id), c.id))
        .collect();

    // Krok 3: `applyCityCaptureToMap` (P1).
    out.not_applied
        .extend(NOT_APPLIED_ALWAYS.iter().map(|s| (*s).to_owned()));
    // `noteCityCapture` (`main.ts:36047`, pierwszy krok P1).
    apply_note_city_capture(state, old_owner, atk_owner);
    let wonder_before = wonder_snapshot(state);
    // P9 `applyCityCaptureAfterBattle` (`post-battle-map.ts:493-596`).
    let loss = apply_capture_population_loss(
        f64::from(city.population),
        &CapturePopLossInput {
            prev_owner: old_owner,
            new_owner: atk_owner,
            rebel_prev_owner_snapshot: None,
            captured_from_owner_id: state
                .captured_from_owner_by_city
                .get(&cid)
                .map(|p| owner_i64(*p)),
            founded_by: None,
            found_by_owner: None,
            capture_pop_loss: CAPTURE_POP_LOSS_PIN,
        },
    );
    // `population` stanu jest całkowite; strata = całkowity parametr pinu, wynik >= 1.
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let pop_after = loss.population.max(0.0) as u32;
    state.captured_from_owner_by_city.insert(cid, city.owner_id);
    // `units.splice`: jednostki starego właściciela na heksie miasta.
    let mut i = state.units.len();
    while i > 0 {
        i -= 1;
        let u = &state.units[i];
        if u.owner_id == city.owner_id
            && i32::from(u.position.x()) == hex.0
            && i32::from(u.position.y()) == hex.1
        {
            let uid = u.id.get();
            state.units.remove(i);
            state.economy.units.remove(&uid);
            out.removed_unit_ids.push(uid);
        }
    }
    // Garnizon: kotwica i jednostki ze stosu kotwicy wchodzą do miasta; punkt ruchu (bez cywilów poza kotwicą).
    let anchor_id = req.anchor_unit_id.to_string();
    let anchor_pos = state
        .units
        .iter()
        .find(|u| u.id.get() == req.anchor_unit_id)
        .map(|u| u.position);
    for r in battle.atk_roster {
        let Some(idx) =
            r.id.parse::<u64>()
                .ok()
                .and_then(|n| state.units.iter().position(|u| u.id.get() == n))
        else {
            continue;
        };
        let is_anchor = r.id == anchor_id;
        let civilian = is_civilian_unit(&r.category, &r.type_id);
        let co_stacked = anchor_pos == Some(state.units[idx].position);
        if !civilian && (is_anchor || co_stacked) {
            #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
            {
                state.units[idx].position = PositionDto::new(hex.0 as u16, hex.1 as u16);
            }
            let uid = state.units[idx].id.get();
            if !out.entered_unit_ids.contains(&uid) {
                out.entered_unit_ids.push(uid);
            }
        }
        if civilian && !is_anchor {
            continue;
        }
        let left = f64::from(state.units[idx].movement);
        state.units[idx].movement = MovementPoints::new((left - 1.0).max(0.0));
    }
    // P9 `applyPostCaptureLawOnCapture` przed zmianą właściciela (`post-battle-map.ts:573`).
    apply_capture_law(state, cid, old_owner, atk_owner);
    let atk_pid = PlayerId::new(req.attacker_owner_id);
    if let Some(c) = state.cities.iter_mut().find(|c| c.id == cid) {
        c.owner_id = atk_pid;
        c.population = pop_after;
    }
    state.oblegane.remove(&cid);
    out.population_after = pop_after;
    // `settleWonderTransfer`.
    out.wonders_transferred = settle_wonders(state, wonder_before.as_ref());
    // `maybeResolveRegularWarOnCityCapture`: gracz po którejkolwiek stronie = no-op (Q3 pinu).
    record_war_city_loss_for_pair(state, old_owner, atk_owner)?;
    // Kolejka produkcji (`main.ts:36134-36184`) i religia miasta (`main.ts:36202-36215`).
    apply_capture_production(state, cid, old_owner, atk_owner, &designated, &mut out);
    apply_capture_religion(state, cid, old_owner, atk_owner);
    state.record_ever_owned_city(atk_pid);
    end_map_siege(state, cid);
    out.siege_ended = true;
    let plunder = capital_plunder(state, cid, old_owner, atk_owner, &designated, &mut out)?;
    // `main.ts:36222-36258`: wiersze raportu (stolica: `capitalReport.rows`, inaczej `buildCityCaptureReportRows`
    // `kind:'zwykle'`) + wiersz straty ludności, potem `recordCityCaptureEvent` (no-op, gdy karta stolicy/eliminacji
    // z tej tury już istnieje).
    let rows_base: Vec<CaptureRow> = match plunder.rows {
        Some(rows) => rows.into_iter().map(|r| r.row).collect(),
        None => build_city_capture_report_rows(&CityCaptureReportInput {
            kind: "zwykle".to_owned(),
            moc_etykieta: moc_label(),
            ludnosc: f64::from(pop_after).floor().max(0.0),
            budynki: state
                .stores
                .buildings_by_city
                .get(&cid.get())
                .map_or(0, Vec::len) as f64,
            zloto: 0.0,
            nauka: 0.0,
            technologie: 0.0,
            moc: 0.0,
            barbarzynca_zdobywca: false,
            // Web `city.surowce` = magazyn miasta w stanie (`economy.city_stock`); brak wpisu = `undefined`.
            surowce: state
                .economy
                .city_stock
                .get(&cid.get())
                .map(|m| m.iter().map(|(k, v)| (k.clone(), *v)).collect()),
            zywnosc_przejeta: None,
            zywnosc_utracona: None,
            zywnosc_ofiary_razem: None,
            praca_pool_przejeta: 0.0,
        })
        .into_iter()
        .map(|r| r.row)
        .collect(),
    };
    let mut report_rows = rows_base;
    if let Some(r) =
        capture_pop_loss_report_row((f64::from(city.population) - f64::from(pop_after)).max(0.0))
    {
        report_rows.push(r);
    }
    let city_id_web = plunder_id(cid);
    let victim = NoLabels.civ_label(web_owner(old_owner));
    let captor = NoLabels.civ_label(web_owner(atk_owner));
    apply_record_city_capture_event(
        state,
        &CityCaptureArgs {
            city_id: &city_id_web,
            city_name: &city.name,
            old_owner: web_owner(old_owner),
            new_owner: web_owner(atk_owner),
            rows: &report_rows,
            victim_label: &victim,
            captor_label: &captor,
            eliminated_civ_label: plunder.eliminated_civ_label.as_deref(),
        },
    );
    out.captured = true;
    // Krok 4: `validateActiveSieges` na stanie po zdobyciu (miasto zdobyte nie jest już oblegane).
    validate_storm_siege(state, cid, atk_owner);
    Ok(out)
}

// ---------------------------------------------------------------------------------------------------------------
// #354 część B, obrona r1 (Z1): `recordCityCaptureEvent` (karta zdobycia) z wierszami raportu
// (`buildCityCaptureReportRows`, `capturePopLossReportRow`) na polu stanu `capture_events`.
// ---------------------------------------------------------------------------------------------------------------

/// Web `mocLabel()` (`ui/power-labels.ts:18`): `loadPowerOpcje().hudEtykietaPl || 'Moc'`, gdzie `hudEtykietaPl` =
/// `readStr(opcje.hud_etykieta.wartosc, 'Moc')` (`game/power-options.ts:36-46`) nad `power-params.json`.
#[must_use]
pub fn moc_label() -> String {
    static LABEL: OnceLock<String> = OnceLock::new();
    LABEL
        .get_or_init(|| {
            let v: Value = serde_json::from_str(crate::data::units_combat::POWER_PARAMS_JSON)
                .expect("power-params.json must parse");
            v.get("opcje")
                .and_then(|o| o.get("hud_etykieta"))
                .and_then(|o| o.get("wartosc"))
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .unwrap_or("Moc")
                .to_owned()
        })
        .clone()
}

/// JS `String(n)` / `'+' + n` dla liczb wierszy raportu (całkowite bez części ułamkowej, `-0` → `0`). Dla wartości
/// niecałkowitych `Display` Rust daje najkrótszy zapis jak JS w zakresie wartości gry (bez notacji wykładniczej:
/// |v| >= 1e21 lub < 1e-6 NIE_ZMIERZONO — nieosiągalne dla liczb raportu).
#[must_use]
pub fn js_number_string(v: f64) -> String {
    if v.is_nan() {
        return "NaN".to_owned();
    }
    if v.is_infinite() {
        return if v > 0.0 { "Infinity" } else { "-Infinity" }.to_owned();
    }
    if v == 0.0 {
        return "0".to_owned();
    }
    if v.fract() == 0.0 {
        return format!("{v:.0}");
    }
    format!("{v}")
}

/// Web `CityCaptureReportInput` (`main.ts:1730-1786`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CityCaptureReportInput {
    /// `'zwykle' | 'stolica' | 'eliminacja'`.
    pub kind: String,
    pub moc_etykieta: String,
    pub ludnosc: f64,
    pub budynki: f64,
    pub zloto: f64,
    pub nauka: f64,
    pub technologie: f64,
    pub moc: f64,
    pub barbarzynca_zdobywca: bool,
    /// Web `surowce?: Record<string, number>` w kolejności kluczy obiektu (`None` = pole nieobecne).
    pub surowce: Option<Vec<(String, f64)>>,
    pub zywnosc_przejeta: Option<f64>,
    pub zywnosc_utracona: Option<f64>,
    pub zywnosc_ofiary_razem: Option<f64>,
    pub praca_pool_przejeta: f64,
}

impl CityCaptureReportInput {
    /// Wejście z obiektu argumentów (kształt pinu; tak zapisuje go `run_capital_capture_plunder` w `ui_calls`).
    /// Liczby: brak / nie-liczba = 0 (pola wymagane w TS), pola opcjonalne `None`.
    #[must_use]
    pub fn from_json(v: &Value) -> Self {
        let num = |k: &str| v.get(k).and_then(Value::as_f64).unwrap_or(0.0);
        let opt = |k: &str| v.get(k).and_then(Value::as_f64);
        let text = |k: &str| v.get(k).and_then(Value::as_str).unwrap_or("").to_owned();
        CityCaptureReportInput {
            kind: text("kind"),
            moc_etykieta: text("mocEtykieta"),
            ludnosc: num("ludnosc"),
            budynki: num("budynki"),
            zloto: num("zloto"),
            nauka: num("nauka"),
            technologie: num("technologie"),
            moc: num("moc"),
            barbarzynca_zdobywca: v.get("barbarzyncaZdobywca") == Some(&Value::Bool(true)),
            surowce: v.get("surowce").and_then(Value::as_object).map(|m| {
                m.iter()
                    .map(|(k, x)| (k.clone(), x.as_f64().unwrap_or(0.0)))
                    .collect()
            }),
            zywnosc_przejeta: opt("zywnoscPrzejeta"),
            zywnosc_utracona: opt("zywnoscUtracona"),
            zywnosc_ofiary_razem: opt("zywnoscOfiaryRazem"),
            praca_pool_przejeta: num("pracaPoolPrzejeta"),
        }
    }
}

/// Wiersz raportu z polem `collapsible` (web `CaptureReportRow.collapsible`, wskazówka renderu modalu dla wierszy
/// surowców). Magazyn kart ([`CaptureEventStore`]) trzyma [`CaptureRow`] bez tej wskazówki (D-ZMB-8).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureReportRow {
    pub row: CaptureRow,
    pub collapsible: bool,
}

fn report_row(label: &str, value: String, tone: &str, group: &str) -> CaptureReportRow {
    CaptureReportRow {
        row: CaptureRow {
            label: label.to_owned(),
            value,
            tone: Some(tone.to_owned()),
            group: Some(group.to_owned()),
        },
        collapsible: false,
    }
}

fn plus(v: f64) -> String {
    format!("+{}", js_number_string(v))
}

/// Web `buildCityCaptureReportRows(input)` (`main.ts:1802-1886`), linia w linię.
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_city_capture_report_rows(input: &CityCaptureReportInput) -> Vec<CaptureReportRow> {
    let mut rows: Vec<CaptureReportRow> = Vec::new();
    // 1. Co przejęliśmy.
    if input.ludnosc > 0.0 {
        rows.push(report_row(
            "Ludność",
            plus(input.ludnosc),
            "gain",
            "przejete",
        ));
    }
    if input.budynki > 0.0 {
        rows.push(report_row(
            "Budynki",
            plus(input.budynki),
            "gain",
            "przejete",
        ));
    }
    if let Some(surowce) = &input.surowce {
        let mut seen: BTreeSet<String> = BTreeSet::new();
        let get = |key: &str| {
            surowce
                .iter()
                .find(|(k, _)| k == key)
                .map_or(0.0, |(_, v)| *v)
        };
        let mut push = |key: &str, value: f64, rows: &mut Vec<CaptureReportRow>| {
            if seen.contains(key) || !(value > 0.0) {
                return;
            }
            seen.insert(key.to_owned());
            let mut r = report_row(
                &crate::domain::building_costs::p6_7b::stock_resource_label(key),
                plus(value.floor()),
                "gain",
                "przejete",
            );
            r.collapsible = true;
            rows.push(r);
        };
        for key in crate::domain::building_costs::p6_7b::empire_stock_resource_keys() {
            push(key, get(key), &mut rows);
        }
        for (key, _) in surowce {
            push(key, get(key), &mut rows);
        }
    }
    // 2. Łup.
    let mut lup: Vec<CaptureReportRow> = Vec::new();
    if !input.barbarzynca_zdobywca {
        if input.zloto > 0.0 {
            lup.push(report_row(
                "Złoto ze skarbca",
                plus(input.zloto),
                "gain",
                "lup",
            ));
        }
        if input.kind == "eliminacja" && input.zywnosc_przejeta.unwrap_or(0.0) > 0.0 {
            let przejeta = input.zywnosc_przejeta.unwrap_or(0.0);
            let razem = input.zywnosc_ofiary_razem.unwrap_or(przejeta);
            let suffix = if input.zywnosc_utracona.unwrap_or(0.0) > 0.0 {
                format!(
                    " — przejęto {} z {} (limit pojemności)",
                    js_number_string(przejeta),
                    js_number_string(razem)
                )
            } else {
                String::new()
            };
            lup.push(report_row(
                "Żywność ze spichlerza",
                format!("{}{suffix}", plus(przejeta)),
                "gain",
                "lup",
            ));
        }
        if input.nauka > 0.0 {
            lup.push(report_row("Punkty nauki", plus(input.nauka), "gain", "lup"));
        }
        if input.technologie > 0.0 {
            lup.push(report_row(
                "Technologie",
                plus(input.technologie),
                "gain",
                "lup",
            ));
        }
        if input.moc > 0.0 {
            lup.push(report_row(
                &input.moc_etykieta,
                plus(input.moc),
                "gain",
                "lup",
            ));
        }
    }
    let lup_empty = lup.is_empty();
    rows.extend(lup);
    // 3. Co przepadło.
    if input.barbarzynca_zdobywca {
        rows.push(report_row(
            "Łup",
            "przepadł — barbarzyńcy nie dziedziczą zdobyczy".to_owned(),
            "loss",
            "lup",
        ));
    } else if lup_empty {
        rows.push(report_row("Łup", "brak".to_owned(), "info", "lup"));
    }
    if input.kind == "eliminacja" {
        if input.barbarzynca_zdobywca {
            if input.praca_pool_przejeta > 0.0 {
                rows.push(report_row(
                    "Pula pracy",
                    "przepadła — barbarzyńcy nie dziedziczą zdobyczy".to_owned(),
                    "loss",
                    "strata",
                ));
            }
        } else if input.praca_pool_przejeta > 0.0 {
            rows.push(report_row(
                "Pula pracy",
                format!(
                    "{} — przejęta od wyeliminowanej cywilizacji",
                    plus(input.praca_pool_przejeta)
                ),
                "gain",
                "strata",
            ));
        }
    } else if input.kind == "stolica" {
        rows.push(report_row(
            "Pula pracy",
            "przepadła — nie przechodzi na zdobywcę".to_owned(),
            "loss",
            "strata",
        ));
    }
    rows
}

/// Web `capturePopLossReportRow(loss)` (`cities.ts:1255-1260`): „Ludność: −N (straty zdobycia)”, `None` gdy brak
/// straty.
#[must_use]
pub fn capture_pop_loss_report_row(loss: f64) -> Option<CaptureRow> {
    if !(loss > 0.0) {
        return None;
    }
    Some(CaptureRow {
        label: "Ludność".to_owned(),
        value: format!(
            "\u{2212}{} (straty zdobycia)",
            js_number_string(loss.floor())
        ),
        tone: Some("loss".to_owned()),
        group: Some("strata".to_owned()),
    })
}

/// Web `CaptureReportRow` jako pole stanu (serde). `collapsible` pominięte (D-ZMB-8).
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct PlayableCaptureRow {
    pub label: String,
    pub value: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tone: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
}

/// Web `SidePanelEvent` z `warEventLog` (pola zapisywane przez rejestratory zdobycia/eliminacji).
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableSidePanelEvent {
    pub id: String,
    pub icon: String,
    pub title: String,
    pub subtitle: String,
    pub kind: String,
    pub negative: bool,
    pub turn_created: i64,
}

/// Web `cityCaptureEventDetails` (wartość) bez `spectacle` (granica Q7).
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCityCaptureDetails {
    pub title: String,
    pub city_name: String,
    pub subtitle: String,
    pub rows: Vec<PlayableCaptureRow>,
    pub rows_title: String,
}

/// Web `civElimEventDetails` (wartość).
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCivElimDetails {
    pub civ_label: String,
    pub details: String,
    pub cause: String,
}

/// Pole stanu: web `warEventLog` + `cityCaptureEventDetails` + `civElimEventDetails`. Pisane wyłącznie przez
/// [`CaptureEventStore`] (konwersja tam i z powrotem); `hud_refreshes` (`refreshD1bHud`) to efekt UI, nie stan.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayableCaptureEvents {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub war_event_log: Vec<PlayableSidePanelEvent>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub city_capture_details: BTreeMap<String, PlayableCityCaptureDetails>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub civ_elim_details: BTreeMap<String, PlayableCivElimDetails>,
}

fn row_to_state(r: &CaptureRow) -> PlayableCaptureRow {
    PlayableCaptureRow {
        label: r.label.clone(),
        value: r.value.clone(),
        tone: r.tone.clone(),
        group: r.group.clone(),
    }
}

fn row_from_state(r: &PlayableCaptureRow) -> CaptureRow {
    CaptureRow {
        label: r.label.clone(),
        value: r.value.clone(),
        tone: r.tone.clone(),
        group: r.group.clone(),
    }
}

impl PlayableCaptureEvents {
    #[must_use]
    pub fn is_default(&self) -> bool {
        *self == Self::default()
    }

    /// Magazyn logiki Q7 nad polem stanu; `turn` = web `turn` (tura stanu).
    #[must_use]
    pub fn to_store(&self, turn: i64) -> CaptureEventStore {
        CaptureEventStore {
            turn,
            war_event_log: self
                .war_event_log
                .iter()
                .map(|e| SidePanelEvent {
                    id: e.id.clone(),
                    icon: e.icon.clone(),
                    title: e.title.clone(),
                    subtitle: e.subtitle.clone(),
                    kind: e.kind.clone(),
                    negative: e.negative,
                    turn_created: e.turn_created,
                })
                .collect(),
            civ_elim_details: self
                .civ_elim_details
                .iter()
                .map(|(k, d)| {
                    (
                        k.clone(),
                        CivElimDetails {
                            civ_label: d.civ_label.clone(),
                            details: d.details.clone(),
                            cause: d.cause.clone(),
                        },
                    )
                })
                .collect(),
            city_capture_details: self
                .city_capture_details
                .iter()
                .map(|(k, d)| {
                    (
                        k.clone(),
                        CityCaptureDetails {
                            title: d.title.clone(),
                            city_name: d.city_name.clone(),
                            subtitle: d.subtitle.clone(),
                            rows: d.rows.iter().map(row_from_state).collect(),
                            rows_title: d.rows_title.clone(),
                        },
                    )
                })
                .collect(),
            hud_refreshes: 0,
        }
    }

    #[must_use]
    pub fn from_store(s: &CaptureEventStore) -> Self {
        PlayableCaptureEvents {
            war_event_log: s
                .war_event_log
                .iter()
                .map(|e| PlayableSidePanelEvent {
                    id: e.id.clone(),
                    icon: e.icon.clone(),
                    title: e.title.clone(),
                    subtitle: e.subtitle.clone(),
                    kind: e.kind.clone(),
                    negative: e.negative,
                    turn_created: e.turn_created,
                })
                .collect(),
            city_capture_details: s
                .city_capture_details
                .iter()
                .map(|(k, d)| {
                    (
                        k.clone(),
                        PlayableCityCaptureDetails {
                            title: d.title.clone(),
                            city_name: d.city_name.clone(),
                            subtitle: d.subtitle.clone(),
                            rows: d.rows.iter().map(row_to_state).collect(),
                            rows_title: d.rows_title.clone(),
                        },
                    )
                })
                .collect(),
            civ_elim_details: s
                .civ_elim_details
                .iter()
                .map(|(k, d)| {
                    (
                        k.clone(),
                        PlayableCivElimDetails {
                            civ_label: d.civ_label.clone(),
                            details: d.details.clone(),
                            cause: d.cause.clone(),
                        },
                    )
                })
                .collect(),
        }
    }
}

/// Web `recordCityCaptureEvent(args)` (`main.ts:10650`) na polu stanu `capture_events` (tura = `state.turn`).
/// Id właścicieli i miasta w kształcie pinu (gracz = 0, `city<N>`, D-ZMA-5).
pub fn apply_record_city_capture_event(state: &mut PlayableState, args: &CityCaptureArgs<'_>) {
    let mut store = state.capture_events.to_store(i64::from(state.turn));
    store.record_city_capture_event(args);
    state.capture_events = PlayableCaptureEvents::from_store(&store);
}

/// Web `recordCivElimEvent(csOwnerId, civLabel, details, cause)` (`main.ts:10583`) na polu stanu.
pub fn apply_record_civ_elim_event(
    state: &mut PlayableState,
    cs_owner_id: i64,
    civ_label: &str,
    details: &str,
    cause: Option<&str>,
) {
    let mut store = state.capture_events.to_store(i64::from(state.turn));
    store.record_civ_elim_event(cs_owner_id, civ_label, details, cause);
    state.capture_events = PlayableCaptureEvents::from_store(&store);
}

/// Wykonuje na stanie efekty zdarzeń zapisane przez `run_capital_capture_plunder` w `ui_calls`, w kolejności pinu:
/// `recordCityCaptureEvent` (wiersze = `buildCityCaptureReportRows` z poprzedzającego wywołania) i
/// `recordCivElimEvent`. Zwraca wiersze raportu stolicy/eliminacji (web `capitalCaptureReportSlot.rows`).
fn apply_plunder_event_calls(
    state: &mut PlayableState,
    ui: &[Value],
) -> Option<Vec<CaptureReportRow>> {
    let mut last_rows: Option<Vec<CaptureReportRow>> = None;
    for call in ui {
        let args = call["args"].as_array().cloned().unwrap_or_default();
        match call["fn"].as_str() {
            Some("buildCityCaptureReportRows") => {
                if let Some(a) = args.first() {
                    last_rows = Some(build_city_capture_report_rows(
                        &CityCaptureReportInput::from_json(a),
                    ));
                }
            }
            Some("recordCityCaptureEventX") => {
                let Some(a) = args.first() else { continue };
                let rows: Vec<CaptureRow> = last_rows
                    .as_ref()
                    .map(|r| r.iter().map(|x| x.row.clone()).collect())
                    .unwrap_or_default();
                let s = |k: &str| a.get(k).and_then(Value::as_str).unwrap_or("").to_owned();
                let (city_id, city_name, victim, captor) = (
                    s("cityId"),
                    s("cityName"),
                    s("victimLabel"),
                    s("captorLabel"),
                );
                apply_record_city_capture_event(
                    state,
                    &CityCaptureArgs {
                        city_id: &city_id,
                        city_name: &city_name,
                        old_owner: a["oldOwner"].as_i64().unwrap_or(0),
                        new_owner: a["newOwner"].as_i64().unwrap_or(0),
                        rows: &rows,
                        victim_label: &victim,
                        captor_label: &captor,
                        eliminated_civ_label: a.get("eliminatedCivLabel").and_then(Value::as_str),
                    },
                );
            }
            Some("recordCivElimEvent") => {
                let cs = args.first().and_then(Value::as_i64).unwrap_or(0);
                let label = args.get(1).and_then(Value::as_str).unwrap_or("");
                let details = args.get(2).and_then(Value::as_str).unwrap_or("");
                let cause = args.get(3).and_then(Value::as_str);
                apply_record_civ_elim_event(state, cs, label, details, cause);
            }
            _ => {}
        }
    }
    last_rows
}
