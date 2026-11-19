# R-RUSTPORT-P4-371-T5C-PIN-PARITY — wyrównanie warstwy zaznaczenia/zasięgu klienta i renderera do pinu (#371, T5c)

STATUS: dispatch orkiestratora. Opus (cała linia #371), wszystkie etapy Opus. Podstawa: decyzja **D-371-5c** w `REJESTR-RUST.md` (rozbieżności U-OP-1..4 z Operatora/Evaluatora T5b, zasada 11: web najpierw); raporty `…/R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER/01–03`; D-371-5b (flaga `unit_selected_after_build_open` zerowana TYLKO przy zmianie trybu budowy; `highlight_last_writer ∈ {Reachable, Build}`). NAJPIERW web (pin `07d2fbd72`, `git show 07d2fbd72:gra/src/main.ts`): `selectPlayerUnit` `:7233-7261`, `setHighlight`/`clearHighlight` `:7120-7122`, `refreshBuildHighlight` `:16351-16396`, `onSelectFoundCity`/`onSelectWonder` `:26758-26793`, `onOpenBuild` `:26702-26703`, `exitBuildMode`/Escape, `clearPlayerUnitSelection` `:7090-7106`. `gra/` nie zmieniaj.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `48035d3a7` w dniu dispatchu; zawiera T4 TAGS-REST; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Wyrównać do pinu (nie wymyślać zasad; każda zmiana ma uzasadnienie w numerze linii pinu w komentarzu i raporcie) cztery rozbieżności:
- **U-OP-1** — przy `highlight_last_writer = Reachable` i PUSTYM `reachable` renderer dziś pokazuje warstwę budowy; pin (`selectPlayerUnit :7256-7261`) woła `setHighlight(pusty zbiór)` = brak krążków → warstwa Reachable z pustym zbiorem = Clear (bez krążków budowy).
- **U-OP-2** — `onSelectFoundCity`/`onSelectWonder` w pinie NIE czyszczą zaznaczenia (`:26758-26793`), a D-371-5b zeruje flagę (silnik chowa pierścień/zasięg). Zweryfikuj na pinie i zerować flagę wyłącznie tam, gdzie pin czyści zaznaczenie (`onOpenBuild`); `found_city_mode`/`wonder_active` bez zerowania zaznaczenia.
- **U-OP-3** — Escape w `exitBuildMode` nie czyści zaznaczenia i nie ma osobnej metody klienta; dodaj metodę klienta odpowiadającą `exitBuildMode` (zamyka tryb budowy, zaznaczenie zostaje).
- **U-OP-4** — `select_unit(None)` w trybie budowy zostawia warstwę budowy; pin woła `clearHighlight` → po `select_unit(None)` warstwa podświetlenia czyszczona zgodnie z pinem (rozstrzygnij z kodu pinu, co dokładnie robi gałąź deselect).
Decyzje techniczne zapisz w raporcie (D-T5C-n); nie ruszaj gameplayu.

## ALLOWLISTA
`rust-port/renderer/src/view/units.rs`; `rust-port/renderer/src/view/frame.rs` (tylko jeśli konieczne; inaczej STOP); `rust-port/renderer/tests/overlays_units_q6.rs`, `rust-port/renderer/tests/view_frame.rs`; `rust-port/client/src/**`, `rust-port/client/tests/**`; raporty runu. NIE ruszaj: `engine/`, `view-model/`, `src-tauri/`, `gra/**`, `Cargo.toml`, `renderer/Cargo.lock` (DŁUG-T1-LOCK), `REJESTR-RUST.md`.

## KRYTERIA KOŃCA
- Testy scenariuszy U-OP-1..4 wzięte z kodu pinu (wektor = opis kroków webu → oczekiwana warstwa/zaznaczenie), e2e klient↔silnik w `client/tests` oraz ręczne DTO w rendererze.
- Mutanty, każdy wykryty: (a) U-OP-1 przywrócone (pusty `reachable` → build); (b) flaga zerowana w `found_city_mode`/`wonder_active`; (c) `exit_build_mode` czyści zaznaczenie; (d) `select_unit(None)` nie czyści warstwy; (e) `highlight_last_writer` zmienia się bez wywołania zgodnego z pinem; (f) zmiana `highlight_last_writer` woła `GetRenderFrame` (D-371-4).
- Istniejące testy (`view_frame`, `overlays_units_q6`, klient) zielone, asercje nie osłabione (jeśli zmiana zachowania wymaga zmiany asercji — wpis i uzasadnienie pinem w raporcie).
## BRAMKI (EXIT 0)
W `rust-port/renderer` (bez `--features gpu`): `cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --all-targets` (DŁUG-T1-LOCK: `--locked` wymaga lokalnego uzupełnienia `Cargo.lock`, cofnij przed commitem). W `rust-port/client`: `cargo fmt --all -- --check`; `cargo clippy --locked --all-targets -- -D warnings`; `cargo test --locked --all-targets`. Build renderera: >= 12 GB wolnego na starcie, brak innego buildu renderera; max 2 równoległe buildy. Unikalny podkatalog scratchpadu `t5crender/…`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramkach. Worktree sparse `git sparse-checkout set --cone rust-port dyspozycje src-tauri`. COMMIT WIP po każdym kroku (timeouty rund kasują niezacommitowaną pracę).
## ZAKAZY
Brak push/deploy/integracji (robi orkiestrator), brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Gameplay poza webem → STOP. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
