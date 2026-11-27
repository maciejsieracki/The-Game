STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1 (obrona rundy 3; kandydat 78363f7b0; raport Evaluatora 7a3dc3d78; zarzuty 1–7)
GOAL: zamknąć zarzuty Evaluatora r3: żywy round-trip zapisu/wczytania obu pól poziomu, pomiar PRZED/PO z surowymi danymi w repo i poprawną bazą PRZED, poprawne komunikaty testu kreatora, spójny dokument, integracja z aktualnym origin/main.
BAZA: PRZED = origin/main 3608af1ce (baza gałęzi; zawiera FALE 928–929). PO = 78363f7b0 scalony z origin/main 3608af1ce (merge b7ba86688; `git merge-tree` czysty, bez konfliktów). Kod silnika (`culture-religion-level.ts`, `society-breakdown.ts`, `ai-city-order-need.ts`) NIE zmieniany w tej obronie.

## Odpowiedzi na zarzuty

1. Round-trip zapisu/wczytania (DODATEK 5 pkt 1b) — PRZYJMUJĘ, WYKONANE.
   - Nowy test żywy `gra/tools/ai-plus10-live-roundtrip-test.cjs` (Chromium, bundle z `?civTest=1` przez `tools/test-hook-setcitylimit-live-bundle.cjs`): start przez REALNY doStartGame (`__settingsLive.startNewGame`), zapis i wczytanie przez REALNE persistSaveToSlot + loadGameFromSlot (`__settingsLive.saveRoundTrip`).
   - Wynik: 4/4 scenariusze zielone: gracz trudny / AI łatwy; gracz łatwy / AI trudny; brak pola AI (= poziom gracza); zgodność (oba null). Po wczytaniu ustawienia = przed zapisem. Surowe wyjście: `dane/live-roundtrip-wynik.txt`.
   - Kod z zarzutu (zapis legacy bez pola AI) nie był odtwarzany jako plik z dysku; pokryte startem bez pola i testami jednostkowymi wczytania (zob. ograniczenia w raporcie).

2. Odczyt D/G w żywej grze — PRZYJMUJĘ JAKO DŁUG, NIE WYKONANO (z przyczyną technyczną).
   - Brak istniejącego haka zwracającego rozbicie Kultury i Religii per właściciel (cityOrderState / computeHappinessBreakdown nie są wystawione na window). Dodanie haka = zmiana `gra/src/main.ts` poza zakresem tej rundy (dispatch dopuszcza src tylko przy błędzie weryfikacji). Odnotowane jako dług dla orkiestratora. Wartości potwierdzone testami funkcji (matrix 190/0, culture 72/0, level 108/0).
   - Żywo zmierzono natomiast, że silnik dostaje właściwe poziomy gracza i AI (getSettings w scenariuszach testu).

3. Surowe dane pomiaru poza repo — PRZYJMUJĘ, WYKONANE.
   - Pomiar powtórzony na tej bazie w tej rundzie: PRZED (3608af1ce, świeży build z `git archive`) i PO (kandydat scalony), seed 4242 (60 tur) i seed 7 (58 tur, zob. pkt 4). Wszystkie z `--pace wysoki --koszt-jednostek wysoki --kr trudny --difficulty trudny --city-state 1`.
   - Surowe jsonl i summary w `dane/` (PRZED-s4242, PO-s4242, PRZED-s7, PO-s7), zestawienie `dane/przed-po-zestawienie-wynik.txt` (skrypt `dane/przed-po-zestawienie.cjs`). `unitCostPace=wysoki` w każdym rekordzie (4/4).

4. PRZED bez FALI 928–929 — PRZYJMUJĘ, WYKONANE.
   - PRZED = 3608af1ce (zawiera AIREBEL), więc różnica PRZED/PO nie miesza rebelii AI. Stara tabela z bazy 44649038c usunięta z dokumentu.
   - Zastrzeżenie: seed 7 w obu wariantach zmierzony do tury 58 (nie 60), bo wznowienie slotu PO kończyło się crashem Chromium (SIGSEGV, znany problem harnessu #90). Opisane w dokumencie.

5. Dokument sprzeczny (sekcje r2 NIE ZMIERZONO vs r3) — PRZYJMUJĘ, WYKONANE.
   - `dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md` przepisany: jedna aktualna wersja, testy z tej rundy, pomiar PRZED/PO z 3608af1ce, sekcja „Weryfikacja żywa — stan” zgodna z testami.

6. Stale komunikaty newgame-settings-layout-reposition-test — PRZYJMUJĘ, WYKONANE.
   - Komentarz nagłówka i komunikat PASS: 14 kart siatki, 18 pozycji okna zaawansowanego (były „12/13”). Asercje bez zmian (deepStrictEqual na 14 i 18 pozycjach). Test: PASS (exit 0).

7. Integracja z origin/main 3608af1ce — PRZYJMUJĘ, WYKONANE.
   - `git merge --no-ff origin/main` na kandydacie: czysto (merge b7ba86688). Pełne bramki na wyniku scalenia (poniżej).

## TESTY (surowe wyniki, gra/, po merge b7ba86688 i po poprawce komunikatów)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 ALL GREEN
- unit-replace-test: exit 0
- combat-test: COMBAT TEST 6/6 pass
- ai-test: 297 passed, 0 failed
- culture-religion-level-test: 108 pass / 0 fail
- ai-city-order-need-wiring-test: 267 passed, 0 failed
- ai-plus10-matrix-test: 190 pass / 0 fail
- ai-plus10-culture-test: 72 pass / 0 fail
- culture-religion-test: 65 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- ai-city-order-need-test: 35 passed, 0 failed
- ai-plus10-wizard-ui-test (Chromium): 6 pass / 0 fail
- newgame-settings-layout-reposition-test: PASS (exit 0), 14-card grid, 18-row advanced
- ai-plus10-live-roundtrip-test (NOWY, żywa gra): 4 / 4 scenariuszy zielonych
- Pomiar PRZED/PO (60 tur seed 4242; 58 tur seed 7), wyniki w `dane/` i w dokumencie.

Pomiar (jednostki AI / miasta AI / poniżej 14% / Porządek AI śr. %):
- s4242 t60: PRZED 142 / 160 / 67 / 19,3 — PO 214 / 188 / 1 / 55,4
- s7 t58: PRZED 133 / 151 / 75 / 19,8 — PO 259 / 183 / 1 / 52,4
- `unitCostPace=wysoki` potwierdzone w 4 biegach.

Mutacje czerwone: wyniki z obrony r2 (przywołane w dokumencie, nie powtarzane w tej rundzie; formuła się nie zmieniła).

## BLOKADY
1. Odczyt D/G per miasto w żywej grze: NIE ZMIERZONO (brak haka rozbicia per właściciel; dług dla orkiestratora, pkt 2).
2. Wartości gracza w grze pod nowymi plusami: NIE ZMIERZONO (runner nie steruje ruchami gracza).
3. Zapis legacy z dysku bez pola AI: NIE ZMIERZONO na żywo (pokryte startem bez pola i testami jednostkowymi).
4. Seed 7 PO/PRZED na 58 turach, nie 60 (crash Chromium przy wznowieniu slotu, #90).
5. Kreator w przeglądarce po merge: test UI 6/0; zrzut z rundy 2 (dane/kreator-dwa-selektory-kultura.png), bez nowego zrzutu.

## UWAGI-DLA-ORKIESTRATORA
- Test `ai-plus10-live-roundtrip-test.cjs` używa `os.tmpdir()` dla bundle (zgodnie z dispatchem /tmp/<unikalny>); po pracy katalogi tymczasowe bundle można usunąć.
- Worktree i node_modules gra/ zostają do sprzątania przez orkiestratora. Scratchpad zawiera świeże buildy PO/PRZED (`dist-po`, `dist-prz`) i katalog `prz/` (git archive 3608af1ce).
- Dług testowy: rozbicie Kultury/Religii per właściciel jako hak civTest (do odczytu D/G żywo), osobny temat, wymaga decyzji o zmianie gra/src.
- Temat AIREBEL (rebelia AI) nie dotykany w tej obronie.

## NASTĘPNY KROK
Integracja orkiestratora po FC (kandydat = czubek tej obrony). Przed READY_FOR_DEPLOY: decyzja, czy dług odczytu D/G (pkt 2) jest akceptowany, czy wymaga osobnego tematu z haka w src.

RUNDY: 3/5 (obrona po FC r2 PASS-WITH-NOTES)
DEPLOY/PUSH: NIE WYKONANO
