STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-PORADNIK-B-Q1
GOAL: Przegląd treści głównej rozdz. 14, 15, 16 Poradnika oraz status 8 pozycji listy B z §9.5 (rozdz. 06, 11, 12, 13, 17, 28, 57, 91) na pinie edb8fb56, z dowodem.
ZMIANY/COMMIT: nowy plik dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-B.md (allowlista); ten plik 01-operator.md; brak commitów, brak push/deploy. gra/** nietknięte.
TESTY: weryfikacja przez git show edb8fb56:<ścieżka> oraz odczyt gra/data/*.json i gra/src/**/*.ts na pinie. Lista B: 8/8 pozycji ma status z dowodem (B1 NIEZGODNE, B2 NIEZGODNE, B3 CZĘŚCIOWO, B4 CZĘŚCIOWO, B5 NIEZGODNE, B6 NIEZGODNE, B7 NIEZGODNE: 48 z 49 wierszy, B8 NIEZGODNE). Część A: rozdz. 14/15/16, wiersze ZGODNE/NIEZGODNE/NIEROZSTRZYGNIONY opisane w pliku docelowym. Nie uruchomiono npm/cargo.
BLOKADY: brak. Nierozstrzygnięte wiersze części A mają powód w pliku docelowym (głównie brak sprawdzenia w tej rundzie). Rozbieżność wewnątrz kodu (society-breakdown.ts:751 vs komentarz G12) przekazana Evaluatorowi.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Haiku 5.5 medium) — adwersaryjna kontrola B1 (d), B3 (kierunek -20% budynków), B7 (metoda dopasowania nazw) oraz sprawdzenie, czy NIEROZSTRZYGNIONY w części A nie ukrywa rozjazdu.
DEPLOY/PUSH: NIE WYKONANO


---

## Runda 2/5 — OBRONA (odpowiedź na zarzuty Evaluatora)

OBRONA: 1 -> PRZYJMUJE. B3 Rzymianie „−20% kosztu budynków": status NIEZGODNE (kierunek). Dowód: `civ-matrix.json` Rzymianie `prod_koszt_budynku_proc = 0.2`; `paramDefs` formula `mul_proc`; `_meta.formula_mul_proc = "wynik = baza * (1 + wartosc)"` → koszt ×1,2. Nota: brak konsumenta runtime.

OBRONA: 2 -> PRZYJMUJE. B1(d): kara nieobecna (G12, `society-breakdown.ts:748–750`; `szczescie_kara_wielkosc_miasta` tylko w komentarzu). Odczyt `szczescie_prog_zagęszczenia` (l.751) zasila `legacyMale` przez `szczescie_male_miasto_bonus` = bonus, nie kara. Status NIEZGODNE.

OBRONA: 3 -> PRZYJMUJE. B4: „próg +20" występuje 7 razy (l.57, 92, 147, 197, 258, 293, 367), nie 5. Status CZĘŚCIOWO bez zmian.

OBRONA: 4 -> PRZYJMUJE. Dodano wiersz B-x: Rzymianie „−5% korupcji" = NIEZGODNE; `civ-matrix.json` Rzymianie `eko_korupcja_proc = 0`; poradnik rozdz. 12 l.328–329, rozdz. 13 l.74–75, 125–126, 235–236, 272–273, 319–320.

OBRONA: 5 -> PRZYJMUJE. B7: zakres stosunku poprawiony: 0,37 (Rydwan konny 40/108; Rydwan Shang 43/116) – 0,90 (Łucznik egipski 13,5/15). Skrypt: 50 wierszy, 49 dopasowanych po `Jednostka`, 1 zgodny (Miecznik galijski 1,0), 48 niezgodnych, Kusznik brak.

OBRONA: 6 -> PRZYJMUJE (zakres jawny). Dowód dodany dla §97.4 (`victory.ts:219, 226, 235` — zwroty tylko `winner: gracz`; status NIEZGODNE w `victory.ts`). Pozostałe NIEROZSTRZYGNIONY wypisane z identyfikatorami jako zakres R2 w sekcji „Zastrzeżenia" pliku docelowego (tempo foundingów, throttle AI, §88.1, Próg(N), §91.3, §93 Świątynia/konwersja, §94.0, §96.1–96.3, §97.3, §99). Nie rozstrzygnięto ich w tej rundzie — nie podaję dowodu, którego nie zebrałem.

Zmiany w tej rundzie: plik docelowy `dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-B.md` (poprawki B1(d), B3, B4, B7, §97.4, wiersz B-x, sekcja zastrzeżeń). `gra/**` nietknięte. Brak commitów. `git diff --check` na pliku docelowym: czysto.

STATUS: PASS-WITH-NOTES
RUNDY: 2/5
NASTĘPNY KROK: Evaluator — kontrola poprawek (B1(d), B3, B4, B7, §97.4, B-x); R2 zakres części A wymaga osobnego tematu lub kolejnej rundy.
DEPLOY/PUSH: NIE WYKONANO
