STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1
GOAL: spójna ikona administratora (pieczęć „A”, wariant z kilofem dla ulepszeń) w każdym miejscu, gdzie dziś jest tylko tekst; bez zmian mechaniki/kosztów/balansu.
BAZA: ed2fe849000ac2fd17474c2cab12b3a7c0116869 (origin/main, FALA 636)
KANDYDAT: 2d522b26a0577600702163c742c1dd962d8d9086 (jeden commit na bazie)

ZMIANY/COMMIT: 2d522b26a
ALLOWLISTA (wyliczona przed edycją): gra/src/main.ts, gra/src/ui/cityPanel.ts, gra/src/ui/sidePanelHud.ts
git diff --stat: 3 files changed, 31 insertions(+), 5 deletions(-); git diff --check czysty; git status: tylko 3 pliki allowlisty.
Zrobione:
  (2) powiadomienia: wpisy warEventLog z icon 'A' zmienione na 'ADM' (miasto/legacy) i 'ADM-IMP' (administrator ulepszeń; main.ts ok. 10200 i 47329). sidePanelHud.ts eventIconHtml renderuje pieczęć administratora (administratorIconHtml; wariant improvements dla ADM-IMP); CSS ADMINISTRATOR_ICON_CSS doklejany raz (id civ-adm-ic-css).
  (3, częściowo) nagłówek miasta: chip „Administrator ulepszeń” (data-imp-adm-chip) obok chipa administratora miasta, gdy zatrudniony; wiring cfg.getImprovementAdministratorState -> improvementAdministratorUiState w main.ts.
NIE WYKONANO w tej rundzie (przyjęte zarzuty):
  (1) wiersz utrzymania administratora z ikoną + liczbą w kartach/panelach miasta i imperium.
  (3) ujednolicenie istniejącego chipa administratora miasta (data-adm-chip) i ikona ulepszeń w przycisku „Administrator ulepszeń +” w nagłówku.
  (4) Civpedia/wiki hasło administratora z ikoną + regeneracja wikiBundle.
  Test render w Chromium (prawdziwy panel), zrzuty i test „Administratorzy OFF -> brak ikony/wiersza”.

TESTY (surowe wyniki, na 2d522b26a):
  tsc --noEmit: EXIT 0 (przed i po zmianach)
  city-administrator-test: 117 passed, 0 failed (EXIT 0)
  city-administrator-economy-test: 72 passed, 0 failed (EXIT 0)
  improvement-administrator-test: 53 passed, 0 failed (EXIT 0)
  administrators-wizard-test: 58 passed, 0 failed (EXIT 0)
  ids-leak-audit-test: WYNIK 1641 ok, 0 FAIL (EXIT 0)
  wonder-text-no-raw-ids-test: WYNIK 132 ok, 0 FAIL (EXIT 0)
  npm ci --ignore-scripts w gra/: EXIT 0 (bez npm run build/dev).
  NIE_ZMIERZONO: 5 bramek referencyjnych w pełnym zakresie dispatchu, test render Chromium, vite build (poza repo), zrzuty.

BLOKADY: część zakresu (punkty 1, 4 i test Chromium) nie została zrobiona w tej rundzie. Decyzja o kontynuacji należy do orkiestratora.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
  Z1 (kandydat == origin/main): PRZYJMUJĘ. Ed2fe849 był bazą; kod Operatora to 2d522b26a. Kandydatem do oceny jest 2d522b26a.
  Z2 (brak ikony w wierszu utrzymania kart/paneli): PRZYJMUJĘ, NIE WYKONANO w tej rundzie.
  Z3 (powiadomienia bez ikony): PRZYJMUJĘ, POPRAWIONE w 2d522b26a (main.ts + sidePanelHud.ts).
  Z4 (brak ikony ulepszeń w nagłówku / chip niezunifikowany): PRZYJMUJĘ częściowo: dodano chip administratora ulepszeń; ujednolicenie chipa miasta NIE WYKONANO.
  Z5 (Civpedia/wiki): PRZYJMUJĘ, NIE WYKONANO.
  Z6 (brak testu Chromium i dowodu mutacyjnego): PRZYJMUJĘ, NIE WYKONANO.
  Z7 (bramki NIE_ZMIERZONO): PRZYJMUJĘ dla części: wyniki powyżej są zmierzone na 2d522b26a; pozostałe bramki NIE_ZMIERZONO.
  Z8 (brak 00-dispatch.md na origin/main): ODRZUCAM jako błąd Operatora. Dispatch podano w treści zadania, a DODATEK-claude.md istnieje na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (git show zwrócił 5 linii). Plik 00-dispatch.md nie istnieje na origin/main w tej ścieżce (fatal: path does not exist). To stan repo, nie błąd Operatora.

NASTĘPNY KROK: Evaluator ponownie na 2d522b26a; przy FAIL kolejna runda dla punktów 1, 3 (ujednolicenie), 4 i testu Chromium.
RUNDY: 1/5 (obrona)
DEPLOY/PUSH: NIE WYKONANO
