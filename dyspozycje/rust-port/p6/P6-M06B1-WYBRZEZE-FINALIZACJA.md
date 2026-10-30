# P6.M06B1 - finalizacja wybrzeza i wod srodladowych, partia 1 (port `gen-helpers.ts`:4649-4939 do Rust)

Temat: `R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1` · DOMAIN: GAME · RUNDA 3/5 (Operator-impl; poprawka po FC r2: zarzuty 1-5).
Zakres partii 1 (6 symboli): `maxOceanBayDepth` :4649, `purgeReliefValleyWater` :4724, `trimDeepOceanBays` :4761,
`finalizeCoastAndInlandWater` :4787, `thickenCoastAndSmoothInlets` :4840, `flattenFalseCoastalRiverNotches` :4915.
Partia M06B2 (`removeTinyLandIslands` :4946 ... `enforceTargetDryLandFraction` :5079) - poza tym tematem.

Baza rundy 3: `c92ba394` (Operator-pomiary r2; kod `6b695cb8`, raport `298f004e`). Pin web: `edb8fb56`.
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/`.

## 0. Status (stan po rundzie 3)

- 6 symboli partii PORTOWANE (kod + testy + wektory z uruchomionego weba, 0 rozbieznosci bitowych, w tym nakladka na wodzie).
- Testy M06B1: `p6_m06b1_ocean` 2, `p6_m06b1_coast` 7, `p6_m06b1_tables` 2, `p6_m06b1_boundary` 3, `p6_m06b1_cap` 3,
  `p6_m06b1_overlay` 2. `cargo test --offline --no-fail-fast`: **1441 passed, 0 failed** (= 1438 z rundy 2 + 1 (cap: 3 testy zamiast 2) + 2 (overlay)).
- Bramki (surowe logi, `EXIT=`): fmt `gate-fmt-r3.log` EXIT=0; clippy `--all-targets -D warnings` `gate-clippy-r3.log` EXIT=0;
  test `gate-test-r3.log` EXIT=0.
- Weryfikator Python `verify-m06b1-r3.py`: **1868 sprawdzonych, 0 rozbieznosci** (`verifier-python-r3.txt`, EXIT=0).
- Mutacje: **31** (M01-M31), **28 zabitych**, 3 przezyte i udowodnione rownowazne (M12, M19, M20; §9.1).
- Prefiks wektorow: stare kategorie sa prefiksem nowych (`check-prefix-m06b1-r3.py`, `prefix-check-r3.txt`, WYNIK: PREFIKS ZACHOWANY).

## 1. Symbole zakresu - status

| Symbol web (gen-helpers.ts) | Rust (`mapgen/landsea.rs`) | Status | Wektor / test |
|---|---|---|---|
| `maxOceanBayDepth` :4649 | `max_ocean_bay_depth` | PORTOWANY | `ocean` / `p6_m06b1_ocean` |
| `purgeReliefValleyWater` :4724 | `purge_relief_valley_water` | PORTOWANY | `purge` (+`purge-ov-*`) / `p6_m06b1_coast`, `p6_m06b1_overlay` |
| `trimDeepOceanBays` :4761 | `trim_deep_ocean_bays` (deleguje do `trim_enclosed_ocean_only`, M06A) | PORTOWANY | `trim` (+`trim-ov-*`) / `p6_m06b1_coast`, `p6_m06b1_overlay` |
| `finalizeCoastAndInlandWater` :4787 | `finalize_coast_and_inland_water` (+ `_default`) | PORTOWANY | `finalize` (+`fin-ov-*`) / `p6_m06b1_coast`, `p6_m06b1_boundary` |
| `thickenCoastAndSmoothInlets` :4840 | `thicken_coast_and_smooth_inlets` (+ `_default`, + `_with_passes`) | PORTOWANY | `thicken` (+`thick-ov-*`), `web-cap.json` / `p6_m06b1_coast`, `p6_m06b1_cap` |
| `flattenFalseCoastalRiverNotches` :4915 | `flatten_false_coastal_river_notches` | PORTOWANY | `flatten` (+`flat-ov-*`) / `p6_m06b1_coast`, `p6_m06b1_overlay` |
| progi i mnozniki (liczby) | `data/derived/mapgen-coast.json` (`mapgen_coast()`) | DANE (JSON) | `p6_m06b1_tables` |

Kod: `rust-port/engine/src/domain/mapgen/landsea.rs` (sekcja P6.M06B1 na koncu pliku), tabela:
`rust-port/engine/data/derived/mapgen-coast.json`, parser: `rust-port/engine/src/data/derived.rs` (dopisek na koncu).

Zmiana kodu w rundzie 3 (jedyna): `thicken_coast_and_smooth_inlets` deleguje do nowej funkcji
`thicken_coast_and_smooth_inlets_with_passes(hexes, w, h, coast_width, passes)`, ktora ma identyczna logike; limit
czesci (a) jest parametrem `passes` (wartosc domyslna = `przebiegi_wygladzania` z JSON = 12). Zachowanie dla
domyslnego wywolania nie zmienilo sie (potwierdza `p6_m06b1_coast` i `cap12_thicken_maps_match_web_cap12`).

## 2. Odstepstwa sygnatur od weba (logika 1:1)

- `maxOceanBayDepth(width, height)` -> `max_ocean_bay_depth(i64, i64) -> f64`; bufor brzegu = `terrain_class::map_border_width` (f64).
- `trimDeepOceanBays(hexes, width, height, _maxDepth?)` -> `trim_deep_ocean_bays(hexes, w, h)`. Parametr `_maxDepth` NIE jest
  czytany w ciele funkcji web (NIE-DOTYCZY). Cialo web jest tozsame z `trimEnclosedOceanOnly` (:4701), wiec port deleguje.
- `finalizeCoastAndInlandWater(hexes, w, h, maxPasses = 3, opts?)` -> `finalize_coast_and_inland_water(hexes, w, h, max_passes, Option<usize>)`.
- `thickenCoastAndSmoothInlets(hexes, w, h, coastWidth = 2)` -> `thicken_coast_and_smooth_inlets(hexes, w, h, coast_width)`.
- `flattenFalseCoastalRiverNotches` -> zwraca liczbe zamienionych heksow (web zwraca `toFlatten.length`).
- Tablica heksow: `Record<string, Hex>` -> `HexRecord` (kolejnosc wstawiania = `Object.entries`). Klucze `"q,r"` kanoniczne.
- Sekwencyjne mutacje (purge, thicken) czytaja stan na biezaco, jak w JS.

## 3. Dane vs kod

- `data/derived/mapgen-coast.json`: 10 lisci, kazdy z `zrodlo_web` (`gra/src/map/gen-helpers.ts:<linia>`):
  `dzielnik_skali` 6 (:4651), `bufor_min_dodatek` 2 (:4652), `bufor_gorny_dodatek` 14 (:4652),
  `min_sasiadow_rzezby` 2 (:4746), `min_sasiadow_suchych` 3 (:4746), `max_przebiegow_domyslne` 3 (:4791),
  `przebiegi_wygladzania` 12 (:4852), `prog_sasiadow_ladu` 4 (:4858), `szerokosc_wybrzeza_domyslna` 2 (:4844),
  `prog_sasiadow_morza` 5 (:4930).
- Audyt literalow w kodzie portu (sekcja P6.M06B1): brak progow i mnoznikow; test `coast_table_values_match_web_literals`.
- Funkcje web uzywaja z `Math.*` WYLACZNIE: `Math.floor` (1x w `maxOceanBayDepth`), `Math.min`, `Math.max` (`maxOceanBayDepth`).
  Port: `f64::floor`, `js_min`, `js_max` (`masks::v8math`). Jadro `k_sin/k_cos/rem_pio2` NIE dotkniete.
- `Math.random`: w zakresie 4649-4939 brak wywolan.

## 4. Dryf po pinie (zakres 4649-4939)

- `git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: hunki poza zakresem 4649-4939 (patrz runda 1/2).
  **0 hunkow w zakresie 4649-4939 i 0 w zakresie 3186-4374.** Wektory z pinu `edb8fb56`; odswiezenie przy osobnym temacie.

## 5. Zalozenia (luki rozstrzygniete ZALOZENIEM)

1. Klucze heksow kanoniczne `"q,r"` z calkowitych wspolrzednych.
2. Rust zawsze modeluje pole rzeki (`river_present`, `river_edges`); web `hex.rzeka?.obecna` przy braku pola NIE jest w wektorach (NIE-DOTYCZY).
3. Wektory: mapy losowe (blob lądu, mulberry32 ziarno `20261030`), mapy graniczne 7x7, mapy z nakladka (ziarno `20261031`), mapy cap (LCG 12345).
4. `purgeReliefValleyWater` sprawdza `hex.coords`; w portu uzywane `hex.q/hex.r` (canonical = klucz).
5. Limit `przebiegi_wygladzania` i `maxPasses`: patrz §9.2 i §9.3.
6. Nakladka: w zbiorze wektorow wystepuja tylko `brak` i `las` (`common.rs`: `nakladka_from`). Inne wartosci Nakladka
   (zloza) nie wystepuja na heksach wodnych w zakresie funkcji (web tylko je zeruje). Zalozenie: wystarcza `las`,
   bo kod resetuje nakladke bez wzgledu na jej wartosc (ten sam wzorzec przypisania `overlay = Brak`).

## 6. Pomiar trafien granic i pokrycia (wektory; stats z `gen-m06b1-vectors.mjs`)

Liczby = dokladne trafienia wartosci (`==`) w wejsciu kazdego przypadku (generator, `stats`). Stare liczniki sa identyczne
w r2 i r3 (`check-prefix-m06b1-r3.py`: `stats (stare liczniki): IDENTYCZNE`).

| Porownanie (prog N) | N-1 | N | N+1 | Uwagi |
|---|---|---|---|---|
| `morzeN >= 5` (flatten; Plytkie bez rzeki, nie-brzeg) | 80 (==4) | 60 (==5) | 31 (==6) | pelne pokrycie N-1/N/N+1 |
| `sasiedzi lądu >= 4` (thicken a; Morze, nie-brzeg) | 203 (==3) | 164 (==4) | 120 (==5) | pelne pokrycie |
| `reliefN >= 2` (purge; woda, bez filtra BFS) | 1631 (==1) | 731 (==2) | 323 (==3) | liczone na wejsciu wszystkich map |
| `dryN >= 3` (purge; woda, bez filtra BFS) | 2112 (==2) | 955 (==3) | 593 (==4) | j.w. |
| `floor(min(w,h)/6)` vs dolny limit 4 (ocean) | 18 (==3) | 18 (==4) | 18 (==5) | |
| `floor(min(w,h)/6)` vs gorny limit 16 (ocean) | 33 (==15) | 12 (==16) | 12 (==17) | |
| `maxPasses` (finalize), pula 2 | out(2) != out(1) | out(3) = out(2) | out(4) = out(3) | §9.3: wektory `fin-7-pool2`, `fin-32-pool2`, `bnd-fin-pool2-*` |
| `przebiegi_wygladzania` = 12 (thicken a) | cap 11: rozny stan na **10 z 10** map rozroznialnych | cap 12 = oracle | cap 13: rozny stan na **10 z 10** map | §9.2 (poprzednio blednie: "cap nie zmienia wyniku" - ODWOLANE) |

Pokrycie wektorow (liczba przypadkow, runda 3): ocean 330, purge 278, trim 130, finalize 520, thicken 396, flatten 138
(razem 1792 w `web-vectors.json`); granice 11 (`web-boundary.json`); cap 39 wynikow (13 map x 3 limity) + 26 flag (`web-cap.json`).
Razem sprawdzone przez weryfikator Python: **1868**.
Przypadki z nakladka na wodzie (`*-ov-*`, runda 3): purge 50, trim 50, flatten 50, thicken 100, finalize 100;
heksy wodne z `las` w wejsciu: 1351. Przypadki, w ktorych web zmienia nakladke heksa wodnego las -> brak razem z terenem
(obserwowalny reset): purge 30, trim 31, flatten 8, thicken 100, finalize 100 (liczone przez `verify-m06b1-r3.py`).
Mapy: 580 (530 starych + 50 z nakladka); `web-vectors.json` 8 404 764 B (< 10 MB), SHA-256
`82e26b37e85ebe9ced3451af7f08119fab4fcc4f77f9ab0a4636203b6f03ee8d`.
`web-cap.json` 1 940 545 B, SHA-256 `144d6b50a33d44b153dec68485815e67cc53cca8a90ac80813561335b086710a`.

## 7. Ryzyka / do Evaluatora

- **Nakladka na wodzie** (zarzut FC 1): ZAMKNIETE w rundzie 3 (§9.4). Trzy resety nakladki (Q, L, N) sa zabite przez wektory
  z nakladka `las` na heksach wodnych (M29, M30, M31). Q dotyczy WYLACZNIE `purge` (`clear_hex_to_laka_with_river`);
  `trim` uzywa `trim_enclosed_ocean_only` (M06A, wlasny reset), ktory jest poza tym zakresem.
- **Dokument** (zarzut FC 2): ten dokument jest przepisany w calosci; nie zawiera juz sprzecznych twierdzen (§6, §9).
- **Prefiks** (zarzut FC 3): ZROBIONE (§9.5).
- **Pokrycie capu** (zarzut FC 4): ZROBIONE - 10 map rozroznialnych zamiast 1; testy porownuja KOD Rust z weba dla limitu
  11/12/13 (nie tylko flagi z JSON).
- **Niezaleznosc weryfikatora** (zarzut FC 5): oracle = wektory z weba (wlasciwa wartosc referencyjna wg dispatchu); niezaleznosc
  dotyczy implementacji. Weryfikator obejmuje nakladke (przypadki `*-ov-*`) i pelne stany cap 11/12/13. Dodatkowo wykonano
  test czulosci: kopie weryfikatora z usunietym resetem nakladki (Q/L/N) daja 30/8/100 rozbieznosci (§9.6).
- Limit `przebiegi_wygladzania` (12): OBSERWOWALNY (§9.2).
- Funkcje `trimDeepOceanBays` i `trimEnclosedOceanOnly` maja identyczne cialo w webie; port deleguje.

## 8. Ograniczenia zakresu

- Symbole M06B2 (`removeTinyLandIslands` :4946 i dalej) poza tematem; ich port wymaga osobnego ID.
- Brak zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`, `domain/mod.rs`,
  `tests/p6_m00_skeleton.rs`; brak zmian istniejacych testow (nowe pliki testow: `p6_m06b1_*`).
- Helpery M06A uzyte przez funkcje (`set_hex_to_laka`, `set_hex_to_morze`, `remove_inland_water_pools` i inne) NIE sa
  mutowane w tym temacie (sa DANE-JUZ-W-RUST z M06A/M04/M01); ich reset nakladki jest sprawdzany posrednio wektorami.

## 9. Historia i stan biezacy

### 9.1 Mutacje (stan biezacy: runda 3; `mut-results-m06b1-r3.json`, logi `mut-logs-r3/`)

Runner `mut-runner-m06b1.py`: kazda mutacja = dokladnie jedno wystapienie tekstu (inaczej blad), `cargo test` na szesciu
binarkach M06B1, przywrocenie pliku (sha256 przed = po). Wszystkie 31 plikow przywrocone (`przywrocono = True`).

- **Zabite (28):** M01-M11, M13-M18, M21-M28 oraz nowe M29, M30, M31.
  - Ocean (M01-M02); purge (M03-M07, M29); trim (M08); finalize (M09-M11, M13, M14, M27, M28);
    thicken (M15-M18, M21, M31); flatten (M22, M23, M30); tabela JSON (M24-M26).
- **Przezyte (3), rownowazne z dowodem** (ten sam kod co w r1/r2; refaktor r3 nie zmienil ich logiki):
  - **M12** (usuniety `if changed == 0 { break }` w `finalize_coast_and_inland_water`): kazdy helper zwraca liczbe heksow,
    ktorych TERRAIN faktycznie zmienil (`remove_inland_water_pools`: `inland.len()`; `apply_double_coast_ring`: `n + to_coast.len()`;
    `sanitize_coast_hexes`: `orphans.len()`; `remove_small_inland_water_pools`: `converted`). Zadna nie uzywa RNG.
    Zatem `changed == 0` <=> stan bitowo bez zmian, kolejne przebiegi sa no-opami. Web: `gen-helpers.ts:4787-4822`.
  - **M19** (usuniety `if to_fill.is_empty() { break }`, thicken (a)): pusty `to_fill` nie zmienia stanu ani `changed`;
    kolejna iteracja liczy ten sam pusty zbior (funkcja czysta). Web :4860.
  - **M20** (usuniety `if to_coast.is_empty() { break }`, thicken (b)): ten sam dowod. Web :4891.

### 9.2 Limit `przebiegi_wygladzania` = 12 (thicken (a)) - ZAMKNIETE w rundzie 3

- Pomiar (`m06b1-r2-cap-search.mjs`, runda 2, reprodukowany przez `m06b1-r3-cap-pick.mjs`): trzy kopie prawdziwego kodu
  weba (pin `edb8fb56`, jedyna zmiana `gen-helpers.ts:4852` `pass < N`, N = 11 / 12 / 13), 1500 map LCG 12345, W,H in [20..49],
  p = P(morze) in [0.25..0.55]. Wynik: cap11 != cap12 na **379**, cap13 != cap12 na **302**, oba na **302** map.
  Wybrano 10 pierwszych map z obiema roznicami: gen-indeksy **5, 6, 8, 15, 18, 26, 29, 37, 44, 62** (`cap-picks-r3.json`).
- Wektory: `gen-m06b1-cap-vectors.mjs` -> `tests/p6_m06b1_vectors/web-cap.json`: 13 map (10 rozroznialnych + 3 ogolne m=0..2),
  dla kazdej PELNE stany wyjscia weba dla cap 11, cap 12 (oracle) i cap 13 oraz flagi `differs_cap11` / `differs_cap13`.
- Kod: `thicken_coast_and_smooth_inlets_with_passes(..., passes)`; domyslna funkcja wola ja z JSON (12).
- Testy (`p6_m06b1_cap.rs`): (1) domyslna funkcja == web cap 12 na 13 mapach; (2) jawny limit 11 / 12 / 13 == web cap 11 / 12 / 13
  (stan + zwrot) na 13 mapach; (3) na 10 mapach rozroznialnych Rust daje rozny stan dla 11 i 13 wzgledem 12 (obliczone w Rust).
- Mutanty: M15 (limit 1), M16 (limit 11), M17 (limit 13) ZABITE; M16 i M17 przez testy (1)-(3); M24 (JSON 12 -> 11) przez
  `cap12_thicken_maps_match_web_cap12` i `coast_table_values_match_web_literals`.
- Dwa pierwsze zdania §9.2 z rundy 2 ("cap NIE zmienia wyniku" w §6) byly BLEDNE i zostaly odwolane (§6 ma teraz pomiar).

### 9.3 Granica `maxPasses` (domyslnie 3)

- Pula null: out(p) == out(p-1) dla p=2..5 na 3000 losowych mapach (`m06b1-boundary-search.mjs`) i na mapach generatora.
- Pula 2: out(2) != out(1) na 1/3000 losowych map; out(3)==out(2) i out(4)==out(3) na calym zbiorze.
- Wektory z weba: `fin-7-pool2` (out(2) != out(3), zabija M27), `fin-32-pool2` (out(3) != out(4), zabija M28),
  `bnd-fin-pool2-p1` != `bnd-fin-pool2-p2` (zabija M09, M10, M11). Granica N-1/N/N+1 dla maxPasses=3 pokryta wektorami z weba.

### 9.4 Nakladka na wodzie - ZAMKNIETE w rundzie 3 (zarzut FC 1)

- Generator (`gen-m06b1-vectors.mjs`, sekcja 7, ziarno `20261031`, dopisana NA KONCU; stare kategorie i mapy nietkniete):
  50 map losowych (30 rownomiernych 7..12 x 7..12, 20 morskich 60% Morze / 25% Plytkie / 15% Laka) z nakladka `las`
  na ~50% heksow wodnych; dla kazdej mapy: purge, trim, flatten, thicken (domyslny i coastWidth 3), finalize (p3 i pula 2).
- Nowe mutanty (runner, runda 3): **M29** (Q: `clear_hex_to_laka_with_river` bez `overlay = Brak`) ZABITY przez
  `purge_relief_valley_water_matches_web`; **M30** (L: `flatten` bez resetu nakladki) ZABITY przez
  `flatten_false_coastal_river_notches_matches_web`; **M31** (N: pierscien (b) thicken bez resetu nakladki) ZABITY przez
  `thicken_coast_and_smooth_inlets_matches_web`. Logi: `mut-logs-r3/M29-*.log`, `M30-*.log`, `M31-*.log` (rc=101).
- Test `p6_m06b1_overlay.rs` (2 testy): obecnosc >= 30 przypadkow z nakladka per kategoria; obecnosc resetow nakladki
  (las -> brak na heksie wodnym, z inna zmiana terenu) w wyjsciu weba dla purge, trim, flatten, thicken (>= 5 kazda).
- Weryfikator Python: resety nakladki sa w jego implementacji (`set_to_laka`, `reset_to_laka_full`, flatten, pierscien (b));
  przypadki `*-ov-*` sa w zbiorze wektorow -> `0 rozbieznosci` tez dla nakladki.

### 9.5 Prefiks wektorow (zarzut FC 3) - ZROBIONE w rundzie 3

- Stary plik `web-vectors.json` (commit `c92ba394`, SHA-256 `2f9f203904b36cbbcaa710a8d26bfd76eacc6f4e5f3c78a11539f05c291ae919`)
  jest PREFIKSEM nowego: kazda stara kategoria (ocean 330, purge 228, trim 80, finalize 420, thicken 296, flatten 88) to pierwsze
  elementy nowej tablicy (identycznosc wartosci JSON, `check-prefix-m06b1-r3.py`), tablica `maps` (530) to prefiks nowej (580),
  liczniki `stats` identyczne. Wynik: `PREFIKS ZACHOWANY` (`prefix-check-r3.txt`, EXIT=0).
- Nowe przypadki sa dopisane NA KONCU kazdej kategorii (ocean bez zmian; purge +50, trim +50, flatten +50, thicken +100,
  finalize +100), z osobnym generatorem losowym, wiec stare wektory nie zmienily sie.
- Wektory cap (`web-cap.json`) sa nowym plikiem (13 map); stara mapa `cap-thick-m0` (gen-indeks 5) to teraz pierwsza z
  dziesieciu map rozroznialnych.

### 9.6 Niezalezny weryfikator Python (`verify-m06b1-r3.py`, `python3 -I`)

- Napisany OD ZERA z tekstu TS pina `edb8fb56` (`gra/src/map/gen-helpers.ts`, linie w komentarzach), bez czytania `landsea.rs`.
- Wynik (`verifier-python-r3.txt`, EXIT=0): **1868 sprawdzonych, 0 rozbieznosci**: ocean 330, purge 278, trim 130, finalize 520,
  thicken 396, flatten 138, boundary 11, cap 11/12/13 (39 wynikow), flagi cap 11/13 (26).
- Test czulosci (kopie weryfikatora z jedna zmiana, wykonane poza repo i zapisane jako `verifier-sabotage-r3-{Q,L,N}.txt`):
  Q (purge bez resetu nakladki) -> **30 rozbieznosci**; L (flatten bez resetu) -> **8**; N (pierscien bez resetu) -> **100**.
  Weryfikator wykrywa brak resetu nakladki w kazdym z trzech miejsc.
- Oracle = wektory z weba (dispatch: wartosci referencyjne z uruchomionego weba). Niezaleznosc = implementacja.

### 9.7 Bramki (runda 3, logi z `EXIT=`, w katalogu runu)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r3.log`).
- `cargo clippy --offline --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r3.log`).
- `cargo test --offline --no-fail-fast`: EXIT=0, **1441 passed, 0 failed** (`gate-test-r3.log`).
- `git diff --cached --check`: sprawdzane przy commicie.
- Srodowisko: `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_4ce7d74c-bc7-4`.

### 9.8 Odpowiedzi na zarzuty FC rundy 2

Patrz `02-operator-odpowiedz-fc-r2.md` w katalogu runu (PRZYJMUJE / ODRZUCAM z dowodem i odnosnikami do sekcji).

### 9.9 NIE zrobione (jawnie; stan po rundzie 3)

- Dryf po pinie (§4) bez zmian; odswiezenie wektorow poza zakresem (osobny temat R-RUSTPORT-REPIN-DELTA-Q1).
- Partia M06B2 poza zakresem.
- Formalny dowod rownowaznosci M12/M19/M20 pozostaje rozumowaniem z kodu (§9.1), nie dowodem formalnym.
