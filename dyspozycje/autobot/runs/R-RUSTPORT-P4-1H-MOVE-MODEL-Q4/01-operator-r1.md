# R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 (#250)
GOAL: adapter PlayableState -> RuchMapa / RuchJednostka / MoveOccupancy (model ruchu pinu 07d2fbd72)
      + moved_by_player_this_turn w stanie (czyszczone w advance_turn), bez zmiany ruchu w move_unit
ZMIANY/COMMIT: gałąź op/R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 (baza 1bacc7621); SHA kodu podany w raporcie końcowym Operatora (commit zawierający ten plik)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0;
       cargo test --all-targets --no-fail-fast EXIT 0 (485 binarek/zbiorów "ok", 3547 passed, 0 failed,
       1 ignored = istniejące wcześniej p6_order_lane::e2e::dump_tick1_econ_for_web_generator);
       nowy test p4_1h_move_model: 9/9 ok; mutacje M1-M6: wszystkie FAIL (niżej)
BLOKADY: brak (uwagi N1-N4 niżej)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i izolacja
- Baza: `origin/rust-port/parity-v2` = `1bacc7621da7bc944ed4814fdd3380977906c6a8` (zgodnie z dispatchem).
- Pin webu: `07d2fbd72` (`gra/src/main.ts`, `gra/src/units/setup.ts`, `gra/src/map/road-movement.ts`,
  `gra/src/game/city-hex-movement.ts`, `gra/data/terrain-movement.json`) — tylko `git show`.
- `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach). `Cargo.lock` niecommitowany.

## Zmiany (allowlista)
| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/playable_movement.rs` (NOWY) | `teren_of`, `ruch_hex_of`, `ruch_mapa_from_state`, `ruch_jednostka_of`, `ruch_jednostki_from_state`, `city_hex_refs`, `occupied_for_move` (web `occupiedForMove`, `main.ts:14578-14584`), `PlayableMoveModel` |
| `rust-port/engine/src/domain/playable.rs` | pole `moved_by_player_this_turn: BTreeSet<UnitId>` (`#[serde(default, skip_serializing_if = "BTreeSet::is_empty")]`), `mark_player_moved_unit`, `is_moved_by_player_this_turn`, `move_model()`, `occupied_for_move()`; `advance_turn` czyści zbiór (web `main.ts:38144`); `move_unit` oznacza jednostkę po bramkach (web `markPlayerMovedUnit`, `main.ts:31284`); `base_type_id` -> `pub(crate)` (odczyt typu startowego przez adapter) |
| `rust-port/engine/src/domain/mod.rs` | tylko `pub mod playable_movement;` |
| `rust-port/engine/src/domain/save_load.rs` | tylko `state.moved_by_player_this_turn.clear()` w `restore_playable_planned_marches` (web `main.ts:46280`) + zdanie w doc-komentarzu |
| `rust-port/engine/tests/p4_1h_move_model.rs` (NOWY) | 9 testów |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-MOVE-MODEL-Q4/` | ten raport, `mutacje-r1.sh` |

Wykorzystane funkcje RJ-REPIN Q3 (bez duplikacji): `build_move_occupancy`, `MoveOccupancy`,
`plan_path_turns_occ` (test), `terrain_move_cost`, `foreign_city_hex_keys`-semantyka przez `CityHexRef`.

## Decyzja techniczna: reprezentacja ruchu `u8` vs `f64` (do wpisu w REJESTR-RUST.md przez orkiestratora)
- Pin: `RuntimeUnit.ruch` / `ruchLeft` to `number` (`setup.ts:40`); koszty są ułamkowe
  (droga: `cost / 3`, `road-movement.ts:81`; bruk: `max(1/5, cost/5)`, `:78`), np. wzgórza + droga = 2/3.
- **Wybór: model ruchu = `f64` (1:1 z pinem).** Adapter wystawia `RuchJednostka.ruch` / `ruch_left` jako `f64`
  i wszystkie funkcje RJ liczą w `f64`. Magazyn `PlayableUnit.movement` / `movement_max` (`u8`) pozostaje w Q4,
  bo dziś żadna ścieżka stanu nie odejmuje kosztu ułamkowego (`move_unit` = 1 heks, koszt całkowity; Q4 nie
  zmienia `move_unit`). Konwersja `u8 -> f64` (`f64::from`) jest bezstratna.
- Zmiana typu pola na `f64` w Q4 łamałaby literały `PlayableUnit { movement: 1, .. }` w 9 plikach testów spoza
  allowlisty (`tests/p4_1j_*`, `p6_wire_war_*`, `p6_eliminacja.rs`, `view_city_pin_vectors.rs`, ...).
- **Wymóg dla Q6 (#252):** pierwsze odjęcie kosztu ułamkowego (`deductStackRuchLeft`, `main.ts:44101-44107`)
  musi przenieść magazyn na `f64` (pole `movement` jako `f64` albo równoległe pole `ruch_left: f64`) — inaczej
  obcięcie `as u8` (precedens: `playable.rs` w `replace_unit_with_defs`, `target.ruch_left as u8`). Allowlista Q6
  musi objąć pliki testów z literałami `PlayableUnit`.

## Odwzorowanie terenu (decyzja techniczna)
`PlayableTerrain` (4 warianty slice'a) nie ma odpowiednika 1:1 w webie; wybrano odwzorowanie dające koszt pinu:
| `PlayableTerrain` | `TerenBazowy` | las | koszt pinu |
|---|---|---|---|
| Plains | Rownina | nie | 1 (`terrain-movement.json` `Rownina: 1`) |
| Hills | Wzgorza | nie | 2 |
| Forest | Rownina | tak (`nakladka === Las`) | 1 + `forestExtra` 1 = 2 (`setup.ts:651-654`) |
| Water | Morze | nie | `99 >= 90` -> `Infinity` (`setup.ts:443`) |
Plains -> `rownina` zgodnie z istniejącą konwencją (`mapgen` `Terrain::Plains`, ekonomia `TerrainType::Plains`);
Water -> Morze jak `Water -> TradeTerrain::Ocean` w `turn_war_inputs`. Ulepszenia heksa (`map.improvements`)
przechodzą 1:1 (drogi działają przez `applyRoadMovementModifier`).

## Test zgodności adaptera (wartości ręczne z pinu, plik:linia w komentarzach testu)
- koszt: Plains 1, Hills 2, Forest 2, Water ∞, Plains+droga 1/3, Hills+droga 2/3, Plains+bruk 0,2, Plains 1;
- mapa startowa slice'a: każdy kafel ma koszt pinu swojego terenu i `passable == koszt skończony`;
- zajętość (`occupiedForMove`): heks z własną jednostką -> `pass_through`; heks z obcą jednostką -> `blocked`;
  heks z obcą i własną -> `blocked` bez `pass_through` (`setup.ts:773`); heks z obcym miastem i własną jednostką
  -> `blocked` i usunięty z `pass_through` (`main.ts:14581-14582`); własne miasto -> brak wpisu; jednostka
  ruszająca się wykluczona (`excludeIds`); perspektywa wroga symetrycznie;
- zachowanie: `plan_path_turns_occ` na modelu z adaptera — segment budżetu 2 kończący się na własnej jednostce
  przycięty do `[(1,0)]` (`planned-march.ts:271-275`), bez `pass_through` byłoby `[(1,0),(2,0)]`;
- `RuchJednostka`: `ruch = movement_max`, `ruch_left = movement` (f64), `type_id = "Wojownik"`,
  `category = "miecznik"` (`categoryOf`: fallback po `Typ` `swordsman`, `setup.ts:301`); stan zamiany ma pierwszeństwo.
- `moved_by_player_this_turn`: odrzucony rozkaz nie oznacza; udany `move_unit` oznacza; `advance_turn` czyści;
  JSON bez pola = golden bez zmian (brak klucza, round-trip identyczny); z polem `"movedByPlayerThisTurn":[1,9]`
  round-trip; `restore_playable_planned_marches` czyści.

## Mutacje (`mutacje-r1.sh`, uruchomione z `rust-port/engine`)
| # | Mutacja | Wynik |
|---|---|---|
| M1 | koszt terenu = 1 zawsze (każdy teren -> Rownina bez lasu) | FAIL (3 testy) |
| M2 | pominięcie `passThrough` (`occ.pass_through.clear()`) | FAIL (2 testy) |
| M3 | brak czyszczenia `moved_by_player_this_turn` w `advance_turn` | FAIL (1 test) |
| M4 | brak czyszczenia przy wczytaniu (`save_load`) | FAIL (1 test) |
| M5 | heks obcego miasta nie usuwany z `passThrough` | FAIL (1 test) |
| M6 | brak `mark_player_moved_unit` w `move_unit` | FAIL (1 test) |
Po każdej mutacji pliki przywrócone z kopii; `git diff` po skrypcie = tylko zamierzone zmiany.

## Uwagi (PASS-WITH-NOTES)
- N1: `move_unit` dostaje jeden nowy skutek uboczny — oznaczenie w `moved_by_player_this_turn` (wymagane przez
  wektor „ustawiane po ruchu gracza”); geometria, koszty i błędy ruchu bez zmian (pełny test silnika zielony).
  Web oznacza w `planMarchTo` także gdy segment potem się nie wykona; w Rust 1-heksowy ruch oznacza tylko po
  przejściu wszystkich bramek — rozbieżność zniknie w Q6.
- N2: `PlayableTile.passable` nie jest czytane przez adapter (pole pochodne terenu); test potwierdza zgodność
  na mapie startowej. Kafel z `passable = false` na terenie lądowym (możliwy tylko ręcznie) byłby przez model
  ruchu traktowany wg terenu, jak w webie.
- N3: pola nieobecne w `PlayableState` są web-falsy: `rzeka`, `wioska`, `ma_wlasciciela`, `embarked`,
  `oblega_city_id`, `stack_group_id`, `auto_explore`, `sentry`, `ma_mur` (miasto). Oblężenie (`siegeBlocksEntry`)
  i stos (`activeUnitStack`) nie są wyprowadzane — brak stanu (P4-1F3 / Q6).
- N4: `base_type_id` zmieniono na `pub(crate)` w `playable.rs` (plik na allowliście) — jedyny sposób odczytu
  typu startowego bez kopiowania literału `"Wojownik"`.

## NIE_ZMIERZONO
- Wartości oczekiwane policzone ręcznie z kodu pinu, nie z uruchomionego webu (zgodnie z dispatchem).
