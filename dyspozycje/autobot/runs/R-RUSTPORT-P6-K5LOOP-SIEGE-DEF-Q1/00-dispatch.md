# R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1 — obrońca w oblężeniu w ProdBody (T1) + K5LOOP-KILL-RIPPLE

STATUS: dispatch orkiestratora. Opus (cała linia K5 prowadzona na Opusie wg polecenia właściciela: tylko 3D/grafika Rust na Opus), wszystkie etapy Opus. Podstawa: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-WIRING-ROZP-Q1/00-rozpoznanie.md` §3 (T1), §4, §5; decyzje D-WIR-*, D-INT-2, D-T8-N1 w `dyspozycje/rust-port/REJESTR-RUST.md`. Czytaj je PIERWSZE. NAJPIERW web (pin `07d2fbd72`, `git show 07d2fbd72:gra/src/...`, nie zmieniaj `gra/`), potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `8a40ff9b3` w dniu dispatchu — zawiera T3 K5DOC-T8 i T5a BATTLE-SETUP; wpisz faktyczny SHA w raporcie). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.
JEDEN TEMAT NARAZ NA `siege_tactics_loop.rs` (T3 jest już zintegrowany; T2/T4 czekają na ten temat).

## GOAL
1. **Obrońca w oblężeniu w ciele (`ProdBody`)**: `onWallWalkway` (zasięg +1, kontrbateria katapulty `bestCata`, trzymanie muru, cios sąsiada), obrońca oblężenia nie wychodzi z miasta (`battleScene.ts` ok. `:6129-6170`, `:6225-6235`; Operator weryfikuje numery linii z pinu i cytuje). Zdjęcie tagu `oblezenie` **wyłącznie dla strony `def`** przy `siege_wall_col >= 0`; strona atakująca nadal tagowana `oblezenie` (to zakres T2).
2. **K5LOOP-KILL-RIPPLE (D-INT-2)**: wpięcie `_shakeAlliesOnLoss` przy zabiciu (pin ok. `:9048` i `:5937` — zweryfikuj) w ciele pętli.
## DOZWOLONE ZMIANY ISTNIEJĄCYCH ASERCJI (D-INT-2 — wyłącznie to, z pisemnym uzasadnieniem w raporcie, bez osłabiania)
Wprowadzenie ripple może zmienić oczekiwane liczniki/zdarzenia w: `rust-port/engine/tests/p6_siege_tactics_loop_body.rs` (asercje ok. `:407` i `:688` — znajdź po treści) i `rust-port/engine/tests/p6_k5loop_outcome_pin.rs` (ok. `:268`, `:281`). Dozwolone: zmiana wartości oczekiwanej na wynik pinu, jeśli wektor z pinu to potwierdza, ORAZ dodanie asercji wzmacniających. Zakaz: usuwanie asercji, `#[ignore]`, poluzowanie porównań (`==`→`>=`), zmiana wektorów r1–r4 (`p6_k5loop_close_*`). Każda zmiana asercji = osobny akapit w `01-operator-r1.md` z cytatem starej i nowej wartości oraz dowodem z pinu.

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`; nowe `rust-port/engine/tests/p6_k5loop_siege_def.rs`, `rust-port/engine/tests/p6_k5loop_siege_def_gen.mjs` (generator TS wykonujący tekst pinu z guardem SHA, jak `p6_k5doc_t8_gen.mjs`), `rust-port/engine/tests/p6_k5loop_siege_def_vectors/*.json`; opcjonalnie nowy plik pomocniczy `rust-port/engine/src/domain/siege_tactics_def*.rs` + `rust-port/engine/src/domain/mod.rs` (wyłącznie linie `pub mod`); dwa pliki testów z sekcji wyżej (tylko wskazane asercje); raporty runu w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1/`. NIE ruszaj: `renderer/`, `view-model/`, `bridge.rs`, `siege_tactics_actions.rs`, `battle_setup*.rs`, `Cargo.toml`/`Cargo.lock`, `gra/**`, `REJESTR-RUST.md` (wpisy robi orkiestrator; zgłoś w raporcie).

## KRYTERIA KOŃCA
- Dla `def` przy `siege_wall_col >= 0` zero tagu `oblezenie` w `ProdBody::unported`.
- Wektory pinu (generator wykonuje tekst pinu) dla gałęzi obrońcy: wybór celu, facing, `onWallWalkway`, kontrbateria katapulty, trzymanie muru, cios sąsiada; NaN/Inf w kluczowych wejściach (lekcja NaN: warunek pętli `x <= 0.0 || x.is_nan()`, 90 s strażnik czasu w testach pętli); dokładne nazwy liczników pokrycia.
- Wektory ripple przy zabiciu (`_shakeAlliesOnLoss`): zgodność zdarzeń i morale z pinem.
- Mutanty: >= 10 (po jednym na gałąź), wszystkie zabite albo jawnie uzasadnione jako równoważne.
## BRAMKI (EXIT 0), w `rust-port/engine`
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; nowy test; `cargo test --test p6_siege_tactics_loop_body --test p6_k5loop_outcome_pin --test p6_k5loop_close_r4 --test p6_k5doc_t8 --test p4_1i3_actions`; pełny `cargo test --all-targets --no-fail-fast` w tle (`setsid nohup`, EXIT w logu; przy < 8 GB wolnego — partiami z usuwaniem binarek, opisać w raporcie). Unikalny podkatalog scratchpadu `siegedef/…`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie tematu, target usuń po bramkach. Worktree sparse: `git sparse-checkout set --cone rust-port dyspozycje src-tauri` (bridge_contract czyta `src-tauri/src/lib.rs`). Wymaga >= 8 GB wolnego na starcie; max 2 równoległe buildy (T1 FRAME-ADAPTER renderera już działa).
## ZAKAZY
Brak push/deploy/integracji (robi orkiestrator), brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Gameplay poza webem → STOP (BLOCK + pytanie).
Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`. W sekcji „Długi" zapisz luki dla T2/T4/#369.
