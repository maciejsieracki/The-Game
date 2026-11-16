STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NOTIF-EMPTY-QUEUE-NO-BUILDING-AVAILABLE-Q2
GOAL: Powiadomienie „Produkcja: <miasto> — Kolejka pusta” pojawia się WYŁĄCZNIE, gdy w mieście jest coś realnie do wybudowania (budynek lub ulepszenie budynku, stać gracza) i kolejka jest pusta. Sama rekrutacja jednostek go nie wyzwala. Treść: „Kolejka pusta — wybierz budynek”.
BAZA: origin/main = 7d3cd309957645fcb9f5083ec221134b7ec5dc11 (ancestor-check OK). Startowy kandydat obrony: c6725a83072a19a2ffab40a76907db01581b9f2d (runda 1 Operatora, bez zmian w gra/src/main.ts w tej rundzie).

ZMIANY/COMMIT:
  - NOWY: gra/tools/notif-empty-queue-gate-behaviour-test.cjs (odpowiedź na zarzut 1). Wycina z gra/src/main.ts i wykonuje (esbuild) cityHasActionableProduction, cityHasAffordableBuildingEnqueue, cityHasAffordableLevelUpgrade, productionOptionsFingerprint. Zależności realne: buildableProduction / buildingLevelForEpoch / buildingProductionItem / buildingTypeQueued (gra/src/game/production.ts), buildingCanBuildNow (gra/src/ui/cityPanel.ts), dane gra/data/*.json. Stubowane wyłącznie: lista technologii ownera, kontekst dostępności (productionAvailabilityCtxForCity), tryb autobudowy.
  - Kod gry (gra/src/main.ts) i gra/tools/notif-empty-queue-buildable-test.cjs NIE zmienione w tej rundzie.
  - Raport: dyspozycje/autobot/runs/R-WEB-NOTIF-EMPTY-QUEUE-NO-BUILDING-AVAILABLE-Q2/30-obrona-claude.md (ten plik).
  - Commit: patrz `git log -1` na gałęzi obrony (SHA końcowy w polu sha odpowiedzi; SHA commitu z kodem testu jest w historii tuż przed raportem).

TESTY (liczby z surowego wyjścia, uruchomione w tym worktree):
  - node tools/notif-empty-queue-buildable-test.cjs  -> RESULT: 20 pass / 0 fail (bez zmian względem rundy 1).
  - node tools/notif-empty-queue-gate-behaviour-test.cjs -> RESULT: 11 pass / 0 fail.
    * kandydat: dom_starszyzny, koszt {"drewno":60} (pierwszy budynek epoki Kamień bez technologii, z kosztem surowcowym, zbudowany z buildableProduction).
    * (iii) stać, kolejka pusta: gate = true; odcisk zawiera id kandydata i kończy się „|up:0”.
    * (ii) dostępny budynek, pusta pula: gate = false.
    * (i) wszystko zbudowane, pełna pula: gate = false; odcisk = „|up:0”.
    * (iv) wszystko zbudowane, pełna pula + flaga „rekrutacja możliwa”: gate = false.
    * M1 (w kopii main.ts wpięta gałąź rekrutacji): (iv) daje true -> wykryte.
    * M2 (w kopii predykat enqueue `if (false) continue;`): (ii) daje true -> wykryte.
    * M3 (w kopii odcisk bez „|up:”): odcisk (i) różni się od „|up:0” -> wykryte.
  - tsc, bramki referencyjne (logic, tech-tree, research, unit-replace, combat) NIE uruchamiane w tej rundzie: kod gry nie zmieniony względem c6725a83 (zakres rundy = test + raport). Wyniki z rundy 1 (tsc 0 błędów w zakresie zmian, 213/213, 20/0, 33/0, 21/21, 6/6) pochodzą z Operatora i NIE są tu ponownie zmierzone.
  - Żywy bieg w Chromium (kryterium b): NIE_ZMIERZONO. Brak vite/gra/node_modules w worktree; build poza repo i scenariusz stanu „wszystko zbudowane / brak surowców” wymagają hooków gry, których ta runda nie dodawała.
  - Zależność środowiskowa: w worktree brakowało gra/node_modules (esbuild). Do uruchomienia testów podlinkowano gra/node_modules do istniejącego katalogu innego worktree (symlink, gitignored, usunięty po pracy).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
  1. PRZYJMUJĘ. Dodany test wykonawczy (notif-empty-queue-gate-behaviour-test.cjs): przypadki (i)–(iv) i mutacje M1–M3 działają na prawdziwych funkcjach z main.ts, nie na regexach. Ograniczenie zostaje: funkcje są wycięte z boot() i uruchomione z atrapami stanu gry (lista technologii, kontekst dostępności, tryb autobudowy), a nie z żywej gry.
  2. ODRZUCAM w tej rundzie (nie przyjmuję jako zrobione): bieg w Chromium NIE wykonany, zostaje NIE_ZMIERZONO. Powód: wymaga buildu poza repo i sterowanego stanu gry; nie deklaruję tego jako dowodu. Decyzja, czy to warunek FC, należy do orkiestratora (patrz UWAGI).
  3. ODRZUCAM (zachowanie zamierzone, z dowodem). Ulepszenie w bramce pochodzi z rozstrzygnięcia DODATEK 0 („budynek lub ulepszenie budynku”) i używa TEGO SAMEGO predykatu buildingCanBuildNow co panel (cityPanel.ts: „Dostepne do budowy: Buduj / Ulepsz”, predykat w linii 7212–7219). Ulepszenie wchodzi do bramki tylko gdy: budynek jest zbudowany, maksPoziom>1, targetLevel>1 dla epoki, nie jest w kolejce i buildingCanBuildNow = true. Wtedy to jest „coś do wybudowania” w sensie właściciela. Przypadek „wszystko zbudowane” w epoce 1 daje false (test (i)). Czy w zrzucie właściciela jakieś ulepszenie jest faktycznie dostępne: NIE_ZMIERZONO na żywo; w zrzucie 1 („Dostępne do budowy” zawiera tylko zablokowane epoką) nic nie wskazuje na dostępne ulepszenie.
  4. ODRZUCAM. Koszt budynku jest WYŁĄCZNIE surowcowy: buildingStockCost (gra/src/game/building-stock-cost.ts:90) zwraca koszty surowców. Pieniądz (skarbiec) jest kosztem jednostek (gra/src/game/production.ts:23 „Unit cost: Pieniadz”; purchasableUnits, production.ts:1017–1018 „Jednostki do KUPIENIA za Pieniadz”). Manpower liczy się tylko dla pozycji typu 'jednostka' (production.ts:2192). Chipy buildingRequirementChips (cityPanel.ts:7097–7221) dla budynku to tech / stock / other, więc predykat panelu i bramka mierzą to samo. Test (ii)/(iii) potwierdza zachowanie na realnym predykacie.
  5. Podpunkty:
     - „gateGuard/fpGuard usunięte”: PRZYJMUJĘ jako skutek usunięcia rekrutacji. Oba strażniki w 7d3cd309 dotyczyły wyłącznie rekrutacji: main.ts:19331 (w cityHasAffordableUnitRecruitment) i main.ts:19407 (w bloku unitIds odcisku). Budynki nigdy nie miały strażnika oblężenia w bramce ani przed, ani po zmianie. Czy budowa w oblężonym mieście powinna być blokowana: poza zakresem, NIE_ZMIERZONO.
     - „sekcja A martwa”: ODRZUCAM. isCityUnderSiege jest żywa: main.ts:4572, 4775, 4945, 5059 oraz cityPanel.ts:8566 i 8691. Sekcja A testuje realny moduł src/game/city-siege-state.ts; usunięcie zmniejszyłoby pokrycie. Nie znalazłem innych martwych asercji (sekcje B, B2, C, D testują żywe linie kodu).
     - „odcisk bez członu |u: zmienia Zamknij bez testu behawioralnego”: PRZYJMUJĘ. Nowy test wykonuje productionOptionsFingerprint (przypadki (i) i (iii) oraz mutacja M3). Zmiana zachowania „Zamknij” (zamknięte wydarzenie nie wraca przy samej zmianie rekrutacji) jest świadoma i opisana w UWAGACH rundy 1.

UWAGI-DLA-ORKIESTRATORA:
  - Bramka liczy też ulepszenia (zgodnie z DODATEK 0). Jeśli właściciel chce, by powiadomienie było tylko dla NOWYCH budynków, to osobna decyzja produktowa (ABC); bieżąca implementacja tego nie robi.
  - Żywy bieg w Chromium (kryterium b z dispatchu) nie został wykonany. Jeśli FC wymaga go jako warunku, trzeba osobnego kroku z buildem poza repo i hakiem stanu; ta runda tego nie zrobiła.
  - Wskaźnik „productionQueueEmpty” w liście miast (main.ts:8651) używa tej samej bramki, więc też przestaje sygnalizować pustą kolejkę przy samej rekrutacji. Zamierzone.
  - Nie tworzono żadnych sesji, zadań, harmonogramów ani triggerów. Nie uruchamiano run_in_background.
  - Pozostały szum w worktree: symlink gra/node_modules (gitignored), usuwany po commicie.

RUNDY: 2/5 (runda 1 Operatora = c6725a830; ta runda = obrona na zarzuty Evaluatora 4b4cc87e5)
NASTĘPNY KROK: Evaluator (SONNET) ponownie: test wykonawczy (gra/tools/notif-empty-queue-gate-behaviour-test.cjs, 11/0) + ocena odpowiedzi 2 i 5; decyzja orkiestratora w sprawie żywego biegu Chromium (NIE_ZMIERZONO) i w sprawie ulepszeń w bramce.
DEPLOY/PUSH: NIE WYKONANO
