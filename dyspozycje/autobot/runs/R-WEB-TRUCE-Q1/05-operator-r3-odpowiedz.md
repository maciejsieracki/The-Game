STATUS: FAIL (runda 3/5, częściowo — NIE PASS; N4, N5, N7-w-grze NIE_ZROBIONE)
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TRUCE-Q1
GOAL: rozejm jako propozycja stołu (5/10/15 tur), baza PW 200, wspólne bramki z pokojem, wygaśnięcie bez kary, złamanie w oknie = kara + flaga agresora, AI, UI, zapis/odczyt.
BAZA: 939342541 (Operator r3 częściowo). Gałąź robocza: wip/truce-r3-op.

ODPOWIEDZI NA ZARZUTY
- Allowlista / git diff --check: PRZYJMUJĘ (diff --check czysty).
- N1 (main.ts, brak obsługi rozejmu): PRZYJMUJĘ, CZĘŚCIOWO DOMKNIĘTE.
  - finalizePeaceTreatyBetween(…, truceTurns) — rozejm reużywa całą gałąź zawarcia pokoju (cleanup wojen wymuszonych, oblężeń), zamiast startPeaceTreatyLock ustawia truceUntilTurn i zeruje peaceUntilTurn/n3Window (gra/src/main.ts ~10606-10650).
  - applyProposalOutcome: gałąź cywAction === 'rozejm' (gra/src/main.ts ~22190), długość z payload.turns (normalizeTruceDuration, domyślnie TRUCE_DEFAULT_TURNS).
  - tickTruceExpiries() (gra/src/main.ts ~10760), wołane w endTurn obok tickWiarygodnoscBezWojnyMilestone: 'revert_to_war' przy statusie 'pokoj' → wojna, BEZ Wiarygodności, BEZ zerwania traktatów, BEZ zarejestrujWypowiedzenie (brak flagi agresora).
  - chargeWarDeclarationCredibility (gra/src/main.ts ~10814) zwraca truceBreach, nalicza karę N2-NAP, zeruje truceUntilTurn. Cztery miejsca wypowiedzenia (gracz, ownerDeclareWarOn, klaster CS, AI) przekazują zlamanieRozejmu → przyczyna 'bez_powodu' (gra/src/game/diplomacy.ts: WarCauseInput, przyczynaWypowiedzenia).
  - Integracja z transferCityByTreaty: NIE ZBADANE w tej rundzie. Rozejm idzie tą samą ścieżką oneShotTrade co pokój, a cityCessionPayloadBlockReason jest wołany dla obu — ZAŁOŻENIE.
  - Dowód: statyczna inspekcja + wiring test. Test cyklu życia w grze NIE_ZMIERZONO.
- ProposalActionId nie zawiera 'rozejm': ODRZUCAM. Dowód: gra/src/game/diplomacy-proposals.ts:94-95 (`| 'rozejm';` w typie ProposalActionId, start ~71).
- Brak UI dla rozejmu: PRZYJMUJĘ. proposalActionIdFromUi (gra/src/ui/diplomacyTradeBasket.ts:1452) nie ma mapowania, diplomacyAudience.ts:1641 nie ma przycisku. NIE_ZROBIONE (N5).
- truceUntilTurn jako martwe pole: PRZYJMUJĘ, pole jest teraz używane w finalize, charge i tick. Zapis: pary zapisywane jako Array.from(diplomacyPairMeta) (gra/src/main.ts ~32911), więc pole trafia do save automatycznie. Roundtrip w grze NIE_ZMIERZONO.
- N2 (P8 obchodzi żywnością): PRZYJMUJĘ. P8 przepisany na złoto (400), kontrola pokój 600 złota (gra/tools/diplo-truce-r1-test.cjs). Mutacja N2 (usunięcie 'rozejm' z PEACE_CURRENCY_ACTION_IDS): P8 FAIL „W wojnie pieniądze tylko w ugodzie pokojowej”, war-gates 3 FAIL. Plik przywrócony przez git checkout.
- N3 (przegląd 'pokoj'): PRZYJMUJĘ. SWEETENER_COUNTER_ELIGIBLE (gra/src/game/diplomacy-proposals.ts:2600): dodano 'rozejm' (ta sama bramka PW). diplomacyAcceptanceBalance.ts:366 (`uiActionId !== '10'`): '10' = pokój (proposalActionIdFromUi); rozejm nie ma wiersza UI, a silnik odrzuca rozejm z pwBalance<0 (P10), więc ogólna bramka jest spójna — ZAŁOŻENIE. diplomacy-ai-offer-balance.ts:527 to tylko komentarz. Test bramki PW rozejmu z ujemnym bilansem: P10 (PASS).
- N4 (ai.ts): PRZYJMUJĘ, NIE_ZROBIONE. grep 'rozejm|truce' w ai.ts = 0; brak komendy AI zaproponuj_rozejm.
- N5 (UI + Chromium + zrzut): PRZYJMUJĘ, NIE_ZROBIONE.
- N6 (save/load + reset): CZĘŚCIOWO. Pole w DiploPairMeta; zapis przez Array.from(diplomacyPairMeta) (~32911), reset przez diplomacyPairMeta.clear() (~9709). Roundtrip w grze NIE_ZROBIONE.
- N7 (mutacje gałęzi cyklu życia): CZĘŚCIOWO. Mutacje czystych helperów (M4/M5 w diplo-truce-r1-test) PASS. Mutacje gałęzi main.ts NIE_ZMIERZONO (brak Chromium/gry w tej rundzie).

TESTY (worktree; gra/node_modules z npm ci, usunięte po etapie):
- tsc --noEmit: 0 błędów.
- diplo-truce-r1-test: 30/0 (było 29/0; P8 przepisany, P8b dodany).
- war-gates 22/0; peace-lock 9/0; diplomacy-test 148/0; acceptance-points 304/0.
- city-cession 79/0; city-cession-r3 73/0; war-peace gate 11/0; main-guard 28/0; d7 8/0; profile-unit 198/0; sim 22/0.
- diplo-aggressor unit 73/0; wiring 15/0 (zaktualizowano 3 wzorce pod zlamanieRozejmu i odjęcie wygaśnięcia rozejmu z liczby wypowiedzeń); mutation 19/19 KILLED.
- forced-war-relation-gate 14/0; forced-war-iron 54/0; forced-war-iron-main-guard 35/0.
- civ-matrix-ai-diplomacy-wiring 42/1 — znana czerwona baza, bez zmian.
- git diff --check: czysty.
- NIE_ZMIERZONO: live Chromium, war-era-counter, multiwar, ring.

BLOKADY: N4 ai.ts; N5 UI/Chromium/zrzut; N7 mutacje gałęzi main.ts; N6 roundtrip w grze; integracja z transferCityByTreaty nieoglądana.
RUNDY: 3/5 (r4: N4, N5, N6, N7; r5 rezerwa)
NASTĘPNY KROK: runda 4 Operatora — N5 (mapowanie UI dla rozejmu, przełącznik 5/10/15, hak testowy, Chromium), N4 (ai.ts), N7 (mutacje main.ts), N6 (roundtrip).
DEPLOY/PUSH: NIE WYKONANO
