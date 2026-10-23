//! P6.6A - testy KSZTALTU edytowalnych tabel `data/derived/{city-founding-params,city-hex-clear-rules,
//! conquest-stability-params,visibility-params}.json` oraz ich zrodel danych. Brak pinow wartosci
//! balansu: sprawdzana jest poprawnosc struktury, kompletnosc kluczy i spojnosc z innymi danymi.

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    city_founding_params, city_hex_clear_rules, conquest_stability_params,
    parse_city_founding_params, parse_city_hex_clear_rules, parse_conquest_stability_params,
    parse_visibility_params, visibility_params,
};
use civ_engine::data::economy_society::parse_miasto_params;
use civ_engine::data::terrain_map::parse_map_gen_params;
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::visibility::default_sight;

fn meta_has_source(meta: &serde_json::Value) {
    assert!(
        meta["zrodlo_web"]
            .as_str()
            .is_some_and(|s| s.contains(".ts")),
        "meta.zrodlo_web musi wskazywac plik weba"
    );
}

#[test]
fn founding_table_is_well_formed() {
    let f = parse_city_founding_params().expect("parse");
    assert_eq!(&f, city_founding_params());
    meta_has_source(&f.meta);
    for v in [
        f.fallback_koszt_praca,
        f.fallback_koszt_ludnosci,
        f.ai_source_min_pop,
    ] {
        assert!(v.is_finite() && v >= 0.0);
    }
    for t in [
        &f.teksty.za_malo_pracy,
        &f.teksty.potrzebne_miasto,
        &f.teksty.za_malo_ludnosci,
    ] {
        assert!(t.contains("{koszt}"), "szablon bez {{koszt}}: {t}");
    }
    assert!(
        f.teksty.etykieta_platne.contains("{praca}")
            && f.teksty.etykieta_platne.contains("{ludnosc}")
    );
    assert!(!f.teksty.etykieta_darmowe.is_empty());
}

#[test]
fn founding_costs_are_present_in_miasto_params() {
    // zrodlo wartosci glownych: data/miasto-params.json (DANE-JUZ-W-RUST); tabela derived trzyma tylko zapasowe
    let m = parse_miasto_params().expect("miasto-params");
    assert!(m.zaloz_miasto_koszt_praca.wartosc >= 0);
    assert!(m.zaloz_miasto_koszt_ludnosci.wartosc >= 0);
}

#[test]
fn hex_clear_table_is_well_formed() {
    let r = parse_city_hex_clear_rules().expect("parse");
    assert_eq!(&r, city_hex_clear_rules());
    meta_has_source(&r.meta);
    assert!(!r.zostaje_ulepszenia.is_empty());
    let uniq: BTreeSet<&String> = r.zostaje_ulepszenia.iter().collect();
    assert_eq!(
        uniq.len(),
        r.zostaje_ulepszenia.len(),
        "duplikaty kluczy ulepszen"
    );
    assert!(r
        .zostaje_ulepszenia
        .iter()
        .all(|k| !k.is_empty() && k == k.trim()));
    assert!(!r.ulepszenie_brak.is_empty());
    assert!(!r.zostaje_ulepszenia.contains(&r.ulepszenie_brak));
    for dep in &r.zostaja_zloza_nakladki {
        let o = Overlay::from_web_value(dep).unwrap_or_else(|| panic!("nieznana nakladka {dep}"));
        assert!(
            o != Overlay::Brak && o != Overlay::Las,
            "{dep}: las/brak nie moga byc zlozem"
        );
    }
}

#[test]
fn conquest_table_is_well_formed() {
    let c = parse_conquest_stability_params().expect("parse");
    assert_eq!(&c, conquest_stability_params());
    meta_has_source(&c.meta);
    assert!(c.prog_obca_kultura.is_finite() && (0.0..=1.0).contains(&c.prog_obca_kultura));
    assert!(
        c.mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu.is_finite()
            && c.mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu >= 1.0
    );
    let culture: BTreeSet<&str> = c.budynki_kulturalne.keys().map(String::as_str).collect();
    assert_eq!(
        culture,
        BTreeSet::from([
            "hasAmfiteatr",
            "hasBiblioteka",
            "hasLaznia",
            "hasPalac",
            "hasSad",
            "hasStela"
        ])
    );
    let religion: BTreeSet<&str> = c.budynki_religijne.keys().map(String::as_str).collect();
    assert_eq!(
        religion,
        BTreeSet::from(["hasKamienneKregi", "hasSwiatynia"])
    );
    let mut all_ids: Vec<&String> = Vec::new();
    for ids in c
        .budynki_kulturalne
        .values()
        .chain(c.budynki_religijne.values())
    {
        assert!(!ids.is_empty());
        for id in ids {
            assert!(!id.is_empty() && id == id.trim());
            all_ids.push(id);
        }
    }
    let uniq: BTreeSet<&String> = all_ids.iter().copied().collect();
    assert_eq!(
        uniq.len(),
        all_ids.len(),
        "id budynku przypisane do dwoch flag"
    );
}

#[test]
fn visibility_table_is_well_formed() {
    let v = parse_visibility_params().expect("parse");
    assert_eq!(&v, visibility_params());
    meta_has_source(&v.meta);
    assert!(v.fallback_sight > 0.0 && v.fallback_sight.is_finite());
    assert!((0.0..=1.0).contains(&v.fog_explored_brightness));
    assert!(v.start_reveal_radius >= 0.0 && v.start_reveal_radius.is_finite());
    assert!(!v.city_type_id.is_empty());
}

#[test]
fn default_sight_comes_from_map_gen_params_when_positive() {
    let m = parse_map_gen_params().expect("map-gen-params");
    let from_data = m.mgla.default_sight_jednostki.wartosc as f64;
    let expected = if from_data > 0.0 {
        from_data
    } else {
        visibility_params().fallback_sight
    };
    assert_eq!(default_sight().to_bits(), expected.to_bits());
}
