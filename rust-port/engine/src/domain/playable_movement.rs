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
//!   model ruchu jest `f64` (1:1 z pinem), a magazyn `PlayableUnit.movement` / `movement_max` (`u8`)
//!   jest konwertowany bezstratnie `f64::from` (patrz [`ruch_jednostka_of`]);
//! - zajetosc: web `occupiedForMove` (`main.ts:14578-14584`) = `buildMoveOccupancy`
//!   (`setup.ts:759-776`) + heksy obcych miast (`foreignCityHexKeys`) dodane do blokad i usuniete z
//!   `passThrough` ([`occupied_for_move`]).

use std::collections::{BTreeSet, HashMap};
use std::sync::OnceLock;

use crate::data::units_combat::parse_units;
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::{PathRouteDto, PathTurnStopDto};

use crate::domain::pathfinding::ruch_jednostek::{
    apply_fog_to_path_plan, build_move_occupancy, plan_path_turns_occ, stack_group_id_of, Klucz,
    MoveOccupancy, PathTurnPlan, RuchHex, RuchJednostka, RuchMapa, TerenBazowy,
};
use crate::domain::pathfinding::{add_foreign_city_block_coords, CityHexRef};
use crate::domain::playable::{
    base_type_id, PlayableState, PlayableTerrain, PlayableTile, PlayableUnit,
};
use crate::domain::unit_replace_defs::category_of;
use crate::domain::{PositionDto, UnitId};

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
/// - `ruch` = `movement_max`, `ruch_left` = `movement` (`f64::from`, bezstratnie);
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
