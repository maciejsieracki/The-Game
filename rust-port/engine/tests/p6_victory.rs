//! R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1: warunki zwyciestwa i porazki (`domain::victory`) wobec pinu 07d2fbd72.
//!
//! - Wektory: `p6_victory_vectors/vectors.json`, generowane przez `p6_victory_gen.mjs`, ktory WYKONUJE tekst
//!   `gra/src/game/victory.ts` z pinu w node (SHA-256 zrodla zapisany w wektorach i w tym tescie).
//! - Porownanie: `checkVictory`, `checkDefeat`, `isEliminated`, `isDominacjaVictory` (dokladnie) oraz `powerShare`
//!   (tolerancja 1e-12, bo JSON->f64 moze roznic sie o 1 ulp).
//! - Stale: `e-start-params.json` (blok `zwyciestwo`) musi zgadzac sie z konstantami Rust.
//! - Negatywy: mutacje kolejnosci (przegrana przed nauka, dominacja przed przegrana) i brak przycinania
//!   ujemnych daja inny wynik; testy wbudowane w `domain/victory.rs` pilnuja tego samego na recznych wejsciach.

use civ_engine::domain::victory::{
    check_defeat, check_victory, is_dominacja_victory, is_eliminated, power_share,
    tech_ids_in_game_scope, DefeatInput, VictoryInput, VictoryKind, VictoryMode, VictoryResult,
    DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI, NAUKA_WYMAGA_RAKIETY, OSTATNIA_EPOKA_GRY_V1,
    PROG_DOMINACJI_POWER,
};
use serde_json::Value;

const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const VICTORY_TS_SHA256: &str = "2f22949ba00bbfb754410f66fc5e1856b67dc0621d31ea310c6df39e6517bb8a";

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_victory_vectors/vectors.json")).expect("vectors")
}

fn mode_of(v: &Value) -> Option<VictoryMode> {
    match v.as_str() {
        None => None,
        Some("moc") => Some(VictoryMode::Moc),
        Some("dominacja") => Some(VictoryMode::Dominacja),
        Some("moc_i_dominacja") => Some(VictoryMode::MocIDominacja),
        Some(other) => panic!("nieznany tryb: {other}"),
    }
}

fn opt_bool(v: &Value, key: &str) -> Option<bool> {
    v.get(key).map(|x| x.as_bool().expect("bool"))
}

fn opt_i64(v: &Value, key: &str) -> Option<i64> {
    v.get(key).map(|x| x.as_i64().expect("i64"))
}

fn opt_f64(v: &Value, key: &str) -> Option<f64> {
    v.get(key).map(|x| x.as_f64().expect("f64"))
}

fn input_of(raw: &Value) -> VictoryInput {
    VictoryInput {
        city_owner_ids: raw["cityOwners"]
            .as_array()
            .expect("cityOwners")
            .iter()
            .map(|x| x.as_i64().expect("owner"))
            .collect(),
        gracz: raw["gracz"].as_i64().expect("gracz"),
        victory_mode: mode_of(raw.get("victoryMode").unwrap_or(&Value::Null)),
        potega_gracza: opt_f64(raw, "potegaGracza"),
        potegi_wszystkich: raw.get("potegiWszystkich").map(|a| {
            a.as_array()
                .expect("potegi")
                .iter()
                .map(|x| x.as_f64().expect("potega"))
                .collect()
        }),
        gracz_era: opt_i64(raw, "graczEra"),
        ostatnia_epoka: opt_i64(raw, "ostatniaEpoka"),
        wszystkie_tech_zbadane: opt_bool(raw, "wszystkieTechZbadane"),
        rakieta_wystrzelona: opt_bool(raw, "rakietaWystrzelona"),
        epoka_koncowa: opt_bool(raw, "epokaKoncowa"),
        nauka_ukonczona: opt_bool(raw, "naukaUkonczona"),
        gracz_kiedys_mial_miasto: opt_bool(raw, "graczKiedysMialMiasto"),
    }
}

fn kind_of(s: &str) -> VictoryKind {
    match s {
        "dominacja" => VictoryKind::Dominacja,
        "nauka" => VictoryKind::Nauka,
        "przegrana" => VictoryKind::Przegrana,
        other => panic!("nieznany rodzaj: {other}"),
    }
}

fn result_of(v: &Value) -> Option<VictoryResult> {
    if v.is_null() {
        return None;
    }
    Some(VictoryResult {
        winner: v["winner"].as_i64().expect("winner"),
        rodzaj: kind_of(v["rodzaj"].as_str().expect("rodzaj")),
    })
}

#[test]
fn wektory_pochodza_z_pinu_z_pasujacym_skrotem() {
    let v = vectors();
    assert_eq!(v["pin"].as_str(), Some(PIN));
    assert_eq!(
        v["sources"]["gra/src/game/victory.ts"].as_str(),
        Some(VICTORY_TS_SHA256)
    );
}

#[test]
fn stale_zgodne_z_pinem_i_z_danymi_panel_e() {
    let v = vectors();
    let c = &v["constants"];
    assert_eq!(
        c["ostatnia_epoka_gry_v1"].as_i64(),
        Some(OSTATNIA_EPOKA_GRY_V1)
    );
    assert_eq!(
        c["prog_dominacji_power"].as_f64(),
        Some(PROG_DOMINACJI_POWER)
    );
    assert_eq!(
        c["dominacja_wymaga_ostatniej_epoki"].as_bool(),
        Some(DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI)
    );
    assert_eq!(
        c["nauka_wymaga_rakiety"].as_bool(),
        Some(NAUKA_WYMAGA_RAKIETY)
    );

    // Zrodlo danych Rust: blok `zwyciestwo` w e-start-params.json (ten sam, z ktorego czyta pin).
    let data: Value =
        serde_json::from_str(include_str!("../data/e-start-params.json")).expect("json");
    let z = &data["zwyciestwo"];
    assert_eq!(z["ostatnia_epoka_v1"].as_i64(), Some(OSTATNIA_EPOKA_GRY_V1));
    assert_eq!(
        z["prog_dominacji_power"].as_f64(),
        Some(PROG_DOMINACJI_POWER)
    );
    assert_eq!(
        z["dominacja_wymaga_ostatniej_epoki"].as_bool(),
        Some(DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI)
    );
    assert_eq!(
        z["nauka_wymaga_rakiety"].as_bool(),
        Some(NAUKA_WYMAGA_RAKIETY)
    );
}

#[test]
fn check_victory_zgodne_z_pinem_na_wektorach() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 200, "za malo przypadkow: {}", cases.len());
    let mut dominacja = 0usize;
    let mut nauka = 0usize;
    let mut przegrana = 0usize;
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let raw = &case["input"];
        let exp = &case["expect"];
        let input = input_of(raw);

        let got = check_victory(&input);
        assert_eq!(got, result_of(&exp["victory"]), "checkVictory: {name}");

        let defeat = check_defeat(&DefeatInput {
            city_owner_ids: input.city_owner_ids.clone(),
            gracz: input.gracz,
            gracz_kiedys_mial_miasto: input.gracz_kiedys_mial_miasto,
        });
        assert_eq!(defeat, result_of(&exp["defeat"]), "checkDefeat: {name}");

        assert_eq!(
            is_eliminated(input.gracz, &input.city_owner_ids),
            exp["eliminated"].as_bool().expect("eliminated"),
            "isEliminated: {name}"
        );

        let potegi = input.potegi_wszystkich.clone().unwrap_or_default();
        let share = power_share(input.potega_gracza.unwrap_or(0.0), &potegi);
        let share_exp = exp["share"].as_f64().expect("share");
        assert!(
            (share - share_exp).abs() <= 1e-12,
            "powerShare: {name}: {share} != {share_exp}"
        );

        let dom = is_dominacja_victory(
            input.potega_gracza.unwrap_or(0.0),
            &potegi,
            input.gracz_era.unwrap_or(1),
            input.ostatnia_epoka.unwrap_or(OSTATNIA_EPOKA_GRY_V1),
        );
        assert_eq!(
            dom,
            exp["dominacja"].as_bool().expect("dominacja"),
            "isDominacja: {name}"
        );

        match got.map(|r| r.rodzaj) {
            Some(VictoryKind::Dominacja) => dominacja += 1,
            Some(VictoryKind::Nauka) => nauka += 1,
            Some(VictoryKind::Przegrana) => przegrana += 1,
            None => {}
        }
    }
    // Pokrycie wszystkich rodzajow wyniku w wektorach.
    assert!(
        dominacja > 0 && nauka > 0 && przegrana > 0,
        "brak pokrycia: {dominacja}/{nauka}/{przegrana}"
    );
}

#[test]
fn tech_scope_zgodny_z_pinem() {
    let v = vectors();
    let techs: Vec<(Option<String>, Option<String>)> = v["techs"]
        .as_array()
        .expect("techs")
        .iter()
        .map(|t| {
            (
                t["Technologia"].as_str().map(str::to_string),
                t["Epoka"].as_str().map(str::to_string),
            )
        })
        .collect();
    let refs: Vec<(Option<&str>, Option<&str>)> = techs
        .iter()
        .map(|(a, b)| (a.as_deref(), b.as_deref()))
        .collect();
    for row in v["tech_scope"].as_array().expect("tech_scope") {
        let e = row["ostatniaEpoka"].as_i64().expect("epoka");
        let exp: Vec<String> = row["ids"]
            .as_array()
            .expect("ids")
            .iter()
            .map(|x| x.as_str().expect("id").to_string())
            .collect();
        assert_eq!(
            tech_ids_in_game_scope(&refs, e),
            exp,
            "tech scope epoka {e}"
        );
    }
}

#[test]
fn przypadki_reczne_kryteriow_konca() {
    // Dominacja 60 z 100 w ostatniej epoce.
    let dom = VictoryInput {
        city_owner_ids: vec![0],
        gracz: 0,
        potega_gracza: Some(60.0),
        potegi_wszystkich: Some(vec![60.0, 40.0]),
        gracz_era: Some(3),
        ..VictoryInput::default()
    };
    assert_eq!(
        check_victory(&dom).map(|r| r.rodzaj),
        Some(VictoryKind::Dominacja)
    );

    // Przegrana po eliminacji wygrywa z nauka (kolejnosc 10=A*).
    let przegrana = VictoryInput {
        city_owner_ids: vec![],
        gracz: 0,
        wszystkie_tech_zbadane: Some(true),
        rakieta_wystrzelona: Some(true),
        ..VictoryInput::default()
    };
    assert_eq!(
        check_victory(&przegrana).map(|r| r.rodzaj),
        Some(VictoryKind::Przegrana)
    );

    // Nauka nieosiagalna przy rakiecie false.
    let bez_rakiety = VictoryInput {
        city_owner_ids: vec![0],
        gracz: 0,
        wszystkie_tech_zbadane: Some(true),
        rakieta_wystrzelona: Some(false),
        ..VictoryInput::default()
    };
    assert_eq!(check_victory(&bez_rakiety), None);

    // Tryb moc_i_dominacja pozwala na nauke (tryb dominacja by blokowal).
    let tryb = VictoryInput {
        victory_mode: Some(VictoryMode::MocIDominacja),
        ..bez_rakiety.clone()
    };
    assert_eq!(check_victory(&tryb), None);
    let tryb_ok = VictoryInput {
        rakieta_wystrzelona: Some(true),
        ..tryb
    };
    assert_eq!(
        check_victory(&tryb_ok).map(|r| r.rodzaj),
        Some(VictoryKind::Nauka)
    );

    // Przed pierwszym miastem brak przegranej.
    let przed = VictoryInput {
        city_owner_ids: vec![],
        gracz: 0,
        gracz_kiedys_mial_miasto: Some(false),
        ..VictoryInput::default()
    };
    assert_eq!(check_victory(&przed), None);
}

#[test]
fn mutacja_kolejnosci_zmienia_wynik() {
    // Przypadek A: gracz bez miast, pusta lista potegi innych -> dominacja nieaktywna (potegi.len()=0),
    // wiec wynik to przegrana. Ten przypadek NIE testuje kolejnosci dominacja/przegrana (dominacja i tak
    // nie zadziala); kolejnosc pilnuje przypadek B nizej.
    let bez_potegi = VictoryInput {
        city_owner_ids: vec![],
        gracz: 0,
        potega_gracza: Some(100.0),
        potegi_wszystkich: Some(vec![]),
        gracz_era: Some(3),
        ..VictoryInput::default()
    };
    assert_eq!(
        check_victory(&bez_potegi).map(|r| r.rodzaj),
        Some(VictoryKind::Przegrana)
    );

    // Przypadek B (kolejnosc dominacja przed przegrana): gracz BEZ miast (eliminowany, kiedysMial=true), ale
    // z 60% mocy przy niepustej liscie innych i era 3. Pin (checkVictory: dominacja pierwsza) daje Dominacja.
    // Mutacja "przegrana przed dominacja" dalaby Przegrana i ten test by padl.
    let eliminowany_z_dominacja = VictoryInput {
        city_owner_ids: vec![1, 2],
        gracz: 0,
        potega_gracza: Some(60.0),
        potegi_wszystkich: Some(vec![60.0, 40.0]),
        gracz_era: Some(3),
        gracz_kiedys_mial_miasto: Some(true),
        ..VictoryInput::default()
    };
    assert!(is_eliminated(0, &eliminowany_z_dominacja.city_owner_ids));
    assert_eq!(
        check_victory(&eliminowany_z_dominacja).map(|r| r.rodzaj),
        Some(VictoryKind::Dominacja)
    );

    // Dominacja przed przegrana: gracz z miastem i 60% wygrywa, nawet gdy inne miasto ma AI.
    let z_miastem = VictoryInput {
        city_owner_ids: vec![0, 3],
        gracz: 0,
        potega_gracza: Some(60.0),
        potegi_wszystkich: Some(vec![60.0, 40.0]),
        gracz_era: Some(3),
        ..VictoryInput::default()
    };
    assert_eq!(
        check_victory(&z_miastem).map(|r| r.rodzaj),
        Some(VictoryKind::Dominacja)
    );
}

#[test]
fn ai_nie_wygrywa_tylko_gracz_zero_moze_zwyciezyc_przez_dominacje_tutaj() {
    // Wejscie gracza 1 bez miast: wynik to przegrana gracza 1, a nie zwyciestwo.
    let ai = VictoryInput {
        city_owner_ids: vec![0],
        gracz: 1,
        potega_gracza: Some(10.0),
        potegi_wszystkich: Some(vec![90.0, 10.0]),
        gracz_era: Some(3),
        ..VictoryInput::default()
    };
    assert_eq!(
        check_victory(&ai),
        Some(VictoryResult {
            winner: 1,
            rodzaj: VictoryKind::Przegrana
        })
    );
}
