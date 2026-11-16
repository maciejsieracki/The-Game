# R-RUSTPORT-P4-1H-MOVE-MODEL-Q4: Final Control (runda 1)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-MODEL-Q4
GOAL: adapter PlayableState -> RuchMapa / RuchJednostka / MoveOccupancy oraz pole moved_by_player_this_turn
      (ustawiane po ruchu, czyszczone w advance_turn i przy wczytaniu), 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany commit 5d34ae85f (obrona r1), łańcuch 1bacc7621 -> e669ffa1e (Operator r1)
      -> 5a03035ad (Evaluator r1) -> 5d34ae85f (obrona r1) -> commit tego raportu (SHA niżej).
      Ancestry: `git merge-base --is-ancestor 1bacc7621 5d34ae85f` = TAK.
TESTY: niżej (bramki odtworzone samodzielnie na 5d34ae85f)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja przez orkiestratora na rust-port/parity-v2 (parity przesunęło się od bazy:
      origin/rust-port/parity-v2 = 05e4df502, więc przed FF potrzebny merge-tree / rebase i pełny test)
      oraz wpis decyzji u8 vs f64 w REJESTR-RUST.md
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i allowlista

- Baza wg dispatchu: `1bacc7621` (origin/rust-port/parity-v2 w chwili dispatchu). Jest przodkiem `5d34ae85f`.
- `git diff --stat 1bacc7621 5d34ae85f`: 10 plików, wszystkie w allowliście:
  - `rust-port/engine/src/domain/playable_movement.rs` (nowy),
  - `rust-port/engine/src/domain/playable.rs`,
  - `rust-port/engine/src/domain/mod.rs` (tylko `pub mod playable_movement;`),
  - `rust-port/engine/src/domain/save_load.rs` (tylko czyszczenie pola i komentarz),
  - `rust-port/engine/tests/p4_1h_move_model.rs` (nowy),
  - `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-MOVE-MODEL-Q4/**` (raporty i skrypty mutacji).
- Dispatch podaje `rust-port/engine/src/save_load.rs`; w bazie istnieje wyłącznie
  `rust-port/engine/src/domain/save_load.rs`, więc to ten sam plik (nieścisłość ścieżki w dispatchu).
- `git diff --check`: czysty. `Cargo.lock`: nie w commicie (lokalny, usunięty). Nowych `#[ignore]`: 0.
  Usuniętych linii z `assert`: 0.

## Bramki (rust-port/engine, commit 5d34ae85f, CARGO_TARGET_DIR=/tmp/ct-q4-fc-927-4, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-run` | EXIT 0 (wszystkie cele kompilują się) |
| `cargo test --all-targets --no-fail-fast` | jedno wywołanie nie mieści się w limicie 585 s (kod 124 po 264 celach: 2025 passed, 0 failed). Pozostałe 221 binariów testowych (plus `p6_m12_spawn`, przerwany w trakcie) uruchomione bezpośrednio z tego samego katalogu docelowego: wszystkie EXIT 0. |
| Suma unikalnych celów | **3547 passed, 0 failed, 1 ignored** (`p6_order_lane::e2e::dump_tick1_econ_for_web_generator`, istniał przed tematem). Zgodne z liczbą Operatora i Evaluatora. |
| `cargo test --test p4_1h_move_model` | 9/9 ok |

Uwaga do pomiaru: pełny test zmierzony jest w dwóch częściach (cargo + bezpośrednie uruchomienie binariów),
a nie jednym wywołaniem `cargo test` z kodem wyjścia 0. Wszystkie binaria dały EXIT 0, więc wynik jest
równoważny. Przy integracji orkiestrator i tak powtarza pełny test na wyniku merge'a.

## Mutacje (mutacje-r2.sh, uruchomione w dwóch częściach M1–M3 i M4–M6)

| Mutacja | Wynik |
|---|---|
| M1 koszt terenu = 1 zawsze | FAIL (3 testy) |
| M2 pominięcie passThrough | FAIL (2 testy) |
| M3 brak czyszczenia w advance_turn | FAIL (1 test) |
| M4 brak czyszczenia przy wczytaniu | FAIL (1 test) |
| M5 heks obcego miasta zostaje w passThrough | FAIL (1 test) |
| M6 brak markPlayerMovedUnit w move_unit | FAIL (1 test) |

Pliki źródłowe po mutacjach przywrócone (`git status` czysty poza nieśledzonym `Cargo.lock`, usuniętym).

## Weryfikacja pinu 07d2fbd72 (samodzielnie)

- `main.ts:14578-14584` `occupiedForMove`: `buildMoveOccupancy` + każdy klucz `foreignCityHexKeys` dodany do
  blokad i usunięty z `passThrough`. Rust `occupied_for_move` robi to samo.
- `game/city-hex-movement.ts:66-75` `foreignCityHexKeys`: filtr `c.ownerId !== unitOwnerId`; Rust
  `pathfinding::add_foreign_city_block_coords` (`pathfinding.rs:651`) ma identyczny filtr.
  `MoveOccupancy` używa `HashSet`, więc kolejność iteracji (BTreeSet vs kolejność miast w webie) nie ma znaczenia.
- `main.ts:31026-31028` `markPlayerMovedUnit` = `movedByPlayerThisTurn.add`; wołane w `planMarchTo`
  `:31284` po wszystkich bramkach rozkazu (canOccupyHex, limit stosu).
- `main.ts:38144` `movedByPlayerThisTurn.clear()` przed odnowieniem `ruchLeft`; Rust czyści tuż przed pętlą
  `unit.movement = unit.movement_max` w `advance_turn`.
- `main.ts:46280` czyszczenie przy wczytaniu; Rust w `restore_playable_planned_marches`.

## Orzeczenia

| Nr | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | Potwierdzenie bramek przez Evaluatora | ODDAL (nie jest wadą) | Bramki odtworzone niezależnie na 5d34ae85f: zielone, mutacje FAIL. |
| 1 | `mark_player_moved_unit` w `move_unit` wbrew §ZAKRES 3 | ODDAL | §WEKTORY tego samego dispatchu wymaga „ustawiane po ruchu gracza”, a jedyny ruch gracza w Rust to `move_unit`. Zmiana dodaje tylko zapis do zbioru po wszystkich bramkach; geometria, koszt ruchu, błędy i wynik `move_unit` bez zmian (pełny test zielony). Odpowiada webowi (`main.ts:31284`, po bramkach). Zakaz §ZAKRES 3 dotyczy semantyki ruchu (planMarchTo wieloheksowy = Q6), której nie ruszono. |
| 2 | Duplikacja `foreignCityHexKeys` | ODDAL (naprawione przez obronę) | 5d34ae85f woła `pathfinding::add_foreign_city_block_coords`; własnej pętli nie ma. M5 nadal FAIL. |
| 3 | Decyzja u8 vs f64 nie w REJESTR-RUST.md | ODDAL (zadanie orkiestratora) | Plik poza allowlistą; decyzja opisana w `01-operator-r1.md` i nagłówku `playable_movement.rs`. Wpis musi zrobić orkiestrator przy integracji; Q6 (#252) ma przejść na f64 przed pierwszym kosztem ułamkowym. |
| 4 | Surowe PlayerId zamiast ownerId weba (gracz 0, barbarzyńcy < 0) | ODDAL | W Q4 właściciele porównywani tylko równością, więc brak skutku. Warunek wejścia dla Q5/Q6: mapowanie, jeśli pojawi się logika `ownerId === 0` lub `< 0`. |
| 5 | Pole nie jest zapisywane, tylko czyszczone przy wczytaniu | ODDAL | Zgodne z pinem (web nie zapisuje `movedByPlayerThisTurn`, czyści przy wczytaniu `:46280`). Golden bez pola bajt w bajt, round-trip z polem przechodzi. |
| 6 | Forest i Hills z tym samym kosztem 2 | ODDAL | Oba koszty wynikają z pinu (`Wzgorza: 2`; `1 + forestExtra`), rozróżnia je asercja na `teren_of`; M1 FAIL. |

Brak orzeczeń NAPRAW i brak spraw DO DECYZJI CZŁOWIEKA (sprzeczność z zarzutu 1 rozstrzygnięta na
korzyść §WEKTORY i parytetu z webem, zgodnie z zasadą 9 i 11; decyzja techniczna).

## Uwagi dla orkiestratora (nie blokują)

1. Wpisać do `REJESTR-RUST.md`: model ruchu f64, magazyn `PlayableUnit.movement` u8 do Q6; odwzorowanie
   terenu (Plains→Rownina, Hills→Wzgorza, Forest→Rownina+las, Water→Morze); `base_type_id` jako `pub(crate)`;
   `move_unit` oznacza jednostkę w `moved_by_player_this_turn`.
2. Q5/Q6: mapowanie PlayerId na ownerId weba, gdy pojawi się logika `=== 0` / `< 0`.
3. Pełny `cargo test --all-targets` przekracza dziś ~585 s jednego wywołania na tej maszynie; integracja
   powinna mierzyć go w częściach albo w tle.
4. `origin/rust-port/parity-v2` = `05e4df502` (przesunięty od bazy `1bacc7621`): przed FF sprawdzić
   merge-tree i powtórzyć bramki na wyniku.
5. Obrona zostawiła `CARGO_TARGET_DIR=/tmp/ct-q4-obrona-927-3` (możliwie nieusunięty) — do sprzątnięcia.
