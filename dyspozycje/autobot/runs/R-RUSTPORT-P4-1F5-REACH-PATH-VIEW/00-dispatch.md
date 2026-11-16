# DISPATCH R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (runda 1) — zasięg ruchu i trasa marszu dla nakładek (P4-1F5 / PRIO-3D-5, #273 · #242)

DOMENA: DTO nakładek + zasięg/trasa (engine, view-model). MODEL: OPUS we wszystkich rolach (seria P4-1; zasada właściciela dla tematów 3D).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `585bb48e0` (zawiera P4-1F1 `8ecf01c2c`, P4-1H `preview_path` i `move_unit`). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` §4 (wiersz 1F5) — `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md`.
Lokalizację funkcji w pinie ustal przez `git grep -n "reachableWithMergeTargets\|occupiedForMove\|passThrough\|foreignCityHexKeys\|marchPathPlan\|plan_path_turns\|apply_fog_to_path_plan\|canJoinStackAt" 07d2fbd72 -- gra/src` — NIE zgaduj ścieżek.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `reachable` w `rust-port/engine/src/domain/overlays_view.rs`: `reachableWithMergeTargets` + `occupiedForMove` z `passThrough` + `foreignCityHexKeys`.
2. `pathRoute` z `turnStops` przez `marchPathPlan` = `plan_path_turns` + `apply_fog_to_path_plan`, plan z `planned_marches` (stan z P4-1J).
3. Hover: podpięcie pod `preview_path` z P4-1H (bez zmiany jego kontraktu).
4. `build_move_occupancy` z `passThrough` w `rust-port/engine/src/domain/pathfinding.rs` — tylko jeśli brak.
Kształt DTO (`pathRoute.turnStops`) z P4-1F1 używaj bez zmian.

## WEKTORY / TESTY
- zasięg z własnym stosem w zasięgu → heks dopisany;
- stos pełny (`canJoinStackAt` = false) → heks niedopisany;
- obce miasto blokuje heks;
- przejście przez własne jednostki (`passThrough`);
- trasa wieloturowa (`turnStops`);
- trasa skrócona przez mgłę (`apply_fog_to_path_plan`).
Każdy wektor z `plik:linia` pinu w komentarzu testu. Testy: `rust-port/engine/tests/view_overlays_reach_path*.rs` (NOWE).
Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) `canJoinStackAt` pominięte (stos pełny dopisany); (b) `passThrough` wyłączone (własne jednostki blokują); (c) `turnStops` bez przeliczenia po mgle.

## NIE ROBIĆ
- Nie zmieniaj kontraktu `preview_path` ani `move_unit` (P4-1H).
- Nie ruszaj `renderer/` (adapter: P4-1G Q5/Q6, PRIO-3D-1/2).
- Nie wdrażaj mgły jako decyzji (P4-1C, #253 — reguła wg webu, bez zmian w tym temacie).
- Nie zmieniaj `gra/`.
- Uwaga: równolegle biegną P4-1F3 (1F3, `overlays_view.rs`, `playable.rs`) i P4-1F4 (1F4, `overlays_view.rs`). Konflikty rozwiązuje orkiestrator przy integracji — nie cofaj cudzych zmian.

## ALLOWLISTA
- `rust-port/engine/src/domain/overlays_view.rs`
- `rust-port/engine/src/domain/pathfinding.rs` — TYLKO `build_move_occupancy` / `passThrough`, jeśli brak
- `rust-port/engine/src/domain/mod.rs` — TYLKO wpisy `pub mod`, jeśli brakuje
- `rust-port/engine/tests/view_overlays_reach_path*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW/**`

## KRYTERIA KOŃCA
1. Wszystkie punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką sprawdź `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
