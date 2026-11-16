//! P6 EXEC-T2 MOVE-GATE: testy bramek ruchu (blokada linii, krok zwarcia, anty-cofanie).
//! Oczekiwania wektorowe pochodzą z WYKONANIA kodu weba (pin 07d2fbd72) przez
//! tests/p6_player_order_move_gate_gen.mjs; testy ręczne opisują zachowanie z pinu jako warunki.

use civ_engine::domain::formation_rules::CompactSide;
use civ_engine::domain::player_order_move_gate::{
    compact_attack_allows_step, dest_allowed_by_blockade, should_avoid_auto_backtrack,
    BacktrackUnit, BlockadeSettings, CompactStepUnit, GroupDoctrine, GroupMeta, LineMember,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_player_order_move_gate_vectors/vectors.json");

fn vec_root() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json musi sie parsowac")
}

fn side_of(s: &str) -> CompactSide {
    match s {
        "atk" => CompactSide::Atk,
        "def" => CompactSide::Def,
        other => panic!("nieznana strona {other}"),
    }
}

fn doctrine_of(s: &str) -> GroupDoctrine {
    match s {
        "defensive" => GroupDoctrine::Defensive,
        "steady" => GroupDoctrine::Steady,
        "aggressive" => GroupDoctrine::Aggressive,
        "skirmish" => GroupDoctrine::Skirmish,
        "manual" => GroupDoctrine::Manual,
        other => panic!("nieznana doktryna {other}"),
    }
}

fn opt_f64(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(v.as_f64().expect("liczba lub null"))
    }
}

fn flag(v: &Value, key: &str) -> bool {
    v[key].as_bool().unwrap_or(false)
}

fn member_from(v: &Value) -> LineMember {
    let dead = flag(v, "dead");
    let fading = flag(v, "fadingOut");
    let removed = flag(v, "removed");
    let routed = flag(v, "routed");
    LineMember {
        q: v["q"].as_f64().expect("q"),
        r: v["r"].as_f64().expect("r"),
        formation_rank: opt_f64(&v["rank"]),
        mounted: flag(v, "mounted"),
        siege: flag(v, "siege"),
        in_play: !dead && !fading && !removed && !routed,
    }
}

fn blockade_settings(active: bool, col: Option<f64>) -> BlockadeSettings {
    BlockadeSettings { active, col }
}

// ---------------------------------------------------------------------------
// Testy opisowe (zachowanie z pinu jako warunki).
// ---------------------------------------------------------------------------

#[test]
fn blockade_inactive_or_without_column_allows_every_destination() {
    for col in [-5.0, 0.0, 7.0] {
        assert!(dest_allowed_by_blockade(
            blockade_settings(false, Some(2.0)),
            CompactSide::Atk,
            col
        ));
        assert!(dest_allowed_by_blockade(
            blockade_settings(true, None),
            CompactSide::Def,
            col
        ));
    }
}

#[test]
fn blockade_attacker_may_not_pass_its_block_column() {
    let s = blockade_settings(true, Some(3.0));
    assert!(
        dest_allowed_by_blockade(s, CompactSide::Atk, 3.0),
        "na granicy blokady: dozwolone"
    );
    assert!(dest_allowed_by_blockade(s, CompactSide::Atk, 2.0));
    assert!(!dest_allowed_by_blockade(s, CompactSide::Atk, 4.0));
}

#[test]
fn blockade_defender_may_not_pass_its_block_column() {
    let s = blockade_settings(true, Some(3.0));
    assert!(
        dest_allowed_by_blockade(s, CompactSide::Def, 3.0),
        "na granicy blokady: dozwolone"
    );
    assert!(dest_allowed_by_blockade(s, CompactSide::Def, 4.0));
    assert!(!dest_allowed_by_blockade(s, CompactSide::Def, 2.0));
}

fn steady_foot(side: CompactSide, q: f64, rank: Option<f64>) -> CompactStepUnit {
    CompactStepUnit {
        side,
        doctrine: GroupDoctrine::Steady,
        mounted: false,
        siege: false,
        formation_rank: rank,
        q,
        r: 0.0,
    }
}

fn member(q: f64, r: f64, rank: Option<f64>) -> LineMember {
    LineMember {
        q,
        r,
        formation_rank: rank,
        mounted: false,
        siege: false,
        in_play: true,
    }
}

#[test]
fn compact_step_backwards_is_forbidden_for_attacker() {
    // Anty-cofanie: kandydat w tył (q=5 -> 4) zabroniony, nawet bez linii poprzedniej rangi.
    let unit = steady_foot(CompactSide::Atk, 5.0, Some(0.0));
    assert!(!compact_attack_allows_step(unit, 4.0, &[]));
}

#[test]
fn compact_step_backwards_is_forbidden_for_defender() {
    // Dla obrońcy postęp to -q: krok z q=2 do q=3 to cofnięcie.
    let unit = steady_foot(CompactSide::Def, 2.0, Some(0.0));
    assert!(!compact_attack_allows_step(unit, 3.0, &[]));
}

#[test]
fn compact_step_sideways_is_allowed() {
    let unit = steady_foot(CompactSide::Atk, 5.0, Some(1.0));
    let line = [member(4.0, 1.0, Some(0.0))];
    assert!(compact_attack_allows_step(unit, 5.0, &line));
}

#[test]
fn compact_step_inside_and_on_boundary_is_allowed_for_first_rank() {
    // Bez linii poprzedniej rangi granica = postęp bieżący + 1.
    let unit = steady_foot(CompactSide::Atk, 5.0, Some(0.0));
    assert!(
        compact_attack_allows_step(unit, 6.0, &[]),
        "wewnątrz granicy"
    );
    assert!(!compact_attack_allows_step(unit, 7.0, &[]), "poza granicą");
}

#[test]
fn compact_step_limited_by_previous_rank_line_on_boundary() {
    // Jednostka rangi 1 w q=3; poprzednia ranga w tej samej lane (r=0) też w q=3.
    // limit = min(własna 3+1, poprzednia 3) = 3: krok do q=4 jest zabroniony, choć bez
    // linii poprzedniej byłby dozwolony (patrz compact_step_inside_and_on_boundary_...).
    let unit = steady_foot(CompactSide::Atk, 3.0, Some(1.0));
    let line = [member(3.0, 0.0, Some(0.0))];
    assert!(
        compact_attack_allows_step(unit, 3.0, &line),
        "ruch boczny: dozwolone"
    );
    assert!(
        !compact_attack_allows_step(unit, 4.0, &line),
        "poza granicą linii poprzedniej"
    );
    assert!(
        compact_attack_allows_step(unit, 4.0, &[]),
        "bez linii poprzedniej ta sama kolumna dozwolona"
    );
}

#[test]
fn compact_step_is_free_outside_steady_doctrine_and_for_mounted_or_siege() {
    let mut unit = steady_foot(CompactSide::Atk, 5.0, Some(0.0));
    unit.doctrine = GroupDoctrine::Aggressive;
    assert!(
        compact_attack_allows_step(unit, 4.0, &[]),
        "cofnięcie dozwolone poza Steady"
    );
    unit.doctrine = GroupDoctrine::Steady;
    unit.mounted = true;
    assert!(
        compact_attack_allows_step(unit, 4.0, &[]),
        "konni: bez bramki"
    );
    unit.mounted = false;
    unit.siege = true;
    assert!(
        compact_attack_allows_step(unit, 4.0, &[]),
        "oblężnicze: bez bramki"
    );
}

#[test]
fn auto_backtrack_only_for_steady_auto_units() {
    let base = BacktrackUnit {
        unit_doctrine: None,
        has_group_id: false,
        group_meta: None,
    };
    assert!(
        should_avoid_auto_backtrack(base),
        "brak grupy: domyślnie steady"
    );
    let manual = BacktrackUnit {
        unit_doctrine: Some(GroupDoctrine::Manual),
        ..base
    };
    assert!(!should_avoid_auto_backtrack(manual));
    let aggressive_group = BacktrackUnit {
        has_group_id: true,
        group_meta: Some(GroupMeta {
            doctrine: GroupDoctrine::Aggressive,
            auto_play: true,
        }),
        ..base
    };
    assert!(!should_avoid_auto_backtrack(aggressive_group));
    let steady_group_no_autoplay = BacktrackUnit {
        has_group_id: true,
        group_meta: Some(GroupMeta {
            doctrine: GroupDoctrine::Steady,
            auto_play: false,
        }),
        ..base
    };
    assert!(!should_avoid_auto_backtrack(steady_group_no_autoplay));
    let steady_unit_override = BacktrackUnit {
        unit_doctrine: Some(GroupDoctrine::Steady),
        has_group_id: true,
        group_meta: Some(GroupMeta {
            doctrine: GroupDoctrine::Manual,
            auto_play: false,
        }),
    };
    assert!(
        should_avoid_auto_backtrack(steady_unit_override),
        "override jednostki wygrywa z grupą"
    );
}

// ---------------------------------------------------------------------------
// Testy wektorowe (wykonanie kodu z pinu).
// ---------------------------------------------------------------------------

#[test]
fn blockade_matches_pinned_web_execution() {
    let root = vec_root();
    let cases = root["blockade"].as_array().expect("blockade");
    assert_eq!(
        cases.len(),
        320,
        "pełne wyliczenie: 2 strony x 2 x 8 kolumn blokady x 10 kolumn"
    );
    for c in cases {
        let got = dest_allowed_by_blockade(
            blockade_settings(c["active"].as_bool().unwrap(), opt_f64(&c["blockadeCol"])),
            side_of(c["side"].as_str().unwrap()),
            c["col"].as_f64().unwrap(),
        );
        assert_eq!(got, c["expected"].as_bool().unwrap(), "blockade case {c}");
    }
}

#[test]
fn compact_step_matches_pinned_web_execution() {
    let root = vec_root();
    let cases = root["compact"].as_array().expect("compact");
    let mut forward_allowed = 0usize;
    let mut forward_denied = 0usize;
    let mut backward_denied = 0usize;
    for c in cases {
        let side = side_of(c["side"].as_str().unwrap());
        let unit = CompactStepUnit {
            side,
            doctrine: doctrine_of(c["doctrine"].as_str().unwrap()),
            mounted: flag(c, "mounted"),
            siege: flag(c, "siege"),
            formation_rank: opt_f64(&c["rank"]),
            q: c["q"].as_f64().unwrap(),
            r: c["r"].as_f64().unwrap(),
        };
        let line: Vec<LineMember> = c["members"]
            .as_array()
            .unwrap()
            .iter()
            .map(member_from)
            .collect();
        let candidate = c["candidateCol"].as_f64().unwrap();
        let got = compact_attack_allows_step(unit, candidate, &line);
        let expected = c["expected"].as_bool().unwrap();
        assert_eq!(got, expected, "compact case {c}");
        let gated = unit.doctrine == GroupDoctrine::Steady && !unit.mounted && !unit.siege;
        if gated {
            let forward = match side {
                CompactSide::Atk => candidate > unit.q,
                CompactSide::Def => candidate < unit.q,
            };
            let backward = match side {
                CompactSide::Atk => candidate < unit.q,
                CompactSide::Def => candidate > unit.q,
            };
            if forward && expected {
                forward_allowed += 1;
            }
            if forward && !expected {
                forward_denied += 1;
            }
            if backward && !expected {
                backward_denied += 1;
            }
        }
    }
    // Pokrycie: każda gałąź bramki ma realne przypadki w wektorach.
    assert!(
        forward_allowed >= 50,
        "przypadki postępu dozwolonego: {forward_allowed}"
    );
    assert!(
        forward_denied >= 50,
        "przypadki postępu zabronionego (granica): {forward_denied}"
    );
    assert!(
        backward_denied >= 50,
        "przypadki cofnięcia zabronionego: {backward_denied}"
    );
}

#[test]
fn auto_backtrack_matches_pinned_web_execution() {
    let root = vec_root();
    let cases = root["backtrack"].as_array().expect("backtrack");
    assert_eq!(cases.len(), 72);
    for c in cases {
        let has_group_id = flag(c, "hasGroupId");
        let meta = if c["groupMeta"].is_null() {
            None
        } else {
            Some(GroupMeta {
                doctrine: doctrine_of(c["groupMeta"]["doctrine"].as_str().unwrap()),
                auto_play: c["groupMeta"]["autoPlay"].as_bool().unwrap(),
            })
        };
        let unit = BacktrackUnit {
            unit_doctrine: c["unitDoctrine"].as_str().map(doctrine_of),
            has_group_id,
            group_meta: meta,
        };
        assert_eq!(
            should_avoid_auto_backtrack(unit),
            c["expected"].as_bool().unwrap(),
            "backtrack case {c}"
        );
    }
}
