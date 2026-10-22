//! RR-T8b bundled fonts (R-RUSTPORT-P4-29-TEXT-FONTS-Q1): integrity of
//! `assets/fonts/` and glyph coverage of the texts the web map draws.
//!
//! - `fonts_match_manifest_sha256`: every file listed in
//!   `assets/fonts/MANIFEST.sha256` has that sha256 (own implementation,
//!   FIPS 180-4, checked against the standard test vectors), every file of
//!   the directory is listed, total size ≤ 6 MB, and the bytes compiled into
//!   the crate (`BundledFace::data`) are those files;
//! - `charset_has_no_notdef`: the 22 upper-case non-ASCII letters of the
//!   city names (P4-25 §3.3), the 25 lower-case letters of the other map
//!   texts, ASCII printable and the punctuation `× … − — · % , ! →` resolve
//!   to a real glyph (not `.notdef`) in the faces the web stacks select;
//! - `symbols_fall_back_to_dejavu`: ☠ ◆ ⚔ (T3, T10, T14, T2) are not in
//!   Liberation and are found in DejaVu Sans by the per-glyph fallback.

use civ_renderer::raster::text::{face_chain, face_has_glyph, parse_font, shape_text, BundledFace};

fn fonts_dir() -> String {
    format!("{}/assets/fonts", env!("CARGO_MANIFEST_DIR"))
}

/// SHA-256 (FIPS 180-4).
fn sha256(data: &[u8]) -> [u8; 32] {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    let mut msg = data.to_vec();
    let bit_len = (data.len() as u64).wrapping_mul(8);
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());
    for chunk in msg.chunks(64) {
        let mut w = [0u32; 64];
        for (i, word) in chunk.chunks(4).enumerate() {
            w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let mut v = h;
        for i in 0..64 {
            let s1 = v[4].rotate_right(6) ^ v[4].rotate_right(11) ^ v[4].rotate_right(25);
            let ch = (v[4] & v[5]) ^ (!v[4] & v[6]);
            let t1 = v[7]
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = v[0].rotate_right(2) ^ v[0].rotate_right(13) ^ v[0].rotate_right(22);
            let maj = (v[0] & v[1]) ^ (v[0] & v[2]) ^ (v[1] & v[2]);
            let t2 = s0.wrapping_add(maj);
            v = [
                t1.wrapping_add(t2),
                v[0],
                v[1],
                v[2],
                v[3].wrapping_add(t1),
                v[4],
                v[5],
                v[6],
            ];
        }
        for (a, b) in h.iter_mut().zip(v) {
            *a = a.wrapping_add(b);
        }
    }
    let mut out = [0u8; 32];
    for (i, x) in h.iter().enumerate() {
        out[i * 4..i * 4 + 4].copy_from_slice(&x.to_be_bytes());
    }
    out
}

fn hex(d: &[u8]) -> String {
    d.iter().map(|b| format!("{b:02x}")).collect()
}

#[test]
fn sha256_matches_standard_vectors() {
    assert_eq!(
        hex(&sha256(b"")),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    assert_eq!(
        hex(&sha256(b"abc")),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    assert_eq!(
        hex(&sha256(
            b"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
        )),
        "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
    );
}

#[test]
fn fonts_match_manifest_sha256() {
    let dir = fonts_dir();
    let man = std::fs::read_to_string(format!("{dir}/MANIFEST.sha256")).expect("manifest");
    let mut listed = Vec::new();
    for line in man.lines() {
        let (h, f) = line.split_once("  ").expect("sha256sum line");
        let data = std::fs::read(format!("{dir}/{f}")).unwrap_or_else(|e| panic!("{f}: {e}"));
        assert_eq!(hex(&sha256(&data)), h, "{f}: sha256");
        listed.push(f.to_owned());
    }
    let mut total = 0u64;
    for e in std::fs::read_dir(&dir).expect("dir") {
        let e = e.expect("entry");
        let name = e.file_name().into_string().expect("utf-8 name");
        total += e.metadata().expect("meta").len();
        if name != "MANIFEST.sha256" {
            assert!(
                listed.contains(&name),
                "{name} missing from MANIFEST.sha256"
            );
        }
    }
    assert!(total <= 6 * 1024 * 1024, "assets/fonts is {total} B > 6 MB");
    for face in BundledFace::ALL {
        assert!(listed.contains(&face.file_name().to_owned()), "{face:?}");
        let on_disk = std::fs::read(format!("{dir}/{}", face.file_name())).expect("font");
        assert_eq!(face.data(), on_disk.as_slice(), "{face:?}: compiled bytes");
    }
    for lic in ["LICENSE-Liberation.txt", "LICENSE-DejaVu.txt"] {
        assert!(listed.contains(&lic.to_owned()), "{lic}");
    }
}

/// P4-25 §3.3 (`dowody/07-city-names-nonascii.txt`).
const UPPER_22: &str = "ÖŁÜŃÓØŞĞÇĄŻÁÑÉŚĘÚŘÍÅÄŹ";
/// P4-25 §3.3 (`dowody/09-charset-all-sources.txt`).
const LOWER_25: &str = "ąćęłńóśźżßıáäåçéíñöøúüğřş";
const PUNCT: &str = "×…−—·%,!→";

#[test]
fn charset_has_no_notdef() {
    assert_eq!(UPPER_22.chars().count(), 22);
    assert_eq!(LOWER_25.chars().count(), 25);
    let ascii: String = (0x20u8..0x7f).map(char::from).collect();
    let all: String = [UPPER_22, LOWER_25, PUNCT, &ascii].concat();
    for face in [
        BundledFace::LiberationSansRegular,
        BundledFace::LiberationSansBold,
        BundledFace::LiberationSerifRegular,
        BundledFace::LiberationSerifBold,
    ] {
        let missing: Vec<char> = all.chars().filter(|c| !face_has_glyph(face, *c)).collect();
        assert!(missing.is_empty(), "{face:?} lacks {missing:?}");
    }
    // The faces actually selected for the web stacks resolve every
    // character to their primary face (no fallback, no .notdef).
    for font in [
        "700 22px Georgia, \"Times New Roman\", serif",
        "700 13px Arial, Helvetica, sans-serif",
        "600 11px Arial, Helvetica, sans-serif",
        "bold 26px Segoe UI, Arial, sans-serif",
        "900 118px \"Segoe UI\", Arial, sans-serif",
        "bold 16px sans-serif",
    ] {
        let spec = parse_font(font).expect("font");
        let primary = face_chain(&spec)[0];
        let shaped = shape_text(&spec, &all);
        for g in &shaped.glyphs {
            assert_eq!(g.face, primary, "{font}: fallback used");
            assert_ne!(g.glyph, 0, "{font}: .notdef");
        }
    }
}

#[test]
fn symbols_fall_back_to_dejavu() {
    for c in ['☠', '◆', '⚔'] {
        assert!(!face_has_glyph(BundledFace::LiberationSansBold, c), "{c}");
        assert!(face_has_glyph(BundledFace::DejaVuSansBold, c), "{c}");
        let spec = parse_font("bold 58px \"Segoe UI Symbol\", \"Segoe UI\", Arial, sans-serif")
            .expect("font");
        let s = shape_text(&spec, &c.to_string());
        assert_eq!(s.glyphs.len(), 1);
        assert_eq!(s.glyphs[0].face, BundledFace::DejaVuSansBold);
        assert_ne!(s.glyphs[0].glyph, 0);
    }
}

#[test]
fn emoji_are_out_of_scope_and_render_notdef() {
    // RR-T8c owns emoji (D-TXT-3); no bundled face has them, so the primary
    // face's .notdef is used (documented behaviour, not a parity claim).
    let spec = parse_font("bold 16px Segoe UI, Arial").expect("font");
    let s = shape_text(&spec, "👤");
    assert_eq!(s.glyphs.len(), 1);
    assert_eq!(s.glyphs[0].glyph, 0);
    assert_eq!(s.glyphs[0].face, BundledFace::LiberationSansBold);
}
