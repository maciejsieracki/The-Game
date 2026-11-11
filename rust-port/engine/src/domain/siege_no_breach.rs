//! R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1 (czesc a): oblezenie BEZ wylomu -- sufit tur i werdykt.
//!
//! Port czystej czesci `gra/src/battle/battleScene.ts` (web `origin/main` 638e90bea):
//! * [`siege_no_breach_cap`] = `SIEGE_NO_BREACH_MAX_ROUNDS` (`battleScene.ts:1128`):
//!   `Math.max(1, Math.round(Number(x) || FF_MAX_ROUNDS))` (bez min z FF -- to robi werdykt, patrz nizej).
//! * [`round_cap_verdict`] = `_roundCapVerdict` (`battleScene.ts:9440-9456`), bez stanu obiektu.
//!
//! Zasady (web, ABC wlasciciela 2026-11-10): oblezenie z murem/palisada/brama, ktore nie zostalo wylomem
//! (`siegeWallCol >= 0 && !wallEverBreached`), konczy sie REMISEM po sufitcie tur (odparty szturm).
//! Pozostale bitwy: sufit `FF_MAX_ROUNDS` (400), rozstrzygniecie po morale; remis morale -> obronca.
//!
//! ZALOZENIA (do akceptacji, brak w dispatchu lub w kodzie Rust):
//! * Z-NB-1 Wartosc sufitu `oblezenie.bez_wylomu_max_tur` (150) jest czytana z danych `rust-port/engine/data/combat-params.json`
//!   przez [`siege_no_breach_max_rounds_from_data`] (pole `Oblezenie.bez_wylomu_max_tur`, runda 2). Plik Rust nie jest pelna
//!   kopia `gra/data/combat-params.json` (rozjazd poza tym tematem, NIE_ZMIERZONO w tej rundzie).
//! * Z-NB-2 Rust nie ma petli taktycznej tur (`combat.rs::resolve_combat` jest jednorazowe). Ta funkcja jest
//!   czystym predykatem: wywolujacy petli podaje numer tury i stan muru. Podpiecie do petli = osobny temat.
//! * Z-NB-3 Morale: wejscie `atk_morale_ratio` / `def_morale_ratio` to juz policzone srednie stosunki morale armii
//!   (web `_armyMoraleRatio`); to funkcja nie liczy morale.
//!
//! Historia / web: `battleScene.ts` linie 1127-1128, 2504, 9433-9456; test `gra/tools/battle-skip-siege-parity-test.cjs`.

/// Web `FF_MAX_ROUNDS` (sufit bitwy z wylomem / bez oblezenia).
pub const FF_MAX_ROUNDS: i64 = 400;

/// Wartosc `oblezenie.bez_wylomu_max_tur` z danych Rust (`combat-params.json`, pole `Oblezenie.bez_wylomu_max_tur`).
pub fn siege_no_breach_max_rounds_from_data() -> Result<i64, serde_json::Error> {
    Ok(crate::data::units_combat::parse_combat_params()?
        .oblezenie
        .bez_wylomu_max_tur)
}

/// Werdykt sufitu tur.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoundCapVerdict {
    /// Web `winner: 'remis'` (odparty szturm, tylko przy oblezeniu bez wylomu).
    Draw,
    /// Web `winner: 'obronca'` (morale atakujacego <= morale obroncy, bitwa bez oblezenia bez wylomu).
    Defender,
    /// Web `winner: 'atakujacy'`.
    Attacker,
}

/// Web `Math.round` dla skonczonych liczb: zaokraglenie w strone +inf przy polowce (`floor(x + 0.5)`).
fn js_math_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Web `Math.max(1, Math.round(Number(x) || FF_MAX_ROUNDS))` dla konfiguracji `configured`
/// (`None` = brak pola w JSON; `NaN`, `0` i `None` daja `FF_MAX_ROUNDS` jak wyrazenie `||`),
/// BEZ `Math.min(.., FF)`: web wartosc `siegeNoBreachMaxRounds` NIE jest ograniczana tutaj (ZARZUT 2 / runda 2:
/// potwierdzone wektorami z weba). Ograniczenie do FF_MAX_ROUNDS robi dopiero [`round_cap_verdict`] (`battleScene.ts:9448`).
pub fn siege_no_breach_cap(configured: Option<f64>) -> i64 {
    let raw = match configured {
        Some(v) if !v.is_nan() && v != 0.0 => v,
        _ => FF_MAX_ROUNDS as f64,
    };
    let rounded = js_math_round(raw) as i64;
    rounded.max(1)
}

/// Web `_roundCapVerdict` (`battleScene.ts:9440-9456`). `round_no` = web `this.roundNo`.
///
/// * `wall_present` = web `this.siegeWallCol >= 0`.
/// * `wall_ever_breached` = web `this.wallEverBreached`.
/// * `no_breach_cap` = wynik [`siege_no_breach_cap`] (web `this.siegeNoBreachMaxRounds`).
///
/// Zwraca `None`, gdy sufit nie zostal jeszcze osiagniety (web `return null`).
pub fn round_cap_verdict(
    round_no: i64,
    wall_present: bool,
    wall_ever_breached: bool,
    no_breach_cap: i64,
    atk_morale_ratio: f64,
    def_morale_ratio: f64,
) -> Option<RoundCapVerdict> {
    let no_breach = wall_present && !wall_ever_breached;
    if no_breach {
        let cap = no_breach_cap.min(FF_MAX_ROUNDS);
        if round_no < cap {
            return None;
        }
        return Some(RoundCapVerdict::Draw);
    }
    if round_no < FF_MAX_ROUNDS {
        return None;
    }
    if atk_morale_ratio <= def_morale_ratio {
        Some(RoundCapVerdict::Defender)
    } else {
        Some(RoundCapVerdict::Attacker)
    }
}
