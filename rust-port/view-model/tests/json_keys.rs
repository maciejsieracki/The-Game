//! Criterion 2: the JSON keys of every object are exactly the names of
//! contract §3 (`P4-1-RENDER-DTO-CONTRACT.md`), no drift in either direction,
//! and unknown keys are rejected.

mod common;

use common::*;
use serde_json::{json, Value};

fn keys(v: &Value) -> Vec<String> {
    let mut k: Vec<String> = v
        .as_object()
        .unwrap_or_else(|| panic!("not an object: {v}"))
        .keys()
        .cloned()
        .collect();
    k.sort();
    k
}

fn expect(v: &Value, names: &[&str], what: &str) {
    let mut want: Vec<String> = names.iter().map(|s| (*s).to_owned()).collect();
    want.sort();
    assert_eq!(keys(v), want, "keys of {what}");
}

fn view() -> Value {
    serde_json::to_value(sample_view()).unwrap()
}

/// §3.1 root (+ `stacks`, see `RenderViewDto` docs).
#[test]
fn root_keys() {
    expect(
        &view(),
        &[
            "contractVersion",
            "viewer",
            "turn",
            "map",
            "hexState",
            "fog",
            "owners",
            "cities",
            "units",
            "stacks",
            "sieges",
            "wonders",
            "territory",
            "overlays",
            "battle",
        ],
        "RenderViewDto",
    );
    expect(&view()["viewer"], &["ownerId", "fogActive"], "viewer");
}

/// §3.2 map.
#[test]
fn map_keys() {
    let v = view();
    expect(
        &v["map"],
        &[
            "width",
            "height",
            "seed",
            "hexes",
            "rivers",
            "riverRenderPaths",
        ],
        "MapViewDto",
    );
    expect(
        &v["map"]["hexes"][0],
        &["coord", "terenBazowy", "rzekaKrawedzie"],
        "HexStaticDto",
    );
    expect(&v["map"]["hexes"][0]["coord"], &["q", "r"], "HexCoord");
    expect(&v["map"]["rivers"][0], &["hexes", "kind"], "RiverPathDto");
    expect(
        &v["hexState"][0],
        &[
            "nakladka",
            "ulepszenie",
            "ulepszenia",
            "improvementKey",
            "zloze",
            "villagePresent",
            "terraces",
            "coveringImprovement",
            "roadMask",
        ],
        "HexDynDto",
    );
}

/// §3.3 fog.
#[test]
fn fog_keys() {
    let v = view();
    expect(&v["fog"], &["state"], "FogViewDto");
    assert_eq!(v["fog"]["state"], json!([2, 1, 0, 2]));
}

/// §3.4 owners and cities.
#[test]
fn owner_and_city_keys() {
    let v = view();
    expect(
        &v["owners"][1],
        &[
            "ownerId",
            "color",
            "civIconId",
            "bronzeCiv",
            "era",
            "isCityState",
            "isBarbarian",
            "ringHex",
            "displayName",
            "mapOutlineKind",
            "capitalCityId",
            "relationToViewer",
        ],
        "OwnerViewDto",
    );
    expect(
        &v["cities"][0],
        &[
            "id",
            "ownerId",
            "hex",
            "population",
            "level",
            "wallKind",
            "revolt",
            "besieged",
            "fogVisible",
            "unitCountOnHex",
            "badge",
        ],
        "CityViewDto",
    );
    expect(
        &v["cities"][0]["badge"],
        &[
            "cityName",
            "population",
            "defenseTier",
            "civIconId",
            "ownerColor",
            "prodActive",
            "prodKind",
            "prodId",
            "prodItemName",
            "prodCategoryLabel",
            "prodPaused",
            "growthPercent",
            "growthStarving",
            "resourceWarning",
            "isCityState",
            "era",
            "isCapital",
        ],
        "CityBadgeDto",
    );
}

/// §3.5 units, stacks, sieges; §3.1 wonders.
#[test]
fn unit_stack_siege_wonder_keys() {
    let v = view();
    expect(
        &v["units"][0],
        &[
            "id",
            "ownerId",
            "typeId",
            "category",
            "hex",
            "ruchMax",
            "ruchLeft",
            "hp",
            "hpMax",
            "embarked",
            "inGarnizon",
            "isGeneral",
            "veteranStars",
            "armorBadgeLevel",
            "softBadgeLevel",
            "dimmed",
        ],
        "UnitViewDto",
    );
    expect(
        &v["stacks"],
        &[
            "visibleIds",
            "badgeByRepId",
            "starvingRepIds",
            "goldDeficitRepIds",
            "vitalsByRepId",
        ],
        "StackViewDto",
    );
    // `Map` entries are `[key, value]` pairs.
    assert_eq!(v["stacks"]["badgeByRepId"], json!([[11, 2]]));
    expect(
        &v["stacks"]["vitalsByRepId"][0][1],
        &[
            "ruchLeft",
            "ruchMax",
            "hp",
            "hpMax",
            "fieldPowerM",
            "count",
            "armorBadgeLevel",
            "softBadgeLevel",
            "veteranLevel",
            "veteranStars",
            "hasCommander",
        ],
        "StackVitalsDto",
    );
    expect(
        &v["sieges"][0],
        &["cityId", "cityHex", "campHexes", "readyMachines"],
        "SiegeViewDto",
    );
    expect(
        &v["wonders"][0],
        &["wonderId", "hex", "ownerId", "ruin"],
        "PlacedWonderDto",
    );
}

/// §3.6 territory, §3.7 overlays.
#[test]
fn territory_and_overlay_keys() {
    let v = view();
    expect(&v["territory"], &["byOwner"], "TerritoryViewDto");
    expect(
        &v["territory"]["byOwner"][0],
        &["ownerId", "hexes"],
        "byOwner[]",
    );
    let o = &v["overlays"];
    expect(
        o,
        &[
            "cultureRange",
            "religionRange",
            "tradeRoutes",
            "okolica",
            "workerFields",
            "reachable",
            "buildHighlight",
            "selection",
            "pathRoute",
        ],
        "OverlaysViewDto",
    );
    expect(
        &o["cultureRange"][0],
        &["ownerId", "hexes"],
        "cultureRange[]",
    );
    expect(
        &o["tradeRoutes"][0],
        &["from", "to", "medium"],
        "tradeRoutes[]",
    );
    expect(
        &o["okolica"],
        &[
            "cityId",
            "cityHex",
            "range",
            "workedHexes",
            "yields",
            "showYields",
            "ownerId",
        ],
        "okolica",
    );
    expect(
        &o["okolica"]["yields"][0][1],
        &["zywnosc", "praca", "handel"],
        "TileYieldDto",
    );
    expect(&o["workerFields"][0], &["hex", "ownerId"], "workerFields[]");
    expect(&o["buildHighlight"], &["kind", "hexes"], "buildHighlight");
    expect(&o["selection"], &["hex", "ownerId"], "selection");
}

/// §3.8 battle start (mirror of the renderer `BattleUnitsOpts`).
#[test]
fn battle_keys() {
    let v = view();
    expect(&v["battle"], &["setup"], "BattleViewDto");
    let s = &v["battle"]["setup"];
    expect(
        s,
        &[
            "grid",
            "desertPalette",
            "siege",
            "deploy",
            "siegeCiv",
            "playerSide",
            "units",
            "fort",
        ],
        "BattleSetupDto",
    );
    expect(&s["grid"], &["cols", "rows", "tiles"], "BattleGridDto");
    expect(
        &s["fort"],
        &["kind", "towerMaterial", "towerRows"],
        "BattleFortDto",
    );
    expect(
        &s["units"][0],
        &[
            "id",
            "side",
            "category",
            "modelName",
            "ownerColor",
            "col",
            "row",
            "facing",
            "onWallWalkway",
            "hp",
            "maxHp",
            "morale",
            "moraleMax",
            "ammoLeft",
            "ammoMax",
        ],
        "BattleUnitSpawnDto",
    );
}

/// P4-1I1 battle outcome: web `BattleResult` (`battle/battleScene.ts:588-604`
/// @ `07d2fbd72`) with `eventLog` flattened to `attackerUnitIds` /
/// `defenderUnitIds`, plus `_sideEndStats` (`:10257-10269`).
#[test]
fn battle_outcome_keys() {
    let v = serde_json::to_value(sample_outcome()).unwrap();
    expect(
        &v,
        &[
            "winner",
            "survivors",
            "log",
            "attackerUnitIds",
            "defenderUnitIds",
            "wallBreached",
            "endStats",
        ],
        "BattleOutcomeDto",
    );
    expect(&v["survivors"][0], &["id", "hp"], "BattleSurvivorDto");
    expect(&v["endStats"], &["atk", "def"], "BattleEndStatsDto");
    for side in ["atk", "def"] {
        expect(
            &v["endStats"][side],
            &["total", "lost", "remaining", "hp", "hpMax"],
            "BattleSideEndStatsDto",
        );
    }
    assert_eq!(v["winner"], "remis");
    let mut none = sample_outcome();
    none.wall_breached = None;
    let n = serde_json::to_value(none).unwrap();
    assert!(n["wallBreached"].is_null(), "None is an explicit null");
}

/// Every object key anywhere in the snapshot is camelCase: starts with a
/// lowercase ASCII letter and has no `_` (string *values* such as
/// `plytkie_morze` are web literals and are not keys).
#[test]
fn every_key_is_camel_case() {
    fn walk(v: &Value, path: &str, seen: &mut usize) {
        match v {
            Value::Object(m) => {
                for (k, child) in m {
                    *seen += 1;
                    assert!(
                        k.starts_with(|c: char| c.is_ascii_lowercase()) && !k.contains('_'),
                        "{path}.{k} is not camelCase"
                    );
                    walk(child, &format!("{path}.{k}"), seen);
                }
            }
            Value::Array(a) => {
                for (i, child) in a.iter().enumerate() {
                    walk(child, &format!("{path}[{i}]"), seen);
                }
            }
            _ => {}
        }
    }
    let mut seen = 0;
    walk(&view(), "$", &mut seen);
    assert!(seen > 200, "walked only {seen} keys");
}

/// `Option::None` is an explicit `null` (the key stays), so the key set does
/// not depend on the data.
#[test]
fn none_is_null_and_key_present() {
    let v = serde_json::to_value(sample_view_minimal()).unwrap();
    assert_eq!(v["battle"], Value::Null);
    assert_eq!(v["overlays"]["okolica"], Value::Null);
    assert_eq!(v["overlays"]["selection"], Value::Null);
    assert_eq!(v["overlays"]["pathRoute"], Value::Null);
    assert_eq!(v["owners"][0]["ringHex"], Value::Null);
    assert_eq!(v["owners"][0]["capitalCityId"], Value::Null);
    assert_eq!(v["hexState"][1]["ulepszenia"], Value::Null);
    assert_eq!(keys(&v), keys(&view()));
}

/// `deny_unknown_fields`: an extra key is an error at every level.
#[test]
fn unknown_keys_are_rejected() {
    let base = view();
    let paths: [&[&str]; 8] = [
        &[],
        &["viewer"],
        &["map"],
        &["overlays"],
        &["territory"],
        &["stacks"],
        &["battle", "setup"],
        &["battle", "setup", "grid"],
    ];
    for path in paths {
        let mut v = base.clone();
        let mut node = &mut v;
        for p in path {
            node = &mut node[*p];
        }
        node.as_object_mut()
            .unwrap()
            .insert("extraKey".into(), json!(1));
        let err = serde_json::from_value::<civ_view_model::RenderViewDto>(v)
            .expect_err("unknown key accepted");
        assert!(err.to_string().contains("extraKey"), "{path:?}: {err}");
    }
    for (idx, arr) in [
        ("hexes", "map"),
        ("hexState", ""),
        ("units", ""),
        ("cities", ""),
    ] {
        let mut v = base.clone();
        let target = if arr.is_empty() {
            &mut v[idx][0]
        } else {
            &mut v[arr][idx][0]
        };
        target
            .as_object_mut()
            .unwrap()
            .insert("snake_case_key".into(), json!(true));
        assert!(
            serde_json::from_value::<civ_view_model::RenderViewDto>(v).is_err(),
            "{idx}"
        );
    }
}

/// A required (non-`Option`) key cannot be omitted; a snake_case spelling of
/// it is not accepted instead.
#[test]
fn missing_or_snake_case_required_key_is_rejected() {
    let mut v = view();
    v["units"][0].as_object_mut().unwrap().remove("ruchLeft");
    assert!(serde_json::from_value::<civ_view_model::RenderViewDto>(v).is_err());

    let mut v = view();
    let unit = v["units"][0].as_object_mut().unwrap();
    let val = unit.remove("ruchLeft").unwrap();
    unit.insert("ruch_left".into(), val);
    assert!(serde_json::from_value::<civ_view_model::RenderViewDto>(v).is_err());
}
