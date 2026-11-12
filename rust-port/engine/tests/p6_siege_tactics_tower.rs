//! P6 SIEGE-TAKTYKA K3 (#217, runda 1 Operatora): testy zgodnosci czesci decyzyjnej wiez oblezniczych
//! (`_siegeRamTowerStep` 8022-8054, `_trySiegeTowerClimb` 8056-8084, `_siegeInfantryToTowerStep` 8087-8102)
//! z kodem weba (pin `07d2fbd72`).
//!
//! Wektory: `p6_siege_tactics_tower_vectors/vectors.json`, generowane przez `p6_siege_tactics_tower_gen.mts`, ktory
//! WYKONUJE doslowne linie pinu (harness Node, seed 217; straznik SHA-256 fragmentow pinu). Atrapy sceny i ich
//! granice sa opisane w naglowku generatora. Tabela `meta.categories` pochodzi z zachowania pinu; test wymaga, by
//! rozklad kategorii po stronie Rust byl identyczny.

use civ_engine::domain::siege_tactics_approach::Threat;
use civ_engine::domain::siege_tactics_tower::{
    attacker_wall_entry_is_breach, move_cost, siege_infantry_to_tower_step, siege_ram_tower_step,
    siege_tower_climb, TowerEvent, TowerOutcome, TowerScene, TowerUnit, WYLOM_LOG,
};
use civ_engine::domain::siege_tactics_walk::WalkUnit;
use std::collections::{BTreeMap, BTreeSet, HashSet};

const VECTORS: &str = include_str!("p6_siege_tactics_tower_vectors/vectors.json");

fn ival(v: &serde_json::Value) -> i64 {
    v.as_i64().expect("liczba calkowita")
}

fn bval(v: &serde_json::Value) -> bool {
    v.as_bool().expect("bool")
}

fn cell(v: &serde_json::Value) -> (i64, i64) {
    let a = v.as_array().expect("para [c,r]");
    (ival(&a[0]), ival(&a[1]))
}

fn cells(v: &serde_json::Value) -> Vec<(i64, i64)> {
    v.as_array()
        .expect("lista kafli")
        .iter()
        .map(cell)
        .collect()
}

/// `moveLeft` z wektora: liczba albo "NaN" (JSON nie koduje NaN).
fn move_left(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("moveLeft"),
    }
}

fn scene_of(s: &serde_json::Value) -> TowerScene {
    TowerScene {
        finished: bval(&s["finished"]),
        wall_col: ival(&s["wallCol"]),
        gate_col: ival(&s["gateCol"]),
        gate_row: ival(&s["gateRow"]),
        gate_open: bval(&s["gateOpen"]),
        wall_ever_breached: bval(&s["everBreached"]),
        wall_tiles_init: ival(&s["wallTilesInit"]) as usize,
        wall_tile_rows: s["wallRows"]
            .as_array()
            .unwrap()
            .iter()
            .map(ival)
            .collect::<BTreeSet<_>>(),
        tower_rows: s["towerRows"]
            .as_array()
            .unwrap()
            .iter()
            .map(ival)
            .collect::<BTreeSet<_>>(),
        occupied: cells(&s["occ"]).into_iter().collect::<HashSet<_>>(),
        blocked: cells(&s["blocked"]).into_iter().collect::<HashSet<_>>(),
        threats: s["threats"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| Threat {
                q: ival(&t["q"]) as f64,
                r: ival(&t["r"]) as f64,
                range: ival(&t["range"]) as f64,
            })
            .collect(),
        log: Vec::new(),
    }
}

fn unit_of(u: &serde_json::Value) -> TowerUnit {
    TowerUnit {
        walk: WalkUnit {
            q: ival(&u["q"]),
            r: ival(&u["r"]),
            move_left: move_left(&u["moveLeft"]),
            dead: bval(&u["dead"]),
            fading_out: bval(&u["fadingOut"]),
        },
        side_atk: u["side"].as_str() == Some("atk"),
        routed: bval(&u["routed"]),
        on_wall_walkway: bval(&u["onWallWalkway"]),
        mounted: bval(&u["mounted"]),
        primary_ranged: bval(&u["primaryRanged"]),
        can_shoot: bval(&u["canShoot"]),
        shooting_disabled: bval(&u["shootingDisabled"]),
        is_siege_unit: bval(&u["isSiegeUnit"]),
        is_ram: bval(&u["isRam"]),
        is_siege_tower: bval(&u["isSiegeTower"]),
    }
}

fn event_of(e: &serde_json::Value) -> TowerEvent {
    match e["k"].as_str().expect("k") {
        "gate" => TowerEvent::Gate {
            col: ival(&e["col"]),
            row: ival(&e["row"]),
            refused: bval(&e["refused"]),
        },
        "move" => TowerEvent::Move {
            col: ival(&e["col"]),
            row: ival(&e["row"]),
        },
        "schedule" => TowerEvent::Schedule {
            ms: ival(&e["ms"]) as u32,
        },
        "addRow" => TowerEvent::AddRow {
            row: ival(&e["row"]),
        },
        "attackGate" => TowerEvent::AttackGate,
        "advance" => TowerEvent::AdvanceToward {
            col: ival(&e["col"]),
            row: ival(&e["row"]),
        },
        "done" => TowerEvent::Done,
        other => panic!("nieznane zdarzenie w wektorze: {other}"),
    }
}

fn kind_of(e: &TowerEvent) -> &'static str {
    match e {
        TowerEvent::Gate { .. } => "gate",
        TowerEvent::Move { .. } => "move",
        TowerEvent::Schedule { .. } => "schedule",
        TowerEvent::AddRow { .. } => "addRow",
        TowerEvent::AttackGate => "attackGate",
        TowerEvent::AdvanceToward { .. } => "advance",
        TowerEvent::Done => "done",
    }
}

fn run_case(c: &serde_json::Value) -> (TowerOutcome, TowerScene, TowerUnit) {
    let mut scene = scene_of(&c["scene"]);
    let mut unit = unit_of(&c["unit"]);
    let out = match c["fn"].as_str().expect("fn") {
        "ram" => siege_ram_tower_step(&mut scene, &mut unit),
        "climb" => siege_tower_climb(&mut scene, &mut unit),
        "infantry" => siege_infantry_to_tower_step(&mut scene, &mut unit),
        other => panic!("nieznana funkcja: {other}"),
    };
    (out, scene, unit)
}

#[test]
fn wektory_wiez_zgodne_z_wykonanym_pinem() {
    let doc: serde_json::Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cases = doc["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 500,
        "wymagane >= 500 przypadkow, jest {}",
        cases.len()
    );

    let mut tally: BTreeMap<String, u64> = BTreeMap::new();
    for c in cases {
        let (out, scene, unit) = run_case(c);
        let e = &c["expect"];

        assert_eq!(
            out.handled,
            bval(&e["ret"]),
            "wartosc zwracana, przypadek {}",
            c["id"]
        );
        let want: Vec<TowerEvent> = e["ev"].as_array().unwrap().iter().map(event_of).collect();
        assert_eq!(out.events, want, "zdarzenia, przypadek {}", c["id"]);

        assert_eq!(
            unit.walk.q,
            ival(&e["unit"]["q"]),
            "q, przypadek {}",
            c["id"]
        );
        assert_eq!(
            unit.walk.r,
            ival(&e["unit"]["r"]),
            "r, przypadek {}",
            c["id"]
        );
        let want_ml = move_left(&e["unit"]["moveLeft"]);
        assert!(
            unit.walk.move_left == want_ml || (unit.walk.move_left.is_nan() && want_ml.is_nan()),
            "moveLeft, przypadek {}",
            c["id"]
        );
        assert_eq!(
            unit.on_wall_walkway,
            bval(&e["unit"]["onWallWalkway"]),
            "onWallWalkway, przypadek {}",
            c["id"]
        );

        let want_occ: HashSet<(i64, i64)> = cells(&e["scene"]["occ"]).into_iter().collect();
        assert_eq!(scene.occupied, want_occ, "occByKey, przypadek {}", c["id"]);
        let want_tr: BTreeSet<i64> = e["scene"]["towerRows"]
            .as_array()
            .unwrap()
            .iter()
            .map(ival)
            .collect();
        assert_eq!(
            scene.tower_rows, want_tr,
            "towerAtWallRows, przypadek {}",
            c["id"]
        );
        assert_eq!(
            scene.wall_ever_breached,
            bval(&e["scene"]["everBreached"]),
            "wallEverBreached"
        );
        let want_log: Vec<String> = e["scene"]["log"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect();
        assert_eq!(scene.log, want_log, "dziennik, przypadek {}", c["id"]);

        // Rozklad kategorii liczony tak samo jak w generatorze (categorize).
        let fname = c["fn"].as_str().unwrap();
        *tally.entry(format!("{fname}:{}", out.handled)).or_default() += 1;
        let kinds: BTreeSet<&str> = out.events.iter().map(kind_of).collect();
        for k in kinds {
            *tally.entry(format!("ev:{k}")).or_default() += 1;
        }
        let gates: Vec<bool> = out
            .events
            .iter()
            .filter_map(|ev| match ev {
                TowerEvent::Gate { refused, .. } => Some(*refused),
                _ => None,
            })
            .collect();
        if gates.iter().any(|&r| r) {
            *tally.entry("gate:refused".into()).or_default() += 1;
        }
        if gates.iter().any(|&r| !r) {
            *tally.entry("gate:proceed".into()).or_default() += 1;
        }
        if want_ml.is_nan() {
            *tally.entry("nan:moveLeft".into()).or_default() += 1;
        }
        if bval(&e["scene"]["everBreached"]) && !bval(&c["scene"]["everBreached"]) {
            *tally.entry("breach:first".into()).or_default() += 1;
        }
        if !want_log.is_empty() {
            *tally.entry("log:wylom".into()).or_default() += 1;
        }
    }

    // Rozklad kategorii musi byc identyczny jak zapisany przez generator (zachowanie pinu).
    let meta: BTreeMap<String, u64> = doc["meta"]["categories"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_u64().unwrap()))
        .collect();
    assert_eq!(tally, meta, "rozklad kategorii przypadkow");
    eprintln!("K3 kategorie ({} przypadkow): {:?}", cases.len(), tally);
}

#[test]
fn kazda_galaz_ma_pokrycie_w_wektorach() {
    // Galezie wykonane przez wektory (kategorie z generatora). Brak galezi odmowy bramki jest strukturalny (patrz modul).
    let doc: serde_json::Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cat = &doc["meta"]["categories"];
    for key in [
        "ram:true",
        "ram:false",
        "climb:true",
        "climb:false",
        "infantry:true",
        "infantry:false",
        "ev:attackGate",
        "ev:addRow",
        "ev:advance",
        "ev:move",
        "ev:schedule",
        "ev:done",
        "gate:proceed",
        "nan:moveLeft",
        "breach:first",
        "log:wylom",
    ] {
        assert!(
            cat[key].as_u64().unwrap_or(0) > 0,
            "brak pokrycia dla {key}"
        );
    }
    assert!(
        cat.get("gate:refused").is_none(),
        "odmowa bramki nie jest osiagalna z tych trzech funkcji"
    );
}

#[test]
fn brak_muru_zwraca_false_bez_efektow() {
    let mut scene = TowerScene {
        finished: false,
        wall_col: -1,
        gate_col: 0,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 0,
        wall_tile_rows: BTreeSet::new(),
        tower_rows: BTreeSet::from([3]),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: Vec::<Threat>::new(),
        log: Vec::new(),
    };
    let base = TowerUnit {
        walk: WalkUnit {
            q: 4,
            r: 3,
            move_left: 2.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: true,
        is_ram: true,
        is_siege_tower: false,
    };
    let mut u = base;
    assert_eq!(
        siege_ram_tower_step(&mut scene, &mut u),
        TowerOutcome {
            handled: false,
            events: vec![]
        }
    );
    let mut u = TowerUnit {
        is_siege_unit: false,
        is_ram: false,
        ..base
    };
    assert!(!siege_infantry_to_tower_step(&mut scene, &mut u).handled);
    assert!(!siege_tower_climb(&mut scene, &mut u).handled);
    assert_eq!(
        u,
        TowerUnit {
            is_siege_unit: false,
            is_ram: false,
            ..base
        }
    );
}

#[test]
fn taran_przy_bramie_atakuje_bez_marszu() {
    // wallCol = 10, brama w rzedzie 5 (gLo=4, gHi=5); taran w (9,4) -> near gate.
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([3, 4, 5]),
        tower_rows: BTreeSet::new(),
        occupied: HashSet::from([(9, 4)]),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mut u = TowerUnit {
        walk: WalkUnit {
            q: 9,
            r: 4,
            move_left: 3.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: true,
        is_ram: true,
        is_siege_tower: false,
    };
    let out = siege_ram_tower_step(&mut scene, &mut u);
    assert_eq!(
        out,
        TowerOutcome {
            handled: true,
            events: vec![TowerEvent::AttackGate]
        }
    );
    assert_eq!((u.walk.q, u.walk.r), (9, 4));
}

#[test]
fn taran_z_otwarta_brama_nie_idzie_do_bramy() {
    // gate_open = true: galaz rama-do-bramy pominieta; taran nie jest wiezą -> false.
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: true,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([3, 4, 5]),
        tower_rows: BTreeSet::new(),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mut u = TowerUnit {
        walk: WalkUnit {
            q: 2,
            r: 5,
            move_left: 3.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: true,
        is_ram: true,
        is_siege_tower: false,
    };
    assert!(!siege_ram_tower_step(&mut scene, &mut u).handled);
}

#[test]
fn wieza_juz_przy_murze_dopisuje_wiersz_i_konczy() {
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([3, 4, 5]),
        tower_rows: BTreeSet::new(),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mut u = TowerUnit {
        walk: WalkUnit {
            q: 9,
            r: 4,
            move_left: 3.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: true,
        is_ram: false,
        is_siege_tower: true,
    };
    let out = siege_ram_tower_step(&mut scene, &mut u);
    assert_eq!(
        out,
        TowerOutcome {
            handled: true,
            events: vec![TowerEvent::AddRow { row: 4 }, TowerEvent::Done]
        }
    );
    assert!(scene.tower_rows.contains(&4));
}

#[test]
fn wejscie_na_mur_loguje_wylom_tylko_raz() {
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([3, 4, 5]),
        tower_rows: BTreeSet::from([4]),
        occupied: HashSet::from([(8, 4)]),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mk = |q: i64| TowerUnit {
        walk: WalkUnit {
            q,
            r: 3,
            move_left: 2.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: false,
        is_ram: false,
        is_siege_tower: false,
    };
    let mut a = mk(9);
    let out = siege_tower_climb(&mut scene, &mut a);
    assert_eq!(
        out,
        TowerOutcome {
            handled: true,
            events: vec![TowerEvent::Done]
        }
    );
    assert_eq!(
        (a.walk.q, a.walk.move_left, a.on_wall_walkway),
        (10, 0.0, true)
    );
    assert!(scene.wall_ever_breached);
    assert_eq!(scene.log, vec![WYLOM_LOG.to_string()]);
    // Druga wspinaczka (inna jednostka, ten sam mur, korona zwolniona): wylom juz byl -> brak drugiego wpisu.
    scene.occupied.remove(&(10, 3));
    let mut b = mk(9);
    let out2 = siege_tower_climb(&mut scene, &mut b);
    assert_eq!(
        out2,
        TowerOutcome {
            handled: true,
            events: vec![TowerEvent::Done]
        }
    );
    assert_eq!(scene.log.len(), 1);
}

#[test]
fn wspinaczka_z_nan_zeruje_ruch() {
    // NaN moveLeft nie jest czytany przed wejsciem na mur; po wejsciu ustawiane jest 0 (JS: ru.moveLeft = 0).
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: true,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([3, 4]),
        tower_rows: BTreeSet::from([4]),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mut u = TowerUnit {
        walk: WalkUnit {
            q: 9,
            r: 3,
            move_left: f64::NAN,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: false,
        is_ram: false,
        is_siege_tower: false,
    };
    assert!(siege_tower_climb(&mut scene, &mut u).handled);
    assert_eq!(u.walk.move_left, 0.0);
    assert!(scene.log.is_empty(), "wylom juz byl: brak nowego wpisu");
}

#[test]
fn piechota_przy_wiezy_konczy_bez_marszu_gdy_korona_wolna() {
    // wallCol = 10 -> wallBase = 9; wieza w rzedzie 6; piechota w (8,6) = wallBase-1 przy wiezy.
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([5, 6, 7]),
        tower_rows: BTreeSet::from([6]),
        occupied: HashSet::from([(8, 6)]),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mut u = TowerUnit {
        walk: WalkUnit {
            q: 8,
            r: 6,
            move_left: 2.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: false,
        is_ram: false,
        is_siege_tower: false,
    };
    assert_eq!(
        siege_infantry_to_tower_step(&mut scene, &mut u),
        TowerOutcome {
            handled: true,
            events: vec![TowerEvent::Done]
        }
    );
    assert_eq!((u.walk.q, u.walk.r, u.walk.move_left), (8, 6, 2.0));
}

#[test]
fn strzelec_z_amunicja_nie_idzie_pod_wieze() {
    let mut scene = TowerScene {
        finished: false,
        wall_col: 10,
        gate_col: 10,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([5, 6, 7]),
        tower_rows: BTreeSet::from([6]),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let base = TowerUnit {
        walk: WalkUnit {
            q: 2,
            r: 6,
            move_left: 4.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: true,
        can_shoot: true,
        shooting_disabled: false,
        is_siege_unit: false,
        is_ram: false,
        is_siege_tower: false,
    };
    // strzelec z amunicja (shootingEnabled !== false): nie wchodzi w galaz piechoty.
    let mut u = base;
    assert!(!siege_infantry_to_tower_step(&mut scene, &mut u).handled);
    // shootingEnabled === false: galaz piechoty dziala (jest droga do celu).
    let mut u = TowerUnit {
        shooting_disabled: true,
        ..base
    };
    let out = siege_infantry_to_tower_step(&mut scene, &mut u);
    assert!(out.handled);
    assert!(out
        .events
        .iter()
        .any(|e| matches!(e, TowerEvent::Move { .. })));
}

#[test]
fn bfs_omija_zajete_kafle_i_sciany_siatki() {
    // Wieza przy lewym brzegu siatki: wallBase = -1 -> cel poza siatka nieosiagalny; brak krokow -> false.
    let mut scene = TowerScene {
        finished: false,
        wall_col: 0,
        gate_col: 0,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 3,
        wall_tile_rows: BTreeSet::from([5]),
        tower_rows: BTreeSet::from([5]),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: Vec::new(),
        log: Vec::new(),
    };
    let mut u = TowerUnit {
        walk: WalkUnit {
            q: 3,
            r: 5,
            move_left: 4.0,
            dead: false,
            fading_out: false,
        },
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        mounted: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        is_siege_unit: false,
        is_ram: false,
        is_siege_tower: false,
    };
    assert!(!siege_infantry_to_tower_step(&mut scene, &mut u).handled);
}

#[test]
fn koszt_wejscia_i_breach_predykat() {
    assert_eq!(move_cost(0, 0), 0.5);
    assert_eq!(move_cost(-1, 0), 1.5);
    assert_eq!(move_cost(2, 1), 1.0);
    assert!(attacker_wall_entry_is_breach(true, true));
    assert!(!attacker_wall_entry_is_breach(true, false));
    assert!(!attacker_wall_entry_is_breach(false, true));
}
