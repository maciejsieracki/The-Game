STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-NOTIF-OTHER-CIV-EVENTS-TO-DIPLOMACY-TAB-Q1
GOAL: Wydarzenia między innymi cywilizacjami (gracz nie jest stroną) trafiają do zakładki „Dyplomacja”. Przypadek: kapitulacja z głodu Chengdu/Chongqing przejęta przez Rzymian.
ZMIANY-COMMIT: baza 64106fee. Zmienione: gra/src/ui/sidePanelEventTabs.ts (captureEventOrigin), gra/src/main.ts (import + predykat w kapitulacji głodowej), gra/tools/notif-other-civ-diplo-tab-test.cjs. Commit: pole sha.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. Allowlista (eot-event-defer.ts): PRZYJMUJĘ. Zmiana w eot-event-defer.ts jest konieczna: bez propagacji origin w deferredHintsToSidePanelEvents wpis gubi znacznik. Dowód: mutacja (5b) w teście cofa klasyfikację do „wazne". Nie usuwałem zmiany. Decyzja o akceptacji poza allowlistą należy do orkiestratora.
2. Test tekstowy (4): PRZYJMUJĘ i naprawiam. Logikę przeniesiono do czystej funkcji captureEventOrigin(oldOwnerIsHuman, newOwnerIsHuman), testowanej zachowaniowo (4a–4d). Pozostaje tylko strażnik wiringu w main.ts (4e, 4f), bo boot() nie da się wywołać w teście.
3. Zakres tylko kapitulacji głodowej: PRZYJMUJĘ jako zakres świadomie zawężony. Nie rozszerzałem zmiany na inne ścieżki. Dowód: w main.ts 26452 („Miasto-państwo wchłonięte do imperium") to toast po akceptacji oferty w dyplomacji, nie zdarzenie przejęcia, więc wymaga osobnej analizy stron. Pozostałe zdarzenia eliminacji idą przez recordCivElimEvent (osobne karty). Kandydat na osobny temat (patrz UWAGI).
4. Wpisy other-civs poza nagłówkiem: ODRZUCAM jako defekt. Dowód: sidePanelEventFilter.ts:18 i :58 ukrywają origin='other-civs' poza zakładką Dyplomacja i nie liczą ich do nagłówka. To istniejące zachowanie handlu AI↔AI, nie regresja tej zmiany. Brak zmiany kodu.
5. Zrzut Chromium: PRZYJMUJĘ jako pominięty krok opcjonalny. NIE ZMIERZONO w przeglądarce.
Test (f) end-turn-block-event-test: przedistniejące. Na ea43bc32 regex nie pasuje (offset gałęzi NNS = 2690 > okno 2500 znaków). Diff nie dotyka tego obszaru.

TESTY (surowe wyniki, po poprawkach):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test: 21 OK (ostatnie [OK] potwierdzone, exit 0)
- combat-test: COMBAT TEST: 6/6 pass
- notif-other-civ-diplo-tab-test (nowy): 13 OK, 0 FAIL, exit 0 (mutacja (5b) wykryta)
- sidepanel-notification-tabs-test: 29 pass, 0 fail
- sidepanel-event-tabs-classify-test: PASS (mutacja wykryta)
- eot-event-defer-test: 43/43 PASS
- notif-diplo-tab-count-blocking-test: 25 OK, 0 FAIL
- side-panel-event-link-test: 37 pass, 0 fail
- end-turn-block-event-test: passed=34 failed=1 (f, przedistniejące, patrz wyżej)

BLOKADY: brak dla tej rundy. Zrzut Chromium nie wykonany (NIE ZMIERZONO).

RUNDY: 2/5

NASTĘPNY KROK: Evaluator (runda 2), weryfikacja poprawek 1–5 i testu (4e/4f).

UWAGI-DLA-ORKIESTRATORA:
- Kandydat na osobny temat: zdarzenia AI↔AI (eliminacja, rebelia, annex) bez origin.
- Wpisy other-civs poza nagłówkiem: zachowanie istniejące (p. 4).

DEPLOY/PUSH: NIE WYKONANO
