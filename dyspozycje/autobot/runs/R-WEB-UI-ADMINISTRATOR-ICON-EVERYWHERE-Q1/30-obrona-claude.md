STATUS: PASS-WITH-NOTES (obrona rundy 3; kod poprawiony na zarzuty 1, 3, 4; zarzut 2 i 5 częściowo; zarzut 6 odrzucony jako poza kryteriami)
DOMAIN: GAME
TEMAT: R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1
GOAL: ikona administratora wszędzie tam, gdzie był tekst; bez zmian mechaniki; opcja „Administratorzy” OFF -> brak ikony i brak wiersza administratora.
ZMIANY-COMMIT: baza/kandydat 7791e8b3b (detach); commit obrony = SHA w polu sha odpowiedzi orkiestratora (kod ponad 7791e8b3b).
  Allowlista obrony: gra/src/main.ts, gra/src/ui/cityPanel.ts, gra/src/ui/empireDetailPanel.ts, gra/tools/administrator-icon-everywhere-render-test.cjs, dyspozycje/autobot/runs/R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1/30-obrona-claude.md, dyspozycje/autobot/runs/R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1/evidence/administrator-icon-everywhere.png.
  Diff źródeł: 3 pliki (main.ts, cityPanel.ts, empireDetailPanel.ts) + test. wikiBundle, docs/encyklopedia i chip nagłówka NIE zmienione w tej obronie.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
  1. PRZYJMUJĘ. Bramka OFF u źródła: main.ts — `bogactwoUtrzymanieAdministratorow: administratorsEnabled ? Math.floor(...) : undefined` (snapshot HUD imperium) oraz `utrzymanieAdministratora: !administratorsEnabled ? undefined : (...)` (snapshot miasta). Panele dodają wiersz tylko gdy wartość !== undefined: cityPanel.ts appendCitySkarbiecBalance (spread warunkowy w tablicy rows), buildTopBarZlotoDetailCard (gImp i gCity, if-guard), empireDetailPanel.ts cityEconMiniSkarbiec (`if (utrzA !== undefined)`). ON bez administratora = wartość 0 -> wiersz „—” bez ikony; OFF = brak wiersza. Dowód: test B/C „OFF: BRAK wiersza” PASS.
  2. CZĘŚCIOWO. Test OFF używa teraz realnego stanu OFF z gry (snapshot bez wartości = undefined), a nie samego 0. Chip nagłówka miasta (renderTopBarGarrison, funkcja prywatna) NIE jest renderowany w teście — NIE_ZMIERZONO w Chromium. Bramka chipa OFF jest w kodzie main.ts (cityAdministratorUiState / improvementAdministratorUiState: `if (!administratorsEnabled && isHuman(city.ownerId)) return null`, ok. l.10271 i l.10319) — dowód kodowy, nie testowy. Nie dopisano testu chipa w tej obronie; zostaje NIE_ZMIERZONO.
  3. PRZYJMUJĘ. Zrzut: dyspozycje/autobot/runs/R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1/evidence/administrator-icon-everywhere.png (202861 B), wygenerowany przez ADM_ICON_SHOTS_DIR=<evidence> przy uruchomieniu testu. Uwaga: to zrzut stanowiska testowego z prawdziwymi funkcjami renderu, nie zrzut żywej gry.
  4. PRZYJMUJĘ. `_lastBogactwoUtrzymanieAdministratorow = 0` dodane w dwóch brakujących blokach resetu (main.ts, obok `_lastBogactwoUtrzymanieJednostek = 0`, ok. l.45241 i l.47191); teraz wszystkie 3 bloki resetu mają to samo pole.
  5. CZĘŚCIOWO / NIE_ZMIERZONO. Wiersz używa administratorUpkeepValueHtml (ikona 14 px + „−N”), a nie resourceAmountChipHtml; zgodności wizualnej z chipami surowców nie zmieniano. Liczba: źródłem jest ta sama suma co bilans (administratorUpkeepForCity + improvementAdministratorUpkeepForCity, main.ts ok. l.9025; hBalance.utrzymanieAdministratora w ścieżce aktywnego fotela). Zgodność z paskiem HUD po turze oraz ścieżek preview/hBalance: NIE_ZMIERZONO.
  6. ODRZUCAM jako poza kryteriami. Wyszukiwarka Civpedii filtruje surowy tekst hasła; kryterium dotyczy renderu ikony w treści hasła (test D: markdownToHtml zamienia {{ikona-administratora}} i {{ikona-administratora-ulepszen}}, PASS). Wygląd w przeglądarce i wpływ na wyszukiwarkę: NIE_ZMIERZONO.

ZMIANA KODU (ponad rundę 2):
  - gra/src/main.ts: gating OFF u źródła dwóch pól (HUD imperium, snapshot miasta); reset `_lastBogactwoUtrzymanieAdministratorow = 0` w brakujących blokach.
  - gra/src/ui/cityPanel.ts: wiersz bilansu miasta oraz wiersze karty Skarbiec (imperium i gród) tylko przy wartości !== undefined.
  - gra/src/ui/empireDetailPanel.ts: wiersz podsumowania imperium tylko przy wartości !== undefined.
  - gra/tools/administrator-icon-everywhere-render-test.cjs: przypadek OFF = undefined (brak wiersza, miasto i imperium), przypadek ON/0 = „—” bez ikony. Wynik 24 PASS / 0 FAIL (poprzednio 22).
  Mechanika, koszty, balans: bez zmian (zmienia się tylko, czy wiersz/ikona jest w DOM).

TESTY (surowe wyniki z tego uruchomienia, worktree po obronie):
  npm ci --ignore-scripts (gra/): EXIT 0
  npx tsc --noEmit (gra/): EXIT 0 (pusty wynik)
  administrator-icon-everywhere-render-test.cjs: "administrator-icon-everywhere: 24 PASS, 0 FAIL", EXIT 0 (+ zrzut evidence/)
  city-administrator-test: 117 passed, 0 failed, EXIT 0
  city-administrator-economy-test: 72 passed, 0 failed, EXIT 0
  improvement-administrator-test: 53 passed, 0 failed, EXIT 0
  administrators-wizard-test: 58 passed, 0 failed, EXIT 0
  ids-leak-audit-test: WYNIK: 1648 ok, 0 FAIL, EXIT 0
  wonder-text-no-raw-ids-test: WYNIK: 132 ok, 0 FAIL, EXIT 0
  logic-test: LOGIC OK (213/213), EXIT 0
  tech-tree-test: 20 pass, 0 fail, EXIT 0
  research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33, EXIT 0
  unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), EXIT 0
  combat-test: COMBAT TEST: 6/6 pass, EXIT 0
  resource-icons-everywhere-test: Wynik: 10 PASS, 0 FAIL, EXIT 0
  resource-icons-everywhere-render-test: 13 PASS, 0 FAIL, EXIT 0
  NIE uruchamiano: vite build / npm run build (zakaz w gra/); zrzutów żywej gry.
  NIE_ZMIERZONO: chip nagłówka w Chromium (także OFF), zgodność liczb z HUD po turze, test mutacyjny w tej obronie.

BLOKADY: brak procesowych.
RUNDY: 3/5 (obrona). Poprzednio: EVALUATOR r2 PASS-WITH-NOTES (zarzuty 1-6), FC r1 FAIL.
NASTĘPNY KROK: Evaluator r3 na commicie obrony (zarzuty 1, 3, 4 do potwierdzenia; 2 i 5 jako NIE_ZMIERZONO/częściowo); potem Final Control; integracja orkiestratora (merge-base z kodem obrony, diff --stat).
DEPLOY/PUSH: NIE WYKONANO
