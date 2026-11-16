//! K5DOC-T3 GEOMETRIA (dispatch R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1): geometria szyku z pina `07d2fbd72`.
//!
//! Wynik rozpoznania osiągalności (`gra/src/battle/battleScene.ts` przy pinie):
//! - C6 `_forwardCol` (`:6748`): JUŻ W PARITY w [`crate::domain::siege_tactics_doctrine_state::forward_col`] (T0).
//! - C7 `_attackFormationRallyPoint` (`:17707`): NIE_PORTOWANE (martwe). Jedyne wywołanie: `_doctrineMoveDest`
//!   (`:17939`) w gałęzi `meta.doctrine === 'steady'`. `_executeGroupDoctrineStep` (`:17966`) zwraca wcześniej
//!   dla `steady` (`:18022-18025`), a `_executeSkirmishDoctrineStep` (`:18087`) przekazuje wyłącznie `skirmish`,
//!   więc `_doctrineMoveDest` nigdy nie dostaje `steady`.
//! - C8 `_chargeMoveDest` (`:17778`): NIE_PORTOWANE (martwe). Jedyne wywołanie: `_doctrineMoveDest`
//!   (`:17948`) w gałęzi `meta.doctrine === 'aggressive'`. `_executeGroupDoctrineStep` zwraca dla `aggressive`
//!   (`:18027-18035`), więc gałąź jest nieosiągalna.
//! - C9 `_moveTargetForUnit` (`:11442`): ŻYWE (wołane z `:11468`, `:11629`, `:17955`, `:18063`, `:20316`). Port tutaj.

use crate::domain::siege_tactics_approach::{BF_COLS, BF_ROWS};

/// Pole planszy `{ col, row }` z pina.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BoardPos {
    pub col: i64,
    pub row: i64,
}

/// `_moveTargetForUnit(u, col, row)` z pina `battleScene.ts:11442-11448`:
/// `off = u.formationOffset ?? {dc:0, dr:0}`; `col' = clamp(col + off.dc, 0, BF_COLS-1)`;
/// `row' = clamp(row + off.dr, 0, BF_ROWS-1)`. `formation_offset = None` odpowiada `formationOffset: null`
/// (pin `:4575`). `BF_COLS`/`BF_ROWS` z pina `:661-662`.
pub fn move_target_for_unit(formation_offset: Option<(i64, i64)>, col: i64, row: i64) -> BoardPos {
    let (dc, dr) = formation_offset.unwrap_or((0, 0));
    BoardPos {
        col: (col + dc).clamp(0, BF_COLS - 1),
        row: (row + dr).clamp(0, BF_ROWS - 1),
    }
}
