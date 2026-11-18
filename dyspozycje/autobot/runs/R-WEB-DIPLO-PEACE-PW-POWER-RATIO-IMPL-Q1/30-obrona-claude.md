# R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 — obrona Operatora (runda 3/5, odpowiedź na zarzuty Evaluatora z 21890cb04)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1
GOAL: bez zmian względem dispatchu (P·r / P/r wg POWER, D = S − W dopłaca słabsza miastami, bez sufitu). Kandydat startowy: 7a5ea2a19 (zgodnie z zadaniem obrony). Kod NIE został zmieniony w tej rundzie — obrona dotyczy wyłącznie zarzutów 1–3.

## Odpowiedzi na zarzuty

**Zarzut 1 (main.ts poza allowlistą) — PRZYJMUJĘ jako fakt proceduralny, NIE cofam, potrzebna decyzja orkiestratora.**
- Dowód: `git diff origin/main 7a5ea2a19 -- gra/src/main.ts` — poza `diploProposalWarState` (dozwolone) są dwa bloki AI↔AI: funkcja `runAiAiPeaceTick` (~l. 39090–39100, `requiredPn = peaceAiAiPaymentPn(wearinessPeaceCashPn(...), objectivePowerForOwner(loser), objectivePowerForOwner(winner))`) oraz tick zmęczenia (~l. 39180–39190, ta sama formuła). Plus dwa pola `mocAI`/`mocPartner` w kontekście tickCtx (~l. 44948 i ~45039) — to też nie jest „diploProposalWarState”.
- Dlaczego nie cofam: P2(d) i R2 (rozstrzygnięcie orkiestratora: „AI↔AI: słabsza strona płaci D”) wymagają tej ceny w tych dwóch miejscach; cena AI↔AI liczy się wyłącznie w main.ts (`grep` potwierdza — poza main.ts nie ma wywołania ceny AI↔AI). Cofnięcie = AI↔AI bez D, czyli łamanie P2(d) i testu W3 bez wskazania alternatywy.
- Nie da się przenieść bez main.ts: moc obu stron (`objectivePowerForOwner`) jest funkcją lokalną main.ts; moduły dozwolone (war-weariness.ts, diplomacy-ai-forced-peace.ts) jej nie widzą.
- Prośba do orkiestratora (jedna z dwóch opcji): (A) rozszerzyć allowlistę DODATKU 2 o dokładnie te dwa bloki AI↔AI i pola `mocAI`/`mocPartner` w tickCtx, albo (B) polecić cofnięcie tych czterech hunków i akceptację odstępstwa od R2/P2(d). Operator nie wybiera sam.

**Zarzut 2 (zmienione asercje w diplo-peace-price-wiring-test.cjs) — PRZYJMUJĘ z uzasadnieniem.**
- Dowód zmiany: `git diff origin/main 7a5ea2a19 -- gra/tools/diplo-peace-price-wiring-test.cjs`. Stare regexy szukały surowego literału `relBasedPn > 0 ? wearinessPeaceCashPn(aiAiPairWearinessLevel(winner, loser)) : 0` oraz `requiredPn: relBasedPn > 0 ? wearinessPeaceCashPn(level) : 0,`. Po wdrożeniu P2(d) ten literał z definicji nie występuje — cena jest opakowana w `peaceAiAiPaymentPn(...)` (D słabszego), a wywołanie `wearinessPeaceCashPn(...)` zostaje jako argument P.
- Uzasadnienie: dwie asercje W3 przepisano na regex „wywołanie `peaceAiAiPaymentPn(wearinessPeaceCashPn(...)`”, czyli nadal sprawdzają, że cena bazowa P pochodzi z `wearinessPeaceCashPn` z tym samym poziomem pary, a dodatkowo, że wynik idzie przez D. Asercja rozejmu (`const requiredPn = kind === 'rozejm' ? relBasedPn`) i helper `aiAiPairWearinessLevel` bez zmian.
- Wynik: `node gra/tools/diplo-peace-price-wiring-test.cjs` → `PASS=14 FAIL=0`.

**Zarzut 3 (AI silniejsze — bramka PW tylko informacyjna) — ODRZUCAM, z dowodem.**
- Gałąź `pkPowerSplit` w `gra/src/game/diplomacy-proposals.ts` (~l. 1624) nadpisuje `gap` tylko dla autora = gracz. Jest to zamierzone: komentarz w tym samym miejscu (~l. 1660–1680, cytat właściciela z 2026-09-07 „jeżeli inna cywilizacja … proponuje mi pokój, to nawet jeżeli bilans jest ujemny, powinienem mieć możliwość zaakceptowania”) — propozycje pokoju AI nigdy nie są blokowane liczbą PW. Blokada „Brakuje N PW” z definicji dotyczy tylko autora-gracza (`authorIsPlayer`, ~l. 1716).
- Informacja o podziale dla gracza istnieje: `gra/src/ui/diplomacyAcceptanceBalance.ts` ~l. 620–640 (`peacePowerSplitRowHtml`) pokazuje przy AI silniejszym: „Druga strona jest silniejsza — dopłacasz miastami: D (po rabacie relacji) PW”, plus moc obu stron, r, S, W, D.
- Żądanie AI silniejszego od gracza (R2(e)) jest zaimplementowane po stronie AI: testy A6 (AI żąda miasta ≥ D: 9000 ≥ 8000) i A7 (miasto < D → AI nie żąda) w `gra/tools/diplo-peace-pw-power-ratio-test.cjs`.
- Luka, która zostaje (uczciwie): dla AI-autora `pokojPwBalance` jest nadal liczony z `basePn`, a nie z D. To jest informacja, nie blokada. Jeśli orkiestrator chce, by ta liczba też była D, to jest osobna decyzja (zmiana znaku/kierunku `gap` dla autora AI), NIE wykonywana tutaj.

## Weryfikacja (wyniki z surowego wyjścia, kandydat 7a5ea2a19)
- `npm ci --ignore-scripts` w gra/ (node_modules brakowało; 71 pakietów, bez skryptów, zgodnie z R4).
- `node_modules/typescript/bin/tsc --noEmit` → exit 0, brak błędów.
- `node gra/tools/diplo-peace-pw-power-ratio-test.cjs` → `Wynik: 47 PASS, 0 FAIL`.
- `node gra/tools/diplo-peace-price-wiring-test.cjs` → `PASS=14 FAIL=0`.
- Bramki: `logic-test` exit 0 (bez linii FAIL); `tech-tree-test` → `20 pass, 0 fail`; `research-test` → `PASSED: 33 / FAILED: 0`; `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`; `combat-test` exit 0, `All sanity checks passed.`
- Chromium: NIE ZMIERZONO w tej rundzie (poza zakresem obrony; bez zmian kodu).

## Zmiany w kodzie tej rundy
Brak. Commit zawiera wyłącznie ten raport.

## BLOKADY
Zarzut 1: wymaga decyzji orkiestratora (allowlista lub cofnięcie czterech hunków main.ts). Bez tej decyzji temat nie kwalifikuje się do READY_FOR_DEPLOY.

## RUNDY
3/5 (obrona). Licznik Haiku/Sonnet bez zmian względem DODATKU 3.

## NASTĘPNY KROK
Orkiestrator: decyzja A (rozszerzyć allowlistę o dwa bloki AI↔AI w main.ts + pola mocy w tickCtx) albo B (cofnąć i zaakceptować odstępstwo). Po decyzji — Evaluator/FC na kandydacie z tym rozstrzygnięciem.

## UWAGI-DLA-ORKIESTRATORA
- Allowlista DODATKU 2 nie obejmowała AI↔AI w main.ts (błąd dispatchu, nie Operatora). Wcześniejsze ustalenie „main.ts WYŁĄCZNIE diploProposalWarState” jest za wąskie wobec R2/P2(d).
- Założenie (R2 pkt e): AI silniejsze nie ma blokady „Brakuje” z definicji (zasada właściciela z 2026-09-07); informacja D jest w tooltipie.

DEPLOY/PUSH: NIE WYKONANO
