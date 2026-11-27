# R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1 — Obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1
GOAL: port `_performSiegeManualOrder` (pin `07d2fbd72`, `battleScene.ts:18435-18475`) jako czysta funkcja z decyzją
i `handled` zgodnym z pinem, wpięty w `perform_player_order` (`siege_manual_handled`) w zakresie testów;
`_trySiegeTowerClimb` (`:8056-8084`) zgodny z pinem na wektorach kroku.

## Oceniany stan / baza obrony
- Kod Operatora: `d6c56af0e` (bez zmian w tej obronie). Raport Evaluatora: `3fa0d90e2` (gałąź `eval/416-r1`).
- Obrona: gałąź `obrona/416-r1` = `3fa0d90e2` + ten plik (jedyna zmiana; tylko dokumentacja w katalogu runu).
- Żaden zarzut nie wymagał zmiany kodu H3. Kodu, wektorów ani testów nie zmieniałem, więc bramki Evaluatora
  (fmt/clippy/pełny test engine EXIT 0; 4389 passed / 0 failed / 1 ignored sprzed tematu; MD5 wektorów
  `614ddfdb45e073b508ada90727ce635c`) pozostają ważne dla `d6c56af0e`. Nie uruchamiałem ponownie cargo.

## Odpowiedzi na zarzuty

### N1 — wyniki `_rangedTargetInRange` / `_targetInRange` / `_siegeSafeApproach` z pinu, nie z portów — PRZYJMUJĘ (przeniesienie do H4 #417)
- Fakt potwierdzam: test używa kolejki `PinTargets` (`tests/p4_416_siege_manual_order.rs:311-350`), a porty istnieją
  (`siege_tactics_doctrine_target.rs:330 ranged_target_in_range`, `:368 target_in_range`,
  `siege_tactics_approach.rs:231 siege_safe_approach_goal`). Było to jawnie w moim NIE_ZMIERZONO 2
  (`01-operator-r1.md:100-101`).
- Uzasadnienie, że nie robię tego w H3: D-416-1 (zakres wyłącznie decyzja H3) i D-416-3 (budżet ≈ 3 h, wektory kroku).
  Złożenie wymaga pełnych scen `Combatant`/`TargetScene` po stronie Rust dla 1500 rozkazów i odtworzenia BFS
  `_siegeSafeApproach` z wykonaniem marszu — to jest wpięcie w ciało tury (H4/T5).
- Poprawka (dokumentacyjna): wpis warunku dla #417 — **H4 nie może wpiąć `siege_manual_order_step` w tryb ręczny gracza,
  dopóki wektory kroku nie liczą tych trzech wywołań na portach Rust** (`ranged_target_in_range`, `target_in_range`,
  `siege_safe_approach_goal`) na scenach #416 i nie porównają wyniku z pinem.
- Tautologię `fx` z `_siegeSafeApproach` też przyjmuję: to pole w śladzie portu pochodzi z `PinTargets`, więc jego
  porównanie nie jest dowodem. Dowodem dla tej gałęzi są: `(col,row)` przekazane do `safe_approach`, `stepped` i
  wynik `handled`/`done` (te pola pochodzą z decyzji portu). Usunięcie tautologicznego porównania przenoszę do H4 razem
  z wpięciem portów (wtedy `fx` przestaje być kopią).

### N2 — cienkie pokrycie kilku gałęzi — ODRZUCAM jako wymaganie dla H3 (zalecenie na H4 przyjmuję)
Dowody, że obecne wektory rozstrzygają te gałęzie:
- Mutanty na PRODUKCJI (raport Evaluatora): P9 (`routed`), P21 (`dead`), P22 (`fadingOut`), P10 (cel = pozycja bez
  `none`) — wszystkie ZABITE. Każda podprzyczyna `TargetGone` ma więc co najmniej jeden przypadek rozstrzygający.
- „Cel = pozycja” dla `attack`: w porcie (`player_order_siege_manual.rs:271-288`) i w pinie (`:18463-18470`) sprawdzenie
  `ru.q === tc && ru.r === tr` jest WSPÓLNE dla `attack` i `attackMove`; różni się wyłącznie źródło `(tc,tr)`.
  Źródło `(tc,tr)=(t.q,t.r)` dla `attack` jest pokryte przez 22 przypadki `ApproachSafe` (15 true / 7 false), gdzie
  `(col,row)` porównywane jest z pinem. Dla `attack` gałąź jest osiągalna tylko przy celu na polu jednostki, którego
  `_targetInRange` (`:18461`) nie zwróci — generator nie znajduje takiej sceny (cel na tym polu wpada w
  `ApproachStrike`); dorabianie sztucznej sceny nie wnosi nowej ścieżki kodu.
- Zalecenie przyjmuję na H4: progi pokrycia w teście rozbić na podprzyczyny (`dead`/`fadingOut`/`routed`/nieznany) przy
  rozszerzaniu wektorów pod wpięcie (razem z N1).

### N3 — mutanty Operatora na kopii funkcji — PRZYJMUJĘ (bez zmiany kodu)
- Fakt potwierdzam: M1–M12 / W1–W7 działają na kopii w pliku testu; M0 dowodzi tylko kopia = wektory.
- Uzupełnienie wykonał Evaluator: 22 mutanty na `player_order_siege_manual.rs`, 20 zabitych, 2 równoważne. Analizę
  równoważności przyjmuję:
  - P8: `_isUnitDoctrineAuto` (pin `:17621-17630`) zwraca `false` dla `manual` z tej samej
    `_getEffectiveDoctrine(ru)`, więc człon `doctrine !== 'manual'` w `:18444` jest martwy już w pinie.
  - P12: `_performSiegeManualOrder` woła `_siegeRamTowerStep` (`:8022-8053`) tylko po spełnieniu tych samych warunków
    co jego bramka, więc `RamTower{handled:false}` jest nieosiągalny.
- Kryterium 3 jest spełnione na kodzie produkcyjnym. Zalecenie procesowe (mutować plik produkcyjny) przyjmuję na
  kolejne tematy.

### N4 — `towerAtWallRows` porównywane tylko bez kroku marszu — PRZYJMUJĘ jako jawne NIE_ZMIERZONO (bez zmiany)
Już w moim NIE_ZMIERZONO 1 (`01-operator-r1.md:97-99`). Dalsze kroki `_siegeWalkTo` są pokryte wektorami K1b/K3.
Evaluator uznał to za akceptowalne w D-416-3. Bez zmian.

### N5 — dispatch błędnie twierdzi, że portu `_trySiegeTowerClimb` brak — PRZYJMUJĘ (do korekty przez orkiestratora)
Potwierdzone: `siege_tactics_tower.rs:399 pub fn siege_tower_climb` istnieje na `53e4188f2`. Moja korekta D-416-OP1
(nie duplikować portu, dowieść go wektorami kroku: 450/450 wspinaczek) jest właściwa. Zmiana wpisu w
`REJESTR-RUST.md` należy do orkiestratora przy integracji (Operator nie edytuje rejestrów).

### Bramki (punkt 6 zarzutów)
Bez sporu. Wyniki Evaluatora przyjmuję; kod się nie zmienił, więc bramek nie powtarzałem.

## ZMIANY/COMMIT
Tylko `dyspozycje/autobot/runs/R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1/02a-obrona.md` (commit na
`obrona/416-r1`, rodzic `3fa0d90e2`). Kod do Final Control: `d6c56af0e` (bez zmian).

## TESTY
Nie uruchamiane w obronie (brak zmian kodu). Ważne: wyniki Evaluatora dla `d6c56af0e` (fmt/clippy EXIT 0; pełny test
engine EXIT 0, 561 binarek, 4389 passed, 0 failed, 1 ignored sprzed tematu; `p4_416_siege_manual_order` 6/6).

## BLOKADY
Brak.

## NIE_ZMIERZONO (po obronie)
1. Złożenie H3 z portami `ranged_target_in_range` / `target_in_range` / `siege_safe_approach_goal` (N1) — warunek
   wpięcia w H4 #417.
2. Pełne marsze po pierwszym kroku i `towerAtWallRows` po marszu (N4).
3. Bitwy w czasie rzeczywistym (poza zakresem, D-416-3).

## Przeniesione do H4/T5 (#417)
- Wektory kroku liczące `_rangedTargetInRange` / `_targetInRange` / `_siegeSafeApproach` na portach Rust (N1), bez
  tautologicznego `fx`.
- Progi pokrycia z rozbiciem `TargetGone` na podprzyczyny (N2).
- Skutek uboczny `_ensureGroupMeta` w wołającym (NIE_ZMIERZONO 3 Operatora).

## RUNDY
1/5.

## NASTĘPNY KROK
Final Control na kodzie `d6c56af0e` (raport `03-final-control.md`).

## DEPLOY/PUSH
NIE WYKONANO.
