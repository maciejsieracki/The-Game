//! P6.M11 - testy KSZTALTU tabeli `data/derived/mapgen-cluster-layout.json` (bez pinow
//! wartosci: zmiana liczby balansu nie wymaga zmiany tych testow; zgodnosc z webem pilnuja
//! wektory w pozostalych `p6_m11_*.rs`). Sprawdzaja: parsowanie z `deny_unknown_fields`, zrodlo
//! (plik:linia) przy kazdej wartosci, sensowny ksztalt wartosci oraz to, ze pochodne stale to
//! ALIASY pol tabeli, a nie osobne liczby.

use civ_engine::data::derived::{
    mapgen_cluster_layout, parse_mapgen_cluster_layout, MapgenClusterLayoutFile,
    MAPGEN_CLUSTER_LAYOUT_JSON,
};
use civ_engine::domain::mapgen::cluster_layout::{
    capital_max_sea_dist, capital_min_sea_dist, capital_min_separation, capital_sea_band_width,
    cluster_body_separation, cluster_center_placement_sep, minimum_spread_quarters_required,
};
use civ_engine::domain::mapgen::params::MapSizeLabel;

const LABELS: [MapSizeLabel; 5] = [
    MapSizeLabel::Mala,
    MapSizeLabel::Srednia,
    MapSizeLabel::Duza,
    MapSizeLabel::Ogromna,
    MapSizeLabel::Super,
];

#[test]
fn table_parses_with_deny_unknown_fields() {
    assert_eq!(
        &parse_mapgen_cluster_layout().expect("tabela"),
        mapgen_cluster_layout()
    );
    let base: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_LAYOUT_JSON).unwrap();
    let mut v = base.clone();
    v["nieznane_pole"] = serde_json::json!(1);
    assert!(serde_json::from_value::<MapgenClusterLayoutFile>(v).is_err());
    for group in [
        "morze_stolicy",
        "separacja_stolic",
        "ratunek_morza",
        "cwiartki",
        "wybor_stolicy",
        "poisson",
        "straznicy",
        "repack",
    ] {
        let mut v = base.clone();
        v[group]["nieznane_pole"] = serde_json::json!(1);
        assert!(
            serde_json::from_value::<MapgenClusterLayoutFile>(v).is_err(),
            "{group}: nieznane pole przeszlo"
        );
    }
}

/// Zbiera wszystkie liscie `{wartosc, zrodlo_web}` (i progi `{od_liczby_typow, zrodlo_web}`).
fn leaves<'a>(
    v: &'a serde_json::Value,
    path: &str,
    out: &mut Vec<(String, &'a serde_json::Value)>,
) {
    match v {
        serde_json::Value::Object(m) => {
            if m.contains_key("zrodlo_web") {
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
    let t: serde_json::Value = serde_json::from_str(MAPGEN_CLUSTER_LAYOUT_JSON).unwrap();
    let mut found = Vec::new();
    leaves(&t, "", &mut found);
    assert!(
        found.len() >= 30,
        "za malo wartosci w tabeli: {}",
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
        // numer linii miesci sie w zakresie tematu M11 (clusters.ts:1351-3361)
        let n: u32 = after
            .chars()
            .take_while(char::is_ascii_digit)
            .collect::<String>()
            .parse()
            .unwrap();
        assert!(
            (1351..=3361).contains(&n),
            "{path}: linia {n} poza zakresem M11"
        );
    }
}

#[test]
fn values_have_sane_shape() {
    let t = mapgen_cluster_layout();
    let sea = &t.morze_stolicy;
    for l in LABELS {
        assert!(capital_min_sea_dist(l) >= 0, "{l:?}");
        assert!(capital_min_separation(l) >= 1, "{l:?}");
    }
    // odleglosci rosna z rozmiarem mapy (nie maleja)
    for w in LABELS.windows(2) {
        assert!(capital_min_sea_dist(w[0]) <= capital_min_sea_dist(w[1]));
        assert!(capital_min_separation(w[0]) <= capital_min_separation(w[1]));
    }
    assert!(sea.szerokosc_pasa.wartosc >= 0);
    assert!(sea.min_krotszy_bok_mapy.wartosc >= 0);
    assert!(sea.kara_ponizej_pasa.wartosc.is_finite() && sea.kara_powyzej_pasa.wartosc.is_finite());
    assert!(
        sea.kara_ponizej_pasa.wartosc > sea.kara_powyzej_pasa.wartosc,
        "kara za zbyt bliskie morze musi przewazac nad kara za zbyt dalekie"
    );

    let r = &t.ratunek_morza;
    for m in [
        r.mnoznik_ceil_pierwszy.wartosc,
        r.mnoznik_ceil_drugi.wartosc,
        r.mnoznik_floor.wartosc,
    ] {
        assert!(m.is_finite() && m > 0.0 && m <= 1.0, "mnoznik drabinki {m}");
    }
    assert!(
        r.mnoznik_ceil_pierwszy.wartosc > r.mnoznik_ceil_drugi.wartosc
            && r.mnoznik_ceil_drugi.wartosc > r.mnoznik_floor.wartosc,
        "drabinka miekniecia maleje"
    );
    assert!(r.dolna_granica_stopnia.wartosc >= 0.0);

    // progi cwiartek: malejace od_liczby_typow, niemalejace min_cwiartek, w 1..=4
    let q = &t.cwiartki;
    assert!(q
        .progi_minimum
        .windows(2)
        .all(|w| w[0].od_liczby_typow > w[1].od_liczby_typow
            && w[0].min_cwiartek >= w[1].min_cwiartek));
    for s in &q.progi_minimum {
        assert!((1..=4).contains(&s.min_cwiartek));
    }
    assert!((1..=4).contains(&q.w_przeciwnym_razie_min_cwiartek.wartosc));
    assert!(q.wyrownanie_max_iteracji.wartosc >= 1);
    assert!(q.wyrownanie_min_klastrow.wartosc >= 1);

    assert!(t
        .wybor_stolicy
        .waga_losowego_rozstrzygniecia
        .wartosc
        .is_finite());
    assert!(t.wybor_stolicy.waga_losowego_rozstrzygniecia.wartosc >= 0.0);
    assert!(t.wybor_stolicy.proby_ladu.wartosc >= 1);
    assert!(t.poisson.luz_odstepu.wartosc >= 0);
    assert!(t.straznicy.twarda_separacja_mnoznik.wartosc >= 1);
    assert!(t.straznicy.separacja_bryl_mnoznik.wartosc >= 1);

    let rp = &t.repack;
    assert!(rp.luzny_bufor_dzielnik.wartosc >= 1.0);
    assert!(rp.luzny_min_dystans_dolny.wartosc >= 0);
    assert!(rp.ostateczny_min_dystans.wartosc >= 1);
    for ring in rp
        .pierscienie_po_maksymalnym
        .wartosc
        .iter()
        .chain(&rp.pierscienie_ostateczne.wartosc)
    {
        assert!(*ring >= 1);
    }
    assert!(!rp.pierscienie_ostateczne.wartosc.is_empty());
}

#[test]
fn derived_constants_are_aliases_of_table_fields() {
    let t = mapgen_cluster_layout();
    for l in LABELS {
        // max = min + szerokosc pasa; sep srodkow = sep stolic + dodatek; sep bryl = sep stolic
        assert_eq!(
            capital_max_sea_dist(l),
            capital_min_sea_dist(l) + t.morze_stolicy.szerokosc_pasa.wartosc
        );
        assert_eq!(
            capital_sea_band_width(),
            t.morze_stolicy.szerokosc_pasa.wartosc
        );
        assert_eq!(cluster_body_separation(l), capital_min_separation(l));
        assert_eq!(
            cluster_center_placement_sep(l),
            capital_min_separation(l) + t.separacja_stolic.dodatek_odstepu_srodkow.wartosc
        );
    }
    // minimumSpreadQuartersRequired idzie wylacznie po progach z tabeli
    for n in -2..=15 {
        let expect = t
            .cwiartki
            .progi_minimum
            .iter()
            .find(|s| n >= s.od_liczby_typow)
            .map_or(t.cwiartki.w_przeciwnym_razie_min_cwiartek.wartosc, |s| {
                s.min_cwiartek
            });
        assert_eq!(minimum_spread_quarters_required(n), expect, "n={n}");
    }
}
