use civ_engine::{GameState, Player, PlayerId, Turn};

#[test]
fn engine_state_can_be_created_advanced_and_round_tripped() {
    let mut state = GameState::new();
    state
        .add_player(Player::new(PlayerId::new(1), "Rome").expect("valid player"))
        .expect("first player can be added");

    state.advance_turn().expect("turn can advance");

    let encoded = serde_json::to_string(&state).expect("state serializes");
    let decoded: GameState = serde_json::from_str(&encoded).expect("state deserializes");

    assert_eq!(decoded, state);
    assert_eq!(decoded.turn().number(), 2);
    assert_eq!(decoded.players().len(), 1);
}

#[test]
fn one_based_turn_invariant_is_enforced_on_construction_and_deserialization() {
    assert!(Turn::new(0).is_err());
    assert_eq!(Turn::new(1).expect("one is a valid turn").number(), 1);

    let invalid_turn: Result<Turn, _> = serde_json::from_str("0");
    assert!(invalid_turn.is_err());

    let invalid_state = r#"{"turn":0,"players":[]}"#;
    let decoded: Result<GameState, _> = serde_json::from_str(invalid_state);
    assert!(decoded.is_err());
}
