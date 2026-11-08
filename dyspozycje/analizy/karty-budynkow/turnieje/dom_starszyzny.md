# Turniej: Dom Starszyzny (`dom_starszyzny`)

Kategoria: Administracja · Epoka wejścia: Kamień · maksPoziom: 1 · technologia: - · definicja: `gra/data/buildings.json:1790` · dzisiejszy top3: `:1831`

Cena korzyści (nie jest kandydatem): budowa 25 Pracy, 30 drewno, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +28 pkt Prawa w mieście regionalnym | Główne źródło Prawa miasta poza stolicą (+36 łatwy, +22 trudny). | 4 | 3 | 4 | 2 | 4 | 4 | 45 | gra/data/society-params.json:781-787; gra/src/game/society-breakdown.ts:838-841 |
| b | own | +1 Pracy, +1 pieniądza i +2 Kultury | Drobny dochód miasta. | 1 | 1 | 1 | 2 | 4 | 5 | 25 | gra/data/buildings.json:1790 |
| c | next (R-B1) | Rozbudowa do Dworu Zarządcy: 33 pkt Prawa | Po Kodeksie Dom Starszyzny rośnie do Dworu Zarządcy. | 3 | 0 | 3 | 2 | 1 | 4 | 25 | gra/data/buildings.json:1838; gra/data/society-params.json:788-794 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 45:25.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 45:25.
- b vs c → **c** — remis 25:25, rozstrzyga SKALA (3 vs 1).

## 4. Ranking

1. **a** — +28 pkt Prawa w mieście regionalnym — wygrane: 2, suma: 45
2. **c** — Rozbudowa do Dworu Zarządcy: 33 pkt Prawa — wygrane: 1, suma: 25
3. **b** — +1 Pracy, +1 pieniądza i +2 Kultury — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+28 pkt Prawa w mieście regionalnym** — Główne źródło Prawa miasta poza stolicą (+36 łatwy, +22 trudny).
- Top2: **Rozbudowa do Dworu Zarządcy: 33 pkt Prawa** — Po Kodeksie Dom Starszyzny rośnie do Dworu Zarządcy.
- Top3: **+1 Pracy, +1 pieniądza i +2 Kultury** — Drobny dochód miasta.

## 6. Porównanie z dzisiejszym top3

- 1. „Podstawa porządku prawnego” → ZACHOWANE (w nowym TOP 5)
- 2. „Niewielka produkcja” → ZACHOWANE (w nowym TOP 5)
- 3. „Początek łańcucha administracji” → ZACHOWANE (w nowym TOP 5)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Dom Starszyzny w mieście regionalnym, aby zapewnić miastu 28 pkt Prawa.
- Rozbuduj go do Dworu Zarządcy (Kodeks), aby podnieść Prawo miasta do 33 pkt.

## 8. Uwagi

Brak technologii — dostępny od startu, tylko w mieście regionalnym (lokalizacja „region”).
