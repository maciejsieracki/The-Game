STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FIXES2-RELEASE-ROBOCZA-Q1
GOAL: Kandydat ROBOCZY nr 2 = origin/main 7e0e7c71 + (A) zasieg ruchu AI (R-WEB-AI-MOVE-RANGE-Q1) + (B) "Wczytaj gre" widzi autozapis FSA (R-WEB-LOAD-GAME-REGRESSION-Q1). Lokalnie, bez push, bez deployu, bez zmiany WERSJE.md.
RUNDA: 2/5 (obrona zarzutow Evaluatora r1, ten sam ID)

## Stan wejsciowy
- Odtworzono stan Operatora r1 z commita `620e8f89` (branch lokalny `wf-ba89-r2-operator`). Produkt `8b522e8f`, bundle `0d126d4a`, bez zmian produktu w tej rundzie.
- Bundle kandydata: md5 `a289d2c4796333c97d1b46e3bdc69f33` (zgodny z `gra-robocza/Gra-ROBOCZA.html` w tym commicie).

## Odpowiedzi na zarzuty

1. PRZYJMUJE. Zarzut prawdziwy: `r1-vite-build.log.txt:9` mialo spacje na koncu. Usunieto koncowe spacje w tym pliku (tylko biale znaki, tresc bez zmian). `git diff --check origin/main <SHA_r2>` -> EXIT=0 (po commicie). Raport r1 z "EXIT=0" byl w tym punkcie bledny.

2. PRZYJMUJE (zrodlo 404 ustalone, E2E uruchomione).
   - Zrodlo: `GET /favicon.ico` z `python3 -m http.server`. Dowod: `evidence/r2-e2e-http-server-favicon-404-evidence.log.txt` (kazde `GET /index.html` konczy sie `GET /favicon.ico ... 404`). Bundle nie zawiera favicony.
   - Srodowisko testowe: katalog serwowany = kopia kandydata jako `index.html` (md5 zgodny) + `favicon.ico`. Produkt i harness bez zmian. Przed poprawka: `r2-e2e-cand-afsa-t2-before-favicon-fix-FAIL404.log.txt` (FAIL tylko przez 404).
   - Wyniki kandydata (2 tury, czas tury zgodny z harnessem):
     - A-FSA: PASS 8/8 (`r2-e2e-cand-all-t2-run1-B-PROMPT-hang.log.txt`, oraz `r2-e2e-cand-afsa-t5-budget120.log.txt` PASS 8/8 przy `--budget-s 120`).
     - A-IDB: PASS 6/6 (ten sam bieg).
     - B-PROMPT: PASS 3/3 (osobny bieg: `r2-e2e-cand-bprompt-t2-alone.log.txt`). W biegu zbiorczym zawisl (patrz nizej).
     - D-EMPTY: PASS 2/2 (`r2-e2e-cand-dempty-t2.log.txt`): "Wczytaj gre" WYSZAROWANY + podpowiedz "brak zapisow".
   - Porownanie z baza 7e0e7c71 (bundle 46401a99, md5 zgodny): A-FSA FAIL 3 (przycisk wyszarowany, lista 0 wierszy), B-PROMPT FAIL 2 (`r2-e2e-base-afsa-t5-budget120.log.txt`, `r2-e2e-base-bprompt-t2.log.txt`). To jest regresja, ktora kandydat usuwa.
   - Znany problem NIE_ZMIERZONO: (a) bieg zbiorczy kandydata (A-FSA, A-IDB, B-PROMPT, D-EMPTY) raz zawisl w `stateOf` w B-PROMPT, timeout 480 s, EXIT=124 (`r2-e2e-cand-all-t2-run1-B-PROMPT-hang.log.txt`); B-PROMPT osobno przechodzi. Przyczyny nie ustalono. (b) `--turns 5` (domyslne) nie dochodzi do tury 6: ZASTOJ w turze 2 po 124 s z `[EndTurn] blocked: awaitingFirstPlayerCity`. Ten sam zastoj jest na bazie 46401a99 (`r2-e2e-base-afsa-t5-budget120.log.txt`), wiec nie jest regresja kandydata. Wiszenie "page closed" z r1 uznaje za ten sam zastoj (budzet 900 s).
   - Zmiana: ponowne uruchomienia E2E wykonane po poprawce nie zmieniaja harnessu ani produktu.

3. CZESCIOWO PRZYJMUJE (zmiana jawna i uzasadniona; niezmiennik nie zostal przywrocony, bo jest nieprawdziwy po zamierzonej zmianie; decyzja dla FC).
   - 1a (`PRZED` bitwy 0 -> 3): flaga OFF po R-WEB-AI-MOVE-RANGE-Q1 celowo daje pelny zasieg AI, wiec "OFF == baza" nie moze obowiazywac. Dowod: `r2-test-war-allin-capital-test-defaultref.log.txt` (1a: bitwy PRZED = 3, baza = 0) i kod testu (`REF_AI_OFF_BATTLES`).
   - 6a: `origin/main` 7e0e7c71 zawiera juz modul `warAllInCapital` (regula wojny), wiec `hasModule false` byl nieaktualny dla kazdej bazy po tej regule. Baza `75f53d58` jest sprzed modulu (brak `gra/src/game/warAllInCapital.ts` w `git show 75f53d58`).
   - 6b: pin bazy `fcd86933` (hashe zapisane) zamiast `OFF == baza`.
   - Wyniki: domyslnie (`fcd86933`) 95/0 (`r2-test-war-allin-capital-test-defaultref.log.txt`, EXIT=0). Z `WAR_ALLIN_BASE_REF=75f53d58` 90/5 (`r2-test-war-allin-capital-test-ref75f53d58.log.txt`, EXIT=1): wszystkie 5 bledow w sekcji 6 (6a + 4x 6b0), zero w sekcjach 1-5. Dispatch wymagal 95/0 lub opisu: opisane.

4. PRZYJMUJE (test poprawiony, zarzut o "lagodniejszym progu" odrzucam).
   - Przy starym kryterium `realMoves >= 40` test padl 12/12 (`r2-probe-barbarzyncy-realMoves40-FAIL12.log.txt`): 29 zmian pozycji na 56 heksow przy pelnym zasiegu.
   - W bazie kazdy krok to 1 heks, wiec `hexesMoved == realMoves` co do wartosci. Prog 40 mierzy ten sam dystans, a nie mniej. Komentarz w `gra/tools/barbarzyncy-krazenie-test.cjs` (sekcja 10) to opisuje.
   - Wynik: 249/0, EXIT=0 (`r2-test-barbarzyncy-krazenie-test.log.txt`).

5. NIE SPELNIONE LITERALNIE, PRZYJMUJE jako notę (nie ODRZUCAM). Kryterium "ERRORS puste" nie jest spelnione.
   - Zrodlo: `console.error` hooka wymuszonej wojny w `gra/src/main.ts:34215` (`[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary...`, owners [0]). To nie jest blad JS: brak pageerror/TypeError/ReferenceError.
   - Liczba: 27 w kazdym z 4 przebiegow r1 (`r1-smoke-*.log.txt`), 27 w bazie tak samo (`r1-smoke-base-*`). Literal w bundlu bazy 46401a99 i kandydata: po 1 wystapieniu (grep). Brak regresji.
   - Bundle nie zmieniony od r1, wiec smoke r1 (50 tur, stalls 0, BAD_RESPONSES puste, mediana endTurn 0,99 peace / 0,94 war) pozostaje dowodem. Nie powtarzano.

6. PRZYJMUJE. Dopisane `EXIT=0` w swiezym biegu: `r2-test-logic-test.log.txt` (LOGIC OK 213/213). Stary `r1-test-logic-test.log.txt` zostaje jako historia.

7. PRZYJMUJE. Swieze pelne wyjscia Rust (CARGO_TARGET_DIR w scratchpadzie tylko dla tego worktree, CARGO_INCREMENTAL=0), kazdy z `EXIT=`:
   - `r2-rust-fmt.log.txt` EXIT=0
   - `r2-rust-clippy.log.txt` (`clippy --all-targets -- -D warnings`) EXIT=0
   - `r2-rust-build.log.txt` (`build --all-targets`) EXIT=0
   - `r2-rust-test-build.log.txt` (`test --no-run`) EXIT=0, z liniami `Executable`.
   - `Cargo.lock` usuniety, nie commitowany. Katalog target do usuniecia po zapisie.

8. PRZYJMUJE jako zmierzone (nie blokada). `hasRememberedFsaDirectory` zwraca true przy zapamietanym katalogu bez zgody, ale scenariusz D-EMPTY (pusty katalog) przechodzi: przycisk wyszarowany, podpowiedz "brak zapisow" (PASS 2/2).

9. LUKI, status NIE_ZMIERZONO (bez zmian poza E2E wyzej):
   - pomiar >= 40 tur z wczytaniem: NIE_ZMIERZONO (zastoj tury opisany w pkt 2, identyczny na bazie),
   - stary zapis (zgodnosc wstecz): NIE_ZMIERZONO,
   - wizualna kontrola kazdego hunka `main.ts`: NIE_ZMIERZONO (kontrola tylko testami).

## Testy w tej rundzie (surowe logi w `evidence/`, kazdy z `EXIT=`)
- Rust: fmt, clippy -D warnings, build, test --no-run: EXIT=0 (pkt 7).
- logic-test 213/213 EXIT=0; barbarzyncy-krazenie 249/0 EXIT=0; war-allin 95/0 (domyslnie) EXIT=0; war-allin z 75f53d58 90/5 EXIT=1 (pkt 3).
- E2E: pkt 2 (kandydat A-FSA, A-IDB, B-PROMPT, D-EMPTY PASS; baza FAIL jako dowod regresji).
- Pozostale bramki (tsc, ai-move-range, endturn, load-game, fsa-autosave, autosave-quota, barbarians, barb-city, smoke) bez zmian wzgledem r1: patrz `01-operator-r1.md` i `evidence/r1-*`. Nie powtarzano, bo produkt i bundle sa identyczne.

## Zmiany w tej rundzie
- `gra/tools/barbarzyncy-krazenie-test.cjs`: prog na `hexesMoved` z komentarzem (pkt 4).
- `evidence/r1-vite-build.log.txt`: usuniete koncowe spacje (pkt 1).
- Nowe logi `evidence/r2-*` (pkt 2, 3, 6, 7).
- Produkt `gra/src/**`, bundle, manifest, START, WERSJE.md: bez zmian.

## Plan publishu i rollbacku (bez zmian wzgledem r1)
- Integracja orkiestratora na `integration/robocza-turnslow-20261023`. Wykonuje orkiestrator po Final Control.
- Rollback: bundle 46401a99 (md5 `46401a9932fd92f47eed1848e772122b`, sha256 `5734348713663669fe6407fae9befc4d59fe233b58386105160c7ea093db2de2`, 69966015 B).

NASTEPNY KROK: Evaluator r2 (sprawdzic pkt 1, 2, 3, 4, 6, 7, zwlaszcza EXIT w logach i git diff --check), potem Final Control (decyzja w pkt 3 i 5), potem integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
