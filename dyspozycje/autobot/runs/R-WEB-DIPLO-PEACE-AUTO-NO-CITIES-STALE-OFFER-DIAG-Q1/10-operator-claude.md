STATUS: PASS-WITH-NOTES (naprawa glownej sciezki „cichego" pokoju + test behawioralny; zielone; NIE ZMIERZONO Chromium; czesc GOAL 1b-1e/2b/2c/4 NIE zrealizowana - patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1
GOAL: pokoj z graczem zapada tylko przy 100% zmeczenia (z oknem i wpisem „Wazne"); po pokoju nie wisza oferty pokoju; diagnoza sciezek pokoju.
BAZA: efda558acc574a32a7d2e1092f673c577fac7889 (origin/main), runda 2/5. Kandydat r1 a0dd452f6 NIE uzyty (jego zmiana odwrocona, zgodnie z korekta 3a).

ZMIANY-COMMIT (allowlista):
- gra/src/game/war-weariness.ts: opcjonalna zaleznosc isPlayerPair (WearinessTickDeps); w runWarWearinessTick (l.295) para z graczem poza wymuszeniem 100% konczy sie `none` - nie dochodzi do galezi offer_accepted (l.342-348).
- gra/src/main.ts: l.38899 tickAiAiWarWeariness przekazuje isPlayerPair (gracz = humanOwner); l.12772 finalizePeaceTreatyBetween usuwa z negotiationTable oferty actionId 'pokoj' tej pary (propozycja pokoju / miasto za pokoj).
- gra/tools/diplo-peace-auto-stale-offer-test.cjs (nowy).
- dyspozycje/autobot/runs/R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1/10-operator-claude.md.
Commit zawiera powyzsze pliki (nie tylko raport): raport bez kodu = BLOCK wg dispatchu.

DIAGNOZA (sciezki pokoju bez klikniecia gracza; statycznie, bez zywej gry):
1. Wymuszenie 100% (war-weariness.ts:264-286 -> main.ts:38950-38957 okno + „Wazne"): zgodne z decyzja 3a.
2. offer_accepted (war-weariness.ts:342-348): cena pokryta (cena 0 lub pelne pokrycie miastami) + bilans + tolerancja -> finalize BEZ okna i wpisu. Tick obejmowal pary z graczem (main.ts:38885-38890) => po 10 turach wojny (PEACE_PROPOSAL_MIN_WAR_TURNS=10) pokoj przy zmeczeniu ~28%. Cena 0 wynika z bramki relacji (war-weariness.ts `requiredPn: relBasedPn > 0 ? wearinessPeaceCashPn(level) : 0`, main.ts ~38870). NAJPRAWDOPODOBNIEJSZA przyczyna zgloszen 1b/1e (pokoj „bezplatnie", po 10. turze). Potwierdzone statycznie; NIE ZMIERZONO na zywo.
3. Koniec rozejmu (tickTruceExpiries): przechodzi w wojne, nie w pokoj - bez zmian.
4. Rozstrzygniecie propozycji gracza przez AI (resolvePendingNegotiationsForOwner -> applyProposalOutcome -> finalizePeaceTreatyBetween, main.ts ~21626): wymaga wpisu autorstwa gracza - nie „cichy" pokoj; NIE ZMIERZONO, ktora sciezka dala pokoj w zrzucie 1e.
5. AI->gracz (enqueueNegotiationFromAiCmdImpl main.ts:21102): tylko wstawia wpis na stol; hipoteza orkiestratora „pokoj przy powstaniu oferty" NIE potwierdzona w kodzie.
6. pendingDiplomacyInbox (main.ts ~22389): finalize po akcji gracza - wymaga klikniecia.
Wiszace oferty: finalizePeaceTreatyBetween nie czyscil negotiationTable, a negotiationStillValid (diplomacy-proposals.ts:2875) uniewaznia wpisy tylko przy wojnie - naprawione dla actionId 'pokoj' (ZMIANA 2). Miasta w „Dar/prezent" (umowa wymiany oneWayGift, main.ts:13527-13529) NIE objete.

TESTY:
- tsc --noEmit (gra/): exit 0.
- diplo-peace-auto-stale-offer-test.cjs: PASS=6 FAIL=0 (T1 zmeczenie 27,5%: gracz NIE dostaje pokoju bez zgody; T1c kontrola AI<->AI zawiera pokoj; T2 100%: pokoj wymuszony z graczem; T3 MUTANT bez bramki = stare zachowanie -> T1 czerwone; T4a/T4b wiring main.ts).
- Regresje (exit 0): diplo-peace-price-decay 13/0, price-production-paths 15/0, price-wiring 14/0, weariness-forced-peace 14/0, weariness-city-only 26/0, ai-war-weariness-peace 96/0, diplo-truce-until-turn 15/0; bez czytelnego podsumowania (exit 0): diplo-peace-ai-ai-nonnegative, diplo-peace-balance-accept, diplo-peace-stance-wiring, diplo-peace-weaker-seeks-city-only, diplo-weariness-forced-peace-wiring, diplo-weariness-pw-behavior, ai-losing-war-asks-peace-vs-player, diplo-truce-impl, diplo-war-peace-gate, diplomacy-peace-lock, peace-gate-military-strength, diplo-truce-r1, diplo-truce-r4-ai, diplo-war-peace-main-guard, diplomacy-test, diplo-war-peace-sim, diplo-truce-n6-saveload, diplomacy-negotiation-table, diplomacy-proposal.
- logic-test PASS 213; research-test 33/0; combat-test exit 0; tech-tree-test, unit-replace-test exit 0 (bez wiersza podsumowania).

BLOKADY / NIE ZROBIONE:
- NIE ZMIERZONO: Chromium+xvfb, tabela tur, okno/„Wazne" na zywo; test pelnopetlowy (a) nie dostarczony (T1-T3 testuja funkcje silnika, nie pelna petle).
- Nie zbadane: GOAL 1b(i)-(iii) (blokada 10 tur, „Przyjmij"/„Brakuje PW", kierunek platnosci 1218 PW), 1c (kierunek platnosci autor/adresat), 1d(b)-(d) i 1e (prezent „Dar" z miastami, blokada „Przyjmij" bilansem PW, pusta „Umowa wymiany", zmiana listy miast City18->City53). Bilans PW nie czytany (diplomacyAcceptanceBalance.ts nieotwarty w tej rundzie).
- Zmiana zachowania: AI nie zawiera juz pokoju z graczem ponizej 100% zmeczenia (zgodnie z 3a). Skutek: wojna z graczem przy <100% trwa, dopoki gracz nie zgodzi sie w negocjacjach albo zmeczenie nie dojdzie do 100%.

DECISION_REQUIRED (do orkiestratora / wlasciciela):
Cena pokoju 0 przy zmeczeniu ~28% dla pary (bramka relacji zeruje cene: war-weariness.ts `relBasedPn > 0 ? ... : 0`). Sprzeczne z opisem PEACEDECAY (cena = 6000 x (1-L), 0 dopiero przy L=1)?
 A) zostawic bramke relacji (cena 0 mozliwa przed 100%, dla AI<->AI i pokoju za zgoda);
 B) cena zawsze wg wzoru (przy 28% ok. 4320 PN) - zmiana liczbowa, wymaga decyzji;
 C) bramka relacji zeruje cene tylko przy 100% (wymuszenie).
Rekomendacja: B (zgodne z PEACEDECAY A). Nie wprowadzalem zmiany - to decyzja liczbowa.

UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules zainstalowane (npm ci --ignore-scripts, ok. 134 MB) - do usuniecia po bramkach.
- Logi bramek zapisane w /tmp/claude-0/ (poza repo; odstepstwo od zalecenia scratchpad).
- Commit zawiera kod i test (allowlista), nie tylko raport - zob. ZMIANY-COMMIT.

RUNDY: 2/5 (Operator; ocena Evaluatora po tej rundzie)
NASTEPNY KROK: Evaluator r2 na tym SHA; decyzja DECISION_REQUIRED (cena 0 przy <100%); osobny temat na pkt 1b(i)-(iii), 1c, 1d(b)-(d), 1e (prezent, bilans PW, pusta umowa).
DEPLOY/PUSH: NIE WYKONANO
