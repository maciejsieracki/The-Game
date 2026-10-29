//! P6.1E - testy KSZTALTU tabel `data/derived/civ-matrix-params.json` i
//! `civ-matrix-semantic.json` (bez pinow wartosci balansowych: zmiana liczby w tabeli nie
//! wymaga zmiany tych testow, o ile ksztalt i spojnosc z danymi pozostaja poprawne).
//! Dodatkowo straznik przed powrotem literalow danych/mnoznikow do kodu modulow.

use std::collections::HashSet;

use civ_engine::data::civilizations::CIV_MATRIX_JSON;
use civ_engine::data::civilizations::{parse_civ_matrix, parse_civs};
use civ_engine::data::derived::{
    civ_bonus_city_names, civ_matrix_params, civ_matrix_semantic, parse_civ_matrix_params,
    parse_civ_matrix_semantic,
};
use civ_engine::domain::civ_matrix::semantic::ConsumerStatus;
use civ_engine::domain::civ_matrix::{CivMatrixData, CivMatrixFormula};

const ALL_STATUSES: [&str; 8] = [
    "REAL_GAMEPLAY",
    "UI_ONLY",
    "REFERENCE_NEEDS_REVIEW",
    "UNWIRED",
    "DEAD_UNWIRED",
    "PROPOSAL",
    "BLOCKED",
    "DECISION_REQUIRED",
];

#[test]
fn tables_parse_and_are_cached() {
    parse_civ_matrix_params().expect("civ-matrix-params.json");
    parse_civ_matrix_semantic().expect("civ-matrix-semantic.json");
    assert!(std::ptr::eq(civ_matrix_params(), civ_matrix_params()));
    assert!(std::ptr::eq(civ_matrix_semantic(), civ_matrix_semantic()));
}

#[test]
fn params_table_is_consistent_with_matrix_and_civs() {
    let p = civ_matrix_params();
    let matrix = parse_civ_matrix().expect("macierz");
    let civs = parse_civs().expect("civs");

    // trudnosc: przedzial niepusty, formula skalowana istnieje w danych, domyslna jest znana
    assert!(p.trudnosc.min < p.trudnosc.max);
    assert!(matrix
        .param_defs
        .values()
        .any(|d| d.formula == p.trudnosc.formula_skalowana));
    assert!(CivMatrixFormula::parse(&p.formula_domyslna).is_some());
    assert!(CivMatrixFormula::parse(&p.trudnosc.formula_skalowana).is_some());

    // identyfikatory parametrow AI/dyplomacji istnieja w paramDefs
    let ids = [
        &p.ai.parametry.agresywnosc,
        &p.ai.parametry.ekspansywnosc,
        &p.ai.parametry.priorytet_militarny,
        &p.ai.parametry.priorytet_ekonomia,
        &p.ai.parametry.priorytet_nauka,
        &p.ai.parametry.tolerancja_ryzyka,
        &p.ai.parametry.sklonnosc_podboju,
        &p.ai.parametry.profil_obronna,
        &p.dyplomacja.parametr_handel,
        &p.dyplomacja.parametr_nastawienie,
    ];
    for id in ids {
        assert!(matrix.param_defs.contains_key(id.as_str()), "{id}");
    }
    let unique: HashSet<&&String> = ids.iter().collect();
    assert_eq!(
        unique.len(),
        ids.len(),
        "identyfikatory parametrow sa rozne"
    );

    // zakres jednostkowy i dzielniki
    assert!(p.ai.zakres.min < p.ai.zakres.max);
    assert!(p.ai.dzielnik_skali > 0.0);
    assert!(p.dyplomacja.dzielnik_otwartosc_handel > 0.0);
    assert!(p.dyplomacja.nastawienie_podzial != 0.0);
    assert_ne!(p.ai.profil_mapy_obronna, p.ai.profil_mapy_standardowa);
    assert!(!p.ai.profil_mapy_obronna.is_empty());

    // przydzial: awaryjny typ istnieje w civs.json, typ bez nazwy Excel nie jest cywilizacja z pliku
    assert!(p.roster.min_typow >= 1);
    assert!(civs
        .cywilizacje
        .iter()
        .any(|c| c.ikona_id == p.roster.awaryjny_typ));
    assert!(!civs
        .cywilizacje
        .iter()
        .any(|c| c.ikona_id == p.typ_bez_nazwy_excel));

    // nazwy: pierwsze N pozycji to miasta cywilizacji, reszta wspolnej puli to miasta panstw
    let cn = civ_bonus_city_names();
    assert!(p.nazwy.miasta_cywilizacji_len > 0);
    assert!(p.nazwy.miasta_cywilizacji_len <= cn.dlugosc_regularna + cn.dlugosc_panstwa);
}

#[test]
fn semantic_table_sets_reference_existing_parameters_and_are_disjoint() {
    let t = civ_matrix_semantic();
    let matrix = parse_civ_matrix().expect("macierz");
    let defined = |id: &String| matrix.param_defs.contains_key(id.as_str());
    let sets: [(&str, &Vec<String>); 6] = [
        ("real_gameplay", &t.zbiory.real_gameplay),
        ("ui_only", &t.zbiory.ui_only),
        ("decision_required", &t.zbiory.decision_required),
        ("walka_zablokowana", &t.zbiory.walka_zablokowana),
        ("walka_martwa", &t.zbiory.walka_martwa),
        ("szkodliwe", &t.zbiory.szkodliwe),
    ];
    for (name, set) in sets {
        // REPIN-LOGIKA-CIV-Q1 r2: web 91dc998a ma puste zbiory DECISION_REQUIRED (ts:257)
        // i BLOCKED_COMBAT_MULTIPLIER (ts:268); pusty zbior jest tu pinem, nie brakiem danych.
        if name == "decision_required" || name == "walka_zablokowana" {
            assert!(set.is_empty(), "{name} ma byc pusty wg weba 91dc998a");
            continue;
        }
        assert!(!set.is_empty(), "{name}");
        for id in set {
            assert!(defined(id), "{name}: nieznany parametr {id}");
        }
        let unique: HashSet<&String> = set.iter().collect();
        assert_eq!(unique.len(), set.len(), "{name}: duplikaty");
    }
    // zbiory statusow wykluczaja sie wzajemnie (kolejnosc rozstrzygania nie ma znaczenia)
    let status_sets = [
        &t.zbiory.real_gameplay,
        &t.zbiory.ui_only,
        &t.zbiory.decision_required,
        &t.zbiory.walka_zablokowana,
        &t.zbiory.walka_martwa,
    ];
    for i in 0..status_sets.len() {
        for j in (i + 1)..status_sets.len() {
            assert!(
                !status_sets[i].iter().any(|id| status_sets[j].contains(id)),
                "zbiory {i} i {j} sie przecinaja"
            );
        }
    }
    for id in t.dowody_konsumentow.keys() {
        assert!(defined(id), "dowod dla nieznanego parametru {id}");
    }
    // kazdy parametr REAL_GAMEPLAY ma dowod konsumenta (web: PROVEN_CONSUMERS)
    for id in &t.zbiory.real_gameplay {
        assert!(t.dowody_konsumentow.contains_key(id), "brak dowodu {id}");
    }
    assert!(t.skala_intensywnosci.min < t.skala_intensywnosci.max);
    assert!(t.skala_intensywnosci.zaokraglenie > 0.0);
}

#[test]
fn semantic_table_has_text_for_every_status_and_placeholder() {
    let t = civ_matrix_semantic();
    for name in ALL_STATUSES {
        assert!(ConsumerStatus::parse(name).is_some(), "{name}");
        assert!(
            t.etykiety_statusow.get(name).is_some_and(|l| !l.is_empty()),
            "etykieta {name}"
        );
    }
    assert_eq!(t.etykiety_statusow.len(), ALL_STATUSES.len());
    assert!(t.powody.unwired.domyslny.contains("{parametr}"));
    assert!(t
        .powody
        .blocked
        .grupa_walka_zablokowana
        .contains("{parametr}"));
    assert!(t.blokada_wejscia.nieznany_parametr.contains("{parametr}"));
    assert!(t.blokada_wejscia.brak_wartosci.contains("{cywilizacja}"));
    assert!(t.blokada_wejscia.brak_wartosci.contains("{parametr}"));
    assert!(t
        .blokada_wejscia
        .nieznana_cywilizacja
        .contains("{cywilizacja}"));
    // REPIN-LOGIKA-CIV-Q1 r2: web 91dc998a ma zbior DECISION_REQUIRED pusty (civ-matrix-semantic.ts:257),
    // a wyjatki `dip_*` maja wlasne galezie tekstu statusu (ts:402, 416-417) zamiast czlonkostwa w zbiorze.
    const WEB_TEXT_EXCEPTIONS: [&str; 2] = ["dip_nastawienie_bazowe", "dip_agresja_archetyp"];
    for key in t.powody.unwired.wyjatki.keys() {
        assert!(
            t.zbiory.decision_required.contains(key)
                || WEB_TEXT_EXCEPTIONS.contains(&key.as_str())
                || !t.dowody_konsumentow.contains_key(key),
            "{key}"
        );
    }
    for key in t.powody.decision_required.wyjatki.keys() {
        assert!(
            WEB_TEXT_EXCEPTIONS.contains(&key.as_str()),
            "nieoczekiwany wyjatek DECISION_REQUIRED {key}"
        );
    }
    // statusy bez roznic trudnosci to znane statusy
    for name in &t.zachowanie_trudnosci.bez_roznic_statusy {
        assert!(ConsumerStatus::parse(name).is_some(), "{name}");
    }
}

#[test]
fn semantic_neutral_band_rules_cover_every_parameter_definition() {
    let t = civ_matrix_semantic();
    let known: HashSet<&str> = t
        .pasma_neutralne
        .reguly
        .iter()
        .map(|r| r.klucz.as_str())
        .chain([t.pasma_neutralne.domyslne.klucz.as_str()])
        .collect();
    for rule in &t.pasma_neutralne.reguly {
        assert!(rule.tolerancja >= 0.0, "{}", rule.klucz);
        assert!(
            !rule.gdy_formula.is_empty() || !rule.gdy_jednostka.is_empty(),
            "regula {} bez warunku",
            rule.klucz
        );
    }
    assert!(t.pasma_neutralne.domyslne.tolerancja >= 0.0);
    let data = CivMatrixData::from_json(CIV_MATRIX_JSON).expect("macierz");
    for (id, def) in &data.file.param_defs {
        let band = civ_engine::domain::civ_matrix::semantic::civ_matrix_neutral_band(def);
        assert!(known.contains(band.key.as_str()), "{id}: {}", band.key);
        assert_eq!(band.policy_id, t.polityka_pasm);
    }
}

#[test]
fn parameter_label_dictionary_has_nonempty_entries_and_suffix_rule() {
    // Ksztalt slownika etykiet: wpisy niepuste; czlony bez wpisu (np. literowka weba
    // `obleczenie` zamiast `oblezenie`) przechodza bez zmian - to zachowanie weba, pokryte
    // wektorami `paramLabel`, a nie wymog kompletnosci slownika.
    let t = civ_matrix_semantic();
    assert!(!t.etykieta_parametru.slownik.is_empty());
    for (key, value) in &t.etykieta_parametru.slownik {
        assert!(!key.is_empty() && !value.is_empty(), "{key:?} -> {value:?}");
    }
    assert!(!t.etykieta_parametru.separator_czesci.is_empty());
    assert!(!t.etykieta_parametru.sufiks_proc.koncowka.is_empty());
}

#[test]
fn modules_contain_no_balance_or_data_literals() {
    // Straznik: stale z tabel nie wracaja do kodu. Teksty PL i identyfikatory parametrow
    // macierzy (np. `ai_agresywnosc`) zyja wylacznie w tabelach derived/.
    let sources = [
        ("civ_matrix.rs", include_str!("../src/domain/civ_matrix.rs")),
        ("civ_names.rs", include_str!("../src/domain/civ_names.rs")),
    ];
    let forbidden = [
        "7919",
        "\"kopia_typu_obronna\"",
        "\"standardowa\"",
        "unit-aware-v1",
        "normal-median-signed-v1",
        "normal-median-all-15",
        "ai_agresywnosc",
        "ai_profil_obronna",
        "dip_handlowosc_archetyp",
        "dip_nastawienie_bazowe",
        "drobna_cywilizacja",
        "REAL_GAMEPLAY\" =>",
        "0.005",
        "decimal_0_05",
        "exact_flag",
        "Brak potwierdzonego",
        "POZYTYWNY",
        "AKTYWNE",
        "\"grecy\"",
        " / 10.0",
        "50.0",
    ];
    for (file, source) in sources {
        // pomijamy komentarze (// ...) i linie dokumentacji
        let code: String = source
            .lines()
            .filter(|l| !l.trim_start().starts_with("//"))
            .collect::<Vec<_>>()
            .join("\n");
        for needle in forbidden {
            assert!(
                !code.contains(needle),
                "{file}: literal danych/balansu {needle:?} w kodzie (powinien byc w tabeli)"
            );
        }
    }
}
