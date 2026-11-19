STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzedzia pomiarowe; gra/src nietkniete)
TEMAT: R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1
GOAL: wspolne odrzucanie wiszacych ofert AI->gracz w runnerach pomiaru ekonomii; liczniki PROB i POTWIERDZONYCH odrzucen rozdzielone.
ZMIANY/COMMIT: obrona na bazie kandydata 73244ed37 (detach). Zmieniony jeden plik: gra/tools/measure-reject-offers-test.cjs (+asercja 7: domyslne --reject-offers=1 w ai-economy-measure-run.cjs i bramka `if (REJECT_OFFERS)` przy wywolaniu rejectAwaitingAiOffers). Kod runnerow i helpera bez zmian. SHA: patrz pole sha w odpowiedzi.
ODPOWIEDZI NA ZARZUTY:
 Z1 (asercja 6 statyczna; nie wykrywa domyslnej --reject-offers=0 ani wylaczenia bramki): PRZYJETE i naprawione. Dodana asercja 7 (regex na linii `const REJECT_OFFERS = arg('reject-offers', '1') !== '0';` oraz indexOf na `if (REJECT_OFFERS) { countOffers(await rejectAwaitingAiOffers(page, seenOffers))`). Dowod mutacji (kopia tools/ w scratchpad, nie w repo):
   - domyslna 0 w ai-economy -> test: `FAIL: 7 ai-economy: domyslnie --reject-offers=1`, wynik 14 OK, 1 FAIL;
   - bramka zastapiona `if (false) {` -> test: `FAIL: 7 ai-economy: wywolanie odrzucania bramkowane flaga`, wynik 14 OK, 1 FAIL;
   - prawidlowy stan: 15 OK, 0 FAIL.
   Asercja 6 nadal statyczna (kolejnosc wywolania); zachowania gry nie dowodzi, co jest przyznane.
 Z2 (luka dokumentacyjna: test mutanta i parytet 4242 nie opisane osobno): PRZYJETE w czesci dokumentacyjnej. Mutant modulu (potwierdzenie zawsze +1), odtworzony dzisiaj: `FAIL: 1 confirmed=1 {"attempts":1,"confirmed":2}`, wynik 14 OK, 1 FAIL (MEASURE_REJECT_MODULE). Parytet seed 4242 (--reject-offers 0 vs 1): wynik Evaluatora, 19 wierszy identycznych, cytowany w jego zarzucie; przeze mnie NIE_ZMIERZONO (wymaga bundle i biegu przegladarkowego).
 Z3 (zmiana domyslnej --reject-offers na 1 w ai-economy i zmiana semantyki aiOffersRejected w diplomacy-harder; stare jsonl nieporownywalne): ODRZUCAM z dowodem. Zmiana domyslnej na 1 jest zamierzona: 00-dispatch-DODATEK-claude.md, DODATEK 1 pkt (1): "DOMYŚLNIE ustaw **1**" (bez tego biegi staja w t18/t36). Rozdzielenie prob i potwierdzen jest wymagane przez pkt (3) dispatchu. Zmiana jest opisana w naglowku gra/tools/measure-reject-offers.cjs (akapit "Uwaga (zmiana semantyki ...)"). Niepownywalnosc starych jsonl jest skutkiem zamierzonym, nie defektem; zachowanie bez wiszacych ofert pozostaje identyczne (parytet 4242, patrz Z2).
TESTY:
 - node --check gra/tools/measure-reject-offers-test.cjs: exit 0 (SYNTAX_OK)
 - measure-reject-offers-test.cjs (po poprawce): 15 OK, 0 FAIL
 - mutanty (patrz Z1, Z2): 3 z 3 wykryte (FAIL, nie przechodza)
 - git diff --check: CHECK_OK; git diff --stat: 1 plik, 9 insertions
 - ai-economy-measure-hook-test.cjs: NIE_ZMIERZONO -- blad BLAD Error: Command failed: npx vite build --outDir /tmp/ai-economy-dist-... (budowanie bundle w harnessie testu, srodowisko; nie zmieniono kodu runnera). Wynik z poprzedniej rundy Operatora (23/23) nie jest tu potwierdzony.
 - NIE_ZMIERZONO: parytet 20 tur seed 4242 przed/po (wynik Evaluatora: 19 wierszy identycznych, nie powtorzony przeze mnie).
 - NIE_ZMIERZONO: bieg >=40 tur seed 1234 (dowod: przedtem cannot-end t18).
 - NIE_ZMIERZONO: tsc, logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6, diplomacy-harder-hook, ai-ai-alliance-hook w tej rundzie (zmiana dotyczy wylacznie testu jednostkowego; gra/src nietkniete).
BLOKADY: build bundle dla ai-economy-measure-hook-test.cjs (npx vite w harnessie) -- srodowiskowe; bieg seed 1234 >=40 tur i parytet 4242 do wykonania przez orkiestratora.
RUNDY: 2/5 (runda 1 Operatora, obrona)
NASTEPNY KROK: Evaluator ponownie na asercje 7 i mutacje; orkiestrator uruchamia bieg seed 1234 >=40 tur i parytet 4242 oraz hook-test po naprawie bundle.
UWAGI-DLA-ORKIESTRATORA: gra/node_modules zainstalowane (npm ci --ignore-scripts, git-ignorowane). Nie usuwano (zakaz rm). Kopie mutantow w scratchpad (poza repo).
DEPLOY/PUSH: NIE WYKONANO
