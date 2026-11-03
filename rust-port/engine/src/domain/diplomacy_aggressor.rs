//! R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1: port flagi agresora i casus belli z
//! `gra/src/game/diplomacy.ts:1785-1958` (pin `4bbef081d`), dane `gra/data/diplomacy-aggressor-params.json`.
//!
//! web diplomacy.ts: :1791 (`AggressorParams`), :1797 (`AGGRESSOR_PARAMS`), :1806 (`WarCause`),
//! :1809 (`czyDajeFlageAgresora`), :1817 (`WarCauseInput`), :1826 (`przyczynaWypowiedzenia`),
//! :1836 (`AggressorState`), :1839 (`ustawFlageAgresora`), :1855 (`czyAgresor`),
//! :1862 (`mnoznikWillingnessAlly`), :1870 (`deltaRelacjiSojusz`), :1875 (`CasusBelliState`),
//! :1877 (`casusBelliKey`), :1881 (`ustawCasusBelli`), :1897 (`maCasusBelli`),
//! :1904 (`serializujMape`), :1914 (`wczytajMape`), :1923-1930 (stan singletonu: `stanAgresorow`,
//! `stanCasusBelli`, `resetStanAgresora`), :1933 (`czyAgresorAktywny`), :1938 (`doTuryFlagiAgresora`),
//! :1944 (`maCasusBelliAktywne`), :1949 (`zarejestrujWypowiedzenie`), :1954 (`zarejestrujCasusBelli`).
//! Zapis (main.ts:33615-33616): `aggressorFlagUntilByOwner`, `casusBelliUntilByPair`;
//! odczyt (main.ts:42525-42526): `wczytajMape(saved.meta?.<pole>)`.
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - `number` = `f64` (NaN / Infinity zachowane). `ownerId`, `requester`, `target`, `turn` to `f64`, bo web
//!   sprawdza `Number.isFinite(ownerId)`; klucz mapy = `String(ownerId)` = `js_number_to_string`
//!   (calkowite bez przecinka, `-0` -> `"0"`, NaN -> `"NaN"`, wykladnik jak JS).
//! - `Record<string, number>` = `BTreeMap<String, f64>`. Kolejnosc kluczy nie jest czescia kontraktu
//!   (porownanie jak slownik). Funkcje czyste zwracaja NOWY stan (web: ten sam obiekt gdy bez zmian;
//!   tozsame pod wzgledem wartosci).
//! - Singleton modulu (`let stanAgresorow`) nie istnieje: `AggressorEngineState` jest wartoscia
//!   trzymana przez wywolujacego (jak override w `diplomacy_tick_war_brake.rs`).
//! - Flagi `?: boolean` w `WarCauseInput` = `bool` (`undefined` == `false` w kazdym uzyciu `if (input.x)`).
//! - `AGGRESSOR_PARAMS` ladowane z kopii JSON z pinu (`data/derived/diplomacy-aggressor-params.json`).

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::BTreeMap;
use std::sync::OnceLock;

const PARAMS_JSON: &str = include_str!("../../data/derived/diplomacy-aggressor-params.json");

/// Web: `AggressorParams` (:1790).
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct AggressorParams {
    #[serde(rename = "flagaAgresora")]
    pub flaga_agresora: FlagaAgresora,
    #[serde(rename = "wplywNaAI")]
    pub wplyw_na_ai: WplywNaAi,
    #[serde(rename = "casusBelli")]
    pub casus_belli: CasusBelliParams,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct FlagaAgresora {
    #[serde(rename = "trwaTur")]
    pub trwa_tur: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct WplywNaAi {
    #[serde(rename = "relacjaDeltaSojusz")]
    pub relacja_delta_sojusz: f64,
    #[serde(rename = "willingnessAllyMnoznik")]
    pub willingness_ally_mnoznik: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
pub struct CasusBelliParams {
    #[serde(rename = "trwaTur")]
    pub trwa_tur: f64,
}

/// Web: `AGGRESSOR_PARAMS` (:1796).
pub fn aggressor_params() -> &'static AggressorParams {
    static P: OnceLock<AggressorParams> = OnceLock::new();
    P.get_or_init(|| serde_json::from_str(PARAMS_JSON).expect("diplomacy-aggressor-params.json"))
}

/// Web: `WarCause` (:1807).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WarCause {
    #[serde(rename = "bez_powodu")]
    BezPowodu,
    #[serde(rename = "casus_belli")]
    CasusBelli,
    #[serde(rename = "wymuszona_epoka")]
    WymuszonaEpoka,
    #[serde(rename = "hamulec")]
    Hamulec,
    #[serde(rename = "wymuszona_inna")]
    WymuszonaInna,
}

/// Web: `czyDajeFlageAgresora` (:1810). Tylko `bez_powodu` nadaje flage.
pub fn czy_daje_flage_agresora(cause: WarCause) -> bool {
    cause == WarCause::BezPowodu
}

/// Web: `WarCauseInput` (:1818). Pola `?: boolean` = `bool` (brak = `false`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct WarCauseInput {
    pub hamulec: bool,
    pub wymuszona_epoka: bool,
    pub wymuszona_inna: bool,
    pub casus_belli_aktywny: bool,
    pub zlamanie_rozejmu: bool,
}

/// Web: `przyczynaWypowiedzenia` (:1827). Priorytet: hamulec > wymuszona epoka > wymuszona inna
/// > zlamanie rozejmu (-> bez powodu) > casus belli > bez powodu.
pub fn przyczyna_wypowiedzenia(input: &WarCauseInput) -> WarCause {
    if input.hamulec {
        return WarCause::Hamulec;
    }
    if input.wymuszona_epoka {
        return WarCause::WymuszonaEpoka;
    }
    if input.wymuszona_inna {
        return WarCause::WymuszonaInna;
    }
    if input.zlamanie_rozejmu {
        return WarCause::BezPowodu;
    }
    if input.casus_belli_aktywny {
        return WarCause::CasusBelli;
    }
    WarCause::BezPowodu
}

/// Web: `AggressorState` (:1836) i `CasusBelliState` (:1875): klucz -> tura konca (wylacznie).
pub type TurnMap = BTreeMap<String, f64>;

/// Odpowiednik `String(x)` z JS dla liczby (`Number.prototype.toString`, podstawa 10).
pub fn js_number_to_string(x: f64) -> String {
    if x.is_nan() {
        return "NaN".to_string();
    }
    if x.is_infinite() {
        return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    if x == 0.0 {
        return "0".to_string();
    }
    let a = x.abs();
    if (1e-6..1e21).contains(&a) {
        // `{}` dla f64 to najkrotsza reprezentacja round-trip, bez wykladnika (jak JS w tym zakresie).
        return format!("{x}");
    }
    // Poza zakresem JS uzywa notacji wykladniczej: "1e+21", "1.5e-7".
    let s = format!("{x:e}");
    match s.split_once('e') {
        Some((m, e)) if !e.starts_with('-') => format!("{m}e+{e}"),
        _ => s,
    }
}

/// Web: `ustawFlageAgresora` (:1839).
pub fn ustaw_flage_agresora(
    state: &TurnMap,
    owner_id: f64,
    turn: f64,
    cause: WarCause,
    params: &AggressorParams,
) -> TurnMap {
    if !czy_daje_flage_agresora(cause) {
        return state.clone();
    }
    if !turn.is_finite() || !owner_id.is_finite() {
        return state.clone();
    }
    let do_tury = turn + params.flaga_agresora.trwa_tur;
    let key = js_number_to_string(owner_id);
    if let Some(prev) = state.get(&key) {
        if *prev >= do_tury {
            return state.clone();
        }
    }
    let mut next = state.clone();
    next.insert(key, do_tury);
    next
}

/// Web: `czyAgresor` (:1855). Aktywna dla `turn < doTury`.
pub fn czy_agresor(state: &TurnMap, owner_id: f64, turn: f64) -> bool {
    let Some(do_tury) = state.get(&js_number_to_string(owner_id)) else {
        return false;
    };
    if !do_tury.is_finite() || !turn.is_finite() {
        return false;
    }
    turn < *do_tury
}

/// Web: `mnoznikWillingnessAlly` (:1862). 1 = bez zmian.
pub fn mnoznik_willingness_ally(aktywna_flaga: bool, params: &AggressorParams) -> f64 {
    if aktywna_flaga {
        params.wplyw_na_ai.willingness_ally_mnoznik
    } else {
        1.0
    }
}

/// Web: `deltaRelacjiSojusz` (:1871). Dodatnia wartosc podnosi prog.
pub fn delta_relacji_sojusz(aktywna_flaga: bool, params: &AggressorParams) -> f64 {
    if aktywna_flaga {
        params.wplyw_na_ai.relacja_delta_sojusz
    } else {
        0.0
    }
}

/// Web: `casusBelliKey` (:1877): `` `${requester}>${target}` ``.
pub fn casus_belli_key(requester: f64, target: f64) -> String {
    format!(
        "{}>{}",
        js_number_to_string(requester),
        js_number_to_string(target)
    )
}

/// Web: `ustawCasusBelli` (:1881).
pub fn ustaw_casus_belli(
    state: &TurnMap,
    requester: f64,
    target: f64,
    turn: f64,
    params: &AggressorParams,
) -> TurnMap {
    if !requester.is_finite() || !target.is_finite() || !turn.is_finite() {
        return state.clone();
    }
    if requester == target {
        return state.clone();
    }
    let key = casus_belli_key(requester, target);
    let do_tury = turn + params.casus_belli.trwa_tur;
    if let Some(prev) = state.get(&key) {
        if *prev >= do_tury {
            return state.clone();
        }
    }
    let mut next = state.clone();
    next.insert(key, do_tury);
    next
}

/// Web: `maCasusBelli` (:1897).
pub fn ma_casus_belli(state: &TurnMap, requester: f64, target: f64, turn: f64) -> bool {
    let Some(do_tury) = state.get(&casus_belli_key(requester, target)) else {
        return false;
    };
    if !do_tury.is_finite() || !turn.is_finite() {
        return false;
    }
    turn < *do_tury
}

/// Web: `serializujMape` (:1904). Tylko wpisy ze skonczona liczba.
pub fn serializuj_mape(state: &TurnMap) -> TurnMap {
    state
        .iter()
        .filter(|(_, v)| v.is_finite())
        .map(|(k, v)| (k.clone(), *v))
        .collect()
}

/// Web: `wczytajMape` (:1914). Brak / uszkodzone dane (nie-obiekt, tablica, `null`) = pusty stan;
/// wpisy niebedace skonczona liczba sa pomijane (JSON nie niesie NaN/Infinity).
pub fn wczytaj_mape(raw: &Value) -> TurnMap {
    let Some(obj) = raw.as_object() else {
        return TurnMap::new();
    };
    obj.iter()
        .filter_map(|(k, v)| match v {
            Value::Number(n) => n.as_f64().filter(|f| f.is_finite()).map(|f| (k.clone(), f)),
            _ => None,
        })
        .collect()
}

/// Web: singleton modulu (:1923-1930) jako wartosc: `stanAgresorow` + `stanCasusBelli`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct AggressorEngineState {
    pub aggressor_flag_until_by_owner: TurnMap,
    pub casus_belli_until_by_pair: TurnMap,
}

impl AggressorEngineState {
    /// Web: `resetStanAgresora` (:1930).
    pub fn reset(&mut self) {
        self.aggressor_flag_until_by_owner.clear();
        self.casus_belli_until_by_pair.clear();
    }

    /// Web: `czyAgresorAktywny` (:1932).
    pub fn czy_agresor_aktywny(&self, owner_id: f64, turn: f64) -> bool {
        czy_agresor(&self.aggressor_flag_until_by_owner, owner_id, turn)
    }

    /// Web: `doTuryFlagiAgresora` (:1938). `None` = `undefined` (brak aktywnej flagi w turze `turn`).
    pub fn do_tury_flagi_agresora(&self, owner_id: f64, turn: f64) -> Option<f64> {
        if !self.czy_agresor_aktywny(owner_id, turn) {
            return None;
        }
        self.aggressor_flag_until_by_owner
            .get(&js_number_to_string(owner_id))
            .copied()
    }

    /// Web: `maCasusBelliAktywne` (:1944).
    pub fn ma_casus_belli_aktywne(&self, requester: f64, target: f64, turn: f64) -> bool {
        ma_casus_belli(&self.casus_belli_until_by_pair, requester, target, turn)
    }

    /// Web: `zarejestrujWypowiedzenie` (:1949).
    pub fn zarejestruj_wypowiedzenie(&mut self, attacker_id: f64, turn: f64, cause: WarCause) {
        self.aggressor_flag_until_by_owner = serializuj_mape(&ustaw_flage_agresora(
            &self.aggressor_flag_until_by_owner,
            attacker_id,
            turn,
            cause,
            aggressor_params(),
        ));
    }

    /// Web: `zarejestrujCasusBelli` (:1954).
    pub fn zarejestruj_casus_belli(&mut self, requester: f64, target: f64, turn: f64) {
        self.casus_belli_until_by_pair = serializuj_mape(&ustaw_casus_belli(
            &self.casus_belli_until_by_pair,
            requester,
            target,
            turn,
            aggressor_params(),
        ));
    }

    /// Web: zapis `meta.aggressorFlagUntilByOwner` / `meta.casusBelliUntilByPair` (main.ts:33615-33616).
    pub fn to_save_meta(&self) -> Value {
        let to_obj = |m: &TurnMap| -> Value {
            let mut o = Map::new();
            for (k, v) in m {
                if let Some(n) = serde_json::Number::from_f64(*v) {
                    o.insert(k.clone(), Value::Number(n));
                }
            }
            Value::Object(o)
        };
        let mut meta = Map::new();
        meta.insert(
            "aggressorFlagUntilByOwner".to_string(),
            to_obj(&self.aggressor_flag_until_by_owner),
        );
        meta.insert(
            "casusBelliUntilByPair".to_string(),
            to_obj(&self.casus_belli_until_by_pair),
        );
        Value::Object(meta)
    }

    /// Web: odczyt (main.ts:42525-42526); brak pol (stary zapis) = pusty stan.
    pub fn from_save_meta(meta: &Value) -> Self {
        Self {
            aggressor_flag_until_by_owner: wczytaj_mape(
                meta.get("aggressorFlagUntilByOwner")
                    .unwrap_or(&Value::Null),
            ),
            casus_belli_until_by_pair: wczytaj_mape(
                meta.get("casusBelliUntilByPair").unwrap_or(&Value::Null),
            ),
        }
    }
}
