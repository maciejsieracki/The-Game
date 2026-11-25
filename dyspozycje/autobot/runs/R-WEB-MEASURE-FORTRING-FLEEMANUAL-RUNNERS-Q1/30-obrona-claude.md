# R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar + hak testowy civTest)
TEMAT: R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1
GOAL: FLEEMANUAL zmierzony (limit ruchu, off-map, stan po odwrocie, 3 przypadki z danymi i SHA); FORTRING: przełącznik pierścienia pod civTest + test źródłowy, pomiar ON/OFF NIE ZMIERZONO z powodem technicznym i decyzją do orkiestratora.
BAZA: 8a8aef35bc06a21e2acf9c00b62d1dcf0ea579ea (kandydat) na origin/main 547ca34b56f45a7d81da262c4720289b90d01cd2.
ZMIANY/COMMIT: SHA w polu `sha` (commit obrony). Pliki: gra/src/main.ts (TYLKO hak civTest: przełącznik pierścienia + 2 miejsca odczytu), gra/tools/fortring-civtest-hook-test.cjs (nowy), gra/tools/flee-manual-measure.cjs (nowy), dyspozycje/analizy/POMIAR-FORTRING-FLEEMANUAL-2026-11-25.md (nowy), dyspozycje/autobot/runs/R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1/dane/ (JSON x3, logi x3, SHA256SUMS), 30-obrona-claude.md. Brak zmian poza allowlistą; brak zmian w gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.

## Odpowiedź na zarzuty Evaluatora

1. (Brak produktu tematu) — PRZYJMUJĘ, częściowo naprawione. Dodano: `flee-manual-measure.cjs` (runner, wyniki w `dane/`), `fortring-civtest-hook-test.cjs` (test źródłowy hooka), `analizy/POMIAR-FORTRING-FLEEMANUAL-2026-11-25.md` (tabela funkcja | zmierzono | wynik | werdykt). NIE napisano `fortring-measure.cjs` (runner ON/OFF 60 tur): bez pełnego przełącznika pomiar byłby niereprezentatywny (patrz zarzut 2). Odnotowane jako NIE ZMIERZONO z powodem.
2. (BLOCK FORTRING nie w pełni technicznie zablokowany) — PRZYJMUJĘ. Wdrożono częściowy hak w main.ts: `_civTestFortRingOff` (domyślnie false, odczyt tylko przy `?civTest=1`), ustawiany `__settingsLive.setFortRingOff(bool)`, odczyt `fortRingOff()`, `fortCount()`. Hak obejmuje 2 z 3 punktów reguły (węzły terytorium fortu, blokada budowy w pierścieniu). Punkt `gra/src/map/improvement-build.ts:1091` (bramka `qualifies()`) jest poza allowlistą, więc NIE został przełączony. Nie rozszerzałem allowlisty samodzielnie: decyzja w UWAGACH.
   Dowód: `node tools/fortring-civtest-hook-test.cjs` → 6 PASS / 0 FAIL na main.ts; mutacja (usunięcie bramki `/[?&]civTest=1/` z flagi) → 5 PASS / 1 FAIL (test czerwony). `npx tsc --noEmit` → exit 0.
3. (FLEEMANUAL: runner bez blokady technicznej; off-map i stan po odwrocie NIE ZMIERZONO) — PRZYJMUJĘ. Napisano `gra/tools/flee-manual-measure.cjs`: 3 przypadki × (limit ruchu, brak odwrotu poza planszą 68×156, moveLeft >= 1 przed krokiem, przemieszczenie po odwrocie). Wyniki: 9 PASS / 0 FAIL na każdym przypadku (`dane/case0.log`, `case1.log`, `case2.log`). Pozostaje NIE ZMIERZONE, z powodem: pozycja startowa (log zapisuje tylko cel kroku), animacja (brak hooka; wejście `battle-flee-manual-browser-entry.ts` poza allowlistą), bitwy > 5 tur.
4. (Liczby referencyjne bez logu i SHA) — PRZYJMUJĘ i naprawiono. Ponownie uruchomiono 3 przypadki referencyjne tym runnerem. Wyniki zgodne z raportem Operatora (max kroków/turę: 2, 3, 1; limity 2, 3, 1; łącznie kroków 9, 13, 5). Dane: `dane/flee-manual-measure-case{0,1,2}.json`, logi `dane/case{0,1,2}.log`, sumy `dane/SHA256SUMS`:
   - case0 `7bda99e9f8794646057b6778df290ca6a199325c448562ce57756a2b19d26bd3`
   - case1 `601958ebf91a745c4bff025573d2381b4eb8cca6a2fba36f9199a9b4af43888d`
   - case2 `4b894f0fefdbe09f4d3f1eb78d8d489bab813c6f5e05532a5c3bfc25402f158b`
5. (Bramki poza tsc NIE ZMIERZONE) — PRZYJMUJĘ, uruchomiono (liczby z surowego wyjścia, z tego worktree, po poprawkach):
   - tsc --noEmit: exit 0
   - logic-test: `LOGIC OK (213/213)`
   - tech-tree-test: `20 pass, 0 fail`
   - research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
   - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`; archer-slinger: `51 OK, 0 FAIL`; full-cost: `40 passed, 0 failed`; multitype-walk: `25 OK, 0 FAIL`; promotion-table: `PASS: 32 wpisów źródłowych, 63 krawędzi`; army-multi-select: exit 0, ale tylko `NIE_ZMIERZONO` (panel Chromium/live, brak playwright w tej piaskownicy; test pokrywa logikę); wynik wprost z wyjścia.
   - combat-test: exit 0, `All sanity checks passed.`
   - ai-test: `ai-test: 297 passed, 0 failed`
   - war-rules-multiwar-main-guard-test: `21 PASS / 0 FAIL`
   - hotseat-etap6d-podetap-e-source-test: `77 PASS, 0 FAIL`
   - bramki-tmpdir-unikalnosc-test: FAIL (`PASS=2 FAIL=1`, `2 trafien`): trafienia w plikach spoza tematu — `tools/resource-ledger-realpath-mutation-test.cjs:64` (`require('os').tmpdir()` jako korzeń) i `tools/save-load-deserialize-fields-audit.cjs:52` (`RUN_ID + '-evidence'`). Nie zmieniałem tych plików (poza allowlistą). Odnotowane jako pre-existing w bazie.
   Zgodność z bazą: diff tematu względem 8a8aef35 to tylko pliki wymienione w ZMIANACH; testy uruchomiono na drzewie kandydata zawierającym bazę 547ca34b plus te zmiany.
6. (Drobne: decyzja o allowlist poza BLOKADY/NASTĘPNY KROK, UWAGI = brak) — PRZYJMUJĘ. UWAGI dodano poniżej.

## TESTY (podsumowanie)
- FLEEMANUAL: 3 uruchomienia (po jednym przypadku), każde `9 PASS, 0 FAIL` (1 sprawdzenie globalne + 8 na przypadek), łącznie 27 PASS / 0 FAIL — zob. zarzut 4.
- FORTRING hook: test źródłowy 6/6 PASS; mutacja 5 PASS / 1 FAIL.
- Bramki: patrz zarzut 5.
- Pomiar FORTRING ON/OFF (60 tur, seed 4242): NIE ZMIERZONO (powód: pełny przełącznik niedostępny, runner nie napisany).

## BLOKADY
1. FORTRING: pełny przełącznik wymaga `gra/src/map/improvement-build.ts` (gating `qualifies()`, linia ~1091). Poza allowlistą tej rundy.
2. FORTRING: `fortring-measure.cjs` (60 tur ON/OFF, ms/turę, fort, round-trip) nie napisany — zależy od blokady 1.
3. FLEEMANUAL: pozycja startowa, animacja, bitwy > 5 tur NIE ZMIERZONE (log wejścia, brak hooka animacji, wejście poza allowlistą).
4. Bramka `bramki-tmpdir-unikalnosc` FAIL — pre-existing, 2 pliki spoza tematu.

## RUNDY
2/5. Runda 1 BLOCK (FORTRING brak przełącznika; FLEEMANUAL częściowo). Runda 2: poprawki i pomiar FLEEMANUAL; FORTRING częściowo (hak).

## NASTĘPNY KROK
Orkiestrator decyduje o rozszerzeniu allowlisty o `gra/src/map/improvement-build.ts` (gating `qualifies()` tylko pod `civTestFortRingOff`, `?civTest=1`). Po decyzji: nowa runda z tym samym ID — runner `fortring-measure.cjs` (ON/OFF, seed 4242, 60 tur) i rozszerzenie FLEEMANUAL o pozycję startową/animację, jeśli właściciel to uzna za istotne.

UWAGI-DLA-ORKIESTRATORA:
- Pytanie o allowlistę (zob. BLOKADY 1): czy dopuścić `gra/src/map/improvement-build.ts` do tej rundy? Operator nie rozszerzał allowlisty samodzielnie.
- Hak `setFortRingOff` jest w `main.ts` już teraz: przy ON (domyślnie) zachowanie gry bez zmian. Nie zweryfikowano runtime w przeglądarce (brak live testu gry; flee-test nie importuje main.ts). Wdrożenie tylko po FC.
- Bramka `bramki-tmpdir-unikalnosc-test` ma 2 pre-existing trafienia w `resource-ledger-realpath-mutation-test.cjs` i `save-load-deserialize-fields-audit.cjs`; warto osobny temat R-WEB-*.
- Pliki `gra/tools/.smoke-*.cjs` (14 w git) nie były przeze mnie czytane ani zmieniane.

DEPLOY/PUSH: NIE WYKONANO
