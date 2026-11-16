# DISPATCH R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS (runda 1) — adapter nakładek (PRIO-3D-1 / #269)

DOMENA: adapter DTO → wejścia renderera (renderer, grafika). MODEL: OPUS we wszystkich rolach (grafika Rust).
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/**`. Lokalizacje: `git grep -n "buildTerritoryBorderGroup\|refreshTradeRoutesOverlay\|relationColorFn\|RELATION_BORDER_COLOR" 07d2fbd72 -- gra/src` — nie zgaduj ścieżek.
KONTRAKT: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` — §7, wiersz Q5 (tabela), wiersze L4 i D-DTO-1. Przeczytaj w całości przed kodem.
ŹRÓDŁO DTO: `rust-port/view-model/src/overlays.rs` (`OverlaysViewDto`, `TradeRouteDto`, `OkolicaViewDto`, `WorkerFieldDto`, `BuildHighlightDto`, `PathRouteDto`).

## DECYZJE (podjęte przez orkiestratora; zapisane w rejestrze)
- D-DTO-1 = A (ratyfikowane w kontrakcie P4-1): DTO liczy producent w engine; adapter tylko tłumaczy typy. Zero reguł gry w adapterze.
- L4 (stan UI) = osobny parametr adaptera `MapUiState` (kontrakt D-CMD-12): `territoryBorderVisible`, `showTradeRoutesOverlay`, `showWorkerOverlay`, `isCityPanelOpen`, `cityPanelViewCityId`, `forceVisibleUnitId`, `hideStatChips`. Adapter przyjmuje je jako wejście, nie zgaduje.
- Zmiany kontraktu L6/L7 (view-model) NIE wchodzą w ten temat. Jeśli brakuje pola w DTO — zgłoś BLOCK z numerem L6/L7, nie zmieniaj `rust-port/view-model/**`.

## ZAKRES (wiersz Q5 kontraktu)
1. Terytorium: `relation_color_fn` + stałe `RELATION_BORDER_COLOR_*` (pin `gra/src/game/civ-visual.ts:84-86`), grupy obramowań z `by_owner`.
2. Zasięgi: spłaszczenie per właściciel do jednego `HexKeySet` (zgodnie z kontraktem §3.6 — filtr mgły robi producent).
3. Szlaki handlowe (`TradeRouteOverlayInput`, `build_trade_routes_overlay_group`).
4. Okolica i pola robotników (`OkolicaMap`, `OkolicaViewDto`, `WorkerFieldDto`).
5. `Mine` (kopalnia) z `BuildHighlightDto`.
6. Oblężenia: `SiegeMarkerSyncOptions` + `camp_owner_by_hex` z `units[]` (top_y przez `TerrainPickScene::top_y_at` z Q2, bez zależności od R1).
7. Parametr `MapUiState` (L4) — jedno miejsce wejścia dla bramek przełączników.

## ALLOWLISTA
- `rust-port/renderer/src/view/overlays.rs` (NOWY)
- `rust-port/renderer/src/view.rs` — TYLKO deklaracja `pub mod overlays;` i re-eksport
- `rust-port/renderer/tests/view_adapter_overlays.rs` (NOWY)
- `rust-port/renderer/tests/fixtures/**` (NOWE, tylko dla tego testu)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS/**`

## NIE ROBIĆ
- Nie zmieniaj `rust-port/view-model/**` (L6/L7 osobno), nie zmieniaj `rust-port/engine/**`.
- Nie zmieniaj `renderer/src/view/terrain.rs`, `cities.rs`, `battle.rs`, `convert.rs`, `fog.rs` (Q1–Q4 zamknięte).
- Nie dodawaj tokenów jednostek (R1) ani `units.rs` (Q6, osobny temat).
- Nie zmieniaj `gra/`.

## WEKTORY / TESTY
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Porównanie z wejściem „jak web”: te same DTO co w istniejących testach parytetu Q2/Q3.
- Test `MapUiState`: każdy przełącznik wyłączony → brak odpowiadającej grupy; włączony → jest.
- Test zasięgów: dwa właściciele, ten sam heks w dwóch zasięgach → jeden wpis w `HexKeySet` per właściciel zgodnie z kontraktem.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) kolor relacji zamieniony na stały; (b) bramka `territoryBorderVisible` pominięta; (c) szlak medium `Land`↔`Sea` zamienione.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; testy zielone; mutacje FAIL.
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
