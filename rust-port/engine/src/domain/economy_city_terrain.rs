//! P6.8F partia 8F-P3 - porty helperow tabel plonow terenu z `gra/src/game/economy.ts@91dc998a`
//! (L368-415): `terrainRowToTileYield` (L386-397), `buildTerrainYields` (L399-406),
//! `terrainModifier` (L408-411). Dane: `terrain-yields.json` (wiersze jako `serde_json::Value`,
//! tak jak w webie, bo `Number(row[...] ?? 0)` dziala na surowym JSON).
//!
//! Dowod rownowaznosci: `tests/economy_city_vectors_r3.rs` (wektory z pinu: syntetyczne wiersze
//! dla `terrainRowToTileYield`, dane realne dla `buildTerrainYields` i `terrainModifier`).
//!
//! ZALOZENIA / granice domeny:
//! - `js_number` = JS `Number(x)` dla wartosci skalarnych JSON (liczba, tekst, bool, null/brak).
//!   Obiekty i tablice NIE sa w domenie (JS: `ToPrimitive`); zwracaja NaN.
//! - Tekst: JS `StringToNumber` (trim, pusta = 0, `Infinity`, `0x`/`0o`/`0b` bez znaku, dziesietna
//!   notacja ze znakiem i wykladnikiem). Dokladnosc heksadecymalna: akumulacja w f64 (wartosci < 2^53).

use std::collections::BTreeMap;

use serde_json::Value;

use crate::domain::improvements::TileYield;

/// Web `TERRAIN_NAME_TO_ENUM` (`economy.ts@91dc998a` L375-384): etykieta wiersza -> klucz `TerenBazowy`.
pub fn terrain_enum_key(label: &str) -> Option<&'static str> {
    Some(match label {
        "Łąka" => "laka",
        "Równina" => "rownina",
        "Wzgórza" => "wzgorza",
        "Góry" => "gory",
        "Wybrzeże" => "plytkie_morze",
        "Morze" => "morze",
        "Pustynia" => "pustynia",
        "Polarny" => "polarny",
        _ => return None,
    })
}

/// JS `x ?? y`: `null` i brak pola sa "nullish"; reszta (w tym `0`, `""`, `false`) zostaje.
fn nullish<'a>(row: &'a Value, key: &str) -> Option<&'a Value> {
    row.get(key).filter(|v| !v.is_null())
}

/// JS `Number(v)` dla skalara JSON. `None` = `undefined` (brak pola) traktowany jak `NaN` tylko
/// gdy wywolujacy go tak chce; tu `None` to brak wartosci i daje NaN (zgodnie z `Number(undefined)`).
pub fn js_number(v: Option<&Value>) -> f64 {
    match v {
        None | Some(Value::Null) => f64::NAN,
        Some(Value::Bool(b)) => {
            if *b {
                1.0
            } else {
                0.0
            }
        }
        Some(Value::Number(n)) => n.as_f64().unwrap_or(f64::NAN),
        Some(Value::String(s)) => js_number_from_str(s),
        Some(_) => f64::NAN,
    }
}

/// Wartosc `x ?? 0` w web: brak/`null` -> `0`, potem `Number(...)`.
fn number_or_zero(v: Option<&Value>) -> f64 {
    match v {
        None | Some(Value::Null) => 0.0,
        other => js_number(other),
    }
}

/// JS `StringToNumber` dla tekstu (zakres w naglowku modulu).
pub fn js_number_from_str(s: &str) -> f64 {
    let t = s.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
    if t.is_empty() {
        return 0.0;
    }
    match t {
        "Infinity" | "+Infinity" => return f64::INFINITY,
        "-Infinity" => return f64::NEG_INFINITY,
        _ => {}
    }
    for (prefix, radix) in [
        ("0x", 16),
        ("0X", 16),
        ("0o", 8),
        ("0O", 8),
        ("0b", 2),
        ("0B", 2),
    ] {
        if let Some(rest) = t.strip_prefix(prefix) {
            return parse_radix(rest, radix);
        }
    }
    if is_decimal_literal(t) {
        t.parse::<f64>().unwrap_or(f64::NAN)
    } else {
        f64::NAN
    }
}

fn parse_radix(digits: &str, radix: u32) -> f64 {
    if digits.is_empty() {
        return f64::NAN;
    }
    let mut acc = 0.0_f64;
    for c in digits.chars() {
        match c.to_digit(radix) {
            Some(d) => acc = acc * f64::from(radix) + f64::from(d),
            None => return f64::NAN,
        }
    }
    acc
}

/// `[+-]? (digits ['.' digits?] | '.' digits) ([eE] [+-]? digits)?` - pelne dopasowanie.
fn is_decimal_literal(t: &str) -> bool {
    let b = t.as_bytes();
    let mut i = 0;
    if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
        i += 1;
    }
    let mut digits = 0;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
        digits += 1;
    }
    if i < b.len() && b[i] == b'.' {
        i += 1;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
            digits += 1;
        }
    }
    if digits == 0 {
        return false;
    }
    if i < b.len() && (b[i] == b'e' || b[i] == b'E') {
        i += 1;
        if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
            i += 1;
        }
        let mut exp_digits = 0;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
            exp_digits += 1;
        }
        if exp_digits == 0 {
            return false;
        }
    }
    i == b.len()
}

/// Web `terrainRowToTileYield(row)` (L386-397). Kolumny: `Żywność`, `Praca`, `Podatek ?? Handel`,
/// `Drewno`, `Kamień`, `Glina`; `ruda` i `ruda_zelaza` zawsze `0`.
pub fn terrain_row_to_tile_yield(row: &Value) -> TileYield {
    let handel = nullish(row, "Podatek").or_else(|| nullish(row, "Handel"));
    TileYield {
        zywnosc: number_or_zero(nullish(row, "Żywność")),
        praca: number_or_zero(nullish(row, "Praca")),
        handel: number_or_zero(handel),
        drewno: number_or_zero(nullish(row, "Drewno")),
        kamien: number_or_zero(nullish(row, "Kamień")),
        glina: number_or_zero(nullish(row, "Glina")),
        ruda: 0.0,
        ruda_zelaza: 0.0,
    }
}

/// Web `buildTerrainYields()` (L399-406) na wierszach `terrain_types`. Wiersz z nieznana etykieta
/// jest pomijany; przy duplikacie etykiety wygrywa ostatni (jak przypisanie `out[key] = ...`).
pub fn build_terrain_yields(terrain_types: &[Value]) -> BTreeMap<&'static str, TileYield> {
    let mut out = BTreeMap::new();
    for row in terrain_types {
        let key = row
            .get("Teren")
            .and_then(Value::as_str)
            .and_then(terrain_enum_key);
        if let Some(key) = key {
            out.insert(key, terrain_row_to_tile_yield(row));
        }
    }
    out
}

/// Web `terrainModifier(name)` (L408-411): pierwszy wiersz `terrain_modifiers` o `Modyfikator === name`,
/// brak = `ZERO_YIELD` (wszystko 0).
pub fn terrain_modifier(terrain_modifiers: &[Value], name: &str) -> TileYield {
    terrain_modifiers
        .iter()
        .find(|m| m.get("Modyfikator").and_then(Value::as_str) == Some(name))
        .map(terrain_row_to_tile_yield)
        .unwrap_or(TileYield {
            zywnosc: 0.0,
            praca: 0.0,
            handel: 0.0,
            drewno: 0.0,
            kamien: 0.0,
            glina: 0.0,
            ruda: 0.0,
            ruda_zelaza: 0.0,
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn js_number_from_str_edges() {
        assert_eq!(js_number_from_str(""), 0.0);
        assert_eq!(js_number_from_str("  \t "), 0.0);
        assert_eq!(js_number_from_str(" 4 ").to_bits(), 4.0_f64.to_bits());
        assert!(js_number_from_str("abc").is_nan());
        assert_eq!(js_number_from_str("0x1A"), 26.0);
        assert!(js_number_from_str("-0x1A").is_nan());
        assert_eq!(js_number_from_str("5.").to_bits(), 5.0_f64.to_bits());
        assert_eq!(js_number_from_str(".5"), 0.5);
        assert!(js_number_from_str("1e").is_nan());
        assert!(js_number_from_str("+").is_nan());
        assert!(js_number_from_str("inf").is_nan());
        assert_eq!(js_number_from_str("-Infinity"), f64::NEG_INFINITY);
        assert_eq!(js_number_from_str("-0").to_bits(), (-0.0_f64).to_bits());
    }

    #[test]
    fn row_nullish_falls_back_to_handel_and_zero() {
        let y = terrain_row_to_tile_yield(&json!({"Podatek": null, "Handel": 4, "Glina": null}));
        assert_eq!(y.handel, 4.0);
        assert_eq!(y.glina, 0.0);
        let z = terrain_row_to_tile_yield(&json!({}));
        assert_eq!(z.zywnosc, 0.0);
    }

    #[test]
    fn build_skips_unknown_label_and_last_duplicate_wins() {
        let rows = vec![
            json!({"Teren": "Łąka", "Żywność": 1}),
            json!({"Teren": "Nieznany", "Żywność": 9}),
            json!({"Teren": "Łąka", "Żywność": 3}),
        ];
        let m = build_terrain_yields(&rows);
        assert_eq!(m.len(), 1);
        assert_eq!(m["laka"].zywnosc, 3.0);
    }
}
