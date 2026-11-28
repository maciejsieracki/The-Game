STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B (tag SAVEBLOCKQ43B), obrona runda 2 (Operator HAIKU 5.5)
GOAL: przed założeniem pierwszego miasta (stolicy) zapis gry niedostępny z komunikatem „Zapis niedostępny przed założeniem pierwszego miasta”; po stolicy bez zmian; wczytywanie nieblokowane (decyzja Q43 = B).
BAZA: 0384b1de4fe533e9bac7ed72e08574104247d4d3 (kandydat, checkout --detach). Zmiana gra/src/main.ts w tej rundzie: BRAK (src identyczne z kandydatem), bramki z rundy 1 dotyczą tego samego kodu gry.
ZMIANY/COMMIT: patrz `sha` w StructuredOutput (czubek tej rundy).
  Odpowiedzi na zarzuty:
  1. (saveRoundTrip w testach live) PRZYJMUJĘ dla dwóch plików, które zakładały stolicę dopiero po zapisie: gra/tools/ai-plus10-live-roundtrip-test.cjs (liveStart: waitForFunction awaitingFirstCity + foundFirstCity przed zwróceniem) i gra/tools/verify-live-growth-toggle-test.cjs (ten sam wzorzec). Dowód: oba testy PASS (patrz TESTY).
     ODRZUCAM dla pozostałych, z dowodem: defeat-cause-live.cjs (foundFirstCity linia 125, saveRoundTrip linia 182), endstall-fortring-live.cjs (105 przed 153), vlive3-fortring-live.cjs (102 przed 150), fortring-measure.cjs (235 przed 266): stolica zakładana PRZED zapisem. resource-ledger-realpath-live-test.cjs (372/376) i save-load-player-owned-city-live.cjs (130) wołają window.__ledgerRealPathDebug.saveRoundTrip, które (main.ts ok. 33750–33756) używa buildSaveGameSnapshot + restoreGameFromSave, NIE persistSaveToSlot; bramka jest tylko w persistSaveToSlot / doQuickSave / openSaveGameDialog / doRotatingAutosave (asercje testu statycznego), więc te testy nie są dotknięte.
  2. (brak trwałego testu live) PRZYJMUJĘ: dodano gra/tools/save-block-pre-capital-live.cjs (Chromium, poziom maksymalny). Wynik PASS (patrz TESTY). Menu pauzy przed stolicą i continuity B==A ≥6 tur: NIE ZMIERZONO (opisane w analizie).
  3. (krucha functionBody) PRZYJMUJĘ: functionBody w gra/tools/save-block-pre-capital-test.cjs liczy zrównoważone klamry od klamry sygnatury (zamiast szukać '\n    }\n'). Mutanty nadal czerwone (9/9).
  4. (hotseat, uwaga informacyjna) ODRZUCAM jako błąd kodu: predykat humanSeats.humanOwnerIds.some(oid => isAwaitingFirstPlayerCity(oid)) to zamierzone zachowanie zgodne z założeniem 1 w analizie (kolejki pendingForeignSpawnCities / pendingSameTypeRival* są drenowane przez fotel, który je wyzwala). Bez zmiany kodu; live hotseat nie mierzony (wpisane w NIE ZMIERZONO).
ZAKRES / UWAGA DLA ORKIESTRATORA (WAŻNE): pliki gra/tools/ai-plus10-live-roundtrip-test.cjs, gra/tools/verify-live-growth-toggle-test.cjs i gra/tools/save-block-pre-capital-live.cjs NIE są w allowliście dispatchu (allowlista: main.ts, save-block-pre-capital-test.cjs, save-load-continuity-*.cjs, analiza, runs). Zmiany w dwóch pierwszych są potrzebne do naprawy zarzutu 1, trzeci jest nowym testem z zarzutu 2. Orkiestrator decyduje: rozszerzyć allowlistę o te trzy ścieżki albo odrzucić ich zmiany przy integracji. Bez tej decyzji traktować jako poza zakresem.
TESTY (surowe wyniki tej rundy):
  - save-block-pre-capital-test.cjs: PASS=26 FAIL=0; 9 mutantów: każdy „test czerwieni (porażki=1)”.
  - save-block-pre-capital-live.cjs (bundle z src kandydata, poziom maksymalny: Trudny, rivals=9, civTypesCount=14, kultura trudny/AI trudny, dyplomacja trudna, Koszty jednostek Wysoki, barbarzyńcy trudny): WYNIK PASS, exit 0. Krok 1: saveRoundTrip przed stolicą saved=false; Ctrl+S nowe klucze localStorage=[], komunikat w #civ-hint-toast=true. Krok 2: saveRoundTrip po stolicy saved=true, ustawienia po wczytaniu = przed zapisem.
  - ai-plus10-live-roundtrip-test.cjs (po poprawce): exit 0, 4/4 scenariuszy (roundTrip saved=true, after = before).
  - verify-live-growth-toggle-test.cjs (po poprawce): exit 0, „WSZYSTKIE ASERCJE ZIELONE”, mutacja growth-flat CZERWONA, „ZYWA GRA ZIELONA (round-trip zapisu)” saved=true.
  - Bramki z rundy 1 (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, save-load-ai-*) nie były ponawiane: src niezmienione w tej rundzie.
  - Poprzednia runda: „Ctrl+S nie reaguje” było błędem harnessu (odczyt DOM poza #civ-hint-toast), nie gry.
BLOKADY: brak technicznych. Continuity B==A (save-load-continuity-live.cjs) NIE uruchomione: NIE ZMIERZONO.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (runda 2) z decyzją orkiestratora o allowliście trzech plików tools/*.
ANALIZA: dyspozycje/analizy/ZAPIS-BLOKADA-PRZED-STOLICA-2026-11-28.md (zaktualizowana o wynik live).
UWAGI-DLA-ORKIESTRATORA:
  - Bundle live generuje gra/tools/test-hook-setcitylimit-live-bundle.cjs <katalog> (ok. 2 s) i wymaga gra/node_modules. W worktree dowiązano node_modules z innego worktree (wf_4b5bea6b-749-2); dowiązanie jest ignorowane przez git. Wynik bundla leży w scratchpadzie sesji, nie w repo.
  - Klucz barbarzyńców w startNewGame przyjęto jako barbariansLevel: 'trudny' (założenie; spójne z innymi testami używającymi 'normalny').
DEPLOY/PUSH: NIE WYKONANO
