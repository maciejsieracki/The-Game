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

use serde_json::Value;
use std::collections::BTreeMap;

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
    if zaufanie.is_nan() || zaufanie > p.kryzys_prog_zaufania {
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

/// Web: `Math.max` (NaN-propagacja; `max(+0, -0) = +0`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() { b } else { a };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// Web: `Math.min` (NaN-propagacja; `min(+0, -0) = -0`).
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

/// Web: `Math.pow` (`pow(1, NaN)` = NaN, `pow(1, ±Infinity)` = NaN; w Rust `powf` dawalby 1).
fn js_pow(base: f64, exp: f64) -> f64 {
    if exp.is_nan() {
        return f64::NAN;
    }
    if base == 1.0 && exp.is_infinite() {
        return f64::NAN;
    }
    base.powf(exp)
}

/// Web: `TradeBonusP7Params` (`gra/data/diplomacy-tick-params.json`, sekcja `p7`).
#[derive(Debug, Clone, PartialEq)]
pub struct TradeBonusP7Params {
    /// Krok nadwyzki (PN) per numer epoki platacego (dostawcy); klucze = epoki (calkowite).
    pub wymiana_krok_pkt_per_epoka: BTreeMap<i64, f64>,
    /// Mnoznik kroku na kazda epoke ponad najwieksza epoke w tabeli.
    pub wymiana_mnoznik_na_epoke: f64,
    /// Zaufanie za kazdy PELNY krok nadwyzki w turze.
    pub wymiana_zaufanie_na_krok: f64,
    /// Limit bonusu z wymiany na pare na ture.
    pub wymiana_max_per_tura: f64,
    /// Sufit Zaufania: bonus nie podnosi Zaufania powyzej tej wartosci.
    pub wymiana_sufit_zaufania: f64,
    /// Minimalna liczba kolejnych tur dostaw, zanim bonus zacznie dzialac.
    pub wymiana_min_tur_dostaw: f64,
}

/// Web: `TradeBonusInput`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TradeBonusInput {
    /// Wartosc netto na plusie (PN) dostarczona w tej turze.
    pub nadwyzka_pn: f64,
    /// Numer epoki platacego (dostawcy).
    pub epoka: f64,
    /// Aktualne Zaufanie odbiorcy wobec dostawcy.
    pub zaufanie: f64,
    /// Liczba kolejnych tur dostaw (1 = pierwsza tura cyklu).
    pub kolejne_tury_dostaw: f64,
}

/// Web: `krokPktWymiany`. Tabela; powyzej jej najwiekszego klucza -- mnoznik na epoke.
/// Pusta tabela -> `+Infinity` (web: `Number.POSITIVE_INFINITY`).
pub fn krok_pkt_wymiany(epoka: f64, p: &TradeBonusP7Params) -> f64 {
    let (Some((&first_key, _)), Some((&top, &top_val))) = (
        p.wymiana_krok_pkt_per_epoka.iter().next(),
        p.wymiana_krok_pkt_per_epoka.iter().next_back(),
    ) else {
        return f64::INFINITY;
    };
    let e = js_max(first_key as f64, epoka.floor());
    let top_f = top as f64;
    if e <= top_f {
        // e jest calkowite (NaN nie przechodzi porownania i trafia nizej).
        let e_key = e as i64;
        if let Some(&v) = p.wymiana_krok_pkt_per_epoka.get(&e_key) {
            if v > 0.0 {
                return v;
            }
        }
        // web: luka w tabeli -- najblizszy nizszy klucz (`keys.filter(k <= e).pop()`).
        return p
            .wymiana_krok_pkt_per_epoka
            .range(..=e_key)
            .next_back()
            .map(|(_, v)| *v)
            .unwrap_or(top_val);
    }
    top_val * js_pow(p.wymiana_mnoznik_na_epoke, e - top_f)
}

/// Web: `tradeTrustBonusPerTura` (P7). Schodkowo: `floor(nadwyzka / krok) x zaufanieNaKrok`,
/// limit `wymianaMaxPerTura`, przyciete do wolnego miejsca pod sufitem; zero w warunkach brzegowych.
pub fn trade_trust_bonus_per_tura(input: &TradeBonusInput, p: &TradeBonusP7Params) -> f64 {
    if input.nadwyzka_pn.is_nan() || input.nadwyzka_pn <= 0.0 {
        return 0.0;
    }
    if input.kolejne_tury_dostaw < p.wymiana_min_tur_dostaw {
        return 0.0;
    }
    let headroom = p.wymiana_sufit_zaufania - input.zaufanie;
    if headroom.is_nan() || headroom <= 0.0 {
        return 0.0;
    }
    let krok = krok_pkt_wymiany(input.epoka, p);
    let pelne_kroki = (input.nadwyzka_pn / krok).floor();
    let surowy = pelne_kroki * p.wymiana_zaufanie_na_krok;
    js_min(js_min(surowy, p.wymiana_max_per_tura), headroom)
}

/// Web: `parseCrisisCounters`. Nieliczbowe / niefinite / ujemne / zerowe wartosci pomijane;
/// reszta: `floor(v)`. Kolejnosc wejscia (`Object.entries`) dla kluczy nieliczbowo-podobnych.
pub fn parse_crisis_counters(raw: &Value) -> Vec<(String, f64)> {
    let mut out = Vec::new();
    if let Value::Object(map) = raw {
        for (k, v) in map {
            if let Some(n) = v.as_f64() {
                if n.is_finite() && n > 0.0 {
                    out.push((k.clone(), n.floor()));
                }
            }
        }
    }
    out
}

/// Web: `CrisisQueueEntry`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CrisisQueueEntry {
    pub owner_a: i64,
    pub owner_b: i64,
    pub counter: f64,
}

/// Web: `sortCrisisQueue`. Najdluzej na progu pierwsze; remis: nizsze min(owner), potem nizsze max(owner).
/// Nie modyfikuje wejscia.
pub fn sort_crisis_queue(entries: &[CrisisQueueEntry]) -> Vec<CrisisQueueEntry> {
    let mut out = entries.to_vec();
    out.sort_by(|x, y| {
        if y.counter != x.counter {
            // web: `return y.counter - x.counter;` (NaN traktowany jak 0 przez sort)
            let d = y.counter - x.counter;
            return if d < 0.0 {
                std::cmp::Ordering::Less
            } else if d > 0.0 {
                std::cmp::Ordering::Greater
            } else {
                std::cmp::Ordering::Equal
            };
        }
        let xl = x.owner_a.min(x.owner_b);
        let yl = y.owner_a.min(y.owner_b);
        if xl != yl {
            return xl.cmp(&yl);
        }
        x.owner_a.max(x.owner_b).cmp(&y.owner_a.max(y.owner_b))
    });
    out
}

/// Web: `WarPower` -- argument `pickWarDeclarer` (`{ ownerId, power }`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WarPower {
    pub owner_id: i64,
    pub power: f64,
}

/// Web: `pickWarDeclarer`. Silniejsza strona (wieksza potega); przy `power !== power` (takze NaN)
/// wygrywa `b` (`a.power > b.power` falsz); remis: nizsze ownerId. ZALOZENIE (dispatch bez remisu).
pub fn pick_war_declarer(a: WarPower, b: WarPower) -> i64 {
    if a.power != b.power {
        return if a.power > b.power {
            a.owner_id
        } else {
            b.owner_id
        };
    }
    a.owner_id.min(b.owner_id)
}

/// Web: `dobraWolaTurnStep` (P4 r3). Odliczanie przed tickiem AI; `activeThisTurn` = licznik > 0 PRZED odliczeniem.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DobraWolaStep {
    pub active_this_turn: bool,
    pub next: f64,
}

/// Web: `dobraWolaTurnStep`. Niefinite / ujemne / NaN -> 0; ulamki obcinane w dol.
pub fn dobra_wola_turn_step(remaining: f64) -> DobraWolaStep {
    let r = if remaining.is_finite() && remaining > 0.0 {
        remaining.floor()
    } else {
        0.0
    };
    DobraWolaStep {
        active_this_turn: r > 0.0,
        // web: `Math.max(0, r - 1)`
        next: if r - 1.0 > 0.0 { r - 1.0 } else { 0.0 },
    }
}

/// Web: `AiAiOwnerInfo`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiAiOwnerInfo {
    pub is_player: bool,
    pub is_barbarian: bool,
    pub is_city_copy: bool,
    pub eliminated: bool,
    pub city_count: f64,
}

/// Web: `isAiAiEligibleOwner` (P3 r3): bez gracza, barbarzyncow, kopii, eliminowanych; wymaga miast (> 0).
pub fn is_ai_ai_eligible_owner(o: &AiAiOwnerInfo) -> bool {
    !o.is_player && !o.is_barbarian && !o.is_city_copy && !o.eliminated && o.city_count > 0.0
}

/// Web: `aiAiPairs` (P3 r3): wszystkie nieuporzadkowane pary `(i < j)` w kolejnosci wejscia.
pub fn ai_ai_pairs(owners: &[i64]) -> Vec<(i64, i64)> {
    let mut out = Vec::new();
    for i in 0..owners.len() {
        for j in (i + 1)..owners.len() {
            out.push((owners[i], owners[j]));
        }
    }
    out
}
