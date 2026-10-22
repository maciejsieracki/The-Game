//! Testy KSZTAŁTU, KOMPLETNOŚCI i WEKTORÓW tabeli `combat-ai-multipliers.json`
//! (P3-22 etap 2, runda 4: grupy WALKA/OBLĘŻENIE i AI).
//!
//! Wektory = wartości zaobserwowane z URUCHOMIONEGO kodu TS weba (pin edb8fb56,
//! `dyspozycje/autobot/runs/R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/dowody/web-combat-values.json`)
//! oraz z odczytu literałów (wiersze ODCZYT_LITERALU). Testy NIE blokują ręcznego balansu:
//! zmiana liczby w tabeli wymaga zmiany wektora tylko wtedy, gdy zmienia się zachowanie
//! względem webu (wtedy jawnie w tabeli było/jest).

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    combat_ai_multiplier_by_key, combat_ai_multiplier_value, parse_combat_ai_multipliers,
};

const ROZWINIETE: &[&str] = &[
    "HILL_DEFENSE_MULT",
    "MOUNTAIN_DEFENSE_MULT",
    "MUR_BONUS_PROC",
    "FORT_TERENOWY_BONUS_PROC",
    "POSTERUNEK_BONUS_PROC",
];

const KLASA_A: &[(&str, f64)] = &[
    ("HILL_DEFENSE_MULT", 1.5),
    ("MOUNTAIN_DEFENSE_MULT", 1.75),
    ("MUR_BONUS_PROC", 200.0),
    ("CYTADELA_BONUS_PROC", 100.0),
    ("BASZTA_BONUS_PROC", 100.0),
    ("PALISADA_BONUS_PROC", 100.0),
    ("FORT_TERENOWY_BONUS_PROC", 100.0),
    ("POSTERUNEK_BONUS_PROC", 50.0),
    ("FORTIFY_OBRONA_BONUS", 2.0),
    ("FORTIFY_OBRONA_PROC", 50.0),
    ("EMBARK_DEFENSE_MULT", 0.5),
    ("SIEGE_AI_T1_ASSAULT_RATIO", 1.8),
    ("SIEGE_AI_T2_BUILD_MIN_RATIO", 1.4),
    ("SIEGE_AI_T3_STARVE_MIN_RATIO", 1.1),
    ("BROD_RUCH_MULT", 0.5),
    ("BROD_KARA_ATAK", 0.25),
    ("BROD_KARA_OBRONA", 0.25),
    ("BROD_BONUS_BRZEG", 0.15),
    ("MORALE_HIT_LOSS_SCALE", 100.0),
    ("MORALE_ARMY_COLLAPSE_RATIO", 0.4),
    ("MORALE_ARMY_COLLAPSE_MULT", 1.3),
    ("AI_MAJOR_EARLY_ECON_BUILDING_MULT", 0.7),
    ("TERYTORIUM_MNOZNIK", 1.25),
    ("AI_MAJOR_ABSORB_POWER_RATIO_MIN", 10.0),
];

#[test]
fn table_has_each_row_once_with_known_class_and_status() {
    let file = parse_combat_ai_multipliers().expect("combat-ai-multipliers.json parses");
    assert_eq!(file.wiersze.len(), 25);
    let ids: BTreeSet<&str> = file.wiersze.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(ids.len(), file.wiersze.len(), "ID powtórzone");
    let expected: BTreeSet<&str> = KLASA_A
        .iter()
        .map(|(id, _)| *id)
        .chain(["VETERAN_BONUS_FRAC"])
        .collect();
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
fn table_values_match_web_vectors() {
    for (id, want) in KLASA_A {
        assert_eq!(combat_ai_multiplier_value(id), *want, "{id} != web");
    }
    // Weterani (klasa b, klucz = poziom 0..3): web VETERAN_BONUS_FRAC.
    assert_eq!(combat_ai_multiplier_by_key("VETERAN_BONUS_FRAC", "0"), 0.0);
    assert_eq!(combat_ai_multiplier_by_key("VETERAN_BONUS_FRAC", "1"), 0.10);
    assert_eq!(combat_ai_multiplier_by_key("VETERAN_BONUS_FRAC", "2"), 0.15);
    assert_eq!(combat_ai_multiplier_by_key("VETERAN_BONUS_FRAC", "3"), 0.20);
}

#[test]
fn city_wall_probes_match_web_arithmetic() {
    // web cityWallDefenseBonusPercent: mury 200; mury+fort 300; mury+fort+baszta 400;
    // palisada 100; baszta sama 100; brak 0 (wartości z tabeli, nie literały).
    let mur = combat_ai_multiplier_value("MUR_BONUS_PROC");
    let cyt = combat_ai_multiplier_value("CYTADELA_BONUS_PROC");
    let bas = combat_ai_multiplier_value("BASZTA_BONUS_PROC");
    let pal = combat_ai_multiplier_value("PALISADA_BONUS_PROC");
    assert_eq!(mur, 200.0);
    assert_eq!(mur + cyt, 300.0);
    assert_eq!(mur + cyt + bas, 400.0);
    assert_eq!(pal, 100.0);
}
