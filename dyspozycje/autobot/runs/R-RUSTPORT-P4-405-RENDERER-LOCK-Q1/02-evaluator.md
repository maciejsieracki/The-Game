# R-RUSTPORT-P4-405-RENDERER-LOCK-Q1 — Evaluator r1 (adwersarialny)

STATUS: PASS
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P4-405-RENDERER-LOCK-Q1
GOAL: `rust-port/renderer/Cargo.lock` zawiera `civ-view-model` (i brakujące zależności), a `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` (gpu OFF) przechodzą bez przepisywania locka.
ZMIANY/COMMIT: oceniany kod: `15d1aebcd` (lock), raport Operatora `6c2c52cea`, gałąź `rust-port-wip/R-RUSTPORT-P4-405-RENDERER-LOCK-Q1`; baza `2c8583731` (= `origin/rust-port/parity-v2`, merge-base zgodny). Ten raport: jedyny plik dodany przez Evaluatora (gałąź lokalna `eval/R-RUSTPORT-P4-405-RENDERER-LOCK-Q1`, bez push).
TESTY: §2 (wszystkie odtworzone samodzielnie, kody wyjścia zmierzone).
BLOKADY: gpu (`--features gpu`) NIE_ZMIERZONO — brak źródeł crate'ów (np. `android_system_properties 0.1.6`) w lokalnym rejestrze.
RUNDY: 1/5
NASTĘPNY KROK: Obrona → Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista i zakres
- `git diff --stat 2c8583731..6c2c52cea`: `rust-port/renderer/Cargo.lock` (+34/−0) i `01-operator-r1.md`. Brak `.rs`, `Cargo.toml`, `gra/`, engine, client. Sekcja „Pliki spoza allowlisty”: brak — zgodnie.
- D-405-1 spełnione (tylko lock). D-405-2 spełnione: diff wyłącznie dodający (0 linii `-`), żadna istniejąca wersja nie zmieniona.
- Brak `#[ignore]`/osłabionych asercji (zero zmian w kodzie testów).
- Commity: brak linii z nazwą modelu; jest tylko `Claude-Session:`.
- PRE-SKIP-RAF i SHOT-LAND-AT-RENDER nietknięte (zgodnie z dispatchem).

## 2. Bramki odtworzone (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR w scratchpadzie, usunięty; wolne 13 GB przed bramką renderera, brak równoległych cargo)
| bramka (rust-port/renderer, gpu OFF) | EXIT | wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --locked --all-targets -- -D warnings` (jak CI, bez `--offline`) | 0 | — |
| `cargo test --locked --all-targets` | 0 | 758 passed / 0 failed / 0 ignored, 83 binarki = baza |
| `git status --short` po bramkach | — | pusty (lock stabilny) |
| engine pełny `cargo test --all-targets` (w tle, log z EXIT) | 0 | 4372 passed / 0 failed / 1 ignored, 558 binarek = pomiar bazy #406 |

## 3. Stan przed — odtworzony
- Lock bazy (`git show 2c8583731:…/Cargo.lock`) podstawiony do drzewa: `cargo metadata --locked --offline` → EXIT 101, „cannot update the lock file … because --locked was passed”; lock po próbie identyczny (cmp OK) — `--locked` nie przepisuje.
- Niezależna regeneracja (`cargo metadata --offline` na locku bazy): „Locking 4 packages … Adding civ-view-model v0.1.0, itoa v1.0.19, serde_json v1.0.154, zmij v1.0.23”; wynik **bajt w bajt identyczny** z lockiem Operatora (cmp OK).

## 4. Weryfikacja treści locka
- Sumy kontrolne `itoa`, `serde_json`, `zmij` = `sha256sum` plików `.crate` w `~/.cargo/registry/cache` i = wpisy w `rust-port/client/Cargo.lock`.
- MSRV: `serde_json 1.0.154` i `zmij 1.0.23` mają `rust-version = 1.71`, `itoa 1.0.19` — 1.68; zgodne z jobem CI `dtolnay/rust-toolchain@1.87.0` (`rust-renderer.yml:80`). Resolver działał w trybie MSRV-aware („Rust 1.87 compatible versions”).
- Cecha `float_roundtrip` dev-zależności `serde_json` nie wpływa na lock (cechy nie są w locku).

## 5. Mutanty locka (każdy musi dać błąd `cargo metadata --locked --offline`)
| mutant | EXIT | komunikat |
|---|---|---|
| M1 usunięty pakiet `civ-view-model` | 101 | cannot update the lock file |
| M2 usunięty `"serde_json"` z deps `civ-renderer` | 101 | cannot update the lock file |
| M3 zmieniona suma `serde_json` (ostatni znak) | 101 | checksum for `serde_json v1.0.154` changed between lock files |
| M4 usunięty pakiet `zmij` | 101 | cannot update the lock file |
| M5 usunięty `"civ-view-model"` z deps `civ-renderer` | 101 | cannot update the lock file |
| M6 `civ-view-model` bez `dependencies = ["serde"]` | 101 | cannot update the lock file |
6/6 zabite — każdy dodany fragment jest wymagany, lock nie jest nadmiarowy ani „luźny”. Lock przywrócony (cmp z wersją Operatora OK).

## 6. gpu — NIE_ZMIERZONO (potwierdzam ustalenie Operatora)
- Lock zawiera drzewo `wgpu 30.0.1` (już na bazie; resolver uwzględnia zależności opcjonalne), `pollster 0.4.0`, `android_system_properties 0.1.6`; łącznie 170 pakietów.
- `cargo metadata --locked --offline --all-features` → EXIT 101 z „failed to download `android_system_properties v0.1.6`” — błąd pobierania, nie locka. Kroki CI `rust-renderer.yml:56,:62,:83` niezweryfikowane w tym kontenerze.

## 7. Przegląd CI/innych crate'ów — weryfikacja raportu Operatora
- `rust-renderer.yml:53,56,59,62,83` — `--locked`, `working-directory: rust-port/renderer` (`:35,:70`): kroki gpu OFF teraz przechodzą lokalnie.
- `rust-engine.yml` — brak `--locked`; engine lock nieśledzony (potwierdzone: brak `rust-port/engine/Cargo.lock` w drzewie).
- `tauri-windows.yml:47` `--locked` tylko dla `cargo install tauri-cli`; `:51` `cargo tauri build` bez `--locked`.
- `src-tauri/Cargo.lock`: wpis `civ-engine` ma tylko `serde`, 0 trafień `civ-view-model`, a `rust-port/engine/Cargo.toml:11` zależy od `civ-view-model` — lock nieaktualny. Zgodnie z dispatchem poza allowlistą, tylko raport; słusznie skierowane do #410 TAURI-GLUE.

## 8. Uwagi (niekrytyczne)
- N1: Operator dopisał `serde_json`/`itoa`/`zmij` poza nazwanym w GOAL `civ-view-model`; mieści się w „ewentualne inne brakujące wpisy” i jest konieczne (M2/M4 dowodzą). Bez zastrzeżeń.
- N2: dług `src-tauri/Cargo.lock` (§7) do zapisania w rejestrze jako osobny temat (orkiestrator).

## Werdykt
PASS. Kryteria końca 1–3 spełnione i odtworzone niezależnie; jedynie gpu NIE_ZMIERZONO (jawnie, ograniczenie środowiska offline).
