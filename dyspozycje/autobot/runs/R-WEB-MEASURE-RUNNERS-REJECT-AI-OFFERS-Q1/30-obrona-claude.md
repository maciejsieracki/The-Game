STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzedzia pomiarowe; gra/src nietkniete)
TEMAT: R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1
GOAL: wspolne odrzucanie wiszacych ofert AI->gracz w runnerach pomiaru ekonomii; liczniki PROB i POTWIERDZONYCH odrzucen rozdzielone.
ZMIANY/COMMIT: obrona na bazie kandydata 3febcfdde. Zmienione: gra/tools/measure-reject-offers.cjs (attempts liczone raz na id w turze, parametr seenIds), gra/tools/measure-reject-offers-test.cjs (+asercje 5 i 6), gra/tools/ai-economy-measure-run.cjs i gra/tools/diplomacy-harder-measure-run.cjs (wspolny zbior seenOffers per tura). SHA: patrz pole sha w odpowiedzi.
ODPOWIEDZI NA ZARZUTY:
 N1 (alliance/econ wrapper bez zmian): PRZYJETE w czesci kodowej. Oba wrappery uruchamiaja ai-economy-measure-run.cjs (spawnSync), wiec dziedzicza poprawke. Osobny bieg dowodowy NIE wykonany: NIE_ZMIERZONO.
 N2 (brak testu kolejnosci): PRZYJETE. Asercja 6 sprawdza statycznie, ze rejectAwaitingAiOffers(page wywoluje sie przed canEnd() w playOneTurn obu runnerow. Nie dowodzi zachowania gry.
 N3 (podwojne liczenie prob): PRZYJETE i naprawione. Druga proba w tej samej turze nie zwieksza attempts dla id juz policzonego; reject nadal wolany (zachowanie gry bez zmian). Asercja 5.
 N4 (zmiana semantyki aiOffersRejected w diplomacy-harder): PRZYJETE. Wynika z wymagania (3) dispatchu; opisane w naglowku helpera. Stare jsonl nieporownywalne.
TESTY:
 - node --check: 4 pliki OK
 - tsc --noEmit (gra/): exit 0
 - measure-reject-offers-test.cjs: 13 OK, 0 FAIL
 - mutant (potwierdzenie zawsze +1) przez MEASURE_REJECT_MODULE: 2 FAIL, exit 1 (czerwony, jak wymagano)
 - ai-economy-measure-hook-test.cjs: 23/23 zielone, exit 0
 - diplomacy-harder-measure-hook-test.cjs --build 1: 15 zielonych, 0 czerwonych
 - ai-ai-alliance-measure-hook-test.cjs: WYNIK ZIELONY, 28/28 mutantow wykrytych
 - NIE_ZMIERZONO: bieg dymny 20 tur seed 4242 przed/po (parytet) oraz bieg >=40 tur seed 1234 (dowod: przedtem cannot-end t18). Wymagaja bundle i dlugiego biegu przegladarkowego, nie zmiescily sie w foreground.
 - NIE_ZMIERZONO: logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6 (zmiany tylko w gra/tools/, gra/src nietkniete).
BLOKADY: brak kodowych. Dowody biegowe (seed 1234 >=40 tur, parytet 4242) do wykonania przez orkiestratora.
RUNDY: 2/5 (runda 1 Operatora, obrona)
NASTEPNY KROK: Evaluator ponownie; orkiestrator uruchamia bieg seed 1234 >=40 tur i parytet 4242.
UWAGI-DLA-ORKIESTRATORA: gra/node_modules zainstalowane (npm ci --ignore-scripts, git-ignorowane). Nie usuwano (zakaz rm).
DEPLOY/PUSH: NIE WYKONANO
