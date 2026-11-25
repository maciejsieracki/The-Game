//! R-RUSTPORT-P4-364-RENDER-FRAME-R1 (#364, czesc 3; decyzje orkiestratora D-364-R3): skladacz pelnej
//! ramki renderera [`RenderLayersDto`] i mapy statycznej [`MapViewDto`] z [`PlayableState`] i sesji mgly
//! ([`PlayableFogSession`]).
//!
//! Skladacz nie ma wlasnej logiki gry: kazde pole ramki ma jawne zrodlo - istniejacego producenta albo
//! pole [`PlayableState`] - opisane przy polu w [`build_render_frame`] i w tabeli raportu operatora
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P4-364-RENDER-FRAME-R1/01-operator-r1.md`). Pola, ktorych w tej
//! rundzie nie da sie wyprodukowac zgodnie z webem (pin `07d2fbd72`), sa wypisane w [`RENDER_FRAME_GAPS`]
//! (jawna luka, nie ciche zero).
//!
//! Decyzje techniczne operatora (raport `01-operator-r1.md`):
//! * D-OP-1: skladacz bierze `&mut PlayableFogSession` (dispatch D-R3-4 pisze `&`): jedyna zmiana to
//!   kumulacja eksploracji fotela - ta sama co `GetRenderLayers` z r2 (`refreshFog` -> `addExplored`,
//!   `main.ts:13475-13513`); [`PlayableState`] nie jest zmieniany.
//! * D-OP-2: mapa statyczna z [`PlayableState`] przez [`snapshot_map_of`] (teren wg
//!   [`teren_of`](crate::domain::playable_movement::teren_of), ten sam co model ruchu); sesja nie dostaje
//!   nowego pola (D-R3-6 spelnione bez zmian `playable.rs`).
//! * D-OP-3: Q6-2 (D-R3-3, obrona r1 zarzut 1): otwarty panel budowy (`buildModeOpen`, z kluczem albo
//!   bez) albo inny tryb podswietlenia ([`build_highlight_mode_active`]: `foundCityMode`,
//!   `activeWonderId`) = web `onOpenBuild` -> `clearPlayerUnitSelection()` (`main.ts:26702-26703`,
//!   `:7090-7106`), wolane w chwili otwarcia panelu, przed wyborem klucza: brak `selection`, pusty
//!   `reachable` i brak `pathRoute`. Ponowne zaznaczenie jednostki przy otwartym panelu (web
//!   `selectPlayerUnit` nie zamyka trybu) odwzorowuje flaga D-OP-8 (domyslnie wylaczona).
//! * D-OP-4: zaznaczenie z UI (`RenderUiParams::selected_unit_id`, web `selectedId`, `main.ts:7116`) zasila
//!   `selection`, `reachable` i `pathRoute` (w webie jedna zmienna); `PlayableState.selected_unit_id` nie
//!   jest czytany przez ramke.
//! * D-OP-8 (#371 T5a, DLUG-FRAME-RESELECT): [`RenderUiParams::unit_selected_after_build_open`] = web
//!   `selectPlayerUnit` (`main.ts:7233-7260`) po `onOpenBuild`: przy otwartym trybie budowy ramka
//!   przywraca `selection`, `reachable` i `pathRoute` z `selected_unit_id`, a `buildHighlight` liczy jak
//!   dotad. Domyslne `false` = D-OP-3 bajt w bajt.
//!
//! Runda r2 (DODATEK r2, raport `01-operator-r2.md`):
//! * D-OP-5: `overlays.buildHighlight.hexes` z adapterow stanu: `canFoundPlayerCityAt` (`FoundCityCtx`,
//!   fotel `ME()`), `qualifyingWonderHexesForPlayer` (fotel) i `buildApi.getQualifyingHexes` (stan budowy
//!   fotela glownego - pin uzywa literalu `0`, `main.ts:16293-16325`; Rust `HUMAN_OWNER_ID`).
//! * D-OP-6: `units[].hpMax` = `hpMaxEffective` i `hp` przyciete jak `syncRuntimeUnitHpState`
//!   (`main.ts:33099-33118`); `hp` undefined = pelne efektywne.
//! * D-OP-7: `stacks.vitalsByRepId` z `StackVitalsDeps` (`main.ts:14476-14508`): `maxHpOf` =
//!   `hpMaxEffective`, `defOf` = `combatPowerFullDisplayDefFor` dla stanu bez fortyfikacji/garnizonu,
//!   `sumRosterFieldM` z `auto-battle-power.ts:50-59`. Bonus trudnosci AI: web `ownerId > 0` = wlasciciel
//!   rozny od fotela glownego (`HUMAN_OWNER_ID`).
#![forbid(unsafe_code)]

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::fmt;
use std::sync::OnceLock;

use civ_view_model as vm;
use civ_view_model::{
    HexCoord, MapViewDto, OverlaysViewDto, OwnerHexesDto, RenderLayersDto, StackViewDto,
    StackVitalsDto, TerritoryViewDto, UnitViewDto, ViewerDto,
};
use serde::{Deserialize, Serialize};

use crate::data::economy_society_part2::{parse_ai_params, AiParams};
use crate::data::units_combat::{parse_units, UnitRecord};
use crate::domain::brake_power_army::{army_field_power, is_siege_unit, ArmyUnitDef};
use crate::domain::building_costs::p6_7b::StockRecord;
use crate::domain::city_view::{
    city_views, owner_views, CityStateFacts, CityViewCityFacts, CityViewError, CityViewInputs,
};
use crate::domain::combat::unit_building_bonuses::{
    armor_path_badge_level, soft_path_badge_level, unit_parametry_bonus_frac, UnitBuildingProgress,
};
use crate::domain::diplomacy::RelationStatus;
use crate::domain::dto_bridge::{
    build_view_layers, engine_territory_nodes, fog_inputs_of, DtoBridgeError,
};
use crate::domain::fort_territory::{is_hex_in_foreign_fort_territory, OrderedFortNode};
use crate::domain::hex::HexCoord as DomainHexCoord;
use crate::domain::improvement_build::{
    create_improvement_build_api, hex_key as build_hex_key, BuildHex, BuildMap,
    ImprovementBuildState, PlacedLayers,
};
use crate::domain::improvements::{
    is_improvement_allowed_for_civ, HexLike, TerrainType as ImprovementTerrain,
};
use crate::domain::map_snapshot::{
    JsKeyedMap, SnapshotCoords, SnapshotHex, SnapshotMap, SnapshotRiver, SnapshotVillage,
};
use crate::domain::map_view::{build_hex_dyn, build_map_view, MapViewError};
use crate::domain::mapgen::prims::hex_key;
use crate::domain::overlays_view::{
    build_highlight, build_highlight_mode_active, path_route_overlay, reachable_overlay, selection,
    siege_views, trade_routes_view, unit_overlays_view, wonder_views, BuildHighlightSources,
    BuildHighlightUi, OverlaysUi, OverlaysViewError, SelectionUi, UnitOverlaysInput,
};
use crate::domain::pathfinding::ruch_jednostek::{Klucz, RuchJednostka};
use crate::domain::playable::PlayableFortKind;
use crate::domain::playable::{
    PlayableFogSession, PlayableGame, PlayableState, PlayableTerrain, PlayableUnit,
};
use crate::domain::playable_movement::{klucz_of, ruch_jednostki_from_state};
use crate::domain::recruitment::army_merge::{
    compute_stack_display, RosterEntry, StackVitals, StackVitalsDeps, StosJednostka,
};
use crate::domain::roads::collect_road_keys;
use crate::domain::society_breakdown::js_round;
use crate::domain::start_position::Overlay;
use crate::domain::start_reveal::{PlacementCheck, StartRevealContext};
use crate::domain::state::p6_6b::cities::{
    can_found_city, CanFoundCityOpts, City as EconCity, GameConfig,
};
use crate::domain::terrain::visibility::fog_view::hex_order;
use crate::domain::terrain::visibility::units_visible_on_map;
use crate::domain::terrain::{
    founding_nodes_for_owner, CityNode, FortImprovementType, FortNode, TerrainType as WonderTerrain,
};
use crate::domain::territory::collect_territory_hex_keys_by_owner;
use crate::domain::territory::{is_in_territory, TerritoryNode};
use crate::domain::turn_war_epoch::{
    empire_epoch_for_owner, game_start_era, owner_era_facts, OwnerEpochError,
};
use crate::domain::turn_war_inputs::HUMAN_OWNER_ID;
use crate::domain::unit_health::veteran_star_count;
use crate::domain::unit_health::{
    effective_max_hp, unit_health, veteran_battles_won, veteran_combat_bonus_frac,
};
use crate::domain::unit_power::UnitPowerCoeffs;
use crate::domain::wonder_placement::{
    list_qualifying_wonder_hexes_for_owner, WonderMapHex, WonderMapPlacementInput,
    WonderPlacementCity,
};
use crate::domain::{PlayerId, PositionDto};

/// Stan UI, ktory web trzyma w kliencie (D-R3-2). Nazwy pol = istniejace struktury
/// [`SelectionUi`] / [`BuildHighlightUi`] / [`UnitOverlaysInput`]. Wszystkie pola opcjonalne
/// (`#[serde(default)]`); brak parametrow = brak zaznaczenia i brak trybu budowy.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct RenderUiParams {
    /// Web `selectedId` (`main.ts:7116`).
    pub selected_unit_id: Option<u64>,
    /// Heks pod kursorem (`refreshHoverPathPreview`, `main.ts:31181`).
    pub hover: Option<PositionDto>,
    /// Web `foundCityMode` (`main.ts:16352`).
    pub found_city_mode: bool,
    /// Web `!!activeWonderId` (`main.ts:16363`).
    pub wonder_active: bool,
    /// Web `buildModeOpen && !!buildApi` (`main.ts:16369`).
    pub build_mode_open: bool,
    /// Web `activeImprovementKey` (`main.ts:16369`).
    pub active_improvement_key: Option<String>,
    /// D-OP-8 (#371 T5a, DLUG-FRAME-RESELECT): `true` = jednostka zaznaczona PO otwarciu panelu
    /// budowy albo wejsciu w tryb podswietlenia (web `selectPlayerUnit`, `main.ts:7233-7260`, wolane
    /// po `onOpenBuild` -> `clearPlayerUnitSelection()`, `:26702-26703`; `selectPlayerUnit` nie zamyka
    /// trybu budowy). Wtedy ramka w trybie budowy przywraca `selection`, `reachable` i `pathRoute` z
    /// [`Self::selected_unit_id`], a `buildHighlight` liczy jak dotad. `false` (domyslnie) = D-OP-3:
    /// tryb budowy czysci zaznaczenie. Poza trybem budowy pole nie ma znaczenia (D-OP-4).
    pub unit_selected_after_build_open: bool,
}

impl RenderUiParams {
    /// Widok [`BuildHighlightUi`] tych parametrow.
    #[must_use]
    pub fn build_ui(&self) -> BuildHighlightUi<'_> {
        BuildHighlightUi {
            found_city_mode: self.found_city_mode,
            wonder_active: self.wonder_active,
            build_mode_open: self.build_mode_open,
            active_improvement_key: self.active_improvement_key.as_deref(),
        }
    }
}

/// Odpowiedz `GetRenderMap` (D-R3-1): [`MapViewDto`] 1:1 w JSON (`transparent`).
///
/// Opakowanie istnieje tylko dlatego, ze `BridgeResult` derywuje `Eq`, a DTO view-model (z `f64`)
/// maja jedynie `PartialEq` (ten sam wzorzec co `MovementPoints`, `playable.rs`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RenderMapPayload(pub MapViewDto);

impl Eq for RenderMapPayload {}

/// Odpowiedz `GetRenderFrame` (D-R3-1): [`RenderLayersDto`] 1:1 w JSON (`transparent`); `Eq` jak
/// [`RenderMapPayload`].
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(transparent)]
pub struct RenderFramePayload(pub RenderLayersDto);

impl Eq for RenderFramePayload {}

/// Blad skladacza ramki (jawny, bez cichych wartosci domyslnych).
#[derive(Debug, Clone, PartialEq)]
pub enum RenderFrameError {
    /// Fotel spoza `state.players`.
    UnknownSeat(u64),
    /// Mgla / terytorium (DTO-BRIDGE).
    Fog(DtoBridgeError),
    /// Mapa (P4-1B).
    Map(MapViewError),
    /// Miasta i wlasciciele (P4-1E).
    City(CityViewError),
    /// Nakladki, oblezenia, cuda (P4-1F).
    Overlays(OverlaysViewError),
    /// Id poza zakresem DTO (`2^53 - 1`) albo nienumeryczne id jednostki.
    IdOutOfRange(String),
    /// `units.json` nie dal sie wczytac.
    UnitsData(String),
    /// Typ jednostki bez definicji w `units.json` (zamiast cichego `hp = 0` / pustego `typeId`).
    UnknownUnitType(String),
    /// Epoka wlasciciela nieustalona (web `empireEpochForOwner` / `player.era`).
    Epoch(OwnerEpochError),
    /// Etykieta trudnosci stanu spoza mapy webu (`main.ts:44372-44374`).
    UnknownDifficulty(String),
    /// `ai-params.json` nie dal sie wczytac (`loadDifficultyParams`).
    AiParamsData(String),
}

impl fmt::Display for RenderFrameError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnknownSeat(seat) => write!(f, "render frame: fotel {seat} nie istnieje"),
            Self::Fog(e) => write!(f, "render frame: mgla: {e}"),
            Self::Map(e) => write!(f, "render frame: {e}"),
            Self::City(e) => write!(f, "render frame: miasta: {e}"),
            Self::Overlays(e) => write!(f, "render frame: nakladki: {e}"),
            Self::IdOutOfRange(id) => write!(f, "render frame: id {id} poza zakresem DTO"),
            Self::UnitsData(e) => write!(f, "render frame: units.json: {e}"),
            Self::UnknownUnitType(t) => {
                write!(
                    f,
                    "render frame: typ jednostki {t:?} bez definicji w units.json"
                )
            }
            Self::Epoch(e) => write!(f, "render frame: epoka: {e:?}"),
            Self::UnknownDifficulty(d) => write!(f, "render frame: nieznana trudnosc {d:?}"),
            Self::AiParamsData(e) => write!(f, "render frame: ai-params.json: {e}"),
        }
    }
}

impl std::error::Error for RenderFrameError {}

impl From<DtoBridgeError> for RenderFrameError {
    fn from(e: DtoBridgeError) -> Self {
        Self::Fog(e)
    }
}

impl From<MapViewError> for RenderFrameError {
    fn from(e: MapViewError) -> Self {
        Self::Map(e)
    }
}

impl From<CityViewError> for RenderFrameError {
    fn from(e: CityViewError) -> Self {
        Self::City(e)
    }
}

impl From<OwnerEpochError> for RenderFrameError {
    fn from(e: OwnerEpochError) -> Self {
        Self::Epoch(e)
    }
}

impl From<OverlaysViewError> for RenderFrameError {
    fn from(e: OverlaysViewError) -> Self {
        Self::Overlays(e)
    }
}

/// Jawna luka ramki: pole (sciezka JSON), co dostaje w tej rundzie i dlaczego.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RenderFrameGap {
    /// Sciezka pola ramki (camelCase).
    pub field: &'static str,
    /// Co ramka wystawia teraz.
    pub produced: &'static str,
    /// Powod i temat domkniecia.
    pub reason: &'static str,
}

/// Pola ramki, ktorych skladacz NIE produkuje zgodnie z webem (jawne luki, nie ciche zera). Runda r2
/// domknela `overlays.buildHighlight.hexes`, `stacks.vitalsByRepId` i `units[].hp` / `hpMax`
/// (`hpMaxEffective`); ponizsze dwie pozycje zaleza od stanu ekonomii, ktorego [`PlayableState`] nie
/// niesie (dlug #310 EKONOMIA-STAN, decyzja techniczna orkiestratora w dyspozycji r2). Kazda pozycja jest
/// tez w tabeli raportu operatora.
pub const RENDER_FRAME_GAPS: &[RenderFrameGap] = &[
    RenderFrameGap {
        field: "overlays.workerFields",
        produced: "[]",
        reason: "web liczy pola robotnikow wszystkich miast (showWorkerOverlay = true, main.ts:15432-15448) z \
                 collectWorkedHexOwnerMapByOwnerYield nad City ekonomii (okolicaFocus / okolicaTryb / reczne heksy, \
                 magazyn, populacja na zywo) i plonami heksow (zloza, rzeki); PlayableCity niesie tylko id, \
                 wlasciciela, pozycje, populacje i kulture, a mapa stanu nie ma zloz ani rzek \
                 (zaleznosc: #310 EKONOMIA-STAN)",
    },
    RenderFrameGap {
        field: "stacks.starvingRepIds / stacks.goldDeficitRepIds",
        produced: "[]",
        reason: "isArmyHungry / isGoldDeficit (main.ts:14513-14546) czytaja _lastTicks tiku ekonomii \
                 (empire-food.ts:353-356 glodWojska, gold-deficit.ts:149-151 deficytZlota); PlayableState nie \
                 uruchamia tiku ekonomii i nie niesie jego wyniku per wlasciciel (zaleznosc: #310 EKONOMIA-STAN, \
                 #304 EKONOMIA-TURA)",
    },
];

/// Pola ramki z wartoscia webu dla stanu, ktory NIE niesie danego faktu (obrona r1 zarzut 5). To nie sa
/// rozbieznosci z webem (web w takim stanie daje te same wartosci), ale zrodlo jest stala, nie stan: gdy
/// [`PlayableState`] dostanie fakt, pozycja musi przejsc na producenta. Kazda pozycja jest tez w tabeli
/// raportu operatora / obrony.
pub const RENDER_FRAME_STATE_DEFAULTS: &[RenderFrameGap] = &[
    RenderFrameGap {
        field: "cities[] kolejka / bunt / wzrost na zywo",
        produced: "CityViewCityFacts::default() poza besieged (= state.oblegane)",
        reason: "stan nie ma kolejki produkcji, buntu ani wzrostu miasta (EKONOMIA-STAN #310); web bez \
                 kolejki/buntu daje te same plakietki",
    },
    RenderFrameGap {
        field: "owners[] / cities[] miasta-panstwa",
        produced: "CityStateFacts::default()",
        reason: "stan nie ma miast-panstw; web bez miast-panstw daje te same wartosci",
    },
    RenderFrameGap {
        field: "units[].isGeneral / units[].dimmed",
        produced: "false",
        reason: "stan nie ma generalow ani dimmedUnitIds (web undefined/false)",
    },
    RenderFrameGap {
        field: "units[].embarked / units[].inGarnizon",
        produced: "z adaptera ruchu (stan bez zaokretowania i garnizonu -> false)",
        reason: "PlayableUnit nie niesie embarked/inGarnizon; ruch_jednostki_from_state daje wartosci webu \
                 dla jednostki bez tych pol",
    },
    RenderFrameGap {
        field: "units[].armorBadgeLevel",
        produced: "armor_path_badge_level(pancerzBonusProc = None)",
        reason: "PlayableReplaceUnit niesie parametryBonusProc, ale nie pancerzBonusProc \
                 (web armorPathBadgeLevel z pancerzBonusProc undefined = 0)",
    },
    RenderFrameGap {
        field: "stacks.vitalsByRepId fortyfikacja / garnizon / miasta-panstwa",
        produced: "def bez fortifyFieldScaledDefFor i bez bonusu muru garnizonu; trudnosc bez typCityCopyOwners",
        reason: "stan nie ma ufortyfikowanyWPolu ani inGarnizon (unitGetsFortifyDefenseBonus = false, \
                 city-defense.ts:217-222; combatPowerFullDisplayDefFor zwraca base, main.ts:33936-33940) ani \
                 miast-panstw (aiDiffLevelForOwner -> _menuDifficulty, main.ts:9517-9520)",
    },
    RenderFrameGap {
        field: "overlays.buildHighlight zrodla spoza stanu",
        produced: "wonderBuildSites = [], hexClearingStates = {}, tradeRouteKonUnlocked = false, zloza i rzeki brak",
        reason: "stan nie ma budow cudow w toku, wycinki lasu, grantow tras handlowych ani zloz/rzek mapy; web \
                 w takim stanie daje te same wejscia (main.ts:5199-5205, :16293-16325)",
    },
    RenderFrameGap {
        field: "overlays.tradeRoutes",
        produced: "[]",
        reason: "stan nie ma tradeRoutes (main.ts:3454); web bez tras rysuje pusta warstwe",
    },
    RenderFrameGap {
        field: "battle",
        produced: "None",
        reason: "stan nie ma otwartej bitwy (D-R3-4)",
    },
];

/// Tabela `units.json` po nazwie typu (web `lookupUnitDef`).
fn unit_defs() -> Result<&'static HashMap<String, UnitRecord>, RenderFrameError> {
    static DEFS: OnceLock<Result<HashMap<String, UnitRecord>, String>> = OnceLock::new();
    DEFS.get_or_init(|| {
        parse_units()
            .map(|records| {
                records
                    .into_iter()
                    .map(|r| (r.jednostka.clone(), r))
                    .collect()
            })
            .map_err(|e| e.to_string())
    })
    .as_ref()
    .map_err(|e| RenderFrameError::UnitsData(e.clone()))
}

/// Teren stanu -> (`terenBazowy`, `nakladka`) weba; to samo odwzorowanie co
/// [`teren_of`](crate::domain::playable_movement::teren_of) (`Forest` = `rownina` + las).
const fn terrain_labels(terrain: PlayableTerrain) -> (&'static str, &'static str) {
    match terrain {
        PlayableTerrain::Plains => ("rownina", "brak"),
        PlayableTerrain::Hills => ("wzgorza", "brak"),
        PlayableTerrain::Forest => ("rownina", "las"),
        PlayableTerrain::Water => ("morze", "brak"),
    }
}

/// Web `GameMap` dla mapy [`PlayableState`] (D-OP-2): kazdy kafel -> heks pod kluczem `"q,r"`
/// (`PositionDto.x` = `q`, `.y` = `r`), warstwy ulepszen z `map.improvements`. Pol, ktorych stan nie ma,
/// nie zgaduje: brak rzek, wiosek, zloz i wlasciciela heksa (jak `ruch_hex_of`).
#[must_use]
pub fn snapshot_map_of(state: &PlayableState) -> SnapshotMap {
    let hexes = state
        .map
        .tiles
        .iter()
        .map(|tile| {
            let (q, r) = klucz_of(tile.position);
            let (teren, nakladka) = terrain_labels(tile.terrain);
            let layers = state
                .map
                .improvements
                .iter()
                .find(|entry| entry.position == tile.position);
            (
                hex_key(i64::from(q), i64::from(r)),
                SnapshotHex {
                    coords: SnapshotCoords { q, r },
                    teren_bazowy: teren.to_owned(),
                    nakladka: nakladka.to_owned(),
                    ulepszenie: layers
                        .and_then(|l| l.ulepszenie.clone())
                        .unwrap_or_else(|| "brak".to_owned()),
                    wlasciciel: None,
                    wioska: SnapshotVillage {
                        istnieje: false,
                        ludnosc: 0.0,
                    },
                    widocznosc: JsKeyedMap::new(),
                    rzeka: SnapshotRiver {
                        obecna: false,
                        krawedzie: Vec::new(),
                    },
                    zloze: None,
                    zloze_min_era: None,
                    ulepszenia: layers.and_then(|l| l.ulepszenia.clone()),
                    improvement_key: None,
                },
            )
        })
        .collect();
    SnapshotMap {
        szerokosc_q: f64::from(state.map.width),
        wysokosc_r: f64::from(state.map.height),
        seed: f64::from(state.params.seed),
        hexes,
        river_paths: Vec::new(),
        river_path_kinds: None,
    }
}

/// `GetRenderMap` (D-R3-1): statyczna mapa [`build_map_view`] na [`snapshot_map_of`].
///
/// # Errors
///
/// [`RenderFrameError::Map`] dla wartosci mapy bez reprezentacji w DTO.
pub fn render_map(state: &PlayableState) -> Result<MapViewDto, RenderFrameError> {
    Ok(build_map_view(&snapshot_map_of(state))?)
}

fn vm_player(id: PlayerId) -> Result<vm::PlayerId, RenderFrameError> {
    vm::PlayerId::try_new(id.get()).map_err(|e| RenderFrameError::IdOutOfRange(e.value.to_string()))
}

fn vm_unit(id: &str) -> Result<vm::UnitId, RenderFrameError> {
    id.parse::<u64>()
        .ok()
        .and_then(|raw| vm::UnitId::try_new(raw).ok())
        .ok_or_else(|| RenderFrameError::IdOutOfRange(id.to_owned()))
}

fn owner_raw(id: PlayerId) -> Result<i64, RenderFrameError> {
    i64::try_from(id.get()).map_err(|_| RenderFrameError::IdOutOfRange(id.get().to_string()))
}

/// Web `areEnemyOwners(a, b)` (`main.ts:13129-13133`): rozne, a relacja pary = `'wojna'`. Wlasciciele
/// stanu to zawsze gracze (barbarzyncy nie sa `PlayerId`).
fn are_enemy_owners(state: &PlayableState, a: i64, b: i64) -> bool {
    if a == b {
        return false;
    }
    if a < 0 || b < 0 {
        // `isBarbarian(a) || isBarbarian(b)` (`:13131`); stan nie ma ujemnych wlascicieli.
        return true;
    }
    let (pa, pb) = (
        PlayerId::new(a.unsigned_abs()),
        PlayerId::new(b.unsigned_abs()),
    );
    state
        .war
        .diplomacy
        .relation(pa, pb)
        .is_some_and(|r| r.status == RelationStatus::War)
}

/// `units[]` (kontrakt §3.5): web `src` z `syncUnitsRender` (`main.ts:14450-14465`): przy `fogOn`
/// `unitsVisibleOnMap(units, currentVisible(), ME())` (`game/visibility.ts:327-336`), inaczej wszystkie;
/// kolejnosc `units`.
fn visible_units<'a>(
    state: &'a PlayableState,
    ruch: &[RuchJednostka],
    fog_on: bool,
    visible: &BTreeSet<Klucz>,
    me: i64,
) -> Vec<(&'a PlayableUnit, RuchJednostka)> {
    let shown: HashSet<String> = if fog_on {
        units_visible_on_map(ruch, visible, Some(me))
            .into_iter()
            .map(|u| u.id.clone())
            .collect()
    } else {
        ruch.iter().map(|u| u.id.clone()).collect()
    };
    state
        .units
        .iter()
        .zip(ruch.iter())
        .filter(|(_, rj)| shown.contains(&rj.id))
        .map(|(u, rj)| (u, rj.clone()))
        .collect()
}

/// Postep budynkow jednostki z [`PlayableState`] (web `UnitBuildingProgress`): stan niesie tylko
/// `parametryBonusProc` (`PlayableReplaceUnit`), `pancerzBonusProc` = `undefined`.
fn unit_progress(state: &PlayableState, unit_id: u64) -> UnitBuildingProgress {
    UnitBuildingProgress {
        pancerz_bonus_proc: None,
        parametry_bonus_proc: state
            .economy
            .units
            .get(&unit_id)
            .and_then(|r| r.parametry_bonus_proc),
    }
}

/// Web `effectiveRuntimeUnitMaxHp(u, def)` = `unitCardCombatFor(u, def).hpMaxEffective`
/// (`main.ts:33099-33106`, `game/unit-card-stats.ts:114`): `effectiveMaxHp(unitHealth(def),
/// unitParametryBonusFrac(u), veteranCombatBonusFrac(u))`.
fn hp_max_effective(state: &PlayableState, unit_id: u64, def: &UnitRecord) -> f64 {
    let replace = state.economy.units.get(&unit_id);
    effective_max_hp(
        unit_health(Some(def)),
        unit_parametry_bonus_frac(Some(&unit_progress(state, unit_id))),
        veteran_combat_bonus_frac(replace.and_then(|r| r.battles_survived)),
    )
}

/// Web `syncRuntimeUnitHpState(u)` (`main.ts:33109-33118`), wolane przez `syncUnitsRender`
/// (`syncAllRuntimeUnitHpState`, `main.ts:14444`) przed renderem: `hpMax = maxHp`; `hp` undefined zostaje
/// undefined (= pelne, `units/setup.ts:60`), skonczone `hp` przyciete do `[0, maxHp]`, nieskonczone = `maxHp`.
/// Zwraca `(hp, hpMax)`; `hp` = `None` gdy undefined.
fn synced_hp(state: &PlayableState, unit_id: u64, def: &UnitRecord) -> (Option<f64>, f64) {
    let max_hp = hp_max_effective(state, unit_id, def);
    let hp = state
        .economy
        .units
        .get(&unit_id)
        .and_then(|r| r.hp)
        .map(|hp| {
            if hp.is_finite() {
                hp.clamp(0.0, max_hp)
            } else {
                max_hp
            }
        });
    (hp, max_hp)
}

/// Definicja `units.json` jednostki widocznej (adapter ruchu zawsze ustawia typ); brak typu albo
/// definicji = jawny blad (obrona r1 zarzut 3), nie `hp = 0` / pusty `typeId`.
fn unit_def<'a>(
    rj: &RuchJednostka,
    defs: &'a HashMap<String, UnitRecord>,
) -> Result<&'a UnitRecord, RenderFrameError> {
    let type_id = rj
        .type_id
        .as_deref()
        .ok_or_else(|| RenderFrameError::UnknownUnitType(String::new()))?;
    defs.get(type_id)
        .ok_or_else(|| RenderFrameError::UnknownUnitType(type_id.to_owned()))
}

fn unit_view(
    state: &PlayableState,
    unit: &PlayableUnit,
    rj: &RuchJednostka,
    defs: &HashMap<String, UnitRecord>,
) -> Result<UnitViewDto, RenderFrameError> {
    let def = unit_def(rj, defs)?;
    let unit_id = unit.id.get();
    let replace = state.economy.units.get(&unit_id);
    // R2 luka 3: `hpMax` = `hpMaxEffective` (cache `u.hpMax` nadpisany przez `syncRuntimeUnitHpState`),
    // `hp` przyciete jak w webie; `hp` undefined = pelne efektywne (DTO nie ma `undefined`).
    let (hp, hp_max) = synced_hp(state, unit_id, def);
    let stars = veteran_star_count(replace.and_then(|r| r.battles_survived));
    // Gwiazdki to `0..=3` (`VETERAN_MAX_BATTLES_TRACKED`).
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let veteran_stars = stars as u8;
    let progress = unit_progress(state, unit_id);
    Ok(UnitViewDto {
        id: vm_unit(&rj.id)?,
        owner_id: vm::OwnerRef::Player(vm_player(unit.owner_id)?),
        type_id: def.jednostka.clone(),
        category: rj.category.clone(),
        hex: HexCoord::new(rj.q, rj.r),
        ruch_max: rj.ruch,
        ruch_left: rj.ruch_left,
        hp: hp.unwrap_or(hp_max),
        hp_max: Some(hp_max),
        // Stan nie ma `embarked`, `inGarnizon`, `isGeneral` ani `dimmedUnitIds`: web undefined/false.
        embarked: rj.embarked == Some(true),
        in_garnizon: rj.in_garnizon,
        is_general: false,
        veteran_stars,
        // `pancerzBonusProc` nie istnieje w stanie (RENDER_FRAME_STATE_DEFAULTS); `parametryBonusProc` tak.
        armor_badge_level: armor_path_badge_level(Some(&progress)),
        soft_badge_level: soft_path_badge_level(Some(&progress)),
        dimmed: false,
    })
}

/// Web `veteranLevel(u)` = `veteranLevelFromBattles(veteranBattlesWon(u))` (`game/veteran.ts:106-115`).
fn veteran_level(battles_survived: Option<f64>) -> u8 {
    let won = veteran_battles_won(battles_survived);
    if won >= 3.0 {
        3
    } else if won >= 1.0 {
        2
    } else {
        1
    }
}

/// Poziom trudnosci AI `1 | 2 | 3` dla etykiety menu (web `aiDiffLevelForOwner`, `main.ts:9517-9520`:
/// `'hard' -> 3`, `'easy' -> 1`, inaczej 2; etykiety stanu wg `main.ts:44372-44374`).
fn ai_diff_level(label: &str) -> Result<u8, RenderFrameError> {
    match label {
        "Normalny" | "normal" => Ok(2),
        "Łatwy" | "easy" => Ok(1),
        "Trudny" | "hard" => Ok(3),
        other => Err(RenderFrameError::UnknownDifficulty(other.to_owned())),
    }
}

fn ai_params() -> Result<&'static AiParams, RenderFrameError> {
    static PARAMS: OnceLock<Result<AiParams, String>> = OnceLock::new();
    PARAMS
        .get_or_init(|| parse_ai_params().map_err(|e| e.to_string()))
        .as_ref()
        .map_err(|e| RenderFrameError::AiParamsData(e.clone()))
}

/// Web `difficultyCombatMultForOwner(ownerId)` (`main.ts:9506-9511`): `1` gdy
/// `!qualifiesForMajorAiDifficultyBonus(ownerId, isCityState)` (`ai-difficulty-bonus.ts:18-23`:
/// `ownerId > 0 && !isBarbarian && !isCityState`), inaczej `difficultyCombatMultiplier(bonusWalka)`
/// (`:26-28`) z `loadDifficultyParams(data, aiDiffLevelForOwner(ownerId))` (`ai.ts:651-664`). Web
/// `ownerId > 0` = rozny od fotela glownego czlowieka (`HUMAN_OWNER_PRIMARY` 0 = Rust
/// [`HUMAN_OWNER_ID`]); wlasciciele stanu nie sa barbarzyncami, stan nie ma miast-panstw.
fn difficulty_combat_mult(state: &PlayableState, owner: i64) -> Result<f64, RenderFrameError> {
    if owner == HUMAN_OWNER_ID {
        return Ok(1.0);
    }
    let p = ai_params()?;
    let bonus = match ai_diff_level(&state.params.difficulty)? {
        1 => p.trudnosc_poziom1_bonus_walka.wartosc,
        // Typ `i64` w `ai-params.json` (wartosc calkowita 0); JS `number`.
        #[allow(clippy::cast_precision_loss)]
        2 => p.trudnosc_poziom2_bonus_walka.wartosc as f64,
        _ => p.trudnosc_poziom3_bonus_walka.wartosc,
    };
    Ok(1.0 + if bonus.is_finite() { bonus } else { 0.0 })
}

/// Web `combatPowerFullDisplayDefFor(u)` (`main.ts:33936-33962`) dla stanu bez fortyfikacji i garnizonu:
/// `veteranScaledDefFor` (`:33063-33070`, `applyVeteranFracToCombatUnit` `veteran.ts:362-385`: atak, obrona,
/// weaponDamage, piercing, chargeBonus, health, missileAttack x `(1 + frac)`, bez cache `fieldPower`), potem
/// `applyDifficultyCombatToUnitDef` (`ai-difficulty-bonus.ts:41-60`: atak, obrona, missileAttack x `mult`,
/// bez cache). `fortifyFieldScaledDefFor` i bonus muru garnizonu nie dzialaja (`unitGetsFortifyBonus` =
/// false, `inGarnizon !== true`; RENDER_FRAME_STATE_DEFAULTS).
#[allow(clippy::float_cmp)]
fn full_display_def(def: &UnitRecord, veteran_frac: f64, difficulty_mult: f64) -> ArmyUnitDef {
    let mut out = ArmyUnitDef::from_unit_record(def);
    // `if (!frac) return def` (`main.ts:33065`).
    if veteran_frac != 0.0 && !veteran_frac.is_nan() {
        let up = 1.0 + veteran_frac;
        let p = &mut out.power;
        p.melee_attack *= up;
        p.melee_defence *= up;
        p.weapon_damage *= up;
        p.piercing *= up;
        p.charge_bonus *= up;
        p.health *= up;
        p.missile_attack *= up;
        out.field_power_cache = None;
    }
    // `if (mult === 1) return def` (`ai-difficulty-bonus.ts:45`).
    if difficulty_mult != 1.0 {
        let p = &mut out.power;
        p.melee_attack *= difficulty_mult;
        p.melee_defence *= difficulty_mult;
        p.missile_attack *= difficulty_mult;
        out.field_power_cache = None;
    }
    out
}

/// Typy wykluczone z bitwy polowej (`auto-battle-power.ts:37` `BATTLE_EXCLUDED_TYPES`).
const BATTLE_EXCLUDED_TYPES: [&str; 2] = ["Zwiadowca", "Osadnik"];

fn unit_power_coeffs() -> &'static UnitPowerCoeffs {
    static COEFFS: OnceLock<UnitPowerCoeffs> = OnceLock::new();
    COEFFS.get_or_init(UnitPowerCoeffs::from_params)
}

/// Web `sumRosterFieldM(roster)` (`auto-battle-power.ts:50-59`): suma `armyFieldPower(def)` jednostek
/// `isFieldBattleUnit` (`:39-43`: nie oblezenicza, typ spoza [`BATTLE_EXCLUDED_TYPES`],
/// `armyFieldPower > 0`), `Math.round(sum * 10) / 10`.
fn sum_roster_field_m(roster: &[RosterEntry<ArmyUnitDef>]) -> f64 {
    let c = unit_power_coeffs();
    let mut sum = 0.0;
    for u in roster {
        if is_siege_unit(u.def.rola_linia.as_deref()) {
            continue;
        }
        if BATTLE_EXCLUDED_TYPES.contains(&u.type_id.as_str()) {
            continue;
        }
        let m = army_field_power(&u.def, c);
        if m > 0.0 {
            sum += m;
        }
    }
    js_round(sum * 10.0) / 10.0
}

/// Fakty jednostki czytane przez `StackVitalsDeps` (klucz = id jednostki w zapisie dziesietnym).
struct VitalsFacts {
    max_hp: f64,
    def: ArmyUnitDef,
    progress: UnitBuildingProgress,
    battles_survived: Option<f64>,
}

/// `stacks` (kontrakt §3.5): web `computeStackDisplay(src, unitAttackScore, { maxHpOf, defOf })`
/// (`main.ts:14476-14508`), `unitAttackScore` = `meleeAttack` definicji (`main.ts:14436-14438`),
/// `maxHpOf` = `hpMaxEffective`, `defOf` = `combatPowerFullDisplayDefFor`. Ikony glodu/deficytu: luki.
fn stack_view(
    state: &PlayableState,
    shown: &[(&PlayableUnit, RuchJednostka)],
    defs: &HashMap<String, UnitRecord>,
) -> Result<StackViewDto, RenderFrameError> {
    let mut facts: HashMap<String, VitalsFacts> = HashMap::new();
    let mut stos: Vec<StosJednostka> = Vec::with_capacity(shown.len());
    for (unit, rj) in shown {
        let def = unit_def(rj, defs)?;
        let unit_id = unit.id.get();
        let (hp, max_hp) = synced_hp(state, unit_id, def);
        let battles = state
            .economy
            .units
            .get(&unit_id)
            .and_then(|r| r.battles_survived);
        let owner = owner_raw(unit.owner_id)?;
        facts.insert(
            rj.id.clone(),
            VitalsFacts {
                max_hp,
                def: full_display_def(
                    def,
                    veteran_combat_bonus_frac(battles),
                    difficulty_combat_mult(state, owner)?,
                ),
                progress: unit_progress(state, unit_id),
                battles_survived: battles,
            },
        );
        let mut s = StosJednostka::new(&rj.id, rj.owner_id, &def.jednostka, rj.q, rj.r);
        s.ruch = rj.ruch;
        s.ruch_left = rj.ruch_left;
        s.in_garnizon = Some(rj.in_garnizon);
        s.category = rj.category.clone();
        s.hp = hp;
        stos.push(s);
    }
    #[allow(clippy::cast_precision_loss)]
    let attack_of = |u: &StosJednostka| defs.get(&u.type_id).map_or(0.0, |d| d.melee_attack as f64);
    // Kazda jednostka `stos` ma wpis w `facts` (ten sam przebieg); brak wpisu jest nieosiagalny.
    let fact = |u: &StosJednostka| -> &VitalsFacts { &facts[&u.id] };
    let max_hp_of = |u: &StosJednostka| fact(u).max_hp;
    let def_of = |u: &StosJednostka| fact(u).def.clone();
    let armor_badge = |u: &StosJednostka| armor_path_badge_level(Some(&fact(u).progress));
    let soft_badge = |u: &StosJednostka| soft_path_badge_level(Some(&fact(u).progress));
    let vet_level = |u: &StosJednostka| veteran_level(fact(u).battles_survived);
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let vet_stars = |u: &StosJednostka| veteran_star_count(fact(u).battles_survived) as u32;
    let deps = StackVitalsDeps {
        max_hp_of: &max_hp_of,
        def_of: &def_of,
        sum_roster_field_m: &sum_roster_field_m,
        armor_badge_level: &armor_badge,
        soft_badge_level: &soft_badge,
        veteran_level: &vet_level,
        veteran_star_count: &vet_stars,
    };
    let info = compute_stack_display(&stos, &attack_of, Some(&deps));
    let visible_ids = info
        .visible_ids
        .iter()
        .map(|id| vm_unit(id))
        .collect::<Result<Vec<_>, _>>()?;
    let badge_by_rep_id = info
        .badge_by_rep_id
        .iter()
        .map(|(id, n)| {
            let n = u32::try_from(*n).map_err(|_| RenderFrameError::IdOutOfRange(n.to_string()))?;
            Ok((vm_unit(id)?, n))
        })
        .collect::<Result<Vec<_>, RenderFrameError>>()?;
    let vitals_by_rep_id = info
        .vitals_by_rep_id
        .unwrap_or_default()
        .iter()
        .map(|(id, v)| Ok((vm_unit(id)?, vitals_dto(v)?)))
        .collect::<Result<Vec<_>, RenderFrameError>>()?;
    Ok(StackViewDto {
        visible_ids,
        badge_by_rep_id,
        starving_rep_ids: Vec::new(),
        gold_deficit_rep_ids: Vec::new(),
        vitals_by_rep_id,
    })
}

/// `StackVitals` -> [`StackVitalsDto`] (te same 11 kluczy, `armyMerge.ts:1103-1126`).
fn vitals_dto(v: &StackVitals) -> Result<StackVitalsDto, RenderFrameError> {
    Ok(StackVitalsDto {
        ruch_left: v.ruch_left,
        ruch_max: v.ruch_max,
        hp: v.hp,
        hp_max: v.hp_max,
        field_power_m: v.field_power_m,
        count: u32::try_from(v.count)
            .map_err(|_| RenderFrameError::IdOutOfRange(v.count.to_string()))?,
        armor_badge_level: v.armor_badge_level,
        soft_badge_level: v.soft_badge_level,
        veteran_level: v.veteran_level,
        veteran_stars: u8::try_from(v.veteran_stars)
            .map_err(|_| RenderFrameError::IdOutOfRange(v.veteran_stars.to_string()))?,
        has_commander: v.has_commander,
    })
}

/// `territory` (kontrakt §3.6): web `refreshTerritoryBorderOverlay` (`main.ts:15582-15601`;
/// `territoryBorderVisible` domyslnie `true`, `:15338`): `collectTerritoryHexKeysByOwner(map,
/// buildAllTerritoryNodes(), filtr)` z filtrem `isMe(owner) || !fogOn || vis.has(key) ||
/// explored.has(key)`. Kolejnosc `Map`/`Set` = kolejnosc pierwszego wystapienia przy przejsciu
/// `Object.keys(map.hexes)` ([`hex_order`]).
fn territory_view(
    state: &PlayableState,
    me: i64,
    fog_on: bool,
    visible: &BTreeSet<Klucz>,
    explored: &BTreeSet<Klucz>,
) -> Result<TerritoryViewDto, RenderFrameError> {
    let order = hex_order(state);
    let keys: Vec<String> = order
        .iter()
        .map(|&(q, r)| hex_key(i64::from(q), i64::from(r)))
        .collect();
    let key_to_hex: HashMap<&str, Klucz> = keys
        .iter()
        .map(String::as_str)
        .zip(order.iter().copied())
        .collect();
    let nodes = engine_territory_nodes(state)?;
    let filter = |key: &str, owner: i64| -> bool {
        if owner == me || !fog_on {
            return true;
        }
        key_to_hex
            .get(key)
            .is_some_and(|h| visible.contains(h) || explored.contains(h))
    };
    let by_owner = collect_territory_hex_keys_by_owner(&keys, &nodes, Some(&filter));
    let owner_of: HashMap<&str, i64> = by_owner
        .iter()
        .flat_map(|(owner, set)| set.iter().map(move |k| (k.as_str(), *owner)))
        .collect();
    let mut out: Vec<OwnerHexesDto> = Vec::new();
    let mut index: BTreeMap<i64, usize> = BTreeMap::new();
    for (key, &(q, r)) in keys.iter().zip(order.iter()) {
        let Some(&owner) = owner_of.get(key.as_str()) else {
            continue;
        };
        let at = match index.get(&owner) {
            Some(&at) => at,
            None => {
                let owner_ref = vm::OwnerRef::from_legacy_i64(owner)
                    .ok_or_else(|| RenderFrameError::IdOutOfRange(owner.to_string()))?;
                out.push(OwnerHexesDto {
                    owner_id: owner_ref,
                    hexes: Vec::new(),
                });
                index.insert(owner, out.len() - 1);
                out.len() - 1
            }
        };
        out[at].hexes.push(HexCoord::new(q, r));
    }
    Ok(TerritoryViewDto { by_owner: out })
}

/// Pelna ramka renderera fotela `seat` (D-R3-4, D-R3-5). Kolejnosc jak gra: najpierw `refreshFog`
/// (kumuluje eksploracje fotela w `session`, D-OP-1), potem warstwy na zbiorach tej mgly.
///
/// Zrodla pol: `contractVersion` = [`vm::CONTRACT_VERSION`]; `viewer` = fotel + `fogActive` z mgly;
/// `turn` = `state.turn`; `hexState` = [`build_hex_dyn`] (kolejnosc [`build_map_view`]); `fog` =
/// [`build_view_layers`]; `owners`/`cities` = [`owner_views`]/[`city_views`]; `units`/`stacks` = filtr
/// mgly + [`compute_stack_display`]; `sieges` = [`siege_views`]; `wonders` = [`wonder_views`];
/// `territory` = [`collect_territory_hex_keys_by_owner`]; `overlays` = [`unit_overlays_view`] +
/// [`trade_routes_view`]; `battle` = `None` (stan nie ma otwartej bitwy); `reveal` = opcje `setFog`
/// ([`civ_view_model::map::FogRevealDto`] z [`build_view_layers`]) tylko przy aktywnej mgle, inaczej
/// `None` (R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1, D-403A-1/2).
///
/// # Errors
///
/// [`RenderFrameError`] z producentow; [`RenderFrameError::UnknownSeat`] dla fotela spoza gry.
pub fn build_render_frame(
    state: &PlayableState,
    session: &mut PlayableFogSession,
    seat: PlayerId,
    ui: &RenderUiParams,
) -> Result<RenderLayersDto, RenderFrameError> {
    if !state.players.iter().any(|p| p.id == seat) {
        return Err(RenderFrameError::UnknownSeat(seat.get()));
    }
    let me = owner_raw(seat)?;

    // Mgla (`refreshFog`) - jak `session_render_layers` z r2.
    let mut explored = std::mem::take(&mut session.explored_by_human);
    explored.entry(seat).or_default();
    let ever = state.player_ever_owned_city_by_owner();
    let layers = build_view_layers(state, &fog_inputs_of(session, seat), &ever, &mut explored);
    session.explored_by_human = explored;
    let layers = layers?;
    let fog_on = session.fog_on;
    let visible = &layers.fog.visible;
    // R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (D-403A-1, D-403A-2): opcje `setFog` tego samego przebiegu
    // `refreshFog` - galaz mgly (`useFogRender`, `main.ts:13485-13494`) podaje `{ landReveal,
    // riverRevealKeys }`, galaz bez mgly (`:13505-13506`) wola `setFog(ALL_KEYS, ALL_KEYS)` BEZ opcji -> `None`.
    let reveal = layers
        .fog
        .fog_active
        .then(|| layers.fog.reveal.clone());

    // Heksy dynamiczne: miasta = pozycje wszystkich miast (Z-Q3-3).
    let snapshot = snapshot_map_of(state);
    let city_hexes: Vec<HexCoord> = state
        .cities
        .iter()
        .map(|c| {
            let (q, r) = klucz_of(c.position);
            HexCoord::new(q, r)
        })
        .collect();
    let hex_state = build_hex_dyn(&snapshot, &city_hexes)?;

    // Miasta i wlasciciele: fakty spoza stanu = wartosci webu dla stanu bez kolejki, buntu,
    // wzrostu na zywo i miast-panstw; `besieged` = `state.oblegane`.
    let facts: BTreeMap<u64, CityViewCityFacts> = state
        .cities
        .iter()
        .map(|c| {
            (
                c.id.get(),
                CityViewCityFacts {
                    besieged: state.oblegane.contains(&c.id),
                    ..CityViewCityFacts::default()
                },
            )
        })
        .collect();
    let city_states = CityStateFacts::default();
    // Bez kolejki produkcji (`production = None`) koszt pozycji nie jest czytany.
    let item_stock_cost = |_: &crate::domain::production_units::ProductionItem| StockRecord::new();
    let city_inputs = CityViewInputs {
        viewer: seat,
        fog_active: fog_on,
        visible_hexes: visible,
        cities: &facts,
        city_states: &city_states,
        item_stock_cost: &item_stock_cost,
    };
    let owners = owner_views(state, &city_inputs)?;
    let cities = city_views(state, &city_inputs)?;

    // Jednostki i stosy.
    let defs = unit_defs()?;
    let ruch = ruch_jednostki_from_state(state);
    let shown = visible_units(state, &ruch, fog_on, visible, me);
    let units = shown
        .iter()
        .map(|(u, rj)| unit_view(state, u, rj, defs))
        .collect::<Result<Vec<_>, _>>()?;
    let stacks = stack_view(state, &shown, defs)?;

    let sieges = siege_views(state, |a, b| are_enemy_owners(state, a, b))?;
    let wonders = wonder_views(state)?;
    let territory = territory_view(state, me, fog_on, visible, &layers.fog.explored_for_render)?;
    let overlays = overlays_view(state, session, seat, me, ui)?;

    Ok(RenderLayersDto {
        contract_version: vm::CONTRACT_VERSION,
        viewer: ViewerDto {
            owner_id: vm::OwnerRef::Player(vm_player(seat)?),
            fog_active: layers.fog.fog_active,
        },
        turn: state.turn,
        hex_state,
        fog: layers.fog.fog,
        owners,
        cities,
        units,
        stacks,
        sieges,
        wonders,
        territory,
        overlays,
        battle: None,
        reveal,
    })
}

/// `overlays` (kontrakt §3.7).
fn overlays_view(
    state: &PlayableState,
    session: &PlayableFogSession,
    seat: PlayerId,
    me: i64,
    ui: &RenderUiParams,
) -> Result<OverlaysViewDto, RenderFrameError> {
    let build_ui = ui.build_ui();
    let order = hex_order(state);
    let start_ctx = StartRevealContext {
        awaiting_first_city: state.is_awaiting_first_city(seat),
        player_start_hex: session
            .player_start_hex_by_owner
            .get(&seat)
            .map(|&(q, r)| (f64::from(q), f64::from(r))),
        start_reveal_radius: session.start_reveal_radius,
    };
    let is_in_start_reveal =
        |q: i32, r: i32| start_ctx.is_in_start_reveal(f64::from(q), f64::from(r));
    // R2 luka 1: zrodla `refreshBuildHighlight` (`main.ts:16351-16396`) z adapterow stanu. Wejscia
    // liczone tylko dla aktywnego trybu (pin liczy je tylko w galezi trybu; funkcje sa czyste).
    let found_ctx = if build_ui.found_city_mode {
        Some(FoundCityCtx::new(state, seat, &start_ctx)?)
    } else {
        None
    };
    let improvement_ctx = if build_highlight_mode_active(&build_ui)
        && !build_ui.found_city_mode
        && !build_ui.wonder_active
    {
        Some(improvement_build_state(state)?)
    } else {
        None
    };
    let can_found = |q: i32, r: i32| {
        found_ctx
            .as_ref()
            .is_some_and(|ctx| ctx.check(&start_ctx, q, r).ok)
    };
    let wonder_hexes = || qualifying_wonder_hexes(state, seat);
    let qualifying = |key: &str| {
        improvement_ctx.as_ref().map_or_else(Vec::new, |(bs, civ)| {
            improvement_qualifying_hexes(bs, civ, key)
        })
    };
    // Stan nie niesie `pendingImprovementsTurn` (`game/pending-improvements.ts:43`).
    let undo: HashSet<String> = HashSet::new();
    let sources = BuildHighlightSources {
        map_hexes: &order,
        is_in_start_reveal: &is_in_start_reveal,
        can_found_player_city_at: &can_found,
        qualifying_wonder_hexes: &wonder_hexes,
        qualifying_hexes: &qualifying,
        pending_undo_keys: &undo,
    };

    let mut dto = OverlaysViewDto {
        // `cultureRangeVisible = false`, `religionRangeVisible = false` (`main.ts:15335-15336`):
        // brak warstwy (`refreshRangeOverlays`, `:15626-15648`).
        culture_range: None,
        religion_range: None,
        // `tradeRoutes` (`main.ts:3454`) nie istnieje w stanie: lista pusta jak web bez tras.
        trade_routes: trade_routes_view(
            &[],
            &[],
            &OverlaysUi {
                show_trade_routes: true,
                show_worker_overlay: true,
                city_panel_open: false,
                open_city_id: None,
                viewer_owner_id: me,
            },
        ),
        // Panel miasta zamkniety (brak pola UI): `syncOkolicaOverlay` nie rysuje (`main.ts:6645`).
        okolica: None,
        // Luka RENDER_FRAME_GAPS `overlays.workerFields`.
        worker_fields: Vec::new(),
        reachable: Vec::new(),
        // Brak trybu = brak warstwy (`main.ts:16369-16373`); tryb aktywny = galaz trybu.
        build_highlight: build_highlight(&build_ui, &sources),
        selection: None,
        path_route: None,
    };

    let build_branch = ui.build_mode_open || build_highlight_mode_active(&build_ui);
    // D-OP-8: zaznaczenie po otwarciu panelu (`selectPlayerUnit`) przywraca nakladki jednostki.
    let reselected = ui.unit_selected_after_build_open && ui.selected_unit_id.is_some();
    if build_branch && !reselected {
        // D-OP-3 (Q6-2, D-R3-3): `onOpenBuild` -> `clearPlayerUnitSelection()` (`main.ts:26702-26703`)
        // juz przy otwarciu panelu (bez klucza): bez `selection`, `reachable` i `pathRoute`.
        return Ok(dto);
    }

    // D-OP-4: zaznaczenie z UI zasila tez `reachable` i `pathRoute` (te czytaja stan).
    let owned;
    let view_state = if state.selected_unit_id == ui.selected_unit_id {
        state
    } else {
        let mut s = state.clone();
        s.selected_unit_id = ui.selected_unit_id;
        owned = s;
        &owned
    };
    if build_branch {
        // D-OP-8 (#371 T5a): `selectPlayerUnit` (`main.ts:7233-7260`) przy otwartym panelu: `selectedId`,
        // `reachable = reachableWithMergeTargets(u)` (`:7252-7256`), pierscien `setSelectionHex`
        // (`:7258`). Podglad trasy kursora (`refreshHoverPathPreview`, `:31181`) dziala przy otwartym
        // panelu bez wybranego trybu; przy `buildModeOpen && (foundCityMode || activeImprovementKey ||
        // activeWonderId)` handler ruchu myszy czysci trase (`clearPathRoute`, `:32273-32278`).
        // `buildHighlight` zostaje policzone wyzej (tryb nadal otwarty; `refreshBuildHighlight`,
        // `:16351-16396`). Ktora warstwa `setHighlight` jest widoczna („ostatni zapis wygrywa”) wybiera
        // klient (dlug T5b). `unit_overlays_view` nie jest uzywany, bo w trybie podswietlenia zeruje
        // `reachable` (Q6-2), a web po `selectPlayerUnit` trzyma `reachable` niezaleznie od trybu.
        let hover_path_blocked = ui.build_mode_open
            && (ui.found_city_mode
                || ui.wonder_active
                || ui
                    .active_improvement_key
                    .as_deref()
                    .is_some_and(|k| !k.is_empty()));
        dto.reachable = reachable_overlay(view_state);
        dto.selection = selection(
            &SelectionUi {
                selected_unit_id: ui.selected_unit_id,
            },
            &view_state.units,
        );
        dto.path_route = if hover_path_blocked {
            None
        } else {
            path_route_overlay(view_state, ui.hover)
        };
        return Ok(dto);
    }
    unit_overlays_view(
        view_state,
        &UnitOverlaysInput {
            hover: ui.hover,
            build_ui,
            build_sources: &sources,
            selection_ui: SelectionUi {
                selected_unit_id: ui.selected_unit_id,
            },
        },
    )
    .write_into(&mut dto);
    Ok(dto)
}

// ---------------------------------------------------------------------------------------------
// R2 luka 1: zrodla `overlays.buildHighlight` (web `refreshBuildHighlight`, `main.ts:16351-16396`)
// ---------------------------------------------------------------------------------------------

/// Web `empireEpochForOwner(owner)` / `player.era` fotela ze stanu ([`owner_era_facts`]).
fn owner_era(state: &PlayableState, owner: i64) -> Result<f64, RenderFrameError> {
    let start = game_start_era(&state.params.epoch_id);
    Ok(empire_epoch_for_owner(owner, &owner_era_facts(state), start)?.0)
}

/// Forty stanu jako web `fortNodes` (`FortNode` + `builtAtTurn`/`seq`), kolejnosc tablicy.
fn fort_nodes_of(state: &PlayableState) -> Result<Vec<OrderedFortNode>, RenderFrameError> {
    state
        .forts
        .iter()
        .map(|f| {
            Ok(OrderedFortNode::new(
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
            ))
        })
        .collect()
}

/// Web `cityNodesForOwner(ownerId)` (`main.ts:5661-5665`) / `playerCityNodes()` (`:16214-16218`):
/// `{ q, r, pop: population, level: 1 }`.
fn city_nodes_for_owner(state: &PlayableState, owner: PlayerId) -> Vec<CityNode> {
    state
        .cities
        .iter()
        .filter(|c| c.owner_id == owner)
        .map(|c| {
            let (q, r) = klucz_of(c.position);
            CityNode::city(q, r, f64::from(c.population))
        })
        .collect()
}

/// Web `cities` jako `City` z `cities.ts` w zakresie czytanym przez `canFoundCity` (`ownerId`, `q`, `r`);
/// `startCityState` / `foundedByOwner` undefined (stan nie ma miast-panstw ani znacznika zalozenia;
/// `countsTowardCityFoundingLimit(undefined)` = `true`, `cities.ts:1125`).
fn econ_cities_of(state: &PlayableState) -> Result<Vec<EconCity>, RenderFrameError> {
    state
        .cities
        .iter()
        .map(|c| {
            let (q, r) = klucz_of(c.position);
            Ok(EconCity {
                id: c.id.get().to_string(),
                owner_id: owner_raw(c.owner_id)?,
                q: f64::from(q),
                r: f64::from(r),
                name: c.name.clone(),
                population: f64::from(c.population),
                ..EconCity::default()
            })
        })
        .collect()
}

/// Wejscia `canFoundPlayerCityAt` (`main.ts:12923-12943`) dla fotela `seat` (`ME()`), liczone raz na
/// ramke (wszystkie bledy jawne przed wejsciem w petle heksow).
struct FoundCityCtx {
    me: i64,
    era: f64,
    city_limit_base: f64,
    cities: Vec<EconCity>,
    ruch_map: crate::domain::pathfinding::ruch_jednostek::RuchMapa,
    forts: Vec<OrderedFortNode>,
    all_nodes: Vec<TerritoryNode>,
    /// `foundingNodesForOwner(ME(), cityNodesForOwner(ME()), fortNodes)`; puste = `{}` (bez
    /// `withinTerritory`), takze przy oczekiwaniu na pierwsze miasto.
    founding_nodes: Vec<CityNode>,
}

impl FoundCityCtx {
    /// `foundingTerritoryOpts(ME())` (`main.ts:12906-12920`): `isMe && isAwaitingFirstPlayerCity` ->
    /// `{}`; inaczej wezly = `foundingNodesForOwner(...)`, puste -> `{}`.
    /// `_menuCityLimitBase` = `params.advanced.cityLimitBase` (`main.ts:44445`).
    fn new(
        state: &PlayableState,
        seat: PlayerId,
        start_ctx: &StartRevealContext,
    ) -> Result<Self, RenderFrameError> {
        let me = owner_raw(seat)?;
        let forts = fort_nodes_of(state)?;
        let fort_plain: Vec<FortNode> = forts.iter().map(|f| f.fort.clone()).collect();
        let founding_nodes = if start_ctx.awaiting_first_city {
            Vec::new()
        } else {
            founding_nodes_for_owner(me, &city_nodes_for_owner(state, seat), &fort_plain)
        };
        Ok(Self {
            me,
            // Obrona r2 Z1: `const playerEra = player.era ?? 1` (`main.ts:12924`). `player` to jeden obiekt
            // fotela glownego (`createPlayerState()`, `main.ts:13713`), a `player.era` ustawia wylacznie
            // `reconcilePlayerEraFromResearch()` z `civTypeForOwner(0)` (`main.ts:2522-2532`). Fotel `ME()`
            // zmienia `ownerId` i wezly terytorium, ale NIE epoke limitu miast: asymetria hotseatu 1:1 z
            // pinem (jak `player_era` w [`improvement_build_state`]).
            era: owner_era(state, HUMAN_OWNER_ID)?,
            city_limit_base: f64::from(state.params.advanced.city_limit_base),
            cities: econ_cities_of(state)?,
            ruch_map: crate::domain::playable_movement::ruch_mapa_from_state(state),
            forts,
            all_nodes: engine_territory_nodes(state)?,
            founding_nodes,
        })
    }

    /// `canFoundPlayerCityAt(q, r)`: `canFoundCity(q, r, cities, map, {...foundingTerritoryOpts(ME()),
    /// ownerId: ME(), ownerEra: player.era ?? 1 (epoka fotela glownego, `main.ts:12924`), gameConfig: {
    /// cityLimitBase }})` (`cities.ts:1316-1327`),
    /// `withinTerritory = isInTerritory(q, r, wezly) && !isHexInForeignFortTerritory(q, r, ME(),
    /// fortNodes, buildAllTerritoryNodes())`, potem `validateFirstPlayerCityPlacement`
    /// ([`StartRevealContext::can_found_player_city_at`]).
    fn check(&self, start_ctx: &StartRevealContext, q: i32, r: i32) -> PlacementCheck {
        let within = |fq: f64, fr: f64| {
            is_in_territory(fq, fr, &self.founding_nodes)
                && !is_hex_in_foreign_fort_territory(
                    js_hex_coord(fq),
                    js_hex_coord(fr),
                    self.me,
                    &self.forts,
                    &self.all_nodes,
                )
        };
        let opts = CanFoundCityOpts {
            within_territory: if self.founding_nodes.is_empty() {
                None
            } else {
                Some(&within)
            },
            owner_id: Some(self.me),
            owner_era: Some(self.era),
            game_config: Some(GameConfig {
                city_limit_base: Some(self.city_limit_base),
            }),
            ..CanFoundCityOpts::default()
        };
        start_ctx.can_found_player_city_at(f64::from(q), f64::from(r), |bq, br| {
            can_found_city(bq, br, &self.cities, &self.ruch_map, Some(&opts)).into()
        })
    }
}

/// Wspolrzedna heksa podana przez `canFoundCity` (zawsze calkowita: klucz `map.hexes`) jako `i32`.
#[allow(clippy::cast_possible_truncation)]
fn js_hex_coord(v: f64) -> i32 {
    v as i32
}

/// Teren bazowy kafla stanu dla logiki cudow (`terenBazowy`; `Forest` = `rownina` + las, jak
/// [`terrain_labels`]).
const fn wonder_terrain(terrain: PlayableTerrain) -> WonderTerrain {
    match terrain {
        PlayableTerrain::Plains | PlayableTerrain::Forest => WonderTerrain::Plains,
        PlayableTerrain::Hills => WonderTerrain::Hills,
        PlayableTerrain::Water => WonderTerrain::Ocean,
    }
}

/// Web `qualifyingWonderHexesForPlayer()` (`main.ts:5210-5214`) z `wonderPlacementContext()`
/// (`:5189-5207`): miasta fotela (`isMe`), zajete = `placedWorldWonders`, budowy = `wonderBuildSites`
/// (stan nie ma budow cudow w toku: `[]`), heksy wszystkich miast;
/// [`list_qualifying_wonder_hexes_for_owner`] (`map/wonder-placement.ts:93`).
fn qualifying_wonder_hexes(state: &PlayableState, seat: PlayerId) -> Vec<(i32, i32)> {
    let player_cities: Vec<WonderPlacementCity> = state
        .cities
        .iter()
        .filter(|c| c.owner_id == seat)
        .map(|c| {
            let (q, r) = klucz_of(c.position);
            WonderPlacementCity {
                q,
                r,
                population: f64::from(c.population),
                is_outpost: None,
                is_fort: None,
            }
        })
        .collect();
    if player_cities.is_empty() {
        return Vec::new();
    }
    let map: Vec<WonderMapHex> = state
        .map
        .tiles
        .iter()
        .map(|t| {
            let (q, r) = klucz_of(t.position);
            WonderMapHex {
                coords: DomainHexCoord::new(q, r),
                terrain: wonder_terrain(t.terrain),
            }
        })
        .collect();
    let occupied: Vec<DomainHexCoord> = state
        .placed_world_wonders
        .iter()
        .map(|w| DomainHexCoord::new(w.q, w.r))
        .collect();
    let city_hexes: Vec<DomainHexCoord> = state
        .cities
        .iter()
        .map(|c| {
            let (q, r) = klucz_of(c.position);
            DomainHexCoord::new(q, r)
        })
        .collect();
    list_qualifying_wonder_hexes_for_owner(&WonderMapPlacementInput {
        map: &map,
        player_cities: &player_cities,
        occupied_wonder_hexes: &occupied,
        building_wonder_hexes: &[],
        city_hexes: &city_hexes,
    })
    .into_iter()
    .map(|h| (h.q, h.r))
    .collect()
}

/// Teren i nakladka kafla stanu dla budowy ulepszen (to samo co [`terrain_labels`]).
const fn build_terrain(terrain: PlayableTerrain) -> (ImprovementTerrain, Overlay) {
    match terrain {
        PlayableTerrain::Plains => (ImprovementTerrain::Plains, Overlay::Brak),
        PlayableTerrain::Hills => (ImprovementTerrain::Hills, Overlay::Brak),
        PlayableTerrain::Forest => (ImprovementTerrain::Plains, Overlay::Las),
        PlayableTerrain::Water => (ImprovementTerrain::Ocean, Overlay::Brak),
    }
}

/// Stan `createImprovementBuildApi({...}, { activeKey })` (`main.ts:16293-16325`,
/// `map/improvement-build.ts:1415`) i `civArch`. Pin buduje stan WYLACZNIE dla fotela glownego (literal
/// `0`: `playerCityNodes()` `:16214-16218`, `playerOwnerIdNum: 0`, `citySurowceSumForOwner(0)`,
/// `ownUnitHexKeysForOwner(0)`; `player.civType`, `player.era`, `player.zbadane`) - Rust
/// [`HUMAN_OWNER_ID`]. Wejscia spoza stanu = wartosci webu dla stanu bez nich: `hexClearingStates`
/// puste, `pendingImprovementsTurn` puste, brak grantow tras (`tradeRouteKonUnlocked` = false), mapa bez
/// zloz i rzek (RENDER_FRAME_STATE_DEFAULTS).
fn improvement_build_state(
    state: &PlayableState,
) -> Result<(ImprovementBuildState, String), RenderFrameError> {
    let primary = PlayerId::new(HUMAN_OWNER_ID.unsigned_abs());
    let player = state.players.iter().find(|p| p.id == primary);
    // `String(player.civType || 'rzymianie')` (`main.ts:16292`).
    let civ_arch = player
        .map(|p| p.civilization.clone())
        .filter(|c| !c.is_empty())
        .unwrap_or_else(|| "rzymianie".to_owned());
    let mut hexes = Vec::with_capacity(state.map.tiles.len());
    let mut road_entries: Vec<(String, HexLike)> = Vec::with_capacity(state.map.tiles.len());
    let mut placed_from_hex: Vec<String> = Vec::new();
    for tile in &state.map.tiles {
        let (q, r) = klucz_of(tile.position);
        let (terrain, overlay) = build_terrain(tile.terrain);
        let layers = state
            .map
            .improvements
            .iter()
            .find(|e| e.position == tile.position);
        let mut hex = BuildHex::new(q, r, terrain, overlay);
        // `hex.ulepszenie` zawsze obecne w mapie webu (`Ulepszenie.Brak` = "brak"), jak [`snapshot_map_of`].
        hex.ulepszenie = Some(
            layers
                .and_then(|l| l.ulepszenie.clone())
                .unwrap_or_else(|| "brak".to_owned()),
        );
        hex.ulepszenia = layers.and_then(|l| l.ulepszenia.clone());
        if hex.ulepszenie.as_deref() != Some("brak") {
            placed_from_hex.push(hex.key());
        }
        road_entries.push((
            hex.key(),
            HexLike {
                ulepszenie: hex.ulepszenie.clone(),
                ulepszenia: hex.ulepszenia.clone(),
                nakladka: Some(overlay),
                zloze: None,
            },
        ));
        hexes.push(hex);
    }
    // `placedImprovements` (Map klucz -> warstwy gracza) = heksy z niepustymi `ulepszenia`
    // (`syncHexUlepszenieFields`, `main.ts:16273-16287`), kolejnosc `map.improvements`.
    let mut placed_improvements = BTreeMap::new();
    let mut placed_keys: Vec<String> = Vec::new();
    for entry in &state.map.improvements {
        if let Some(layers) = entry.ulepszenia.as_ref().filter(|l| !l.is_empty()) {
            let (q, r) = klucz_of(entry.position);
            let k = build_hex_key(q, r);
            if !placed_keys.contains(&k) {
                placed_keys.push(k.clone());
            }
            placed_improvements.insert(k, PlacedLayers::Many(layers.clone()));
        }
    }
    // `collectPlacedImprovementKeys()` (`main.ts:16252-16258`): klucze `placedImprovements`, potem heksy
    // z `ulepszenie !== Brak` (kolejnosc `Set`).
    for k in placed_from_hex {
        if !placed_keys.contains(&k) {
            placed_keys.push(k);
        }
    }
    let mut own_unit_keys: Vec<String> = Vec::new();
    for u in state.units.iter().filter(|u| u.owner_id == primary) {
        let (q, r) = klucz_of(u.position);
        let k = build_hex_key(q, r);
        if !own_unit_keys.contains(&k) {
            own_unit_keys.push(k);
        }
    }
    // `citySurowceSumForOwner(0).kon ?? 0` (`main.ts:3586-3588`, `:16318`).
    let horse: f64 = state
        .cities
        .iter()
        .filter(|c| c.owner_id == primary)
        .filter_map(|c| state.economy.city_stock.get(&c.id.get()))
        .filter_map(|stock| stock.get("kon"))
        .sum();
    let mut build_state = ImprovementBuildState::new(
        BuildMap::new(hexes, Vec::new()),
        city_nodes_for_owner(state, primary),
    );
    build_state.territory_nodes = Some(engine_territory_nodes(state)?);
    build_state.player_owner_id_num = Some(HUMAN_OWNER_ID);
    build_state.placed_keys = Some(placed_keys);
    build_state.road_keys = Some(collect_road_keys(&road_entries));
    build_state.player_civ_archetype = Some(civ_arch.clone());
    build_state.player_era = Some(owner_era(state, HUMAN_OWNER_ID)?);
    build_state.placed_improvements = Some(placed_improvements);
    build_state.researched_techs = Some(
        state
            .stores
            .researched_techs_by_owner
            .get(&primary.get())
            .cloned()
            .unwrap_or_default(),
    );
    build_state.clearing_hex_keys = Some(BTreeSet::new());
    build_state.pending_undo_keys = Some(Vec::new());
    build_state.trade_route_kon_unlocked = Some(false);
    build_state.horse_stock_available = Some(horse);
    build_state.own_unit_hex_keys = Some(own_unit_keys);
    Ok((build_state, civ_arch))
}

/// Web `buildApi.getQualifyingHexes(key)` (`main.ts:16336-16337`): `isImprovementAllowedForCiv(key,
/// civArch) ? rawBuildApi.getQualifyingHexes(key) : []`.
fn improvement_qualifying_hexes(
    build_state: &ImprovementBuildState,
    civ_arch: &str,
    key: &str,
) -> Vec<(i32, i32)> {
    if !is_improvement_allowed_for_civ(key, Some(civ_arch)) {
        return Vec::new();
    }
    create_improvement_build_api(build_state, Some(key)).get_qualifying_hexes(key)
}

/// `GetRenderFrame` na sesji `game` dla fotela `seat` (`None` = aktywny fotel czlowieka, web `ME()`).
/// Wybor fotela dotyczy tylko zapytania (`active_seat` sesji bez zmian).
///
/// # Errors
///
/// [`RenderFrameError::UnknownSeat`] dla fotela spoza `state.players`; dalej jak [`build_render_frame`].
pub fn session_render_frame(
    game: &mut PlayableGame,
    seat: Option<u64>,
    ui: &RenderUiParams,
) -> Result<RenderLayersDto, RenderFrameError> {
    let (state, fog) = game.fog_session_parts();
    let seat = seat.map_or(fog.active_seat, PlayerId::new);
    build_render_frame(state, fog, seat, ui)
}
