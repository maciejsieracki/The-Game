# Turniej: Odlewnia żelaza (`odlewnia_zelaza`)

Kategoria: Produkcja · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Hutnictwo żelaza · definicja: `gra/data/buildings.json:204` · dzisiejszy top3: `:240`

Cena korzyści (nie jest kandydatem): budowa 35 Pracy, 40 drewno + 50 cegla, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Wytapia żelazo: do 50 sztuk na turę (i nadal brąz) | Zamienia rudę żelaza i drewno w żelazo dla wojska epoki Żelaza, a obok dalej wytapia brąz. | 4 | 5 | 5 | 5 | 3 | 4 | 57 | gra/src/game/converters.ts:13; gra/src/game/converters.ts:98-99; gra/data/econ-params.json:369-375 |
| b | own | +12 Pracy i +1 pieniądza w mieście | Dwa razy więcej Pracy niż Odlewnia brązu. | 3 | 1 | 2 | 2 | 4 | 5 | 33 | gra/data/buildings.json:204 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „Krok ku Wielkiej odlewni” — Wielka odlewnia ma epokaWejscia=4 — dziś niedostępna. [gra/data/buildings.json:253; gra/src/game/production.ts:966]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 57:33.

## 4. Ranking

1. **a** — Wytapia żelazo: do 50 sztuk na turę (i nadal brąz) — wygrane: 1, suma: 57
2. **b** — +12 Pracy i +1 pieniądza w mieście — wygrane: 0, suma: 33

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Wytapia żelazo: do 50 sztuk na turę (i nadal brąz)** — Zamienia rudę żelaza i drewno w żelazo dla wojska epoki Żelaza, a obok dalej wytapia brąz.
- Top2: **+12 Pracy i +1 pieniądza w mieście** — Dwa razy więcej Pracy niż Odlewnia brązu.

## 6. Porównanie z dzisiejszym top3

- 1. „Wysoka Praca” → ZACHOWANE (w nowym TOP 5)
- 2. „Dwa surowce naraz” → ZACHOWANE (w nowym TOP 5)
- 3. „Krok ku Wielkiej odlewni” → USUNIĘTE — efekt martwy/nieprawdziwy

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Odlewnię brązu do Odlewni żelaza, aby wytwarzać żelazo dla wojska epoki Żelaza.

## 8. Uwagi

—
