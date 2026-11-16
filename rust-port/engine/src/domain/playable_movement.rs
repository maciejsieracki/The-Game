//! P4-1H Q4 (`R-RUSTPORT-P4-1H-MOVE-MODEL-Q4`, #250): adapter `PlayableState` -> model ruchu weba
//! (`pathfinding::ruch_jednostek`: `RuchMapa`, `RuchJednostka`, `MoveOccupancy`).
//!
//! Pin: `07d2fbd72` (`gra/src/units/setup.ts`, `gra/src/main.ts`). Adapter jest czysty (tylko odczyt
//! stanu); nie zmienia zachowania `PlayableGame::move_unit` (to temat Q6, #252).
//!
//! Odwzorowanie (decyzje techniczne, opisane w raporcie `01-operator-r1.md`):
//! - wspolrzedne: `PositionDto.x` = web `q`, `PositionDto.y` = web `r` (ta sama konwencja co
//!   `playable.rs::axial_distance`, `save_load::restore_playable_planned_marches`,
//!   `turn_war_inputs::trade_map_from_state`);
//! - teren: [`teren_of`]; `PlayableTile.passable` jest polem pochodnym terenu
//!   (`PlayableTerrain::is_passable`) i NIE jest czytane - przejezdnosc wynika z kosztu terenu jak w
//!   webie (`terrainMoveCost` = `Infinity`, `setup.ts:639-657`);
//! - ruch: web `ruch` / `ruchLeft` sa liczbami zmiennoprzecinkowymi (`RuntimeUnit`, `setup.ts:40`);
//!   model ruchu jest `f64` (1:1 z pinem); od Q6 magazyn `PlayableUnit.movement` / `movement_max`
//!   tez jest `f64` (`MovementPoints`), konwersja `f64::from` jest tozsamoscia (patrz
//!   [`ruch_jednostka_of`]);
//! - zajetosc: web `occupiedForMove` (`main.ts:14578-14584`) = `buildMoveOccupancy`
//!   (`setup.ts:759-776`) + heksy obcych miast (`foreignCityHexKeys`) dodane do blokad i usuniete z
//!   `passThrough` ([`occupied_for_move`]).

use std::collections::{BTreeSet, HashMap};
use std::sync::OnceLock;

use crate::data::units_combat::parse_units;
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::{PathRouteDto, PathTurnStopDto};

use crate::domain::army_follow_auto_merge::{
    can_join_stack_at, trim_path_to_stack_room, FollowAutoMergeUnit,
};
use crate::domain::pathfinding::ruch_jednostek::{
    apply_fog_to_path_plan, build_move_occupancy, execute_march_step_occ, hex_distance, path_cost,
    plan_path_turns_occ, stack_group_id_of, Klucz, MarchStopReason, MoveOccupancy, PathTurnPlan,
    PlannedMarchDest, RuchHex, RuchJednostka, RuchMapa, TerenBazowy,
};
use crate::domain::pathfinding::{
    add_foreign_city_block_coords, can_unit_occupy_city_hex, CityHexRef,
};
use crate::domain::playable::{
    base_type_id, MovementPoints, PlayableError, PlayableMarchStopReason, PlayablePlannedMarch,
    PlayableState, PlayableTerrain, PlayableTile, PlayableUnit,
};
use crate::domain::save_migrations::ARMY_STACK_LIMIT;
use crate::domain::unit_replace_defs::category_of;
use crate::domain::{PlayerId, PositionDto, UnitId};

/// Klucz heksa modelu ruchu (`(q, r)`) dla pozycji `PlayableState`.
pub fn klucz_of(position: PositionDto) -> Klucz {
    (i32::from(position.x()), i32::from(position.y()))
}

/// `PlayableTerrain` -> (`TerenBazowy`, las = web `hex.nakladka === Nakladka.Las`).
///
/// `PlayableTerrain` to uproszczony teren slice'a (4 warianty), bez bezposredniego odpowiednika w
/// webie; odwzorowanie wybrane tak, by koszt ruchu byl kosztem pinu dla tego samego terenu:
/// - `Plains` -> `Rownina` (koszt 1, `terrain-movement.json` `Rownina: 1`; ta sama etykieta
///   `rownina` co `Terrain::Plains` w `mapgen` i `TerrainType::Plains` w ekonomii);
/// - `Hills` -> `Wzgorza` (koszt 2, `Wzgorza: 2`);
/// - `Forest` -> `Rownina` + las (koszt `1 + forestExtra` = 2, `setup.ts:651-654`): w webie las jest
///   nakladka na teren bazowy, nie terenem bazowym;
/// - `Water` -> `Morze` (koszt `99 >= 90` = `Infinity`, `setup.ts:443`; ta sama decyzja co
///   `Water -> TradeTerrain::Ocean` w `turn_war_inputs`).
pub const fn teren_of(terrain: PlayableTerrain) -> (TerenBazowy, bool) {
    match terrain {
        PlayableTerrain::Plains => (TerenBazowy::Rownina, false),
        PlayableTerrain::Hills => (TerenBazowy::Wzgorza, false),
        PlayableTerrain::Forest => (TerenBazowy::Rownina, true),
        PlayableTerrain::Water => (TerenBazowy::Morze, false),
    }
}

/// Heks modelu ruchu dla kafla stanu. Warstwy ulepszen (`map.improvements`, web `hex.ulepszenie` /
/// `hex.ulepszenia`) przechodza 1:1 - czyta je `applyRoadMovementModifier` (drogi). Pol, ktorych
/// `PlayableState` nie ma, adapter nie zgaduje: `rzeka = false` (brak rzek w stanie), `wioska = false`
/// (brak wiosek), `ma_wlasciciela = false` (brak wlasciciela heksa w stanie).
pub fn ruch_hex_of(state: &PlayableState, tile: &PlayableTile) -> RuchHex {
    let (teren, las) = teren_of(tile.terrain);
    let mut hex = RuchHex::new(teren);
    hex.las = las;
    if let Some(layers) = state
        .map
        .improvements
        .iter()
        .find(|entry| entry.position == tile.position)
    {
        hex.ulepszenie = layers.ulepszenie.clone();
        hex.ulepszenia = layers.ulepszenia.clone();
    }
    hex
}

/// Web `GameMap.hexes` dla mapy stanu: kazdy kafel -> heks pod kluczem `(x, y)`.
pub fn ruch_mapa_from_state(state: &PlayableState) -> RuchMapa {
    let mut mapa = RuchMapa::new();
    for tile in &state.map.tiles {
        mapa.insert(klucz_of(tile.position), ruch_hex_of(state, tile));
    }
    mapa
}

/// Kategoria typu z `units.json` (web `categoryOf(name, role, isSuper, typ)` przy tworzeniu
/// jednostki). Typ spoza `units.json` (w webie niemozliwy) dostaje `categoryOf` z samej nazwy.
fn category_of_type(type_id: &str) -> String {
    static BY_NAME: OnceLock<HashMap<String, &'static str>> = OnceLock::new();
    let table = BY_NAME.get_or_init(|| {
        parse_units()
            .expect("embedded units.json must parse")
            .iter()
            .map(|record| {
                (
                    record.jednostka.clone(),
                    category_of(
                        &record.jednostka,
                        &record.rola_linia,
                        record.super_jednostka == "TAK",
                        Some(&record.typ),
                    ),
                )
            })
            .collect()
    });
    table
        .get(type_id)
        .copied()
        .unwrap_or_else(|| category_of(type_id, "", false, None))
        .to_owned()
}

/// Web `RuntimeUnit` (podzbior ruchu) dla jednostki stanu.
///
/// - `id` = zapis dziesietny `UnitId` (jak `save_load::restore_playable_planned_marches`);
/// - `owner_id` = surowe `PlayerId` (model ruchu porownuje wlascicieli tylko rownoscia);
/// - `type_id` / `category`: stan zamiany (`economy.units`) albo typ startowy `PlayableUnitKind`;
/// - `ruch` = `movement_max`, `ruch_left` = `movement` (`f64`, bez zaokraglen);
/// - pola, ktorych stan nie ma, sa web-falsy: `embarked`, `oblega_city_id`, `auto_explore`,
///   `sentry`, `stack_group_id` = `None`, `in_garnizon = false`.
pub fn ruch_jednostka_of(state: &PlayableState, unit: &PlayableUnit) -> RuchJednostka {
    let replace = state.economy.units.get(&unit.id.get());
    let type_id = replace
        .and_then(|entry| entry.type_id.clone())
        .unwrap_or_else(|| base_type_id(unit.kind).to_owned());
    let category = replace
        .and_then(|entry| entry.category.clone())
        .unwrap_or_else(|| category_of_type(&type_id));
    let (q, r) = klucz_of(unit.position);
    let mut out = RuchJednostka::new(
        &unit.id.to_string(),
        owner_raw(unit.owner_id.get()),
        &category,
        q,
        r,
    );
    out.type_id = Some(type_id);
    out.ruch = f64::from(unit.movement_max);
    out.ruch_left = f64::from(unit.movement);
    out
}

/// Wszystkie jednostki stanu w kolejnosci `state.units` (web tablica `units`).
pub fn ruch_jednostki_from_state(state: &PlayableState) -> Vec<RuchJednostka> {
    state
        .units
        .iter()
        .map(|unit| ruch_jednostka_of(state, unit))
        .collect()
}

/// Web `CityHexRef` dla miast stanu (`ma_mur`: stan nie ma muru -> `None`, web `undefined`).
pub fn city_hex_refs(state: &PlayableState) -> Vec<CityHexRef> {
    state
        .cities
        .iter()
        .map(|city| {
            let (q, r) = klucz_of(city.position);
            CityHexRef {
                q,
                r,
                owner_id: owner_raw(city.owner_id.get()),
                ma_mur: None,
            }
        })
        .collect()
}

/// Web `occupiedForMove(moverOwnerId, ...exceptIds)` (`main.ts:14578-14584`):
/// `buildMoveOccupancy(units, moverOwnerId, exceptIds)` (`setup.ts:759-776`: obce jednostki =
/// blokada, wlasne = `passThrough`), potem kazdy heks obcego miasta (`foreignCityHexKeys`,
/// `city-hex-movement.ts:66`) jest dodawany do blokad i usuwany z `passThrough`.
pub fn occupied_for_move(
    state: &PlayableState,
    mover_owner_id: i64,
    except_ids: &[UnitId],
) -> MoveOccupancy {
    let units = ruch_jednostki_from_state(state);
    let except: Vec<String> = except_ids.iter().map(ToString::to_string).collect();
    let except_refs: Vec<&str> = except.iter().map(String::as_str).collect();
    let mut occ = build_move_occupancy(&units, mover_owner_id, &except_refs);
    // `foreignCityHexKeys` z RJ-REPIN Q3 (wariant na wspolrzednych: `MoveOccupancy` uzywa `(q, r)`,
    // nie kluczy tekstowych), bez wlasnej kopii filtra wlasciciela.
    let foreign =
        add_foreign_city_block_coords(&BTreeSet::new(), mover_owner_id, &city_hex_refs(state));
    for hex in foreign {
        let key = (hex.q, hex.r);
        occ.blocked.insert(key);
        occ.pass_through.remove(&key);
    }
    occ
}

/// Surowe id wlasciciela jako liczba modelu ruchu (`PlayerId` -> `i64`, bez utraty dla `<= i64::MAX`).
fn owner_raw(raw: u64) -> i64 {
    i64::try_from(raw).expect("PlayerId miesci sie w i64")
}

/// Komplet wejsc modelu ruchu z jednego stanu: mapa, jednostki, miasta.
#[derive(Debug, Clone, PartialEq)]
pub struct PlayableMoveModel {
    pub mapa: RuchMapa,
    pub jednostki: Vec<RuchJednostka>,
    pub miasta: Vec<CityHexRef>,
}

impl PlayableMoveModel {
    pub fn from_state(state: &PlayableState) -> Self {
        Self {
            mapa: ruch_mapa_from_state(state),
            jednostki: ruch_jednostki_from_state(state),
            miasta: city_hex_refs(state),
        }
    }

    /// Jednostka modelu o danym id stanu.
    pub fn jednostka(&self, unit_id: UnitId) -> Option<&RuchJednostka> {
        let id = unit_id.to_string();
        self.jednostki.iter().find(|unit| unit.id == id)
    }
}

// ---------------------------------------------------------------------------
// P4-1H Q5 (`R-RUSTPORT-P4-1H-PREVIEW-Q5`, #251): podglad trasy marszu
// ---------------------------------------------------------------------------

/// Web `playerStackAt(u)` (`main.ts:14694-14699`) = `activeUnitStack(units, u)`
/// (`armyMerge.ts:243-252`): jednostka bez garnizonu -> `visibleStackOnHex(units, u.q, u.r, u.ownerId,
/// stackGroupIdOf(u))` (`armyMerge.ts:89-105`). `PlayableState` nie ma garnizonu ani `stackGroupId`
/// (adapter Q4: `in_garnizon = false`, `stack_group_id = None`), wiec grupa = `stackGroupIdOf` z
/// fallbacku `owner|q,r` (`armyMerge.ts:57-62`) - stos to wszystkie jednostki wlasciciela na heksie,
/// w kolejnosci `units`.
pub fn player_stack_at<'a>(
    jednostki: &'a [RuchJednostka],
    unit: &RuchJednostka,
) -> Vec<&'a RuchJednostka> {
    let group = stack_group_id_of(unit);
    jednostki
        .iter()
        .filter(|u| {
            u.owner_id == unit.owner_id
                && u.q == unit.q
                && u.r == unit.r
                && !u.in_garnizon
                && stack_group_id_of(u) == group
        })
        .collect()
}

/// Web `unitWithPlanningStackRuch(unit, stack)` (`armyMerge.ts:1180-1186`): `ruchLeft` = minimum
/// `planningUnitRuchLeft` stosu (`armyMerge.ts:918-929`; `fortifyRuchSnapshot` nie istnieje w stanie,
/// wiec = `ruchLeft`); pusty stos -> 0.
pub fn unit_with_planning_stack_ruch(
    unit: &RuchJednostka,
    stack: &[&RuchJednostka],
) -> RuchJednostka {
    let pooled = if stack.is_empty() {
        0.0
    } else {
        stack
            .iter()
            .map(|u| u.ruch_left)
            .fold(f64::INFINITY, f64::min)
    };
    let mut mover = unit.clone();
    mover.ruch_left = pooled;
    mover
}

/// Web `perTurnMoveForUnit(u)` (`main.ts:31084-31095`): `Math.max(1, normFieldVal(u.ruch, ...))`.
/// `u.ruch` = `movement_max` (`f64`, zawsze skonczone), wiec fallback `def['Ruch']` nie zachodzi.
pub fn per_turn_move_for_unit(unit: &RuchJednostka) -> f64 {
    1.0_f64.max(unit.ruch)
}

/// Cel podgladu wybrany jak w webie: aktywny plan marszu ma pierwszenstwo nad heksem pod kursorem
/// (`main.ts:32335-32340`: `if (plannedMarches.has(uSel.id)) { refreshPlannedMarchPreview(uSel.id); return; }`
/// -> `refreshHoverPathPreview(uSel, hit.q, hit.r)`). Bez planu i bez celu -> `None`.
fn preview_destination(
    state: &PlayableState,
    unit_id: UnitId,
    destination: Option<PositionDto>,
) -> Option<Klucz> {
    if let Some(plan) = state.planned_marches.iter().find(|p| p.unit_id == unit_id) {
        return Some((plan.dest_q, plan.dest_r));
    }
    destination.map(klucz_of)
}

/// Plan trasy podgladu (`marchPathPlan`, `main.ts:31110-31122`) dla `refreshPlannedMarchPreview`
/// (`main.ts:31146-31179`) i `refreshHoverPathPreview` (`main.ts:31181-31209`):
/// - stos `playerStackAt(u)` (`:31158` / `:31182`), zajetosc `occupiedForMove(u.ownerId, ...stack ids)`
///   (`:31159` / `:31183`), `mover = unitWithPlanningStackRuch(u, stack)` (`:31160` / `:31184`);
/// - `perTurn = perTurnMoveForUnit(u)` (`:31166` / `:31198`), `budget = undefined` (`:31167` /
///   `:31199`) -> `None`;
/// - mgla: `applyFogToPathPlan` zwraca plan bez zmian (C-RUCH-Q1=B, `planned-march.ts:67`), wiec
///   kontekst mgly (`buildMarchFogContext`, `hoverDest.attackUnitId`) nie zmienia wyniku;
/// - koszt: `moveCostFnForUnit(u)` (`main.ts:14656-14658`) = `moveCostFnFor(u, ownerHasSeafaring(owner),
///   ...)`; `ownerHasSeafaring` (`main.ts:14589-14593`) zawiera galaz `ownerId === 0` (gracz weba), a
///   adapter przekazuje surowe `PlayerId` (gracz = 1) - mapowanie NIE_ZMIERZONO (erratum P4-1H), wiec
///   podglad przyjmuje `ownerHasSeafaring = false`: `canUnitEmbark` = `false` (stan nie ma `embarked`)
///   -> web `undefined` -> `None` (woda nieprzejezdna);
/// - oblezenie (`siegeBlocksEntry`): brak stanu oblezenia w `PlayableState` -> `None`.
///
/// Czysta funkcja (tylko odczyt stanu). `None`, gdy jednostka nie istnieje albo brak celu.
pub fn preview_path_plan(
    state: &PlayableState,
    unit_id: UnitId,
    destination: Option<PositionDto>,
) -> Option<PathTurnPlan> {
    let (dest_q, dest_r) = preview_destination(state, unit_id, destination)?;
    let model = PlayableMoveModel::from_state(state);
    let unit = model.jednostka(unit_id)?;
    let stack = player_stack_at(&model.jednostki, unit);
    let except: Vec<UnitId> = stack
        .iter()
        .filter_map(|u| u.id.parse::<u64>().ok().map(UnitId::new))
        .collect();
    let occ = occupied_for_move(state, unit.owner_id, &except);
    let mover = unit_with_planning_stack_ruch(unit, &stack);
    let per_turn = per_turn_move_for_unit(unit);
    let budget: Option<f64> = None;
    let raw = plan_path_turns_occ(
        &mover,
        f64::from(dest_q),
        f64::from(dest_r),
        &model.mapa,
        &occ,
        None,
        per_turn,
        budget,
        None,
    );
    Some(apply_fog_to_path_plan(
        raw,
        &model.mapa,
        per_turn,
        budget,
        None,
    ))
}

/// Zapytanie `preview_path`: argumenty `unitRenderer.setPathRoute([{q: u.q, r: u.r}, ...plan.fullPath],
/// { turnStops: plan.turnStops })` (`main.ts:31175-31178`, `:31204-31207`) jako [`PathRouteDto`].
/// `plan.fullPath.length === 0` -> `clearPathRoute()` (`main.ts:31171-31173`, `:31203`, `:31209`) -> `None`.
/// Jednostka z aktywnym planem ignoruje `destination` (trasa planu). Nie zmienia `PlayableState`.
pub fn preview_path(
    state: &PlayableState,
    unit_id: UnitId,
    destination: Option<PositionDto>,
) -> Option<PathRouteDto> {
    let plan = preview_path_plan(state, unit_id, destination)?;
    if plan.full_path.is_empty() {
        return None;
    }
    let unit = state.units.iter().find(|u| u.id == unit_id)?;
    let (uq, ur) = klucz_of(unit.position);
    let mut hexes = Vec::with_capacity(plan.full_path.len() + 1);
    hexes.push(HexCoord::new(uq, ur));
    hexes.extend(plan.full_path.iter().map(|&(q, r)| HexCoord::new(q, r)));
    let turn_stops = plan
        .turn_stops
        .iter()
        .map(|stop| PathTurnStopDto {
            hex: HexCoord::new(stop.q, stop.r),
            turn: stop.turn,
        })
        .collect();
    Some(PathRouteDto { hexes, turn_stops })
}

// ---------------------------------------------------------------------------
// P4-1H Q6 (`R-RUSTPORT-P4-1H-MOVE-Q6`, #252): rozkaz marszu `planMarchTo` + pierwszy segment
// ---------------------------------------------------------------------------

/// Web `planMarchTo` `:31268` (`showHintMessage('Marsz przerwany: brak trasy do celu')`).
pub const MARCH_NO_ROUTE_HINT: &str = "Marsz przerwany: brak trasy do celu";

/// Web `planMarchTo` `:31272-31275`.
pub const MARCH_FOREIGN_CITY_HINT: &str =
    "Obce miasto — stój na sąsiednim heksie i kliknij miasto, aby atakować.";

/// Web `executeMarchSegmentForUnit` `:31491` (brak MP stosu).
pub const MARCH_NO_MOVEMENT_HINT: &str = "Marsz przerwany: brak punktów ruchu";

/// Web `stackLimitBlockMessage(limit)` (`game/army-stack-limit.ts:221-223` @ `07d2fbd72`).
pub fn stack_limit_block_message(limit: i64) -> String {
    format!("Armia nie może mieć więcej niż {limit} jednostek (limit bitwy).")
}

/// Web `isNotifiableMarchStop` (`game/planned-march.ts:511-513`).
pub fn is_notifiable_march_stop(reason: Option<PlayableMarchStopReason>) -> bool {
    matches!(
        reason,
        Some(
            PlayableMarchStopReason::Obstacle
                | PlayableMarchStopReason::NoPath
                | PlayableMarchStopReason::BlockedCity
        )
    )
}

/// Web `marchPausedLabel(reason, detail)` (`game/planned-march.ts:519-525`).
pub fn march_paused_label(
    reason: Option<PlayableMarchStopReason>,
    detail: Option<&str>,
) -> Option<String> {
    if !is_notifiable_march_stop(reason) {
        return None;
    }
    // Web `if (detail)`: pusty napis jest falsy.
    if let Some(detail) = detail.filter(|d| !d.is_empty()) {
        return Some(detail.to_owned());
    }
    Some(
        match reason {
            Some(PlayableMarchStopReason::Obstacle) => "zablokowany heks na trasie",
            Some(PlayableMarchStopReason::BlockedCity) => "obce miasto na trasie",
            _ => "brak trasy do celu",
        }
        .to_owned(),
    )
}

/// Web `registerMarchStop(notified, unitId, reason)` (`game/planned-march.ts:532-541`).
pub fn register_march_stop(
    state: &mut PlayableState,
    unit_id: UnitId,
    reason: Option<PlayableMarchStopReason>,
) -> bool {
    let Some(reason) = reason.filter(|r| is_notifiable_march_stop(Some(*r))) else {
        return false;
    };
    if state.march_stop_notified.get(&unit_id) == Some(&reason) {
        return false;
    }
    state.march_stop_notified.insert(unit_id, reason);
    true
}

/// Web `noteMarchStop(unitId, stopReason, stopDetail)` (`main.ts:31437-31452`) w zakresie stanu:
/// `registerMarchStop` + `marchStopDetail.set(unitId, marchPausedLabel(...) ?? stopReason)`. Wpis
/// `warEventLog` (karta „Trasa wstrzymana”) i HUD to UI - poza `PlayableState`.
pub fn note_march_stop(
    state: &mut PlayableState,
    unit_id: UnitId,
    reason: Option<PlayableMarchStopReason>,
    detail: Option<&str>,
) {
    let Some(stop) = reason else {
        return;
    };
    if !register_march_stop(state, unit_id, reason) {
        return;
    }
    let label =
        march_paused_label(reason, detail).unwrap_or_else(|| web_stop_reason(stop).to_owned());
    state.march_stop_detail.insert(unit_id, label);
}

/// Napis weba `MarchStopReason` (`planned-march.ts:35`).
fn web_stop_reason(reason: PlayableMarchStopReason) -> &'static str {
    match reason {
        PlayableMarchStopReason::Obstacle => "obstacle",
        PlayableMarchStopReason::NoPath => "no_path",
        PlayableMarchStopReason::NoMovement => "no_movement",
        PlayableMarchStopReason::BlockedCity => "blocked_city",
        PlayableMarchStopReason::Fog => "fog",
    }
}

/// Powod zatrzymania modelu ruchu -> powod w stanie (te same napisy weba).
fn stop_reason_of(reason: MarchStopReason) -> PlayableMarchStopReason {
    match reason {
        MarchStopReason::Obstacle => PlayableMarchStopReason::Obstacle,
        MarchStopReason::NoPath => PlayableMarchStopReason::NoPath,
        MarchStopReason::NoMovement => PlayableMarchStopReason::NoMovement,
        MarchStopReason::BlockedCity => PlayableMarchStopReason::BlockedCity,
        MarchStopReason::Fog => PlayableMarchStopReason::Fog,
    }
}

/// Web `finishMarchSegmentHints(unitId, arrived, stopReason, stopDetail)` (`main.ts:31454-31475`) w
/// zakresie stanu: `clearMarchStop` + `marchStopDetail.delete`; dotarcie -> `plannedMarches.delete`
/// (TYLKO plan: web nie czysci tu `marchAttackTargets`); powod -> hint + `noteMarchStop`. Odswiezenie
/// podgladu trasy (`refreshPlannedMarchPreview`) to UI.
pub fn finish_march_segment_hints(
    state: &mut PlayableState,
    unit_id: UnitId,
    arrived: bool,
    stop_reason: Option<PlayableMarchStopReason>,
    stop_detail: Option<&str>,
) {
    state.march_stop_notified.remove(&unit_id);
    state.march_stop_detail.remove(&unit_id);
    if arrived {
        state.planned_marches.retain(|plan| plan.unit_id != unit_id);
        return;
    }
    if let Some(reason) = stop_reason {
        let prefix = if reason == PlayableMarchStopReason::Fog {
            "Marsz wstrzymany: "
        } else {
            "Marsz przerwany: "
        };
        state.status = format!(
            "{prefix}{}",
            stop_detail.unwrap_or_else(|| web_stop_reason(reason))
        );
        note_march_stop(state, unit_id, stop_reason, stop_detail);
    }
}

/// Web `isMe(ownerId)` (`main.ts:13748`) w `PlayableState`: wlasciciel jest graczem ludzkim
/// (`players[].is_human`). Surowe `PlayerId` - bez mapowania `ownerId === 0` weba (errata 2).
fn is_human_owner(state: &PlayableState, owner: PlayerId) -> bool {
    state
        .players
        .iter()
        .any(|player| player.is_human && player.id == owner)
}

/// Jednostka modelu jako `StackUnitLike` (`army-stack-limit.ts:14-19`) dla `canJoinStackAt` /
/// `trimPathToStackRoom`.
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

/// Pozycja stanu dla klucza heksa trasy (trasa lezy na mapie, wiec wspolrzedne sa nieujemne).
fn position_of(key: Klucz) -> PositionDto {
    let x = u16::try_from(key.0).expect("heks trasy lezy na mapie (q >= 0)");
    let y = u16::try_from(key.1).expect("heks trasy lezy na mapie (r >= 0)");
    PositionDto::new(x, y)
}

/// Ids stanu jednostek stosu (`RuchJednostka.id` = zapis dziesietny `UnitId`).
fn stack_unit_ids(stack: &[&RuchJednostka]) -> Vec<UnitId> {
    stack
        .iter()
        .filter_map(|u| u.id.parse::<u64>().ok().map(UnitId::new))
        .collect()
}

/// Wynik rozkazu marszu (web `planMarchTo` zwraca `true`; segment jest efektem ubocznym).
#[derive(Debug, Clone, PartialEq)]
pub enum MarchOrderOutcome {
    /// Plan zapisany; stos nie mial punktow ruchu (`planningStackRuchLeft(stack) > 0` falszywe,
    /// `main.ts:31294`) - segment nie byl wykonywany.
    PlannedWithoutSegment,
    /// Plan zapisany i wykonano probe pierwszego segmentu.
    Segment(MarchSegmentOutcome),
}

/// Wynik `executeMarchSegmentForUnit` (`main.ts:31477-31544`) bez animacji.
#[derive(Debug, Clone, PartialEq)]
pub enum MarchSegmentOutcome {
    /// Brak jednostki / planu / jednostka nie gracza (`:31486`) -> `false`.
    NotExecuted,
    /// `stackRuch <= 0` (`:31490-31493`).
    NoMovement,
    /// `executeMarchStep` bez ruchu (`!result.ok || movePath.length === 0`, `:31512-31515`):
    /// `noteMarchStop`, plan zostaje.
    Stopped {
        reason: Option<PlayableMarchStopReason>,
        detail: Option<String>,
    },
    /// `trimPathToStackRoom` zwrocil pusta trase (`:31518-31523`): plan usuniety.
    StackLimitCancelled,
    /// Stos przesuniety na koniec odcinka (`:44097-44107`).
    Moved {
        to: PositionDto,
        cost: f64,
        arrived: bool,
        stop_reason: Option<PlayableMarchStopReason>,
        /// `true`: po ruchu spelnione warunki `tryLaunchMarchAttack` (`main.ts:31132-31143`) -
        /// bitwa jest poza zakresem tematu, plan (z `attackUnitId`) zostaje bez zmian.
        attack_pending: bool,
    },
}

/// Web `executeMarchSegmentForUnit(unitId)` (`main.ts:31477-31544`) + skutki konca animacji
/// (`main.ts:44084-44194`) w zakresie stanu, bez animacji:
/// - stos `playerStackAt(u)`, `stackRuch = planningStackRuchLeft(stack)`; `<= 0` -> hint, koniec;
/// - `executeMarchStep(mover, dest, map, occ, stackRuch, canOccupy, perTurnMoveForUnit(u), fog,
///   moveCostFnForUnit(u))` (`:31499-31510`); `canOccupy(q, r)` = `canOccupyHexForUnit(u, q, r)` albo
///   cel ataku (`:31504-31506`); porazka -> hint + `noteMarchStop` (`:31512-31515`);
/// - `trimPathToStackRoom(units, stack, movePath, armyStackLimit())` (`:31518`): pusta -> **tylko**
///   `plannedMarches.delete` (`:31520`); przycieta -> `cost = pathCost(roomPath)`, `arrived = false`;
/// - koniec animacji: kazda jednostka stosu na ostatni heks (`:44097-44100`),
///   `deductStackRuchLeft(stack, moveCost)` (`:44102`: pula = minimum `ruchLeft` stosu, kazdemu
///   `max(0, pula - koszt)`, `armyMerge.ts:961`);
/// - `marchAttackTargets.get(id)` i warunki `tryLaunchMarchAttack` (cel istnieje, `hexDistance <= 1`)
///   -> bitwa poza zakresem (`attack_pending`, plan zostaje); inaczej `finishMarchSegmentHints`
///   (`:44180-44194`).
///
/// Poza stanem (nie przenoszone, brak pol w `PlayableState`): `isAnimating`,
/// `isAwaitingFirstPlayerCity`, zaokretowanie (`applyEmbarkStateAfterMove`, `:44106`: brak pola
/// `embarked` w `PlayableState` - cel na wodzie jest osiagany jak w pinie, kosztem 0, bo `pathCost`
/// liczy `Infinity` jako 0, ale flagi zaokretowania nie ma gdzie zapisac), `syncGeneralMarchTargets`,
/// `validateActiveSieges`, mgla, chatki, obozy, bonusy wizyty miast, `tryAutoCaptureEmptyCityAt`,
/// `sweepFortCaptures`, propozycja scalenia, kamera/zaznaczenie. Mgla (`buildMarchFogContext`) nie
/// zmienia wyniku (`applyFogToPathPlan` = no-op, C-RUCH-Q1=B). Koszt: `moveCostFnForUnit(u)` przy
/// `ownerHasSeafaring = false` -> `None` (jak `preview_path_plan`, errata 2: galaz `ownerId === 0`
/// NIE_ZMIERZONO). Oblezenie (`siegeBlocksEntry`): brak stanu -> `None`.
pub fn execute_march_segment_for_unit(
    state: &mut PlayableState,
    unit_id: UnitId,
) -> MarchSegmentOutcome {
    let Some(plan) = state
        .planned_marches
        .iter()
        .find(|plan| plan.unit_id == unit_id)
        .cloned()
    else {
        return MarchSegmentOutcome::NotExecuted;
    };
    let Some(owner) = state
        .units
        .iter()
        .find(|unit| unit.id == unit_id)
        .map(|unit| unit.owner_id)
    else {
        return MarchSegmentOutcome::NotExecuted;
    };
    if !is_human_owner(state, owner) {
        return MarchSegmentOutcome::NotExecuted;
    }
    let model = PlayableMoveModel::from_state(state);
    let unit = model
        .jednostka(unit_id)
        .expect("jednostka stanu ma odpowiednik w modelu ruchu");
    let stack = player_stack_at(&model.jednostki, unit);
    let mover = unit_with_planning_stack_ruch(unit, &stack);
    let stack_ruch = mover.ruch_left;
    if stack_ruch <= 0.0 {
        state.status = MARCH_NO_MOVEMENT_HINT.to_owned();
        return MarchSegmentOutcome::NoMovement;
    }
    let stack_ids = stack_unit_ids(&stack);
    let occ = occupied_for_move(state, unit.owner_id, &stack_ids);
    let dest = PlannedMarchDest {
        dest_q: f64::from(plan.dest_q),
        dest_r: f64::from(plan.dest_r),
        attack_unit_id: plan.attack_unit_id.map(|id| id.to_string()),
        general_target_id: plan.general_target_id.clone(),
    };
    let cities = city_hex_refs(state);
    let attack = plan.attack_unit_id.is_some();
    let (dest_q, dest_r) = (plan.dest_q, plan.dest_r);
    let owner_raw_id = unit.owner_id;
    let can_occupy = move |q: i32, r: i32| {
        can_unit_occupy_city_hex(owner_raw_id, q, r, &cities)
            || (attack && q == dest_q && r == dest_r)
    };
    let result = execute_march_step_occ(
        &mover,
        &dest,
        &model.mapa,
        &occ,
        None,
        stack_ruch,
        &can_occupy,
        per_turn_move_for_unit(unit),
        None,
        None,
    );
    let reason = result.stop_reason.map(stop_reason_of);
    if !result.ok || result.move_path.is_empty() {
        state.status = format!(
            "Marsz przerwany: {}",
            result.stop_detail.as_deref().unwrap_or("brak ruchu")
        );
        note_march_stop(state, unit_id, reason, result.stop_detail.as_deref());
        return MarchSegmentOutcome::Stopped {
            reason,
            detail: result.stop_detail,
        };
    }
    // Web `:31518`: `trimPathToStackRoom(units, stack, result.movePath, armyStackLimit())`.
    let all_units: Vec<FollowAutoMergeUnit> = model.jednostki.iter().map(stack_unit_like).collect();
    let moving: Vec<FollowAutoMergeUnit> = stack.iter().map(|u| stack_unit_like(u)).collect();
    let room_path = trim_path_to_stack_room(
        &all_units,
        &moving,
        &result.move_path,
        |key| (i64::from(key.0), i64::from(key.1)),
        ARMY_STACK_LIMIT,
    );
    if room_path.is_empty() {
        state.planned_marches.retain(|p| p.unit_id != unit_id);
        state.status = format!(
            "Marsz przerwany: {}",
            stack_limit_block_message(ARMY_STACK_LIMIT)
        );
        return MarchSegmentOutcome::StackLimitCancelled;
    }
    let (move_path, cost, arrived) = if room_path.len() != result.move_path.len() {
        let cost = path_cost(&room_path, &model.mapa, None);
        (room_path, cost, false)
    } else {
        (result.move_path, result.cost, result.arrived)
    };
    let last = *move_path.last().expect("niepusta trasa odcinka");
    let to = position_of(last);
    // Koniec animacji (`main.ts:44097-44107`): pozycja stosu i `deductStackRuchLeft(stack, cost)`.
    let pooled = state
        .units
        .iter()
        .filter(|u| stack_ids.contains(&u.id))
        .map(|u| u.movement.get())
        .fold(f64::INFINITY, f64::min);
    let left = MovementPoints::new(0.0_f64.max(pooled - cost));
    for unit in state.units.iter_mut().filter(|u| stack_ids.contains(&u.id)) {
        unit.position = to;
        unit.movement = left;
    }
    // `main.ts:44180-44194`: atak po dotarciu albo `finishMarchSegmentHints`.
    let attack_pending = state
        .march_attack_targets
        .get(&unit_id)
        .and_then(|target| state.units.iter().find(|u| u.id == *target))
        .is_some_and(|target| {
            // `tryLaunchMarchAttack` (`:31132-31143`): `currentVisible()` - brak widocznosci w
            // `PlayableState` (P4-1C), NIE_ZMIERZONO: warunek widocznosci pominiety.
            let (tq, tr) = klucz_of(target.position);
            hex_distance(last.0, last.1, tq, tr) <= 1
        });
    if attack_pending {
        state.status = format!(
            "Jednostka {unit_id} dotarła do celu ataku (bitwa poza zakresem tego wycinka)."
        );
    } else {
        state.status = format!("Jednostka {unit_id} ruszyła na {to}.");
        finish_march_segment_hints(
            state,
            unit_id,
            arrived,
            reason,
            result.stop_detail.as_deref(),
        );
    }
    MarchSegmentOutcome::Moved {
        to,
        cost,
        arrived,
        stop_reason: reason,
        attack_pending,
    }
}

/// Web `planMarchTo(destQ, destR, attackUnitId?)` (`main.ts:31213-31298` @ `07d2fbd72`) na stanie,
/// po bramkach komendy (`PlayableGame::move_unit_with_attack`: jednostka istnieje, nalezy do gracza,
/// jest zaznaczona). Kolejnosc jak w pinie:
/// 1. stos `playerStackAt(u)`, `occupiedForMove(u.ownerId, ...stack)`, `mover =
///    unitWithPlanningStackRuch(u, stack)` (`:31239-31241`);
/// 2. `attackTarget` = jednostka o `attackUnitId` (gdy podane; nieistniejaca -> brak ataku) albo obca
///    jednostka na celu (`!isMe(x.ownerId) && x.ownerId !== u.ownerId`, `:31243-31247`); widocznosc
///    celu (`:31248-31251`) - brak widocznosci w `PlayableState` (P4-1C), NIE_ZMIERZONO, pominieta;
/// 3. `marchPathPlan(mover, dest, occ, perTurnMoveForUnit(u), planningStackRuchLeft(stack), ...)`
///    (`:31257-31266`); `fullPath` puste -> [`PlayableError::MarchNoRoute`] (`:31267-31270`);
/// 4. bez ataku: `!canOccupyHexForUnit` -> [`PlayableError::MarchForeignCity`] (`:31271-31277`);
/// 5. bez ataku: `!canJoinStackAt(units, stack, dest, armyStackLimit())` ->
///    [`PlayableError::MarchStackLimit`] (`:31279-31282`, limit 500);
/// 6. `markPlayerMovedUnit`, `plannedMarches.set` (istniejacy wpis zostaje na swoim miejscu - web
///    `Map.set`; nowy na koncu), `marchStopNotified/Detail.delete`, `syncMarchAttackTarget`
///    (`:31284-31290`);
/// 7. `planningStackRuchLeft(stack) > 0` -> [`execute_march_segment_for_unit`] (`:31294-31296`).
///
/// Odrzucenie (kroki 3-5) nie zmienia stanu.
pub fn plan_march_to(
    state: &mut PlayableState,
    unit_id: UnitId,
    destination: PositionDto,
    attack_unit_id: Option<UnitId>,
) -> Result<MarchOrderOutcome, PlayableError> {
    let model = PlayableMoveModel::from_state(state);
    let unit = model
        .jednostka(unit_id)
        .ok_or(PlayableError::UnitNotFound(unit_id.get()))?;
    let unit_owner = state
        .units
        .iter()
        .find(|u| u.id == unit_id)
        .map(|u| u.owner_id)
        .ok_or(PlayableError::UnitNotFound(unit_id.get()))?;
    let stack = player_stack_at(&model.jednostki, unit);
    let stack_ids = stack_unit_ids(&stack);
    let occ = occupied_for_move(state, unit.owner_id, &stack_ids);
    let mover = unit_with_planning_stack_ruch(unit, &stack);
    let planning_ruch = mover.ruch_left;
    let (dest_q, dest_r) = klucz_of(destination);

    let attack_target = match attack_unit_id {
        Some(id) => state.units.iter().find(|u| u.id == id),
        None => state.units.iter().find(|u| {
            u.position == destination
                && !is_human_owner(state, u.owner_id)
                && u.owner_id != unit_owner
        }),
    }
    .map(|target| target.id);

    let per_turn = per_turn_move_for_unit(unit);
    let plan = apply_fog_to_path_plan(
        plan_path_turns_occ(
            &mover,
            f64::from(dest_q),
            f64::from(dest_r),
            &model.mapa,
            &occ,
            None,
            per_turn,
            Some(planning_ruch),
            None,
        ),
        &model.mapa,
        per_turn,
        Some(planning_ruch),
        None,
    );
    if plan.full_path.is_empty() {
        return Err(PlayableError::MarchNoRoute);
    }
    if attack_target.is_none() {
        let cities = city_hex_refs(state);
        if !can_unit_occupy_city_hex(unit.owner_id, dest_q, dest_r, &cities) {
            return Err(PlayableError::MarchForeignCity);
        }
        let all_units: Vec<FollowAutoMergeUnit> =
            model.jednostki.iter().map(stack_unit_like).collect();
        let moving: Vec<FollowAutoMergeUnit> = stack.iter().map(|u| stack_unit_like(u)).collect();
        if !can_join_stack_at(
            &all_units,
            &moving,
            i64::from(dest_q),
            i64::from(dest_r),
            ARMY_STACK_LIMIT,
        ) {
            return Err(PlayableError::MarchStackLimit {
                limit: ARMY_STACK_LIMIT,
            });
        }
    }

    state.mark_player_moved_unit(unit_id);
    let entry = PlayablePlannedMarch {
        unit_id,
        dest_q,
        dest_r,
        attack_unit_id: attack_target,
        general_target_id: None,
    };
    match state
        .planned_marches
        .iter_mut()
        .find(|plan| plan.unit_id == unit_id)
    {
        Some(existing) => *existing = entry,
        None => state.planned_marches.push(entry),
    }
    state.march_stop_notified.remove(&unit_id);
    state.march_stop_detail.remove(&unit_id);
    // Web `syncMarchAttackTarget` (`main.ts:31124-31130`).
    match attack_target {
        Some(target) => {
            state.march_attack_targets.insert(unit_id, target);
        }
        None => {
            state.march_attack_targets.remove(&unit_id);
        }
    }
    state.status = format!("Jednostka {unit_id}: marsz do {destination}.");
    if planning_ruch > 0.0 {
        Ok(MarchOrderOutcome::Segment(execute_march_segment_for_unit(
            state, unit_id,
        )))
    } else {
        Ok(MarchOrderOutcome::PlannedWithoutSegment)
    }
}
