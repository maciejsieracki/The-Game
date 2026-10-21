STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-CUDA-Q1
GOAL: Pełny, wyczerpujący audyt grupy CivPedii „Cuda świata" (20 haseł) wobec `gra/data/wonders.json`
i `gra/src/game/wonders-data.ts` na pinie edb8fb56. Decyzja właściciela (2026-10-21): pełny audyt.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 6 równoległych tematów kontynuujących `AUDYT-OPISY`. Każdy pisze do WŁASNEGO NOWEGO pliku —
bez kolizji. Przeczytaj `dyspozycje/rust-port/p1/P1-16D-OPISY-BOILERPLATE.md` §2 — pozycja „Cuda
×3 plony" (19/19 kart, sprzeczna z danymi, bonus FLAT) jest JUŻ ZAMKNIĘTA tam, NIE powtarzaj jej dla
tych samych 19/20 kart — skup się na POZOSTAŁYCH polach opisu (koszt, utrzymanie, wymagania,
unikalność).

ZADANIE
Dla KAŻDEJO z 20 haseł Cudów w `wikiBundle.json`: porównaj WSZYSTKIE pola poza już zamkniętym
bonusem „×3 plony" (koszt budowy, utrzymanie, wymagana technologia/epoka, unikalność/limit) z
`wonders.json` na pinie. Status per hasło.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zbiorczego statusu. Jeśli 5 rund nie starczy — jawna lista sprawdzonych/niesprawdzonych.

BINARNE KRYTERIUM SUKCESU
Każde z 20 haseł ma status z dowodem w nowym pliku `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CUDA.md`
(dla pól poza bonusem „×3 plony", już zamkniętym gdzie indziej), LUB jawna lista niedokończonych.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CUDA.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-CUDA-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych P1.16f. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
