//! P4-1I5a (`R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT`): warianty `Move` i `Shot` w `BattleActionKindDto` —
//! klucze JSON, round-trip, ścisłe klucze i walidacja (D-WIR-6, D-WIR-7).
//! Pin `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_doMove` `:8714-8776` (`const t0 = this._now()` `:8752`,
//! `MOVE_STEP_MS` `:1010`), `_doRangedAttack` `:9179-9235` (`RANGED_FLY_MS` `:1012`, `_schedule` `:9224`).

use civ_view_model::battle::{validate_actions, BattleActionDto, BattleActionKindDto};
use civ_view_model::ids::UnitId;
use civ_view_model::ViewError;
use serde_json::{json, Value};

fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).unwrap()
}

fn at(t0: f64, action: BattleActionKindDto) -> BattleActionDto {
    BattleActionDto { t0, action }
}

/// Krok i strzał jak w pinie: zwrot przed krokiem z tym samym `t0` (`_updateFacing` `:8750` przed `t0` `:8752`),
/// zwrot strzelca przed pociskiem (`:9182-9184`, `:9218`), etykieta obrażeń w chwili trafienia (`:9226`).
fn sample() -> Vec<BattleActionDto> {
    vec![
        at(1000.0, BattleActionKindDto::Facing { id: uid(3), dir: 1 }),
        at(
            1000.0,
            BattleActionKindDto::Move {
                id: uid(3),
                from_col: 10,
                from_row: 67,
                to_col: 11,
                to_row: 67,
                arrive_at: 1240.0,
            },
        ),
        at(
            1310.0,
            BattleActionKindDto::Facing {
                id: uid(1004),
                dir: 3,
            },
        ),
        at(
            1310.0,
            BattleActionKindDto::Shot {
                attacker: uid(1004),
                target: uid(3),
                land_at: 1690.0,
            },
        ),
        at(
            1690.0,
            BattleActionKindDto::Damage {
                target: uid(3),
                dmg: 4.0,
            },
        ),
    ]
}

#[test]
fn klucze_json_i_round_trip() {
    let a = sample();
    let v: Value = serde_json::to_value(&a).unwrap();
    assert_eq!(
        v[1],
        json!({ "t0": 1000.0, "action": {
            "kind": "move", "id": 3, "fromCol": 10, "fromRow": 67, "toCol": 11, "toRow": 67, "arriveAt": 1240.0
        } })
    );
    assert_eq!(
        v[3],
        json!({ "t0": 1310.0, "action": {
            "kind": "shot", "attacker": 1004, "target": 3, "landAt": 1690.0
        } })
    );
    let back: Vec<BattleActionDto> = serde_json::from_value(v).unwrap();
    assert_eq!(back, a);
    validate_actions(&a).unwrap();
    // Wartości niecałkowite czasu przechodzą bez straty (zegar wirtualny kroku, np. `1777.125`).
    let one = at(
        1777.125,
        BattleActionKindDto::Move {
            id: uid(3),
            from_col: 11,
            from_row: 67,
            to_col: 12,
            to_row: 67,
            arrive_at: 2017.125,
        },
    );
    let s = serde_json::to_string(&one).unwrap();
    assert_eq!(serde_json::from_str::<BattleActionDto>(&s).unwrap(), one);
}

#[test]
fn nieznane_i_brakujace_klucze_odrzucone() {
    let bad = json!({ "t0": 0.0, "action": {
        "kind": "move", "id": 1, "fromCol": 1, "fromRow": 1, "toCol": 2, "toRow": 1, "arriveAt": 240.0, "x": 0
    } });
    assert!(serde_json::from_value::<BattleActionDto>(bad).is_err());
    let bad = json!({ "t0": 0.0, "action": {
        "kind": "shot", "attacker": 1, "target": 2, "landAt": 380.0, "projectile": "arrow"
    } });
    assert!(serde_json::from_value::<BattleActionDto>(bad).is_err());
    // snake_case nie jest kluczem kontraktu.
    let bad = json!({ "t0": 0.0, "action": {
        "kind": "move", "id": 1, "from_col": 1, "fromRow": 1, "toCol": 2, "toRow": 1, "arriveAt": 240.0
    } });
    assert!(serde_json::from_value::<BattleActionDto>(bad).is_err());
    // brak `landAt`.
    let bad = json!({ "t0": 0.0, "action": { "kind": "shot", "attacker": 1, "target": 2 } });
    assert!(serde_json::from_value::<BattleActionDto>(bad).is_err());
}

fn err_field(e: ViewError) -> String {
    match e {
        ViewError::NonFinite { field }
        | ViewError::OutOfRange { field, .. }
        | ViewError::LengthMismatch { field, .. } => field,
        other => panic!("nieoczekiwany błąd {other:?}"),
    }
}

fn mv(fc: i32, fr: i32, tc: i32, tr: i32, arrive_at: f64) -> BattleActionKindDto {
    BattleActionKindDto::Move {
        id: uid(3),
        from_col: fc,
        from_row: fr,
        to_col: tc,
        to_row: tr,
        arrive_at,
    }
}

fn shot(attacker: u64, target: u64, land_at: f64) -> BattleActionKindDto {
    BattleActionKindDto::Shot {
        attacker: uid(attacker),
        target: uid(target),
        land_at,
    }
}

#[test]
fn walidacja_move() {
    let ok = sample();
    // arriveAt przed t0.
    let mut a = ok.clone();
    a[1].action = mv(10, 67, 11, 67, 999.0);
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[1].action.arriveAt"
    );
    // arriveAt == t0 jest poprawne dla DTO (dokładne `t0 + MOVE_STEP_MS` sprawdza konsument).
    let mut a = ok.clone();
    a[1].action = mv(10, 67, 11, 67, 1000.0);
    validate_actions(&a).unwrap();
    // NaN / Infinity.
    for bad in [f64::NAN, f64::INFINITY] {
        let mut a = ok.clone();
        a[1].action = mv(10, 67, 11, 67, bad);
        assert_eq!(
            err_field(validate_actions(&a).unwrap_err()),
            "actions[1].action.arriveAt"
        );
    }
    // from == to.
    let mut a = ok.clone();
    a[1].action = mv(10, 67, 10, 67, 1240.0);
    assert!(err_field(validate_actions(&a).unwrap_err()).starts_with("actions[1].action.to"));
    // Tylko kolumna albo tylko wiersz różne = poprawny krok; krok o więcej niż jedno pole też (D-WIR-6).
    for (tc, tr) in [(10, 68), (11, 67), (13, 70)] {
        let mut a = ok.clone();
        a[1].action = mv(10, 67, tc, tr, 1240.0);
        validate_actions(&a).unwrap();
    }
    // t0 kroku przed poprzednią akcją.
    let mut a = ok;
    a[1].t0 = 999.0;
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[1].t0"
    );
}

#[test]
fn walidacja_shot() {
    let ok = sample();
    // landAt przed t0.
    let mut a = ok.clone();
    a[3].action = shot(1004, 3, 1309.5);
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[3].action.landAt"
    );
    for bad in [f64::NAN, f64::NEG_INFINITY] {
        let mut a = ok.clone();
        a[3].action = shot(1004, 3, bad);
        assert_eq!(
            err_field(validate_actions(&a).unwrap_err()),
            "actions[3].action.landAt"
        );
    }
    // strzelec == cel.
    let mut a = ok.clone();
    a[3].action = shot(3, 3, 1690.0);
    assert!(err_field(validate_actions(&a).unwrap_err()).starts_with("actions[3].action.target"));
    // landAt == t0 poprawne dla DTO.
    let mut a = ok;
    a[3].action = shot(1004, 3, 1310.0);
    validate_actions(&a).unwrap();
}
