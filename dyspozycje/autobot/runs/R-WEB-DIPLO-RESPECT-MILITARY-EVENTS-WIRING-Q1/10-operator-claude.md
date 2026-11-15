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

=====================================================================
RUNDA 2/5 (Operator HAIKU, 2026-11-15) — wykonanie DODATKU orkiestratora
=====================================================================
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1 (runda 2)
GOAL: domknąć punkty FC r1: (1) hak testowy, (2) test żywy Chromium tury 1–30 z kierunkiem, jednorazowością, round-tripem i starym zapisem, (3) zrzut panelu z pozycją w rejestrze, (4) bramki referencyjne.

BAZA (rozbieżność z dispatchem zgłoszona): dispatch podawał 2fe362553, DODATEK r2 nakazuje bazę 7167ad9b9 (kandydat r1, refs/keep/R-WEB-RESPECT-obrona) + merge origin/main 7c2074e00. Wykonano według DODATKU: checkout 7167ad9b9, merge 7c2074e00 (konflikty: docs/encyklopedia/pojecia/respekt.md → wersja r1 (HEAD), gra/src/data/wikiBundle.json → regeneracja narzędziem bundle-wiki-for-game.cjs). 2fe362553 NIE jest przodkiem 7167ad9b9.

ZMIANY (ten commit):
 - gra/src/main.ts: hak `window.__respektMilTest` (tylko ?civTest=1): owners, progRespektProc, sila (readOnly + przeliczenie cache Mocy po addUnit), stan, log (rejestr diplomacyFactorLog), metaRoundTrip (JSON), stripStan (stary zapis), setZapasy (zapas spichlerza dla bramki NNS w scenariuszu testu), setPokoj (kontakt + pokój jak w __aiTradeWiringTestDebug.prepare). Produkcja: brak zmian logiki gry.
 - gra/tools/diplo-respect-military-live-test.cjs (NOWY): test żywy Chromium, 30 tur, realny endTurn i realny tick, siła przez __civTest.addUnit przy mieście właściciela.
 - dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1/evidence/ (zrzut panelu + JSON wyniku).
 - gra/src/data/wikiBundle.json (regeneracja po merge), docs/encyklopedia/pojecia/respekt.md (rozstrzygnięcie konfliktu merge na wersję r1).

ZMIERZONO:
 (1) hak testowy: wykonany (patrz wyżej); tsc --noEmit: 0 błędów.
 (2) test żywy Chromium (bundle vite z gra/ budowany do katalogu POZA repo, file://, ?playtest=mapa&civTest=1): WYNIK 32 OK / 0 FAIL, zero console.error/pageerror, tura końcowa 30.
     - T1 balans 0,9–1,1 → inicjalizacja stanu 'brak', bez zdarzenia (OK).
     - T2 gracz ≥1,6× → +15 raz, stan A, offset +15, rejestr przewaga_militarna_respekt (OK).
     - T3–T6 utrzymanie (ratio 1,89–1,92) → brak ponownego +15 (OK).
     - T7 ratio 1,21 (<1,25) → stan brak, bez zdarzenia (OK).
     - T8 ponowne przekroczenie → drugie +15 (OK).
     - T9 AI ≥1,6× gracza → stan B, −10 raz (slabszy_militarnie_respekt), offset 30−10=20 (OK).
     - T10–T12 utrzymanie słabszego → brak ponownego −10 (OK).
     - T13 balans → brak, bez nowych zdarzeń (OK).
     - T14 round-trip meta przez JSON zachowuje respektPrzewagaStan i respektMilOffset; tick po round-tripie nie zmienia stanu (OK).
     - T15 stary zapis (stripStan) → inicjalizacja bez nowego zdarzenia; offset = 0 (brak pola = 0 wg kontraktu) (OK).
     - T16–T30 balans → brak nowych zdarzeń (liczba wpisów bez zmian) (OK).
     - Zdarzenia są realnie odpalane w ticku dyplomacji (runDiplomacyTurnTick → applyMilitaryRespektEdgeTick), nie tylko w helperze.
 (3) zrzut Chromium panelu: /evidence/respekt-live-t15.png — widok „Audiencja dyplomatyczna” (REALNE kliknięcie: pasek lewy → panel Dyplomacja → wiersz cywilizacji), sekcja „ZA CO CIĘ LUBIĄ”: „Przewaga militarna +15” (x2) i „ZA CO CIĘ NIE LUBIĄ”: „Słabszy militarnie −10”; pasek Respektu 87/100 widoczny. Tekst strony zweryfikowany skryptem (panelOpened, panelRowClicked, panelHasPrzewaga = true).
 (4) bramki referencyjne (ta sama baza):
     - diplomacy-city-cession-r3-test: 56 pass / 17 fail — IDENTYCZNIE na bazie 7c2074e00 (56/17) → czerwone na bazie.
     - diplomacy-stol-pw-sum-test: 167 pass / 1 fail — IDENTYCZNIE na bazie (167/1) → czerwone na bazie.
     - diplomacy-border-era-penalty-live-test (GAME_URL=file://…respect bundle): RESULT PASS.
     - diplomacy-direct-negotiation-live-test: rc=1 — `window.__audienceRelTestDebug.setupListRelationsFixture is not a function`; hook nie istnieje w main.ts ani na bazie 7c2074e00 → czerwone na bazie.
     - diplo-truce-live-test (L2b): 13 pass / 1 fail — `endUntilTurn: nie osiągnięto tury 5`; IDENTYCZNIE na bazie 7c2074e00 → czerwone na bazie.
     - diplo-truce-impl-test: 94 PASS / 0 FAIL. diplomacy-border-era-penalty-test: 39 pass / 0 fail.
     - diplo-respect-military-events-test 30/0; diplo-respect-military-edge-test 12/0; diplo-respect-military-offset-test 12/0.
 - Mutacja M4 (zamiana kierunku A↔B w applyMilitaryRespektEdgeTick): test żywy CZERWONY (exit 1, m.in. „T2: +15 Respektu z rejestru” — w rejestrze −10, offset −10). Mutacja przywrócona przed commitem (git diff main.ts: tylko hak testowy).
 - git diff --check: czysty (sprawdzone przed commitem).
 - Dysk przed startem: 6,8 GB wolne; po buildach ~5,3 GB.

NIE ZMIERZONO / BLOKADY:
 - Zapis/odczyt gry przez prawdziwy zapis slotu (IndexedDB) dla pól respektPrzewagaStan/respektMilOffset: NIE ZMIERZONO w przeglądarce — zweryfikowano round-trip meta przez JSON (ta sama serializacja co pairMeta w zapisie) i kontrakt „stary zapis”.
 - Pasek Respektu „przesunięty poprawnie” względem wartości z haka: NIE ZMIERZONO porównaniem liczbowym (na zrzucie 87/100 dla Grecy, a hak raportuje respekt pary gracz→AI w innej perspektywie; nie zestawiono z pozostałymi wartościami).
 - Z7 r1 (AI↔AI): założenie bez zmian (zdarzenia tylko gracz–AI); nie sprawdzono innych ticków AI↔AI.
 - Wartość offsetu po wielu przejściach (50 → 65 → …): zgodnie z założeniem r1 (korekta trwała, sumuje się); do potwierdzenia przez FC.
 - Zarzut FC Z3 (panel): w zrzucie pasek Respektu 87/100 jest z pętli relacji (korekta przeżywa tick, respektZKorektaMilitarna), ale brak dowodu A/B w tej rundzie — DO POTWIERDZENIA.

ZALOŻENIA (runda 2):
 - Próg 50% (progRespektProc) i jednorazowość bez zmian względem decyzji ABC 2026-11-14.
 - Hak testowy steruje siłą wyłącznie przez REALNE addUnit przy mieście właściciela; brak nadpisywania progu/siły w produkcji.
 - Scenariusz testu ustawia pokój z partnerem AI (jak prepare w teście aitrade), bo startowa wojna powodowała bitwy blokujące endTurn; to ustawienie scenariusza, nie reguła gry.

NASTĘPNY KROK: Evaluator r2 (kryteria (c), (e) — dowody w gra/tools/diplo-respect-military-live-test.cjs i evidence/); FC: rozstrzygnąć DO POTWIERDZENIA (pasek vs wartość haka; offset po wielu przejściach; zapis slotu).
RUNDY: 2/5 (ostatni werdykt FC r1: FAIL na (c) i (e) oraz Z1/Z2/Z6)
DEPLOY/PUSH: NIE WYKONANO
