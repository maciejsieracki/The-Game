# R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1 — obrona (runda 3, Operator SONNET po 2 porażkach Haiku)

STATUS: BLOCK
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły dla szóstki traktatów (S/W/D, płaci słabsza, bez sufitu) w bramce gracza, ścieżce AI, panelu i Civpedii; pokój nietknięty.
ZMIANY-COMMIT: baza obrony = kandydat 0b79f2848. Jedyna zmiana tej rundy: gra/tools/diplo-peace-balance-accept-test.cjs (Z3: etykieta `(200 rozejm)` zmieniona na `(baza rozejmu 2000 po FALI 825 r3 ...)`, asercja bez zmian). Drugi plik commita: ten raport.

ODPOWIEDZI NA ZARZUTY
- Zarzut 4 (drobne): PRZYJMUJĘ. Etykieta Z3 poprawiona. Raport operatora 765 słów (limit 500) przyjmuję jako naruszenie; 10-operator-claude.md nie zmieniam (artefakt historyczny).
- Zarzut 3 (pomiar częstości rozejmów): PRZYJMUJĘ jako lukę. Pomiar 185 vs 107 (600 komórek, gorzej 0) obejmuje wyłącznie decideAIDiplomacy. AI↔AI i rozejm AI→gracz w main.ts NIE_ZMIERZONO. Nie naprawiono w tej rundzie.
- Zarzut 2 (testy wiringu regexem): PRZYJMUJĘ. Sekcje F i M3 w diplo-treaties-ai-parity-test.cjs sprawdzają źródło, nie wykonanie. Tor AI↔AI rozejmu (requiredPn/balBasePn w main.ts) i rozejm AI→gracz nie mają testu uruchamiającego kod. Nie naprawiono: wymaga harnessu wykonującego main.ts.
- Zarzut 1 (AI silniejsze nie żąda D od gracza przy sojuszu/NAP/przemarszu): PRZYJMUJĘ jako rzeczywistą lukę względem pkt (2) dispatchu. W kodzie evaluateProposal ma gapBasePn = D tylko dla actionId === 'rozejm' && !proposerIsPlayer (diplomacy-proposals.ts). Dla sojuszu/NAP AI składa ofertę bez żądania miast. Pakt nie niesie miast, a ai.ts blokuje tylko stronę słabszą (aiTreatyParityDuePn(...) <= 0). ZAŁOŻENIE do rozstrzygnięcia przez FC: przy braku kanału miast w pakcie AI silniejsze powinno dołączyć żądanie miasta ≥ D (jak rozejm) albo świadomie zostawić odstępstwo (decyzja produktowa). NIE zaimplementowano w tej rundzie.

BLOKADY
- Zarzuty 1, 2, 3 przyjęte, nienaprawione w tej rundzie. Wymagają kolejnej rundy albo decyzji FC/orkiestratora (zarzut 1 może być decyzją produktową).
- Dysk: 4,2 GB wolnego przed npm ci, 3,9 GB po. Żywy Chromium NIE_ZMIERZONO.

TESTY (surowe wyjścia z tej sesji)
- node tools/diplo-peace-balance-accept-test.cjs: exit 0, "32 pass / 0 fail" (po zmianie etykiety).
- node tools/diplo-treaties-ai-parity-test.cjs: exit 0, "80 pass / 0 fail".
- tsc, pięć bramek referencyjnych i reszta testów NIE_ZMIERZONO w tej rundzie (zakres: zarzuty).

RUNDY
Runda 3/5 (obrona). Zarzuty 1-3 otwarte.

NASTĘPNY KROK
Evaluator/FC: rozstrzygnąć zarzut 1 (pakt AI silniejsze: żądanie miasta ≥ D albo świadome odstępstwo). Potem test wykonawczy ścieżki AI↔AI (zarzut 2) i pomiar częstości poza decideAIDiplomacy (zarzut 3).

DEPLOY/PUSH: NIE WYKONANO
