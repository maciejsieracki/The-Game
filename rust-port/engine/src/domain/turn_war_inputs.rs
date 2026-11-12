//! P6-WIRE-WAR-PIPELINE (W8 r4): producenci wejsc fazy Diplomacy z `PlayableState` + `WarTurnState`.
//!
//! r5: BEZ podstawiania epoki startu i BEZ cichych zer. `advance_turn` z AI posiadajacym miasta
//! konczy sie jawnym `WarTurnError` (`OwnerEpochUnavailable`, `Missing`) do czasu producentow
//! epok per wlasciciel i wspolnej granicy (lista blokerow: runs/.../01-operator-r5.md).
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
//! r5: `PlayableState` NIE symuluje fazy Economy ani badan. Nie ma populacji miast, kultury,
//! budynkow, tech, religii, ulepszen, walk ani epoki per wlasciciel. Producenci NIE podstawiaja
//! stalych zalozenia: skladniki zalezne od tych danych sa `Missing`, epoka wlasciciela jest bledem
//! (`WarInputsError::OwnerEpochUnavailable`), wspolna granica pary z >2 miastami po obu stronach
//! jest bledem (`SharedBorderUnavailable`). Produkcyjny `advance_turn` z AI posiadajacym miasta
//! zwraca wiec jawny blad do czasu powstania producentow z `KNOWN_GAPS` (lista dla r6).
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
use super::brake_power_army::{armia_for_owner, ArmyUnit, ArmyUnitDef};
use super::brake_power_producers::{apply_produced, produce_for_owner, ProducerInputs};
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
/// Wejscie-zaslepka producenta `miasta` (`produce_for_owner` wymaga populacji i kultury, ktorych
/// `PlayableCity` nie ma). Wyniki zalezne od nich (`suma_ludkow`, `rekrut_ekw`, `kultura_imperium`)
/// sa ZAWSZE nadpisywane `Component::Missing` - te stale nie wchodza do mocy (r5, NAPRAW 4).
pub const FOUNDING_POPULATION: f64 = 1.0;
/// Zaslepka kultury (patrz `FOUNDING_POPULATION`); nie wchodzi do mocy.
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

/// Skladniki mocy bez producenta w `PlayableState` (klucze web `breakdown.key`); produkcyjne wejscia
/// ustawiaja je na `Component::Missing` (test egzekwuje zgodnosc z `run_war_turn`).
pub const UNPRODUCED_POWER_COMPONENTS: [&str; 7] = [
    "ludki",
    "rekruci",
    "terytorium",
    "infra",
    "tech",
    "kultura",
    "religia",
];

/// Znane luki producentow (NIE_ZMIERZONO wzgledem web) = lista producentow potrzebnych w r6.
pub const KNOWN_GAPS: [&str; 5] = [
    "epoka wlasciciela: brak badan/era per owner w PlayableState (web empireEpochForOwner main.ts:2419)",
    "wspolna granica: pary z >2 miastami po obu stronach wymagaja ownersShareLandBorderLive (main.ts:5690)",
    "populacja i kultura miast: PlayableCity bez pol => ludki, rekruci, terytorium, kultura = Missing",
    "budynki (infra), tech zbadane, religia panstwowa: brak magazynow => infra, tech, religia = Missing",
    "TickContext: handel, religia, dobra wola, wiarygodnosc = domyslne (PlayableState ich nie niesie)",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WarInputsError {
    /// `params.epoch_id` poza `numer_epoki` (player-state-params.json).
    UnknownStartEpoch(String),
    /// `PlayableState` nie niesie epoki per wlasciciel (brak badan); NIE podstawiamy epoki startu.
    OwnerEpochUnavailable(i64),
    /// Para ma >2 miasta po obu stronach: web wymaga `ownersShareLandBorderLive` (brak producenta).
    SharedBorderUnavailable(i64, i64),
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
            Self::SharedBorderUnavailable(a, b) => write!(
                f,
                "war inputs: para {a}-{b} ma >2 miasta po obu stronach, brak producenta wspolnej granicy"
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

/// `ObjectivePowerRaw` jednego wlasciciela: producenci z `PlayableState`, reszta jawne zero (patrz naglowek).
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
    // r5 (NAPRAW 4): wyniki zalezne od populacji/kultury, ktorych PlayableState nie niesie, to NIE moc
    // (stale zalozenia zafalszowalyby wartosc) - jawnie Missing (blad STRICT), nie Provided(stala).
    raw.suma_ludkow = Component::Missing; // ludnosc
    raw.rekrut_ekw = Component::Missing; // rekruci (manpower z populacji)
    raw.kultura_imperium = Component::Missing; // kultura
    raw.heksy_terytorium = Component::Missing; // promien terytorium zalezy od populacji miasta
                                               // infra / tech / religia: brak magazynow w PlayableState => brak producenta (nie Provided(0)).
    raw.budynki = Component::Missing;
    raw.tech_zbadane = Component::Missing;
    raw.miasta_jednosc_religii = Component::Missing;

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

/// Epoki wlascicieli z `PlayableState`: producent NIE istnieje (brak badan/era per owner), wiec dla
/// AI z miastami zawsze blad. Epoka startu (`params.epoch_id`) NIE jest epoka wlasciciela: web
/// `empireEpochForOwner` (main.ts:2419) czyta bierzaca epoke (`playerStateByHuman.era`/`ownerEraByOwner`).
pub fn epochs_from_state(state: &PlayableState) -> Result<BTreeMap<i64, f64>, WarInputsError> {
    match all_owner_ids(state).into_iter().next() {
        Some(id) => Err(WarInputsError::OwnerEpochUnavailable(id)),
        None => Ok(BTreeMap::new()),
    }
}

/// Wspolna granica pary (web `karaWspolnaGranica`, main.ts:22876): wymaga >2 miast po obu stronach ORAZ
/// `ownersShareLandBorderLive`. Producent granicy nie istnieje: gdy ktoras strona ma <=2 miasta,
/// wynik jest strukturalnie `false` (pierwszy czlon `&&`); w przeciwnym razie blad.
pub fn shared_border_pairs(state: &PlayableState) -> Result<BTreeSet<PairKey>, WarInputsError> {
    let count = |id: i64| {
        state
            .cities
            .iter()
            .filter(|c| c.owner_id.get() as i64 == id)
            .count()
    };
    let ids: Vec<i64> = all_owner_ids(state).into_iter().collect();
    for (i, &a) in ids.iter().enumerate() {
        for &b in &ids[i + 1..] {
            if count(a) > 2 && count(b) > 2 {
                return Err(WarInputsError::SharedBorderUnavailable(a, b));
            }
        }
    }
    Ok(BTreeSet::new())
}

/// Pelne wejscia fazy Diplomacy; epoki z `epochs_from_state` (dzis zawsze blad dla AI z miastami).
pub fn build_war_inputs(
    state: &PlayableState,
    war: &WarTurnState,
) -> Result<WarTurnInputs, WarInputsError> {
    if !has_ai_city(state) {
        return Ok(WarTurnInputs::from_playable(state, war)); // brak par: wejsc nie trzeba
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
