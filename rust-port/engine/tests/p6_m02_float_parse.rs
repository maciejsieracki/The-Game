//! P6.M02 - tabela `mapgen-nowa-gra.json` nie moze byc czytana z bledem zaokraglenia:
//! `serde_json` bez `float_roundtrip` potrafi pomylic sie o 1 ulp (wykryte w P6.4), a progi
//! i mnozniki tej tabeli trafiaja do `floor`/`round`/porownan. Test porownuje KAZDA niecalkowita
//! liczbe z parsera typowanego z poprawnie zaokraglonym `str::parse` tokenu z surowego tekstu.

use std::collections::BTreeSet;

use civ_engine::data::derived::{mapgen_nowa_gra, MAPGEN_NOWA_GRA_JSON};

/// Bity `f64` wszystkich tokenow liczbowych tekstu JSON (poza lancuchami).
fn float_tokens(text: &str) -> BTreeSet<u64> {
    fn flush(token: &mut String, out: &mut BTreeSet<u64>) {
        if !token.is_empty() {
            out.insert(token.parse::<f64>().expect("liczba").to_bits());
        }
        token.clear();
    }
    let mut out = BTreeSet::new();
    let mut in_string = false;
    let mut escaped = false;
    let mut token = String::new();
    for c in text.chars() {
        if in_string {
            if escaped {
                escaped = false;
            } else if c == '\\' {
                escaped = true;
            } else if c == '"' {
                in_string = false;
            }
            continue;
        }
        if c == '"' {
            flush(&mut token, &mut out);
            in_string = true;
        } else if c.is_ascii_digit()
            || matches!(c, '.' | '+' | '-')
            || (matches!(c, 'e' | 'E') && !token.is_empty())
        {
            // `e`/`E` tylko wewnatrz liczby (nie w `true`/`false`).
            token.push(c);
        } else {
            flush(&mut token, &mut out);
        }
    }
    flush(&mut token, &mut out);
    out
}

fn collect_floats(value: &serde_json::Value, out: &mut Vec<f64>) {
    match value {
        serde_json::Value::Number(n) if !n.is_i64() && !n.is_u64() => {
            out.push(n.as_f64().expect("f64"));
        }
        serde_json::Value::Array(items) => items.iter().for_each(|v| collect_floats(v, out)),
        serde_json::Value::Object(map) => map.values().for_each(|v| collect_floats(v, out)),
        _ => {}
    }
}

#[test]
fn table_floats_are_read_without_rounding_error() {
    let tokens = float_tokens(MAPGEN_NOWA_GRA_JSON);
    assert!(tokens.len() >= 10, "tabela ma zawierac liczby niecalkowite");
    let value = serde_json::to_value(mapgen_nowa_gra()).expect("serializacja");
    let mut parsed = Vec::new();
    collect_floats(&value, &mut parsed);
    assert!(!parsed.is_empty());
    for f in parsed {
        assert!(
            tokens.contains(&f.to_bits()),
            "serde_json odczytal {f:?} inaczej niz str::parse (blad 1 ulp)"
        );
    }
}
