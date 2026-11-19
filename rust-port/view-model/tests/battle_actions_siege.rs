//! P4-1I5b (`R-RUSTPORT-P4-1I5B-BATTLE-ACTIONS-SIEGE`): warianty oblężnicze i ucieczki w `BattleActionKindDto` —
//! klucze JSON, round-trip, ścisłe klucze i walidacja (D-I5B-1..12).
//! Pin `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_fleeStep`/`_removeUnitFromScene` `:9845-9925`,
//! `_shakeAlliesOnLoss` `:9743-9753`, `_trySiegeTowerClimb` `:8056-8082`, `_attackWallTile` `:7540-7568`,
//! `_attackGate`/`_animateRam` `:7310-7360`, `_breachWallTile` `:7638-7750`, `_breachGate` `:7757-7811`,
//! `_destroyTowerAtRow` `:4194-4200`.

use civ_view_model::battle::{validate_actions, BattleActionDto, BattleActionKindDto as K};
use civ_view_model::ids::UnitId;
use civ_view_model::ViewError;
use serde_json::{json, Value};

fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).unwrap()
}

fn at(t0: f64, action: K) -> BattleActionDto {
    BattleActionDto { t0, action }
}

/// Sekwencja jak w pinie: wejście na mur, kamień i trafienie po 700 ms z wyburzeniem (wieża, wyłom, zejście z muru),
/// taran (320 ms) z otwarciem bramy, ucieczka z pola i ripple morale.
fn sample() -> Vec<BattleActionDto> {
    vec![
        at(
            100.0,
            K::ClimbWall {
                id: uid(2),
                from_col: 29,
                from_row: 70,
                to_col: 31,
                to_row: 70,
            },
        ),
        at(
            200.0,
            K::Boulder {
                id: uid(5),
                row: 72,
                land_at: 900.0,
            },
        ),
        at(
            300.0,
            K::Ram {
                id: uid(6),
                until: 620.0,
            },
        ),
        at(
            300.0,
            K::GateDamage {
                dmg: 14.0,
                hp_after: 0.0,
            },
        ),
        at(300.0, K::GateBreach {}),
        at(
            900.0,
            K::WallDamage {
                row: 72,
                dmg: 16.0,
                hp_after: 0.0,
            },
        ),
        at(900.0, K::TowerDestroyed { row: 72 }),
        at(900.0, K::WallBreach { row: 72 }),
        at(
            900.0,
            K::LeaveField {
                id: uid(1003),
                from_col: 31,
                from_row: 72,
                to_col: 32,
                to_row: 72,
            },
        ),
        at(1000.0, K::Leave { id: uid(1004) }),
        at(
            1000.0,
            K::Shaken {
                id: uid(1003),
                fallen: uid(1004),
                morale: 42.5,
            },
        ),
    ]
}

#[test]
fn klucze_json_i_round_trip() {
    let a = sample();
    let v: Value = serde_json::to_value(&a).unwrap();
    let want = [
        json!({"kind": "climbWall", "id": 2, "fromCol": 29, "fromRow": 70, "toCol": 31, "toRow": 70}),
        json!({"kind": "boulder", "id": 5, "row": 72, "landAt": 900.0}),
        json!({"kind": "ram", "id": 6, "until": 620.0}),
        json!({"kind": "gateDamage", "dmg": 14.0, "hpAfter": 0.0}),
        json!({"kind": "gateBreach"}),
        json!({"kind": "wallDamage", "row": 72, "dmg": 16.0, "hpAfter": 0.0}),
        json!({"kind": "towerDestroyed", "row": 72}),
        json!({"kind": "wallBreach", "row": 72}),
        json!({"kind": "leaveField", "id": 1003, "fromCol": 31, "fromRow": 72, "toCol": 32, "toRow": 72}),
        json!({"kind": "leave", "id": 1004}),
        json!({"kind": "shaken", "id": 1003, "fallen": 1004, "morale": 42.5}),
    ];
    assert_eq!(want.len(), a.len());
    for (i, w) in want.iter().enumerate() {
        assert_eq!(v[i]["action"], *w, "akcja {i}");
        assert_eq!(v[i]["t0"].as_f64(), Some(a[i].t0), "t0 {i}");
    }
    let back: Vec<BattleActionDto> = serde_json::from_value(v).unwrap();
    assert_eq!(back, a);
    validate_actions(&a).unwrap();
    // Wartości niecałkowite (zegar wirtualny) i ułamkowe morale przechodzą bez straty.
    let frac = vec![
        at(
            1777.125,
            K::Boulder {
                id: uid(5),
                row: 1,
                land_at: 2477.125,
            },
        ),
        at(
            2477.125,
            K::Shaken {
                id: uid(1),
                fallen: uid(2),
                morale: 0.1 + 0.2,
            },
        ),
    ];
    let s = serde_json::to_string(&frac).unwrap();
    let back: Vec<BattleActionDto> = serde_json::from_str(&s).unwrap();
    assert_eq!(back, frac);
}

#[test]
fn scisle_klucze_i_typy() {
    for bad in [
        json!({"t0": 0.0, "action": {"kind": "gateBreach", "row": 1}}),
        json!({"t0": 0.0, "action": {"kind": "leave", "id": 1, "x": 0}}),
        json!({"t0": 0.0, "action": {"kind": "ram", "id": 1}}),
        json!({"t0": 0.0, "action": {"kind": "wallDamage", "row": 1, "dmg": 1.0, "hp_after": 0.0}}),
        json!({"t0": 0.0, "action": {"kind": "climbWall", "id": 1, "fromCol": 1, "fromRow": 1, "toCol": 2}}),
        json!({"t0": 0.0, "action": {"kind": "shaken", "id": 1, "fallen": 2}}),
        json!({"t0": 0.0, "action": {"kind": "towerDestroyed", "row": 1.5}}),
        json!({"t0": 0.0, "action": {"kind": "boulder", "id": -1, "row": 1, "landAt": 700.0}}),
        json!({"t0": 0.0, "action": {"kind": "wall_breach", "row": 1}}),
    ] {
        assert!(
            serde_json::from_value::<BattleActionDto>(bad.clone()).is_err(),
            "{bad}"
        );
    }
}

fn err_field(r: Result<(), ViewError>) -> String {
    match r.expect_err("oczekiwany błąd") {
        ViewError::NonFinite { field }
        | ViewError::OutOfRange { field, .. }
        | ViewError::LengthMismatch { field, .. } => field,
        e => panic!("inny błąd {e:?}"),
    }
}

fn check(t0: f64, a: K) -> Result<(), ViewError> {
    at(t0, a).validate_at("a")
}

#[test]
fn walidacja_czasow_obu_stron() {
    // `landAt` kamienia i `until` taranu: skończone i >= t0 (t0 - 1 błąd, t0 i t0 + 1 poprawne).
    for (land, ok) in [(99.0, false), (100.0, true), (101.0, true), (800.0, true)] {
        let r = check(
            100.0,
            K::Boulder {
                id: uid(1),
                row: 3,
                land_at: land,
            },
        );
        assert_eq!(r.is_ok(), ok, "landAt {land}");
        if !ok {
            assert_eq!(err_field(r), "a.action.landAt");
        }
    }
    for (until, ok) in [(99.0, false), (100.0, true), (101.0, true), (420.0, true)] {
        let r = check(100.0, K::Ram { id: uid(1), until });
        assert_eq!(r.is_ok(), ok, "until {until}");
        if !ok {
            assert_eq!(err_field(r), "a.action.until");
        }
    }
    for bad in [f64::NAN, f64::INFINITY] {
        assert_eq!(
            err_field(check(
                0.0,
                K::Boulder {
                    id: uid(1),
                    row: 3,
                    land_at: bad
                }
            )),
            "a.action.landAt"
        );
        assert_eq!(
            err_field(check(
                0.0,
                K::Ram {
                    id: uid(1),
                    until: bad
                }
            )),
            "a.action.until"
        );
    }
    // `t0` każdej nowej akcji: skończone i >= 0.
    assert_eq!(err_field(check(-1.0, K::GateBreach {})), "a.t0");
    assert_eq!(err_field(check(f64::NAN, K::Leave { id: uid(1) })), "a.t0");
}

#[test]
fn walidacja_obrazen_i_hp() {
    for (dmg, hp, field) in [
        (0.0, 1.0, Some("a.action.dmg")),
        (-1.0, 1.0, Some("a.action.dmg")),
        (f64::NAN, 1.0, Some("a.action.dmg")),
        (1.0, -1.0, Some("a.action.hpAfter")),
        (1.0, -0.5, Some("a.action.hpAfter")),
        (1.0, f64::INFINITY, Some("a.action.hpAfter")),
        (1.0, 0.0, None),
        (0.5, 0.0, None),
        (16.0, 84.0, None),
    ] {
        let rw = check(
            0.0,
            K::WallDamage {
                row: 2,
                dmg,
                hp_after: hp,
            },
        );
        let rg = check(0.0, K::GateDamage { dmg, hp_after: hp });
        match field {
            Some(f) => {
                assert_eq!(err_field(rw), f, "mur {dmg} {hp}");
                assert_eq!(err_field(rg), f, "brama {dmg} {hp}");
            }
            None => {
                rw.unwrap();
                rg.unwrap();
            }
        }
    }
    // `Shaken`: morale skończone i >= 0, sojusznik != poległy.
    // `+Infinity` przechodzi `>= 0`, więc odrzuca go wyłącznie `action_finite` (obrona r1, Z-3, mutant V1).
    for (m, ok) in [
        (-0.5, false),
        (0.0, true),
        (0.5, true),
        (f64::NAN, false),
        (f64::INFINITY, false),
        (f64::NEG_INFINITY, false),
    ] {
        let r = check(
            0.0,
            K::Shaken {
                id: uid(1),
                fallen: uid(2),
                morale: m,
            },
        );
        assert_eq!(r.is_ok(), ok, "morale {m}");
        if !ok {
            assert_eq!(err_field(r), "a.action.morale");
        }
    }
    assert_eq!(
        err_field(check(
            0.0,
            K::Shaken {
                id: uid(1),
                fallen: uid(1),
                morale: 5.0
            }
        )),
        "a.action.fallen (!= id)"
    );
}

#[test]
fn walidacja_indeksow_i_wejscia_na_mur() {
    let climb = |fc: i32, fr: i32, tc: i32, tr: i32| {
        check(
            0.0,
            K::ClimbWall {
                id: uid(1),
                from_col: fc,
                from_row: fr,
                to_col: tc,
                to_row: tr,
            },
        )
    };
    climb(29, 70, 31, 70).unwrap();
    climb(30, 70, 31, 70).unwrap();
    // Wiersz bez zmiany: r - 1 i r + 1 to błąd.
    assert_eq!(
        err_field(climb(30, 70, 31, 71)),
        "a.action.toRow (== fromRow)"
    );
    assert_eq!(
        err_field(climb(30, 70, 31, 69)),
        "a.action.toRow (== fromRow)"
    );
    assert_eq!(
        err_field(climb(31, 70, 31, 70)),
        "a.action.toCol (!= fromCol)"
    );
    assert_eq!(err_field(climb(-1, 70, 31, 70)), "a.action.fromCol");
    assert_eq!(err_field(climb(30, -1, 31, -1)), "a.action.fromRow");
    assert_eq!(err_field(climb(30, 70, -1, 70)), "a.action.toCol");
    let leave = |fc: i32, fr: i32, tc: i32, tr: i32| {
        check(
            0.0,
            K::LeaveField {
                id: uid(1),
                from_col: fc,
                from_row: fr,
                to_col: tc,
                to_row: tr,
            },
        )
    };
    // Zostaje na miejscu (`to == from`, brak wolnego pola, `:7717`) jest poprawne.
    leave(31, 72, 31, 72).unwrap();
    leave(31, 72, 32, 74).unwrap();
    assert_eq!(err_field(leave(-1, 72, 32, 72)), "a.action.fromCol");
    assert_eq!(err_field(leave(31, -1, 32, 72)), "a.action.fromRow");
    assert_eq!(err_field(leave(31, 72, -1, 72)), "a.action.toCol");
    assert_eq!(err_field(leave(31, 72, 32, -1)), "a.action.toRow");
    for (row, ok) in [(-1, false), (0, true), (1, true)] {
        for a in [
            K::WallBreach { row },
            K::TowerDestroyed { row },
            K::Boulder {
                id: uid(1),
                row,
                land_at: 700.0,
            },
            K::WallDamage {
                row,
                dmg: 1.0,
                hp_after: 0.0,
            },
        ] {
            let r = check(0.0, a.clone());
            assert_eq!(r.is_ok(), ok, "{a:?}");
            if !ok {
                assert_eq!(err_field(r), "a.action.row");
            }
        }
    }
}

#[test]
fn lista_kolejnosc_czasu_z_nowymi_akcjami() {
    let mut a = sample();
    validate_actions(&a).unwrap();
    // `t0` cofnięte o 1 ms w środku listy = błąd z indeksem.
    a[6].t0 = 899.0;
    match validate_actions(&a) {
        Err(ViewError::OutOfRange { field, .. }) => assert_eq!(field, "actions[6].t0"),
        e => panic!("{e:?}"),
    }
}
