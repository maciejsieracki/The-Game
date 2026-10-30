//! REPIN-WOJNA-2 (U3 + U4) - `gra/src/game/generals.ts` i `gra/src/game/generalQuickFollow.ts` (pin dc8a3adc)
//! z wektorami z URUCHOMIONEGO weba (`tests/p6_repin_wojna_2_vectors/generals.json`,
//! `general-quick-follow.json`; generator `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-generals-vectors.mjs`).

use civ_engine::domain::general_quick_follow::{
    commander_title_genitive, general_quick_follow_action_label, issue_general_quick_follow,
    plan_enabled_general_follow_marches, plan_tracked_general_follow_march,
    sync_tracked_general_follow_marches, FollowCommanderTitle, GeneralQuickFollowEffects,
    GeneralQuickFollowResult, MarchMap, MovementContext, PathPlan, TrackedFollowPlanner,
    TrackedMarchDest,
};
use civ_engine::domain::generals::{
    attempt_general_purchase, can_recruit_general, general_follow_destination,
    general_limit_for_era, general_slots_used, nearest_living_general,
    plan_deferred_general_march_batch, stone_general_unit_id, GeneralPurchaseRequest,
    GeneralRosterCount, GeneralUnit,
};
use serde_json::Value;
use std::collections::HashSet;

const GENERALS: &str = include_str!("p6_repin_wojna_2_vectors/generals.json");
const QUICK: &str = include_str!("p6_repin_wojna_2_vectors/general-quick-follow.json");

fn parse(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory JSON")
}

/// Liczba zapisana jako tekst (`String(x)`, `-0`, `NaN`, `Infinity`).
fn num(v: &Value) -> f64 {
    v.as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("poprawna liczba")
}

/// Porownanie bit-w-bit (rozroznia -0; NaN = NaN).
fn same(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}

fn opt_str(v: Option<&Value>) -> Option<String> {
    v.and_then(|x| x.as_str()).map(str::to_string)
}

fn flag(v: &Value, key: &str) -> bool {
    v[key].as_bool().unwrap_or(false)
}

fn unit(v: &Value) -> GeneralUnit {
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

fn roster(v: &Value) -> Vec<GeneralUnit> {
    v.as_array().expect("roster").iter().map(unit).collect()
}

fn dest(v: &Value) -> TrackedMarchDest {
    TrackedMarchDest {
        dest_q: num(&v["destQ"]),
        dest_r: num(&v["destR"]),
        attack_unit_id: opt_str(v.get("attackUnitId")),
        general_target_id: opt_str(v.get("generalTargetId")),
    }
}

fn dest_eq(got: &TrackedMarchDest, want: &Value) -> bool {
    same(got.dest_q, num(&want["destQ"]))
        && same(got.dest_r, num(&want["destR"]))
        && got.attack_unit_id == opt_str(want.get("attackUnitId"))
        && got.general_target_id == opt_str(want.get("generalTargetId"))
}

fn march_map(entries: &Value) -> MarchMap {
    let mut map = MarchMap::new();
    for pair in entries.as_array().expect("marsze") {
        map.set(pair[0].as_str().expect("id"), dest(&pair[1]));
    }
    map
}

fn assert_marches(got: &MarchMap, want: &Value, case: usize) {
    let want = want.as_array().expect("marsze wynik");
    let got = got.snapshot();
    assert_eq!(got.len(), want.len(), "przypadek {case}: liczba marszy");
    for (i, (pair, expected)) in got.iter().zip(want.iter()).enumerate() {
        assert_eq!(
            pair.0,
            expected[0].as_str().unwrap(),
            "przypadek {case} wpis {i}: id"
        );
        assert!(
            dest_eq(&pair.1, &expected[1]),
            "przypadek {case} wpis {i}: cel {:?}",
            pair.1
        );
    }
}

fn title(text: &str) -> FollowCommanderTitle {
    match text {
        "Wódz" => FollowCommanderTitle::Wodz,
        "Generał" => FollowCommanderTitle::General,
        other => panic!("nieznany tytul {other}"),
    }
}

// ---------------------------------------------------------------------------
// generals.ts (U3)
// ---------------------------------------------------------------------------

#[test]
fn limit_for_era_matches_web() {
    let v = parse(GENERALS);
    let cases = v["limit"].as_array().unwrap();
    assert!(cases.len() >= 20);
    for (i, c) in cases.iter().enumerate() {
        let got = general_limit_for_era(num(&c["era"]));
        assert!(
            same(got, num(&c["out"])),
            "przypadek {i}: {got} vs {}",
            c["out"]
        );
    }
}

#[test]
fn slots_used_matches_web() {
    let v = parse(GENERALS);
    for (i, c) in v["slots"].as_array().unwrap().iter().enumerate() {
        let got = general_slots_used(GeneralRosterCount {
            alive: num(&c["alive"]),
            queued: num(&c["queued"]),
        });
        assert!(same(got, num(&c["out"])), "przypadek {i}: {got}");
    }
}

#[test]
fn can_recruit_matches_web() {
    let v = parse(GENERALS);
    let cases = v["canRecruit"].as_array().unwrap();
    assert!(cases.len() >= 100);
    for (i, c) in cases.iter().enumerate() {
        let got = can_recruit_general(
            num(&c["era"]),
            GeneralRosterCount {
                alive: num(&c["alive"]),
                queued: num(&c["queued"]),
            },
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "przypadek {i}");
    }
}

#[test]
fn stone_unit_matches_web() {
    let v = parse(GENERALS);
    for c in v["stone"].as_array().unwrap() {
        assert_eq!(
            stone_general_unit_id(c["hasWheel"].as_bool().unwrap()),
            c["out"].as_str().unwrap()
        );
    }
}

#[test]
fn purchase_matches_web_and_calls_continuation_only_when_valid() {
    let v = parse(GENERALS);
    let cases = v["purchase"].as_array().unwrap();
    let mut called_total = 0;
    for (i, c) in cases.iter().enumerate() {
        let r = &c["request"];
        let req = GeneralPurchaseRequest {
            city_id: r["cityId"].as_str().unwrap().to_string(),
            capital_city_id: r["capitalCityId"].as_str().unwrap().to_string(),
            era: num(&r["era"]),
            requested_quantity: num(&r["requestedQuantity"]),
            requested_item_id: r["requestedItemId"].as_str().unwrap().to_string(),
            requested_cost: num(&r["requestedCost"]),
            offered_item_id: opt_str(r.get("offeredItemId")),
            offered_cost: r.get("offeredCost").filter(|x| !x.is_null()).map(num),
            roster: GeneralRosterCount {
                alive: num(&r["alive"]),
                queued: num(&r["queued"]),
            },
        };
        let mut called = false;
        let returns = c["purchaseReturns"].as_bool().unwrap();
        let got = attempt_general_purchase(&req, || {
            called = true;
            returns
        });
        assert_eq!(got, c["out"].as_bool().unwrap(), "przypadek {i}: wynik");
        assert_eq!(
            called,
            c["called"].as_bool().unwrap(),
            "przypadek {i}: wywolanie zakupu"
        );
        if called {
            called_total += 1;
        }
    }
    assert!(
        called_total >= 50,
        "za malo przypadkow z wywolaniem zakupu: {called_total}"
    );
}

#[test]
fn nearest_living_general_matches_web() {
    let v = parse(GENERALS);
    let cases = v["nearest"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for (i, c) in cases.iter().enumerate() {
        let unit = unit(&c["unit"]);
        let roster = roster(&c["roster"]);
        let got = nearest_living_general(&unit, &roster).map(|g| g.id.clone());
        assert_eq!(got.as_deref(), c["out"].as_str(), "przypadek {i}");
    }
}

#[test]
fn general_follow_destination_matches_web() {
    let v = parse(GENERALS);
    for (i, c) in v["followDest"].as_array().unwrap().iter().enumerate() {
        let own = unit(&c["unit"]);
        let general = c["general"].as_object().map(|_| unit(&c["general"]));
        let got = general_follow_destination(&own, general.as_ref());
        match (got, c["out"].as_object()) {
            (None, None) => {}
            (Some(g), Some(want)) => {
                assert!(same(g.q, num(&c["out"]["q"])), "przypadek {i}: q");
                assert!(same(g.r, num(&c["out"]["r"])), "przypadek {i}: r");
                assert_eq!(
                    g.general_target_id,
                    want["generalTargetId"].as_str().unwrap(),
                    "przypadek {i}"
                );
            }
            (got, want) => panic!("przypadek {i}: {got:?} vs {want:?}"),
        }
    }
}

#[test]
fn deferred_batch_matches_web() {
    let v = parse(GENERALS);
    for (i, c) in v["batch"].as_array().unwrap().iter().enumerate() {
        let ids: Vec<String> = c["unitIds"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        let plan = c["planResult"].as_object().unwrap();
        let mut enqueued: Vec<Vec<String>> = Vec::new();
        let marching = plan_deferred_general_march_batch(
            &ids,
            |id| plan[id].as_bool().unwrap(),
            |list| enqueued.push(list.to_vec()),
        );
        let want_marching: Vec<String> = c["marching"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(marching, want_marching, "przypadek {i}: zaplanowane");
        let want_enq: Vec<Vec<String>> = c["enqueued"]
            .as_array()
            .unwrap()
            .iter()
            .map(|l| {
                l.as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_str().unwrap().to_string())
                    .collect()
            })
            .collect();
        assert_eq!(enqueued, want_enq, "przypadek {i}: kolejkowanie");
    }
}

// ---------------------------------------------------------------------------
// generalQuickFollow.ts (U4)
// ---------------------------------------------------------------------------

#[test]
fn labels_match_web() {
    let v = parse(QUICK);
    for c in v["labels"].as_array().unwrap() {
        let t = title(c["title"].as_str().unwrap());
        let active = c["active"].as_bool().unwrap_or(false);
        assert_eq!(commander_title_genitive(t), c["genitive"].as_str().unwrap());
        assert_eq!(
            general_quick_follow_action_label(t, active),
            c["label"].as_str().unwrap()
        );
    }
}

#[test]
fn plan_enabled_matches_web() {
    let v = parse(QUICK);
    let cases = v["planEnabled"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for (i, c) in cases.iter().enumerate() {
        let roster = roster(&c["roster"]);
        let has: HashSet<String> = c["hasMarch"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        let plan = c["planResult"].as_object().unwrap();
        let mut calls: Vec<(String, f64, f64, String)> = Vec::new();
        let planned = plan_enabled_general_follow_marches(
            &roster,
            |id| has.contains(id),
            |u, point, target| {
                calls.push((u.id.clone(), point.0, point.1, target.to_string()));
                plan[&u.id].as_bool().unwrap()
            },
        );
        let want_planned: Vec<String> = c["planned"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(planned, want_planned, "przypadek {i}: zaplanowane");
        let want_calls = c["calls"].as_array().unwrap();
        assert_eq!(
            calls.len(),
            want_calls.len(),
            "przypadek {i}: liczba wywolan"
        );
        for (call, want) in calls.iter().zip(want_calls) {
            assert_eq!(call.0, want[0].as_str().unwrap(), "przypadek {i}: id");
            assert!(
                same(call.1, num(&want[1])) && same(call.2, num(&want[2])),
                "przypadek {i}: punkt"
            );
            assert_eq!(call.3, want[3].as_str().unwrap(), "przypadek {i}: cel");
        }
    }
}

struct MockEffects {
    plan_result: bool,
    movement_left: f64,
    calls: Vec<(String, f64, f64, String)>,
    notes: Vec<(String, f64)>,
    enqueued: Vec<Vec<String>>,
    refreshes: usize,
}

impl GeneralQuickFollowEffects for MockEffects {
    fn plan_march(&mut self, unit: &GeneralUnit, point: (f64, f64), target_id: &str) -> bool {
        self.calls
            .push((unit.id.clone(), point.0, point.1, target_id.to_string()));
        self.plan_result
    }
    fn movement_left(&self, _unit: &GeneralUnit) -> f64 {
        self.movement_left
    }
    fn enqueue(&mut self, unit_ids: &[String]) {
        self.enqueued.push(unit_ids.to_vec());
    }
    fn notify(&mut self, message: &str, duration_ms: f64) {
        self.notes.push((message.to_string(), duration_ms));
    }
    fn refresh(&mut self) {
        self.refreshes += 1;
    }
}

#[test]
fn issue_matches_web() {
    let v = parse(QUICK);
    let cases = v["issue"].as_array().unwrap();
    assert!(cases.len() >= 200);
    let mut issued = 0;
    for (i, c) in cases.iter().enumerate() {
        let unit = unit(&c["unit"]);
        let roster = roster(&c["roster"]);
        let mut fx = MockEffects {
            plan_result: c["planResult"].as_bool().unwrap(),
            movement_left: num(&c["movementLeft"]),
            calls: Vec::new(),
            notes: Vec::new(),
            enqueued: Vec::new(),
            refreshes: 0,
        };
        let got = issue_general_quick_follow(
            &unit,
            &roster,
            title(c["title"].as_str().unwrap()),
            &mut fx,
        );
        let want = match c["out"].as_str().unwrap() {
            "issued" => GeneralQuickFollowResult::Issued,
            "unavailable" => GeneralQuickFollowResult::Unavailable,
            "unreachable" => GeneralQuickFollowResult::Unreachable,
            "ineligible" => GeneralQuickFollowResult::Ineligible,
            other => panic!("wynik {other}"),
        };
        if got == GeneralQuickFollowResult::Issued {
            issued += 1;
        }
        assert_eq!(got, want, "przypadek {i}: wynik");
        let want_notes = c["notes"].as_array().unwrap();
        assert_eq!(
            fx.notes.len(),
            want_notes.len(),
            "przypadek {i}: liczba komunikatow"
        );
        for (note, w) in fx.notes.iter().zip(want_notes) {
            assert_eq!(note.0, w[0].as_str().unwrap(), "przypadek {i}: tresc");
            assert!(same(note.1, num(&w[1])), "przypadek {i}: czas");
        }
        assert_eq!(
            fx.refreshes,
            c["refreshes"].as_u64().unwrap() as usize,
            "przypadek {i}: refresh"
        );
        let want_enq: Vec<Vec<String>> = c["enqueued"]
            .as_array()
            .unwrap()
            .iter()
            .map(|l| {
                l.as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_str().unwrap().to_string())
                    .collect()
            })
            .collect();
        assert_eq!(fx.enqueued, want_enq, "przypadek {i}: kolejka");
        assert_eq!(
            fx.calls.len(),
            c["calls"].as_array().unwrap().len(),
            "przypadek {i}: planMarch"
        );
    }
    assert!(issued >= 20, "za malo przypadkow 'issued': {issued}");
}

/// Planner zapisujacy wywolania w kolejnosci (jak stub webowy).
struct MockPlanner {
    owner: f64,
    can_occupy: bool,
    reachable: bool,
    full_path_len: usize,
    occupied: HashSet<String>,
    per_turn: f64,
    marches: MarchMap,
    log: Vec<LogEntry>,
}

/// Wpis logu planera: (rodzaj, id jednostki, cel dla `sync`).
type LogEntry = (String, String, Option<SyncArgs>);
/// Argumenty `syncAttackTarget`: (destQ, destR, generalTargetId).
type SyncArgs = (f64, f64, Option<String>);

impl TrackedFollowPlanner for MockPlanner {
    fn player_owner_id(&self) -> f64 {
        self.owner
    }
    fn can_occupy(&self, _unit: &GeneralUnit, _q: f64, _r: f64) -> bool {
        self.can_occupy
    }
    fn movement_context(&self, unit: &GeneralUnit) -> MovementContext {
        MovementContext {
            mover: unit.clone(),
            occupied: self.occupied.clone(),
            per_turn: self.per_turn,
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
            full_path_len: self.full_path_len,
        }
    }
    fn clear_auto_explore(&mut self, unit: &GeneralUnit) {
        self.log.push(("clear".into(), unit.id.clone(), None));
    }
    fn mark_player_moved(&mut self, unit_id: &str) {
        self.log.push(("mark".into(), unit_id.to_string(), None));
    }
    fn marches(&mut self) -> &mut MarchMap {
        &mut self.marches
    }
    fn sync_attack_target(&mut self, unit_id: &str, destination: &TrackedMarchDest) {
        self.log.push((
            "sync".into(),
            unit_id.to_string(),
            Some((
                destination.dest_q,
                destination.dest_r,
                destination.general_target_id.clone(),
            )),
        ));
    }
}

#[test]
fn tracked_march_matches_web() {
    let v = parse(QUICK);
    let cases = v["tracked"].as_array().unwrap();
    assert!(cases.len() >= 200);
    let mut ok_count = 0;
    for (i, c) in cases.iter().enumerate() {
        let unit = unit(&c["unit"]);
        let point = (num(&c["point"]["q"]), num(&c["point"]["r"]));
        let target = opt_str(c.get("generalTargetId"));
        let mut planner = MockPlanner {
            owner: 0.0,
            can_occupy: c["canOccupy"].as_bool().unwrap(),
            reachable: c["reachable"].as_bool().unwrap(),
            full_path_len: c["fullPathLen"].as_u64().unwrap() as usize,
            occupied: c["occupied"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_string())
                .collect(),
            per_turn: num(&c["perTurn"]),
            marches: march_map(&c["initial"]),
            log: Vec::new(),
        };
        let got = plan_tracked_general_follow_march(
            &unit,
            point,
            target.as_deref(),
            &mut planner,
            c["markAsPlayerIssued"].as_bool().unwrap(),
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "przypadek {i}: wynik");
        if got {
            ok_count += 1;
        }
        let want_log = c["log"].as_array().unwrap();
        assert_eq!(
            planner.log.len(),
            want_log.len(),
            "przypadek {i}: dlugosc logu"
        );
        for (entry, w) in planner.log.iter().zip(want_log) {
            assert_eq!(entry.0, w[0].as_str().unwrap(), "przypadek {i}: rodzaj");
            assert_eq!(entry.1, w[1].as_str().unwrap(), "przypadek {i}: id");
            if w[0].as_str() == Some("sync") {
                let (q, r, tgt) = entry.2.clone().expect("dane sync");
                assert!(
                    same(q, num(&w[2])) && same(r, num(&w[3])),
                    "przypadek {i}: cel sync"
                );
                assert_eq!(
                    tgt,
                    opt_str(Some(&w[4])),
                    "przypadek {i}: generalTargetId sync"
                );
            }
        }
        assert_marches(&planner.marches, &c["marches"], i);
    }
    assert!(ok_count >= 40, "za malo przypadkow udanych: {ok_count}");
}

#[test]
fn sync_tracked_matches_web() {
    let v = parse(QUICK);
    let cases = v["sync"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for (i, c) in cases.iter().enumerate() {
        let units = roster(&c["units"]);
        let mut marches = march_map(&c["initial"]);
        let mut cleared: Vec<String> = Vec::new();
        sync_tracked_general_follow_marches(&units, &mut marches, |id| {
            cleared.push(id.to_string())
        });
        let want_cleared: Vec<String> = c["cleared"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(cleared, want_cleared, "przypadek {i}: wyczyszczone");
        assert_marches(&marches, &c["marches"], i);
    }
}
