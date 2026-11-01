//! P6.8H2 partia B, runda 4 (zarzut FC 1 / Z6): port `gra/src/game/society-inputs.ts:11`
//! `isForeignReligionDominant` wraz z zależnościami `culture-religion.ts`:
//! `leadingReligion` (:673) i `dominantReligion` (:698).
//!
//! Reużyte symbole: `territory::{ReligionState, DominantReligion, DominantStatus}` (typy web
//! `ReligionState` / `DominantReligionResult`). `dominantReligion` nie miał implementacji w Rust
//! (territory.rs:481-488 przyjmowało ją jako parametr `&dyn Fn`); tu jest implementacja, którą
//! można przekazać do `territory` zamiast parametru.
//!
//! ZAŁOŻENIA (luki, nie cicha zmiana):
//! - Z6a: pole `share` z web `DominantReligionResult` nie jest portowane (typ `territory::DominantReligion`
//!   go nie niesie, plik territory.rs poza allowlistą; `isForeignReligionDominant` go nie czyta).
//! - Z6b: porządek kluczy `Object.keys(...).sort()` (UTF-16) = porządek `BTreeMap<String,_>`
//!   (UTF-8 bajtowo); różnią się tylko dla znaków poza BMP vs U+E000..U+FFFF. Wektory z pinu
//!   nie zawierają takich nazw religii.
//! - Z6c: `progDominacjiPct` przyjmowane jako `f64` (web `ReligionParams.progDominacjiPct`);
//!   `NaN` przechodzi przez `clamp` jak w web (`x < lo` / `x > hi` są fałszywe) i daje status `mixed`.

use super::super::territory::{DominantReligion, DominantStatus, ReligionState};

/// Web `clamp(x, lo, hi)` (`culture-religion.ts:154`): `NaN` przechodzi bez zmian.
fn js_clamp(x: f64, lo: f64, hi: f64) -> f64 {
    if x < lo {
        lo
    } else if x > hi {
        hi
    } else {
        x
    }
}

/// Web `totalAdherents` (`culture-religion.ts`, prywatna): suma skończonych wartości > 0.
fn total_adherents(state: &ReligionState) -> f64 {
    state
        .counts
        .values()
        .filter(|v| v.is_finite() && **v > 0.0)
        .sum()
}

/// Web `leadingReligion` (`culture-religion.ts:673`): wiodąca religia i jej liczba, skan w porządku
/// posortowanym po nazwie; przy remisie wygrywa pierwsza (`c > bestCount`, `bestCount` startuje od -1).
fn leading_religion(state: &ReligionState) -> Option<(&str, f64)> {
    let mut best: Option<(&str, f64)> = None;
    for (name, value) in &state.counts {
        let count = if value.is_finite() && *value > 0.0 {
            *value
        } else {
            0.0
        };
        match best {
            Some((_, best_count)) if count <= best_count => {}
            _ => best = Some((name.as_str(), count)),
        }
    }
    best
}

/// Web `dominantReligion` (`culture-religion.ts:698`): religia z udziałem `> progDominacjiPct / 100`
/// (po `clamp` do 0..100). Brak wyznawców = `none`; wyznawcy bez lidera ponad progiem = `mixed`.
pub fn dominant_religion(state: &ReligionState, prog_dominacji_pct: f64) -> DominantReligion {
    let total = total_adherents(state);
    let leader = leading_religion(state);
    let (Some((name, count)), true) = (leader, total > 0.0) else {
        return DominantReligion {
            religion: None,
            status: DominantStatus::None,
        };
    };
    let share = count / total;
    let threshold = js_clamp(prog_dominacji_pct, 0.0, 100.0) / 100.0;
    if share > threshold {
        DominantReligion {
            religion: Some(name.to_owned()),
            status: DominantStatus::Dominant,
        }
    } else {
        DominantReligion {
            religion: None,
            status: DominantStatus::Mixed,
        }
    }
}

/// Web `isForeignReligionDominant` (`society-inputs.ts:11`): czy dominująca religia miasta
/// różni się od religii cywilizacji właściciela. Brak / pusta religia właściciela (`null`,
/// `undefined`, `""`) = każda dominująca religia jest obca.
pub fn is_foreign_religion_dominant(
    city_rel: &ReligionState,
    owner_civ_religion: Option<&str>,
    prog_dominacji_pct: f64,
) -> bool {
    let dom = dominant_religion(city_rel, prog_dominacji_pct);
    if dom.status != DominantStatus::Dominant {
        return false;
    }
    // Web `!dom.religion`: także pusta nazwa religii = brak dominacji obcej.
    let Some(religion) = dom.religion.filter(|r| !r.is_empty()) else {
        return false;
    };
    match owner_civ_religion {
        None | Some("") => true,
        Some(owner) => religion != owner,
    }
}
