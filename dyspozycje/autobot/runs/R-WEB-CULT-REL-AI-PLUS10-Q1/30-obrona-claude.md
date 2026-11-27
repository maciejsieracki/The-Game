STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1 (obrona rundy 2, kandydat cb1e032b1; raport Evaluatora 9d44f3b9b)
GOAL: odpowiedzieć na 5 zarzutów Evaluatora: UI w przeglądarce (dwa selektory, wartości, zapis), pomiar AI łatwy / gracz trudny, opis w kreatorze zgodny z tabelą, luki testowe (mutacje AI), widoki poza turą.
BAZA: cb1e032b1 (checkout --detach). Kod silnika nie zmieniany w tej obronie; zmiany: hint kreatora, testy, hak pomiaru.

## Odpowiedzi na zarzuty

1. UI w przeglądarce — PRZYJMUJĘ, CZĘŚCIOWO WYKONANE.
   - WYKONANE: nowy test `gra/tools/ai-plus10-wizard-ui-test.cjs` (Chromium headless, bundle newGameFlow.ts): 6 pass / 0 fail. Dwa selektory „Kultura i religia — dla gracza” i „— dla komputera (AI)” w oknie zaawansowanym; domyślnie oba „Mały wpływ (łatwy)”; wybór gracz „Duży wpływ (trudny)” + komputer „Mały wpływ (łatwy)” przeżywa zamknięcie i ponowne otwarcie okna; parametry startu `advanced.kulturaReligiaLevel=trudny`, `advanced.kulturaReligiaLevelAI=latwy`.
   - ZRZUT: dyspozycje/autobot/runs/R-WEB-CULT-REL-AI-PLUS10-Q1/dane/kreator-dwa-selektory-kultura.png
   - WYKONANE (ścieżka żywej gry): pomiar z hakiem startu z polem AI (patrz pkt 2). Różnica wyników AI przy AI łatwy vs trudny potwierdza, że poziom AI dochodzi do silnika w żywej grze.
   - NIE WYKONANE: (a) odczyt D/G gracza i AI przez hak civTest w żywej grze (oczekiwane gracz D −20/G 0, AI D −10/G +10 w epoce 1) — nie dodano haka odczytu; wartości silnika pokrywa test macierzy/funkcji (ai-plus10-matrix-test 190/0, culture-religion-level-test 108/0); (b) round-trip ZAPISU i WCZYTANIA obu pól w żywej grze (kod: main.ts getSettings ~34479 i wczytanie ~52244, nie uruchomiony) — NIE ZMIERZONO.

2. Pomiar AI łatwy / gracz trudny — PRZYJMUJĘ, WYKONANE (seed 4242, 60 tur). Dodano do haka startGame (main.ts, minimalny plumbing: `kulturaReligiaLevelAI`, `kosztJednostekPace`) i do runnera opcje `--kr-ai`, `--koszt-jednostek`. Wyniki w tabeli niżej.

3. Podpowiedź selektora „dla gracza” — PRZYJMUJĘ, WDROŻONE. Stary opis („od −20 do 0 (bez plusów)”, „proporcjonalnie”) zastąpiony tabelą addytywną (gracz trudny: od −20 do 0 w epoce 1, od −33 do +13 w epoce 3). Opis AI: minus wg poziomu, plus +10/+16/+23 na każdym poziomie. Plik: gra/src/ui/newGameFlow.ts (hint obu selektorów). Test UI sprawdza brak „bez plusów” i obecność zakresu.

4. Luki w testach — PRZYJMUJĘ, WDROŻONE, z mutacjami czerwonymi (uruchomione i przywrócone, `cmp` potwierdzony):
   - culture-religion-level-test: nowa sekcja 8 (AI: tabela plus 10/16/23 i minus wg poziomu; gracz; rozdział poziomów gracz/AI przez computeHappinessBreakdown i computeLawBreakdown; zgodność AI). Wcześniej 59/0 bez asercji AI; teraz 108/0.
   - ai-city-order-need-wiring-test: nowy T0 (AI trudny = 4; AI łatwy niezależny od poziomu gracza) i T0b (udział 100%: plus AI jednakowy na każdym poziomie AI). Wcześniej 231/0; teraz 267/0.
   Mutacje (wynik po zmianie):
   - M-A typ właściciela ignorowany w kultReligLinePoints (society-breakdown.ts:750 → true): culture-level 106 pass / 2 fail; wiring 29 pass / 1 fail (T0b) → CZERWONE (zarzut Evaluatora nr 4 wcześniej: wiring 231/0 zielony — teraz wykrywa).
   - M-B AI czyta poziom gracza (getCulturaReligiaLevelForOwner → activeLevel): culture-level 103 pass / 3 fail; wiring 27 pass / 2 fail → CZERWONE.
   - M-C plus AI liczony z G gracza (culture-religion-level.ts: gE = raw.G + delta): culture-level 100 pass / 6 fail → CZERWONE.
   Po przywróceniu: culture-religion-level-test 108/0, wiring 267/0.

5. Widoki poza turą — CZĘŚCIOWO ODRZUCAM z dowodem, cityPanel PRZYJMUJĘ jako zrobione.
   - Dowód: w src/ wywołania computeHappinessBreakdown / evaluateOrderFromBreakdown / computeLawBreakdown są w: src/main.ts:45024 (tura), src/ui/cityPanel.ts:3417 (widok miasta) oraz src/game/society-breakdown.ts (definicje). Pozostałe trafienia w growth-happiness.ts, turn-economy.ts, conquest-stability.ts to WYŁĄCZNIE komentarze (grep: brak wywołań funkcji w kodzie tych plików; growth-happiness.ts:5 wprost mówi „nie jest pełny evaluateOrderFromBreakdown”). Nie ma więc tam wartości dla miast AI do poprawienia.
   - cityPanel: już podaje typ właściciela (`isHumanOwner` w main.ts:14976, 35738, 50639 → cityPanel.ts:3429 `ownerIsHuman`). Widok miasta AI liczy poziom AI.

## Pomiar (kod: silnik cb1e032b1, bez zmian w tej obronie; runner ai-cult-rel-measure-run.cjs; 60 tur; --city-state 1 --unit-flow 1; hak startGame: Trudny, Kultura gracza, Koszty jednostek = wysoki)

Dane: pole `cityState` z jsonl (AI = właściciele inni niż człowiek i barbarzyńcy); Porządek śr. = suma porPctSuma / liczba miast AI; poniżej progu = suma pola ponizejProgu (próg nie zweryfikowany w tym haku — podaję pole z gry).

| Wariant | Seed | t60 miasta AI | t60 jednostki AI | t60 poniżej progu | Porządek AI śr. t10 | Porządek AI śr. t60 |
|---|---|---|---|---|---|---|
| PRZED (baza 44649038c, jeden poziom, AI w starej formule) | 4242 | 159 | 187 | 63 | 19,5% | 21,3% |
| PO (cb1e032b1) gracz trudny / AI trudny | 4242 | 200 | 292 | 1 | 65,8% | 56,1% |
| PRZED | 7 | 165 | 205 | 81 | 21,6% | 19,5% |
| PO gracz trudny / AI trudny | 7 | 192 | 322 | 0 | 65,4% | 52,6% |
| PO gracz TRUDNY / AI ŁATWY | 4242 | 203 | 283 | 0 | 68,7% | 61,2% |

- Różnica AI łatwy vs trudny (seed 4242, t60): jednostki 283 vs 292; Porządek śr. 61,2% vs 56,1% (AI łatwy ma mniejsze minusy → wyższy Porządek). Potwierdza, że poziom AI dochodzi do silnika.
- Uwaga: PRZED to bieg czysty na bazie 44649038c (nie cytat z dokumentu). Różnica wartości PRZED względem dokumentu AICULTDIAG (jednostki 159 w s4242) wynika z innego przebiegu, nie z tej zmiany.
- Pierwszy bieg PRZED seed 7 padł (SIGSEGV Chromium przy załadowaniu, ~t0); powtórzony bez zmian warunków — wynik z powtórki.
- NIE ZWERYFIKOWANO: pole `unitCostPace` w rekordach każdego biegu pokazuje „normalny”, a nie „wysoki”, mimo że hak startGame dostał `kosztJednostekPace: 'wysoki'`. Nie ustalono, czy to błąd pola rekordu, czy ustawienie nie dotarło. Do sprawdzenia przez orkiestratora przed przyjęciem liczb kosztów jednostek.
- Dodatkowe: metryki są z pól gry (cityState, owners), nie z osobnego haka Porządku.

## Zmiany w kodzie (ścieżki)
- gra/src/ui/newGameFlow.ts — hint obu selektorów (tabela po epokach; AI +10/+16/+23).
- gra/src/main.ts — hak `window.__nnsMeasureDebug.startGame`: opcje `kulturaReligiaLevelAI`, `kosztJednostekPace` (domyślnie 'niski' = dzisiejsze zachowanie). Bez zmiany silnika.
- gra/tools/ai-cult-rel-measure-run.cjs — opcje `--kr-ai`, `--koszt-jednostek` (domyślnie jak dotąd).
- gra/tools/culture-religion-level-test.cjs — sekcja 8 (AI i rozdział poziomów).
- gra/tools/ai-city-order-need-wiring-test.cjs — T0, T0b (typ właściciela w wpięciu).
- gra/tools/ai-plus10-wizard-ui-test.cjs — NOWY (test UI kreatora, Chromium).
- dyspozycje/autobot/runs/R-WEB-CULT-REL-AI-PLUS10-Q1/dane/kreator-dwa-selektory-kultura.png — zrzut.
- dyspozycje/autobot/runs/R-WEB-CULT-REL-AI-PLUS10-Q1/30-obrona-claude.md — ten raport.
Nie zmieniano: gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, silnik (culture-religion-level.ts, society-breakdown.ts — mutacje przywrócone, git diff czysty), wartości D/G, progi buntu.

## TESTY (surowe wyniki w tej obronie, gra/)
- tsc --noEmit: exit 0 (bez błędów)
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- combat-test: All sanity checks passed.
- ai-test: 297 passed, 0 failed
- culture-religion-level-test: 108 pass / 0 fail (poprzednio 59/0)
- ai-city-order-need-wiring-test: 267 passed, 0 failed (poprzednio 231/0)
- ai-plus10-matrix-test: 190 pass / 0 fail
- ai-plus10-culture-test: 72 pass / 0 fail
- culture-religion-test: 65 passed, 0 failed
- ai-city-order-need-test: 35 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL (w tej obronie, bez zmiany asercji)
- ai-plus10-wizard-ui-test (nowy): 6 pass / 0 fail
- newgame-settings-layout-reposition-test: FAIL (patrz BLOKADY, pkt 1)
- Mutacje czerwone: M-A, M-B, M-C (patrz pkt 4).
- Bieg pomiarów: 4 biegi PO/PRZED + 1 AI łatwy (60 tur każdy), wszystkie z jsonl.

## BLOKADY
1. newgame-settings-layout-reposition-test.cjs: CZERWONY przed tą obroną i nadal czerwony. Lista zaawansowanych oczekuje 14 pozycji; kreator ma już 18 (`Wzrost surowców z epoką` i `Dyplomacja i wojna` były już w bazie 44649038c, a tę kolejność test nie zawiera; dwie pozycje „Kultura i religia” dodaje ten temat). Poprawka wymaga zmiany ADV_ORDER w tym teście — plik poza allowlistą tematu. DECYZJA ORKIESTRATORA: dopisać allowlistę albo rozdzielić.
2. Zapis i wczytanie obu pól w żywej grze (round-trip) — NIE ZMIERZONO.
3. Odczyt D/G przez hak civTest w żywej grze — NIE ZMIERZONO (wartości w teście funkcji).
4. unitCostPace w rekordach pomiaru = „normalny” przy haku „wysoki” — NIE ZWERYFIKOWANO (patrz pomiar).
5. Widoki poza turą dla AI: cityPanel OK; pozostałe moduły bez wywołań (dowód wyżej).

## UWAGI-DLA-ORKIESTRATORA
- Pomiar kosztów jednostek: sprawdzić pole unitCostPace (pkt 4 blokad) przed przyjęciem liczb.
- Chromium: w biegu PRZED seed 7 pierwsza próba padła (SIGSEGV przy starcie); powtórka OK. Znane ryzyko harnessu (#90), nie błąd gry.
- Temat AIREBEL (rebelia AI) nie dotykany.
- Dwa zestawy wyników PO różnią się od dokumentu AI-PLUS10 (plik nie aktualizowany w tej obronie); jeśli orkiestrator chce liczby w dokumencie, użyć tabeli powyżej.

## NASTĘPNY KROK
Integracja orkiestratora po decyzji o blokadzie 1 (allowlista newgame-settings-layout-reposition-test.cjs). Przed READY_FOR_DEPLOY: round-trip zapisu/wczytania i odczyt D/G w żywej grze (blokady 2–3), albo jawna decyzja o przyjęciu z tą blokadą.

RUNDY: 2/5 (obrona po FC r1 PASS-WITH-NOTES; to jest obrona rundy 2)
DEPLOY/PUSH: NIE WYKONANO
