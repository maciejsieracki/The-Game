STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — stabilizacja testów z asercjami czasowymi (bez zmian zachowania gry)
TEMAT: R-WEB-TEST-TIMING-STABILIZE-Q1
GOAL: Uodpornić asercje czasowe `ai-army-scattered-merge-test.cjs` i `ai-war-defend-home-test.cjs` na szum CPU, bez luzowania progów i bez utraty wykrywania regresji wydajności.
ZMIANY/COMMIT: 4df54332a91abb20da793085b7dbd4e061806441 (baza: origin/main fb910fcac). Allowlista: `gra/tools/ai-army-scattered-merge-test.cjs`, `gra/tools/ai-war-defend-home-test.cjs`, `dyspozycje/autobot/runs/R-WEB-TEST-TIMING-STABILIZE-Q1/**`. Zmiana: każdy pomiar czasu = MIN z 5 prób, próby PRZED/PO (lub z bramką/bez bramki) przeplatane. Progi bez zmian. Brak zmian w `gra/src/**`. Nie zmieniono plików dodatkowych (patrz BLOKADY). Logi: `gate-{pre,post}-{solo,load}-{scattered,defend}.txt` (każdy z linią `EXIT=`).
TESTY:
- PRZED (10x solo + 10x pod obciążeniem, 2 równoległe testy: ai-fog-test, ai-move-range-test): scattered 20/20 PASS (33/33 każdy); defend 20/20 PASS (30/30 każdy). Brak FAIL; nie odtworzono zgłoszonego 32/1 ani 432 vs 247 ms (NIE_ZMIERZONO co do przyczyny).
- PO (te same 20+20): scattered 20/20 PASS; defend 20/20 PASS. Czas testu: scattered solo ~23 s, load ~34 s; defend solo ~9 s, load ~7–21 s.
- Pomiar planera PRZED (pojedyncza próba x20): stos100 0.04–0.23 ms, chmura100 1.5–8.8 ms. PO (min z 5): stos100 0.035 ms, chmura100 1.41 ms.
- Mutacja planera `planFieldStackGather` +30 ms/wywołanie (sonda, esbuild): asercja mikro -> FAIL (stos 29.98 ms, chmura 30.02 ms) — WYKRYTA. Mutacja +3 ms: asercja mikro PASS (próg bezwzględny 25 ms) — NIE wykryta; ograniczenie progu, nie zmieniano.
- Mutacja `planHomeWar` +30 ms: T7 FAIL (PO 948.6 ms vs limit 171.3) — WYKRYTA. +3 ms: T7 FAIL (204.6 vs 174.3 ms) — WYKRYTA.
- Mutacje testów wbudowane (bramka scattered, T1–T6 defend) — PASS w obu wariantach.
- `tsc --noEmit` w gra/: EXIT=0 (`npm ci --ignore-scripts` wykonane; node_modules do usunięcia po pracy). Nie uruchamiano build/dev.
BLOKADY:
- Przegląd `gra/tools/*-test.cjs` pod kątem twardych progów czasu: identyczny wzorzec (względny pomiar czasu PO vs PRZED) występuje również w `gra/tools/ai-move-full-range-test.cjs:368` (D3: PO <= PRZED*1.3+50 ms, pojedynczy przebieg) i `gra/tools/ai-army-replacement-concentration-test.cjs:339` (aiMsPerCall PO <= mut*1.5+5 ms). NIE zmieniono (nie zmierzono ich przed zmianą) — kandydaci do osobnego tematu lub zgody właściciela (limit ≤3 plików wzorca).
- Progi absolutne/inne, nie zmieniane: `barb-city-behavior-test.cjs:1223` (PERF_BUDGET_MS), `okolica-multi-city-overlap-test.cjs:361` (5000 ms), `map-models-scale-2x-test.cjs:281` (już min z serii, próg 1.25x+1 ms).
- Ograniczenie: progi bezwzględne (5/25 ms) wykrywają spowolnienie planera rzędu dziesiątek ms, nie kilku ms.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) — weryfikacja diffu i logów; decyzja właściciela co do kandydatów z BLOKADY.
DEPLOY/PUSH: NIE WYKONANO
