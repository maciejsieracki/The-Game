//! P6-WIRE-WAR-STATE (W1): agregat stanu wojny tury, czesc `meta` zapisu (web `buildSaveGameSnapshot`,
//! `gra/src/main.ts` pin `origin/main` 638e90bea: literal `meta` = `main.ts:36874-36918`,
//! pola wojenne i dyplomacji = `main.ts:37020-37051`; odczyt `saved.meta?.x` przy wczytaniu).
//! Serializatory tablic: `forced-war-common.ts:155-159`, `forced-war-waves.ts:237-245`,
//! `ai-general-war-campaign.ts:156-170`.
//!
//! Zakres partii W1 (sekcja 6 planu `P6-WIRE-WAR-TURN-PLAN.md`, r3):
//! - trzy zestawy wymuszonych wojen epokowych (kamien / braz / zelazo): `pendingOwners`,
//!   `cycleOwners`, `restUntilByOwner`, `activeByPairKey` (typ `ForcedWarSaveState`, serializacja
//!   `restore_/serialize_forced_war_state` z `war_forced_pairing`),
//! - `bronzeEraEnterTurnByOwner` i `ironEraEnterTurnByOwner` (mapa wlasciciel -> tura),
//! - pola bez typu Rust w tej partii sa przechowywane jako surowy JSON (`opaque`) i zapisywane
//!   bez zmian: round-trip zachowuje to, co web zapisal. Obejmuje: pola wojenne
//!   (`regularWarCapturedByPairKey`, `aiAiPeaceRequestByPairKey`, `warWearinessByPairKey`,
//!   `forcedEraPeaceUntilNextEraByPairKey`, `forcedWarWavesByPairKey`, `aiGeneralWarCampaignByOwner`,
//!   `warRulesForcedEraDeclared`, `aggressorFlagUntilByOwner`, `casusBelliUntilByPair`),
//!   stan oblezenia (`siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey`) oraz pola
//!   dyplomacji z meta (lista `DIPLOMACY_RAW_META_KEYS`).
//!
//! Wpiecie D1=B: pole `war` w `GameStateDto` i `PlayableState` (`#[serde(default)]`, pomijane gdy puste);
//! `SaveSnapshot` migruje klucze web z `meta` do `state.war` przy wczytaniu.
//! NIE w tej partii (kolejne partie): typowany model oblezenia i dyplomacji. Wpiecie do `SaveMeta` jest w `save_load.rs`
//! (pole `extra`, flatten) i zapisuje/odczytuje te klucze przez `WarTurnState`.
//!
//! Zalozenia (ZALOZENIE, do akceptacji):
//! - pola `#[serde(default)]`-owe: brak klucza => pusty stan dla pola (stary zapis wczytuje sie bez zmian),
//! - zly typ CALEGO pola => pusty stan dla pola (web: `saved?.x ?? []`), nie blad calego bloku,
//! - zly ELEMENT wewnatrz tablicy jest pomijany (`filter_map`), reszta tablicy zostaje; web tego
//!   nie sprawdza jednoznacznie (NIE_ZMIERZONO), przyjete jako zalozenie i pokryte testem,
//! - liczby calkowite zapisywane jako JSON integer (jak `JSON.stringify` w webie).

use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::{Map, Value};

use super::ai_diplomacy_turn::BrakePhaseState;
use super::brake_power_rest::{
    barbarian_captured_power_gain, battle_power_points_from_defeated_enemy,
};
use super::diplomacy::DiplomacyState;
use super::diplomacy_ai_forced_peace::{
    register_ai_peace_request, AiPeaceKind, AiPeaceRequestStore,
};
use super::diplomacy_multiwar_peace::{WarWearinessPairState, WarWearinessStore};
use super::war_forced_pairing::{
    restore_forced_war_state, serialize_forced_war_state, ForcedWarPairState, ForcedWarSavePartial,
    ForcedWarSaveState,
};

/// P6-WIRE-WAR-STATE-OWNER: klucze Rust (nie web) dla typowanych magazynow dyplomacji i wojny.
/// Zapisywane tylko gdy magazyn jest niepusty (stary zapis bez nich wczytuje sie jako pusty).
pub const RUST_DIPLOMACY_KEY: &str = "rustDiplomacyState";
pub const RUST_BRAKE_PHASE_KEY: &str = "rustBrakePhaseState";
pub const RUST_AI_PEACE_KEY: &str = "rustAiPeaceRequestStore";
pub const RUST_WAR_WEARINESS_KEY: &str = "rustWarWearinessStore";

/// Wszystkie klucze Rust magazynow wlasciciela stanu wojny.
pub const RUST_OWNER_META_KEYS: [&str; 4] = [
    RUST_DIPLOMACY_KEY,
    RUST_BRAKE_PHASE_KEY,
    RUST_AI_PEACE_KEY,
    RUST_WAR_WEARINESS_KEY,
];

/// Klucze `meta` wojny, ktore przechodza przez typowany stan (web: nazwy z `main.ts:36881–36911`).
const ERA_PREFIXES: [&str; 3] = ["stone", "bronze", "iron"];

/// Klucze `meta` bez typu Rust w tej partii; wartosc zachowywana jako surowy JSON.
/// Web: `main.ts:37020-37051` (pola wojenne), `main.ts:36912-36914` (oblezenie).
pub const OPAQUE_WAR_META_KEYS: [&str; 9] = [
    "regularWarCapturedByPairKey",
    "aiAiPeaceRequestByPairKey",
    "warWearinessByPairKey",
    "forcedEraPeaceUntilNextEraByPairKey",
    "forcedWarWavesByPairKey",
    "aiGeneralWarCampaignByOwner",
    "warRulesForcedEraDeclared",
    "aggressorFlagUntilByOwner",
    "casusBelliUntilByPair",
];

/// Oblezenie (web `main.ts:36912-36914`): surowe, bez typu w tej partii.
pub const SIEGE_RAW_META_KEYS: [&str; 3] = [
    "siegeTurnByCity",
    "siegeBesiegerByCity",
    "siegeAiStateByKey",
];

/// Dyplomacja w `meta` (web `main.ts:36919-37051`, nazwy zweryfikowane grepem): surowe,
/// bez typu w tej partii (tabela 4 planu typuje je w kolejnej partii).
pub const DIPLOMACY_RAW_META_KEYS: [&str; 25] = [
    "pendingDiplomacyInbox",
    "allianceWarCallHistory",
    "interHumanDiplomacyInbox",
    "diplomaticContactEstablished",
    "diplomaticallyDiscoveredOwners",
    "diplomaticDiscoveryPopupShown",
    "diplomacyDeals",
    "negotiationTable",
    "dealsEndTurnGate",
    "rejectedOfferCooldowns",
    "diplomacyPairMeta",
    "diplomacyCrisisCounters",
    "diplomacyTradeStreak",
    "diplomacyFactorLog",
    "wiarygodnoscZdarzeniaByOwner",
    "wiarygodnoscStrumienByOwner",
    "wiarygodnoscOstatniaWojnaTuraByOwner",
    "wiarygodnoscP4MilestonesByOwner",
    "aiOneShotGiftLastTurn",
    "aiTradeAgreementLastProposalTurn",
    "aiMarchPassageRequestTurn",
    "aiAiTradeAgreementLastTurn",
    "aiResourceTradeLastProposalTurn",
    "aiAudienceLastRequestTurn",
    "aiTargetMemoryByOwner",
];

/// Stan wojny tury (wycinek W1).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct WarTurnState {
    /// Indeks 0 = stone, 1 = bronze, 2 = iron (patrz `ERA_PREFIXES`).
    pub forced: [ForcedWarSaveState; 3],
    /// Web `bronzeEraEnterTurnByOwner` (kolejnosc wstawiania zachowana).
    pub bronze_era_enter_turn_by_owner: Vec<(i64, f64)>,
    /// Web `ironEraEnterTurnByOwner`.
    pub iron_era_enter_turn_by_owner: Vec<(i64, f64)>,
    /// Surowe wpisy pol wojennych bez typu (klucz web -> wartosc JSON).
    pub opaque: Map<String, Value>,
    /// Stan dyplomacji (relacje, transakcje); klucz `RUST_DIPLOMACY_KEY`.
    pub diplomacy: DiplomacyState,
    /// Faza hamulca wojny (liczniki kryzysu, pary w wojnie, dobra wola); klucz `RUST_BRAKE_PHASE_KEY`.
    pub brake_phase: BrakePhaseState,
    /// Prosby pokoju AI-AI (kolejnosc wstawiania zachowana); klucz `RUST_AI_PEACE_KEY`.
    pub ai_peace_requests: AiPeaceRequestStore,
    /// Zmeczenie wojna per para; klucz `RUST_WAR_WEARINESS_KEY`.
    pub war_weariness: WarWearinessStore,
    /// Web `battlePowerPtsByOwner` (main.ts:2254): akumulator punktow wygranych bitew per zwyciezca
    /// (klucz = wlasciciel w przestrzeni Rust, kolejnosc wstawiania = kolejnosc `Map` weba).
    /// Zapis w `meta` jako pary `[wlasciciel, pkt]`; brak klucza = pusta mapa (start weba: `new Map()`).
    pub battle_power_pts_by_owner: Vec<(i64, f64)>,
    /// Web `zdobyczePowerByOwner` (main.ts:2264): akumulator Power przejetego od pokonanych
    /// (klucz = zdobywca). Zapis w `meta` jako pary `[wlasciciel, pkt]`; brak klucza = pusta mapa.
    pub zdobycze_power_by_owner: Vec<(i64, f64)>,
}

/// Klucze `meta` akumulatorow mocy (web `battlePowerPtsByOwner`, `zdobyczePowerByOwner`); zarzadzane przez `WarTurnState`.
///
/// STAN WDROZENIA (nie-ukryty): producenci tych akumulatorow NIE sa jeszcze wolani z kodu bitwy, zdobywania
/// ani eliminacji (osobne tematy). Do tego czasu akumulatory w produkcji pozostaja puste, wklad mocy = 0.
pub const POWER_ACC_META_KEYS: [&str; 2] = ["battlePowerPtsByOwner", "zdobyczePowerByOwner"];

/// Wszystkie klucze `meta`, ktore modul zapisuje lub czyta (do usuniecia przed ponownym zapisem).
pub fn managed_meta_keys() -> Vec<String> {
    let mut keys: Vec<String> = WarTurnState::default()
        .to_meta_json()
        .keys()
        .cloned()
        .collect();
    keys.extend(
        OPAQUE_WAR_META_KEYS
            .iter()
            .chain(SIEGE_RAW_META_KEYS.iter())
            .chain(DIPLOMACY_RAW_META_KEYS.iter())
            .map(|k| k.to_string()),
    );
    keys.extend(RUST_OWNER_META_KEYS.iter().map(|k| k.to_string()));
    keys.extend(POWER_ACC_META_KEYS.iter().map(|k| k.to_string()));
    keys
}

const FORCED_WAR_WAVES_OPAQUE_KEY: &str = "forcedWarWavesByPairKey";
const REGULAR_WAR_CAPTURED_OPAQUE_KEY: &str = "regularWarCapturedByPairKey";
const DIPLOMACY_PAIR_META_OPAQUE_KEY: &str = "diplomacyPairMeta";
const DIPLOMACY_FACTOR_LOG_OPAQUE_KEY: &str = "diplomacyFactorLog";

/// Filtr wierszy `[klucz, wartosc]` tablicy surowego pola `opaque` (zapis Map weba: `Array.from(map.entries())`).
/// Wiersz nieczytelny jako para zostaje bez zmian; brak pola = no-op (pusta Map weba).
fn retain_opaque_rows(
    opaque: &mut Map<String, Value>,
    key: &str,
    mut keep: impl FnMut(&str, &Value) -> bool,
) {
    let Some(arr) = opaque.get_mut(key).and_then(Value::as_array_mut) else {
        return;
    };
    arr.retain(|row| {
        let Some(para) = row.as_array() else {
            return true;
        };
        let Some(klucz) = para.first().and_then(Value::as_str) else {
            return true;
        };
        keep(klucz, para.get(1).unwrap_or(&Value::Null))
    });
}

/// Web `diploPairKeyHasOwner` (main.ts:35242): klucz `a_b` z dokladnie dwoma czesciami, z ktorych jedna = wlasciciel.
/// `Number(...)` z JS vs `parse::<i64>()`: rozbieznosc tylko dla pustej czesci (`Number("") = 0`), a wlasciciel 0
/// jest pomijany przed wywolaniem, wiec wynik jest identyczny.
fn diplo_pair_key_has_owner(key: &str, owner_id: i64) -> bool {
    let czesci: Vec<&str> = key.split('_').collect();
    czesci.len() == 2
        && czesci
            .iter()
            .any(|c| c.parse::<i64>().ok() == Some(owner_id))
}

/// Liczba w formie JSON jak `JSON.stringify`: calkowite bez czesci ulamkowej.
fn num(v: f64) -> Value {
    if v.is_finite() && v.fract() == 0.0 && v.abs() < 9.0e15 {
        Value::from(v as i64)
    } else {
        Value::from(v)
    }
}

fn as_i64(v: &Value) -> Option<i64> {
    v.as_i64()
        .or_else(|| v.as_f64().filter(|f| f.fract() == 0.0).map(|f| f as i64))
}

fn as_f64(v: &Value) -> Option<f64> {
    v.as_f64()
}

/// Tablica pola `meta`; `None`, gdy pole brakuje albo nie jest tablica.
fn array_of<'a>(meta: &'a Map<String, Value>, key: &str) -> Option<&'a Vec<Value>> {
    meta.get(key).and_then(Value::as_array)
}

fn ids_of(meta: &Map<String, Value>, key: &str) -> Option<Vec<i64>> {
    array_of(meta, key).map(|a| a.iter().filter_map(as_i64).collect())
}

fn rest_until_of(meta: &Map<String, Value>, key: &str) -> Option<Vec<(i64, f64)>> {
    array_of(meta, key).map(|a| {
        a.iter()
            .filter_map(|e| {
                let pair = e.as_array()?;
                Some((as_i64(pair.first()?)?, as_f64(pair.get(1)?)?))
            })
            .collect()
    })
}

fn pair_state_from(v: &Value) -> Option<ForcedWarPairState> {
    let o = v.as_object()?;
    Some(ForcedWarPairState {
        attacker_id: as_i64(o.get("attackerId")?)?,
        target_id: as_i64(o.get("targetId")?)?,
        captured_by_attacker: o.get("capturedByAttacker").and_then(as_i64).unwrap_or(0),
        captured_by_defender: o.get("capturedByDefender").and_then(as_i64).unwrap_or(0),
        start_turn: o.get("startTurn").and_then(as_f64),
    })
}

fn pair_state_to(p: &ForcedWarPairState) -> Value {
    let mut o = Map::new();
    o.insert("attackerId".into(), num(p.attacker_id as f64));
    o.insert("targetId".into(), num(p.target_id as f64));
    o.insert(
        "capturedByAttacker".into(),
        num(p.captured_by_attacker as f64),
    );
    o.insert(
        "capturedByDefender".into(),
        num(p.captured_by_defender as f64),
    );
    if let Some(t) = p.start_turn {
        o.insert("startTurn".into(), num(t));
    }
    Value::Object(o)
}

fn forced_from_meta(meta: &Map<String, Value>, prefix: &str) -> ForcedWarSaveState {
    let partial = ForcedWarSavePartial {
        pending_owners: ids_of(meta, &format!("{prefix}ForceWarPendingOwners")),
        cycle_owners: ids_of(meta, &format!("{prefix}ForceWarCycleOwners")),
        rest_until_by_owner: rest_until_of(meta, &format!("{prefix}ForceWarRestUntilByOwner")),
        active_by_pair_key: array_of(meta, &format!("{prefix}ForceWarActiveByPairKey")).map(|a| {
            a.iter()
                .filter_map(|e| {
                    let pair = e.as_array()?;
                    let key = pair.first()?.as_str()?.to_string();
                    Some((key, pair_state_from(pair.get(1)?)?))
                })
                .collect()
        }),
    };
    restore_forced_war_state(Some(&partial))
}

fn forced_to_meta(state: &ForcedWarSaveState, prefix: &str, out: &mut Map<String, Value>) {
    let s = serialize_forced_war_state(state);
    out.insert(
        format!("{prefix}ForceWarPendingOwners"),
        Value::Array(s.pending_owners.iter().map(|x| num(*x as f64)).collect()),
    );
    out.insert(
        format!("{prefix}ForceWarCycleOwners"),
        Value::Array(s.cycle_owners.iter().map(|x| num(*x as f64)).collect()),
    );
    out.insert(
        format!("{prefix}ForceWarRestUntilByOwner"),
        Value::Array(
            s.rest_until_by_owner
                .iter()
                .map(|(k, v)| Value::Array(vec![num(*k as f64), num(*v)]))
                .collect(),
        ),
    );
    out.insert(
        format!("{prefix}ForceWarActiveByPairKey"),
        Value::Array(
            s.active_by_pair_key
                .iter()
                .map(|(k, v)| Value::Array(vec![Value::from(k.clone()), pair_state_to(v)]))
                .collect(),
        ),
    );
}

/// Tablica JSON; `&[]` gdy pole brakuje albo nie jest tablica.
fn slice_of(v: Option<&Value>) -> &[Value] {
    v.and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

/// Klucz pary `[a, b]` (ID graczy).
fn key_of(a: &[Value]) -> Option<(i64, i64)> {
    Some((as_i64(a.first()?)?, as_i64(a.get(1)?)?))
}

fn pair_of(e: &Value) -> Option<(i64, i64)> {
    key_of(e.as_array()?)
}

/// Trojka `[a, b, wartosc]`.
fn triple_of(e: &Value) -> Option<((i64, i64), f64)> {
    let a = e.as_array()?;
    Some((key_of(a)?, as_f64(a.get(2)?)?))
}

fn pair_json(a: i64, b: i64) -> Value {
    Value::Array(vec![num(a as f64), num(b as f64)])
}

fn brake_phase_to(b: &BrakePhaseState) -> Value {
    let mut o = Map::new();
    o.insert(
        "counters".into(),
        Value::Array(
            b.counters
                .iter()
                .map(|(&(x, y), &v)| Value::Array(vec![num(x as f64), num(y as f64), num(v)]))
                .collect(),
        ),
    );
    o.insert(
        "atWar".into(),
        Value::Array(b.at_war.iter().map(|&(x, y)| pair_json(x, y)).collect()),
    );
    o.insert(
        "dobraRemaining".into(),
        Value::Array(
            b.dobra_remaining
                .iter()
                .map(|(&(x, y), &v)| Value::Array(vec![num(x as f64), num(y as f64), num(v)]))
                .collect(),
        ),
    );
    Value::Object(o)
}

fn brake_phase_from(v: &Value) -> BrakePhaseState {
    let Some(o) = v.as_object() else {
        return BrakePhaseState::default();
    };
    BrakePhaseState {
        counters: slice_of(o.get("counters"))
            .iter()
            .filter_map(triple_of)
            .collect::<BTreeMap<_, _>>(),
        at_war: slice_of(o.get("atWar"))
            .iter()
            .filter_map(pair_of)
            .collect::<BTreeSet<_>>(),
        dobra_remaining: slice_of(o.get("dobraRemaining"))
            .iter()
            .filter_map(triple_of)
            .collect::<BTreeMap<_, _>>(),
    }
}

/// Web-like zapis `AiPeaceRequestStore`: lista `[klucz, {requesterId, otherId, sinceTurn, kind}]`.
fn ai_peace_to(store: &AiPeaceRequestStore) -> Value {
    Value::Array(
        store
            .entries()
            .iter()
            .map(|(k, r)| {
                let mut o = Map::new();
                o.insert("requesterId".into(), num(r.requester_id as f64));
                o.insert("otherId".into(), num(r.other_id as f64));
                o.insert("sinceTurn".into(), num(r.since_turn));
                o.insert("kind".into(), Value::from(r.kind.name()));
                Value::Array(vec![Value::from(k.clone()), Value::Object(o)])
            })
            .collect(),
    )
}

/// Odczyt `AiPeaceRequestStore` przez `register_ai_peace_request` (zachowuje kolejnosc, odrzuca duplikaty).
/// Zly element (brak pola, nieznany `kind`) jest pomijany.
fn ai_peace_from(v: &Value) -> AiPeaceRequestStore {
    let mut store = AiPeaceRequestStore::new();
    for e in slice_of(Some(v)) {
        let Some(a) = e.as_array() else { continue };
        let (Some(k), Some(o)) = (
            a.first().and_then(Value::as_str),
            a.get(1).and_then(Value::as_object),
        ) else {
            continue;
        };
        let kind = match o.get("kind").and_then(Value::as_str) {
            Some("pokoj") => AiPeaceKind::Pokoj,
            Some("rozejm") => AiPeaceKind::Rozejm,
            _ => continue,
        };
        let (Some(req), Some(other), Some(since)) = (
            o.get("requesterId").and_then(as_i64),
            o.get("otherId").and_then(as_i64),
            o.get("sinceTurn").and_then(as_f64),
        ) else {
            continue;
        };
        register_ai_peace_request(&mut store, k, req, other, since, kind);
    }
    store
}

/// Zapis `WarWearinessStore` jako lista `[klucz, {...}]` posortowana po kluczu (determinizm).
fn war_weariness_to(store: &WarWearinessStore) -> Value {
    let mut keys: Vec<&String> = store.keys().collect();
    keys.sort();
    Value::Array(
        keys.into_iter()
            .map(|k| {
                let s = &store[k];
                let mut o = Map::new();
                o.insert("warStart".into(), num(s.war_start));
                o.insert("peak".into(), num(s.peak));
                o.insert("stage".into(), num(s.stage as f64));
                o.insert("rejectedOffers".into(), num(s.rejected_offers as f64));
                o.insert("lastOfferTurn".into(), num(s.last_offer_turn));
                Value::Array(vec![Value::from(k.clone()), Value::Object(o)])
            })
            .collect(),
    )
}

/// Odczyt `WarWearinessStore`. Brakujace pola: 0, a `lastOfferTurn` -1 (web: brak oferty).
fn war_weariness_from(v: &Value) -> WarWearinessStore {
    let mut store = WarWearinessStore::new();
    for e in slice_of(Some(v)) {
        let Some(a) = e.as_array() else { continue };
        let (Some(k), Some(o)) = (
            a.first().and_then(Value::as_str),
            a.get(1).and_then(Value::as_object),
        ) else {
            continue;
        };
        store.insert(
            k.to_string(),
            WarWearinessPairState {
                war_start: o.get("warStart").and_then(as_f64).unwrap_or(0.0),
                peak: o.get("peak").and_then(as_f64).unwrap_or(0.0),
                stage: o.get("stage").and_then(as_i64).unwrap_or(0),
                rejected_offers: o.get("rejectedOffers").and_then(as_i64).unwrap_or(0),
                last_offer_turn: o.get("lastOfferTurn").and_then(as_f64).unwrap_or(-1.0),
            },
        );
    }
    store
}

fn turn_map_to(entries: &[(i64, f64)]) -> Value {
    Value::Array(
        entries
            .iter()
            .map(|(k, v)| Value::Array(vec![num(*k as f64), num(*v)]))
            .collect(),
    )
}

// ZALOZENIE: `WarTurnState` nie zawiera NaN, wiec zwrotnosc `==` zachodzi. Zrodla pol f64:
// JSON (bez NaN/Infinity), `record_battle_win` (pts = 0 dla niefinitycznego pola), `record_capture_power_gain`
// (przepuszcza tylko `gain > 0`, NaN odpada). `+Infinity` moze wejsc przez zdobycie z nieskonczona moca
// ofiary (jak w webie); `Infinity == Infinity` jest prawdziwe, wiec `Eq` pozostaje poprawne
// (potrzebne, bo `GameStateDto`/`PlayableState` derive `Eq`).
impl Eq for WarTurnState {}

impl Serialize for WarTurnState {
    /// Wlasny format zapisu (D4): ta sama mapa kluczy co web `meta` (`to_meta_json`).
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.to_meta_json().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for WarTurnState {
    /// Lenientny odczyt: obiekt => `from_meta_json`; zly typ calosci => stan pusty.
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let value = Value::deserialize(deserializer)?;
        Ok(match value {
            Value::Object(map) => WarTurnState::from_meta_json(&map),
            _ => WarTurnState::default(),
        })
    }
}

impl WarTurnState {
    /// True dla stanu domyslnego (pole pomijane przy zapisie => format sprzed W1).
    pub fn is_default(&self) -> bool {
        *self == WarTurnState::default()
    }

    /// Odczyt z bloku `meta` zapisu. Brak pola => pusty stan dla pola (zgodnie z `?? []` w webie).
    pub fn from_meta_json(meta: &Map<String, Value>) -> Self {
        let mut opaque = Map::new();
        for key in OPAQUE_WAR_META_KEYS
            .iter()
            .chain(SIEGE_RAW_META_KEYS.iter())
            .chain(DIPLOMACY_RAW_META_KEYS.iter())
        {
            if let Some(v) = meta.get(*key) {
                opaque.insert((*key).to_string(), v.clone());
            }
        }
        WarTurnState {
            forced: [
                forced_from_meta(meta, ERA_PREFIXES[0]),
                forced_from_meta(meta, ERA_PREFIXES[1]),
                forced_from_meta(meta, ERA_PREFIXES[2]),
            ],
            bronze_era_enter_turn_by_owner: rest_until_of(meta, "bronzeEraEnterTurnByOwner")
                .unwrap_or_default(),
            iron_era_enter_turn_by_owner: rest_until_of(meta, "ironEraEnterTurnByOwner")
                .unwrap_or_default(),
            opaque,
            diplomacy: meta
                .get(RUST_DIPLOMACY_KEY)
                .and_then(|v| serde_json::from_value(v.clone()).ok())
                .unwrap_or_default(),
            brake_phase: meta
                .get(RUST_BRAKE_PHASE_KEY)
                .map(brake_phase_from)
                .unwrap_or_default(),
            ai_peace_requests: meta
                .get(RUST_AI_PEACE_KEY)
                .map(ai_peace_from)
                .unwrap_or_default(),
            war_weariness: meta
                .get(RUST_WAR_WEARINESS_KEY)
                .map(war_weariness_from)
                .unwrap_or_default(),
            battle_power_pts_by_owner: power_acc_of(meta, "battlePowerPtsByOwner"),
            zdobycze_power_by_owner: power_acc_of(meta, "zdobyczePowerByOwner"),
        }
    }

    /// Zapis do bloku `meta` (klucze jak w webie). Pola typowane zawsze; surowe tylko gdy obecne.
    pub fn to_meta_json(&self) -> Map<String, Value> {
        let mut out = Map::new();
        for (i, prefix) in ERA_PREFIXES.iter().enumerate() {
            forced_to_meta(&self.forced[i], prefix, &mut out);
        }
        out.insert(
            "bronzeEraEnterTurnByOwner".into(),
            turn_map_to(&self.bronze_era_enter_turn_by_owner),
        );
        out.insert(
            "ironEraEnterTurnByOwner".into(),
            turn_map_to(&self.iron_era_enter_turn_by_owner),
        );
        for (k, v) in &self.opaque {
            out.insert(k.clone(), v.clone());
        }
        // Magazyny Rust: zapis tylko gdy niepuste (format sprzed zmiany pozostaje bez zmian).
        if self.diplomacy != DiplomacyState::default() {
            out.insert(
                RUST_DIPLOMACY_KEY.into(),
                serde_json::to_value(&self.diplomacy).unwrap_or(Value::Null),
            );
        }
        if self.brake_phase != BrakePhaseState::default() {
            out.insert(
                RUST_BRAKE_PHASE_KEY.into(),
                brake_phase_to(&self.brake_phase),
            );
        }
        if self.ai_peace_requests != AiPeaceRequestStore::default() {
            out.insert(
                RUST_AI_PEACE_KEY.into(),
                ai_peace_to(&self.ai_peace_requests),
            );
        }
        if !self.war_weariness.is_empty() {
            out.insert(
                RUST_WAR_WEARINESS_KEY.into(),
                war_weariness_to(&self.war_weariness),
            );
        }
        // Akumulatory mocy: zapis tylko gdy niepuste (stary zapis bez kluczy pozostaje bez zmian).
        if !self.battle_power_pts_by_owner.is_empty() {
            out.insert(
                "battlePowerPtsByOwner".into(),
                turn_map_to(&self.battle_power_pts_by_owner),
            );
        }
        if !self.zdobycze_power_by_owner.is_empty() {
            out.insert(
                "zdobyczePowerByOwner".into(),
                turn_map_to(&self.zdobycze_power_by_owner),
            );
        }
        out
    }

    /// Suma punktow wygranych bitew wlasciciela (web `battlePowerPtsByOwner.get(ownerId) ?? 0`, main.ts:2763).
    pub fn battle_power_pts_for(&self, owner_id: i64) -> f64 {
        acc_get(&self.battle_power_pts_by_owner, owner_id)
    }

    /// Suma zdobyczy Power wlasciciela (web `zdobyczePowerByOwner.get(ownerId) ?? 0`, main.ts:2779).
    pub fn zdobycze_power_for(&self, owner_id: i64) -> f64 {
        acc_get(&self.zdobycze_power_by_owner, owner_id)
    }

    /// Krok zdarzenia "wygrana bitwa" (web main.ts:34487-34490): `pts = battlePowerPointsFromDefeatedEnemy(
    /// sumRosterFieldM(przegrany))`, akumulator zwyciezcy += pts. Wolajacy podaje zwyciezce (gdy web
    /// `winOid !== undefined`) i sume pola przegranego (`enemy_field_m`, niefinityczna = 0 w kroku).
    /// Sama bitwa (walka, wybor zwyciezcy) NIE jest tu portowana - to osobny temat (wolajacy).
    pub fn record_battle_win(&mut self, winner_owner_id: i64, enemy_field_m: f64) {
        let pts = battle_power_points_from_defeated_enemy(enemy_field_m);
        acc_add(&mut self.battle_power_pts_by_owner, winner_owner_id, pts);
    }

    /// Krok zdarzenia "zdobycie stolicy / obozu barbarzyncow" (web main.ts:35669-35675):
    /// `gain = barbarianCapturedPowerGain(lostPower, barbCaptor)`; gdy `gain > 0`, akumulator zdobywcy += gain.
    /// `lost_power` = PELNA moc ofiary (`buildObjectivePowerForOwner(oldOwner).power`) - liczy ja wolajacy.
    pub fn record_capture_power_gain(
        &mut self,
        new_owner_id: i64,
        lost_power: f64,
        barb_captor: bool,
    ) {
        let gain = barbarian_captured_power_gain(lost_power, barb_captor);
        if gain > 0.0 {
            acc_add(&mut self.zdobycze_power_by_owner, new_owner_id, gain);
        }
    }

    /// Usuniecie akumulatorow wlasciciela po eliminacji (web main.ts:35399 `battlePowerPtsByOwner.delete`,
    /// main.ts:35410 `zdobyczePowerByOwner.delete`).
    pub fn clear_power_accumulators_for_owner(&mut self, owner_id: i64) {
        self.battle_power_pts_by_owner
            .retain(|(k, _)| *k != owner_id);
        self.zdobycze_power_by_owner.retain(|(k, _)| *k != owner_id);
    }

    /// Sprzatanie stanu wojny po eliminacji wlasciciela (web `eliminateOwner`, pin 07d2fbd72):
    /// - wymuszone wojny kazdej epoki (main.ts:35418-35441): `pendingOwners`, `cycleOwners`, `restUntilByOwner`,
    ///   aktywne pary (`activeByPairKey`, gdy wlasciciel jest atakujacym albo celem) wraz z falami
    ///   `forcedWarWavesByPairKey` o tym samym kluczu (web `forcedWarWavesByPairKey.delete(key)`);
    /// - tura wejscia w Braz i Zelazo tego wlasciciela (`bronzeEraEnterTurnByOwner`, `ironEraEnterTurnByOwner`);
    /// - licznik wojny zwyklej `regularWarCapturedByPairKey` (wpisy z `ownerA` albo `ownerB` = wlasciciel);
    /// - wpisy `diplomacyPairMeta` i `diplomacyFactorLog` z kluczem pary `a_b` zawierajacym wlasciciela
    ///   (web `diploPairKeyHasOwner`, main.ts:35242).
    ///
    /// Pola `opaque` (surowy JSON) sa filtrowane w miejscu, kolejnosc pozostalych wpisow zachowana.
    pub fn clear_eliminated_owner_war_state(&mut self, owner_id: i64) {
        let mut wave_keys: Vec<String> = Vec::new();
        for era in self.forced.iter_mut() {
            era.pending_owners.retain(|o| *o != owner_id);
            era.cycle_owners.retain(|o| *o != owner_id);
            era.rest_until_by_owner.retain(|(o, _)| *o != owner_id);
            era.active_by_pair_key.retain(|(key, st)| {
                let zwiazana = st.attacker_id == owner_id || st.target_id == owner_id;
                if zwiazana {
                    wave_keys.push(key.clone());
                }
                !zwiazana
            });
        }
        self.bronze_era_enter_turn_by_owner
            .retain(|(o, _)| *o != owner_id);
        self.iron_era_enter_turn_by_owner
            .retain(|(o, _)| *o != owner_id);

        retain_opaque_rows(&mut self.opaque, FORCED_WAR_WAVES_OPAQUE_KEY, |key, _| {
            !wave_keys.iter().any(|k| k == key)
        });
        retain_opaque_rows(&mut self.opaque, REGULAR_WAR_CAPTURED_OPAQUE_KEY, |_, v| {
            let ownera = v.get("ownerA").and_then(Value::as_i64);
            let ownerb = v.get("ownerB").and_then(Value::as_i64);
            ownera != Some(owner_id) && ownerb != Some(owner_id)
        });
        for klucz in [
            DIPLOMACY_PAIR_META_OPAQUE_KEY,
            DIPLOMACY_FACTOR_LOG_OPAQUE_KEY,
        ] {
            retain_opaque_rows(&mut self.opaque, klucz, |key, _| {
                !diplo_pair_key_has_owner(key, owner_id)
            });
        }
    }
}

/// Odczyt akumulatora z `meta` z semantyka webowej petli `for (k, n) of saved: map.set(k, n)`:
/// duplikat klucza nadpisuje wartosc (pozycja pierwszego wpisu zostaje). Para z polem nie-liczbowym
/// (`null` z `JSON.stringify(Infinity)`) jest pomijana, czyli wklad 0. Znany brzeg: duplikat, w ktorym
/// drugi wpis ma `null`, web zapisze jako `null`, a Rust zostawi poprzednia wartosc. Wejscie niemozliwe
/// z zapisu webowego (`Array.from(Map.entries())` daje unikalne klucze).
fn power_acc_of(meta: &Map<String, Value>, key: &str) -> Vec<(i64, f64)> {
    let mut out: Vec<(i64, f64)> = Vec::new();
    for (k, v) in rest_until_of(meta, key).unwrap_or_default() {
        if let Some(slot) = out.iter_mut().find(|(e, _)| *e == k) {
            slot.1 = v;
        } else {
            out.push((k, v));
        }
    }
    out
}

/// Odczyt akumulatora (brak wpisu = 0, jak `?? 0` w webie).
fn acc_get(entries: &[(i64, f64)], owner_id: i64) -> f64 {
    entries
        .iter()
        .find(|(k, _)| *k == owner_id)
        .map(|(_, v)| *v)
        .unwrap_or(0.0)
}

/// Dodanie do akumulatora (web `m.set(k, (m.get(k) ?? 0) + x)`): wpis w miejscu, nowy na koncu.
fn acc_add(entries: &mut Vec<(i64, f64)>, owner_id: i64, add: f64) {
    if let Some(slot) = entries.iter_mut().find(|(k, _)| *k == owner_id) {
        slot.1 += add;
    } else {
        entries.push((owner_id, add));
    }
}
