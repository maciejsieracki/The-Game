//! P6 SIEGE-TAKTYKA ENDCHECK (#217, runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-ENDCHECK-Q1):
//! czyste rdzenie watchdoga patu i kolejnosci konca bitwy.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`update_stall_watch`] = rdzen `_updateStallWatch` (`battleScene.ts:5568-5581`). Stan (`_stallSig`, `_stallTurns`,
//!   `_stalled`) jest jawnym wejsciem/wyjsciem zamiast pol obiektu. Stala [`STALL_TURN_LIMIT`] = `battleScene.ts:1119`.
//! * [`stall_pat_loser`] = gałąz PAT bez oblezenia (`battleScene.ts:10178-10182`): `ratioA <= ratioD` -> atakujacy przegrywa
//!   (`aliveA = false`), inaczej obronca (`aliveD = false`).
//! * [`end_check_order`] = zlozenie krokow `_checkEnd` (`battleScene.ts:10172-10220`) w jedna funkcje czysta, w kolejnosci:
//!   stall (10172-10183, w tym PAT i `siege_no_breach_repels_attack`) -> morale zalamane (10189-10196) ->
//!   sufit tur `_roundCapVerdict` (10197-10206) -> rozstrzygniecie (10208-10220).
//!
//! WYMOG (zarzut 3 audytu R1, dispatch kryterium 2): `siege_no_breach_repels_attack` jest stosowane WYLACZNIE wewnatrz
//! bloku `stalled && alive_a && alive_d` (wejsciowe flagi zycia, jak w webie: blok jest wejsciem warunkowym).
//! Test `stalled=false` znajduje sie w `tests/p6_siege_tactics_endcheck.rs`.
//!
//! Nie portowano (efekty sceny, poza funkcjami): logi (`this.log.push`), `_startRout` (rozbicie dowodcow, wpływ na morale
//! wejscia `ratio_*_at_cap`), `_finishDraw` / `finished` / `_showEndScreen` / `_endWinner` (wywolujacy),
//! `_armyMoraleRatio` i `_battleUnitsForMapExport` (wejscia liczbowe), `if (this.finished) return true` (wywolujacy).

use crate::domain::siege_no_breach::{round_cap_verdict, RoundCapVerdict};
use crate::domain::siege_tactics_end::{battle_winner, siege_no_breach_repels_attack, BattleSide};

/// Web `STALL_TURN_LIMIT` (`battleScene.ts:1119`): tury bez zmiany HP/morale/strat -> stan `stalled`.
pub const STALL_TURN_LIMIT: u32 = 6;

/// Web `ARMY_MORALE_LOSS_THRESHOLD` (`battleScene.ts:1157`).
pub const ARMY_MORALE_LOSS_THRESHOLD: f64 = 0.25;

/// Stan watchdoga patu: web `_stallSig`, `_stallTurns`, `_stalled`.
#[derive(Debug, Clone, PartialEq)]
pub struct StallWatchState {
    pub sig: String,
    pub turns: u32,
    pub stalled: bool,
}

impl Default for StallWatchState {
    /// Web stan poczatkowy: `_stallSig = ''`, `_stallTurns = 0`, `_stalled = false` (`battleScene.ts:2559`).
    fn default() -> Self {
        Self {
            sig: String::new(),
            turns: 0,
            stalled: false,
        }
    }
}

/// Dane jednostki potrzebne watchdogowi: `u.bu.hp`, `u.morale`, `u.dead || u.routed` (web `out`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StallUnit {
    pub hp: f64,
    pub morale: f64,
    pub out: bool,
}

/// Web `Math.max(0, x)` dla jednej wartosci. `NaN` zostaje `NaN`.
fn js_max0(x: f64) -> f64 {
    if x.is_nan() {
        x
    } else {
        x.max(0.0)
    }
}

/// Web `Math.round` dla liczb (`+inf` przy polowce; `NaN`/`Inf` bez zmian).
fn js_math_round(x: f64) -> f64 {
    if !x.is_finite() {
        return x;
    }
    let floor = x.floor();
    if x - floor >= 0.5 {
        floor + 1.0
    } else {
        floor
    }
}

/// Web `String(n)` dla wartosci zaokraglonej przez `Math.round` (calkowitej, `NaN`, `Infinity`).
fn js_number_string(x: f64) -> String {
    if x.is_nan() {
        "NaN".to_string()
    } else if x == f64::INFINITY {
        "Infinity".to_string()
    } else if x == f64::NEG_INFINITY {
        "-Infinity".to_string()
    } else if x == 0.0 {
        // JS: String(-0) === "0".
        "0".to_string()
    } else if x.abs() < 1e21 {
        // Display f64 w Rust = najkrotsze cyfry round-trip dopelnione zerami (jak JS),
        // a NIE dokladne rozwiniecie binarne ({:.0}) - rozbieznosc od 2^53.
        format!("{}", x)
    } else {
        // JS dla |x| >= 1e21 uzywa notacji wykladniczej z "e+NN".
        let s = format!("{:e}", x);
        match s.split_once('e') {
            Some((mantissa, exp)) if !exp.starts_with('-') => format!("{mantissa}e+{exp}"),
            _ => s,
        }
    }
}

/// Web `_updateStallWatch` (`battleScene.ts:5568-5581`) bez `this`.
///
/// * `is_siege` = web `this.siegeWallCol >= 0`. W trybie oblezenia web zwraca od razu: stan bez zmian.
/// * `units` = `[...this.atk, ...this.def]` w tej kolejnosci (sumy HP i morale ida od lewej).
/// * Sygnatura jest porownywana jako lancuch (jak w webie), wiec `"NaN|..."` rowna sie sama soba.
pub fn update_stall_watch(
    state: &StallWatchState,
    is_siege: bool,
    units: &[StallUnit],
) -> StallWatchState {
    if is_siege {
        return state.clone();
    }
    let mut hp = 0.0_f64;
    let mut mor = 0.0_f64;
    let mut out: u64 = 0;
    for u in units {
        hp += js_max0(u.hp);
        mor += js_max0(u.morale);
        if u.out {
            out += 1;
        }
    }
    let sig = format!(
        "{}|{}|{}",
        js_number_string(js_math_round(hp)),
        js_number_string(js_math_round(mor)),
        out
    );
    let mut next = state.clone();
    if sig == state.sig {
        next.turns = state.turns.saturating_add(1);
    } else {
        next.turns = 0;
        next.sig = sig;
    }
    if next.turns >= STALL_TURN_LIMIT {
        next.stalled = true;
    }
    next
}

/// Web `battleScene.ts:10178-10182` (gałąź PAT bez oblezenia): strona przegrywa wg morale.
///
/// `ratio_a <= ratio_d` -> atakujacy (`aliveA = false`), w przeciwnym razie (takze przy `NaN`) obronca (`aliveD = false`).
pub fn stall_pat_loser(ratio_a: f64, ratio_d: f64) -> BattleSide {
    if ratio_a <= ratio_d {
        BattleSide::Attacker
    } else {
        BattleSide::Defender
    }
}

/// Wejscia `_checkEnd` po stronie wartosci. Flagi zycia (`aliveA/aliveD`) i `total_dead` (web: `dead`, bez `routed`)
/// sa liczone przez wywolujacego z jednostek, jak w webie przed blokiem stall.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EndCheckInput<'a> {
    /// Web `this._stalled` po `_updateStallWatch` (`battleScene.ts:5634`).
    pub stalled: bool,
    /// Web `aliveA` / `aliveD` przed krokiem stall (`!dead && !fadingOut && !routed`).
    pub alive_a: bool,
    pub alive_d: bool,
    /// Web `isSiege` = `this.siegeWallCol >= 0`.
    pub is_siege: bool,
    /// Web `this.wallEverBreached`.
    pub wall_ever_breached: bool,
    /// Web `[...this.atk, ...this.def].filter(u => u.dead).length`.
    pub total_dead: usize,
    /// Web `ratioA` / `ratioD` = `_armyMoraleRatio` przed `_startRout` (`battleScene.ts:10164-10165`).
    pub ratio_a: f64,
    pub ratio_d: f64,
    /// Web `_armyMoraleRatio` wywolane w `_roundCapVerdict` (`battleScene.ts:10197`), czyli PO ewentualnym `_startRout`.
    /// Wywolujacy podaje wartosci po rozbiciu dowodcow; gdy `_startRout` nie zmienia morale, rowne `ratio_*`.
    pub ratio_a_at_cap: f64,
    pub ratio_d_at_cap: f64,
    /// Web `this.roundNo`.
    pub round_no: i64,
    /// Web `siegeNoBreachMaxRounds` po `siege_no_breach_cap` (sufit tur bez wylomu).
    pub no_breach_cap: i64,
    /// Web `u.bu.hp` wszystkich jednostek strony atakujacej (martwe tez) i obronnej.
    pub hp_a: &'a [f64],
    pub hp_d: &'a [f64],
}

/// Wynik `_checkEnd` po zlozeniu krokow.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EndCheckOutcome {
    /// Web `return false` (bitwa trwa).
    Continue,
    /// Web `winner === 'remis'` -> `_finishDraw` + `return true` (tylko przy oblezeniu bez wylomu po sufitcie tur).
    Draw,
    /// Web `finished = true` + zwyciezca (`return true`).
    Ended(BattleSide),
}

/// Zlozenie `_checkEnd` (`battleScene.ts:10172-10220`), bez czesci sceny (logi, rozbicie, `finished`).
///
/// Kolejnosc jak w webie:
/// 1. Gdy `stalled && alive_a && alive_d` (wejsciowe flagi): (a) bez oblezenia z martwymi -> PAT
///    ([`stall_pat_loser`]); (b) `siege_no_breach_repels_attack` -> `alive_a = false`. Krok (b) jest WEWNATRZ tego bloku.
/// 2. `ratio < 0.25` i strona zyje -> strona nie zyje (morale zalamane).
/// 3. Gdy oba zyja: `_roundCapVerdict` ([`round_cap_verdict`]); obronca -> `alive_a = false`, atakujacy -> `alive_d = false`,
///    remis -> [`EndCheckOutcome::Draw`].
/// 4. Oba zyja -> [`EndCheckOutcome::Continue`]; inaczej [`battle_winner`].
pub fn end_check_order(input: &EndCheckInput<'_>) -> EndCheckOutcome {
    let mut alive_a = input.alive_a;
    let mut alive_d = input.alive_d;

    // Krok 1 (web 10172-10186). Brama: flagi wejsciowe, nie po PAT.
    if input.stalled && input.alive_a && input.alive_d {
        if !input.is_siege && input.total_dead > 0 {
            match stall_pat_loser(input.ratio_a, input.ratio_d) {
                BattleSide::Attacker => alive_a = false,
                BattleSide::Defender => alive_d = false,
            }
        }
        if siege_no_breach_repels_attack(input.is_siege, input.wall_ever_breached) {
            alive_a = false;
        }
    }

    // Krok 2 (web 10189-10196).
    if input.ratio_a < ARMY_MORALE_LOSS_THRESHOLD && alive_a {
        alive_a = false;
    }
    if input.ratio_d < ARMY_MORALE_LOSS_THRESHOLD && alive_d {
        alive_d = false;
    }

    // Krok 3 (web 10197-10206).
    if alive_a && alive_d {
        match round_cap_verdict(
            input.round_no,
            input.is_siege,
            input.wall_ever_breached,
            input.no_breach_cap,
            input.ratio_a_at_cap,
            input.ratio_d_at_cap,
        ) {
            None => {}
            Some(RoundCapVerdict::Draw) => return EndCheckOutcome::Draw,
            Some(RoundCapVerdict::Defender) => alive_a = false,
            Some(RoundCapVerdict::Attacker) => alive_d = false,
        }
    }

    // Krok 4 (web 10208-10220).
    if alive_a && alive_d {
        return EndCheckOutcome::Continue;
    }
    match battle_winner(alive_a, alive_d, input.hp_a, input.hp_d) {
        Some(winner) => EndCheckOutcome::Ended(winner),
        None => EndCheckOutcome::Continue,
    }
}

#[cfg(test)]
mod tests {
    use super::js_number_string;

    #[test]
    fn js_number_string_zgodne_z_string_js_powyzej_2_53() {
        // Wartosci wyliczone w node (String(x)): najkrotsze cyfry + zera.
        assert_eq!(js_number_string(2f64.powi(60)), "1152921504606847000");
        assert_eq!(js_number_string(9007199254740994.0), "9007199254740994");
        assert_eq!(js_number_string(1e20), "100000000000000000000");
        assert_eq!(js_number_string(-0.0), "0");
        assert_eq!(js_number_string(0.5), "0.5");
        assert_eq!(js_number_string(1e21), "1e+21");
    }
}
