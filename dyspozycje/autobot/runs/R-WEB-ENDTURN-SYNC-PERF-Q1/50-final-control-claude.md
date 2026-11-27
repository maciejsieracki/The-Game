STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-SYNC-PERF-Q1
GOAL: Zweryfikować cykl synchronizacji przycisku „Zakończ turę” (FALA 933): koszt, konsola, activeEndTurnPointers, odwrotny przypadek aria/canEnd.
ZMIANY/COMMIT: kandydat 3a4d0e7a032432c04beb9dfd465c70bb69d822e0 (baza 6afdec814356dc8ca1ebd409bf5cec31d84eafb7 jest jego przodkiem: merge-base --is-ancestor = OK). git diff --stat: 4 pliki, +407 (gra/tools/endturn-perf-probe.cjs, dyspozycje/analizy/KONIEC-TURY-CYKL-WYDAJNOSC-2026-11-27.md, runs/.../10-operator-claude.md, runs/.../30-obrona-claude.md). Zmian w gra/src: 0. Allowlista zachowana. gpgsig obecny w commicie kandydata (lokalnie %G?=N z braku allowedSignersFile, nie błąd podpisu).
TESTY (własne, na kandydacie, npm ci --ignore-scripts): tsc --noEmit exit 0; logic-test: LOGIC OK (213/213); ai-test: 297 passed, 0 failed; endturn-aria-sync-test: 5 PASS / 0 FAIL. Pozostałe bramki ze zmiany gra/src (tech-tree, research, combat, society-breakdown, ai-city-order-need-wiring) nie dotyczą: gra/src niezmieniony. Pomiaru na żywo nie powtarzałem (brak GPU, ~2 klatki/s, limit 590 s) — opieram się na liczbach z dokumentu §8 i weryfikuję tezy wobec kodu.

OCENA ZARZUTÓW (bez etykiet ról):
1 (t30/t60 niezmierzone): ODDAĆ jako uwagę. Dispatch żądał tabeli t1/t30/t60; wykonano t1 x 2 ziarna. Niedostatek realny, ale ograniczenie infrastrukturalne (runner niewznawialny w limicie 590 s) i jawnie oznaczone NIE ZMIERZONO. Pomiar t1 daje górne ograniczenie ~0,004 ms/wywołanie; skalowanie do t30/t60 niezmierzone. Osobny temat z wznawialnym runnerem (ENDPERF-T30).
2 (gateInfo zamiast samej funkcji; rozdzielczość): ODDAĆ — obrona naprawiła: partia 1000 wywołań (0,0042 ms i 0,0018 ms), poprawnie opisana jako górne ograniczenie obejmujące nnsGateForPlayer. Wniosek o koszcie w t1 uczciwy.
3 (licznik wywołań, porównanie z 32b3f1718): ODDAĆ jako NIE ZMIERZONO. Interwał 500 ms potwierdzony w kodzie (bottomBarHud.ts l.362). Wpływu na klatki nie wolno wnioskować; dokument tego nie czyni.
4 (punkty 3 i 4 dispatchu): ODDAĆ jako uwagę, częściowo. Analiza kodu spójna: activeEndTurnPointers (l.190, 198, 320, 331, 340-344) czyszczony na pointerup/pointercancel, więc samonaprawia się; bramka kliku w advanceSeat/canPlayerInitiateEndTurn jest niezależna od aria. Live NIE ZMIERZONO, dokument to deklaruje. Stan zablokowany + konsola (10 console.warn przy 2 Hz) pozostaje niezmierzony — realne ryzyko spamu, bez dowodu.
5 (niestabilność kliku t2->t3): ODDAĆ jako uwagę, nierozstrzygnięte. To nie jest dowód błędu gry, ale nie wykluczono ścieżki „przycisk włączony, klik bez efektu”. Najpoważniejsza luka; osobny temat (diagnoza harnessu vs gra, ≤3 ponowienia kliku) PRZED uznaniem FALI 933 za w pełni zweryfikowaną.
6 (healStale jako nowe ryzyko): ODRZUCONY z dowodem — main.ts l.43375-43385 (komentarz N1) potwierdza wołanie z pętli renderu HUD przed FALĄ 933. Nowa jest częstotliwość (2 Hz), nie ścieżka; dokument §8.1 pkt 6 rozróżnia to poprawnie.

UZASADNIENIE: kandydat zmienia wyłącznie narzędzie pomiarowe i dokumentację; gra/src bez zmian, bramki zielone, dokument uczciwie oznacza NIE ZMIERZONO i nie stawia nieudowodnionych tez. Binarne kryterium dispatchu (pełna tabela t1/t30/t60 x 2 ziarna, tabela odwrotnego przypadku) NIE jest spełnione — stąd PASS-WITH-NOTES, nie PASS. Nie FAIL: problemu nie odtworzono, a brak pomiaru wynika z ograniczeń środowiska.
BLOKADY: brak blokad integracji. Niezmierzone: t30/t60, stan zablokowany + konsola, live aria/canEnd, live zawieszony pointer, niestabilny klik t2->t3, wpływ na klatki na GPU.
RUNDY: FC po rundzie 2/5.
UWAGI-DLA-ORKIESTRATORA: (a) ENDPERF-BLOCK (stan zablokowany: licznik console.warn w 30 s, tabela aria/canEnd/klik) priorytetowy; (b) ENDPERF-T30 wymaga wznawialnego runnera; (c) niestabilny klik t2->t3 — rozstrzygnąć, czy to błąd gry (priorytet 1 wg zasady 10); (d) gra/tools/endturn-perf-probe.cjs można zintegrować (narzędzie poza gra/src). Nie utworzono żadnych sesji/zadań.
NASTĘPNY KROK: integracja orkiestratora (dokumenty + narzędzie, bez deployu — gra/src bez zmian); rejestr; osobne tematy z UWAG.
DEPLOY/PUSH: NIE WYKONANO
