# Turniej: Palisada drewniana (`palisada`)

Kategoria: Obrona · Epoka wejścia: Kamień · maksPoziom: 1 · technologia: Obróbka drewna · definicja: `gra/data/buildings.json:950` · dzisiejszy top3: `:986`

Cena korzyści (nie jest kandydatem): budowa 22 Pracy, 60 drewno, utrzymanie 1 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +100% Obrony obrońców miasta | Pierwsza fortyfikacja: podwaja obronę jednostek broniących miasta. | 4 | 4 | 3 | 2 | 4 | 5 | 47 | gra/data/miasto-params.json:94; gra/src/game/city-defense.ts:60-75 |
| b | own | Miasto trzeba oblegać — wróg nie wejdzie z marszu | Miasto z umocnieniem przechodzi w tryb oblężenia; pustego miasta nie da się zająć jednym ruchem. | 4 | 4 | 3 | 2 | 4 | 3 | 45 | gra/data/buildings.json:992; gra/src/game/production.ts:854-861; gra/src/game/mapSiegeDetect.ts:50-62; gra/src/game/city-hex-movement.ts:55-62 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 2 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium CZYTELNOŚĆ (5 vs 3), suma ważona 47:45.

## 4. Ranking

1. **a** — +100% Obrony obrońców miasta — wygrane: 1, suma: 47
2. **b** — Miasto trzeba oblegać — wróg nie wejdzie z marszu — wygrane: 0, suma: 45

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+100% Obrony obrońców miasta** — Pierwsza fortyfikacja: podwaja obronę jednostek broniących miasta.
- Top2: **Miasto trzeba oblegać — wróg nie wejdzie z marszu** — Miasto z umocnieniem przechodzi w tryb oblężenia; pustego miasta nie da się zająć jednym ruchem.

## 6. Porównanie z dzisiejszym top3

- 1. „Bonus obrony miasta” → ZACHOWANE (w nowym TOP 5)
- 2. „Zastępowana przez Mury” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera Obróbkę drewna” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Miasto trzeba oblegać — wróg nie wejdzie z marszu

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Palisadę drewnianą, aby podwoić obronę miasta (+100% Obrony).

## 8. Uwagi

Pozycja 2 dzisiejszego top3 („Zastępowana przez Mury”) to strata, nie korzyść; pozycja 3 to wymaganie technologii.
