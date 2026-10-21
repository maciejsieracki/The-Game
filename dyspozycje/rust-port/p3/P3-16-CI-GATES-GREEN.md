# P3.16 — CI gates green (fmt, clippy poza src/data)

TEMAT: R-RUSTPORT-P3-16-CI-GATES-GREEN-Q1
DOMAIN: GAME
BAZA: `origin/rust-port/parity-v2` = `aa7b225b` (P3.14), checkout --detach.
RUNDA: 1/5 (Operator, Haiku 5.5 medium)

## Zakres zmian (allowlista)

- `rust-port/engine/tests/data_buildings_tech.rs`, `tests/data_civilizations.rs`, `tests/data_economy_society.rs`, `tests/data_units_combat.rs`, `src/data/loader.rs` — WYŁĄCZNIE formatowanie `rustfmt --edition 2021`.
- `rust-port/engine/src/bridge.rs` — `#[allow(clippy::large_enum_variant)]` na `EngineCommand` (bez zmiany typów, serde i kontraktu JSON). Uzasadnienie: boxing `CreateSession.params` wymagałby zmiany `tests/bridge_contract.rs` (root `tests/`, poza allowlistą).
- Dokument i katalog runu.

Nie zmieniono: `tests/data_compliance.rs`, `src/data/{buildings_tech,economy_society*,terrain_map,units_combat}.rs`, `domain/**`, `Cargo.toml`, `lib.rs`, `gra/**`.

## Wynik binarny

| Bramka | Przed | Po |
|---|---|---|
| `rustfmt --check` na 5 plikach allowlisty | czerwone | EXIT=0 (wszystkie 5) |
| `cargo fmt --all -- --check` | EXIT=1 | EXIT=1 — pliki spoza allowlisty, patrz niżej |
| `cargo clippy --all-targets -- -D warnings` | EXIT=101 (bridge.rs:22 + duplicated_attributes) | EXIT=101 — tylko `duplicated_attributes` w `tests/data_compliance.rs` i `src/data/*` (spoza allowlisty) |
| `cargo clippy --test bridge_add_player -- -D warnings` | EXIT=101 (large_enum_variant) | EXIT=0 |
| `cargo test --offline` | EXIT=0, 292 passed | EXIT=0, 292 passed |

Pliki spoza allowlisty, które nadal blokują gate (NIE ruszane):
- `cargo fmt --check` (diffy): `src/data/mod.rs`, `tests/assets_manifest.rs`, `tests/data_compliance.rs`, `tests/data_loader.rs`.
- `cargo clippy --all-targets`: 5 x `duplicated attribute` (`#![allow(dead_code)]` w `src/data/{buildings_tech,units_combat,economy_society,economy_society_part2,terrain_map}.rs` koliduje z `#[allow(dead_code)]` w `tests/data_compliance.rs`). To zakres P3.15 / osobnego tematu.
- Po `--keep-going` nie ma innych błędów ani ostrzeżeń clippy (patrz log).

## Uwaga o dysku współdzielonym

`CARGO_TARGET_DIR=/home/user/cargo-target-shared` jest współdzielony przez worktree. Hash artefaktów path-dependency nie zależy od worktree, więc przebieg `cargo test` po zmianie innego worktree dał binarkę `data_compliance` z innej wersji źródła (39 testów zamiast 9 w źródle tego worktree). Po `touch` plików źródłowych w tym worktree wynik wrócił do 292 i tym wynikiem jest przebieg "PO" poniżej.

## Surowe wyjścia PRZED (baseline, aa7b225b)

### cargo fmt --all -- --check
```text
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/src/data/loader.rs:28:
 use serde::de::DeserializeOwned;
 use serde_json::error::Category;
 
[32m+use super::buildings_tech::{Building, TechFile, Wonders};
[m use super::civilizations::{
     AcceptancePointsFile, CityNamesPoolsFile, CivAiFile, CivMatrixFile, CivParamsFile, CivsFile,
     DiplomacyFile,
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/src/data/loader.rs:34:
 };
[31m-use super::buildings_tech::{Building, TechFile, Wonders};
[m use super::economy_society::{
     CitizenResourceUpkeep, EconParams, EpokaLudnoscManpower, MiastoParams, ResourceItem,
     SocietyParams,
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/src/data/loader.rs:88:
                 write!(formatter, "data file is missing: {}", file.display())
             }
             Self::Io { file, source } => {
[31m-                write!(formatter, "cannot read data file {}: {source}", file.display())
[m[32m+                write!(
[m[32m+                    formatter,
[m[32m+                    "cannot read data file {}: {source}",
[m[32m+                    file.display()
[m[32m+                )
[m             }
             Self::Empty { file } => write!(formatter, "data file is empty: {}", file.display()),
             Self::NotUtf8 { file, source } => {
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/src/data/loader.rs:95:
[31m-                write!(formatter, "data file is not valid UTF-8 {}: {source}", file.display())
[m[32m+                write!(
[m[32m+                    formatter,
[m[32m+                    "data file is not valid UTF-8 {}: {source}",
[m[32m+                    file.display()
[m[32m+                )
[m             }
             Self::InvalidJson {
                 file,
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/src/data/mod.rs:10:
 pub mod civilizations;
 pub mod economy_society;
 pub mod economy_society_part2;
[32m+pub mod loader;
[m pub mod terrain_map;
 pub mod units_combat;
[31m-pub mod loader;
[m 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:29:
 }
 
 fn manifest_path() -> PathBuf {
[31m-    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("assets").join("MANIFEST.tsv")
[m[32m+    Path::new(env!("CARGO_MANIFEST_DIR"))
[m[32m+        .join("..")
[m[32m+        .join("assets")
[m[32m+        .join("MANIFEST.tsv")
[m }
 
 fn assets_dir() -> PathBuf {
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:36:
[31m-    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("assets")
[m[32m+    Path::new(env!("CARGO_MANIFEST_DIR"))
[m[32m+        .join("..")
[m[32m+        .join("assets")
[m }
 
 /// Parsuje manifest; zwraca wpisy danych (bez nagłówka). Błąd przy złym nagłówku lub kolumnach.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:109:
         if path.is_dir() {
             walk_files(&path, root, out);
         } else {
[31m-            let rel = path.strip_prefix(root).expect("prefix").to_string_lossy().replace('\\', "/");
[m[32m+            let rel = path
[m[32m+                .strip_prefix(root)
[m[32m+                .expect("prefix")
[m[32m+                .to_string_lossy()
[m[32m+                .replace('\\', "/");
[m             out.insert(rel);
         }
     }
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:120:
 // ---------------------------------------------------------------------------
 
 fn sha1(data: &[u8]) -> [u8; 20] {
[31m-    let mut h: [u32; 5] = [0x6745_2301, 0xEFCD_AB89, 0x98BA_DCFE, 0x1032_5476, 0xC3D2_E1F0];
[m[32m+    let mut h: [u32; 5] = [
[m[32m+        0x6745_2301,
[m[32m+        0xEFCD_AB89,
[m[32m+        0x98BA_DCFE,
[m[32m+        0x1032_5476,
[m[32m+        0xC3D2_E1F0,
[m[32m+    ];
[m     let bit_len = (data.len() as u64).wrapping_mul(8);
     let mut msg = Vec::with_capacity(data.len() + 72);
     msg.extend_from_slice(data);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:133:
     for chunk in msg.chunks_exact(64) {
         let mut w = [0u32; 80];
         for i in 0..16 {
[31m-            w[i] = u32::from_be_bytes([chunk[4 * i], chunk[4 * i + 1], chunk[4 * i + 2], chunk[4 * i + 3]]);
[m[32m+            w[i] = u32::from_be_bytes([
[m[32m+                chunk[4 * i],
[m[32m+                chunk[4 * i + 1],
[m[32m+                chunk[4 * i + 2],
[m[32m+                chunk[4 * i + 3],
[m[32m+            ]);
[m         }
         for i in 16..80 {
             w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:194:
 fn sha1_matches_known_vectors() {
     // FIPS 180-4 / powszechnie znane wektory; źródło: RFC 3174 / NIST.
     assert_eq!(hex(&sha1(b"")), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
[31m-    assert_eq!(hex(&sha1(b"abc")), "a9993e364706816aba3e25717850c26c9cd0d89d");
[m     assert_eq!(
[31m-        hex(&sha1(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")),
[m[32m+        hex(&sha1(b"abc")),
[m[32m+        "a9993e364706816aba3e25717850c26c9cd0d89d"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        hex(&sha1(
[m[32m+            b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
[m[32m+        )),
[m         "84983e441c3bd26ebaae4aa1f95129e5e54670f1"
     );
     // git blob pustego pliku (git hash-object /dev/null)
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:203:
[31m-    assert_eq!(git_blob_sha1_hex(b""), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
[m[32m+    assert_eq!(
[m[32m+        git_blob_sha1_hex(b""),
[m[32m+        "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:209:
     let first = text.split('\n').next().expect("pierwszy wiersz");
     assert_eq!(first, MANIFEST_HEADER, "nagłówek manifestu");
     let entries = parse_manifest(&text).expect("parse");
[31m-    assert_eq!(entries.len(), EXPECTED_DATA_ROWS, "liczba wierszy danych (P3-8: 428/428)");
[m[32m+    assert_eq!(
[m[32m+        entries.len(),
[m[32m+        EXPECTED_DATA_ROWS,
[m[32m+        "liczba wierszy danych (P3-8: 428/428)"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:216:
 fn manifest_dest_paths_are_unique() {
     let entries = load_manifest();
     let unique: BTreeSet<&str> = entries.iter().map(|e| e.dst.as_str()).collect();
[31m-    assert_eq!(unique.len(), entries.len(), "ścieżki docelowe muszą być unikalne");
[m[32m+    assert_eq!(
[m[32m+        unique.len(),
[m[32m+        entries.len(),
[m[32m+        "ścieżki docelowe muszą być unikalne"
[m[32m+    );
[m     for e in &entries {
[31m-        assert!(e.dst.starts_with(DEST_PREFIX), "prefiks docelowy: {}", e.dst);
[m[32m+        assert!(
[m[32m+            e.dst.starts_with(DEST_PREFIX),
[m[32m+            "prefiks docelowy: {}",
[m[32m+            e.dst
[m[32m+        );
[m     }
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:226:
 fn every_manifest_entry_exists_with_declared_size() {
     let entries = load_manifest();
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert!(errors.is_empty(), "rozbieżności manifestu z katalogiem:\n{}", errors.join("\n"));
[m[32m+    assert!(
[m[32m+        errors.is_empty(),
[m[32m+        "rozbieżności manifestu z katalogiem:\n{}",
[m[32m+        errors.join("\n")
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:233:
 fn every_entry_blob_sha1_matches_manifest_column() {
     let entries = load_manifest();
     let errors = validate(&entries, &repo_root(), true);
[31m-    assert!(errors.is_empty(), "rozbieżności blob-SHA1:\n{}", errors.join("\n"));
[m[32m+    assert!(
[m[32m+        errors.is_empty(),
[m[32m+        "rozbieżności blob-SHA1:\n{}",
[m[32m+        errors.join("\n")
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:248:
     let extra: Vec<&String> = on_disk.difference(&expected).collect();
     let missing: Vec<&String> = expected.difference(&on_disk).collect();
     assert!(extra.is_empty(), "pliki spoza manifestu: {extra:?}");
[31m-    assert!(missing.is_empty(), "pliki z manifestu brak na dysku: {missing:?}");
[m[32m+    assert!(
[m[32m+        missing.is_empty(),
[m[32m+        "pliki z manifestu brak na dysku: {missing:?}"
[m[32m+    );
[m     assert_eq!(on_disk.len(), EXPECTED_DATA_ROWS);
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:268:
     assert_eq!(counts.get("jpg"), Some(&45), "jpg");
     assert_eq!(counts.get("png"), Some(&2), "png");
     assert_eq!(counts.get("mp3"), Some(&62), "mp3");
[31m-    assert_eq!(counts.values().sum::<usize>(), EXPECTED_DATA_ROWS, "suma rozszerzeń");
[m[32m+    assert_eq!(
[m[32m+        counts.values().sum::<usize>(),
[m[32m+        EXPECTED_DATA_ROWS,
[m[32m+        "suma rozszerzeń"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:287:
         slot.0 += 1;
         slot.1 += e.size;
     }
[31m-    assert_eq!(sums.get("icons"), Some(&(319, 136_176)), "ikony (P1.11 §2 wiersze 26+27)");
[m[31m-    assert_eq!(sums.get("portraits"), Some(&(45, 445_951)), "portrety (P1.11 §2 wiersz 28)");
[m[31m-    assert_eq!(sums.get("hero"), Some(&(2, 4_214_674)), "hero (P1.11 §2 wiersz 29)");
[m[31m-    assert_eq!(sums.get("music"), Some(&(62, 44_584_683)), "muzyka (P1.11 §2 wiersze 31+32)");
[m[31m-    assert_eq!(sums.len(), 4, "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)");
[m[32m+    assert_eq!(
[m[32m+        sums.get("icons"),
[m[32m+        Some(&(319, 136_176)),
[m[32m+        "ikony (P1.11 §2 wiersze 26+27)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("portraits"),
[m[32m+        Some(&(45, 445_951)),
[m[32m+        "portrety (P1.11 §2 wiersz 28)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("hero"),
[m[32m+        Some(&(2, 4_214_674)),
[m[32m+        "hero (P1.11 §2 wiersz 29)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("music"),
[m[32m+        Some(&(62, 44_584_683)),
[m[32m+        "muzyka (P1.11 §2 wiersze 31+32)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.len(),
[m[32m+        4,
[m[32m+        "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:298:
 fn negative_validator_rejects_wrong_size() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     entries[1].size += 1;
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert_eq!(errors.len(), 1, "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("size mismatch"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:309:
 fn negative_validator_rejects_missing_file() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     entries[0].dst = "rust-port/assets/icons/does-not-exist-xyz.svg".to_string();
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert_eq!(errors.len(), 1, "brakujący plik musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "brakujący plik musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("brak pliku"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:320:
 fn negative_validator_rejects_duplicate_dest() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     let dup = entries[0].clone();
     entries.push(dup);
     let errors = validate(&entries, &repo_root(), false);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:327:
[31m-    assert_eq!(errors.len(), 1, "duplikat musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "duplikat musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("duplikat"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:333:
     let mut entries = load_manifest();
     entries.truncate(2);
     let real = validate(&entries, &repo_root(), true);
[31m-    assert!(real.is_empty(), "kontrola: prawdziwe SHA przechodzą: {real:?}");
[m[32m+    assert!(
[m[32m+        real.is_empty(),
[m[32m+        "kontrola: prawdziwe SHA przechodzą: {real:?}"
[m[32m+    );
[m     entries[0].sha = "0".repeat(40);
     let errors = validate(&entries, &repo_root(), true);
[31m-    assert_eq!(errors.len(), 1, "zły SHA musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "zły SHA musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("sha mismatch"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:343:
 #[test]
 fn negative_parser_rejects_bad_header_and_columns() {
     let real = fs::read_to_string(manifest_path()).expect("MANIFEST.tsv czytelny");
[31m-    assert!(parse_manifest(&real).is_ok(), "kontrola: prawdziwy manifest parsuje się");
[m[32m+    assert!(
[m[32m+        parse_manifest(&real).is_ok(),
[m[32m+        "kontrola: prawdziwy manifest parsuje się"
[m[32m+    );
[m     let bad_header = "sha\tsize\tsrc\tdst\na\t1\tb\tc\n";
[31m-    assert!(parse_manifest(bad_header).is_err(), "zły nagłówek musi być odrzucony");
[m[32m+    assert!(
[m[32m+        parse_manifest(bad_header).is_err(),
[m[32m+        "zły nagłówek musi być odrzucony"
[m[32m+    );
[m     let bad_cols = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\n");
[31m-    assert!(parse_manifest(&bad_cols).is_err(), "wiersz z 3 kolumnami musi być odrzucony");
[m[32m+    assert!(
[m[32m+        parse_manifest(&bad_cols).is_err(),
[m[32m+        "wiersz z 3 kolumnami musi być odrzucony"
[m[32m+    );
[m     let blank_mid = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\tdst\n\nabc\t1\tsrc\tdst2\n");
[31m-    assert!(parse_manifest(&blank_mid).is_err(), "pusta linia w środku musi być odrzucona");
[m[32m+    assert!(
[m[32m+        parse_manifest(&blank_mid).is_err(),
[m[32m+        "pusta linia w środku musi być odrzucona"
[m[32m+    );
[m }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_buildings_tech.rs:12:
     let buildings = parse_buildings().expect("buildings.json musi się sparsować");
     // Niezależnie policzone: 42 rekordy, 41 z `koszt_surowce`.
     assert_eq!(buildings.len(), 42);
[31m-    assert_eq!(buildings.iter().filter(|b| b.koszt_surowce.is_some()).count(), 41);
[m[32m+    assert_eq!(
[m[32m+        buildings
[m[32m+            .iter()
[m[32m+            .filter(|b| b.koszt_surowce.is_some())
[m[32m+            .count(),
[m[32m+        41
[m[32m+    );
[m     // Suma `kosztBudowy` po wszystkich rekordach = 1736; suma `epokaWejscia` = 89.
     let suma_koszt: i64 = buildings.iter().map(|b| b.koszt_budowy).sum();
     assert_eq!(suma_koszt, 1736);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_civilizations.rs:7:
 
 use civilizations::{
     parse_city_names_pools, parse_civ_ai, parse_civ_matrix, parse_civ_params, parse_civs,
[31m-    parse_diplomacy, parse_diplomacy_acceptance_points, Num, WartoscValue, CIVS_JSON,
[m[31m-    CIV_AI_JSON, CIV_MATRIX_JSON, CIV_PARAMS_JSON, CITY_NAMES_POOLS_JSON,
[m[31m-    DIPLOMACY_ACCEPTANCE_POINTS_JSON, DIPLOMACY_JSON,
[m[32m+    parse_diplomacy, parse_diplomacy_acceptance_points, Num, WartoscValue, CITY_NAMES_POOLS_JSON,
[m[32m+    CIVS_JSON, CIV_AI_JSON, CIV_MATRIX_JSON, CIV_PARAMS_JSON, DIPLOMACY_ACCEPTANCE_POINTS_JSON,
[m[32m+    DIPLOMACY_JSON,
[m };
 use serde_json::Value;
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_civilizations.rs:60:
     assert!(f.cywilizacje.iter().all(|c| c.params.len() == 93));
     // Typ liczby zachowany z JSON: default int (2), per-cywilizacja float (2.3).
     assert_eq!(f.defaults["meta_mnoznik_waluta"], Num::Int(2));
[31m-    assert_eq!(f.cywilizacje[0].params["meta_mnoznik_waluta"], Num::Float(2.3));
[m[32m+    assert_eq!(
[m[32m+        f.cywilizacje[0].params["meta_mnoznik_waluta"],
[m[32m+        Num::Float(2.3)
[m[32m+    );
[m     println!(
         "SPOT civ-matrix paramDefs={} defaults={} cywilizacje={} babilonia.tier={} grecy.meta={:?} default.meta={:?}",
         f.param_defs.len(),
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:8:
 // Testy nie duplikuja asercji z data_*.rs; dodaja: kompletnosc ID/licznosci wzgledem web oraz
 // probe parsowania wszystkich 29 plikow `rust-port/engine/data/*.json`.
 
[31m-#[path = "../src/data/civilizations.rs"]
[m[31m-#[allow(dead_code)]
[m[31m-mod civilizations;
[m #[path = "../src/data/buildings_tech.rs"]
 #[allow(dead_code)]
 mod buildings_tech;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:17:
[31m-#[path = "../src/data/units_combat.rs"]
[m[32m+#[path = "../src/data/civilizations.rs"]
[m #[allow(dead_code)]
[31m-mod units_combat;
[m[32m+mod civilizations;
[m #[path = "../src/data/economy_society.rs"]
 #[allow(dead_code)]
 mod economy_society;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:26:
 #[path = "../src/data/terrain_map.rs"]
 #[allow(dead_code)]
 mod terrain_map;
[32m+#[path = "../src/data/units_combat.rs"]
[m[32m+#[allow(dead_code)]
[m[32m+mod units_combat;
[m 
 use serde_json::Value;
 use std::collections::BTreeSet;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:59:
 
 fn no_dups(name: &str, ids: &[&str]) {
     let s: BTreeSet<&str> = ids.iter().copied().collect();
[31m-    assert_eq!(s.len(), ids.len(), "{name}: duplicate IDs in Rust collection");
[m[32m+    assert_eq!(
[m[32m+        s.len(),
[m[32m+        ids.len(),
[m[32m+        "{name}: duplicate IDs in Rust collection"
[m[32m+    );
[m }
 
 // ---------------------------------------------------------------------------
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:95:
     assert_eq!(WEB_TERRAIN_TYPES.len(), WEB_TERRAIN_TYPES_COUNT);
     assert_eq!(WEB_IMPROVEMENT_KEYS.len(), WEB_IMPROVEMENT_COUNT);
     // Stale ID wewnetrznie spojne z pinem (typ cywilizacji == klucze panstw cudow).
[31m-    assert_eq!(set(WEB_CIV_TYPY.iter().copied()), set(WEB_PANSTWA_KEYS.iter().copied()));
[m[31m-    assert_eq!(set(WEB_PANSTWA_KEYS.iter().copied()), set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied()));
[m[32m+    assert_eq!(
[m[32m+        set(WEB_CIV_TYPY.iter().copied()),
[m[32m+        set(WEB_PANSTWA_KEYS.iter().copied())
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        set(WEB_PANSTWA_KEYS.iter().copied()),
[m[32m+        set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied())
[m[32m+    );
[m }
 
 // (a) liczba i ID cywilizacji: Rust == web na pinie.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:105:
     let f = parse_civs().expect("civs.json");
     assert_eq!(f.cywilizacje.len(), WEB_CIV_COUNT);
     assert_eq!(f.start_gry.len(), WEB_START_GRY_COUNT);
[31m-    no_dups("civs.cywilizacja", &f.cywilizacje.iter().map(|c| c.cywilizacja.as_str()).collect::<Vec<_>>());
[m[31m-    no_dups("civs.typ_cywilizacji", &f.cywilizacje.iter().map(|c| c.typ_cywilizacji.as_str()).collect::<Vec<_>>());
[m[32m+    no_dups(
[m[32m+        "civs.cywilizacja",
[m[32m+        &f.cywilizacje
[m[32m+            .iter()
[m[32m+            .map(|c| c.cywilizacja.as_str())
[m[32m+            .collect::<Vec<_>>(),
[m[32m+    );
[m[32m+    no_dups(
[m[32m+        "civs.typ_cywilizacji",
[m[32m+        &f.cywilizacje
[m[32m+            .iter()
[m[32m+            .map(|c| c.typ_cywilizacji.as_str())
[m[32m+            .collect::<Vec<_>>(),
[m[32m+    );
[m     assert_eq!(
         set(f.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
         set(WEB_CIV_NAMES.iter().copied()),
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:169:
 #[test]
 fn collection_counts_match_web_pin() {
     assert_eq!(parse_units().expect("units").len(), WEB_UNITS_COUNT);
[31m-    assert_eq!(parse_buildings().expect("buildings").len(), WEB_BUILDINGS_COUNT);
[m[31m-    assert_eq!(parse_tech().expect("tech").technologie.len(), WEB_TECH_COUNT);
[m[32m+    assert_eq!(
[m[32m+        parse_buildings().expect("buildings").len(),
[m[32m+        WEB_BUILDINGS_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        parse_tech().expect("tech").technologie.len(),
[m[32m+        WEB_TECH_COUNT
[m[32m+    );
[m     let w = parse_wonders().expect("wonders");
     assert_eq!(w.cuda.len(), WEB_CUDA_COUNT);
     assert_eq!(w.parkowane_epoka4plus.len(), WEB_PARKOWANE_COUNT);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:177:
     assert_eq!(w.panstwa.len(), WEB_PANSTWA_COUNT);
[31m-    assert_eq!(parse_resources().expect("resources").len(), WEB_RESOURCES_COUNT);
[m[32m+    assert_eq!(
[m[32m+        parse_resources().expect("resources").len(),
[m[32m+        WEB_RESOURCES_COUNT
[m[32m+    );
[m     let ty = parse_terrain_yields().expect("terrain-yields");
     assert_eq!(ty.terrain_types.len(), WEB_TERRAIN_TYPES_COUNT);
     assert_eq!(ty.terrain_modifiers.len(), WEB_TERRAIN_MODIFIERS_COUNT);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:186:
     let units = parse_units().expect("units");
     let names: Vec<&str> = units.iter().map(|u| u.jednostka.as_str()).collect();
     no_dups("units.Jednostka", &names);
[31m-    assert_eq!(set(names.iter().copied()), set(WEB_UNITS_JEDNOSTKA.iter().copied()), "units");
[m[32m+    assert_eq!(
[m[32m+        set(names.iter().copied()),
[m[32m+        set(WEB_UNITS_JEDNOSTKA.iter().copied()),
[m[32m+        "units"
[m[32m+    );
[m 
     let b = parse_buildings().expect("buildings");
     let ids: Vec<&str> = b.iter().map(|x| x.id.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:193:
     no_dups("buildings.id", &ids);
[31m-    assert_eq!(set(ids.iter().copied()), set(WEB_BUILDING_IDS.iter().copied()), "buildings");
[m[32m+    assert_eq!(
[m[32m+        set(ids.iter().copied()),
[m[32m+        set(WEB_BUILDING_IDS.iter().copied()),
[m[32m+        "buildings"
[m[32m+    );
[m 
     let t = parse_tech().expect("tech");
[31m-    let tn: Vec<&str> = t.technologie.iter().map(|x| x.technologia.as_str()).collect();
[m[32m+    let tn: Vec<&str> = t
[m[32m+        .technologie
[m[32m+        .iter()
[m[32m+        .map(|x| x.technologia.as_str())
[m[32m+        .collect();
[m     no_dups("tech.Technologia", &tn);
[31m-    assert_eq!(set(tn.iter().copied()), set(WEB_TECH_NAMES.iter().copied()), "tech");
[m[32m+    assert_eq!(
[m[32m+        set(tn.iter().copied()),
[m[32m+        set(WEB_TECH_NAMES.iter().copied()),
[m[32m+        "tech"
[m[32m+    );
[m 
     let w = parse_wonders().expect("wonders");
     let cuda: Vec<&str> = w.cuda.iter().map(|c| c.id.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:203:
     no_dups("cuda.id", &cuda);
[31m-    assert_eq!(set(cuda.iter().copied()), set(WEB_CUDA_IDS.iter().copied()), "cuda");
[m[31m-    let park: Vec<&str> = w.parkowane_epoka4plus.iter().map(|c| c.id.as_str()).collect();
[m[31m-    assert_eq!(set(park.iter().copied()), set(WEB_PARKOWANE_IDS.iter().copied()), "parkowane");
[m[32m+    assert_eq!(
[m[32m+        set(cuda.iter().copied()),
[m[32m+        set(WEB_CUDA_IDS.iter().copied()),
[m[32m+        "cuda"
[m[32m+    );
[m[32m+    let park: Vec<&str> = w
[m[32m+        .parkowane_epoka4plus
[m[32m+        .iter()
[m[32m+        .map(|c| c.id.as_str())
[m[32m+        .collect();
[m[32m+    assert_eq!(
[m[32m+        set(park.iter().copied()),
[m[32m+        set(WEB_PARKOWANE_IDS.iter().copied()),
[m[32m+        "parkowane"
[m[32m+    );
[m 
     let res = parse_resources().expect("resources");
     let rn: Vec<&str> = res.iter().map(|r| r.surowiec.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:210:
     no_dups("resources.Surowiec", &rn);
[31m-    assert_eq!(set(rn.iter().copied()), set(WEB_RESOURCES.iter().copied()), "resources");
[m[32m+    assert_eq!(
[m[32m+        set(rn.iter().copied()),
[m[32m+        set(WEB_RESOURCES.iter().copied()),
[m[32m+        "resources"
[m[32m+    );
[m 
     let ty = parse_terrain_yields().expect("terrain-yields");
     let tt: Vec<&str> = ty.terrain_types.iter().map(|x| x.teren.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:215:
     no_dups("terrain_types.Teren", &tt);
[31m-    assert_eq!(set(tt.iter().copied()), set(WEB_TERRAIN_TYPES.iter().copied()), "terrain types");
[m[32m+    assert_eq!(
[m[32m+        set(tt.iter().copied()),
[m[32m+        set(WEB_TERRAIN_TYPES.iter().copied()),
[m[32m+        "terrain types"
[m[32m+    );
[m }
 
 // Embedded kopie (include_str! w src/data) == web: liczby z surowego Value, niezalezne od struktur.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:220:
 #[test]
 fn embedded_raw_counts_match_web_pin() {
     assert_eq!(raw(UNITS_JSON).as_array().unwrap().len(), WEB_UNITS_COUNT);
[31m-    assert_eq!(raw(BUILDINGS_JSON).as_array().unwrap().len(), WEB_BUILDINGS_COUNT);
[m[31m-    assert_eq!(raw(TECH_JSON)["technologie"].as_array().unwrap().len(), WEB_TECH_COUNT);
[m[31m-    assert_eq!(raw(include_str!("../data/resources.json")).as_array().unwrap().len(), WEB_RESOURCES_COUNT);
[m[32m+    assert_eq!(
[m[32m+        raw(BUILDINGS_JSON).as_array().unwrap().len(),
[m[32m+        WEB_BUILDINGS_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        raw(TECH_JSON)["technologie"].as_array().unwrap().len(),
[m[32m+        WEB_TECH_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        raw(include_str!("../data/resources.json"))
[m[32m+            .as_array()
[m[32m+            .unwrap()
[m[32m+            .len(),
[m[32m+        WEB_RESOURCES_COUNT
[m[32m+    );
[m     let imp = raw(TERRAIN_IMPROVEMENTS_JSON);
     let keys: BTreeSet<&str> = imp
         .as_object()
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:232:
         .filter(|k| !k.starts_with('_'))
         .collect();
     assert_eq!(keys.len(), WEB_IMPROVEMENT_COUNT);
[31m-    assert_eq!(keys, set(WEB_IMPROVEMENT_KEYS.iter().copied()), "terrain-improvements klucze != web");
[m[32m+    assert_eq!(
[m[32m+        keys,
[m[32m+        set(WEB_IMPROVEMENT_KEYS.iter().copied()),
[m[32m+        "terrain-improvements klucze != web"
[m[32m+    );
[m }
 
 // terrain-improvements: struktura ma deny_unknown_fields, wiec sukces parsowania dowodzi tylko, ze
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:240:
 // (brakujace pole Option przechodzi bez bledu). Sprawdzane sa tylko dwa pola jako probka.
 #[test]
 fn terrain_improvements_parses_strict_with_farma_and_posterunek() {
[31m-    let f = parse_terrain_improvements().expect("terrain-improvements.json must parse (deny_unknown_fields)");
[m[32m+    let f = parse_terrain_improvements()
[m[32m+        .expect("terrain-improvements.json must parse (deny_unknown_fields)");
[m     assert!(!f.farma.nazwa.is_empty());
     assert!(!f.posterunek.nazwa.is_empty());
 }
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:262:
     probe!("civ-params.json", parse_civ_params());
     probe!("civ-ai.json", parse_civ_ai());
     probe!("diplomacy.json", parse_diplomacy());
[31m-    probe!("diplomacy-acceptance-points.json", parse_diplomacy_acceptance_points());
[m[32m+    probe!(
[m[32m+        "diplomacy-acceptance-points.json",
[m[32m+        parse_diplomacy_acceptance_points()
[m[32m+    );
[m     probe!("city-names-pools.json", parse_city_names_pools());
     probe!("buildings.json", parse_buildings());
     probe!("wonders.json", parse_wonders());
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:275:
     probe!("power-params.json", parse_power_params());
     probe!("econ-params.json", parse_econ_params());
     probe!("society-params.json", parse_society_params());
[31m-    probe!("epoka-ludnosc-manpower.json", parse_epoka_ludnosc_manpower());
[m[31m-    probe!("citizen-resource-upkeep.json", parse_citizen_resource_upkeep());
[m[32m+    probe!(
[m[32m+        "epoka-ludnosc-manpower.json",
[m[32m+        parse_epoka_ludnosc_manpower()
[m[32m+    );
[m[32m+    probe!(
[m[32m+        "citizen-resource-upkeep.json",
[m[32m+        parse_citizen_resource_upkeep()
[m[32m+    );
[m     probe!("miasto-params.json", parse_miasto_params());
     probe!("resources.json", parse_resources());
     probe!("e-start-params.json", parse_e_start_params());
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:293:
         .filter_map(|e| e.ok())
         .filter(|e| e.path().extension().is_some_and(|x| x == "json"))
         .count();
[31m-    assert_eq!(on_disk, ok, "pliki *.json w rust-port/engine/data nieobjete probe");
[m[32m+    assert_eq!(
[m[32m+        on_disk, ok,
[m[32m+        "pliki *.json w rust-port/engine/data nieobjete probe"
[m[32m+    );
[m }
 
 // (c, LUKA — nie test): 1:1 round-trip (typed -> Value == raw) mozliwy dzis TYLKO dla 7 plikow
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:303:
 
 // Stale ID z web (generowane z gra/data/*.json @ edb8fb56, wklejone literalnie).
 const WEB_CIV_NAMES: &[&str] = &[
[31m-    "Grecy", "Rzymianie", "Chińczycy", "Inkowie", "Zulusi", "Egipt", "Sumerowie", "Celtowie",
[m[31m-    "Germanie", "Harappa", "Hetyci", "Słowianie", "Babilonia", "Asyria", "Fenicjanie",
[m[32m+    "Grecy",
[m[32m+    "Rzymianie",
[m[32m+    "Chińczycy",
[m[32m+    "Inkowie",
[m[32m+    "Zulusi",
[m[32m+    "Egipt",
[m[32m+    "Sumerowie",
[m[32m+    "Celtowie",
[m[32m+    "Germanie",
[m[32m+    "Harappa",
[m[32m+    "Hetyci",
[m[32m+    "Słowianie",
[m[32m+    "Babilonia",
[m[32m+    "Asyria",
[m[32m+    "Fenicjanie",
[m ]; // civs.json .cywilizacje[].Cywilizacja
 const WEB_CIV_TYPY: &[&str] = &[
[31m-    "grecy", "rzymianie", "chinczycy", "inkowie", "zulusi", "egipt", "sumer", "celtowie",
[m[31m-    "germanie", "harappa", "hetyci", "slowianie", "babilonia", "asyria", "fenicjanie",
[m[32m+    "grecy",
[m[32m+    "rzymianie",
[m[32m+    "chinczycy",
[m[32m+    "inkowie",
[m[32m+    "zulusi",
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "celtowie",
[m[32m+    "germanie",
[m[32m+    "harappa",
[m[32m+    "hetyci",
[m[32m+    "slowianie",
[m[32m+    "babilonia",
[m[32m+    "asyria",
[m[32m+    "fenicjanie",
[m ]; // civs.json .cywilizacje[].typCywilizacji (ID)
 
[31m-const WEB_UNITS_JEDNOSTKA: &[&str] = &["Wojownik", "Procarz", "Oszczepnik", "Łucznik", "Zwiadowca", "Włócznik", "Wojownik z mieczem i tarczą", "Rydwan (woły)", "Konnica", "Galera", "Falanga", "Hieros Lochos (Święty Zastęp)", "Hastati", "Triari", "Jeździec chiński", "Hu Ben Wei (Gwardia Tygrysa)", "Impi", "Oszczepnik Zulu (Izijula)", "uThulwana (Białe Tarcze)", "Wojownik z maczugą (Chaska)", "Wojownik z toporem", "Procarz (Huaracoc)", "Oszczepnik (Estólica)", "Królewska Gwardia", "Rydwan konny", "Łucznik egipski", "Rydwan egipski", "Wojownik z khopesh", "Medżaj (Gwardia Faraona)", "Łucznik nubijski", "Łucznik sumeryjski", "Rydwan sumeryjski", "Włócznik sumeryjski", "Gwardia Królewska Sumeru", "Wojownik mykeński", "Rydwan mykeński", "Wojownik Sherden", "Halabardnik Shang", "Rydwan Shang", "Łucznik akadyjski", "Gaesatae", "Soldurii", "Rydwan celtycki", "Wojownik germański", "Berserker germański", "Taran", "Taran okuty", "Katapulta", "Wieża oblężnicza", "Wojownik tyrreński", "Wojownik szekelesz", "Konnica lancowa asyryjska", "Konnica łucznicza asyryjska", "Łucznik asyryjski", "Drużynnik", "Jeździec z oszczepami", "Strażnik bram Harappy", "Piechota induska", "Garnizon Harappy", "Rydwan Kapadokijski", "Piechota hetycka", "Gwardia hetycka", "Gwardia Ishtar", "Wojownik babiloński", "Piechota neobabilońska", "Tyrski miecznik", "Wojownik fenicki", "Gwardia Tyreńska", "Thorakites", "Evocati", "iButho z iklwa", "Gwardzista z champi", "Wojownik z żelaznym khopesh", "Mur tarcz (Sargonid)", "Miecznik galijski"];
[m[31m-const WEB_BUILDING_IDS: &[&str] = &["stolarnia", "kamieniarski", "kuznia", "odlewnia_brazu", "odlewnia_zelaza", "wielka_odlewnia", "targowisko", "port", "port_wielki", "spichlerz", "spichlerz_ii", "garncarnia", "cegielnia", "kamienne_kregi", "swiatynia", "biblioteka", "studnia", "akwedukt", "mennica", "palisada", "mury", "koszary", "magazyn", "stela", "palac", "palac_ii", "palac_iii", "kuznia_zelaza", "wielka_kuznia", "fort", "baszta", "warsztat_oblezniczy", "akademia", "teatr", "sad", "dom_starszyzny", "dwor_zarzadcy", "pretorium", "trybunal", "garnizon", "laznia_publiczna", "akademia_wojskowa"];
[m[31m-const WEB_TECH_NAMES: &[&str] = &["Obróbka drewna", "Garncarstwo", "Murarstwo", "Rolnictwo", "Łowiectwo", "Łucznictwo", "Oswojenie zwierząt", "Mistycyzm", "Wymiana", "Gospodarka wodna", "Koło", "Brązownictwo", "Żegluga", "Pismo", "Religia", "Jeździectwo", "Wojskowość", "Matematyka", "Handel", "Kodeks", "Budownictwo", "Waluta", "Astronomia", "Hutnictwo żelaza", "Inżynieria", "Oblężnictwo", "Filozofia", "Prawo", "Drogi brukowane", "Medycyna", "Obróbka żelaza", "Sztuka wojenna"];
[m[31m-const WEB_CUDA_IDS: &[&str] = &["piramidy", "wielka_stela", "wiszace_ogrody", "wyrocznia", "roquepertuse", "stupa_sanchi", "petra", "hamonga", "kolos", "osada_aschaffenburg", "ziggurat", "mundo_perdido", "terakotowa_armia", "koloseum", "dur_sharrukin", "brama_narodow", "palac_weiyang", "yerkapi", "posag_peruna"];
[m[31m-const WEB_PARKOWANE_IDS: &[&str] = &["nalanda", "angkor_wat", "wielki_dzwon", "mauzoleum_teodoryka", "kopiec_grobowy"];
[m[31m-const WEB_PANSTWA_KEYS: &[&str] = &["egipt", "sumer", "babilonia", "grecy", "hetyci", "celtowie", "harappa", "fenicjanie", "germanie", "inkowie", "chinczycy", "rzymianie", "asyria", "zulusi", "slowianie"];
[m[31m-const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &["egipt", "sumer", "babilonia", "grecy", "hetyci", "celtowie", "harappa", "fenicjanie", "germanie", "inkowie", "chinczycy", "rzymianie", "asyria", "zulusi", "slowianie"];
[m[31m-const WEB_RESOURCES: &[&str] = &["Żywność", "Drewno", "Kamień", "Glina", "Ruda", "Ruda żelaza", "Ruda cyny", "Koń", "Sól", "Złoto", "Cegła", "Ceramika", "Brąz", "Żelazo", "Stal"];
[m[31m-const WEB_TERRAIN_TYPES: &[&str] = &["Łąka", "Równina", "Wzgórza", "Góry", "Wybrzeże", "Morze", "Pustynia", "Polarny"];
[m[31m-const WEB_IMPROVEMENT_KEYS: &[&str] = &["bydlo", "droga", "droga_brukowana", "farma", "fort", "glinianka", "irygacja", "kamieniolom", "kopalnia_cyny", "kopalnia_miedzi", "kopalnia_zelaza", "kopalnia_zlota", "lama", "lodzie_rybackie", "oboz_lowiecki", "owce", "posterunek", "stadnina", "tarasy", "tartak", "warzelnia_soli", "wyrab"];
[m[32m+const WEB_UNITS_JEDNOSTKA: &[&str] = &[
[m[32m+    "Wojownik",
[m[32m+    "Procarz",
[m[32m+    "Oszczepnik",
[m[32m+    "Łucznik",
[m[32m+    "Zwiadowca",
[m[32m+    "Włócznik",
[m[32m+    "Wojownik z mieczem i tarczą",
[m[32m+    "Rydwan (woły)",
[m[32m+    "Konnica",
[m[32m+    "Galera",
[m[32m+    "Falanga",
[m[32m+    "Hieros Lochos (Święty Zastęp)",
[m[32m+    "Hastati",
[m[32m+    "Triari",
[m[32m+    "Jeździec chiński",
[m[32m+    "Hu Ben Wei (Gwardia Tygrysa)",
[m[32m+    "Impi",
[m[32m+    "Oszczepnik Zulu (Izijula)",
[m[32m+    "uThulwana (Białe Tarcze)",
[m[32m+    "Wojownik z maczugą (Chaska)",
[m[32m+    "Wojownik z toporem",
[m[32m+    "Procarz (Huaracoc)",
[m[32m+    "Oszczepnik (Estólica)",
[m[32m+    "Królewska Gwardia",
[m[32m+    "Rydwan konny",
[m[32m+    "Łucznik egipski",
[m[32m+    "Rydwan egipski",
[m[32m+    "Wojownik z khopesh",
[m[32m+    "Medżaj (Gwardia Faraona)",
[m[32m+    "Łucznik nubijski",
[m[32m+    "Łucznik sumeryjski",
[m[32m+    "Rydwan sumeryjski",
[m[32m+    "Włócznik sumeryjski",
[m[32m+    "Gwardia Królewska Sumeru",
[m[32m+    "Wojownik mykeński",
[m[32m+    "Rydwan mykeński",
[m[32m+    "Wojownik Sherden",
[m[32m+    "Halabardnik Shang",
[m[32m+    "Rydwan Shang",
[m[32m+    "Łucznik akadyjski",
[m[32m+    "Gaesatae",
[m[32m+    "Soldurii",
[m[32m+    "Rydwan celtycki",
[m[32m+    "Wojownik germański",
[m[32m+    "Berserker germański",
[m[32m+    "Taran",
[m[32m+    "Taran okuty",
[m[32m+    "Katapulta",
[m[32m+    "Wieża oblężnicza",
[m[32m+    "Wojownik tyrreński",
[m[32m+    "Wojownik szekelesz",
[m[32m+    "Konnica lancowa asyryjska",
[m[32m+    "Konnica łucznicza asyryjska",
[m[32m+    "Łucznik asyryjski",
[m[32m+    "Drużynnik",
[m[32m+    "Jeździec z oszczepami",
[m[32m+    "Strażnik bram Harappy",
[m[32m+    "Piechota induska",
[m[32m+    "Garnizon Harappy",
[m[32m+    "Rydwan Kapadokijski",
[m[32m+    "Piechota hetycka",
[m[32m+    "Gwardia hetycka",
[m[32m+    "Gwardia Ishtar",
[m[32m+    "Wojownik babiloński",
[m[32m+    "Piechota neobabilońska",
[m[32m+    "Tyrski miecznik",
[m[32m+    "Wojownik fenicki",
[m[32m+    "Gwardia Tyreńska",
[m[32m+    "Thorakites",
[m[32m+    "Evocati",
[m[32m+    "iButho z iklwa",
[m[32m+    "Gwardzista z champi",
[m[32m+    "Wojownik z żelaznym khopesh",
[m[32m+    "Mur tarcz (Sargonid)",
[m[32m+    "Miecznik galijski",
[m[32m+];
[m[32m+const WEB_BUILDING_IDS: &[&str] = &[
[m[32m+    "stolarnia",
[m[32m+    "kamieniarski",
[m[32m+    "kuznia",
[m[32m+    "odlewnia_brazu",
[m[32m+    "odlewnia_zelaza",
[m[32m+    "wielka_odlewnia",
[m[32m+    "targowisko",
[m[32m+    "port",
[m[32m+    "port_wielki",
[m[32m+    "spichlerz",
[m[32m+    "spichlerz_ii",
[m[32m+    "garncarnia",
[m[32m+    "cegielnia",
[m[32m+    "kamienne_kregi",
[m[32m+    "swiatynia",
[m[32m+    "biblioteka",
[m[32m+    "studnia",
[m[32m+    "akwedukt",
[m[32m+    "mennica",
[m[32m+    "palisada",
[m[32m+    "mury",
[m[32m+    "koszary",
[m[32m+    "magazyn",
[m[32m+    "stela",
[m[32m+    "palac",
[m[32m+    "palac_ii",
[m[32m+    "palac_iii",
[m[32m+    "kuznia_zelaza",
[m[32m+    "wielka_kuznia",
[m[32m+    "fort",
[m[32m+    "baszta",
[m[32m+    "warsztat_oblezniczy",
[m[32m+    "akademia",
[m[32m+    "teatr",
[m[32m+    "sad",
[m[32m+    "dom_starszyzny",
[m[32m+    "dwor_zarzadcy",
[m[32m+    "pretorium",
[m[32m+    "trybunal",
[m[32m+    "garnizon",
[m[32m+    "laznia_publiczna",
[m[32m+    "akademia_wojskowa",
[m[32m+];
[m[32m+const WEB_TECH_NAMES: &[&str] = &[
[m[32m+    "Obróbka drewna",
[m[32m+    "Garncarstwo",
[m[32m+    "Murarstwo",
[m[32m+    "Rolnictwo",
[m[32m+    "Łowiectwo",
[m[32m+    "Łucznictwo",
[m[32m+    "Oswojenie zwierząt",
[m[32m+    "Mistycyzm",
[m[32m+    "Wymiana",
[m[32m+    "Gospodarka wodna",
[m[32m+    "Koło",
[m[32m+    "Brązownictwo",
[m[32m+    "Żegluga",
[m[32m+    "Pismo",
[m[32m+    "Religia",
[m[32m+    "Jeździectwo",
[m[32m+    "Wojskowość",
[m[32m+    "Matematyka",
[m[32m+    "Handel",
[m[32m+    "Kodeks",
[m[32m+    "Budownictwo",
[m[32m+    "Waluta",
[m[32m+    "Astronomia",
[m[32m+    "Hutnictwo żelaza",
[m[32m+    "Inżynieria",
[m[32m+    "Oblężnictwo",
[m[32m+    "Filozofia",
[m[32m+    "Prawo",
[m[32m+    "Drogi brukowane",
[m[32m+    "Medycyna",
[m[32m+    "Obróbka żelaza",
[m[32m+    "Sztuka wojenna",
[m[32m+];
[m[32m+const WEB_CUDA_IDS: &[&str] = &[
[m[32m+    "piramidy",
[m[32m+    "wielka_stela",
[m[32m+    "wiszace_ogrody",
[m[32m+    "wyrocznia",
[m[32m+    "roquepertuse",
[m[32m+    "stupa_sanchi",
[m[32m+    "petra",
[m[32m+    "hamonga",
[m[32m+    "kolos",
[m[32m+    "osada_aschaffenburg",
[m[32m+    "ziggurat",
[m[32m+    "mundo_perdido",
[m[32m+    "terakotowa_armia",
[m[32m+    "koloseum",
[m[32m+    "dur_sharrukin",
[m[32m+    "brama_narodow",
[m[32m+    "palac_weiyang",
[m[32m+    "yerkapi",
[m[32m+    "posag_peruna",
[m[32m+];
[m[32m+const WEB_PARKOWANE_IDS: &[&str] = &[
[m[32m+    "nalanda",
[m[32m+    "angkor_wat",
[m[32m+    "wielki_dzwon",
[m[32m+    "mauzoleum_teodoryka",
[m[32m+    "kopiec_grobowy",
[m[32m+];
[m[32m+const WEB_PANSTWA_KEYS: &[&str] = &[
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "babilonia",
[m[32m+    "grecy",
[m[32m+    "hetyci",
[m[32m+    "celtowie",
[m[32m+    "harappa",
[m[32m+    "fenicjanie",
[m[32m+    "germanie",
[m[32m+    "inkowie",
[m[32m+    "chinczycy",
[m[32m+    "rzymianie",
[m[32m+    "asyria",
[m[32m+    "zulusi",
[m[32m+    "slowianie",
[m[32m+];
[m[32m+const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &[
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "babilonia",
[m[32m+    "grecy",
[m[32m+    "hetyci",
[m[32m+    "celtowie",
[m[32m+    "harappa",
[m[32m+    "fenicjanie",
[m[32m+    "germanie",
[m[32m+    "inkowie",
[m[32m+    "chinczycy",
[m[32m+    "rzymianie",
[m[32m+    "asyria",
[m[32m+    "zulusi",
[m[32m+    "slowianie",
[m[32m+];
[m[32m+const WEB_RESOURCES: &[&str] = &[
[m[32m+    "Żywność",
[m[32m+    "Drewno",
[m[32m+    "Kamień",
[m[32m+    "Glina",
[m[32m+    "Ruda",
[m[32m+    "Ruda żelaza",
[m[32m+    "Ruda cyny",
[m[32m+    "Koń",
[m[32m+    "Sól",
[m[32m+    "Złoto",
[m[32m+    "Cegła",
[m[32m+    "Ceramika",
[m[32m+    "Brąz",
[m[32m+    "Żelazo",
[m[32m+    "Stal",
[m[32m+];
[m[32m+const WEB_TERRAIN_TYPES: &[&str] = &[
[m[32m+    "Łąka",
[m[32m+    "Równina",
[m[32m+    "Wzgórza",
[m[32m+    "Góry",
[m[32m+    "Wybrzeże",
[m[32m+    "Morze",
[m[32m+    "Pustynia",
[m[32m+    "Polarny",
[m[32m+];
[m[32m+const WEB_IMPROVEMENT_KEYS: &[&str] = &[
[m[32m+    "bydlo",
[m[32m+    "droga",
[m[32m+    "droga_brukowana",
[m[32m+    "farma",
[m[32m+    "fort",
[m[32m+    "glinianka",
[m[32m+    "irygacja",
[m[32m+    "kamieniolom",
[m[32m+    "kopalnia_cyny",
[m[32m+    "kopalnia_miedzi",
[m[32m+    "kopalnia_zelaza",
[m[32m+    "kopalnia_zlota",
[m[32m+    "lama",
[m[32m+    "lodzie_rybackie",
[m[32m+    "oboz_lowiecki",
[m[32m+    "owce",
[m[32m+    "posterunek",
[m[32m+    "stadnina",
[m[32m+    "tarasy",
[m[32m+    "tartak",
[m[32m+    "warzelnia_soli",
[m[32m+    "wyrab",
[m[32m+];
[m 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:9:
 
 #[test]
 fn parse_econ_params_parses_and_spot_checks() {
[31m-    let root = economy_society::parse_econ_params().expect("econ-params.json parses into 1:1 structs");
[m[32m+    let root =
[m[32m+        economy_society::parse_econ_params().expect("econ-params.json parses into 1:1 structs");
[m     assert_eq!(root.ekonomia_miasta.prog_wzrostu_wspolczynnik.easy, 12_i64);
     assert_eq!(root.teren_mapa.teren_rzeka_zywnosc.normal, 3_i64);
     assert_eq!(root.handel_surowce.pakiet_wielkosc.hard, 10_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:17:
 
 #[test]
 fn parse_society_params_parses_and_spot_checks() {
[31m-    let root = economy_society::parse_society_params().expect("society-params.json parses into 1:1 structs");
[m[32m+    let root = economy_society::parse_society_params()
[m[32m+        .expect("society-params.json parses into 1:1 structs");
[m     assert_eq!(root.zdrowie.zdrowie_rzeka.easy, 3_i64);
     assert!(((root.kultura.kultura_konwersja_stela.normal) - 0.5).abs() < 1e-12);
     assert_eq!(root.prawo.prawo_bonus_stolica_easy.hard, 0_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:25:
 
 #[test]
 fn parse_epoka_ludnosc_manpower_parses_and_spot_checks() {
[31m-    let root = economy_society::parse_epoka_ludnosc_manpower().expect("epoka-ludnosc-manpower.json parses into 1:1 structs");
[m[32m+    let root = economy_society::parse_epoka_ludnosc_manpower()
[m[32m+        .expect("epoka-ludnosc-manpower.json parses into 1:1 structs");
[m     assert_eq!(root.epoki[0].epoka, 1_i64);
     assert_eq!(root.epoki[0].manpower_na_ludka, 1000_i64);
     assert_eq!(root.epoki[0].manpower_na_jednostke, 1000_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:33:
 
 #[test]
 fn parse_citizen_resource_upkeep_parses_and_spot_checks() {
[31m-    let root = economy_society::parse_citizen_resource_upkeep().expect("citizen-resource-upkeep.json parses into 1:1 structs");
[m[32m+    let root = economy_society::parse_citizen_resource_upkeep()
[m[32m+        .expect("citizen-resource-upkeep.json parses into 1:1 structs");
[m     assert_eq!(root.kara.szczescie_za_dostepny, 2_i64);
     assert_eq!(root.kara.rozwoj_pct_za_brakujacy, -1_i64);
     assert_eq!(root.epoki[0].epoka, 1_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:41:
 
 #[test]
 fn parse_miasto_params_parses_and_spot_checks() {
[31m-    let root = economy_society::parse_miasto_params().expect("miasto-params.json parses into 1:1 structs");
[m[32m+    let root =
[m[32m+        economy_society::parse_miasto_params().expect("miasto-params.json parses into 1:1 structs");
[m     assert_eq!(root.min_dystans_miast.wartosc, 4_i64);
     assert_eq!(root.zasieg_okolicy_miasta.wartosc, 10_i64);
     assert!(((root.udzial_output_rozwoj.wartosc) - 0.1).abs() < 1e-12);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:58:
 
 #[test]
 fn parse_e_start_params_parses_and_spot_checks() {
[31m-    let root = economy_society_part2::parse_e_start_params().expect("e-start-params.json parses into 1:1 structs");
[m[32m+    let root = economy_society_part2::parse_e_start_params()
[m[32m+        .expect("e-start-params.json parses into 1:1 structs");
[m     assert_eq!(root.defaulty.city_limit_base_default, 10_i64);
     assert_eq!(root.skala_mapy.ogromny.miasta_panstwa, 8_i64);
     assert_eq!(root.kreator_zaawansowane.manual_seed_default, 424242_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:66:
 
 #[test]
 fn parse_ai_params_parses_and_spot_checks() {
[31m-    let root = economy_society_part2::parse_ai_params().expect("ai-params.json parses into 1:1 structs");
[m[32m+    let root =
[m[32m+        economy_society_part2::parse_ai_params().expect("ai-params.json parses into 1:1 structs");
[m     assert_eq!(root.trudnosc_poziom1_bonus_produkcja.wartosc, 0_i64);
     assert!(((root.ai_sojusz_obowiazek_min_ratio.wartosc) - 0.55).abs() < 1e-12);
     assert_eq!(root.ludy_morza_rajd_okres_trudny.wartosc, 1_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_economy_society.rs:74:
 
 #[test]
 fn parse_ui_params_parses_and_spot_checks() {
[31m-    let root = economy_society_part2::parse_ui_params().expect("ui-params.json parses into 1:1 structs");
[m[32m+    let root =
[m[32m+        economy_society_part2::parse_ui_params().expect("ui-params.json parses into 1:1 structs");
[m     assert!(((root.panel_miasta.rush_cost_mnoznik) - 0.8).abs() < 1e-12);
     assert_eq!(root.panel_miasta.font_scale_domyslna_px, 16_i64);
     assert_eq!(root.nowa_gra.ustawienia[0].domyslny, 1_i64);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_loader.rs:20:
     fn new(tag: &str) -> Self {
         static COUNTER: AtomicUsize = AtomicUsize::new(0);
         let n = COUNTER.fetch_add(1, Ordering::SeqCst);
[31m-        let dir = std::env::temp_dir().join(format!(
[m[31m-            "civ-loader-{}-{}-{}",
[m[31m-            std::process::id(),
[m[31m-            tag,
[m[31m-            n
[m[31m-        ));
[m[32m+        let dir =
[m[32m+            std::env::temp_dir().join(format!("civ-loader-{}-{}-{}", std::process::id(), tag, n));
[m         let _ = fs::remove_dir_all(&dir);
         fs::create_dir_all(&dir).expect("create temp dir");
         TempDir(dir)
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_loader.rs:78:
 fn data_files_list_matches_directory_contents() {
     let mut on_disk: Vec<String> = fs::read_dir(data_dir())
         .expect("read data dir")
[31m-        .map(|e| e.expect("dir entry").file_name().to_string_lossy().into_owned())
[m[32m+        .map(|e| {
[m[32m+            e.expect("dir entry")
[m[32m+                .file_name()
[m[32m+                .to_string_lossy()
[m[32m+                .into_owned()
[m[32m+        })
[m         .filter(|n| n.ends_with(".json"))
         .collect();
     on_disk.sort();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_units_combat.rs:19:
     let units = parse_units().expect("units.json must parse");
     let raw_units = raw(UNITS_JSON);
     let raw_len = raw_units.as_array().expect("units.json is an array").len();
[31m-    assert_eq!(units.len(), raw_len, "record count must match raw JSON array");
[m[32m+    assert_eq!(
[m[32m+        units.len(),
[m[32m+        raw_len,
[m[32m+        "record count must match raw JSON array"
[m[32m+    );
[m     assert_eq!(units.len(), 75);
 
     let mut names: Vec<&str> = units.iter().map(|u| u.jednostka.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_units_combat.rs:61:
     assert_eq!(w.health_lc, 22);
     assert_eq!(w.morale_ucieczki, Some(22));
 
[31m-    let taran = units.iter().find(|u| u.jednostka == "Taran").expect("Taran present");
[m[32m+    let taran = units
[m[32m+        .iter()
[m[32m+        .find(|u| u.jednostka == "Taran")
[m[32m+        .expect("Taran present");
[m     println!(
         "SPOT Taran siege_power={:?} wall_attack={:?}",
         taran.siege_power, taran.wall_attack
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_units_combat.rs:99:
     let raw_len = raw(TERRAIN_COMBAT_JSON).as_array().expect("array").len();
     assert_eq!(rows.len(), raw_len);
     assert_eq!(rows.len(), 7);
[31m-    let gory = rows.iter().find(|r| r.teren == "Góry").expect("Góry present");
[m[32m+    let gory = rows
[m[32m+        .iter()
[m[32m+        .find(|r| r.teren == "Góry")
[m[32m+        .expect("Góry present");
[m     println!(
         "SPOT terrain-combat rows={} gory.bonus_obrona={} gory.kawaleria={}",
         rows.len(),
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_units_combat.rs:131:
     assert_eq!(first.cel_typ, "Mount");
     assert_eq!(first.bonus, "+50%");
     assert_eq!(first.rodzaj_atak_obrona, "Atak");
[31m-    let flank = rules.iter().find(|r| r.bonus == "−50%").expect("flank rule present");
[m[32m+    let flank = rules
[m[32m+        .iter()
[m[32m+        .find(|r| r.bonus == "−50%")
[m[32m+        .expect("flank rule present");
[m     assert_eq!(flank.rodzaj_atak_obrona, "Obrona");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_units_combat.rs:170:
     assert_eq!(f.mnoznik_epoki.ep1, 1);
     assert_eq!(f.mnoznik_epoki.ep10, 1);
     assert_eq!(f._nazewnictwo.en, "Power");
[31m-    assert_eq!(f._formuly.rekrut_ekw, "floor(rekruci_biezacy / koszt_werbu[epoka])");
[m[32m+    assert_eq!(
[m[32m+        f._formuly.rekrut_ekw,
[m[32m+        "floor(rekruci_biezacy / koszt_werbu[epoka])"
[m[32m+    );
[m }
 
EXIT=1
```

### cargo clippy --all-targets -- -D warnings
```text
     Locking 17 packages to latest compatible versions
    Blocking waiting for file lock on build directory
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine)
error: large size difference between variants
  --> tests/../src/bridge.rs:22:1
   |
22 | /  pub enum EngineCommand {
23 | |      /// Start a fresh deterministic session from the wizard DTO.
24 | |/     CreateSession {
25 | ||         #[serde(default)]
26 | ||         params: StartGameParams,
27 | ||     },
   | ||_____- the largest variant contains at least 840 bytes
28 | |      /// Compatibility command for bridge probes that add a non-human player.
29 | |      AddPlayer { id: u64, name: String },
   | |      ----------------------------------- the second-largest variant contains at least 32 bytes
...  |
40 | |      GetState,
41 | |  }
   | |__^ the entire enum is at least 840 bytes
   |
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#large_enum_variant
   = note: `-D clippy::large-enum-variant` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::large_enum_variant)]`
help: consider boxing the large fields or introducing indirection in some other way to reduce the total size of the enum
   |
26 -         params: StartGameParams,
26 +         params: Box<StartGameParams>,
   |

error: could not compile `civ-engine` (test "bridge_add_player") due to 1 previous error
warning: build failed, waiting for other jobs to finish...
error: duplicated attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:15:9
   |
15 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes
   = note: `-D clippy::duplicated-attributes` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::duplicated_attributes)]`

error: duplicated attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:18:9
   |
18 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:21:9
   |
21 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:24:9
   |
24 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:27:9
   |
27 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: could not compile `civ-engine` (test "data_compliance") due to 5 previous errors
EXIT=101
```

### cargo test --offline
```text
    Finished `test` profile [unoptimized] target(s) in 0.06s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.66s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/debug/deps/data_compliance-bce92961776df717)

running 9 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test embedded_raw_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-987aa8790b10a253)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test multiple_layers_stack_additively_per_resource ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test land_route_bfs_crosses_desert_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test scout_is_available_in_every_epoch ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## Surowe wyjścia PO

### rustfmt --check na plikach allowlisty
```text
RUSTFMT_CHECK tests/data_buildings_tech.rs EXIT=0
RUSTFMT_CHECK tests/data_civilizations.rs EXIT=0
RUSTFMT_CHECK tests/data_economy_society.rs EXIT=0
RUSTFMT_CHECK tests/data_units_combat.rs EXIT=0
RUSTFMT_CHECK src/data/loader.rs EXIT=0
```

### cargo fmt --all -- --check
```text
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/src/data/mod.rs:10:
 pub mod civilizations;
 pub mod economy_society;
 pub mod economy_society_part2;
[32m+pub mod loader;
[m pub mod terrain_map;
 pub mod units_combat;
[31m-pub mod loader;
[m 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:29:
 }
 
 fn manifest_path() -> PathBuf {
[31m-    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("assets").join("MANIFEST.tsv")
[m[32m+    Path::new(env!("CARGO_MANIFEST_DIR"))
[m[32m+        .join("..")
[m[32m+        .join("assets")
[m[32m+        .join("MANIFEST.tsv")
[m }
 
 fn assets_dir() -> PathBuf {
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:36:
[31m-    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("assets")
[m[32m+    Path::new(env!("CARGO_MANIFEST_DIR"))
[m[32m+        .join("..")
[m[32m+        .join("assets")
[m }
 
 /// Parsuje manifest; zwraca wpisy danych (bez nagłówka). Błąd przy złym nagłówku lub kolumnach.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:109:
         if path.is_dir() {
             walk_files(&path, root, out);
         } else {
[31m-            let rel = path.strip_prefix(root).expect("prefix").to_string_lossy().replace('\\', "/");
[m[32m+            let rel = path
[m[32m+                .strip_prefix(root)
[m[32m+                .expect("prefix")
[m[32m+                .to_string_lossy()
[m[32m+                .replace('\\', "/");
[m             out.insert(rel);
         }
     }
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:120:
 // ---------------------------------------------------------------------------
 
 fn sha1(data: &[u8]) -> [u8; 20] {
[31m-    let mut h: [u32; 5] = [0x6745_2301, 0xEFCD_AB89, 0x98BA_DCFE, 0x1032_5476, 0xC3D2_E1F0];
[m[32m+    let mut h: [u32; 5] = [
[m[32m+        0x6745_2301,
[m[32m+        0xEFCD_AB89,
[m[32m+        0x98BA_DCFE,
[m[32m+        0x1032_5476,
[m[32m+        0xC3D2_E1F0,
[m[32m+    ];
[m     let bit_len = (data.len() as u64).wrapping_mul(8);
     let mut msg = Vec::with_capacity(data.len() + 72);
     msg.extend_from_slice(data);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:133:
     for chunk in msg.chunks_exact(64) {
         let mut w = [0u32; 80];
         for i in 0..16 {
[31m-            w[i] = u32::from_be_bytes([chunk[4 * i], chunk[4 * i + 1], chunk[4 * i + 2], chunk[4 * i + 3]]);
[m[32m+            w[i] = u32::from_be_bytes([
[m[32m+                chunk[4 * i],
[m[32m+                chunk[4 * i + 1],
[m[32m+                chunk[4 * i + 2],
[m[32m+                chunk[4 * i + 3],
[m[32m+            ]);
[m         }
         for i in 16..80 {
             w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:194:
 fn sha1_matches_known_vectors() {
     // FIPS 180-4 / powszechnie znane wektory; źródło: RFC 3174 / NIST.
     assert_eq!(hex(&sha1(b"")), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
[31m-    assert_eq!(hex(&sha1(b"abc")), "a9993e364706816aba3e25717850c26c9cd0d89d");
[m     assert_eq!(
[31m-        hex(&sha1(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")),
[m[32m+        hex(&sha1(b"abc")),
[m[32m+        "a9993e364706816aba3e25717850c26c9cd0d89d"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        hex(&sha1(
[m[32m+            b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
[m[32m+        )),
[m         "84983e441c3bd26ebaae4aa1f95129e5e54670f1"
     );
     // git blob pustego pliku (git hash-object /dev/null)
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:203:
[31m-    assert_eq!(git_blob_sha1_hex(b""), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
[m[32m+    assert_eq!(
[m[32m+        git_blob_sha1_hex(b""),
[m[32m+        "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:209:
     let first = text.split('\n').next().expect("pierwszy wiersz");
     assert_eq!(first, MANIFEST_HEADER, "nagłówek manifestu");
     let entries = parse_manifest(&text).expect("parse");
[31m-    assert_eq!(entries.len(), EXPECTED_DATA_ROWS, "liczba wierszy danych (P3-8: 428/428)");
[m[32m+    assert_eq!(
[m[32m+        entries.len(),
[m[32m+        EXPECTED_DATA_ROWS,
[m[32m+        "liczba wierszy danych (P3-8: 428/428)"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:216:
 fn manifest_dest_paths_are_unique() {
     let entries = load_manifest();
     let unique: BTreeSet<&str> = entries.iter().map(|e| e.dst.as_str()).collect();
[31m-    assert_eq!(unique.len(), entries.len(), "ścieżki docelowe muszą być unikalne");
[m[32m+    assert_eq!(
[m[32m+        unique.len(),
[m[32m+        entries.len(),
[m[32m+        "ścieżki docelowe muszą być unikalne"
[m[32m+    );
[m     for e in &entries {
[31m-        assert!(e.dst.starts_with(DEST_PREFIX), "prefiks docelowy: {}", e.dst);
[m[32m+        assert!(
[m[32m+            e.dst.starts_with(DEST_PREFIX),
[m[32m+            "prefiks docelowy: {}",
[m[32m+            e.dst
[m[32m+        );
[m     }
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:226:
 fn every_manifest_entry_exists_with_declared_size() {
     let entries = load_manifest();
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert!(errors.is_empty(), "rozbieżności manifestu z katalogiem:\n{}", errors.join("\n"));
[m[32m+    assert!(
[m[32m+        errors.is_empty(),
[m[32m+        "rozbieżności manifestu z katalogiem:\n{}",
[m[32m+        errors.join("\n")
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:233:
 fn every_entry_blob_sha1_matches_manifest_column() {
     let entries = load_manifest();
     let errors = validate(&entries, &repo_root(), true);
[31m-    assert!(errors.is_empty(), "rozbieżności blob-SHA1:\n{}", errors.join("\n"));
[m[32m+    assert!(
[m[32m+        errors.is_empty(),
[m[32m+        "rozbieżności blob-SHA1:\n{}",
[m[32m+        errors.join("\n")
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:248:
     let extra: Vec<&String> = on_disk.difference(&expected).collect();
     let missing: Vec<&String> = expected.difference(&on_disk).collect();
     assert!(extra.is_empty(), "pliki spoza manifestu: {extra:?}");
[31m-    assert!(missing.is_empty(), "pliki z manifestu brak na dysku: {missing:?}");
[m[32m+    assert!(
[m[32m+        missing.is_empty(),
[m[32m+        "pliki z manifestu brak na dysku: {missing:?}"
[m[32m+    );
[m     assert_eq!(on_disk.len(), EXPECTED_DATA_ROWS);
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:268:
     assert_eq!(counts.get("jpg"), Some(&45), "jpg");
     assert_eq!(counts.get("png"), Some(&2), "png");
     assert_eq!(counts.get("mp3"), Some(&62), "mp3");
[31m-    assert_eq!(counts.values().sum::<usize>(), EXPECTED_DATA_ROWS, "suma rozszerzeń");
[m[32m+    assert_eq!(
[m[32m+        counts.values().sum::<usize>(),
[m[32m+        EXPECTED_DATA_ROWS,
[m[32m+        "suma rozszerzeń"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:287:
         slot.0 += 1;
         slot.1 += e.size;
     }
[31m-    assert_eq!(sums.get("icons"), Some(&(319, 136_176)), "ikony (P1.11 §2 wiersze 26+27)");
[m[31m-    assert_eq!(sums.get("portraits"), Some(&(45, 445_951)), "portrety (P1.11 §2 wiersz 28)");
[m[31m-    assert_eq!(sums.get("hero"), Some(&(2, 4_214_674)), "hero (P1.11 §2 wiersz 29)");
[m[31m-    assert_eq!(sums.get("music"), Some(&(62, 44_584_683)), "muzyka (P1.11 §2 wiersze 31+32)");
[m[31m-    assert_eq!(sums.len(), 4, "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)");
[m[32m+    assert_eq!(
[m[32m+        sums.get("icons"),
[m[32m+        Some(&(319, 136_176)),
[m[32m+        "ikony (P1.11 §2 wiersze 26+27)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("portraits"),
[m[32m+        Some(&(45, 445_951)),
[m[32m+        "portrety (P1.11 §2 wiersz 28)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("hero"),
[m[32m+        Some(&(2, 4_214_674)),
[m[32m+        "hero (P1.11 §2 wiersz 29)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("music"),
[m[32m+        Some(&(62, 44_584_683)),
[m[32m+        "muzyka (P1.11 §2 wiersze 31+32)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.len(),
[m[32m+        4,
[m[32m+        "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)"
[m[32m+    );
[m }
 
 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:298:
 fn negative_validator_rejects_wrong_size() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     entries[1].size += 1;
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert_eq!(errors.len(), 1, "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("size mismatch"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:309:
 fn negative_validator_rejects_missing_file() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     entries[0].dst = "rust-port/assets/icons/does-not-exist-xyz.svg".to_string();
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert_eq!(errors.len(), 1, "brakujący plik musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "brakujący plik musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("brak pliku"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:320:
 fn negative_validator_rejects_duplicate_dest() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     let dup = entries[0].clone();
     entries.push(dup);
     let errors = validate(&entries, &repo_root(), false);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:327:
[31m-    assert_eq!(errors.len(), 1, "duplikat musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "duplikat musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("duplikat"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:333:
     let mut entries = load_manifest();
     entries.truncate(2);
     let real = validate(&entries, &repo_root(), true);
[31m-    assert!(real.is_empty(), "kontrola: prawdziwe SHA przechodzą: {real:?}");
[m[32m+    assert!(
[m[32m+        real.is_empty(),
[m[32m+        "kontrola: prawdziwe SHA przechodzą: {real:?}"
[m[32m+    );
[m     entries[0].sha = "0".repeat(40);
     let errors = validate(&entries, &repo_root(), true);
[31m-    assert_eq!(errors.len(), 1, "zły SHA musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "zły SHA musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("sha mismatch"), "{errors:?}");
 }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/assets_manifest.rs:343:
 #[test]
 fn negative_parser_rejects_bad_header_and_columns() {
     let real = fs::read_to_string(manifest_path()).expect("MANIFEST.tsv czytelny");
[31m-    assert!(parse_manifest(&real).is_ok(), "kontrola: prawdziwy manifest parsuje się");
[m[32m+    assert!(
[m[32m+        parse_manifest(&real).is_ok(),
[m[32m+        "kontrola: prawdziwy manifest parsuje się"
[m[32m+    );
[m     let bad_header = "sha\tsize\tsrc\tdst\na\t1\tb\tc\n";
[31m-    assert!(parse_manifest(bad_header).is_err(), "zły nagłówek musi być odrzucony");
[m[32m+    assert!(
[m[32m+        parse_manifest(bad_header).is_err(),
[m[32m+        "zły nagłówek musi być odrzucony"
[m[32m+    );
[m     let bad_cols = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\n");
[31m-    assert!(parse_manifest(&bad_cols).is_err(), "wiersz z 3 kolumnami musi być odrzucony");
[m[32m+    assert!(
[m[32m+        parse_manifest(&bad_cols).is_err(),
[m[32m+        "wiersz z 3 kolumnami musi być odrzucony"
[m[32m+    );
[m     let blank_mid = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\tdst\n\nabc\t1\tsrc\tdst2\n");
[31m-    assert!(parse_manifest(&blank_mid).is_err(), "pusta linia w środku musi być odrzucona");
[m[32m+    assert!(
[m[32m+        parse_manifest(&blank_mid).is_err(),
[m[32m+        "pusta linia w środku musi być odrzucona"
[m[32m+    );
[m }
 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:8:
 // Testy nie duplikuja asercji z data_*.rs; dodaja: kompletnosc ID/licznosci wzgledem web oraz
 // probe parsowania wszystkich 29 plikow `rust-port/engine/data/*.json`.
 
[31m-#[path = "../src/data/civilizations.rs"]
[m[31m-#[allow(dead_code)]
[m[31m-mod civilizations;
[m #[path = "../src/data/buildings_tech.rs"]
 #[allow(dead_code)]
 mod buildings_tech;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:17:
[31m-#[path = "../src/data/units_combat.rs"]
[m[32m+#[path = "../src/data/civilizations.rs"]
[m #[allow(dead_code)]
[31m-mod units_combat;
[m[32m+mod civilizations;
[m #[path = "../src/data/economy_society.rs"]
 #[allow(dead_code)]
 mod economy_society;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:26:
 #[path = "../src/data/terrain_map.rs"]
 #[allow(dead_code)]
 mod terrain_map;
[32m+#[path = "../src/data/units_combat.rs"]
[m[32m+#[allow(dead_code)]
[m[32m+mod units_combat;
[m 
 use serde_json::Value;
 use std::collections::BTreeSet;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:59:
 
 fn no_dups(name: &str, ids: &[&str]) {
     let s: BTreeSet<&str> = ids.iter().copied().collect();
[31m-    assert_eq!(s.len(), ids.len(), "{name}: duplicate IDs in Rust collection");
[m[32m+    assert_eq!(
[m[32m+        s.len(),
[m[32m+        ids.len(),
[m[32m+        "{name}: duplicate IDs in Rust collection"
[m[32m+    );
[m }
 
 // ---------------------------------------------------------------------------
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:95:
     assert_eq!(WEB_TERRAIN_TYPES.len(), WEB_TERRAIN_TYPES_COUNT);
     assert_eq!(WEB_IMPROVEMENT_KEYS.len(), WEB_IMPROVEMENT_COUNT);
     // Stale ID wewnetrznie spojne z pinem (typ cywilizacji == klucze panstw cudow).
[31m-    assert_eq!(set(WEB_CIV_TYPY.iter().copied()), set(WEB_PANSTWA_KEYS.iter().copied()));
[m[31m-    assert_eq!(set(WEB_PANSTWA_KEYS.iter().copied()), set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied()));
[m[32m+    assert_eq!(
[m[32m+        set(WEB_CIV_TYPY.iter().copied()),
[m[32m+        set(WEB_PANSTWA_KEYS.iter().copied())
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        set(WEB_PANSTWA_KEYS.iter().copied()),
[m[32m+        set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied())
[m[32m+    );
[m }
 
 // (a) liczba i ID cywilizacji: Rust == web na pinie.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:105:
     let f = parse_civs().expect("civs.json");
     assert_eq!(f.cywilizacje.len(), WEB_CIV_COUNT);
     assert_eq!(f.start_gry.len(), WEB_START_GRY_COUNT);
[31m-    no_dups("civs.cywilizacja", &f.cywilizacje.iter().map(|c| c.cywilizacja.as_str()).collect::<Vec<_>>());
[m[31m-    no_dups("civs.typ_cywilizacji", &f.cywilizacje.iter().map(|c| c.typ_cywilizacji.as_str()).collect::<Vec<_>>());
[m[32m+    no_dups(
[m[32m+        "civs.cywilizacja",
[m[32m+        &f.cywilizacje
[m[32m+            .iter()
[m[32m+            .map(|c| c.cywilizacja.as_str())
[m[32m+            .collect::<Vec<_>>(),
[m[32m+    );
[m[32m+    no_dups(
[m[32m+        "civs.typ_cywilizacji",
[m[32m+        &f.cywilizacje
[m[32m+            .iter()
[m[32m+            .map(|c| c.typ_cywilizacji.as_str())
[m[32m+            .collect::<Vec<_>>(),
[m[32m+    );
[m     assert_eq!(
         set(f.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
         set(WEB_CIV_NAMES.iter().copied()),
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:169:
 #[test]
 fn collection_counts_match_web_pin() {
     assert_eq!(parse_units().expect("units").len(), WEB_UNITS_COUNT);
[31m-    assert_eq!(parse_buildings().expect("buildings").len(), WEB_BUILDINGS_COUNT);
[m[31m-    assert_eq!(parse_tech().expect("tech").technologie.len(), WEB_TECH_COUNT);
[m[32m+    assert_eq!(
[m[32m+        parse_buildings().expect("buildings").len(),
[m[32m+        WEB_BUILDINGS_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        parse_tech().expect("tech").technologie.len(),
[m[32m+        WEB_TECH_COUNT
[m[32m+    );
[m     let w = parse_wonders().expect("wonders");
     assert_eq!(w.cuda.len(), WEB_CUDA_COUNT);
     assert_eq!(w.parkowane_epoka4plus.len(), WEB_PARKOWANE_COUNT);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:177:
     assert_eq!(w.panstwa.len(), WEB_PANSTWA_COUNT);
[31m-    assert_eq!(parse_resources().expect("resources").len(), WEB_RESOURCES_COUNT);
[m[32m+    assert_eq!(
[m[32m+        parse_resources().expect("resources").len(),
[m[32m+        WEB_RESOURCES_COUNT
[m[32m+    );
[m     let ty = parse_terrain_yields().expect("terrain-yields");
     assert_eq!(ty.terrain_types.len(), WEB_TERRAIN_TYPES_COUNT);
     assert_eq!(ty.terrain_modifiers.len(), WEB_TERRAIN_MODIFIERS_COUNT);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:186:
     let units = parse_units().expect("units");
     let names: Vec<&str> = units.iter().map(|u| u.jednostka.as_str()).collect();
     no_dups("units.Jednostka", &names);
[31m-    assert_eq!(set(names.iter().copied()), set(WEB_UNITS_JEDNOSTKA.iter().copied()), "units");
[m[32m+    assert_eq!(
[m[32m+        set(names.iter().copied()),
[m[32m+        set(WEB_UNITS_JEDNOSTKA.iter().copied()),
[m[32m+        "units"
[m[32m+    );
[m 
     let b = parse_buildings().expect("buildings");
     let ids: Vec<&str> = b.iter().map(|x| x.id.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:193:
     no_dups("buildings.id", &ids);
[31m-    assert_eq!(set(ids.iter().copied()), set(WEB_BUILDING_IDS.iter().copied()), "buildings");
[m[32m+    assert_eq!(
[m[32m+        set(ids.iter().copied()),
[m[32m+        set(WEB_BUILDING_IDS.iter().copied()),
[m[32m+        "buildings"
[m[32m+    );
[m 
     let t = parse_tech().expect("tech");
[31m-    let tn: Vec<&str> = t.technologie.iter().map(|x| x.technologia.as_str()).collect();
[m[32m+    let tn: Vec<&str> = t
[m[32m+        .technologie
[m[32m+        .iter()
[m[32m+        .map(|x| x.technologia.as_str())
[m[32m+        .collect();
[m     no_dups("tech.Technologia", &tn);
[31m-    assert_eq!(set(tn.iter().copied()), set(WEB_TECH_NAMES.iter().copied()), "tech");
[m[32m+    assert_eq!(
[m[32m+        set(tn.iter().copied()),
[m[32m+        set(WEB_TECH_NAMES.iter().copied()),
[m[32m+        "tech"
[m[32m+    );
[m 
     let w = parse_wonders().expect("wonders");
     let cuda: Vec<&str> = w.cuda.iter().map(|c| c.id.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:203:
     no_dups("cuda.id", &cuda);
[31m-    assert_eq!(set(cuda.iter().copied()), set(WEB_CUDA_IDS.iter().copied()), "cuda");
[m[31m-    let park: Vec<&str> = w.parkowane_epoka4plus.iter().map(|c| c.id.as_str()).collect();
[m[31m-    assert_eq!(set(park.iter().copied()), set(WEB_PARKOWANE_IDS.iter().copied()), "parkowane");
[m[32m+    assert_eq!(
[m[32m+        set(cuda.iter().copied()),
[m[32m+        set(WEB_CUDA_IDS.iter().copied()),
[m[32m+        "cuda"
[m[32m+    );
[m[32m+    let park: Vec<&str> = w
[m[32m+        .parkowane_epoka4plus
[m[32m+        .iter()
[m[32m+        .map(|c| c.id.as_str())
[m[32m+        .collect();
[m[32m+    assert_eq!(
[m[32m+        set(park.iter().copied()),
[m[32m+        set(WEB_PARKOWANE_IDS.iter().copied()),
[m[32m+        "parkowane"
[m[32m+    );
[m 
     let res = parse_resources().expect("resources");
     let rn: Vec<&str> = res.iter().map(|r| r.surowiec.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:210:
     no_dups("resources.Surowiec", &rn);
[31m-    assert_eq!(set(rn.iter().copied()), set(WEB_RESOURCES.iter().copied()), "resources");
[m[32m+    assert_eq!(
[m[32m+        set(rn.iter().copied()),
[m[32m+        set(WEB_RESOURCES.iter().copied()),
[m[32m+        "resources"
[m[32m+    );
[m 
     let ty = parse_terrain_yields().expect("terrain-yields");
     let tt: Vec<&str> = ty.terrain_types.iter().map(|x| x.teren.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:215:
     no_dups("terrain_types.Teren", &tt);
[31m-    assert_eq!(set(tt.iter().copied()), set(WEB_TERRAIN_TYPES.iter().copied()), "terrain types");
[m[32m+    assert_eq!(
[m[32m+        set(tt.iter().copied()),
[m[32m+        set(WEB_TERRAIN_TYPES.iter().copied()),
[m[32m+        "terrain types"
[m[32m+    );
[m }
 
 // Embedded kopie (include_str! w src/data) == web: liczby z surowego Value, niezalezne od struktur.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:220:
 #[test]
 fn embedded_raw_counts_match_web_pin() {
     assert_eq!(raw(UNITS_JSON).as_array().unwrap().len(), WEB_UNITS_COUNT);
[31m-    assert_eq!(raw(BUILDINGS_JSON).as_array().unwrap().len(), WEB_BUILDINGS_COUNT);
[m[31m-    assert_eq!(raw(TECH_JSON)["technologie"].as_array().unwrap().len(), WEB_TECH_COUNT);
[m[31m-    assert_eq!(raw(include_str!("../data/resources.json")).as_array().unwrap().len(), WEB_RESOURCES_COUNT);
[m[32m+    assert_eq!(
[m[32m+        raw(BUILDINGS_JSON).as_array().unwrap().len(),
[m[32m+        WEB_BUILDINGS_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        raw(TECH_JSON)["technologie"].as_array().unwrap().len(),
[m[32m+        WEB_TECH_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        raw(include_str!("../data/resources.json"))
[m[32m+            .as_array()
[m[32m+            .unwrap()
[m[32m+            .len(),
[m[32m+        WEB_RESOURCES_COUNT
[m[32m+    );
[m     let imp = raw(TERRAIN_IMPROVEMENTS_JSON);
     let keys: BTreeSet<&str> = imp
         .as_object()
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:232:
         .filter(|k| !k.starts_with('_'))
         .collect();
     assert_eq!(keys.len(), WEB_IMPROVEMENT_COUNT);
[31m-    assert_eq!(keys, set(WEB_IMPROVEMENT_KEYS.iter().copied()), "terrain-improvements klucze != web");
[m[32m+    assert_eq!(
[m[32m+        keys,
[m[32m+        set(WEB_IMPROVEMENT_KEYS.iter().copied()),
[m[32m+        "terrain-improvements klucze != web"
[m[32m+    );
[m }
 
 // terrain-improvements: struktura ma deny_unknown_fields, wiec sukces parsowania dowodzi tylko, ze
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:240:
 // (brakujace pole Option przechodzi bez bledu). Sprawdzane sa tylko dwa pola jako probka.
 #[test]
 fn terrain_improvements_parses_strict_with_farma_and_posterunek() {
[31m-    let f = parse_terrain_improvements().expect("terrain-improvements.json must parse (deny_unknown_fields)");
[m[32m+    let f = parse_terrain_improvements()
[m[32m+        .expect("terrain-improvements.json must parse (deny_unknown_fields)");
[m     assert!(!f.farma.nazwa.is_empty());
     assert!(!f.posterunek.nazwa.is_empty());
 }
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:262:
     probe!("civ-params.json", parse_civ_params());
     probe!("civ-ai.json", parse_civ_ai());
     probe!("diplomacy.json", parse_diplomacy());
[31m-    probe!("diplomacy-acceptance-points.json", parse_diplomacy_acceptance_points());
[m[32m+    probe!(
[m[32m+        "diplomacy-acceptance-points.json",
[m[32m+        parse_diplomacy_acceptance_points()
[m[32m+    );
[m     probe!("city-names-pools.json", parse_city_names_pools());
     probe!("buildings.json", parse_buildings());
     probe!("wonders.json", parse_wonders());
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:275:
     probe!("power-params.json", parse_power_params());
     probe!("econ-params.json", parse_econ_params());
     probe!("society-params.json", parse_society_params());
[31m-    probe!("epoka-ludnosc-manpower.json", parse_epoka_ludnosc_manpower());
[m[31m-    probe!("citizen-resource-upkeep.json", parse_citizen_resource_upkeep());
[m[32m+    probe!(
[m[32m+        "epoka-ludnosc-manpower.json",
[m[32m+        parse_epoka_ludnosc_manpower()
[m[32m+    );
[m[32m+    probe!(
[m[32m+        "citizen-resource-upkeep.json",
[m[32m+        parse_citizen_resource_upkeep()
[m[32m+    );
[m     probe!("miasto-params.json", parse_miasto_params());
     probe!("resources.json", parse_resources());
     probe!("e-start-params.json", parse_e_start_params());
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:293:
         .filter_map(|e| e.ok())
         .filter(|e| e.path().extension().is_some_and(|x| x == "json"))
         .count();
[31m-    assert_eq!(on_disk, ok, "pliki *.json w rust-port/engine/data nieobjete probe");
[m[32m+    assert_eq!(
[m[32m+        on_disk, ok,
[m[32m+        "pliki *.json w rust-port/engine/data nieobjete probe"
[m[32m+    );
[m }
 
 // (c, LUKA — nie test): 1:1 round-trip (typed -> Value == raw) mozliwy dzis TYLKO dla 7 plikow
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_compliance.rs:303:
 
 // Stale ID z web (generowane z gra/data/*.json @ edb8fb56, wklejone literalnie).
 const WEB_CIV_NAMES: &[&str] = &[
[31m-    "Grecy", "Rzymianie", "Chińczycy", "Inkowie", "Zulusi", "Egipt", "Sumerowie", "Celtowie",
[m[31m-    "Germanie", "Harappa", "Hetyci", "Słowianie", "Babilonia", "Asyria", "Fenicjanie",
[m[32m+    "Grecy",
[m[32m+    "Rzymianie",
[m[32m+    "Chińczycy",
[m[32m+    "Inkowie",
[m[32m+    "Zulusi",
[m[32m+    "Egipt",
[m[32m+    "Sumerowie",
[m[32m+    "Celtowie",
[m[32m+    "Germanie",
[m[32m+    "Harappa",
[m[32m+    "Hetyci",
[m[32m+    "Słowianie",
[m[32m+    "Babilonia",
[m[32m+    "Asyria",
[m[32m+    "Fenicjanie",
[m ]; // civs.json .cywilizacje[].Cywilizacja
 const WEB_CIV_TYPY: &[&str] = &[
[31m-    "grecy", "rzymianie", "chinczycy", "inkowie", "zulusi", "egipt", "sumer", "celtowie",
[m[31m-    "germanie", "harappa", "hetyci", "slowianie", "babilonia", "asyria", "fenicjanie",
[m[32m+    "grecy",
[m[32m+    "rzymianie",
[m[32m+    "chinczycy",
[m[32m+    "inkowie",
[m[32m+    "zulusi",
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "celtowie",
[m[32m+    "germanie",
[m[32m+    "harappa",
[m[32m+    "hetyci",
[m[32m+    "slowianie",
[m[32m+    "babilonia",
[m[32m+    "asyria",
[m[32m+    "fenicjanie",
[m ]; // civs.json .cywilizacje[].typCywilizacji (ID)
 
[31m-const WEB_UNITS_JEDNOSTKA: &[&str] = &["Wojownik", "Procarz", "Oszczepnik", "Łucznik", "Zwiadowca", "Włócznik", "Wojownik z mieczem i tarczą", "Rydwan (woły)", "Konnica", "Galera", "Falanga", "Hieros Lochos (Święty Zastęp)", "Hastati", "Triari", "Jeździec chiński", "Hu Ben Wei (Gwardia Tygrysa)", "Impi", "Oszczepnik Zulu (Izijula)", "uThulwana (Białe Tarcze)", "Wojownik z maczugą (Chaska)", "Wojownik z toporem", "Procarz (Huaracoc)", "Oszczepnik (Estólica)", "Królewska Gwardia", "Rydwan konny", "Łucznik egipski", "Rydwan egipski", "Wojownik z khopesh", "Medżaj (Gwardia Faraona)", "Łucznik nubijski", "Łucznik sumeryjski", "Rydwan sumeryjski", "Włócznik sumeryjski", "Gwardia Królewska Sumeru", "Wojownik mykeński", "Rydwan mykeński", "Wojownik Sherden", "Halabardnik Shang", "Rydwan Shang", "Łucznik akadyjski", "Gaesatae", "Soldurii", "Rydwan celtycki", "Wojownik germański", "Berserker germański", "Taran", "Taran okuty", "Katapulta", "Wieża oblężnicza", "Wojownik tyrreński", "Wojownik szekelesz", "Konnica lancowa asyryjska", "Konnica łucznicza asyryjska", "Łucznik asyryjski", "Drużynnik", "Jeździec z oszczepami", "Strażnik bram Harappy", "Piechota induska", "Garnizon Harappy", "Rydwan Kapadokijski", "Piechota hetycka", "Gwardia hetycka", "Gwardia Ishtar", "Wojownik babiloński", "Piechota neobabilońska", "Tyrski miecznik", "Wojownik fenicki", "Gwardia Tyreńska", "Thorakites", "Evocati", "iButho z iklwa", "Gwardzista z champi", "Wojownik z żelaznym khopesh", "Mur tarcz (Sargonid)", "Miecznik galijski"];
[m[31m-const WEB_BUILDING_IDS: &[&str] = &["stolarnia", "kamieniarski", "kuznia", "odlewnia_brazu", "odlewnia_zelaza", "wielka_odlewnia", "targowisko", "port", "port_wielki", "spichlerz", "spichlerz_ii", "garncarnia", "cegielnia", "kamienne_kregi", "swiatynia", "biblioteka", "studnia", "akwedukt", "mennica", "palisada", "mury", "koszary", "magazyn", "stela", "palac", "palac_ii", "palac_iii", "kuznia_zelaza", "wielka_kuznia", "fort", "baszta", "warsztat_oblezniczy", "akademia", "teatr", "sad", "dom_starszyzny", "dwor_zarzadcy", "pretorium", "trybunal", "garnizon", "laznia_publiczna", "akademia_wojskowa"];
[m[31m-const WEB_TECH_NAMES: &[&str] = &["Obróbka drewna", "Garncarstwo", "Murarstwo", "Rolnictwo", "Łowiectwo", "Łucznictwo", "Oswojenie zwierząt", "Mistycyzm", "Wymiana", "Gospodarka wodna", "Koło", "Brązownictwo", "Żegluga", "Pismo", "Religia", "Jeździectwo", "Wojskowość", "Matematyka", "Handel", "Kodeks", "Budownictwo", "Waluta", "Astronomia", "Hutnictwo żelaza", "Inżynieria", "Oblężnictwo", "Filozofia", "Prawo", "Drogi brukowane", "Medycyna", "Obróbka żelaza", "Sztuka wojenna"];
[m[31m-const WEB_CUDA_IDS: &[&str] = &["piramidy", "wielka_stela", "wiszace_ogrody", "wyrocznia", "roquepertuse", "stupa_sanchi", "petra", "hamonga", "kolos", "osada_aschaffenburg", "ziggurat", "mundo_perdido", "terakotowa_armia", "koloseum", "dur_sharrukin", "brama_narodow", "palac_weiyang", "yerkapi", "posag_peruna"];
[m[31m-const WEB_PARKOWANE_IDS: &[&str] = &["nalanda", "angkor_wat", "wielki_dzwon", "mauzoleum_teodoryka", "kopiec_grobowy"];
[m[31m-const WEB_PANSTWA_KEYS: &[&str] = &["egipt", "sumer", "babilonia", "grecy", "hetyci", "celtowie", "harappa", "fenicjanie", "germanie", "inkowie", "chinczycy", "rzymianie", "asyria", "zulusi", "slowianie"];
[m[31m-const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &["egipt", "sumer", "babilonia", "grecy", "hetyci", "celtowie", "harappa", "fenicjanie", "germanie", "inkowie", "chinczycy", "rzymianie", "asyria", "zulusi", "slowianie"];
[m[31m-const WEB_RESOURCES: &[&str] = &["Żywność", "Drewno", "Kamień", "Glina", "Ruda", "Ruda żelaza", "Ruda cyny", "Koń", "Sól", "Złoto", "Cegła", "Ceramika", "Brąz", "Żelazo", "Stal"];
[m[31m-const WEB_TERRAIN_TYPES: &[&str] = &["Łąka", "Równina", "Wzgórza", "Góry", "Wybrzeże", "Morze", "Pustynia", "Polarny"];
[m[31m-const WEB_IMPROVEMENT_KEYS: &[&str] = &["bydlo", "droga", "droga_brukowana", "farma", "fort", "glinianka", "irygacja", "kamieniolom", "kopalnia_cyny", "kopalnia_miedzi", "kopalnia_zelaza", "kopalnia_zlota", "lama", "lodzie_rybackie", "oboz_lowiecki", "owce", "posterunek", "stadnina", "tarasy", "tartak", "warzelnia_soli", "wyrab"];
[m[32m+const WEB_UNITS_JEDNOSTKA: &[&str] = &[
[m[32m+    "Wojownik",
[m[32m+    "Procarz",
[m[32m+    "Oszczepnik",
[m[32m+    "Łucznik",
[m[32m+    "Zwiadowca",
[m[32m+    "Włócznik",
[m[32m+    "Wojownik z mieczem i tarczą",
[m[32m+    "Rydwan (woły)",
[m[32m+    "Konnica",
[m[32m+    "Galera",
[m[32m+    "Falanga",
[m[32m+    "Hieros Lochos (Święty Zastęp)",
[m[32m+    "Hastati",
[m[32m+    "Triari",
[m[32m+    "Jeździec chiński",
[m[32m+    "Hu Ben Wei (Gwardia Tygrysa)",
[m[32m+    "Impi",
[m[32m+    "Oszczepnik Zulu (Izijula)",
[m[32m+    "uThulwana (Białe Tarcze)",
[m[32m+    "Wojownik z maczugą (Chaska)",
[m[32m+    "Wojownik z toporem",
[m[32m+    "Procarz (Huaracoc)",
[m[32m+    "Oszczepnik (Estólica)",
[m[32m+    "Królewska Gwardia",
[m[32m+    "Rydwan konny",
[m[32m+    "Łucznik egipski",
[m[32m+    "Rydwan egipski",
[m[32m+    "Wojownik z khopesh",
[m[32m+    "Medżaj (Gwardia Faraona)",
[m[32m+    "Łucznik nubijski",
[m[32m+    "Łucznik sumeryjski",
[m[32m+    "Rydwan sumeryjski",
[m[32m+    "Włócznik sumeryjski",
[m[32m+    "Gwardia Królewska Sumeru",
[m[32m+    "Wojownik mykeński",
[m[32m+    "Rydwan mykeński",
[m[32m+    "Wojownik Sherden",
[m[32m+    "Halabardnik Shang",
[m[32m+    "Rydwan Shang",
[m[32m+    "Łucznik akadyjski",
[m[32m+    "Gaesatae",
[m[32m+    "Soldurii",
[m[32m+    "Rydwan celtycki",
[m[32m+    "Wojownik germański",
[m[32m+    "Berserker germański",
[m[32m+    "Taran",
[m[32m+    "Taran okuty",
[m[32m+    "Katapulta",
[m[32m+    "Wieża oblężnicza",
[m[32m+    "Wojownik tyrreński",
[m[32m+    "Wojownik szekelesz",
[m[32m+    "Konnica lancowa asyryjska",
[m[32m+    "Konnica łucznicza asyryjska",
[m[32m+    "Łucznik asyryjski",
[m[32m+    "Drużynnik",
[m[32m+    "Jeździec z oszczepami",
[m[32m+    "Strażnik bram Harappy",
[m[32m+    "Piechota induska",
[m[32m+    "Garnizon Harappy",
[m[32m+    "Rydwan Kapadokijski",
[m[32m+    "Piechota hetycka",
[m[32m+    "Gwardia hetycka",
[m[32m+    "Gwardia Ishtar",
[m[32m+    "Wojownik babiloński",
[m[32m+    "Piechota neobabilońska",
[m[32m+    "Tyrski miecznik",
[m[32m+    "Wojownik fenicki",
[m[32m+    "Gwardia Tyreńska",
[m[32m+    "Thorakites",
[m[32m+    "Evocati",
[m[32m+    "iButho z iklwa",
[m[32m+    "Gwardzista z champi",
[m[32m+    "Wojownik z żelaznym khopesh",
[m[32m+    "Mur tarcz (Sargonid)",
[m[32m+    "Miecznik galijski",
[m[32m+];
[m[32m+const WEB_BUILDING_IDS: &[&str] = &[
[m[32m+    "stolarnia",
[m[32m+    "kamieniarski",
[m[32m+    "kuznia",
[m[32m+    "odlewnia_brazu",
[m[32m+    "odlewnia_zelaza",
[m[32m+    "wielka_odlewnia",
[m[32m+    "targowisko",
[m[32m+    "port",
[m[32m+    "port_wielki",
[m[32m+    "spichlerz",
[m[32m+    "spichlerz_ii",
[m[32m+    "garncarnia",
[m[32m+    "cegielnia",
[m[32m+    "kamienne_kregi",
[m[32m+    "swiatynia",
[m[32m+    "biblioteka",
[m[32m+    "studnia",
[m[32m+    "akwedukt",
[m[32m+    "mennica",
[m[32m+    "palisada",
[m[32m+    "mury",
[m[32m+    "koszary",
[m[32m+    "magazyn",
[m[32m+    "stela",
[m[32m+    "palac",
[m[32m+    "palac_ii",
[m[32m+    "palac_iii",
[m[32m+    "kuznia_zelaza",
[m[32m+    "wielka_kuznia",
[m[32m+    "fort",
[m[32m+    "baszta",
[m[32m+    "warsztat_oblezniczy",
[m[32m+    "akademia",
[m[32m+    "teatr",
[m[32m+    "sad",
[m[32m+    "dom_starszyzny",
[m[32m+    "dwor_zarzadcy",
[m[32m+    "pretorium",
[m[32m+    "trybunal",
[m[32m+    "garnizon",
[m[32m+    "laznia_publiczna",
[m[32m+    "akademia_wojskowa",
[m[32m+];
[m[32m+const WEB_TECH_NAMES: &[&str] = &[
[m[32m+    "Obróbka drewna",
[m[32m+    "Garncarstwo",
[m[32m+    "Murarstwo",
[m[32m+    "Rolnictwo",
[m[32m+    "Łowiectwo",
[m[32m+    "Łucznictwo",
[m[32m+    "Oswojenie zwierząt",
[m[32m+    "Mistycyzm",
[m[32m+    "Wymiana",
[m[32m+    "Gospodarka wodna",
[m[32m+    "Koło",
[m[32m+    "Brązownictwo",
[m[32m+    "Żegluga",
[m[32m+    "Pismo",
[m[32m+    "Religia",
[m[32m+    "Jeździectwo",
[m[32m+    "Wojskowość",
[m[32m+    "Matematyka",
[m[32m+    "Handel",
[m[32m+    "Kodeks",
[m[32m+    "Budownictwo",
[m[32m+    "Waluta",
[m[32m+    "Astronomia",
[m[32m+    "Hutnictwo żelaza",
[m[32m+    "Inżynieria",
[m[32m+    "Oblężnictwo",
[m[32m+    "Filozofia",
[m[32m+    "Prawo",
[m[32m+    "Drogi brukowane",
[m[32m+    "Medycyna",
[m[32m+    "Obróbka żelaza",
[m[32m+    "Sztuka wojenna",
[m[32m+];
[m[32m+const WEB_CUDA_IDS: &[&str] = &[
[m[32m+    "piramidy",
[m[32m+    "wielka_stela",
[m[32m+    "wiszace_ogrody",
[m[32m+    "wyrocznia",
[m[32m+    "roquepertuse",
[m[32m+    "stupa_sanchi",
[m[32m+    "petra",
[m[32m+    "hamonga",
[m[32m+    "kolos",
[m[32m+    "osada_aschaffenburg",
[m[32m+    "ziggurat",
[m[32m+    "mundo_perdido",
[m[32m+    "terakotowa_armia",
[m[32m+    "koloseum",
[m[32m+    "dur_sharrukin",
[m[32m+    "brama_narodow",
[m[32m+    "palac_weiyang",
[m[32m+    "yerkapi",
[m[32m+    "posag_peruna",
[m[32m+];
[m[32m+const WEB_PARKOWANE_IDS: &[&str] = &[
[m[32m+    "nalanda",
[m[32m+    "angkor_wat",
[m[32m+    "wielki_dzwon",
[m[32m+    "mauzoleum_teodoryka",
[m[32m+    "kopiec_grobowy",
[m[32m+];
[m[32m+const WEB_PANSTWA_KEYS: &[&str] = &[
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "babilonia",
[m[32m+    "grecy",
[m[32m+    "hetyci",
[m[32m+    "celtowie",
[m[32m+    "harappa",
[m[32m+    "fenicjanie",
[m[32m+    "germanie",
[m[32m+    "inkowie",
[m[32m+    "chinczycy",
[m[32m+    "rzymianie",
[m[32m+    "asyria",
[m[32m+    "zulusi",
[m[32m+    "slowianie",
[m[32m+];
[m[32m+const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &[
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "babilonia",
[m[32m+    "grecy",
[m[32m+    "hetyci",
[m[32m+    "celtowie",
[m[32m+    "harappa",
[m[32m+    "fenicjanie",
[m[32m+    "germanie",
[m[32m+    "inkowie",
[m[32m+    "chinczycy",
[m[32m+    "rzymianie",
[m[32m+    "asyria",
[m[32m+    "zulusi",
[m[32m+    "slowianie",
[m[32m+];
[m[32m+const WEB_RESOURCES: &[&str] = &[
[m[32m+    "Żywność",
[m[32m+    "Drewno",
[m[32m+    "Kamień",
[m[32m+    "Glina",
[m[32m+    "Ruda",
[m[32m+    "Ruda żelaza",
[m[32m+    "Ruda cyny",
[m[32m+    "Koń",
[m[32m+    "Sól",
[m[32m+    "Złoto",
[m[32m+    "Cegła",
[m[32m+    "Ceramika",
[m[32m+    "Brąz",
[m[32m+    "Żelazo",
[m[32m+    "Stal",
[m[32m+];
[m[32m+const WEB_TERRAIN_TYPES: &[&str] = &[
[m[32m+    "Łąka",
[m[32m+    "Równina",
[m[32m+    "Wzgórza",
[m[32m+    "Góry",
[m[32m+    "Wybrzeże",
[m[32m+    "Morze",
[m[32m+    "Pustynia",
[m[32m+    "Polarny",
[m[32m+];
[m[32m+const WEB_IMPROVEMENT_KEYS: &[&str] = &[
[m[32m+    "bydlo",
[m[32m+    "droga",
[m[32m+    "droga_brukowana",
[m[32m+    "farma",
[m[32m+    "fort",
[m[32m+    "glinianka",
[m[32m+    "irygacja",
[m[32m+    "kamieniolom",
[m[32m+    "kopalnia_cyny",
[m[32m+    "kopalnia_miedzi",
[m[32m+    "kopalnia_zelaza",
[m[32m+    "kopalnia_zlota",
[m[32m+    "lama",
[m[32m+    "lodzie_rybackie",
[m[32m+    "oboz_lowiecki",
[m[32m+    "owce",
[m[32m+    "posterunek",
[m[32m+    "stadnina",
[m[32m+    "tarasy",
[m[32m+    "tartak",
[m[32m+    "warzelnia_soli",
[m[32m+    "wyrab",
[m[32m+];
[m 
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_loader.rs:20:
     fn new(tag: &str) -> Self {
         static COUNTER: AtomicUsize = AtomicUsize::new(0);
         let n = COUNTER.fetch_add(1, Ordering::SeqCst);
[31m-        let dir = std::env::temp_dir().join(format!(
[m[31m-            "civ-loader-{}-{}-{}",
[m[31m-            std::process::id(),
[m[31m-            tag,
[m[31m-            n
[m[31m-        ));
[m[32m+        let dir =
[m[32m+            std::env::temp_dir().join(format!("civ-loader-{}-{}-{}", std::process::id(), tag, n));
[m         let _ = fs::remove_dir_all(&dir);
         fs::create_dir_all(&dir).expect("create temp dir");
         TempDir(dir)
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine/tests/data_loader.rs:78:
 fn data_files_list_matches_directory_contents() {
     let mut on_disk: Vec<String> = fs::read_dir(data_dir())
         .expect("read data dir")
[31m-        .map(|e| e.expect("dir entry").file_name().to_string_lossy().into_owned())
[m[32m+        .map(|e| {
[m[32m+            e.expect("dir entry")
[m[32m+                .file_name()
[m[32m+                .to_string_lossy()
[m[32m+                .into_owned()
[m[32m+        })
[m         .filter(|n| n.ends_with(".json"))
         .collect();
     on_disk.sort();
EXIT=1
```

### cargo clippy --all-targets -- -D warnings
```text
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
    Blocking waiting for file lock on package cache
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine)
error: duplicated attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:15:9
   |
15 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes
   = note: `-D clippy::duplicated-attributes` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::duplicated_attributes)]`

error: duplicated attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:18:9
   |
18 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:21:9
   |
21 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:24:9
   |
24 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:27:9
   |
27 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: could not compile `civ-engine` (test "data_compliance") due to 5 previous errors
EXIT=101
```

### cargo clippy --all-targets --keep-going -- -D warnings (diagnostyka)
```text
    Blocking waiting for file lock on build directory
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine)
error: duplicated attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:15:9
   |
15 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes
   = note: `-D clippy::duplicated-attributes` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::duplicated_attributes)]`

error: duplicated attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:18:9
   |
18 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:21:9
   |
21 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:24:9
   |
24 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:27:9
   |
27 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: could not compile `civ-engine` (test "data_compliance") due to 5 previous errors
EXIT=101
```

### cargo clippy --test bridge_add_player -- -D warnings
```text
    Finished `dev` profile [unoptimized] target(s) in 0.06s
EXIT=0
```

### cargo test --offline
```text
    Blocking waiting for file lock on build directory
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abb7af83-320-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 41.10s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.50s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/debug/deps/data_compliance-bce92961776df717)

running 9 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test embedded_raw_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test root_reexports_are_the_same_production_api_types ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_can_coexist_with_non_food_layers ... ok
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test multiple_layers_stack_additively_per_resource ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_credits_income_before_paying_expenses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```


---

## Runda 2 — odpowiedź Operatora na zarzuty Evaluatora (R-RUSTPORT-P3-16-CI-GATES-GREEN-Q1)

Stan źródeł: commit `7dcc5e34` (baza `aa7b225b`), worktree `wf_abb7af83-320-3` w trybie detach. W tej rundzie **nie zmieniono kodu**. Przed przebiegami wykonano `touch` wszystkich `*.rs` w `rust-port/engine` (ochrona przed nieaktualnymi artefaktami na współdzielonym `CARGO_TARGET_DIR`, patrz sekcja „Uwaga o dysku współdzielonym"). Poniżej surowe wyjścia z tej rundy; każde kończy się linią `EXIT=`.

### Odpowiedzi na zarzuty

**Zarzut 1 — `cargo fmt --all -- --check` EXIT=1: PRZYJMUJĘ jako fakt, ODRZUCAM jako błąd Operatora.**
Dowód: sekcja RUNDA2-FMT. Pliki spoza allowlisty: `src/data/mod.rs` (1 hunk, linia 10), `tests/assets_manifest.rs` (20 hunków), `tests/data_compliance.rs` (20 hunków), `tests/data_loader.rs` (2 hunki). Dispatch w §ZADANIE 1 zakazał `cargo fmt --all` (dotknąłby plików P3.15) i nakazał przy pozostającym czerwonym fmt wypisać plik spoza allowlisty bez ruszania go. Operator tak zrobił. Niespełnienie GOAL (a) wynika z konfliktu zakresu (bramka `cargo fmt --all` obejmuje pliki, których dispatch zakazuje dotykać), a nie z pracy w allowlistcie. Rozszerzenie allowlisty należy do orkiestratora/właściciela.

**Zarzut 2 — `cargo clippy --all-targets -- -D warnings` EXIT=101: PRZYJMUJĘ jako fakt, ODRZUCAM jako błąd Operatora z tej samej przyczyny.**
Dowód: sekcja RUNDA2-CLIPPY-ALL. Pięć błędów `duplicated attribute` (cel `test data_compliance`): każdy wskazuje `tests/../src/data/{buildings_tech.rs:14, units_combat.rs:11, economy_society.rs:4, economy_society_part2.rs:4, terrain_map.rs:8}` (zbędny wewnętrzny `#![allow(dead_code)]`), a notka `first defined here` wskazuje `tests/data_compliance.rs:15,18,21,24,27` (`#[allow(dead_code)]`). Wszystkie poza allowlistą. Poprawka wymaga usunięcia jednego z dwóch duplikatów w plikach P3.15 — poza zakresem P3.16. Lint `large_enum_variant` z `bridge.rs` zniknął (potwierdzone: `cargo clippy --lib` EXIT=0, `cargo clippy --test bridge_add_player` EXIT=0).

**Zarzut 3 — kryterium „`git diff -w` pokazuje wyłącznie wynik pkt 2": PRZYJMUJĘ, że literalnie nie jest spełnione; ODRZUCAM, że zmienia to zachowanie.**
Wyjaśnienie: `git diff -w` ignoruje różnice wyłącznie w białych znakach w obrębie linii. `rustfmt` przenosi granice linii (zawijanie argumentów wywołań i `assert_eq!`, rozbicie `write!`), a także zmienia kolejność elementów `use` w `src/data/loader.rs` i `tests/data_civilizations.rs`. Takie zmiany nie są różnicą białych znaków, więc `-w` ich nie ukrywa (stąd 66 insercji / 21 usunięć). Brak zmian semantycznych wykazano dowodem mocniejszym niż `-w`:
- `src/data/loader.rs` i `tests/data_civilizations.rs`: multizbiór tokenów (podział po białych znakach oraz `, ; ( ) { } [ ] < >`), baza vs `7dcc5e34`, różnica = **0 linii** (sekcja RUNDA2-TOKENS).
- `tests/data_buildings_tech.rs`, `tests/data_economy_society.rs`, `tests/data_units_combat.rs`: hash md5 pliku po usunięciu wszystkich białych znaków identyczny w bazie i w `7dcc5e34` (sekcja RUNDA2-TOKENS).
- `src/bridge.rs`: diff to wyłącznie 3 linie komentarza i `#[allow(clippy::large_enum_variant)]` (sekcja RUNDA2-BRIDGE-DIFF).
Wniosek: zmiany są czysto formatujące lub dotyczą atrybutu lint; logika, serde i kontrakt JSON bez zmian; potwierdza to `cargo test --offline` = 292/0 (zarzut 4 i sekcja RUNDA2-TEST).

**Zarzut 4 — brak tabeli wyników `cargo test` per binarka w tabeli: PRZYJMUJĘ.**
Dodano tabelę poniżej (36 binarek + doc-tests, suma 292 passed, 0 failed, wartości z surowego wyjścia RUNDA2-TEST). `data_compliance` = 9 passed (zgodnie z bazą; wartość 39 z rundy 1 była nieaktualną binarką).

### Tabela `cargo test --offline` (runda 2, z surowego wyjścia)

| Binarka | passed | failed |
|---|---|---|
| src/lib.rs (unittests) | 6 | 0 |
| ai_turn | 11 | 0 |
| assets_manifest | 13 | 0 |
| barbarians | 10 | 0 |
| bridge_add_player | 1 | 0 |
| building_costs | 10 | 0 |
| city_growth | 10 | 0 |
| combat | 7 | 0 |
| data_buildings_tech | 3 | 0 |
| data_civilizations | 7 | 0 |
| data_compliance | 9 | 0 |
| data_economy_society | 9 | 0 |
| data_loader | 14 | 0 |
| data_terrain_map | 4 | 0 |
| data_units_combat | 6 | 0 |
| diplomacy | 31 | 0 |
| events | 8 | 0 |
| hex_terrain | 10 | 0 |
| improvements | 13 | 0 |
| map_generator | 6 | 0 |
| parity_suite | 11 | 0 |
| pathfinding | 8 | 0 |
| playable_slice | 7 | 0 |
| recruitment | 7 | 0 |
| replay | 6 | 0 |
| resource_production | 5 | 0 |
| rng | 4 | 0 |
| save_load | 6 | 0 |
| smoke | 2 | 0 |
| state_dto | 10 | 0 |
| steam_adapter | 5 | 0 |
| terrain_movement_fix | 9 | 0 |
| trade | 12 | 0 |
| turn_economy | 7 | 0 |
| unit_epoch | 5 | 0 |
| Doc-tests civ_engine | 0 | 0 |
| **Suma** | **292** | **0** |

### Stan końcowy rundy 2

- `rustfmt --check` na 6 plikach allowlisty (5 z zakresu + `src/bridge.rs`): EXIT=0 (sekcja RUNDA2-RUSTFMT).
- GOAL (a) `cargo fmt --all -- --check`: **NIE SPEŁNIONE** w granicach allowlisty (4 pliki spoza).
- GOAL (b) `cargo clippy --all-targets -- -D warnings`: **NIE SPEŁNIONE** w granicach allowlisty (5 × `duplicated attribute` spoza). Bridge lint: spełniony.
- `cargo test --offline`: EXIT=0, 292 passed, 0 failed = baseline.
- Brak zmian kodu w tej rundzie; brak nowego commita kodowego; brak `Cargo.lock` w commicie; brak push.

Opcje dla decyzji właściciela/orkiestratora (Operator ich nie wykonuje, bo leżą poza allowlistą):
- (a) Rozszerzyć allowlistę o `src/data/mod.rs`, `src/data/{buildings_tech,economy_society,economy_society_part2,terrain_map,units_combat}.rs`, `tests/data_compliance.rs`, `tests/assets_manifest.rs`, `tests/data_loader.rs`. Zmiany wg wyjścia powyżej: `rustfmt` na tych plikach oraz usunięcie jednego z duplikatów atrybutu `dead_code` (wewnętrznego `#![allow]` w `src/data/*` albo zewnętrznego `#[allow]` w `tests/data_compliance.rs`). Wymaga to ponownej weryfikacji (nieprzetestowane przez Operatora).
- (b) Zamknąć P3.15 (który dotyka tych plików), a następnie uruchomić P3.16 ponownie.



## Runda 2 — surowe wyjścia (kod bez zmian względem 7dcc5e34)

### RUNDA2-RUSTFMT: rustfmt --check na plikach allowlisty

```text
RUSTFMT_CHECK tests/data_buildings_tech.rs EXIT=0
RUSTFMT_CHECK tests/data_civilizations.rs EXIT=0
RUSTFMT_CHECK tests/data_economy_society.rs EXIT=0
RUSTFMT_CHECK tests/data_units_combat.rs EXIT=0
RUSTFMT_CHECK src/data/loader.rs EXIT=0
RUSTFMT_CHECK src/bridge.rs EXIT=0
```

### RUNDA2-FMT: cargo fmt --all -- --check (PEŁNE)

```text
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/src/data/mod.rs:10:
 pub mod civilizations;
 pub mod economy_society;
 pub mod economy_society_part2;
[32m+pub mod loader;
[m pub mod terrain_map;
 pub mod units_combat;
[31m-pub mod loader;
[m
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:29:
 }

 fn manifest_path() -> PathBuf {
[31m-    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("assets").join("MANIFEST.tsv")
[m[32m+    Path::new(env!("CARGO_MANIFEST_DIR"))
[m[32m+        .join("..")
[m[32m+        .join("assets")
[m[32m+        .join("MANIFEST.tsv")
[m }

 fn assets_dir() -> PathBuf {
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:36:
[31m-    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("assets")
[m[32m+    Path::new(env!("CARGO_MANIFEST_DIR"))
[m[32m+        .join("..")
[m[32m+        .join("assets")
[m }

 /// Parsuje manifest; zwraca wpisy danych (bez nagłówka). Błąd przy złym nagłówku lub kolumnach.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:109:
         if path.is_dir() {
             walk_files(&path, root, out);
         } else {
[31m-            let rel = path.strip_prefix(root).expect("prefix").to_string_lossy().replace('\\', "/");
[m[32m+            let rel = path
[m[32m+                .strip_prefix(root)
[m[32m+                .expect("prefix")
[m[32m+                .to_string_lossy()
[m[32m+                .replace('\\', "/");
[m             out.insert(rel);
         }
     }
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:120:
 // ---------------------------------------------------------------------------

 fn sha1(data: &[u8]) -> [u8; 20] {
[31m-    let mut h: [u32; 5] = [0x6745_2301, 0xEFCD_AB89, 0x98BA_DCFE, 0x1032_5476, 0xC3D2_E1F0];
[m[32m+    let mut h: [u32; 5] = [
[m[32m+        0x6745_2301,
[m[32m+        0xEFCD_AB89,
[m[32m+        0x98BA_DCFE,
[m[32m+        0x1032_5476,
[m[32m+        0xC3D2_E1F0,
[m[32m+    ];
[m     let bit_len = (data.len() as u64).wrapping_mul(8);
     let mut msg = Vec::with_capacity(data.len() + 72);
     msg.extend_from_slice(data);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:133:
     for chunk in msg.chunks_exact(64) {
         let mut w = [0u32; 80];
         for i in 0..16 {
[31m-            w[i] = u32::from_be_bytes([chunk[4 * i], chunk[4 * i + 1], chunk[4 * i + 2], chunk[4 * i + 3]]);
[m[32m+            w[i] = u32::from_be_bytes([
[m[32m+                chunk[4 * i],
[m[32m+                chunk[4 * i + 1],
[m[32m+                chunk[4 * i + 2],
[m[32m+                chunk[4 * i + 3],
[m[32m+            ]);
[m         }
         for i in 16..80 {
             w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:194:
 fn sha1_matches_known_vectors() {
     // FIPS 180-4 / powszechnie znane wektory; źródło: RFC 3174 / NIST.
     assert_eq!(hex(&sha1(b"")), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
[31m-    assert_eq!(hex(&sha1(b"abc")), "a9993e364706816aba3e25717850c26c9cd0d89d");
[m     assert_eq!(
[31m-        hex(&sha1(b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")),
[m[32m+        hex(&sha1(b"abc")),
[m[32m+        "a9993e364706816aba3e25717850c26c9cd0d89d"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        hex(&sha1(
[m[32m+            b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
[m[32m+        )),
[m         "84983e441c3bd26ebaae4aa1f95129e5e54670f1"
     );
     // git blob pustego pliku (git hash-object /dev/null)
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:203:
[31m-    assert_eq!(git_blob_sha1_hex(b""), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
[m[32m+    assert_eq!(
[m[32m+        git_blob_sha1_hex(b""),
[m[32m+        "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
[m[32m+    );
[m }

 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:209:
     let first = text.split('\n').next().expect("pierwszy wiersz");
     assert_eq!(first, MANIFEST_HEADER, "nagłówek manifestu");
     let entries = parse_manifest(&text).expect("parse");
[31m-    assert_eq!(entries.len(), EXPECTED_DATA_ROWS, "liczba wierszy danych (P3-8: 428/428)");
[m[32m+    assert_eq!(
[m[32m+        entries.len(),
[m[32m+        EXPECTED_DATA_ROWS,
[m[32m+        "liczba wierszy danych (P3-8: 428/428)"
[m[32m+    );
[m }

 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:216:
 fn manifest_dest_paths_are_unique() {
     let entries = load_manifest();
     let unique: BTreeSet<&str> = entries.iter().map(|e| e.dst.as_str()).collect();
[31m-    assert_eq!(unique.len(), entries.len(), "ścieżki docelowe muszą być unikalne");
[m[32m+    assert_eq!(
[m[32m+        unique.len(),
[m[32m+        entries.len(),
[m[32m+        "ścieżki docelowe muszą być unikalne"
[m[32m+    );
[m     for e in &entries {
[31m-        assert!(e.dst.starts_with(DEST_PREFIX), "prefiks docelowy: {}", e.dst);
[m[32m+        assert!(
[m[32m+            e.dst.starts_with(DEST_PREFIX),
[m[32m+            "prefiks docelowy: {}",
[m[32m+            e.dst
[m[32m+        );
[m     }
 }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:226:
 fn every_manifest_entry_exists_with_declared_size() {
     let entries = load_manifest();
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert!(errors.is_empty(), "rozbieżności manifestu z katalogiem:\n{}", errors.join("\n"));
[m[32m+    assert!(
[m[32m+        errors.is_empty(),
[m[32m+        "rozbieżności manifestu z katalogiem:\n{}",
[m[32m+        errors.join("\n")
[m[32m+    );
[m }

 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:233:
 fn every_entry_blob_sha1_matches_manifest_column() {
     let entries = load_manifest();
     let errors = validate(&entries, &repo_root(), true);
[31m-    assert!(errors.is_empty(), "rozbieżności blob-SHA1:\n{}", errors.join("\n"));
[m[32m+    assert!(
[m[32m+        errors.is_empty(),
[m[32m+        "rozbieżności blob-SHA1:\n{}",
[m[32m+        errors.join("\n")
[m[32m+    );
[m }

 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:248:
     let extra: Vec<&String> = on_disk.difference(&expected).collect();
     let missing: Vec<&String> = expected.difference(&on_disk).collect();
     assert!(extra.is_empty(), "pliki spoza manifestu: {extra:?}");
[31m-    assert!(missing.is_empty(), "pliki z manifestu brak na dysku: {missing:?}");
[m[32m+    assert!(
[m[32m+        missing.is_empty(),
[m[32m+        "pliki z manifestu brak na dysku: {missing:?}"
[m[32m+    );
[m     assert_eq!(on_disk.len(), EXPECTED_DATA_ROWS);
 }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:268:
     assert_eq!(counts.get("jpg"), Some(&45), "jpg");
     assert_eq!(counts.get("png"), Some(&2), "png");
     assert_eq!(counts.get("mp3"), Some(&62), "mp3");
[31m-    assert_eq!(counts.values().sum::<usize>(), EXPECTED_DATA_ROWS, "suma rozszerzeń");
[m[32m+    assert_eq!(
[m[32m+        counts.values().sum::<usize>(),
[m[32m+        EXPECTED_DATA_ROWS,
[m[32m+        "suma rozszerzeń"
[m[32m+    );
[m }

 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:287:
         slot.0 += 1;
         slot.1 += e.size;
     }
[31m-    assert_eq!(sums.get("icons"), Some(&(319, 136_176)), "ikony (P1.11 §2 wiersze 26+27)");
[m[31m-    assert_eq!(sums.get("portraits"), Some(&(45, 445_951)), "portrety (P1.11 §2 wiersz 28)");
[m[31m-    assert_eq!(sums.get("hero"), Some(&(2, 4_214_674)), "hero (P1.11 §2 wiersz 29)");
[m[31m-    assert_eq!(sums.get("music"), Some(&(62, 44_584_683)), "muzyka (P1.11 §2 wiersze 31+32)");
[m[31m-    assert_eq!(sums.len(), 4, "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)");
[m[32m+    assert_eq!(
[m[32m+        sums.get("icons"),
[m[32m+        Some(&(319, 136_176)),
[m[32m+        "ikony (P1.11 §2 wiersze 26+27)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("portraits"),
[m[32m+        Some(&(45, 445_951)),
[m[32m+        "portrety (P1.11 §2 wiersz 28)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("hero"),
[m[32m+        Some(&(2, 4_214_674)),
[m[32m+        "hero (P1.11 §2 wiersz 29)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.get("music"),
[m[32m+        Some(&(62, 44_584_683)),
[m[32m+        "muzyka (P1.11 §2 wiersze 31+32)"
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        sums.len(),
[m[32m+        4,
[m[32m+        "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)"
[m[32m+    );
[m }

 #[test]
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:298:
 fn negative_validator_rejects_wrong_size() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     entries[1].size += 1;
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert_eq!(errors.len(), 1, "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("size mismatch"), "{errors:?}");
 }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:309:
 fn negative_validator_rejects_missing_file() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     entries[0].dst = "rust-port/assets/icons/does-not-exist-xyz.svg".to_string();
     let errors = validate(&entries, &repo_root(), false);
[31m-    assert_eq!(errors.len(), 1, "brakujący plik musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "brakujący plik musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("brak pliku"), "{errors:?}");
 }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:320:
 fn negative_validator_rejects_duplicate_dest() {
     let mut entries = load_manifest();
     entries.truncate(3);
[31m-    assert!(validate(&entries, &repo_root(), false).is_empty(), "kontrola: prawdziwe wpisy przechodzą");
[m[32m+    assert!(
[m[32m+        validate(&entries, &repo_root(), false).is_empty(),
[m[32m+        "kontrola: prawdziwe wpisy przechodzą"
[m[32m+    );
[m     let dup = entries[0].clone();
     entries.push(dup);
     let errors = validate(&entries, &repo_root(), false);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:327:
[31m-    assert_eq!(errors.len(), 1, "duplikat musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "duplikat musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("duplikat"), "{errors:?}");
 }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:333:
     let mut entries = load_manifest();
     entries.truncate(2);
     let real = validate(&entries, &repo_root(), true);
[31m-    assert!(real.is_empty(), "kontrola: prawdziwe SHA przechodzą: {real:?}");
[m[32m+    assert!(
[m[32m+        real.is_empty(),
[m[32m+        "kontrola: prawdziwe SHA przechodzą: {real:?}"
[m[32m+    );
[m     entries[0].sha = "0".repeat(40);
     let errors = validate(&entries, &repo_root(), true);
[31m-    assert_eq!(errors.len(), 1, "zły SHA musi dać dokładnie 1 błąd: {errors:?}");
[m[32m+    assert_eq!(
[m[32m+        errors.len(),
[m[32m+        1,
[m[32m+        "zły SHA musi dać dokładnie 1 błąd: {errors:?}"
[m[32m+    );
[m     assert!(errors[0].starts_with("sha mismatch"), "{errors:?}");
 }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/assets_manifest.rs:343:
 #[test]
 fn negative_parser_rejects_bad_header_and_columns() {
     let real = fs::read_to_string(manifest_path()).expect("MANIFEST.tsv czytelny");
[31m-    assert!(parse_manifest(&real).is_ok(), "kontrola: prawdziwy manifest parsuje się");
[m[32m+    assert!(
[m[32m+        parse_manifest(&real).is_ok(),
[m[32m+        "kontrola: prawdziwy manifest parsuje się"
[m[32m+    );
[m     let bad_header = "sha\tsize\tsrc\tdst\na\t1\tb\tc\n";
[31m-    assert!(parse_manifest(bad_header).is_err(), "zły nagłówek musi być odrzucony");
[m[32m+    assert!(
[m[32m+        parse_manifest(bad_header).is_err(),
[m[32m+        "zły nagłówek musi być odrzucony"
[m[32m+    );
[m     let bad_cols = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\n");
[31m-    assert!(parse_manifest(&bad_cols).is_err(), "wiersz z 3 kolumnami musi być odrzucony");
[m[32m+    assert!(
[m[32m+        parse_manifest(&bad_cols).is_err(),
[m[32m+        "wiersz z 3 kolumnami musi być odrzucony"
[m[32m+    );
[m     let blank_mid = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\tdst\n\nabc\t1\tsrc\tdst2\n");
[31m-    assert!(parse_manifest(&blank_mid).is_err(), "pusta linia w środku musi być odrzucona");
[m[32m+    assert!(
[m[32m+        parse_manifest(&blank_mid).is_err(),
[m[32m+        "pusta linia w środku musi być odrzucona"
[m[32m+    );
[m }

Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:8:
 // Testy nie duplikuja asercji z data_*.rs; dodaja: kompletnosc ID/licznosci wzgledem web oraz
 // probe parsowania wszystkich 29 plikow `rust-port/engine/data/*.json`.

[31m-#[path = "../src/data/civilizations.rs"]
[m[31m-#[allow(dead_code)]
[m[31m-mod civilizations;
[m #[path = "../src/data/buildings_tech.rs"]
 #[allow(dead_code)]
 mod buildings_tech;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:17:
[31m-#[path = "../src/data/units_combat.rs"]
[m[32m+#[path = "../src/data/civilizations.rs"]
[m #[allow(dead_code)]
[31m-mod units_combat;
[m[32m+mod civilizations;
[m #[path = "../src/data/economy_society.rs"]
 #[allow(dead_code)]
 mod economy_society;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:26:
 #[path = "../src/data/terrain_map.rs"]
 #[allow(dead_code)]
 mod terrain_map;
[32m+#[path = "../src/data/units_combat.rs"]
[m[32m+#[allow(dead_code)]
[m[32m+mod units_combat;
[m
 use serde_json::Value;
 use std::collections::BTreeSet;
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:59:

 fn no_dups(name: &str, ids: &[&str]) {
     let s: BTreeSet<&str> = ids.iter().copied().collect();
[31m-    assert_eq!(s.len(), ids.len(), "{name}: duplicate IDs in Rust collection");
[m[32m+    assert_eq!(
[m[32m+        s.len(),
[m[32m+        ids.len(),
[m[32m+        "{name}: duplicate IDs in Rust collection"
[m[32m+    );
[m }

 // ---------------------------------------------------------------------------
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:95:
     assert_eq!(WEB_TERRAIN_TYPES.len(), WEB_TERRAIN_TYPES_COUNT);
     assert_eq!(WEB_IMPROVEMENT_KEYS.len(), WEB_IMPROVEMENT_COUNT);
     // Stale ID wewnetrznie spojne z pinem (typ cywilizacji == klucze panstw cudow).
[31m-    assert_eq!(set(WEB_CIV_TYPY.iter().copied()), set(WEB_PANSTWA_KEYS.iter().copied()));
[m[31m-    assert_eq!(set(WEB_PANSTWA_KEYS.iter().copied()), set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied()));
[m[32m+    assert_eq!(
[m[32m+        set(WEB_CIV_TYPY.iter().copied()),
[m[32m+        set(WEB_PANSTWA_KEYS.iter().copied())
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        set(WEB_PANSTWA_KEYS.iter().copied()),
[m[32m+        set(WEB_WSZYSTKIE_CYWILIZACJE.iter().copied())
[m[32m+    );
[m }

 // (a) liczba i ID cywilizacji: Rust == web na pinie.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:105:
     let f = parse_civs().expect("civs.json");
     assert_eq!(f.cywilizacje.len(), WEB_CIV_COUNT);
     assert_eq!(f.start_gry.len(), WEB_START_GRY_COUNT);
[31m-    no_dups("civs.cywilizacja", &f.cywilizacje.iter().map(|c| c.cywilizacja.as_str()).collect::<Vec<_>>());
[m[31m-    no_dups("civs.typ_cywilizacji", &f.cywilizacje.iter().map(|c| c.typ_cywilizacji.as_str()).collect::<Vec<_>>());
[m[32m+    no_dups(
[m[32m+        "civs.cywilizacja",
[m[32m+        &f.cywilizacje
[m[32m+            .iter()
[m[32m+            .map(|c| c.cywilizacja.as_str())
[m[32m+            .collect::<Vec<_>>(),
[m[32m+    );
[m[32m+    no_dups(
[m[32m+        "civs.typ_cywilizacji",
[m[32m+        &f.cywilizacje
[m[32m+            .iter()
[m[32m+            .map(|c| c.typ_cywilizacji.as_str())
[m[32m+            .collect::<Vec<_>>(),
[m[32m+    );
[m     assert_eq!(
         set(f.cywilizacje.iter().map(|c| c.cywilizacja.as_str())),
         set(WEB_CIV_NAMES.iter().copied()),
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:169:
 #[test]
 fn collection_counts_match_web_pin() {
     assert_eq!(parse_units().expect("units").len(), WEB_UNITS_COUNT);
[31m-    assert_eq!(parse_buildings().expect("buildings").len(), WEB_BUILDINGS_COUNT);
[m[31m-    assert_eq!(parse_tech().expect("tech").technologie.len(), WEB_TECH_COUNT);
[m[32m+    assert_eq!(
[m[32m+        parse_buildings().expect("buildings").len(),
[m[32m+        WEB_BUILDINGS_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        parse_tech().expect("tech").technologie.len(),
[m[32m+        WEB_TECH_COUNT
[m[32m+    );
[m     let w = parse_wonders().expect("wonders");
     assert_eq!(w.cuda.len(), WEB_CUDA_COUNT);
     assert_eq!(w.parkowane_epoka4plus.len(), WEB_PARKOWANE_COUNT);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:177:
     assert_eq!(w.panstwa.len(), WEB_PANSTWA_COUNT);
[31m-    assert_eq!(parse_resources().expect("resources").len(), WEB_RESOURCES_COUNT);
[m[32m+    assert_eq!(
[m[32m+        parse_resources().expect("resources").len(),
[m[32m+        WEB_RESOURCES_COUNT
[m[32m+    );
[m     let ty = parse_terrain_yields().expect("terrain-yields");
     assert_eq!(ty.terrain_types.len(), WEB_TERRAIN_TYPES_COUNT);
     assert_eq!(ty.terrain_modifiers.len(), WEB_TERRAIN_MODIFIERS_COUNT);
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:186:
     let units = parse_units().expect("units");
     let names: Vec<&str> = units.iter().map(|u| u.jednostka.as_str()).collect();
     no_dups("units.Jednostka", &names);
[31m-    assert_eq!(set(names.iter().copied()), set(WEB_UNITS_JEDNOSTKA.iter().copied()), "units");
[m[32m+    assert_eq!(
[m[32m+        set(names.iter().copied()),
[m[32m+        set(WEB_UNITS_JEDNOSTKA.iter().copied()),
[m[32m+        "units"
[m[32m+    );
[m
     let b = parse_buildings().expect("buildings");
     let ids: Vec<&str> = b.iter().map(|x| x.id.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:193:
     no_dups("buildings.id", &ids);
[31m-    assert_eq!(set(ids.iter().copied()), set(WEB_BUILDING_IDS.iter().copied()), "buildings");
[m[32m+    assert_eq!(
[m[32m+        set(ids.iter().copied()),
[m[32m+        set(WEB_BUILDING_IDS.iter().copied()),
[m[32m+        "buildings"
[m[32m+    );
[m
     let t = parse_tech().expect("tech");
[31m-    let tn: Vec<&str> = t.technologie.iter().map(|x| x.technologia.as_str()).collect();
[m[32m+    let tn: Vec<&str> = t
[m[32m+        .technologie
[m[32m+        .iter()
[m[32m+        .map(|x| x.technologia.as_str())
[m[32m+        .collect();
[m     no_dups("tech.Technologia", &tn);
[31m-    assert_eq!(set(tn.iter().copied()), set(WEB_TECH_NAMES.iter().copied()), "tech");
[m[32m+    assert_eq!(
[m[32m+        set(tn.iter().copied()),
[m[32m+        set(WEB_TECH_NAMES.iter().copied()),
[m[32m+        "tech"
[m[32m+    );
[m
     let w = parse_wonders().expect("wonders");
     let cuda: Vec<&str> = w.cuda.iter().map(|c| c.id.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:203:
     no_dups("cuda.id", &cuda);
[31m-    assert_eq!(set(cuda.iter().copied()), set(WEB_CUDA_IDS.iter().copied()), "cuda");
[m[31m-    let park: Vec<&str> = w.parkowane_epoka4plus.iter().map(|c| c.id.as_str()).collect();
[m[31m-    assert_eq!(set(park.iter().copied()), set(WEB_PARKOWANE_IDS.iter().copied()), "parkowane");
[m[32m+    assert_eq!(
[m[32m+        set(cuda.iter().copied()),
[m[32m+        set(WEB_CUDA_IDS.iter().copied()),
[m[32m+        "cuda"
[m[32m+    );
[m[32m+    let park: Vec<&str> = w
[m[32m+        .parkowane_epoka4plus
[m[32m+        .iter()
[m[32m+        .map(|c| c.id.as_str())
[m[32m+        .collect();
[m[32m+    assert_eq!(
[m[32m+        set(park.iter().copied()),
[m[32m+        set(WEB_PARKOWANE_IDS.iter().copied()),
[m[32m+        "parkowane"
[m[32m+    );
[m
     let res = parse_resources().expect("resources");
     let rn: Vec<&str> = res.iter().map(|r| r.surowiec.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:210:
     no_dups("resources.Surowiec", &rn);
[31m-    assert_eq!(set(rn.iter().copied()), set(WEB_RESOURCES.iter().copied()), "resources");
[m[32m+    assert_eq!(
[m[32m+        set(rn.iter().copied()),
[m[32m+        set(WEB_RESOURCES.iter().copied()),
[m[32m+        "resources"
[m[32m+    );
[m
     let ty = parse_terrain_yields().expect("terrain-yields");
     let tt: Vec<&str> = ty.terrain_types.iter().map(|x| x.teren.as_str()).collect();
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:215:
     no_dups("terrain_types.Teren", &tt);
[31m-    assert_eq!(set(tt.iter().copied()), set(WEB_TERRAIN_TYPES.iter().copied()), "terrain types");
[m[32m+    assert_eq!(
[m[32m+        set(tt.iter().copied()),
[m[32m+        set(WEB_TERRAIN_TYPES.iter().copied()),
[m[32m+        "terrain types"
[m[32m+    );
[m }

 // Embedded kopie (include_str! w src/data) == web: liczby z surowego Value, niezalezne od struktur.
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:220:
 #[test]
 fn embedded_raw_counts_match_web_pin() {
     assert_eq!(raw(UNITS_JSON).as_array().unwrap().len(), WEB_UNITS_COUNT);
[31m-    assert_eq!(raw(BUILDINGS_JSON).as_array().unwrap().len(), WEB_BUILDINGS_COUNT);
[m[31m-    assert_eq!(raw(TECH_JSON)["technologie"].as_array().unwrap().len(), WEB_TECH_COUNT);
[m[31m-    assert_eq!(raw(include_str!("../data/resources.json")).as_array().unwrap().len(), WEB_RESOURCES_COUNT);
[m[32m+    assert_eq!(
[m[32m+        raw(BUILDINGS_JSON).as_array().unwrap().len(),
[m[32m+        WEB_BUILDINGS_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        raw(TECH_JSON)["technologie"].as_array().unwrap().len(),
[m[32m+        WEB_TECH_COUNT
[m[32m+    );
[m[32m+    assert_eq!(
[m[32m+        raw(include_str!("../data/resources.json"))
[m[32m+            .as_array()
[m[32m+            .unwrap()
[m[32m+            .len(),
[m[32m+        WEB_RESOURCES_COUNT
[m[32m+    );
[m     let imp = raw(TERRAIN_IMPROVEMENTS_JSON);
     let keys: BTreeSet<&str> = imp
         .as_object()
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:232:
         .filter(|k| !k.starts_with('_'))
         .collect();
     assert_eq!(keys.len(), WEB_IMPROVEMENT_COUNT);
[31m-    assert_eq!(keys, set(WEB_IMPROVEMENT_KEYS.iter().copied()), "terrain-improvements klucze != web");
[m[32m+    assert_eq!(
[m[32m+        keys,
[m[32m+        set(WEB_IMPROVEMENT_KEYS.iter().copied()),
[m[32m+        "terrain-improvements klucze != web"
[m[32m+    );
[m }

 // terrain-improvements: struktura ma deny_unknown_fields, wiec sukces parsowania dowodzi tylko, ze
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:240:
 // (brakujace pole Option przechodzi bez bledu). Sprawdzane sa tylko dwa pola jako probka.
 #[test]
 fn terrain_improvements_parses_strict_with_farma_and_posterunek() {
[31m-    let f = parse_terrain_improvements().expect("terrain-improvements.json must parse (deny_unknown_fields)");
[m[32m+    let f = parse_terrain_improvements()
[m[32m+        .expect("terrain-improvements.json must parse (deny_unknown_fields)");
[m     assert!(!f.farma.nazwa.is_empty());
     assert!(!f.posterunek.nazwa.is_empty());
 }
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:262:
     probe!("civ-params.json", parse_civ_params());
     probe!("civ-ai.json", parse_civ_ai());
     probe!("diplomacy.json", parse_diplomacy());
[31m-    probe!("diplomacy-acceptance-points.json", parse_diplomacy_acceptance_points());
[m[32m+    probe!(
[m[32m+        "diplomacy-acceptance-points.json",
[m[32m+        parse_diplomacy_acceptance_points()
[m[32m+    );
[m     probe!("city-names-pools.json", parse_city_names_pools());
     probe!("buildings.json", parse_buildings());
     probe!("wonders.json", parse_wonders());
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:275:
     probe!("power-params.json", parse_power_params());
     probe!("econ-params.json", parse_econ_params());
     probe!("society-params.json", parse_society_params());
[31m-    probe!("epoka-ludnosc-manpower.json", parse_epoka_ludnosc_manpower());
[m[31m-    probe!("citizen-resource-upkeep.json", parse_citizen_resource_upkeep());
[m[32m+    probe!(
[m[32m+        "epoka-ludnosc-manpower.json",
[m[32m+        parse_epoka_ludnosc_manpower()
[m[32m+    );
[m[32m+    probe!(
[m[32m+        "citizen-resource-upkeep.json",
[m[32m+        parse_citizen_resource_upkeep()
[m[32m+    );
[m     probe!("miasto-params.json", parse_miasto_params());
     probe!("resources.json", parse_resources());
     probe!("e-start-params.json", parse_e_start_params());
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:293:
         .filter_map(|e| e.ok())
         .filter(|e| e.path().extension().is_some_and(|x| x == "json"))
         .count();
[31m-    assert_eq!(on_disk, ok, "pliki *.json w rust-port/engine/data nieobjete probe");
[m[32m+    assert_eq!(
[m[32m+        on_disk, ok,
[m[32m+        "pliki *.json w rust-port/engine/data nieobjete probe"
[m[32m+    );
[m }

 // (c, LUKA — nie test): 1:1 round-trip (typed -> Value == raw) mozliwy dzis TYLKO dla 7 plikow
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_compliance.rs:303:

 // Stale ID z web (generowane z gra/data/*.json @ edb8fb56, wklejone literalnie).
 const WEB_CIV_NAMES: &[&str] = &[
[31m-    "Grecy", "Rzymianie", "Chińczycy", "Inkowie", "Zulusi", "Egipt", "Sumerowie", "Celtowie",
[m[31m-    "Germanie", "Harappa", "Hetyci", "Słowianie", "Babilonia", "Asyria", "Fenicjanie",
[m[32m+    "Grecy",
[m[32m+    "Rzymianie",
[m[32m+    "Chińczycy",
[m[32m+    "Inkowie",
[m[32m+    "Zulusi",
[m[32m+    "Egipt",
[m[32m+    "Sumerowie",
[m[32m+    "Celtowie",
[m[32m+    "Germanie",
[m[32m+    "Harappa",
[m[32m+    "Hetyci",
[m[32m+    "Słowianie",
[m[32m+    "Babilonia",
[m[32m+    "Asyria",
[m[32m+    "Fenicjanie",
[m ]; // civs.json .cywilizacje[].Cywilizacja
 const WEB_CIV_TYPY: &[&str] = &[
[31m-    "grecy", "rzymianie", "chinczycy", "inkowie", "zulusi", "egipt", "sumer", "celtowie",
[m[31m-    "germanie", "harappa", "hetyci", "slowianie", "babilonia", "asyria", "fenicjanie",
[m[32m+    "grecy",
[m[32m+    "rzymianie",
[m[32m+    "chinczycy",
[m[32m+    "inkowie",
[m[32m+    "zulusi",
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "celtowie",
[m[32m+    "germanie",
[m[32m+    "harappa",
[m[32m+    "hetyci",
[m[32m+    "slowianie",
[m[32m+    "babilonia",
[m[32m+    "asyria",
[m[32m+    "fenicjanie",
[m ]; // civs.json .cywilizacje[].typCywilizacji (ID)

[31m-const WEB_UNITS_JEDNOSTKA: &[&str] = &["Wojownik", "Procarz", "Oszczepnik", "Łucznik", "Zwiadowca", "Włócznik", "Wojownik z mieczem i tarczą", "Rydwan (woły)", "Konnica", "Galera", "Falanga", "Hieros Lochos (Święty Zastęp)", "Hastati", "Triari", "Jeździec chiński", "Hu Ben Wei (Gwardia Tygrysa)", "Impi", "Oszczepnik Zulu (Izijula)", "uThulwana (Białe Tarcze)", "Wojownik z maczugą (Chaska)", "Wojownik z toporem", "Procarz (Huaracoc)", "Oszczepnik (Estólica)", "Królewska Gwardia", "Rydwan konny", "Łucznik egipski", "Rydwan egipski", "Wojownik z khopesh", "Medżaj (Gwardia Faraona)", "Łucznik nubijski", "Łucznik sumeryjski", "Rydwan sumeryjski", "Włócznik sumeryjski", "Gwardia Królewska Sumeru", "Wojownik mykeński", "Rydwan mykeński", "Wojownik Sherden", "Halabardnik Shang", "Rydwan Shang", "Łucznik akadyjski", "Gaesatae", "Soldurii", "Rydwan celtycki", "Wojownik germański", "Berserker germański", "Taran", "Taran okuty", "Katapulta", "Wieża oblężnicza", "Wojownik tyrreński", "Wojownik szekelesz", "Konnica lancowa asyryjska", "Konnica łucznicza asyryjska", "Łucznik asyryjski", "Drużynnik", "Jeździec z oszczepami", "Strażnik bram Harappy", "Piechota induska", "Garnizon Harappy", "Rydwan Kapadokijski", "Piechota hetycka", "Gwardia hetycka", "Gwardia Ishtar", "Wojownik babiloński", "Piechota neobabilońska", "Tyrski miecznik", "Wojownik fenicki", "Gwardia Tyreńska", "Thorakites", "Evocati", "iButho z iklwa", "Gwardzista z champi", "Wojownik z żelaznym khopesh", "Mur tarcz (Sargonid)", "Miecznik galijski"];
[m[31m-const WEB_BUILDING_IDS: &[&str] = &["stolarnia", "kamieniarski", "kuznia", "odlewnia_brazu", "odlewnia_zelaza", "wielka_odlewnia", "targowisko", "port", "port_wielki", "spichlerz", "spichlerz_ii", "garncarnia", "cegielnia", "kamienne_kregi", "swiatynia", "biblioteka", "studnia", "akwedukt", "mennica", "palisada", "mury", "koszary", "magazyn", "stela", "palac", "palac_ii", "palac_iii", "kuznia_zelaza", "wielka_kuznia", "fort", "baszta", "warsztat_oblezniczy", "akademia", "teatr", "sad", "dom_starszyzny", "dwor_zarzadcy", "pretorium", "trybunal", "garnizon", "laznia_publiczna", "akademia_wojskowa"];
[m[31m-const WEB_TECH_NAMES: &[&str] = &["Obróbka drewna", "Garncarstwo", "Murarstwo", "Rolnictwo", "Łowiectwo", "Łucznictwo", "Oswojenie zwierząt", "Mistycyzm", "Wymiana", "Gospodarka wodna", "Koło", "Brązownictwo", "Żegluga", "Pismo", "Religia", "Jeździectwo", "Wojskowość", "Matematyka", "Handel", "Kodeks", "Budownictwo", "Waluta", "Astronomia", "Hutnictwo żelaza", "Inżynieria", "Oblężnictwo", "Filozofia", "Prawo", "Drogi brukowane", "Medycyna", "Obróbka żelaza", "Sztuka wojenna"];
[m[31m-const WEB_CUDA_IDS: &[&str] = &["piramidy", "wielka_stela", "wiszace_ogrody", "wyrocznia", "roquepertuse", "stupa_sanchi", "petra", "hamonga", "kolos", "osada_aschaffenburg", "ziggurat", "mundo_perdido", "terakotowa_armia", "koloseum", "dur_sharrukin", "brama_narodow", "palac_weiyang", "yerkapi", "posag_peruna"];
[m[31m-const WEB_PARKOWANE_IDS: &[&str] = &["nalanda", "angkor_wat", "wielki_dzwon", "mauzoleum_teodoryka", "kopiec_grobowy"];
[m[31m-const WEB_PANSTWA_KEYS: &[&str] = &["egipt", "sumer", "babilonia", "grecy", "hetyci", "celtowie", "harappa", "fenicjanie", "germanie", "inkowie", "chinczycy", "rzymianie", "asyria", "zulusi", "slowianie"];
[m[31m-const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &["egipt", "sumer", "babilonia", "grecy", "hetyci", "celtowie", "harappa", "fenicjanie", "germanie", "inkowie", "chinczycy", "rzymianie", "asyria", "zulusi", "slowianie"];
[m[31m-const WEB_RESOURCES: &[&str] = &["Żywność", "Drewno", "Kamień", "Glina", "Ruda", "Ruda żelaza", "Ruda cyny", "Koń", "Sól", "Złoto", "Cegła", "Ceramika", "Brąz", "Żelazo", "Stal"];
[m[31m-const WEB_TERRAIN_TYPES: &[&str] = &["Łąka", "Równina", "Wzgórza", "Góry", "Wybrzeże", "Morze", "Pustynia", "Polarny"];
[m[31m-const WEB_IMPROVEMENT_KEYS: &[&str] = &["bydlo", "droga", "droga_brukowana", "farma", "fort", "glinianka", "irygacja", "kamieniolom", "kopalnia_cyny", "kopalnia_miedzi", "kopalnia_zelaza", "kopalnia_zlota", "lama", "lodzie_rybackie", "oboz_lowiecki", "owce", "posterunek", "stadnina", "tarasy", "tartak", "warzelnia_soli", "wyrab"];
[m[32m+const WEB_UNITS_JEDNOSTKA: &[&str] = &[
[m[32m+    "Wojownik",
[m[32m+    "Procarz",
[m[32m+    "Oszczepnik",
[m[32m+    "Łucznik",
[m[32m+    "Zwiadowca",
[m[32m+    "Włócznik",
[m[32m+    "Wojownik z mieczem i tarczą",
[m[32m+    "Rydwan (woły)",
[m[32m+    "Konnica",
[m[32m+    "Galera",
[m[32m+    "Falanga",
[m[32m+    "Hieros Lochos (Święty Zastęp)",
[m[32m+    "Hastati",
[m[32m+    "Triari",
[m[32m+    "Jeździec chiński",
[m[32m+    "Hu Ben Wei (Gwardia Tygrysa)",
[m[32m+    "Impi",
[m[32m+    "Oszczepnik Zulu (Izijula)",
[m[32m+    "uThulwana (Białe Tarcze)",
[m[32m+    "Wojownik z maczugą (Chaska)",
[m[32m+    "Wojownik z toporem",
[m[32m+    "Procarz (Huaracoc)",
[m[32m+    "Oszczepnik (Estólica)",
[m[32m+    "Królewska Gwardia",
[m[32m+    "Rydwan konny",
[m[32m+    "Łucznik egipski",
[m[32m+    "Rydwan egipski",
[m[32m+    "Wojownik z khopesh",
[m[32m+    "Medżaj (Gwardia Faraona)",
[m[32m+    "Łucznik nubijski",
[m[32m+    "Łucznik sumeryjski",
[m[32m+    "Rydwan sumeryjski",
[m[32m+    "Włócznik sumeryjski",
[m[32m+    "Gwardia Królewska Sumeru",
[m[32m+    "Wojownik mykeński",
[m[32m+    "Rydwan mykeński",
[m[32m+    "Wojownik Sherden",
[m[32m+    "Halabardnik Shang",
[m[32m+    "Rydwan Shang",
[m[32m+    "Łucznik akadyjski",
[m[32m+    "Gaesatae",
[m[32m+    "Soldurii",
[m[32m+    "Rydwan celtycki",
[m[32m+    "Wojownik germański",
[m[32m+    "Berserker germański",
[m[32m+    "Taran",
[m[32m+    "Taran okuty",
[m[32m+    "Katapulta",
[m[32m+    "Wieża oblężnicza",
[m[32m+    "Wojownik tyrreński",
[m[32m+    "Wojownik szekelesz",
[m[32m+    "Konnica lancowa asyryjska",
[m[32m+    "Konnica łucznicza asyryjska",
[m[32m+    "Łucznik asyryjski",
[m[32m+    "Drużynnik",
[m[32m+    "Jeździec z oszczepami",
[m[32m+    "Strażnik bram Harappy",
[m[32m+    "Piechota induska",
[m[32m+    "Garnizon Harappy",
[m[32m+    "Rydwan Kapadokijski",
[m[32m+    "Piechota hetycka",
[m[32m+    "Gwardia hetycka",
[m[32m+    "Gwardia Ishtar",
[m[32m+    "Wojownik babiloński",
[m[32m+    "Piechota neobabilońska",
[m[32m+    "Tyrski miecznik",
[m[32m+    "Wojownik fenicki",
[m[32m+    "Gwardia Tyreńska",
[m[32m+    "Thorakites",
[m[32m+    "Evocati",
[m[32m+    "iButho z iklwa",
[m[32m+    "Gwardzista z champi",
[m[32m+    "Wojownik z żelaznym khopesh",
[m[32m+    "Mur tarcz (Sargonid)",
[m[32m+    "Miecznik galijski",
[m[32m+];
[m[32m+const WEB_BUILDING_IDS: &[&str] = &[
[m[32m+    "stolarnia",
[m[32m+    "kamieniarski",
[m[32m+    "kuznia",
[m[32m+    "odlewnia_brazu",
[m[32m+    "odlewnia_zelaza",
[m[32m+    "wielka_odlewnia",
[m[32m+    "targowisko",
[m[32m+    "port",
[m[32m+    "port_wielki",
[m[32m+    "spichlerz",
[m[32m+    "spichlerz_ii",
[m[32m+    "garncarnia",
[m[32m+    "cegielnia",
[m[32m+    "kamienne_kregi",
[m[32m+    "swiatynia",
[m[32m+    "biblioteka",
[m[32m+    "studnia",
[m[32m+    "akwedukt",
[m[32m+    "mennica",
[m[32m+    "palisada",
[m[32m+    "mury",
[m[32m+    "koszary",
[m[32m+    "magazyn",
[m[32m+    "stela",
[m[32m+    "palac",
[m[32m+    "palac_ii",
[m[32m+    "palac_iii",
[m[32m+    "kuznia_zelaza",
[m[32m+    "wielka_kuznia",
[m[32m+    "fort",
[m[32m+    "baszta",
[m[32m+    "warsztat_oblezniczy",
[m[32m+    "akademia",
[m[32m+    "teatr",
[m[32m+    "sad",
[m[32m+    "dom_starszyzny",
[m[32m+    "dwor_zarzadcy",
[m[32m+    "pretorium",
[m[32m+    "trybunal",
[m[32m+    "garnizon",
[m[32m+    "laznia_publiczna",
[m[32m+    "akademia_wojskowa",
[m[32m+];
[m[32m+const WEB_TECH_NAMES: &[&str] = &[
[m[32m+    "Obróbka drewna",
[m[32m+    "Garncarstwo",
[m[32m+    "Murarstwo",
[m[32m+    "Rolnictwo",
[m[32m+    "Łowiectwo",
[m[32m+    "Łucznictwo",
[m[32m+    "Oswojenie zwierząt",
[m[32m+    "Mistycyzm",
[m[32m+    "Wymiana",
[m[32m+    "Gospodarka wodna",
[m[32m+    "Koło",
[m[32m+    "Brązownictwo",
[m[32m+    "Żegluga",
[m[32m+    "Pismo",
[m[32m+    "Religia",
[m[32m+    "Jeździectwo",
[m[32m+    "Wojskowość",
[m[32m+    "Matematyka",
[m[32m+    "Handel",
[m[32m+    "Kodeks",
[m[32m+    "Budownictwo",
[m[32m+    "Waluta",
[m[32m+    "Astronomia",
[m[32m+    "Hutnictwo żelaza",
[m[32m+    "Inżynieria",
[m[32m+    "Oblężnictwo",
[m[32m+    "Filozofia",
[m[32m+    "Prawo",
[m[32m+    "Drogi brukowane",
[m[32m+    "Medycyna",
[m[32m+    "Obróbka żelaza",
[m[32m+    "Sztuka wojenna",
[m[32m+];
[m[32m+const WEB_CUDA_IDS: &[&str] = &[
[m[32m+    "piramidy",
[m[32m+    "wielka_stela",
[m[32m+    "wiszace_ogrody",
[m[32m+    "wyrocznia",
[m[32m+    "roquepertuse",
[m[32m+    "stupa_sanchi",
[m[32m+    "petra",
[m[32m+    "hamonga",
[m[32m+    "kolos",
[m[32m+    "osada_aschaffenburg",
[m[32m+    "ziggurat",
[m[32m+    "mundo_perdido",
[m[32m+    "terakotowa_armia",
[m[32m+    "koloseum",
[m[32m+    "dur_sharrukin",
[m[32m+    "brama_narodow",
[m[32m+    "palac_weiyang",
[m[32m+    "yerkapi",
[m[32m+    "posag_peruna",
[m[32m+];
[m[32m+const WEB_PARKOWANE_IDS: &[&str] = &[
[m[32m+    "nalanda",
[m[32m+    "angkor_wat",
[m[32m+    "wielki_dzwon",
[m[32m+    "mauzoleum_teodoryka",
[m[32m+    "kopiec_grobowy",
[m[32m+];
[m[32m+const WEB_PANSTWA_KEYS: &[&str] = &[
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "babilonia",
[m[32m+    "grecy",
[m[32m+    "hetyci",
[m[32m+    "celtowie",
[m[32m+    "harappa",
[m[32m+    "fenicjanie",
[m[32m+    "germanie",
[m[32m+    "inkowie",
[m[32m+    "chinczycy",
[m[32m+    "rzymianie",
[m[32m+    "asyria",
[m[32m+    "zulusi",
[m[32m+    "slowianie",
[m[32m+];
[m[32m+const WEB_WSZYSTKIE_CYWILIZACJE: &[&str] = &[
[m[32m+    "egipt",
[m[32m+    "sumer",
[m[32m+    "babilonia",
[m[32m+    "grecy",
[m[32m+    "hetyci",
[m[32m+    "celtowie",
[m[32m+    "harappa",
[m[32m+    "fenicjanie",
[m[32m+    "germanie",
[m[32m+    "inkowie",
[m[32m+    "chinczycy",
[m[32m+    "rzymianie",
[m[32m+    "asyria",
[m[32m+    "zulusi",
[m[32m+    "slowianie",
[m[32m+];
[m[32m+const WEB_RESOURCES: &[&str] = &[
[m[32m+    "Żywność",
[m[32m+    "Drewno",
[m[32m+    "Kamień",
[m[32m+    "Glina",
[m[32m+    "Ruda",
[m[32m+    "Ruda żelaza",
[m[32m+    "Ruda cyny",
[m[32m+    "Koń",
[m[32m+    "Sól",
[m[32m+    "Złoto",
[m[32m+    "Cegła",
[m[32m+    "Ceramika",
[m[32m+    "Brąz",
[m[32m+    "Żelazo",
[m[32m+    "Stal",
[m[32m+];
[m[32m+const WEB_TERRAIN_TYPES: &[&str] = &[
[m[32m+    "Łąka",
[m[32m+    "Równina",
[m[32m+    "Wzgórza",
[m[32m+    "Góry",
[m[32m+    "Wybrzeże",
[m[32m+    "Morze",
[m[32m+    "Pustynia",
[m[32m+    "Polarny",
[m[32m+];
[m[32m+const WEB_IMPROVEMENT_KEYS: &[&str] = &[
[m[32m+    "bydlo",
[m[32m+    "droga",
[m[32m+    "droga_brukowana",
[m[32m+    "farma",
[m[32m+    "fort",
[m[32m+    "glinianka",
[m[32m+    "irygacja",
[m[32m+    "kamieniolom",
[m[32m+    "kopalnia_cyny",
[m[32m+    "kopalnia_miedzi",
[m[32m+    "kopalnia_zelaza",
[m[32m+    "kopalnia_zlota",
[m[32m+    "lama",
[m[32m+    "lodzie_rybackie",
[m[32m+    "oboz_lowiecki",
[m[32m+    "owce",
[m[32m+    "posterunek",
[m[32m+    "stadnina",
[m[32m+    "tarasy",
[m[32m+    "tartak",
[m[32m+    "warzelnia_soli",
[m[32m+    "wyrab",
[m[32m+];
[m
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_loader.rs:20:
     fn new(tag: &str) -> Self {
         static COUNTER: AtomicUsize = AtomicUsize::new(0);
         let n = COUNTER.fetch_add(1, Ordering::SeqCst);
[31m-        let dir = std::env::temp_dir().join(format!(
[m[31m-            "civ-loader-{}-{}-{}",
[m[31m-            std::process::id(),
[m[31m-            tag,
[m[31m-            n
[m[31m-        ));
[m[32m+        let dir =
[m[32m+            std::env::temp_dir().join(format!("civ-loader-{}-{}-{}", std::process::id(), tag, n));
[m         let _ = fs::remove_dir_all(&dir);
         fs::create_dir_all(&dir).expect("create temp dir");
         TempDir(dir)
Diff in /home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine/tests/data_loader.rs:78:
 fn data_files_list_matches_directory_contents() {
     let mut on_disk: Vec<String> = fs::read_dir(data_dir())
         .expect("read data dir")
[31m-        .map(|e| e.expect("dir entry").file_name().to_string_lossy().into_owned())
[m[32m+        .map(|e| {
[m[32m+            e.expect("dir entry")
[m[32m+                .file_name()
[m[32m+                .to_string_lossy()
[m[32m+                .into_owned()
[m[32m+        })
[m         .filter(|n| n.ends_with(".json"))
         .collect();
     on_disk.sort();
EXIT=1
```

### RUNDA2-CLIPPY-ALL: cargo clippy --all-targets -- -D warnings (PEŁNE)

```text
    Updating crates.io index
     Locking 17 packages to latest compatible versions
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine)
error: duplicated attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:15:9
   |
15 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/buildings_tech.rs:14:10
   |
14 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes
   = note: `-D clippy::duplicated-attributes` implied by `-D warnings`
   = help: to override `-D warnings` add `#[allow(clippy::duplicated_attributes)]`

error: duplicated attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:18:9
   |
18 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/units_combat.rs:11:10
   |
11 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:21:9
   |
21 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:24:9
   |
24 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/economy_society_part2.rs:4:10
   |
 4 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: duplicated attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   |
note: first defined here
  --> tests/data_compliance.rs:27:9
   |
27 | #[allow(dead_code)]
   |         ^^^^^^^^^
help: remove this attribute
  --> tests/../src/data/terrain_map.rs:8:10
   |
 8 | #![allow(dead_code)]
   |          ^^^^^^^^^
   = help: for further information visit https://rust-lang.github.io/rust-clippy/rust-1.97.0/index.html#duplicated_attributes

error: could not compile `civ-engine` (test "data_compliance") due to 5 previous errors
EXIT=101
```

### RUNDA2-CLIPPY-LIB i RUNDA2-CLIPPY-BRIDGE (PEŁNE)

```text
--- cargo clippy --lib -- -D warnings
    Finished `dev` profile [unoptimized] target(s) in 0.02s
EXIT=0
--- cargo clippy --test bridge_add_player -- -D warnings
    Finished `dev` profile [unoptimized] target(s) in 0.02s
EXIT=0
```

### RUNDA2-TOKENS: zgodność semantyczna (multizbiór tokenów, baza aa7b225b vs 7dcc5e34)

```text
src/data/loader.rs: różnica multizbiorów tokenów = 0 linii
tests/data_civilizations.rs: różnica multizbiorów tokenów = 0 linii
tests/data_buildings_tech.rs, tests/data_economy_society.rs, tests/data_units_combat.rs:
  md5 pliku po usunięciu wszystkich białych znaków identyczny w bazie i w 7dcc5e34
```

### RUNDA2-BRIDGE-DIFF: src/bridge.rs (aa7b225b -> 7dcc5e34)

```diff
@@ -17,6 +17,10 @@ pub const EVENT_STATE_CHANGED: &str = "engine_state_changed";
 /// Commands accepted by [`TAURI_COMMAND`].
+// `CreateSession` carries the full wizard DTO by value; boxing it would change
+// the constructor contract used by the root `tests/bridge_contract.rs`, which is
+// outside this topic's allowlist, so the size lint is accepted here.
+#[allow(clippy::large_enum_variant)]
 #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
```

### RUNDA2-TEST: cargo test --offline (PEŁNE)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_abb7af83-320-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 22.26s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.65s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/debug/deps/combat-7737db4785daf590)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/debug/deps/data_compliance-bce92961776df717)

running 9 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test embedded_raw_counts_match_web_pin ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_sweetener_ease_is_measured_in_points ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test production_diplomacy_api_is_public ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/debug/deps/events-987aa8790b10a253)

running 8 tests
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test coordinates_round_trip_through_the_canonical_map_key ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test map_dimensions_and_seed_are_stable ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok
test world_types_and_default_seed_match_typescript_contract ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test public_engine_wire_aliases_are_stable ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/debug/deps/recruitment-10fa19ca5709d7f0)

running 7 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/replay.rs (/home/user/cargo-target-shared/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test city_rejects_empty_names_and_zero_population ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test canonical_state_round_trips_through_serde ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test trade_routes_do_not_cross_tundra ... ok
test owners_land_border_ignores_tundra_neighbour ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```
