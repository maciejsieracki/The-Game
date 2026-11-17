//! P6 SIEGE-TAKTYKA K5DOC-T4c (dispatch R-RUSTPORT-P6-K5DOC-T4C-DOMOVE, runda 1, Operator): efekty STANU `_doMove`.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`, `_doMove` `:8685-8776`):
//! * [`do_move_effects`] wykonuje w kolejnosci pina: odmowa (`_siegeMoveRefused`, wejscie `refused`), zajetosc
//!   (`occByKey`: usuniecie starego klucza, ustawienie nowego), pozycja jednostki, koszt kroku z clampem `[1, 99]`,
//!   mnoznik brodu (`stepCost = enterCost / BROD_RUCH_MULT` gdy startowe LUB docelowe pole to brod), `moveLeft =
//!   max(0, moveLeft - stepCost)`, a na koncu `_updateFacing` (wejscie przez [`MoveWorld::update_facing`]).
//! * Galaz planowania (`_autoBatchPlanning`, `:8690-8706`): gdy podano `autobatch`, dopisywany jest krok do
//!   `intent.steps` i `intent.kind` zmienia sie na `Move` (gdy nie bylo `Attack`).
//!
//! Zakres CELOWO ograniczony do efektow stanu. POZA zakresem: animacja, `busy`, `_raf`, `done()` (UI, zwracane jako
//! flaga [`MoveOutcome::done`]), `ru.group`, `hpBarGroup`, sam `_updateFacing` (#107, zablokowany: tu tylko wywolanie
//! wejscia, bez logiki) oraz `_siegeMoveRefused` (K1: tu tylko wejscie `refused`).
//!
//! Koszt terenu: [`MoveWorld::move_cost`] = wynik `_moveCostForUnit` przed clampem (`Infinity` jest dozwolone i daje 99).
//! Brod: [`MoveWorld::is_ford`] = `isFordTile` (`:1897`).

use std::collections::HashMap;

use super::js_math::{js_max, js_min};
use super::siege_tactics_autobatch::{cell_key, CellKey};
use super::siege_tactics_autophase::{AutoBatchIntent, AutoBatchIntentKind, AutoBatchStep};

/// Web `BROD.ruchMult` (`battleScene.ts:983`; `data/combat-params.json`, `brod.ruchMult` = 0.5).
pub const BROD_RUCH_MULT: f64 = 0.5;

/// Jednostka wchodzaca w efekty ruchu (pola `ru` czytane i zapisywane przez `_doMove`).
#[derive(Debug, Clone, PartialEq)]
pub struct MoveUnit {
    /// Identyfikator jednostki (klucz w `occByKey` jest kafelkiem, wartosc to ten id).
    pub id: String,
    /// Web `ru.q` (kolumna).
    pub q: f64,
    /// Web `ru.r` (wiersz).
    pub r: f64,
    /// Web `ru.moveLeft`.
    pub move_left: f64,
}

/// Odczyty i zapisy sceny potrzebne efektom ruchu (wejscia jawne; implementacja w scenie albo w tescie).
pub trait MoveWorld {
    /// Web `occByKey` (kafelek -> id zajmujacej jednostki). Zapis wykonuje [`do_move_effects`].
    fn occ_mut(&mut self) -> &mut HashMap<CellKey, String>;
    /// Web `_moveCostForUnit(ru, col, row)` (`battleScene.ts:7436`), przed clampem: `Infinity` = nie wejdzie.
    fn move_cost(&self, col: f64, row: f64) -> f64;
    /// Web `isFordTile(terrainMap, col, row)` (`battleScene.ts:1897`).
    fn is_ford(&self, col: f64, row: f64) -> bool;
    /// Web `_updateFacing(ru)` (`battleScene.ts:8334`, #107 zablokowany). WEJSCIE: bez logiki w tym porcie.
    fn update_facing(&mut self, unit_id: &str);
}

/// Dane terenu czytane przez koszt ruchu jednostki (K5DOC-T4e-0, decyzja D1): `terrainMap.passable/moveCost/
/// combatTerrainName` (`_moveCostForUnit`, `battleScene.ts:7436-7443`), `isFordTile` (`:1897`) i mnoznik kawalerii
/// `cavalryTerrainMultiplier` (`combat.ts:756`, wejscie adaptera). Brak implementacji przy wymaganym ruchu to jawny
/// blad po stronie wolajacego (`MissingTerrain` w `ProdBody::move_step`), a nie wartosc domyslna.
pub trait MoveTerrain {
    /// Web `terrainMap.passable(col, row)`.
    fn passable(&self, col: f64, row: f64) -> bool;
    /// Web `terrainMap.moveCost(col, row)` (koszt wejscia pieszego, przed mnoznikiem kawalerii).
    fn move_cost(&self, col: f64, row: f64) -> f64;
    /// Web `isFordTile(terrainMap, col, row)` (`battleScene.ts:1897`).
    fn is_ford(&self, col: f64, row: f64) -> bool;
    /// Web `cavalryTerrainMultiplier(terrainMap.combatTerrainName(col, row), terrainData)` (`combat.ts:756`).
    /// `Infinity` = niedostepne dla kawalerii.
    fn cavalry_multiplier(&self, col: f64, row: f64) -> f64;
}

/// Wynik efektow ruchu.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MoveOutcome {
    /// `true` gdy web wywoluje `done()` synchronicznie (galaz odmowy i galaz planowania). `false` = galaz bezposrednia:
    /// `done()` przychodzi dopiero z animacja (poza zakresem).
    pub done: bool,
}

/// Web `_doMove(ru, col, row, done)` bez animacji: efekty stanu.
///
/// * `refused`: wynik `_siegeMoveRefused(ru, col, row)` (wywolanie tylko gdy `siegeWallCol >= 0`, decyzja wolajacego).
///   Gdy `true`: `moveLeft = 0`, zajetosc i facing bez zmian, bez dopisywania krokow.
/// * `autobatch`: `Some(intent)` = galaz `_autoBatchPlanning`; `None` = galaz bezposrednia.
pub fn do_move_effects<W: MoveWorld>(
    world: &mut W,
    unit: &mut MoveUnit,
    col: f64,
    row: f64,
    refused: bool,
    autobatch: Option<&mut AutoBatchIntent>,
) -> MoveOutcome {
    // web :8689-8692: if (siegeWallCol >= 0 && _siegeMoveRefused) { ru.moveLeft = 0; done(); return; }
    if refused {
        unit.move_left = 0.0;
        return MoveOutcome { done: true };
    }

    // web :8694-8697 (planowanie) i :8718-8721 (bezposrednia): zajetosc, potem pozycja.
    let (old_col, old_row) = (unit.q, unit.r);
    let old_key = cell_key(old_col, old_row);
    let new_key = cell_key(col, row);
    world.occ_mut().remove(&old_key);
    world.occ_mut().insert(new_key, unit.id.clone());
    unit.q = col;
    unit.r = row;

    // web :8699-8700 / :8726-8728 : koszt kroku z clampem [1, 99].
    let enter_cost = js_max(1.0, js_min(world.move_cost(col, row), 99.0));
    // web :8701-8702 / :8747-8749 : brod na starcie LUB na celu (oldCol/oldRow przed przypisaniem).
    let wading_ford = world.is_ford(old_col, old_row) || world.is_ford(col, row);
    let step_cost = if wading_ford {
        enter_cost / BROD_RUCH_MULT
    } else {
        enter_cost
    };
    // web :8703 / :8752 : moveLeft nie schodzi ponizej 0.
    unit.move_left = js_max(0.0, unit.move_left - step_cost);

    // web :8704 / :8756 : facing jako wejscie.
    world.update_facing(&unit.id);

    match autobatch {
        Some(intent) => {
            // web :8705-8706 : if (intent.kind !== 'attack') intent.kind = 'move'; intent.steps.push({col,row});
            if intent.kind != AutoBatchIntentKind::Attack {
                intent.kind = AutoBatchIntentKind::Move;
            }
            intent.steps.push(AutoBatchStep { col, row });
            MoveOutcome { done: true }
        }
        None => MoveOutcome { done: false },
    }
}
