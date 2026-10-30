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

## Operator-pomiary r1 (R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1, runda pomiarowa)

Ta sekcja zastepuje pozycje "NIE ZMIERZONO" z Operatora-impl. Kod `landsea.rs` nie zostal zmieniony.
Dodano: wektory uzupelniajace (`tests/p6_m06a8_vectors/pomiary-r1-vectors.json`, 39 przypadkow,
generator `gen-m06a8-pomiary-vectors.mjs`), testy `tests/p6_m06a8_pomiary.rs` (3 testy), weryfikator
niezalezny `verify-m06a8-independent.py`, mut-runner `mut-runner-m06a8-r1.py`. Wszystko w run dir.

### Weryfikator niezalezny (Python, bez Rust)

- Implementacja `groupDryLandMassKeys` i `ensurePangeaSingleContinent` z zrodla TS pina `edb8fb56`.
  HEX_DIRECTIONS i predykat wody czytane regexem z `gra/src/map/gen-helpers.ts`.
- `ensure-vectors.json` (418): 0 rozbieznosci (`verify-ensure-r1.log`).
- `pomiary-r1-vectors.json` (39): 0 rozbieznosci (`verify-pomiary-r1.log`).
- Generator wektorow odtworzony z pina: `ensure-vectors.json` byte-identyczny z commitowanym.

### Pomiar trafien na granicach (verifier, coverage)

- Mosty `granica-mostu`: trafienie BFS przy d = N-1 (70 przyp.), d = N (70), d = N+1 pominiete (70).
- Prog masy `prog-masy`: rozmiar obcej masy T-1 / T / T+1 dla kazdej z 4 mas glownych.
- Iteracje: 34 przypadki `losowe` wykonuja pelne 12 iteracji (cap 12 osiagniety; wiazanie potwierdza mutant E08/E09 zabity wektorami).
- Zapas sciezki (`pathLen <= N+2`): 0 trafien w starych wektorach (patrz dowod nizej).
- Rozklad N w starych wektorach: wylacznie N = 18 (35 map kwadratowych 6..40). Gorny clamp 48 i N > 18
  nie byly pokryte. Dodano rodziny `skala-N` (N = 19, 20, 23, 45, 46, 48) i `iter-gap`.

### Mutacje (38 unikalnych; 49 wierszy w `mut-results-r1.jsonl` z powtorkami po dopisaniu wektorow)

Wynik koncowy: 32 KILLED, 6 SURVIVED, wszystkie 6 z dowodem rownowaznosci z kodu.

- Zabite: sasiedztwo grupowania (G01-G05 w tym niekanoniczny klucz rozwijany jak (0,0)), granica N
  (E01/E02), clampy N (E03/E04), zaokraglenie i wspolczynniki N (E05-E07), iteracje 11/13 (E08/E09),
  sortowanie (E12), dist/dubel BFS (E14/E15), przerwanie BFS (E16), odwrocone warunki (E17/E23),
  sciezka (E18, E20 cap N-2 przez `iter-gap`, E28, E30, E31), limit obcej masy (E24-E26, E29),
  P01 (tylko Sea), P02 (suchy = nie-Morze).
- Przezyte, z dowodem:
  - E10 `masses.len() <= 0`: dla 1 masy brak obcej suchej komorki, wiec `hit` = None i nic sie nie
    zmienia; dla 0 mas break jak w oryginale.
  - E13 seed bez `dist.contains_key`: duplikaty w kolejce maja ten sam dist=1; parent nadpisany innym
    glownym kluczem, a sciezka konwertuje ta sama komorke wodna i przerywa na glownej masie.
  - E19 (cap N+1) i E21 (cap N+7): przetworzona komorka wodna ma pathLen <= d_hit-1 <= N-1, wiec cap
    >= N-1 nigdy nie wiaze. Wartosc `bridge_zapas_sciezki` (JSON = 2) nie wplywa na wynik dla dowolnej
    wartosci >= -1 (ustalenie: martwy parametr, bez zmiany web).
  - E22 brak przerwania na glownej masie: klucze glownej masy sa suche i nigdy nie sa w `parent`
    (parent zawiera tylko wodne komorki z BFS), wiec `parent.get` zwraca None.
  - E27 brak testu suchego ladu przy usuwaniu obcej masy: obca masa pochodzi z grupowania tej samej
    iteracji i w tym bloku nic nie zmienia hexow przed petla, wiec warunek jest zawsze prawdziwy.

### Dryf po pinie (zweryfikowany)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow, pierwszy `-5992`, ostatni
`-10804`. Zaden hunk nie wpada w zakres 3186-4374. Pin nie przepinany.

### Wplyw na symbole

- `groupDryLandMassKeys`: PORTOWANY, zweryfikowany niezaleznie (418 + 39 przypadkow, 0 rozbieznosci).
- `ensurePangeaSingleContinent`: PORTOWANY Z HAKIEM (RUNDA-2 `fillPangeaAnnularSeaCorridors` :4595),
  bez zmian wzgledem Operatora-impl; zakres pelnej rownowaznosci nadal wymaga RUNDA-2.

### Ograniczenia

- Brak zmian w allowliscie kodu. Nowe pliki: tylko testy `p6_m06a8_pomiary.rs`, wektory pomiary-r1,
  run dir i ten dokument.
- Iteracje kolejnosci Object.keys: web zwraca klucze liczbowe najpierw (np. "5"), Rust nie. Wszystkie
  klucze hexow maja postac "q,r" (NIE DOTYCZY w produkcji), wektory nie zawieraja kluczy liczbowych.
