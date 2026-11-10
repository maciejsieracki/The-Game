STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1
GOAL: Pełny, wyczerpujący audyt 32 haseł „Technologie" z `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`
wobec `gra/data/tech.json` na pinie edb8fb56. Decyzja właściciela (2026-10-21): pełny audyt.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 6 równoległych tematów kontynuujących `AUDYT-OPISY`. Każdy pisze do WŁASNEGO NOWEGO pliku —
bez kolizji. To największa pojedyncza grupa (32 hasła) — jeśli 5 rund nie starczy na wszystkie,
priorytetyzuj technologie odblokowujące budynki/jednostki z już znanymi rozjazdami ×5 (patrz
`P1-16D-OPISY-EKONOMIA5X.md`) jako najbardziej prawdopodobne źródło kolejnych błędów.

ZADANIE
Dla KAŻDEGO z 32 haseł Technologii w `wikiBundle.json`: porównaj epokę/koszt/efekty/odblokowania z
`gra/data/tech.json` na pinie. Status per hasło.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zbiorczego statusu. Jeśli 5 rund nie starczy na 32 hasła — jawna, kompletna lista
sprawdzonych vs niesprawdzonych identyfikatorów technologii (nie szacunek procentowy).

BINARNE KRYTERIUM SUKCESU
Każde z 32 haseł ma status z dowodem w nowym pliku `dyspozycje/rust-port/p1/P1-16F-TECHNOLOGIE.md`,
LUB jawna, kompletna lista niedokończonych z nazwami.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16F-TECHNOLOGIE.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-TECHNOLOGIE-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych P1.16f. Po 5 rundach: LIMIT-5-EXCEEDED — orkiestrator ocenia, czy potrzebny następca
dla reszty (ta grupa jest największa, więc najbardziej prawdopodobna kandydatka do podziału dalej).

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
