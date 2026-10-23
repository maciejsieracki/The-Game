//! P6.M04 - testy KSZTALTU tabeli `data/derived/mapgen-terrain-class.json` (bez pinow wartosci:
//! zmiana liczby balansu nie wymaga zmiany tych testow; zgodnosc z webem pilnuja wektory w
//! `p6_m04_classify.rs`, `p6_m04_reapply.rs`, `p6_m04_border.rs` - zmiana balansu celowo je lamie).

use civ_engine::data::derived::{
    mapgen_terrain_class, parse_mapgen_terrain_class, MapgenTerrainClassFile, StartValue,
    MAPGEN_TERRAIN_CLASS_JSON,
};

#[test]
fn table_parses_with_deny_unknown_fields() {
    assert_eq!(
        &parse_mapgen_terrain_class().expect("parse"),
        mapgen_terrain_class()
    );
    let base: serde_json::Value = serde_json::from_str(MAPGEN_TERRAIN_CLASS_JSON).unwrap();
    let mut v = base.clone();
    v["nieznane_pole"] = serde_json::json!(1);
    assert!(serde_json::from_value::<MapgenTerrainClassFile>(v).is_err());
    for group in [
        "klasyfikacja",
        "bramki_wysokosci_reliefu",
        "przeplot_rownina_laka",
        "relief_po_dopasowaniu_ladu",
        "nakladka_lasu",
        "brzeg_mapy",
        "srodek_mapy",
    ] {
        let mut v = base.clone();
        v[group]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<MapgenTerrainClassFile>(v).is_err(),
            "{group}: nieznane pole przeszlo"
        );
    }
    for row in ["niski", "sredni", "wysoki"] {
        let mut v = base.clone();
        v["bramki_wysokosci_reliefu"][row]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<MapgenTerrainClassFile>(v).is_err(),
            "{row}"
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
    let table: serde_json::Value = serde_json::from_str(MAPGEN_TERRAIN_CLASS_JSON).unwrap();
    let mut found = Vec::new();
    leaves(&table, "", &mut found);
    assert!(found.len() >= 50, "za malo wartosci: {}", found.len());
    let prefix = "gra/src/map/gen-helpers.ts:";
    for (path, leaf) in &found {
        let src = leaf["zrodlo_web"].as_str().expect("zrodlo_web");
        assert!(src.starts_with(prefix), "{path}: zrodlo {src}");
        let line: u32 = src[prefix.len()..]
            .parse()
            .unwrap_or_else(|_| panic!("{path}: numer linii w {src}"));
        // zakres M04 w gen-helpers.ts (233-236 i 825-1407)
        assert!(
            (825..=1407).contains(&line),
            "{path}: linia {line} poza zakresem M04"
        );
        assert!(
            leaf["wartosc"].is_number(),
            "{path}: wartosc nie jest liczba"
        );
    }
}

#[test]
fn values_have_sane_shape() {
    let t = mapgen_terrain_class();
    let unit = |v: &StartValue<f64>| (0.0..=1.0).contains(&v.wartosc);
    let c = &t.klasyfikacja;
    for v in [
        &c.prog_pustyni_domyslny,
        &c.prog_gor_domyslny,
        &c.prog_wzgorz_domyslny,
        &c.elev_ponizej_ktorego_woda_lub_laka,
        &c.landmask_ponizej_ktorego_morze,
        &c.rownina_prog_sumy,
    ] {
        assert!(unit(v), "prog poza [0,1]: {}", v.zrodlo_web);
    }
    assert!(c.pustynia_elev_wiekszy_niz.wartosc < c.pustynia_elev_mniejszy_niz.wartosc);
    let g = &t.bramki_wysokosci_reliefu;
    assert!(g.prog_niski_mtn_max_wlacznie.wartosc < g.prog_wysoki_mtn_min_wlacznie.wartosc);
    for row in [&g.niski, &g.sredni, &g.wysoki] {
        for v in [
            &row.mountain,
            &row.highland,
            &row.land_mask_hi,
            &row.land_mask_mtn,
        ] {
            assert!(unit(v));
        }
    }
    // im wyzszy tier reliefu, tym wyzsze progi wysokosci
    assert!(g.niski.mountain.wartosc <= g.sredni.mountain.wartosc);
    assert!(g.sredni.mountain.wartosc <= g.wysoki.mountain.wartosc);
    let m = &t.przeplot_rownina_laka;
    assert!(m.rozmiar_komorki_hex.wartosc >= 1.0 && m.rozmiar_komorki_hex.wartosc.fract() == 0.0);
    assert!(m.amplituda_globalna.wartosc >= 0.0 && m.amplituda_komorkowa.wartosc >= 0.0);
    let r = &t.relief_po_dopasowaniu_ladu;
    for tier in [
        &r.budzet_ulamek_ladu,
        &r.docelowy_udzial_gor,
        &r.docelowy_udzial_wzgorz,
    ] {
        assert!(unit(&tier.low) && unit(&tier.medium) && unit(&tier.high));
        assert!(
            tier.low.wartosc <= tier.medium.wartosc && tier.medium.wartosc <= tier.high.wartosc
        );
    }
    let f = &t.nakladka_lasu;
    assert!(f.minimum_lasu_pangea.wartosc >= 0.0 && f.minimum_lasu_poza_pangea.wartosc >= 0.0);
    assert!(f.minimum_sufitu_komorki.wartosc >= 1.0);
    assert!(
        f.mnoznik_strefy_umiarkowanej.wartosc > 0.0
            && f.mnoznik_poza_strefa_umiarkowana.wartosc > 0.0
    );
    assert!(unit(&f.bonus_wnetrza_ladu_max));
    let b = &t.brzeg_mapy;
    assert!(b.twardy_ocean_hex.wartosc >= 0.0);
    assert!(b.strefa_stopniowanego_ladu_hex.wartosc > b.twardy_ocean_hex.wartosc);
    assert!(b.przyrost_limitu_ladu_na_pierscien.wartosc > 0.0);
    assert!(b.limit_pelnego_ladu_w_fade.wartosc > 0.0);
    assert!(b.minimum_marginesu_krawedzi_rect.wartosc > 0.0);
    assert!(
        b.max_sasiadow_ladu_przy_dosypywaniu.wartosc >= 1.0
            && b.max_sasiadow_ladu_przy_dosypywaniu.wartosc <= 6.0
    );
    let sm = &t.srodek_mapy;
    assert!(unit(&sm.minimum_biasu_radialnego) && sm.promien_biasu_radialnego.wartosc > 0.0);
    assert!(sm.wykladnik_biasu_radialnego.wartosc > 0.0);
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
    let t = mapgen_terrain_class();
    let j = MAPGEN_TERRAIN_CLASS_JSON;
    let c = &t.klasyfikacja;
    let g = &t.bramki_wysokosci_reliefu;
    for (key, value) in [
        ("prog_pustyni_domyslny", c.prog_pustyni_domyslny.wartosc),
        ("prog_gor_domyslny", c.prog_gor_domyslny.wartosc),
        ("prog_wzgorz_domyslny", c.prog_wzgorz_domyslny.wartosc),
        (
            "elev_ponizej_ktorego_woda_lub_laka",
            c.elev_ponizej_ktorego_woda_lub_laka.wartosc,
        ),
        (
            "landmask_ponizej_ktorego_morze",
            c.landmask_ponizej_ktorego_morze.wartosc,
        ),
        (
            "pustynia_elev_wiekszy_niz",
            c.pustynia_elev_wiekszy_niz.wartosc,
        ),
        (
            "pustynia_elev_mniejszy_niz",
            c.pustynia_elev_mniejszy_niz.wartosc,
        ),
        ("rownina_prog_sumy", c.rownina_prog_sumy.wartosc),
    ] {
        assert_eq!(
            value.to_bits(),
            raw_number_after(j, &["klasyfikacja", key]).to_bits(),
            "klasyfikacja/{key}"
        );
    }
    for (name, row) in [
        ("niski", &g.niski),
        ("sredni", &g.sredni),
        ("wysoki", &g.wysoki),
    ] {
        for (key, value) in [
            ("mountain", row.mountain.wartosc),
            ("highland", row.highland.wartosc),
            ("land_mask_hi", row.land_mask_hi.wartosc),
            ("land_mask_mtn", row.land_mask_mtn.wartosc),
        ] {
            assert_eq!(
                value.to_bits(),
                raw_number_after(j, &["bramki_wysokosci_reliefu", name, key]).to_bits(),
                "{name}/{key}"
            );
        }
    }
    let r = &t.relief_po_dopasowaniu_ladu;
    for (group, tier) in [
        ("budzet_ulamek_ladu", &r.budzet_ulamek_ladu),
        ("docelowy_udzial_gor", &r.docelowy_udzial_gor),
        ("docelowy_udzial_wzgorz", &r.docelowy_udzial_wzgorz),
    ] {
        for (key, value) in [
            ("low", &tier.low),
            ("medium", &tier.medium),
            ("high", &tier.high),
        ] {
            assert_eq!(
                value.wartosc.to_bits(),
                raw_number_after(j, &["relief_po_dopasowaniu_ladu", group, key]).to_bits(),
                "{group}/{key}"
            );
        }
    }
    let f = &t.nakladka_lasu;
    let b = &t.brzeg_mapy;
    let m = &t.przeplot_rownina_laka;
    let sm = &t.srodek_mapy;
    for (section, key, value) in [
        (
            "przeplot_rownina_laka",
            "amplituda_globalna",
            m.amplituda_globalna.wartosc,
        ),
        (
            "przeplot_rownina_laka",
            "amplituda_komorkowa",
            m.amplituda_komorkowa.wartosc,
        ),
        (
            "nakladka_lasu",
            "bonus_wnetrza_ladu_max",
            f.bonus_wnetrza_ladu_max.wartosc,
        ),
        (
            "nakladka_lasu",
            "mnoznik_strefy_umiarkowanej",
            f.mnoznik_strefy_umiarkowanej.wartosc,
        ),
        (
            "brzeg_mapy",
            "przyrost_limitu_ladu_na_pierscien",
            b.przyrost_limitu_ladu_na_pierscien.wartosc,
        ),
        (
            "brzeg_mapy",
            "limit_pelnego_ladu_w_fade",
            b.limit_pelnego_ladu_w_fade.wartosc,
        ),
        (
            "brzeg_mapy",
            "waga_rozproszenia_brzegu",
            b.waga_rozproszenia_brzegu.wartosc,
        ),
        (
            "brzeg_mapy",
            "tolerancja_remisu_rozproszenia",
            b.tolerancja_remisu_rozproszenia.wartosc,
        ),
        (
            "brzeg_mapy",
            "minimum_marginesu_krawedzi_rect",
            b.minimum_marginesu_krawedzi_rect.wartosc,
        ),
        (
            "srodek_mapy",
            "minimum_biasu_radialnego",
            sm.minimum_biasu_radialnego.wartosc,
        ),
        (
            "srodek_mapy",
            "promien_biasu_radialnego",
            sm.promien_biasu_radialnego.wartosc,
        ),
    ] {
        assert_eq!(
            value.to_bits(),
            raw_number_after(j, &[section, key]).to_bits(),
            "{section}/{key}"
        );
    }
}
