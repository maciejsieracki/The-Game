STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-LEFT-BANNER-OVERFLOW-NARROW-WINDOW-Q1
GOAL: lewy baner nie wychodzi poza okno przy 1366/1280/1024 px; układ szeroki bez zmian.
ZMIANY/COMMIT: gra/src/ui/cityPanel.ts (CSS .civ-v-w3-chips-flank: flex-wrap:wrap, flex:0 1 auto, max-width:100%; .civ-v-top-flank-row min-width:0; .civ-v-top-stack max-width 1280->1480px), gra/src/ui/cityUxFrame.ts (linia 73: max-width stosu 1280->1480px), nowy test gra/tools/left-banner-overflow-narrow-test.cjs, evidence/ (zrzuty przed/po).
ZAŁOŻENIA (luki): DODATEK orkiestratora (00-dispatch-DODATEK-claude.md) nie istnieje na wskazanych gałęziach; zadanie wzięte z 00-dispatch.md. Baner mapy (hud.ts, układ A) wg hud-topbar-layout-a-test przy 1366/1280/1024 NIE przekracza okna (clipped=[], docOverflow=false) — to nie on wychodził. Zmierzona przyczyna: górny pas WIDOKU MIASTA (.civ-v-w3-chips-left/right), nowrap + flex:0 0 auto => lewy baner l=-21/-64/-190 px, prawy r=1387/1344/1218 px (okno 1366/1280/1024). Treść/wartości HUD bez zmian; Z_MAP_CONTROLS nietknięte.
TESTY (surowe wyjście): tabela po poprawce (lewy l..r | prawy l..r | scrollW): 2000: 296..961 | 1200..1704 | 2000 (h=53, identycznie jak przed); 1366: 14..639 | 878..1352 | 1366; 1280: 13..589 | 829..1267 | 1280; 1024: 12..443 | 683..1012 | 1024. Przed (mutant): 1366: -21..644 | 883..1387; 1280: -64..601 | 840..1344; 1024: -190..474 | 714..1218.
 left-banner-overflow-narrow-test.cjs: PASS=41 FAIL=0; mutant (cofnięcie CSS): PASS=36 FAIL=6 (czerwieni l>=0 i r<=okno w 1366/1280/1024). Zrzuty obejrzane: evidence/przed-*.png vs po-*.png (2000x900, 1366x768, 1280x720, 1024x768).
 city-side-panels-below-topbanners-test: 61/0. hud-topbar-layout-a-test: 144 ok 0 fail. hud-panels-below-banner-test: 119 ok 0 fail. tsc --noEmit: 0 błędów. logic 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6.
BLOKADY: brak (DODATEK nieobecny — założenie wyżej). Przy 1024 baner zawija się do 3 rzędów (h=142 px), panele boczne schodzą pod niego istniejącym fitCitySideTop — test to sprawdza.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (potwierdzić, że „lewy baner HUD" w zgłoszeniu = pas miasta; jeśli chodzi o baner mapy — potrzebny odtwarzalny scenariusz).
DEPLOY/PUSH: NIE WYKONANO
