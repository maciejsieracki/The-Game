STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy i hooki civTest; logika gry bez zmian)
TEMAT: R-WEB-DIPLO-FORCED-PEACE-D2-HOOKS-Q1
GOAL: odpowiedź na zarzuty Evaluatora (kandydat 62cc6b136, ocena 09eaf6138): zmierzyć mutant S i mutant łączony A
BAZA/KANDYDAT: 62cc6b136fd65d0e603c4771585f075102025df0 (worktree detached, kod niezmieniony)
ZMIANY/COMMIT: brak zmian kodu gry i testów; commit zawiera tylko ten raport. Mutacje wykonane na kopii main.ts, przywracane z kopii, `cmp` OK.

ODPOWIEDZI NA ZARZUTY:
- Z1 (mutant S, pominięcie odtwarzania kolejki przy wczytaniu): PRZYJMUJĘ, ZMIERZONO. Mutacja `if (Array.isArray(savedPendingPeace))` -> `if (false && ...)` (main.ts:50633). Live: S FAIL „po wczytaniu pending wraca” {"n":0}, EXIT 1. Log: .../scratchpad/fpd2/live-mutS.log. Ta sama mutacja dała też FAIL w asercjach A; przyczyna kaskady stanu NIE ZMIERZONO.
- Z2 (mutant łączony A): PRZYJMUJĘ, ZMIERZONO. Mutacja: `deferForcedPeace => true` (main.ts:39403) plus usunięcie filtra „gracz stroną” (main.ts:39409). Live: pending = [1_4] (loser 4, winner 1); FAIL „pending gracza NIE zawiera pary AI<->AI”; FAIL „okno NIE otwiera się”; FAIL „pokój WYMUSZONY”; D2 PASS, S PASS; EXIT 1. Log: .../scratchpad/fpd2/live-mutA2.log. Deklaracja Operatora potwierdzona.
- Z3 (informacyjny, zasłanianie okna przez ekran powitalny): PRZYJMUJĘ do wiadomości; poza zakresem, decyzja orkiestratora.

TESTY (surowe wyjścia):
- tsc --noEmit: EXIT 0, 0 linii wyjścia.
- Live baseline 62cc6b136 (build Vite poza repo, civSeed=4242): D2 PASS, S PASS, A PASS, EXIT 0, zero pageerror.
- Mutant S: EXIT 1 (3 FAIL: S, A).
- Mutant łączony A: EXIT 1 (3 FAIL: A).
- Pozostałe bramki i testy nie powtarzane (brak zmian kodu); liczby z raportu Evaluatora, NIE ZMIERZONO przeze mnie.
- Niezmierzone: mutant S2 (setTimeout showNext) nadal przeżywa, zgodnie z deklaracją Operatora (ścieżka redundantna).

BLOKADY: brak
RUNDY: 3/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Do sprzątnięcia: gra/node_modules w worktree (npm ci --ignore-scripts); katalog .../scratchpad/fpd2 (build, build-mutS, build-mutA2, ev-*, logi, kopia main.orig.ts); /tmp/claude-0/fpd2-npmci.log, /tmp/claude-0/fpd2-tsc.log.
