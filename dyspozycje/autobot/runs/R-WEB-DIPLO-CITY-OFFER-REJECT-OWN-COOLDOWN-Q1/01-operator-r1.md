STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-DIPLO-CITY-OFFER-REJECT-OWN-COOLDOWN-Q1
GOAL: Odrzucenie oferty miasta za pokój (oferuj_/zada_miasto_za_pokoj) zapisuje osobny klucz cooldownu 'miasto_za_pokoj' zamiast 'pokoj'; zwykły pokój i oferta miasta nie blokują się wzajemnie. Długość cooldownu (3 tury) i pozostałe klucze bez zmian.

BAZA: origin/main 2339b3dab (worktree HEAD przed zmianą = 2339b3dab).

ZBADANIE (plik:linia, stan przed zmianą):
- Zapis odrzucenia: gra/src/main.ts `handleNegotiationReject` → `recordRejectedOffer(..., entry.actionId, turn)` (jedyne miejsce zapisu, main.ts ~19724). Klucz = actionId wpisu = 'pokoj' dla obu komend miasta.
- Sprawdzenie: gra/src/main.ts `enqueueNegotiationFromAiCmd` → `isOfferRejectedOnCooldown(..., converted.actionId, turn)` (main.ts ~19349).
- Konwerter: gra/src/game/diplomacy-proposals.ts `aiCommandToPendingProposal` case 'oferuj_miasto_za_pokoj' (~2016) i 'zada_miasto_za_pokoj' (~2026) → actionId 'pokoj'.
- ai.ts: NIE czyta rejectedOfferCooldowns (brak odczytu w ai.ts; grep potwierdził). Komendy miasta trafiają na stół tylko przez main.ts (~40356 → enqueueDiplomacyPendingFromCmd → enqueueNegotiationFromAiCmd). Nie zmieniano ai.ts.

ZMIANY-COMMIT: b8bd14e45 (kod + test)
- gra/src/game/diplomacy-rejection-cooldown.ts: typ `RejectCooldownKey = ProposalActionId | 'miasto_za_pokoj'`, stała `CITY_FOR_PEACE_COOLDOWN_KEY`, helper `rejectCooldownKeyFor(cmdType, actionId)`; typy parametrów poszerzone do RejectCooldownKey. Logika cooldownu bez zmian.
- gra/src/game/diplomacy-proposals.ts: opcjonalne pole `PendingNegotiation.rejectCooldownKey?: 'miasto_za_pokoj'` (brak pola = dotychczasowe zachowanie; stare zapisy OK; applyCounterOffer zachowuje pole przez spread).
- gra/src/main.ts: sprawdzenie używa `rejectCooldownKeyFor(workingCmd.type, converted.actionId)`; wpis dostaje `rejectCooldownKey` dla komend miasta; zapis odrzucenia używa `entry.rejectCooldownKey ?? entry.actionId`.
- gra/tools/diplo-city-offer-reject-own-cooldown-test.cjs (nowy): 22 asercje.

ODCHYLENIE OD ALLOWLISTY (jawnie): dotknięto gra/src/game/diplomacy-rejection-cooldown.ts, którego nie ma w allowliście (allowlista obejmuje tylko diplomacy-proposals*.ts). Powód: to jedyne źródło typu i funkcji cooldownu; bez poszerzenia typu wywołania z 'miasto_za_pokoj' nie kompilują się. Zmiana jest czysto typowa + jeden helper; istniejący test tools/diplomacy-rejection-cooldown-test.cjs nie był modyfikowany i przechodzi.

TESTY:
- diplo-city-offer-reject-own-cooldown-test.cjs: 22 pass, 0 fail.
- Mutacja (helper ignoruje komendy miasta): 8 FAIL, exit 1; po przywróceniu exit 0.
- diplomacy-rejection-cooldown-test.cjs: 14 pass, 0 fail.
- diplomacy-proposal-test.cjs: 190/190 PASS.
- ai-losing-war-asks-peace-vs-player-test.cjs: 12 PASS / 0 FAIL.
- ai-war-weariness-peace-test.cjs: PASS=90 FAIL=0.
- ai-test.cjs: 289 passed, 0 failed.
- logic-test.cjs: LOGIC OK (213/213).
- tsc --noEmit (gra/): exit 0.
- git diff --check: czysto.
- Nie uruchamiano npm run build/dev. Test w przeglądarce nie dotyczy (zmiana logiki, bez UI).

NIE_ZMIERZONO: test end-to-end handleNegotiationReject w main.ts (closure, brak harnessu); pokryte przez wiring + test logiki kluczy. Zachowanie cooldownu w realnej grze nieweryfikowane.

BLOKADY: brak. Uwaga (poza zakresem, nie zmieniano): dedup `hasPendingNegotiationForPair` używa actionId 'pokoj', więc oferta miasta może być zablokowana przez oczekującą zwykłą propozycję pokoju (i odwrotnie). Osobny temat, jeśli właściciel chce.

RUNDY: 1/5 (ostatni dodatek: brak; dispatch bazowy)
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na b8bd14e45 + ocena odchylenia allowlisty dla diplomacy-rejection-cooldown.ts.
DEPLOY/PUSH: NIE WYKONANO
