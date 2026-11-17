STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1
GOAL: rozkaz reczny marszu i ataku daje pelny ruch w jednej aktywacji (jak AUTO), cios na koncu ruchu, max 1 cios na jednostke na ture; AUTO i Pomin bez zmian.
BAZA: 459354a12e00eb04cc8365c5ac03a03c2ffec999 (origin/main). Kod operatora = commit na czubku galezi detached (SHA w polu sha raportu orkiestratora).
ZMIANY/COMMIT:
- gra/src/battle/battleScene.ts (tylko sciezka rozkazow recznych): _performPlayerOrder — po kazdym kroku move/attackMove/attack wywolanie _manualOrderAfterStep (lancuch: jesli zostalo MP i rozkaz trwa, wykonaj rozkaz ponownie w tej samej aktywacji; przy wyczerpanym MP tylko gdy wrog jest w zasiegu ciosu). _manualOrderStrike ustawia ru.struckRound (max 1 cios na ture). Nowe pomocnicze: _manualOrderChainActive, _manualOrderAfterStep, _manualOrderStrike. Doktryny AI (isUnitDoctrineAuto) i tryb AUTO wylaczone z lancucha.
- gra/tools/battle-manual-orders-full-move-test.cjs (nowy): test jednostkowy na scenie ze stubami (esbuild+vm); tryb --mutate zastepuje lancuch jednym krokiem.
- dyspozycje/autobot/runs/R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1/10-operator-claude.md (ten raport).
- Nie zmieniano: gra/src poza battleScene.ts, gra/data, WERSJE.md, manifest.
TESTY:
- npx tsc --noEmit -p gra (w gra/): exit 0 (po poprawce zawezenia typu w _manualOrderChainActive).
- node tools/battle-manual-orders-full-move-test.cjs: exit 0, 4 przypadki zielone. Surowe wartosci: marsz MP 3 -> 3 kroki w jednej aktywacji (1 done); szarza MP 3 na wroga w odleglosci 4 -> 3 kroki + 1 cios (distance 1), 1 done; jeden cios na ture przy dwoch sasiadach (attacks=1); doktryna AI poza trybem recznym -> 1 krok (bez zmian).
- node tools/battle-manual-orders-full-move-test.cjs --mutate: exit 1 (CZERWONY: marsz 1 krok, wymagane >= 1,5). Mutacja zadzialala.
- Istniejace testy sceny node: battle-manual-orders-routing-test.cjs exit 0 (passed); battle-attack-move-order-test.cjs exit 0 (passed); siege-manual-battle-behavior-test.cjs exit 0 (40 OK, 0 FAIL).
- Live Chromium (sonda przed/po z tabela, seedy 1-3, Hastati 6 vs 6): NIE ZMIERZONO. Przegladarki nie uruchomiono w tej rundzie.
- git diff --check: czysto.
BLOKADY: brak blokad kodowych. Otwarte: pomiar live (jw.). Test jednostkowy stubuje _firstStepAlongPathToAttack greedy krokiem (BFS wymaga terrainMap), wiec pelna sciezka BFS nie jest pokryta tym testem.
ZALOZENIA (luki rozstrzygniete zalozeniem):
- Cios "na koncu ruchu" = cios natychmiast po dojsciu do pozycji w zasiegu (istniejaca logika strike-first zostaje), a nie dopiero po wyczerpaniu MP. Przy wyczerpanym MP i wrogu w zasiegu jednostka nadal uderza (inaczej cios by przepadal).
- Rozkaz "move" z wrogiem sasiadujacym na starcie uderza jak dotad i konczy ruch w tej turze (max 1 cios).
- Przy attackMove z wyczerpanym MP lancuch sie nie wznawia.
- Arbitraz kolizji dla jednostek niewybranych NIE zaimplementowany (zgodnie z dispatchem).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet): weryfikacja diffu i testu; live Chromium przed/po jako bramka przed Final Control.
DEPLOY/PUSH: NIE WYKONANO
