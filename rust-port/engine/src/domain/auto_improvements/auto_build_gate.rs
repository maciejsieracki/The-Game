//! REPIN-AUTOIMPROVE (R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1, decyzja orkiestratora (a)): port
//! `gra/src/game/auto-build-gate.ts` (R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1, web `origin/main` 180c08305).
//!
//! Jedna czysta bramka "automatyzacja budowy" DLA GRACZA (ludzkich foteli): auto-ulepszenia terenu
//! (`pickAutoImprovements` na EOT gracza) i auto-budowa budynkow. Opcja `autoBuildEnabled` jest DOMYSLNIE
//! WYLACZONA (nowa gra i zapisy bez pola). AI / panstwa-miasta / barbarzyncy NIE sa dotkniete (zawsze buduja).
//! Wyłączenie NIE kasuje trybow zapisanych w miescie - silnik ich nie wykonuje, dopoki opcja jest wylaczona.
//!
//! ZALOZENIA: (1) `humanOwnerIds.includes(ownerId)` (SameValueZero) = rownosc `f64` z `NaN == NaN`; identyfikatory
//! to liczby calkowite w webie, `f64` zachowuje semantyke `includes` takze dla wartosci spoza zakresu `i64`;
//! (2) `unknown` webu to `Option<&serde_json::Value>` (`None` = `undefined`). Produkcyjny wywolujacy
//! `pick_auto_improvements` (kto sprawdza te bramke) jest poza zakresem (dlug P7) - tu tylko czysta bramka.

use serde_json::Value;

/// Web `AUTO_BUILD_ENABLED_DEFAULT`: wartosc domyslna opcji (nowa gra, zapis bez pola).
pub const AUTO_BUILD_ENABLED_DEFAULT: bool = false;

/// Web `AUTO_BUILD_DISABLED_HINT`: podpowiedz UI dla zablokowanych kontrolek auto.
pub const AUTO_BUILD_DISABLED_HINT: &str = "Włącz automatyzację budowy w Ustawieniach";

/// Web `isHumanSeatOwner`: czy owner jest ludzkim fotelem.
pub fn is_human_seat_owner(owner_id: f64, human_owner_ids: &[f64]) -> bool {
    human_owner_ids
        .iter()
        .any(|h| *h == owner_id || (h.is_nan() && owner_id.is_nan()))
}

/// Web `isAutoBuildAllowedForOwner`: AI (nie-czlowiek) -> zawsze `true`; czlowiek -> wartosc opcji.
pub fn is_auto_build_allowed_for_owner(
    owner_id: f64,
    human_owner_ids: &[f64],
    auto_build_enabled: bool,
) -> bool {
    if !is_human_seat_owner(owner_id, human_owner_ids) {
        return true;
    }
    auto_build_enabled
}

/// Web `autoBuildFromSaveMeta`: odczyt z meta zapisu; brak pola / nie-boolean = wylaczona (`raw === true`).
pub fn auto_build_from_save_meta(raw: Option<&Value>) -> bool {
    matches!(raw, Some(Value::Bool(true)))
}

/// Web `autoBuildFromNewGameParam`: odczyt z parametrow nowej gry; brak pola = domyslnie wylaczona.
pub fn auto_build_from_new_game_param(raw: Option<&Value>) -> bool {
    match raw {
        Some(Value::Bool(b)) => *b,
        _ => AUTO_BUILD_ENABLED_DEFAULT,
    }
}
