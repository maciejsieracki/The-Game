STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1
GOAL: Pokój/rozejm AI<->AI nie może zostać zawarty, gdy bilans PW którejkolwiek z dwóch AI jest ujemny; pokój proponowany graczowi zostaje akceptowalny przy ujemnym bilansie gracza (decyzja właściciela ABC D1, 2026-11-09).
ZMIANY/COMMIT: SHA w sekcji COMMIT na końcu (commit tej rundy). Pliki: gra/data/diplomacy-war-peace-params.json (nowa sekcja pokojAiAi.minBilansPW = 0), gra/src/game/diplomacy-ai-forced-peace.ts, gra/src/game/diplomacy-war-peace-profile.ts (typ), gra/src/game/war-weariness.ts, gra/src/main.ts, nowy gra/tools/diplo-peace-ai-ai-nonnegative-test.cjs, zaktualizowane gra/tools/ai-war-nearest-city-peace-2t-test.cjs i gra/tools/ai-war-weariness-peace-test.cjs.
TESTY: patrz sekcja TESTY niżej.
BLOKADY: brak. Odstępstwo od allowlisty (ZAŁOŻENIE, patrz niżej): war-weariness.ts, main.ts i dwa istniejące testy.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1). Punkty do oceny: ZAŁOŻENIA A-D niżej; brak `tsc` w środowisku (typecheck main.ts nie wykonany).
DEPLOY/PUSH: NIE WYKONANO

## 1. Diagnoza (ścieżki zawierania pokoju AI<->AI)

Komendy `zaproponuj_pokoj` / `oferuj_trybut_za_pokoj` AI->AI NIE przechodzą przez `evaluateProposal` (diplomacy-proposals.ts) ani przez `diplomacyAcceptanceBalance.ts` (UI gracza). W main.ts (ok. :40614) trafiają do `registerAiAiPeaceRequest`, a pokój zawierają trzy niezależne mechanizmy:

1. `runAiAiPeaceTick` (diplomacy-ai-forced-peace.ts, wołany z `tickAiAiPeaceRequests`, main.ts): `decideAiPeaceRequest`. Przed zmianą: `accept_paid` gdy `plan.full || balanceAfter >= -tolerancja`, a po `tury_do_pokoju_po_prosbie` (2 tury) `force` ZAWSZE, także przy bilansie zwycięzcy < 0. Bilans przegranego nie był sprawdzany w ogóle. LUKA: AI<->AI mogło zawrzeć pokój na minus (force, tolerancja -tol).
2. `runWarWearinessTick` (war-weariness.ts): `mutual_peace` (równowaga sił, zmęczenie) bez żadnej wyceny; `offer_accepted` przy `mustAccept` (ochrona przegrywającego) lub `exhausted` (wyjście awaryjne) lub `balanceFor >= -tol`. LUKA: te same, plus tolerancja zmęczenia obniżała próg poniżej zera.
3. `maybeResolveRegularWarOnCityCapture` (main.ts): auto-pokój po 2 zdobytych/straconych miastach, `finalizePeaceTreatyBetween` bez żadnej wyceny. LUKA: pokój bez sprawdzenia bilansu.

Wyjątek "pokój zawsze do przyjęcia" (decyzja 2026-09-07) działa wyłącznie w ścieżce gracza-odbiorcy (UI `diplomacyAcceptanceBalance.ts` ~354-366, `evaluateProposal` dla pokoju od AI do gracza). Dla AI-odbiorcy ten wyjątek NIE istnieje w kodzie jako reguła: AI<->AI "zawsze przyjmuje" wyłącznie przez wymuszenie `force` (decyzja 2026-11-03), czyli luki 1-3 wyżej.

Pomiar wyceny (peaceOfferAiOwnBilans(0,0,rel,baza), probe jednorazowy): baza 500: relacja -100..0 => bilans przy zerowej zapłacie +450; rel 20 => 400; rel 50 => 250; rel 100 => 0. Baza 200 (rozejm): 180 / 160 / 100 / 0. Czyli dla realnych (wojennych, niskich) relacji bilans zwycięzcy przed zapłatą jest DODATNI; reguła blokuje tylko przypadki, gdy zapłata przegranego byłaby zbyt mała lub zbyt duża. Nie zmierzono zachowania w żywej grze (NIE_ZMIERZONO).

## 2. Naprawa

- `diplomacy-war-peace-params.json`: `pokojAiAi.minBilansPW = 0` (jedyny próg, w pliku danych); typ w `WarPeaceParams`.
- `diplomacy-ai-forced-peace.ts`: `aiAiPeaceMinBalance`, `AI_AI_PEACE_MIN_BALANCE`, `isAiAiPeaceBalanceAllowed(winner, loser?, min)`, `aiAiPeaceRequiredPn(baseRequired, winnerBalanceAtZero, min)`. `decideAiPeaceRequest`: ujemny bilans zwycięzcy LUB przegranego (po zapłacie) => `wait`, także po limicie tur (force nie omija reguły). `AiPeaceTickDeps.price` dostaje opcjonalne `loserBalanceFor`.
- `war-weariness.ts`: `mutual_peace` wymaga bilansów >= 0; `offer_accepted` wymaga `isAiAiPeaceBalanceAllowed` niezależnie od `mustAccept`/`exhausted`/tolerancji.
- `main.ts`: `price` obu ticków liczy `requiredPn = aiAiPeaceRequiredPn(...)` (cena podniesiona do bilansu zwycięzcy >= 0) i `loserBalanceFor = peaceOfferAiOwnBilans(zapłata, 0, relacja przegrany->zwycięzca, baza)`; auto-pokój "2 miasta" wymaga bilansu >= 0 u obu AI (przy blokadzie licznik zdobyczy zostaje, log `R-AI-PEACE-AI-AI-NONNEG`).
- Ścieżka gracza (`diplomacy-proposals.ts`, `diplomacyAcceptanceBalance.ts`) NIETKNIĘTA (test P1). Reguła 20% przewagi (FALA 567) bez zmian.

## 3. ZAŁOŻENIA (luki dispatchu rozstrzygnięte w dokumencie)

A. Allowlista nie obejmowała war-weariness.ts i main.ts, a to tam zapadają decyzje o pokoju AI<->AI (diagnoza pkt 2-3). Rozszerzono o nie minimalnie; dwa istniejące testy zmieniono, bo kodowały starą zasadę wymuszenia pokoju mimo ujemnego bilansu (patrz niżej).
B. "Bilans" = istniejąca wycena `peaceOfferAiOwnBilans` (jak dla AI->gracz). Bilans zwycięzcy = (0, zapłata); bilans przegranego = (zapłata, 0) z jego relacji. Próg: ścisłe `>= minBilansPW` (0), bez tolerancji trudności.
C. KONFLIKT Z POPRZEDNIĄ DECYZJĄ (2026-11-03, pokój wymuszony po 2 turach; ochrona przegrywającego; wyjście awaryjne): nowa decyzja właściciela (2026-11-09) ma pierwszeństwo, więc wymuszenie nie omija ujemnego bilansu. Skutek uboczny: gdy przegranego nie stać na zapłatę podnoszącą bilans zwycięzcy do 0 (albo zapłata zrobiłaby ujemny bilans przegranego), wojna AI<->AI trwa, a pokój powraca dopiero po zmianie majątku/relacji. Przy zmierzonych wartościach wyceny (pkt 1) przypadek jest rzadki, ale NIE_ZMIERZONO w żywej grze (zalecenie dla Evaluatora/orkiestratora: pomiar LIVE-AUDIT wojen AI<->AI po zmianie, ryzyko "wojny bez końca").
D. Auto-pokój "2 miasta" (cap anty-podbój) także podlega regule; przy ujemnym bilansie cap nie kończy wojny (licznik zostaje).

## 4. Zmiany istniejących testów (celowe, konsekwencja decyzji)

- ai-war-nearest-city-peace-2t-test.cjs: B1, B4, B5, B12 zmienione z "force przy niedopłacie" na "wait" (B5: aktywo miasta 450 tak, by bilans >= 0; B12 rozszerzony o wariant ze złotem 500 => force bez miasta).
- ai-war-weariness-peace-test.cjs: 4a (+ nowy wariant 4a-NN), 4f, 7c (+7c-NN), 7d, 7f, 7g, 7i: mock `winnerNeed: 0` tam, gdzie test sprawdza ochronę/karencję; 4f i 7g odwrócone (ujemny bilans blokuje mimo wyczerpania/zmęczenia).

## 5. TESTY (uruchomione w worktree, node_modules podlinkowane z innego worktree i usunięte po testach)

- diplo-peace-ai-ai-nonnegative-test.cjs (nowy): 20 PASS / 0 FAIL (predykat, tick AI<->AI nieujemny->zgoda, ujemny zwycięzca->odmowa, ujemny przegrany->odmowa, force nie omija, brak regresji force przy bilansach >= 0, rozejm, zmęczenie wojną, ścieżka gracza nietknięta).
- diplo-peace-balance-accept-test: 29 pass / 0 fail (w tym Z2: gracz przy ujemnym bilansie nadal akceptuje; R3/R5).
- diplo-war-peace-gate-test: 11/0; diplo-war-peace-sim-test: 22/0; diplo-truce-r1-test: 30/0.
- ai-war-nearest-city-peace-2t-test: PASS (po zmianie B1/B4/B5/B12); ai-war-weariness-peace-test: PASS=93 FAIL=0; ai-losing-war-asks-peace-vs-player-test: 12/0.
- ai-test: 289 passed, 0 failed; logic-test: 213/213.
- NIE WYKONANO: `tsc` (brak typescript w node_modules żadnego worktree) i build; main.ts sprawdzony tylko parsowaniem esbuild (OK). Brak testu w przeglądarce (temat logiczny, bez UI).

## COMMIT
Kod + testy + raport: 4eb423fcca60584d24c9b3670527e6a82cb9f50f (gałąź worktree-wf_4a28886c-7ad-1, baza 23871b38c = main po FALA 570, zawiera 512401eac). Dopisek SHA w raporcie wykonany kolejnym commitem docs-only.
