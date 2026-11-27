# R-WEB-CULT-REL-AI-PLUS10-Q1 — raport Operatora, runda 2/5 (HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1 (tag AIPLUS10)
GOAL: wdrożyć decyzje właściciela z 2026-11-27 dla „Kultura i religia”: wspólna formuła ADDYTYWNA (minus D−Δ, plus G+Δ, Δ = 0/+6/+13) dla gracza i AI; osobny poziom gracza i poziom AI w kreatorze; testy z mutacjami czerwonymi; pomiar PRZED/PO na poziomie maksymalnym.
BAZA: origin/main 44649038c; kandydat rundy 2 = c605a386b (FC r1 PASS-WITH-NOTES). `git merge-base --is-ancestor c605a386b origin/main`: nie dotyczy (kandydat jest potomkiem 44649038c; kod rundy 2 dodany w commicie c2152fdbf).
SHA: c2152fdbf (kod i testy, rodzic c605a386b) — raport i dokument analizy w commicie kończącym tę rundę (czubek w polu sha).

ZMIANY-COMMIT:
- c2152fdbf: gra/src/game/culture-religion-level.ts (jedna gałąź addytywna dla gracza i AI; ownerIsHuman wybiera tylko plus), gra/data/society-params.json (opis), gra/tools/culture-religion-level-test.cjs, gra/tools/ai-plus10-culture-test.cjs, gra/tools/ai-plus10-matrix-test.cjs.
- commit raportu: dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md (przepisany na formułę addytywną i oba poziomy, z pomiarem) oraz ten plik.
- Nie zmieniano: gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, main.ts (poza tym, co już było w c605a386b), kreatora (już zawierał oba selektory z rundy 1).

TESTY (surowe wyniki w tej rundzie):
- tsc --noEmit (gra/): exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- combat-test: COMBAT TEST 6/6 pass
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21); archer-slinger 51 OK/0 FAIL; full-cost 40/0; multitype-walk 25 OK/0 FAIL; promotion-table PASS 32 wpisów; army-multi-select: live panel NIE ZMIERZONO (brak playwright w tej pracy testowej)
- ai-test: 297 passed, 0 failed
- culture-religion-level-test: 59 pass / 0 fail (zaktualizowane 10 oczekiwań do wartości addytywnych)
- ai-plus10-culture-test: 72 pass / 0 fail (1 oczekiwanie zmienione, 4 dodane)
- ai-plus10-matrix-test: 190 pass / 0 fail (tabela gracza przepisana do addytywnej)
- culture-religion-test: 65 passed, 0 failed (bez zmiany asercji)
- society-breakdown-test: 56 OK, 0 FAIL (bez zmiany asercji)
- ai-city-order-need-test: 35 passed, 0 failed
- ai-city-order-need-wiring-test: 231 passed, 0 failed

MUTACJE CZERWONE (kod przywracany po każdej; `cmp` z kopią potwierdzony, końcowy `git status` czysty):
- M1 minus D mnożony przez skalę: level 52/7, plus10-culture 71/1, matrix 154/36 — czerwone
- M2 plus gracza mnożony przez skalę: level 55/4, plus10-culture 69/3, matrix 174/16 — czerwone
- M3 AI używa plusu gracza: level 59/0, plus10-culture 51/21, matrix 160/30 — czerwone (level-test nie testuje AI)
- M4 AI czyta poziom gracza (getCulturaReligiaLevelForOwner): level 59/0, plus10-culture 72/0, matrix 171/19 — czerwone tylko w macierzy 3×3

POMIAR PRZED/PO (poziom MAKSYMALNY: gra Trudny, Kultura gracza Trudny, Kultura AI Trudny, Koszty jednostek Wysoki ×4, 60 tur, seed 4242 i 7, runner gra/tools/ai-cult-rel-measure-run.cjs --unit-flow 1 --city-state 1; bundle vite poza repo, Chromium headless):
- PRZED = baza 44649038c (zmierzona w tej rundzie, NIE cytowana): s4242 jednostki AI t60 159 (miasta AI <14%: 60), s7 jednostki 138 (75)
- PO = c2152fdbf: s4242 jednostki AI t60 205 (<14%: 0), Porządek AI t60 55,6, t10 65,8; s7 jednostki AI t60 265 (<14%: 0), Porządek t60 52,9, t10 65,4
- Liczby z surowego wyjścia gra/tools/ai-cult-rel-measure-flow.cjs; tabela w dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md.
- Bieg „AI łatwy, gracz trudny”: NIE ZMIERZONO (runner przekazuje tylko poziom gracza; zmiana haka w main.ts poza zakresem).

BLOKADY:
- Weryfikacja UI w przeglądarce (punkt 2 DODATKU 4: zrzut kreatora z dwoma selektorami, wybór gracz Duży wpływ / komputer Mały wpływ, odczyt D/G przez civTest, zapis i wczytanie pól) — NIE WYKONANA. Wymagana przed READY_FOR_DEPLOY; kod kreatora z rundy 1 nie był zmieniany w tej rundzie.
- Pomiar wartości gracza w grze (osobny bieg) — NIE ZMIERZONO.
- Widoki poza turą (panel miasta, growth-happiness.ts, turn-economy.ts, conquest-stability.ts) nadal pokazują wartości gracza dla miast AI (nie dostały typu właściciela); tury liczy evaluateOrderFromBreakdown, więc pomiar tego nie dotyczy. Do osobnego tematu, jeśli mają pokazywać wartości AI.
- Rozstrzygnięcie sporu z FC r1 (zgodnie z DODATKIEM 4): wdrożono formułę addytywną również dla gracza, bo późniejsza potwierdzona tabela właściciela ją nadpisuje. Jeśli właściciel chce inaczej, to zmiana jednej funkcji (cultureReligionLineValue) i tabel testów.

RUNDY: 2/5 (po FC r1 PASS-WITH-NOTES z blokerami; naprawy DODATKU 4)
- Naprawa 1 (formuła addytywna dla gracza i AI, testy, mutacje): WYKONANA (c2152fdbf)
- Naprawa 2 (weryfikacja UI): NIE WYKONANA — blokada
- Naprawa 3 (pomiar PRZED/PO, poziom maksymalny): WYKONANA dla wariantu trudny/trudny, seed 4242 i 7; wariant „AI łatwy” NIE ZMIERZONO
- Naprawa 4 (dokument): WYKONANA
- Naprawa 5 (cityPanel isHumanOwner zostaje; growth-happiness.ts/turn-economy.ts bez zmian): WYKONANA

NASTĘPNY KROK: FC runda 2 (Final Control) z zachowaniem blokady UI; przed READY_FOR_DEPLOY: weryfikacja UI w przeglądarce (kreator z dwoma selektorami + zapis/wczytanie) albo decyzja orkiestratora o przyjęciu tego zakresu z blokadą; osobna decyzja, czy hak startGame ma przyjmować poziom AI (wariant „AI łatwy, gracz trudny”).

DEPLOY/PUSH: NIE WYKONANO
