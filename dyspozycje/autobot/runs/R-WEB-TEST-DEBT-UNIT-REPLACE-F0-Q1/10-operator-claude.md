STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-UNIT-REPLACE-F0-Q1
GOAL: Test unit-replace-full-cost-test ma nie wymagac zamiennika Katapulty dla Taran okuty u 16 nacji (F0). Zgodnie z decyzja wlasciciela 2026-11-11 machiny obleznicze (Typ Siege) sa poza Zastap. Kontrakt zmieniony na: Siege nie ma zamiennikow w Zastap. Pozostale asercje bez oslabiania. Wynik 40/40.
ZMIANY/COMMIT: gra/tools/unit-replace-full-cost-test.cjs (commit 3364847a8, tylko ten plik kodu; zero zmian gra/src, danych, WERSJE.md).
  Stan wejsciowy: origin/main afac264c4 (dispatch podawal baze 6f2f1c50e; origin/main przesunal sie o commity FALA 627/628 - pracowano na aktualnym origin/main).
  Dowod: src/game/production.ts passesAvailabilityGates() zwraca false dla Typ=Siege, a Taran okuty i Katapulta maja Typ=Siege w data/units.json. Stara asercja byla sprzeczna z kodem i z decyzja.
TESTY (surowe wyniki):
  - npx tsc --noEmit (gra/): exit 0, bez bledow.
  - node tools/unit-replace-full-cost-test.cjs: 40 passed, 0 failed (exit 0). F0: "[OK] Siege nie ma zamiennikow w Zastap: Taran okuty i Katapulta u 16/16 nacji, wszystkie Siege (4) bez zamiennikow".
  - node tools/unit-replace-test.cjs: "WSZYSTKIE TESTY ZIELONE (21/21)" (exit 0).
  - node tools/logic-test.cjs: ostatni PASS [213] cityfix: pop1 territory radius is 5 (exit 0) -> 213/213.
  - node tools/tech-tree-test.cjs: "tech-tree-test: 20 pass, 0 fail" (exit 0).
  - node tools/research-test.cjs: "PASSED: 33 / FAILED: 0 / TOTAL: 33" (exit 0).
  - node tools/combat-test.cjs: "All sanity checks passed." (exit 0).
  - Nie uruchamiano npm run build/dev. Instalacja: npm ci --ignore-scripts w gra/. npm ci zglosil rekomendacje audytu (npm audit fix) - poza zakresem tematu, nie naprawiano.
  - git diff --check: czysto.
BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) weryfikuje diff 3364847a8 i powyzsze bramki; Final Control; integracja orkiestratora (sprawdzic git merge-base --is-ancestor 3364847a8 <SHA integracji>).
DEPLOY/PUSH: NIE WYKONANO
