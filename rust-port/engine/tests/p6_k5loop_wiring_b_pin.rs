//! R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: zastosowanie wyniku szturmu do stanu (`siege_battle_apply::apply_outcome`) bajt w
//! bajt z wektorami wykonującymi tekst pinu `07d2fbd72` (`p6_k5loop_wiring_b_gen.mjs`: `applyPostBattleMap`,
//! `_battleUnitsForMapExport`, `canCaptureCity`, `consumeReadyMachines`, `isSiegeStillValid`, `endMapSiege`).

use civ_engine::domain::battle_setup_units::Side;
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayableMap, PlayablePlayer, PlayableReplaceUnit,
    PlayableSiegeMachineKind, PlayableState, PlayableTerrain, PlayableTile, PlayableUnit,
    PlayableUnitKind, StartGameParams,
};
use civ_engine::domain::siege_battle_adapter::RosterUnit;
use civ_engine::domain::siege_battle_apply::{apply_outcome, ApplyRosters};
use civ_engine::domain::siege_battle_session::{OutcomeUnit, SessionOutcome};
use civ_engine::domain::siege_tactics_loop::LoopWinner;
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_wiring_b_vectors/vectors.json");
const PIN_SHA256: &str = "cf81ec14ae6a8b84ea6c680169caf0fe62f8850cbf2b194ffa48a39f58973505";

fn f(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn u(v: &Value) -> u64 {
    v.as_u64().expect("u64")
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

fn state_for(inp: &Value) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("start")
        .state()
        .clone();
    let (w, h) = (
        u16::try_from(u(&inp["w"])).unwrap(),
        u16::try_from(u(&inp["h"])).unwrap(),
    );
    let water: Vec<(u64, u64)> = inp["water"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| (u(&p[0]), u(&p[1])))
        .collect();
    let mut tiles = Vec::new();
    for y in 0..h {
        for x in 0..w {
            let t = if water.contains(&(u64::from(x), u64::from(y))) {
                PlayableTerrain::Water
            } else {
                PlayableTerrain::Plains
            };
            tiles.push(PlayableTile {
                position: PositionDto::new(x, y),
                terrain: t,
                passable: t.is_passable(),
            });
        }
    }
    st.map = PlayableMap {
        width: w,
        height: h,
        tiles,
        improvements: Vec::new(),
    };
    st.players.push(PlayablePlayer {
        id: PlayerId::new(101),
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
        CivilizationPair::new(PlayerId::new(1), PlayerId::new(101)),
        Relation::new(50.0, 50.0, status),
    );
    let c = &inp["city"];
    st.cities = vec![PlayableCity {
        id: CityId::new(u(&c["id"])),
        owner_id: PlayerId::new(u(&c["ownerId"])),
        name: "Twierdza".into(),
        position: PositionDto::new(
            u16::try_from(u(&c["q"])).unwrap(),
            u16::try_from(u(&c["r"])).unwrap(),
        ),
        is_capital: false,
        population: 3,
        culture: 0,
    }];
    let cid = CityId::new(u(&c["id"]));
    st.oblegane.clear();
    st.oblegane.insert(cid);
    // Obrona r1 (E05): inne miasta oblegane (`besiegedCityAtHex` w `retreatHexPassable`).
    for x in inp["extraCities"].as_array().unwrap() {
        let id = CityId::new(u(&x["id"]));
        st.cities.push(PlayableCity {
            id,
            owner_id: PlayerId::new(u(&x["ownerId"])),
            name: "Inne".into(),
            position: PositionDto::new(
                u16::try_from(u(&x["q"])).unwrap(),
                u16::try_from(u(&x["r"])).unwrap(),
            ),
            is_capital: false,
            population: 3,
            culture: 0,
        });
        st.oblegane.insert(id);
    }
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
    st.units.clear();
    st.economy.units.clear();
    for x in inp["units"].as_array().unwrap() {
        let id = u(&x["id"]);
        st.units.push(PlayableUnit {
            id: UnitId::new(id),
            owner_id: PlayerId::new(u(&x["ownerId"])),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(
                u16::try_from(u(&x["q"])).unwrap(),
                u16::try_from(u(&x["r"])).unwrap(),
            ),
            movement: f(&x["ruchLeft"]).into(),
            movement_max: f(&x["ruch"]).into(),
            selected: inp["selectedId"].as_u64() == Some(id),
        });
        st.economy.units.insert(
            id,
            PlayableReplaceUnit {
                type_id: Some(x["typeId"].as_str().unwrap().to_owned()),
                hp: Some(f(&x["hp"])),
                battles_survived: x.get("battlesSurvived").map(f),
                ..PlayableReplaceUnit::default()
            },
        );
    }
    // Obrona r1 (E02/E11): zaznaczenie przed wynikiem (`selectedId`, lustro flag `PlayableUnit::selected`).
    st.selected_unit_id = inp["selectedId"].as_u64();
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

/// Porównuje stan po `apply_outcome` z wektorem; zwraca listę różnic (pusta = zgodność bajt w bajt).
fn diffs(sc: &Value) -> Vec<String> {
    let inp = &sc["input"];
    let exp = &sc["expected"];
    let mut st = state_for(inp);
    let atk = roster(&inp["atkRoster"]);
    let def = roster(&inp["defRoster"]);
    let city_id = u(&inp["city"]["id"]);
    let res = apply_outcome(
        &mut st,
        &ApplyRosters {
            city_id,
            anchor_unit_id: atk[0].id.parse().unwrap(),
            atk_roster: &atk,
            def_roster: &def,
        },
        &outcome(inp),
        &scene_ids(inp),
    )
    .expect("apply");
    let mut out = Vec::new();
    let name = sc["name"].as_str().unwrap();
    let got: Vec<(u64, u64, u64, String, String, String)> = st
        .units
        .iter()
        .map(|x| {
            let rep = st.economy.units.get(&x.id.get());
            (
                x.id.get(),
                u64::from(x.position.x()),
                u64::from(x.position.y()),
                format!("{:?}", rep.and_then(|r| r.hp)),
                format!("{:?}", f64::from(x.movement)),
                format!("{:?}", rep.and_then(|r| r.battles_survived)),
            )
        })
        .collect();
    let want: Vec<(u64, u64, u64, String, String, String)> = exp["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| {
            (
                u(&x["id"]),
                u(&x["q"]),
                u(&x["r"]),
                format!("{:?}", Some(f(&x["hp"]))),
                format!("{:?}", f(&x["ruchLeft"])),
                format!("{:?}", x["battlesSurvived"].as_f64()),
            )
        })
        .collect();
    if got != want {
        out.push(format!(
            "{name}: jednostki\n  rust {got:?}\n  pin  {want:?}"
        ));
    }
    let consumed: Vec<String> = res
        .consumed_machines
        .iter()
        .map(|m| format!("{m:?}").to_lowercase())
        .collect();
    let want_consumed: Vec<String> = exp["consumed"]
        .as_array()
        .unwrap()
        .iter()
        .map(|m| m.as_str().unwrap().to_owned())
        .collect();
    if consumed != want_consumed {
        out.push(format!(
            "{name}: consumed {consumed:?} != {want_consumed:?}"
        ));
    }
    let checks = [
        (
            "captureBlocked",
            res.capture_blocked,
            exp["captureBlocked"].as_bool().unwrap(),
        ),
        (
            "t8",
            res.capture_requested.is_some(),
            exp["t8"].as_bool().unwrap(),
        ),
        (
            "oblegane",
            st.oblegane.contains(&CityId::new(city_id)),
            exp["oblegane"].as_bool().unwrap(),
        ),
        (
            "siegeEnded",
            res.siege_ended,
            exp["siegeEnded"].as_bool().unwrap(),
        ),
    ];
    for (what, g, w) in checks {
        if g != w {
            out.push(format!("{name}: {what} rust={g} pin={w}"));
        }
    }
    // `if (mapWinner === 'obronca') selectedId = null` (`main.ts:34713`): pole stanu i flagi jednostek.
    let want_sel = exp["selectedId"].as_u64();
    if st.selected_unit_id != want_sel {
        out.push(format!(
            "{name}: selectedId {:?} != {want_sel:?}",
            st.selected_unit_id
        ));
    }
    for x in &st.units {
        if x.selected != (Some(x.id.get()) == want_sel) {
            out.push(format!("{name}: flaga selected jednostki {}", x.id.get()));
        }
    }
    let ready = st
        .siege_machines_ready
        .get(&CityId::new(city_id))
        .map_or(0, Vec::len);
    if ready != exp["machinesReady"].as_array().unwrap().len() {
        out.push(format!("{name}: machinesReady {ready}"));
    }
    out
}

#[test]
fn wektory_pinu_zastosowania_wyniku_bajt_w_bajt() {
    let v: Value = serde_json::from_str(VECTORS).expect("wektory");
    assert_eq!(v["pinSha256"], PIN_SHA256, "wektory z innego tekstu pinu");
    let scs = v["scenarios"].as_array().expect("scenariusze");
    assert!(
        scs.len() >= 9,
        "co najmniej 9 scenariuszy (obrona r1: E05, E06)"
    );
    let mut all = Vec::new();
    for sc in scs {
        all.extend(diffs(sc));
    }
    assert!(all.is_empty(), "rozbieznosci z pinem:\n{}", all.join("\n"));
}

#[test]
fn wektory_pokrywaja_galezie() {
    let v: Value = serde_json::from_str(VECTORS).expect("wektory");
    let scs = v["scenarios"].as_array().unwrap();
    let has = |f: &dyn Fn(&Value) -> bool| scs.iter().any(f);
    for w in ["atakujacy", "obronca", "remis"] {
        assert!(has(&|s| s["input"]["winner"] == w), "brak zwyciezcy {w}");
    }
    assert!(has(&|s| s["expected"]["t8"] == true), "hak T8");
    assert!(
        has(&|s| s["expected"]["captureBlocked"] == true),
        "mur stoi"
    );
    assert!(
        has(&|s| s["expected"]["siegeEnded"] == true && s["input"]["winner"] != "remis"),
        "validateActiveSieges"
    );
    assert!(
        has(&|s| !s["input"]["water"].as_array().unwrap().is_empty()),
        "woda w fan-out"
    );
    assert!(
        has(&|s| !s["expected"]["consumed"].as_array().unwrap().is_empty()),
        "machiny"
    );
    // Obrona r1: drugie oblegane miasto (E05), kotwica-cywil (E06), zaznaczenie czyszczone i zachowane (E02/E11).
    assert!(
        has(&|s| !s["input"]["extraCities"].as_array().unwrap().is_empty()),
        "oblegane miasto obok"
    );
    assert!(
        has(&|s| s["input"]["atkRoster"][0]["typeId"] == "Osadnik"),
        "kotwica-cywil"
    );
    assert!(
        has(&|s| s["input"]["selectedId"].is_u64() && s["expected"]["selectedId"].is_null()),
        "wygrana obroncy czysci zaznaczenie"
    );
    assert!(
        has(&|s| s["input"]["selectedId"].is_u64() && s["expected"]["selectedId"].is_u64()),
        "inna wygrana zostawia zaznaczenie"
    );
}
