//! P6-WIRE-WAR-PIPELINE (W8 r4): producenci wejsc fazy Diplomacy z `PlayableState` + `WarTurnState`.
//!
//! Zamyka luki r3, przez ktore `advance_turn` z AI posiadajacym miasta konczylo sie `WarTurnError`:
//! epoki wlascicieli, wejscia mocy (`ObjectivePowerRaw`), blokady pokoju, parametry par hamulca
//! (`diploBrakeWarParams`) i flaga multiwar. Zrodla (pin 07d2fbd72, tylko odczyt):
//! - `diploBrakeWarParams` main.ts:11567 (wyzsza z dwoch `progWojnyRelacji`, N = `hamulecN` tej strony;
//!   gracz = brak wiersza macierzy = wartosci bazowe) -> `diplomacy_war_peace_profile`,
//! - `WAR_RULES_MULTIWAR_ENABLED = true` war-rules-multiwar.ts:50,
//! - `forcedEraPeaceUntilNextEraByPairKey` / `diplomacyPairMeta` (main.ts:37336, :37431) z surowego `opaque`.
//!
//! Zasada: BRAK CICHYCH ZER. Kazdy skladnik mocy jest `Provided` (producent z danych stanu) albo
//! `ExplicitZero` z uzasadnieniem plik:linia pinu (`EXPLICIT_ZERO_REASONS`). Pole, ktorego stan
//! nie niesie, a ktore nie jest faktem strukturalnym, jest bledem (`WarInputsError`), nie zerem.
//!
//! `PlayableState` NIE symuluje jeszcze fazy Economy: miasta sa w stanie zalozenia (populacja
//! `FOUNDING_POPULATION`, kultura `FOUNDING_CULTURE`, brak budynkow/badan/ulepszen/religii/walk).
//! Gdy magazyny te powstana, producenci tego modulu MUSZA czytac je zamiast stalych (`KNOWN_GAPS`).
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
use super::diplomacy_truce::PairMetaWeb;
use super::diplomacy_war_peace_profile::{
    brake_relation_threshold, resolve_war_peace_profile, war_peace_params,
};
use super::order_effects_culture::PressureCity;
use super::playable::{PlayableState, PlayableUnitKind};
use super::recruitment::manpower::{civ_manpower_max_mult, civ_manpower_mults, ManpowerCity};
use super::territory::ReligionState;
use super::turn_war_pipeline::{PeaceLockFacts, WarTurnConfig, WarTurnInputs};
use super::war_turn_state::WarTurnState;

/// Web `WAR_RULES_MULTIWAR_ENABLED` (war-rules-multiwar.ts:50, pin 07d2fbd72) = `true`.
pub const WAR_RULES_MULTIWAR_ENABLED: bool = true;
/// Id gracza-czlowieka w `PlayableState` (`HUMAN_PLAYER_ID`); web = 0.
pub const HUMAN_OWNER_ID: i64 = 1;
/// Populacja miasta w stanie zalozenia (`AiCity::new`, `ai_turn.rs`): `PlayableCity` nie ma populacji.
pub const FOUNDING_POPULATION: f64 = 1.0;
/// Kultura skumulowana miasta w stanie zalozenia: `PlayableCity` nie ma pola kultury.
pub const FOUNDING_CULTURE: f64 = 0.0;
/// Klucze `opaque` (web `meta`): blokady pokoju epoki i meta par (pary `[klucz, wartosc]`).
pub const KEY_PAIR_META: &str = "diplomacyPairMeta";
pub use super::war_turn_declare::KEY_ERA_PEACE_LOCK;

/// Skladniki mocy z jawnym zerem: powod z odwolaniem plik:linia pinu (kontrolowane testem).
pub const EXPLICIT_ZERO_REASONS: [(&str, &str); 3] = [
    (
        "bitwy",
        "web battlePowerPtsByOwner (main.ts:2254) startuje pusty, zapis dopiero po wygranej bitwie (main.ts:34490); PlayableState nie zapisuje walk",
    ),
    (
        "ulepszenia",
        "web countImprovementsForOwner (main.ts:2643) liczy ulepszenia heksow; PlayableState nie ma ulepszen terenu",
    ),
    (
        "zdobycze",
        "web zdobyczePowerByOwner (main.ts:35673) zasilane eliminacja wlasciciela; PlayableState nie ma eliminacji ani zdobyczy",
    ),
];

/// Znane luki producentow (NIE_ZMIERZONO wzgledem web); lista jawna, nie ciche domysly.
pub const KNOWN_GAPS: [&str; 4] = [
    "commonBorder: brak producenta wspolnej granicy (shared_border puste => tick bez kary granicznej)",
    "epoka wlasciciela = epoka startu gry (PlayableState nie ma badan => empireEpochForOwner nie rosnie)",
    "TickContext: handel, religia, dobra wola, wiarygodnosc = domyslne (PlayableState ich nie niesie)",
    "populacja/kultura miast = stan zalozenia (FOUNDING_POPULATION/FOUNDING_CULTURE), bez Economy",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WarInputsError {
    /// `params.epoch_id` poza `numer_epoki` (player-state-params.json).
    UnknownStartEpoch(String),
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

/// `ObjectivePowerRaw` jednego wlasciciela: producenci z `PlayableState`, reszta jawne zero (patrz naglowek).
pub fn power_raw_for_owner(
    state: &PlayableState,
    owner_id: i64,
    epoka: f64,
    is_human: bool,
) -> Result<ObjectivePowerRaw, WarInputsError> {
    let manpower: Vec<ManpowerCity> = state
        .cities
        .iter()
        .map(|c| {
            let mut m = ManpowerCity::new(
                c.id.get().to_string(),
                c.owner_id.get() as i64,
                FOUNDING_POPULATION,
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
            kultura_skumulowana: FOUNDING_CULTURE,
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
    apply_produced(&mut raw, &produced);

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

    // terytorium: unia dyskow promieni miast; heks istnieje, gdy lezy na mapie (q = x, r = y).
    let tcities: Vec<TerritoryCityInput> = state
        .cities
        .iter()
        .map(|c| TerritoryCityInput {
            q: i32::from(c.position.x()),
            r: i32::from(c.position.y()),
            population: FOUNDING_POPULATION,
            owner_id: c.owner_id.get() as i64,
        })
        .collect();
    let map = &state.map;
    let exists = |q: i32, r: i32| {
        u16::try_from(q)
            .ok()
            .zip(u16::try_from(r).ok())
            .is_some_and(|(x, y)| map.contains(super::PositionDto::new(x, y)))
    };
    raw.heksy_terytorium =
        Component::Provided(terytorium_for_owner(&tcities, &[], owner_id, &exists));

    // infra / tech / religia: producenci POWER-REST na (pustych) magazynach stanu.
    let cities_ids: Vec<(u64, i64)> = state
        .cities
        .iter()
        .map(|c| (c.id.get(), c.owner_id.get() as i64))
        .collect();
    let built: [(u64, usize); 0] = [];
    raw.budynki =
        Component::Provided(count_buildings_for_owner(&built, &cities_ids, owner_id) as f64);
    raw.tech_zbadane = Component::Provided(count_tech_for_owner(is_human, 0, None) as f64);
    let rel_cities: Vec<ReligionCity<'_>> = state
        .cities
        .iter()
        .map(|c| ReligionCity {
            owner_id: c.owner_id.get() as i64,
            religion_state: None,
        })
        .collect();
    // Brak religii panstwowej => 0 przed uzyciem progu dominacji (prog nieuzywany w tej galezi).
    raw.miasta_jednosc_religii = Component::Provided(count_cities_with_dominant_state_religion(
        &rel_cities,
        owner_id,
        None,
        0.0,
    ));

    // Jawne zera z uzasadnieniem (EXPLICIT_ZERO_REASONS): bitwy (oba modele), ulepszenia, zdobycze.
    raw.wygrane_bitwy = Component::ExplicitZero;
    raw.bitwy_pkt_sum = Component::ExplicitZero;
    raw.ulepszenia_terenu = Component::ExplicitZero;
    raw.zdobycze_power = Component::ExplicitZero;
    Ok(raw)
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
pub fn pair_params_for(state: &PlayableState) -> BTreeMap<PairKey, PairWarParams> {
    let wp = war_peace_params();
    let me = state
        .players
        .iter()
        .find(|p| p.is_human)
        .map(|p| p.id.get() as i64);
    let civ = |id: i64| {
        let key = state
            .players
            .iter()
            .find(|p| p.id.get() as i64 == id)
            .map(|p| p.civilization.as_str());
        // Web: `isMe(o) ? undefined : civKeyForOwnerId(o)`.
        if Some(id) == me {
            None
        } else {
            key
        }
    };
    let ids: Vec<i64> = all_owner_ids(state).into_iter().collect();
    let mut out = BTreeMap::new();
    for (i, &a) in ids.iter().enumerate() {
        for &b in &ids[i + 1..] {
            let pa = resolve_war_peace_profile(civ(a), wp);
            let pb = resolve_war_peace_profile(civ(b), wp);
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
    out
}

/// Konfiguracja produkcyjna fazy: pary z danych Rust, multiwar jak pin.
pub fn production_config(state: &PlayableState) -> WarTurnConfig {
    WarTurnConfig::new(pair_params_for(state), WAR_RULES_MULTIWAR_ENABLED)
}

/// Pelne wejscia fazy Diplomacy z `PlayableState` + `WarTurnState` (epoki, moc, blokady).
pub fn build_war_inputs(
    state: &PlayableState,
    war: &WarTurnState,
) -> Result<WarTurnInputs, WarInputsError> {
    let mut inputs = WarTurnInputs::from_playable(state, war);
    let has_ai_city = state.cities.iter().any(|c| {
        state
            .players
            .iter()
            .any(|p| p.id == c.owner_id && !p.is_human)
    });
    if !has_ai_city {
        return Ok(inputs); // brak AI z miastami: faza bez par, wejsc nie trzeba
    }
    if inputs.human_ids.is_empty() {
        return Err(WarInputsError::NoHumanPlayer);
    }
    let epoch = start_epoch_number(&state.params.epoch_id)?;
    for id in all_owner_ids(state) {
        let is_human = inputs.human_ids.contains(&id);
        inputs.epochs.insert(id, epoch);
        inputs
            .power_raw
            .insert(id, power_raw_for_owner(state, id, epoch, is_human)?);
    }
    inputs.peace_locks = Some(peace_locks_from_war(war)?);
    Ok(inputs)
}
