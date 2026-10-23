//! P6.M05A - tabele i stale: testy KSZTALTU tabeli `data/derived/mapgen-relief-a.json` (bez pinow
//! wartosci: zmiana liczby balansu nie wymaga zmiany testow ksztaltu) oraz zgodnosc stalych,
//! tabel per tier, capow i `minLandHexesForReliefCell` z wektorami z URUCHOMIONEGO weba.

#[path = "p6_m05a_vectors/common.rs"]
mod common;

use civ_engine::data::derived::{
    mapgen_relief_a, parse_mapgen_relief_a, MapgenReliefAFile, StartValue, TierTriple,
    MAPGEN_RELIEF_A_JSON,
};
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::relief::{
    continent_center_square_size, copper_coverage_cell_size, deprecated_min_highlands_copper_cell,
    deprecated_min_mountains_iron_cell, fair_play_resource_cell_size, forest_coverage_cell_size,
    forest_overlay_cap_frac, forest_share_of_dry_land, iron_coverage_cell_size,
    is_deposit_protected_from_overflow_cap, is_forest_eligible_terrain,
    map_gen_relief_overflow_cap_frac, min_highlands_copper_cell, min_land_hexes_for_fair_play_cell,
    min_land_hexes_for_relief_cell, min_mountains_iron_cell, min_river_sources_per_water_cell,
    relief_bonus_cap_highland, relief_bonus_cap_mountain, relief_coverage_cell_size,
    relief_overflow_cap_mult, relief_spread_cap_highland, relief_spread_cap_mountain,
    resolve_overflow_cap_frac, water_coverage_cell_size,
};
use civ_engine::domain::mapgen::terrain_class::TerrainHex;
use common::{assert_f64, cases, fv, i, s, stat, terrain_from_code, tier_from_web, web};

#[test]
fn table_parses_with_deny_unknown_fields() {
    assert_eq!(&parse_mapgen_relief_a().expect("parse"), mapgen_relief_a());
    let base: serde_json::Value = serde_json::from_str(MAPGEN_RELIEF_A_JSON).unwrap();
    let mut v = base.clone();
    v["nieznane_pole"] = serde_json::json!(1);
    assert!(serde_json::from_value::<MapgenReliefAFile>(v).is_err());
    for group in [
        "kwadrat_centrum",
        "las",
        "limit_bonusu_reliefu",
        "rozrzut_reliefu",
        "minima_komorki",
        "rozmiary_komorek",
        "min_ladu_w_komorce",
        "pokrycie",
        "wymuszanie",
        "sufit_przepelnienia",
    ] {
        let mut v = base.clone();
        v[group]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<MapgenReliefAFile>(v).is_err(),
            "{group}: nieznane pole przeszlo"
        );
    }
}

/// Zbiera wszystkie liscie `{wartosc, zrodlo_web}` tabeli (rekurencyjnie).
fn leaves<'a>(
    v: &'a serde_json::Value,
    path: &str,
    out: &mut Vec<(String, &'a serde_json::Value)>,
) {
    if let serde_json::Value::Object(m) = v {
        if m.contains_key("wartosc") && m.contains_key("zrodlo_web") {
            out.push((path.to_string(), v));
            return;
        }
        for (k, c) in m {
            if k != "meta" {
                leaves(c, &format!("{path}/{k}"), out);
            }
        }
    }
}

#[test]
fn every_value_has_a_web_source_with_file_and_line() {
    let table: serde_json::Value = serde_json::from_str(MAPGEN_RELIEF_A_JSON).unwrap();
    let mut found = Vec::new();
    leaves(&table, "", &mut found);
    assert!(found.len() >= 50, "za malo wartosci: {}", found.len());
    let helpers = "gra/src/map/gen-helpers.ts:";
    let loader = "gra/src/data/map-gen-params-loader.ts:";
    for (path, leaf) in &found {
        let src = leaf["zrodlo_web"].as_str().expect("zrodlo_web");
        if let Some(rest) = src.strip_prefix(helpers) {
            let line: u32 = rest
                .parse()
                .unwrap_or_else(|_| panic!("{path}: numer linii w {src}"));
            // zakres M05A w gen-helpers.ts (1408-2365)
            assert!(
                (1408..=2365).contains(&line),
                "{path}: linia {line} poza zakresem M05A"
            );
        } else if let Some(rest) = src.strip_prefix(loader) {
            // fallback sufitu przepelnienia (map-gen-params-loader.ts:36-40)
            let line: u32 = rest
                .parse()
                .unwrap_or_else(|_| panic!("{path}: numer linii w {src}"));
            assert!((36..=40).contains(&line), "{path}: linia {line} loadera");
            assert!(
                path.contains("fallback"),
                "{path}: loader tylko dla fallbacku"
            );
        } else {
            panic!("{path}: zrodlo {src} bez pliku web");
        }
        assert!(
            leaf["wartosc"].is_number(),
            "{path}: wartosc nie jest liczba"
        );
    }
}

fn tier_values(t: &TierTriple<StartValue<f64>>) -> [f64; 3] {
    [t.low.wartosc, t.medium.wartosc, t.high.wartosc]
}

#[test]
fn values_have_sane_shape() {
    let t = mapgen_relief_a();
    let unit = |v: f64| (0.0..=1.0).contains(&v);
    assert!(t.kwadrat_centrum.rozmiar_boku.wartosc >= 1.0);
    for v in tier_values(&t.las.udzial_suchego_ladu) {
        assert!(unit(v));
    }
    assert!(unit(t.las.sufit_nakladki_ulamek.wartosc));
    // sufit nakladki lasu >= najwyzszy udzial (inaczej tiery lasu staja sie nierozroznialne)
    let shares = tier_values(&t.las.udzial_suchego_ladu);
    assert!(shares[0] <= shares[1] && shares[1] <= shares[2]);
    assert!(t.las.sufit_nakladki_ulamek.wartosc >= shares[2]);
    for tt in [
        &t.limit_bonusu_reliefu.gory,
        &t.limit_bonusu_reliefu.wzgorza,
    ] {
        let v = tier_values(tt);
        assert!(v.iter().all(|x| unit(*x) && *x > 0.0));
        assert!(v[0] <= v[1] && v[1] <= v[2]);
    }
    assert!(t.rozrzut_reliefu.min_odleglosc_gor.wartosc >= 1.0);
    assert!(t.rozrzut_reliefu.min_odleglosc_wzgorz.wartosc >= 1.0);
    for tt in [&t.minima_komorki.gory, &t.minima_komorki.wzgorza] {
        let v = tier_values(tt);
        assert!(v.iter().all(|x| *x >= 1.0 && x.fract() == 0.0));
        assert!(v[0] <= v[1] && v[1] <= v[2]);
    }
    for tt in [
        &t.rozmiary_komorek.woda,
        &t.rozmiary_komorek.zelazo,
        &t.rozmiary_komorek.miedz,
        &t.rozmiary_komorek.las,
    ] {
        let v = tier_values(tt);
        assert!(v.iter().all(|x| *x >= 1.0 && x.fract() == 0.0));
        // gestszy tier = mniejsza komorka
        assert!(v[0] >= v[1] && v[1] >= v[2]);
    }
    assert!(t.min_ladu_w_komorce.dolna_granica.wartosc >= 1.0);
    assert!(unit(t.min_ladu_w_komorce.ulamek_rozmiaru_komorki.wartosc));
    assert!(t.pokrycie.min_zrodel_rzek_na_komorke_wody.wartosc >= 0.0);
    assert!(unit(t.pokrycie.mnoznik_miedzi_wzgledem_zelaza.wartosc));
    assert!(unit(t.pokrycie.prog_pokrycia_siatki.wartosc));
    let w = &t.wymuszanie;
    assert!(unit(w.mnoznik_wyniku_wzgorza.wartosc));
    assert!(w.limit_odleglosci_od_brzegu.wartosc >= 1.0);
    for v in [
        w.waga_odleglosci_od_brzegu.wartosc,
        w.kara_plytkie_morze.wartosc,
        w.waga_losowa.wartosc,
    ] {
        assert!(unit(v) && v > 0.0);
    }
    assert!(w.dodatek_do_straznika_petli.wartosc >= 1.0);
    assert!(w.max_przebiegow_domykania_komorek.wartosc >= 1.0);
    assert!(t.sufit_przepelnienia.mnoznik.wartosc > 0.0);
    for tt in [
        &t.sufit_przepelnienia.fallback_gory,
        &t.sufit_przepelnienia.fallback_wzgorza,
    ] {
        let v = tier_values(tt);
        assert!(v.iter().all(|x| unit(*x) && *x > 0.0));
        assert!(v[0] <= v[1] && v[1] <= v[2]);
    }
}

/// Surowa liczba po sciezce kluczy (`"a": { "b": { "wartosc": X`) z TEKSTU pliku, parsowana `str::parse`.
fn raw_number_after(json: &str, path: &[&str]) -> f64 {
    let mut pos = 0;
    for seg in path {
        let needle = format!("\"{seg}\"");
        pos += json[pos..]
            .find(&needle)
            .unwrap_or_else(|| panic!("brak {seg}"))
            + needle.len();
    }
    pos += json[pos..].find("\"wartosc\"").expect("wartosc") + "\"wartosc\"".len();
    let rest = json[pos..].trim_start_matches([':', ' ']);
    let end = rest.find([',', ' ', '}', '\n']).expect("koniec liczby");
    rest[..end]
        .parse::<f64>()
        .unwrap_or_else(|_| panic!("liczba {:?}", &rest[..end]))
}

#[test]
fn floats_are_parsed_exactly_from_the_raw_json_text() {
    // `serde_json` bez `float_roundtrip` moze przeklamac ulp; tabela ma pozostac dokladna.
    let t = mapgen_relief_a();
    let j = MAPGEN_RELIEF_A_JSON;
    let mut checked = 0;
    let mut tiered = |section: &str, group: &str, tt: &TierTriple<StartValue<f64>>| {
        for (key, v) in [("low", &tt.low), ("medium", &tt.medium), ("high", &tt.high)] {
            assert_eq!(
                v.wartosc.to_bits(),
                raw_number_after(j, &[section, group, key]).to_bits(),
                "{section}/{group}/{key}"
            );
            checked += 1;
        }
    };
    tiered("las", "udzial_suchego_ladu", &t.las.udzial_suchego_ladu);
    tiered("limit_bonusu_reliefu", "gory", &t.limit_bonusu_reliefu.gory);
    tiered(
        "limit_bonusu_reliefu",
        "wzgorza",
        &t.limit_bonusu_reliefu.wzgorza,
    );
    tiered("minima_komorki", "gory", &t.minima_komorki.gory);
    tiered("minima_komorki", "wzgorza", &t.minima_komorki.wzgorza);
    tiered("rozmiary_komorek", "woda", &t.rozmiary_komorek.woda);
    tiered("rozmiary_komorek", "zelazo", &t.rozmiary_komorek.zelazo);
    tiered("rozmiary_komorek", "miedz", &t.rozmiary_komorek.miedz);
    tiered("rozmiary_komorek", "las", &t.rozmiary_komorek.las);
    tiered(
        "sufit_przepelnienia",
        "fallback_gory",
        &t.sufit_przepelnienia.fallback_gory,
    );
    tiered(
        "sufit_przepelnienia",
        "fallback_wzgorza",
        &t.sufit_przepelnienia.fallback_wzgorza,
    );
    assert_eq!(checked, 33);
    for (section, key, value) in [
        (
            "kwadrat_centrum",
            "rozmiar_boku",
            t.kwadrat_centrum.rozmiar_boku.wartosc,
        ),
        (
            "las",
            "sufit_nakladki_ulamek",
            t.las.sufit_nakladki_ulamek.wartosc,
        ),
        (
            "rozrzut_reliefu",
            "min_odleglosc_gor",
            t.rozrzut_reliefu.min_odleglosc_gor.wartosc,
        ),
        (
            "rozrzut_reliefu",
            "min_odleglosc_wzgorz",
            t.rozrzut_reliefu.min_odleglosc_wzgorz.wartosc,
        ),
        (
            "min_ladu_w_komorce",
            "dolna_granica",
            t.min_ladu_w_komorce.dolna_granica.wartosc,
        ),
        (
            "min_ladu_w_komorce",
            "ulamek_rozmiaru_komorki",
            t.min_ladu_w_komorce.ulamek_rozmiaru_komorki.wartosc,
        ),
        (
            "pokrycie",
            "min_zrodel_rzek_na_komorke_wody",
            t.pokrycie.min_zrodel_rzek_na_komorke_wody.wartosc,
        ),
        (
            "pokrycie",
            "mnoznik_miedzi_wzgledem_zelaza",
            t.pokrycie.mnoznik_miedzi_wzgledem_zelaza.wartosc,
        ),
        (
            "pokrycie",
            "prog_pokrycia_siatki",
            t.pokrycie.prog_pokrycia_siatki.wartosc,
        ),
        (
            "wymuszanie",
            "mnoznik_wyniku_wzgorza",
            t.wymuszanie.mnoznik_wyniku_wzgorza.wartosc,
        ),
        (
            "wymuszanie",
            "limit_odleglosci_od_brzegu",
            t.wymuszanie.limit_odleglosci_od_brzegu.wartosc,
        ),
        (
            "wymuszanie",
            "waga_odleglosci_od_brzegu",
            t.wymuszanie.waga_odleglosci_od_brzegu.wartosc,
        ),
        (
            "wymuszanie",
            "kara_plytkie_morze",
            t.wymuszanie.kara_plytkie_morze.wartosc,
        ),
        (
            "wymuszanie",
            "waga_losowa",
            t.wymuszanie.waga_losowa.wartosc,
        ),
        (
            "wymuszanie",
            "dodatek_do_straznika_petli",
            t.wymuszanie.dodatek_do_straznika_petli.wartosc,
        ),
        (
            "wymuszanie",
            "max_przebiegow_domykania_komorek",
            t.wymuszanie.max_przebiegow_domykania_komorek.wartosc,
        ),
        (
            "sufit_przepelnienia",
            "mnoznik",
            t.sufit_przepelnienia.mnoznik.wartosc,
        ),
    ] {
        assert_eq!(
            value.to_bits(),
            raw_number_after(j, &[section, key]).to_bits(),
            "{section}/{key}"
        );
    }
}

#[test]
fn consts_and_tier_tables_match_web() {
    let c = &web()["cases"]["consts"];
    assert_f64(
        continent_center_square_size(),
        fv(&c["CONTINENT_CENTER_SQUARE_SIZE"]),
        "CONTINENT_CENTER_SQUARE_SIZE",
    );
    assert_f64(
        min_river_sources_per_water_cell(),
        fv(&c["MIN_RIVER_SOURCES_PER_WATER_CELL"]),
        "MIN_RIVER_SOURCES_PER_WATER_CELL",
    );
    assert_f64(
        deprecated_min_mountains_iron_cell(),
        fv(&c["MIN_MOUNTAINS_IRON_CELL"]),
        "MIN_MOUNTAINS_IRON_CELL",
    );
    assert_f64(
        deprecated_min_highlands_copper_cell(),
        fv(&c["MIN_HIGHLANDS_COPPER_CELL"]),
        "MIN_HIGHLANDS_COPPER_CELL",
    );
    assert_f64(
        relief_overflow_cap_mult(),
        fv(&c["RELIEF_OVERFLOW_CAP_MULT"]),
        "RELIEF_OVERFLOW_CAP_MULT",
    );
    assert_f64(
        forest_overlay_cap_frac(),
        fv(&c["FOREST_OVERLAY_CAP_FRAC"]),
        "FOREST_OVERLAY_CAP_FRAC",
    );
    let rows = c["perTier"].as_array().expect("perTier");
    assert_eq!(rows.len(), 3);
    for row in rows {
        let tier = tier_from_web(s(&row["tier"]));
        let what = |n: &str| format!("{} {n}", s(&row["tier"]));
        assert_f64(
            forest_share_of_dry_land(tier),
            fv(&row["FOREST_SHARE_OF_DRY_LAND"]),
            &what("FOREST_SHARE"),
        );
        assert_f64(
            min_mountains_iron_cell(tier),
            fv(&row["RELIEF_MIN_MOUNTAINS"]),
            &what("RELIEF_MIN_MOUNTAINS"),
        );
        assert_f64(
            min_highlands_copper_cell(tier),
            fv(&row["RELIEF_MIN_HIGHLANDS"]),
            &what("RELIEF_MIN_HIGHLANDS"),
        );
        assert_f64(
            min_mountains_iron_cell(tier),
            fv(&row["minMountainsIronCell"]),
            &what("minMountainsIronCell"),
        );
        assert_f64(
            min_highlands_copper_cell(tier),
            fv(&row["minHighlandsCopperCell"]),
            &what("minHighlandsCopperCell"),
        );
        assert_f64(
            water_coverage_cell_size(tier),
            fv(&row["waterCoverageCellSize"]),
            &what("water"),
        );
        assert_f64(
            iron_coverage_cell_size(tier),
            fv(&row["ironCoverageCellSize"]),
            &what("iron"),
        );
        assert_f64(
            copper_coverage_cell_size(tier),
            fv(&row["copperCoverageCellSize"]),
            &what("copper"),
        );
        assert_f64(
            relief_coverage_cell_size(tier),
            fv(&row["reliefCoverageCellSize"]),
            &what("relief"),
        );
        assert_f64(
            fair_play_resource_cell_size(tier),
            fv(&row["fairPlayResourceCellSize"]),
            &what("fairPlay"),
        );
        assert_f64(
            forest_coverage_cell_size(tier),
            fv(&row["forestCoverageCellSize"]),
            &what("forest"),
        );
        let (m, h) = map_gen_relief_overflow_cap_frac(tier);
        assert_f64(m, fv(&row["overflowCapFrac"][0]), &what("overflow gory"));
        assert_f64(h, fv(&row["overflowCapFrac"][1]), &what("overflow wzgorza"));
    }
    // domyslny tier weba (`'medium'`) = Medium
    let d = &c["defaults"];
    let m = DensityTier::Medium;
    assert_f64(
        min_mountains_iron_cell(m),
        fv(&d["minMountainsIronCell"]),
        "default mountains",
    );
    assert_f64(
        min_highlands_copper_cell(m),
        fv(&d["minHighlandsCopperCell"]),
        "default highlands",
    );
    assert_f64(
        water_coverage_cell_size(m),
        fv(&d["waterCoverageCellSize"]),
        "default water",
    );
    assert_f64(
        iron_coverage_cell_size(m),
        fv(&d["ironCoverageCellSize"]),
        "default iron",
    );
    assert_f64(
        copper_coverage_cell_size(m),
        fv(&d["copperCoverageCellSize"]),
        "default copper",
    );
    assert_f64(
        relief_coverage_cell_size(m),
        fv(&d["reliefCoverageCellSize"]),
        "default relief",
    );
    assert_f64(
        fair_play_resource_cell_size(m),
        fv(&d["fairPlayResourceCellSize"]),
        "default fairPlay",
    );
    assert_f64(
        forest_coverage_cell_size(m),
        fv(&d["forestCoverageCellSize"]),
        "default forest",
    );
}

#[test]
fn caps_match_web() {
    let rows = cases("caps");
    assert!(rows.len() > 2000);
    let (mut spread_gt_min, mut bonus_gt_zero) = (0, 0);
    for row in rows {
        let tier = tier_from_web(s(&row[0]));
        let count = fv(&row[1]);
        let what = format!("{} {}", s(&row[0]), s(&row[1]));
        let bm = relief_bonus_cap_mountain(tier, count);
        let bh = relief_bonus_cap_highland(tier, count);
        let sm = relief_spread_cap_mountain(tier, count);
        let sh = relief_spread_cap_highland(tier, count);
        assert_f64(bm, fv(&row[2]), &format!("bonusMountain {what}"));
        assert_f64(bh, fv(&row[3]), &format!("bonusHighland {what}"));
        assert_f64(sm, fv(&row[4]), &format!("spreadMountain {what}"));
        assert_f64(sh, fv(&row[5]), &format!("spreadHighland {what}"));
        if sm > min_mountains_iron_cell(tier) {
            spread_gt_min += 1;
        }
        if bm > 0.0 {
            bonus_gt_zero += 1;
        }
    }
    assert!(
        spread_gt_min > 500 && bonus_gt_zero > 500,
        "{spread_gt_min} {bonus_gt_zero}"
    );
}

#[test]
fn min_land_hexes_match_web() {
    let rows = cases("minLand");
    assert!(rows.len() > 300);
    let (mut floor_hit, mut scaled) = (0, 0);
    for row in rows {
        let size = fv(&row[0]);
        let a = min_land_hexes_for_relief_cell(size);
        let b = min_land_hexes_for_fair_play_cell(size);
        assert_f64(a, fv(&row[1]), &format!("minLandRelief {}", s(&row[0])));
        assert_f64(b, fv(&row[2]), &format!("minLandFairPlay {}", s(&row[0])));
        if a == 8.0 {
            floor_hit += 1;
        } else if a > 8.0 {
            scaled += 1;
        }
    }
    assert!(floor_hit > 10 && scaled > 100, "{floor_hit} {scaled}");
}

#[test]
fn overflow_cap_frac_with_damaged_json_matches_web() {
    // Ta sama funkcja TS (`mapGenReliefOverflowCapFrac`) uruchomiona na kopiach drzewa web z
    // uszkodzonym `map-gen-params.json`; Rust dostaje te same wejscia jako `Option<f64>`.
    let variants = cases("overflowVariants");
    assert!(variants.len() >= 9);
    let (mut valid_used, mut invalid_fallback) = (0, 0);
    for var in variants {
        for row in var["rows"].as_array().expect("rows") {
            let tier = tier_from_web(s(&row["tier"]));
            let opt = |v: &serde_json::Value| (!v.is_null()).then(|| fv(v));
            let (inm, inh) = (opt(&row["mountainIn"]), opt(&row["highlandIn"]));
            let (m, h) = resolve_overflow_cap_frac(inm, inh, tier);
            let what = format!("{} {}", s(&var["name"]), s(&row["tier"]));
            assert_f64(m, fv(&row["out"][0]), &format!("{what} mountain"));
            assert_f64(h, fv(&row["out"][1]), &format!("{what} highland"));
            // niezaleznie od weba: poprawna liczba `> 0` przechodzi, reszta wraca do fallbacku
            let t = mapgen_relief_a();
            let (fb_m, fb_h) = match tier {
                DensityTier::Low => (
                    t.sufit_przepelnienia.fallback_gory.low.wartosc,
                    t.sufit_przepelnienia.fallback_wzgorza.low.wartosc,
                ),
                DensityTier::Medium => (
                    t.sufit_przepelnienia.fallback_gory.medium.wartosc,
                    t.sufit_przepelnienia.fallback_wzgorza.medium.wartosc,
                ),
                DensityTier::High => (
                    t.sufit_przepelnienia.fallback_gory.high.wartosc,
                    t.sufit_przepelnienia.fallback_wzgorza.high.wartosc,
                ),
            };
            for (got, input, fb) in [(m, inm, fb_m), (h, inh, fb_h)] {
                match input.filter(|v| *v > 0.0) {
                    Some(v) => {
                        assert_f64(got, v, &format!("{what}: wartosc z JSON"));
                        if v.to_bits() != fb.to_bits() {
                            valid_used += 1;
                        }
                    }
                    None => {
                        assert_f64(got, fb, &format!("{what}: fallback"));
                        invalid_fallback += 1;
                    }
                }
            }
        }
    }
    assert!(
        valid_used >= 6 && invalid_fallback >= 15,
        "{valid_used} {invalid_fallback}"
    );
}

#[test]
fn forest_eligible_and_deposit_protection_match_web() {
    let rows = cases("forestEligible");
    assert_eq!(rows.len(), 8);
    let (mut yes, mut no) = (0, 0);
    for row in rows {
        let terrain: Terrain = terrain_from_code(i(&row[0]));
        let want = i(&row[1]) == 1;
        assert_eq!(is_forest_eligible_terrain(terrain), want, "{terrain:?}");
        if want {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes >= 3 && no >= 5);
    let mut hex = TerrainHex::new(0, 0, Terrain::Mountains);
    let none = &cases("depositProtected");
    assert_eq!(none.len(), 3);
    assert_eq!(
        is_deposit_protected_from_overflow_cap(None),
        i(&none[0][1]) == 1
    );
    assert_eq!(
        is_deposit_protected_from_overflow_cap(Some(&hex)),
        i(&none[1][1]) == 1
    );
    hex.has_deposit = true;
    assert_eq!(
        is_deposit_protected_from_overflow_cap(Some(&hex)),
        i(&none[2][1]) == 1
    );
}

#[test]
fn vectors_come_from_the_pinned_web_run() {
    let m = &web()["meta"];
    assert_eq!(s(&m["pin_web"]), "edb8fb56");
    assert_eq!(i(&m["gen_helpers_lines"]), 12561);
    assert_eq!(s(&m["gen_helpers_sha256"]).len(), 64);
    assert!(stat("masses.total") > 100);
}
