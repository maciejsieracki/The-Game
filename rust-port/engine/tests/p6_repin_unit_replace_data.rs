//! Test R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (zadanie L-1): pole JSON
//! "Zastąp specjalnie" w `rust-port/engine/data/units.json` (tabela awansów
//! piechoty) zgodne z pinem `07d2fbd72:gra/tools/unit-replace-promotion-table-test.cjs`
//! (`EXPECTED_TABLE`), 23/23 wpisów. Strażnik: SHA-256 kanonicznej postaci
//! wyciętej tabeli (`nazwa=wartość\n`, kolejność z orakulum). Brak zależności
//! zewnętrznych: SHA-256 zaimplementowany lokalnie (stałe z FIPS 180-4).

use serde_json::Value;

const UNITS_JSON: &str = include_str!("../data/units.json");

const BLANK: &str = "—";

/// Tabela z orakulum (EXPECTED_TABLE), kolejność jak w pinie.
const EXPECTED: [(&str, &str); 23] = [
    ("Wojownik", "Włócznik"),
    ("Włócznik", "Falanga/Triari/Thorakites/iButho z iklwa/Mur tarcz (Sargonid)/Hu Ben Wei (Gwardia Tygrysa)/uThulwana (Białe Tarcze)/Królewska Gwardia/Medżaj (Gwardia Faraona)/Gwardia Królewska Sumeru"),
    ("Wojownik z mieczem i tarczą", "Hastati/Gaesatae/Soldurii/Miecznik galijski/Berserker germański/Drużynnik/Garnizon Harappy/Gwardia hetycka/Piechota neobabilońska/Tyrski miecznik/Gwardia Tyreńska/Wojownik z żelaznym khopesh/Hu Ben Wei (Gwardia Tygrysa)/uThulwana (Białe Tarcze)/Królewska Gwardia/Medżaj (Gwardia Faraona)/Gwardia Królewska Sumeru"),
    ("Falanga", "Hieros Lochos (Święty Zastęp)"),
    ("Hastati", "Evocati"),
    ("Triari", "Evocati"),
    ("Impi", "iButho z iklwa/uThulwana (Białe Tarcze)"),
    ("Wojownik z maczugą (Chaska)", "Wojownik z toporem/Gwardzista z champi"),
    ("Wojownik z toporem", "Królewska Gwardia"),
    ("Wojownik z khopesh", "Wojownik z żelaznym khopesh/Medżaj (Gwardia Faraona)"),
    ("Włócznik sumeryjski", "Mur tarcz (Sargonid)/Gwardia Królewska Sumeru"),
    ("Wojownik mykeński", "Hieros Lochos (Święty Zastęp)"),
    ("Halabardnik Shang", "Hu Ben Wei (Gwardia Tygrysa)"),
    ("Berserker germański", "Wojownik germański"),
    ("Wojownik tyrreński", "Evocati"),
    ("Strażnik bram Harappy", "Garnizon Harappy"),
    ("Piechota induska", "Garnizon Harappy"),
    ("Piechota hetycka", "Gwardia hetycka"),
    ("Gwardia Ishtar", "Piechota neobabilońska"),
    ("Wojownik babiloński", "Piechota neobabilońska"),
    ("Wojownik fenicki", "Tyrski miecznik/Gwardia Tyreńska"),
    ("Thorakites", "Hieros Lochos (Święty Zastęp)"),
    ("Gwardzista z champi", "Królewska Gwardia"),
];

/// SHA-256 kanonicznej postaci `EXPECTED` (patrz `canonical_table`).
const EXPECTED_SHA256: &str = "82c013f55112c82c5d8fbd4a520271756c5cf10bf5039992170c5af8052d79b6";

const K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const H0: [u32; 8] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

fn sha256_hex(data: &[u8]) -> String {
    let mut h = H0;
    let bit_len = (data.len() as u64).wrapping_mul(8);
    let mut msg = data.to_vec();
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());
    for chunk in msg.chunks_exact(64) {
        let mut w = [0u32; 64];
        for (i, word) in w.iter_mut().take(16).enumerate() {
            *word = u32::from_be_bytes([
                chunk[4 * i],
                chunk[4 * i + 1],
                chunk[4 * i + 2],
                chunk[4 * i + 3],
            ]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = h;
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ (!e & g);
            let t1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        for (x, y) in h.iter_mut().zip([a, b, c, d, e, f, g, hh]) {
            *x = x.wrapping_add(y);
        }
    }
    h.iter().map(|x| format!("{:08x}", x)).collect()
}

fn canonical_table() -> String {
    EXPECTED
        .iter()
        .map(|(name, value)| format!("{name}={value}\n"))
        .collect()
}

fn units() -> Vec<Value> {
    serde_json::from_str(UNITS_JSON).expect("units.json must be a JSON array")
}

fn zastap(unit: &Value) -> &str {
    unit["Zastąp specjalnie"]
        .as_str()
        .expect("\"Zastąp specjalnie\" must be a string")
}

fn name(unit: &Value) -> &str {
    unit["Jednostka"]
        .as_str()
        .expect("\"Jednostka\" must be a string")
}

#[test]
fn promotion_table_pin_guard_sha256() {
    assert_eq!(EXPECTED.len(), 23, "pinned table must have 23 entries");
    assert_eq!(
        sha256_hex(canonical_table().as_bytes()),
        EXPECTED_SHA256,
        "pinned table digest changed"
    );
    // Sanity dla lokalnej implementacji SHA-256 (wektor FIPS 180-4).
    assert_eq!(
        sha256_hex(b"abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
}

#[test]
fn units_json_matches_pinned_table_23_of_23() {
    let units = units();
    let mut matched = 0usize;
    for (unit_name, want) in EXPECTED.iter() {
        let found: Vec<&Value> = units.iter().filter(|u| name(u) == *unit_name).collect();
        assert_eq!(found.len(), 1, "unit {unit_name} must occur exactly once");
        assert_eq!(
            zastap(found[0]),
            *want,
            "\"Zastąp specjalnie\" for {unit_name} differs from pin"
        );
        matched += 1;
    }
    assert_eq!(matched, 23, "expected 23/23 matches with the pinned table");
}

#[test]
fn units_outside_table_stay_blank_and_no_extra_entries() {
    let units = units();
    let non_blank: Vec<&str> = units
        .iter()
        .filter(|u| zastap(u) != BLANK)
        .map(name)
        .collect();
    assert_eq!(
        non_blank.len(),
        23,
        "exactly 23 units may carry a promotion table entry, got {non_blank:?}"
    );
    for u in units
        .iter()
        .filter(|u| !EXPECTED.iter().any(|(n, _)| *n == name(u)))
    {
        assert_eq!(
            zastap(u),
            BLANK,
            "{} must keep \"Zastąp specjalnie\" blank",
            name(u)
        );
    }
}
