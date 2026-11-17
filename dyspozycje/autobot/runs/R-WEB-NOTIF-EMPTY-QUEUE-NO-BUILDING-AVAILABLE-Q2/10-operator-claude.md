STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-NO-BUILDING-AVAILABLE-Q2
GOAL: Powiadomienie „Produkcja: <miasto> — Kolejka pusta” pojawia się WYŁĄCZNIE, gdy w mieście jest coś realnie do wybudowania (budynek lub ulepszenie budynku), a kolejka jest pusta. Sama możliwość rekrutacji jednostek go nie wyzwala. Treść: „Kolejka pusta — wybierz budynek”.
BAZA: origin/main = 7d3cd309957645fcb9f5083ec221134b7ec5dc11 (ancestor-check OK; worktree HEAD przed zmianą = ta sama baza).
ZMIANY/COMMIT: commit z kodem i testem + ten raport (SHA: patrz nagłówek odpowiedzi orkiestratora; `git rev-parse HEAD` po commicie).
  - gra/src/main.ts:
    * cityHasActionableProduction: usunięta gałąź `cityHasAffordableUnitRecruitment` (zostają budynki/ulepszenia + wyjątek autobudowy i komentarz R-CUDA-TAB).
    * usunięta funkcja cityHasAffordableUnitRecruitment (po usunięciu z bramki była martwym kodem).
    * productionOptionsFingerprint: usunięty człon jednostek (`|u:`) i blok rekrutacji; odcisk = budynki + ulepszenie (ta sama bramka).
    * treść wydarzenia prod-empty-<id>: „Kolejka pusta — wybierz budynek lub jednostkę” → „Kolejka pusta — wybierz budynek”.
    * NIE dotknięte: showVictoryScreen, aiUpkeepRunwayAllows, reguły budowy/rekrutacji/balansu.
  - gra/tools/notif-empty-queue-buildable-test.cjs: test przepięty na nową bramkę (usunięta asercja o nieistniejącej funkcji); dodane asercje: bramka bez purchasableUnits/cityHasAffordableUnitRecruitment/canAffordUnitRecruitFull, odcisk bez jednostek, treść „wybierz budynek”; dodane mutacje: przywrócona rekrutacja w bramce, przywrócony wpis jednostek w odcisku, przywrócona stara treść.
  - Nie zmieniono: gra/src/ui/sidePanelHud.ts (już miał „Kolejka pusta — wybierz budynek”, linia 511 — dispatch podawał 496), cityPanel.ts, WERSJE.md, manifest, rust-port/ (w rust-port nie ma tej logiki — grep po `prod-empty`/„Kolejka pusta” w *.rs daje zero trafień, więc REPIN nie jest potrzebny).
TESTY:
  - notif-empty-queue-buildable-test.cjs: RESULT 20 pass / 0 fail (w tym 4 nowe mutacje wykryte: przywrócona rekrutacja w bramce, w odcisku, stara treść; mutacje z poprzedniej rundy też wykryte).
  - tsc (globalny /opt/node22/bin/tsc 6.0.2, z --ignoreDeprecations 6.0; projektowy TS i @types/three nie są zainstalowane w worktree): 176 błędów w całym projekcie, 9 w main.ts — żaden w zakresie zmienionych linii (ok. 19300–19700). Porównania z bazą NIE_ZMIERZONO (nie uruchomiono tsc na 7d3cd309 — wynik środowiskowy, nie regresja tematu).
  - Bramki referencyjne (wszystkie na zmienionym kodzie): logic-test LOGIC OK (213/213); tech-tree-test 20 pass/0 fail; research-test PASSED 33/0; unit-replace-test 21/21; combat-test 6/6.
  - Istniejące testy powiadomień: notif-diplo-tab-count-blocking-test 25 OK/0 FAIL; sidepanel-notification-tabs-test 29 pass/0 fail; era-change-notify-test 8 pass/0 fail.
  - Żywy bieg w Chromium (kryterium b): NIE_ZMIERZONO. Powód: w worktree nie ma vite ani gra/node_modules (instalacja/build poza repo nie była w zakresie tej rundy), a stan „wszystkie budynki zbudowane, reszta zablokowana epoką” wymaga scenariusza sterowanego w grze. Zrzuty przed/po NIE_ZMIERZONO.
ZMIERZONO vs HIPOTEZA:
  - ZMIERZONO (kod + test strukturalny/predykatowy): gałąź rekrutacji jednostek była jedyną gałęzią `cityHasActionableProduction`, która mogła zwrócić true bez budynku do wybudowania — bo `availableProduction` (gra/src/game/production.ts:1092+) odrzuca budynki zablokowane technologią i epoką (`b.epokaWejscia > epoch`, `techOk`), więc zablokowane „Kamienne kręgi/Mury kamienne…” nie wchodzą do bramki budynkowej. Potwierdza to hipotezę z dispatchu.
  - NIE ZMIERZONO na żywo: czy w zrzutowym stanie żadna z gałęzi (budynek/ulepszenie) nie zwraca true. Ulepszenie (`cityHasAffordableLevelUpgrade`) pozostaje w bramce zgodnie z rozstrzygnięciem orkiestratora („budynek lub ulepszenie”); jeśli w zrzucie jest dostępne jakiekolwiek ulepszenie, powiadomienie nadal się pojawi — to zamierzone, ale wymaga weryfikacji na żywo.
BLOKADY: brak kodowych. Otwarte: pomiar na żywo (b) — NIE_ZMIERZONO (patrz wyżej).
UWAGI-DLA-ORKIESTRATORA:
  - Bramka „productionQueueEmpty” w liście miast (main.ts ~8651) używa tej samej `cityHasActionableProduction` — po zmianie wskaźnik w liście miast też przestaje sygnalizować „pustą kolejkę” przy samych jednostkach. Zamierzone, spójne z rozstrzygnięciem.
  - Odcisk (`prodEmptyDismissFp`) bez członu jednostek: zamknięte („Zamknij”) wydarzenie nie wraca przy samych zmianach stanu rekrutacji. Zmiana zachowania dyskusyjna tylko w tym wąskim przypadku; w allowliście (bramka prod-empty).
  - Test C (`buildingCanBuildNow`) i A/B2/D nie wykonują samej funkcji `cityHasActionableProduction` (lokalna w boot()) — pokrycie behawioralne bramki nadal tylko strukturalne. Zmierzone wprost: NIE_ZMIERZONO.
  - Nie tworzono żadnych sesji, zadań ani harmonogramów.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET): zweryfikować diff (gra/src/main.ts 3 miejsca + test), potwierdzić interpretację i decyzję o odcisku; przeprowadzić żywy bieg (b) z buildem poza repo, jeśli wymagany przed FC.
DEPLOY/PUSH: NIE WYKONANO
