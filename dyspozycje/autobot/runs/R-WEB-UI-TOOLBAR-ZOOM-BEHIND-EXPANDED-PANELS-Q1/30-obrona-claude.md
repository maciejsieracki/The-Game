STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TOOLBAR-ZOOM-BEHIND-EXPANDED-PANELS-Q1
GOAL: kontrolki mapy (toolbar ikon, zoom/pełny ekran, minimapa) leżą POD panelami rozwijanymi; jedno źródło prawdy dla warstwy (Z_MAP_CONTROLS w hudLayout.ts).
ZMIANY/COMMIT: brak zmian kodu w obronie (kandydat 519c2c3b70166f0dcd6bec69a95cd5545b73d727 bez zmian). Start obrony od 588aab81f (kandydat + raport Evaluatora). Zacommitowany tylko ten plik.

ODPOWIEDZI NA ZARZUTY
1. (pokrycie: modale i okna odkryć, panel miasta tylko 860 px) — ODRZUCAM jako blokadę, PRZYJMUJĘ jako notatkę.
   Dowód statyczny: audyt `grep z-index:` w gra/src dla zakresu 200-310 zwraca wyłącznie: cityUxFrame.ts:59 (298, ramka widoku miasta), sidePanelHud.ts:196 (305, panel prawy, poza strefą kontrolek lewych), HUD-y 310 (leaderBannersHud, contextPanelHud, bottomBarHud, buildModeHud, hud.ts) oraz main.ts:33019/33046 (200, etykiety debug z pointer-events:none). Żadne okno modalne ani okno odkryć nie ma z-index <= 309, więc leży nad Z_MAP_CONTROLS=309 z konstrukcji. Nie dopisałem testu live dla modali (brak stabilnego haka otwarcia modala w trybie testowym). NIE_ZMIERZONO: elementFromPoint dla modali i okien odkryć oraz innych szerokości.
2. (toolbar ikon: brak nakładania przy 860 px, zmiana 310->309 niedowiedziona) — PRZYJMUJĘ jako notatkę, bez poprawki.
   Ponowny przebieg testu (moje wyjście): toolbar-ikony "brak nakładania" w wszystkich 8 panelach. Zmiana 310->309 to ujednolicenie do stałej; toolbar był już pod panelami listowymi (311). .civ-hud (310) ma pointer-events:none wg Evaluatora, więc leżenie toolbaru pod nim jest nieszkodliwe. Nakładanie toolbaru dla węższych okien: NIE_ZMIERZONO.
3. (panel Dyplomacji półprzezroczysty) — ODRZUCAM.
   Dowód: gra/src/ui/diploListHud.ts:135-137 `background:linear-gradient(180deg,rgba(8,10,18,.97),rgba(6,8,14,.94))` — krycie 94-97%. Zrzut evidence/po-dyplomacja-860.png (obejrzany): zoom i minimapa za panelem widoczne tylko jako ledwo zauważalny cień; wariant "pod panelem" zgodny z GOAL. Utrata pierwszeństwa nad kartą jednostki (311) to decyzja operatora zgodna z GOAL (karta jednostki = panel rozwijany).

TESTY (surowe wyjście, ten worktree):
- npm ci --ignore-scripts OK.
- node tools/map-controls-behind-panels-live-test.cjs (860 px): PASS. dyplomacja/miasta/nauka/armia/civpedia: zoom-dock nakłada się 4, panel pod punktem 4/4 OK; minimapa 2/2 OK; toolbar-ikony brak nakładania; budowa/imperium/rekrutacja-imperium brak nakładania.
- Pozostałe bramki (tsc, logic, tech-tree, research, unit-replace, combat, bottom-bar) nie powtarzane w obronie: kod bez zmian od wyniku Evaluatora (tsc 0, 213/213, 20/0, 33/33, 21/21, 6/6, 33/0).
- Dług bazowy: hint-toast-zindex-empire-panel-test, load-fail-toast-zindex-test (3 FAIL na bazie 6ade0f0ec); sidepanel-hud-deadzone-test NIE_ZMIERZONO (timeout).
BLOKADY: brak
RUNDY: Obrona 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
