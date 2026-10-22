//! P6.1E: macierz cywilizacji i jej konsumenci (web, pin `edb8fb56`):
//! - `gra/src/game/civ-matrix.ts` -> modul glowny ([`civ_matrix_param`] i spolka),
//! - `gra/src/game/civ-matrix-semantic.ts` -> [`semantic`],
//! - `gra/src/game/civ-ai-data.ts` -> [`ai_data`],
//! - helpery zgodnosci z JS (`Math.round`, `Number#toString`, `Number#toFixed`, `String#trim`)
//!   -> [`js_compat`].
//!
//! Dane macierzy (`civ-matrix.json`) sa juz w Rust (`data::civilizations::CivMatrixFile`,
//! parsowane od P1). Web trzyma je w module-globalnym `DATA`; tu kazda funkcja dostaje dane
//! jawnie (`&CivMatrixFile` albo [`CivMatrixData`]), zeby testy mogly podac dane syntetyczne.
//! Kolejnosc parametrow (`Object.keys(paramDefs)`) jest istotna w webie (kolejnosc komorek
//! migawki), a `BTreeMap` jej nie zachowuje - [`CivMatrixData`] czyta ja osobno z tekstu JSON.
//!
//! Stale balansowe i teksty NIE sa literalami w kodzie: leza w edytowalnych tabelach
//! `data/derived/civ-matrix-params.json` i `civ-matrix-semantic.json`.
//!
//! Domena wejsc: identyfikatory (`civKey`, `paramId`) to zwykle napisy; klucze dziedziczone po
//! prototypie JS (`constructor`, `toString`, `__proto__`) nie wystepuja w danych i nie sa
//! odtwarzane (NIE-DOTYCZY, jawnie).

use std::sync::OnceLock;

use serde::de::{IgnoredAny, MapAccess, Visitor};
use serde::{Deserialize, Deserializer};

use crate::data::civilizations::{
    CivMatrixFile, CywilizacjeItem2, Num, ParamDefsValue, CIV_MATRIX_JSON,
};
use crate::data::derived::civ_matrix_params;

use self::js_compat::{js_max, js_min};

/// Pomocniki odtwarzajace semantyke JS tam, gdzie Rust rozni sie od ECMAScript.
pub mod js_compat {
    /// `Math.min(a, b)` z propagacja `NaN`.
    pub fn js_min(a: f64, b: f64) -> f64 {
        if a.is_nan() || b.is_nan() {
            f64::NAN
        } else {
            a.min(b)
        }
    }

    /// `Math.max(a, b)` z propagacja `NaN`.
    pub fn js_max(a: f64, b: f64) -> f64 {
        if a.is_nan() || b.is_nan() {
            f64::NAN
        } else {
            a.max(b)
        }
    }

    /// `Math.max(lo, Math.min(hi, x))`.
    pub fn js_clamp(lo: f64, hi: f64, x: f64) -> f64 {
        js_max(lo, js_min(hi, x))
    }

    /// `Math.round(x)`: polowki w strone `+Infinity` (Rust `round` zaokragla od zera).
    pub fn js_math_round(x: f64) -> f64 {
        if !x.is_finite() || x == 0.0 {
            return x;
        }
        let floor = x.floor();
        let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };
        // Math.round(x) = -0 dla -0.5 <= x < 0.
        if rounded == 0.0 && x < 0.0 {
            -0.0
        } else {
            rounded
        }
    }

    /// `String(x)` / `Number.prototype.toString()` (ECMA-262 Number::toString, podstawa 10).
    pub fn js_number_to_string(x: f64) -> String {
        if x.is_nan() {
            return "NaN".to_owned();
        }
        if x == 0.0 {
            return "0".to_owned();
        }
        if x.is_infinite() {
            return if x < 0.0 { "-Infinity" } else { "Infinity" }.to_owned();
        }
        let sign = if x < 0.0 { "-" } else { "" };
        // Najkrotsza reprezentacja round-trip: "d.ddde<exp>" => cyfry + wykladnik.
        let sci = format!("{:e}", x.abs());
        let (mantissa, exponent) = sci.split_once('e').unwrap_or((sci.as_str(), "0"));
        let digits: String = mantissa.chars().filter(|c| *c != '.').collect();
        let exp10: i32 = exponent.parse().unwrap_or(0);
        let k = digits.len() as i32;
        let n = exp10 + 1;
        let body = if (k..=21).contains(&n) {
            format!("{digits}{}", "0".repeat((n - k) as usize))
        } else if (1..=21).contains(&n) {
            format!("{}.{}", &digits[..n as usize], &digits[n as usize..])
        } else if (-5..=0).contains(&n) {
            format!("0.{}{digits}", "0".repeat((-n) as usize))
        } else {
            let e = n - 1;
            let e_sign = if e < 0 { '-' } else { '+' };
            let e_abs = e.abs();
            if k == 1 {
                format!("{digits}e{e_sign}{e_abs}")
            } else {
                format!("{}.{}e{e_sign}{e_abs}", &digits[..1], &digits[1..])
            }
        };
        format!("{sign}{body}")
    }

    /// `x.toFixed(fraction_digits)`: dokladne rozwiniecie dziesietne wartosci binarnej,
    /// polowki w gore (co do modulu). Dla `|x| >= 1e21` i wartosci nieskonczonych/NaN
    /// zwraca `String(x)` jak ECMAScript.
    pub fn js_to_fixed(x: f64, fraction_digits: usize) -> String {
        if !x.is_finite() || x.abs() >= 1e21 {
            return js_number_to_string(x);
        }
        debug_assert!(
            fraction_digits <= 40,
            "js_to_fixed: rozwiniecie ma 60 cyfr, liczba cyfr ulamkowych musi byc <= 40"
        );
        let negative = x < 0.0;
        // 60 cyfr po przecinku wystarcza do rozstrzygniecia cyfry zaokraglenia (cyfra
        // fraction_digits + 1 jest dokladna, bo zaokraglenie przy 60. cyfrze nie propaguje sie dalej).
        let exact = format!("{:.60}", x.abs());
        let (int_part, frac_part) = exact.split_once('.').unwrap_or((exact.as_str(), ""));
        let mut digits: Vec<u8> = int_part.bytes().map(|b| b - b'0').collect();
        let frac: Vec<u8> = frac_part.bytes().map(|b| b - b'0').collect();
        let keep = fraction_digits.min(frac.len());
        digits.extend_from_slice(&frac[..keep]);
        let round_up = frac.get(keep).is_some_and(|d| *d >= 5);
        if round_up {
            let mut i = digits.len();
            loop {
                if i == 0 {
                    digits.insert(0, 1);
                    break;
                }
                i -= 1;
                if digits[i] == 9 {
                    digits[i] = 0;
                } else {
                    digits[i] += 1;
                    break;
                }
            }
        }
        let int_len = digits.len() - keep;
        let int_text: String = digits[..int_len]
            .iter()
            .map(|d| char::from(b'0' + d))
            .collect();
        let frac_text: String = digits[int_len..]
            .iter()
            .map(|d| char::from(b'0' + d))
            .collect();
        let sign = if negative { "-" } else { "" };
        if fraction_digits == 0 {
            format!("{sign}{int_text}")
        } else {
            format!("{sign}{int_text}.{frac_text}")
        }
    }

    /// Czy znak jest biala spacja wg `String.prototype.trim` (WhiteSpace + LineTerminator).
    pub fn is_js_whitespace(c: char) -> bool {
        matches!(
            c,
            '\u{0009}'
                | '\u{000A}'
                | '\u{000B}'
                | '\u{000C}'
                | '\u{000D}'
                | '\u{0020}'
                | '\u{00A0}'
                | '\u{1680}'
                | '\u{2000}'
                ..='\u{200A}'
                    | '\u{2028}'
                    | '\u{2029}'
                    | '\u{202F}'
                    | '\u{205F}'
                    | '\u{3000}'
                    | '\u{FEFF}'
        )
    }

    /// `String.prototype.trim` (rozni sie od `str::trim`: BOM `U+FEFF` tak, `U+0085` nie).
    pub fn js_trim(s: &str) -> &str {
        s.trim_matches(is_js_whitespace)
    }

    /// `Number.isInteger`.
    pub fn js_is_integer(x: f64) -> bool {
        x.is_finite() && x.trunc() == x
    }
}

/// Web `CivMatrixFormula`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CivMatrixFormula {
    MulProc,
    MulAbs,
    Add,
    Flag,
    Skala,
    StatAbs,
}

impl CivMatrixFormula {
    /// Nazwa formuly z `paramDefs[*].formula`; nieznana nazwa => `None`.
    pub fn parse(name: &str) -> Option<Self> {
        match name {
            "mul_proc" => Some(Self::MulProc),
            "mul_abs" => Some(Self::MulAbs),
            "add" => Some(Self::Add),
            "flag" => Some(Self::Flag),
            "skala" => Some(Self::Skala),
            "stat_abs" => Some(Self::StatAbs),
            _ => None,
        }
    }
}

/// Web `CivMatrixDifficulty` (trzy poziomy trudnosci profili cywilizacji).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum CivMatrixDifficulty {
    Easy,
    #[default]
    Normal,
    Hard,
}

impl CivMatrixDifficulty {
    pub fn parse(name: &str) -> Option<Self> {
        match name {
            "easy" => Some(Self::Easy),
            "normal" => Some(Self::Normal),
            "hard" => Some(Self::Hard),
            _ => None,
        }
    }
}

/// Dane macierzy + kolejnosc parametrow z pliku (`Object.keys(paramDefs)`).
#[derive(Debug, Clone, PartialEq)]
pub struct CivMatrixData {
    pub file: CivMatrixFile,
    /// Identyfikatory parametrow w kolejnosci wystepowania w `paramDefs` pliku JSON.
    pub param_ids: Vec<String>,
}

struct OrderedKeys(Vec<String>);

impl<'de> Deserialize<'de> for OrderedKeys {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        struct KeysVisitor;
        impl<'de> Visitor<'de> for KeysVisitor {
            type Value = OrderedKeys;

            fn expecting(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.write_str("an object")
            }

            fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<OrderedKeys, A::Error> {
                let mut keys = Vec::new();
                while let Some(key) = map.next_key::<String>()? {
                    map.next_value::<IgnoredAny>()?;
                    keys.push(key);
                }
                Ok(OrderedKeys(keys))
            }
        }
        deserializer.deserialize_map(KeysVisitor)
    }
}

#[derive(Deserialize)]
struct ParamOrderProbe {
    #[serde(rename = "paramDefs")]
    param_defs: OrderedKeys,
}

impl CivMatrixData {
    /// Parsuje tekst `civ-matrix.json` (dane + kolejnosc parametrow).
    pub fn from_json(text: &str) -> Result<Self, serde_json::Error> {
        let file: CivMatrixFile = serde_json::from_str(text)?;
        let probe: ParamOrderProbe = serde_json::from_str(text)?;
        Ok(Self {
            file,
            param_ids: probe.param_defs.0,
        })
    }
}

/// Web `loadCivMatrix()`: pelna macierz wbudowana w silnik (zaladowana raz).
pub fn load_civ_matrix() -> &'static CivMatrixData {
    static DATA: OnceLock<CivMatrixData> = OnceLock::new();
    DATA.get_or_init(|| {
        CivMatrixData::from_json(CIV_MATRIX_JSON).expect("civ-matrix.json must parse")
    })
}

/// `Num` (liczba z JSON) jako `f64` weba.
pub fn num_to_f64(n: &Num) -> f64 {
    match n {
        Num::Int(i) => *i as f64,
        Num::Float(f) => *f,
    }
}

/// Web `resolveRow`: wiersz po `ikonaId` / `typCywilizacji` / `Cywilizacja`, bez uwzglednienia wielkosci liter.
pub fn resolve_row<'a>(matrix: &'a CivMatrixFile, civ_key: &str) -> Option<&'a CywilizacjeItem2> {
    let key = civ_key.to_lowercase();
    matrix.cywilizacje.iter().find(|c| {
        c.ikona_id.to_lowercase() == key
            || c.typ_cywilizacji.to_lowercase() == key
            || c.cywilizacja.to_lowercase() == key
    })
}

/// Web `civMatrixParam`: wartosc parametru; brak wiersza => `defaults[param]`, brak => 0.
pub fn civ_matrix_param(matrix: &CivMatrixFile, civ_key: &str, param_id: &str) -> f64 {
    let default = matrix.defaults.get(param_id).map(num_to_f64);
    match resolve_row(matrix, civ_key) {
        None => default.unwrap_or(0.0),
        Some(row) => row
            .params
            .get(param_id)
            .map(num_to_f64)
            .or(default)
            .unwrap_or(0.0),
    }
}

/// Web `civMatrixParamDef`.
pub fn civ_matrix_param_def<'a>(
    matrix: &'a CivMatrixFile,
    param_id: &str,
) -> Option<&'a ParamDefsValue> {
    matrix.param_defs.get(param_id)
}

/// Web `civMatrixParamAtDifficulty`: tylko pola `skala` sa przesuwane trudnoscia (Easy -1,
/// Hard +1, ograniczone do 1..10 - wartosci z `civ-matrix-params.json`).
pub fn civ_matrix_param_at_difficulty(
    matrix: &CivMatrixFile,
    civ_key: &str,
    param_id: &str,
    difficulty: CivMatrixDifficulty,
) -> f64 {
    let normal = civ_matrix_param(matrix, civ_key, param_id);
    let rule = &civ_matrix_params().trudnosc;
    let scaled = civ_matrix_param_def(matrix, param_id)
        .is_some_and(|def| def.formula == rule.formula_skalowana);
    if difficulty == CivMatrixDifficulty::Normal || !scaled {
        return normal;
    }
    let delta = if difficulty == CivMatrixDifficulty::Easy {
        rule.delta_latwy
    } else {
        rule.delta_trudny
    };
    js_max(rule.min, js_min(rule.max, normal + delta))
}

/// Web `civMatrixParamsAtDifficulty`: pelny snapshot wszystkich parametrow w kolejnosci `paramDefs`.
pub fn civ_matrix_params_at_difficulty(
    data: &CivMatrixData,
    civ_key: &str,
    difficulty: CivMatrixDifficulty,
) -> Vec<(String, f64)> {
    data.param_ids
        .iter()
        .map(|param_id| {
            (
                param_id.clone(),
                civ_matrix_param_at_difficulty(&data.file, civ_key, param_id, difficulty),
            )
        })
        .collect()
}

/// Web `applyCivMatrixParam`: `mul_proc` baza*(1+v), `mul_abs` baza*v, `add` baza+v,
/// `flag`/`skala`/`stat_abs` => v. Brak definicji lub nieznana formula => `mul_proc`.
pub fn apply_civ_matrix_param(
    matrix: &CivMatrixFile,
    base: f64,
    civ_key: &str,
    param_id: &str,
) -> f64 {
    let value = civ_matrix_param(matrix, civ_key, param_id);
    let name = civ_matrix_param_def(matrix, param_id)
        .map_or(civ_matrix_params().formula_domyslna.as_str(), |def| {
            def.formula.as_str()
        });
    match CivMatrixFormula::parse(name) {
        Some(CivMatrixFormula::MulAbs) => base * value,
        Some(CivMatrixFormula::Add) => base + value,
        Some(CivMatrixFormula::Flag | CivMatrixFormula::Skala | CivMatrixFormula::StatAbs) => value,
        Some(CivMatrixFormula::MulProc) | None => base * (1.0 + value),
    }
}

/// Web `civMatrixProcSum`: suma kilku parametrow `mul_proc` (w kolejnosci argumentow).
pub fn civ_matrix_proc_sum(matrix: &CivMatrixFile, civ_key: &str, param_ids: &[&str]) -> f64 {
    let mut sum = 0.0;
    for id in param_ids {
        sum += civ_matrix_param(matrix, civ_key, id);
    }
    sum
}

/// Web `civMatrixApplyProc`: `baza * (1 + suma)`.
pub fn civ_matrix_apply_proc(
    matrix: &CivMatrixFile,
    base: f64,
    civ_key: &str,
    param_ids: &[&str],
) -> f64 {
    base * (1.0 + civ_matrix_proc_sum(matrix, civ_key, param_ids))
}

// ===========================================================================
// civ-ai-data.ts
// ===========================================================================

/// Web `civ-ai-data.ts`: profil AI i dyplomacji per nacja, skladany z macierzy z fallbackiem
/// na dane Excel 5A (`civ-ai.json`, `diplomacy.json`).
pub mod ai_data {
    use std::sync::OnceLock;

    use super::js_compat::{js_clamp, js_trim};
    use super::{
        civ_matrix_param_at_difficulty, civ_matrix_params_at_difficulty, load_civ_matrix,
        CivMatrixData, CivMatrixDifficulty,
    };
    use crate::data::civilizations::{
        parse_civ_ai, parse_civs, parse_diplomacy, CivAiFile, CivParamsFile, CivsFile,
        CywilizacjeItem2, CywilizacjeItem3, CywilizacjeItem4, PerNacjaItem,
    };
    use crate::data::derived::civ_matrix_params;

    /// Web `CivAiProfile`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct CivAiProfile {
        pub cywilizacja: String,
        pub agresywnosc: f64,
        pub ekspansywnosc: f64,
        pub priorytet_militarny: f64,
        pub priorytet_ekonomia: f64,
        pub priorytet_nauka: f64,
        pub tolerancja_ryzyka: f64,
        pub sklonnosc_do_podboju: f64,
        pub profil_mapy: String,
        pub uwagi: Option<String>,
    }

    impl From<&CywilizacjeItem4> for CivAiProfile {
        /// Wiersz `civ-ai.json` (web zwraca go wprost, gdy macierz nie ma wiersza).
        fn from(row: &CywilizacjeItem4) -> Self {
            Self {
                cywilizacja: row.cywilizacja.clone(),
                agresywnosc: row.agresywnosc as f64,
                ekspansywnosc: row.ekspansywnosc as f64,
                priorytet_militarny: row.priorytet_militarny as f64,
                priorytet_ekonomia: row.priorytet_ekonomia as f64,
                priorytet_nauka: row.priorytet_nauka as f64,
                tolerancja_ryzyka: row.tolerancja_ryzyka as f64,
                sklonnosc_do_podboju: row.sklonnosc_do_podboju as f64,
                profil_mapy: row.profil_mapy.clone(),
                uwagi: Some(row.uwagi.clone()),
            }
        }
    }

    /// Web `GameData` w zakresie czytanym przez `civ-ai-data.ts` (`civAi`, `civParams`).
    #[derive(Debug, Clone, Copy, Default)]
    pub struct CivGameData<'a> {
        pub civ_ai: Option<&'a CivAiFile>,
        pub civ_params: Option<&'a CivParamsFile>,
    }

    /// Dane importowane przez modul webowy (statyczne `import ... from '../../data/*.json'`).
    #[derive(Debug, Clone, Copy)]
    pub struct CivAiSources<'a> {
        pub matrix: &'a CivMatrixData,
        pub civs: &'a CivsFile,
        /// Web `civAiRaw` (`civ-ai.json` zaimportowany wprost).
        pub civ_ai_raw: &'a CivAiFile,
        /// Web `diplomacyRaw.perNacja`.
        pub per_nacja: &'a [PerNacjaItem],
    }

    struct Embedded {
        civs: CivsFile,
        civ_ai: CivAiFile,
        per_nacja: Vec<PerNacjaItem>,
    }

    fn embedded() -> &'static Embedded {
        static DATA: OnceLock<Embedded> = OnceLock::new();
        DATA.get_or_init(|| Embedded {
            civs: parse_civs().expect("civs.json must parse"),
            civ_ai: parse_civ_ai().expect("civ-ai.json must parse"),
            per_nacja: parse_diplomacy()
                .expect("diplomacy.json must parse")
                .per_nacja,
        })
    }

    /// Zrodla wbudowane w silnik (odpowiednik importow modulu webowego).
    pub fn embedded_sources() -> CivAiSources<'static> {
        let data = embedded();
        CivAiSources {
            matrix: load_civ_matrix(),
            civs: &data.civs,
            civ_ai_raw: &data.civ_ai,
            per_nacja: &data.per_nacja,
        }
    }

    fn unit_range(value: f64) -> f64 {
        let range = civ_matrix_params().ai.zakres;
        js_clamp(range.min, range.max, value)
    }

    /// Wiersz macierzy po dokladnej nazwie / `ikonaId` / `typCywilizacji` (porownanie `===`).
    fn matrix_row_by_name<'a>(
        matrix: &'a CivMatrixData,
        civ_name: &str,
    ) -> Option<&'a CywilizacjeItem2> {
        matrix.file.cywilizacje.iter().find(|c| {
            c.cywilizacja == civ_name || c.ikona_id == civ_name || c.typ_cywilizacji == civ_name
        })
    }

    fn legacy_ai_row<'a>(data: &CivGameData<'a>, civ_name: &str) -> Option<&'a CywilizacjeItem4> {
        data.civ_ai?
            .cywilizacje
            .iter()
            .find(|c| c.cywilizacja == civ_name)
    }

    /// Web `civAiAggressionNorm`: agresja 0..1 z macierzy (fallback: `civ-ai.json`).
    pub fn civ_ai_aggression_norm(
        src: &CivAiSources<'_>,
        data: &CivGameData<'_>,
        civ_name: &str,
        difficulty: CivMatrixDifficulty,
    ) -> Option<f64> {
        let ai = &civ_matrix_params().ai;
        if matrix_row_by_name(src.matrix, civ_name).is_some() {
            let value = civ_matrix_param_at_difficulty(
                &src.matrix.file,
                civ_name,
                &ai.parametry.agresywnosc,
                difficulty,
            );
            return Some(unit_range(value / ai.dzielnik_skali));
        }
        let row = legacy_ai_row(data, civ_name)?;
        Some(unit_range(row.agresywnosc as f64 / ai.dzielnik_skali))
    }

    fn profile_name(is_defensive: bool) -> String {
        let ai = &civ_matrix_params().ai;
        if is_defensive {
            ai.profil_mapy_obronna.clone()
        } else {
            ai.profil_mapy_standardowa.clone()
        }
    }

    /// Web `civAiProfilMapy`: `kopia_typu_obronna` / `standardowa` z macierzy, inaczej `profilMapy` z `civ-ai.json`.
    pub fn civ_ai_profil_mapy(
        src: &CivAiSources<'_>,
        data: &CivGameData<'_>,
        civ_name: &str,
        difficulty: CivMatrixDifficulty,
    ) -> Option<String> {
        let ai = &civ_matrix_params().ai;
        if let Some(row) = matrix_row_by_name(src.matrix, civ_name) {
            let flag = civ_matrix_param_at_difficulty(
                &src.matrix.file,
                &row.ikona_id,
                &ai.parametry.profil_obronna,
                difficulty,
            );
            return Some(profile_name(flag == ai.profil_obronna_wartosc));
        }
        let legacy = legacy_ai_row(data, civ_name)?;
        let trimmed = js_trim(&legacy.profil_mapy);
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_owned())
        }
    }

    /// Web `civAiProfileFor`: pelny profil AI z macierzy; `civ-ai.json` zostaje adapterem pol opisowych.
    pub fn civ_ai_profile_for(
        src: &CivAiSources<'_>,
        data: &CivGameData<'_>,
        civ_name: &str,
        difficulty: CivMatrixDifficulty,
    ) -> Option<CivAiProfile> {
        let legacy = legacy_ai_row(data, civ_name);
        let matrix_row = matrix_row_by_name(src.matrix, civ_name);
        let Some(matrix_row) = matrix_row else {
            return legacy.map(CivAiProfile::from);
        };
        let ai = &civ_matrix_params().ai;
        let values = civ_matrix_params_at_difficulty(src.matrix, &matrix_row.ikona_id, difficulty);
        let value = |id: &str| {
            values
                .iter()
                .find(|(key, _)| key == id)
                .map_or(ai.domyslna_wartosc_skali, |(_, v)| *v)
        };
        let defensive_flag = values
            .iter()
            .find(|(key, _)| *key == ai.parametry.profil_obronna)
            .map(|(_, v)| *v);
        Some(CivAiProfile {
            cywilizacja: legacy.map_or_else(
                || matrix_row.cywilizacja.clone(),
                |row| row.cywilizacja.clone(),
            ),
            agresywnosc: value(&ai.parametry.agresywnosc),
            ekspansywnosc: value(&ai.parametry.ekspansywnosc),
            priorytet_militarny: value(&ai.parametry.priorytet_militarny),
            priorytet_ekonomia: value(&ai.parametry.priorytet_ekonomia),
            priorytet_nauka: value(&ai.parametry.priorytet_nauka),
            tolerancja_ryzyka: value(&ai.parametry.tolerancja_ryzyka),
            sklonnosc_do_podboju: value(&ai.parametry.sklonnosc_podboju),
            profil_mapy: profile_name(defensive_flag == Some(ai.profil_obronna_wartosc)),
            uwagi: legacy.map(|row| row.uwagi.clone()),
        })
    }

    /// Web `civAiProfileForTyp`: profil po `TypCywilizacji` (`ikonaId` z `civs.json`).
    pub fn civ_ai_profile_for_typ(
        src: &CivAiSources<'_>,
        data: &CivGameData<'_>,
        typ: &str,
        difficulty: CivMatrixDifficulty,
    ) -> Option<CivAiProfile> {
        let name = civ_excel_name_from_typ(src, typ)?;
        civ_ai_profile_for(src, data, &name, difficulty)
    }

    /// Web `civParamsFor`.
    pub fn civ_params_for<'a>(
        data: &CivGameData<'a>,
        civ_name: &str,
    ) -> Option<&'a CywilizacjeItem3> {
        data.civ_params?
            .cywilizacje
            .iter()
            .find(|c| c.cywilizacja == civ_name)
    }

    /// Web `isKopiaTypuObronna`: czy owner to kopia typu (D-START) wg profilu (trudnosc Normal).
    pub fn is_kopia_typu_obronna(
        src: &CivAiSources<'_>,
        data: &CivGameData<'_>,
        civ_name: &str,
    ) -> bool {
        civ_ai_profil_mapy(src, data, civ_name, CivMatrixDifficulty::Normal).as_deref()
            == Some(civ_matrix_params().ai.profil_mapy_obronna.as_str())
    }

    /// Web `civExcelNameFromTyp`: nazwa z Excela (`Cywilizacja`) po `ikonaId`; typ drobnej cywilizacji => `None`.
    pub fn civ_excel_name_from_typ(src: &CivAiSources<'_>, typ: &str) -> Option<String> {
        if typ == civ_matrix_params().typ_bez_nazwy_excel {
            return None;
        }
        src.civs
            .cywilizacje
            .iter()
            .find(|c| c.ikona_id == typ)
            .map(|c| c.cywilizacja.clone())
    }

    /// Web `diplomacyPerNacjaRow`.
    pub fn diplomacy_per_nacja_row<'a>(
        src: &CivAiSources<'a>,
        civ_name: &str,
    ) -> Option<&'a PerNacjaItem> {
        src.per_nacja.iter().find(|r| r.cywilizacja == civ_name)
    }

    /// Web `diplomacyPerNacjaForTyp`.
    pub fn diplomacy_per_nacja_for_typ<'a>(
        src: &CivAiSources<'a>,
        typ: &str,
    ) -> Option<&'a PerNacjaItem> {
        let name = civ_excel_name_from_typ(src, typ)?;
        diplomacy_per_nacja_row(src, &name)
    }

    /// Web `resolveArchetypeAggression`: agresja 0..1 (macierz, potem `civ-ai.json`, potem `fallback`).
    /// `data = None` => odczyt z `civ-ai.json` zaimportowanego wprost (`civAiRaw`).
    pub fn resolve_archetype_aggression(
        src: &CivAiSources<'_>,
        typ: &str,
        fallback: f64,
        data: Option<&CivGameData<'_>>,
        difficulty: CivMatrixDifficulty,
    ) -> f64 {
        let Some(civ_name) = civ_excel_name_from_typ(src, typ) else {
            return fallback;
        };
        let ai = &civ_matrix_params().ai;
        let matrix_row =
            src.matrix.file.cywilizacje.iter().find(|c| {
                c.cywilizacja == civ_name || c.ikona_id == typ || c.typ_cywilizacji == typ
            });
        if matrix_row.is_some() {
            let value = civ_matrix_param_at_difficulty(
                &src.matrix.file,
                typ,
                &ai.parametry.agresywnosc,
                difficulty,
            );
            return unit_range(value / ai.dzielnik_skali);
        }
        let from_data = match data {
            Some(data) => civ_ai_aggression_norm(src, data, &civ_name, difficulty),
            None => src
                .civ_ai_raw
                .cywilizacje
                .iter()
                .find(|c| c.cywilizacja == civ_name)
                .map(|row| unit_range(row.agresywnosc as f64 / ai.dzielnik_skali)),
        };
        from_data.unwrap_or(fallback)
    }

    /// Web `resolveArchetypeTrade`: sklonnosc do handlu 0..1 (macierz `dip_handlowosc_archetyp`,
    /// potem `perNacja.otwartoscHandel / 10`, potem `fallback`).
    pub fn resolve_archetype_trade(
        src: &CivAiSources<'_>,
        typ: &str,
        fallback: f64,
        difficulty: CivMatrixDifficulty,
    ) -> f64 {
        let dip = &civ_matrix_params().dyplomacja;
        let matrix_row = src
            .matrix
            .file
            .cywilizacje
            .iter()
            .find(|c| c.ikona_id == typ || c.typ_cywilizacji == typ);
        if matrix_row.is_some() {
            return unit_range(civ_matrix_param_at_difficulty(
                &src.matrix.file,
                typ,
                &dip.parametr_handel,
                difficulty,
            ));
        }
        match diplomacy_per_nacja_for_typ(src, typ) {
            Some(row) => unit_range(row.otwartosc_handel as f64 / dip.dzielnik_otwartosc_handel),
            None => fallback,
        }
    }

    /// Web `nastawienieBazoweZaufanieDelta`: polowa delty `nastawienieBazowe` wzgledem `base_total`
    /// (`None` => domyslna baza z tabeli, jak argument domyslny weba).
    pub fn nastawienie_bazowe_zaufanie_delta(
        src: &CivAiSources<'_>,
        typ: &str,
        base_total: Option<f64>,
        difficulty: CivMatrixDifficulty,
    ) -> f64 {
        let dip = &civ_matrix_params().dyplomacja;
        let base_total = base_total.unwrap_or(dip.nastawienie_baza_domyslna);
        let matrix_row = src
            .matrix
            .file
            .cywilizacje
            .iter()
            .find(|c| c.ikona_id == typ || c.typ_cywilizacji == typ);
        if matrix_row.is_some() {
            let value = civ_matrix_param_at_difficulty(
                &src.matrix.file,
                typ,
                &dip.parametr_nastawienie,
                difficulty,
            );
            return (value - base_total) / dip.nastawienie_podzial;
        }
        match diplomacy_per_nacja_for_typ(src, typ) {
            Some(row) => (row.nastawienie_bazowe as f64 - base_total) / dip.nastawienie_podzial,
            None => 0.0,
        }
    }
}

// ===========================================================================
// civ-matrix-semantic.ts
// ===========================================================================

/// Web `civ-matrix-semantic.ts`: tylko-do-odczytu semantyczna prezentacja macierzy (klasyfikacja
/// komorek wzgledem mediany, status konsumenta, teksty PL). Zbiory i teksty - z
/// `data/derived/civ-matrix-semantic.json`.
pub mod semantic {
    use std::collections::BTreeMap;

    use super::js_compat::{
        js_clamp, js_is_integer, js_math_round, js_number_to_string, js_to_fixed, js_trim,
    };
    use super::{num_to_f64, CivMatrixData};
    use crate::data::civilizations::{CywilizacjeItem2, ParamDefsValue};
    use crate::data::derived::civ_matrix_semantic;

    /// Web `CivMatrixConsumerStatus`.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum ConsumerStatus {
        RealGameplay,
        UiOnly,
        ReferenceNeedsReview,
        Unwired,
        DeadUnwired,
        Proposal,
        Blocked,
        DecisionRequired,
    }

    impl ConsumerStatus {
        /// Nazwa jak w webie (`'REAL_GAMEPLAY'`, ...).
        pub fn name(self) -> &'static str {
            match self {
                Self::RealGameplay => "REAL_GAMEPLAY",
                Self::UiOnly => "UI_ONLY",
                Self::ReferenceNeedsReview => "REFERENCE_NEEDS_REVIEW",
                Self::Unwired => "UNWIRED",
                Self::DeadUnwired => "DEAD_UNWIRED",
                Self::Proposal => "PROPOSAL",
                Self::Blocked => "BLOCKED",
                Self::DecisionRequired => "DECISION_REQUIRED",
            }
        }

        pub fn parse(name: &str) -> Option<Self> {
            [
                Self::RealGameplay,
                Self::UiOnly,
                Self::ReferenceNeedsReview,
                Self::Unwired,
                Self::DeadUnwired,
                Self::Proposal,
                Self::Blocked,
                Self::DecisionRequired,
            ]
            .into_iter()
            .find(|status| status.name() == name)
        }
    }

    /// Web `CivMatrixSemanticPolarity`.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum Polarity {
        Beneficial,
        Harmful,
        Neutral,
    }

    impl Polarity {
        /// Napis jak w webie (`'beneficial'` / `'harmful'` / `'neutral/not-applicable'`) z tabeli.
        pub fn name(self) -> &'static str {
            let names = &civ_matrix_semantic().polaryzacja;
            match self {
                Self::Beneficial => names.korzystna.as_str(),
                Self::Harmful => names.szkodliwa.as_str(),
                Self::Neutral => names.neutralna.as_str(),
            }
        }
    }

    /// Web `CivMatrixSemanticLabel`.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum DirectionLabel {
        Positive,
        Negative,
        Neutral,
    }

    impl DirectionLabel {
        /// Napis jak w webie (`'POZYTYWNY'` / `'NEGATYWNY'` / `'NEUTRALNY'`) z tabeli.
        pub fn name(self) -> &'static str {
            let names = &civ_matrix_semantic().etykiety_kierunku;
            match self {
                Self::Positive => names.pozytywny.as_str(),
                Self::Negative => names.negatywny.as_str(),
                Self::Neutral => names.neutralny.as_str(),
            }
        }
    }

    /// Web `CivMatrixNeutralBand`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct NeutralBand {
        pub policy_id: String,
        pub tolerance: f64,
        pub key: String,
    }

    /// Web `CivMatrixSemanticCell['provenance']`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct Provenance {
        pub matrix_version: String,
        pub semantic_version: String,
        pub consumer_evidence: Vec<String>,
    }

    /// Web `CivMatrixSemanticCell`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct SemanticCell {
        pub parameter_id: String,
        pub civilization_id: String,
        pub civilization_name: String,
        pub domain: String,
        pub unit: String,
        pub formula: String,
        pub raw_value: Option<f64>,
        pub baseline_kind: String,
        pub baseline_value: Option<f64>,
        pub min_value: Option<f64>,
        pub max_value: Option<f64>,
        pub max_distance: Option<f64>,
        pub corrected_delta: Option<f64>,
        pub polarity: Polarity,
        pub neutral_band: NeutralBand,
        pub label: DirectionLabel,
        pub signed_intensity: f64,
        pub consumer_status: ConsumerStatus,
        pub status_label_pl: String,
        pub status_reason_pl: String,
        pub explanation_pl: String,
        pub difficulty_behavior_pl: String,
        pub source: String,
        pub provenance: Provenance,
    }

    /// Web `CivMatrixSemanticCellInput`.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct SemanticCellInput {
        pub parameter_id: String,
        pub civilization_id: String,
        pub civilization_name: Option<String>,
        pub raw_value: Option<f64>,
        pub baseline_value: Option<f64>,
        pub min_value: Option<f64>,
        pub max_value: Option<f64>,
        pub consumer_status: Option<ConsumerStatus>,
        pub source: Option<String>,
    }

    /// Web `CivMatrixSemanticProfile`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct SemanticProfile {
        pub civilization_id: String,
        pub civilization_name: String,
        pub difficulty: String,
        pub baseline_kind: String,
        pub parameter_count: usize,
        pub active_count: usize,
        pub inactive_count: usize,
        pub cells: Vec<SemanticCell>,
        pub blocked_reason_pl: Option<String>,
    }

    /// Web `CivMatrixSemanticSnapshot`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct SemanticSnapshot {
        pub version: String,
        pub difficulty: String,
        pub parameter_count: usize,
        pub civilization_count: usize,
        pub expected_cell_count: usize,
        pub cells: Vec<SemanticCell>,
        pub profiles: Vec<SemanticProfile>,
    }

    /// Mediana, minimum i maksimum parametru po wszystkich cywilizacjach.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct Baseline {
        pub median: f64,
        pub min: f64,
        pub max: f64,
    }

    /// Dane macierzy + linie bazowe (web: stala `BASELINES` liczona raz przy imporcie modulu).
    #[derive(Debug, Clone)]
    pub struct SemanticContext<'a> {
        pub data: &'a CivMatrixData,
        baselines: BTreeMap<String, Baseline>,
    }

    impl<'a> SemanticContext<'a> {
        /// Web `buildBaselines()`: parametr bez wartosci liczbowej u KAZDEJ cywilizacji jest pomijany.
        pub fn new(data: &'a CivMatrixData) -> Self {
            let rows = &data.file.cywilizacje;
            let mut baselines = BTreeMap::new();
            for parameter_id in &data.param_ids {
                let values: Vec<f64> = rows
                    .iter()
                    .filter_map(|row| row.params.get(parameter_id).map(num_to_f64))
                    .filter(|v| v.is_finite())
                    .collect();
                if values.len() != rows.len() {
                    continue;
                }
                let min = values.iter().copied().fold(f64::INFINITY, f64::min);
                let max = values.iter().copied().fold(f64::NEG_INFINITY, f64::max);
                baselines.insert(
                    parameter_id.clone(),
                    Baseline {
                        median: median(&values),
                        min,
                        max,
                    },
                );
            }
            Self { data, baselines }
        }

        fn def(&self, parameter_id: &str) -> Option<&ParamDefsValue> {
            self.data.file.param_defs.get(parameter_id)
        }
    }

    fn in_list(list: &[String], id: &str) -> bool {
        list.iter().any(|item| item == id)
    }

    fn fill(template: &str, replacements: &[(&str, &str)]) -> String {
        let mut out = String::with_capacity(template.len());
        let mut rest = template;
        'scan: while !rest.is_empty() {
            for (placeholder, value) in replacements {
                if let Some(tail) = rest.strip_prefix(placeholder) {
                    out.push_str(value);
                    rest = tail;
                    continue 'scan;
                }
            }
            let mut chars = rest.chars();
            if let Some(c) = chars.next() {
                out.push(c);
            }
            rest = chars.as_str();
        }
        out
    }

    /// Web `civMatrixSemanticParameterIds`.
    pub fn civ_matrix_semantic_parameter_ids<'a>(ctx: &'a SemanticContext<'_>) -> &'a [String] {
        &ctx.data.param_ids
    }

    /// Web `civMatrixSemanticCivilizations`.
    pub fn civ_matrix_semantic_civilizations<'a>(
        ctx: &'a SemanticContext<'_>,
    ) -> &'a [CywilizacjeItem2] {
        &ctx.data.file.cywilizacje
    }

    /// Web `civMatrixConsumerStatus`.
    pub fn civ_matrix_consumer_status(parameter_id: &str) -> ConsumerStatus {
        let sets = &civ_matrix_semantic().zbiory;
        if in_list(&sets.real_gameplay, parameter_id) {
            ConsumerStatus::RealGameplay
        } else if in_list(&sets.ui_only, parameter_id) {
            ConsumerStatus::UiOnly
        } else if in_list(&sets.decision_required, parameter_id) {
            ConsumerStatus::DecisionRequired
        } else if in_list(&sets.walka_martwa, parameter_id) {
            ConsumerStatus::DeadUnwired
        } else if in_list(&sets.walka_zablokowana, parameter_id) {
            ConsumerStatus::Blocked
        } else {
            ConsumerStatus::Unwired
        }
    }

    /// Web `civMatrixConsumerEvidence`.
    pub fn civ_matrix_consumer_evidence(parameter_id: &str) -> Vec<String> {
        civ_matrix_semantic()
            .dowody_konsumentow
            .get(parameter_id)
            .map(|evidence| vec![evidence.clone()])
            .unwrap_or_default()
    }

    /// Web `civMatrixSemanticPolarity`.
    pub fn civ_matrix_semantic_polarity(ctx: &SemanticContext<'_>, parameter_id: &str) -> Polarity {
        let sets = &civ_matrix_semantic().zbiory;
        let Some(def) = ctx.def(parameter_id) else {
            return Polarity::Neutral;
        };
        if in_list(&sets.domeny_neutralne, &def.domena)
            || sets
                .prefiksy_neutralne
                .iter()
                .any(|prefix| parameter_id.starts_with(prefix.as_str()))
        {
            return Polarity::Neutral;
        }
        if in_list(&sets.szkodliwe, parameter_id) {
            Polarity::Harmful
        } else {
            Polarity::Beneficial
        }
    }

    /// Web `civMatrixNeutralBand`: pierwsza pasujaca regula tabeli (formula LUB jednostka), inaczej domyslna.
    pub fn civ_matrix_neutral_band(definition: &ParamDefsValue) -> NeutralBand {
        let table = civ_matrix_semantic();
        let rule = table.pasma_neutralne.reguly.iter().find(|rule| {
            in_list(&rule.gdy_formula, &definition.formula)
                || in_list(&rule.gdy_jednostka, &definition.jednostka)
        });
        let (key, tolerance) = match rule {
            Some(rule) => (&rule.klucz, rule.tolerancja),
            None => (
                &table.pasma_neutralne.domyslne.klucz,
                table.pasma_neutralne.domyslne.tolerancja,
            ),
        };
        NeutralBand {
            policy_id: table.polityka_pasm.clone(),
            tolerance,
            key: key.clone(),
        }
    }

    /// Web `median` (pusta lista => `NaN`).
    pub fn median(values: &[f64]) -> f64 {
        if values.is_empty() {
            return f64::NAN;
        }
        let mut sorted = values.to_vec();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let middle = sorted.len() / 2;
        if sorted.len() % 2 == 1 {
            sorted[middle]
        } else {
            (sorted[middle - 1] + sorted[middle]) / 2.0
        }
    }

    /// Web `roundTwo` (`Math.round(v * 100) / 100`, `-0` => `0`).
    fn round_two(value: f64) -> f64 {
        let factor = civ_matrix_semantic().skala_intensywnosci.zaokraglenie;
        let rounded = js_math_round(value * factor) / factor;
        if rounded == 0.0 {
            0.0
        } else {
            rounded
        }
    }

    /// Web `statusLabel`.
    fn status_label(status: ConsumerStatus) -> String {
        civ_matrix_semantic()
            .etykiety_statusow
            .get(status.name())
            .cloned()
            .unwrap_or_default()
    }

    /// Web `statusReason`.
    fn status_reason(status: ConsumerStatus, parameter_id: &str, polarity: Polarity) -> String {
        let table = civ_matrix_semantic();
        let reasons = &table.powody;
        let with_param = |template: &str| fill(template, &[("{parametr}", parameter_id)]);
        match status {
            ConsumerStatus::RealGameplay => {
                if polarity == Polarity::Neutral {
                    reasons.real_gameplay.neutralny.clone()
                } else {
                    reasons.real_gameplay.pozostale.clone()
                }
            }
            ConsumerStatus::UiOnly => reasons.ui_only.clone(),
            ConsumerStatus::Unwired => match reasons.unwired.wyjatki.get(parameter_id) {
                Some(text) => text.clone(),
                None => with_param(&reasons.unwired.domyslny),
            },
            ConsumerStatus::DeadUnwired => reasons.dead_unwired.clone(),
            ConsumerStatus::Proposal => reasons.proposal.clone(),
            ConsumerStatus::ReferenceNeedsReview => reasons.reference_needs_review.clone(),
            ConsumerStatus::Blocked => {
                if in_list(&table.zbiory.walka_zablokowana, parameter_id) {
                    with_param(&reasons.blocked.grupa_walka_zablokowana)
                } else {
                    with_param(&reasons.blocked.domyslny)
                }
            }
            ConsumerStatus::DecisionRequired => {
                match reasons.decision_required.wyjatki.get(parameter_id) {
                    Some(text) => text.clone(),
                    None => with_param(&reasons.decision_required.domyslny),
                }
            }
        }
    }

    /// Web `difficultyBehavior`.
    fn difficulty_behavior(parameter_id: &str, status: ConsumerStatus) -> String {
        let texts = &civ_matrix_semantic().zachowanie_trudnosci;
        if in_list(&texts.bez_roznic_statusy, status.name()) {
            return texts.bez_roznic_tekst.clone();
        }
        if let Some(text) = texts.wyjatki.get(parameter_id) {
            return text.clone();
        }
        if in_list(&texts.grupa_bez_wzmocnien.parametry, parameter_id) {
            return texts.grupa_bez_wzmocnien.tekst.clone();
        }
        if parameter_id.starts_with(texts.prefiks_ai.prefiks.as_str()) {
            return texts.prefiks_ai.tekst.clone();
        }
        texts.domyslny.clone()
    }

    /// Web `consumerExplanation`.
    fn consumer_explanation(
        parameter_id: &str,
        status: ConsumerStatus,
        polarity: Polarity,
    ) -> String {
        match civ_matrix_semantic().dowody_konsumentow.get(parameter_id) {
            Some(evidence) => evidence.clone(),
            None => status_reason(status, parameter_id, polarity),
        }
    }

    struct Direction {
        label: DirectionLabel,
        signed_intensity: f64,
        corrected_delta: Option<f64>,
        max_distance: Option<f64>,
    }

    /// Web `classifyDirection`.
    fn classify_direction(
        raw: f64,
        baseline: f64,
        min: f64,
        max: f64,
        polarity: Polarity,
    ) -> Direction {
        let scale = civ_matrix_semantic().skala_intensywnosci;
        if polarity == Polarity::Neutral {
            return Direction {
                label: DirectionLabel::Neutral,
                signed_intensity: 0.0,
                corrected_delta: Some(0.0),
                max_distance: Some(0.0),
            };
        }
        let corrected_delta = if polarity == Polarity::Beneficial {
            raw - baseline
        } else {
            baseline - raw
        };
        let max_distance = (max - baseline).abs().max((min - baseline).abs());
        // Dokladna mediana jest malym dodatnim znacznikiem tozsamosci, nie trzecia odznaka.
        if raw == baseline {
            return Direction {
                label: DirectionLabel::Positive,
                signed_intensity: 1.0,
                corrected_delta: Some(corrected_delta),
                max_distance: Some(max_distance),
            };
        }
        if max_distance == 0.0 {
            let positive = corrected_delta >= 0.0;
            return Direction {
                label: if positive {
                    DirectionLabel::Positive
                } else {
                    DirectionLabel::Negative
                },
                signed_intensity: if positive { 1.0 } else { -1.0 },
                corrected_delta: Some(corrected_delta),
                max_distance: Some(max_distance),
            };
        }
        let normalized = js_clamp(
            scale.min,
            scale.max,
            (corrected_delta / max_distance) * scale.mnoznik,
        );
        Direction {
            label: if normalized >= 0.0 {
                DirectionLabel::Positive
            } else {
                DirectionLabel::Negative
            },
            signed_intensity: round_two(normalized),
            corrected_delta: Some(corrected_delta),
            max_distance: Some(max_distance),
        }
    }

    fn finite(value: Option<f64>) -> Option<f64> {
        value.filter(|v| v.is_finite())
    }

    /// Web `classifyCivMatrixCell`.
    pub fn classify_civ_matrix_cell(
        ctx: &SemanticContext<'_>,
        input: &SemanticCellInput,
    ) -> SemanticCell {
        let table = civ_matrix_semantic();
        let def = ctx.def(&input.parameter_id);
        let status = input
            .consumer_status
            .unwrap_or_else(|| civ_matrix_consumer_status(&input.parameter_id));
        let polarity = civ_matrix_semantic_polarity(ctx, &input.parameter_id);
        let neutral_band = match def {
            Some(def) => civ_matrix_neutral_band(def),
            None => NeutralBand {
                policy_id: table.polityka_pasm.clone(),
                tolerance: table.pasma_neutralne.nieznany_parametr.tolerancja,
                key: table.pasma_neutralne.nieznany_parametr.klucz.clone(),
            },
        };
        let raw_value = finite(input.raw_value);
        let baseline_value = finite(input.baseline_value);
        let min_value = finite(input.min_value);
        let max_value = finite(input.max_value);
        let valid_numbers = [raw_value, baseline_value, min_value, max_value]
            .iter()
            .all(Option::is_some);
        let blocked = def.is_none() || !valid_numbers;
        let direction = match (raw_value, baseline_value, min_value, max_value) {
            (Some(raw), Some(baseline), Some(min), Some(max)) if !blocked => {
                classify_direction(raw, baseline, min, max, polarity)
            }
            _ => Direction {
                label: DirectionLabel::Neutral,
                signed_intensity: 0.0,
                corrected_delta: None,
                max_distance: None,
            },
        };
        let effective_status = if blocked {
            ConsumerStatus::Blocked
        } else {
            status
        };
        let blocked_reason = if def.is_none() {
            fill(
                &table.blokada_wejscia.nieznany_parametr,
                &[("{parametr}", input.parameter_id.as_str())],
            )
        } else if !valid_numbers {
            fill(
                &table.blokada_wejscia.brak_wartosci,
                &[
                    ("{cywilizacja}", input.civilization_id.as_str()),
                    ("{parametr}", input.parameter_id.as_str()),
                ],
            )
        } else {
            status_reason(effective_status, &input.parameter_id, polarity)
        };
        let status_reason_pl = if blocked {
            blocked_reason.clone()
        } else {
            status_reason(effective_status, &input.parameter_id, polarity)
        };
        let explanation_pl = if blocked {
            blocked_reason
        } else {
            consumer_explanation(&input.parameter_id, effective_status, polarity)
        };
        let source = input.source.clone().unwrap_or_else(|| {
            if blocked {
                table.zrodlo_wartosci.brak.clone()
            } else {
                table.zrodlo_wartosci.macierz.clone()
            }
        });
        SemanticCell {
            parameter_id: input.parameter_id.clone(),
            civilization_id: input.civilization_id.clone(),
            civilization_name: input
                .civilization_name
                .clone()
                .unwrap_or_else(|| input.civilization_id.clone()),
            domain: def.map_or_else(|| table.nieznane.domena.clone(), |d| d.domena.clone()),
            unit: def.map_or_else(|| table.nieznane.jednostka.clone(), |d| d.jednostka.clone()),
            formula: def.map_or_else(|| table.nieznane.formula.clone(), |d| d.formula.clone()),
            raw_value,
            baseline_kind: table.baza_porownania.clone(),
            baseline_value,
            min_value,
            max_value,
            max_distance: direction.max_distance,
            corrected_delta: direction.corrected_delta,
            polarity,
            neutral_band,
            label: direction.label,
            signed_intensity: direction.signed_intensity,
            consumer_status: effective_status,
            status_label_pl: status_label(effective_status),
            status_reason_pl,
            explanation_pl,
            difficulty_behavior_pl: difficulty_behavior(&input.parameter_id, effective_status),
            source,
            provenance: Provenance {
                matrix_version: ctx.data.file.meta.version.clone(),
                semantic_version: table.wersja.clone(),
                consumer_evidence: civ_matrix_consumer_evidence(&input.parameter_id),
            },
        }
    }

    /// Web `civMatrixSemanticBaseline`: mediana parametru (`None`, gdy parametr nie ma pelnych danych).
    pub fn civ_matrix_semantic_baseline(
        ctx: &SemanticContext<'_>,
        parameter_id: &str,
    ) -> Option<f64> {
        ctx.baselines.get(parameter_id).map(|b| b.median)
    }

    /// Linia bazowa (mediana/min/max) parametru - pelny odpowiednik wpisu `BASELINES[parameterId]`.
    pub fn civ_matrix_semantic_baseline_full(
        ctx: &SemanticContext<'_>,
        parameter_id: &str,
    ) -> Option<Baseline> {
        ctx.baselines.get(parameter_id).copied()
    }

    /// Web `findCivilization`: `trim` + `toLowerCase` klucza, dopasowanie `ikonaId`/`typCywilizacji`/`Cywilizacja`.
    fn find_civilization<'a>(
        ctx: &'a SemanticContext<'_>,
        civ_key: &str,
    ) -> Option<&'a CywilizacjeItem2> {
        let key = js_trim(civ_key).to_lowercase();
        ctx.data.file.cywilizacje.iter().find(|row| {
            row.ikona_id.to_lowercase() == key
                || row.typ_cywilizacji.to_lowercase() == key
                || row.cywilizacja.to_lowercase() == key
        })
    }

    /// Web `buildCivMatrixSemanticProfile`.
    pub fn build_civ_matrix_semantic_profile(
        ctx: &SemanticContext<'_>,
        civ_key: &str,
    ) -> SemanticProfile {
        let table = civ_matrix_semantic();
        let parameter_count = ctx.data.param_ids.len();
        let Some(row) = find_civilization(ctx, civ_key) else {
            return SemanticProfile {
                civilization_id: civ_key.to_owned(),
                civilization_name: civ_key.to_owned(),
                difficulty: table.trudnosc.clone(),
                baseline_kind: table.baza_porownania.clone(),
                parameter_count,
                active_count: 0,
                inactive_count: 0,
                cells: Vec::new(),
                blocked_reason_pl: Some(fill(
                    &table.blokada_wejscia.nieznana_cywilizacja,
                    &[("{cywilizacja}", civ_key)],
                )),
            };
        };
        let cells: Vec<SemanticCell> = ctx
            .data
            .param_ids
            .iter()
            .map(|parameter_id| {
                let baseline = ctx.baselines.get(parameter_id);
                let raw_value = row.params.get(parameter_id).map(num_to_f64);
                classify_civ_matrix_cell(
                    ctx,
                    &SemanticCellInput {
                        parameter_id: parameter_id.clone(),
                        civilization_id: row.ikona_id.clone(),
                        civilization_name: Some(row.cywilizacja.clone()),
                        raw_value,
                        baseline_value: baseline.map(|b| b.median),
                        min_value: baseline.map(|b| b.min),
                        max_value: baseline.map(|b| b.max),
                        consumer_status: None,
                        source: if raw_value.is_none() {
                            Some(table.zrodlo_wartosci.brak.clone())
                        } else {
                            Some(table.zrodlo_wartosci.macierz.clone())
                        },
                    },
                )
            })
            .collect();
        let active_count = cells
            .iter()
            .filter(|cell| cell.consumer_status == ConsumerStatus::RealGameplay)
            .count();
        SemanticProfile {
            civilization_id: row.ikona_id.clone(),
            civilization_name: row.cywilizacja.clone(),
            difficulty: table.trudnosc.clone(),
            baseline_kind: table.baza_porownania.clone(),
            parameter_count,
            active_count,
            inactive_count: cells.len() - active_count,
            cells,
            blocked_reason_pl: None,
        }
    }

    /// Web `buildCivMatrixSemanticSnapshot`.
    pub fn build_civ_matrix_semantic_snapshot(ctx: &SemanticContext<'_>) -> SemanticSnapshot {
        let table = civ_matrix_semantic();
        let profiles: Vec<SemanticProfile> = ctx
            .data
            .file
            .cywilizacje
            .iter()
            .map(|row| build_civ_matrix_semantic_profile(ctx, &row.ikona_id))
            .collect();
        let cells: Vec<SemanticCell> = profiles
            .iter()
            .flat_map(|profile| profile.cells.iter().cloned())
            .collect();
        SemanticSnapshot {
            version: table.wersja.clone(),
            difficulty: table.trudnosc.clone(),
            parameter_count: ctx.data.param_ids.len(),
            civilization_count: ctx.data.file.cywilizacje.len(),
            expected_cell_count: ctx.data.param_ids.len() * ctx.data.file.cywilizacje.len(),
            cells,
            profiles,
        }
    }

    /// Web `statusAllowsDefaultVisibility`.
    pub fn status_allows_default_visibility(status: ConsumerStatus) -> bool {
        status == ConsumerStatus::RealGameplay
    }

    /// Web `civMatrixParameterLabelPl`: czesci identyfikatora (po `_`) przez slownik PL, laczone separatorem.
    pub fn civ_matrix_parameter_label_pl(parameter_id: &str) -> String {
        let label = &civ_matrix_semantic().etykieta_parametru;
        parameter_id
            .split('_')
            .map(|part| match label.slownik.get(part) {
                Some(replacement) => replacement.clone(),
                None => match part.strip_suffix(label.sufiks_proc.koncowka.as_str()) {
                    Some(stem) => format!("{stem}{}", label.sufiks_proc.zamiennik),
                    None => part.to_owned(),
                },
            })
            .collect::<Vec<_>>()
            .join(&label.separator_czesci)
    }

    /// Web `civMatrixFormattedValue`.
    pub fn civ_matrix_formatted_value(value: Option<f64>, unit: &str) -> String {
        let fmt = &civ_matrix_semantic().formatowanie;
        let Some(value) = value else {
            return fmt.brak.clone();
        };
        if unit == fmt.jednostka_flaga {
            return if value == 1.0 {
                fmt.flag_tak.clone()
            } else {
                fmt.flag_nie.clone()
            };
        }
        if in_list(&fmt.jednostki_ulamek, unit) {
            return format!(
                "{}% ({})",
                js_to_fixed(value * fmt.mnoznik_procent, fmt.cyfry_procent),
                js_number_to_string(value)
            );
        }
        if js_is_integer(value) {
            return js_number_to_string(value);
        }
        let fixed = js_to_fixed(value, fmt.cyfry_wartosc);
        // Number(value.toFixed(3)): tekst z `toFixed` zawsze parsuje sie jako liczba JS.
        let reparsed = fixed.parse::<f64>().unwrap_or(f64::NAN);
        js_number_to_string(reparsed)
    }

    /// Web `civMatrixIntensityLabel`.
    pub fn civ_matrix_intensity_label(intensity: f64) -> String {
        if intensity == 0.0 {
            "0".to_owned()
        } else if intensity > 0.0 {
            format!("+{}", js_number_to_string(intensity))
        } else {
            js_number_to_string(intensity)
        }
    }
}
