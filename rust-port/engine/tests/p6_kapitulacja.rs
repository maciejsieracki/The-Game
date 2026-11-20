//! R-RUSTPORT-P6-KAPITULACJA-Q1 (W3/W4/W5): kapitulacja głodowa oblężenia w produkcyjnym ticku tury.
//!
//! Wektory: `p6_kapitulacja_gen.mjs` (wykonanie tekstu pinu `07d2fbd72`: blok N3 `main.ts:38814-38878`,
//! `handleSiegeCapitulationPhase`, `resolveSiegeSurrender`, `endMapSiege`, `besiegerOwnerForCity`, `areEnemyOwners`,
//! `applyCapturePopulationLoss`, moduły `siege-starvation`, `army-starvation`, `siege-enter-city`, `post-capture-law`,
//! `eliminationSpectacle`). Każdy scenariusz: stan Rust odpowiadający stanowi pinu, `run_siege_turn` co turę (ten sam
//! tick, który woła `PlayableGame::advance_turn` w fazie Economy), porównanie dziennika kroków pinu i stanu po turze.
//! Osobno E2E przez `advance_turn` (produkcyjny wołający) i determinizm.
//!
//! Obrona r1 (Z1): generator wykonuje z tekstu pinu także `runCapitalCapturePlunder`, `recordWarCityLossForPair`,
//! kolejkę produkcji (`sanitizeBuildQueue`/`sanitizeProductionQueue`/`filterQueue`, `capitalCityIdForOwner`) i kartę
//! zdarzenia (`recordCityCaptureEvent` z wierszami raportu); każda tura porównuje stolice, skarbce, pule Pracy,
//! technologie, wojny, metę par, zdobycze mocy, kolejki produkcji i `capture_events`. Z2/Z3/Z4/Z7: scenariusze i testy
//! na końcu pliku.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::city_capture_apply::{
    apply_siege_capitulation, PlayableCaptureEvents, PlayableCityProduction,
};
use civ_engine::domain::events::{canonical_phase_order, TurnPhase};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableState, PlayableUnit,
    PlayableUnitKind, StartGameParams,
};
use civ_engine::domain::save_migrations::ARMY_STACK_LIMIT;
use civ_engine::domain::siege_surrender::{
    glod_wojska_hp_frac, run_siege_turn, siege_unit_max_hp, PlayableCitySiege, SIEGE_TICK_PHASE,
};
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_kapitulacja_vectors/vectors.json");
const EXPECTED_PIN_SHA256: &str =
    "17b8f1fb42402207df7284aede2b604bf3a5c5fa0545f33cf8e597c8463e78a9";

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

/// D-ZMA-5: id stanu → id webu (gracz 1 → 0).
fn web_owner(st: u64) -> i64 {
    if st == 1 {
        0
    } else {
        i64::try_from(st).expect("owner")
    }
}

/// Id jednostki (`"7001"`) albo miasta (`"city900"`, `cityFoundOrder` pinu) → liczba.
fn id_of(v: &Value) -> u64 {
    let s = v.as_str().expect("id");
    s.strip_prefix("city")
        .unwrap_or(s)
        .parse()
        .expect("numeric id")
}

fn web_pair_key(a: i64, b: i64) -> String {
    format!("{}_{}", a.min(b), a.max(b))
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
    // Obrona r1 (Z1): zasoby właścicieli i kolejki produkcji wyłącznie ze scenariusza pinu.
    st.economy.treasury = 0.0;
    st.economy.ai_treasury_by_owner.clear();
    st.economy.praca_pool_by_owner.clear();
    st.stores.researched_techs_by_owner.clear();
    st.city_prod_by_city.clear();
    st.war.opaque.remove("diplomacyPairMeta");
    st.capture_events = PlayableCaptureEvents::default();
    let list = |k: &str| sc.get(k).and_then(Value::as_array).cloned().unwrap_or_default();
    for t in list("treasury") {
        let (o, v) = (st_owner(t[0].as_i64().expect("o")), t[1].as_f64().expect("v"));
        if o == 1 {
            st.economy.treasury = v;
        } else {
            st.economy.ai_treasury_by_owner.insert(o, v);
        }
    }
    for t in list("praca") {
        st.economy
            .praca_pool_by_owner
            .insert(st_owner(t[0].as_i64().expect("o")), t[1].as_f64().expect("v"));
    }
    for t in list("techs") {
        st.stores.researched_techs_by_owner.insert(
            st_owner(t[0].as_i64().expect("o")),
            t[1].as_array()
                .expect("techs")
                .iter()
                .map(|x| x.as_str().expect("t").to_owned())
                .collect(),
        );
    }
    let capitals: BTreeSet<u64> = list("capitals")
        .iter()
        .map(|c| c[1].as_u64().expect("capital"))
        .collect();
    if let Some(prod) = sc.get("prod").and_then(Value::as_object) {
        for (c, p) in prod {
            let pp: PlayableCityProduction = serde_json::from_value(p.clone()).expect("prod");
            st.city_prod_by_city
                .insert(CityId::new(c.parse().expect("city")), pp);
        }
    }
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
            is_capital: capitals.contains(&cid.get()),
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
        if let Some(c) = u.get("oblegaCityId") {
            st.oblega_city_by_unit
                .insert(UnitId::new(uid), CityId::new(id_of(c)));
        }
    }
    st
}

/// Porównanie stanu Rust z migawką pinu po turze.
fn assert_snapshot(name: &str, turn: usize, st: &PlayableState, snap: &Value) {
    assert_snapshot_opts(name, turn, st, snap, true);
    assert_capture_steps(name, turn, st, snap, true);
}

/// Obrona r1 (Z1): stan kroków przejęcia (wykonanych z tekstu pinu) po turze. `full = false` (E2E przez
/// `advance_turn`): faza Diplomacy tej samej tury może zmienić wojny i metę par, więc te dwa pola są pomijane.
#[allow(clippy::too_many_lines)]
fn assert_capture_steps(name: &str, turn: usize, st: &PlayableState, snap: &Value, full: bool) {
    let ctx = format!("{name} tura {turn}");
    // Stolice (`capitalCityIdByOwner` ↔ `is_capital`).
    let mut rust_cap: Vec<(i64, u64)> = st
        .cities
        .iter()
        .filter(|c| c.is_capital)
        .map(|c| (web_owner(c.owner_id.get()), c.id.get()))
        .collect();
    rust_cap.sort_unstable();
    let pin_cap: Vec<(i64, u64)> = snap["capitals"]
        .as_array()
        .expect("capitals")
        .iter()
        .map(|c| (c[0].as_i64().expect("o"), id_of(&c[1])))
        .collect();
    assert_eq!(rust_cap, pin_cap, "{ctx}: stolice");
    let pin_map = |k: &str| -> BTreeMap<i64, f64> {
        snap[k]
            .as_array()
            .expect(k)
            .iter()
            .map(|e| (e[0].as_i64().expect("o"), e[1].as_f64().expect("v")))
            .collect()
    };
    let eliminated: BTreeSet<i64> = snap["eliminated"]
        .as_array()
        .expect("eliminated")
        .iter()
        .map(|o| o.as_i64().expect("o"))
        .collect();
    // Skarbce i pule Pracy: semantyka akcesorów pinu (`?? 0`) — brak wpisu = 0 po obu stronach.
    let pin_tr = pin_map("treasury");
    let pin_pr = pin_map("praca");
    let mut owners: BTreeSet<i64> = pin_tr.keys().chain(pin_pr.keys()).copied().collect();
    owners.insert(0);
    owners.extend(st.economy.ai_treasury_by_owner.keys().map(|o| web_owner(*o)));
    owners.extend(st.economy.praca_pool_by_owner.keys().map(|o| web_owner(*o)));
    for o in &owners {
        let so = st_owner(*o);
        let rust_tr = if so == 1 {
            st.economy.treasury
        } else {
            st.economy
                .ai_treasury_by_owner
                .get(&so)
                .copied()
                .unwrap_or(0.0)
        };
        assert_eq!(
            rust_tr,
            pin_tr.get(o).copied().unwrap_or(0.0),
            "{ctx}: skarbiec {o}"
        );
        assert_eq!(
            st.economy
                .praca_pool_by_owner
                .get(&so)
                .copied()
                .unwrap_or(0.0),
            pin_pr.get(o).copied().unwrap_or(0.0),
            "{ctx}: pula Pracy {o}"
        );
    }
    // Technologie (bez wyeliminowanych: `eliminate_owner` Rust nie kasuje `aiResearchDone` — dług KAP-DL-8).
    let pin_techs: BTreeMap<i64, BTreeSet<String>> = snap["techs"]
        .as_array()
        .expect("techs")
        .iter()
        .map(|e| {
            (
                e[0].as_i64().expect("o"),
                e[1].as_array()
                    .expect("t")
                    .iter()
                    .map(|t| t.as_str().expect("t").to_owned())
                    .collect(),
            )
        })
        .filter(|(_, t): &(i64, BTreeSet<String>)| !t.is_empty())
        .collect();
    let rust_techs: BTreeMap<i64, BTreeSet<String>> = st
        .stores
        .researched_techs_by_owner
        .iter()
        .map(|(o, t)| (web_owner(*o), t.clone()))
        .filter(|(o, t)| !t.is_empty() && !eliminated.contains(o))
        .collect();
    assert_eq!(rust_techs, pin_techs, "{ctx}: technologie");
    // Zdobycze mocy (`zdobyczePowerByOwner`).
    let rust_zd: BTreeMap<i64, f64> = st
        .war
        .zdobycze_power_by_owner
        .iter()
        .map(|(o, v)| (web_owner(u64::try_from(*o).expect("o")), *v))
        .collect();
    assert_eq!(rust_zd, pin_map("zdobycze"), "{ctx}: zdobycze mocy");
    // Kolejki produkcji (`cityProd`).
    let pin_prod: BTreeMap<u64, PlayableCityProduction> = snap["cityProd"]
        .as_array()
        .expect("cityProd")
        .iter()
        .map(|e| {
            (
                id_of(&e[0]),
                serde_json::from_value(e[1].clone()).expect("prod"),
            )
        })
        .collect();
    let rust_prod: BTreeMap<u64, PlayableCityProduction> = st
        .city_prod_by_city
        .iter()
        .map(|(c, p)| (c.get(), p.clone()))
        .collect();
    assert_eq!(rust_prod, pin_prod, "{ctx}: kolejki produkcji");
    // Karta zdarzenia (`recordCityCaptureEvent` / `recordCivElimEvent`).
    let ev = &snap["captureEvents"];
    let pin_ev: PlayableCaptureEvents = serde_json::from_value(serde_json::json!({
        "warEventLog": ev["warEventLog"],
        "cityCaptureDetails": ev["city"],
        "civElimDetails": ev["civElim"],
    }))
    .expect("captureEvents");
    assert_eq!(st.capture_events, pin_ev, "{ctx}: karta zdarzenia");
    if !full {
        return;
    }
    // Wojny (relacje) i meta par (`recordWarCityLossForPair`, `eliminateOwner`).
    let mut rust_war: Vec<String> = st
        .war
        .diplomacy
        .relations
        .iter()
        .filter(|(_, r)| r.status == RelationStatus::War)
        .map(|(p, _)| web_pair_key(web_owner(p.first.get()), web_owner(p.second.get())))
        .collect();
    rust_war.sort();
    let pin_war: Vec<String> = snap["war"]
        .as_array()
        .expect("war")
        .iter()
        .map(|k| k.as_str().expect("k").to_owned())
        .collect();
    assert_eq!(rust_war, pin_war, "{ctx}: wojny");
    let mut rust_meta: Vec<(String, Value)> = st
        .war
        .opaque
        .get("diplomacyPairMeta")
        .and_then(Value::as_array)
        .map(|rows| {
            rows.iter()
                .map(|r| {
                    let (a, b) = r[0].as_str().expect("k").split_once('-').expect("min-max");
                    (
                        web_pair_key(
                            web_owner(a.parse().expect("a")),
                            web_owner(b.parse().expect("b")),
                        ),
                        r[1].clone(),
                    )
                })
                .collect()
        })
        .unwrap_or_default();
    rust_meta.sort_by(|x, y| x.0.cmp(&y.0));
    let pin_meta: Vec<(String, Value)> = snap["pairMeta"]
        .as_array()
        .expect("pairMeta")
        .iter()
        .map(|r| (r[0].as_str().expect("k").to_owned(), r[1].clone()))
        .collect();
    assert_eq!(rust_meta, pin_meta, "{ctx}: meta par");
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
        let report = run_siege_turn(&mut st);
        assert_eq!(report.error, None, "{name}: tick");
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
            glod_wojska_hp_frac(label).ok(),
            "glodWojskaHpFrac {key}"
        );
    }
    assert_eq!(v["tickCases"].as_array().map(Vec::len), Some(24));
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
        assert_capture_steps("advance_turn", t, game.state(), snap, false);
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
    let r = run_siege_turn(&mut st);
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
    run_siege_turn(&mut st);
    let r = run_siege_turn(&mut st);
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
    run_siege_turn(&mut st2);
    let r2 = run_siege_turn(&mut st2);
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

// ---------------------------------------------------------------------------------------------------------------
// Obrona r1 (Evaluator r1): Z1 pokrycie, Z4 faza i ścieżka błędu, Z7 trudność.
// ---------------------------------------------------------------------------------------------------------------

fn case<'a>(v: &'a Value, name: &str) -> &'a Value {
    v["tickCases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["name"] == name)
        .unwrap_or_else(|| panic!("brak scenariusza {name}"))
}

/// Z1: wektory zawierają przejęcie stolicy, eliminację, niepustą kolejkę z budynkiem stołecznym, metę pary i kartę
/// zdarzenia — kroki wykonane z tekstu pinu (nie zaślepki).
#[test]
fn vectors_cover_capture_steps_from_pin() {
    let v = vectors();
    let last = |name: &str| case(&v, name)["out"].as_array().expect("out").last().cloned().expect("tura");
    let st = last("stolica_przejecie");
    assert_eq!(st["capitals"], serde_json::json!([[0, "city950"], [101, "city901"]]), "sukcesja stolicy");
    assert_eq!(st["treasury"], serde_json::json!([[0, 45], [101, 0]]), "łup skarbca");
    assert_eq!(st["praca"], serde_json::json!([[0, 9], [101, 0]]), "pula Pracy przepada, postęp Pałacu do zdobywcy");
    assert_eq!(st["cityProd"][0][1]["kolejka"].as_array().map(Vec::len), Some(1), "Pałac usunięty z kolejki");
    assert!(st["captureEvents"]["warEventLog"][0]["subtitle"].as_str().expect("s").contains("40"));
    let el = last("eliminacja");
    assert_eq!(el["eliminated"], serde_json::json!([101]));
    assert_eq!(el["techs"], serde_json::json!([[0, ["t_a", "t_b"]]]), "technologie skopiowane");
    assert_eq!(el["war"], serde_json::json!([]), "relacje wyeliminowanego skasowane");
    assert!(el["captureEvents"]["warEventLog"][0]["title"].as_str().expect("t").starts_with("ELIMINACJA"));
    let nc = last("kolejka_nowa_stolica_gracza");
    assert_eq!(nc["cityProd"][0][1]["kolejka"].as_array().map(Vec::len), Some(2), "Pałac zostaje (nowa stolica)");
    let gi = last("stolica_gdzie_indziej");
    assert_eq!(gi["treasury"], serde_json::json!([[0, 5], [101, 40]]), "zwykłe miasto: brak łupu (E09)");
    let lg = last("legacy_gracz");
    assert_eq!(lg["pairMeta"][0][0], "0_101");
    assert_eq!(lg["pairMeta"][0][1]["wojnaMiasta"]["utraty"]["101"], 1, "recordWarCityLossForPair");
}

/// Z2: kapitulacja usuwa wyłącznie jednostki starego właściciela z heksu miasta.
#[test]
fn capitulation_keeps_old_owner_units_outside_city_hex() {
    let v = vectors();
    let sc = case(&v, "obroncy_poza_heksem");
    let states = run_case(sc);
    let st = states.last().expect("tura 2");
    let ids: BTreeSet<u64> = st.units.iter().map(|u| u.id.get()).collect();
    assert!(!ids.contains(&8001), "cywil na heksie usunięty");
    assert!(ids.contains(&8002) && ids.contains(&8003), "jednostki poza heksem przeżywają: {ids:?}");
}

/// Z3: obca jednostka wojskowa na heksie miasta nie jest garnizonem (ścieżka bez garnizonu: flaga, potem przejęcie).
#[test]
fn foreign_military_unit_on_city_hex_is_not_garrison() {
    let v = vectors();
    let sc = case(&v, "obcy_wojskowy_na_heksie");
    let mut st = build_state(sc);
    let r1 = run_siege_turn(&mut st);
    assert!(!r1.entries[0].decision.record_start, "brak startu głodu garnizonu");
    assert!(st.siege_city[&CityId::new(900)].siege_capitulation_pending, "flaga legacy");
    assert!(st.siege_city[&CityId::new(900)].siege_starve_start_max_hp.is_none());
}

/// Z4: miejsce wpięcia ticka w turze = faza Economy, po Diplomacy (pin N3 po ticku ekonomii; W8 r7 Q2).
#[test]
fn siege_tick_phase_is_economy_after_diplomacy() {
    assert_eq!(SIEGE_TICK_PHASE, TurnPhase::Economy);
    let order = canonical_phase_order();
    let pos = |p: TurnPhase| order.iter().position(|x| *x == p).expect("faza");
    assert!(pos(TurnPhase::Diplomacy) < pos(SIEGE_TICK_PHASE));
    let v = vectors();
    let mut game = PlayableGame::from_state(build_state(case(&v, "legacy_gracz")));
    game.advance_turn().expect("tura");
    assert!(game.state().last_advanced_phases.contains(&SIEGE_TICK_PHASE));
    assert_eq!(game.last_siege_tick().entries.len(), 1, "tick wykonany w tej turze");
}

/// Z4 (D-KAP-3 r2): błąd kapitulacji PO mutacjach (zła meta pary) — skutki kapitulacji cofnięte w całości, błąd w
/// raporcie, tura przechodzi dalej (pin: `try/catch` bloku N3, `console.error`).
#[test]
fn capitulation_error_rolls_back_city_and_turn_continues() {
    let v = vectors();
    let mut st = build_state(case(&v, "flaga_z_zapisu"));
    st.war
        .opaque
        .insert("diplomacyPairMeta".into(), Value::String("zepsute".into()));
    let mut game = PlayableGame::from_state(st);
    let before = game.state().clone();
    let turn = before.turn;
    game.advance_turn().expect("tura trwa mimo błędu oblężenia");
    let after = game.state();
    assert_eq!(after.turn, turn + 1);
    let err = game.last_siege_tick().error.clone().expect("błąd w raporcie");
    assert_eq!(err.0, CityId::new(900));
    assert!(err.1.contains("diplomacyPairMeta"), "{err:?}");
    let c = after.cities.iter().find(|c| c.id.get() == 900).expect("miasto");
    assert_eq!(c.owner_id.get(), 101, "miasto nie przejęte");
    assert_eq!(c.population, 3, "ludność bez straty");
    assert!(!after.captured_from_owner_by_city.contains_key(&CityId::new(900)));
    assert_eq!(after.siege_city, before.siege_city, "pola oblężenia bez zmian (flaga zostaje)");
    assert!(after.oblegane.contains(&CityId::new(900)));
    assert_eq!(after.civ_chronicle_by_owner, before.civ_chronicle_by_owner, "kronika bez zmian");
}

/// Z4 (D-KAP-3 r2): błąd w pierwszym mieście przerywa pętlę miast (pin: jeden `try` wokół `for`), drugie miasto nie
/// jest przetwarzane w tym ticku; tura trwa.
#[test]
fn capitulation_error_stops_city_loop_like_pin() {
    let v = vectors();
    let mut st = build_state(case(&v, "dwa_miasta"));
    // Miasto 900: oblegający = właściciel 0 (D-ZMA-5: niejednoznaczny wobec id webu) => błąd producenta.
    st.players.push(PlayablePlayer {
        id: PlayerId::new(0),
        name: "zero".into(),
        civilization: "grecy".into(),
        is_human: false,
    });
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(0), PlayerId::new(101)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    for (cid, owner) in [(900_u64, 0_u64), (905, 1)] {
        let f = st.siege_city.entry(CityId::new(cid)).or_default();
        f.oblegajacy_owner_id = Some(PlayerId::new(owner));
        f.siege_capitulation_pending = true;
    }
    let before = st.clone();
    let r = run_siege_turn(&mut st);
    assert_eq!(r.error.as_ref().map(|e| e.0), Some(CityId::new(900)));
    assert_eq!(r.entries.len(), 1, "miasto 905 nieprzetworzone");
    let owner = |s: &PlayableState, id: u64| s.cities.iter().find(|c| c.id.get() == id).expect("m").owner_id.get();
    assert_eq!(owner(&st, 900), 101);
    assert_eq!(owner(&st, 905), 102, "brak przejęcia 905 w tym ticku");
    assert_eq!(st, before, "bez garnizonów i bez skutków: stan bez zmian");
}

/// Z7: nieznana etykieta trudności = błąd ticka (jak `replace_difficulty_of`), nie cichy `Normal`.
#[test]
fn unknown_difficulty_is_reported_not_defaulted() {
    assert!(glod_wojska_hp_frac("Koszmar").is_err());
    assert_eq!(glod_wojska_hp_frac("Normalny"), glod_wojska_hp_frac("normal"));
    let v = vectors();
    let mut st = build_state(case(&v, "legacy_gracz"));
    st.params.difficulty = "Koszmar".into();
    let before = st.clone();
    let r = run_siege_turn(&mut st);
    assert_eq!(r.error.as_ref().map(|e| e.0), Some(CityId::new(900)));
    assert!(r.entries.is_empty());
    assert_eq!(st, before);
}
