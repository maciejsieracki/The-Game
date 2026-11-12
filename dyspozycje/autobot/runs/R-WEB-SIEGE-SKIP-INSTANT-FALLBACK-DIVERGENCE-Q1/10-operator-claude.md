# R-WEB-SIEGE-SKIP-INSTANT-FALLBACK-DIVERGENCE-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-SKIP-INSTANT-FALLBACK-DIVERGENCE-Q1
GOAL: zmierzyć, czy fallback _skipInstantFallback daje inne wyniki niż pętla SKIP/AUTO (parytet strat i zwycięzcy) w oblężeniu, i naprawić bez zmiany balansu, jeśli rozjazd jest realnym błędem; przy rozjeździe wynikającym z decyzji produktowej — DECISION_REQUIRED z liczbami.
BAZA: origin/main b0b0e3f86660561ee08630299cff64485443a176 (FALA 658). Worktree: wf_6c07e0da-2b5-1, detached.

## Ustalenia w kodzie (statyczne)

1. `skip()` (gra/src/battle/battleScene.ts ~3703-3725): gdy `deployPhase` = true, najpierw `_endDeployPhase()`. Ta metoda na końcu wywołuje `_startBattle()` (ok. linia 17568), które ustawia `started = true`. Dlatego w typowym przepływie (Pomiń w fazie rozstawiania albo w trakcie walki) `skip()` ZAWSZE idzie w przewijanie (`_ffActive`, `_runFastForward`, sufit `FF_MAX_ROUNDS`/`SIEGE_NO_BREACH_MAX_ROUNDS`), a nie w `_skipInstantFallback`.
2. `_skipInstantFallback()` (battleScene.ts ~3733) jest osiągalny TYLKO gdy `deployPhase` = false i `started` = false, czyli gdy bitwa nie wystartowała, a nie ma fazy rozstawiania. W kodzie nie znalazłem takiej ścieżki z UI: `_replayBattle` resetuje `started` synchronicznie (`_resetBattleRuntimeState`, ok. 10823) i nie ma między tym a startem miejsca na klik. Ta ścieżka jest więc praktycznie nieosiągalna przez interfejs. NIE_ZMIERZONO: nie sprawdzałem wszystkich wywołań UI poza `btnSkipTop` (3354) i `onSkip` (4151).
3. Fallback liczy wynik jednorazowo przez `computeInstantResult` (battleScene.ts ~20633): pary jednostek w falach, bez ruchu, bez przewijanej symulacji. Nie zmienia stanu jednostek (straty w stanie sceny pozostają 0), wynik jest tylko w `result`/logu.

## Pomiar (Chromium, ?playtest=oblezenie-duze, dt=16 ms, seed Math.random jak w teście, WSKIP_AUTO_SPEED_IDX=3)

Zmieniony test: gra/tools/battle-skip-siege-parity-live-test.cjs — dodany tryb `fallback` (ustawia `deployPhase=false`, `started=false`, potem `skip()`). Ten tryb wymusza ścieżkę awaryjną; nie jest to klik gracza.

| seed | SKIP (przewijanie, FF) | fallback (_skipInstantFallback) |
|---|---|---|
| 1 | zwycięzca obrońca, tura 400, PAT, czas wirt. 8 721 536 ms | zwycięzca ATAKUJĄCY, tura 0, log „Rundy: 14” |
| 2 | obrońca, tura 400, PAT, 8 677 120 ms | obrońca, tura 0, log „Rundy: 1” |
| 3 | obrońca, tura 400, PAT, 8 847 360 ms | obrońca, tura 0, log „Rundy: 1” |
| 7 | obrońca, tura 400, PAT, 8 830 080 ms | obrońca, tura 0, log „Rundy: 24” |

Straty w tabeli SKIP (z liczników sceny): seed 1 atk 26/39, def 11/28; seed 2 atk 26/39, def 8/28; seed 3 atk 26/39, def 11/28; seed 7 atk 25/39, def 12/28. Straty fallbacku w liczniku sceny wynoszą 0 (fallback nie aktualizuje jednostek), więc nie da się ich porównać tym samym odczytem; zostają tylko zwycięzca i log.

Surowe logi: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/w29-fb-1.log, w29-fb-2.log, w29-fb-3.log, w29-fb-7.log (tryb fallback i skip).

AUTO: NIE_ZMIERZONO. Przebieg AUTO przy 8x nie zmieścił się w limicie 280 s powłoki (proces ubity przed zapisem JSON; logi w .../scratchpad/w29-auto-1.log i w29-auto-2.log). Nie porównywałem AUTO z SKIP ani z fallbackiem.

## Wniosek

- Rozjazd jest REALNY w ścieżce `_skipInstantFallback`: zwycięzca różni się w 1 z 4 ziaren (seed 1), a w pozostałych fallback daje wynik po 1–24 turach zamiast przewijanej symulacji (400 tur, PAT). Struktura wyniku różni się w każdym ziarnie.
- Rozjazd NIE jest osiągalny w zwykłej grze (patrz ustalenie 2), więc nie ma dziś błędu widocznego dla gracza. Przekierowanie fallbacku na symulację zmieniłoby zachowanie tej ścieżki, a usunięcie jej to decyzja o architekturze — obie wymagają wyboru właściciela.
- ABC właściciela z pozycji #257 zostawił `_skipInstantFallback` „bez decyzji (osobno)”. Dlatego nie zmieniam kodu: to decyzja produktowa, a nie błąd do naprawy bez pytania.

## Pytanie ABC do właściciela (propozycja)

A) (rekomendowane) Ujednolicić: `skip()` przed startem uruchamia `_startBattle()` i przewijanie, a `_skipInstantFallback` usunąć lub zostawić wyłącznie jako martwy kod z testem. Efekt w grze dziś: brak (ścieżka nieosiągalna); jedna symulacja dla każdego wyniku Pomiń.
B) Zostawić fallback jako awaryjny rachunek i dopisać test, że jego wynik może różnić się od symulacji (dokumentacja rozjazdu, bez zmiany kodu).

## Kontrola

- Bramki: `node gra/tools/battle-skip-siege-parity-test.cjs` — RESULT pass=17 fail=0. `node --check` na zmienionym pliku testu — OK. `git diff --check` — OK.
- NIE_ZMIERZONO: battle-skip-equals-auto-resolve-test (limit 280 s, nie uruchomiony w tej rundzie), tsc --noEmit (brak zmian w src/), pełne 5 bramek.
- Konflikt z W26 (B4b, battleScene.ts): brak — battleScene.ts nie został zmieniony.
- Zmiana w worktree, NIEZACOMMITOWANA poza raportem: gra/tools/battle-skip-siege-parity-live-test.cjs (tryb `fallback`). Zgodnie z dispatchem commituję tylko ten raport; decyzja o włączeniu testu do integracji należy do orkiestratora.

## Blokady
- Decyzja właściciela (A/B powyżej). Bez niej nie ma poprawki.
- AUTO i pełne bramki nie zmierzone w tej rundzie (limit czasu powłoki).

RUNDY: 1/5
NASTĘPNY KROK: pytanie ABC do właściciela (A/B). Po wyborze A: osobny temat Operatora na battleScene.ts (skip przed startem → _startBattle + przewijanie) z testem parytetu i pomiarem AUTO/SKIP/fallback. Po wyborze B: dopisać test dokumentujący rozjazd.
DEPLOY/PUSH: NIE WYKONANO
