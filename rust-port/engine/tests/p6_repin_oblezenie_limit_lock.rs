//! R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1 (b): SIEGE-NEARBY -- blokada tylko oblegajacych stosow.
//!
//! Przypadki reczne (zrodlo: gra/src/game/armyMerge.ts, 638e90bea). Wektory z URUCHOMIONEGO weba sa w
//! p6_repin_oblezenie_limit_web.rs (runda 2). Miasto w (0,0); sasiedzi = heksy o odleglosci 1.

use civ_engine::domain::siege_nearby_lock::{
    besiege_army_groups, besiege_lock_targets, stack_group_id_of, LockUnit,
};
use std::collections::BTreeSet;

fn u(owner: i64, q: i64, r: i64, garn: bool, oblega: Option<&str>) -> LockUnit {
    LockUnit {
        owner_id: owner,
        q,
        r,
        in_garnizon: garn,
        oblega_city_id: oblega.map(str::to_string),
        explicit_stack_group_id: None,
    }
}

#[test]
fn klucz_grupy_jak_web() {
    assert_eq!(stack_group_id_of(&u(0, 1, 0, false, None)), "0|1,0");
    assert_eq!(stack_group_id_of(&u(0, 1, 0, true, None)), "0|1,0|g");
    let mut j = u(0, 1, 0, false, None);
    j.explicit_stack_group_id = Some("G7".into());
    assert_eq!(stack_group_id_of(&j), "G7");
    // pusty stackGroupId = falsy w JS -> wyliczenie z pozycji
    j.explicit_stack_group_id = Some(String::new());
    assert_eq!(stack_group_id_of(&j), "0|1,0");
}

#[test]
fn grupy_oblegajacej_armii_z_jednostek() {
    let units = vec![
        u(0, 1, 0, false, Some("city-A")), // oblegajaca, sasiad
        u(0, 2, 0, false, None),           // nieoblegajaca, nie w grupie
        u(0, 0, 1, false, Some("city-A")), // oblegajaca, sasiad
        u(1, 1, 0, false, Some("city-A")), // inny wlasciciel
    ];
    let g = besiege_army_groups(&units, "city-A", 0, Some("hint")).unwrap();
    assert_eq!(
        g,
        BTreeSet::from(["0|1,0".to_string(), "0|0,1".to_string()])
    );
}

#[test]
fn grupy_hint_gdy_brak_oblegajacych_jednostek() {
    let units = vec![u(0, 1, 0, false, None)];
    let g = besiege_army_groups(&units, "city-A", 0, Some("0|5,5")).unwrap();
    assert_eq!(g, BTreeSet::from(["0|5,5".to_string()]));
    assert_eq!(besiege_army_groups(&units, "city-A", 0, None), None);
}

#[test]
fn blokada_tylko_stosow_oblegajacej_grupy() {
    // Sasiad (1,0) nalezy do grupy oblegajacej; sasiad (0,1) nie (bez oblegania).
    let units = vec![
        u(0, 1, 0, false, Some("city-A")), // idx0 sasiad, oblegajacy
        u(0, 0, 1, false, None),           // idx1 sasiad, NIE oblegajacy -> nie blokowany
        u(0, 3, 0, false, Some("city-A")), // idx2 daleko
        u(1, 1, 1, false, None),           // idx3 obcy wlasciciel
    ];
    let groups = besiege_army_groups(&units, "city-A", 0, None);
    assert_eq!(
        besiege_lock_targets(&units, 0, 0, 0, groups.as_ref()),
        vec![0]
    );
}

#[test]
fn blokada_ai_bez_grup_blokuje_wszystkich_sasiadow() {
    // web: groups === undefined (AI) -> wszyscy sasiedzi wlasciciela
    let units = vec![
        u(0, 1, 0, false, None),
        u(0, 0, 1, false, None),
        u(0, 3, 0, false, None),
    ];
    assert_eq!(besiege_lock_targets(&units, 0, 0, 0, None), vec![0, 1]);
}

#[test]
fn garnizon_nie_jest_w_grupie_armii_poza_miastem() {
    // Oblegajaca armia poza miastem (klucz "0|1,0"); jednostka w garnizonie tego samego hexa ma klucz "|g" -> nie blokowana.
    let units = vec![u(0, 1, 0, false, Some("city-A")), u(0, 1, 0, true, None)];
    let groups = besiege_army_groups(&units, "city-A", 0, None);
    assert_eq!(
        besiege_lock_targets(&units, 0, 0, 0, groups.as_ref()),
        vec![0]
    );
}
