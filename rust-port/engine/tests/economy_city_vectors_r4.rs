//! Wektory z pinu `gra/` 91dc998a (esbuild bundle kopii `economy.ts`, uruchomiony w node) wobec portow
//! R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1 runda 4:
//! - `buildingGivesHappiness` (#7) -> [`building_gives_happiness`],
//! - `buildingHappinessAtLevel` (#8) -> [`building_happiness_at_level`] (wejscie z surowych pol JSON),
//! - `cityBuildingEntriesFromBuiltIds` (#11, tablica i Set) -> [`city_building_entries_from_built_ids`],
//! - `civBonusyForCivKey` (#15) -> [`civ_bonusy_for_civ_key`],
//! - `cityYieldPerTurn` (#17) -> [`city_yield_per_turn_from_worked_imp`] (kafelki z ulepszeniami, budynki z szczesciem),
//! - `corruptionRate` (#22, M6: cap NaN / `Math.min`) -> [`corruption_rate`],
//! - `buildTerrainYields` na syntetycznych wierszach (#3: duplikaty etykiet, nieznane etykiety) -> [`build_terrain_yields`].
//!
//! Plik wektorow: `tests/fixtures/economy_city_vectors_r4_91dc998a.json`.
//! Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1/10-gen-economy-city-vectors-r4.mjs`.
//! Liczby w JSON: liczba, albo tekst `"NaN"`, `"Infinity"`, `"-Infinity"`, `"-0"`.

use std::collections::{BTreeMap, HashSet};

use civ_engine::data::terrain_map::parse_terrain_yields;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::economy_city_fns::{
    building_gives_happiness, city_building_entries_from_built_ids, civ_bonusy_for_civ_key,
    corruption_rate, BuildingLevelCatalogEntry, CorruptionParams,
};
use civ_engine::domain::economy_city_terrain::build_terrain_yields;
use civ_engine::domain::economy_yield::{
    building_happiness_at_level, city_yield_per_turn_from_worked_imp, BuildingYieldsInput,
    CityBuildingFullInput, CityBuildingInput, CityYieldHeadParams, CityYieldInput, CityYieldParams,
    CityYieldTailParams, WorkedTileImpInput,
};
use civ_engine::domain::improvements::TileYield;
use serde_json::{Number, Value};

const FIXTURE: &str = include_str!("fixtures/economy_city_vectors_r4_91dc998a.json");

fn parse_num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => other.parse::<f64>().expect("poprawna liczba"),
        },
        other => panic!("oczekiwano liczby, jest {other:?}"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_num(got: f64, want: &Value, ctx: &str) {
    let want = parse_num(want);
    assert!(same(got, want), "{ctx}: got {got:?} want {want:?}");
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

/// Tag JS-owy z generatora (`absent` | `null` | `num` | `str` | `bool` | `json`); `absent` = `None`.
fn tag_to_value(t: &Value) -> Option<Value> {
    match t["kind"].as_str().unwrap_or("absent") {
        "absent" => None,
        "null" => Some(Value::Null),
        "num" => Some(Value::Number(
            Number::from_f64(parse_num(&t["v"])).expect("skonczona liczba"),
        )),
        "str" => Some(Value::String(t["v"].as_str().expect("str").to_owned())),
        "bool" => Some(Value::Bool(t["v"].as_bool().expect("bool"))),
        "json" => Some(t["v"].clone()),
        other => panic!("nieznany tag {other}"),
    }
}

/// Tag liczbowy: `absent` -> `NaN` (JS `undefined` w arytmetyce), `num` -> liczba; inne typy poza domena.
fn tag_num_or_nan(t: &Value) -> f64 {
    match t["kind"].as_str().unwrap_or("absent") {
        "absent" => f64::NAN,
        "num" => parse_num(&t["v"]),
        other => panic!("pole liczbowe poza domena: {other}"),
    }
}

/// Tag `Option<f64>`: tylko `num` (JS `typeof === 'number'`); inne typy = `None`.
fn tag_opt_num(t: &Value) -> Option<f64> {
    match t["kind"].as_str().unwrap_or("absent") {
        "num" => Some(parse_num(&t["v"])),
        _ => None,
    }
}

// ---- #7 buildingGivesHappiness -------------------------------------------------------------

#[test]
fn building_gives_happiness_matches_pin() {
    let vs = vectors_of("buildingGivesHappiness");
    assert!(!vs.is_empty());
    for (i, v) in vs.iter().enumerate() {
        let raw = tag_to_value(&v["in"]["dajeSzczescie"]);
        let got = building_gives_happiness(raw.as_ref());
        assert_eq!(Value::Bool(got), v["out"], "buildingGivesHappiness #{i}");
    }
}

// ---- #8 buildingHappinessAtLevel -----------------------------------------------------------

#[test]
fn building_happiness_at_level_matches_pin() {
    let vs = vectors_of("buildingHappinessAtLevel");
    assert!(!vs.is_empty());
    for (i, v) in vs.iter().enumerate() {
        let inp = &v["in"];
        let daje = building_gives_happiness(tag_to_value(&inp["dajeSzczescie"]).as_ref());
        let baza_zad = tag_opt_num(&inp["bazaZadowolenie"]);
        let przyrost = tag_num_or_nan(&inp["przyrostZadowolenie"]);
        let level = parse_num(&inp["level"]);
        let got = building_happiness_at_level(daje, baza_zad, przyrost, level);
        assert_num(got, &v["out"], &format!("buildingHappinessAtLevel #{i}"));
    }
}

// ---- #11 cityBuildingEntriesFromBuiltIds ---------------------------------------------------

#[test]
fn city_building_entries_match_pin() {
    let vs = vectors_of("cityBuildingEntriesFromBuiltIds");
    assert!(!vs.is_empty());
    for (i, v) in vs.iter().enumerate() {
        let inp = &v["in"];
        let catalog_json = inp["catalog"].as_array().expect("catalog");
        // Pary bramki technologii w kolejnosci JS (Object.entries).
        let gates: Vec<Option<Vec<(String, String)>>> = catalog_json
            .iter()
            .map(|r| {
                let g = &r["poziomTechGate"];
                match g["kind"].as_str().unwrap_or("absent") {
                    "obj" => Some(
                        g["entries"]
                            .as_array()
                            .expect("entries")
                            .iter()
                            .map(|p| {
                                (
                                    p[0].as_str().expect("k").to_owned(),
                                    p[1].as_str().expect("v").to_owned(),
                                )
                            })
                            .collect(),
                    ),
                    _ => None,
                }
            })
            .collect();
        let catalog: Vec<BuildingLevelCatalogEntry<'_>> = catalog_json
            .iter()
            .zip(gates.iter())
            .map(|(r, gate)| BuildingLevelCatalogEntry {
                id: r["id"].as_str().expect("id"),
                epoka_wejscia: r["epokaWejscia"].as_f64().expect("epoka"),
                maks_poziom: r["maksPoziom"].as_f64().expect("maks"),
                poziom_tech_gate: gate.as_deref(),
            })
            .collect();
        let built_owned: Vec<String> = inp["builtIds"]
            .as_array()
            .expect("builtIds")
            .iter()
            .map(|s| s.as_str().expect("id").to_owned())
            .collect();
        let built: Vec<&str> = built_owned.iter().map(String::as_str).collect();
        // Tablica i Set z web daja ten sam zbior; Rust przyjmuje HashSet (adapter `new Set(arr)`).
        let unlocked: Option<HashSet<String>> =
            match inp["unlockedTechs"]["kind"].as_str().unwrap_or("absent") {
                "list" => Some(
                    inp["unlockedTechs"]["items"]
                        .as_array()
                        .expect("items")
                        .iter()
                        .map(|s| s.as_str().expect("tech").to_owned())
                        .collect(),
                ),
                _ => None,
            };
        let epoch = inp["cityEpoch"].as_f64().expect("epoch");
        let got = city_building_entries_from_built_ids(&built, &catalog, epoch, unlocked.as_ref());
        let got_json: Vec<Value> = got
            .iter()
            .map(|e| {
                serde_json::json!({
                    "id": catalog[e.catalog_index].id,
                    "level": e.level,
                })
            })
            .collect();
        let want = v["out"].as_array().expect("out");
        assert_eq!(
            got_json.len(),
            want.len(),
            "cityBuildingEntries #{i} dlugosc"
        );
        for (j, (g, w)) in got_json.iter().zip(want.iter()).enumerate() {
            assert_eq!(g["id"], w["id"], "cityBuildingEntries #{i}.{j} id");
            assert_num(
                g["level"].as_f64().expect("level"),
                &w["level"],
                &format!("cityBuildingEntries #{i}.{j} level"),
            );
        }
    }
}

// ---- #15 civBonusyForCivKey ----------------------------------------------------------------

#[test]
fn civ_bonusy_for_civ_key_matches_pin() {
    let vs = vectors_of("civBonusyForCivKey");
    assert!(!vs.is_empty());
    for (i, v) in vs.iter().enumerate() {
        let inp = &v["in"];
        let key_tag = &inp["civKey"];
        let key: Option<&str> = match key_tag["kind"].as_str().unwrap_or("absent") {
            "str" => Some(key_tag["v"].as_str().expect("str")),
            _ => None,
        };
        let civs = tag_to_value(&inp["civs"]);
        let got = civ_bonusy_for_civ_key(key, civs.as_ref());
        assert_eq!(Value::Array(got), v["out"], "civBonusyForCivKey #{i}");
    }
}

// ---- #17 cityYieldPerTurn ------------------------------------------------------------------

fn parse_tiles_list(t: &Value) -> Option<Vec<String>> {
    match t["kind"].as_str().unwrap_or("absent") {
        "list" => Some(
            t["items"]
                .as_array()
                .expect("items")
                .iter()
                .map(|s| s.as_str().expect("imp").to_owned())
                .collect(),
        ),
        _ => None,
    }
}

/// Pola kafelka przechowywane po stronie wlasciciela danych: (ulepszeniaKeys, ulepszenieKey, zloze).
type TileTags = (Option<Vec<String>>, Option<String>, Option<String>);

fn str_or_none(t: &Value) -> Option<String> {
    match t["kind"].as_str().unwrap_or("absent") {
        "str" => Some(t["v"].as_str().expect("str").to_owned()),
        _ => None,
    }
}

fn bool_tag(t: &Value) -> bool {
    matches!(tag_to_value(t), Some(Value::Bool(true)))
}

fn yields_tag(bz: &Value) -> BuildingYieldsInput {
    BuildingYieldsInput {
        praca: tag_num_or_nan(&bz["praca"]),
        pieniadz: tag_num_or_nan(&bz["pieniadz"]),
        zywnosc: tag_num_or_nan(&bz["zywnosc"]),
        nauka: tag_num_or_nan(&bz["nauka"]),
        kultura: tag_num_or_nan(&bz["kultura"]),
    }
}

fn params_of(p: &Value) -> CityYieldParams {
    let f = |k: &str| parse_num(&p[k]);
    CityYieldParams {
        head: CityYieldHeadParams {
            budynek_mlyn_mnoznik_pracy: f("budynekMlynMnoznikPracy"),
            budynek_mlyn_bonus_pracy: f("budynekMlynBonusPracy"),
            budynek_cegielni_bonus_pracy: f("budynekCegielniBonusPracy"),
        },
        tail: CityYieldTailParams {
            korupcja_cap: f("korupcjaCap"),
            mennica_mnoznik_po_walucie: f("mennicaMnoznikPoWalucie"),
            biblioteka_bonus_nauki: f("budynekBibliotekaBonusNauki"),
            akademia_bonus_nauki: f("budynekAkademiaBonusNauki"),
            garncarnia_bonus_zywnosci: f("budynekGarncarniaBonusZywnosci"),
            zywnosc_zuzytka_populacja: f("zywnoscZuzytkaPopulacja"),
        },
    }
}

#[test]
fn city_yield_per_turn_matches_pin() {
    let vs = vectors_of("cityYieldPerTurn");
    assert!(!vs.is_empty());
    let matrix = &load_civ_matrix().file;
    let terrain = parse_terrain_yields().expect("terrain yields");
    for (i, v) in vs.iter().enumerate() {
        let inp = &v["in"];
        let civ_key = str_or_none(&inp["civKey"]);
        // Kafelki: `nakladka`/`maRzeke`/... nieobecne = wartosci neutralne (web: undefined nie wchodzi w galezie).
        let tiles_owned: Vec<TileTags> = inp["tiles"]
            .as_array()
            .expect("tiles")
            .iter()
            .map(|t| {
                (
                    parse_tiles_list(&t["ulepszeniaKeys"]),
                    str_or_none(&t["ulepszenieKey"]),
                    str_or_none(&t["zloze"]),
                )
            })
            .collect();
        let tiles_nak: Vec<String> = inp["tiles"]
            .as_array()
            .expect("tiles")
            .iter()
            .map(|t| str_or_none(&t["nakladka"]).unwrap_or_default())
            .collect();
        let tiles: Vec<WorkedTileImpInput<'_>> = inp["tiles"]
            .as_array()
            .expect("tiles")
            .iter()
            .enumerate()
            .map(|(k, t)| WorkedTileImpInput {
                teren_bazowy: t["terenBazowy"].as_str().expect("teren"),
                nakladka: tiles_nak[k].as_str(),
                ma_rzeke: bool_tag(&t["maRzeke"]),
                ulepszenia_keys: tiles_owned[k].0.as_deref(),
                ulepszenie_key: tiles_owned[k].1.as_deref(),
                zloze: tiles_owned[k].2.as_deref(),
            })
            .collect();
        let buildings: Vec<CityBuildingFullInput<'_>> = inp["buildings"]
            .as_array()
            .expect("buildings")
            .iter()
            .map(|b| CityBuildingFullInput {
                base: CityBuildingInput {
                    id: b["id"].as_str().expect("id"),
                    level: parse_num(&b["level"]),
                    baza: yields_tag(&b["baza"]),
                    przyrost: yields_tag(&b["przyrost"]),
                },
                daje_szczescie: bool_tag(&b["dajeSzczescie"]),
                baza_zadowolenie: tag_opt_num(&b["baza"]["zadowolenie"]),
                przyrost_zadowolenie: tag_num_or_nan(&b["przyrost"]["zadowolenie"]),
            })
            .collect();
        let ctx = &inp["ctx"];
        let ctx_num = |k: &str| -> Option<f64> { tag_opt_num(&ctx[k]) };
        let ctx_bool = |k: &str| -> bool { bool_tag(&ctx[k]) };
        let input = CityYieldInput {
            civ_key: civ_key.as_deref(),
            ludnosc: parse_num(&inp["ludnosc"]),
            procent_nauka: parse_num(&inp["procentNauka"]),
            procent_pieniadz: parse_num(&inp["procentPieniadz"]),
            procent_luksus: parse_num(&inp["procentLuksus"]),
            poborca_count: inp["poborcaCount"].as_u64().expect("poborca") as u32,
            praca_terenu: 0.0,
            handel_terenu: 0.0,
            zywnosc_terenu: 0.0,
            praca_budynkow: 0.0,
            pieniadz_budynkow: 0.0,
            pieniadz_portu: 0.0,
            zywnosc_budynkow: 0.0,
            nauka_budynkow: 0.0,
            kultura_budynkow: 0.0,
            ma_mlyn: ctx_bool("maMlyn"),
            ma_cegielnia: ctx_bool("maCegielnia"),
            strata_fraction: ctx_num("strataFraction").expect("strata"),
            waluta_odkryta: ctx_bool("walutaOdkryta"),
            ma_mennica: ctx_bool("maMennica"),
            ma_biblioteka: ctx_bool("maBiblioteka"),
            ma_akademia: ctx_bool("maAkademia"),
            civ_handel_mult: ctx_num("civHandelMult"),
            premia_handlu_tras: ctx_num("premiaHandluTrasHandlowych"),
            additional_tax: ctx_num("additionalTax"),
            civ_nauka_mult: ctx_num("civNaukaMult"),
            liczba_garncarni: ctx_num("liczbaGarncarni"),
            wojsko_zuzycie_zywnosci: ctx_num("wojskoZuzycieZywnosci").expect("wojsko"),
        };
        let params = params_of(&inp["params"]);
        let got = city_yield_per_turn_from_worked_imp(
            matrix, &terrain, &params, &input, &tiles, &buildings,
        );
        let w = &v["out"];
        let pairs = [
            ("praca", got.praca),
            ("pieniadz", got.pieniadz),
            ("zywnosc", got.zywnosc),
            ("nauka", got.nauka),
            ("luksus", got.luksus),
            ("kultura", got.kultura),
            ("zadowolenie", got.zadowolenie),
            ("zywnoscBrutto", got.zywnosc_brutto),
            ("handelBrutto", got.handel_brutto),
            ("pracaTerenu", got.praca_terenu),
            ("pracaBudynkow", got.praca_budynkow),
            ("pieniadzZPracy", got.pieniadz_z_pracy),
            ("pieniadzBudynkow", got.pieniadz_budynkow),
            ("drewnoTerenu", got.drewno_terenu),
            ("kamienTerenu", got.kamien_terenu),
            ("glinaTerenu", got.glina_terenu),
            ("rudaTerenu", got.ruda_terenu),
            ("rudaZelazaTerenu", got.ruda_zelaza_terenu),
        ];
        assert_eq!(pairs.len(), 18, "18 pol CityYieldResult");
        for (name, value) in pairs {
            assert_num(value, &w[name], &format!("cityYieldPerTurn #{i} {name}"));
        }
    }
}

// ---- #22 corruptionRate --------------------------------------------------------------------

#[test]
fn corruption_rate_r4_matches_pin() {
    let vs = vectors_of("corruptionRate");
    assert!(!vs.is_empty());
    for (i, v) in vs.iter().enumerate() {
        let inp = &v["in"];
        let params = CorruptionParams {
            wspolczynnik_dystansu: parse_num(&inp["wspolczynnikDystansu"]),
            wspolczynnik_miast: parse_num(&inp["wspolczynnikMiast"]),
            cap: parse_num(&inp["cap"]),
        };
        let got = corruption_rate(
            parse_num(&inp["dystansOdStolicy"]),
            parse_num(&inp["liczbaWszystkichMiast"]),
            params,
        );
        assert_num(got, &v["out"], &format!("corruptionRate #{i}"));
    }
}

// ---- #3 buildTerrainYields (syntetyczne wiersze) -------------------------------------------

#[test]
fn build_terrain_yields_synthetic_matches_pin() {
    let vs = vectors_of("buildTerrainYieldsSynthetic");
    assert!(!vs.is_empty());
    for (i, v) in vs.iter().enumerate() {
        let rows = v["in"]["rows"].as_array().expect("rows").clone();
        let got: BTreeMap<&'static str, TileYield> = build_terrain_yields(&rows);
        let want = v["out"].as_object().expect("out obj");
        assert_eq!(
            got.len(),
            want.len(),
            "buildTerrainYields #{i} liczba kluczy"
        );
        for (key, w) in want {
            let g = got
                .get(key.as_str())
                .unwrap_or_else(|| panic!("buildTerrainYields #{i} brak klucza {key}"));
            assert_num(g.zywnosc, &w["zywnosc"], &format!("#{i} {key} zywnosc"));
            assert_num(g.praca, &w["praca"], &format!("#{i} {key} praca"));
            assert_num(g.handel, &w["handel"], &format!("#{i} {key} handel"));
            assert_num(g.drewno, &w["drewno"], &format!("#{i} {key} drewno"));
            assert_num(g.kamien, &w["kamien"], &format!("#{i} {key} kamien"));
            assert_num(g.glina, &w["glina"], &format!("#{i} {key} glina"));
            assert_num(g.ruda, &w["ruda"], &format!("#{i} {key} ruda"));
            assert_num(
                g.ruda_zelaza,
                &w["ruda_zelaza"],
                &format!("#{i} {key} ruda_zelaza"),
            );
        }
    }
}
