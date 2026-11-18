STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja, stół negocjacyjny)
TEMAT: R-WEB-DIPLO-AI-PEACE-OFFER-DEDUP-ONE-ACTIVE-Q1 (DIPLO-5), runda 2/5, Obrona HAIKU 5.5
GOAL: na stole co najwyżej JEDNA aktywna propozycja pokoju/rozejmu na parę; kontroferta gracza zastępuje ofertę AI; oferta miasta, której nie da się wykonać, znika; wygasające oferty są sprzątane przy odświeżeniu stołu. Bez zmian cen, progów, cooldownów i bramki PW autora-gracza.
ZMIANY-COMMIT: baza origin/main e37eef154; kandydat operatora 474ef9561 (start obrony); commit obrony = SHA w polu sha (StructuredOutput). Allowlista zachowana: gra/src/game/diplomacy-proposals.ts, gra/src/main.ts (1 wiring), gra/tools/diplo-peace-offer-dedup-one-active-test.cjs, raport 30-obrona-claude.md.

ODPOWIEDZI NA ZARZUTY EVALUATORA (df25c5ec0):
1 (kryterium 2: wygasanie/nieaktualne oferty, komunikat „Ważne”) — ODRZUCAM CZĘŚCIOWO. Dowód: main.ts:21446 pruneInvalidNegotiations już usuwa oferty wygasłe (negotiationStillValid: world.turn > expiresTurn), po pokoju (isAtPeace), po wybuchu wojny; wywoływane przy odświeżeniu (main.ts 14110, 14164, 43778, 50933). Komunikat idzie przez showHintMessage, NIE przez zakładkę „Ważne” — to jest LUKA, nie zmieniono (decyzja orchestratora: hint wystarczy czy Ważne). Dowód live NIE ZMIERZONO (patrz zarzut 6).
2 (kryterium 3: miasto utracone/oddane) — PRZYJMUJĘ. Poprawka: diplomacy-proposals.ts negotiationStillValid — pole opcjonalne NegotiationWorldCtx.cityOwnerOf; miasto z giveItems musi należeć do proposera, z receiveItems do respondera; brak miasta = utracone = wygasa. Wiring: main.ts buildNegotiationWorldCtx (cityOwnerOf: cities.find(...)?.ownerId). Test T8 (własne/oddane/utracone/nieistniejące/bez wiringu).
3 (kryterium 4: „Przyjmij” dla czystego prezentu blokowane PW) — ODRZUCAM W TYM TEMACIE, z dowodem. Probe (node, previewIncomingPlayerAccept/computeIncomingPlayerAcceptNetPw, payload giveItems=[miasto City27 200 PN], receiveItems=[]; actionId pokoj/rozejm/handel; relTotal 88): wynik null dla wszystkich — bramka netto PW (previewIncomingPlayerAccept) NIE blokuje czystego prezentu miast. Blokada „Brakuje N PW” pochodzi z ścieżki evaluateProposal (pwBalance, main.ts ~22120), czyli z bramki PW autora-gracza, której dispatch zakazuje zmieniać. Nie zreprodukowano pełnej ścieżki UI; zmiana wymaga decyzji o znaku bilansu — przekazuję orchestratorowi.
4 (brak testu kontrofert, applyCounterOffer) — PRZYJMUJĘ, z naprawą błędu. Znaleziony błąd: applyCounterOffer zachowuje proposerOwnerId AI i zmienia tylko authorOwnerId na gracza; planAiOfferOnTable sprawdzał tylko proposerOwnerId, więc AI mogła nadpisać kontrofertę gracza własną nową ofertą. Poprawka: planner liczy wpis jako zajęty przez gracza, gdy proposerOwnerId lub authorOwnerId = gracz. Test T7 (kontroferta gracza blokuje nową ofertę AI; przed poprawką accepted=true).
5 (wiring main.ts bez testu) — PRZYJMUJĘ częściowo. Test T9 to guard źródłowy (świadomy wyjątek od zasady „bez regex na źródle”, bo main.ts nie ładuje się w node): sprawdza wywołanie planAiOfferOnTable z negotiationTable, obsługę replacedIds i cityOwnerOf w buildNegotiationWorldCtx. Nie zastępuje testu behawioralnego enqueueNegotiationFromAiCmdImpl.
6 (dowód live Chromium) — NIE ZMIERZONO. Nie zbudowano vite i nie uruchomiono Chromium w tej rundzie (zakres obrony: poprawki i testy logiczne). Do zrobienia osobnym tematem lub przez orchestratora.
7 (efekt uboczny: oferta gracza blokuje ofertę AI innego typu/miasto-za-pokój) — ODRZUCAM jako błąd: zgodne z GOAL (1) „co najwyżej jedna propozycja pokoju/zawieszenia na parę”. Pozostaje do oceny właściciela; bez zmiany kodu. Wymiana oferty AI jest cicha (jak przed zmianą).
8 (mutant T5 to symulacja w teście) — ODRZUCAM: zarzut bez wpływu; realną mutację Evaluatora (if(true) w planAiOfferOnTable) potwierdzono w jego raporcie, a T5 zostaje jako dodatkowy kontrolny przypadek.

TESTY (surowe wyniki, kandydat po obronie):
- npm --prefix gra ci --ignore-scripts: added 71 packages (worktree bez node_modules).
- tsc --noEmit (gra/tsconfig.json): exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: 6/6 pass.
- diplo-peace-offer-dedup-one-active-test: T1–T9 OK (T1 maxPair=1; T5 mutant maxPair=2 wykryty; T7 kontroferta gracza; T8 miasto; T9 guard) — WSZYSTKO ZIELONE.
- Pozostałe testy dyplomacji nielive (exit 0): diplo-city-offer-reject-own-cooldown, diplo-negotiation-round-counter, diplo-peace-auto-stale-offer, diplo-peace-winner-proposal-flow, diplo-war-peace-sim, diplomacy-bilans-unifikacja, diplomacy-negotiation-table, diplomacy-sensible-deals-main-guard, diplomacy-sensible-deals-test.
- NIE URUCHOMIONO: ok. 320 pozostałych testów dyplomacji; testy live (wymagają przeglądarki). Znane długi bazowe (dyplo-karta-duplikat-komunikat, diplo-truce-ai-table-live, weaker-seeks, main-guard R6/ZT, gate G, truce-r1/r4) nie były ponownie mierzone w tej rundzie.

BLOKADY:
1. Zarzut 3 (Przyjmij dla prezentu): przyczyna zlokalizowana (evaluateProposal pwBalance), poprawka wymaga decyzji o bramce PW — poza zakresem obrony.
2. Kryterium 2 w części komunikatu: hint zamiast zakładki Ważne — decyzja orchestratora.
3. Live Chromium: NIE ZMIERZONO.
4. Wiring w enqueueNegotiationFromAiCmdImpl pokryty tylko guardem źródłowym (T9).
5. Dwa pozostałe miejsca wywołań negotiationStillValid z ręcznym kontekstem (main.ts ~21745 i ~22148) nie dostały cityOwnerOf; oferty miast są nadal sprzątane przez pruneInvalidNegotiations (wiring w buildNegotiationWorldCtx), ale te dwa punkty sprawdzania nie sprawdzają właściciela miasta.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (r2) — weryfikacja T7/T8/T9 i poprawki planera; decyzje orchestratora: (a) hint vs Ważne, (b) bramka PW prezentu (zarzut 3), (c) live Chromium osobnym tematem.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- node_modules w worktree (npm ci --ignore-scripts) — do sprzątnięcia po zakończeniu tematu.
- Brak zmian cen, progów, cooldownów ani bramki PW autora-gracza.
- Commit lokalny; nie pushowano, nie integrowano.
