//! P6 EXEC T1 (R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1): testy kolejki rozkazow `player_order_queue`.
//!
//! Oczekiwania pochodza z wykonania kodu pinu `07d2fbd72` (`_executeUnitsImmediate`, `battleScene.ts:18578-18614`)
//! przez `tests/p6_player_order_queue_gen.mjs`; plik `p6_player_order_queue_vectors/vectors.json` to wynik tego generatora.
//! Zdarzenia zapisujemy w postaci tekstowej: `suspend:false`, `perform:<id>`, `schedule:40`, `refresh`.
//! Lista `acted` to kolejne `u.acted = true` (callback `done`, `battleScene.ts:18609`).

use std::collections::{BTreeMap, BTreeSet, VecDeque};

use civ_engine::domain::player_order_queue::{
    self as q, OrderOutcome, OrderQueueEvent, PlayerOrderExec, PlayerUnitFlags, StepResult,
};
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_player_order_queue_vectors/vectors.json");

/// Atrapa sceny: jednostki, kolejka `busy`, rozkazy asynchroniczne i skutki uboczne rozkazu.
struct Mock {
    units: BTreeMap<String, PlayerUnitFlags>,
    queued: BTreeSet<String>,
    busy_seq: VecDeque<bool>,
    async_ids: BTreeSet<String>,
    side_effects: BTreeMap<String, Vec<(String, String, bool)>>,
    acted_log: Vec<String>,
}

impl PlayerOrderExec for Mock {
    type Event = String;

    fn find_player_unit(&self, id: &str) -> Option<PlayerUnitFlags> {
        self.units.get(id).copied()
    }

    fn is_queued_order(&self, id: &str) -> bool {
        self.queued.contains(id)
    }

    fn is_busy(&mut self) -> bool {
        self.busy_seq.pop_front().unwrap_or(false)
    }

    fn perform_player_order(&mut self, id: &str) -> OrderOutcome<String> {
        if let Some(effects) = self.side_effects.get(id).cloned() {
            for (uid, flag, value) in effects {
                let Some(u) = self.units.get_mut(&uid) else {
                    continue;
                };
                match flag.as_str() {
                    "dead" => u.dead = value,
                    "removed" => u.removed = value,
                    "routed" => u.routed = value,
                    other => panic!("nieznany flaga w wektorze: {other}"),
                }
            }
        }
        OrderOutcome {
            events: vec![format!("perform:{id}")],
            completed: !self.async_ids.contains(id),
        }
    }

    fn mark_acted(&mut self, id: &str) {
        if let Some(u) = self.units.get_mut(id) {
            u.acted = true;
        }
        self.acted_log.push(id.to_string());
    }
}

fn absorb(step: &StepResult<String>, events: &mut Vec<String>, pending: &mut VecDeque<usize>) {
    for e in &step.events {
        events.push(match e {
            OrderQueueEvent::ClearAutoBattleSuspended => "suspend:false".to_string(),
            OrderQueueEvent::Order(s) => s.clone(),
            OrderQueueEvent::Defer { ms } => format!("schedule:{}", *ms as i64),
            OrderQueueEvent::RefreshQueuedOrderVisuals => "refresh".to_string(),
        });
    }
    if let Some(idx) = step.awaiting {
        pending.push_back(idx);
    }
}

fn str_list(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("lista")
        .iter()
        .map(|x| x.as_str().expect("tekst").to_string())
        .collect()
}

/// Buduje atrape z jednego scenariusza wektora.
fn mock_from(sc: &Value) -> Mock {
    let mut units = BTreeMap::new();
    for u in sc["units"].as_array().expect("units") {
        let flags = PlayerUnitFlags {
            dead: u["dead"].as_bool().unwrap(),
            removed: u["removed"].as_bool().unwrap(),
            routed: u["routed"].as_bool().unwrap(),
            acted: u["acted"].as_bool().unwrap(),
        };
        units.insert(u["id"].as_str().unwrap().to_string(), flags);
    }
    let mut side_effects = BTreeMap::new();
    for (k, v) in sc["side_effects"].as_object().expect("side_effects") {
        let list = v
            .as_array()
            .unwrap()
            .iter()
            .map(|s| {
                (
                    s["id"].as_str().unwrap().to_string(),
                    s["flag"].as_str().unwrap().to_string(),
                    s["value"].as_bool().unwrap(),
                )
            })
            .collect();
        side_effects.insert(k.clone(), list);
    }
    Mock {
        units,
        queued: str_list(&sc["queued"]).into_iter().collect(),
        busy_seq: sc["busy"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b.as_bool().unwrap())
            .collect(),
        async_ids: str_list(&sc["async"]).into_iter().collect(),
        side_effects,
        acted_log: Vec::new(),
    }
}

/// Uruchamia kolejke jak sterownik sceny: najpierw zegar (`VirtualClock`), potem oczekujace `done` (FIFO).
fn run_scenario(sc: &Value) -> (Vec<String>, Vec<String>) {
    let mut mock = mock_from(sc);
    let planning = sc["planning"].as_bool().unwrap();
    let mut clock = VirtualClock::<usize>::new();
    clock.finished = sc["finished"].as_bool().unwrap();
    let ids = str_list(&sc["ids"]);
    let mut events = Vec::new();
    let mut pending = VecDeque::new();

    let (queue, step) = q::execute_units_immediate(&mut mock, &mut clock, &ids, planning);
    absorb(&step, &mut events, &mut pending);
    loop {
        if !clock.timers.is_empty() {
            let next_due = clock
                .timers
                .iter()
                .map(|t| t.due)
                .fold(f64::INFINITY, f64::min);
            clock.v_now = next_due;
            clock.drain_timers(|c, idx| {
                let s = q::on_timer(&mut mock, c, &queue, idx, planning);
                absorb(&s, &mut events, &mut pending);
            });
            continue;
        }
        if let Some(idx) = pending.pop_front() {
            let s = q::on_order_done(&mut mock, &mut clock, &queue, idx, planning);
            absorb(&s, &mut events, &mut pending);
            continue;
        }
        break;
    }
    (events, mock.acted_log)
}

#[test]
fn wektory_pinu_zgodne_z_wykonaniem_weba() {
    let root: Value = serde_json::from_str(VECTORS).expect("vectors.json musi sie parsowac");
    assert_eq!(root["pin"], "07d2fbd72");
    assert_eq!(root["fragment_lines"], serde_json::json!([18578, 18614]));
    let sha = root["fragment_sha256"].as_str().unwrap();
    assert_eq!(sha.len(), 64, "sha256 fragmentu pinu");
    let scenarios = root["scenarios"].as_array().unwrap();
    assert!(scenarios.len() >= 10, "minimum wektorow");
    for sc in scenarios {
        let name = sc["name"].as_str().unwrap();
        let (events, acted) = run_scenario(sc);
        assert_eq!(
            events,
            str_list(&sc["expect"]["events"]),
            "zdarzenia: {name}"
        );
        assert_eq!(acted, str_list(&sc["expect"]["acted"]), "acted: {name}");
    }
}

#[test]
fn kolejnosc_wykonania_to_kolejnosc_tablicy_id() {
    let mut mock = Mock {
        units: [("A", false), ("B", false), ("C", false)]
            .iter()
            .map(|(id, _)| (id.to_string(), PlayerUnitFlags::default()))
            .collect(),
        queued: BTreeSet::new(),
        busy_seq: VecDeque::new(),
        async_ids: BTreeSet::new(),
        side_effects: BTreeMap::new(),
        acted_log: Vec::new(),
    };
    let mut clock = VirtualClock::<usize>::new();
    let ids: Vec<String> = ["C", "A", "B"].iter().map(|s| s.to_string()).collect();
    let (_, step) = q::execute_units_immediate(&mut mock, &mut clock, &ids, false);
    let performed: Vec<&String> = step
        .events
        .iter()
        .filter_map(|e| match e {
            OrderQueueEvent::Order(s) => Some(s),
            _ => None,
        })
        .collect();
    assert_eq!(performed, vec!["perform:C", "perform:A", "perform:B"]);
    assert_eq!(mock.acted_log, vec!["C", "A", "B"]);
}

#[test]
fn pusta_lista_bez_zdarzen_rozkazu() {
    let sc = serde_json::json!({
        "units": [], "queued": [], "ids": [], "busy": [], "planning": false,
        "finished": false, "async": [], "side_effects": {}
    });
    let (events, acted) = run_scenario(&sc);
    assert_eq!(events, vec!["suspend:false", "refresh"]);
    assert!(acted.is_empty());
}

#[test]
fn zajety_wstrzymuje_do_zdarzenia_zegara() {
    let sc = serde_json::json!({
        "units": [
            {"id": "A", "dead": false, "removed": false, "routed": false, "acted": false},
            {"id": "B", "dead": false, "removed": false, "routed": false, "acted": false}
        ],
        "queued": [], "ids": ["A", "B"], "busy": [true, false, false],
        "planning": false, "finished": false, "async": [], "side_effects": {}
    });
    let (events, acted) = run_scenario(&sc);
    assert_eq!(
        events,
        vec![
            "suspend:false",
            "schedule:40",
            "perform:A",
            "perform:B",
            "refresh"
        ]
    );
    assert_eq!(acted, vec!["A", "B"]);
}
