STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-CYWILIZACJE-Q1
GOAL: Pełny, wyczerpujący audyt grupy CivPedii „Cywilizacje" (12 haseł) wobec `gra/data/civ-matrix.json`
na pinie edb8fb56. Decyzja właściciela (2026-10-21): pełny audyt.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 6 równoległych tematów kontynuujących `AUDYT-OPISY`. Każdy pisze do WŁASNEGO NOWEGO pliku —
bez kolizji. Przeczytaj `dyspozycje/rust-port/p1/P1-16D-OPISY-BOILERPLATE.md` §4 (Cywilizacje
„Strategia dla gracza" 9/9 identyczna — JUŻ ZAMKNIĘTE) i
`dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-B.md` (Rzymianie/Chińczycy bonusy — JUŻ ZAMKNIĘTE w
kontekście Poradnika, ale NIE w CivPedii — sprawdź wprost hasła CivPedii, nie zakładaj identyczności
z Poradnikiem).

ZADANIE
Dla KAŻDEJ z 9 cywilizacji (hasła CivPedii, nie licząc pozycji już zamkniętej „Strategia dla
gracza"): porównaj WSZYSTKIE podane bonusy liczbowe (ekonomiczne, militarne, kulturowe) z
`civ-matrix.json` na pinie, z uwzględnieniem kierunku (HARMFUL vs korzystny) i formuły (mul_proc
itd. — sprawdź semantykę w `civ-matrix-semantic.ts`). Status per bonus per cywilizacja.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz polegania na kierunku bonusu z samej nazwy pola — sprawdź formułę w kodzie (jak w P1.16d-
PORADNIK-B, gdzie „−20%" okazało się w rzeczywistości „+20%" przez HARMFUL/mul_proc).

BINARNE KRYTERIUM SUKCESU
Każdy bonus każdej z 9 cywilizacji ma status z dowodem w nowym pliku
`dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`, LUB jawna lista niedokończonych.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CYWILIZACJE.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-CYWILIZACJE-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych P1.16f. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
