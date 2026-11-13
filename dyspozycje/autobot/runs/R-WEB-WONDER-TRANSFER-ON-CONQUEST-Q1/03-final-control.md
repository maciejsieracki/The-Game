STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — cuda świata
TEMAT: R-WEB-WONDER-TRANSFER-ON-CONQUEST-Q1
GOAL: po zmianie właściciela miasta/hexa z cudem zdobywca przejmuje cud wraz z bonusami (wariant B).
ZMIANY/COMMIT: ocena na c69c32a79 (potomek fbf564b17, baza ed67d18b3). Diff do bazy: 01-operator-r1.md, 02-obrona-r1.md, gra/src/game/wonder-transfer.ts, gra/src/main.ts, gra/tools/wonder-transfer-on-conquest-test.cjs. Zero zmian w wonders-data.ts, gra-robocza, WERSJE.md, rust-port, render. git diff --check czysty. Commit FC: tylko ten plik.
TESTY (własny przebieg na c69c32a79, po npm ci, node_modules usunięty): wonder-transfer-on-conquest-test 32/32; logic-test 213/213; tsc --noEmit exit 0; ai-test 274 passed / 20 failed (identycznie jak baza wg wcześniejszego FC i Operatora; diff nie dotyka ai*.ts). Nie powtarzano: wonder-yields, cuda-handel, wonder-map-build. NIE WYKONANO: przeglądarka (zmiana logiczna, istniejący modal), npm run build.
WERDYKTY ZARZUTÓW:
- Z1 (test strukturalny, nie uruchamia main.ts): ODDAL. Luka fortu (sweepFortCaptures) naprawiona w obronie i pokryta (mutacja = 1 FAIL); inwentarz przypisań city.ownerId potwierdzony samodzielnie (wszystkie ścieżki gry objęte: podbój, kapitulacja głodowa, cesja, aneksja, rewolta, fort).
- Z2 (cud u rebeliantów -99 / barbarzyńców -1): ODDAL, do ABC (realna decyzja produktowa, nieblokująca). Dispatch każe przenosić na właściciela terytorium; rewolta jest na liście zdarzeń.
- Z3 (nowy plik wonder-transfer.ts poza allowlistą): ODDAL. Dispatch dopuszcza moduły zdobywania/cesji/aneksji w gra/src/game/**; nowy czysty moduł logiki przeniesienia mieści się w tym zakresie. Orkiestrator przyjmuje jawnie.
- Z4 (pkt 4, 6, wonderBuildSites): ODDAL. Pkt 4 i 5 opisane zgodnie z dispatchem, pkt 6 to DECISION_REQUIRED bez migracji (zgodnie z dispatchem).
PYTANIA ABC DLA ORKIESTRATORA (nieblokujące): (1) czy rebelianci/barbarzyńcy mogą posiadać cud; (2) czy zakładanie miasta (finalizeCityFounding -> przejęcie fortów) ma przenosić cud (obecnie nie); (3) migracja niespójnych zapisów i los wonderBuildSites/completeWonderOnHex na przejętym terytorium; (4) czy bonusy ekskluzywne (dostęp "E") działają u cywilizacji, która nie może postawić cudu.
BLOKADY: brak
RUNDY: FC 1/5 (łącznie temat: 1/5)
SHA DO INTEGRACJI: c69c32a79 (kod i test; commit FC dokłada wyłącznie ten raport). Kolejność: po ARMY-STACK-LIMIT (ed67d18b3 jest bazą), przed kolejnymi tematami dotykającymi main.ts (możliwy konflikt w sweepFortCaptures, applyCityCaptureToMap, annexCityStateToOwner). Względem origin/rust-port/parity-v2: niezależnie, zmiana wyłącznie w gra/ (web), brak plików wspólnych.
NASTĘPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
