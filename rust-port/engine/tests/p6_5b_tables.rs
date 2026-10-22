//! P6.5B - tabele `data/derived/{manpower-params,unit-building-bonuses,locale-compare-ascii}.json`:
//! testy KSZTALTU (bez pinow wartosci balansowych), zgodnosc stalych z URUCHOMIONYM webem (wektor
//! `consts`) oraz zamkniecie domkniec wstrzyknietych w P6.5A (`stackArmorBadgeLevel`,
//! `stackSoftBadgeLevel`) prawdziwym portem odznak sciezek.

#[path = "p6_5b_vectors/common.rs"]
mod common;
#[path = "p6_5a_vectors/common.rs"]
mod common5a;

use civ_engine::data::derived::{
    locale_compare_ascii, manpower_params, parse_locale_compare_ascii, parse_manpower_params,
    parse_unit_building_bonuses, unit_building_bonuses_params,
};
use civ_engine::domain::combat::unit_building_bonuses::{
    armor_building_ids, armor_path_badge_level, armor_path_level_max_pp, armor_path_max_pp,
    path_a_max_pp, path_b_max_pp, soft_path_badge_level, soft_path_level_max_pp, soft_path_max_pp,
    soft_stat_building_ids, UnitBuildingProgress, ZERO_BUILDING_COMBAT_BONUS,
};
use civ_engine::domain::recruitment::army_merge::{
    stack_armor_badge_level, stack_soft_badge_level, StosJednostka,
};
use civ_engine::domain::recruitment::manpower::{all_epoka_manpower_rows, is_civilian_unit};
use common::{assert_same, list, load, num, opt_num};
use serde_json::Value;

fn consts() -> Value {
    load(include_str!("p6_5b_vectors/format.json"))["consts"].clone()
}

#[test]
fn tables_parse_and_have_the_expected_shape() {
    let manpower = parse_manpower_params().expect("manpower-params.json");
    assert!(manpower.epoka.min >= 1 && manpower.epoka.min <= manpower.epoka.max);
    assert!(manpower.min_ludkow >= 1.0 && manpower.maks_proc > 0.0);
    assert!(!manpower.scout_type_id.is_empty());
    let defaults = &manpower.domyslne_uzupelnienie_hp_proc;
    for pct in [defaults.easy, defaults.normal, defaults.hard] {
        assert!(pct > 0.0 && pct <= manpower.maks_proc);
    }
    let regen = &manpower.domyslne_regen;
    assert!(regen.proc_max_na_ture >= 0.0 && regen.proc_max_na_ture <= manpower.maks_proc);
    let mults = &manpower.mnozniki_cywilizacji;
    for floor in [mults.regen_min, mults.max_min, mults.skalowanie_min] {
        assert!(floor > 0.0 && floor <= 1.0);
    }
    let types = [
        &mults.typ_regen_bonus,
        &mults.typ_regen_mnoznik,
        &mults.typ_pula_bonus,
        &mults.typ_pula_mnoznik,
    ];
    for (i, a) in types.iter().enumerate() {
        assert!(!a.is_empty());
        assert!(
            types.iter().skip(i + 1).all(|b| a != b),
            "typy bonusow sa rozne"
        );
    }
    let keys = &manpower.klucz_sortowania_leczenia;
    assert!(
        keys.oblezone != keys.garnizon && keys.garnizon != keys.pole && keys.oblezone != keys.pole
    );
    assert!(manpower.powody_blokady.brak_manpower != manpower.powody_blokady.brak_ludnosci);
    assert!(!manpower.cywilne.kategorie.is_empty() && !manpower.cywilne.typy.is_empty());
    let format = &manpower.formatowanie;
    assert!(format.prog_mln > format.prog_tys && format.prog_tys > 1.0);
    assert!(format.obywatel_jeden != format.obywatel_wiele);

    let bonuses = parse_unit_building_bonuses().expect("unit-building-bonuses.json");
    for path in [&bonuses.sciezka_pancerz, &bonuses.sciezka_parametry] {
        assert!(!path.budynki.is_empty() && path.max_pp > 0.0);
        let mut ids = path.budynki.clone();
        ids.sort();
        ids.dedup();
        assert_eq!(
            ids.len(),
            path.budynki.len(),
            "id budynkow sciezki sa rozne"
        );
    }
    assert!(bonuses
        .sciezka_pancerz
        .budynki
        .iter()
        .all(|id| !bonuses.sciezka_parametry.budynki.contains(id)));
    assert!(bonuses.max_glebokosc_lancucha > 0 && bonuses.liczba_tercji >= 2.0);
    assert!(bonuses.podstawa_procentu > 0.0);
    let labels = &bonuses.etykiety;
    assert!(labels.pancerz.contains("{wartosc}") && labels.parametry.contains("{wartosc}"));
    for template in [&labels.wzmianka_pancerz, &labels.wzmianka_parametry] {
        assert!(template.contains("{przyrost}") && template.contains("{razem}"));
    }
    for placeholder in ["{jednostka}", "{miasto}", "{czesci}"] {
        assert!(labels.wzmianka.contains(placeholder));
    }
    assert!(!labels.separator.is_empty());

    let locale = parse_locale_compare_ascii().expect("locale-compare-ascii.json");
    let mut seen = std::collections::HashSet::new();
    assert!(
        locale.kolejnosc_podstawowa.chars().all(|c| seen.insert(c)),
        "znaki unikalne"
    );
    for c in ('0'..='9').chain('a'..='z').chain([' ']) {
        assert!(locale.kolejnosc_podstawowa.contains(c), "brak znaku {c:?}");
    }
    assert!(locale
        .kolejnosc_podstawowa
        .chars()
        .all(|c| !c.is_ascii_uppercase()));
}

#[test]
fn era_table_rows_are_contiguous_and_cover_the_clamp_range() {
    let rows = all_epoka_manpower_rows();
    let bounds = &manpower_params().epoka;
    assert_eq!(rows.len(), (bounds.max - bounds.min + 1) as usize);
    for (offset, row) in rows.iter().enumerate() {
        assert_same("epoka", row.epoka, f64::from(bounds.min) + offset as f64);
        assert!(
            row.ludek_na_ludka > 0.0
                && row.manpower_na_ludka > 0.0
                && row.manpower_na_jednostke > 0.0
        );
    }
    assert!(rows
        .windows(2)
        .all(|w| w[1].ludek_na_ludka >= w[0].ludek_na_ludka));
}

#[test]
fn table_constants_equal_the_running_web() {
    let consts = consts();
    for (row, web) in all_epoka_manpower_rows()
        .iter()
        .zip(list(&consts["rows"], "rows"))
    {
        assert_same("epoka", row.epoka, num(&web["epoka"]));
        assert_same(
            "ludekNaLudka",
            row.ludek_na_ludka,
            num(&web["ludekNaLudka"]),
        );
        assert_same(
            "manpowerNaLudka",
            row.manpower_na_ludka,
            num(&web["manpowerNaLudka"]),
        );
        assert_same(
            "manpowerNaJednostke",
            row.manpower_na_jednostke,
            num(&web["manpowerNaJednostke"]),
        );
    }
    assert_eq!(
        all_epoka_manpower_rows().len(),
        list(&consts["rows"], "rows").len()
    );
    assert_eq!(
        manpower_params().scout_type_id,
        consts["SCOUT_TYPE_ID"].as_str().expect("SCOUT_TYPE_ID")
    );
    let strings = |value: &Value| -> Vec<String> {
        list(value, "napisy")
            .iter()
            .map(|s| s.as_str().expect("napis").to_owned())
            .collect()
    };
    assert_eq!(
        manpower_params().cywilne.kategorie,
        strings(&consts["CIVILIAN_CATEGORIES"])
    );
    assert_eq!(
        manpower_params().cywilne.typy,
        strings(&consts["CIVILIAN_TYPE_IDS"])
    );
    assert_eq!(armor_building_ids(), strings(&consts["ARMOR_BUILDING_IDS"]));
    assert_eq!(
        soft_stat_building_ids(),
        strings(&consts["SOFT_STAT_BUILDING_IDS"])
    );
    assert_same(
        "ARMOR_PATH_MAX_PP",
        armor_path_max_pp(),
        num(&consts["ARMOR_PATH_MAX_PP"]),
    );
    assert_same(
        "SOFT_PATH_MAX_PP",
        soft_path_max_pp(),
        num(&consts["SOFT_PATH_MAX_PP"]),
    );
    assert_same(
        "PATH_A_MAX_PP",
        path_a_max_pp(),
        num(&consts["PATH_A_MAX_PP"]),
    );
    assert_same(
        "PATH_B_MAX_PP",
        path_b_max_pp(),
        num(&consts["PATH_B_MAX_PP"]),
    );
    for (got, key) in [
        (armor_path_level_max_pp(), "ARMOR_PATH_LEVEL_MAX_PP"),
        (soft_path_level_max_pp(), "SOFT_PATH_LEVEL_MAX_PP"),
    ] {
        let web = list(&consts[key], key);
        assert_same(key, got[0], num(&web[0]));
        assert_same(key, got[1], num(&web[1]));
    }
    assert_same(
        "ZERO.pancerz",
        ZERO_BUILDING_COMBAT_BONUS.pancerz,
        num(&consts["ZERO_BUILDING_COMBAT_BONUS"]["pancerz"]),
    );
    assert_same(
        "ZERO.other",
        ZERO_BUILDING_COMBAT_BONUS.other,
        num(&consts["ZERO_BUILDING_COMBAT_BONUS"]["other"]),
    );
}

#[test]
fn tables_are_loaded_from_the_embedded_json_files() {
    // singletony = ten sam plik, ktory parsuja funkcje `parse_*` (brak drugiego zrodla stalych)
    assert_eq!(
        *manpower_params(),
        parse_manpower_params().expect("manpower")
    );
    assert_eq!(
        *unit_building_bonuses_params(),
        parse_unit_building_bonuses().expect("bonuses")
    );
    assert_eq!(
        *locale_compare_ascii(),
        parse_locale_compare_ascii().expect("locale")
    );
}

#[test]
fn civilian_set_is_resolved_from_the_table() {
    let table = &manpower_params().cywilne;
    for category in &table.kategorie {
        assert!(is_civilian_unit(category, "TypSpozaTabeli"));
    }
    for type_id in &table.typy {
        assert!(is_civilian_unit("kategoria-spoza-tabeli", type_id));
    }
    assert!(!is_civilian_unit(
        "kategoria-spoza-tabeli",
        "TypSpozaTabeli"
    ));
}

#[test]
fn p65a_badge_closures_are_closed_by_the_real_path_badge_port() {
    // P6.5A wstrzykiwalo `armorPathBadgeLevel` / `softPathBadgeLevel`; tu podajemy PRAWDZIWY port
    // (jednostki z wektora `stackBadges` P6.5A niosa `pancerzBonusProc` / `parametryBonusProc`).
    let text = include_str!("p6_5a_vectors/display.json");
    let root = common5a::load(text);
    let (mut armor_nonzero, mut soft_nonzero, mut cases) = (0, 0, 0);
    for case in common5a::cases(&root, "stackBadges") {
        let all: Vec<StosJednostka> = common5a::units(&case["units"]);
        let progress: Vec<UnitBuildingProgress> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(|u| UnitBuildingProgress {
                pancerz_bonus_proc: opt_num(u.get("pancerzBonusProc")),
                parametry_bonus_proc: opt_num(u.get("parametryBonusProc")),
            })
            .collect();
        let at = |u: &StosJednostka| {
            all.iter()
                .position(|candidate| std::ptr::eq(candidate, u))
                .expect("referencja spoza listy")
        };
        let stack = common5a::refs(&all, &common5a::indices(&case["stack"]));
        let armor = |u: &StosJednostka| armor_path_badge_level(Some(&progress[at(u)]));
        let soft = |u: &StosJednostka| soft_path_badge_level(Some(&progress[at(u)]));
        let a = stack_armor_badge_level(&stack, &armor);
        let s = stack_soft_badge_level(&stack, &soft);
        assert_eq!(
            u64::from(a),
            case["armor"].as_u64().expect("armor"),
            "{case}"
        );
        assert_eq!(u64::from(s), case["soft"].as_u64().expect("soft"), "{case}");
        armor_nonzero += usize::from(a > 0);
        soft_nonzero += usize::from(s > 0);
        cases += 1;
    }
    assert!(cases > 50 && armor_nonzero > 10 && soft_nonzero > 10);
}
