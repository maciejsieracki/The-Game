//! P6 SIEGE-TAKTYKA K5DOC-T1 MODEL-UI (dispatch R-RUSTPORT-P6-K5DOC-T1-MODEL-UI): testy zgodnosci z pinem `07d2fbd72`
//! (`gra/src/battle/battleScene.ts`) dla `GroupDoctrine` (`:1938`), `_ensureGroupMeta` (`:17586-17593`) i
//! `_setGroupDoctrine` (`:17864-17929`, część modelu) -- `civ_engine::domain::siege_tactics_doctrine_model`.
//!
//! Wektory: `p6_k5doc_t1_vectors/vectors.json`, generowane przez `p6_k5doc_t1_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Kazdy przypadek ma pole `pin` (przy wariantach) albo wynik wyprowadzony z wykonania.

use civ_engine::domain::siege_tactics_doctrine_model::{
    doctrine_str, GroupDoctrine, GroupDoctrineMeta, GroupDoctrineTable, DEFAULT_GROUP_DOCTRINE,
};
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t1_vectors/vectors.json");

#[derive(Deserialize)]
struct Vectors {
    pin: String,
    digests: Digests,
    variants: Vec<VariantCase>,
    ensure_default: MetaOut,
    ensure_idempotent: IdempotentCase,
    set_cases: Vec<SetCase>,
    set_sequence: Vec<SetCase>,
}

#[derive(Deserialize)]
struct Digests {
    #[serde(rename = "groupDoctrineType")]
    group_doctrine_type: String,
    #[serde(rename = "ensureGroupMeta")]
    ensure_group_meta: String,
    #[serde(rename = "setGroupDoctrine")]
    set_group_doctrine: String,
}

#[derive(Deserialize)]
struct VariantCase {
    pin: String,
    value: String,
}

#[derive(Deserialize)]
struct MetaOut {
    doctrine: String,
    #[serde(rename = "autoPlay")]
    auto_play: bool,
    size: usize,
}

#[derive(Deserialize)]
struct IdempotentCase {
    after_first_mutation: MetaPair,
    second: MetaPair,
    size: usize,
}

#[derive(Deserialize)]
struct MetaPair {
    doctrine: String,
    #[serde(rename = "autoPlay")]
    auto_play: bool,
}

#[derive(Deserialize)]
struct SetCase {
    input: String,
    doctrine: String,
    #[serde(rename = "autoPlay")]
    auto_play: bool,
}

fn variant_of(s: &str) -> GroupDoctrine {
    match s {
        "defensive" => GroupDoctrine::Defensive,
        "steady" => GroupDoctrine::Steady,
        "aggressive" => GroupDoctrine::Aggressive,
        "skirmish" => GroupDoctrine::Skirmish,
        "manual" => GroupDoctrine::Manual,
        other => panic!("wektor: nieznany wariant pina {other}"),
    }
}

fn load() -> Vectors {
    serde_json::from_str(VECTORS).expect("wektory: poprawny JSON")
}

#[test]
fn wektory_pochodza_z_pina_07d2fbd72() {
    let v = load();
    assert_eq!(v.pin, "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    // Skrót wycinka = skrót wykonanego tekstu pina; zmiana pina bez regeneracji wektorów zostaje wykryta w generatorze.
    assert_eq!(v.digests.group_doctrine_type.len(), 64);
    assert_eq!(v.digests.ensure_group_meta.len(), 64);
    assert_eq!(v.digests.set_group_doctrine.len(), 64);
}

#[test]
fn kazdy_wariant_pina_parsuje_sie_i_formatuje_sie_z_powrotem() {
    let v = load();
    assert_eq!(v.variants.len(), 5, "pin :1938 ma dokladnie 5 wariantow");
    for case in &v.variants {
        assert_eq!(case.pin, "battleScene.ts:1938");
        let parsed = GroupDoctrine::parse(&case.value)
            .unwrap_or_else(|| panic!("wariant pina {} nie parsuje sie", case.value));
        assert_eq!(parsed, variant_of(&case.value), "wariant {}", case.value);
        assert_eq!(
            doctrine_str(parsed),
            case.value,
            "format wariantu {}",
            case.value
        );
    }
}

#[test]
fn nieznany_napis_nie_parsuje_sie() {
    for bad in ["", "Steady", "STEADY", "rush", "manual ", "none"] {
        assert_eq!(GroupDoctrine::parse(bad), None, "napis {bad:?}");
    }
}

#[test]
fn domyslna_doktryna_grupy_zgodna_z_pinem() {
    // battleScene.ts:17589 -- `m = { doctrine: 'steady', autoPlay: true }`.
    assert_eq!(DEFAULT_GROUP_DOCTRINE, GroupDoctrine::Steady);
    assert_eq!(GroupDoctrineMeta::default().doctrine, GroupDoctrine::Steady);
    assert!(GroupDoctrineMeta::default().auto_play);
}

#[test]
fn ensure_tworzy_brakujaca_mete_z_domyslna_doktryna_z_wektora() {
    let v = load();
    let mut t = GroupDoctrineTable::new();
    assert!(t.get("g1").is_none());
    let m = *t.ensure_group_meta("g1");
    assert_eq!(doctrine_str(m.doctrine), v.ensure_default.doctrine);
    assert_eq!(m.auto_play, v.ensure_default.auto_play);
    assert_eq!(t.len(), v.ensure_default.size);
}

#[test]
fn ensure_jest_idempotentne_i_nie_nadpisuje_istniejacej_mety() {
    let v = load();
    let mut t = GroupDoctrineTable::new();
    {
        let m = t.ensure_group_meta("g1");
        m.doctrine = GroupDoctrine::Aggressive;
        m.auto_play = false;
    }
    assert_eq!(
        doctrine_str(t.get("g1").unwrap().doctrine),
        v.ensure_idempotent.after_first_mutation.doctrine
    );
    let second = *t.ensure_group_meta("g1");
    assert_eq!(
        doctrine_str(second.doctrine),
        v.ensure_idempotent.second.doctrine
    );
    assert_eq!(second.auto_play, v.ensure_idempotent.second.auto_play);
    assert_eq!(t.len(), v.ensure_idempotent.size);
}

#[test]
fn set_zapisuje_kazda_z_pieciu_wartosci_zgodnie_z_wektorem() {
    let v = load();
    assert_eq!(v.set_cases.len(), 5);
    for case in &v.set_cases {
        let mut t = GroupDoctrineTable::new();
        t.set_group_doctrine("g1", &case.input)
            .unwrap_or_else(|e| panic!("set {} odrzucony: {e:?}", case.input));
        let m = t.get("g1").expect("meta po set");
        assert_eq!(
            doctrine_str(m.doctrine),
            case.doctrine,
            "doktryna dla {}",
            case.input
        );
        assert_eq!(m.auto_play, case.auto_play, "autoPlay dla {}", case.input);
        assert_eq!(t.len(), 1);
    }
}

#[test]
fn set_manual_wylacza_auto_play_a_pozostale_je_wlaczaja() {
    // battleScene.ts:17866-17878 -- manual: autoPlay=false; reszta: autoPlay=true.
    let mut t = GroupDoctrineTable::new();
    t.set_group_doctrine("g1", "manual").unwrap();
    assert!(!t.get("g1").unwrap().auto_play);
    t.set_group_doctrine("g1", "steady").unwrap();
    assert!(t.get("g1").unwrap().auto_play);
}

#[test]
fn set_sekwencja_zgodna_z_pinem() {
    let v = load();
    let mut t = GroupDoctrineTable::new();
    for step in &v.set_sequence {
        t.set_group_doctrine("g1", &step.input).unwrap();
        let m = t.get("g1").unwrap();
        assert_eq!(
            doctrine_str(m.doctrine),
            step.doctrine,
            "krok {}",
            step.input
        );
        assert_eq!(
            m.auto_play, step.auto_play,
            "autoPlay po kroku {}",
            step.input
        );
    }
}

#[test]
fn set_nieznana_wartosc_jest_bledem_i_nie_tworzy_mety() {
    let mut t = GroupDoctrineTable::new();
    for bad in ["", "Steady", "rush", "none"] {
        let err = t
            .set_group_doctrine("g1", bad)
            .expect_err("nieznana wartosc musi dac blad");
        assert_eq!(err.0, bad);
    }
    assert!(t.is_empty(), "blad walidacji nie moze zostawic mety");
}

#[test]
fn set_nieznana_wartosc_nie_nadpisuje_istniejacej_mety() {
    let mut t = GroupDoctrineTable::new();
    t.set_group_doctrine("g1", "skirmish").unwrap();
    assert!(t.set_group_doctrine("g1", "bogus").is_err());
    let m = t.get("g1").unwrap();
    assert_eq!(m.doctrine, GroupDoctrine::Skirmish);
    assert!(m.auto_play);
}

#[test]
fn set_akceptuje_kazdy_z_pieciu_wariantow_bez_wyjatku_walidacji() {
    // Mutacja (c) z dispatchu: pominiecie jednej wartosci w walidacji musi dac FAIL -- ten test i wektory set_cases
    // lapia kazdy z pieciu wariantow z osobna.
    for v in ["defensive", "steady", "aggressive", "skirmish", "manual"] {
        let mut t = GroupDoctrineTable::new();
        assert!(
            t.set_group_doctrine("g", v).is_ok(),
            "wariant {v} odrzucony"
        );
    }
}

#[test]
fn grupy_sa_niezalezne() {
    let mut t = GroupDoctrineTable::new();
    t.set_group_doctrine("a", "aggressive").unwrap();
    let b = *t.ensure_group_meta("b");
    assert_eq!(t.get("a").unwrap().doctrine, GroupDoctrine::Aggressive);
    assert_eq!(b.doctrine, DEFAULT_GROUP_DOCTRINE);
    assert_eq!(t.len(), 2);
}
