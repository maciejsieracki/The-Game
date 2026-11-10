STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-BOILERPLATE-Q1
GOAL: Domknąć z `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §2a/§2b pozycje
pozostawione NIEROZSTRZYGNIĘTE w `P1-16-EDGE-CASES.md` §9.5: boilerplate „Przykład liczbowy/
Strategia/Typowe błędy" w 22 rozdziałach Poradnika (liczebność/trafność), Cuda świata „×3 plony w
mieście wzniesienia" (19 kart), Jednostki identyczny „Countery i taktyka", Cywilizacje identyczna
„Strategia dla gracza" (9/9) — status z dowodem na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 5 równoległych następców `R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1` pokrywających
`AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` (69 wierszy danych źródłowych, zbyt duży zakres
na jeden temat — podzielony na 5 niekolidujących kawałków, KAŻDY DO WŁASNEGO NOWEGO PLIKU, żeby móc
iść równolegle). Przeczytaj źródło: `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`
§2a, §2b (całe). Przeczytaj też `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.5 dla kontekstu
(te pozycje tam są oznaczone NIEROZSTRZYGNIĘTY — NIE edytuj tego pliku, on jest poza Twoją
allowlistą).

ZADANIE
Dla KAŻDEJ z 4 pozycji sprawdź stan na pinie edb8fb56 i nadaj status NADAL ISTNIEJE / NAPRAWIONY /
NIEROZSTRZYGNIĘTY z dowodem (`git show`/`git grep`, plik:linia):
1. Boilerplate: zweryfikuj tabelę liczebności z §2a audytu (wystąpienia per rozdział) dla
   WSZYSTKICH 22 rozdziałów `docs/PORADNIK-GRACZA/*.md` — czy liczby się zgadzają na pinie, czy nie.
2. Cuda świata „×3 plony w mieście wzniesienia": sprawdź czy fraza występuje w 19 kartach
   `wikiBundle.json` i czy jest zgodna z danymi `wonders.json`.
3. Jednostki „Countery i taktyka": sprawdź czy tekst jest identyczny (boilerplate) we wszystkich
   wpisach jednostek w `wikiBundle.json`.
4. Cywilizacje „Strategia dla gracza": sprawdź czy 9/9 cywilizacji ma identyczny tekst.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przepisywania liczb z audytu bez własnego przeliczenia na pinie — audyt może być nieaktualny
(np. liczba rozdziałów/kart mogła się zmienić).

BINARNE KRYTERIUM SUKCESU
Wszystkie 4 pozycje mają status z dowodem w nowym pliku `dyspozycje/rust-port/p1/P1-16D-OPISY-BOILERPLATE.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16D-OPISY-BOILERPLATE.md` (NOWY plik, utwórz go),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16D-OPISY-BOILERPLATE-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56 (git show/git grep, bez checkout/build/dev).
NIE dotykaj `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` — inne równoległe tematy tam piszą.

IZOLACJA
Czysta praca odczytowa + nowy plik .md. Brak izolacji worktree potrzebnej.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
