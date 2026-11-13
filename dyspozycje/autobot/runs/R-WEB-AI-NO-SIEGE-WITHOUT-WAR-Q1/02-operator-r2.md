STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-NO-SIEGE-WITHOUT-WAR-Q1
GOAL: Żadna cywilizacja ani państwo-miasto (barbarzyńcy poza regułą) nie oblega, nie atakuje ani nie zdobywa miasta podmiotu, z którym nie jest w stanie wojny.
RUNDY: 2/5

## Zmiany (allowlista: main.ts + nowy test + aktualizacja testu strukturalnego)
- gra/src/main.ts `setDiploRelation`: przy przejściu wojna -> nie-wojna woła `validateActiveSieges()` (oblężenie zdejmowane od razu). Dotąd walidacja szła tylko przy ruchu jednostki, bitwie, końcu tury AI i wczytaniu zapisu, więc po pokoju zawartym w turze gracza plakietka i blokady wisiały.
- gra/tools/ai-no-siege-without-war-r2-test.cjs (NOWY, 10 asercji).
- gra/tools/oblezenie-siege-lifted-po-bitwie-test.cjs: strażnik liczy wywołania `validateActiveSieges();` 5 -> 6 (świadoma zmiana).

## Odpowiedzi na zarzuty
1. Brak zmian w gra/**: PRZYJMUJĘ. Jest poprawka + test RED (przed poprawką asercja KONTRAKT R2 padała) -> GREEN.
2. BLOCK(INFRA) zbyt słaby: PRZYJMUJĘ. Pomiar na żywej grze (>=3 ziarna x >=100 tur): NIE_ZMIERZONO w R2; zastąpiony testami deterministycznymi na prawdziwych funkcjach.
3. Przerzucenie luki na orkiestratora: PRZYJMUJĘ. Zakres pomiaru rozstrzygnięty założeniem (testy jednostkowe/strukturalne zamiast pętli 100 tur).
4. Harness nieudowodniony: PRZYJMUJĘ. Nowa kontrola dodatnia: stos 4 jednostek AI(1) 2 heksy od jednostki i miasta gracza 2; w wojnie 2 jednostki idą na heksy sąsiadujące z celem; bez wojny (neutralni/pokoj/rozejm/nap/sojusz/handel) zero ataków, zero marszu pod mur, zero wejścia na heks miasta. Mutacja `aiCanEngageOwner => true` łamie test (zabita). Pokryte: ruch pod miasto i atak (nearTarget).
5. Enumeracja canEngageOwner: PRZYJMUJĘ. `decideAITurn(` ma JEDNO wywołanie produkcyjne (main.ts:39253), opts zawsze niesie `canEngageOwner` (main.ts:38177: barbarzyńca lub status 'wojna'; także państwa-miasta i kopie defensywne). warAllInCapital, army-concentration, forced-war-waves, ai-war-home-defense, ai-city-capture-executor dostają wejścia już przefiltrowane (`engageableEnemyUnits/Cities`, `enemyCitiesAtWar`) albo callback (`planHomeWar.canEngageOwner`, `executeAiCityMove.canEngageOwner`). Domyślne `true` w `aiCanEngageOwner` jest permisywne wyłącznie bez opts (testy); NIE zmieniam (złamałoby ai-test 274/20); dodany strażnik statyczny. Wykonanie rozkazu AI `attack` ma drugą bramkę `areEnemyOwners` (main.ts:39718), ruch do miasta też (:39601).
6. H1 / oblegający inny niż Chiny: częściowo. Test potwierdza mechanizm UI: `warPartnerIdsForOwner` z filtrem kontaktu pomija partnera bez kontaktu, więc karta mówi „Wojny: brak" mimo wojny. Kontakt wynika jednak z widoczności miast/jednostek (`computeDiplomaticContacts`), więc przy widocznym Memfis powinien istnieć. `oblegajacyOwnerId` Memfis: NIE_ZMIERZONO (brak zapisu).
7. Testy isCityUnderSiege / siege z wojną i bez: PRZYJMUJĘ. isCityUnderSiege = tylko flaga (test); `isSiegeStillValid`/`detectWarAutoSiegeOnCity` z wojną i bez (test); okno po pokoju naprawione. Migracja zapisu (H2): `validateActiveSieges()` przy wczytaniu już istnieje (main.ts ~44269), pokryte strażnikiem w oblezenie-siege-lifted-po-bitwie-test.

## Ścieżki ustawiające `oblegane`
startMapSiege (bramka wojny), endMapSiege/post-battle (false), haki testowe `?civTest=1` (setCityBesieged, __siegeBadgeTestDebug). Brak innych.

## TESTY (gra/, node)
- ai-no-siege-without-war-r2-test: PASS 10; RED przed poprawką, mutacja zabita.
- ai-siege-requires-war-test: 49 ok, 0 fail. tsc --noEmit: bez błędów.
- Regresje (83 pliki siege-/diplomacy-/ai-war-/war-allin-/ai-march-/ai-test/barb-): zbiór padających PRZED = PO (10): ai-test (274/20 bez zmian), barb-camp-destruction, ai-march-avoid-foreign-territory, 5x diplomacy-* (audience-close-flush, negotiation-table, lista-podglad, package-ai-counter, proposal), siege-blockade-no-recruit-reinforce i siege-tower-breach-everywhere (timeout 100 s w obu stanach). Jedyna różnica: oblezenie-siege-lifted-po-bitwie (strażnik 5->6), zaktualizowany, 16/16.
- Żywy pomiar Chromium, hashe war-allin-capital-quick, czas decyzji AI: NIE_ZMIERZONO (ai.ts nietknięty).

## BLOKADY
Brak blokady technicznej. Decyzja produktowa (opcjonalna): karta „Wojny:" mogłaby pokazywać wojny z niekontaktowanymi jako „nieznana cywilizacja" (dziś pomijane). Do ustalenia defektu właściciela potrzebny zapis lub zrzut stanu (oblegajacyOwnerId, kontakty).
NASTĘPNY KROK: Evaluator R2.
DEPLOY/PUSH: NIE WYKONANO
