STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SKIP-TO-RESULT-ABSURD-OUTCOME-Q1
GOAL: odpowiedz na zarzuty Evaluatora (PASS-WITH-NOTES, baza 491e21f01) — naprawa residuów i nagłówka testu, bez zmian kodu gry.
ZMIANY/COMMIT: gra/tools/battle-skip-equals-auto-resolve-test.cjs (allowlista testu). Commit: patrz sekcja SHA w raporcie orkiestratora.

ODPOWIEDZI NA ZARZUTY
1. Residua debugowania w teście (window.__trace, hak defineProperty na roundNo, window.__rtrace, window.__dbg, wypisy DBG/TRACE): PRZYJMUJĘ. Usunięte. Asercje bez zmian. grep po pliku (__trace|__dbg|__rtrace|DBG|TRACE|defineProperty) — 0 trafień.
2. Nagłówek nieaktualny (oblezenie-duze zamiast bitwa-duza) i domyślne WSKIP_SEEDS="7": PRZYJMUJĘ. Domyślnie WSKIP_SEEDS="1,2,3,7", WSKIP_PT domyślnie bitwa-duza. Nagłówek przepisany do stanu kodu; usunięta opisana w nagłówku „KONTROLA AUTO vs AUTO", której w kodzie nie ma (to był stary opis, nie zaimplementowany).
3. NIE_ZMIERZONO AUTO vs SKIP w oblężeniu (oblezenie-duze): PRZYJMUJĘ jako dług, bez zmiany kodu w tym temacie. Scena oblężenia nie kończy się silnikiem (AUTO po 150 s dopiero tura 40; SKIP kończy na sufitcie FF_MAX_ROUNDS=400 przez PAT po morale). Wpis do rejestru długów po stronie orkiestratora.

POMIARY (Chromium, /opt/pw-browsers/chromium, scena bitwa-duza, seedy Math.random seedowane):
- tsc --noEmit: NIE_ZMIERZONO w tej rundzie (kod gry nie zmieniany; zmiana tylko w tescie).
- git diff --check: czysto. node --check testu: OK.
- seedy 1,2 (WSKIP_NO_D=1): 22 ok / 0 fail (A, C, B0-B5). Wirtualny czas: seed1 auto=36576 ms (tura 12) / skip=36576 ms (tura 12); seed2 auto=36608 / skip=36576 ms (tura 12). Różnica 32 ms <= 200 ms (B5).
- seedy 3,7 (WSKIP_NO_D=1): 22 ok / 0 fail. seed3 auto=43840 (tura 15) / skip=43840 (tura 15); seed7 auto=25952 (tura 9) / skip=25936 (tura 9). Różnica 16 ms.
- część D (skip z trybu ręcznego w animacji), przebieg w pełnym uruchomieniu: D0, D1, D2, D3 PASS.
- Uwaga procesowa: pełny przebieg w jednym procesie (D + 4 seedy) nie mieści się w limicie 590 s narzędzia; przebieg podzielony na dwa wywołania (seedy 1,2 i 3,7 z WSKIP_NO_D=1) oraz część D z pełnego przebiegu. Wynik łączny: B4 SKIP == AUTO dla 4/4 seedów.

BLOKADY: brak
RUNDY: 4/5
NASTĘPNY KROK: Evaluator r4 (weryfikacja commitu z residuami usuniętymi i nagłówkiem), potem Obrona/Final Control.
DEPLOY/PUSH: NIE WYKONANO
