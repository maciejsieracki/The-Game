STATUS: PASS-WITH-NOTES (Evaluator nie wydaje werdyktu; 3 zarzuty niżej, żaden blokujący)
DOMAIN: GAME
TEMAT: R-WEB-UI-TOOLBAR-ZOOM-BEHIND-EXPANDED-PANELS-Q1
GOAL: kontrolki mapy (toolbar ikon, zoom/pełny ekran, minimapa) POD panelami rozwijanymi; jedno źródło prawdy dla warstwy.
ZMIANY/COMMIT: kandydat 519c2c3b70166f0dcd6bec69a95cd5545b73d727, baza 6ade0f0ec. Allowlista OK (git diff --name-only): hud.ts, hudLayout.ts, mapToolbarHud.ts, minimapHud.ts, gra/tools/map-controls-behind-panels-live-test.cjs, 10-operator-claude.md, 2 zrzuty evidence. Brak WERSJE.md/silnika/JSON. git diff --check czysty.
TESTY (odtworzone przeze mnie na kandydacie):
- tsc --noEmit: 0 błędów.
- logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.
- bottom-bar-hud-wykonaj-overlap-test 33/0.
- NOWY map-controls-behind-panels-live-test (Chromium, 860 px): PASS. Tabela: dyplomacja/miasta/nauka/armia/civpedia: zoom-dock nakłada się 4, panel pod punktem 4/4; minimapa 2/2; toolbar-ikony brak nakładania; budowa/imperium/rekrutacja-imperium brak nakładania.
- MUTACJA (git apply -R diffu gra/src): ten sam test CZERWONY — dyplomacja/miasta/nauka/armia zoom-dock 0/4 FAIL. Poprawka przywrócona (git checkout gra/src), drzewo czyste.
- Zrzut po-dyplomacja-860.png obejrzany: zoom/minimapa za panelem Dyplomacji; toasty/hint nad panelem.
- hint-toast-zindex-empire-panel-test: błąd bramki (main.ts nie zawiera oczekiwanej formuły) — main.ts poza diffem, więc dług bazowy (wniosek z diffu; na bazie nie uruchomiony). load-fail-toast-zindex-test 12 pass / 3 FAIL (szuka showHintMessage) — uruchomione na BAZIE 6ade0f0ec: te same 3 FAIL = dług bazowy, nie regresja.
- sidepanel-hud-deadzone-test: NIE_ZMIERZONO (przekroczył czas 110 s; panel prawy z-index 305, poza zakresem zmiany).
ZARZUTY:
1. (niski) Pokrycie testu: nie zmierzono okien modalnych i okien odkryć (wymienione w GOAL) ani panelu miasta w innych szerokościach; tabela obejmuje 8 paneli. NIE_ZMIERZONO.
2. (niski) Toolbar-ikony: w żadnym panelu nie wystąpiło nakładanie przy 860 px, więc zmiana dla toolbaru to tylko ujednolicenie stałej (310 -> 309), niedowiedziona testem nakładania; toolbar leży teraz pod .civ-hud (310) — nieszkodliwe (hud pointer-events:none), ale niezmierzone.
3. (informacyjny) Panel Dyplomacji jest półprzezroczysty: zoom-dock słabo przebija przez panel na zrzucie. Zgodne z wariantem "pod panelem", ale właściciel może to odebrać jako nadal widoczne. Zoom-dock traci też pierwszeństwo nad kartą jednostki (311) — świadoma decyzja operatora, zgłoszona.
Brak zarzutów dot. osłabionych testów (dodany nowy test, istniejące niezmienione).
BLOKADY: brak.
RUNDY: Evaluator 1/5
NASTĘPNY KROK: Obrona -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
