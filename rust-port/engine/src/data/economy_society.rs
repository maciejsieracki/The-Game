//! GENERATED 1:1 from gra/data JSON on pin edb8fb56 (copied to rust-port/engine/data).
//! Structs mirror JSON shape; keys kept verbatim via #[serde(rename)].
//! Parsed with include_str! + serde_json (exercised by tests/data_economy_society.rs).
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsEkonomiaMiastaProgWzrostuWspolczynnik {
    #[serde(rename = "easy")]
    pub easy: i64,
    #[serde(rename = "normal")]
    pub normal: i64,
    #[serde(rename = "hard")]
    pub hard: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie {
    #[serde(rename = "easy")]
    pub easy: f64,
    #[serde(rename = "normal")]
    pub normal: f64,
    #[serde(rename = "hard")]
    pub hard: f64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu {
    #[serde(rename = "easy")]
    pub easy: f64,
    #[serde(rename = "normal")]
    pub normal: i64,
    #[serde(rename = "hard")]
    pub hard: f64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsEkonomiaMiastaKorupcjaWspolczynnikMiast {
    #[serde(rename = "easy")]
    pub easy: f64,
    #[serde(rename = "normal")]
    pub normal: f64,
    #[serde(rename = "hard")]
    pub hard: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsEkonomiaMiasta {
    #[serde(rename = "próg_wzrostu_wspolczynnik")]
    pub prog_wzrostu_wspolczynnik: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "spichlerz_zachowanie_po_wzroscie")]
    pub spichlerz_zachowanie_po_wzroscie: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "handel_surowiec_min_stock")]
    pub handel_surowiec_min_stock: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "akwedukt_prog_ludnosci")]
    pub akwedukt_prog_ludnosci: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "spichlerz_prog_ludnosci")]
    pub spichlerz_prog_ludnosci: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "akwedukt_max_ludnosci")]
    pub akwedukt_max_ludnosci: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zywnosc_zuzytka_populacja")]
    pub zywnosc_zuzytka_populacja: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zywnosc_jednostka_ruch")]
    pub zywnosc_jednostka_ruch: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zywnosc_jednostka_oboz")]
    pub zywnosc_jednostka_oboz: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "suwak_handel_nauka_domyslnie")]
    pub suwak_handel_nauka_domyslnie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "suwak_handel_pieniadz_domyslnie")]
    pub suwak_handel_pieniadz_domyslnie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "suwak_handel_luksus_domyslnie")]
    pub suwak_handel_luksus_domyslnie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "suwak_praca_budynki_domyslnie")]
    pub suwak_praca_budynki_domyslnie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "suwak_praca_teren_domyslnie")]
    pub suwak_praca_teren_domyslnie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "suwak_zywnosc_rozwoj_domyslnie")]
    pub suwak_zywnosc_rozwoj_domyslnie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "glod_wojska_hp_frac")]
    pub glod_wojska_hp_frac: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "glod_wojska_karencja_tur")]
    pub glod_wojska_karencja_tur: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "glod_wojska_stat_mult")]
    pub glod_wojska_stat_mult: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "zloto_deficyt_hp_frac")]
    pub zloto_deficyt_hp_frac: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "zloto_deficyt_karencja_tur")]
    pub zloto_deficyt_karencja_tur: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zloto_deficyt_stat_mult")]
    pub zloto_deficyt_stat_mult: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "zywnosc_mnoznik_terytorium_wlasne")]
    pub zywnosc_mnoznik_terytorium_wlasne: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "zywnosc_mnoznik_poza_terytorium")]
    pub zywnosc_mnoznik_poza_terytorium: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "spichlerz_pojemnosc_zapasow_panstwa")]
    pub spichlerz_pojemnosc_zapasow_panstwa: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "armia_odklad_bez_spichlerza")]
    pub armia_odklad_bez_spichlerza: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "armia_odklad_ze_spichlerzem")]
    pub armia_odklad_ze_spichlerzem: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "racje_zywnosc_1")]
    pub racje_zywnosc_1: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "racje_zywnosc_2")]
    pub racje_zywnosc_2: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "racje_zywnosc_3")]
    pub racje_zywnosc_3: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "racje_wzrost_proc_1")]
    pub racje_wzrost_proc_1: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "racje_wzrost_proc_2")]
    pub racje_wzrost_proc_2: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "racje_wzrost_proc_3")]
    pub racje_wzrost_proc_3: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "korupcja_wspolczynnik_dystansu")]
    pub korupcja_wspolczynnik_dystansu: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "korupcja_wspolczynnik_miast")]
    pub korupcja_wspolczynnik_miast: EconParamsEkonomiaMiastaKorupcjaWspolczynnikMiast,
    #[serde(rename = "korupcja_cap")]
    pub korupcja_cap: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsBudynki {
    #[serde(rename = "budynek_mlyn_mnoznik_pracy")]
    pub budynek_mlyn_mnoznik_pracy: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_mlyn_bonus_pracy")]
    pub budynek_mlyn_bonus_pracy: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_cegielnia_bonus_pracy")]
    pub budynek_cegielnia_bonus_pracy: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "budynek_targowisko_bonus_handlu")]
    pub budynek_targowisko_bonus_handlu: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "budynek_stolarnia_bonus_drewna_civ")]
    pub budynek_stolarnia_bonus_drewna_civ: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "budynek_kamieniarski_bonus_kamienia_civ")]
    pub budynek_kamieniarski_bonus_kamienia_civ:
        EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "budynek_garncarnia_bonus_zywnosci_lokalnie")]
    pub budynek_garncarnia_bonus_zywnosci_lokalnie:
        EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "ulepszenie_surowcowe_upkeep_praca")]
    pub ulepszenie_surowcowe_upkeep_praca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_mennica_mnoznik")]
    pub budynek_mennica_mnoznik: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_biblioteka_bonus_nauki")]
    pub budynek_biblioteka_bonus_nauki: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "budynek_akademia_bonus_nauki")]
    pub budynek_akademia_bonus_nauki: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "waluta_mnoznik")]
    pub waluta_mnoznik: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "targowisko_praca_na_pieniadz_mnoznik")]
    pub targowisko_praca_na_pieniadz_mnoznik: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_tartak_przepustowosc")]
    pub budynek_tartak_przepustowosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_cegielnia_przepustowosc")]
    pub budynek_cegielnia_przepustowosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_huta_przepustowosc")]
    pub budynek_huta_przepustowosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_odlewnia_zelaza_przepustowosc")]
    pub budynek_odlewnia_zelaza_przepustowosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_wielka_odlewnia_przepustowosc")]
    pub budynek_wielka_odlewnia_przepustowosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_garncarnia_przepustowosc")]
    pub budynek_garncarnia_przepustowosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_spichlerz_zuzywa_ceramika")]
    pub budynek_spichlerz_zuzywa_ceramika: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_spichlerz_ii_zuzywa_sol")]
    pub budynek_spichlerz_ii_zuzywa_sol: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "budynek_spichlerz_ii_zuzywa_ceramika")]
    pub budynek_spichlerz_ii_zuzywa_ceramika: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "utrzymanie_budynek")]
    pub utrzymanie_budynek: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsTerenMapa {
    #[serde(rename = "teren_rzeka_zywnosc")]
    pub teren_rzeka_zywnosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "teren_rzeka_praca")]
    pub teren_rzeka_praca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "teren_rzeka_handel")]
    pub teren_rzeka_handel: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "teren_las_zywnosc")]
    pub teren_las_zywnosc: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "teren_las_handel")]
    pub teren_las_handel: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "teren_las_drewno")]
    pub teren_las_drewno: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "teren_las_praca")]
    pub teren_las_praca: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "ulepszenie_farma_zywnosc")]
    pub ulepszenie_farma_zywnosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ulepszenie_irygacja_zywnosc")]
    pub ulepszenie_irygacja_zywnosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ulepszenie_kopalnia_kamien")]
    pub ulepszenie_kopalnia_kamien: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ulepszenie_droga_ruch")]
    pub ulepszenie_droga_ruch: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ulepszenie_pastwisko_bydlo_produkcja")]
    pub ulepszenie_pastwisko_bydlo_produkcja: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ulepszenie_pastwisko_owce_zywnosc")]
    pub ulepszenie_pastwisko_owce_zywnosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsWealth {
    #[serde(rename = "wealth_cap_na_epoke")]
    pub wealth_cap_na_epoke: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "wealth_prog_na_poziom")]
    pub wealth_prog_na_poziom: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "wealth_mnoznik_na_poziom")]
    pub wealth_mnoznik_na_poziom: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "wealth_utrzymanie_baza")]
    pub wealth_utrzymanie_baza: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "wealth_utrzymanie_przy_cap")]
    pub wealth_utrzymanie_przy_cap: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "wealth_zachowanie_po_awansie")]
    pub wealth_zachowanie_po_awansie: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "wealth_zadowolenie_max")]
    pub wealth_zadowolenie_max: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "wealth_kara_zero")]
    pub wealth_kara_zero: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "wealth_immunitet_tur")]
    pub wealth_immunitet_tur: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsGlobalneMennicaMnoznikPoWalucie {
    #[serde(rename = "easy")]
    pub easy: i64,
    #[serde(rename = "normal")]
    pub normal: f64,
    #[serde(rename = "hard")]
    pub hard: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsGlobalneSkarbiecCentralnyLokalizacja {
    #[serde(rename = "easy")]
    pub easy: String,
    #[serde(rename = "normal")]
    pub normal: String,
    #[serde(rename = "hard")]
    pub hard: String,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsGlobalne {
    #[serde(rename = "kurs_pieniadz_praca")]
    pub kurs_pieniadz_praca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "mennica_mnoznik_po_walucie")]
    pub mennica_mnoznik_po_walucie: EconParamsGlobalneMennicaMnoznikPoWalucie,
    #[serde(rename = "luksus_przelicznik_zadowolenie")]
    pub luksus_przelicznik_zadowolenie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "magazyn_baza_zywnosc")]
    pub magazyn_baza_zywnosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "magazyn_baza_surowce")]
    pub magazyn_baza_surowce: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "magazyn_bonus_surowce_na_budynek")]
    pub magazyn_bonus_surowce_na_budynek: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "magazyn_centralny_baza_zywnosc")]
    pub magazyn_centralny_baza_zywnosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "magazyn_centralny_bonus_zywnosc_na_budynek")]
    pub magazyn_centralny_bonus_zywnosc_na_budynek: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "magazyn_mnoznik_spichlerz")]
    pub magazyn_mnoznik_spichlerz: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "utrzymanie_jednostka_standard")]
    pub utrzymanie_jednostka_standard: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_rush_jednostka_rezerwa_zlota")]
    pub ai_rush_jednostka_rezerwa_zlota: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_rush_jednostka_max_na_ture")]
    pub ai_rush_jednostka_max_na_ture: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_suwaki_deficyt_zywnosc_prog")]
    pub ai_suwaki_deficyt_zywnosc_prog: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_suwaki_nadwyzka_zywnosc_prog")]
    pub ai_suwaki_nadwyzka_zywnosc_prog: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_suwaki_krok_zywnosc_rozwoj")]
    pub ai_suwaki_krok_zywnosc_rozwoj: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_suwaki_krok_praca_nauka")]
    pub ai_suwaki_krok_praca_nauka: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "ai_suwaki_min_odstep_tur")]
    pub ai_suwaki_min_odstep_tur: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "skarbiec_centralny_lokalizacja")]
    pub skarbiec_centralny_lokalizacja: EconParamsGlobalneSkarbiecCentralnyLokalizacja,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsHandelSzlakiDochodyLadowe {
    #[serde(rename = "easy")]
    pub easy: Vec<i64>,
    #[serde(rename = "normal")]
    pub normal: Vec<i64>,
    #[serde(rename = "hard")]
    pub hard: Vec<i64>,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsHandelSzlaki {
    #[serde(rename = "lad_max_dystans")]
    pub lad_max_dystans: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "morze_max_dystans")]
    pub morze_max_dystans: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "dochody_ladowe")]
    pub dochody_ladowe: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "dochody_morskie")]
    pub dochody_morskie: EconParamsHandelSzlakiDochodyLadowe,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParamsHandelSurowce {
    #[serde(rename = "cena_drewno")]
    pub cena_drewno: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_glina")]
    pub cena_glina: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_kamien")]
    pub cena_kamien: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_ruda")]
    pub cena_ruda: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_ruda_zelaza")]
    pub cena_ruda_zelaza: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_ruda_cyny")]
    pub cena_ruda_cyny: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_cegla")]
    pub cena_cegla: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_sol")]
    pub cena_sol: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_kon")]
    pub cena_kon: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_ceramika")]
    pub cena_ceramika: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_braz")]
    pub cena_braz: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_zelazo")]
    pub cena_zelazo: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_stal")]
    pub cena_stal: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_zloto")]
    pub cena_zloto: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "cena_wegiel")]
    pub cena_wegiel: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "pakiet_wielkosc")]
    pub pakiet_wielkosc: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EconParams {
    #[serde(rename = "ekonomia_miasta")]
    pub ekonomia_miasta: EconParamsEkonomiaMiasta,
    #[serde(rename = "budynki")]
    pub budynki: EconParamsBudynki,
    #[serde(rename = "teren_mapa")]
    pub teren_mapa: EconParamsTerenMapa,
    #[serde(rename = "wealth")]
    pub wealth: EconParamsWealth,
    #[serde(rename = "globalne")]
    pub globalne: EconParamsGlobalne,
    #[serde(rename = "handel_szlaki")]
    pub handel_szlaki: EconParamsHandelSzlaki,
    #[serde(rename = "handel_surowce")]
    pub handel_surowce: EconParamsHandelSurowce,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsZdrowie {
    #[serde(rename = "zdrowie_rzeka")]
    pub zdrowie_rzeka: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_akwedukt")]
    pub zdrowie_akwedukt: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_studnia")]
    pub zdrowie_studnia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_targowisko")]
    pub zdrowie_targowisko: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_laznia_publiczna")]
    pub zdrowie_laznia_publiczna: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_ceramika")]
    pub zdrowie_ceramika: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_male_miasto_bonus")]
    pub zdrowie_male_miasto_bonus: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_bonus_osiedle_pop")]
    pub zdrowie_bonus_osiedle_pop: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "zdrowie_kara_zagęszczenie")]
    pub zdrowie_kara_zageszczenie: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "zdrowie_prog_zagęszczenia")]
    pub zdrowie_prog_zageszczenia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_kara_bagno")]
    pub zdrowie_kara_bagno: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "zdrowie_bonus_las")]
    pub zdrowie_bonus_las: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_kara_dzungla")]
    pub zdrowie_kara_dzungla: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "zdrowie_kara_zanieczyszczenie")]
    pub zdrowie_kara_zanieczyszczenie: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "zdrowie_kara_brak_wody")]
    pub zdrowie_kara_brak_wody: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_modyfikator_wzrostu")]
    pub zdrowie_modyfikator_wzrostu: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "zdrowie_prog_stagnacja")]
    pub zdrowie_prog_stagnacja: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_prog_ubytek_populacji")]
    pub zdrowie_prog_ubytek_populacji: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "zdrowie_tempo_ubytku")]
    pub zdrowie_tempo_ubytku: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsSzczescie {
    #[serde(rename = "szczescie_luksus_na_mieszkanca")]
    pub szczescie_luksus_na_mieszkanca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_ustroj_bonus")]
    pub szczescie_ustroj_bonus: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_religia_dominujaca")]
    pub szczescie_religia_dominujaca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_kultura_dominujaca")]
    pub szczescie_kultura_dominujaca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_male_miasto_bonus")]
    pub szczescie_male_miasto_bonus: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_bonus_osiedle_pop")]
    pub szczescie_bonus_osiedle_pop: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "szczescie_bonus_stolica_easy")]
    pub szczescie_bonus_stolica_easy: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_prog_zagęszczenia")]
    pub szczescie_prog_zageszczenia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_kara_wojna")]
    pub szczescie_kara_wojna: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_skala_kultura_religia")]
    pub szczescie_skala_kultura_religia: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "szczescie_podatki_min")]
    pub szczescie_podatki_min: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_podatki_max")]
    pub szczescie_podatki_max: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_podatki_prog_pct")]
    pub szczescie_podatki_prog_pct: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_max_epoka")]
    pub szczescie_max_epoka: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "szczescie_pct_cap")]
    pub szczescie_pct_cap: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_max_pop_odniesienia")]
    pub szczescie_max_pop_odniesienia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "szczescie_max_pop_wspolczynnik")]
    pub szczescie_max_pop_wspolczynnik: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsKultura {
    #[serde(rename = "kultura_palac")]
    pub kultura_palac: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_swiatynia")]
    pub kultura_swiatynia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_biblioteka")]
    pub kultura_biblioteka: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_amfiteatr")]
    pub kultura_amfiteatr: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_cud_bonus")]
    pub kultura_cud_bonus: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_specjalista_artysta")]
    pub kultura_specjalista_artysta: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_prog_zasieg_1")]
    pub kultura_prog_zasieg_1: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_prog_zasieg_2")]
    pub kultura_prog_zasieg_2: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_prog_zasieg_3")]
    pub kultura_prog_zasieg_3: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_zadowolenie_100pct")]
    pub kultura_zadowolenie_100pct: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_zadowolenie_75pct")]
    pub kultura_zadowolenie_75pct: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_zadowolenie_50pct")]
    pub kultura_zadowolenie_50pct: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_kara_zadowolenie_lt50")]
    pub kultura_kara_zadowolenie_lt50: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "kultura_kara_zadowolenie_lt25")]
    pub kultura_kara_zadowolenie_lt25: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_konwersja_baza_tura")]
    pub kultura_konwersja_baza_tura: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_konwersja_swiatynia")]
    pub kultura_konwersja_swiatynia: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "kultura_konwersja_amfiteatr")]
    pub kultura_konwersja_amfiteatr: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_konwersja_biblioteka")]
    pub kultura_konwersja_biblioteka: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "kultura_konwersja_palac")]
    pub kultura_konwersja_palac: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "kultura_konwersja_stela")]
    pub kultura_konwersja_stela: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "kultura_konwersja_sad")]
    pub kultura_konwersja_sad: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "kultura_konwersja_laznia")]
    pub kultura_konwersja_laznia: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "kultura_konwersja_cel_100pct")]
    pub kultura_konwersja_cel_100pct: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_konwersja_cap_tura")]
    pub kultura_konwersja_cap_tura: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "kultura_presja_proc_tura")]
    pub kultura_presja_proc_tura: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsReligia {
    #[serde(rename = "religia_prog_dominacji")]
    pub religia_prog_dominacji: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_szybkosc_szerzenia_bazowa")]
    pub religia_szybkosc_szerzenia_bazowa: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_swiatynia_bonus_szerzenia")]
    pub religia_swiatynia_bonus_szerzenia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_szerzenie_max_dystans")]
    pub religia_szerzenie_max_dystans: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_zadowolenie_dominujaca")]
    pub religia_zadowolenie_dominujaca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_swiatynia_zadowolenie")]
    pub religia_swiatynia_zadowolenie: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_jednosc_bonus_produkcja")]
    pub religia_jednosc_bonus_produkcja: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "religia_kara_obca")]
    pub religia_kara_obca: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_kara_brak_religii")]
    pub religia_kara_brak_religii: EconParamsEkonomiaMiastaKorupcjaWspolczynnikDystansu,
    #[serde(rename = "religia_bonus_dyplomacja_wspolna")]
    pub religia_bonus_dyplomacja_wspolna: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_kara_dyplomacja_rozna")]
    pub religia_kara_dyplomacja_rozna: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_bonus_dyplomacja_misja")]
    pub religia_bonus_dyplomacja_misja: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_konwersja_bazowa")]
    pub religia_konwersja_bazowa: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_konwersja_swiatynia")]
    pub religia_konwersja_swiatynia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_konwersja_kregi")]
    pub religia_konwersja_kregi: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_konwersja_cel")]
    pub religia_konwersja_cel: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "religia_presja_proc_tura")]
    pub religia_presja_proc_tura: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsReligieCywilizacji {
    #[serde(rename = "Cywilizacja")]
    pub cywilizacja: String,
    #[serde(rename = "Religia / wyznanie")]
    pub religia_wyznanie: String,
    #[serde(rename = "Główne bóstwo / idea")]
    pub g_owne_bostwo_idea: String,
    #[serde(rename = "Wpływ na parametry (bonusy) [propozycja, edytowalne]")]
    pub wp_yw_na_parametry_bonusy_propozycja_edytowalne: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsPorzadek {
    #[serde(rename = "porzadek_waga_szczescie")]
    pub porzadek_waga_szczescie: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_waga_prawo")]
    pub porzadek_waga_prawo: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_prog_bunt_skrajny_pct")]
    pub porzadek_prog_bunt_skrajny_pct: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "porzadek_grace_tur_bunt")]
    pub porzadek_grace_tur_bunt: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "porzadek_prog_t1")]
    pub porzadek_prog_t1: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "porzadek_prog_t2")]
    pub porzadek_prog_t2: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "porzadek_kara_produkcja_t1")]
    pub porzadek_kara_produkcja_t1: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_kara_pieniadz_t1")]
    pub porzadek_kara_pieniadz_t1: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_kara_nauka_t1")]
    pub porzadek_kara_nauka_t1: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_kara_kultura_t1")]
    pub porzadek_kara_kultura_t1: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_kara_wzrost_t1")]
    pub porzadek_kara_wzrost_t1: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_ryzyko_buntu_t1")]
    pub porzadek_ryzyko_buntu_t1: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_bonus_produkcja_t2")]
    pub porzadek_bonus_produkcja_t2: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "porzadek_bonus_handel_t2")]
    pub porzadek_bonus_handel_t2: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParamsPrawo {
    #[serde(rename = "prawo_garnizon_per_jednostka")]
    pub prawo_garnizon_per_jednostka: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_garnizon_cap_jednostek")]
    pub prawo_garnizon_cap_jednostek: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_dom_starszyzny")]
    pub prawo_dom_starszyzny: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_dwor_zarzadcy")]
    pub prawo_dwor_zarzadcy: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_pretorium")]
    pub prawo_pretorium: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_trybunal")]
    pub prawo_trybunal: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_sad")]
    pub prawo_sad: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_palac")]
    pub prawo_palac: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_palac_ii")]
    pub prawo_palac_ii: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_palac_iii")]
    pub prawo_palac_iii: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_garnizon_budynek_epoka")]
    pub prawo_garnizon_budynek_epoka: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "prawo_bonus_osada")]
    pub prawo_bonus_osada: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_bonus_osiedle_pop")]
    pub prawo_bonus_osiedle_pop: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "prawo_bonus_osada_prog")]
    pub prawo_bonus_osada_prog: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_max_epoka")]
    pub prawo_max_epoka: EconParamsHandelSzlakiDochodyLadowe,
    #[serde(rename = "prawo_pct_cap")]
    pub prawo_pct_cap: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_max_pop_odniesienia")]
    pub prawo_max_pop_odniesienia: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "prawo_max_pop_wspolczynnik")]
    pub prawo_max_pop_wspolczynnik: EconParamsEkonomiaMiastaSpichlerzZachowaniePoWzroscie,
    #[serde(rename = "prawo_bonus_stolica_easy")]
    pub prawo_bonus_stolica_easy: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SocietyParams {
    #[serde(rename = "zdrowie")]
    pub zdrowie: SocietyParamsZdrowie,
    #[serde(rename = "szczescie")]
    pub szczescie: SocietyParamsSzczescie,
    #[serde(rename = "kultura")]
    pub kultura: SocietyParamsKultura,
    #[serde(rename = "religia")]
    pub religia: SocietyParamsReligia,
    #[serde(rename = "religie_cywilizacji")]
    pub religie_cywilizacji: Vec<SocietyParamsReligieCywilizacji>,
    #[serde(rename = "porzadek")]
    pub porzadek: SocietyParamsPorzadek,
    #[serde(rename = "prawo")]
    pub prawo: SocietyParamsPrawo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EpokaLudnoscManpowerFormuly {
    #[serde(rename = "ludnoscAbsolutna")]
    pub ludnosc_absolutna: String,
    #[serde(rename = "manpowerMax")]
    pub manpower_max: String,
    #[serde(rename = "kosztRekrutacji")]
    pub koszt_rekrutacji: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EpokaLudnoscManpowerEpoki {
    #[serde(rename = "epoka")]
    pub epoka: i64,
    #[serde(rename = "ludekNaLudka")]
    pub ludek_na_ludka: i64,
    #[serde(rename = "manpowerNaLudka")]
    pub manpower_na_ludka: i64,
    #[serde(rename = "manpowerNaJednostke")]
    pub manpower_na_jednostke: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EpokaLudnoscManpower {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "_formuly")]
    pub formuly: EpokaLudnoscManpowerFormuly,
    #[serde(rename = "epoki")]
    pub epoki: Vec<EpokaLudnoscManpowerEpoki>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitizenResourceUpkeepKara {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "szczescieZaDostepny")]
    pub szczescie_za_dostepny: i64,
    #[serde(rename = "szczescieZaBrakujacy")]
    pub szczescie_za_brakujacy: i64,
    #[serde(rename = "rozwojPctZaBrakujacy")]
    pub rozwoj_pct_za_brakujacy: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitizenResourceUpkeepEpoki {
    #[serde(rename = "epoka")]
    pub epoka: i64,
    #[serde(rename = "nazwa")]
    pub nazwa: String,
    #[serde(rename = "surowce")]
    pub surowce: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitizenResourceUpkeep {
    #[serde(rename = "_opis")]
    pub opis: String,
    #[serde(rename = "_kara")]
    pub kara: CitizenResourceUpkeepKara,
    #[serde(rename = "epoki")]
    pub epoki: Vec<CitizenResourceUpkeepEpoki>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MiastoParamsMinDystansMiast {
    #[serde(rename = "wartosc")]
    pub wartosc: i64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MiastoParamsPracaUdzialBudynki {
    #[serde(rename = "wartosc")]
    pub wartosc: f64,
    #[serde(rename = "jednostka")]
    pub jednostka: String,
    #[serde(rename = "opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MiastoParams {
    #[serde(rename = "min_dystans_miast")]
    pub min_dystans_miast: MiastoParamsMinDystansMiast,
    #[serde(rename = "jednostka_koszt_ludnosci")]
    pub jednostka_koszt_ludnosci: MiastoParamsMinDystansMiast,
    #[serde(rename = "manpower_regen_proc_max_tura")]
    pub manpower_regen_proc_max_tura: MiastoParamsMinDystansMiast,
    #[serde(rename = "manpower_regen_blok_oblezenie")]
    pub manpower_regen_blok_oblezenie: MiastoParamsMinDystansMiast,
    #[serde(rename = "manpower_uzupelnienie_hp_proc_max_tura")]
    pub manpower_uzupelnienie_hp_proc_max_tura: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik,
    #[serde(rename = "jednostka_koszt_domyslny")]
    pub jednostka_koszt_domyslny: MiastoParamsMinDystansMiast,
    #[serde(rename = "zaloz_miasto_koszt_praca")]
    pub zaloz_miasto_koszt_praca: MiastoParamsMinDystansMiast,
    #[serde(rename = "zaloz_miasto_koszt_ludnosci")]
    pub zaloz_miasto_koszt_ludnosci: MiastoParamsMinDystansMiast,
    #[serde(rename = "jednostka_koszt_rola_wsparcie")]
    pub jednostka_koszt_rola_wsparcie: MiastoParamsMinDystansMiast,
    #[serde(rename = "jednostka_koszt_rola_dystans")]
    pub jednostka_koszt_rola_dystans: MiastoParamsMinDystansMiast,
    #[serde(rename = "jednostka_koszt_rola_wrecz")]
    pub jednostka_koszt_rola_wrecz: MiastoParamsMinDystansMiast,
    #[serde(rename = "jednostka_koszt_rola_konnica")]
    pub jednostka_koszt_rola_konnica: MiastoParamsMinDystansMiast,
    #[serde(rename = "zasieg_okolicy_miasta")]
    pub zasieg_okolicy_miasta: MiastoParamsMinDystansMiast,
    #[serde(rename = "zasieg_okolicy_max")]
    pub zasieg_okolicy_max: MiastoParamsMinDystansMiast,
    #[serde(rename = "praca_udzial_budynki")]
    pub praca_udzial_budynki: MiastoParamsPracaUdzialBudynki,
    #[serde(rename = "bonus_obrona_mur_proc")]
    pub bonus_obrona_mur_proc: MiastoParamsMinDystansMiast,
    #[serde(rename = "bonus_obrona_cytadela_proc")]
    pub bonus_obrona_cytadela_proc: MiastoParamsMinDystansMiast,
    #[serde(rename = "bonus_obrona_baszta_proc")]
    pub bonus_obrona_baszta_proc: MiastoParamsMinDystansMiast,
    #[serde(rename = "bonus_obrona_palisada_proc")]
    pub bonus_obrona_palisada_proc: MiastoParamsMinDystansMiast,
    #[serde(rename = "zasieg_okolicy_baza")]
    pub zasieg_okolicy_baza: MiastoParamsMinDystansMiast,
    #[serde(rename = "zasieg_okolicy_pop5")]
    pub zasieg_okolicy_pop5: MiastoParamsMinDystansMiast,
    #[serde(rename = "zasieg_okolicy_pop10")]
    pub zasieg_okolicy_pop10: MiastoParamsMinDystansMiast,
    #[serde(rename = "udzial_output_produkcja")]
    pub udzial_output_produkcja: MiastoParamsPracaUdzialBudynki,
    #[serde(rename = "udzial_output_pieniadz")]
    pub udzial_output_pieniadz: MiastoParamsPracaUdzialBudynki,
    #[serde(rename = "udzial_output_nauka")]
    pub udzial_output_nauka: MiastoParamsPracaUdzialBudynki,
    #[serde(rename = "udzial_output_rozwoj")]
    pub udzial_output_rozwoj: MiastoParamsPracaUdzialBudynki,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ResourceItem {
    #[serde(rename = "Surowiec")]
    pub surowiec: String,
    #[serde(rename = "Typ")]
    pub typ: String,
    #[serde(rename = "Źródło / budynek")]
    pub zrod_o_budynek: String,
    #[serde(rename = "Uwagi")]
    pub uwagi: String,
}

/// Parse ../../data/econ-params.json (embedded via include_str!).
pub fn parse_econ_params() -> Result<EconParams, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/econ-params.json"))
}

/// Parse ../../data/society-params.json (embedded via include_str!).
pub fn parse_society_params() -> Result<SocietyParams, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/society-params.json"))
}

/// Parse ../../data/epoka-ludnosc-manpower.json (embedded via include_str!).
pub fn parse_epoka_ludnosc_manpower() -> Result<EpokaLudnoscManpower, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/epoka-ludnosc-manpower.json"))
}

/// Parse ../../data/citizen-resource-upkeep.json (embedded via include_str!).
pub fn parse_citizen_resource_upkeep() -> Result<CitizenResourceUpkeep, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/citizen-resource-upkeep.json"))
}

/// Parse ../../data/miasto-params.json (embedded via include_str!).
pub fn parse_miasto_params() -> Result<MiastoParams, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/miasto-params.json"))
}

/// Parse ../../data/resources.json (embedded via include_str!).
pub fn parse_resources() -> Result<Vec<ResourceItem>, serde_json::Error> {
    serde_json::from_str(include_str!("../../data/resources.json"))
}
