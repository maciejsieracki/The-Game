// P3-5A: testy parsowania 7 plikow danych cywilizacji/dyplomacji (kopie 1:1 z gra/data na pinie edb8fb56).
// Modul nie jest podpiety do lib.rs (zakaz w dispatchu) — ladowany przez #[path].

#[path = "../src/data/civilizations.rs"]
#[allow(dead_code)]
mod civilizations;

use civilizations::{
    parse_city_names_pools, parse_civ_ai, parse_civ_matrix, parse_civ_params, parse_civs,
    parse_diplomacy, parse_diplomacy_acceptance_points, Num, WartoscValue, CITY_NAMES_POOLS_JSON,
    CIVS_JSON, CIV_AI_JSON, CIV_MATRIX_JSON, CIV_PARAMS_JSON, DIPLOMACY_ACCEPTANCE_POINTS_JSON,
    DIPLOMACY_JSON,
};
use serde_json::Value;

/// Round-trip: typed -> JSON Value musi byc identyczne z surowym plikiem (brak utraty pol, typow liczb).
fn assert_roundtrip<T: serde::Serialize>(name: &str, raw: &str, typed: &T) {
    let raw_v: Value = serde_json::from_str(raw).expect("raw json");
    let back = serde_json::to_value(typed).expect("serialize");
    assert_eq!(back, raw_v, "round-trip mismatch for {name}");
    println!("ROUNDTRIP {name}: OK (bytes={})", raw.len());
}

#[test]
fn civs_json_parses_and_spot_checks() {
    let f = parse_civs().expect("civs.json parse");
    assert_eq!(f.cywilizacje.len(), 15);
    assert_eq!(f.start_gry.len(), 11);
    assert_eq!(f.cywilizacje[0].cywilizacja, "Grecy");
    assert_eq!(f.cywilizacje[12].cywilizacja, "Babilonia");
    assert_eq!(f.cywilizacje[0].nazwy_miast.len(), 110);
    // Web 91dc998a usunal z civs.json klucze: Bonus startowy, Bonusy/minusy, bonusy,
    // mnoznikHandelPieniadz (15/15 obiektow; zmierzone: scratch civs-old/civs-web, cmp.js).
    // Stara asercja (48 wpisow bonusow, 15 list, mnoznik 2.3) dotyczyla pinu edb8fb56.
    // Nowa: brak kluczy we wszystkich 15 obiektach = None (mirror web `?` w loader.ts).
    let brak_bonusow = f.cywilizacje.iter().all(|c| {
        c.bonusy.is_none()
            && c.bonus_startowy.is_none()
            && c.bonusy_minusy_do_dopracowania.is_none()
            && c.mnoznik_handel_pieniadz.is_none()
    });
    assert!(
        brak_bonusow,
        "civs.json 91dc998a: klucze bonusow powinny byc nieobecne"
    );
    let listy_wartosc = f
        .cywilizacje
        .iter()
        .flat_map(|c| c.bonusy.iter().flatten())
        .filter(|b| matches!(b.wartosc, WartoscValue::List(_)))
        .count();
    assert_eq!(listy_wartosc, 0);
    println!(
        "SPOT civs cywilizacje={} start_gry={} bez_bonusow={}",
        f.cywilizacje.len(),
        f.start_gry.len(),
        brak_bonusow
    );
    assert_roundtrip("civs.json", CIVS_JSON, &f);
}

#[test]
fn civ_matrix_json_parses_and_spot_checks() {
    let f = parse_civ_matrix().expect("civ-matrix.json parse");
    assert_eq!(f.param_defs.len(), 93);
    assert_eq!(f.defaults.len(), 93);
    assert_eq!(f.cywilizacje.len(), 15);
    assert_eq!(f.cywilizacje[12].tier, 2);
    assert!(f.cywilizacje.iter().all(|c| c.params.len() == 93));
    // Typ liczby zachowany z JSON: default int (2), per-cywilizacja float (2.3).
    assert_eq!(f.defaults["meta_mnoznik_waluta"], Num::Int(2));
    assert_eq!(
        f.cywilizacje[0].params["meta_mnoznik_waluta"],
        Num::Float(2.3)
    );
    println!(
        "SPOT civ-matrix paramDefs={} defaults={} cywilizacje={} babilonia.tier={} grecy.meta={:?} default.meta={:?}",
        f.param_defs.len(),
        f.defaults.len(),
        f.cywilizacje.len(),
        f.cywilizacje[12].tier,
        f.cywilizacje[0].params["meta_mnoznik_waluta"],
        f.defaults["meta_mnoznik_waluta"]
    );
    assert_roundtrip("civ-matrix.json", CIV_MATRIX_JSON, &f);
}

#[test]
fn civ_params_json_parses_and_spot_checks() {
    let f = parse_civ_params().expect("civ-params.json parse");
    assert_eq!(f.cywilizacje.len(), 15);
    assert_eq!(f.cywilizacje[0].mod_wzrostu, Num::Int(1));
    assert_eq!(f.cywilizacje[0].mod_ekonomii, Num::Float(1.02));
    println!(
        "SPOT civ-params cywilizacje={} grecy.mod_wzrostu={:?} grecy.mod_ekonomii={:?}",
        f.cywilizacje.len(),
        f.cywilizacje[0].mod_wzrostu,
        f.cywilizacje[0].mod_ekonomii
    );
    assert_roundtrip("civ-params.json", CIV_PARAMS_JSON, &f);
}

#[test]
fn civ_ai_json_parses_and_spot_checks() {
    let f = parse_civ_ai().expect("civ-ai.json parse");
    assert_eq!(f.cywilizacje.len(), 15);
    assert_eq!(f.cywilizacje[0].agresywnosc, 4);
    assert_eq!(f.cywilizacje[0].profil_mapy, "kopia_typu_obronna");
    println!(
        "SPOT civ-ai cywilizacje={} grecy.agresywnosc={} grecy.profil_mapy={}",
        f.cywilizacje.len(),
        f.cywilizacje[0].agresywnosc,
        f.cywilizacje[0].profil_mapy
    );
    assert_roundtrip("civ-ai.json", CIV_AI_JSON, &f);
}

#[test]
fn diplomacy_json_parses_and_spot_checks() {
    let f = parse_diplomacy().expect("diplomacy.json parse");
    assert_eq!(f.params.prog_sojusz_relacja, 151);
    assert_eq!(f.akcje_dyplomatyczne.len(), 15);
    assert_eq!(f.per_nacja.len(), 15);
    assert_eq!(f.zmiany_parametrow.len(), 24);
    assert_eq!(f.handel_zloze.cena_baza.len(), 6);
    assert_eq!(f.handel_zloze.cena_baza["miedz"], 120);
    println!(
        "SPOT diplomacy params.prog_sojusz_relacja={} akcje={} per_nacja={} zmiany={} cena_baza.len={}",
        f.params.prog_sojusz_relacja,
        f.akcje_dyplomatyczne.len(),
        f.per_nacja.len(),
        f.zmiany_parametrow.len(),
        f.handel_zloze.cena_baza.len()
    );
    assert_roundtrip("diplomacy.json", DIPLOMACY_JSON, &f);
}

#[test]
fn diplomacy_acceptance_points_json_parses_and_spot_checks() {
    let f = parse_diplomacy_acceptance_points().expect("diplomacy-acceptance-points.json parse");
    assert_eq!(f.traktaty.pokoj.punkty, 500);
    assert_eq!(f.koszyk_pn.surowiec_ilosc.pn_per_szt.len(), 14);
    assert_eq!(f.koszyk_pn.surowiec_ilosc.pn_per_szt["drewno"], 1);
    println!(
        "SPOT acceptance pokoj.punkty={} pn_per_szt.len={} drewno={}",
        f.traktaty.pokoj.punkty,
        f.koszyk_pn.surowiec_ilosc.pn_per_szt.len(),
        f.koszyk_pn.surowiec_ilosc.pn_per_szt["drewno"]
    );
    assert_roundtrip(
        "diplomacy-acceptance-points.json",
        DIPLOMACY_ACCEPTANCE_POINTS_JSON,
        &f,
    );
}

#[test]
fn city_names_pools_json_parses_and_spot_checks() {
    let f = parse_city_names_pools().expect("city-names-pools.json parse");
    assert_eq!(f.len(), 15);
    assert!(f.values().all(|p| p.miasta_cywilizacji.len() == 110));
    assert_eq!(f["grecy"].miasta_cywilizacji[0], "Ateny");
    println!(
        "SPOT city-names pools={} grecy.first={} each=110",
        f.len(),
        f["grecy"].miasta_cywilizacji[0]
    );
    assert_roundtrip("city-names-pools.json", CITY_NAMES_POOLS_JSON, &f);
}
