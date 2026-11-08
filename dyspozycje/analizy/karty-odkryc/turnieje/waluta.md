# Turniej: Waluta

Epoka: Brąz · Poziom: 6 · Koszt nauki: 400 · tech.json — wiersz odkrycia patrz `Technologia: "Waluta"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Mennica: ×1,5 podatku (handlu) w każdym mieście | 5 | 5 | 5 | 5 | 3 | 5 | 61 | gra/data/econ-params.json:585-591; gra/src/game/economy.ts:952-955; gra/src/game/economy.ts:962-967; gra/src/game/economy.ts:644-653 |
| b | Kopalnia złota: +10 handlu i +1 złota na turę | 3 | 3 | 5 | 3 | 3 | 4 | 44 | gra/data/terrain-improvements.json:376; gra/data/terrain-improvements.json:385 |
| c | Mennica: +3 pieniądza (+2 na poziom) | 2 | 1 | 2 | 2 | 3 | 5 | 28 | gra/data/buildings.json:901 |
| d | Złoto jest warunkiem Mennicy (zużywa 1 złota/turę) | 3 | 2 | 5 | 5 | 2 | 3 | 42 | gra/src/game/building-resource-gate.ts:75-76; gra/src/game/zloto-access.ts:31; gra/src/game/turn-economy.ts:1879-1894 |
| e | Złoto w dyplomacji: 50 PN za sztukę | 2 | 2 | 3 | 5 | 2 | 4 | 36 | gra/data/econ-params.json:813 |

Liczba kandydatów: 5 (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak.

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 61:44.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 1), suma ważona 61:28.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:42.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:36.
- b vs c → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 2), suma ważona 44:28.
- b vs d → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 44:42.
- b vs e → **b** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 44:36.
- c vs d → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 42:28.
- c vs e → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 36:28.
- d vs e → **d** — przewaga w kryterium BRAK ZASTĘPNIKA (5 vs 3), suma ważona 42:36.

## 3. Ranking

1. **a** — Mennica: ×1,5 podatku (handlu) w każdym mieście — wygrane: 4, suma: 61
2. **b** — Kopalnia złota: +10 handlu i +1 złota na turę — wygrane: 3, suma: 44
3. **d** — Złoto jest warunkiem Mennicy (zużywa 1 złota/turę) — wygrane: 2, suma: 42
4. **e** — Złoto w dyplomacji: 50 PN za sztukę — wygrane: 1, suma: 36
5. **c** — Mennica: +3 pieniądza (+2 na poziom) — wygrane: 0, suma: 28

Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). FINALNA kolejność: a > b > d > e > c (Obrona: a > b > d > e > c).

Status: FINALNE (FC r1: trzeci turniej — zgodny z Obroną)

## 4. Wynik TOP 5 (FINALNY)

- Top1 (GŁÓWNA KORZYŚĆ): Mennica: ×1,5 podatku (handlu) w każdym mieście
- Top2: Kopalnia złota: +10 handlu i +1 złota na turę
- Top3: Złoto jest warunkiem Mennicy (zużywa 1 złota/turę)
- Top4: Złoto w dyplomacji: 50 PN za sztukę
- Top5: Mennica: +3 pieniądza (+2 na poziom)

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Mennicę w stolicy (z Targowiskiem i dostępem do złota): kandydaci a(61) → wybrany **a** (najwyższa suma ważona).
- Postaw Kopalnię złota na złożu: kandydaci b(44) → wybrany **b** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Mennica, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Kopalnia złota na odpowiednim złożu.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Mennicę w stolicy (z Targowiskiem i dostępem do złota), aby pomnożyć podatek wszystkich miast ×1,5 (pieniądz i nauka).
- Postaw Kopalnię złota na złożu, aby zdobyć złoto (+10 handlu) i uruchomić Mennicę.

## 6. Uwagi

Na karcie: „Mennica: pieniadz +2" (przyrost na poziom) — mnożnik ×1,5 nieobecny. Realny współczynnik: econ-params.json:585-591 (easy 1,62 / normal 1,50 / hard 1,38), liczony w economy.ts:952-955 na podatku miejskim PRZED podziałem suwakami (economy.ts:962-967) — mnoży więc pieniądz, naukę i luksus. Warunki: Waluta + Mennica w stolicy (jedna na państwo) + Targowisko + dostęp do Złota; zużywa 1 Złota/turę (zloto-access.ts:31, turn-economy.ts:1879-1894). Dochód z tras handlowych nie podlega mnożnikowi. civ-matrix meta_mnoznik_waluta (cityTradeMultiplier, mnoznikHandelPieniadzForCivByDifficulty) — brak wywołań w runtime (grep), martwy.
