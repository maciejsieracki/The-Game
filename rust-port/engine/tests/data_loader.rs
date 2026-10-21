//! Testy R-RUSTPORT-P3-12-DATA-LOADER-Q1: loader/walidator danych z katalogu.
//! Pozytywne: wszystkie pliki z `CARGO_MANIFEST_DIR/data` ładują się do typów z `data::*`.
//! Negatywne: każdy wariant `LoadError` sprawdzony asercją na KONKRETNY wariant.
//! Katalogi tymczasowe: `std::env::temp_dir()` z unikalną nazwą, sprzątane w `Drop`.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};

use civ_engine::data::civilizations::CivsFile;
use civ_engine::data::loader::{load_all, load_file, LoadError, DATA_FILES};

fn data_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("data")
}

struct TempDir(PathBuf);

impl TempDir {
    fn new(tag: &str) -> Self {
        static COUNTER: AtomicUsize = AtomicUsize::new(0);
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir =
            std::env::temp_dir().join(format!("civ-loader-{}-{}-{}", std::process::id(), tag, n));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).expect("create temp dir");
        TempDir(dir)
    }

    /// Kopiuje wszystkie pliki z `DATA_FILES` z katalogu danych do katalogu tymczasowego.
    fn with_all_data_files(tag: &str) -> Self {
        let tmp = Self::new(tag);
        for name in DATA_FILES.iter() {
            fs::copy(data_dir().join(name), tmp.0.join(name)).expect("copy data file");
        }
        tmp
    }

    fn write(&self, name: &str, bytes: &[u8]) {
        fs::write(self.0.join(name), bytes).expect("write temp file");
    }

    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn file_name_of(file: &Path) -> String {
    file.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default()
        .to_string()
}

// ===== POZYTYW =====

#[test]
fn loads_all_29_files_from_data_dir() {
    let set = load_all(&data_dir()).expect("all data files must load");
    assert_eq!(DATA_FILES.len(), 29);
    assert_eq!(set.civs.cywilizacje.len(), 15);
    assert_eq!(set.civs.start_gry.len(), 11);
    assert_eq!(set.civ_matrix.param_defs.len(), 93);
    assert_eq!(set.units.len(), 75);
}

#[test]
fn data_files_list_matches_directory_contents() {
    let mut on_disk: Vec<String> = fs::read_dir(data_dir())
        .expect("read data dir")
        .map(|e| {
            e.expect("dir entry")
                .file_name()
                .to_string_lossy()
                .into_owned()
        })
        .filter(|n| n.ends_with(".json"))
        .collect();
    on_disk.sort();
    let mut listed: Vec<String> = DATA_FILES.iter().map(|s| s.to_string()).collect();
    listed.sort();
    assert_eq!(on_disk, listed);
}

// ===== NEGATYWY (każdy: konkretny wariant + nazwa pliku) =====

#[test]
fn neg_missing_file_is_file_missing() {
    let tmp = TempDir::with_all_data_files("missing");
    fs::remove_file(tmp.path().join("tech.json")).expect("remove");
    match load_all(tmp.path()) {
        Err(LoadError::FileMissing { file }) => assert_eq!(file_name_of(&file), "tech.json"),
        Err(other) => panic!("expected FileMissing, got {other:?}"),
        Ok(_) => panic!("expected FileMissing, got Ok"),
    }
}

#[test]
fn neg_every_listed_file_is_required_by_load_all() {
    // Usunięcie KAŻDEGO z 29 plików po kolei: `load_all` musi zgłosić FileMissing
    // z nazwą właśnie usuniętego pliku (dowód, że wszystkie są czytane).
    for name in DATA_FILES.iter() {
        let tmp = TempDir::with_all_data_files("each");
        fs::remove_file(tmp.path().join(name)).expect("remove");
        match load_all(tmp.path()) {
            Err(LoadError::FileMissing { file }) => assert_eq!(file_name_of(&file), *name),
            Err(other) => panic!("removing {name}: expected FileMissing, got {other:?}"),
            Ok(_) => panic!("removing {name}: expected FileMissing, got Ok"),
        }
    }
}

#[test]
fn neg_unreadable_file_is_io() {
    // Katalog w miejscu pliku: odczyt zwraca EISDIR (kind != NotFound), więc to `Io`.
    // Test nie wymaga uprawnień ani zmiany ustawień systemu.
    let tmp = TempDir::new("io");
    fs::create_dir(tmp.path().join("civs.json")).expect("mkdir in place of file");
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::Io { file, .. }) => assert_eq!(file_name_of(&file), "civs.json"),
        Err(other) => panic!("expected Io, got {other:?}"),
        Ok(_) => panic!("expected Io, got Ok"),
    }
}

#[test]
fn neg_empty_file_is_empty() {
    let tmp = TempDir::new("empty");
    tmp.write("civs.json", b"");
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::Empty { file }) => assert_eq!(file_name_of(&file), "civs.json"),
        Err(other) => panic!("expected Empty, got {other:?}"),
        Ok(_) => panic!("expected Empty, got Ok"),
    }
}

#[test]
fn neg_whitespace_only_file_is_empty() {
    let tmp = TempDir::new("whitespace");
    tmp.write("civs.json", b" \n\t\r\n ");
    assert!(matches!(
        load_file::<CivsFile>(tmp.path(), "civs.json"),
        Err(LoadError::Empty { .. })
    ));
}

#[test]
fn neg_truncated_json_is_invalid_json_with_position() {
    let tmp = TempDir::new("truncated");
    tmp.write("civs.json", br#"{"cywilizacje": [ {"Cywilizacja": "Grecy""#);
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::InvalidJson {
            file, line, column, ..
        }) => {
            assert_eq!(file_name_of(&file), "civs.json");
            assert_eq!(line, 1);
            assert!(column >= 1, "column must be reported, got {column}");
        }
        Err(other) => panic!("expected InvalidJson, got {other:?}"),
        Ok(_) => panic!("expected InvalidJson, got Ok"),
    }
}

#[test]
fn neg_syntax_error_is_invalid_json_on_second_line() {
    let tmp = TempDir::new("syntax");
    tmp.write("civs.json", b"{\n  \"cywilizacje\": ]\n}");
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::InvalidJson { line, .. }) => assert_eq!(line, 2),
        Err(other) => panic!("expected InvalidJson, got {other:?}"),
        Ok(_) => panic!("expected InvalidJson, got Ok"),
    }
}

#[test]
fn neg_number_where_object_expected_is_shape_mismatch_with_position() {
    let tmp = TempDir::new("shape-number");
    tmp.write("civs.json", b"42");
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::ShapeMismatch {
            file,
            line,
            column,
            message,
        }) => {
            assert_eq!(file_name_of(&file), "civs.json");
            assert_eq!(line, 1);
            assert!(column >= 1, "column must be reported, got {column}");
            assert!(message.contains("invalid type"), "message: {message}");
        }
        Err(other) => panic!("expected ShapeMismatch, got {other:?}"),
        Ok(_) => panic!("expected ShapeMismatch, got Ok"),
    }
}

#[test]
fn neg_missing_required_field_is_shape_mismatch_naming_field() {
    let tmp = TempDir::new("shape-field");
    tmp.write("civs.json", br#"{"cywilizacje": []}"#);
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::ShapeMismatch {
            file,
            line,
            message,
            ..
        }) => {
            assert_eq!(file_name_of(&file), "civs.json");
            assert_eq!(line, 1);
            assert!(
                message.contains("missing field `start_gry`"),
                "message: {message}"
            );
        }
        Err(other) => panic!("expected ShapeMismatch, got {other:?}"),
        Ok(_) => panic!("expected ShapeMismatch, got Ok"),
    }
}

#[test]
fn neg_missing_directory_is_directory_missing() {
    let tmp = TempDir::new("nodir");
    let missing = tmp.path().join("nie-istnieje");
    match load_all(&missing) {
        Err(LoadError::DirectoryMissing { path }) => assert_eq!(path, missing),
        Err(other) => panic!("expected DirectoryMissing, got {other:?}"),
        Ok(_) => panic!("expected DirectoryMissing, got Ok"),
    }
}

#[test]
fn neg_path_that_is_a_file_is_directory_missing() {
    let tmp = TempDir::new("notdir");
    tmp.write("plik.txt", b"x");
    let as_dir = tmp.path().join("plik.txt");
    match load_all(&as_dir) {
        Err(LoadError::DirectoryMissing { path }) => assert_eq!(path, as_dir),
        Err(other) => panic!("expected DirectoryMissing, got {other:?}"),
        Ok(_) => panic!("expected DirectoryMissing, got Ok"),
    }
}

#[test]
fn neg_non_utf8_file_is_not_utf8() {
    let tmp = TempDir::new("nonutf8");
    tmp.write("civs.json", &[0x7b, 0xff, 0xfe, 0x7d]);
    match load_file::<CivsFile>(tmp.path(), "civs.json") {
        Err(LoadError::NotUtf8 { file, .. }) => assert_eq!(file_name_of(&file), "civs.json"),
        Err(other) => panic!("expected NotUtf8, got {other:?}"),
        Ok(_) => panic!("expected NotUtf8, got Ok"),
    }
}
