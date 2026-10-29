# P.6 M06A4 - lad / morze / wybrzeze A, reszta RUNDA-2 (partia 2)

Temat: R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1. Runda 1 (Operator-impl, `5ed29aae`), runda 2 (Operator-pomiary, `1dd70642`), runda 3 (Operator-obrona po zarzutach Evaluatora r2; SHA nowego commita: patrz raport Operatora / `git log`).
Pin webu: `edb8fb56` (`gra/src/map/gen-helpers.ts`). Zakres: wiersze RUNDA-2 z tabeli M06A (linie 3186-4374).
Poprzednie partie: `P6-M06A.md` (r1), `P6-M06A2-LAD-MORZE-RESZTA.md`, `P6-M06A3-LAD-MORZE-RESZTA.md` (partia 1).

## Runda 3 (Operator-impl, partie 3a i 3b)

Baza: `origin/rust-port/parity-v2` = `ea68697d` (wczesniej `364a5356` w dispatchu - ta wersja jest ancestorem). Kolejnosc wg dispatchu: `morseDepthFromMapBorder` -> `trimEnclosedOceanOnly` -> `purgeInlandWaterForMultiLandTyp` (partia 3a, commit `0c1c708a`), potem `applyJaggedCoastNoise` (partia 3b, commit: patrz `git log`).

- Wektory: `tests/p6_m06a4_vectors/trim-vectors.json` (2.2 MB; generator `gen-m06a4-trim-vectors.mjs`, seed 20261030) i `tests/p6_m06a4_vectors/jagged-vectors.json` (0.8 MB; generator `gen-m06a4-jagged-vectors.mjs`, seed 20261031). Oba z `git archive edb8fb56 gra/src gra/data` w katalogu POZA repo; sha256 `gen-helpers.ts` = `ab934703...`. `web-vectors.json` (rundy 2) bez zmian.
- Zaleznosci juz w Rust: `fillEnclosedWaterByLandNeighbors`, `removeInlandWaterPools` (`landsea.rs`); `fbm`, `PERM_TABLE_LEN` (`prims.rs`); `isInMapBorder` (`terrain_class.rs`).
- Konwencje rozdzielone: literaly galezi (progi 0.68 / 0.32, argumenty 5 i 4) w kodzie jako stale galezi; parametry szumu (skala 0.28, mnoznik 2.1, przesuniecie 200, waga 0.35, oktawy 4/3, przesuniecia przebiegu 17/31) i progi w `mapgen-jagged-coast.json`.
- Zalozenie Z-9 (partia 3a): `trimEnclosedOceanOnly` iteruje po wszystkich wpisach mapy (takze niekanonicznych), tak jak `Object.entries` w webie. Dla klucza niekanonicznego web i port zgadzaja sie (wektor `edge_noncanonical_key`). Rozbieznosc Z-1 dotyczy wyłącznie `fillEnclosedWaterByLandNeighbors` (web `parseHexKey` bierze dwie pierwsze skladowe, port pomija klucz) - dlatego wektory `purgeInlandWaterForMultiLandTyp` nie zawieraja kluczy niekanonicznych.
- Zalozenie Z-10 (partia 3b): `applyJaggedCoastNoise` z `passes` jako argumentem (web: 2 domyslnie, 1 w `generator.ts:389`, 5 w `gen-helpers.ts:3690`). Wektory: 1, 2, 5 przebiegow.
- Pomiar granic (raport generatora, nie dowod portu): `jagged-vectors.json` `stats.near_threshold` = 1049 ocen szumu z `|coast - prog| < 0.01` z 17662 ocen. Liczba trafien dokladnie na progu (`coast == prog`) NIE_ZMIERZONO; granice sprawdzone testami 1-ulp na funkcjach decyzji (`erode_threshold_n_minus_1_n_n_plus_1`, `fill_threshold_n_minus_1_n_n_plus_1`).
- Pokrycie `purgeInland`: rodzina "brzeg" (srodek Morze, d = 0..6 sasiadow Laka, pozycje in/near/border, wariant Morze i Plytkie Morze); klucze `fill_d<d>_<pos>_<f5|later|nop>`. Pozycja `border` ma tylko 4 istniejace sasiedztwa (brak sasiadow poza mapa), wiec d >= 5 tam nie wystepuje - NIE_ZMIERZONO dla progu 5 na krawedzi.
- NIE_ZMIERZONO (runda 3, zgodnie z dispatchem "bez dlugich pomiarow"): mutacje dla 3a i 3b; `FILL_ENCLOSED_MAX_PASSES` = 8 (limit przebiegow) - brak wektora, ktory go dosiega (cascade dluzszy niz 8 przebiegow nie zostal zbudowany).
- Testy: `p6_m06a4_trim.rs` (5 testow), `p6_m06a4_jagged.rs` (4 testy). Wszystkie zielone. Bramki: fmt EXIT=0, clippy `-D warnings` EXIT=0, test 1263 passed / 0 failed (baseline 1254 z ea68697d + 9 nowych). Logi: `gate-*-partia3-r3.log` (3a), `gate-*-partia3b-r3.log` (3b).
- Dryf po pinie i zakres: bez zmian wzgledem sekcji "Dryf po pinie" ponizej (zaden hunk w 3186-4374).
- Pozostale symbole zakresu RUNDA-2 po rundzie 3: `applyLandFractionByScore`, `rebalanceLandFractionWithMargins`, `erodePangeaBboxLowScoreRim`, `carvePangeaLongSideGulfs`, `rebalanceLandFractionPangea`, `applyLandFractionByContinent`, `rebalanceLandSeaRatio`, `assignContinentIndices`, `sortLandKeysForErosion`, `pangeaAnnularMaxCorridorWidth`, `groupDryLandMassKeys`, `isPangeaBridgeWater`, `LandFractionFillBias` (dane).

## Stan symboli (binarne kryterium)

| Symbol (web) | Stan | Dowod |
|---|---|---|
| `purgeDesertEnclaveWater` :4156 | PORTOWANY (partia 2) | `landsea.rs::purge_desert_enclave_water`; progi z `data/derived/mapgen-desert-purge.json` (`derived.rs::mapgen_desert_purge`); test `purge_desert_enclave_water_matches_web` (4991 przypadkow z weba, 0 rozbieznosci mapy i liczby zmian); test `coverage_matches_threshold_rule_on_both_sides` |
| `morseDepthFromMapBorder` :4659 | PORTOWANY (r3, partia 3a) | `landsea.rs::morse_depth_from_map_border`; test `morse_depth_from_map_border_matches_web` (101 przypadkow, pelny zbior `(klucz, odleglosc)`); wektory `trim-vectors.json` |
| `trimEnclosedOceanOnly` :4701 | PORTOWANY (r3, partia 3a) | `landsea.rs::trim_enclosed_ocean_only`; test `trim_enclosed_ocean_only_matches_web` (101 przypadkow, liczba zmian + pelna mapa; w tym klucz niekanoniczny `1,2,5`, ktory web tez zamienia) |
| `purgeInlandWaterForMultiLandTyp` :4215 | PORTOWANY (r3, partia 3a) | `landsea.rs::purge_inland_water_for_multi_land_typ` (progi wywolan 5 i 4 jako stale `PURGE_INLAND_FILL_MIN_LAND_*`); test `purge_inland_water_for_multi_land_typ_matches_web` (100 przypadkow); granice `fill(5)` / `fill(4)`: rodzina "brzeg" w `trim-vectors.json` + `coverage_has_both_sides_of_fill_thresholds` |
| `applyJaggedCoastNoise` :4232 | PORTOWANY (r3, partia 3b) | `landsea.rs::apply_jagged_coast_noise` (+ `jagged_coast_value`, `jagged_erode_decision`, `jagged_fill_decision`); parametry szumu i progi w `data/derived/mapgen-jagged-coast.json` (`derived.rs::mapgen_jagged_coast`); test `apply_jagged_coast_noise_matches_web` (55 przypadkow, perm z weba, passes 1/2/5); granice `coast > 0.68` i `coast < 0.32`: testy N-1/N/N+1 na 1 ulp (`erode_threshold_n_minus_1_n_n_plus_1`, `fill_threshold_n_minus_1_n_n_plus_1`) |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | RUNDA-2 (dane) | do `data/derived/*.json` |
| `applyLandFractionByScore` :3444 | RUNDA-2 | - |
| `rebalanceLandFractionWithMargins` :3532 | RUNDA-2 | - |
| `erodePangeaBboxLowScoreRim` :3551, `carvePangeaLongSideGulfs` :3606 | RUNDA-2 | - |
| `rebalanceLandFractionPangea` :3667 | RUNDA-2 | - |
| `applyLandFractionByContinent` :3701 | RUNDA-2 | - |
| `rebalanceLandSeaRatio` :3791 | RUNDA-2 | - |
| `assignContinentIndices` :3186, `sortLandKeysForErosion` :3207 | RUNDA-2 | - |
| `pangeaAnnularMaxCorridorWidth` :4329 | RUNDA-2 | `Math.sqrt`, `Math.round` (`masks::v8math`) |
| `groupDryLandMassKeys` :4338, `isPangeaBridgeWater` :4371 | RUNDA-2 | - |

Stan po rundzie 3: 1 symbol PORTOWANY w tej partii (+ 4 z M06A3, 4 z M06A2, 4 z M06A). Pozostale wiersze RUNDA-2 sa otwarte. Zmiana kodu w rundzie 3: brak (tylko dokument, runner, logi i dowody).

## Dryf po pinie (zakres 3186-4374)

`git diff -U0 edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 24 dodane / 16 usuniete linie, 8 hunkow w liniach edb8fb56: 5995, 8469, 10355, 10395, 10544, 10696, 10779, 10807. **Zaden hunk nie wpada w zakres 3186-4374.** Pin pozostaje `edb8fb56`; odswiezenie wektorow robi osobny temat po R-RUSTPORT-REPIN-DELTA-Q1.

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze "q,r" niekanoniczne sa pomijane przy iteracji (jak w M06A/M06A2/M06A3). Wektory ich nie zawieraja. (Uwaga: web przetworzylby taki klucz i zwrocil go w liczniku; port go pomija. Rozbieznosc dotyczy wylacznie kluczy spoza formatu `q,r` i nie wystepuje w mapach generatora.)
- Z-2: Parametr `height` jest `u32` (jak w `prims::climate_band_at`); `width` jest `i64` (jak `find_inland_water_hexes`).
- Z-3: `purgeInlandWaterForMultiLandTyp` zalezy od `trimEnclosedOceanOnly` (web :4701), ktorego nie ma w zakresie M06A4. Zalozenie: w partii 3 najpierw portujemy `trimEnclosedOceanOnly` jako osobny symbol RUNDA-2 (z wektorami), dopiero potem `purgeInlandWaterForMultiLandTyp`. Nie blokuje partii 2.
- Z-4: Progi `pustN >= 2` oraz `dryN * 0.4` sa wyniesione do `data/derived/mapgen-desert-purge.json` (kod nie zawiera literalow progow). Wartosci sa 1:1 z webu. Porownanie `pustN >= dryN * 0.4` wykonuje sie w `f64` (jak JS: `dryN * 0.4` to mnozenie double).
- Z-5: Kolejnosc przetwarzania = kolejnosc wstawiania `HexRecord` (jak `Object.entries`). Liczniki sasiadow czytane na biezaco: zmiana wczesniejszego heksu wplywa na pozniejsze (web tak samo). Dlatego generator wstawia srodek jako pierwszy, zeby tabela pokrycia opisywala stan wejsciowy progu; test pokrycia to sprawdza.
- Z-6: Brak `Math.*` w `purgeDesertEnclaveWater` (tylko arytmetyka calkowita i mnozenie `f64`).
- Z-7: `climateBandAt(q, r, height)` w webie ma `isEarth = false` (domyslnie). Port wywoluje `climate_band_at(r, height, false)`.
- Z-8 (runda 3): zakres partii 2 to jeden symbol. Zakres RUNDA-2 (16 wierszy tabeli plus symbole z Z-3) nie zmiesci sie w 5 rundach przy jednym symbolu na runde. Decyzja o podziale tematu na mniejsze tematy (<= 8 symboli kazdy) nalezy do orkiestratora; Operator nie zmienia zakresu tematu i nie zamyka go.

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1/gen-m06a4-vectors.mjs` (loader: `m06a-loader-register.mjs` + `m06a-loader-hooks.mjs`, skopiowane z runu M06A3). Brak instrumentacji: wszystkie uzyte symbole sa eksportowane w pinie. sha256 `gen-helpers.ts` = `ab934703...` (zgodne z M06A/M06A2/M06A3).
- Wektory: `rust-port/engine/tests/p6_m06a4_vectors/web-vectors.json`: 4991 przypadkow (4956 sasiedztw srodka: wiersze r dla H in {9,12,20,30,45,61} x d=0..6 x p=0..d; 30 losowych map; 5 brzegowych: pusta, sama woda, sama pustynia, H=1, klucze poza mapa). 4540 przypadkow ze zmiana srodka.
- Pokrycie (pole `coverage`, 71 kluczy): `d<dryN>_p<pustN>_<D|N>_<des|lak|nop>`. Dla kazdej pary (d,p), d=0..6, p=0..d, w pasmie D i N. Granice progu (p=1..2 dla d=1..5 itd.) pokryte w obu stanach.
- Testy: `rust-port/engine/tests/p6_m06a4_landsea.rs` (3 testy, zielone): `vectors_meta_pin_and_counts`, `purge_desert_enclave_water_matches_web`, `coverage_matches_threshold_rule_on_both_sides`.
- Zadnych zmian w istniejacych testach, `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `domain/mod.rs`, `map_generator.rs`, `tests/p6_m00_skeleton.rs`.

## Math.*

- Brak `Math.sin/cos/pow/atan2/hypot/sqrt/round` w `purgeDesertEnclaveWater`.
- Jadra `k_sin/k_cos/rem_pio2` nie zmienione.

## Pomiary

### Operator-pomiary (runda 2, partia 2: `purgeDesertEnclaveWater`) - stan po rundzie 3

- Weryfikator niezalezny (runda 2): wektory przegenerowane z `git archive edb8fb56 gra/src gra/data` (rozpakowane w katalogu tymczasowym POZA repo) generatorem `gen-m06a4-vectors.mjs`. Wynik `verify-vectors.json` jest BAJT-W-BAJT zgodny z `web-vectors.json` w repo (`cmp`: IDENTICAL, log: `verifier-r2.log`). sha256 `gen-helpers.ts` = `ab934703...`.

#### Bramki (runda 3, na biezacym drzewie = kod rundy 1/2, potwierdzone `git diff --stat 5ed29aae 1dd70642 -- rust-port gra`: brak zmian)

| Bramka | Log | Wynik |
|---|---|---|
| `cargo fmt -- --check` | `gate-fmt-r3.log` | EXIT=0 |
| `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r3.log` | EXIT=0 |
| `cargo test --no-fail-fast` | `gate-test-r3.log` | EXIT=0, 1253 passed, 0 failed (w tym 3 testy `p6_m06a4_landsea`) |
| `git diff --check` (worktree) | - | EXIT=0 |

Baseline testow: zmierzony przez `git grep -c "#\[test\]"`: 6daf5ed1 = 1226 atrybutow, HEAD = 1229 (+3 = testy `p6_m06a4_landsea`). Baseline = 1253 - 3 = 1250. Uwaga: bezposredni `cargo test` na 6daf5ed1 NIE byl uruchamiany (NIE_ZMIERZONO co do liczby wykonanych testow; delta jest pomiarem).

Logi rundy 1 (`gate-fmt-r1.log`, `gate-clippy-r1.log`, `gate-test-r1.log`) sa ZASTAPIONE logami rundy 3. `gate-fmt-r1.log` jest pusty (0 bajtow), `gate-clippy-r1.log` i `gate-test-r1.log` nie maja linii `EXIT=` (w logu testow usunieto pusta linie koncowa, zeby `git diff --check` byl czysty). Kod rundy 1 i 2 jest identyczny w `rust-port/` i `gra/`, wiec wyniki r3 dotycza tego samego kodu.

#### Mutacje

Runner: `mut-runner-m06a4.py` (sciezki wzgledne do worktree; mutowany jest `landsea.rs` lub `mapgen-desert-purge.json`; po kazdej mutacji plik jest przywracany w `finally`; `BUILD_ERROR` jest rozrozniany od `ZABITA`). Wyniki (autorytatywne): `mut-results-r3.jsonl` (18 wpisow, jeden na ID). `mut-results-r2.jsonl` ZASTAPIONY: zawiera bledy wzorca (`old count`), duplikaty i blad M16 (`Terrain::Polarny` nie istnieje, wiec mutant nie kompilowal sie); zostaje jako slad audytu.

| ID | Mutacja | Wynik (r3) |
|----|---------|-------|
| M01 | `pustN >= 2` -> `pustN > 2` | ZABITA |
| M02 | `pustN >= dryN*0.4` -> `>` (f64) | PRZEZYTA, równoważna (patrz niżej) |
| M03 | `dryN > 0` -> `dryN >= 0` | ZABITA |
| M04 | usunięty warunek pasma `in_desert &&` | ZABITA |
| M05 | `climate_band_at(r,h,false)` -> `true` (isEarth) | PRZEZYTA, równoważna (dowód niżej, luka ZAMKNIETA) |
| M06 | usunięte `has_deposit = false` | ZABITA |
| M07 | usunięte `river_edges.clear()` | ZABITA |
| M08 | usunięte `river_present = false` | ZABITA |
| M09 | usunięte `overlay = Brak` | ZABITA |
| M10 | gałąź else `Laka` -> `Rownina` | ZABITA |
| M11 | liczenie `pustN/dryN` bez pominięcia wody (`continue`) | ZABITA |
| M12 | JSON `prog_pustyni_min_liczba` 2 -> 3 | ZABITA |
| M13 | JSON `prog_pustyni_min_ulamek_suchych` 0.4 -> 0.5 | PRZEZYTA, równoważna (patrz niżej) |
| M14 | JSON `prog_pustyni_min_ulamek_suchych` 0.4 -> 0.3 | ZABITA |
| M15 | usunięte `continue` dla kluczy niekanonicznych | PRZEZYTA, równoważna na domenie generatora (patrz niżej) |
| M16 | sprawdzanie sąsiada `Terrain::Desert` -> `Terrain::Polar` (poprawiona nazwa wariantu; serde `Polarny`) | ZABITA (`purge_desert_enclave_water_matches_web` FAILED) |
| M17 | struktura: `||` -> `&&` w warunku progowym | ZABITA |
| M18 | struktura: odwrócona gałąź `if` (Pustynia<->Laka) | ZABITA |

Wynik r3: 14 zabitych, 4 przeżyte (M02, M05, M13, M15), zero BUILD_ERROR. Wszystkie 4 przeżyte mają dowód równoważności (poniżej). Wpis M16 w r2 był błędem kompilacji liczonym jako zabity; po poprawce mutant zabity jest przez test wartości.

Dowody równoważności (przeżyte):
- M02: `>=` i `>` różnią się tylko przy `pustN == dryN*0.4` dokładnie. Dla `dryN` w 0..=6 (6 sąsiadów heksu) wartość `dryN*0.4` jest całkowita tylko dla `dryN=5` (=2.0). Wtedy `pustN=2` spełnia pierwszy człon `pustN >= 2` alternatywy, więc wynik OR się nie zmienia. Równoważna.
- M13: dla `pustN >= 2` wynik jest prawdziwy przez człon absolutny, niezależnie od progu ułamkowego. Dla `pustN < 2` zmiana progu 0.4 -> 0.5 zmienia wynik tylko przy `0.4*dryN <= pustN < 0.5*dryN`, czyli `pustN=1` i `dryN` w (2, 2.5], a na liczbach całkowitych takiego `dryN` nie ma. Równoważna na domenie `dryN<=6`. Próg `0.3` (M14) jest zabity, bo zmienia wynik dla `pustN=1`, `dryN=3`.
- M15: `find_inland_water_hexes` iteruje po kluczach `HexRecord`; klucze generatora i mapgen powstają wyłącznie przez `hex_key` (`"{q},{r}"`), więc `key_qr` nie zwraca `None`. Gałąź `continue` jest nieosiągalna z danych generatora. Równoważna na domenie generatora; NIE jest to dowód dla dowolnych ręcznie wstawionych kluczy (zgodne z Z-1).
- M05 (luka z rundy 2 ZAMKNIETA w rundzie 3):
  - Mutacja zmienia wyłącznie argument `isEarth` w porównaniu `climate_band_at(r, height, ·) == ClimateBand::Desert` w `purge_desert_enclave_water`. Purge używa wyłącznie członkostwa w paśmie `desert`; pozostałe pasma nie wpływają na wynik. Równoważność dotyczy więc członkostwa w `desert`, a nie pełnej etykiety pasma (pełne pasma różnią się dla isEarth, np. H=15, r=3: `temperate_north` vs `polar_north`; to nie ma wpływu na purge).
  - Pomiar: `probe-m05-equivalence.mjs` (prawdziwy kod TS weba, pin `edb8fb56`, loader jak w generatorze). Dla każdego H w [3, 3000] i każdego r w [0, H): `climateBandAt(0, r, H, false) === 'desert'` vs `climateBandAt(0, r, H, true) === 'desert'`. Wynik (`probe-m05-equivalence.log`): H in [3,400]: 80197 par, 0 różnic; H in [401,3000]: 4421300 par, 0 różnic; razem 4501497 par, 0 różnic.
  - Domena: r w [0, H) (środek heksu mapy; purge iteruje po heksach mapy). H > 3000 nie zmierzono (NIE_ZMIERZONO, brak dowodu analitycznego).
  - Zgodność portu: `tests/p6_m01_climate.rs:64-77` porównuje Rust `climate_band_at(r, h, is_earth)` z webem dla obu wartości `isEarth` (sweep z wektorów M01). Równoważność po stronie webu przenosi się na port.
  - Wniosek: M05 jest równoważna na domenie generatora. Nie zlecono przegenerowania wektorów. Zdanie z rundy 2 "bufor Earth przesuwa pasmo `desert` dla srodka wody" było BLEDNE i zostaje wycofane.

Pozostałe pomiary:
- Granice progów: `coverage` = 71 kluczy; test `coverage_matches_threshold_rule_on_both_sides` zielony; `neighborhood_cases` = 4956 (stats w `verifier-r2.log`).
- Dryf po pinie: NIE przeliczany w tej rundzie (zakres 3186-4374 wg dispatchu; `purgeDesertEnclaveWater` = :4156 w pinie).

### Odpowiedzi na zarzuty Evaluatora (runda 2 -> runda 3)

- Z1 (M16 nieważna, błąd kompilacji liczony jako zabity): PRZYJMUJĘ. Runner poprawiony na `Terrain::Polar`, M16 przeładowana: ZABITA przez test wartości (`mut-results-r3.jsonl`). Wpis r2 oznaczony jako zastąpiony.
- Z2 i Z3 (M05 błędnie opisana jako luka; brak dowodu równoważności): PRZYJMUJĘ. Dowód równoważności członkostwa w `desert` na H in [3,3000], r in [0,H) (0 różnic), patrz wyżej. Luka zamknięta, zdanie o buforze Earth wycofane, brak zmian kodu i wektorów.
- Z4 (`gate-fmt-r1.log` pusty; logi r1 bez `EXIT=`): PRZYJMUJĘ. Nowe logi r3 (`gate-fmt-r3.log`, `gate-clippy-r3.log`, `gate-test-r3.log`) z `EXIT=`; kod r1 = r2 = r3 w `rust-port/` i `gra/`.
- Z5 (duplikaty w jsonl i w dokumencie; baseline NIE_ZMIERZONO; pusta linia w logu r1 psuje `git diff --check`): PRZYJMUJĘ. Nowy `mut-results-r3.jsonl` (jeden wpis na ID, 0 błędów wzorca); zduplikowana sekcja usunięta; baseline przez delta `#[test]` (1226 -> 1229), pusta linia usunięta z `gate-test-r1.log`.
- Z6 (zakres: jeden symbol na partię, 5 rund za mało na RUNDA-2): PRZYJMUJĘ jako ryzyko zakresu (Z-8). Zakres tematu NIE jest zmieniany przez Operatora; podział należy do orkiestratora.

## Stan i następny krok

- Commit rundy 3: dokument, `mut-runner-m06a4.py`, `probe-m05-equivalence.mjs` + `.log`, `mut-results-r3.jsonl`, `gate-*-r3.log`. Bez `Cargo.lock`, bez `target`, bez zmian w `rust-port/**` kodu i `gra/**`.
- Następny krok: Evaluator weryfikuje nowy commit (SHA w raporcie). Partia 3 (`trimEnclosedOceanOnly` najpierw, Z-3) dopiero po decyzji orkiestratora o zakresie (Z-8).

## Runda 2 (operator): zmniejszenie wektorów

- Problem: `web-vectors.json` = 106 503 488 B (limit GitHub 100 MB, cel <= 8 MB). Przyczyna: każdy przypadek sąsiedztwa niósł pełną siatkę 9 x H, a wiersze r x H x 28 par (d,p) dawały ~50 MB.
- Zmiana generatora (`gen-m06a4-vectors.mjs`): wysokości H in {9,12,20,30} (było 6 wartości do 61); dla każdego H wiersze: 0, H-1 oraz pierwszy, środkowy i ostatni wiersz pasma D i pasma N (deterministycznie). Pokrycie (d,p,pasmo) pozostaje pełne (71 kluczy; test `coverage_matches_threshold_rule_on_both_sides` zielony).
- Wynik: 707 przypadków (672 sąsiedztwa, 30 losowych, 5 brzegowych), plik 6 790 798 B (<= 8 MB). Źródło: uruchomiony TS weba `edb8fb56`, `gen_helpers_sha256` = `ab934703...` (bez zmian).
- Asercja liczby przypadków w `p6_m06a4_landsea.rs` zmieniona z `>= 4000` na `== 707` (dokładna, mocniejsza); pozostałe testy bez zmian.
- Mutanty: wynik identyczny z r3 (14 ZABITYCH; PRZEZYTE M02, M05, M13, M15; patrz `mut-results-r4.jsonl`).
- Partia 3 (`trimEnclosedOceanOnly`, `purgeInlandWaterForMultiLandTyp`, `applyJaggedCoastNoise`) NIE wykonana w tej rundzie.

## Operator-pomiary (runda 2, na `f316caac`)

Niezalezny pomiar po Operatorze-impl (`acadcdee`, raport `01-operator-r2.md`). Kod `landsea.rs` nie zmieniany. Wszystkie komendy w pierwszym planie.

| Pomiar | Wynik | Log / dowod |
|---|---|---|
| Weryfikator wektorow | przegenerowane z `git archive edb8fb56` (katalog tymczasowy poza repo): `cmp` IDENTICAL, 707 przypadkow, 71 kluczy, sha `ab934703...` | `verifier-pomiary-r2.log` |
| Rozmiar wektorow | 6 790 798 B (< 8 MB cel, < 10 MB limit) | `ls -l` |
| Mutanty (runner `mut-runner-m06a4.py`, 18 ID) | 14 ZABITYCH (M01, M03, M04, M06-M12, M14, M16-M18), 4 PRZEZYTE (M02, M05, M13, M15), 0 BUILD_ERROR; wynik identyczny z r3/r4 | `mut-results-pomiary-r2.jsonl` |
| `cargo fmt -- --check` | EXIT=0 | `gate-fmt-pomiary-r2.log` |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 | `gate-clippy-pomiary-r2.log` |
| `cargo test --no-fail-fast` | EXIT=0, 1253 passed, 0 failed; `p6_m06a4_landsea` 3/3 ok | `gate-test-pomiary-r2.log` |
| `git diff --check` | czysty | - |

Przezyte mutanty - status dowodu:
- M02 (`>` zamiast `>=` w gałęzi ułamkowej): równoważna. Dowód jak w r3 (jedyny całkowity punkt równości to `dryN=5, pustN=2`, który spełnia człon `pustN >= 2`). Potwierdzone ponownie na sprawdzeniu ręcznym.
- M13 (0.4 -> 0.5): równoważna na `dryN<=6`. Dowód jak w r3, potwierdzony ponownie.
- M05 (`isEarth` true): równoważna po stronie webu. Ponowny pomiar `probe-m05-equivalence.mjs` dla H in [1,2] (`probe-m05-pomiary-r2.log`: 3 pary, 0 różnic) oraz wcześniejszy zakres H in [3,3000] (`probe-m05-equivalence.log`: 4501497 par, 0 różnic). Razem H in [1,3000]. Zgodność portu z webem dla obu wartości `isEarth` sprawdza `tests/p6_m01_climate.rs:64-77` (wg odczytu kodu; NIE uruchamiano osobno w tym pomiarze).
- M15 (usunięte `continue` dla `key_qr == None`): NIE jest równoważna w sensie ogólnym. Równoważna TYLKO na domenie generatora, gdzie klucze powstają przez `hex_key` i `key_qr` nie zwraca `None` (Z-1). Test zabijający nie istnieje: klucze `-1,4` i `3,-2` w `edge_stray_keys` są numeryczne, więc nie uruchamiają gałęzi `continue`. Luka testowa do zamknięcia w następnej rundzie: test Rust-only z kluczem niekanonicznym (np. `"abc"`), asercja: klucz nietknięty i nieliczony. Uwaga: web przetwarza taki klucz (Z-1), więc taki test nie może pochodzić z wektora webowego.

Założenie (rozstrzygnięte bez pytań): wynik M15 traktuję jako lukę testową z udokumentowanym Z-1, a nie jako dowód równoważności. Nie zmieniano istniejących testów ani progów.

## Obrona Operatora (runda 3 tematu, odpowiedzi na zarzuty Evaluatora a91d6fcb)

Raport: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1/01-operator-obrona-r3.md`.

Mapowanie nazw plikow (Z5): `*-r4.*` (np. `mut-results-r4.jsonl`, `gate-test-r4.log`) = Operator-impl rundy 2 (dispatch, SHA `acadcdee`); `*-pomiary-r2*` = Operator-pomiary rundy 2 (SHA `a91d6fcb`); `*-obrona-r3*` = obrona na zarzuty (ta runda). Pliki nie zostaly przemianowane, zeby odwolania Evaluatora pozostaly wazne.

Nowe pomiary (obrona r3):
- Pokrycie z wiekszymi H: `coverage-large-h-obrona-r3.log`. Ten sam pin `edb8fb56`, siatka H = {9,12,20,30,45,61} (generator w kopii poza repo): te same 71 kluczy (wraz z wynikiem des/lak/nop), liczby co najmniej rowne. Wektory w repo (H = {9,12,20,30}) pokrywaja wiec wszystkie 71 kluczy.
- Trafienia na progu (repo, pasmo D): d1 p0 lak 12 / p1 des 12; d2 p0 lak 12 / p1 des 12; d3 p1 lak 12 / p2 des 12; d4 p1 lak 12 / p2 des 12; d5 p1 lak 12 / p2 des 12; d6 p1 lak 12 / p2 des 12 (N-1 / N po stronie progu `pustN >= dryN*0.4`, w tym d=5 dla rownosci 2.0).
- M05 (isEarth): `probe-m05-obrona-r3-H3001-4000.log`, H in [3001,4000], 3 500 500 par, 0 roznic. Lacznie z rundy 2 zmierzone H in [3,4000]. H > 4000 NIE_ZMIERZONO (brak dowodu analitycznego: `earthPolarOceanRows` nie przeanalizowane).
- M15: nowy test Rust-only `non_canonical_key_is_skipped_not_processed` (plik `tests/p6_m06a4_landsea.rs`, dodany; zaden istniejacy test nie zmieniony w tej rundzie). Mutant M15 (`key_qr(key).unwrap_or((0, 0))`) zabity: test FAILED, pozostale 3 testy OK. Uwaga: web przetworzylby klucz niekanoniczny (Z-1), wiec test pina zachowanie portu, nie weba.

Stan partii 3 (`trimEnclosedOceanOnly`, `purgeInlandWaterForMultiLandTyp`, `applyJaggedCoastNoise`): NIE wykonana w tej rundzie. Zaleznosci zmierzone: `purgeInlandWaterForMultiLandTyp` (web :4215) wola `trimEnclosedOceanOnly` (:4701), ktory wola `morseDepthFromMapBorder` (:4659). W `rust-port/engine/src` brak odpowiednika (grep morse_depth na a91d6fcb: pusto). `fillEnclosedWaterByLandNeighbors` i `removeInlandWaterPools` sa juz w `landsea.rs` (:367, :353).
