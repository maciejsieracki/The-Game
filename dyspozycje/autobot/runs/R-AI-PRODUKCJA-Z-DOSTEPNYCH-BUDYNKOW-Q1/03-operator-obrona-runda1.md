# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Operator, Obrona rundy 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów.

## Odpowiedzi na zarzuty (1-7)

**#1 PRZYJMUJE, z dowodem, poprawka częściowa.** Zweryfikowałem niezależnie: `ai.ts:1745-1755`
(`CONVERTER_FOR_RESOURCE`/`CONVERTER_ALTERNATIVES`) i `ai.ts:2103-2113`
(`AI_BUILDING_FOR_DEFICIT`) rzeczywiście wykonują `candidates.push({ id: <literał>, ... })`
(l.1772, l.2146) — realne, nowe źródło kandydata, nie modyfikacja istniejącego wyniku.
8 unikalnych id poza już zgłoszonymi 5: `cegielnia`, `odlewnia_brazu`, `odlewnia_zelaza`,
`wielka_odlewnia` (konwertery) + `stolarnia`, `garncarnia`, `kamieniarski`, `kuznia`
(deficyt). Mój raport rundy 1 przedstawił listę 5 jako kompletną — to było błędne, koryguję.
**DECISION_REQUIRED #4 (nowy):** eliminacja wymaga pola w `buildings.json` (np.
`konwertujeSurowiec`/`produkujeSurowiec`), bo dziś katalog nie ma structured pola
"co ten budynek wytwarza" (tylko `koszt_surowce` = co zużywa). Zmiana danych jest poza
dzisiejszą allowlistą (`gra/data/**` zakazane, temat nie-balansowy). Bez decyzji właściciela
o rozszerzeniu allowlisty/schematu, te 8 literałów zostają jako udokumentowany wyjątek
analogiczny do already-zgłoszonych 5.

**#2 PRZYJMUJE, poprawka częściowa.** Symulacja 150 tur PRZED/PO w pełnym silniku gry
(main.ts, ekonomia, prawPct/szPct) nie mieści się w tej rundzie — wymaga albo Vite+Chromium
(rząd dziesiątek minut, jak `ai-buduje-budynki-test.cjs`, patrz #7) albo osobnego harnessu
ekonomii poza allowlistą. Dostarczam w tej rundzie **proxy-symulację** (esbuild, bez
Vite/Chromium, wołająca `chooseCityProduction` bezpośrednio z realnym `buildings.json`) —
patrz tabela sekwencji niżej. Nie liczy `prawPct`/`szPct` (wymaga pełnej gospodarki/prawa,
poza zakresem szkicu). Kryterium 4 **pozostaje formalnie niespełnione** — eskaluję do
Final Control/właściciela: albo osobny temat na harness ekonomii, albo węższa definicja
dowodu.

**#3 PRZYJMUJE, poprawka wykonana.** (a) Usunąłem fałszywy odnośnik w komentarzu kodu
(`ai.ts` ok. l.1289) do nieistniejącej "tabeli PRZED/PO" — zastąpiony jawnym stwierdzeniem,
że kryteria 3/4 nie są jeszcze dostarczone (diff w ZMIANY/COMMIT). (b) Dostarczam ślad
z proxy-symulacji zamiast prozy — patrz tabela niżej. **Rozbieżność wobec mojego wcześniejszego
zdania „Studnia jest pierwsza":** w tym śladzie pierwszy jest `koszary`, Studnia druga —
zgłaszam rozbieżność zamiast dopasowywać wynik (reguła, tryb czwarty). Priorytet Spichlerza
nadal się nie odtwarza w 150-turowym oknie (DECISION_REQUIRED #3 z rundy 1, bez zmian).

**#4 PRZYJMUJE bez poprawki (stan faktyczny, nie defekt raportu).** 39/42, DECISION_REQUIRED
#2, bez decyzji właściciela kryterium 2 pozostaje formalnie niespełnione — zgodne z moim
raportem rundy 1, nic do skorygowania.

**#5 PRZYJMUJE bez poprawki (stan faktyczny).** 5 literałów fortyfikacja/koszary/nauka
poprawnie ujawnione jako DECISION_REQUIRED #1 — teraz rozszerzone przez #1 wyżej o kolejne 8.
Kryterium 1 formalnie niespełnione do decyzji właściciela (jeden łączny DECISION_REQUIRED
#1, patrz wyżej).

**#6 PRZYJMUJE bez poprawki (stan faktyczny).** DECISION_REQUIRED #3 (Spichlerz) poprawnie
zgłoszone rundę 1, potwierdzone teraz śladem z proxy-symulacji (#3 wyżej) zamiast tylko prozą.

**#7 PRZYJMUJE, dowód częściowy.** Uruchomiłem `ai-buduje-budynki-test.cjs` w tle na starcie
tej rundy: 3× `vite build` (fix/mut-a/mut-b) + Chromium. Po >15 min wciąż w toku (mut-b),
proces przeniesiony w tle przez harness — **potwierdza niezależnie** twierdzenie Evaluatora,
że test nie kończy się w rozsądnym oknie jednej rundy. Nie jest to regresja mojej zmiany
(test nie dotyka `chooseCityProduction` wg grepu, potwierdzone też przez Evaluatora) — to
istniejące ograniczenie infrastruktury testowej, już nazwane w dispatchu. Wynik pozostaje
niezweryfikowany w tej rundzie; eskaluję jako blokadę proceduralną, nie merytoryczną.

## Tabela pokrycia (bez zmian od rundy 1, potwierdzona przez Evaluatora)

| Zakres | Wynik |
|---|---|
| Major AI, pełny katalog | 39 / 42 (brak: mury, fort, baszta — DECISION_REQUIRED #2) |
| Miasto-państwo (defensiveCopy) | 42 / 42 |
| Katalog łącznie (z danych) | 42 |

## Tabela symulacji (proxy, esbuild, bez Vite/Chromium — NIE pełny silnik, patrz #2/#3)

Miasto solo `c1` (populacja 4), dwa miasta-sąsiedzi wyprowadzone z fazy startowej
(`built2`/`built3` = koszary/mury/spichlerz/stolarnia), 150 tur, budynek "dojrzewa"
`max(3, kosztBudowy/4)` tur (proxy, nie realny koszt produkcji):

| # | Tura wyboru | Budynek | Grupa |
|---|---|---|---|
| 1 | 1 | koszary | Wojsko i obrona |
| 2 | 7 | studnia | Zdrowie |
| 3 | 11 | akwedukt | Zdrowie |
| 4 | 19 | laznia_publiczna | Zdrowie |
| 5 | 32 | stolarnia | Produkcja surowców |
| 6 | 37 | kamieniarski | Produkcja surowców |
| 7 | 42 | garncarnia | Produkcja surowców |
| 8 | 47 | cegielnia | Produkcja surowców |

Po 150 turach: 8 budynków. Spichlerz nie wchodzi w oknie — potwierdza DECISION_REQUIRED #3.
`prawPct`/`szPct` NIE liczone (poza zakresem proxy) — kryterium 4 pozostaje otwarte.

## ZMIANY/COMMIT

`gra/src/game/ai.ts` — wyłącznie poprawka komentarza (usunięcie fałszywego odnośnika do
nieistniejącej tabeli PRZED/PO, ok. l.1289), zero zmian logiki. `tsc --noEmit`: zielone
(potwierdzone ponownie po edycji). Skrypt pomocniczy `sim150.cjs` (proxy-symulacja, dowód
w tym raporcie) napisany i uruchomiony w scratchpadzie sesji, POZA repo — nie jest częścią
allowlisty jako nowy plik `ai-*.cjs`, więc nie commituję go do `gra/tools/`.

## BLOKADY

DECISION_REQUIRED #1 (rozszerzony o 8 nowych literałów), #2, #3 — bez zmian merytorycznych,
czekają na właściciela. NOWY DECISION_REQUIRED #4 — schemat `buildings.json` dla
konwerterów/deficytu, poza dzisiejszą allowlistą. Kryterium 4 (prawPct/szPct) niedostarczone —
wymaga albo pełnego silnika (Vite/Chromium, ograniczenie czasowe jak #7) albo osobnego
tematu na harness ekonomii. Kryterium 9 (`ai-buduje-budynki-test.cjs`) niezweryfikowane —
potwierdzone niezależnie jako niekończące się w oknie rundy.

RUNDY: 1/5
NASTĘPNY KROK: Final Control / właściciel — rozstrzygnięcie DECISION_REQUIRED #1 (z 13
literałami łącznie), #2, #3, #4; decyzja co do sposobu dostarczenia kryterium 4 (pełny
silnik vs. proxy vs. osobny temat); dokończenie `ai-buduje-budynki-test.cjs` poza oknem
czasowym tej rundy.
DEPLOY/PUSH: NIE WYKONANO
