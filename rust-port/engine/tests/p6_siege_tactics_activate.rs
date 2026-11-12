//! P6 SIEGE-TAKTYKA K5h (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5H-Q1): zgodnosc `domain::siege_tactics_activate`
//! (`_activateUnit`, `battleScene.ts:6048-6299`) z kodem weba (pin `07d2fbd72`).
//!
//! Wektory: `p6_siege_tactics_activate_vectors/vectors.json` z `p6_siege_tactics_activate_gen.mjs` (wykonanie tekstu
//! pinu, straznik SHA-256, znaczniki galezi). Kazdy przypadek to sekwencja 1-4 aktywacji jednej jednostki ze stanem
//! przenoszonym (dryCol, heldAfterFallback, surroundApplied, morale, range, playerOrder). Test porownuje liste zdarzen
//! (kolejnosc wywolan), tagi galezi i stan jednostki po kazdej aktywacji oraz liczniki galezi / zdarzen z `meta`.

use civ_engine::domain::siege_tactics_activate::{
    activate_unit, tower_ops, ActivateEvent, ActivateOps, ActivateScene, ActivateUnit, EnemyRef,
};
use civ_engine::domain::siege_tactics_tower::{TowerScene, TowerUnit};
use civ_engine::domain::siege_tactics_walk::WalkUnit;
use std::collections::{BTreeMap, BTreeSet, HashSet};

const VECTORS: &str = include_str!("p6_siege_tactics_activate_vectors/vectors.json");

fn num(v: &serde_json::Value) -> f64 {
    if let Some(s) = v.as_str() {
        return match s {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznana liczba: {other}"),
        };
    }
    v.as_f64().expect("liczba")
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn b(v: &serde_json::Value) -> bool {
    v.as_bool().expect("bool")
}

fn i(v: &serde_json::Value) -> i64 {
    v.as_i64().expect("int")
}

fn opt_idx(v: &serde_json::Value) -> Option<usize> {
    v.as_u64().map(|x| x as usize)
}

struct Scripted<'a> {
    s: &'a serde_json::Value,
}

impl ActivateOps for Scripted<'_> {
    fn apply_terrain_range(&mut self, _c: f64) -> f64 {
        num(&self.s["rangeAfter"])
    }
    fn perform_player_order(&mut self) -> bool {
        b(&self.s["playerOrder"])
    }
    fn doctrine_step(&mut self) -> bool {
        b(&self.s["doctrineStep"])
    }
    fn tower_climb(&mut self) -> bool {
        b(&self.s["towerClimb"])
    }
    fn infantry_to_tower(&mut self) -> bool {
        b(&self.s["infToTower"])
    }
    fn ram_tower_step(&mut self) -> bool {
        b(&self.s["ramTower"])
    }
    fn ranged_target_in_range(&mut self) -> Option<usize> {
        opt_idx(&self.s["rangedTarget"])
    }
    fn target_in_range(&mut self) -> Option<usize> {
        opt_idx(&self.s["targetInRange"])
    }
    fn advance_coord(&mut self) -> f64 {
        num(&self.s["advanceCoord"])
    }
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
        // pozycje wrogow sa w `enemies` przypadku; test podstawia je przez `nearest_pos`.
        self.s.get("__nearestPos").and_then(|p| {
            p.as_array()
                .map(|a| (a[0].as_i64().unwrap(), a[1].as_i64().unwrap()))
        })
    }
}

fn label(e: &ActivateEvent) -> String {
    match e {
        ActivateEvent::Done => "done".into(),
        ActivateEvent::Flee => "flee".into(),
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
        ActivateEvent::PerformPlayerOrder => "playerOrder".into(),
        ActivateEvent::ResetPlayerOrder => "resetOrder".into(),
        ActivateEvent::DoctrineStep => "doctrineStep".into(),
        ActivateEvent::UpdateMoraleBar => "moraleBar".into(),
        ActivateEvent::StartRout => "startRout".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::RamTowerStep => "ramTower".into(),
        ActivateEvent::Attack { target } => format!("attack:{target}"),
        ActivateEvent::AttackWallTile { row } => format!("attackWall:{row}"),
        ActivateEvent::AdvanceToward { col, row } => format!("advanceToward:{col},{row}"),
        ActivateEvent::RangedAction => "rangedAction".into(),
        ActivateEvent::FallBackStep => "fallBack".into(),
        ActivateEvent::CavalryAction => "cavalry".into(),
        ActivateEvent::PhalanxAction => "phalanx".into(),
        ActivateEvent::AdvanceStep => "advanceStep".into(),
    }
}

/// Web nie zapisuje `ResetPlayerOrder` do sladu (zmiana pola `playerOrder`, stan porownywany osobno).
fn comparable(e: &ActivateEvent) -> bool {
    !matches!(e, ActivateEvent::ResetPlayerOrder)
}

fn unit_from(u: &serde_json::Value) -> ActivateUnit {
    ActivateUnit {
        side_atk: b(&u["sideAtk"]),
        q: i(&u["q"]),
        r: i(&u["r"]),
        dead: b(&u["dead"]),
        fading_out: b(&u["fadingOut"]),
        routed: b(&u["routed"]),
        never_rout: b(&u["neverRout"]),
        surround_applied: b(&u["surroundApplied"]),
        morale: num(&u["morale"]),
        flee_morale: num(&u["fleeMorale"]),
        terrain_defence_mult: num(&u["terrainDefenceMult"]),
        range: num(&u["range"]),
        on_wall_walkway: b(&u["onWallWalkway"]),
        primary_ranged: b(&u["primaryRanged"]),
        mounted: b(&u["mounted"]),
        phalanx: b(&u["phalanx"]),
        shooting_disabled: b(&u["shootingDisabled"]),
        dry_col: num(&u["dryCol"]),
        held_after_fallback: b(&u["heldAfterFallback"]),
        player_order_none: b(&u["playerOrderNone"]),
        can_shoot: b(&u["canShoot"]),
        is_siege_unit: b(&u["isSiegeUnit"]),
        is_siege_tower: b(&u["isSiegeTower"]),
        is_ram: b(&u["isRam"]),
        is_catapult: b(&u["isCatapult"]),
        doctrine_auto: b(&u["doctrineAuto"]),
        doctrine_manual: b(&u["doctrineManual"]),
    }
}

fn run_vectors() -> (usize, BTreeMap<String, u64>, BTreeMap<String, u64>) {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("json");
    let cases = root["cases"].as_array().unwrap();
    let mut branches: BTreeMap<String, u64> = BTreeMap::new();
    let mut kinds: BTreeMap<String, u64> = BTreeMap::new();
    let mut acts = 0;
    for c in cases {
        let mut ru = unit_from(&c["unit"]);
        let enemies: Vec<EnemyRef> = c["enemies"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| EnemyRef {
                q: i(&e["q"]),
                r: i(&e["r"]),
                dead: b(&e["dead"]),
                fading_out: b(&e["fadingOut"]),
                routed: b(&e["routed"]),
                is_catapult: b(&e["isCatapult"]),
            })
            .collect();
        let sc = &c["scene"];
        let wall_tile_hp: Vec<(i64, f64)> = sc["wallTileHp"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (i(&p[0]), num(&p[1])))
            .collect();
        for (k, a) in c["acts"].as_array().unwrap().iter().enumerate() {
            acts += 1;
            let mut script = a["script"].clone();
            if let Some(n) = opt_idx(&script["nearest"]) {
                script["__nearestPos"] = serde_json::json!([enemies[n].q, enemies[n].r]);
            }
            ru.q = i(&a["q"]);
            ru.r = i(&a["r"]);
            let scene = ActivateScene {
                finished: b(&a["finished"]),
                manual_mode: b(&a["manualMode"]),
                is_player_side: b(&script["playerSide"]),
                wall_col: i(&sc["wallCol"]),
                gate_open: b(&sc["gateOpen"]),
                wall_tile_hp: wall_tile_hp.clone(),
                siege_machine_range: num(&script["machineRange"]),
            };
            let res = activate_unit(&mut ru, &scene, &enemies, &mut Scripted { s: &script });
            let exp = &c["expect"][k];
            let got_trace: Vec<String> = res
                .events
                .iter()
                .filter(|e| comparable(e))
                .map(label)
                .collect();
            let exp_trace: Vec<String> = exp["trace"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_string())
                .collect();
            assert_eq!(
                got_trace, exp_trace,
                "slad przypadek {} aktywacja {k}",
                c["id"]
            );
            let got_br: Vec<&str> = res.branches.clone();
            let exp_br: Vec<&str> = exp["branches"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap())
                .collect();
            assert_eq!(
                got_br, exp_br,
                "galezie przypadek {} aktywacja {k}",
                c["id"]
            );
            let eu = &exp["unit"];
            assert_eq!(ru.routed, b(&eu["routed"]), "routed {}", c["id"]);
            assert_eq!(ru.surround_applied, b(&eu["surroundApplied"]));
            assert!(same(ru.morale, num(&eu["morale"])), "morale {}", c["id"]);
            assert!(same(ru.range, num(&eu["range"])), "range {}", c["id"]);
            assert!(same(ru.dry_col, num(&eu["dryCol"])), "dryCol {}", c["id"]);
            assert_eq!(ru.held_after_fallback, b(&eu["heldAfterFallback"]));
            assert_eq!(ru.player_order_none, b(&eu["playerOrderNone"]));
            for br in res.branches {
                *branches.entry(br.to_string()).or_default() += 1;
            }
            for e in res.events.iter().filter(|e| comparable(e)) {
                *kinds
                    .entry(label(e).split(':').next().unwrap().to_string())
                    .or_default() += 1;
            }
        }
    }
    (acts, branches, kinds)
}

fn counts(v: &serde_json::Value) -> BTreeMap<String, u64> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.clone(), x.as_u64().unwrap()))
        .collect()
}

#[test]
fn wektory_z_pinu_zgodne_a_liczniki_galezi_rowne() {
    let root: serde_json::Value = serde_json::from_str(VECTORS).unwrap();
    let meta = &root["meta"];
    assert!(meta["sequences"].as_u64().unwrap() >= 500);
    assert!(meta["nanCases"].as_u64().unwrap() > 0, "brak NaN/Inf");
    let (acts, branches, kinds) = run_vectors();
    assert_eq!(acts as u64, meta["activations"].as_u64().unwrap());
    assert_eq!(branches, counts(&meta["branchCounts"]));
    assert_eq!(kinds, counts(&meta["traceCounts"]));
    // Kazda galaz U7.1-U7.9 ma licznik > 0.
    for prefix in [
        "U7.1-", "U7.2-", "U7.3-", "U7.4-", "U7.5-", "U7.6-", "U7.7-", "U7.8-", "U7.9-",
    ] {
        assert!(
            branches
                .keys()
                .any(|k| k.starts_with(prefix) && branches[k] > 0),
            "brak pokrycia {prefix}"
        );
    }
    for must in [
        "U7.0-flee",
        "U7.0-surround",
        "U7.0-surround-flee",
        "U7.0-manual",
        "U7.0-doctrine",
        "U7.1-cata",
        "U7.1-shoot-attack",
        "U7.1-shoot-hold",
        "U7.1-melee-attack",
        "U7.1-melee-hold",
        "U7.2-climb",
        "U7.2-inf",
        "U7.3-ramtower",
        "U7.3-cata-fire",
        "U7.3-cata-advance",
        "U7.4-shoot",
        "U7.4-shoot-hold",
        "U7.4-melee",
        "U7.4-melee-hold",
        "U7.5-ranged",
        "U7.6-dry-record",
        "U7.6-adj-attack",
        "U7.6-set-held",
        "U7.6-hold",
        "U7.6-fallback",
        "U7.7-cavalry",
        "U7.8-phalanx",
        "U7.9-attack",
        "U7.9-advance",
    ] {
        assert!(
            branches.get(must).copied().unwrap_or(0) > 0,
            "brak galezi {must}"
        );
    }
}

/// Adapter K3: ops zlozone z `siege_tactics_tower` (wieza przy murze rejestruje rzad i konczy `done`).
struct TowerBacked {
    scene: TowerScene,
    unit: TowerUnit,
}

impl ActivateOps for TowerBacked {
    fn apply_terrain_range(&mut self, c: f64) -> f64 {
        c
    }
    fn perform_player_order(&mut self) -> bool {
        false
    }
    fn doctrine_step(&mut self) -> bool {
        false
    }
    fn tower_climb(&mut self) -> bool {
        tower_ops::climb(&mut self.scene, &mut self.unit).handled
    }
    fn infantry_to_tower(&mut self) -> bool {
        tower_ops::infantry(&mut self.scene, &mut self.unit).handled
    }
    fn ram_tower_step(&mut self) -> bool {
        tower_ops::ram_tower(&mut self.scene, &mut self.unit).handled
    }
    fn ranged_target_in_range(&mut self) -> Option<usize> {
        None
    }
    fn target_in_range(&mut self) -> Option<usize> {
        None
    }
    fn advance_coord(&mut self) -> f64 {
        0.0
    }
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
        None
    }
}

#[test]
fn adapter_k3_wieza_przy_murze_konczy_na_ram_tower_step() {
    let scene = TowerScene {
        finished: false,
        wall_col: 20,
        gate_col: 20,
        gate_row: 5,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 4,
        wall_tile_rows: BTreeSet::from([3, 4]),
        tower_rows: BTreeSet::new(),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: vec![],
        log: vec![],
    };
    let tunit = TowerUnit {
        walk: WalkUnit {
            q: 19,
            r: 7,
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
    let mut ops = TowerBacked { scene, unit: tunit };
    let mut ru = ActivateUnit {
        side_atk: true,
        q: 19,
        r: 7,
        dead: false,
        fading_out: false,
        routed: false,
        never_rout: false,
        surround_applied: true,
        morale: 50.0,
        flee_morale: 20.0,
        terrain_defence_mult: 1.0,
        range: 1.0,
        on_wall_walkway: false,
        primary_ranged: false,
        mounted: false,
        phalanx: false,
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: false,
        is_siege_unit: true,
        is_siege_tower: true,
        is_ram: false,
        is_catapult: false,
        doctrine_auto: false,
        doctrine_manual: false,
    };
    let scene = ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col: 20,
        gate_open: false,
        wall_tile_hp: vec![],
        siege_machine_range: 0.0,
    };
    let r = activate_unit(&mut ru, &scene, &[], &mut ops);
    assert!(r.branches.contains(&"U7.3-ramtower"));
    assert!(
        ops.scene.tower_rows.contains(&7),
        "K3 zarejestrowal rzad wiezy"
    );
}
