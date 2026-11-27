# R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1: Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1
GOAL: port `_performSiegeManualOrder` (pin `07d2fbd72`, `battleScene.ts:18435-18475`) jako czysta funkcja z decyzją
i `handled` zgodnym z pinem, wynik wpięty w `perform_player_order` (`siege_manual_handled`) w zakresie testów;
`_trySiegeTowerClimb` (`:8056-8084`) zgodny z pinem na wektorach kroku.

## Oceniany stan
- Kod Operatora: `d6c56af0e` (commity `a050a6bb4`, `9ba8e3fe5`, `d6c56af0e`); raport Evaluatora `3fa0d90e2`; obrona
  `0ab850b6c` (`obrona/416-r1`). FC na gałęzi `fc/416-r1` = `0ab850b6c` + ten raport.
- Baza: `git merge-base --is-ancestor 53e4188f2 0ab850b6c` = tak; `origin/rust-port/parity-v2` =
  `53e4188f23510794e568d0b5d150be017669ef76` = BAZA z dispatchu.

## Allowlista (sprawdzona samodzielnie, `git diff --stat 53e4188f2 0ab850b6c`)
8 plików: nowy `domain/player_order_siege_manual.rs` (401), `domain/mod.rs` (+1), nowy
`tests/p4_416_siege_manual_order.rs` (1043), `tests/p6_k5loop_wiring_a_gen.mjs` (+301, **0 linii usuniętych**, strażnik
SHA-256 bez zmian), nowy `siege_manual_order_step_vectors.json`, raporty 01/02/02a. `player_order_move.rs` bez zmian
(dopuszczalne: wpięcie przez istniejący argument). Istniejące pliki wektorów, `gra/`, kontrakt mostu, klient i renderer
bez zmian. Spoza allowlisty: brak.

## Weryfikacja samodzielna
1. **Tekst pinu vs port** (`git show 07d2fbd72:gra/src/battle/battleScene.ts`, `:18435-18475`, `:8056-8084`,
   `:8291-8294`, `:17621-17640`, `:18280-18296`), linia po linii z `siege_manual_order_step`: bramka, maszyny,
   `doctrineAuto`, bezczynny strzelec (`canShoot && shootingEnabled !== false`), pomost, kolejność wspinaczka przed
   piechotą do wieży, podejście ograniczone (filtr `_enemiesOf` z `routed` + `find` z `!dead && !fadingOut`, cel = pozycja,
   `_siegeSafeApproach` false → `done`), `return false`. Zgodne.
2. **Wektory z tekstu pinu**: `WIRING_A_SIEGE_MANUAL_STEPS=1 node p6_k5loop_wiring_a_gen.mjs` do pliku w scratchpadzie:
   MD5 `614ddfdb45e073b508ada90727ce635c` = plik w repo (deterministyczne). Przejrzałem blok generatora: woła
   `bs._performSiegeManualOrder` i `bs._trySiegeTowerClimb` pinu wprost; podfunkcje są owinięte śladem i wykonują
   `orig[name]` (tekst pinu); podmienione są wyłącznie metody wykonawcze (`_doMove`, `_attackGate`, `_advanceToward`,
   `_doAttack`, `_refreshQueuedOrderVisuals`, `_schedule`), a każda z nich rzuca wyjątek poza dozwolonym kontekstem.
3. **Test używa produkcji**: `run_case(.., ported)`, gdzie `ported` = `siege_manual_order_step`; wspinaczka przez
   `siege_tower_climb` (produkcja K3). Test wpięcia woła prawdziwe `perform_player_order` z `run.step.handled()` (≥ 1300).
4. **Bramki engine** (własny `CARGO_TARGET_DIR` w scratchpadzie, env z dispatchu, jeden build):
   - `cargo fmt --check`: EXIT 0
   - `cargo clippy --all-targets -- -D warnings`: EXIT 0
   - `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`): **TEST_EXIT=0**, 561 binarek, **4389 passed,
     0 failed, 1 ignored** (istniejący sprzed tematu). `p4_416_siege_manual_order` 6/6 ok. Liczby zgodne z Operatorem
     i Evaluatorem. Istniejące wektory (`vectors.json`, `speed_vectors`, `speed_change*`, `tower_due_order`,
     `move_order*`, `attack_order`): zielone, pliki bez zmian.
5. **Mutanty FC na pliku produkcyjnym** (inne niż P1–P22 Evaluatora; skrypt podmienia jedno wystąpienie, uruchamia
   `siege_manual_order_matches_pin_step_vectors`, przywraca plik; `git status` po rundzie pusty):
   F1 pomost sprawdzany po wspinaczce: ZABITY; F2 `ApproachSafe{stepped:true}` z bezpośrednim `done()`: ZABITY;
   F3 strzelec bezczynny bez `can_shoot`: ZABITY. 3/3.

## Orzeczenia zarzutów
| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| N1: wyniki `_rangedTargetInRange`/`_targetInRange`/`_siegeSafeApproach` z pinu, nie z portów; `fx` safeApproach tautologiczne | **ODDAL** (dla H3) | D-416-1 ogranicza zakres do decyzji `_performSiegeManualOrder`; kolejność, liczba i argumenty tych wywołań są porównywane z pinem. Złożenie z portami jest warunkiem wpięcia w H4 #417 (zapisane w obronie). Jawne NIE_ZMIERZONO. |
| N2: cienkie pokrycie (`dead` 2, `fadingOut` 1, `routed` 2, cel = pozycja tylko `attackMove`) | **ODDAL** | Mutanty produkcyjne P9/P21/P22/P10 zabite, więc każda podprzyczyna jest rozstrzygnięta przez co najmniej jeden przypadek. Sprawdzenie „cel = pozycja” w porcie i w pinie jest wspólne dla `attack`/`attackMove`. Rozbicie progów na podprzyczyny: zalecenie na H4. |
| N3: mutanty Operatora na kopii funkcji | **ODDAL** | Evaluator uzupełnił to 22 mutantami na produkcji (20 zabitych, P8/P12 równoważne; sprawdziłem uzasadnienia z tekstem pinu `:17621-17640` i `:8022-8053`, są poprawne), FC dodał 3 kolejne (3/3 zabite). Kryterium 3 spełnione na produkcji. |
| N4: `towerAtWallRows` porównywane tylko bez kroku marszu | **ODDAL** | Jawne NIE_ZMIERZONO; dalsze kroki `_siegeWalkTo` należą do K1b/K3; zgodne z D-416-3. |
| N5: dispatch twierdzi, że portu `_trySiegeTowerClimb` brak | **ODDAL** (dla kodu), notatka dla orkiestratora | Potwierdzone: `siege_tactics_tower.rs:399 pub fn siege_tower_climb` istnieje na `53e4188f2`. Decyzja Operatora, żeby go nie duplikować i dowieść wektorami (450/450 + 7 mutantów), jest poprawna (D-416-2). Korekta wpisu w rejestrze należy do orkiestratora. |

Brak zarzutów NAPRAW. Brak zarzutów DO DECYZJI CZŁOWIEKA (temat bez odstępstw od webu).

## Kryteria końca
1. Wszystkie gałęzie `_performSiegeManualOrder` zgodne z pinem na 1500 wektorach kroku: SPEŁNIONE.
2. `_trySiegeTowerClimb` zgodny z pinem, 450/450: SPEŁNIONE.
3. Mutanty ≥ 8: SPEŁNIONE (Operator 12+7 na kopii; Evaluator 22 na produkcji; FC 3 na produkcji).
4. Brak regresji istniejących wektorów i pełnego `cargo test`: SPEŁNIONE (4389/0/1).
5. Raport z liczbami, NIE_ZMIERZONO i mapą H4/T5: SPEŁNIONE (`01-operator-r1.md`).

## ZMIANY/COMMIT
Tylko ten raport (`03-final-control.md`), commit na `fc/416-r1` (rodzic `0ab850b6c`). Kod do integracji: `d6c56af0e`.

## TESTY
Jak w „Weryfikacja samodzielna” pkt 4–5. Target usunięty po bramkach; brak procesów cargo/node w tle; dysk 14 GB wolnego.
Client/renderer nie uruchamiane, bo ich pliki są nietknięte (D-416-4).

## BLOKADY
Brak.

## NIE_ZMIERZONO
- Złożenie H3 z portami `ranged_target_in_range` / `target_in_range` / `siege_safe_approach_goal` (warunek wpięcia H4 #417).
- Pełne marsze podfunkcji po pierwszym kroku i `towerAtWallRows` po marszu.
- Bitwy w czasie rzeczywistym z ręcznym rozkazem oblężniczym (poza zakresem, D-416-3).

## Uwagi dla orkiestratora (przy integracji)
- Skorygować wpis „brak portu `_trySiegeTowerClimb`” (N5) w `REJESTR-RUST.md`.
- Do dispatchu #417 dopisać: wektory liczące `_rangedTargetInRange` / `_targetInRange` / `_siegeSafeApproach` na portach
  Rust, bez tautologicznego `fx`; progi pokrycia `TargetGone` w rozbiciu na podprzyczyny; `_ensureGroupMeta` w wołającym.

## RUNDY
1/5.

## NASTĘPNY KROK
Integracja orkiestratora `d6c56af0e` (+ raporty) na `rust-port/parity-v2` z pełnym `cargo test` engine.

## DEPLOY/PUSH
NIE WYKONANO.
