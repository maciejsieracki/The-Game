//! K5DOC-T8 (dispatch R-RUSTPORT-P6-K5DOC-T8-Q1, #264): krok doktryny grupy `_executeGroupDoctrineStep`
//! (`gra/src/battle/battleScene.ts:17966-18084`, pin `07d2fbd72`) z `_executeSkirmishDoctrineStep` (`:18087-18124`),
//! `_doctrineMoveDest` (`:17931-17963`, gałęzie osiągalne z tych dwóch metod) oraz odczyty doktryny jednostki
//! `_getEffectiveDoctrine` (`:17612-17619`) i `_isUnitDoctrineAuto` (`:17621-17630`).
//!
//! Moduł jest czysty: zwraca DECYZJĘ (która metoda pinu wykonuje turę jednostki), a jej treść (`_cavalryAction`,
//! `_rangedAction`, `_advanceStep`, `_doAttack`) wykonuje ciało [`crate::domain::siege_tactics_loop::ProdBody`] tymi
//! samymi klockami co gałęzie `_activateUnit` (K5LOOP-CLOSE r1-r4). Wybór celu: klocki K5DOC-T2
//! ([`pick_ranged_target_by_priority`], [`pick_adjacent_target_by_priority`], [`pick_target_by_priority`]).
//!
//! Gałęzie `_executeGroupDoctrineStep` w kolejności pinu:
//! * `defensive` (`:17967-17985`): strzał `_pickRangedTargetByPriority` (gdy `canShoot && shootingEnabled`), cios
//!   `_pickAdjacentTargetByPriority`, inaczej `done()`.
//! * `skirmish` (`:17986-17988`) -> [`skirmish_doctrine_step`].
//! * `steady` + jazda (`:17992-17995`): `_cavalryAction`.
//! * `steady` + `canShoot && shootingEnabled` (`:18001-18017`): strzał w cel `_pickRangedTargetByPriority`, inaczej
//!   `_rangedAction`.
//! * `steady` (`:18022-18025`): `_advanceStep`.
//! * `aggressive` (`:18027-18050`): jazda `_cavalryAction`; strzał; cios w sąsiada; `moveLeft <= 0` = `done()`;
//!   inaczej `_advanceStep`.
//! * ogon (`:18051-18083`): strzał, cios, `_doctrineMoveDest` i rozkaz ruchu. Z `_activateUnit` nieosiągalny (każda
//!   doktryna poza `manual` kończy wyżej, a `manual` odcina wołający, `:6096`); portowany 1:1 dla `manual`, bo funkcja
//!   pinu jest totalna.
//!
//! Każda ścieżka pinu kończy się `return true` ([`DoctrineStep::returns`]).
//!
//! Rozkaz ruchu (`ru.playerOrder = { type: 'move', ... }` + `_performPlayerOrder(ru, finish)`, `:18072-18082`,
//! `:18112-18122`) jest zwracany jako [`DoctrineAction::MoveOrder`]; jego wykonanie (`_performPlayerOrder`,
//! `:18280-18352`) to K5EXEC-T3 (#268), w ciele jawny tag, nie ciche pominięcie.

use crate::domain::formation_rules::CompactSide;
use crate::domain::player_order_move_gate::{dest_allowed_by_blockade, BlockadeSettings};
use crate::domain::siege_tactics_doctrine_geometry::move_target_for_unit;
use crate::domain::siege_tactics_doctrine_state::{forward_col, GroupDoctrine};
use crate::domain::siege_tactics_doctrine_target::{
    pick_adjacent_target_by_priority, pick_ranged_target_by_priority, pick_target_by_priority,
    Combatant, TargetPriorities,
};
use crate::domain::siege_tactics_end::BattleSide;

/// Web `_getEffectiveDoctrine(ru)` (`battleScene.ts:17612-17619`): `ru.unitDoctrine`, potem doktryna grupy
/// (`this._groupMeta.get(ru.groupId)`, `group` = `None` gdy brak `groupId` albo wpisu), inaczej `'steady'`.
pub fn effective_doctrine(
    unit_doctrine: Option<GroupDoctrine>,
    group: Option<GroupDoctrine>,
) -> GroupDoctrine {
    if let Some(d) = unit_doctrine {
        return d;
    }
    if let Some(d) = group {
        return d;
    }
    GroupDoctrine::Steady
}

/// Web `_isUnitDoctrineAuto(ru)` (`battleScene.ts:17621-17630`). `has_group` = `ru.groupId` prawdziwe w JS
/// (niepusty napis); `group` = `(doctrine, autoPlay)` wpisu `this._groupMeta.get(ru.groupId)` albo `None`.
pub fn is_unit_doctrine_auto(
    unit_doctrine: Option<GroupDoctrine>,
    has_group: bool,
    group: Option<(GroupDoctrine, bool)>,
) -> bool {
    let doc = effective_doctrine(
        unit_doctrine,
        if has_group { group.map(|g| g.0) } else { None },
    );
    if doc == GroupDoctrine::Manual {
        return false;
    }
    if unit_doctrine.is_some() {
        return true;
    }
    if has_group {
        // `meta?.autoPlay ?? true`
        return group.is_none_or(|g| g.1);
    }
    true
}

/// Pola `ru` czytane przez krok doktryny (poza [`Combatant`] dla wyboru celu).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DoctrineStepUnit {
    pub side: BattleSide,
    pub q: i64,
    pub r: i64,
    /// `ru.groupId` prawdziwe w JS (`_effectiveMetaForUnit` liczy punkt zbiórki tylko bez grupy, `:17643`).
    pub has_group: bool,
    /// `ru.mounted`.
    pub mounted: bool,
    /// `canShoot(ru)` = `ru.rangedBase && ru.ammoLeft > 0` (`:1457-1459`).
    pub can_shoot: bool,
    /// `ru.shootingEnabled !== false`.
    pub shooting_enabled: bool,
    /// `ru.primaryRanged`.
    pub primary_ranged: bool,
    /// `ru.rangedBase`.
    pub ranged_base: bool,
    /// `ru.range` po `_applyTerrainRange` (`:6064`).
    pub range: f64,
    /// `ru.moveLeft` (bramka `aggressive`, `:18044`; `NaN` nie spełnia `<= 0`, jak w JS).
    pub move_left: f64,
    /// `ru.formationOffset` (`:2037`; spawn `null`, `:4575`) dla `_moveTargetForUnit` (`:11442-11448`).
    pub formation_offset: Option<(i64, i64)>,
}

/// Metoda pinu, która wykonuje turę jednostki po kroku doktryny.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DoctrineAction {
    /// `done()` bez akcji.
    Done,
    /// `_doAttack(ru, enemies[i], done)` (indeks w liście strony przeciwnej; strzał, gdy `canShoot`, `:8787-8797`).
    Attack(usize),
    /// `_cavalryAction(ru, done)`.
    CavalryAction,
    /// `_rangedAction(ru, done)`.
    RangedAction,
    /// `_advanceStep(ru, done)`.
    AdvanceStep,
    /// `ru.playerOrder = { type: 'move', col, row }` + `_performPlayerOrder(ru, finish)`.
    MoveOrder { col: i64, row: i64 },
}

/// Wynik `_executeGroupDoctrineStep`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DoctrineStep {
    /// Wartość zwracana przez metodę pinu (każda ścieżka: `return true`).
    pub returns: bool,
    pub action: DoctrineAction,
    /// `ru.rangedKite = true` (`_executeSkirmishDoctrineStep`, `:18092`), przed akcją.
    pub set_ranged_kite: bool,
}

/// Doktryna przekazywana do `_doctrineMoveDest` z osiągalnych wywołań: `skirmish` (`:18103`) i ogon `:18063`
/// (wyłącznie `manual`, patrz nagłówek modułu). Gałęzie `steady` z grupą (`_attackFormationRallyPoint`) i
/// `aggressive` (`_chargeMoveDest`) są stąd nieosiągalne (K5DOC-T3, `siege_tactics_doctrine_geometry`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum MoveDestDoctrine {
    Skirmish,
    Manual,
}

fn compact_side(side: BattleSide) -> CompactSide {
    match side {
        BattleSide::Attacker => CompactSide::Atk,
        BattleSide::Defender => CompactSide::Def,
    }
}

/// Web `_doctrineMoveDest(ru, meta)` (`battleScene.ts:17931-17963`) dla `skirmish` / `manual`.
///
/// Punkt zbiórki `meta.rallyCol/rallyRow` z `_effectiveMetaForUnit` (`:17643-17646`): bez grupy i dla `steady`/`skirmish`
/// = `(_forwardCol(side, q, 2), r)`. Z grupą meta pochodzi z `_ensureGroupMeta` (`{ doctrine, autoPlay }`, `:17589`),
/// bez punktu zbiórki (ustawia go wyłącznie UI `_setGroupDoctrine`, `:17891-17900`), więc cel = `_pickTargetByPriority`.
fn doctrine_move_dest(
    d: MoveDestDoctrine,
    u: &DoctrineStepUnit,
    me: &Combatant,
    enemies: &[Combatant],
    army: &TargetPriorities,
    blockade: BlockadeSettings,
) -> Option<(i64, i64)> {
    if d == MoveDestDoctrine::Skirmish && (u.primary_ranged || u.ranged_base) {
        return None;
    }
    let side = compact_side(u.side);
    let rally = (!u.has_group && d == MoveDestDoctrine::Skirmish)
        .then(|| (forward_col(u.side, u.q, 2), u.r));
    if let Some((col, row)) = rally {
        let dest = move_target_for_unit(u.formation_offset, col, row);
        #[allow(clippy::cast_precision_loss)]
        if !dest_allowed_by_blockade(blockade, side, dest.col as f64) {
            return None;
        }
        return Some((dest.col, dest.row));
    }
    let t = pick_target_by_priority(me, enemies, army, None)?;
    let tgt = &enemies[t];
    #[allow(clippy::cast_precision_loss)]
    if !dest_allowed_by_blockade(blockade, side, tgt.q as f64) {
        return None;
    }
    Some((tgt.q, tgt.r))
}

fn step(action: DoctrineAction) -> DoctrineStep {
    DoctrineStep {
        returns: true,
        action,
        set_ranged_kite: false,
    }
}

/// Web `_executeSkirmishDoctrineStep(ru, meta, done)` (`battleScene.ts:18087-18124`).
fn skirmish_doctrine_step(
    u: &DoctrineStepUnit,
    me: &Combatant,
    enemies: &[Combatant],
    army: &TargetPriorities,
    blockade: BlockadeSettings,
) -> DoctrineStep {
    let is_ranged = u.primary_ranged || u.ranged_base || (u.range > 1.0 && u.can_shoot);
    let mut kite = false;
    if is_ranged && u.shooting_enabled {
        kite = true;
        if u.can_shoot {
            return DoctrineStep {
                returns: true,
                action: DoctrineAction::RangedAction,
                set_ranged_kite: true,
            };
        }
    }
    let with_kite = |action| DoctrineStep {
        returns: true,
        action,
        set_ranged_kite: kite,
    };
    if let Some(adj) = pick_adjacent_target_by_priority(me, enemies, army, None) {
        return with_kite(DoctrineAction::Attack(adj));
    }
    let dest = doctrine_move_dest(MoveDestDoctrine::Skirmish, u, me, enemies, army, blockade);
    let Some((col, row)) = dest.filter(|&(c, r)| !(c == u.q && r == u.r)) else {
        return with_kite(DoctrineAction::Done);
    };
    #[allow(clippy::cast_precision_loss)]
    if !dest_allowed_by_blockade(blockade, compact_side(u.side), col as f64) {
        return with_kite(DoctrineAction::Done);
    }
    with_kite(DoctrineAction::MoveOrder { col, row })
}

/// Web `_executeGroupDoctrineStep(ru, meta, done)` (`battleScene.ts:17966-18084`). `doctrine` = `meta.doctrine`
/// z `_effectiveMetaForUnit` (= [`effective_doctrine`], `:17634`). `me` i `enemies` (lista strony przeciwnej w
/// kolejności sceny) służą wyborowi celu; `blockade` = `this._generalSettings` (`:2335-2340`).
pub fn execute_group_doctrine_step(
    doctrine: GroupDoctrine,
    u: &DoctrineStepUnit,
    me: &Combatant,
    enemies: &[Combatant],
    army: &TargetPriorities,
    blockade: BlockadeSettings,
) -> DoctrineStep {
    let shoots = u.can_shoot && u.shooting_enabled;
    let ranged_pick = || pick_ranged_target_by_priority(me, enemies, army, None);
    let adjacent_pick = || pick_adjacent_target_by_priority(me, enemies, army, None);
    match doctrine {
        GroupDoctrine::Defensive => {
            if shoots {
                if let Some(t) = ranged_pick() {
                    return step(DoctrineAction::Attack(t));
                }
            }
            if let Some(t) = adjacent_pick() {
                return step(DoctrineAction::Attack(t));
            }
            step(DoctrineAction::Done)
        }
        GroupDoctrine::Skirmish => skirmish_doctrine_step(u, me, enemies, army, blockade),
        GroupDoctrine::Steady => {
            if u.mounted {
                return step(DoctrineAction::CavalryAction);
            }
            if shoots {
                if let Some(t) = ranged_pick() {
                    return step(DoctrineAction::Attack(t));
                }
                return step(DoctrineAction::RangedAction);
            }
            step(DoctrineAction::AdvanceStep)
        }
        GroupDoctrine::Aggressive => {
            if u.mounted {
                return step(DoctrineAction::CavalryAction);
            }
            if shoots {
                if let Some(t) = ranged_pick() {
                    return step(DoctrineAction::Attack(t));
                }
            }
            if let Some(t) = adjacent_pick() {
                return step(DoctrineAction::Attack(t));
            }
            if u.move_left <= 0.0 {
                return step(DoctrineAction::Done);
            }
            step(DoctrineAction::AdvanceStep)
        }
        GroupDoctrine::Manual => {
            if shoots {
                if let Some(t) = ranged_pick() {
                    return step(DoctrineAction::Attack(t));
                }
            }
            if let Some(t) = adjacent_pick() {
                return step(DoctrineAction::Attack(t));
            }
            let dest = doctrine_move_dest(MoveDestDoctrine::Manual, u, me, enemies, army, blockade);
            match dest {
                Some((col, row)) if !(col == u.q && row == u.r) => {
                    step(DoctrineAction::MoveOrder { col, row })
                }
                _ => step(DoctrineAction::Done),
            }
        }
    }
}
