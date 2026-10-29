# P6.M06A2 - lad / morze / wybrzeze A, reszta RUNDA-2 (partia 1)

Temat: R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1. Dopisek do M06A: `dyspozycje/rust-port/p6/P6-M06A-LAD-MORZE-WYBRZEZE-A.md` (tylko odsylacz).
Pin webu: `edb8fb56` (`gra/src/map/gen-helpers.ts`). Zakres: wiersze RUNDA-2 z tabeli M06A (linie 3186-4374).

## Stan symboli (binarne kryterium)

| Symbol (web, pin edb8fb56) | Status | Dowod |
|---|---|---|
| `removeInlandWaterPools` :4137 | PORTOWANY (partia 1) | `landsea.rs::remove_inland_water_pools`; test `remove_inland_water_pools_matches_web`; 89 wektorow |
| `fillEnclosedWaterByLandNeighbors` :4189 | PORTOWANY (partia 1, domkniete w obronie r2) | `landsea.rs::fill_enclosed_water_by_land_neighbors`; 117 wektorow (`fill_enclosed_water`: ladder k=0..6 x min=0..7, N-1/N/N+1) + 20 wektorow lancuchow (`fill_enclosed_water_chain`: limit 8 przebiegow, N-1/N/N+1 dla L=7/8/9, zapis w locie); test `fill_enclosed_water_pass_cap_chains_match_web` |
| `removeSmallInlandWaterPools` :4276 | PORTOWANY (partia 1) | `landsea.rs::remove_small_inland_water_pools`; 90 wektorow (rozmiar bloba s=1..8, max=s-1/s/s+1); test pod watchdogiem (20 s) |
| `removeInlandSeaPools` :4320 | PORTOWANY (partia 1) | alias; `landsea.rs::remove_inland_sea_pools`; 71 wektorow |
| `findInlandWaterHexes` / `findInlandSeaHexes` :4109/:4123 | PORTOWANY (M06A r1) | `landsea.rs::find_inland_*`; juz zintegrowane |
| `purgeDesertEnclaveWater` :4156 | RUNDA-2 | wymaga `climateBandAt` (`prims.rs:361`) - nastepna partia |
| `purgeInlandWaterForMultiLandTyp` :4215 | RUNDA-2 | wywoluje `trimEnclosedOceanOnly` (web :4701, POZA zakresem) - zaleznosc do rozstrzygniecia |
| `applyJaggedCoastNoise` :4232 | RUNDA-2 | szum (`mulberry32`/`fbm`/perm) - nastepna partia |
| `enforceLatitudinalOceanBuffer` :3339 | RUNDA-2 | - |
| `climateBandBaseTerrain` :3360, `applyClimateBandsToHexes` :3380 | RUNDA-2 | - |
| `enforceEarthTemplateOnHexes` :3418 | RUNDA-2 | - |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | RUNDA-2 | dane do `derived/*.json` |
| `applyLandFractionByScore` :3444 | RUNDA-2 | - |
| `rebalanceLandFractionWithMargins` :3532 | RUNDA-2 | - |
| `erodePangeaBboxLowScoreRim` :3551, `carvePangeaLongSideGulfs` :3606 | RUNDA-2 | - |
| `rebalanceLandFractionPangea` :3667 | RUNDA-2 | - |
| `applyLandFractionByContinent` :3701 | RUNDA-2 | - |
| `rebalanceLandSeaRatio` :3791 | RUNDA-2 | - |
| `assignContinentIndices` :3186, `sortLandKeysForErosion` :3207 | RUNDA-2 | - |
| `pangeaAnnularMaxCorridorWidth` :4329 | RUNDA-2 | `Math.sqrt`, `Math.round` (`masks::v8math`) |
| `groupDryLandMassKeys` :4338, `isPangeaBridgeWater` :4371 | RUNDA-2 | - |
| `ensurePangeaSingleContinent` :4375 | POZA ZAKRESEM | linia 4375 > 4374, lista P6-25 |

Razem po partii 1: 4 symbole PORTOWANE w tej rundzie (+ 2 z M06A). Brak otwartych luk w tych 4 symbolach (patrz "Obrona r2").
Pozostale wiersze RUNDA-2 nadal otwarte (kolejne partie).

## Dryf po pinie (zakres 3186-4374)

`git diff --stat edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 24 dodane / 16 usuniete linie, 8 hunkow
na liniach 5992, 8466, 10352, 10392, 10541, 10693, 10776, 10804 pliku. **Zadne z nich nie wpada w zakres 3186-4374.**
Pin pozostaje `edb8fb56`; odswiezenie wektorow robi osobny temat po R-RUSTPORT-REPIN-DELTA-Q1.

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze "q,r" niekanoniczne sa pomijane przy iteracji (jak w M06A, ZALOZENIA r1). Dla `minLand = 0` roznica bylaby widoczna tylko dla kluczy niekanonicznych; wektory ich nie zawieraja.
- Z-2: Domyslny prog `minLandNeighbors = 5` (web :4191, `minLandNeighbors = 5,`) zyje u wolajacego, nie jako literal w `landsea.rs`. Limit przebiegow `for (let pass = 0; pass < 8; pass++)` (web :4194) jest stala `FILL_ENCLOSED_MAX_PASSES` w `landsea.rs` (wartosc z kodu webu; brak danych do JSON). Ten limit JEST pokryty wektorami (Z-6 ponizej, rozstrzygniecie).
- Z-3: `fillEnclosedWaterByLandNeighbors` ustawia `rzeka = {obecna:false, krawedzie:[]}` (web :4204), wiec port czysci flage rzeki; `set_hex_to_laka` (jak web `setHexToLaka`) tego nie robi, co pokazaly wektory przed poprawka.
- Z-4: `removeInlandWaterPools` / `removeSmallInlandWaterPools` NIE dotykaja rzeki (zgodnie z webem).
- Z-5: `removeSmallInlandWaterPools` - kolejnosc przechodzenia skladowych nie wplywa na wynik (skladowe rozlaczne, zbior inlandowy liczony raz).
- Z-6 (ZAMKNIETE w obronie r2): luka limitu przebiegow zostala wypelniona. Wektory lancuchow `fill_chain_L{2,7,8,9,12}_{rev,fwd}_min{1,2}` (20 przypadkow, generator z uruchomionego weba) daja: rev L=7 -> 7, L=8 -> 8, L=9 -> 8 (cap binduje), L=12 -> 8; fwd L=9 -> 9 (zapis w locie). Mutacje cap 7 / cap 9 / snapshot-read sa KILLED (ponizej). Zadna luka nie pozostaje; Z-6 z r1 (odroczenie) jest uchylone.
- Z-7 (lokalizacja generatora i loadera): generator M06A2 jest osobnym plikiem `gen-m06a2-vectors.mjs` w katalogu runu M06A2, a nie rozszerzeniem `gen-m06a-vectors.mjs`. Powod: allowlista tematu (dispatch) obejmuje wylacznie `runs/R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1/**`, a katalog runu M06A jest poza nia - jego generator nie moze byc zmieniany. Stare kategorie M06A NIE sa kopiowane jako prefiks do nowego pliku: symbole M06A2 sa rozlaczne z symbolami M06A (M06A2 nie dotyka `findInlandWaterHexes` poza juz zintegrowanym aliasem), a gen_helpers_sha256 jest ten sam (`ab934703...`), wiec oba zestawy pochodza z identycznego kodu weba. Loader: `m06a-loader-register.mjs` + `m06a-loader-hooks.mjs` skopiowane obok generatora (ta sama logika co M06A).
- Z-8: wektory `fill_enclosed_water_chain` maja dwie kolejnosci wstawiania celowo: `rev` wymusza jeden heks na przebieg (test limitu przebiegow), `fwd` wymusza konwersje w jednym przebiegu przez odczyt sasiadow na zywo (test odroznia zapis w locie od odczytu snapshotu).
- Z-9: watchdog w testach: cialo testu `removeSmallInlandWaterPools` i testu lancuchow biegnie w watku z limitem 20 s (`with_watchdog`). Asercje i ich komunikaty nie zmienione; test nie zostal oslabiony.

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1/gen-m06a2-vectors.mjs` (uruchomiony na `git archive edb8fb56 gra/src gra/data` rozpakowanym poza repo; `gen_helpers_sha256` = ten sam co M06A). Kategorie: `remove_inland_water_pools` 89, `fill_enclosed_water` 117, `remove_small_inland_water_pools` 90, `remove_inland_sea_pools` 71, `fill_enclosed_water_chain` 20.
- Wektory: `rust-port/engine/tests/p6_m06a2_vectors/web-vectors.json`.
- Testy: `rust-port/engine/tests/p6_m06a2_landsea.rs` (6 testow, wszystkie zielone; trafienia na progach N-1/N/N+1 asertowane dla rozmiaru blobu, min_land i limitu przebiegow).
- Weryfikacja niezalezna: generator uruchomiony ponownie z `git archive edb8fb56` (wlasny katalog poza repo, skrypty w scratchpad) - `web-vectors.json` z r1 BAJT-W-BAJT zgodny (cmp); kategorie r1 po rozszerzeniu generatora identyczne (`cmp` JSON per kategoria).

## Math.*

Partia 1 nie uzywa `Math.*` (sama arytmetyka calkowita i porownania). Wykaz pelny - w kolejnych partiach.

## Pomiary r1 (Operator-pomiary, historyczne)

Trafienia progow r1 (plik r1): fill (rel wzgledem `min_land`) -1: 7, 0: 8, +1: 6; pool (rel wzgledem rozmiaru bloba) -1: 8, 0: 8, +1: 8. Raport Operator-impl (6/7/6) byl niezgodny z plikiem - poprawiony w r1.

## Obrona r2 (odpowiedz na zarzuty Evaluatora r1)

Zarzut 1 i 2 (limit przebiegow nieprzetestowany, brak dowodu rownowaznosci dla M02/M03, status PORTOWANY nieuczciwy):
PRZYJETE. Dodano 20 wektorow lancuchow (sekcja Z-6/Z-8), test `fill_enclosed_water_pass_cap_chains_match_web`, status wiersza `fillEnclosedWaterByLandNeighbors` opisany jako domkniety. Pomiar trafien na progu limitu (`boundary_passes_rel` = L-8, rev): -1: 2, 0: 2, +1: 2 (plik `web-vectors.json`, wszystkie L=7/8/9 z obu wariantow min).

Zarzut 3 (watchdog w tescie BFS):
PRZYJETE. `with_watchdog` (20 s) w tescie `remove_small_inland_water_pools_matches_web_with_size_boundaries` i w tescie lancuchow. M09 teraz konczy sie panika z komunikatem watchdog po 20 s (zamiast zawieszenia 150 s).

Zarzut 4 (bledne linie webu):
PRZYJETE. Poprawione: limit przebiegow = web :4194 (nie :4191); domyslny `minLandNeighbors = 5` = web :4191 (nie :4190); `rzeka = {...}` w fill = web :4204 (nie :4199). Zweryfikowane: `git show edb8fb56:gra/src/map/gen-helpers.ts | sed -n '4191p;4194p;4204p'`.

Zarzut 5 (brak wektora zmiany sasiada w tym samym przebiegu, odczyt na zywo vs snapshot):
PRZYJETE. Wektor `fill_chain_L9_fwd_min1` (out 9, odczyt na zywo) i `fill_chain_L9_fwd_min2`. Mutacja M17 (odczyt sasiadow ze snapshotu z poczatku przebiegu) daje wynik 8 zamiast 9 -> KILLED.

Zarzut 6 (nazwa loadera w komentarzu generatora):
PRZYJETE. Naglowek generatora: `m06a-loader-register.mjs` (zgodnie z plikiem w runie).

Zarzut 7 (generator nie rozszerzony, brak uzasadnienia w dokumencie):
CZESCIOWO PRZYJETE: uzasadnienie dopisane jako Z-7 (allowlista wyklucza run M06A). Stare kategorie nie sa prefiksem nowego pliku - ODRZUCAM ten element wymagania jako niewykonalny w allowliscie (nowy plik wektorow zawiera tylko kategorie M06A2).

Mutacje (r2, po naprawie; kazda: podmiana w `landsea.rs`, `cargo test --test p6_m06a2_landsea`, przywrocenie pliku z kopii, `cmp` potwierdzony):

| ID | Mutacja | Wynik r2 | Dowod (log w runs/) |
|---|---|---|---|
| M01 | fill: `<` -> `<=` (prog N) | KILLED (r1) | `mut-M01_fill_lt_to_le.log` |
| M02r2 | fill: limit przebiegow 8 -> 7 | KILLED | `mut-M02r2_fill_passes_7.log`: `fill_chain_L8_rev_min1` left 7, right 8 |
| M03r2 | fill: limit przebiegow 8 -> 9 | KILLED | `mut-M03r2_fill_passes_9.log`: `fill_chain_L9_rev_min1` left 9, right 8 |
| M04 | fill: usuniecie `if n == 0 { break }` | SURVIVED - RÓWNOWAZNE | pass z n=0 nie zmienia stanu, kolejny pass tez daje n=0; `total += 0` (dowod z kodu) |
| M05 | fill: brak `river_present = false` | KILLED (r1) | `mut-M05_*.log` |
| M06 | fill: brak `river_edges.clear()` | KILLED (r1) | `mut-M06_*.log` |
| M07 | fill: odwrocony predykat wody | KILLED (r1) | `mut-M07_*.log` |
| M08 | small: `>` -> `>=` (rozmiar) | KILLED (r1) | `mut-M08_*.log` |
| M09r2 | small: brak sprawdzenia `visited` w BFS | KILLED przez watchdog (20 s, panika z komunikatem) | `mut-M09r2_small_no_visited_check.log` |
| M10 | small: brak `visited.insert` | KILLED (r1) | `mut-M10_*.log` |
| M11 | small: brak rozszerzenia stosu | KILLED (r1) | `mut-M11_*.log` |
| M12 | small: pominiety kierunek 0 | KILLED (r1) | `mut-M12_*.log` |
| M13 | small: brak licznika `converted` | KILLED (r1) | `mut-M13_*.log` |
| M14 | alias `removeInlandSeaPools` -> wersja tylko Morze | KILLED (r1) | `mut-M14_*.log` |
| M15 | water: brak `set_hex_to_laka` | KILLED (r1) | `mut-M15_*.log` |
| M16 | `count_land_neighbors`: odwrocony predykat | KILLED (r1) | `mut-M16_*.log` |
| M17r2 | fill: odczyt sasiadow ze snapshotu poczatku przebiegu | KILLED | `mut-M17r2_fill_snapshot_read.log`: `fill_chain_L9_fwd_min1` left 8, right 9 |

Wynik r2: 17 mutacji; 16 KILLED, 1 SURVIVED RÓWNOWAZNE (M04). Brak mutacji nierownowaznej przezytej.

**Dryf po pinie:** bez zmian (sekcja wyzej).
