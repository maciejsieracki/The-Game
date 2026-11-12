//! P6-WIRE-WAR-PIPELINE (W8 r4): producenci wejsc fazy Diplomacy z `PlayableState` + `WarTurnState`.
//!
//! r6: epoka wlasciciela ma producenta (`turn_war_epoch`, pin main.ts:2419; AI bez wpisu = jawny
//! `gameStartEra()`, zrodlo `EpochSource`). r6 klocek 2 (WIRE-WAR-POP): `PlayableCity` niesie populacje i
//! kulture (`#[serde(default)]`), wiec ludki, rekruci, kultura, terytorium i wspolna granica maja producentow.
//! r6 klocek 3 (WIRE-WAR-STORES): infra, tech i religia maja producentow z `PlayableStores`, wiec
//! `UNPRODUCED_POWER_COMPONENTS` jest pusta i `advance_turn` z AI posiadajacym miasta przechodzi. Skladnik
//! bez danych daje jawny `WarTurnError::PowerComponentsMissing`, a skladnik NaN/Inf jawny
//! `WarTurnError::PowerComponentNonFinite`. BEZ cichych zer.
//! Wejscia (`ObjectivePowerRaw`), blokady pokoju, parametry par hamulca
//! (`diploBrakeWarParams`) i flaga multiwar. Zrodla (pin 07d2fbd72, tylko odczyt):
//! - `diploBrakeWarParams` main.ts:11567 (wyzsza z dwoch `progWojnyRelacji`, N = `hamulecN` tej strony;
//!   gracz = brak wiersza macierzy = wartosci bazowe) -> `diplomacy_war_peace_profile`,
//! - `WAR_RULES_MULTIWAR_ENABLED = true` war-rules-multiwar.ts:50,
//! - `forcedEraPeaceUntilNextEraByPairKey` / `diplomacyPairMeta` (main.ts:37336, :37431) z surowego `opaque`.
//!
//! Zasada: BRAK CICHYCH ZER. Kazdy skladnik mocy jest `Provided` (producent z danych stanu),
//! `ExplicitZero` z uzasadnieniem plik:linia pinu (`EXPLICIT_ZERO_REASONS`) albo `Missing` (blad
//! STRICT w `run_war_turn`). Pole, ktorego stan nie niesie, a ktore nie jest faktem strukturalnym,
//! jest bledem (`WarInputsError` / `WarTurnError`), nie zerem ani stala.
//!
//! r5 (stan historyczny): `PlayableState` NIE symulowal fazy Economy ani badan. Nie bylo budynkow, tech,
//! religii, ulepszen, walk ani epoki per wlasciciel (r6: epoka = jawny fallback pinu). Populacja i kultura
//! miast (r6 klocek 2) sa polami stanu, ktore NIE ROSNA miedzy turami (brak Economy; `KNOWN_GAPS`).
//! Skladniki bez danych w stanie sa `Missing` i daja jawny blad STRICT; od r6 klocek 3 infra/tech/religia
//! maja magazyny `PlayableStores` (puste = `Provided(0)` jako realny stan pusty, patrz `KNOWN_GAPS`).
//!
//! Identyfikatory: Rust numeruje gracza od 1 (`HUMAN_OWNER_ID`), web od 0. Pipeline dziala w
//! przestrzeni Rust; `web_owner_id` / `rust_owner_id` to jedyne mapowanie (testowane na wektorze pinu).

use std::collections::{BTreeMap, BTreeSet};
use std::sync::OnceLock;

use serde_json::Value;

use crate::data::derived::parse_player_state_params;
use crate::data::units_combat::{parse_power_params, parse_units, BoolOrText};

use super::ai_diplomacy_turn::{pair_key, PairKey, PairWarParams};
use super::brake_inputs::ForcedEraLock;
use super::brake_power::{Component, ObjectivePowerRaw};
use super::brake_power_army::{
    armia_for_owner, terytorium_for_owner, ArmyUnit, ArmyUnitDef, TerritoryCityInput,
};
use super::brake_power_producers::{apply_produced, produce_for_owner, ProducerInputs};
use super::brake_power_rest::{
    count_buildings_for_owner, count_cities_with_dominant_state_religion, count_tech_for_owner,
    ReligionCity,
};
use super::diplomacy::CityResourceState;
use super::diplomacy_truce::PairMetaWeb;
use super::diplomacy_war_peace_profile::{
    brake_relation_threshold, resolve_war_peace_profile, war_peace_params,
};
use super::order_effects_culture::PressureCity;
use super::order_effects_culture::{
    civ_religion_for_key, load_religion_params, resolve_city_religion_state,
};
use super::playable::{PlayableMap, PlayableState, PlayableTerrain, PlayableUnitKind};
use super::recruitment::manpower::{civ_manpower_max_mult, civ_manpower_mults, ManpowerCity};
use super::terrain::city_territory_radius;
use super::terrain::CityNode;
use super::territory::ReligionState;
use super::trade::{
    owners_have_shared_land_border, HexCoord, TerrainType as TradeTerrain, TerritoryNode, TradeMap,
};
use super::turn_war_dipl_steps::DiplStepsInputs;
use super::turn_war_epoch::{epochs_with_sources, OwnerEpochError};
use super::turn_war_pipeline::{PeaceLockFacts, WarTurnConfig, WarTurnInputs};
use super::types::{porzadek::society_params, Difficulty};
use super::war_turn_state::WarTurnState;

/// Web `WAR_RULES_MULTIWAR_ENABLED` (war-rules-multiwar.ts:50, pin 07d2fbd72) = `true`.
pub const WAR_RULES_MULTIWAR_ENABLED: bool = true;
/// Id gracza-czlowieka w `PlayableState` (`HUMAN_PLAYER_ID`); web = 0.
pub const HUMAN_OWNER_ID: i64 = 1;
/// Klucze `opaque` (web `meta`): blokady pokoju epoki i meta par (pary `[klucz, wartosc]`).
pub const KEY_PAIR_META: &str = "diplomacyPairMeta";
pub use super::war_turn_declare::KEY_ERA_PEACE_LOCK;

/// Skladniki mocy z jawnym zerem: powod z odwolaniem plik:linia pinu (kontrolowane testem).
/// P6-POWER-BITWY-ZDOBYCZE: `bitwy` i `zdobycze` maja producentow z akumulatorow `WarTurnState`
/// (`battle_power_pts_for`, `zdobycze_power_for`; brak wpisu = realne 0 jak `?? 0` w webie), wiec lista
/// jest PUSTA. Jawne zero `ulepszenia_terenu` w `power_raw_for_owner` pozostaje poza ta lista (patrz nizej).
pub const EXPLICIT_ZERO_REASONS: [(&str, &str); 0] = [];

/// Skladniki mocy bez producenta w `PlayableState` (klucze web `breakdown.key`); produkcyjne wejscia
/// ustawiaja je na `Component::Missing` (test egzekwuje zgodnosc z `run_war_turn`). Od r6 klocek 3
/// (WIRE-WAR-STORES) lista jest PUSTA: infra, tech i religia maja producentow z `PlayableStores`.
pub const UNPRODUCED_POWER_COMPONENTS: [&str; 0] = [];

/// Znane luki producentow (NIE_ZMIERZONO wzgledem web) = lista producentow potrzebnych w r6.
pub const KNOWN_GAPS: [&str; 5] = [
    "epoka wlasciciela: producent turn_war_epoch (web empireEpochForOwner main.ts:2419); brak badan/era per owner w PlayableState => jawny fallback gameStartEra (main.ts:2415) i czlowiek DerivedFromStartEra; LUKA: epoka STATYCZNA miedzy turami (awans badan nie jest odtwarzany: web syncOwnerEraFromResearch / reconcilePlayerEraFromResearch main.ts:2521)",
    "wspolna granica: producent shared_border_pairs (web karaWspolnaGranica main.ts:22876 -> ownersShareLandBorderLive main.ts:5690 -> ownersHaveSharedLandBorder trade-routes.ts:264) na wezlach miast z populacji (cityTerritoryRadius); LUKA: PlayableState nie ma fortow/posterunkow (brak wezlow forto-terytorium), a pozycja x,y mapy jest czytana jako (q,r) jak w ManpowerCity (NIE_ZMIERZONO zgodnosc siatki z mapa weba)",
    "populacja i kultura miast sa polami stanu (PlayableCity.population/culture), ale NIE ROSNA miedzy turami (brak fazy Economy); ludki, rekruci, terytorium, kultura licza sie z tych wartosci; manpower biezacy miasta nie jest w stanie (web undefined = max)",
    "budynki (infra), tech zbadane, religia: magazyny PlayableStores (buildings_by_city, researched_techs_by_owner, religion_by_city) sa PUSTE w produkcyjnym stanie i nie zmieniaja sie miedzy turami (brak Economy/badan); puste = Provided(0) jako realny stan pusty, nie brak danych. Religia panstwowa = religia cywilizacji (civs.json), trudnosc = Normal (difficulty:NOT_IMPLEMENTED w StartGameParams); stan religii miasta bez wpisu = default z populacji (resolveCityReligionState)",
    "TickContext: handel, religia, dobra wola, wiarygodnosc = domyslne (PlayableState ich nie niesie)",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WarInputsError {
    /// `params.epoch_id` poza `numer_epoki` (player-state-params.json).
    UnknownStartEpoch(String),
    /// `PlayableState` nie niesie epoki per wlasciciel (brak badan); NIE podstawiamy epoki startu.
    OwnerEpochUnavailable(i64),
    /// Wlasciciel (np. miasta) bez wpisu w `players`: brak profilu cywilizacji, nie zgadujemy.
    UnknownOwner(i64),
    /// AI z miastami, ale brak gracza-czlowieka (para gracz<->AI nie ma sensu).
    NoHumanPlayer,
    /// Brak rekordu jednostki `Wojownik` w units.json.
    NoWarriorRecord,
    /// Zly klucz pary w `opaque` (oczekiwane `a-b`).
    BadPairKey(String),
    /// Zly wpis meta (klucz web, powod).
    BadMeta(&'static str, String),
}

impl std::fmt::Display for WarInputsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnknownStartEpoch(id) => write!(f, "war inputs: nieznana epoka startu '{id}'"),
            Self::OwnerEpochUnavailable(id) => write!(
                f,
                "war inputs: brak producenta epoki wlasciciela {id} (PlayableState bez badan)"
            ),
            Self::UnknownOwner(id) => write!(f, "war inputs: wlasciciel {id} bez wpisu w players"),
            Self::NoHumanPlayer => write!(f, "war inputs: brak gracza-czlowieka"),
            Self::NoWarriorRecord => write!(f, "war inputs: brak rekordu Wojownik w units.json"),
            Self::BadPairKey(k) => write!(f, "war inputs: zly klucz pary '{k}'"),
            Self::BadMeta(key, why) => write!(f, "war inputs: {key}: {why}"),
        }
    }
}

impl std::error::Error for WarInputsError {}

/// Rust -> web: gracz 1 = web 0 (kolejni gracze przesunieci o 1).
pub fn web_owner_id(rust_id: i64) -> i64 {
    rust_id - HUMAN_OWNER_ID
}

/// Web -> Rust (odwrotnosc `web_owner_id`).
pub fn rust_owner_id(web_id: i64) -> i64 {
    web_id + HUMAN_OWNER_ID
}

/// Numer epoki startu gry (`numer_epoki[epoch_id]`, jak web `epochNumber`).
pub fn start_epoch_number(epoch_id: &str) -> Result<f64, WarInputsError> {
    let params = parse_player_state_params().expect("player-state-params.json must parse");
    params
        .numer_epoki
        .get(epoch_id.trim().to_lowercase().as_str())
        .map(|&n| n as f64)
        .ok_or_else(|| WarInputsError::UnknownStartEpoch(epoch_id.to_owned()))
}

fn warrior_def() -> Result<&'static ArmyUnitDef, WarInputsError> {
    static DEF: OnceLock<Option<ArmyUnitDef>> = OnceLock::new();
    DEF.get_or_init(|| {
        parse_units()
            .expect("units.json must parse")
            .iter()
            .find(|u| u.jednostka == "Wojownik")
            .map(ArmyUnitDef::from_unit_record)
    })
    .as_ref()
    .ok_or(WarInputsError::NoWarriorRecord)
}

/// Web `liczyOsadnikWArmii` (power-params.json `opcje`); inna niz bool wartosc => web `!== false`.
fn count_settlers() -> bool {
    let p = parse_power_params().expect("power-params.json must parse");
    !matches!(
        p.opcje.liczy_osadnik_w_armii.wartosc,
        BoolOrText::Bool(false)
    )
}

/// Wlasciciele par: gracze oraz wlasciciele miast.
fn all_owner_ids(state: &PlayableState) -> BTreeSet<i64> {
    state
        .players
        .iter()
        .map(|p| p.id.get() as i64)
        .chain(state.cities.iter().map(|c| c.owner_id.get() as i64))
        .collect()
}

/// Czy heks (q, r) istnieje na mapie `PlayableState` (web `map.hexes[key]` truthy): kafel o tej pozycji
/// wystepuje w `tiles` (nie tylko w prostokacie width x height). Pozycja x,y mapy jest
/// czytana jako (q, r) - ta sama konwencja co `ManpowerCity` (NIE_ZMIERZONO zgodnosc siatki z webem).
fn map_has_hex(map: &PlayableMap, q: i32, r: i32) -> bool {
    let (Ok(x), Ok(y)) = (u16::try_from(q), u16::try_from(r)) else {
        return false;
    };
    map.tile(super::types::PositionDto::new(x, y)).is_some()
}

/// `ObjectivePowerRaw` jednego wlasciciela: producenci z `PlayableState`, reszta jawne zero (patrz naglowek).
/// Populacja i kultura miast pochodza z pol `PlayableCity` (stan), nie ze stalych.
pub fn power_raw_for_owner(
    state: &PlayableState,
    owner_id: i64,
    epoka: f64,
) -> Result<ObjectivePowerRaw, WarInputsError> {
    let manpower: Vec<ManpowerCity> = state
        .cities
        .iter()
        .map(|c| {
            let mut m = ManpowerCity::new(
                c.id.get().to_string(),
                c.owner_id.get() as i64,
                f64::from(c.population),
            );
            m.q = i32::from(c.position.x());
            m.r = i32::from(c.position.y());
            m
        })
        .collect();
    let pressure: Vec<PressureCity> = state
        .cities
        .iter()
        .map(|c| PressureCity {
            owner_id: c.owner_id.get() as i64,
            kultura_skumulowana: f64::from(c.culture),
            religion_state: ReligionState::default(),
        })
        .collect();
    let city_owner_ids: Vec<i64> = state
        .cities
        .iter()
        .map(|c| c.owner_id.get() as i64)
        .collect();
    // Mnozniki manpower: pin 91dc998a -> civManpower*Mult zawsze neutralne (1.0).
    let max_mult = civ_manpower_max_mult(None);
    let cost_mult = civ_manpower_mults(None).0;
    let produced = produce_for_owner(
        &ProducerInputs {
            manpower_cities: &manpower,
            pressure_cities: &pressure,
            city_owner_ids: &city_owner_ids,
            epoka,
            max_mult,
            cost_mult,
        },
        owner_id,
    );
    let mut raw = ObjectivePowerRaw {
        owner_id,
        epoka,
        jednostki: Component::Missing,
        wygrane_bitwy: Component::Missing,
        bitwy_pkt_sum: Component::Missing,
        suma_ludkow: Component::Missing,
        rekrut_ekw: Component::Missing,
        miasta: Component::Missing,
        heksy_terytorium: Component::Missing,
        budynki: Component::Missing,
        tech_zbadane: Component::Missing,
        ulepszenia_terenu: Component::Missing,
        kultura_imperium: Component::Missing,
        miasta_jednosc_religii: Component::Missing,
        zdobycze_power: Component::Missing,
    };
    // ludki, rekruci, miasta, kultura: producenci z populacji/kultury w stanie miast.
    apply_produced(&mut raw, &produced);
    // terytorium (web countTerritoryHexes(statsTerritoryNodesForOwner)): wezly = miasta wlasciciela z populacji;
    // PlayableState nie ma fortow/posterunkow (brak wezlow forto-terytorium - jawna luka, KNOWN_GAPS[1]).
    let territory_cities: Vec<TerritoryCityInput> = state
        .cities
        .iter()
        .map(|c| TerritoryCityInput {
            q: i32::from(c.position.x()),
            r: i32::from(c.position.y()),
            population: f64::from(c.population),
            owner_id: c.owner_id.get() as i64,
        })
        .collect();
    raw.heksy_terytorium = Component::Provided(terytorium_for_owner(
        &territory_cities,
        &[],
        owner_id,
        &|q, r| map_has_hex(&state.map, q, r),
    ));
    // infra / tech / religia: producenci POWER-REST na magazynach `PlayableStores`. Pusty magazyn to realny
    // stan pusty (stan nie symuluje budowy ani badan), wiec `Provided(0)` nie jest brakiem danych.
    let stores = &state.stores;
    let city_built: Vec<(u64, usize)> = stores
        .buildings_by_city
        .iter()
        .map(|(id, blt)| (*id, blt.len()))
        .collect();
    let city_owners: Vec<(u64, i64)> = state
        .cities
        .iter()
        .map(|c| (c.id.get(), c.owner_id.get() as i64))
        .collect();
    raw.budynki =
        Component::Provided(count_buildings_for_owner(&city_built, &city_owners, owner_id) as f64);
    let is_human = state
        .players
        .iter()
        .any(|p| p.is_human && p.id.get() as i64 == owner_id);
    let owner_key = u64::try_from(owner_id).ok();
    let techs_len = owner_key
        .and_then(|k| stores.researched_techs_by_owner.get(&k))
        .map(|t| t.len());
    raw.tech_zbadane =
        Component::Provided(
            count_tech_for_owner(is_human, techs_len.unwrap_or(0), techs_len) as f64,
        );
    raw.miasta_jednosc_religii = Component::Provided(religion_unity_for_owner(state, owner_id)?);

    // armia: Wojownik z units.json (jedyny rodzaj jednostki w PlayableState).
    let def = warrior_def()?;
    let units: Vec<ArmyUnit> = state
        .units
        .iter()
        .filter(|u| matches!(u.kind, PlayableUnitKind::Warrior))
        .map(|u| ArmyUnit {
            owner_id: u.owner_id.get() as i64,
            is_settler: false,
            def: def.clone(),
        })
        .collect();
    raw.jednostki = Component::Provided(armia_for_owner(&units, owner_id, count_settlers()));

    // bitwy (P6-POWER-BITWY-ZDOBYCZE): akumulator punktow wygranych bitew zwyciezcy (web bitwyPktSum =
    // battlePowerPtsByOwner.get(ownerId) ?? 0, main.ts:2763) - Provided, takze 0 bez wygranej (realny stan).
    // wygrane_bitwy (model FlatCount): web podaje literal 0 (main.ts:2764, :2819) - Provided(0), nie brak danych.
    raw.bitwy_pkt_sum = Component::Provided(state.war.battle_power_pts_for(owner_id));
    raw.wygrane_bitwy = Component::Provided(0.0);
    // zdobycze (P6-POWER-BITWY-ZDOBYCZE): akumulator zdobyczy Power zdobywcy (web zdobyczePower =
    // zdobyczePowerByOwner.get(ownerId) ?? 0, main.ts:2779) - Provided.
    raw.zdobycze_power = Component::Provided(state.war.zdobycze_power_for(owner_id));
    // Jawne zero z uzasadnieniem (EXPLICIT_ZERO_REASONS jest pusta): ulepszenia.
    // ulepszenia: producent istnieje (brake_power_improvements, POWER-ULEPSZENIA-Q1), ale NIE jest podpiety
    // do power_raw_for_owner (BRAK, POWER-ULEPSZENIA-WIRING-Q1). Zostaje ExplicitZero, bo PlayableState nie niesie
    // ulepszen terenu: PlayableTile ma tylko position/terrain/passable (playable.rs:256-260), a
    // PlayableReplaceEconomy (playable.rs:371) to skarbiec/stock/jednostki. Brakujace wejscia: pola
    // `ulepszenie`/`ulepszenia` heksa (BuildHex, improvement_build.rs:157-160) oraz dyski terytorium wezlow
    // zalozycielskich. Web countImprovementsForOwner (main.ts:2643) liczy je z heksow.
    raw.ulepszenia_terenu = Component::ExplicitZero;
    Ok(raw)
}

/// Web `civs.json` jako `Value` (wejscie `civReligionForKey`).
fn civs_value() -> &'static Value {
    static CIVS: OnceLock<Value> = OnceLock::new();
    CIVS.get_or_init(|| {
        serde_json::from_str(crate::data::civilizations::CIVS_JSON).expect("civs.json must parse")
    })
}

/// Producent `religia` (web `countCitiesWithDominantStateReligion`, main.ts:2773): religia panstwowa =
/// religia cywilizacji wlasciciela (`ownerReligionForOwnerId`, main.ts:5535), stan miasta =
/// `resolveCityReligionState(cityRelig.get(id), population, religia wlasciciela)` (main.ts:5539),
/// prog dominacji z `loadReligionParams(societyParams, trudnosc)`; trudnosc = Normal (luka KNOWN_GAPS).
fn religion_unity_for_owner(state: &PlayableState, owner_id: i64) -> Result<f64, WarInputsError> {
    let society = society_params();
    let civs = civs_value();
    let religion_of = |oid: i64| -> Result<Option<String>, WarInputsError> {
        let player = state
            .players
            .iter()
            .find(|p| p.id.get() as i64 == oid)
            .ok_or(WarInputsError::UnknownOwner(oid))?;
        Ok(civ_religion_for_key(
            Some(player.civilization.as_str()),
            Some(society),
            Some(civs),
        ))
    };
    // Wlasciciel bez miast: web liczy 0 miast z dominujaca religia (religia panstwowa nieistotna);
    // brak wpisu w `players` blokuje dopiero wlasciciela Z miastami (jak `pair_params_for`).
    if !state
        .cities
        .iter()
        .any(|c| c.owner_id.get() as i64 == owner_id)
    {
        return Ok(0.0);
    }
    let own_religion = religion_of(owner_id)?;
    let params = load_religion_params(Some(society), Difficulty::Normal);
    let mut states: Vec<(i64, ReligionState)> = Vec::new();
    for c in state
        .cities
        .iter()
        .filter(|c| c.owner_id.get() as i64 == owner_id)
    {
        let stored = state
            .stores
            .religion_by_city
            .get(&c.id.get())
            .map(|m| ReligionState {
                counts: m.iter().map(|(k, v)| (k.clone(), f64::from(*v))).collect(),
            });
        states.push((
            owner_id,
            resolve_city_religion_state(
                stored.as_ref(),
                f64::from(c.population),
                own_religion.as_deref(),
            ),
        ));
    }
    let cities: Vec<ReligionCity<'_>> = states
        .iter()
        .map(|(o, s)| ReligionCity {
            owner_id: *o,
            religion_state: Some(s),
        })
        .collect();
    Ok(count_cities_with_dominant_state_religion(
        &cities,
        owner_id,
        own_religion.as_deref(),
        params.prog_dominacji_pct,
    ))
}

fn parse_pair_key(key: &str) -> Result<PairKey, WarInputsError> {
    let bad = || WarInputsError::BadPairKey(key.to_owned());
    let (a, b) = key.split_once('-').ok_or_else(bad)?;
    let a: i64 = a.parse().map_err(|_| bad())?;
    let b: i64 = b.parse().map_err(|_| bad())?;
    Ok(pair_key(a, b))
}

fn pair_rows<'a>(war: &'a WarTurnState, key: &'static str) -> Result<&'a [Value], WarInputsError> {
    match war.opaque.get(key) {
        None => Ok(&[]), // web `?? []`: brak klucza = brak blokad
        Some(Value::Array(a)) => Ok(a),
        Some(_) => Err(WarInputsError::BadMeta(
            key,
            "oczekiwano tablicy par".to_owned(),
        )),
    }
}

/// Blokady pokoju z surowych kluczy `meta` (pary `[klucz "a-b", wartosc]`, id w przestrzeni Rust).
pub fn peace_locks_from_war(war: &WarTurnState) -> Result<PeaceLockFacts, WarInputsError> {
    let mut facts = PeaceLockFacts::default();
    for row in pair_rows(war, KEY_ERA_PEACE_LOCK)? {
        let (key, val) = row
            .as_array()
            .and_then(|r| Some((r.first()?.as_str()?, r.get(1)?)))
            .ok_or_else(|| {
                WarInputsError::BadMeta(KEY_ERA_PEACE_LOCK, "wpis nie jest [klucz, blokada]".into())
            })?;
        let lock = val
            .get("ownerId")
            .and_then(Value::as_i64)
            .zip(val.get("era").and_then(Value::as_i64))
            .ok_or_else(|| {
                WarInputsError::BadMeta(
                    KEY_ERA_PEACE_LOCK,
                    format!("blokada {key} bez ownerId/era"),
                )
            })?;
        facts.forced_era_locks.insert(
            parse_pair_key(key)?,
            ForcedEraLock {
                owner_id: lock.0,
                era: lock.1,
            },
        );
    }
    for row in pair_rows(war, KEY_PAIR_META)? {
        let (key, val) = row
            .as_array()
            .and_then(|r| Some((r.first()?.as_str()?, r.get(1)?)))
            .ok_or_else(|| {
                WarInputsError::BadMeta(KEY_PAIR_META, "wpis nie jest [klucz, meta]".into())
            })?;
        let meta: PairMetaWeb = serde_json::from_value(val.clone())
            .map_err(|e| WarInputsError::BadMeta(KEY_PAIR_META, format!("{key}: {e}")))?;
        facts.meta_by_pair.insert(parse_pair_key(key)?, meta);
    }
    Ok(facts)
}

/// Web `diploBrakeWarParams(a, b)` dla kazdej pary graczy (dane z `diplomacy-war-peace-params.json`).
/// Wlasciciel bez wpisu w `players` => `UnknownOwner` (r5: zadnego cichego profilu gracza).
pub fn pair_params_for(
    state: &PlayableState,
) -> Result<BTreeMap<PairKey, PairWarParams>, WarInputsError> {
    let wp = war_peace_params();
    let me = state
        .players
        .iter()
        .find(|p| p.is_human)
        .map(|p| p.id.get() as i64);
    let ids: Vec<i64> = all_owner_ids(state).into_iter().collect();
    // Web: `isMe(o) ? undefined : civKeyForOwnerId(o)`.
    let mut civs: BTreeMap<i64, Option<&str>> = BTreeMap::new();
    for &id in &ids {
        let player = state
            .players
            .iter()
            .find(|p| p.id.get() as i64 == id)
            .ok_or(WarInputsError::UnknownOwner(id))?;
        civs.insert(
            id,
            if Some(id) == me {
                None
            } else {
                Some(player.civilization.as_str())
            },
        );
    }
    let mut out = BTreeMap::new();
    for (i, &a) in ids.iter().enumerate() {
        for &b in &ids[i + 1..] {
            let pa = resolve_war_peace_profile(civs[&a], wp);
            let pb = resolve_war_peace_profile(civs[&b], wp);
            let higher = if pa.prog_wojny_relacji >= pb.prog_wojny_relacji {
                pa
            } else {
                pb
            };
            out.insert(
                pair_key(a, b),
                PairWarParams {
                    prog: brake_relation_threshold(higher.prog_wojny_relacji, wp),
                    n: higher.hamulec_n,
                },
            );
        }
    }
    Ok(out)
}

/// Konfiguracja produkcyjna fazy: pary z danych Rust, multiwar jak pin.
pub fn production_config(state: &PlayableState) -> Result<WarTurnConfig, WarInputsError> {
    Ok(WarTurnConfig::new(
        pair_params_for(state)?,
        WAR_RULES_MULTIWAR_ENABLED,
    ))
}

/// Epoki wlascicieli z `PlayableState` (producent `turn_war_epoch`, pin main.ts:2419 `empireEpochForOwner`).
/// `PlayableState` nie niesie badan ani epoki per wlasciciel: AI dostaje jawny `gameStartEra()` (zgodnosc z
/// pinem `ownerEraByOwner.get(id) ?? gameStartEra()`, `EpochSource::FallbackGameStartEra`), czlowiek epoke
/// startu (brak badan = brak awansu). Zrodla: `turn_war_epoch::epochs_with_sources`.
pub fn epochs_from_state(state: &PlayableState) -> Result<BTreeMap<i64, f64>, WarInputsError> {
    epochs_with_sources(state, &all_owner_ids(state))
        .map(|m| m.into_iter().map(|(id, (e, _))| (id, e)).collect())
        .map_err(|e| match e {
            OwnerEpochError::HumanEraMissing(id) => WarInputsError::OwnerEpochUnavailable(id),
        })
}

/// `TradeMap` z mapy `PlayableState` (teren bazowy: woda -> Morze, reszta lad; x,y = q,r).
fn trade_map_from_state(map: &PlayableMap) -> TradeMap {
    let mut out = TradeMap::new(u32::from(map.width), u32::from(map.height));
    for tile in &map.tiles {
        let terrain = match tile.terrain {
            PlayableTerrain::Plains => TradeTerrain::Plains,
            PlayableTerrain::Hills => TradeTerrain::Hills,
            PlayableTerrain::Forest => TradeTerrain::Forest,
            PlayableTerrain::Water => TradeTerrain::Ocean,
        };
        out.insert(
            HexCoord::new(i32::from(tile.position.x()), i32::from(tile.position.y())),
            terrain,
        );
    }
    out
}

/// Wezly terytorium miast (web `buildAllTerritoryNodes`, bez fortow: `PlayableState` ich nie niesie):
/// promien = `cityTerritoryRadius` z populacji miasta.
fn territory_nodes_from_state(state: &PlayableState) -> Vec<TerritoryNode> {
    state
        .cities
        .iter()
        .map(|c| {
            let node = CityNode::city(
                i32::from(c.position.x()),
                i32::from(c.position.y()),
                f64::from(c.population),
            );
            TerritoryNode::new(
                c.owner_id,
                node.q,
                node.r,
                city_territory_radius(&node).floor().max(0.0) as u32,
            )
        })
        .collect()
}

/// Wspolna granica pary (web `karaWspolnaGranica`, main.ts:22876): wymaga >2 miast po obu stronach ORAZ
/// `ownersShareLandBorderLive` (main.ts:5690 -> `owners_have_shared_land_border`). Gdy ktoras strona ma
/// <=2 miasta, wynik jest `false` bez liczenia granicy (pierwszy czlon `&&`).
pub fn shared_border_pairs(state: &PlayableState) -> Result<BTreeSet<PairKey>, WarInputsError> {
    let count = |id: i64| {
        state
            .cities
            .iter()
            .filter(|c| c.owner_id.get() as i64 == id)
            .count()
    };
    let ids: Vec<i64> = all_owner_ids(state).into_iter().collect();
    let mut out = BTreeSet::new();
    let mut lazy: Option<(Vec<TerritoryNode>, TradeMap)> = None;
    for (i, &a) in ids.iter().enumerate() {
        for &b in &ids[i + 1..] {
            if count(a) > 2 && count(b) > 2 {
                let (nodes, map) = lazy.get_or_insert_with(|| {
                    (
                        territory_nodes_from_state(state),
                        trade_map_from_state(&state.map),
                    )
                });
                let (pa, pb) = (super::PlayerId::new(a as _), super::PlayerId::new(b as _));
                if owners_have_shared_land_border(pa, pb, nodes, map) {
                    out.insert(pair_key(a, b));
                }
            }
        }
    }
    Ok(out)
}

/// Producent wejsc krokow D1-D7 (K7, `turn_war_dipl_steps`) z `PlayableState`.
/// - skarbiec: tylko gracz-czlowiek (`economy.treasury`); AI nie ma skarbca w stanie => brak wpisu (blad
///   `WarTurnError::DiplStep`, gdy krok faktycznie go potrzebuje, np. danina z AI),
/// - pula Pracy: brak producenta (stan jej nie niesie) => brak wpisow (jak wyzej),
/// - zapasy miast: `economy.city_stock` (brak wpisu miasta = puste `surowce`, jak web `c.surowce ?? {}`),
/// - stolica: miasto z `is_capital` (pierwsze w kolejnosci stanu),
/// - moc armii (web `sumArmyMForOwner`): ten sam producent co skladnik `jednostki` mocy obiektywnej.
pub fn dipl_steps_inputs(state: &PlayableState) -> Result<DiplStepsInputs, WarInputsError> {
    let mut out = DiplStepsInputs::default();
    if let Some(human) = state.players.iter().find(|p| p.is_human) {
        out.treasury
            .insert(human.id.get() as i64, state.economy.treasury);
    }
    out.cities = Some(
        state
            .cities
            .iter()
            .map(|c| {
                let mut r = CityResourceState::new(c.id.get().to_string(), c.owner_id);
                if let Some(stock) = state.economy.city_stock.get(&c.id.get()) {
                    r.resources = stock.clone();
                }
                r
            })
            .collect(),
    );
    for c in state.cities.iter().filter(|c| c.is_capital) {
        out.capital_city
            .entry(c.owner_id.get() as i64)
            .or_insert_with(|| c.id.get().to_string());
    }
    let def = warrior_def()?;
    let units: Vec<ArmyUnit> = state
        .units
        .iter()
        .filter(|u| matches!(u.kind, PlayableUnitKind::Warrior))
        .map(|u| ArmyUnit {
            owner_id: u.owner_id.get() as i64,
            is_settler: false,
            def: def.clone(),
        })
        .collect();
    let settlers = count_settlers();
    for id in all_owner_ids(state) {
        out.army_m.insert(id, armia_for_owner(&units, id, settlers));
    }
    Ok(out)
}

/// Pelne wejscia fazy Diplomacy; epoki z `epochs_from_state` (dzis zawsze blad dla AI z miastami).
pub fn build_war_inputs(
    state: &PlayableState,
    war: &WarTurnState,
) -> Result<WarTurnInputs, WarInputsError> {
    if !has_ai_city(state) {
        // brak par: wejsc hamulca nie trzeba; wejscia krokow D1-D7 (K7) sa zawsze produkowane.
        let mut inputs = WarTurnInputs::from_playable(state, war);
        inputs.dipl = dipl_steps_inputs(state)?;
        return Ok(inputs);
    }
    // Blokady pokoju najpierw: zepsute dane maja swoj wlasny blad, nie maskowany brakiem epok.
    peace_locks_from_war(war)?;
    build_war_inputs_with_epochs(state, war, &epochs_from_state(state)?)
}

fn has_ai_city(state: &PlayableState) -> bool {
    state.cities.iter().any(|c| {
        state
            .players
            .iter()
            .any(|p| p.id == c.owner_id && !p.is_human)
    })
}

/// Cialo produkcyjne `build_war_inputs` z wstrzyknietym zrodlem epok (przyszly producent albo wektor z pinu).
/// Epoka musi byc podana dla KAZDEGO wlasciciela, inaczej `OwnerEpochUnavailable`.
pub fn build_war_inputs_with_epochs(
    state: &PlayableState,
    war: &WarTurnState,
    epochs: &BTreeMap<i64, f64>,
) -> Result<WarTurnInputs, WarInputsError> {
    let mut inputs = WarTurnInputs::from_playable(state, war);
    inputs.dipl = dipl_steps_inputs(state)?;
    if !has_ai_city(state) {
        return Ok(inputs);
    }
    if inputs.human_ids.is_empty() {
        return Err(WarInputsError::NoHumanPlayer);
    }
    for id in all_owner_ids(state) {
        let epoch = *epochs
            .get(&id)
            .ok_or(WarInputsError::OwnerEpochUnavailable(id))?;
        inputs.epochs.insert(id, epoch);
        inputs
            .power_raw
            .insert(id, power_raw_for_owner(state, id, epoch)?);
    }
    inputs.shared_border = shared_border_pairs(state)?;
    inputs.peace_locks = Some(peace_locks_from_war(war)?);
    Ok(inputs)
}
