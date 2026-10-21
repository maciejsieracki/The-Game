//! Struktury danych 1:1 dla szesciu plikow JSON jednostek/walki z `gra/data/`
//! (kopie w `rust-port/engine/data/`, embedded przez `include_str!`).
//!
//! Temat: R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1. Modul NIE jest podpiety do
//! `lib.rs` (zakaz w dispatchu); test laduje go przez `#[path]`.
//! Nazwy pol Rust sa snake_case, a oryginalne klucze JSON trafiaja przez
//! `#[serde(rename = "...")]`. Kazda struktura ma `deny_unknown_fields`, wiec
//! test wykrywa kazdy klucz JSON, ktorego struktura nie odwzorowuje.
//! Wartosci zapisane w plikach sa kopiowane bez zmian (takze rozjazdy wzgledem
//! `recruitment.rs`, ktore sa osobnym tematem rewiringu domeny).
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

pub const UNITS_JSON: &str = include_str!("../../data/units.json");
pub const COMBAT_PARAMS_JSON: &str = include_str!("../../data/combat-params.json");
pub const TERRAIN_COMBAT_JSON: &str = include_str!("../../data/terrain-combat.json");
pub const COUNTERS_JSON: &str = include_str!("../../data/counters.json");
pub const AUTO_BATTLE_PARAMS_JSON: &str = include_str!("../../data/auto-battle-params.json");
pub const POWER_PARAMS_JSON: &str = include_str!("../../data/power-params.json");

/// Pole, ktore w JSON bywa liczba albo tekst (np. `"—"` dla braku wartosci).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum IntOrText {
    Int(i64),
    Text(String),
}

/// Pole, ktore w JSON bywa bool albo tekst (`opcje.*.wartosc` w power-params).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum BoolOrText {
    Bool(bool),
    Text(String),
}

// ---------------------------------------------------------------------------
// units.json  (tablica 75 rekordow jednostek)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TopEntry {
    pub tytul: String,
    pub tekst: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitRecord {
    #[serde(rename = "Jednostka")]
    pub jednostka: String,
    #[serde(rename = "Historia")]
    pub historia: String,
    #[serde(rename = "Epoka")]
    pub epoka: String,
    #[serde(rename = "Kultura")]
    pub kultura: Option<String>,
    #[serde(rename = "Tech")]
    pub tech: String,
    #[serde(rename = "Pieniądz (koszt)")]
    pub pieniadz_koszt: i64,
    #[serde(rename = "Ludność")]
    pub ludnosc: i64,
    #[serde(rename = "Surowiec")]
    pub surowiec: Option<String>,
    #[serde(rename = "Surowiec (ilość)")]
    pub surowiec_ilosc: i64,
    #[serde(rename = "Utrzymanie (Pieniądz/turę)")]
    pub utrzymanie_pieniadz_ture: i64,
    #[serde(rename = "żywność/turę")]
    pub zywnosc_ture: i64,
    #[serde(rename = "Atak")]
    pub atak: i64,
    #[serde(rename = "Uderzenie")]
    pub uderzenie: i64,
    #[serde(rename = "Obrona")]
    pub obrona: i64,
    #[serde(rename = "Ruch")]
    pub ruch: i64,
    #[serde(rename = "Ruch w bitwie (heksy)")]
    pub ruch_w_bitwie_heksy: IntOrText,
    #[serde(rename = "Health")]
    pub health: i64,
    #[serde(rename = "Próg dezercji (% health)")]
    pub prog_dezercji_proc_health: Option<f64>,
    #[serde(rename = "Widok pola")]
    pub widok_pola: i64,
    #[serde(rename = "Atak dystansowy")]
    pub atak_dystansowy: i64,
    #[serde(rename = "Zasięg ataku (hex)")]
    pub zasieg_ataku_hex: IntOrText,
    #[serde(rename = "Ilość pocisków")]
    pub ilosc_pociskow: IntOrText,
    #[serde(rename = "W zamian za")]
    pub w_zamian_za: String,
    #[serde(rename = "Super-jednostka")]
    pub super_jednostka: String,
    #[serde(rename = "Uwagi")]
    pub uwagi: Option<String>,
    #[serde(rename = "Rola (linia)")]
    pub rola_linia: String,
    #[serde(rename = "Pancerz")]
    pub pancerz: i64,
    #[serde(rename = "Przebicie")]
    pub przebicie: i64,
    #[serde(rename = "Kara obrony z flanki (%)")]
    pub kara_obrony_z_flanki_proc: IntOrText,
    #[serde(rename = "Kara obrony z tyłu (%)")]
    pub kara_obrony_z_tylu_proc: IntOrText,
    #[serde(rename = "Morale bazowe")]
    pub morale_bazowe: i64,
    #[serde(rename = "Morale ucieczki")]
    pub morale_ucieczki: Option<i64>,
    #[serde(rename = "Nazwa EN")]
    pub nazwa_en: String,
    #[serde(rename = "Typ")]
    pub typ: String,
    #[serde(rename = "Klasa")]
    pub klasa: String,
    #[serde(rename = "Nacja")]
    pub nacja: String,
    #[serde(rename = "Bonus vs Swordsman %")]
    pub bonus_vs_swordsman_proc: i64,
    #[serde(rename = "Bonus vs Spearman %")]
    pub bonus_vs_spearman_proc: i64,
    #[serde(rename = "Bonus vs Falangite %")]
    pub bonus_vs_falangite_proc: i64,
    #[serde(rename = "Bonus vs Offensive %")]
    pub bonus_vs_offensive_proc: i64,
    #[serde(rename = "Bonus vs Distance %")]
    pub bonus_vs_distance_proc: i64,
    #[serde(rename = "Bonus vs Mount %")]
    pub bonus_vs_mount_proc: i64,
    #[serde(rename = "Bonus vs Slinger %")]
    pub bonus_vs_slinger_proc: i64,
    #[serde(rename = "Zmiana na")]
    pub zmiana_na: String,
    #[serde(rename = "Zastąp specjalnie")]
    pub zastap_specjalnie: String,
    #[serde(rename = "Dostępna w epokach")]
    pub dostepna_w_epokach: String,
    #[serde(rename = "meleeAttack")]
    pub melee_attack: i64,
    #[serde(rename = "meleeDefence")]
    pub melee_defence: i64,
    #[serde(rename = "weaponDamage")]
    pub weapon_damage: i64,
    #[serde(rename = "piercing")]
    pub piercing: Option<i64>,
    #[serde(rename = "armor")]
    pub armor: Option<i64>,
    #[serde(rename = "chargeBonus")]
    pub charge_bonus: Option<i64>,
    #[serde(rename = "health")]
    pub health_lc: i64,
    #[serde(rename = "missileAttack")]
    pub missile_attack: i64,
    #[serde(rename = "fieldPower")]
    pub field_power: f64,
    #[serde(rename = "Utrzymanie surowiec")]
    pub utrzymanie_surowiec: Option<String>,
    #[serde(rename = "Utrzymanie surowiec (ilość)")]
    pub utrzymanie_surowiec_ilosc: i64,
    #[serde(rename = "Opis")]
    pub opis: String,
    #[serde(rename = "Top3")]
    pub top3: Vec<TopEntry>,
    #[serde(rename = "wallAttack")]
    pub wall_attack: Option<i64>,
    #[serde(rename = "siegePower")]
    pub siege_power: Option<i64>,
}

pub fn parse_units() -> Result<Vec<UnitRecord>, serde_json::Error> {
    serde_json::from_str(UNITS_JSON)
}

// ---------------------------------------------------------------------------
// combat-params.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MacierzV2 {
    pub hit_base: i64,
    pub hit_min: i64,
    pub hit_max: i64,
    pub dmg_scale: i64,
    pub pancerz_divisor: i64,
    pub max_rounds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TwV3 {
    pub hit_base: i64,
    pub hit_min: i64,
    pub hit_max: i64,
    pub max_rounds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Ss5lLegacy {
    pub hit_base: i64,
    pub hit_per_point: i64,
    pub hit_min: i64,
    pub hit_max: i64,
    pub max_rounds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MoralePrzewagaMocy {
    pub _opis: String,
    pub wspolczynnik_proc: i64,
    pub sufit_proc: i64,
    pub epsilon_ponad_flee: i64,
    pub _epsilon_ponad_flee_opis: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Brod {
    pub _opis: String,
    #[serde(rename = "ruchMult")]
    pub ruch_mult: f64,
    #[serde(rename = "karaAtak")]
    pub kara_atak: f64,
    #[serde(rename = "karaObrona")]
    pub kara_obrona: f64,
    #[serde(rename = "bonusObronaBrzegu")]
    pub bonus_obrona_brzegu: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Oblezenie {
    pub _opis: String,
    pub wall_base_obrona: i64,
    pub wall_per_level_obrona: i64,
    pub wall_max_level: i64,
    pub wall_pancerz_fraction: f64,
    pub hill_defense_mult: f64,
    pub mountain_defense_mult: f64,
    pub fortify_obrona_bonus: i64,
    pub fortify_obrona_proc: i64,
    pub _fortify_obrona_proc_opis: String,
    pub militia_pop_fraction: f64,
    pub militia_strength_fraction: f64,
    pub siege_max_rounds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SiegeAi {
    pub t1_assault_ratio: f64,
    pub t2_build_min_ratio: f64,
    pub t3_starve_min_ratio: f64,
    pub t2_max_wait_turns: i64,
    pub units_per_extra_machine: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitPowerParams {
    pub _opis: String,
    pub charge_divisor: i64,
    pub missile_divisor: i64,
    pub hp_field_divisor: i64,
    pub hp_siege_divisor: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BattleLoot {
    pub _opis: String,
    pub recruit_cost_pct: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CombatParamsFile {
    pub _opis: String,
    pub macierz_v2: MacierzV2,
    pub tw_v3: TwV3,
    pub ss5l_legacy: Ss5lLegacy,
    pub counter_multiplier: f64,
    pub morale_przewaga_mocy: MoralePrzewagaMocy,
    pub river_attack_mult: f64,
    pub brod: Brod,
    #[serde(rename = "oblężenie")]
    pub oblezenie: Oblezenie,
    pub siege_ai: SiegeAi,
    pub unit_power: UnitPowerParams,
    pub battle_loot: BattleLoot,
}

pub fn parse_combat_params() -> Result<CombatParamsFile, serde_json::Error> {
    serde_json::from_str(COMBAT_PARAMS_JSON)
}

// ---------------------------------------------------------------------------
// terrain-combat.json  (tablica 7 rekordow terenu)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainCombatRecord {
    #[serde(rename = "Teren")]
    pub teren: String,
    #[serde(rename = "Koszt wejścia (ruch)")]
    pub koszt_wejscia_ruch: String,
    #[serde(rename = "Bonus Obrona")]
    pub bonus_obrona: String,
    #[serde(rename = "Δ Zasięg (dystansowi)")]
    pub delta_zasieg_dystansowi: String,
    #[serde(rename = "Kawaleria/Rydwan")]
    pub kawaleria_rydwan: String,
    #[serde(rename = "Efekt specjalny")]
    pub efekt_specjalny: String,
}

pub fn parse_terrain_combat() -> Result<Vec<TerrainCombatRecord>, serde_json::Error> {
    serde_json::from_str(TERRAIN_COMBAT_JSON)
}

// ---------------------------------------------------------------------------
// counters.json  (tablica 17 regul przewag)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CounterRule {
    #[serde(rename = "Typ atakujący")]
    pub typ_atakujacy: String,
    #[serde(rename = "Cel (typ)")]
    pub cel_typ: String,
    #[serde(rename = "Bonus")]
    pub bonus: String,
    #[serde(rename = "Rodzaj (Atak/Obrona)")]
    pub rodzaj_atak_obrona: String,
    #[serde(rename = "Status")]
    pub status: String,
}

pub fn parse_counters() -> Result<Vec<CounterRule>, serde_json::Error> {
    serde_json::from_str(COUNTERS_JSON)
}

// ---------------------------------------------------------------------------
// auto-battle-params.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Straty {
    #[serde(rename = "L_MAX")]
    pub l_max: f64,
    pub p_atk: f64,
    pub p_def: f64,
    #[serde(rename = "L_MIN")]
    pub l_min: f64,
    pub remis_pct: f64,
    pub coef_zwyciezca: f64,
    pub coef_przegrany: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AutoBattleParamsFile {
    pub _opis: String,
    pub _maciej_kroki: Vec<String>,
    pub kalibracja: String,
    pub straty: Straty,
}

pub fn parse_auto_battle_params() -> Result<AutoBattleParamsFile, serde_json::Error> {
    serde_json::from_str(AUTO_BATTLE_PARAMS_JSON)
}

// ---------------------------------------------------------------------------
// power-params.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerNazewnictwo {
    pub pl_ui: String,
    pub en: String,
    pub wycofane: String,
    pub decyzja: String,
    pub modul_ts: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerFormuly {
    #[serde(rename = "rekrutEkw")]
    pub rekrut_ekw: String,
    #[serde(rename = "powerBase")]
    pub power_base: String,
    pub power: String,
    pub respekt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MnoznikEpoki {
    pub _status: String,
    #[serde(rename = "1")]
    pub ep1: i64,
    #[serde(rename = "2")]
    pub ep2: i64,
    #[serde(rename = "3")]
    pub ep3: i64,
    #[serde(rename = "4")]
    pub ep4: i64,
    #[serde(rename = "5")]
    pub ep5: i64,
    #[serde(rename = "6")]
    pub ep6: i64,
    #[serde(rename = "7")]
    pub ep7: i64,
    #[serde(rename = "8")]
    pub ep8: i64,
    #[serde(rename = "9")]
    pub ep9: i64,
    #[serde(rename = "10")]
    pub ep10: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Skladnik {
    pub pkt: f64,
    pub opis: String,
    pub wojskowy: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerSkladniki {
    pub jednostka_wojskowa: Skladnik,
    pub wygrana_bitwa: Skladnik,
    pub ludek: Skladnik,
    pub rekrut_ekw_jednostki: Skladnik,
    pub miasto: Skladnik,
    pub heks_terytorium: Skladnik,
    pub budynki: Skladnik,
    pub tech_zbadane: Skladnik,
    pub ulepszenie_terenu: Skladnik,
    pub kultura_imperium: Skladnik,
    pub religia_jednosc: Skladnik,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerKalibracja {
    pub scenariusz: String,
    #[serde(rename = "powerOczekiwany")]
    pub power_oczekiwany: i64,
    pub cel: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerOpcja {
    pub wartosc: BoolOrText,
    pub typ: String,
    pub opis: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerOpcje {
    pub liczy_osadnik_w_armii: PowerOpcja,
    pub bitwa_wspolczynnik_flat: PowerOpcja,
    pub bitwa_power_model: PowerOpcja,
    pub hud_etykieta: PowerOpcja,
    pub hud_etykieta_en: PowerOpcja,
    pub mnoznik_epoki_aktywny: PowerOpcja,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerUwagi {
    pub power_vs_respekt: String,
    pub stary_model: String,
    pub panel_b: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowerParamsFile {
    pub _opis: String,
    pub _nazewnictwo: PowerNazewnictwo,
    pub _formuly: PowerFormuly,
    #[serde(rename = "mnoznikEpoki")]
    pub mnoznik_epoki: MnoznikEpoki,
    pub skladniki: PowerSkladniki,
    pub kalibracja: PowerKalibracja,
    pub opcje: PowerOpcje,
    pub uwagi: PowerUwagi,
}

pub fn parse_power_params() -> Result<PowerParamsFile, serde_json::Error> {
    serde_json::from_str(POWER_PARAMS_JSON)
}
