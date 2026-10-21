STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-POJECIA-Q1
GOAL: Pełny, wyczerpujący audyt grupy CivPedii „Pojęcia/Miasto/Nauka/Ekonomia" (10 haseł) wobec kodu
i danych gry na pinie edb8fb56. Decyzja właściciela (2026-10-21): pełny audyt.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 6 równoległych tematów kontynuujących `AUDYT-OPISY`. Każdy pisze do WŁASNEGO NOWEGO pliku —
bez kolizji. Przeczytaj `dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` §5 — Zamożność i
Garnizon JUŻ CZĘŚCIOWO SPRAWDZONE tam (Zamożność: przestarzała formuła w kartach UI; Garnizon:
rozjazd wiki 60/60/4 vs dane 30/30/2) — NIE powtarzaj identycznej pracy, ale ZWERYFIKUJ czy te
dwa hasła CivPedii (nie karty UI) mają też rozjazd, i rozszerz na pozostałe ~8 haseł tej grupy
(np. Prawo/Porządek, Szczęście, Handel, Nauka — znajdź dokładną listę 10 haseł przez
`wikiBundle.json` kategorię na pinie).

ZADANIE
Dla KAŻDEGO z 10 haseł „pojęciowych" (mechanizmy systemowe, nie budynki/jednostki): zidentyfikuj
WSZYSTKIE konkretne liczby/formuły podane w opisie i porównaj z kodem (`gra/src/game/*.ts`) i danymi
(`gra/data/*.json`) na pinie. Status per twierdzenie liczbowe w haśle.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz oceny „wygląda OK" bez wskazania konkretnej liczby i jej odpowiednika w kodzie.

BINARNE KRYTERIUM SUKCESU
Każde z 10 haseł ma listę twierdzeń ze statusem i dowodem w nowym pliku
`dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-POJECIA.md`, LUB jawna lista niedokończonych.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-POJECIA.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-POJECIA-Q1/**`. Odczyt: `dyspozycje/**`
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
