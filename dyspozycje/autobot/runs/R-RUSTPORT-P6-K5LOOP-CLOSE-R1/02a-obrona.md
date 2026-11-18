# R-RUSTPORT-P6-K5LOOP-CLOSE-R1 — obrona Operatora (runda 1)

STATUS: PASS-WITH-NOTES (Z1, Z2 i Z3 przyjęte i poprawione; Z4 przyjęty jako zakres rundy 2; Z5 informacyjny; pełna bramka engine = BLOCK INFRA przez dysk, patrz TESTY)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-CLOSE-R1
GOAL: `ProdBody` bez luk, które blokują #113/I5: prawdziwe `update_facing` po każdym kroku ruchu oraz każde `ActivateEvent` wykonane wg pinu albo jawnie oznaczone.
BAZA: `e50ed830e` (raport Evaluatora) nad kodem `aa0f55121` (parity `4b27bc689`). Gałąź robocza: `k5loop-close-r1-obrona`.

## Odpowiedzi na zarzuty

### Z1 (C-FLANK po cichu jako front): PRZYJMUJĘ
- Pin: `_advanceStep` `battleScene.ts:8204-8235`, `desiredHitForDirection(ru.attackDirection)` (`:8208`, `:1956-1960`). Spawn ustawia `'front'` (`:4577`, `:4722`, `:5492`, `:17265`), a UI ustawia `'bok'`/`'tyl'` (`:13917`, `:16975`).
- Poprawka (D-K5C-4): w `ProdBody` jest nowe pole `pub attack_direction: [Vec<AttackDirection>; 2]`, domyślnie `AttackDirection::Front`. Użyty został istniejący typ `siege_tactics_doctrine_target::AttackDirection`. Pole leży w `ProdBody`, a nie w `ProdUnit`, z tego samego powodu co `formation_rank`: literał `ProdUnit` występuje w testach spoza allowlisty.
- `ProdBody::advance_step`: po preludium pinu (`moveLeft <= 0` kończy przed blokiem; `NaN` nie kończy, tak jak w JS) i przy kierunku `'bok'`/`'tyl'` zapisywany jest jawny tag `krok-naprzod-flanka`. Jednostka nie rusza się, tak jak przy każdym innym `unported`. Ciało nie zamienia już tej gałęzi po cichu na marsz czołowy. Port samego bloku (T4d: `_pickTargetByPriority`, `_canStrikeTargetFrom`, `_firstStepTowardDirectedAttack`, klocki z T2/T6) przechodzi do rundy 2 i dopisuję go do listy Z4.
- Wektor z pinu: generator ma rodzinę `flank` (120 wektorów, osobne ziarno `SEED+1`). Pin WYKONUJE `_activateUnit` z `attackDirection` `'bok'`/`'tyl'`. Stub `_pickTargetByPriority`/`_firstStepTowardDirectedAttack` rzuca wartownika `C-FLANK-ENTERED`, czyli pin sam rozstrzyga, czy wchodzi w blok. Generator zapisuje wtedy stan sprzed bloku i `expect.unported = ["krok-naprzod-flanka"]`. Wynik: 94 wektory wchodzą w blok, 26 kończy się na preludium `moveLeft <= 0` i daje zwykłe oczekiwania bez tagu. Test porównuje tagi `unported` z wektorem dla WSZYSTKICH 600 wektorów, a nie tylko „puste”.
- Uwaga dodatkowa (NIE_ZMIERZONO, poza `_advanceStep`): `_targetInRange` (`:8402`) też czyta `attackDirection` przy wyborze celu ciosu spośród celów w zasięgu. W ciele cel ciosu to wejście adaptera (`ProdUnit::melee_target`), więc dotyczy to adaptera #113, a nie tego pliku. Zapisuję to dla rundy 2/#113.

### Z2 (mutant E4 przeżywa): PRZYJMUJĘ
- Generator ma rodzinę `rank-routed` (60 wektorów). Jednostka działa z efektywną doktryną `steady` (grupa, `autoPlay=false`) i `formationRank` 1..3, a losowy sojusznik ma rangę `rank-1` (albo brak pola, czyli `?? 0`) i jest `routed`. Generator zachowuje WYŁĄCZNIE scenariusze, w których wynik pinu różni się od emulacji mutanta E4. W tej emulacji wykonujemy ten sam tekst pinu, ale własnych sojuszników `routed` przestawiamy na nie-routed dopiero po rozstawieniu `occByKey`, więc pole dalej jest wolne i wyłącza się tylko filtr `!u.routed` z `:8154`. Wynik: każdy z 60 wektorów rozróżnia mutanta.
- Asercja pokrycia w teście: `rank_routed >= 50`.

### Z3 (`release_tile` bez wektora, mutant E5 przeżywa): PRZYJMUJĘ
- Dwa nowe testy oparte na liniach pinu:
  - `rout_po_okrazeniu_zwalnia_pole`: okrążenie `_activateUnit` `:6105-6121` (3 wrogów obok, morale 10 − `MORALE_SURROUND_HIT` 10 (`:1142`) = 0 ≤ próg 0) prowadzi do `_checkRout` i `_startRout`, a ten wykonuje `occByKey.delete` (`:9812`). Pole uciekiniera znika, pola wrogów zostają, a `unported` = `[ucieczka-routed]` (`_fleeStep` z Z4).
  - `zabicie_zwalnia_pole`: cios 5 przy HP 3 (rzut 0.0) prowadzi do `_startFade` i `_removeUnitFromScene`, a ten wykonuje `occByKey.delete` (`:9915`). Pole zabitego znika, pole atakującego zostaje.
- Doc-komentarz `start_rout` w `siege_tactics_loop.rs` nadal twierdził, że `occByKey` nie jest portowane. Poprawiłem go zgodnie ze stanem faktycznym.

### Z4 (zakres i kolejność rundy 2): PRZYJMUJĘ (zakres), kolejność do zatwierdzenia przez orkiestratora
Lista gałęzi NIEZROBIONYCH po obronie, z liniami pinu:
1. C-FLANK w `_advanceStep` (T4d): `battleScene.ts:8204-8235` (tag `krok-naprzod-flanka`, Z1).
2. `CavalryAction`: `_cavalryAction` `:6372-6412` (T6).
3. Strzelec: `RangedAction` `:6656` i `FallBackStep` `:7228` (zdjęcie strażnika `strzelec`, T5a/T5b/T7b).
4. `PhalanxAction`: `:6546-6578` (+ `_phalanxStep` `:6588-6636`, T7a).
5. `Flee`: `_fleeStep` `:9845` (nowy port).

Proponuję kolejność dispatchu z jedną zmianą: kawaleria przed `FallBackStep`, bo `FallBackStep` i `RangedAction` stoją za tym samym strażnikiem `strzelec` (`can_shoot || primary_ranged`) i trzeba je zdjąć razem. C-FLANK (pkt 1) proponuję na początek rundy 2, ponieważ należy do już wykonywanej gałęzi `AdvanceStep`. O kolejności decyduje orkiestrator (reguła 8). Operator jej nie zmienia sam.

### Z5 (informacyjny): PRZYJMUJĘ do wiadomości
Pełna bramka r1 ruszyła przy 7,7 GB z powodu własnego `CARGO_TARGET_DIR`. Bramka dała EXIT 0. `Move` w `BattleAction` i nominalny czas kroku pozostają NIE_ZMIERZONO (plik `siege_tactics_actions.rs` jest poza allowlistą; I5/#113).

## ZMIANY/COMMIT
Allowlista (tylko):
- `rust-port/engine/src/domain/siege_tactics_loop.rs`: pole `attack_direction`, tag `krok-naprzod-flanka` w `advance_step`, poprawiony doc-komentarz `start_rout`.
- `rust-port/engine/tests/p6_k5loop_close_gen.mjs`: rodziny `flank` i `rank-routed` (ziarno `SEED+1`, po pierwszych 420), wartownik C-FLANK, emulacja E4, statystyki.
- `rust-port/engine/tests/p6_k5loop_close_vectors/vectors.json`: 600 wektorów. Pierwsze 420 są bajt w bajt identyczne z r1 (porównanie JSON każdego przypadku: 420/420). SHA wycinków pinu się nie zmienił: `bdc91c51…559c`.
- `rust-port/engine/tests/p6_k5loop_close.rs`: `attack_direction` z wektora, porównanie `unported` z wektorem, asercje pokrycia (flank ≥ 100, w bloku ≥ 80, preludium ≥ 15, rank-routed ≥ 50), 2 testy Z3.
- Ten raport.
Nie ruszałem: `gra/**`, `data/**`, `Cargo.*`, innych modułów T4/T5/T6/T7, istniejących wektorów `p6_siege_tactics_loop*`. Nie dodałem `#[ignore]` i nie osłabiłem żadnej asercji (asercję „`unported` puste” zastąpiło ścisłe porównanie z oczekiwaniem pinu, które dla 506 wektorów nadal wymaga pustej listy).
SHA: patrz commit obrony na gałęzi `k5loop-close-r1-obrona` (podany w odpowiedzi Workflow). Commit bez push.

## TESTY
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach).
- Generator `node rust-port/engine/tests/p6_k5loop_close_gen.mjs`: EXIT 0, 600 wektorów, statystyki `{"flank":120,"flankEntered":94,"rankRouted":60,"moved":420,"multiStep":326,"facingAfterMove":53,"noMove":180,"ford":584}`.
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --test p6_k5loop_close`: EXIT 0, 5 passed.
- `cargo test --test 'p6_siege*'`: EXIT 0, 40 binarek, 222 passed, 0 failed.
- Pełny `cargo test --all-targets --no-fail-fast` (engine): **NIE URUCHOMIONY, BLOCK INFRA**. Wolny dysk 5,0 GB po bramkach cząstkowych i 5,6 GB po usunięciu własnego targetu, przy progu 8 GB z dispatchu. Spadek z 9,0 GB na starcie wynika z innych procesów. Cudzych worktree i targetów nie ruszałem (reguła 4). Pełną bramkę trzeba powtórzyć w FC albo po zwolnieniu dysku. Zmiana dotyczy wyłącznie `siege_tactics_loop.rs` i plików testu `p6_k5loop_close*`, które pokrywają wszystkie binarki `p6_siege*` i `p6_k5loop_close`.

### Mutacje (skrypt `mut.py` w scratchpadzie; przywrócenie potwierdzone, plik identyczny)
| mutant | zmiana | wynik |
|---|---|---|
| E4 | `in_play` bez `!c.routed` | **FAIL** (210 rozbieżności) — zabity |
| E5 | `release_tile` = no-op | **FAIL** (`rout_po_okrazeniu_zwalnia_pole`, `zabicie_zwalnia_pole`) — zabity |
| Z1 | tag C-FLANK wyłączony (marsz czołowy) | **FAIL** (487 rozbieżności) — zabity |
| Z1b | preludium `moveLeft <= 0` pominięte przed C-FLANK | **FAIL** (26 rozbieżności) — zabity |

## BLOKADY
- Pełna bramka engine: BLOCK INFRA, dysk 5,6 GB < 8 GB.
- Brak blokad technicznych kodu.

## RUNDY
1/5 (obrona rundy 1)

## NASTĘPNY KROK
Final Control r1 z pełną bramką engine po zwolnieniu dysku (≥ 8 GB). Potem runda 2 tego ID: C-FLANK (T4d) → kawaleria → strzelec (`RangedAction`+`FallBackStep`) → falanga → `_fleeStep`, w kolejności zatwierdzonej przez orkiestratora.

## DEPLOY/PUSH
NIE WYKONANO
