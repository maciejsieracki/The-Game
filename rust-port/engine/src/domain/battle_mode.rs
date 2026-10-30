//! REPIN-WOJNA-2 (U2): port `gra/src/game/battle-mode.ts` (pin `dc8a3adc`).
//!
//! web: gra/src/game/battle-mode.ts:2 (`BATTLE_MODE_SETTING_VERSION`), :9-14
//! (`isAutomaticOnlyBattleMode`). Semantyka: tylko jawny marker wersji `1` i jawne `false`
//! (`=== false` w webie) wlaczaja tryb "tylko automatyczny" - stare zapisy z nieaktywna
//! flaga `battleAlwaysManual: false` NIE moga go aktywowac (commit web `bc2478ff`).
//!
//! Zalozenia (ZALOZENIE):
//! - Wartosc `battleAlwaysManual` jest modelowana jako `Option<bool>`: `Some(false)` odpowiada
//!   wylacznie boolowskiemu `false` z weba; `None` oznacza dowolna inna wartosc (undefined,
//!   null, 0, '', 'false', ...). Web dla wszystkich nie-boolowskich wartosci zwraca `false`
//!   (`=== false` nie jest wtedy spelnione), wiec mapowanie na `None` jest rownowazne.
//! - Wersja zapisu: `Option<f64>`; NaN i wartosci rozne od 1 daja `false` (jak `=== 1` w webie).
//! - Integracja z zapisem (R3): logika wczytania wersji (`main.ts:40819-40821`) i
//!   `playerBattleAutomaticOnly` (`main.ts:29052-29060`) jest tu jako czyste funkcje
//!   (`restored_setting_version`, `player_battle_automatic_only`). Pole `meta` zapisu
//!   (`save_load.rs`, R4) przechowuje surowe wartosci; normalizacje skladaja wywolujacy
//!   (test `p6_repin_wojna_2_r4_save`). Wywolanie w grze - NASTEPNA-PARTIA (patrz raport tematu).

/// Wersja markera zapisu, ktora aktywuje semantyke automatycznej bitwy (web: `BATTLE_MODE_SETTING_VERSION`).
pub const BATTLE_MODE_SETTING_VERSION: f64 = 1.0;

/// Czy ustawienia zapisu wymuszaja tryb "tylko automatyczny" (web: `isAutomaticOnlyBattleMode`).
pub fn is_automatic_only_battle_mode(
    setting_version: Option<f64>,
    battle_always_manual: Option<bool>,
) -> bool {
    setting_version == Some(BATTLE_MODE_SETTING_VERSION) && battle_always_manual == Some(false)
}

/// Normalizacja wersji markera przy wczytaniu zapisu (web `main.ts:40819-40821`, `restoreGameFromSave`):
/// tylko dokladnie `1` przechodzi, kazda inna wartosc (brak, `2`, NaN, napis, `null`) daje `None`.
pub fn restored_setting_version(saved: Option<f64>) -> Option<f64> {
    if saved == Some(BATTLE_MODE_SETTING_VERSION) {
        Some(BATTLE_MODE_SETTING_VERSION)
    } else {
        None
    }
}

/// Web `playerBattleAutomaticOnly` (`main.ts:29052-29060`): tryb dotyczy tylko gracza
/// (`isMe`) i tylko przy wersji markera oraz jawnym `battleAlwaysManual === false`.
pub fn player_battle_automatic_only(
    is_me: bool,
    setting_version: Option<f64>,
    battle_always_manual: Option<bool>,
) -> bool {
    is_me && is_automatic_only_battle_mode(setting_version, battle_always_manual)
}
