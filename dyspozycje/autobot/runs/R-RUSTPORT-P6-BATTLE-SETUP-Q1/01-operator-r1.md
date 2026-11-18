# R-RUSTPORT-P6-BATTLE-SETUP-Q1 — Operator, runda 1 (T5a: teren + mur)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-Q1
GOAL: domena silnika produkuje pole bitwy jak pin 07d2fbd72 (generateBattleTerrain + presetForWorldTerrain +
      battleSafeCols/battleClearSideCap, _carveBattleBox, _fencePlayableZone, _carveWallTiles, rzędy wież),
      impl MoveTerrain produkcyjny na siatce (#113), równość z renderer carve_wall_tiles/tile_jitter przez fiksturę JSON
ZMIANY/COMMIT: gałąź rust-port-wip/battle-setup-q1-r1 (= worktree-wf_16b22c18-77c-1), kod 4ae3c51c42c2bd83ba6f2ac8c24abec8b1023e8e (baza d21caf8f2); raport w commicie następnym na tej gałęzi; trailer commitów bez linii Co-Authored-By z nazwą modelu (ZAKAZY dispatchu)
TESTY: patrz §4 (fmt, clippy -D warnings, nowe testy 14/14, mutanty, pełny cargo test --all-targets)
BLOKADY: brak (uwagi §6)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md); po FC — runda T5b (rozstawienie jednostek) tego samego ID
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza

`BAZA:` z dispatchu = `origin/rust-port/parity-v2` = `d21caf8f2ac41f44126d310b9319b6dcbe125b97` (sprawdzone
`git rev-parse` po `git fetch` w chwili startu). `git checkout -B rust-port-wip/battle-setup-q1-r1 d21caf8f2`.

## 2. Zmiany (allowlista)

| Plik | Co |
|---|---|
| `rust-port/engine/src/domain/battle_setup_terrain.rs` (nowy) | port 1:1 `battle-terrain.ts`: `BTerrain`, `xmur3`/`mulberry32`/`makeRng` (UTF-16 jak `charCodeAt`), `pickFromRanges`, `TerrainPreset`/`DEFAULT_PRESET`/`presetForWorldTerrain` (z `trim()`/`toLowerCase()` JS), `generateBattleTerrain` (rzeka winding/wide/coast/none, jeziora, las, wzgórza łańcuchy/bloby, skały, skały brzegowe), `tileJitter`, `BattleTerrainMap` (`at`/`passable`/`moveCost`/`combatTerrainName`/`isFordTile` z semantyką `Uint8Array`: zapis poza tablicą pomijany, odczyt niecałkowity/NaN = `undefined`) |
| `rust-port/engine/src/domain/battle_setup_sin.rs` (nowy) | `js_sin` = V8 `ieee754::sin` (fdlibm). `f64::sin` (glibc) różni się od V8 na 6432/200000 argumentów z [-60, 60] (zmierzone); jądra `mapgen::prims` są prywatne, a `prims.rs` jest poza allowlistą |
| `rust-port/engine/src/domain/battle_setup.rs` (nowy) | stałe pola, `battle_clear_side_cap` (NaN jak JS), `deploy_clear_ranks_for`/`battle_clear_ranks`, `battle_safe_cols(_f)`, `carve_battle_box` (pasma, korytarz, straż łączności DFS), `fence_playable_zone`, `carve_wall_tiles` (`SiegeLayout` z `wallTileHp`, `siegeWallTilesInit`), `setup_battle_field` (= konstruktor `:2776-2817` + wieżyczki `_placeSiegeWall`→`_placeSiegeTowers`), `cavalry_terrain_multiplier` (`combat.ts:756-772` z regexem `/[x×]\s*(\d+(?:[.,]\d+)?)/i` i `\s` JS), `FieldMoveTerrain` = produkcyjny `impl MoveTerrain` |
| `rust-port/engine/src/domain/mod.rs` | tylko 3× `pub mod` |
| `rust-port/engine/tests/p6_battle_setup.rs` (nowy) | 14 testów (§4) |
| `rust-port/engine/tests/p6_battle_setup_gen.mjs` (nowy) | generator: WYKONANIE tekstu pinu (D-BS-2) + fikstura renderera |
| `rust-port/engine/tests/p6_battle_setup_vectors/{vectors,renderer_parity}.json` (nowe) | wektory (MD5 w §4) |

Nie ruszano: `renderer/`, `siege_tactics_loop.rs`, `Cargo.toml`/`Cargo.lock`, `gra/**`, istniejących testów/wektorów.

## 3. Generator (D-BS-2) i RNG (D-BS-3)

* Orakul = wykonanie tekstu pinu `07d2fbd72` (`git show`): CAŁY `battle-terrain.ts` (+1 wiersz eksportu prywatnych
  `xmur3/mulberry32/makeRng/pickFromRanges` dla wektorów RNG), CAŁE `city-towers.ts` i `city-fortification.ts`,
  wycinki `battleScene.ts` (stałe, `battleClearSideCap`, `deployClearRanksFor`, `battleSafeCols`, `inPlayable`,
  `isFordTile`, `cellToWorld`, `clampEra`, `BT_DEBUG_PRESETS`+`debugWorldTerrainOverride`, pola klasy, fragmenty
  konstruktora `:2741-2743`, `:2770`, `:2776-2817`, `:3478-3483` bez dekoru `_buildSiegeInteriorBuildings`, metody
  `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles`, `_placeSiegeWall`, `_placeSiegeTowers`), wycinki
  `combat.ts` (`normTerrain`, `findTerrainEntry`, `cavalryTerrainMultiplier`), dane pinu (`miasto-params.json`,
  `units.json`, `terrain-combat.json`). Atrapy wyłącznie 3D/DOM (bez logiki gry).
* Strażnik: SHA-256 plików (`battle-terrain.ts` `a17735ed…`, `city-towers.ts` `cc715ed6…`,
  `city-fortification.ts` `52fd18e9…`) i wycinków (`21984ff2…`) + `expectLine` na pierwszym/ostatnim wierszu
  każdego wycinka. Generator jest deterministyczny (2 uruchomienia → identyczne MD5).
* **D-BS-3: ustawienie pola NIE używa `Math.random`.** Generator podmienia `Math.random` na funkcję rzucającą
  wyjątek na czas wykonania wszystkich scenariuszy konstruktora → 0 wywołań. Jedyny RNG: `makeRng('bf:' + teren +
  ':68x156')`.
* `?bt=` (debug): wykonany tekst `debugWorldTerrainOverride` w Node zwraca `undefined` (brak `window`) — tak jak
  produkcja bez parametru; w Rust nie portowany (narzędzie zrzutów ekranu).

## 4. Testy i bramki

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| `cargo test --test p6_battle_setup` | 14 passed, 0 failed |
| mutanty (`scratchpad/bsetup/mutate.py`, 23 mutanty) | 22/22 zabite + 1 równoważny (straż łączności, uzasadnienie niżej); EXIT 0 (2. przebieg, po dodaniu wektorów `sin` i odstępów wież — w 1. przebiegu przeżyły `sin: libm` i `wieżyczki: rząd bramy`) |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`) | EXIT=0; 532 binarki/zestawy `test result: ok`, 4002 passed, 0 failed, 0 ignored |

Wektory (`vectors.json` MD5 `2be023c81a756c17c823e21bf255113e`, `renderer_parity.json` MD5 `d5d76ef6b5e27a5dfd75d57f9c4f3d2c`):
sideCap 152 (w tym NaN/±Inf/-0/ujemne/ułamkowe), clearRanks+safeCols 24 (w tym NaN/Inf), presety 172 (każda baza
mapy presetów × las × rzeka + warianty wielkości liter, białych znaków JS ` `/`﻿`/` `, `​`,
nieznane), RNG 10 ziaren × 12 rzutów (UTF-16, emoji, ogonki), tileJitter 400, pickFromRanges 200 (wartość + liczba
rzutów), `generateBattleTerrain` 220 losowych opcji (cols/rows od -2, deployMargin/rowMargin ujemne i duże, safeCols,
presety własne: każdy tryb rzeki ≥ 20 przypadków), **21 scenariuszy pełnego ustawienia** porównanych bajt w bajt po
każdym etapie (generator, `_carveBattleBox`, `_fencePlayableZone`, `_carveWallTiles`, końcowy) + pola muru, `fortKind`,
rzędy wież, `desertPalette`, `safeCols`:

| Scenariusz | Preset / mur |
|---|---|
| legacy-40v40, legacy-siege-mur | bez presetu (legacy), mur |
| laka-palisada, laka-las | Łąka (jeziora), palisada; nakładka Las |
| rownina-130, rownina-rzeka, ujemna-liczebnosc | Równina (sideCap 130), Rzeka → `wide` |
| wzgorza-cytadela-500, wzgorza-las-rzeka | Wzgórza (edgeRocks, łańcuchy), cytadela (`mury`+`fort`), sideCap 500 |
| gory-bez-obwarowan, gory-rzeka-palisada | Góry (`isMountain`), mur bez obwarowania (brak wież), palisada |
| pustynia-mury-kamienne, pustynia-rzeka-las | Pustynia (paleta, noForest blokuje nakładki) |
| wybrzeze | `plytkie_morze` → `coast` |
| nieznana-baza | `tundra` → kopia DEFAULT, presetActive |
| nan-liczebnosc, inf-liczebnosc | NaN/Inf w liczności (NaN → `clearSideCap` NaN → 0 kolumn pasm, jak pin) |
| odstep-wiez-1/2/3/brak | odstęp wieżyczek z danych 1/2/3 i brak klucza (`?? 4`) |

Sondy `MoveTerrain` 3696 (176/scenariusz: losowe kafle, krawędzie, mur/brama, indeksy niecałkowite, NaN, -0, ±Inf,
1e300) — `at`, `passable`, `moveCost`, `isFordTile`, `combatTerrainName`, `cavalryTerrainMultiplier`. Mnożnik
kawalerii 37 wektorów (dane pinu + 25 syntetycznych łańcuchów `Kawaleria/Rydwan`). `Math.sin` V8: 3000 wektorów
(dziedzina szerokiej rzeki + losowe). Dane `rust-port/engine/data/terrain-combat.json` == pin (test).

Fikstura renderera: generator wycina z `rust-port/renderer/src/battle/field.rs` stałe, `tile_jitter`,
`TerrainGrid::set_index`, `carve_wall_tiles` (FNV-1a 64 `683b6817335ea8b8`), kompiluje je `rustc` jako
samodzielny program i zapisuje wyniki dla 400 `tile_jitter` i 18 wejść `carve_wall_tiles` (siatki po
`_fencePlayableZone` ze scenariuszy + siatka 20×30). Test silnika porównuje swoje wyniki z fiksturą i sprawdza
FNV wycinków w bieżącym `field.rs` (odczyt pliku, bez zależności od crate). Generator dodatkowo sprawdza renderer ==
pin dla muru (zgodne).

NaN/Inf: `nan_inf_i_skrajne_licznosci_nie_zawieszaja` (strażnik czasu wątkiem, 30 s) — NaN, ±Inf, ±1e308 z i bez
presetu; bezpośrednie `carve_battle_box(.., Inf)` kończy się i daje to samo co głębokość 2000.

Mutanty (każdy = osobna kompilacja i `cargo test --test p6_battle_setup`):

| Mutant | Wynik |
|---|---|
| kolejnosc rzutow (las | cr<->cc): ZABITY (generate_battle_terrain_losowe_opcje_jak_pin, move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| kolejnosc rzutow (soft edge przed zasiegiem) | ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, generate_battle_terrain_losowe_opcje_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| ziarno | cols/rows zamienione: ZABITY (generate_battle_terrain_losowe_opcje_jak_pin, move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| ziarno | bez prefiksu bf:: ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| ziarno | UTF-8 zamiast UTF-16: ZABITY (generate_battle_terrain_losowe_opcje_jak_pin, move_terrain_produkcyjny_na_siatce_jak_pin, rng_jitter_i_pick_from_ranges_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| pominiecie wyciecia pasm (_carveBattleBox) | ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| pominiecie strazy lacznosci [rownowazny] | PRZEZYL |
| preset | brod zamiast rowniny w pasmie (presetActive): ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| pominiecie ogrodzenia (_fencePlayableZone) | ZABITY (scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin, move_terrain_produkcyjny_na_siatce_jak_pin) |
| offset muru +1 | ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, rownosc_z_rendererem_przez_fiksture, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| brama o rzad nizej | ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, rownosc_z_rendererem_przez_fiksture, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| wiezyczki | rzad bramy: ZABITY (scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| preset | wzgorza hillBlobsMul 3.5 -> 3.4: ZABITY (preset_for_world_terrain_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| preset | las overlay 2.2 -> 2.0: ZABITY (preset_for_world_terrain_jak_pin, move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| preset | rzeka overlay bez wyjatku plytkie_morze: ZABITY (preset_for_world_terrain_jak_pin) |
| presetActive zawsze false | ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| side cap bez NaN (f64::max) | ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin, side_cap_glebokosc_i_safe_cols_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| sin | libm zamiast fdlibm: ZABITY (js_sin_bit_w_bit_jak_v8) |
| tileJitter | salt 811 -> 812: ZABITY (generate_battle_terrain_losowe_opcje_jak_pin, move_terrain_produkcyjny_na_siatce_jak_pin, scenariusze_ustawienia_pola_bajt_w_bajt_jak_pin) |
| Math.round | polowki w dol: ZABITY (generate_battle_terrain_losowe_opcje_jak_pin) |
| kawaleria | char::is_whitespace: ZABITY (mnoznik_kawalerii_jak_pin_i_dane_silnika_rowne_pinowi) |
| MoveTerrain | undefined jako Plains: ZABITY (move_terrain_produkcyjny_na_siatce_jak_pin) |
| zapis poza siatka zawiniety (bez pomijania) | ZABITY (generate_battle_terrain_losowe_opcje_jak_pin, rownosc_z_rendererem_przez_fiksture) |

**Mutant równoważny — straż łączności (`_carveBattleBox` krok 3).** Krok 2 zamienia każdą rzekę w kolumnach
`ATK_FRONT_COL..DEF_FRONT_COL` (31..36) na bród we WSZYSTKICH rzędach strefy gry, więc rząd `PLAY_MID_ROW` od startu
(31,77) do celu (36,77) zawsze składa się z kafli ≠ `River` (Wall/Gate jeszcze nie istnieją), a DFS zawsze znajduje
cel. Gałąź „punch fords” jest martwa w pinie dla każdej siatki — usunięcie jej nie zmienia wyniku. Port zachowuje ją
1:1 (D-BS-2), test nie może jej rozróżnić. Decyzja techniczna do potwierdzenia przez Evaluatora.

## 5. Decyzje techniczne operatora (do REJESTR-RUST przez orkiestratora)

* D-BS-4 (sin): `Math.sin` = port fdlibm (`battle_setup_sin.rs`), nie `f64::sin` (pomiar 3,2% rozbieżności).
* D-BS-5 (Uint8Array): indeksy kafli `r * cols + c` na `i64`, zapis poza tablicą pomijany, odczyt = `None`
  (`undefined`); dotyczy małych siatek i kolumn rzeki poza siatką (wektory to pokrywają).
* D-BS-6 (pętla pasm): `for (k < DEPLOY_CLEAR_RANKS)` ograniczone do `k < BF_COLS` — dla `k ≥ 68` pin nic nie dodaje,
  więc wynik identyczny; `Inf` nie zawiesza (pin by zawisł, ale z API liczności `Inf` → 500).
* D-BS-7 (odstęp wież): `SiegeFieldInput::tower_spacing` jawne wejście z danych; `None` = `DEFAULT_TOWER_SPACING`
  (pin `?? 4`).

## 6. Uwagi / poza zakresem

1. `rust-port/engine/data/miasto-params.json` NIE ma klucza `wieze_strzeleckie_odstep_kafli` (pin ma 4). Wynik
   identyczny (fallback 4), ale synchronizacja danych to osobny dług (poza allowlistą).
2. Renderer `field.rs` ma `MAX_PER_SIDE = 120` (pin web `edb8fb56`) w `deploy_clear_ranks_for`/`battle_safe_cols`;
   pin `07d2fbd72` liczy z `battleClearSideCap` (do 500). Dla armii > 120 na stronę teren renderera różni się od
   pinu — do załatwienia przy przepięciu renderera na `BattleSetupDto` (#364/#371). `carve_wall_tiles` i
   `tile_jitter` renderera są zgodne z silnikiem i pinem (fikstura).
3. `FieldMoveTerrain` nie jest jeszcze podpięty w `ProdBody` (wymaga zmian w `siege_tactics_loop.rs` — zakaz
   dispatchu); wołającym będzie T6/T7.
4. Producent `BattleSetupDto` nie jest w GOAL T5a (T5b / T9).
5. Ziarno z samotnym surogatem UTF-16 nie jest reprezentowalne w `&str` — wektor pominięty (teren pochodzi z danych
   gry, poprawne łańcuchy).
6. `pickSpreadRows` (`battle-terrain.ts:104`) nie jest wołane przez pin — nieportowane.

## 7. Sprzątanie

Target `CARGO_TARGET_DIR=scratchpad/bsetup/target` usunięty po bramkach (`rm -rf scratchpad/bsetup/target`; `df -h /`: 13 GB wolne).
