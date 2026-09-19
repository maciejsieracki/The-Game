#[path = "../src/steam_adapter.rs"]
mod steam_adapter;

use steam_adapter::{
    InMemorySteamAdapter, OverlayStatus, ProductionSteamAdapter, SteamAdapter, SteamAdapterError,
};

#[test]
fn in_memory_adapter_unlocks_achievements_and_reports_overlay_status() {
    let mut adapter = InMemorySteamAdapter::new();

    assert_eq!(adapter.unlock_achievement("first_city"), Ok(()));
    assert_eq!(adapter.unlock_achievement("first_city"), Ok(()));
    assert!(adapter.is_achievement_unlocked("first_city"));
    assert_eq!(adapter.unlocked_achievements().len(), 1);
    assert_eq!(
        adapter.unlocked_achievements().iter().collect::<Vec<_>>(),
        vec![&"first_city".to_owned()]
    );
    assert_eq!(adapter.overlay_status(), Ok(OverlayStatus::Hidden));

    adapter.set_overlay_visible(true);
    assert_eq!(adapter.overlay_status(), Ok(OverlayStatus::Visible));
}

#[test]
fn in_memory_adapter_round_trips_cloud_save_bytes_exactly() {
    let mut adapter = InMemorySteamAdapter::new();
    let payload = [0, 1, 2, 127, 128, 255];

    assert_eq!(adapter.write_cloud_save("slot-1", &payload), Ok(()));
    assert_eq!(adapter.read_cloud_save("slot-1"), Ok(payload.to_vec()));
}

#[test]
fn missing_cloud_save_key_is_reported_without_fabricating_data() {
    let adapter = InMemorySteamAdapter::new();

    assert_eq!(
        adapter.read_cloud_save("missing"),
        Err(SteamAdapterError::MissingCloudSaveKey {
            key: "missing".to_owned(),
        })
    );
}

#[test]
fn unavailable_mock_rejects_every_steam_operation() {
    let mut adapter = InMemorySteamAdapter::unavailable();

    assert_eq!(
        adapter.unlock_achievement("first_city"),
        Err(SteamAdapterError::ServiceUnavailable)
    );
    assert_eq!(
        adapter.read_cloud_save("slot-1"),
        Err(SteamAdapterError::ServiceUnavailable)
    );
    assert_eq!(
        adapter.write_cloud_save("slot-1", b"save"),
        Err(SteamAdapterError::ServiceUnavailable)
    );
    assert_eq!(
        adapter.overlay_status(),
        Err(SteamAdapterError::ServiceUnavailable)
    );

    adapter.set_service_available(true);
    assert_eq!(adapter.overlay_status(), Ok(OverlayStatus::Hidden));
}

#[test]
fn production_adapter_is_explicitly_disconnected_and_side_effect_free() {
    let mut adapter = ProductionSteamAdapter::new();

    assert_eq!(
        adapter.unlock_achievement("first_city"),
        Err(SteamAdapterError::ServiceUnavailable)
    );
    assert_eq!(
        adapter.read_cloud_save("slot-1"),
        Err(SteamAdapterError::ServiceUnavailable)
    );
    assert_eq!(
        adapter.write_cloud_save("slot-1", b"save"),
        Err(SteamAdapterError::ServiceUnavailable)
    );
    assert_eq!(
        adapter.overlay_status(),
        Err(SteamAdapterError::ServiceUnavailable)
    );
}
