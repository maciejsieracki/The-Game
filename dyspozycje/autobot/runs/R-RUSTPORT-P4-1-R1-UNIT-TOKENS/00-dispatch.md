# DISPATCH R-RUSTPORT-P4-1-R1-UNIT-TOKENS (runda 1) — renderer żetonów jednostek (R1 kontraktu P4-1 / PRIO-3D-2 zależność)

DOMENA: renderer 3D (grafika Rust), żetony jednostek na mapie. MODEL: OPUS we wszystkich rolach (grafika Rust).
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/render/units.ts` (ok. 6950 linii). Zakres do portu: linie ok. 5787–6747 (`UnitRenderer.sync`, `setHighlight`, `clearHighlight`, `setSelectionHex`, `setPathRoute`, obwódka wodza, `applyGeneralRingLod`, `dispose`). Lokalizacje potwierdź: `git grep -n "class UnitRenderer\|setPathRoute\|applyGeneralRingLod" 07d2fbd72 -- gra/src/render/units.ts`.
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — wiersz R1 (ok. linia 170) i §4. Przeczytaj w całości.
DTO wejściowe (już są): `rust-port/view-model/src/units.rs` (`UnitViewDto`, `StackViewDto`), `rust-port/view-model/src/overlays.rs` (`PathRouteDto`, `BuildHighlightDto`).

## ZAKRES
1. Nowy moduł `rust-port/renderer/src/map_units/` (sprawdź w `lib.rs`, że nazwa jest wolna; `battle/units.rs` to inny moduł).
2. Port `UnitRenderer.sync` (żetony z `UnitViewDto` / `StackViewDto`), `setHighlight`, `clearHighlight`, `setSelectionHex`, `setPathRoute`, obwódka wodza (`applyGeneralRingLod`), `dispose`.
3. Siatki żetonów dla `UnitPickModel.meshes` (`pick/mod.rs:181-189`). Nie portuj `topYAt` (jest w `TerrainPickScene::top_y_at`, `pick/terrain.rs:303-308`) ani `pickUnitIdAt` (jest jako `ray_to_unit`, `pick/mod.rs:190-193`).

## NIE ROBIĆ
- Nie portuj adaptera DTO → wejścia (`view/units.rs`, Q6) — to osobny temat po R1.
- Nie zmieniaj `rust-port/view-model/**`, `rust-port/engine/**`, `battle/**`, `cities/**`.
- Nie zmieniaj `gra/`.
- Nie zmieniaj logiki gry: żetony tylko renderują stan z DTO.

## ALLOWLISTA
- `rust-port/renderer/src/map_units/**` (NOWE)
- `rust-port/renderer/src/lib.rs` — TYLKO deklaracja `pub mod map_units;`
- `rust-port/renderer/tests/map_units_*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R1-UNIT-TOKENS/**`

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Testy na ręcznie zbudowanych `UnitViewDto` / `StackViewDto` (fixture'y w tym teście): liczba żetonów = liczba jednostek w stosie; wódz ma obwódkę; highlight zmienia się po `setHighlight`/`clearHighlight`.
- Test `setPathRoute`: trasa długości n → n-1 segmentów (lub zgodnie z pinem; sprawdź w kodzie).
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) obwódka wodza wyłączona; (b) `clearHighlight` nie czyści; (c) `dispose` nie zwalnia siatek.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL.
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R1-UNIT-TOKENS/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
