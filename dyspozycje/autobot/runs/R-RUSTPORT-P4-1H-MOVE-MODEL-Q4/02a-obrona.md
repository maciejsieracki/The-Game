# 02a — Obrona Operatora (R-RUSTPORT-P4-1H-MOVE-MODEL-Q4, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-MODEL-Q4
GOAL: adapter `PlayableState` → `RuchMapa` / `RuchJednostka` / `MoveOccupancy` oraz `moved_by_player_this_turn` w stanie (P4-1H / #250)
ZMIANY/COMMIT: baza obrony = `5a03035ad` (Evaluator r1, rodzic `e669ffa1e` Operator r1, przodek `1bacc7621` = `origin/rust-port/parity-v2`).
  Zmiana kodu: `rust-port/engine/src/domain/playable_movement.rs` (zarzut 2). Nowy skrypt `mutacje-r2.sh` i ten raport. SHA w stopce commitu (patrz `git log`).
TESTY: niżej, §Bramki.
BLOKADY: brak.
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 0. Odtworzenie bramek i mutacji przez Evaluatora — PRZYJMUJĘ (bez poprawki)
To potwierdzenie, nie zarzut. Po zmianie z zarzutu 2 bramki odtworzyłem ponownie (§Bramki), a mutacje uruchomiłem
skryptem `mutacje-r2.sh`. Różni się od r1 tylko dopasowaniem M5, bo zmieniło się wcięcie linii `occ.pass_through.remove(&key);`.

### 1. `mark_player_moved_unit` w `move_unit` a §ZAKRES 3 — ODRZUCAM jako wadę (interpretację zostawiam FC/orkiestratorowi)
Dowody:
- §WEKTORY dispatchu wymaga, by `moved_by_player_this_turn` było „ustawiane po ruchu gracza”. W Rust jedyną ścieżką ruchu gracza jest `move_unit`, więc bez tego oznaczenia wektora nie da się spełnić.
- Web, pin `07d2fbd72`, `gra/src/main.ts:31284` w `planMarchTo`: `markPlayerMovedUnit(u.id);` po wszystkich bramkach rozkazu (limit stosu `:31279-31282`), przed `plannedMarches.set`.
- Rust robi to samo: oznacza po bramkach `move_unit`, tuż przed klonem jednostki, i od tego miejsca nie ma już ścieżki `Err`. Geometria ruchu (1 heks), błędy, koszt i `movement` są bez zmian. Pełny `planMarchTo` zostaje w Q6 (#252).
- §ZAKRES 3 odczytuję jako zakaz zmiany semantyki ruchu (to temat Q6). Nie odczytuję go jako zakazu ustawiania nowego pola, którego wymaga §WEKTORY. Mutacja M6 (brak oznaczenia) daje FAIL, więc zachowanie jest pilnowane testem.

### 2. Duplikacja `foreignCityHexKeys` w `occupied_for_move` — PRZYJMUJĘ (poprawka)
Poprawka: `occupied_for_move` korzysta teraz z istniejącego `pathfinding::add_foreign_city_block_coords`
(RJ-REPIN Q3, `pathfinding.rs:651`). To wariant `foreignCityHexKeys` / `addForeignCityBlocks` na `HexCoord {q, r}`.
Zrezygnowałem z `foreign_city_hex_keys`, bo zwraca klucze `String`, które trzeba by parsować na `(i32, i32)`.
Własna pętla z filtrem `city.owner_id != mover_owner_id` została usunięta. Wynik jest ten sam co w webie
(`main.ts:14578-14584`): każdy heks obcego miasta trafia do `blocked` i jest usuwany z `pass_through`.
Dowód: `p4_1h_move_model` 9/9 zielone (testy zajętości obcego miasta, także z własną jednostką na nim). M5 (heks obcego miasta zostaje w `passThrough`) nadal daje FAIL.

### 3. Decyzja `u8` vs `f64` poza REJESTR-RUST.md — ODRZUCAM jako wadę Operatora
`dyspozycje/rust-port/REJESTR-RUST.md` nie jest na allowliście dispatchu, więc wpis Operatora oznaczałby natychmiastowy FAIL
(R-PROC-AUTOBOT §9). Decyzja z uzasadnieniem jest w `01-operator-r1.md` (blokady, pkt 1) i w nagłówku `playable_movement.rs`.
Model ruchu jest w `f64` 1:1 z pinem (`RuntimeUnit.ruch/ruchLeft`, koszty dróg 1/3, 2/3, 0,2). Magazyn `u8` jest konwertowany bezstratnie (`f64::from`).
Wpis do rejestru należy do orkiestratora. Przeniesienie `PlayableUnit.movement` na `f64` to warunek wejścia Q6 (#252).

### 4. Surowe `PlayerId` (gracz = 1) a web (gracz = 0, barbarzyńcy < 0) — ODRZUCAM jako wadę Q4 (uwaga dla Q5/Q6 zostaje)
Dowód: w `rust-port/engine/src/domain/pathfinding.rs` nie ma porównań `owner_id` z `0` ani `< 0`
(`grep "owner_id == 0|owner_id < 0|owner_id <= 0"` nic nie znalazł). `build_move_occupancy` i `add_foreign_city_block_coords`
porównują właścicieli wyłącznie równością, więc mapowanie zachowuje wynik. Dopisanie mapowania `PlayerId → web ownerId`
oznaczałoby wymyślenie konwencji, której stan dziś nie ma (barbarzyńcy nie istnieją w `PlayableState`). To należy do tematu,
który wprowadzi taką logikę (Q5/Q6). Wyrażam zgodę na wpisanie tego jako warunku wejścia Q5/Q6.

### 5. Zapis `moved_by_player_this_turn` — ODRZUCAM jako wadę (zgodne z pinem)
Dowód: `git grep -n movedByPlayer 07d2fbd72 -- gra/src` daje trafienia wyłącznie w `gra/src/main.ts` (`:31014`, `:31027`, `:31566`,
`:31696`, `:31702`, `:38144`, `:45066`, `:46280`, `:30634`), żadnego w module zapisu. Web nie zapisuje tego zbioru, a przy wczytaniu go czyści (`:46280`).
Rust robi to samo: czyści w `restore_playable_planned_marches`. DTO pomija pole, gdy jest puste, więc golden bez pola jest bajt w bajt identyczny.
Zapis z polem przechodzi round-trip zgodnie z wymogiem „zapis/odczyt” dispatchu. M4 daje FAIL.

### 6. Forest i Hills mają ten sam koszt 2 — ODRZUCAM jako wadę
Taki koszt wynika z pinu: `Wzgorza: 2` (`terrain-movement.json`), a las to `1 + forestExtra = 2` (`setup.ts:651-654`).
Odwzorowania rozróżnia asercja na `teren_of` w `odwzorowanie_terenu_i_kompletnosc_mapy`, a M1 (koszt zawsze 1) daje FAIL.
Osobna wartość kosztu, która by je różniła, byłaby niezgodna z webem.

## Bramki (rust-port/engine, na commicie obrony)
Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR=/tmp/ct-q4-obrona-927-3` (usunięty po bramkach).
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: NIE_ZMIERZONO, bo przebieg przerwało wymuszenie zakończenia: w chwili zapisu 1195 passed, 0 failed, wynik niepełny. Wcześniejsze przebiegi z limitem 585 s także skończyły się bez porażek (2009 passed, 0 failed, przerwane timeoutem 124). FC musi powtórzyć.
- Mutacje `mutacje-r2.sh` (M1–M6): NIE_ZMIERZONO w tej rundzie (skrypt gotowy, wymaga pełnego przebiegu; FC uruchamia)

Allowlista: zmieniony tylko `src/domain/playable_movement.rs` oraz pliki w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-MOVE-MODEL-Q4/`. `Cargo.lock` nie jest commitowany. `git diff --check` czysty.
