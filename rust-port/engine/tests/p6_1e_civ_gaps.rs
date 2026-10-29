//! R-RUSTPORT-REPIN-LOGIKA-CIV-Q1 r2 - nowy plik (dopisek, append-only wzgledem testow r1).
//!
//! Domyka luki testowe wykryte pomiarem mutacyjnym r1 (run `02-operator-r2.md`): mutanty
//! 2, 6, 7, 20, 21, 25, 26, 27. Oczekiwania wynikaja z logiki weba `91dc998a`
//! (`civ-bonuses.ts`, `civ-matrix.ts`, `civ-matrix-semantic.ts`) i sa podane jawnie.
//! Dodatkowo dwa testy-niezmienniki (mutanty 12, 13, 16) dokumentuja, dlaczego te mutanty sa
//! rownowazne dla biezacych danych; zmiana danych ma je wtedy wylapac.

use civ_engine::data::civilizations::{parse_civ_matrix, Num, CIV_MATRIX_JSON};
use civ_engine::data::derived::civ_bonus_matrix_specs;
use civ_engine::domain::civ_bonuses::{
    civ_embarkation_movement_multiplier, civ_matrix_bonusy_for_civ_key, is_combat_modifier_bonus,
    unit_combat_category, BonusValue, CivBonusEntry, CivBonusUnitShape,
};
use civ_engine::domain::civ_matrix::semantic::{
    build_civ_matrix_semantic_profile, civ_matrix_semantic_baseline, SemanticContext,
};
use civ_engine::domain::civ_matrix::{resolve_row, CivMatrixData};

fn unit(typ_nazwa: &str, rola: &str) -> CivBonusUnitShape {
    CivBonusUnitShape {
        typ_nazwa: typ_nazwa.to_owned(),
        rola: rola.to_owned(),
        missile_attack: None,
        counter_typ: None,
    }
}

/// Wpis macierzy walki o id `walka_atak_piechota` (typ i cel z tabeli specyfikacji).
fn walka_entry(realizuje: Option<&str>, wartosc: BonusValue) -> CivBonusEntry {
    let specs = civ_bonus_matrix_specs();
    let spec = specs
        .spec_walka
        .iter()
        .find(|s| s.id == "walka_atak_piechota")
        .expect("spec walka_atak_piechota");
    CivBonusEntry {
        typ: spec.typ.clone(),
        cel: spec.cel.clone(),
        wartosc,
        opis: None,
        realizuje: realizuje.map(str::to_owned),
        matrix_param_id: Some(spec.id.clone()),
    }
}

/// Mutant 2: `rola == galera` musi dawac kategorie morska (web `unitCombatCategory`, ts:73).
#[test]
fn gap_galera_role_is_naval_category() {
    assert_eq!(unit_combat_category(&unit("Galera", "galera")), "morska");
}

/// Mutant 6: wpis musi miec `realizuje == walka` (web `isKnownMatrixCombatEntry`, ts:279).
#[test]
fn gap_combat_modifier_requires_realizuje_walka() {
    assert!(is_combat_modifier_bonus(&walka_entry(
        Some("walka"),
        BonusValue::Number(0.5)
    )));
    assert!(!is_combat_modifier_bonus(&walka_entry(
        Some("ekonomia"),
        BonusValue::Number(0.5)
    )));
    assert!(!is_combat_modifier_bonus(&walka_entry(
        None,
        BonusValue::Number(0.5)
    )));
}

/// Mutant 7: wartosc musi byc skonczona (web `Number.isFinite`, ts:279).
#[test]
fn gap_combat_modifier_requires_finite_value() {
    assert!(is_combat_modifier_bonus(&walka_entry(
        Some("walka"),
        BonusValue::Number(0.5)
    )));
    assert!(!is_combat_modifier_bonus(&walka_entry(
        Some("walka"),
        BonusValue::Number(f64::INFINITY)
    )));
    assert!(!is_combat_modifier_bonus(&walka_entry(
        Some("walka"),
        BonusValue::Number(f64::NAN)
    )));
}

/// Mutanty 20 i 21: Egipt pomija pola ruchu `walka_ruch_*` z listy EGIPT_POMIJANE
/// (web `civEmbarkationMovementMultiplier`, decyzja 4B); inne cywilizacje - nie.
#[test]
fn gap_egipt_skips_strategic_movement_params_only_for_egipt() {
    let rydwan = unit("Rydwan", "");
    let entry = CivBonusEntry {
        typ: civ_bonus_matrix_specs().etykiety.typ_walka.clone(),
        cel: "rydwany".to_owned(),
        wartosc: BonusValue::Number(0.5),
        opis: None,
        realizuje: Some("walka".to_owned()),
        matrix_param_id: Some("walka_ruch_rydwany".to_owned()),
    };
    let base = civ_embarkation_movement_multiplier(&[], &rydwan, "egipt");
    let egipt = civ_embarkation_movement_multiplier(std::slice::from_ref(&entry), &rydwan, "egipt");
    let other =
        civ_embarkation_movement_multiplier(std::slice::from_ref(&entry), &rydwan, "polska");
    assert_eq!(egipt, base, "Egipt pomija walka_ruch_rydwany");
    assert!(other > base, "inna cywilizacja stosuje walka_ruch_rydwany");
}

/// Mutant 25: dopasowanie `resolveRow` po `ikonaId` (web ts `resolveRow`, bez rozrozniania wielkosci liter).
/// W biezacych danych `ikonaId == typCywilizacji` we wszystkich wierszach (mutant jest wtedy
/// rownowazny), wiec test wprowadza syntetyczny `ikonaId` rozny od typu i nazwy.
#[test]
fn gap_resolve_row_matches_ikona_id_when_it_differs_from_typ() {
    let mut matrix = parse_civ_matrix().expect("civ-matrix.json");
    let key = "Synth_Ikona_XYZ".to_owned();
    let name = matrix.cywilizacje[0].cywilizacja.clone();
    matrix.cywilizacje[0].ikona_id = key.clone();
    let got =
        resolve_row(&matrix, "synth_ikona_xyz").expect("ikonaId bez wzgledu na wielkosc liter");
    assert_eq!(got.ikona_id, key);
    assert_eq!(got.cywilizacja, name);
}

/// Mutant 26: `findCivilization` rozwiazuje klucz `ikonaId` (web ts `findCivilization`).
/// Ten sam syntetyczny wiersz co wyzej: profil po ikonaId musi wskazac wlasciwa cywilizacje.
#[test]
fn gap_semantic_profile_resolves_ikona_id_when_it_differs_from_typ() {
    let mut data = CivMatrixData::from_json(CIV_MATRIX_JSON).expect("macierz");
    let name = data.file.cywilizacje[0].cywilizacja.clone();
    data.file.cywilizacje[0].ikona_id = "synth_ikona_xyz".to_owned();
    let ctx = SemanticContext::new(&data);
    let profile = build_civ_matrix_semantic_profile(&ctx, "synth_ikona_xyz");
    assert_eq!(profile.civilization_name, name);
    assert!(profile.blocked_reason_pl.is_none());
}

/// Mutant 27: linie bazowe pomijaja wartosci nieskonczone (web `buildBaselines`, ts:566).
#[test]
fn gap_baseline_skips_parameter_with_nonfinite_value() {
    let mut data = CivMatrixData::from_json(CIV_MATRIX_JSON).expect("macierz");
    let param = data.param_ids[0].clone();
    data.file.cywilizacje[0]
        .params
        .insert(param.clone(), Num::Float(f64::NAN));
    let ctx = SemanticContext::new(&data);
    assert_eq!(civ_matrix_semantic_baseline(&ctx, &param), None);
}

/// Niezmiennik dla mutanta 12/13 (wykluczone_g1 = walka_atak_lukownicy): parametr ma wartosc 0
/// u kazdej cywilizacji i nie jest w `zerowe_markery`, wiec wykluczenie nie zmienia wyniku.
/// Gdy dane sie zmienia, test wskaze, ze mutanty 12/13 przestaja byc rownowazne.
#[test]
fn gap_invariant_excluded_param_is_zero_everywhere() {
    let specs = civ_bonus_matrix_specs();
    assert_eq!(specs.wykluczone_g1, vec!["walka_atak_lukownicy".to_owned()]);
    assert!(!specs
        .zerowe_markery
        .iter()
        .any(|id| id == "walka_atak_lukownicy"));
    let matrix = parse_civ_matrix().expect("civ-matrix.json");
    for row in &matrix.cywilizacje {
        assert!(
            civ_matrix_bonusy_for_civ_key(&matrix, &row.ikona_id)
                .iter()
                .all(|b| b.matrix_param_id.as_deref() != Some("walka_atak_lukownicy")),
            "{}",
            row.ikona_id
        );
    }
}

/// Niezmiennik dla mutanta 16 (wyjatek celu parametru dodatkowego): kazdy wyjatek `wyjatki_civ`
/// dotyczy cywilizacji z `pomin_civ`, wiec galaz wyjatku jest nieosiagalna dla biezacych danych.
#[test]
fn gap_invariant_extra_cel_exceptions_only_for_skipped_civs() {
    let specs = civ_bonus_matrix_specs();
    for extra in &specs.parametry_dodatkowe {
        for w in &extra.wyjatki_civ {
            assert!(
                extra.pomin_civ.contains(&w.civ_key),
                "wyjatek {} dla {} nie jest pomijany",
                extra.id,
                w.civ_key
            );
        }
    }
}
