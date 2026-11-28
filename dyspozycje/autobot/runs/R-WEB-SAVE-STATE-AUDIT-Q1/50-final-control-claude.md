STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, zero zmian w grze)
TEMAT: R-WEB-SAVE-STATE-AUDIT-Q1
GOAL: Ustalić, które zmienne modułowe nie trafiają do zapisu i czy ich brak po wczytaniu zmienia decyzje AI/gracza.
ZMIANY/COMMIT: kandydat a599352e83e0615e69a0670dc2f2abbcc2c47df4; baza 1dbd21efcd829d34433f7f72c0b9ea81d3e79697 jest przodkiem (merge-base --is-ancestor: tak). git diff --stat bazy..kandydata: 7 plików, +835, wszystkie w allowliście (gra/tools/save-state-audit-*.cjs, dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md, runs/R-WEB-SAVE-STATE-AUDIT-Q1/**). git diff -- gra/src gra/data = puste.
TESTY (własne, po npm ci w gra/): tsc --noEmit exit 0; logic-test LOGIC OK (213/213); ai-test 297 passed, 0 failed. Skan uruchomiony z korzenia repo wg polecenia z dokumentu: wyjście identyczne z scan-output.txt (533 deklaracji, 384 niezapisywane; aiCmdResume w tabeli). Ablacja: wyjście identyczne z ablation-wonder-stuck-output.txt (licznik 12 -> próg 1,667; licznik 0 -> 1,000). Kod: aiWonderStuckTurnsByOwner brak w buildSaveGameSnapshot, clear w restore 53108; aiGarrisonUnitIdByOwner brak clear/zapisu — zgodne z dokumentem.
OCENA ZARZUTÓW (1-7): 1 naprawiony (ablacja wejścia progu; B≠A w grze jawnie NIE ZMIERZONO, dopuszczalne dla audytu bez harnessu); 2 naprawiony (5 kandydatów D? z werdyktami kodem, kryterium >=3 spełnione); 3 naprawiony (wszystkie inicjalizatory); 4 naprawiony (komentarze wykluczone); 5 naprawiony (reprodukcja 1:1 z korzenia repo); 6 poprawiony (gra/src/game/ai.ts:2743-2757); 7 naprawiony (bramki zmierzone).
BLOKADY: brak. NIE ZMIERZONO: wpływ B≠A w grze dla aiWonderStuckTurnsByOwner i aiGarrisonUnitIdByOwner; ręczna klasyfikacja 76 pozycji D?; playerStartHexByOwner i aiTurnAwaitingBattle nieprzebadane. Dispatch pkt 3 dopuszcza werdykt z kodu.
RUNDY: FC po rundzie obrony 2/5.
NASTĘPNY KROK: integracja orkiestratora (doc/narzędzia, bez deployu); osobne tematy: fix aiWonderStuckTurnsByOwner i aiGarrisonUnitIdByOwner (round-trip + mutacja + B≠A przy maksimum).
UWAGI-DLA-ORKIESTRATORA: 'w zapisie: tak' to wystąpienie nazwy w ciele funkcji (heurystyka, udokumentowana).
DEPLOY/PUSH: NIE WYKONANO
