//! P6.M10 - testy KSZTALTU tabel `data/derived/mapgen-cluster-mass.json` i
//! `data/derived/start-scoring.json` (bez pinow wartosci: zmiana liczby balansu nie wymaga zmiany
//! tych testow; zgodnosc z webem pilnuja wektory w pozostalych `p6_m10_*.rs`).

use civ_engine::data::derived::{
    mapgen_cluster_mass, parse_mapgen_cluster_mass, parse_start_scoring, start_scoring,
    MapgenClusterMassFile, StartScoringFile, MAPGEN_CLUSTER_MASS_JSON, START_SCORING_JSON,
};

#[test]
fn tables_parse_with_deny_unknown_fields() {
    assert_eq!(
        &parse_mapgen_cluster_mass().expect("mass"),
        mapgen_cluster_mass()
    );
    assert_eq!(&parse_start_scoring().expect("start"), start_scoring());

    // Nieznane pole na kazdym poziomie jest odrzucane (literowka w tabeli nie przechodzi cicho).
    let base: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_MASS_JSON).unwrap();
    let mut v = base.clone();
    v["nieznane_pole"] = serde_json::json!(1);
    assert!(serde_json::from_value::<MapgenClusterMassFile>(v).is_err());
    for group in [
        "masy",
        "start_gracza",
        "wybor_hexu",
        "rozmieszczenie",
        "rozmiar_mapy",
    ] {
        let mut v = base.clone();
        v[group]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<MapgenClusterMassFile>(v).is_err(),
            "{group}: nieznane pole przeszlo"
        );
    }
    let base: serde_json::Value = serde_json::from_str(START_SCORING_JSON).unwrap();
    for group in ["promien_oswietlenia", "punktacja"] {
        let mut v = base.clone();
        v[group]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<StartScoringFile>(v).is_err(),
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
    match v {
        serde_json::Value::Object(m) => {
            if m.contains_key("wartosc") && m.contains_key("zrodlo_web") {
                out.push((path.to_string(), v));
                return;
            }
            for (k, c) in m {
                if k == "meta" {
                    continue;
                }
                leaves(c, &format!("{path}/{k}"), out);
            }
        }
        serde_json::Value::Array(a) => {
            for (n, c) in a.iter().enumerate() {
                leaves(c, &format!("{path}[{n}]"), out);
            }
        }
        _ => {}
    }
}

#[test]
fn every_value_has_a_web_source_with_file_and_line() {
    let mass: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_MASS_JSON).unwrap();
    let mut found = Vec::new();
    leaves(&mass, "", &mut found);
    assert!(
        found.len() >= 40,
        "za malo wartosci w tabeli mas: {}",
        found.len()
    );
    for (path, leaf) in &found {
        let src = leaf["zrodlo_web"].as_str().expect("zrodlo_web");
        assert!(
            src.starts_with("gra/src/map/clusters.ts:"),
            "{path}: zrodlo {src}"
        );
        let after = &src["gra/src/map/clusters.ts:".len()..];
        assert!(
            after.chars().next().is_some_and(|c| c.is_ascii_digit()),
            "{path}: brak numeru linii w {src}"
        );
    }
    let start: serde_json::Value = serde_json::from_str(START_SCORING_JSON).unwrap();
    let mut found = Vec::new();
    leaves(&start, "", &mut found);
    assert!(
        found.len() >= 15,
        "za malo wartosci w tabeli startu: {}",
        found.len()
    );
    for (path, leaf) in &found {
        let src = leaf["zrodlo_web"].as_str().expect("zrodlo_web");
        assert!(
            src.starts_with("gra/src/map/startScoring.ts:"),
            "{path}: zrodlo {src}"
        );
    }
}

#[test]
fn values_have_sane_shape() {
    let t = mapgen_cluster_mass();
    // progi rozmiaru mapy rosna, etykiety sa znane
    let steps = &t.rozmiar_mapy.progi_pola;
    assert!(steps.windows(2).all(|w| w[0].ponizej < w[1].ponizej));
    for e in steps
        .iter()
        .map(|s| &s.etykieta)
        .chain([&t.rozmiar_mapy.w_przeciwnym_razie.etykieta])
    {
        assert!(
            civ_engine::domain::mapgen::params::MapSizeLabel::from_key(e).is_some(),
            "etykieta {e}"
        );
    }
    // roster: unikalne, niepuste
    let roster = &t.roster_klucze.wartosc;
    assert!(!roster.is_empty());
    let uniq: std::collections::HashSet<_> = roster.iter().collect();
    assert_eq!(uniq.len(), roster.len());
    assert!(roster.iter().all(|k| !k.is_empty()));
    // progi i ulamki skonczone; liczniki nieujemne; dzielniki dodatnie
    assert!(t.masy.min_masa_srodka_hex.wartosc >= 0);
    assert!(t.masy.min_przestrzen_rozwoju_na_cywilizacje.wartosc >= 1);
    assert!(t.masy.prog_malej_masy_mnoznik.wartosc >= 1);
    assert!(t.masy.promien_przestrzeni_rozwoju.wartosc >= 0);
    for f in [
        t.masy.frakcja_wyspy_najwiekszej_masy.wartosc,
        t.masy.obca_masa_frakcja_najwiekszej.wartosc,
        t.start_gracza.lokalny_lad_frakcja.wartosc,
        t.start_gracza.min_masa_frakcja_najwiekszej.wartosc,
    ] {
        assert!(f.is_finite() && (0.0..=1.0).contains(&f), "ulamek {f}");
    }
    assert!(t.start_gracza.lokalny_lad_promien.wartosc >= 0);
    assert!(
        t.rozmieszczenie.wyrownanie_dzielnik_typow.wartosc >= 1,
        "dzielnik w ceil(n / dzielnik)"
    );
    assert!(
        t.rozmieszczenie.wyrownanie_min_iteracji.wartosc
            <= t.rozmieszczenie.wyrownanie_max_iteracji.wartosc
    );
    assert!(t.rozmieszczenie.min_twardy_dystans.wartosc.is_finite());
    for m in [
        t.rozmieszczenie.straznik_faza2_mnoznik.wartosc,
        t.rozmieszczenie.straznik_faza5_mnoznik.wartosc,
        t.rozmieszczenie.straznik_faza5b_mnoznik.wartosc,
    ] {
        assert!(m >= 1);
    }
    let a = &t.rozmiar_mapy.aktywne_typy;
    for n in [
        a.mala.wartosc,
        a.srednia.wartosc,
        a.duza.wartosc,
        a.ogromna.wartosc,
        a.super_.wartosc,
    ] {
        assert!(n >= 1);
    }
    let p = &start_scoring();
    let r = &p.promien_oswietlenia;
    for n in [
        r.domyslny_legacy.wartosc,
        r.easy.wartosc,
        r.normal.wartosc,
        r.hard.wartosc,
    ] {
        assert!(n >= 0);
    }
    assert!(p.punktacja.promien_okolicy.wartosc >= 0);
    assert!(p.punktacja.waga_przestrzeni_rozwoju.wartosc.is_finite());
}
