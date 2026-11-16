//! Ramka bitwy taktycznej po każdym kroku pętli: producent [`BattleFrameDto`] (temat
//! `R-RUSTPORT-P4-1I2-BATTLE-FRAME`, P4-1I2 / #246 / PRIO-3D-7 #275).
//!
//! Web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`) nie ma obiektu „ramki”: renderer czyta pola
//! `RuntimeBattleUnit` (`:1962-2028`) i sceny (`vNow` `:2556`, `roundNo` `:2698`, `wallTileHp` `:2501`, `gateHp`
//! `:2454`, `gateOpen` `:2456`, `wallEverBreached` `:2503`, `siegeTowers[].destroyed` `:2443`, `finished` `:2518`)
//! po każdym odpaleniu klocka zegara (`_drainTimers`, `:9616-9634`). Producent składa te pola w migawkę
//! (recon `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2b).
//!
//! Źródła pól:
//! - z pętli [`SiegeLoop`] (tylko odczyt): `hp`, `morale`, `routed`, `dead`, `removed` ([`TurnSeqState`] /
//!   [`crate::domain::siege_tactics_unit::CombatUnit`]), `round_no`, `finished`, wiersze żywych kafli
//!   ([`crate::domain::siege_tactics_loop::SiegeEnv::wall_tile_rows`]), `wall_ever_breached` i `towers_destroyed`
//!   (flaga wież w pętli, [`SiegeLoop::towers_destroyed_rows`]; recon L4);
//! - jawne wejście adaptera ([`FrameInput`], recon L7): pozycja `(col, row)`, `on_wall_walkway` — nie są polami
//!   `CombatUnit` i nie są czytane z renderera; `facing` (w produkcji źródłem jest `ProdBody::facing`),
//!   `ammoLeft` (brak w silniku) oraz HP kafli i bramy ([`WallState`]);
//! - `v_now`: zegar wirtualny w chwili odpalenia (obserwator pętli, [`SiegeLoop::set_fire_observer`]).
//!
//! Kolejność jednostek = kolejność spawnu web: `this.atk`, potem `this.def` (`place(...)`, `:5541-5550`;
//! iteracja `[...this.atk, ...this.def]`, np. `:5573`), czyli `st.atk`, potem `st.def`.
//! Amunicja `Infinity` (`ammoCount`, `:1445`; `_doRangedAttack` zmniejsza tylko wartość skończoną, `:9191-9192`)
//! → `None`.

use std::cell::RefCell;
use std::rc::Rc;

use civ_view_model::battle::{
    BattleFrameDto, BattleFrameUnitDto, BattleFrameWallDto, BattleWallTileHpDto,
};
use civ_view_model::ids::{IdOutOfRange, UnitId};
use civ_view_model::validate::ViewError;

use crate::domain::siege_tactics_breach::WallState;
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_loop::{LoopBody, SiegeLoop};

/// Wejście adaptera dla jednej jednostki (pola sceny spoza `CombatUnit`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FrameUnitPose {
    /// `ru.q` (kolumna).
    pub col: i32,
    /// `ru.r` (wiersz).
    pub row: i32,
    /// `ru.facing` (`Dir`, 0..3).
    pub facing: i32,
    /// `ru.onWallWalkway`.
    pub on_wall_walkway: bool,
    /// `ru.ammoLeft`; `f64::INFINITY` = bez limitu (web `Infinity`).
    pub ammo_left: f64,
}

/// Wejście adaptera dla jednej ramki.
#[derive(Debug, Clone, PartialEq)]
pub struct FrameInput {
    /// Pozy jednostek: `[0]` atakujący (równolegle do `st.atk`), `[1]` obrońcy (równolegle do `st.def`).
    pub poses: [Vec<FrameUnitPose>; 2],
    /// Stan muru adaptera: HP kafli (`wallTileHp`), `gateHp`, `gateOpen`. Zbiór żywych wierszy i
    /// `wallEverBreached` bierze producent z pętli.
    pub wall: WallState,
}

/// Błąd producenta ramki.
#[derive(Debug, Clone, PartialEq)]
pub enum FrameError {
    /// Liczba póz adaptera różna od liczby jednostek strony w pętli.
    PoseCount {
        /// Strona.
        side: BattleSide,
        /// Liczba jednostek w pętli.
        expected: usize,
        /// Liczba póz.
        actual: usize,
    },
    /// Id jednostki poza zakresem JSON (`> 2^53 - 1`).
    Id(IdOutOfRange),
    /// Wiersz kafla albo wieży poza zakresem `i32`.
    Row(i64),
    /// Żywy kafel pętli bez HP w stanie muru adaptera.
    TileHpMissing(i64),
    /// Ramka nie spełnia [`BattleFrameDto::validate`] (np. `NaN`, `-Infinity` w amunicji).
    Invalid(ViewError),
}

impl From<IdOutOfRange> for FrameError {
    fn from(e: IdOutOfRange) -> Self {
        FrameError::Id(e)
    }
}

fn row_i32(row: i64) -> Result<i32, FrameError> {
    i32::try_from(row).map_err(|_| FrameError::Row(row))
}

/// Web `ammoLeft` → DTO: `Infinity` (bez limitu) → `None`, liczba skończona → `Some`. `NaN` i `-Infinity` przechodzą
/// jako `Some` i odrzuca je [`BattleFrameDto::validate`].
pub fn ammo_to_dto(ammo_left: f64) -> Option<f64> {
    if ammo_left == f64::INFINITY {
        None
    } else {
        Some(ammo_left)
    }
}

/// Producent ramki ze stanu pętli (tylko odczyt) i wejścia adaptera. `v_now` = zegar wirtualny po kroku.
///
/// # Errors
/// [`FrameError`]: niespójne wejście adaptera albo ramka łamiąca [`BattleFrameDto::validate`].
pub fn battle_frame<B: LoopBody>(
    lp: &SiegeLoop<B>,
    v_now: f64,
    input: &FrameInput,
) -> Result<BattleFrameDto, FrameError> {
    let st = &lp.st;
    let mut units = Vec::with_capacity(st.atk.len() + st.def.len());
    for (side, roster, poses) in [
        (BattleSide::Attacker, &st.atk, &input.poses[0]),
        (BattleSide::Defender, &st.def, &input.poses[1]),
    ] {
        if roster.len() != poses.len() {
            return Err(FrameError::PoseCount {
                side,
                expected: roster.len(),
                actual: poses.len(),
            });
        }
        for (u, p) in roster.iter().zip(poses.iter()) {
            units.push(BattleFrameUnitDto {
                id: UnitId::try_new(u.id)?,
                col: p.col,
                row: p.row,
                facing: p.facing,
                hp: u.c.hp,
                morale: u.c.morale,
                ammo_left: ammo_to_dto(p.ammo_left),
                routed: u.c.routed,
                dead: u.c.dead,
                removed: u.c.removed,
                on_wall_walkway: p.on_wall_walkway,
            });
        }
    }
    let mut tile_hp = Vec::with_capacity(lp.env.wall_tile_rows.len());
    for &row in &lp.env.wall_tile_rows {
        let r = row_i32(row)?;
        let hp = *input
            .wall
            .wall_tile_hp
            .get(&r)
            .ok_or(FrameError::TileHpMissing(row))?;
        tile_hp.push(BattleWallTileHpDto { row: r, hp });
    }
    let towers_destroyed = lp
        .towers_destroyed_rows()
        .into_iter()
        .map(row_i32)
        .collect::<Result<Vec<_>, _>>()?;
    let frame = BattleFrameDto {
        v_now,
        round_no: st.round_no,
        units,
        wall: BattleFrameWallDto {
            tile_hp,
            gate_hp: input.wall.gate_hp,
            gate_open: input.wall.gate_open,
            ever_breached: lp.env.wall_ever_breached,
            towers_destroyed,
        },
        finished: st.finished,
    };
    frame.validate().map_err(FrameError::Invalid)?;
    Ok(frame)
}

/// Zapis ramek: jedna pozycja na każde odpalenie klocka zegara pętli, w kolejności odpaleń.
pub type FrameLog = Rc<RefCell<Vec<Result<BattleFrameDto, FrameError>>>>;

/// Podpina producenta ramki pod pętlę: po KAŻDYM odpaleniu klocka zegara ([`SiegeLoop::set_fire_observer`])
/// adapter `input_of` podaje wejście z bieżącego stanu, a wynik [`battle_frame`] trafia do zwróconego zapisu.
/// Zastępuje wcześniejszego obserwatora.
pub fn record_frames<B, F>(lp: &mut SiegeLoop<B>, mut input_of: F) -> FrameLog
where
    B: LoopBody + 'static,
    F: FnMut(&SiegeLoop<B>) -> FrameInput + 'static,
{
    let log: FrameLog = Rc::new(RefCell::new(Vec::new()));
    let sink = Rc::clone(&log);
    lp.set_fire_observer(Some(Box::new(move |lp: &SiegeLoop<B>, v_now: f64| {
        let input = input_of(lp);
        sink.borrow_mut().push(battle_frame(lp, v_now, &input));
    })));
    log
}
