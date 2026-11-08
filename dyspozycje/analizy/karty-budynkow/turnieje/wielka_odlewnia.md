# Turniej: Wielka odlewnia (`wielka_odlewnia`)

Kategoria: Produkcja · Epoka wejścia: epoka 4 (niedostępna) · maksPoziom: 1 · technologia: Obróbka żelaza · definicja: `gra/data/buildings.json:253` · dzisiejszy top3: `:290`

Cena korzyści (nie jest kandydatem): budowa 80 Pracy, 60 drewno + 70 cegla, utrzymanie 4 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| — | — | brak realnych efektów — budynek niedostępny | — | | | | | | | | |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 0 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- Cały budynek (stal, +18 Pracy, +3 pieniądza) — epokaWejscia=4 (PARKOWANE), production.ts:966 blokuje budynki z epoki wyższej niż epoka miasta — w grze z 3 epokami nie da się go zbudować. [gra/data/buildings.json:253; gra/src/game/production.ts:966; gra/src/game/converters.ts:100-102]

## 3. Pojedynki (każdy z każdym)

- brak (≤ 1 kandydat)

## 4. Ranking

—

## 5. TOP 5 (propozycja Operatora r1)

- NIE_USTALONO — budynek niedostępny

## 6. Porównanie z dzisiejszym top3

- 1. „Bardzo wysoka Praca” → USUNIĘTE — efekt martwy/nieprawdziwy
- 2. „Trzy metale naraz” → USUNIĘTE — efekt martwy/nieprawdziwy
- 3. „Wymaga dostępu do stali” → USUNIĘTE — efekt martwy/nieprawdziwy

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- NIE_USTALONO — budynek dziś niedostępny; sekcji nie pokazywać (karta do ukrycia).

## 8. Uwagi

Budynek niedostępny — karta do ukrycia (Q4). Odkrycie Obróbka żelaza nie powinno go pokazywać.
