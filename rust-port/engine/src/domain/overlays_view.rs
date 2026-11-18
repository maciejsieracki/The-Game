//! Producent nakladek mapy (`OverlaysViewDto`, kontrakt P4-1 §3.7).
//!
//! R-RUSTPORT-P4-1F6: `buildHighlight` (4 galezie `refreshBuildHighlight`, `main.ts:16351-16396`
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
//!
//! R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW: producent nakladek `tradeRoutes`, `workerFields`
//! i `okolica` (kontrakt DTO §3.7, typy `civ-view-model` z P4-1F1 bez zmian).
//!
//! Zrodlo prawdy: web na pinie `07d2fbd72` (`gra/src/…`):
//! * szlaki = `refreshTradeRoutesOverlay` (`main.ts:15379-15397`): przelacznik i panel miasta
//!   (`:15381-15382`), pusta lista (`:15383`), `cityById = new Map(cities.map(...))` (`:15384`, przy
//!   zdublowanym id wygrywa OSTATNIE miasto), filtr `status === 'polaczony'` (`:15387`), filtr cudzej
//!   trasy z literalem `0` (`:15388`, NIE widz — rozpoznanie P4-1F §5 pkt 3), brak miasta (`:15389-15391`),
//!   wejscie `TradeRouteOverlayInput` (`render/tradeRoutesOverlay.ts:18-24`), kolejnosc = `tradeRoutes`;
//! * pola robotnikow = `refreshWorkerFieldOverlay` (`main.ts:15432-15448`): przelacznik i panel miasta
//!   (`:15434`), `collectWorkedHexOwnerMap(cities, map, { isWorkable: okolicaHexWorkable, territoryNodes:
//!   buildAllTerritoryNodes(), eraForOwner: empireEpochForOwner })` (`:15435-15439`, `game/okolica.ts:811-834`),
//!   kolejnosc `Map`; mgla NIE filtruje wpisow (web tylko przyciemnia sprite'y w rendererze, `:15442-15447`);
//! * okolica = `syncOkolicaOverlay` (`main.ts:6644-6666`): panel miasta (`:6645`), `cities.find` po id
//!   (`:6649-6650`), tylko miasto aktywnego fotela `isMe(city.ownerId)` (`:6651`, `isMe` = `ownerId === ME()`,
//!   `main.ts:13748-13750`), `range: cityRangeForPopulation(city.population)` (`:6658`, populacja NIE
//!   zaokraglona), `workedKeys: okolicaWorkedKeySet(city)` (`:6625-6635`: `resolveWorkedTiles` z plonem z
//!   epoka wlasciciela, `isWorkable`, `territoryNodes`, `ownerId`, `excludeHexKeys:
//!   siblingClaimedHexKeysForCity(city)` = `computeLostToNearerSiblingByCity(cities, map).get(city.id)`,
//!   `main.ts:5701-5703`), `yieldOf` z epoka wlasciciela (`:6660`), `showYields: true` (`:6661`), `ownerId`
//!   miasta (`:6664`).
//!
//! Decyzje techniczne (raport `01-operator-r1.md`):
//! * Z-1F4-1 (stan tras): web trzyma `tradeRoutes` jako zmienna modulu `main.ts` (`:3454`), poza `GameState`;
//!   `PlayableState` nie ma tego pola. Trasy podaje WOLAJACY (`&[TradeRoute]`, typ `trade.rs:427`) —
//!   `PlayableState` i zapis bez zmian.
//! * Z-1F4-2 (miasta): wejscie = `&[City]` (`state.rs`, model ekonomii z `okolicaFocus/okolicaTryb/
//!   okolicaReczne`, ktorych `PlayableCity` nie niesie — rozpoznanie §3 pkt 5) w kolejnosci webowego `cities`.
//!   `City.id` (tekst) laczy sie z `TradeRoute.fromCityId/toCityId` (tekst) i z id panelu miasta (`CityId`
//!   DTO) przez zapis dziesietny (konwencja `war_world_view.rs:83-84`: `city.id.get().to_string()`).
//! * Z-1F4-3 (`okolica.yields`): wpis dla KAZDEGO heksa zasiegu (`collectRangeKeys`,
//!   `render/cityOkolicaOverlay.ts:239-249`), w kolejnosci `hexKeysWithinRadius` (`game/okolica.ts:66-89`).
//!   Filtr etykiet (`Morze`/`Gory`, ulepszenie kryjace, pusta etykieta; `cityOkolicaOverlay.ts:283-296`)
//!   zostaje w rendererze (P4-1G), ktory zna teren i `coveringImprovement` z `MapViewDto`; `yieldOf` jest
//!   czysty, wiec nadmiar wpisow nie zmienia obrazu.
//! * Z-1F4-4: `isCityPanelOpen()` i `getOpenCityPanelCityId()` to w webie dwa rozne odczyty
//!   (`ui/cityPanel.ts:12569-12576`: ramka UX vs `activeCity`), wiec [`OverlaysUi`] niesie oba pola.
//! * Z-1F4-5: wspolrzedne miasta `q/r` (`f64`) rzutowane `as i32` jak `okolica_city_of`
//!   (`turn_economy_territory.rs:77-88`).
//!
//! R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW: producent `sieges[]` i `wonders[]` widoku renderera
//! (`P4-1-RENDER-DTO-CONTRACT.md` §3.1, §3.5; rozpoznanie `P4-1F-OVERLAYS-ROZPOZNANIE.md` §1 SG/WD, §4 1F3).
//!
//! Czyta [`PlayableState`] (wylacznie odczyt) i zwraca typy `civ-view-model` ([`SiegeViewDto`],
//! [`PlacedWonderDto`]) bez zmiany ich ksztaltu (P4-1F1).
//!
//! Zrodlo prawdy: web na pinie `07d2fbd72` (`gra/src/…`):
//! * oblezenia = `refreshSiegeMarkers` (`main.ts:17492-17530`): miasta `cities.filter(c => c.oblegane)`
//!   w kolejnosci `cities`; obozy = KAZDA jednostka pelnej listy `units` (bez mgly) z
//!   `siegeAllowedBetween(u.ownerId, c.ownerId, areEnemyOwners)` i `hexDistance == 1`
//!   (`:17501-17508`), z powtorzeniami (jeden wpis na jednostke); maszyny = `readyMachinesForCity`
//!   (`render/siegeCampSync.ts:7-12`); wlasciciel obozu = `campOwnerByHex` (`siegeCampSync.ts:30-47`):
//!   PIERWSZA jednostka PELNEJ listy `units` na heksie z `ownerId !== cityOwnerId` (`:43`);
//! * cuda = `placedWonderSnapshot` (`main.ts:4205-4210`) z `wonderIsRuin` (`main.ts:4199-4203`):
//!   nieznany cud -> `false`, inaczej `empireEpochForOwner(ownerId) > getWonderAbsolutEpoka(w)`
//!   (`game/wonders-data.ts:164-168`). Porownanie wprost `era > absolut` (NIE `!wonder_bonus_active`),
//!   bo dla `era = NaN` web daje `false`.
//!
//! Wejscie, ktorego `PlayableState` NIE niesie: relacja wrogosci `areEnemyOwners` (web `main.ts`).
//! Podaje ja wolajacy jako funkcje (`are_enemies`), jak w `diplomacy_siege_war_gate`.
#![forbid(unsafe_code)]

use std::collections::{HashMap, HashSet};
use std::fmt;

use civ_view_model as vm;
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::{
    BuildHighlightDto, BuildHighlightKind, PathRouteDto, SelectionDto, SiegeCampDto,
};
use civ_view_model::{
    CityId, OkolicaViewDto, PlacedWonderDto, SiegeMachineKind, SiegeViewDto, TileYieldDto,
    TradeMedium, TradeRouteDto, WorkerFieldDto,
};

use crate::data::buildings_tech::{parse_wonders, Wonders};
use crate::data::terrain_map::TerrainYieldsFile;
use crate::domain::army_follow_auto_merge::{can_join_stack_at, FollowAutoMergeUnit};
use crate::domain::diplomacy_siege_war_gate::{enemy_units_adjacent_to_city, SiegeCity, SiegeUnit};
use crate::domain::improvement_build::{hex_keys_within_radius, is_mine_improvement_key, BuildMap};
use crate::domain::okolica::{
    collect_worked_hex_owner_map_by_owner_yield, compute_lost_to_nearer_sibling_by_city,
    is_land_workable_hex, resolve_worked_tiles, OkolicaCity, OkolicaYield, ResolveWorkedTilesOpts,
};
use crate::domain::pathfinding::ruch_jednostek::{
    compute_path, compute_reachable_occ, path_cost, CostFn, Klucz, RuchJednostka,
};
use crate::domain::playable::{PlayableSiegeMachineKind, PlayableState, PlayableUnit};
use crate::domain::playable_movement::{
    occupied_for_move, player_stack_at, preview_path, unit_with_planning_stack_ruch,
    PlayableMoveModel,
};
use crate::domain::player::HumanSeats;
use crate::domain::save_migrations::ARMY_STACK_LIMIT;
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::terrain::{axial_distance, city_range_for_population};
use crate::domain::territory::TerritoryNode;
use crate::domain::trade::{TradeRoute, TradeRouteMedium, TradeRouteStatus};
use crate::domain::turn_economy_territory::{hex_tile_yield, okolica_city_of};
use crate::domain::turn_war_epoch::{
    empire_epoch_for_owner, game_start_era, owner_era_facts, OwnerEpochError,
};
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

/// Czy `refreshBuildHighlight()` wchodzi w galaz trybu budowy (`main.ts:16351-16396` @ `07d2fbd72`):
/// zalozenie miasta (`foundCityMode`, `:16352`), cud (`activeWonderId`, `:16363`) albo ulepszenie /
/// kopalnia zloza (`buildModeOpen && activeImprovementKey && buildApi`, zaprzeczenie `:16369`).
/// `false` = galaz „brak trybu budowy” (`:16369-16373`; [`build_highlight`] zwraca brak warstwy).
///
/// R-RUSTPORT-P4-1Q6-2 (dlug Q6-2): w aktywnym trybie budowy JEDNA warstwa `setHighlight` pinu
/// nalezy do trybu budowy rowniez przy PUSTYM zbiorze heksow (`setHighlight(qual)` `:16360`,
/// `setHighlight(new Set(...))` `:16366`, `:16392-16395`; `clearHighlight()` przy kopalni `:16387`),
/// wiec zasieg ruchu znika.
/// Kontrakt DTO nie odroznia „tryb aktywny, brak heksow” od „brak trybu” (puste `hexes` = brak
/// warstwy), dlatego [`unit_overlays_view`] wygasza `reachable`, gdy ta funkcja zwraca `true`.
#[must_use]
pub fn build_highlight_mode_active(ui: &BuildHighlightUi<'_>) -> bool {
    ui.found_city_mode
        || ui.wonder_active
        || (ui.build_mode_open && ui.active_improvement_key.is_some_and(|k| !k.is_empty()))
}

/// `refreshBuildHighlight()` (`main.ts:16351-16396` @ `07d2fbd72`) jako DTO.
///
/// Kolejnosc galezi jak w pinie: zalozenie miasta (`:16352-16361`), cud (`:16363-16367`), brak
/// trybu budowy (`:16369-16373`), kopalnia zloza (`:16386-16390`), pozostale ulepszenia
/// (`:16392-16395`).
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
    // Galaz „brak trybu budowy” (`:16369-16373`): jeden warunek z [`build_highlight_mode_active`].
    let key = match ui.active_improvement_key {
        Some(key) if build_highlight_mode_active(ui) => key,
        _ => return no_layer(),
    };
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

/// Web `isAwaitingFirstPlayerCity(ownerId = ME())` (`main.ts:12882-12884`): wpis fotela `owner` w
/// `playerEverOwnedCityByOwner` + miasta stanu ([`PlayableState::is_awaiting_first_city`],
/// R-RUSTPORT-P4-364-AWAITING-SEAT-R1: stan per fotel, nie jedna flaga fotela glownego). Wolane po
/// bramce `isMe(u.ownerId)`, wiec `u.ownerId` == `ME()` - argument domyslny pinu.
fn awaiting_first_city(state: &PlayableState, owner: PlayerId) -> bool {
    state.is_awaiting_first_city(owner)
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

/// Wejscie UI pol jednostkowych `OverlaysViewDto` (Q6, `R-RUSTPORT-P4-1G-Q6-UNITS-R1`): kursor
/// (`refreshHoverPathPreview`) i tryb budowy (`refreshBuildHighlight`) ze zrodlami silnika.
pub struct UnitOverlaysInput<'a, 'b> {
    /// Heks pod kursorem (`hitQ/hitR` `refreshHoverPathPreview`, `main.ts:31181`); `None` = brak.
    pub hover: Option<PositionDto>,
    /// Stan trybu budowy ([`build_highlight`]).
    pub build_ui: BuildHighlightUi<'a>,
    /// Zrodla silnika dla [`build_highlight`].
    pub build_sources: &'b BuildHighlightSources<'a>,
    /// Stan UI zaznaczenia dla [`selection`], podawany przez wolajacego (kontrakt D-CMD-12 bez
    /// zmian, obrona r1 zarzut 4): `PlayableState.selected_unit_id` NIE jest tu czytany.
    pub selection_ui: SelectionUi,
}

/// Pola jednostkowe `OverlaysViewDto` jednego snapshotu: `reachable`, `buildHighlight`,
/// `selection`, `pathRoute` (kontrakt §3.7, ksztalt typow bez zmian).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnitOverlaysView {
    /// [`reachable_overlay`]; pusty, gdy [`build_highlight_mode_active`] (dlug Q6-2: aktywny tryb
    /// budowy przejmuje warstwe podswietlenia pinu, takze przy pustym zbiorze heksow).
    pub reachable: Vec<HexCoord>,
    /// [`build_highlight`].
    pub build_highlight: BuildHighlightDto,
    /// [`selection`].
    pub selection: Option<SelectionDto>,
    /// [`path_route_overlay`].
    pub path_route: Option<PathRouteDto>,
}

impl UnitOverlaysView {
    /// Wpisuje cztery pola do `OverlaysViewDto` (pozostale pola bez zmian).
    pub fn write_into(self, dto: &mut vm::OverlaysViewDto) {
        dto.reachable = self.reachable;
        dto.build_highlight = self.build_highlight;
        dto.selection = self.selection;
        dto.path_route = self.path_route;
    }
}

/// Producent pol jednostkowych nakladek (Q6): JEDYNY wolajacy [`reachable_overlay`],
/// [`path_route_overlay`], [`selection`] i [`build_highlight`] po stronie silnika.
///
/// Zaznaczenie (`selection`) bierze [`UnitOverlaysInput::selection_ui`] od wolajacego, zgodnie z
/// kontraktem [`SelectionUi`] (D-CMD-12). [`reachable_overlay`] i [`path_route_overlay`] czytaja
/// `state.selected_unit_id` (ich istniejacy kontrakt F5). W webie to jedna zmienna `selectedId`
/// (`main.ts:7116`), wiec wolajacy (most DTO, #308) MUSI podac te sama wartosc w obu miejscach;
/// ujednolicenie zrodla to decyzja orkiestratora (dawna propozycja Q6-1, wycofana w obronie r1).
#[must_use]
pub fn unit_overlays_view(
    state: &PlayableState,
    input: &UnitOverlaysInput<'_, '_>,
) -> UnitOverlaysView {
    // Q6-2 (R-RUSTPORT-P4-1Q6-2): aktywny tryb budowy przejmuje jedyna warstwe `setHighlight` pinu
    // (`main.ts:16351-16396`), takze przy pustym zbiorze heksow: zasieg ruchu nie jest widoczny.
    // Zwykly tryb ruchu (galaz `:16369-16373`) zostawia `reachable` (`main.ts:7123-7125`).
    let reachable = if build_highlight_mode_active(&input.build_ui) {
        Vec::new()
    } else {
        reachable_overlay(state)
    };
    UnitOverlaysView {
        reachable,
        build_highlight: build_highlight(&input.build_ui, input.build_sources),
        selection: selection(&input.selection_ui, &state.units),
        path_route: path_route_overlay(state, input.hover),
    }
}

/// Swiat czytany przez producenta (web: domkniecia `cities`, `map`, `buildAllTerritoryNodes()`,
/// `empireEpochForOwner`). Tylko odczyt.
#[derive(Clone, Copy)]
pub struct OverlaysWorld<'a> {
    /// Web `cities` w kolejnosci tablicy (Z-1F4-2).
    pub cities: &'a [City],
    /// Web `map`.
    pub map: &'a BuildMap,
    /// `terrain-yields.json` (plon heksa, `yieldOfMapHex`).
    pub terrain_yields: &'a TerrainYieldsFile,
    /// Web `buildAllTerritoryNodes()` (`main.ts:5667-5678`: miasta + forty/posterunki).
    pub territory_nodes: &'a [TerritoryNode],
    /// Web `empireEpochForOwner(ownerId)` (`main.ts:2419`).
    pub era_for_owner: &'a dyn Fn(i64) -> f64,
}

/// Stan UI czytany przez nakladki (web: zmienne `main.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OverlaysUi {
    /// `showTradeRoutesOverlay` (domyslnie `true`, `main.ts:15358`, reset `:15455`).
    pub show_trade_routes: bool,
    /// `showWorkerOverlay` (domyslnie `true`, `main.ts:15419`, reset `:15453`).
    pub show_worker_overlay: bool,
    /// `isCityPanelOpen()` (`ui/cityPanel.ts:12569-12571`: ramka UX miasta otwarta).
    pub city_panel_open: bool,
    /// `getOpenCityPanelCityId()` (`ui/cityPanel.ts:12574-12576`: `activeCity?.id ?? null`).
    pub open_city_id: Option<CityId>,
    /// `ME()` — aktywny fotel czlowieka (`main.ts:13729-13731`).
    pub viewer_owner_id: i64,
}

/// Blad producenta nakladek (wartosc stanu bez reprezentacji w DTO; jawny, bez cichych zer).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OverlaysViewError {
    /// `ownerId` miasta spoza `OwnerRef` (gracz `0..=2^53-1`, `-1`, `-99`).
    OwnerOutOfRange(i64),
    /// Identyfikator powyzej `2^53 - 1` (kontrakt §4 pkt 4).
    IdOutOfRange(u64),
    /// Epoka wlasciciela nieustalona (web `empireEpochForOwner`).
    Epoch(OwnerEpochError),
    /// Dane `wonders.json` nie daly sie wczytac.
    WondersData(String),
}

impl fmt::Display for OverlaysViewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::OwnerOutOfRange(v) => write!(f, "ownerId {v} poza zakresem OwnerRef"),
            Self::IdOutOfRange(v) => write!(f, "identyfikator {v} poza zakresem 2^53 - 1"),
            Self::Epoch(e) => write!(f, "epoka wlasciciela: {e}"),
            Self::WondersData(e) => write!(f, "wonders.json: {e}"),
        }
    }
}

impl std::error::Error for OverlaysViewError {}

fn owner_ref(owner_id: i64) -> Result<vm::OwnerRef, OverlaysViewError> {
    vm::OwnerRef::from_legacy_i64(owner_id).ok_or(OverlaysViewError::OwnerOutOfRange(owner_id))
}

fn city_hex(c: &City) -> HexCoord {
    HexCoord::new(c.q as i32, c.r as i32)
}

/// Web `yieldOfMapHex(map, q, r, ownerEra)` (`game/okolica.ts:459-477`): brak heksa = `{}`.
fn map_hex_yield(world: &OverlaysWorld<'_>, q: i32, r: i32, owner_era: f64) -> TileYieldDto {
    match world.map.hex(&format!("{q},{r}")) {
        None => TileYieldDto {
            zywnosc: None,
            praca: None,
            handel: None,
        },
        Some(h) => {
            let y = hex_tile_yield(world.terrain_yields, h, Some(owner_era));
            TileYieldDto {
                zywnosc: Some(y.zywnosc),
                praca: Some(y.praca),
                handel: Some(y.handel),
            }
        }
    }
}

/// Plon do rankingu okolicy (`TileYield` weba; brak pola = `0` w `tileAssignScore`).
fn okolica_yield(world: &OverlaysWorld<'_>, q: i32, r: i32, owner_era: f64) -> OkolicaYield {
    let y = map_hex_yield(world, q, r, owner_era);
    OkolicaYield {
        zywnosc: y.zywnosc.unwrap_or(0.0),
        praca: y.praca.unwrap_or(0.0),
        handel: y.handel.unwrap_or(0.0),
    }
}

fn okolica_cities(cities: &[City]) -> Vec<OkolicaCity> {
    cities.iter().map(okolica_city_of).collect()
}

/// `overlays.tradeRoutes` — web `refreshTradeRoutesOverlay` (`main.ts:15379-15397`).
#[must_use]
pub fn trade_routes_view(
    routes: &[TradeRoute],
    cities: &[City],
    ui: &OverlaysUi,
) -> Vec<TradeRouteDto> {
    let mut out = Vec::new();
    if !ui.show_trade_routes || ui.city_panel_open || routes.is_empty() {
        return out;
    }
    // `new Map(cities.map(c => [c.id, c]))`: przy zdublowanym id wygrywa ostatni wpis.
    let mut city_by_id: HashMap<&str, &City> = HashMap::new();
    for c in cities {
        city_by_id.insert(c.id.as_str(), c);
    }
    for route in routes {
        if route.status != TradeRouteStatus::Connected {
            continue;
        }
        // `:15388` — literal `0`, nie widz (R2-3: trasa AI<->AI / wewnetrzna obcych).
        if route.owner_id.get() != 0 && route.to_owner_id.get() != 0 {
            continue;
        }
        let (Some(from), Some(to)) = (
            city_by_id.get(route.from_city_id.as_str()),
            city_by_id.get(route.to_city_id.as_str()),
        ) else {
            continue;
        };
        out.push(TradeRouteDto {
            from: city_hex(from),
            to: city_hex(to),
            medium: match route.medium {
                TradeRouteMedium::Land => TradeMedium::Lad,
                TradeRouteMedium::Sea => TradeMedium::Morze,
            },
        });
    }
    out
}

/// `overlays.workerFields` — web `refreshWorkerFieldOverlay` (`main.ts:15432-15448`), kolejnosc `Map`
/// z [`collect_worked_hex_owner_map_by_owner_yield`]; bez filtra mgly.
pub fn worker_fields_view(
    world: &OverlaysWorld<'_>,
    ui: &OverlaysUi,
) -> Result<Vec<WorkerFieldDto>, OverlaysViewError> {
    if !ui.show_worker_overlay || ui.city_panel_open {
        return Ok(Vec::new());
    }
    let cities = okolica_cities(world.cities);
    let land = |q: i32, r: i32| is_land_workable_hex(world.map, q, r);
    let yield_of_for_owner =
        |owner: i64, q: i32, r: i32| okolica_yield(world, q, r, (world.era_for_owner)(owner));
    let worked = collect_worked_hex_owner_map_by_owner_yield(
        &cities,
        world.map,
        &yield_of_for_owner,
        Some(&land),
        Some(world.territory_nodes),
    );
    worked
        .into_iter()
        .filter_map(|(key, owner)| world.map.hex(&key).map(|h| (h.q, h.r, owner)))
        .map(|(q, r, owner)| {
            Ok(WorkerFieldDto {
                hex: HexCoord::new(q, r),
                owner_id: owner_ref(owner)?,
            })
        })
        .collect()
}

/// `overlays.okolica` — web `syncOkolicaOverlay` (`main.ts:6644-6666`) z `okolicaWorkedKeySet`
/// (`:6625-6635`). `None` = brak warstwy (panel zamkniety, brak miasta, miasto innego fotela).
pub fn okolica_view(
    world: &OverlaysWorld<'_>,
    ui: &OverlaysUi,
) -> Result<Option<OkolicaViewDto>, OverlaysViewError> {
    if !ui.city_panel_open {
        return Ok(None);
    }
    let Some(city_id) = ui.open_city_id else {
        return Ok(None);
    };
    let wanted = city_id.get().to_string();
    let Some(city) = world.cities.iter().find(|c| c.id == wanted) else {
        return Ok(None);
    };
    if city.owner_id != ui.viewer_owner_id {
        return Ok(None);
    }
    let owner_era = (world.era_for_owner)(city.owner_id);
    let range = city_range_for_population(city.population);

    // `okolicaWorkedKeySet(city)` (`:6625-6635`).
    let all = okolica_cities(world.cities);
    let lost = compute_lost_to_nearer_sibling_by_city(&all, world.map);
    let land = |q: i32, r: i32| is_land_workable_hex(world.map, q, r);
    let yield_of = |q: i32, r: i32| okolica_yield(world, q, r, owner_era);
    let worked = resolve_worked_tiles(
        &okolica_city_of(city),
        world.map,
        &yield_of,
        &ResolveWorkedTilesOpts {
            is_workable: Some(&land),
            territory_nodes: Some(world.territory_nodes),
            owner_id: Some(city.owner_id),
            exclude_hex_keys: lost.get(&city.id),
            ..ResolveWorkedTilesOpts::default()
        },
    );
    // `new Set(worked.map(t => t.key))`: pierwsze wystapienie klucza wyznacza pozycje.
    let mut worked_hexes: Vec<HexCoord> = Vec::new();
    for t in &worked {
        let hex = HexCoord::new(t.q, t.r);
        if !worked_hexes.contains(&hex) {
            worked_hexes.push(hex);
        }
    }

    // `collectRangeKeys` (`render/cityOkolicaOverlay.ts:239-249`) + `yieldOf` (Z-1F4-3).
    let center = city_hex(city);
    let mut yields = Vec::new();
    for key in hex_keys_within_radius(center.q, center.r, range, world.map) {
        let Some(h) = world.map.hex(&key) else {
            continue;
        };
        if axial_distance(center.q, center.r, h.q, h.r) <= range {
            yields.push((
                HexCoord::new(h.q, h.r),
                map_hex_yield(world, h.q, h.r, owner_era),
            ));
        }
    }

    Ok(Some(OkolicaViewDto {
        city_id,
        city_hex: center,
        range,
        worked_hexes,
        yields,
        show_yields: Some(true),
        owner_id: owner_ref(city.owner_id)?,
    }))
}

impl From<OwnerEpochError> for OverlaysViewError {
    fn from(e: OwnerEpochError) -> Self {
        Self::Epoch(e)
    }
}

fn owner_i64(id: PlayerId) -> i64 {
    // Identyfikatory przechodza przez `vm_owner` (<= 2^53 - 1), wiec rzutowanie jest bezstratne.
    i64::try_from(id.get()).unwrap_or(i64::MAX)
}

fn vm_owner(id: PlayerId) -> Result<vm::OwnerRef, OverlaysViewError> {
    vm::PlayerId::try_new(id.get())
        .map(vm::OwnerRef::Player)
        .map_err(|e| OverlaysViewError::IdOutOfRange(e.value))
}

fn unit_hex(unit: &PlayableUnit) -> vm::HexCoord {
    // Kontrakt §1.4: `q = position.x`, `r = position.y`.
    vm::HexCoord::new(i32::from(unit.position.x()), i32::from(unit.position.y()))
}

const fn vm_machine(kind: PlayableSiegeMachineKind) -> SiegeMachineKind {
    match kind {
        PlayableSiegeMachineKind::Taran => SiegeMachineKind::Taran,
        PlayableSiegeMachineKind::Wieza => SiegeMachineKind::Wieza,
    }
}

/// Web `campOwnerByHex` dla jednego heksa (`render/siegeCampSync.ts:30-47`): wlasciciel PIERWSZEJ
/// jednostki PELNEJ listy `units` stojacej na `hex` z `ownerId !== cityOwnerId` (`:43`). `None` =
/// web `out` bez wpisu (nieosiagalne dla heksa obozu: obozowa jednostka ma inny wlasciciel niz miasto).
pub fn camp_owner_at_hex(
    hex: vm::HexCoord,
    units: &[PlayableUnit],
    city_owner_id: PlayerId,
) -> Option<PlayerId> {
    units
        .iter()
        .find(|u| unit_hex(u) == hex && u.owner_id != city_owner_id)
        .map(|u| u.owner_id)
}

/// Web `machinesByCampHex` (`render/siegeCampSync.ts:14-27`): gotowe machiny round-robin po LISCIE
/// obozow (z powtorzeniami: `campHexes[i % campHexes.length]`). Wynik = wpisy `Map` w kolejnosci
/// pierwszego wstawienia heksa; pusta lista obozow albo machin = pusta mapa.
pub fn machines_by_camp_hex(
    camp_hexes: &[vm::HexCoord],
    ready: &[SiegeMachineKind],
) -> Vec<(vm::HexCoord, Vec<SiegeMachineKind>)> {
    let mut out: Vec<(vm::HexCoord, Vec<SiegeMachineKind>)> = Vec::new();
    if camp_hexes.is_empty() || ready.is_empty() {
        return out;
    }
    for (i, kind) in ready.iter().enumerate() {
        let hk = camp_hexes[i % camp_hexes.len()];
        match out.iter_mut().find(|(h, _)| *h == hk) {
            Some((_, list)) => list.push(*kind),
            None => out.push((hk, vec![*kind])),
        }
    }
    out
}

/// Globalne mapy obozow dla rendera (web `refreshSiegeMarkers`, `main.ts:17509-17517`): web liczy
/// `allMachinesByCamp` i `allCampOwners` jako JEDNA mape po heksie dla wszystkich obleganych miast.
/// * maszyny: dla kazdego miasta w kolejnosci `sieges` `machinesByCampHex(camps, ready)` i LACZENIE
///   list (`[...prev, ...kinds]`, `:17511-17513`);
/// * wlasciciel: `allCampOwners.set(hk, oid)` (`:17514-17516`) - OSTATNIE miasto wygrywa.
///
/// Kolejnosc wpisow = kolejnosc pierwszego wstawienia heksa (semantyka `Map.set` dla istniejacego
/// klucza: wartosc podmieniona, pozycja bez zmian). `SiegeViewDto.camp_hexes[].owner_id` pozostaje
/// wlascicielem per miasto (P4-1F1); te funkcje to regula, ktora adapter P4-1G Q5 (#236/#269) MUSI
/// zastosowac, aby odtworzyc web 1:1, gdy dwa oblegane miasta dziela heks obozu.
#[must_use]
pub fn global_camp_owners(sieges: &[SiegeViewDto]) -> Vec<(vm::HexCoord, vm::OwnerRef)> {
    let mut out: Vec<(vm::HexCoord, vm::OwnerRef)> = Vec::new();
    for siege in sieges {
        for camp in &siege.camp_hexes {
            match out.iter_mut().find(|(h, _)| *h == camp.hex) {
                Some((_, owner)) => *owner = camp.owner_id,
                None => out.push((camp.hex, camp.owner_id)),
            }
        }
    }
    out
}

/// Web `allMachinesByCamp` (`main.ts:17509-17513`): round-robin per miasto, listy laczone po heksie
/// w kolejnosci `sieges`. Patrz [`global_camp_owners`].
#[must_use]
pub fn global_machines_by_camp(
    sieges: &[SiegeViewDto],
) -> Vec<(vm::HexCoord, Vec<SiegeMachineKind>)> {
    let mut out: Vec<(vm::HexCoord, Vec<SiegeMachineKind>)> = Vec::new();
    for siege in sieges {
        let camps: Vec<vm::HexCoord> = siege.camp_hexes.iter().map(|c| c.hex).collect();
        for (hk, kinds) in machines_by_camp_hex(&camps, &siege.ready_machines) {
            match out.iter_mut().find(|(h, _)| *h == hk) {
                Some((_, list)) => list.extend(kinds),
                None => out.push((hk, kinds)),
            }
        }
    }
    out
}

/// Producent `sieges[]` (web `refreshSiegeMarkers`, `main.ts:17492-17530`): jeden wpis na miasto z
/// `oblegane` w kolejnosci `state.cities`. `are_enemies(a, b)` = web `areEnemyOwners` (wejscie wolajacego).
pub fn siege_views(
    state: &PlayableState,
    are_enemies: impl Fn(i64, i64) -> bool,
) -> Result<Vec<SiegeViewDto>, OverlaysViewError> {
    // Pelna lista `units` (bez filtra mgly: `siegeMarker.ts` nie zna mgly).
    let siege_units: Vec<SiegeUnit> = state
        .units
        .iter()
        .map(|u| SiegeUnit {
            q: i64::from(u.position.x()),
            r: i64::from(u.position.y()),
            owner_id: owner_i64(u.owner_id),
        })
        .collect();
    let mut out = Vec::new();
    for city in &state.cities {
        if !state.oblegane.contains(&city.id) {
            continue;
        }
        let city_hex =
            vm::HexCoord::new(i32::from(city.position.x()), i32::from(city.position.y()));
        let siege_city = SiegeCity {
            q: i64::from(city.position.x()),
            r: i64::from(city.position.y()),
            owner_id: owner_i64(city.owner_id),
            ma_mur: false,
            oblegane: true,
        };
        // `main.ts:17501-17508`: jeden wpis na jednostke, kolejnosc `units`, powtorzenia zachowane.
        let mut camp_hexes = Vec::new();
        for index in enemy_units_adjacent_to_city(&siege_city, &siege_units, &are_enemies) {
            let hex = unit_hex(&state.units[index]);
            let owner = camp_owner_at_hex(hex, &state.units, city.owner_id)
                .unwrap_or(state.units[index].owner_id);
            camp_hexes.push(SiegeCampDto {
                hex,
                owner_id: vm_owner(owner)?,
            });
        }
        let ready_machines = state
            .siege_machines_ready
            .get(&city.id)
            .map(|kinds| kinds.iter().copied().map(vm_machine).collect())
            .unwrap_or_default();
        out.push(SiegeViewDto {
            city_id: vm::CityId::try_new(city.id.get())
                .map_err(|e| OverlaysViewError::IdOutOfRange(e.value))?,
            city_hex,
            camp_hexes,
            ready_machines,
        });
    }
    Ok(out)
}

/// Web `wonderIsRuin` (`main.ts:4199-4203`) przy znanej epoce wlasciciela: nieznany `wonderId`
/// (`getWonderById`, `wonders-data.ts:101`, `:109-111` - tylko `cuda`) -> `false`; inaczej
/// `era > absolut`. `absolut` jest w Rust polem wymaganym (`buildings_tech.rs`), wiec fallback
/// `_meta.absolut` (`wonders-data.ts:166-167`) jest nieosiagalny.
pub fn wonder_is_ruin(wonders: &Wonders, wonder_id: &str, era: f64) -> bool {
    match wonders.cuda.iter().find(|w| w.id == wonder_id) {
        None => false,
        // `absolut` to male calkowite (epoki), konwersja do f64 jest dokladna.
        #[allow(clippy::cast_precision_loss)]
        Some(w) => era > w.absolut as f64,
    }
}

/// Producent `wonders[]` z jawna epoka wlasciciela (`era_of`): kolejnosc `placedWorldWonders`.
pub fn wonder_views_with_era(
    state: &PlayableState,
    wonders: &Wonders,
    era_of: impl Fn(PlayerId) -> Result<f64, OverlaysViewError>,
) -> Result<Vec<PlacedWonderDto>, OverlaysViewError> {
    state
        .placed_world_wonders
        .iter()
        .map(|pw| {
            // `getWonderById` przed epoka: nieznany cud nie pyta o epoke (web `if (!w) return false`).
            let ruin = if wonders.cuda.iter().any(|w| w.id == pw.wonder_id) {
                wonder_is_ruin(wonders, &pw.wonder_id, era_of(pw.owner_id)?)
            } else {
                false
            };
            Ok(PlacedWonderDto {
                wonder_id: pw.wonder_id.clone(),
                hex: vm::HexCoord::new(pw.q, pw.r),
                owner_id: vm_owner(pw.owner_id)?,
                ruin,
            })
        })
        .collect()
}

/// Producent `wonders[]` (web `placedWonderSnapshot`, `main.ts:4205-4210`): epoka wlasciciela =
/// `empire_epoch_for_owner` z faktow stanu (jak `city_view`), dane cudow = `wonders.json`.
pub fn wonder_views(state: &PlayableState) -> Result<Vec<PlacedWonderDto>, OverlaysViewError> {
    let wonders = parse_wonders().map_err(|e| OverlaysViewError::WondersData(e.to_string()))?;
    let facts = owner_era_facts(state);
    let start = game_start_era(&state.params.epoch_id);
    wonder_views_with_era(state, &wonders, |owner| {
        Ok(empire_epoch_for_owner(owner_i64(owner), &facts, start)?.0)
    })
}

#[cfg(test)]
mod q6_unit_overlays_tests {
    //! Q6 (`R-RUSTPORT-P4-1G-Q6-UNITS-R1`): `unit_overlays_view` wola producentow F5/F6. Wektory
    //! zasiegu i trasy z `tests/view_overlays_reach_path.rs` (R1, P1), policzone recznie z pinu
    //! `07d2fbd72` (`main.ts:14706-14731`, `planned-march.ts:241-268`).

    use super::*;
    use crate::domain::playable::{
        MovementPoints, PlayableGame, PlayableMap, PlayablePlannedMarch, PlayableTerrain,
        PlayableTile, PlayableUnitKind,
    };
    use crate::StartGameParams;

    const HUMAN: u64 = 1;
    const MOVER: u64 = 900;

    fn unit(id: u64, owner: u64, x: u16, movement: u8) -> PlayableUnit {
        PlayableUnit {
            id: UnitId::new(id),
            owner_id: PlayerId::new(owner),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(x, 0),
            movement: MovementPoints::from(movement),
            movement_max: MovementPoints::from(movement),
            selected: false,
        }
    }

    fn corridor(n: u16, movement: u8) -> PlayableState {
        let mut state = PlayableGame::new(StartGameParams::default())
            .expect("scenariusz startowy")
            .state()
            .clone();
        state.map = PlayableMap {
            width: n,
            height: 1,
            tiles: (0..n)
                .map(|x| PlayableTile {
                    position: PositionDto::new(x, 0),
                    terrain: PlayableTerrain::Plains,
                    passable: true,
                })
                .collect(),
            improvements: Vec::new(),
        };
        state.cities.clear();
        state.units = vec![unit(MOVER, HUMAN, 0, movement)];
        state.planned_marches.clear();
        state.economy = Default::default();
        state.selected_unit_id = Some(MOVER);
        state.gracz_kiedys_mial_miasto = true;
        state
    }

    fn hs(qs: &[i32]) -> Vec<HexCoord> {
        qs.iter().map(|&q| HexCoord::new(q, 0)).collect()
    }

    fn view(state: &PlayableState, ui: BuildHighlightUi<'_>) -> UnitOverlaysView {
        let map_hexes = [(0, 0), (1, 0), (2, 0)];
        let undo = HashSet::new();
        let src = BuildHighlightSources {
            map_hexes: &map_hexes,
            is_in_start_reveal: &|_, _| true,
            can_found_player_city_at: &|q, _| q != 1,
            qualifying_wonder_hexes: &|| vec![(2, 0)],
            qualifying_hexes: &|_| vec![(1, 0), (2, 0)],
            pending_undo_keys: &undo,
        };
        unit_overlays_view(
            state,
            &UnitOverlaysInput {
                hover: None,
                build_ui: ui,
                build_sources: &src,
                // Wolajacy podaje ten sam `selectedId` co stan (web: jedna zmienna, `main.ts:7116`).
                selection_ui: SelectionUi {
                    selected_unit_id: state.selected_unit_id,
                },
            },
        )
    }

    const NO_BUILD: BuildHighlightUi<'static> = BuildHighlightUi {
        found_city_mode: false,
        wonder_active: false,
        build_mode_open: false,
        active_improvement_key: None,
    };

    /// R1 + P1: zasieg [(2,0),(3,0),(1,0)] (wlasny stos 901 na (1,0), ruch 3), trasa planu do
    /// (5,0) z `turnStops`, zaznaczenie na (0,0) gracza 1, brak trybu budowy = brak warstwy.
    #[test]
    fn q6_agregator_wola_zasieg_trase_zaznaczenie_i_budowe() {
        let mut state = corridor(6, 3);
        state.units.push(unit(901, HUMAN, 1, 3));
        state.planned_marches.push(PlayablePlannedMarch {
            unit_id: UnitId::new(MOVER),
            dest_q: 5,
            dest_r: 0,
            attack_unit_id: None,
            general_target_id: None,
        });
        let v = view(&state, NO_BUILD);
        assert_eq!(v.reachable, hs(&[2, 3, 1]));
        let route = v.path_route.clone().expect("trasa planu");
        assert_eq!(route.hexes, hs(&[0, 1, 2, 3, 4, 5]));
        // `planPathTurns` (`planned-march.ts:241-268`), perTurn = max(1, 3) = 3: i0..i2 acc 1..3;
        // i3 (4,0): 3 + 1 > 3 -> push (3,0) t1, acc 1; i4 acc 2; koniec (5,0) != (3,0) -> (5,0) t2.
        assert_eq!(
            route.turn_stops,
            vec![
                vm::overlays::PathTurnStopDto {
                    hex: HexCoord::new(3, 0),
                    turn: 1
                },
                vm::overlays::PathTurnStopDto {
                    hex: HexCoord::new(5, 0),
                    turn: 2
                },
            ]
        );
        assert_eq!(Some(route), path_route_overlay(&state, None));
        assert_eq!(
            v.selection,
            Some(SelectionDto {
                hex: HexCoord::new(0, 0),
                owner_id: vm::OwnerRef::Player(vm::PlayerId::try_new(HUMAN).unwrap()),
            })
        );
        assert!(v.build_highlight.hexes.is_empty());

        let mut dto = vm::OverlaysViewDto {
            culture_range: None,
            religion_range: None,
            trade_routes: Vec::new(),
            okolica: None,
            worker_fields: Vec::new(),
            reachable: Vec::new(),
            build_highlight: BuildHighlightDto {
                kind: BuildHighlightKind::Mine,
                hexes: hs(&[9]),
            },
            selection: None,
            path_route: None,
        };
        v.clone().write_into(&mut dto);
        assert_eq!(dto.reachable, v.reachable);
        assert_eq!(dto.build_highlight, v.build_highlight);
        assert_eq!(dto.selection, v.selection);
        assert_eq!(dto.path_route, v.path_route);
    }

    /// Brak zaznaczenia: pusty zasieg, brak trasy i markera (`main.ts:7116`, `:31148-31150`).
    #[test]
    fn q6_brak_zaznaczenia_bez_pol_jednostki() {
        let mut state = corridor(6, 3);
        state.selected_unit_id = None;
        let v = view(&state, NO_BUILD);
        assert!(v.reachable.is_empty());
        assert_eq!(v.path_route, None);
        assert_eq!(v.selection, None);
    }

    /// Tryby `refreshBuildHighlight` przez agregator (`main.ts:16351-16396`).
    #[test]
    fn q6_tryby_budowy_przez_agregator() {
        let state = corridor(6, 3);
        let found = view(
            &state,
            BuildHighlightUi {
                found_city_mode: true,
                ..NO_BUILD
            },
        );
        assert_eq!(found.build_highlight.kind, BuildHighlightKind::FoundCity);
        assert_eq!(found.build_highlight.hexes, hs(&[0, 2]));
        let wonder = view(
            &state,
            BuildHighlightUi {
                wonder_active: true,
                ..NO_BUILD
            },
        );
        assert_eq!(wonder.build_highlight.kind, BuildHighlightKind::Wonder);
        assert_eq!(wonder.build_highlight.hexes, hs(&[2]));
        let farm = view(
            &state,
            BuildHighlightUi {
                build_mode_open: true,
                active_improvement_key: Some("farma"),
                ..NO_BUILD
            },
        );
        assert_eq!(farm.build_highlight.kind, BuildHighlightKind::Improvement);
        assert_eq!(farm.build_highlight.hexes, hs(&[1, 2]));
        // Kopalnia zloza (`isMineImprovementKey`, `main.ts:16386-16390`): ten sam zbior heksow,
        // rodzaj `Mine` (obrona r1, zarzut 6).
        let mine = view(
            &state,
            BuildHighlightUi {
                build_mode_open: true,
                active_improvement_key: Some("kopalnia_miedzi"),
                ..NO_BUILD
            },
        );
        assert_eq!(mine.build_highlight.kind, BuildHighlightKind::Mine);
        assert_eq!(mine.build_highlight.hexes, hs(&[1, 2]));
    }

    /// D-CMD-12 (obrona r1, zarzut 4): `selection` idzie z `UnitOverlaysInput::selection_ui`, nie
    /// z `state.selected_unit_id`.
    #[test]
    fn q6_selection_z_wejscia_ui_nie_ze_stanu() {
        let mut state = corridor(6, 3);
        state.units.push(unit(901, HUMAN, 1, 3));
        let map_hexes = [(0, 0)];
        let undo = HashSet::new();
        let src = BuildHighlightSources {
            map_hexes: &map_hexes,
            is_in_start_reveal: &|_, _| true,
            can_found_player_city_at: &|_, _| true,
            qualifying_wonder_hexes: &Vec::new,
            qualifying_hexes: &|_| Vec::new(),
            pending_undo_keys: &undo,
        };
        let with_ui = |selected: Option<u64>| {
            unit_overlays_view(
                &state,
                &UnitOverlaysInput {
                    hover: None,
                    build_ui: NO_BUILD,
                    build_sources: &src,
                    selection_ui: SelectionUi {
                        selected_unit_id: selected,
                    },
                },
            )
            .selection
        };
        assert_eq!(with_ui(Some(901)).map(|s| s.hex), Some(HexCoord::new(1, 0)));
        assert_eq!(with_ui(None), None);
    }
}
