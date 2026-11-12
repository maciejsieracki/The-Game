STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1
GOAL: przy wczytaniu starego zapisu czyścić z KOLEJKI produkcji niższe etapy łańcucha fortyfikacji (Palisada -> Mury kamienne -> Mury ceglane), gdy w kolejce lub w mieście jest wyższy etap (zostaje najwyższy); jednorazowy komunikat o usunięciu. Bez zwrotu kosztów (decyzja właściciela z W20). Koszty, bonusy i reguły łańcucha bez zmian.
ZMIANY/COMMIT: baza origin/main = 44af89169. Allowlista:
  - gra/src/game/production.ts: nowa funkcja pure `collapseFortificationQueue(prod, builtIds, buildings)` (po `collapseFortificationChain`). Usuwa pozycje kolejki kind=budynek, dla których `skipChainHigherIds` zawiera etap obecny w mieście lub w kolejce. Zwraca `{ prod, removed }`; gdy brak usunięć, zwraca tę samą referencję `prod`. Usunięcie przez istniejące `filterQueue` (ta sama ścieżka co sanitize).
  - gra/src/main.ts: import `collapseFortificationQueue`; deklaracja `fortQueueCleanupNotice` tuż przed `loadGameFromSlot`; w `restoreGameFromSave` po pętli `cityBuilt` pętla po `cityProd` (wywołanie z `cityBuilt.get(cid) ?? []`), sumowanie usuniętych; w `loadGameFromSlot` po „Wczytano" jednorazowy `showHintMessage` (6000 ms) gdy liczba > 0, potem reset licznika.
  - gra/tools/fortifications-queue-cleanup-test.cjs (nowy, 7 asercji).
  - dyspozycje/autobot/runs/R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1/10-operator-claude.md (ten raport).
  Poza allowlistą NIE zmieniono: JSON balansu/kosztów, format zapisu, WERSJE.md, rust-port, building-upgrades.ts (nie było potrzeby), save*.
  Commit: SHA w polu sha tej odpowiedzi (czubek gałęzi detached od origin/main).
TESTY:
  - `npx tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
  - `node tools/fortifications-queue-cleanup-test.cjs` (nowy): WYNIK 7 OK, 0 FAIL (Q1-Q5 czysta funkcja na katalogu łańcucha z upgradeSkip/upgradeFrom; Q6-Q7 statyczne wpięcie w main.ts).
  - `node tools/fortifications-stack-repro-test.cjs`: WYNIK 49 OK, 0 FAIL (w tym N4 migracja zapisu collapseFortificationChain).
  - `node tools/fortifications-upgrade-chain-ui-test.cjs`: 15 passed, 0 failed.
  - `node tools/fortifications-upgrade-chain-ai-test.cjs`: WYNIK 13 OK, 0 FAIL.
  - Bramki referencyjne z R-PROC-AUTOBOT §6:
    - logic-test: LOGIC OK (213/213)
    - tech-tree-test: 20 pass, 0 fail (tabela w dokumencie podaje 19/19; liczba pass wzrosła, bramka zielona — nie ruszam dokumentu w tym temacie)
    - research-test: PASSED 33 / FAILED 0 / TOTAL 33
    - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21) (tabela podaje 13/13; zielone, do uzgodnienia przy okazji przez orkiestratora)
    - combat-test: COMBAT TEST 6/6 pass
  - `git diff --check`: czysto.
  - NIE_ZMIERZONO: komunikat widoczny w realnej grze (Chromium, wczytanie zapisu z kolejką Palisada+Mur kamienny+Mur ceglany). Nie uruchamiałem live testu; kontrakt „komunikat widoczny raz" potwierdzony tylko przez kod (wywołanie po „Wczytano", reset licznika). Dispatch wymaga testu na zapisie — pokryte czystą funkcją i wpięciem, nie pełnym zapisem JSON przez loader.
BLOKADY: brak. Założenia:
  - Komunikat jest „jednorazowy" w sensie: pojawia się przy wczytaniu zapisu, w którym coś usunięto. Po ponownym zapisie gry kolejka jest już czysta, więc kolejne wczytania tego samego slotu nie pokażą komunikatu. Wczytanie tego samego STAREGO pliku ponownie pokaże go ponownie (zapis nie jest modyfikowany na dysku).
  - Usunięcie pozycji na froncie kolejki (index 0) zeruje jej zbankowany postęp (`filterQueue` -> `forfeitedPostep`), a wartość ta NIE jest dopisywana do puli Pracy imperium. Świadomie pominięte przy wczytaniu: pula Pracy jest odtwarzana później w `restoreGameFromSave`, a dopisanie wymagałoby zmiany kolejności. Mała, jednorazowa strata Pracy w starym zapisie — do decyzji orkiestratora, czy domknąć w osobnym tematu.
  - Komunikat tekstem: „Usunięto N zbędnych pozycji z kolejki produkcji (niższe etapy fortyfikacji; najwyższy etap zostaje). Koszt nie został zwrócony." Treść PL — do akceptacji właściciela, bez ABC.
  - `fort` (Cytadela) nie należy do łańcucha `upgradeSkip` i nie blokuje niższych etapów w kolejce (zgodnie z `collapseFortificationChain`). Odmienna semantyka `applyCompletedBuildingIds` (blokada przez `fort`) nie była w zakresie.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja wytworu w worktree: test Q1-Q7, tsc, bramki; ocena wpięcia w load; ewentualnie live test w Chromium na zapisie z kolejką. Dla FC: otwarte pytanie o stratę postępu/Pracy na froncie (założenie powyżej).
DEPLOY/PUSH: NIE WYKONANO
