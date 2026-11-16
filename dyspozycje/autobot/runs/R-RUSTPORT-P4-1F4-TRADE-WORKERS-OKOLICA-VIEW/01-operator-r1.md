# R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW — raport Operatora, runda 1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW
GOAL: producent nakladek tradeRoutes, workerFields, okolica (DTO z P4-1F1 bez zmian) + collectWorkedHexOwnerMap
      z epoka per wlasciciel i kolejnoscia Map (nowy wariant obok wariantu ekonomii), wg pinu 07d2fbd72
ZMIANY/COMMIT: kod 22d34d1b03d5ae39bc075a15a5e37092d569a585 na galezi wip/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW-r1
               (baza origin/rust-port/parity-v2 = 585bb48e0f926a14435fa96b9402a711095ee16c, zawiera P4-1F1 8ecf01c2c)
TESTY: fmt --check 0; clippy --all-targets -D warnings 0; cargo test: lib 124/124, 492 binarek testowych 0 FAILED,
       benches 4/4 (szczegoly nizej — pojedyncze wywolanie --all-targets przekracza limit 590 s, uruchomione partiami)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i izolacja

- `git fetch origin rust-port/parity-v2` -> `585bb48e0f926a14435fa96b9402a711095ee16c` (= SHA z dispatchu);
  `git merge-base --is-ancestor 8ecf01c2c 585bb48e0` -> prawda (P4-1F1 w bazie).
- Worktree detached na `585bb48e0`, potem galaz robocza `wip/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW-r1`.
- `CARGO_TARGET_DIR` poza repo (scratchpad sesji), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- `Cargo.lock` NIE commitowany (nieśledzony w worktree). Brak zmian w `gra/`, `renderer/`, `playable.rs`, `save_load.rs`.

## Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/overlays_view.rs` | NOWY: `OverlaysWorld`, `OverlaysUi`, `OverlaysViewError`, `trade_routes_view`, `worker_fields_view`, `okolica_view` |
| `rust-port/engine/src/domain/okolica/sasiedztwo.rs` | NOWA `collect_worked_hex_owner_map_by_owner_yield` obok istniejacej; komentarze linii do pinu: `computeLostToNearerSiblingByCity` `:800`->`:859`, `collectWorkedHexKeysForOwner` `:662`->`:782`, `collectWorkedHexOwnerMap` `:690`->`:811`. Cialo `collect_worked_hex_owner_map` (ekonomia) BEZ zmian (dopisany tylko komentarz wskazujacy wariant widoku). |
| `rust-port/engine/src/domain/mod.rs` | `pub mod overlays_view;` |
| `rust-port/engine/tests/view_overlays_trade_workers.rs` | NOWY: 7 testow wektorowych |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW/` | `gen_vectors.mjs` (generator), `vectors.json` (wynik), ten raport |

## Zrodla w pinie (zweryfikowane `git grep`/`git show 07d2fbd72`)

- `collectWorkedHexKeysForOwner` `gra/src/game/okolica.ts:782`, `collectWorkedHexOwnerMap` `:811-834`
  (`yieldOfForOwner` `:822`, `computeLostToNearerSiblingByCity` raz `:824`, `byKey.set` `:831`),
  `computeLostToNearerSiblingByCity` `:859`, `yieldOfMapHex` `:459-477`, `hexKeysWithinRadius` `:66-89`.
- `refreshTradeRoutesOverlay` `gra/src/main.ts:15379-15397` (literal `0` `:15388`); `tradeRoutes` jako zmienna modulu `:3454`.
- `refreshWorkerFieldOverlay` `main.ts:15432-15448`; przelaczniki `showTradeRoutesOverlay` `:15358`, `showWorkerOverlay` `:15419`.
- `syncOkolicaOverlay` `main.ts:6644-6666`, `okolicaWorkedKeySet` `:6625-6635`, `okolicaHexWorkable` `:6617-6623`,
  `siblingClaimedHexKeysForCity` `:5701-5703`, `buildAllTerritoryNodes` `:5667-5678`, `isMe` `:13748-13750`.
- `isCityPanelOpen` / `getOpenCityPanelCityId` `gra/src/ui/cityPanel.ts:12569-12576` (dwa rozne odczyty).
- `collectRangeKeys` `gra/src/render/cityOkolicaOverlay.ts:239-249`, wolanie `yieldOf` `:278-294`.

## Decyzje techniczne

- **Z-1F4-1 (stan tras) — wejscie wolajacego, NIE pole `PlayableState`.** Web trzyma `tradeRoutes` jako zmienna
  modulu `main.ts:3454` (zapis: `save.ts:741`), nie w strukturze miast/mapy. `PlayableState` nie ma tego pola
  (rozpoznanie §3 pkt 4). Dodanie pola wymagaloby migracji zapisu i zderzyloby sie z rownoleglym P4-1F3 na
  `playable.rs`; producent przyjmuje `&[TradeRoute]` (typ `trade.rs:427`). `playable.rs`/`save_load.rs` bez zmian.
- **Z-1F4-2 (miasta):** wejscie `&[City]` (`state.rs`, model ekonomii) — jedyny model z `okolicaFocus/okolicaTryb/
  okolicaReczne` (`PlayableCity` ich nie ma). Id miasta laczone przez zapis dziesietny (konwencja
  `war_world_view.rs:83-84`): `TradeRoute.fromCityId/toCityId` i id panelu (`CityId` DTO) == `City.id`.
- **Z-1F4-3 (`okolica.yields`):** wpis dla kazdego heksa `collectRangeKeys` w kolejnosci `hexKeysWithinRadius`;
  filtr etykiet (`Morze`/`Gory`, ulepszenie kryjace, pusta etykieta) zostaje w rendererze (P4-1G Q5), ktory ma
  teren i `coveringImprovement` z `MapViewDto`. Rozstrzyga NIE_ZMIERZONO z rozpoznania §2 (`okolica.yields`).
- **Z-1F4-4:** `OverlaysUi` niesie oddzielnie `city_panel_open` (`isCityPanelOpen`) i `open_city_id`
  (`getOpenCityPanelCityId`), bo w webie to dwa rozne odczyty.
- **Z-1F4-5:** wspolrzedne miasta `f64` -> `i32` jak `okolica_city_of`.
- Literal `0` w filtrze tras (nie widz) — parytet 1:1 z `main.ts:15388` (rozpoznanie §5 pkt 3, zasada 9);
  test `trade_gates_match_pin` (hot-seat, widz 1) to utrwala.
- Pola robotnikow bez filtra mgly (web tylko przyciemnia sprite'y) — producent nie filtruje.
- `epoka` = `era_for_owner` wolajacego (web `empireEpochForOwner`); plon = `hex_tile_yield(..., Some(era))`
  (`turn_economy_territory.rs:146`), jak `yieldOfMapHex(..., ownerEra)`.

## Wektory (generator wykonuje kod pinu)

`gen_vectors.mjs` laduje `game/okolica.ts` i `units/setup.ts` jako moduly (TS->CJS) oraz wycina CALE funkcje
`main.ts` (`refreshTradeRoutesOverlay`, `refreshWorkerFieldOverlay`, `syncOkolicaOverlay`, `okolicaWorkedKeySet`,
`okolicaHexWorkable`, `siblingClaimedHexKeysForCity`, `buildAllTerritoryNodes`, `isMe`) i `collectRangeKeys`
z `render/cityOkolicaOverlay.ts`; wykonuje je w `with(scope)` z Proxy rzucajacym blad na nieznany identyfikator.
Atrapy tylko dla sceny/three.js (przechwytuja wejscie renderera). Uruchomienie:
`node gen_vectors.mjs <WEB_ROOT z git archive 07d2fbd72 gra/src gra/data>`; wynik `vectors.json` (zwarta kopia
w stalej `VECTORS` testu).

| Test | Wektor | Zrodlo pinu |
|---|---|---|
| `workers_era_per_owner_matches_pin` | 2 wlascicieli, epoki 1 i 3, identyczne otoczenie; wynik `[0,1]->0, [11,0]->1`; kontrolne wywolania pinu z epoka globalna 1/3 daja INNY wynik | `okolica.ts:811-834`, `main.ts:15432-15448` |
| `workers_sibling_dispute_matches_pin` | 2 miasta wlasciciela 0 w odl. 2 + miasto wlasciciela 2 (epoka 1); `lost` miast 5 i 6 rowny pinowi | `okolica.ts:859`, `:824` |
| `owner_map_keeps_js_map_insertion_order` | bez wezlow terytorium heks `3,0` pisany przez 2 miasta: pozycja z 1. zapisu, wlasciciel z ostatniego; kolejnosc != sortowanie | `okolica.ts:831` |
| `okolica_open_city_matches_pin` | miasto 6 (przegrywa spor), miasto 10: `range`, `workedKeys`, `yields` (74 i 46 heksow), `showYields`, `ownerId` | `main.ts:6625-6666`, `cityOkolicaOverlay.ts:239-249` |
| `okolica_absent_cases_match_pin` | miasto obcego fotela -> brak; panel zamkniety; brak `activeCity`; panel otwarty -> brak pol robotnikow | `main.ts:6645-6651`, `:15434` |
| `trade_filter_matches_pin` | `brak_polaczenia`, AI<->AI (x2), brak miasta (x2), zdublowane id (ostatnie wygrywa), AI->gracz przechodzi | `main.ts:15384-15392` |
| `trade_gates_match_pin` | hot-seat (widz 1) = ten sam wynik (literal `0`); panel otwarty; przelacznik wylaczony | `main.ts:15381-15382`, `:15388` |

Brak `#[ignore]`, brak osłabionych asercji.

## Mutacje (skrypt w scratchpadzie, zrodla przywracane po kazdej; `cargo test --test view_overlays_trade_workers`)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| (a) epoka globalna | `worker_fields_view`: `era_for_owner(ui.viewer_owner_id)` zamiast `era_for_owner(owner)` | exit 101, FAILED `workers_era_per_owner_matches_pin` |
| (b1) Vec bez Map | `collect_worked_hex_owner_map_by_owner_yield`: zwykly `push` bez indeksu klucza | exit 101, FAILED `owner_map_keeps_js_map_insertion_order` |
| (b2) kolejnosc sortowana | `by_key.sort()` przed zwrotem | exit 101, FAILED `owner_map_keeps_js_map_insertion_order`, `workers_sibling_dispute_matches_pin` |
| (c) AI<->AI przepuszczona | filtr `:15388` wylaczony (`if false && ...`) | exit 101, FAILED `trade_filter_matches_pin`, `trade_gates_match_pin` |

Po mutacjach: `grep` potwierdza brak sladow (`by_key.sort`, `if false`, `ui.viewer_owner_id)`) w zrodlach.

## Bramki (`rust-port/engine`)

- `df -h /` przed bramkami: 8,7 GB wolne (>= 8 GB); w trakcie testow spadlo do 3,6 GB (cache celu ~3,3 GB + rownolegle tematy).
- `cargo fmt --check` -> EXIT 0 (po `cargo fmt` na wlasnych plikach; `git status` bez zmian poza allowlista).
- `cargo clippy --all-targets -- -D warnings` -> EXIT 0.
- `cargo test --all-targets --no-fail-fast`: pojedyncze wywolanie przekroczylo limit polecenia (2x `timeout 588` -> EXIT 124;
  kompilacja + 255 binarek przeszlo, 0 FAILED). Reszta uruchomiona partiami na tym samym kodzie i celu:
  4 partie `cargo test --no-fail-fast --test ...` (60+60+60+58 binarek) -> EXIT 0 kazda; `cargo test --no-fail-fast
  --benches --bins --examples` -> EXIT 0. Lacznie: lib 124 passed; 492/492 plikow `tests/*.rs` z wynikiem `ok`;
  benches 4 passed; 3661 testow passed, 0 failed. Nowy plik: 7 passed.
- `git diff --check` -> czysto.

## Uwagi dla Evaluatora / orkiestratora

- Rownolegly P4-1F3 tez tworzy/zmienia `overlays_view.rs` i `mod.rs` — konflikt do rozwiazania przy integracji
  (dispatch). Ten temat nie dotyka `playable.rs`.
- Producent nie sklada jeszcze `OverlaysViewDto` (wypelnia tylko pola `trade_routes`, `worker_fields`, `okolica`);
  skladanie calego DTO nalezy do tematu, ktory polaczy 1F2-1F6.
- Wolajacy (wiring do `PlayableState`/sesji) musi dostarczyc: liste tras, `&[City]` z polami okolicy, `BuildMap`,
  wezly terytorium z fortami (`buildAllTerritoryNodes`) i `empireEpochForOwner` — NIE_ZMIERZONO, gdzie te dane
  beda zyly w stanie Rust (rozpoznanie §3 pkt 4-5); poza zakresem tego tematu.
