# Turniej: Cytadela (`fort`)

Kategoria: Obrona · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Inżynieria · definicja: `gra/data/buildings.json:1498` · dzisiejszy top3: `:1540`

Cena korzyści (nie jest kandydatem): budowa 70 Pracy, 50 drewno + 100 kamien, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +100% Obrony ponad Mury (razem +300%) | Cytadela stoi obok Murów i dokłada kolejne +100% obrony. | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/miasto-params.json:84; gra/src/game/city-defense.ts:60-75 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 1 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- brak (≤ 1 kandydat)

## 4. Ranking

1. **a** — +100% Obrony ponad Mury (razem +300%) — wygrane: 0, suma: 41

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+100% Obrony ponad Mury (razem +300%)** — Cytadela stoi obok Murów i dokłada kolejne +100% obrony.

## 6. Porównanie z dzisiejszym top3

- 1. „Dodatkowa obrona miasta” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga Murów” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Odblokowana przez Inżynierię” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Cytadelę, aby podnieść obronę miasta do +300%.

## 8. Uwagi

Flaga maFort nie jest czytana przez kod (cities.ts:828-842) — bez dodatkowego efektu. Pozycje 2–3 dzisiejszego top3 to warunek i wymaganie.
