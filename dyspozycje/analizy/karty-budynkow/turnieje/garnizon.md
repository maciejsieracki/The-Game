# Turniej: Garnizon (`garnizon`)

Kategoria: Administracja · Epoka wejścia: Kamień · maksPoziom: 1 · technologia: - · definicja: `gra/data/buildings.json:1986` · dzisiejszy top3: `:2027`

Cena korzyści (nie jest kandydatem): budowa 30 Pracy, 30 drewno, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Milicja: 1 obrońca na mieszkańca przy ataku | Przy każdym ataku na miasto staje milicja w liczbie mieszkańców (połowa wręcz, połowa dystans), odnawia się po 5 turach. | 4 | 5 | 5 | 2 | 3 | 3 | 50 | gra/data/combat-params.json:51-58; gra/src/game/siegeDefenders.ts:84-90; gra/src/game/siege.ts:279-291 |
| b | own | +25 pkt Prawa (35 w Brązie, 47 w Żelazie) | Stałe Prawo niezależne od wojska stacjonującego w mieście. | 4 | 3 | 4 | 2 | 4 | 4 | 45 | gra/data/society-params.json:837-843; gra/src/game/society-breakdown.ts:879-882 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 50:45.

## 4. Ranking

1. **a** — Milicja: 1 obrońca na mieszkańca przy ataku — wygrane: 1, suma: 50
2. **b** — +25 pkt Prawa (35 w Brązie, 47 w Żelazie) — wygrane: 0, suma: 45

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Milicja: 1 obrońca na mieszkańca przy ataku** — Przy każdym ataku na miasto staje milicja w liczbie mieszkańców (połowa wręcz, połowa dystans), odnawia się po 5 turach.
- Top2: **+25 pkt Prawa (35 w Brązie, 47 w Żelazie)** — Stałe Prawo niezależne od wojska stacjonującego w mieście.

## 6. Porównanie z dzisiejszym top3

- 1. „Stałe źródło Prawa” → ZACHOWANE (w nowym TOP 5)
- 2. „Poza łańcuchem administracji” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Przetrwa podbój” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Milicja: 1 obrońca na mieszkańca przy ataku

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Garnizon w mieście regionalnym, aby bronić miasta milicją (1 obrońca na mieszkańca).

## 8. Uwagi

Dzisiejszy top3 nie wspomina o Milicji (combat-params.json:51). Pozycja 2 („Poza łańcuchem”) to masło; pozycja 3 („Przetrwa podbój”) to korzyść zdobywcy, nie właściciela.
