# P6.M06A8 - Lad / morze / korytarze 2 (Pangea: masy, most, zakres ensure)

Temat: R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1. Baza: `origin/rust-port/parity-v2` = `db72e298`
(silnik 1340 testow po zmianach tematu, 1335 przed). Pin web: `edb8fb56`.
Wzorzec: P6-M06A7 (korytarze), P6-M05B (wektory brzegowe).

## Zakres i status symboli (binarne kryterium)

| Symbol web (pin edb8fb56) | Status | Dowod |
|---|---|---|
| `groupDryLandMassKeys` (gen-helpers.ts :4338, prywatna) | PORTOWANY | `landsea.rs::group_dry_land_mass_keys`; test `group_dry_land_mass_keys_matches_web` (418 przypadkow, 0 rozbieznosci) |
| `ensurePangeaSingleContinent` (:4375, export) | PORTOWANY Z HAKIEM (RUNDA-2) | `landsea.rs::ensure_pangea_single_continent`; cialo 1:1; koncowe `fillPangeaAnnularSeaCorridors` przekazywane jako `fill_annular`. Test `ensure_pangea_single_continent_matches_web_with_fill_hook_zero` (418 przypadkow, wynik `converted` i stan kazdego heksa zgodne z webem z fill=0) |
| `isPangeaBridgeWater` (:4371) | DANE-JUZ-W-RUST (M06A7) | `landsea.rs::is_pangea_bridge_water` |
| `morseDepthFromMapBorder` (:4659) | DANE-JUZ-W-RUST (M06A4) | `landsea.rs::morse_depth_from_map_border`. Uwaga: ensure go nie wywoluje; uzywa go dopiero fill (RUNDA-2) |
| `fillPangeaAnnularSeaCorridors` (:4595) | RUNDA-2 | osobne ID (wg dispatchu). Potrzebne do pelnej rownowaznosci `ensurePangeaSingleContinent` |
| `rebalanceLandFractionPangea` (:3667) | RUNDA-2 | osobne ID |
| `rebalanceLandSeaRatio` (:3791) | RUNDA-2 | osobne ID |

Zakres 3186-4374 tego tematu nie zmienil sie w `origin/main` (patrz sekcja "Dryf po pinie").

## Zalozenia (rozstrzygniete bez pytan)

- Z1. Hook `fill_annular` w `ensure_pangea_single_continent` zastepuje wywolanie RUNDA-2. Wywolujacy bez fill podaje `|_, _, _| 0`. Wektory generowane z instrumentowanej kopii web, w ktorej wywolanie fill na koncu `ensurePangeaSingleContinent` zastapiono `0` (generator `gen-m06a8-landsea-vectors.mjs`). Pelna rownowaznosc z webem (z fill) bedzie mozliwa po portowaniu `fillPangeaAnnularSeaCorridors` w osobnym temacie.
- Z2. Klucze niekanoniczne (np. `x,0`) sa w masie (jak w webie), ale nie rozwijaja sasiedztwa (web: `parseHexKey` daje NaN, sasiedzi nie istnieja w `hexes`). Zgodne z ZALOZENIAMI w naglowku `landsea.rs` (M06A). Pokryte przypadkiem brzegowym `brzeg`.
- Z3. Kolejnosc iteracji = kolejnosc wstawiania `HexRecord` (jak `Object.keys`). Sortowanie mas: `js_array_sort_by` (stabilne, jak `Array.prototype.sort`).
- Z4. Literaly danych (skala 20160, baza 16, mnoznik 6, zakres 18..48, 12 iteracji, zapas sciezki +2, minimum masy obcej 60, ulamek 0.25) przeniesione do `rust-port/engine/data/derived/mapgen-landsea-pangea-bridge.json` (accessor `mapgen_landsea_pangea_bridge()` w `derived.rs`). Stale `1`, `0` i struktura petli pozostaja w kodzie.

## Math.* - wykaz miejsc

| Miejsce web | Rust | Uwagi |
|---|---|---|
| `Math.sqrt((w*h)/20160)` (ensure) | `((w as f64)*(h as f64)/skala).sqrt()` | IEEE sqrt, identyczna |
| `Math.max(18, Math.min(48, Math.round(...)))` | `js_max(min, js_min(max, js_round(...)))` | `masks::v8math::{js_max, js_min}`, `improvements::js_round` |
| `Math.max(60, Math.floor(main.length*0.25))` | `js_max(min, (len*0.25).floor())` | dla dodatnich dlugosci floor identyczny |
| `Math.hypot`, `Math.sin/cos/pow/atan2` | NIE DOTYCZY | w zakresie tematu nie wystepuja |

Jadra `k_sin/k_cos/rem_pio2` nie zmieniano.

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1/gen-m06a8-landsea-vectors.mjs` (node 22, loadery `m06a-loader-*.mjs` z M06A7).
- Wektory: `rust-port/engine/tests/p6_m06a8_vectors/ensure-vectors.json` (6.3 MB, 418 przypadkow, zrodlo sha256 w `meta`).
- Rodziny: `losowe` 160 (mapy 3..20, tasowana kolejnosc wstawiania), `granica-mostu` 210 (N-1 / N / N+1 dla kazdej mapy w=h=6..40, dwie szerokosci lądu), `prog-masy` 12 (obca masa T-1 / T / T+1, T = max(60, floor(glowna*0.25)), glowna 30/120/300/330 heksow), `wyspy` 30, `brzeg` 6 (puste, 1x1, niekanoniczny klucz, zerowy wymiar).
- Testy: `rust-port/engine/tests/p6_m06a8_landsea.rs` (5 testow: liczby rodzin; grupowanie zgodne z webem; ensure zgodne z webem; hook fill wywolany dokladnie raz z wymiarami mapy i dodany do `converted`; granica mostu N-1/N/N+1 rozroznialna).
- Trafienia graniczne: przypadki `granica-mostu` ustawiaja pas wody dokladnie na N-1, N, N+1 (BFS rozwija heks o odleglosci <= N). Rownoczesnie `prog-masy` ustawia rozmiar obcej masy na T-1, T, T+1 (warunek `>` w webie).

## Dowody rownowaznosci i mutacje

NIE ZMIERZONO w tej rundzie (Operator-impl; mutacje i niezalezny weryfikator Python to runda Operator-pomiary wg dispatchu). Testy nie zostaly oslabione.

## Dryf po pinie

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow (40 linii), wszystkie w liniach pin >= 5992. Zakres 3186-4374 i symbole tematu (`:4338`, `:4375`) bez zmian. Pin nie przepinany (zgodnie z dispatchem).

## Nastepne kroki (osobne ID)

- `fillPangeaAnnularSeaCorridors` :4595 (wraz z `pangeaLandCentroid`, `pangeaSeaHexIsAnnularCorridor`) - usunie hak `fill_annular` i odblokuje pelne wektory ensure.
- `rebalanceLandFractionPangea` :3667, `rebalanceLandSeaRatio` :3791.
