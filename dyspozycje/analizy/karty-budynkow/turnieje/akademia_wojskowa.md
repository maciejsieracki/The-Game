# Turniej: Akademia wojskowa (`akademia_wojskowa`)

Kategoria: Wojsko · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Sztuka wojenna · definicja: `gra/data/buildings.json:2082` · dzisiejszy top3: `:2123`

Cena korzyści (nie jest kandydatem): budowa 80 Pracy, 50 drewno + 70 cegla, utrzymanie 4 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +20% parametrów jednostek (z Koszarami +40%) | Sumuje się z Koszarami wprost; z Warsztatem oblężniczym razem +50%. | 4 | 3 | 4 | 3 | 3 | 5 | 46 | gra/data/buildings.json:2082; gra/src/game/unit-building-bonuses.ts:23-33; gra/src/game/unit-building-bonuses.ts:179-184 |
| b | own | +3 Pracy i +2 pieniądza w mieście | Drobny dochód miasta. | 1 | 1 | 1 | 2 | 3 | 5 | 23 | gra/data/buildings.json:2082 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „bramka elit UNITS” (uwagi) — production.ts nie ma bramki akademia_wojskowa dla jednostek (grep) — nie pokazywać. [gra/data/buildings.json:2082; gra/src/game/production.ts:1068-1076]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 46:23.

## 4. Ranking

1. **a** — +20% parametrów jednostek (z Koszarami +40%) — wygrane: 1, suma: 46
2. **b** — +3 Pracy i +2 pieniądza w mieście — wygrane: 0, suma: 23

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+20% parametrów jednostek (z Koszarami +40%)** — Sumuje się z Koszarami wprost; z Warsztatem oblężniczym razem +50%.
- Top2: **+3 Pracy i +2 pieniądza w mieście** — Drobny dochód miasta.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzmocnienie jednostek” → ZACHOWANE (w nowym TOP 5)
- 2. „Dodatkowa produkcja” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga Koszar” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Akademię wojskową, aby wzmocnić jednostki o kolejne +20%.

## 8. Uwagi

Pozycja 3 dzisiejszego top3 to warunek.
