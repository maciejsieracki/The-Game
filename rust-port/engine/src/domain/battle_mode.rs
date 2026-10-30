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
//! - Integracja z zapisem (`meta.battleModeSettingVersion`, `playerBattleAutomaticOnly`) poza
//!   zakresem tego modulu - NASTEPNA-PARTIA (patrz raport tematu).

/// Wersja markera zapisu, ktora aktywuje semantyke automatycznej bitwy (web: `BATTLE_MODE_SETTING_VERSION`).
pub const BATTLE_MODE_SETTING_VERSION: f64 = 1.0;

/// Czy ustawienia zapisu wymuszaja tryb "tylko automatyczny" (web: `isAutomaticOnlyBattleMode`).
pub fn is_automatic_only_battle_mode(
    setting_version: Option<f64>,
    battle_always_manual: Option<bool>,
) -> bool {
    setting_version == Some(BATTLE_MODE_SETTING_VERSION) && battle_always_manual == Some(false)
}
