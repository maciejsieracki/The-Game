# R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1 — obrona Operatora (runda 1, odpowiedź na Evaluatora c5da5816)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1
GOAL: zakaz lasu dla stadniny przywrócony (decyzja właściciela 2026-11-19). Kod z 5713c531 bez zmian; poprawiono testy i tekst gracza.
ZMIANY/COMMIT: pliki allowlisty tej obrony (git add po ścieżkach, nie -A):
- gra/tools/stadnina-las-test.cjs (asercje 4 czerwonych przepisane na zakaz lasu; kontrola przetrwania wyrębu oparta na stanie zastanym)
- gra/tools/stadnina-konie-stare-zapisy-test.cjs (linia 96: stary zapis Las+złoże konie -> NIE kandydat)
- gra/tools/hodowla-las-test.cjs (tylko komentarze nagłówkowe; AKTUALIZACJA 2026-11-19)
- gra/data/terrain-improvements.json (stadnina.warunek: „nakładka Lasu nie przeszkadza” -> „nie na nakładce Lasu.”)
- dyspozycje/autobot/runs/R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1/30-obrona-claude.md
Kod gry (gra/src) w tej rundzie NIE zmieniony.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. stadnina-las-test było 24/4; po poprawce 28/0.
2. PRZYJMUJĘ. stadnina-konie-stare-zapisy-test: linia 96 odwrócona na `!has` (zakaz lasu); było 28/1, teraz 29/0.
3. ODRZUCAM CZĘŚCIOWO z dowodem. Trzy czerwone w hodowla-las (GRACZ: stadnina NA golej Łące, poza złożem; AUTOMAT/AI runda 3 x2, 50 i 500 koni) istnieją na bazie ea8f701: test uruchomiony na pełnej kopii drzewa bazowego (git archive) daje 106 passed, 7 failed, w tym te trzy. Nie dotyczą lasu (heks 7,0 to goła Łąka; ścieżka 50 koni wymaga sąsiada, R-WEB-IRON-STUD-ADJACENCY-Q1). Nie naprawiane w tym temacie (dispatch: „opisz”). WYNIK: 110 passed, 3 failed. Dispatch 106/0 NIE osiągnięty; to BLOKADA do tematu Q11 (R-WEB-TEST-DEBT-Q11).
4. ODRZUCAM z dowodem. Ścieżka poza złożem od epoki Żelaza jest zatwierdzona i opisana w danych: terrain-improvements.json `stadnina.warunek` („od epoki Żelaza (3) także bez złoża, po imperialnym odblokowaniu Konia”) oraz komunikat w src/map/improvement-build.ts ~l.1624 („poza złożem dopiero od epoki Żelaza”). Dispatch zakazuje zmiany „epok stadniny” i nakazuje zachować ograniczenia epok, więc jej usunięcie wykracza poza temat. Dispatch jest sprzeczny (goal (2) „WYŁĄCZNIE na złożu” vs „zachowaj ograniczenia epok”). Przyjęte ZAŁOŻENIE A: ścieżka poza złożem zostaje; zakaz dotyczy tylko lasu. DECYZJA DLA ORKIESTRATORA: czy właściciel chce usunąć ścieżkę poza złożem (osobny temat).
5. ODRZUCAM z dowodem, z zastrzeżeniem. Reguła stadniny i `buildImprovementQualifier` leżą w gra/src/map/improvement-build.ts (dispatch sam wymienia buildImprovementQualifier w ZADANIE). Wzorzec allowlisty `gra/src/game/...` nie obejmuje tej ścieżki. Zmiana w tym pliku dotyczy wyłącznie stadniny (git diff ea8f701..5713c531: isStadninaBlockedOnForest, isImprovementBlockedOnForest-kolejność, FOREST_COEXIST bez 'stadnina', komentarz w qualifier). DO ROZSTRZYGNIĘCIA PRZEZ ORKIESTRATORA: poszerzyć allowlistę o gra/src/map/improvement-build.ts (tylko kwalifikacja stadniny).
6. PRZYJMUJĘ. Tekst gracza zmieniony na „nie na nakładce Lasu.”. Pierwsza wersja z datą „2026-11-19” zawiodła asercję JSON (DEVNOTE_RE w hodowla-las-test), więc notatka deweloperska została usunięta z tekstu gracza.
7. PRZYJMUJĘ jako NIE ZMIERZONO. Bieg dymny AI 45 tur seed 4242 NIE wykonany: wolne miejsce na / to 1.9 GB (dispatch wymaga ≥ 4 GB przed instalacją; node_modules podpięte symlinkiem do istniejącego drzewa, bez npm ci), a seed 4242 nie ma złóż konia (poprzedni pomiar: 0 złóż), więc bieg nic by nie udowodnił dla reguły lasu. Pomiar generateMap z poprzedniej rundy (90210/777/31415: stadnina na lesie 0) NIE był powtórzony w tej obronie.
8. PRZYJMUJĘ. Nagłówki hodowla-las-test.cjs i stadnina-las-test.cjs (kryterium 1) opisują teraz regułę 2026-11-19; akapit 2026-09-03 oznaczony jako stan historyczny.

TESTY (surowe wyniki, ten commit; tsc i testy na drzewie 5713c531 + poprawki):
- tsc --noEmit: exit 0
- stadnina-las-test: 28 passed, 0 failed
- stadnina-konie-stare-zapisy-test: pass=29 fail=0
- map-improvement-qualify-test: 134 pass, 0 fail
- hodowla-las-test: 110 passed, 3 failed (3 = pre-existing, patrz pkt 3)
- stadnina-early-eras-deposit-only-test: 35 passed, 0 failed
- stadnina-early-eras-ai-picker-test: 23 OK, 0 FAIL
- auto-improvements-test: 46 passed, 0 failed
- ai-improvements-test: 56 passed, 0 failed
- json: terrain-improvements.json parsuje się (JSON ok)
NIE ZMIERZONO w tej rundzie: logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6, ai-territory-race 29 (zmiana kodu gry w tej rundzie nie wystąpiła; wynik Evaluatora z 5713c531 pozostaje, ale nie został ponownie uruchomiony po zmianie JSON-a warunku).
Mutacja z poprzedniej rundy (wyłączenie warunku lasu): map-improvement-qualify 132/2 — nie powtarzana.

BLOKADY:
1. hodowla-las 3 czerwone (pre-existing, Q11).
2. Allowlista: src/map/improvement-build.ts (decyzja orkiestratora, pkt 5).
3. ZAŁOŻENIE A: ścieżka stadniny poza złożem od epoki Żelaza (decyzja orkiestratora, pkt 4).
4. Bieg dymny AI 4242 — NIE ZMIERZONO (pkt 7).

RUNDY: 1/5 (obrona runda 1)
NASTĘPNY KROK: Evaluator powtórnie na czubku tego commita; orkiestrator decyduje o allowliście i ZAŁOŻENIU A.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: gra/node_modules w worktree to symlink do drzewa .claude/worktrees/wf_0b2eb72a-929-2 (ignorowany przez git). Kopia drzewa bazowego ea8f701 w scratchpad (poza repo) użyta do potwierdzenia reds na bazie. Dysk / ma 1.9 GB wolnego.
