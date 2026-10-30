//! P6.8F partia 8F-P2 - port `loadEconParams` z `gra/src/game/economy.ts@91dc998a` (L198-244).
//!
//! Web: `loadEconParams(raw, difficulty)` czyta `raw.ekonomia_miasta`, `raw.budynki`, `raw.globalne`
//! (`?? {}`), a dla kazdego klucza wiersz `group[key]` i wartosc `row[difficulty]`. Wartosc uzywa
//! sie tylko, gdy jest `typeof number` i `Number.isFinite`; inaczej fallback domyslny.
//!
//! Zakres wejscia (`raw` z JSON econ-params.json): obiekt, albo cokolwiek innego (wtedy wszystkie
//! grupy = `{}` i wszystkie fallbacki). Wiersz nie-obiekt (liczba, tekst, tablica, null) = brak wartosci.
//!
//! Dowod rownowaznosci: wektory z pinu, `tests/economy_city_vectors_r3.rs` (400 wektorow).

use serde_json::{Map, Value};

/// Web `EconParams` (`economy.ts@91dc998a` L104-168): 25 pol.
#[derive(Debug, Clone, PartialEq)]
pub struct EconParams {
    pub prog_wzrostu_wspolczynnik: f64,
    pub spichlerz_zachowanie_po_wzroscie: f64,
    pub akwedukt_prog_ludnosci: f64,
    pub spichlerz_prog_ludnosci: f64,
    pub akwedukt_max_ludnosci: f64,
    pub zywnosc_zuzytka_populacja: f64,
    pub zdrowie_modyfikator_wspolczynnik: f64,
    pub korupcja_wspolczynnik_dystansu: f64,
    pub korupcja_wspolczynnik_miast: f64,
    /// Web `korupcjaCap` = `read(em, 'korupcja_cap', 50) / 100` (ulamek).
    pub korupcja_cap: f64,
    pub budynek_mlyn_mnoznik_pracy: f64,
    pub budynek_mlyn_bonus_pracy: f64,
    pub budynek_cegielnia_bonus_pracy: f64,
    pub budynek_targowisko_bonus_handlu: f64,
    pub budynek_biblioteka_bonus_nauki: f64,
    pub budynek_akademia_bonus_nauki: f64,
    pub budynek_garncarnia_bonus_zywnosci: f64,
    pub budynek_mennica_mnoznik: f64,
    pub mennica_mnoznik_po_walucie: f64,
    pub waluta_mnoznik: f64,
    pub suwak_handel_nauka_default: f64,
    pub suwak_handel_pieniadz: f64,
    pub suwak_handel_luksus: f64,
    pub suwak_praca_budynki: f64,
    pub suwak_praca_teren: f64,
}

/// Klucz JSON wspolczynnika wzrostu (web `KEY_PROG_WZROSTU`, z polskim znakiem "prog").
const KEY_PROG_WZROSTU: &str = "próg_wzrostu_wspolczynnik";

/// Web `read(group, key, fallback)`: `row = group[key]`, `v = row ? row[d] : undefined`,
/// wynik `v` gdy `typeof v === 'number' && Number.isFinite(v)`, inaczej `fallback`.
fn read(group: Option<&Map<String, Value>>, key: &str, fallback: f64, difficulty: &str) -> f64 {
    group
        .and_then(|g| g.get(key))
        .and_then(Value::as_object)
        .and_then(|row| row.get(difficulty))
        .and_then(Value::as_f64)
        .filter(|v| v.is_finite())
        .unwrap_or(fallback)
}

/// Web `raw.X ?? {}`: brak lub `null` = pusta grupa; obiekt = jego mapa; inny typ = brak kluczy
/// (w JS `group[key]` dla liczby/tekstu/tablicy daje `undefined` dla kluczy parametrow).
fn group_of<'a>(raw: &'a Value, name: &str) -> Option<&'a Map<String, Value>> {
    raw.get(name).and_then(Value::as_object)
}

/// Web `loadEconParams(raw, difficulty)` (`economy.ts@91dc998a` L198-244).
pub fn load_econ_params(raw: &Value, difficulty: &str) -> EconParams {
    let em = group_of(raw, "ekonomia_miasta");
    let bu = group_of(raw, "budynki");
    let gl = group_of(raw, "globalne");
    let d = difficulty;
    EconParams {
        prog_wzrostu_wspolczynnik: read(em, KEY_PROG_WZROSTU, 16.0, d),
        spichlerz_zachowanie_po_wzroscie: read(em, "spichlerz_zachowanie_po_wzroscie", 0.5, d),
        akwedukt_prog_ludnosci: read(em, "akwedukt_prog_ludnosci", 5.0, d),
        spichlerz_prog_ludnosci: read(em, "spichlerz_prog_ludnosci", 8.0, d),
        akwedukt_max_ludnosci: read(em, "akwedukt_max_ludnosci", 12.0, d),
        zywnosc_zuzytka_populacja: read(em, "zywnosc_zuzytka_populacja", 1.0, d),
        zdrowie_modyfikator_wspolczynnik: read(em, "zdrowie_modyfikator_wspolczynnik", 0.05, d),
        korupcja_wspolczynnik_dystansu: read(em, "korupcja_wspolczynnik_dystansu", 2.0, d),
        korupcja_wspolczynnik_miast: read(em, "korupcja_wspolczynnik_miast", 1.0, d),
        korupcja_cap: read(em, "korupcja_cap", 50.0, d) / 100.0,
        budynek_mlyn_mnoznik_pracy: read(bu, "budynek_mlyn_mnoznik_pracy", 2.0, d),
        budynek_mlyn_bonus_pracy: read(bu, "budynek_mlyn_bonus_pracy", 2.0, d),
        budynek_cegielnia_bonus_pracy: read(bu, "budynek_cegielnia_bonus_pracy", 0.25, d),
        budynek_targowisko_bonus_handlu: read(bu, "budynek_targowisko_bonus_handlu", 0.5, d),
        budynek_biblioteka_bonus_nauki: read(bu, "budynek_biblioteka_bonus_nauki", 0.5, d),
        budynek_akademia_bonus_nauki: read(bu, "budynek_akademia_bonus_nauki", 0.10, d),
        budynek_garncarnia_bonus_zywnosci: read(
            bu,
            "budynek_garncarnia_bonus_zywnosci_lokalnie",
            0.10,
            d,
        ),
        budynek_mennica_mnoznik: read(bu, "budynek_mennica_mnoznik", 1.0, d),
        mennica_mnoznik_po_walucie: read(gl, "mennica_mnoznik_po_walucie", 1.5, d),
        waluta_mnoznik: read(bu, "waluta_mnoznik", 2.0, d),
        suwak_handel_nauka_default: read(em, "suwak_handel_nauka_domyslnie", 60.0, d),
        suwak_handel_pieniadz: read(em, "suwak_handel_pieniadz_domyslnie", 30.0, d),
        suwak_handel_luksus: read(em, "suwak_handel_luksus_domyslnie", 10.0, d),
        suwak_praca_budynki: read(em, "suwak_praca_budynki_domyslnie", 70.0, d),
        suwak_praca_teren: read(em, "suwak_praca_teren_domyslnie", 30.0, d),
    }
}
