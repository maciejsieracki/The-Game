//! R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1 r2 (ODPOWIEDZ NA ZARZUT 2): testy na wektorach z URUCHOMIONEGO weba.
//!
//! Wektory: `p6_repin_oblezenie_limit_vectors/vectors.rs`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1/gen-vectors.cjs` (Node 22) z
//! `git archive origin/main gra/src gra/data` (web 638e90bea). Oczekiwania = wynik kodu weba, nie reczne.

#[path = "p6_repin_oblezenie_limit_vectors/vectors.rs"]
mod vectors;

use civ_engine::domain::siege_nearby_lock::{besiege_army_groups, besiege_lock_targets, LockUnit};
use civ_engine::domain::siege_no_breach::{round_cap_verdict, siege_no_breach_cap};
use std::collections::BTreeSet;

#[test]
fn web_wektory_cap() {
    for (cfg, expect) in vectors::WEB_CAP_VECTORS {
        assert_eq!(siege_no_breach_cap(*cfg), *expect, "cap dla {cfg:?}");
    }
}

#[test]
fn web_wektory_werdykt_sufitu() {
    for (r, wall, breached, cap, a, d, expect) in vectors::WEB_VERDICT_VECTORS {
        assert_eq!(
            round_cap_verdict(*r, *wall, *breached, *cap, *a, *d),
            *expect,
            "werdykt dla r={r} wall={wall} breached={breached} cap={cap} a={a} d={d}"
        );
    }
}

#[test]
fn web_wektory_siege_nearby() {
    for sc in vectors::WEB_LOCK_VECTORS {
        let units: Vec<LockUnit> = sc
            .units
            .iter()
            .map(|&(owner, q, r, garn, oblega, explicit)| LockUnit {
                owner_id: owner,
                q,
                r,
                in_garnizon: garn,
                oblega_city_id: oblega.map(str::to_string),
                explicit_stack_group_id: explicit.map(str::to_string),
            })
            .collect();
        let groups = besiege_army_groups(&units, "A", sc.owner, sc.hint);
        let got_groups: Option<Vec<String>> = groups
            .as_ref()
            .map(|g: &BTreeSet<String>| g.iter().cloned().collect());
        let expect_groups: Option<Vec<String>> = sc.expect_groups.map(|g| {
            let mut v: Vec<String> = g.iter().map(|s| s.to_string()).collect();
            v.sort();
            v
        });
        assert_eq!(got_groups, expect_groups, "grupy dla {:?}", sc.units);
        let targets = besiege_lock_targets(&units, 0, 0, sc.owner, groups.as_ref());
        assert_eq!(
            targets,
            sc.expect_targets.to_vec(),
            "cele dla {:?}",
            sc.units
        );
    }
}
