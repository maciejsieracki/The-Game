# Turniej: Biblioteka (`biblioteka`)

Kategoria: Nauka · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Pismo · definicja: `gra/data/buildings.json:744` · dzisiejszy top3: `:791`

Cena korzyści (nie jest kandydatem): budowa 25 Pracy, 30 drewno + 30 kamien, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +30% Nauki miasta | Procentowa premia do całej nauki miasta (+37% łatwy, +23% trudny). | 4 | 3 | 4 | 2 | 4 | 5 | 46 | gra/data/econ-params.json:320-326; gra/src/game/economy.ts:979-982 |
| b | own | +3 Nauki i +2 Kultury (5 i 3 w Żelazie) | Płaski dodatek, rośnie z epoką. | 3 | 2 | 3 | 2 | 4 | 5 | 38 | gra/data/buildings.json:744; gra/src/game/production.ts:252-271 |
| c | own | Asymilacja kultury +2% na turę | Podbite miasto szybciej przyjmuje twoją kulturę. | 2 | 3 | 3 | 1 | 3 | 4 | 33 | gra/data/society-params.json:432-438; gra/src/game/culture-religion.ts:455; gra/src/game/conquest-stability.ts:63-72 |
| d | own | +1 Szczęścia w mieście | Ryczałt Szczęścia za budynek szczęściodajny. | 1 | 1 | 1 | 1 | 4 | 5 | 23 | gra/src/game/economy.ts:509-535 |
| e | next (R-B1) | Warunek Akademii i badania Filozofii | Bez Biblioteki nie zbudujesz Akademii (+20% Nauki) ani nie zbadasz Filozofii. | 4 | 0 | 5 | 2 | 1 | 4 | 32 | gra/src/game/building-resource-gate.ts:110-121; gra/data/tech.json:383; gra/src/game/research.ts:154-180 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- Obserwatorium (poziom 6, wymaga Astronomii) — maksPoziom Biblioteki = 2 — poziom 6 nieosiągalny; Astronomia nic nie odblokowuje. [gra/data/buildings.json:750; gra/data/buildings.json:797; gra/src/game/production.ts:252-271]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 46:38.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 46:33.
- a vs d → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 46:23.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 46:32.
- b vs c → **b** — przewaga w kryterium SKALA (3 vs 2), suma ważona 38:33.
- b vs d → **b** — przewaga w kryterium SKALA (3 vs 1), suma ważona 38:23.
- b vs e → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 38:32.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 33:23.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 33:32.
- d vs e → **e** — przewaga w kryterium SKALA (4 vs 1), suma ważona 32:23.

## 4. Ranking

1. **a** — +30% Nauki miasta — wygrane: 4, suma: 46
2. **b** — +3 Nauki i +2 Kultury (5 i 3 w Żelazie) — wygrane: 3, suma: 38
3. **c** — Asymilacja kultury +2% na turę — wygrane: 2, suma: 33
4. **e** — Warunek Akademii i badania Filozofii — wygrane: 1, suma: 32
5. **d** — +1 Szczęścia w mieście — wygrane: 0, suma: 23

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+30% Nauki miasta** — Procentowa premia do całej nauki miasta (+37% łatwy, +23% trudny).
- Top2: **+3 Nauki i +2 Kultury (5 i 3 w Żelazie)** — Płaski dodatek, rośnie z epoką.
- Top3: **Asymilacja kultury +2% na turę** — Podbite miasto szybciej przyjmuje twoją kulturę.
- Top4: **Warunek Akademii i badania Filozofii** — Bez Biblioteki nie zbudujesz Akademii (+20% Nauki) ani nie zbadasz Filozofii.
- Top5: **+1 Szczęścia w mieście** — Ryczałt Szczęścia za budynek szczęściodajny.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Nauki” → ZACHOWANE (w nowym TOP 5)
- 2. „Wzrost Kultury” → ZACHOWANE (w nowym TOP 5)
- 3. „Otwiera Pismo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +30% Nauki miasta
- DODANE: Asymilacja kultury +2% na turę
- DODANE: Warunek Akademii i badania Filozofii
- DODANE: +1 Szczęścia w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Bibliotekę, aby zwiększyć Naukę miasta o 30%.
- Zbuduj obok Akademię (Filozofia), aby zwiększyć Naukę miasta o kolejne 20%.

## 8. Uwagi

Dzisiejszy top3 pomija +30% Nauki. Pozycja 3 to wymaganie technologii.
