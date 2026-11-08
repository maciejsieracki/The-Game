# Turniej: Cegielnia (`cegielnia`)

Kategoria: Produkcja · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Garncarstwo · definicja: `gra/data/buildings.json:601` · dzisiejszy top3: `:637`

Cena korzyści (nie jest kandydatem): budowa 22 Pracy, 30 drewno + 30 kamien, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +25% Pracy z terenu miasta | Pola obrabiane przez miasto dają o jedną czwartą więcej Pracy (+31% łatwy, +19% trudny). | 4 | 2 | 4 | 2 | 4 | 5 | 43 | gra/data/econ-params.json:271-277; gra/src/game/economy.ts:863-866 |
| b | own | Wytwarza cegłę: 50 cykli × 2 cegły na turę | Zamienia 2 gliny i 1 drewno w 2 cegły; od epoki Brązu +50% bazy na epokę — cegła buduje budynki epoki Żelaza. | 3 | 4 | 5 | 5 | 3 | 3 | 50 | gra/src/game/converters.ts:11; gra/src/game/converters.ts:84; gra/data/econ-params.json:355-361 |
| c | next (R-B1) | Warunek badania Pisma i Religii | Bez Cegielni w państwie nie zbadasz Pisma (Biblioteka) ani Religii (Świątynia). | 4 | 0 | 5 | 5 | 1 | 4 | 38 | gra/data/tech.json:200; gra/data/tech.json:214; gra/src/game/research.ts:154-180 |
| d | own | +4 Pracy w mieście (6 w Żelazie) | Daje miastu 4 Pracy, w epoce Żelaza 6. | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:601; gra/src/game/production.ts:252-271 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 50:43.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 43:38.
- a vs d → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 43:30.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 50:38.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 50:30.
- c vs d → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 38:30.

## 4. Ranking

1. **b** — Wytwarza cegłę: 50 cykli × 2 cegły na turę — wygrane: 3, suma: 50
2. **a** — +25% Pracy z terenu miasta — wygrane: 2, suma: 43
3. **c** — Warunek badania Pisma i Religii — wygrane: 1, suma: 38
4. **d** — +4 Pracy w mieście (6 w Żelazie) — wygrane: 0, suma: 30

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Wytwarza cegłę: 50 cykli × 2 cegły na turę** — Zamienia 2 gliny i 1 drewno w 2 cegły; od epoki Brązu +50% bazy na epokę — cegła buduje budynki epoki Żelaza.
- Top2: **+25% Pracy z terenu miasta** — Pola obrabiane przez miasto dają o jedną czwartą więcej Pracy (+31% łatwy, +19% trudny).
- Top3: **Warunek badania Pisma i Religii** — Bez Cegielni w państwie nie zbadasz Pisma (Biblioteka) ani Religii (Świątynia).
- Top4: **+4 Pracy w mieście (6 w Żelazie)** — Daje miastu 4 Pracy, w epoce Żelaza 6.

## 6. Porównanie z dzisiejszym top3

- 1. „Wzrost Pracy” → ZACHOWANE (w nowym TOP 5)
- 2. „Wytapia cegłę” → ZACHOWANE (w nowym TOP 5)
- 3. „Brama do Pisma” → ZACHOWANE (w nowym TOP 5)
- DODANE: +25% Pracy z terenu miasta

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Cegielnię, aby wytwarzać cegłę na budynki epoki Żelaza.

## 8. Uwagi

Dzisiejszy top3 pomija +25% Pracy z terenu (econ-params.json:271). epokaWejscia=2 przy technologii z epoki Kamienia (production.ts:966) — budowa dopiero od Brązu.
