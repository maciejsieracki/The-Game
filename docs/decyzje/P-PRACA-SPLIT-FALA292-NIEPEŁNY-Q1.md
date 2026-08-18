# P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1 — ECHO i kontrakt

**Data:** 2026-08-17
**Źródło:** zgłoszenie właściciela po ROBOCZEJ FALI 292 (`90b6508d`), porównanie z FALĄ 291 (`13b771f4`).

## ECHO

W FALI 292 obecność `splitEmpirePracaBudget()` nie oznaczała pełnego wdrożenia
kontraktu. Helper ograniczał budżet przekazywany pickerowi ulepszeń, ale produkcja
budynków nadal była liczona niezależnie przez per-miasto `splitPraca()`.
Zarejestrowano niepełne wdrożenie/regresję pod nowym ID, bez kasowania historii
`R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1` ani
`P-PRACA-BUDYNKI-ULEPSZENIA-SPLIT-50-Q1`.

## Kontrakt obowiązujący

1. Cała pula Pracy imperium stanowi 100% budżetu.
2. Użytkownik wybiera udział Pracy przeznaczony na ulepszenia terenu.
3. Ulepszenia mogą dostać maksymalnie 50% całej puli.
4. Pozostała część tej samej puli jest dostępna dla budynków.
5. Limit 50% nie jest limitem wewnętrznego automatu ulepszeń.
6. Gracz i AI korzystają z analogicznego podziału.
7. Kolejka budynków, overflow, wiele miast i override per miasto nie mogą
   pozwolić na przekroczenie wspólnego podziału ani zgubienie niewykorzystanej Pracy.
8. Stare zapisy zachowują kompatybilność; wartości poza nowym capem są bezpiecznie
   ograniczane.

## Korekta semantyki UI — ECHO właściciela 2026-08-18

Historyczny budżet automatycznego rozdysponowania Pracy pozostaje bez zmian:
zakres `pracaAutoPercent` wynosi **0–100%**. Ten parametr opisuje wewnętrzny
budżet automatu ulepszeń i nie jest nadrzędnym podziałem całej Pracy.

Nowy limit **maksymalnie 50% na ulepszenia** ma być egzekwowany wyłącznie
w nadrzędnym podziale w zakładce **Praca**. Zakresy kontrolek są odrębne:
**Budynki = 0–100%**, **Ulepszenia = 0–50%**. Nie wolno wyprowadzać jednego
zakresu jako dopełnienia drugiego ani przenosić limitu 50% do budżetu automatu.
Lokalny suwak „Budynki / Ulepszenia” musi odzwierciedlać tę rozdzielność.
Nie zmieniać zakresu ani semantyki suwaka budżetu automatycznych ulepszeń.

## Zakres implementacji

Tylko routing Pracy budynki↔ulepszenia i testy/docs: gracz, AI, kolejka,
overflow, wiele miast, override per miasto, stare save oraz test mutacyjny.
Bez zmian bundla, deployu, merge ani push.
