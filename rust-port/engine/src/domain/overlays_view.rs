//! P4-1F (`R-RUSTPORT-P4-1F*`): producenci pol `OverlaysViewDto` (nakladki mapy swiata) z
//! `PlayableState`. Pin: `07d2fbd72` (`gra/src/main.ts`, `gra/src/units/setup.ts`,
//! `gra/src/game/planned-march.ts`, `gra/src/game/army-stack-limit.ts`).
//!
//! P4-1F5 (`R-RUSTPORT-P4-1F5-REACH-PATH-VIEW`, #273 / #242): `overlays.reachable` i
//! `overlays.pathRoute`.
//! - `reachable` = web `reachableWithMergeTargets(u)` (`main.ts:14706-14731`) w warunkach
//!   `syncPlayerUnitSelectionOnMap` (`main.ts:7115-7134`): zasieg `computeReachable` z zajetoscia
//!   `occupiedForMove` (`buildMoveOccupancy` z `passThrough` + `foreignCityHexKeys`,
//!   `main.ts:14578-14585`) oraz heksy wlasnych stosow osiagalne kosztem ruchu, o ile caly
//!   ruszajacy sie stos sie tam zmiesci (`canJoinStackAt`, `army-stack-limit.ts:55-66`).
//! - `pathRoute` = web `refreshPlannedMarchPreview` / `refreshHoverPathPreview`
//!   (`main.ts:31146-31211`) przez zapytanie P4-1H `preview_path` (kontrakt bez zmian). Sklad
//!   `marchPathPlan` (`main.ts:31110-31122`) = `planPathTurns` + `applyFogToPathPlan` ma JEDNO
//!   miejsce w produkcji: `playable_movement::preview_path_plan` (obrona r1, zarzut 3: usunieto
//!   duplikat `march_path_plan` i `path_route_of`).
//!
//! Decyzje techniczne (raport `01-operator-r1.md`):
//! - `moveCostFnForUnit(u)` -> `None` (ta sama decyzja co P4-1H `preview_path_plan`: stan nie ma
//!   `embarked` ani Zeglugi wlasciciela; erratum P4-1H, `ownerHasSeafaring` = `false`);
//! - `siegeBlocksEntry` -> `None` (brak stanu oblezenia w `PlayableState`);
//! - `isSiegeMapPanelOpen()` to stan UI (panel), nie stanu gry: producent go nie widzi, warstwa UI
//!   czysci `reachable`, gdy panel jest otwarty;
//! - `armyStackLimit()` = `save_migrations::ARMY_STACK_LIMIT` (web `BATTLE_MAX_PER_SIDE`);
//! - `isMe(owner)` = `owner === ME()` (`main.ts:13748-13750`), `ME()` = aktywny fotel
//!   (`main.ts:13729-13731`): [`HumanSeats::is_active_human`]. `PlayableState` nie ma pola
//!   aktywnego fotela, wiec aktywny = pierwszy gracz `is_human` (web `HUMAN_OWNER_PRIMARY`, jeden
//!   fotel). Dlug hot-seat (aktywny fotel w stanie): #281.
//!
//! Wolajacy produkcyjny (agregator `OverlaysViewDto` / adapter renderera) jeszcze nie istnieje:
//! wpiecie `reachable_overlay` i `path_route_overlay` nalezy do P4-1G Q6 / PRIO-3D-2 (#237 / #270).

use std::collections::HashSet;

use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::PathRouteDto;

use crate::domain::army_follow_auto_merge::{can_join_stack_at, FollowAutoMergeUnit};
use crate::domain::pathfinding::ruch_jednostek::{
    compute_path, compute_reachable_occ, path_cost, CostFn, Klucz, RuchJednostka,
};
use crate::domain::playable::PlayableState;
use crate::domain::playable_movement::{
    occupied_for_move, player_stack_at, preview_path, unit_with_planning_stack_ruch,
    PlayableMoveModel,
};
use crate::domain::player::{is_awaiting_first_player_city, HumanSeats};
use crate::domain::save_migrations::ARMY_STACK_LIMIT;
use crate::domain::OwnerRef;
use crate::domain::{PlayerId, PositionDto, UnitId};

/// Jednostka modelu ruchu jako web `StackUnitLike` dla `canJoinStackAt` (`army-stack-limit.ts`).
fn stack_unit_like(unit: &RuchJednostka) -> FollowAutoMergeUnit {
    FollowAutoMergeUnit {
        id: unit.id.clone(),
        owner_id: unit.owner_id,
        q: i64::from(unit.q),
        r: i64::from(unit.r),
        follow_general: false,
        is_general: false,
    }
}

fn unit_ids_of(stack: &[&RuchJednostka]) -> Vec<UnitId> {
    stack
        .iter()
        .filter_map(|u| u.id.parse::<u64>().ok().map(UnitId::new))
        .collect()
}

fn hex_of(key: Klucz) -> HexCoord {
    HexCoord::new(key.0, key.1)
}

/// Web `reachableWithMergeTargets(unit)` (`main.ts:14706-14731`), kolejnosc = kolejnosc
/// wstawiania web `Set` (najpierw `computeReachable`, potem dopisane heksy stosow w kolejnosci
/// `units`). Czysta funkcja; pusta, gdy jednostka nie istnieje.
///
/// Kroki pinu:
/// - `stack = playerStackAt(unit)`, `mover = unitWithPlanningStackRuch(unit, stack)`,
///   `exceptIds = stack ids`, `occ = occupiedForMove(unit.ownerId, ...exceptIds)` (`:14707-14710`);
/// - `reach = computeReachable(mover, map, occ, costFn)` (`:14713`, `setup.ts:840-975`: heksy
///   `passThrough` sa przechodnie, ale nie trafiaja do zasiegu);
/// - `mover.ruchLeft <= 0` -> `reach` (`:14714`);
/// - dla kazdej wlasnej jednostki spoza stosu, na innym heksie niz `unit`, raz na heks
///   (`seenStacks`, `:14716-14722`): `canJoinStackAt(units, stack, q, r, armyStackLimit())`
///   (`:14724`), `computePath(mover, map, q, r, occ, costFn)` niepusta (`:14726-14727`) i
///   `pathCost(path, map, costFn) <= mover.ruchLeft` (`:14728`) -> heks dopisany.
pub fn reachable_with_merge_targets(state: &PlayableState, unit_id: UnitId) -> Vec<HexCoord> {
    let model = PlayableMoveModel::from_state(state);
    let Some(unit) = model.jednostka(unit_id) else {
        return Vec::new();
    };
    let stack = player_stack_at(&model.jednostki, unit);
    let mover = unit_with_planning_stack_ruch(unit, &stack);
    let except_ids: Vec<&str> = stack.iter().map(|u| u.id.as_str()).collect();
    let occ = occupied_for_move(state, unit.owner_id, &unit_ids_of(&stack));
    let cost_fn: Option<&CostFn<'_>> = None;
    let mut reach = compute_reachable_occ(&mover, &model.mapa, &occ, None, cost_fn);
    if mover.ruch_left <= 0.0 {
        return reach.iter().map(hex_of).collect();
    }

    let all_units: Vec<FollowAutoMergeUnit> = model.jednostki.iter().map(stack_unit_like).collect();
    let moving: Vec<FollowAutoMergeUnit> = stack.iter().map(|u| stack_unit_like(u)).collect();
    let unit_key = (unit.q, unit.r);
    let mut seen_stacks: HashSet<Klucz> = HashSet::new();
    for other in &model.jednostki {
        if other.owner_id != unit.owner_id || except_ids.contains(&other.id.as_str()) {
            continue;
        }
        let key = (other.q, other.r);
        if key == unit_key {
            continue;
        }
        if !seen_stacks.insert(key) {
            continue;
        }
        if !can_join_stack_at(
            &all_units,
            &moving,
            i64::from(other.q),
            i64::from(other.r),
            ARMY_STACK_LIMIT,
        ) {
            continue;
        }
        let path = compute_path(
            &mover,
            &model.mapa,
            f64::from(other.q),
            f64::from(other.r),
            &occ.blocked,
            cost_fn,
        );
        if path.is_empty() {
            continue;
        }
        if path_cost(&path, &model.mapa, cost_fn) <= mover.ruch_left {
            reach.insert(key);
        }
    }
    reach.iter().map(hex_of).collect()
}

/// Web `ME()` (`main.ts:13729-13731`, `humanSeats.activeHumanOwnerId`): aktywny fotel. Stan nie ma
/// pola aktywnego fotela -> pierwszy gracz `is_human` (`HUMAN_OWNER_PRIMARY`); dlug #281.
fn human_seats(state: &PlayableState) -> Option<HumanSeats> {
    let humans: Vec<PlayerId> = state
        .players
        .iter()
        .filter(|p| p.is_human)
        .map(|p| p.id)
        .collect();
    let active = *humans.first()?;
    Some(HumanSeats::new(humans, active))
}

/// Web `isMe(ownerId)` = `ownerId === ME()` (`main.ts:13748-13750`): TYLKO aktywny fotel, nie
/// dowolny fotel ludzki (`isHuman`).
fn is_me(state: &PlayableState, owner: PlayerId) -> bool {
    human_seats(state).is_some_and(|seats| seats.is_active_human(OwnerRef::Player(owner)))
}

/// Web `isAwaitingFirstPlayerCity(ownerId = ME())` (`main.ts:12882-12884`): flaga
/// `graczKiedysMialMiasto` + miasta stanu (`player::is_awaiting_first_player_city`). Wolane po
/// bramce `isMe(u.ownerId)`, wiec `u.ownerId` == `ME()` - argument domyslny pinu.
fn awaiting_first_city(state: &PlayableState, owner: PlayerId) -> bool {
    is_awaiting_first_player_city(
        state.gracz_kiedys_mial_miasto,
        state
            .cities
            .iter()
            .map(|city| OwnerRef::Player(city.owner_id)),
        owner,
    )
}

/// Pole `overlays.reachable` dla zaznaczonej jednostki: web `syncPlayerUnitSelectionOnMap`
/// (`main.ts:7115-7134`):
/// - brak zaznaczenia, brak jednostki albo jednostka nie gracza (`!isMe`) -> pusty (`:7116-7118`);
/// - `stackCanMove(u)` (`planningStackRuchLeft(playerStackAt(u)) > 0`, `:14701-14703`) i
///   `!isAwaitingFirstPlayerCity()` -> [`reachable_with_merge_targets`] (`:7123-7125`);
/// - inaczej pusty (`:7127-7129`).
///
/// `isSiegeMapPanelOpen()` (`:7120-7122`) to stan UI - patrz naglowek modulu.
pub fn reachable_overlay(state: &PlayableState) -> Vec<HexCoord> {
    let Some(selected) = state.selected_unit_id else {
        return Vec::new();
    };
    let unit_id = UnitId::new(selected);
    let Some(unit) = state.units.iter().find(|u| u.id == unit_id) else {
        return Vec::new();
    };
    if !is_me(state, unit.owner_id) {
        return Vec::new();
    }
    let model = PlayableMoveModel::from_state(state);
    let Some(ruch) = model.jednostka(unit_id) else {
        return Vec::new();
    };
    let stack = player_stack_at(&model.jednostki, ruch);
    let stack_can_move = unit_with_planning_stack_ruch(ruch, &stack).ruch_left > 0.0;
    if !stack_can_move || awaiting_first_city(state, unit.owner_id) {
        return Vec::new();
    }
    reachable_with_merge_targets(state, unit_id)
}

/// Pole `overlays.pathRoute` dla zaznaczonej jednostki: zapytanie P4-1H
/// [`preview_path`](crate::domain::playable_movement::preview_path) (kontrakt bez zmian):
/// jednostka z planem marszu (`planned_marches`) -> trasa planu (`refreshPlannedMarchPreview`,
/// `main.ts:31146-31179`; plan ma pierwszenstwo nad kursorem, `main.ts:32335-32338`); bez planu ->
/// heks pod kursorem `hover` (`refreshHoverPathPreview`, `main.ts:31181-31211`). Brak zaznaczenia
/// -> `None` (`main.ts:31148-31150`).
pub fn path_route_overlay(
    state: &PlayableState,
    hover: Option<PositionDto>,
) -> Option<PathRouteDto> {
    let selected = state.selected_unit_id?;
    preview_path(state, UnitId::new(selected), hover)
}
