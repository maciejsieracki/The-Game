# P6.M06B2 - wyspy i finalizacja masy lądu (port `gen-helpers.ts`:4946-5100 do Rust)

Temat: `R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1` · DOMAIN: GAME · RUNDA 1/5 (Operator-impl).
Zakres (6 symboli): `removeTinyLandIslands` :4946, `minTinyIslandHexesForTyp` :4992, `countOpenOceanLandSpecks` :5006,
`purgeOpenOceanLandSpecks` :5027, `finalizeLandMassAfterCoast` :5050, `enforceTargetDryLandFraction` :5079.
Pin web: `edb8fb56` (zweryfikowany: `git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts` nie ma hunkow w
liniach 4946-5100). Baza: `origin/rust-port/parity-v2` = `1aba22f7` (M06B1 ZINTEGROWANE).
Artefakty runu: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/`.

## 0. Status

- 6/6 symboli PORTOWANE (kod + testy + wektory z uruchomionego weba + weryfikator Python dla 4/6 + mutacje).
- Commity (gałąź robocza `worktree-wf_1f2222a2-bfc-1`, od `1aba22f7`):
  `1294cf84` (removeTiny + minTyp + dane JSON + wektory), `d9c41c8c` (count/purge specks),
  `c3e861d9` (finalizeLandMassAfterCoast), `eaf57a2e` (enforceTargetDryLandFraction),
  `3dd3c8ea` (sondy granic enforce, runner mutacji, weryfikator Python, logi).
- Bramki (surowe logi w runie, `EXIT=`):
  - fmt: `gate-fmt-r1.log` EXIT=0.
  - clippy `--all-targets -- -D warnings`: `gate-clippy-r1.log` EXIT=0.
  - `cargo test --offline --no-fail-fast`: `gate-test-r1.log` EXIT=0, **1482 passed, 0 failed** (= 1465 z bazy + 17 nowych testow M06B2).
  - weryfikator Python `verify-m06b2-python.py`: `verifier-python-r1.txt` EXIT=0, **0 rozbieznosci**
    (4 minTyp, 544 removeTiny, 20 count, 20 purge).
- Mutacje: 13 (M01-M13), **9 zabitych**, 4 przezyte: M06, M07 (równoważne dowodem, §5.2), M11, M12 (obserwacyjnie
  równoważne na wektorach, NIE dowiedzione formalnie, §7). Wyniki: `mut-results-m06b2.json`, `_przywrocenie.zgodne = true`.

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
- `klamp-gorny` (324): cele 0.9/0.95/0.99 (klamp gorny).
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
| M11 | enforce | gorny klamp 0.85 -> 0.86 | PRZEZYTA | OBSERWACYJNIE RÓWNOWAZNA na wektorach (§7.1) |
| M12 | enforce | wybrzeze w etapie 3: 2 przebiegi zamiast 1 | PRZEZYTA | OBSERWACYJNIE RÓWNOWAZNA na wektorach (§7.1) |
| M13 | enforce | tolerancja w heksach +1 | ZABITA | `enforce_target_dry_land_fraction_matches_web` |

### 7.1 Przezyte M11 i M12 - pomiar replika (nie dowod)

Replika etapow enforce w JS (tylko diagnostyka, poza repo):
- M11: na 91 sondach `klamp-decyzja` wyjscie przy klampie 0.85 i 0.86 jest identyczne (91/91). Galaz, ktora mutant
  dodaje (ponowne wypelnienie + pierscien wybrzeza), nie zmienia stanu, gdy pojemnosc lądu jest wyczerpana.
  NIE dowiedzione formalnie: mozliwe, ze istnieje mapa, na ktorej galaz zmienia stan. Pozostalosc §10.
- M12: 2 przebiegi wybrzeza w etapie 3 vs 1: 0 roznic na 18 mapach x 37 celow (0.14..0.86 co 0.02) x 2 biasy.
  Pozostalosc §10 (ta sama uwaga).

## 8. Weryfikator Python (niezalezny od Rust i od kodu weba)

`verify-m06b2-python.py` - Python od zera, czyta TS `gen-helpers.ts` (progi minTyp wprost z `switch`), implementuje
removeTiny, countSpecks, purgeSpecks i porownuje z wektorami weba. Wynik: `verifier-python-r1.txt`, EXIT=0, 0 rozbieznosci.
ZAKRES: 4 z 6 symboli. `finalizeLandMassAfterCoast` i `enforceTargetDryLandFraction` NIE sa odtwarzane niezaleznie
(zaleza od lancucha helperow: `applyLandFractionByScore`, `finalizeCoastAndInlandWater`, `applyCoastRing`, ktorych
niezalezna reimplementacja wykracza poza te partie). Ich wektory weryfikuje test Rust wzgledem weba (§10, pozostalosc 1).

## 9. Zalozenia (luki rozstrzygniete ZALOZENIEM)

1. Klucze heksow kanoniczne `"q,r"` z calkowitych wspolrzednych; `hex.q/hex.r` = `hex.coords` (jak w M06B1).
2. Kolejnosc iteracji = kolejnosc wstawiania `HexRecord` (jak `Object.keys/entries`); sekwencyjne mutacje (purge,
   enforce) czytaja stan na biezaco.
3. `landScores` (Map) w wektorach = wartosci per klucz w kolejnosci wierszy; w Rust `HashMap<String,f64>`.
4. `minMaskFillScore` domyslne = `pangea_min_score_wypelnienia` z `mapgen-landsea-fill.json` (0.11 = PANGEA_LAND_FILL_MIN_SCORE :3438).
5. `enforceTargetDryLandFraction`: klamp 0.15/0.85 i tolerancja 3 pp przeniesione do JSON (`mapgen-landmass.json`).
6. Zloze w wektorach: `zloze_rudy` (tylko prawdziwosc); Rust `has_deposit`.

## 10. Stan zakresu i pozostalosci (`M06B KOMPLET`)

**M06B KOMPLET: TAK** - oba tematy M06B (M06B1: 6 symboli w `1aba22f7`; M06B2: 6 symboli tutaj) sa portowane,
z testami wektorowymi, mutacjami i bramkami zielonymi. Pozostalosci (do decyzji FC/Evaluatora):

1. Weryfikator Python niezalezny obejmuje 4/6 symboli; `finalizeLandMassAfterCoast` i `enforceTargetDryLandFraction`
   weryfikowane tylko testem Rust wzgledem weba (wektory z uruchomionego weba = oracle).
2. M11 (klamp 0.85 vs 0.86) i M12 (2 vs 1 przebiegow wybrzeza w enforce) przezyte: obserwacyjnie rownowazne na
   wektorach (§7.1), bez dowodu formalnego.
3. Cap `pass < 3` w `finalizeLandMassAfterCoast` nieobserwowalny (§5.2): wymog "mapy rozrozniajace cap" nie jest
   spelnialny (dowod + pomiar). Mutanty M06/M07 rownowazne dowodem.
4. Tabela `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (wiersze M06B) NIE istnieje w repo (brak pliku w gicie tej gałęzi);
   nie zaktualizowana (poza allowlista, plik nieobecny).
5. `Cargo.lock` i `rust-port/engine/target/` pojawily sie lokalnie przy `cargo` (nieśledzone, nie commitowane; poza allowlista).

## 11. Ograniczenia zakresu (zachowane)

Zero zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`,
istniejacych testach. Nowe pliki: `tests/p6_m06b2_*.rs`, `tests/p6_m06b2_vectors/**`, `data/derived/mapgen-landmass.json`,
dossier, runda. `git worktree prune` i usuwanie cudzych worktree: nie wykonywano.
