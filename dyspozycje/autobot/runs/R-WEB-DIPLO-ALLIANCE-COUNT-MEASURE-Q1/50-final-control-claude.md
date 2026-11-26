STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar, bez zmian kodu gry)
TEMAT: R-WEB-DIPLO-ALLIANCE-COUNT-MEASURE-Q1
GOAL: sprawdzic, czy ALLYCLEAN (FALA 913) nie zmniejszyl liczby sojuszy AI o >30% wzgledem b1e4e04ab; zero zmian gra/** i gra/data/**.
ZMIANY/COMMIT: kandydat 12685cd6a7bb7f301e25e1b082d477e98b0b9787. `git merge-base --is-ancestor 107e30f5e... 12685cd6a...` = TAK. `git diff --name-only` baza..kandydat = 4 pliki, wszystkie w allowliscie (dyspozycje/analizy/SOJUSZE-LICZBA-PRZED-PO-ALLYCLEAN-2026-11-26.{md,json}, dyspozycje/analizy/allyclean-count-measure.cjs, dyspozycje/autobot/runs/<ID>/10-operator-claude.md); 456 wstawien, 0 zmian w gra/**, WERSJE.md, manifest, rust-port. `git diff --check` czysty.
TESTY: brak zmian kodu gry => tsc i 5 bramek referencyjnych NIE URUCHAMIANE (drzewo gra/ identyczne z baza). Weryfikacja wlasna: JSON (wyjscie analizatora) zgodny z tabelami .md w 4 przebiegach: seed 4242 PRZED/PO sojusze w turach 10..67 = 0,0,2,2,2,3,3 / 0,0,2,2,2,3,3; seed 7 PRZED 0,0,0,2,2,2,5, PO 0,0,0,2,2,3,6; wiersze 66 na przebieg; maks. na cywilizacje 2; nowe/usuniecia/podmiany/odnowienia 3/0/0/0, 3/0/0/0, 8/3/3/1, 9/3/3/0; status=sojusz bez umowy 0/0/24/0. Wniosek: PO >= PRZED w kazdej raportowanej turze => brak spadku >30%, PASS wg kryterium dispatchu.
BLOKADY: brak.
ZARZUTY: Evaluator: [] ; obrona: brak.
UWAGI (ODDAL, nie FAIL):
1. Surowe JSONL pomiaru lezaly w scratchpadzie operatora (poza repo, niedostepne FC) - liczb nie przeliczono z surowych wierszy; sprawdzono spojnosc JSON<->MD i logike analizatora (pokoj==='sojusz' && aiAi, nie status; zgodne z dispatchem).
2. Plik .json zawiera absolutne sciezki scratchpadu w polu `plik` (kosmetyka).
3. Pomiar: 2 ziarna, flagi dyplomacji OFF, tury 2-67; wznowienia Chromium z --disable-gpu (flagi renderu).
4. Tury >67 i flagi ON niezmierzone (poza zakresem).
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (dokumentacja/pomiar, bez deployu gry).
DEPLOY/PUSH: NIE WYKONANO
