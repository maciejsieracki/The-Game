# Turniej: Garncarstwo

Epoka: Kamień · Poziom: 2 · Koszt nauki: 40 · tech.json — wiersz odkrycia patrz `Technologia: "Garncarstwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Spichlerz: limit ludności miasta 5 → 8 | 5 | 4 | 4 | 2 | 4 | 5 | 52 | gra/data/econ-params.json:24; gra/data/econ-params.json:31; gra/src/game/economy.ts:1053; gra/data/buildings.json:458 |
| b | Spichlerz: +4 zadowolenia i +2 żywności | 3 | 1 | 2 | 2 | 4 | 5 | 33 | gra/data/buildings.json:458 |
| c | Garncarnia: wytwarza ceramikę (glina + drewno) | 3 | 4 | 5 | 5 | 3 | 3 | 50 | gra/src/game/converters.ts:85; gra/data/buildings.json:554 |
| d | Garncarnia: +10% żywności w mieście | 2 | 2 | 3 | 2 | 3 | 5 | 33 | gra/data/econ-params.json:299; gra/src/game/economy.ts:1008 |
| e | Cegielnia (od Brązu): +25% Pracy z terenu miasta | 4 | 2 | 4 | 2 | 2 | 5 | 39 | gra/data/econ-params.json:271; gra/src/game/economy.ts:863-866; gra/src/game/production.ts:966; gra/data/buildings.json:601 (pewność ŚREDNIA) |
| f | Cegielnia: cegła (2 glina + 1 drewno → 2 cegły) | 3 | 4 | 5 | 5 | 2 | 3 | 48 | gra/src/game/converters.ts:84; gra/data/tech.json:196; gra/src/game/research.ts:180 |
| g | Glinianka: +50 gliny na turę do magazynu państwa | 3 | 3 | 5 | 5 | 4 | 5 | 51 | gra/data/terrain-improvements.json:118; gra/data/terrain-improvements.json:128 |
| h | Warzelnia soli: +50 soli na turę | 2 | 3 | 5 | 5 | 3 | 5 | 46 | gra/data/terrain-improvements.json:251; gra/data/terrain-improvements.json:262 |
| i | Otwiera Wymianę, Pismo, Religię i Brązownictwo | 2 | 2 | 4 | 5 | 2 | 4 | 38 | gra/data/tech.json:124; gra/data/tech.json:196; gra/data/tech.json:210; gra/data/tech.json:166 |

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 52:33.
- a vs c → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:50.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 52:33.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 52:39.
- a vs f → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:48.
- a vs g → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 52:51.
- a vs h → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 52:46.
- a vs i → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 52:38.
- b vs c → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 50:33.
- b vs d → **b** — remis 33:33, rozstrzyga SKALA (3 vs 2).
- b vs e → **e** — przewaga w kryterium BRAK ZASTĘPNIKA (4 vs 2), suma ważona 39:33.
- b vs f → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 1), suma ważona 48:33.
- b vs g → **g** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 51:33.
- b vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:33.
- b vs i → **i** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 38:33.
- c vs d → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 50:33.
- c vs e → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 50:39.
- c vs f → **c** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 2), suma ważona 50:48.
- c vs g → **g** — przewaga w kryterium CZYTELNOŚĆ (5 vs 3), suma ważona 51:50.
- c vs h → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 50:46.
- c vs i → **c** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 50:38.
- d vs e → **e** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:33.
- d vs f → **f** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:33.
- d vs g → **g** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 51:33.
- d vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:33.
- d vs i → **i** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 38:33.
- e vs f → **f** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 48:39.
- e vs g → **g** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 51:39.
- e vs h → **h** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 46:39.
- e vs i → **e** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:38.
- f vs g → **g** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 51:48.
- f vs h → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 48:46.
- f vs i → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 48:38.
- g vs h → **g** — przewaga w kryterium SKALA (3 vs 2), suma ważona 51:46.
- g vs i → **g** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 51:38.
- h vs i → **h** — przewaga w kryterium NOWA MECHANIKA (3 vs 2), suma ważona 46:38.

## 3. Ranking

1. **a** — Spichlerz: limit ludności miasta 5 → 8 — wygrane: 8, suma: 52
2. **g** — Glinianka: +50 gliny na turę do magazynu państwa — wygrane: 7, suma: 51
3. **c** — Garncarnia: wytwarza ceramikę (glina + drewno) — wygrane: 6, suma: 50
4. **f** — Cegielnia: cegła (2 glina + 1 drewno → 2 cegły) — wygrane: 5, suma: 48
5. **h** — Warzelnia soli: +50 soli na turę — wygrane: 4, suma: 46
6. **e** — Cegielnia (od Brązu): +25% Pracy z terenu miasta — wygrane: 3, suma: 39
7. **i** — Otwiera Wymianę, Pismo, Religię i Brązownictwo — wygrane: 2, suma: 38
8. **b** — Spichlerz: +4 zadowolenia i +2 żywności — wygrane: 1, suma: 33
9. **d** — Garncarnia: +10% żywności w mieście — wygrane: 0, suma: 33

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Spichlerz: limit ludności miasta 5 → 8
- Top2: Glinianka: +50 gliny na turę do magazynu państwa
- Top3: Garncarnia: wytwarza ceramikę (glina + drewno)
- Top4: Cegielnia: cegła (2 glina + 1 drewno → 2 cegły)
- Top5: Warzelnia soli: +50 soli na turę

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Spichlerz (gdy masz ceramikę): kandydaci a(52), b(33) → wybrany **a** (najwyższa suma ważona).
- Zbuduj Garncarnię przy dostępie do gliny: kandydaci c(50), d(33) → wybrany **c** (najwyższa suma ważona).
- Zaplanuj Cegielnię (dostępna od epoki Brązu): kandydaci e(39), f(48) → wybrany **f** (najwyższa suma ważona).
- Postaw Gliniankę na złożu gliny: kandydaci g(51) → wybrany **g** (najwyższa suma ważona).
- Postaw Warzelnię soli na wybrzeżu lub złożu soli: kandydaci h(46) → wybrany **h** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci i(38) → wybrany **i** (najwyższa suma ważona).

Obecnie na karcie:

- [Możesz teraz] Sprawdź dostęp do surowca: cegła, glina, sol.
- [Najpierw spełnij] Zbuduj Spichlerz lub Garncarnia lub Cegielnia, jeśli spełniasz ich wymagania.
- [Najpierw spełnij] Przygotuj Glinianka, Warzelnia soli na odpowiednim złożu.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Spichlerz (gdy masz ceramikę), aby podnieść limit ludności miasta z 5 do 8.
- Postaw Gliniankę na złożu gliny, aby wydobywać 50 gliny na turę.
- Zbuduj Garncarnię przy dostępie do gliny, aby wytwarzać ceramikę potrzebną Spichlerzowi.
- Zaplanuj Cegielnię (dostępna od epoki Brązu), aby wytwarzać cegłę i otworzyć badanie Pisma.

## 6. Uwagi

Cegielnia ma epokaWejscia=2 (buildings.json:601) — production.ts:966 blokuje ją do epoki Brązu. „Odblokowuje surowiec: cegła, glina, sol" to pole wyłącznie opisowe (brak konsumenta w gra/src/game).
