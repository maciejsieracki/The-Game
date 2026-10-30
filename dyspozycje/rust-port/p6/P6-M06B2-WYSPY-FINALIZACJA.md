# P6.M06B2 - wyspy i finalizacja masy lądu (port `gen-helpers.ts`:4946-5100 do Rust)

Temat: `R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1` · DOMAIN: GAME · RUNDA 2/5 (Operator-obrona po zarzutach FAIL r1; §12).
Zakres (6 symboli): `removeTinyLandIslands` :4946, `minTinyIslandHexesForTyp` :4992, `countOpenOceanLandSpecks` :5006,
`purgeOpenOceanLandSpecks` :5027, `finalizeLandMassAfterCoast` :5050, `enforceTargetDryLandFraction` :5079.
Pin web: `edb8fb56` (zweryfikowany: `git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts` nie ma hunkow w
liniach 4946-5100). Baza: `origin/rust-port/parity-v2` = `1aba22f7` (M06B1 ZINTEGROWANE).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/`.

## 0. Status

- 6/6 symboli PORTOWANE (kod + testy + wektory z uruchomionego weba + weryfikator Python 6/6 (r2) + mutacje).
- Commity (od `1aba22f7`): `1294cf84` (removeTiny + minTyp + dane JSON + wektory), `d9c41c8c` (count/purge specks),
  `c3e861d9` (finalizeLandMassAfterCoast), `eaf57a2e` (enforceTargetDryLandFraction),
  `3dd3c8ea` (sondy granic enforce, runner mutacji, weryfikator Python, logi), `f6822347` (dossier r1),
  `5a9742c9` (§12 r1), **r2:** `464670f1` (duze mapy enforce 40x40/60x60 -> zabija M11),
  `0605e914` (weryfikator Python 6/6, fmt testu, `mut-results-m06b2-r2.json`, dowod-probe M12).
- Bramki (surowe logi w runie, `EXIT=`):
  - fmt: `gate-fmt-r1.log` EXIT=0.
  - clippy `--all-targets -- -D warnings`: `gate-clippy-r1.log` EXIT=0.
  - `cargo test --offline --no-fail-fast`: `gate-test-r1.log` EXIT=0, **1482 passed, 0 failed** (= 1465 z bazy + 17 nowych testow M06B2).
  - weryfikator Python `verify-m06b2-python.py`: `verifier-python-r1.txt` EXIT=0, **0 rozbieznosci**
    (4 minTyp, 544 removeTiny, 20 count, 20 purge).
- Mutacje: 13 (M01-M13). Po r2: **10 zabitych** (r1: 9; M11 dodana przez `enforce_large_maps_match_web`, §12),
  3 przezyte, wszystkie RÓWNOWAZNE DOWODEM: M06, M07 (§5.2, §12), M12 (§12, dowod file:line). Wyniki r1:
  `mut-results-m06b2.json`; wyniki r2 (M11, M12): `mut-results-m06b2-r2.json`; `_przywrocenie.zgodne = true` w obu.
- Bramka pełna `cargo test --offline` NIE powtorzona w r2 (dysk 98%, ok. 0.8 GB wolne; 205 binarek testowych nie
  miesci sie). W r2 przeszly: cztery binarki M06B2 (tiny 4, specks 3, finalize 4, enforce 7 = 18/18) oraz `cargo fmt --check`
  (crate, EXIT=0). Pelna bramka to residuum §10 pkt 5.

## 1. Symbole zakresu - status

| Symbol web (gen-helpers.ts) | Rust (`mapgen/landsea.rs`) | Status | Wektor / test |
|---|---|---|---|
| `removeTinyLandIslands` :4946 | `remove_tiny_land_islands` | PORTOWANY | `web-tiny.json` / `p6_m06b2_tiny` |
| `minTinyIslandHexesForTyp` :4992 | `min_tiny_island_hexes_for_typ` | PORTOWANY (dane JSON) | `web-tiny.json` `minTyp` / `p6_m06b2_tiny` |
| `countOpenOceanLandSpecks` :5006 | `count_open_ocean_land_specks` | PORTOWANY | `web-specks.json` / `p6_m06b2_specks` |
| `purgeOpenOceanLandSpecks` :5027 | `purge_open_ocean_land_specks` | PORTOWANY | `web-specks.json` / `p6_m06b2_specks` |
| `finalizeLandMassAfterCoast` :5050 | `finalize_land_mass_after_coast` (+ `_default`) | PORTOWANY | `web-finalize.json` / `p6_m06b2_finalize` |
| `enforceTargetDryLandFraction` :5079 | `enforce_target_dry_land_fraction` (+ `_default`) | PORTOWANY | `web-enforce.json`, `web-enforce-probe.json` / `p6_m06b2_enforce` |
| progi i klampy (liczby) | `data/derived/mapgen-landmass.json` (`mapgen_landmass()`) | DANE (JSON) | testy wektorowe |

Kod: `rust-port/engine/src/domain/mapgen/landsea.rs` (sekcja P6.M06B2 na koncu pliku), parser:
`rust-port/engine/src/data/derived.rs` (dopisek na koncu), dane: `rust-port/engine/data/derived/mapgen-landmass.json`.

## 2. Odstepstwa sygnatur od weba (logika 1:1)

- `minTinyIslandHexesForTyp(typ)` -> `min_tiny_island_hexes_for_typ(WorldType)`; `typ` web `pangea|kontynenty|wyspy|ziemia`
  = `WorldType::{Pangea, Continents, Islands, Earth}` (exhaustive match, brak wartosci domyslnej web `default: 8`
  - nieosiagalna dla typu zamknietego).
- `removeTinyLandIslands(hexes, minHexes)` -> `remove_tiny_land_islands(&mut HexRecord, usize) -> usize`.
  Skladowe: `isLandOrCoast` = nie Morze/Plytkie (`is_water_terrain_local`). Reset: `set_hex_to_morze` (ta sama
  semantyka co web: Morze, Brak, rzeka wylaczona, zloze usuniete).
- `finalizeLandMassAfterCoast(hexes, typ, w, h, coastOpts?, coastPasses = 2)` ->
  `finalize_land_mass_after_coast(&mut HexRecord, WorldType, i64, i64, Option<usize>, usize)`; `coastOpts.maxInlandPoolSize`
  = `Option<usize>` (jak w M06B1).
- `enforceTargetDryLandFraction(hexes, landScores, target, w, h, coastOpts?, tolerancePctPoints = 3, fillBias = 'center',
  minMaskFillScore = PANGEA_LAND_FILL_MIN_SCORE)` -> `enforce_target_dry_land_fraction(&mut HexRecord,
  &HashMap<String,f64>, f64, i64, i64, Option<usize>, f64, LandFractionFillBias, f64)` (9 argumentow, jak web;
  `#[allow(clippy::too_many_arguments)]` z komentarzem). `landScores: Map<string,number>` = `HashMap<String,f64>`.
  Wariant `_default` (tol 3, Center, min score z JSON).
- `Math.round` -> `js_round`, `Math.max/min` -> `js_max/js_min` (`masks::v8math`), zgodnie z M06A/M06B1.

## 3. Dane vs kod (`mapgen-landmass.json`, zrodla web)

| Klucz JSON | Wartosc | Linia web |
|---|---|---|
| `male_wyspy.pangea` | 10 | :4994 |
| `male_wyspy.kontynenty` | 8 | :4995 |
| `male_wyspy.wyspy` | 4 | :4996 |
| `male_wyspy.ziemia` | 6 | :4997 |
| `sprzatanie.przebiegi_maks` | 3 (limit petli `pass < 3`) | :5060 |
| `sprzatanie.wybrzeze_przebiegi_domyslne` | 2 (`coastPasses = 2`) | :5056 |
| `susza.tolerancja_pp` | 3 | :5072 |
| `susza.klamp_min` / `klamp_max` | 0.15 / 0.85 | :5090 |

Kod nie zawiera tych literalow (poza strukturalnymi `0`, `1`, `100` w przeliczeniu punktow procentowych).
Zmiana wartosci w JSON lamie wektory (zamierzona detekcja driftu).

## 4. Wektory (`rust-port/engine/tests/p6_m06b2_vectors/`)

Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/gen-m06b2-vectors.mjs` - URUCHAMIA prawdziwy
TS weba (`git archive edb8fb56 gra/src gra/data`, loader `m06b2-loader-register.mjs`). Zadnej logiki nie przepisano.
Deterministyczny (ponowne uruchomienie daje identyczne pliki; potwierdzone `cmp`).

| Plik | Rozmiar | Przypadki | Zawartosc |
|---|---|---|---|
| `web-tiny.json` | 1 397 673 B | 544 tiny + 4 minTyp | 32 mapy (24 wyspowe + 8 losowe); progi 1..13 na kazdej mapie + 4 typy |
| `web-specks.json` | 248 265 B | 20 specks + 20 purge | 20 map (wyspy z szumem i losowe) |
| `web-finalize.json` | 2 238 790 B | 384 | 12 map (18x18) x 4 typy x `coastPasses` 1/2/3/domyslne x pool brak/8 |
| `web-enforce.json` | 4 530 484 B | 720 | 12 map x cele 0.14/0.15/0.16/0.5/0.85/0.86 + 6 celow przy granicy tolerancji (udzial wejscia +/-2.5..5 pp) x tol 2/3/4 x fillBias center/mask |
| `web-enforce-probe.json` | 3 348 874 B | 596 | sondy granic (§6.2) na 12 mapach + 6 mapach o duzej pojemnosci lądu |

Wszystkie pliki < 6 MB (wymog M06B1 (e)). Mapy: wiersze `[klucz, terenBazowy, nakladka, zloze, rzekaObecna, krawedzie]`;
wyjscie = `ret` + `diff` (zmienione heksy); stan oczekiwany = wejscie z podmienionym `diff`.
Pokrycie (wymog M06B1 (a)): test `tiny_vectors_cover_overlays_rivers_and_deposits_on_water_and_land` - nakladka `las`,
rzeka i zloze wystepuja na heksach WODNYCH i LADOWYCH; generator losuje nakladki `las` takze na wodzie.

## 5. Ograniczenia petli i progi (N-1 / N / N+1)

### 5.1 Progi wielkosci wyspy (`removeTiny`, minHexes 4/6/8/10)

Sweep progow 1..13 na 32 mapach. Liczba map, na ktorych zmiana progu o 1 zmienia wynik:
N-1 vs N: 77 (suma po progach 4,6,8,10), N vs N+1: 89. Test `tiny_threshold_neighbours_are_discriminated` (kazdy prog ma
mape rozrozniajaca N-1/N i N/N+1).

### 5.2 Cap petli `finalizeLandMassAfterCoast` (`pass < 3`, web :5060) - NIEOBSERWOWALNY (dowod)

Pomiar: skopiowano wlasciwy TS weba z capem 1, 2 i 4 (zamiast 3) i uruchomiono ten sam generator na 384 przypadkach
finalize. Wynik: wektory **identyczne bajt-w-bajt** z capem 3 dla K=1, K=2 i K=4 (`cmp`).
Dowod: `removeTinyLandIslands` z progiem >= 4 usuwa kazda skladowa lądu o rozmiarze < 4, w tym wszystkie izolowane
heksy. Po nim `purgeOpenOceanLandSpecks` (czyta to samo sasiedztwo, ten sam `isWaterTerrainLocal`) nie znajduje
izolowanego lądu, wiec zwraca 0. Przebieg 1 nie zmienia stanu, a przerwanie `purged == 0 && pass > 0` konczy petle.
Stad cap >= 2 daje ten sam wynik co cap 1. Test `land_mass_loop_second_pass_is_noop_on_vectors` sprawdza przesłankę
(druga iteracja `removeTiny` + `purge` = 0 na kazdej mapie wektorowej). Mutanty M06 (usuniecie przerwania) i M07
(pominiecie `total += purged`) sa przez to ROWNOWAZNE: purge w petli zawsze zwraca 0.

Wymog dispatchu (b) "mapy rozrozniajace cap" NIE moze byc spelniony: nie istnieja mapy, na ktorych cap 1/2/3/4
daje rozny wynik. Wpisane jako zamkniete dowodem nieobserwowalnosci (w przeciwienstwie do capu 12 z M06B1, ktory
byl obserwowalny i dostal mapy rozrozniajace).

### 5.3 `coastPasses` (przebiegi `finalizeCoastAndInlandWater`, przekazywane przez finalize)

`coastPasses` 1/2/3 rozrozniane przez mapy wektorowe (test `coast_passes_neighbours_are_discriminated`, oba
sasiedztwa N-1/N i N/N+1 maja mape rozrozniajaca).

## 6. Enforce: tolerancja, klamp i granice

### 6.1 Wektory bazowe (`web-enforce.json`)

Tolerancja 2 vs 3 pp: 2 pary (mapa, cel) rozne; 3 vs 4 pp: 12 par rozne (stat generatora `enf_tol2_vs_3_rozne`,
`enf_tol3_vs_4_rozne`). Klamp dolny: cel 0.14 == 0.15 (klamp, oczekiwane); 0.15 vs 0.16 rozne na 12/12 mapach
(center i mask).

### 6.2 Sondy granic (`web-enforce-probe.json`, 596 przypadkow)

- `rownosc-granicy` (181): cel m/total daje targetLand = m; wybrane takie, ze po pierwszym etapie
  `|land - targetLand| === tolHexes` (granica rownosci). Kasuje M09 (`>` -> `>=`).
- `klamp-gorny` (324): cele 0.9/0.95/0.99 (klamp gorny). **KOREKTA r2:** te sondy NIE kasuja zmiany klampu
  0.85->0.86 (mutant M11 przezywa wszystkie 6 testow sond). Sprostowanie: wczesniejsze zdanie "kasuja zmiane klampu"
  bylo nieprawdziwe. Zmiane klampu kasuje `enforce_large_maps_match_web` (§12).
- `klamp-decyzja` (91): cel 0.86, tolerancja T heksow (T = 2..0.4*total, tol = T*100/total), dla ktorych
  decyzja galezi rozni sie miedzy klampem 0.85 i 0.86 (`|land1 - tl(0.85)| > T` vs `|land1 - tl(0.86)| > T`).
  Mapy o duzej pojemnosci lądu (0.85-0.95) dodane, bo na losowych mapach etap 1 (po finalizacji wybrzeza) daje
  tylko ok. 135-195 heksow lądu przy celu 275, wiec okno decyzji lezy dla T ~ 80-140 heksow. Wybor przypadkow: replika etapu 1 w generatorze (tylko do selekcji);
  wyjscie kazdego przypadku z prawdziwego `enforceTargetDryLandFraction` weba.

## 7. Mutacje (runner `mut-runner-m06b2.py`, `mut-results-m06b2.json`)

Kazda mutacja = dokladnie jedno wystapienie tekstu w `landsea.rs`; `cargo test --offline` na binarkach M06B2;
przywrocenie pliku z kontrola sha256 (przed = po: zgodne).

| ID | Symbol | Mutacja | Wynik | Kto zabija / uzasadnienie |
|---|---|---|---|---|
| M01 | removeTiny | prog `>` zamiast `>=` | ZABITA | `remove_tiny_land_islands_matches_web` |
| M02 | removeTiny | Plytkie Morze jako lad (lacza skladowe) | ZABITA | j.w. |
| M03 | minTyp | typ wyspy -> prog ziemi | ZABITA | `min_tiny_island_hexes_for_typ_matches_web` |
| M04 | countSpecks | prog `<= 1` zamiast `== 0` | ZABITA | `count_open_ocean_land_specks_matches_web` |
| M05 | purgeSpecks | prog `> 1` zamiast `> 0` | ZABITA | `purge_...` + `finalize_...` |
| M06 | finalize | usuniety warunek przerwania petli | PRZEZYTA | RÓWNOWAZNA (§5.2) |
| M07 | finalize | pominiete `total += purged` | PRZEZYTA | RÓWNOWAZNA (§5.2: purge w petli = 0) |
| M08 | finalize | usuniety `enforceMapBorderOcean` po finalizacji | ZABITA | `finalize_land_mass_after_coast_matches_web` |
| M09 | enforce | granica tolerancji `>=` zamiast `>` | ZABITA | `enforce_probe_matches_web` (sondy rownosci granicy) |
| M10 | enforce | usuniety `applyCoastRing` w galezi tolerancji | ZABITA | `enforce_target_dry_land_fraction_matches_web` |
| M11 | enforce | gorny klamp 0.85 -> 0.86 | ZABITA (r2) | `enforce_large_maps_match_web` (duze mapy 40x40/60x60, `web-enforce-large.json`); r1 PRZEZYTA na 18x18 - §12 |
| M12 | enforce | wybrzeze w etapie 1 enforce: 2 przebiegi zamiast 1 | PRZEZYTA | RÓWNOWAZNA DOWODEM (§12.3): drugi przebieg petli `finalizeCoastAndInlandWater` nigdy nie startuje |
| M13 | enforce | tolerancja w heksach +1 | ZABITA | `enforce_target_dry_land_fraction_matches_web` |

### 7.1 Przezyte M11 i M12 - stan po r2

- M11 (klamp 0.85 -> 0.86): ZABITA w r2 przez `enforce_large_maps_match_web` (wynik: `mut-results-m06b2-r2.json`,
  `failed_tests = [enforce_large_maps_match_web]`). Mapy r1 (18x18, pojemnosc lądu ~79%) nie mogą osiągnąć celu 0.85,
  wiec klamp nie ma skutku; mapy 40x40/60x60 o pojemnosci do 97% rozrozniaja (§12.1). Diagnoza r1 "obserwacyjnie
  rownowazna, pojemnosc wyczerpana" byla BLEDNA dla map >= 40x40.
- M12 (2 przebiegi wybrzeza w etapie 1 enforce): PRZEZYTA, ale RÓWNOWAZNA DOWODEM (§12.3). Pomiar TS: 0 roznic
  i 0 realnych odpalen przebiegu 2 na 400 + 162 mapach (`m12-equivalence-probe.mjs`).

## 8. Weryfikator Python (niezalezny od Rust i od kodu weba)

`verify-m06b2-python.py` (r2) - Python od zera, czyta TS `gen-helpers.ts` pinu (progi minTyp wprost z `switch`,
stale `PANGEA_LAND_FILL_MIN_SCORE`, `MAP_BORDER_OCEAN_HEXES`, `MAP_MARGIN_LAND_ZONE_HEXES`, `ERODE_TERRAIN_ORDER` regexem),
implementuje wszystkie 6 symboli wraz z lancuchem helperow (finalizeCoastAndInlandWater, removeSmallInlandWaterPools,
applyDoubleCoastRing, applyCoastRing, sanitizeCoastHexes, oceanConnectedWaterKeys, applyLandFractionByScore,
sortLandKeysForErosion, enforceMapBorderOcean) i porownuje z wektorami weba.
Wynik: `verifier-python-r2.txt`, EXIT=0, **0 rozbieznosci**: minTyp 4, removeTiny 544, countSpecks 20, purgeSpecks 20,
finalizeLandMass 384, enforce 720, enforce-probe 596, enforce-large 160.
Kontrola czulosci: wariant weryfikatora z klampem 0.86 (mutant M11 w Pythonie) daje 5 rozbieznosci (wszystkie na
`enforce-large`), wiec weryfikator nie jest pusty. Sortowanie: komparatory niesymetryczne (tolerancje 0.04 / 0.015)
sortowane `list.sort` (TimSort, stabilny, jak V8); zgodnosc z wektorami potwierdza zgodnosc kolejnosci.

## 9. Zalozenia (luki rozstrzygniete ZALOZENIEM)

1. Klucze heksow kanoniczne `"q,r"` z calkowitych wspolrzednych; `hex.q/hex.r` = `hex.coords` (jak w M06B1).
2. Kolejnosc iteracji = kolejnosc wstawiania `HexRecord` (jak `Object.keys/entries`); sekwencyjne mutacje (purge,
   enforce) czytaja stan na biezaco.
3. `landScores` (Map) w wektorach = wartosci per klucz w kolejnosci wierszy; w Rust `HashMap<String,f64>`.
4. `minMaskFillScore` domyslne = `pangea_min_score_wypelnienia` z `mapgen-landsea-fill.json` (0.11 = PANGEA_LAND_FILL_MIN_SCORE :3438).
5. `enforceTargetDryLandFraction`: klamp 0.15/0.85 i tolerancja 3 pp przeniesione do JSON (`mapgen-landmass.json`).
6. Zloze w wektorach: `zloze_rudy` (tylko prawdziwosc); Rust `has_deposit`.
7. (r2) Tabela `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (wiersze M06B), o ktorej mowi dispatch, NIE istnieje ani
   w `origin/rust-port/parity-v2`, ani w HEAD tej galezi, a plik nie jest na allowliscie. ZALOZENIE: domkniecie
   tabeli M06B jest tym dossier (§1 + §10). Tabeli globalnej nie tworzono ani nie zmieniano.

## 10. Stan zakresu i pozostalosci (`M06B KOMPLET`)

**M06B KOMPLET: NIE (r2) - warunkowo.** Oba tematy M06B (M06B1: 6 symboli w `1aba22f7`; M06B2: 6 symboli tutaj)
sa PORTOWANE i maja wektory z uruchomionego weba, weryfikator Python 6/6 (0 rozbieznosci) oraz mutacje: 10/13 zabitych,
3 przezyte, wszystkie rownowazne dowodem. Status "KOMPLET" zostaje NIE, dopoki nie zamknie sie pkt 5 (pelna bramka).
Pozostalosci (do decyzji FC/Evaluatora):

1. (ZAMKNIETE r2) Weryfikator Python niezalezny obejmuje 6/6 symboli (§8).
2. (ZAMKNIETE r2) M11 zabita przez duze mapy (§7.1, §12.1). M12 przezyta, ale rownowazna dowodem (§12.3). Dowod
   M12 zalezy od 4 faktow TS pinu (file:line w §12.3); pomiar potwierdza, ze przebieg 2 nie startuje.
3. Cap `pass < 3` w `finalizeLandMassAfterCoast` nieobserwowalny (§5.2): wymog "mapy rozrozniajace cap" nie jest
   spelnialny (dowod + pomiar). Mutanty M06/M07 rownowazne dowodem. Zarzut FC "dowod nieobserwowalnosci" uznany
   w r1 (§5.2) - bez zmian w r2.
4. Tabela `P6-25-MAPA-GAP.md` (wiersze M06B) nieobecna w repo (ZALOZENIE §9.7). Nie zamknieta w pliku globalnym.
5. OTWARTE: pelna bramka `cargo test --offline --no-fail-fast` (205 binarek) i `cargo clippy --all-targets -D warnings`
   nie powtorzone w r2 - dysk 98% (0.8 GB wolne). Ostatni PELNY test: `gate-test-r1.log` (f6822347, 1482/0);
   od tamtej pory dodano 1 test (`enforce_large_maps_match_web`) i zmieniono 2 pliki testowe. Wymagany ponowny
   pelny gate na wolnym dysku przed READY_FOR_DEPLOY.
6. `Cargo.lock` i `rust-port/engine/target/` nieśledzone lokalnie (nie commitowane; poza allowlista).

## 11. Ograniczenia zakresu (zachowane)

Zero zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`,
istniejacych testach. Nowe pliki: `tests/p6_m06b2_*.rs`, `tests/p6_m06b2_vectors/**`, `data/derived/mapgen-landmass.json`,
dossier, runda. `git worktree prune` i usuwanie cudzych worktree: nie wykonywano.

## 12. Weryfikacja niezalezna r1 (Operator-pomiary, HEAD f6822347)

- Dowod statyczny (zrodla TS pinu): `purge` wewnatrz `finalizeLandMassAfterCoast` zawsze zwraca 0, bo po `removeTinyLandIslands`
  (minHexes >= 4) nie ma suchego ladu bez suchego sasiada (`isLandOrCoast` = `!isWaterTerrainLocal`). Stad M07 rownowazny dowodowo.
  Przerwanie petli `purged===0 && pass>0` (M06) nieobserwowalne: `removeTiny` jest punktem stalym. Cap `pass<3` nieobserwowalny (§5.2).
- Weryfikator Python ponownie: EXIT=0, rozbieznosci 0 (tiny 544, minTyp 4, specks 20, purge 20).
- fmt EXIT=0, clippy EXIT=0 (ponownie). Test gate NIE powtorzony: dysk zapelniony (blad linkera Bus error / brak miejsca);
  wiarygodny dowod testow = log Operatora `gate-test-r1.log` (EXIT=0, 1482/0).
- Mutacje nie powtorzone (ta sama przyczyna). Residua #1-#4 bez zmian; #3 (M11/M12) nadal otwarte.
- Szczegoly: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/02-verifier-r1-evidence.txt`.

## 12b. Odpowiedzi na zarzuty FAIL (Operator r2, po `5a9742c9`; commity `464670f1`, `0605e914`)

Zarzuty Evaluatora (r1) rozstrzygniete: PRZYJMUJE = poprawka + dowod + commit; ODRZUCAM = dowod.

**Z1 (sondy `klamp-gorny` nie kasuja M11; dispatch (d)) - PRZYJMUJE.** Zarzut sluszny: `enforce_probe_matches_web`
przechodzi pod M11 (klamp 0.86) i pod klampem 1.0. Poprawka: nowe wektory `web-enforce-large.json` (8 map 40x40/60x60,
160 przypadkow: cele 0.85/0.86/0.9 x tol 2/3/4 x center/mask + 0.99 x tol 2/3; generator `gen-m06b2-enforce-large.mjs`,
URUCHAMIA TS pinu), test `enforce_large_maps_match_web` (`p6_m06b2_enforce.rs`). Dowod: runner M11 -> **ZABITA**
(`failed_tests = [enforce_large_maps_match_web]`, `mut-results-m06b2-r2.json`); wariant klamp 1.0 -> **ZABITA** (ten sam test;
`mut-results-m06b2-klamp1.json`, runner `mut-runner-klamp1-variant.py`). Commit `464670f1`. Sprostowanie §6.2 (klamp-gorny) - w tym dossier.

**Z2 (M11 "obserwacyjnie rownowazna, pojemnosc wyczerpana") - PRZYJMUJE, diagnoza byla bledna.** Pomiar TS (sonda
`cap-measure-probe.mjs`, pin `edb8fb56`, po etapie 1 enforce z celem 0.85, blob 95% przed etapem): udzial lądu osiagalny
z pelnym pipeline'em: **18x18 ~0.60, 40x40 ~0.79, 60x60 ~0.84**. (Zarzut podawal ~79% dla 18x18: zmierzone ~60%,
bo ramka `enforceMapBorderOcean` ma szerokosc 2 heksy, `:1177`, `:1388`.) Cele 0.85/0.86 leza wiec nad osiagalnym
udzialem na mapach 40x40/60x60 i klamp NIE zmienia wyniku koncowego, tylko **decyzje galezi tolerancji**
(`Math.abs(land - targetLand) > toleranceHexes`, web `:5103` i `:5108`): 1 pp = 16 heksow (40x40) / 36 heksow (60x60) - to przesuwa decyzje.
Mapy 18x18 nie maja tej wlasnosci (osiagalne ~0.60 < 0.85), stad przezycie r1.

**Z3 (M12 przezyta bez dowodu rownowaznosci; dispatch (d)) - PRZYJMUJE: dowod formalny + pomiar.** Patrz §12.3.
Wynik: M12 jest **rownowazna** na calej dziedzinie (nie tylko na probkach), bo drugi przebieg petli
`finalizeCoastAndInlandWater` nigdy nie startuje. Nie zabijalna (nie ma mapy rozrozniajacej) - zgodnie z dowodem.

**Z4 (weryfikator Python tylko 4/6; dispatch (c)) - PRZYJMUJE.** Zrealizowane: `verify-m06b2-python.py` r2 = 6/6 (§8),
0 rozbieznosci na 384 finalize + 720 enforce + 596 sond + 160 duzych map. Kontrola czulosci: wariant klampu 0.86 w Pythonie
-> 5 rozbieznosci (enforce-large). Commit `0605e914`. (Niezaleznosc: Python czyta TS pinu regexem, nie czyta kodu Rust.)

**Z5 (dossier niespojne: §0 "6/6", §10 "KOMPLET: TAK" przy otwartych M11/M12) - PRZYJMUJE.** §0, §7, §8, §10 przepisane:
M06B KOMPLET = **NIE (warunkowo)**, pozostaje tylko pkt 5 §10 (pelna bramka).

**Z6 (pelna bramka `cargo test` / `clippy` nie powtorzona; dispatch (g)) - PRZYJMUJE jako OTWARTE (nie mozna wykonac w tej sesji).**
Dysk: `/` 98% zapelniony, w trakcie sesji 0.8-3.4 GB wolne; 205 binarek testowych nie miesci sie (poprzedni Operator
mial ten sam blad). Wykonane zamiast: `cargo fmt --check` (crate) EXIT=0; testy 4 binarek M06B2 (`tiny` 4/4,
`specks` 3/3, `finalize` 4/4, `enforce` 7/7 = **18/18**, log `gate-test-m06b2-4bin-r2.log` i `gate-test-enforce-r2.log`,
oba EXIT=0). Pelny gate - residuum §10 pkt 5 (do wykonania na wolnym dysku przed READY_FOR_DEPLOY).

**Z7 (tabela `P6-25-MAPA-GAP.md` nie istnieje; dispatch "zamknij tabele M06B") - ODRZUCAM zamkniecie w tamtym pliku, z dowodem.**
Dowod: `git ls-tree -r --name-only origin/rust-port/parity-v2 | grep MAPA-GAP` oraz `git ls-tree -r --name-only HEAD`
nie zwracaja pliku; plik nie jest na allowliscie dispatchu. Tworzenie go byloby poza zakresem. ZALOZENIE (§9.7):
domkniecie tabeli M06B = §1 + §10 tego dossier.

### 12.3 Dowod rownowaznosci M12 (2 przebiegi wybrzeza w etapie 1 `enforceTargetDryLandFraction` == 1 przebieg)

Mutant: `finalize_coast_and_inland_water(..., 1, ...)` -> `(..., 2, ...)` w etapie 1 (`landsea.rs`, odpowiednik web `gen-helpers.ts:5099`; `runner` podaje `:5094` - bledny numer, do poprawy w runnerze).
Petla `finalizeCoastAndInlandWater` (`:4787-4822`): w przebiegu `pass` wykonuje: `removeInlandWaterPools` (A),
`applyDoubleCoastRing` (B), `sanitizeCoastHexes` (C), `removeInlandWaterPools` (D), potem **break**, gdy
`findInlandWaterHexes == 0 && findDryLandTouchingSea == 0` (`:4813-4815`), inaczej dalej (tylko gdy `changed != 0`).
Wystarczy pokazac, ze PO przebiegu 0 warunek break jest zawsze spelniony; wtedy `maxPasses = 1` i `maxPasses = 2`
daja ten sam stan dla KAZDEGO wejscia.

Niezmienniki po przebiegu 0 (wejscie dowolne):
- **I0.** Po (A) cala woda lezy w `oceanConnectedWaterKeys` (`:4026-4061`): wode nieoceaniczna (`findInlandWaterHexes`,
  `:4109`) zamieniamy na Laka; woda oceaniczna nie traci sciezki do brzegu (sciezki laczace ocean ida tylko przez wode oceaniczna).
- **I1.** Po (B): zadnego Morze nie ma przy suchym lądzie. `applyCoastRing` (`:3894-3915`) zamienia KAZDE Morze przy
  suchym lądzie w Plytkie (rzeka nietknieta); `applyDoubleCoastRing` (`:3923-3946`) tylko zamienia Morze na Plytkie.
  Suchy ląd sam sie nie zmienia.
- **I2.** (C) `sanitizeCoastHexes` (`:3975-4023`) zamienia na Morze tylko Plytkie bez lancucha do suchego lądu. Taki
  Plytkie NIE sasiaduje z suchym lądem (sasiad suchego lądu = ziarno lancucha), wiec nowe Morze nie styka sie z lądem.
- **I3.** (D) Zamiana nieoceanicznej wody na Laka nie tworzy Morze przy lądzie: kazdy sasiad Morze tej wody jest
  woda w tej samej skladowej (sasiedztwo wody), wiec tez nieoceaniczny i tez zamieniony (I0).
Z I0-I3: `findInlandWaterHexes == 0` (I0 po D) oraz `findDryLandTouchingSea == 0` (I1-I3). Break zachodzi w przebiegu 0.
Stad `coastPasses` 1 i 2 (i kazde >= 1) daja identyczny wynik: **M12 jest rownowazna** (dowod wyczerpujacy, nie probkowy).

Pomiar zgodny z dowodem (scratchpad, `m12-equivalence-probe.mjs` skopiowany do runu):
- 2. przebieg faktycznie wystartowal (`changed != 0` i niespelniony warunek break) w **0 z 400** map losowych
  (18x18..60x60, szum 0-8%, udzialy lądu 15-95%, 3 biasy); roznice wyjscia finalize(1) vs finalize(2): **0**.
- Wczesniejsza probka: 162 mapy (wysepki, blob, 18-60): roznice 0.

Uwaga: dowod dotyczy kodu pinu (`git show edb8fb56:gra/src/map/gen-helpers.ts`, `:4787-4822`, `:3894-4023`, `:4026-4150`).
Rust `finalize_coast_and_inland_water` (`landsea.rs:2087-2109`) ma te sama strukture: 4 kroki i ten sam break
(`find_inland_water_hexes` + `find_dry_land_touching_sea` puste), zgodnosc sprawdzona przegladem kodu.
Ograniczenie dowodu: I0-I3 opieraja sie na czytaniu kodu TS, nie na mechanicznym dowodzie (np. w Coq/Lean).
