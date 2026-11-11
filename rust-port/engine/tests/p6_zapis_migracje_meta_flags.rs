//! P6-ZAPIS-MIGRACJE-FALA509 (runda 1): odczyt flag `meta` zapisu przez typed accessory `SaveMeta`.
//! Web (origin/main): `main.ts:46701` `autoBuildEnabled = autoBuildFromSaveMeta(saved.meta?.autoBuildEnabled)`
//! (tylko JSON `true` wlacza), `main.ts:46706` `playerEpochWarEnabled = typeof === 'boolean' ? v : true`.
//! Stary zapis bez pola = auto-budowa WYLACZONA, playerEpochWar = true. Nieznany typ w polu = jak brak pola.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code, unused_imports)]
mod save_load;

use save_load::SaveMeta;
use serde_json::json;

fn meta(value: serde_json::Value) -> SaveMeta {
    serde_json::from_value(value).expect("meta deserializes")
}

#[test]
fn p6_zapis_migracje_auto_build_absent_is_disabled() {
    assert!(!meta(json!({})).auto_build_enabled());
}

#[test]
fn p6_zapis_migracje_auto_build_only_json_true_enables() {
    assert!(meta(json!({"autoBuildEnabled": true})).auto_build_enabled());
    assert!(!meta(json!({"autoBuildEnabled": false})).auto_build_enabled());
    assert!(!meta(json!({"autoBuildEnabled": "true"})).auto_build_enabled());
    assert!(!meta(json!({"autoBuildEnabled": 1})).auto_build_enabled());
    assert!(!meta(json!({"autoBuildEnabled": null})).auto_build_enabled());
}

#[test]
fn p6_zapis_migracje_player_epoch_war_absent_is_true() {
    assert!(meta(json!({})).player_epoch_war_enabled());
}

#[test]
fn p6_zapis_migracje_player_epoch_war_reads_boolean() {
    assert!(meta(json!({"playerEpochWarEnabled": true})).player_epoch_war_enabled());
    assert!(!meta(json!({"playerEpochWarEnabled": false})).player_epoch_war_enabled());
    // Nie-boolean = jak brak pola (web `typeof ... === 'boolean' ? v : true`).
    assert!(meta(json!({"playerEpochWarEnabled": "false"})).player_epoch_war_enabled());
    assert!(meta(json!({"playerEpochWarEnabled": null})).player_epoch_war_enabled());
}

#[test]
fn p6_zapis_migracje_flags_survive_round_trip() {
    let original = meta(json!({"autoBuildEnabled": true, "playerEpochWarEnabled": false}));
    let encoded = serde_json::to_value(&original).expect("serialize");
    assert_eq!(encoded["autoBuildEnabled"], json!(true));
    assert_eq!(encoded["playerEpochWarEnabled"], json!(false));
    let decoded: SaveMeta = serde_json::from_value(encoded).expect("deserialize");
    assert!(decoded.auto_build_enabled());
    assert!(!decoded.player_epoch_war_enabled());
}
