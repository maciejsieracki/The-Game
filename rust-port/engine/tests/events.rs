#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

use events::{canonical_phase_order, EventQueue, TurnEvent, TurnPhase, CANONICAL_PHASE_ORDER};

#[test]
fn canonical_turn_phases_are_explicit_and_stable() {
    let expected = [
        TurnPhase::StartTurn,
        TurnPhase::PlayerActions,
        TurnPhase::Diplomacy,
        TurnPhase::Economy,
        TurnPhase::Production,
        TurnPhase::Ai,
        TurnPhase::Barbarians,
        TurnPhase::Victory,
        TurnPhase::EndTurn,
    ];

    assert_eq!(canonical_phase_order(), &expected);
    assert_eq!(&CANONICAL_PHASE_ORDER, &expected);
    assert_eq!(TurnPhase::StartTurn.order_index(), 0);
    assert_eq!(TurnPhase::Economy.order_index(), 3);
    assert!(TurnPhase::Economy.is_before(TurnPhase::Ai));
    assert!(TurnPhase::Ai.is_before(TurnPhase::Barbarians));
    assert!(TurnPhase::Barbarians.is_before(TurnPhase::Victory));
    assert_eq!(TurnPhase::Economy.next(), Some(TurnPhase::Production));
    assert_eq!(TurnPhase::EndTurn.next(), None);
}

#[test]
fn queue_orders_turn_then_phase_then_insertion_sequence() {
    let mut queue = EventQueue::<&'static str>::new();

    queue.enqueue(2, TurnPhase::Ai, "future-ai");
    queue.enqueue(1, TurnPhase::Barbarians, "barbarians");
    queue.enqueue(1, TurnPhase::Economy, "economy");
    queue.enqueue(1, TurnPhase::Economy, "economy-follow-up");
    queue.enqueue(1, TurnPhase::StartTurn, "start");
    queue.enqueue(1, TurnPhase::Ai, "ai");
    assert!(queue.is_ordered());

    let ordered: Vec<&str> = queue.iter().map(|entry| *entry.event()).collect();
    assert_eq!(
        ordered,
        [
            "start",
            "economy",
            "economy-follow-up",
            "ai",
            "barbarians",
            "future-ai",
        ]
    );

    let first = queue.peek_next().expect("the queue is not empty");
    assert_eq!(first.turn(), 1);
    assert_eq!(first.phase(), TurnPhase::StartTurn);
    assert_eq!(first.event(), &"start");
    assert_eq!(
        queue.pop_next().expect("the queue is not empty").event(),
        &"start"
    );
    assert_eq!(queue.len(), 5);
}

#[test]
fn phase_drain_is_scoped_and_preserves_the_remaining_order() {
    let mut queue = EventQueue::<&'static str>::new();
    queue.enqueue(1, TurnPhase::Economy, "economy-1");
    queue.enqueue(1, TurnPhase::Ai, "ai-1");
    queue.enqueue(2, TurnPhase::Economy, "economy-2");
    queue.enqueue(1, TurnPhase::Economy, "economy-2");

    let drained: Vec<&str> = queue
        .drain_phase(1, TurnPhase::Economy)
        .into_iter()
        .map(|entry| entry.into_event())
        .collect();
    assert_eq!(drained, ["economy-1", "economy-2"]);

    let remaining: Vec<(&str, u32, TurnPhase)> = queue
        .iter()
        .map(|entry| (*entry.event(), entry.turn(), entry.phase()))
        .collect();
    assert_eq!(
        remaining,
        [
            ("ai-1", 1, TurnPhase::Ai),
            ("economy-2", 2, TurnPhase::Economy),
        ]
    );
    assert!(queue.drain_phase(1, TurnPhase::Economy).is_empty());
}

#[test]
fn deserializing_a_queue_restores_order_and_rejects_duplicate_ids() {
    let unordered = r#"{
        "events": [
            {"sequence": 9, "turn": 1, "phase": "Ai", "event": "ai"},
            {"sequence": 2, "turn": 1, "phase": "Economy", "event": "economy"}
        ],
        "next_sequence": 0
    }"#;
    let restored: EventQueue<&str> = serde_json::from_str(unordered).expect("valid queue");
    let ordered: Vec<&str> = restored.iter().map(|entry| *entry.event()).collect();
    assert_eq!(ordered, ["economy", "ai"]);
    assert_eq!(restored.next_sequence(), 10);
    assert!(restored.is_ordered());

    let duplicate = r#"{
        "events": [
            {"sequence": 4, "turn": 1, "phase": "Economy", "event": "one"},
            {"sequence": 4, "turn": 2, "phase": "Ai", "event": "two"}
        ],
        "next_sequence": 5
    }"#;
    let error = serde_json::from_str::<EventQueue<&str>>(duplicate)
        .expect_err("duplicate queue IDs must be rejected");
    assert!(error.to_string().contains("duplicate event sequence 4"));
}

#[test]
fn built_in_events_map_to_their_responsible_phases() {
    let events = [
        (TurnEvent::TurnStarted(4), TurnPhase::StartTurn),
        (TurnEvent::PlayerTurnEnded(0), TurnPhase::PlayerActions),
        (TurnEvent::DiplomacyTick, TurnPhase::Diplomacy),
        (TurnEvent::EconomyTick, TurnPhase::Economy),
        (TurnEvent::ProductionTick, TurnPhase::Production),
        (TurnEvent::AiTurn(2), TurnPhase::Ai),
        (TurnEvent::BarbariansTick, TurnPhase::Barbarians),
        (TurnEvent::VictoryCheck, TurnPhase::Victory),
        (TurnEvent::TurnEnded(4), TurnPhase::EndTurn),
    ];

    for (event, phase) in events {
        assert_eq!(event.default_phase(), phase);
    }
}

#[test]
fn queue_round_trip_preserves_order_and_allocates_a_fresh_sequence() {
    let mut queue = EventQueue::new();
    let first_id = queue.enqueue(1, TurnPhase::Ai, TurnEvent::AiTurn(2));
    let second_id = queue.enqueue(1, TurnPhase::Economy, TurnEvent::EconomyTick);
    assert!(second_id > first_id);

    let json = serde_json::to_string(&queue).expect("event queue serializes");
    let mut restored: EventQueue = serde_json::from_str(&json).expect("event queue deserializes");
    assert_eq!(restored, queue);

    let next_id = restored.enqueue(1, TurnPhase::EndTurn, TurnEvent::TurnEnded(1));
    assert!(next_id > second_id);
    assert_eq!(
        restored.pop_next().expect("first event").phase(),
        TurnPhase::Economy
    );
    assert_eq!(
        restored.pop_next().expect("second event").phase(),
        TurnPhase::Ai
    );
    assert_eq!(
        restored.pop_next().expect("last event").phase(),
        TurnPhase::EndTurn
    );
    assert!(restored.is_empty());
}
