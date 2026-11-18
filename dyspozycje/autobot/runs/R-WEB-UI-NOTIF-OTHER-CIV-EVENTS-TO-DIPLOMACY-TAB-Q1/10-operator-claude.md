STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-NOTIF-OTHER-CIV-EVENTS-TO-DIPLOMACY-TAB-Q1
GOAL: Wydarzenia między innymi cywilizacjami (gracz nie jest stroną) trafiają do zakładki „Dyplomacja”, nie „Ważne". Pierwszy przypadek: kapitulacja z głodu Chengdu/Chongqing przejęta przez Rzymian.

ZMIANY/COMMIT: baza ea43bc32bf59ab0eb111107c8d1ae1681d2dca89. Allowlista: gra/src/game/eot-event-defer.ts (pole origin w DeferredEotHint, propagacja do wpisu), gra/src/main.ts (ctx showHintMessage + origin w kapitulacji głodowej, warunek !isHuman(oldOwner) && !isHuman(newOwner)), gra/tools/notif-other-civ-diplo-tab-test.cjs (nowy test). Brak zmian w sidePanelEventTabs.ts (klasyfikacja już reguła origin='other-civs' → dyplomacja). Commit: SHA w polu sha.

ZMIERZONO (przyczyna): kapitulacja głodowa wołała showHintMessage bez origin, więc hint EOT trafiał do wpisu kind:'info' bez origin; eventTabOf dopasowywał „kapitulac" w IMPORTANT_RE → „Ważne". Funkcja isHuman(ownerId) istnieje w main.ts (ta sama domknięta scope).

TESTY (surowe wyniki):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST: 6/6 pass
- notif-other-civ-diplo-tab-test (nowy): 9 OK, 0 FAIL (w tym mutacja w pamięci cofająca propagację origin → wpis wraca do „wazne")
- sidepanel-notification-tabs-test: 29 pass, 0 fail
- sidepanel-event-tabs-classify-test: PASS
- eot-event-defer-test: 43/43 PASS
- notif-diplo-tab-count-blocking-test: 25 OK, 0 FAIL
- side-panel-event-link-test: 37 pass, 0 fail
- end-turn-block-event-test: passed=34 failed=1. FAIL (f) „hintEndTurnBlocked zapisuje próbę w gałęzi NNS" — PRE-EXISTING: regex nie pasuje też do main.ts z ea43bc32 (sprawdzone), niezwiązane z tą zmianą.

NIE ZMIERZONO: zrzut panelu PRZED/PO w Chromium (krok 5 opcjonalny, pominięty); testy wizualne w przeglądarce.

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator — przegląd klasyfikacji (czy inne miejsca „Ważne" z udziałem obcych cywilizacji, np. podbój AI↔AI/eliminacja przy showHintMessage, mają być objęte; w tej rundzie zakres ograniczony do kapitulacji głodowej).

UWAGI-DLA-ORKIESTRATORA: (1) Inne wywołania showHintMessage z komunikatami przejęcia między cywilizacjami (rebelia, eliminacja, podbój AI↔AI) nie dostały origin — świadomie poza zakresem, wg dispatchu minimalnie. (2) Wpisy origin='other-civs' są ukrywane poza zakładką „Dyplomacja" i nie wliczają się do nagłówka ani „Zamknij wszystkie informacyjne" (zachowanie istniejące dla handlu AI↔AI) — to skutek uboczny zaakceptowany przez dispatch. (3) Test (f) end-turn-block-event-test jest czerwony na bazie ea43bc32 — do osobnego tematu.

DEPLOY/PUSH: NIE WYKONANO
