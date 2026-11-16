//! Bramki ruchu jednostek (tryb AUTO i rozkazy gracza): blokada linii, krok zwarcia, anty-cofanie.
//!
//! Port 1:1 z webu, pin `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt):
//!   * `_destAllowedByBlockade`      — battleScene.ts:17809-17815 -> [`dest_allowed_by_blockade`]
//!   * `_compactAttackAllowsStep`    — battleScene.ts:8139-8172   -> [`compact_attack_allows_step`]
//!   * `_shouldAvoidAutoBacktrack`   — battleScene.ts:8191-8196   -> [`should_avoid_auto_backtrack`]
//!
//! Moduł jest czysty: nie czyta stanu UI ani sceny. Stan bitwy wchodzi jawnie jako argumenty
//! (flagi jednostki, lista jednostek tej samej strony, ustawienia blokady, meta grup).
//! Wektory: `tests/p6_player_order_move_gate_gen.mjs` (wykonanie kodu z pinu).

use super::formation_rules::{compact_line_allows_advance, CompactSide};

/// Doktryna grupy / jednostki (web: `GroupDoctrine`, battleScene.ts:1938).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GroupDoctrine {
    Defensive,
    Steady,
    Aggressive,
    Skirmish,
    Manual,
}

/// Ustawienia blokady linii (web: `this._generalSettings.blockadeActive` / `blockadeCol`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BlockadeSettings {
    pub active: bool,
    pub col: Option<f64>,
}

/// Czy cel ruchu w kolumnie `col` nie łamie blokady linii.
///
/// Web battleScene.ts:17809-17815:
/// `if (!blockadeActive || blockadeCol == null) return true;`
/// atk: `col <= block`; def: `col >= block`.
pub fn dest_allowed_by_blockade(settings: BlockadeSettings, side: CompactSide, col: f64) -> bool {
    if !settings.active {
        return true;
    }
    let Some(block) = settings.col else {
        return true;
    };
    match side {
        CompactSide::Atk => col <= block,
        CompactSide::Def => col >= block,
    }
}

/// Jednostka, dla której liczona jest bramka kroku zwarcia (pola `RuntimeBattleUnit` używane przez web).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CompactStepUnit {
    pub side: CompactSide,
    /// Wynik `this._effectiveMetaForUnit(ru).doctrine` (liczony przez wołającego).
    pub doctrine: GroupDoctrine,
    pub mounted: bool,
    /// Wynik `isSiegeUnit(ru.bu)` (liczony przez wołającego).
    pub siege: bool,
    /// `ru.formationRank` (web: `?? 0`, potem `Math.max(0, Math.floor(...))`).
    pub formation_rank: Option<f64>,
    /// `ru.q` (kolumna).
    pub q: f64,
    /// `ru.r` (wiersz).
    pub r: f64,
}

/// Jednostka tej samej strony w liście `this.atk` / `this.def` (potrzebna do wyznaczenia linii poprzedniej rangi).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LineMember {
    pub q: f64,
    pub r: f64,
    pub formation_rank: Option<f64>,
    pub mounted: bool,
    pub siege: bool,
    /// `!u.dead && !u.fadingOut && !u.removed && !u.routed` — wyliczone przez wołającego.
    pub in_play: bool,
}

/// Web `Math.max(0, Math.floor(u.formationRank ?? 0))`.
fn rank_of(rank: Option<f64>) -> f64 {
    rank.unwrap_or(0.0).floor().max(0.0)
}

/// Web: `ru.side === 'atk' ? x : -x`.
fn progress(side: CompactSide, col: f64) -> f64 {
    match side {
        CompactSide::Atk => col,
        CompactSide::Def => -col,
    }
}

/// Bramka kroku zwarcia dla piechoty w doktrynie Steady (battleScene.ts:8139-8172).
///
/// Zasady:
/// * poza doktryną Steady, dla konnych i oblężniczych — zawsze dozwolone;
/// * cofnięcie (postęp < bieżący) — zabronione (anty-cofanie);
/// * ten sam postęp (ruch bocznie) — dozwolone;
/// * postęp w przód — ograniczone przez [`compact_line_allows_advance`] z referencją linii poprzedniej rangi.
///
/// `line` to lista jednostek tej samej strony co `unit` (może zawierać też `unit`).
pub fn compact_attack_allows_step(
    unit: CompactStepUnit,
    candidate_col: f64,
    line: &[LineMember],
) -> bool {
    if unit.doctrine != GroupDoctrine::Steady || unit.mounted || unit.siege {
        return true;
    }
    let rank = rank_of(unit.formation_rank);
    let current_progress = progress(unit.side, unit.q);
    let next_progress = progress(unit.side, candidate_col);
    // Anty-cofanie: Attack nie może cofać się o kolumnę (web: nextProgress < currentProgress -> false).
    if next_progress < current_progress {
        return false;
    }
    if next_progress == current_progress {
        return true;
    }
    // Jednostki poprzedniej rangi (rank - 1), grywalne, niejeżdzieckie, nieoblężnicze.
    let previous: Vec<&LineMember> = if rank > 0.0 {
        line.iter()
            .filter(|u| {
                u.in_play && !u.mounted && rank_of(u.formation_rank) == rank - 1.0 && !u.siege
            })
            .collect()
    } else {
        Vec::new()
    };
    let previous_reference = if previous.is_empty() {
        None
    } else {
        let nearest_gap = previous
            .iter()
            .map(|u| (u.r - unit.r).abs())
            .fold(f64::INFINITY, f64::min);
        let lane: Vec<f64> = previous
            .iter()
            .filter(|u| (u.r - unit.r).abs() == nearest_gap)
            .map(|u| progress(unit.side, u.q))
            .collect();
        if lane.is_empty() {
            None
        } else {
            Some(lane.iter().copied().fold(f64::INFINITY, f64::min))
        }
    };
    compact_line_allows_advance(
        unit.side,
        candidate_col,
        current_progress,
        previous_reference,
    )
}

/// Doktryna grupy wraz z metą grupy (web: `GroupMeta` = `{ doctrine, autoPlay }`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GroupMeta {
    pub doctrine: GroupDoctrine,
    pub auto_play: bool,
}

/// Jednostka dla anty-cofania automatu.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BacktrackUnit {
    /// `ru.unitDoctrine` (`null` -> None).
    pub unit_doctrine: Option<GroupDoctrine>,
    /// `ru.groupId` jest niepusty (truthy w JS).
    pub has_group_id: bool,
    /// `this._groupMeta?.get(ru.groupId)`; wołający podaje None, gdy brak groupId lub brak wpisu.
    pub group_meta: Option<GroupMeta>,
}

/// Czy automat ma unikać cofania (web battleScene.ts:8191-8196).
///
/// `doctrine = ru.unitDoctrine ?? meta?.doctrine ?? 'steady'`;
/// `auto = doctrine !== 'manual' && (ru.unitDoctrine != null || !ru.groupId || (meta?.autoPlay ?? true))`;
/// wynik: `auto && doctrine === 'steady'`.
pub fn should_avoid_auto_backtrack(unit: BacktrackUnit) -> bool {
    // Web: `ru.groupId ? this._groupMeta?.get(ru.groupId) : undefined`.
    let meta = if unit.has_group_id {
        unit.group_meta
    } else {
        None
    };
    let doctrine = unit
        .unit_doctrine
        .or(meta.map(|m| m.doctrine))
        .unwrap_or(GroupDoctrine::Steady);
    let auto = doctrine != GroupDoctrine::Manual
        && (unit.unit_doctrine.is_some() || !unit.has_group_id || meta.is_none_or(|m| m.auto_play));
    auto && doctrine == GroupDoctrine::Steady
}
