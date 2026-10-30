//! REPIN-EKONOMIA-D, partia D2.2c (runda 3) — pelna `cityYieldPerTurn` jako zlozenie glowy
//! (Step 2, Step 3' port, praca netto) i ogona (Step 4-9) z `gra/src/game/economy.ts`
//! (pin `91dc998a`, L819-1020).
//!
//! Wektory: `tests/p6_repin_d2_full_vectors/full-main.json` (1500 przypadkow: 1200 syntetycznych
//! oraz 300 z PRAWDZIWYMI rekordami `buildings.json` z weba 91dc998a, w tym `port` i `port_wielki`).
//!
//! Wektory sa generowane URUCHOMIENIEM PELNEJ funkcji `cityYieldPerTurn` z weba 91dc998a (node 22.22,
//! loader TS z `typescript`). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D2-Q1/logs/gen-full.mts`.
//!
//! Od D2.2d (runda 4) wejscie Rust to surowe kafelki (`tiles`) i budynki (`buildings`); Step 1
//! (`tileYield` bez ulepszen) i Step 3 (`buildingValue`, `pieniadzPortu`) licza sie w Rust.
//! `aggregates_bit_exact_vs_web_loops` porownuje te sumy bit-w-bit z petlami weba (pole `agg`).
//!
//! - `parity_full_main_bit_exact`: wszystkie pola wyniku, porownanie bit-w-bit (znak zera, NaN).
//! - `structural_*` / `boundary_*`: galezie wyprowadzone z kodu weba.

use civ_engine::data::civilizations::{CivMatrixFile, Num};
use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::economy_yield::{
    building_value, city_building_sums, city_praca_integer, city_terrain_sums, city_yield_per_turn,
    city_yield_per_turn_from_worked, tile_yield_base, BuildingYieldsInput, CityBuildingInput,
    CityYieldHeadParams, CityYieldInput, CityYieldOutput, CityYieldParams, CityYieldTailParams,
    WorkedTileInput,
};
use serde_json::Value;

const FULL_VECTORS: &str = include_str!("p6_repin_d2_full_vectors/full-main.json");

/// Liczba zakodowana przez generator: `{"f": String(x)}` (`-0` jako `"-0"`, `NaN`, `Infinity`).
fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable number {s}"))
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

/// Opcjonalne pole ctx: `{"u": true}` = `undefined` = `None`, inaczej liczba.
fn opt(v: &Value) -> Option<f64> {
    if v.get("u").is_some() {
        None
    } else {
        Some(ef(v))
    }
}

fn params_of(p: &Value) -> CityYieldParams {
    CityYieldParams {
        head: CityYieldHeadParams {
            budynek_mlyn_mnoznik_pracy: ef(&p["budynekMlynMnoznikPracy"]),
            budynek_mlyn_bonus_pracy: ef(&p["budynekMlynBonusPracy"]),
            budynek_cegielni_bonus_pracy: ef(&p["budynekCegielniBonusPracy"]),
        },
        tail: CityYieldTailParams {
            korupcja_cap: ef(&p["korupcjaCap"]),
            mennica_mnoznik_po_walucie: ef(&p["mennicaMnoznikPoWalucie"]),
            biblioteka_bonus_nauki: ef(&p["budynekBibliotekaBonusNauki"]),
            akademia_bonus_nauki: ef(&p["budynekAkademiaBonusNauki"]),
            garncarnia_bonus_zywnosci: ef(&p["budynekGarncarniaBonusZywnosci"]),
            zywnosc_zuzytka_populacja: ef(&p["zywnoscZuzytkaPopulacja"]),
        },
    }
}

fn civ_key_of(v: &Value) -> Option<&str> {
    v.as_str()
}

/// Wynik w kolejnosci pol: (nazwa, wartosc Rust, wartosc webu).
fn fields(out: &CityYieldOutput, exp: &Value) -> Vec<(&'static str, f64, f64)> {
    vec![
        ("praca", out.praca, ef(&exp["praca"])),
        ("pieniadz", out.pieniadz, ef(&exp["pieniadz"])),
        ("zywnosc", out.zywnosc, ef(&exp["zywnosc"])),
        ("nauka", out.nauka, ef(&exp["nauka"])),
        ("luksus", out.luksus, ef(&exp["luksus"])),
        ("kultura", out.kultura, ef(&exp["kultura"])),
        (
            "zywnoscBrutto",
            out.zywnosc_brutto,
            ef(&exp["zywnoscBrutto"]),
        ),
        ("handelBrutto", out.handel_brutto, ef(&exp["handelBrutto"])),
        ("pracaTerenu", out.praca_terenu, ef(&exp["pracaTerenu"])),
        (
            "pracaBudynkow",
            out.praca_budynkow,
            ef(&exp["pracaBudynkow"]),
        ),
        (
            "pieniadzBudynkow",
            out.pieniadz_budynkow,
            ef(&exp["pieniadzBudynkow"]),
        ),
        (
            "pieniadzZPracy",
            out.pieniadz_z_pracy,
            ef(&exp["pieniadzZPracy"]),
        ),
    ]
}

fn input_of<'a>(case: &'a Value) -> CityYieldInput<'a> {
    let a = &case["in"]["agg"];
    let c = &case["in"]["city"];
    let f = &case["in"]["flags"];
    let x = &case["in"]["ctx"];
    CityYieldInput {
        civ_key: civ_key_of(&c["civKey"]),
        ludnosc: ef(&c["ludnosc"]),
        procent_nauka: ef(&c["podzial"]["procentNauka"]),
        procent_pieniadz: ef(&c["podzial"]["procentPieniadz"]),
        procent_luksus: ef(&c["podzial"]["procentLuksus"]),
        poborca_count: c["poborca"].as_u64().expect("poborca count") as u32,
        praca_terenu: ef(&a["pracaTerenu"]),
        handel_terenu: ef(&a["handelTerenu"]),
        zywnosc_terenu: ef(&a["zywnoscTerenu"]),
        praca_budynkow: ef(&a["pracaBudynkow"]),
        pieniadz_budynkow: ef(&a["pieniadzBudynkow"]),
        pieniadz_portu: ef(&a["pieniadzPortu"]),
        zywnosc_budynkow: ef(&a["zywnoscBudynkow"]),
        nauka_budynkow: ef(&a["naukaBudynkow"]),
        kultura_budynkow: ef(&a["kulturaBudynkow"]),
        ma_mlyn: f["maMlyn"].as_bool().unwrap(),
        ma_cegielnia: f["maCegielnia"].as_bool().unwrap(),
        strata_fraction: ef(&x["strataFraction"]),
        waluta_odkryta: f["walutaOdkryta"].as_bool().unwrap(),
        ma_mennica: f["maMennica"].as_bool().unwrap(),
        ma_biblioteka: f["maBiblioteka"].as_bool().unwrap(),
        ma_akademia: f["maAkademia"].as_bool().unwrap(),
        civ_handel_mult: opt(&x["civHandelMult"]),
        premia_handlu_tras: opt(&x["premiaHandluTrasHandlowych"]),
        additional_tax: opt(&x["additionalTax"]),
        civ_nauka_mult: opt(&x["civNaukaMult"]),
        liczba_garncarni: opt(&x["liczbaGarncarni"]),
        wojsko_zuzycie_zywnosci: ef(&x["wojskoZuzycieZywnosci"]),
    }
}

fn tiles_of(case: &Value) -> Vec<WorkedTileInput<'_>> {
    case["in"]["tiles"]
        .as_array()
        .expect("tiles")
        .iter()
        .map(|t| WorkedTileInput {
            teren_bazowy: t["teren"].as_str().expect("teren"),
            nakladka: t["nakladka"].as_str().expect("nakladka"),
            ma_rzeke: t["maRzeke"].as_bool().expect("maRzeke"),
        })
        .collect()
}

fn yields_of(v: &Value) -> BuildingYieldsInput {
    BuildingYieldsInput {
        praca: ef(&v["praca"]),
        pieniadz: ef(&v["pieniadz"]),
        zywnosc: ef(&v["zywnosc"]),
        nauka: ef(&v["nauka"]),
        kultura: ef(&v["kultura"]),
    }
}

fn buildings_of(case: &Value) -> Vec<CityBuildingInput<'_>> {
    case["in"]["buildings"]
        .as_array()
        .expect("buildings")
        .iter()
        .map(|b| CityBuildingInput {
            id: b["id"].as_str().expect("id"),
            level: ef(&b["level"]),
            baza: yields_of(&b["baza"]),
            przyrost: yields_of(&b["przyrost"]),
        })
        .collect()
}

/// Pelna sciezka D2.2d: kafelki i budynki z wektora, Step 1 i Step 3 liczone w Rust.
fn run_case(matrix: &CivMatrixFile, terrain: &TerrainYieldsFile, case: &Value) -> CityYieldOutput {
    let params = params_of(&case["in"]["params"]);
    let input = input_of(case);
    let tiles = tiles_of(case);
    let buildings = buildings_of(case);
    city_yield_per_turn_from_worked(matrix, terrain, &params, &input, &tiles, &buildings)
}

/// Klucze `eko_*` uzywane przez pelna funkcje (do wyzerowania przed podmiana).
const FULL_KEYS: &[&str] = &[
    "eko_pieniadz_port_proc",
    "eko_praca_proc",
    "eko_handel_brutto_proc",
    "eko_korupcja_proc",
    "eko_luksus_proc",
    "eko_nauka_proc",
    "eko_pieniadz_proc",
    "eko_zywnosc_proc",
    "eko_kultura_proc",
];

/// Syntetyczna macierz: klucze `eko_*` wyzerowane we wszystkich wierszach i w domyslnych, potem
/// ustawiane wartosci z `set` (mul_proc: baza * (1 + v)). Dane z wlasnego testu, nie z gry.
fn synthetic_matrix(set: &[(&str, f64)]) -> CivMatrixFile {
    let mut m = load_civ_matrix().file.clone();
    for key in FULL_KEYS {
        for row in m.cywilizacje.iter_mut() {
            row.params.remove(*key);
        }
        m.defaults.remove(*key);
    }
    for (key, v) in set {
        m.defaults.insert((*key).to_owned(), Num::Float(*v));
    }
    m
}

/// Wejscie neutralne: brak wlasciciela, bez mlyna/cegielni/bonusow, 100 Handlu, 50/50/0.
fn neutral_input() -> CityYieldInput<'static> {
    CityYieldInput {
        civ_key: None,
        ludnosc: 0.0,
        procent_nauka: 50.0,
        procent_pieniadz: 50.0,
        procent_luksus: 0.0,
        poborca_count: 0,
        praca_terenu: 0.0,
        handel_terenu: 100.0,
        zywnosc_terenu: 0.0,
        praca_budynkow: 0.0,
        pieniadz_budynkow: 0.0,
        pieniadz_portu: 0.0,
        zywnosc_budynkow: 0.0,
        nauka_budynkow: 0.0,
        kultura_budynkow: 0.0,
        ma_mlyn: false,
        ma_cegielnia: false,
        strata_fraction: 0.0,
        waluta_odkryta: false,
        ma_mennica: false,
        ma_biblioteka: false,
        ma_akademia: false,
        civ_handel_mult: None,
        premia_handlu_tras: None,
        additional_tax: None,
        civ_nauka_mult: None,
        liczba_garncarni: None,
        wojsko_zuzycie_zywnosci: 0.0,
    }
}

fn neutral_params() -> CityYieldParams {
    CityYieldParams {
        head: CityYieldHeadParams {
            budynek_mlyn_mnoznik_pracy: 2.0,
            budynek_mlyn_bonus_pracy: 2.0,
            budynek_cegielni_bonus_pracy: 0.25,
        },
        tail: CityYieldTailParams {
            korupcja_cap: 0.5,
            mennica_mnoznik_po_walucie: 1.5,
            biblioteka_bonus_nauki: 0.15,
            akademia_bonus_nauki: 0.1,
            garncarnia_bonus_zywnosci: 0.1,
            zywnosc_zuzytka_populacja: 0.5,
        },
    }
}

#[test]
fn parity_full_main_bit_exact() {
    let v: Value = serde_json::from_str(FULL_VECTORS).expect("vectors json");
    assert_eq!(v["pin"], "91dc998a");
    let cases = v["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 1500);
    let matrix = &load_civ_matrix().file;
    let terrain = parse_terrain_yields().expect("terrain-yields.json");
    let mut mismatches = Vec::new();
    for (i, case) in cases.iter().enumerate() {
        let out = run_case(matrix, &terrain, case);
        for (name, got, exp) in fields(&out, &case["out"]) {
            if !same(got, exp) {
                mismatches.push(format!("#{i} {name}: got {got:?} exp {exp:?}"));
            }
        }
    }
    assert!(
        mismatches.is_empty(),
        "{} mismatches, first: {:?}",
        mismatches.len(),
        mismatches.iter().take(5).collect::<Vec<_>>()
    );
}

#[test]
fn parity_full_main_exercises_port_bonus_and_owner_paths() {
    // Dowod pokrycia: wsrod wektorow sa przypadki z wlascicielem, niezerowym bonusem portu
    // (`eko_pieniadz_port_proc` != 0, `pieniadzPortu` != 0) i z dodatnim `additionalTax`.
    let v: Value = serde_json::from_str(FULL_VECTORS).expect("vectors json");
    let matrix = &load_civ_matrix().file;
    let mut port_applied = 0usize;
    let mut owner_cases = 0usize;
    let mut additional_pos = 0usize;
    for case in v["cases"].as_array().unwrap() {
        if case["in"]["city"]["civKey"].is_string()
            && !case["in"]["city"]["civKey"].as_str().unwrap().is_empty()
        {
            owner_cases += 1;
            let key = case["in"]["city"]["civKey"].as_str().unwrap();
            let port = civ_matrix_port(matrix, key);
            if port != 0.0 && ef(&case["in"]["agg"]["pieniadzPortu"]) != 0.0 {
                port_applied += 1;
            }
        }
        if let Some(x) = opt(&case["in"]["ctx"]["additionalTax"]) {
            if x > 0.0 {
                additional_pos += 1;
            }
        }
    }
    eprintln!(
        "pokrycie: owner={owner_cases} port_applied={port_applied} additional_tax_pos={additional_pos}"
    );
    assert!(owner_cases > 0);
    assert!(additional_pos > 0);
}

fn civ_matrix_port(matrix: &CivMatrixFile, key: &str) -> f64 {
    civ_engine::domain::civ_matrix::civ_matrix_param(matrix, key, "eko_pieniadz_port_proc")
}

#[test]
fn structural_praca_integer_rounds_and_zeroes_non_positive() {
    assert_eq!(city_praca_integer(0.5).to_bits(), 1.0f64.to_bits());
    assert_eq!(city_praca_integer(2.5).to_bits(), 3.0f64.to_bits());
    assert_eq!(city_praca_integer(7.49).to_bits(), 7.0f64.to_bits());
    assert_eq!(city_praca_integer(-0.0).to_bits(), 0.0f64.to_bits());
    assert_eq!(city_praca_integer(-0.4).to_bits(), 0.0f64.to_bits());
    assert_eq!(city_praca_integer(f64::NAN).to_bits(), 0.0f64.to_bits());
    assert_eq!(
        city_praca_integer(f64::INFINITY).to_bits(),
        0.0f64.to_bits()
    );
    assert_eq!(
        city_praca_integer(f64::NEG_INFINITY).to_bits(),
        0.0f64.to_bits()
    );
}

#[test]
fn structural_neutral_praca_is_mlyn_then_cegielnia_then_integer() {
    // Praca terenu 10, Mlyn: 10*2+2 = 22, Cegielnia: 22*1.25 = 27.5 -> round 28. Budynki 0.
    let matrix = synthetic_matrix(&[]);
    let mut input = neutral_input();
    input.praca_terenu = 10.0;
    input.ma_mlyn = true;
    input.ma_cegielnia = true;
    let out = city_yield_per_turn(&matrix, &neutral_params(), &input);
    assert_eq!(out.praca, 28.0);
    assert_eq!(out.praca_terenu, 27.0); // floor(27.5)
    assert_eq!(out.pieniadz_z_pracy, 0.0);
}

#[test]
fn structural_port_bonus_requires_owner_and_nonzero_param() {
    let matrix = synthetic_matrix(&[("eko_pieniadz_port_proc", 0.5)]);
    let mut input = neutral_input();
    input.pieniadz_budynkow = 10.0;
    input.pieniadz_portu = 8.0;
    // Bez wlasciciela: bonus nie wchodzi (web: city.civKey falsy).
    let legacy = city_yield_per_turn(&matrix, &neutral_params(), &input);
    assert_eq!(legacy.pieniadz_budynkow, 10.0);
    // Z wlascicielem: 10 + 8 * 0.5 = 14.
    input.civ_key = Some("grecy");
    let owned = city_yield_per_turn(&matrix, &neutral_params(), &input);
    assert_eq!(owned.pieniadz_budynkow, 14.0);
    // Port wchodzi do handlu brutto: 100 + 14 (handel terenu 100, bez mnoznikow z legacy).
    assert_eq!(owned.handel_brutto, 114.0);
}

#[test]
fn structural_port_zero_param_is_neutral_and_nan_propagates() {
    let zero = synthetic_matrix(&[("eko_pieniadz_port_proc", 0.0)]);
    let mut input = neutral_input();
    input.civ_key = Some("grecy");
    input.pieniadz_budynkow = 10.0;
    input.pieniadz_portu = 8.0;
    let out = city_yield_per_turn(&zero, &neutral_params(), &input);
    assert_eq!(out.pieniadz_budynkow, 10.0);

    let nan = synthetic_matrix(&[("eko_pieniadz_port_proc", f64::NAN)]);
    let out = city_yield_per_turn(&nan, &neutral_params(), &input);
    assert!(
        out.pieniadz_budynkow.is_nan(),
        "NaN port param propagates like web"
    );
}

#[test]
fn structural_additional_tax_enters_gross_trade_after_matrix() {
    // Web: handelBrutto = matrix(handelBazowy) then += max(0, additionalTax). Macierz handlu x2.
    let matrix = synthetic_matrix(&[("eko_handel_brutto_proc", 1.0)]);
    let mut input = neutral_input();
    input.civ_key = Some("grecy");
    input.procent_nauka = 0.0;
    input.procent_pieniadz = 100.0;
    input.additional_tax = Some(20.0);
    let out = city_yield_per_turn(&matrix, &neutral_params(), &input);
    // (100 * (1 + 1.0)) + 20 = 220 (matrix x2 dotyczy tylko bazy, dodatek po mnozniku).
    assert_eq!(out.handel_brutto, 220.0);
}

#[test]
fn structural_pieniadz_z_pracy_is_always_zero() {
    let matrix = synthetic_matrix(&[]);
    let mut input = neutral_input();
    input.praca_budynkow = 500.0;
    input.praca_terenu = 500.0;
    input.civ_key = Some("grecy");
    let out = city_yield_per_turn(&matrix, &neutral_params(), &input);
    assert_eq!(out.pieniadz_z_pracy.to_bits(), 0.0f64.to_bits());
    assert_eq!(out.praca, 1000.0);
}

#[test]
fn boundary_negative_zero_additional_tax_is_positive_zero_in_trade() {
    let matrix = synthetic_matrix(&[]);
    let mut input = neutral_input();
    input.handel_terenu = 0.0;
    input.additional_tax = Some(-0.0);
    let out = city_yield_per_turn(&matrix, &neutral_params(), &input);
    assert_eq!(out.handel_brutto.to_bits(), 0.0f64.to_bits());
}

#[test]
fn aggregates_bit_exact_vs_web_loops() {
    // Step 1 (L837-847) i Step 3 (L873-882) z pinu: sumy Rust = petle weba, bit-w-bit.
    let v: Value = serde_json::from_str(FULL_VECTORS).expect("vectors json");
    let terrain = parse_terrain_yields().expect("terrain-yields.json");
    let mut mismatches = Vec::new();
    for (i, case) in v["cases"].as_array().unwrap().iter().enumerate() {
        let tiles = tiles_of(case);
        let buildings = buildings_of(case);
        let t = city_terrain_sums(&terrain, &tiles);
        let b = city_building_sums(&buildings);
        let a = &case["in"]["agg"];
        let pairs = [
            ("zywnoscTerenu", t.zywnosc),
            ("pracaTerenu", t.praca),
            ("handelTerenu", t.handel),
            ("pracaBudynkow", b.praca),
            ("pieniadzBudynkow", b.pieniadz),
            ("pieniadzPortu", b.pieniadz_portu),
            ("zywnoscBudynkow", b.zywnosc),
            ("naukaBudynkow", b.nauka),
            ("kulturaBudynkow", b.kultura),
        ];
        for (name, got) in pairs {
            let exp = ef(&a[name]);
            if !same(got, exp) {
                mismatches.push(format!("#{i} {name}: got {got:?} exp {exp:?}"));
            }
        }
    }
    assert!(
        mismatches.is_empty(),
        "first: {:?}",
        mismatches.iter().take(5).collect::<Vec<_>>()
    );
}

#[test]
fn real_buildings_cover_port_and_port_wielki() {
    // Prawdziwe rekordy: 'port' wchodzi do pieniadzPortu, 'port_wielki' nie (web: record.id === 'port').
    let v: Value = serde_json::from_str(FULL_VECTORS).expect("vectors json");
    let (mut port, mut wielki) = (0usize, 0usize);
    for case in v["cases"].as_array().unwrap().iter().skip(1200) {
        for b in case["in"]["buildings"].as_array().unwrap() {
            match b["id"].as_str().unwrap() {
                "port" => port += 1,
                "port_wielki" => wielki += 1,
                _ => {}
            }
        }
    }
    assert!(port > 0 && wielki > 0, "port={port} port_wielki={wielki}");
}

fn yields(
    praca: f64,
    pieniadz: f64,
    zywnosc: f64,
    nauka: f64,
    kultura: f64,
) -> BuildingYieldsInput {
    BuildingYieldsInput {
        praca,
        pieniadz,
        zywnosc,
        nauka,
        kultura,
    }
}

#[test]
fn structural_building_value_follows_level_formula() {
    // baza + przyrost*(max(1, floor(level)) - 1), potem floor.
    assert_eq!(building_value(10.0, 2.0, 1.0), 10.0);
    assert_eq!(building_value(10.0, 2.0, 3.0), 14.0);
    assert_eq!(building_value(10.0, 2.0, 2.9), 12.0); // floor(level) = 2
    assert_eq!(building_value(10.7, 0.0, 1.0), 10.0); // floor wyniku
    assert_eq!(building_value(10.0, 2.0, 0.0).to_bits(), 10.0f64.to_bits()); // max(1, 0)
    assert!(building_value(10.0, 2.0, f64::NAN).is_nan());
    assert!(building_value(f64::NAN, 2.0, 1.0).is_nan()); // brak klucza w rekordzie
}

#[test]
fn structural_port_sum_only_counts_id_port_at_level() {
    let b = [
        CityBuildingInput {
            id: "port",
            level: 3.0,
            baza: yields(0.0, 3.0, 0.0, 0.0, 0.0),
            przyrost: yields(0.0, 2.0, 0.0, 0.0, 0.0),
        },
        CityBuildingInput {
            id: "port_wielki",
            level: 1.0,
            baza: yields(0.0, 5.0, 0.0, 0.0, 0.0),
            przyrost: yields(0.0, 0.0, 0.0, 0.0, 0.0),
        },
    ];
    let s = city_building_sums(&b);
    assert_eq!(s.pieniadz_portu, 7.0); // 3 + 2*2
    assert_eq!(s.pieniadz, 12.0); // + 5 z port_wielki
}

#[test]
fn structural_tile_forest_and_river_modifiers_and_unknown_terrain() {
    let data = parse_terrain_yields().expect("terrain-yields.json");
    let base = tile_yield_base(
        &data,
        &WorkedTileInput {
            teren_bazowy: "laka",
            nakladka: "brak",
            ma_rzeke: false,
        },
    );
    let forest = tile_yield_base(
        &data,
        &WorkedTileInput {
            teren_bazowy: "laka",
            nakladka: "las",
            ma_rzeke: false,
        },
    );
    let row = data
        .terrain_modifiers
        .iter()
        .find(|m| m.modyfikator == "Las (nakładka)")
        .expect("forest modifier");
    assert_eq!(forest.zywnosc, base.zywnosc + row.zywnosc as f64);
    assert_eq!(forest.praca, base.praca + row.praca as f64);
    assert_eq!(forest.handel, base.handel + row.podatek as f64);
    let unknown = tile_yield_base(
        &data,
        &WorkedTileInput {
            teren_bazowy: "nieznany",
            nakladka: "brak",
            ma_rzeke: false,
        },
    );
    assert_eq!(unknown.zywnosc.to_bits(), 0.0f64.to_bits());
    assert_eq!(unknown.praca.to_bits(), 0.0f64.to_bits());
    assert_eq!(unknown.handel.to_bits(), 0.0f64.to_bits());
    let sums = city_terrain_sums(
        &data,
        &[
            WorkedTileInput {
                teren_bazowy: "laka",
                nakladka: "las",
                ma_rzeke: false,
            },
            WorkedTileInput {
                teren_bazowy: "laka",
                nakladka: "las",
                ma_rzeke: false,
            },
        ],
    );
    assert_eq!(sums.praca, 2.0 * forest.praca);
}
