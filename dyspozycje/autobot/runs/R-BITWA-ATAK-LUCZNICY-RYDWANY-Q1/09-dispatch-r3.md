# Dispatch rundy 3 — diagnoza runtime łuczników i rydwanów

TEMAT: `R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1`
RUNDA: 3/5
DATA: 2026-10-29
DOMAIN: GAME
GOAL: Rozstrzygnąć, czy cztery czerwone przypadki macierzy odpowiadają błędowi produkcyjnej walki; jeśli tak, naprawić go w minimalnym zakresie i wykazać, że dystansowi strzelają/podchodzą, a konnica/rydwany wykonują legalną akcję w Ataku/Obronie/Szturmie.

## Wyzwalacz

Evaluator r2 niezależnie powtórzył 4/36 RED, lecz wykazał, że harness zastępuje `_doAttack` i nie odtwarza pełnego runtime. Obrona Operatora przyjęła zarzuty. Wznowienie tej samej sprawy zgodnie z tą obroną.

## Kryteria końca

1. Dla tych samych czterech RED wprowadzić trace: jednostka, doktryna, ranga, wybrany target i jego odległość/zasięg, wynik compact-line gate, wybrany ruch/strzał, `moveLeft`/`acted` przed i po.
2. Zweryfikować lifecycle fixture’u: reset pozycji/składu/amunicji/akcji i dokładną liczbę aktywacji. Rozstrzygnąć, czy brak strzału i pozostanie 1 heks poza zasięgiem to prawdziwa reguła produkcyjna, błąd fixture’u, czy świadomy limit czasu.
3. Mierzyć akcje przez produkcyjne metody bez podmiany `_doAttack` na recorder; obrażenia/zużycie amunicji i legalne ruchy mają być obserwowane. Jeśli to niemożliwe bez dużego nowego frameworka, zatrzymać się z precyzyjnym BLOCK i wskazać brakujący punkt integracji, bez zmiany heurystyk na ślepo.
4. Dopiero po potwierdzeniu defektu naprawić minimalny hunk w `battleScene.ts` i czerwieniejące wcześniej przypadki muszą przejść. Nie osłabiać ich asercji ani zwiększać liczby tur bez uzasadnienia kontraktem.
5. Realny Chromium aktywnej walki: co najmniej jedna jednostka dystansowa oddaje strzał i powoduje zmianę HP, konnica/rydwan wykonuje krok/atak, a Atak/Obrona/Szturm różnią się zgodnie z kontraktem; zapis screenshotu i konsola bez błędów.
6. Typecheck, macierz 36 przypadków, testy formacji/placement/doktryn i `git diff --check` przechodzą.

## Allowlista

`gra/src/battle/battleScene.ts` tylko po dowodzie root cause; `gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` albo nowy focused test oraz harness Chromium w `gra/tools/`; raporty/evidence tego ID. Nie dotykać mapy kampanii, strategicznego AI, morale, statystyk, formacji początkowej poza tematem ani trybu Auto/Ręczna. Bez merge/deploy/push w roli Operatora.

## Izolacja

Ten sam worktree `/tmp/autobot-battle-closeout`, branch `autobot/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1-r2`, baza czysta po checkpointcie r2 `07726e67`. Jeden Operator; sprawdź `git status --short`, nie przywracaj ani nie zmieniaj istniejących testów poza allowlistą.

Natywny Kanban nie jest dostępny. Nie fabrykuj karty/receipt. Dalsza praca jest bezpośrednio autoryzowana przez właściciela; blokadę procesu uwzględnić w Final Control.
