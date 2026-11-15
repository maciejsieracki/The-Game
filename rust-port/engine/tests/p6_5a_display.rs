//! P6.5A - reprezentant stosu, `computeStackDisplay`, pule HP / mocy / odznaki / weterana i
//! `stackVitals` z `armyMerge.ts`, z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_5a_vectors/display.json`, pin edb8fb56).
//!
//! P4-1D-Q1 (R-RUSTPORT-P4-1D-Q1-STACK-REPIN): czesc wyswietlania stosu przepieta na pin
//! `07d2fbd72` (reprezentant = `pickStackLeader`, `StackVitals.hasCommander`). Wektory @07:
//! `tests/p6_5a_vectors/vectors.json` (generator `gen.mjs`, strazniki SHA-256 fragmentow pinu):
//! `repin` = wszystkie wejscia starych wektorow przeliczone na @07, `cases` = nowe przypadki
//! (cywile, wodz, remisy UTF-16, garnizon+pole, jawny `stackGroupId` na dwoch heksach).
//! Stare wektory edb8fb56 sa sprawdzane bez zmian (diff = 0) dla przypadkow, ktorych wynik @07 sie
//! nie zmienil; przypadki z `repinChanged` sa sprawdzane wylacznie wynikiem @07.
//!
//! Zaleznosci spoza zakresu tematu (`sumRosterFieldM`, odznaki sciezek, poziomy weterana) sa
//! wstrzykiwane domknieciami czytajacymi WYNIKI prawdziwych funkcji weba zapisane w wektorze
//! (tablica `dep` rownolegla do listy jednostek); domkniecie rosteru ASERTUJE, ze `stack_field_power_m`
//! przekazalo roster (typ jednostki + definicja) w tej samej kolejnosci co web.

#[path = "p6_5a_vectors/common.rs"]
mod common;

use civ_engine::domain::recruitment::army_merge::{
    compute_stack_display, pick_stack_representative, stack_armor_badge_level, stack_field_power_m,
    stack_hp_pool, stack_soft_badge_level, stack_veteran_level, stack_veteran_star_count,
    stack_vitals, unit_at_representative, RosterEntry, StackVitals, StackVitalsDeps, StosJednostka,
};
use civ_engine::domain::recruitment::manpower::is_civilian_unit;
use common::{assert_same, cases, indices, load, num, refs, units};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5a_vectors/display.json");
const VECTORS_07: &str = include_str!("p6_5a_vectors/vectors.json");

fn root() -> Value {
    load(VECTORS)
}

fn root07() -> Value {
    load(VECTORS_07)
}

/// Indeksy starych przypadkow (`display.json`), ktorych wynik na @07 sie zmienil.
fn repin_changed(root07: &Value, name: &str) -> Vec<usize> {
    indices(&root07["repinChanged"][name])
}

fn list<'a>(root: &'a Value, section: &str, name: &str) -> &'a Vec<Value> {
    root[section][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak {section}.{name}"))
}

fn has_tag(case: &Value, tag: &str) -> bool {
    case["tags"]
        .as_array()
        .is_some_and(|tags| tags.iter().any(|t| t.as_str() == Some(tag)))
}

fn count_tag(list: &[Value], tag: &str) -> usize {
    list.iter().filter(|case| has_tag(case, tag)).count()
}

/// Wpis `dep` jednego uzycia (rownolegly do listy jednostek).
struct Dep {
    max_hp: f64,
    def_key: String,
    attack: f64,
    armor: u8,
    soft: u8,
    vet: u8,
    stars: u32,
}

fn deps(value: &Value) -> Vec<Dep> {
    value
        .as_array()
        .expect("dep")
        .iter()
        .map(|d| Dep {
            max_hp: num(&d["maxHp"]),
            def_key: d["defKey"].as_str().expect("defKey").to_owned(),
            attack: num(&d["attack"]),
            armor: u8::try_from(d["armor"].as_u64().expect("armor")).expect("u8"),
            soft: u8::try_from(d["soft"].as_u64().expect("soft")).expect("u8"),
            vet: u8::try_from(d["vet"].as_u64().expect("vet")).expect("u8"),
            stars: u32::try_from(d["stars"].as_u64().expect("stars")).expect("u32"),
        })
        .collect()
}

fn index_of(all: &[StosJednostka], u: &StosJednostka) -> usize {
    all.iter()
        .position(|candidate| std::ptr::eq(candidate, u))
        .expect("referencja spoza listy")
}

fn attack_table(all: &[StosJednostka], dep: &[Dep]) -> impl Fn(&StosJednostka) -> f64 {
    let attacks: Vec<f64> = dep.iter().map(|d| d.attack).collect();
    let addresses: Vec<*const StosJednostka> = all.iter().map(std::ptr::from_ref).collect();
    move |u| {
        let at = addresses
            .iter()
            .position(|a| std::ptr::eq(*a, u))
            .expect("referencja spoza listy");
        attacks[at]
    }
}

fn expected_roster(case: &Value) -> Vec<(String, String)> {
    case["roster"]
        .as_array()
        .expect("roster")
        .iter()
        .map(|entry| {
            (
                entry[0].as_str().expect("typeId").to_owned(),
                entry[1].as_str().expect("defKey").to_owned(),
            )
        })
        .collect()
}

fn assert_vitals(label: &str, got: &StackVitals, want: &Value) {
    assert_same(
        &format!("{label} ruchLeft"),
        got.ruch_left,
        num(&want["ruchLeft"]),
    );
    assert_same(
        &format!("{label} ruchMax"),
        got.ruch_max,
        num(&want["ruchMax"]),
    );
    assert_same(&format!("{label} hp"), got.hp, num(&want["hp"]));
    assert_same(&format!("{label} hpMax"), got.hp_max, num(&want["hpMax"]));
    assert_same(
        &format!("{label} fieldPowerM"),
        got.field_power_m,
        num(&want["fieldPowerM"]),
    );
    assert_eq!(
        got.count as u64,
        want["count"].as_u64().expect("count"),
        "{label}"
    );
    assert_eq!(
        u64::from(got.armor_badge_level),
        want["armorBadgeLevel"].as_u64().expect("armor"),
        "{label}"
    );
    assert_eq!(
        u64::from(got.soft_badge_level),
        want["softBadgeLevel"].as_u64().expect("soft"),
        "{label}"
    );
    assert_eq!(
        u64::from(got.veteran_level),
        want["veteranLevel"].as_u64().expect("vet"),
        "{label}"
    );
    assert_eq!(
        u64::from(got.veteran_stars),
        want["veteranStars"].as_u64().expect("stars"),
        "{label}"
    );
    // `hasCommander` (pole @07); wektory edb8fb56 go nie maja, a ich jednostki nie niosa `isGeneral`,
    // wiec web @07 dalby `false` (sprawdzone w `repin`).
    match want.get("hasCommander") {
        Some(flag) => assert_eq!(
            got.has_commander,
            flag.as_bool().expect("hasCommander"),
            "{label} hasCommander"
        ),
        None => assert!(
            !got.has_commander,
            "{label} hasCommander bez pola w wektorze"
        ),
    }
}

/// Tabela `roster -> wynik sumRosterFieldM` zapisana w wektorze (wynik PRAWDZIWEGO weba).
type RosterTable = Vec<(Vec<(String, String)>, f64)>;

fn roster_table_from(value: &Value) -> RosterTable {
    value
        .as_array()
        .map(|rows| {
            rows.iter()
                .map(|row| {
                    let entries = row[0]
                        .as_array()
                        .expect("roster")
                        .iter()
                        .map(|e| {
                            (
                                e[0].as_str().expect("typeId").to_owned(),
                                e[1].as_str().expect("defKey").to_owned(),
                            )
                        })
                        .collect();
                    (entries, num(&row[1]))
                })
                .collect()
        })
        .unwrap_or_default()
}

/// Buduje domkniecia zaleznosci dla listy jednostek i tablicy `dep` oraz wola `body`. Domkniecie
/// rosteru ASERTUJE, ze przekazany roster (typ + definicja, w kolejnosci) jest w tabeli weba, i zwraca
/// zapisany wynik prawdziwego `sumRosterFieldM`.
fn with_deps<R>(
    all: &[StosJednostka],
    dep: &[Dep],
    table: &RosterTable,
    body: impl FnOnce(&StackVitalsDeps<'_, String>) -> R,
) -> R {
    let max_hp_of = |u: &StosJednostka| dep[index_of(all, u)].max_hp;
    let def_of = |u: &StosJednostka| dep[index_of(all, u)].def_key.clone();
    let sum = |roster: &[RosterEntry<String>]| -> f64 {
        let got: Vec<(String, String)> = roster
            .iter()
            .map(|entry| (entry.type_id.clone(), entry.def.clone()))
            .collect();
        let row = table
            .iter()
            .find(|(entries, _)| *entries == got)
            .unwrap_or_else(|| panic!("roster {got:?} nie wystepuje w wektorze weba"));
        row.1
    };
    let armor = |u: &StosJednostka| dep[index_of(all, u)].armor;
    let soft = |u: &StosJednostka| dep[index_of(all, u)].soft;
    let vet = |u: &StosJednostka| dep[index_of(all, u)].vet;
    let stars = |u: &StosJednostka| dep[index_of(all, u)].stars;
    body(&StackVitalsDeps {
        max_hp_of: &max_hp_of,
        def_of: &def_of,
        sum_roster_field_m: &sum,
        armor_badge_level: &armor,
        soft_badge_level: &soft,
        veteran_level: &vet,
        veteran_star_count: &stars,
    })
}

/// Liczniki pokrycia sprawdzenia `pickStackRepresentative`.
#[derive(Default)]
struct PickCounts {
    checked: usize,
    ties: usize,
    empty: usize,
}

fn check_pick(list: &[Value], skip: &[usize]) -> PickCounts {
    let mut counts = PickCounts::default();
    for (at, case) in list.iter().enumerate() {
        if skip.contains(&at) {
            continue;
        }
        let all = units(&case["units"]);
        if case.get("threw").is_some() {
            assert!(case["threw"].as_bool().expect("threw"));
            let none: Vec<&StosJednostka> = Vec::new();
            assert!(pick_stack_representative(&none, &|_| 0.0).is_none());
            counts.empty += 1;
            continue;
        }
        let attacks: Vec<f64> = case["attacks"]
            .as_array()
            .expect("attacks")
            .iter()
            .map(num)
            .collect();
        let addresses: Vec<*const StosJednostka> = all.iter().map(std::ptr::from_ref).collect();
        let attack_of = |u: &StosJednostka| {
            attacks[addresses
                .iter()
                .position(|a| std::ptr::eq(*a, u))
                .expect("ref")]
        };
        let got = pick_stack_representative(&all, &attack_of).expect("niepusty stos");
        assert_eq!(
            index_of(&all, got) as u64,
            case["out"].as_u64().expect("out"),
            "pickStackRepresentative [{at}] {case}"
        );
        if attacks.windows(2).any(|w| w[0] == w[1]) {
            counts.ties += 1;
        }
        counts.checked += 1;
    }
    counts
}

/// Liczniki pokrycia sprawdzenia `computeStackDisplay`.
#[derive(Default)]
struct DisplayCounts {
    checked: usize,
    with_vitals: usize,
    stacked: usize,
    commander: usize,
}

fn check_display(list: &[Value], skip: &[usize]) -> DisplayCounts {
    let mut counts = DisplayCounts::default();
    for (at, case) in list.iter().enumerate() {
        if skip.contains(&at) {
            continue;
        }
        let all = units(&case["units"]);
        let dep = deps(&case["dep"]);
        let attack_of = attack_table(&all, &dep);
        let with_deps_flag = case["withDeps"].as_bool().expect("withDeps");
        let table = roster_table_from(&case["rosterTable"]);
        let got = if with_deps_flag {
            with_deps(&all, &dep, &table, |d| {
                compute_stack_display(&all, &attack_of, Some(d))
            })
        } else {
            compute_stack_display::<String>(&all, &attack_of, None)
        };
        let want = &case["out"];
        let want_ids: Vec<&str> = want["visibleIds"]
            .as_array()
            .expect("visibleIds")
            .iter()
            .map(|v| v.as_str().expect("id"))
            .collect();
        assert_eq!(got.visible_ids, want_ids, "visibleIds [{at}] {case}");
        let want_badge: Vec<(String, u64)> = want["badge"]
            .as_array()
            .expect("badge")
            .iter()
            .map(|pair| {
                (
                    pair[0].as_str().expect("id").to_owned(),
                    pair[1].as_u64().expect("n"),
                )
            })
            .collect();
        let got_badge: Vec<(String, u64)> = got
            .badge_by_rep_id
            .iter()
            .map(|(id, n)| (id.clone(), *n as u64))
            .collect();
        assert_eq!(got_badge, want_badge, "badgeByRepId [{at}] {case}");
        assert!(got.starving_rep_ids.is_none() && got.gold_deficit_rep_ids.is_none());
        match (&got.vitals_by_rep_id, want["vitals"].as_array()) {
            (None, None) => {}
            (Some(got_v), Some(want_v)) => {
                assert_eq!(got_v.len(), want_v.len(), "vitals [{at}] {case}");
                for ((id, vitals), want) in got_v.iter().zip(want_v) {
                    assert_eq!(id, want[0].as_str().expect("id"));
                    assert_vitals(&format!("vitals [{at}] {id}"), vitals, &want[1]);
                    if vitals.has_commander {
                        counts.commander += 1;
                    }
                }
                counts.with_vitals += 1;
            }
            other => panic!("obecnosc vitalsByRepId [{at}]: {other:?}"),
        }
        if got_badge.len() < want_ids.len() {
            counts.stacked += 1;
        }
        counts.checked += 1;
    }
    counts
}

fn check_at(list: &[Value], skip: &[usize]) -> (usize, usize) {
    let (mut found, mut missing) = (0, 0);
    for (at, case) in list.iter().enumerate() {
        if skip.contains(&at) {
            continue;
        }
        let all = units(&case["units"]);
        let attacks: Vec<f64> = case["attacks"]
            .as_array()
            .expect("attacks")
            .iter()
            .map(num)
            .collect();
        let addresses: Vec<*const StosJednostka> = all.iter().map(std::ptr::from_ref).collect();
        let attack_of = |u: &StosJednostka| {
            attacks[addresses
                .iter()
                .position(|a| std::ptr::eq(*a, u))
                .expect("ref")]
        };
        let got = unit_at_representative(
            i32::try_from(case["q"].as_i64().expect("q")).expect("q"),
            i32::try_from(case["r"].as_i64().expect("r")).expect("r"),
            &all,
            &attack_of,
        );
        match (got, case["out"].as_u64()) {
            (None, None) => missing += 1,
            (Some(u), Some(want)) => {
                assert_eq!(index_of(&all, u) as u64, want, "[{at}] {case}");
                found += 1;
            }
            other => panic!("unitAtRepresentative [{at}] {case}: {:?}", other.1),
        }
    }
    (found, missing)
}

/// `(niepuste stosy, stosy z wodzem)`.
fn check_vitals(list: &[Value], skip: &[usize]) -> (usize, usize) {
    let (mut nonempty, mut commander) = (0, 0);
    for (at, case) in list.iter().enumerate() {
        if skip.contains(&at) {
            continue;
        }
        let all = units(&case["units"]);
        let dep = deps(&case["dep"]);
        let stack = refs(&all, &indices(&case["stack"]));
        let roster = expected_roster(case);
        let table: RosterTable = if stack.is_empty() {
            Vec::new()
        } else {
            vec![(roster, num(&case["rosterSum"]))]
        };
        let got = with_deps(&all, &dep, &table, |d| stack_vitals(&stack, d));
        assert_vitals(&format!("stackVitals [{at}]"), &got, &case["out"]);
        if !stack.is_empty() {
            nonempty += 1;
        }
        if got.has_commander {
            commander += 1;
        }
    }
    (nonempty, commander)
}

#[test]
fn representative_matches_web_including_utf16_id_order_and_nan_attack() {
    let root = root();
    let skip = repin_changed(&root07(), "pickStackRepresentative");
    let counts = check_pick(cases(&root, "pickStackRepresentative"), &skip);
    assert_eq!(counts.empty, 1);
    assert!(
        counts.ties > 10,
        "wektory musza zawierac remisy ataku ({})",
        counts.ties
    );
    assert_eq!(
        counts.checked + counts.empty + skip.len(),
        cases(&root, "pickStackRepresentative").len()
    );
}

#[test]
fn compute_stack_display_matches_web_order_and_vitals() {
    let root = root();
    let skip = repin_changed(&root07(), "computeStackDisplay");
    let counts = check_display(cases(&root, "computeStackDisplay"), &skip);
    assert!(counts.with_vitals > 50, "{}", counts.with_vitals);
    assert!(
        counts.stacked > 20,
        "wektory musza zawierac stosy >1 ({})",
        counts.stacked
    );
    assert_eq!(
        counts.checked + skip.len(),
        cases(&root, "computeStackDisplay").len()
    );
}

#[test]
fn unit_at_representative_matches_web() {
    let root = root();
    let skip = repin_changed(&root07(), "unitAtRepresentative");
    let (found, missing) = check_at(cases(&root, "unitAtRepresentative"), &skip);
    assert!(found > 20 && missing > 5, "{found}/{missing}");
}

#[test]
fn hp_pool_matches_web_including_nonfinite_and_overfull_hp() {
    let root = root();
    let (mut skipped, mut clamped) = (0, 0);
    for case in cases(&root, "stackHpPool") {
        let all = units(&case["units"]);
        let dep = deps(&case["dep"]);
        let stack = refs(&all, &indices(&case["stack"]));
        let max_hp_of = |u: &StosJednostka| dep[index_of(&all, u)].max_hp;
        let (hp, hp_max) = stack_hp_pool(&stack, &max_hp_of);
        assert_same("hp", hp, num(&case["out"]["hp"]));
        assert_same("hpMax", hp_max, num(&case["out"]["hpMax"]));
        if stack.iter().any(|u| {
            let m = dep[index_of(&all, u)].max_hp;
            !m.is_finite() || m <= 0.0
        }) {
            skipped += 1;
        }
        if stack.iter().any(|u| {
            u.hp.is_some_and(|h| h.is_finite() && (h < 0.0 || h > dep[index_of(&all, u)].max_hp))
        }) {
            clamped += 1;
        }
    }
    assert!(skipped > 5 && clamped > 5, "{skipped}/{clamped}");
}

#[test]
fn field_power_passes_roster_in_web_order_and_returns_sum() {
    let root = root();
    let (mut empty, mut filled) = (0, 0);
    for case in cases(&root, "stackFieldPowerM") {
        let all = units(&case["units"]);
        let dep = deps(&case["dep"]);
        let stack = refs(&all, &indices(&case["stack"]));
        let roster = expected_roster(case);
        let out = num(&case["rosterSum"]);
        let def_of = |u: &StosJednostka| dep[index_of(&all, u)].def_key.clone();
        let sum = |entries: &[RosterEntry<String>]| -> f64 {
            let got: Vec<(String, String)> = entries
                .iter()
                .map(|entry| (entry.type_id.clone(), entry.def.clone()))
                .collect();
            assert_eq!(got, roster, "roster {case}");
            out
        };
        let got = stack_field_power_m(&stack, &def_of, &sum);
        assert_same("stackFieldPowerM", got, num(&case["out"]));
        if stack.is_empty() {
            empty += 1;
        } else {
            filled += 1;
        }
    }
    assert!(empty > 3 && filled > 50, "{empty}/{filled}");
}

#[test]
fn badge_and_veteran_maxima_match_web() {
    let root = root();
    let (mut armor_nonzero, mut vet_high, mut stars_nonzero) = (0, 0, 0);
    for case in cases(&root, "stackBadges") {
        let all = units(&case["units"]);
        let dep = deps(&case["dep"]);
        let stack = refs(&all, &indices(&case["stack"]));
        let armor = |u: &StosJednostka| dep[index_of(&all, u)].armor;
        let soft = |u: &StosJednostka| dep[index_of(&all, u)].soft;
        let vet = |u: &StosJednostka| dep[index_of(&all, u)].vet;
        let stars = |u: &StosJednostka| dep[index_of(&all, u)].stars;
        let a = stack_armor_badge_level(&stack, &armor);
        let s = stack_soft_badge_level(&stack, &soft);
        let v = stack_veteran_level(&stack, &vet);
        let n = stack_veteran_star_count(&stack, &stars);
        assert_eq!(
            u64::from(a),
            case["armor"].as_u64().expect("armor"),
            "{case}"
        );
        assert_eq!(u64::from(s), case["soft"].as_u64().expect("soft"), "{case}");
        assert_eq!(u64::from(v), case["vet"].as_u64().expect("vet"), "{case}");
        assert_eq!(
            u64::from(n),
            case["stars"].as_u64().expect("stars"),
            "{case}"
        );
        if a > 0 {
            armor_nonzero += 1;
        }
        if v > 1 {
            vet_high += 1;
        }
        if n > 0 {
            stars_nonzero += 1;
        }
    }
    assert!(armor_nonzero > 10 && vet_high > 10 && stars_nonzero > 10);
}

#[test]
fn stack_vitals_matches_web() {
    let root = root();
    let skip = repin_changed(&root07(), "stackVitals");
    let (nonempty, _) = check_vitals(cases(&root, "stackVitals"), &skip);
    assert!(nonempty > 50, "{nonempty}");
}

// ---------------------------------------------------------------------------
// P4-1D-Q1: wektory @07 (`vectors.json`)
// ---------------------------------------------------------------------------

#[test]
fn vectors_07_meta_and_pin_guards() {
    let old = root();
    let root = root07();
    assert_eq!(root["meta"]["pin"].as_str(), Some("07d2fbd72"));
    let guards = root["meta"]["guards"].as_object().expect("guards");
    for key in [
        "game/stack-leader.ts::pickStackLeader",
        "game/stack-leader.ts::isNonCombatStackMember",
        "units/setup.ts::isCivilianUnit",
        "game/armyMerge.ts::pickStackRepresentative",
        "game/armyMerge.ts::computeStackDisplay",
        "game/armyMerge.ts::unitAtRepresentative",
        "game/armyMerge.ts::stackVitals",
        "game/armyMerge.ts::StackVitals",
    ] {
        let sha = guards[key]["sha256"].as_str().unwrap_or_default();
        assert_eq!(sha.len(), 64, "straznik {key}");
    }
    // repin obejmuje WSZYSTKIE stare przypadki (te same wejscia, wynik @07)
    for name in [
        "pickStackRepresentative",
        "computeStackDisplay",
        "unitAtRepresentative",
        "stackVitals",
    ] {
        assert_eq!(
            list(&root, "repin", name).len(),
            cases(&old, name).len(),
            "repin {name}"
        );
        for (at, (new, was)) in list(&root, "repin", name)
            .iter()
            .zip(cases(&old, name))
            .enumerate()
        {
            assert_eq!(new["units"], was["units"], "repin {name}[{at}] wejscie");
        }
    }
    // zmiana zasady (cywil nie jest reprezentantem) musi byc widoczna w starych wejsciach
    assert!(!repin_changed(&root, "pickStackRepresentative").is_empty());
    assert!(!repin_changed(&root, "computeStackDisplay").is_empty());
}

#[test]
fn representative_matches_web_07_repin_and_new_cases() {
    let root = root07();
    let repin = check_pick(list(&root, "repin", "pickStackRepresentative"), &[]);
    assert_eq!(repin.empty, 1);
    assert!(repin.checked > 100, "{}", repin.checked);
    let new_cases = list(&root, "cases", "pickStackRepresentative");
    let counts = check_pick(new_cases, &[]);
    assert_eq!(counts.empty, 1);
    assert!(counts.ties > 10, "{}", counts.ties);
    // pokrycie: cywil silniejszy od bojowego, stos sam cywilny, cywil po kategorii i po typie,
    // remisy UTF-16
    assert!(count_tag(new_cases, "civ-higher-attack") >= 20);
    assert!(count_tag(new_cases, "civ-only") >= 5);
    assert!(count_tag(new_cases, "civ-by-category") >= 10);
    assert!(count_tag(new_cases, "civ-by-type") >= 10);
    assert!(count_tag(new_cases, "tie-utf16") >= 3);
    assert!(count_tag(new_cases, "civ-higher") >= 2);
}

#[test]
fn compute_stack_display_matches_web_07_repin_and_new_cases() {
    let root = root07();
    let repin = check_display(list(&root, "repin", "computeStackDisplay"), &[]);
    assert!(repin.with_vitals > 50 && repin.stacked > 20);
    let new_cases = list(&root, "cases", "computeStackDisplay");
    let counts = check_display(new_cases, &[]);
    assert!(counts.with_vitals > 50, "{}", counts.with_vitals);
    assert!(counts.stacked > 20, "{}", counts.stacked);
    assert!(
        counts.commander > 10,
        "hasCommander=true w vitals ({})",
        counts.commander
    );
    for tag in [
        "garrison-field",
        "group-two-hexes",
        "civ-only",
        "civ-higher",
        "commander-true",
        "commander-false",
        "commander-undefined",
    ] {
        assert!(count_tag(new_cases, tag) >= 2, "brak przypadkow {tag}");
    }
}

#[test]
fn unit_at_representative_matches_web_07_repin_and_new_cases() {
    let root = root07();
    let (found, missing) = check_at(list(&root, "repin", "unitAtRepresentative"), &[]);
    assert!(found > 20 && missing > 5, "{found}/{missing}");
    let new_cases = list(&root, "cases", "unitAtRepresentative");
    let (found, missing) = check_at(new_cases, &[]);
    assert!(found > 50 && missing > 5, "{found}/{missing}");
    assert!(count_tag(new_cases, "civ-higher-attack") >= 10);
}

#[test]
fn stack_vitals_has_commander_matches_web_07() {
    let root = root07();
    let (nonempty, commander) = check_vitals(list(&root, "repin", "stackVitals"), &[]);
    assert!(nonempty > 50, "{nonempty}");
    assert_eq!(commander, 0, "jednostki edb8fb56 nie niosa isGeneral");
    let new_cases = list(&root, "cases", "stackVitals");
    let (nonempty, commander) = check_vitals(new_cases, &[]);
    assert!(nonempty > 50, "{nonempty}");
    assert!(commander > 10, "{commander}");
    for tag in ["commander-true", "commander-false", "commander-undefined"] {
        assert!(count_tag(new_cases, tag) >= 5, "brak przypadkow {tag}");
    }
    // `hasCommander` w wektorze = `stack.some(isGeneral === true)` takze dla stosow, w ktorych
    // `isGeneral` jest `false` albo brak pola
    let only_false_or_missing = new_cases
        .iter()
        .filter(|c| {
            !has_tag(c, "commander-true") && !c["out"]["count"].as_u64().is_some_and(|n| n == 0)
        })
        .count();
    assert!(only_false_or_missing > 10, "{only_false_or_missing}");
}

#[test]
fn civilian_table_matches_pin_is_civilian_unit() {
    let root = root07();
    let civilian = &root["civilian"];
    let probes = civilian["probes"].as_array().expect("probes");
    assert!(probes.len() > 50);
    let (mut yes, mut no) = (0, 0);
    for probe in probes {
        let category = probe["category"].as_str().expect("category");
        let type_id = probe["typeId"].as_str().expect("typeId");
        let want = probe["out"].as_bool().expect("out");
        assert_eq!(
            probe["leaderNonCombat"].as_bool(),
            Some(want),
            "isNonCombatStackMember == isCivilianUnit"
        );
        assert_eq!(is_civilian_unit(category, type_id), want, "{probe}");
        if want {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 10 && no > 10, "{yes}/{no}");
    for category in civilian["categories"].as_array().expect("categories") {
        assert!(is_civilian_unit(category.as_str().expect("kat"), ""));
    }
    for type_id in civilian["typeIds"].as_array().expect("typeIds") {
        assert!(is_civilian_unit("", type_id.as_str().expect("typ")));
    }
}
