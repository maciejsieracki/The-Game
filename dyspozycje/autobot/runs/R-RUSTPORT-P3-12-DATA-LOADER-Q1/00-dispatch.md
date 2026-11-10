STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-12-DATA-LOADER-Q1
GOAL: Loader/walidator danych z dysku (plan P3.9 „Loader/walidator” + P3.12 „testy brakujących/
uszkodzonych danych”): bramka P3 wymaga „dane ładowane ze źródła (nie hard-coded)”. Dodaj moduł
`src/data/loader.rs`, który ładuje i waliduje pliki danych z katalogu, z jawnymi błędami (brak pliku,
pusty plik, uszkodzony JSON, zły kształt/typ pola), oraz testy negatywne i pozytywne.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Wszystko przez agent()
  w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0`
(dokumentacja). Dokumenty z gałęzi dokumentacyjnej czytaj przez
`git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`.
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`;
baza musi zawierać `1d53dcdb` lub nowszy. Baseline: `cargo test --offline` PRZED zmianami, zapisz liczbę
(oczekiwane 256 passed).

KOSZT DYSKU: buduj z
`CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline`.
NIE twórz `rust-port/engine/target/` w worktree. NIE commituj `Cargo.lock` ani `target/`.

Czytaj: `rust-port/engine/src/data/mod.rs` i moduły `src/data/*.rs` (jak dziś parsują dane — funkcje
`parse_*`, skąd biorą tekst: `include_str!` czy argument), `src/domain/error.rs` i `src/logging.rs`
(konwencje błędów/logowania — użyj istniejących, nie wprowadzaj nowej biblioteki), istniejące
`tests/data_*.rs`.

ZADANIE
1. Zaprojektuj minimalne API loadera: ładowanie wskazanego pliku/całego katalogu danych (domyślnie
   `rust-port/engine/data/`, ścieżka przekazywana argumentem — NIE hard-coded) z typem błędu
   rozróżniającym: brak pliku, błąd I/O, pusty plik, niepoprawny JSON (z pozycją), niezgodny kształt
   (nazwa pliku + serde path). Błąd ma nazwę pliku. Bez panic/unwrap w ścieżkach błędów.
2. Zaimplementuj `rust-port/engine/src/data/loader.rs` i dopisz `pub mod loader;` w
   `src/data/mod.rs` (JEDYNA dopuszczalna zmiana tego pliku). Użyj istniejących `parse_*` modułów
   danych — nie duplikuj struktur.
3. Testy w NOWYM `rust-port/engine/tests/data_loader.rs`:
   - pozytyw: wszystkie 27 plików z `CARGO_MANIFEST_DIR/data` ładują się bez błędu;
   - negatywy: brak pliku; pusty plik; ucięty JSON; poprawny JSON o złym kształcie (np. liczba tam,
     gdzie obiekt; brakujące wymagane pole); katalog nie istnieje; plik nie-UTF8. Katalogi tymczasowe
     twórz przez `std::env::temp_dir()` z unikalną nazwą i sprzątaj — BEZ nowych zależności
     (`tempfile` zabronione).
   - każdy test negatywny asercją na KONKRETNY wariant błędu, nie tylko `is_err()`.
4. Zero zmian zachowania istniejących modułów danych.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez surowego logu `cargo test` z `echo "EXIT=$?"` wklejonego dosłownie do
dokumentu. Jeśli któryś wariant błędu jest niemożliwy do wywołania w teście — opisz jawnie, nie pomijaj.
Zakaz dodawania zależności; jeśli bez nich się nie da — BLOCK z opisem.

BINARNE KRYTERIUM SUKCESU
Loader istnieje, API ładuje wszystkie 27 plików z podanego katalogu, ≥6 testów negatywnych
z asercją na konkretny wariant błędu + 1 pozytywny, `cargo build`+`cargo test --offline` exit 0, liczba
testów > baseline, żaden istniejący test nie zniknął, surowy log w dokumencie.

ALLOWLISTA
Worktree: `rust-port/engine/src/data/loader.rs` (NOWY), `rust-port/engine/src/data/mod.rs` (TYLKO
dopisanie `pub mod loader;`), `rust-port/engine/tests/data_loader.rs` (NOWY). Dokument:
`dyspozycje/rust-port/p3/P3-12-DATA-LOADER.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-12-DATA-LOADER-Q1/**`.
Zero zmian w `Cargo.toml`, `lib.rs`, innych `src/**`, `gra/**`. (Równolegle: P3.4b na `domain/**`+`bridge.rs`,
P3.11 na `tests/data_compliance.rs`, P3.8b na `tests/assets_manifest.rs` — nie dotykaj ich plików.)

IZOLACJA
`isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add` plików
z allowlisty, NIGDY `git add -A`), PUSH NIE.

PROCEDURA NAPRAWCZA PRZY FAIL: jak w poprzednich tematach, ten sam ID; po 5 rundach LIMIT-5-EXCEEDED.
OGRANICZENIA WYJŚCIA: raport max ok. 400 słów (logi w pliku docelowym).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
