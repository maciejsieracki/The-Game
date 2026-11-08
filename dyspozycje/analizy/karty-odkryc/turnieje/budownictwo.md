# Turniej: Budownictwo

Epoka: Brąz · Poziom: 6 · Koszt nauki: 340 · tech.json — wiersz odkrycia patrz `Technologia: "Budownictwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Mury: +200% Obrony obrońców miasta | 5 | 3 | 4 | 2 | 3 | 5 | 47 | gra/data/miasto-params.json:79; gra/src/game/city-defense.ts:67-68; gra/data/buildings.json:998 |
| b | Akwedukt: limit ludności miasta do 20 | 5 | 3 | 5 | 2 | 3 | 5 | 49 | gra/data/econ-params.json:45; gra/src/game/economy.ts:1053; gra/data/buildings.json:853 |
| c | Akwedukt: +4 zdrowia | 2 | 1 | 3 | 2 | 3 | 5 | 30 | gra/data/society-params.json:10; gra/src/game/turn-economy.ts:483 |
| d | Akwedukt: +2 zadowolenia (+1 na poziom) | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:853 |
| e | Mury są warunkiem Cytadeli i Baszty | 3 | 2 | 5 | 2 | 1 | 3 | 34 | gra/data/buildings.json:1498; gra/data/buildings.json:1547 |
| f | Cud narodowy: Dur-Sharrukin (Asyria) | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:417-421 |
| g | Otwiera Inżynierię i Drogi brukowane | 3 | 0 | 5 | 4 | 1 | 3 | 32 | gra/data/tech.json:351; gra/data/tech.json:407 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 7 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 4), suma ważona 49:47.
- a vs c → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 47:30.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 47:28.
- a vs e → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 47:34.
- a vs f → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 47:37.
- a vs g → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 47:32.
- b vs c → **b** — przewaga w kryterium SKALA (5 vs 2), suma ważona 49:30.
- b vs d → **b** — przewaga w kryterium SKALA (5 vs 2), suma ważona 49:28.
- b vs e → **b** — przewaga w kryterium SKALA (5 vs 3), suma ważona 49:34.
- b vs f → **b** — przewaga w kryterium SKALA (5 vs 3), suma ważona 49:37.
- b vs g → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 49:32.
- c vs d → **c** — przewaga w kryterium BRAK ZASTĘPNIKA (3 vs 2), suma ważona 30:28.
- c vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 34:30.
- c vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:30.
- c vs g → **g** — przewaga w kryterium ZASIĘG (4 vs 2), suma ważona 32:30.
- d vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 34:28.
- d vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:28.
- d vs g → **g** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 32:28.
- e vs f → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 37:34.
- e vs g → **e** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 34:32.
- f vs g → **f** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:32.

## 3. Ranking

1. **b** — Akwedukt: limit ludności miasta do 20 — wygrane: 6, suma: 49
2. **a** — Mury: +200% Obrony obrońców miasta — wygrane: 5, suma: 47
3. **f** — Cud narodowy: Dur-Sharrukin (Asyria) — wygrane: 4, suma: 37
4. **e** — Mury są warunkiem Cytadeli i Baszty — wygrane: 3, suma: 34
5. **g** — Otwiera Inżynierię i Drogi brukowane — wygrane: 2, suma: 32
6. **c** — Akwedukt: +4 zdrowia — wygrane: 1, suma: 30
7. **d** — Akwedukt: +2 zadowolenia (+1 na poziom) — wygrane: 0, suma: 28

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Akwedukt: limit ludności miasta do 20
- Top2: Mury: +200% Obrony obrońców miasta
- Top3: Cud narodowy: Dur-Sharrukin (Asyria)
- Top4: Mury są warunkiem Cytadeli i Baszty
- Top5: Otwiera Inżynierię i Drogi brukowane

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Mury: kandydaci a(47) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Akwedukt (obok Studni): kandydaci b(49) → wybrany **b** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci g(32) → wybrany **g** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Akwedukt lub Mury, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Akwedukt (obok Studni), aby podnieść limit ludności miasta do 20.
- Zbuduj Mury, aby potroić obronę miasta (+200% Obrony).
- Wybierz kolejne badanie, aby dojść do Cytadeli i Dróg brukowanych.

## 6. Uwagi

Badanie wymaga dostępu do cegły (tech.json:294 — pole opisowe). Mury zastępują bonus Palisady (city-defense.ts:67-72).
