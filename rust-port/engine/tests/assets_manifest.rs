// P3.8B: trwały test walidacji manifestu assetów `rust-port/assets/MANIFEST.tsv`.
//
// Sprawdza manifest wobec faktycznej zawartości katalogu `rust-port/assets/` oraz wobec
// liczb z katalogu P1.11 (`dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`, §2).
// Bez nowych zależności: własna implementacja SHA-1 (git blob hash), walk po `std::fs`.
// Test nie zmienia żadnych plików (read-only).

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

const MANIFEST_HEADER: &str = "blob_sha_edb8fb56\tsize_bytes\tsource_web_path\tdest_rust_port_path";
// P1.11 §2: 307 SVG + 12 JSON/CSS + 45 JPG + 2 PNG + 62 MP3 = 428 (P3-8: 428/428).
// 441 plików §2 minus 10 plików .ts i 3 README.md, które nie są assetami runtime.
const EXPECTED_DATA_ROWS: usize = 428;
const DEST_PREFIX: &str = "rust-port/assets/";

#[derive(Clone, Debug, PartialEq)]
struct Entry {
    sha: String,
    size: u64,
    src: String,
    dst: String,
}

fn repo_root() -> PathBuf {
    // rust-port/engine -> ../.. = korzeń repo (worktree)
    Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("..")
}

fn manifest_path() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("assets")
        .join("MANIFEST.tsv")
}

fn assets_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("assets")
}

/// Parsuje manifest; zwraca wpisy danych (bez nagłówka). Błąd przy złym nagłówku lub kolumnach.
fn parse_manifest(text: &str) -> Result<Vec<Entry>, String> {
    // Dopuszczalny wyłącznie jeden końcowy '\n'; każda inna pusta linia jest błędem.
    let body = text.strip_suffix('\n').unwrap_or(text);
    let mut lines = body.split('\n');
    let header = lines.next().ok_or("manifest pusty")?;
    if header != MANIFEST_HEADER {
        return Err(format!("zły nagłówek: {header:?}"));
    }
    let mut out = Vec::new();
    for (i, line) in lines.enumerate() {
        if line.is_empty() {
            return Err(format!("wiersz {}: pusta linia", i + 2));
        }
        let cols: Vec<&str> = line.split('\t').collect();
        if cols.len() != 4 {
            return Err(format!("wiersz {}: {} kolumn zamiast 4", i + 2, cols.len()));
        }
        let size: u64 = cols[1]
            .parse()
            .map_err(|e| format!("wiersz {}: rozmiar {:?}: {e}", i + 2, cols[1]))?;
        out.push(Entry {
            sha: cols[0].to_string(),
            size,
            src: cols[2].to_string(),
            dst: cols[3].to_string(),
        });
    }
    Ok(out)
}

/// Walidator: zwraca listę błędów (pusta = manifest zgodny). Używany przez testy pozytywne i negatywne.
fn validate(entries: &[Entry], root: &Path, check_sha: bool) -> Vec<String> {
    let mut errors = Vec::new();
    let mut seen = BTreeSet::new();
    for e in entries {
        if !seen.insert(e.dst.clone()) {
            errors.push(format!("duplikat ścieżki docelowej: {}", e.dst));
            continue;
        }
        if !e.dst.starts_with(DEST_PREFIX) {
            errors.push(format!("zły prefiks: {}", e.dst));
        }
        let path = root.join(&e.dst);
        let bytes = match fs::read(&path) {
            Ok(b) => b,
            Err(_) => {
                errors.push(format!("brak pliku (missing): {}", e.dst));
                continue;
            }
        };
        if bytes.len() as u64 != e.size {
            errors.push(format!(
                "size mismatch: {} faktyczny={} manifest={}",
                e.dst,
                bytes.len(),
                e.size
            ));
        }
        if check_sha && git_blob_sha1_hex(&bytes) != e.sha {
            errors.push(format!("sha mismatch: {}", e.dst));
        }
    }
    errors
}

/// Rekurencyjny spacer `std::fs`: zwraca ścieżki względem korzenia repo, z `/`.
fn walk_files(dir: &Path, root: &Path, out: &mut BTreeSet<String>) {
    for entry in fs::read_dir(dir).expect("read_dir") {
        let path = entry.expect("dir entry").path();
        if path.is_dir() {
            walk_files(&path, root, out);
        } else {
            let rel = path
                .strip_prefix(root)
                .expect("prefix")
                .to_string_lossy()
                .replace('\\', "/");
            out.insert(rel);
        }
    }
}

// ---------------------------------------------------------------------------
// SHA-1 (FIPS 180-4), bez zależności. Wystarcza do git blob hash: "blob <len>\0<bytes>".
// ---------------------------------------------------------------------------

fn sha1(data: &[u8]) -> [u8; 20] {
    let mut h: [u32; 5] = [
        0x6745_2301,
        0xEFCD_AB89,
        0x98BA_DCFE,
        0x1032_5476,
        0xC3D2_E1F0,
    ];
    let bit_len = (data.len() as u64).wrapping_mul(8);
    let mut msg = Vec::with_capacity(data.len() + 72);
    msg.extend_from_slice(data);
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in msg.chunks_exact(64) {
        let mut w = [0u32; 80];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([
                chunk[4 * i],
                chunk[4 * i + 1],
                chunk[4 * i + 2],
                chunk[4 * i + 3],
            ]);
        }
        for i in 16..80 {
            w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
        }
        let (mut a, mut b, mut c, mut d, mut e) = (h[0], h[1], h[2], h[3], h[4]);
        for (i, wi) in w.iter().enumerate() {
            let (f, k) = match i {
                0..=19 => ((b & c) | (!b & d), 0x5A82_7999u32),
                20..=39 => (b ^ c ^ d, 0x6ED9_EBA1),
                40..=59 => ((b & c) | (b & d) | (c & d), 0x8F1B_BCDC),
                _ => (b ^ c ^ d, 0xCA62_C1D6),
            };
            let temp = a
                .rotate_left(5)
                .wrapping_add(f)
                .wrapping_add(e)
                .wrapping_add(k)
                .wrapping_add(*wi);
            e = d;
            d = c;
            c = b.rotate_left(30);
            b = a;
            a = temp;
        }
        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
    }
    let mut out = [0u8; 20];
    for (i, v) in h.iter().enumerate() {
        out[4 * i..4 * i + 4].copy_from_slice(&v.to_be_bytes());
    }
    out
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn git_blob_sha1_hex(content: &[u8]) -> String {
    let mut buf = format!("blob {}\0", content.len()).into_bytes();
    buf.extend_from_slice(content);
    hex(&sha1(&buf))
}

// ---------------------------------------------------------------------------
// Testy
// ---------------------------------------------------------------------------

fn load_manifest() -> Vec<Entry> {
    let text = fs::read_to_string(manifest_path()).expect("MANIFEST.tsv czytelny");
    parse_manifest(&text).expect("manifest parsuje się")
}

#[test]
fn sha1_matches_known_vectors() {
    // FIPS 180-4 / powszechnie znane wektory; źródło: RFC 3174 / NIST.
    assert_eq!(hex(&sha1(b"")), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
    assert_eq!(
        hex(&sha1(b"abc")),
        "a9993e364706816aba3e25717850c26c9cd0d89d"
    );
    assert_eq!(
        hex(&sha1(
            b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
        )),
        "84983e441c3bd26ebaae4aa1f95129e5e54670f1"
    );
    // git blob pustego pliku (git hash-object /dev/null)
    assert_eq!(
        git_blob_sha1_hex(b""),
        "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
    );
}

#[test]
fn manifest_has_header_and_428_data_rows() {
    let text = fs::read_to_string(manifest_path()).expect("MANIFEST.tsv czytelny");
    let first = text.split('\n').next().expect("pierwszy wiersz");
    assert_eq!(first, MANIFEST_HEADER, "nagłówek manifestu");
    let entries = parse_manifest(&text).expect("parse");
    assert_eq!(
        entries.len(),
        EXPECTED_DATA_ROWS,
        "liczba wierszy danych (P3-8: 428/428)"
    );
}

#[test]
fn manifest_dest_paths_are_unique() {
    let entries = load_manifest();
    let unique: BTreeSet<&str> = entries.iter().map(|e| e.dst.as_str()).collect();
    assert_eq!(
        unique.len(),
        entries.len(),
        "ścieżki docelowe muszą być unikalne"
    );
    for e in &entries {
        assert!(
            e.dst.starts_with(DEST_PREFIX),
            "prefiks docelowy: {}",
            e.dst
        );
    }
}

#[test]
fn every_manifest_entry_exists_with_declared_size() {
    let entries = load_manifest();
    let errors = validate(&entries, &repo_root(), false);
    assert!(
        errors.is_empty(),
        "rozbieżności manifestu z katalogiem:\n{}",
        errors.join("\n")
    );
}

#[test]
fn every_entry_blob_sha1_matches_manifest_column() {
    let entries = load_manifest();
    let errors = validate(&entries, &repo_root(), true);
    assert!(
        errors.is_empty(),
        "rozbieżności blob-SHA1:\n{}",
        errors.join("\n")
    );
}

#[test]
fn no_files_outside_manifest_in_assets_dir() {
    let entries = load_manifest();
    let root = fs::canonicalize(repo_root()).expect("korzeń repo");
    let dir = fs::canonicalize(assets_dir()).expect("katalog assets");
    let mut on_disk = BTreeSet::new();
    walk_files(&dir, &root, &mut on_disk);
    on_disk.remove("rust-port/assets/MANIFEST.tsv");
    let expected: BTreeSet<String> = entries.iter().map(|e| e.dst.clone()).collect();
    let extra: Vec<&String> = on_disk.difference(&expected).collect();
    let missing: Vec<&String> = expected.difference(&on_disk).collect();
    assert!(extra.is_empty(), "pliki spoza manifestu: {extra:?}");
    assert!(
        missing.is_empty(),
        "pliki z manifestu brak na dysku: {missing:?}"
    );
    assert_eq!(on_disk.len(), EXPECTED_DATA_ROWS);
}

#[test]
fn counts_per_extension_match_p1_11() {
    // Źródło: P1.11 §2 (wiersze 26–32 katalogu P1-11-ASSET-CATALOG.md): svg 307; json 8; css 4;
    // jpg 45; png 2 (hero, wiersz 29); mp3 62 (59 aktywnych + 3 wykluczone, wiersze 31–32).
    let entries = load_manifest();
    let mut counts: BTreeMap<&str, usize> = BTreeMap::new();
    for e in &entries {
        let ext = e.dst.rsplit('.').next().expect("rozszerzenie");
        *counts.entry(ext).or_default() += 1;
    }
    assert_eq!(counts.get("svg"), Some(&307), "svg");
    assert_eq!(counts.get("json"), Some(&8), "json");
    assert_eq!(counts.get("css"), Some(&4), "css");
    assert_eq!(counts.get("jpg"), Some(&45), "jpg");
    assert_eq!(counts.get("png"), Some(&2), "png");
    assert_eq!(counts.get("mp3"), Some(&62), "mp3");
    assert_eq!(
        counts.values().sum::<usize>(),
        EXPECTED_DATA_ROWS,
        "suma rozszerzeń"
    );
}

#[test]
fn byte_sums_per_category_match_p1_11() {
    // Kategorie wg 3. segmentu ścieżki docelowej (rust-port/assets/<kat>/...).
    // Źródło P1.11 §2:
    //   icons    = wiersz 26 (SVG 307, 108 231 B) + wiersz 27 (JSON 8 + CSS 4 = 12, 27 945 B) -> 319 plików, 136 176 B
    //   portraits= wiersz 28 (JPG 45, 445 951 B)
    //   hero     = wiersz 29 (PNG 2, 4 214 674 B)
    //   music    = wiersz 31 (MP3 59, 42 350 853 B) + wiersz 32 (MP3 wykluczone 3, 2 233 830 B) -> 62 plików, 44 584 683 B
    let entries = load_manifest();
    let mut sums: BTreeMap<&str, (usize, u64)> = BTreeMap::new();
    for e in &entries {
        let cat = e.dst.split('/').nth(2).expect("kategoria");
        let slot = sums.entry(cat).or_insert((0, 0));
        slot.0 += 1;
        slot.1 += e.size;
    }
    assert_eq!(
        sums.get("icons"),
        Some(&(319, 136_176)),
        "ikony (P1.11 §2 wiersze 26+27)"
    );
    assert_eq!(
        sums.get("portraits"),
        Some(&(45, 445_951)),
        "portrety (P1.11 §2 wiersz 28)"
    );
    assert_eq!(
        sums.get("hero"),
        Some(&(2, 4_214_674)),
        "hero (P1.11 §2 wiersz 29)"
    );
    assert_eq!(
        sums.get("music"),
        Some(&(62, 44_584_683)),
        "muzyka (P1.11 §2 wiersze 31+32)"
    );
    assert_eq!(
        sums.len(),
        4,
        "dokładnie 4 kategorie runtime; brak fontów/3D/SFX (P1.11 §5)"
    );
}

#[test]
fn negative_validator_rejects_wrong_size() {
    let mut entries = load_manifest();
    entries.truncate(3);
    assert!(
        validate(&entries, &repo_root(), false).is_empty(),
        "kontrola: prawdziwe wpisy przechodzą"
    );
    entries[1].size += 1;
    let errors = validate(&entries, &repo_root(), false);
    assert_eq!(
        errors.len(),
        1,
        "zły rozmiar musi dać dokładnie 1 błąd: {errors:?}"
    );
    assert!(errors[0].starts_with("size mismatch"), "{errors:?}");
}

#[test]
fn negative_validator_rejects_missing_file() {
    let mut entries = load_manifest();
    entries.truncate(3);
    assert!(
        validate(&entries, &repo_root(), false).is_empty(),
        "kontrola: prawdziwe wpisy przechodzą"
    );
    entries[0].dst = "rust-port/assets/icons/does-not-exist-xyz.svg".to_string();
    let errors = validate(&entries, &repo_root(), false);
    assert_eq!(
        errors.len(),
        1,
        "brakujący plik musi dać dokładnie 1 błąd: {errors:?}"
    );
    assert!(errors[0].starts_with("brak pliku"), "{errors:?}");
}

#[test]
fn negative_validator_rejects_duplicate_dest() {
    let mut entries = load_manifest();
    entries.truncate(3);
    assert!(
        validate(&entries, &repo_root(), false).is_empty(),
        "kontrola: prawdziwe wpisy przechodzą"
    );
    let dup = entries[0].clone();
    entries.push(dup);
    let errors = validate(&entries, &repo_root(), false);
    assert_eq!(
        errors.len(),
        1,
        "duplikat musi dać dokładnie 1 błąd: {errors:?}"
    );
    assert!(errors[0].starts_with("duplikat"), "{errors:?}");
}

#[test]
fn negative_validator_rejects_wrong_sha() {
    let mut entries = load_manifest();
    entries.truncate(2);
    let real = validate(&entries, &repo_root(), true);
    assert!(
        real.is_empty(),
        "kontrola: prawdziwe SHA przechodzą: {real:?}"
    );
    entries[0].sha = "0".repeat(40);
    let errors = validate(&entries, &repo_root(), true);
    assert_eq!(
        errors.len(),
        1,
        "zły SHA musi dać dokładnie 1 błąd: {errors:?}"
    );
    assert!(errors[0].starts_with("sha mismatch"), "{errors:?}");
}

#[test]
fn negative_parser_rejects_bad_header_and_columns() {
    let real = fs::read_to_string(manifest_path()).expect("MANIFEST.tsv czytelny");
    assert!(
        parse_manifest(&real).is_ok(),
        "kontrola: prawdziwy manifest parsuje się"
    );
    let bad_header = "sha\tsize\tsrc\tdst\na\t1\tb\tc\n";
    assert!(
        parse_manifest(bad_header).is_err(),
        "zły nagłówek musi być odrzucony"
    );
    let bad_cols = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\n");
    assert!(
        parse_manifest(&bad_cols).is_err(),
        "wiersz z 3 kolumnami musi być odrzucony"
    );
    let blank_mid = format!("{MANIFEST_HEADER}\nabc\t1\tsrc\tdst\n\nabc\t1\tsrc\tdst2\n");
    assert!(
        parse_manifest(&blank_mid).is_err(),
        "pusta linia w środku musi być odrzucona"
    );
}
