# R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1
GOAL: otwarty panel miasta po końcu tury gracza pokazuje świeży stan (skarbiec, surowce, kolejka, dostępność), a nie migawkę z początku tury.
BAZA: origin/main 0c12240a356e6430dcba6aac3044d6a48b2bad4d (worktree detach, bez zmian w innych plikach).

ZMIERZONO
- Diagnoza na żywo (Chromium, build poza repo): błąd ISTNIEJE. Po realnym `endTurn()` bez technologii otwarty panel miasta (B) różni się od świeżego renderu (C):
  - Skarbiec (100000) zamiast (99998); Praca i Nauka (0) zamiast (4); Żywność +4/−4 zamiast +5; w liście budowy dodatkowa pozycja „8”.
  - Dowody (tekst panelu): `scratchpad/evid-base/city-panel-turn-start-{A,B,C}*.txt`.
- Przyczyna: helper `refreshOpenPanelsAfterTechDiscovery()` odświeżał panel tylko po odkryciu technologii; brak odświeżenia na końcu tury.
- Naprawa (gra/src/main.ts): nowy `refreshOpenPanelsAtTurnStart()` (odświeża panel miasta i panel rekrutacji imperium) z zachowaniem `scrollTop` przewijanych elementów (migawka po ścieżce indeksów DOM i przywrócenie po przerysowaniu). Stary helper deleguje do niego (3 istniejące miejsca wywołania bez zmian). Wywołanie dodane w `finally` `triggerPlayerEndTurn`, po `validateRecruitGeneral()`, przed `syncPlayerUnitSelectionOnMap()`.
- Test żywy (nowy plik gra/tools/city-panel-refresh-at-turn-start-live-test.cjs):
  - build naprawiony: PASS (B == C), dowody `scratchpad/evid-fix/`;
  - build bazowy (bez zmiany): FAIL (B != C), dowody `scratchpad/evid-base/`. To jest też mutacja „bez wywołania → FAIL”.
- Istniejący live-test `open-panel-refresh-after-tech-live-test.cjs` na buildzie naprawionym: PASS.

TESTY (liczby z surowego wyjścia)
- `tsc --noEmit`: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: 21/21.
- combat-test: 6/6 pass.
- army-panel-recruit-remove-test: 21 passed, 0 failed.
- army-auto-recruit-general-ui-test: 11 passed, 0 failed.
- administrators-wizard-test: 58 passed, 0 failed.
- city-panel-refresh-at-turn-start-live-test: PASS (naprawiony) / FAIL (bazowy).
- open-panel-refresh-after-tech-live-test: PASS.

NIE ZMIERZONO
- Panel rekrutacji imperium (`refreshEmpireRecruitPanel`) — tylko kod, bez pomiaru żywego.
- Zachowanie `scrollTop` i zaznaczeń w odświeżonym panelu na żywo — kod ma przywracanie przewijania, ale test go nie sprawdza.
- Migotanie przy przerysowaniu — nie oceniane.
- Fokus/zaznaczenie pól `input` po przerysowaniu — brak gwarancji (poza zakresem migawki przewijania).

BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: w pliku gra/tools/city-panel-refresh-at-turn-start-live-test.cjs test nie zamyka żadnych popupów (poprzednia wersja szablonu klikała „Zamknij” bez potrzeby). Testy gate z `army-auto-recruit-general-ui-test` nadpisały dwa śledzone PNG w dyspozycje/…/R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1/ — przywrócone (`git checkout --`) i nie są w commicie.
RUNDY: 1/5 (bez FAIL, bez poprawek rundy 2).
NASTĘPNY KROK: Evaluator — przegląd diffu gra/src/main.ts (zakres: helper + jedno wywołanie w finally), test PASS/FAIL, weryfikacja zachowania przewijania w grze.
DEPLOY/PUSH: NIE WYKONANO
