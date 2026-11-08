STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-SORTIE-ANY-TURN-Q1
GOAL: Oblegana armia AI/barbarzyńców o sile >= 80% oblegających (10:8) wychodzi i atakuje w każdej turze oblężenia.

ODPOWIEDZI NA ZARZUTY
1. Brak pomiaru Chromium PRZED/PO: PRZYJMUJĘ jako lukę, nie jako błąd. Repo nie ma hooka do inscenizacji fazy AI obleganego miasta AI z zadanymi siłami; bundle wymaga vite poza repo (build w gra/ zakazany). Pozostaje NIE_ZMIERZONO. Dowód zastępczy: D7-D12 (kolejność wpięcia, egzekucja attack bez bramki oblężenia), RED/GREEN i mutacje. Do akceptacji Evaluatora albo osobny temat LIVE-VERIFY.
2. Efekt uboczny budzenia całego garnizonu: PRZYJMUJĘ w części. Budzenie WSZYSTKICH obrońców jest zamierzone: roster ataku zbiera jednostki w promieniu 1 od kotwicy, więc budzenie tylko kotwicy wyprowadziłoby do bitwy jedną jednostkę zamiast armii (osłabia wypad, łamie sens 10:8). Wersję "tylko kotwica" ODRZUCAM. Realne ryzyko to wyprowadzenie bez ataku. Jedyna bramka egzekucji, której plan nie sprawdza, to widoczność celu (wojna i embarked są już w planie). Poprawka: w lastStandSortieCmdsForOwner (nie-barbarzyńcy) przed pobudką sprawdzane jest aiTargetVisibleForAction; cel niewidoczny -> continue (brak komendy, brak pobudki), log "Wypad pominiety". Test D12. Barbarzyńcy bez zmiany.
3. ruchLeft no-op: ODRZUCAM. exitGarnizon i exitFieldFortify PRZYWRACAJĄ ruchLeft ze snapshotu (armyMerge.ts:197-199, 247-250), a rl jest zapisane PRZED nimi. Max(po, rl) realnie chroni przed utratą ruchu przy niższym snapshocie.
4. war-allin-capital 96/2 tylko pośrednio: PRZYJMUJĘ, zmierzone. Ten sam test na bazie 80919e2ae (main.ts i siege-last-stand.ts z bazy): 96 passed, 2 failed, te same dwie linie (6b aiVsAi, 6b noLandPath: hash flagi OFF). Po zmianie identycznie. Awaria wcześniejsza, brak regresji. Log: gate-war-allin-capital-BASE.txt.
5. Dwa testy TIMEOUT (siege-blockade-no-recruit-reinforce, siege-tower-breach-everywhere): pozostaje NIE_ZMIERZONO (budują vite w repo = zakaz). Zmiana nie dotyka blokady rekrutacji ani wież; zastępczo zielone oblezenie-test 27/0, siege-surrender-enter-city 32/0, siege-defenders 12/0, siege-ai 17/0.
6. Brak wypadu/przycisku dla gracza: PRZYJMUJĘ jako decyzję produktową dla ORKIESTRATORA (dispatch: domyślnie nic automatycznie). Bez zmian. Jeśli Harappa ze zrzutu była gracza, ta zmiana jej nie dotyczy.

TESTY: siege-last-stand-sortie 71 OK / 0 FAIL EXIT=0 (gate-green-r2.txt); tsc --noEmit EXIT=0 (gate-tsc-r2.txt); siege-ai 17/0, siege-defenders 12/0, oblezenie-test 27/0, siege-surrender-enter-city 32/0.
BLOKADY: NIE_ZMIERZONO Chromium; dwa testy vite; decyzja produktowa dla gracza.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator / Final Control.
DEPLOY/PUSH: NIE WYKONANO
