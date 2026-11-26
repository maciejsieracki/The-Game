# R-RUSTPORT-P4-405-RENDERER-LOCK-Q1 — 02a obrona Operatora

STATUS: PASS
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P4-405-RENDERER-LOCK-Q1
GOAL: `rust-port/renderer/Cargo.lock` zawiera `civ-view-model`; bramki renderera z `--locked` przechodzą bez przepisywania locka.
ZMIANY/COMMIT: tylko ten raport (kod/lock bez zmian względem 6c2c52cea; lock z 15d1aebcd).
TESTY: nie powtarzano; Evaluator odtworzył bramki na 6c2c52cea (fmt/clippy/test --locked EXIT 0, 758/0/0; engine 4372/0/1). Obrona nie zmienia żadnego pliku budowanego.
BLOKADY: brak. NIE_ZMIERZONO: `--features gpu` (brak `android_system_properties 0.1.6` w rejestrze offline).
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na uwagi Evaluatora (02-evaluator.md, commit 68d8407b5)

Evaluator nie zgłosił zarzutów blokujących. Odpowiadam na każdy punkt.

1. **„Brak zarzutów blokujących"** — PRZYJMUJĘ. Nie ma czego poprawiać.
2. **Bramki odtworzone na 6c2c52cea (758/0/0, 83 binarki; engine 4372/0/1; git status pusty)** — PRZYJMUJĘ. Wynik zgodny z raportem Operatora r1. Nie ma poprawki.
3. **Stan przed: lock bazy 2c8583731 z `--locked` daje EXIT 101, a pliku nie przepisuje; niezależna regeneracja offline daje lock identyczny bajt w bajt** — PRZYJMUJĘ. To potwierdza, że lock jest deterministyczny i minimalny (D-405-2).
4. **Sumy kontrolne itoa/serde_json/zmij zgodne z `.crate` i `client/Cargo.lock`; MSRV mieści się w 1.87** — PRZYJMUJĘ. Nie ma poprawki.
5. **Mutanty locka 6/6 zabite** — PRZYJMUJĘ. Bramka `--locked` wykrywa każdy z sześciu typów uszkodzenia.
6. **Zakres zgodny z allowlistą, D-405-1, D-405-2** — PRZYJMUJĘ. `git show --stat 15d1aebcd`: `rust-port/renderer/Cargo.lock | 34 +` (same dodane linie); w locku są 2 trafienia `civ-view-model` (pakiet i zależność `civ-renderer`).
7. **NIE_ZMIERZONO `--features gpu` (brak `android_system_properties 0.1.6` offline; drzewo wgpu 30.0.1 jest w locku)** — PRZYJMUJĘ jako jawne NIE_ZMIERZONO. To ograniczenie środowiska (brak sieci/rejestru), nie wada locka. Nie da się tego zmierzyć w tym kontenerze. Pierwszy pomiar będzie w CI `rust-renderer.yml` (`:56,:62,:83`).
8. **`src-tauri/Cargo.lock` nieaktualny (brak `civ-view-model`); CI `tauri-windows.yml` nie używa `--locked` przy buildzie** — PRZYJMUJĘ ustalenie, ODRZUCAM poprawkę w tym temacie. Sprawdziłem na 6c2c52cea: `grep -c civ-view-model src-tauri/Cargo.lock` = 0. W `tauri-windows.yml` `--locked` występuje tylko w `:47` (`cargo install tauri-cli … --locked`), a build `:51` `cargo tauri build --bundles msi,nsis --ci` go nie ma, więc CI nie pada. Plik jest poza allowlistą (dispatch: poprawki tylko renderera albo locka w allowliście). Przekazuję orkiestratorowi do wpisu w `REJESTR-RUST.md` i do tematu #410 TAURI-GLUE.

## Podsumowanie
Zarzutów do poprawy brak. Kod i lock bez zmian. Kandydat do Final Control: 15d1aebcd (lock) + raporty.
