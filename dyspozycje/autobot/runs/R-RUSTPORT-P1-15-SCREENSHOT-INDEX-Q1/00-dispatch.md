STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-15-SCREENSHOT-INDEX-Q1
GOAL: P1.15 z PLAN-PORT-RUST-TAURI-20261020.md §4 — indeks zrzutów referencyjnych zebranych w P1.3-9.
CZĘŚCIOWY na tym etapie: P1.6, P1.7, P1.8, P1.9 mogą być jeszcze w toku — ten temat indeksuje to, co
JUŻ ISTNIEJE w `dyspozycje/rust-port/p1/screenshots/`, jawnie oznaczając braki, nie czekając na resztę.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeszukać `dyspozycje/rust-port/p1/screenshots/` (lista plików, rozmiar, wymiary PNG) i powiązane
pliki `.md` tematów P1.3-P1.9 (ile już istnieją — sprawdzić `dyspozycje/rust-port/p1/P1-{3,4,5,6,7,8,9}-*.md`).
Zapisać w `dyspozycje/rust-port/p1/P1-15-SCREENSHOT-INDEX.md`: tabelę każdego zrzutu (nazwa pliku,
rozmiar, wymiary, z którego tematu/ekranu pochodzi, jedno zdanie co pokazuje — na podstawie opisu w
odpowiednim pliku `.md`, nie zgadywania), oraz jawną listę "braki" — które z ekranów P1.3-P1.9 NIE
MAJĄ jeszcze zrzutu w momencie tej rundy (bo ich temat jeszcze trwa).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz wymyślania opisu zrzutu, którego plik nie istnieje. Zakaz twierdzenia "P1.X zamknięty"/"zrzut
istnieje" bez realnego sprawdzenia w tej rundzie (`ls`, `file` na PNG).

BINARNE KRYTERIUM SUKCESU
Plik istnieje, każdy PLIK PNG istniejący w `screenshots/` w momencie tej rundy ma wiersz w tabeli,
lista braków (tematy P1.3-9 bez zrzutu) jest jawna i kompletna względem stanu na tę rundę.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-15-SCREENSHOT-INDEX.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-15-SCREENSHOT-INDEX-Q1/**`. Odczyt:
`dyspozycje/rust-port/p1/**` (cały katalog, read-only). Zero zapisu poza allowlistą — W SZCZEGÓLNOŚCI
zero modyfikacji plików `.md`/`.png` innych tematów (niektóre mogą być aktywnie zapisywane przez
równolegle działające tematy — tylko odczyt).

IZOLACJA
Czysta praca odczytowa na już istniejących plikach w repo — nie wymaga nowego checkoutu/worktree.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
