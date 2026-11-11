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

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::{Map, Value};

use super::war_forced_pairing::{
    restore_forced_war_state, serialize_forced_war_state, ForcedWarPairState, ForcedWarSavePartial,
    ForcedWarSaveState,
};

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
pub const DIPLOMACY_RAW_META_KEYS: [&str; 24] = [
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
}

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
    keys
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

fn turn_map_to(entries: &[(i64, f64)]) -> Value {
    Value::Array(
        entries
            .iter()
            .map(|(k, v)| Value::Array(vec![num(*k as f64), num(*v)]))
            .collect(),
    )
}

// ZALOZENIE: `WarTurnState` zawiera `f64` tylko z JSON (skonczone), wiec `Eq` jest bezpieczne
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
        out
    }
}
