# DISPATCH R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT (runda 1) — rozmieszczenie dekoru terenu i lasu (R2 kontraktu P4-1, renderer 3D)

DOMENA: renderer 3D (grafika Rust), dekor terenu i las per heks. MODEL: OPUS we wszystkich rolach (grafika Rust, 3D).
BAZA: `origin/rust-port/parity-v2` = `dd9a1b4e7`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/main.ts` i `gra/src/render/scene.ts`. Lokalizacje: `git grep -n "syncForestForUnits\|hideDecorAtHex\|setFog" 07d2fbd72 -- gra/src` (wywołania `main.ts:2173`, `:14562`, `:4312`, `:5264`, `:16158`; `scene.ts:1730`, `:2347-2348`, `:3164`, `:3172`). Nie zgaduj ścieżek.
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — §4, wiersz R2. Przeczytaj w całości.
ISTNIEJĄCE: moduły `rust-port/renderer/src/decor/` (forest, jungle, desert, meadow, relief, terraces, river_lod, style, parts, object) — to budowniczowie modeli; brakuje warstwy rozmieszczania per heks. DTO: `HexDynDto.nakladka` (`rust-port/view-model/src/map.rs`), `ukrycie` wg `hideDecorAtHex` (miasto, cud, plac budowy).

## DECYZJE (podjęte przez orkiestratora)
- D-DTO-1 = A: producent w engine; renderer tylko rozmieszcza modele. Zero reguł gry w rendererze.
- Ukrycie dekoru (`hideDecorAtHex`) wynika z DTO (miasto, cud, plac); nie zgaduj z UI.

## ZAKRES
1. Nowy moduł `rust-port/renderer/src/decor/placement/` (NOWY): integrator `sync_forest_for_units(hex_keys)` (las pod jednostkami) i `hide_decor_at_hex(hex)` — stan per heks, odpowiednik `syncForestForUnits` i `hideDecorAtHex` z pinu.
2. Rozmieszczenie dekoru per heks wg `nakladka` (las/dżungla) z DTO, z pominięciem heksów ukrytych.
3. Test: fixture z kilkoma heksami (las, dżungla, miasto, cud) — liczba instancji, ukrycia, kolejność.

## ALLOWLISTA
- `rust-port/renderer/src/decor/placement/**` (NOWE)
- `rust-port/renderer/src/decor/mod.rs` — TYLKO deklaracja `pub mod placement;`
- `rust-port/renderer/tests/decor_placement_*.rs` (NOWE), `rust-port/renderer/tests/fixtures/decor_placement/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT/**`

## NIE ROBIĆ
- Nie zmieniaj `rust-port/view-model/**`, `rust-port/engine/**`.
- Nie zmieniaj istniejących plików `decor/forest.rs`, `decor/jungle.rs`, `decor/river_lod.rs` poza importem.
- Nie dotykaj `cities/**`, `view/overlays.rs`, `map_units/**`, `rivers/**` (inne tematy w toku).
- Nie zmieniaj `gra/`.

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) dekor pod miastem nie ukryty; (b) las pod jednostką pominięty; (c) kolejność instancji odwrócona.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL.
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.

## DODATEK r2 (po BLOCK r1; BAZA = commit r1 `47f491508`, kod już jest)

Runda 1 dała BLOCK: kod i testy `decor_placement_scene` są poprawne (9/9), ale strażnik `tests/decor_web_parity.rs:1702-1718` (`decor_sources()`, z P4-17) zakłada brak podkatalogów w `decor/` i wywala 2 testy (`decor_uses_jsmath_not_platform_libm`, `decor_reuses_core_instead_of_copies`). Decyzja orkiestratora: wariant A.

Zmiany r2 (BAZA: `47f491508`, worktree detached na nim):
1. ALLOWLISTA rozszerzona o `rust-port/renderer/tests/decor_web_parity.rs` — WYŁĄCZNIE funkcja `decor_sources()` (zamiana na skan rekursywny katalogu `decor/`, bez osłabiania asercji, z zachowaniem `assert out.len() >= 10`). Żadnych innych zmian w tym pliku.
2. Poprawka numerów linii pinu w komentarzach `tests/decor_placement_scene.rs` i w `decor/placement/mod.rs` (wskazane przez Ewaluatora r1, sprawdzić `git grep -n` w 07d2fbd72): V1 warunek `scene.ts:2348` (nie :2347); V2 `isWarmJungleForestHex` :2354; wariant i obrót dżungli :2355-2356; wariant i obrót lasu :2365-2366; V3 baseY :2349, position/scale :2352-2353.
3. Brak innych zmian. Bramki jak w r1, PEŁNE `cargo test --all-targets --no-fail-fast` musi dać EXIT 0 (w tym `decor_web_parity` 12/12).
4. Commit r2 jako osobny commit na `47f491508`; trailer bez nazwy modelu.
