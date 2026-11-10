STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-IMPL-Q1
GOAL: wdrożyć luki rozejmu wg ABC 2026-11-09 (runda 3, wyłącznie luki): (B) po wygaśnięciu rozejmu propozycja pokoju do drugiej strony (zgoda = pokój, odmowa/timeout = wojna); (C) rozejm 0 Zaufania; (E) AI wybiera tryb wg pozycji i zmęczenia wojną; (G) kontroferta może zmienić długość 5/10/15. Baza: origin/main 6dbe57e62 (zmerge'owane na starcie = bez zmian).
ZMIANY/COMMIT: commit bdb6caa8b (kod + test), commit raportu: patrz SHA w sekcji RUNDY/NASTĘPNY KROK (ten plik). Allowlista: gra/src/main.ts, gra/src/game/ai.ts, gra/src/game/diplomacy-peace-lock.ts, gra/src/game/diplomacy-pn-engine.ts, gra/tools/diplo-truce-impl-test.cjs (nowy), gra/tools/diplo-truce-r4-ai-test.cjs (1 linia: kotwica mutanta M3), dyspozycje/autobot/runs/R-WEB-DIPLO-TRUCE-IMPL-Q1/03-operator-r3.md. Diff vs origin/main: 6 plików, +351/-13. Nie tknięto gra/ poza wymienionymi, WERSJE.md, gra-robocza/, wikiBundle.

STAN WYJŚCIOWY (weryfikacja kodu na 6dbe57e62): rozejm 5/10/15 JUŻ JEST (R-WEB-TRUCE-Q1): status 'pokoj' + meta.truceUntilTurn; StanWojny.Rozejm nieużywany. Luki R2 potwierdzone i zamknięte w tej rundzie:
- B: tickTruceExpiries cofał zawsze do wojny → teraz oferta.
- C: finalizePeaceTreatyBetween dla truceTurns wywoływał applyDiploEventTracked('pokoj') (+5 Zaufania) → teraz tylko status.
- E: aiPeaceProposalKind liczył tylko tury wojny → teraz aiTruceOrPeaceMode.
- G: counterInitial dla akcji '10' nie niósł trybu rozejmu ani długości → teraz niesie.

ZROBIONE (szczegóły):
1. diplomacy-peace-lock.ts (czyste helpery): TRUCE_AI_FATIGUE_PEACE_MIN=0,5; TRUCE_AI_TRUST_PEACE_MIN=60; aiTruceOrPeaceMode(); TRUCE_END_AI_ACCEPT_TRUST_MIN=40; truceEndAiAccepts(); truceEndOfferTarget(); truceEndOfferExpired().
2. diplomacy-pn-engine.ts: DiploPairMeta += truceInitiatorId?, truceEndOffer?{turn,fromOwnerId,toOwnerId}.
3. main.ts finalizePeaceTreatyBetween: gałąź rozejmu → setDiploRelation(..., {...cur, status:'pokoj'}) (C: bez +5); zapisuje truceInitiatorId=proposerId; gałąź pokoju stałego bez zmian w Zaufaniu, czyści truceEndOffer/truceInitiatorId/truceUntilTurn.
4. main.ts tickTruceExpiries (B): (a) oferta w toku: tura > tura oferty → truceEndToWar (timeout); (b) wygaśnięcie rozejmu, status pokoj: adresat = nie-inicjator; gracz → meta.truceEndOffer + enqueueDiplomacyPending(inicjator,'zaproponuj_pokoj'); AI → zgoda (Zaufanie ≥ 40) → finalizePeaceTreatyBetween (pokój stały, +5, blokada DOW 10 tur), brak zgody → wojna; brak inicjatora (stare zapisy) → wojna jak dotychczas.
   Nowe helpery: clearTruceEndOffer(a,b) (meta + wpis skrzynki), truceEndToWar(a,b) (wojna przez applyDiploEventTracked 'wojna_wypowiedziana', bez kary Wiarygodności, jak przed zmianą).
5. main.ts resolvePendingDiplomacy: zgoda gracza na zaproponuj_pokoj → finalize (pokój stały); odmowa przy aktywnej ofercie → truceEndToWar.
6. main.ts chargeWarDeclarationCredibility: wypowiedzenie wojny kasuje ofertę (clearTruceEndOffer) i truceInitiatorId.
7. ai.ts decideAIDiplomacy (zaproponuj_pokoj): rodzaj = aiTruceOrPeaceMode({fatigueShare: warWearinessShare(turnsAtWarRel, warProfile.zmeczenieT), zaufanie: rel.relation.zaufanie, weaker: rw<=progPokojSlabosc || wantsPeace, fallbackKind: aiPeaceProposalKind(turnsAtWarRel)}). Powód tekstowy uwzględnia wybrany tryb.
8. main.ts counterInitial (akcja '10', entry.actionId==='rozejm'): peaceKind='rozejm', truceTurns=p.turns → kontroferta otwiera się w trybie rozejmu; zmiana 5/10/15 w kontrofercie przez istniejący wybór w UI (diplomacyTradeBasket truceTurns).

ZAŁOŻENIA (zastosowane, do akceptacji orkiestratora):
- Z1 (B) adresat propozycji = strona NIE będąca inicjatorem rozejmu (truceInitiatorId). Alternatywa „obie strony mogą” nie wdrożona.
- Z2 (B) w oknie oferty status pozostaje 'pokoj' (brak ataków w oknie); gracz ma jedną turę na odpowiedź, timeout = wojna.
- Z3 (B) AI-adresat decyduje deterministycznie po Zaufaniu ≥ 40 (przybliżenie gotowości). Nie użyto willingnessPeace w silniku (wymagałoby obiektu Player w tick).
- Z4 (E) progi: zmęczenie ≥ 0,5 LUB Zaufanie ≥ 60 → pokój stały; słabsza przy niskim zmęczeniu i Zaufaniu → rozejm; brak sygnału → dotychczasowe 20 tur. Zmęczenie = warWearinessShare (live, nie stała).
- Z5 (D) zgodnie z N1 (założenie orkiestratora): wypowiedzenie wojny w oknie rozejmu dozwolone i karane jak złamanie paktu; rozejm NIE zakłada blokady DOW (peaceUntilTurn). Wymóg „wojna nie może być wypowiedziana w rozejmie” NIE wdrożony (sprzeczność z istniejącą decyzją N1; zostawione zgodnie z założeniem).
- Z6 (3 z dispatchu, toRelation) NIE ZMIENIANO: rozejm nie używa StanWojny.Rozejm; blokada ataków wynika ze statusu 'pokoj'. Brak luki do domknięcia.
- Z7 (5 z dispatchu, AI↔AI) — ścieżka runAiAiPeaceTick (kind 'rozejm' → TRUCE_DEFAULT_TURNS) już obsługuje rozejm i pokój stały; WYBÓR TRYBU (E) dotyczy decideAIDiplomacy (AI względem gracza/AI w propozycjach), NIE został przeniesiony do runAiAiPeaceTick. Luka do decyzji.
- Zmiany poboczne: pokój stały zawarty w trakcie rozejmu czyści truceUntilTurn (wcześniej zostawał i mógł później cofnąć wojnę).

TESTY:
- node tools/diplo-truce-impl-test.cjs: 33 PASS / 0 FAIL (helpery B/C/E/G, timeout, regresja cyklu życia; wiring w main.ts/ai.ts/meta — sprawdzenie źródła; mutanty M1 zgoda AI zawsze, M2 ignoruje zmęczenie — wykryte).
- node tools/diplo-truce-r1-test.cjs: 30 PASS / 0 FAIL.
- node tools/diplo-truce-r4-ai-test.cjs: 24 PASS / 0 FAIL (po aktualizacji kotwicy mutanta M3: 'rodzaj:   peaceKindAi,'; przed aktualizacją 2 FAIL wynikające wyłącznie z przemianowania linii).
- node tools/diplomacy-peace-lock-test.cjs: 9 PASS / 0 FAIL.
- node tools/diplomacy-war-gates-test.cjs: 22 PASS / 0 FAIL.
- node_modules/.bin/tsc --noEmit (gra): exit 0 (po poprawce: usunięto p.rodzaj, którego nie ma w ProposalPayload).
- git diff --check: czysto.
- NIE_ZMIERZONO: test end-to-end silnika tury (tickTruceExpiries/resolvePendingDiplomacy w pełnym main.ts — bundel ~46k linii, brak testu runtime); Chromium/przeglądarka (nieużyta); diplo-truce-live-test / saveload-live (nie uruchamiane — wymagają przeglądarki); diplomacy-proposal-test i forced-war-* (nie uruchamiane w tej rundzie).
- Wiki/docs (wikiBundle) NIE zaktualizowane: tekst pokoju/rozejmu w dokumentacji gry nie zmieniony — do zrobienia osobno.
- Plakietka stanu rozejmu w UI (dispatch pkt 4) NIE zrobiona; etykiety „Rozejm na N tur” już istnieją (negotiationSummary), tytuł oferty po rozejmie = „Propozycja pokoju” (diploPendingTitle).

BLOKADY:
1. DYSK: start przy 3,1 GB wolnego (próg dispatchu: ≥4 GB, inaczej sparse-checkout). Worktree był już w pełnym checkoutcie (817 MB), nie zrobiono nowego. Po npm install (node_modules, 134 MB, usunięty po testach) wolne ok. 1,4 GB. Orkiestrator: zwolnić dysk przed kolejnym startem.
2. Sprzeczność D (dispatch: wypowiedzenie w rozejmie zakazane) vs N1 (istniejąca decyzja): zastosowano N1 zgodnie z założeniem R3; wymaga potwierdzenia.
3. Z7 — AI↔AI wybór trybu nieobjęty (decyzja: czy wdrożyć w runAiAiPeaceTick w następnej rundzie).

RUNDY: 3/5 (R1 i R2 = BLOCK: dysk i dispatch sprzed rozejmu; R3 = implementacja luk, wszystkie testy zielone poza NIE_ZMIERZONO wyżej).
NASTĘPNY KROK: Evaluator (Sonnet) i Final Control na bdb6caa8b + SHA raportu. Przed integracją: zdecydować Z1/Z3/Z5/Z7 i ewentualny runtime test silnika (tick + skrzynka).
DEPLOY/PUSH: NIE WYKONANO (commity lokalne; brak push, brak deployu, brak zmian WERSJE.md).
