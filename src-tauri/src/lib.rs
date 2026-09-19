//! Tauri shell adapter for the Rust engine bridge.
//!
//! The desktop shell owns the application handle and event transport; the
//! command envelope and engine adapter remain in `rust-port/engine/src/bridge.rs`.
//! A real Tauri crate should depend on the engine crate as `civ_engine` and call
//! [`run`] from its binary entry point.

#[path = "../../rust-port/engine/src/bridge.rs"]
pub mod bridge;

use std::sync::Mutex;

use bridge::{BridgeError, BridgeRequest, BridgeResponse, CivEngineAdapter, EngineBridge};
use tauri::{AppHandle, Emitter, Runtime, State};

/// Tauri-managed owner of the one engine instance used by the window.
pub struct EngineStateHandle(Mutex<EngineBridge<CivEngineAdapter>>);

impl Default for EngineStateHandle {
    fn default() -> Self {
        Self(Mutex::new(EngineBridge::new(CivEngineAdapter::default())))
    }
}

/// The only command the frontend invokes.  Mutating commands return a snapshot
/// and emit `engine_state_changed`; `get_state` returns a snapshot without an
/// event.  The request id is echoed in both response and event for correlation.
#[tauri::command]
fn engine_command<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, EngineStateHandle>,
    request: BridgeRequest,
) -> Result<BridgeResponse, BridgeError> {
    let dispatch = {
        let mut engine = state
            .0
            .lock()
            .map_err(|_| BridgeError::internal("engine state lock is poisoned"))?;
        engine.handle(request)?
    };

    for event in &dispatch.events {
        app.emit(event.channel(), event)
            .map_err(|error| BridgeError::event_emission(error.to_string()))?;
    }

    Ok(dispatch.response)
}

fn configure<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder
        .manage(EngineStateHandle::default())
        .invoke_handler(tauri::generate_handler![engine_command])
}

/// Build and run the desktop shell.  The frontend must invoke `engine_command`.
pub fn run() {
    configure(tauri::Builder::default())
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
