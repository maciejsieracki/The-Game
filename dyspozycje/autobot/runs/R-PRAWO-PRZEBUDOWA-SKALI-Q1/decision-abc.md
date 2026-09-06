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

## DECISION_REQUIRED (obrona runda 1, zarzut Evaluatora #1): `hasGarnizonBudynek` NIE ustawione w main.ts

Potwierdzone: `main.ts:29179-29215` (wywołanie `evaluateOrderFromBreakdown` w realnej,
per-turowej ścieżce) buduje drugi argument (`LawBreakdownInput`) i ustawia `hasDomStarszyzny`,
`hasDworZarzadcy`, `hasPretorium`, `hasTrybunal`, `hasSad`, `palacTier`, `garnizonCount` — ale
**NIE** ustawia `hasGarnizonBudynek`. Pole jest opcjonalne (`?:boolean`), więc `tsc --noEmit`
tego nie łapie (brak własności nadmiarowej — to jest brak własności WYMAGANEJ, których TS nie
wymusza dla pól opcjonalnych). Skutek zmierzony (nie hipotetyczny): w rzeczywistej rozgrywce
**żadne miasto nie dostaje bonusu +25/35/47 z budynku Garnizon do Prawa** — silnik liczy tak,
jakby `hasGarnizonBudynek` zawsze było `false`/`undefined`. To jest inne pole niż
`brakGarnizonuKara`/`conquestNoGarrisonPenalty` (sekcja wyżej, ABC z rundy 1) — tamte są
MARTWYMI polami usuniętej kary (main.ts je woła, silnik ich nie czyta, brak wpływu na
gameplay); `hasGarnizonBudynek` jest ŻYWYM polem NOWEGO bonusu tego tematu, którego main.ts
w ogóle nie woła — silnik by go użył, gdyby dostał `true`.

**Dlaczego to nie zostało złapane w rundzie 1:** raport Operatora rundy 1 sprawdził parytet
panel↔silnik WYŁĄCZNIE przez zbudowany harness `cityPanel.ts` (sekcja 3i) — a `cityPanel.ts`
JEST na allowliście i JEST poprawiony (`hasGarnizonBudynek: builtIds.includes('garnizon')`,
linia 3150). Test 3i nigdy nie dotykał `main.ts`, więc rozjazd panel↔silnik-per-turę pozostał
niewidoczny — gracz w panelu miasta widzi poprawny bonus (podgląd), ale silnik gry (rebelia,
`revoltGrace`, `shouldTriggerRebellion`) liczy bez niego.

**Naprawa zablokowana allowlistą:** `gra/src/main.ts` jest na liście "Zakazane bezwzględnie"
tego tematu — jedyna poprawka (dodanie `hasGarnizonBudynek: builtIds.includes('garnizon'),`
przy linii 29211, analogicznie do `cityPanel.ts:3150`) wymaga dotknięcia tego pliku.
**Nie poprawiam samodzielnie poza allowlistą (Tryb pierwszy w duchu — to nie jest liczba
właściciela, ale to jest ta sama zasada: nie naginam granic tematu, żeby "ładnie domknąć").**

**DECISION_REQUIRED dla orkiestratora/właściciela:** ten temat (`R-PRAWO-PRZEBUDOWA-SKALI-Q1`)
NIE MOŻE być uznany za w pełni funkcjonalnie zamknięty, dopóki `main.ts:29211` nie dostanie
jednej linii `hasGarnizonBudynek: builtIds.includes('garnizon'),`. Rekomendacja: albo (a)
osobny, bardzo mały temat/patch na main.ts z dedykowaną allowlistą jednolinijkową, integrowany
NATYCHMIAST po tym temacie (zanim ktokolwiek przetestuje bunt w realnej rozgrywce), albo (b)
świadome rozszerzenie allowlisty tego tematu o dokładnie tę jedną linię, za zgodą właściciela.
Do czasu tej decyzji: kryteria końca 1-6 tego tematu (skala, dane, testy, tsc, bramki
referencyjne, rodzina Prawa) SĄ spełnione — ale kalibracja 53/85/121 (D3, zakładająca budynek
Garnizon jako filar) jest **nieobecna w realnej rozgrywce** aż do tej poprawki.

## Znalezisko (zarzut Evaluatora #2): dwa martwe bundle-artefakty + dodatkowe pliki HTML z literałami usuniętych kluczy kar

Pełny grep repo (`grep -rn "prawo_kara_brak_garnizonu\|prawo_kara_podboj_bez_garnizonu" .`)
ujawnia, poza źródłem/dokumentacją/dispatchem: `gra/tools/.pt-layout-bundle.cjs:6494`,
`gra/tools/.diag-playtest-bundle.cjs:8202` (wskazane przez Evaluatora) ORAZ dodatkowo
`Gra-podglad-POLE-BITWY.html`, `Gra-FINALNA.html`, `gra/Gra-podglad-POLE-BITWY.html`,
`docs/archiwum-ux/Gra-podglad-*_TOPBAR-2026-06-26.html` (×2), `...OKOLICA-UX_PRE-IKONY...html`
— wszystkie to **zbudowane snapshoty JS/bundle sprzed tego tematu** (najnowszy ostatnio
zmieniony w commicie `546f6a51`, część jeszcze wcześniej), żaden nie jest importowany/wołany
przez jakikolwiek aktywny plik źródłowy ani bramkę (`grep` po nazwach tych dwóch bundli w
`gra/tools/*.cjs` i `package.json` — zero trafień poza samymi sobą). Żaden z tych plików jest
na allowliście tego tematu. Kryterium końca 2, odczytane dosłownie ("nie występują w całym
repo poza dokumentacją i dispatchem"), **nie jest w 100% spełnione** — te martwe artefakty
literalnie zawierają stringi kluczy. Funkcjonalnie (żaden kod ich nie czyta) kryterium jest
spełnione. **DECISION_REQUIRED (drugorzędne, nie blokujące):** orkiestrator decyduje, czy
autoryzować osobne sprzątanie tych martwych plików (poza zakresem allowlisty tego tematu) —
nie poprawiam ich samodzielnie tutaj.
