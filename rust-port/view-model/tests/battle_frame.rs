//! P4-1I2 (`R-RUSTPORT-P4-1I2-BATTLE-FRAME`): `BattleFrameDto` — klucze JSON,
//! round-trip, ścisłe klucze i walidacja kształtu ([`BattleFrameDto::validate`]).
//! Pin `07d2fbd72`, `gra/src/battle/battleScene.ts` (linie w komentarzach).

use civ_view_model::battle::{
    BattleFrameDto, BattleFrameUnitDto, BattleFrameWallDto, BattleWallTileHpDto,
};
use civ_view_model::ids::UnitId;
use civ_view_model::ViewError;
use serde_json::{json, Value};

fn uid(v: u64) -> UnitId {
    UnitId::try_new(v).unwrap()
}

fn unit(id: u64, ammo: Option<f64>) -> BattleFrameUnitDto {
    BattleFrameUnitDto {
        id: uid(id),
        col: 3,
        row: 2,
        facing: 1,
        hp: 40.0,
        morale: 75.5,
        ammo_left: ammo,
        routed: false,
        dead: false,
        removed: false,
        on_wall_walkway: false,
    }
}

fn sample() -> BattleFrameDto {
    BattleFrameDto {
        v_now: 1520.0,
        round_no: 3,
        units: vec![unit(7, None), unit(3, Some(2.0)), unit(5, Some(0.0))],
        wall: BattleFrameWallDto {
            tile_hp: vec![
                BattleWallTileHpDto { row: 2, hp: 80.0 },
                BattleWallTileHpDto { row: 4, hp: 100.0 },
            ],
            gate_hp: 120.0,
            gate_open: false,
            ever_breached: true,
            towers_destroyed: vec![6],
        },
        finished: false,
    }
}

fn keys(v: &Value) -> Vec<String> {
    let mut k: Vec<String> = v.as_object().unwrap().keys().cloned().collect();
    k.sort();
    k
}

#[test]
fn json_keys_camel_case() {
    let v = serde_json::to_value(sample()).unwrap();
    assert_eq!(keys(&v), ["finished", "roundNo", "units", "vNow", "wall"]);
    assert_eq!(
        keys(&v["units"][0]),
        [
            "ammoLeft",
            "col",
            "dead",
            "facing",
            "hp",
            "id",
            "morale",
            "onWallWalkway",
            "removed",
            "routed",
            "row"
        ]
    );
    assert_eq!(
        keys(&v["wall"]),
        [
            "everBreached",
            "gateHp",
            "gateOpen",
            "tileHp",
            "towersDestroyed"
        ]
    );
    assert_eq!(keys(&v["wall"]["tileHp"][0]), ["hp", "row"]);
}

/// `ammoLeft = Infinity` (`ammoCount`, `:1445`) nie istnieje w JSON: DTO niesie `None` → `null`.
#[test]
fn ammo_unlimited_is_null() {
    let v = serde_json::to_value(sample()).unwrap();
    assert_eq!(v["units"][0]["ammoLeft"], Value::Null);
    assert_eq!(v["units"][1]["ammoLeft"], json!(2.0));
    let back: BattleFrameDto = serde_json::from_value(v).unwrap();
    assert_eq!(back.units[0].ammo_left, None);
}

#[test]
fn round_trips() {
    let f = sample();
    let text = serde_json::to_string(&f).unwrap();
    let back: BattleFrameDto = serde_json::from_str(&text).unwrap();
    assert_eq!(back, f);
    assert_eq!(serde_json::to_string(&back).unwrap(), text);
    let mut empty = f;
    empty.units.clear();
    empty.wall.tile_hp.clear();
    empty.wall.towers_destroyed.clear();
    empty.finished = true;
    let back: BattleFrameDto =
        serde_json::from_value(serde_json::to_value(&empty).unwrap()).unwrap();
    assert_eq!(back, empty);
}

#[test]
fn unknown_and_missing_keys_rejected() {
    let base = serde_json::to_value(sample()).unwrap();
    for path in [
        vec![],
        vec!["units", "0"],
        vec!["wall"],
        vec!["wall", "tileHp", "0"],
    ] {
        let mut v = base.clone();
        let mut node = &mut v;
        for k in &path {
            node = match k.parse::<usize>() {
                Ok(i) => &mut node[i],
                Err(_) => &mut node[*k],
            };
        }
        node.as_object_mut()
            .unwrap()
            .insert("extra".into(), json!(1));
        assert!(
            serde_json::from_value::<BattleFrameDto>(v).is_err(),
            "nieznany klucz w {path:?} przyjęty"
        );
    }
    for key in ["vNow", "roundNo", "units", "wall", "finished"] {
        let mut v = base.clone();
        v.as_object_mut().unwrap().remove(key);
        assert!(
            serde_json::from_value::<BattleFrameDto>(v).is_err(),
            "brak {key} przyjęty"
        );
    }
    let mut v = base;
    v["wall"].as_object_mut().unwrap().remove("towersDestroyed");
    assert!(serde_json::from_value::<BattleFrameDto>(v).is_err());
}

#[test]
fn validate_accepts_sample() {
    sample().validate().unwrap();
    // `hp <= 0` po ciosie zabijającym (`:8991`) jest dozwolone.
    let mut f = sample();
    f.units[0].hp = -4.0;
    f.units[0].dead = true;
    f.validate().unwrap();
}

#[test]
fn validate_rejects_bad_shapes() {
    let check = |mutate: &dyn Fn(&mut BattleFrameDto), field: &str| {
        let mut f = sample();
        mutate(&mut f);
        let err = f.validate().expect_err(field);
        let got = match &err {
            ViewError::NonFinite { field }
            | ViewError::OutOfRange { field, .. }
            | ViewError::LengthMismatch { field, .. } => field.clone(),
            other => panic!("nieoczekiwany błąd {other:?}"),
        };
        assert_eq!(got, field, "{err}");
    };
    check(&|f| f.v_now = f64::NAN, "vNow");
    check(&|f| f.v_now = -1.0, "vNow");
    check(&|f| f.round_no = -1, "roundNo");
    check(&|f| f.units[1].hp = f64::INFINITY, "units[1].hp");
    check(&|f| f.units[2].morale = f64::NAN, "units[2].morale");
    // Amunicja bez limitu to `None`, nie `Some(Infinity)`.
    check(
        &|f| f.units[0].ammo_left = Some(f64::INFINITY),
        "units[0].ammoLeft",
    );
    check(&|f| f.units[1].ammo_left = Some(-1.0), "units[1].ammoLeft");
    // `Dir` ma tylko 0..3 (`:315-320`).
    check(&|f| f.units[1].facing = 4, "units[1].facing");
    check(&|f| f.units[1].facing = -1, "units[1].facing");
    check(&|f| f.units[2].id = uid(7), "units (unique id)");
    check(&|f| f.wall.gate_hp = f64::NAN, "wall.gateHp");
    check(&|f| f.wall.tile_hp[1].hp = f64::NAN, "wall.tileHp[1].hp");
    check(&|f| f.wall.tile_hp[1].row = 2, "wall.tileHp (unique row)");
    check(
        &|f| f.wall.towers_destroyed = vec![6, 6],
        "wall.towersDestroyed (unique row)",
    );
}
