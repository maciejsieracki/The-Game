# DISPATCH R-RUSTPORT-P4-1-R5-CITY-CHIPS (runda 1) — plakietki miast na mapie (R5 kontraktu P4-1, renderer 3D)

DOMENA: renderer 3D (grafika Rust), plakietki (stat chips) miast. MODEL: OPUS we wszystkich rolach (grafika Rust, 3D).
BAZA: `origin/rust-port/parity-v2` = `dd9a1b4e7`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`. Lokalizacje: `git grep -n "syncStatChips\|_buildBadgeInput\|_cityRenderOpts" 07d2fbd72 -- gra/src` (wywołania `main.ts:14563`, `:32265–32269`; budowa wejścia w `render/cities.ts`). Nie zgaduj ścieżek.
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — §4, wiersz R5 (plakietki miast: `CityRenderer.syncStatChips`, pole `cities[].badge`). Przeczytaj w całości.
ISTNIEJĄCE: `rust-port/renderer/src/cities/overlay/stat_chip.rs` (`CityMapBadgeInput`, `city_map_badge_key`, `CityMapBadgeAssets`) i adapter `rust-port/renderer/src/view/cities.rs` (CityBadgeDto → CityMapBadgeInput, Q3). DTO: `rust-port/view-model/src/owners.rs` (`CityBadgeDto`), `cities[]` w `root.rs`.

## DECYZJE (podjęte przez orkiestratora)
- D-DTO-1 = A: producent w engine, renderer tylko buduje geometrię i klucze plakietek. Zero reguł gry w rendererze.
- Plakietki (stat chips) budowane z `badge` DTO; widoczność (fog, panel miasta) z DTO/`MapUiState` — nie zgaduj.

## ZAKRES
1. Nowy moduł `rust-port/renderer/src/cities/sync/` (NOWY): integrator `sync_stat_chips(cities, opts)` — dla listy miast buduje plakietki z `CityMapBadgeInput`, klucze `city_map_badge_key`, kolejność jak w pinie.
2. Opcje renderu plakietek jak `_cityRenderOpts` (pin): widoczność per miasto, ukrycie przy fog/panelu — wejścia z DTO lub `MapUiState`, bez zgadywania.
3. Test: fixture z kilkoma miastami (właściciel, badge, fog) — liczba plakietek, klucze, kolejność; mutacje poniżej.

## ALLOWLISTA
- `rust-port/renderer/src/cities/sync/**` (NOWE)
- `rust-port/renderer/src/cities/mod.rs` — TYLKO deklaracja `pub mod sync;` i re-eksport
- `rust-port/renderer/tests/cities_sync_*.rs` (NOWE), `rust-port/renderer/tests/fixtures/cities_sync/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R5-CITY-CHIPS/**`

## NIE ROBIĆ
- Nie zmieniaj `rust-port/view-model/**`, `rust-port/engine/**`.
- Nie zmieniaj `cities/overlay/stat_chip.rs`, `cities/overlay/okolica.rs`, `view/cities.rs` (Q3 zamknięte) poza importem.
- Nie zmieniaj `view/overlays.rs`, `map_units/**`, `rivers/**` (inne tematy w toku).
- Nie zmieniaj `gra/`.

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) plakietka miasta obcego widoczna mimo fog; (b) kolejność miast odwrócona; (c) klucz `city_map_badge_key` zastąpiony stałym.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL.
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R5-CITY-CHIPS/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
