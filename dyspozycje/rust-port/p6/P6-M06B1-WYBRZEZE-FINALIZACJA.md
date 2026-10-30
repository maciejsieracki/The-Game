# P6.M06B1 - finalizacja wybrzeza i wod srodladowych, partia 1 (port `gen-helpers.ts`:4649-4939 do Rust)

Temat: `R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator-impl).
Zakres partii 1 (6 symboli): `maxOceanBayDepth` :4649, `purgeReliefValleyWater` :4724, `trimDeepOceanBays` :4761,
`finalizeCoastAndInlandWater` :4787, `thickenCoastAndSmoothInlets` :4840, `flattenFalseCoastalRiverNotches` :4915.
Partia M06B2 (`removeTinyLandIslands` :4946 ... `enforceTargetDryLandFraction` :5079) - poza tym tematem.

Baza: `origin/rust-port/parity-v2` @ `db102531` (silnik przed zmianami: 1422 testy, zgodnie z M06A).
Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu tymczasowego poza repo).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/`.
Wzorzec: M05B (`P6-M05B-RELIEF-B-POKRYCIE-PASMA.md`), M06A9 (wektory i weryfikacja).

## 0. Status

- Wszystkie 6 symboli partii PORTOWANE (kod + test + wektor z uruchomionego weba, 0 rozbieznosci bitowych).
- Symbole pomocnicze uzyte przez te funkcje (`morseDepthFromMapBorder`, `removeInlandWaterPools`,
  `removeSmallInlandWaterPools`, `applyDoubleCoastRing`, `sanitizeCoastHexes`, `findInlandWaterHexes`,
  `findDryLandTouchingSea`, `countLandNeighbors`, `setHexToMorze`, `setHexToLaka`, `isInMapBorder`,
  `mapBorderWidth`, `trimEnclosedOceanOnly`) sa DANE-JUZ-W-RUST (M06A/M04/M01); ich poprawnosc jest
  posrednio sprawdzana wektorami finalize/thicken.
- Testy nowe: **11** (`p6_m06b1_ocean` 2, `p6_m06b1_coast` 7, `p6_m06b1_tables` 2).
  `cargo test --offline --no-fail-fast`: **1433 passed, 0 failed** (= 1422 baza + 11). Zero zmian testow bazowych.
- Bramki (surowe logi w runie): fmt `EXIT=0` (`gate-fmt-r1.log`), clippy `--all-targets -D warnings` `EXIT=0`
  (`gate-clippy-r1.log`), test `EXIT=0` (`gate-test-r1.log`), `git diff --check` `EXIT=0`.
- Mutacje, niezalezny weryfikator i pomiary granic w tej rundzie NIE wykonywane (rola Operator-impl; wykonuje
  Operator-pomiary w osobnym wywolaniu).

## 1. Symbole zakresu - status

| Symbol web (gen-helpers.ts) | Rust (`mapgen/landsea.rs`) | Status | Wektor / test |
|---|---|---|---|
| `maxOceanBayDepth` :4649 | `max_ocean_bay_depth` | PORTOWANY | `ocean` / `p6_m06b1_ocean` |
| `purgeReliefValleyWater` :4724 | `purge_relief_valley_water` | PORTOWANY | `purge` / `p6_m06b1_coast` |
| `trimDeepOceanBays` :4761 | `trim_deep_ocean_bays` (deleguje do `trim_enclosed_ocean_only`) | PORTOWANY | `trim` / `p6_m06b1_coast` |
| `finalizeCoastAndInlandWater` :4787 | `finalize_coast_and_inland_water` (+ `_default`) | PORTOWANY | `finalize` / `p6_m06b1_coast` |
| `thickenCoastAndSmoothInlets` :4840 | `thicken_coast_and_smooth_inlets` (+ `_default`) | PORTOWANY | `thicken` / `p6_m06b1_coast` |
| `flattenFalseCoastalRiverNotches` :4915 | `flatten_false_coastal_river_notches` | PORTOWANY | `flatten` / `p6_m06b1_coast` |
| progi i mnozniki (liczby) | `data/derived/mapgen-coast.json` (`mapgen_coast()`) | DANE (JSON) | `p6_m06b1_tables` |

Kod: `rust-port/engine/src/domain/mapgen/landsea.rs` (sekcja P6.M06B1 na koncu pliku), tabela:
`rust-port/engine/data/derived/mapgen-coast.json`, parser: `rust-port/engine/src/data/derived.rs` (dopisek na koncu).

## 2. Odstepstwa sygnatur od weba (logika 1:1)

- `maxOceanBayDepth(width, height)` -> `max_ocean_bay_depth(i64, i64) -> f64`; bufor brzegu = `terrain_class::map_border_width` (f64).
- `trimDeepOceanBays(hexes, width, height, _maxDepth?)` -> `trim_deep_ocean_bays(hexes, w, h)`. Parametr
  `_maxDepth` NIE jest czytany w ciele funkcji web (NIE-DOTYCZY). Cialo web jest tozsame z `trimEnclosedOceanOnly`
  (:4701), wiec port deleguje do istniejacej funkcji M06A.
- `finalizeCoastAndInlandWater(hexes, w, h, maxPasses = 3, opts?)` -> `finalize_coast_and_inland_water(hexes, w, h, max_passes, Option<usize>)`
  (`None` = brak `opts.maxInlandPoolSize`). Domyslny `maxPasses` z JSON w `_default`. Zwrot web: `void`.
- `thickenCoastAndSmoothInlets(hexes, w, h, coastWidth = 2)` -> `thicken_coast_and_smooth_inlets(hexes, w, h, coast_width)`,
  domyslna szerokosc z JSON w `_default`. Zwrot: liczba zmian (jak web).
- `flattenFalseCoastalRiverNotches` -> zwraca liczbe zamienionych heksow (web zwraca `toFlatten.length`).
- Tablica heksow: `Record<string, Hex>` -> `HexRecord` (kolejnosc wstawiania = `Object.entries`). `hex.coords` -> pola `q`, `r`
  w `TerrainHex`; klucze w mapie sa kanoniczne `"q,r"` (ZALOZENIE jak M05A/M06A).
- Sekwencyjne mutacje (purge, thicken) czytaja stan na biezaco, jak w JS: kazdy heks jest sprawdzany na stanie po
  zmianach poprzednich heksow (implementacja: lista kluczy, potem `get`/`get_mut` po kluczu).

## 3. Dane vs kod

- `data/derived/mapgen-coast.json`: 10 lisci, kazdy z `zrodlo_web` (`gra/src/map/gen-helpers.ts:<linia>`):
  `dzielnik_skali` 6 (:4651), `bufor_min_dodatek` 2 (:4652), `bufor_gorny_dodatek` 14 (:4652),
  `min_sasiadow_rzezby` 2 (:4746), `min_sasiadow_suchych` 3 (:4746), `max_przebiegow_domyslne` 3 (:4791),
  `przebiegi_wygladzania` 12 (:4852), `prog_sasiadow_ladu` 4 (:4858), `szerokosc_wybrzeza_domyslna` 2 (:4844),
  `prog_sasiadow_morza` 5 (:4930).
- Audyt literalow w kodzie portu (sekcja P6.M06B1 landsea.rs): brak progow i mnoznikow; jedyne stale to `0`, `1`
  (liczniki, `== 0`, `+= 1`), `0usize` jako start licznika. Test `coast_table_values_match_web_literals` pilnuje, by
  wartosci JSON byly rowne literalom z weba.
- Funkcje web uzywaja z `Math.*` WYLACZNIE: `Math.floor` (1x w `maxOceanBayDepth`), `Math.min`, `Math.max`
  (`maxOceanBayDepth`). Brak `sin/cos/pow/atan2/hypot` w zakresie. Port: `f64::floor`, `js_min`, `js_max`
  (`masks::v8math`), `js_max`/`js_min` nie zmienione (jadro `k_sin/k_cos/rem_pio2` NIE dotkniete).
- `Math.random`: w zakresie 4649-4939 brak wywolan.

## 4. Dryf po pinie (zakres 4649-4939)

- `git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 24 wstawienia, 16 usuniec; hunki w liniach
  5992, 8466, 10352, 10392, 10541, 10693, 10776, 10804 (`origin/main` = `7d7c7d60`).
- **0 hunkow w zakresie 4649-4939.** Wektory z pinu `edb8fb56` (zgodnie z dispatchem); odswiezenie przy osobnym temacie.

## 5. Zalozenia (luki rozstrzygniete ZALOZENIEM)

1. Klucze heksow kanoniczne `"q,r"` z calkowitych wspolrzednych; klucz niekanoniczny jest pomijany tam, gdzie web
   dawalby `NaN` (wynik identyczny: zaden heks nie trafia do wyniku).
2. Rust zawsze modeluje pole rzeki (`river_present`, `river_edges`); web `hex.rzeka?.obecna` przy braku pola (undefined)
   NIE jest w wektorach (NIE-DOTYCZY: brak takiego stanu w modelu Rust).
3. Wektory: mapy losowe (blob lądu, mulberry32 seed `20261030`) + mapy graniczne 7x7 (srodek i 6 sasiadow sterowane).
4. `purgeReliefValleyWater` sprawdza `hex.coords`; w portu uzywane `hex.q/hex.r` (canonical = klucz).
5. Liczba przebiegow `finalizeCoastAndInlandWater` i `thicken` (a) - patrz sekcja 6 (luki).

## 6. Pomiar trafien granic (wektory, generator `gen-m06b1-vectors.mjs`, stats w `web-vectors.json`)

Liczby = dokladne trafienia wartosci (`==`) w wejsciu kazdego przypadku (generator, `stats`).

| Porownanie (prog N) | N-1 | N | N+1 | Uwagi |
|---|---|---|---|---|
| `morzeN >= 5` (flatten; Plytkie bez rzeki, nie-brzeg) | 80 (==4) | 60 (==5) | 31 (==6) | pelne pokrycie N-1/N/N+1 |
| `sasiedzi lądu >= 4` (thicken a; Morze, nie-brzeg) | 203 (==3) | 164 (==4) | 120 (==5) | pelne pokrycie |
| `reliefN >= 2` (purge; woda, bez filtra BFS) | 1631 (==1) | 731 (==2) | 323 (==3) | liczone na wejsciu wszystkich map |
| `dryN >= 3` (purge; woda, bez filtra BFS) | 2112 (==2) | 955 (==3) | 593 (==4) | j.w. |
| `floor(min(w,h)/6)` vs dolny limit 4 (ocean) | 18 (==3) | 18 (==4) | 18 (==5) | |
| `floor(min(w,h)/6)` vs gorny limit 16 (ocean) | 33 (==15) | 12 (==16) | 12 (==17) | |
| `maxPasses` (finalize), przebiegi 1..5 | 0 roznic | - | - | **LUKA**: wynik identyczny dla 1..5 na 60 mapach |
| `przebiegi_wygladzania` = 12 (thicken a) | - | - | - | **NIE_ZMIERZONO**: brak instrumentacji webu |

Pokrycie wektorow (liczba przypadkow): ocean 330, purge 228, trim 80, finalize 420, thicken 296, flatten 88 (razem 1442);
mapy 530; plik `tests/p6_m06b1_vectors/web-vectors.json` 7 173 573 B (< 10 MB), SHA-256 `2f9f203904b36cbbcaa710a8d26bfd76eacc6f4e5f3c78a11539f05c291ae919`.
Wynik nietrywialny: ret>0 w purge 140/228, trim 65/80, thicken 292/296, flatten 40/88; stan finalize zmieniony w 420/420.

## 7. Ryzyka / do Evaluatora

- **Luka `maxPasses`**: przebiegi 2+ nie zmieniaja wyniku na zebranych mapach, wiec granica N-1/N/N+1 dla
  `maxPasses` NIE jest pokryta. Wymaga map, w ktorych sanityzacja/pierscien tworza nowa wode srodladowa lub
  morze dotykajace lądu (kolejna runda: generator zlozonych zatok). Nie zamykane tutaj (zakaz wydluzania rundy).
- Limit `przebiegi_wygladzania` (12) nie jest mierzony (NIE_ZMIERZONO); wektory nie sprawdzaja, czy cap 12 jest kiedykolwiek osiagany.
- Funkcje `trimDeepOceanBays` i `trimEnclosedOceanOnly` maja identyczne cialo w webie; port deleguje (dowod: ten sam
  kod, `gra/src/map/gen-helpers.ts:4761-4772` vs `:4701-4712`).
- Mutacje (wymagane przez R-PROC) NIE wykonane w r1; zostaja dla Operator-pomiary.

## 8. Ograniczenia zakresu

- Symbole M06B2 (`removeTinyLandIslands` :4946 i dalej) poza tematem; ich port wymaga osobnego ID.
- Brak zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`, `domain/mod.rs`,
  `tests/p6_m00_skeleton.rs`; brak zmian istniejacych testow.
