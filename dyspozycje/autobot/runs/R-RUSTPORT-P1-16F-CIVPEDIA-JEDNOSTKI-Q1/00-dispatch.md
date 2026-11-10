STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-JEDNOSTKI-Q1
GOAL: Pełny, wyczerpujący audyt grupy CivPedii „Jednostki" (51 haseł z `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §5) wobec `gra/data/units.json` na pinie edb8fb56. Decyzja właściciela (2026-10-21): pełny audyt, nie próbka.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 6 równoległych tematów kontynuujących `AUDYT-OPISY` po DECISION_REQUIRED w
`R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1` (zbyt szeroki zakres — patrz
`03-orchestrator-disposition.md` tamtego tematu). Każdy z 6 tematów pisze do WŁASNEGO NOWEGO pliku —
bez kolizji, w pełni równolegle. Przeczytaj `dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md`
§1-§2 dla metody (już zamknięte grupy: Akademia, Karawanseraj, Targowisko, Lazaret, Budynki — NIE
powtarzaj ich).

ZADANIE
Dla KAŻDEGO z 51 haseł jednostek w `wikiBundle.json` (kategoria „Jednostki"): porównaj wszystkie
podane liczby (koszt budowy, utrzymanie, staty bojowe, wymagania technologii/epoki) z
`gra/data/units.json` na pinie. Status NADAL ISTNIEJE (rozjazd potwierdzony) / NAPRAWIONY (zgodne) /
NIEROZSTRZYGNIĘTY (nie dało się jednoznacznie porównać — np. brak pola w jednym źródle) per hasło.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zbiorczego statusu dla grupy. Jeśli 5 rund nie starczy na 51 haseł — jasno powiedz ile
faktycznie sprawdzono, z listą sprawdzonych i niesprawdzonych identyfikatorów, nie zgaduj reszty.

BINARNE KRYTERIUM SUKCESU
Każde z 51 haseł ma wiersz ze statusem i dowodem (plik:linia / pole JSON) w nowym pliku
`dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md`, LUB — jeśli czasu nie starczy — jawna lista
„sprawdzono X z 51, pozostałe NIEROZSTRZYGNIĘTE z braku czasu" z identyfikatorami.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-JEDNOSTKI.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16F-CIVPEDIA-JEDNOSTKI-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje konkretny defekt, Operator poprawia tą samą rundą (Obrona) albo rundą N+1. Po 5
rundach: LIMIT-5-EXCEEDED → orkiestrator ocenia czy kontynuować kolejnym następcą.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być dłuższy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
