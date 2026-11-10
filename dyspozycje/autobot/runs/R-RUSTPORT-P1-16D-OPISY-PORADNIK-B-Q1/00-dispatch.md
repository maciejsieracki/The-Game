STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-PORADNIK-B-Q1
GOAL: Przeglądnąć treść rozdziałów Poradnika `14,15,16` (nieprzeliczone) oraz domknąć konkretne
pozycje NIEROZSTRZYGNIĘTE z `P1-16-EDGE-CASES.md` §9.5 dla rozdziałów `03,06,11,12,13,17,28,57,91`
(już częściowo sprawdzonych — TYLKO te wymienione pozycje, nie cały rozdział od nowa) — status z
dowodem na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 5 równoległych następców P1.16b pokrywających AUDYT-OPISY. Przeczytaj
`dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.5 (tabela — znajdź tam dokładne sformułowania
poniższych pozycji) oraz `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` dla kontekstu, jeśli
potrzebny.

ZADANIE
A) Przeczytaj TREŚĆ GŁÓWNĄ rozdziałów 14, 15, 16 (pomijając boilerplate) i sprawdź twierdzenia
   liczbowe/mechaniczne wobec pinu — jak w P1-16D-OPISY-PORADNIK-A (ten sam standard: pozycje, nie
   zbiorczy status rozdziału).
B) Domknij te konkretne pozycje z §9.5 (NIE cały rozdział, tylko te twierdzenia):
   - rozdz. 06 tabela §35.3: pomylone kolumny trudności, SzMax 12/18/24.
   - rozdz. 11: „mur 5+3/poziom" (zweryfikuj w `docs/PORADNIK-GRACZA/11-oblezanie.md` wprost, nie
     tylko przez grep w kodzie).
   - rozdz. 13: Rzymianie „+35% odnowy" / kary Chińczyków.
   - rozdz. 12: próg Handlu „Relacja ≥ 40".
   - rozdz. 17: boks „Skrót Spacja=Wykonaj" (samosprzeczny z własną treścią wg audytu — potwierdź).
   - rozdz. 28: „Kopalnia" (usunięta mechanika?), „Bydło".
   - rozdz. 57: 47/47 „Moc w polu" w prozie (duży zakres — przelicz systematycznie, nie próbkowo).
   - rozdz. 91: Posąg Peruna (epoka).

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.16D-PORADNIK-A: konkretne liczby i ich odpowiedniki w kodzie/danych, nie oceny ogólne.

BINARNE KRYTERIUM SUKCESU
Rozdziały 14/15/16 mają listę twierdzeń ze statusem; WSZYSTKIE 8 pozycji z listy B mają status z
dowodem — w nowym pliku `dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-B.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16D-OPISY-PORADNIK-B.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16D-OPISY-PORADNIK-B-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
