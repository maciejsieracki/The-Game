//! P6.M16 - testy KSZTALTU tabeli `data/derived/ulepszenia-budowa.json` i brak literalow balansowych w
//! `src/domain/improvement_build.rs`. Zadnych pinow wartosci: zmiana liczby/zbioru w JSON nie wymaga
//! zmiany testu, o ile ksztalt i spojnosc z danymi P6.3 pozostaja poprawne.

use std::collections::BTreeSet;
use std::fs;
use std::path::PathBuf;

use civ_engine::data::derived::{ulepszenia_budowa, ulepszenia_reguly};
use civ_engine::domain::improvement_build::terrain_from_web_value;
use civ_engine::domain::improvements::{improvement_catalog, livestock_improvement_keys};

fn catalog_keys() -> BTreeSet<String> {
    improvement_catalog().keys().into_iter().collect()
}

#[test]
fn terrain_codes_in_tables_are_valid() {
    let t = ulepszenia_budowa();
    let sets = [
        &t.teren.ladu,
        &t.teren.tartak,
        &t.teren.farma_plaski,
        &t.teren.irygacja,
    ];
    for set in sets {
        assert!(!set.is_empty());
        for code in set {
            assert!(terrain_from_web_value(code).is_some(), "kod terenu {code}");
        }
        let unique: BTreeSet<&String> = set.iter().collect();
        assert_eq!(unique.len(), set.len(), "duplikaty w zbiorze terenu");
    }
    for (key, list) in &t.teren_dozwolony {
        if let Some(list) = list {
            assert!(
                !list.is_empty(),
                "{key}: pusta lista = nic nie wolno; uzyj null"
            );
            for code in list {
                assert!(terrain_from_web_value(code).is_some(), "{key}: {code}");
            }
        }
    }
}

#[test]
fn rule_keys_are_known_improvements() {
    let t = ulepszenia_budowa();
    let known = catalog_keys();
    let groups: [(&str, Vec<&String>); 6] = [
        ("las.zaleznosc", t.las.zaleznosc.iter().collect()),
        ("las.wspolistnieje", t.las.wspolistnieje.iter().collect()),
        ("las.zablokowane", t.las.zablokowane.iter().collect()),
        ("kopalnie", t.kopalnie.iter().collect()),
        ("teren_dozwolony", t.teren_dozwolony.keys().collect()),
        ("zywnosc.warstwy", t.zywnosc.warstwy.iter().collect()),
    ];
    for (name, keys) in groups {
        assert!(!keys.is_empty(), "{name}");
        for key in keys {
            assert!(
                known.contains(key.as_str())
                    || ulepszenia_reguly()
                        .aliasy_legacy
                        .aliasy
                        .iter()
                        .any(|a| a.stary == **key),
                "{name}: nieznany klucz {key}"
            );
        }
    }
}

#[test]
fn food_and_sector_tables_are_consistent() {
    let t = ulepszenia_budowa();
    for solo in &t.zywnosc.solo {
        assert!(
            t.zywnosc.warstwy.contains(solo),
            "solo {solo} nie jest warstwa zywnosci"
        );
    }
    // warstwy zywnosci to podzbior kluczy "zywnosciowych" danych P6.3
    let food_p63: BTreeSet<&String> = ulepszenia_reguly().zywnosc.ulepszenia.iter().collect();
    for key in &t.zywnosc.warstwy {
        assert!(
            food_p63.contains(key),
            "{key} poza zywnosc.ulepszenia (P6.3)"
        );
    }
    let sectors: BTreeSet<&String> = t.sektory.przypisanie.values().collect();
    for excl in &t.sektory.wykluczajace {
        assert!(
            sectors.contains(excl),
            "sektor wykluczajacy {excl} bez przypisan"
        );
    }
    for (key, sector) in &t.sektory.przypisanie {
        assert!(!key.is_empty() && !sector.is_empty());
    }
    // bramki lasu nie nakladaja sie (klucz nie moze byc jednoczesnie "wspolistnieje" i "zablokowane")
    for key in &t.las.zablokowane {
        assert!(
            !t.las.wspolistnieje.contains(key),
            "{key} w obu zbiorach lasu"
        );
    }
}

#[test]
fn livestock_and_tech_tables_are_consistent() {
    let t = ulepszenia_budowa();
    let livestock = livestock_improvement_keys();
    for (improvement, resource) in &t.hodowla.odblokowanie {
        assert!(!improvement.is_empty());
        assert!(
            livestock.contains(resource) || *resource == t.hodowla.kon,
            "{improvement} -> {resource} poza surowcami hodowli (P6.3)"
        );
    }
    assert!(t.hodowla.klucze_konia.contains(&t.hodowla.kon));
    assert!(t.hodowla.stadnina_koszt_koni > 0.0);
    assert!(t.hodowla.nowy_swiat_min_epoka_hodowli >= 1.0);
    assert!(!t.hodowla.cywilizacje_inkaskie.is_empty());
    for (key, techs) in &t.technologie.wiele_tech {
        assert!(catalog_keys().contains(key), "wiele_tech: {key}");
        assert!(!techs.is_empty());
    }
    for raw in &t.technologie.brak_wymagania {
        assert!(raw.len() <= 1, "brak_wymagania ma znaczniki puste/'-'");
    }
    assert!(t.domyslne.praca_bez_wpisu > 0.0);
    assert!(t.domyslne.pierscien_kandydatow >= 0.0);
    assert!(!t.domyslne.typ_ulepszenia.is_empty());
}

/// Usuwa komentarze `//` i zawartosc literalow tekstowych (zostawia `""`).
fn code_only(src: &str) -> String {
    let mut out = String::new();
    for line in src.lines() {
        let mut in_str = false;
        let mut cleaned = String::new();
        let chars: Vec<char> = line.chars().collect();
        let mut i = 0;
        while i < chars.len() {
            let c = chars[i];
            if in_str {
                if c == '\\' {
                    i += 2;
                    continue;
                }
                if c == '"' {
                    in_str = false;
                    cleaned.push('"');
                }
                i += 1;
                continue;
            }
            if c == '"' {
                in_str = true;
                cleaned.push('"');
                i += 1;
                continue;
            }
            if c == '/' && chars.get(i + 1) == Some(&'/') {
                break;
            }
            cleaned.push(c);
            i += 1;
        }
        out.push_str(&cleaned);
        out.push('\n');
    }
    out
}

#[test]
fn improvement_build_has_no_balance_number_literals() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/domain/improvement_build.rs");
    let src = fs::read_to_string(&path).unwrap();
    let code = code_only(&src);
    // liczby w kodzie: tylko strukturalne 0 i 1 (indeksy, kroki sasiedztwa, odleglosc 1, -1)
    let mut found: BTreeSet<String> = BTreeSet::new();
    let bytes: Vec<char> = code.chars().collect();
    let mut i = 0;
    while i < bytes.len() {
        let c = bytes[i];
        let prev_word = i > 0 && (bytes[i - 1].is_alphanumeric() || bytes[i - 1] == '_');
        if c.is_ascii_digit() && !prev_word {
            let start = i;
            while i < bytes.len() && (bytes[i].is_ascii_digit() || bytes[i] == '.') {
                // "0.." (zakres) nie jest liczba dziesietna
                if bytes[i] == '.' && bytes.get(i + 1) == Some(&'.') {
                    break;
                }
                i += 1;
            }
            found.insert(bytes[start..i].iter().collect());
            continue;
        }
        i += 1;
    }
    let allowed: BTreeSet<String> = ["0", "1", "0.0", "1.0"]
        .iter()
        .map(|s| s.to_string())
        .collect();
    let extra: Vec<&String> = found.difference(&allowed).collect();
    assert!(
        extra.is_empty(),
        "literaly liczbowe poza {{0,1}}: {extra:?}"
    );
}
