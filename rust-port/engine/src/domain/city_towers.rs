//! P6 WIEZE-CITYTOWERS (etap 2A, R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1): czyste helpery wiezyczek miejskich.
//!
//! Port z `gra/src/game/city-towers.ts` (pin `07d2fbd72`, SHA-256 pliku `cc715ed6...`):
//! * [`tower_rows`] = `towerRows`: rzedy kafli muru/palisady ze wiezyczkami (brama pominieta).
//! * [`tower_material_for`] = `towerMaterialFor`: palisada -> drewno, mur -> kamien.
//! * [`era_name`] = `eraName`: numer epoki (1..3, zaokraglony, obciety) -> nazwa epoki.
//! * [`missile_power`] = `missilePower`: `missileAttack` (fallback `Atak dystansowy`).
//! * [`unit_reach`] = `unitReach`: `Zasięg ataku (hex)` (fallback `Zasieg ataku (hex)`), 0 gdy brak.
//! * [`strongest_ranged_unit_for_era`] = `strongestRangedUnitForEra`: najmocniejsza jednostka dystansowa
//!   dostepna w epoce wlasciciela, z cofaniem sie do wczesniejszych epok (ZALOZENIE pina, do akceptacji).
//! * [`tower_range_for`] = `towerRangeFor`: zasieg wiezyczki, nie mniej niz `minRange` (domyslnie 2).
//!
//! Wiersz jednostki to mapa `klucz -> serde_json::Value` (kolumny `units.json` pod nazwami z pina).
//! Brak wiringu do produkcji (wolajacy w produkcji: brak -- etap 2B). `pickTowerTarget` jest juz w
//! `siege_tactics_tower::pick_tower_target` i nie jest tu powtarzany.
//!
//! Zasada: funkcje nie paniku na danych wejsciowych (brak `unwrap`/`expect` na sciezkach danych).

use std::collections::BTreeMap;

use serde_json::Value;

/// Wiersz jednostki z kolumnami `units.json` (klucz = nazwa kolumny z pina).
pub type UnitRow = BTreeMap<String, Value>;

/// Domyslny odstep wiezyczek w kaflach obwodu (pin `DEFAULT_TOWER_SPACING`).
pub const DEFAULT_TOWER_SPACING: i64 = 4;
/// Domyslny minimalny zasieg wiezyczki (pin `DEFAULT_TOWER_MIN_RANGE`).
pub const DEFAULT_TOWER_MIN_RANGE: f64 = 2.0;

/// Material wiezyczki (pin `TowerMaterial`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TowerMaterial {
    /// Palisada (pin `'drewno'`).
    Drewno,
    /// Mur (pin `'kamien'`).
    Kamien,
}

/// Rodzaj obwarowania miasta (pin `CityFortificationKind`, tylko wartosci uzywane przez `towerMaterialFor`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FortificationKind {
    /// Palisada.
    Palisada,
    /// Mur.
    Mur,
    /// Dowolny inny rodzaj (pin zwraca `null`).
    Inny,
}

/// Wejscie [`tower_rows`] (pin `TowerSlotInput`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TowerSlotInput {
    /// Pierwszy rzad (kafel) muru/palisady, wlacznie.
    pub row_lo: i64,
    /// Ostatni rzad (kafel) muru/palisady, wlacznie.
    pub row_hi: i64,
    /// Pierwszy rzad bramy, wlacznie (wiezyczki tam nie stoja).
    pub gate_row_lo: i64,
    /// Ostatni rzad bramy, wlacznie.
    pub gate_row_hi: i64,
    /// Odstep miedzy wiezyczkami; `None` = [`DEFAULT_TOWER_SPACING`] (pin `spacing ?? 4`).
    pub spacing: Option<i64>,
}

/// Pin `towerMaterialFor`: wiezyczki tylko przy obwarowaniu (palisada albo mur).
pub fn tower_material_for(kind: FortificationKind) -> Option<TowerMaterial> {
    match kind {
        FortificationKind::Palisada => Some(TowerMaterial::Drewno),
        FortificationKind::Mur => Some(TowerMaterial::Kamien),
        FortificationKind::Inny => None,
    }
}

/// Pin `towerRows`: co `spacing`-ty kafel obwodu liczony od `row_lo` (pierwsza wiezyczka na `row_lo + 2`,
/// obcieta do `row_hi`). Rzedy bramy pomijane. `spacing` zmienia sie w `max(1, floor(spacing))`.
pub fn tower_rows(inp: &TowerSlotInput) -> Vec<i64> {
    let spacing = inp.spacing.unwrap_or(DEFAULT_TOWER_SPACING).max(1);
    let mut rows = Vec::new();
    // Arytmetyka saturujaca / checked: skrajne wejscia (blisko i64::MIN/MAX) nie paniku w debug
    // i nie zapetlaja petli (przy przepelnieniu kroku konczymy). Dla wejsc z zakresu produkcyjnego wynik
    // jest identyczny z pinem (patrz wektory).
    let first = inp
        .row_lo
        .saturating_add(2_i64.min(inp.row_hi.saturating_sub(inp.row_lo).max(0)));
    let mut r = first;
    while r <= inp.row_hi {
        if !(r >= inp.gate_row_lo && r <= inp.gate_row_hi) {
            rows.push(r);
        }
        match r.checked_add(spacing) {
            Some(next) => r = next,
            None => break,
        }
    }
    rows
}

/// Pin `Math.round` dla skonczonych liczb (polowki w gore, jak JS).
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Pin `eraName`: `Math.max(1, Math.min(3, Math.round(era))) - 1` jako indeks; `None` dla `NaN`.
pub fn era_name(era: f64) -> Option<&'static str> {
    const ERA_NAMES: [&str; 3] = ["Kamień", "Brąz", "Żelazo"];
    if era.is_nan() {
        return None;
    }
    let e = js_round(era).clamp(1.0, 3.0);
    // e jest w 1.0..=3.0 po obcięciu, wiec indeks 0..=2.
    let idx = (e as usize).saturating_sub(1);
    ERA_NAMES.get(idx).copied()
}

/// Odczyt liczby z kolumny (pin `num`): tylko skonczona liczba JSON, inaczej 0.
fn num(v: Option<&Value>) -> f64 {
    match v.and_then(Value::as_f64) {
        Some(x) if x.is_finite() => x,
        _ => 0.0,
    }
}

/// Odczyt tekstu z kolumny (pin `str`): tylko JSON string, inaczej pusty tekst.
fn str_of(v: Option<&Value>) -> &str {
    v.and_then(Value::as_str).unwrap_or("")
}

/// Pin `missilePower`: `u['missileAttack'] ?? u['Atak dystansowy']` (fallback tylko gdy brak lub `null`).
pub fn missile_power(u: &UnitRow) -> f64 {
    let primary = match u.get("missileAttack") {
        Some(Value::Null) | None => u.get("Atak dystansowy"),
        Some(v) => Some(v),
    };
    num(primary)
}

/// Pin `unitReach`: `Zasięg ataku (hex)` (fallback `Zasieg ataku (hex)`, tylko gdy brak lub `null`), 0 gdy brak.
pub fn unit_reach(u: &UnitRow) -> f64 {
    let primary = match u.get("Zasięg ataku (hex)") {
        Some(Value::Null) | None => u.get("Zasieg ataku (hex)"),
        Some(v) => Some(v),
    };
    num(primary)
}

/// Pin `availableIn`: `Dostępna w epokach` (fallback `Epoka`, gdy pusty tekst), lista po `;`.
fn available_in(u: &UnitRow, era: &str) -> bool {
    let list = {
        let a = str_of(u.get("Dostępna w epokach"));
        if a.is_empty() {
            str_of(u.get("Epoka"))
        } else {
            a
        }
    };
    list.split(';').map(str::trim).any(|s| s == era)
}

/// Pin `nationOk`: jednostka bez nacji (`''` lub `—`) pasuje zawsze; narodowa tylko dla swojej nacji.
fn nation_ok(u: &UnitRow, nacja: Option<&str>) -> bool {
    let n = str_of(u.get("Nacja")).trim();
    n.is_empty() || n == "—" || nacja.is_some_and(|x| n == x)
}

/// Pin `CIV_TO_NACJA` (BronzeCiv -> wartosc kolumny `Nacja`); nieznana cywilizacja -> `None`.
fn civ_to_nacja(civ: &str) -> Option<&'static str> {
    match civ {
        "egipt" => Some("Egipt"),
        "sumer" => Some("Sumer"),
        "inka" => Some("Inkowie"),
        "zulu" => Some("Zulu"),
        "asyria" => Some("Asyria"),
        _ => None,
    }
}

/// Pin `strongestRangedUnitForEra`: najmocniejsza jednostka `Rola (linia) = 'Dystans'` z mocą > 0,
/// dostepna w epoce `era` (zaokraglonej, obcietej do 1..3), z cofaniem sie do wczesniejszych epok.
///
/// ZALOZENIE (do akceptacji, implementujemy pin): gdy w epoce nie ma takiej jednostki, bierzemy najlepsza
/// z wczesniejszych epok (pierwsza wstecz, w ktorej cos jest). Remis mocy: dluzszy zasieg; potem kolejnosc
/// w danych (pierwsza wygrywa). Jednostki narodowe liczone tylko dla swojej nacji (`civ`).
///
/// Zwraca referencje do wiersza z `units`; `None` gdy brak kandydata lub `era` to `NaN`.
pub fn strongest_ranged_unit_for_era<'a>(
    units: &'a [UnitRow],
    era: f64,
    civ: Option<&str>,
) -> Option<&'a UnitRow> {
    let nacja = match civ {
        Some(c) if !c.is_empty() => civ_to_nacja(c),
        _ => None,
    };
    let pool: Vec<&UnitRow> = units
        .iter()
        .filter(|u| {
            str_of(u.get("Rola (linia)")) == "Dystans"
                && missile_power(u) > 0.0
                && nation_ok(u, nacja)
        })
        .collect();
    let e0 = era_name_index(era)?;
    let mut e = e0;
    while e >= 1 {
        let name = era_name_for_index(e)?;
        let mut best: Option<&'a UnitRow> = None;
        for u in pool.iter().copied() {
            if !available_in(u, name) {
                continue;
            }
            match best {
                None => best = Some(u),
                Some(b) => {
                    let p = missile_power(u);
                    let bp = missile_power(b);
                    if p > bp || (p == bp && unit_reach(u) > unit_reach(b)) {
                        best = Some(u);
                    }
                }
            }
        }
        if best.is_some() {
            return best;
        }
        e -= 1;
    }
    None
}

/// Numer epoki (1..=3) po zaokragleniu i obcieciu, jak w pinie; `None` dla `NaN`.
fn era_name_index(era: f64) -> Option<i64> {
    if era.is_nan() {
        return None;
    }
    Some(js_round(era).clamp(1.0, 3.0) as i64)
}

/// Nazwa epoki dla numeru 1..=3 (pin `eraName(e)` dla juz obcietego `e`).
fn era_name_for_index(e: i64) -> Option<&'static str> {
    era_name(e as f64)
}

/// Pin `towerRangeFor`: zasieg jednostki (zaokraglony), nie mniej niz `min_range`; bez jednostki zasieg 0 -> `min_range`.
pub fn tower_range_for(unit: Option<&UnitRow>, min_range: f64) -> f64 {
    let base = match unit {
        Some(u) => js_round(unit_reach(u)),
        None => 0.0,
    };
    base.max(min_range)
}
