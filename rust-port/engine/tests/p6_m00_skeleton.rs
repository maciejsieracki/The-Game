//! P6.M00 - szkielet generatora mapy: moduly kompiluja sie, sa publiczne,
//! a lista nazw zgadza sie z wierszem M00 tabeli P6-25 §6 (plik w runie).

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::PathBuf;

#[allow(unused_imports)]
use civ_engine::domain::{
    improvement_build, map_snapshot, mapgen, roads, territory, wonder_placement,
};

#[allow(unused_imports)]
use civ_engine::domain::mapgen::{
    cluster_compute, cluster_layout, cluster_mass, cluster_rivals, coast, deposits, generate,
    landsea, masks, params, prims, relief, rivers_a, rivers_b, rivers_c, rivers_d, rivers_e1,
    rivers_e2, starts, terrain_class, types, villages,
};

fn engine_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn doc_row() -> String {
    let p = engine_dir().join(
        "../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1/p6-25-sec6-m00-row.txt",
    );
    fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()))
}

/// Sciezki `src/domain/...rs` z wiersza M00 (poza mod.rs).
fn doc_paths() -> BTreeSet<String> {
    let row = doc_row();
    row.split('`')
        .filter(|t| t.starts_with("src/domain/") && t.ends_with(".rs"))
        .map(str::to_string)
        .collect()
}

#[test]
fn doc_row_lists_expected_counts() {
    let paths = doc_paths();
    // mod.rs domeny + mapgen/mod.rs + 22 modulow mapgen + 5 modulow domeny.
    assert!(paths.contains("src/domain/mod.rs"));
    assert!(paths.contains("src/domain/mapgen/mod.rs"));
    let mapgen_leaf = paths
        .iter()
        .filter(|p| p.starts_with("src/domain/mapgen/") && !p.ends_with("/mod.rs"))
        .count();
    assert_eq!(mapgen_leaf, 22);
    let top = paths
        .iter()
        .filter(|p| !p.starts_with("src/domain/mapgen/") && !p.ends_with("/mod.rs"))
        .count();
    assert_eq!(top, 5);
}

#[test]
fn files_exist_and_are_empty_doc_only() {
    for p in doc_paths() {
        let full = engine_dir().join(&p);
        let src = fs::read_to_string(&full).unwrap_or_else(|e| panic!("brak {p}: {e}"));
        if p.ends_with("/mod.rs") {
            continue;
        }
        for (i, line) in src.lines().enumerate() {
            assert!(
                line.starts_with("//!"),
                "{p}:{} nie jest komentarzem //! (szkielet ma byc pusty)",
                i + 1
            );
        }
        assert!(
            src.contains("R-RUSTPORT-P6-M"),
            "{p}: brak tematu wlasciciela"
        );
    }
}

/// Wlasciciele plikow szkieletu wg wszystkich wierszy M00..M18 tabeli P6-25 §6
/// (kolumna "allowlista Rust"). Plik wspolny (relief.rs) ma kilku wlascicieli.
fn doc_owners() -> BTreeMap<String, BTreeSet<String>> {
    let p = engine_dir().join(
        "../../dyspozycje/autobot/runs/R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1/p6-25-sec6-rows-m00-m18.txt",
    );
    let all = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    let mut out: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for row in all.lines().filter(|l| l.starts_with("| `R-RUSTPORT-P6-M")) {
        let cols: Vec<&str> = row.split(" | ").collect();
        let owner = cols[0]
            .trim_start_matches("| ")
            .trim_matches('`')
            .to_string();
        if owner.starts_with("R-RUSTPORT-P6-M00-") {
            continue;
        }
        for t in cols[4].split('`') {
            if t.starts_with("src/domain/") && t.ends_with(".rs") {
                out.entry(t.to_string()).or_default().insert(owner.clone());
            }
        }
    }
    // ZALOZENIE Z2 (P6-25 §9): model MapHex w `mapgen/types.rs` nalezy do M01,
    // choc wiersz M01 nie wymienia tego pliku (wymienia go tylko M00).
    out.entry("src/domain/mapgen/types.rs".to_string())
        .or_default()
        .insert("R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1".to_string());
    out
}

#[test]
fn skeleton_headers_name_full_owner_ids_from_table() {
    let owners = doc_owners();
    for p in doc_paths() {
        if p.ends_with("/mod.rs") {
            continue;
        }
        let expected = owners
            .get(&p)
            .unwrap_or_else(|| panic!("{p}: brak wlasciciela w tabeli P6-25 §6"));
        let src = fs::read_to_string(engine_dir().join(&p)).unwrap();
        let header = src
            .lines()
            .find(|l| l.contains("Temat wlasciciel:"))
            .unwrap_or_else(|| panic!("{p}: brak linii 'Temat wlasciciel:'"));
        let listed: BTreeSet<String> = header
            .split("Temat wlasciciel:")
            .nth(1)
            .unwrap()
            .split(|c: char| !(c.is_ascii_alphanumeric() || c == '-'))
            .filter(|t| t.starts_with("R-RUSTPORT-P6-M"))
            .map(str::to_string)
            .collect();
        assert_eq!(&listed, expected, "{p}: wlasciciel w naglowku != tabela");
    }
}

#[test]
fn mapgen_mod_declares_exactly_doc_modules() {
    let from_doc: BTreeSet<String> = doc_paths()
        .iter()
        .filter(|p| p.starts_with("src/domain/mapgen/") && !p.ends_with("/mod.rs"))
        .map(|p| {
            p.trim_start_matches("src/domain/mapgen/")
                .trim_end_matches(".rs")
                .to_string()
        })
        .collect();
    let modrs = fs::read_to_string(engine_dir().join("src/domain/mapgen/mod.rs")).unwrap();
    let declared: BTreeSet<String> = modrs
        .lines()
        .filter_map(|l| l.strip_prefix("pub mod "))
        .map(|l| l.trim_end_matches(';').to_string())
        .collect();
    assert_eq!(from_doc, declared);
    // Brak plikow-sierot w katalogu.
    let on_disk: BTreeSet<String> = fs::read_dir(engine_dir().join("src/domain/mapgen"))
        .unwrap()
        .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
        .filter(|n| n != "mod.rs")
        .map(|n| n.trim_end_matches(".rs").to_string())
        .collect();
    assert_eq!(on_disk, declared);
}

#[test]
fn domain_mod_declares_top_level_skeleton_modules() {
    let modrs = fs::read_to_string(engine_dir().join("src/domain/mod.rs")).unwrap();
    let declared: BTreeSet<&str> = modrs
        .lines()
        .filter_map(|l| l.strip_prefix("pub mod "))
        .map(|l| l.trim_end_matches(';'))
        .collect();
    for name in doc_paths()
        .iter()
        .filter(|p| !p.ends_with("/mod.rs"))
        .map(|p| p.trim_start_matches("src/domain/").trim_end_matches(".rs"))
        .map(|p| p.split('/').next().unwrap().to_string())
        .collect::<BTreeSet<_>>()
    {
        assert!(
            declared.contains(name.as_str()),
            "domain/mod.rs bez pub mod {name}"
        );
    }
    assert!(declared.contains("mapgen"));
}
