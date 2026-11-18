# R-WEB-UI-CIV-WELCOME-SCREEN-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI nowy ekran, bez zmian reguł gry)
TEMAT: R-WEB-UI-CIV-WELCOME-SCREEN-Q1 — ekran „Odkryłeś nową cywilizację”
GOAL: pierwszy kontakt z cywilizacją pokazuje ekran RAZ; ekran ma nazwę, ikonę/portret, rys, plusy/minusy, jednostkę, styl, religię, powitanie władcy (przyjazne/nieprzyjazne) z podpisem oraz przyciski Audiencja i Zamknij; przycisk „O cywilizacji” w audiencji otwiera ten sam ekran bez zmiany stanu audiencji; Esc i tło = Zamknij; ekran czeka w kolejce okien.
ZMIANY/COMMIT: baza c8b0e498b; nowe: gra/src/ui/civWelcomeLogic.ts (czysta logika), gra/src/ui/civWelcomeScreen.ts (DOM), gra/tools/civ-welcome-screen-test.cjs (test); zmienione: gra/src/main.ts (ścieżka pierwszego kontaktu, kolejka, callback „O cywilizacji”, migracja zapisu), gra/src/ui/diplomacyAudience.ts (przycisk „O cywilizacji” + wiring + CSS). Nie dotknięto save.ts (flaga już zapisywana w meta), civs.json, units.json, civ-intro-texts.json. Commit: patrz pole sha w odpowiedzi orkiestratora.
TESTY:
- tsc --noEmit: EXIT 0 (ZMIERZONO)
- logic-test: LOGIC OK 213/213
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33
- unit-replace-test: 21/21
- combat-test: 6/6
- civ-intro-texts-test: OK (15 cywilizacji, 90 powitań)
- civ-welcome-screen-test (nowy): OK, 303 asercje (15 cywilizacji: treść, bez surowych ID, 3 powitania, deterministyczny wybór, 3 warianty po ziarnach, nastawienie, flaga „raz”, migracja)
- mutacja A (flaga „raz” zdjęta, na kopii poza repo): 1 FAIL — złapana
- mutacja B (jedno powitanie zamiast 3, na kopii): 1 FAIL — złapana
- vite build: NIE ZMIERZONO — polecenie zablokowane przez klasyfikator uprawnień (bez obejścia)
- żywy Chromium / zrzuty 2 cywilizacji: NIE ZMIERZONO — brak buildu i harnessu; wymaga zgody/buildu orkiestratora

BLOKADY: brak twardych. Build vite i Chromium do zrobienia przez orkiestratora (poza tym tematem).

RUNDY: 1/5

NASTĘPNY KROK: orkiestrator: build vite poza repo (node ./node_modules/vite/bin/vite.js build --outDir <tmp> --emptyOutDir) i ręczna weryfikacja w przeglądarce (pierwszy kontakt, Esc, tło, „O cywilizacji”, dwie cywilizacje: przyjazna i nieprzyjazna).

DEPLOY-PUSH: NIE WYKONANO

ZAŁOŻENIA (luki rozstrzygnięte w raporcie):
1. Nastawienie: przyjazne = etykieta z nastawienieLabelFromScore(Zaufanie, Respekt efektywny, atWar) ∉ {Wrogi, Nieufny}; praktycznie próg Zaufania 30 i brak wojny (diplomacy-display.ts: NASTAWIENIE_PROG_NIEUFNY_ZAUFANIE = 30, NASTAWIENIE_PROG_WROGI_ZAUFANIE = 10).
2. Plusy/minusy: z civ-matrix.json — niezerowe parametry gracza (walka_, eko_, prod_, lud_, mp_), 39 etykiet po polsku (CIV_PARAM_LABELS); parametry dip_/ai_/meta_ pominięte jako wewnętrzne. Wzrost kosztów (budynki, jednostki, rekrutacja) = minus. Na karcie 3 plusy i 2 minusy, reszta w tooltipie (zasada „najważniejsze na wierzchu”).
3. Podpis władcy: leaderName(klucz, epoka rozmówcy = empireEpochForOwner).
4. Flaga „raz”: istniejąca meta.diplomaticDiscoveryPopupShown. Migracja: zapis bez pola → cywilizacje już znane są oznaczane jako pokazane (legacyShownMigration). Zapis z polem nie jest migrowany.
5. Ekran powitalny zastępuje dotychczasowe automatyczne otwieranie audiencji przy pierwszym kontakcie. „Audiencja” otwiera audiencję jak dotąd; brak danych cywilizacji → dotychczasowa audiencja.
6. Muzyka: przy pierwszym kontakcie startDiplomacyMusic (przywitanie + negocjacje), zatrzymywane przy zamknięciu; przy „O cywilizacji” bez zmiany muzyki.
7. Przycisk „O cywilizacji” umieszczony na karcie rozmówcy w audiencji (nie na liście dyplomacji) — allowlista dopuszcza tylko diplomacyAudience.ts.
8. Kolejka: jeden ekran naraz; kolejne karty czekają (isCivWelcomeScreenOpen); zamknięcie wznawia kolejkę.

UWAGI-DLA-ORKIESTRATORA:
- Zmiana zachowania: pierwszy kontakt nie otwiera już audiencji automatycznie — pokazuje ekran powitalny (zgodnie z celem tematu). Warto potwierdzić u właściciela, że to właściwa kolejność.
- Brak zrzutów Chromium: NIE ZMIERZONO (patrz TESTY).
- Plusy/minusy opierają się na macierzy 93 parametrów; etykiety są moimi tłumaczeniami — do przeglądu tekstowego razem z TEKSTY-DO-AKCEPTACJI.md.
- Nie uruchamiałem żadnych nowych sesji, zadań ani harmonogramów.
