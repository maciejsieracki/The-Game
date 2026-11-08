STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-HOME-DEFENDERS-CIVILIAN-FILTER-Q1
GOAL: Odpowiedź Operatora na zarzuty Evaluatora (runda 1, ocena 9a8e571f0). Bez zmiany logiki decideAITurn.
ZMIANY/COMMIT: rebase na origin/main 037e6be36 (cherry-pick 9a8e571f0, bez zmian w ai.ts); poprawka dokumentacji nagłówka gra/tools/ai-home-defense-civilian-filter-test.cjs (T7/T8); ten plik. SHA: commit po tym pliku (podany w odpowiedzi orkiestratora).
ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (flaky ai-army-scattered-merge, asercja czasowa planera zbiórki): ODRZUCAM jako związane ze zmianą. Asercja mierzy planFieldStackGather (mStack < 5 ms, mCloud < 25 ms). homeDefenderPool jest wołana wyłącznie w decideAITurnCore (3715) i planCampaignBarbarianHomeDefense (4854), nie w planFieldStackGather. Dowód niestabilności na BAZIE origin/main bez zmiany (kopia git archive, 4 przebiegi): chmura 100 = 4.64 / 2.53 / 9.79 / 9.56 ms, wszystkie 33/0. Na gałęzi (3 przebiegi): chmura 2.72 / 3.92 / 3.81 ms, wszystkie 33/0. Próg 25 ms jest czuły na obciążenie CPU; zmiana progu poza allowlistą. DUG dla orkiestratora: stabilizacja progu czasowego ai-army-scattered-merge-test.cjs (osobny temat).
- Zarzut 2 (czas decyzji AI nie zmierzony przed zmianą): PRZYJMUJĘ, zmierzone. Pomiar BARB_DEF_PERF=1 (war-allin-general-path-barb-defense-test, median ms, n=60 na przebieg):
  baza origin/main: 2.290, 2.569, 4.199, 4.469 (mediana z median ~3.4; p90 7.4-21.0)
  gałąź po poprawce: 3.354, 3.300(poprzedni pomiar), 2.414, 4.229 (mediana ~3.3; p90 5.9-11.4)
  Różnica mieści się w szumie (rozrzut między przebiegami tej samej wersji ~2 ms). Filtr to jedno przejście O(n) po myUnits.
- Zarzut 3 (T7 nagłówek vs numeracja asercji): PRZYJMUJĘ, poprawiono nagłówek: T7 = cywil nie dostaje przydziału, T8 = determinizm. Dodano adnotację, że T7 jest strażnikiem regresji, nie dowodem RED. Test po zmianie: 8 passed, 0 failed.
- Zarzut 4 (origin/main poszedł dalej, hash REF_OFF.aiVsAi): PRZYJMUJĘ, zweryfikowane. Między 45ea4b67a a origin/main 037e6be36 nie zmieniono gra/src/game/ai.ts ani gra/tools/war-allin-capital-test.cjs. Po rebase na 037e6be36: war-allin-capital-test 98 passed, 0 failed (EXIT=0) z hashem 20a5bc2c7abcba1b.

BRAMKI NA BAZIE 037e6be36 (gałąź po rebase):
- tsc --noEmit: EXIT=0
- ai-home-defense-civilian-filter-test: 8/0
- war-allin-general-path-barb-defense: 24/0
- war-allin-keep-barb-defense: 8/0
- ai-home-defense-vs-barbarians: 46/0
- ai-war-defend-home: 30/0
- ai-general-war-campaign: 51/0
- army-concentration: 56/0
- ai-army-scattered-merge: 33/0 (x4 przebiegi, patrz zarzut 1)
- ai-move-full-range: 20/0
- war-allin-capital: 98/0
- ai-test: 274 passed / 20 failed; zestaw FAIL IDENTYCZNY jak na bazie origin/main 037e6be36 (diff pusty, 20 pozycji).

NIE WYKONANO: npm run build/dev; Chromium (zmiana logiczna, bez wizualnej). Nie pushowano.
BLOKADY: brak.
RUNDY: 2/5 (odpowiedź na zarzuty)
NASTĘPNY KROK: Evaluator (weryfikacja odpowiedzi), potem Final Control. Integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO
