STATUS: PASS-WITH-NOTES (zakres częściowy: moduł czysty + testy; wiring NIE wykonany)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1
GOAL: funkcja czysta nośnika dopłaty D w traktatach (technologie → złoto → brąz → żelazo → rudy → praca → pieniądze), testowana i odporna na mutacje. Wpięcie w przepływ propozycji i okno — poza tą rundą.
ZMIANY-COMMIT: baza 0c12240a3 (origin/main). Nowe pliki:
- gra/src/game/treaty-payment.ts — composeTreatyPayment, treatyTechCandidates, treatyPaymentLabel, TREATY_STAGE_LABEL. Ogon używa composePeaceTail z peace-tail-payment.ts (bez duplikacji logiki); peace-tail-payment.ts NIE zmieniony, pokój i rozejm NIE ruszone.
- gra/tools/diplo-treaty-payment-carrier-test.cjs — 11 asercji + 5 mutantów źródła.
Commit: patrz sekcja SHA w odpowiedzi operatora (czubek brancha operatora).
TESTY (surowe wyniki, ZMIERZONO):
- npm ci --ignore-scripts w gra/: added 71 packages.
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: COMBAT TEST 6/6 pass.
- diplo-peace-tail-integration-test: 42 pass / 0 fail (przed = po; brak zmian w peace-tail-payment.ts).
- diplo-peace-tail-proposal-test: 9 pass / 0 fail.
- diplo-war-peace-sim-test: 25 pass / 0 fail.
- diplo-peace-last-stage-payment-test: OK (mutant M3 wykryty).
- diplo-treaty-payment-carrier-test: 11 pass / 0 fail; mutanty M1 (tanie-pierwsze), M2 (brak filtra techów drugiej strony), M3 (brak limitu bez nadpłaty), M4 (pominięty ogon), M5 (praca bez limitu zapasu) — wszystkie KILLED.
- treaty-parity: NIE ZMIERZONO — w tools/ nie ma pliku o tej nazwie.
BLOKADY:
1. Wiring NIE zrobiony: diplomacy-proposals.ts (gate treatyParityPowerGate, ścieżki akceptacji), main.ts (wykonanie przelewu technologii/surowców po akceptacji traktatu), okno propozycji (diplomacyAcceptanceBalance.ts). Bez tego nośnik nie przenosi żadnych pozycji — NIE ZMIERZONO w grze.
2. Brak w ctx: lista technologii płatnika/drugiej strony i wycena PN technologii w ProposalEvalContext (wymaga wstrzyknięcia z main.ts).
3. ZAŁOŻENIA (luki w dispatchu):
   a) Technologia: greedy od najdroższej, tylko gdy cena ≤ reszty (bez nadpłaty); reszta idzie w ogon.
   b) „złoto (Skarbiec)" i „pieniądze ¤" są różnymi stopniami w dispatchu, ale w ogonie pokoju złoto = Skarbiec w ¤. Tu stopień „pieniądze" jest opcjonalnym stopniem wejściowym (extraStages, domyślnie pusty) — ZAŁOŻENIE do potwierdzenia przez właściciela, czy ¤ to osobna pula.
   c) Stopnie praca/pieniądze wyceniane przez wywołującego (brak wyceny = pominięte).
RUNDY: 1/5
NASTĘPNY KROK: runda 2 — wiring w diplomacy-proposals.ts (composeTreatyPayment w gałęzi parytetu gracza, bez zmiany zachowania pokoju/rozejmu) + ctx z technologiami w main.ts + testy integracyjne NAP/sojusz obu kierunków + mutanty wiringu; decyzja właściciela o puli ¤ (założenie 3b).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: brak znalezisk poza zakresem. Pliki node_modules w gra/ (npm ci) nie są śledzone przez git (git status czysty poza nowymi plikami); do sprzątania po temacie.
