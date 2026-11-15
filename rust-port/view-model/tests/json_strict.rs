//! Generic sweeps over every JSON object of the snapshot (criterion 2), added
//! after the mutation run of the measurement call
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/01b-operator-pomiary.md`):
//! the per-type tests checked these properties only at a few chosen places,
//! and `v["key"] == Value::Null` holds for an *absent* key as well.
//!
//! 1. `Option::None` is written as an explicit `null`: every object at the
//!    same JSON path has the same key set, whatever its data.
//! 2. Every object (all levels, inside arrays too, full snapshot and dynamic
//!    layers) rejects an unknown key.
//! 3. Every non-`Option` key is required; an omitted `Option` key reads as
//!    `null` (serde's default for `Option` — input leniency only, the producer
//!    always writes the key).

mod common;

use civ_view_model::*;
use common::*;
use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

/// Every `Option` field of contract §3, as (normalized JSON path of the
/// object, key). Array indices are normalized to `[*]`, except inside a
/// tuple (an array directly in an array, e.g. `yields: [[hex, yield]]`), where
/// the position is kept. The `$.…` paths hold for the dynamic layers too
/// (`L$.…`, except `map`).
const NULLABLE: [(&str, &str); 29] = [
    ("$", "battle"),
    ("$.map.rivers[*]", "kind"),
    ("$.hexState[*]", "ulepszenia"),
    ("$.hexState[*]", "improvementKey"),
    ("$.hexState[*]", "zloze"),
    ("$.owners[*]", "ringHex"),
    ("$.owners[*]", "displayName"),
    ("$.owners[*]", "mapOutlineKind"),
    ("$.owners[*]", "capitalCityId"),
    ("$.cities[*].badge", "prodKind"),
    ("$.cities[*].badge", "prodId"),
    ("$.cities[*].badge", "prodItemName"),
    ("$.cities[*].badge", "prodCategoryLabel"),
    ("$.cities[*].badge", "growthPercent"),
    ("$.units[*]", "hpMax"),
    ("$.overlays", "cultureRange"),
    ("$.overlays", "religionRange"),
    ("$.overlays", "okolica"),
    ("$.overlays", "selection"),
    ("$.overlays", "pathRoute"),
    ("$.overlays.okolica", "showYields"),
    ("$.overlays.okolica.yields[*][1]", "zywnosc"),
    ("$.overlays.okolica.yields[*][1]", "praca"),
    ("$.overlays.okolica.yields[*][1]", "handel"),
    ("$.battle.setup", "deploy"),
    ("$.battle.setup.fort", "towerMaterial"),
    ("$.battle.setup.units[*]", "ammoLeft"),
    ("$.battle.setup.units[*]", "ammoMax"),
    // Root of the dynamic layers (`RenderLayersDto`), same field.
    ("L$", "battle"),
];

#[derive(Clone, Debug)]
enum Seg {
    Key(String),
    Idx(usize),
}

/// Concrete path → normalized path, with a root label: `[*]` for an index,
/// `[i]` for a position inside a tuple (an index right after an index).
fn normalize(root: &str, path: &[Seg]) -> String {
    let mut s = root.to_owned();
    let mut after_index = false;
    for seg in path {
        match seg {
            Seg::Key(k) => {
                s.push('.');
                s.push_str(k);
                after_index = false;
            }
            Seg::Idx(i) => {
                if after_index {
                    s.push_str(&format!("[{i}]"));
                } else {
                    s.push_str("[*]");
                }
                after_index = true;
            }
        }
    }
    s
}

/// Concrete paths of every object in `v`.
fn object_paths(v: &Value) -> Vec<Vec<Seg>> {
    fn walk(v: &Value, path: &mut Vec<Seg>, out: &mut Vec<Vec<Seg>>) {
        match v {
            Value::Object(m) => {
                out.push(path.clone());
                for (k, child) in m {
                    path.push(Seg::Key(k.clone()));
                    walk(child, path, out);
                    path.pop();
                }
            }
            Value::Array(a) => {
                for (i, child) in a.iter().enumerate() {
                    path.push(Seg::Idx(i));
                    walk(child, path, out);
                    path.pop();
                }
            }
            _ => {}
        }
    }
    let mut out = Vec::new();
    walk(v, &mut Vec::new(), &mut out);
    out
}

fn at_mut<'a>(v: &'a mut Value, path: &[Seg]) -> &'a mut Value {
    path.iter().fold(v, |node, seg| match seg {
        Seg::Key(k) => &mut node[k.as_str()],
        Seg::Idx(i) => &mut node[*i],
    })
}

fn at<'a>(v: &'a Value, path: &[Seg]) -> &'a Value {
    path.iter().fold(v, |node, seg| match seg {
        Seg::Key(k) => &node[k.as_str()],
        Seg::Idx(i) => &node[*i],
    })
}

/// `sample_view` with the `Option` fields that it and `sample_view_minimal`
/// always fill set to `None` (badge production and growth, `showYields`,
/// `deploy`, `towerMaterial`).
fn sample_view_other_nones() -> RenderViewDto {
    let mut v = sample_view();
    v.cities = vec![CityViewDto {
        badge: sample_badge_none(),
        ..sample_city()
    }];
    v.overlays.okolica.as_mut().unwrap().show_yields = None;
    let setup = &mut v.battle.as_mut().unwrap().setup;
    setup.deploy = None;
    setup.fort.tower_material = None;
    v
}

/// (root label, JSON) of every sample, full snapshots and their layers.
fn samples() -> Vec<(&'static str, Value)> {
    let mut out = Vec::new();
    for view in [
        sample_view(),
        sample_view_minimal(),
        sample_view_other_nones(),
        synthetic_view(&SCENARIOS[1]),
    ] {
        view.validate().unwrap();
        out.push(("$", serde_json::to_value(&view).unwrap()));
        let (_, layers) = view.split();
        out.push(("L$", serde_json::to_value(&layers).unwrap()));
    }
    out
}

fn nullable() -> BTreeSet<(String, String)> {
    NULLABLE
        .iter()
        .flat_map(|&(p, k)| {
            // A `$.…` entry below the root holds for the layers too.
            let layers = (p.starts_with("$.") && !p.starts_with("$.map"))
                .then(|| (format!("L{p}"), k.to_owned()));
            std::iter::once((p.to_owned(), k.to_owned())).chain(layers)
        })
        .collect()
}

/// 1. Key set per normalized path is independent of the data, and every
///    `Option` field is seen both as `null` and as a value (so the check is
///    not vacuous).
#[test]
fn none_is_explicit_null_everywhere() {
    let mut key_sets: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    let mut seen_null: BTreeSet<(String, String)> = BTreeSet::new();
    let mut seen_value: BTreeSet<(String, String)> = BTreeSet::new();
    let mut objects = 0;
    for (root, v) in samples() {
        for path in object_paths(&v) {
            let norm = normalize(root, &path);
            let obj = at(&v, &path).as_object().unwrap();
            let keys: BTreeSet<String> = obj.keys().cloned().collect();
            objects += 1;
            match key_sets.get(&norm) {
                Some(first) => assert_eq!(first, &keys, "key set of {norm} depends on the data"),
                None => {
                    key_sets.insert(norm.clone(), keys);
                }
            }
            for (k, child) in obj {
                let entry = (norm.clone(), k.clone());
                if child.is_null() {
                    seen_null.insert(entry);
                } else {
                    seen_value.insert(entry);
                }
            }
        }
    }
    assert!(objects > 10_000, "walked only {objects} objects");
    let nullable = nullable();
    assert_eq!(seen_null, nullable, "keys seen as null != Option fields");
    for entry in &nullable {
        assert!(seen_value.contains(entry), "{entry:?} never has a value");
    }
}

fn check_unknown_key<T: DeserializeOwned>(root: &str, v: &Value) -> usize {
    let paths = object_paths(v);
    for path in &paths {
        let mut m = v.clone();
        at_mut(&mut m, path)
            .as_object_mut()
            .unwrap()
            .insert("extraKey".into(), json!(1));
        let err = serde_json::from_value::<T>(m)
            .err()
            .unwrap_or_else(|| panic!("unknown key accepted at {}", normalize(root, path)));
        assert!(err.to_string().contains("extraKey"), "{err}");
    }
    paths.len()
}

/// 2. `deny_unknown_fields` at every object, full snapshot and layers.
#[test]
fn every_object_rejects_an_unknown_key() {
    let view = sample_view();
    let full = serde_json::to_value(&view).unwrap();
    let n = check_unknown_key::<RenderViewDto>("$", &full);
    let (map, layers) = view.split();
    let lv = serde_json::to_value(&layers).unwrap();
    let m = check_unknown_key::<RenderLayersDto>("L$", &lv);
    assert!(n > 40 && m > 30, "only {n} / {m} objects");
    // The layers do not accept the static map back.
    let mut with_map = lv;
    with_map
        .as_object_mut()
        .unwrap()
        .insert("map".into(), serde_json::to_value(&map).unwrap());
    assert!(serde_json::from_value::<RenderLayersDto>(with_map).is_err());
}

fn check_required<T: DeserializeOwned + PartialEq + std::fmt::Debug>(
    root: &str,
    v: &Value,
    nullable: &BTreeSet<(String, String)>,
) -> (usize, usize) {
    let (mut required, mut optional) = (0, 0);
    for path in object_paths(v) {
        let norm = normalize(root, &path);
        let keys: Vec<String> = at(v, &path).as_object().unwrap().keys().cloned().collect();
        for k in keys {
            let mut m = v.clone();
            at_mut(&mut m, &path).as_object_mut().unwrap().remove(&k);
            let res = serde_json::from_value::<T>(m);
            if nullable.contains(&(norm.clone(), k.clone())) {
                let mut null = v.clone();
                at_mut(&mut null, &path)[k.as_str()] = Value::Null;
                let want = serde_json::from_value::<T>(null).unwrap();
                assert_eq!(
                    res.unwrap_or_else(|e| panic!("{norm}.{k}: {e}")),
                    want,
                    "{norm}.{k}"
                );
                optional += 1;
            } else {
                assert!(res.is_err(), "required key {norm}.{k} may be omitted");
                required += 1;
            }
        }
    }
    (required, optional)
}

/// 3. Omitting a non-`Option` key is an error at every object.
#[test]
fn every_required_key_is_required() {
    let nullable = nullable();
    let view = sample_view();
    let (r, o) =
        check_required::<RenderViewDto>("$", &serde_json::to_value(&view).unwrap(), &nullable);
    assert!(r > 200 && o > 15, "{r} required / {o} optional");
    let (_, layers) = view.split();
    let (r, o) =
        check_required::<RenderLayersDto>("L$", &serde_json::to_value(&layers).unwrap(), &nullable);
    assert!(r > 150 && o > 15, "{r} required / {o} optional");
}
