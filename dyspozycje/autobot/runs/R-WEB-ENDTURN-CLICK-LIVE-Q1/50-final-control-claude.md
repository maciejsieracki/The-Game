# R-WEB-ENDTURN-CLICK-LIVE-Q1 — Final Control

STATUS: BLOCK
DOMAIN: GAME (pomiar; zero zmian w gra/src)
TEMAT: R-WEB-ENDTURN-CLICK-LIVE-Q1
GOAL: klik Zakończ turę t2–t8 na żywo + konsola PRZED/PO (3 stany x 2 buildy), maksimum, ziarna 4242 i 7; rozstrzygnięcie artefakt / błąd gry.
ZMIANY/COMMIT: kandydat 018bc964b; potomek 3b23b2d4f (merge-base --is-ancestor: TAK). git diff --stat 3b23b2d4f..018bc964b: 16 plików, +10030, wszystkie w gra/tools/endturn-click-live.cjs, dyspozycje/analizy/..., dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/**. Pusty diff dla gra/src i gra/data. Allowlista zachowana.
TESTY (własne, FC): node --check endturn-click-live.cjs OK; endturn-quiet-test 10 pass / 0 fail; re-odczyt 4 plików dane-ENDCLICK-*-bez-konsoli.json: każda tura t2–t8 attempts=1, result=tura_zmieniona, czasy 5,6–20,0 s; s4242 t7 = PORAZKA_GRACZA_EKRAN_LOSE (oba buildy), s7 t2–t8 wszystkie OK. Zgodne z dokumentem. tsc/logic/ai-test/pozostałe bramki referencyjne NIE uruchomione: gra/src bez zmian względem bazy, brak node_modules w worktree (NIE ZMIERZONO przez FC, bez znaczenia dla treści diffu).

## Ocena zarzutów Evaluatora i odpowiedzi obrony
1. Brak stanu (c) NNS — ZASADNY, nienaprawiony (obrona przyznaje NIE ZMIERZONO). Kryterium binarne dispatchu (3 stany x 2 buildy) niespełnione. NAPRAW.
2. Brak PRE s7 — naprawione (dane-ENDCLICK-pre-s7-*). ODDAL.
3. Wniosek „artefakt” dla 2 kliknięć — naprawiony protokołem (klik tylko przy aria=false i endTurnInProgress=false; w 8 przebiegach 0 drugich klików). Dwa przypadki z r1 pozostają wnioskiem, nie pomiarem; obrona to uczciwie zapisała. ODDAL (uwaga).
4. gateInfo w pętli — usunięte z pętli (tylko gałąź diagnostyczna, niewywołana). canEnd niemierzony. ODDAL.
5. Anomalia ENDPERF — poprawnie oznaczona NIE ODTWORZONO, bez zamknięcia jako artefakt; brak A/B (hipoteza o gateInfo). ODDAL (uwaga), temat otwarty.
6. Maksimum — częściowo: koszty budynków Wysoki x4 i zasięg Długi x6 poprawione; rozmiar mapy Maly, rywale 2, prędkość Normalna, limit miast 10 NIE zweryfikowane jako maksimum, wbrew stałej zasadzie testowania (2026-11-26). Readback to wejście skryptu, nie odczyt UI. NAPRAW albo jawna decyzja orkiestratora o akceptacji.
7. n — klik n=2/komórkę, konsola n=1/komórkę. Akceptowalne dla pomiaru różnicy rzędu 20x (PRE 43–50 vs CUR 1–2 w oknie 30 s), niewystarczające dla wniosków o rzadkiej anomalii. ODDAL (uwaga).

## Wynik merytoryczny (to, co jest zmierzone)
- Przypadek (ii) (klik nie działa mimo aktywnego przycisku): NIE STWIERDZONO w 8 przebiegach (4 CUR, 4 PRE). Brak podstaw do poprawki gry.
- ENDQUIET potwierdzony na żywo dla stanów (a) i (b): CUR bez wpisów `[EndTurn] blocked` (0), PRE 43–50 w 30 s (a), 11–20 w (b).
- Stan (c): NIE ZMIERZONO.

BLOKADY: (1) brak stanu (c) NNS w tabeli PRZED/PO; (2) maksimum mapy/rywali/prędkości/limitu miast niezweryfikowane.
RUNDY: 2/5 (obrona) + FC; to werdykt FC rundy 2.
NASTĘPNY KROK: runda 3 do TEGO SAMEGO ID: dodać do harnessu ścieżkę stanu (c) (suwak podatku 100% Pieniądze, zakup obrońcy klikiem w t5, okno konsoli w t6–7; wzór tools/realdef-max-gaps.cjs p3/p4) dla PRE i CUR; ustalić maksimum mapy/rywali/prędkości z newGameFlow.ts. Alternatywa: orkiestrator świadomie akceptuje (c) jako osobny temat R-WEB-ENDTURN-NNS-CONSOLE i zawęża kryterium dispatchu; wtedy wyniki (a)/(b)/klik mogą być uznane jako PASS-WITH-NOTES.
UWAGI-DLA-ORKIESTRATORA: przy maksimum pasywny gracz ginie w t7 na ziarnie 4242 (zmienia założenie „pasywnego gracza”); dane i dokument spójne i uczciwe w oznaczeniach NIE ZMIERZONO.
DEPLOY/PUSH: NIE WYKONANO
