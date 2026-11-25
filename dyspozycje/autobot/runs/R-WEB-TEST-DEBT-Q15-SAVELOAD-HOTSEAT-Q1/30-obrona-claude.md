STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q15-SAVELOAD-HOTSEAT-Q1
GOAL: 6 czerwonych testów sklasyfikowanych z dowodem i naprawionych do obowiązujących reguł; realpath-mutation przywraca plik po ubiciu.
ZMIANY/COMMIT: baza 1dc6b817c (kandydat runda 1), czubek obrony = SHA z commita tej rundy (patrz pole sha). Zmienione pliki: gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs, gra/tools/resource-ledger-realpath-mutation-test.cjs, ten raport. gra/src i gra/data nietknięte (md5 gra/src/main.ts = e750abbd7d945a4e406cf3a9388a839e = HEAD).

ODPOWIEDZI NA ZARZUTY EVALUATORA
1. hotseat-B (PRZYJMUJĘ, poprawiono CZĘŚCIOWO, nadal czerwony): dodane mocki hudPureScope/ownerScope (memo bez cache), pusty świat (cities, cityBuilt, map, units, empireBuiltIdsForOwner, placedImprovementsForOwner), alias importu tradableGoodsIndexForOwnerPure -> realny src/game/diplomacy-goods.ts, aiDiploRatesCache: null, oraz loader eksportów `export const` z src (np. DEFAULT_CONVERTER_RECIPES). Dowód: przed rundą TypeError `.cached` (sekcja 4); po poprawkach test przechodzi dalej (19 OK) i pada na `mergedResourceRatesForOwner`: "Cannot read properties of undefined (reading 'budynki')" w sensibleUmowaBasketCheck. Następny brakujący stan modułu to dane rates/sensible basket. Asercje NIE osłabione. Mutacja: NIE-ZMIERZONO (test nie dociera do asercji końcowych).
2. hotseat-D (PRZYJMUJĘ, NIE naprawiono w tej rundzie): piny linii 31620-31675 / 32232-32330 i asercja 13 vs 16 wystąpień ME() bez zmian. NIE-ZMIERZONO w tej rundzie (brak czasu na przeliczenie pinów i weryfikację 3 nowych wystąpień ME()).
3. hotseat-E (PRZYJMUJĘ, NIE naprawiono w tej rundzie): ReferenceError turnEventsFrame nie został zmockowany. NIE-ZMIERZONO w tej rundzie.
4. save-load-roundtrip-state-drift (PRZYJMUJĘ): NIE-ZMIERZONO. Część dynamiczna (Chromium) wymaga >570 s; pojedyncze wywołanie Bash ma limit 590 s i nie było tu sposobu na bieg w kilku wywołaniach w tej rundzie. Nie uruchomiono.
5. save-load-deserialize-fields-audit (PRZYJMUJĘ, ZMIERZONE): plik w repo to gra/tools/save-load-deserialize-fields-audit.cjs (nie -test.cjs). Zbudowano bundle poza repo: `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist --emptyOutDir` -> exit 0 (16,3 s). Następnie `node tools/save-load-deserialize-fields-audit.cjs --dist <scratchpad>/dist` -> exit 0, WYNIK: ZIELONY (brak zgubionych pól), liczniki: a:OK 194, a:OK_PUSTA 90, b:OK 191, b:ZMIENIONE_PO_RESTORE 3, b:OK_PUSTA 89, b:EFEMERYCZNE 1, a:NIEPRZETESTOWANE_BRAK_W_PROBCE 4. Wygenerowane przez test pliki dowodowe (raw-A/raw-B/audit-*.json) usunięte z worktree, bo są poza allowlistą. Klasyfikacja: test ZIELONY na bieżącym bundle; "b:ZMIENIONE_PO_RESTORE 3" i "a:NIEPRZETESTOWANE 4" wymagają oceny Evaluatora.
6. resource-ledger-realpath-mutation (PRZYJMUJĘ, częściowo naprawiono):
   - Dodano odzyskiwanie przy starcie: osierocone kopie civ-ledger-mut-backup-*.ts w tmpdir przywracają gra/src/main.ts PRZED odczytem `original`, po czym kopia jest kasowana. restore() kasuje kopię dopiero po potwierdzeniu, że main.ts == original.
   - Dowód SIGTERM w trakcie mutacji: `timeout -s TERM 8 node tools/resource-ledger-realpath-mutation-test.cjs --ids m01` -> exit 124, md5 gra/src/main.ts po biegu = e750abbd7d945a4e406cf3a9388a839e = HEAD; po biegu w /tmp 0 plików civ-ledger-mut-backup.
   - Dowód SIGKILL: NIE-ZMIERZONO. Próba `timeout -s KILL` + ponowny start (odzysk) została odrzucona przez klasyfikator uprawnień (auto mode) i nie została wykonana. Ścieżka odzysku po SIGKILL jest więc KODEM NIEPRZETESTOWANYM.
7. Status FAIL (PRZYJMUJĘ): wyniki poniżej, bez zawyżania.

TESTY (surowe wyniki tej rundy)
- tsc --noEmit: exit 0
- hotseat-etap6d-podetap-b-exec-test: exit 1 (czerwony), 19 OK przed błędem `mergedResourceRatesForOwner ... 'budynki'`
- resource-ledger-realpath-mutation-test --ids m01 pod SIGTERM po 8 s: exit 124, main.ts == HEAD, brak kopii w /tmp
- save-load-deserialize-fields-audit.cjs --dist <bundle w scratchpad>: exit 0, ZIELONY
- save-load-roundtrip-state-drift: NIE-ZMIERZONO (patrz pkt 4)
- hotseat-D, hotseat-E: NIE-ZMIERZONO w tej rundzie (czerwone, brak poprawek)
- logic-test, tech-tree, research, unit-replace, combat, ai-test: NIE URUCHOMIONE w tej rundzie (zmiany dotyczą wyłącznie gra/tools/*-test.cjs; nie dotykają gra/src; NIE-ZMIERZONO, do uruchomienia przez Evaluatora)

BLOKADY: (a) hotseat-B wymaga pełnego loadera stanu świata (kolejne zależności: rates/sensible basket); (b) SIGKILL nie zweryfikowany (odrzucenie uprawnień); (c) roundtrip wymaga dłuższego biegu Chromium niż pojedyncze wywołanie Bash.
BŁĘDY GRY (kandydaci R-WEB-*): nie stwierdzono; czerwienie hotseat dotyczą harnessu (mocki/stan modułu), nie dowiedziono błędu gry.
UWAGI-DLA-ORKIESTRATORA: (1) allowlista dispatchu podaje save-load-deserialize-fields-audit-test.cjs, plik nazywa się save-load-deserialize-fields-audit.cjs; (2) test deserialize zapisuje dowody do dyspozycje/.../evidence/ (poza allowlistą); (3) rekomendacja: zamiast ręcznych mocków hotseat-B - wspólny loader stanu main.ts (jak wskazał Evaluator).
RUNDY: 2/5 — ostatni werdykt Evaluatora: FAIL (runda 1). Ta runda: FAIL (hotseat-B nadal czerwony; SIGKILL niezweryfikowany; roundtrip/D/E nie zrobione).
NASTĘPNY KROK: runda 3: domknąć loader hotseat-B (stan świata poza mockami), przeliczyć piny hotseat-D, dodać mock turnEventsFrame w hotseat-E, zmierzyć roundtrip w kilku wywołaniach (jeden Chromium), zweryfikować SIGKILL z uprawnieniami właściciela.
DEPLOY/PUSH: NIE WYKONANO
