# P6.M06B1 - finalizacja wybrzeza i wod srodladowych, partia 1 (port `gen-helpers.ts`:4649-4939 do Rust)

Temat: `R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1` · DOMAIN: GAME · RUNDA 2/5 (Operator-impl; poprawka po FC r1: NAPRAW 1 cap 12, NAPRAW 2 weryfikator Python).
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
- Mutacje i pomiary granic: wykonane w Operator-pomiary r1, patrz §9 (niezalezny weryfikator w Pythonie NIE zbudowany, §9.5).

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
- **Zakres 3186-4374 (runda 2):** `git diff -U0 edb8fb56 origin/main -- gra/src/map/gen-helpers.ts | grep "^@@"`
  daje hunki tylko w liniach 5995, 8470, 10357, 10398, 10548, 10701, 10785, 10814 (nowe). **0 hunkow w 3186-4374.**
  Wektory M06B1 (z pinu) nie wymagaja odswiezenia pod katem tego zakresu.

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
| `maxPasses` (finalize), przebiegi 1..5, pula null | 0 roznic | - | - | wynik identyczny dla 1..5 (60 map) - dotyczy TYLKO puli null |
| `maxPasses` (finalize), pula 2 | roznica out(2) != out(1) | - | - | sprawdzone w §9 (fin-7-pool2, fin-32-pool2, bnd-fin-pool2-*) |
| `przebiegi_wygladzania` = 12 (thicken a) | naturalnie 25 przebiegow (§9) | - | - | cap NIE zmienia wyniku koncowego na zmierzonych mapach (§9) |

Pokrycie wektorow (liczba przypadkow): ocean 330, purge 228, trim 80, finalize 420, thicken 296, flatten 88 (razem 1442);
mapy 530; plik `tests/p6_m06b1_vectors/web-vectors.json` 7 173 573 B (< 10 MB), SHA-256 `2f9f203904b36cbbcaa710a8d26bfd76eacc6f4e5f3c78a11539f05c291ae919`.
Wynik nietrywialny: ret>0 w purge 140/228, trim 65/80, thicken 292/296, flatten 40/88; stan finalize zmieniony w 420/420.

## 7. Ryzyka / do Evaluatora

- **Luka `maxPasses`**: ZAMKNIETA dla N=3 w §9.3 (N-1 i N+1 rozrozniane wektorami z weba); pozostaje tylko dowod ogolny.
- Limit `przebiegi_wygladzania` (12): OBSERWOWALNY (runda 2, §9.6). Mapa z 302 z 1500 losowych map (LCG 12345)
  daje inny stan koncowy dla cap 11 i cap 13 niz dla cap 12; wektory `web-cap.json` + test `p6_m06b1_cap.rs`
  zabijaja M16 i M17. Hipoteza r1 "cap nieobserwowalny" byla FALSZYWA (wynikala ze zbyt slabego hill-climb).
- Funkcje `trimDeepOceanBays` i `trimEnclosedOceanOnly` maja identyczne cialo w webie; port deleguje (dowod: ten sam
  kod, `gra/src/map/gen-helpers.ts:4761-4772` vs `:4701-4712`).
- Mutacje: wykonane (28 mutacji, §9.1); przezywaja 3 rownowazne z dowodem (M12, M19, M20; §9.1). M16/M17 (cap 11/13)
  ZABITE w rundzie 2 (§9.6, logi `mut-logs/r2-M16-cap11.log`, `mut-logs/r2-M17-cap13.log`, EXIT=101).

## 8. Ograniczenia zakresu

- Symbole M06B2 (`removeTinyLandIslands` :4946 i dalej) poza tematem; ich port wymaga osobnego ID.
- Brak zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`, `domain/mod.rs`,
  `tests/p6_m00_skeleton.rs`; brak zmian istniejacych testow.

## 9. Operator-pomiary r1 (odpowiedz na zarzuty; baza kodu = deb8055e, bez zmian w `landsea.rs`)

Dodane w tej rundzie: `tests/p6_m06b1_boundary.rs` (3 testy), `tests/p6_m06b1_vectors/web-boundary.json`
(generator `gen-m06b1-boundary-vectors.mjs`, wejscia = `evidence-*.out`), `mut-runner-m06b1.py`,
`mut-results-m06b1-r1.json`, `mut-logs/*.log`, `m06b1-*-search.mjs` (pomiary). Stare wektory
`web-vectors.json` NIEZMIENIONE. Oracle = prawdziwy kod weba (pin `edb8fb56`), bez reimplementacji.

### 9.1 Mutacje (28; kazda: dokladnie 1 wystapienie, przywrocenie pliku zweryfikowane sha256)

- Zabite (23): M01-M11, M13, M14, M15, M18, M21-M28. Ocean (M01-M02), purge (M03-M08), finalize (M09-M11,
  M13, M14, M27, M28), thicken (M15, M18, M21), flatten (M22, M23), tabela JSON (M24-M26). Logi: `mut-logs/`.
- Przezyly (5):
  - **M12** (usuniety `if changed == 0 { break }` w `finalize_coast_and_inland_water`, landsea.rs:2105):
    RÓWNOWAZNA. Kazdy helper zwraca liczbe heksow, ktorych TERRAIN faktycznie zmienil: `remove_inland_water_pools`
    (l.365: `inland.len()`, kazdy heks woda -> Laka), `apply_double_coast_ring` (l.201: `n + to_coast.len()`,
    Morze -> Plytkie), `sanitize_coast_hexes` (l.246: `orphans.len()`, Plytkie -> Morze),
    `remove_small_inland_water_pools` (l.414: `converted`, woda -> Laka). Zadna z tych funkcji nie uzywa RNG.
    Zatem `changed == 0` <=> stan bitowo bez zmian; kolejne przebiegi sa no-opami; wynik identyczny.
    Web: `gra/src/map/gen-helpers.ts:4787-4822` (ten sam argument w komentarzu przy `changed`; break web :4820).
  - **M19** (usuniety `if to_fill.is_empty() { break }`, thicken (a), landsea.rs:2157): RÓWNOWAZNA. Pusty `to_fill`
    nie zmienia stanu ani `changed`; kolejna iteracja liczy ten sam pusty zbior (funkcja czysta). Web :4860.
  - **M20** (usuniety `if to_coast.is_empty() { break }`, thicken (b), landsea.rs:2198): RÓWNOWAZNA, ten sam dowod. Web :4891.
  - **M16 / M17** (cap `przebiegi_wygladzania` 12 -> 11 / 13): NIE ZABITE, NIE DOWIEDZIONE. Patrz §9.2.

### 9.2 Limit `przebiegi_wygladzania` = 12 (thicken (a)) - ROZSTRZYGNIETE w rundzie 2

- Pomiar r1 (`evidence-thicken-uncapped-search.out`, W=11, H=22): naturalnie 25 przebiegow czesci (a). Mapa z
  r1 (`bnd-thick-natural25-default`) NIE rozrozniala capu (cap 11/12/13 dawaly ten sam stan) - to byl SLABY dowod
  ("cap nieobserwowalny"), ktory FC obalil (`03-final-control.md`, zarzut 4).
- Runda 2, pomiar: `m06b1-r2-cap-search.mjs` (3 kopie prawdziwego kodu weba, pin `edb8fb56`; jedyna zmiana
  `gen-helpers.ts:4852` `pass < N`, N = 11 / 12 (pristine) / 13; kopie w `$HOME`-tmp poza repo). Generator map:
  LCG Numerical Recipes, ziarno 12345, W,H in [20..49], p = P(morze) in [0.25..0.55], 1500 map.
  Wynik (`evidence-r2-cap-both.json`, `summary` w pierwszej linii wyjscia): cap11 != cap12 na **379** mapach,
  cap13 != cap12 na **302** mapach, **oba jednoczesnie na 302**. Pierwsza mapa z obiema roznicami: m=5,
  W=32, H=40, p=0.4866; cap11 zmienia 1 heks, cap13 zmienia 1 heks (`ret` = 604 we wszystkich trzech).
- Wektory: `gen-m06b1-cap-vectors.mjs` -> `tests/p6_m06b1_vectors/web-cap.json` (270 KB). Przypadek
  `cap-thick-m0-cap12` (mapa powyzej) z wynikiem cap 12 z weba; flagi `ref_cap11` / `ref_cap13`
  (`differs_from_cap12 = true`, sha256 stanu) jako dane referencyjne. Mapy `cap-thick-m1..m3` (naturalne z LCG)
  nie rozrozniaja capu (flagi false) - zachowane jako ogolne wektory.
- Test Rust `tests/p6_m06b1_cap.rs` (2 testy): (1) stan i zwrot `thicken_coast_and_smooth_inlets_default` == wynik
  weba cap 12; (2) flagi obserwowalnosci capu z weba.
- Mutanty (reczne, runda 2, `rust-port/engine/data/derived/mapgen-coast.json`, sed `wartosc: 12` -> 11 / 13, przywrocenie
  `cmp`-identyczne): **M16 (cap 11) ZABITY** (`mut-logs/r2-M16-cap11.log`, EXIT=101, FAILED
  `cap12_thicken_maps_match_web_cap12`); **M17 (cap 13) ZABITY** (`mut-logs/r2-M17-cap13.log`, EXIT=101).
- Dowod z kodu (dlaczego port jest zgodny z capem 12): `landsea.rs` `thicken_coast_and_smooth_inlets` iteruje
  `0..p.przebiegi_wygladzania.wartosc` (wartosc z JSON = 12 = literal webu `:4852`), a przerwanie `if to_fill.is_empty()`
  odpowiada `if (toFill.length === 0) break;` (web). Zrodlo prawdy dla wartosci: `data/derived/mapgen-coast.json`
  pole `zrodlo_web` i test `coast_table_values_match_web_literals`.
- STATUS 9.2: ZAMKNIETE (zarzut FC 4 - NAPRAW 1 wykonany).

### 9.3 Granica `maxPasses` (domyslnie 3)

- Pula null: out(p) == out(p-1) dla p=2..5 na 3000 losowych mapach (`m06b1-boundary-search.mjs`) i na 60 mapach
  generatora. Dotyczy TYLKO puli null (poprzednie zdanie "0 roznic" nie obejmowalo puli).
- Pula 2: out(2) != out(1) na 1/3000 losowych map; out(3)==out(2) i out(4)==out(3) na calym zbiorze.
- Wektory z weba (istniejace w `web-vectors.json`, sprawdzone bezposrednio przez web, pula 2):
  - `fin-7-pool2`: out(2) != out(3) (= N-1 dla N=3); out(3) = out(4) = out(5). Zabija M27 (min(2)).
  - `fin-32-pool2`: out(3) != out(4) (= N+1 dla N=3). Zabija M28 (N=3 -> 4).
  - Granica N=1/2: `bnd-fin-pool2-p1` != `bnd-fin-pool2-p2` (nowe wektory). Zabija M09, M10, M11.
- Wniosek: granica N-1/N/N+1 dla maxPasses=3 pokryta wektorami zrodlowymi z weba. Sprzecznosc z zarzutu wyjasniona:
  min(1) byl zabity przez przypadki puli 2, nie przez pule null.
- Uwaga o logach: surowe logi cargo zapisuje runner dopiero od M21 (`mut-logs/`); wyniki M01-M20 sa w
  `mut-results-m06b1-r1.json` (pola `rc`, `wyniki`, `failed_tests`, `przywrocono`).

### 9.4 Bramki (commit z tym dokumentem; logi surowe z `EXIT=`)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r1.log`).
- `cargo clippy --offline --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r1.log`).
- `cargo test --offline --no-fail-fast`: EXIT=0, 1436 passed, 0 failed (`gate-test-r1.log`); 1433 z impl + 3 nowe.
- `git diff --check`: EXIT=0.
- Test M06B1 (ocean, coast, tables, boundary) na kodzie bazowym: wszystkie zielone.

### 9.5 NIE zrobione (jawnie; stan po rundzie 2)

- Niezalezny weryfikator w Pythonie: ZBUDOWANY w rundzie 2 (§9.6), patrz nizej.
- Scalanie kategorii wektorow jako PREFIKS (cmp-vectors): NIE zrobione; nowe wektory w osobnym pliku.
- M16 / M17 (cap 11/13): ZABITE w rundzie 2 (§9.2).
- Dryf po pinie (§4) bez zmian; odswiezenie wektorow poza zakresem.

### 9.6 Runda 2 (poprawka po Final Control r1: NAPRAW 1 i NAPRAW 2)

**Baza:** `origin/backup/m06b1-f8cc5781` (= `f8cc5781`: kod `deb8055e`, pomiary `bf5e7ad1`, raport FC). Kod `landsea.rs`
w rundzie 2 NIE zmieniony (wszystkie zmiany: pliki testowe, wektory, dokument, logi).

**NAPRAW 1 (cap 12 obserwowalny):** §9.2. Nowe pliki: `m06b1-r2-cap-search.mjs`, `gen-m06b1-cap-vectors.mjs`,
`evidence-r2-cap-both.json`, `tests/p6_m06b1_cap.rs`, `tests/p6_m06b1_vectors/web-cap.json`.

**NAPRAW 2 (niezalezny weryfikator Python):** `verify-m06b1-r2.py` (stdlib, `python3 -I`). Implementacja
napisana OD ZERA z tekstu TS pina `edb8fb56` (`gra/src/map/gen-helpers.ts`; linie w komentarzach kodu), bez
czytania `landsea.rs`. Zakres: 6 symboli M06B1 + helpery (`oceanConnectedWaterKeys`, `morseDepthFromMapBorder`,
`removeInlandWaterPools`, `removeSmallInlandWaterPools`, `applyCoastRing`, `applyDoubleCoastRing`,
`sanitizeCoastHexes`, `findDryLandTouchingSea`, `isInMapBorder`, `countLandNeighbors`). Kolejnosc iteracji
wstawiania zachowana (`purgeReliefValleyWater` zmienia stan w trakcie petli - kolejnosc ma znaczenie).
Wynik (`verifier-python-r2.txt`, EXIT=0):

| Kategoria | Sprawdzone | Rozbieznosci | Nietrywialne (stan zmieniony) |
|---|---|---|---|
| ocean (maxOceanBayDepth) | 330 | 0 | - |
| purge | 228 | 0 | 140 |
| trim | 80 | 0 | 65 |
| finalize | 420 | 0 | 420 |
| thicken | 296 | 0 | 292 |
| flatten | 88 | 0 | 40 |
| granice thicken / finalize | 1 / 10 | 0 / 0 | 1 / 10 |
| cap 12 (state + ret) / flagi cap 11 i 13 (sha256 stanu z weba) | 4 / 4+4 | 0 | 4 / 1 |
| **RAZEM** | **1469** | **0** | |

Weryfikator odtwarza flagi `ref_cap11` / `ref_cap13` z weba (ten sam wynik: cap 11 i 13 roznia sie od 12 na
mapie `cap-thick-m0`, identyczne na pozostalych), wiec potwierdza obserwowalnosc capu takze niezaleznie.

**Bramki (runda 2, logi z `EXIT=`, w katalogu runu):**
- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r2.log`).
- `cargo clippy --offline --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r2.log`).
- `cargo test --offline --no-fail-fast`: EXIT=0, **1438 passed, 0 failed** (`gate-test-r2.log`; 1436 z r1 + 2 nowe
  w `p6_m06b1_cap.rs`). Zero zmian w istniejacych testach.
- `git diff --check`: sprawdzane przy commicie.

**Ryzyka i luki (jawnie):**
- Weryfikator i port korzystaja z tych samych wektorow (`web-*.json`); wektory pochodza z weba, wiec nie sa
  niezalezne od weba (to wlasciwa wartosc referencyjna). Niezaleznosc dotyczy implementacji, nie danych.
- Pomiar trafien na granicach (N-1/N/N+1) dla capu 11/12/13: cap jest petla bez porownania progowego; granica
  "przebieg 12 vs 13" jest pokryta mapa `cap-thick-m0` (cap 13 zmienia stan). Cap 11 pokryty ta sama mapa.
- Mutacje M01-M28 NIE powtorzone w rundzie 2 (poza M16/M17); wynik r1 (23 zabite + 3 rownowazne) pozostaje.
- Dryf po pinie (§4): zakres 3186-4374 bez zmian; wektory nadal z `edb8fb56`.
