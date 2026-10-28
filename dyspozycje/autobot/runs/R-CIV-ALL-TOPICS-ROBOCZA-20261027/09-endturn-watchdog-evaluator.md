# R-CIV-ALL-TOPICS-ROBOCZA-20261027 — Evaluator: watchdog końca tury

STATUS: **PASS-WITH-NOTES**
ROLA: niezależny Evaluator poprawki watchdogu, niezależny readback bieżącego diffu.
BAZA: branch `integration/robocza-all-topics-20261027`, bazowy HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
ZAKRES: wyłącznie marker aktywnego asynchronicznego potoku EOT i jego wpływ na pasywne `healStaleEndTurnBlockers()`.

## Werdykt

Poprawka adresuje potwierdzony błąd. `activeWorldEndTurnPipeline` jest ustawiany synchronicznie przed startem asynchronicznego `endActiveHumanTurn` i czyszczony w jego `finally` ([main.ts](/workspace/all-topics-candidate/gra/src/main.ts:37822), [main.ts](/workspace/all-topics-candidate/gra/src/main.ts:37944)). Pasywne czyszczenie AI-resume, flag EOT, nakładki oraz próg wymuszonego czyszczenia po 8 s jest teraz pomijane, gdy potok świata nadal działa ([main.ts](/workspace/all-topics-candidate/gra/src/main.ts:32569)). Po zakończeniu potoku orphan/stale cleanup nadal działa.

Kod kolejki bitew nie został zmieniony przez ten fix: warunki planowania flushu, zachowanie FIFO oraz reguły dla aktywnej bitwy/modalu pozostały jak w bazie. Testowe scenariusze B–H pokrywają flush-first, kolejkę, modal, żywą scenę, watchdog i wznowienie po bitwie.

## Niezależna walidacja

Uruchomiłem ponownie:

- `node tools/endturn-battle-deadlock-exec-test.cjs` — **49 PASS / 0 FAIL**. Nowy scenariusz I wykonuje rzeczywistą funkcję healera dwukrotnie z aktywnym markerem, flagami AI, nakładką oraz wiekiem ponad 9 s; stany pozostają. Po wyłączeniu markera potwierdza czyszczenie starej blokady i samotnej nakładki ([test](/workspace/all-topics-candidate/gra/tools/endturn-battle-deadlock-exec-test.cjs:509)).
- `node tools/koniec-tury-g1-g2-runda4-test.cjs` — **41 PASS / 0 FAIL**; asercje A10b sprawdzają wykonawczy warunek healera, ustawienie markera przed async EOT i reset w `finally` ([test](/workspace/all-topics-candidate/gra/tools/koniec-tury-g1-g2-runda4-test.cjs:150)).
- `node tools/load-game-blockers-exec-test.cjs` — **15 PASS / 0 FAIL**.
- `npm run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

## Uwagi i ograniczenia

Test scenariusza I wstrzykuje aktywny marker i wykonuje prawdziwy healer, a test A10b niezależnie sprawdza start/finally markerów w źródle. Nie jest to jednak przegląd pełnego, wielominutowego końca tury przez UI; stres-test dużych imperiów pozostaje oddzielną bramką i nadal ma udokumentowaną porażkę czasową (turn 40 przekroczył 60 s). Ten werdykt akceptuje wyłącznie naprawę watchdoga i **nie** uznaje gotowości całego kandydata do wydania.

NASTĘPNY KROK: Final Control exact diff po zakończeniu pozostałych zmian i rozstrzygnięciu bramki wydajności.
DEPLOY/PUSH: nie wykonano.
