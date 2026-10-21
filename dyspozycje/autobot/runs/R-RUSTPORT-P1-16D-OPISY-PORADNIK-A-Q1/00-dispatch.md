STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-PORADNIK-A-Q1
GOAL: Przeglądnąć treść rozdziałów Poradnika `00,01,02,04,05,08,09,10` (`docs/PORADNIK-GRACZA/*.md`)
pod kątem rozjazdu z aktualnym kodem/danymi na pinie edb8fb56 — te rozdziały NIE były jeszcze
przeliczone w żadnym poprzednim temacie P1.16/P1.16b.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 5 równoległych następców P1.16b pokrywających AUDYT-OPISY. Przeczytaj
`dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §1 (streszczenie — metodologia i typy
błędów: rozjazd aktualności, boilerplate) i §4 (lista rozdziałów) dla kontekstu metody, ale NIE licz
na jego konkretne liczby dla tych rozdziałów — on ich nie przeliczał per rozdział szczegółowo poza
ogólną tabelą boilerplate (§2a, pokrywa inny temat równoległy).

ZADANIE
Dla KAŻDEGO z 8 rozdziałów (`docs/PORADNIK-GRACZA/00-*.md` … `10-*.md` — znajdź dokładne nazwy
plików przez `git ls-tree` na pinie) przeczytaj TREŚĆ GŁÓWNĄ (pomijając boilerplate
„Przykład liczbowy/Strategia gracza/Typowe błędy" — to pokrywa inny równoległy temat) i sprawdź
każde konkretne twierdzenie o liczbach/mechanice wobec `gra/data/*.json` i `gra/src/game/*.ts` na
pinie. Dla KAŻDEGO rozdziału: status NADAL ISTNIEJE (rozjazd potwierdzony) / NAPRAWIONY (treść
zgadza się z pinem) / NIEROZSTRZYGNIĘTY (nie dało się jednoznacznie zweryfikować) dla KAŻDEGO
konkretnego znalezionego twierdzenia liczbowego/mechanicznego — nie oceniaj całego rozdziału jednym
zbiorczym statusem, wypisz pozycje.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz ocena „wygląda OK" bez wskazania konkretnej liczby/mechaniki i jej odpowiednika w kodzie/
danych. Jeśli rozdział nie zawiera żadnych weryfikowalnych twierdzeń liczbowych (czysto opisowy) —
zapisz to wprost jako „brak weryfikowalnych twierdzeń", nie NIEROZSTRZYGNIĘTY.

BINARNE KRYTERIUM SUKCESU
Każdy z 8 rozdziałów ma sekcję w nowym pliku `dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-A.md`
z listą znalezionych twierdzeń i ich statusem (albo jawną notatką braku twierdzeń).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-A.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16D-OPISY-PORADNIK-A-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być dłuższy, raport w czacie jest skrótem).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
