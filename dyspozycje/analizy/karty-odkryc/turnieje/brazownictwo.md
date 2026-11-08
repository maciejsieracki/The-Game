# Turniej: Brązownictwo

Epoka: Kamień · Poziom: 3 · Koszt nauki: 180 · tech.json — wiersz odkrycia patrz `Technologia: "Brązownictwo"`.

## 1. Kandydaci (faza kandydatów)

| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |
|---|---|---|---|---|---|---|---|---|---|
| a | Awans do epoki Brązu: nowe budynki i wyższe ich poziomy | 5 | 5 | 5 | 5 | 4 | 3 | 61 | gra/data/tech.json:178; gra/src/game/playerState.ts:310-323; gra/src/game/production.ts:252-262; gra/src/game/production.ts:966 |
| b | Limit wodzów rośnie z 1 do 2 | 4 | 3 | 5 | 5 | 4 | 5 | 54 | gra/src/game/generals.ts:2-4 |
| c | Odlewnia brązu: wytwarza brąz (ruda + drewno + cyna) | 4 | 5 | 5 | 5 | 2 | 3 | 54 | gra/src/game/converters.ts:97; gra/data/buildings.json:156; gra/src/game/production.ts:1092 |
| d | Kopalnia miedzi: +20 rudy na turę, +5 handlu | 3 | 4 | 5 | 5 | 3 | 4 | 51 | gra/data/terrain-improvements.json:322; gra/data/terrain-improvements.json:331 |
| e | Kopalnia cyny: +20 rudy cyny na turę | 2 | 3 | 5 | 5 | 3 | 4 | 45 | gra/data/terrain-improvements.json:358; gra/data/terrain-improvements.json:367; gra/src/game/converters.ts:97 |
| f | Kuźnia brązu: +15% Pancerza jednostek w mieście | 4 | 4 | 4 | 3 | 3 | 5 | 49 | gra/data/buildings.json:108; gra/src/game/unit-building-bonuses.ts:15-22; gra/src/game/unit-building-bonuses.ts:170 |
| g | 20 jednostek z brązu, np. Włócznik 160 HP | 4 | 3 | 4 | 2 | 1 | 4 | 39 | gra/data/units.json:373; gra/data/units.json:3; gra/src/game/production.ts:1075; gra/src/game/production.ts:1092 |
| h | Wieża oblężnicza i Taran okuty | 2 | 2 | 3 | 1 | 1 | 3 | 25 | gra/data/units.json:3558; gra/data/units.json:3406 |
| i | Otwiera Wojskowość, Hutnictwo żelaza, Jeździectwo | 3 | 3 | 5 | 5 | 2 | 3 | 45 | gra/data/tech.json:238; gra/data/tech.json:336; gra/data/tech.json:224 |

S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).

## 2. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 61:54.
- a vs c → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 61:54.
- a vs d → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 61:51.
- a vs e → **a** — przewaga w kryterium SKALA (5 vs 2), suma ważona 61:45.
- a vs f → **a** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 61:49.
- a vs g → **a** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 61:39.
- a vs h → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 61:25.
- a vs i → **a** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 61:45.
- b vs c → **c** — remis 54:54, rozstrzyga NOWA MECHANIKA (5 vs 3).
- b vs d → **b** — przewaga w kryterium SKALA (4 vs 3), suma ważona 54:51.
- b vs e → **b** — przewaga w kryterium SKALA (4 vs 2), suma ważona 54:45.
- b vs f → **b** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 54:49.
- b vs g → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 54:39.
- b vs h → **b** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 54:25.
- b vs i → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 2), suma ważona 54:45.
- c vs d → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 4), suma ważona 54:51.
- c vs e → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 54:45.
- c vs f → **c** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 54:49.
- c vs g → **c** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 54:39.
- c vs h → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 2), suma ważona 54:25.
- c vs i → **c** — przewaga w kryterium NOWA MECHANIKA (5 vs 3), suma ważona 54:45.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 51:45.
- d vs f → **d** — przewaga w kryterium ZASIĘG (5 vs 3), suma ważona 51:49.
- d vs g → **d** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 51:39.
- d vs h → **d** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 51:25.
- d vs i → **d** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 51:45.
- e vs f → **f** — przewaga w kryterium SKALA (4 vs 2), suma ważona 49:45.
- e vs g → **e** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 45:39.
- e vs h → **e** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 45:25.
- e vs i → **i** — remis 45:45, rozstrzyga SKALA (3 vs 2).
- f vs g → **f** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 49:39.
- f vs h → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 2), suma ważona 49:25.
- f vs i → **f** — przewaga w kryterium NOWA MECHANIKA (4 vs 3), suma ważona 49:45.
- g vs h → **g** — przewaga w kryterium SKALA (4 vs 2), suma ważona 39:25.
- g vs i → **i** — przewaga w kryterium ZASIĘG (5 vs 2), suma ważona 45:39.
- h vs i → **i** — przewaga w kryterium ZASIĘG (5 vs 1), suma ważona 45:25.

## 3. Ranking

1. **a** — Awans do epoki Brązu: nowe budynki i wyższe ich poziomy — wygrane: 8, suma: 61
2. **c** — Odlewnia brązu: wytwarza brąz (ruda + drewno + cyna) — wygrane: 7, suma: 54
3. **b** — Limit wodzów rośnie z 1 do 2 — wygrane: 6, suma: 54
4. **d** — Kopalnia miedzi: +20 rudy na turę, +5 handlu — wygrane: 5, suma: 51
5. **f** — Kuźnia brązu: +15% Pancerza jednostek w mieście — wygrane: 4, suma: 49
6. **i** — Otwiera Wojskowość, Hutnictwo żelaza, Jeździectwo — wygrane: 3, suma: 45
7. **e** — Kopalnia cyny: +20 rudy cyny na turę — wygrane: 2, suma: 45
8. **g** — 20 jednostek z brązu, np. Włócznik 160 HP — wygrane: 1, suma: 39
9. **h** — Wieża oblężnicza i Taran okuty — wygrane: 0, suma: 25

## 4. Wynik TOP 5

- Top1 (GŁÓWNA KORZYŚĆ): Awans do epoki Brązu: nowe budynki i wyższe ich poziomy
- Top2: Odlewnia brązu: wytwarza brąz (ruda + drewno + cyna)
- Top3: Limit wodzów rośnie z 1 do 2
- Top4: Kopalnia miedzi: +20 rudy na turę, +5 handlu
- Top5: Kuźnia brązu: +15% Pancerza jednostek w mieście

## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)

- Zbuduj Odlewnię brązu: kandydaci c(54) → wybrany **c** (najwyższa suma ważona).
- Postaw Kopalnię miedzi na złożu: kandydaci d(51) → wybrany **d** (najwyższa suma ważona).
- Postaw Kopalnię cyny na złożu: kandydaci e(45) → wybrany **e** (najwyższa suma ważona).
- Zbuduj Kuźnię brązu: kandydaci f(49) → wybrany **f** (najwyższa suma ważona).
- Zbuduj Koszary (Wojskowość) i rekrutuj jednostki z brązu: kandydaci g(39) → wybrany **g** (najwyższa suma ważona).
- Wybierz kolejne badanie: kandydaci i(45) → wybrany **i** (najwyższa suma ważona).

Obecnie na karcie:

- [Najpierw spełnij] Zbuduj Kuźnia brązu lub Odlewnia brązu, jeśli spełniasz ich wymagania.
- [Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.
- [Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.

Propozycja:

- Zbuduj Odlewnię brązu, aby wytwarzać brąz — bez niego brak wojska epoki Brązu.
- Postaw Kopalnię miedzi na złożu, aby wydobywać 20 rudy miedzi na turę (do brązu).
- Zbuduj Kuźnię brązu, aby dać jednostkom +15% Pancerza.
- Wybierz kolejne badanie, aby dojść do Koszar i żelaza.

## 6. Uwagi

Karta nie pokazuje: awansu epoki, +1 wodza, Kopalni miedzi i cyny (terrain-improvements.json:322,358 mają tech=Brązownictwo, tech.json nie). Jednostki z brązu wymagają Koszar (Wojskowość) i zapasu brązu.
