//! REPIN-WOJNA-NOWE-C: port `gra/src/game/diplomacy-tick-war-brake.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/diplomacy-tick-war-brake.ts:7 (`DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT`),
//! :12 (`setDiploTickWarBrakeOverride`), :16 (`isDiploTickWarBrakeEnabled`), :20 (`WarBrakeP6Params`),
//! :29 (`TradeBonusP7Params`), :44 (`TradeBonusInput`), :56 (`krokPktWymiany`),
//! :81 (`tradeTrustBonusPerTura`), :92 (`CrisisStep`), :106 (`advanceCrisisCounter`),
//! :121 (`crisisPairKey`), :131 (`parseCrisisCounters`), :140 (`CrisisQueueEntry`),
//! :150 (`sortCrisisQueue`), :164 (`pickWarDeclarer`), :176 (`crisisStepForPair`),
//! :191 (`dobraWolaTurnStep`), :196 (`AiAiOwnerInfo`), :205 (`isAiAiEligibleOwner`),
//! :210 (`aiAiPairs`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Stan globalny `flagOverride` (web: `let flagOverride`) nie istnieje w Rust: override podawany
//!   jako argument `Option<bool>` (`None` = brak nadpisania), jak `setArmyConsolidationOverride` w czesci B.
//! - Liczby z webu (`number`) = `f64`, zeby zachowac NaN / Infinity / porownania JS.
//!   `Math.max` / `Math.min` / `Math.pow` (NaN-propagacja, `pow(1, NaN)` = NaN) zapisane w
//!   `js_max`, `js_min`, `js_pow`.
//! - Tabela `wymianaKrokPktPerEpoka` (web: `Record<string, number>`) = `BTreeMap<i64, f64>`: klucze JSON
//!   sa calkowitymi numerami epok (plik danych); klucze niecalkowite / niepoprawne web odfiltrowuje
//!   przez `Number.isFinite`, a wejscie Rust przyjmuje juz przefiltrowane (ZALOZENIE).
//! - Identyfikatory wlascicieli = `i64` (web: `number`, calkowite); klucz pary = `"lo-hi"`.
//! - `parseCrisisCounters` przyjmuje `serde_json::Value` (web: `unknown`), zwraca `Vec<(String, f64)>`
//!   w kolejnosci wejscia (`Object.entries`).

/// Wydanie ROBOCZE (R-WEB-DIPLO-RELEASE-ROBOCZA-Q1): ON domyslnie.
pub const DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT: bool = true;

/// Web: `isDiploTickWarBrakeEnabled` (bez stanu globalnego: `None` = brak override).
pub fn is_diplo_tick_war_brake_enabled(flag_override: Option<bool>) -> bool {
    flag_override.unwrap_or(DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT)
}

/// Web: `WarBrakeP6Params` (`gra/data/diplomacy-tick-params.json`, sekcja `p6`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WarBrakeP6Params {
    /// Prog krytyczny Zaufania (wlacznie): Zaufanie <= prog liczy sie jako kryzys.
    pub kryzys_prog_zaufania: f64,
    /// Liczba kolejnych tur kryzysu, po ktorych strona silniejsza wypowiada wojne.
    pub kryzys_tur_do_wojny: f64,
    /// Ile tur przed wojna gracz dostaje ostrzezenie.
    pub kryzys_ostrzezenie_tur_przed: f64,
}

/// Web: `CrisisStep`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CrisisStep {
    /// Nowa wartosc licznika kryzysu.
    pub counter: f64,
    /// true, gdy licznik >= N - ostrzezenieTurPrzed.
    pub warning_active: bool,
    /// true, gdy licznik >= N (wojna po sprawdzeniu R1/R2).
    pub war_trigger_ready: bool,
}

/// Web: `advanceCrisisCounter`. Licznik rosnie, gdy Zaufanie <= prog, zeruje sie, gdy Zaufanie > prog.
pub fn advance_crisis_counter(
    prev_counter: f64,
    zaufanie: f64,
    p: &WarBrakeP6Params,
) -> CrisisStep {
    let prev = if prev_counter.is_finite() && prev_counter > 0.0 {
        prev_counter.floor()
    } else {
        0.0
    };
    if !(zaufanie <= p.kryzys_prog_zaufania) {
        return CrisisStep {
            counter: 0.0,
            warning_active: false,
            war_trigger_ready: false,
        };
    }
    let counter = prev + 1.0;
    let warn_at = p.kryzys_tur_do_wojny - p.kryzys_ostrzezenie_tur_przed;
    CrisisStep {
        counter,
        warning_active: counter >= warn_at,
        war_trigger_ready: counter >= p.kryzys_tur_do_wojny,
    }
}

/// Web: `crisisStepForPair` (r3). Para juz w wojnie: licznik 0, brak kryzysu.
pub fn crisis_step_for_pair(
    prev_counter: f64,
    zaufanie: f64,
    at_war: bool,
    p: &WarBrakeP6Params,
) -> CrisisStep {
    if at_war {
        return CrisisStep {
            counter: 0.0,
            warning_active: false,
            war_trigger_ready: false,
        };
    }
    advance_crisis_counter(prev_counter, zaufanie, p)
}

/// Web: `crisisPairKey`. Klucz pary niezalezny od kolejnosci wlascicieli: `"lo-hi"`.
pub fn crisis_pair_key(a: i64, b: i64) -> String {
    format!("{}-{}", a.min(b), a.max(b))
}
