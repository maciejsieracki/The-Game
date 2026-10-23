# P6.M04 - klasyfikacja terenu i granice mapy (port `gen-helpers.ts`:233-236 i :825-1407 do Rust)

Temat: `R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1` · DOMAIN: GAME · RUNDA 2/5 (Operator, obrona po FAIL Evaluatora r1; commit r1 `2422b5ed`)
Baza: `origin/rust-port/parity-v2` @ `95b91471` (silnik: 865 testow). Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do `mktemp -d` poza repo).

## 00. Obrona rundy 2: odpowiedzi na zarzuty Evaluatora r1 (5 zarzutow)

Kazdy zarzut ma werdykt PRZYJMUJE (poprawka + dowod) albo ODRZUCAM (dowod). Stan z `2422b5ed` odtworzony przed praca (`git checkout --detach 2422b5ed`; wektory r1 odtworzone bajt w bajt: SHA-256 `c4a09a03...e97d`). Surowe, PELNE logi r2 (z `EXIT=`): `gate-fmt-r2.log`, `gate-clippy-r2.log`, `gate-test-r2.log`, `gate-diffcheck-r2.log`, `mutations-r2-{a,b,c,d,e}.log`, `verify-m04-r2.log`, `verify-m04-negative-r2.log`, `gen-m04-r2.log`, `gen-m04-r2-powtorzenie.log`, `cmp-vectors-r1-r2.log`, `std-parse-exponent-proof.txt`, `grep-literals-terrain-class-r2.txt` (audyt literalow r2); kopie logow bramek w §11.

| # | Zarzut | Werdykt | Poprawka / dowod |
|---|---|---|---|
| 1 | Dokumenty obowiazkowe z dispatchu nieprzeczytane (`P3-22`, skrypty `R-RUSTPORT-P3-22-*`, `P2-3`, `P2-5`, `PLAN` §P6, `LEDGER`, `P6-5B`, `P6-0` §3) | PRZYJMUJE | Przeczytane w r2 (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` do scratch). Zakresy linii, skutki dla portu i jawna lista NIEPRZECZYTANYCH fragmentow z dowodem grep: §9a. Skutek praktyczny: precedens ratyfikacji tabeli poza allowlista (M03, LEDGER wiersz 201) dla zarzutu 2; wzorzec obchodzenia sie z mutacja rownowazna (P6.5B: M02 -> zastepcza M33) dla zarzutu 3; kopie surowych logow w dokumencie (P6.5B §11) -> §11 tutaj. |
| 2 | `rust-port/engine/data/derived/mapgen-terrain-class.json` poza allowlista dispatchu | PRZYJMUJE jako ZGLOSZENIE DO ORKIESTRATORA (Operator nie moze sam rozszerzyc allowlisty; plik zostaje) | Dispatch wymaga jednoczesnie: allowlista = `terrain_class.rs`, `tests/p6_m04_*.rs`, `tests/p6_m04_vectors/**` ORAZ kryterium binarne "stale balansowe -> `data/derived/*.json` + parser w `data/derived.rs`" (parser w `derived.rs` jest dopuszczony jawnie jako "dopisek na koncu pliku", a plik danych, ktory ten parser czyta, nie moze lezec nigdzie indziej). Sprzecznosc dispatchu, nie samowola. **Precedens (LEDGER wiersz 201, `R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1`): "`data/derived/mapgen-masks.json` + parser w `derived.rs` poza allowlista - dziura w dispatchu, nie defekt" - ratyfikacja orkiestratora.** Prosba do orkiestratora: ratyfikacja `data/derived/mapgen-terrain-class.json` (51 wartosci, kazda z `zrodlo_web`: plik+linia z zakresu M04; weryfikator 51/51) w taki sam sposob; alternatywa (usuniecie pliku) lamie kryterium binarne i 16 mutacji tabeli. Zero innych zmian poza allowlista (§8). |
| 3 | Rownowaznosc mutacji `forest-inland-gt-to-ge` niedowiedziona (kolejnosc zachowana tylko bez remisow FP); "77/77" zawiera wylaczona mutacje; pelny przebieg to 76/77 + blad INFRA; "pliki przywrocone: True" bez skrotow | PRZYJMUJE (mutacja NIE jest rownowazna; zabita wektorami) | **Dowod nieekwiwalnosci z URUCHOMIONEGO weba.** Generator tworzy kopie `gen-helpers.ts` z JEDNA mutacja (`maxSeaInPart > 1 ?` -> `>= 1 ?`, dokladnie 1 wystapienie, sprawdzane) i uruchamia ja obok oryginalu na tych samych wejsciach. Nowa kategoria `reapplyForestTie` (51 map): (a) 36 map "grzebieniowych" (wiersze morza i ladu na przemian => kazdy heks ladu graniczy z woda, `maxSeaInPart == 1`) z szumem o REMISACH FP po dodaniu `0.14` (`0`, `1e-20`, `2e-20`, `3e-20`, `5e-324`, `0.9`, `nextUp(0.9)`, ...: `forNoise + 0.14` zwija je w jedna wartosc, wiec `sort` zachowuje kolejnosc wstawiania zamiast kolejnosci szumu); (b) 12 map ze SKLADOWA LADU BEZ WODY (brak wpisu w polu odleglosci => `?? 0`, bez bonusu) w jednej partycji; (c) 3 mapy kontrolne z `maxSeaInPart > 1`. **Wynik (`stats.forestTie` w wektorach): web z mutacja daje INNY wynik w 29 z 48 map z `maxSeaInPart == 1` (21/36 grzebien-FP, 8/12 bez wody) i w 0 z 3 map z max > 1** - mutacja zmienia wynik dokladnie tam, gdzie wskazuje analiza, wiec rownowaznosc z r1 byla bledna. Generator konczy sie bledem, gdy rozroznionych map jest < 10. **Niezalezny weryfikator Python** liczy te sama mutacje samodzielnie (`reapply_forest(..., mutant_inland=True)`) i sprawdza zgodnosc z webem map po mapie (51/51; `verify-m04-r2.log`). Rust: nowy test `reapply_forest_overlay_targeted_inland_cases_match_web` (51 map, wynik == web bitowo; niezalezne przeliczenie `maxSeaInPart`; >= 100 heksow ladu bez wpisu `sd`; web-mutant rozni sie w >= 10 mapach). **Mutacja `forest-inland-gt-to-ge` jest teraz W LISCIE `MUTATIONS` i jest WYKRYTA** (§6b, `mutations-r2-a.log`). Pozostale 2 mutacje rownowazne z r1 przejrzane ponownie i uzasadnione z KODU (nie z probek), bitowo (§6a). **"77/77" z r1 zastapione przez "91/91" z r2**: wszystkie mutacje (77 + 14 nowych) uruchomione ponownie w r2 na tym kodzie; brak mutacji wylaczonej z listy ze wzgledu na przezycie; 3 rownowazne (z dowodem) poza lista i jawnie wymienione (§6a). **INFRA (`scatter-mask` w r1; w r2 `fractions-highland-tier`, `radial-sign`: `No space left on device`)**: runner wykrywa te przyczyne (`INFRA ... -> powtorzenie`), czeka 60 s i powtarza do 8x, wypisuje liste powtorzen; w r2 obie dotkniete mutacje powtorzono w osobnym przebiegu `mutations-r2-e.log` (obie wykryte); `scatter-mask` w r2 wykryta czysto. **Skroty przywrocenia:** zarzut 5. |
| 4 | `parseHexKey` ma status PORTOWANY z wektorem weba, ale zachowanie brzegowe (`"5"` -> NaN, `",3"` -> 0) pinowane recznie w `p6_m04_border.rs:184-202` | PRZYJMUJE (wektory weba + naprawa portu) | Nowa kategoria `parseHexKey`: 788 kluczy z uruchomionego weba (`Number(parts[0])`, `Number(parts[1])`): standardowe, brakujace/puste czesci, biale znaki (w tym U+00A0, U+2028/2029, U+FEFF, U+3000, U+2000, oraz U+0085/U+180E/U+200B, ktorych JS NIE obcina), prefiksy `0x`/`0o`/`0b` (duze: 260 cyfr hex => `Infinity`, 53/54 bity => zaokraglenie do parzystej), `Infinity`/`+Infinity`/`inf`/`NaN`, wykladniki, `1_0`, cyfry spoza ASCII, `-0x10`, 700 kluczy z fuzzingu (alfabet `0-9+-.eExXbBoOaAfF ,_\t U+00A0 U+FEFF Infity`). **Port zostal POPRAWIONY**: stary `s.trim()` + `parse::<f64>()` akceptowal `inf`/`infinity`/`nan` i nie znal `0x`/`0o`/`0b` ani zbioru bialych znakow JS; teraz `js_string_to_number` (ECMA-262 StringToNumber, zaokraglenie potegi dwojki do parzystej z bitem sticky). Test `parse_hex_key_edge_keys_match_web` (788 kluczy, f64 bitowo + wymuszone pokrycie klas: NaN >= 100, Infinity >= 8, -0, puste czesci, prefiksy, biale znaki, brak drugiej czesci, wykladniki). Niezalezny Python liczy `Number()` samodzielnie (int/Fraction, wlasny zbior bialych znakow): 788/788. 13 nowych mutacji parsera (`parse-*`) wykrytych, 1 rownowazna z dowodem (`parse-exponent-without-digits-ok`, §6a poz. 5) zastapiona `parse-exponent-uppercase-rejected` (wykryta) - §6b. Reczne piny z r1 ZOSTAJA (nie oslabiono testu). |
| 5 | "Pliki po kazdej mutacji przywracane i weryfikowane bajt w bajt" to tylko flaga w logu | PRZYJMUJE | `run-mutations.py` r2: SHA-256 BAJTOW obu mutowanych plikow z dysku przed przebiegiem, po KAZDEJ mutacji (po przywroceniu; wiersz `PRZYWROCONO <plik>:sha256=...=OK` per mutacja) i na koncu; niezgodnosc => natychmiastowy blad (exit 3). Skroty poczatkowy i koncowy (pelne) w `mutations-r2-{a,b,c,e}.log`, 94 wiersze `PRZYWROCONO ... OK` (§6b). Skroty tych samych plikow sprawdzone ponownie przed bramkami (`gate-fmt-r2.log`) - `516614bc...`/`f0cfb062...`. |

Zakres (dispatch): `gen-helpers.ts`:233-236, `gen-helpers.ts`:825-1407. Zaleznosci: M01, M02 (obie na bazie: `prims.rs`, `params.rs`). Wzorce: `P6-5B-JEDNOSTKI-ZYCIE-B.md`, `P6-M10-KLASTRY-MASY-BRAMKI.md`, `P6-M14-TERYTORIUM-ZASIEG-CUDA.md`.
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/`.

## 0. Status (uczciwie)

- **Wszystkie** deklaracje zakresu maja status (tabela §3): **PORTOWANY** (kod + test + wektor z uruchomionego weba, 0 rozbieznosci) dla logiki klasyfikacji, hasza komorek, relifu po dopasowaniu, granicy mapy i fade'ow; **PORTOWANY-Z-WSTRZYKNIETYMI** dla `reapplyForestOverlay` (8 domkniec) i `applyMarginalLandZoneCaps` (1 domkniecie, §4); **DANE-JUZ-W-RUST** dla `ReliefDensityTier`; **NIE-DOTYCZY** dla komentarzy i martwego pola `forest` (§3); **RUNDA-2: 0**.
- Wektory z URUCHOMIONEGO weba (`tests/p6_m04_vectors/web-vectors.json`, 9,8 MB, SHA-256 `bbaeee3a97ba82e83e40401208a6e16f41cbc61b23959c68f7d122312cca44cc`, powtarzalny: trzy przebiegi generatora, w tym jeden z web-rootu odtworzonego od zera (`gen-m04-r2-powtorzenie.log`: `cmp` bajt w bajt), daja ten sam skrot): **45026 przypadkow w 21 kategoriach** (r1: 44187 w 19; r2 dodaje `parseHexKey` 788 i `reapplyForestTie` 51). **19 kategorii z r1 jest BAJT W BAJT identycznych** (generator uzywa osobnego strumienia losowego `rng2` dla nowych kategorii; porownanie JSON per kategoria wektorow z `git show 2422b5ed:...` i z r2: `cmp-vectors-r1-r2.py`, `cmp-vectors-r1-r2.log` = 19 identycznych, 0 roznych, `EXIT=0`), wiec wyniki r1 oparte o te kategorie pozostaja wazne. f64 porownywane **bitowo** (`to_bits`; wszystkie `NaN` sprowadzone do jednego, bo w JS jest jeden `NaN` bez obserwowalnego ladunku).
- Niezalezny weryfikator Python (`verify-m04-vectors.py`, `python3 -I`, bez Node/TS/Rust): **169542 sprawdzen, 0 rozbieznosci** (`verify-m04-r2.log`, `EXIT=0`; r1: 157597); test negatywny (**9** zmienionych wartosci, w tym 3 w nowych kategoriach) => **9** rozbieznosci, `EXIT=1` (`verify-m04-negative-r2.log`).
- Testy: **27 nowych** (`p6_m04_classify` 7, `p6_m04_reapply` 4, `p6_m04_border` 12, `p6_m04_tables` 4; r2: +`parse_hex_key_edge_keys_match_web`, +`reapply_forest_overlay_targeted_inland_cases_match_web`). `cargo test --offline --no-fail-fast`: **892 passed, 0 failed, `EXIT=0`** (`gate-test-r2.log`); 892 = 865 (baza) + 27. fmt i clippy `--all-targets -D warnings`: `EXIT=0`. Zero zmian istniejacych testow (zadnej asercji nie usunieto ani nie oslabiono; stare piny `parseHexKey` zostaja).
- Mutacje (`run-mutations.py`, wlasny `CARGO_TARGET_DIR`): **r2: 91/91 WYKRYTYCH** (77 z r1 + 14 nowych; wszystkie uruchomione ponownie w r2; wynik koncowy 0 przezylo, 0 bledow; INFRA `No space left on device` zdarzyl sie ponownie na 2 mutacjach i zostal rozwiazany powtorzeniem - `mutations-r2-e.log`; szczegoly, rozbicie na logi i incydenty: §6b), **3 mutacje rownowazne POZA lista z dowodem z kodu** (§6a; r2 NIE wylacza juz `forest-inland-gt-to-ge`, ktora okazala sie nierownowazna), **skroty SHA-256 plikow przed/po KAZDEJ mutacji** (§6b). Historia r1: pelny przebieg `mutations-r1.log` 76/77 + `scatter-mask` powtorzona w `mutations-r1b.log` (INFRA), 3 mutacje rownowazne wylaczone (w tym blednie `forest-inland-gt-to-ge`). Pierwszy przebieg r1 (`mutations-r1-pass1.log`, 80 mutacji) wykryl 74; 6 przezylo i dalo trzy poprawki: (a) 2 nowe zestawy wektorow (wartosci SASIEDNIE WOKOL progow `classifyTerrain`/`Flat` oraz mapy lasu z RZADKIM i GESTYM terenem kwalifikujacym sie - `classify-plains-gt-to-ge`, `forest-pangea-min`, `table-min-sufitu`), (b) 3 mutacje uznane za ROWNOWAZNE (§6a) i wylaczone z listy jawnie, (c) mutacja `table-min-sufitu` (2->3) byla rownowazna, wiec zastapiona wartoscia 100, ktora zmienia wynik.
- **Odkrycie (poza allowlista, do orkiestratora):** STARY `map_generator::hash_int3` (`src/domain/map_generator.rs:909-914`, `u32::wrapping_mul`) NIE jest zgodny z webem dla pelnego zakresu ziaren `u32`: web mnozy w `f64` (iloczyn > 2^53 traci mlodsze bity przed `ToInt32`). Pomiar `legacy-hash-divergence.log`: ziarno <= 4 000 000 => 0/200000 rozbieznosci, **ziarno z calego u32 => 198908/200000 (99,5%)**. Nowa `terrain_class::hash_int3` jest zgodna z webem bitowo (4076 wektorow). Starego kodu NIE ruszano; konsumenci (`generate_map`) powinni przejsc na `terrain_class` (§10).

## 1. Metoda wektorow (ANTY-HALUCYNACJA)

- Generator `gen-m04-vectors.mjs` (w runie), uruchomienie (Node v22.22.0):
  `node --experimental-transform-types --no-warnings --import ./m04-loader-register.mjs ./gen-m04-vectors.mjs <WEB_ROOT> <OUT_JSON>` -> `OK {...}` (`gen-m04-r1.log`, `EXIT=0`).
- **PRAWDZIWY kod weba, bez przepisywania logiki**: `gen-helpers.ts` (12 561 linii) laduje sie jako kopia pliku z dopisanym NA KONCU jednym wierszem `export { ...20 prywatnych deklaracji... };`. Generator sprawdza, ze kopia bez dopisku jest bajt w bajt rowna oryginalowi (SHA-256 oryginalu zapisany w wektorach i sprawdzany przez weryfikator). Kopia lezy obok oryginalu w scratch (poza repo), wiec importy wzgledne (`./newGameMapDefaults`, `./earth-land-mask`, `../types/hex`) dzialaja bez zmian. Loader `m04-loader-hooks.mjs` tylko dopisuje `.ts` / `/index.ts` i traktuje `.json` jako modul - **ZERO stubow logiki** (caly graf importow ladowal sie bez wycinania).
- Deterministyczne wejscia: `mulberry32(20261023)` z weba; mapy z `fbm`/`buildPermTable` weba (ksztalt lad/morze), plus mapy syntetyczne (rzadki i gesty teren pod las, losowa kolejnosc wstawiania heksow, remisy przez kwantyzacje szumu).
- **Kategorie i liczby przypadkow** (`gen-m04-r1.log`): `latBuffer` 10252, `hashInt3` 4076, `cellBias` 5012, `jitter` 3000, `elevGates` 514, `classify` 6219, `classifyFlat` 6219 (w tym 219 wartosci SASIEDNICH wokol progow), `reapplyLand` 45 map, `reapplyForest` 64 mapy, `forestEligible` 8, `erosionSort` 42, `marginZone` 42, `setHex` 48, `marginCap` 77, `fades` 4512 (7 funkcji na wiersz), `inBorderBuf` 1500, `borderGrid` 56 map (liczniki, `findLandInMapBorder`, `enforceMapBorderOcean`, `keysAtBorderDistance` d=0..12 i 0,5, `countLandNeighborsInSet` i `isReliefCandidateHex` po wszystkich heksach), `scatter` 2500, `consts` 1; **r2 dodaje** `parseHexKey` 788 kluczy (`gen-m04-r2.log`), `reapplyForestTie` 51 map (48 z `maxSeaInPart == 1`, 3 z max > 1; web z mutacja `>= 1` rozni sie w 29/48 i 0/3; `stats.forestTie`). Metoda dla `reapplyForestTie`: generator laduje DRUGA kopie `gen-helpers.ts` z jedna mutacja tekstu (`maxSeaInPart > 1 ?` -> `maxSeaInPart >= 1 ?`; dokladnie 1 wystapienie) i wywoluje obie wersje na tych samych wejsciach; zadne wejscie nie jest kopiowane z mutanta do wektorow (wektor = wynik ORYGINALU; mutant tylko flaga `mutantDiffers`).
- **Pokrycie wymuszone asercjami w testach**: kazdy teren wynikowy `classifyTerrain` >= 100 razy (Morze, Laka, Rownina, Pustynia, Wzgorza, Gory), `classifyTerrainFlat` nigdy Morze/Gory/Wzgorza; wszystkie trzy wiersze `reliefElevGates`; `reapplyLand`: >= 25 map z reliefem po przebiegu, wszystkie 3 tiery >= 10 razy, `mapHeight` = brak/0/>0; `reapplyForest`: wszystkie 4 typy swiata i 3 tiery, `continentOf` brak/obecny, `mapHeight` brak/0/>0, >500 heksow lasu lacznie, liczba heksow `Las` po wywolaniu == `assigned`, teren nietkniety; `applyMarginalLandZoneCaps`: obie galezie (lad->morze i morze->lad) w >= 15 mapach, >1000 zmian; `erosionSort`: >= 20 zbiorow > 20 kluczy; `fades`: fade = 0, = 1 i posredni po >200 razy.
- **Niezalezny weryfikator** `verify-m04-vectors.py <WEB_ROOT> <WEKTORY> <TABELA>`: reimplementuje CALA logike w Pythonie z KODU TS jako specyfikacji, razem z WLASNYM TimSortem V8 (skopiowany z `verify-m10-vectors.py`, bo komparatory marginesu brzegu i erozji sa NIEprzechodnie) i WLASNYM `ToInt32`/`Math.round` (przez `Fraction`)/`Math.min`/`Math.max` (NaN, -0). Dodatkowo: (a) wyciaga regexem z TS (po numerach linii pinu) KAZDA z 51 wartosci tabeli i porownuje z `data/derived/mapgen-terrain-class.json` (zbior sprawdzonych == zbior lisci tabeli, `51/51`), (b) sprawdza kotwice tekstowe stalych algorytmicznych (hasze, maska `0xffff`, struktura wyrazen) w liniach zrodla, (c) **liczy NIEZALEZNIE zaleznosci lasu** (odleglosc od morza BFS, partycje `groupLandMassKeys`/Voronoi, komorki pokrycia) i porownuje je z wartosciami zapisanymi z weba, (d) sprawdza SHA-256 i liczbe linii `gen-helpers.ts` z pinu (12 561).
- Hook testowy `ErosionHook` (`tests/p6_m04_border.rs`) = `sortLandKeysForErosion` (poza zakresem, `gen-helpers.ts`:3207) przepisany z TS i sprawdzony BEZPOSREDNIO na 42 wektorach `erosionSort` (`erosion_hook_matches_web`), wiec blad hooka nie zaslania bledu M04. Zaleznosci lasu sa ODTWARZANE z wartosci policzonych przez prawdziwy kod weba i kazda metoda sprawdza argumenty (tier, rozmiar komorki, typ swiata, `nContinents`, `continentOf`, zbior masy przez skrot FNV-1a), wiec zle przekazanie = panika (kontrola negatywna: `forest_replay_hooks_reject_wrong_arguments`).

## 2. Tabela bylo / jest

| | przed (`95b91471`) | po |
|---|---|---|
| `mapgen/terrain_class.rs` | 3 linie (naglowek `//!`) | 1264 linii (r1: 1132; r2: +132 = `js_string_to_number` i pomocnicy parsera kluczy): pelny port, naglowek z ID wlasciciela zachowany |
| liczba testow `cargo test` | 865 (r1: 890) | 892 |
| nowe pliki testow | - | `p6_m04_classify.rs` (7), `p6_m04_reapply.rs` (4), `p6_m04_border.rs` (12), `p6_m04_tables.rs` (4) = 27 |
| zmienione testy istniejace | - | **0** (zadnego nie edytowano ani nie oslabiono; `p6_m00_skeleton` zielony); r2 tylko DODAJE 2 testy |
| `data/derived/` | - | `mapgen-terrain-class.json` (nowy, 7 sekcji, 51 wartosci z `zrodlo_web`) |
| `src/data/derived.rs` | - | dopisek NA KONCU (parser `mapgen_terrain_class()`, `deny_unknown_fields`) |

Lista testow (nazwy):
- `p6_m04_classify`: `consts_match_web`, `hash_int3_matches_web`, `terrain_cell_bias_matches_web`, `rown_laka_jitter_matches_web`, `relief_elev_gates_match_web`, `classify_terrain_matches_web`, `classify_terrain_flat_matches_web`.
- `p6_m04_reapply`: `reapply_land_terrain_matches_web`, `reapply_forest_overlay_matches_web`, `forest_replay_hooks_reject_wrong_arguments`, **(r2)** `reapply_forest_overlay_targeted_inland_cases_match_web`.
- `p6_m04_border`: `lat_buffer_matches_web`, `border_consts_match_web`, `margin_cap_matches_web`, `fades_and_distances_match_web`, `is_in_map_border_with_buffer_matches_web`, `margin_scatter_score_matches_web`, `parse_hex_key_matches_js_number_for_hexkey_strings`, **(r2)** `parse_hex_key_edge_keys_match_web`, `set_hex_to_morze_and_laka_match_web`, `border_grid_tools_match_web`, `erosion_hook_matches_web`, `apply_marginal_land_zone_caps_matches_web`.
- `p6_m04_tables`: `table_parses_with_deny_unknown_fields`, `every_value_has_a_web_source_with_file_and_line`, `values_have_sane_shape`, `floats_are_parsed_exactly_from_the_raw_json_text`.

## 3. Symbole - status per deklaracja

Legenda: PORTOWANY = kod + test + wektor z uruchomionego weba, 0 rozbieznosci. Lista deklaracji najwyzszego poziomu w zakresie: `symbols-m04.txt` (awk po pinie).

| web (`gen-helpers.ts`:linia) | symbol | status | Rust (`terrain_class.rs`) | test |
|---|---|---|---|---|
| :233 | `isInLatitudinalOceanBuffer` | PORTOWANY | `is_in_latitudinal_ocean_buffer` | `lat_buffer_matches_web` (10252; h=0..90 pelny przemiatan r, 100..600 probki, oba tryby) |
| :826 | `TerrainResult` | PORTOWANY (typ) | `TerrainResult` | wszystkie testy klasyfikacji |
| :832 | `TerrainClassifyThresholds` | PORTOWANY (typ; `?? ` = `Option`) | `TerrainClassifyThresholds` (pole `forest` `@deprecated`, nieuzywane jak w webie) | `classify_*` (19 zestawow progow, w tym `null`/`NaN`) |
| :843 | `TerrainScratch` | PORTOWANY (typ) | `TerrainScratch` | `reapply_*` |
| :861 | `reliefElevGates` (prywatna) | PORTOWANY | `relief_elev_gates` | `relief_elev_gates_match_web` (514; granice 0,55 i 0,75 +-1 ulp, NaN, +-Inf) |
| :881-882 | `TERRAIN_GLOBAL_MIX_AMP`, `TERRAIN_CELL_JITTER_AMP` | DANE (tabela) | `przeplot_rownina_laka.amplituda_*` | `consts_match_web` (stale z weba == tabela przez wynik `rown_laka_jitter`) |
| :889 | `terenCoverageCellSize` | PORTOWANY | `teren_coverage_cell_size` (z tabeli) | `consts_match_web` |
| :899 | `hashInt3` (prywatna) | PORTOWANY | `hash_int3` | `hash_int3_matches_web` (4076; ziarna do 2^32+, 2^53, NaN, +-Inf) |
| :911 | `terrainCellBias` | PORTOWANY | `terrain_cell_bias` (`Option` = argument domyslny) | `terrain_cell_bias_matches_web` (5012; cellSize 0, ujemny, NaN, ulamkowy) |
| :917 | `terrainRownLakaJitter` (prywatna) | PORTOWANY | `terrain_rown_laka_jitter` | `rown_laka_jitter_matches_web` (3000) |
| :923 | `classifyTerrain` | PORTOWANY | `classify_terrain` | `classify_terrain_matches_web` (6219) |
| :973 | `classifyTerrainFlat` | PORTOWANY | `classify_terrain_flat` | `classify_terrain_flat_matches_web` (6219) |
| :1012 | `reapplyForestOverlay` | PORTOWANY-Z-WSTRZYKNIETYMI (8 domkniec, §4) | `reapply_forest_overlay` + `ForestOverlayHooks` | `reapply_forest_overlay_matches_web` (64 mapy) |
| :1103 | `REAPPLY_RELIEF_BUDGET_FRAC` | DANE (tabela) | `relief_po_dopasowaniu_ladu.budzet_ulamek_ladu` | `reapply_land_terrain_matches_web` + `consts` |
| :1109 | `reapplyLandTerrain` | PORTOWANY | `reapply_land_terrain` | `reapply_land_terrain_matches_web` (45 map) |
| :1163 | `ReliefDensityTier` | DANE-JUZ-W-RUST | alias `ReliefDensityTier = params::DensityTier` (te same klucze `low/medium/high`) | `tier_from_web` w testach |
| :1165 | `FALLBACK_RELIEF_FRAC` | DANE (tabela) | `docelowy_udzial_gor/wzgorz` | `consts_match_web` |
| :1172 | `reliefLandFractions` | PORTOWANY | `relief_land_fractions` | `consts_match_web` (3 tiery) |
| :1177 | `MAP_BORDER_OCEAN_HEXES` | DANE (tabela) | `map_border_ocean_hexes()` | `border_consts_match_web` |
| :1180 | `MAP_MARGIN_LAND_ZONE_HEXES` | DANE (tabela) | `map_margin_land_zone_hexes()` | `border_consts_match_web` |
| :1183 | `mapBorderWidth` | PORTOWANY | `map_border_width` | `consts_match_web` (6 wejsc) |
| :1191 | `marginLandCapForBorderDistance` | PORTOWANY | `margin_land_cap_for_border_distance` (`None` = `null`) | `margin_cap_matches_web` (77; polowki, granice +-1 ulp, NaN) |
| :1198 | `marginScatterScore` (prywatna) | PORTOWANY | `margin_scatter_score` | `margin_scatter_score_matches_web` (2500; q,r do 1e5) |
| :1204 | `countLandNeighborsInSet` (prywatna) | PORTOWANY | `count_land_neighbors_in_set` | `border_grid_tools_match_web` (kazdy heks 56 map) |
| :1213 | `keysAtBorderDistance` (prywatna) | PORTOWANY (parametr `hexes` weba nieuzywany - zachowany `_hexes`) | `keys_at_border_distance` | `border_grid_tools_match_web` (d=0..12 i 0,5) |
| :1233 | `applyMarginalLandZoneCaps` | PORTOWANY-Z-WSTRZYKNIETYM (1 domkniecie, §4) | `apply_marginal_land_zone_caps` + `MarginZoneHooks` | `apply_marginal_land_zone_caps_matches_web` (42 mapy, V8 TimSort) |
| :1287 | `isInMapMarginZone` | PORTOWANY | `is_in_map_margin_zone` | `fades_and_distances_match_web` |
| :1294 | `landMaskBorderFade` | PORTOWANY | `land_mask_border_fade` | j.w. (4512) |
| :1303 | `mapCenterRadialBias` | PORTOWANY | `map_center_radial_bias` | j.w. |
| :1313 | `mapEdgeRectFade` | PORTOWANY | `map_edge_rect_fade` | j.w. |
| :1326 | `mapCenterDistanceNorm` (prywatna) | PORTOWANY | `map_center_distance_norm` | j.w. |
| :1334 | `hexBorderDistance` | PORTOWANY | `hex_border_distance` | j.w. |
| :1338 | `isInMapBorder` | PORTOWANY | `is_in_map_border` (`Option` = `buffer?`) | `fades_and_distances_match_web`, `is_in_map_border_with_buffer_matches_web` (1500) |
| :1344 | `isReliefCandidateHex` (prywatna) | PORTOWANY | `is_relief_candidate_hex` | `border_grid_tools_match_web` |
| :1357 | `countMapBorderHexes` | PORTOWANY | `count_map_border_hexes` | `border_grid_tools_match_web` (10 buforow x 56 map) |
| :1369 | `findLandInMapBorder` | PORTOWANY | `find_land_in_map_border` | j.w. |
| :1388 | `enforceMapBorderOcean` | PORTOWANY | `enforce_map_border_ocean` | j.w. (stan wszystkich heksow po wywolaniu) |
| :3202 (poza zakresem) | `parseHexKey` | PORTOWANY (lokalna kopia, potrzebna zakresowi); **r2: status poparty WEKTORAMI weba takze dla kluczy brzegowych** | `parse_hex_key` (+ `js_string_to_number`, `is_js_whitespace`, `pow2_radix_digits_to_f64`) | `parse_hex_key_edge_keys_match_web` (788 kluczy z weba, f64 bitowo), `parse_hex_key_matches_js_number_for_hexkey_strings` (piny z r1 zostaja) + posrednio wszystkie |
| :3325, :3332 (poza zakresem) | `setHexToMorze`, `setHexToLaka` | PORTOWANY (lokalne kopie) | `set_hex_to_morze`, `set_hex_to_laka` | `set_hex_to_morze_and_laka_match_web` (48 stanow: rzeka, zloze, nakladka) |
| (miedzy deklaracjami) | komentarze blokowe/JSDoc i puste linie | NIE-DOTYCZY (brak logiki) | - | - |

Podsumowanie: **38 deklaracji najwyzszego poziomu** w zakresie (26 eksportow + 12 prywatnych; 28 funkcji, 6 stalych, 4 typy/aliasy): 28 funkcji PORTOWANYCH (w tym 2 Z-WSTRZYKNIETYMI), 6 stalych jako DANE (tabela), 3 typy PORTOWANE (`TerrainResult`, `TerrainClassifyThresholds`, `TerrainScratch`), 1 alias DANE-JUZ-W-RUST (`ReliefDensityTier`); **RUNDA-2: brak elementow z zakresu M04.** Lokalne kopie z innych zakresow (`parseHexKey`, `setHexToMorze`, `setHexToLaka`) sa wlasnoscia innego tematu (`gen-helpers.ts`:3200-3340); po jego porcie nalezy je zdeduplikowac (§10).

### 3a. Odstepstwa sygnatur od weba (kompletna lista; logika 1:1)

| Web | Rust | Powod |
|---|---|---|
| `hexes: Record<string, Hex>` | `HexRecord` (wektor par + indeks, kolejnosc wstawiania jak `Object.entries`) | `Hex` weba ma 9 pol; `TerrainHex` ma tylko czytane/zapisywane w zakresie (`coords`, `terenBazowy`, `nakladka`, `rzeka.obecna`, `rzeka.krawedzie`, obecnosc `zloze`); model `MapHex` jest przypisany M01 (`types.rs`), ktorego allowlista go nie obejmuje |
| `scratch: Map<string, TerrainScratch>` | `HashMap<String, TerrainScratch>` | kolejnosc nie jest czytana (tylko `get`) |
| `thresholds?: TerrainClassifyThresholds` | `Option<&TerrainClassifyThresholds>`; pola `Option<f64>` | `??` traktuje `undefined` i `null` jednakowo |
| `climateBand?: ClimateBand` | `Option<ClimateBand>` | `undefined` |
| `cellBias = 0` | jawny `f64` (wywolujacy daje 0.0) | brak domyslnych argumentow w Rust; wektory maja wiersze z domyslnym (null -> 0) |
| `terrainCellBias(.., cellSize = terenCoverageCellSize())` | `cell_size: Option<f64>` | argument domyslny |
| `mapHeight?: number` | `Option<u32>`; `Some(0)` == falsz | `mapHeight &&` / `mapHeight ?` w JS |
| `continentOf: Map<string, number> \| null` | `Option<&HashMap<String, f64>>` | tylko `get` |
| `isInMapBorder/countMapBorderHexes/enforceMapBorderOcean(.., buffer?)` | `Option<f64>` | `buffer ?? mapBorderWidth()` |
| wspolrzedne `q`,`r`,`width`,`height` | `f64` w funkcjach czysto liczbowych, `i64` w funkcjach iterujacych po siatce i kluczach | JS `number`; klucz `"q,r"` buduje `i64` (inaczej `-0` dalby `"-0"`, a JS daje `"0"`) |
| `Math.min/max/round/pow` | `js_min`, `js_max`, `js_round`, `js_pow` (NaN propaguje, `-0`, polowka w gore, `pow(x,2) = x*x`) | `f64::max/min` ignoruja `NaN`; `f64::round` zaokragla polowke od zera |
| `Array.prototype.sort` | `cluster_mass::js_array_sort_by` (TimSort V8) | komparator marginesu NIEprzechodni (`> 0.02`) |

## 4. Domkniecia wstrzykniete (PORTOWANY-Z-WSTRZYKNIETYMI)

M04 nie moze zalezec od kodu innych tematow (rownolegle allowlisty), a ponizsze deklaracje leza w `gen-helpers.ts` POZA zakresem M04:

| metoda cechy | web | uzywana przez |
|---|---|---|
| `ForestOverlayHooks::forest_share_of_dry_land` | `FOREST_SHARE_OF_DRY_LAND[tier]` `:1590` | `reapply_forest_overlay` |
| `forest_overlay_cap_frac` | `FOREST_OVERLAY_CAP_FRAC` `:1605` | j.w. |
| `forest_coverage_cell_size` | `forestCoverageCellSize` `:1838` | j.w. |
| `min_land_hexes_for_fair_play_cell` | `minLandHexesForFairPlayCell` `:1844` | j.w. |
| `is_forest_eligible_terrain` | `isForestEligibleTerrain` `:1555` | j.w. |
| `build_sea_distance_field` | `buildSeaDistanceField` `:5614` | j.w. |
| `land_partition_keys_for_distribution` | `landPartitionKeysForDistribution` `:1565` (wola `groupLandMassKeys` `:1411`) | j.w. |
| `land_hexes_by_coverage_cell` | `landHexesByCoverageCell` `:8360` | j.w. |
| `MarginZoneHooks::sort_land_keys_for_erosion` | `sortLandKeysForErosion` `:3207` (+ `countMorseNeighbors` `:3294`, `erodeTerrainRank` `:3288`) | `apply_marginal_land_zone_caps` |

Po porcie tych tematow wystarczy `impl` cechy na ich funkcjach (bez zmian w `terrain_class.rs`). W testach: zaleznosci lasu to wartosci z prawdziwego weba (odtwarzane, §1), a `ErosionHook` to przepisany TS sprawdzony na wlasnych wektorach.

## 5. Dane vs kod - brak literalow danych/mnoznikow

- Balans w `data/derived/mapgen-terrain-class.json` (edytowalny; **kazda wartosc ma `zrodlo_web` z numerem linii**): progi klasyfikacji (0,63 / 0,75 / 0,60 / 0,14 / 0,22 / 0,18 / 0,45 / 0,35), bramki wysokosci reliefu (3 wiersze x 4 + progi 0,55 / 0,75), przeplot Rownina/Laka (0,12 / 0,65 / komorka 4), budzety i udzialy reliefu per tier, parametry lasu (0,14 / 1,35 / 1,0 / min. 0 i 1 / sufit 2), brzeg mapy (2 / 10 / 0,05 / 0,45 / 0,38 / 0,02 / 5 / 0,001), bias radialny (0,12 / 0,94 / 2,0). Parser: `data/derived.rs` (dopisek na koncu, `deny_unknown_fields`, `OnceLock`).
- Stale ALGORYTMICZNE (tozsamosc algorytmu, nie balans), zostaja w kodzie: mnozniki hasza `374761393`, `668265263`, `2246822519`, `1274126177` i przesuniecia `13`/`16` (weryfikator Pythona sprawdza ich obecnosc w liniach `gen-helpers.ts`:900-903), `73856093`, `19349663`, maska `0xffff` (:1200-1201), `4294967296` (dzielnik hasza). Literaly strukturalne: `0`, `1`, `2` (indeksy, polowa bbox `/ 2.0`), srodek szumu `0.5` (`:918`, `:914`), polowa piksela `+ 0.5` w normalizacji srodka mapy (`:1306`), `d - 1` w pierscieniu, `maxSeaInPart = 1`, `ring.len * cap`. Audyt: `grep-literals-terrain-class.txt` (wszystkie trafienia sklasyfikowane powyzej; zadnej liczby balansowej).
- Testy ksztaltu tabeli (`p6_m04_tables.rs`) NIE pinuja wartosci: parsowanie z `deny_unknown_fields` (nieznane pole na kazdym poziomie, w tym w wierszach bramek), kazda wartosc ma `zrodlo_web` z plikiem i numerem linii z zakresu M04 (825..1407), ksztalt (progi w `[0,1]`, rosnace tiery, `cell >= 1`, dzielniki > 0), dokladnosc parsowania floatow wzgledem tekstu pliku (`serde_json` bez `float_roundtrip` moze przeklamac ulp). **Uwaga:** testy wektorowe (`p6_m04_*`) to testy PARYTETU z webem, wiec zmiana liczby balansu celowo je lamie (mutacje tabeli sa wykrywane) - zmiana balansu wymaga swiadomego przegenerowania wektorow.
- Stare stale `TERRAIN_GLOBAL_MIX_AMP`/`TERRAIN_CELL_JITTER_AMP` w `map_generator.rs:16-17` (literaly) zostaja - plik poza allowlista (§10).

## 6. Zalozenia i zachowania weba odtworzone 1:1 (luki rozstrzygniete ZALOZENIEM)

1. **Hasz komorek**: `(a * 374761393) ^ (b * 668265263) ^ (c * 2246822519)` liczy iloczyny w `f64` (dla ziaren > ~4e6 iloczyn przekracza 2^53 i traci mlodsze bity), dopiero potem `ToInt32` operatora `^`. Port: `js_to_int32(a * 374761393.0)` itd. + `wrapping_mul` dla `Math.imul`. Wektory: ziarna do 2^32+7, 2^53, NaN, +-Inf (`hash_int3_matches_web`).
2. **Komparator marginesu brzegu jest NIEprzechodni** (`Math.abs(sb - sa) > 0.02`), a komparator `sortLandKeysForErosion` ma prog `0.015`: wynik zalezy od algorytmu sortowania; uzyty TimSort V8 (`js_array_sort_by`), potwierdzony na 42 wektorach erozji i 42 mapach strefy brzegowej oraz niezaleznie WLASNYM TimSortem w Pythonie.
3. **`findLandInMapBorder` omija tylko `Morze`** (`terenBazowy === Morze`), wiec `PlytkieMorze` w buforze jest zglaszane jako "lad"; **`enforceMapBorderOcean`** konwertuje `PlytkieMorze` na `Morze` i liczy je w `converted`. Zachowane 1:1 (mutacje `find-land-skips-shallow`, `enforce-skips-shallow` wykrywane).
4. **`mapHeight &&` / `mapHeight ?`**: `0` jest falszem (`Some(0)` => brak pasa klimatycznego; `cellBand = temperate_north`).
5. **Zbior masy lasu** to `new Set(part.filter(k => !hexes[k] || !woda))`: klucz bez heksa liczy sie jako lad (zachowane; unikalnosc i kolejnosc wstawiania jak w `Set`).
6. **`Math.round`** w lesie i strefie brzegu: polowka w kierunku `+inf` (`js_round`, wynik dokladny); `Math.max/min` propaguja `NaN` i rozrozniaja `-0` (`js_max`, `js_min`) - `f64::max/min` Rusta ignoruja `NaN`.
7. **`Math.pow(x, 2.0)`** w `mapCenterRadialBias`: V8 (fdlibm) zwraca `x * x`; pomiar 200 000 losowych `x` w Node v22.22.0: 0 roznic (`stats.powSquareDiffs` w wektorach); port `js_pow` robi `x * x` dla wykladnika 2, inaczej `powf` (NIE_ZMIERZONO wzgledem V8 - web wola tylko `y == 2`).
8. **`reapplyLandTerrain` czyta `hex.coords`**, a `scratch` po KLUCZU (`"q,r"`); w grze klucz == coords (generator wektorow to sprawdza i rzuca przy rozjezdzie). Rozjazd klucza i `coords`: NIE_ZMIERZONO.
9. **`hexes[k]!` na brakujacym heksie** (pierscien brzegu zawsze budowany z siatki) rzuca `TypeError` w webie; port panikuje z komunikatem `web: hexes[k] undefined (TypeError)`. Wszystkie wektory maja pelne siatki.
10. **Nieuzywane parametry weba zachowane** (zgodnosc sygnatur): `keysAtBorderDistance(hexes, ..)` (`_hexes`), `classifyTerrainFlat(.., landMask, _mtnNoise, ..)`, `reapplyForestOverlay(.., thresholds, ..)` (`_thresholds`), `TerrainClassifyThresholds.forest` (`@deprecated`).
11. **Dwa sortowania spojne** (`b.n - a.n`) tez przez `js_array_sort_by` - identyczne z V8 takze dla remisow i `NaN`.
12. **Brak efektow ubocznych poza `hexes`**: `reapplyForestOverlay` czysci `Las` i zapisuje tylko `nakladka`; `reapplyLandTerrain` zapisuje `terenBazowy` i `nakladka`; `setHexToMorze` zeruje `rzeka` i `zloze`, `setHexToLaka` zeruje tylko `zloze` (rzeka zostaje) - wszystko w wektorach `setHex` i `borderGrid`.

## 6a. Mutacje rownowazne (nie do wykrycia testem - uzasadnienie)

Te same uzasadnienia sa w `run-mutations.py` (slownik `EQUIVALENT`, drukowany w podsumowaniu).

**Runda 2: lista rownowaznych ma 3 pozycje (r1: 3), ale inna.** `forest-inland-gt-to-ge` (r1 poz. 1) NIE jest rownowazna i zostala przeniesiona do listy mutacji wykrywanych (zarzut 3, §00); w jej miejsce dochodzi mutacja parsera `parse-exponent-without-digits-ok` (poz. 5 nizej), ktora przezyla pierwsza partie r2 i jest rownowazna z DOWODEM (zastapiona mutacja z realnym skutkiem `parse-exponent-uppercase-rejected`).

1. ~~`forest-inland-gt-to-ge`~~ - **USUNIETA z rownowaznych.** Uzasadnienie r1 ("kazdy heks ma `sd == 1`, wiec bonus jest jednakowy, a kolejnosc sie nie zmienia") bylo bledne z dwoch powodow: (i) dodanie stalej `0.14` do `forNoise` NIE zachowuje kolejnosci przy remisach zmiennoprzecinkowych (np. `0 + 0.14 == 1e-20 + 0.14`), a `sort` jest stabilny, wiec remis przywraca kolejnosc wstawiania zamiast kolejnosci szumu; (ii) heks ladu bez wpisu w polu odleglosci (`?? 0`, np. skladowa bez wody) NIE dostaje bonusu, a pozostale dostaja `0.14`. Dowod: web uruchomiony z ta mutacja daje inny wynik w 29/48 map z `maxSeaInPart == 1` (§00 pkt 3; `stats.forestTie`).
2. `land-restore-keeps-overlay` (usuniecie `hex.nakladka = Brak` po przywroceniu reliefu): ten sam heks dostal `flatNak` w petli pierwszego przebiegu (`gen-helpers.ts:1140-1141`), a `classifyTerrainFlat` ma `const nakladka: Nakladka = Nakladka.Brak;` (`gen-helpers.ts:986`, zwracana jako `{ terenBazowy, nakladka }` w `:1003`, nigdy ponownie nieprzypisywana) - wiec przypisanie jest redundantne. Dowod z KODU (nie z probek).
3. `fade-cap-le-to-lt` (`cap <= 0` -> `cap < 0` w `landMaskBorderFade`, `gen-helpers.ts:1294-1300`): `marginLandCapForBorderDistance` (`:1191-1195`) zwraca `0` (literal `+0`), `0.05 * (d - 1)` dla `d >= 2` (czyli >= 0.05) albo `null`; `NaN` daje `null` (oba porownania falszywe). Dla `cap == +0` galaz `Math.min(1, 0 / 0.45)` daje `+0` - TEN SAM wzorzec bitowy co `return 0`; `cap < 0`, `-0` i `NaN` sa nieosiagalne.
4. (przebieg 1) `table-min-sufitu` 2 -> 3: `loop = min(cap, len)` i `ceil(len * 0.95) <= len` ograniczaja wynik niezaleznie od 2 vs 3 - zastapiona wartoscia 100, ktora zmienia wynik (gesty las wysokiego tieru) i jest wykrywana.
5. (r2) `parse-exponent-without-digits-ok` (usuniecie sprawdzenia `if i == exp_start { return NaN }` w `js_string_to_number`): gdy po `e`/`E` (i opcjonalnym znaku) nie ma cyfr, nastepujacy bezposrednio `body.parse::<f64>()` ZAWSZE zwraca `Err` => `NaN`, identycznie jak z wczesnym wyjsciem. Dowod: `std-parse-exponent-proof.txt` (rustc 1.97.0; `"1e"`, `"1e+"`, `"1e-"`, `"1.e"`, `".e1"`, `"1E"`, `"5e+"`, `"0e"`, `".5e"`, `"5.e+"` -> `Err(Invalid)`); sprawdzenie zostaje w kodzie jako jawne odwzorowanie gramatyki ECMA-262 (obrona w glebi), wiec nie jest kodem martwym z punktu widzenia specyfikacji, tylko redundantnym z `std`. Zastepcza mutacja z realnym skutkiem: `parse-exponent-uppercase-rejected` (wykladnik tylko `e`, nie `E`) - wykrywana kluczami `1E-2`, `1E+5` z weba.

## 6b. Mutacje r2: pelny przebieg 91 mutacji, dowod przywrocenia plikow (zarzuty 3 i 5)

Lista `MUTATIONS` w `run-mutations.py` ma w r2 **91** pozycji = 77 z r1 (bez zmian) + **14 nowych** (`forest-inland-gt-to-ge` oraz 13 mutacji parsera kluczy); 3 mutacje rownowazne poza lista (§6a). Wszystkie 91 uruchomione w r2 na kodzie z tego commitu, nie przepisane z r1.

**Wynik: 91/91 WYKRYTYCH, 0 przezylo, 0 bledow kompilacji w wyniku koncowym** (`PODSUMOWANIE` w `mutations-r2-*.log`; ostatni wynik per mutacja). Przebieg byl podzielony na 5 logow, bo dysk wspoldzielony byl pelny/zmienny i dwa procesy rownolegle (worktree + kopia crate'u) skracaly czas:

| log | zakres | wynik |
|---|---|---|
| `mutations-r2-a.log` | 8 nowych (`forest-inland-gt-to-ge`, 7 parsera) | 8/8 WYKRYTE, `EXIT=0` |
| `mutations-r2-b.log` | 6 parsera + `scatter-mask` + 1 rownowazna | 6/7 wykrytych; `parse-exponent-without-digits-ok` PRZEZYLA (rownowazna z dowodem, §6a poz. 5, `std-parse-exponent-proof.txt`) i zostala usunieta z listy; zastapiona `parse-exponent-uppercase-rejected` (wykryta w `-c`/`-e`) |
| `mutations-r2-c.log` | 39 mutacji (kopia worktree) | 37 wykrytych, 2 `BLAD-KOMPILACJI` z przyczyny INFRA `No space left on device` (`fractions-highland-tier`, `radial-sign`; runner powtorzyl je, ale dysk byl nadal pelny) -> **powtorzone w `-e`: obie WYKRYTE** |
| `mutations-r2-d.log` | 38 mutacji (kopia crate'u w scratch) | 30 wykrytych; przebieg PRZERWANY przez zewnetrzne usuniecie katalogu scratch z kopia crate'u (traceback `FileNotFoundError` w logu) - nie wplywa na repo; 8 brakujacych (`table-*`) wykonanych w `-e` |
| `mutations-r2-e.log` | 10 brakujacych (2 INFRA z `-c` + 8 `table-*` z `-d`) | 10/10 WYKRYTE, `EXIT=0`, `POWTORZENIA Z POWODU INFRA: []` |

**Nowe mutacje r2 i testy, ktore je zabijaja:** `forest-inland-gt-to-ge` -> `reapply_forest_overlay_targeted_inland_cases_match_web`; `parse-key-old-simplified` (stary parser z r1), `parse-ws-rust-set`, `parse-ws-no-feff`, `parse-ws-no-en-quad-range`, `parse-hex-prefix-removed`, `parse-binary-prefix-removed`, `parse-radix-empty-digits-ok`, `parse-radix-rounding-no-sticky`, `parse-infinity-case-insensitive`, `parse-exponent-uppercase-rejected` -> `parse_hex_key_edge_keys_match_web`; `parse-key-missing-second-zero`, `parse-sign-dropped` -> `parse_hex_key_edge_keys_match_web` + stary pin `parse_hex_key_matches_js_number_for_hexkey_strings`; `parse-radix-rounding-truncate` -> `parse_hex_key_edge_keys_match_web`. `scatter-mask` (INFRA w r1) w r2 wykryta czysto (`margin_scatter_score_matches_web`, bez powtorzen).

**Dowod przywrocenia plikow (zarzut 5):** `run-mutations.py` r2 liczy SHA-256 BAJTOW z dysku obu mutowanych plikow przed przebiegiem, **po kazdej mutacji** (wiersz `PRZYWROCONO <plik>:sha256=<16 znakow>..=OK` per mutacja i per plik, razem 94 wiersze = 91 mutacji + 1 rownowazna + 2 powtorzenia po INFRA, 0 wierszy `ROZNI-SIE`) i na koncu (`SHA256 koncowe:` pelny skrot); niezgodnosc => `exit 3`. Skroty (identyczne we wszystkich logach r2, ktore doszly do konca - `-a`, `-b`, `-c`, `-e`; `-d` przerwany, ma tylko skrot poczatkowy i 30 wierszy `PRZYWROCONO ... OK`; poczatek == koniec): `src/domain/mapgen/terrain_class.rs` = `516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315`, `data/derived/mapgen-terrain-class.json` = `f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834`. Dodatkowo bramki `fmt`/`clippy`/`test` i `git diff --cached --check` z §7 uruchomione PO wszystkich mutacjach na tych samych plikach (log `gate-fmt-r2.log` zaczyna sie od `sha256sum` obu plikow = te same skroty).

**Incydent procesowy (jawnie):** pierwszy pelny przebieg zostal przerwany przeze mnie komenda `pkill -f run-mutations.py` w trakcie 3. mutacji (`hash-const-a`); proces Pythona zginal bez bloku `finally`, wiec `terrain_class.rs` zostal ZMUTOWANY (SHA `52f06d75...`). Plik odtworzono: skrypt probowal odwrocic kazda mutacje z listy i znalazl ta, ktora daje skrot oryginalu `516614bc...` (`hash-const-a`), po czym zapisal oryginal i potwierdzil `sha256sum`. Poprawka: runner obsluguje teraz `SIGTERM`/`SIGINT` (normalne wyjscie z `finally`) i przy INFRA czeka 60 s i powtarza (do 8x). Uwaga: `pkill -f` po nazwie skryptu na wspolnej maszynie jest zbyt szerokie (mogl zdarzyc sie efekt uboczny na cudzym procesie o takiej samej nazwie - NIE_ZMIERZONO, nie powtarzac).

## 7. Bramki (surowe, PELNE logi w runie, kazdy z `EXIT=`)

Srodowisko r2: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_5dbe3591-4a2-3 CARGO_PROFILE_DEV_DEBUG=0`, cargo w `rust-port/engine`, `--offline`; podkatalogi celu (`wf_5dbe3591-4a2-3`, `wf_5dbe3591-4a2-3-b`) usuniete po zakonczeniu; `Cargo.lock` nie commitowany. Logi r1 (`*-r1.log`) zostaja w runie jako historia.

| bramka | log | wynik |
|---|---|---|
| `cargo fmt -- --check` | `gate-fmt-r2.log` | `EXIT=0` |
| `cargo clippy --offline --all-targets -- -D warnings` | `gate-clippy-r2.log` | `EXIT=0` |
| `cargo test --offline --no-fail-fast` | `gate-test-r2.log` | **892 passed, 0 failed**, `EXIT=0` |
| `git diff --cached --check` (po jawnym `git add`) | `gate-diffcheck-r2.log` | `EXIT=0` |
| generator wektorow | `gen-m04-r2.log` | `EXIT=0`, skrot `bbaeee3a...a44cc` powtarzalny (dwa przebiegi) |
| porownanie wektorow r1 vs r2 | `cmp-vectors-r1-r2.log` | 19 kategorii identycznych, 2 nowe, `EXIT=0` |
| weryfikator Python | `verify-m04-r2.log` | 169542 sprawdzen, 0 rozbieznosci, `EXIT=0` |
| weryfikator - test negatywny | `verify-m04-negative-r2.log` | 9 rozbieznosci, `EXIT=1` (oczekiwane) |
| mutacje kodu/tabeli | `mutations-r2-*.log` (§6) | patrz §6 |
| pomiar starego hasza | `legacy-hash-divergence.log` (r1, bez zmian) | patrz §0 |

Skrypty: `gen-m04-vectors.mjs` (+ `m04-loader-register.mjs`, `m04-loader-hooks.mjs`), `verify-m04-vectors.py`, `tamper-vectors.py`, `run-mutations.py`, `cmp-vectors-r1-r2.py`, `legacy-hash-divergence.py`.

## 8. Zmiany (allowlista)

- `rust-port/engine/src/domain/mapgen/terrain_class.rs` (wypelniony; naglowek z `Temat wlasciciel:` zachowany),
- `rust-port/engine/tests/p6_m04_classify.rs`, `p6_m04_reapply.rs`, `p6_m04_border.rs`, `p6_m04_tables.rs`, `rust-port/engine/tests/p6_m04_vectors/web-vectors.json`, `rust-port/engine/tests/p6_m04_vectors/common.rs`,
- `rust-port/engine/data/derived/mapgen-terrain-class.json` (NOWY) i `rust-port/engine/src/data/derived.rs` (dopisek NA KONCU pliku - wyjatek jawnie dopuszczony w dispatchu; **plik JSON nie jest wymieniony w liscie "Kod" dispatchu, ale kryterium binarne wymaga "stale balansowe -> edytowalne tabele `data/derived/*.json` + parser w `data/derived.rs`"** - to rozszerzenie allowlisty wynika wprost z kryterium i jest zgodne z precedensem M01/M10 oraz M03 (LEDGER wiersz 201: ratyfikacja orkiestratora jako "dziura w dispatchu, nie defekt"); **WYMAGA ratyfikacji orkiestratora, bo Operator nie moze sam rozszerzyc allowlisty** (§00 pkt 2); r2 NIE dotyka tego pliku ani `derived.rs`),
- `dyspozycje/rust-port/p6/P6-M04-TEREN-KLASYFIKACJA-GRANICE.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/**` (dispatch, generator, loader, weryfikator, skrypty, logi, raport).
- Zero zmian w `domain/mod.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `tests/p6_m00_skeleton.rs`, `map_generator.rs`, `cluster_mass.rs`, ani w istniejacych testach.

## 9. Odczyt zrodel (liczby linii) i dokumenty

- Web (pin `edb8fb56`, `wc -l`): `gen-helpers.ts` **12 561** linii. **Zakres M04 (:233-236 i :825-1407) przeczytany w CALOSCI**, razem z sasiedztwem `:1408-1437` (`groupLandMassKeys`). Doczytane zaleznosci: `:1-60` (naglowek, importy), `:220-245`, `:1550-1620` (`isForestEligibleTerrain`, `landPartitionKeysForDistribution`, `FOREST_*`), `:1830-1860` (`forestCoverageCellSize`, `minLandHexesFor*`), `:3195-3345` (`parseHexKey`, `sortLandKeysForErosion`, `countMorseNeighbors`, `setHexTo*`), `:5605-5640` (`buildSeaDistanceField`), `:8350-8390` (`landHexesByCoverageCell`). **Reszta pliku (`:61-219`, `:246-824`, `:1438-1549`, ... ) NIE przeczytana w calosci - NIE_ZMIERZONO**; nalezy do M01-M03, M05-M08, M13 (tabela P6-25 §6). `earth-land-mask.ts` (170 linii) `:17-58` (zaleznosc `earthPolarOceanRows` dla weryfikatora), `types/hex.ts` (140 linii) w calosci.
- Rust: `terrain_class.rs`, `prims.rs` (sygnatury), `params.rs` (`DensityTier`), `cluster_mass.rs` `:1-110` (`js_array_sort_by`), `map_generator.rs` `:15-175` i `:890-915` (stare duplikaty), `data/derived.rs` (naglowek, `StartValue`, `TierTriple`, koncowka), `tests/p6_m00_skeleton.rs` `:60-100`, `tests/p6_m10_tables.rs`, `tests/p6_m10_vectors/common.rs`.
- Dokumenty r1 (z `claude/sprawdzenie-funkcjonalnosci-ek4ra0`): `00-dispatch.md` w calosci; `P6-0-GAP-ANALYSIS.md` §0, §5, §6b; `P6-M14-TERYTORIUM-ZASIEG-CUDA.md` (147 linii, w calosci); z repo: `P6-M10-KLASTRY-MASY-BRAMKI.md` §0, §1, §4-§9, `P6-M01-RDZEN-WERYFIKACJA.md` §0-§6, skrypty `run-mutations.py`/`verify-m10-vectors.py` (TimSort). Dokumenty obowiazkowe NIEPRZECZYTANE w r1 sa w r2 przeczytane wg §9a.

### 9a. Dokumenty obowiazkowe z dispatchu (zarzut 1 Evaluatora r1) - dowod odczytu i skutki dla portu (r2)

Odczyt: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` do pliku w scratch (poza repo), potem `Read` zakresami; liczby linii z `wc -l`. W przeciwienstwie do r1/P6.5B szerokosc wierszy tabel NIE byla obcinana (zakresy ponizej czytane pelna szerokoscia).

| Dokument | Linie | Przeczytane (zakresy) | NIEPRZECZYTANE (jawnie) | Wniosek wazny dla M04 / skutek |
|---|---|---|---|---|
| `p6/P6-0-GAP-ANALYSIS.md` | 435 | 1-435 (calosc, w tym §3 wszystkie 183 wiersze, wiersze P6.1 = 16) | - | §3 dotyczy WYLACZNIE `gra/src/game/**`; `gen-helpers.ts` lezy w `gra/src/map/` (zakres P6-25), wiec M04 nie ma wiersza w §3. Wiersze P6.1 (`cluster-start`, `inca-llama-seed` -> `map_generator.rs`) nie naleza do M04. §0: PORTOWANE-1:1 = 0 do czasu wektorow z weba - M04 przyznaje PORTOWANY wylacznie z wektorem i testem. §5b: `domain/rng.rs` vs `mulberry32` w `gen-helpers.ts` wymaga wektorow - M04 nie uzywa PRNG (tylko `hashInt3`), dedup `Mulberry32` to RUNDA-2 M01. §6b-i: wspolna sciezka `data/derived.rs` (dopisek na koncu) jest dopuszczona dispatchem. |
| `p3/P3-22-FLATTEN-STAGE2.md` | 441 | 1-441 (calosc) | - | Wzorzec: stale/mnozniki -> tabele `data/derived/*.json` + parser; testy BEZ pinow wartosci (§12.0 pkt 5: porownanie tabeli z literalem w tescie = pin); status per wiersz z plik:linia; generator URUCHAMIA kod weba; weryfikator niezalezny z testem negatywnym; zakaz etykiet ogolnych. M04 stosuje to samo (`p6_m04_tables.rs` nie pinuje wartosci; testy wektorowe sa swiadomie testami PARYTETU, §5). Pozycje 35j (`RELIEF_OVERFLOW_CAP_MULT` `gen-helpers.ts:2181`, `MOUNTAIN_RANGE_REGROW_TARGET_MULT` `:2480`) i 35k leza POZA zakresem M04 (233-236, 825-1407) - nie dotyczy. |
| skrypty `R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/` | `gen-loader-hooks.mjs` 28, `gen-loader-register.mjs` 3, `gen-diplomacy-web.mjs` 67, `gen-combat-web.mjs` 73, `gen-trade-web.py` 43, `verify-combat-web.py` 174, `verify-diplomacy-web.py` 176, `verify-trade-web.py` 66 | wszystkie 8, calosc | `check-etap3.py` i logi `dowody/` (nie skrypty wzorcowe z dispatchu) | Loader P3-22 (`.ts`/`/index.ts` + `.json` jako modul) == `m04-loader-hooks.mjs`; `--experimental-transform-types` jest wymagany dla enumow TS (jak w M04). Roznica na korzysc M04: kod weba jest URUCHAMIANY dla CALEGO zakresu (P3-22 czesciowo czyta literaly - `gen-trade-web.py`). Weryfikatory P3-22 porownuja tabele z uruchomieniem i literalami; M04: `verify-m04-vectors.py` + test negatywny. |
| `p2/P2-3-ENTITY-IDS.md` | 380 | 1-135, 269-380 | 136-268 (§4-§5: porownanie pol `RuntimeUnit`/`City`) | D-ID-6 (kanon pozycji `HexCoord{q:i32,r:i32}`): M04 liczy `q`/`r` jako `f64` w funkcjach czysto liczbowych i `i64` w iterujacych po siatce (§3a) - M04 nie wprowadza nowego typu pozycji w `GameState`; `TerrainHex`/`HexRecord` to wycinek `Hex` (docelowy `MapHex` = RUNDA-2 M01, LEDGER wiersz 192). Klucze heksow `"q,r"` to NIE identyfikatory bytow (D-ID-1..3 ich nie dotycza). `grep -c` po symbolach M04 (`classifyTerrain`, `gen-helpers`, `reapplyForest`, `mapBorder`, `terrainCellBias`, `hashInt3`, `parseHexKey`, ...) w calym dokumencie = 0, w nieprzeczytanym fragmencie 136-268 (grep `hex\|teren\|terrain`) = 0. |
| `p2/P2-5-COMMANDS.md` | 668 | 1-80, 198-212, 482-581, 654-668 | 81-197, 213-481 (tabele akcji §2.1-§2.9, §2.11-§2.13) | Funkcje M04 to czysta logika generatora mapy, nie komendy gracza; jedyny zwiazek: `create_session`/`StartGameParams` (Z5, `playable.rs:413`) - poza M04. `grep` po symbolach M04 w calym dokumencie = 0; w nieprzeczytanych 81-197/213-481 jedyne trafienia na `teren` to O9 (skroty budowy) i O14 (tryb budowy w terenie), niezwiazane z klasyfikacja terenu. |
| `PLAN-PORT-RUST-TAURI-20261020.md` | 305 | 1-305 (calosc, §P6 = 197-222) | - | P6.1 (stan poczatkowy/seed/inicjalizacja) i P6.3 (teren) jako ramy; zasady: web = referencja read-only, zakaz "drugiej uproszczonej gry", test stanu przed/po, przypadki negatywne - M04 spelnia. Limit 5 rund, jeden pisarz na worktree, brak `git add -A`. |
| `LEDGER.md` | 201 | 1-53 (calosc, pelna szerokosc wierszy); z wierszy 54-201: wiersze z `grep -E 'P6\|M04\|M01\|M10\|M14\|mapgen\|gen-helpers'` (m.in. 163, 164, 168-173, 175, 177, 179, 180, 183, 186, 188-193, 199-201) - wiersze po grepie OBCIETE do 420 znakow, wiersze 180, 191, 192, 201 przeczytane do 1800 znakow (calosc) | pozostale wiersze 54-201 (historia P1-P3, nie dotyczaca M04) oraz koncowki dluzszych wierszy P6 poza 420 znakami | **Wiersz 201 (M03):** `data/derived/mapgen-masks.json` + parser w `derived.rs` poza allowlista = "dziura w dispatchu, nie defekt" (ratyfikacja orkiestratora) -> precedens dla zarzutu 2. Wiersz 192 (M01): RUNDA-2 `MapHex` w `types.rs`, dedup `Mulberry32`. Wiersz 191 (M02): `defaultLandFractionForTyp` kopia w M02. Wiersz 180 (P6-25): Rust `generate_map` NIE jest portem `generateMap` (zgodnosc terenu 22-43%) - zgodne z moim odkryciem o `hash_int3` (§0). Wiersz 188 (M00): test szkieletu poprawiony po wypelnieniu pliku przez temat M*. |
| `p6/P6-5B-JEDNOSTKI-ZYCIE-B.md` | 1737 | 1-56, 169-313 (§0-§2a, §4-§9) | 57-168 (tabela symboli §3), 314-1737 (§10 odtworzenie, §11 surowe logi bramek) | Wzorzec: (i) jak postepowac z mutacja rownowazna - M02 (`clampLudki`) uznana za rownowazna Z DOWODEM z kodu i zastapiona mutacja M33; (ii) mutacje grupowe wymagaja dowodu rozlacznosci binariow - M04 uruchamia mutacje POJEDYNCZO (jedna zmiana = jeden build), wiec rozlacznosc nie dotyczy; (iii) §11 = surowe, PELNE kopie `gate-*.log` w dokumencie -> w r2 dodane jako §11 tutaj; (iv) jawna lista NIE_ZMIERZONO. `grep` po symbolach M04 w calym dokumencie = 0. |

Skutki praktyczne wszystkich odczytow dla r2: (1) rozstrzygniecie zarzutu 2 powolujace sie na precedens M03; (2) zarzut 3 - mutacja rownowazna wymaga dowodu z kodu/weba, nie z "reguly" (P6.5B); (3) §11 z surowymi logami; (4) zero zmian kontraktu pozycji/ID (P2-3) - M04 nie zmienia `GameState`.

## 10. Ryzyka / do Evaluatora i orkiestratora

1. **Hasz w starym generatorze** (§0): `map_generator::hash_int3` (u32) rozni sie od weba dla ziaren > ~4e6 (99,5% prob. z pelnego u32). Dopoki `generate_map` go uzywa, mapy z duzych ziaren nie sa zgodne z webem. Naprawa wymaga edycji `map_generator.rs` (poza allowlista M04): przejscie na `terrain_class::hash_int3`/`terrain_cell_bias`. Do osobnego tematu (np. integracja M18).
2. **Stare duplikaty** w `map_generator.rs` (`classify_terrain` uproszczona, `terrain_cell_bias`, `land_mask_border_fade`, `edge_rect_fade`, `border_distance`, stale `TERRAIN_*`) - nieporuszane; po integracji generatora nalezy je usunac.
3. **Lokalne kopie** `parse_hex_key`, `set_hex_to_morze`, `set_hex_to_laka` (wlasnosc innego tematu, `gen-helpers.ts`:3200-3340) - zdeduplikowac po jego porcie; funkcje sa `pub`, wiec konsument moze sie przelaczyc bez zmian zachowania (kontrakt zamrozony wektorami `setHex`).
4. **Model heksa**: `TerrainHex`/`HexRecord` to wycinek `Hex` weba; docelowy `MapHex` (M01, `types.rs`) powinien dostarczyc konwersje albo zastapic wycinek; kontrakt kolejnosci (`Object.entries`) jest istotny dla remisow sortowan.
5. **Cargo.lock**: `cargo` utworzyl lokalny `Cargo.lock` (nieobecny w repo) - NIE commitowany, zgodnie z dispatchem.
6. **(r2) Duplikat `Number(string)` w silniku**: `pathfinding::ruch_jednostek::js_number_from_str` (P6.4, `pathfinding.rs:1611`) robi to samo co nowe `terrain_class::js_string_to_number`, ale z odmiennym zbiorem bialych znakow (`char::is_whitespace || U+FEFF`: obcina U+0085, ktorego JS NIE obcina) i bez poprawnego zaokraglenia liczb o podstawie 2/8/16 powyzej 53 bitow (akumulacja `acc * radix + cyfra` w f64). To obserwacja z czytania kodu - NIE_ZMIERZONO na wektorach (cudzy zakres, nie ruszano). Po obu portach nalezy zdeduplikowac, biorac wersje z wektorami z weba (788 kluczy M04).
7. **(r2) Zakres `parseHexKey`**: web operuje na lancuchach UTF-16 (mozliwe samotne surogaty); Rust na `&str` (UTF-8) - klucze z samotnymi surogatami nie sa reprezentowalne (nieosiagalne: klucze buduje `hexKey` z liczb). NIE_ZMIERZONO dla takich lancuchow.
6. **Niezmierzone**: zachowanie V8 w innych wersjach niz Node v22.22.0 (algorytm sortowania stabilny od V8 7.0; `Math.pow` dla wykladnikow != 2); inne silniki JS.
## 11. Surowe, PELNE wyjscia bramek r2 (kopie plikow runu, bez wyciagow; kazde z `EXIT=`)

Kopie sa tresciowo rownymi plikami w katalogu runu (usunieto tylko koncowe spacje wymagane przez `git diff --check`).

### 11.1 cargo fmt -- --check (gate-fmt-r2.log)

```text
$ sha256sum (stan drzewa przed bramkami)
516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315  src/domain/mapgen/terrain_class.rs
f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834  data/derived/mapgen-terrain-class.json
$ cargo fmt -- --check
EXIT=0
```

### 11.2 cargo clippy --offline --all-targets -- -D warnings (gate-clippy-r2.log)

```text
$ cargo clippy --offline --all-targets -- -D warnings
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 3m 45s
EXIT=0
```

### 11.3 cargo test --offline --no-fail-fast (gate-test-r2.log)

```text
$ cargo test --offline --no-fail-fast
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 6m 54s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test wounded_units_retreat_before_attacking ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test civilian_units_do_not_receive_combat_orders ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test manifest_dest_paths_are_unique ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test negative_validator_rejects_wrong_sha ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.68s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_conversions_round_trip ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_serializes_as_bare_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/combat-7737db4785daf590)

running 7 tests
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test table_has_each_row_once_with_known_class_and_status ... ok
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok
test explicit_unit_bonus_overrides_table ... ok
test table_type_keys_are_canonical ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test buildings_json_parses ... ok
test wonders_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_auto_battle_params ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test rt_buildings ... ok
test rt_civ_params ... ok
test rt_civs ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_civ_matrix ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_miasto_params ... ok
test roundtrip_covers_all_29_data_files ... ok
test rt_tech ... ok
test collection_id_sets_match_web_pin ... ok
test rt_terrain_improvements ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_resources ... ok
test rt_wonders ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok
test rt_society_params ... ok
test rt_terrain_combat ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_ai_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_missing_file_is_file_missing ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.15s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_table_key_shape_and_positive_integer_values ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test annexation_requires_vassal_economy_orientation ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_movement_costs_are_explicit ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_qualification_matches_the_world_map_rules ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test tile_and_production_are_json_round_trip_safe ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test map_dimensions_and_seed_are_stable ... ok
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test camp_id_is_a_transparent_newtype ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_entry_label_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test civ_entry_epoch_matches_web_vectors ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test game_epoch_order_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test awaiting_first_city_matches_web_for_owner_zero ... ok
test denied_message_matches_web_constant ... ok
test hex_in_start_reveal_matches_web_vectors ... ok
test validate_placement_matches_web_vectors ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test hot_seat_cycles_and_skips_unknown_active ... ok
test human_owner_primary_matches_web ... ok
test human_seats_match_web_vectors ... ok
test major_ai_owner_matches_web_vectors ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok
test stub_constants_are_the_web_sentinels ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test parity_constants_and_defaults_match_web ... ok
test error_research_step_is_atomic_on_missing_cost ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test parity_gates_available_and_cheapest ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_per_row_functions ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test parity_scenarios_from_web ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test parity_parse_prereqs_and_prereqs_met ... ok
test parity_epoch_number ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.68s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test has_braz_access_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test normalize_improvement_key_matches_web ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.87s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test constants_and_start_relations_match_web ... ok
test display_label_for_slot_matches_web ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test pick_second_human_start_hex_matches_web ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.32s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test cluster_table_has_sane_shape ... ok
test braz_table_has_sane_shape_and_consistent_references ... ok
test llama_table_has_sane_shape ... ok
test start_tables_parse_with_deny_unknown_fields ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test city_name_with_suffix_matches_web ... ok
test collect_used_city_names_matches_web ... ok
test nazwa_klastra_at_matches_web ... ok
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test pool_length_constants_match_web ... ok
test rival_pool_index_matches_web ... ok
test resolve_state_city_name_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test state_city_name_at_matches_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok
test validate_city_names_pools_matches_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.19s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test apply_multiplier_matches_web ... ok
test building_cost_discount_matches_web ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test is_combat_modifier_bonus_matches_web ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 28.39s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok
test rules_have_known_stats_and_param_ids ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_fallback_branches_are_actually_exercised ... ok
test ai_params_and_diplomacy_rows_match_web ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test ai_by_typ_resolvers_match_web ... ok
test civ_matrix_param_matches_web ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test median_matches_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test proc_sum_and_apply_proc_match_web ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test profile_by_key_resolution_matches_web ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test synthetic_cell_grid_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok
test snapshot_and_profiles_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.35s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test find_klastra_display_validate_match_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test constants_match_web ... ok
test civ_ids_from_roster_matches_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test pick_active_civ_pool_matches_web ... ok
test assign_ai_civ_types_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.07s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test math_round_matches_js_bit_for_bit ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test number_to_string_matches_js_for_every_vector ... ok
test parameter_label_matches_web ... ok
test trim_matches_js_string_trim ... ok
test intensity_label_matches_web ... ok
test formatted_value_matches_web ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test modules_contain_no_balance_or_data_literals ... ok
test tables_parse_and_are_cached ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test takeover_on_city_founded_matches_web ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test territory_dependencies_match_web ... ok
test evacuation_hex_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.92s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test city_at_hex_and_occupancy_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok
test foreign_city_blocks_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test era_and_cost_scaling_match_web ... ok
test applying_bonuses_matches_web ... ok
test constants_match_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test hex_layer_functions_match_web ... ok
test rules_tables_have_consistent_shape ... ok
test migration_functions_match_web ... ok
test normalize_and_lookup_functions_match_web ... ok
test territory_and_ore_yields_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.27s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test fallback_params_equal_web_constant ... ok
test engine_society_params_match_web_subset_used_by_vectors ... ok
test evaluate_order_matches_web ... ok
test compute_order_matches_web ... ok
test load_order_params_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test order_effects_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok
test order_tier_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok
test happiness_breakdown_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.71s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test ulepszenia_reguly_table_references_existing_improvements_only ... ok
test porzadek_params_table_is_complete_and_finite ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test hex_distance_matches_web ... ok
test constants_read_from_running_web_match_tables ... ok
test path_cost_matches_web ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test stack_group_id_matches_web ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test terrain_cost_combinations_match_web ... ok
test visibility_helpers_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.19s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test water_hex_queries_match_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.70s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test fog_frontier_and_fog_plan_match_web ... ok
test plan_path_turns_matches_web ... ok
test save_validation_and_round_trip_match_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test should_stop_at_obstacle_matches_web ... ok
test execute_march_step_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.99s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test launch_leaders_one_per_stack_match_web ... ok
test load_from_save_and_number_parsing_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test scout_flags_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 57.75s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok
test numeric_rows_have_sane_shape_without_pinning_values ... ok
test neighbour_table_is_six_distinct_adjacent_offsets ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test table_constants_equal_the_running_web_object ... ok
test unit_cost_pace_matches_web_bitwise ... ok
test js_round_matches_half_up_semantics ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test stack_vitals_matches_web ... ok
test unit_at_representative_matches_web ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test badge_and_veteran_maxima_match_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.53s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test adjacent_empty_and_split_destinations_match_web ... ok
test hud_actions_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test sync_and_deduct_match_web ... ok
test ruch_pools_match_web_bitwise ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test separate_return_matches_web_bitwise ... ok
test unit_with_pooled_ruch_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.23s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test adjacent_army_hexes_and_active_stack_match_web ... ok
test all_defenders_and_wake_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test law_garrison_counts_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test stack_group_id_and_render_key_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.28s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test chain_depth_limit_matches_web ... ok
test building_roles_and_real_game_data_match_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 17.25s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test number_to_string_matches_web ... ok
test citizen_label_matches_web ... ok
test population_formats_match_web ... ok
test locale_compare_matches_web_for_ascii ... ok
test locale_compare_table_is_the_measured_primary_order ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.15s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test city_pool_functions_match_web ... ok
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test civ_bonus_multipliers_match_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test opt_helpers_are_consistent ... ok
test empire_totals_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test raw_param_loaders_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test spawn_and_refund_functions_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 22.14s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.98s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test civilian_set_is_resolved_from_the_table ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.30s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test mapgen_mod_declares_exactly_doc_modules ... ok
test doc_row_lists_expected_counts ... ok
test domain_mod_declares_top_level_skeleton_modules ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok
test files_exist_and_start_with_owner_doc_header ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test forest_threshold_matches_web_bit_for_bit ... ok
test desert_assignment_predicate_matches_web ... ok
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test polar_predicate_matches_web ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test named_constants_match_web_exports ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test sample_template_land_nan_is_sea ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.60s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test mask_file_is_well_formed ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.42s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test hex_directions_match_web_in_every_implementation ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test hex_key_matches_web_format ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test cos_lerp_matches_web_bit_for_bit ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test vectors_come_from_the_pinned_web_run ... ok
test perm_table_matches_web_for_all_256_entries ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test parse_helpers_cover_all_tokens ... ok
test metal_deposit_min_era_table_matches_web ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test deposit_visibility_matches_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_without_environment_matches_web ... ok
test river_switch_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test menu_labels_match_web ... ok
test normalization_matches_web ... ok
test size_dims_and_order_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test density_to_label_round_trips_where_web_does ... ok
test civ_menus_with_rosters_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test constants_match_web ... ok
test land_fraction_functions_match_web ... ok
test river_map_params_match_web_bitwise ... ok
test tier_functions_match_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test world_generation_presets_match_web ... ok
test clamp_miasta_panstwa_count_matches_web ... ok
test per_label_functions_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.90s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test constants_match_web ... ok
test per_label_functions_match_web ... ok
test tier_to_label_and_preset_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test every_section_names_its_web_source ... ok
test land_and_toggle_tables_are_consistent ... ok
test map_label_thresholds_are_ascending_and_known ... ok
test river_rules_have_sane_ranges ... ok
test size_tables_are_consistent ... ok
test per_size_menus_cover_every_size ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m04_border.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m04_border-6bff5e3eb79596bf)

running 12 tests
test border_consts_match_web ... ok
test erosion_hook_matches_web ... ok
test is_in_map_border_with_buffer_matches_web ... ok
test lat_buffer_matches_web ... ok
test margin_cap_matches_web ... ok
test margin_scatter_score_matches_web ... ok
test parse_hex_key_edge_keys_match_web ... ok
test parse_hex_key_matches_js_number_for_hexkey_strings ... ok
test set_hex_to_morze_and_laka_match_web ... ok
test border_grid_tools_match_web ... ok
test fades_and_distances_match_web ... ok
test apply_marginal_land_zone_caps_matches_web ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.53s

     Running tests/p6_m04_classify.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m04_classify-421508a5d4a5c685)

running 7 tests
test consts_match_web ... ok
test relief_elev_gates_match_web ... ok
test classify_terrain_flat_matches_web ... ok
test hash_int3_matches_web ... ok
test classify_terrain_matches_web ... ok
test rown_laka_jitter_matches_web ... ok
test terrain_cell_bias_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.34s

     Running tests/p6_m04_reapply.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m04_reapply-8accc2cf3c58125d)

running 4 tests
test reapply_land_terrain_matches_web ... ok
test reapply_forest_overlay_targeted_inland_cases_match_web ... ok
test forest_replay_hooks_reject_wrong_arguments ... ok
test reapply_forest_overlay_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.61s

     Running tests/p6_m04_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m04_tables-4d2b90ef46470e0e)

running 4 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test floats_are_parsed_exactly_from_the_raw_json_text ... ok
test table_parses_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test group_foreign_type_clusters_matches_web ... ok
test foreign_buffer_gate_matches_web ... ok
test cluster_pack_radius_matches_web ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test half_plane_axis_matches_web_bitwise ... ok
test is_in_half_plane_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 23.08s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test allocate_typy_to_masses_matches_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test mass_qualifies_and_indices_match_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 18.35s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test pick_player_cluster_center_matches_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok
test player_start_candidates_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 28.39s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test score_city_start_hex_over_whole_maps_matches_web ... ok
test reveal_radius_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.42s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test values_have_sane_shape ... ok
test tables_parse_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.06s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test territory_keys_by_owner_match_web ... ok
test culture_range_matches_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.40s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test city_range_for_population_matches_web ... ok
test city_sight_radius_matches_web ... ok
test axial_distance_matches_web_and_integer_variant ... ok
test city_territory_radius_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test is_in_territory_matches_web ... ok
test is_player_territory_hex_matches_web ... ok
test territory_owner_at_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.56s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test shape_candidates_are_sorted_land_and_exclude_center ... ok
test pick_matches_web ... ok
test list_for_city_matches_web ... ok
test list_for_owner_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.16s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test is_territory_hex_owned_by_matches_web ... ok
test city_center_keys_match_web ... ok
test reconcile_without_reczne_is_noop ... ok
test build_territory_nodes_matches_web ... ok
test reconcile_all_matches_web ... ok
test reconcile_for_owner_matches_web ... ok
test reczne_key_legal_matches_web ... ok
test workable_filter_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.99s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test has_road_matches_web ... ok
test constants_match_web ... ok
test is_road_key_matches_web ... ok
test road_table_shape_and_key_names ... ok
test roads_source_has_no_numeric_data_literals ... ok
test collect_road_keys_matches_web_order ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok
test apply_modifier_matches_web_bitwise ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.24s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_terrain_eligible_matches_web ... ok
test gallery_combo_eligible_and_show_model_match_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 20.32s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test can_add_food_layer_matches_web ... ok
test deposit_rules_match_web ... ok
test farm_and_owce_base_terrain_match_web ... ok
test forest_blocking_and_hints_match_web ... ok
test format_impact_list_matches_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test hex_keys_within_radius_matches_web ... ok
test hex_has_road_matches_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test livestock_dependency_matches_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 10.63s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test food_and_sector_tables_are_consistent ... ok
test terrain_codes_in_tables_are_valid ... ok
test rule_keys_are_known_improvements ... ok
test livestock_and_tech_tables_are_consistent ... ok
test improvement_build_has_no_balance_number_literals ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test rebuild_errors_name_the_failing_field ... ok
test rebuild_matches_web ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.68s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_matches_web_structurally ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.65s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test is_valid_matches_web_for_all_vectors ... ok
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.57s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_divisors_are_integers_read_from_the_table ... ok
test road_floor_row_is_readable_and_positive ... ok
test road_movement_table_covers_each_constant_once ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test canonical_state_round_trips_through_serde ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test no_structure_gives_neutral_multiplier ... ok
test structures_are_ignored_outside_siege ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test pure_preview_does_not_mutate_input_balances ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test flow_helpers_are_deterministic_and_saturating ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 11.4 git diff --cached --check (gate-diffcheck-r2.log)

```text
$ git diff --cached --check   (po jawnym git add listy plikow; bez -A)
EXIT=0
```

### 11.5 generator wektorow (gen-m04-r2.log)

```text
OK {"node":"v22.22.0","lines":12562,"counts":{"consts":1,"latBuffer":10252,"hashInt3":4076,"cellBias":5012,"jitter":3000,"elevGates":514,"classify":6219,"classifyFlat":6219,"reapplyLand":45,"reapplyForest":64,"forestEligible":8,"erosionSort":42,"marginZone":42,"setHex":48,"marginCap":77,"fades":4512,"inBorderBuf":1500,"borderGrid":56,"scatter":2500,"parseHexKey":788,"reapplyForestTie":51},"stats":{"classifyTerrain":{"laka":2511,"wzgorza":538,"morze":732,"rownina":1726,"gory":556,"pustynia":156},"classifyTerrainFlat":{"laka":3599,"rownina":2379,"pustynia":241},"powSquareDiffs":{"total":200000,"diff":0},"forestTie":{"cases":51,"maxSeaOne":48,"mutantDiffers":29,"assignedTotal":3059,"casesWithForest":39,"differsAmongMaxOne":29,"differsWhenMaxGt1":0}}}
EXIT=0
```

### 11.5b powtorna generacja z odtworzonego web-rootu (gen-m04-r2-powtorzenie.log)

```text
OK {"node":"v22.22.0","lines":12562,"counts":{"consts":1,"latBuffer":10252,"hashInt3":4076,"cellBias":5012,"jitter":3000,"elevGates":514,"classify":6219,"classifyFlat":6219,"reapplyLand":45,"reapplyForest":64,"forestEligible":8,"erosionSort":42,"marginZone":42,"setHex":48,"marginCap":77,"fades":4512,"inBorderBuf":1500,"borderGrid":56,"scatter":2500,"parseHexKey":788,"reapplyForestTie":51},"stats":{"classifyTerrain":{"laka":2511,"wzgorza":538,"morze":732,"rownina":1726,"gory":556,"pustynia":156},"classifyTerrainFlat":{"laka":3599,"rownina":2379,"pustynia":241},"powSquareDiffs":{"total":200000,"diff":0},"forestTie":{"cases":51,"maxSeaOne":48,"mutantDiffers":29,"assignedTotal":3059,"casesWithForest":39,"differsAmongMaxOne":29,"differsWhenMaxGt1":0}}}
EXIT=0
bbaeee3a97ba82e83e40401208a6e16f41cbc61b23959c68f7d122312cca44cc  /home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/.m04-helpers/vectors-check.json
bbaeee3a97ba82e83e40401208a6e16f41cbc61b23959c68f7d122312cca44cc  /home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/rust-port/engine/tests/p6_m04_vectors/web-vectors.json
cmp: pliki IDENTYCZNE bajt w bajt
```

### 11.6 weryfikator niezalezny (verify-m04-r2.log)

```text
forestTie: przypadkow=51 max==1: 48 mutacja zmienia wynik w: 29 (przy max>1: 0); pozycji bez wpisu w polu odleglosci: 1440
parseHexKey: kluczy=788 (NaN: 1293, Infinity: 18)
wartosci tabeli sprawdzone wzgledem TS: 51/51
checks=169542 rozbieznosci=0
EXIT=0
```

### 11.7 weryfikator - test negatywny (verify-m04-negative-r2.log)

```text
zmodyfikowano 9 wartosci -> /home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/.m04-helpers/vectors-tampered.json
EXIT(tamper)=0
ROZBIEZNOSC: latBuffer r=6 h=4 e=0
ROZBIEZNOSC: hashInt3 180,214,2807205797
ROZBIEZNOSC: classify ['0.3343140913173557', '0.47349013248458505', '0.1294140717945993', '0.6045843951869756', '0.5499999990000001', {'desert': '0.4', 'highland': '0.7', 'mountain': '0.8'}, 'plains_south', None, 1]: laka != rownina
ROZBIEZNOSC: forest #3: heks #5 [5, 0, 1, 0, 0, 0, 1] != [5, 0, 1, 1, 0, 0, 1]
ROZBIEZNOSC: forestTie#0 tie-fp kontynenty/low/24x3: mutant python=True web=0
ROZBIEZNOSC: forestTie #5: heks #7 [7, 0, 5, 0, 0, 0, 0] != [7, 0, 5, 1, 0, 0, 0]
forestTie: przypadkow=51 max==1: 48 mutacja zmienia wynik w: 29 (przy max>1: 0); pozycji bez wpisu w polu odleglosci: 1440
ROZBIEZNOSC: parseHexKey q '0x10,0b11': python=16.0 web=17
parseHexKey: kluczy=788 (NaN: 1293, Infinity: 18)
ROZBIEZNOSC: marginZone #4 adjusted 19 != 20
ROZBIEZNOSC: landMaskBorderFade ['49', '4', '74', '6']
wartosci tabeli sprawdzone wzgledem TS: 51/51
checks=168826 rozbieznosci=9
EXIT=1
```

### 11.8 porownanie wektorow r1 vs r2 (cmp-vectors-r1-r2.log)

```text
c4a09a0367c9eb20cd28ba1c4202aa876b482dd9a48870025098724d6d24e97d  /home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/.m04-helpers/vectors-r1-from-git.json
kategorie identyczne: 19 ['consts', 'latBuffer', 'hashInt3', 'cellBias', 'jitter', 'elevGates', 'classify', 'classifyFlat', 'reapplyLand', 'reapplyForest', 'forestEligible', 'erosionSort', 'marginZone', 'setHex', 'marginCap', 'fades', 'inBorderBuf', 'borderGrid', 'scatter']
kategorie rozne: []
nowe kategorie w r2: ['parseHexKey', 'reapplyForestTie']
sha256 identyczne
gen_helpers_lines identyczne
private_exports identyczne
enums identyczne
EXIT=0
```

### 11.9 dowod: std odrzuca wykladnik bez cyfr (std-parse-exponent-proof.txt)

```text
$ rustc --edition=2021 stdparse.rs && ./stdparse   (rustc 1.97.0 (2d8144b78 2026-07-07))
fn main() {
    for s in ["1e", "1e+", "1e-", "1.e", ".e1", "1E", "5e+", "0e", ".5e", "5.e+"] {
        println!("{:?} -> {:?}", s, s.parse::<f64>());
    }
}
--- wynik:
"1e" -> Err(ParseFloatError { kind: Invalid })
"1e+" -> Err(ParseFloatError { kind: Invalid })
"1e-" -> Err(ParseFloatError { kind: Invalid })
"1.e" -> Err(ParseFloatError { kind: Invalid })
".e1" -> Err(ParseFloatError { kind: Invalid })
"1E" -> Err(ParseFloatError { kind: Invalid })
"5e+" -> Err(ParseFloatError { kind: Invalid })
"0e" -> Err(ParseFloatError { kind: Invalid })
".5e" -> Err(ParseFloatError { kind: Invalid })
"5.e+" -> Err(ParseFloatError { kind: Invalid })
EXIT=0
```

### 11.10 mutacje (mutations-r2-a.log)

```text
SHA256 poczatkowe: src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
   forest-inland-gt-to-ge: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-inland-gt-to-ge: 1 testow FAILED: reapply_forest_overlay_targeted_inland_cases_match_web
   parse-key-old-simplified: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-key-old-simplified: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-key-missing-second-zero: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-key-missing-second-zero: 2 testow FAILED: parse_hex_key_edge_keys_match_web, parse_hex_key_matches_js_number_for_hexkey_strings
   parse-ws-rust-set: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-ws-rust-set: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-ws-no-feff: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-ws-no-feff: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-ws-no-en-quad-range: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-ws-no-en-quad-range: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-hex-prefix-removed: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-hex-prefix-removed: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-binary-prefix-removed: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-binary-prefix-removed: 1 testow FAILED: parse_hex_key_edge_keys_match_web
SHA256 koncowe:    src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
ROWNOWAZNE (wylaczone z listy, patrz §6a): ['fade-cap-le-to-lt', 'land-restore-keeps-overlay']
POWTORZENIA Z POWODU INFRA: []
PODSUMOWANIE: wykryte 8/8, przezyly: [], pliki przywrocone bajt w bajt (SHA-256 poczatek == koniec): True
EXIT=0
```

### 11.10 mutacje (mutations-r2-b.log)

```text
SHA256 poczatkowe: src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
   scatter-mask: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   scatter-mask: 1 testow FAILED: margin_scatter_score_matches_web
   parse-radix-empty-digits-ok: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-radix-empty-digits-ok: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-radix-rounding-no-sticky: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-radix-rounding-no-sticky: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-radix-rounding-truncate: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-radix-rounding-truncate: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-infinity-case-insensitive: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-infinity-case-insensitive: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   parse-exponent-without-digits-ok: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
PRZEZYLA  parse-exponent-without-digits-ok: wszystkie testy zielone
   parse-sign-dropped: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-sign-dropped: 2 testow FAILED: parse_hex_key_edge_keys_match_web, parse_hex_key_matches_js_number_for_hexkey_strings
SHA256 koncowe:    src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
ROWNOWAZNE (wylaczone z listy, patrz §6a): ['fade-cap-le-to-lt', 'land-restore-keeps-overlay']
POWTORZENIA Z POWODU INFRA: []
PODSUMOWANIE: wykryte 6/7, przezyly: ['parse-exponent-without-digits-ok'], pliki przywrocone bajt w bajt (SHA-256 poczatek == koniec): True
EXIT=1
```

### 11.10 mutacje (mutations-r2-c.log)

```text
SHA256 poczatkowe: src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
   hash-shift13: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   hash-shift13: 3 testow FAILED: hash_int3_matches_web, reapply_land_terrain_matches_web, terrain_cell_bias_matches_web
   hash-shift16: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   hash-shift16: 3 testow FAILED: hash_int3_matches_web, reapply_land_terrain_matches_web, terrain_cell_bias_matches_web
   hash-const-a: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   hash-const-a: 3 testow FAILED: hash_int3_matches_web, reapply_land_terrain_matches_web, terrain_cell_bias_matches_web
   hash-imul-const: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   hash-imul-const: 3 testow FAILED: hash_int3_matches_web, reapply_land_terrain_matches_web, terrain_cell_bias_matches_web
   cell-bias-offset: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   cell-bias-offset: 2 testow FAILED: reapply_land_terrain_matches_web, terrain_cell_bias_matches_web
   cell-bias-floor-to-trunc: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   cell-bias-floor-to-trunc: 1 testow FAILED: terrain_cell_bias_matches_web
   jitter-center: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   jitter-center: 4 testow FAILED: classify_terrain_flat_matches_web, classify_terrain_matches_web, reapply_land_terrain_matches_web, rown_laka_jitter_matches_web
   jitter-uses-global-only: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   jitter-uses-global-only: 4 testow FAILED: classify_terrain_flat_matches_web, classify_terrain_matches_web, reapply_land_terrain_matches_web, rown_laka_jitter_matches_web
   gates-low-le-to-lt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   gates-low-le-to-lt: 2 testow FAILED: classify_terrain_matches_web, relief_elev_gates_match_web
   gates-high-ge-to-gt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   gates-high-ge-to-gt: 3 testow FAILED: classify_terrain_matches_web, reapply_land_terrain_matches_web, relief_elev_gates_match_web
   classify-sea-lt-to-le: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-sea-lt-to-le: 1 testow FAILED: classify_terrain_matches_web
   classify-landmask-lt-to-le: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-landmask-lt-to-le: 1 testow FAILED: classify_terrain_matches_web
   classify-highland-gt-to-ge: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-highland-gt-to-ge: 1 testow FAILED: classify_terrain_matches_web
   classify-mountain-elev-gt-to-ge: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-mountain-elev-gt-to-ge: 1 testow FAILED: classify_terrain_matches_web
   classify-highland-elev-gt-to-ge: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-highland-elev-gt-to-ge: 1 testow FAILED: classify_terrain_matches_web
   classify-desert-lo-gt-to-ge: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-desert-lo-gt-to-ge: 1 testow FAILED: classify_terrain_matches_web
   classify-no-climate-gate: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-no-climate-gate: 2 testow FAILED: classify_terrain_matches_web, reapply_land_terrain_matches_web
   classify-plains-gt-to-ge: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   classify-plains-gt-to-ge: 1 testow FAILED: classify_terrain_matches_web
   flat-low-elev-to-sea: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   flat-low-elev-to-sea: 1 testow FAILED: classify_terrain_flat_matches_web
   flat-desert-threshold-ignored: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   flat-desert-threshold-ignored: 1 testow FAILED: classify_terrain_flat_matches_web
   forest-cap-ceil-to-floor: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-cap-ceil-to-floor: 2 testow FAILED: reapply_forest_overlay_matches_web, reapply_forest_overlay_targeted_inland_cases_match_web
   forest-no-zone-mul: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-no-zone-mul: 2 testow FAILED: reapply_forest_overlay_matches_web, reapply_forest_overlay_targeted_inland_cases_match_web
   forest-sort-ascending: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-sort-ascending: 2 testow FAILED: reapply_forest_overlay_matches_web, reapply_forest_overlay_targeted_inland_cases_match_web
   forest-keep-old-forest: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-keep-old-forest: 1 testow FAILED: reapply_forest_overlay_matches_web
   forest-pangea-min: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-pangea-min: 1 testow FAILED: reapply_forest_overlay_matches_web
   forest-mid-index: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-mid-index: 1 testow FAILED: reapply_forest_overlay_matches_web
   forest-height-zero-truthy: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-height-zero-truthy: 1 testow FAILED: reapply_forest_overlay_matches_web
   forest-min-land-lt-to-le: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-min-land-lt-to-le: 1 testow FAILED: reapply_forest_overlay_matches_web
   forest-ignores-desert-band: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   forest-ignores-desert-band: 1 testow FAILED: reapply_forest_overlay_matches_web
   land-sea-to-grass-removed: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   land-sea-to-grass-removed: 1 testow FAILED: reapply_land_terrain_matches_web
   land-budget-floor-to-ceil: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   land-budget-floor-to-ceil: 1 testow FAILED: reapply_land_terrain_matches_web
   land-sort-ascending: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   land-sort-ascending: 1 testow FAILED: reapply_land_terrain_matches_web
   land-count-not-counted: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   land-count-not-counted: 1 testow FAILED: reapply_land_terrain_matches_web
   land-height-zero-truthy: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   land-height-zero-truthy: 1 testow FAILED: reapply_land_terrain_matches_web
   land-flat-restore-skipped: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   land-flat-restore-skipped: 1 testow FAILED: reapply_land_terrain_matches_web
INFRA     fractions-highland-tier: error: failed to build archive at `/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/libciv_engine-04c4f13184038694.rlib`: No space left on device (os error 28) | error: could not compile `c -> powtorzenie
   fractions-highland-tier: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
BLAD-KOMPILACJI fractions-highland-tier: error: failed to write to `/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/rmetaBYuPUh/full.rmeta`: No space left on device (os error 28) | error: could not compile `civ-engine` (lib) due to 1 previous error
   cap-le-to-lt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   cap-le-to-lt: 2 testow FAILED: apply_marginal_land_zone_caps_matches_web, margin_cap_matches_web
   cap-d-minus-1: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   cap-d-minus-1: 3 testow FAILED: apply_marginal_land_zone_caps_matches_web, fades_and_distances_match_web, margin_cap_matches_web
INFRA     radial-sign: error: could not compile `civ-engine` (lib) |   process didn't exit successfully: `/root/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/rustc --crate-name civ_engine --edition=2021 src/lib.rs  -> powtorzenie
   radial-sign: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
BLAD-KOMPILACJI radial-sign: error: failed to write to `/home/user/cargo-target-shared/wf_5dbe3591-4a2-3/debug/deps/rmetaWBrZs2/full.rmeta`: No space left on device (os error 28) | error: could not compile `civ-engine` (lib) due to 1 previous error
SHA256 koncowe:    src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
ROWNOWAZNE (wylaczone z listy, patrz §6a): ['fade-cap-le-to-lt', 'land-restore-keeps-overlay', 'parse-exponent-without-digits-ok']
POWTORZENIA Z POWODU INFRA: ['fractions-highland-tier', 'radial-sign']
PODSUMOWANIE: wykryte 37/39, przezyly: ['fractions-highland-tier (blad kompilacji)', 'radial-sign (blad kompilacji)'], pliki przywrocone bajt w bajt (SHA-256 poczatek == koniec): True
EXIT=1
```

### 11.10 mutacje (mutations-r2-d.log)

```text
SHA256 poczatkowe: src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
   radial-min-removed: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   radial-min-removed: 1 testow FAILED: fades_and_distances_match_web
   edge-fade-margin-clamp: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   edge-fade-margin-clamp: 1 testow FAILED: fades_and_distances_match_web
   border-dist-height: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   border-dist-height: 5 testow FAILED: apply_marginal_land_zone_caps_matches_web, border_grid_tools_match_web, erosion_hook_matches_web, fades_and_distances_match_web
   in-border-lt-to-le: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   in-border-lt-to-le: 3 testow FAILED: border_grid_tools_match_web, fades_and_distances_match_web, is_in_map_border_with_buffer_matches_web
   find-land-skips-shallow: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   find-land-skips-shallow: 1 testow FAILED: border_grid_tools_match_web
   enforce-skips-shallow: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   enforce-skips-shallow: 1 testow FAILED: border_grid_tools_match_web
   count-border-le: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   count-border-le: 1 testow FAILED: border_grid_tools_match_web
   margin-tie-direction: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   margin-tie-direction: 1 testow FAILED: apply_marginal_land_zone_caps_matches_web
   margin-neighbors-ge-to-gt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   margin-neighbors-ge-to-gt: 1 testow FAILED: apply_marginal_land_zone_caps_matches_web
   margin-target-floor: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   margin-target-floor: 1 testow FAILED: apply_marginal_land_zone_caps_matches_web
   margin-erosion-le-to-lt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   margin-erosion-le-to-lt: 1 testow FAILED: apply_marginal_land_zone_caps_matches_web
   margin-fill-ge-to-gt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   margin-fill-ge-to-gt: 1 testow FAILED: apply_marginal_land_zone_caps_matches_web
   lat-buffer-ge-to-gt: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   lat-buffer-ge-to-gt: 1 testow FAILED: lat_buffer_matches_web
   morze-keeps-river: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   morze-keeps-river: 3 testow FAILED: apply_marginal_land_zone_caps_matches_web, border_grid_tools_match_web, set_hex_to_morze_and_laka_match_web
   morze-keeps-edges: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   morze-keeps-edges: 3 testow FAILED: apply_marginal_land_zone_caps_matches_web, border_grid_tools_match_web, set_hex_to_morze_and_laka_match_web
   morze-keeps-deposit: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   morze-keeps-deposit: 3 testow FAILED: apply_marginal_land_zone_caps_matches_web, border_grid_tools_match_web, set_hex_to_morze_and_laka_match_web
   laka-keeps-deposit: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   laka-keeps-deposit: 1 testow FAILED: set_hex_to_morze_and_laka_match_web
   laka-clears-river: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   laka-clears-river: 1 testow FAILED: set_hex_to_morze_and_laka_match_web
   parse-exponent-uppercase-rejected: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   parse-exponent-uppercase-rejected: 1 testow FAILED: parse_hex_key_edge_keys_match_web
   js-round-half: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   js-round-half: 2 testow FAILED: apply_marginal_land_zone_caps_matches_web, reapply_forest_overlay_matches_web
   js-max-nan: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   js-max-nan: 1 testow FAILED: fades_and_distances_match_web
   js-min-nan: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   js-min-nan: 1 testow FAILED: fades_and_distances_match_web
   table-prog-pustyni: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-prog-pustyni: 3 testow FAILED: classify_terrain_flat_matches_web, classify_terrain_matches_web, reapply_land_terrain_matches_web
   table-rownina-prog: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-rownina-prog: 3 testow FAILED: classify_terrain_flat_matches_web, classify_terrain_matches_web, reapply_land_terrain_matches_web
   table-amp-komorkowa: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-amp-komorkowa: 5 testow FAILED: classify_terrain_flat_matches_web, classify_terrain_matches_web, consts_match_web, reapply_land_terrain_matches_web
   table-amp-globalna: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-amp-globalna: 5 testow FAILED: classify_terrain_flat_matches_web, classify_terrain_matches_web, consts_match_web, reapply_land_terrain_matches_web
   table-rozmiar-komorki: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-rozmiar-komorki: 3 testow FAILED: consts_match_web, reapply_land_terrain_matches_web, terrain_cell_bias_matches_web
   table-budzet-medium: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-budzet-medium: 2 testow FAILED: consts_match_web, reapply_land_terrain_matches_web
   table-mnoznik-umiarkowana: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-mnoznik-umiarkowana: 2 testow FAILED: reapply_forest_overlay_matches_web, reapply_forest_overlay_targeted_inland_cases_match_web
   table-bonus-wnetrza: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-bonus-wnetrza: 2 testow FAILED: reapply_forest_overlay_matches_web, reapply_forest_overlay_targeted_inland_cases_match_web
Traceback (most recent call last):
  File "/home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/run-mutations.py", line 268, in <module>
    restore_and_check(mid)
  File "/home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/run-mutations.py", line 234, in restore_and_check
    with open(p, "w", encoding="utf-8", newline="") as fh:
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: 'src/domain/mapgen/terrain_class.rs'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/user/The-Game/.claude/worktrees/wf_5dbe3591-4a2-3/dyspozycje/autobot/runs/R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1/run-mutations.py", line 281, in <module>
    with open(p, "w", encoding="utf-8", newline="") as fh:
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: 'src/domain/mapgen/terrain_class.rs'
EXIT=1
```

### 11.10 mutacje (mutations-r2-e.log)

```text
SHA256 poczatkowe: src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
   fractions-highland-tier: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   fractions-highland-tier: 1 testow FAILED: consts_match_web
   radial-sign: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   radial-sign: 1 testow FAILED: fades_and_distances_match_web
   table-twardy-ocean: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-twardy-ocean: 6 testow FAILED: apply_marginal_land_zone_caps_matches_web, border_consts_match_web, border_grid_tools_match_web, consts_match_web
   table-waga-rozproszenia: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-waga-rozproszenia: 2 testow FAILED: apply_marginal_land_zone_caps_matches_web, margin_scatter_score_matches_web
   table-fade-limit: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-fade-limit: 1 testow FAILED: fades_and_distances_match_web
   table-min-bias: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-min-bias: 1 testow FAILED: fades_and_distances_match_web
   table-niski-mountain: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-niski-mountain: 1 testow FAILED: relief_elev_gates_match_web
   table-max-sasiadow: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-max-sasiadow: 1 testow FAILED: apply_marginal_land_zone_caps_matches_web
   table-min-sufitu: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-min-sufitu: 2 testow FAILED: reapply_forest_overlay_matches_web, reapply_forest_overlay_targeted_inland_cases_match_web
   table-udzial-gor-high: PRZYWROCONO src/domain/mapgen/terrain_class.rs:sha256=516614bcf230dfcd..=OK data/derived/mapgen-terrain-class.json:sha256=f0cfb0626b889c0c..=OK
WYKRYTA   table-udzial-gor-high: 1 testow FAILED: consts_match_web
SHA256 koncowe:    src/domain/mapgen/terrain_class.rs=516614bcf230dfcd69493c7bd2f5fbec05d6ca7f36ea259945d6c8f030325315 data/derived/mapgen-terrain-class.json=f0cfb0626b889c0c5b5e3a6a7ef4db9412dc12a399b322c30520903e07c0f834
ROWNOWAZNE (wylaczone z listy, patrz §6a): ['fade-cap-le-to-lt', 'land-restore-keeps-overlay', 'parse-exponent-without-digits-ok']
POWTORZENIA Z POWODU INFRA: []
PODSUMOWANIE: wykryte 10/10, przezyly: [], pliki przywrocone bajt w bajt (SHA-256 poczatek == koniec): True
EXIT=0
```
