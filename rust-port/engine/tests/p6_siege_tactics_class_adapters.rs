//! P6 SIEGE-TAKTYKA KLASY-WIRE (R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASYWIRE-Q1): testy zgodnosci adapterow flag klas.
//!
//! Dowody (wektory `p6_siege_tactics_classify_vectors/vectors.json`, pin `07d2fbd72`):
//! (1) dla KAZDEJ z 872 nazw z wektorow: flagi `is_siege_unit` / `is_siege_tower` / `is_ram` z adaptera = pole wektora;
//! (2) dla KAZDEGO z 20 wejsc `canShoot`: flaga `can_shoot` z adaptera = pole wektora;
//! (3) kompozycja: dla kazdej pary (nazwa, wejscie canShoot) = 17440 jednostek, flagi z adaptera == flagi z wektora,
//!     a wynik funkcji decyzyjnych K1 (`siege_approach_restricted`), K3 (`siege_ram_tower_step`, `siege_tower_climb`,
//!     `siege_infantry_to_tower_step`) i K5H (`activate_unit`) na jednostkach zbudowanych z flag adaptera == wynik na
//!     jednostkach zbudowanych z flag wektora, dla kilku wariantow wspolnych pol i sceny.
//!
//! Uwaga: wynik K3 jest cache'owany po krotce flag (K3 wykonuje BFS, ~6000 odwiedzin); cache nie omija porownania,
//! bo obie strony (adapter i wektor) sa liczone i porownywane dla kazdej jednostki.
//! `is_catapult` jest wejsciem wolajacego (brak klasyfikatora w wektorach, NIE_ZMIERZONO): testy wariantuja go
//! jawnie (false i true) po obu stronach porownania, zeby galez K5H zalezna od katapulty byla pokryta.
//!
//! Test (4) [`adapter_wires_flags_into_expected_fields`] nie korzysta z adaptera do budowy oczekiwanych struktur:
//! literaly ApproachUnit / TowerUnit / ActivateUnit sa skladane z pol wektora i wejsc wolajacego, a adapter ma
//! ich dokladnie dorownac. Wylapuje zamiane pol (np. `is_ram` <-> `is_siege_tower`), ktorej testy (3) nie widza,
//! bo obie strony kompozycji uzywaja tego samego okablowania.
//! Test (5) [`each_class_flag_changes_some_decision`] dowodzi, ze scena jest wrazliwa na kazda flage.

use civ_engine::domain::siege_tactics_activate::{
    activate_unit, ActivateOps, ActivateResult, ActivateScene, ActivateUnit, EnemyRef,
};
use civ_engine::domain::siege_tactics_approach::{
    siege_approach_restricted, ApproachUnit, ApproachWallState, Threat,
};
use civ_engine::domain::siege_tactics_class_adapters::{
    activate_unit as adapt_activate, approach_unit, class_flags, tower_unit, ClassFlags,
    CommonFields,
};
use civ_engine::domain::siege_tactics_classify::{ClassifyUnit, ShootUnit};
use civ_engine::domain::siege_tactics_tower::{
    siege_infantry_to_tower_step, siege_ram_tower_step, siege_tower_climb, TowerOutcome,
    TowerScene, TowerUnit,
};
use civ_engine::domain::siege_tactics_walk::WalkUnit;
use std::collections::{BTreeSet, HashSet};

const VECTORS: &str = include_str!("p6_siege_tactics_classify_vectors/vectors.json");

fn opt_str(v: &serde_json::Value) -> Option<String> {
    if v.is_null() {
        None
    } else {
        Some(v.as_str().expect("napis albo null").to_string())
    }
}

fn ammo(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::Number(n) => n.as_f64().expect("liczba"),
        serde_json::Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("liczba w napisie"),
        },
        other => panic!("nieoczekiwany typ ammoLeft: {other}"),
    }
}

/// Wektor nazwy: wejscie `ClassifyUnit` i oczekiwane flagi pinu.
struct NameCase {
    unit: ClassifyUnit,
    siege_unit: bool,
    siege_tower: bool,
    ram: bool,
}

/// Wektor canShoot: wejscie `ShootUnit` i oczekiwany wynik pinu.
struct ShootCase {
    shoot: ShootUnit,
    can_shoot: bool,
}

fn load() -> (Vec<NameCase>, Vec<ShootCase>) {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("json");
    let names = root["names"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| NameCase {
            unit: ClassifyUnit {
                typ: opt_str(&c["in"]["typ"]),
                jednostka: opt_str(&c["in"]["jednostka"]),
                nazwa: opt_str(&c["in"]["nazwa"]),
            },
            siege_unit: c["isSiegeUnit"].as_bool().unwrap(),
            siege_tower: c["isSiegeTower"].as_bool().unwrap(),
            ram: c["isRam"].as_bool().unwrap(),
        })
        .collect();
    let shoots = root["canShoot"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| ShootCase {
            shoot: ShootUnit {
                ranged_base: c["in"]["rangedBase"].as_bool().unwrap(),
                ammo_left: ammo(&c["in"]["ammoLeft"]),
            },
            can_shoot: c["canShoot"].as_bool().unwrap(),
        })
        .collect();
    (names, shoots)
}

/// Wspolne pola: 16 wariantow (side_atk x mounted x primary_ranged x shooting_disabled), routed/walkway = false.
fn common_variants() -> Vec<CommonFields> {
    let mut out = Vec::new();
    for &side_atk in &[true, false] {
        for &mounted in &[true, false] {
            for &primary_ranged in &[true, false] {
                for &shooting_disabled in &[true, false] {
                    out.push(CommonFields {
                        side_atk,
                        routed: false,
                        on_wall_walkway: false,
                        mounted,
                        primary_ranged,
                        shooting_disabled,
                    });
                }
            }
        }
    }
    out
}

fn wall_variants() -> Vec<ApproachWallState> {
    vec![
        ApproachWallState {
            wall_col_ge0: true,
            gate_open: false,
            wall_ever_breached: false,
            wall_tiles_init: 4,
            wall_tiles_alive: 4,
            tower_at_wall_rows_count: 0,
        },
        ApproachWallState {
            wall_col_ge0: true,
            gate_open: false,
            wall_ever_breached: false,
            wall_tiles_init: 4,
            wall_tiles_alive: 2,
            tower_at_wall_rows_count: 1,
        },
        ApproachWallState {
            wall_col_ge0: true,
            gate_open: true,
            wall_ever_breached: true,
            wall_tiles_init: 4,
            wall_tiles_alive: 4,
            tower_at_wall_rows_count: 0,
        },
    ]
}

fn tower_scene() -> TowerScene {
    TowerScene {
        finished: false,
        wall_col: 5,
        gate_col: 5,
        gate_row: 3,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 4,
        wall_tile_rows: [2, 3, 4, 5].into_iter().collect::<BTreeSet<i64>>(),
        tower_rows: BTreeSet::new(),
        occupied: HashSet::new(),
        blocked: HashSet::new(),
        threats: vec![Threat {
            q: 9.0,
            r: 3.0,
            range: 2.0,
        }],
        log: Vec::new(),
    }
}

fn tower_walk() -> WalkUnit {
    WalkUnit {
        q: 8,
        r: 3,
        move_left: 3.0,
        dead: false,
        fading_out: false,
    }
}

fn activate_scene() -> ActivateScene {
    ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col: 5,
        gate_open: false,
        wall_tile_hp: vec![(2, 10.0), (3, 10.0)],
        siege_machine_range: 4.0,
    }
}

fn activate_base(c: &CommonFields) -> ActivateUnit {
    ActivateUnit {
        side_atk: c.side_atk,
        q: 8,
        r: 3,
        dead: false,
        fading_out: false,
        routed: c.routed,
        never_rout: false,
        surround_applied: false,
        morale: 50.0,
        flee_morale: 20.0,
        terrain_defence_mult: 1.0,
        range: 2.0,
        on_wall_walkway: c.on_wall_walkway,
        primary_ranged: c.primary_ranged,
        mounted: c.mounted,
        phalanx: false,
        shooting_disabled: c.shooting_disabled,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: false,
        can_shoot: false,
        is_siege_unit: false,
        is_siege_tower: false,
        is_ram: false,
        is_catapult: false,
        doctrine_auto: true,
        doctrine_manual: false,
    }
}

/// Deterministyczne zapytania K5H (bez skutkow ubocznych).
struct StubOps;
impl ActivateOps for StubOps {
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
        false
    }
    fn infantry_to_tower(&mut self) -> bool {
        false
    }
    fn ram_tower_step(&mut self) -> bool {
        false
    }
    fn ranged_target_in_range(&mut self) -> Option<usize> {
        Some(0)
    }
    fn target_in_range(&mut self) -> Option<usize> {
        Some(0)
    }
    fn advance_coord(&mut self) -> f64 {
        1.0
    }
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
        Some((9, 3))
    }
}

/// Wynik wszystkich trzech funkcji decyzyjnych dla jednego zestawu flag i wspolnych pol.
#[derive(Debug, PartialEq)]
struct Decision {
    approach: Vec<bool>,
    tower: Vec<(TowerOutcome, TowerUnit, TowerScene)>,
    activate: (ActivateResult, ActivateUnit),
}

fn decide(flags: &ClassFlags, common: &CommonFields, catapult: bool) -> Decision {
    // K1
    let approach: Vec<bool> = wall_variants()
        .iter()
        .map(|w| siege_approach_restricted(&approach_unit(common, flags), w))
        .collect();

    // K3: trzy funkcje wiez na kopii sceny i jednostki
    let mut tower = Vec::new();
    for step in 0..3 {
        let mut scene = tower_scene();
        let mut unit = tower_unit(tower_walk(), common, flags);
        let out = match step {
            0 => siege_ram_tower_step(&mut scene, &mut unit),
            1 => siege_tower_climb(&mut scene, &mut unit),
            _ => siege_infantry_to_tower_step(&mut scene, &mut unit),
        };
        tower.push((out, unit, scene));
    }

    // K5H
    let enemies = [EnemyRef {
        q: 9,
        r: 3,
        dead: false,
        fading_out: false,
        routed: false,
        is_catapult: false,
    }];
    let mut au = adapt_activate(activate_base(common), flags, catapult);
    let scene = activate_scene();
    let res = activate_unit(&mut au, &scene, &enemies, &mut StubOps);

    Decision {
        approach,
        tower,
        activate: (res, au),
    }
}

#[test]
fn name_vectors_adapter_flags_equal_pin() {
    let (names, _) = load();
    assert!(names.len() >= 300, "przypadkow nazw: {}", names.len());
    let mut checked = 0usize;
    for c in &names {
        let f = class_flags(
            &c.unit,
            &ShootUnit {
                ranged_base: false,
                ammo_left: 0.0,
            },
        );
        assert_eq!(f.is_siege_unit, c.siege_unit, "isSiegeUnit: {:?}", c.unit);
        assert_eq!(
            f.is_siege_tower, c.siege_tower,
            "isSiegeTower: {:?}",
            c.unit
        );
        assert_eq!(f.is_ram, c.ram, "isRam: {:?}", c.unit);
        checked += 1;
    }
    assert!(checked >= 300, "sprawdzonych nazw: {checked}");
}

#[test]
fn can_shoot_vectors_adapter_flag_equal_pin() {
    let (names, shoots) = load();
    let mut checked = 0usize;
    for s in &shoots {
        let f = class_flags(&names[0].unit, &s.shoot);
        assert_eq!(f.can_shoot, s.can_shoot, "canShoot: {:?}", s.shoot);
        checked += 1;
    }
    assert_eq!(checked, 20);
}

#[test]
fn composition_adapter_flags_drive_same_decisions_as_vector_flags() {
    let (names, shoots) = load();
    let commons = common_variants();
    let mut units = 0usize;
    let mut compared = 0usize;

    for c in &names {
        for s in &shoots {
            units += 1;
            let adapter_flags = class_flags(&c.unit, &s.shoot);
            let vector_flags = ClassFlags {
                is_siege_unit: c.siege_unit,
                is_siege_tower: c.siege_tower,
                is_ram: c.ram,
                can_shoot: s.can_shoot,
            };
            assert_eq!(
                adapter_flags, vector_flags,
                "flagi: {:?} / {:?}",
                c.unit, s.shoot
            );

            for (vi, common) in commons.iter().enumerate() {
                for catapult in [false, true] {
                    let from_adapter = decide(&adapter_flags, common, catapult);
                    let from_vector = decide(&vector_flags, common, catapult);
                    assert_eq!(
                        from_adapter, from_vector,
                        "decyzje dla {:?} / {:?} / wariant {vi} / katapulta {catapult}",
                        c.unit, s.shoot
                    );
                    compared += 1;
                }
            }
        }
    }
    assert!(units >= 300, "jednostek kompozycji: {units}");
    assert_eq!(compared, units * commons.len() * 2);
}

/// Oczekiwany `ApproachUnit` zlozony z pol wektora (`v`, `s`) i wspolnych pol (`c`), bez adaptera.
fn expected_approach(c: &CommonFields, v: &NameCase, s: &ShootCase) -> ApproachUnit {
    ApproachUnit {
        side_atk: c.side_atk,
        routed: c.routed,
        on_wall_walkway: c.on_wall_walkway,
        is_siege_unit: v.siege_unit,
        primary_ranged: c.primary_ranged,
        can_shoot: s.can_shoot,
        shooting_disabled: c.shooting_disabled,
        mounted: c.mounted,
    }
}

#[test]
fn adapter_wires_flags_into_expected_fields() {
    let (names, shoots) = load();
    let commons = common_variants();
    let mut checked = 0usize;

    for c in &names {
        for s in &shoots {
            for common in &commons {
                // K1: pola wejscia ApproachUnit.
                let flags = class_flags(&c.unit, &s.shoot);
                assert_eq!(
                    approach_unit(common, &flags),
                    expected_approach(common, c, s),
                    "K1 {:?} / {:?}",
                    c.unit,
                    s.shoot
                );

                // K3: pola TowerUnit, w tym is_ram i is_siege_tower z wlasnych pol.
                let expected_tower = TowerUnit {
                    walk: tower_walk(),
                    side_atk: common.side_atk,
                    routed: common.routed,
                    on_wall_walkway: common.on_wall_walkway,
                    mounted: common.mounted,
                    primary_ranged: common.primary_ranged,
                    can_shoot: s.can_shoot,
                    shooting_disabled: common.shooting_disabled,
                    is_siege_unit: c.siege_unit,
                    is_ram: c.ram,
                    is_siege_tower: c.siege_tower,
                };
                assert_eq!(
                    tower_unit(tower_walk(), common, &flags),
                    expected_tower,
                    "K3 {:?} / {:?}",
                    c.unit,
                    s.shoot
                );

                // K5H: pola ActivateUnit; is_catapult jest wejsciem wolajacego.
                for catapult in [false, true] {
                    let expected_activate = ActivateUnit {
                        can_shoot: s.can_shoot,
                        is_siege_unit: c.siege_unit,
                        is_siege_tower: c.siege_tower,
                        is_ram: c.ram,
                        is_catapult: catapult,
                        ..activate_base(common)
                    };
                    assert_eq!(
                        adapt_activate(activate_base(common), &flags, catapult),
                        expected_activate,
                        "K5H {:?} / {:?} / katapulta {catapult}",
                        c.unit,
                        s.shoot
                    );
                    checked += 1;
                }
            }
        }
    }
    assert_eq!(checked, names.len() * shoots.len() * commons.len() * 2);
}

/// Wrazliwosc sceny: dla kazdej flagi istnieje wariant (pozostale flagi, wspolne pola, katapulta), w ktorym jej
/// przelaczenie zmienia wynik K1/K3/K5H. Bez tego test (3) moglby przejsc dla sceny, ktora flagi ignoruje.
#[test]
fn each_class_flag_changes_some_decision() {
    let commons = common_variants();
    let flag_set = |bits: u8| ClassFlags {
        is_siege_unit: bits & 1 != 0,
        is_siege_tower: bits & 2 != 0,
        is_ram: bits & 4 != 0,
        can_shoot: bits & 8 != 0,
    };
    let flip = |f: ClassFlags, idx: usize| match idx {
        0 => ClassFlags {
            is_siege_unit: !f.is_siege_unit,
            ..f
        },
        1 => ClassFlags {
            is_siege_tower: !f.is_siege_tower,
            ..f
        },
        2 => ClassFlags {
            is_ram: !f.is_ram,
            ..f
        },
        _ => ClassFlags {
            can_shoot: !f.can_shoot,
            ..f
        },
    };
    let mut sensitive = [false; 5];

    for bits in 0u8..16 {
        let base = flag_set(bits);
        for common in &commons {
            for catapult in [false, true] {
                let d0 = decide(&base, common, catapult);
                for (idx, hit) in sensitive.iter_mut().enumerate().take(4) {
                    if !*hit && decide(&flip(base, idx), common, catapult) != d0 {
                        *hit = true;
                    }
                }
            }
            if !sensitive[4] && decide(&base, common, true) != decide(&base, common, false) {
                sensitive[4] = true;
            }
        }
    }
    assert_eq!(
        sensitive,
        [true; 5],
        "flagi bez wplywu na decyzje [is_siege_unit, is_siege_tower, is_ram, can_shoot, is_catapult]: {sensitive:?}"
    );
}
