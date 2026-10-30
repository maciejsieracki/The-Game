//! P6.8A-P1 (pin webu 91dc998a): `gra/src/game/pending-improvements.ts`.
//!
//! UWAGA (Operator R1): wektory wyprowadzone recznie z kodu TS (nie z uruchomionego weba).

use civ_engine::domain::improvements::{
    parse_pending_improvement_id, pending_improvement_id, PendingImprovementEntry,
    PendingImprovementsTurn,
};

fn e(hex: &str, key: &str, koszt: f64, action: &str) -> PendingImprovementEntry {
    PendingImprovementEntry {
        hex_key: hex.to_string(),
        key: key.to_string(),
        koszt_praca: koszt,
        action: action.to_string(),
    }
}

#[test]
fn id_format_and_parse_split_on_last_colon() {
    assert_eq!(pending_improvement_id("3,-1", "farma"), "3,-1:farma");
    assert_eq!(
        parse_pending_improvement_id("3,-1:farma"),
        Some(("3,-1".to_string(), "farma".to_string()))
    );
    assert_eq!(
        parse_pending_improvement_id("a:b:c"),
        Some(("a:b".to_string(), "c".to_string()))
    );
}

#[test]
fn parse_rejects_missing_colon_and_leading_colon() {
    assert_eq!(parse_pending_improvement_id("brak"), None);
    assert_eq!(parse_pending_improvement_id(":farma"), None);
    assert_eq!(parse_pending_improvement_id(""), None);
}

#[test]
fn add_get_has_remove_roundtrip() {
    let mut p = PendingImprovementsTurn::new();
    assert_eq!(p.size(), 0);
    p.add(e("1,1", "farma", 3.0, "buduj"));
    assert!(p.has("1,1", "farma"));
    assert_eq!(p.get("1,1", "farma").unwrap().koszt_praca, 3.0);
    assert_eq!(p.size(), 1);
    let removed = p.remove("1,1", "farma");
    assert!(removed.is_some());
    assert!(!p.has("1,1", "farma"));
    assert!(p.remove("1,1", "farma").is_none());
}

#[test]
fn undo_key_set_drops_removed_id_and_keeps_rest_in_order() {
    let mut p = PendingImprovementsTurn::new();
    p.add(e("0,0", "a", 1.0, "x"));
    p.add(e("0,1", "b", 2.0, "x"));
    p.add(e("0,2", "c", 3.0, "x"));
    assert!(p.remove("0,1", "b").is_some());
    assert_eq!(
        p.undo_key_set(),
        vec!["0,0:a".to_string(), "0,2:c".to_string()]
    );
    assert_eq!(p.size(), 2);
}

#[test]
fn re_add_overwrites_value_but_keeps_position() {
    let mut p = PendingImprovementsTurn::new();
    p.add(e("0,0", "a", 1.0, "x"));
    p.add(e("0,1", "b", 2.0, "x"));
    p.add(e("0,0", "a", 9.0, "y"));
    assert_eq!(p.size(), 2);
    assert_eq!(
        p.undo_key_set(),
        vec!["0,0:a".to_string(), "0,1:b".to_string()]
    );
    assert_eq!(p.get("0,0", "a").unwrap().koszt_praca, 9.0);
    assert_eq!(p.get("0,0", "a").unwrap().action, "y");
}

#[test]
fn commit_turn_clears_everything() {
    let mut p = PendingImprovementsTurn::new();
    p.add(e("0,0", "a", 1.0, "x"));
    p.commit_turn();
    assert_eq!(p.size(), 0);
    assert!(p.undo_key_set().is_empty());
    assert!(p.to_save().is_empty());
}

#[test]
fn save_load_preserves_order_and_dedups() {
    let rows = vec![
        e("2,2", "m", 1.0, "x"),
        e("1,1", "f", 2.0, "y"),
        e("2,2", "m", 5.0, "z"),
    ];
    let p = PendingImprovementsTurn::from_save(Some(&rows));
    assert_eq!(p.size(), 2);
    let saved = p.to_save();
    assert_eq!(saved.len(), 2);
    assert_eq!(saved[0].hex_key, "2,2");
    assert_eq!(saved[0].koszt_praca, 5.0);
    assert_eq!(saved[1].key, "f");
    let empty = PendingImprovementsTurn::from_save(None);
    assert_eq!(empty.size(), 0);
}
