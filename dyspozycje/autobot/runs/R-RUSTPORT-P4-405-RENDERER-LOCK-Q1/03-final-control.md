# R-RUSTPORT-P4-405-RENDERER-LOCK-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P4-405-RENDERER-LOCK-Q1
GOAL: `rust-port/renderer/Cargo.lock` zawiera `civ-view-model` (i brakujące zależności), a `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` (gpu OFF) przechodzą bez przepisywania locka.
ZMIANY/COMMIT: gałąź lokalna `fc/R-RUSTPORT-P4-405-RENDERER-LOCK-Q1` = obrona `341d43998` (zawiera Operatora `6c2c52cea`, lock `15d1aebcd`) + merge Evaluatora `68d8407b5` + ten raport. Baza `origin/rust-port/parity-v2` = `2c8583731`. Kod do integracji: wyłącznie `15d1aebcd` (`rust-port/renderer/Cargo.lock` +34/−0).
TESTY: §2 (odtworzone samodzielnie w FC).
BLOKADY: brak. NIE_ZMIERZONO: `--features gpu` (CI `rust-renderer.yml:56,:62,:83`) — brak źródeł crate'ów w rejestrze offline.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge `15d1aebcd` na `rust-port/parity-v2`), wpis w `REJESTR-RUST.md` (zamknięcie DŁUG-T1-LOCK; nowy dług `src-tauri/Cargo.lock` → #410).
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista i zakres (zweryfikowane w FC)
- `git diff --stat 2c8583731 HEAD` (przed tym raportem): `rust-port/renderer/Cargo.lock` +34, `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`. Zero `.rs`, `Cargo.toml`, `gra/`, engine, client. D-405-1 i D-405-2 spełnione (diff locka wyłącznie dodający, żadna wersja istniejąca nie zmieniona).
- Dodane pakiety: `civ-view-model 0.1.0` (path), `serde_json 1.0.154`, `itoa 1.0.19`, `zmij 1.0.23` + 2 wpisy w `dependencies` `civ-renderer`. `grep -c civ-view-model` w locku = 2.
- Commity: brak linii z nazwą modelu (tylko `Claude-Session:`), brak `#[ignore]`.

## 2. Bramki odtworzone w FC (rust-port/renderer, gpu OFF; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR w scratchpadzie, usunięty; brak równoległych procesów cargo)
| bramka | EXIT | wynik |
|---|---|---|
| `cargo metadata --locked --offline` | 0 | — |
| `cargo fmt --check` | 0 | — |
| `cargo clippy --locked --all-targets -- -D warnings` (jak CI) | 0 | — |
| `cargo test --locked --all-targets` | 0 | 758 passed / 0 failed / 0 ignored, 83 binarki = baza |
| `git status --short` po bramkach | — | pusty (lock stabilny, nieprzepisany) |

Stan przed (FC, kopia crate'u z lockiem bazy `2c8583731` w scratchpadzie): `cargo metadata --locked --offline` → EXIT 101 „cannot update the lock file … because --locked was passed”, lock nieprzepisany (cmp OK); `cargo metadata --offline` regeneruje lock **bajt w bajt identyczny** z lockiem Operatora.

Wolne miejsce przed bramką: 11 307 MiB (≈ 11,9 GB; `df -h` = 12G) — minimalnie poniżej progu 12 GB z dispatchu. Bramka uruchomiona, bo budowa renderera gpu OFF przy DEBUG=0 zużyła ok. 0,3 GB i brak było innych buildów; odnotowane jako uwaga procesowa (U2), bez wpływu na wynik.

Engine: nie uruchamiano ponownie (zero zmian w plikach engine/view-model; Evaluator zmierzył 4372/0/1). Zmiana locka renderera nie wpływa na build engine.

## 3. Zarzuty i orzeczenia
| # | zarzut / uwaga (źródło) | orzeczenie | uzasadnienie |
|---|---|---|---|
| Z1 | gpu (`--features gpu`) NIE_ZMIERZONO (Operator §4, Evaluator §6) | ODDAL | Ograniczenie środowiska offline (brak `android_system_properties 0.1.6` itd.); lock na bazie już zawierał drzewo `wgpu 30.0.1` (lock nie zależy od cech), nowe wpisy nie dotykają gałęzi gpu. Pierwszy pomiar: CI `rust-renderer.yml:56,:62,:83`. Jawnie zapisane. |
| Z2 | N1 Evaluatora: dopisano `serde_json`/`itoa`/`zmij` poza nazwanym `civ-view-model` | ODDAL | Mieści się w GOAL („ewentualne inne brakujące wpisy”); mutanty M2/M4 Evaluatora i regeneracja w FC dowodzą, że są wymagane. |
| Z3 | `src-tauri/Cargo.lock` nieaktualny (brak `civ-view-model`, a `rust-port/engine/Cargo.toml:11` go wymaga) | ODDAL (w tym temacie) | Potwierdzone w FC (`grep -c` = 0). Poza allowlistą i wymaga sieci (`tauri` brak offline); CI `tauri-windows.yml` buduje bez `--locked` (`--locked` tylko `:47` przy `cargo install tauri-cli`), więc CI nie pada. Do zapisania przez orkiestratora jako dług dla #410 TAURI-GLUE. |
| Z4 | `spike-gpu-embed/Cargo.lock` niezweryfikowany offline (Operator §5) | ODDAL | Brak CI i brak zależności ścieżkowych; tylko raport, zgodnie z dispatchem. |

Brak zarzutów NAPRAW. Brak pozycji DO DECYZJI CZŁOWIEKA.

## 4. Uwagi
- U1: Do integracji wystarczy commit `15d1aebcd` (lub cała gałąź obrony `341d43998` + raporty). Po FF warto zamknąć w `REJESTR-RUST.md` wpis „DŁUG-T1-LOCK” — orkiestrator nie musi już cofać locka przed commitami renderera.
- U2: próg dysku 12 GB był na granicy (11,9 GB); orkiestrator może podnieść zapas przed kolejnymi bramkami renderera.

## Werdykt
PASS-WITH-NOTES. Kryteria końca 1–3 spełnione i odtworzone niezależnie w FC; jedyne NIE_ZMIERZONO to gpu (ograniczenie środowiska).
