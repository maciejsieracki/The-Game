STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-SIEGE-WITHOUT-WAR-Q1
GOAL: Oblezenie i szturm miasta tylko w stanie wojny; koniec wojny zdejmuje oblezenie (tez w starych zapisach).

OBRONA r1 (baza: 1d72005897):
- Nota 2 (brak testu behawioralnego main.ts): PRZYJMUJE. Do ai-siege-requires-war-test.cjs dodano sekcje [main.ts behavior]: PRAWDZIWE validateActiveSieges/endMapSiege/areEnemyOwners wyciete tekstowo z main.ts + prawdziwa bramka. Pokoj/rozejm/sojusz zdejmuja oblezenie, wojna i barbarzyncy je utrzymuja. Mutacja main.ts (bramka + isSiegeStillValid cofniete do starej logiki) lamie 3 asercje. Wynik 48 OK / 0 FAIL (gate-nowy-test-r2.txt).
- Poprawka drobna: komunikat w oblezenie-siege-lifted-po-bitwie-test.cjs mowil "oczekiwano 4" mimo sprawdzania 5; ujednolicono.
- Nota 1 (brak pomiaru live >=5 ziaren / nakladka wizualna): ODRZUCAM jako defekt kodu, PRZYJMUJE jako ryzyko otwarte: NIE_ZMIERZONO (pelna gra AI nie miesci sie w limicie 590 s w foreground; procesy w tle zabronione). Hipoteza "relacja byla wojna" nie zmienia poprawki: wtedy oblezenie jest legalne i bramka go nie dotyka; AI decyduje o ataku przez aiCanEngageOwner (ai.ts:534) z bramka wojny. Pomiar live = warunek Final Control/orkiestratora.
- Nota 3: bez zarzutu, potwierdzone.
- Allowlista (zarzut 1): bez zarzutu.
TESTY: ai-siege-requires-war 48/0 EXIT=0; oblezenie-remis-endsiege 271/0; oblezenie-siege-lifted-po-bitwie 16/0; tsc --noEmit EXIT=0 (gate-tsc-r2.txt). 16 starych FAIL regresji bez zmian (nie ruszano).
BLOKADY: pomiar live NIE_ZMIERZONO.
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
