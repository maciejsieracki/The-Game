# Turniej: Spichlerz (`spichlerz`)

Kategoria: Zywnosc · Epoka wejścia: Kamień · maksPoziom: 1 · technologia: Garncarstwo · definicja: `gra/data/buildings.json:458` · dzisiejszy top3: `:494`

Cena korzyści (nie jest kandydatem): budowa 20 Pracy, 40 drewno, utrzymanie 1 złota/turę, zużywa 25 Ceramiki na turę (econ-params.json:390-396, building-resource-gate.ts:335).

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Limit ludności miasta 5 → 8 | Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców. | 5 | 4 | 4 | 2 | 4 | 5 | 52 | gra/data/econ-params.json:24-37; gra/src/game/economy.ts:1053 |
| b | own | +1000 pojemności spichlerza państwa | Każdy Spichlerz zwiększa centralny zapas żywności państwa o 1000 (×2 na epokę). | 3 | 3 | 4 | 5 | 4 | 4 | 48 | gra/src/game/empire-food.ts:175-192; gra/src/game/building-resource-gate.ts:548 |
| c | own | Po wzroście miasto zachowuje 50% zapasu żywności | Bez Spichlerza zapas wzrostu zeruje się po każdym nowym mieszkańcu. | 3 | 3 | 5 | 2 | 3 | 4 | 42 | gra/data/econ-params.json:10-16; gra/src/game/economy.ts:1099; gra/src/game/economy.ts:1152 |
| d | own | +2 żywności i +5 Szczęścia w mieście | Najwyższy ryczałt Szczęścia wśród budynków Kamienia. | 3 | 1 | 2 | 2 | 4 | 5 | 33 | gra/data/buildings.json:458; gra/src/game/economy.ts:509-535 |
| e | next (R-B1) | Rozbudowa do Spichlerza Królewskiego: limit 12 | Po Piśmie i z dostępem do soli limit ludności rośnie do 12. | 4 | 0 | 3 | 2 | 1 | 5 | 29 | gra/data/buildings.json:505; gra/data/econ-params.json:38-44 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- „pojemność zapasów armii 100 na Spichlerz” — Klucz spichlerz_pojemnosc_zapasow_panstwa nie ma konsumenta w gra/src (grep) — nie pokazywać. [gra/data/econ-params.json:171-177]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:48.
- a vs c → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:42.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 52:33.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 52:29.
- b vs c → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:42.
- b vs d → **b** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:33.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 48:29.
- c vs d → **c** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 42:33.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 42:29.
- d vs e → **d** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:29.

## 4. Ranking

1. **a** — Limit ludności miasta 5 → 8 — wygrane: 4, suma: 52
2. **b** — +1000 pojemności spichlerza państwa — wygrane: 3, suma: 48
3. **c** — Po wzroście miasto zachowuje 50% zapasu żywności — wygrane: 2, suma: 42
4. **d** — +2 żywności i +5 Szczęścia w mieście — wygrane: 1, suma: 33
5. **e** — Rozbudowa do Spichlerza Królewskiego: limit 12 — wygrane: 0, suma: 29

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Limit ludności miasta 5 → 8** — Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców.
- Top2: **+1000 pojemności spichlerza państwa** — Każdy Spichlerz zwiększa centralny zapas żywności państwa o 1000 (×2 na epokę).
- Top3: **Po wzroście miasto zachowuje 50% zapasu żywności** — Bez Spichlerza zapas wzrostu zeruje się po każdym nowym mieszkańcu.
- Top4: **+2 żywności i +5 Szczęścia w mieście** — Najwyższy ryczałt Szczęścia wśród budynków Kamienia.
- Top5: **Rozbudowa do Spichlerza Królewskiego: limit 12** — Po Piśmie i z dostępem do soli limit ludności rośnie do 12.

## 6. Porównanie z dzisiejszym top3

- 1. „Żywność i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga ceramiki” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Podnosi limit populacji” → ZACHOWANE (w nowym TOP 5)
- DODANE: +1000 pojemności spichlerza państwa
- DODANE: Po wzroście miasto zachowuje 50% zapasu żywności
- DODANE: Rozbudowa do Spichlerza Królewskiego: limit 12

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Spichlerz, aby podnieść limit ludności miasta z 5 do 8.
- Rozbuduj go do Spichlerza Królewskiego (Pismo, sól), aby podnieść limit ludności miasta z 8 do 12.

## 8. Uwagi

Pole przyrost martwe (maksPoziom=1). Pozycja 3 dzisiejszego top3 mówi o limicie ludności bez liczby.
