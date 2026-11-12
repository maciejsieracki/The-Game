//! P6 SIEGE-TAKTYKA ROUNDCAP (K5d, runda 1 Operatora): licznik `roundNo` i sufit tur jako czysta maszyna stanu.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`RoundCapState`] = web `roundNo` (`:2698`, zwiekszane wylacznie w `_beginTurn` `:5636`), `siegeNoBreachMaxRounds`
//!   (`:1128`, wartosc juz policzona przez [`siege_no_breach_cap`]), `siegeWallCol >= 0` i `wallEverBreached`.
//! * [`cap_gate`] = bramka sufitu w `_checkEnd` (`battleScene.ts:10199-10206`): sufit liczony TYLKO gdy obie strony zywe.
//! * [`ff_cap_step`] = sufit przewijania (`_runFastForward` `:9424` + `_ffRoundCapResult` `:9485-9497`): bez bramki zywych.
//! * [`begin_turn`] = poczatek tury (`_beginTurn` `:5635-5636`): sufit PRZED `roundNo++`; przy werdykcie tura sie nie zaczyna.
//!
//! Werdykt liczy istniejaca funkcja [`round_cap_verdict`] (`siege_no_breach.rs`, `_roundCapVerdict` `:9449-9464`).
//! Ten modul nie duplikuje jej logiki.
//!
//! ZAKRES (nie portowano, wlasciciel: K5c/K5f/K5j):
//! * Blok stall (`battleScene.ts:10172-10188`) i reszta `_checkEnd` (`:10208-10240`): zwyciezca z zywych flag, sumy HP.
//!   Gdy jedna strona jest martwa, `cap_gate` zwraca `Continue` (bramka nie stosuje sie), a zakonczenie robi wywolujacy.
//! * Efekty sceny (log, `_finishDraw`, `_showEndScreen`, `_endSurvivors`) i `_updateStallWatch` (`:5634`, K5b).
//! * Petla tur: modul NIE zawiera petli (wymog dispatchu). Wywolujacy podaje stan i flagi przy kazdym kroku.
//! * Morale: wejscia `atk_ratio` / `def_ratio` to juz policzone `_armyMoraleRatio` (web liczy je leniwie;
//!   tu sa jawnym wejsciem; wywolujacy musi podac wartosc po ewentualnym `_startRout`, jak w `:10197`).
//! * KOLEJNOSC w webie (do zlozenia w K5f, nie modelowana tutaj): `_beginTurn` `:5632-5636` wykonuje kolejno
//!   `finished` -> `_battleAwaitingOrders` (wczesne `return`) -> `_updateStallWatch()` (`:5634`) -> `_checkEnd()`
//!   -> `roundNo++`. `_checkEnd` przed sufitem (`:10199`) ma blok stall (`:10172-10188`, moze ustawic `aliveA`/`aliveD`
//!   na `false`) oraz zakonczenia morale/zabojstwem. Gdy ktorakolwiek z tych sciezek konczy bitwe, sufit tury
//!   w webie NIE jest sprawdzany. [`begin_turn`] modeluje wylacznie sufit; wywolujacy (K5f) musi wykonac powyzsze
//!   sprawdzenia PRZED wywolaniem [`begin_turn`] i wywolac je tylko dla zywych obu stron.
//!
//! Zachowanie przy NaN: `round_cap_verdict` i porownania JS (`<=`) daja te same wyniki (NaN -> atakujacy).

use crate::domain::siege_no_breach::{round_cap_verdict, RoundCapVerdict};

/// Stan licznika tur i sufitu. Web: `roundNo`, `siegeNoBreachMaxRounds`, `siegeWallCol`, `wallEverBreached`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RoundCapState {
    /// Web `this.roundNo` (liczba rozpoczetych tur).
    pub round_no: i64,
    /// Web `this.siegeNoBreachMaxRounds` (juz po `Math.max(1, Math.round(...))`, patrz `siege_no_breach_cap`).
    pub no_breach_cap: i64,
    /// Web `this.siegeWallCol >= 0`.
    pub wall_present: bool,
    /// Web `this.wallEverBreached`.
    pub wall_ever_breached: bool,
}

/// Wynik kroku: kontynuacja albo werdykt sufitu tur (web `cap` z `_roundCapVerdict`, niebedacy `null`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoundCapStep {
    /// Web `_roundCapVerdict()` zwrocil `null` (albo bramka nie zastosowala sie).
    Continue,
    /// Web `_roundCapVerdict()` zwrocil obiekt. Remis -> `_finishDraw`; obronca/atakujacy -> zwyciezca.
    Finish(RoundCapVerdict),
}

/// Web `_checkEnd` `battleScene.ts:10199-10206`: sufit tur tylko, gdy obie strony zywe.
///
/// `atk_ratio` / `def_ratio` = web `_armyMoraleRatio('atk' | 'def')`. Gdy `alive_a` lub `alive_d` jest `false`,
/// zwraca `Continue` (zakonczenie innymi warunkami jest poza tym modulem).
pub fn cap_gate(
    state: &RoundCapState,
    alive_a: bool,
    alive_d: bool,
    atk_ratio: f64,
    def_ratio: f64,
) -> RoundCapStep {
    if !(alive_a && alive_d) {
        return RoundCapStep::Continue;
    }
    ff_cap_step(state, atk_ratio, def_ratio)
}

/// Web `_runFastForward` `:9424` + `_ffRoundCapResult` `:9485-9497`: sufit przewijania BEZ bramki zywych.
///
/// Ta sama funkcja werdyktu co [`cap_gate`] (`round_cap_verdict`), inna bramka wejscia: web w przewijaniu
/// sprawdza werdykt przed kazdym krokiem bez warunku `aliveA && aliveD`.
pub fn ff_cap_step(state: &RoundCapState, atk_ratio: f64, def_ratio: f64) -> RoundCapStep {
    match round_cap_verdict(
        state.round_no,
        state.wall_present,
        state.wall_ever_breached,
        state.no_breach_cap,
        atk_ratio,
        def_ratio,
    ) {
        Some(v) => RoundCapStep::Finish(v),
        None => RoundCapStep::Continue,
    }
}

/// Web `_beginTurn` `battleScene.ts:5635-5636`: `if (this._checkEnd()) return; this.roundNo++;`, ograniczone do sufitu.
///
/// Wywolujacy MUSI podac obie strony zywe (`alive_a && alive_d`). Przy `Finish` licznik NIE rosnie (web `return`
/// przed `roundNo++`). Przy `Continue` licznik rosnie o 1.
///
/// NIE modeluje wczesnych `return` z `_beginTurn` (`finished`, `_battleAwaitingOrders`, `:5632-5633`) ani
/// `_updateStallWatch` (`:5634`) i bloku stall w `_checkEnd` (`:10172-10188`): wszystkie sa przed sufitem w webie.
/// Wywolujacy (K5f) sprawdza je sam i wola tę funkcje tylko wtedy, gdy bitwa trwa i obie strony sa zywe.
pub fn begin_turn(
    state: &RoundCapState,
    atk_ratio: f64,
    def_ratio: f64,
) -> (RoundCapState, RoundCapStep) {
    match cap_gate(state, true, true, atk_ratio, def_ratio) {
        RoundCapStep::Finish(v) => (*state, RoundCapStep::Finish(v)),
        RoundCapStep::Continue => {
            let next = RoundCapState {
                round_no: state.round_no + 1,
                ..*state
            };
            (next, RoundCapStep::Continue)
        }
    }
}
