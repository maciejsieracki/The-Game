# DISPATCH R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW (runda 1) — trasy handlowe, pola robotników i okolica dla nakładek (P4-1F4 / PRIO-3D-4, #272 · #241)

DOMENA: DTO nakładek + producent okolicy (engine, view-model). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `585bb48e0` (zawiera P4-1F1 `8ecf01c2c`). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` §4 (wiersz 1F4) — `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md`.
Lokalizację funkcji w pinie ustal przez `git grep -n "collectWorkedHexOwnerMap\|collectWorkedHexKeysForOwner\|computeLostToNearerSiblingByCity\|tradeRoutes\|workerFields" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek. Numery linii z recon zweryfikuj w pinie.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. Producent `tradeRoutes`, `workerFields` i `okolica` w `rust-port/engine/src/domain/overlays_view.rs`. Stan tras: w `PlayableState` albo jako wejście wołającego (wybierz zgodnie z tym, jak web trzyma trasy; decyzję zapisz w raporcie).
2. `collect_worked_hex_owner_map` z epoką per właściciel i kolejnością `Map` (wariant NOWY obok istniejącego; stary zostaje dla ekonomii) w `rust-port/engine/src/domain/okolica/sasiedztwo.rs`.
3. Okolica z `resolve_worked_tiles` i plonem z epoką właściciela.
4. Popraw nieaktualne numery linii w komentarzach `okolica/sasiedztwo.rs` do pinu `07d2fbd72` (`collectWorkedHexOwnerMap`, `collectWorkedHexKeysForOwner`, `computeLostToNearerSiblingByCity`) — wartości z recon są w wierszu 1F4.
Kształt DTO z P4-1F1 używaj bez zmian. Nie dotykaj `PlayableState` poza tym, co wymaga stan tras.

## WEKTORY / TESTY
- `collectWorkedHexOwnerMap` z `eraForOwner` dla 2 właścicieli w różnych epokach (różny ranking pól);
- spór sąsiadów tego samego właściciela;
- filtr tras: `brak_polaczenia`, trasa AI↔AI, brak miasta.
Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy: `rust-port/engine/tests/view_overlays_trade_workers*.rs` (NOWE).
Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) epoka globalna zamiast per właściciel; (b) kolejność `Map` zamieniona na zwykły `Vec` bez porządku wstawiania; (c) trasa AI↔AI przepuszczona przez filtr.

## NIE ROBIĆ
- Nie zmieniaj stałego wariantu `collect_worked_hex_owner_map` używanego przez ekonomię.
- Nie ruszaj `renderer/` (adapter nakładek: P4-1G Q5, #236 / PRIO-3D-1).
- Nie zmieniaj `gra/`.
- Uwaga: równolegle biegnie P4-1F3 (`R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW`) na `overlays_view.rs` i `playable.rs`. Konflikt rozwiązuje orkiestrator przy integracji — nie cofaj zmian 1F3 w swojej gałęzi.

## ALLOWLISTA
- `rust-port/engine/src/domain/overlays_view.rs`
- `rust-port/engine/src/domain/okolica/sasiedztwo.rs` (tylko nowa funkcja obok istniejącej i komentarze z numerami linii)
- `rust-port/engine/src/domain/playable.rs` i `save_load.rs` — TYLKO jeśli stan tras wymaga pola w `PlayableState` (z `#[serde(default, skip_serializing_if)]`; uzasadnij w raporcie)
- `rust-port/engine/src/domain/mod.rs` — TYLKO wpisy `pub mod`, jeśli brakuje
- `rust-port/engine/tests/view_overlays_trade_workers*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką sprawdź `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
