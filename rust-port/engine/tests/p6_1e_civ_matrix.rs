//! P6.1E - wektory z URUCHOMIONEGO weba: `civ-matrix.ts`, `civ-matrix-semantic.ts`,
//! `civ-ai-data.ts` (pin edb8fb56). Wektory: `tests/p6_1e_vectors/web-vectors.json`
//! (generator `gen-p61e-web-vectors.mjs` w katalogu runu R-RUSTPORT-P6-1E-CIV-DANE-MACIERZE-Q1).
//! Liczby sa w wektorach TEKSTEM (`String(x)` z JS, "-0" dla minus zera), bo serde_json bez
//! `float_roundtrip` myli ostatni bit; porownanie jest bit-w-bit (NaN == NaN).
//!
//! Scenariusze (`base`, `fallback`, `partial`) uruchamiaja ten sam kod weba na danych z
//! mutacjami (brak wiersza macierzy, brak parametru, nieznana formula...). Rust odtwarza
//! mutacje na wlasnych typach danych (`apply_ops`) i porownuje wyniki.

use std::sync::OnceLock;

use civ_engine::data::civilizations::{
    parse_civ_ai, parse_civ_params, parse_civs, parse_diplomacy, CivAiFile, CivsFile, Num,
    ParamDefsValue, PerNacjaItem, CIVS_JSON, CIV_AI_JSON, CIV_MATRIX_JSON, CIV_PARAMS_JSON,
    DIPLOMACY_JSON,
};
use civ_engine::domain::civ_matrix::ai_data::{
    civ_ai_aggression_norm, civ_ai_profil_mapy, civ_ai_profile_for, civ_ai_profile_for_typ,
    civ_excel_name_from_typ, civ_params_for, diplomacy_per_nacja_for_typ, diplomacy_per_nacja_row,
    is_kopia_typu_obronna, nastawienie_bazowe_zaufanie_delta, resolve_archetype_aggression,
    resolve_archetype_trade, CivAiProfile, CivAiSources, CivGameData,
};
use civ_engine::domain::civ_matrix::semantic::{
    build_civ_matrix_semantic_profile, build_civ_matrix_semantic_snapshot,
    civ_matrix_consumer_evidence, civ_matrix_consumer_status, civ_matrix_neutral_band,
    civ_matrix_semantic_baseline, civ_matrix_semantic_civilizations,
    civ_matrix_semantic_parameter_ids, civ_matrix_semantic_polarity, classify_civ_matrix_cell,
    median, status_allows_default_visibility, ConsumerStatus, SemanticCell, SemanticCellInput,
    SemanticContext,
};
use civ_engine::domain::civ_matrix::{
    apply_civ_matrix_param, civ_matrix_apply_proc, civ_matrix_param,
    civ_matrix_param_at_difficulty, civ_matrix_param_def, civ_matrix_params_at_difficulty,
    civ_matrix_proc_sum, load_civ_matrix, CivMatrixData, CivMatrixDifficulty,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1e_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn fnv1a64(bytes: &[u8]) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in bytes {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

/// Liczba z wektora zapisana tekstem JS (`String(x)`).
fn num(value: &Value) -> f64 {
    value
        .as_str()
        .unwrap_or_else(|| panic!("liczba jako tekst: {value}"))
        .parse::<f64>()
        .unwrap_or_else(|e| panic!("liczba {value}: {e}"))
}

fn opt_num(value: &Value) -> Option<f64> {
    if value.is_null() {
        None
    } else {
        Some(num(value))
    }
}

fn eq_bits(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}

fn eq_opt(a: Option<f64>, b: Option<f64>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(a), Some(b)) => eq_bits(a, b),
        _ => false,
    }
}

fn arr(value: &Value) -> &Vec<Value> {
    value
        .as_array()
        .unwrap_or_else(|| panic!("tablica: {value}"))
}

fn st(value: &Value) -> &str {
    value.as_str().unwrap_or_else(|| panic!("tekst: {value}"))
}

fn strings(value: &Value) -> Vec<String> {
    arr(value).iter().map(|v| st(v).to_owned()).collect()
}

fn text(i: &Value) -> &'static str {
    let idx = i.as_u64().expect("indeks tekstu") as usize;
    st(&web()["texts"][idx])
}

fn status_at(i: &Value) -> ConsumerStatus {
    let name = st(
        &web()["scenarios"][0]["semantic"]["allStatuses"]["statuses"]
            [i.as_u64().expect("idx") as usize],
    );
    ConsumerStatus::parse(name).unwrap_or_else(|| panic!("status {name}"))
}

// ---------------------------------------------------------------------------
// scenariusze
// ---------------------------------------------------------------------------

struct Scenario {
    id: String,
    data: CivMatrixData,
    civs: CivsFile,
    civ_ai_raw: CivAiFile,
    per_nacja: Vec<PerNacjaItem>,
    vec: &'static Value,
}

impl Scenario {
    fn sources(&self) -> CivAiSources<'_> {
        CivAiSources {
            matrix: &self.data,
            civs: &self.civs,
            civ_ai_raw: &self.civ_ai_raw,
            per_nacja: &self.per_nacja,
        }
    }
}

fn op_num(op: &Value) -> f64 {
    num(&op["value"]["n"])
}

fn apply_ops(sc: &mut Scenario, ops: &Value) {
    for op in arr(ops) {
        let t = st(&op["t"]);
        match t {
            "matrix.deleteRow" => {
                let id = st(&op["ikonaId"]);
                let i = sc
                    .data
                    .file
                    .cywilizacje
                    .iter()
                    .position(|c| c.ikona_id == id)
                    .expect("wiersz");
                sc.data.file.cywilizacje.remove(i);
            }
            "matrix.deleteParam" => {
                let row = sc
                    .data
                    .file
                    .cywilizacje
                    .iter_mut()
                    .find(|c| c.ikona_id == st(&op["ikonaId"]))
                    .expect("wiersz");
                assert!(row.params.remove(st(&op["param"])).is_some());
            }
            "matrix.setValue" => {
                let row = sc
                    .data
                    .file
                    .cywilizacje
                    .iter_mut()
                    .find(|c| c.ikona_id == st(&op["ikonaId"]))
                    .expect("wiersz");
                row.params
                    .insert(st(&op["param"]).to_owned(), Num::Float(op_num(op)));
            }
            "matrix.setFormula" => {
                sc.data
                    .file
                    .param_defs
                    .get_mut(st(&op["param"]))
                    .expect("def")
                    .formula = st(&op["formula"]).to_owned();
            }
            "matrix.addParamDef" => {
                let def = &op["def"];
                sc.data.file.param_defs.insert(
                    st(&op["param"]).to_owned(),
                    ParamDefsValue {
                        domena: st(&def["domena"]).to_owned(),
                        jednostka: st(&def["jednostka"]).to_owned(),
                        modul: st(&def["modul"]).to_owned(),
                        formula: st(&def["formula"]).to_owned(),
                    },
                );
                sc.data.param_ids.push(st(&op["param"]).to_owned());
            }
            "matrix.setDefault" => {
                sc.data
                    .file
                    .defaults
                    .insert(st(&op["param"]).to_owned(), Num::Float(op_num(op)));
            }
            "matrix.setVersion" => sc.data.file.meta.version = st(&op["value"]).to_owned(),
            "civAi.set" => {
                let row = sc
                    .civ_ai_raw
                    .cywilizacje
                    .iter_mut()
                    .find(|c| c.cywilizacja == st(&op["cyw"]))
                    .expect("civ-ai");
                match st(&op["field"]) {
                    "agresywnosc" => row.agresywnosc = op_num(op) as i64,
                    "profilMapy" => row.profil_mapy = st(&op["value"]).to_owned(),
                    other => panic!("pole civ-ai {other}"),
                }
            }
            "civAi.delete" => {
                let i = sc
                    .civ_ai_raw
                    .cywilizacje
                    .iter()
                    .position(|c| c.cywilizacja == st(&op["cyw"]))
                    .expect("civ-ai");
                sc.civ_ai_raw.cywilizacje.remove(i);
            }
            "diplo.set" => {
                let row = sc
                    .per_nacja
                    .iter_mut()
                    .find(|c| c.cywilizacja == st(&op["cyw"]))
                    .expect("perNacja");
                match st(&op["field"]) {
                    "nastawienieBazowe" => row.nastawienie_bazowe = op_num(op) as i64,
                    "otwartoscHandel" => row.otwartosc_handel = op_num(op) as i64,
                    other => panic!("pole perNacja {other}"),
                }
            }
            "diplo.delete" => {
                let i = sc
                    .per_nacja
                    .iter()
                    .position(|c| c.cywilizacja == st(&op["cyw"]))
                    .expect("perNacja");
                sc.per_nacja.remove(i);
            }
            other => panic!("nieznana operacja {other}"),
        }
    }
}

fn scenarios() -> &'static Vec<Scenario> {
    static ALL: OnceLock<Vec<Scenario>> = OnceLock::new();
    ALL.get_or_init(|| {
        arr(&web()["scenarios"])
            .iter()
            .map(|vec| {
                let mut sc = Scenario {
                    id: st(&vec["id"]).to_owned(),
                    data: CivMatrixData::from_json(CIV_MATRIX_JSON).expect("macierz"),
                    civs: parse_civs().expect("civs"),
                    civ_ai_raw: parse_civ_ai().expect("civ-ai"),
                    per_nacja: parse_diplomacy().expect("diplomacy").per_nacja,
                    vec,
                };
                apply_ops(&mut sc, &vec["ops"]);
                sc
            })
            .collect()
    })
}

fn diff_of(name: &str) -> CivMatrixDifficulty {
    CivMatrixDifficulty::parse(name).unwrap_or_else(|| panic!("trudnosc {name}"))
}

const DIFF_NAMES: [&str; 3] = ["easy", "normal", "hard"];

// ---------------------------------------------------------------------------
// dane == dane weba
// ---------------------------------------------------------------------------

#[test]
fn data_files_are_byte_identical_to_web_pin() {
    let fnv = &web()["dataFnv"];
    assert_eq!(st(&fnv["civMatrix"]), fnv1a64(CIV_MATRIX_JSON.as_bytes()));
    assert_eq!(st(&fnv["civs"]), fnv1a64(CIVS_JSON.as_bytes()));
    assert_eq!(st(&fnv["civAi"]), fnv1a64(CIV_AI_JSON.as_bytes()));
    assert_eq!(st(&fnv["civParams"]), fnv1a64(CIV_PARAMS_JSON.as_bytes()));
    assert_eq!(st(&fnv["diplomacy"]), fnv1a64(DIPLOMACY_JSON.as_bytes()));
    // scenariusz bazowy == dane silnika
    let base = &scenarios()[0];
    assert_eq!(base.id, "base");
    assert_eq!(
        st(&base.vec["dataFnv"]["matrix"]),
        fnv1a64(CIV_MATRIX_JSON.as_bytes())
    );
    assert_eq!(
        st(&base.vec["dataFnv"]["civAi"]),
        fnv1a64(CIV_AI_JSON.as_bytes())
    );
    assert_eq!(
        st(&base.vec["dataFnv"]["diplomacy"]),
        fnv1a64(DIPLOMACY_JSON.as_bytes())
    );
}

#[test]
fn param_order_and_rows_match_web_for_every_scenario() {
    for sc in scenarios() {
        assert_eq!(sc.data.param_ids, strings(&sc.vec["paramIds"]), "{}", sc.id);
        let rows: Vec<(String, String, String)> = sc
            .data
            .file
            .cywilizacje
            .iter()
            .map(|c| {
                (
                    c.ikona_id.clone(),
                    c.typ_cywilizacji.clone(),
                    c.cywilizacja.clone(),
                )
            })
            .collect();
        let expected: Vec<(String, String, String)> = arr(&sc.vec["rows"])
            .iter()
            .map(|r| {
                (
                    st(&r["ikonaId"]).to_owned(),
                    st(&r["typ"]).to_owned(),
                    st(&r["name"]).to_owned(),
                )
            })
            .collect();
        assert_eq!(rows, expected, "{}", sc.id);
    }
    // wbudowana macierz == scenariusz bazowy
    assert_eq!(load_civ_matrix().param_ids, scenarios()[0].data.param_ids);
    assert_eq!(load_civ_matrix().file, scenarios()[0].data.file);
}

#[test]
fn every_matrix_cell_parses_exactly_like_js() {
    // Wartosci komorek macierzy z pliku (serde_json bez float_roundtrip) == wartosci weba bit-w-bit.
    let base = &scenarios()[0];
    let keys = arr(&base.vec["keys"]);
    let params = arr(&base.vec["allParams"]);
    let table = arr(&base.vec["param"]);
    for (ki, key) in keys.iter().enumerate() {
        for (pi, param) in params.iter().enumerate() {
            let got = civ_matrix_param(&base.data.file, st(key), st(param));
            assert!(
                eq_bits(got, num(&table[ki][pi])),
                "{} {}",
                st(key),
                st(param)
            );
        }
    }
}

// ---------------------------------------------------------------------------
// civ-matrix.ts
// ---------------------------------------------------------------------------

#[test]
fn civ_matrix_param_matches_web() {
    for sc in scenarios() {
        let keys = arr(&sc.vec["keys"]);
        let params = arr(&sc.vec["allParams"]);
        let table = arr(&sc.vec["param"]);
        assert_eq!(table.len(), keys.len());
        let mut count = 0;
        for (ki, key) in keys.iter().enumerate() {
            for (pi, param) in params.iter().enumerate() {
                let got = civ_matrix_param(&sc.data.file, st(key), st(param));
                assert!(
                    eq_bits(got, num(&table[ki][pi])),
                    "{} key={:?} param={}: {} != {}",
                    sc.id,
                    st(key),
                    st(param),
                    got,
                    st(&table[ki][pi])
                );
                count += 1;
            }
        }
        assert!(count > 3000, "{}: {count}", sc.id);
    }
}

#[test]
fn civ_matrix_param_def_matches_web() {
    for sc in scenarios() {
        let params = arr(&sc.vec["allParams"]);
        for (pi, param) in params.iter().enumerate() {
            let got = civ_matrix_param_def(&sc.data.file, st(param));
            let expected = &sc.vec["paramDef"][pi];
            match got {
                None => assert!(expected.is_null(), "{} {}", sc.id, st(param)),
                Some(def) => {
                    let e = arr(expected);
                    assert_eq!(
                        [
                            def.domena.as_str(),
                            def.jednostka.as_str(),
                            def.modul.as_str(),
                            def.formula.as_str()
                        ],
                        [st(&e[0]), st(&e[1]), st(&e[2]), st(&e[3])],
                        "{} {}",
                        sc.id,
                        st(param)
                    );
                }
            }
        }
    }
}

#[test]
fn civ_matrix_param_at_difficulty_matches_web() {
    for sc in scenarios() {
        let keys = arr(&sc.vec["diffKeys"]);
        let params = arr(&sc.vec["allParams"]);
        for (di, name) in DIFF_NAMES.iter().enumerate() {
            let table = &sc.vec["atDifficulty"][di];
            for (ki, key) in keys.iter().enumerate() {
                for (pi, param) in params.iter().enumerate() {
                    let got = civ_matrix_param_at_difficulty(
                        &sc.data.file,
                        st(key),
                        st(param),
                        diff_of(name),
                    );
                    assert!(
                        eq_bits(got, num(&table[ki][pi])),
                        "{} {name} {} {}: {got} != {}",
                        sc.id,
                        st(key),
                        st(param),
                        st(&table[ki][pi])
                    );
                }
            }
        }
        // argument domyslny weba = 'normal'
        for (ki, key) in keys.iter().enumerate() {
            for (pi, param) in params.iter().enumerate() {
                let got = civ_matrix_param_at_difficulty(
                    &sc.data.file,
                    st(key),
                    st(param),
                    CivMatrixDifficulty::default(),
                );
                assert!(eq_bits(got, num(&sc.vec["atDifficultyDefault"][ki][pi])));
            }
        }
    }
}

#[test]
fn civ_matrix_params_at_difficulty_matches_web_order_and_values() {
    for sc in scenarios() {
        for (di, name) in DIFF_NAMES.iter().enumerate() {
            for (ki, key) in ["grecy", "rzymianie", "nope"].iter().enumerate() {
                let expected = &sc.vec["paramsAtDifficulty"][di][ki];
                let got = civ_matrix_params_at_difficulty(&sc.data, key, diff_of(name));
                let keys: Vec<&str> = got.iter().map(|(k, _)| k.as_str()).collect();
                let want_keys = strings(&expected["keys"]);
                assert_eq!(
                    keys,
                    want_keys.iter().map(String::as_str).collect::<Vec<_>>(),
                    "{} {name} {key}",
                    sc.id
                );
                for (i, (k, v)) in got.iter().enumerate() {
                    assert!(
                        eq_bits(*v, num(&expected["values"][i])),
                        "{} {name} {key} {k}",
                        sc.id
                    );
                }
            }
        }
    }
}

#[test]
fn scale_parameters_are_clamped_and_shifted_only_for_skala() {
    // Ksztalt reguly (nie wartosci): Easy <= Normal <= Hard dla `skala`, rowne dla pozostalych.
    let sc = &scenarios()[0];
    let mut scaled = 0;
    for (param, def) in &sc.data.file.param_defs {
        for row in &sc.data.file.cywilizacje {
            let easy = civ_matrix_param_at_difficulty(
                &sc.data.file,
                &row.ikona_id,
                param,
                CivMatrixDifficulty::Easy,
            );
            let normal = civ_matrix_param_at_difficulty(
                &sc.data.file,
                &row.ikona_id,
                param,
                CivMatrixDifficulty::Normal,
            );
            let hard = civ_matrix_param_at_difficulty(
                &sc.data.file,
                &row.ikona_id,
                param,
                CivMatrixDifficulty::Hard,
            );
            if def.formula == "skala" {
                scaled += 1;
                assert!(easy <= normal && normal <= hard, "{param}");
            } else {
                assert!(eq_bits(easy, normal) && eq_bits(normal, hard), "{param}");
            }
        }
    }
    assert!(scaled > 0);
}

#[test]
fn apply_civ_matrix_param_matches_web() {
    for sc in scenarios() {
        let bases = arr(&sc.vec["applyBases"]);
        let keys = arr(&sc.vec["applyKeys"]);
        let params = arr(&sc.vec["allParams"]);
        for (bi, base) in bases.iter().enumerate() {
            for (ki, key) in keys.iter().enumerate() {
                for (pi, param) in params.iter().enumerate() {
                    let got = apply_civ_matrix_param(&sc.data.file, num(base), st(key), st(param));
                    assert!(
                        eq_bits(got, num(&sc.vec["apply"][bi][ki][pi])),
                        "{} base={} {} {}: {got}",
                        sc.id,
                        st(base),
                        st(key),
                        st(param)
                    );
                }
            }
        }
    }
}

#[test]
fn proc_sum_and_apply_proc_match_web() {
    for sc in scenarios() {
        let groups = arr(&sc.vec["procGroups"]);
        let keys = arr(&sc.vec["applyKeys"]);
        let bases = arr(&sc.vec["applyProcBases"]);
        for (gi, group) in groups.iter().enumerate() {
            let ids = strings(group);
            let ids_ref: Vec<&str> = ids.iter().map(String::as_str).collect();
            for (ki, key) in keys.iter().enumerate() {
                let sum = civ_matrix_proc_sum(&sc.data.file, st(key), &ids_ref);
                assert!(
                    eq_bits(sum, num(&sc.vec["procSum"][gi][ki])),
                    "{} g{gi} {}",
                    sc.id,
                    st(key)
                );
                for (bi, base) in bases.iter().enumerate() {
                    let got = civ_matrix_apply_proc(&sc.data.file, num(base), st(key), &ids_ref);
                    assert!(
                        eq_bits(got, num(&sc.vec["applyProc"][gi][bi][ki])),
                        "{} g{gi} b{bi} {}",
                        sc.id,
                        st(key)
                    );
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// civ-matrix-semantic.ts
// ---------------------------------------------------------------------------

fn label_index(cell: &SemanticCell) -> usize {
    ["POZYTYWNY", "NEGATYWNY", "NEUTRALNY"]
        .iter()
        .position(|n| *n == cell.label.name())
        .expect("etykieta")
}

fn check_cell_arr(cell: &SemanticCell, enc: &Value, ctx: &str) {
    let e = arr(enc);
    assert!(eq_opt(cell.raw_value, opt_num(&e[0])), "{ctx} raw");
    assert!(
        eq_opt(cell.baseline_value, opt_num(&e[1])),
        "{ctx} baseline"
    );
    assert!(eq_opt(cell.min_value, opt_num(&e[2])), "{ctx} min");
    assert!(eq_opt(cell.max_value, opt_num(&e[3])), "{ctx} max");
    assert!(
        eq_opt(cell.max_distance, opt_num(&e[4])),
        "{ctx} maxDistance"
    );
    assert!(
        eq_opt(cell.corrected_delta, opt_num(&e[5])),
        "{ctx} correctedDelta"
    );
    assert_eq!(
        label_index(cell) as u64,
        e[6].as_u64().expect("label"),
        "{ctx} label"
    );
    assert!(
        eq_bits(cell.signed_intensity, num(&e[7])),
        "{ctx} signedIntensity {}",
        cell.signed_intensity
    );
    assert_eq!(cell.consumer_status, status_at(&e[8]), "{ctx} status");
    assert_eq!(cell.status_reason_pl, text(&e[9]), "{ctx} statusReason");
    assert_eq!(cell.explanation_pl, text(&e[10]), "{ctx} explanation");
    assert_eq!(
        cell.difficulty_behavior_pl,
        text(&e[11]),
        "{ctx} difficulty"
    );
    assert_eq!(cell.source, st(&e[12]), "{ctx} source");
}

#[test]
fn consumer_status_polarity_band_baseline_match_web_per_parameter() {
    for sc in scenarios() {
        let ctx = SemanticContext::new(&sc.data);
        let sem = &sc.vec["semantic"];
        let ids = strings(&sem["paramIds"]);
        assert_eq!(
            civ_matrix_semantic_parameter_ids(&ctx),
            ids.as_slice(),
            "{}",
            sc.id
        );
        let civs: Vec<&str> = civ_matrix_semantic_civilizations(&ctx)
            .iter()
            .map(|c| c.ikona_id.as_str())
            .collect();
        assert_eq!(
            civs,
            strings(&sem["civs"])
                .iter()
                .map(String::as_str)
                .collect::<Vec<_>>()
        );
        for (i, id) in ids.iter().enumerate() {
            let status = civ_matrix_consumer_status(id);
            assert_eq!(
                status.name(),
                st(&sem["status"][i]),
                "{} status {id}",
                sc.id
            );
            let evidence = civ_matrix_consumer_evidence(id);
            let want: Vec<&str> = arr(&sem["evidence"][i]).iter().map(text).collect();
            assert_eq!(
                evidence.iter().map(String::as_str).collect::<Vec<_>>(),
                want,
                "{id}"
            );
            assert_eq!(
                civ_matrix_semantic_polarity(&ctx, id).name(),
                st(&sem["polarity"][i]),
                "{id}"
            );
            let def = sc.data.file.param_defs.get(id).expect("def");
            let band = civ_matrix_neutral_band(def);
            let b = arr(&sem["band"][i]);
            assert_eq!(band.policy_id, st(&b[0]));
            assert!(eq_bits(band.tolerance, num(&b[1])), "{id} tolerancja");
            assert_eq!(band.key, st(&b[2]));
            let baseline = civ_matrix_semantic_baseline(&ctx, id);
            assert!(
                eq_opt(baseline, opt_num(&sem["baseline"][i])),
                "{} baseline {id}",
                sc.id
            );
        }
        for (i, id) in ["__nope__", "zz_nowy_parametr"].iter().enumerate() {
            assert!(eq_opt(
                civ_matrix_semantic_baseline(&ctx, id),
                opt_num(&sem["baselineExtra"][i])
            ));
        }
        // stale per-parametr komorek (domena/jednostka/formula) == definicje
        for (i, id) in ids.iter().enumerate() {
            let def = sc.data.file.param_defs.get(id).expect("def");
            let pp = &sem["perParam"][i];
            assert_eq!(def.domena, st(&pp["domain"]));
            assert_eq!(def.jednostka, st(&pp["unit"]));
            assert_eq!(def.formula, st(&pp["formula"]));
        }
    }
}

#[test]
fn median_matches_web() {
    let m = &web()["scenarios"][0]["semantic"]["median"];
    for (i, input) in arr(&m["in"]).iter().enumerate() {
        let values: Vec<f64> = arr(input).iter().map(num).collect();
        assert!(eq_bits(median(&values), num(&m["out"][i])), "mediana #{i}");
    }
}

#[test]
fn snapshot_and_profiles_match_web() {
    for sc in scenarios() {
        let ctx = SemanticContext::new(&sc.data);
        let sem = &sc.vec["semantic"];
        let snapshot = build_civ_matrix_semantic_snapshot(&ctx);
        let h = &sem["snapshotHeader"];
        assert_eq!(snapshot.version, st(&h["version"]));
        assert_eq!(snapshot.difficulty, st(&h["difficulty"]));
        assert_eq!(
            snapshot.parameter_count as u64,
            h["parameterCount"].as_u64().unwrap()
        );
        assert_eq!(
            snapshot.civilization_count as u64,
            h["civilizationCount"].as_u64().unwrap()
        );
        assert_eq!(
            snapshot.expected_cell_count as u64,
            h["expectedCellCount"].as_u64().unwrap()
        );
        assert_eq!(snapshot.cells.len() as u64, h["cellsLen"].as_u64().unwrap());
        assert_eq!(
            snapshot.profiles.len() as u64,
            h["profilesLen"].as_u64().unwrap()
        );
        let mut flat = 0;
        for (pi, profile) in snapshot.profiles.iter().enumerate() {
            let e = &sem["profiles"][pi];
            assert_eq!(profile.civilization_id, st(&e["civilizationId"]));
            assert_eq!(profile.civilization_name, st(&e["civilizationName"]));
            assert_eq!(profile.difficulty, st(&e["difficulty"]));
            assert_eq!(profile.baseline_kind, st(&e["baselineKind"]));
            assert_eq!(
                profile.parameter_count as u64,
                e["parameterCount"].as_u64().unwrap()
            );
            assert_eq!(
                profile.active_count as u64,
                e["activeCount"].as_u64().unwrap()
            );
            assert_eq!(
                profile.inactive_count as u64,
                e["inactiveCount"].as_u64().unwrap()
            );
            assert_eq!(profile.blocked_reason_pl.is_some(), !e["blocked"].is_null());
            assert_eq!(profile.cells.len(), arr(&e["cells"]).len());
            for (ci, cell) in profile.cells.iter().enumerate() {
                let ctx_name = format!("{} {} #{ci}", sc.id, profile.civilization_id);
                check_cell_arr(cell, &e["cells"][ci], &ctx_name);
                assert_eq!(
                    cell.parameter_id, sc.data.param_ids[ci],
                    "kolejnosc komorek"
                );
                assert_eq!(cell.civilization_id, profile.civilization_id);
                assert_eq!(cell.baseline_kind, st(&sem["perParam"][ci]["baselineKind"]));
                assert_eq!(
                    cell.provenance.matrix_version,
                    st(&sem["provenance"]["matrixVersion"])
                );
                assert_eq!(
                    cell.provenance.semantic_version,
                    st(&sem["provenance"]["semanticVersion"])
                );
                // komorka migawki == komorka profilu (ta sama kolejnosc, civ-major)
                assert_eq!(&snapshot.cells[flat], cell);
                flat += 1;
            }
        }
        assert_eq!(flat, snapshot.cells.len());
    }
}

#[test]
fn profile_by_key_resolution_matches_web() {
    for sc in scenarios() {
        let ctx = SemanticContext::new(&sc.data);
        let sem = &sc.vec["semantic"];
        for (ki, key) in arr(&sem["profileKeys"]).iter().enumerate() {
            let e = &sem["profileByKey"][ki];
            let p = build_civ_matrix_semantic_profile(&ctx, st(key));
            let tag = format!("{} {:?}", sc.id, st(key));
            assert_eq!(p.civilization_id, st(&e["civilizationId"]), "{tag}");
            assert_eq!(p.civilization_name, st(&e["civilizationName"]), "{tag}");
            assert_eq!(
                p.parameter_count as u64,
                e["parameterCount"].as_u64().unwrap(),
                "{tag}"
            );
            assert_eq!(
                p.active_count as u64,
                e["activeCount"].as_u64().unwrap(),
                "{tag}"
            );
            assert_eq!(
                p.inactive_count as u64,
                e["inactiveCount"].as_u64().unwrap(),
                "{tag}"
            );
            assert_eq!(
                p.cells.len() as u64,
                e["cellsLen"].as_u64().unwrap(),
                "{tag}"
            );
            match (&p.blocked_reason_pl, e["blocked"].is_null()) {
                (None, true) => {}
                (Some(reason), false) => assert_eq!(reason, text(&e["blocked"]), "{tag}"),
                other => panic!("{tag}: blocked {other:?}"),
            }
            if let Some(first) = p.cells.first() {
                assert_full_cell(first, &e["first"], &tag);
            }
        }
    }
}

fn assert_full_cell(cell: &SemanticCell, e: &Value, tag: &str) {
    assert_eq!(cell.parameter_id, st(&e["parameterId"]), "{tag}");
    assert_eq!(cell.civilization_id, st(&e["civilizationId"]), "{tag}");
    assert_eq!(cell.civilization_name, st(&e["civilizationName"]), "{tag}");
    assert_eq!(cell.domain, st(&e["domain"]), "{tag}");
    assert_eq!(cell.unit, st(&e["unit"]), "{tag}");
    assert_eq!(cell.formula, st(&e["formula"]), "{tag}");
    assert!(eq_opt(cell.raw_value, opt_num(&e["raw"])), "{tag} raw");
    assert_eq!(cell.baseline_kind, st(&e["baselineKind"]), "{tag}");
    assert!(
        eq_opt(cell.baseline_value, opt_num(&e["baseline"])),
        "{tag} baseline"
    );
    assert!(eq_opt(cell.min_value, opt_num(&e["min"])), "{tag} min");
    assert!(eq_opt(cell.max_value, opt_num(&e["max"])), "{tag} max");
    assert!(
        eq_opt(cell.max_distance, opt_num(&e["maxDistance"])),
        "{tag} maxDistance"
    );
    assert!(
        eq_opt(cell.corrected_delta, opt_num(&e["correctedDelta"])),
        "{tag} correctedDelta"
    );
    assert_eq!(cell.polarity.name(), st(&e["polarity"]), "{tag}");
    assert_eq!(
        cell.neutral_band.policy_id,
        st(&e["band"]["policyId"]),
        "{tag}"
    );
    assert!(
        eq_bits(cell.neutral_band.tolerance, num(&e["band"]["tolerance"])),
        "{tag} tol"
    );
    assert_eq!(cell.neutral_band.key, st(&e["band"]["key"]), "{tag}");
    assert_eq!(cell.label.name(), st(&e["label"]), "{tag}");
    assert!(
        eq_bits(cell.signed_intensity, num(&e["signedIntensity"])),
        "{tag} intensity"
    );
    assert_eq!(cell.consumer_status.name(), st(&e["status"]), "{tag}");
    assert_eq!(cell.status_label_pl, text(&e["statusLabelPl"]), "{tag}");
    assert_eq!(cell.status_reason_pl, text(&e["statusReasonPl"]), "{tag}");
    assert_eq!(cell.explanation_pl, text(&e["explanationPl"]), "{tag}");
    assert_eq!(
        cell.difficulty_behavior_pl,
        text(&e["difficultyBehaviorPl"]),
        "{tag}"
    );
    assert_eq!(cell.source, st(&e["source"]), "{tag}");
    assert_eq!(
        cell.provenance.matrix_version,
        st(&e["matrixVersion"]),
        "{tag}"
    );
    assert_eq!(
        cell.provenance.semantic_version,
        st(&e["semanticVersion"]),
        "{tag}"
    );
    let ev: Vec<&str> = arr(&e["evidence"]).iter().map(text).collect();
    assert_eq!(
        cell.provenance
            .consumer_evidence
            .iter()
            .map(String::as_str)
            .collect::<Vec<_>>(),
        ev,
        "{tag}"
    );
}

#[test]
fn every_status_for_every_parameter_matches_web_texts() {
    for sc in scenarios() {
        let ctx = SemanticContext::new(&sc.data);
        let all = &sc.vec["semantic"]["allStatuses"];
        let statuses = strings(&all["statuses"]);
        for (pi, param) in arr(&all["params"]).iter().enumerate() {
            for (si, status) in statuses.iter().enumerate() {
                let cell = classify_civ_matrix_cell(
                    &ctx,
                    &SemanticCellInput {
                        parameter_id: st(param).to_owned(),
                        civilization_id: "grecy".to_owned(),
                        civilization_name: Some("Grecy".to_owned()),
                        raw_value: Some(3.0),
                        baseline_value: Some(2.0),
                        min_value: Some(0.0),
                        max_value: Some(5.0),
                        consumer_status: ConsumerStatus::parse(status),
                        source: None,
                    },
                );
                let e = arr(&all["cells"][pi][si]);
                let tag = format!("{} {} {status}", sc.id, st(param));
                assert_eq!(cell.consumer_status.name(), st(&e[0]), "{tag}");
                assert_eq!(cell.status_label_pl, text(&e[1]), "{tag}");
                assert_eq!(cell.status_reason_pl, text(&e[2]), "{tag}");
                assert_eq!(cell.explanation_pl, text(&e[3]), "{tag}");
                assert_eq!(cell.difficulty_behavior_pl, text(&e[4]), "{tag}");
                assert_eq!(cell.label.name(), st(&e[5]), "{tag}");
                assert!(eq_bits(cell.signed_intensity, num(&e[6])), "{tag}");
            }
        }
    }
}

#[test]
fn synthetic_cell_grid_matches_web() {
    let mut checked = 0;
    for sc in scenarios() {
        let ctx = SemanticContext::new(&sc.data);
        for case in arr(&sc.vec["semantic"]["grid"]) {
            let input = arr(&case["in"]);
            let tup: Vec<Option<f64>> = arr(&input[1]).iter().map(opt_num).collect();
            let cell = classify_civ_matrix_cell(
                &ctx,
                &SemanticCellInput {
                    parameter_id: st(&input[0]).to_owned(),
                    civilization_id: "x_civ".to_owned(),
                    civilization_name: input[3].as_str().map(str::to_owned),
                    raw_value: tup[0],
                    baseline_value: tup[1],
                    min_value: tup[2],
                    max_value: tup[3],
                    consumer_status: input[2].as_str().and_then(ConsumerStatus::parse),
                    source: input[4].as_str().map(str::to_owned),
                },
            );
            let e = arr(&case["out"]);
            let tag = format!("{} {:?}", sc.id, input);
            assert_eq!(cell.domain, st(&e[0]), "{tag}");
            assert_eq!(cell.unit, st(&e[1]), "{tag}");
            assert_eq!(cell.formula, st(&e[2]), "{tag}");
            assert!(eq_opt(cell.raw_value, opt_num(&e[3])), "{tag} raw");
            assert!(
                eq_opt(cell.baseline_value, opt_num(&e[4])),
                "{tag} baseline"
            );
            assert!(eq_opt(cell.min_value, opt_num(&e[5])), "{tag} min");
            assert!(eq_opt(cell.max_value, opt_num(&e[6])), "{tag} max");
            assert!(eq_opt(cell.max_distance, opt_num(&e[7])), "{tag} md");
            assert!(eq_opt(cell.corrected_delta, opt_num(&e[8])), "{tag} cd");
            assert_eq!(cell.polarity.name(), st(&e[9]), "{tag}");
            assert_eq!(cell.neutral_band.key, st(&e[10]), "{tag}");
            assert!(
                eq_bits(cell.neutral_band.tolerance, num(&e[11])),
                "{tag} tol"
            );
            assert_eq!(cell.label.name(), st(&e[12]), "{tag}");
            assert!(
                eq_bits(cell.signed_intensity, num(&e[13])),
                "{tag} si {}",
                cell.signed_intensity
            );
            assert_eq!(cell.consumer_status.name(), st(&e[14]), "{tag}");
            assert_eq!(cell.status_label_pl, text(&e[15]), "{tag}");
            assert_eq!(cell.status_reason_pl, text(&e[16]), "{tag}");
            assert_eq!(cell.explanation_pl, text(&e[17]), "{tag}");
            assert_eq!(cell.difficulty_behavior_pl, text(&e[18]), "{tag}");
            assert_eq!(cell.source, st(&e[19]), "{tag}");
            assert_eq!(cell.civilization_name, st(&e[20]), "{tag}");
            let ev: Vec<&str> = arr(&e[21]).iter().map(text).collect();
            assert_eq!(
                cell.provenance
                    .consumer_evidence
                    .iter()
                    .map(String::as_str)
                    .collect::<Vec<_>>(),
                ev,
                "{tag}"
            );
            checked += 1;
        }
    }
    assert!(checked > 2000, "{checked}");
}

#[test]
fn status_visibility_is_true_only_for_real_gameplay() {
    let vis = &web()["js"]["visibility"];
    assert_eq!(arr(&vis["statuses"]).len(), 8);
    for (i, name) in arr(&vis["statuses"]).iter().enumerate() {
        let name = st(name);
        let status = ConsumerStatus::parse(name).expect("status");
        assert_eq!(status.name(), name);
        // wektor z URUCHOMIONEGO weba (statusAllowsDefaultVisibility)
        let web_value = vis["out"][i].as_bool().expect("bool");
        assert_eq!(
            status_allows_default_visibility(status),
            web_value,
            "{name}"
        );
        assert_eq!(web_value, name == "REAL_GAMEPLAY");
    }
    assert!(ConsumerStatus::parse("NOPE").is_none());
}

// ---------------------------------------------------------------------------
// civ-ai-data.ts
// ---------------------------------------------------------------------------

struct DataVariant {
    civ_ai: Option<CivAiFile>,
}

fn data_variants(sc: &Scenario) -> Vec<DataVariant> {
    arr(&sc.vec["ai"]["dataVariants"])
        .iter()
        .map(|v| {
            if v["noCivAi"].as_bool().unwrap() {
                return DataVariant { civ_ai: None };
            }
            let mut file = sc.civ_ai_raw.clone();
            let del = strings(&v["civAiDelete"]);
            file.cywilizacje.retain(|c| !del.contains(&c.cywilizacja));
            DataVariant { civ_ai: Some(file) }
        })
        .collect()
}

fn game_data<'a>(
    variant: &'a DataVariant,
    params: &'a civ_engine::data::civilizations::CivParamsFile,
) -> CivGameData<'a> {
    CivGameData {
        civ_ai: variant.civ_ai.as_ref(),
        civ_params: Some(params),
    }
}

fn profile_matches(got: &Option<CivAiProfile>, enc: &Value, tag: &str) {
    match (got, enc.is_null()) {
        (None, true) => {}
        (Some(p), false) => {
            let e = arr(enc);
            assert_eq!(p.cywilizacja, st(&e[0]), "{tag}");
            for (i, v) in [
                p.agresywnosc,
                p.ekspansywnosc,
                p.priorytet_militarny,
                p.priorytet_ekonomia,
                p.priorytet_nauka,
                p.tolerancja_ryzyka,
                p.sklonnosc_do_podboju,
            ]
            .iter()
            .enumerate()
            {
                assert!(eq_bits(*v, num(&e[1 + i])), "{tag} pole {i}: {v}");
            }
            assert_eq!(p.profil_mapy, st(&e[8]), "{tag}");
            assert_eq!(p.uwagi.as_deref(), e[9].as_str(), "{tag}");
        }
        other => panic!("{tag}: {other:?}"),
    }
}

#[test]
fn ai_profiles_and_norms_match_web() {
    let params = parse_civ_params().expect("civ-params");
    for sc in scenarios() {
        let src = sc.sources();
        let ai = &sc.vec["ai"];
        let names = strings(&ai["names"]);
        for (vi, variant) in data_variants(sc).iter().enumerate() {
            let data = game_data(variant, &params);
            for (di, dname) in DIFF_NAMES.iter().enumerate() {
                let d = diff_of(dname);
                for (ni, name) in names.iter().enumerate() {
                    let tag = format!("{} v{vi} {dname} {name:?}", sc.id);
                    let norm = civ_ai_aggression_norm(&src, &data, name, d);
                    assert!(
                        eq_opt(norm, opt_num(&ai["aggressionNorm"][vi][di][ni])),
                        "{tag} norm {norm:?}"
                    );
                    let pm = civ_ai_profil_mapy(&src, &data, name, d);
                    assert_eq!(
                        pm.as_deref(),
                        ai["profilMapy"][vi][di][ni].as_str(),
                        "{tag} profilMapy"
                    );
                    let profile = civ_ai_profile_for(&src, &data, name, d);
                    profile_matches(
                        &profile,
                        &ai["profileFor"][vi][di][ni],
                        &format!("{tag} profileFor"),
                    );
                }
            }
            for (ni, name) in names.iter().enumerate() {
                let tag = format!("{} v{vi} {name:?}", sc.id);
                assert_eq!(
                    is_kopia_typu_obronna(&src, &data, name),
                    ai["isKopia"][vi][ni].as_bool().unwrap(),
                    "{tag} isKopia"
                );
            }
        }
    }
}

#[test]
fn ai_params_and_diplomacy_rows_match_web() {
    let params = parse_civ_params().expect("civ-params");
    for sc in scenarios() {
        let src = sc.sources();
        let ai = &sc.vec["ai"];
        let names = strings(&ai["names"]);
        let variants = data_variants(sc);
        let data = game_data(&variants[0], &params);
        for (ni, name) in names.iter().enumerate() {
            let got = civ_params_for(&data, name);
            let e = &ai["civParamsFor"][ni];
            match (got, e.is_null()) {
                (None, true) => {}
                (Some(row), false) => {
                    assert_eq!(row.cywilizacja, st(&e[0]));
                    assert_eq!(row.preferowane_budynki, st(&e[1]));
                }
                other => panic!("civParamsFor {name:?}: {other:?}"),
            }
            // brak civParams w danych (web: `data.civParams?.cywilizacje?.find`)
            assert!(ai["civParamsForNoData"][ni].is_null());
            assert!(civ_params_for(&CivGameData::default(), name).is_none());
            let row = diplomacy_per_nacja_row(&src, name);
            let e = &ai["diploRow"][ni];
            match (row, e.is_null()) {
                (None, true) => {}
                (Some(r), false) => {
                    assert_eq!(r.cywilizacja, st(&e[0]));
                    assert!(eq_bits(r.sklonnosc_sojusze as f64, num(&e[1])));
                    assert!(eq_bits(r.lojalnosc as f64, num(&e[2])));
                    assert!(eq_bits(r.prog_wojny as f64, num(&e[3])));
                    assert!(eq_bits(r.pamietliwosc as f64, num(&e[4])));
                    assert!(eq_bits(r.otwartosc_handel as f64, num(&e[5])));
                    assert!(eq_bits(r.nastawienie_bazowe as f64, num(&e[6])));
                }
                other => panic!("diploRow {name:?}: {other:?}"),
            }
        }
    }
}

#[test]
fn ai_by_typ_resolvers_match_web() {
    let params = parse_civ_params().expect("civ-params");
    for sc in scenarios() {
        let src = sc.sources();
        let ai = &sc.vec["ai"];
        let typs = strings(&ai["typs"]);
        let variants = data_variants(sc);
        for (ti, typ) in typs.iter().enumerate() {
            let tag = format!("{} {typ:?}", sc.id);
            let name = civ_excel_name_from_typ(&src, typ);
            assert_eq!(
                name.as_deref(),
                ai["excelName"][ti].as_str(),
                "{tag} excelName"
            );
            let row = diplomacy_per_nacja_for_typ(&src, typ);
            let e = &ai["diploRowForTyp"][ti];
            match (row, e.is_null()) {
                (None, true) => {}
                (Some(r), false) => {
                    assert_eq!(r.cywilizacja, st(&e[0]), "{tag}");
                    assert!(eq_bits(r.nastawienie_bazowe as f64, num(&e[1])), "{tag}");
                }
                other => panic!("{tag}: {other:?}"),
            }
            for (vi, variant) in variants.iter().enumerate() {
                let data = game_data(variant, &params);
                for (di, dname) in DIFF_NAMES.iter().enumerate() {
                    let got = civ_ai_profile_for_typ(&src, &data, typ, diff_of(dname));
                    profile_matches(
                        &got,
                        &ai["profileForTyp"][vi][di][ti],
                        &format!("{tag} v{vi} {dname} forTyp"),
                    );
                }
            }
            // domyslna trudnosc = normal
            assert!(eq_bits(
                resolve_archetype_aggression(&src, typ, 0.37, None, CivMatrixDifficulty::default()),
                num(&ai["resolveAggressionDefaultDiff"][ti])
            ));
            assert!(eq_bits(
                resolve_archetype_trade(&src, typ, 0.42, CivMatrixDifficulty::default()),
                num(&ai["resolveTradeDefaultDiff"][ti])
            ));
            assert!(eq_bits(
                nastawienie_bazowe_zaufanie_delta(&src, typ, None, CivMatrixDifficulty::default()),
                num(&ai["nastawienieDefault"][ti])
            ));
        }
        // resolveArchetypeAggression: fallback x (3 warianty data + brak data) x trudnosc
        let fallbacks = arr(&ai["fallbackAgg"]);
        for (fi, fb) in fallbacks.iter().enumerate() {
            for di_data in 0..=variants.len() {
                for (di, dname) in DIFF_NAMES.iter().enumerate() {
                    for (ti, typ) in typs.iter().enumerate() {
                        let got = if di_data < variants.len() {
                            let data = game_data(&variants[di_data], &params);
                            resolve_archetype_aggression(
                                &src,
                                typ,
                                num(fb),
                                Some(&data),
                                diff_of(dname),
                            )
                        } else {
                            resolve_archetype_aggression(&src, typ, num(fb), None, diff_of(dname))
                        };
                        assert!(
                            eq_bits(got, num(&ai["resolveAggression"][fi][di_data][di][ti])),
                            "{} aggression fb={} data={di_data} {dname} {typ:?}: {got}",
                            sc.id,
                            st(fb)
                        );
                    }
                }
            }
        }
        for (fi, fb) in arr(&ai["fallbackTrade"]).iter().enumerate() {
            for (di, dname) in DIFF_NAMES.iter().enumerate() {
                for (ti, typ) in typs.iter().enumerate() {
                    let got = resolve_archetype_trade(&src, typ, num(fb), diff_of(dname));
                    assert!(
                        eq_bits(got, num(&ai["resolveTrade"][fi][di][ti])),
                        "{} trade {dname} {typ:?}: {got}",
                        sc.id
                    );
                }
            }
        }
        for (bi, base) in arr(&ai["baseTotals"]).iter().enumerate() {
            let base_total = opt_num(base);
            for (di, dname) in DIFF_NAMES.iter().enumerate() {
                for (ti, typ) in typs.iter().enumerate() {
                    let got =
                        nastawienie_bazowe_zaufanie_delta(&src, typ, base_total, diff_of(dname));
                    assert!(
                        eq_bits(got, num(&ai["nastawienie"][bi][di][ti])),
                        "{} nastawienie base={base} {dname} {typ:?}: {got}",
                        sc.id
                    );
                }
            }
        }
    }
}

#[test]
fn ai_fallback_branches_are_actually_exercised() {
    // Dowod pokrycia: scenariusz `fallback` usuwa wiersze macierzy, wiec profil Grekow / Egiptu
    // pochodzi z civ-ai.json, a nie z macierzy; scenariusz `base` odwrotnie.
    let params = parse_civ_params().expect("civ-params");
    let base = &scenarios()[0];
    let fallback = scenarios()
        .iter()
        .find(|s| s.id == "fallback")
        .expect("fallback");
    let variants = data_variants(fallback);
    let data = game_data(&variants[0], &params);
    let legacy_only = civ_ai_profile_for(
        &fallback.sources(),
        &data,
        "Zulusi",
        CivMatrixDifficulty::Normal,
    )
    .expect("zulusi");
    assert_eq!(
        legacy_only.profil_mapy, "  kopia_typu_obronna \t",
        "wiersz zwracany wprost, bez trim"
    );
    assert_eq!(
        civ_ai_profil_mapy(
            &fallback.sources(),
            &data,
            "Zulusi",
            CivMatrixDifficulty::Normal
        )
        .as_deref(),
        Some("kopia_typu_obronna"),
        "trim w galezi legacy"
    );
    assert_eq!(
        civ_ai_profil_mapy(
            &fallback.sources(),
            &data,
            "Grecy",
            CivMatrixDifficulty::Normal
        ),
        None,
        "pusty profilMapy po trim => undefined"
    );
    let variants = data_variants(base);
    let data = game_data(&variants[0], &params);
    let from_matrix = civ_ai_profile_for(
        &base.sources(),
        &data,
        "Zulusi",
        CivMatrixDifficulty::Normal,
    )
    .expect("zulusi");
    assert_ne!(from_matrix.profil_mapy, legacy_only.profil_mapy);
}
