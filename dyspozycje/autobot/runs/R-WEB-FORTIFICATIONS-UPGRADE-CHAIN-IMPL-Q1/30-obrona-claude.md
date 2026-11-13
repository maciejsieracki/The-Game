# 30-obrona-claude.md — R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-IMPL-Q1 (Obrona, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-IMPL-Q1
GOAL: fortyfikacje jako łańcuch awansu Palisada -> Mury kamienne -> Mury ceglane (jedna fortyfikacja, awans zamiast dokładania)
BAZA: kandydat 0bf194d76c7db905d291f64022c7d6150318d0e6 (Evaluator 9b060f937)

## Odpowiedzi na zarzuty
1. (Chromium przez Vite HTTP) ODRZUCAM jako niewykonalne w tej rundzie — NIE_ZMIERZONO pętla tury w main() i klik Ulepsz w pełnym UI. Test UI (renderBuildList na realnym module w Chromium) zostaje: 15/0. Harness live z vite build w tym środowisku zamyka przeglądarkę (patrz zarzut 2). Ryzyko szczątkowe dla Final Control/właściciela: obejrzeć w grze.
2. (ai-buduje-budynki-test) URUCHOMIONO 2x, oba razy INFRA: "BLAD: page.evaluate: Target page, context or browser has been closed" (+ timeout rc=124); buildy vite fix/mut-a/b/c OK, pada dopiero w runScenarioOnBrowser (poll w Chromium). Test dotyczy profilu budowy/auto-defaults (grep: zero odwołań do mury/palisada/fort), więc nie jest bramką tego tematu; NIE_ZMIERZONO. Zastępnik: fortifications-upgrade-chain-ai-test 13/0 na realnym chooseCityProduction. Dowody: evidence/obrona-ai-buduje-budynki.txt, ...-r2.txt.
3. (pliki poza literalną allowlistą) PRZYJMUJĘ do wiadomości, bez zmiany: loader.ts (pole upgradeSkip w typie BuildingDef), building-upgrades.ts (czyste helpery łańcucha), buildingAdapter.ts (etykieta karty) są niezbędne technicznie; buildings.json leży w gra/data/ (nie gra/src/data/). Wartości liczbowe bez zmian (diff buildings.json = 4 linie upgradeFrom/upgradeSkip). Do akceptacji orkiestratora.
4. (migracja tylko jako funkcja; kolejki starych zapisów) ODRZUCAM jako poza zakresem dispatchu: decyzja (3) dotyczy WYBUDOWANYCH fortyfikacji (wariant cichy, opisany); wpięcie w main.ts to jedna linia pokryta tsc + testy M1-M8 funkcji; czyszczenie kolejki wymagałoby zmiany sanitizeBuildQueue w 4 miejscach main.ts (ryzyko > zysk). Silnik: ukończenie wyższego etapu usuwa niższe, spóźniony niższy nie cofa wyższego (applyCompletedBuildingIds), więc stan budynków jest poprawny; ryzyko szczątkowe: stary zapis z dwoma etapami łańcucha w kolejce naraz zapłaci za zbędny etap (rzadkie).
5. (fort blokuje palisadę i mur kamienny) ODRZUCAM jako zmianę: to ZACHOWANA reguła sprzed zmiany (isWallTierBlockedByStrongerWall); decyzja (4) mówi, że Cytadela nie należy do łańcucha. Zmiana tej reguły to decyzja produktowa -> DECISION_REQUIRED (ABC) dla orkiestratora, jeśli właściciel chce, by Cytadela nie blokowała murów. Nie ruszam.
6. (efekt uboczny UI) PRZYJMUJĘ, poprawka w cityPanel.ts:
   a) appendBuildableItemRow: etykieta = `Ulepsz → <def.nazwa>` tylko dla wierszy łańcucha; pozostałe (w tym awans poziomu) wracają do dotychczasowego def.nazwa (zdjęta zmiana item.nazwa);
   b) lista posiadanych: przycisk ↗ "Skład bonusów" nie pojawia się dla budynków z upgradeSkip (zamiana, nie suma poziomów).
   Test UI U10b zaktualizowany do zachowanego zachowania. Wygląd CSS wiersza: NIE_ZMIERZONO (test bez CSS).

## ZMIANY/COMMIT
gra/src/ui/cityPanel.ts (2 hunki), gra/tools/fortifications-upgrade-chain-ui-test.cjs (U10b), evidence/obrona-*.txt, ten plik. SHA końcowy: pole sha w odpowiedzi (commit tego raportu), start 0bf194d76.

## TESTY (surowe wyjścia w evidence/obrona-*)
- tsc --noEmit: rc=0, 0 bajtów wyjścia
- fortifications-stack-repro-test: 49 OK, 0 FAIL
- fortifications-upgrade-chain-ai-test: 13 OK, 0 FAIL
- fortifications-upgrade-chain-ui-test: 15 passed, 0 failed (po poprawce zarzutu 6a było 14/1 na U10b — test zaktualizowany)
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6
- ai-buduje-budynki-test: INFRA x2 (zarzut 2)

## BLOKADY
ai-buduje-budynki-test (INFRA Chromium); pełny test Vite HTTP gry (NIE_ZMIERZONO).
## ZAŁOŻENIA / DECISION_REQUIRED
Zarzut 5 (Cytadela vs mury) — decyzja produktowa, nie zmieniona. Dług Rust REPIN: fortyfikacje (upgradeFrom/upgradeSkip, blokada kolejki, applyCompletedBuildingIds, collapseFortificationChain) — tylko wskazanie, rust-port nietknięty.
RUNDY: obrona 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
