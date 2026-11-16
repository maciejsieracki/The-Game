//! P4-1I3 (`R-RUSTPORT-P4-1I3-BATTLE-ACTIONS`): `BattleActionDto` — klucze JSON, round-trip, ścisłe klucze i
//! walidacja kształtu ([`BattleActionDto::validate_at`], [`validate_actions`]).
//! Pin `07d2fbd72`, `gra/src/battle/battleScene.ts` (linie w komentarzach).

use civ_view_model::battle::{
    validate_actions, BattleActionDto, BattleActionKindDto, BattleActorDto, BattleClashTagDto,
    BattleWinner,
};
use civ_view_model::ids::UnitId;
use civ_view_model::ViewError;
use serde_json::{json, Value};

fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).unwrap()
}

fn at(t0: f64, action: BattleActionKindDto) -> BattleActionDto {
    BattleActionDto { t0, action }
}

/// Sekwencja jak w pinie: tura, zwrot + lunge (`:9104-9105`), log trafienia (`:8997`), wpis starcia (`:9067`),
/// etykieta (`:9125`), wieża (`:4247`, `:4260`), rout (`:9801`, `:9818-9819`), śmierć, koniec.
fn sample() -> Vec<BattleActionDto> {
    vec![
        at(0.0, BattleActionKindDto::Turn { round_no: 1 }),
        at(10.0, BattleActionKindDto::Facing { id: uid(7), dir: 1 }),
        at(
            10.0,
            BattleActionKindDto::Melee {
                attacker: uid(7),
                target: uid(5),
                hit_at: 160.0,
            },
        ),
        at(
            160.0,
            BattleActionKindDto::Log {
                text: "atk0 trafia def0 za 12 (HP 28/40).".into(),
            },
        ),
        at(
            160.0,
            BattleActionKindDto::Clash {
                attacker: BattleActorDto::Unit { id: uid(7) },
                target: uid(5),
                dmg: 12.0,
                tag: BattleClashTagDto::Plain,
                text: "atk0 (atak) -> def0 (obr): -12 HP".into(),
            },
        ),
        at(
            160.0,
            BattleActionKindDto::Damage {
                target: uid(5),
                dmg: 12.0,
            },
        ),
        at(
            200.0,
            BattleActionKindDto::TowerShot {
                row: 4,
                target: uid(7),
                land_at: 580.0,
            },
        ),
        at(
            580.0,
            BattleActionKindDto::Clash {
                attacker: BattleActorDto::Tower { row: 4 },
                target: uid(7),
                dmg: 3.0,
                tag: BattleClashTagDto::Rout,
                text: "Wieza (Lucznik) (obr) -> atk0 (atak): -3 HP (rout)".into(),
            },
        ),
        at(580.0, BattleActionKindDto::Rout { id: uid(7) }),
        at(600.0, BattleActionKindDto::Kill { id: uid(5) }),
        at(
            600.0,
            BattleActionKindDto::End {
                winner: BattleWinner::Atakujacy,
            },
        ),
    ]
}

#[test]
fn klucze_json_i_round_trip() {
    let a = sample();
    let v: Value = serde_json::to_value(&a).unwrap();
    assert_eq!(
        v[0],
        json!({ "t0": 0.0, "action": { "kind": "turn", "roundNo": 1 } })
    );
    assert_eq!(
        v[2]["action"],
        json!({ "kind": "melee", "attacker": 7, "target": 5, "hitAt": 160.0 })
    );
    assert_eq!(
        v[6]["action"],
        json!({ "kind": "towerShot", "row": 4, "target": 7, "landAt": 580.0 })
    );
    assert_eq!(
        v[7]["action"]["attacker"],
        json!({ "type": "tower", "row": 4 })
    );
    assert_eq!(
        v[4]["action"]["attacker"],
        json!({ "type": "unit", "id": 7 })
    );
    assert_eq!(v[4]["action"]["tag"], json!("plain"));
    assert_eq!(
        v[10]["action"],
        json!({ "kind": "end", "winner": "atakujacy" })
    );
    let back: Vec<BattleActionDto> = serde_json::from_value(v).unwrap();
    assert_eq!(back, a);
    validate_actions(&a).unwrap();
}

#[test]
fn nieznane_klucze_odrzucone() {
    let bad = json!({ "t0": 0.0, "action": { "kind": "turn", "roundNo": 1 }, "extra": 1 });
    assert!(serde_json::from_value::<BattleActionDto>(bad).is_err());
    let bad = json!({ "t0": 0.0, "action": { "kind": "kill", "id": 1, "extra": 2 } });
    assert!(serde_json::from_value::<BattleActionDto>(bad).is_err());
    let bad = json!({ "t0": 0.0, "action": { "kind": "nieznany" } });
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

#[test]
fn walidacja_ksztaltu() {
    let ok = sample();
    // t0 malejące.
    let mut a = ok.clone();
    a[3].t0 = 5.0;
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[3].t0"
    );
    // hitAt przed t0.
    let mut a = ok.clone();
    a[2].action = BattleActionKindDto::Melee {
        attacker: uid(7),
        target: uid(5),
        hit_at: 9.0,
    };
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[2].action.hitAt"
    );
    // atakujący == cel.
    let mut a = ok.clone();
    a[2].action = BattleActionKindDto::Melee {
        attacker: uid(5),
        target: uid(5),
        hit_at: 160.0,
    };
    assert!(err_field(validate_actions(&a).unwrap_err()).starts_with("actions[2].action.target"));
    // dmg = 0 (etykieta tylko dla dmg > 0, `:9125`).
    let mut a = ok.clone();
    a[5].action = BattleActionKindDto::Damage {
        target: uid(5),
        dmg: 0.0,
    };
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[5].action.dmg"
    );
    // NaN w landAt.
    let mut a = ok.clone();
    a[6].action = BattleActionKindDto::TowerShot {
        row: 4,
        target: uid(7),
        land_at: f64::NAN,
    };
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[6].action.landAt"
    );
    // facing poza Dir.
    let mut a = ok.clone();
    a[1].action = BattleActionKindDto::Facing { id: uid(7), dir: 4 };
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[1].action.dir"
    );
    // pusty log.
    let mut a = ok.clone();
    a[3].action = BattleActionKindDto::Log {
        text: String::new(),
    };
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[3].action.text"
    );
    // tura 0.
    let mut a = ok.clone();
    a[0].action = BattleActionKindDto::Turn { round_no: 0 };
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[0].action.roundNo"
    );
    // ujemne t0.
    let mut a = ok;
    a[0].t0 = -1.0;
    assert_eq!(
        err_field(validate_actions(&a).unwrap_err()),
        "actions[0].t0"
    );
}
