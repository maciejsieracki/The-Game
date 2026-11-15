//! Wynik bitwy taktycznej dla mapy i ekranu końca: producent [`BattleOutcomeDto`] (temat
//! `R-RUSTPORT-P4-1I1-BATTLE-OUTCOME`, P4-1I / #244).
//!
//! Web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`): `BattleResult` (`:588-604`) budowany w `onFinish`
//! (`:10720-10729`) z pól ustawionych przez ścieżkę końca bitwy:
//!
//! | Ścieżka | Pin | `_endWinner` | `_endSurvivors` |
//! |---|---|---|---|
//! | E1 `_checkEnd` | `:10153-10239` (przypisanie `:10222-10237`) | atakujacy / obronca | `_battleUnitsForMapExport(zwycięzca)` |
//! | E2 `_finishDraw` | `:9467-9478` (wołane z `_checkEnd` `:10202` i z `_ffRoundCapResult` `:9488`) | `'remis'` | `[...export(atk), ...export(def)]` |
//! | E3 `_ffRoundCapResult` | `:9485-9497` | `cap.winner` (bez remisu) | `export(zwycięzca)` |
//! | E4 `_skipInstantFallback` | `:3715-3748` | `result.winner` | `result.survivors` |
//!
//! E4 („Pomiń”) jest tu wariantem z danymi podanymi z zewnątrz: agregacja `computeInstantResult`
//! (`:20389-20593`) to temat `R-RUSTPORT-P4-1I1B-BATTLE-INSTANT` (#245) i NIE jest tu portowana.
//!
//! Pola wspólne (`:10721-10728`):
//! - `winner: this._endWinner ?? winner`, gdzie `winner` = argument `_showEndScreen`, który utworzył domknięcie
//!   `onFinish` (pierwsze wywołanie; kolejne wracają wcześnie przez `_endScreenShown`, `:10669`);
//! - `eventLog = buildBattleEventLog(this.atk.map(u => u.bu), this.def.map(u => u.bu))`
//!   (`units/battleRoster.ts:26-39`): `[...new Set(units.map(u => String(u.id)))]` per strona;
//! - `wallBreached` tylko gdy `siegeWallCol >= 0`;
//! - `log` = `this.log`: NIE_ZMIERZONO — brak producenta tekstów logu (temat P4-1I3, #247); producent zwraca pustą
//!   listę.
//!
//! Statystyki końca `_sideEndStats` (`:10257-10269`) liczone są w `_showEndScreen` (`:10677-10678`). Producent
//! liczy je z tej samej migawki rosterów co resztę wyniku (po zakończeniu bitwy pętla nie zmienia już `hp`,
//! `dead` ani `routed` jednostek).

use civ_view_model::battle::{
    BattleEndStatsDto, BattleOutcomeDto, BattleSideEndStatsDto, BattleSurvivorDto, BattleWinner,
};
use civ_view_model::ids::{IdOutOfRange, UnitId};

use crate::domain::js_math::js_max0;
use crate::domain::siege_no_breach::RoundCapVerdict;
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_endcheck::EndCheckOutcome;
use crate::domain::siege_tactics_turnseq::SeqUnit;

/// Jednostka rosteru bitwy w chwili końca (web `RuntimeBattleUnit`: `u.bu.id`, `u.bu.hp`, `u.bu.maxHp`,
/// `u.dead`, `u.routed`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OutcomeUnit {
    /// `u.bu.id`.
    pub id: u64,
    /// `u.bu.hp`.
    pub hp: f64,
    /// `u.bu.maxHp`.
    pub max_hp: f64,
    /// `u.dead`.
    pub dead: bool,
    /// `u.routed`.
    pub routed: bool,
}

impl OutcomeUnit {
    /// Z jednostki sekwencji tury (`SeqUnit`); `max_hp` podaje wywołujący (`CombatUnit` go nie ma).
    pub fn from_seq(u: &SeqUnit, max_hp: f64) -> Self {
        Self {
            id: u.id,
            hp: u.c.hp,
            max_hp,
            dead: u.c.dead,
            routed: u.c.routed,
        }
    }
}

/// Dane ścieżki E4 („Pomiń”, `_skipInstantFallback`, `:3715-3748`) podane z zewnątrz do czasu P4-1I1B (#245).
#[derive(Debug, Clone, PartialEq)]
pub struct InstantSkipData {
    /// `result.winner` (`:3745`); werdykt HP `:20580-20589` nigdy nie daje remisu.
    pub winner: BattleSide,
    /// `result.survivors` (`:3746`) jako `(id, hp)`, w kolejności wyniku `computeInstantResult`.
    pub survivors: Vec<(u64, f64)>,
    /// Web `this.atk.some(u => !u.dead && isSiegeUnit(u.bu))` (`:3720`), liczone przez wywołującego.
    pub attacker_has_live_siege_unit: bool,
}

/// Ścieżka końca bitwy, która jako OSTATNIA ustawiła `_endWinner` / `_endSurvivors`.
#[derive(Debug, Clone, PartialEq)]
pub enum EndPath {
    /// E1: `_checkEnd` ze zwycięzcą (`:10222-10238`).
    Victory(BattleSide),
    /// E2: `_finishDraw` (`:9467-9478`).
    Draw,
    /// E3: `_ffRoundCapResult` ze zwycięzcą (`:9489-9496`).
    FfRoundCap(BattleSide),
    /// E4: `_skipInstantFallback` (`:3715-3748`), dane z zewnątrz.
    InstantSkip(InstantSkipData),
}

impl EndPath {
    /// Ścieżka po werdykcie `_checkEnd` (`EndCheckOutcome`): `Draw` → `_finishDraw` (E2, `:10202`),
    /// `Ended(strona)` → E1, `Continue` → `None` (bitwa trwa).
    pub fn from_end_check(outcome: EndCheckOutcome) -> Option<Self> {
        match outcome {
            EndCheckOutcome::Continue => None,
            EndCheckOutcome::Draw => Some(EndPath::Draw),
            EndCheckOutcome::Ended(side) => Some(EndPath::Victory(side)),
        }
    }

    /// Ścieżka po werdykcie sufitu przewijania (`_ffRoundCapResult`, `:9485-9497`): remis → `_finishDraw` (E2,
    /// `:9488`), inaczej E3.
    pub fn from_round_cap(verdict: RoundCapVerdict) -> Self {
        match verdict {
            RoundCapVerdict::Draw => EndPath::Draw,
            RoundCapVerdict::Attacker => EndPath::FfRoundCap(BattleSide::Attacker),
            RoundCapVerdict::Defender => EndPath::FfRoundCap(BattleSide::Defender),
        }
    }

    /// `_endWinner` ustawiany przez tę ścieżkę.
    pub fn end_winner(&self) -> BattleWinner {
        match self {
            EndPath::Victory(side) | EndPath::FfRoundCap(side) => side_winner(*side),
            EndPath::InstantSkip(d) => side_winner(d.winner),
            EndPath::Draw => BattleWinner::Remis,
        }
    }
}

/// `'atakujacy' | 'obronca'` dla strony.
pub fn side_winner(side: BattleSide) -> BattleWinner {
    match side {
        BattleSide::Attacker => BattleWinner::Atakujacy,
        BattleSide::Defender => BattleWinner::Obronca,
    }
}

/// Wejście producenta: migawka rosterów i stanu sceny w chwili `onFinish`.
#[derive(Debug, Clone, PartialEq)]
pub struct OutcomeInput<'a> {
    /// `this.atk` w kolejności rosteru.
    pub atk: &'a [OutcomeUnit],
    /// `this.def` w kolejności rosteru.
    pub def: &'a [OutcomeUnit],
    /// `this.siegeWallCol` (`>= 0` = oblężenie).
    pub siege_wall_col: i64,
    /// `this.wallEverBreached` przed ścieżką końca.
    pub wall_ever_breached: bool,
    /// Argument `_showEndScreen`, które utworzyło domknięcie `onFinish` (fallback `?? winner`, `:10721`).
    pub screen_winner: BattleWinner,
    /// Ostatnia ścieżka końca; `None` = `_endWinner === null` i `_endSurvivors = []` (stan po
    /// `_resetBattleRuntimeState`, `:10541-10542`).
    pub end: Option<EndPath>,
}

impl<'a> OutcomeInput<'a> {
    /// Zwykły przypadek: jedna ścieżka końca, która też otworzyła ekran końca (`screen_winner` = jej `_endWinner`).
    pub fn single(
        atk: &'a [OutcomeUnit],
        def: &'a [OutcomeUnit],
        siege_wall_col: i64,
        wall_ever_breached: bool,
        path: EndPath,
    ) -> Self {
        Self {
            atk,
            def,
            siege_wall_col,
            wall_ever_breached,
            screen_winner: path.end_winner(),
            end: Some(path),
        }
    }
}

/// Błąd producenta.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OutcomeError {
    /// Id jednostki powyżej `2^53 - 1` (kontrakt DTO, `view-model/src/ids.rs`).
    Id(IdOutOfRange),
    /// Roster dłuższy niż `u32::MAX` (liczniki `_sideEndStats`).
    RosterTooLarge(usize),
}

impl From<IdOutOfRange> for OutcomeError {
    fn from(e: IdOutOfRange) -> Self {
        OutcomeError::Id(e)
    }
}

fn unit_id(id: u64) -> Result<UnitId, OutcomeError> {
    Ok(UnitId::try_new(id)?)
}

/// Web `_battleUnitsForMapExport(roster)` (`:10246-10250`): `hp > 0 && (!dead || routed)`, `hp: Math.max(0, hp)`.
pub fn battle_units_for_map_export(
    roster: &[OutcomeUnit],
) -> Result<Vec<BattleSurvivorDto>, OutcomeError> {
    roster
        .iter()
        .filter(|u| u.hp > 0.0 && (!u.dead || u.routed))
        .map(|u| {
            Ok(BattleSurvivorDto {
                id: unit_id(u.id)?,
                hp: js_max0(u.hp),
            })
        })
        .collect()
}

/// Web `uniqueUnitIds` (`units/battleRoster.ts:26-28`): `[...new Set(units.map(u => String(u.id)))]` — pierwsze
/// wystąpienie, kolejność rosteru. Id silnika to `u64`, więc równość `String(id)` = równość liczby.
pub fn unique_unit_ids(roster: &[OutcomeUnit]) -> Result<Vec<UnitId>, OutcomeError> {
    let mut out: Vec<UnitId> = Vec::with_capacity(roster.len());
    for u in roster {
        let id = unit_id(u.id)?;
        if !out.contains(&id) {
            out.push(id);
        }
    }
    Ok(out)
}

fn count(n: usize) -> Result<u32, OutcomeError> {
    u32::try_from(n).map_err(|_| OutcomeError::RosterTooLarge(n))
}

/// Web `_sideEndStats(side)` (`:10257-10269`).
pub fn side_end_stats(roster: &[OutcomeUnit]) -> Result<BattleSideEndStatsDto, OutcomeError> {
    let (mut lost, mut remaining) = (0_usize, 0_usize);
    let (mut hp, mut hp_max) = (0.0_f64, 0.0_f64);
    for u in roster {
        let out = u.dead || u.routed;
        if out {
            lost += 1;
        } else {
            remaining += 1;
        }
        hp += if out { 0.0 } else { js_max0(u.hp) };
        hp_max += js_max0(u.max_hp);
    }
    Ok(BattleSideEndStatsDto {
        total: count(roster.len())?,
        lost: count(lost)?,
        remaining: count(remaining)?,
        hp,
        hp_max,
    })
}

fn winner_roster<'a>(input: &OutcomeInput<'a>, side: BattleSide) -> &'a [OutcomeUnit] {
    match side {
        BattleSide::Attacker => input.atk,
        BattleSide::Defender => input.def,
    }
}

/// Producent `BattleOutcomeDto` (web `onFinish`, `:10720-10729`).
///
/// # Errors
/// Id powyżej `2^53 - 1` albo roster dłuższy niż `u32::MAX`.
pub fn build_battle_outcome(input: &OutcomeInput<'_>) -> Result<BattleOutcomeDto, OutcomeError> {
    let is_siege = input.siege_wall_col >= 0;
    let mut wall_ever_breached = input.wall_ever_breached;
    let survivors = match &input.end {
        None => Vec::new(),
        Some(EndPath::Victory(side)) | Some(EndPath::FfRoundCap(side)) => {
            battle_units_for_map_export(winner_roster(input, *side))?
        }
        Some(EndPath::Draw) => {
            let mut v = battle_units_for_map_export(input.atk)?;
            v.extend(battle_units_for_map_export(input.def)?);
            v
        }
        Some(EndPath::InstantSkip(d)) => {
            // `:3720-3722`: „Pomiń” nie rozgrywa wyłomu — żywa machina atakującego = założony wyłom.
            if is_siege && d.attacker_has_live_siege_unit {
                wall_ever_breached = true;
            }
            d.survivors
                .iter()
                .map(|&(id, hp)| {
                    Ok(BattleSurvivorDto {
                        id: unit_id(id)?,
                        hp,
                    })
                })
                .collect::<Result<Vec<_>, OutcomeError>>()?
        }
    };
    let winner = input
        .end
        .as_ref()
        .map(EndPath::end_winner)
        .unwrap_or(input.screen_winner);
    Ok(BattleOutcomeDto {
        winner,
        survivors,
        // NIE_ZMIERZONO: teksty `this.log` bez producenta do P4-1I3 (#247).
        log: Vec::new(),
        attacker_unit_ids: unique_unit_ids(input.atk)?,
        defender_unit_ids: unique_unit_ids(input.def)?,
        wall_breached: if is_siege {
            Some(wall_ever_breached)
        } else {
            None
        },
        end_stats: BattleEndStatsDto {
            atk: side_end_stats(input.atk)?,
            def: side_end_stats(input.def)?,
        },
    })
}
