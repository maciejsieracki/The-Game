STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
GOAL: zdarzenia Respektu „Przewaga militarna” (+15, gracz silniejszy o >=50% siły wojskowej) i „Słabszy militarnie” (−10, gracz słabszy) podpięte pod tykającą logikę Respektu, jednorazowo na przejściu progu, próg 50% z jednego parametru JSON.
ZMIANY/COMMIT: baza ac3352c25 (origin/main); commit z kodem i raportem. Allowlista: gra/src/game/diplomacy-military-strength.ts (progRespektProc, respektMilitaryCrossing), gra/src/game/diplomacy-pn-engine.ts (pole respektPrzewagaStan), gra/src/game/diplomacy.ts (komentarze 2x/5x → 50%), gra/src/main.ts (applyMilitaryRespektEdgeTick wołane w runDiplomacyTurnTick po tickTruceExpiries), gra/data/diplomacy-military-strength-params.json (progRespektProc=50), gra/data/diplomacy.json (uwaga opisu), gra/src/data/wikiBundle.json (regeneracja narzędziem, diff 1 linia), docs/encyklopedia/pojecia/respekt.md, gra/tools/diplo-respect-military-events-test.cjs (sekcja D: wiring), gra/tools/diplo-respect-military-edge-test.cjs (nowy).
ZALOZENIA (luki w dispatchu, rozstrzygnięte przeze mnie):
 1. Zdarzenia dotyczą tylko pary gracz–partner (AI; bez barbarzyńców i państw-miast). AI↔AI nie dostaje zdarzeń (istniejące reguły Respektu AI↔AI nie przewidują tych zdarzeń).
 2. Przewaga gracza → +15 przez applyDiploEventTracked(gracz, AI, ..., 'przewaga_militarna'); gracz słabszy → −10 ('slabszy_militarnie'). Jedno zdarzenie na przejście progu.
 3. Miara siły = diploMilitarySideOf (Siła militarna, nie Power), ta sama funkcja dla obu stron; w pokoju też liczona (armia + rekruci).
 4. Stan przejścia w DiploPairMeta.respektPrzewagaStan ('A'|'B'|'brak'); brak pola (stare zapisy) = 'brak', więc przy pierwszym ticku po wdrożeniu może zadziałać jednorazowe przejście, jeśli para już ma >=50% przewagi.
 5. Próg 50% ma osobny parametr progRespektProc; progPrzewagiProc = 20 (próg wojny) nietknięty.
TESTY:
 - node tools/diplo-respect-military-edge-test.cjs → 12 OK, 0 FAIL (1,49 brak; 1,50 raz; utrzymanie bez ponownego naliczenia; spadek i ponowne przekroczenie; symetria −10; zera; brak stanu; mutacja progu 20% daje zdarzenie przy 1,49).
 - node tools/diplo-respect-military-events-test.cjs → 28 OK, 0 FAIL (sekcja D przepisana na wiring).
 - node tools/diplo-military-strength-test.cjs → 27 PASS / 0 FAIL.
 - npx tsc --noEmit → bez błędów (wyjście puste).
 - git diff --check → czysty.
 - Wszystkie 137 skryptów tools/diplo*.cjs, *respekt*.cjs, *diplo*.cjs: 124 zielone, 13 czerwonych. Wszystkie 13 czerwonych odtworzone identycznie na bazie ac3352c25 (git archive do katalogu roboczego, ten sam node_modules): civ-matrix-ai-diplomacy-wiring-test, diplomacy-stol-pw-sum-test, diplomacy-city-cession-r3-test, pr141-hotseat-diplomacy-owner-test, diplomacy-border-era-penalty-live-test, diplo-live-verify-s2c-s3c, diplo-truce-ai-table-live-test, diplo-truce-live-test, diplomacy-direct-negotiation-live-test (RC1); diplo-aggressor-marker-live-test, diplo-live-verify-steps-1-4, diplo-truce-saveload-live-test, diplo-war-peace-live-test (RC124 timeout). Brak regresji od tej zmiany.
BLOKADY:
 - (c) test integracyjny na prawdziwym ticku dyplomacji (tury 1–30, dwie cywilizacje z kontrolowaną różnicą siły): NIE ZMIERZONO. Pokrycie jednostkowe (funkcja czysta) i wiring statyczny.
 - (e) zrzut Chromium panelu dyplomacji z pozycją „Przewaga militarna” w rejestrze Respektu: NIE ZMIERZONO (brak uruchomienia przeglądarki w tej rundzie).
 - Rejestr Respektu w panelu: NIE ZMIERZONO, czy pozycje „Przewaga militarna”/„Słabszy militarnie” pojawiają się w UI (recordDiploFactor zapisuje event + '_respekt' zgodnie z istniejącym wzorcem; widok nieweryfikowany).
RUNDY: 1/5
NASTEPNY KROK: runda 2 (Operator Haiku): test (c) na prawdziwym ticku (headless) i zrzut (e); potem Evaluator.
UWAGI-DLA-ORKIESTRATORA:
 - Testy diplo-* w czasie uruchomienia nadpisują zrzuty PNG w dyspozycje/autobot/runs/*/evidence i dowody/ (zmiany w git). Przywrócone przed commitem; przy FC trzeba je ignorować lub odtwarzać z bazy.
 - Dług: 13 czerwonych testów jest w bazie (lista wyżej) — osobny temat.
DEPLOY/PUSH: NIE WYKONANO
