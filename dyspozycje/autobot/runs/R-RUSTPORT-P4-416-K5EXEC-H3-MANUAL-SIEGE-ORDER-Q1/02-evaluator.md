# R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1 — Evaluator (adwersarialny) r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1
GOAL: port `_performSiegeManualOrder(ru, ord, done)` (pin `07d2fbd72`, `battleScene.ts:18435-18475`) jako czysta
funkcja z decyzją i wynikiem `handled` zgodnym z pinem, wpięty w `perform_player_order` (`siege_manual_handled`) w
zakresie testów; `_trySiegeTowerClimb` (`:8056-8084`) zgodny z pinem na wektorach kroku.

## Oceniany stan
- Gałąź Operatora `rust-port-wip/416-siege-manual-q1` = `d6c56af0e` (commity `a050a6bb4`, `9ba8e3fe5`, `d6c56af0e`).
- Baza: `git merge-base` z `origin/rust-port/parity-v2` = `53e4188f23510794e568d0b5d150be017669ef76` = BAZA z dispatchu.
- Ocena na gałęzi `eval/416-r1` (= `d6c56af0e` + ten raport), worktree `.claude/worktrees/wf_efffd3b1-392-2`.

## ZMIANY/COMMIT
Tylko ten raport (`02-evaluator.md`). Kod Operatora bez zmian (mutanty produkcyjne nakładane tymczasowo i cofane
skryptem; `git status --short` po rundzie pusty).

## Allowlista (sprawdzona `git diff --stat 53e4188f2...d6c56af0e`)
6 plików, wszystkie w allowliście:
`rust-port/engine/src/domain/player_order_siege_manual.rs` (nowy, 401 l.), `rust-port/engine/src/domain/mod.rs` (+1),
`rust-port/engine/tests/p4_416_siege_manual_order.rs` (nowy, 1043 l.), `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`
(+301, wyłącznie nowy blok `WIRING_A_SIEGE_MANUAL_STEPS`; `EXPECTED_SHA256` i inne tryby nietknięte),
`.../p6_k5loop_wiring_a_pin_vectors/siege_manual_order_step_vectors.json` (nowy), `01-operator-r1.md`.
Pliki spoza allowlisty: brak. `player_order_move.rs`: bez zmian (dopuszczalne — wpięcie przez istniejący argument).
Istniejące pliki wektorów: bez zmian. `gra/`, kontrakt mostu, klient, renderer: bez zmian.
`#[ignore]` dodane: 0 (`git diff | grep '^+.*#\[ignore'` = 0). Usunięte/osłabione asercje: 0 (`^-.*assert` = 0).
Commity: brak linii z nazwą modelu (tylko `Claude-Session:`).

## Najpierw web — zgodność portu z TEKSTEM pinu (przeczytane `git show 07d2fbd72:gra/src/battle/battleScene.ts`)
Porównanie linia po linii `:18435-18475` z `siege_manual_order_step`:
- `:18438` bramka (`siegeWallCol>=0`, `side==='atk'`, `type!=='move'`) — zgodna.
- `:18439-18442` maszyny: `(_isRam && !gateOpen) || isSiegeTower` → `_siegeRamTowerStep`, inna maszyna → `false` — zgodna.
- `:18443-18452` `doctrineAuto` i bezczynny strzelec (`canShoot && shootingEnabled!==false` → `_rangedTargetInRange`) — zgodna;
  `siege_manual_doctrine_auto` = ten sam wzór co gałąź `none` w `perform_player_order` (`player_order_move.rs:427-444`).
- `:18453-18457` pomost — zgodna; `:18458-18459` kolejność wspinaczka → piechota — zgodna.
- `:18460-18473` podejście ograniczone: `_targetInRange` → `_doAttack`; `attackMove` → `(col,row)`; `attack` → `find` po
  liście `_enemiesOf` (pin `:8291-8294` filtruje `!dead && !fadingOut && !routed`, port łączy oba filtry w jednym `find`
  — równoważne); brak celu → `none`+refresh+`done`; cel = pozycja → `none`+refresh+`done`; `!_siegeSafeApproach` → `done`,
  zawsze `return true` — zgodna.
- `:18474` `return false` — zgodna.
- `_trySiegeTowerClimb` `:8056-8084`: istniejący port `siege_tactics_tower.rs:399` (K3) porównany ręcznie — zgodny
  (bez `group.position`/`hpBarGroup` = render).

Korekta dispatchu przez Operatora (D-416-OP1) POTWIERDZONA: `git grep -n "fn .*climb" 53e4188f2 -- rust-port/engine/src`
zwraca m.in. `siege_tactics_tower.rs:399 pub fn siege_tower_climb` — stan „0 trafień” w dispatchu był błędny; decyzja
„nie duplikować portu, dowieść go nowymi wektorami kroku” jest prawidłowa (D-416-2: jawny raport).

## Wektory z TEKSTU pinu (odtworzone niezależnie)
`WIRING_A_SIEGE_MANUAL_STEPS=1 WIRING_A_OUT=<scratchpad> node p6_k5loop_wiring_a_gen.mjs` (10,1 s): strażnik SHA-256 OK,
MD5 regeneracji `614ddfdb45e073b508ada90727ce635c` = MD5 pliku w repo (deterministyczne, z tekstu pinu przez `git show`).
Generator woła `bs._performSiegeManualOrder` / `bs._trySiegeTowerClimb` pinu WPROST; podmienione wyłącznie metody
wykonawcze (`_doMove`, `_attackGate`, `_advanceToward`, `_doAttack`, `_refreshQueuedOrderVisuals`, `_schedule`) i
callbacki `done` — podfunkcje decyzyjne wykonują tekst pinu.

Niezależne liczenie pokrycia (mój skrypt na regenerowanym JSON, 1500 rozkazów):
`attack`→`none`: cel nieznany 16, martwy 2, `fadingOut` 1, `routed` 2; `attackMove` cel = pozycja 7;
`_siegeSafeApproach` true/false: `attack` 15/7, `attackMove` 22/5; strzelec bezczynny: strzał 15, brak celu 13;
`none` + `shootingEnabled=false` z amunicją bez wywołania `_rangedTargetInRange`: 12; `hold`: 110 (61 false, 49 true).
Kryterium 1 — wszystkie gałęzie z dispatchu obecne w wektorach (patrz NOTA N2 o grubości pokrycia).

## TESTY (odtworzone przeze mnie, `CARGO_TARGET_DIR` w scratchpadzie, env z dispatchu)
- `cargo fmt --check` (engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (engine): EXIT 0.
- `cargo test --all-targets --no-fail-fast` (engine, w tle): `TEST_EXIT=0`; 561 binarek, **4389 passed, 0 failed,
  1 ignored** (istniejący sprzed tematu). Zgodne z raportem Operatora co do liczb.
  `p4_416_siege_manual_order`: 6/6 ok (47,2 s). Istniejące testy wektorów (`vectors.json`, `speed_vectors`,
  `speed_change*`, `tower_due_order`, `move_order*`, `attack_order`) zielone — kryterium 4 spełnione.
- Client/renderer: nie uruchamiane — pliki nietknięte (D-416-4).
- Target usunięty po bramkach; brak procesów cargo/node w tle; dysk 14 GB wolnego po sprzątaniu.

## Mutanty — adwersarialnie na KODZIE PRODUKCYJNYM (nie na kopii z testu)
Mutanty Operatora (M1–M12, W1–W7) działają na KOPII funkcji w pliku testu; M0 dowodzi tylko, że kopia = wektory, nie
że kopia = produkcja. Dlatego nałożyłem 22 mutanty bezpośrednio na `player_order_siege_manual.rs` (skrypt
`python3 -I mut.py`, każdy: podmiana dokładnie jednego wystąpienia, `cargo test --test p4_416_siege_manual_order --
siege_manual_order_matches_pin_step_vectors siege_manual_handled_wires`, przywrócenie pliku):

| # | Mutacja w produkcji | Wynik |
|---|---|---|
| P1 | `!side_atk` → `side_atk` w bramce | ZABITY |
| P2 | `move` przepuszczony przez bramkę | ZABITY |
| P3 | taran także przy otwartej bramie | ZABITY |
| P4 | wieża nieobsługiwana (tylko taran) | ZABITY |
| P5 | pominięty `shootingEnabled` | ZABITY |
| P6 | brak gałęzi `onWallWalkway` | ZABITY |
| P7 | odwrócone `doctrineAuto` | ZABITY |
| P8 | `meta != Manual` → `true` w `siege_manual_doctrine_auto` | ŻYWY — RÓWNOWAŻNY (niżej) |
| P9 | `routed` nie filtrowany w `find` | ZABITY |
| P10 | cel = pozycja bez `none` | ZABITY |
| P11b | `ApproachSafe{stepped:false}` bez `done()` | ZABITY |
| P12 | `RamTower.handled()` zawsze `true` | ŻYWY — RÓWNOWAŻNY (niżej) |
| P13 | piechota-do-wieży przed wspinaczką | ZABITY |
| P14 | `attackMove` (col,row) zamienione | ZABITY |
| P15 | `clears_order` tylko dla `TargetGone` | ZABITY |
| P16 | `approach_restricted()` wołane przed `is_attack` (ślad) | ZABITY |
| P17 | brak warunku `siegeWallCol>=0` | ZABITY |
| P18 | pomost: `done` zamiast `_doAttack` | ZABITY |
| P19 | koniec funkcji zwraca `true` | ZABITY |
| P20 | strzelec bez celu zwraca `true` | ZABITY |
| P21 | `find` bez `!dead` | ZABITY |
| P22 | `find` bez `!fadingOut` | ZABITY |

(P11 w pierwszym podejściu dał błąd kompilacji mojego skryptu — powtórzony poprawnie jako P11b.)
Wynik: 20/22 zabitych, 2 równoważne z uzasadnieniem:
- **P8**: w pinie `_isUnitDoctrineAuto` (`:17621-17630`) zwraca `false`, gdy `_getEffectiveDoctrine(ru) === 'manual'`,
  a `_effectiveMetaForUnit(ru).doctrine` (`:17633-…`) = ta sama `_getEffectiveDoctrine(ru)` (efekt `_ensureGroupMeta`
  następuje po ocenie `_isUnitDoctrineAuto`). Człon `!== 'manual'` w `:18444` jest więc w pinie martwy; w Rust
  `is_unit_doctrine_auto` (`siege_tactics_doctrine_step.rs:63-69`) liczy to samo `effective_doctrine`. Równoważny.
- **P12**: `_siegeRamTowerStep` (`:8022-8053`) zwraca `false` tylko przy niespełnionej własnej bramce (mur, `atk`,
  `isSiegeUnit`) albo dla maszyny innej niż taran-przy-zamkniętej-bramie / wieża; `_performSiegeManualOrder` woła go
  wyłącznie po sprawdzeniu dokładnie tych warunków, więc `RamTower{handled:false}` jest nieosiągalne. Równoważny.

Kryterium 3 (≥ 8 mutantów zabitych lub równoważnych z uzasadnieniem) — spełnione z nadmiarem, także na produkcji.
Mutanty wspinaczki (W1–W7, kopia K3) przejrzane: porównują `ret`/pozycję/`onWallWalkway`/`moveLeft`/wyłom/długość logu;
test główny `siege_tower_climb_matches_pin_step_vectors` dodatkowo porównuje `done`, treść logu i `occByKey` na porcie
produkcyjnym (450/450).

## Zarzuty / NOTY (nie blokują)
- **N1 (składanie z istniejącymi portami nie zmierzone):** wyniki `_rangedTargetInRange`, `_targetInRange` i
  `_siegeSafeApproach` są w teście brane z pinu (kolejka `PinTargets`), mimo że dispatch wymienia je jako „gotowe klocki”
  (`siege_tactics_doctrine_target.rs:330/368` `ranged_target_in_range`/`target_in_range`, `siege_tactics_approach.rs:231`
  `siege_safe_approach_goal`). Dowodzona jest kolejność, liczba i argumenty wywołań oraz decyzja H3, ale nie zgodność
  tych trzech portów na scenach #416. Operator to jawnie wpisał (NIE_ZMIERZONO 2); przenieść do H4/#417 jako warunek
  wpięcia (wektory muszą wtedy liczyć te trzy na portach). Dodatkowo `fx` z `_siegeSafeApproach` jest w śladzie
  portu kopiowane z pinu — porównanie tego pola jest tautologiczne.
- **N2 (cienkie pokrycie kilku gałęzi):** `attack` z celem martwym 2, `fadingOut` 1, `routed` 2; gałąź „cel = pozycja”
  pokryta wyłącznie przez `attackMove` (7), dla `attack` 0 przypadków (generator stawia cel na polu jednostki, ale wtedy
  `_targetInRange` zwraca go wcześniej → `ApproachStrike`; w pinie ta gałąź dla `attack` jest praktycznie osiągalna
  tylko przy celu na tym samym polu i poza zasięgiem — mało realna). Mutanty P9/P21/P22/P10 i tak giną. Progi
  pokrycia w teście (`ApproachClear(TargetGone) >= 5` itd.) nie rozróżniają podprzyczyn — zalecenie na H4.
- **N3 (mutanty Operatora na kopii):** M0 nie wiąże kopii z produkcją; ten Evaluator uzupełnił to mutantami produkcyjnymi
  (wyżej). Zalecenie procesowe: kolejne tematy niech mutują plik produkcyjny (jak tutaj) albo udowodnią tożsamość kopii.
- **N4 (`towerAtWallRows` po wywołaniu):** porównywane tylko, gdy pin nie zrobił kroku marszu (stub `_doMove`); jawnie w
  NIE_ZMIERZONO 1 Operatora. Akceptowalne w zakresie D-416-3.
- **N5 (dispatch):** linia „brak portu `_trySiegeTowerClimb`” w dispatchu jest nieprawdziwa na `53e4188f2` — orkiestrator
  powinien skorygować wpis w rejestrze przy integracji.

## Zgodność z decyzjami dispatchu
D-416-1 (tylko H3, wpięcie w zakresie testów): spełnione — `siege_manual_handled_wires_into_perform_player_order`
na 1361 przypadkach (bez `move`) sprawdza `Hold`/`SiegeManual`/`Doctrine|NoneDone`/`Attack`.
D-416-2 (wzorzec = pin, rozbieżność jawnie): spełnione (korekta stanu dispatchu jawna).
D-416-3 (wektory kroku, bez bitew w czasie rzeczywistym): spełnione.
D-416-4 (bramki engine; client/renderer nietknięte): spełnione.

## BLOKADY
Brak.

## NIE_ZMIERZONO (Evaluator)
- Składanie H3 z portami `_rangedTargetInRange` / `_targetInRange` / `_siegeSafeApproach` (N1).
- Pełne marsze podfunkcji po pierwszym kroku (pokryte przez K1b/K3, nie przez #416).
- Bitwy w czasie rzeczywistym z ręcznym rozkazem oblężniczym (celowo poza zakresem, D-416-3).

## RUNDY
1/5 (Evaluator r1 po Operatorze r1).

## NASTĘPNY KROK
Obrona Operatora (`02a-obrona.md`) do not N1–N5 (żadna nie wymaga zmiany kodu w H3), potem Final Control
(`03-final-control.md`) na `d6c56af0e`.

## DEPLOY/PUSH
NIE WYKONANO.
