//! R-RUSTPORT-P6-KAPITULACJA-Q1 (W3/W4/W5): kapitulacja głodowa oblężenia w produkcyjnym ticku tury.
//!
//! Wektory: `p6_kapitulacja_gen.mjs` (wykonanie tekstu pinu `07d2fbd72`: blok N3 `main.ts:38814-38878`,
//! `handleSiegeCapitulationPhase`, `resolveSiegeSurrender`, `endMapSiege`, `besiegerOwnerForCity`, `areEnemyOwners`,
//! `applyCapturePopulationLoss`, moduły `siege-starvation`, `army-starvation`, `siege-enter-city`, `post-capture-law`,
//! `eliminationSpectacle`). Każdy scenariusz: stan Rust odpowiadający stanowi pinu, `run_siege_turn` co turę (ten sam
//! tick, który woła `PlayableGame::advance_turn` w fazie Economy), porównanie dziennika kroków pinu i stanu po turze.
//! Osobno E2E przez `advance_turn` (produkcyjny wołający) i determinizm.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::city_capture_apply::apply_siege_capitulation;
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableState, PlayableUnit,
    PlayableUnitKind, StartGameParams,
};
use civ_engine::domain::save_migrations::ARMY_STACK_LIMIT;
use civ_engine::domain::siege_surrender::{
    glod_wojska_hp_frac, run_siege_turn, siege_unit_max_hp, PlayableCitySiege,
};
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_kapitulacja_vectors/vectors.json");
const EXPECTED_PIN_SHA256: &str =
    "376cbfc6e7a6ae510eb41af3be611278aaa11b848a07ab7cb1656cdb14d9162c";

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

/// D-ZMA-5: id webu → id stanu (gracz 0 → 1).
fn st_owner(web: i64) -> u64 {
    if web == 0 {
        1
    } else {
        u64::try_from(web).expect("owner")
    }
}

fn id_of(v: &Value) -> u64 {
    v.as_str().expect("id").parse().expect("numeric id")
}

fn opt_f64(v: &Value, k: &str) -> Option<f64> {
    v.get(k).and_then(Value::as_f64)
}

/// Stan Rust odpowiadający scenariuszowi pinu.
fn build_state(sc: &Value) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("start")
        .state()
        .clone();
    st.cities.clear();
    st.units.clear();
    st.economy.units.clear();
    st.oblegane.clear();
    st.siege_city.clear();
    // Zbior `playerEverOwnedCityByOwner` scenariusza pinu startuje pusty (miasta scenariusza nie byly zakladane).
    st.gracz_kiedys_mial_miasto = false;
    st.player_ever_owned_city.clear();
    st.turn = u32::try_from(sc["turn"].as_u64().expect("turn")).expect("turn");
    let mut owners: BTreeSet<u64> = BTreeSet::new();
    for c in sc["cities"].as_array().expect("cities") {
        owners.insert(st_owner(c["ownerId"].as_i64().expect("owner")));
    }
    for u in sc["units"].as_array().expect("units") {
        owners.insert(st_owner(u["ownerId"].as_i64().expect("owner")));
    }
    for o in owners {
        if !st.players.iter().any(|p| p.id.get() == o) {
            st.players.push(PlayablePlayer {
                id: PlayerId::new(o),
                name: format!("ai{o}"),
                civilization: "grecy".into(),
                is_human: false,
            });
        }
    }
    for pair in sc["war"].as_array().expect("war") {
        let a = st_owner(pair[0].as_i64().expect("a"));
        let b = st_owner(pair[1].as_i64().expect("b"));
        st.war.diplomacy.set_relation(
            CivilizationPair::new(PlayerId::new(a), PlayerId::new(b)),
            Relation::new(50.0, 50.0, RelationStatus::War),
        );
    }
    for c in sc["cities"].as_array().expect("cities") {
        let cid = CityId::new(id_of(&c["id"]));
        st.cities.push(PlayableCity {
            id: cid,
            owner_id: PlayerId::new(st_owner(c["ownerId"].as_i64().expect("owner"))),
            name: c["name"].as_str().expect("name").to_owned(),
            position: PositionDto::new(
                u16::try_from(c["q"].as_u64().expect("q")).expect("q"),
                u16::try_from(c["r"].as_u64().expect("r")).expect("r"),
            ),
            is_capital: false,
            population: u32::try_from(c["population"].as_u64().expect("pop")).expect("pop"),
            culture: 0,
        });
        if c["oblegane"].as_bool() == Some(true) {
            st.oblegane.insert(cid);
        }
        let f = PlayableCitySiege {
            oblegajacy_owner_id: c
                .get("oblegajacyOwnerId")
                .and_then(Value::as_i64)
                .map(|o| PlayerId::new(st_owner(o))),
            siege_capitulation_pending: c["siegeCapitulationPending"].as_bool() == Some(true),
            siege_starve_start_max_hp: opt_f64(c, "siegeStarveStartMaxHp"),
            magazyn_zywnosci: opt_f64(c, "magazynZywnosci"),
        };
        if !f.is_default() {
            st.siege_city.insert(cid, f);
        }
        if let Some(o) = c.get("capturedFromOwnerId").and_then(Value::as_i64) {
            st.captured_from_owner_by_city
                .insert(cid, PlayerId::new(st_owner(o)));
        }
    }
    for u in sc["units"].as_array().expect("units") {
        let uid = id_of(&u["id"]);
        st.units.push(PlayableUnit {
            id: UnitId::new(uid),
            owner_id: PlayerId::new(st_owner(u["ownerId"].as_i64().expect("owner"))),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(
                u16::try_from(u["q"].as_u64().expect("q")).expect("q"),
                u16::try_from(u["r"].as_u64().expect("r")).expect("r"),
            ),
            movement: 1u8.into(),
            movement_max: 1u8.into(),
            selected: false,
        });
        let cat = u["category"].as_str().expect("category");
        st.economy.units.insert(
            uid,
            PlayableReplaceUnit {
                type_id: Some(u["typeId"].as_str().expect("type").to_owned()),
                // Kategoria cywilna jawnie (web `category`); wojsko: kategoria z `units.json` (jak `categoryOf`).
                category: (cat == "osadnik").then(|| cat.to_owned()),
                hp: opt_f64(u, "hp"),
                hp_max: opt_f64(u, "hpMax"),
                ..PlayableReplaceUnit::default()
            },
        );
        if let Some(c) = u.get("oblegaCityId").and_then(Value::as_str) {
            st.oblega_city_by_unit
                .insert(UnitId::new(uid), CityId::new(c.parse().expect("city")));
        }
    }
    st
}

/// Porównanie stanu Rust z migawką pinu po turze.
fn assert_snapshot(name: &str, turn: usize, st: &PlayableState, snap: &Value) {
    assert_snapshot_opts(name, turn, st, snap, true);
}

fn assert_snapshot_opts(
    name: &str,
    turn: usize,
    st: &PlayableState,
    snap: &Value,
    check_ever: bool,
) {
    let ctx = format!("{name} tura {turn}");
    for c in snap["cities"].as_array().expect("cities") {
        let cid = CityId::new(id_of(&c["id"]));
        let rc = st.cities.iter().find(|x| x.id == cid).expect("miasto");
        assert_eq!(
            rc.owner_id.get(),
            st_owner(c["ownerId"].as_i64().expect("owner")),
            "{ctx}: wlasciciel"
        );
        assert_eq!(
            u64::from(rc.population),
            c["population"].as_u64().expect("pop"),
            "{ctx}: ludnosc"
        );
        assert_eq!(
            st.oblegane.contains(&cid),
            c["oblegane"].as_bool() == Some(true),
            "{ctx}: oblegane"
        );
        let f = st.siege_city.get(&cid).copied().unwrap_or_default();
        assert_eq!(
            f.oblegajacy_owner_id.map(|p| p.get()),
            c.get("oblegajacyOwnerId")
                .and_then(Value::as_i64)
                .map(st_owner),
            "{ctx}: oblegajacyOwnerId"
        );
        assert_eq!(
            f.siege_capitulation_pending,
            c["siegeCapitulationPending"].as_bool() == Some(true),
            "{ctx}: siegeCapitulationPending"
        );
        assert_eq!(
            f.siege_starve_start_max_hp,
            opt_f64(c, "siegeStarveStartMaxHp"),
            "{ctx}: siegeStarveStartMaxHp"
        );
        assert_eq!(
            f.magazyn_zywnosci,
            opt_f64(c, "magazynZywnosci"),
            "{ctx}: magazyn"
        );
        assert_eq!(
            st.captured_from_owner_by_city.get(&cid).map(|p| p.get()),
            c.get("capturedFromOwnerId")
                .and_then(Value::as_i64)
                .map(st_owner),
            "{ctx}: capturedFromOwnerId"
        );
        let law = st.post_capture_law_by_city.get(&cid);
        assert_eq!(
            law.and_then(|l| l.post_capture_law_turns_remaining),
            opt_f64(c, "postCaptureLawTurnsRemaining"),
            "{ctx}: postCaptureLawTurnsRemaining"
        );
        assert_eq!(
            law.map(|l| l.was_rebellion_reconquest),
            c.get("wasRebellionReconquest").and_then(Value::as_bool),
            "{ctx}: wasRebellionReconquest"
        );
    }
    let pin_units = snap["units"].as_array().expect("units");
    assert_eq!(st.units.len(), pin_units.len(), "{ctx}: liczba jednostek");
    for (ru, pu) in st.units.iter().zip(pin_units) {
        assert_eq!(ru.id.get(), id_of(&pu["id"]), "{ctx}: kolejnosc jednostek");
        assert_eq!(
            ru.owner_id.get(),
            st_owner(pu["ownerId"].as_i64().expect("owner")),
            "{ctx}: wlasciciel jednostki"
        );
        assert_eq!(
            (u64::from(ru.position.x()), u64::from(ru.position.y())),
            (pu["q"].as_u64().expect("q"), pu["r"].as_u64().expect("r")),
            "{ctx}: pozycja {}",
            ru.id.get()
        );
        let rep = st.economy.units.get(&ru.id.get());
        assert_eq!(
            rep.and_then(|r| r.hp),
            opt_f64(pu, "hp"),
            "{ctx}: hp {}",
            ru.id.get()
        );
        assert_eq!(
            rep.and_then(|r| r.hp_max),
            opt_f64(pu, "hpMax"),
            "{ctx}: hpMax {}",
            ru.id.get()
        );
        assert_eq!(
            st.oblega_city_by_unit.get(&ru.id).map(|c| c.get()),
            pu.get("oblegaCityId").map(id_of),
            "{ctx}: oblegaCityId {}",
            ru.id.get()
        );
    }
    let ever: BTreeSet<u64> = snap["everOwned"]
        .as_array()
        .expect("ever")
        .iter()
        .map(|v| st_owner(v.as_i64().expect("o")))
        .collect();
    let rust_ever: BTreeSet<u64> = st
        .player_ever_owned_city_by_owner()
        .iter()
        .map(|p| p.get())
        .collect();
    if check_ever {
        assert_eq!(rust_ever, ever, "{ctx}: playerEverOwnedCityByOwner");
    } else {
        // `advance_turn`: faza Victory dopisuje wlascicieli z miastami (P6-ZWYCIESTWO); tu tylko wpis kapitulacji.
        assert!(
            ever.is_subset(&rust_ever),
            "{ctx}: playerEverOwnedCityByOwner"
        );
    }
    let chron: BTreeMap<u64, (f64, f64, Option<f64>)> = snap["chronicle"]
        .as_array()
        .expect("chronicle")
        .iter()
        .map(|e| {
            (
                st_owner(e[0].as_i64().expect("o")),
                (
                    e[1]["citiesTaken"].as_f64().expect("t"),
                    e[1]["citiesLost"].as_f64().expect("l"),
                    e[1].get("sinceTurn").and_then(Value::as_f64),
                ),
            )
        })
        .collect();
    let rust_chron: BTreeMap<u64, (f64, f64, Option<f64>)> = st
        .civ_chronicle_by_owner
        .iter()
        .map(|(k, c)| (*k, (c.cities_taken, c.cities_lost, c.since_turn)))
        .collect();
    assert_eq!(rust_chron, chron, "{ctx}: kronika (noteCityCapture)");
}

fn run_case(sc: &Value) -> Vec<PlayableState> {
    let name = sc["name"].as_str().expect("name");
    let mut st = build_state(sc);
    let mut states = Vec::new();
    for (t, snap) in sc["out"].as_array().expect("out").iter().enumerate() {
        let report = run_siege_turn(&mut st).unwrap_or_else(|e| panic!("{name}: tick {e}"));
        let steps: Vec<&str> = report
            .entries
            .iter()
            .filter_map(|e| e.capitulation.as_ref())
            .flat_map(|c| c.steps.iter().copied())
            .collect();
        let pin_log: Vec<&str> = snap["log"]
            .as_array()
            .expect("log")
            .iter()
            .map(|v| v.as_str().expect("s"))
            .collect();
        assert_eq!(
            steps, pin_log,
            "{name} tura {t}: kroki resolveSiegeSurrender"
        );
        assert_snapshot(name, t, &st, snap);
        states.push(st.clone());
        // `advance_turn` podbija turę po fazie Economy (generator: `setTurn(turn + t)`).
        st.turn += 1;
    }
    states
}

#[test]
fn vectors_guard_pin_and_params() {
    let v = vectors();
    assert_eq!(v["pinSha256"].as_str(), Some(EXPECTED_PIN_SHA256));
    let p = &v["params"];
    assert_eq!(
        p["maxPerSide"].as_i64(),
        Some(ARMY_STACK_LIMIT),
        "armyStackLimit"
    );
    assert_eq!(p["capturePopLoss"].as_f64(), Some(1.0), "CAPTURE_POP_LOSS");
    assert_eq!(
        p["healthWojownik"].as_f64(),
        Some(siege_unit_max_hp("Wojownik")),
        "unitHealth(Wojownik)"
    );
    for (label, key) in [
        ("Łatwy", "easy"),
        ("Normalny", "normal"),
        ("Trudny", "hard"),
    ] {
        assert_eq!(
            p["glodFrac"][key].as_f64(),
            Some(glod_wojska_hp_frac(label)),
            "glodWojskaHpFrac {key}"
        );
    }
    assert_eq!(v["tickCases"].as_array().map(Vec::len), Some(14));
}

#[test]
fn tick_matches_pin_vectors_all_scenarios() {
    let v = vectors();
    for sc in v["tickCases"].as_array().expect("cases") {
        run_case(sc);
    }
}

#[test]
fn no_city_ends_siege_only() {
    let v = vectors();
    let mut st = build_state(&serde_json::json!({
        "turn": 5, "war": [[0, 101]],
        "cities": [{"id": "900", "ownerId": 101, "name": "M900", "q": 4, "r": 3, "population": 3,
                    "oblegane": true, "oblegajacyOwnerId": 0}],
        "units": []
    }));
    let before = st.clone();
    let cap = apply_siege_capitulation(&mut st, CityId::new(999)).expect("brak miasta");
    let pin_log: Vec<&str> = v["noCity"]["log"]
        .as_array()
        .expect("log")
        .iter()
        .map(|x| x.as_str().expect("s"))
        .collect();
    assert_eq!(cap.steps, pin_log);
    assert!(cap.capture.is_none());
    assert_eq!(st, before, "brak miasta: stan bez zmian");
    assert_snapshot("noCity", 0, &st, &v["noCity"]);
}

/// E2E przez produkcyjny tick: `PlayableGame::advance_turn` (faza Economy) — tura 1 flaga, tura 2 przejęcie.
#[test]
fn advance_turn_runs_capitulation_end_to_end() {
    let v = vectors();
    let sc = v["tickCases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["name"] == "legacy_gracz")
        .expect("legacy_gracz");
    let mut game = PlayableGame::from_state(build_state(sc));
    for (t, snap) in sc["out"].as_array().expect("out").iter().enumerate() {
        let turn_before = game.state().turn;
        game.advance_turn().expect("advance_turn");
        assert_eq!(game.state().turn, turn_before + 1);
        let steps: Vec<&str> = game
            .last_siege_tick()
            .entries
            .iter()
            .filter_map(|e| e.capitulation.as_ref())
            .flat_map(|c| c.steps.iter().copied())
            .collect();
        let pin_log: Vec<&str> = snap["log"]
            .as_array()
            .expect("log")
            .iter()
            .map(|x| x.as_str().expect("s"))
            .collect();
        assert_eq!(steps, pin_log, "advance_turn tura {t}");
        assert_snapshot_opts("advance_turn", t, game.state(), snap, false);
    }
    let cap = game.last_siege_tick().entries[0]
        .capitulation
        .as_ref()
        .expect("kapitulacja")
        .capture
        .as_ref()
        .expect("przejecie");
    assert!(cap.captured);
    assert_eq!(cap.removed_unit_ids, Vec::<u64>::new());
    assert_eq!(cap.entered_unit_ids, vec![7001, 7002]);
    assert_eq!((cap.population_before, cap.population_after), (3, 2));
    assert!(cap
        .not_applied
        .iter()
        .any(|s| s == "applyLiveSafeRationForCity"));
}

#[test]
fn tick_is_deterministic() {
    let v = vectors();
    for sc in v["tickCases"].as_array().expect("cases") {
        assert_eq!(run_case(sc), run_case(sc), "{}", sc["name"]);
    }
}

#[test]
fn stale_siege_fields_reset_when_city_not_besieged() {
    // D-KAP-5: oblężenie zakończone poza `end_map_siege_state` (np. `validate_storm_siege`) nie zostawia flagi.
    let v = vectors();
    let sc = &v["tickCases"][0];
    let mut st = build_state(sc);
    let cid = CityId::new(900);
    st.siege_city
        .get_mut(&cid)
        .expect("pola")
        .siege_capitulation_pending = true;
    st.oblegane.remove(&cid);
    let r = run_siege_turn(&mut st).expect("tick");
    assert!(r.entries.is_empty());
    assert!(!st.siege_city.contains_key(&cid), "pola oblężenia zgaszone");
}

#[test]
fn ai_ai_regular_war_hook_reported_not_applied() {
    let v = vectors();
    let sc = v["tickCases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["name"] == "ai_ai")
        .expect("ai_ai");
    let mut st = build_state(sc);
    run_siege_turn(&mut st).expect("t1");
    let r = run_siege_turn(&mut st).expect("t2");
    let cap = r.entries[0].capitulation.as_ref().expect("cap");
    assert!(cap
        .capture
        .as_ref()
        .expect("capture")
        .not_applied
        .iter()
        .any(|s| s == "maybeResolveRegularWarOnCityCapture(AI-AI)"));
    // Gracz w parze: Q3 pinu = no-op, bez wpisu.
    let sc2 = &v["tickCases"][0];
    let mut st2 = build_state(sc2);
    run_siege_turn(&mut st2).expect("t1");
    let r2 = run_siege_turn(&mut st2).expect("t2");
    assert!(!r2.entries[0]
        .capitulation
        .as_ref()
        .expect("cap")
        .capture
        .as_ref()
        .expect("capture")
        .not_applied
        .iter()
        .any(|s| s.starts_with("maybeResolveRegularWarOnCityCapture")));
}
