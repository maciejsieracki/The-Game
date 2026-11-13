# R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-UNCONDITIONAL-END-Q1
GOAL: (1) cena pokoju 0 → pokój bez oddawania miasta; (2) na końcu zmęczenia wojną (poziom >= progKoncaZmeczenia) obie strony, także silniejsza, sama proponuje pokój BEZWARUNKOWY (bez miasta i zapłaty); gracz decyduje sam.
BAZA: origin/main d4d261e3b (detached worktree).

## ZMIANY-COMMIT
Allowlista zachowana. Pliki:
- gra/data/war-weariness-params.json — nowy parametr `zmeczenie.progKoncaZmeczenia = 0.8` (ZAŁOŻENIE: wartość domyślna = dotychczasowy progWzajemnyPokoj, do potwierdzenia przez właściciela).
- gra/src/game/war-weariness.ts:
  - :24 pole `progKoncaZmeczenia` w typie parametrów;
  - :226-231 czysta funkcja `wearinessUnconditionalEndDue(level, P)` (level >= progKoncaZmeczenia);
  - :256-268 w `runWarWearinessTick` gałąź pokoju bezwarunkowego (po bramce PEACE_PROPOSAL_MIN_WAR_TURNS, przed regułami miast): finalize z karencją 40 (zwykły) / 100 (chroniony), bez płatności, akcja `mutual_peace`;
  - :278 `priceZero = price.requiredPn <= 0`; :280 guard „jedno miasto nie kupi pokoju” nie działa przy cenie 0; :312 `cityGiven = priceZero || plan.histogram.miasto > 0`.
- gra/src/game/ai.ts:
  - :6199 import `wearinessUnconditionalEndDue`;
  - :7040-7056 (po `wearyOfferMult`) nowa gałąź: AI→gracz, `rel.stanWojny && partnerId==='0' && aiPeaceTimeOk && wearinessUnconditionalEndDue(wearyLevel)` → komenda `zaproponuj_pokoj` (rodzaj 'pokoj', BEZ ceny i BEZ miasta; gracz decyduje). Blok stoi przed N1a (oddanie miasta) i N1b (żądanie miasta), więc na końcu zmęczenia zastępuje je.
- gra/tools/diplo-weariness-unconditional-end-test.cjs — NOWY test (20 sprawdzeń + mutanty U1–U5 + mutant statyczny AI-U6).
- gra/tools/diplo-weariness-city-only-test.cjs — asercje (b, c, d) przepisane na wejście poniżej progu końca (turnsAtWar 90, lostA 1); mutanty M3/M4 zaktualizowane do nowego tekstu; dodane g2 (remis sił przed progiem: słabsza płaci miastem) — wykrywa mutant M1.
- gra/tools/ai-war-weariness-peace-test.cjs — (a) `mkDeps` dostaje `params: PRE_END_PARAMS` (progKoncaZmeczenia=2), czyli asercje o starych regułach (oferty miast, cooldown, mnożniki) są sprawdzane przed końcem zmęczenia; (b) asercja „200 tur + straty: AI oddaje miasto” rozbita: 90 tur + 2 straty (poziom ~0,75) → AI oddaje miasto; 200 tur + straty (koniec zmęczenia) → zaproponuj_pokoj „koniec zmęczenia” bez miasta.
- gra/tools/diplo-peace-ai-ai-nonnegative-test.cjs — `params` z progKoncaZmeczenia=2 w `weariness()` (asercje ochrony/bilansu przed końcem zmęczenia).

Nie zmieniano: main.ts (decyzja końca zmęczenia AI↔AI siedzi w runWarWearinessTick; tickAiAiWarWeariness przekazuje wywołanie bez zmian), diplomacy-proposals.ts, diplomacy-ai-offer-balance.ts, diplomacy-ai-forced-peace.ts, power-objective.ts, WERSJE.md, gra/ poza wymienionymi, rust-port/.

## Ścieżki (plik:linia) wymagane przez dispatch
- cena 0: gra/src/game/war-weariness.ts:278, :280, :312.
- zmęczenie ≥ próg końcowy (pokój bezwarunkowy AI↔AI): gra/src/game/war-weariness.ts:256-268; próg: war-weariness.ts:230-231 + gra/data/war-weariness-params.json (zmeczenie.progKoncaZmeczenia).
- AI↔AI: war-weariness.ts:256-268 (wywołanie z main.ts:36650 → runWarWearinessTick, bez zmian w main.ts).
- AI→gracz: gra/src/game/ai.ts:7040-7056 (komenda zaproponuj_pokoj bez ceny). Strona gracza (obsługa zaproponuj_pokoj z payload {}): bez zmian, istniejąca ścieżka diplomacy-proposals.ts (case 'zaproponuj_pokoj').
- forced-peace po limicie tur: NIE ZMIENIANO. Ścieżka: gra/src/game/diplomacy-ai-forced-peace.ts:100-105 (isForcedPeaceDue) i runAiAiPeaceTick (:333), wołany z main.ts (tickAiAiPeaceRequests, ok. :36560). Ta ścieżka ma WŁASNĄ wycenę (planPeacePayment) i NIE dostała ani reguły ceny 0, ani pokoju bezwarunkowego na końcu zmęczenia. Patrz UWAGA 6.

## TESTY
Komendy uruchomione w gra/ (surowe wyniki):
- `npx tsc --noEmit` → EXIT=0.
- `node tools/logic-test.cjs` → EXIT=0, ostatnia linia: `PASS [213] cityfix: pop1 territory radius is 5` (licznik 213 z etykiety linii; NIE ZMIERZONO osobnego podsumowania).
- `node tools/tech-tree-test.cjs` → `20 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` → EXIT=0 (ostatnia linia bez licznika; NIE ZMIERZONO 21/21 z osobnych skryptów unit-replace-*).
- `node tools/combat-test.cjs` → EXIT=0, `All sanity checks passed.`
- `node tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`.
- `node tools/diplomacy-test.cjs` → `149 passed, 0 failed (total 149)`.
- `node tools/diplo-war-peace-sim-test.cjs` → EXIT=1, `19 pass / 3 fail`: FAIL S3, FAIL S4b, FAIL M_TUR — ta sama trójka co na bazie (dług zaakceptowany w dispatchu, ≤3).
- `node tools/diplo-weariness-unconditional-end-test.cjs` → `PASS=20 FAIL=0` (mutanty U1–U5 czerwone; AI-U6 wykryty statycznie).
- `node tools/diplo-weariness-city-only-test.cjs` → `PASS=29 FAIL=0` (było 28/0 + nowe g2; mutanty M1–M10, W1, W2 wykryte).
- `node tools/ai-war-weariness-peace-test.cjs` → `PASS=99 FAIL=0` (było 98/0; asercja rozbita na dwie).
- `node tools/diplo-peace-ai-ai-nonnegative-test.cjs` → `21 PASS, 0 FAIL`.
- `node tools/diplo-peace-weaker-seeks-city-only-test.cjs` → EXIT=0 (bez licznika w wyjściu; NIE ZMIERZONO 32/0).
- `node tools/diplo-peace-stance-wiring-test.cjs` → EXIT=0 (bez licznika; NIE ZMIERZONO 10/0).

## BLOKADY
Brak blokad technicznych. Zainstalowano zależności przez `npm ci --ignore-scripts` w gra/ (bez build/dev).

## RUNDY
1/5. Ostatni werdykt: n/d (pierwsza runda).

## UWAGI-DLA-ORKIESTRATORA (ZAŁOŻENIA, do potwierdzenia)
1. Próg końca zmęczenia 0,8 = progWzajemnyPokoj (ZAŁOŻENIE z dispatchu, pkt 3).
2. Karencja po pokoju bezwarunkowym: 40 zwykły / 100 chroniony (z JSON), jak w dispatchu (pkt 4).
3. Pokój bezwarunkowy AI↔AI NIE wymaga nieujemnego bilansu (isAiAiPeaceBalanceAllowed) — to reguła dla płatności, a tu płatności nie ma. ZAŁOŻENIE.
4. Cena 0 zwalnia też z guardu „jedno miasto”; cena 0 nie znosi wymogu desperacji (stage>0 nadal wymagane — bez desperacji brak oferty).
5. AI→gracz: AI składa `zaproponuj_pokoj` bez ceny (istniejący kształt payload {}). Brak dedykowanego cooldownu — powtórki zależą od istniejącej obsługi zaproponuj_pokoj po stronie gracza (NIE ZBADANO w tej rundzie; ryzyko: powtarzanie propozycji co turę, jeśli gracz odrzuca).
6. ZNALEZISKO (do decyzji orkiestratora): forced-peace po limicie tur (runAiAiPeaceTick, diplomacy-ai-forced-peace.ts:333; wołany przez main.ts tickAiAiPeaceRequests) nie stosuje ani ceny 0, ani pokoju bezwarunkowego na końcu zmęczenia. Jeśli dispatch miał to obejmować, wymaga osobnej rundy.
7. Testy starych reguł zostały przepisane przez PRE_END_PARAMS (progKoncaZmeczenia=2) w ai-war-weariness-peace-test i diplo-peace-ai-ai-nonnegative-test — świadomy wybór: asercje o ofertach miast/cooldownie/bilansie nie są osłabione, ale nie testują produkcyjnego progu. Produkcyjny próg testuje diplo-weariness-unconditional-end-test.
8. Pliki tymczasowe `gra/tools/.uend-*` i `.wcity-*` są usuwane przez testy; gra/node_modules zainstalowane (ignorowane przez git).

NASTĘPNY KROK: Evaluator (SONNET) — przegląd diffu (git diff d4d261e3b..HEAD), mutacje, decyzja o forced-peace (UWAGA 6).
DEPLOY/PUSH: NIE WYKONANO
