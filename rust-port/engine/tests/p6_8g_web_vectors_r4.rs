//! P6.8G runda 4 - wektory z URUCHOMIONEGO weba (pin 91dc998a), sekcje 7-11 generatora
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8G-OKOLICA-Q1/gen-p6-8g-okolica-vectors.mjs`:
//! `adjustTileWorker` / `toggleTileWorker` (tryb reczny i auto-seed, terytorium, excludeHexKeys),
//! `computeLostToNearerSiblingByCity`, `collectWorkedHexKeysForOwner`, `collectWorkedHexOwnerMap`,
//! `resolveWorkedTiles` (tryb reczny w kolejnosci wstawiania, auto z terytorium),
//! sortowanie z NaN dla n >= 64 kandydatow (mapa `big`).
//!
//! Te same konwencje kodowania co `p6_8g_web_vectors.rs`: NaN/Infinity jako napisy, `null` = undefined.

use std::collections::{BTreeSet, HashMap};

use civ_engine::domain::improvement_build::{BuildHex, BuildMap};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::okolica::{
    adjust_tile_worker, collect_worked_hex_keys_for_owner, collect_worked_hex_owner_map,
    compute_lost_to_nearer_sibling_by_city, resolve_worked_tiles, toggle_tile_worker, OkolicaCity,
    OkolicaFocus, OkolicaTryb, OkolicaYield, Reczne, ResolveWorkedTilesOpts,
};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::CityNode;
use civ_engine::domain::territory::TerritoryNode;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8g_vectors/okolica.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("okolica.json parsuje sie jako JSON")
}

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => panic!("nieoczekiwana wartosc liczbowa {other}"),
    }
}

fn str_of(v: &Value) -> &str {
    v.as_str().expect("napis")
}

fn focus_of(v: &Value) -> OkolicaFocus {
    match str_of(v) {
        "zrownowazone" => OkolicaFocus::Zrownowazone,
        "zywnosc" => OkolicaFocus::Zywnosc,
        "produkcja" => OkolicaFocus::Produkcja,
        "podatki" => OkolicaFocus::Podatki,
        other => panic!("nieznany fokus {other}"),
    }
}

fn tryb_of(v: &Value) -> OkolicaTryb {
    match str_of(v) {
        "reczny" => OkolicaTryb::Reczny,
        "auto" => OkolicaTryb::Auto,
        other => panic!("nieznany tryb {other}"),
    }
}

/// Tablica par `[klucz, wartosc]` (kolejnosc wstawiania JS) -> `Reczne`; `null` -> `None`.
fn reczne_of_pairs(v: &Value) -> Option<Reczne> {
    if v.is_null() {
        return None;
    }
    let mut r = Reczne::new();
    for pair in v.as_array().expect("pary reczne") {
        r.set(str_of(&pair[0]), num(&pair[1]));
    }
    Some(r)
}

/// Obiekt JSON `{klucz: wartosc}` (z `citySets`) -> `Reczne`; brak pola -> `None`.
fn reczne_of_object(v: Option<&Value>) -> Option<Reczne> {
    let obj = v?.as_object()?;
    let mut r = Reczne::new();
    for (k, val) in obj {
        r.set(k, num(val));
    }
    Some(r)
}

fn assert_pairs(ctx: &str, got: &Reczne, want: &Value) {
    let want = want.as_array().expect("pary wyniku");
    let got: Vec<(String, f64)> = got.iter().map(|(k, v)| (k.to_owned(), v)).collect();
    assert_eq!(got.len(), want.len(), "{ctx}: liczba wpisow (got {got:?})");
    for (i, (k, v)) in got.iter().enumerate() {
        assert_eq!(k, str_of(&want[i][0]), "{ctx}: klucz #{i}");
        let w = num(&want[i][1]);
        assert!(
            (v.is_nan() && w.is_nan()) || v == &w,
            "{ctx}: wartosc #{i} dla {k}: {v:?} vs web {w:?}"
        );
    }
}

fn build_map(root: &Value, name: &str) -> BuildMap {
    let hexes = root["maps"][name]
        .as_array()
        .expect("mapa w wektorach")
        .iter()
        .map(|c| {
            let q = c[0].as_i64().expect("q") as i32;
            let r = c[1].as_i64().expect("r") as i32;
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

fn all_maps(root: &Value) -> HashMap<String, BuildMap> {
    ["full", "holes", "big"]
        .iter()
        .map(|n| ((*n).to_owned(), build_map(root, n)))
        .collect()
}

fn yield_table(root: &Value, which: &str) -> HashMap<String, OkolicaYield> {
    root[which]
        .as_object()
        .expect("tabela plonow")
        .iter()
        .map(|(k, v)| {
            (
                k.clone(),
                OkolicaYield {
                    zywnosc: num(&v["zywnosc"]),
                    praca: num(&v["praca"]),
                    handel: num(&v["handel"]),
                },
            )
        })
        .collect()
}

/// Plony z tabeli `yieldTable` / `yieldNanTable` dla nazwy mapy (jak `yieldOfMapHex` po stronie TS).
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

/// Web `TerritoryNode` (`CityNode & {ownerId}`) z wektora; nazwa `none` = `undefined`.
fn territory_of(root: &Value, name: &str) -> Option<Vec<TerritoryNode>> {
    if name == "none" {
        return None;
    }
    let nodes = root["terrNodes"][name]
        .as_array()
        .expect("wezly terytorium");
    Some(
        nodes
            .iter()
            .map(|n| {
                TerritoryNode::new(
                    CityNode {
                        q: n["q"].as_i64().expect("q") as i32,
                        r: n["r"].as_i64().expect("r") as i32,
                        is_outpost: n.get("isOutpost").map(|_| true),
                        is_fort: None,
                        pop: num(&n["pop"]),
                        level: num(&n["level"]),
                        civ: None,
                    },
                    n["ownerId"].as_i64().expect("ownerId"),
                )
            })
            .collect(),
    )
}

fn exclude_of(root: &Value, name: &str) -> Option<BTreeSet<String>> {
    if name == "none" {
        return None;
    }
    Some(
        root["exclSets"][name]
            .as_array()
            .expect("zbior wykluczen")
            .iter()
            .map(|k| str_of(k).to_owned())
            .collect(),
    )
}

#[allow(clippy::too_many_arguments)] // sygnatura pomocnicza testu: pola webowego City
fn city_of(
    id: &str,
    owner_id: i64,
    q: i32,
    r: i32,
    population: f64,
    tryb: &Value,
    focus: &Value,
    reczne: Option<Reczne>,
) -> OkolicaCity {
    OkolicaCity {
        id: id.to_owned(),
        owner_id,
        q,
        r,
        population,
        focus: Some(focus_of(focus)),
        tryb: Some(tryb_of(tryb)),
        reczne,
    }
}

#[test]
fn web_adjust_and_toggle_worker_match_ts() {
    let root = root();
    let maps = all_maps(&root);
    let table = yield_table(&root, "yieldTable");
    let rows = root["adjust"].as_array().expect("adjust");
    assert_eq!(rows.len(), 9504, "liczba wektorow adjust/toggle");
    for row in rows {
        let map_name = str_of(&row["map"]);
        let map = &maps[map_name];
        let yf = yield_fn(&table, map_name);
        let cq = row["cq"].as_i64().unwrap() as i32;
        let cr = row["cr"].as_i64().unwrap() as i32;
        let pop = num(&row["pop"]);
        let reczne = reczne_of_pairs(&row["init"]);
        let city = city_of(
            "c",
            1,
            cq,
            cr,
            pop,
            &row["tryb"],
            &serde_json::json!("zywnosc"),
            reczne,
        );
        let target = str_of(&row["target"]);
        let (tq, tr) = {
            let mut it = target.split(',').map(|s| s.parse::<i32>().unwrap());
            (it.next().unwrap(), it.next().unwrap())
        };
        let terr_name = str_of(&row["terr"]);
        let terr = territory_of(&root, terr_name);
        let excl = exclude_of(&root, str_of(&row["excl"]));
        let ctx = format!(
            "{} cq={cq} cr={cr} pop={pop} tryb={} init={} target={target} terr={terr_name} excl={} op={} delta={}",
            map_name,
            str_of(&row["tryb"]),
            row["init"],
            row["excl"],
            str_of(&row["op"]),
            row["delta"]
        );
        let res = if str_of(&row["op"]) == "adjust" {
            let delta = row["delta"].as_i64().unwrap() as i8;
            adjust_tile_worker(
                &city,
                map,
                &yf,
                tq,
                tr,
                delta,
                None,
                terr.as_deref(),
                excl.as_ref(),
            )
        } else {
            toggle_tile_worker(
                &city,
                map,
                &yf,
                tq,
                tr,
                None,
                terr.as_deref(),
                excl.as_ref(),
            )
        };
        assert_eq!(res.ok, row["ok"].as_bool().unwrap(), "{ctx}: ok");
        let want_reason = row["reason"].as_str();
        assert_eq!(res.reason, want_reason, "{ctx}: reason");
        assert_pairs(&ctx, &res.reczne, &row["out"]);
    }
}

#[test]
fn web_lost_to_sibling_and_collect_match_ts() {
    let root = root();
    let maps = all_maps(&root);
    let table = yield_table(&root, "yieldTable");

    let city_set = |name: &str| -> Vec<OkolicaCity> {
        root["citySets"][name]
            .as_array()
            .expect("zbior miast")
            .iter()
            .map(|c| {
                city_of(
                    str_of(&c["id"]),
                    c["ownerId"].as_i64().unwrap(),
                    c["q"].as_i64().unwrap() as i32,
                    c["r"].as_i64().unwrap() as i32,
                    num(&c["population"]),
                    &c["okolicaTryb"],
                    &c["okolicaFocus"],
                    reczne_of_object(c.get("okolicaReczne")),
                )
            })
            .collect()
    };

    for row in root["lost"].as_array().expect("lost") {
        let map_name = str_of(&row["map"]);
        let cities = city_set(str_of(&row["set"]));
        let got = compute_lost_to_nearer_sibling_by_city(&cities, &maps[map_name]);
        let got: Vec<(String, Vec<String>)> = got
            .iter()
            .map(|(cid, s)| (cid.clone(), s.iter().cloned().collect()))
            .collect();
        let want: Vec<(String, Vec<String>)> = row["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| {
                (
                    str_of(&p[0]).to_owned(),
                    p[1].as_array()
                        .unwrap()
                        .iter()
                        .map(|k| str_of(k).to_owned())
                        .collect(),
                )
            })
            .collect();
        assert_eq!(got, want, "lost set={} map={map_name}", row["set"]);
    }

    for row in root["collect"].as_array().expect("collect") {
        let map_name = str_of(&row["map"]);
        let yf = yield_fn(&table, map_name);
        let cities = city_set(str_of(&row["set"]));
        let terr = territory_of(&root, str_of(&row["terr"]));
        let ctx = format!(
            "set={} map={map_name} terr={} kind={}",
            row["set"], row["terr"], row["kind"]
        );
        if str_of(&row["kind"]) == "keys" {
            let owner = row["owner"].as_i64().unwrap();
            let got: Vec<String> = collect_worked_hex_keys_for_owner(
                &cities,
                &maps[map_name],
                owner,
                &yf,
                None,
                terr.as_deref(),
            )
            .into_iter()
            .collect();
            let want: Vec<String> = row["out"]
                .as_array()
                .unwrap()
                .iter()
                .map(|k| str_of(k).to_owned())
                .collect();
            assert_eq!(got, want, "{ctx} owner={owner}");
        } else {
            let got: Vec<(String, i64)> =
                collect_worked_hex_owner_map(&cities, &maps[map_name], &yf, None, terr.as_deref())
                    .into_iter()
                    .collect();
            let want: Vec<(String, i64)> = row["out"]
                .as_array()
                .unwrap()
                .iter()
                .map(|p| (str_of(&p[0]).to_owned(), p[1].as_i64().unwrap()))
                .collect();
            assert_eq!(got, want, "{ctx}");
        }
    }
}

#[test]
fn web_resolve_manual_and_auto_with_territory_match_ts() {
    let root = root();
    let maps = all_maps(&root);
    let table = yield_table(&root, "yieldTable");
    let rows = root["resolve"].as_array().expect("resolve");
    assert_eq!(rows.len(), 256);
    for row in rows {
        let map_name = str_of(&row["map"]);
        let yf = yield_fn(&table, map_name);
        let cq = row["cq"].as_i64().unwrap() as i32;
        let cr = row["cr"].as_i64().unwrap() as i32;
        let pop = num(&row["pop"]);
        let city = city_of(
            "c",
            1,
            cq,
            cr,
            pop,
            &row["tryb"],
            &serde_json::json!("zywnosc"),
            reczne_of_pairs(&row["init"]),
        );
        let terr = territory_of(&root, str_of(&row["terr"]));
        let excl = exclude_of(&root, str_of(&row["excl"]));
        let opts = ResolveWorkedTilesOpts {
            territory_nodes: terr.as_deref(),
            owner_id: Some(1),
            exclude_hex_keys: excl.as_ref(),
            ..ResolveWorkedTilesOpts::default()
        };
        let got: Vec<String> = resolve_worked_tiles(&city, &maps[map_name], &yf, &opts)
            .into_iter()
            .map(|t| t.key)
            .collect();
        let want: Vec<String> = row["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| str_of(k).to_owned())
            .collect();
        assert_eq!(
            got, want,
            "resolve map={map_name} cq={cq} cr={cr} pop={pop} variant={} terr={} excl={}",
            row["variant"], row["terr"], row["excl"]
        );
    }
}

#[test]
fn web_auto_sort_with_nan_yields_n_ge_64_matches_ts() {
    let root = root();
    let maps = all_maps(&root);
    let nan_table = yield_table(&root, "yieldNanTable");
    let yf = yield_fn(&nan_table, "big");
    let rows = root["nanBig"].as_array().expect("nanBig");
    assert_eq!(rows.len(), 24);
    for row in rows {
        // Warunek testu: komparator dostaje co najmniej 64 kandydatow (sciezka merge/TimSort, nie n < 64).
        let candidates = row["candidates"].as_u64().unwrap();
        assert!(candidates >= 64, "n={candidates} < 64");
        let cq = row["cq"].as_i64().unwrap() as i32;
        let cr = row["cr"].as_i64().unwrap() as i32;
        let pop = num(&row["pop"]);
        let focus = focus_of(&row["focus"]);
        let city = OkolicaCity {
            id: "c".to_owned(),
            owner_id: 1,
            q: cq,
            r: cr,
            population: pop,
            focus: Some(focus),
            tryb: Some(OkolicaTryb::Auto),
            reczne: None,
        };
        let got: Vec<String> =
            resolve_worked_tiles(&city, &maps["big"], &yf, &ResolveWorkedTilesOpts::default())
                .into_iter()
                .map(|t| t.key)
                .collect();
        let want: Vec<String> = row["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| str_of(k).to_owned())
            .collect();
        assert_eq!(
            got, want,
            "nanBig cq={cq} cr={cr} pop={pop} focus={}",
            row["focus"]
        );
    }
}
