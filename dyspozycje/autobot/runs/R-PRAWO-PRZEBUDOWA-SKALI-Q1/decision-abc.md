# R-PRAWO-PRZEBUDOWA-SKALI-Q1 — decision-abc (runda 1, Operator)

Konflikt czysto inżynierski, BEZ wpływu na gameplay/UX (lekka ścieżka, C-018) — jedna
propozycja, nie pełny turniej ABC.

## Konflikt: D5 (usunięcie pól kar) vs zakaz dotykania `gra/src/main.ts`

D5 każe usunąć `prawo_kara_brak_garnizonu` i `prawo_kara_podboj_bez_garnizonu` "ze wszystkich
miejsc użycia w kodzie", co obejmuje pola `LawBreakdownInput.brakGarnizonuKara` i
`.conquestNoGarrisonPenalty` w `society-breakdown.ts`. `gra/src/main.ts:29212-29213` konstruuje
literał obiektu przekazywany do `evaluateOrderFromBreakdown` i jawnie ustawia oba te pola —
usunięcie ich z interfejsu złamałoby `tsc --noEmit` (kontrola nadmiarowych właściwości) w
pliku, którego allowlista tego tematu bezwzględnie zakazuje dotykać.

**Rozwiązanie zastosowane (zgodne z istniejącym precedensem w TYM SAMYM pliku):**
`conquest-stability.ts` już rozwiązuje identyczny konflikt dla `conquestUnstableHappinessPenalty`
(kara Szczęścia usunięta przez inny temat, main.ts wciąż ją woła) — funkcja zostaje, zwraca
zawsze `0`, `@deprecated` z komentarzem "do usunięcia razem z main.ts, gdy będzie wolny".
Zastosowałem dokładnie ten wzorzec:
- `conquestNoGarrisonLawPenalty` — zwraca teraz zawsze `0`, `@deprecated`.
- `LawBreakdownInput.brakGarnizonuKara` / `.conquestNoGarrisonPenalty` — zostają w typie,
  oznaczone `@deprecated`, ale `computeLawBreakdown` **w ogóle ich nie czyta** (kod usunięty
  całkowicie, nie tylko dane) — funkcjonalnie kara jest usunięta na 100%, pole jest tylko
  martwym przelotowym parametrem wymuszonym przez zakaz dotykania main.ts.
- Kryterium końca 2 (grep zero trafień dla samych KLUCZY `prawo_kara_brak_garnizonu` /
  `prawo_kara_podboj_bez_garnizonu`) spełnione dosłownie — te stringi nie występują nigdzie
  poza dokumentacją/komentarzami wyjaśniającymi usunięcie. Dowód funkcjonalny (nie tylko
  tekstowy) w `gra/tools/prawo-przebudowa-skali-test.cjs` sekcja 3g: wskrzeszenie kluczy w
  klonie danych nie zmienia wyniku silnika.

Brak wpływu na balans/UX: obie ścieżki (pole całkiem usunięte vs. pole nieczytane) dają
IDENTYCZNE zachowanie w grze. Właściwe czyszczenie main.ts to osobny, drobny temat.

## Znalezisko: tabela "P" (ilu obywateli epoka umie rządzić) w 00-dispatch.md/BALANS

Kryterium 3b każe policzyć `P = 2 + ln(budynki/prawMax)/ln(1,04)` samodzielnie z danych i
zgłosić rozbieżność zamiast dopasowywać test do tabeli właściciela. Tabela normal (9,2/8,8/11,0)
zgadza się z przeliczeniem co do 0,02. Tabele easy (12,6/13,1/14,2) i hard (6,2/5,2/6,9) **nie
zgadzają się** — bo zakładają tę samą sumę budynków 53/85/121 na każdej trudności, podczas gdy
realne budynki administracyjne (Dom Starszyzny/Dwór Zarządcy/Pretorium/Trybunał/Sąd) mają
WŁASNE wartości per trudność (istniejące od `R-PRAWO-SIATKA-V2`, poza allowlistą tego tematu).
Realne sumy: easy 61/100/144, hard 47/74/107 → realne P: easy 16,16/17,24/18,63, hard
3,11/1,66/3,73. `prawo_max_epoka` samo (kryterium 1/3a) jest mimo to DOKŁADNIE liczbą
właściciela — rozbieżność dotyczy WYŁĄCZNIE pomocniczej tabeli P z dokumentacji, nie parametru
w `society-params.json`. Własność D3b (ciąg rosnący epoka2→epoka3) trzyma się na wszystkich
trzech trudnościach mimo tej rozbieżności (17,24<18,63; 8,84<11,00; 1,66<3,73).

Test (`prawo-przebudowa-skali-test.cjs` sekcja 3b) asercjuje wartości PRZELICZONE (realne), nie
tabelę z dispatchu — zgodnie z jego własną instrukcją. Nie zmieniałem żadnej liczby w
`society-params.json` na podstawie tego znaleziska (Tryb pierwszy).

**Nie wymaga decyzji przed zamknięciem tematu** — obie sprawy nie blokują żadnego z sześciu
binarnych kryteriów końca. Zapisane dla świadomości właściciela/orkiestratora, nie jako
przeszkoda.
