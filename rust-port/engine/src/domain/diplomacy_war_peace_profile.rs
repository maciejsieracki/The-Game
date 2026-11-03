//! R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1: port profilu wojny i pokoju per cywilizacja
//! (pin weba `23dd158e9` = `origin/main`).
//!
//! web: `gra/src/game/diplomacy-war-peace-profile.ts`
//! :15 (`ZDROWIE_AI_PARAM_KEY`), :17 (`zdrowieBazaZAiParams`), :23 (`WarPeaceParams`),
//! :39 (`WAR_PEACE_PARAMS`), :42 (`WAR_WEARINESS_MAX_SHARE`), :44 (`WarPeaceProfile`),
//! :71 (`MatrixRowLite`), :80 (`findMatrixRow`), :89 (`clampNum`), :97 (`resolveWarPeaceProfile`),
//! :185 (`warWearinessFraction`), :195 (`warWearinessShare`), :203 (`WarCityRecord`),
//! :210 (`recordWarCityLoss`), :225 (`warStateFromRecord`), :240 (`brakeRelationThreshold`),
//! :244 (`PeaceSignalInput`), :265 (`aiPeaceSignals`), :289 (`peaceStrengthPriceMultiplier`),
//! :299 (`peaceCivPriceMultiplier`), :307 (`PeaceAiGateInput`), :323 (`isFeelingStronger`),
//! :335 (`evaluatePeaceAiGate`).
//! Dane: `gra/data/diplomacy-war-peace-params.json` (kopia `data/derived/diplomacy-war-peace-params.json`),
//! `gra/data/civ-matrix.json` (istniejace dane Rust), `gra/data/ai-params.json` (istniejace dane Rust).
//!
//! web: `gra/src/main.ts` (czyste rdzenie domkniec; same domkniecia zalezne od stanu gry
//! `diplomacyPairMeta`/`units`/`turn` NIE sa portowane):
//! :10225 (`diploWarStateFor`, rdzen: `war_state_for_pair`), :10245 (`diploEnsureWarStart`, rdzen j.w.),
//! :10257 (`diploArmyHealthShare`, rdzen: `army_health_share`), :10271 (`diploRelWarFields`,
//! rdzen: `rel_war_fields`), :10278 (`diploProposalWarState`, rdzen: `proposal_war_state`),
//! :10318 (`diploBrakeWarParams`, rdzen: `brake_war_params`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Liczby z webu (`number`) = `f64`, zeby zachowac NaN / Infinity / porownania JS; `Math.min`,
//!   `Math.max`, `Math.round` zapisane przez `js_min`, `js_max`, `js_math_round` z `civ_matrix::js_compat`.
//! - `undefined` / brak pola = `Option<_>`; `x ?? y` = `Option::unwrap_or`.
//! - Parametry (`WarPeaceParams`) sa argumentem kazdej funkcji (web: domyslny argument
//!   `params = WAR_PEACE_PARAMS`); domyslne wartosci daje `war_peace_params()` z osadzonego JSON.
//! - `findMatrixRow` dziala na `MatrixRowLite` (jak web); wiersze osadzonej macierzy daje
//!   `embedded_matrix_rows()` z `civ_matrix::load_civ_matrix()`. Porownanie bez wielkosci liter
//!   przez `str::to_lowercase` (web `toLowerCase`); roznica Unicode (np. sigma koncowa) NIE_ZMIERZONO.
//! - `zdrowieBazaZAiParams`: web czyta `ai-params.json[klucz].wartosc` i uzywa go tylko gdy
//!   `typeof v === 'number' && Number.isFinite(v)`. Rust: wartosc podawana jako `Option<f64>`
//!   (`None` = brak klucza lub nie-liczba); osadzona wartosc daje `embedded_zdrowie_ai_value()`.
//! - Klucz rekordu utrat `Record<string, number>` = `BTreeMap<String, f64>` (kolejnosc kluczy poza
//!   kontraktem); klucze prototypowe JS (`__proto__`, `constructor`) NIE sa odtwarzane (ZALOZENIE).
//! - `premiaProfilObronny` = 0,05 portowana 1:1 jako wartosc z JSON (DECYZJA WLASCICIELA 2026-11-02:
//!   regula 1:1 rozstrzyga pytanie 6 audytu; sam JSON nazywa ja "DECYZJA ADMINISTRACYJNA orkiestratora").
//! - Komunikaty `reason` w `evaluatePeaceAiGate` skladane jak szablon JS (`${turns}` = `js_number_to_string`).

use std::collections::BTreeMap;
use std::sync::OnceLock;

use serde::Deserialize;

use crate::data::economy_society_part2::parse_ai_params;
use crate::domain::civ_matrix::js_compat::{js_math_round, js_max, js_min, js_number_to_string};
use crate::domain::civ_matrix::{load_civ_matrix, num_to_f64};

/// Kopia `gra/data/diplomacy-war-peace-params.json` z pinu `23dd158e9`.
pub const WAR_PEACE_PARAMS_JSON: &str =
    include_str!("../../data/derived/diplomacy-war-peace-params.json");

/// Web `ZDROWIE_AI_PARAM_KEY` (:15).
pub const ZDROWIE_AI_PARAM_KEY: &str = "dyplomacja_zdrowie_armii_pokój";

/// Web `WarPeaceParams` (:23-37). Pola `_opis` / `_wzor` / `_zalozenie_*` / `_zrodlo_*` JSON sa pomijane.
#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgWojnyRelacjiParams {
    pub baza: f64,
    pub waga_prog_wojny: f64,
    pub waga_ekspansja: f64,
    pub ekspansja_srodek: f64,
    pub waga_podboj: f64,
    pub podboj_srodek: f64,
    pub min: f64,
    pub max: f64,
    pub baza_brak_danych: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgPokojSlaboscParams {
    pub baza: f64,
    pub agresja_srodek: f64,
    pub waga_agresja: f64,
    pub premia_profil_obronny: f64,
    pub min: f64,
    pub max: f64,
    pub baza_brak_danych: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgKrytycznyParams {
    pub baza: f64,
    pub agresja_srodek: f64,
    pub waga_agresja: f64,
    pub min: f64,
    pub max: f64,
    pub baza_brak_danych: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgZdrowiaParams {
    pub baza: f64,
    pub tolerancja_srodek: f64,
    pub waga_tolerancja: f64,
    pub min: f64,
    pub max: f64,
    pub baza_brak_danych: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinTurWojnyParams {
    pub baza: f64,
    pub agresja_wysoka: f64,
    pub premia_agresja_wysoka: f64,
    pub agresja_niska: f64,
    pub kara_agresja_niska: f64,
    pub kara_profil_obronny: f64,
    pub min: f64,
    pub max: f64,
    pub baza_brak_danych: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZmeczenieParams {
    pub maks_udzial: f64,
    pub baza_tur: f64,
    pub waga_agresja: f64,
    pub maks_tur: f64,
    pub prog_sygnalu_pokoju: f64,
    pub baza_tur_brak_danych: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SygnalyPokojuParams {
    pub prog_rw_miasta: f64,
    pub pat_tur_wojny: f64,
    pub pat_brak_zmiany_tur: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CenaPokojuParams {
    pub odrzucenie_rw_prog: f64,
    pub odrzucenie_max_tur_wojny: f64,
    pub prog_sily_wysoki: f64,
    pub waga_sily: f64,
    pub max_mnoznik_sily: f64,
    pub prog_sily_niski: f64,
    pub mnoznik_sily_niski: f64,
    pub agresja_srodek: f64,
    pub waga_agresja: f64,
    pub podboj_srodek: f64,
    pub waga_podboj: f64,
    pub mnoznik_cyw_min: f64,
    pub mnoznik_cyw_max: f64,
    pub tury_bez_ograniczen_ai: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HamulecRelacjiParams {
    pub prog_kryzysu_minus_punkty: f64,
    pub baza_n: f64,
    pub waga_prog_wojny: f64,
    pub min_n: f64,
    pub max_n: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarPeaceParams {
    pub prog_wojny_relacji: ProgWojnyRelacjiParams,
    pub prog_pokoj_slabosc: ProgPokojSlaboscParams,
    pub prog_krytyczny: ProgKrytycznyParams,
    pub prog_zdrowia: ProgZdrowiaParams,
    pub min_tur_wojny: MinTurWojnyParams,
    pub zmeczenie: ZmeczenieParams,
    pub sygnaly_pokoju: SygnalyPokojuParams,
    pub cena_pokoju: CenaPokojuParams,
    pub hamulec_relacji: HamulecRelacjiParams,
}

/// Web `WAR_PEACE_PARAMS` (:39): osadzony JSON, parsowany raz.
pub fn war_peace_params() -> &'static WarPeaceParams {
    static P: OnceLock<WarPeaceParams> = OnceLock::new();
    P.get_or_init(|| {
        serde_json::from_str(WAR_PEACE_PARAMS_JSON)
            .expect("diplomacy-war-peace-params.json must parse")
    })
}

/// Web `WAR_WEARINESS_MAX_SHARE` (:42).
pub fn war_weariness_max_share() -> f64 {
    war_peace_params().zmeczenie.maks_udzial
}

/// Web `zdrowieBazaZAiParams` (:17-21): `ai_value` = `ai-params.json[ZDROWIE_AI_PARAM_KEY].wartosc`
/// (`None` = brak klucza lub nie-liczba); niepoprawna / nieskonczona wartosc -> `progZdrowia.baza`.
pub fn zdrowie_baza_z_ai_params_value(ai_value: Option<f64>, params: &WarPeaceParams) -> f64 {
    match ai_value {
        Some(v) if v.is_finite() => v,
        _ => params.prog_zdrowia.baza,
    }
}

/// Wartosc z osadzonego `ai-params.json` (klucz `ZDROWIE_AI_PARAM_KEY`).
pub fn embedded_zdrowie_ai_value() -> Option<f64> {
    static V: OnceLock<Option<f64>> = OnceLock::new();
    *V.get_or_init(|| {
        parse_ai_params()
            .ok()
            .map(|p| p.dyplomacja_zdrowie_armii_pokoj.wartosc)
    })
}

/// Web `zdrowieBazaZAiParams(params)` na osadzonych danych.
pub fn zdrowie_baza_z_ai_params(params: &WarPeaceParams) -> f64 {
    zdrowie_baza_z_ai_params_value(embedded_zdrowie_ai_value(), params)
}

/// Web `WarPeaceProfile` (:44-69).
#[derive(Debug, Clone, PartialEq)]
pub struct WarPeaceProfile {
    /// Klucz cywilizacji albo `None` (web `null`) dla gracza/nieznanego.
    pub civ_key: Option<String>,
    /// true gdy znaleziono wiersz macierzy; false = wartosci bazowe.
    pub has_data: bool,
    pub agresywnosc: f64,
    pub ekspansywnosc: f64,
    pub sklonnosc_podboju: f64,
    pub tolerancja_ryzyka: f64,
    pub prog_wojny_macierz: f64,
    pub profil_obronny: bool,
    pub prog_wojny_relacji: f64,
    pub prog_pokoj_slabosc: f64,
    pub prog_krytyczny: f64,
    pub prog_zdrowia: f64,
    pub min_tur_wojny: f64,
    pub zmeczenie_t: f64,
    pub hamulec_n: f64,
}

/// Web `MatrixRowLite` (:71-76).
#[derive(Debug, Clone, PartialEq)]
pub struct MatrixRowLite {
    pub typ_cywilizacji: String,
    pub cywilizacja: String,
    pub ikona_id: String,
    pub params: BTreeMap<String, f64>,
}

/// Web `MATRIX_ROWS` (:78): wiersze osadzonego `civ-matrix.json`.
pub fn embedded_matrix_rows() -> &'static [MatrixRowLite] {
    static R: OnceLock<Vec<MatrixRowLite>> = OnceLock::new();
    R.get_or_init(|| {
        load_civ_matrix()
            .file
            .cywilizacje
            .iter()
            .map(|c| MatrixRowLite {
                typ_cywilizacji: c.typ_cywilizacji.clone(),
                cywilizacja: c.cywilizacja.clone(),
                ikona_id: c.ikona_id.clone(),
                params: c
                    .params
                    .iter()
                    .map(|(k, v)| (k.clone(), num_to_f64(v)))
                    .collect(),
            })
            .collect()
    })
}

/// Web `findMatrixRow` (:80-87): typCywilizacji / ikonaId / Cywilizacja, bez wielkosci liter.
pub fn find_matrix_row<'a>(rows: &'a [MatrixRowLite], civ_key: &str) -> Option<&'a MatrixRowLite> {
    let key = civ_key.to_lowercase();
    rows.iter().find(|c| {
        c.typ_cywilizacji.to_lowercase() == key
            || c.ikona_id.to_lowercase() == key
            || c.cywilizacja.to_lowercase() == key
    })
}

/// Web `clampNum` (:89-91): `Math.min(hi, Math.max(lo, v))`.
pub fn clamp_num(v: f64, lo: f64, hi: f64) -> f64 {
    js_min(hi, js_max(lo, v))
}

/// Web `resolveWarPeaceProfile` (:97-181) na wierszach i wartosci `ai-params` podanych jawnie.
/// Web `civKey ? find : undefined`: `None` i pusty ciag = brak wiersza (ale `civKey` pusty zostaje `Some("")`).
pub fn resolve_war_peace_profile_with(
    civ_key: Option<&str>,
    params: &WarPeaceParams,
    rows: &[MatrixRowLite],
    ai_zdrowie_value: Option<f64>,
) -> WarPeaceProfile {
    let row = match civ_key {
        Some(k) if !k.is_empty() => find_matrix_row(rows, k),
        _ => None,
    };
    let civ_key_out = civ_key.map(|s| s.to_string());
    let zdrowie_baza = zdrowie_baza_z_ai_params_value(ai_zdrowie_value, params);
    let row = match row {
        Some(r) => r,
        None => {
            return WarPeaceProfile {
                civ_key: civ_key_out,
                has_data: false,
                agresywnosc: 5.0,
                ekspansywnosc: 3.0,
                sklonnosc_podboju: 2.0,
                tolerancja_ryzyka: 5.0,
                prog_wojny_macierz: 5.0,
                profil_obronny: false,
                prog_wojny_relacji: params.prog_wojny_relacji.baza_brak_danych,
                prog_pokoj_slabosc: params.prog_pokoj_slabosc.baza_brak_danych,
                prog_krytyczny: params.prog_krytyczny.baza_brak_danych,
                prog_zdrowia: zdrowie_baza,
                min_tur_wojny: params.min_tur_wojny.baza_brak_danych,
                zmeczenie_t: params.zmeczenie.baza_tur_brak_danych,
                hamulec_n: clamp_num(
                    js_math_round(
                        params.hamulec_relacji.baza_n
                            - params.hamulec_relacji.waga_prog_wojny * 5.0,
                    ),
                    params.hamulec_relacji.min_n,
                    params.hamulec_relacji.max_n,
                ),
            };
        }
    };
    let p = &row.params;
    let get = |k: &str, d: f64| p.get(k).copied().unwrap_or(d);
    let dip_prog = get("dip_prog_wojny", 5.0);
    let agr = get("ai_agresywnosc", 5.0);
    let eks = get("ai_ekspansywnosc", 3.0);
    let pod = get("ai_sklonnosc_podboju", 2.0);
    let risk = get("ai_tolerancja_ryzyka", 5.0);
    let obronny = get("ai_profil_obronna", 0.0) == 1.0;

    let w = &params.prog_wojny_relacji;
    let prog_wojny_relacji = clamp_num(
        w.baza
            + w.waga_prog_wojny * dip_prog
            + w.waga_ekspansja * (eks - w.ekspansja_srodek)
            + w.waga_podboj * (pod - w.podboj_srodek),
        w.min,
        w.max,
    );

    let s = &params.prog_pokoj_slabosc;
    let prog_pokoj_slabosc = clamp_num(
        s.baza - s.waga_agresja * (agr - s.agresja_srodek)
            + (if obronny {
                s.premia_profil_obronny
            } else {
                0.0
            }),
        s.min,
        s.max,
    );

    let k = &params.prog_krytyczny;
    let prog_krytyczny = clamp_num(
        k.baza - k.waga_agresja * (agr - k.agresja_srodek),
        k.min,
        k.max,
    );

    let z = &params.prog_zdrowia;
    let prog_zdrowia = clamp_num(
        zdrowie_baza - z.waga_tolerancja * (risk - z.tolerancja_srodek),
        z.min,
        z.max,
    );

    let m = &params.min_tur_wojny;
    let min_tur_wojny = js_math_round(clamp_num(
        m.baza
            + (if agr >= m.agresja_wysoka {
                m.premia_agresja_wysoka
            } else {
                0.0
            })
            + (if agr <= m.agresja_niska {
                m.kara_agresja_niska
            } else {
                0.0
            })
            + (if obronny { m.kara_profil_obronny } else { 0.0 }),
        m.min,
        m.max,
    ));

    let t = &params.zmeczenie;
    let zmeczenie_t = js_min(t.maks_tur, t.baza_tur + t.waga_agresja * agr);

    let h = &params.hamulec_relacji;
    let hamulec_n = clamp_num(
        js_math_round(h.baza_n - h.waga_prog_wojny * dip_prog),
        h.min_n,
        h.max_n,
    );

    WarPeaceProfile {
        civ_key: civ_key_out,
        has_data: true,
        agresywnosc: agr,
        ekspansywnosc: eks,
        sklonnosc_podboju: pod,
        tolerancja_ryzyka: risk,
        prog_wojny_macierz: dip_prog,
        profil_obronny: obronny,
        prog_wojny_relacji,
        prog_pokoj_slabosc,
        prog_krytyczny,
        prog_zdrowia,
        min_tur_wojny,
        zmeczenie_t,
        hamulec_n,
    }
}

/// Web `resolveWarPeaceProfile(civKey, params)` (:97) na osadzonej macierzy i osadzonym `ai-params`.
pub fn resolve_war_peace_profile(
    civ_key: Option<&str>,
    params: &WarPeaceParams,
) -> WarPeaceProfile {
    resolve_war_peace_profile_with(
        civ_key,
        params,
        embedded_matrix_rows(),
        embedded_zdrowie_ai_value(),
    )
}

/// Web `warWearinessFraction` (:185-189): `min(1, turnsAtWar / zmeczenieT)`, 0 poza wojna.
pub fn war_weariness_fraction(turns_at_war: f64, zmeczenie_t: f64) -> f64 {
    let turns = if turns_at_war.is_finite() {
        js_max(0.0, turns_at_war)
    } else {
        0.0
    };
    // web: `!(zmeczenieT > 0)` -- negacja celowa (NaN daje 0).
    #[allow(clippy::neg_cmp_op_on_partial_ord)]
    if !(zmeczenie_t > 0.0) || turns <= 0.0 {
        return 0.0;
    }
    js_min(1.0, turns / zmeczenie_t)
}

/// Web `warWearinessShare` (:195-197) z jawnym `maksUdzial` (web: globalne `WAR_WEARINESS_MAX_SHARE`).
pub fn war_weariness_share_with(max_share: f64, turns_at_war: f64, zmeczenie_t: f64) -> f64 {
    max_share * war_weariness_fraction(turns_at_war, zmeczenie_t)
}

/// Web `warWearinessShare` (:195) na osadzonych parametrach.
pub fn war_weariness_share(turns_at_war: f64, zmeczenie_t: f64) -> f64 {
    war_weariness_share_with(war_weariness_max_share(), turns_at_war, zmeczenie_t)
}

/// Web `WarCityRecord` (:203-207).
#[derive(Debug, Clone, PartialEq)]
pub struct WarCityRecord {
    pub od: f64,
    pub utraty: BTreeMap<String, f64>,
    pub ostatnia_tura: Option<f64>,
}

/// Web `recordWarCityLoss` (:210-222): rekord z innej wojny (`od` rozne) jest zastepowany czystym.
pub fn record_war_city_loss(
    prev: Option<&WarCityRecord>,
    od: f64,
    old_owner_key: &str,
    turn: f64,
) -> WarCityRecord {
    // web: `prev && prev.od === od ? prev : { od, utraty: {} }`
    let mut utraty = match prev {
        Some(p) if p.od == od => p.utraty.clone(),
        _ => BTreeMap::new(),
    };
    let cur = utraty.get(old_owner_key).copied().unwrap_or(0.0);
    utraty.insert(old_owner_key.to_string(), cur + 1.0);
    WarCityRecord {
        od,
        utraty,
        ostatnia_tura: Some(turn),
    }
}

/// Wynik web `warStateFromRecord` (:225-229).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WarState {
    pub turns_at_war: f64,
    pub lost_cities: f64,
    pub turns_since_city_change: f64,
}

/// Web `warStateFromRecord` (:225-237).
pub fn war_state_from_record(
    rec: Option<&WarCityRecord>,
    od: f64,
    owner_key: &str,
    turn: f64,
) -> WarState {
    let valid = match rec {
        Some(r) if r.od == od => Some(r),
        _ => None,
    };
    WarState {
        turns_at_war: js_max(0.0, turn - od),
        lost_cities: valid
            .and_then(|v| v.utraty.get(owner_key).copied())
            .unwrap_or(0.0),
        turns_since_city_change: js_max(
            0.0,
            turn - valid.and_then(|v| v.ostatnia_tura).unwrap_or(od),
        ),
    }
}

/// Web `brakeRelationThreshold` (:240-242).
pub fn brake_relation_threshold(prog_wojny_relacji_wyzszej: f64, params: &WarPeaceParams) -> f64 {
    prog_wojny_relacji_wyzszej - params.hamulec_relacji.prog_kryzysu_minus_punkty
}

/// Web `PeaceSignalInput` (:244-254).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PeaceSignalInput {
    pub rw: f64,
    pub turns_at_war: f64,
    pub lost_cities_in_war: f64,
    pub turns_since_city_change: Option<f64>,
    pub army_health_share: Option<f64>,
}

/// Web `PeaceSignalResult` (:256-259).
#[derive(Debug, Clone, PartialEq)]
pub struct PeaceSignalResult {
    pub wants_peace: bool,
    pub reasons: Vec<&'static str>,
}

/// Web `aiPeaceSignals` (:265-287): kolejnosc powodow a, b, d, e, c.
pub fn ai_peace_signals(
    input: &PeaceSignalInput,
    profile: &WarPeaceProfile,
    params: &WarPeaceParams,
) -> PeaceSignalResult {
    let mut reasons: Vec<&'static str> = Vec::new();
    let s = &params.sygnaly_pokoju;
    if input.rw <= profile.prog_pokoj_slabosc {
        reasons.push("a");
    }
    if input.lost_cities_in_war >= 1.0 && input.rw <= s.prog_rw_miasta {
        reasons.push("b");
    }
    let since_change = input.turns_since_city_change.unwrap_or(input.turns_at_war);
    if input.turns_at_war >= s.pat_tur_wojny && since_change >= s.pat_brak_zmiany_tur {
        reasons.push("d");
    }
    if war_weariness_fraction(input.turns_at_war, profile.zmeczenie_t)
        >= params.zmeczenie.prog_sygnalu_pokoju
    {
        reasons.push("e");
    }
    if let Some(h) = input.army_health_share {
        if h < profile.prog_zdrowia {
            reasons.push("c");
        }
    }
    PeaceSignalResult {
        wants_peace: !reasons.is_empty(),
        reasons,
    }
}

/// Web `peaceStrengthPriceMultiplier` (:289-297).
pub fn peace_strength_price_multiplier(rw: f64, params: &WarPeaceParams) -> f64 {
    let c = &params.cena_pokoju;
    if rw >= c.prog_sily_wysoki {
        return js_min(c.max_mnoznik_sily, 1.0 + c.waga_sily * (rw - 0.5));
    }
    if rw <= c.prog_sily_niski {
        return c.mnoznik_sily_niski;
    }
    1.0
}

/// Web `peaceCivPriceMultiplier` (:299-305).
pub fn peace_civ_price_multiplier(profile: &WarPeaceProfile, params: &WarPeaceParams) -> f64 {
    let c = &params.cena_pokoju;
    let raw = 1.0
        + c.waga_agresja * (profile.agresywnosc - c.agresja_srodek)
        + c.waga_podboj * (profile.sklonnosc_podboju - c.podboj_srodek);
    clamp_num(raw, c.mnoznik_cyw_min, c.mnoznik_cyw_max)
}

/// Web `PeaceAiGateInput` (:307-312).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PeaceAiGateInput {
    pub rw: f64,
    pub turns_at_war: f64,
    pub lost_cities_in_war: f64,
}

/// Web `PeaceAiGateResult['verdict']` (:316).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PeaceGateVerdict {
    Ok,
    TooEarly,
    Stronger,
}

/// Web `PeaceAiGateResult` (:314-320).
#[derive(Debug, Clone, PartialEq)]
pub struct PeaceAiGateResult {
    pub verdict: PeaceGateVerdict,
    pub price_multiplier: f64,
    pub reason: Option<String>,
}

/// Web `isFeelingStronger` (:323-326).
pub fn is_feeling_stronger(input: &PeaceAiGateInput, params: &WarPeaceParams) -> bool {
    let c = &params.cena_pokoju;
    input.rw >= c.odrzucenie_rw_prog
        && input.lost_cities_in_war == 0.0
        && js_max(0.0, input.turns_at_war) < c.odrzucenie_max_tur_wojny
}

/// Web `evaluatePeaceAiGate` (:335-364).
pub fn evaluate_peace_ai_gate(
    input: &PeaceAiGateInput,
    profile: &WarPeaceProfile,
    params: &WarPeaceParams,
) -> PeaceAiGateResult {
    let c = &params.cena_pokoju;
    let turns = js_max(0.0, input.turns_at_war);
    let min_tur = profile.min_tur_wojny;
    if turns < min_tur {
        return PeaceAiGateResult {
            verdict: PeaceGateVerdict::TooEarly,
            price_multiplier: 1.0,
            reason: Some(format!(
                "za wcześnie na pokój — AI wymaga co najmniej {} tur wojny (obecnie {})",
                js_number_to_string(min_tur),
                js_number_to_string(turns)
            )),
        };
    }
    if turns >= c.tury_bez_ograniczen_ai {
        return PeaceAiGateResult {
            verdict: PeaceGateVerdict::Ok,
            price_multiplier: js_min(1.0, peace_civ_price_multiplier(profile, params)),
            reason: None,
        };
    }
    if is_feeling_stronger(input, params) {
        return PeaceAiGateResult {
            verdict: PeaceGateVerdict::Stronger,
            price_multiplier: 1.0,
            reason: Some(
                "AI czuje się silniejsze — odrzuca pokój, dopóki nie straci miasta lub nie minie więcej tur wojny"
                    .to_string(),
            ),
        };
    }
    PeaceAiGateResult {
        verdict: PeaceGateVerdict::Ok,
        price_multiplier: peace_strength_price_multiplier(input.rw, params)
            * peace_civ_price_multiplier(profile, params),
        reason: None,
    }
}

// ---------------------------------------------------------------------------
// Czyste rdzenie domkniec `main.ts` (pin 23dd158e9)
// ---------------------------------------------------------------------------

/// Jednostka w sumie zdrowia armii (web `diploArmyHealthShare`, `main.ts:10257-10268`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ArmyHealthUnit {
    pub owner_id: i64,
    /// `isCivilianUnit(u)`.
    pub civilian: bool,
    /// `effectiveRuntimeUnitMaxHp(u)`.
    pub max_hp: f64,
    /// `u.hp` (`None` = undefined -> `?? m`).
    pub hp: Option<f64>,
}

/// Web `diploArmyHealthShare` (`main.ts:10257-10268`): Σ hp / Σ hpMax jednostek bojowych wlasciciela;
/// `None` (undefined) gdy suma max <= 0 (lub NaN).
pub fn army_health_share(units: &[ArmyHealthUnit], owner_id: i64) -> Option<f64> {
    let mut hp = 0.0_f64;
    let mut max = 0.0_f64;
    for u in units {
        if u.owner_id != owner_id || u.civilian {
            continue;
        }
        let m = u.max_hp;
        // web: `if (!(m > 0)) continue;`
        #[allow(clippy::neg_cmp_op_on_partial_ord)]
        if !(m > 0.0) {
            continue;
        }
        hp += js_max(0.0, js_min(m, u.hp.unwrap_or(m)));
        max += m;
    }
    if max > 0.0 {
        Some(hp / max)
    } else {
        None
    }
}

/// Rdzen web `diploWarStateFor` + `diploEnsureWarStart` (`main.ts:10225-10255`).
/// `war_start_stamp` = `meta.wojnaStartTura` (None = undefined). Zwraca stan wojny i NOWY stempel
/// (poza wojna stempel jest zdejmowany = `None`; w wojnie istniejacy stempel zostaje, a brak -> `turn`).
pub fn war_state_for_pair(
    at_war: bool,
    war_start_stamp: Option<f64>,
    rec: Option<&WarCityRecord>,
    owner_key: &str,
    turn: f64,
) -> (WarState, Option<f64>) {
    if !at_war {
        return (
            WarState {
                turns_at_war: 0.0,
                lost_cities: 0.0,
                turns_since_city_change: 0.0,
            },
            None,
        );
    }
    let od = war_start_stamp.unwrap_or(turn);
    (war_state_from_record(rec, od, owner_key, turn), Some(od))
}

/// Wynik web `diploRelWarFields` (`main.ts:10271-10276`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RelWarFields {
    pub turns_at_war: f64,
    pub lost_cities_in_war: f64,
    pub turns_since_city_change: f64,
    pub army_health_share: Option<f64>,
}

/// Rdzen web `diploRelWarFields`: zdrowie armii liczone leniwie tylko gdy `turnsAtWar > 0`.
pub fn rel_war_fields<F: FnOnce() -> Option<f64>>(s: WarState, army_health: F) -> RelWarFields {
    let army_health_share = if s.turns_at_war > 0.0 {
        army_health()
    } else {
        None
    };
    RelWarFields {
        turns_at_war: s.turns_at_war,
        lost_cities_in_war: s.lost_cities,
        turns_since_city_change: s.turns_since_city_change,
        army_health_share,
    }
}

/// Wynik web `diploProposalWarState` (`main.ts:10278-10292`, `ProposalEvalContext['warState']`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ProposalWarState {
    pub turns_at_war: f64,
    pub lost_cities_responder: f64,
    pub turns_since_city_change: f64,
    pub responder_rw: f64,
}

/// Rdzen web `diploProposalWarState`: `None` (undefined) poza wojna proposer-responder.
pub fn proposal_war_state(
    at_war: bool,
    responder_state: WarState,
    responder_rw: f64,
) -> Option<ProposalWarState> {
    if !at_war {
        return None;
    }
    Some(ProposalWarState {
        turns_at_war: responder_state.turns_at_war,
        lost_cities_responder: responder_state.lost_cities,
        turns_since_city_change: responder_state.turns_since_city_change,
        responder_rw,
    })
}

/// Rdzen web `diploBrakeWarParams` (`main.ts:10318-10324`): para = wyzszy `progWojnyRelacji`
/// (remis i NaN -> strona `b`); zwraca `(prog, n)`.
pub fn brake_war_params(
    pa: &WarPeaceProfile,
    pb: &WarPeaceProfile,
    params: &WarPeaceParams,
) -> (f64, f64) {
    let higher = if pa.prog_wojny_relacji >= pb.prog_wojny_relacji {
        pa
    } else {
        pb
    };
    (
        brake_relation_threshold(higher.prog_wojny_relacji, params),
        higher.hamulec_n,
    )
}
