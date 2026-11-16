//! Producent nakladek mapy (`OverlaysViewDto`, kontrakt P4-1 §3.7).
//!
//! R-RUSTPORT-P4-1F6: `buildHighlight` (4 galezie `refreshBuildHighlight`, `main.ts:16351-16395`
//! @ `07d2fbd72`) i `selection` (`setSelectionHex(u.q, u.r, u.ownerId)`, `main.ts:7119`).
//!
//! Decyzja techniczna (kontrakt §3.7: „silnik (legalnosc budowy + odjecie heksow z cofaniem w tej
//! turze)”): filtr cofania w turze `filterBuildHighlightHexes` (`render/buildHighlight.ts:22-28`)
//! jest liczony **w producencie**; renderer dostaje heksy juz przefiltrowane
//! (`BuildHighlightDto.hexes`). Funkcja rendererowa
//! (`renderer/src/models/misc/build_highlight.rs:60`) zostaje bez zmian (poza allowlista).
//!
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

use civ_view_model as vm;
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::{BuildHighlightDto, BuildHighlightKind, PathRouteDto, SelectionDto};

use crate::domain::army_follow_auto_merge::{can_join_stack_at, FollowAutoMergeUnit};
use crate::domain::improvement_build::is_mine_improvement_key;
use crate::domain::pathfinding::ruch_jednostek::{
    compute_path, compute_reachable_occ, path_cost, CostFn, Klucz, RuchJednostka,
};
use crate::domain::playable::{PlayableState, PlayableUnit};
use crate::domain::playable_movement::{
    occupied_for_move, player_stack_at, preview_path, unit_with_planning_stack_ruch,
    PlayableMoveModel,
};
use crate::domain::player::{is_awaiting_first_player_city, HumanSeats};
use crate::domain::save_migrations::ARMY_STACK_LIMIT;
use crate::domain::OwnerRef;
use crate::domain::{PlayerId, PositionDto, UnitId};

/// Tryb podswietlenia budowy ze stanu UI (`foundCityMode`, `activeWonderId`, `buildModeOpen`,
/// `activeImprovementKey`, `buildApi`; `main.ts:16352`, `:16363`, `:16369`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BuildHighlightUi<'a> {
    /// `foundCityMode`.
    pub found_city_mode: bool,
    /// `!!activeWonderId`.
    pub wonder_active: bool,
    /// `buildModeOpen && !!buildApi`.
    pub build_mode_open: bool,
    /// `activeImprovementKey` (`None` = `null`/pusty).
    pub active_improvement_key: Option<&'a str>,
}

/// Zrodla silnika dla `refreshBuildHighlight` (wywolywane leniwie, tylko w aktywnej galezi, jak w pinie).
pub struct BuildHighlightSources<'a> {
    /// `Object.values(map.hexes)` -> `hex.coords` w kolejnosci mapy (`main.ts:16355-16356`).
    pub map_hexes: &'a [(i32, i32)],
    /// `isInStartReveal(q, r)` (`main.ts:16357`; `start_reveal::StartRevealContext::is_in_start_reveal`).
    pub is_in_start_reveal: &'a dyn Fn(i32, i32) -> bool,
    /// `canFoundPlayerCityAt(q, r).ok` (`main.ts:16358`;
    /// `start_reveal::StartRevealContext::can_found_player_city_at`).
    pub can_found_player_city_at: &'a dyn Fn(i32, i32) -> bool,
    /// `qualifyingWonderHexesForPlayer()` (`main.ts:16365`;
    /// `wonder_placement::list_qualifying_wonder_hexes_for_owner`).
    pub qualifying_wonder_hexes: &'a dyn Fn() -> Vec<(i32, i32)>,
    /// `buildApi.getQualifyingHexes(key)` (`main.ts:16376`;
    /// `improvement_build::…::get_qualifying_hexes`).
    pub qualifying_hexes: &'a dyn Fn(&str) -> Vec<(i32, i32)>,
    /// `pendingImprovementsTurn.getUndoKeySet()` (`main.ts:16377`; klucze `"q,r:key"`,
    /// `game/pending-improvements.ts:43`).
    pub pending_undo_keys: &'a HashSet<String>,
}

/// `filterBuildHighlightHexes(improvementKey, hexes, pendingUndoKeys)` (`render/buildHighlight.ts:22-28`):
/// odrzuca heks, gdy `"${q},${r}:${improvementKey}"` jest w `pendingUndoKeys`; kolejnosc reszty bez zmian.
#[must_use]
pub fn filter_build_highlight_hexes(
    improvement_key: &str,
    hexes: &[(i32, i32)],
    pending_undo_keys: &HashSet<String>,
) -> Vec<(i32, i32)> {
    hexes
        .iter()
        .filter(|(q, r)| !pending_undo_keys.contains(&format!("{q},{r}:{improvement_key}")))
        .copied()
        .collect()
}

/// `new Set(hexes.map(h => keyOf(h.q, h.r)))`: kolejnosc pierwszego wystapienia, bez powtorzen.
fn dedup_set_order(hexes: impl IntoIterator<Item = (i32, i32)>) -> Vec<vm::HexCoord> {
    let mut seen: HashSet<(i32, i32)> = HashSet::new();
    hexes
        .into_iter()
        .filter(|h| seen.insert(*h))
        .map(|(q, r)| vm::HexCoord::new(q, r))
        .collect()
}

/// Brak warstwy (`clearHighlight` + `clearMineEligibleOverlay`, `main.ts:16369-16373`): puste
/// `hexes` (kontrakt: „Empty `hexes` = no layer”); `kind` bez znaczenia, ustalony na `Improvement`.
fn no_layer() -> BuildHighlightDto {
    BuildHighlightDto {
        kind: BuildHighlightKind::Improvement,
        hexes: Vec::new(),
    }
}

/// `refreshBuildHighlight()` (`main.ts:16351-16395` @ `07d2fbd72`) jako DTO.
///
/// Kolejnosc galezi jak w pinie: zalozenie miasta (`:16352-16361`), cud (`:16363-16367`), brak
/// trybu budowy (`:16369-16373`), kopalnia zloza (`:16386-16390`), pozostale ulepszenia
/// (`:16391-16395`).
#[must_use]
pub fn build_highlight(
    ui: &BuildHighlightUi<'_>,
    src: &BuildHighlightSources<'_>,
) -> BuildHighlightDto {
    if ui.found_city_mode {
        let qual = src
            .map_hexes
            .iter()
            .copied()
            .filter(|&(q, r)| (src.is_in_start_reveal)(q, r))
            .filter(|&(q, r)| (src.can_found_player_city_at)(q, r));
        return BuildHighlightDto {
            kind: BuildHighlightKind::FoundCity,
            hexes: dedup_set_order(qual),
        };
    }
    if ui.wonder_active {
        return BuildHighlightDto {
            kind: BuildHighlightKind::Wonder,
            hexes: dedup_set_order((src.qualifying_wonder_hexes)()),
        };
    }
    let Some(key) = ui.active_improvement_key.filter(|k| !k.is_empty()) else {
        return no_layer();
    };
    if !ui.build_mode_open {
        return no_layer();
    }
    let hexes =
        filter_build_highlight_hexes(key, &(src.qualifying_hexes)(key), src.pending_undo_keys);
    let kind = if is_mine_improvement_key(Some(key)) {
        BuildHighlightKind::Mine
    } else {
        BuildHighlightKind::Improvement
    };
    BuildHighlightDto {
        kind,
        hexes: dedup_set_order(hexes),
    }
}

/// Stan UI zaznaczenia (`UiState.selectedUnitId`, kontrakt §3.7, D-CMD-12): przekazywany do
/// producenta przez wolajacego; `PlayableState.selected_unit_id` nie jest czytany.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct SelectionUi {
    /// `selectedId`.
    pub selected_unit_id: Option<u64>,
}

/// `selection` (`setSelectionHex(u.q, u.r, u.ownerId)`, `main.ts:7119`, `:7262`, `:14854`): heks i
/// wlasciciel zaznaczonej jednostki z `units[]`; brak zaznaczenia albo jednostki o tym id -> `None`.
/// Wspolrzedne: `PositionDto(x, y)` = `HexCoord(q = x, r = y)` (kontrakt §1.4).
#[must_use]
pub fn selection(ui: &SelectionUi, units: &[PlayableUnit]) -> Option<SelectionDto> {
    let id = ui.selected_unit_id?;
    let unit = units.iter().find(|u| u.id.get() == id)?;
    let owner = vm::PlayerId::try_new(unit.owner_id.get()).ok()?;
    Some(SelectionDto {
        hex: vm::HexCoord::new(i32::from(unit.position.x()), i32::from(unit.position.y())),
        owner_id: vm::OwnerRef::Player(owner),
    })
}
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
