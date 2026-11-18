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
//!   `selectPlayerUnit` nie zamyka trybu) nie jest odwzorowane: ramka bezstanowa wg litery D-R3-3.
//! * D-OP-4: zaznaczenie z UI (`RenderUiParams::selected_unit_id`, web `selectedId`, `main.ts:7116`) zasila
//!   `selection`, `reachable` i `pathRoute` (w webie jedna zmienna); `PlayableState.selected_unit_id` nie
//!   jest czytany przez ramke.
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

use crate::data::units_combat::{parse_units, UnitRecord};
use crate::domain::building_costs::p6_7b::StockRecord;
use crate::domain::city_view::{
    city_views, owner_views, CityStateFacts, CityViewCityFacts, CityViewError, CityViewInputs,
};
use crate::domain::combat::unit_building_bonuses::{armor_path_badge_level, soft_path_badge_level};
use crate::domain::diplomacy::RelationStatus;
use crate::domain::dto_bridge::{
    build_view_layers, engine_territory_nodes, fog_inputs_of, DtoBridgeError,
};
use crate::domain::map_snapshot::{
    JsKeyedMap, SnapshotCoords, SnapshotHex, SnapshotMap, SnapshotRiver, SnapshotVillage,
};
use crate::domain::map_view::{build_hex_dyn, build_map_view, MapViewError};
use crate::domain::mapgen::prims::hex_key;
use crate::domain::overlays_view::{
    build_highlight, build_highlight_mode_active, siege_views, trade_routes_view,
    unit_overlays_view, wonder_views, BuildHighlightSources, BuildHighlightUi, OverlaysUi,
    OverlaysViewError, SelectionUi, UnitOverlaysInput,
};
use crate::domain::pathfinding::ruch_jednostek::{Klucz, RuchJednostka};
use crate::domain::playable::{
    PlayableFogSession, PlayableGame, PlayableState, PlayableTerrain, PlayableUnit,
};
use crate::domain::playable_movement::{klucz_of, ruch_jednostki_from_state};
use crate::domain::recruitment::army_merge::{compute_stack_display, StosJednostka};
use crate::domain::start_reveal::StartRevealContext;
use crate::domain::terrain::visibility::fog_view::hex_order;
use crate::domain::terrain::visibility::units_visible_on_map;
use crate::domain::territory::collect_territory_hex_keys_by_owner;
use crate::domain::unit_health::veteran_star_count;
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

/// Pola ramki, ktorych r1 NIE produkuje zgodnie z webem (luki do rundy r2 tego samego ID). Kazda
/// pozycja jest tez w tabeli raportu operatora.
pub const RENDER_FRAME_GAPS: &[RenderFrameGap] = &[
    RenderFrameGap {
        field: "overlays.workerFields",
        produced: "[]",
        reason: "web liczy pola robotnikow wszystkich miast (showWorkerOverlay = true, main.ts:15432-15448); \
                 producent worker_fields_view wymaga modelu miast ekonomii (okolicaFocus/Tryb/Reczne) i BuildMap, \
                 ktorych PlayableState nie niesie (EKONOMIA-STAN #310)",
    },
    RenderFrameGap {
        field: "overlays.buildHighlight.hexes",
        produced: "[] (kind zgodny z trybem)",
        reason: "zrodla canFoundPlayerCityAt (canFoundCity), qualifyingWonderHexesForPlayer i \
                 buildApi.getQualifyingHexes nie maja adaptera z PlayableState (main.ts:16351-16395)",
    },
    RenderFrameGap {
        field: "stacks.vitalsByRepId",
        produced: "[]",
        reason: "StackVitalsDeps (hpMaxEffective, combatPowerFullDisplayDefFor, sumRosterFieldM; main.ts:14476-14506) \
                 nie sa portowane",
    },
    RenderFrameGap {
        field: "stacks.starvingRepIds / stacks.goldDeficitRepIds",
        produced: "[]",
        reason: "isArmyHungry / isGoldDeficit (main.ts:14513-14546) czytaja magazyn zywnosci i skarbiec wlasciciela, \
                 ktorych stan nie niesie per wlasciciel (EKONOMIA-STAN #310)",
    },
    RenderFrameGap {
        field: "units[].hp (brak hp w stanie) / units[].hpMax",
        produced: "hp = health z units.json, hpMax = economy.units[id].hpMax",
        reason: "web hpMaxEffective (unitCardCombatFor) z bonusami trwalymi nie jest portowany",
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
        field: "units[].armorBadgeLevel / units[].softBadgeLevel",
        produced: "armor_path_badge_level(None) / soft_path_badge_level(None)",
        reason: "stan nie ma unitBuildingProgress (web armorPathBadgeLevel(undefined))",
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

fn unit_view(
    state: &PlayableState,
    unit: &PlayableUnit,
    rj: &RuchJednostka,
    defs: &HashMap<String, UnitRecord>,
) -> Result<UnitViewDto, RenderFrameError> {
    // Adapter ruchu zawsze ustawia typ (`playable_movement.rs`: zamiana albo typ startowy); brak typu albo
    // definicji = jawny blad (obrona r1 zarzut 3), nie `hp = 0` / pusty `typeId`.
    let type_id = rj
        .type_id
        .clone()
        .ok_or_else(|| RenderFrameError::UnknownUnitType(String::new()))?;
    let def = defs
        .get(&type_id)
        .ok_or_else(|| RenderFrameError::UnknownUnitType(type_id.clone()))?;
    let replace = state.economy.units.get(&unit.id.get());
    // `hp` undefined = pelne z definicji (`units/setup.ts:60`, `unitHealth(def)` `main.ts:33093-33095`);
    // luka hpMaxEffective w RENDER_FRAME_GAPS.
    #[allow(clippy::cast_precision_loss)]
    let full_hp = def.health_lc as f64;
    let hp = replace.and_then(|r| r.hp).unwrap_or(full_hp);
    let stars = veteran_star_count(replace.and_then(|r| r.battles_survived));
    // Gwiazdki to `0..=3` (`VETERAN_MAX_BATTLES_TRACKED`).
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    let veteran_stars = stars as u8;
    Ok(UnitViewDto {
        id: vm_unit(&rj.id)?,
        owner_id: vm::OwnerRef::Player(vm_player(unit.owner_id)?),
        type_id,
        category: rj.category.clone(),
        hex: HexCoord::new(rj.q, rj.r),
        ruch_max: rj.ruch,
        ruch_left: rj.ruch_left,
        hp,
        hp_max: replace.and_then(|r| r.hp_max),
        // Stan nie ma `embarked`, `inGarnizon`, `isGeneral` ani `dimmedUnitIds`: web undefined/false.
        embarked: rj.embarked == Some(true),
        in_garnizon: rj.in_garnizon,
        is_general: false,
        veteran_stars,
        // `unitBuildingProgress` nie istnieje w stanie: web `armorPathBadgeLevel(undefined)`.
        armor_badge_level: armor_path_badge_level(None),
        soft_badge_level: soft_path_badge_level(None),
        dimmed: false,
    })
}

/// `stacks` (kontrakt §3.5): web `computeStackDisplay(src, unitAttackScore, ...)` (`main.ts:14476`),
/// `unitAttackScore` = `meleeAttack` definicji (`main.ts:14436-14438`). Vitals i ikony: luki.
fn stack_view(
    shown: &[(&PlayableUnit, RuchJednostka)],
    defs: &HashMap<String, UnitRecord>,
) -> Result<StackViewDto, RenderFrameError> {
    let stos: Vec<StosJednostka> = shown
        .iter()
        .map(|(_, rj)| {
            let mut s = StosJednostka::new(
                &rj.id,
                rj.owner_id,
                rj.type_id.as_deref().unwrap_or(""),
                rj.q,
                rj.r,
            );
            s.ruch = rj.ruch;
            s.ruch_left = rj.ruch_left;
            s.in_garnizon = Some(rj.in_garnizon);
            s.category = rj.category.clone();
            s
        })
        .collect();
    #[allow(clippy::cast_precision_loss)]
    let attack_of = |u: &StosJednostka| defs.get(&u.type_id).map_or(0.0, |d| d.melee_attack as f64);
    let info = compute_stack_display::<()>(&stos, &attack_of, None);
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
    let vitals_by_rep_id: Vec<(vm::UnitId, StackVitalsDto)> = Vec::new();
    Ok(StackViewDto {
        visible_ids,
        badge_by_rep_id,
        starving_rep_ids: Vec::new(),
        gold_deficit_rep_ids: Vec::new(),
        vitals_by_rep_id,
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
/// [`trade_routes_view`]; `battle` = `None` (stan nie ma otwartej bitwy).
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
    let stacks = stack_view(&shown, defs)?;

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
    // Luki RENDER_FRAME_GAPS `overlays.buildHighlight.hexes`.
    let can_found = |_: i32, _: i32| false;
    let wonder_hexes = Vec::new;
    let qualifying = |_: &str| Vec::new();
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

    if ui.build_mode_open || build_highlight_mode_active(&build_ui) {
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
