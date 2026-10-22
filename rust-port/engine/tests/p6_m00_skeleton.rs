//! P6.M00 - szkielet generatora mapy: moduly kompiluja sie, sa publiczne,
//! a lista nazw zgadza sie z wierszem M00 tabeli P6-25 §6 (plik w runie).

use std::collections::BTreeSet;
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
