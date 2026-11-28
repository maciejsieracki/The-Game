STATUS: FAIL
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16C
GOAL: trzy testy (ai-wojny, hotseat-drugi-fotel, hotseat-etap4-noop) zielone z mutacją albo sklasyfikowane B/C z dowodem; zero zmian gra/src.
ZMIANY/COMMIT: kandydat f80bd56ce0c47f39a0ebe76cea9444b6758d8758, baza 8b98d9f41 (merge-base --is-ancestor: OK). git diff --stat: 25 plików; gra/src = 0 zmian; gra/tools tylko hotseat-drugi-fotel-tura-test.cjs (+4, closeCivWelcome) i hotseat-etap4-noop-test.cjs (+3, closeCivWelcome); reszta dyspozycje/** (analiza, runs). Allowlista zachowana.
TESTY (moje biegi na f80bd56ce, npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic-test: 213/213
- ai-test: 297 passed, 0 failed
- ai-wojny-zwykle-cap-dwa-miasta: "22 PASS, 0 FAIL" (rc 0)
- Mutacje ai-wojny (A1 bez prepareEndTurnGate: czerwona; A2 peaceLocked:false w main.ts, cały test: 21/1): wg logów Operatora 56/57, nie powtarzałem. Asercja F pozostaje pinem tekstowym.
- hotseat-drugi-fotel: zielony 5/5 wg logów Operatora 43/44, nie powtarzałem.
- hotseat-etap4-noop: NIEZAMKNIĘTY. 0 z 6 prób zielona (zapis tury 23), przyczyna nieustalona, brak klasyfikacji A/B/C z dowodem; obrona sama to przyznaje.
OCENA ZARZUTÓW:
1. etap4 -- NAPRAW (FAIL): kryterium binarne wymaga zielone albo B/C z dowodem. Wymagany pomiar isBattleSceneOpen()/isPostBattleSummaryOpen() w t23 przez hak testowy.
2. Pytanie B (skok −11 -> −108) -- NAPRAW (FAIL): dispatch r2 pkt 4 wymagał odtworzenia i liczb; jest tylko analiza kodu, defekt/zamierzone nierozstrzygnięte.
3. Mutacja F -- ODDAL (uwaga): dowód mutantu w całym teście 21/1 uzupełnia lukę; F to pin tekstowy.
4a. modalDiag -- ODDAL: usunięty w f80bd56ce.
4b. maksimum ustawień -- ODDAL (uwaga): nie zmierzono; do wykonania w r4 dla etap4 i pytania B (zasada 2026-11-26).
BLOKADY: etap4 (t23), pytanie B (zrzut units/kosztArmii t16-18), maksimum ustawień.
RUNDY: 3/5 (r1 FC FAIL, r2 FC FAIL, r3 FC FAIL).
NASTĘPNY KROK: runda 4 (Operator HAIKU): (a) etap4: w t23 zmierzyć nakładki bitwy/podsumowania, zapisać klasę A/B/C lub naprawić; (b) pytanie B: live zrzut t16-18 przy maksymalnych ustawieniach; (c) bramki bez zmian.
UWAGI-DLA-ORKIESTRATORA: ai-wojny i hotseat-drugi-fotel są zielone na f80bd56ce i mogą być zintegrowane osobno (decyzja procesowa orkiestratora), jeśli nie chce czekać na etap4.
DEPLOY/PUSH: NIE WYKONANO
