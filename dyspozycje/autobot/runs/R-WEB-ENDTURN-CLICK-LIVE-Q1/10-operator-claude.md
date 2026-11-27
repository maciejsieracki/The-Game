STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-CLICK-LIVE-Q1 (ENDCLICK)
GOAL: Rozstrzygnąć na żywo, czy klik „Zakończ turę” w turach 2–8 działa (artefakt harnessu czy błąd gry), oraz zmierzyć konsolę PRZED/PO FALI 934 (ENDQUIET) w stanach (a) i (b). Maksimum ustawień.
ZMIANY/COMMIT: brak zmian w gra/src (artefakt harnessu, nie błąd gry). Dodane: gra/tools/endturn-click-live.cjs (narzędzie pomiaru), dyspozycje/analizy/KONIEC-TURY-KLIK-NA-ZYWO-2026-11-27.md, dane JSON i readback ustawień w dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/. SHA: patrz commit na gałęzi roboczej (sha w polu zwrotnym).
TESTY:
- Klik t2–t8, ziarna 4242 i 7: 14/14 tur zmieniło numer tury. Pierwszy klik wystarczył w 12 przypadkach (czas do zmiany 1,99–3,97 s). Dwa przypadki wymagały drugiego kliku po 20 s: s4242 t7 (27,3 s), s7 t6 (24,8 s). Logi: pierwszy klik trafił w ogon tury (endTurnInProgress), bez START; bramka odrzuciła klik poprawnie.
- Konsola (okna 30 s), seed 4242: (a) przed założeniem miasta PRZED 38 wpisów [EndTurn] (37 blocked awaitingFirstPlayerCity) → PO 0 wpisów [EndTurn] (1 WebGL). (b) po kliku t2 PRZED 17 (14 blocked endTurnInProgress) → PO 4 (START, DONE, 1 blocked z kliku). (b) po kliku t3 PRZED 16 (14 blocked) → PO 4 (START, DONE, 1–2 blocked z kliku). Seed 7 PO (a) 1, (b) 3 w t2 i t3.
- Sanity: node tools/endturn-quiet-test.cjs: 10 pass, 0 fail.
- NIE URUCHOMIONO: tsc, logic, tech-tree, research, unit-replace, combat, ai-test, society-breakdown, ai-city-order-need-wiring, endturn-aria-sync (brak zmian w gra/src, więc pkt 3 nie był potrzebny).
BLOKADY: brak. Nie wykonano: (c) bramka NNS (podatek 100%, zakup obrońcy klikiem w t5), odczyt aria w 20-s przerwie, odczyt ustawień z ekranu gry, tury 30 i 60.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator decyduje o (c) i o zmierzeniu aria-disabled w przerwie kliku (inferencja z logów to dotąd jedyne źródło). Patrz UWAGI-DLA-ORKIESTRATORA.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Hak __nnsMeasureDebug.gateInfo() NIE jest odczytem bez skutków: woła canPlayerInitiateEndTurn() (loguje console.warn w blokadzie) oraz healStaleEndTurnBlockers() (może zmienić stan). Pierwszy bieg odpytujący go co 500 ms zaśmiecał konsolę i został odrzucony. Warto zastąpić go czystym odczytem w kolejnych tematach.
2. Mechanizm 20-sekundowego opóźnienia w dwóch przypadkach: klik wykonany w ogonie poprzedniej tury (endTurnInProgress) jest odrzucany, a gra nie ponawia kliku automatycznie. Po zakończeniu ogona przycisk był aktywny (wniosek z kolejności logów; aria NIE ZMIERZONO w przerwie). Jeśli to ma być zachowanie gracza, to może wymagać decyzji o UX (czy klik w ogonie ma być ponawiany lub przycisk ma czekać), a nie poprawki błędu. Decyzja należy do właściciela, jeśli zmienia odczucie gracza.
3. Chromium SIGSEGV: jeden przebieg PRZED (s4242) padł przy tury 3 (Target closed); powtórka zakończyła się OK. Zgodnie z dispatchem ponowiono.
4. Procesy: po zakończeniu nie pozostały moje procesy Chromium. Widoczne w ps chrome należą do innych tematów (aiempty-bisect, grace15fx) i nie zostały zabite.
5. Ustawienia: buildingCostPace=niski i ruchSwiataPace=krotki zostały z sondy ENDPERF; w dispatchu nie są wymienione jako maksimum. Do potwierdzenia przez orkiestratora.
