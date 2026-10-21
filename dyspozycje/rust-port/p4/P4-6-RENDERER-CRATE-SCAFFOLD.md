# P4.6 — Szkielet crate'a renderera `rust-port/renderer` (`civ-renderer`)

TEMAT: `R-RUSTPORT-P4-6-RENDERER-CRATE-SCAFFOLD-Q1` · DOMAIN: GAME · RUNDA: 1/5 · ROLA: Operator (Opus 5.5 medium)
Baza: `origin/rust-port/parity-v2` = `17454b33abbd3ab4a87a7e75ac2b17c5d86a4d8a` (P3.16). Data: 2026-10-21.
Źródło architektury: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (gałąź dokumentacyjna) — §1, §2, §4.2, §5, §7.3, §8, §9.
Decyzje właściciela w mocy (LEDGER 2026-10-21): D-RR-1 = A (wgpu bezpośrednio), D-RR-4 = A (tekst w Rust), D-RR-8 = A (tylko styl `roblox`).

**To jest szkielet (temat-kandydat „RR-T0”), nie implementacja renderera.** Nic nie jest rysowane. Moduły są puste (tylko `//!` z zakresem i numerem tematu RR-T*), żeby RR-T2/T3/T4/T6/… mogły pracować równolegle na rozłącznych plikach.

## 1. Struktura

```text
.github/workflows/rust-renderer.yml   CI: fmt, clippy -D warnings (CPU i --features gpu), test (CPU i --features gpu), MSRV 1.87
rust-port/renderer/
  Cargo.toml          civ-renderer 0.1.0, edition 2021, rust-version 1.87, publish = false, bez workspace
  Cargo.lock          COMMITOWANY (decyzja §2.1)
  .cargo/config.toml  [resolver] incompatible-rust-versions = "fallback" (§2.3)
  .gitignore          /target
  src/lib.rs          #![forbid(unsafe_code)], #![warn(missing_docs)], deklaracje modułów, gpu_feature_enabled()
  src/geom.rs         RR-T4  — prymitywy zgodne z Three r169, merge
  src/pick.rs         RR-T3/RR-T13 — picking CPU, hover
  src/camera.rs       RR-T2/RR-T12 — kamera, wejście ciągłe
  src/assets.rs       RR-T6  — rejestr zasobów GPU, budżet, test „N tur” (P4.3 §7.3)
  src/material.rs     RR-T5  — Lambert/Standard/Basic, WGSL, mgła, cienie; bez tone mappingu (roblox)
  src/text.rs         RR-T8  — tekst rasteryzowany w Rust (D-RR-4 = A)
  src/overlays.rs     RR-T9  — nakładki
  src/models.rs       RR-T7..T7n — modele wg katalogu P4.4
  src/view.rs         RR-T13 — DTO widoku, PositionDto ↔ (q,r)
  src/gpu.rs          (tylko --features gpu) RR-T1/T2/T5/T11 — dziś wyłącznie `pub use wgpu;`
  tests/cpu_sanity.rs test CPU: gpu_feature_enabled() == cfg!(feature = "gpu")
  tests/gpu_probe.rs  (cfg feature gpu) sonda Instance + request_adapter; brak adaptera → „SKIPPED: no GPU adapter (…)”
```

Jedyna publiczna funkcja: `civ_renderer::gpu_feature_enabled()` — realny odczyt konfiguracji builda (`cfg!(feature = "gpu")`), nie atrapa logiki renderera. Moduły tematów nie eksportują nic. `gpu` reeksportuje przypięte `wgpu`, żeby testy i kolejne tematy używały dokładnie tej wersji.

Podział plików pod równoległość: każdy temat dostaje własny plik `src/<moduł>.rs`; jeśli temat potrzebuje podmodułów, zamienia `src/<moduł>.rs` na `src/<moduł>/mod.rs` (lub zostawia `<moduł>.rs` + katalog `<moduł>/`) — zmiana `src/lib.rs` nie jest wtedy potrzebna. Wspólne punkty kolizji: `src/lib.rs`, `Cargo.toml`, `Cargo.lock` (nowe zależności) — ich zmiany należy w kolejnych dispatchach jawnie przydzielać jednemu tematowi naraz.

## 2. Decyzje

### 2.1 `Cargo.lock` — COMMITOWANY (wyjątek)

- Uzasadnienie: drzewo wgpu to 125 pakietów w locku (wszystkie platformy; 79 unikalnych linii `cargo tree --features gpu -e normal` na hoście Linux). Bez locka każdy build CI rozwiązuje zależności na nowo → dryf wersji przechodnich bez zmiany w repo. Dowód, że ryzyko jest realne (zmierzone w tym temacie): lock rozwiązany przez cargo 1.97 wybrał `ordered-float 5.5.0`, które wymaga Rust 1.90, i `cargo +1.87.0 test` padł (`ordered-float@5.5.0 requires rustc 1.90`, EXIT=101). Po rozwiązaniu MSRV-świadomym: `ordered-float 5.4.0`, EXIT=0 (log §4).
- Fakt korygujący dispatch: w repo **jest już** commitowany lock — `src-tauri/Cargo.lock` (`git ls-files | grep Cargo.lock` → `src-tauri/Cargo.lock`). `rust-port/engine` locka nie ma. Renderer jest więc drugim, nie jedynym wyjątkiem.
- CI używa `--locked` (build pada, jeśli lock nie pasuje do `Cargo.toml`).

### 2.2 Cecha `gpu` — DOMYŚLNIE WYŁĄCZONA

- Kod CPU (geom/pick/camera/assets/view) ma być budowany i testowany wszędzie, szybko, bez stosu GPU. `cargo test` bez cechy kompiluje tylko `civ-renderer` + `pollster` (dev) — log §4.
- wgpu (`dep:wgpu`) wchodzi tylko z `--features gpu`. CI buduje, lintuje i testuje oba warianty, więc warstwa GPU nie „gnije”.
- Konsekwencja dla RR-T1 (osadzenie w Tauri): `src-tauri` musi zależeć od `civ-renderer` z `features = ["gpu"]`.

### 2.3 MSRV 1.87 i rozwiązywanie zależności

- `rust-version = "1.87"` = MSRV wgpu 30.0.1 (P4.3 §1.2). Sprawdzone narzędziem 1.87.0 (zainstalowanym w tym temacie przez `rustup toolchain install 1.87.0 --profile minimal`): `cargo +1.87.0 test --locked --all-targets --features gpu` → EXIT=0 (§4).
- `rust-port/renderer/.cargo/config.toml`: `[resolver] incompatible-rust-versions = "fallback"` — każdy `cargo update`/`generate-lockfile` wybiera wersje zgodne z 1.87 (cargo ≥ 1.84). Dowód: `cargo generate-lockfile` bez zmiennych środowiskowych → „Locking 125 packages to latest Rust 1.87 compatible versions”, sha256 locka przed i po identyczny (`703d2456…`, §4).
- CI ma osobny job `msrv` (`dtolnay/rust-toolchain@1.87.0`).
- `src-tauri` ma `rust-version = "1.77.2"` — **nie zmieniane** (podniesienie to część spike'u RR-T1, poza allowlistą).

### 2.4 `unsafe`

`#![forbid(unsafe_code)]` w całym crate, z cechą i bez. Wyjątków dziś brak: `wgpu::Instance::create_surface` przyjmuje bezpieczne uchwyty okna; `unsafe` wymagałoby tylko `create_surface_unsafe`. Jeśli RR-T1 tego wymaga — zmienić na `deny` i dopuścić `unsafe` w jednym udokumentowanym module warstwy `gpu` (`forbid` nie da się nadpisać `allow` niżej).

### 2.5 Zależności (minimalne)

| Zależność | Rodzaj | Wersja | Licencja | Po co |
|---|---|---|---|---|
| `wgpu` | normalna, opcjonalna (`gpu`) | `=30.0.1` (dokładnie) | MIT OR Apache-2.0 | silnik GPU (D-RR-1 = A) |
| `pollster` | dev | `0.4` (lock: 0.4.0) | Apache-2.0/MIT | `block_on` dla asynchronicznego `request_adapter` w sondzie; zero własnych zależności |

Celowo **nie** dodane: `bytemuck` (brak buforów w szkielecie — dodać w RR-T2/T5, gdy pojawią się wierzchołki/uniformy), `glam`/inne biblioteki matematyczne (wybór należy do RR-T2/RR-T4 — zgodność numeryczna z Three r169), ECS (P4.3 §4.2: zbędny).

Licencje całego locka (`cargo metadata --features gpu`, 125 pakietów bez `civ-renderer`, wszystkie platformy): 76× `MIT OR Apache-2.0`, 14× `MIT`, 8× `Apache-2.0 OR MIT`, 8× `Zlib OR Apache-2.0 OR MIT`, 5× `Apache-2.0`, 2× `Zlib`, 2× `MIT OR Apache-2.0 OR Zlib`, 2× `MIT/Apache-2.0`, 2× `Apache-2.0/MIT`, 2× `Unlicense OR MIT`, 2× `BSD-2-Clause OR Apache-2.0 OR MIT`, 1× `ISC`, 1× `(MIT OR Apache-2.0) AND Unicode-3.0`. Pakiety bez opcji MIT: `codespan-reporting 0.13.1`, `gl_generator 0.14.0`, `glutin_wgl_sys 0.6.1`, `khronos_api 3.1.0`, `spirv 0.4.0+sdk-1.4.341.0` (Apache-2.0); `foldhash 0.2.0`, `slotmap 1.1.1` (Zlib); `libloading 0.8.9` (ISC). Wszystkie są licencjami permisywnymi; brak copyleft. Ocena prawna zgodności z dystrybucją gry — poza zakresem (decyzja właściciela, jeśli potrzebna).

### 2.6 CI (`.github/workflows/rust-renderer.yml`)

Wzorowany na `rust-engine.yml` (ten plik bez zmian): `on` push/pull_request z `paths: rust-port/renderer/**` + sam workflow, `workflow_dispatch`, `permissions: contents: read`, `concurrency`. Job `linux` (ubuntu-latest): `cargo fmt --all -- --check`; `cargo clippy --locked --all-targets [--features gpu] -- -D warnings`; `cargo test --locked --all-targets`; `cargo test --locked --all-targets --features gpu -- --nocapture` (`--nocapture` → linia SKIPPED widoczna w logu CI). Job `msrv`: test na 1.87.0 z `--locked`.

**Windows — NIE dodany (opisany):** na `windows-latest` wgpu najpewniej dostałby adapter DX12/WARP i sonda wypisałaby nazwę adaptera zamiast SKIPPED — to wartościowe, ale w tym kontenerze **NIE_ZMIERZONO**, a w `rust-engine.yml` job Windows jest „intentionally a separate, owner-authorized job”. Propozycja: dodać job `windows` (te same kroki + `rustc --version --verbose`) w RR-T1 po autoryzacji właściciela.

Składnia YAML sprawdzona parserem (`python3 -I -c "import yaml; yaml.safe_load(...)"`): klucze `concurrency, jobs, name, on, permissions`; joby `linux`, `msrv`; `paths` = `['rust-port/renderer/**', '.github/workflows/rust-renderer.yml']`; EXIT=0. `actionlint` — brak w środowisku (NIE_ZMIERZONO). Faktyczny przebieg na GitHub Actions — NIE_ZMIERZONO (brak push).

## 3. Sonda GPU (`tests/gpu_probe.rs`)

- `wgpu::Instance::new(wgpu::InstanceDescriptor::new_without_display_handle_from_env())` (w wgpu 30 nie ma `InstanceDescriptor::default()`/`from_env_or_default()` — kompilator wskazał te konstruktory) → `pollster::block_on(instance.request_adapter(&RequestAdapterOptions::default()))`.
- `Err` → test przechodzi i drukuje `SKIPPED: no GPU adapter (request_adapter error: …)` z pełnym powodem od wgpu. `Ok` → drukuje `name`, `backend`, `device_type`, `driver`, `driver_info`.
- Wynik w tym kontenerze (§4): `SKIPPED: no GPU adapter (request_adapter error: No suitable graphics adapter found; noop support not compiled in, vulkan drivers/libraries could not be loaded, metal support not compiled in, dx12 support not compiled in, gl drivers/libraries could not be loaded, webgpu support not compiled in)`.
- Ograniczenie: libtest nie ma statusu „skipped” dla testu, który wystartował; pominięcie jest raportowane linią na stdout (widoczną z `--nocapture`), a status testu to `ok`. Alternatywa `#[ignore]` ukryłaby sondę także na maszynie z GPU.

## 4. Surowe wyjścia bramek (PEŁNE)

Uruchomione skryptem (każda komenda: `echo "$ cmd"; cmd 2>&1; echo "EXIT=$?"`) w `rust-port/renderer`, środowisko: `CARGO_INCREMENTAL=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_0bec7858-c2b-1`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_TERM_COLOR=never`. Po `cargo clean` — build od zera. Treść skryptu:

```bash
#!/usr/bin/env bash
# Gate run for R-RUSTPORT-P4-6 (raw outputs, each command followed by EXIT).
cd /home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer || exit 1
export CARGO_INCREMENTAL=0
export CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_0bec7858-c2b-1
export CARGO_PROFILE_DEV_DEBUG=0
export CARGO_TERM_COLOR=never
run() { echo "\$ $*"; "$@" 2>&1; echo "EXIT=$?"; echo; }
run rustc --version
run cargo --version
run git -C /home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1 rev-parse HEAD
run ls /dev/dri
run sha256sum Cargo.lock
run cargo generate-lockfile
run sha256sum Cargo.lock
run cargo clean
run cargo fmt --all -- --check
run cargo clippy --locked --all-targets -- -D warnings
run cargo clippy --locked --all-targets --features gpu -- -D warnings
run cargo test --locked --all-targets
run cargo test --locked --all-targets --features gpu -- --nocapture
run cargo tree --locked --depth 1 -e normal,dev
run cargo tree --locked --depth 1 -e normal,dev --features gpu
run cargo +1.87.0 test --locked --all-targets --features gpu -- --nocapture
```

Log (bez skrótów):

```text
$ rustc --version
rustc 1.97.0 (2d8144b78 2026-07-07)
EXIT=0

$ cargo --version
cargo 1.97.0 (c980f4866 2026-06-30)
EXIT=0

$ git -C /home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1 rev-parse HEAD
17454b33abbd3ab4a87a7e75ac2b17c5d86a4d8a
EXIT=0

$ ls /dev/dri
ls: cannot access '/dev/dri': No such file or directory
EXIT=2

$ sha256sum Cargo.lock
703d2456d07de49dd04a5765be62627975ac5d66cd4a5e2e21886edede6dfce0  Cargo.lock
EXIT=0

$ cargo generate-lockfile
    Updating crates.io index
     Locking 125 packages to latest Rust 1.87 compatible versions
      Adding ordered-float v5.4.0 (available: v5.5.0, requires Rust 1.90)
      Adding pollster v0.4.0 (available: v1.0.1)
EXIT=0

$ sha256sum Cargo.lock
703d2456d07de49dd04a5765be62627975ac5d66cd4a5e2e21886edede6dfce0  Cargo.lock
EXIT=0

$ cargo clean
     Removed 1338 files, 795.8MiB total
EXIT=0

$ cargo fmt --all -- --check
EXIT=0

$ cargo clippy --locked --all-targets -- -D warnings
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 0.17s
EXIT=0

$ cargo clippy --locked --all-targets --features gpu -- -D warnings
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
   Compiling thiserror v2.0.21
    Checking equivalent v1.0.3
   Compiling libm v0.2.16
   Compiling autocfg v1.5.1
    Checking hashbrown v0.17.1
   Compiling num-traits v0.2.19
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking libloading v0.8.9
   Compiling libc v0.2.191
   Compiling zerocopy v0.8.63
    Checking log v0.4.34
    Checking indexmap v2.14.2
    Checking rustc-hash v1.1.0
    Checking bitflags v2.13.2
   Compiling naga v30.0.1
    Checking bit-vec v0.9.1
   Compiling ash v0.38.0+1.3.281
    Checking unicode-width v0.2.2
   Compiling pkg-config v0.3.34
   Compiling parking_lot_core v0.9.12
    Checking once_cell v1.21.4
   Compiling wayland-sys v0.31.11
    Checking codespan-reporting v0.13.1
    Checking bit-set v0.10.0
    Checking spirv v0.4.0+sdk-1.4.341.0
    Checking static_assertions v1.1.0
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking bytemuck v1.25.2
    Checking naga-types v30.0.1
   Compiling khronos-egl v6.0.0
   Compiling zerocopy-derive v0.8.63
    Checking scopeguard v1.2.0
    Checking allocator-api2 v0.2.21
    Checking smallvec v1.16.3
    Checking arrayvec v0.7.8
    Checking raw-window-handle v0.6.2
    Checking hashbrown v0.16.1
    Checking wgpu-types v30.0.1
    Checking lock_api v0.4.14
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking renderdoc-sys v1.1.0
    Checking profiling v1.0.18
    Checking glow v0.17.0
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling document-features v0.2.12
   Compiling wgpu v30.0.1
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 34.46s
EXIT=0

$ cargo test --locked --all-targets
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 0.36s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0

$ cargo test --locked --all-targets --features gpu -- --nocapture
   Compiling cfg-if v1.0.5
   Compiling foldhash v0.2.0
   Compiling equivalent v1.0.3
   Compiling thiserror v2.0.21
   Compiling libloading v0.8.9
   Compiling libm v0.2.16
   Compiling log v0.4.34
   Compiling hashbrown v0.17.1
   Compiling bitflags v2.13.2
   Compiling rustc-hash v1.1.0
   Compiling zerocopy v0.8.63
   Compiling libc v0.2.191
   Compiling indexmap v2.14.2
   Compiling num-traits v0.2.19
   Compiling once_cell v1.21.4
   Compiling naga-types v30.0.1
   Compiling bit-vec v0.9.1
   Compiling unicode-width v0.2.2
   Compiling bytemuck v1.25.2
   Compiling codespan-reporting v0.13.1
   Compiling bit-set v0.10.0
   Compiling spirv v0.4.0+sdk-1.4.341.0
   Compiling arrayvec v0.7.8
   Compiling raw-window-handle v0.6.2
   Compiling static_assertions v1.1.0
   Compiling scopeguard v1.2.0
   Compiling smallvec v1.16.3
   Compiling allocator-api2 v0.2.21
   Compiling parking_lot_core v0.9.12
   Compiling hashbrown v0.16.1
   Compiling lock_api v0.4.14
   Compiling wgpu-types v30.0.1
   Compiling ash v0.38.0+1.3.281
   Compiling dlib v0.5.3
   Compiling presser v0.3.1
   Compiling wayland-sys v0.31.11
   Compiling khronos-egl v6.0.0
   Compiling parking_lot v0.12.5
   Compiling half v2.7.1
   Compiling ordered-float v5.4.0
   Compiling naga v30.0.1
   Compiling glow v0.17.0
   Compiling renderdoc-sys v1.1.0
   Compiling profiling v1.0.18
   Compiling wgpu-naga-bridge v30.0.1
   Compiling gpu-allocator v0.28.0
   Compiling wgpu-hal v30.0.1
   Compiling wgpu-core-deps-windows-linux-android v30.0.1
   Compiling wgpu-core v30.0.1
   Compiling wgpu v30.0.1
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 34.72s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/civ_renderer-ba2e020f2268d7cf)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/cpu_sanity-8d2ce99d6c66c1e8)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/gpu_probe-0582898013e8e5d9)

running 1 test
SKIPPED: no GPU adapter (request_adapter error: No suitable graphics adapter found; noop support not compiled in, vulkan drivers/libraries could not be loaded, metal support not compiled in, dx12 support not compiled in, gl drivers/libraries could not be loaded, webgpu support not compiled in)
test gpu_probe_adapter_or_explicit_skip ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0

$ cargo tree --locked --depth 1 -e normal,dev
civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
[dev-dependencies]
└── pollster v0.4.0
EXIT=0

$ cargo tree --locked --depth 1 -e normal,dev --features gpu
civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
└── wgpu v30.0.1
[dev-dependencies]
└── pollster v0.4.0
EXIT=0

$ cargo +1.87.0 test --locked --all-targets --features gpu -- --nocapture
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
   Compiling foldhash v0.2.0
   Compiling autocfg v1.5.1
   Compiling thiserror v2.0.21
   Compiling equivalent v1.0.3
   Compiling libm v0.2.16
   Compiling hashbrown v0.17.1
   Compiling num-traits v0.2.19
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling libloading v0.8.9
   Compiling zerocopy v0.8.63
   Compiling log v0.4.34
   Compiling libc v0.2.191
   Compiling indexmap v2.14.2
   Compiling bitflags v2.13.2
   Compiling rustc-hash v1.1.0
   Compiling naga v30.0.1
   Compiling parking_lot_core v0.9.12
   Compiling ash v0.38.0+1.3.281
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
   Compiling pkg-config v0.3.34
   Compiling bit-vec v0.9.1
   Compiling once_cell v1.21.4
   Compiling unicode-width v0.2.2
   Compiling bytemuck v1.25.2
   Compiling zerocopy-derive v0.8.63
   Compiling naga-types v30.0.1
   Compiling codespan-reporting v0.13.1
   Compiling bit-set v0.10.0
   Compiling wayland-sys v0.31.11
   Compiling spirv v0.4.0+sdk-1.4.341.0
   Compiling scopeguard v1.2.0
   Compiling smallvec v1.16.3
   Compiling allocator-api2 v0.2.21
   Compiling arrayvec v0.7.8
   Compiling khronos-egl v6.0.0
   Compiling raw-window-handle v0.6.2
   Compiling static_assertions v1.1.0
   Compiling hashbrown v0.16.1
   Compiling wgpu-types v30.0.1
   Compiling lock_api v0.4.14
   Compiling dlib v0.5.3
   Compiling wgpu-hal v30.0.1
   Compiling presser v0.3.1
   Compiling parking_lot v0.12.5
   Compiling ordered-float v5.4.0
   Compiling profiling v1.0.18
   Compiling glow v0.17.0
   Compiling renderdoc-sys v1.1.0
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling document-features v0.2.12
   Compiling wgpu v30.0.1
   Compiling pollster v0.4.0
   Compiling half v2.7.1
   Compiling gpu-allocator v0.28.0
   Compiling wgpu-naga-bridge v30.0.1
   Compiling wgpu-core-deps-windows-linux-android v30.0.1
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_0bec7858-c2b-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 43.40s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/civ_renderer-6b861a72fe609883)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/cpu_sanity-3f94db894eb8213d)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_0bec7858-c2b-1/debug/deps/gpu_probe-669e972a69f08839)

running 1 test
SKIPPED: no GPU adapter (request_adapter error: No suitable graphics adapter found; noop support not compiled in, vulkan drivers/libraries could not be loaded, metal support not compiled in, dx12 support not compiled in, gl drivers/libraries could not be loaded, webgpu support not compiled in)
test gpu_probe_adapter_or_explicit_skip ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## 5. NIE_ZMIERZONO

1. Jakikolwiek render / utworzenie urządzenia (`request_device`) — brak adaptera w kontenerze (brak `/dev/dri`, brak ICD Vulkan, brak EGL).
2. Zachowanie sondy na maszynie z GPU (wypis nazwy adaptera) — ścieżka `Ok` skompilowana, nie wykonana.
3. Przebieg workflow na GitHub Actions (brak push) i `actionlint`.
4. Build na Windows/macOS (pakiety platformowe są w locku, nie budowane).
5. Rozmiar binarki i czas kompilacji wgpu w CI.
6. Wszystko, co należy do RR-T1 (osadzenie w Tauri, `raw-window-handle` w runtime, `rust-version` shella).

## 6. Granice

Zmiany wyłącznie: `rust-port/renderer/**` (nowe), `.github/workflows/rust-renderer.yml` (nowy), ten dokument, `dyspozycje/autobot/runs/R-RUSTPORT-P4-6-RENDERER-CRATE-SCAFFOLD-Q1/**`. Bez zmian: `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `.github/workflows/rust-engine.yml`. `target/` nie commitowany (target poza repo + `.gitignore`). Push/deploy: NIE WYKONANO.
