# Turniej: Pismo

Epoka: Brąz · Poziom: 4 · Koszt nauki: 180 · tech.json — wiersz odkrycia patrz `Technologia: "Pismo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Biblioteka: +30% Nauki miasta | 4 | 3 | 4 | 2 | 4 | 5 | 46 | gra/data/econ-params.json:320; gra/src/game/economy.ts:979-982 |
| b | Biblioteka: +3 Nauki i +2 Kultury (rośnie z poziomem) | 3 | 2 | 3 | 2 | 4 | 5 | 38 | gra/data/buildings.json:744; gra/data/buildings.json:750 |
| c | Spichlerz Królewski: limit ludności 8 → 12 | 4 | 2 | 3 | 2 | 3 | 5 | 39 | gra/data/econ-params.json:38; gra/src/game/economy.ts:1053; gra/data/buildings.json:505 |
| d | Spichlerz Królewski: +3 żywności, +4 zadowolenia | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:505 |
| e | Cuda narodowe: Wiszące ogrody, Wielka stela | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:102-106; gra/data/wonders.json:123-127 |
| f | Otwiera Matematykę, Kodeks, Handel, Filozofię | 3 | 0 | 5 | 5 | 1 | 3 | 34 | gra/data/tech.json:252; gra/data/tech.json:280; gra/data/tech.json:266; gra/data/tech.json:379 (reguła R-K1: N=0, O≤1) |

Liczba kandydatów: 6 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 46:38.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 46:39.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 46:28.
- a vs e → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 46:37.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 46:34.
- b vs c → **c** — przewaga w kryterium SKALA (4 vs 3), suma ważona 39:38.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 38:28.
- b vs e → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 38:37.
- b vs f → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 38:34.
- c vs d → **c** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:28.
- c vs e → **c** — przewaga w kryterium SKALA (4 vs 3), suma ważona 39:37.
- c vs f → **c** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 39:34.
- d vs e → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:28.
- d vs f → **f** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 34:28.
- e vs f → **e** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:34.

## 3. Ranking

1. **a** — Biblioteka: +30% Nauki miasta — wygrane: 5, suma: 46
2. **c** — Spichlerz Królewski: limit ludności 8 → 12 — wygrane: 4, suma: 39
3. **b** — Biblioteka: +3 Nauki i +2 Kultury (rośnie z poziomem) — wygrane: 3, suma: 38
4. **e** — Cuda narodowe: Wiszące ogrody, Wielka stela — wygrane: 2, suma: 37
5. **f** — Otwiera Matematykę, Kodeks, Handel, Filozofię — wygrane: 1, suma: 34
6. **d** — Spichlerz Królewski: +3 żywności, +4 zadowolenia — wygrane: 0, suma: 28

Status: FINALNE (FC r1: zatwierdzone bez trzeciego turnieju — zgodność Operator/Evaluator ≥ 3/5, sporne pozycje rozstrzygnięte w Obronie)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Biblioteka: +30% Nauki miasta
- Top2: Spichlerz Królewski: limit ludności 8 → 12
- Top3: Biblioteka: +3 Nauki i +2 Kultury (rośnie z poziomem)
- Top4: Cuda narodowe: Wiszące ogrody, Wielka stela
- Top5: Otwiera Matematykę, Kodeks, Handel, Filozofię

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Bibliotekę: kandydaci a(46), b(38) → wybrany **a** (najwyższa suma ważona).
- Rozbuduj Spichlerz do Spichlerza Królewskiego: kandydaci c(39) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci f(34) → wybrany **f** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Spichlerz Królewski lub Biblioteka, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Bibliotekę, aby zwiększyć Naukę miasta o 30%.
- Rozbuduj Spichlerz do Spichlerza Królewskiego, aby podnieść limit ludności miasta z 8 do 12.
- Wybierz kolejne badanie, aby dojść do Matematyki, Kodeksu i Filozofii.

## 6. Uwagi

Badanie wymaga Cegielni w państwie (tech.json:196; research.ts:180), a Cegielnia jest dostępna od epoki Brązu.
