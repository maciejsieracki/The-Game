//! P6.8H2 partia B: stolica gracza (`society-inputs.ts`) i etykiety (`resource-access.ts`).
//! Wektory ręczne wg kontraktu web (bez pinu bundla — patrz dokument tematu, sekcja BLOKADY).

use civ_engine::domain::resource_access::capital_labels::{
    city_panel_range_deposit_labels, is_player_capital_city, stolica_easy_bonus_active,
    surowiec_key_label, surowiec_label_or_capitalized, zloze_label, CapitalCityView,
};

fn city(id: &str, owner_id: i64) -> CapitalCityView<'_> {
    CapitalCityView { id, owner_id }
}

/// Kolejnosc zakladania: wartosc = numer w tabeli (mniejsza = starsze).
fn order_of(table: &'static [(&'static str, f64)]) -> impl Fn(&str) -> f64 {
    move |id: &str| {
        table
            .iter()
            .find(|(k, _)| *k == id)
            .map_or(f64::NAN, |(_, v)| *v)
    }
}

const ORDERS: &[(&str, f64)] = &[("c1", 1.0), ("c2", 2.0), ("c3", 3.0), ("e1", 1.0)];

#[test]
fn designated_none_falls_back_to_oldest_owner_city() {
    let all = [city("c3", 0), city("c1", 0), city("c2", 0)];
    let ord = order_of(ORDERS);
    assert!(is_player_capital_city(
        city("c1", 0),
        &all,
        None,
        &[0],
        &ord
    ));
    assert!(!is_player_capital_city(
        city("c3", 0),
        &all,
        None,
        &[0],
        &ord
    ));
}

#[test]
fn designated_some_overrides_fallback() {
    let all = [city("c1", 0), city("c2", 0)];
    let ord = order_of(ORDERS);
    assert!(is_player_capital_city(
        city("c2", 0),
        &all,
        Some("c2"),
        &[0],
        &ord
    ));
    assert!(!is_player_capital_city(
        city("c1", 0),
        &all,
        Some("c2"),
        &[0],
        &ord
    ));
    // designated wskazuje miasto spoza listy: nikt nie jest stolica (web: id !== city.id).
    assert!(!is_player_capital_city(
        city("c1", 0),
        &all,
        Some("zzz"),
        &[0],
        &ord
    ));
}

#[test]
fn non_human_owner_is_never_capital() {
    let all = [city("c1", 1)];
    let ord = order_of(ORDERS);
    assert!(!is_player_capital_city(
        city("c1", 1),
        &all,
        None,
        &[0],
        &ord
    ));
    assert!(is_player_capital_city(
        city("c1", 1),
        &all,
        None,
        &[1],
        &ord
    ));
}

#[test]
fn tie_keeps_first_in_array_and_nan_keeps_first() {
    let ord = order_of(ORDERS);
    // e1 i c1 maja ten sam order (1.0): pierwszy w tablicy wygrywa (strict `<`).
    let all = [city("e1", 0), city("c1", 0)];
    assert!(is_player_capital_city(
        city("e1", 0),
        &all,
        None,
        &[0],
        &ord
    ));
    assert!(!is_player_capital_city(
        city("c1", 0),
        &all,
        None,
        &[0],
        &ord
    ));
    // NaN nie jest `<` nigdy: pierwsze miasto wlasciciela zostaje.
    let nan_all = [city("unknown_b", 0), city("unknown_a", 0)];
    let nan_ord = order_of(ORDERS);
    assert!(is_player_capital_city(
        city("unknown_b", 0),
        &nan_all,
        None,
        &[0],
        &nan_ord
    ));
    assert!(!is_player_capital_city(
        city("unknown_a", 0),
        &nan_all,
        None,
        &[0],
        &nan_ord
    ));
}

#[test]
fn turn_bounds_n_minus_1_n_n_plus_1() {
    let all = [city("c1", 0)];
    let ord = order_of(ORDERS);
    let me = city("c1", 0);
    // N-1 / N / N+1 wokol dolnej granicy (1) i gornej (10).
    assert!(!stolica_easy_bonus_active(
        true, 0.0, me, &all, 10.0, None, &ord
    ));
    assert!(stolica_easy_bonus_active(
        true, 1.0, me, &all, 10.0, None, &ord
    ));
    assert!(stolica_easy_bonus_active(
        true, 2.0, me, &all, 10.0, None, &ord
    ));
    assert!(stolica_easy_bonus_active(
        true, 9.0, me, &all, 10.0, None, &ord
    ));
    assert!(stolica_easy_bonus_active(
        true, 10.0, me, &all, 10.0, None, &ord
    ));
    assert!(!stolica_easy_bonus_active(
        true, 11.0, me, &all, 10.0, None, &ord
    ));
    // Ulamki na granicach i niefinityczne wartosci.
    assert!(!stolica_easy_bonus_active(
        true, 0.999, me, &all, 10.0, None, &ord
    ));
    assert!(stolica_easy_bonus_active(
        true, 1.001, me, &all, 10.0, None, &ord
    ));
    assert!(!stolica_easy_bonus_active(
        true, 10.001, me, &all, 10.0, None, &ord
    ));
    assert!(!stolica_easy_bonus_active(
        true,
        f64::NAN,
        me,
        &all,
        10.0,
        None,
        &ord
    ));
    assert!(!stolica_easy_bonus_active(
        true,
        f64::INFINITY,
        me,
        &all,
        10.0,
        None,
        &ord
    ));
    assert!(!stolica_easy_bonus_active(
        true,
        f64::NEG_INFINITY,
        me,
        &all,
        10.0,
        None,
        &ord
    ));
}

#[test]
fn non_easy_difficulty_disables_bonus() {
    let all = [city("c1", 0)];
    let ord = order_of(ORDERS);
    assert!(!stolica_easy_bonus_active(
        false,
        5.0,
        city("c1", 0),
        &all,
        10.0,
        None,
        &ord
    ));
}

#[test]
fn surowiec_labels_full_table() {
    let expected = [
        ("drewno", "Drewno"),
        ("kamien", "Kamień"),
        ("glina", "Glina"),
        ("ruda", "Ruda"),
        ("ruda_zelaza", "Ruda żelaza"),
        ("ruda_cyny", "Ruda cyny"),
        ("zelazo", "Żelazo"),
        ("stal", "Stal"),
        ("bydlo", "Trzoda (krowa/świnia)"),
        ("owce", "Owce"),
        ("lama", "Lama"),
        ("kon", "Koń"),
        ("sol", "Sól"),
        ("braz", "Brąz"),
        ("zloto", "Złoto"),
    ];
    for (key, label) in expected {
        assert_eq!(surowiec_key_label(key), Some(label), "key {key}");
    }
    assert_eq!(surowiec_key_label("Kon"), None);
    assert_eq!(surowiec_key_label(""), None);
}

#[test]
fn surowiec_fallback_capitalizes_and_empty_is_empty() {
    assert_eq!(surowiec_label_or_capitalized("mithril"), "Mithril");
    assert_eq!(surowiec_label_or_capitalized("kon"), "Koń");
    assert_eq!(surowiec_label_or_capitalized(""), "");
}

#[test]
fn zloze_labels_table() {
    assert_eq!(zloze_label("wegiel"), Some("Węgiel"));
    assert_eq!(zloze_label("sol"), Some("Sól"));
    assert_eq!(zloze_label("miedz"), Some("Ruda miedzi"));
    assert_eq!(zloze_label("zelazo"), Some("Ruda żelaza"));
    assert_eq!(zloze_label("stal"), Some("Stal"));
    assert_eq!(zloze_label("zloto"), Some("Złoto"));
    assert_eq!(zloze_label("cyna"), Some("Ruda cyny"));
    assert_eq!(zloze_label("glina"), None);
}

#[test]
fn panel_range_filter_keeps_only_three_and_sorts() {
    let got = city_panel_range_deposit_labels(["Złoto", "Glina", "Sól", "Koń", "Drewno"]);
    assert_eq!(got, vec!["Koń", "Sól", "Złoto"]);
    let none: Vec<String> = city_panel_range_deposit_labels([]);
    assert!(none.is_empty());
}

#[test]
fn stolica_bonus_honours_designated_capital() {
    // Mutant M13: stolica pomijala designated_capital_id (przekazywala None).
    let all = [city("c1", 0), city("c2", 0)];
    let ord = order_of(ORDERS);
    // Wskazana stolica c2: bonus tylko dla c2, nie dla najstarszego c1.
    assert!(stolica_easy_bonus_active(
        true,
        5.0,
        city("c2", 0),
        &all,
        10.0,
        Some("c2"),
        &ord
    ));
    assert!(!stolica_easy_bonus_active(
        true,
        5.0,
        city("c1", 0),
        &all,
        10.0,
        Some("c2"),
        &ord
    ));
    // Brak wskazania: fallback na najstarsze miasto (c1).
    assert!(stolica_easy_bonus_active(
        true,
        5.0,
        city("c1", 0),
        &all,
        10.0,
        None,
        &ord
    ));
}
