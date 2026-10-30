//! Wektory z pinu `gra/` 91dc998a (esbuild bundle modulu `economy.ts`, uruchomiony w node) wobec portow
//! R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1 runda 3: `loadEconParams` (#1), `terrainRowToTileYield` (#2),
//! `buildTerrainYields` (#3), `terrainModifier` (#4), `tileYield` (#5), `buildingValue` (#6),
//! `resolvePopulationCapMatrixDelta` (#19).
//!
//! Plik wektorow: `tests/fixtures/economy_city_vectors_r3_91dc998a.json` (2008 wektorow).
//! Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1/07-gen-economy-city-vectors-r3.mjs`.
//! Liczby w JSON: stringi (`"NaN"`, `"Infinity"`, `"-Infinity"`, `"-0"`, albo `String(x)`).

use std::collections::HashMap;

use civ_engine::data::terrain_map::{parse_terrain_yields, TERRAIN_YIELDS_JSON};
use civ_engine::domain::city_growth::p6_7a::resolve_population_cap_matrix_delta;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::economy_city_params::{load_econ_params, EconParams};
use civ_engine::domain::economy_city_terrain::{
    build_terrain_yields, terrain_modifier, terrain_row_to_tile_yield,
};
use civ_engine::domain::economy_yield::{
    building_value, civ_economy_yield_multipliers, civ_matrix_mnoznik_handel_pieniadz_raw,
    mnoznik_handel_pieniadz_for_civ, mnoznik_handel_pieniadz_for_civ_by_difficulty,
    tile_yield_full, WorkedTileImpInput,
};
use civ_engine::domain::improvements::TileYield;
use civ_engine::domain::types::Difficulty;
use serde_json::{Map, Number, Value};

const FIXTURE: &str = include_str!("fixtures/economy_city_vectors_r3_91dc998a.json");

fn parse_num(v: &Value) -> f64 {
    let s = v.as_str().expect("liczba musi byc stringiem");
    match s {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => other.parse::<f64>().expect("poprawna liczba"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_num(got: f64, want: &Value, ctx: &str) {
    let want = parse_num(want);
    assert!(same(got, want), "{ctx}: got {got:?} want {want:?}");
}

fn kind(v: &Value) -> &str {
    v["kind"].as_str().expect("kind")
}

fn vectors_of(name: &str) -> Vec<&'static Value> {
    static ALL: std::sync::OnceLock<Value> = std::sync::OnceLock::new();
    let all = ALL.get_or_init(|| serde_json::from_str(FIXTURE).expect("fixture json"));
    all["vectors"]
        .as_array()
        .expect("vectors")
        .iter()
        .filter(|v| v["fn"] == name)
        .collect()
}

/// Pole tagowane z generatora (`{"kind": "num"|"str"|"bool"|"null"}`); pole nieobecne jest pomijane.
fn tagged_to_value(t: &Value) -> Value {
    match kind(t) {
        "null" => Value::Null,
        "num" => Value::Number(Number::from_f64(parse_num(&t["v"])).expect("skonczona liczba")),
        "str" => Value::String(t["v"].as_str().expect("str").to_owned()),
        "bool" => Value::Bool(t["v"].as_bool().expect("bool")),
        other => panic!("nieznany kind {other}"),
    }
}

/// Lista `{k, v}` (v = liczba jako string albo `"absent"`) -> mapa bez brakujacych kluczy.
fn baza_map(list: &Value) -> HashMap<String, f64> {
    let mut m = HashMap::new();
    for e in list.as_array().expect("lista") {
        let v = e["v"].as_str().expect("v");
        if v != "absent" {
            m.insert(e["k"].as_str().expect("k").to_owned(), parse_num(&e["v"]));
        }
    }
    m
}

fn assert_yield(got: &TileYield, out: &Value, ctx: &str) {
    assert_num(got.zywnosc, &out["zywnosc"], &format!("{ctx} zywnosc"));
    assert_num(got.praca, &out["praca"], &format!("{ctx} praca"));
    assert_num(got.handel, &out["handel"], &format!("{ctx} handel"));
    assert_num(got.drewno, &out["drewno"], &format!("{ctx} drewno"));
    assert_num(got.kamien, &out["kamien"], &format!("{ctx} kamien"));
    assert_num(got.glina, &out["glina"], &format!("{ctx} glina"));
    assert_num(got.ruda, &out["ruda"], &format!("{ctx} ruda"));
    assert_num(
        got.ruda_zelaza,
        &out["ruda_zelaza"],
        &format!("{ctx} ruda_zelaza"),
    );
}

/// Pola `EconParams` pod nazwami web (`economy.ts` L104-168), w kolejnosci deklaracji.
fn econ_pairs(p: &EconParams) -> Vec<(&'static str, f64)> {
    vec![
        ("progWzrostuWspolczynnik", p.prog_wzrostu_wspolczynnik),
        (
            "spichlerzZachowaniePoPrzroscie",
            p.spichlerz_zachowanie_po_wzroscie,
        ),
        ("akweduktProgLudnosci", p.akwedukt_prog_ludnosci),
        ("spichlerzProgLudnosci", p.spichlerz_prog_ludnosci),
        ("akweduktMaxLudnosci", p.akwedukt_max_ludnosci),
        ("zywnoscZuzytkaPopulacja", p.zywnosc_zuzytka_populacja),
        (
            "zdrowieModyfikatorWspolczynnik",
            p.zdrowie_modyfikator_wspolczynnik,
        ),
        (
            "korupcjaWspolczynnikDystansu",
            p.korupcja_wspolczynnik_dystansu,
        ),
        ("korupcjaWspolczynnikMiast", p.korupcja_wspolczynnik_miast),
        ("korupcjaCap", p.korupcja_cap),
        ("budynekMlynMnoznikPracy", p.budynek_mlyn_mnoznik_pracy),
        ("budynekMlynBonusPracy", p.budynek_mlyn_bonus_pracy),
        ("budynekCegielniBonusPracy", p.budynek_cegielnia_bonus_pracy),
        (
            "budynekTargowiskoBonusHandlu",
            p.budynek_targowisko_bonus_handlu,
        ),
        (
            "budynekBibliotekaBonusNauki",
            p.budynek_biblioteka_bonus_nauki,
        ),
        ("budynekAkademiaBonusNauki", p.budynek_akademia_bonus_nauki),
        (
            "budynekGarncarniaBonusZywnosci",
            p.budynek_garncarnia_bonus_zywnosci,
        ),
        ("budynekMennicaMnoznik", p.budynek_mennica_mnoznik),
        ("mennicaMnoznikPoWalucie", p.mennica_mnoznik_po_walucie),
        ("walutaMnoznik", p.waluta_mnoznik),
        ("suwaakHandelNaukaDefault", p.suwak_handel_nauka_default),
        ("suwaakHandelPieniadz", p.suwak_handel_pieniadz),
        ("suwaakHandelLuksus", p.suwak_handel_luksus),
        ("suwaakPracaBudynki", p.suwak_praca_budynki),
        ("suwaakPracaTeren", p.suwak_praca_teren),
    ]
}

#[test]
fn vector_counts_are_pinned() {
    let counts = [
        ("loadEconParams", 400),
        ("terrainRowToTileYield", 400),
        ("buildTerrainYields", 1),
        ("terrainModifier", 7),
        ("tileYield", 500),
        ("buildingValue", 500),
        ("resolvePopulationCapMatrixDelta", 200),
        ("civMatrixMnoznikHandelPieniadzRaw", 200),
        ("mnoznikHandelPieniadzForCiv", 200),
        ("mnoznikHandelPieniadzForCivByDifficulty", 200),
        ("civEconomyYieldMultipliers", 100),
    ];
    for (name, n) in counts {
        assert_eq!(vectors_of(name).len(), n, "liczba wektorow {name}");
    }
}

/// #1 `loadEconParams` (L198-244).
#[test]
fn load_econ_params_matches_pin() {
    let vs = vectors_of("loadEconParams");
    for (i, v) in vs.iter().enumerate() {
        let diff = v["in"]["difficulty"].as_str().expect("difficulty");
        let p = load_econ_params(&v["in"]["raw"], diff);
        let pairs = econ_pairs(&p);
        assert_eq!(
            pairs.len(),
            v["out"].as_object().expect("out").len(),
            "wektor {i}: liczba pol"
        );
        for (name, got) in pairs {
            assert_num(
                got,
                &v["out"][name],
                &format!("loadEconParams #{i} {name} diff={diff}"),
            );
        }
    }
}

/// #2 `terrainRowToTileYield` (L386-397) na syntetycznych wierszach JSON.
#[test]
fn terrain_row_to_tile_yield_matches_pin() {
    for (i, v) in vectors_of("terrainRowToTileYield").iter().enumerate() {
        let mut row = Map::new();
        for (field, t) in v["in"]["row"].as_object().expect("row") {
            row.insert(field.clone(), tagged_to_value(t));
        }
        let got = terrain_row_to_tile_yield(&Value::Object(row));
        assert_yield(&got, &v["out"], &format!("terrainRowToTileYield #{i}"));
    }
}

/// #3 `buildTerrainYields` (L399-406) na realnych wierszach `terrain-yields.json`.
#[test]
fn build_terrain_yields_matches_pin() {
    let data: Value = serde_json::from_str(TERRAIN_YIELDS_JSON).expect("json");
    let rows = data["terrain_types"].as_array().expect("terrain_types");
    let got = build_terrain_yields(rows);
    let v = vectors_of("buildTerrainYields")[0];
    let out = v["out"].as_object().expect("out");
    assert_eq!(got.len(), out.len(), "liczba kluczy TerenBazowy");
    for (key, want) in out {
        let y = got
            .get(key.as_str())
            .unwrap_or_else(|| panic!("brak klucza {key}"));
        assert_yield(y, want, &format!("buildTerrainYields[{key}]"));
    }
}

/// #4 `terrainModifier(name)` (L408-411) na realnych modyfikatorach.
#[test]
fn terrain_modifier_matches_pin() {
    let data: Value = serde_json::from_str(TERRAIN_YIELDS_JSON).expect("json");
    let mods = data["terrain_modifiers"]
        .as_array()
        .expect("terrain_modifiers");
    for v in vectors_of("terrainModifier") {
        let name = v["in"]["name"].as_str().expect("name");
        let got = terrain_modifier(mods, name);
        assert_yield(&got, &v["out"], &format!("terrainModifier({name:?})"));
    }
}

/// #5 `tileYield` (L421-492) - galezie: teren, las, rzeka, impKeys (ulepszeniaKeys / ulepszenieKey), zloze.
#[test]
fn tile_yield_matches_pin() {
    let data = parse_terrain_yields().expect("terrain-yields.json");
    for (i, v) in vectors_of("tileYield").iter().enumerate() {
        let inp = &v["in"];
        let teren = inp["terenBazowy"].as_str().expect("terenBazowy");
        let nakladka = inp["nakladka"].as_str().unwrap_or("");
        let ma_rzeke = inp["maRzeke"].as_bool().unwrap_or(false);
        let keys: Option<Vec<String>> = if kind(&inp["ulepszeniaKeys"]) == "list" {
            Some(
                inp["ulepszeniaKeys"]["items"]
                    .as_array()
                    .expect("items")
                    .iter()
                    .map(|s| s.as_str().expect("klucz").to_owned())
                    .collect(),
            )
        } else {
            None
        };
        let one = match kind(&inp["ulepszenieKey"]) {
            "str" => Some(inp["ulepszenieKey"]["v"].as_str().expect("v").to_owned()),
            _ => None,
        };
        let zloze = match kind(&inp["zloze"]) {
            "str" => Some(inp["zloze"]["v"].as_str().expect("v").to_owned()),
            _ => None,
        };
        let tile = WorkedTileImpInput {
            teren_bazowy: teren,
            nakladka,
            ma_rzeke,
            ulepszenia_keys: keys.as_deref(),
            ulepszenie_key: one.as_deref(),
            zloze: zloze.as_deref(),
        };
        let got = tile_yield_full(&data, &tile);
        assert_yield(&got, &v["out"], &format!("tileYield #{i}"));
    }
}

/// #6 `buildingValue(b, level, key)` = `Math.floor(baza[key] + przyrost[key] * (max(1, floor(level)) - 1))`.
/// Adapter: `b.baza[key]` brak = NaN (JS `undefined` w arytmetyce).
#[test]
fn building_value_matches_pin_all_keys() {
    for (i, v) in vectors_of("buildingValue").iter().enumerate() {
        let inp = &v["in"];
        let key = inp["key"].as_str().expect("key");
        let baza = baza_map(&inp["baza"]);
        let przyrost = baza_map(&inp["przyrost"]);
        let b = baza.get(key).copied().unwrap_or(f64::NAN);
        let p = przyrost.get(key).copied().unwrap_or(f64::NAN);
        let got = building_value(b, p, parse_num(&inp["level"]));
        assert_num(got, &v["out"], &format!("buildingValue #{i} key={key}"));
    }
}

/// #19 `resolvePopulationCapMatrixDelta(civKey)` (L1066-1069) na wbudowanej macierzy `civ-matrix.json`.
#[test]
fn resolve_population_cap_matrix_delta_matches_pin() {
    for (i, v) in vectors_of("resolvePopulationCapMatrixDelta")
        .iter()
        .enumerate()
    {
        let civ = &v["in"]["civKey"];
        let key: Option<&str> = match kind(civ) {
            "str" => civ["v"].as_str(),
            _ => None,
        };
        let got = resolve_population_cap_matrix_delta(key);
        assert_num(
            got,
            &v["out"],
            &format!("resolvePopulationCapMatrixDelta #{i} key={key:?}"),
        );
    }
}

/// Klucz cywilizacji z wektora: `{"kind":"str","v"}` -> `Some`, reszta (`absent`/`null`) -> `None`.
fn civ_key_of(civ: &Value) -> Option<&str> {
    if kind(civ) == "str" {
        civ["v"].as_str()
    } else {
        None
    }
}

fn difficulty_of(s: &str) -> Difficulty {
    match s {
        "easy" => Difficulty::Easy,
        "normal" => Difficulty::Normal,
        "hard" => Difficulty::Hard,
        other => panic!("nieznana trudnosc {other}"),
    }
}

/// #13 `civMatrixMnoznikHandelPieniadzRaw` (prywatna w web, wyeksportowana w kopii bundla do wektorow).
#[test]
fn civ_matrix_mnoznik_raw_matches_pin() {
    let m = &load_civ_matrix().file;
    for (i, v) in vectors_of("civMatrixMnoznikHandelPieniadzRaw")
        .iter()
        .enumerate()
    {
        let got = civ_matrix_mnoznik_handel_pieniadz_raw(m, civ_key_of(&v["in"]["civKey"]));
        match got {
            None => assert_eq!(
                kind(&v["out"]),
                "absent",
                "wektor {i}: oczekiwano undefined"
            ),
            Some(x) => assert_num(x, &v["out"]["v"], &format!("civMatrixMnoznikRaw #{i}")),
        }
    }
}

/// #12 `mnoznikHandelPieniadzForCiv(civKey, civs, fallback)`.
#[test]
fn mnoznik_handel_pieniadz_for_civ_matches_pin() {
    let m = &load_civ_matrix().file;
    for (i, v) in vectors_of("mnoznikHandelPieniadzForCiv").iter().enumerate() {
        let fb = parse_num(&v["in"]["fallback"]);
        let got = mnoznik_handel_pieniadz_for_civ(m, civ_key_of(&v["in"]["civKey"]), fb);
        assert_num(got, &v["out"], &format!("mnoznikHandelPieniadzForCiv #{i}"));
    }
}

/// #14 `mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled)`.
#[test]
fn mnoznik_handel_pieniadz_for_civ_by_difficulty_matches_pin() {
    let m = &load_civ_matrix().file;
    for (i, v) in vectors_of("mnoznikHandelPieniadzForCivByDifficulty")
        .iter()
        .enumerate()
    {
        let d = difficulty_of(v["in"]["difficulty"].as_str().expect("difficulty"));
        let fb = parse_num(&v["in"]["fallbackScaled"]);
        let got =
            mnoznik_handel_pieniadz_for_civ_by_difficulty(m, civ_key_of(&v["in"]["civKey"]), d, fb);
        assert_num(got, &v["out"], &format!("mnoznikByDifficulty #{i}"));
    }
}

/// #16 `civEconomyYieldMultipliers(bonusy)`: wynik zawsze `{handel: 1, nauka: 1}`, argument ignorowany.
#[test]
fn civ_economy_yield_multipliers_matches_pin() {
    for (i, v) in vectors_of("civEconomyYieldMultipliers").iter().enumerate() {
        let r = civ_economy_yield_multipliers();
        assert_num(
            r.handel,
            &v["out"]["handel"],
            &format!("civEconomyYieldMultipliers #{i} handel"),
        );
        assert_num(
            r.nauka,
            &v["out"]["nauka"],
            &format!("civEconomyYieldMultipliers #{i} nauka"),
        );
    }
}
