STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ERA-WAR-MARCH-BEFORE-40-Q1
GOAL: Przed turą 40 kontekst wojenny / marsz AI otwiera się dla pary w AKTYWNEJ wojnie epoki Brązu/Żelaza (tag z map aktywnych par, nie z tury). Wojna Kamienia i zwykła wojna przed turą 40 pozostają zablokowane (R1).
BAZA: origin/main 5dd53e60f (zawiera FALA 547).

ZMIANY/COMMIT:
- gra/src/game/war-rules-multiwar.ts: nowy czysty predykat `isWarMarchOpenForPair(turn, activePairEraTag, params)` = R1 otwarte LUB tag w `eraForcedWarIgnoreR1`.
- gra/src/main.ts: import predykatu; helper `activeEraWarTagForPair(a,b)` (mapy bronze/iron, bez stone). W `warAllInContextFor` przed turą 40 (AI, nie barbarzyńcy, flaga multiwar ON) zaangażowanie zawężone do par w aktywnej wojnie epoki; gdy brak takiej pary -> `undefined` (jak dotąd). Gdy R1 otwarte -> bez zmian.
- gra/tools/war-rules-multiwar-main-guard-test.cjs: asercja statyczna R1 (r6) zaktualizowana do nowej postaci bramki. Stary regex kodował blanket-blokadę; zmiana zamierzona, nie osłabienie: nowa asercja nadal wymusza blokadę dla pozostałych par.
- gra/tools/era-war-march-before-40-test.cjs (NOWY): 18 asercji na prawdziwym predykacie (tury 39/40/41, tagi bronze/iron/stone/null) oraz statyczne okablowanie main.ts.
- ai.ts: bez zmian (brak guardów R1 w ai.ts; blokada była w warAllInContextFor i w puli wojen epoki main.ts, którą już omija `eraForcedWarIgnoreR1`).
- war-rules-params.json: bez zmian.
- SHA: patrz commit (lokalny, bez push).

TESTY:
- tsc --noEmit (gra): exit 0.
- era-war-march-before-40-test.cjs: 18 OK / 0 FAIL.
- war-rules-multiwar-test.cjs: 57 OK / 0 FAIL.
- war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL (po aktualizacji asercji R1).
- era-war-delays-test.cjs: 41 OK / 0 FAIL.
- war-allin-capital-test.cjs: 96 passed / 2 failed. Dwa znane stałe FAIL na bazie (6b aiVsAi / noLandPath, hash flagi OFF), nie ruszane zgodnie z dispatchem.
- logic-test.cjs: LOGIC OK (213/213).
- ai-test.cjs: 274 passed / 20 failed, zgodnie z bazą 274/20.
- war-rules-multiwar-live-test.cjs: NIE_ZMIERZONO (przerwany przez timeout, brak wyniku).
- Test integracyjny na realnym przepływie main.ts: NIE_ZMIERZONO. Test opiera się na predykacie i statycznym okablowaniu.
- Weryfikacja w przeglądarce: nie dotyczy (zmiana logiki AI, bez efektu wizualnego).

BLOKADY:
- Dysk: po zakończeniu 3,6 GB wolnego (91% użycia), poniżej progu 4 GB dla tematów web. Nie startować nowych tematów bez zwolnienia miejsca.
- Brak integracyjnego testu main.ts (NIE_ZMIERZONO, patrz wyżej).

RUNDY: 1/5 (ostatni werdykt: brak, pierwsza runda)
NASTĘPNY KROK: Evaluator (Sonnet 5.5) i Final Control. Ewentualnie test integracyjny N-1/N/N+1 przez pełny main.ts, jeśli Evaluator uzna go za wymagany.
DEPLOY/PUSH: NIE WYKONANO
