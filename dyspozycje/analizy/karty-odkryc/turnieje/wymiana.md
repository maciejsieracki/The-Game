# Turniej: Wymiana

Epoka: Kamień · Poziom: 2 · Koszt nauki: 64 · tech.json — wiersz odkrycia patrz `Technologia: "Wymiana"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Otwiera handel: bez Wymiany żadnych tras handlowych | 5 | 5 | 5 | 5 | 4 | 4 | 62 | gra/src/game/trade-routes.ts:1086-1093 |
| b | Targowisko: +5 pieniądza (+3 na poziom, maks. 3) | 3 | 1 | 2 | 2 | 4 | 5 | 33 | gra/data/buildings.json:303 |
| c | Targowisko: +50% dochodu z tras handlowych miasta | 4 | 3 | 4 | 2 | 3 | 5 | 44 | gra/data/econ-params.json:278; gra/src/main.ts:4192-4196 |
| d | Targowisko: +1 trasa handlowa i premia 5% trasy | 3 | 3 | 3 | 2 | 3 | 4 | 38 | gra/src/game/trade-routes.ts:908-921; gra/src/game/trade-routes.ts:1659 |
| e | Targowisko: +2 zdrowia miasta | 1 | 1 | 2 | 2 | 4 | 5 | 27 | gra/data/society-params.json:24; gra/src/game/turn-economy.ts:485 |
| f | Targowisko jest warunkiem Mennicy i Emporionu | 2 | 2 | 4 | 2 | 1 | 3 | 29 | gra/src/game/building-resource-gate.ts:117-119; gra/data/buildings.json:1095 |
| g | Cud narodowy: Pałac Weiyang (Chiny, z Murarstwem) | 3 | 3 | 4 | 2 | 2 | 3 | 37 | gra/data/wonders.json:468-472 |
| h | Otwiera Pismo i Matematykę | 3 | 0 | 4 | 5 | 1 | 3 | 32 | gra/data/tech.json:196; gra/data/tech.json:252 (reguła R-K1: N=0, O≤1) |

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 62:33.
- a vs c → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 62:44.
- a vs d → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 62:38.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 62:27.
- a vs f → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 62:29.
- a vs g → **a** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 62:37.
- a vs h → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 0), suma ważona 62:32.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 44:33.
- b vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:33.
- b vs e → **b** — przewaga w kryterium SKALA (3 vs 1), suma ważona 33:27.
- b vs f → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:29.
- b vs g → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:33.
- b vs h → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 33:32.
- c vs d → **c** — przewaga w kryterium SKALA (4 vs 3), suma ważona 44:38.
- c vs e → **c** — przewaga w kryterium SKALA (4 vs 1), suma ważona 44:27.
- c vs f → **c** — przewaga w kryterium SKALA (4 vs 2), suma ważona 44:29.
- c vs g → **c** — przewaga w kryterium SKALA (4 vs 3), suma ważona 44:37.
- c vs h → **c** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 44:32.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 38:27.
- d vs f → **d** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 38:29.
- d vs g → **d** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 2), suma ważona 38:37.
- d vs h → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 38:32.
- e vs f → **f** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 29:27.
- e vs g → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 37:27.
- e vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 32:27.
- f vs g → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 37:29.
- f vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 32:29.
- g vs h → **g** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 37:32.

## 3. Ranking

1. **a** — Otwiera handel: bez Wymiany żadnych tras handlowych — wygrane: 7, suma: 62
2. **c** — Targowisko: +50% dochodu z tras handlowych miasta — wygrane: 6, suma: 44
3. **d** — Targowisko: +1 trasa handlowa i premia 5% trasy — wygrane: 5, suma: 38
4. **g** — Cud narodowy: Pałac Weiyang (Chiny, z Murarstwem) — wygrane: 4, suma: 37
5. **b** — Targowisko: +5 pieniądza (+3 na poziom, maks. 3) — wygrane: 3, suma: 33
6. **h** — Otwiera Pismo i Matematykę — wygrane: 2, suma: 32
7. **f** — Targowisko jest warunkiem Mennicy i Emporionu — wygrane: 1, suma: 29
8. **e** — Targowisko: +2 zdrowia miasta — wygrane: 0, suma: 27

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: a > c > d > g > b (Obrona: a > c > d > g > b).

Status: FINALNE (FC r1: trzeci turniej — zgodny z Obroną)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Otwiera handel: bez Wymiany żadnych tras handlowych
- Top2: Targowisko: +50% dochodu z tras handlowych miasta
- Top3: Targowisko: +1 trasa handlowa i premia 5% trasy
- Top4: Cud narodowy: Pałac Weiyang (Chiny, z Murarstwem)
- Top5: Targowisko: +5 pieniądza (+3 na poziom, maks. 3)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Wyznacz trasy handlowe między miastami: kandydaci a(62) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Targowisko: kandydaci b(33), c(44), d(38) → wybrany **c** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci h(32) → wybrany **h** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Targowisko (Rynek), jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Wyznacz trasy handlowe między miastami, aby zyskać nowe źródło dochodu — bez Wymiany handel szlakowy jest zablokowany.
- Zbuduj Targowisko, aby zwiększyć dochód z tras handlowych miasta o 50%.
- Wybierz kolejne badanie, aby dojść do Pisma i Matematyki.

## 6. Uwagi

Najważniejszy efekt (bramka całego handlu szlakowego, trade-routes.ts:1086-1093) NIE jest pokazany na karcie. Na karcie: „Targowisko (Rynek): pieniadz +3" — przyrost na poziom zamiast bazy +5.
