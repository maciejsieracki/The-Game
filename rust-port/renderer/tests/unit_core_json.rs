//! Minimal JSON reader + fixture helpers shared by the `unit_core_*` tests
//! (included with `#[path]`; compiled on its own it has no tests).

#![allow(dead_code)]

use std::collections::BTreeMap;

/// JSON value.
#[derive(Debug, Clone)]
pub enum J {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<J>),
    Obj(BTreeMap<String, J>),
}

struct Parser<'a> {
    s: &'a [u8],
    i: usize,
}

impl Parser<'_> {
    fn ws(&mut self) {
        while self.i < self.s.len() && self.s[self.i].is_ascii_whitespace() {
            self.i += 1;
        }
    }
    fn lit(&mut self, l: &str) {
        assert!(
            self.s[self.i..].starts_with(l.as_bytes()),
            "bad literal at {}",
            self.i
        );
        self.i += l.len();
    }
    fn value(&mut self) -> J {
        self.ws();
        match self.s[self.i] {
            b'n' => {
                self.lit("null");
                J::Null
            }
            b't' => {
                self.lit("true");
                J::Bool(true)
            }
            b'f' => {
                self.lit("false");
                J::Bool(false)
            }
            b'"' => J::Str(self.string()),
            b'[' => {
                self.i += 1;
                let mut v = Vec::new();
                self.ws();
                if self.s[self.i] == b']' {
                    self.i += 1;
                    return J::Arr(v);
                }
                loop {
                    v.push(self.value());
                    self.ws();
                    let c = self.s[self.i];
                    self.i += 1;
                    if c == b']' {
                        return J::Arr(v);
                    }
                    assert_eq!(c, b',', "expected , at {}", self.i);
                }
            }
            b'{' => {
                self.i += 1;
                let mut m = BTreeMap::new();
                self.ws();
                if self.s[self.i] == b'}' {
                    self.i += 1;
                    return J::Obj(m);
                }
                loop {
                    self.ws();
                    let k = self.string();
                    self.ws();
                    assert_eq!(self.s[self.i], b':');
                    self.i += 1;
                    let v = self.value();
                    m.insert(k, v);
                    self.ws();
                    let c = self.s[self.i];
                    self.i += 1;
                    if c == b'}' {
                        return J::Obj(m);
                    }
                    assert_eq!(c, b',', "expected , at {}", self.i);
                }
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
                let t = std::str::from_utf8(&self.s[st..self.i]).unwrap();
                J::Num(t.parse().unwrap_or_else(|_| panic!("bad number {t}")))
            }
        }
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
                        b'n' => out.push(b'\n'),
                        b't' => out.push(b'\t'),
                        b'r' => out.push(b'\r'),
                        b'b' => out.push(8),
                        b'f' => out.push(12),
                        b'u' => {
                            let h = std::str::from_utf8(&self.s[self.i..self.i + 4]).unwrap();
                            self.i += 4;
                            let cp = u32::from_str_radix(h, 16).unwrap();
                            let ch =
                                char::from_u32(cp).expect("surrogates not used by the fixture");
                            let mut buf = [0u8; 4];
                            out.extend_from_slice(ch.encode_utf8(&mut buf).as_bytes());
                        }
                        _ => panic!("bad escape"),
                    }
                }
                _ => out.push(c),
            }
        }
        String::from_utf8(out).unwrap()
    }
}

/// Parses a JSON document.
pub fn parse(text: &str) -> J {
    let mut p = Parser {
        s: text.as_bytes(),
        i: 0,
    };
    p.value()
}

impl J {
    pub fn get(&self, k: &str) -> Option<&J> {
        match self {
            J::Obj(m) => m.get(k),
            _ => None,
        }
    }
    pub fn at(&self, k: &str) -> &J {
        self.get(k).unwrap_or_else(|| panic!("missing key {k}"))
    }
    pub fn arr(&self) -> &[J] {
        match self {
            J::Arr(v) => v,
            _ => panic!("not an array: {self:?}"),
        }
    }
    pub fn obj(&self) -> &BTreeMap<String, J> {
        match self {
            J::Obj(m) => m,
            _ => panic!("not an object"),
        }
    }
    pub fn f(&self) -> f64 {
        match self {
            J::Num(x) => *x,
            _ => panic!("not a number: {self:?}"),
        }
    }
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    pub fn u(&self) -> u32 {
        let x = self.f();
        assert!(
            x >= 0.0 && x.fract() == 0.0 && x <= f64::from(u32::MAX),
            "not a u32: {x}"
        );
        x as u32
    }
    #[allow(clippy::cast_possible_truncation)]
    pub fn i(&self) -> i64 {
        let x = self.f();
        assert!(x.fract() == 0.0, "not an integer: {x}");
        x as i64
    }
    pub fn b(&self) -> bool {
        match self {
            J::Bool(b) => *b,
            _ => panic!("not a bool: {self:?}"),
        }
    }
    pub fn s(&self) -> &str {
        match self {
            J::Str(s) => s,
            _ => panic!("not a string: {self:?}"),
        }
    }
    pub fn is_null(&self) -> bool {
        matches!(self, J::Null)
    }
    /// Decodes a `hx()` string of the generator: 16 hex digits per f64 bits.
    pub fn bits(&self) -> Vec<u64> {
        let s = self.s();
        assert_eq!(s.len() % 16, 0, "bad bit string length");
        (0..s.len() / 16)
            .map(|k| u64::from_str_radix(&s[k * 16..k * 16 + 16], 16).unwrap())
            .collect()
    }
}

/// Loads `tests/fixtures/unit_core/unit_core.json`.
pub fn fixture() -> J {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/unit_core/unit_core.json"
    );
    parse(&std::fs::read_to_string(path).expect("fixture"))
}
