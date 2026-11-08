# Turniej: Warsztat oblężniczy (`warsztat_oblezniczy`)

Kategoria: Wojsko · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Oblężnictwo · definicja: `gra/data/buildings.json:1596` · dzisiejszy top3: `:1638`

Cena korzyści (nie jest kandydatem): budowa 65 Pracy, 50 drewno + 50 kamien, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +10% parametrów jednostek (z Koszarami +30%) | Trzecia warstwa ścieżki parametrów — sumuje się z Koszarami i Akademią wojskową (maks. +50%). | 3 | 3 | 4 | 3 | 2 | 5 | 41 | gra/data/buildings.json:1596; gra/src/game/unit-building-bonuses.ts:23-33; gra/src/game/unit-building-bonuses.ts:179-184 |
| b | own | +4 Pracy i +2 pieniądza w mieście | Drobny dochód miasta. | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:1596 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „Odblokowuje Katapultę w tym mieście” — Flaga maWarsztatOblezniczy to REZERWA (cities.ts:845) — production.ts jej nie sprawdza; Katapulta wymaga tylko technologii, żelaza i Koszar. [gra/data/buildings.json:1631; gra/src/game/cities.ts:843-850; gra/src/game/production.ts:1068-1076]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:28.

## 4. Ranking

1. **a** — +10% parametrów jednostek (z Koszarami +30%) — wygrane: 1, suma: 41
2. **b** — +4 Pracy i +2 pieniądza w mieście — wygrane: 0, suma: 28

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+10% parametrów jednostek (z Koszarami +30%)** — Trzecia warstwa ścieżki parametrów — sumuje się z Koszarami i Akademią wojskową (maks. +50%).
- Top2: **+4 Pracy i +2 pieniądza w mieście** — Drobny dochód miasta.

## 6. Porównanie z dzisiejszym top3

- 1. „Odblokowuje Katapultę” → USUNIĘTE — efekt martwy/nieprawdziwy
- 2. „Wzmocnienie jednostek” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga Koszar” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +4 Pracy i +2 pieniądza w mieście

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Warsztat oblężniczy, aby wzmocnić jednostki o kolejne +10%.

## 8. Uwagi

Pozycja 1 dzisiejszego top3 jest NIEPRAWDZIWA (efekt martwy). Pozycja 3 to warunek.
