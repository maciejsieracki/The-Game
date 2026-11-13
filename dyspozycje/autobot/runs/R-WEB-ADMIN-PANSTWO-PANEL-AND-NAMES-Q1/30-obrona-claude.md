# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — obrona Operatora (runda 2/5, odpowiedź na zarzuty Evaluatora 66e57c18f)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 (#327)
GOAL: (1) panel Państwa pokazuje administratora państwa i jego stan; (2) w tekstach gracza tylko „administrator państwa” (ulepszenia, całe Państwo) i „administrator miasta” (budynki w mieście), bez starej nazwy i bez mieszania zakresów.
BAZA: origin/main bff897c9b; start obrony: bed6f969d (runda 1); kod rundy 2: a0c19494a.

## ZMIANY/COMMIT
- a0c19494a — gra/src/ui/administratorPanel.ts (zakres państwa w tekstach), gra/tools/admin-panstwo-panel-names-test.cjs (zakres skanu, mutacje realne, 3 nowe asercje zakresu).
- Allowlista: tylko te dwa pliki w kodzie + raport. Brak zmian w main.ts, JSON, auto-build-gate.ts, city-administrator.ts, testach przeglądarkowych, WERSJE.md, gra-robocza/, rust-port/.

## ODPOWIEDZI NA ZARZUTY
Z1 (stare nazwy poza src/ui) — PRZYJMUJĘ jako zgodne z faktem; NIE NAPRAWIONE w tej rundzie.
  Dowód: test r2 (sekcja 2) — 20 trafień poza src/ui: src/main.ts:10222, 10223, 10224, 10225, 10343, 27127, 27136, 27147, 27163, 27189, 27199, 27213, 47870, 47871, 47876; src/game/city-administrator.ts:189; src/game/auto-build-gate.ts:112; data/city-administrator-params.json:23, :27; src/data/wikiBundle.json:1.
  Powód nienaprawienia: wszystkie te pliki są POZA allowlistą (main.ts tylko wiring stanu; reszta nie jest na liście). Naprawa wymaga rozszerzenia allowlisty przez orkiestratora. Nie rozszerzam jej sam.
Z2 (test skanuje tylko src/ui; mutacje samospełniające się) — PRZYJMUJĘ.
  Zmiana: skan obejmuje teraz src/ui, src/main.ts, src/game/{city-administrator,auto-build-gate,cities,civ-test-hooks}.ts, data/city-administrator-params.json, src/data/wikiBundle.json (komentarze odfiltrowane). Test czerwony na 20 trafieniach — to prawdziwy stan, nie maskowany.
  Mutacje nazw są teraz REALNE: podmiana w cityPanel.ts i buildModeHud.ts na dysku, skan, przywrócenie w finally; asercja „pliki przywrócone bajt po bajcie” PASS. Mutacje wiringu (usunięcie wiersza/wiringu) nadal działają na treści pliku wczytanej z dysku.
Z3 (regresja testów przeglądarkowych: improvement-admin-tooltip 4 FAIL, administrator-panel-real-render 2 FAIL) — PRZYJMUJĘ jako zgłoszone przez Evaluatora; NIE_ZMIERZONO w tej rundzie (nie uruchamiałem przeglądarkowych testów, bo pliki są poza allowlistą i nie aktualizuję ich). Decyzja orkiestratora: rozszerzyć allowlistę o te testy (aktualizacja asercji do nowych napisów) albo osobny temat.
Z4 (mieszanie zakresów: „Zatrudnić administratora (państwa) w mieście X?”, opis „w tym mieście”) — PRZYJMUJĘ; NAPRAWIONE w a0c19494a (administratorPanel.ts, w allowliście).
  - administratorHireConfirmText: państwo → „Zatrudnić administratora państwa (jeden na całe Państwo)?” (bez nazwy miasta); miasto → bez zmian „Zatrudnić administratora (miasta) w mieście X?”.
  - Nowy helper scopeWhere(m): miasto → „w tym mieście”, państwo → „we wszystkich miastach Państwa”; użyty w bonusRows (ulepszenia), administratorHireConfirmText (ulepszenia), effectRows (stan, zwolnienie, bez administratora) i w potwierdzeniu auto-ulepszeń (linia ~314).
  - lead() dla państwa: „Administrator państwa to jedna osoba na całe Państwo. Tryb auto ulepszeń terenu działa dla wszystkich miast Państwa.” — ZAŁOŻENIE: przestaje doklejać JSON opis_gracza (który mówi „w tym mieście”); tekst JSON pozostaje nietknięty w pliku i nadal jest w bazie dla miasta? NIE — dla miasta lead nadal używa administratorDescription(), JSON opis_gracza ulepszeń nie jest już wyświetlany w panelu. Wymaga akceptacji (patrz BLOKADY 1).
  - Test: 3 nowe asercje zakresu PASS (pytanie państwa bez „w mieście X”; zakres „we wszystkich miastach Państwa”; brak doklejania JSON).
Z5 (niewiążąca: Netto/legacy/upkeep) — przyjęte do wiadomości, bez zmian (zgodne z deklaracją rundy 1).

## TESTY (surowe wyniki, kod a0c19494a, uruchomione w gra/)
- npm ci --ignore-scripts → exit 0 (w tej worktree node_modules utworzony przed testami).
- node node_modules/typescript/bin/tsc --noEmit → TSC_EXIT=0 (bez wyjścia).
- node tools/logic-test.cjs → "LOGIC OK (213/213)", exit 0.
- node tools/tech-tree-test.cjs → "tech-tree-test: 20 pass, 0 fail", exit 0.
- node tools/research-test.cjs → "PASSED: 33 / FAILED: 0 / TOTAL: 33", "ALL GREEN", exit 0.
- node tools/unit-replace-test.cjs → "WSZYSTKIE TESTY ZIELONE (21/21)", exit 0.
- node tools/combat-test.cjs → "COMBAT TEST: 6/6 pass", exit 0.
- node tools/admin-panstwo-panel-names-test.cjs → "23 pass, 1 fail", exit 1. Jedyny FAIL: sekcja (2), 20 trafień starej nazwy poza src/ui (lista wyżej). Wszystkie pozostałe asercje (render 3 stanów, wiring, zakres, mutacje realne) PASS.
- NIE_ZMIERZONO: testy przeglądarkowe (administrator-panel-real-render, improvement-admin-tooltip-real-render, administrator-icon-everywhere) i render panelu Państwa w żywej grze.

## BLOKADY (decyzja orkiestratora)
1. Rozszerzenie allowlisty albo osobny temat na: napisy w gra/src/main.ts (17 linii powiadomień/podpowiedzi: 10222–10225, 10343, 27127–27213, 47870–47876), gra/src/game/auto-build-gate.ts:112 (stała AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT), gra/src/game/city-administrator.ts:189, gra/data/city-administrator-params.json:23 i :27 (opis_gracza — także decyzja, czy tekst JSON ma zostać zmieniony, czy zostaje jako wiedza tylko dla miasta), gra/src/data/wikiBundle.json (generowany — regeneracja po zmianie JSON).
2. Aktualizacja testów przeglądarkowych poza allowlistą (zarzut Z3): gra/tools/improvement-admin-tooltip-real-render-test.cjs, gra/tools/administrator-panel-real-render-test.cjs, gra/tools/administrator-icon-everywhere-render-test.cjs.
3. Akceptacja założenia z Z4: panel ulepszeń państwa nie pokazuje już opisu JSON „w tym mieście” (zastąpiony tekstem o całym Państwie).
4. Tekst podpowiedzi o trybie auto (ulepszenia) — wiersz w panelu Państwa „Administrator państwa” nie wchodzi do „Netto” (bez zmian, zgodnie z rundą 1).

## RUNDY
2/5 (Operator, HAIKU). Zarzuty 1 i 3 wymagają decyzji orkiestratora (allowlista); 2 i 4 naprawione/domknięte w kodzie.

## NASTĘPNY KROK
Decyzja orkiestratora w sprawie BLOKAD 1–3: (A) rozszerzyć allowlistę o pliki z BLOKADY 1 i 2 i wystawić Operatora r3 (zmiany wyłącznie napisów + aktualizacja asercji), albo (B) zaakceptować obecny stan jako częściowy i wydzielić R-WEB-ADMIN-NAMES-REST-Q1 dla pozostałych plików. Po decyzji: Evaluator → Final Control.

DEPLOY/PUSH: NIE WYKONANO
