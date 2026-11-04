STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ARMY-TO-NEAREST-LEADER-Q1
GOAL: Jednostki zbierane do wodza idą do najbliższego dostępnego wodza (odległość = długość realnej trasy).
ZMIANY/COMMIT: oceniany SHA abcfc0a52 (baza f54fb5c18; operator 97e5081da, obrona fe60b40a5 + abcfc0a52). Allowlista czysta: ai.ts, army-concentration.ts, main.ts, nowy army-to-nearest-leader-test.cjs, wzorzec mutacji w ai-march-avoid-foreign-territory-test.cjs, runs/**. Zero zmian w WERSJE.md, gra-robocza, rust-port.
TESTY (własne, abcfc0a52): tsc --noEmit EXIT=0; army-to-nearest-leader-test.cjs 43 PASS / 0 FAIL, EXIT=0; log RED bazy r2: 3 PASS / 12 FAIL, B2a i B2b FAIL na bazie. git diff --check: tylko trailing whitespace w logu gate-*-RED-baza.txt (nieszkodliwe).
WERDYKT ZARZUTÓW:
1 B2 nie-RED: ODDAL (B2a/B2b RED na bazie, mutacja linia-prosta łamie test).
2 brak testu ścieżki gracza: ODDAL (logika wyniesiona do army-concentration.ts, sekcja F 12 asercji; przycisk/callback tylko statycznie E3/E4, przeglądarka NIE_ZMIERZONO - jawna uwaga).
3 filtr hp: ODDAL (collectLeaderCandidates: dead/removed/routed/hp/owner, mutacje łamią).
4 siatka regresji ślepa: ODDAL (istniejący dług ~25 plików, poza allowlistą; PRZED=PO, nowych regresji 0).
5 koszt wydajności: ODDAL (AI 0.22 ms/turę, stres 3.7 ms; UI gracza NIE_ZMIERZONO).
6 onExpedition w ai.ts: ODDAL (etapy recruiting/gathering nie mają wodza w marszu na cel; reguła w pickerze A7/A8 i ścieżce gracza).
Przegląd kodu: przycinanie po linii prostej w bestByPath poprawne (trasa >= odległość heksowa, remisy do końca); marchPathFor zachowuje zachowanie firstStep.
UWAGI otwarte (nie blokują): przeglądarka dla main.ts NIE_ZMIERZONO; martwa siatka regresji kampanii/wodza; wydajność UI niezmierzona.
BLOKADY: brak
RUNDY: 1/5 (obrona po r1)
NASTĘPNY KROK: integracja orkiestratora; przed READY_FOR_DEPLOY zalecana weryfikacja w przeglądarce. Kolejność: najpierw main (po CONCENTRATION-REPLACEMENT i MOVE-FULL-RANGE/MARCH-AVOID, ten sam obszar ai.ts), parity-v2 później - ai.ts/main.ts/army-concentration.ts różnią się tam od bazy, więc przeniesienie do parity-v2 po integracji w main i rozstrzygnięcie konfliktów wtedy.
DEPLOY/PUSH: NIE WYKONANO
