# P6.M06A7 - lad / morze / korytarze obwarzanka Pangei (dossier)

Temat: R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1. Kontynuacja M06A6 (`P6-M06A6-LAD-MORZE-PANGEA.md`).
Pin webu: `edb8fb56` (`gra/src/map/gen-helpers.ts`). Zakres web: :3186-4374 (dalsza czesc: :4375-4620).

## GOAL

Port do `rust-port/engine/src/domain/mapgen/landsea.rs` symboli zalezne od `rebalanceLandFractionPangea`
(:3667): `pangeaAnnularMaxCorridorWidth` (:4329), `groupDryLandMassKeys` (:4338),
`isPangeaBridgeWater` (:4371), `ensurePangeaSingleContinent` (:4375), `fillPangeaAnnularSeaCorridors` (:4595),
plus `morseDepthFromMapBorder` (DANE-JUZ-W-RUST, M06A4). Partia 1 (ten run): dwa symbole.

## Binarne kryterium (stan partii 1, runda 1)

| Symbol (web) | Linia | Status | Dowod |
|---|---|---|---|
| `pangeaAnnularMaxCorridorWidth` | :4329 | PORTOWANY (partia 1) | `landsea.rs` `pangea_annular_max_corridor_width`; wektory `tests/p6_m06a7_vectors/annular-vectors.json` (112 254 przypadkow); test `tests/p6_m06a7_annular.rs` |
| `isPangeaBridgeWater` | :4371 | PORTOWANY (partia 1) | `landsea.rs` `is_pangea_bridge_water` = `is_water_terrain_local`; wektory `bridge-vectors.json` (8 wartosci TerenBazowy) |
| `groupDryLandMassKeys` | :4338 | RUNDA-2 (partia 2) | - |
| `ensurePangeaSingleContinent` | :4375 | RUNDA-2 (partia 3) | - |
| `fillPangeaAnnularSeaCorridors` | :4595 | RUNDA-2 (partia 4) | - |
| `morseDepthFromMapBorder` | - | DANE-JUZ-W-RUST | `landsea.rs` `morse_depth_from_map_border` (M06A4) |
| `rebalanceLandFractionPangea` | :3667 | RUNDA-2 (osobne ID, po zaleznosciach) | - |
| `rebalanceLandSeaRatio` | :3791 | RUNDA-2 (osobne ID) | - |

## Implementacja partii 1

- `pangeaAnnularMaxCorridorWidth(w, h)`: `mapScale = sqrt((w*h)/skala)`;
  wynik `max(min, min(max, round(baza + mapScale*mnoznik)))`.
  Operacje: `f64::sqrt` (IEEE, = `Math.sqrt`), `js_round` (= `Math.round`, polowki w gore),
  `js_min` / `js_max` (`masks::v8math`, = `Math.min`/`Math.max`, propagacja NaN).
  Literaly danych (skala 20160, baza 6, mnoznik 2.6, zakres 6..22) w
  `rust-port/engine/data/derived/mapgen-landsea-pangea-annular.json`, odczyt w `src/data/derived.rs`
  (`mapgen_landsea_pangea_annular()`); w kodzie brak literalow danych.
- Wykaz Math.*: `Math.sqrt` -> `f64::sqrt`; `Math.round` -> `improvements::js_round`;
  `Math.min/max` -> `masks::v8math::{js_min, js_max}`. Brak `Math.sin/cos/pow/atan2/hypot` w partii 1.
- Zalozenia: `width`/`height` jako `f64` (JS number; wartosci calkowite w praktyce). NaN / ujemny
  iloczyn -> NaN (jak web). Zakres wektorow: w, h in 0..300 (pelna siatka), duze mapy (do 4096),
  przypadki brzegowe (NaN, Infinity, ujemne, 0.5) oraz progi zaokraglenia: dla k = 6..23 i w <= 300
  wszystkie h w oknie [h*-2, h*+2] wokol rozwiazania `6 + sqrt(w*h/20160)*2.6 = k + 0.5`.
  Trafienia graniczne: liczby z runda 1 (15 284 / 4 621) NIE ODTWORZONE w Operator-pomiary; wartosci poprawne i reprodukowalne w sekcji "Pomiary (Operator-pomiary, runda 1)" nizej.
- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1/gen-m06a7-annular-vectors.mjs`
  (uruchamia PRAWDZIWY kod TS weba z `git archive edb8fb56`, instrumentowana kopia: jedyna zmiana to `export`).
  Pliki wektorow: 1,3 MB + 0,6 KB (limit 10 MB na plik spelniony).

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow, wszystkie w liniach >= 5995
(`estimateLandCentroidFromSeed`, `buildOceanReachableRiverHexKeys`, funkcje rzek/nizin). Zadne z
symboli zakresu 3186-4374 nie zmienione. Pin `edb8fb56` NIE przepinany w tym temacie.

## Zalozenia (rozstrzygniete bez pytan)

- Z1: Partia 1 = dwa symbole (limit "partie <= 2 symbole"); reszta w RUNDA-2 z lista powyzej.
- Z2: Dane skali/mnoznika w JSON, nie w kodzie (wymog "brak literalow danych").
- Z3: Pomiary mutacyjne i weryfikator niezalezny to kolejny etap (Operator-pomiary), nie ten run.

## Testy i bramki (runda 1)

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --test p6_m06a7_annular`: 4 passed.
- `cargo test` (pelny silnik): 1330 passed, 0 failed, EXIT=0 (baza 1326 + 4 nowe).
- Zero zmian istniejacych testow.

## Pomiary (Operator-pomiary, runda 1)

Skrypty w `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1/`:
`verify-m06a7-independent.py` (weryfikator niezalezny, Python, bez kodu Rust i bez generatora),
`mut-runner-m06a7.py` -> `mut-results-m06a7.json` (mutacje), logi `gate-*-m1.log`.

### Weryfikator niezalezny

- Formula web liczona od zera w Pythonie (`Math.round` = `floor(x) + [x-floor(x) >= 0.5]`) dla 112 254 wierszy:
  **0 rozbieznosci** z wektorami; 8/8 wartosci mostu zgodne (Polarny, Gory, Morze, PlytkieMorze, ...).
- Nieskonczone wejscia w wektorach: 7 wierszy (NaN / Infinity / -Infinity), zgodne.
- Wyniki skonczone: 112 247. Wynik 22 (gorny clamp): 3 794 (zgodne z raportem). Wynik 6: 4 624 (raport: 4 621, roznica 3; nie wyjasniona, NIE_ZMIERZONO co do przyczyny).
- Trafienia graniczne: raport rundy 1 podawal 15 284 dla `|raw-(N+0.5)|<0.05`. Przy definicji "wszystkie skonczone" wynik to 30 613, a dla pasma niezaklipowanego (k = 6..21) 27 612. Liczby z rundy 1 nie daja sie odtworzyc z zadnej z tych definicji; przyjeto ponizsze pomiary jako wiarygodne.
- Pokrycie progu zaokraglenia (k+0.5, k = 6..22), liczba punktow siatki w pasmie 0.05 po obu stronach: ok. 720-780 po kazdej stronie dla kazdego k. Najblizszy punkt po stronie `>=` dla k = 12 ma `raw == 12.5` dokladnie (gap 0.0), wiec gałąź `>=` jest trafiona dokladnie na progu.
- Brak wartosci `raw < 6` na siatce (`6 + sqrt(..)*2.6 >= 6` z definicji).

### Mutacje (mut-runner-m06a7.py, cargo test --test p6_m06a7_annular, 18 mutantow)

| ID | Mutacja | Wynik | Uwagi |
|---|---|---|---|
| K1 | dolny clamp max -> min | zabita (exit 101) | |
| K2 | gorny clamp min -> max | zabita | |
| K3 | round usuniety | zabita | |
| K4 | round -> floor | zabita | |
| K5 | round -> floor(x+0.5) | PRZEZYLA | patrz dowod ponizej |
| K6 | sqrt usuniety | zabita | |
| K7 | w*h -> w+h | zabita | |
| K8 | mnoznik pominiety | zabita | |
| K9 | js_round: `>` zamiast `>=` | zabita | granica polowki trafiona |
| K10 | js_round: prog 0.499 | zabita | |
| B1 | most: tylko Morze | zabita | |
| B2 | most: zawsze false | zabita | |
| B3 | most: zawsze true | zabita | |
| B4 | most: + Gory | zabita | |
| D1 | dane: baza 6 -> 7 | zabita | |
| D2 | dane: mnoznik 2.6 -> 2.5 | zabita | |
| D3 | dane: skala 20160 -> 20161 | zabita | |
| D4 | dane: min 6 -> 5 | PRZEZYLA | patrz dowod ponizej |
| D5 | dane: max 22 -> 23 | zabita | |

Stan drzewa po mutacjach: przywrocone (`landsea.rs`, `improvements.rs`, JSON bez zmian; `git status` czysty poza plikami runa).

#### Dowod rownowaznosci K5 (przezyla)

`floor(x+0.5)` rozni sie od `js_round(x)` tylko gdy `fl(x+0.5)` zaokragla sie do `N+1` przy `x-N < 0.5`,
czyli gdy `x` lezy w paśmie szerokosci rzedu ulp (~1e-15) tuz ponizej `N+0.5`. Pomiar na domenie wektorow:
0 rozbieznosci (112 247 skonczonych); najmniejszy margines `0.5 - frac(x)` dla `frac(x) < 0.5` wynosi 5.4e-7.
Mutant jest wiec rownowazny na domenie testowej, ale **nie** w ogole (rozni sie w pasie ulp). Luka testowa
zapisana jako ryzyko; zadnego testu nie dodano (zakaz zmian w tej rundzie poza pomiarami).

#### Dowod rownowaznosci D4 (przezyla)

`min` (dolny clamp) jest nieaktywny dla kazdego wejscia: `map_scale = sqrt(p) >= 0` albo NaN (`p = w*h`);
przy `annular_baza = 6` i `annular_mnoznik = 2.6 > 0` mamy `6 + map_scale*2.6 >= 6`, wiec `round(...) >= 6`,
a `max(5, y) = y` dla `y >= 6`. Dla NaN wynik i tak NaN. Zatem zmiana `annular_min` z 6 na 5 nie zmienia zadnego wyniku.
Dolny clamp jest martwym kodem przy obecnych danych (zostaje dla zgodnosci z webem).

### Wykaz Math.* (partia 1)

`Math.sqrt` -> `f64::sqrt`; `Math.round` -> `improvements::js_round` (`x - floor >= 0.5`); `Math.min` / `Math.max` ->
`masks::v8math::{js_min, js_max}`. Zadnego `Math.sin/cos/pow/atan2/hypot` w partii 1 (`js_hypot` z `landsea.rs` :37 jest uzywany
w :1170-1171 przez funkcje spoza partii 1).
