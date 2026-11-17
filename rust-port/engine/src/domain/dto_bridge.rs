//! R-RUSTPORT-P4-364-DTO-BRIDGE-R1 (#364, czesc 1): produkcyjna warstwa, ktora z
//! [`PlayableState`] i wejsc fotela liczy DTO mgly, odkrycia rzek i zasiegow terytorium
//! AKTYWNEGO fotela `ME()`.
//!
//! Warstwa nie ma wlasnej logiki gry - sklada istniejacych producentow:
//! * mgla: [`refresh_fog`] (FOG-VIEW, `main.ts:13475-13513`) - wynik jest `FogViewDto` i
//!   `ViewerDto.fog_active` (`useFogRender = fogOn || revealAllLand`, `:13485`);
//! * odkrycie (L1/L2): [`FogRevealDto`] = opcje `setFog(vis, exploredForRender, { landReveal:
//!   revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })` (`:13490-13494`);
//!   `startRevealKeysForRiverFog` (`:13074-13080`) = `computeVisibleAt(start.q, start.r, map,
//!   startRevealRadius)` (`visibility.ts:64-79`), gdy `isAwaitingFirstPlayerCity()` (`:12882-12884`,
//!   `first-player-city.ts:14-20`) i fotel ma heks startu, inaczej `undefined`; bez mgly
//!   (`!useFogRender`, `:13505-13506`) pin wola `setFog(ALL_KEYS, ALL_KEYS)` BEZ opcji, wiec
//!   `revealAllLand` = `false` (tu i tak `false`, bo `useFogRender = false`) i `riverRevealKeys` =
//!   brak (`None`). Klucze NIE pochodza z `rzeka_krawedzie` (`scene.ts:1263-1264` to logika gry);
//! * zasiegi terytorium (F2): [`territory_ranges_dto`] (view-model) na wejsciach z `PlayableState`:
//!   `Object.keys(map.hexes)` = [`hex_order`] (kontrakt §1.4), wezly = `buildAllTerritoryNodes()`
//!   (`main.ts:5667-5678`: miasta `{pop: population, level: 1, ownerId}` w kolejnosci `cities`, potem
//!   `fortTerritoryNodes(fortNodes)` - port engine [`fort_territory_nodes`]), filtr mgly
//!   `refreshTerritoryBorderOverlay` (`:15593-15601`): `isMe(owner)` -> zawsze, `!fogOn` -> zawsze,
//!   inaczej `currentVisible()` ∪ `fogExploredForRender()` - TE SAME zbiory, ktore zwrocil
//!   [`refresh_fog`] dla fotela `ME()` (gra wola filtr po `refreshFog`, na tym samym stanie).
//!
//! Decyzje techniczne (raport `01-operator-r1.md`):
//! * D-BR-1: `playerEverOwnedCityByOwner` (`main.ts:3042`, zbior per fotel) nie jest w
//!   `PlayableState` (jest tylko `gracz_kiedys_mial_miasto` - jedna flaga), wiec podaje go wolajacy
//!   (jak Z-FOG-1 dla `exploredByHuman`).
//! * D-BR-2: filtr terytorium czyta `fogOn` (`:15597`), NIE `useFogRender`: przy `fogOn = false` i
//!   `revealAllLand = true` pin nie filtruje terytorium, choc `fog_active = true`. Dlatego
//!   [`build_territory_layers`] bierze `fog_on`, a nie `fog_active` (odstepstwo od sygnatury w
//!   dispatchu, ktore zmienialoby wynik wzgledem pinu).
//! * D-BR-3: filtr potrzebuje tez `currentVisible()`, wiec [`build_territory_layers`] bierze zbior
//!   `visible` (z [`FogLayers::visible`]).
//! * D-BR-4: `MissingStartHex` jest w [`DtoBridgeError`] (dispatch), ale producent go NIE zwraca: brak
//!   heksu startu w pinie daje `undefined` (`:13078`), czyli `river_reveal_keys = None`.
//! * D-BR-5: kontrakt mostu JSON (`EngineCommand`/`BridgeResult`) i pola `RenderLayersDto` bez zmian.

use std::collections::{BTreeSet, HashSet};
use std::fmt;

use civ_view_model::map::FogRevealDto;
use civ_view_model::{
    territory_ranges_dto, FogViewDto, HexCoord, OwnerRef as VmOwnerRef, PlayerId as VmPlayerId,
    TerritoryFogFilter, TerritoryNodeInput, TerritoryNodeOrder, TerritoryRangesDto,
};

use crate::domain::fort_territory::{fort_territory_nodes, OrderedFortNode};
use crate::domain::pathfinding::ruch_jednostek::Klucz;
use crate::domain::playable::{PlayableFortKind, PlayableState};
use crate::domain::playable_movement::{klucz_of, ruch_mapa_from_state};
use crate::domain::player::is_awaiting_first_player_city;
use crate::domain::terrain::visibility::compute_visible_at;
use crate::domain::terrain::visibility::fog_view::{
    hex_order, refresh_fog, ExploredByHuman, FogViewError, FogViewInputs,
};
use crate::domain::terrain::{CityNode, FortImprovementType, FortNode};
use crate::domain::territory::TerritoryNode;
use crate::domain::{OwnerRef, PlayerId};

/// Blad warstwy DTO-BRIDGE.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DtoBridgeError {
    /// Web `exploredByHuman.get(ME())!` bez wpisu (wyjatek w JS) - z [`refresh_fog`].
    MissingExploredSeat(u64),
    /// Brak heksu startu fotela. Zarezerwowany (D-BR-4): pin daje wtedy `undefined`, wiec
    /// [`build_fog_layers`] zwraca `river_reveal_keys = None`, a nie ten blad.
    MissingStartHex(u64),
    /// Id gracza poza zakresem id DTO (`MAX_SAFE_ID`).
    IdOutOfRange(u64),
}

impl fmt::Display for DtoBridgeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingExploredSeat(seat) => {
                write!(f, "exploredByHuman nie ma wpisu fotela {seat}")
            }
            Self::MissingStartHex(seat) => write!(f, "fotel {seat} nie ma heksu startu"),
            Self::IdOutOfRange(id) => write!(f, "id gracza {id} poza zakresem DTO"),
        }
    }
}

impl std::error::Error for DtoBridgeError {}

impl From<FogViewError> for DtoBridgeError {
    fn from(e: FogViewError) -> Self {
        match e {
            FogViewError::MissingExploredSeat(seat) => Self::MissingExploredSeat(seat),
        }
    }
}

/// Warstwy mgly aktywnego fotela.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FogLayers {
    /// `FogViewDto` rownolegle do `map.hexes`.
    pub fog: FogViewDto,
    /// `ViewerDto.fog_active` (`useFogRender`).
    pub fog_active: bool,
    /// Opcje `setFog` (L1/L2).
    pub reveal: FogRevealDto,
    /// Web `vis = currentVisible()` (wejscie filtra terytorium).
    pub visible: BTreeSet<Klucz>,
    /// Web `exploredForRender` (wejscie filtra terytorium).
    pub explored_for_render: BTreeSet<Klucz>,
}

/// Wszystkie warstwy DTO-BRIDGE aktywnego fotela, policzone na jednym stanie.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DtoBridgeLayers {
    /// Mgla i odkrycie.
    pub fog: FogLayers,
    /// Zasiegi terytorium widziane przez fotel.
    pub territory: TerritoryRangesDto,
}

/// Web `isAwaitingFirstPlayerCity(ME())` (`main.ts:12882-12884`) dla fotela `seat`.
#[must_use]
pub fn is_awaiting_first_city(
    state: &PlayableState,
    seat: PlayerId,
    player_ever_owned_city_by_owner: &BTreeSet<PlayerId>,
) -> bool {
    is_awaiting_first_player_city(
        player_ever_owned_city_by_owner.contains(&seat),
        state.cities.iter().map(|c| OwnerRef::Player(c.owner_id)),
        seat,
    )
}

/// Web `startRevealKeysForRiverFog()` (`main.ts:13074-13080`) dla fotela `inputs.active_seat`,
/// w kolejnosci kontraktu (`r`-major, `q`-minor). `None` = `undefined`.
#[must_use]
pub fn start_reveal_keys_for_river_fog(
    state: &PlayableState,
    inputs: &FogViewInputs<'_>,
    player_ever_owned_city_by_owner: &BTreeSet<PlayerId>,
) -> Option<Vec<HexCoord>> {
    let me = inputs.active_seat;
    let &(q, r) = inputs.player_start_hex_by_owner.get(&me)?;
    if !is_awaiting_first_city(state, me, player_ever_owned_city_by_owner) {
        return None;
    }
    let map = ruch_mapa_from_state(state);
    let mut keys: Vec<Klucz> = compute_visible_at(q, r, &map, inputs.start_reveal_radius)
        .into_iter()
        .collect();
    keys.sort_by_key(|&(q, r)| (r, q));
    Some(keys.into_iter().map(|(q, r)| HexCoord::new(q, r)).collect())
}

/// Mgla, `fog_active` i [`FogRevealDto`] aktywnego fotela (`refreshFog`, `main.ts:13475-13513`).
/// Dopisuje widoczne heksy do eksploracji fotela (jak [`refresh_fog`]).
///
/// # Errors
///
/// [`DtoBridgeError::MissingExploredSeat`], gdy `explored_by_human` nie ma wpisu fotela.
pub fn build_fog_layers(
    state: &PlayableState,
    inputs: &FogViewInputs<'_>,
    player_ever_owned_city_by_owner: &BTreeSet<PlayerId>,
    explored_by_human: &mut ExploredByHuman,
) -> Result<FogLayers, DtoBridgeError> {
    let view = refresh_fog(state, inputs, explored_by_human)?;
    let reveal = if view.fog_active {
        FogRevealDto {
            reveal_all_land: inputs.reveal_all_land,
            river_reveal_keys: start_reveal_keys_for_river_fog(
                state,
                inputs,
                player_ever_owned_city_by_owner,
            ),
        }
    } else {
        // `setFog(ALL_KEYS, ALL_KEYS)` bez opcji (`:13506`).
        FogRevealDto {
            reveal_all_land: false,
            river_reveal_keys: None,
        }
    };
    Ok(FogLayers {
        fog: view.fog,
        fog_active: view.fog_active,
        reveal,
        visible: view.visible,
        explored_for_render: view.explored_for_render,
    })
}

fn vm_player(id: PlayerId) -> Result<VmPlayerId, DtoBridgeError> {
    VmPlayerId::try_new(id.get()).map_err(|e| DtoBridgeError::IdOutOfRange(e.value))
}

fn owner_raw(id: PlayerId) -> Result<i64, DtoBridgeError> {
    i64::try_from(id.get()).map_err(|_| DtoBridgeError::IdOutOfRange(id.get()))
}

/// Web `buildAllTerritoryNodes()` (`main.ts:5667-5678`) jako wezly engine ([`TerritoryNode`]):
/// miasta w kolejnosci `state.cities`, potem `fortTerritoryNodes(fortNodes)` ([`fort_territory_nodes`]:
/// bez `contestedUseless`, `order` tylko przy `seq`).
///
/// # Errors
///
/// [`DtoBridgeError::IdOutOfRange`], gdy id wlasciciela nie miesci sie w `i64`.
pub fn engine_territory_nodes(state: &PlayableState) -> Result<Vec<TerritoryNode>, DtoBridgeError> {
    let mut nodes = Vec::with_capacity(state.cities.len() + state.forts.len());
    for c in &state.cities {
        let (q, r) = klucz_of(c.position);
        nodes.push(TerritoryNode::new(
            CityNode::city(q, r, f64::from(c.population)),
            owner_raw(c.owner_id)?,
        ));
    }
    let mut forts = Vec::with_capacity(state.forts.len());
    for f in &state.forts {
        forts.push(OrderedFortNode::new(
            FortNode {
                q: f.q,
                r: f.r,
                owner_id: owner_raw(f.owner_id)?,
                kind: match f.kind {
                    PlayableFortKind::Fort => FortImprovementType::Fort,
                    PlayableFortKind::Posterunek => FortImprovementType::Posterunek,
                },
                contested_useless: f.contested_useless,
            },
            f.built_at_turn,
            f.seq,
        ));
    }
    nodes.extend(fort_territory_nodes(&forts));
    Ok(nodes)
}

fn node_input(node: &TerritoryNode) -> Result<TerritoryNodeInput, DtoBridgeError> {
    let owner = u64::try_from(node.owner_id).map_err(|_| {
        // Wlasciciel z `PlayableState` jest zawsze `PlayerId` (u64); ujemny tu nie wystepuje.
        DtoBridgeError::IdOutOfRange(node.owner_id.unsigned_abs())
    })?;
    // `turn`/`seq` to numery tury i budowy (male liczby calkowite) - JS `number`.
    #[allow(clippy::cast_precision_loss)]
    let order = node.order.map(|o| TerritoryNodeOrder {
        turn: o.turn as f64,
        seq: o.seq as f64,
    });
    Ok(TerritoryNodeInput {
        hex: HexCoord::new(node.node.q, node.node.r),
        owner_id: VmOwnerRef::Player(vm_player(PlayerId::new(owner))?),
        pop: node.node.pop,
        is_outpost: node.node.is_outpost == Some(true),
        is_fort: node.node.is_fort == Some(true),
        order,
    })
}

/// Wezly `buildAllTerritoryNodes()` jako wejscie producenta view-model ([`TerritoryNodeInput`]).
///
/// # Errors
///
/// [`DtoBridgeError::IdOutOfRange`] dla id spoza zakresu DTO.
pub fn territory_node_inputs(
    state: &PlayableState,
) -> Result<Vec<TerritoryNodeInput>, DtoBridgeError> {
    engine_territory_nodes(state)?
        .iter()
        .map(node_input)
        .collect()
}

fn to_hex_set(keys: &BTreeSet<Klucz>) -> HashSet<HexCoord> {
    keys.iter().map(|&(q, r)| HexCoord::new(q, r)).collect()
}

/// [`TerritoryRangesDto`] widziany przez fotel `active_seat` (`refreshTerritoryBorderOverlay`,
/// `main.ts:15586-15601`). `visible` / `explored_for_render` = `currentVisible()` /
/// `fogExploredForRender()` tego fotela (z [`build_fog_layers`]); czytane tylko przy `fog_on`.
///
/// # Errors
///
/// [`DtoBridgeError::IdOutOfRange`] dla id spoza zakresu DTO.
pub fn build_territory_layers(
    state: &PlayableState,
    active_seat: PlayerId,
    fog_on: bool,
    visible: &BTreeSet<Klucz>,
    explored_for_render: &BTreeSet<Klucz>,
) -> Result<TerritoryRangesDto, DtoBridgeError> {
    let order: Vec<HexCoord> = hex_order(state)
        .into_iter()
        .map(|(q, r)| HexCoord::new(q, r))
        .collect();
    let nodes = territory_node_inputs(state)?;
    let visible = to_hex_set(visible);
    let explored = to_hex_set(explored_for_render);
    let filter = TerritoryFogFilter {
        me: VmOwnerRef::Player(vm_player(active_seat)?),
        fog_on,
        visible: &visible,
        explored: &explored,
    };
    Ok(territory_ranges_dto(&order, &nodes, &filter))
}

/// Mgla, odkrycie i zasiegi terytorium aktywnego fotela na jednym stanie: najpierw
/// [`build_fog_layers`] (dopisuje eksploracje), potem [`build_territory_layers`] na zbiorach tej
/// samej mgly - kolejnosc gry (`refreshFog`, potem filtr terytorium).
///
/// # Errors
///
/// Jak [`build_fog_layers`] i [`build_territory_layers`].
pub fn build_view_layers(
    state: &PlayableState,
    inputs: &FogViewInputs<'_>,
    player_ever_owned_city_by_owner: &BTreeSet<PlayerId>,
    explored_by_human: &mut ExploredByHuman,
) -> Result<DtoBridgeLayers, DtoBridgeError> {
    let fog = build_fog_layers(
        state,
        inputs,
        player_ever_owned_city_by_owner,
        explored_by_human,
    )?;
    let territory = build_territory_layers(
        state,
        inputs.active_seat,
        inputs.fog_on,
        &fog.visible,
        &fog.explored_for_render,
    )?;
    Ok(DtoBridgeLayers { fog, territory })
}
