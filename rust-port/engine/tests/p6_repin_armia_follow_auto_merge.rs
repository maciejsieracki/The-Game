//! P6-REPIN-ARMIA-FOLLOW-AUTOMERGE (FALA 569): zgodnosc `followLeaderAutoMergeDecision` i
//! `canJoinStackAt` z URUCHOMIONYM webem.
//!
//! Wektory: `tests/p6_repin_armia_follow_vectors.json`, generator: `tests/p6_repin_armia_follow_gen.mjs`
//! (Node 22, `origin/main` `gra/src/game/army-follow-auto-merge.ts` + `army-stack-limit.ts`, seed 569).

use civ_engine::domain::army_follow_auto_merge::{
    can_join_stack_at, follow_leader_auto_merge_decision, own_unit_count_at,
    FollowAutoMergeDecision, FollowAutoMergeUnit,
};
use serde_json::Value;
use std::collections::HashSet;

const VECTORS: &str = include_str!("p6_repin_armia_follow_vectors.json");

fn unit(
    id: &str,
    owner_id: i64,
    q: i64,
    r: i64,
    follow: bool,
    general: bool,
) -> FollowAutoMergeUnit {
    FollowAutoMergeUnit {
        id: id.to_string(),
        owner_id,
        q,
        r,
        follow_general: follow,
        is_general: general,
    }
}

/// Wektor z JSON: `[id, owner, q, r, followGeneral|null, isGeneral|null]`; `null` (JS `undefined`)
/// mapuje sie na `false` (zalozenie w module).
fn unit_from(v: &Value) -> FollowAutoMergeUnit {
    let a = v.as_array().expect("jednostka jako tablica");
    let flag = |x: &Value| x.as_bool().unwrap_or(false);
    FollowAutoMergeUnit {
        id: a[0].as_str().unwrap().to_string(),
        owner_id: a[1].as_i64().unwrap(),
        q: a[2].as_i64().unwrap(),
        r: a[3].as_i64().unwrap(),
        follow_general: flag(&a[4]),
        is_general: flag(&a[5]),
    }
}

fn expected_decision(text: &str) -> FollowAutoMergeDecision {
    match text {
        "none" => FollowAutoMergeDecision::None,
        "merge" => FollowAutoMergeDecision::Merge,
        "limit-blocked" => FollowAutoMergeDecision::LimitBlocked,
        other => panic!("nieznana decyzja w wektorze: {other}"),
    }
}

fn pick(units: &[FollowAutoMergeUnit], ids: &Value) -> Vec<FollowAutoMergeUnit> {
    ids.as_array()
        .unwrap()
        .iter()
        .map(|id| {
            let id = id.as_str().unwrap();
            units
                .iter()
                .find(|u| u.id == id)
                .unwrap_or_else(|| panic!("brak jednostki {id} w scenariuszu"))
                .clone()
        })
        .collect()
}

#[test]
fn wektory_z_weba_zgodne_z_follow_leader_auto_merge_decision_i_can_join_stack_at() {
    let root: Value = serde_json::from_str(VECTORS).expect("wektory JSON");
    let scenarios = root["scenarios"].as_array().unwrap();
    assert_eq!(root["count"].as_u64().unwrap() as usize, scenarios.len());

    let (mut merge, mut blocked, mut none) = (0usize, 0usize, 0usize);
    for sc in scenarios {
        let name = sc["name"].as_str().unwrap();
        let q = sc["q"].as_i64().unwrap();
        let r = sc["r"].as_i64().unwrap();
        let limit = sc["limit"].as_i64().unwrap();
        let units: Vec<FollowAutoMergeUnit> = sc["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(unit_from)
            .collect();
        let arriving = pick(&units, &sc["arriving"]);
        let existing = pick(&units, &sc["existing"]);

        let got = follow_leader_auto_merge_decision(&units, &arriving, &existing, q, r, limit);
        let want = expected_decision(sc["decision"].as_str().unwrap());
        assert_eq!(got, want, "decyzja, scenariusz {name}");

        let join = can_join_stack_at(&units, &arriving, q, r, limit);
        assert_eq!(
            join,
            sc["canJoin"].as_bool().unwrap(),
            "canJoinStackAt, scenariusz {name}"
        );

        match want {
            FollowAutoMergeDecision::Merge => merge += 1,
            FollowAutoMergeDecision::LimitBlocked => blocked += 1,
            FollowAutoMergeDecision::None => none += 1,
        }
    }
    // Pokrycie: kazda galaz decyzji musi byc obecna w wektorach (test nie moze przejsc pusto).
    assert!(merge >= 100, "za malo scenariuszy merge: {merge}");
    assert!(
        blocked >= 100,
        "za malo scenariuszy limit-blocked: {blocked}"
    );
    assert!(none >= 1000, "za malo scenariuszy none: {none}");
}

#[test]
fn merge_gdy_wchodzace_podazaja_a_na_heksie_stoi_general_i_jest_miejsce() {
    let units = vec![
        unit("G", 0, 2, 2, false, true),
        unit("A", 0, 3, 2, true, false),
        unit("B", 0, 3, 2, true, false),
    ];
    let arriving = vec![units[1].clone(), units[2].clone()];
    let existing = vec![units[0].clone()];
    assert_eq!(
        follow_leader_auto_merge_decision(&units, &arriving, &existing, 2, 2, 3),
        FollowAutoMergeDecision::Merge
    );
}

#[test]
fn limit_brzeg_dokladnie_na_limicie_merge_o_jeden_wiecej_limit_blocked() {
    // 2 stojace + 1 wchodzaca: 3 <= limit -> merge; limit 2 -> limit-blocked.
    let units = vec![
        unit("G", 0, 0, 0, false, true),
        unit("S", 0, 0, 0, false, false),
        unit("A", 0, 1, 0, true, false),
    ];
    let arriving = vec![units[2].clone()];
    let existing = vec![units[0].clone(), units[1].clone()];
    assert_eq!(
        follow_leader_auto_merge_decision(&units, &arriving, &existing, 0, 0, 3),
        FollowAutoMergeDecision::Merge
    );
    assert_eq!(
        follow_leader_auto_merge_decision(&units, &arriving, &existing, 0, 0, 2),
        FollowAutoMergeDecision::LimitBlocked
    );
}

#[test]
fn wchodzaca_juz_na_heksie_nie_jest_liczona_podwojnie() {
    // Jednostka A stoi juz na (0,0) i jest jednoczesnie wchodzaca: limit 2 wystarcza
    // (G + A), bo A nie jest liczona dwa razy.
    let units = vec![
        unit("G", 0, 0, 0, false, true),
        unit("A", 0, 0, 0, true, false),
    ];
    let arriving = vec![units[1].clone()];
    assert!(can_join_stack_at(&units, &arriving, 0, 0, 2));
    assert!(!can_join_stack_at(&units, &arriving, 0, 0, 1));
}

#[test]
fn obcy_wlasciciel_i_inny_heks_nie_licza_sie_do_limitu() {
    let units = vec![
        unit("G", 0, 0, 0, false, true),
        unit("X", 1, 0, 0, false, false),
        unit("Y", 1, 0, 0, false, false),
        unit("Z", 0, 5, 5, false, false),
        unit("A", 0, 1, 0, true, false),
    ];
    let arriving = vec![units[4].clone()];
    let existing = vec![units[0].clone()];
    assert_eq!(own_unit_count_at(&units, 0, 0, 0, &HashSet::new()), 1);
    assert!(can_join_stack_at(&units, &arriving, 0, 0, 2));
    assert_eq!(
        follow_leader_auto_merge_decision(&units, &arriving, &existing, 0, 0, 2),
        FollowAutoMergeDecision::Merge
    );
}

#[test]
fn brak_decyzji_bez_wodza_bez_podazania_lub_gdy_wchodzacy_jest_generalem() {
    let g = unit("G", 0, 0, 0, false, true);
    let s = unit("S", 0, 0, 0, false, false);
    let follow = unit("A", 0, 1, 0, true, false);
    let no_follow = unit("B", 0, 1, 0, false, false);
    let general_arriving = unit("GA", 0, 1, 0, true, true);
    let units = vec![
        g.clone(),
        s.clone(),
        follow.clone(),
        no_follow.clone(),
        general_arriving.clone(),
    ];

    // brak wchodzacych / brak stojacych
    assert_eq!(
        follow_leader_auto_merge_decision(&units, &[], std::slice::from_ref(&g), 0, 0, 5),
        FollowAutoMergeDecision::None
    );
    assert_eq!(
        follow_leader_auto_merge_decision(&units, std::slice::from_ref(&follow), &[], 0, 0, 5),
        FollowAutoMergeDecision::None
    );
    // brak wodza na heksie (same zwykle jednostki)
    assert_eq!(
        follow_leader_auto_merge_decision(
            &units,
            std::slice::from_ref(&follow),
            std::slice::from_ref(&s),
            0,
            0,
            5
        ),
        FollowAutoMergeDecision::None
    );
    // jedna wchodzaca bez podazania -> monit (none), nawet przy wodzu
    assert_eq!(
        follow_leader_auto_merge_decision(
            &units,
            std::slice::from_ref(&no_follow),
            std::slice::from_ref(&g),
            0,
            0,
            5
        ),
        FollowAutoMergeDecision::None
    );
    // wchodzacy general nie jest scalany automatycznie
    assert_eq!(
        follow_leader_auto_merge_decision(
            &units,
            std::slice::from_ref(&general_arriving),
            &[g],
            0,
            0,
            5
        ),
        FollowAutoMergeDecision::None
    );
}
