//! P6 SIEGE-TAKTYKA K2 (runda 1 Operatora): czyste funkcje obwarowania miasta z `city-fortification.ts`.
//!
//! Port 1:1 z `gra/src/game/city-fortification.ts` (pin `07d2fbd72`), tylko funkcje wolane z `battleScene.ts`:
//! * [`city_fortification_kind`] = `cityFortificationKind` (`city-fortification.ts:29-36`, wolanie `battleScene.ts:2741`):
//!   `'mur'` (`mury` / `fort` / `mury_kamienne`) > `'palisada'` > `'none'`. Brak danych (`null`/`undefined`) = pusta lista.
//! * [`melee_blocked_by_wall`] = `meleeBlockedByWall` (`city-fortification.ts:76-79`, wolanie `battleScene.ts:8363`):
//!   R2, jednostka wrecz nie bije obroncy stojacego na murze / za palisada, chyba ze nastapil wylom.
//! * [`attacker_wall_entry_is_breach`] = `attackerWallEntryIsBreach` (`city-fortification.ts:96-98`, wolanie
//!   `battleScene.ts:8072`): R5, atakujacy na koronie muru = wylom.
//!
//! Wejscia jawne (bez stanu sceny):
//! * `builtBuildingIds` -> `Option<&[S]>`; `None` odpowiada web `null`/`undefined` (`?? []`).
//! * flagi `ru.onWallWalkway`, `e.onWallWalkway`, `ru.side`, `wallEverBreached` i wynik `canShoot`/`isSiegeUnit`
//!   sa podawane przez wywolujacego. Web sprawdza `=== true`, wiec `undefined` i `false` daja ten sam wynik;
//!   Rust przyjmuje `bool` (brak wartosci = `false`).
//! * Brak wejsc liczbowych, wiec wektory NaN/Inf nie dotycza tego modulu.
//!
//! Nie portowano (BRAK, poza tym modulem): `cityHasFortification`, `cityIsFortified`, `canCaptureCity`,
//! `autoStormBreach` (nie sa wolane z `battleScene.ts`). Wrapper sceny `_meleeBlockedByWall` (wiersz 20 planu)
//! zostaje BRAK: zalezy od `canShoot`/`isSiegeUnit` (geometria jednostki w boju).
//! Patrz `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`.

/// Web `CityFortificationKind` (`'none' | 'palisada' | 'mur'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CityFortificationKind {
    None,
    Palisada,
    Mur,
}

/// Web `cityFortificationKind(builtBuildingIds)` (`city-fortification.ts:29-36`).
///
/// `built = None` (web `null`/`undefined`) traktowane jak pusta lista. Dopasowanie identyfikatorow jest dokladne
/// (jak `Array.prototype.includes`).
pub fn city_fortification_kind<S: AsRef<str>>(built: Option<&[S]>) -> CityFortificationKind {
    let built: &[S] = match built {
        Some(ids) => ids,
        None => &[],
    };
    let has = |id: &str| built.iter().any(|b| b.as_ref() == id);
    if has("mury") || has("fort") || has("mury_kamienne") {
        return CityFortificationKind::Mur;
    }
    if has("palisada") {
        return CityFortificationKind::Palisada;
    }
    CityFortificationKind::None
}

/// Web `MeleeWallContext` (`city-fortification.ts:61-70`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MeleeWallContext {
    /// Web `attackerIsMelee`: atakujacy walczy wrecz (nie strzela, nie jest machina oblezenicza).
    pub attacker_is_melee: bool,
    /// Web `attackerOnWall`: atakujacy stoi na koronie muru.
    pub attacker_on_wall: bool,
    /// Web `defenderOnWall`: cel stoi na murze / za nienaruszona palisada.
    pub defender_on_wall: bool,
    /// Web `wallBreached` (opcjonalne; brak = `false`, web sprawdza wylacznie `=== true`).
    pub wall_breached: bool,
}

/// Web `meleeBlockedByWall(ctx)` (`city-fortification.ts:76-79`).
///
/// `true` gdy jednostka wrecz NIE moze zaatakowac tego obroncy. Po wylomie blokada znika.
pub fn melee_blocked_by_wall(ctx: MeleeWallContext) -> bool {
    if ctx.wall_breached {
        return false;
    }
    ctx.attacker_is_melee && !ctx.attacker_on_wall && ctx.defender_on_wall
}

/// Web `attackerWallEntryIsBreach(side, onWallWalkway)` (`city-fortification.ts:96-98`).
///
/// `side_atk` = web `side === 'atk'`. `true` tylko dla atakujacego stojacego na koronie muru.
pub fn attacker_wall_entry_is_breach(side_atk: bool, on_wall_walkway: bool) -> bool {
    side_atk && on_wall_walkway
}
