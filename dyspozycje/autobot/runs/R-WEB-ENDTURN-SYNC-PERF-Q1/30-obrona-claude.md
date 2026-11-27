STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-SYNC-PERF-Q1
GOAL: Obrona kandydata 1865d4bdf (baza 6afdec814): odpowiedź na zarzuty 1–6 Evaluatora bc247f80 — koszt cyklu 500 ms, konsola, zawieszony activeEndTurnPointers, odwrotny przypadek aria/canEnd. Konfiguracja MAKSIMUM. Bez poprawki kodu gry (problemu nie odtworzono).
ZMIANY/COMMIT: allowlista: gra/tools/endturn-perf-probe.cjs (partia 1000 wywołań gateInfo, pomiar t1); dyspozycje/analizy/KONIEC-TURY-CYKL-WYDAJNOSC-2026-11-27.md (§8 odpowiedzi na zarzuty); dyspozycje/autobot/runs/R-WEB-ENDTURN-SYNC-PERF-Q1/30-obrona-claude.md (ten raport). gra/src, gra/data, WERSJE.md bez zmian. Commit: czubek gałęzi detached (sha w StructuredOutput).
TESTY:
- Pomiar live (Chromium headless, MAKSIMUM, checkpoint t1, probe z partią 1000):
  - seed 4242, t1: partia gateInfo() średnia 0,0042 ms (n=1000); pojedyncze n=200 mediana 0 / p95 0 / max 0,2 ms; canEnd=true; konsola 30 s (10 s + 20 s): warn 0, error 0, log 0; rAF 10 s mediana 550 ms / p95 800,1 (n=18); rAF 20 s mediana 516,6 / p95 683,3 (n=38).
  - seed 7, t1: partia gateInfo() średnia 0,0018 ms (n=1000); pojedyncze n=200 mediana 0 / p95 0 / max 0,2 ms; canEnd=true; konsola 30 s: warn 0, error 0, log 0; rAF 10 s mediana 500 ms / p95 683,3 (n=19); rAF 20 s mediana 533,4 / p95 783,4 (n=36).
  - Zakończenie: pgrep endturn-perf-probe = 0 po każdym biegu (browser.close w finally). Procesy chromium innych sesji nie były ruszane.
- Pomiar t30 i t60 (x2 ziarna): NIE ZMIERZONO — jeden bieg nie mieści się w limicie 590 s Bash, runner nie jest wznawialny, zakaz run_in_background.
- Liczba wywołań cyklu w 10 s: NIE ZMIERZONO live (bez hooka); z kodu setInterval 500 ms = 20 wywołań.
- Klatki vs build bazowy 32b3f1718: NIE ZMIERZONO (brak GPU; build bazowy nie budowany w tej rundzie).
- Zawieszony activeEndTurnPointers na prawdziwych zdarzeniach poza oknem: NIE ZMIERZONO live (CDP nie wysyła zdarzeń poza viewport; brak obserwowalnego hooka na zbiór). Analiza kodu w §8.1 analizy.
- Odwrotny przypadek (tabela live): NIE ZMIERZONO live; analiza kodu w §8.1 analizy (klik -> advanceSeat -> canPlayerInitiateEndTurn -> hintEndTurnBlocked).
- Bramki (wykonane w rundzie 1 na tym samym kodzie gra/src; ta runda nie zmienia gra/src, więc nie uruchamiano ich ponownie): tsc, logic 213, ai-test 297/0, endturn-aria-sync-test 5/0 — wyniki z rundy 1 i Evaluatora.
BLOKADY:
- t30/t60 i stan zablokowany (konsola) — wymagają osobnego tematu z wznawialnym runnerem (nie w tej rundzie).
- Niestabilność kliku t2->t3 w harnessie — nierozstrzygnięta.
- Brak trybu GPU do pomiaru klatek.
RUNDY: 2/5 (runda 1 Operatora: 10-operator-claude.md; ta obrona)
NASTĘPNY KROK: Evaluator/Final Control: ocena §8 analizy i zarzutów 1–6. Otwarte tematy: ENDPERF-T30 (runner wznawialny t30/t60 x2 ziarna), ENDPERF-BLOCK (stan zablokowany i konsola z licznikiem), ENDPERF-POINTER (live zawieszonego pointera, jeśli da się zdarzenie poza viewport), przegląd healStaleEndTurnBlockers() przy 2 Hz.
UWAGI-DLA-ORKIESTRATORA:
- Zarzut 6: częstotliwość wywołań healStaleEndTurnBlockers() jest nowa (2 Hz), ścieżka nie — opisane w §8.1 analizy.
- Bramki gra/src nie były ponownie uruchamiane, bo ta runda nie zmienia gra/src.
DEPLOY/PUSH: NIE WYKONANO
