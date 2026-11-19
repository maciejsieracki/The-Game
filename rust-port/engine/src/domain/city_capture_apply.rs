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

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

use crate::domain::brake_power::objective_power_for_owner;
use crate::domain::diplomacy::RelationStatus;
use crate::domain::diplomacy_war_peace_profile::{record_war_city_loss, WarCityRecord};
use crate::domain::eliminacja::eliminate_owner;
use crate::domain::fort_territory::{fort_territory_nodes, OrderedFortNode};
use crate::domain::playable::{MovementPoints, PlayableFortKind, PlayableState};
use crate::domain::siege_battle_adapter::is_civilian_unit;
use crate::domain::siege_battle_apply::{
    end_map_siege, enter_city_hex_after_atk_win, validate_storm_siege, ApplyRosters,
    CityCaptureRequested, SiegeBattleError,
};
use crate::domain::siege_capital_plunder::{
    is_barbarian, js_max0, run_capital_capture_plunder, OwnerResourceAccess, PlunderCity,
    PlunderInput, PlunderLabels, PlunderState,
};
use crate::domain::siege_transfer_effects::{
    apply_capture_population_loss, CapturePopLossInput, CAPTURE_POP_LOSS_PIN,
};
use crate::domain::siege_wonder_watch::{
    apply_wonder_transfers, plan_wonder_transfers, snapshot_wonder_territory_owners,
    TransferableWonder, WonderTerritorySnapshot,
};
use crate::domain::terrain::{CityNode, FortImprovementType, FortNode};
use crate::domain::territory::{territory_owner_at, TerritoryNode};
use crate::domain::turn_war_epoch::{empire_epoch_for_owner, game_start_era, owner_era_facts};
use crate::domain::turn_war_inputs::{
    power_raw_for_owner, production_config, HUMAN_OWNER_ID, KEY_PAIR_META,
};
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
        "NOT_APPLIED: civChronicleByOwner brak w stanie",
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
        "NOT_APPLIED: pola Prawa/rebelii brak w stanie",
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
    ("sanitizeBuildQueue", "NOT_APPLIED: cityProd brak w stanie"),
    (
        "sanitizeProductionQueue",
        "NOT_APPLIED: cityProd brak w stanie",
    ),
    (
        "onCityCapturedReligion",
        "NOT_APPLIED: brak portu (dlug ZMA-DL-1)",
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
    ("buildCityCaptureReportRows", "NOT_APPLIED: UI"),
    (
        "recordCityCaptureEvent",
        "NOT_APPLIED: CaptureEventStore brak w stanie",
    ),
    (
        "validateActiveSieges",
        "siege_battle_apply::validate_storm_siege",
    ),
    ("isBarbarian", "siege_capital_plunder::is_barbarian"),
    ("filterQueue", "NOT_APPLIED: cityProd brak w stanie"),
    (
        "isCapitalOnlyBuildingCapture",
        "NOT_APPLIED: cityProd brak w stanie",
    ),
    (
        "capitalCityIdForOwner",
        "NOT_APPLIED: cityProd brak w stanie (filtr budynkow stolicy)",
    ),
    (
        "ownerPracaPool",
        "NOT_APPLIED: zwrot Pracy z kolejki (cityProd brak w stanie)",
    ),
    (
        "setOwnerPracaPool",
        "NOT_APPLIED: zwrot Pracy z kolejki (cityProd brak w stanie)",
    ),
    (
        "ownerReligionForOwnerId",
        "NOT_APPLIED: brak portu onCityCapturedReligion (dlug ZMA-DL-1)",
    ),
    ("markCityStateDirty", "NOT_APPLIED: UI"),
    ("mocLabel", "NOT_APPLIED: UI"),
    ("civLabelForOwner", "NOT_APPLIED: UI"),
    ("capturePopLossReportRow", "NOT_APPLIED: UI"),
];

/// Kroki pinu pomijane przy każdym zdobyciu (brak pola w stanie, D-ZMA-4).
pub const NOT_APPLIED_ALWAYS: &[&str] = &[
    "noteCityCapture",
    "inGarnizon/oblegaCityId",
    "applyPostCaptureLawOnCapture",
    "foundedByOwner",
    "rebelState",
    "seedCityOwnerDefaults",
    "applyLiveSafeRationForCity",
    "clearCityStateFlagOnCapture",
    "onCityCapturedCulture",
    "triggerRebelProtectionWarConsequence",
    "cityProd",
    "onCityCapturedReligion",
    "syncCityGarnizon",
    "recordCityCaptureEvent",
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

/// Etykiety UI (`civLabelForOwner`, `mocLabel`, …): poza domeną; wynik trafia wyłącznie do `ui_calls`.
struct NoLabels;

impl PlunderLabels for NoLabels {
    fn civ_label(&self, owner_id: i64) -> String {
        format!("owner{owner_id}")
    }
    fn moc_label(&self) -> String {
        String::new()
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
) -> Result<(), SiegeBattleError> {
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
    let (_ret, ui) = {
        let mut access = StateAccess { state: &mut *state };
        run_capital_capture_plunder(&input, &mut pstate, &mut access, &NoLabels)
    };
    let called = |name: &str| ui.iter().any(|c| c["fn"] == name);
    if !called("captureReportOneLine") {
        // Zwykłe miasto (miasto nie było stolicą ofiary): brak łupu.
        return Ok(());
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
            
            // Adapter (D-ZMA-8): pin `eliminateOwner` kasuje `diplomacyPairMeta` par z właścicielem
            // (`main.ts:35405-35409`, `diploPairKeyHasOwner`); `WarTurnState::clear_eliminated_owner_war_state` dzieli
            // klucz po `_`, a stan zapisuje klucze `min-max` (`war_turn_declare::pair_key`) — wpisy usuwa tu adapter.
            remove_pair_meta_of_owner(state, old_owner);
            out.eliminated_owner_id = u64::try_from(old_owner).ok();
        }
    } else {
        out.capital_event = Some(CapitalCaptureKind::PrzejecieStolicy);
    }
    Ok(())
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
    state.record_ever_owned_city(atk_pid);
    end_map_siege(state, cid);
    out.siege_ended = true;
    capital_plunder(state, cid, old_owner, atk_owner, &designated, &mut out)?;
    out.captured = true;
    // Krok 4: `validateActiveSieges` na stanie po zdobyciu (miasto zdobyte nie jest już oblegane).
    validate_storm_siege(state, cid, atk_owner);
    Ok(out)
}
