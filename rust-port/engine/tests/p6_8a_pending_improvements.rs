//! R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1, partia 8A-P1 (pin webu 91dc998a):
//! testy portu `gra/src/game/pending-improvements.ts` (modul `domain::improvements::pending_improvements`).

use civ_engine::domain::improvements::pending_improvements::{
    parse_pending_improvement_id, pending_improvement_id, PendingImprovementEntry,
    PendingImprovementsTurn,
};

fn entry(hex: &str, key: &str, koszt: f64) -> PendingImprovementEntry {
    PendingImprovementEntry {
        hex_key: hex.to_string(),
        key: key.to_string(),
        koszt_praca: koszt,
        action: "build".to_string(),
    }
}

#[test]
fn id_is_hex_colon_key() {
    assert_eq!(pending_improvement_id("3,-2", "farma"), "3,-2:farma");
}

#[test]
fn parse_splits_on_last_colon() {
    assert_eq!(
        parse_pending_improvement_id("1,2:a:b"),
        Some(("1,2:a".to_string(), "b".to_string()))
    );
    assert_eq!(parse_pending_improvement_id("brak"), None);
    assert_eq!(parse_pending_improvement_id(":farma"), None);
    assert_eq!(
        parse_pending_improvement_id("1,2:"),
        Some(("1,2".to_string(), String::new()))
    );
}

#[test]
fn add_has_get_remove_and_size() {
    let mut p = PendingImprovementsTurn::new();
    assert_eq!(p.size(), 0);
    p.add(entry("1,1", "farma", 5.0));
    p.add(entry("2,2", "kopalnia", 7.0));
    assert_eq!(p.size(), 2);
    assert!(p.has("1,1", "farma"));
    assert!(!p.has("1,1", "kopalnia"));
    assert_eq!(p.get("2,2", "kopalnia").map(|e| e.koszt_praca), Some(7.0));
    let removed = p.remove("1,1", "farma");
    assert_eq!(removed.map(|e| e.koszt_praca), Some(5.0));
    assert!(p.remove("1,1", "farma").is_none());
    assert_eq!(p.size(), 1);
}

#[test]
fn add_overwrites_in_place_keeping_position() {
    let mut p = PendingImprovementsTurn::new();
    p.add(entry("a", "x", 1.0));
    p.add(entry("b", "y", 2.0));
    p.add(entry("a", "x", 9.0));
    let saved = p.to_save();
    assert_eq!(saved.len(), 2);
    assert_eq!(saved[0].hex_key, "a");
    assert_eq!(saved[0].koszt_praca, 9.0);
    assert_eq!(saved[1].hex_key, "b");
}

#[test]
fn remove_then_readd_moves_to_end() {
    let mut p = PendingImprovementsTurn::new();
    p.add(entry("a", "x", 1.0));
    p.add(entry("b", "y", 2.0));
    p.remove("a", "x");
    p.add(entry("a", "x", 3.0));
    let saved = p.to_save();
    assert_eq!(saved[0].hex_key, "b");
    assert_eq!(saved[1].hex_key, "a");
}

#[test]
fn undo_key_set_contains_ids() {
    let mut p = PendingImprovementsTurn::new();
    p.add(entry("1,1", "farma", 5.0));
    let set = p.get_undo_key_set();
    assert!(set.contains("1,1:farma"));
    assert_eq!(set.len(), 1);
}

#[test]
fn commit_turn_clears_and_from_save_roundtrips() {
    let mut p = PendingImprovementsTurn::from_save(None);
    assert_eq!(p.size(), 0);
    p.add(entry("1,1", "farma", 5.0));
    let rows = p.to_save();
    let restored = PendingImprovementsTurn::from_save(Some(&rows));
    assert_eq!(restored, p);
    p.commit_turn();
    assert_eq!(p.size(), 0);
    assert!(p.to_save().is_empty());
}

#[test]
fn from_save_duplicates_last_wins() {
    let rows = vec![entry("a", "x", 1.0), entry("a", "x", 4.0)];
    let p = PendingImprovementsTurn::from_save(Some(&rows));
    assert_eq!(p.size(), 1);
    assert_eq!(p.get("a", "x").map(|e| e.koszt_praca), Some(4.0));
}
