//! REPIN-EKONOMIA-B2 (pin webu 91dc998a): odpowiedniki z `gra/src/game/production.ts`
//! dodane w hunkach 3 (`epochNumber` / `newestAvailableSameTypeUnit`, web:190-226).
//!
//! Zalozenia (ZALOZENIE, do weryfikacji przez Evaluatora):
//! * web operuje na obiektach `UnitDef`; Rust przyjmuje plaski widok `UnitRow` z polami
//!   `Jednostka`, `Typ`, `Epoka` (`None` = pole brakujace albo `null`).
//! * zwracany jest indeks w `units` zamiast obiektu (ten sam wiersz, bez kopiowania).
//! * web `Set` kandydatow i porownanie `Jednostka` sa dokladne (bez trim/normalizacji).

use crate::domain::civ_matrix::js_compat::js_trim;

/// Plaski widok wiersza jednostki (pola uzywane przez web `newestAvailableSameTypeUnit`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitRow<'a> {
    /// web `Jednostka`.
    pub jednostka: &'a str,
    /// web `Typ` (`None` = brak; web traktuje jako pusty napis).
    pub typ: Option<&'a str>,
    /// web `Epoka` (`None` = brak / `null`).
    pub epoka: Option<&'a str>,
}

/// web `EPOCH_BY_NAME` + `epochNumber` (production.ts:190-205).
/// Brak / nieznana nazwa epoki = 1 (najwczesniejsza). Klucze ASCII i z diakrytykami.
pub fn epoch_number(epoka: Option<&str>) -> u32 {
    match epoka {
        Some("Kamien") | Some("Kamień") => 1,
        Some("Braz") | Some("Brąz") => 2,
        Some("Zelazo") | Some("Żelazo") => 3,
        _ => 1,
    }
}

/// web `newestAvailableSameTypeUnit` (production.ts:210-226).
///
/// Zwraca indeks w `units` najnowszej epoki (ściśle nowszej niz bieżaca) o tym samym `Typ`
/// (po `trim`), ktorej nazwa jest w `candidate_names`. Remis: wygrywa pierwszy w kolejnosci
/// `units`. Gdy bieżąca jednostka nie istnieje albo ma pusty `Typ` - `None`.
pub fn newest_available_same_type_unit(
    current_unit_name: &str,
    candidate_names: &[&str],
    units: &[UnitRow<'_>],
) -> Option<usize> {
    let current_idx = units
        .iter()
        .position(|u| u.jednostka == current_unit_name)?;
    let current = units[current_idx];
    let current_typ = js_trim(current.typ.unwrap_or(""));
    if current_typ.is_empty() {
        return None;
    }
    let current_epoch = epoch_number(current.epoka);
    let mut best: Option<usize> = None;
    for (idx, unit) in units.iter().enumerate() {
        if !candidate_names.contains(&unit.jednostka) {
            continue;
        }
        if js_trim(unit.typ.unwrap_or("")) != current_typ {
            continue;
        }
        let epoch = epoch_number(unit.epoka);
        if epoch <= current_epoch {
            continue;
        }
        match best {
            None => best = Some(idx),
            Some(b) if epoch > epoch_number(units[b].epoka) => best = Some(idx),
            Some(_) => {}
        }
    }
    best
}
