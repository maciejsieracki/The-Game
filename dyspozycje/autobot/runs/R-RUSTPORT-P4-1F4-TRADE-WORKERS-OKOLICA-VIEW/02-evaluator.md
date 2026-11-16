# R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW — Evaluator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW
GOAL: producent nakladek tradeRoutes, workerFields, okolica + collectWorkedHexOwnerMap z epoka per wlasciciel
      i kolejnoscia Map (nowy wariant obok wariantu ekonomii), wg pinu 07d2fbd72
ZMIANY/COMMIT: oceniany kod c1d82932040be816adc796befa180b18c0020b56 (kod 22d34d1b0 + raport/generator/wektory);
               baza 585bb48e0 (origin/rust-port/parity-v2), Evaluator dopisuje tylko ten plik
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib 124/124 (EXIT 0);
       cargo test --test view_overlays_trade_workers 7/7 (EXIT 0); regeneracja wektorow z pinu = bajt w bajt;
       4 mutacje -> FAIL (EXIT 101)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control r1
DEPLOY/PUSH: NIE WYKONANO
```

## Srodowisko

- Galaz robocza Evaluatora `wip/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW-ev-r1` od `c1d82932`.
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie sesji
  (poza repo), usuniety po bramkach. `df -h /` przed bramkami: 14 GB wolne, przed testami 13 GB (>= 8 GB).

## Allowlista

`git diff --stat 585bb48e0 c1d82932`: `overlays_view.rs` (NOWY), `okolica/sasiedztwo.rs` (+50/-3: nowa funkcja
`collect_worked_hex_owner_map_by_owner_yield` + 3 komentarze linii; cialo `collect_worked_hex_owner_map`
ekonomii BEZ zmian), `domain/mod.rs` (tylko `pub mod overlays_view;`), `tests/view_overlays_trade_workers.rs`
(NOWY), `dyspozycje/autobot/runs/<ID>/**`. Brak zmian w `gra/`, `renderer/`, `playable.rs`, `save_load.rs`,
`Cargo.lock`. Zgodne z allowlista.

## Bramki (odtworzone)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib` | 124 passed, 0 failed |
| `cargo test --test view_overlays_trade_workers` | 7 passed, 0 failed, 0 ignored |
| `#[ignore]` / osłabione asercje | brak (asercje `assert_eq!` na pelnych listach + `assert_ne!` kontrolne) |

Pelnego `cargo test --all-targets` NIE odtwarzano (zakres zadania Evaluatora: lib + test dispatchu; zmiana jest
addytywna: nowy modul i nowa funkcja, jedyna zmiana w istniejacym kodzie to komentarze). Operator raportuje
pelny przebieg partiami (3661 passed, 0 failed) — NIE_ZMIERZONO przez Evaluatora.

## Wektory z pinu 07d2fbd72

- `git archive 07d2fbd72 gra/src gra/data` -> `node gen_vectors.mjs <WEB_ROOT>`: EXIT 0, wynik `cmp` == zacommitowany
  `vectors.json` (bajt w bajt). Stala `VECTORS` w tescie == `vectors.json` (porownanie po `JSON.parse`).
- Generator wykonuje kod pinu (`okolica.ts` jako modul, wycinki calych funkcji `main.ts` w `with(scope)` z Proxy
  rzucajacym na nieznany identyfikator), nie transkrypcje.
- Numery linii zweryfikowane `git grep -n` na pinie: `collectWorkedHexKeysForOwner` `okolica.ts:782`,
  `collectWorkedHexOwnerMap` `:811`, `computeLostToNearerSiblingByCity` `:859`, `yieldOfMapHex` `:459`;
  `refreshTradeRoutesOverlay` `main.ts:15379-15397`, `refreshWorkerFieldOverlay` `:15432-15448`,
  `syncOkolicaOverlay` `:6644-6666`, `okolicaWorkedKeySet` `:6625-6635`, `siblingClaimedHexKeysForCity` `:5701-5703`.
  Komentarze w `sasiedztwo.rs` poprawione zgodnie z wierszem 1F4 rozpoznania.

## Zgodnosc z webem (przeglad kodu)

- `trade_routes_view`: przelacznik, panel, pusta lista, `new Map` (ostatnie id wygrywa), `status === 'polaczony'`,
  literal `0` (nie `ME()`), brak miasta — 1:1 z `main.ts:15381-15391`.
- `collect_worked_hex_owner_map_by_owner_yield`: plon per `city.ownerId` (`:822`), `lost` raz dla calej listy
  (`:824`), `byKey.set` = nadpisanie bez zmiany pozycji, nowy klucz na koncu (`:831`) — 1:1.
- `okolica_view`: `isCityPanelOpen`, `getOpenCityPanelCityId`, `cities.find`, `isMe`, `cityRangeForPopulation(population)`,
  `okolicaWorkedKeySet` z `excludeHexKeys = lost.get(city.id)`, `showYields: true`, `ownerId` miasta — 1:1.
- Decyzja Z-1F4-1 (trasy jako wejscie wolajacego, web: zmienna modulu `main.ts`) — uzasadniona, `PlayableState` bez zmian.

## Mutacje (odtworzone przez Evaluatora; zrodla przywrocone, `cmp` potwierdza)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| (a) epoka globalna | `worker_fields_view`: `era_for_owner(ui.viewer_owner_id)` zamiast `(owner)` | EXIT 101, FAILED `workers_era_per_owner_matches_pin` |
| (b) Vec bez porzadku `Map` | `Some(_) => by_key.push((t.key, owner))` (duplikat zamiast nadpisania w miejscu) | EXIT 101, FAILED `owner_map_keeps_js_map_insertion_order` |
| (c) AI<->AI przepuszczona | `if false && ...` w filtrze `:15388` | EXIT 101, FAILED `trade_filter_matches_pin`, `trade_gates_match_pin` |
| (d) dodatkowa: okolica bez sporu sasiadow | `exclude_hex_keys: None` w `okolica_view` | EXIT 101, FAILED `okolica_open_city_matches_pin` |

## Zarzuty / uwagi (nieblokujace)

1. `okolica.yields` zawiera wpis dla KAZDEGO heksa zasiegu (Z-1F4-3); web filtruje etykiety (`Morze`/`Gory`, ulepszenie
   kryjace, pusta etykieta) w rendererze `cityOkolicaOverlay.ts:283-296`. Adapter P4-1G Q5 (#236/#269) MUSI ten filtr
   odtworzyc — do wpisania w dispatch Q5, inaczej renderer pokaze etykiety na morzu/gorach.
2. Analogicznie `workerFields`: web `buildWorkerFieldOverlayGroup` (`render/workerFieldOverlay.ts:138-145`) pomija
   `Morze`/`Gory` i heksy spoza `map.hexes`; producent pomija tylko heksy spoza mapy. Przy `isWorkable =
   isLandWorkableHex` wpis morze/gory praktycznie nie powstaje, ale filtr rendera nalezy do P4-1G Q5 — odnotowac tam.
3. Pelny `cargo test --all-targets` nie odtworzony przez Evaluatora (patrz Bramki) — do potwierdzenia przy integracji
   (konflikt z P4-1F3 na `overlays_view.rs`/`mod.rs` i tak wymaga pelnej bramki po merge'u).
4. Wolajacy produkcyjny (zrodlo `&[City]` z polami okolicy, tras, wezlow terytorium z fortami, `empireEpochForOwner`
   w stanie Rust) nie istnieje — producent jest niepodpiety (NIE_ZMIERZONO, poza zakresem; odnotowane przez Operatora).

## Werdykt

PASS-WITH-NOTES — kryteria konca 1–5 dispatchu spelnione (pkt 2 w zakresie lib + test dispatchu odtworzonym przez
Evaluatora); uwagi 1–2 dotycza tematu adaptera P4-1G Q5, 3–4 integracji/wiringu.
