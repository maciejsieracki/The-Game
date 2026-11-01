//! P6.8H partia B (8H-P1b/P2): `society-inputs.ts` (stolica gracza) oraz czysta tabela
//! etykiet z `resource-access.ts`. Pod-modul `resource_access`, bez `GameMap`.

// ---------------------------------------------------------------------------------------------
// society-inputs.ts — stolica gracza (`isPlayerCapitalCity`, `stolicaEasyBonusActive`)
// ---------------------------------------------------------------------------------------------

/// Minimalny widok miasta czytany przez web `isPlayerCapitalCity` / `stolicaEasyBonusActive`
/// (`id`, `ownerId`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CapitalCityView<'a> {
    pub id: &'a str,
    pub owner_id: i64,
}

/// Web `isPlayerCapitalCity(city, allCities, designatedCapitalId?, humanOwnerIds=[0])`.
///
/// - `designated_capital_id`: `None` = web `undefined`/`null` (fallback na najstarsze miasto
///   wlasciciela); `Some(id)` = web `designatedCapitalId != null` -> porownanie z `city.id`.
/// - `found_order`: ZAŁOŻENIE — web `cityFoundOrder(id)` (`capital-capture.ts`) nie ma odpowiednika
///   w Rust (`grep -rn 'found_order\|cityFoundOrder' rust-port/engine/src` = brak);
///   kolejnosc zakladania miasta jest wstrzykiwana przez wolajacego.
///
/// Fallback: pierwsze miasto wlasciciela o najmniejszym `found_order`; remis i NaN zachowuja
/// pierwsze napotkane miasto (jak web `!first || order < firstOrder`, `firstOrder = +Infinity`).
pub fn is_player_capital_city(
    city: CapitalCityView<'_>,
    all_cities: &[CapitalCityView<'_>],
    designated_capital_id: Option<&str>,
    human_owner_ids: &[i64],
    found_order: &dyn Fn(&str) -> f64,
) -> bool {
    if !human_owner_ids.contains(&city.owner_id) {
        return false;
    }
    if let Some(designated) = designated_capital_id {
        return designated == city.id;
    }
    let mut first: Option<CapitalCityView<'_>> = None;
    let mut first_order = f64::INFINITY;
    for candidate in all_cities {
        if candidate.owner_id != city.owner_id {
            continue;
        }
        let order = found_order(candidate.id);
        if first.is_none() || order < first_order {
            first = Some(*candidate);
            first_order = order;
        }
    }
    first.is_some_and(|f| f.id == city.id)
}

/// Web `stolicaEasyBonusActive(difficulty, turn, city, allCities, maxTur=10, designatedCapitalId?)`.
/// `is_easy` = web `difficulty === 'easy'`. Tura: `Number.isFinite(turn)` i `1 <= turn <= maxTur`
/// (granice wlaczone; NaN/Infinity -> false). Wlasciciel: literal `[0]` jak w web (brak `humanOwnerIds`).
pub fn stolica_easy_bonus_active(
    is_easy: bool,
    turn: f64,
    city: CapitalCityView<'_>,
    all_cities: &[CapitalCityView<'_>],
    max_tur: f64,
    designated_capital_id: Option<&str>,
    found_order: &dyn Fn(&str) -> f64,
) -> bool {
    if !is_easy {
        return false;
    }
    if !turn.is_finite() || turn < 1.0 || turn > max_tur {
        return false;
    }
    is_player_capital_city(city, all_cities, designated_capital_id, &[0], found_order)
}

// ---------------------------------------------------------------------------------------------
// resource-access.ts — etykiety surowcow (czysta tabela, bez GameMap)
// ---------------------------------------------------------------------------------------------

/// Web `SUROWIEC_KEY_LABEL` (`resource-access.ts`): klucz ASCII -> etykieta panelu.
pub fn surowiec_key_label(key: &str) -> Option<&'static str> {
    Some(match key {
        "drewno" => "Drewno",
        "kamien" => "Kamień",
        "glina" => "Glina",
        "ruda" => "Ruda",
        "ruda_zelaza" => "Ruda żelaza",
        "ruda_cyny" => "Ruda cyny",
        "zelazo" => "Żelazo",
        "stal" => "Stal",
        "bydlo" => "Trzoda (krowa/świnia)",
        "owce" => "Owce",
        "lama" => "Lama",
        "kon" => "Koń",
        "sol" => "Sól",
        "braz" => "Brąz",
        "zloto" => "Złoto",
        _ => return None,
    })
}

/// Web `SUROWIEC_KEY_LABEL[k] ?? (k ? k.charAt(0).toUpperCase() + k.slice(1) : '')`
/// z `labelsForImprovementUnlock`. Pusty klucz -> `""` (web odfiltrowuje `filter(Boolean)`).
/// Uwaga: tu pierwszy `char` zamiast jednostki UTF-16 `charAt(0)` (rozni sie tylko poza BMP).
pub fn surowiec_label_or_capitalized(key: &str) -> String {
    if let Some(label) = surowiec_key_label(key) {
        return label.to_owned();
    }
    let mut chars = key.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
}

/// Web `ZLOZE_LABEL` (`resource-access.ts`): znacznik zloza -> etykieta.
pub fn zloze_label(zloze: &str) -> Option<&'static str> {
    Some(match zloze {
        "wegiel" => "Węgiel",
        "sol" => "Sól",
        "miedz" => "Ruda miedzi",
        "zelazo" => "Ruda żelaza",
        "stal" => "Stal",
        "zloto" => "Złoto",
        "cyna" => "Ruda cyny",
        _ => return None,
    })
}

/// Web `CITY_PANEL_RANGE_DEPOSIT_LABELS` + `filterCityPanelRangeLabels`: z etykiet zostaja tylko
/// `Koń`, `Sól`, `Złoto`; wynik posortowany. Dla tego zamknietego zbioru porzadek bajtowy UTF-8
/// (`Koń` < `Sól` < `Złoto`) = `localeCompare(_, 'pl')`, wiec pelnego collatora nie portujemy.
pub fn city_panel_range_deposit_labels<'a>(
    labels: impl IntoIterator<Item = &'a str>,
) -> Vec<String> {
    const ALLOWED: [&str; 3] = ["Koń", "Sól", "Złoto"];
    let mut out: Vec<String> = labels
        .into_iter()
        .filter(|label| ALLOWED.contains(label))
        .map(str::to_owned)
        .collect();
    out.sort();
    out
}
