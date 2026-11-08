# Turniej: Mennica (`mennica`)

Kategoria: Pieniadz · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Waluta · definicja: `gra/data/buildings.json:901` · dzisiejszy top3: `:937`

Cena korzyści (nie jest kandydatem): budowa 28 Pracy, 30 drewno + 40 kamien, utrzymanie 2 złota/turę, zużywa 1 Złota na turę (zloto-access.ts:31, turn-economy.ts:1879-1894).

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | ×1,5 podatku w każdym mieście państwa | Mnoży podatek z handlu wszystkich miast przed podziałem na naukę, pieniądz i luksus (×1,62 łatwy, ×1,38 trudny); nie obejmuje tras. | 5 | 5 | 5 | 5 | 3 | 5 | 61 | gra/data/econ-params.json:585-591; gra/src/game/economy.ts:644-653; gra/src/game/economy.ts:952-955; gra/src/game/economy.ts:962-967 |
| b | own | +3 pieniądza w stolicy (5 w Żelazie) | Mały stały dochód stolicy. | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:901; gra/src/game/production.ts:252-271 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- budynek_mennica_mnoznik / waluta_mnoznik (parametry legacy) — Opis w econ-params: „nieużywany przez bieżący kod” — nie pokazywać jako efektu. [gra/data/econ-params.json:313-319; gra/data/econ-params.json:334-340]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 61:28.

## 4. Ranking

1. **a** — ×1,5 podatku w każdym mieście państwa — wygrane: 1, suma: 61
2. **b** — +3 pieniądza w stolicy (5 w Żelazie) — wygrane: 0, suma: 28

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **×1,5 podatku w każdym mieście państwa** — Mnoży podatek z handlu wszystkich miast przed podziałem na naukę, pieniądz i luksus (×1,62 łatwy, ×1,38 trudny); nie obejmuje tras.
- Top2: **+3 pieniądza w stolicy (5 w Żelazie)** — Mały stały dochód stolicy.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost dochodu” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga złota i Targowiska” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Walutę” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: ×1,5 podatku w każdym mieście państwa

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Mennicę w stolicy, aby pomnożyć podatek wszystkich miast ×1,5.

## 8. Uwagi

Realny współczynnik: econ-params.json:585-591 (easy 1,62 / normal 1,50 / hard 1,38), economy.ts:952-955 (handelNetto × mnożnik) przed podziałem suwakami (economy.ts:962-967). Warunki: Waluta + stolica + Targowisko w stolicy + dostęp do Złota. Dzisiejszy top3 nie wspomina o mnożniku.
