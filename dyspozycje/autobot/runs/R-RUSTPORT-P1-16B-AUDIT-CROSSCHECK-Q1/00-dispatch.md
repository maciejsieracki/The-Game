STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1
GOAL: Uzupełnienie P1.16 — przejrzeć starsze dokumenty `dyspozycje/AUDYT-*.md` tego repo (z datami
2026-07-21 do 2026-08-13, m.in. `AUDYT-PARYTET-AI-2026-07-24.md`, `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md`,
`AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` i inne pasujące do wzorca `AUDYT-*.md` w
`dyspozycje/`), nieprzejrzane w pierwotnym P1.16, pod kątem opisanych błędów/edge case'ów istotnych
dla systemów gameplayu portowanych w P6 — ustalić, czy nadal aktualne na pinie main=edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Zrobić listę wszystkich plików `dyspozycje/AUDYT-*.md` (git ls-tree na main=edb8fb56), pominąć te już
rozpoznane w `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (BLAD-B0.*, BLEDY-DO-NAPRAWY-2026-07-05).
Dla KAŻDEGO pozostałego pliku AUDYT-*: jedno zdanie o czym jest, i dla opisanych w nim konkretnych
błędów/niespójności dotyczących systemów gameplayu (nie procesu/dokumentacji) — sprawdzić wprost na
pinie `edb8fb56`, czy nadal istnieją w kodzie (cytat + ścieżka+linia) czy zostały naprawione. Dopisać
wynik jako nową sekcję w `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (nie nadpisywać istniejącej
treści — dopisać na końcu, zachować oryginał z pierwotnego tematu).

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.16: każdy numer linii i cytat musi pochodzić z `git grep`/`git show edb8fb56` wykonanego w tej
rundzie, nie z treści dokumentu AUDYT ani z pamięci. Poprzednia runda tego wzorca (P1.16) miała 9/16
błędnych numerów linii mimo poprawnych cytatów — nie powtarzać tego błędu, zawsze przeliczać na pinie.

BINARNE KRYTERIUM SUKCESU
Plik `P1-16-EDGE-CASES.md` ma nową sekcję obejmującą WSZYSTKIE pliki `AUDYT-*.md` z `dyspozycje/`
nieujęte w pierwotnym P1.16, każdy błąd ma status (NADAL ISTNIEJE / NAPRAWIONY / NIEROZSTRZYGNIĘTY) z
dowodem zweryfikowanym w tej rundzie.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (tylko dopisanie nowej sekcji na
końcu, bez modyfikacji istniejącej treści z pierwotnego P1.16 — sprawdzić diffem przed zapisem),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1/**`. Odczyt: `dyspozycje/AUDYT-*.md` i
`gra/src/**` read-only (main edb8fb56). Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa. UWAGA: ten temat dotyka tego
samego pliku wynikowego (`P1-16-EDGE-CASES.md`) co zamknięty już temat P1.16 — ale P1.16 jest
zamknięty (PASS, brak aktywnego pisarza), więc nie ma kolizji współbieżnej. Mimo to: przed zapisem
odczytać bieżącą wersję pliku i dopisać, nie nadpisywać w całości.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 350 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
