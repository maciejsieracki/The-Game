STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1
GOAL: spójna ikona administratora (pieczęć „A”, wariant z kilofem dla ulepszeń) w każdym miejscu, gdzie dziś jest tylko tekst; bez zmian mechaniki, kosztów i balansu (runda 2, po FC r1 FAIL).
BAZA/KANDYDAT: a5f73bd68 (origin/main; kod rundy 1 = 2d522b26a, zachowany, nie cofany).
ALLIANCE/ZAKRES RUNDY 2 (wyliczony przed edycją): gra/src/main.ts, gra/src/ui/cityPanel.ts, gra/src/ui/empireDetailPanel.ts, gra/src/ui/hud.ts, gra/src/ui/icons/administratorIcon.ts, gra/src/ui/markdownLite.ts, gra/src/data/wikiBundle.json (regeneracja generatorem), gra/tools/administrator-icon-everywhere-render-test.cjs (nowy), docs/encyklopedia/indeks.md, docs/encyklopedia/pojecia/administrator-miasta.md, docs/encyklopedia/pojecia/administrator-ulepszen.md (nowy), dyspozycje/autobot/runs/R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1/10-operator-claude.md.

ZMIANY/COMMIT: czubek = SHA commita tej rundy (patrz pole sha w odpowiedzi orkiestratora). Zawiera tylko pliki z listy powyżej (git add ścieżka po ścieżce, bez -A).

Punkty DO NAPRAWY z FC r1 — stan:
  (1) WYKONANE: wiersz „Utrzymanie administratorów” z ikoną + kwotą:
      - panel miasta, bilans miasta (appendCitySkarbiecBalance): wiersz „Utrzymanie administratorów (to miasto)”, wartość = administratorUpkeepValueHtml (ikona pieczęci + „−N”), 0 -> „—”.
      - panel imperium, karta „Skarbiec imperium” (buildTopBarZlotoDetailCard): wiersz „Utrzymanie administratorów” (gImp) oraz wiersz „Ten gród” (gCity).
      - podsumowanie imperium (empireDetailPanel, cityEconMiniSkarbiec): wiersz „Utrzymanie administratorów” po „Utrzymanie jednostek”.
      - dane: nowe pola bogactwoUtrzymanieAdministratorow (empire) i utrzymanieAdministratora (city) wypełniane z utrzymania już liczonego w silniku (UpkeepBalance.utrzymanieAdministratorow / administratorUpkeepForCity + improvementAdministratorUpkeepForCity). Mechanika bez zmian.
  (2) WYKONANE (unifikacja): chip „Administrator” (miasto) i chip „Administrator ulepszeń” budowane tą samą funkcją administratorChipInnerHtml(variant, working, label): ta sama ikona, rozmiar 18 px, klasa .civ-adm-ic, stany ok/idle. Różnica zostaje tylko w wariancie (city/improvements, kilof) i w etykiecie.
  (3) WYKONANE (Civpedia): hasło administrator-miasta.md z ikoną (znacznik {{ikona-administratora}} w Wiki-S); NOWE hasło administrator-ulepszen.md z ikoną z kilofem ({{ikona-administratora-ulepszen}}) i wpis w indeks.md; wikiBundle.json REGENEROWANY generatorem gra/tools/bundle-wiki-for-game.cjs (wynik: 22 rozdz. + 174 hasła, ~1191 KB). Renderer markdownLite.ts zamienia znacznik na ikonę SVG (bez HTML w md).
  (4) WYKONANE CZĘŚCIOWO: nowy test Chromium gra/tools/administrator-icon-everywhere-render-test.cjs (22 PASS / 0 FAIL). Test renderuje PRAWDZIWE funkcje appendCitySkarbiecBalance i cityEconMiniSkarbiec oraz helpery ikon i markdownToHtml w przeglądarce. Przypadek „Administratorzy OFF” jest pokryty przez wartość 0 (silnik zwraca 0, gdy brak zatrudnionego administratora / opcja wyłączona): wiersz miasta i wiersz imperium bez ikony, wartość „—”.

NIE WYKONANE / NIE_ZMIERZONO (uczciwie):
  - chip nagłówka miasta (renderTopBarGarrison) nie jest renderowany w teście — funkcja prywatna; zmiana w nim ogranicza się do wywołania wspólnego helpera. NIE_ZMIERZONO w Chromium.
  - przypadek OFF dla chipa nagłówka (brak chipa przy opcji „Administratorzy” wyłączonej) — NIE_ZMIERZONO w przeglądarce; logika bramki (cityAdministratorUiState/improvementAdministratorUiState zwracają null przy OFF) jest w kodzie bez zmian.
  - zrzuty ekranu: nie zrobiono (ADM_ICON_SHOTS_DIR nie ustawiono) — NIE_ZMIERZONO.
  - test mutacyjny (czy test padnie po usunięciu ikony): NIE_ZMIERZONO.
  - przycisk „Administrator ulepszeń +” w nagłówku pozostaje tekstowy (dispatch wymienia tylko chip w nagłówku, nie przycisk zatrudnienia) — NIE zmieniano.
  - ZAŁOŻENIE: utrzymanie administratorów jest już wliczone w bilans netto (withAdministratorUpkeep w turn-economy.ts); nowy wiersz jest informacyjny i nie zmienia sum. Nie weryfikowano w grze, że liczby w wierszu zgadzają się z pasku HUD po turze.
  - ZAŁOŻENIE: wiersz w karcie „Skarbiec imperium” bierze wartość z _lastBogactwoUtrzymanieAdministratorow ustawianej w ścieżce podglądu (previewOwnerUpkeep) i w ścieżce aktywnego fotela (hBalance); nie sprawdzono, że obie ścieżki dają tę samą liczbę.

TESTY (surowe wyniki, na drzewie z tą rundą; liczby z wyjścia narzędzi):
  npm ci --ignore-scripts (gra/): EXIT 0 (bez npm run build/dev)
  npx tsc --noEmit (gra/): EXIT 0 (sprawdzone po wszystkich edycjach kodu)
  node tools/city-administrator-test.cjs: 117 passed, 0 failed, EXIT 0
  node tools/city-administrator-economy-test.cjs: 72 passed, 0 failed, EXIT 0
  node tools/improvement-administrator-test.cjs: 53 passed, 0 failed, EXIT 0
  node tools/administrators-wizard-test.cjs: 58 passed, 0 failed, EXIT 0
  node tools/ids-leak-audit-test.cjs: WYNIK: 1648 ok, 0 FAIL, EXIT 0 (było 1641 w rundzie 1; +7 z nowych haseł/tekstów)
  node tools/wonder-text-no-raw-ids-test.cjs: WYNIK: 132 ok, 0 FAIL, EXIT 0
  5 bramek referencyjnych:
    logic-test.cjs: LOGIC OK (213/213), EXIT 0
    tech-tree-test.cjs: 20 pass, 0 fail, EXIT 0
    research-test.cjs: PASSED: 33 / FAILED: 0 / TOTAL: 33, EXIT 0
    unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21), EXIT 0
    combat-test.cjs: COMBAT TEST: 6/6 pass, EXIT 0
  resource-icons-everywhere-test.cjs: Wynik: 10 PASS, 0 FAIL, EXIT 0
  resource-icons-everywhere-render-test.cjs: 13 PASS, 0 FAIL, EXIT 0
  administrator-icon-everywhere-render-test.cjs (nowy): 22 PASS, 0 FAIL, EXIT 0
  vite build (poza repo): NIE uruchamiano w tej rundzie — NIE_ZMIERZONO.
  git diff --check: czysto (bez wyjścia).

BLOKADY: brak blokad procesowych. Otwarte: punkty NIE_ZMIERZONO wymienione wyżej (chip nagłówka w Chromium, OFF dla chipa, zrzuty, test mutacyjny, weryfikacja zgodności liczb z HUD po turze).

RUNDY: 2/5 (operator). Poprzednia runda: FAIL (30-obrona-claude.md, EVALUATOR r1).

NASTĘPNY KROK: Evaluator (Sonnet) na czubku tej rundy; FC po PASS; integracja orkiestratora (sprawdzić merge-base kodu operatora i diff --stat przed integracją).

DEPLOY/PUSH: NIE WYKONANO
