//! R-RUSTPORT-P3-5E-DATA-ECON-SOCIETY-Q1: 9 JSON files (copies of gra/data on pin edb8fb56,
//! stored in rust-port/engine/data) parse into 1:1 serde structs; each file has spot checks.
//! Source modules are included with #[path]; the crate lib is NOT modified (rewiring is a later topic).

#[path = "../src/data/economy_society.rs"]
mod economy_society;
#[path = "../src/data/economy_society_part2.rs"]
mod economy_society_part2;

#[test]
fn parse_econ_params_parses_and_spot_checks() {
    let root =
        economy_society::parse_econ_params().expect("econ-params.json parses into 1:1 structs");
    assert_eq!(root.ekonomia_miasta.prog_wzrostu_wspolczynnik.easy, 12_i64);
    assert_eq!(root.teren_mapa.teren_rzeka_zywnosc.normal, 3_i64);
    assert_eq!(root.handel_surowce.pakiet_wielkosc.hard, 10_i64);
}

#[test]
fn parse_society_params_parses_and_spot_checks() {
    let root = economy_society::parse_society_params()
        .expect("society-params.json parses into 1:1 structs");
    assert_eq!(root.zdrowie.zdrowie_rzeka.easy, 3_i64);
    assert!(((root.kultura.kultura_konwersja_stela.normal) - 0.5).abs() < 1e-12);
    assert_eq!(root.prawo.prawo_bonus_stolica_easy.hard, 0_i64);
}

#[test]
fn parse_epoka_ludnosc_manpower_parses_and_spot_checks() {
    let root = economy_society::parse_epoka_ludnosc_manpower()
        .expect("epoka-ludnosc-manpower.json parses into 1:1 structs");
    assert_eq!(root.epoki[0].epoka, 1_i64);
    assert_eq!(root.epoki[0].manpower_na_ludka, 1000_i64);
    assert_eq!(root.epoki[0].manpower_na_jednostke, 1000_i64);
}

#[test]
fn parse_citizen_resource_upkeep_parses_and_spot_checks() {
    let root = economy_society::parse_citizen_resource_upkeep()
        .expect("citizen-resource-upkeep.json parses into 1:1 structs");
    assert_eq!(root.kara.szczescie_za_dostepny, 2_i64);
    assert_eq!(root.kara.rozwoj_pct_za_brakujacy, -1_i64);
    assert_eq!(root.epoki[0].epoka, 1_i64);
}

#[test]
fn parse_miasto_params_parses_and_spot_checks() {
    let root =
        economy_society::parse_miasto_params().expect("miasto-params.json parses into 1:1 structs");
    assert_eq!(root.min_dystans_miast.wartosc, 4_i64);
    assert_eq!(root.zasieg_okolicy_miasta.wartosc, 10_i64);
    assert!(((root.udzial_output_rozwoj.wartosc) - 0.1).abs() < 1e-12);
}

#[test]
fn parse_resources_parses_and_spot_checks() {
    let root = economy_society::parse_resources().expect("resources.json parses into 1:1 structs");
    assert_eq!(root.len(), 15_usize);
    assert_eq!(root[0].surowiec, "Żywność");
    assert_eq!(root[0].zrod_o_budynek, "pola (wg terenu)");
    assert_eq!(root[0].uwagi, "konsumpcja: 1/ludnosc + 1/jednostke");
}

#[test]
fn parse_e_start_params_parses_and_spot_checks() {
    let root = economy_society_part2::parse_e_start_params()
        .expect("e-start-params.json parses into 1:1 structs");
    assert_eq!(root.defaulty.city_limit_base_default, 10_i64);
    assert_eq!(root.skala_mapy.ogromny.miasta_panstwa, 8_i64);
    assert_eq!(root.kreator_zaawansowane.manual_seed_default, 424242_i64);
}

#[test]
fn parse_ai_params_parses_and_spot_checks() {
    let root =
        economy_society_part2::parse_ai_params().expect("ai-params.json parses into 1:1 structs");
    assert_eq!(root.trudnosc_poziom1_bonus_produkcja.wartosc, 0_i64);
    assert!(((root.ai_sojusz_obowiazek_min_ratio.wartosc) - 0.55).abs() < 1e-12);
    assert_eq!(root.ludy_morza_rajd_okres_trudny.wartosc, 1_i64);
}

#[test]
fn parse_ui_params_parses_and_spot_checks() {
    let root =
        economy_society_part2::parse_ui_params().expect("ui-params.json parses into 1:1 structs");
    assert!(((root.panel_miasta.rush_cost_mnoznik) - 0.8).abs() < 1e-12);
    assert_eq!(root.panel_miasta.font_scale_domyslna_px, 16_i64);
    assert_eq!(root.nowa_gra.ustawienia[0].domyslny, 1_i64);
}
