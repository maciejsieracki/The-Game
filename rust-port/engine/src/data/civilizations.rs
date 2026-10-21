// GENEROWANE 1:1 z ksztaltu JSON na pinie edb8fb56 (gra/data/*.json) przez skrypt gen.py.
// Nie edytowac recznie bez ponownego wygenerowania i testu round-trip.
#![allow(dead_code)]

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

/// Liczba: JSON bez czesci dziesietnej -> Int, z czescia dziesietna -> Float (zachowany typ z JSON).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Num {
    Int(i64),
    Float(f64),
}

// ===== civs.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Wodzowie {
    #[serde(rename = "kamien")]
    pub kamien: String,
    #[serde(rename = "braz")]
    pub braz: String,
    #[serde(rename = "zelazo")]
    pub zelazo: String,
    #[serde(rename = "antyk")]
    pub antyk: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum WartoscValue {
    Float(f64),
    List(Vec<String>),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BonusyItem {
    #[serde(rename = "typ")]
    pub typ: String,
    #[serde(rename = "cel")]
    pub cel: String,
    #[serde(rename = "wartosc")]
    pub wartosc: WartoscValue,
    #[serde(rename = "opis")]
    pub opis: String,
    #[serde(rename = "realizuje")]
    pub realizuje: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CywilizacjeItem {
    #[serde(rename = "Cywilizacja")]
    pub cywilizacja: String,
    #[serde(rename = "Styl / charakter")]
    pub styl_charakter: String,
    #[serde(rename = "Jednostka specjalna")]
    pub jednostka_specjalna: String,
    #[serde(rename = "Bonus startowy")]
    pub bonus_startowy: String,
    #[serde(rename = "Bonusy/minusy (do dopracowania)")]
    pub bonusy_minusy_do_dopracowania: String,
    #[serde(rename = "Uwagi")]
    pub uwagi: Option<String>,
    #[serde(rename = "Religia")]
    pub religia: String,
    #[serde(rename = "mnoznikHandelPieniadz")]
    pub mnoznik_handel_pieniadz: f64,
    #[serde(rename = "ikonaId")]
    pub ikona_id: String,
    #[serde(rename = "wodzowiePula")]
    pub wodzowie_pula: Vec<String>,
    #[serde(rename = "wodzowie")]
    pub wodzowie: Wodzowie,
    #[serde(rename = "kolorHex")]
    pub kolor_hex: String,
    #[serde(rename = "bonusy")]
    pub bonusy: Vec<BonusyItem>,
    #[serde(rename = "typCywilizacji")]
    pub typ_cywilizacji: String,
    #[serde(rename = "archetyp")]
    pub archetyp: String,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: String,
    #[serde(rename = "epokiStartowe")]
    pub epoki_startowe: Vec<String>,
    #[serde(rename = "nazwyMiast")]
    pub nazwy_miast: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartGryItem {
    #[serde(rename = "Parametr")]
    pub parametr: String,
    #[serde(rename = "Wartość")]
    pub wartosc: String,
    #[serde(rename = "Uwagi")]
    pub uwagi: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivsFile {
    #[serde(rename = "cywilizacje")]
    pub cywilizacje: Vec<CywilizacjeItem>,
    #[serde(rename = "start_gry")]
    pub start_gry: Vec<StartGryItem>,
}

// ===== civ-matrix.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Meta {
    #[serde(rename = "version")]
    pub version: String,
    #[serde(rename = "source")]
    pub source: String,
    #[serde(rename = "formula_mul_proc")]
    pub formula_mul_proc: String,
    #[serde(rename = "formula_mul_abs")]
    pub formula_mul_abs: String,
    #[serde(rename = "formula_add")]
    pub formula_add: String,
    #[serde(rename = "formula_flag")]
    pub formula_flag: String,
    #[serde(rename = "kolumny")]
    pub kolumny: i64,
    #[serde(rename = "cywilizacje")]
    pub cywilizacje: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ParamDefsValue {
    #[serde(rename = "domena")]
    pub domena: String,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "modul")]
    pub modul: String,
    #[serde(rename = "formula")]
    pub formula: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CywilizacjeItem2 {
    #[serde(rename = "Cywilizacja")]
    pub cywilizacja: String,
    #[serde(rename = "typCywilizacji")]
    pub typ_cywilizacji: String,
    #[serde(rename = "ikonaId")]
    pub ikona_id: String,
    #[serde(rename = "tier")]
    pub tier: i64,
    #[serde(rename = "params")]
    pub params: BTreeMap<String, Num>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivMatrixFile {
    #[serde(rename = "_meta")]
    pub meta: Meta,
    #[serde(rename = "paramDefs")]
    pub param_defs: BTreeMap<String, ParamDefsValue>,
    #[serde(rename = "defaults")]
    pub defaults: BTreeMap<String, Num>,
    #[serde(rename = "cywilizacje")]
    pub cywilizacje: Vec<CywilizacjeItem2>,
}

// ===== civ-params.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CywilizacjeItem3 {
    #[serde(rename = "Cywilizacja")]
    pub cywilizacja: String,
    #[serde(rename = "preferowaneBudynki")]
    pub preferowane_budynki: String,
    #[serde(rename = "preferowaneJednostki")]
    pub preferowane_jednostki: String,
    #[serde(rename = "modWzrostu")]
    pub mod_wzrostu: Num,
    #[serde(rename = "modEkonomii")]
    pub mod_ekonomii: Num,
    #[serde(rename = "uwagi")]
    pub uwagi: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Meta2 {
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivParamsFile {
    #[serde(rename = "cywilizacje")]
    pub cywilizacje: Vec<CywilizacjeItem3>,
    #[serde(rename = "_meta")]
    pub meta: Meta2,
}

// ===== civ-ai.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CywilizacjeItem4 {
    #[serde(rename = "Cywilizacja")]
    pub cywilizacja: String,
    #[serde(rename = "agresywnosc")]
    pub agresywnosc: i64,
    #[serde(rename = "ekspansywnosc")]
    pub ekspansywnosc: i64,
    #[serde(rename = "priorytetMilitarny")]
    pub priorytet_militarny: i64,
    #[serde(rename = "priorytetEkonomia")]
    pub priorytet_ekonomia: i64,
    #[serde(rename = "priorytetNauka")]
    pub priorytet_nauka: i64,
    #[serde(rename = "tolerancjaRyzyka")]
    pub tolerancja_ryzyka: i64,
    #[serde(rename = "sklonnoscDoPodboju")]
    pub sklonnosc_do_podboju: i64,
    #[serde(rename = "profilMapy")]
    pub profil_mapy: String,
    #[serde(rename = "uwagi")]
    pub uwagi: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Meta3 {
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivAiFile {
    #[serde(rename = "cywilizacje")]
    pub cywilizacje: Vec<CywilizacjeItem4>,
    #[serde(rename = "_meta")]
    pub meta: Meta3,
}

// ===== diplomacy.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Params {
    #[serde(rename = "handelZawarcie_zaufanie")]
    pub handel_zawarcie_zaufanie: i64,
    #[serde(rename = "pomocSojusznikowi_zaufanie")]
    pub pomoc_sojusznikowi_zaufanie: i64,
    #[serde(rename = "wspolnyWrogNawiazanie_zaufanie")]
    pub wspolny_wrog_nawiazanie_zaufanie: i64,
    #[serde(rename = "dar_zaufanie")]
    pub dar_zaufanie: i64,
    #[serde(rename = "zlamanaPaktGracz_zaufanie")]
    pub zlamana_pakt_gracz_zaufanie: i64,
    #[serde(rename = "zlamanaPaktAI_zaufanie")]
    pub zlamana_pakt_ai_zaufanie: i64,
    #[serde(rename = "zdrada_zaufanie")]
    pub zdrada_zaufanie: i64,
    #[serde(rename = "szpiegWykryty_zaufanie")]
    pub szpieg_wykryty_zaufanie: i64,
    #[serde(rename = "rywalizacjaTenSamTyp_zaufanie")]
    pub rywalizacja_ten_sam_typ_zaufanie: i64,
    #[serde(rename = "miastoPanstwoSameCiv_zaufanie")]
    pub miasto_panstwo_same_civ_zaufanie: i64,
    #[serde(rename = "roznicaKulturowa_zaufanie")]
    pub roznica_kulturowa_zaufanie: i64,
    #[serde(rename = "przewagaMilitarna_respekt")]
    pub przewaga_militarna_respekt: i64,
    #[serde(rename = "slabszyMilitarnie_respekt")]
    pub slabszy_militarnie_respekt: i64,
    #[serde(rename = "wygraBitwa_respekt")]
    pub wygra_bitwa_respekt: i64,
    #[serde(rename = "trybut_respekt")]
    pub trybut_respekt: i64,
    #[serde(rename = "wspolnyWrogAkceptacja_respekt")]
    pub wspolny_wrog_akceptacja_respekt: i64,
    #[serde(rename = "handel_zaufanie_perTura")]
    pub handel_zaufanie_per_tura: i64,
    #[serde(rename = "sojusz_zaufanie_perTura")]
    pub sojusz_zaufanie_per_tura: i64,
    #[serde(rename = "nap_zaufanie_perTura")]
    pub nap_zaufanie_per_tura: i64,
    #[serde(rename = "pokoj_zaufanie_perTura")]
    pub pokoj_zaufanie_per_tura: i64,
    #[serde(rename = "aktywnyPakt_zaufanie_perTura")]
    pub aktywny_pakt_zaufanie_per_tura: i64,
    #[serde(rename = "dobraWola_zaufanie_perTura")]
    pub dobra_wola_zaufanie_per_tura: i64,
    #[serde(rename = "wspolnyWrog_zaufanie_perTura")]
    pub wspolny_wrog_zaufanie_per_tura: i64,
    #[serde(rename = "wspolnaReligia_zaufanie_perTura")]
    pub wspolna_religia_zaufanie_per_tura: f64,
    #[serde(rename = "odmiennaReligia_zaufanie_perTura")]
    pub odmienna_religia_zaufanie_per_tura: f64,
    #[serde(rename = "ekspansjaGranica_zaufanie_perTura")]
    pub ekspansja_granica_zaufanie_per_tura: i64,
    #[serde(rename = "urazyHistoryczne_zaufanie_perTura")]
    pub urazy_historyczne_zaufanie_per_tura: i64,
    #[serde(rename = "progSojuszZaufanie")]
    pub prog_sojusz_zaufanie: i64,
    #[serde(rename = "progWymianaTechZaufanie")]
    pub prog_wymiana_tech_zaufanie: i64,
    #[serde(rename = "progWasalizacjaRespekt")]
    pub prog_wasalizacja_respekt: i64,
    #[serde(rename = "progWchloniecieRespekt")]
    pub prog_wchloniecie_respekt: i64,
    #[serde(rename = "progMinimalnyRelacja")]
    pub prog_minimalny_relacja: i64,
    #[serde(rename = "progSojuszRelacja")]
    pub prog_sojusz_relacja: i64,
    #[serde(rename = "progUmowaMinRelacja")]
    pub prog_umowa_min_relacja: i64,
    #[serde(rename = "startZaufanie")]
    pub start_zaufanie: i64,
    #[serde(rename = "startRespekt")]
    pub start_respekt: i64,
    #[serde(rename = "mnoznikZaufania")]
    pub mnoznik_zaufania: i64,
    #[serde(rename = "mnoznikRespektu")]
    pub mnoznik_respektu: i64,
    #[serde(rename = "mnoznikPodarunku")]
    pub mnoznik_podarunku: i64,
    #[serde(rename = "turyEfektuPodarunku")]
    pub tury_efektu_podarunku: i64,
    #[serde(rename = "progPoboczneAkceptacja")]
    pub prog_poboczne_akceptacja: i64,
    #[serde(rename = "progPoboczneHandel")]
    pub prog_poboczne_handel: i64,
    #[serde(rename = "progPoboczneWojna")]
    pub prog_poboczne_wojna: i64,
    #[serde(rename = "progNapRelacja")]
    pub prog_nap_relacja: i64,
    #[serde(rename = "progHandelRelacja")]
    pub prog_handel_relacja: i64,
    #[serde(rename = "progSojuszPartnerRwMin")]
    pub prog_sojusz_partner_rw_min: f64,
    #[serde(rename = "progSojuszPartnerRwMax")]
    pub prog_sojusz_partner_rw_max: f64,
    #[serde(rename = "progSojuszPremiaSilniejszyMax")]
    pub prog_sojusz_premia_silniejszy_max: f64,
    #[serde(rename = "progSojuszPremiaMilSkok")]
    pub prog_sojusz_premia_mil_skok: f64,
    #[serde(rename = "progSojuszPremiaRespektSkok")]
    pub prog_sojusz_premia_respekt_skok: f64,
    #[serde(rename = "progSojuszSlabyProponentMilRatio")]
    pub prog_sojusz_slaby_proponent_mil_ratio: f64,
    #[serde(rename = "progSojuszPremiaSilniejszyInny")]
    pub prog_sojusz_premia_silniejszy_inny: f64,
    #[serde(rename = "progSojuszWillingnessMin")]
    pub prog_sojusz_willingness_min: f64,
    #[serde(rename = "progSojuszKaraSilniejszyMax")]
    pub prog_sojusz_kara_silniejszy_max: f64,
    #[serde(rename = "progSojuszKaraMilSkok")]
    pub prog_sojusz_kara_mil_skok: f64,
    #[serde(rename = "progSojuszKaraAllySkok")]
    pub prog_sojusz_kara_ally_skok: f64,
    #[serde(rename = "progSojuszHegemonMilRatio")]
    pub prog_sojusz_hegemon_mil_ratio: f64,
    #[serde(rename = "progSojuszHegemonProposerMaxMil")]
    pub prog_sojusz_hegemon_proposer_max_mil: f64,
    #[serde(rename = "progSojuszPremiaGracz2xMilRatio")]
    pub prog_sojusz_premia_gracz2x_mil_ratio: i64,
    #[serde(rename = "progSojuszPremiaGracz2xMinZaufanie")]
    pub prog_sojusz_premia_gracz2x_min_zaufanie: i64,
    #[serde(rename = "progSojuszPremiaGracz2xBonus")]
    pub prog_sojusz_premia_gracz2x_bonus: f64,
    #[serde(rename = "progSojuszPremiaGracz3xMilRatio")]
    pub prog_sojusz_premia_gracz3x_mil_ratio: f64,
    #[serde(rename = "progSojuszPremiaGracz3xMinZaufanie")]
    pub prog_sojusz_premia_gracz3x_min_zaufanie: i64,
    #[serde(rename = "progSojuszPremiaGracz3xBonus")]
    pub prog_sojusz_premia_gracz3x_bonus: f64,
    #[serde(rename = "progTrybutMinGoldPerTurn")]
    pub prog_trybut_min_gold_per_turn: i64,
    #[serde(rename = "progTrybutZadanieMinRespekt")]
    pub prog_trybut_zadanie_min_respekt: i64,
    #[serde(rename = "progTrybutOfertaNearWarRatio")]
    pub prog_trybut_oferta_near_war_ratio: f64,
    #[serde(rename = "progTrybutOfertaNearWarZaufanie")]
    pub prog_trybut_oferta_near_war_zaufanie: i64,
    #[serde(rename = "progTrybutOfertaMinGold")]
    pub prog_trybut_oferta_min_gold: i64,
    #[serde(rename = "progTrybutOfertaBaseGold")]
    pub prog_trybut_oferta_base_gold: i64,
    #[serde(rename = "progTrybutOfertaEpokaGold")]
    pub prog_trybut_oferta_epoka_gold: i64,
    #[serde(rename = "progHandelWillingnessMin")]
    pub prog_handel_willingness_min: f64,
    #[serde(rename = "progNamowWojneZaufanie")]
    pub prog_namow_wojne_zaufanie: i64,
    #[serde(rename = "progNamowWojneBribeBase")]
    pub prog_namow_wojne_bribe_base: i64,
    #[serde(rename = "progGraniceZaufanie")]
    pub prog_granice_zaufanie: i64,
    #[serde(rename = "progGraniceRelacja")]
    pub prog_granice_relacja: i64,
    #[serde(rename = "progGraniceWojskoweRespekt")]
    pub prog_granice_wojskowe_respekt: i64,
    #[serde(rename = "karaPrzemarszNieautoryzowany_zaufanie_perTura")]
    pub kara_przemarsz_nieautoryzowany_zaufanie_per_tura: i64,
    #[serde(rename = "progUltimatumMilitaryRatio")]
    pub prog_ultimatum_military_ratio: f64,
    #[serde(rename = "progUltimatumMinGold")]
    pub prog_ultimatum_min_gold: i64,
    #[serde(rename = "progWasalDefaultGoldPerTurn")]
    pub prog_wasal_default_gold_per_turn: i64,
    #[serde(rename = "graczWchlonieciePoWasaluTur")]
    pub gracz_wchloniecie_po_wasalu_tur: i64,
    #[serde(rename = "graczWchloniecieKosztBaza")]
    pub gracz_wchloniecie_koszt_baza: i64,
    #[serde(rename = "graczWchloniecieKosztPerLudnosc")]
    pub gracz_wchloniecie_koszt_per_ludnosc: i64,
    #[serde(rename = "graczWchloniecieKosztMin")]
    pub gracz_wchloniecie_koszt_min: i64,
    #[serde(rename = "wiarygodnoscSkalaMin")]
    pub wiarygodnosc_skala_min: i64,
    #[serde(rename = "wiarygodnoscSkalaMax")]
    pub wiarygodnosc_skala_max: i64,
    #[serde(rename = "wiarygodnoscProgWzorCnoty")]
    pub wiarygodnosc_prog_wzor_cnoty: i64,
    #[serde(rename = "wiarygodnoscProgWiarolomny")]
    pub wiarygodnosc_prog_wiarolomny: i64,
    #[serde(rename = "wiarygodnoscStartLatwy")]
    pub wiarygodnosc_start_latwy: i64,
    #[serde(rename = "wiarygodnoscStartNormalny")]
    pub wiarygodnosc_start_normalny: i64,
    #[serde(rename = "wiarygodnoscStartTrudny")]
    pub wiarygodnosc_start_trudny: i64,
    #[serde(rename = "wiarygodnoscN1BezOstrzezenia")]
    pub wiarygodnosc_n1_bez_ostrzezenia: i64,
    #[serde(rename = "wiarygodnoscN1KarencjaTur")]
    pub wiarygodnosc_n1_karencja_tur: i64,
    #[serde(rename = "wiarygodnoscN2ZlamaniePaktuNap")]
    pub wiarygodnosc_n2_zlamanie_paktu_nap: i64,
    #[serde(rename = "wiarygodnoscN2ZlamaniePaktuSojusz")]
    pub wiarygodnosc_n2_zlamanie_paktu_sojusz: i64,
    #[serde(rename = "wiarygodnoscN3AtakWOknieKarencji")]
    pub wiarygodnosc_n3_atak_woknie_karencji: i64,
    #[serde(rename = "wiarygodnoscN3KarencjaBezterminoweTur")]
    pub wiarygodnosc_n3_karencja_bezterminowe_tur: i64,
    #[serde(rename = "wiarygodnoscN4OdmowaObowiazkuSojuszu")]
    pub wiarygodnosc_n4_odmowa_obowiazku_sojuszu: i64,
    #[serde(rename = "wiarygodnoscN5ZerwanieTraktatCzasowy")]
    pub wiarygodnosc_n5_zerwanie_traktat_czasowy: i64,
    #[serde(rename = "wiarygodnoscN5ZerwanieHandelCzasowy")]
    pub wiarygodnosc_n5_zerwanie_handel_czasowy: i64,
    #[serde(rename = "wiarygodnoscN6NiedotrzymanieHandluCyklicznego")]
    pub wiarygodnosc_n6_niedotrzymanie_handlu_cyklicznego: i64,
    #[serde(rename = "wiarygodnoscN6ProgTurZRzedu")]
    pub wiarygodnosc_n6_prog_tur_zrzedu: i64,
    #[serde(rename = "wiarygodnoscN7NieautoryzowanyPrzemarsz")]
    pub wiarygodnosc_n7_nieautoryzowany_przemarsz: i64,
    #[serde(rename = "wiarygodnoscOdwetOknoTur")]
    pub wiarygodnosc_odwet_okno_tur: i64,
    #[serde(rename = "wiarygodnoscS1SojuszPerTure")]
    pub wiarygodnosc_s1_sojusz_per_ture: i64,
    #[serde(rename = "wiarygodnoscS2NapPerTure")]
    pub wiarygodnosc_s2_nap_per_ture: f64,
    #[serde(rename = "wiarygodnoscS3HandelPerTureLatwy")]
    pub wiarygodnosc_s3_handel_per_ture_latwy: f64,
    #[serde(rename = "wiarygodnoscS3HandelPerTureNormalny")]
    pub wiarygodnosc_s3_handel_per_ture_normalny: f64,
    #[serde(rename = "wiarygodnoscS3HandelPerTureTrudny")]
    pub wiarygodnosc_s3_handel_per_ture_trudny: f64,
    #[serde(rename = "wiarygodnoscS4PrzemarszPerTureLatwy")]
    pub wiarygodnosc_s4_przemarsz_per_ture_latwy: f64,
    #[serde(rename = "wiarygodnoscS4PrzemarszPerTureNormalny")]
    pub wiarygodnosc_s4_przemarsz_per_ture_normalny: f64,
    #[serde(rename = "wiarygodnoscS4PrzemarszPerTureTrudny")]
    pub wiarygodnosc_s4_przemarsz_per_ture_trudny: f64,
    #[serde(rename = "wiarygodnoscP1FiniszSojusz")]
    pub wiarygodnosc_p1_finisz_sojusz: i64,
    #[serde(rename = "wiarygodnoscP2FiniszNap")]
    pub wiarygodnosc_p2_finisz_nap: i64,
    #[serde(rename = "wiarygodnoscP2FiniszHandel")]
    pub wiarygodnosc_p2_finisz_handel: i64,
    #[serde(rename = "wiarygodnoscP3FiniszHandelCykliczny")]
    pub wiarygodnosc_p3_finisz_handel_cykliczny: i64,
    #[serde(rename = "wiarygodnoscP4BezWojny30Tur")]
    pub wiarygodnosc_p4_bez_wojny30_tur: i64,
    #[serde(rename = "wiarygodnoscP4OknoBezWojnyTur")]
    pub wiarygodnosc_p4_okno_bez_wojny_tur: i64,
    #[serde(rename = "wiarygodnoscP5PomocSojusznikowi")]
    pub wiarygodnosc_p5_pomoc_sojusznikowi: i64,
    #[serde(rename = "wiarygodnoscCzasZapomnieniaKaraLatwy")]
    pub wiarygodnosc_czas_zapomnienia_kara_latwy: i64,
    #[serde(rename = "wiarygodnoscCzasZapomnieniaKaraNormalny")]
    pub wiarygodnosc_czas_zapomnienia_kara_normalny: i64,
    #[serde(rename = "wiarygodnoscCzasZapomnieniaKaraTrudny")]
    pub wiarygodnosc_czas_zapomnienia_kara_trudny: i64,
    #[serde(rename = "wiarygodnoscCzasZapomnieniaNagrodaLatwy")]
    pub wiarygodnosc_czas_zapomnienia_nagroda_latwy: i64,
    #[serde(rename = "wiarygodnoscCzasZapomnieniaNagrodaNormalny")]
    pub wiarygodnosc_czas_zapomnienia_nagroda_normalny: i64,
    #[serde(rename = "wiarygodnoscCzasZapomnieniaNagrodaTrudny")]
    pub wiarygodnosc_czas_zapomnienia_nagroda_trudny: i64,
    #[serde(rename = "wiarygodnoscTrwalaPodlogaProcent")]
    pub wiarygodnosc_trwala_podloga_procent: f64,
    #[serde(rename = "wiarygodnoscZaufanieDzielnikPerTura")]
    pub wiarygodnosc_zaufanie_dzielnik_per_tura: i64,
    #[serde(rename = "wiarygodnoscTempoAmplituda")]
    pub wiarygodnosc_tempo_amplituda: f64,
    #[serde(rename = "wiarygodnoscZaufanieDryfNa100")]
    pub wiarygodnosc_zaufanie_dryf_na100: f64,
    #[serde(rename = "wiarygodnoscProgSojuszMin")]
    pub wiarygodnosc_prog_sojusz_min: i64,
    #[serde(rename = "wiarygodnoscProgNapMin")]
    pub wiarygodnosc_prog_nap_min: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HandelZloze {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "dostep_scope")]
    pub dostep_scope: String,
    #[serde(rename = "prog_relacja_min")]
    pub prog_relacja_min: i64,
    #[serde(rename = "kurs_relacja_baza")]
    pub kurs_relacja_baza: i64,
    #[serde(rename = "cena_baza")]
    pub cena_baza: BTreeMap<String, i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HandelWaluta {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "kurs_relacja_baza")]
    pub kurs_relacja_baza: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnZloto {
    #[serde(rename = "skala")]
    pub skala: i64,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnPraca {
    #[serde(rename = "skala")]
    pub skala: i64,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnTech {
    #[serde(rename = "pole")]
    pub pole: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "tempo")]
    pub tempo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnZloze {
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "scope")]
    pub scope: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnUlepszenie {
    #[serde(rename = "pole")]
    pub pole: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "handel")]
    pub handel: bool,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnJednostka {
    #[serde(rename = "pole")]
    pub pole: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnBudynek {
    #[serde(rename = "pole")]
    pub pole: String,
    #[serde(rename = "skalowanie")]
    pub skalowanie: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "handel")]
    pub handel: bool,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnSurowiecBoolean {
    #[serde(rename = "regula")]
    pub regula: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnZywnosc {
    #[serde(rename = "jednostki_na_pn")]
    pub jednostki_na_pn: i64,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "decyzja")]
    pub decyzja: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DostepZlozeWojna {
    #[serde(rename = "utrata_w_trakcie_wojny")]
    pub utrata_w_trakcie_wojny: bool,
    #[serde(rename = "wymaga_renegocjacji_po_pokoju")]
    pub wymaga_renegocjacji_po_pokoju: bool,
    #[serde(rename = "decyzja")]
    pub decyzja: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WartoscKatalog {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "decyzja")]
    pub decyzja: String,
    #[serde(rename = "pn_zloto")]
    pub pn_zloto: PnZloto,
    #[serde(rename = "pn_praca")]
    pub pn_praca: PnPraca,
    #[serde(rename = "pn_tech")]
    pub pn_tech: PnTech,
    #[serde(rename = "pn_zloze")]
    pub pn_zloze: PnZloze,
    #[serde(rename = "pn_ulepszenie")]
    pub pn_ulepszenie: PnUlepszenie,
    #[serde(rename = "pn_jednostka")]
    pub pn_jednostka: PnJednostka,
    #[serde(rename = "pn_budynek")]
    pub pn_budynek: PnBudynek,
    #[serde(rename = "pn_budynek_skalowanie")]
    pub pn_budynek_skalowanie: f64,
    #[serde(rename = "pn_surowiec_boolean")]
    pub pn_surowiec_boolean: PnSurowiecBoolean,
    #[serde(rename = "pn_zywnosc")]
    pub pn_zywnosc: PnZywnosc,
    #[serde(rename = "handel_prog_relacja")]
    pub handel_prog_relacja: i64,
    #[serde(rename = "dostep_zloze_wojna")]
    pub dostep_zloze_wojna: DostepZlozeWojna,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PnRelacja {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "pn_na_zaufanie")]
    pub pn_na_zaufanie: i64,
    #[serde(rename = "max_zaufanie_na_ture")]
    pub max_zaufanie_na_ture: i64,
    #[serde(rename = "min_nadmiar_pn")]
    pub min_nadmiar_pn: i64,
    #[serde(rename = "prog_dar_relacja")]
    pub prog_dar_relacja: i64,
    #[serde(rename = "dobra_wola_po_wymianie")]
    pub dobra_wola_po_wymianie: bool,
    #[serde(rename = "dobra_wola_tur")]
    pub dobra_wola_tur: i64,
    #[serde(rename = "dobra_wola_min_nadmiar_pn")]
    pub dobra_wola_min_nadmiar_pn: i64,
    #[serde(rename = "dobra_wola_zaufanie_per_tura")]
    pub dobra_wola_zaufanie_per_tura: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AkcjeDyplomatyczneItem {
    #[serde(rename = "Akcja")]
    pub akcja: String,
    #[serde(rename = "Opis")]
    pub opis: String,
    #[serde(rename = "Dostępne: Główni rywale")]
    pub dostepne_glowni_rywale: String,
    #[serde(rename = "Dostępne: Poboczni")]
    pub dostepne_poboczni: String,
    #[serde(rename = "Koszt")]
    pub koszt: String,
    #[serde(rename = "Efekt")]
    pub efekt: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ParametryRelacjiItem {
    #[serde(rename = "Parametr")]
    pub parametr: String,
    #[serde(rename = "Zakres")]
    pub zakres: String,
    #[serde(rename = "Wartość startowa")]
    pub wartosc_startowa: i64,
    #[serde(rename = "Opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ZmianaValue {
    Int(i64),
    Str(String),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ZmianyParametrowItem {
    #[serde(rename = "Zdarzenie / Działanie")]
    pub zdarzenie_dzialanie: String,
    #[serde(rename = "Parametr")]
    pub parametr: String,
    #[serde(rename = "Zmiana")]
    pub zmiana: ZmianaValue,
    #[serde(rename = "Znak (+/−)")]
    pub znak: String,
    #[serde(rename = "Typ (co turę / jednorazowo)")]
    pub typ_co_ture_jednorazowo: String,
    #[serde(rename = "Uwagi")]
    pub uwagi: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RespektCzynnikiItem {
    #[serde(rename = "Czynnik")]
    pub czynnik: String,
    #[serde(rename = "Waga (%)")]
    pub waga: i64,
    #[serde(rename = "Opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordsItem {
    #[serde(rename = "Komponent Potegi")]
    pub komponent_potegi: String,
    #[serde(rename = "Klucz")]
    pub klucz: String,
    #[serde(rename = "Waga (%)")]
    pub waga: Option<i64>,
    #[serde(rename = "Opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct A {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "records")]
    pub records: Vec<RecordsItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum WartoscValue2 {
    Int(i64),
    Str(String),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordsItem2 {
    #[serde(rename = "Parametr")]
    pub parametr: String,
    #[serde(rename = "Wartość")]
    pub wartosc: WartoscValue2,
    #[serde(rename = "Opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct B {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "records")]
    pub records: Vec<RecordsItem2>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordsItem3 {
    #[serde(rename = "Akcja / warunek")]
    pub akcja_warunek: String,
    #[serde(rename = "Próg")]
    pub prog: i64,
    #[serde(rename = "Opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct C {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "records")]
    pub records: Vec<RecordsItem3>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordsItem4 {
    #[serde(rename = "Stan / zdarzenie ciągłe")]
    pub stan_zdarzenie_ciagle: String,
    #[serde(rename = "Δ Zaufanie/turę")]
    pub zaufanie_ture: Num,
    #[serde(rename = "Uwagi")]
    pub uwagi: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct D {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "records")]
    pub records: Vec<RecordsItem4>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordsItem5 {
    #[serde(rename = "Mnożnik / parametr")]
    pub mnoznik_parametr: String,
    #[serde(rename = "Wartość")]
    pub wartosc: i64,
    #[serde(rename = "Opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct E {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "records")]
    pub records: Vec<RecordsItem5>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecordsItem6 {
    #[serde(rename = "DANE WEJŚCIOWE (żółte = edytowalne)")]
    pub dane_wejsciowe_zolte_edytowalne: String,
    #[serde(rename = "WYNIKI (zielone = formuły)")]
    pub wyniki_zielone_formuly: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct F {
    #[serde(rename = "name")]
    pub name: String,
    #[serde(rename = "records")]
    pub records: Vec<RecordsItem6>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PanelSterowania {
    #[serde(rename = "A")]
    pub a: A,
    #[serde(rename = "B")]
    pub b: B,
    #[serde(rename = "C")]
    pub c: C,
    #[serde(rename = "D")]
    pub d: D,
    #[serde(rename = "E")]
    pub e: E,
    #[serde(rename = "F")]
    pub f: F,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PerNacjaItem {
    #[serde(rename = "Cywilizacja")]
    pub cywilizacja: String,
    #[serde(rename = "sklonnoscSojusze")]
    pub sklonnosc_sojusze: i64,
    #[serde(rename = "lojalnosc")]
    pub lojalnosc: i64,
    #[serde(rename = "progWojny")]
    pub prog_wojny: i64,
    #[serde(rename = "pamietliwosc")]
    pub pamietliwosc: i64,
    #[serde(rename = "otwartoscHandel")]
    pub otwartosc_handel: i64,
    #[serde(rename = "nastawienieBazowe")]
    pub nastawienie_bazowe: i64,
    #[serde(rename = "uwagi")]
    pub uwagi: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DiplomacyFile {
    #[serde(rename = "params")]
    pub params: Params,
    #[serde(rename = "handel_zloze")]
    pub handel_zloze: HandelZloze,
    #[serde(rename = "handel_waluta")]
    pub handel_waluta: HandelWaluta,
    #[serde(rename = "wartosc_katalog")]
    pub wartosc_katalog: WartoscKatalog,
    #[serde(rename = "pn_relacja")]
    pub pn_relacja: PnRelacja,
    #[serde(rename = "akcje_dyplomatyczne")]
    pub akcje_dyplomatyczne: Vec<AkcjeDyplomatyczneItem>,
    #[serde(rename = "parametry_relacji")]
    pub parametry_relacji: Vec<ParametryRelacjiItem>,
    #[serde(rename = "zmiany_parametrów")]
    pub zmiany_parametrow: Vec<ZmianyParametrowItem>,
    #[serde(rename = "respekt_-_czynniki")]
    pub respekt_czynniki: Vec<RespektCzynnikiItem>,
    #[serde(rename = "panel_sterowania")]
    pub panel_sterowania: PanelSterowania,
    #[serde(rename = "perNacja")]
    pub per_nacja: Vec<PerNacjaItem>,
}

// ===== diplomacy-acceptance-points.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Pokoj {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SojuszPelny {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SojuszDefensywny {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Nap {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UmowaSzlakow {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UmowaHandlowa {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Handel {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Granice {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_relacja")]
    pub prog_relacja: i64,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Tech {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Wasal {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_respekt")]
    pub prog_respekt: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TrybutZadanie {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_respekt")]
    pub prog_respekt: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TrybutOferta {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NamowWojne {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "prog_zaufanie")]
    pub prog_zaufanie: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Ultimatum {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Dar {
    #[serde(rename = "punkty")]
    pub punkty: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "uwaga")]
    pub uwaga: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Traktaty {
    #[serde(rename = "pokoj")]
    pub pokoj: Pokoj,
    #[serde(rename = "sojusz_pelny")]
    pub sojusz_pelny: SojuszPelny,
    #[serde(rename = "sojusz_defensywny")]
    pub sojusz_defensywny: SojuszDefensywny,
    #[serde(rename = "nap")]
    pub nap: Nap,
    #[serde(rename = "umowa_szlakow")]
    pub umowa_szlakow: UmowaSzlakow,
    #[serde(rename = "umowa_handlowa")]
    pub umowa_handlowa: UmowaHandlowa,
    #[serde(rename = "handel")]
    pub handel: Handel,
    #[serde(rename = "granice")]
    pub granice: Granice,
    #[serde(rename = "tech")]
    pub tech: Tech,
    #[serde(rename = "wasal")]
    pub wasal: Wasal,
    #[serde(rename = "trybut_zadanie")]
    pub trybut_zadanie: TrybutZadanie,
    #[serde(rename = "trybut_oferta")]
    pub trybut_oferta: TrybutOferta,
    #[serde(rename = "namow_wojne")]
    pub namow_wojne: NamowWojne,
    #[serde(rename = "ultimatum")]
    pub ultimatum: Ultimatum,
    #[serde(rename = "dar")]
    pub dar: Dar,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Zloto {
    #[serde(rename = "pn_per_unit")]
    pub pn_per_unit: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Praca {
    #[serde(rename = "pn_per_unit")]
    pub pn_per_unit: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Zywnosc {
    #[serde(rename = "pn_per_unit")]
    pub pn_per_unit: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SurowiecIlosc {
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "pn_per_szt")]
    pub pn_per_szt: BTreeMap<String, i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Tech2 {
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Jednostka {
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Zloze {
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "zrodlo")]
    pub zrodlo: String,
    #[serde(rename = "przyklady")]
    pub przyklady: BTreeMap<String, i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct KoszykPn {
    #[serde(rename = "zloto")]
    pub zloto: Zloto,
    #[serde(rename = "praca")]
    pub praca: Praca,
    #[serde(rename = "zywnosc")]
    pub zywnosc: Zywnosc,
    #[serde(rename = "surowiec_ilosc")]
    pub surowiec_ilosc: SurowiecIlosc,
    #[serde(rename = "tech")]
    pub tech: Tech2,
    #[serde(rename = "jednostka")]
    pub jednostka: Jednostka,
    #[serde(rename = "zloze")]
    pub zloze: Zloze,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Sweetener {
    #[serde(rename = "pn_na_punkt_ease")]
    pub pn_na_punkt_ease: i64,
    #[serde(rename = "max_ease_punkty")]
    pub max_ease_punkty: i64,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FairTrade {
    #[serde(rename = "kurs_relacja_baza")]
    pub kurs_relacja_baza: i64,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AcceptancePointsFile {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "traktaty")]
    pub traktaty: Traktaty,
    #[serde(rename = "koszyk_pn")]
    pub koszyk_pn: KoszykPn,
    #[serde(rename = "sweetener")]
    pub sweetener: Sweetener,
    #[serde(rename = "fair_trade")]
    pub fair_trade: FairTrade,
}

// ===== city-names-pools.json =====
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CityPool {
    #[serde(rename = "nazwa_pl")]
    pub nazwa_pl: String,
    #[serde(rename = "miasta_cywilizacji")]
    pub miasta_cywilizacji: Vec<String>,
}

pub type CityNamesPoolsFile = BTreeMap<String, CityPool>;


pub const CIVS_JSON: &str = include_str!("../../data/civs.json");
pub const CIV_MATRIX_JSON: &str = include_str!("../../data/civ-matrix.json");
pub const CIV_PARAMS_JSON: &str = include_str!("../../data/civ-params.json");
pub const CIV_AI_JSON: &str = include_str!("../../data/civ-ai.json");
pub const DIPLOMACY_JSON: &str = include_str!("../../data/diplomacy.json");
pub const DIPLOMACY_ACCEPTANCE_POINTS_JSON: &str = include_str!("../../data/diplomacy-acceptance-points.json");
pub const CITY_NAMES_POOLS_JSON: &str = include_str!("../../data/city-names-pools.json");

pub fn parse_civs() -> serde_json::Result<CivsFile> {
    serde_json::from_str(CIVS_JSON)
}

pub fn parse_civ_matrix() -> serde_json::Result<CivMatrixFile> {
    serde_json::from_str(CIV_MATRIX_JSON)
}

pub fn parse_civ_params() -> serde_json::Result<CivParamsFile> {
    serde_json::from_str(CIV_PARAMS_JSON)
}

pub fn parse_civ_ai() -> serde_json::Result<CivAiFile> {
    serde_json::from_str(CIV_AI_JSON)
}

pub fn parse_diplomacy() -> serde_json::Result<DiplomacyFile> {
    serde_json::from_str(DIPLOMACY_JSON)
}

pub fn parse_diplomacy_acceptance_points() -> serde_json::Result<AcceptancePointsFile> {
    serde_json::from_str(DIPLOMACY_ACCEPTANCE_POINTS_JSON)
}

pub fn parse_city_names_pools() -> serde_json::Result<CityNamesPoolsFile> {
    serde_json::from_str(CITY_NAMES_POOLS_JSON)
}
