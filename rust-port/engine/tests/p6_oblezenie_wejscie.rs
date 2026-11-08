//! R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1 (partia P2): testy `domain::siege_enter_city` (wejscie po kapitulacji).
//!
//! Wektory: wynik web `gra/src/game/siege-enter-city.ts` (`a61337844`) uruchomiony pod Node 22.22
//! (`--experimental-strip-types`) na tych samych wejsciach (driver poza repo). Oczekiwania podane jawnie ponizej.

use civ_engine::domain::siege_enter_city::{
    enter_city_after_surrender, plan_surrender_entry, EnterCity, EnterUnit, SiegeEnterDeps,
};

fn mil(id: &str, owner: i64, q: i64, r: i64) -> EnterUnit {
    EnterUnit {
        id: id.to_string(),
        owner_id: owner,
        type_id: "t".to_string(),
        category: "mil".to_string(),
        q,
        r,
        oblega_city_id: None,
        is_general: false,
        embarked: false,
        in_garnizon: false,
        ufortyfikowany_w_polu: false,
    }
}

/// Oblegajacy jednostka przy miescie C1 (wejscie jako web `oblegaCityId: 'C1'`).
fn besieger(id: &str, q: i64, r: i64) -> EnterUnit {
    let mut u = mil(id, 2, q, r);
    u.oblega_city_id = Some("C1".to_string());
    u
}

fn city() -> EnterCity {
    EnterCity {
        id: "C1".to_string(),
        q: 5,
        r: 5,
    }
}

/// Web `isCivilian`: kategoria `civ`.
fn is_civ(u: &EnterUnit) -> bool {
    u.category == "civ"
}

fn plan(units: &[EnterUnit], limit: Option<i64>) -> Vec<String> {
    let deps = SiegeEnterDeps {
        is_civilian: &is_civ,
        stack_limit: limit,
    };
    plan_surrender_entry(units, &city(), 2, &deps)
}

fn ids(v: &[&str]) -> Vec<String> {
    v.iter().map(|s| s.to_string()).collect()
}

#[test]
fn bigger_stack_wins() {
    // web: bigger_stack -> ["a2","a3"]
    let units = vec![
        besieger("a1", 3, 3),
        besieger("a2", 4, 4),
        besieger("a3", 4, 4),
    ];
    assert_eq!(plan(&units, None), ids(&["a2", "a3"]));
}

#[test]
fn tie_general_wins() {
    // web: tie_general -> ["a2"] (rowny rozmiar, a2 ma generala)
    let mut g = besieger("a2", 2, 2);
    g.is_general = true;
    let units = vec![besieger("a1", 3, 3), g];
    assert_eq!(plan(&units, None), ids(&["a2"]));
}

#[test]
fn tie_lowest_id_wins() {
    // web: tie_minid -> ["b1"] (rowny rozmiar, brak generala: najnizsze id)
    let units = vec![besieger("b2", 3, 3), besieger("b1", 2, 2)];
    assert_eq!(plan(&units, None), ids(&["b1"]));
}

#[test]
fn foreign_unit_on_city_blocks_entry() {
    // web: foreign_on_city -> []  (Z4)
    let units = vec![besieger("a1", 3, 3), mil("x1", 3, 5, 5)];
    assert!(plan(&units, None).is_empty());
}

#[test]
fn civilian_embarked_and_inside_stay_out() {
    // web: civ_embarked_inside -> ["a1"]  (Z5: cywil, zaokretowany i juz w miescie zostaja)
    let mut civ = besieger("c1", 3, 3);
    civ.category = "civ".to_string();
    let mut emb = besieger("e1", 4, 4);
    emb.embarked = true;
    let units = vec![besieger("a1", 3, 3), civ, emb, besieger("in1", 5, 5)];
    assert_eq!(plan(&units, None), ids(&["a1"]));
}

#[test]
fn embarked_stack_is_ignored_even_if_bigger() {
    // web: embarked_bigger_stack -> ["a1"] (zaokretowane e1+e2 wieksze stosem, ale Z5 wyklucza je)
    let mut e1 = besieger("e1", 4, 4);
    e1.embarked = true;
    let mut e2 = besieger("e2", 4, 4);
    e2.embarked = true;
    let units = vec![besieger("a1", 3, 3), e1, e2];
    assert_eq!(plan(&units, None), ids(&["a1"]));
}

#[test]
fn wrong_city_or_non_besieger_is_ignored() {
    // web: wrong_city -> []
    let mut u = mil("a1", 2, 3, 3);
    u.oblega_city_id = Some("C2".to_string());
    assert!(plan(&[u], None).is_empty());
    // brak oblegania (oblegaCityId undefined) -> nikt
    assert!(plan(&[mil("a1", 2, 3, 3)], None).is_empty());
}

#[test]
fn empty_units_gives_nobody() {
    // web: empty -> []
    assert!(plan(&[], None).is_empty());
}

#[test]
fn zero_limit_blocks_everyone() {
    // web: limit_zero_none (limit 0) -> []
    let units = vec![
        besieger("a1", 3, 3),
        besieger("a2", 4, 4),
        besieger("a3", 4, 4),
    ];
    assert!(plan(&units, Some(0)).is_empty());
}

#[test]
fn stack_limit_boundary_n_included_n_plus_1_excluded() {
    // web: limit_room_exact (limit 3, 1 wlasna na miescie -> miejsce 2 == rozmiar grupy 2) -> ["a1","a2"]
    let on_city = mil("g1", 2, 5, 5);
    let exact = vec![besieger("a1", 3, 3), besieger("a2", 3, 3), on_city.clone()];
    assert_eq!(plan(&exact, Some(3)), ids(&["a1", "a2"]));
    // web: limit_room_plus1 (miejsce 2 < rozmiar 3) -> []
    let plus1 = vec![
        besieger("a1", 3, 3),
        besieger("a2", 3, 3),
        besieger("a3", 3, 3),
        on_city,
    ];
    assert!(plan(&plus1, Some(3)).is_empty());
}

#[test]
fn stack_limit_counts_own_units_already_in_city() {
    // web: limit_exact (limit 2, 1 wlasna w miescie -> miejsce 1 < grupa 2) -> []
    let units = vec![
        besieger("a1", 3, 3),
        besieger("a2", 3, 3),
        mil("g1", 2, 5, 5),
    ];
    assert!(plan(&units, Some(2)).is_empty());
    // web: limit_plus1 (limit 2, 2 wlasne w miescie -> miejsce 0) -> []
    let units = vec![
        besieger("a1", 3, 3),
        besieger("a2", 3, 3),
        besieger("a3", 3, 3),
        mil("g1", 2, 5, 5),
        mil("g2", 2, 5, 5),
    ];
    assert!(plan(&units, Some(2)).is_empty());
}

#[test]
fn negative_room_blocks_all_groups() {
    // web: limit_neg_room (limit 1, 3 wlasne w miescie -> miejsce -2) -> []
    let units = vec![
        besieger("a1", 3, 3),
        mil("g1", 2, 5, 5),
        mil("g2", 2, 5, 5),
        mil("g3", 2, 5, 5),
    ];
    assert!(plan(&units, Some(1)).is_empty());
}

#[test]
fn limit_3_picks_bigger_group_that_fits() {
    // web: limit_3_bigger (limit 3, miasto puste) -> ["a2","a3"]
    let units = vec![
        besieger("a1", 3, 3),
        besieger("a2", 4, 4),
        besieger("a3", 4, 4),
    ];
    assert_eq!(plan(&units, Some(3)), ids(&["a2", "a3"]));
}

#[test]
fn enter_moves_units_clears_garrison_and_fortify_flags() {
    let mut units = vec![
        besieger("a1", 3, 3),
        besieger("a2", 4, 4),
        besieger("a3", 4, 4),
    ];
    units[1].in_garnizon = true;
    units[1].ufortyfikowany_w_polu = true;
    let is_civilian = is_civ;
    let deps = SiegeEnterDeps {
        is_civilian: &is_civilian,
        stack_limit: None,
    };
    let moved = enter_city_after_surrender(&mut units, &city(), 2, &deps);
    assert_eq!(moved, ids(&["a2", "a3"]));
    // Z3: wejscie bez kosztu ruchu, flagi garnizonu/fortyfikacji zdjete.
    let a2 = units.iter().find(|u| u.id == "a2").expect("a2");
    assert_eq!((a2.q, a2.r), (5, 5));
    assert!(!a2.in_garnizon);
    assert!(!a2.ufortyfikowany_w_polu);
    // jednostka nieweszla zostaje na heksie
    let a1 = units.iter().find(|u| u.id == "a1").expect("a1");
    assert_eq!((a1.q, a1.r), (3, 3));
}

#[test]
fn plan_does_not_mutate_units() {
    let units = vec![besieger("a1", 3, 3), besieger("a2", 4, 4)];
    let before = units.clone();
    let _ = plan(&units, None);
    assert_eq!(units, before);
}
