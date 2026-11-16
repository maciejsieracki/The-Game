# DISPATCH R-RUSTPORT-P4-1-R3-RIVER-RIBBONS (runda 1) — wstęgi rzek na mapie (R3 kontraktu P4-1, renderer 3D)

DOMENA: renderer 3D (grafika Rust), wstęgi rzek. MODEL: OPUS we wszystkich rolach (grafika Rust, 3D).
BAZA: `origin/rust-port/parity-v2` = `0e04a75c6`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/render/scene.ts` — wstęgi rzek: linie ok. 800, 1263–1318, 2860+. Lokalizacje potwierdź: `git grep -n -i "rzek\|river" 07d2fbd72 -- gra/src/render/scene.ts` (nie zgaduj ścieżek).
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — §4, wiersz R3. Przeczytaj w całości.
DTO (już w engine i view-model): `river_render_paths` i `rzeka_krawedzie` — `rust-port/engine/src/domain/map_view.rs` (`river_render_paths`, ok. linia 242), `rust-port/engine/src/domain/map_snapshot.rs` (`rzeka_krawedzie`), `rust-port/view-model/src/map.rs`. Kształt DTO używaj bez zmian.

## DECYZJE (podjęte przez orkiestratora)
- D-DTO-1 = A: DTO liczy producent w engine; renderer tylko buduje geometrię ze wstęg. Zero reguł gry w rendererze.
- Renderer nie czyta stanu gry ani pinu w runtime — tylko DTO.

## ZAKRES
1. Nowy moduł `rust-port/renderer/src/rivers/` (sprawdź w `lib.rs`, że nazwa jest wolna; `decor/river_lod.rs` to LOD, nie wstęgi — nie zmieniaj go).
2. Port budowy wstęg rzek z pinu `scene.ts` (ok. 1263–1318) z `river_render_paths` i `rzeka_krawedzie`: geometria wstęgi, kolor wody (stała z pinu), krawędzie per heks.
3. Test: fixture DTO z kilkoma wstęgami; liczba segmentów, kolejność punktów, kolory zgodne z pinem.

## ALLOWLISTA
- `rust-port/renderer/src/rivers/**` (NOWE)
- `rust-port/renderer/src/lib.rs` — TYLKO deklaracja `pub mod rivers;`
- `rust-port/renderer/tests/rivers_*.rs` (NOWE), `rust-port/renderer/tests/fixtures/rivers/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R3-RIVER-RIBBONS/**`

## NIE ROBIĆ
- Nie zmieniaj `rust-port/view-model/**`, `rust-port/engine/**` (DTO bez zmian).
- Nie zmieniaj `renderer/src/view/**`, `battle/**`, `cities/**`, `decor/river_lod.rs`, `map_units/**` (R1 w toku).
- Nie dodawaj adaptera DTO → wejście (to osobny temat w `view/`).
- Nie zmieniaj `gra/`.

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) kolejność punktów wstęgi odwrócona; (b) kolor wody zmieniony na stały inny; (c) krawędź heksa pominięta.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL.
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R3-RIVER-RIBBONS/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
