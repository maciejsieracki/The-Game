STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q15-SAVELOAD-HOTSEAT-Q1
GOAL: 6 czerwonych testów sklasyfikowanych z dowodem i naprawionych do obowiązujących reguł; realpath-mutation przywraca plik po ubiciu (TERM i KILL).
ZMIANY-COMMIT: baza bc71c7481 (origin/main, runda 2). Zmienione pliki: gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs, gra/tools/hotseat-etap6d-podetap-e-exec-test.cjs, gra/tools/resource-ledger-realpath-mutation-test.cjs, gra/tools/save-load-deserialize-fields-audit.cjs, ten raport. gra/src i gra/data NIETKNIĘTE (md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = HEAD). SHA commita: patrz pole sha w StructuredOutput.

KLASYFIKACJA (6 pozycji z rundy 2, każda z dowodem albo NIE-ZMIERZONO z powodem)

1. hotseat-etap6d-podetap-b-exec-test: NIE-ZMIERZONO (czerwony, bez zmian w tej rundzie).
   Dowód: solo exit 1; 19 OK, potem TypeError "Cannot read properties of undefined (reading 'budynki')" w loadThroughput (bundle wycięty przez loadRealModule, linia 963), wołanym z empireConverterResourceRatesForOwner <- mergedResourceRatesForOwnerRaw <- mergedResourceRatesForOwner (main.ts L13477/L13491). Brakujący symbol: obiekt `raw` (dane wydajności/stawek konwertera), który loader ma dostarczyć z modułu danych; stub nie został dodany, bo nie znam kształtu danych bez dalszego czytania src. Próba 2 (ta runda) nie przeszła przez ten punkt. Klasyfikacja: HARNESS (brak stanu danych), NIE BŁĄD-GRY (nie dowiedziono błędu gry).

2. hotseat-etap6d-podetap-d-exec-test: STARY-PIN potwierdzony + HARNESS (częściowo naprawione, nadal CZERWONY).
   Dowód (grep po kotwicach na bieżącym main.ts): blok A (kotwica `if (startOi === 0 && _menuCityStateDifficultyVsPlayer === 'hard') {`) zaczyna się w linii 45599 (nie 31620), ma 62 linie i 16 wystąpień ME(); blok B (kotwica `if (diplomaticallyDiscoveredOwnersSet().has(ownerId)) {`) zaczyna się w linii 46625, ma 160 linii i 42 wystąpienia ME(). Stare piny 31620-31675 / 32232-32330 i liczby 13 / 21 są nieaktualne (main.ts urósł; liczby 16 i 42 zgadzają się z dispatchem).
   Zrobione: piny po numerach linii zastąpione lokalizacją po kotwicach (kotwica występuje dokładnie raz + wycięty blok jest dosłownym podciągiem main.ts), asercje ME() na 16 i 42 z komentarzem R-WEB-TEST-DEBT-Q15, dodany mock gameStreamRng (main.ts 'cs-war-cluster', commit 68c9a3cf3) i _gameSeed.
   Stan: blok A przechodzi dalej, ale wewnątrz bloku wpada w ReferenceError: interCivWarBlockedForAi, diploWarStateFor (zapisane w logu jako "Blad wojny klaster PM->gracz", błąd złapany przez try/catch w samym bloku; asercje tego bloku NIE są zielone). Test nadal exit 1. Mutacja ME()->0: NIE-ZMIERZONO (test nie dociera do asercji).
   Symbole do dostarczenia w harnessie (kolejna runda): interCivWarBlockedForAi, diploWarStateFor.

3. hotseat-etap6d-podetap-e-exec-test: HARNESS (częściowo naprawiony, nadal CZERWONY).
   Dowód: ReferenceError turnEventsFrame (main.ts L20131, ramka zdarzeń z R-WEB-PERF-LATE-GAME-LAG-HUD-Q2). Źródło: collectTurnEvents (L20146) jest już tylko opakowaniem ramki; właściwa logika stołu negocjacyjnego (pętla po negotiationTable, filtr isMe) jest w collectTurnEventsUncached (L20152). Naprawa: test wycina OBIE funkcje z main.ts (compileRealFunction) i dodaje mocki turnEventsFrame=undefined, withOwnerScopeMemo (pass-through), applyFarmAssignHints, HUMAN_OWNER_PRIMARY, turn, map, yieldOfMapHex, empireEpochForOwner, nnsEndTurnBlockEvent, prunePendingForcedPeace, pendingForcedPeaceTreaties, ME, END_TURN_BLOCK_EVENT_TITLE, negotiationRoundCounterText.
   Stan: sekcja 1 OK; sekcja 2 (collectTurnEvents, isMe) OK, łącznie z mutacją isMe=>false czerwieniącą się poprawnie. Sekcja 3+4 (resolveNegotiationEntryAt / resolvePendingNegotiationsForOwner) wymaga kolejnych zależności: truceTestForcedAiDecision (dodany, main.ts L13855 hak testowy), zarejestrujCasusBelli (stub spy), peaceRejectReasonSuffix (stub, import main.ts L1653), a następnie peaceProposalIsTooEarly (ReferenceError, nie dodany). Asercje NIE osłabione. Stub-spy nie wpływają na asercje sekcji 2.

4. save-load-roundtrip-state-drift-test: ZMIERZONO, klasyfikacja: seed 4242 OK; seed 777 HARNESS-CRASH (Chromium), nie BŁĄD-GRY wykazany.
   Komenda: setsid nohup timeout 1500 node tools/save-load-roundtrip-state-drift-test.cjs --dist <scratchpad>/dist-r3 --work <scratchpad>/rt-work (bundle zbudowany poza repo, vite exit 0, 23,6 s). Wynik (exit 1, log w scratchpad/roundtrip.log):
   - A) warstwa statyczna: 10/10 OK (zapis/odczyt nnsAiOverrides, orderMultByCity, orderGrowthMultByCity, orderValueByCity; stary zapis bez pól; warunkowe dopisywanie pól).
   - B) seed 4242: OK — runner zwrócił podsumowanie (exit 0), 10/10 tur po wczytaniu zgodnych ze stanem ciągłym (10/10 skrótów równych), lista pól pomijanych = znana.
   - B) seed 777: FAIL — runner ai-economy-measure-run.cjs (openGame, linia 302, resumeCheck linia 620) padł na crashu Chromium (SIGSEGV, stack trace w logu). To jest klasa "crash Chrome przy load zapisu" z tematu CHROMEHELPER (#57), nie asercja gry. Nie dowiedziono, czy seed 777 jest zgubionym polem zapisu: NIE-ZMIERZONO dla seed 777.
   - Czas: cały bieg mieścił się w limicie 1500 s (kilka minut).
   Brak mutacji dla tego testu (NIE-ZMIERZONO, poza zakresem tej rundy).

5. save-load-deserialize-fields-audit (plik gra/tools/save-load-deserialize-fields-audit.cjs, bez "-test"): ZIELONY z --dist, klasyfikacja HARNESS (wymaga --dist).
   Komenda: (1) z gra/: node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r3 --emptyOutDir (exit 0); (2) z gra/: node tools/save-load-deserialize-fields-audit.cjs --dist <scratchpad>/dist-r3 -> exit 0, WYNIK: ZIELONY. Liczniki: a:OK 194, a:OK_PUSTA 90, b:OK 191, b:ZMIENIONE_PO_RESTORE 3, b:OK_PUSTA 89, b:EFEMERYCZNE 1, a:NIEPRZETESTOWANE_BRAK_W_PROBCE 4. Bez --dist i bez --raw-a/--raw-b skrypt kończy się błędem (throw, linia 276) — zweryfikowane kodem.
   Zmiany: nagłówek dopisany o instrukcji uruchomienia; domyślny katalog dowodów przeniesiony poza repo (os.tmpdir()/R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1-evidence), więc nic nie trafia do dyspozycje/ ani poza allowlistę. Po biegu usunięty katalog dowodów z /tmp.

6. resource-ledger-realpath-mutation-test: NAPRAWIONE (bezpieczeństwo przywracania) — dowody TERM i KILL.
   Zmiany: (a) przy starcie i po zakończeniu cleanupOrphans(): usuwa osierocone kopie civ-ledger-mut-backup-<pid>-<hex>.ts z os.tmpdir() TYLKO gdy pid zapisany w nazwie nie żyje (process.kill(pid,0)); kopie żywych przebiegów nie są ruszane; przed usunięciem przywraca main.ts, jeśli różni się od kopii. (b) restore() i obsługa SIGINT/SIGTERM/exit jak w rundzie 2.
   Dowód SIGTERM (ta runda): `timeout -s TERM 8 node tools/resource-ledger-realpath-mutation-test.cjs --ids m01` -> exit 124; md5 gra/src/main.ts po biegu = e750abbd7d945a4e406cf3a9388a839e; md5 `git show HEAD:gra/src/main.ts` = e750abbd7d945a4e406cf3a9388a839e (identyczny); brak civ-ledger-mut-backup-* w /tmp.
   Dowód SIGKILL (ta runda, kill -9 na PROCES TESTU, nie pkill): start `--ids m01` (setsid, pid 3901); po pojawieniu się kopii i zmutowanego main.ts (linia "void (ledgerLootBefore" = 1 trafienie, md5 31ce2a0b70a586bb911937d9c1061c9f) wykonano kill -9 3901 -> kopia /tmp/civ-ledger-mut-backup-3901-537855cc.ts osierocona, main.ts ZMUTOWANY (dowód stanu po zabiciu). Osierocony proces dziecka (vite build, pid 3908) ubito jawnym kill 3908. Następnie start `--ids none`: wypisało "[recover] przywrócono main.ts z osieroconej kopii civ-ledger-mut-backup-3901-537855cc.ts (pid 3901 martwy)", exit 0; md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = HEAD; kopia usunięta (0 plików civ-ledger-mut-backup-* w /tmp).
   Mutacja m01 pełnym biegiem (zabicie czerwone): NIE-ZMIERZONO w tej rundzie (bieg Chromium nie wykonany; poprzedni dowód z rundy 1 zabicia m01 nie jest tu powtarzany).

BRAMKI (surowe wyniki tej rundy, gra/ po npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic-test: exit 0, "LOGIC OK (213/213)"
- tech-tree-test: exit 0, "20 pass, 0 fail"
- research-test: exit 0, "PASSED: 33 / FAILED: 0 / TOTAL: 33"
- combat-test: exit 0, "All sanity checks passed."
- ai-test: exit 0, "ai-test: 297 passed, 0 failed"
- unit-replace (6 plików: unit-replace-test, -archer-slinger, -army-multi-select, -full-cost, -multitype-walk, -promotion-table): exit 0 każdy.

BLOKADY (jawna lista):
(a) hotseat-B: brak danych stanu `raw` dla loadThroughput (NIE-ZMIERZONO po 2 próbach; sprawdzone: wrapper enqueueNegotiationFromAiCmd, mergedResourceRatesForOwner, empireConverterResourceRatesForOwner). Brakujący element: dane wydajności konwertera w module danych.
(b) hotseat-D: brakujące symbole w bloku A: interCivWarBlockedForAi, diploWarStateFor; blok B nie został jeszcze uruchomiony po naprawie bloku A.
(c) hotseat-E: sekcja 3+4 wymaga peaceProposalIsTooEarly (oraz ewentualnie kolejnych).
(d) roundtrip seed 777: crash Chromium przy openGame (SIGSEGV) — klasa znana z CHROMEHELPER.
(e) SIGKILL: zweryfikowany przez kill -9 procesu testu (dowód powyżej), ale NIE przez ubicie dziecka w trakcie mutacji m01 pełnym biegiem.

BŁĘDY GRY (kandydaci R-WEB-*): nie stwierdzono. Wszystkie czerwienie hotseat to harness (brakujące mocki/stan); roundtrip seed 777 to crash Chromium bez dowodu błędu gry.

UWAGI-DLA-ORKIESTRATORA:
(1) Allowlista dispatchu podaje save-load-deserialize-fields-audit-test.cjs; plik nazywa się save-load-deserialize-fields-audit.cjs (zmieniony, nie dodano nowego pliku).
(2) Piny hotseat-D i E ulegają starzeniu przy każdej rundzie main.ts: rekomendacja — wspólny loader main.ts (jak wskazał Evaluator r1) zamiast ręcznych mocków.
(3) Mutacja ME()->0 w hotseat-D (dowód b) i pełne mutacje m01 nie zostały wykonane w tej rundzie.
(4) Procesy: po zakończeniu zabito osierocony vite (pid 3908) i proces testu (pid 3901). Scratchpad zawiera bundle dist-r3 (usunąć po akceptacji) i logi roundtrip.log / deser.log.

RUNDY: 2/5 — ta runda to dopisek do rundy 2 (dispatch DODATEK). Ostatni werdykt Evaluatora/FC z rundy 1: FAIL. Wynik tej rundy: FAIL (hotseat B/D/E nadal czerwone; roundtrip seed 777 nie przeszedł; deserialize i realpath naprawione z dowodem).
NASTĘPNY KROK: runda 3/5 — (1) hotseat-B: dostarczyć dane raw dla loadThroughput z modułu danych; (2) hotseat-D: dodać interCivWarBlockedForAi, diploWarStateFor; (3) hotseat-E: dodać peaceProposalIsTooEarly i sprawdzić sekcje 3+4; (4) roundtrip: seed 777 w osobnym biegu, po restarcie Chromium; (5) pełny bieg `--ids m01` z ubiciem dziecka w trakcie mutacji.
DEPLOY/PUSH: NIE WYKONANO
