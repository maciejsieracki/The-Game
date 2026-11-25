STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar + hak testowy civTest)
TEMAT: R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1
GOAL: FORTRING: przełącznik pierścienia pod civTest, runner ON/OFF (60 tur, wydajność, fort, round-trip); FLEEMANUAL: runner odwrotu (limit ruchu, off-map, pozycja startowa i końcowa, bitwy >5 tur). Dokument z werdyktami.
ZMIANY/COMMIT: czubek pracy = 4c8b5e079 (runner i hak FLEEMANUAL); przed nim 1e26dde0a (gating civTest w territory.ts/main.ts, test źródłowy 8/0). Dane i dokument w commicie raportu (SHA w polu `sha` odpowiedzi). Pliki: gra/src/map/territory.ts (gating fortRingBuildBlockReason przez setCivTestFortRingOff; domyślnie OFF = reguła ON), gra/src/main.ts (hak setFortRingOff woła setCivTestFortRingOff z bramką ?civTest=1), gra/tools/fortring-civtest-hook-test.cjs (8/0), gra/tools/fortring-measure.cjs (nowy), gra/tools/flee-manual-measure.cjs, gra/tools/battle-flee-manual-browser-entry.ts (pole `from` w logu, limit logu 2000), dyspozycje/analizy/POMIAR-FORTRING-FLEEMANUAL-2026-11-25.md, dane/ (fortring ON/OFF jsonl.gz + summary, flee case0-2 + rundy10, SHA256SUMS). Poza allowlistą: improvement-build.ts NIE zmieniano (bramka qualifies() korzysta z fortRingBuildBlockReason, więc gating w territory.ts wystarcza); brak zmian w gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.

TESTY (liczby z surowego wyjścia):
- tsc --noEmit: exit 0
- fortring-civtest-hook-test: 8 PASS / 0 FAIL
- territory-improvement-owner-test: 34 passed, 0 failed
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: 33/33; combat-test: 6/6
- unit-replace-test 21/21; archer-slinger 51 OK, 0 FAIL; full-cost 40/0; multitype-walk 25 OK, 0 FAIL; promotion-table PASS 32 wpisów, 63 krawędzi
- ai-test: 297 passed, 0 failed; war-rules-multiwar-main-guard: 21 PASS / 0 FAIL; hotseat-etap6d-podetap-e-source: 77 PASS, 0 FAIL
- bramki-tmpdir-unikalnosc: PASS=2 FAIL=1 — 2 trafienia w plikach spoza tematu (resource-ledger-realpath-mutation-test.cjs:64, save-load-deserialize-fields-audit.cjs:52), obecne w bazie; moje trafienia (ścieżki domyślne runnera) usunięte.
- FORTRING ON: 59 tur (tury 2..60), mediana 12108,6 ms, p95 26846,7 ms, max 28112,6 ms, forty 0 (max 0), round-trip: NIE tożsame (pole cityProd: kolejka produkcji miasta z cudem gubiona/przesunięta w city105/106).
- FORTRING OFF: 59 tur, mediana 9674,8 ms, p95 24113,9 ms, max 26637,2 ms, forty 0, round-trip: tożsame.
- FLEEMANUAL (zob. dokument): case0 Wojownik 10 PASS / 0 FAIL (poz. startowa 31,74 → 22,74; max 2/tura, limit 2; 9 kroków); case1 Rydwan konny 10 PASS / 0 FAIL (31,76 → 18,76; max 3, limit 3; 13 kroków); case2 Strażnik bram Harappy 10 PASS / 0 FAIL (31,76 → 26,76; max 1, limit 1; 5 kroków). Off-map 0, kroki bez punktów 0.
- FLEEMANUAL 10 tur (rundy10): timeout 500 s, brak wyniku (plik dane/flee-manual-measure-case0-rundy10.json z pustym wierszem).

BLOKADY:
1. FORTRING wpływ pierścienia: NIE ZMIERZONO. Seed 4242 nie wytworzył żadnego fortu/posterunku w 60 turach (fortCount 0 w obu biegach), więc pierścień nie działał. Różnica median ON/OFF (12,1 s vs 9,7 s) nie jest przypisywalna pierścieniowi (różne trajektorie i 6 vs 7 wznowień ze slotu; brak biegu ciągłego).
2. FORTRING skrót stanu ON vs OFF (t30, t60): nieinterpretowalny z tego samego powodu (wznowienia).
3. FORTRING round-trip: w biegu ON NIE tożsame (cityProd). Przyczyna źródłowa NIE ZMIERZONO; pierścień nie ma tu udziału przy 0 fortach (kod).
4. FLEEMANUAL bitwy > 5 tur: NIE ZMIERZONO — runner kończy po 5 turach (MAX_ROUNDS=4 od złamania); próba 10 tur nie zakończyła się w 500 s (headless).
5. FLEEMANUAL animacja odwrotu: NIE ZMIERZONO (brak hooka zakończenia animacji).
6. Bramka tmpdir FAIL=1 (pre-existing, 2 pliki spoza tematu).

RUNDY: 2/5 (runda 1: BLOCK, brak przełącznika; runda 2: przełącznik + runner + pomiar, PASS-WITH-NOTES).
NASTĘPNY KROK: decyzja orkiestratora o zakresie (a) osobny temat R-WEB-* na round-trip kolejki produkcji miast (cud w city105, dane/fortring-on-seed4242.summary.json pole roundTrip.diff); (b) scenariusz z fortami (ziarno z fortami lub hak postawienia fortu pod civTest), aby zmierzyć wydajność pierścienia ON/OFF; (c) FLEEMANUAL >5 tur — limit czasu/bitwy. Gate ciągłego biegu (60 tur bez wznowień) wymaga dłuższego okna niż 590 s na polecenie.
UWAGI-DLA-ORKIESTRATORA:
- Poprzednie dane FLEEMANUAL (runda 1) zastąpione nowymi z polem pozycji startowej (te same 3 przypadki, te same limity i wyniki kroków).
- Runner fortring-measure.cjs wymaga jawnych --dist i --scratch (poza repo); nie zapisuje do /tmp. Bundle i scratch po pracy do usunięcia (nie w repo).
- node_modules w worktree zainstalowane przez `npm ci` (nie w git).
- Skrypt wznawiania (scratch, poza repo) i logi: w katalogu scratchpad sesji.
- Dane pomiaru są surowe: liczby z summary.json i jsonl.gz; SHA256 w dane/SHA256SUMS.

DEPLOY/PUSH: NIE WYKONANO
