//! P6 SIEGE-TAKTYKA K1b (#217, runda 1 Operatora): testy zgodnosci petli marszu oblezniczego
//! (`_bfsFirstStep` 7973-8003, `_siegeWalkTo` 8006-8019, galaz odmowy `_doMove` 8689-8693) z kodem weba.
//!
//! Wektory: sekcje `bfsFirstStep` i `siegeWalkTo` w `p6_siege_tactics_walk_vectors/vectors.json`, generowane przez
//! `p6_siege_tactics_walk_gen.mjs` (Node, seed 217) z wycietych fragmentow `gra/src/battle/battleScene.ts`
//! (pin 07d2fbd72; straznik SHA-256 `74ef6961...` w generatorze, zweryfikowany niezaleznie przez sha256sum).

use civ_engine::domain::siege_tactics_approach::{
    threat_slack, ApproachUnit, ApproachWallState, Threat,
};
use civ_engine::domain::siege_tactics_walk::{
    bfs_first_step, do_move_gate, siege_walk_to, walk_decide, DoMoveGate, WalkDecision, WalkEvent,
    WalkUnit, WalkWorld, STEP_GAP_MS, WALK_BFS_MAX_VISITED,
};
use std::collections::{BTreeMap, HashSet};

const VECTORS: &str = include_str!("p6_siege_tactics_walk_vectors/vectors.json");

/// Web `battleScene.ts:326-331` / koszt wejscia z generatora: `COST[(3c+5r) mod 5]`, wartosci dyadyczne.
const COST: [f64; 5] = [0.5, 1.0, 1.5, 2.0, 3.0];

fn cost_of(c: i64, r: i64) -> f64 {
    COST[(3 * c + 5 * r).rem_euclid(5) as usize]
}

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn b(v: &serde_json::Value) -> bool {
    v.as_bool().expect("bool")
}

fn int(v: &serde_json::Value) -> i64 {
    v.as_i64().expect("liczba calkowita")
}

fn cell(v: &serde_json::Value) -> (i64, i64) {
    (int(&v[0]), int(&v[1]))
}

fn cells(v: &serde_json::Value) -> Vec<(i64, i64)> {
    v.as_array()
        .expect("lista kafli")
        .iter()
        .map(cell)
        .collect()
}

fn threats_of(v: &serde_json::Value) -> Vec<Threat> {
    v.as_array()
        .expect("lista zagrozen")
        .iter()
        .map(|t| Threat {
            q: t["q"].as_f64().expect("q"),
            r: t["r"].as_f64().expect("r"),
            range: t["range"].as_f64().expect("range"),
        })
        .collect()
}

fn unit_of(ru_v: &serde_json::Value) -> ApproachUnit {
    ApproachUnit {
        side_atk: ru_v["side"].as_str().expect("side") == "atk",
        routed: b(&ru_v["routed"]),
        on_wall_walkway: b(&ru_v["onWallWalkway"]),
        is_siege_unit: b(&ru_v["isSiegeUnit"]),
        primary_ranged: b(&ru_v["primaryRanged"]),
        can_shoot: b(&ru_v["canShoot"]),
        // undefined w JSON nie jest wylaczeniem; tylko jawne false.
        shooting_disabled: ru_v["shootingEnabled"].as_bool() == Some(false),
        mounted: b(&ru_v["mounted"]),
    }
}

fn wall_of(s_v: &serde_json::Value) -> ApproachWallState {
    ApproachWallState {
        wall_col_ge0: int(&s_v["wallCol"]) >= 0,
        gate_open: b(&s_v["gateOpen"]),
        wall_ever_breached: b(&s_v["wallEverBreached"]),
        wall_tiles_init: s_v["siegeWallTilesInit"].as_u64().expect("init") as usize,
        wall_tiles_alive: s_v["wallTileHpSize"].as_u64().expect("alive") as usize,
        tower_at_wall_rows_count: s_v["towerAtWallRowsCount"].as_u64().expect("towers") as usize,
    }
}

/// Swiat sceny dla wektorow `siegeWalkTo`: cel, zajete/nieprzechodnie kafle, okno `allowTile` = `safe`
/// (`threat_slack > 0` w oknie +-12 wokol startu jednostki), `prefRow`, bramka muru i zagrozenia.
struct VecWalk {
    finished: bool,
    goal: HashSet<(i64, i64)>,
    blocked: HashSet<(i64, i64)>,
    /// `Some((q0, r0))` = `allowTile` z oknem +-12 wokol startu (web `allow: {window: 12}`).
    allow_window_origin: Option<(i64, i64)>,
    threats: Vec<Threat>,
    pref_row: Option<i64>,
    wall_col: i64,
    /// `Some((ru, wall))` gdy wektor podaje bramke (web `ru`/`wall`); `None` = brak muru w przypadku.
    gate: Option<(ApproachUnit, ApproachWallState)>,
}

impl WalkWorld for VecWalk {
    fn finished(&self) -> bool {
        self.finished
    }
    fn is_goal(&self, col: i64, row: i64) -> bool {
        self.goal.contains(&(col, row))
    }
    fn passable_free(&self, col: i64, row: i64) -> bool {
        !self.blocked.contains(&(col, row))
    }
    fn allow_tile(&self, col: i64, row: i64) -> bool {
        match self.allow_window_origin {
            None => true,
            Some((q0, r0)) => {
                (col - q0).abs() <= 12
                    && (row - r0).abs() <= 12
                    && threat_slack(&self.threats, col as f64, row as f64) > 0.0
            }
        }
    }
    fn pref_row(&self) -> Option<i64> {
        self.pref_row
    }
    fn do_move(&mut self, unit: &mut WalkUnit, col: i64, row: i64) -> DoMoveGate {
        let gate = match &self.gate {
            None => DoMoveGate::Proceed,
            Some((ru, wall)) => do_move_gate(
                self.wall_col >= 0,
                ru,
                wall,
                &self.threats,
                (unit.q, unit.r),
                (col, row),
            ),
        };
        if gate == DoMoveGate::Proceed {
            // Efekt sceny (model wektorow): przeniesienie i koszt `max(0, moveLeft - koszt)`.
            unit.q = col;
            unit.r = row;
            unit.move_left = (unit.move_left - cost_of(col, row)).max(0.0);
        }
        gate
    }
}

#[test]
fn wektory_bfs_first_step_zgodne_z_webem() {
    let v = load();
    let cases = v["bfsFirstStep"].as_array().expect("bfsFirstStep");
    assert!(cases.len() >= 500, "wektory bfs: {}", cases.len());
    let (mut found, mut none, mut with_allow, mut with_pref, mut capped) = (0, 0, 0, 0, 0);
    for (i, c) in cases.iter().enumerate() {
        let start = (int(&c["start"]["q"]), int(&c["start"]["r"]));
        let goal: HashSet<(i64, i64)> = cells(&c["goal"]).into_iter().collect();
        let blocked: HashSet<(i64, i64)> = cells(&c["blocked"]).into_iter().collect();
        let allow: Option<[i64; 4]> = c["allow"]
            .as_array()
            .map(|a| [int(&a[0]), int(&a[1]), int(&a[2]), int(&a[3])]);
        let pref_row = c["prefRow"].as_i64();
        let max_visited = c["maxVisited"].as_u64().expect("maxVisited") as usize;
        let got = bfs_first_step(
            start,
            |col, row| goal.contains(&(col, row)),
            |col, row| !blocked.contains(&(col, row)),
            |col, row| match allow {
                None => true,
                Some([c0, c1, r0, r1]) => col >= c0 && col <= c1 && row >= r0 && row <= r1,
            },
            pref_row,
            max_visited,
        );
        let expect = if c["expect"].is_null() {
            None
        } else {
            Some(cell(&c["expect"]))
        };
        assert_eq!(got, expect, "przypadek bfs {i}");
        if got.is_some() {
            found += 1;
        } else {
            none += 1;
        }
        if allow.is_some() {
            with_allow += 1;
        }
        if pref_row.is_some() {
            with_pref += 1;
        }
        if got.is_none() && max_visited < WALK_BFS_MAX_VISITED {
            capped += 1;
        }
    }
    // Pokrycie galezi: trafienie, brak sciezki, allowTile, prefRow, limit odwiedzin.
    assert!(found >= 50, "trafienia: {found}");
    assert!(none >= 100, "brak sciezki: {none}");
    assert!(with_allow >= 50, "allowTile: {with_allow}");
    assert!(with_pref >= 100, "prefRow: {with_pref}");
    assert!(
        capped >= 10,
        "limit odwiedzin (maxVisited < 6000, brak trafienia): {capped}"
    );
}

#[test]
fn wektory_siege_walk_to_zgodne_z_webem() {
    let v = load();
    let cases = v["siegeWalkTo"].as_array().expect("siegeWalkTo");
    assert!(cases.len() >= 500, "wektory marszu: {}", cases.len());
    let mut kinds: BTreeMap<String, usize> = BTreeMap::new();
    let mut refused_cases = 0;
    let mut special = 0;
    for (i, c) in cases.iter().enumerate() {
        let u = &c["unit"];
        let mut unit = WalkUnit {
            q: int(&u["q"]),
            r: int(&u["r"]),
            move_left: u["moveLeft"].as_f64().expect("moveLeft"),
            dead: b(&u["dead"]),
            fading_out: b(&u["fadingOut"]),
        };
        let allow_window_origin = if c["allow"].is_null() {
            None
        } else {
            // Okno liczone wokol STARTU jednostki (jak w generatorze).
            Some((unit.q, unit.r))
        };
        let gate = if c["wall"].is_null() {
            None
        } else {
            Some((unit_of(&c["ru"]), wall_of(&c["wall"])))
        };
        let mut world = VecWalk {
            finished: b(&c["finished"]),
            goal: cells(&c["goal"]).into_iter().collect(),
            blocked: cells(&c["blocked"]).into_iter().collect(),
            allow_window_origin,
            threats: threats_of(&c["threats"]),
            pref_row: c["prefRow"].as_i64(),
            wall_col: if c["wall"].is_null() {
                -1
            } else {
                int(&c["wall"]["wallCol"])
            },
            gate,
        };
        if c.get("special").is_some() {
            special += 1;
        }
        let events = siege_walk_to(&mut world, &mut unit);
        let expect: Vec<WalkEvent> = c["events"]
            .as_array()
            .expect("events")
            .iter()
            .map(|e| match e["k"].as_str().expect("k") {
                "move" => WalkEvent::Move {
                    col: int(&e["col"]),
                    row: int(&e["row"]),
                },
                "refused" => WalkEvent::Refused {
                    col: int(&e["col"]),
                    row: int(&e["row"]),
                },
                "schedule" => WalkEvent::Schedule {
                    ms: int(&e["ms"]) as u32,
                },
                "done" => WalkEvent::Done,
                other => panic!("nieznane zdarzenie {other}"),
            })
            .collect();
        assert_eq!(
            events,
            expect,
            "przypadek marszu {i} ({})",
            c["name"].as_str().unwrap_or("losowy")
        );
        let fu = &c["finalUnit"];
        assert_eq!(unit.q, int(&fu["q"]), "przypadek {i}: q");
        assert_eq!(unit.r, int(&fu["r"]), "przypadek {i}: r");
        assert_eq!(
            unit.move_left,
            fu["moveLeft"].as_f64().expect("moveLeft"),
            "przypadek {i}: moveLeft"
        );
        for e in &events {
            let k = match e {
                WalkEvent::Move { .. } => "move",
                WalkEvent::Refused { .. } => "refused",
                WalkEvent::Schedule { .. } => "schedule",
                WalkEvent::Done => "done",
            };
            *kinds.entry(k.to_string()).or_default() += 1;
        }
        if events
            .iter()
            .any(|e| matches!(e, WalkEvent::Refused { .. }))
        {
            refused_cases += 1;
        }
    }
    // Pokrycie: ruch, zaplanowany krok, odmowa bramki, zakonczenie.
    for k in ["move", "schedule", "refused", "done"] {
        assert!(
            kinds.get(k).copied().unwrap_or(0) > 0,
            "brak zdarzen typu {k}: {kinds:?}"
        );
    }
    assert!(
        refused_cases >= 4,
        "przypadki z odmowa bramki: {refused_cases}"
    );
    assert!(special >= 10, "przypadki jawne: {special}");
}

#[test]
fn odmowa_bramki_konczy_marsz_bez_ruchu_i_zeruje_ruch() {
    // Prosta linia przez strefe zagrozenia (0,5)->(10,5), zagrozenie (7,5) zasieg 3, mur zamkniety, piechota.
    let ru = ApproachUnit {
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        is_siege_unit: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        mounted: false,
    };
    let wall = ApproachWallState {
        wall_col_ge0: true,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 0,
        wall_tiles_alive: 0,
        tower_at_wall_rows_count: 0,
    };
    let mut world = VecWalk {
        finished: false,
        goal: [(10, 5)].into_iter().collect(),
        blocked: HashSet::new(),
        allow_window_origin: None,
        threats: vec![Threat {
            q: 7.0,
            r: 5.0,
            range: 3.0,
        }],
        pref_row: None,
        wall_col: 3,
        gate: Some((ru, wall)),
    };
    let mut unit = WalkUnit {
        q: 0,
        r: 5,
        move_left: 10.0,
        dead: false,
        fading_out: false,
    };
    let events = siege_walk_to(&mut world, &mut unit);
    // Krok na (4,5) wchodzi w zasieg (slack 0 < slack(3,5) = 1) -> odmowa; jednostka zostaje na (3,5).
    assert_eq!(
        events.last(),
        Some(&WalkEvent::Done),
        "marsz konczy sie zdarzeniem Done"
    );
    assert!(
        events.contains(&WalkEvent::Refused { col: 4, row: 5 }),
        "{events:?}"
    );
    assert_eq!((unit.q, unit.r), (3, 5));
    assert_eq!(unit.move_left, 0.0, "web: ru.moveLeft = 0 po odmowie");
}

#[test]
fn bfs_tie_break_kierunki_nesw() {
    // Dwie rownie krotkie drogi: N ma pierwszenstwo (kolejnosc DIRS4 = N, E, S, W).
    let target: HashSet<(i64, i64)> = [(5, 3)].into_iter().collect();
    let got = bfs_first_step(
        (5, 5),
        |c, r| target.contains(&(c, r)),
        |_, _| true,
        |_, _| true,
        None,
        WALK_BFS_MAX_VISITED,
    );
    assert_eq!(got, Some((5, 4)));
}

#[test]
fn bfs_start_nie_jest_kandydatem_i_brzegi_siatki() {
    // Cel == start: start jest w `seen`, wiec nie zostaje zwrocony; brak innego celu -> None.
    let got = bfs_first_step(
        (5, 5),
        |c, r| (c, r) == (5, 5),
        |_, _| true,
        |_, _| true,
        None,
        100,
    );
    assert_eq!(got, None);
    // Start poza siatka (kolumna -1): sasiad E (0,0) jest w siatce i jest celem.
    let got = bfs_first_step(
        (-1, 0),
        |c, r| (c, r) == (0, 0),
        |_, _| true,
        |_, _| true,
        None,
        WALK_BFS_MAX_VISITED,
    );
    assert_eq!(got, Some((0, 0)));
    // Limit odwiedzin: maxVisited = 1 przetwarza tylko start, cel dwa kroki dalej jest nieosiagalny.
    let got = bfs_first_step(
        (5, 5),
        |c, r| (c, r) == (5, 3),
        |_, _| true,
        |_, _| true,
        None,
        1,
    );
    assert_eq!(got, None);
}

struct DecideWorld {
    finished: bool,
    goal: (i64, i64),
}

impl WalkWorld for DecideWorld {
    fn finished(&self) -> bool {
        self.finished
    }
    fn is_goal(&self, col: i64, row: i64) -> bool {
        (col, row) == self.goal
    }
    fn passable_free(&self, _col: i64, _row: i64) -> bool {
        true
    }
    fn do_move(&mut self, _unit: &mut WalkUnit, _col: i64, _row: i64) -> DoMoveGate {
        DoMoveGate::Proceed
    }
}

#[test]
fn decide_warunki_zakonczenia_i_nan() {
    let w = DecideWorld {
        finished: false,
        goal: (9, 9),
    };
    let base = WalkUnit {
        q: 0,
        r: 0,
        move_left: 3.0,
        dead: false,
        fading_out: false,
    };
    assert!(matches!(walk_decide(&w, &base), WalkDecision::Move { .. }));
    // finished / dead / fadingOut / moveLeft <= 0 -> Done.
    let fin = DecideWorld {
        finished: true,
        goal: (9, 9),
    };
    assert_eq!(walk_decide(&fin, &base), WalkDecision::Done);
    assert_eq!(
        walk_decide(&w, &WalkUnit { dead: true, ..base }),
        WalkDecision::Done
    );
    assert_eq!(
        walk_decide(
            &w,
            &WalkUnit {
                fading_out: true,
                ..base
            }
        ),
        WalkDecision::Done
    );
    assert_eq!(
        walk_decide(
            &w,
            &WalkUnit {
                move_left: 0.0,
                ..base
            }
        ),
        WalkDecision::Done
    );
    // Jednostka juz na celu -> Done.
    assert_eq!(
        walk_decide(&w, &WalkUnit { q: 9, r: 9, ..base }),
        WalkDecision::Done
    );
    // NaN nie spelnia `<= 0` (jak w JS): marsz trwa.
    assert!(matches!(
        walk_decide(
            &w,
            &WalkUnit {
                move_left: f64::NAN,
                ..base
            }
        ),
        WalkDecision::Move { .. }
    ));
}

#[test]
fn stale_kroku_i_bramki_zgodne_z_webem() {
    assert_eq!(STEP_GAP_MS, 70);
    assert_eq!(WALK_BFS_MAX_VISITED, 6000);
    // Bramka: bez muru (siegeWallCol < 0) zawsze Proceed, nawet gdy _siegeMoveRefused bylby prawdziwy.
    let ru = ApproachUnit {
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        is_siege_unit: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        mounted: false,
    };
    let wall = ApproachWallState {
        wall_col_ge0: true,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 0,
        wall_tiles_alive: 0,
        tower_at_wall_rows_count: 0,
    };
    let th = [Threat {
        q: 7.0,
        r: 5.0,
        range: 3.0,
    }];
    assert_eq!(
        do_move_gate(false, &ru, &wall, &th, (3, 5), (4, 5)),
        DoMoveGate::Proceed
    );
    assert_eq!(
        do_move_gate(true, &ru, &wall, &th, (3, 5), (4, 5)),
        DoMoveGate::Refused
    );
}
