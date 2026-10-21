//! GENERATED 1:1 from gra/data JSON on pin edb8fb56 (copied to rust-port/engine/data).
//! Structs mirror JSON shape; keys kept verbatim via #[serde(rename)].
//! Parsed with include_str! + serde_json (exercised by tests/data_economy_society.rs).
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsDefaulty {
    #[serde(rename = "player_civ_id")]
    pub player_civ_id: String,
    #[serde(rename = "start_epoch_id")]
    pub start_epoch_id: String,
    #[serde(rename = "map_quality_default")]
    pub map_quality_default: String,
    #[serde(rename = "render_quality_bundled")]
    pub render_quality_bundled: String,
    #[serde(rename = "city_limit_base_default")]
    pub city_limit_base_default: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsSkalaMapyMalenkiTypyCywilizacjiPerEpokaKamien {
    #[serde(rename = "default")]
    pub default: i64,
    #[serde(rename = "min")]
    pub min: i64,
    #[serde(rename = "max")]
    pub max: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsSkalaMapyMalenkiTypyCywilizacjiPerEpoka {
    #[serde(rename = "kamien")]
    pub kamien: EStartParamsSkalaMapyMalenkiTypyCywilizacjiPerEpokaKamien,
    #[serde(rename = "braz")]
    pub braz: EStartParamsSkalaMapyMalenkiTypyCywilizacjiPerEpokaKamien,
    #[serde(rename = "zelazo")]
    pub zelazo: EStartParamsSkalaMapyMalenkiTypyCywilizacjiPerEpokaKamien,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsSkalaMapyMalenki {
    #[serde(rename = "rywale_ai")]
    pub rywale_ai: i64,
    #[serde(rename = "miasta_panstwa")]
    pub miasta_panstwa: i64,
    #[serde(rename = "typy_cywilizacji")]
    pub typy_cywilizacji: i64,
    #[serde(rename = "typy_cywilizacji_per_epoka")]
    pub typy_cywilizacji_per_epoka: EStartParamsSkalaMapyMalenkiTypyCywilizacjiPerEpoka,
    #[serde(rename = "hex_w")]
    pub hex_w: i64,
    #[serde(rename = "hex_h")]
    pub hex_h: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsSkalaMapy {
    #[serde(rename = "Malenki")]
    pub malenki: EStartParamsSkalaMapyMalenki,
    #[serde(rename = "Mały")]
    pub ma_y: EStartParamsSkalaMapyMalenki,
    #[serde(rename = "Standardowy")]
    pub standardowy: EStartParamsSkalaMapyMalenki,
    #[serde(rename = "Duży")]
    pub duzy: EStartParamsSkalaMapyMalenki,
    #[serde(rename = "Ogromny")]
    pub ogromny: EStartParamsSkalaMapyMalenki,
    #[serde(rename = "Super Huge")]
    pub super_huge: EStartParamsSkalaMapyMalenki,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsGeneratorE2 {
    #[serde(rename = "resource_mult_low")]
    pub resource_mult_low: f64,
    #[serde(rename = "resource_mult_normal")]
    pub resource_mult_normal: f64,
    #[serde(rename = "resource_mult_high")]
    pub resource_mult_high: f64,
    #[serde(rename = "resource_baseline_rarity")]
    pub resource_baseline_rarity: f64,
    #[serde(rename = "river_base_low")]
    pub river_base_low: i64,
    #[serde(rename = "river_base_normal")]
    pub river_base_normal: i64,
    #[serde(rename = "river_base_high")]
    pub river_base_high: i64,
    #[serde(rename = "river_scale_mala")]
    pub river_scale_mala: f64,
    #[serde(rename = "river_scale_srednia")]
    pub river_scale_srednia: f64,
    #[serde(rename = "river_scale_duza")]
    pub river_scale_duza: f64,
    #[serde(rename = "river_scale_ogromna")]
    pub river_scale_ogromna: f64,
    #[serde(rename = "desert_threshold_low")]
    pub desert_threshold_low: f64,
    #[serde(rename = "desert_threshold_normal")]
    pub desert_threshold_normal: f64,
    #[serde(rename = "desert_threshold_high")]
    pub desert_threshold_high: f64,
    #[serde(rename = "forest_threshold_low")]
    pub forest_threshold_low: f64,
    #[serde(rename = "forest_threshold_normal")]
    pub forest_threshold_normal: f64,
    #[serde(rename = "forest_threshold_high")]
    pub forest_threshold_high: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsTempoGry {
    #[serde(rename = "szybka")]
    pub szybka: f64,
    #[serde(rename = "standardowa")]
    pub standardowa: f64,
    #[serde(rename = "dluga")]
    pub dluga: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsCityLimits {
    #[serde(rename = "10")]
    pub f_10: i64,
    #[serde(rename = "15")]
    pub f_15: i64,
    #[serde(rename = "20")]
    pub f_20: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsKosztBudynkowPace {
    #[serde(rename = "niski")]
    pub niski: f64,
    #[serde(rename = "normalny")]
    pub normalny: f64,
    #[serde(rename = "wysoki")]
    pub wysoki: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsZwyciestwo {
    #[serde(rename = "ostatnia_epoka_v1")]
    pub ostatnia_epoka_v1: i64,
    #[serde(rename = "prog_dominacji_power")]
    pub prog_dominacji_power: f64,
    #[serde(rename = "dominacja_wymaga_ostatniej_epoki")]
    pub dominacja_wymaga_ostatniej_epoki: bool,
    #[serde(rename = "nauka_wymaga_rakiety")]
    pub nauka_wymaga_rakiety: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsKreatorZaawansowane {
    #[serde(rename = "seed_mode_default")]
    pub seed_mode_default: String,
    #[serde(rename = "manual_seed_default")]
    pub manual_seed_default: i64,
    #[serde(rename = "barbarians_enabled_default")]
    pub barbarians_enabled_default: bool,
    #[serde(rename = "battle_always_manual_default")]
    pub battle_always_manual_default: bool,
    #[serde(rename = "fog_debug_reveal_all_default")]
    pub fog_debug_reveal_all_default: bool,
    #[serde(rename = "victory_power_and_dominance_default")]
    pub victory_power_and_dominance_default: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParamsDecyzjeKanon {
    #[serde(rename = "e1_reset_nowa_gra")]
    pub e1_reset_nowa_gra: bool,
    #[serde(rename = "e1_tech_kaskada_epok")]
    pub e1_tech_kaskada_epok: bool,
    #[serde(rename = "e1_ziemia_preset_staly")]
    pub e1_ziemia_preset_staly: bool,
    #[serde(rename = "e1_zloza_tylko_gory")]
    pub e1_zloza_tylko_gory: bool,
    #[serde(rename = "e1_zloza_ukryte_do_epoki")]
    pub e1_zloza_ukryte_do_epoki: bool,
    #[serde(rename = "e2_barbarzyncy_do_przed_sredniowiecza")]
    pub e2_barbarzyncy_do_przed_sredniowiecza: bool,
    #[serde(rename = "e2_buntownicy_od_sredniowiecza")]
    pub e2_buntownicy_od_sredniowiecza: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EStartParams {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "defaulty")]
    pub defaulty: EStartParamsDefaulty,
    #[serde(rename = "skala_mapy")]
    pub skala_mapy: EStartParamsSkalaMapy,
    #[serde(rename = "generator_e2")]
    pub generator_e2: EStartParamsGeneratorE2,
    #[serde(rename = "tempo_gry")]
    pub tempo_gry: EStartParamsTempoGry,
    #[serde(rename = "city_limits")]
    pub city_limits: EStartParamsCityLimits,
    #[serde(rename = "koszt_budynkow_pace")]
    pub koszt_budynkow_pace: EStartParamsKosztBudynkowPace,
    #[serde(rename = "koszt_jednostek_pace")]
    pub koszt_jednostek_pace: EStartParamsKosztBudynkowPace,
    #[serde(rename = "zwyciestwo")]
    pub zwyciestwo: EStartParamsZwyciestwo,
    #[serde(rename = "kreator_zaawansowane")]
    pub kreator_zaawansowane: EStartParamsKreatorZaawansowane,
    #[serde(rename = "decyzje_kanon")]
    pub decyzje_kanon: EStartParamsDecyzjeKanon,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AiParamsTrudnoscPoziom1BonusProdukcja {
    #[serde(rename = "wartosc")]
    pub wartosc: i64,
    #[serde(rename = "sekcja")]
    pub sekcja: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AiParamsTrudnoscPoziom1BonusWalka {
    #[serde(rename = "wartosc")]
    pub wartosc: f64,
    #[serde(rename = "sekcja")]
    pub sekcja: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AiParams {
    #[serde(rename = "trudnosc_poziom1_bonus_produkcja")]
    pub trudnosc_poziom1_bonus_produkcja: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom1_bonus_nauka")]
    pub trudnosc_poziom1_bonus_nauka: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom1_startowe_jednostki")]
    pub trudnosc_poziom1_startowe_jednostki: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom1_startowe_miasta")]
    pub trudnosc_poziom1_startowe_miasta: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom1_bonus_walka")]
    pub trudnosc_poziom1_bonus_walka: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom1_agresja_mnoznik")]
    pub trudnosc_poziom1_agresja_mnoznik: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom1_dyplomacja_aktywnosc")]
    pub trudnosc_poziom1_dyplomacja_aktywnosc: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom1_cel_obranie")]
    pub trudnosc_poziom1_cel_obranie: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_bonus_produkcja")]
    pub trudnosc_poziom2_bonus_produkcja: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom2_bonus_nauka")]
    pub trudnosc_poziom2_bonus_nauka: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_startowe_jednostki")]
    pub trudnosc_poziom2_startowe_jednostki: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_startowe_miasta")]
    pub trudnosc_poziom2_startowe_miasta: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_bonus_walka")]
    pub trudnosc_poziom2_bonus_walka: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_agresja_mnoznik")]
    pub trudnosc_poziom2_agresja_mnoznik: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_dyplomacja_aktywnosc")]
    pub trudnosc_poziom2_dyplomacja_aktywnosc: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom2_cel_obranie")]
    pub trudnosc_poziom2_cel_obranie: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom3_bonus_produkcja")]
    pub trudnosc_poziom3_bonus_produkcja: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom3_bonus_nauka")]
    pub trudnosc_poziom3_bonus_nauka: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom3_startowe_jednostki")]
    pub trudnosc_poziom3_startowe_jednostki: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom3_startowe_miasta")]
    pub trudnosc_poziom3_startowe_miasta: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "trudnosc_poziom3_bonus_walka")]
    pub trudnosc_poziom3_bonus_walka: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom3_agresja_mnoznik")]
    pub trudnosc_poziom3_agresja_mnoznik: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom3_dyplomacja_aktywnosc")]
    pub trudnosc_poziom3_dyplomacja_aktywnosc: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "trudnosc_poziom3_cel_obranie")]
    pub trudnosc_poziom3_cel_obranie: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_grecy_wojsko_priorytet")]
    pub archetype_grecy_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_grecy_nauka_priorytet")]
    pub archetype_grecy_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_grecy_ekonomia_priorytet")]
    pub archetype_grecy_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_grecy_obrona_priorytet")]
    pub archetype_grecy_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_rzym_wojsko_priorytet")]
    pub archetype_rzym_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_rzym_nauka_priorytet")]
    pub archetype_rzym_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_rzym_ekonomia_priorytet")]
    pub archetype_rzym_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_rzym_obrona_priorytet")]
    pub archetype_rzym_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_chiny_wojsko_priorytet")]
    pub archetype_chiny_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_chiny_nauka_priorytet")]
    pub archetype_chiny_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_chiny_ekonomia_priorytet")]
    pub archetype_chiny_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_chiny_obrona_priorytet")]
    pub archetype_chiny_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_zulusi_wojsko_priorytet")]
    pub archetype_zulusi_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_zulusi_nauka_priorytet")]
    pub archetype_zulusi_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_zulusi_ekonomia_priorytet")]
    pub archetype_zulusi_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_zulusi_obrona_priorytet")]
    pub archetype_zulusi_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_inkowie_wojsko_priorytet")]
    pub archetype_inkowie_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_inkowie_nauka_priorytet")]
    pub archetype_inkowie_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_inkowie_ekonomia_priorytet")]
    pub archetype_inkowie_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_inkowie_obrona_priorytet")]
    pub archetype_inkowie_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_egipt_wojsko_priorytet")]
    pub archetype_egipt_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_egipt_nauka_priorytet")]
    pub archetype_egipt_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_egipt_ekonomia_priorytet")]
    pub archetype_egipt_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_egipt_obrona_priorytet")]
    pub archetype_egipt_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_sumer_wojsko_priorytet")]
    pub archetype_sumer_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_sumer_nauka_priorytet")]
    pub archetype_sumer_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_sumer_ekonomia_priorytet")]
    pub archetype_sumer_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_sumer_obrona_priorytet")]
    pub archetype_sumer_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_strach_prog_nap")]
    pub dyplomacja_strach_prog_nap: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_strach_prog_trybut")]
    pub dyplomacja_strach_prog_trybut: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_relacja_handel")]
    pub dyplomacja_relacja_handel: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_relacja_startowa_rywale")]
    pub dyplomacja_relacja_startowa_rywale: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_relacja_prog_wojna")]
    pub dyplomacja_relacja_prog_wojna: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_max_propozycji_ture")]
    pub dyplomacja_max_propozycji_ture: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "dyplomacja_zdrowie_armii_pokój")]
    pub dyplomacja_zdrowie_armii_pokoj: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_wojna_sila")]
    pub ai_diplomacja_prog_wojna_sila: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_wojna_agresja")]
    pub ai_diplomacja_prog_wojna_agresja: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_trybut")]
    pub ai_diplomacja_prog_trybut: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_pokoj_slabosc")]
    pub ai_diplomacja_prog_pokoj_slabosc: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_sojusz")]
    pub ai_diplomacja_prog_sojusz: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_handel")]
    pub ai_diplomacja_prog_handel: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_trybut_krytyczny")]
    pub ai_diplomacja_prog_trybut_krytyczny: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_trybut_agresja_max")]
    pub ai_diplomacja_prog_trybut_agresja_max: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_diplomacja_prog_handel_archetyp_min")]
    pub ai_diplomacja_prog_handel_archetyp_min: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_sojusz_obowiazek_min_ratio")]
    pub ai_sojusz_obowiazek_min_ratio: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_sojusz_obowiazek_min_ratio_pokojowy")]
    pub ai_sojusz_obowiazek_min_ratio_pokojowy: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ai_sojusz_obowiazek_max_wojny")]
    pub ai_sojusz_obowiazek_max_wojny: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ai_sojusz_obowiazek_min_zaufanie")]
    pub ai_sojusz_obowiazek_min_zaufanie: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ai_wycofanie_hp_prog")]
    pub ai_wycofanie_hp_prog: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "ekspansja_min_dystans_miast")]
    pub ekspansja_min_dystans_miast: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_min_score_hex")]
    pub ekspansja_min_score_hex: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_zagroz_zasieg")]
    pub ekspansja_zagroz_zasieg: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_heurystyka_zywnosc_pkt")]
    pub ekspansja_heurystyka_zywnosc_pkt: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_heurystyka_praca_pkt")]
    pub ekspansja_heurystyka_praca_pkt: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_heurystyka_handel_pkt")]
    pub ekspansja_heurystyka_handel_pkt: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_heurystyka_rzeka_pkt")]
    pub ekspansja_heurystyka_rzeka_pkt: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_heurystyka_surowiec_pkt")]
    pub ekspansja_heurystyka_surowiec_pkt: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ekspansja_heurystyka_granica_kara")]
    pub ekspansja_heurystyka_granica_kara: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_start_tura")]
    pub barbarzyncy_start_tura: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_max_obozy")]
    pub barbarzyncy_max_obozy: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_min_dystans_miasto")]
    pub barbarzyncy_min_dystans_miasto: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_odstep_obozow")]
    pub barbarzyncy_odstep_obozow: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_interwal_spawnu")]
    pub barbarzyncy_interwal_spawnu: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_jednostek_na_oboz")]
    pub barbarzyncy_jednostek_na_oboz: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_zasieg_kontroli")]
    pub barbarzyncy_zasieg_kontroli: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_zasieg_agresji")]
    pub barbarzyncy_zasieg_agresji: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "barbarzyncy_prog_odwrotu_hp")]
    pub barbarzyncy_prog_odwrotu_hp: AiParamsTrudnoscPoziom1BonusWalka,
    #[serde(rename = "barbarzyncy_limit_tur_osierocony")]
    pub barbarzyncy_limit_tur_osierocony: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_celtowie_wojsko_priorytet")]
    pub archetype_celtowie_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_celtowie_nauka_priorytet")]
    pub archetype_celtowie_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_celtowie_ekonomia_priorytet")]
    pub archetype_celtowie_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_celtowie_obrona_priorytet")]
    pub archetype_celtowie_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_germanie_wojsko_priorytet")]
    pub archetype_germanie_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_germanie_nauka_priorytet")]
    pub archetype_germanie_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_germanie_ekonomia_priorytet")]
    pub archetype_germanie_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_germanie_obrona_priorytet")]
    pub archetype_germanie_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_harappa_wojsko_priorytet")]
    pub archetype_harappa_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_harappa_nauka_priorytet")]
    pub archetype_harappa_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_harappa_ekonomia_priorytet")]
    pub archetype_harappa_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_harappa_obrona_priorytet")]
    pub archetype_harappa_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_hetyci_wojsko_priorytet")]
    pub archetype_hetyci_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_hetyci_nauka_priorytet")]
    pub archetype_hetyci_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_hetyci_ekonomia_priorytet")]
    pub archetype_hetyci_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_hetyci_obrona_priorytet")]
    pub archetype_hetyci_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_slowianie_wojsko_priorytet")]
    pub archetype_slowianie_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_slowianie_nauka_priorytet")]
    pub archetype_slowianie_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_slowianie_ekonomia_priorytet")]
    pub archetype_slowianie_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_slowianie_obrona_priorytet")]
    pub archetype_slowianie_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_babilonia_wojsko_priorytet")]
    pub archetype_babilonia_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_babilonia_nauka_priorytet")]
    pub archetype_babilonia_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_babilonia_ekonomia_priorytet")]
    pub archetype_babilonia_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_babilonia_obrona_priorytet")]
    pub archetype_babilonia_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_asyria_wojsko_priorytet")]
    pub archetype_asyria_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_asyria_nauka_priorytet")]
    pub archetype_asyria_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_asyria_ekonomia_priorytet")]
    pub archetype_asyria_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_asyria_obrona_priorytet")]
    pub archetype_asyria_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_fenicjanie_wojsko_priorytet")]
    pub archetype_fenicjanie_wojsko_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_fenicjanie_nauka_priorytet")]
    pub archetype_fenicjanie_nauka_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_fenicjanie_ekonomia_priorytet")]
    pub archetype_fenicjanie_ekonomia_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "archetype_fenicjanie_obrona_priorytet")]
    pub archetype_fenicjanie_obrona_priorytet: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_poziom1_prog_koszt_x")]
    pub cuda_poziom1_prog_koszt_x: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_poziom1_throttle_tur")]
    pub cuda_poziom1_throttle_tur: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_poziom2_prog_koszt_x")]
    pub cuda_poziom2_prog_koszt_x: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_poziom2_throttle_tur")]
    pub cuda_poziom2_throttle_tur: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_poziom3_prog_koszt_x")]
    pub cuda_poziom3_prog_koszt_x: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_poziom3_throttle_tur")]
    pub cuda_poziom3_throttle_tur: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "cuda_stuck_relax_tur_max")]
    pub cuda_stuck_relax_tur_max: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ludy_morza_max_obozy")]
    pub ludy_morza_max_obozy: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ludy_morza_rajd_zasieg")]
    pub ludy_morza_rajd_zasieg: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ludy_morza_rajd_okres_latwy")]
    pub ludy_morza_rajd_okres_latwy: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ludy_morza_rajd_okres_normalny")]
    pub ludy_morza_rajd_okres_normalny: AiParamsTrudnoscPoziom1BonusProdukcja,
    #[serde(rename = "ludy_morza_rajd_okres_trudny")]
    pub ludy_morza_rajd_okres_trudny: AiParamsTrudnoscPoziom1BonusProdukcja,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UiParamsPanelMiastaFontScale {
    #[serde(rename = "label")]
    pub label: String,
    #[serde(rename = "px")]
    pub px: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UiParamsPanelMiasta {
    #[serde(rename = "rush_cost_mnoznik")]
    pub rush_cost_mnoznik: f64,
    #[serde(rename = "okolica_promien")]
    pub okolica_promien: i64,
    #[serde(rename = "okolica_hex_px")]
    pub okolica_hex_px: i64,
    #[serde(rename = "font_scale")]
    pub font_scale: Vec<UiParamsPanelMiastaFontScale>,
    #[serde(rename = "font_scale_domyslna_px")]
    pub font_scale_domyslna_px: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UiParamsMenuUstawienia {
    #[serde(rename = "key")]
    pub key: String,
    #[serde(rename = "label")]
    pub label: String,
    #[serde(rename = "opts")]
    pub opts: Vec<String>,
    #[serde(rename = "descs")]
    pub descs: Vec<String>,
    #[serde(rename = "domyslny")]
    pub domyslny: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UiParamsMenu {
    #[serde(rename = "wersja")]
    pub wersja: String,
    #[serde(rename = "etap")]
    pub etap: String,
    #[serde(rename = "muzyka_fade_in_ms")]
    pub muzyka_fade_in_ms: i64,
    #[serde(rename = "muzyka_opoznienie_startu_ms")]
    pub muzyka_opoznienie_startu_ms: i64,
    #[serde(rename = "ustawienia")]
    pub ustawienia: Vec<UiParamsMenuUstawienia>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UiParamsNowaGra {
    #[serde(rename = "ustawienia")]
    pub ustawienia: Vec<UiParamsMenuUstawienia>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UiParams {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "panel_miasta")]
    pub panel_miasta: UiParamsPanelMiasta,
    #[serde(rename = "menu")]
    pub menu: UiParamsMenu,
    #[serde(rename = "nowa_gra")]
    pub nowa_gra: UiParamsNowaGra,
}

/// Parse ../../data/e-start-params.json (embedded via include_str!).
pub fn parse_e_start_params() -> Result<EStartParams, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/e-start-params.json"))
}

/// Parse ../../data/ai-params.json (embedded via include_str!).
pub fn parse_ai_params() -> Result<AiParams, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/ai-params.json"))
}

/// Parse ../../data/ui-params.json (embedded via include_str!).
pub fn parse_ui_params() -> Result<UiParams, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/ui-params.json"))
}
