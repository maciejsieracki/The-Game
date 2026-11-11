STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CURRENCY-MULT-PER-CIV-Q1
GOAL: mnoznik Efektu 1 (Waluta+Mennica) per cywilizacja (macierz + korekta trudnosci, minimum 1,38), wiki/teksty dla gracza zgodne z silnikiem.

# Obrona (runda 2/5) — start od 8ad10c70a

## Zarzut 1 (sredni) — nieaktualne teksty dla gracza podaja globalny mnoznik: PRZYJMUJE
Poprawki (zrodla + regeneracja generatorami, nie reczna edycja wygenerowanych JSON):
- docs/encyklopedia/pojecia/suwak-handlu.md:55 — zamiast x1,62/x1,50/x1,38: mnoznik cywilizacji z macierzy (np. Grecy x2,3 normal), korekta trudnosci +-0,5, minimum x1,38; wikiBundle.json zregenerowany (bundle-wiki-for-game.cjs).
- gra/tools/gen-tech-cards-top5.zdania.json -> gra/data/tech-cards-top5.json (generator): karta Waluta Top1 "Mennica: podatek x1,38 lub wiecej (zaleznie od cywilizacji)", liczba x1,38; CMZ "mnoznikiem swojej cywilizacji, min. x1,38".
- gra/tools/gen-building-cards-top5.korekty.json -> gra/data/building-cards-top5.json (generator): karta Mennicy (tytul/zdanie/CMZ) i CMZ Targowiska ("Zbuduj w stolicy Mennice").
- gra/data/econ-params.json opisy (linie ~339 i ~625): globalne easy 1,62/normal 1,50/hard 1,38 oznaczone jako tylko fallback.
- Testy zsynchronizowane swiadomie: tech-cards-top5-test.cjs (2 asercje x1,50 -> x1,38/per civ), building-cards-top5-test.cjs (1 asercja).
- Zarzut 3 (kosmetyka): komentarz src/game/civ-matrix-semantic.ts:96 zaktualizowany (per civ + trudnosc, min 1,38, globalne = fallback).

## Zarzut 2 — brak testu zapis/wczytanie: PRZYJMUJE
Dodano sekcje 4d w gra/tools/currency-mult-per-civ-test.cjs: 3 civ x 3 trudnosci — zapis miasta nie zawiera pola mnoznika, round-trip JSON bez zmian, cityYieldPerTurn po wczytaniu == przed zapisem, mnoznik po wczytaniu == przed. Wynik: 200 passed, 0 failed (bylo 164).
NIE_ZMIERZONO nadal: vite build (zakaz npm run build) i weryfikacja wizualna cityPanel.

## Zarzut 3 — regeneracja hasel cywilizacji, 9 z 15 hasel: ODRZUCAM w czesci merytorycznej, PRZYJMUJE kosmetyke
- Brak hasel dla harappa/hetyci/slowianie/babilonia/asyria/fenicjanie to stan bazowy (a8b063989): `ls docs/encyklopedia/cywilizacje` = 9 plikow; zalozenie hasel dla 6 civ wykracza poza allowliste tematu (tresc nowych hasel to osobny temat, decyzja produktowa). Silnik ma wartosci dla wszystkich 15 civ (test 15x3 w currency-mult-per-civ-test, w tym Fenicjanie 3,1/2,6/2,1).
- Odstepstwo "generator nieaktualny" jest weryfikowalne: `node tools/gen-building-cards-top5.cjs --check` jest czerwony takze na kandydacie bez moich zmian i na bazie (po wymuszonym checkout 8ad10c70a tych plikow: "NIEZGODNY z generatorem"); generator kart budynkow wygenerowalby dodatkowo zmiane Cegielni (tytul/zdanie 50/75/100 cykli) niezwiazana z tematem — tej zmiany NIE wprowadzilem (przywrocone linie z kandydata), bo main ma juz korekte "FALA 642: Cegielnia w wejsciach generatora"; po merge z main --check wroci do zielonego.
- Kosmetyka (komentarz civ-matrix-semantic.ts) naprawiona jak w zarzucie 1.

## TESTY (surowe wyjscie, gra/, po zmianach)
- tsc --noEmit: exit 0, 0 bledow
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- currency-mult-per-civ 200/0; civ-matrix-meta-roster-wiring 63/0
- ids-leak-audit 1648 ok/0 FAIL; wonder-text-no-raw-ids 132 ok/0; pr141-matrix-only-data-wiki OK (15 civ, 9 stron)
- tech-cards-top5 595/0; building-cards-top5 1206 pass / 1 fail ([A] --check, dlug bazowy opisany wyzej)
- waluta-mennica 61/0; mennica-uspienie 49/0; hud-skarbiec 34/0; empire-skarbiec-bilans 11/0; converters 49/0; upkeep-difficulty-per-owner 19/0; praca-pula-rate-parity 20/0; ai-purchase-maintenance-reserve 56/0
- Dlug bazowy (nie moj, identyczny na bazie wg Evaluatora): mennica-magazyn 34/7, culture-religion 63/2, pr141-matrix-only-economy — nie ruszane.

ZMIANY/COMMIT: 11 plikow (allowlista: docs suwak-handlu.md, wikiBundle.json, econ-params.json opisy, civ-matrix-semantic.ts komentarz, tech/building cards data + zrodla generatorow, 2 testy kart, currency-mult-per-civ-test.cjs, ten raport). SHA koncowy w polu sha.
BLOKADY: brak (poza NIE_ZMIERZONO: vite build, wizualna weryfikacja).
RUNDY: 2/5 (obrona do Evaluatora r2)
NASTEPNY KROK: Evaluator/Final Control; przy integracji merge z main (regeneracja wikiBundle i kart budynkow generatorem po FALA 642). Dlug Rust: REPIN (tylko opis; rust-port nietkniety).
DEPLOY/PUSH: NIE WYKONANO
