fn main() {
    // Only the `app` feature builds the Tauri shell; the CPU-only and `gpu`
    // builds must not need tauri-build (nor GTK/WebKit on Linux).
    #[cfg(feature = "app")]
    tauri_build::build();
}
