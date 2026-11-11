//! P6-BRAKE-INPUTS (r2): port web `computeObjectivePower` (gra/src/game/power-objective.ts, pin 07d2fbd72).
//!
//! Funkcja jest czysta: dostaje juz zliczone skladniki (surowe liczniki z wlasciciela) i daje wynik
//! identyczny z webem. Zrodla liczb, ktorych Rust jeszcze nie zbiera z PlayableState, sa wejsciem
//! wolajacego - tabela pokrycia skladnikow jest w raporcie 02b-operator-r2.md.
//!
//! Wspolczynniki i flagi wojskowe pochodza z `data/power-params.json` (identyczny z pinem; test
//! porownuje z wektorami wygenerowanymi z pinu). Zdobycze maja stale wspolczynnik 2 (jak web).
//!
//! P6-POWER-NOZEROS-Q1: kazdy skladnik wejsciowy ma jawny stan `Component` (`Provided` / `ExplicitZero`
//! / `Missing`). Brak wartosci nie jest cichym zerem: polityka domyslna to STRICT (`MissingComponents`).

use std::collections::BTreeSet;

use crate::data::units_combat::{parse_power_params, BoolOrText, PowerParamsFile};

/// Web `PowerCoefficients` (pkt z `skladniki.<klucz>.pkt`).
#[derive(Debug, Clone, PartialEq)]
pub struct PowerCoeffs {
    pub jednostka_wojskowa: f64,
    pub wygrana_bitwa: f64,
    pub ludek: f64,
    pub rekrut_ekw_jednostki: f64,
    pub miasto: f64,
    pub heks_terytorium: f64,
    pub budynki: f64,
    pub tech_zbadane: f64,
    pub ulepszenie_terenu: f64,
    pub kultura_imperium: f64,
    pub religia_jednosc: f64,
}

impl PowerCoeffs {
    /// Web `loadPowerCoefficients` (bez fallbacku: JSON jest kompletny, pkt >= 0 w pinie).
    pub fn from_params(p: &PowerParamsFile) -> Self {
        let s = &p.skladniki;
        Self {
            jednostka_wojskowa: s.jednostka_wojskowa.pkt,
            wygrana_bitwa: s.wygrana_bitwa.pkt,
            ludek: s.ludek.pkt,
            rekrut_ekw_jednostki: s.rekrut_ekw_jednostki.pkt,
            miasto: s.miasto.pkt,
            heks_terytorium: s.heks_terytorium.pkt,
            budynki: s.budynki.pkt,
            tech_zbadane: s.tech_zbadane.pkt,
            ulepszenie_terenu: s.ulepszenie_terenu.pkt,
            kultura_imperium: s.kultura_imperium.pkt,
            religia_jednosc: s.religia_jednosc.pkt,
        }
    }

    /// Wspolczynniki z wbudowanego `data/power-params.json`.
    pub fn default_params() -> Self {
        Self::from_params(&parse_power_params().expect("power-params.json must parse"))
    }
}

/// Web `loadBattlePowerModel`: `opcje.bitwa_power_model.wartosc` = `enemy_m_pre_battle`/`enemy_m_sum` -> EnemyMSum.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BattlePowerModel {
    FlatCount,
    EnemyMSum,
}

pub fn battle_power_model(p: &PowerParamsFile) -> BattlePowerModel {
    match &p.opcje.bitwa_power_model.wartosc {
        BoolOrText::Text(v) if v == "enemy_m_pre_battle" || v == "enemy_m_sum" => {
            BattlePowerModel::EnemyMSum
        }
        _ => BattlePowerModel::FlatCount,
    }
}

/// Web `loadMilitaryComponentKeys`: klucze skladnikow (`breakdown.key`) z `wojskowy: true` w JSON.
/// Zdobycze nie maja wpisu w JSON (zawsze niewojskowe), wiec nie wystepuja tutaj.
pub fn military_component_keys(p: &PowerParamsFile) -> BTreeSet<&'static str> {
    let s = &p.skladniki;
    let pairs: [(&'static str, bool); 11] = [
        ("armia", s.jednostka_wojskowa.wojskowy == Some(true)),
        ("bitwy", s.wygrana_bitwa.wojskowy == Some(true)),
        ("ludki", s.ludek.wojskowy == Some(true)),
        ("rekruci", s.rekrut_ekw_jednostki.wojskowy == Some(true)),
        ("miasta", s.miasto.wojskowy == Some(true)),
        ("terytorium", s.heks_terytorium.wojskowy == Some(true)),
        ("infra", s.budynki.wojskowy == Some(true)),
        ("tech", s.tech_zbadane.wojskowy == Some(true)),
        ("ulepszenia", s.ulepszenie_terenu.wojskowy == Some(true)),
        ("kultura", s.kultura_imperium.wojskowy == Some(true)),
        ("religia", s.religia_jednosc.wojskowy == Some(true)),
    ];
    pairs
        .into_iter()
        .filter(|(_, m)| *m)
        .map(|(k, _)| k)
        .collect()
}

/// Stan jednego skladnika wejsciowego `computeObjectivePower` (P6-POWER-NOZEROS-Q1).
///
/// `Missing` = brak zrodla, ktory wolajacy musi zglosic; NIE jest zerem.
/// Zero trzeba zadeklarowac jawnie (`ExplicitZero`, np. web `?? 0`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Component {
    Provided(f64),
    ExplicitZero,
    Missing,
}

impl Component {
    /// `Some(v)` dla wartosci podanej lub jawnego zera; `None` dla `Missing`.
    fn resolve(self) -> Option<f64> {
        match self {
            Component::Provided(v) => Some(v),
            Component::ExplicitZero => Some(0.0),
            Component::Missing => None,
        }
    }
}

/// Brakujace skladniki aktywnego modelu (klucze web `breakdown.key`, w kolejnosci skladnikow).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MissingComponents(pub Vec<&'static str>);

/// Web `EmpirePowerRaw` (pola uzywane przez computeObjectivePower).
/// Kazdy skladnik ma jawny stan `Component`; polityka domyslna STRICT (brak = blad, nie zero).
#[derive(Debug, Clone, PartialEq)]
pub struct ObjectivePowerRaw {
    pub owner_id: i64,
    pub epoka: f64,
    /// Skladnik `armia`.
    pub jednostki: Component,
    /// Legacy `wygraneBitwy` (wymagany tylko w trybie FlatCount).
    pub wygrane_bitwy: Component,
    /// P-C2-DEF A: `bitwyPktSum` (wymagany tylko w trybie EnemyMSum).
    pub bitwy_pkt_sum: Component,
    pub suma_ludkow: Component,
    pub rekrut_ekw: Component,
    pub miasta: Component,
    pub heksy_terytorium: Component,
    pub budynki: Component,
    pub tech_zbadane: Component,
    pub ulepszenia_terenu: Component,
    pub kultura_imperium: Component,
    pub miasta_jednosc_religii: Component,
    pub zdobycze_power: Component,
}

/// Jeden skladnik wyniku (web `PowerComponentBreakdown`, bez etykiet UI).
#[derive(Debug, Clone, PartialEq)]
pub struct PowerComponent {
    pub key: &'static str,
    pub raw_count: f64,
    pub coefficient: f64,
    pub points: f64,
    pub military: bool,
}

/// Web `ObjectivePowerResult` (mnoznik epoki zawsze 1, P-B odrzucone).
#[derive(Debug, Clone, PartialEq)]
pub struct ObjectivePowerResult {
    pub owner_id: i64,
    pub epoka: f64,
    pub power_base: f64,
    /// Web `Math.round(powerBase)` (zaokraglenie w gore przy polowie).
    pub power: f64,
    pub components: Vec<PowerComponent>,
}

/// Web `computeObjectivePower(input, coeff, battleModel, militaryKeys)`.
///
/// STRICT: brak ktoregokolwiek skladnika AKTYWNEGO modelu bitew zwraca `Err(MissingComponents)`.
/// `bitwy` czyta `bitwy_pkt_sum` w EnemyMSum, `wygrane_bitwy` we FlatCount; pole drugiego modelu
/// nie jest wymagane.
pub fn compute_objective_power(
    input: &ObjectivePowerRaw,
    coeff: &PowerCoeffs,
    battle: BattlePowerModel,
    military: &BTreeSet<&'static str>,
) -> Result<ObjectivePowerResult, MissingComponents> {
    let mut missing: Vec<&'static str> = Vec::new();
    let mut get = |key: &'static str, c: Component| -> f64 {
        match c.resolve() {
            Some(v) => v.max(0.0),
            None => {
                missing.push(key);
                0.0
            }
        }
    };
    let (bitwy_src, bitwy_coeff) = match battle {
        BattlePowerModel::EnemyMSum => (input.bitwy_pkt_sum, 2.0),
        BattlePowerModel::FlatCount => (input.wygrane_bitwy, coeff.wygrana_bitwa),
    };
    // Kolejnosc = kolejnosc skladnikow web (wazna dla sumy zmiennoprzecinkowej).
    let raw_values = [
        (
            "armia",
            get("armia", input.jednostki),
            coeff.jednostka_wojskowa,
        ),
        ("bitwy", get("bitwy", bitwy_src), bitwy_coeff),
        ("ludki", get("ludki", input.suma_ludkow), coeff.ludek),
        (
            "rekruci",
            get("rekruci", input.rekrut_ekw),
            coeff.rekrut_ekw_jednostki,
        ),
        ("miasta", get("miasta", input.miasta), coeff.miasto),
        (
            "terytorium",
            get("terytorium", input.heksy_terytorium),
            coeff.heks_terytorium,
        ),
        ("infra", get("infra", input.budynki), coeff.budynki),
        ("tech", get("tech", input.tech_zbadane), coeff.tech_zbadane),
        (
            "ulepszenia",
            get("ulepszenia", input.ulepszenia_terenu),
            coeff.ulepszenie_terenu,
        ),
        (
            "kultura",
            get("kultura", input.kultura_imperium),
            coeff.kultura_imperium,
        ),
        (
            "religia",
            get("religia", input.miasta_jednosc_religii),
            coeff.religia_jednosc,
        ),
    ];
    // Pin 07d2fbd72 power-objective.ts: row('zdobycze', ..., 2, false) - zawsze niewojskowe,
    // niezaleznie od militaryKeys (brak wpisu w JSON).
    let zdobycze_raw = get("zdobycze", input.zdobycze_power);
    if !missing.is_empty() {
        return Err(MissingComponents(missing));
    }
    let mut components: Vec<PowerComponent> = raw_values
        .into_iter()
        .map(|(key, raw, c)| PowerComponent {
            key,
            raw_count: raw,
            coefficient: c,
            points: raw * c,
            military: military.contains(key),
        })
        .collect();
    components.push(PowerComponent {
        key: "zdobycze",
        raw_count: zdobycze_raw,
        coefficient: 2.0,
        points: zdobycze_raw * 2.0,
        military: false,
    });
    let power_base = components.iter().fold(0.0_f64, |s, c| s + c.points);
    Ok(ObjectivePowerResult {
        owner_id: input.owner_id,
        epoka: input.epoka,
        power_base,
        power: (power_base + 0.5).floor(),
        components,
    })
}

/// Adapter `objectivePowerForOwner` (web main.ts): wynik `power` dla wlasciciela.
/// Zbieranie `ObjectivePowerRaw` z PlayableState jest poza tym modulem (patrz raport, tabela pokrycia).
/// STRICT: `Err` przy brakujacym skladniku; zero trzeba podac jawnie jako `Component::ExplicitZero`.
pub fn objective_power_for_owner(
    input: &ObjectivePowerRaw,
    coeff: &PowerCoeffs,
    battle: BattlePowerModel,
    military: &BTreeSet<&'static str>,
) -> Result<f64, MissingComponents> {
    compute_objective_power(input, coeff, battle, military).map(|r| r.power)
}
