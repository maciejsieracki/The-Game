//! R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A): zdobycie miasta po wygranym szturmie gracza
//! (`siege_battle_apply::apply_outcome` + `city_capture_apply::apply_storm_capture`, czyli to, co wykonuje
//! `FinishSiegeBattle`) bajt w bajt z wektorami wykonującymi tekst pinu `07d2fbd72` (`p6_zdobycie_miasta_a_gen.mjs`).

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::battle_setup_units::Side;
use civ_engine::domain::city_capture_apply::{
    apply_storm_capture, is_city_capture_blocked_by_defenders, CapitalCaptureKind,
    CaptureSkipReason, CityCaptureResultDto, NOT_APPLIED_ALWAYS, PIN_STEPS,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableFort, PlayableFortKind, PlayableGame, PlayableMap, PlayablePlacedWonder,
    PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind, PlayableState, PlayableTerrain,
    PlayableTile, PlayableUnit, PlayableUnitKind, StartGameParams,
};
use civ_engine::domain::siege_battle_adapter::RosterUnit;
use civ_engine::domain::siege_battle_apply::{apply_outcome, ApplyRosters, SiegeBattleResultDto};
use civ_engine::domain::siege_battle_session::{OutcomeUnit, SessionOutcome};
use civ_engine::domain::siege_tactics_loop::LoopWinner;
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zdobycie_miasta_a_vectors/vectors.json");
const PIN_SHA256: &str = "a5810e8a71a92c5422914e24de5e00170a7b000250ad6b242e7c4e3411878979";
const HUMAN: u64 = 1;
const ENEMY: u64 = 101;

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory")
}

fn f(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn u(v: &Value) -> u64 {
    v.as_u64().expect("u64")
}

fn p16(v: &Value) -> u16 {
    u16::try_from(u(v)).expect("u16")
}

fn machine(s: &str) -> PlayableSiegeMachineKind {
    match s {
        "taran" => PlayableSiegeMachineKind::Taran,
        "wieza" => PlayableSiegeMachineKind::Wieza,
        other => panic!("machina {other}"),
    }
}

fn roster(list: &Value) -> Vec<RosterUnit> {
    list.as_array()
        .expect("roster")
        .iter()
        .map(|r| {
            RosterUnit::new(
                r["id"].as_str().expect("id"),
                r["ownerId"].as_i64().expect("owner"),
                r["typeId"].as_str().expect("type"),
                r["category"].as_str().expect("category"),
                r["q"].as_i64().expect("q"),
                r["r"].as_i64().expect("r"),
            )
        })
        .collect()
}

fn city(id: u64, owner: u64, q: u16, r: u16, pop: u32, capital: bool) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("M{id}"),
        position: PositionDto::new(q, r),
        is_capital: capital,
        population: pop,
        culture: 0,
    }
}

/// Stan gry z wejścia wektora (te same pola co klej generatora).
fn state_for(inp: &Value) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("start")
        .state()
        .clone();
    let (w, h) = (p16(&inp["w"]), p16(&inp["h"]));
    let mut tiles = Vec::new();
    for y in 0..h {
        for x in 0..w {
            tiles.push(PlayableTile {
                position: PositionDto::new(x, y),
                terrain: PlayableTerrain::Plains,
                passable: true,
            });
        }
    }
    st.map = PlayableMap {
        width: w,
        height: h,
        tiles,
        improvements: Vec::new(),
    };
    st.turn = u32::try_from(u(&inp["turn"])).unwrap();
    st.players.push(PlayablePlayer {
        id: PlayerId::new(ENEMY),
        name: "wrog".into(),
        civilization: "rzymianie".into(),
        is_human: false,
    });
    let status = if inp["peace"].as_bool().unwrap() {
        RelationStatus::Peace
    } else {
        RelationStatus::War
    };
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, status),
    );
    let capitals: BTreeSet<u64> = inp["capitals"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| u(&c[1]))
        .collect();
    let c = &inp["city"];
    let cid = CityId::new(u(&c["id"]));
    st.cities = vec![city(
        u(&c["id"]),
        u(&c["ownerId"]),
        p16(&c["q"]),
        p16(&c["r"]),
        u32::try_from(u(&c["pop"])).unwrap(),
        capitals.contains(&u(&c["id"])),
    )];
    for x in inp["cities"].as_array().unwrap() {
        st.cities.push(city(
            u(&x["id"]),
            u(&x["ownerId"]),
            p16(&x["q"]),
            p16(&x["r"]),
            u32::try_from(u(&x["pop"])).unwrap(),
            capitals.contains(&u(&x["id"])),
        ));
    }
    if let Some(from) = inp["capturedFrom"].as_u64() {
        st.captured_from_owner_by_city
            .insert(cid, PlayerId::new(from));
    }
    st.oblegane.clear();
    st.oblegane.insert(cid);
    st.siege_machines_ready.clear();
    let ms: Vec<PlayableSiegeMachineKind> = inp["machines"]
        .as_array()
        .unwrap()
        .iter()
        .map(|m| machine(m.as_str().unwrap()))
        .collect();
    if !ms.is_empty() {
        st.siege_machines_ready.insert(cid, ms);
    }
    st.economy.treasury = 0.0;
    for t in inp["treasury"].as_array().unwrap() {
        let (o, v) = (u(&t[0]), f(&t[1]));
        if o == HUMAN {
            st.economy.treasury = v;
        } else {
            st.economy.ai_treasury_by_owner.insert(o, v);
        }
    }
    for t in inp["praca"].as_array().unwrap() {
        st.economy.praca_pool_by_owner.insert(u(&t[0]), f(&t[1]));
    }
    for t in inp["techs"].as_array().unwrap() {
        st.stores.researched_techs_by_owner.insert(
            u(&t[0]),
            t[1].as_array()
                .unwrap()
                .iter()
                .map(|s| s.as_str().unwrap().to_owned())
                .collect(),
        );
    }
    st.placed_world_wonders = inp["wonders"]
        .as_array()
        .unwrap()
        .iter()
        .map(|w| PlayablePlacedWonder {
            wonder_id: w["wonderId"].as_str().unwrap().to_owned(),
            q: i32::try_from(w["q"].as_i64().unwrap()).unwrap(),
            r: i32::try_from(w["r"].as_i64().unwrap()).unwrap(),
            owner_id: PlayerId::new(u(&w["ownerId"])),
        })
        .collect();
    st.forts = inp["forts"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| PlayableFort {
            q: i32::try_from(x["q"].as_i64().unwrap()).unwrap(),
            r: i32::try_from(x["r"].as_i64().unwrap()).unwrap(),
            owner_id: PlayerId::new(u(&x["ownerId"])),
            kind: PlayableFortKind::Fort,
            contested_useless: None,
            built_at_turn: x["builtAtTurn"].as_i64(),
            seq: x["seq"].as_i64(),
        })
        .collect();
    st.war.opaque.remove("diplomacyPairMeta");
    if !inp["pairMeta"].is_null() {
        st.war.opaque.insert(
            "diplomacyPairMeta".into(),
            serde_json::json!([["1-101", inp["pairMeta"].clone()]]),
        );
    }
    st.units.clear();
    st.economy.units.clear();
    for x in inp["units"].as_array().unwrap() {
        let id = u(&x["id"]);
        st.units.push(PlayableUnit {
            id: UnitId::new(id),
            owner_id: PlayerId::new(u(&x["ownerId"])),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(p16(&x["q"]), p16(&x["r"])),
            movement: f(&x["ruchLeft"]).into(),
            movement_max: f(&x["ruch"]).into(),
            selected: false,
        });
        st.economy.units.insert(
            id,
            PlayableReplaceUnit {
                type_id: Some(x["typeId"].as_str().unwrap().to_owned()),
                hp: Some(f(&x["hp"])),
                ..PlayableReplaceUnit::default()
            },
        );
    }
    st
}

fn outcome(inp: &Value) -> SessionOutcome {
    let winner = match inp["winner"].as_str().unwrap() {
        "atakujacy" => LoopWinner::Attacker,
        "obronca" => LoopWinner::Defender,
        _ => LoopWinner::Draw,
    };
    let mut units = Vec::new();
    for (key, side) in [("atk", Side::Atk), ("def", Side::Def)] {
        for x in inp["scene"][key].as_array().unwrap() {
            units.push(OutcomeUnit {
                roster_id: x["id"].as_str().unwrap().to_owned(),
                side,
                hp: f(&x["hp"]),
                max_hp: 0.0,
                dead: x["dead"].as_bool().unwrap(),
                routed: x["routed"].as_bool().unwrap(),
                removed: false,
            });
        }
    }
    SessionOutcome {
        winner,
        round_no: 0,
        units,
        consumed_machines: Vec::new(),
        wall_ever_breached: inp["breached"].as_bool().unwrap(),
        unported: Vec::new(),
        rolls_drawn: 0,
    }
}

fn scene_ids(inp: &Value) -> [Vec<String>; 2] {
    let ids = |k: &str| {
        inp["scene"][k]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x["id"].as_str().unwrap().to_owned())
            .collect::<Vec<_>>()
    };
    [ids("atk"), ids("def")]
}

/// `FinishSiegeBattle` bez sesji: `apply_outcome` + konsument haka (ta sama sekwencja co `siege_battle_apply::finish`).
fn run(inp: &Value) -> (PlayableState, SiegeBattleResultDto) {
    let mut st = state_for(inp);
    let atk = roster(&inp["atkRoster"]);
    let def = roster(&inp["defRoster"]);
    let rosters = ApplyRosters {
        city_id: u(&inp["city"]["id"]),
        anchor_unit_id: atk[0].id.parse().unwrap(),
        atk_roster: &atk,
        def_roster: &def,
    };
    let mut res = apply_outcome(&mut st, &rosters, &outcome(inp), &scene_ids(inp)).expect("apply");
    if let Some(req) = res.capture_requested.clone() {
        let cap = apply_storm_capture(&mut st, &rosters, &req).expect("zdobycie");
        res.siege_ended = res.siege_ended || cap.siege_ended;
        res.capture = Some(cap);
    }
    (st, res)
}

fn pair_meta(st: &PlayableState) -> Vec<(String, Value)> {
    st.war
        .opaque
        .get("diplomacyPairMeta")
        .and_then(Value::as_array)
        .map(|rows| {
            rows.iter()
                .map(|r| (r[0].as_str().unwrap().to_owned(), r[1].clone()))
                .collect()
        })
        .unwrap_or_default()
}

/// Różnice stanu po `FinishSiegeBattle` względem wektora (pusta lista = zgodność).
#[allow(clippy::too_many_lines)]
fn diffs(sc: &Value) -> Vec<String> {
    let inp = &sc["input"];
    let exp = &sc["expected"];
    let name = sc["name"].as_str().unwrap();
    let (st, res) = run(inp);
    let mut out = Vec::new();
    let mut check = |what: &str, rust: String, pin: String| {
        if rust != pin {
            out.push(format!("{name}: {what}\n  rust {rust}\n  pin  {pin}"));
        }
    };
    let units: Vec<(u64, u16, u16, String, String)> = st
        .units
        .iter()
        .map(|x| {
            (
                x.id.get(),
                x.position.x(),
                x.position.y(),
                format!("{:?}", st.economy.units.get(&x.id.get()).and_then(|r| r.hp)),
                format!("{:?}", f64::from(x.movement)),
            )
        })
        .collect();
    let want: Vec<(u64, u16, u16, String, String)> = exp["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| {
            (
                u(&x["id"]),
                p16(&x["q"]),
                p16(&x["r"]),
                format!("{:?}", Some(f(&x["hp"]))),
                format!("{:?}", f(&x["ruchLeft"])),
            )
        })
        .collect();
    check("jednostki", format!("{units:?}"), format!("{want:?}"));
    let cities: Vec<(u64, u64, u32, Option<u64>)> = st
        .cities
        .iter()
        .map(|c| {
            (
                c.id.get(),
                c.owner_id.get(),
                c.population,
                st.captured_from_owner_by_city.get(&c.id).map(|p| p.get()),
            )
        })
        .collect();
    let want_cities: Vec<(u64, u64, u32, Option<u64>)> = exp["cities"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| {
            (
                u(&c["id"]),
                u(&c["ownerId"]),
                u32::try_from(u(&c["pop"])).unwrap(),
                c["capturedFromOwnerId"].as_u64(),
            )
        })
        .collect();
    check("miasta", format!("{cities:?}"), format!("{want_cities:?}"));
    let captured = res.capture.as_ref().is_some_and(|c| c.captured);
    check(
        "zdobyte",
        captured.to_string(),
        exp["captured"].as_bool().unwrap().to_string(),
    );
    let cid = CityId::new(u(&inp["city"]["id"]));
    check(
        "oblegane",
        st.oblegane.contains(&cid).to_string(),
        exp["oblegane"].as_bool().unwrap().to_string(),
    );
    let ready: Vec<String> = st
        .siege_machines_ready
        .get(&cid)
        .map(|v| v.iter().map(|m| format!("{m:?}").to_lowercase()).collect())
        .unwrap_or_default();
    check(
        "machiny",
        format!("{ready:?}"),
        format!(
            "{:?}",
            exp["machinesReady"]
                .as_array()
                .unwrap()
                .iter()
                .map(|m| m.as_str().unwrap().to_owned())
                .collect::<Vec<_>>()
        ),
    );
    let capitals: Vec<(u64, u64)> = {
        let mut v: Vec<(u64, u64)> = st
            .cities
            .iter()
            .filter(|c| c.is_capital)
            .map(|c| (c.owner_id.get(), c.id.get()))
            .collect();
        v.sort_unstable();
        v
    };
    let want_cap: Vec<(u64, u64)> = exp["capitals"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| (u(&c[0]), u(&c[1])))
        .collect();
    check("stolice", format!("{capitals:?}"), format!("{want_cap:?}"));
    // Skarbce: gracz = `economy.treasury` (brak wpisu w wektorze = 0), AI = `ai_treasury_by_owner`.
    let want_tr: BTreeMap<u64, f64> = exp["treasury"]
        .as_array()
        .unwrap()
        .iter()
        .map(|t| (u(&t[0]), f(&t[1])))
        .collect();
    check(
        "skarbiec gracza",
        format!("{:?}", st.economy.treasury),
        format!("{:?}", want_tr.get(&HUMAN).copied().unwrap_or(0.0)),
    );
    let ai_tr: BTreeMap<u64, f64> = st.economy.ai_treasury_by_owner.clone();
    let want_ai_tr: BTreeMap<u64, f64> = want_tr.into_iter().filter(|(o, _)| *o != HUMAN).collect();
    check(
        "skarbce AI",
        format!("{ai_tr:?}"),
        format!("{want_ai_tr:?}"),
    );
    let want_praca: BTreeMap<u64, f64> = exp["praca"]
        .as_array()
        .unwrap()
        .iter()
        .map(|t| (u(&t[0]), f(&t[1])))
        .collect();
    check(
        "pule Pracy",
        format!("{:?}", st.economy.praca_pool_by_owner),
        format!("{want_praca:?}"),
    );
    let want_techs: BTreeMap<u64, BTreeSet<String>> = exp["techs"]
        .as_array()
        .unwrap()
        .iter()
        .map(|t| {
            (
                u(&t[0]),
                t[1].as_array()
                    .unwrap()
                    .iter()
                    .map(|s| s.as_str().unwrap().to_owned())
                    .collect(),
            )
        })
        .collect();
    check(
        "technologie",
        format!("{:?}", st.stores.researched_techs_by_owner),
        format!("{want_techs:?}"),
    );
    let wonders: Vec<(String, u64)> = st
        .placed_world_wonders
        .iter()
        .map(|w| (w.wonder_id.clone(), w.owner_id.get()))
        .collect();
    let want_w: Vec<(String, u64)> = exp["wonders"]
        .as_array()
        .unwrap()
        .iter()
        .map(|w| (w["wonderId"].as_str().unwrap().to_owned(), u(&w["ownerId"])))
        .collect();
    check("cuda", format!("{wonders:?}"), format!("{want_w:?}"));
    let transferred = res
        .capture
        .as_ref()
        .map(|c| c.wonders_transferred.clone())
        .unwrap_or_default();
    check(
        "cuda przekazane",
        format!("{transferred:?}"),
        format!(
            "{:?}",
            exp["wonderTransfers"]
                .as_array()
                .unwrap()
                .iter()
                .map(|s| s.as_str().unwrap().to_owned())
                .collect::<Vec<_>>()
        ),
    );
    let meta = pair_meta(&st);
    let want_meta: Vec<(String, Value)> = exp["pairMeta"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| (r[0].as_str().unwrap().to_owned(), r[1].clone()))
        .collect();
    let meta_ok = meta.len() == want_meta.len()
        && meta
            .iter()
            .zip(&want_meta)
            .all(|(a, b)| a.0 == b.0 && a.1 == b.1);
    if !meta_ok {
        out.push(format!(
            "{name}: meta par\n  rust {meta:?}\n  pin  {want_meta:?}"
        ));
    }
    let rel = st
        .war
        .diplomacy
        .relation(PlayerId::new(HUMAN), PlayerId::new(ENEMY))
        .map(|r| match r.status {
            RelationStatus::War => "wojna",
            _ => "pokoj",
        });
    let want_rel = exp["relations"]
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r[0] == "1-101")
        .map(|r| r[1].as_str().unwrap());
    let mut out2 = Vec::new();
    if rel != want_rel {
        out2.push(format!("{name}: relacja {rel:?} != {want_rel:?}"));
    }
    let ever: bool = st.ever_owned_city(PlayerId::new(HUMAN));
    let want_ever = exp["everOwned"]
        .as_array()
        .unwrap()
        .iter()
        .any(|o| u(o) == HUMAN);
    // Flaga fotela głównego jest prawdą już po starcie gry (miasto startowe), więc wektor sprawdza tylko kierunek.
    if want_ever && !ever {
        out2.push(format!("{name}: playerEverOwnedCity gracza"));
    }
    let event = res
        .capture
        .as_ref()
        .and_then(|c| c.capital_event)
        .map(|e| match e {
            CapitalCaptureKind::PrzejecieStolicy => "przejecieStolicy",
            CapitalCaptureKind::Eliminacja => "eliminacja",
        });
    if event != exp["capitalEvent"].as_str() {
        out2.push(format!(
            "{name}: zdarzenie stolicy {event:?} != {:?}",
            exp["capitalEvent"]
        ));
    }
    let elim = res.capture.as_ref().and_then(|c| c.eliminated_owner_id);
    if elim != exp["eliminated"].as_u64() {
        out2.push(format!(
            "{name}: eliminacja {elim:?} != {:?}",
            exp["eliminated"]
        ));
    }
    out.extend(out2);
    out
}

#[test]
fn wektory_pinu_sha_i_pokrycie() {
    let v = vectors();
    assert_eq!(v["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    assert_eq!(v["pinSha256"], PIN_SHA256, "wektory z innego tekstu pinu");
    let scs = v["scenarios"].as_array().unwrap();
    let has = |p: &dyn Fn(&Value) -> bool| scs.iter().any(p);
    assert!(has(&|s| s["expected"]["captured"] == true));
    assert!(has(&|s| s["expected"]["captured"] == false
        && s["input"]["breached"] == true
        && s["input"]["winner"] == "atakujacy"));
    assert!(has(&|s| s["expected"]["capitalEvent"] == "przejecieStolicy"));
    assert!(has(&|s| s["expected"]["capitalEvent"] == "eliminacja"));
    assert!(has(&|s| !s["expected"]["wonderTransfers"]
        .as_array()
        .unwrap()
        .is_empty()));
    assert!(scs.len() >= 12);
}

#[test]
fn zdobycie_po_szturmie_zgodne_z_pinem() {
    let v = vectors();
    let mut all = Vec::new();
    for sc in v["scenarios"].as_array().unwrap() {
        all.extend(diffs(sc));
    }
    assert!(all.is_empty(), "{}", all.join("\n"));
}

#[test]
fn blokada_obroncow_barbarzyncy_zgodna_z_pinem() {
    for c in vectors()["blockCases"].as_array().unwrap() {
        let units: Vec<(i64, i32, i32)> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| {
                (
                    x[0].as_i64().unwrap(),
                    i32::try_from(x[1].as_i64().unwrap()).unwrap(),
                    i32::try_from(x[2].as_i64().unwrap()).unwrap(),
                )
            })
            .collect();
        assert_eq!(
            is_city_capture_blocked_by_defenders(c["atk"].as_i64().unwrap(), &units, 5, 4),
            c["blocked"].as_bool().unwrap(),
            "{c}"
        );
    }
}

/// Tabela kryterium: każde wywołanie w tekście pinu (`applyCityCaptureToMap` + `applyCityCaptureAfterBattle`) ma wpis.
#[test]
fn kazde_wywolanie_pinu_ma_wpis_w_tabeli() {
    let names: BTreeSet<&str> = PIN_STEPS.iter().map(|(n, _)| *n).collect();
    let missing: Vec<String> = vectors()["pinCalls"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| c.as_str().unwrap().to_owned())
        .filter(|c| !names.contains(c.as_str()))
        .collect();
    assert!(missing.is_empty(), "brak w PIN_STEPS: {missing:?}");
}

#[test]
fn brak_zdobycia_ma_jawny_powod_i_liste_pominietych() {
    let v = vectors();
    let scs = v["scenarios"].as_array().unwrap();
    let peace = scs
        .iter()
        .find(|s| s["name"] == "pokoj_brak_zdobycia")
        .unwrap();
    let (_, res) = run(&peace["input"]);
    let cap: CityCaptureResultDto = res.capture.expect("hak wolany przy wylomie");
    assert!(!cap.captured);
    assert_eq!(cap.skipped, Some(CaptureSkipReason::NotEnemies));
    assert!(cap.not_applied.is_empty(), "brak zdobycia = brak krokow P1");
    let ok = scs.iter().find(|s| s["name"] == "zwykle_miasto").unwrap();
    let (_, res) = run(&ok["input"]);
    let cap = res.capture.expect("zdobycie");
    for s in NOT_APPLIED_ALWAYS {
        assert!(cap.not_applied.iter().any(|x| x == s), "{s}");
    }
    let no_breach = scs
        .iter()
        .find(|s| s["name"] == "bez_wylomu_brak_zdobycia")
        .unwrap();
    let (_, res) = run(&no_breach["input"]);
    assert!(res.capture.is_none() && res.capture_blocked);
}

#[test]
fn deterministyczne_i_serializowalne() {
    for sc in vectors()["scenarios"].as_array().unwrap() {
        let (a, ra) = run(&sc["input"]);
        let (b, rb) = run(&sc["input"]);
        assert_eq!(a, b);
        assert_eq!(ra, rb);
        let j = serde_json::to_value(&ra).unwrap();
        let back: SiegeBattleResultDto = serde_json::from_value(j).unwrap();
        assert_eq!(back, ra);
    }
}
