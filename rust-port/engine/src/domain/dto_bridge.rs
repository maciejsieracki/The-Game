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
//! * D-BR-1: `playerEverOwnedCityByOwner` (`main.ts:3042`, zbior per fotel) podaje wolajacy
//!   (jak Z-FOG-1 dla `exploredByHuman`). Od R-RUSTPORT-P4-364-AWAITING-SEAT-R1 stan per fotel jest w
//!   `PlayableState` (`gracz_kiedys_mial_miasto` dla fotela glownego + `player_ever_owned_city`), a
//!   pelny zbior zwraca [`PlayableState::player_ever_owned_city_by_owner`]; API warstwy bez zmian.
//! * D-BR-2: filtr terytorium czyta `fogOn` (`:15597`), NIE `useFogRender`: przy `fogOn = false` i
//!   `revealAllLand = true` pin nie filtruje terytorium, choc `fog_active = true`. Dlatego
//!   [`build_territory_layers`] bierze `fog_on`, a nie `fog_active` (odstepstwo od sygnatury w
//!   dispatchu, ktore zmienialoby wynik wzgledem pinu).
//! * D-BR-3: filtr potrzebuje tez `currentVisible()`, wiec [`build_territory_layers`] bierze zbior
//!   `visible` (z [`FogLayers::visible`]).
//! * D-BR-4: `MissingStartHex` jest w [`DtoBridgeError`] (dispatch), ale producent go NIE zwraca: brak
//!   heksu startu w pinie daje `undefined` (`:13078`), czyli `river_reveal_keys = None`.
//! * D-BR-5: kontrakt mostu JSON (`EngineCommand`/`BridgeResult`) i pola `RenderLayersDto` bez zmian.
//!
//! R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 (#364, czesc 2; decyzja orkiestratora D-364-2): wolajacy
//! produkcyjny warstw = komenda mostu `GetRenderLayers` przez [`session_render_layers`] na stanie
//! sesji ([`PlayableGame`] + [`PlayableFogSession`]). Ksztalt odpowiedzi: [`RenderLayersPayload`].

use std::collections::{BTreeSet, HashSet};
use std::fmt;

use civ_view_model::map::FogRevealDto;
use civ_view_model::{
    territory_ranges_dto, FogViewDto, HexCoord, OwnerRef as VmOwnerRef, PlayerId as VmPlayerId,
    TerritoryFogFilter, TerritoryNodeInput, TerritoryNodeOrder, TerritoryRangesDto,
};

use crate::domain::fort_territory::{fort_territory_nodes, OrderedFortNode};
use crate::domain::pathfinding::ruch_jednostek::Klucz;
use serde::{Deserialize, Serialize};

use crate::domain::playable::{PlayableFogSession, PlayableFortKind, PlayableGame, PlayableState};
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
    /// Zapytanie warstw o fotel, ktorego nie ma w `state.players` (web `ME()` jest zawsze fotelem gry).
    UnknownSeat(u64),
}

impl fmt::Display for DtoBridgeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingExploredSeat(seat) => {
                write!(f, "exploredByHuman nie ma wpisu fotela {seat}")
            }
            Self::MissingStartHex(seat) => write!(f, "fotel {seat} nie ma heksu startu"),
            Self::IdOutOfRange(id) => write!(f, "id gracza {id} poza zakresem DTO"),
            Self::UnknownSeat(seat) => write!(f, "fotel {seat} nie istnieje w sesji"),
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

/// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 (D-364-2): odpowiedz komendy mostu `GetRenderLayers` - warstwy
/// renderera aktywnego fotela policzone na jednym stanie ([`build_view_layers`]). Pola camelCase jak
/// reszta kontraktu mostu: `fog`, `fogActive`, `reveal`, `territory`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderLayersPayload {
    /// `FogViewDto` rownolegle do `map.hexes`.
    pub fog: FogViewDto,
    /// `ViewerDto.fog_active` (`useFogRender = fogOn || revealAllLand`, `main.ts:13485`).
    pub fog_active: bool,
    /// Opcje `setFog` (L1/L2): `revealAllLand`, `riverRevealKeys`.
    pub reveal: FogRevealDto,
    /// Zasiegi terytorium widziane przez fotel (`refreshTerritoryBorderOverlay`, `:15593-15601`).
    pub territory: TerritoryRangesDto,
}

impl From<DtoBridgeLayers> for RenderLayersPayload {
    fn from(layers: DtoBridgeLayers) -> Self {
        Self {
            fog: layers.fog.fog,
            fog_active: layers.fog.fog_active,
            reveal: layers.fog.reveal,
            territory: layers.territory,
        }
    }
}

/// Wejscia `refreshFog` z [`PlayableFogSession`] dla fotela `active_seat`.
#[must_use]
pub fn fog_inputs_of(session: &PlayableFogSession, active_seat: PlayerId) -> FogViewInputs<'_> {
    FogViewInputs {
        active_seat,
        fog_on: session.fog_on,
        reveal_all_land: session.reveal_all_land,
        player_start_hex_by_owner: &session.player_start_hex_by_owner,
        start_reveal_radius: session.start_reveal_radius,
    }
}

/// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: warstwy renderera sesji `game` dla fotela `seat` (`None` = aktywny
/// fotel czlowieka, web `ME()`).
///
/// Zapytanie jest tylko-do-odczytu wzgledem [`PlayableState`] (nie zmienia stanu gry, zapisu ani replay),
/// ale - jak web `refreshFog()` (`main.ts:13475-13513`, `addExplored(exploredByHuman.get(ME())!, vis)`) -
/// KUMULUJE eksploracje fotela w [`PlayableFogSession::explored_by_human`]: kazde wywolanie dopisuje
/// biezaco widoczne heksy, eksploracja nigdy sie nie cofa. Fotel bez wpisu eksploracji dostaje pusty
/// zbior przed `refreshFog` (web `switchActiveHuman` KROK 0, `main.ts:13902`). Wybor fotela dotyczy tylko
/// tego zapytania: [`PlayableFogSession::active_seat`] sie nie zmienia.
///
/// # Errors
///
/// [`DtoBridgeError::UnknownSeat`] dla fotela spoza `state.players`; dalej jak [`build_view_layers`].
pub fn session_render_layers(
    game: &mut PlayableGame,
    seat: Option<u64>,
) -> Result<RenderLayersPayload, DtoBridgeError> {
    let (state, fog) = game.fog_session_parts();
    let active_seat = match seat {
        None => fog.active_seat,
        Some(raw) => {
            let id = PlayerId::new(raw);
            if !state.players.iter().any(|p| p.id == id) {
                return Err(DtoBridgeError::UnknownSeat(raw));
            }
            id
        }
    };
    let mut explored = std::mem::take(&mut fog.explored_by_human);
    explored.entry(active_seat).or_default();
    let ever = state.player_ever_owned_city_by_owner();
    let result = build_view_layers(
        state,
        &fog_inputs_of(fog, active_seat),
        &ever,
        &mut explored,
    );
    fog.explored_by_human = explored;
    Ok(result?.into())
}
