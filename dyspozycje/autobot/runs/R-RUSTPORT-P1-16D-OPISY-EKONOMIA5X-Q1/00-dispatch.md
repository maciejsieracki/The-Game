STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-EKONOMIA5X-Q1
GOAL: Domknąć z `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §2c, §2e, §3 (fragmenty)
pozycje NIEROZSTRZYGNIĘTE z `P1-16-EDGE-CASES.md` §9.5: rozjazd ekonomii ×5 dla pozostałych 10
haseł „Budynki" CivPedii oraz w `units.json`/`terrain-improvements.json`, literały poziomu trudności
„normal" w `cityPanel.ts`, wagi okolicy `{3,0.5,0.5}`, próg buntu „10%/2 tury (hard)", podział daniny
„batony 1/2/3", oraz liczba 27 paneli „ściąga" z 17 bez recenzji — status z dowodem na edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 5 równoległych następców P1.16b pokrywających AUDYT-OPISY (69 wierszy, podzielony na 5
niekolidujących kawałków, KAŻDY DO WŁASNEGO NOWEGO PLIKU). Przeczytaj źródło:
`dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §2c, §2e, §3 (całe), oraz
`dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.5 i §9.3 (Akademia jest już sprawdzona tam — NIE
powtarzaj jej, skup się na pozostałych 10 hasłach Budynki).

ZADANIE
1. Rozjazd ×5 (`R-EKONOMIA-SUROWCE-SKALA-5X-Q1`, commit `e401c1c2`): sprawdź pozostałe 10 haseł
   „Budynki" CivPedii (poza Akademią, już zamkniętą) w `wikiBundle.json` wobec `buildings.json`
   `koszt_surowce` na pinie. Sprawdź też czy `units.json` i `terrain-improvements.json` mają
   analogiczny rozjazd wiki vs dane.
2. `cityPanel.ts`: literały `"normal"` zaszyte na sztywno (szukaj po symbolu, nie liczbie linii z
   audytu — mogły się przesunąć).
3. §3: wagi okolicy `{3,0.5,0.5}`, próg buntu „10%/2 tury (hard)", podział daniny „batony 1/2/3" —
   każde sprawdź w kodzie/danych na pinie.
4. 27 paneli „ściąga": potwierdź aktualną liczbę i ile z nich ma recenzję (10 wg audytu) — czy to
   się zgadza na pinie (liczba plików/paneli mogła się zmienić).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przepisywania liczb/linii z audytu bez własnej weryfikacji na pinie.

BINARNE KRYTERIUM SUKCESU
Wszystkie 4 grupy pozycji mają status z dowodem w nowym pliku
`dyspozycje/rust-port/p1/P1-16D-OPISY-EKONOMIA5X.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16D-OPISY-EKONOMIA5X.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16D-OPISY-EKONOMIA5X-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56. NIE dotykaj `P1-16-EDGE-CASES.md` ani innych
plików `P1-16D-*` — inne równoległe tematy tam piszą.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
