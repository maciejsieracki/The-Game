//! P6.8G - wektory z URUCHOMIONEGO weba (pin 91dc998a): `tests/p6_8g_vectors/okolica.json`
//! wygenerowany przez `dyspozycje/autobot/runs/R-RUSTPORT-P6-8G-OKOLICA-Q1/gen-p6-8g-okolica-vectors.mjs`
//! (prawdziwy `gra/src/game/okolica.ts` z `git archive`, bez builda `gra/`).
//!
//! Kodowanie: NaN/Infinity/-Infinity jako napisy; `null` = `undefined` po stronie TS
//! (plony -> 0, wagi -> 1, zgodnie z `?? 0` / `?? 1`). Porownanie liczb: NaN == NaN, bit-w-bit poza tym.

use std::collections::HashMap;

use civ_engine::domain::improvement_build::{hex_keys_within_radius, BuildHex, BuildMap};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::okolica::{
    is_land_workable_hex, okolica_tiles, rebalance_workers_after_population_change,
    resolve_worked_tiles, surrounding_worker_cap, tile_assign_score, tile_score, wagi_for_focus,
    OkolicaCity, OkolicaFocus, OkolicaTryb, OkolicaYield, Reczne, ResolveWorkedTilesOpts, Wagi,
    DEFAULT_OKOLICA_FOCUS,
};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_range_for_population;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8g_vectors/okolica.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("okolica.json parsuje sie jako JSON")
}

/// Liczba z wektora; `null` (undefined po stronie TS) -> `none_as`.
fn num(v: &Value, none_as: f64) -> f64 {
    match v {
        Value::Null => none_as,
        Value::Number(n) => n.as_f64().expect("liczba f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => panic!("nieoczekiwana wartosc {other}"),
    }
}

fn same(got: f64, want: f64) -> bool {
    (got.is_nan() && want.is_nan()) || got == want
}

fn assert_num(ctx: &str, got: f64, want: f64) {
    assert!(same(got, want), "{ctx}: dostalem {got:?}, web {want:?}");
}

fn focus_of(v: &Value) -> Option<OkolicaFocus> {
    match v.as_str()? {
        "zrownowazone" => Some(OkolicaFocus::Zrownowazone),
        "zywnosc" => Some(OkolicaFocus::Zywnosc),
        "produkcja" => Some(OkolicaFocus::Produkcja),
        "podatki" => Some(OkolicaFocus::Podatki),
        other => panic!("nieznany fokus {other}"),
    }
}

fn yields_of(v: &Value) -> OkolicaYield {
    OkolicaYield {
        zywnosc: num(&v["zywnosc"], 0.0),
        praca: num(&v["praca"], 0.0),
        handel: num(&v["handel"], 0.0),
    }
}

fn wagi_of(v: &Value) -> Option<Wagi> {
    if v.is_null() {
        return None;
    }
    Some(Wagi {
        zywnosc: num(&v["zywnosc"], 1.0),
        praca: num(&v["praca"], 1.0),
        handel: num(&v["handel"], 1.0),
    })
}

fn build_map(root: &Value, name: &str) -> BuildMap {
    let hexes = root["maps"][name]
        .as_array()
        .expect("mapa w wektorach")
        .iter()
        .map(|c| {
            let q = c[0].as_i64().expect("q") as i32;
            let r = c[1].as_i64().expect("r") as i32;
            // Web `TerenBazowy` (types/hex.ts) -> `improvements::TerrainType` (ten sam porzadek wariantow).
            let terrain = match c[2].as_str().expect("teren") {
                "laka" => TerrainType::Grassland,
                "rownina" => TerrainType::Plains,
                "wzgorza" => TerrainType::Hills,
                "gory" => TerrainType::Mountains,
                "plytkie_morze" => TerrainType::ShallowWater,
                "morze" => TerrainType::Ocean,
                "pustynia" => TerrainType::Desert,
                "polarny" => TerrainType::Tundra,
                other => panic!("nieznany TerenBazowy {other}"),
            };
            BuildHex {
                q,
                r,
                terrain,
                overlay: Overlay::Brak,
                ulepszenie: None,
                ulepszenia: None,
                zloze: None,
                river_present: false,
            }
        })
        .collect();
    BuildMap::new(hexes, vec![])
}

fn yield_table(root: &Value, which: &str) -> HashMap<String, OkolicaYield> {
    root[which]
        .as_object()
        .expect("tabela plonow")
        .iter()
        .map(|(k, v)| (k.clone(), yields_of(v)))
        .collect()
}

fn yield_fn<'a>(
    table: &'a HashMap<String, OkolicaYield>,
    map_name: &'a str,
) -> impl Fn(i32, i32) -> OkolicaYield + 'a {
    move |q, r| {
        table
            .get(&format!("{map_name}|{q},{r}"))
            .copied()
            .unwrap_or_default()
    }
}

#[test]
fn web_city_range_matches_ts() {
    let root = root();
    for row in root["cityRange"].as_array().unwrap() {
        let pop = num(&row["pop"], 0.0);
        let want = num(&row["out"], 0.0);
        assert_num(
            &format!("cityRange pop={pop:?}"),
            city_range_for_population(pop),
            want,
        );
    }
}

#[test]
fn web_surrounding_worker_cap_matches_ts() {
    let root = root();
    for row in root["surroundingCap"].as_array().unwrap() {
        let pop = num(&row["pop"], 0.0);
        let want = num(&row["out"], 0.0);
        assert_num(
            &format!("surroundingCap pop={pop:?}"),
            surrounding_worker_cap(pop),
            want,
        );
    }
}

#[test]
fn web_tile_score_matches_ts() {
    let root = root();
    let rows = root["score"].as_array().unwrap();
    assert_eq!(rows.len(), 500);
    for row in rows {
        let y = yields_of(&row["y"]);
        let w = wagi_of(&row["wagi"]);
        let want = num(&row["score"], 0.0);
        assert_num(
            &format!("tileScore y={y:?} w={w:?}"),
            tile_score(y, w),
            want,
        );
    }
}

#[test]
fn web_tile_assign_score_matches_ts() {
    let root = root();
    let rows = root["assignScore"].as_array().unwrap();
    assert_eq!(rows.len(), 2000);
    for row in rows {
        let y = yields_of(&row["y"]);
        let w = wagi_of(&row["wagi"]);
        let pot = num(&row["pot"], 0.0);
        let want = num(&row["out"], 0.0);
        assert_num(
            &format!("tileAssignScore y={y:?} w={w:?} pot={pot:?}"),
            tile_assign_score(y, w, pot),
            want,
        );
    }
}

#[test]
fn web_wagi_for_focus_matches_ts() {
    let root = root();
    for row in root["wagiFocus"].as_array().unwrap() {
        let focus = focus_of(&row["focus"]).unwrap_or(DEFAULT_OKOLICA_FOCUS);
        let got = wagi_for_focus(focus);
        let want = wagi_of(&row["out"]).expect("wagi nie-null");
        assert_num("wagi.zywnosc", got.zywnosc, want.zywnosc);
        assert_num("wagi.praca", got.praca, want.praca);
        assert_num("wagi.handel", got.handel, want.handel);
    }
}

#[test]
fn web_hex_keys_within_radius_matches_ts_including_edges() {
    let root = root();
    let mut maps: HashMap<&str, BuildMap> = HashMap::new();
    maps.insert("full", build_map(&root, "full"));
    maps.insert("holes", build_map(&root, "holes"));
    let rows = root["keys"]
        .as_array()
        .unwrap()
        .iter()
        .chain(root["edge"].as_array().unwrap());
    let mut n = 0;
    for row in rows {
        let name = row["map"].as_str().unwrap();
        let cq = row["cq"].as_i64().unwrap_or(2) as i32;
        let cr = row["cr"].as_i64().unwrap_or(-1) as i32;
        let rad = num(&row["rad"], 0.0);
        let got = hex_keys_within_radius(cq, cr, rad, &maps[name]);
        let want: Vec<String> = row["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k.as_str().unwrap().to_owned())
            .collect();
        assert_eq!(
            got, want,
            "hexKeysWithinRadius map={name} c=({cq},{cr}) rad={rad:?}"
        );
        n += 1;
    }
    assert_eq!(n, 84);
}

#[test]
fn web_okolica_tiles_match_ts() {
    let root = root();
    let mut maps: HashMap<&str, BuildMap> = HashMap::new();
    maps.insert("full", build_map(&root, "full"));
    maps.insert("holes", build_map(&root, "holes"));
    for row in root["tiles"].as_array().unwrap() {
        let name = row["map"].as_str().unwrap();
        let map = &maps[name];
        let cq = row["cq"].as_i64().unwrap() as i32;
        let cr = row["cr"].as_i64().unwrap() as i32;
        let rad = num(&row["rad"], 0.0);
        let pred = row["pred"].as_bool().unwrap();
        let land = |q: i32, r: i32| is_land_workable_hex(map, q, r);
        let land_dyn: &dyn Fn(i32, i32) -> bool = &land;
        let got = if pred {
            okolica_tiles(cq, cr, rad, map, Some(land_dyn))
        } else {
            okolica_tiles(cq, cr, rad, map, None)
        };
        let want = row["out"].as_array().unwrap();
        assert_eq!(
            got.len(),
            want.len(),
            "okolicaTiles dlugosc map={name} c=({cq},{cr}) rad={rad:?} pred={pred}"
        );
        for (g, w) in got.iter().zip(want) {
            assert_eq!(g.q, w["q"].as_i64().unwrap() as i32);
            assert_eq!(g.r, w["r"].as_i64().unwrap() as i32);
            assert_eq!(g.key, w["key"].as_str().unwrap());
            assert_num("okolicaTiles dist", g.dist, num(&w["dist"], 0.0));
        }
    }
}

/// Porzadek kluczy: web `localeCompare` (ICU) vs Rust `str::cmp` (bajtowy) na alfabecie `[-0-9,]`.
#[test]
fn web_locale_compare_of_keys_is_bytewise() {
    let root = root();
    let rows = root["locale"].as_array().unwrap();
    assert_eq!(rows.len(), 3136);
    for row in rows {
        let a = row[0].as_str().unwrap();
        let b = row[1].as_str().unwrap();
        let want = row[2].as_i64().unwrap();
        let got = match a.cmp(b) {
            std::cmp::Ordering::Less => -1,
            std::cmp::Ordering::Equal => 0,
            std::cmp::Ordering::Greater => 1,
        };
        assert_eq!(got, want, "localeCompare {a:?} vs {b:?}");
    }
}

#[test]
fn web_resolve_auto_matches_ts_including_nan_yields() {
    let root = root();
    let mut maps: HashMap<&str, BuildMap> = HashMap::new();
    maps.insert("full", build_map(&root, "full"));
    maps.insert("holes", build_map(&root, "holes"));
    let web = yield_table(&root, "yieldTable");
    let nan = yield_table(&root, "yieldNanTable");
    let rows = root["auto"].as_array().unwrap();
    assert_eq!(rows.len(), 320);
    for row in rows {
        let name = row["map"].as_str().unwrap();
        let table = if row["yields"].as_str().unwrap() == "nan" {
            &nan
        } else {
            &web
        };
        let yo = yield_fn(table, name);
        let city = OkolicaCity {
            id: format!("c{}_{}", row["cq"], row["cr"]),
            owner_id: 1,
            q: row["cq"].as_i64().unwrap() as i32,
            r: row["cr"].as_i64().unwrap() as i32,
            population: num(&row["pop"], 0.0),
            focus: focus_of(&row["focus"]),
            tryb: Some(OkolicaTryb::Auto),
            reczne: None,
        };
        let got: Vec<String> =
            resolve_worked_tiles(&city, &maps[name], &yo, &ResolveWorkedTilesOpts::default())
                .into_iter()
                .map(|t| t.key)
                .collect();
        let want: Vec<String> = row["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k.as_str().unwrap().to_owned())
            .collect();
        assert_eq!(got, want, "resolveWorkedTiles auto {row}");
    }
}

#[test]
fn web_rebalance_manual_matches_ts() {
    let root = root();
    let mut maps: HashMap<&str, BuildMap> = HashMap::new();
    maps.insert("full", build_map(&root, "full"));
    maps.insert("holes", build_map(&root, "holes"));
    let web = yield_table(&root, "yieldTable");
    let rows = root["rebalance"].as_array().unwrap();
    assert_eq!(rows.len(), 354);
    for row in rows {
        let name = row["map"].as_str().unwrap();
        let yo = yield_fn(&web, name);
        let init: Option<Reczne> = row["initReczne"].as_array().map(|pairs| {
            let mut r = Reczne::new();
            for p in pairs {
                r.set(p[0].as_str().unwrap(), num(&p[1], 0.0));
            }
            r
        });
        let tryb = if row["init"].as_str().unwrap() == "auto" {
            OkolicaTryb::Auto
        } else {
            OkolicaTryb::Reczny
        };
        let mut city = OkolicaCity {
            id: format!("c{}_{}", row["cq"], row["cr"]),
            owner_id: 1,
            q: row["cq"].as_i64().unwrap() as i32,
            r: row["cr"].as_i64().unwrap() as i32,
            population: num(&row["popAfter"], 0.0),
            focus: focus_of(&row["focus"]),
            tryb: Some(tryb),
            reczne: init,
        };
        rebalance_workers_after_population_change(
            &mut city,
            &maps[name],
            &yo,
            num(&row["popBefore"], 0.0),
            num(&row["popAfter"], 0.0),
            None,
            None,
        );
        let got: Option<Vec<(String, f64)>> = city
            .reczne
            .as_ref()
            .map(|r| r.iter().map(|(k, v)| (k.to_owned(), v)).collect());
        let want: Option<Vec<(String, f64)>> = row["out"].as_array().map(|pairs| {
            pairs
                .iter()
                .map(|p| (p[0].as_str().unwrap().to_owned(), num(&p[1], 0.0)))
                .collect()
        });
        match (&got, &want) {
            (None, None) => {}
            (Some(g), Some(w)) => {
                assert_eq!(g.len(), w.len(), "rebalans dlugosc {row}");
                for ((gk, gv), (wk, wv)) in g.iter().zip(w) {
                    assert_eq!(gk, wk, "rebalans klucz (kolejnosc) {row}");
                    assert_num("rebalans wartosc", *gv, *wv);
                }
            }
            _ => panic!("rebalans: got {got:?}, web {want:?} dla {row}"),
        }
    }
}
