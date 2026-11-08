STATUS: INTEGRATED-LOCALLY-WITH-NOTES
DOMAIN: GAME / BOUNDED ACTIVATION
TEMAT: R-PR141-CODEX-G1-ACTIVATION-20261018
DATA: 2026-10-18
GOAL: Zmaterializować lokalną decyzję root o przyjęciu dokładnego bounded scope G1 activation po Final Control r3; bez product/world acceptance, commita ani publikacji.

## Decyzja integracyjna

Root przeczytał aktualne diffy G1 ranged/Order growth i finalne evidence/source proof; przyjmuje lokalnie dokładnie bounded scope opisany w dispatchu i finalnym FC. Ten wpis jest zapisem decyzji root, a nie samodzielną ponowną akceptacją przez Operatora. Punktem końcowym jest `10-final-control-runda3.md` (PASS-WITH-NOTES); wcześniejsze FC i historyczne findings pozostają niezmienione.

Zakres obejmuje sześć holdowanych pól G1 oraz poprawkę per-stat precedence dla `rangedAtk` w rzeczywistym legacy parser route. Werdykt r3 domyka finding 4: maska `replacedStats.has('rangedAtk')` powoduje zastąpienie wyłącznie pokrywającego ranged efektu, w tym przez zero, a niezależny melee `atk` pozostaje. G1 `walka_dystans_lukownicy` nadal oznacza `missileAttack`, nie zasięg. Zachowano warunki, rozdział statów i jednokrotne canonical/fallback maxHP z wcześniejszych dowodów.

## Zachowane evidence i historia

Runda 3: target G1 PASS; `civ-bonusy-test.cjs` 54/0 PASS; `git diff --check` PASS. `tsc --noEmit` PASS i `combat-test.cjs` 6/6 pochodzą z wcześniejszej rundy; FC r3 ich nie powtarza. FC sam nie uruchamiał testów. R3 naprawia wyłącznie wykryty ranged composition gap i nie nadpisuje 02–09 ani wcześniejszych FAIL/objections. Pełne źródło ograniczeń i historyczny obieg pozostają w `10-final-control-runda3.md`.

## Granice

To lokalna integracja dokładnego scope G1; nie jest akceptacją świata, pełnego runtime/PR141, produktu 93×15 ani READY_FOR_DEPLOY. Nie wykonano commit, push, merge, deploy ani publikacji. Zachowano osobne bramki pełnego runtime i publikacji.
