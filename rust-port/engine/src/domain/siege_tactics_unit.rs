//! P6 SIEGE-TAKTYKA K5a (runda 1 Operatora, R-RUSTPORT-P6-SIEGE-TAKTYKA-K5A-Q1): minimalny model jednostki boju
//! i predykaty zycia / rozbicia dla warstwy petli (K5c, ENDCHECK).
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`CombatUnit`] = pola `RuntimeBattleUnit` potrzebne predykatom: `bu.hp`, `morale`, `dead`, `fadingOut`, `routed`,
//!   `removed`, `acted`, `moveLeft` (interfejs `:1982-2021`, tworzenie `:4543-4569`), plus `neverRout` i `fleeMorale`
//!   (uzywane tylko przez bramke rozbicia [`should_rout`]).
//! * [`alive_power`] = `const alive = (ru) => !ru.dead && !ru.fadingOut && !ru.removed` (`battleScene.ts:5617`),
//!   filtr do `hpWeightedFieldPower` na starcie bitwy.
//! * [`alive_end`] = `aliveA` / `aliveD` z `_checkEnd` (`battleScene.ts:10159-10160`): `!dead && !fadingOut && !routed`.
//!   [`side_alive_end`] = `this.atk.some(...)` / `this.def.some(...)`.
//! * [`total_dead`] = `const totalDead = ... filter(u => u.dead).length` (`_checkEnd`, bez `routed`).
//! * [`is_out`] = `out` (`battleScene.ts:5575` watchdog, `:10263` podsumowanie): `dead || routed`.
//! * [`is_broken`] = flaga `routed` (`battleScene.ts:2016`, ustawiana tylko w `_startRout`). W pinie NIE ma funkcji
//!   o nazwie `isBroken` (grep: 0 trafien); "zlamany" = `routed`.
//! * [`effective_flee_threshold`] + [`should_rout`] = bramka `_checkRout` (`battleScene.ts:9783-9797`): obrona terenowa
//!   (`terrainDefenseMultiplier > 1`) obniza prog ucieczki o [`MORALE_TERRAIN_RESIST`] (`battleScene.ts:1143`), nie ponizej 0.
//!
//! Nie portowano (efekty sceny, K5c/K5e): `_startRout` (rozbicie dowodcow, `occByKey`, log, sfx, kierunek ucieczki),
//! `_applyMoraleDamage`, `_gainMorale`, `_checkMeleeScreenLost`, oraz zapisy `ru.dead = true` (`:9356`, `:9912`).
//!
//! Pola `hp`, `move_left`, `acted` sa czescia modelu z GOAL K5a, ale ZADEN z czterech predykatow pinu (`:5617`,
//! `:10159-10160`, `:10263`, `:9783-9797`) ich nie czyta (grep fragmentow pinu: 0 odwolan). Nie maja wiec wektorow
//! i nie sa weryfikowane wzgledem pinu w K5a; ich semantyka wejdzie z klockami, ktore je czytaja (K5c/K5e).
//! `is_broken` jest aliasem `routed` wymaganym przez GOAL („alive/broken”); zaleznosci powinny uzywac
//! [`is_out`] / [`alive_end`], nie `is_broken`.
//!
//! Wejscia `_checkEnd` nadal sa flagami (`EndCheckInput.alive_a` / `alive_d` / `total_dead` w
//! `siege_tactics_endcheck.rs`). Miejsce podstawienia (bez refaktoru): wywolujacy budujacy `EndCheckInput` z listy
//! `CombatUnit` podstawia `alive_a = side_alive_end(&atk)`, `alive_d = side_alive_end(&def)`, `total_dead = total_dead(..)`.

/// Web `MORALE_TERRAIN_RESIST` (`battleScene.ts:1143`).
pub const MORALE_TERRAIN_RESIST: f64 = 5.0;

/// Web `Math.max(0, x)` dla jednej wartosci. `NaN` zostaje `NaN` (jak w JS; `f64::max` zwrocilby 0).
fn js_max0(x: f64) -> f64 {
    if x.is_nan() {
        x
    } else {
        x.max(0.0)
    }
}

/// Minimalny model jednostki boju: pola `RuntimeBattleUnit` czytane przez predykaty K5a.
///
/// `hp` = web `u.bu.hp`. `morale` = `u.morale`. `flee_morale` = `u.fleeMorale` (prog rozbicia per jednostka).
/// `move_left` = `u.moveLeft`. Wartosci `f64` zachowuja `NaN` / `Infinity` z webu.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CombatUnit {
    pub hp: f64,
    pub morale: f64,
    pub flee_morale: f64,
    pub move_left: f64,
    pub never_rout: bool,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    pub removed: bool,
    pub acted: bool,
}

/// Web `alive` (`battleScene.ts:5617`): `!ru.dead && !ru.fadingOut && !ru.removed`.
pub fn alive_power(u: &CombatUnit) -> bool {
    !u.dead && !u.fading_out && !u.removed
}

/// Web `aliveA` / `aliveD` (`battleScene.ts:10159-10160`): `!u.dead && !u.fadingOut && !u.routed`.
pub fn alive_end(u: &CombatUnit) -> bool {
    !u.dead && !u.fading_out && !u.routed
}

/// Web `this.atk.some(...)` / `this.def.some(...)` z `_checkEnd` (`battleScene.ts:10159-10160`).
pub fn side_alive_end(units: &[CombatUnit]) -> bool {
    units.iter().any(alive_end)
}

/// Web `[...this.atk, ...this.def].filter(u => u.dead).length` (`totalDead` w `_checkEnd`, bez `routed`).
pub fn total_dead(units: &[CombatUnit]) -> usize {
    units.iter().filter(|u| u.dead).count()
}

/// Web `out` (`battleScene.ts:5575` i `:10263`): `u.dead || u.routed`.
pub fn is_out(u: &CombatUnit) -> bool {
    u.dead || u.routed
}

/// Zlamany = rozbity i uciekajacy (`routed`). Patrz opis modulu: w pinie nie ma `isBroken`.
pub fn is_broken(u: &CombatUnit) -> bool {
    u.routed
}

/// Web `_checkRout` (`battleScene.ts:9789-9794`): prog ucieczki po ewentualnej obronie terenowej.
///
/// `terrain_defence_mult` = wynik `terrainDefenseMultiplier(terr, cu.rola, this.terrainData)`. Gdy `> 1` (NaN -> nie),
/// prog = `Math.max(0, flee_morale - MORALE_TERRAIN_RESIST)`; w przeciwnym razie `flee_morale`.
pub fn effective_flee_threshold(flee_morale: f64, terrain_defence_mult: f64) -> f64 {
    if terrain_defence_mult > 1.0 {
        js_max0(flee_morale - MORALE_TERRAIN_RESIST)
    } else {
        flee_morale
    }
}

/// Bramka `_checkRout` (`battleScene.ts:9784` i `:9795`): `true` wtedy i tylko wtedy, gdy web wywola `_startRout`.
///
/// Jednostka juz rozbita, martwa, zanikajaca lub `neverRout` -> `false`. Inaczej rozbicie, gdy `!(morale > flee)`
/// (negacja zachowuje semantyke JS dla `NaN`: porownanie z `NaN` daje `false`, wiec rozbicie nastepuje).
pub fn should_rout(u: &CombatUnit, flee: f64) -> bool {
    if u.routed || u.dead || u.fading_out || u.never_rout {
        return false;
    }
    // JS `morale > flee` jest false dla NaN (wtedy rozbicie). `partial_cmp` zwraca None dla NaN, wiec `Greater` wymaga
    // obu wartosci porownywalnych i wiekszych.
    !matches!(
        u.morale.partial_cmp(&flee),
        Some(std::cmp::Ordering::Greater)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn unit() -> CombatUnit {
        CombatUnit {
            hp: 10.0,
            morale: 50.0,
            flee_morale: 20.0,
            move_left: 2.0,
            never_rout: false,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
        }
    }

    #[test]
    fn alive_rozni_sie_od_alive_a_na_removed_i_routed() {
        let mut u = unit();
        u.removed = true;
        assert!(!alive_power(&u));
        assert!(alive_end(&u), "removed nie wchodzi do aliveA");
        u.removed = false;
        u.routed = true;
        assert!(alive_power(&u), "routed nie wchodzi do alive z 5617");
        assert!(!alive_end(&u));
    }

    #[test]
    fn js_max0_zachowuje_nan() {
        assert!(js_max0(f64::NAN).is_nan());
        assert_eq!(js_max0(-3.0), 0.0);
        assert_eq!(js_max0(2.5), 2.5);
    }

    #[test]
    fn nan_prog_ucieczki_daje_rozbicie() {
        // Morale > NaN jest false w JS, wiec bramka przepuszcza do _startRout.
        assert!(should_rout(&unit(), f64::NAN));
    }

    #[test]
    fn total_dead_nie_liczy_routed() {
        let mut a = unit();
        a.routed = true;
        let mut b = unit();
        b.dead = true;
        assert_eq!(total_dead(&[a, b]), 1);
        assert!(!side_alive_end(&[b]));
        assert!(!side_alive_end(&[]));
    }
}
