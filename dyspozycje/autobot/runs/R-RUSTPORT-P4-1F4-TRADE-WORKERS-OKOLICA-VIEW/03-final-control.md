# R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW — Final Control, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW
GOAL: producent nakladek tradeRoutes, workerFields, okolica + collectWorkedHexOwnerMap z epoka per wlasciciel
      i kolejnoscia Map (nowy wariant obok wariantu ekonomii), wg pinu 07d2fbd72
ZMIANY/COMMIT: oceniany kod c1d82932040be816adc796befa180b18c0020b56 (kod 22d34d1b0), baza 585bb48e0
               (origin/rust-port/parity-v2, przodek potwierdzony merge-base --is-ancestor); FC dopisuje tylko ten plik
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; pelny cargo test --all-targets --no-fail-fast
       (partiami, kazda EXIT 0): 3656 passed, 0 failed, 1 ignored (istniejacy przed tematem
       p6_order_lane::e2e::dump_tick1_econ_for_web_generator, plik spoza diffu); test tematu 7/7;
       mutacje (a) i (c) odtworzone przez FC -> FAIL
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (konflikt z P4-1F3 na overlays_view.rs / mod.rs -> pelna bramka po merge)
DEPLOY/PUSH: NIE WYKONANO
```

## Srodowisko

Worktree detached na `c1d82932`. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` w scratchpadzie sesji (poza repo), usuniety po bramkach. `df -h /` przed bramka: 9,7 GB wolne
(>= 8 GB); po usunieciu targetu 8,5 GB.

## Allowlista (zweryfikowana samodzielnie)

`git diff --stat 585bb48e0 c1d82932`: `domain/overlays_view.rs` (NOWY, +297), `okolica/sasiedztwo.rs` (+50/-3: nowa
`collect_worked_hex_owner_map_by_owner_yield` + komentarze numerow linii; cialo `collect_worked_hex_owner_map`
ekonomii bez zmian), `domain/mod.rs` (+1 `pub mod overlays_view;`), `tests/view_overlays_trade_workers.rs` (NOWY),
`dyspozycje/autobot/runs/<ID>/**` (raport, generator, wektory). Brak zmian w `gra/`, `renderer/`, `playable.rs`,
`save_load.rs`; `Cargo.lock` nie zacommitowany. `git diff --check` czysty. Brak `#[ignore]`/`should_panic` w tescie tematu.

## Bramki (odtworzone przez FC)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib --bins --examples --benches` | 124 + 4 passed |
| `cargo test --test` partia 1 (173 plikow) | 1399 passed, 0 failed, EXIT 0 |
| partia 2 (157 plikow) | 1047 passed, 0 failed, 1 ignored (istniejacy), EXIT 0 |
| partia 3 (162 pliki, w tym `view_overlays_trade_workers` 7/7) | 1082 passed, 0 failed, EXIT 0 |

Uwaga: jednorazowy `cargo test --all-targets` nie miesci sie w limicie 590 s polecenia (kompilacja + przebieg),
dlatego partie obejmuja wszystkie 492 pliki `tests/*.rs` oraz lib/benches. Roznica wobec liczby Operatora (3661)
wynika ze sposobu liczenia; zero porazek w kazdej partii.

## Zgodnosc z pinem 07d2fbd72 (przeglad FC)

- `refreshTradeRoutesOverlay` (`main.ts:15379-15397`): przelacznik, `isCityPanelOpen`, pusta lista, `new Map`
  (ostatni wygrywa), `status === 'polaczony'`, literal `0` dla obu stron, brak miasta — 1:1.
- `refreshWorkerFieldOverlay` (`main.ts:15432-15448`) + `collectWorkedHexOwnerMap` (`okolica.ts:811-834`): plon per
  `city.ownerId`, `lost` raz dla listy, `byKey.set` (nadpisanie w miejscu, nowy klucz na koncu) — 1:1.
- `syncOkolicaOverlay` (`main.ts:6644-6666`) + `okolicaWorkedKeySet` (`:6625-6635`) + `siblingClaimedHexKeysForCity`
  (`:5701-5703`): panel, `cities.find`, `isMe`, `cityRangeForPopulation`, `excludeHexKeys`, epoka wlasciciela,
  `showYields: true`, `ownerId` miasta — 1:1.

## Mutacje (FC odtworzyl 2 z 3 wymaganych; zrodlo przywrocone, `cmp` OK)

| Mutacja | Wynik |
|---|---|
| (a) `era_for_owner(ui.viewer_owner_id)` zamiast `(owner)` | FAILED `workers_era_per_owner_matches_pin` |
| (c) `if false && ...` w filtrze AI<->AI | FAILED `trade_gates_match_pin`, `trade_filter_matches_pin` |
| (b) | odtworzona przez Evaluatora (FAILED `owner_map_keeps_js_map_insertion_order`), FC nie powtarzal |

## Zarzuty i orzeczenia

1. Evaluator uwaga 1 — `okolica.yields` dla kazdego heksa zasiegu, filtr etykiet w rendererze web
   (`cityOkolicaOverlay.ts:283-296`). ODDAL (zgodne z decyzja Z-1F4-3; filtr nalezy do P4-1G Q5 #236/#269 —
   orkiestrator ma go wpisac w dispatch Q5).
2. Evaluator uwaga 2 — filtr `Morze`/`Gory` w `buildWorkerFieldOverlayGroup`. ODDAL (jw., zakres renderera Q5).
3. Evaluator uwaga 3 — brak pelnego testu u Evaluatora. ODDAL (FC odtworzyl pelny przebieg: 0 failed).
4. Evaluator uwaga 4 — producent bez wolajacego produkcyjnego. ODDAL (poza zakresem dispatchu; NIE_ZMIERZONO
   end-to-end, do wpiecia w osobnym temacie).
5. FC: lokalna galaz `wip/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW-poprawka` (`aaaeef96a`, „bez bramek")
   dodaje `by_key.sort()` w `collect_worked_hex_owner_map_by_owner_yield` — to zniszczyloby kolejnosc `Map` weba
   (dokladnie mutacja (b)). Nie jest przedmiotem oceny. ODDAL dla werdyktu; ostrzezenie dla orkiestratora:
   integrowac `c1d82932`, NIE `aaaeef96a`.

Brak zarzutow NAPRAW. Brak pozycji DO DECYZJI CZLOWIEKA.

## Werdykt

PASS-WITH-NOTES — kryteria konca 1–5 dispatchu spelnione na `c1d82932`.
