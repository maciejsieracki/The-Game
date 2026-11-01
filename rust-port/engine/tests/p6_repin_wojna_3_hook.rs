//! REPIN-WOJNA-3 - hook marszu generala (`generalQuickFollow.ts` <-> `planned-march.ts`) i zapis gry,
//! pin weba `4bbef081d`. Wektory z URUCHOMIONEGO weba: `tests/p6_repin_wojna_3_vectors/hook.json`
//! (generator `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-3-Q1/gen-repin-wojna-3-hook-vectors.mjs`).
//!
//! Lancuch (jak `syncGeneralMarchTargets`, `main.ts:28237-28250`, zapis `main.ts:33399/33458-33459`,
//! odczyt `main.ts:42052`): roster -> sync -> planEnabled (REALNE `planTrackedGeneralFollowMarch`) ->
//! kolejka wykonania -> `plannedMarchesToSave` -> JSON zapisu weba (obiekt kluczowany id jednostki) ->
//! `SaveSnapshot` -> `plannedMarchesFromSave`.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

use civ_engine::domain::general_quick_follow::{
    plan_tracked_general_follow_march, sync_general_march_targets, MarchMap, MovementContext,
    PathPlan, TrackedFollowPlanner, TrackedMarchDest,
};
use civ_engine::domain::generals::GeneralUnit;
use civ_engine::domain::pathfinding::ruch_jednostek::{
    planned_marches_from_save, AutoMarchSave, PlannedMarchDest, PlannedMarchSaved, RuchJednostka,
};
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{SaveSnapshot, SavedPlannedMarch, TurnPhase};
use serde_json::{Number, Value};
use std::collections::HashSet;

const HOOK: &str = include_str!("p6_repin_wojna_3_vectors/hook.json");

fn parse(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory JSON")
}

fn num(v: &Value) -> f64 {
    v.as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("poprawna liczba")
}

fn opt_str(v: Option<&Value>) -> Option<String> {
    v.and_then(|x| x.as_str()).map(str::to_string)
}

fn flag(v: &Value, key: &str) -> bool {
    v[key].as_bool().unwrap_or(false)
}

fn general_unit(v: &Value) -> GeneralUnit {
    GeneralUnit {
        id: v["id"].as_str().expect("id").to_string(),
        owner_id: num(&v["ownerId"]),
        q: num(&v["q"]),
        r: num(&v["r"]),
        is_general: flag(v, "isGeneral"),
        hp: v.get("hp").map(num),
        dead: flag(v, "dead"),
        removed: flag(v, "removed"),
        routed: flag(v, "routed"),
        in_garnizon: flag(v, "inGarnizon"),
        oblega_city_id: opt_str(v.get("oblegaCityId")),
        follow_general: flag(v, "followGeneral"),
    }
}

fn ruch_unit(v: &Value) -> RuchJednostka {
    RuchJednostka::new(
        v["id"].as_str().expect("id"),
        num(&v["ownerId"]) as i64,
        "piechota",
        num(&v["q"]) as i32,
        num(&v["r"]) as i32,
    )
}

fn dest(v: &Value) -> PlannedMarchDest {
    PlannedMarchDest {
        dest_q: v["destQ"].as_f64().expect("destQ"),
        dest_r: v["destR"].as_f64().expect("destR"),
        attack_unit_id: opt_str(v.get("attackUnitId")),
        general_target_id: opt_str(v.get("generalTargetId")),
    }
}

fn entries(v: &Value) -> Vec<(String, PlannedMarchDest)> {
    v.as_array()
        .expect("wpisy")
        .iter()
        .map(|pair| (pair[0].as_str().expect("id").to_string(), dest(&pair[1])))
        .collect()
}

fn ruch_left(unit: &GeneralUnit) -> f64 {
    // Regula wektora: `(q + r)` parzyste => 2, inaczej 0 (generator, `planningStackRuchLeft`).
    if ((unit.q + unit.r) as i64) % 2 == 0 {
        2.0
    } else {
        0.0
    }
}

/// Planer (web `planGeneralFollowMarch`): zapisuje do wspolnej mapy marszy, loguje efekty.
struct Planner<'a> {
    marches: &'a mut MarchMap,
    blocked: &'a HashSet<String>,
    reachable: bool,
    log: &'a mut Vec<(String, String)>,
}

impl TrackedFollowPlanner for Planner<'_> {
    fn player_owner_id(&self) -> f64 {
        0.0
    }
    fn can_occupy(&self, unit: &GeneralUnit, _q: f64, _r: f64) -> bool {
        !self.blocked.contains(&unit.id)
    }
    fn movement_context(&self, unit: &GeneralUnit) -> MovementContext {
        MovementContext {
            mover: unit.clone(),
            occupied: HashSet::new(),
            per_turn: 3.0,
        }
    }
    fn path_plan(
        &self,
        _mover: &GeneralUnit,
        _q: f64,
        _r: f64,
        _occupied: &HashSet<String>,
        _per_turn: f64,
    ) -> PathPlan {
        PathPlan {
            reachable: self.reachable,
            full_path_len: usize::from(self.reachable),
        }
    }
    fn clear_auto_explore(&mut self, unit: &GeneralUnit) {
        self.log.push(("clear".into(), unit.id.clone()));
    }
    fn mark_player_moved(&mut self, unit_id: &str) {
        self.log.push(("mark".into(), unit_id.to_string()));
    }
    fn marches(&mut self) -> &mut MarchMap {
        self.marches
    }
    fn sync_attack_target(&mut self, unit_id: &str, _destination: &TrackedMarchDest) {
        self.log.push(("sync".into(), unit_id.to_string()));
    }
}

fn valid_state() -> GameStateDto {
    let map = MapDto::new(
        2,
        1,
        vec![
            civ_engine::TileDto::new(PositionDto::new(0, 0), TerrainDto::Plains),
            civ_engine::TileDto::new(PositionDto::new(1, 0), TerrainDto::Hills),
        ],
    )
    .expect("map is valid");
    let civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(8)],
    )
    .expect("civilization is valid");
    let city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city is valid");
    let unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit is valid");
    GameStateDto::new(
        map,
        vec![civilization],
        vec![city],
        vec![unit],
        TurnDto::new(3).expect("turn three is valid"),
    )
    .expect("state is valid")
}

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

/// Snapshot JSON z polami zapisu weba doklejonymi DOSLOWNIE (`autoMarch`, `plannedMarches` jako
/// obiekt kluczowany id, kolejnosc kluczy jak w `JSON.stringify` weba - bez przejscia przez
/// `serde_json::Value`, ktory sortuje klucze).
fn wire_snapshot_json(web_save_json: &str) -> String {
    let base = serde_json::to_string(&snapshot()).expect("serializes");
    let body = web_save_json
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .expect("obiekt zapisu");
    if body.is_empty() {
        return base;
    }
    let head = base.strip_suffix('}').expect("obiekt snapshotu");
    format!("{head},{body}}}")
}

fn saved_pairs(decoded: &SaveSnapshot) -> Vec<(String, Option<PlannedMarchSaved>)> {
    decoded
        .planned_marches()
        .iter()
        .map(|e| {
            (
                e.unit_id.clone(),
                Some(PlannedMarchSaved {
                    dest_q: e.dest_q.as_ref().and_then(Number::as_f64),
                    dest_r: e.dest_r.as_ref().and_then(Number::as_f64),
                    attack_unit_id: e.attack_unit_id.clone(),
                    general_target_id: e.general_target_id.clone(),
                }),
            )
        })
        .collect()
}

fn auto_march_of(decoded: &SaveSnapshot) -> Option<AutoMarchSave> {
    decoded.auto_march().map(|saved| AutoMarchSave {
        leader_id: saved.leader_id.clone(),
        dest_q: saved.dest_q.as_ref().and_then(Number::as_f64),
        dest_r: saved.dest_r.as_ref().and_then(Number::as_f64),
    })
}

/// Lancuch weba krok po kroku (sync + planEnabled + kolejka) na wektorach.
#[test]
fn sync_plan_and_queue_match_web() {
    let root = parse(HOOK);
    let cases = root["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 700);
    let (mut planned_total, mut queued_total) = (0usize, 0usize);
    for (i, c) in cases.iter().enumerate() {
        let units: Vec<GeneralUnit> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(general_unit)
            .collect();
        let mut marches = MarchMap::from_entries(entries(&c["initial"]));
        let blocked: HashSet<String> = c["blocked"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        let reachable = c["reachable"].as_bool().unwrap();
        let mut cleared: Vec<String> = Vec::new();
        let mut log: Vec<(String, String)> = Vec::new();
        let mut planned_ids: Vec<String> = Vec::new();
        let mut exec_queue: Vec<String> = c["execQueueBefore"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        sync_general_march_targets(
            &units,
            &mut marches,
            |id| cleared.push(id.to_string()),
            |map, unit, point, target| {
                let mut planner = Planner {
                    marches: map,
                    blocked: &blocked,
                    reachable,
                    log: &mut log,
                };
                let ok = plan_tracked_general_follow_march(
                    unit,
                    point,
                    Some(target),
                    &mut planner,
                    false,
                );
                if ok {
                    planned_ids.push(unit.id.clone());
                }
                ok
            },
            ruch_left,
            &mut exec_queue,
        );
        let want_cleared: Vec<String> = c["cleared"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(cleared, want_cleared, "przypadek {i}: wyczyszczone");
        let want_new: Vec<String> = c["newly"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(planned_ids, want_new, "przypadek {i}: nowo zaplanowane");
        let want_queue: Vec<String> = c["execQueue"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(exec_queue, want_queue, "przypadek {i}: kolejka wykonania");
        let want_log = c["log"].as_array().unwrap();
        assert_eq!(log.len(), want_log.len(), "przypadek {i}: log planera");
        for (entry, w) in log.iter().zip(want_log) {
            assert_eq!(entry.0, w[0].as_str().unwrap(), "przypadek {i}: log rodzaj");
            assert_eq!(entry.1, w[1].as_str().unwrap(), "przypadek {i}: log id");
        }
        assert_eq!(
            marches.snapshot(),
            entries(&c["afterPlan"]),
            "przypadek {i}: mapa marszy"
        );
        for pair in c["followOff"].as_array().unwrap() {
            assert_eq!(
                marches.follow_off_clears(pair[0].as_str().unwrap()),
                pair[1].as_bool().unwrap(),
                "przypadek {i}: follow-off {pair}"
            );
        }
        for pair in c["preplanned"].as_array().unwrap() {
            assert_eq!(
                marches.is_general_follow(pair[0].as_str().unwrap()),
                pair[1].as_bool().unwrap(),
                "przypadek {i}: preplanned {pair}"
            );
        }
        planned_total += planned_ids.len();
        queued_total += exec_queue.len();
    }
    assert!(
        planned_total >= 300,
        "pokrycie planEnabled: {planned_total}"
    );
    assert!(queued_total >= 300, "pokrycie kolejki: {queued_total}");
}

/// Zapis (Rust `to_save`) = zapis weba; odczyt przez `SaveSnapshot` z JSON-em weba (obiekt
/// kluczowany id) = `plannedMarchesFromSave` weba, w tym KOLEJNOSC wpisow.
#[test]
fn save_and_load_through_web_wire_json_match_web() {
    let root = parse(HOOK);
    let cases = root["cases"].as_array().expect("cases");
    let (mut non_alpha, mut with_general, mut empty_saves) = (0usize, 0usize, 0usize);
    for (i, c) in cases.iter().enumerate() {
        let marches = MarchMap::from_entries(entries(&c["afterPlan"]));
        let out = marches.to_save();
        let web_save = c["saveJson"].as_str().expect("saveJson");
        // Rust `to_save` == web `plannedMarchesToSave` (kolejnosc, pola, autoMarch = pierwszy wpis).
        let web_parsed: Value = serde_json::from_str(web_save).expect("saveJson parse");
        match &out.planned_marches {
            None => {
                assert_eq!(web_save, "{}", "przypadek {i}: pusty zapis");
                empty_saves += 1;
            }
            Some(list) => {
                let want = web_parsed["plannedMarches"].as_object().expect("obiekt");
                assert_eq!(list.len(), want.len(), "przypadek {i}: liczba wpisow");
                for (uid, d) in list {
                    let w = &want[uid];
                    assert_eq!(d.dest_q, w["destQ"].as_f64().unwrap(), "przypadek {i}");
                    assert_eq!(d.dest_r, w["destR"].as_f64().unwrap(), "przypadek {i}");
                    assert_eq!(d.attack_unit_id, opt_str(w.get("attackUnitId")));
                    assert_eq!(d.general_target_id, opt_str(w.get("generalTargetId")));
                }
                let (leader, q, r) = out.auto_march.clone().expect("autoMarch");
                let want_auto = &web_parsed["autoMarch"];
                assert_eq!(Some(leader.as_str()), want_auto["leaderId"].as_str());
                assert_eq!(q, want_auto["destQ"].as_f64().unwrap());
                assert_eq!(r, want_auto["destR"].as_f64().unwrap());
            }
        }

        // Odczyt: JSON weba -> SaveSnapshot -> plannedMarchesFromSave.
        let wire = wire_snapshot_json(web_save);
        let decoded: SaveSnapshot = serde_json::from_str(&wire).expect("decodes");
        let units: Vec<RuchJednostka> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(ruch_unit)
            .collect();
        let pairs = saved_pairs(&decoded);
        let auto = auto_march_of(&decoded);
        let got = planned_marches_from_save(auto.as_ref(), Some(&pairs), &units, 0);
        let want = entries(&c["loaded"]);
        assert_eq!(
            got, want,
            "przypadek {i}: wczytane marsze (kolejnosc i pola)"
        );
        if want.iter().any(|(_, d)| d.general_target_id.is_some()) {
            with_general += 1;
        }
        let keys: Vec<&String> = web_parsed
            .get("plannedMarches")
            .and_then(Value::as_object)
            .map(|o| o.keys().collect())
            .unwrap_or_default();
        // `serde_json::Value` sortuje klucze; kolejnosc weba bierzemy z samego napisu (indeks w tekscie).
        let mut by_pos: Vec<(usize, &String)> = keys
            .iter()
            .map(|k| (web_save.find(&format!("\"{k}\":{{")).expect("pozycja"), *k))
            .collect();
        by_pos.sort();
        let web_order: Vec<&String> = by_pos.into_iter().map(|(_, k)| k).collect();
        let mut sorted = web_order.clone();
        sorted.sort();
        if web_order != sorted {
            non_alpha += 1;
        }
    }
    assert!(non_alpha >= 100, "pokrycie kolejnosci kluczy: {non_alpha}");
    assert!(
        with_general >= 300,
        "pokrycie generalTargetId: {with_general}"
    );
    assert!(empty_saves >= 1, "pokrycie pustego zapisu");
}

/// Rust save -> Rust load: zapis wlasny (lista wpisow) odtwarza sie 1:1, razem z `generalTargetId`
/// i kolejnoscia, a odczyt przez `plannedMarchesFromSave` zgadza sie z webem.
#[test]
fn rust_save_then_load_round_trip_matches_web_vector() {
    let root = parse(HOOK);
    let cases = root["cases"].as_array().expect("cases");
    for (i, c) in cases.iter().enumerate() {
        let marches = MarchMap::from_entries(entries(&c["afterPlan"]));
        let out = marches.to_save();
        let saved: Vec<SavedPlannedMarch> = out
            .planned_marches
            .iter()
            .flatten()
            .map(|(uid, d)| SavedPlannedMarch {
                unit_id: uid.clone(),
                dest_q: Number::from_f64(d.dest_q),
                dest_r: Number::from_f64(d.dest_r),
                attack_unit_id: d.attack_unit_id.clone(),
                general_target_id: d.general_target_id.clone(),
            })
            .collect();
        let original = snapshot().with_planned_marches(saved);
        let encoded = serde_json::to_string(&original).expect("serializes");
        let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("decodes");
        assert_eq!(decoded, original, "przypadek {i}: round-trip Rust");
        let units: Vec<RuchJednostka> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(ruch_unit)
            .collect();
        let pairs = saved_pairs(&decoded);
        let auto = out.auto_march.as_ref().map(|(leader, q, r)| AutoMarchSave {
            leader_id: Some(leader.clone()),
            dest_q: Some(*q),
            dest_r: Some(*r),
        });
        let got = planned_marches_from_save(auto.as_ref(), Some(&pairs), &units, 0);
        assert_eq!(
            got,
            entries(&c["loaded"]),
            "przypadek {i}: odczyt po zapisie Rust"
        );
    }
}

/// Kolejnosc kluczy obiektu `plannedMarches` jak w JS (`Object.keys` po `JSON.parse`, node v22):
/// klucze-indeksy tablicy rosnaco, reszta w kolejnosci wstawiania. Oczekiwanie ZMIERZONE:
/// `JSON.parse('{"b":1,"7":2,"a":3,"2":4,"4294967295":5,"007":6,"4294967294":7,"-1":8,"1.5":9}')`
/// -> `["2","7","4294967294","b","a","4294967295","007","-1","1.5"]`.
#[test]
fn object_key_order_matches_js_object_keys() {
    let keys = [
        "b",
        "7",
        "a",
        "2",
        "4294967295",
        "007",
        "4294967294",
        "-1",
        "1.5",
    ];
    let body: Vec<String> = keys
        .iter()
        .map(|k| format!("\"{k}\":{{\"destQ\":1,\"destR\":2}}"))
        .collect();
    let base = serde_json::to_string(&snapshot()).expect("serializes");
    let head = base.strip_suffix('}').expect("obiekt");
    let wire = format!("{head},\"plannedMarches\":{{{}}}}}", body.join(","));
    let decoded: SaveSnapshot = serde_json::from_str(&wire).expect("decodes");
    let got: Vec<&str> = decoded
        .planned_marches()
        .iter()
        .map(|e| e.unit_id.as_str())
        .collect();
    assert_eq!(
        got,
        [
            "2",
            "7",
            "4294967294",
            "b",
            "a",
            "4294967295",
            "007",
            "-1",
            "1.5"
        ]
    );
}

/// `null` / liczba / napis zamiast `plannedMarches` = pusta lista (web: `typeof !== 'object'` / `null`).
#[test]
fn non_container_planned_marches_read_as_empty() {
    let base = serde_json::to_string(&snapshot()).expect("serializes");
    let head = base.strip_suffix('}').expect("obiekt");
    for raw in ["null", "5", "\"x\"", "true", "1.5", "{}", "[]"] {
        let wire = format!("{head},\"plannedMarches\":{raw}}}");
        let decoded: SaveSnapshot = serde_json::from_str(&wire).expect("decodes");
        assert!(decoded.planned_marches().is_empty(), "{raw}");
    }
}

/// `JSON.parse` z powtorzonym kluczem: pierwsza pozycja, ostatnia wartosc
/// (ZMIERZONE node v22: `Object.entries(JSON.parse('{"a":{"destQ":1,"destR":1},"b":{"destQ":2,"destR":2},"a":{"destQ":3,"destR":3}}'))`
/// -> `[["a",{destQ:3,destR:3}],["b",{destQ:2,destR:2}]]`).
#[test]
fn duplicate_object_key_keeps_first_position_and_last_value() {
    let base = serde_json::to_string(&snapshot()).expect("serializes");
    let head = base.strip_suffix('}').expect("obiekt");
    let wire = format!(
        "{head},\"plannedMarches\":{{\"a\":{{\"destQ\":1,\"destR\":1}},\"b\":{{\"destQ\":2,\"destR\":2}},\"a\":{{\"destQ\":3,\"destR\":3}}}}}}"
    );
    let decoded: SaveSnapshot = serde_json::from_str(&wire).expect("decodes");
    let got: Vec<(&str, f64)> = decoded
        .planned_marches()
        .iter()
        .map(|e| {
            (
                e.unit_id.as_str(),
                e.dest_q.as_ref().and_then(Number::as_f64).unwrap(),
            )
        })
        .collect();
    assert_eq!(got, [("a", 3.0), ("b", 2.0)]);
}

/// `MarchMap::from_entries` = kolejne `Map.set` (powtorzony klucz zachowuje pozycje).
#[test]
fn march_map_from_entries_behaves_like_js_map_set() {
    let d = |q: f64| PlannedMarchDest {
        dest_q: q,
        dest_r: 0.0,
        attack_unit_id: None,
        general_target_id: None,
    };
    let map = MarchMap::from_entries(vec![
        ("a".to_string(), d(1.0)),
        ("b".to_string(), d(2.0)),
        ("a".to_string(), d(3.0)),
    ]);
    assert_eq!(
        map.snapshot(),
        vec![("a".to_string(), d(3.0)), ("b".to_string(), d(2.0))]
    );
    assert!(!map.follow_off_clears("missing"));
    assert!(!map.is_general_follow("missing"));
}
