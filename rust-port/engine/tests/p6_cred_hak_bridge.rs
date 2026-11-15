//! R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1: komenda `declare_war` w kontrakcie mostu (`bridge.rs`).
//! Komenda jest addytywna (tag `kind = "declare_war"`); oba adaptery odrzucaja ja jawnie, bez cichego no-op.

#[path = "../src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{BridgeErrorCode, CivEngineAdapter, EngineCommand, EnginePort, MockEngineAdapter};
use serde_json::json;

fn declare_cmd() -> EngineCommand {
    EngineCommand::DeclareWar {
        declarer: 1,
        target: 2,
    }
}

#[test]
fn declare_war_serializuje_sie_jak_pozostale_komendy() {
    let value = serde_json::to_value(declare_cmd()).expect("serializacja");
    assert_eq!(
        value,
        json!({"kind": "declare_war", "declarer": 1, "target": 2})
    );
    let back: EngineCommand = serde_json::from_value(value).expect("deserializacja");
    assert_eq!(back, declare_cmd());
}

#[test]
fn civ_engine_adapter_odrzuca_declare_war_jawnie() {
    let mut adapter = CivEngineAdapter::default();
    let err = adapter
        .execute(declare_cmd())
        .expect_err("declare_war bez wiringu musi byc odrzucone");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    assert!(err.message.contains("declare_war"), "{}", err.message);
}

#[test]
fn mock_adapter_odrzuca_declare_war_i_rejestruje_wywolanie() {
    let mut adapter = MockEngineAdapter::default();
    let before = adapter.state().clone();
    let err = adapter
        .execute(declare_cmd())
        .expect_err("mock tez odrzuca declare_war");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    assert_eq!(adapter.calls(), &[declare_cmd()]);
    assert_eq!(
        adapter.state(),
        &before,
        "brak zmiany stanu przy odrzuceniu"
    );
}
