# DISPATCH R-RUSTPORT-P4-1-R6-REVOLT-COUNT (runda 1) — sprite buntu i licznik jednostek na heksie miasta (R6 kontraktu P4-1, renderer 3D)

DOMENA: renderer 3D (grafika Rust), sprite buntu miasta i licznik jednostek. MODEL: OPUS we wszystkich rolach (grafika Rust, 3D).
BAZA: `origin/rust-port/parity-v2` = `68b2a6633`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/render/cities.ts`: `_syncRevolt` (ok. linia 815), wywołania z `getRevolt` (ok. linie 541, 586). Lokalizacje: `git grep -n "_syncRevolt\|getRevolt\|getUnitCountOnHex" 07d2fbd72 -- gra/src` — nie zgaduj ścieżek.
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — §4, wiersz R6. Przeczytaj w całości.
DTO (już w view-model): `cities[].revolt` (bool) i `unit_count_on_hex` (u32) — `rust-port/view-model/src/owners.rs` (ok. linie 179–186). Adapter `rust-port/renderer/src/view/cities.rs` (Q3) je czyta; komentarz tam: „no renderer consumer, R6”. Istniejący model: `rust-port/renderer/src/models/cities/renderer.rs` (wzmianka o sprite buntu, „not ported”) i `raster/atlas/upload.rs` (T1, 🔥 revolt, `cities.ts:718`).

## DECYZJE (podjęte przez orkiestratora)
- D-DTO-1 = A: producent w engine (bunt i licznik liczy engine, DTO je niesie). Renderer tylko pokazuje sprite i liczbę. Zero reguł gry w rendererze.
- Stan buntu z DTO, nie z pinu: nie wnioskuj buntu w rendererze.

## ZAKRES
1. Integrator w nowym module `rust-port/renderer/src/cities/revolt/` (NOWY): `sync_revolt(city_id, parent, show)` — sprite buntu pokazywany gdy `revolt == true`, pozycja i skala z pinu `_syncRevolt`, wywoływany dla każdego miasta z DTO.
2. Licznik jednostek na heksie miasta: wejście z `unit_count_on_hex`, renderowany jak w pinie (tekst/ikona licznika), wartość 0 = brak licznika (sprawdź pin).
3. Test: fixture z miastami (bunt tak/nie, liczniki 0 i >0) — widoczność sprite, wartość licznika, pozycja względem heksu; mutacje poniżej.

## ALLOWLISTA
- `rust-port/renderer/src/cities/revolt/**` (NOWE)
- `rust-port/renderer/src/cities/mod.rs` — TYLKO deklaracja `pub mod revolt;` i re-eksport
- `rust-port/renderer/tests/cities_revolt_*.rs` (NOWE), `rust-port/renderer/tests/fixtures/cities_revolt/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R6-REVOLT-COUNT/**`

## NIE ROBIĆ
- Nie zmieniaj `rust-port/view-model/**`, `rust-port/engine/**`.
- Nie zmieniaj `view/cities.rs`, `models/cities/renderer.rs`, `raster/atlas/upload.rs` poza importem.
- Nie dotykaj `cities/overlay/**` (plakietki R5 w toku), `cities/sync/**` (R5), `rivers/**` (R3), `decor/**` (R2), `map_units/**` (R1), `view/overlays.rs` (Q5).
- Nie zmieniaj `gra/`.

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) sprite buntu pokazany dla `revolt == false`; (b) licznik pokazany dla 0; (c) pozycja sprite przesunięta o oś Y z pinu.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL.
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R6-REVOLT-COUNT/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
