//! P6 SIEGE-TAKTYKA (#217, runda 1 Operatora): czyste predykaty konca bitwy oblezniczej.
//!
//! Port 1:1 dwoch fragmentow `gra/src/battle/battleScene.ts` (web `07d2fbd72`, plik `gra/src/battle/battleScene.ts`):
//! * [`siege_no_breach_repels_attack`] = warunek `if (isSiege && !this.wallEverBreached)` (`battleScene.ts:10184-10186`):
//!   w oblezeniu bez wylomu atakujacy nie moga dosiegnac obroncow, wiec `aliveA = false`.
//! * [`battle_winner`] = blok rozstrzygniecia po `if (aliveA && aliveD) return false;` (`battleScene.ts:10208-10220`):
//!   jedna strona zyje -> ona wygrywa; oba zginely (mutual elimination) -> wyzsza suma HP (`hpA >= hpD` -> atakujacy).
//!
//! Funkcje nie maja stanu obiektu sceny. Wywolujacy podaje juz policzone flagi `aliveA/aliveD` (w web: `!dead && !fadingOut && !routed`,
//! po regulach morale) oraz wartosci HP jednostek; sumuje je ta funkcja jak web (`Math.max(0, hp)` na jednostke, `reduce` od lewej).
//!
//! Nie portowano (BRAK, poza tym modulem): `_finishDraw` / `_ffRoundCapResult` / `_runFastForward` (stan sceny, rAF, log),
//! `wallEverBreached` (ustawiane w `battleScene.ts:3721, 7647, 7759, 8072`), oraz blok PAT dla bitew bez oblezenia
//! (`battleScene.ts:10178-10182`, morale). Patrz `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`.

use super::siege_tactics_blow::js_max;

/// Strona bitwy zwyciezajaca w web `winner: 'atakujacy' | 'obronca'` (bez `remis`: remis oblezenia jest w `siege_no_breach::round_cap_verdict`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BattleSide {
    Attacker,
    Defender,
}

/// Web `Math.max(0, hp)` dla pojedynczej jednostki. `NaN` zostaje `NaN` (JS: `Math.max(0, NaN) === NaN`).
fn js_max0(hp: f64) -> f64 {
    js_max(0.0, hp)
}

/// Web `units.reduce((s, u) => s + Math.max(0, u.bu.hp), 0)`, sumowane od lewej.
fn sum_hp_clamped(hps: &[f64]) -> f64 {
    hps.iter().fold(0.0_f64, |s, &hp| s + js_max0(hp))
}

/// Web `battleScene.ts:10184-10186`: `if (isSiege && !this.wallEverBreached) aliveA = false`.
///
/// * `is_siege` = web `isSiege` (`this.siegeWallCol >= 0`, `battleScene.ts:10176`).
/// * `wall_ever_breached` = web `this.wallEverBreached`.
///
/// UWAGA (zarzut 3 audytu R1): w webie ten warunek jest ZAGNIEZDZONY w bloku
/// `if (this._stalled && aliveA && aliveD) { ... }` (`battleScene.ts:10172-10186`).
/// Ta funkcja zwraca sam predykat `isSiege && !wallEverBreached`; wywolujacy MUSI
/// zastosowac go tylko wtedy, gdy stall jest aktywny i obie strony zyja (`stalled && alive_a && alive_d`).
/// Bez tego strazy wywolanie zmienia wynik bitwy (np. szturm w toku bez patu).
/// Strazy nie wbudowano tutaj, bo zalezy od stanu sceny (`_stalled`); K3 (`P6-SIEGE-TAKTYKA.md` §4) ma ja zawierac.
pub fn siege_no_breach_repels_attack(is_siege: bool, wall_ever_breached: bool) -> bool {
    is_siege && !wall_ever_breached
}

/// Web `battleScene.ts:10208-10220` (rozstrzygniecie po flagach zycia).
///
/// Zwraca `None`, gdy obie strony zyja (web `return false`, bitwa trwa). W przeciwnym razie zwyciezce.
/// `hp_a` / `hp_d` = `u.bu.hp` wszystkich jednostek danej strony (martwe tez, jak w web `this.atk` / `this.def`).
pub fn battle_winner(
    alive_a: bool,
    alive_d: bool,
    hp_a: &[f64],
    hp_d: &[f64],
) -> Option<BattleSide> {
    if alive_a && alive_d {
        return None;
    }
    if alive_a && !alive_d {
        return Some(BattleSide::Attacker);
    }
    if alive_d && !alive_a {
        return Some(BattleSide::Defender);
    }
    // Mutual elimination (web :10216-10219): porownanie pozostalego HP, remis -> atakujacy.
    let hp_sum_a = sum_hp_clamped(hp_a);
    let hp_sum_d = sum_hp_clamped(hp_d);
    if hp_sum_a >= hp_sum_d {
        Some(BattleSide::Attacker)
    } else {
        Some(BattleSide::Defender)
    }
}

#[cfg(test)]
mod js_max0_zero_sign_tests {
    use super::js_max0;

    /// Zachowanie `Math.max(0, x)` na tym module: `-0` -> `+0`, NaN zachowany, skonczone bez zmian.
    #[test]
    fn js_max0_zero_sign_jak_math_max() {
        assert_eq!(js_max0(-0.0).to_bits(), 0.0_f64.to_bits());
        assert_eq!(js_max0(-3.0).to_bits(), 0.0_f64.to_bits());
        assert_eq!(js_max0(f64::NEG_INFINITY).to_bits(), 0.0_f64.to_bits());
        assert_eq!(js_max0(2.5), 2.5);
        assert!(js_max0(f64::NAN).is_nan());
    }
}
