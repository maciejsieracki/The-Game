STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-UPKEEP-CERAMICS-ANALYSIS-Q1
GOAL: Audyt read-only: czy ceramika może być kosztem UTRZYMANIA budynków (BUILDING-UPKEEP-RESOURCES). Zero zmian kodu gry.
ZMIANY/COMMIT: tylko dyspozycje/autobot/runs/R-WEB-BUILDING-UPKEEP-CERAMICS-ANALYSIS-Q1/01-operator-r1.md + 02-kandydaci-utrzymanie-ceramika.csv. Baza: origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (5d7ff15e6). Commit: SHA w odpowiedzi orkiestratora (sprawdź `git log -1` na gałęzi roboczej).
TESTY: NIE_ZMIERZONO - symulacja przebiegu tury nie została uruchomiona (brak taniego harnessu dla salda ceramiki w czasie); wszystkie liczby poniżej to odczyt danych i kodu (stałe, JSON), nie pomiar.
BLOKADY: brak. Uwaga: dispatch wymienia „emporion” jako kandydata - w buildings.json (42 wpisy) takiego budynku nie ma. Palac nie ma pola koszt_surowce.
RUNDY: 1/5
NASTĘPNY KROK: ABC właściciela (wariant A/B/C z sekcji „Propozycje i pytania ABC”), potem ewentualnie dispatch implementacyjny po wyborze.
DEPLOY/PUSH: NIE WYKONANO

## 1. Stan dziś: gdzie ceramika jest produkowana, zużywana, utrzymywana

Źródła (gra/data, gra/src):

| Strumień | Wartość | Źródło |
|---|---|---|
| Produkcja: Garncarnia (Glina+Drewno -> Ceramika) | max 50 / 55 / 60 szt./turę (epoka 1 / 2 / 3), zależnie od glina i drewna | econ-params `budynek_garncarnia_przepustowosc` (50), `converterThroughputForEra` (+10% bazy za każdą epokę, `CONVERTER_ERA_SCALING_PCT = 0.10`) |
| Zużycie 1: Spichlerz I/II | 25 Ceramiki/turę, RAZ na imperium (nie per budynek) jeśli stoi choć jeden Spichlerz | `building-resource-gate.ts` `SPICHLERZ_DRAIN_CERAMIKA_PER_TURN = 25`, `spichlerzDrain` (deductBuildingStockCostAcrossCities wołane raz na ownera) |
| Zużycie 2: obywatele (epoka Brązu i Żelaza) | 1,0 Ceramiki na 1 obywatela/turę, `required = floor(populacja × 1,0)`, z magazynu państwa | `citizen-resource-upkeep.json` (lista kumulatywna: Brąz i Żelazo zawierają „ceramika”), `CITIZEN_UPKEEP_RATE_PER_CITIZEN = 1.0` w `citizen-resource-upkeep.ts` |
| Utrzymanie budynków w ceramice | 0 (dziś) | `buildingResourceUpkeep` (economy-upkeep.ts:681) bierze tylko klucze z `koszt_surowce`; żaden z 42 budynków nie ma `ceramika` w koszcie budowy (sprawdzone na buildings.json) |

Wniosek 1: ceramika NIE jest dziś kosztem budowy ani utrzymania żadnego budynku. Jej jedynymi konsumentami są obywatele (dominujący) i jednorazowy drenaż Spichlerza.

Wniosek 2 (skala, z kodu): jedna Garncarnia pokrywa ok. 50–60 obywateli na turę. Przy populacji 100 imperium potrzebuje ok. 100 Ceramiki/turę (+25 Spichlerz), czyli minimum dwóch Garncarni z pełną glina/drewnem. Saldo ceramiki jest strukturalnie ujemne przy rozwoju miast, zanim dojdzie jakikolwiek koszt utrzymania budynków. Ta liczba jest wynikiem arytmetyki na stałych, NIE pomiarem w grze (NIE_ZMIERZONO).

Wniosek 3 (kara): brak ceramiki dla obywateli = kara binarna per surowiec (szczęście -2 / „dostępny” +2 wg `citizen-resource-upkeep.json` `_kara`) oraz rozwój −1%. Deficyt utrzymania budynków wg mechanizmu UPKEEPRES ma analogiczne skutki.

## 2. Jak wygląda utrzymanie surowcowe budynków (BUILDING-UPKEEP-RESOURCES)

- Mechanizm istnieje: `buildingResourceUpkeep` (economy-upkeep.ts:681-700) daje płaskie 5 szt./turę na każdy TYP surowca z `koszt_surowce`, niezależnie od ilości (stała `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE = 5`).
- Zasięg obecny: drewno, kamień, cegła (dla budynków z tymi kosztami). Ceramika: brak.
- Zmiana kandydacka opisana w dispatchu (proporcjonalnie do `utrzymanie` Pieniądza, w surowcach kosztu budowy) przy DZISIEJSZYCH danych NIE dodaje ceramiki do żadnego budynku, bo ceramika nie jest w żadnym `koszt_surowce`. Aby ceramika weszła do utrzymania, potrzebna jest osobna decyzja: pole `utrzymanie_surowce` (np. `{ "ceramika": N }`) albo dodanie ceramiki do kosztów budowy wybranych budynków (to drugi, osobny ruch balansowy).

## 3. Kandydaci (pełna tabela: 02-kandydaci-utrzymanie-ceramika.csv)

Kryterium: tematyka (magazyn/spichlerz/woda/handel/łaźnia) + obecne `utrzymanie` Pieniądza (wartość 1:1 jak w regule UPKEEPRES). Proponowana wartość: `utrzymanie` z JSON, przyrost z `przyrostUtrzymania`.

| id | Pieniądz utr. | Propozycja ceramika (base) | Uwagi |
|---|---|---|---|
| spichlerz | 1 | 1 | już zużywa 25 Ceramiki/t: ryzyko podwójnego obciążenia |
| spichlerz_ii | 2 | 2 | j.w. (+ Sól); ryzyko podwójnego obciążenia |
| studnia | 1 | 1 | wczesny budynek, przed Garncarstwem: zakleszczenie |
| targowisko | 1 (prz. 1) | 1 | wczesny budynek, przed Garncarstwem: zakleszczenie |
| akwedukt | 2 (prz. 1) | 2 | epoka Kamienia/Brązu |
| laznia_publiczna | 2 (prz. 1) | 2 | epoka Żelaza (cegła w koszcie) |
| magazyn | 1 | 1 | |
| port | 2 (prz. 1) | 2 | |
| garncarnia | 1 | wykluczony | producent: zjadałby własny produkt |
| palac | 2 | brak | brak `koszt_surowce` w JSON |

Suma propozycji (base, bez przyrostu): 12 szt./turę = ok. 20–24% wydajności jednej Garncarni (50–60). Ta liczba nie zawiera obywateli.

Brak w buildings.json: „emporion” (wymieniony w dispatchu) - pominięty.

## 4. Ryzyka

1. Zakleszczenie wczesnej gry: Garncarstwo wymaga Rolnictwa + Łowiectwa + Obróbki drewna + Oswojenia (tech.json, „Wymaga (prereq)”) i jest późno w kolejce. Studnia/Targowisko/Akwedukt z ceramiką w utrzymaniu startowałyby z deficytem bez producenta. Wymagana bramka epokowa (np. ceramika tylko od epoki Brązu) albo wyłączenie wczesnych budynków.
2. Podwójne obciążenie Spichlerza (25/t stała + utrzymanie 1–2/t). Do rozstrzygnięcia: czy Spichlerz ma być wyłączony z kandydatów.
3. AI: `CONVERTER_FOR_RESOURCE` (ai.ts ~2040) NIE ma wpisu `['ceramika','garncarnia']`, więc AI nie podniesie priorytetu Garncarni, gdy zabraknie ceramiki. `UPSTREAM_FOR_PROCESSED_RESOURCE` ma ceramika->garncarnia (ai.ts:2407), więc część bodźca istnieje. Przy wariancie z utrzymaniem potrzebny wpis i test bramki.
4. Główne źródło presji to obywatele (1/os.), nie budynki. Dodanie 12/t do utrzymania przy saldzie ujemnym z samych obywateli nie zmienia kierunku problemu; to decyzja o stawce obywateli, nie o budynkach.
5. Dryf dokumentacji (do wiadomości, nie blokuje): komentarz w converters.ts mówi „Spichlerz 5 Ceramiki/turę”, kod ma 25; econ-params `budynek_spichlerz_zuzywa_ceramika` jest martwym kluczem (opisany w samym pliku); econ-params wspomina „39 budynków”, JSON ma 42.

## Propozycje i pytania ABC

Pytanie A (cel): czy ceramika ma wejść do utrzymania budynków, skoro dziś jest zerowa w kosztach budowy i głównym problemem jest drenaż obywateli?
- A (rekomendacja operatora) — NIE wprowadzać utrzymania ceramiką. Zamiast tego osobny temat audytu: saldo ceramiki na obywatela (stawka 1,0/os. w epokach 2–3 vs wydajność Garncarni 55–60) - ta decyzja należy do właściciela.
- B — utrzymanie ceramiką 1:1 z Pieniądzem dla 8 budynków (tabela z sekcji 3, suma 12/t), wyłącznie od epoki Brązu (bramka epokowa), bez Garncarni i z wpisem AI `ceramika->garncarnia`. Koszt: deficyt rośnie o 12/t przy populacji już ujemnej.
- C — jak B, ale tylko 4 budynki o najwyższym utrzymaniu i wyraźnie późnej epoce (Spichlerz II, Akwedukt, Łaźnia, Port; suma 8/t), bez Spichlerza I i wczesnych budynków. Najmniejsze ryzyko zakleszczenia, najmniejszy efekt.

Rekomendacja: A, a jeśli właściciel chce mechanizmu - C, po wcześniejszym rozstrzygnięciu stawki obywateli (osobne pytanie, bo to ona dominuje saldo).

Pytanie B (po A/B/C): czy Spichlerz (I/II) ma pozostać przy stałym drenażu 25/t, czy dostać dodatkowe utrzymanie? Rekomendacja: pozostawić drenaż, bez dodatkowego utrzymania.

NIE_ZMIERZONO: saldo w czasie (symulacja przebiegu tury z różną populacją i liczbą Garncarni), faktyczne wartości stanu magazynu ceramiki w zapisach gry.
