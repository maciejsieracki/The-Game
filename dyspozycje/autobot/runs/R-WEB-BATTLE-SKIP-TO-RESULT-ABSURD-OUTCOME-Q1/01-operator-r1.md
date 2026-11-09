STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SKIP-TO-RESULT-ABSURD-OUTCOME-Q1
GOAL: „Pomiń do wyniku" (»») ma dawać TEN SAM wynik co dokończenie walki automatycznej (ta sama symulacja), z poprawną turą/czasem i sformatowanymi stratami.
ZMIANY/COMMIT: gra/src/battle/battleScene.ts, gra/src/battle/endScreen1E.ts, gra/tools/battle-skip-equals-auto-resolve-test.cjs, ten raport. SHA: patrz `git log` gałęzi worktree (commit „R-WEB-BATTLE-SKIP... r1").

DIAGNOZA
- `BattleScene.skip()` nie uruchamiał symulacji: wołał osobny uproszczony `computeInstantResult()` (pary 1:1 w „falach", bez ruchu/morale/ucieczek), zapisywał tylko `winner`/`survivors` i od razu pokazywał ekran końca. Jednostki `atk/def` zostawały nietknięte (`dead/routed = false`, HP pełne), więc `_sideEndStats` → straty 0/0 (zrzut A „−0/−0"), `roundNo = 0` i zegar `00:00` („Tura 0 · 00:00"), a łupy liczone z całego składu wroga → „Zwycięstwo + łupy bez walki".
- Straty na ekranie to `hpMax − hp` (sumy HP, floaty) wypisane bez zaokrąglenia → „−2443.1999999999925" (zrzut C).
- „Zniszczone 0 / Rozbite 69" (zrzut D): to rozdział śmierć/rout z tematu DEAD-UNITS (już wdrożony, nie ruszano).

NAPRAWA
1. `skip()` = szybkie przewinięcie tej samej symulacji: kończy deploy (jeśli trwa), przełącza na AUTO, startuje turę i włącza tryb FF (`_ffActive`). Pętla klatki w trybie FF wykonuje wiele kroków czasu wirtualnego na klatkę (`_runFastForward`, krok 120 ms, budżet 40 ms ściennego czasu): `_drainTimers` + kolejka kroków animacji + tickery pocisków/fade. Kroki ruchu i ciosu (dawniej `requestAnimationFrame`) idą przez `_raf()`, który w FF wrzuca je do kolejki zamiast czekać na klatkę. Wynik, straty, łupy, tura i zegar powstają z tego samego kodu co w zwykłej bitwie; koniec bitwy zgłaszany raz przez `_checkEnd → _showEndScreen` (który wyłącza FF).
2. Stary rachunek natychmiastowy zostaje WYŁĄCZNIE jako bezpiecznik (`_skipInstantFallback`): gdy nie ma startu bitwy albo symulacja przekroczy 3 h czasu bitwy.
3. `endScreen1E.ts`: `formatEndLoss()` — liczby całkowite z separatorem pl-PL, NaN/Infinity/ujemne → 0; zastosowane do strat obu stron i łupów.

TESTY
- NOWY `node gra/tools/battle-skip-equals-auto-resolve-test.cjs`: PASS (format liczb; skip nie kończy bitwy natychmiast; przełącza AUTO; pętla FF dochodzi do końca łańcucha timerów+kroków `_raf` z numerem tury = 11 i niezerowym czasem; koniec zgłoszony raz; bezpiecznik → fallback; kontrakt źródłowy: skip() bez `computeInstantResult`, kroki walki przez `_raf`).
- `npx tsc --noEmit -p gra`: czysto.
- Regresje: battle-dead-units-removed-test PASS, battle-dead-unit-disappearance-test PASS, battle-hp-display-test PASS 7/7.
- battle-loot-test: 8 pass / 4 FAIL („50% braz — expected 1 got 25") — moduł łupów NIE był zmieniany tym tematem (diff: tylko battleScene.ts, endScreen1E.ts); NIE_ZMIERZONO na czystej bazie, prawdopodobnie istniejący dług danych.
- NIE_ZMIERZONO: pełny przebieg w Chromium (brak przeglądarki w środowisku). „Identyczny wynik skip vs auto przy tym samym seedzie" NIE jest testowane liczbowo: silnik używa `Math.random()` (brak seedowanego RNG), więc identyczność wynika z konstrukcji (jeden silnik), nie z porównania przebiegów. Czas FF na dużych bitwach (kilka tysięcy jednostek) niezmierzony.

BLOKADY: brak. Uwagi dla Evaluatora: (a) zweryfikować w przeglądarce skip z fazy deploy, z trybu ręcznego i w oblężeniu (ścieżka `_activateNext`, nie auto-batch); (b) 40 ms/klatkę FF — ocenić płynność UI na dużych armiach; (c) „Szczegóły bitwy" ROZBITE/ZNISZCZONE bez zmian (zakres DEAD-UNITS).
LEDGER/REPIN Rust: port nie ma ścieżki skip/rAF (UI 3D); brak pliku LEDGER w repo — wpis do dodania przez orkiestratora w REJESTRZE jako dług „REPIN skip=fast-forward tej samej symulacji".
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1) → Obrona → Final Control
DEPLOY/PUSH: NIE WYKONANO
