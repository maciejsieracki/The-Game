//! P6.8J-P1 - port `gra/src/game/society-breakdown.ts` (web pin 91dc998a), partia 1 z N.
//!
//! Zakres partii 1 (ta partia): skala % Szczescia/Prawa (`loadSocietyScaleParams`, mianowniki
//! per epoka i per wielkosc miasta, capy), odczyt wierszy `society-params.json`
//! (`pickOsiedlePopBonus`, `pickSociety`, `pickSocietyArray`), progi buntu (`loadRevoltParams`),
//! proporcjonalna linia Kultury/Religii (G4), luksus/podatki (G7), rozpiski
//! `computeHappinessBreakdown` i `computeLawBreakdown`.
//!
//! Poza partia 1 (kolejne partie, patrz run `R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1`): `porPctBand`,
//! `orderEffectsFromPorPct`, `computePorPct`, `orderContributionPct`, `computeOrderPctBreakdown`,
//! `evaluateOrderFromBreakdown`, `updateRevoltGrace`, `revoltWarningMessage`,
//! `applyCivMatrixHappinessModifier` (ten ostatni: patrz zalozenie Z-8J-1 w 01-operator-r1.md).
//!
//! Semantyka JS zachowana jawnie: `Math.round` (`js_round`), `Math.min/max` z zerem ze znakiem
//! (`js_min`/`js_max`), propagacja NaN, `Number.isFinite` (`is_finite`), prawdziwosc (`js_truthy`).
//! Liczby balansowe NIE sa tu literalami poza fallbackami z web (gdy brak wiersza w JSON).

use serde_json::Value;

use crate::domain::types::Difficulty;

mod breakdown;
mod order;

pub use breakdown::*;
pub use order::*;

/// Web `SocietyLine` (`society-breakdown.ts:23`).
#[derive(Debug, Clone, PartialEq)]
pub struct SocietyLine {
    pub id: String,
    pub label: String,
    pub value: f64,
}

/// Web `HappinessPctBreakdown` (`society-breakdown.ts:29`).
#[derive(Debug, Clone, PartialEq)]
pub struct HappinessPctBreakdown {
    pub lines: Vec<SocietyLine>,
    pub netto: f64,
    pub sz_max: f64,
    pub sz_pct: f64,
}

/// Web `LawPctBreakdown` (`society-breakdown.ts:36`).
#[derive(Debug, Clone, PartialEq)]
pub struct LawPctBreakdown {
    pub lines: Vec<SocietyLine>,
    pub netto: f64,
    pub praw_max: f64,
    pub praw_pct: f64,
}

/// Web `RevoltParams` (`society-breakdown.ts:196`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RevoltParams {
    pub critical_por_pct: f64,
    pub grace_turns: f64,
}

/// Web `REVOLT_CRITICAL_POR_PCT` / `REVOLT_GRACE_TURNS` (`society-breakdown.ts:192-193`).
pub const REVOLT_CRITICAL_POR_PCT: f64 = 12.0;
pub const REVOLT_GRACE_TURNS: f64 = 3.0;
/// Web `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts:206`). Juz w `domain::ids` (sentinel -99).
pub const REBEL_FACTION_OWNER_ID: i64 = -99;

/// Web `SZ_PCT_CAP` / `PRAW_PCT_CAP` (fallbacki capow).
pub const SZ_PCT_CAP: f64 = 120.0;
pub const PRAW_PCT_CAP: f64 = 170.0;
/// Web `SZ_MAX_POP_WSP_DEFAULT` / `PRAW_MAX_POP_WSP_DEFAULT` (`society-breakdown.ts:290,297`).
pub const SZ_MAX_POP_WSP_DEFAULT: f64 = 0.04;
pub const PRAW_MAX_POP_WSP_DEFAULT: f64 = 0.04;
/// Web `SZ_MAX_POP_ODNIESIENIA_DEFAULT` / `PRAW_MAX_POP_ODNIESIENIA_DEFAULT` (`:298-299`).
pub const SZ_MAX_POP_ODNIESIENIA_DEFAULT: f64 = 2.0;
pub const PRAW_MAX_POP_ODNIESIENIA_DEFAULT: f64 = 2.0;

/// Fallbacki tablic per epoka (web `SZMAX_BY_ERA_DEFAULT`, `PRAWMAX_BY_ERA_DEFAULT`,
/// `PRAWO_GARNIZON_BUDYNEK_BY_ERA_DEFAULT`, `KULT_RELIG_BY_ERA_DEFAULT`).
const SZMAX_BY_ERA_DEFAULT: [f64; 3] = [30.0, 50.0, 70.0];
const PRAWMAX_BY_ERA_DEFAULT: [f64; 3] = [40.0, 65.0, 85.0];
const PRAWO_GARNIZON_BUDYNEK_BY_ERA_DEFAULT: [f64; 3] = [25.0, 35.0, 47.0];
const KULT_RELIG_BY_ERA_DEFAULT: [f64; 3] = [10.0, 16.0, 23.0];

/// Web: fallback mianownika, gdy tablica pusta lub wpis nieskonczony (`maxFromEraTable`).
const MAX_TABLE_EMPTY_FALLBACK: f64 = 24.0;

/// Web `PODATKI_MIN_DEFAULT` / `PODATKI_MAX_DEFAULT` / `PODATKI_PROG_PCT_DEFAULT`.
const PODATKI_MIN_DEFAULT: f64 = -10.0;
const PODATKI_MAX_DEFAULT: f64 = 10.0;
const PODATKI_PROG_PCT_DEFAULT: f64 = 90.0;

/// Web `DEFAULT_PODZIAL_HANDLU.procentLuksus` (`cities.ts:436`).
const DEFAULT_PROCENT_LUKSUS: f64 = 20.0;

/// Web `SocietyScaleParams` (`society-breakdown.ts:370`).
#[derive(Debug, Clone, PartialEq)]
pub struct SocietyScaleParams {
    pub sz_max_by_era: Vec<f64>,
    pub praw_max_by_era: Vec<f64>,
    pub praw_garnizon_budynek_by_era: Vec<f64>,
    pub kult_relig_by_era: Vec<f64>,
    pub sz_pct_cap: f64,
    pub praw_pct_cap: f64,
    pub sz_max_pop_wsp: f64,
    pub praw_max_pop_wsp: f64,
    pub sz_max_pop_odniesienia: f64,
    pub praw_max_pop_odniesienia: f64,
}

/// Web `FALLBACK_SOCIETY_SCALE` (`society-breakdown.ts:399`).
pub fn fallback_society_scale() -> SocietyScaleParams {
    SocietyScaleParams {
        sz_max_by_era: SZMAX_BY_ERA_DEFAULT.to_vec(),
        praw_max_by_era: PRAWMAX_BY_ERA_DEFAULT.to_vec(),
        praw_garnizon_budynek_by_era: PRAWO_GARNIZON_BUDYNEK_BY_ERA_DEFAULT.to_vec(),
        kult_relig_by_era: KULT_RELIG_BY_ERA_DEFAULT.to_vec(),
        sz_pct_cap: SZ_PCT_CAP,
        praw_pct_cap: PRAW_PCT_CAP,
        sz_max_pop_wsp: SZ_MAX_POP_WSP_DEFAULT,
        praw_max_pop_wsp: PRAW_MAX_POP_WSP_DEFAULT,
        sz_max_pop_odniesienia: SZ_MAX_POP_ODNIESIENIA_DEFAULT,
        praw_max_pop_odniesienia: PRAW_MAX_POP_ODNIESIENIA_DEFAULT,
    }
}

// ---------------------------------------------------------------------------
// Semantyka JS
// ---------------------------------------------------------------------------

/// JS `Math.round`: polowki w strone +inf; wynik zero z ujemnego argumentu = `-0`.
pub fn js_round(x: f64) -> f64 {
    if !x.is_finite() {
        return x;
    }
    let floor = x.floor();
    let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };
    if rounded == 0.0 && (x < 0.0 || (x == 0.0 && x.is_sign_negative())) {
        -0.0
    } else {
        rounded
    }
}

/// JS `Math.max(a, b)`: NaN propaguje; `+0` wygrywa z `-0`.
pub fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_positive() { a } else { b };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// JS `Math.min(a, b)`: NaN propaguje; `-0` wygrywa z `+0`.
pub fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

/// JS prawdziwosc liczby: `0`, `-0` i `NaN` sa falsy.
fn js_truthy(x: f64) -> bool {
    x != 0.0 && !x.is_nan()
}

/// JS `Math.round(x * scale) / scale` (np. 10 -> zaokraglenie do dziesiatych).
fn round_to(x: f64, scale: f64) -> f64 {
    js_round(x * scale) / scale
}

/// JS `Number.isFinite` na `Option<f64>` (brak = nie skonczona).
fn finite_opt(x: Option<f64>) -> Option<f64> {
    x.filter(|v| v.is_finite())
}

/// JS `String(x)` dla liczb uzywanych w etykietach.
pub fn js_num_str(x: f64) -> String {
    if x.is_nan() {
        "NaN".to_string()
    } else if x == f64::INFINITY {
        "Infinity".to_string()
    } else if x == f64::NEG_INFINITY {
        "-Infinity".to_string()
    } else if x == 0.0 {
        "0".to_string()
    } else {
        format!("{x}")
    }
}

// ---------------------------------------------------------------------------
// Odczyt wierszy society-params.json (JS `pickSociety` / `pickSocietyArray` / `pickOsiedlePopBonus`)
// ---------------------------------------------------------------------------

fn sub<'a>(society: Option<&'a Value>, name: &str) -> Option<&'a Value> {
    society.and_then(|s| s.get(name))
}

fn row<'a>(block: Option<&'a Value>, key: &str) -> Option<&'a Value> {
    block.and_then(|b| b.get(key))
}

/// Web `pickSociety`: wartosc dla trudnosci albo `fallback`, gdy brak lub nie skonczona liczba.
pub fn pick_society(
    block: Option<&Value>,
    key: &str,
    difficulty: Difficulty,
    fallback: f64,
) -> f64 {
    row(block, key)
        .and_then(|r| r.get(difficulty.key()))
        .and_then(Value::as_f64)
        .filter(|v| v.is_finite())
        .unwrap_or(fallback)
}

/// Web `pickSocietyArray`: cala tablica dla trudnosci; pusta / z nieliczbowym wpisem -> kopia fallbacku.
pub fn pick_society_array(
    block: Option<&Value>,
    key: &str,
    difficulty: Difficulty,
    fallback: &[f64],
) -> Vec<f64> {
    if let Some(arr) = row(block, key)
        .and_then(|r| r.get(difficulty.key()))
        .and_then(Value::as_array)
    {
        if !arr.is_empty() {
            let vals: Option<Vec<f64>> = arr
                .iter()
                .map(|v| v.as_f64().filter(|x| x.is_finite()))
                .collect();
            if let Some(vals) = vals {
                return vals;
            }
        }
    }
    fallback.to_vec()
}

/// Web `pickOsiedlePopBonus` (D-START-OSIEDLE): bonus malejacy pop 1->4. NaN populacji przechodzi
/// guard w webie i trafia w `legacy` (`arr[NaN]` = undefined), stad osobna galaz.
pub fn pick_osiedle_pop_bonus(
    block: Option<&Value>,
    key: &str,
    pop: f64,
    difficulty: Difficulty,
    legacy_flat_fallback: f64,
) -> f64 {
    if pop.is_nan() {
        return legacy_flat_fallback;
    }
    let p = pop.floor();
    if !(1.0..=4.0).contains(&p) {
        return 0.0;
    }
    let idx = (p as usize) - 1;
    if let Some(v) = row(block, key)
        .and_then(|r| r.get(difficulty.key()))
        .and_then(Value::as_array)
        .and_then(|arr| arr.get(idx))
        .and_then(Value::as_f64)
        .filter(|v| v.is_finite())
    {
        return v;
    }
    legacy_flat_fallback
}

// ---------------------------------------------------------------------------
// Skala % (loadSocietyScaleParams, mianowniki, capy)
// ---------------------------------------------------------------------------

/// Web `loadSocietyScaleParams`: blok `szczescie` i `prawo`; brak klucza -> fallback.
pub fn load_society_scale_params(
    society: Option<&Value>,
    difficulty: Difficulty,
) -> SocietyScaleParams {
    let sz = sub(society, "szczescie");
    let pr = sub(society, "prawo");
    let f = fallback_society_scale();
    SocietyScaleParams {
        sz_max_by_era: pick_society_array(sz, "szczescie_max_epoka", difficulty, &f.sz_max_by_era),
        praw_max_by_era: pick_society_array(pr, "prawo_max_epoka", difficulty, &f.praw_max_by_era),
        praw_garnizon_budynek_by_era: pick_society_array(
            pr,
            "prawo_garnizon_budynek_epoka",
            difficulty,
            &f.praw_garnizon_budynek_by_era,
        ),
        kult_relig_by_era: pick_society_array(
            sz,
            "szczescie_skala_kultura_religia",
            difficulty,
            &f.kult_relig_by_era,
        ),
        sz_pct_cap: pick_society(sz, "szczescie_pct_cap", difficulty, f.sz_pct_cap),
        praw_pct_cap: pick_society(pr, "prawo_pct_cap", difficulty, f.praw_pct_cap),
        sz_max_pop_wsp: pick_society(
            sz,
            "szczescie_max_pop_wspolczynnik",
            difficulty,
            f.sz_max_pop_wsp,
        ),
        praw_max_pop_wsp: pick_society(
            pr,
            "prawo_max_pop_wspolczynnik",
            difficulty,
            f.praw_max_pop_wsp,
        ),
        sz_max_pop_odniesienia: pick_society(
            sz,
            "szczescie_max_pop_odniesienia",
            difficulty,
            f.sz_max_pop_odniesienia,
        ),
        praw_max_pop_odniesienia: pick_society(
            pr,
            "prawo_max_pop_odniesienia",
            difficulty,
            f.praw_max_pop_odniesienia,
        ),
    }
}

/// Web `osiedlePopLabel`: `Osiedle (N mieszk.)`, N = max(1, floor(pop)).
pub fn osiedle_pop_label(pop: f64) -> String {
    let p = js_max(1.0, pop.floor());
    format!("Osiedle ({} mieszk.)", js_num_str(p))
}

/// Web `osiedlePopMax`: prog populacji bonusu osiedla (domyslnie 4), min 1.
pub fn osiedle_pop_max(society: Option<&Value>, difficulty: Difficulty) -> f64 {
    let pr = sub(society, "prawo");
    js_max(
        1.0,
        pick_society(pr, "prawo_bonus_osada_prog", difficulty, 4.0).floor(),
    )
}

/// Web `isOsiedleRevoltImmune`: pop 1..=osiedlePopMax.
pub fn is_osiedle_revolt_immune(
    population: f64,
    society: Option<&Value>,
    difficulty: Difficulty,
) -> bool {
    let p = population.floor();
    if p.is_nan() || p < 1.0 {
        return false;
    }
    p <= osiedle_pop_max(society, difficulty)
}

/// Web `loadRevoltParams` (blok `porzadek`).
pub fn load_revolt_params(society: Option<&Value>, difficulty: Difficulty) -> RevoltParams {
    let block = sub(society, "porzadek");
    RevoltParams {
        critical_por_pct: pick_society(
            block,
            "porzadek_prog_bunt_skrajny_pct",
            difficulty,
            REVOLT_CRITICAL_POR_PCT,
        ),
        grace_turns: pick_society(
            block,
            "porzadek_grace_tur_bunt",
            difficulty,
            REVOLT_GRACE_TURNS,
        ),
    }
}

/// Web `maxFromEraTable`: epoka 1 -> indeks 0; epoka ponad tablice -> ostatni wpis.
fn max_from_era_table(era: f64, table: &[f64]) -> f64 {
    let e = if era.is_finite() {
        js_max(1.0, era.floor())
    } else {
        1.0
    };
    if table.is_empty() {
        return MAX_TABLE_EMPTY_FALLBACK;
    }
    let idx = (js_min(e, table.len() as f64) as usize) - 1;
    let v = table[idx];
    if v.is_finite() {
        v
    } else {
        MAX_TABLE_EMPTY_FALLBACK
    }
}

/// Web `szMaxForEra`.
pub fn sz_max_for_era(era: f64, scale: &SocietyScaleParams) -> f64 {
    max_from_era_table(era, &scale.sz_max_by_era)
}

/// Web `prawMaxForEra`.
pub fn praw_max_for_era(era: f64, scale: &SocietyScaleParams) -> f64 {
    max_from_era_table(era, &scale.praw_max_by_era)
}

/// Web `prawGarnizonBudynekForEra`.
pub fn praw_garnizon_budynek_for_era(era: f64, scale: &SocietyScaleParams) -> f64 {
    max_from_era_table(era, &scale.praw_garnizon_budynek_by_era)
}

/// Web `kultReligScaleForEra` (G4): `x` per epoka; pusta tablica -> pierwszy fallback.
pub fn kult_relig_scale_for_era(era: f64, scale: &SocietyScaleParams) -> f64 {
    let table = &scale.kult_relig_by_era;
    let e = if era.is_finite() {
        js_max(1.0, era.floor())
    } else {
        1.0
    };
    if table.is_empty() {
        return KULT_RELIG_BY_ERA_DEFAULT[0];
    }
    let idx = (js_min(e, table.len() as f64) as usize) - 1;
    let v = table[idx];
    if v.is_finite() {
        v
    } else {
        KULT_RELIG_BY_ERA_DEFAULT[0]
    }
}

/// Web `proporcjonalneSzczescie` (G4): `2·x·udzial − x`, bez zaokraglen.
pub fn proporcjonalne_szczescie(x: f64, udzial_wlasnej: f64) -> f64 {
    let scale = if x.is_finite() { x } else { 0.0 };
    let share = if udzial_wlasnej.is_finite() {
        js_min(1.0, js_max(0.0, udzial_wlasnej))
    } else {
        1.0
    };
    2.0 * scale * share - scale
}

/// Web `ownShareFromSignal`: odwrotnosc `2·udzial − 1`; brak/NaN sygnalu -> 0 -> udzial 0,5.
pub fn own_share_from_signal(signal: Option<f64>) -> f64 {
    let v = finite_opt(signal).unwrap_or(0.0);
    js_min(1.0, js_max(0.0, (v + 1.0) / 2.0))
}

/// Web `popScaleMultiplier` (GOAL 2): `(1 + wsp) ^ max(0, pop − popOdniesienia)`, zaokr. do 2 miejsc.
fn pop_scale_multiplier(population: f64, wsp: f64, pop_odniesienia: f64) -> f64 {
    let pop = if population.is_finite() {
        js_max(0.0, population.floor())
    } else {
        0.0
    };
    let w = if wsp.is_finite() && wsp > 0.0 {
        wsp
    } else {
        0.0
    };
    let reference = if pop_odniesienia.is_finite() {
        js_max(0.0, pop_odniesienia.floor())
    } else {
        0.0
    };
    let excess = js_max(0.0, pop - reference);
    round_to((1.0 + w).powf(excess), 100.0)
}

/// Web `szMaxForCity`: mianownik Szczescia = epoka x wielkosc miasta.
pub fn sz_max_for_city(era: f64, population: f64, scale: &SocietyScaleParams) -> f64 {
    let base = sz_max_for_era(era, scale);
    let mult = pop_scale_multiplier(
        population,
        scale.sz_max_pop_wsp,
        scale.sz_max_pop_odniesienia,
    );
    round_to(base * mult, 100.0)
}

/// Web `prawMaxForCity`: mianownik Prawa = epoka x wielkosc miasta.
pub fn praw_max_for_city(era: f64, population: f64, scale: &SocietyScaleParams) -> f64 {
    let base = praw_max_for_era(era, scale);
    let mult = pop_scale_multiplier(
        population,
        scale.praw_max_pop_wsp,
        scale.praw_max_pop_odniesienia,
    );
    round_to(base * mult, 100.0)
}

/// Web `clampPct`: NaN/Inf -> 0; zaokraglenie do dziesiatych; ograniczenie do [0, cap].
pub fn clamp_pct(x: f64, cap: f64) -> f64 {
    if !x.is_finite() {
        return 0.0;
    }
    js_min(cap, js_max(0.0, round_to(x, 10.0)))
}

/// Web `pctFromNetto`: `100·netto / max` (max <= 0 lub NaN -> 1), potem `clampPct`.
pub fn pct_from_netto(netto: f64, max: f64, cap: f64) -> f64 {
    let m = if max > 0.0 { max } else { 1.0 };
    clamp_pct(100.0 * netto / m, cap)
}

/// Web `luksusHappinessBonus` (G7): podatki liniowo min..max przy 0..prog %.
pub fn luksus_happiness_bonus(
    procent_luksus: f64,
    society: Option<&Value>,
    difficulty: Difficulty,
) -> f64 {
    let sz = sub(society, "szczescie");
    let min = pick_society(sz, "szczescie_podatki_min", difficulty, PODATKI_MIN_DEFAULT);
    let max = pick_society(sz, "szczescie_podatki_max", difficulty, PODATKI_MAX_DEFAULT);
    let prog = pick_society(
        sz,
        "szczescie_podatki_prog_pct",
        difficulty,
        PODATKI_PROG_PCT_DEFAULT,
    );
    let luks = if procent_luksus.is_finite() {
        js_max(0.0, js_min(100.0, procent_luksus))
    } else {
        0.0
    };
    if prog.is_nan() || prog <= 0.0 {
        return max;
    }
    let t = js_min(1.0, luks / prog);
    min + (max - min) * t
}
