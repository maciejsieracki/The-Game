# P6.M06A6 - lad / morze: rodzina Pangei i kontynentow, partia 1

**Temat:** R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1 (runda 1, Operator-impl).
**Pin webu:** `edb8fb56` (`git archive edb8fb56 gra/src gra/data`, rozpakowane poza repo).
**Baza Rust:** `rust-port/parity-v2` @ `dcd3eadb` (zawiera M06A..M06A5).
**Kontekst:** wzorzec M06A5 (`P6-M06A5-LAD-MORZE-ULAMEK.md`), M05B (`P6-M05B-RELIEF-B-POKRYCIE-PASMA.md`).

## Zakres partii 1 i status (binarne kryterium)

| Symbol web (pin edb8fb56) | Status | Implementacja Rust | Dowod |
|---|---|---|---|
| `erodePangeaBboxLowScoreRim` :3551 (prywatna) | PORTOWANY | `landsea::erode_pangea_bbox_low_score_rim` | `tests/p6_m06a6_pangea.rs::erode_pangea_bbox_low_score_rim_matches_web` (250 przypadkow, 112 z erozja); `erode_bbox_threshold_n_minus_1_n_n_plus_1` |
| `carvePangeaLongSideGulfs` :3606 (prywatna) | PORTOWANY | `landsea::carve_pangea_long_side_gulfs` | `carve_pangea_long_side_gulfs_matches_web` (250 przypadkow, 97 z wycieciem); `carve_threshold_79_and_80_land_hexes`; `carve_aspect_exactly_1_85_does_not_carve` |
| `applyLandFractionByContinent` :3701 (eksport) | PORTOWANY | `landsea::apply_land_fraction_by_continent` | `apply_land_fraction_by_continent_matches_web` (205 przypadkow, 21 z NaN, 194 ze zmianami); `apply_land_fraction_by_continent_zero_continents_is_noop` |
| `rebalanceLandFractionPangea` :3667 (eksport) | RUNDA-2 | - | Zalezy od `fillPangeaAnnularSeaCorridors` (:4595) i `ensurePangeaSingleContinent` (:4375), oba NIEPORTOWANE i nieprzypisane do zadnego tematu (patrz "Luki"). |
| `rebalanceLandSeaRatio` :3791 | RUNDA-2 | - | Osobny temat (lista dispatchu). |
| `pangeaAnnularMaxCorridorWidth` :4329 | RUNDA-2 | - | Osobny temat (lista dispatchu). |
| `groupDryLandMassKeys` :4338 | RUNDA-2 | - | Osobny temat (lista dispatchu). |
| `isPangeaBridgeWater` :4371 | RUNDA-2 | - | Osobny temat (lista dispatchu). |

Dane (DANE-JUZ-W-RUST / nowe dane w JSON): progi i szum zebrane w nowym pliku
`data/derived/mapgen-landsea-pangea.json` (loader `data::derived::mapgen_landsea_pangea()`).
Test `pangea_data_matches_web_constants` pilnuje wartosci wzgledem web (0.74, 1200, pas 2, tolerancja 0.02,
80, 1.85, 900, 0.28, 3, 0.42, szum 0.08/40/3, waga 0.15). Wspolne progi (0.15/0.85, 0.11, 0.04)
pochodza z `mapgen-landsea-fill.json` (M06A5). Kod nie zawiera literalow danych tych symboli.

## Zaleznosci uzyte z innych modulow (bez zmian w nich)

`parse_hex_key` (`terrain_class`), `set_hex_to_morze`, `set_hex_to_laka`, `is_in_map_border`,
`map_center_distance_norm`, `enforce_map_border_ocean`, `apply_marginal_land_zone_caps`, `fbm` i `PERM_TABLE_LEN` (`prims`),
`js_array_sort_by` (`cluster_mass`), `js_round` (`improvements`), `masks::v8math::{js_min, js_max, js_hypot}`,
`sort_land_keys_for_erosion` i `apply_land_fraction_by_score` (M06A5, `landsea`).

## Wykaz Math.* (implementacja uzyta)

| Miejsce | Web | Rust |
|---|---|---|
| erode: min/max granic bbox, `bboxArea` | `Math.min/max` | `v8math::js_min/js_max` |
| erode: sort obrzeza, odleglosc od srodka | `Math.hypot` | `v8math::js_hypot` (Kahan, jak V8) |
| erode: `Math.abs` | `Math.abs` | `f64::abs` (dokladne IEEE) |
| carve: `aspect`, `carveDepth`, `distEdge` | `Math.max/min` | `v8math::js_max/js_min` |
| carve: `Math.floor(shortSpan*0.28)` | `Math.floor` | `f64::floor` (dokladne IEEE) |
| carve: szum | `fbm` | `prims::fbm` (port M01) |
| continent: clamp udzialu, `targetLand`, `quota` | `Math.max/min/round` | `v8math::js_max/js_min`, `js_round` |

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze `"q,r"` sa kanoniczne (jak w M06A/M06A5). Parsowanie wspolrzednych przez `parse_hex_key`
  (f64, jak web `parseHexKey`), wiec klucz niekanoniczny daje NaN zgodnie z webem.
- Z-2: `Object.keys` = kolejnosc wstawiania (`HexRecord`); `Map` `continentOf` = `HashMap<String, i64>`, brak wpisu = 0 (web `?? 0`).
- Z-3: `width ?? 1` w sortowaniu: `dims = None` -> `(1,1)`. Granica (`hasBorder`) wymaga obu wymiarow > 0; krok koncowy
  `applyLandFractionByScore` / `applyMarginalLandZoneCaps` / `enforceMapBorderOcean` wykonuje sie gdy `dims` jest `Some` (web `!= null`), takze dla 0.
- Z-4: `targetLandFraction = NaN` -> zgodnie z webem: `targetLand` = NaN, brak zmian w petli, krok koncowy wykonany (`final != NaN` prawdziwe). Testowane wektorami (21 przypadkow NaN).
- Z-5: Wartosci NaN w wektorach zapisane jako napis `"NaN"`.
- Z-N0: `nContinents = 0`: web rzuca TypeError (`zoneKeys[-1].push`) przy niepustej mapie. Rust zwraca 0 bez zmian (test `..._zero_continents_is_noop`). Brak wektora (web nie ma wyniku).
- Z-6: `rebalanceLandFractionPangea` nie jest portowana w tej rundzie (RUNDA-2, patrz nizej); nie ma dla niej wektorow.

## Wektory i generator

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1/gen-m06a6-pangea-vectors.mjs` (seed 20261101).
- Prywatne funkcje (`erodePangeaBboxLowScoreRim`, `carvePangeaLongSideGulfs`) uruchamiane z INSTRUMENTOWANEJ KOPII
  `gen-helpers.ts` (jedyna zmiana: `export` przed `function`), w katalogu poza repo. Logika nietknieta.
- Pliki (kazdy <= 10 MB): `tests/p6_m06a6_vectors/erode-vectors.json` (1,2 MB), `carve-vectors.json` (4,6 MB), `contfrac-vectors.json` (0,6 MB).
- Przypadki brzegowe: erozja - blok 10x10 z rogami, L in {4, 50, 73, 74, 75, 99, 100} przy progach 0.73/0.74/0.75 i maxErode {0,1,3,1200};
  roznice score 0.02 (IEEE) i 0.01/0.03; carve - bbox 37x20 (aspekt == 1.85), 38x20, 40x10, 40x12, 40x13, 25x10, 30x12, 41x20, 10x40 z L in {79, 80, 81};
  kontynenty - NaN, nContinents 1, Math.round na granicy, wpisy ujemne i poza zakresem (clamp), brak wpisu.
- Zaden test nie zostal oslabiony; asercje minimalnej liczby niezerowych przypadkow (erozja >= 50, wyciecie >= 50, zmiany >= 100) pilnuja, by wektory nie byly trywialne.

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 40 linii, 4 hunki (pin-linie 5992, 8466, 10352, 10395, 10545, 10698, 10782, 10811).
**Zaden hunk nie lezy w zakresie 3186-4374.** Pelny diff: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1/drift-gen-helpers-edb8fb56-origin-main-r1.diff`.
Odswiezenie wektorow (przepiecie na nowszy pin) - osobny temat po raporcie R-RUSTPORT-REPIN-DELTA-Q1.

## Luki i RUNDA-2

- `rebalanceLandFractionPangea` (:3667) wymaga portu `fillPangeaAnnularSeaCorridors` (:4595) i `ensurePangeaSingleContinent` (:4375).
  Oba symbole nie sa w zadnym temacie dispatchu ani w `P6-M06A5`. Potrzebny nowy temat (np. P6-M06A7) lub decyzja, kto je przejmuje.
- Pomiary mutacyjne (mutacje strukturalne galezi sterujacych, dowody rownowaznosci, pomiar trafien na granicach) - Operator-pomiary, runda 2. NIE_ZMIERZONO w rundzie 1.
  Wynik rundy 2: patrz sekcja "Runda 2 - pomiary" nizej (2 mutanty nieZabite i nie-rownowazne = luki testowe).

## Runda 2 - pomiary (Operator-pomiary, ten sam ID)

Poprawka do rundy 1: sekcja "Dryf po pinie" podawala 4 hunki; `grep -c "^@@"` na pliku diff daje **8 hunkow** (pin-linie 5992, 8466, 10352, 10392, 10541, 10693, 10776, 10804). Zaden nie lezy w 3186-4374.

### Weryfikator niezalezny (reprodukowalnosc wektorow)

Wektory wygenerowane ponownie z pinu `edb8fb56` (ta sama komenda, seed 20261101) i porownane bajtowo z plikami w repo:
erode / carve / contfrac - **identyczne** (log: `verify-regen-m06a6-r2.log`).

### Bramki (surowe logi, EXIT)

- fmt: `EXIT=0` (`gate-fmt-r2.log`)
- clippy `--all-targets -D warnings`: `EXIT=0` (`gate-clippy-r2.log`)
- test (engine): `EXIT=0`, **1305 passed, 0 failed** (baza 1296 + 9 nowych) (`gate-test-r2.log`)

### Mutacje (`mut-runner-m06a6.py`, log `mutations-r2.log`)

Kazda mutacja: jeden fragment `landsea.rs`, testy `p6_m06a6_pangea`, przywracanie z bajtow, SHA zgodne po kazdej (`zgodne=True`).

| ID | Galaz | Wynik |
|---|---|---|
| E01 bbox-stop `<` | erode: stop bbox | SURVIVED - RÓWNOWAZNA (dowod D1) |
| E02 usuniety wczesny return | erode: stop bbox | SURVIVED - RÓWNOWAZNA (dowod D1) |
| E03 rim qmin `<` | erode: pas brzegu | KILLED |
| E04 rim qmax `>` | erode: pas brzegu | KILLED |
| E05 rim rmin `<` | erode: pas brzegu | KILLED |
| E06 rim rmax `>` | erode: pas brzegu | KILLED |
| E07 tolerancja `>=` | erode: sort | KILLED |
| E08 sort odwrocony | erode: sort | KILLED |
| E09 stop bez bbox | erode: petla | KILLED |
| E10 `eroded >` | erode: petla | KILLED |
| E11 bez przeliczenia | erode: petla | KILLED |
| E12 bez set_morze | erode: petla | KILLED |
| E13 bez `js_max(1,area)` | erode: obszar | SURVIVED - RÓWNOWAZNA (dowod D2) |
| C01 minland `<=` | carve: prog 80 | KILLED |
| C02 aspect `<` | carve: prog 1.85 | KILLED |
| C03 `span_q > span_r` | carve: long_is_q | SURVIVED - RÓWNOWAZNA (dowod D3) |
| C04 onlong min `<` | carve: pas | KILLED |
| C05 onlong max `>` | carve: pas | KILLED |
| C06 nearmid `<=` | carve: blisko srodka | SURVIVED - RÓWNOWAZNA (dowod D4) |
| C07 usuniety warunek nearmid | carve: struktura | KILLED |
| C08 bez szumu | carve: wynik | KILLED |
| C09 sort odwrocony | carve: sort | KILLED |
| C10 `carved >` | carve: limit | KILLED |
| C11 `dist >=` | carve: krawedz | KILLED |
| C12 bez `.floor()` | carve: glebokosc | SURVIVED - RÓWNOWAZNA (dowod D5) |
| C13 bez minimum 3 | carve: glebokosc | KILLED |
| C14 `js_max` zamiast `js_min` | carve: krawedz | KILLED |
| K01 bez gornego clampu | cont: udzial | KILLED |
| K02 ostatni kontynent bez reszty | cont: kwota | KILLED |
| K03 `floor` zamiast `round` | cont: kwota | KILLED |
| K04 deficyt `<=` | cont: galaz lad<kwota | SURVIVED - RÓWNOWAZNA (dowod D6) |
| K05 morse bez break | cont: wzrost | KILLED |
| K06 galaz erozji wylaczona | cont: spadek | KILLED |
| K07 rekonsyliacja wylaczona | cont: koniec | KILLED |
| K08 bez guardu NaN sumy | cont: total_score | **SURVIVED - LUKA (NIE-rownowazna)** |
| K09 tolerancja sortu morse `>=` | cont: sort morse | **SURVIVED - LUKA (NIE-rownowazna)** |
| K10 bez dolnego clampu ci | cont: kontynent | KILLED |

Wynik: 37 mutacji (kotwica K09 poprawiona w dry-run przed uruchomieniem). **Zabite 28; rownowazne 7 (E01, E02, E13, C03, C06, C12, K04 - dowody D1-D6); luki 2 (K08, K09).** 28 + 7 + 2 = 37.

### Dowody rownowaznosci

- **D1 (E01, E02):** pierwsza instrukcja petli erozji to `if bbox_fill <= target || eroded >= max { break }`. Przy `bbox_fill == target` (17 przypadkow wektorow, pomiar `bbox_stop_equal`) petla przerywa przy `eroded = 0`; przed petla nie ma skutkow ubocznych (rim i sort nie modyfikuja `hexes`). Wynik `0` identyczny.
- **D2 (E13):** klucze kanoniczne `"q,r"` (Z-1): `q_max >= q_min`, `r_max >= r_min`, wiec `(Δq+1)(Δr+1) >= 1` dla niepustego lądu; `js_max(1, x) = x` dla `x >= 1`. Dla kluczy niekanonicznych wynik i tak jest NaN (Z-1), a obie wersje propaguja NaN. Brak roznicy.
- **D3 (C03):** `span_q == span_r` daje `aspect = L / max(1, L) = 1 <= max_aspect` (1.85 z danych; dowod wazny dla `max_aspect >= 1`) -> `return 0` przed uzyciem `long_is_q`. Dla `max_aspect < 1` mutant rozni sie - warunek domeny: `max_aspect >= 1` (jedyne wywolanie produkcyjne uzywa 1.85).
- **D4 (C06):** dla kluczy calkowitych `mid = (qmin+qmax)/2` jest calkowity <=> `L = Δq+1` nieparzyste. `0.42·L = 21L/50` lezy w `Z/2` <=> `25 | L`; wtedy `L = 25m`: m nieparzyste -> `mid` calkowity, `0.42L = 10.5m` polcalkowity; m parzyste -> `mid` polcalkowity, `0.42L` calkowity. Zatem `|along - mid| = 0.42L` nigdy nie zachodzi (a dla `0.42L` spoza `Z/2` roznica od `Z/2` >= 1/50 >> blad float). Pomiar: `nearmid_eq = 0` w 250 przypadkach.
- **D5 (C12):** wszystkie porownania z `carve_depth` maja calkowita lewa strone (`across - smin`, `smax - across`, `dist_edge` - calkowite dla kluczy kanonicznych). Dla calkowitego `x`: `x <= f <=> x <= floor(f)`, `x > f <=> x > floor(f)`. `max(3, f)` vs `max(3, floor f)` daje te same decyzje. Brak roznicy.
- **D6 (K04):** w galezi `land < quota` pierwsza instrukcja petli wzrostu to `if land >= quota { break }`. Przy `land == quota` (wejscie z `<=`) petla konczy sie przed jakakolwiek zmiana `hexes`; sortowanie `morse` nie modyfikuje danych. Brak roznicy.

### Luki (non-equivalent survivors) - wymagaja poprawki Operatora-impl

- **K08 (guard NaN sumy wynikow):** web `totalScore = scoreSums.reduce(...) || 1` - NaN jest falsy, wiec totalScore = 1. Rust (`sum_all.is_nan()`) to odwzorowuje, ALE zaden wektor nie ma NaN w `landScores` (sprawdzone: 0 z 205 przypadkow; NaN wystepuje tylko w `target`, 21 przypadkow). Kod poprawny wzgledem web, ale ta galaz nie jest przetestowana. **Wymagane:** przypadek z jednym NaN w landScores (wektor z uruchomionego weba), asercja zgodnosci.
- **K09 (tolerancja sortu morse `>` vs `>=`):** wektory maja 164 pary o `|Δscore|` dokladnie rownym `0.04` w arytmetyce float (58 przypadkow), ale zadna z nich nie jest porownywana w sortowaniu kandydatow `morse` z wynikiem zaleznym od gałęzi. Brak trafienia na granicy tolerancji w miejscu decyzji. **Wymagane:** przypadek z kandydatami Morze o scores `0.0` i `0.04` (`0.04 - 0.0 == 0.04` dokladnie w float, sprawdzone), z odwrotna kolejnoscia odleglosci od centrum, wektor z uruchomionego weba.

### Pomiar trafien wektorow na granicach (`measure-boundaries-m06a6.py`, log `measure-boundaries-r2.log`)

Metoda: zliczanie trafien geometrii z danych wejsciowych wektorow (nie wynik funkcji). Tolerancja porownan float: 1e-12 (przyblizenie dla `tol_tie_pairs`).

| Granica | Trafienia (przypadki/elementy) |
|---|---|
| erode: `bbox_fill == target` (N) | 17 |
| erode: pas brzegu, odleglosc od granicy bbox 1 / 2 / 3 (N-1 / N / N+1) | qmin: 1498/1495/1429; qmax: 1515/1478/1441; rmin: 1509/1502/1402; rmax: 1495/1492/1455 |
| erode: `eroded == max` | 80 przypadkow |
| erode: pary z `|Δscore| == 0.02` (tolerancja, przyblizona) | 36498 |
| carve: liczba lądu 79 / 80 / 81 | 30 / 30 / 32 |
| carve: `aspect == 1.85` (N) | 27 przypadkow |
| carve: `across - smin` vs glebokosc (N-1 / N / N+1) | 2314 / 2285 / 1963 |
| carve: `|along - mid| == 0.42·L` (N) | 0 (rownowaznosc D4) |
| carve: `dist_edge == glebokosc` (N) | 1039 |
| carve: `carved == maxCarve` | 68 przypadkow |
| cont: `target == 0.15 / 0.85` (klamp) | 10 przypadkow |
| cont: kwota z reszta `.5` (Math.round na granicy) | 4 przypadki |
| cont: `|Δscore| == 0.04` (tolerancja sortu morse) | 164 pary / 58 przypadkow, ale bez wplywu na decyzje (K09) |

### Wnioski rundy 2

- Binarne kryterium "mutacje na kazdej galezi sterujacej + dowody rownowaznosci": **niespelnione** - K08 i K09 to galezie bez zabojcy i nie-rownowazne. Potrzebne dwa przypadki wektorow z weba (K08: NaN w landScores; K09: tie 0.04 w sorcie morse), ponowne mutacje K08/K09 jako zabite, bez oslabiania istniejacych testow.
- Pozostale mutacje: zabite lub rownowazne z dowodem.
- Bez zmian kodu w tej rundzie (Operator-pomiary).

## Runda 3 - obrona (Operator-impl, ten sam ID)

Odpowiedz na zarzuty Evaluatora (runda 2). Kod `landsea.rs` bez zmian; zmienione: generator i wektory `contfrac` (prefiks rundy 2 zachowany, 205 pierwszych przypadkow JSON-owo identycznych; `erode`/`carve` bajtowo identyczne), testy `p6_m06a6_pangea.rs` (tylko dopisane; jedyna zmiana w istniejacym kodzie to `build_scores` przyjmuje napis `"NaN"` przez `num()`), `mut-runner-m06a6.py` (dopisana K11).

- **K08 (NaN sumy wynikow) - ZABITA.** Wektory `cn_*` (48 przypadkow, 48 z NaN w `landScores`, 42 ze zmianami przez web). Test `apply_land_fraction_by_continent_nan_score_sum_matches_web`. Mutacja: `KILLED` (2 FAILED).
- **K09 (tolerancja sortu morse `>` vs `>=`) - ZABITA.** Wektory `ct_*` (48 przypadkow, Morze 15x15): kandydaci morza o wynikach `0.0`/`0.04` (oraz `0.04`/`0.08`) z wyzszym wynikiem dalej od centrum, 12+12 przypadkow na dokladnym progu, 12 na N-1 ulp (`0.04-2^-57`), 12 na N+1 ulp (`0.04+2^-57`). Web (tolerancja `>`, remis -> odleglosc od centrum) zamienia komorke centralna we wszystkich 24 przypadkach progowych; `>=` zamienia dalsza. Test `apply_land_fraction_by_continent_sort_tolerance_boundary_matches_web`. Mutacja: `KILLED` (2 FAILED).
- **K11 (galaz zerowa `sum_all == 0.0`) - ZABITA (nowa mutacja).** Wektory `cz_*` (12 przypadkow, wszystkie wyniki 0; web zmienia 12/12). Test `apply_land_fraction_by_continent_zero_score_sum_matches_web`. Mutacja: `KILLED`.
- **Zarzut 4 (dane `erode_docelowe_wypelnienie_bbox`, `erode_max`, `carve_max_aspect`, `carve_max_wyciec` nie wiazane z kodem) - PRZYJETY.** Test `pangea_data_defaults_drive_erode_and_carve_vectors` karmi funkcje produkcyjne wartosciami z `mapgen-landsea-pangea.json` i porownuje z wektorami weba dla przypadkow o tych wartosciach (erozja 0.74/1200: >= 10; zatoki 1.85/900: >= 10). Rozjazd danych z wektorami = czerwony test.
- **Zarzut 3 (etap niekompletny) - odpowiedz:** K08/K09 zabite; `rebalanceLandFractionPangea` nadal RUNDA-2 (zaleznosci `fillPangeaAnnularSeaCorridors` :4595 i `ensurePangeaSingleContinent` :4375 niezportowane), wpisane w tabeli zakresu.
- Dowody rownowaznosci (E01, E02, E13, C03, C06, C12, K04) ponownie uruchomione na nowych wektorach: nadal `SURVIVED`, zgodnie z dowodami D1-D6 (log `mutations-r3.log`).

Bramki rundy 3 (surowe logi w katalogu runu, `gate-*-r3.log`): fmt EXIT=0; clippy `--all-targets -D warnings` EXIT=0; test: 1309 passed, 0 failed (baza 1296 + 13 testow w `p6_m06a6_pangea`: 9 z rundy 1 + 4 nowe w rundzie 3).

Pomiar trafien na granicach: `measure-boundaries-r3.log`.
