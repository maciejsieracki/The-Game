//! Testy KSZTAŁTU, KOMPLETNOŚCI i SPÓJNOŚCI tabeli `combat-ai-multipliers.json`
//! (P3-22 etap 2, runda 5: grupy WALKA/OBLĘŻENIE i AI).
//!
//! Tabela jest EDYTOWALNYM źródłem prawdy (decyzja właściciela, Q1/Q3): te testy NIE
//! porównują wartości liczbowych z ustalonymi stałymi ani z wzorem weba. Zgodność z webem
//! jest dowodzona poza `cargo test` przez `gen-combat-web.mjs` + `verify-combat-web.py`
//! (dowody w `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/`).

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    combat_ai_multiplier_by_key, combat_ai_multiplier_value, parse_combat_ai_multipliers,
};

/// Wiersze czytane przez kod domeny (`status_rust` = ROZWINIETE). Lista musi zgadzać się
/// z polem `status_rust` w pliku; rozbieżność czerwieni test.
const ROZWINIETE: &[&str] = &[
    "HILL_DEFENSE_MULT",
    "MOUNTAIN_DEFENSE_MULT",
    "MUR_BONUS_PROC",
    "FORT_TERENOWY_BONUS_PROC",
    "POSTERUNEK_BONUS_PROC",
    "LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA",
];

/// Identyfikatory wszystkich 26 wierszy (klasa a + klasa b weteranów), każdy raz.
const WSZYSTKIE_ID: &[&str] = &[
    "HILL_DEFENSE_MULT",
    "MOUNTAIN_DEFENSE_MULT",
    "MUR_BONUS_PROC",
    "CYTADELA_BONUS_PROC",
    "BASZTA_BONUS_PROC",
    "PALISADA_BONUS_PROC",
    "FORT_TERENOWY_BONUS_PROC",
    "POSTERUNEK_BONUS_PROC",
    "FORTIFY_OBRONA_BONUS",
    "FORTIFY_OBRONA_PROC",
    "VETERAN_BONUS_FRAC",
    "EMBARK_DEFENSE_MULT",
    "SIEGE_AI_T1_ASSAULT_RATIO",
    "SIEGE_AI_T2_BUILD_MIN_RATIO",
    "SIEGE_AI_T3_STARVE_MIN_RATIO",
    "BROD_RUCH_MULT",
    "BROD_KARA_ATAK",
    "BROD_KARA_OBRONA",
    "BROD_BONUS_BRZEG",
    "MORALE_HIT_LOSS_SCALE",
    "MORALE_ARMY_COLLAPSE_RATIO",
    "MORALE_ARMY_COLLAPSE_MULT",
    "AI_MAJOR_EARLY_ECON_BUILDING_MULT",
    "TERYTORIUM_MNOZNIK",
    "AI_MAJOR_ABSORB_POWER_RATIO_MIN",
    "LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA",
];

#[test]
fn table_has_each_row_once_with_known_class_and_status() {
    let file = parse_combat_ai_multipliers().expect("combat-ai-multipliers.json parses");
    assert_eq!(file.wiersze.len(), WSZYSTKIE_ID.len());
    let ids: BTreeSet<&str> = file.wiersze.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(ids.len(), file.wiersze.len(), "ID powtórzone");
    let expected: BTreeSet<&str> = WSZYSTKIE_ID.iter().copied().collect();
    assert_eq!(ids, expected);
    for row in &file.wiersze {
        match row.klasa.as_str() {
            "a" => assert!(row.wartosc.is_some(), "{} klasa a bez wartosc", row.id),
            "b" => assert!(
                row.wartosci_po_stanie.is_some(),
                "{} klasa b bez stanów",
                row.id
            ),
            other => panic!("{}: nieznana klasa {other}", row.id),
        }
        let status = row.status_rust.as_str();
        assert!(
            status == "ROZWINIETE" || status == "NIEUZYWANE",
            "{}: {status}",
            row.id
        );
        assert_eq!(
            status == "ROZWINIETE",
            ROZWINIETE.contains(&row.id.as_str()),
            "{}: status_rust nie zgadza się z listą wiązań",
            row.id
        );
    }
}

#[test]
fn accessors_return_the_table_value_not_a_constant() {
    // Test kontraktu odczytu: akcesor zwraca dokładnie to, co stoi w tabeli.
    // Nie zawiera żadnej stałej liczbowej z webu.
    let file = parse_combat_ai_multipliers().expect("combat-ai-multipliers.json parses");
    for row in file.wiersze.iter().filter(|r| r.klasa == "a") {
        let want = row.wartosc.expect("klasa a ma wartosc");
        assert_eq!(combat_ai_multiplier_value(&row.id), want, "{}", row.id);
        assert!(want.is_finite(), "{}: wartość nieskończona", row.id);
    }
    let veteran = file
        .wiersze
        .iter()
        .find(|r| r.id == "VETERAN_BONUS_FRAC")
        .expect("VETERAN_BONUS_FRAC");
    let stany = veteran.wartosci_po_stanie.as_ref().expect("klasa b");
    for (lvl, want) in stany {
        assert_eq!(
            combat_ai_multiplier_by_key("VETERAN_BONUS_FRAC", lvl),
            *want,
            "VETERAN_BONUS_FRAC[{lvl}]"
        );
    }
}

#[test]
fn veteran_levels_are_complete_and_non_decreasing() {
    // Kształt klasy b: poziomy 0..3 obecne, premia nie maleje z poziomem.
    let file = parse_combat_ai_multipliers().expect("combat-ai-multipliers.json parses");
    let veteran = file
        .wiersze
        .iter()
        .find(|r| r.id == "VETERAN_BONUS_FRAC")
        .expect("VETERAN_BONUS_FRAC");
    let stany = veteran.wartosci_po_stanie.as_ref().expect("klasa b");
    let keys: BTreeSet<&str> = stany.keys().map(String::as_str).collect();
    assert_eq!(keys, ["0", "1", "2", "3"].into_iter().collect());
    let values: Vec<f64> = ["0", "1", "2", "3"]
        .iter()
        .map(|k| combat_ai_multiplier_by_key("VETERAN_BONUS_FRAC", k))
        .collect();
    assert!(values.windows(2).all(|w| w[0] <= w[1]), "{values:?}");
}

#[test]
fn city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus() {
    // Invariant kształtu (nie wartość): każdy procent struktury miasta jest dodatni,
    // a mur jest co najmniej tak duży jak pozostałe pojedyncze struktury miejskie.
    let mur = combat_ai_multiplier_value("MUR_BONUS_PROC");
    for id in [
        "CYTADELA_BONUS_PROC",
        "BASZTA_BONUS_PROC",
        "PALISADA_BONUS_PROC",
    ] {
        let v = combat_ai_multiplier_value(id);
        assert!(v > 0.0, "{id} musi być dodatni");
        assert!(mur >= v, "{id} większy niż mur");
    }
}

#[test]
fn las_row_is_class_a_and_marked_read_by_domain() {
    // Wiersz LAS: klasa a, status ROZWINIETE (czytany przez combat.rs).
    let file = parse_combat_ai_multipliers().expect("combat-ai-multipliers.json parses");
    let las = file
        .wiersze
        .iter()
        .find(|r| r.id == "LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA")
        .expect("wiersz LAS");
    assert_eq!(las.klasa, "a");
    assert_eq!(las.status_rust, "ROZWINIETE");
}
