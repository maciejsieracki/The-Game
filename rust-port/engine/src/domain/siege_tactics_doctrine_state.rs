//! K5DOC-PROD-UNIT-STAN (T0, dispatch R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0): pola stanu doktryny jednostki
//! produkcyjnej oraz czysta funkcja `_forwardCol`. Tylko STAN i jego wartości domyślne: ten moduł NIE zmienia
//! zachowania żadnej ścieżki (`ProdBody`, `activate_unit`, maszyna K5H są nietknięte). Pola czytają dopiero
//! przyszłe tematy doktryny (T1–T9).
//!
//! Źródło: `gra/src/battle/battleScene.ts` przy pinie `07d2fbd72`. Każda wartość domyślna jest podpisana
//! plik:linia pinu przy polu [`ProdDoctrineState`] oraz przy konstruktorze domyślnym.

use crate::domain::siege_tactics_approach::BF_COLS;
use crate::domain::siege_tactics_end::BattleSide;

/// Postawa taktyczna grupy gracza. Web: `type GroupDoctrine = 'defensive' | 'steady' | 'aggressive' | 'skirmish' | 'manual'`
/// (`battleScene.ts:1938`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GroupDoctrine {
    Defensive,
    Steady,
    Aggressive,
    Skirmish,
    Manual,
}

impl GroupDoctrine {
    /// Parsowanie z napisu pina (`battleScene.ts:1938`). Nieznany napis = `None` (brak cichego domyślnego wariantu).
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "defensive" => Some(Self::Defensive),
            "steady" => Some(Self::Steady),
            "aggressive" => Some(Self::Aggressive),
            "skirmish" => Some(Self::Skirmish),
            "manual" => Some(Self::Manual),
            _ => None,
        }
    }
}

/// Klasa jednostki dla preferencji celów. Web: `type BattleUnitClass = 'mounted' | 'ranged' | 'melee'`
/// (`battleScene.ts:1939`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BattleUnitClass {
    Mounted,
    Ranged,
    Melee,
}

/// Stan doktryny jednostki (pola `BattleUnit` pinu, które `ProdUnit` nie niósł). Wartości domyślne: [`Default`].
#[derive(Debug, Clone, PartialEq)]
pub struct ProdDoctrineState {
    /// `ru.unitDoctrine` (`battleScene.ts:2041`). Pin spawn: `unitDoctrine: null` (`:4576`) -> `None`.
    pub unit_doctrine: Option<GroupDoctrine>,
    /// `ru.groupId` (`battleScene.ts:2035`). Pin spawn: `groupId: null` (`:4574`) -> `None`.
    pub group_id: Option<String>,
    /// `ru.rangedKite` (`battleScene.ts:2031`). Pin spawn: `rangedKite: true` (`:4572`).
    pub ranged_kite: bool,
    /// `ru.shootingEnabled` (`battleScene.ts:2032`). Pin spawn: `shootingEnabled: true` (`:4573`);
    /// pin sprawdza `ru.shootingEnabled !== false` (`:6241`), więc domyślnie `true`.
    pub shooting_enabled: bool,
    /// `ru.dryCol` (`battleScene.ts:2006`). Pin spawn: `dryCol: -1` (`:4555`); `-1` = jeszcze nie pusty.
    pub dry_col: i64,
    /// `ru.heldAfterFallback` (`battleScene.ts:2007`). Pin spawn: `heldAfterFallback: false` (`:4556`).
    pub held_after_fallback: bool,
    /// `ru.lastAutoMoveFrom` (`battleScene.ts:1980`, pole opcjonalne, pin: brak = `undefined`) -> `None`.
    pub last_auto_move_from: Option<(i64, i64)>,
    /// `ru.antiCavSpear` (`battleScene.ts:2009`). Pin spawn: `isAntiCavSpear(bu)` (`:4558`); bez klasy domyślnie `false`.
    /// Wartość wyliczana z klasy przez adapter spawnu, nie tutaj.
    pub anti_cav_spear: bool,
    /// `ru.mounted` (`battleScene.ts:2008`). Pin spawn: `isMounted(bu)` (`:4557`); bez klasy domyślnie `false`.
    /// Wartość wyliczana z klasy przez adapter spawnu, nie tutaj.
    pub mounted: bool,
    /// `ru.unitTargetPriorities` (`battleScene.ts:2045`, pole opcjonalne). Domyślnie „brak” = `None`
    /// (pin: `Partial<Record<BattleUnitClass, BattleUnitClass[]>>`, brak wpisu = brak nadpisania).
    pub unit_target_priorities: Option<Vec<(BattleUnitClass, Vec<BattleUnitClass>)>>,
}

impl Default for ProdDoctrineState {
    /// Wartości domyślne zgodne z pinem `battleScene.ts:4555-4576` (spawn jednostki, ścieżka `_spawnUnit` / deploy).
    fn default() -> Self {
        Self {
            unit_doctrine: None,          // battleScene.ts:4576 (`unitDoctrine: null`)
            group_id: None,               // battleScene.ts:4574 (`groupId: null`)
            ranged_kite: true,            // battleScene.ts:4572 (`rangedKite: true`)
            shooting_enabled: true, // battleScene.ts:4573 (`shootingEnabled: true`), sprawdzane jako `!== false` (:6241)
            dry_col: -1,            // battleScene.ts:4555 (`dryCol: -1`)
            held_after_fallback: false, // battleScene.ts:4556 (`heldAfterFallback: false`)
            last_auto_move_from: None, // battleScene.ts:1980 (pole opcjonalne, brak w spawnie)
            anti_cav_spear: false, // battleScene.ts:4558 (`isAntiCavSpear(bu)`), tu: brak klasy = false
            mounted: false,        // battleScene.ts:4557 (`isMounted(bu)`), tu: brak klasy = false
            unit_target_priorities: None, // battleScene.ts:2045 (pole opcjonalne), domyślnie „brak”
        }
    }
}

/// Kierunek natarcia strony: atakujący +1 (ku wyższej kolumnie), obrońca -1. Pin `_advanceDir`
/// (`battleScene.ts:6742`, zwraca `side === 'atk' ? 1 : -1`).
fn advance_dir(side: BattleSide) -> i64 {
    match side {
        BattleSide::Attacker => 1,
        BattleSide::Defender => -1,
    }
}

/// `_forwardCol(side, col, steps)` z pina `battleScene.ts:6748`:
/// `Math.max(0, Math.min(BF_COLS - 1, col + advanceDir(side) * steps))` (z clampem do planszy).
pub fn forward_col(side: BattleSide, col: i64, steps: i64) -> i64 {
    (col + advance_dir(side) * steps).clamp(0, BF_COLS - 1)
}
