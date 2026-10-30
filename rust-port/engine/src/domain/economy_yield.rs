//! REPIN-EKONOMIA-D (krok 4b, czesc D, partia D2.1): port mnoznikow Handel->Pieniadz z
//! `gra/src/game/economy.ts` (pin `91dc998a`). Port od zera: w silniku nie istnieje jeszcze
//! odpowiednik `cityYieldPerTurn`; ta partia obejmuje wylacznie czyste funkcje (bez pamieci
//! miasta i bez danych turowych).
//!
//! web: gra/src/game/economy.ts@91dc998a:
//! - `mnoznikHandelPieniadzForCiv` (L704-711) -> [`mnoznik_handel_pieniadz_for_civ`]
//! - `civMatrixMnoznikHandelPieniadzRaw` (L717-728, prywatna) -> [`civ_matrix_mnoznik_handel_pieniadz_raw`]
//! - `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (L738-742) -> [`mnoznik_handel_trudnosc_delta`]
//! - `mnoznikHandelPieniadzForCivByDifficulty` (L753-762) -> [`mnoznik_handel_pieniadz_for_civ_by_difficulty`]
//! - `civEconomyYieldMultipliers` (L781-786) -> [`civ_economy_yield_multipliers`]
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Web `loadCivMatrix()` / `civMatrixParam()` = argument `matrix: &CivMatrixFile` (jak w
//!   `civ_matrix.rs`); wywolujacy podaje [`crate::domain::civ_matrix::load_civ_matrix`] dla danych
//!   wbudowanych. Web `civs` (civs.json) jest IGNOROWANE przez oba mnozniki (zgodnie z wersja 91dc998a),
//!   wiec w sygnaturach nie wystepuje.
//! - Web `fallback = 1` (domyslny parametr) = stala [`MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT`];
//!   wywolujacy podaje wartosc jawnie.
//! - Pusty klucz (`""`) traktowany jak brak klucza (web: `!civKey`).
//! - Surowe zero macierzy jest wartoscia (web: `Number.isFinite`, nie `> 0`); NaN/Infinity = brak.

use crate::data::civilizations::CivMatrixFile;
use crate::domain::civ_matrix::{civ_matrix_param, resolve_row};
use crate::domain::types::Difficulty;

/// Web `mnoznikHandelPieniadzForCiv(..., fallback = 1)`: domyslna wartosc zapasowa.
pub const MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT: f64 = 1.0;

/// Web `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (`economy.ts` L738-742).
pub fn mnoznik_handel_trudnosc_delta(difficulty: Difficulty) -> f64 {
    match difficulty {
        Difficulty::Easy => 0.5,
        Difficulty::Normal => 0.0,
        Difficulty::Hard => -0.5,
    }
}

/// Web `civMatrixMnoznikHandelPieniadzRaw` (prywatna): `None` dla pustego / nieznanego klucza
/// (web: `!civKey` lub brak wiersza z `ikonaId` / `typCywilizacji` / `Cywilizacja`);
/// dla znanej cywilizacji `civMatrixParam(.., 'meta_mnoznik_waluta')` jesli skonczony.
pub fn civ_matrix_mnoznik_handel_pieniadz_raw(
    matrix: &CivMatrixFile,
    civ_key: Option<&str>,
) -> Option<f64> {
    let key = civ_key.filter(|k| !k.is_empty())?;
    resolve_row(matrix, key)?;
    let value = civ_matrix_param(matrix, key, "meta_mnoznik_waluta");
    value.is_finite().then_some(value)
}

/// Web `mnoznikHandelPieniadzForCiv(civKey, civs, fallback)`: wartosc macierzy albo `fallback`.
pub fn mnoznik_handel_pieniadz_for_civ(
    matrix: &CivMatrixFile,
    civ_key: Option<&str>,
    fallback: f64,
) -> f64 {
    civ_matrix_mnoznik_handel_pieniadz_raw(matrix, civ_key).unwrap_or(fallback)
}

/// Web `mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled)`:
/// surowa wartosc macierzy + delta trudnosci; brak wiersza => `fallback_scaled` bez drugiej delty.
pub fn mnoznik_handel_pieniadz_for_civ_by_difficulty(
    matrix: &CivMatrixFile,
    civ_key: Option<&str>,
    difficulty: Difficulty,
    fallback_scaled: f64,
) -> f64 {
    match civ_matrix_mnoznik_handel_pieniadz_raw(matrix, civ_key) {
        None => fallback_scaled,
        Some(raw) => raw + mnoznik_handel_trudnosc_delta(difficulty),
    }
}

/// Wynik web `civEconomyYieldMultipliers` (`{ handel, nauka }`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EconomyYieldMultipliers {
    pub handel: f64,
    pub nauka: f64,
}

/// Web `civEconomyYieldMultipliers(bonusy)`: od wersji 91dc998a zawsze neutralne `{1, 1}`
/// (liczbowe bonusy z civs.json nie sa juz wejsciem konsumenta; argument jest ignorowany).
pub fn civ_economy_yield_multipliers() -> EconomyYieldMultipliers {
    EconomyYieldMultipliers {
        handel: 1.0,
        nauka: 1.0,
    }
}
