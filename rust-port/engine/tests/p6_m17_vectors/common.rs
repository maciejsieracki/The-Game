//! Wspolne pomocniki testow P6.M17 (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1/gen-m17-vectors.mjs`, pin edb8fb56).
#![allow(dead_code)]

use std::fs;
use std::path::PathBuf;

use civ_engine::domain::map_snapshot::{
    JsKeyedMap, RiverPoint, SnapshotCoords, SnapshotHex, SnapshotMap, SnapshotRiver,
    SnapshotVillage,
};
use serde_json::{json, Map, Value};

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_m17_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

pub fn cases(d: &Value) -> &Vec<Value> {
    d["cases"].as_array().expect("cases")
}

/// Liczba z wektora: liczba JSON albo string "NaN" / "Infinity" / "-Infinity" / "-0".
pub fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznana liczba specjalna {other}"),
        },
        other => panic!("to nie liczba: {other}"),
    }
}

fn s(v: &Value) -> String {
    v.as_str().expect("string").to_string()
}

fn opt_s(v: &Value) -> Option<String> {
    v.as_str().map(str::to_string)
}

pub fn int(v: &Value) -> i32 {
    i32::try_from(v.as_i64().expect("int")).expect("i32")
}

pub fn river_paths(v: &Value) -> Vec<Vec<RiverPoint>> {
    v.as_array()
        .map(|a| {
            a.iter()
                .map(|p| {
                    p.as_array()
                        .expect("path")
                        .iter()
                        .map(|pt| RiverPoint {
                            q: int(&pt["q"]),
                            r: int(&pt["r"]),
                        })
                        .collect()
                })
                .collect()
        })
        .unwrap_or_default()
}

pub fn river_kinds(v: &Value) -> Option<Vec<String>> {
    v.as_array()
        .map(|a| a.iter().map(s).collect::<Vec<String>>())
}

/// Heks z wejscia wektora; `widocznosc` budowana przez `set` w kolejnosci WSTAWIENIA, a kolejnosc `Object.keys`
/// (`jsOrder`) z weba jest asercja modelu `JsKeyedMap`.
pub fn hex_from_json(h: &Value) -> SnapshotHex {
    let mut widocznosc = JsKeyedMap::new();
    for pair in h["widocznosc"]["insertion"].as_array().expect("insertion") {
        widocznosc.set(&s(&pair[0]), &s(&pair[1]));
    }
    let want: Vec<(String, String)> = h["widocznosc"]["jsOrder"]
        .as_array()
        .expect("jsOrder")
        .iter()
        .map(|p| (s(&p[0]), s(&p[1])))
        .collect();
    assert_eq!(
        widocznosc.entries(),
        want.as_slice(),
        "kolejnosc Object.keys widocznosci"
    );
    SnapshotHex {
        coords: SnapshotCoords {
            q: int(&h["coords"]["q"]),
            r: int(&h["coords"]["r"]),
        },
        teren_bazowy: s(&h["terenBazowy"]),
        nakladka: s(&h["nakladka"]),
        ulepszenie: s(&h["ulepszenie"]),
        wlasciciel: opt_s(&h["wlasciciel"]),
        wioska: SnapshotVillage {
            istnieje: h["wioska"]["istnieje"].as_bool().expect("bool"),
            ludnosc: num(&h["wioska"]["ludnosc"]),
        },
        widocznosc,
        rzeka: SnapshotRiver {
            obecna: h["rzeka"]["obecna"].as_bool().expect("bool"),
            krawedzie: h["rzeka"]["krawedzie"]
                .as_array()
                .expect("krawedzie")
                .iter()
                .map(int)
                .collect(),
        },
        zloze: opt_s(&h["zloze"]),
        zloze_min_era: h.get("zlozeMinEra").map(num),
        ulepszenia: h
            .get("ulepszenia")
            .map(|a| a.as_array().expect("ulepszenia").iter().map(s).collect()),
        improvement_key: opt_s(&h["improvementKey"]),
    }
}

pub fn map_from_json(m: &Value) -> SnapshotMap {
    SnapshotMap {
        szerokosc_q: num(&m["szerokoscQ"]),
        wysokosc_r: num(&m["wysokoscR"]),
        seed: num(&m["seed"]),
        hexes: m["hexes"]
            .as_array()
            .expect("hexes")
            .iter()
            .map(|p| (s(&p[0]), hex_from_json(&p[1])))
            .collect(),
        river_paths: river_paths(&m["riverPaths"]),
        river_path_kinds: river_kinds(&m["riverPathKinds"]),
    }
}

fn f(v: f64) -> Value {
    serde_json::Number::from_f64(v).map_or(Value::Null, Value::Number)
}

/// Odpowiednik `describeBuilt` z generatora: mapa -> JSON (pola opcjonalne tylko gdy obecne).
pub fn map_to_value(m: &SnapshotMap) -> Value {
    let hexes: Vec<Value> = m
        .hexes
        .iter()
        .map(|(k, h)| {
            let mut o = Map::new();
            o.insert("coords".into(), json!({"q": h.coords.q, "r": h.coords.r}));
            o.insert("terenBazowy".into(), json!(h.teren_bazowy));
            o.insert("nakladka".into(), json!(h.nakladka));
            o.insert("ulepszenie".into(), json!(h.ulepszenie));
            o.insert("wlasciciel".into(), json!(h.wlasciciel));
            o.insert(
                "wioska".into(),
                json!({"istnieje": h.wioska.istnieje, "ludnosc": f(h.wioska.ludnosc)}),
            );
            o.insert(
                "widocznosc".into(),
                Value::Array(
                    h.widocznosc
                        .entries()
                        .iter()
                        .map(|(p, v)| json!([p, v]))
                        .collect(),
                ),
            );
            o.insert(
                "rzeka".into(),
                json!({"obecna": h.rzeka.obecna, "krawedzie": h.rzeka.krawedzie}),
            );
            if let Some(z) = &h.zloze {
                o.insert("zloze".into(), json!(z));
            }
            if let Some(e) = h.zloze_min_era {
                o.insert("zlozeMinEra".into(), f(e));
            }
            if let Some(u) = &h.ulepszenia {
                o.insert("ulepszenia".into(), json!(u));
            }
            if let Some(k) = &h.improvement_key {
                o.insert("improvementKey".into(), json!(k));
            }
            json!([k, Value::Object(o)])
        })
        .collect();
    let paths: Vec<Value> = m
        .river_paths
        .iter()
        .map(|p| Value::Array(p.iter().map(|pt| json!({"q": pt.q, "r": pt.r})).collect()))
        .collect();
    let mut out = Map::new();
    out.insert("szerokoscQ".into(), f(m.szerokosc_q));
    out.insert("wysokoscR".into(), f(m.wysokosc_r));
    out.insert("seed".into(), f(m.seed));
    out.insert("hexes".into(), Value::Array(hexes));
    out.insert("riverPaths".into(), Value::Array(paths));
    if let Some(k) = &m.river_path_kinds {
        out.insert("riverPathKinds".into(), json!(k));
    }
    Value::Object(out)
}

/// Rownosc strukturalna JSON; liczby porownywane BITOWO jako f64 (calkowite 3 == 3.0).
pub fn json_eq(a: &Value, b: &Value) -> Result<(), String> {
    fn go(a: &Value, b: &Value, path: &str) -> Result<(), String> {
        match (a, b) {
            (Value::Number(x), Value::Number(y)) => {
                let (x, y) = (x.as_f64().unwrap(), y.as_f64().unwrap());
                if x.to_bits() == y.to_bits() || (x == 0.0 && y == 0.0) {
                    Ok(())
                } else {
                    Err(format!("{path}: {x:?} != {y:?}"))
                }
            }
            (Value::Array(x), Value::Array(y)) => {
                if x.len() != y.len() {
                    return Err(format!("{path}: dlugosc {} != {}", x.len(), y.len()));
                }
                for (i, (p, q)) in x.iter().zip(y).enumerate() {
                    go(p, q, &format!("{path}[{i}]"))?;
                }
                Ok(())
            }
            (Value::Object(x), Value::Object(y)) => {
                let kx: Vec<&String> = x.keys().collect();
                let mut sx = kx.clone();
                let mut sy: Vec<&String> = y.keys().collect();
                sx.sort();
                sy.sort();
                if sx != sy {
                    return Err(format!("{path}: klucze {sx:?} != {sy:?}"));
                }
                for k in kx {
                    go(&x[k], &y[k], &format!("{path}.{k}"))?;
                }
                Ok(())
            }
            _ => {
                if a == b {
                    Ok(())
                } else {
                    Err(format!("{path}: {a} != {b}"))
                }
            }
        }
    }
    go(a, b, "$")
}
