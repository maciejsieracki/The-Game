//! Minimal JSON reader + helpers shared by the `tests/atlas_*.rs` suites
//! (`mod atlas_json;`). The crate has no JSON dependency; the fixtures are
//! trusted files written by `tests/fixtures/atlas/gen.ts` / `gen_gl.mjs`
//! (`JSON.stringify`). Also compiled as its own (empty) test target.
#![allow(dead_code)]

use std::path::PathBuf;

/// A parsed JSON value.
#[derive(Debug, Clone)]
pub enum Json {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

impl Json {
    pub fn get(&self, key: &str) -> &Json {
        self.opt(key).unwrap_or_else(|| panic!("missing key {key}"))
    }
    pub fn opt(&self, key: &str) -> Option<&Json> {
        match self {
            Json::Obj(kv) => kv.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }
    pub fn num(&self) -> f64 {
        match self {
            Json::Num(n) => *n,
            other => panic!("not a number: {other:?}"),
        }
    }
    pub fn u32(&self) -> u32 {
        let n = self.num();
        assert!(n >= 0.0 && n.fract() == 0.0 && n <= f64::from(u32::MAX));
        n as u32
    }
    pub fn bool(&self) -> bool {
        match self {
            Json::Bool(b) => *b,
            other => panic!("not a bool: {other:?}"),
        }
    }
    pub fn arr(&self) -> &[Json] {
        match self {
            Json::Arr(a) => a,
            other => panic!("not an array: {other:?}"),
        }
    }
    pub fn str(&self) -> &str {
        match self {
            Json::Str(s) => s,
            other => panic!("not a string: {other:?}"),
        }
    }
    pub fn opt_str(&self) -> Option<&str> {
        match self {
            Json::Null => None,
            Json::Str(s) => Some(s),
            other => panic!("not a string/null: {other:?}"),
        }
    }
    /// A binary64 written as 16 hex digits of its bit pattern.
    pub fn bits(&self) -> f64 {
        f64::from_bits(u64::from_str_radix(self.str(), 16).expect("hex bits"))
    }
    /// `null` or binary64 bits.
    pub fn opt_bits(&self) -> Option<f64> {
        match self {
            Json::Null => None,
            _ => Some(self.bits()),
        }
    }
}

struct Parser<'a> {
    s: &'a [u8],
    i: usize,
}

impl Parser<'_> {
    fn ws(&mut self) {
        while self.i < self.s.len() && matches!(self.s[self.i], b' ' | b'\n' | b'\r' | b'\t') {
            self.i += 1;
        }
    }
    fn value(&mut self) -> Json {
        self.ws();
        match self.s[self.i] {
            b'{' => {
                self.i += 1;
                let mut kv = Vec::new();
                self.ws();
                if self.s[self.i] == b'}' {
                    self.i += 1;
                    return Json::Obj(kv);
                }
                loop {
                    self.ws();
                    let k = self.string();
                    self.ws();
                    assert_eq!(self.s[self.i], b':');
                    self.i += 1;
                    let v = self.value();
                    kv.push((k, v));
                    self.ws();
                    match self.s[self.i] {
                        b',' => self.i += 1,
                        b'}' => {
                            self.i += 1;
                            return Json::Obj(kv);
                        }
                        c => panic!("bad object char {c}"),
                    }
                }
            }
            b'[' => {
                self.i += 1;
                let mut a = Vec::new();
                self.ws();
                if self.s[self.i] == b']' {
                    self.i += 1;
                    return Json::Arr(a);
                }
                loop {
                    a.push(self.value());
                    self.ws();
                    match self.s[self.i] {
                        b',' => self.i += 1,
                        b']' => {
                            self.i += 1;
                            return Json::Arr(a);
                        }
                        c => panic!("bad array char {c}"),
                    }
                }
            }
            b'"' => Json::Str(self.string()),
            b't' => {
                self.i += 4;
                Json::Bool(true)
            }
            b'f' => {
                self.i += 5;
                Json::Bool(false)
            }
            b'n' => {
                self.i += 4;
                Json::Null
            }
            _ => {
                let st = self.i;
                while self.i < self.s.len()
                    && matches!(
                        self.s[self.i],
                        b'-' | b'+' | b'.' | b'e' | b'E' | b'0'..=b'9'
                    )
                {
                    self.i += 1;
                }
                let t = std::str::from_utf8(&self.s[st..self.i]).expect("utf8");
                Json::Num(t.parse().unwrap_or_else(|_| panic!("bad number {t}")))
            }
        }
    }
    fn hex4(&mut self) -> u32 {
        let t = std::str::from_utf8(&self.s[self.i..self.i + 4]).expect("utf8");
        self.i += 4;
        u32::from_str_radix(t, 16).expect("hex escape")
    }
    fn string(&mut self) -> String {
        assert_eq!(self.s[self.i], b'"');
        self.i += 1;
        let mut out: Vec<u8> = Vec::new();
        loop {
            let c = self.s[self.i];
            self.i += 1;
            match c {
                b'"' => break,
                b'\\' => {
                    let e = self.s[self.i];
                    self.i += 1;
                    match e {
                        b'"' => out.push(b'"'),
                        b'\\' => out.push(b'\\'),
                        b'/' => out.push(b'/'),
                        b'b' => out.push(8),
                        b'f' => out.push(12),
                        b'n' => out.push(b'\n'),
                        b'r' => out.push(b'\r'),
                        b't' => out.push(b'\t'),
                        b'u' => {
                            let mut cp = self.hex4();
                            if (0xD800..0xDC00).contains(&cp) {
                                assert_eq!(&self.s[self.i..self.i + 2], b"\\u", "lone surrogate");
                                self.i += 2;
                                let lo = self.hex4();
                                cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00);
                            }
                            let ch = char::from_u32(cp).expect("scalar value");
                            let mut b = [0u8; 4];
                            out.extend_from_slice(ch.encode_utf8(&mut b).as_bytes());
                        }
                        other => panic!("bad escape {other}"),
                    }
                }
                _ => out.push(c),
            }
        }
        String::from_utf8(out).expect("utf8 string")
    }
}

/// Parses a JSON document.
pub fn parse(text: &str) -> Json {
    let mut p = Parser {
        s: text.as_bytes(),
        i: 0,
    };
    p.value()
}

/// Path of a fixture under `tests/fixtures/atlas/`.
pub fn fixture_path(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("atlas")
        .join(name)
}

/// Loads and parses a fixture.
pub fn load(name: &str) -> Json {
    let p = fixture_path(name);
    let text = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{}: {e}", p.display()));
    parse(&text)
}

/// Standard base64 decoder (padding `=`).
pub fn base64(s: &str) -> Vec<u8> {
    fn v(c: u8) -> u32 {
        match c {
            b'A'..=b'Z' => u32::from(c - b'A'),
            b'a'..=b'z' => u32::from(c - b'a') + 26,
            b'0'..=b'9' => u32::from(c - b'0') + 52,
            b'+' => 62,
            b'/' => 63,
            _ => panic!("bad base64 char {c}"),
        }
    }
    let b = s.as_bytes();
    assert_eq!(b.len() % 4, 0, "base64 length");
    let mut out = Vec::with_capacity(b.len() / 4 * 3);
    for q in b.chunks(4) {
        let pad = q.iter().filter(|&&c| c == b'=').count();
        let mut n = 0u32;
        for &c in q {
            n = (n << 6) | if c == b'=' { 0 } else { v(c) };
        }
        let bytes = [(n >> 16) as u8, (n >> 8) as u8, n as u8];
        out.extend_from_slice(&bytes[..3 - pad]);
    }
    out
}

/// Sha-256 is not available without a dependency; fixtures are pinned by
/// the sums in `tests/fixtures/atlas/README.md` (checked by `sha256sum -c`
/// in the run evidence). Here: FNV-1a 64 of a byte slice, for determinism
/// checks inside the tests.
pub fn fnv1a64(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in bytes {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    h
}

#[test]
fn json_reader_round_trips_escapes() {
    let j = parse(r#"{"a":" x\t🔥","b":[1,-2.5e3,true,null]}"#);
    assert_eq!(j.get("a").str(), "\u{a0}x\t\u{1F525}");
    assert_eq!(j.get("b").arr()[1].num(), -2500.0);
    assert_eq!(base64("AQID"), vec![1, 2, 3]);
    assert_eq!(base64("AQ=="), vec![1]);
}
