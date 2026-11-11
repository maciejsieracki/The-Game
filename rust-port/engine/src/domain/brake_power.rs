//! P6-BRAKE-INPUTS (r2): port web `computeObjectivePower` (gra/src/game/power-objective.ts, pin 07d2fbd72).
//!
//! Funkcja jest czysta: dostaje juz zliczone skladniki (surowe liczniki z wlasciciela) i daje wynik
//! identyczny z webem. Zrodla liczb, ktorych Rust jeszcze nie zbiera z PlayableState, sa wejsciem
//! wolajacego - tabela pokrycia skladnikow jest w raporcie 02b-operator-r2.md.
//!
//! Wspolczynniki i flagi wojskowe pochodza z `data/power-params.json` (identyczny z pinem; test
//! porownuje z wektorami wygenerowanymi z pinu). Zdobycze maja stale wspolczynnik 2 (jak web).

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

/// Web `EmpirePowerRaw` (pola uzywane przez computeObjectivePower). `None` = pole nieobecne w webie (`?? 0`).
#[derive(Debug, Clone, PartialEq)]
pub struct ObjectivePowerRaw {
    pub owner_id: i64,
    pub epoka: f64,
    pub jednostki: f64,
    /// Legacy `wygraneBitwy` (uzywane tylko w trybie FlatCount).
    pub wygrane_bitwy: f64,
    /// P-C2-DEF A: `bitwyPktSum` (uzywane w trybie EnemyMSum; `None` = 0).
    pub bitwy_pkt_sum: Option<f64>,
    pub suma_ludkow: f64,
    pub rekrut_ekw: f64,
    pub miasta: f64,
    pub heksy_terytorium: f64,
    pub budynki: f64,
    pub tech_zbadane: f64,
    pub ulepszenia_terenu: f64,
    pub kultura_imperium: Option<f64>,
    pub miasta_jednosc_religii: Option<f64>,
    pub zdobycze_power: Option<f64>,
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
pub fn compute_objective_power(
    input: &ObjectivePowerRaw,
    coeff: &PowerCoeffs,
    battle: BattlePowerModel,
    military: &BTreeSet<&'static str>,
) -> ObjectivePowerResult {
    let nonneg = |v: f64| v.max(0.0);
    let (bitwy_raw, bitwy_coeff) = match battle {
        BattlePowerModel::EnemyMSum => (nonneg(input.bitwy_pkt_sum.unwrap_or(0.0)), 2.0),
        BattlePowerModel::FlatCount => (nonneg(input.wygrane_bitwy), coeff.wygrana_bitwa),
    };
    let row = |key: &'static str, raw: f64, c: f64| PowerComponent {
        key,
        raw_count: raw,
        coefficient: c,
        points: raw * c,
        military: military.contains(key),
    };
    let components = vec![
        row("armia", nonneg(input.jednostki), coeff.jednostka_wojskowa),
        row("bitwy", bitwy_raw, bitwy_coeff),
        row("ludki", nonneg(input.suma_ludkow), coeff.ludek),
        row(
            "rekruci",
            nonneg(input.rekrut_ekw),
            coeff.rekrut_ekw_jednostki,
        ),
        row("miasta", nonneg(input.miasta), coeff.miasto),
        row(
            "terytorium",
            nonneg(input.heksy_terytorium),
            coeff.heks_terytorium,
        ),
        row("infra", nonneg(input.budynki), coeff.budynki),
        row("tech", nonneg(input.tech_zbadane), coeff.tech_zbadane),
        row(
            "ulepszenia",
            nonneg(input.ulepszenia_terenu),
            coeff.ulepszenie_terenu,
        ),
        row(
            "kultura",
            nonneg(input.kultura_imperium.unwrap_or(0.0)),
            coeff.kultura_imperium,
        ),
        row(
            "religia",
            nonneg(input.miasta_jednosc_religii.unwrap_or(0.0)),
            coeff.religia_jednosc,
        ),
        row("zdobycze", nonneg(input.zdobycze_power.unwrap_or(0.0)), 2.0),
    ];
    let power_base = components.iter().fold(0.0_f64, |s, c| s + c.points);
    ObjectivePowerResult {
        owner_id: input.owner_id,
        epoka: input.epoka,
        power_base,
        power: (power_base + 0.5).floor(),
        components,
    }
}

/// Adapter `objectivePowerForOwner` (web main.ts): wynik `power` dla wlasciciela.
/// Zbieranie `ObjectivePowerRaw` z PlayableState jest poza tym modulem (patrz raport, tabela pokrycia).
pub fn objective_power_for_owner(
    input: &ObjectivePowerRaw,
    coeff: &PowerCoeffs,
    battle: BattlePowerModel,
    military: &BTreeSet<&'static str>,
) -> f64 {
    compute_objective_power(input, coeff, battle, military).power
}
