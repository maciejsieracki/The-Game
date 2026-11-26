# R-RUSTPORT-P4-405-RENDERER-LOCK-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P4-405-RENDERER-LOCK-Q1
GOAL: `rust-port/renderer/Cargo.lock` zawiera `civ-view-model` (i brakujące zależności), a `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` (gpu OFF) przechodzą bez przepisywania locka.
ZMIANY/COMMIT: gałąź `rust-port-wip/R-RUSTPORT-P4-405-RENDERER-LOCK-Q1`; commit kodu (lock) `15d1aebcd4f53a8e7901368ffbee45665cb4aca2`; raport w commicie następnym (SHA w wyniku workflow). Baza: `origin/rust-port/parity-v2` = `2c8583731cdb91393226ecb38255bce6e59582fb`. Zmieniony plik: tylko `rust-port/renderer/Cargo.lock` (+34 linie, 0 usuniętych). `Cargo.toml` i `.rs` nietknięte.
TESTY: patrz §3.
BLOKADY: gpu (`--features gpu`) NIE_ZMIERZONO — brak źródeł crate'ów wgpu/winit w lokalnym rejestrze (offline). Szczegóły §4.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus).
DEPLOY/PUSH: NIE WYKONANO

## 1. Stan przed (baza 2c8583731)

- `grep -c civ-view-model rust-port/renderer/Cargo.lock` = 0; `Cargo.toml:57` ma `civ-view-model = { path = "../view-model" }`. Brakował też `serde_json` (dev-dependency renderera, `Cargo.toml` `[dev-dependencies]`) wraz z zależnościami `itoa`, `zmij`.
- `cargo test --locked --all-targets` → EXIT 101:
  ```
  error: cannot update the lock file .../rust-port/renderer/Cargo.lock because --locked was passed to prevent this
  help: to generate the lock file without accessing the network, remove the --locked flag and use --offline instead.
  ```
- `cargo clippy --locked --all-targets -- -D warnings` → EXIT 101, ten sam komunikat. `cargo metadata --locked --offline` → EXIT 101, ten sam komunikat. Lock z `--locked` nie jest modyfikowany (cmp z bazą: identyczny).
- Bez `--locked` (`cargo metadata --offline`) cargo przepisuje lock: „Locking 4 packages … Adding civ-view-model v0.1.0, itoa v1.0.19, serde_json v1.0.154, zmij v1.0.23” → dokładnie +34 linie (zgodne z „DŁUG-T1-LOCK” w rejestrze).

## 2. Co dodano do locka (D-405-2: tylko brakujące pakiety, zero zmian wersji)

Wygenerowane offline (`cargo metadata --offline`), diff wyłącznie dodający:
| pakiet | wersja | źródło |
|---|---|---|
| civ-view-model | 0.1.0 | path `../view-model` (zależy od `serde`) |
| serde_json | 1.0.154 | crates.io (zależy od itoa, memchr, serde, serde_core, zmij) |
| itoa | 1.0.19 | crates.io |
| zmij | 1.0.23 | crates.io |
Plus wpisy `"civ-view-model"` i `"serde_json"` w `dependencies` pakietu `civ-renderer`. Żadna istniejąca wersja nie zmieniona (diff bez linii `-`). Wersje identyczne jak w `rust-port/client/Cargo.lock` (serde_json 1.0.154, itoa 1.0.19, zmij 1.0.23).

## 3. Bramki (gpu OFF; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach; wolne 14 GB, brak równoległych procesów cargo)

| bramka | EXIT |
|---|---|
| `cargo fmt --check` | 0 |
| `cargo clippy --locked --offline --all-targets -- -D warnings` | 0 |
| `cargo clippy --locked --all-targets -- -D warnings` (jak CI, bez --offline) | 0 |
| `cargo test --locked --all-targets` | 0 — 758 passed, 0 failed, 0 ignored (83 binarki testowe); = 758 z ostatniego pomiaru |
| `cargo metadata --locked --offline` | 0 |

Stabilność locka: po wszystkich bramkach plik identyczny z wygenerowanym (cmp OK), `git diff` względem commita `15d1aebcd` pusty.

## 4. gpu (CI `rust-renderer.yml:56,:62,:83`) — NIE_ZMIERZONO

- Lock już na bazie zawierał drzewo `wgpu 30.0.1` (lock jest niezależny od cech; resolwer uwzględnia opcjonalne zależności), więc wpisy dla cechy `gpu` istnieją — nic nie trzeba było generować.
- `cargo metadata --locked --offline --all-features` → EXIT 101, ale NIE z powodu locka: `failed to download android_system_properties v0.1.6 … --offline was specified` (brak źródeł w lokalnym rejestrze). Rozwiązanie zależności z `--locked` przeszło (błąd na etapie pobierania). Build/clippy/test z `--features gpu` nie wykonane w tym kontenerze.

## 5. Przegląd innych crate'ów i CI pod kątem `--locked` (tylko raport)

| crate / lock | zależności ścieżkowe | stan |
|---|---|---|
| `rust-port/client/Cargo.lock` (śledzony) | engine, renderer, view-model | `cargo metadata --locked --offline` EXIT 0, także `--all-features` EXIT 0. Brak CI. OK. |
| `rust-port/engine` | view-model | lock nieśledzony (`.git/info/exclude:19`); CI `rust-engine.yml` nie używa `--locked` → brak problemu. |
| `rust-port/view-model` | — | lock ignorowany (`view-model/.gitignore`), brak CI. |
| `rust-port/spike-gpu-embed/Cargo.lock` (śledzony) | brak | `--locked --offline` EXIT 101: `no matching package named tauri` w lokalnym indeksie — NIE_ZMIERZONO (offline), brak CI. |
| `src-tauri/Cargo.lock` (śledzony) | `civ-engine` (`../rust-port/engine`) | **UWAGA / dług poza allowlistą:** wpis `civ-engine` ma tylko `dependencies = ["serde"]` i lock nie zawiera `civ-view-model`, a `rust-port/engine/Cargo.toml:11` zależy od `civ-view-model` → lock nieaktualny. Weryfikacja offline niemożliwa (brak `tauri` w rejestrze). CI `tauri-windows.yml:51` buduje `cargo tauri build` BEZ `--locked` (`--locked` tylko przy `cargo install tauri-cli`, `:47`), więc CI nie pada, ale lock jest przepisywany przy buildzie. Nie poprawiono (poza allowlistą, nie jednolinijkowe, wymaga sieci). Proponowany osobny temat (np. w ramach #410 TAURI-GLUE). |

CI: `rust-renderer.yml` — jedyny workflow z `--locked` na crate'cie z repo; po tej zmianie kroki `:53` i `:59` przechodzą lokalnie; `:56,:62,:83` (gpu) NIE_ZMIERZONO. `rust-engine.yml` — brak `--locked`. `tauri-windows.yml` — brak `--locked` przy buildzie.

## 6. Zakres
PRE-SKIP-RAF i SHOT-LAND-AT-RENDER nietknięte (wg dispatchu). Brak zmian w `gra/`, `.rs`, engine, client, Cargo.toml.
