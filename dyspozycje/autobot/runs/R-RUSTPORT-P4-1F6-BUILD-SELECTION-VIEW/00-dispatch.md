# DISPATCH R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW (runda 1) — podświetlenie budowy i zaznaczenie dla nakładek (P4-1F6 / PRIO-3D-6, #274 · #243)

DOMENA: DTO nakładek (engine, view-model). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `05b872fc5` (zawiera P4-1F1 `8ecf01c2c` i integrację EXEC-T1). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` §4 (wiersz 1F6) — `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md`.
Lokalizację w pinie ustal przez `git grep -n "refreshBuildHighlight\|canFoundPlayerCityAt\|isInStartReveal" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `buildHighlight` w `rust-port/engine/src/domain/overlays_view.rs`: 4 tryby wg `refreshBuildHighlight` z pinu (kopalnia złoża → `Mine`, cud → wariant cudu, ulepszenie, założenie miasta).
2. Filtr cofania w turze: decyzja techniczna (w producencie albo w rendererze). Kontrakt §3.7 mówi „producent” — domyślnie w producencie; zapisz wybór w raporcie.
3. `selection` z `UiState` (pole zaznaczenia przekazywane do producenta, bez zmiany kształtu DTO z P4-1F1).
4. Brakujący port: `canFoundPlayerCityAt` i `isInStartReveal` (w pinie: `gra/src/game/first-player-city.ts`, `isHexInStartReveal` ok. l.23–46). W Rust NIE MA ich (wiersz recon: „BRAK”). Port jako NOWY moduł `rust-port/engine/src/domain/start_reveal.rs` z testami wektorowymi. Jeśli port wymaga więcej niż ten moduł — zgłoś BLOCK z opisem zakresu, nie rozszerzaj allowlisty samodzielnie.

## WEKTORY / TESTY
- kopalnia złoża → `Mine`;
- cud → wariant cudu (nie ulepszenie);
- ulepszenie po cofnięciu w turze → heks odjęty z podświetlenia;
- założenie miasta poza `isInStartReveal` → pominięte;
- `isHexInStartReveal` na granicy promienia (dystans = `startRevealRadius`).
Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy: `rust-port/engine/tests/view_overlays_build*.rs` (NOWE), `rust-port/engine/tests/start_reveal*.rs` (NOWE).
Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) kopalnia mapowana na ulepszenie; (b) `isInStartReveal` z dystansem `<` zamiast `<=`; (c) cofnięcie w turze nie odejmuje heksu.

## NIE ROBIĆ
- Nie zmieniaj kształtu DTO z P4-1F1 (`BuildHighlightKind` już rozdzielony).
- Nie ruszaj `renderer/` (adapter: P4-1G Q6, #237 / PRIO-3D-2).
- Nie wdrażaj mgły jako decyzji (#253 — reguła wg webu, nie w tym temacie).
- Nie zmieniaj `gra/`.
- Uwaga: równolegle biegną inne tematy 3D na `overlays_view.rs` (1F3, 1F4, 1F5). Konflikty rozwiązuje orkiestrator przy integracji — nie cofaj cudzych zmian.

## ALLOWLISTA
- `rust-port/engine/src/domain/overlays_view.rs`
- `rust-port/engine/src/domain/start_reveal.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO wpisy `pub mod`
- `rust-port/engine/tests/view_overlays_build*.rs` (NOWE), `rust-port/engine/tests/start_reveal*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie.
3. Przed bramką engine sprawdź `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
4. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
5. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW/`.
6. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
