// Release build on Windows: no extra console window (logs go to the file in
// `wyniki/`). Debug builds keep the console.
#![cfg_attr(
    all(not(debug_assertions), feature = "app"),
    windows_subsystem = "windows"
)]

#[cfg(feature = "app")]
fn main() {
    spike_gpu_embed::app::run();
}

#[cfg(not(feature = "app"))]
fn main() {
    eprintln!(
        "spike-gpu-embed: zbudowano bez cechy `app` (okno Tauri). \
         Uruchom: cargo run --release --locked (cecha `app` jest domyslna)."
    );
    std::process::exit(2);
}
