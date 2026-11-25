STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q15-SAVELOAD-HOTSEAT-Q1
GOAL: 6 czerwonych testów zapisu/hotseat sklasyfikowanych z dowodem i naprawionych do obowiązujących reguł; realpath-mutation przywraca plik po ubiciu. Stan po r3: 3 z 6 zielone (B, E, deserialize-audit w trybie --dist), roundtrip zielony w jednym biegu, realpath naprawiony z dowodem; D nadal czerwony.
ZMIANY/COMMIT: czubek obrony = 478433e96 (kandydat wyjściowy e5563f065). Commity tej rundy (r3): 3932aecb5 (B: loader econParams/civs), fe1cb65c7 (D: rozwiązywanie identyfikatorów bloków), 9fdc745bf (E: mock peace), 9f30a6b6b (realpath: bezpieczny odzysk), 478433e96 (B/E: ścisła semantyka asercji mutacyjnych). Zmienione tylko: gra/tools/hotseat-etap6d-podetap-{b,d,e}-exec-test.cjs, gra/tools/resource-ledger-realpath-mutation-test.cjs, ten raport. gra/src i gra/data nietknięte (md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = HEAD). Uwaga: gra/node_modules zainstalowane przez `npm ci --ignore-scripts` w worktree (ignorowane przez git).

ODPOWIEDZI NA ZARZUTY EVALUATORA
1. hotseat-B (PRZYJMUJĘ, NAPRAWIONE): przyczyna 'budynki' = brak danych `data.econParams` (main.ts L4001-4006 -> loadThroughput z converters.ts L37). Dodano realny JSON gra/data/econ-params.json (+ _menuDifficulty). Kolejne brakujące stany dopięte realnymi danymi/mockami: data.civs (gra/data/civs.json), fortNodes, _menuCivIdByOwner, playerCivTypeByHuman, typCityCopyOwners, effectiveGameDifficultyForOwner. Asercja L16085 przepięta na spy `planAiOfferOnTable` (main.ts L21743 woła ją z ME() jako 3. argumentem; `hasPendingNegotiationForPair` jest wołane wewnątrz diplomacy-proposals.ts, poza zasięgiem mocka). WYNIK: 48 PASS / 0 FAIL, exit 0.
   Dodatkowo naprawiony BŁĄD HARNESSU, którego Evaluator nie zgłosił: w B `ok()` w trybie mutacji przepuszczał KAŻDY wynik (tautologia). Teraz mutacja liczy się jako dowód tylko, gdy realnie zmienia wynik. Ujawniły się 3 asercje o złej polaryzacji (hasNap, sojusze, isMe) -- przepisane na wartość realną (`=== true`, `=== 1`, `=== 2`); po przepisaniu wszystkie mutacje czerwienią się realnie.
2. hotseat-D (PRZYJMUJĘ, CZĘŚCIOWO NAPRAWIONE, NADAL CZERWONY): piny po kotwicach i ME() 16/42 były już w r2 (67c8addde) i pozostają. Zmiana r3: wolne identyfikatory bloków A/B rozwiązywane mockiem stanu/bramek, eksportami realnych modułów src (bundle esbuild) i pustymi kontenerami `let|const X = new Map|Set` z main.ts; wyjątek w bloku liczy się jako FAIL z komunikatem (nie cichy ReferenceError). Symbole z zarzutu (interCivWarBlockedForAi, diploWarStateFor, clusterWarMembers) zamockowane/dostarczone. Blok A: wszystkie asercje ME() przechodzą, mutacja ME()->0 bloku A zadziałała (8 linii MUTACJA w logu). Blok B: NIE-ZMIERZONO -- przerwany na UNMOCKED `diploMilitarySideOf` (funkcja nested main.ts), dalej nieznane. Wynik: 40 PASS / 6 FAIL, exit 1 (FAIL widoczne, z przyczynami). Nie wykonano mutacji ME()->0 bloku B.
   Uwaga procesowa: próba kompilowania nested funkcji main.ts realnie (zamiast mocków) wpadała w nieskończoną rekurencję w bloku B; zrezygnowano z tej ścieżki (kod usunięty), zostały mocki.
3. hotseat-E (PRZYJMUJĘ, NAPRAWIONE): ReferenceError peaceProposalIsTooEarly (sekcje 3+4 i sekcja 5 handleNegotiationCounter) -- mock "wolno" (bramka czasu pokoju, poza zakresem ME()). WYNIK: 24 PASS / 0 FAIL, exit 0. Mutacje E (7 linii) realnie zmieniają wynik.
4. save-load-roundtrip-state-drift (PRZYJMUJĘ, ZMIERZONE): pojedynczy bieg foreground w limicie 585 s (bundle poza repo: vite build exit 0, dist w /tmp/claude-0/dist-r3, usunięty po biegu). WYNIK: exit 0, "SAVE-LOAD ROUNDTRIP OK"; A) warstwa statyczna 10/10 OK; B) seed 4242: 10/10 tur zgodnych; seed 777: 10/10 tur zgodnych (w r2 ten seed padł na SIGSEGV Chromium -- w tym biegu NIE odtworzono; to jeden bieg, nie dowód stabilności). Klasyfikacja: test dynamiczny (Chromium), zielony, bez dowodu błędu gry. Mutacja: NIE-ZMIERZONO (test nie ma sekcji mutacyjnej w tej wersji; poza zakresem rundy).
5. save-load-deserialize-fields-audit (PRZYJMUJĘ, ZMIERZONE): plik w repo to gra/tools/save-load-deserialize-fields-audit.cjs (bez "-test"; allowlista dispatchu jest tu nieprecyzyjna). Bundle poza repo: vite build exit 0. Uruchomienie `node tools/save-load-deserialize-fields-audit.cjs --dist /tmp/claude-0/dist-r3` -> exit 0, WYNIK: ZIELONY, liczniki: a:OK 194, a:OK_PUSTA 90, b:OK 191, b:ZMIENIONE_PO_RESTORE 3, b:OK_PUSTA 89, b:EFEMERYCZNE 1, a:NIEPRZETESTOWANE_BRAK_W_PROBCE 4. Dowody zapisane poza repo (os.tmpdir(), potem usunięte). Klasyfikacja: HARNESS (wymaga --dist; instrukcja w nagłówku z r2). Pozycje "ZMIENIONE_PO_RESTORE 3" i "NIEPRZETESTOWANE 4" wymagają oceny Evaluatora.
6. resource-ledger-realpath-mutation (PRZYJMUJĘ, NAPRAWIONE BEZPIECZEŃSTWO): ryzyko z zarzutu było realne: cleanupOrphans nadpisywał main.ts kopią dowolnego martwego pid, gdy main.ts różnił się. Poprawka (9f30a6b6b): przed każdą mutacją zapisywana jest kopia ZMUTOWANEGO tekstu (civ-ledger-mut-applied-<run>.ts); odzysk przywraca oryginał TYLKO gdy main.ts == ta kopia; w innym przypadku nie nadpisuje, zostawia kopie i wypisuje UWAGA.
   Dowody (wszystkie z gra/ w worktree, md5 po każdym kroku):
   - SIGTERM w trakcie mutacji: `timeout -s TERM 8 node gra/tools/resource-ledger-realpath-mutation-test.cjs --ids m01` -> exit 124; md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = HEAD; 0 plików civ-ledger-mut-* w /tmp.
   - SIGKILL procesu testu w trakcie mutacji m01 (`timeout -s KILL 8`): exit 137; main.ts ZMUTOWANY (md5 31ce2a0b70a586bb911937d9c1061c9f), zostały kopie backup i applied. Następnie `--ids none`: "[recover] przywrócono main.ts z osieroconej kopii civ-ledger-mut-backup-7545-293aeda7.ts (pid 7545 martwy)", exit 0, md5 = HEAD, 0 plików w /tmp.
   - SIGKILL + OBCA EDYCJA (dopisana linia do main.ts po przerwaniu): `--ids none` -> "[recover] UWAGA: main.ts różni się od zapisu zmutowanego przebiegu ... NIE nadpisuję" (po ponownym biegu; pierwszy bieg nie pokazał komunikatu -- przyczyny nie ustalono), md5 main.ts po odzysku = 66b9c8a8a13ddfacd50de52dac3ef7f4 (edycja zachowana, NIE nadpisana). Potem przywrócono main.ts przez `git checkout` i usunięto kopie testowe.
   - Mutacja m01 pełnym biegiem z ubiciem DZIECKA (vite) w trakcie: NIE-ZMIERZONO (w SIGKILL-teście ubito proces testu, a osierocone dziecko vite nie zostało ubite jawnie; pełny bieg m01 do wyniku ZABITA nie był wykonany).
   - Usuwanie osieroconych kopii przy starcie i po zakończeniu: zaimplementowane; odzysk pokazany dowodnie powyżej.

BRAMKI (surowe wyniki tej rundy, po zmianach):
- tsc --noEmit: exit 0
- logic-test: exit 0, "LOGIC OK (213/213)"
- tech-tree-test: exit 0, "tech-tree-test: 20 pass, 0 fail"
- research-test: exit 0, "ALL GREEN", "PASSED: 33 / FAILED: 0 / TOTAL: 33"
- combat-test: exit 0, "All sanity checks passed."
- ai-test: exit 0, "ai-test: 297 passed, 0 failed"
- unit-replace (6 plików): NIE-ZMIERZONO w tej rundzie (zmiany dotyczą tylko gra/tools/*-test.cjs, nie gra/src; do uruchomienia przez Evaluatora).

TESTY (solo, surowe):
- hotseat-etap6d-podetap-b-exec-test: exit 0, "48 PASS, 0 FAIL"
- hotseat-etap6d-podetap-d-exec-test: exit 1, "40 PASS, 6 FAIL" (blok B: UNMOCKED diploMilitarySideOf)
- hotseat-etap6d-podetap-e-exec-test: exit 0, "24 PASS, 0 FAIL"
- save-load-roundtrip-state-drift-test (--dist, --work w /tmp/claude-0): exit 0, "SAVE-LOAD ROUNDTRIP OK"
- save-load-deserialize-fields-audit.cjs (--dist): exit 0, "WYNIK: ZIELONY"
- resource-ledger-realpath-mutation-test: patrz dowody powyżej (TERM exit 124; KILL + odzysk exit 0; KILL + obca edycja: UWAGA).

BLOKADY:
(a) hotseat-D blok B: UNMOCKED `diploMilitarySideOf` (nested main.ts); kolejne symbole nieznane (blok B przerwany). Mutacja ME()->0 bloku B nie wykonana.
(b) realpath: pełny bieg m01 z ubiciem dziecka vite -- nie wykonany; SIGKILL dotyczył procesu testu, nie dziecka.
(c) roundtrip: mutacja NIE-ZMIERZONO (brak sekcji mutacyjnej w teście).
(d) unit-replace: NIE-ZMIERZONO w tej rundzie.
(e) Nie wykryto błędu gry: BŁĘDY GRY (kandydaci R-WEB-*): nie stwierdzono; czerwień D to harness (brakujące mocki bloku B).

UWAGI-DLA-ORKIESTRATORA:
(1) Allowlista dispatchu podaje save-load-deserialize-fields-audit-test.cjs; plik w repo nazywa się save-load-deserialize-fields-audit.cjs.
(2) Test B: wcześniejsze asercje mutacyjne były tautologiczne (przepuszczały wszystko). Naprawiono w 478433e96; proszę o ocenę Evaluatora, czy zakres poprawki jest wystarczający.
(3) Test D: rekomendacja z Evaluatora r1 (wspólny loader stanu main.ts zamiast ręcznych mocków) jest nadal aktualna -- każda runda main.ts dokłada kolejne nested funkcje.
(4) Procesy: zostały osierocone dzieci vite z testów SIGKILL (nie ubite jawnie). Tymczasowe kopie w /tmp usunięto. gra/node_modules zainstalowany w worktree (ignorowany przez git).

RUNDY: 3/5 (runda obrony r3, po uwagach Evaluatora z r2).
NASTĘPNY KROK: runda 4/5 -- (1) D blok B: dostarczyć diploMilitarySideOf i kolejne symbole (lub jawne NIE-ZMIERZONO z listą), potem mutacja ME()->0 bloku B; (2) realpath: pełny bieg m01 z ubiciem dziecka vite w trakcie mutacji; (3) roundtrip: dodać sekcję mutacyjną albo jawnie zostawić NIE-ZMIERZONO; (4) unit-replace (6 plików) w bramkach.
DEPLOY/PUSH: NIE WYKONANO
