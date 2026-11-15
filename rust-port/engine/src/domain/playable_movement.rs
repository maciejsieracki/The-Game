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

use std::collections::HashMap;
use std::sync::OnceLock;

use crate::data::units_combat::parse_units;
use crate::domain::pathfinding::ruch_jednostek::{
    build_move_occupancy, Klucz, MoveOccupancy, RuchHex, RuchJednostka, RuchMapa, TerenBazowy,
};
use crate::domain::pathfinding::CityHexRef;
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
    for city in city_hex_refs(state) {
        if city.owner_id != mover_owner_id {
            let key = (city.q, city.r);
            occ.blocked.insert(key);
            occ.pass_through.remove(&key);
        }
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
