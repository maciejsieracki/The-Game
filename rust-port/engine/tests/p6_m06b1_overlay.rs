//! P6.M06B1 - nakladka (overlay) na heksach wodnych (runda 3, zarzut FC 1).
//!
//! Stare wektory mialy heksy wodne WYLACZNIE z nakladka `brak`, wiec resety nakladki w kodzie
//! (`clear_hex_to_laka_with_river` w purge/trim, reset w pierscieniu (b) thicken, reset w flatten)
//! nie byly obserwowalne. Nowe przypadki (`*-ov-*` w `web-vectors.json`, dopisane NA KONCU kazdej
//! kategorii; prefiks starych wektorow sprawdza `check-prefix-m06b1-r3.py`) maja nakladke `las` na
//! heksach wodnych w wejsciu. Ponizsze testy:
//!  (1) sprawdzaja, ze przypadki z nakladka na wodzie sa w zbiorze (per kategoria);
//!  (2) sprawdzaja, ze WEB na tych wektorach ZMIENIA nakladke heksa wodnego (las -> brak) razem ze zmiana
//!      terenu - czyli reset jest obserwowalny. Pelne porownanie stanu (w tym nakladki) z kodem Rust robia
//!      testy `p6_m06b1_coast`, ktore obejmuja te same kategorie; mutanty Q (purge/trim), L (flatten),
//!      N (pierscien thicken) musza byc zabite przez te porownania.

#[path = "p6_m06b1_vectors/common.rs"]
mod common;

use common::{cases, map_rows, s};

fn is_water(name: &str) -> bool {
    name == "morze" || name == "plytkie_morze"
}

/// (liczba przypadkow `*-ov-*`, liczba heksow wodnych z `las` w wejsciu, ktore web zmienil na `brak` i teren)
fn overlay_reset_stats(kind: &str) -> (usize, usize) {
    let mut ov_cases = 0usize;
    let mut resets = 0usize;
    for c in cases(kind) {
        if !s(&c["id"]).contains("-ov-") {
            continue;
        }
        ov_cases += 1;
        let mi = c["mi"].as_u64().expect("mi") as usize;
        let input = map_rows(mi);
        let output = c["output"]["state"].as_array().expect("stan wyjsciowy");
        assert_eq!(input.len(), output.len(), "{kind}: kolejnosc/liczba heksow");
        for (inp, out) in input.iter().zip(output.iter()) {
            assert_eq!(
                s(&inp[0]),
                s(&out[0]),
                "{kind}: klucz w tej samej kolejnosci"
            );
            if is_water(s(&inp[1]))
                && s(&inp[2]) == "las"
                && s(&out[2]) == "brak"
                && s(&out[1]) != s(&inp[1])
            {
                resets += 1;
            }
        }
    }
    (ov_cases, resets)
}

#[test]
fn overlay_cases_present_in_every_affected_kind() {
    for kind in ["purge", "trim", "flatten", "thicken", "finalize"] {
        let (n, _) = overlay_reset_stats(kind);
        assert!(
            n >= 30,
            "{kind}: za malo przypadkow z nakladka na wodzie: {n}"
        );
    }
}

#[test]
fn overlay_reset_on_water_is_observable_in_web_outputs() {
    // Q: purge/trim (clear_hex_to_laka_with_river), L: flatten, N: pierscien (b) thicken.
    for kind in ["purge", "trim", "flatten", "thicken"] {
        let (_, resets) = overlay_reset_stats(kind);
        assert!(
            resets >= 5,
            "{kind}: web pokazuje za malo resetow nakladki na wodzie: {resets}"
        );
    }
}
