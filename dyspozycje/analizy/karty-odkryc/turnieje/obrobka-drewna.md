# Turniej: Obróbka drewna

Epoka: Kamień · Poziom: 1 · Koszt nauki: 5 · tech.json — wiersz odkrycia patrz `Technologia: "Obróbka drewna"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Tartak: +50 drewna na turę do magazynu państwa | 4 | 4 | 5 | 5 | 5 | 5 | 59 | gra/data/terrain-improvements.json:194; gra/data/terrain-improvements.json:204 |
| b | Palisada: +100% Obrony obrońców miasta | 4 | 4 | 3 | 2 | 4 | 5 | 47 | gra/data/buildings.json:950; gra/data/miasto-params.json:94; gra/src/game/city-defense.ts:63-71 |
| c | Stolarnia: +5 Pracy w mieście (+3 na poziom, maks. 3) | 2 | 1 | 2 | 2 | 4 | 5 | 30 | gra/data/buildings.json:3 |
| d | Każda Stolarnia: +10% drewna w całym państwie | 3 | 3 | 4 | 5 | 3 | 4 | 46 | gra/data/econ-params.json:285; gra/src/game/turn-economy.ts:1536 |
| e | Taran: pierwsza machina oblężnicza (2800 HP) | 3 | 4 | 3 | 1 | 4 | 3 | 40 | gra/data/units.json:3330 |
| f | Posterunek (z Murarstwem): +50% Obrony, strefa 3 pól | 2 | 4 | 3 | 3 | 2 | 3 | 37 | gra/data/terrain-improvements.json:394; gra/src/game/improvement-tech.ts:46-47 |
| g | Otwiera drogę do Żeglugi i Brązownictwa | 2 | 0 | 3 | 5 | 1 | 4 | 28 | gra/data/tech.json:181; gra/data/tech.json:166 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 7 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 59:47.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 59:30.
- a vs d → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 3), suma ważona 59:46.
- a vs e → **a** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 59:40.
- a vs f → **a** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 2), suma ważona 59:37.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 59:28.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 47:30.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 47:46.
- b vs e → **b** — przewaga w kryterium SKALA (4 vs 3), suma ważona 47:40.
- b vs f → **b** — przewaga w kryterium SKALA (4 vs 2), suma ważona 47:37.
- b vs g → **b** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 47:28.
- c vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:30.
- c vs e → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 40:30.
- c vs f → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 37:30.
- c vs g → **c** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 30:28.
- d vs e → **d** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 46:40.
- d vs f → **d** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 46:37.
- d vs g → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 46:28.
- e vs f → **e** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 40:37.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 40:28.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 0), suma ważona 37:28.

## 3. Ranking

1. **a** — Tartak: +50 drewna na turę do magazynu państwa — wygrane: 6, suma: 59
2. **b** — Palisada: +100% Obrony obrońców miasta — wygrane: 5, suma: 47
3. **d** — Każda Stolarnia: +10% drewna w całym państwie — wygrane: 4, suma: 46
4. **e** — Taran: pierwsza machina oblężnicza (2800 HP) — wygrane: 3, suma: 40
5. **f** — Posterunek (z Murarstwem): +50% Obrony, strefa 3 pól — wygrane: 2, suma: 37
6. **c** — Stolarnia: +5 Pracy w mieście (+3 na poziom, maks. 3) — wygrane: 1, suma: 30
7. **g** — Otwiera drogę do Żeglugi i Brązownictwa — wygrane: 0, suma: 28

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Tartak: +50 drewna na turę do magazynu państwa
- Top2: Palisada: +100% Obrony obrońców miasta
- Top3: Każda Stolarnia: +10% drewna w całym państwie
- Top4: Taran: pierwsza machina oblężnicza (2800 HP)
- Top5: Posterunek (z Murarstwem): +50% Obrony, strefa 3 pól

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Postaw Tartak na polu lasu: kandydaci a(59) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Palisadę drewnianą: kandydaci b(47) → wybrany **b** (najwyższa suma ważona).
- Zbuduj Stolarnię: kandydaci c(30), d(46) → wybrany **d** (najwyższa suma ważona).
- Zrekrutuj Taran: kandydaci e(40) → wybrany **e** (najwyższa suma ważona).
- Postaw Posterunek na skraju granic (wymaga też Murarstwa/Obróbki drewna): kandydaci f(37) → wybrany **f** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci g(28) → wybrany **g** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: drewno.
- [Najpierw spełnij] Zbuduj Stolarnia lub Palisada drewniana, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Tartak, Posterunek (Strażnica) na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Postaw Tartak na polu lasu, aby zasilić magazyn państwa 50 drewna na turę (budowy i rekrutacja).
- Zbuduj Palisadę drewnianą, aby podwoić obronę miasta (+100% Obrony obrońców).
- Zbuduj Stolarnię, aby zwiększyć produkcję drewna całego państwa o 10%.
- Zrekrutuj Taran, aby móc oblegać i burzyć umocnienia wroga.

## 6. Uwagi

Taran (units.json:3330) jest na karcie, ale nie ma go w tech.json. Palisada nie ma efektu w „Zmiany ekonomiczne" (baza/przyrost = 0) — jej +100% Obrony jest niewidoczne. Posterunek wymaga też Murarstwa (improvement-tech.ts:46-47).
