STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEAD-UNITS-NOT-REMOVED-FROM-FIELD-Q1
GOAL: Jednostka z HP <= 0 znika z pola bitwy; ucieczka z morale bez zmian reguly.
ZMIANY/COMMIT: baza 3e5d54efe (commit Operatora, zweryfikowany jako przodek). Commit obrony: patrz sekcja SHA ponizej. Allowlista: gra/tools/battle-dead-units-removed-test.cjs (usuniety guard zrodlowy), ten plik runs/<ID>/02-obrona-r1.md. Nie ruszano battleScene.ts, WERSJE.md, gra-robocza/.
TESTY (wykonane w tym worktree, node_modules z gra/package-lock.json, npm ci --ignore-scripts):
- npx tsc --noEmit: EXIT 0 (odpowiada na zarzut 1 dowodem).
- battle-dead-units-removed-test.cjs: PASS (po usunieciu guardu zrodlowego).
- battle-dead-unit-disappearance-test.cjs: PASS.
- walka-morale-przewaga-mocy-test.cjs: 123/123.
- NIE_ZMIERZONO: testy battle-* wymagajace Chromium, weryfikacja wizualna, auto-battle-*, battle-loot-test (poza zakresem obrony).
BLOKADY: brak (Chromium niedostepny w tym runie).
RUNDY: 1/5
NASTEPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

ODPOWIEDZI NA ZARZUTY:
1. (tsc, wersja TS) PRZYJMUJE. Odtworzone: lokalny tsc z gra/node_modules (npx tsc --noEmit) przechodzi, EXIT 0. Zarzut o TS 6 dotyczy globalnej instalacji Evaluatora, nie projektu.
2. (Chromium / weryfikacja wizualna) PRZYJMUJE jako NIE_ZMIERZONO. Brak przegladarki w tym runie; nie twierdze, ze render jest poprawny. Test sprawdza logike headless (_resolveBlowOutcome i _startFade).
3. (regex na zrodle) PRZYJMUJE. Usunieto asercje `!/bu\.hp\s*=\s*1;/` na tekscie battleScene.ts. Pokrycie zachowuje asercja behawioralna `def.bu.hp === 0` po ciosie smiertelnym z rout-before-death (linia 84 testu), wraz z removed/dead/detached. Commit obrony zawiera te zmiane.
4. (uwaga balansowa) PRZYJMUJE jako zgloszenie do orkiestratora. Kod nie zmieniony, prog nie ruszany. Potwierdzam mechanike z diffu: dawniej cios smiertelny lamiacy morale ozywial do hp=1 i jednostka uciekala; teraz ginie. Ilosci tych przypadkow w realnej grze NIE_ZMIERZONO. Decyzja o zmianie strat nalezy do wlasciciela (ABC przez orkiestratora).
